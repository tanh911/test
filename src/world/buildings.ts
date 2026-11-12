// 🏢 buildings.ts — nhà phố Đức module lặp (Protocol mục 4.4)
// 3 style: altbau (kem, lan can mái phẳng), backstein (gạch đỏ, mái đôi),
// neubau (xám nhạt, mái phẳng). Cửa sổ = quad vertex color nhô 2 cm khỏi tường,
// fake AO bằng vertex color tối ở chân tường. KHÔNG texture, KHÔNG PBR.
// Ngân sách: ≤600 tris/module. Material 'building' dùng DoubleSide + vertexColors.
import type { GameMap, MapBuilding, MapRoad } from './mapLoader';
import { roadById, roadFullWidth, roadPointAt, roadLength } from './mapLoader';
import { palette } from '../art/palette';
import type { Quad } from './roadMesh';


type RGB = [number, number, number];

export interface ColoredQuad {
  quad: Quad;
  colors: RGB[]; // 4 đỉnh a,b,c,d
}

/** Building mở rộng: hàng sau (courtyard) có depthOff (lùi từ vị trí mặc định) và
 *  plain=true (không cửa sổ/cửa hàng — tiết kiệm quad, nhìn từ trên cao chỉ thấy mái).
 *  depth: chiều sâu tùy biến (mặc định BUILDING_DEPTH) — nhà fill nông chen vào block chật. */
export type FillBuilding = MapBuilding & { depthOff?: number; plain?: boolean; depth?: number };

/** Lưới chiếm chỗ 2D (ô 2 m) với tag người chiếm — chặn mọi building mới đè lên
 *  đường/vỉa hè/nhà có sẵn. Hai chế độ:
 *  - fullCell (mặc định): claim nguyên ô — OVER-claim ≤ 1 ô, dùng cho corridor (an toàn).
 *  - centerClaim: chỉ claim ô có TÂM nằm trong rect — sát footprint ±½ ô,
 *    dùng cho building-vs-building (2 nhà trên đường cong không tự chặn nhau oan).
 *  freeFor cho phép "miễn" 1 loại tag (VD: nhà mặt tiền của road r được lấp đè lên
 *  corridor CỦA CHÍNH r, nhưng không đè corridor đường khác). */
class OccGrid {
  private cells = new Map<string, string[]>();
  constructor(private cell = 2, private centerClaim = false) {}

  private keys(minX: number, minZ: number, maxX: number, maxZ: number): string[] {
    const c = this.cell;
    const out: string[] = [];
    for (let cx = Math.floor(minX / c); cx <= Math.floor(maxX / c); cx++) {
      for (let cz = Math.floor(minZ / c); cz <= Math.floor(maxZ / c); cz++) {
        if (this.centerClaim) {
          const mx = cx * c + c / 2, mz = cz * c + c / 2;
          if (mx < minX || mx > maxX || mz < minZ || mz > maxZ) continue;
        }
        out.push(`${cx},${cz}`);
      }
    }
    return out;
  }

  claimRect(minX: number, minZ: number, maxX: number, maxZ: number, tag: string): void {
    for (const k of this.keys(minX, minZ, maxX, maxZ)) {
      const tags = this.cells.get(k);
      if (tags) {
        if (!tags.includes(tag)) tags.push(tag);
      } else {
        this.cells.set(k, [tag]);
      }
    }
  }

  /** Trống cho tag exempt? — ô bị chiếm chỉ "đếm" nếu có tag KHÁC exempt. */
  isFreeFor(minX: number, minZ: number, maxX: number, maxZ: number, exempt?: string): boolean {
    for (const k of this.keys(minX, minZ, maxX, maxZ)) {
      const tags = this.cells.get(k);
      if (!tags) continue;
      if (exempt === undefined || tags.some(t => t !== exempt)) return false;
    }
    return true;
  }

}

function hexRGB(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  // three r152+: vertex color là KHÔNG GIAN LINEAR — hex là sRGB. Không convert thì
  // mọi màu bị wash out (0.91 linear encode lại thành ~0.96 sRGB → kem nhạt bệt).
  const srgb = (c8: number) => {
    const v = c8 / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return [srgb((n >> 16) & 255), srgb((n >> 8) & 255), srgb(n & 255)];
}
function darken(c: RGB, f: number): RGB {
  return [c[0] * f, c[1] * f, c[2] * f];
}
function lighten(c: RGB, f: number): RGB {
  return [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)];
}

