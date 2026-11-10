// testJunctionBoundary.ts — helper test dùng chung (G1-3): kiểm tra BIÊN THẬT
// của patch giao lộ thay vì cận đỉnh nhân tạo (1.5·Kmax cũ):
//   1. Mọi điểm lấy mẫu trên biên patch (bao lồi) phải ≤ 1 m từ miệng MỘT
//      nhánh HOẶC từ cạnh trong của pad vỉa hè góc.
//   2. Hai đầu miệng mỗi nhánh (d·K ± n·K) phải nằm trong patch — không hở
//      giữa patch và ribbon.
// Vòng 2 bổ sung 2 collector nữa:
//   3. collectSeamIssues — lưới ±16 m quanh node, bước 0,25 m: mọi điểm KHÔNG
//      nằm trong lớp phủ (hull patch / ribbon / vỉa hè / pad / island) mà cách
//      mép > 0,05 m và bị KẸP giữa ≥ 2 lớp phủ đối diện (khe cỏ) → vi phạm.
//   4. collectSawtoothIssues — mép TRONG của mọi piece vỉa hè phải sát mép
//      ribbon cùng road (≤ 0,05 m; cùng lưới s của roadCurve → trùng khít).
// Module này KHÔNG chạy trong runtime — chỉ import trong vitest.
import type { GameMap, MapRoad } from './mapLoader';
import {
  junctionPatchQuads, roadHalfWidth, roadRibbonQuads, roadSkipZones,
  roadsAtNode, roundaboutIslandQuads, Quad
} from './roadMesh';
import { sidewalkBoxes, sidewalkCornerPads } from './sidewalk';

export interface BoundaryIssue {
  nodeId: string;
  point: [number, number];
  why: string;
  /** khoảng cách tốt nhất tới mouth/pad-edge (hoặc tới mép poly) */
  best: number;
}

export interface BoundaryReport {
  checkedNodes: number;
  issues: BoundaryIssue[];
}

type Pt = [number, number];
type Seg = [Pt, Pt];

function distSeg(px: number, pz: number, a: Pt, b: Pt): number {
  const vx = b[0] - a[0];
  const vz = b[1] - a[1];
  const vv = vx * vx + vz * vz;
  const t = vv < 1e-12 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * vx + (pz - a[1]) * vz) / vv));
  return Math.hypot(px - (a[0] + t * vx), pz - (a[1] + t * vz));
}

function inPoly(px: number, pz: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    const cross = (zi > pz) !== (zj > pz) &&
      px < ((xj - xi) * (pz - zi)) / (zj - zi + 1e-12) + xi;
    if (cross) inside = !inside;
  }
  return inside;
}

function distPolyEdge(px: number, pz: number, poly: Pt[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    best = Math.min(best, distSeg(px, pz, poly[j], poly[i]));
  }
  return best;
}

/**
 * Thu thập vi phạm biên thật của patch giao lộ cho cả map:
 * - checkedNodes: số node ≥ 3 nhánh được kiểm.
 * - issues: điểm biên cách mọi miệng nhánh/cạnh pad > 1 m, hoặc đầu miệng
 *   nhánh không nằm trong patch.
 */
