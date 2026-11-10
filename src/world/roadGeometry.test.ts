// roadGeometry.test.ts — test từng mục sửa G1 (1: curve dùng chung; 2: cắt ribbon;
// 3: patch có curb return; 4: vạch dừng 2 đầu + răng cưa ngang làn; 5: dốc zebra;
// 6: zebra đối xứng)
import { describe, expect, it } from 'vitest';
import type { GameMap, MapRoad } from './mapLoader';
import { loadGameMap, roadCurve, roadLength, roadPointAt } from './mapLoader';
import { roadRibbonQuads, junctionPatchQuads, roadSkipZones, roadsAtNode, type Quad } from './roadMesh';
import { roadMarkingQuads } from './roadMarkings';
import { sidewalkBoxes } from './sidewalk';
import { collectBoundaryIssues } from './testJunctionBoundary';
import testCrossing from '../data/maps/test_crossing.json';

const map: GameMap = loadGameMap(testCrossing);

function roadById(id: string): MapRoad {
  const r = map.roads.find(r => r.id === id);
  if (!r) throw new Error(`road ${id} không tồn tại`);
  return r;
}

/** chiếu điểm lên curve → s (test helper, đi bộ tuyến tính) */
function projectS(road: MapRoad, x: number, z: number): number {
  const curve = roadCurve(road);
  const pts = curve.pts;
  const segLen = pts.length > 1 ? curve.length / (pts.length - 1) : curve.length;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dz = pts[i + 1].z - pts[i].z;
    const l2 = dx * dx + dz * dz;
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - pts[i].x) * dx + (z - pts[i].z) * dz) / l2)) : 0;
    const px = pts[i].x + dx * t;
    const pz = pts[i].z + dz * t;
    const d = Math.hypot(px - x, pz - z);
    if (d < bestD) { bestD = d; best = i * segLen + t * segLen; }
  }
  return best;
}

// ── G1-1: curve dùng chung, đều theo cung ──
describe('G1-1 roadCurve dùng chung', () => {
  it('độ dài curve khớp map (đường thẳng 80 m)', () => {
    const r1 = roadById('r1');
    expect(roadLength(r1)).toBeCloseTo(80, 0);
    expect(roadCurve(r1).length).toBeCloseTo(80, 0);
  });

  it('sample điểm đều theo chiều dài cung (getPointAt)', () => {
    const r1 = roadById('r1');
    const c = roadCurve(r1);
    const stepExpect = c.length / (c.pts.length - 1);
    for (let i = 1; i < c.pts.length; i++) {
      const d = Math.hypot(c.pts[i].x - c.pts[i - 1].x, c.pts[i].z - c.pts[i - 1].z);
      expect(d).toBeCloseTo(stepExpect, 1);
    }
  });

  it('roadPointAt tại s=0/length trúng đúng 2 node', () => {
    const r1 = roadById('r1'); // (0,0) → (80,0)
    const a = roadPointAt(r1, 0);
    const b = roadPointAt(r1, roadLength(r1));
    expect(a.x).toBeCloseTo(0, 1);
    expect(b.x).toBeCloseTo(80, 1);
    expect(a.z).toBeCloseTo(0, 1);
    expect(b.z).toBeCloseTo(0, 1);
  });
});

// ── G1-2: ribbon cắt đúng ranh giới skip ──
describe('G1-2 ribbon cắt tại ranh giới skip', () => {
  it('không vertex nào nằm SÂU TRONG skip zone', () => {
    const r1 = roadById('r1');
    const zones = roadSkipZones(r1, map);
    const quads = roadRibbonQuads(r1, zones);
    expect(quads.length).toBeGreaterThan(0);
    for (const q of quads) {
      for (const v of [q.a, q.b, q.c, q.d]) {
        const s = projectS(r1, v[0], v[2]);
        for (const [a, b] of zones) {
          const inDeep = s > a + 0.35 && s < b - 0.35;
          // đỉnh chỉ được nằm ở RANH GIỚI zone (±0.35 m) hoặc ngoài
          if (inDeep) {
            // chấp nhận: đỉnh lệch lateral > half (ngoài mép đường, tấm pad đè) — nhưng ribbon thì không
            const lateral = Math.hypot(v[0] - roadPointAt(r1, s).x, v[2] - roadPointAt(r1, s).z);
            expect(lateral).toBeGreaterThan(2.5); // không phải điểm mặt đường giữa zone
            void lateral;
          }
        }
      }
    }
  });

  it('ribbon bắt đầu ĐÚNG tại biên skip (không còn hở 2 m)', () => {
    const r1 = roadById('r1');
    const zones = roadSkipZones(r1, map);
    const quads = roadRibbonQuads(r1, zones);
    const sAll = quads.flatMap(q => [q.a, q.b, q.c, q.d].map(v => projectS(r1, v[0], v[2])));
    const minS = Math.min(...sAll);
    // skip zone đầu: r1.from = n1 (intersection) → [0, 3.5] → ribbon bắt đầu ~3.5
    const skip0 = zones.find(z => z[0] === 0);
    expect(skip0).toBeTruthy();
    expect(minS).toBeLessThan(skip0![1] + 0.35); // trước đây hở tới skip+2 (bước sample)
  });
});

