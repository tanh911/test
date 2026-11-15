// 🌍 world builder tổng hợp — Protocol Prompt 2-4: đường + giao lộ + vạch + vỉa hè + nhà + props
import * as THREE from 'three';
import type { GameMap, MapIntersection } from './mapLoader';
import { loadGameMap, nodeById, roadLength, roadCurve } from './mapLoader';
import type { MapRoad } from './mapLoader';
import { palette } from '../art/palette';
import { buildingStrips } from './buildings';
import { ChunkBuilder } from './chunkBuilder';
import { roadRibbonQuads, buildJunctionMesh, roadsAtNode, roadHalfWidth, junctionHalfExtent, roadSkipZones, ribbonSkipZones, roundaboutIslandQuads, junctionBackgroundQuads } from './roadMesh';
import { roadMarkingQuads } from './roadMarkings';
import { sidewalkBoxes, sidewalkCornerPads } from './sidewalk';
import { placeSigns } from './trafficSigns';
import { placeTrafficLights, applyLightVisuals, TrafficLightController } from './trafficLights';
import { allBuildingQuads } from './buildings';
import { placeProps, type PropsResult } from './props';
import { PedestrianController } from './pedestrianController';
import type { Quad } from './roadMesh';

const MAT_LOOKUP: Record<string, string> = {
  road: 'asphalt',
  road_worn: 'asphaltWorn',
  white: 'lineWhite',
  sidewalk: 'sidewalk'
};

export interface WorldHandle {
  /** dữ liệu quad per-cell — chunkManager build mesh lazy theo camera */
  chunkData: ChunkBuilder;
  /** materials cho chunkManager */
  materials: Record<string, THREE.Material>;
  /** object phụ (biển/đèn) gắn theo cell — chunkManager add/remove theo camera */
  extras: Map<string, THREE.Object3D[]>;
  controllers: TrafficLightController[];
  pedestrians: PedestrianController | null;
  stats: { cells: number; quads: number };
  update: (dt: number) => void;
  dispose: () => void;
}

function pushQuads(cb: ChunkBuilder, quads: Quad[], material: Parameters<ChunkBuilder['addQuad']>[1]): void {
  for (const q of quads) cb.addQuad(q, material);
}

/** Ribbon mặt nước mượt: nội suy Catmull-Rom 4 m/step, mỗi bước 1 quad vuông góc
 *  tangent — cùng pattern winding với roadRibbonQuads (nhìn từ +Y thấy mặt trên). */

/** Kè đá Kaimauer: tường đứng dọc 2 mép nước (±halfWidth) từ topY xuống bottomY */
function waterWallQuads(points: [number, number][], halfWidth: number, topY: number, bottomY: number): Quad[] {
  if (points.length < 2) return [];
  const samples = polySamples(points, 4);
  const quads: Quad[] = [];
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1], cur = samples[i];
    for (const s of [1, -1]) {
      const ax = prev.x + prev.nx * s * halfWidth, az = prev.z + prev.nz * s * halfWidth;
      const bx = cur.x + cur.nx * s * halfWidth, bz = cur.z + cur.nz * s * halfWidth;
      quads.push({ a: [ax, topY, az], b: [ax, bottomY, az], c: [bx, bottomY, bz], d: [bx, topY, bz] });
    }
  }
  return quads;
}

/** Lan can + thành cầu: đoạn road vượt NƯỚC (điểm nằm trong polygon nước) —
 *  thành cầu đứng (y 0→-1.6) ở 2 mép + tay vịn ngang (y=1.05) + rail giữa (0.55) */