export function collectBoundaryIssues(map: GameMap): BoundaryReport {
  const pads = sidewalkCornerPads(map); // tính 1 lần ngoài vòng
  const issues: BoundaryIssue[] = [];
  let checkedNodes = 0;

  for (const ix of map.intersections) {
    const node = map.nodes.find((n) => n.id === ix.nodeId);
    if (!node) continue;
    const roads = roadsAtNode(map, ix.nodeId);
    if (roads.length < 3) continue; // chỉ ngã ≥ 3 nhánh mới sinh patch
    const { poly } = junctionPatchQuads(node.x, node.z, roads);
    if (poly.length < 3) continue;
    checkedNodes++;

    // poly là TOẠ ĐỘ CỤC BỘ → đưa về world để khớp mouth/pad
    const world: Pt[] = poly.map(([x, z]) => [node.x + x, node.z + z]);

    // miệng mỗi nhánh: đoạn node + d·K − n·K → node + d·K + n·K (world)
    const mouths: Seg[] = roads.map(({ road, dirX, dirZ }) => {
      const K = roadHalfWidth(road) + 0.75; // khớp K runtime (roadMesh.ts)
      return [
        [node.x + dirX * K - -dirZ * K, node.z + dirZ * K - dirX * K],
        [node.x + dirX * K + -dirZ * K, node.z + dirZ * K + dirX * K]
      ];
    });

    // cạnh TRONG của pad vỉa hè góc (top.a → top.b) quanh node này
    const kmax = Math.max(...roads.map((r) => roadHalfWidth(r.road) + 0.75));
    const reach = 2 * kmax + 1;
    const padEdges: Seg[] = [];
    for (const p of pads) {
      const da = Math.hypot(p.top.a[0] - node.x, p.top.a[2] - node.z);
      const db = Math.hypot(p.top.b[0] - node.x, p.top.b[2] - node.z);
      if (da <= reach && db <= reach) {
        padEdges.push([
          [p.top.a[0], p.top.a[2]],
          [p.top.b[0], p.top.b[2]]
        ]);
      }
    }

    // (1) lấy mẫu biên hull: t ∈ {0, .25, .5, .75, 1} mỗi cạnh
    for (let k = 0; k < world.length; k++) {
      const a = world[k];
      const b = world[(k + 1) % world.length];
      for (const t of [0, 0.25, 0.5, 0.75, 1]) {
        const px = a[0] + (b[0] - a[0]) * t;
        const pz = a[1] + (b[1] - a[1]) * t;
        let best = Infinity;
        for (const [m0, m1] of mouths) best = Math.min(best, distSeg(px, pz, m0, m1));
        for (const [p0, p1] of padEdges) best = Math.min(best, distSeg(px, pz, p0, p1));
        if (best > 1) {
          issues.push({
            nodeId: ix.nodeId,
            point: [px, pz],
            why: `điểm biên cách mọi miệng nhánh/cạnh pad > 1 m (best=${best.toFixed(2)})`,
            best
          });
        }
      }
    }

    // (2) hai đầu miệng mỗi nhánh nằm trong patch (trên biên cũng tính nằm trong)
    for (let m = 0; m < mouths.length; m++) {
      for (const [ex, ez] of mouths[m]) {
        const onEdge = distPolyEdge(ex, ez, world) <= 1e-6;
        if (!inPoly(ex, ez, world) && !onEdge) {
          issues.push({
            nodeId: ix.nodeId,
            point: [ex, ez],
            why: `đầu miệng nhánh #${m} không nằm trong patch`,
            best: distPolyEdge(ex, ez, world)
          });
        }
      }
    }
  }
  return { checkedNodes, issues };
}

/* ══════════════ Vòng 2: seam (khe cỏ quanh node) + sawtooth (răng cưa vỉa hè) ══════════════ */

const SEAM_TOL = 0.05; // khe cỏ cho phép tối đa (m)
const SEAM_BALL = 3.0; // cover nằm trong ~3 m mới tính là "kẹp"
const SEAM_GAP = 1.0;  // bề ngang tối đa của khe: |pA-pB| ≤ 1 m mới là khe hẹp,
                       // không phải vùng cỏ mở (wedge) giữa 2 hành lang che khác
const SEAM_GRID_R = 16;   // bán kính lưới quanh node (m)
const SEAM_STEP = 0.25;   // bước lưới (m)
const SEAM_STEPS = Math.round(SEAM_GRID_R / SEAM_STEP); // 64
const SAW_TOL = 0.05; // mép trong vỉa hè lệch mép ribbon tối đa (m)

interface Cover {
  pts: Pt[];
  minX: number; maxX: number; minZ: number; maxZ: number;
}

function makeCover(pts: Pt[]): Cover {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of pts) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  return { pts, minX, maxX, minZ, maxZ };
}

function quadCover(q: Quad): Cover {
  return makeCover([
    [q.a[0], q.a[2]],
    [q.b[0], q.b[2]],
    [q.c[0], q.c[2]],
    [q.d[0], q.d[2]]
  ]);
}

function aabbDist(px: number, pz: number, c: Cover): number {
  const dx = Math.max(c.minX - px, 0, px - c.maxX);
  const dz = Math.max(c.minZ - pz, 0, pz - c.maxZ);
  return Math.hypot(dx, dz);
}

/** điểm gần nhất trên polyline (đóng/mở) + khoảng cách */
function nearestOnPoly(px: number, pz: number, pts: Pt[]): { d: number; nx: number; nz: number } {
  let best = Infinity, bx = px, bz = pz;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const d = distSeg(px, pz, pts[j], pts[i]);
    if (d < best) {
      // nội suy lại điểm chạm gần nhất trên đoạn j→i
      const [ax, az] = pts[j];
      const [bx2, bz2] = pts[i];
      const vx = bx2 - ax, vz = bz2 - az;
      const vv = vx * vx + vz * vz;
      const t = vv < 1e-12 ? 0 : Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / vv));
      bx = ax + t * vx; bz = az + t * vz;
      best = d;
    }
  }
  return { d: best, nx: bx, nz: bz };
}