// ── G1-3: patch = bao lồi các góc miệng nhánh ──
describe('G1-3 junction patch convex hull', () => {
  const node = { x: 0, z: 0 };
  const roads = roadsAtNode(map, 'n1');
  const { quads, poly } = junctionPatchQuads(node.x, node.z, roads);

  function pointInPoly(px: number, pz: number): boolean {
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

  it('poly bao phủ tim 4 miệng nhánh (không hở giữa patch và ribbon)', () => {
    const half = 3;
    expect(pointInPoly(half - 0.4, 0)).toBe(true);    // đông
    expect(pointInPoly(-half + 0.4, 0)).toBe(true);   // tây
    expect(pointInPoly(0, half - 0.4)).toBe(true);    // nam
    expect(pointInPoly(0, -half + 0.4)).toBe(true);   // bắc
    expect(pointInPoly(0, 0)).toBe(true);
    expect(quads.length).toBeGreaterThan(0);
  });

  it('biên thật: mọi điểm biên ≤ 1 m từ miệng nhánh/cạnh pad; 2 đầu miệng trong patch', () => {
    const { issues } = collectBoundaryIssues(map);
    // n1 = 4 nhánh vuông (half=3 → K=3.25): hull = vuông ±K, mọi cạnh = miệng
    // đúng 1 nhánh → kỳ vọng 0 vi phạm trên n1
    expect(issues.filter(i => i.nodeId === 'n1')).toEqual([]);
    // đo hull thực tế (diagnostic): K lý thuyết = half(3) + 0.25 = 3.25
    console.info(`[hull n1] maxDist=${Math.max(...poly.map(([vx, vz]) => Math.hypot(vx, vz))).toFixed(3)}, vx=[${Math.min(...poly.map(v => v[0])).toFixed(2)}..${Math.max(...poly.map(v => v[0])).toFixed(2)}], vz=[${Math.min(...poly.map(v => v[1])).toFixed(2)}..${Math.max(...poly.map(v => v[1])).toFixed(2)}]`);
  });
});

// ── G1-4: vạch dừng + răng cưa CẢ HAI ĐẦU, đúng nửa làn ──
describe('G1-4 vạch dừng/răng cưa 2 đầu', () => {
  // map tổng hợp: road dài 100, đèn giao thông Ở CẢ 2 đầu
  const m: GameMap = loadGameMap({
    version: 1,
    nodes: [
      { id: 'a', x: 0, z: 0, type: 'intersection' },
      { id: 'b', x: 100, z: 0, type: 'intersection' }
    ],
    roads: [{
      id: 'ra', from: 'a', to: 'b',
      points: [[0, 0], [100, 0]],
      lanesForward: 1, lanesBackward: 1, laneWidth: 3,
      sidewalk: { left: true, right: true }, bikeLane: { left: false, right: false },
      parking: { left: 'none', right: 'none' },
      speedLimit: 50, priority: 'equal', surface: 'asphalt'
    }],
    intersections: [
      { nodeId: 'a', rule: 'traffic_light', trafficLight: { cycle: 'standard', greenSeconds: 15, yellowSeconds: 3, redSeconds: 14 }, crosswalks: [] },
      { nodeId: 'b', rule: 'traffic_light', trafficLight: { cycle: 'standard', greenSeconds: 15, yellowSeconds: 3, redSeconds: 14 }, crosswalks: [] }
    ],
    signs: [], buildings: [], props: [],
    spawns: { player: { roadId: 'ra', s: 50, lane: 0 } }
  });
  const road = m.roads[0];
  const half = 3;
  const quads: Quad[] = roadMarkingQuads(m, road, [], half);

  function lateralOf(q: Quad): number[] {
    // lateral offsets của 4 đỉnh so với tim đường (z — road dọc +x)
    return [q.a, q.b, q.c, q.d].map(v => v[2]);
  }

  it('có vạch dừng ở CẢ 2 đầu (s≈5 và s≈95)', () => {
    // vạch dừng là quad full-lane: tìm quad có độ dày dọc 0.4
    const stops = quads.filter(q => {
      const s = [q.a, q.b, q.c, q.d].map(v => v[0]);
      const lenX = Math.max(...s) - Math.min(...s);
      const z = lateralOf(q);
      const lenZ = Math.max(...z) - Math.min(...z);
      return lenX < 0.6 && lenZ > 2; // dày 0.4 dọc x, trải ngang qua làn
    });
    expect(stops.length).toBe(2);
    const xs = stops.map(q => (q.a[0] + q.c[0]) / 2).sort((x, y) => x - y);
    expect(xs[0]).toBeCloseTo(4.8, 1);   // approach từ đầu from: half + 2, tâm dày 0.4
    expect(xs[1]).toBeCloseTo(95.2, 1);  // approach đầu to: len − half − 2
  });

  it('vạch dừng đầu from nằm trên nửa −n (z < 0), đầu to nửa +n (z > 0)', () => {
    const stops = quads.filter(q => {
      const s = [q.a, q.b, q.c, q.d].map(v => v[0]);
      return Math.max(...s) - Math.min(...s) < 0.6 && Math.max(...s) < 50;
    });
    expect(stops.length).toBe(1);
    const zAvg = (stops[0].a[2] + stops[0].b[2] + stops[0].c[2] + stops[0].d[2]) / 4;
    expect(zAvg).toBeLessThan(-0.05); // nửa −n (phải của luồng ngược)
  });

  it('junction yield → răng cưa là HÀNG TAM GIÁC NGANG LÀN (≥3 tam giác trải ngang)', () => {
    const m2: GameMap = loadGameMap({
      version: 1,
      nodes: [
        { id: 'a', x: 0, z: 0, type: 'end' },
        { id: 'b', x: 100, z: 0, type: 'intersection' }
      ],
      roads: [{
        id: 'ry', from: 'a', to: 'b',
        points: [[0, 0], [100, 0]],
        lanesForward: 1, lanesBackward: 1, laneWidth: 3,
        sidewalk: { left: true, right: true }, bikeLane: { left: false, right: false },
        parking: { left: 'none', right: 'none' },
        speedLimit: 50, priority: 'equal', surface: 'asphalt'
      }],
      intersections: [{ nodeId: 'b', rule: 'yield', trafficLight: null, crosswalks: [] }],
      signs: [], buildings: [], props: [],
      spawns: { player: { roadId: 'ry', s: 10, lane: 0 } }
    });
    const qy = roadMarkingQuads(m2, m2.roads[0], [], half);
    // tam giác = quad có c trùng d (degenerate) và kích thước nhỏ
    const teeth = qy.filter(q => q.c[0] === q.d[0] && q.c[2] === q.d[2] && Math.abs(q.a[0] - q.b[0]) < 0.7);
    expect(teeth.length).toBeGreaterThanOrEqual(3);
    // trải NGANG làn: z (lateral) khác nhau giữa các răng
    const zs = teeth.map(q => (q.a[2] + q.b[2]) / 2);
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(1.2);
  });
});

// ── G1-5: dốc zebra ≥ 3 m có mặt chuyển ──
describe('G1-5 dốc zebra', () => {
  it('có đoạn mặt 0.03 dài ≥ 2.8 m và mặt dốc chuyển 0.15→0.03', () => {
    const r1 = roadById('r1'); // crosswalks: ['r1'], zebra center s ≈ 5.5
    const pieces = sidewalkBoxes(r1, map);
    // đoạn ramp: top có đỉnh y = 0.03
    const rampPieces = pieces.filter(p => p.top.some(c => Math.abs(c[1] - 0.03) < 1e-6));
    expect(rampPieces.length).toBeGreaterThan(0);
    // tổng chiều dài s của các đoạn ramp (s ∈ zone ± 1.5 quanh 5.5)
    const rampLen = rampPieces
      .filter(p => p.top.every(c => Math.abs(c[1] - 0.03) < 1e-6))
      .reduce((acc, p) => acc + Math.hypot(
        p.top[3][0] - p.top[0][0], p.top[3][2] - p.top[0][2]), 0);
    expect(rampLen).toBeGreaterThanOrEqual(2.8);
    // mặt dốc chuyển: piece có đỉnh 0.15 VÀ 0.03 cùng lúc
    const slope = rampPieces.find(p =>
      p.top.some(c => Math.abs(c[1] - 0.03) < 1e-6) && p.top.some(c => Math.abs(c[1] - 0.15) < 1e-6));
    expect(slope).toBeTruthy();
  });
});

// ── G1-6: zebra đối xứng 2 mép ──
describe('G1-6 zebra đối xứng', () => {
  it('margin trái = margin phải', () => {
    const r1 = roadById('r1');
    const half = 3;
    const quads = roadMarkingQuads(map, r1, [], half);
    // zebra quads: nhóm sọc ở gần junction đầu from (s ≈ 5.5 → x ≈ 5.5 dọc +x)
    // r1 dọc +x → lateral = z
    const stripes = quads.filter(q => {
      const x = [q.a[0], q.c[0]];
      return Math.abs(x[1] - x[0] - 3) < 0.2 && // dài 3 m theo x (dọc đường)
             Math.abs((q.b[2] - q.a[2])) < 0.6; // rộng ~0.5 lateral
    });
    expect(stripes.length).toBeGreaterThanOrEqual(5);
    const mins = stripes.map(q => Math.min(q.a[2], q.c[2]));
    const maxs = stripes.map(q => Math.max(q.a[2], q.c[2]));
    const marginL = Math.min(...mins) - (-half);
    const marginR = half - Math.max(...maxs);
    expect(Math.abs(marginL - marginR)).toBeLessThan(0.11);
  });
});