function bridgeDecorQuads(road: MapRoad, waters: Array<{ points: [number, number][]; width: number }>): Quad[] {
  const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
  const curve = roadCurve(road);
  const n = curve.pts.length;
  const inWater: boolean[] = [];
  for (const cp of curve.pts) {
    let hit = false;
    for (const w of waters) {
      if (distToWaterCenterline(cp.x, cp.z, w.points) < w.width / 2 + 2) { hit = true; break; }
    }
    inWater.push(hit);
  }
  // ranges liên tiếp trong nước (mở rộng 1 sample mỗi đầu)
  const quads: Quad[] = [];
  let i = 0;
  while (i < n) {
    if (!inWater[i]) { i++; continue; }
    let j = i;
    while (j < n && inWater[j]) j++;
    const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, j);
    for (let k = i0; k < i1; k++) {
      const a = curve.pts[k], b = curve.pts[k + 1];
      for (const s of [1, -1]) {
        const off = half + 0.15;
        const ax = a.x + a.nx * s * off, az = a.z + a.nz * s * off;
        const bx = b.x + b.nx * s * off, bz = b.z + b.nz * s * off;
        // thành cầu đứng (che hở giữa mặt cầu y=0 và nước y=-1.5)
        quads.push({ a: [ax, 0.02, az], b: [ax, -1.6, az], c: [bx, -1.6, bz], d: [bx, 0.02, bz] });
        // tay vịn trên (y≈1.05) + rail giữa (y≈0.55): thanh ngang mỏng
        for (const ry of [1.05, 0.55]) {
          quads.push({ a: [ax, ry + 0.05, az], b: [ax, ry - 0.05, az], c: [bx, ry - 0.05, bz], d: [bx, ry + 0.05, bz] });
        }
      }
    }
    i = j;
  }
  return quads;
}

function distToWaterCenterline(px: number, pz: number, pts: Array<[number, number]>): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const vx = pts[i][0] - pts[i - 1][0], vz = pts[i][1] - pts[i - 1][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((px - pts[i - 1][0]) * vx + (pz - pts[i - 1][1]) * vz) / l2));
    best = Math.min(best, Math.hypot(px - (pts[i - 1][0] + vx * t), pz - (pts[i - 1][1] + vz * t)));
  }
  return best;
}


/** Sample đều bước `step` m dọc POLYLINE GỐC (không CatmullRom → không drift khỏi
 *  dữ liệu OSM — feedback: nước trôi khỏi chỗ road băng qua). Pháp tuyến theo
 *  segment chứa sample. Dùng chung cho ribbon/wall/hole/containment nước. */
function distToPolylinePts(px: number, pz: number, pts: Array<[number, number]>): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const vx = pts[i][0] - pts[i - 1][0], vz = pts[i][1] - pts[i - 1][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((px - pts[i - 1][0]) * vx + (pz - pts[i - 1][1]) * vz) / l2));
    best = Math.min(best, Math.hypot(px - (pts[i - 1][0] + vx * t), pz - (pts[i - 1][1] + vz * t)));
  }
  return best;
}

function polySamples(points: [number, number][], step = 4): Array<{ x: number; z: number; nx: number; nz: number }> {
  if (points.length < 2) return [];
  const cum: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  const total = cum[cum.length - 1];
  const n = Math.max(2, Math.ceil(total / step));
  const out: Array<{ x: number; z: number; nx: number; nz: number }> = [];
  let seg = 0;
  for (let k = 0; k <= n; k++) {
    const s = (total * k) / n;
    while (seg < points.length - 2 && s > cum[seg + 1]) seg++;
    const segL = cum[seg + 1] - cum[seg] || 1;
    const t = (s - cum[seg]) / segL;
    const ax = points[seg][0], az = points[seg][1];
    const bx = points[seg + 1][0], bz = points[seg + 1][1];
    out.push({
      x: ax + (bx - ax) * t,
      z: az + (bz - az) * t,
      nx: -(bz - az) / segL,
      nz: (bx - ax) / segL,
    });
  }
  return out;
}

function waterRibbonQuads(points: [number, number][], halfWidth: number, y: number): Quad[] {
  if (points.length < 2) return [];
  const samples = polySamples(points, 4); // polyline gốc — 0 drift khỏi OSM
  const quads: Quad[] = [];
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1], cur = samples[i];
    quads.push({
      a: [prev.x - prev.nx * halfWidth, y, prev.z - prev.nz * halfWidth],
      b: [prev.x + prev.nx * halfWidth, y, prev.z + prev.nz * halfWidth],
      c: [cur.x + cur.nx * halfWidth, y, cur.z + cur.nz * halfWidth],
      d: [cur.x - cur.nx * halfWidth, y, cur.z - cur.nz * halfWidth]
    });
  }
  return quads;
}