/** khoảng cách tới polyline (không cần điểm chạm) — dùng cho sawtooth */
function distToPoly(px: number, pz: number, pts: Pt[]): number {
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    best = Math.min(best, distSeg(px, pz, pts[j], pts[i]));
  }
  return best;
}

/**
 * Vòng 2 mục (1): quét LƯỚI ±16 m quanh node, bước 0,25 m.
 * Mỗi điểm: nếu KHÔNG nằm trong lớp phủ (hull patch / ribbon nodeRoads /
 * vỉa hè / pad / đảo vòng xuyến) mà cách mép phủ gần nhất > SEAM_TOL,
 * và bị KẸP HẸP giữa ≥ 2 lớp phủ: tồn tại một cặp mép phủ gần nhất
 * (pA, pB) sao cho (a) hai mép nằm về HAI BÊN điểm — (pA−p)·(pB−p) < 0
 * (straddle), và (b) hai mép SÁT nhau qua điểm — |pA−pB| ≤ SEAM_GAP
 * (khe hẹp, không phải wedge cỏ mở rộng). Đáp ứng cả hai → khe cỏ thật →
 * vi phạm. Không tính cặp thuộc CÙNG một cover.
 * Cover chỉ lấy từ các road INCIDENT với node (nodeRoads) → block nội bộ
 * ở xa không tạo false-positive.
 */
export function collectSeamIssues(map: GameMap): BoundaryReport {
  const pads = sidewalkCornerPads(map); // tính 1 lần ngoài vòng
  const issues: BoundaryIssue[] = [];
  let checkedNodes = 0;
  const win = SEAM_GRID_R + SEAM_BALL + 0.5; // cửa sổ lọc cover theo AABB

  for (const ix of map.intersections) {
    const node = map.nodes.find((n) => n.id === ix.nodeId);
    if (!node) continue;
    const nodeRoads = roadsAtNode(map, ix.nodeId);
    if (nodeRoads.length < 2) continue;
    checkedNodes++;

    const covers: Cover[] = [];
    const inWindow = (c: { minX: number; maxX: number; minZ: number; maxZ: number }): boolean =>
      c.maxX >= node.x - win && c.minX <= node.x + win &&
      c.maxZ >= node.z - win && c.minZ <= node.z + win;

    // (a) patch hull (poly cục bộ CCW → world)
    const { poly } = junctionPatchQuads(node.x, node.z, nodeRoads);
    if (poly.length >= 3) {
      covers.push(makeCover(poly.map(([x, z]) => [node.x + x, node.z + z] as Pt)));
    }

    // (b) ribbon quads của nodeRoads (đã cắt skip zone chính xác)
    for (const { road } of nodeRoads) {
      for (const q of roadRibbonQuads(road, roadSkipZones(road, map))) {
        const c = quadCover(q);
        if (inWindow(c)) covers.push(c);
      }
    }

    // (c) vỉa hè (mặt trên từng piece — world coords sẵn)
    for (const { road } of nodeRoads) {
      for (const piece of sidewalkBoxes(road, map)) {
        const c = makeCover(piece.top.map((p) => [p[0], p[2]] as Pt));
        if (inWindow(c)) covers.push(c);
      }
    }

    // (d) pad vỉa hè góc (world quad)
    for (const p of pads) {
      const c = quadCover(p.top);
      if (inWindow(c)) covers.push(c);
    }

    // (e) đảo vòng xuyến (disk fan quanh node)
    if (ix.rule === 'roundabout') {
      for (const q of roundaboutIslandQuads(node.x, node.z, map, ix.nodeId)) {
        const c = quadCover(q);
        if (inWindow(c)) covers.push(c);
      }
    }

    // bình phương khoảng cách AABB đã lọc: điểm lưới chỉ cần cover trong ball
    for (let i = -SEAM_STEPS; i <= SEAM_STEPS; i++) {
      for (let j = -SEAM_STEPS; j <= SEAM_STEPS; j++) {
        const px = node.x + i * SEAM_STEP;
        const pz = node.z + j * SEAM_STEP;
        let covered = false;
        let dmin = Infinity;
        const near: Array<{ d: number; nx: number; nz: number; coverIdx: number }> = [];
        for (let ci = 0; ci < covers.length; ci++) {
          const cover = covers[ci];
          const ad = aabbDist(px, pz, cover);
          if (ad > SEAM_BALL) continue;
          if (ad < 1e-9 && inPoly(px, pz, cover.pts)) {
            covered = true;
            break;
          }
          const n = nearestOnPoly(px, pz, cover.pts);
          if (n.d > SEAM_BALL) continue;
          dmin = Math.min(dmin, n.d);
          near.push({ d: n.d, nx: n.nx, nz: n.nz, coverIdx: ci });
        }
        if (covered || dmin <= SEAM_TOL) continue;
        // kẹp hẹp giữa ≥ 2 mép khác cover: straddle (hai bên) + khe hẹp
        let seamPair: { span: number; minD: number } | null = null;
        for (let a = 0; a < near.length; a++) {
          for (let b = a + 1; b < near.length; b++) {
            if (near[a].coverIdx === near[b].coverIdx) continue;
            const straddle = (near[a].nx - px) * (near[b].nx - px) +
              (near[a].nz - pz) * (near[b].nz - pz);
            if (straddle >= 0) continue;
            const span = Math.hypot(near[a].nx - near[b].nx, near[a].nz - near[b].nz);
            if (span > SEAM_GAP) continue;
            if (!seamPair || span < seamPair.span) {
              seamPair = { span, minD: Math.min(near[a].d, near[b].d) };
            }
          }
        }
        if (!seamPair) continue;
        // khử trùng lặp: cùng node, điểm vi phạm đã ghi cách < 0,5 m
        if (issues.some((it) => it.nodeId === ix.nodeId &&
          Math.hypot(it.point[0] - px, it.point[1] - pz) < 0.5)) continue;
        issues.push({
          nodeId: ix.nodeId,
          point: [px, pz],
          why: `khe cỏ bị kẹp hẹp, dmin=${dmin.toFixed(3)}m, span=${seamPair.span.toFixed(3)}m`,
          best: dmin
        });
      }
    }
  }
  return { checkedNodes, issues };
}

