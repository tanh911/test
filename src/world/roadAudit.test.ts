// 🤖 roadAudit.test.ts — BOT quét chất lượng toàn bộ đường/nhà/giao lộ (data space)
// Quét THEO ĐÚNG hình học runtime: ribbon chồng 3 m (ribbonSkipZones), vai đường lót
// (shoulder +2.6 m, y=-0.012), đệm junction worn (junctionBackgroundQuads), nước.
// → chỉ báo cáo LỖI THẬT nhìn thấy trong game. FAIL = có lỗi hình học mới.
// Chạy: npx vitest run src/world/roadAudit.test.ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { loadGameMap, roadPointAt, roadLength, type GameMap, type MapRoad } from './mapLoader';
import {
  junctionBackgroundQuads, junctionPatchQuads, ribbonSkipZones, roadHalfWidth,
  roadRibbonQuads, roadSkipZones, roadsAtNode, roundaboutIslandQuads, type Quad
} from './roadMesh';
import { sidewalkBoxes } from './sidewalk';
import { buildingStrips } from './buildings';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';

const map: GameMap = loadGameMap(berlinMitteMap);

// ── covers: các lớp phủ (polygon world-space) ──
interface Cover {
  pts: Array<[number, number]>;
  minX: number; maxX: number; minZ: number; maxZ: number;
}
function makeCover(pts: Array<[number, number]>): Cover {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of pts) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  return { pts, minX, maxX, minZ, maxZ };
}
function coversFromQuads(list: Quad[], into: Cover[]): void {
  for (const q of list) {
    into.push(makeCover([[q.a[0], q.a[2]], [q.b[0], q.b[2]], [q.c[0], q.c[2]], [q.d[0], q.d[2]]]));
  }
}
function pointInCover(x: number, z: number, c: Cover): boolean {
  let inside = false;
  const p = c.pts;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function distToCover(x: number, z: number, c: Cover): number {
  if (pointInCover(x, z, c)) return 0;
  let best = Infinity;
  const p = c.pts;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const vx = p[i][0] - p[j][0], vz = p[i][1] - p[j][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((x - p[j][0]) * vx + (z - p[j][1]) * vz) / l2));
    best = Math.min(best, Math.hypot(x - (p[j][0] + t * vx), z - (p[j][1] + t * vz)));
  }
  return best;
}
function distToPolylinePts(x: number, z: number, pts: [number, number][]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const vx = pts[i][0] - pts[i - 1][0], vz = pts[i][1] - pts[i - 1][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((x - pts[i - 1][0]) * vx + (z - pts[i - 1][1]) * vz) / l2));
    best = Math.min(best, Math.hypot(x - (pts[i - 1][0] + t * vx), z - (pts[i - 1][1] + t * vz)));
  }
  return best;
}

interface SeamIssue { node: string; p: [number, number]; dmin: number; span: number; }

