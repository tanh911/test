// 🛡️ mapIntegrityAudit.test.ts — Kiểm thử kiểm toán bất biến trên Berlin OSM Legacy và ExamParcours.
import { describe, expect, it } from 'vitest';
import berlinMitteMap from '../data/maps/berlin-mitte-clean.json';
import { generateExamParcoursMap } from '../data/maps/examParcours';
import type { GameMap } from './mapLoader';
import { loadGameMap } from './mapLoader';
import {
  auditStrictVisualSidewalkAndTriangles,
  describeMapIntegrityAudit
} from './mapIntegrityHelpers';

// Re-export để backward-compatibility nếu có chỗ khác import
export * from './mapIntegrityHelpers';

// 1. Chạy bộ kiểm toán bất biến trên Berlin-Mitte OSM (với SV1 được đánh dấu expected fail có lý do)
const berlinLoaded = loadGameMap(berlinMitteMap);
describeMapIntegrityAudit('berlin-mitte-clean.json (OSM Legacy)', berlinLoaded, {
  twoWay267Exceptions: ['r149'],
  expectStrictVisualFailReason:
    '90/127 nút giao Berlin OSM có đỉnh vỉa hè đâm vào lòng đường (max 6.127m tại n51) do góc xiên 60-75° và lệch bề rộng lớn',
});

describe('🔍 Kiểm chứng số liệu SV1 thực tế trên Berlin & độ nhạy của Helper (Sửa nhỏ #2)', () => {
  it('Berlin-Mitte OSM có đúng 90/127 nút giao vi phạm SV1 và maxIntrusion ≈ 6.127m tại n51', () => {
    const sv = auditStrictVisualSidewalkAndTriangles(berlinLoaded);
    expect(sv.violatingNodes.length).toBe(90);
    expect(sv.maxIntrusionM).toBeCloseTo(6.127, 2);
    expect(sv.violatingNodes[0]?.nodeId).toBe('n51');
  });

  it('Helper SV1 bắt được lỗi trên map 1 nút góc xiên 60° (điểm mù cos 60° < 0.64)', () => {
    const L = 40;
    const rad60 = (60 * Math.PI) / 180;
    const skewedMap: GameMap = loadGameMap({
      version: 1,
      nodes: [
        { id: 'n0', x: 0, z: 0, type: 'intersection' },
        { id: 'n1', x: L, z: 0, type: 'end' },
        { id: 'n2', x: Math.cos(rad60) * L, z: Math.sin(rad60) * L, type: 'end' },
        { id: 'n3', x: -L, z: 0, type: 'end' },
      ],
      roads: [
        {
          id: 'r1',
          from: 'n0',
          to: 'n1',
          points: [[0, 0], [L / 2, 0], [L, 0]],
          lanesForward: 1,
          lanesBackward: 1,
          laneWidth: 3.5,
          sidewalk: { left: true, right: true },
          bikeLane: { left: false, right: false },
          parking: { left: 'none', right: 'none' },
          speedLimit: 50,
          priority: 'equal',
          surface: 'asphalt',
        },
        {
          id: 'r2',
          from: 'n0',
          to: 'n2',
          points: [
            [0, 0],
            [(Math.cos(rad60) * L) / 2, (Math.sin(rad60) * L) / 2],
            [Math.cos(rad60) * L, Math.sin(rad60) * L],
          ],
          lanesForward: 1,
          lanesBackward: 1,
          laneWidth: 3.5,
          sidewalk: { left: true, right: true },
          bikeLane: { left: false, right: false },
          parking: { left: 'none', right: 'none' },
          speedLimit: 50,
          priority: 'equal',
          surface: 'asphalt',
        },
        {
          id: 'r3',
          from: 'n0',
          to: 'n3',
          points: [[0, 0], [-L / 2, 0], [-L, 0]],
          lanesForward: 1,
          lanesBackward: 1,
          laneWidth: 3.5,
          sidewalk: { left: true, right: true },
          bikeLane: { left: false, right: false },
          parking: { left: 'none', right: 'none' },
          speedLimit: 50,
          priority: 'equal',
          surface: 'asphalt',
        },
      ],
      intersections: [{ nodeId: 'n0', rule: 'right_before_left', trafficLight: null, crosswalks: [] }],
      signs: [],
      buildings: [],
      props: [],
      spawns: { player: { roadId: 'r1', s: 10, lane: 0 } },
    });
    const sv = auditStrictVisualSidewalkAndTriangles(skewedMap);
    expect(sv.violatingNodes.length).toBe(1);
    expect(sv.violatingNodes[0].nodeId).toBe('n0');
    expect(sv.maxIntrusionM).toBeGreaterThan(2.5);
  });
});

// 2. Chạy bộ kiểm toán bất biến trên ExamParcours (map dựng tay chuẩn 90° — phải PASS cả SV1!)
describeMapIntegrityAudit('examParcours.ts (Map chuẩn 90°)', loadGameMap(generateExamParcoursMap()));