// Biến thể màu facade theo seed (mục 4.4: biến thể theo seed, không PBR) — mở rộng dải
// sắc độ München: kem altbau, gạch backstein ấm, neubau xám ấm/lạnh xen kẽ.
const FACADE_VARIANTS: Record<string, string[]> = {
  altbau: ['#e8dfc8', '#e3d6b8', '#e8e2d4', '#d9cdb0', '#dcc9a8', '#e5d9c0'],
  backstein: ['#b5654a', '#a35a42', '#c06e50', '#9c5138'],
  neubau: ['#b8b4aa', '#c9c4b8', '#cdc9bf', '#a8a49c', '#c2beb2']
};
const ROOF = hexRGB(palette.roofTile);
const ROOF_GREY = hexRGB('#6b6b66');

// Kính cửa sổ phản chiếu trời: đỉnh sáng, đáy tối — quad gradient 2 màu vertex
const GLASS_HIGH_TINTS = ['#a9cde3', '#9cc0d8', '#b5d1e2', '#a2b8c8'];
const GLASS_LOW_TINTS = ['#31495c', '#2c4354', '#3a5266', '#263c4c'];
const FRAME_CREAM = hexRGB('#e9e5da'); // khung cửa sổ altbau trắng kem
const SILL_STONE = hexRGB('#d9d3c6');  // bậu cửa đá sáng