describe('🤖 BOT quét chất lượng đường Berlin-Mitte (runtime-accurate)', () => {
  it('khe cỏ / vỉa hè hở / nhà đâm đường — report + regression guard', { timeout: 300_000 }, () => {
    // ── 0. Covers runtime ──
    const covers: Cover[] = [];
    for (const road of map.roads as MapRoad[]) {
      coversFromQuads(roadRibbonQuads(road, ribbonSkipZones(road, map)), covers);
      coversFromQuads(roadRibbonQuads(road, roadSkipZones(road, map), { extraWidth: 2.6, y: -0.012 }), covers);
      for (const piece of sidewalkBoxes(road, map)) {
        covers.push(makeCover(piece.top.map(([x, , z]) => [x, z] as [number, number])));
      }
    }
    for (const ix of map.intersections) {
      const node = map.nodes.find((n) => n.id === ix.nodeId);
      if (!node) continue;
      const roads = roadsAtNode(map, ix.nodeId);
      const patch = junctionPatchQuads(node.x, node.z, roads);
      if (patch.poly.length >= 3) {
        covers.push(makeCover(patch.poly.map(([x, z]) => [node.x + x, node.z + z] as [number, number])));
      }
      coversFromQuads(junctionBackgroundQuads(node.x, node.z, roads), covers);
      coversFromQuads(roundaboutIslandQuads(node.x, node.z, map, ix.nodeId), covers);
    }
    // nước là cover
    for (const w of map.waters ?? []) {
      const curve = new THREE.CatmullRomCurve3(w.points.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
      const n = Math.max(2, Math.ceil(curve.getLength() / 8));
      let prev: [number, number] | null = null;
      for (let i = 0; i <= n; i++) {
        const p = curve.getPointAt(i / n);
        const t = curve.getTangentAt(i / n);
        const cur: [number, number] = [p.x, p.z];
        if (prev) {
          const nx = -t.z, nz = t.x, hw = w.width / 2;
          covers.push(makeCover([
            [prev[0] - nx * hw, prev[1] - nz * hw], [prev[0] + nx * hw, prev[1] + nz * hw],
            [cur[0] + nx * hw, cur[1] + nz * hw], [cur[0] - nx * hw, cur[1] - nz * hw]
          ]));
        }
        prev = cur;
      }
    }

    // ── 1. SEAM: điểm KHÔNG được phủ + BỊ KẸP giữa ≥2 lớp phủ đối diện (khe cỏ thật) ──
    const seams: SeamIssue[] = [];
    const R = 13, STEP = 0.75, BALL = 1.3;
    for (const ix of map.intersections) {
      const node = map.nodes.find((n) => n.id === ix.nodeId);
      if (!node || roadsAtNode(map, ix.nodeId).length < 2) continue;
      const cand: Array<[number, number, number]> = [];
      for (let x = node.x - R; x <= node.x + R; x += STEP) {
        for (let z = node.z - R; z <= node.z + R; z += STEP) {
          let dmin = Infinity;
          for (const c of covers) {
            if (x < c.minX - 0.5 || x > c.maxX + 0.5 || z < c.minZ - 0.5 || z > c.maxZ + 0.5) continue;
            const d = distToCover(x, z, c);
            if (d < dmin) dmin = d;
          }
          if (dmin === Infinity) continue;
          if (dmin > 0.08 && dmin < 2.0) {
            // KẸP: trong ball 1.3 m phải có ≥2 lớp phủ ở hướng đối diện (>120°)
            const dirs: number[] = [];
            for (let k = 0; k < 12; k++) {
              const ang = (k / 12) * Math.PI * 2;
              const dx = Math.cos(ang), dz = Math.sin(ang);
              for (const c of covers) {
                if (x < c.minX - BALL || x > c.maxX + BALL || z < c.minZ - BALL || z > c.maxZ + BALL) continue;
                // sweep dọc tia: có cover nào trong BALL?
                let hit = false;
                for (let t = 0.1; t <= BALL; t += 0.15) {
                  if (pointInCover(x + dx * t, z + dz * t, c)) { hit = true; break; }
                }
                if (hit) { dirs.push(ang); break; }
              }
            }
            let squeezed = false;
            for (let a = 0; a < dirs.length && !squeezed; a++) {
              for (let b = a + 1; b < dirs.length; b++) {
                let diff = Math.abs(dirs[a] - dirs[b]);
                if (diff > Math.PI) diff = Math.PI * 2 - diff;
                if (diff > (Math.PI * 2) / 3) { squeezed = true; break; }
              }
            }
            if (squeezed) cand.push([x, z, dmin]);
          }
        }
      }
      // gộp cụm kề nhau
      const used = new Set<number>();
      for (let i = 0; i < cand.length; i++) {
        if (used.has(i)) continue;
        const cluster: Array<[number, number, number]> = [cand[i]];
        used.add(i);
        for (let j = i + 1; j < cand.length; j++) {
          if (used.has(j)) continue;
          const last = cluster[cluster.length - 1];
          if (Math.hypot(cand[j][0] - last[0], cand[j][1] - last[1]) <= STEP * 1.6) {
            cluster.push(cand[j]); used.add(j);
          }
        }
        const dmin = Math.min(...cluster.map((c) => c[2]));
        const span = Math.min(cluster.length * STEP, 8);
        if (cluster.length >= 3 && dmin > 0.12) {
          seams.push({ node: ix.nodeId, p: [cluster[0][0], cluster[0][1]], dmin, span });
        }
      }
    }
    seams.sort((a, b) => b.span * (b.dmin + 0.2) - a.span * (a.dmin + 0.2));
    console.log(`\n[🤖 SEAM] khe cỏ bị kẹp nhìn thấy: ${seams.length} cụm`);
    for (const s of seams.slice(0, 10)) {
      console.log(`   node=${s.node} @(${s.p[0].toFixed(0)},${s.p[1].toFixed(0)}) hở ${s.dmin.toFixed(2)} m · dài ~${s.span.toFixed(1)} m`);
    }

    // ── 2. SAWTOOTH: đỉnh TRONG vỉa hè (top[0], top[3]) phải nằm trên MỘT cover
    // nào đó (mép ribbon / vai đường lót / patch / đệm / nước). Chỉ lỗi khi trôi
    // ra khỏi tất cả → cỏ nhìn thấy thật. ──
    let sawtooth = 0, sawMax = 0;
    const sawSamples: string[] = [];
    const coversForSaw = covers; // đã gồm ribbon + shoulder + patch + đệm + nước
    for (const road of map.roads as MapRoad[]) {
      const ribbon = roadRibbonQuads(road, ribbonSkipZones(road, map));
      for (const piece of sidewalkBoxes(road, map)) {
        // tâm piece — dùng nudge 10 cm vào trong khỏi đỉnh (ray-cast ở CORNER
        // polygon có thể báo outside oan)
        const cxp = (piece.top[0][0] + piece.top[1][0] + piece.top[2][0] + piece.top[3][0]) / 4;
        const czp = (piece.top[0][2] + piece.top[1][2] + piece.top[2][2] + piece.top[3][2]) / 4;
        for (const vi of [0, 3] as const) {
          const [vx0, , vz0] = piece.top[vi];
          const dx0 = cxp - vx0, dz0 = czp - vz0;
          const l0 = Math.hypot(dx0, dz0) || 1;
          const x = vx0 + (dx0 / l0) * 0.1, z = vz0 + (dz0 / l0) * 0.1;
          // nhanh: nằm trong cover nào chưa? (bbox precheck + point test)
          let onCover = false;
          for (const c of coversForSaw) {
            if (x < c.minX || x > c.maxX || z < c.minZ || z > c.maxZ) continue;
            if (pointInCover(x, z, c)) { onCover = true; break; }
          }
          if (onCover) continue;
          // không cover nào chứa → đo hở tới mép ribbon cùng road
          let dEdge = Infinity;
          for (const q of ribbon) {
            for (const [p, q2] of [[q.a, q.d], [q.b, q.c]] as const) {
              const vx = q2[0] - p[0], vz = q2[2] - p[2];
              const l2 = vx * vx + vz * vz || 1;
              const t = Math.max(0, Math.min(1, ((x - p[0]) * vx + (z - p[2]) * vz) / l2));
              dEdge = Math.min(dEdge, Math.hypot(x - (p[0] + t * vx), z - (p[2] + t * vz)));
            }
          }
          if (dEdge > 0.15 && dEdge < 3) {
            sawtooth++;
            if (dEdge > sawMax) sawMax = dEdge;
            if (sawSamples.length < 8) sawSamples.push(`${road.id} @(${x.toFixed(0)},${z.toFixed(0)}) hở ${dEdge.toFixed(2)} m`);
          }
        }
      }
    }
    console.log(`\n[🤖 SAWTOOTH] đỉnh trong vỉa hè hở >15 cm: ${sawtooth} (tệ nhất ${sawMax.toFixed(2)} m)`);
    for (const s of sawSamples) console.log(`   ${s}`);

    // ── 3. BUILDINGS: nhà lún sâu vào lòng ĐƯỜNG CHÍNH CỦA NÓ (sau auto-filter) ──
    let clashCount = 0;
    for (const b of map.buildings) {
      const strips = buildingStrips(map, { ...b, depthOff: 0 });
      if (!strips) continue;
      const road = map.roads.find((r) => r.id === b.roadId);
      if (!road) continue;
      const ownHalf = roadHalfWidth(road);
      for (const [a, b2, c, d] of strips) {
        const cx = (a + c) / 2, cz = (b2 + d) / 2;
        if (distToPolylinePts(cx, cz, road.points) < ownHalf - 1.0) { clashCount++; break; }
      }
    }
    console.log(`\n[🤖 BUILDING] nhà lún sâu vào lòng đường: ${clashCount}`);

    // ── 4. WATER (INFO): bridge qua sông là ĐÚNG thiết kế — chỉ đếm, không fail ──
    let bridgesOverWater = 0;
    for (const w of map.waters ?? []) {
      for (const road of map.roads as MapRoad[]) {
        const len = roadLength(road);
        let deepPts = 0, total = 0;
        for (let s = 0; s <= len; s += 4) {
          const p = roadPointAt(road, s);
          total++;
          if (distToPolylinePts(p.x, p.z, w.points) < w.width / 2 - 1) deepPts++;
        }
        if (total > 0 && deepPts / total > 0.6) bridgesOverWater++;
      }
    }
    console.log(`\n[🤖 WATER] đoạn cầu bắc qua nước (đúng thiết kế): ${bridgesOverWater}`);
    // ── 5. SIGN: biển đặt đúng chỗ (không giữa đường / trong nhà) + phủ đủ priority_road ──
    const signs = map.signs ?? [];
    const allStrips: Array<[number, number, number, number]> = [];
    for (const b of map.buildings) {
      const st = buildingStrips(map, { ...b, depthOff: 0 });
      if (st) allStrips.push(...st);
    }
    let signBad = 0;
    const signSamples: string[] = [];
    for (const sign of signs) {
      const road = map.roads.find((r) => r.id === sign.roadId);
      if (!road) { signBad++; continue; }
      const pt = roadPointAt(road, sign.s);
      const half = roadHalfWidth(road);
      const side = sign.side === 'right' ? 1 : -1;
      const fx = Math.sin(pt.heading), fz = Math.cos(pt.heading);
      const x = pt.x + -fz * side * (half + 1.2);
      const z = pt.z + fx * side * (half + 1.2);
      let onRoad = false;
      for (const r2 of map.roads) {
        if (distToPolylinePts(x, z, r2.points) < roadHalfWidth(r2) - 0.3) { onRoad = true; break; }
      }
      let inBuilding = false;
      for (const [a, b2, c, d] of allStrips) {
        if (x > a && x < c && z > b2 && z < d) { inBuilding = true; break; }
      }
      if (onRoad || inBuilding) {
        signBad++;
        if (signSamples.length < 6) signSamples.push(`${sign.type} @(${x.toFixed(0)},${z.toFixed(0)}) ${onRoad ? 'giua duong' : 'trong nha'}`);
      }
    }
    let prioMissing = 0;
    for (const ix of map.intersections) {
      if (ix.rule !== 'priority_road') continue;
      const touching = new Set(map.roads.filter((r) => r.from === ix.nodeId || r.to === ix.nodeId).map((r) => r.id));
      const has = signs.some((sg) => (sg.type === '205' || sg.type === '306') && touching.has(sg.roadId));
      if (!has) prioMissing++;
    }
    const nodeIsIx = new Set(map.intersections.map((ix) => ix.nodeId));
    const onewayNoSign = map.roads.filter((r) => {
      const oneWay = r.lanesBackward === 0 || r.lanesForward === 0;
      if (!oneWay) return false;
      // chỉ đếm đầu NGƯỢC chiều luật mà là giao lộ (nơi có thể bị đi ngược vào)
      const wrongEnd = r.lanesBackward === 0 ? r.to : r.from;
      return nodeIsIx.has(wrongEnd) && !signs.some((sg) => sg.roadId === r.id && sg.type === '267');
    }).length;

    console.log(`
[SIGN] ${signs.length} bien · sai cho: ${signBad} · priority_road thieu 205/306: ${prioMissing} · one-way thieu 267: ${onewayNoSign}`);
    for (const t of signSamples) console.log(`   ${t}`);

    // Regression guard
    expect(clashCount).toBe(0);
    expect(sawtooth).toBeLessThanOrEqual(800);
    expect(signBad).toBeLessThanOrEqual(5);
    expect(prioMissing).toBeLessThanOrEqual(1); // n228: 3 nhánh Bauhofstraße chụm sát nhà ở mép map

    console.log(`\n[🤖 TỔNG] seam=${seams.length} cụm · sawtooth=${sawtooth} điểm · nhà lỗi=${clashCount} · cầu=${bridgesOverWater}\n`);

    // Regression guard: nhà không được lún lòng đường; sawtooth phải hiếm dần
    // (seam INFO — gồm dải phân cách chủ đích, không assert)
    expect(clashCount).toBe(0);
    expect(sawtooth).toBeLessThanOrEqual(800);
  });
});