export interface SawIssue {
  roadId: string;
  pieceIndex: number;
  point: [number, number];
  /** độ lệch lớn nhất giữa mép trong vỉa hè và mép ribbon (m) */
  gap: number;
}

export interface SawReport {
  checkedRoads: number;
  issues: SawIssue[];
}

/**
 * Vòng 2 mục (2): mép TRONG của mọi piece vỉa hè phải sát mép ribbon CÙNG
 * road (< SAW_TOL) — loại răng cưa vỉa hè trên đường cong.
 * Mép trong xác định ROBUST: 2 candidate (top[0]→top[3] hoặc top[0]→top[1])
 * — chọn candidate có khoảng cách trung bình tới mép ribbon GẦN hơn,
 * bất kể winding. Vỉa hè dùng CÙNG lưới s của roadCurve như ribbon →
 * bình thường gap ≈ 0; > 0.05 m là răng cưa thật.
 */
export function collectSawtoothIssues(map: GameMap): SawReport {
  const issues: SawIssue[] = [];
  let checkedRoads = 0;
  const T = [0, 0.25, 0.5, 0.75, 1];

  for (const road of map.roads) {
    const quads = roadRibbonQuads(road, roadSkipZones(road, map));
    if (quads.length === 0) continue;
    checkedRoads++;

    // mép ribbon: mỗi quad cho +side = b→c và −side = a→d (roadMesh l.46-52)
    const plus: Pt[] = [];
    const minus: Pt[] = [];
    for (const q of quads) {
      plus.push([q.b[0], q.b[2]], [q.c[0], q.c[2]]);
      minus.push([q.a[0], q.a[2]], [q.d[0], q.d[2]]);
    }

    const pieces = sidewalkBoxes(road, map);
    pieces.forEach((piece, wi) => {
      const top = piece.top;
      if (!top || top.length < 4) return;
      const P = (k: number): Pt => [top[k][0], top[k][2]];
      // 2 candidate mép trong (wrap 0→3 hoặc 0→1)
      const cands: Array<{ pts: Pt[]; mean: number; max: number; maxPt: Pt }> = [];
      for (const cand of [[P(0), P(3)], [P(0), P(1)]] as Array<[Pt, Pt]>) {
        let sum = 0, max = 0, maxPt: Pt = cand[0];
        for (const t of T) {
          const px = cand[0][0] + (cand[1][0] - cand[0][0]) * t;
          const pz = cand[0][1] + (cand[1][1] - cand[0][1]) * t;
          const d = Math.min(distToPoly(px, pz, plus), distToPoly(px, pz, minus));
          sum += d;
          if (d > max) { max = d; maxPt = [px, pz]; }
        }
        cands.push({ pts: cand, mean: sum / T.length, max, maxPt });
      }
      const chosen = cands[0].mean <= cands[1].mean ? cands[0] : cands[1];
      if (chosen.max > SAW_TOL) {
        issues.push({
          roadId: `${road.from}->${road.to}`,
          pieceIndex: wi,
          point: chosen.maxPt,
          gap: chosen.max
        });
      }
    });
  }
  return { checkedRoads, issues };
}
