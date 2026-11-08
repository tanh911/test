// 🏢 buildings.ts — nhà phố Đức module lặp (Protocol mục 4.4)
// 3 style: altbau (kem, lan can mái phẳng), backstein (gạch đỏ, mái đôi),
// neubau (xám nhạt, mái phẳng). Cửa sổ = quad vertex color nhô 2 cm khỏi tường,
// fake AO bằng vertex color tối ở chân tường. KHÔNG texture, KHÔNG PBR.
// Ngân sách: ≤600 tris/module. Material 'building' dùng DoubleSide + vertexColors.
import type { GameMap, MapBuilding, MapRoad } from './mapLoader';
import { roadById, roadFullWidth } from './mapLoader';
import { palette } from '../art/palette';
import type { Quad } from './roadMesh';
import { pointWithNormalAtS, polylineLength } from './roadMesh';

type RGB = [number, number, number];

export interface ColoredQuad {
  quad: Quad;
  colors: RGB[]; // 4 đỉnh a,b,c,d
}

function hexRGB(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function darken(c: RGB, f: number): RGB {
  return [c[0] * f, c[1] * f, c[2] * f];
}

// Biến thể màu facade theo seed (mục 4.4: biến thể theo seed, không PBR)
const FACADE_VARIANTS: Record<string, string[]> = {
  altbau: ['#e8dfc8', '#e3d6b8', '#e8e2d4', '#d9cdb0'],
  backstein: ['#b5654a', '#a35a42', '#c06e50'],
  neubau: ['#b8b4aa', '#c9c4b8', '#cdc9bf']
};
const WINDOW = hexRGB(palette.window);
const ROOF = hexRGB(palette.roofTile);
const ROOF_GREY = hexRGB('#6b6b66');

const BUILDING_DEPTH = 12; // chiều sâu nhà (m)
const FLOOR_H = 3.2;       // cao 1 tầng (m)
const WIN_W = 1.1;
const WIN_H = 1.5;
const WIN_BOTTOM = 1.0;    // đáy cửa sổ so với sàn tầng
const AO_DARK = 0.82;      // hệ số AO chân tường

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sinh quads cho 1 building. Hệ trục: s dọc road, off = khoảng cách từ tim đường
 * (nhân side). normal mặt đứng dọc s = ±n_raw; mặt hông = ±t̂; tất cả đẩy vào
 * 'building' material (DoubleSide) nên sai winding chỉ ảnh hưởng lighting, không mất mặt.
 */
export function buildingQuads(map: GameMap, b: MapBuilding): ColoredQuad[] {
  const road: MapRoad | undefined = roadById(map, b.roadId);
  if (!road) return [];
  const side = b.side === 'right' ? 1 : -1;
  const half = roadFullWidth(road) / 2;
  const frontOff = half + 2.5; // mặt tiền sát mép vỉa hè ngoài
  const len = polylineLength(road.points);
  const s0 = Math.max(0, b.s);
  const s1 = Math.min(len, b.s + b.length);
  if (s1 - s0 < 6) return [];

  const rand = rng(b.seed);
  const variants = FACADE_VARIANTS[b.style] || FACADE_VARIANTS.altbau;
  const wall = hexRGB(variants[Math.floor(rand() * variants.length)]);
  const floors = Math.max(2, Math.min(6, b.floors));
  const height = floors * FLOOR_H + 0.6;
  const isBrick = b.style === 'backstein';
  const baseWall = isBrick ? hexRGB(wallRGBHex(b)) : wall;
  const roofC = b.style === 'neubau' ? ROOF_GREY : ROOF;

  const out: ColoredQuad[] = [];

  // điểm (s, y, off) — off dương = phía side của road
  const P = (s: number, y: number, off: number): [number, number, number] => {
    const p = pointWithNormalAtS(road.points, s);
    return [p.x + p.nx * side * off, y, p.z + p.nz * side * off];
  };

  // Mặt đứng dọc s, normal = nSign·n_raw (nSign=−side: hướng về road)
  const facade = (sa: number, sb: number, y0: number, y1: number, off: number, c: RGB, ao = true, nSign = -side): ColoredQuad => {
    const [q0, q1] = nSign > 0 ? [sa, sb] : [sb, sa];
    const cb = ao ? darken(c, AO_DARK) : c;
    return {
      quad: { a: P(q0, y0, off), b: P(q1, y0, off), c: P(q1, y1, off), d: P(q0, y1, off) },
      colors: ao ? [cb, cb, c, c] : [c, c, c, c]
    };
  };
  // Mặt hông tại s, normal = faceT·t̂ (faceT=−1: đầu s0, +1: đầu s1)
  // as-is (offA→offB) cho normal −side·t̂ → flip khi faceT === side
  const sideWall = (s: number, offA: number, offB: number, y0: number, y1: number, c: RGB, faceT: 1 | -1, ao = true): ColoredQuad => {
    const flip = faceT === side;
    const [oA, oB] = flip ? [offB, offA] : [offA, offB];
    const cb = ao ? darken(c, AO_DARK) : c;
    return {
      quad: { a: P(s, y0, oA), b: P(s, y0, oB), c: P(s, y1, oB), d: P(s, y1, oA) },
      colors: ao ? [cb, cb, c, c] : [c, c, c, c]
    };
  };
  // Mái ngang (normal +Y, side-aware)
  const roofFlat = (sa: number, sb: number, y: number, offA: number, offB: number, c: RGB): ColoredQuad => {
    const [oA, oB] = side === 1 ? [offB, offA] : [offA, offB];
    return {
      quad: { a: P(sa, y, oA), b: P(sb, y, oA), c: P(sb, y, oB), d: P(sa, y, oB) },
      colors: [c, c, c, c]
    };
  };

  const backOff = frontOff + BUILDING_DEPTH;
  const midOff = frontOff + BUILDING_DEPTH / 2;

  // ── Mặt tiền + cửa sổ + (không brick) dải cửa hàng tầng trệt ──
  out.push(facade(s0, s1, 0, height, frontOff, baseWall));
  const usable = s1 - s0;
  const cols = Math.max(1, Math.floor((usable - 1.6) / 2.2));
  const colStep = usable / cols;
  for (let f = 0; f < floors; f++) {
    const y0 = f * FLOOR_H + WIN_BOTTOM;
    const y1 = y0 + WIN_H;
    for (let c = 0; c < cols; c++) {
      const wx0 = s0 + c * colStep + (colStep - WIN_W) / 2;
      const wx1 = wx0 + WIN_W;
      out.push(facade(wx0, wx1, y0, y1, frontOff - 0.02, WINDOW, false));
    }
  }
  if (!isBrick) {
    out.push(facade(s0 + 0.8, s1 - 0.8, 0, 2.4, frontOff - 0.02, darken(baseWall, 0.55), false));
  }

  // ── 2 hông + mặt sau ──
  out.push(sideWall(s0, frontOff, backOff, 0, height, baseWall, -1));
  out.push(sideWall(s1, frontOff, backOff, 0, height, baseWall, 1));
  out.push(facade(s0, s1, 0, height, backOff, baseWall, true, side));

  // ── Mái ──
  if (isBrick) {
    // mái đôi: 2 mặt nghiêng lên đỉnh giữa + 2 hồi tam giác
    const ridge = height + 3;
    out.push({
      quad: { a: P(s0, height, frontOff), b: P(s1, height, frontOff), c: P(s1, ridge, midOff), d: P(s0, ridge, midOff) },
      colors: [roofC, roofC, roofC, roofC]
    });
    out.push({
      quad: { a: P(s0, height, backOff), b: P(s1, height, backOff), c: P(s1, ridge, midOff), d: P(s0, ridge, midOff) },
      colors: [roofC, roofC, roofC, roofC]
    });
    // hồi tam giác 2 đầu (quad đỉnh suy biến ở ridge)
    out.push(sideWall(s0, frontOff, midOff, height, ridge, baseWall, -1, false));
    out.push(sideWall(s0, midOff, backOff, height, ridge, baseWall, -1, false));
    out.push(sideWall(s1, frontOff, midOff, height, ridge, baseWall, 1, false));
    out.push(sideWall(s1, midOff, backOff, height, ridge, baseWall, 1, false));
  } else {
    // mái phẳng + lan can 0.6 m
    out.push(roofFlat(s0, s1, height, frontOff, backOff, roofC));
    const par = darken(baseWall, 0.9);
    out.push(facade(s0, s1, height, height + 0.6, frontOff, par, false));
    out.push(facade(s0, s1, height, height + 0.6, backOff, par, false, side));
    out.push(sideWall(s0, frontOff, backOff, height, height + 0.6, par, -1, false));
    out.push(sideWall(s1, frontOff, backOff, height, height + 0.6, par, 1, false));
  }

  return out;
}

// gạch đỏ cố định cho backstein (không nhân variant hex khác)
function wallRGBHex(_b: MapBuilding): string {
  return palette.wallBrick;
}

/** Tất cả buildings trong map → ColoredQuad cho ChunkBuilder */
export function allBuildingQuads(map: GameMap): ColoredQuad[] {
  const out: ColoredQuad[] = [];
  for (const b of map.buildings as MapBuilding[]) {
    out.push(...buildingQuads(map, b));
  }
  return out;
}