const BUILDING_DEPTH = 9;  // chiều sâu nhà (m) - giảm nhẹ để tránh các nhà ở ngã rẽ cắt sâu vào nhau
const FLOOR_H = 2.75;      // cao 1 tầng (m) - tỉ lệ Altstadt München chuẩn xác với lòng đường
const WIN_W = 1.25;
const WIN_H = 1.45;
const WIN_BOTTOM = 0.85;   // đáy cửa sổ so với sàn tầng
const AO_DARK = 0.74;      // hệ số AO chân tường — đậm hơn để nhà "đứng" trên đất

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
export function buildingQuads(map: GameMap, b: FillBuilding): ColoredQuad[] {
  const road: MapRoad | undefined = roadById(map, b.roadId);
  if (!road) return [];
  const side = b.side === 'right' ? 1 : -1;
  const half = roadFullWidth(road) / 2;
  // depthOff > 0 = hàng sau trong block (courtyard); 0 = hàng mặt tiền sát vỉa hè
  const frontOff = half + 2.0 + (b.depthOff ?? 0);
  const plain = !!b.plain; // hàng sau: tường trơn, không cửa sổ
  const len = roadLength(road);
  const s0 = Math.max(0, b.s);
  const s1 = Math.min(len, b.s + b.length);
  if (s1 - s0 < 6) return [];

  const rand = rng(b.seed);
  const variants = FACADE_VARIANTS[b.style] || FACADE_VARIANTS.altbau;
  const wall = hexRGB(variants[Math.floor(rand() * variants.length)]);
  const floors = Math.max(2, Math.min(6, b.floors));
  // Jitter nhẹ cao độ mái theo seed để triệt tiêu Z-fighting khi các khối nhà liền kề cắt nhau
  const heightJitter = (((b.seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.5;
  const height = floors * FLOOR_H + 0.6 + heightJitter;
  const isBrick = b.style === 'backstein';
  const baseWall = isBrick ? hexRGB(wallRGBHex(b)) : wall;
  const roofC = b.style === 'neubau' ? ROOF_GREY : ROOF;

  const out: ColoredQuad[] = [];

  // điểm (s, y, off) — off dương = phía side của road
  const P = (s: number, y: number, off: number): [number, number, number] => {
    const p = roadPointAt(road, s);
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

  const backOff = frontOff + (b.depth ?? BUILDING_DEPTH);
  const midOff = frontOff + (b.depth ?? BUILDING_DEPTH) / 2;

  // ── Mặt tiền + cửa sổ khung trắng + kính phản chiếu + bậu đá + dải tầng ──
  out.push(facade(s0, s1, 0, height, frontOff, baseWall));

  // kính mỗi building chọn tint riêng theo seed — đỉnh sáng (trời), đáy tối (phố)
  const glassHigh = hexRGB(GLASS_HIGH_TINTS[Math.floor(rand() * GLASS_HIGH_TINTS.length)]);
  const glassLow = hexRGB(GLASS_LOW_TINTS[Math.floor(rand() * GLASS_LOW_TINTS.length)]);
  const windowGlass = (sa: number, sb: number, y0: number, y1: number, off: number): ColoredQuad => {
    const [q0, q1] = -side > 0 ? [sa, sb] : [sb, sa];
    return {
      quad: { a: P(q0, y0, off), b: P(q1, y0, off), c: P(q1, y1, off), d: P(q0, y1, off) },
      colors: [glassLow, glassLow, glassHigh, glassHigh]
    };
  };

  const usable = s1 - s0;
  if (!plain) {
    const cols = Math.max(1, Math.floor((usable - 1.2) / 2.05));
    const colStep = usable / cols;
    // tầng trệt kính lớn kiểu cửa hàng (altbau/neubau) — tầng 1 trở lên mới có cửa sổ
    const fStart = isBrick ? 0 : 1;
    // dải phân tách tầng mảnh — tạo nhịp ngang facade
    for (let f = fStart + 1; f < floors; f++) {
      out.push(facade(s0 + 0.15, s1 - 0.15, f * FLOOR_H - 0.16, f * FLOOR_H - 0.02, frontOff - 0.015, darken(baseWall, 0.86), false));
    }
    for (let f = fStart; f < floors; f++) {
      const y0 = f * FLOOR_H + WIN_BOTTOM;
      const y1 = y0 + WIN_H;
      for (let c = 0; c < cols; c++) {
        const wx0 = s0 + c * colStep + (colStep - WIN_W) / 2;
        const wx1 = wx0 + WIN_W;
        // 1. khung trắng kem nhô 1.2 cm quanh kính
        out.push(facade(wx0 - 0.07, wx1 + 0.07, y0 - 0.07, y1 + 0.07, frontOff - 0.012, FRAME_CREAM, false));
        // 2. kính trời gradient (nhô 2.5 cm)
        out.push(windowGlass(wx0, wx1, y0, y1, frontOff - 0.025));
        // 3. bậu cửa đá sáng nhô 3.5 cm — bắt nắng, làm kính "nằm trong" tường
        out.push(facade(wx0 - 0.05, wx1 + 0.05, y0 - 0.05, y0 - 0.005, frontOff - 0.035, SILL_STONE, false));
      }
    }
    if (!isBrick) {
      // tầng trệt: dãy ô kính cửa hàng có TRỤ đá ở giữa — hết dải xanh liền khối
      const shopStep = 2.6;
      const shopCols = Math.max(1, Math.floor((usable - 1.4) / shopStep));
      for (let c = 0; c < shopCols; c++) {
        const gx0 = s0 + 0.6 + c * shopStep;
        const gx1 = Math.min(s1 - 0.6, gx0 + shopStep - 0.8); // chừa 0.8 m trụ đá
        if (gx1 - gx0 < 0.7) break;
        out.push(facade(gx0, gx1, 0.45, 2.3, frontOff - 0.025, glassLow, false));
      }
      // bệ đá-plinth dưới cửa hàng + chỉ stucco sáng chạy ngang phía trên
      out.push(facade(s0 + 0.4, s1 - 0.4, 0, 0.45, frontOff - 0.03, darken(baseWall, 0.72), false));
      out.push(facade(s0 + 0.4, s1 - 0.4, 2.3, 2.58, frontOff - 0.035, lighten(baseWall, 1.08), false));
    }
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

    // ── Cornice altbau: chỉ đá sáng chạy ngang dưới lan can — điểm nhấn skyline ──
    if (b.style === 'altbau' && !plain) {
      const cor = lighten(baseWall, 1.1);
      out.push(facade(s0, s1, height - 0.24, height + 0.02, frontOff - 0.05, cor, false));
      out.push(facade(s0, s1, height - 0.24, height + 0.02, backOff + 0.05, cor, false, side));
      out.push(sideWall(s0, frontOff - 0.05, backOff + 0.05, height - 0.24, height + 0.02, cor, -1, false));
      out.push(sideWall(s1, frontOff - 0.05, backOff + 0.05, height - 0.24, height + 0.02, cor, 1, false));
    }

    // ── Ống khói gác mái — phố München thiếu ống khói là mất hồn ──
    if (!plain) {
      const chimneys = floors >= 4 ? 2 : 1;
      const cCol = darken(baseWall, 0.62);
      for (let ci = 0; ci < chimneys; ci++) {
        const cw = 0.5 + rand() * 0.18;
        const chH = 1.0 + rand() * 0.55;
        const cs = s0 + usable * (ci === 0 ? 0.2 + rand() * 0.14 : 0.66 + rand() * 0.14);
        const co = midOff + (rand() - 0.5) * 1.6;
        const o0 = Math.max(frontOff + 0.5, co - cw / 2);
        const o1 = Math.min(backOff - 0.5, o0 + cw);
        out.push(sideWall(cs, o0, o1, height, height + chH, cCol, -1, false));
        out.push(sideWall(cs, o0, o1, height, height + chH, cCol, 1, false));
        out.push(facade(cs - cw / 2, cs + cw / 2, height, height + chH, o0, cCol, false));
        out.push(facade(cs - cw / 2, cs + cw / 2, height, height + chH, o1, cCol, false, side));
        out.push(roofFlat(cs - cw / 2, cs + cw / 2, height + chH, o0, o1, darken(cCol, 0.72)));
      }
    }
  }

  return out;
}

// gạch đỏ cố định cho backstein (không nhân variant hex khác)
function wallRGBHex(_b: MapBuilding): string {
  return palette.wallBrick;
}

// ── Lấp đầy lòng block (courtyard rows) ──────────────────────────────
// Munich Altstadt: các block sâu 50-80 m, chỉ hàng mặt tiền (9 m) thì từ trên cao
// lòng block trống trơn. Sinh thêm ≤2 hàng nhà phía sau mỗi nhà mặt tiền, cách
// nhau 6 m sân trong. Occupancy grid pre-populate toàn bộ hành lang đường
// (half + vỉa hè 2.5 m) + nhà mặt tiền → hàng mới không bao giờ đè đường/nhà.
const ROW_GAP = 4;        // sân trong giữa 2 hàng (m) — block Altstadt hẹp (28-33 m), gap 6 làm rớt phần lớn block
const MAX_ROWS = 2;       // số hàng sau mỗi nhà mặt tiền

export interface BlockFillRow {
  roadId: string;
  side: 'left' | 'right';
  s: number;
  length: number;
  floors: number;
  style: 'altbau' | 'backstein' | 'neubau';
  seed: number;
  depthOff: number;
  plain?: boolean; // true = hàng sân trong (tường trơn); false/undefined = mặt tiền có cửa sổ
  depth?: number;  // chiều sâu tùy biến (m) — nhà fill nông chen block chật
}

/** AABB thế giới của building (sampling 3 cột s × 2 mép off — chịu cả road cong) */
const SWEEP_STEP = 3; // bước quét dải claim — ôm theo đường cong, không tràn ngược vào road

/** Chuỗi dải ô 3 m phủ footprint building (quét theo s mỗi 3 m — footprint trên
 *  đường cong được chia nhỏ, không bị AABB lớn tràn ngược vào hành lang đường).
 *  Export cho test đơn vị đối chiếu ở mức strip. depth mặc định BUILDING_DEPTH. */
export function buildingStrips(map: GameMap, b: { roadId: string; side: 'left' | 'right'; s: number; length: number; depthOff: number; depth?: number }): Array<[number, number, number, number]> | null {
  const road = roadById(map, b.roadId);
  if (!road) return null;
  const side = b.side === 'right' ? 1 : -1;
  const half = roadFullWidth(road) / 2;
  const frontOff = half + 2.0 + b.depthOff;
  const backOff = frontOff + (b.depth ?? BUILDING_DEPTH);
  const s0 = Math.max(0, b.s);
  const s1 = Math.min(roadLength(road), b.s + b.length);
  if (s1 - s0 < 6) return null;
  const strips: Array<[number, number, number, number]> = [];
  for (let s = s0; s < s1 - 1e-6; s += SWEEP_STEP) {
    const e = Math.min(s1, s + SWEEP_STEP);
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (const ss of [s, e]) {
      const p = roadPointAt(road, ss);
      for (const off of [frontOff, backOff]) {
        const x = p.x + p.nx * side * off;
        const z = p.z + p.nz * side * off;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }
    }
    strips.push([minX, minZ, maxX, maxZ]);
  }
  return strips.length ? strips : null;
}

export interface BlockFillPlan {
  rows: BlockFillRow[];
  stats: { front: number; gapFilled: number; rowsAdded: number; rejected: number };
}

/** hash string → uint32 (seed deterministic cho gap fill theo roadId+side+s) */
function hashStr(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const GAP_MIN_FILL = 4;      // gap dọc phố ≥ 4 m mới lấp (nhỏ hơn là khe cửa/khoảng sân chủ đích)
const GAP_MAX_SEG = 28;      // 1 building fill tối đa 28 m (đỡ monoton)
const GAP_EDGE_MARGIN = 6;   // không xây sát miệng ngã tư (đầu/cuối road ±6 m)
const GAP_SEG_RETREAT = 0.8; // lùi mỗi đầu segment — tránh chạm strip nhà liền kề (TOL 0.3 + dư)
const STRIP_TOL = 0.3;       // 2 strip cách nhau < 0.3 m coi như chạm (cho phép liền kề sát)
const CORNER_CLEAR = 0.5;    // góc building cách swath asphalt tối thiểu 0.5 m
const MAX_FACADE_TURN = 0.52; // ~30° — nhà quét theo road cong hơn thế là tường quạt/mái gãy

/** Nhà nằm trên đoạn road CONG QUÁ 30° thì bỏ: geometry quét theo curve làm tường
 *  kính quạt tròn, mái đôi gãy đôi như giấy gập (bug chụp ảnh r286). Road cong nhẹ
 *  (<30°) vẫn quét theo — trông tự nhiên như phố Đức thật. */
function buildingTooCurved(map: GameMap, b: { roadId: string; s: number; length: number }): boolean {
  const road = roadById(map, b.roadId);
  if (!road) return false;
  const s0 = Math.max(0, b.s);
  const s1 = Math.min(roadLength(road), b.s + b.length);
  if (s1 - s0 < 6) return false;
  const h0 = roadPointAt(road, s0).heading;
  let maxDelta = 0;
  for (let s = s0; s <= s1 + 1e-6; s += 2) {
    const ss = Math.min(s1, s);
    const h = roadPointAt(road, ss).heading;
    let d = Math.abs(h - h0);
    if (d > Math.PI) d = Math.PI * 2 - d;
    if (d > maxDelta) maxDelta = d;
  }
  return maxDelta > MAX_FACADE_TURN;
}

/** Segment đường precompute — bbox precheck trước khi quét point-to-OBB cho nhanh */
interface RoadSegs {
  half: number;
  minX: number; minZ: number; maxX: number; maxZ: number;
  ax: number[]; az: number[]; dx: number[]; dz: number[]; l2: number[];
}
function buildRoadSegs(map: GameMap): RoadSegs[] {
  const out: RoadSegs[] = [];
  for (const road of map.roads as MapRoad[]) {
    const pts = road.points;
    const segs: RoadSegs = {
      half: roadFullWidth(road) / 2,
      minX: Infinity, minZ: Infinity, maxX: -Infinity, maxZ: -Infinity,
      ax: [], az: [], dx: [], dz: [], l2: []
    };
    for (const [x, z] of pts) {
      if (x < segs.minX) segs.minX = x; if (x > segs.maxX) segs.maxX = x;
      if (z < segs.minZ) segs.minZ = z; if (z > segs.maxZ) segs.maxZ = z;
    }
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], az = pts[i - 1][1];
      const dx = pts[i][0] - ax, dz = pts[i][1] - az;
      segs.ax.push(ax); segs.az.push(az); segs.dx.push(dx); segs.dz.push(dz);
      segs.l2.push(dx * dx + dz * dz || 1);
    }
    if (segs.ax.length) out.push(segs);
  }
  return out;
}

/** Khoảng cách từ điểm tới SWATH chữ nhật của 1 road (segment quét rộng half) —
 *  chuẩn point-to-OBB: điểm bên cạnh end-cap KHÔNG bị tính là trong asphalt. */
function rectDistToRoadSegs(x: number, z: number, segs: RoadSegs): number {
  // bbox precheck (nới rộng theo nửa bề rộng mặt đường + margin an toàn)
  const m = segs.half + CORNER_CLEAR + 4;
  if (x < segs.minX - m || x > segs.maxX + m || z < segs.minZ - m || z > segs.maxZ + m) return Infinity;
  let best = Infinity;
  for (let i = 0; i < segs.ax.length; i++) {
    const ax = segs.ax[i], az = segs.az[i];
    const dx = segs.dx[i], dz = segs.dz[i], l2 = segs.l2[i];
    const tRaw = ((x - ax) * dx + (z - az) * dz) / l2;
    const t = Math.max(0, Math.min(1, tRaw));
    const px = ax + t * dx, pz = az + t * dz;
    const perp = Math.hypot(x - px, z - pz);
    const endX = ax + dx, endZ = az + dz;
    const axOver = tRaw < 0 ? Math.hypot(x - ax, z - az) - perp : (tRaw > 1 ? Math.hypot(x - endX, z - endZ) - perp : 0);
    const d = Math.hypot(Math.max(0, axOver), Math.max(0, perp - segs.half));
    if (d < best) best = d;
  }
  return best;
}

/** 2 strip AABB chạm nhau? (coi khoảng hở < STRIP_TOL là chạm) */
function stripsTouch(a: [number, number, number, number], b: [number, number, number, number]): boolean {
  return a[0] < b[2] - STRIP_TOL && b[0] < a[2] - STRIP_TOL && a[1] < b[3] - STRIP_TOL && b[1] < a[3] - STRIP_TOL;
}

/** Segs mặt nước (Spree/Spreekanal) — dùng chung máy rectDistToRoadSegs (swatch = width/2) */
function buildWaterSegs(map: GameMap): RoadSegs[] {
  const out: RoadSegs[] = [];
  for (const w of map.waters ?? []) {
    const pts = w.points;
    const segs: RoadSegs = {
      half: w.width / 2,
      minX: Infinity, minZ: Infinity, maxX: -Infinity, maxZ: -Infinity,
      ax: [], az: [], dx: [], dz: [], l2: []
    };
    for (const [x, z] of pts) {
      if (x < segs.minX) segs.minX = x; if (x > segs.maxX) segs.maxX = x;
      if (z < segs.minZ) segs.minZ = z; if (z > segs.maxZ) segs.maxZ = z;
    }
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], az = pts[i - 1][1];
      const dx = pts[i][0] - ax, dz = pts[i][1] - az;
      segs.ax.push(ax); segs.az.push(az); segs.dx.push(dx); segs.dz.push(dz);
      segs.l2.push(dx * dx + dz * dz || 1);
    }
    if (segs.ax.length) out.push(segs);
  }
  return out;
}

/** Building có đâm vào LÒNG đường không? — sample DÀY dọc footprint (bước 1.5 m
 *  theo s × 1.5 m theo chiều sâu): check 4 góc strip AABB không đủ vì nhà đứng
 *  chéo qua road khác thì góc AABB có thể cách road > 0.5 m trong khi thân nhà
 *  cắm thẳng vào lòng đường (bug chụp ảnh: mép ngã tư). waterSegs: nhà rơi vào
 *  sông (nước cách mép nhà < 1 m) cũng loại. */
function buildingClashesRoad(
  map: GameMap,
  b: { roadId: string; side: 'left' | 'right'; s: number; length: number; depthOff?: number; depth?: number },
  roadSegs: RoadSegs[],
  waterSegs: RoadSegs[] = []
): boolean {
  const road = roadById(map, b.roadId);
  if (!road) return false;
  const side = b.side === 'right' ? 1 : -1;
  const half = roadFullWidth(road) / 2;
  const frontOff = half + 2.0 + (b.depthOff ?? 0);
  const backOff = frontOff + (b.depth ?? BUILDING_DEPTH);
  const s0 = Math.max(0, b.s);
  const s1 = Math.min(roadLength(road), b.s + b.length);
  if (s1 - s0 < 1) return false;
  for (let s = s0; ; s += 1.5) {
    const ss = Math.min(s1, s);
    const p = roadPointAt(road, ss);
    for (let off = frontOff; ; off += 1.5) {
      const o = Math.min(backOff, off);
      const x = p.x + p.nx * side * o;
      const z = p.z + p.nz * side * o;
      for (const segs of roadSegs) {
        if (rectDistToRoadSegs(x, z, segs) < CORNER_CLEAR) return true;
      }
      for (const segs of waterSegs) {
        if (rectDistToRoadSegs(x, z, segs) < 1.0) return true;
      }
      if (o >= backOff) break;
    }
    if (ss >= s1) break;
  }
  return false;
}

/** Lập kế hoạch lấp phố — deterministic theo seed, export cho test đơn vị.
 *  Ưu tiên 1: lấp gap DỌC theo đường (mặt phố Altstadt bị đứt quãng — phủ chỉ 69%).
 *  Ưu tiên 2: hàng courtyard sau lưng mặt tiền cho block đủ rộng.
 *  Chống đè: corridorGrid (lưới đường over-claim) + stripsIndex (AABB chính xác
 *  từng nhà, không granularity) + check swath góc building (chặn cả kink của
 *  chính đường nó — frontOff quanh góc gấp có thể đâm vào asphalt). */
let cachedPlanSrc: GameMap | null = null;
let cachedPlan: BlockFillPlan | null = null;

export function planCityBlockFill(map: GameMap): BlockFillPlan {
  if (cachedPlan && cachedPlanSrc === map) return cachedPlan; // buildingRects + allBuildingQuads dùng chung 1 lần tính
  const corridorGrid = new OccGrid(2);
  const stripsIndex: Array<[number, number, number, number]> = [];

  // 1. Pre-populate lưới đường: hành lang road + vỉa hè (half + 2.5 m) theo dải ôm đoạn 10 m.
  //    KHÔNG dùng ô vuông quanh điểm sample: đường rộng vuông AABB vươn (half+2.5)·√2,
  //    nuốt hết khu fill của ngõ hẹp lân cận. tag corridor:<roadId> — nhà mặt tiền của
  //    CHÍNH road này được miễn, road khác/twin carriageway vẫn bị chặn.
  for (const road of map.roads as MapRoad[]) {
    const half = roadFullWidth(road) / 2;
    const r = half + 2.5;
    const L = roadLength(road);
    for (let s = 0; s < L; s += 10) {
      const e = Math.min(L, s + 10);
      const pa = roadPointAt(road, s);
      const pb = roadPointAt(road, e);
      const xs = [pa.x - pa.nx * r, pa.x + pa.nx * r, pb.x - pb.nx * r, pb.x + pb.nx * r];
      const zs = [pa.z - pa.nz * r, pa.z + pa.nz * r, pb.z - pb.nz * r, pb.z + pb.nz * r];
      corridorGrid.claimRect(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs), `corridor:${road.id}`);
    }
  }
  // 2. Index nhà mặt tiền hiện có (strip AABB chính xác)
  for (const b of map.buildings as MapBuilding[]) {
    const strips = buildingStrips(map, { ...b, depthOff: 0 });
    if (strips) stripsIndex.push(...strips);
  }

  /** Duyệt candidate: corridor (exempt chính nó) + không chạm strip nào + mép đủ xa asphalt.
   *  Mép TRONG (frontOff side) check 3 điểm/strip (đầu, giữa, cuối) — trên đường cong
   *  chord nối 2 góc cắt sâu hơn cung, chỉ check góc là lọt kink. */
  const roadSegs = buildRoadSegs(map);
  const acceptCandidate = (cand: BlockFillRow, ownRoadId: string, exemptOwnCorridor: boolean): boolean => {
    const strips = buildingStrips(map, cand);
    if (!strips) return false;
    const exempt = exemptOwnCorridor ? `corridor:${ownRoadId}` : undefined;
    for (const [a, b2, c, d] of strips) {
      if (!corridorGrid.isFreeFor(a, b2, c, d, exempt)) return false;
    }
    for (const st of strips) {
      for (const ex of stripsIndex) {
        if (stripsTouch(st, ex)) return false;
      }
    }
    const half = roadFullWidth(roadById(map, cand.roadId) ?? (map.roads[0] as MapRoad)) / 2;
    const innerOff = half + 2 + cand.depthOff;
    const outerOff = innerOff + BUILDING_DEPTH;
    const side = cand.side === 'right' ? 1 : -1;
    const road = roadById(map, cand.roadId)!;
    const s0 = Math.max(0, cand.s);
    const s1 = Math.min(roadLength(road), cand.s + cand.length);
    for (let i = 0; i < strips.length; i++) {
      const [a, b2, c, d] = strips[i];
      const sa = Math.min(s1, s0 + (i + 1) * SWEEP_STEP);
      const sb = Math.max(s0, sa - SWEEP_STEP);
      const pMidS = (sa + sb) / 2;
      const pMid = roadPointAt(road, pMidS);
      const pts: Array<[number, number]> = [
        [a, b2], [c, d], [a, d], [c, b2],
        // mid mép trong + mid mép ngoài
        [pMid.x + pMid.nx * side * innerOff, pMid.z + pMid.nz * side * innerOff],
        [pMid.x + pMid.nx * side * outerOff, pMid.z + pMid.nz * side * outerOff]
      ];
      for (const [x, z] of pts) {
        for (const segs of roadSegs) {
          if (rectDistToRoadSegs(x, z, segs) < CORNER_CLEAR) return false;
        }
      }
    }
    stripsIndex.push(...strips);
    return true;
  };

  const rows: BlockFillRow[] = [];
  let rejected = 0;

  // 3. Lấp gap dọc theo đường — nhà mặt tiền có cửa sổ (plain=false)
  const sides: Array<'left' | 'right'> = ['left', 'right'];
  for (const road of map.roads as MapRoad[]) {
    const L = roadLength(road);
    if (L < 14) continue;
    for (const side of sides) {
      const segs = (map.buildings as MapBuilding[])
        .filter(b => b.roadId === road.id && b.side === side)
        .map(b => ({ s0: Math.max(0, b.s), s1: Math.min(L, b.s + b.length) }))
        .sort((a, b) => a.s0 - b.s0);
      // merge các đoạn liền kề
      const merged: Array<{ s0: number; s1: number }> = [];
      for (const r of segs) {
        const last = merged[merged.length - 1];
        if (last && r.s0 <= last.s1 + 0.5) last.s1 = Math.max(last.s1, r.s1);
        else merged.push({ ...r });
      }
      // các khoảng trống trong [6, L-6]
      let prev = 0;
      const gaps: Array<[number, number]> = [];
      for (const r of merged) {
        if (r.s0 > prev) gaps.push([prev, r.s0]);
        prev = Math.max(prev, r.s1);
      }
      if (L - prev > 0) gaps.push([prev, L]);
      for (const [g0, g1] of gaps) {
        const a = Math.max(g0, GAP_EDGE_MARGIN) + GAP_SEG_RETREAT;
        const b2 = Math.min(g1, L - GAP_EDGE_MARGIN) - GAP_SEG_RETREAT;
        if (b2 - a < GAP_MIN_FILL) continue;
        // chia đoạn ≤ GAP_MAX_SEG, cách nhau GAP_SEG_RETREAT
        let s = a;
        while (b2 - s >= GAP_MIN_FILL) {
          const segLen = Math.min(GAP_MAX_SEG, b2 - s);
          const s0 = s, s1 = s + segLen;
          s = s1 + GAP_SEG_RETREAT;
          const seed = hashStr(`${road.id}|${side}|${s0.toFixed(1)}`);
          const rand = rng(seed);
          const cand: BlockFillRow = {
            roadId: road.id, side, s: s0, length: s1 - s0,
            floors: 3 + Math.floor(rand() * 3), // 3-5 tầng
            style: rand() < 0.8 ? 'altbau' : 'neubau',
            seed, depthOff: 0
          };
          if (!acceptCandidate(cand, road.id, true)) {
            // block chật: thử nhà wing nông 5 m trước khi bỏ gap này
            const shallow = { ...cand, depth: 5 };
            if (!acceptCandidate(shallow, road.id, true)) { rejected++; continue; }
            rows.push(shallow);
            continue;
          }
          rows.push(cand);
        }
      }
    }
  }
  const gapFilled = rows.length;

  // 4. Hàng courtyard phía sau — chỉ vào được block đủ rộng
  for (const b of map.buildings as MapBuilding[]) {
    if (!roadById(map, b.roadId)) continue;
    let depthOff = BUILDING_DEPTH + ROW_GAP;
    for (let k = 0; k < MAX_ROWS; k++) {
      const rand = rng((b.seed * 3 + 7919 * (k + 1) + 17) >>> 0);
      const cand: BlockFillRow = {
        roadId: b.roadId,
        side: b.side,
        s: b.s,
        length: b.length,
        floors: 2 + Math.floor(rand() * 3), // sân trong thấp hơn mặt tiền 1-2 tầng
        style: rand() < 0.65 ? b.style : 'neubau',
        seed: (b.seed * 3 + 7919 * (k + 1) + 17) >>> 0,
        depthOff,
        plain: true
      };
      if (!acceptCandidate(cand, b.roadId, false)) {
        rejected++;
        break; // hàng này chạm chỗ đã chiếm → hàng sau càng không lọt
      }
      rows.push(cand);
      depthOff += BUILDING_DEPTH + ROW_GAP;
    }
  }

  const result: BlockFillPlan = { rows, stats: { front: map.buildings.length, gapFilled, rowsAdded: rows.length - gapFilled, rejected } };
  cachedPlanSrc = map;
  cachedPlan = result;
  return result;
}

/** Tất cả buildings trong map → ColoredQuad cho ChunkBuilder (gồm gap-fill + hàng courtyard) */
export function allBuildingQuads(map: GameMap): ColoredQuad[] {
  const out: ColoredQuad[] = [];
  const roadSegs = buildRoadSegs(map);
  const waterSegs = buildWaterSegs(map);
  for (const b of map.buildings as MapBuilding[]) {
    // Sample dày footprint: nhà đâm vào lòng đường (nhất là mép ngã tư/road chéo) thì bỏ
    if (buildingClashesRoad(map, b, roadSegs, waterSegs)) continue;
    // Nhà trên road cong quá 30° bị xoắn tường/mái → bỏ
    if (buildingTooCurved(map, b)) continue;
    out.push(...buildingQuads(map, b));
  }
  const plan = planCityBlockFill(map);
  for (const row of plan.rows) {
    if (buildingClashesRoad(map, row, roadSegs, waterSegs)) continue;
    if (buildingTooCurved(map, row)) continue;
    out.push(...buildingQuads(map, row));
  }
  return out;
}