export function buildWorld(scene: THREE.Scene, mapJson: unknown): WorldHandle {
  const map: GameMap = loadGameMap(mapJson);
  const cb = new ChunkBuilder();

  // ── 1. Mặt đường ribbon từng road ──
  // ribbonSkipZones: ribbon chồng 3 m vào miệng patch junction — vá khe nêm road cong
  for (const road of map.roads) {
    const skip = ribbonSkipZones(road, map);
    pushQuads(cb, roadRibbonQuads(road, skip), 'road');
    // ── Vai đường lót dưới (shoulder): rộng hơn ribbon 2.6 m (chui dưới vỉa hè
    // y = -0.012 nằm dưới mọi lớp phủ — mọi khe cỏ giữa ribbon/vỉa hè/patch lộ ra
    // asphalt worn thay vì cỏ. Skip zone NỚI thêm 1.5 m để không trồi qua patch. ──
    const len = roadLength(road);
    const shoulderSkip: Array<[number, number]> = [];
    for (const [a, b] of roadSkipZones(road, map)) {
      if (a === 0) shoulderSkip.push([0, Math.min(b + 1.5, len)]);
      else shoulderSkip.push([Math.max(a - 1.5, 0), len]);
    }
    pushQuads(cb, roadRibbonQuads(road, shoulderSkip, { extraWidth: 2.6, y: -0.012 }), 'road_worn');
  }

  // ── 1.5 Mặt nước (Spree + Spreekanal) — vẽ TRÊN terrain (y=-0.035/-0.02) nhưng
  //      DƯỚI road (y=0) → các bridge road (Friedrichstraßenbrücke, Marschallbrücke...)
  //      tự nhiên trông như cầu bắc qua sông. Kè đá bao quanh mép (Kaimauer). ──
  for (const water of map.waters ?? []) {
    // bank DƯỚI nước (-1.52 < -1.5): qua lỗ plaza thấy mép bank (3.5m) quanh
    // mặt nước — bank là ribbon FULL width, nếu đặt trên nước sẽ CHE CẢ SÔNG
    const bankQuads = waterRibbonQuads(water.points, water.width / 2 + 3.5, -1.52);
    const waterQuads = waterRibbonQuads(water.points, water.width / 2, -1.5);
    const wallQuads = waterWallQuads(water.points, water.width / 2, 0.15, -1.5);
    pushQuads(cb, bankQuads, 'bank');
    pushQuads(cb, waterQuads, 'water');
    pushQuads(cb, wallQuads, 'stone');
    // Cầu: road vượt nước → thành + lan can
    for (const r of map.roads as GameMap['roads']) {
      const bq = bridgeDecorQuads(r, map.waters ?? []);
      if (bq.length) pushQuads(cb, bq, 'stone');
    }
  }

  // ── 2. Đa giác nút giao thống nhất (Unified Junction Polygon + Sidewalk) ──
  for (const ix of map.intersections) {
    const node = nodeById(map, ix.nodeId);
    if (!node) continue;
    const roads = roadsAtNode(map, ix.nodeId);
    // Nền lót asphalt worn (y=-0.005) dưới mọi nút giao — lưới an toàn che nốt
    // mọi khe hairline giữa ribbon / patch / vỉa hè mà các lớp trên sót lại
    pushQuads(cb, junctionBackgroundQuads(node.x, node.z, roads), 'road_worn');
    const junc = buildJunctionMesh(node.x, node.z, roads);
    // Mặt đường ngã tư liền khối, đồng chất liệu 'road'
    pushQuads(cb, junc.asphaltQuads, 'road');
    // Vỉa hè và bó vỉa bo theo mép ngã tư — curb dùng material riêng sáng hơn vỉa hè
    pushQuads(cb, junc.sidewalkQuads, 'sidewalk');
    pushQuads(cb, junc.curbQuads, 'curb');

    // ── 2.5 Đảo giao thông (island) tại nút vòng xuyến ──
    if (ix.rule === 'roundabout') {
      pushQuads(cb, roundaboutIslandQuads(node.x, node.z, map, ix.nodeId), 'road_worn');
    }
  }

  // ── 3. Vạch kẻ ──
  for (const road of map.roads) {
    const half = roadHalfWidth(road); // vạch mép/zebra của chính road này, không dùng độ rộng road lớn ở đầu kia
    const quads = roadMarkingQuads(map, road, roadSkipZones(road, map), half);
    pushQuads(cb, quads, 'white');
  }

  // ── 3.5 Biển báo StVO + đèn giao thông — gắn theo cell cho chunkManager ──
  const { signsByCell, allSignGroups } = placeSigns(map);
  const { controllers, lightsByCell, allLightGroups } = placeTrafficLights(scene, map);
  const props = placeProps(scene, map);
  const extras = new Map<string, THREE.Object3D[]>();
  for (const [k, v] of signsByCell) extras.set(k, [...(extras.get(k) ?? []), ...v]);
  for (const [k, v] of lightsByCell) extras.set(k, [...(extras.get(k) ?? []), ...v]);

  // ── Người đi bộ (đi dọc vỉa hè, qua zebra) ──
  const pedestrians = new PedestrianController(scene, map);
  pedestrians.init();

  // ── 4. Vỉa hè: mặt trên phẳng + mặt curb đứng ──
  for (const road of map.roads) {
    for (const piece of sidewalkBoxes(road, map)) {
      const [t0, t1, t2, t3] = piece.top;
      cb.addQuad({ a: t0, b: t1, c: t2, d: t3 }, 'sidewalk');
      if (piece.curb) {
        const [c0, c1, c2, c3] = piece.curb;
        cb.addQuad({ a: c0, b: c1, c: c2, d: c3 }, 'curb');
      }
    }
  }

  // ── 4.5 Pad vỉa hè 4 góc giao lộ ──
  for (const pad of sidewalkCornerPads(map)) {
    cb.addQuad(pad.top, 'sidewalk');
    for (const curb of pad.curbs) cb.addQuad(curb, 'curb');
  }

  // ── 4.6 Nhà phố (vertex color facade + cửa sổ + AO) ──
  for (const bq of allBuildingQuads(map)) {
    cb.addQuad(bq.quad, 'building', bq.colors);
  }

  // ── 4.4 Railway — P1: GOM TRACK THÀNH CỤM VIADUCT ──
  // Mỗi cụm elevation riêng → một khối ballast/tường/trụ; ray từng track riêng bên trong.
  // Tram elev=0 → ray mặt đường riêng (không ballast chung — tram chạy trên asphalt).
  {
    // Load cluster assignments từ P1.1 audit
    const railToCluster = new Map((map.railClusters ?? []).map(a => [a.railId, a.clusterId]));

    const stripsNearRail: Array<[number, number, number, number]> = [];
    for (const b of map.buildings) {
      const st = buildingStrips(map, { ...b, depthOff: 0 });
      if (st) for (const q of st) stripsNearRail.push(q);
    }

    // Nhóm rails theo (clusterId, elev) — mỗi nhóm một khối render
    const groups = new Map<string, NonNullable<GameMap['rails']>>();
    for (const rail of (map as GameMap).rails ?? []) {
      const cid = railToCluster.get(rail.id) ?? -1;
      const key = `${cid}_${rail.elev}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(rail);
    }
    console.log(`[P1] rails: ${((map as GameMap).rails ?? []).length} track → ${groups.size} nhóm (cluster×elev)`);

    const ballast: Quad[] = [];
    const railQ: Quad[] = [];
    const walls: Quad[] = [];
    const pillars: Quad[] = [];

    for (const [gKey, groupRails] of groups) {
      const elev = groupRails[0].elev || 0;
      const isTram = groupRails[0].railway === 'tram' && elev === 0;

      // P1 dedupe: rails đầu-cuối gần trùng (< 0.5m) chỉ giữ 1
      const dedup: NonNullable<GameMap['rails']> = [];
      for (const r of groupRails) {
        if (dedup.some(dr => {
          const da = dr.points[0], db = r.points[0];
          return Math.hypot(da[0] - db[0], da[1] - db[1]) < 0.5;
        })) continue;
        dedup.push(r);
      }

      if (!isTram && elev > 0) {
        // ═══ VIADUCT/BRIDGE: ballast + tường bao TOÀN BỘ cụm ═══
        // Chọn track dài nhất làm trục ballast
        const mainRail = dedup.reduce((a, b) => {
          const len = (rr: NonNullable<GameMap['rails']>[number]) =>
            rr.points.reduce((s, p, k) => k ? s + Math.hypot(p[0] - rr.points[k - 1][0], p[1] - rr.points[k - 1][1]) : 0, 0);
          return len(a) >= len(b) ? a : b;
        });
        const mainSamples = polySamples(mainRail.points, 4);

        // Ballast half: bao đủ các track con — mỗi track con cách trục ~trackOffset
        // Tính max offset của các track con so với trục:
        let maxTrackOffset = 0;
        for (const r of dedup) {
          for (const p of r.points) {
            const dd = distToPolylinePts(p[0], p[1], mainRail.points);
            maxTrackOffset = Math.max(maxTrackOffset, dd);
          }
        }
        const ballastHalf = Math.max(1.8, maxTrackOffset + 1.0);

        // Ballast ribbon dọc trục
        for (let i = 1; i < mainSamples.length; i++) {
          const a = mainSamples[i - 1], b = mainSamples[i];
          ballast.push({
            a: [a.x - a.nx * ballastHalf, elev + 0.02, a.z - a.nz * ballastHalf],
            b: [a.x + a.nx * ballastHalf, elev + 0.02, a.z + a.nz * ballastHalf],
            c: [b.x + b.nx * ballastHalf, elev + 0.02, b.z + b.nz * ballastHalf],
            d: [b.x - b.nx * ballastHalf, elev + 0.02, b.z - b.nz * ballastHalf],
          });
        }
        // Tường viaduct 2 bên
        for (let i = 1; i < mainSamples.length; i++) {
          const a = mainSamples[i - 1], b = mainSamples[i];
          for (const sd of [1, -1]) {
            const ax = a.x + a.nx * sd * ballastHalf, az = a.z + a.nz * sd * ballastHalf;
            const bx = b.x + b.nx * sd * ballastHalf, bz = b.z + b.nz * sd * ballastHalf;
            walls.push({ a: [ax, elev + 0.12, az], b: [ax, 0, az], c: [bx, 0, bz], d: [bx, elev + 0.12, bz] });
          }
        }
        // Trụ: mỗi 4 samples, TRÁNH road corridor (C2)
        for (let i = 2; i < mainSamples.length - 2; i += 4) {
          const p = mainSamples[i];
          let bestRoad: GameMap['roads'][number] | null = null;
          let bestD = Infinity;
          for (const r2 of map.roads) {
            const dd = distToPolylinePts(p.x, p.z, r2.points);
            if (dd < bestD) { bestD = dd; bestRoad = r2; }
          }
          const half2 = bestRoad ? (bestRoad.lanesForward + bestRoad.lanesBackward) * bestRoad.laneWidth / 2 : 0;
          const placePillarAt = (qx: number, qz: number) => {
            const hx = 1.2, hz = 1.2;
            const c1: [number, number] = [qx + hx, qz + hz];
            const c2: [number, number] = [qx + hx, qz - hz];
            const c3: [number, number] = [qx - hx, qz - hz];
            const c4: [number, number] = [qx - hx, qz + hz];
            for (const [p1, p2] of [[c1, c2], [c2, c3], [c3, c4], [c4, c1]]) {
              pillars.push({ a: [p1[0], elev, p1[1]], b: [p1[0], 0, p1[1]], c: [p2[0], 0, p2[1]], d: [p2[0], elev, p2[1]] });
            }
          };
          if (bestRoad && bestD < half2 + 1.5) {
            // TRÊN road → trụ PAIR 2 bên
            const off2 = half2 + 1.6;
            placePillarAt(p.x + p.nx * off2, p.z + p.nz * off2);
            placePillarAt(p.x - p.nx * off2, p.z - p.nz * off2);
          } else {
            placePillarAt(p.x, p.z);
          }
        }
      }

      // ── RAY: TỪNG track riêng (±0.72m, y=elev+0.04) — cả tram và viaduct ──
      for (const r of dedup) {
        const smp = polySamples(r.points, 4);
        for (let i = 1; i < smp.length; i++) {
          const a = smp[i - 1], b = smp[i];
          for (const sd of [1, -1]) {
            const o = 0.72 * sd;
            railQ.push({
              a: [a.x + a.nx * o - a.nx * 0.04, elev + 0.04, a.z + a.nz * o - a.nz * 0.04],
              b: [a.x + a.nx * o + a.nx * 0.04, elev + 0.04, a.z + a.nz * o + a.nz * 0.04],
              c: [b.x + b.nx * o + b.nx * 0.04, elev + 0.04, b.z + b.nz * o + b.nz * 0.04],
              d: [b.x + b.nx * o - b.nx * 0.04, elev + 0.04, b.z + b.nz * o - b.nz * 0.04],
            });
          }
        }
      }
    }
    pushQuads(cb, ballast, 'bank');
    pushQuads(cb, railQ, 'white');
    pushQuads(cb, walls, 'stone');
    pushQuads(cb, pillars, 'stone');
  }

  // ── 4.5 Công viên/cây xanh (parks polygon → mesh grass phủ y=0.01) ──
  {
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x7aa15c });
    for (const park of (map as GameMap).parks ?? []) {
      const pts = park.points.map((p: [number, number]) => new THREE.Vector2(p[0], p[1]));
      if (pts.length < 3) continue;
      try {
        const tris = THREE.ShapeUtils.triangulateShape(pts, []);
        const positions: number[] = [];
        for (const [i0, i1, i2] of tris) {
          for (const idx of [i0, i2, i1]) {
            positions.push(pts[idx].x, 0.01, pts[idx].y);
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, grassMat);
        mesh.receiveShadow = true;
        mesh.name = `park_${park.id}`;
        scene.add(mesh);
      } catch { // polygon tự cắt — bỏ
      }
    }
  }

  // ── 5. Materials cho chunkManager (mesh build lazy theo camera) ──
  const materials: Record<string, THREE.Material> = {
    road: new THREE.MeshLambertMaterial({ color: palette.asphalt }),
    road_worn: new THREE.MeshLambertMaterial({ color: palette.asphaltWorn }),
    white: new THREE.MeshLambertMaterial({
      color: palette.lineWhite,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    }),
    sidewalk: new THREE.MeshLambertMaterial({ color: palette.sidewalk }),
    curb: new THREE.MeshLambertMaterial({ color: palette.curb }),
    bank: new THREE.MeshLambertMaterial({ color: palette.riverBank }),
    water: new THREE.MeshLambertMaterial({ color: palette.water }),
    stone: new THREE.MeshLambertMaterial({ color: 0x9aa0a6 }),
    grass: new THREE.MeshLambertMaterial({ color: 0x7aa15c }),
    building: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
  };

  let quads = cb.quadCount;

  let controllerTimer = 0;
  return {
    chunkData: cb,
    materials,
    extras,
    controllers,
    pedestrians,
    stats: { cells: cb.cellCount, quads },
    update(dt: number) {
      controllerTimer += dt;
      void controllerTimer;
      controllers.forEach(c => c.update(dt));
      applyLightVisuals(allLightGroups);
      pedestrians?.update(dt);
      void allSignGroups;
    },
    dispose() {
      props.dispose();
      pedestrians?.dispose();
    }
  };
}

export { loadGameMap } from './mapLoader';
export type { GameMap } from './mapLoader';
export type { MapIntersection } from './mapLoader';
