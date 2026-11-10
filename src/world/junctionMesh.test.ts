import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildJunctionMesh, roadHalfWidth, roadsAtNode } from './roadMesh';
import type { GameMap, MapRoad } from './mapLoader';
import { loadGameMap } from './mapLoader';
import muenchenJson from '../data/maps/muenchen-altstadt-clean.json';

function makeMockRoad(id: string, from: string, to: string, lanesForward: number, lanesBackward: number, laneWidth: number, len = 50): MapRoad {
  return {
    id,
    from,
    to,
    points: [[0, 0], [len, 0]],
    lanesForward,
    lanesBackward,
    laneWidth,
    sidewalk: { left: true, right: true },
    bikeLane: { left: false, right: false },
    parking: { left: 'none', right: 'none' },
    speedLimit: 50,
    priority: 'main',
    surface: 'asphalt'
  };
}

/** Tính diện tích đa giác 2D theo công thức Shoelace */
function polygonArea(pts: Array<[number, number]>): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(area) / 2;
}

/** Kiểm tra 2 đoạn thẳng có cắt nhau không (loại trừ các đầu mút chung) */
function segmentsIntersect(p1: [number, number], p2: [number, number], p3: [number, number], p4: [number, number]): boolean {
  const ccw = (a: [number, number], b: [number, number], c: [number, number]) =>
    (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

/** Kiểm tra perimeter có tự cắt không */
function hasSelfIntersection(perimeter: Array<[number, number]>): boolean {
  const n = perimeter.length;
  for (let i = 0; i < n; i++) {
    const p1 = perimeter[i];
    const p2 = perimeter[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue; // bỏ qua cạnh liền kề
      const p3 = perimeter[j];
      const p4 = perimeter[(j + 1) % n];
      if (segmentsIntersect(p1, p2, p3, p4)) return true;
    }
  }
  return false;
}

/** Tính tổng diện tích các tam giác của mesh nhựa */
function meshArea(quads: Array<{ a: [number, number, number]; b: [number, number, number]; c: [number, number, number]; d: [number, number, number] }>): number {
  let total = 0;
  for (const q of quads) {
    // Tam giác a-b-c
    const abx = q.b[0] - q.a[0], abz = q.b[2] - q.a[2];
    const acx = q.c[0] - q.a[0], acz = q.c[2] - q.a[2];
    total += Math.abs(abx * acz - abz * acx) / 2;
  }
  return total;
}

describe('Unified Junction Architecture (buildJunctionMesh) - Kiểm Thử Hình Học Nghiêm Ngặt', () => {
  it('1. Ngã tư 4 nhánh vuông góc 90°: Không tự cắt, bảo toàn diện tích giữa poly và mesh', () => {
    const rEast = makeMockRoad('rE', 'n0', 'nE', 1, 1, 3.5);
    const rNorth = makeMockRoad('rN', 'n0', 'nN', 1, 1, 3.5);
    const rWest = makeMockRoad('rW', 'n0', 'nW', 1, 1, 3.5);
    const rSouth = makeMockRoad('rS', 'n0', 'nS', 1, 1, 3.5);

    const connected = [
      { road: rEast, dirX: 1, dirZ: 0 },
      { road: rNorth, dirX: 0, dirZ: -1 },
      { road: rWest, dirX: -1, dirZ: 0 },
      { road: rSouth, dirX: 0, dirZ: 1 }
    ];

    const res = buildJunctionMesh(0, 0, connected);
    expect(res.asphaltQuads.length).toBeGreaterThan(0);
    expect(res.sidewalkQuads.length).toBeGreaterThan(0);

    // Kiểm tra không tự cắt
    expect(hasSelfIntersection(res.poly)).toBe(false);

    // Kiểm tra bảo toàn diện tích: Shoelace vs Triangulation
    const sPoly = polygonArea(res.poly);
    const sMesh = meshArea(res.asphaltQuads);
    expect(Math.abs(sPoly - sMesh)).toBeLessThan(0.05);
  });

  it('2. Ngã ba chữ T 3 nhánh: Tâm lệch không gây lỗi, bảo toàn diện tích', () => {
    const rEast = makeMockRoad('rE', 'n0', 'nE', 1, 1, 3.5);
    const rWest = makeMockRoad('rW', 'n0', 'nW', 1, 1, 3.5);
    const rSouth = makeMockRoad('rS', 'n0', 'nS', 1, 1, 3.5);

    const connected = [
      { road: rEast, dirX: 1, dirZ: 0 },
      { road: rWest, dirX: -1, dirZ: 0 },
      { road: rSouth, dirX: 0, dirZ: 1 }
    ];

    const res = buildJunctionMesh(0, 0, connected);
    expect(hasSelfIntersection(res.poly)).toBe(false);

    const sPoly = polygonArea(res.poly);
    const sMesh = meshArea(res.asphaltQuads);
    expect(Math.abs(sPoly - sMesh)).toBeLessThan(0.05);
  });

  it('3. Ngã 5 nhánh không đều (5-way): CCW sorting chuẩn, không tự cắt', () => {
    const angles = [0, 1.05, 2.27, 3.66, 5.23];
    const connected = angles.map((ang, i) => {
      const road = makeMockRoad(`r${i}`, 'n0', `n${i}`, 1, 1, 3.0);
      return {
        road,
        dirX: Math.cos(ang),
        dirZ: -Math.sin(ang)
      };
    });

    const res = buildJunctionMesh(0, 0, connected);
    expect(hasSelfIntersection(res.poly)).toBe(false);

    const sPoly = polygonArea(res.poly);
    const sMesh = meshArea(res.asphaltQuads);
    expect(Math.abs(sPoly - sMesh)).toBeLessThan(0.05);
  });

  it('4. Cặp nhánh góc nhọn 18° (Acute fork n153 / gore): Bảo toàn diện tích và không tự cắt', () => {
    const ang1 = 0.15; // ~8.6 độ
    const ang2 = -0.15; // ~ -8.6 độ (chênh lệch ~17.2 độ)
    const ang3 = Math.PI; // nhánh đối diện 180 độ

    const connected = [
      { road: makeMockRoad('rFork1', 'n0', 'nF1', 1, 0, 3.5), dirX: Math.cos(ang1), dirZ: -Math.sin(ang1) },
      { road: makeMockRoad('rFork2', 'n0', 'nF2', 1, 0, 3.5), dirX: Math.cos(ang2), dirZ: -Math.sin(ang2) },
      { road: makeMockRoad('rOpp', 'n0', 'nOpp', 2, 0, 3.5), dirX: Math.cos(ang3), dirZ: -Math.sin(ang3) }
    ];

    const res = buildJunctionMesh(0, 0, connected);
    expect(hasSelfIntersection(res.poly)).toBe(false);

    const sPoly = polygonArea(res.poly);
    const sMesh = meshArea(res.asphaltQuads);
    expect(Math.abs(sPoly - sMesh)).toBeLessThan(0.05);
  });

  it('5. Toàn bộ 127 ngã tư München Altstadt: 100% không tự cắt, 100% bảo toàn diện tích Shoelace = Mesh', () => {
    const map: GameMap = loadGameMap(muenchenJson);
    let testedCount = 0;
    let maxAreaDiff = 0;

    for (const ix of map.intersections) {
      const node = map.nodes.find(n => n.id === ix.nodeId);
      if (!node) continue;
      const connected = roadsAtNode(map, ix.nodeId);
      if (connected.length < 2) continue;

      testedCount++;
      const res = buildJunctionMesh(node.x, node.z, connected);

      // Không tự cắt
      expect(hasSelfIntersection(res.poly)).toBe(false);

      // Bảo toàn diện tích giữa đa giác biên và lưới tam giác earcut
      const sPoly = polygonArea(res.poly);
      const sMesh = meshArea(res.asphaltQuads);
      const diff = Math.abs(sPoly - sMesh);
      if (diff > maxAreaDiff) maxAreaDiff = diff;
      expect(diff).toBeLessThan(0.05);

      // Không có tọa độ NaN
      for (const q of res.asphaltQuads) {
        expect(Number.isNaN(q.a[0])).toBe(false);
        expect(Number.isNaN(q.a[1])).toBe(false);
        expect(Number.isNaN(q.a[2])).toBe(false);
      }
    }

    expect(testedCount).toBe(127);
    expect(maxAreaDiff).toBeLessThan(0.05);
  });
});

// ── Winding regression: mọi quad junction phải cross < 0 trong mặt (x,z) —
// cùng chiều với ribbon; cross > 0 bị backface-cull từ trên cao (nhựa "biến mất",
// lộ nền đá phía dưới) — bug thật đã bị chụp màn hình trên bigMap + muenchen.
import { generateBigMap } from '../data/maps/bigMap';

function quadCross(q: { a: number[]; b: number[]; c: number[]; d: number[] }): number {
  return (q.b[0] - q.a[0]) * (q.c[2] - q.a[2]) - (q.b[2] - q.a[2]) * (q.c[0] - q.a[0]);
}

describe('junction winding (cross < 0 khớp ribbon — chống backface-cull)', () => {
  it('mọi asphalt/sidewalk quad của mọi giao lộ có cross < 0', () => {
    const maps: Array<[string, GameMap]> = [
      ['muenchen', muenchenJson as unknown as GameMap],
      ['bigMap', generateBigMap() as unknown as GameMap]
    ];
    for (const [name, map] of maps) {
      const seen = new Set<string>();
      let checked = 0;
      let bad = 0;
      for (const ix of map.intersections) {
        if (seen.has(ix.nodeId)) continue;
        seen.add(ix.nodeId);
        const n = nodeById(map, ix.nodeId);
        if (!n) continue;
        const roads = roadsAtNode(map, ix.nodeId);
        if (roads.length < 2) continue;
        const junc = buildJunctionMesh(n.x, n.z, roads);
        for (const q of [...junc.asphaltQuads, ...junc.sidewalkQuads]) {
          checked++;
          if (quadCross(q) > 0) bad++;
        }
      }
      expect(checked).toBeGreaterThan(100);
      expect(bad).toBe(0);
    }
  });
});
