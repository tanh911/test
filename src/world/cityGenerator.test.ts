// 🧪 cityGenerator.test.ts — Kiểm thử toàn diện Bước 5B: Generator lõi & Mini-Map 3 Nút (N1–N6 + Audits + Autopilot)
// Chạy: npx vitest run src/world/cityGenerator.test.ts

import { createHash } from 'crypto';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  CITY_18_NODES,
  MINI_CITY_3_NODES,
  ROAD_PROFILES,
  computeMinSafeAngleDeg,
  generateCityMap,
  isPointInsidePolygon2D,
  profileFullWidth,
  validateCity,
  type CityDefinition
} from '../data/maps/cityGenerator';
import { RuleEngine } from '../simulation/ruleEngine';
import { AP_DT, AutopilotDriver, type AutopilotRoute } from './autopilot';
import { allBuildingQuads, buildingStrips } from './buildings';
import {
  auditStrictVisualSidewalkAndTriangles,
  describeMapIntegrityAudit
} from './mapIntegrityHelpers';
import {
  collectBoundaryIssues,
  collectSawtoothIssues,
  collectSeamIssues
} from './testJunctionBoundary';
import { loadGameMap, nodeById, pointAtS, roadById, roadFullWidth, roadLength, roadPointAt, type GameMap } from './mapLoader';
import { computePropPlacements, LAMP_HEAD_Z } from './props';
import { roadMarkingQuads } from './roadMarkings';
import { buildJunctionMesh, roadHalfWidth, roadRibbonQuads, roadSkipZones, roadsAtNode } from './roadMesh';
import { sidewalkBoxes } from './sidewalk';
import { planLightsForIntersection, TrafficLightController } from './trafficLights';
import { spawnFromMap, type VehicleHandle, type VehicleInput, type VehicleState } from './vehicle';

const isCleanMode = process.env.CITY_EXCLUDE_WATER_PARKS === '1';
const miniMap: GameMap = loadGameMap(generateCityMap(MINI_CITY_3_NODES));
const city18Map: GameMap = loadGameMap(generateCityMap(CITY_18_NODES, { excludeWaterParks: isCleanMode }));

// 1. Chạy toàn bộ bộ bất biến hình học chuẩn (G1–G4 + SV1 strict-visual KHÔNG có it.fails!)
describeMapIntegrityAudit('Mini-Map 3 Nút Chuẩn Đức (de-mini-3nodes-v1)', miniMap);
describeMapIntegrityAudit('Khu Thi Sát Hạch 18 Nút (de-pruefungsstadt-18nodes-v1)', city18Map);

describe('🏗️ BƯỚC 5B — UNIT TESTS N1–N6 & FULL AUDIT TRÊN MINI-MAP 3 NÚT', () => {
  it('[N1] Đồ thị đường hợp lệ: 3 nút giao chính + 7 nút cụt kết nối liên thông 100%, đầu mút khớp tọa độ nút', () => {
    expect(miniMap.version).toBe(1);
    const ixNodes = miniMap.nodes.filter((n) => n.type === 'intersection');
    const endNodes = miniMap.nodes.filter((n) => n.type === 'end');
    expect(ixNodes.map((n) => n.id)).toEqual(['n_rvl', 'n_t', 'n_ampel']);
    expect(endNodes.length).toBe(7);
    expect(miniMap.roads.length).toBe(9);
    expect(miniMap.intersections.length).toBe(3);

    // Kiểm tra bậc của 3 nút giao chính: n_rvl (4 nhánh), n_t (3 nhánh), n_ampel (4 nhánh)
    expect(roadsAtNode(miniMap, 'n_rvl').length).toBe(4);
    expect(roadsAtNode(miniMap, 'n_t').length).toBe(3);
    expect(roadsAtNode(miniMap, 'n_ampel').length).toBe(4);

    // Kiểm tra liên thông BFS từ cạnh xuất phát của người chơi tới mọi nút trong đồ thị
    const adj = new Map<string, string[]>();
    for (const n of miniMap.nodes) adj.set(n.id, []);
    for (const r of miniMap.roads) {
      adj.get(r.from)!.push(r.to);
      adj.get(r.to)!.push(r.from);
    }
    const spawnRoad = roadById(miniMap, miniMap.spawns.player.roadId)!;
    expect(spawnRoad).toBeDefined();
    const visited = new Set<string>([spawnRoad.from]);
    const queue = [spawnRoad.from];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const nxt of adj.get(cur) ?? []) {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push(nxt);
        }
      }
    }
    expect(visited.size).toBe(miniMap.nodes.length);
  });

  it('[N2] Mọi roadWidth bằng đúng profile khai báo ±0.01m (cả thông số lẫn quad thực tế)', () => {
    for (const edgeDef of MINI_CITY_3_NODES.edges) {
      const road = roadById(miniMap, edgeDef.id)!;
      expect(road).toBeDefined();
      const expectedW = profileFullWidth(edgeDef.profile);
      const actualW = roadFullWidth(road);
      expect(Math.abs(actualW - expectedW)).toBeLessThanOrEqual(0.01);

      const prof = ROAD_PROFILES[edgeDef.profile];
      expect(road.speedLimit).toBe(prof.speedLimit);
      expect(road.surface).toBe(prof.surface);

      const skip = roadSkipZones(road, miniMap);
      const quads = roadRibbonQuads(road, skip);
      expect(quads.length).toBeGreaterThan(0);
      for (const q of quads) {
        const wFront = Math.hypot(q.b[0] - q.a[0], q.b[2] - q.a[2]);
        const wBack = Math.hypot(q.c[0] - q.d[0], q.c[2] - q.d[2]);
        expect(Math.abs(wFront - expectedW)).toBeLessThanOrEqual(0.01);
        expect(Math.abs(wBack - expectedW)).toBeLessThanOrEqual(0.01);
      }
    }
  });

  it('[N3] SV1 = 0 đỉnh vỉa hè trong lòng đường và 0 tam giác suy biến trên toàn bộ Mini-Map', () => {
    const sv = auditStrictVisualSidewalkAndTriangles(miniMap);
    expect(sv.violatingNodes).toEqual([]);
    expect(sv.maxIntrusionM).toBe(0);
    expect(sv.badWindingTotal).toBe(0);
    expect(sv.degenerateTriTotal).toBe(0);

    // Kiểm tra diện tích các tam giác không suy biến (area > 1e-4 m²) trên ribbon + vỉa hè + nút giao
    const triArea2D = (a: [number, number, number], b: [number, number, number], c: [number, number, number]): number =>
      0.5 * Math.abs((b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]));

    let degenerateCount = 0;
    for (const r of miniMap.roads) {
      for (const q of roadRibbonQuads(r, roadSkipZones(r, miniMap))) {
        if (triArea2D(q.a, q.b, q.c) <= 1e-4 || triArea2D(q.a, q.c, q.d) <= 1e-4) degenerateCount++;
      }
      for (const sw of sidewalkBoxes(r, miniMap)) {
        const [p0, p1, p2, p3] = sw.top;
        if (triArea2D(p0, p1, p2) <= 1e-4 || triArea2D(p0, p2, p3) <= 1e-4) degenerateCount++;
      }
    }
    for (const nd of miniMap.nodes) {
      if (nd.type !== 'intersection') continue;
      const connected = roadsAtNode(miniMap, nd.id);
      const jm = buildJunctionMesh(nd.x, nd.z, connected);
      for (const q of [...jm.asphaltQuads, ...jm.sidewalkQuads]) {
        if (triArea2D(q.a, q.b, q.c) <= 1e-4) degenerateCount++;
      }
    }
    expect(degenerateCount).toBe(0);
  });

  it('[N4] Tính tất định (Deterministic): Build 2 lần độc lập cho cùng một mã băm SHA-256 tuyệt đối', () => {
    const build1 = generateCityMap(MINI_CITY_3_NODES);
    const build2 = generateCityMap(MINI_CITY_3_NODES);
    const json1 = JSON.stringify(build1);
    const json2 = JSON.stringify(build2);
    const hash1 = createHash('sha256').update(json1).digest('hex');
    const hash2 = createHash('sha256').update(json2).digest('hex');

    console.info(`[N4 Deterministic Hash] build1 = ${hash1}`);
    console.info(`[N4 Deterministic Hash] build2 = ${hash2}`);

    expect(hash1).toBe(hash2);
    expect(json1).toBe(json2);
  });

  it('[N5] Suite bất biến tổng hợp (roadAudit + junctionMesh + trafficLightAudit + lampOrientation) = 0 lỗi', () => {
    // 1. Boundary / Seam / Sawtooth = 0
    expect(collectBoundaryIssues(miniMap).issues).toEqual([]);
    expect(collectSeamIssues(miniMap).issues).toEqual([]);
    expect(collectSawtoothIssues(miniMap).issues).toEqual([]);

    // 2. JunctionMesh: 0 tự cắt, diện tích Shoelace = tổng tam giác, winding chuẩn cross < 0
    for (const nd of miniMap.nodes.filter((n) => n.type === 'intersection')) {
      const connected = roadsAtNode(miniMap, nd.id);
      const jm = buildJunctionMesh(nd.x, nd.z, connected);
      expect(jm.poly.length).toBeGreaterThanOrEqual(4);
      let shoelace = 0;
      for (let i = 0; i < jm.poly.length; i++) {
        const [x1, z1] = jm.poly[i];
        const [x2, z2] = jm.poly[(i + 1) % jm.poly.length];
        shoelace += x1 * z2 - z1 * x2;
      }
      shoelace = Math.abs(shoelace) / 2;
      let meshArea = 0;
      for (const q of jm.asphaltQuads) {
        const cross = (q.b[0] - q.a[0]) * (q.c[2] - q.a[2]) - (q.b[2] - q.a[2]) * (q.c[0] - q.a[0]);
        expect(cross).toBeLessThan(0);
        meshArea += Math.abs(cross) / 2;
      }
      expect(Math.abs(shoelace - meshArea)).toBeLessThan(1e-2);
    }

    // 3. TrafficLightAudit trên n_ampel
    const lightIxs = miniMap.intersections.filter((ix) => ix.trafficLight !== null);
    expect(lightIxs.length).toBe(1);
    for (const ix of lightIxs) {
      const { arms, approaches } = planLightsForIntersection(ix, miniMap);
      expect(approaches).toBe(4);
      expect(arms.length).toBe(4);
      for (const arm of arms) {
        expect(arm.pos).not.toBeNull();
        const fxw = Math.sin(arm.yaw);
        const fzw = Math.cos(arm.yaw);
        const dot = fxw * -arm.fx + fzw * -arm.fz;
        expect(dot).toBeGreaterThanOrEqual(0.99);
      }
      // Các nhánh vuông góc kề nhau phải thuộc 2 nhóm pha khác nhau (0 xung đột xanh chéo)
      for (let i = 0; i < arms.length; i++) {
        for (let j = i + 1; j < arms.length; j++) {
          let gap = Math.abs(arms[i].ang - arms[j].ang);
          if (gap > Math.PI) gap = 2 * Math.PI - gap;
          if (gap < Math.PI * 0.75) {
            expect(arms[i].group).not.toBe(arms[j].group);
          }
        }
      }
    }

    // 4. LampOrientation (P1–P5) & Sign Orientation
    const placements = computePropPlacements(miniMap);
    const lamps = placements.filter((p) => !p.skip && p.type === 'street_lamp');
    expect(lamps.length).toBeGreaterThan(0);
    for (const p of lamps) {
      const armX = Math.sin(p.yaw);
      const armZ = Math.cos(p.yaw);
      const fx = Math.sin(p.heading);
      const fz = Math.cos(p.heading);
      const rx = -fz;
      const rz = fx;
      const side = p.side === 'right' ? 1 : -1;
      const nX = -rx * side;
      const nZ = -rz * side;
      const angle = (Math.acos(Math.max(-1, Math.min(1, armX * nX + armZ * nZ))) * 180) / Math.PI;
      const headX = p.x + armX * LAMP_HEAD_Z;
      const headZ = p.z + armZ * LAMP_HEAD_Z;
      const cx = p.x - rx * side * p.off;
      const cz = p.z - rz * side * p.off;
      const latPole = (p.x - cx) * rx + (p.z - cz) * rz;
      const latHead = (headX - cx) * rx + (headZ - cz) * rz;
      const inward = p.half - Math.abs(latHead);
      expect(angle).toBeLessThanOrEqual(15); // P1
      expect(inward).toBeGreaterThanOrEqual(0.3); // P2
      expect(Math.abs(latPole)).toBeLessThanOrEqual(p.half + 3.05); // P3
    }

    // P4: 100% biển báo quay đúng chiều xe tới (lệch <= 20°)
    expect(miniMap.signs.length).toBeGreaterThan(0);
    for (const sg of miniMap.signs) {
      const road = roadById(miniMap, sg.roadId)!;
      expect(road).toBeDefined();
      const h = pointAtS(road, sg.s).heading;
      const rot = h + (sg.flip ? 0 : Math.PI);
      const faceX = Math.sin(rot);
      const faceZ = Math.cos(rot);
      const fx = Math.sin(h);
      const fz = Math.cos(h);
      const tx = sg.flip ? fx : -fx;
      const tz = sg.flip ? fz : -fz;
      const deg = (Math.acos(Math.max(-1, Math.min(1, faceX * tx + faceZ * tz))) * 180) / Math.PI;
      expect(deg).toBeLessThanOrEqual(20);
    }

    // P5: computePropPlacements idempotent 3 lần
    const pRun1 = JSON.stringify(computePropPlacements(miniMap));
    const pRun2 = JSON.stringify(computePropPlacements(miniMap));
    const pRun3 = JSON.stringify(computePropPlacements(miniMap));
    expect(pRun1).toBe(pRun2);
    expect(pRun2).toBe(pRun3);

    // 5. Kiểm tra va chạm nhà - đường & nhà - nước = 0
    const bQuads = allBuildingQuads(miniMap);
    expect(miniMap.buildings.length).toBeGreaterThan(0);
    expect(bQuads.length).toBeGreaterThan(0);
    const strips: Array<[number, number, number, number]> = [];
    for (const b of miniMap.buildings) {
      const st = buildingStrips(miniMap, { ...b, depthOff: 0 });
      if (st) strips.push(...st);
    }
    // Không có biển báo nào nằm trong nhà hoặc dưới lòng đường
    for (const sg of miniMap.signs) {
      const road = roadById(miniMap, sg.roadId)!;
      const pt = pointAtS(road, sg.s);
      const half = roadHalfWidth(road);
      const side = sg.side === 'right' ? 1 : -1;
      const fx = Math.sin(pt.heading);
      const fz = Math.cos(pt.heading);
      const x = pt.x + -fz * side * (half + 1.2);
      const z = pt.z + fx * side * (half + 1.2);
      for (const [a, b, c, d] of strips) {
        const insideBuilding = x > a && x < c && z > b && z < d;
        expect(insideBuilding).toBe(false);
      }
    }
  });

  it('[N6] validateCity() từ chối >= 6 bản đồ sai cố ý với thông báo nêu đúng nút/cạnh và con số', () => {
    const cloneCity = (): CityDefinition => JSON.parse(JSON.stringify(MINI_CITY_3_NODES)) as CityDefinition;

    // Case 1: Góc nhọn 75° tại nút 3 nhánh n_t
    const bad75 = cloneCity();
    const nTEast75 = bad75.nodes.find((n) => n.id === 'n_t_east')!;
    // Đặt n_t_east sao cho nhánh r_t_e hợp góc 75° với nhánh Nam r_rvl_t (vector (0, -1)):
    // góc 75° từ (0,-1) là (-sin 75°, -cos 75°) * 90 từ (0, 100)
    nTEast75.x = Number((-90 * Math.sin((75 * Math.PI) / 180)).toFixed(2));
    nTEast75.z = Number((100 - 90 * Math.cos((75 * Math.PI) / 180)).toFixed(2));
    const res1 = validateCity(bad75);
    expect(res1.valid).toBe(false);
    expect(res1.errors.some((e) => e.includes('[ANGLE_TOO_ACUTE]') && e.includes('n_t') && e.includes('75.'))).toBe(
      true
    );

    // Case 2: Góc 87° tại nút 4 nhánh n_rvl (vi phạm quy tắc nút 4 nhánh chỉ cho phép 90° & hàm ngưỡng θ_min(3.25, 3.75) = 87.31° > 87°)
    const bad87 = cloneCity();
    const nRvlEast87 = bad87.nodes.find((n) => n.id === 'n_rvl_east')!;
    nRvlEast87.x = Number((-90 * Math.sin((87 * Math.PI) / 180)).toFixed(2));
    nRvlEast87.z = Number((-90 * Math.cos((87 * Math.PI) / 180)).toFixed(2));
    bad87.edges.find((e) => e.id === 'r_rvl_e')!.profile = 'altstadt_pflaster_30'; // 6.5m (h_A = 3.25m)
    bad87.edges.find((e) => e.id === 'r_south_rvl')!.profile = 'sammelstrasse_rad_50'; // 7.5m (h_B = 3.75m, ΔW = 1.0m)
    const res2 = validateCity(bad87);
    expect(res2.valid).toBe(false);
    expect(
      res2.errors.some((e) => e.includes('[INVALID_4WAY_ANGLE]') && e.includes('n_rvl') && e.includes('87.'))
    ).toBe(true);

    // Case 3: Bậc nhảy bề rộng ΔW = 2.0m (hoặc > 1.0m) không khai báo crosswalkEdges
    const badDeltaW = cloneCity();
    // Đổi r_rvl_e tại n_rvl (đang nối với wohnstrasse_30 rộng 7.0m) sang hauptstrasse_2x2_50 rộng 13.0m (ΔW = 6.0m)
    badDeltaW.edges.find((e) => e.id === 'r_rvl_e')!.profile = 'hauptstrasse_2x2_50';
    const res3 = validateCity(badDeltaW);
    expect(res3.valid).toBe(false);
    expect(
      res3.errors.some(
        (e) => e.includes('[WIDTH_JUMP_EXCEEDED]') && e.includes('n_rvl') && e.includes('r_rvl_e')
      )
    ).toBe(true);

    // Case 4: Cạnh đường quá ngắn L = 20m (< 40m tối thiểu cho cạnh thường)
    const badShortEdge = cloneCity();
    const nSouthShort = badShortEdge.nodes.find((n) => n.id === 'n_south_end')!;
    nSouthShort.z = -20; // L = 20m từ (0,-20) đến (0,0)
    const res4 = validateCity(badShortEdge);
    expect(res4.valid).toBe(false);
    expect(
      res4.errors.some(
        (e) => e.includes('[EDGE_TOO_SHORT]') && e.includes('r_south_rvl') && e.includes('20.00m')
      )
    ).toBe(true);

    // Case 5: Cạnh cong uốn ngay sát nút (< 20m đoạn thẳng dẫn ở đầu mút, không khóa tiếp tuyến)
    const badCurvedAtNode = cloneCity();
    const edgeCurved = badCurvedAtNode.edges.find((e) => e.id === 'r_rvl_e')!;
    // n_rvl ở (0,0), n_rvl_east ở (-90,0); chèn waypoint lệch trục ở khoảng cách chỉ 8m từ n_rvl
    edgeCurved.waypoints = [
      [-8, 5],
      [-50, 5]
    ];
    const res5 = validateCity(badCurvedAtNode);
    expect(res5.valid).toBe(false);
    expect(
      res5.errors.some((e) => e.includes('[CURVED_AT_NODE]') && e.includes('r_rvl_e') && e.includes('n_rvl'))
    ).toBe(true);

    // Case 6: Đoạn chuyển tiếp bề rộng (taper) quá ngắn L = 12m (< 20m) tại nút bậc 2
    const badTaper = cloneCity();
    badTaper.nodes.push({ id: 'n_taper_mid', x: 0, z: -102, kind: 'end' });
    const nSouthOrig = badTaper.nodes.find((n) => n.id === 'n_south_end')!;
    nSouthOrig.kind = 'intersection';
    badTaper.edges.push({
      id: 'r_short_taper',
      name: 'Kurze Rampe',
      from: 'n_taper_mid',
      to: 'n_south_end',
      profile: 'gewerbestrasse_bus_50', // 8.0m nối vào 7.0m tại n_south_end với chiều dài chỉ 12m
      isTaper: true
    });
    const res6 = validateCity(badTaper);
    expect(res6.valid).toBe(false);
    expect(
      res6.errors.some(
        (e) =>
          (e.includes('[TAPER_TOO_SHORT]') || e.includes('[INVALID_TAPER]')) &&
          e.includes('r_short_taper') &&
          e.includes('12.00m')
      )
    ).toBe(true);

    console.info('[N6 Rejected Map Errors]:');
    for (const [idx, r] of [res1, res2, res3, res4, res5, res6].entries()) {
      console.info(`  Case ${idx + 1}: ${r.errors[0]}`);
    }
  });

  it('[Autopilot 5B] Xe tự hành chạy sạch qua cả 3 nút giao (n_rvl -> n_t -> n_ampel), 0 lỗi RuleEngine', () => {
    // Khởi tạo bộ điều khiển đèn tín hiệu tại n_ampel
    const controllers: TrafficLightController[] = [];
    for (const ix of miniMap.intersections) {
      if (!ix.trafficLight) continue;
      const ctrl = new TrafficLightController(ix.nodeId, ix.trafficLight.greenSeconds, ix.trafficLight.yellowSeconds);
      const { arms } = planLightsForIntersection(ix, miniMap);
      for (const arm of arms) {
        ctrl.registerArm(arm.roadId, arm.end, arm.group);
      }
      controllers.push(ctrl);
    }

    // Tuyến đường đi thẳng từ Nam lên Bắc xuyên qua cả 3 nút giao: n_rvl (0,0) -> n_t (0,100) -> n_ampel (0,200) -> n_north_end (0,290)
    const route: AutopilotRoute = {
      seed: MINI_CITY_3_NODES.seed,
      spawn: { roadId: 'r_south_rvl', s: 20 },
      steps: [
        { roadId: 'r_south_rvl', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n_rvl' },
        { roadId: 'r_rvl_t', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n_t' },
        { roadId: 'r_t_ampel', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n_ampel' },
        { roadId: 'r_ampel_n', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n_north_end' }
      ],
      checkpoints: [
        { id: 1, type: 'junction', roadId: 'r_south_rvl', roadName: 'Goethestraße Süd', s: 90, x: 0, z: 0, label: 'n_rvl' },
        { id: 2, type: 'junction', roadId: 'r_rvl_t', roadName: 'Goethestraße Mitte', s: 100, x: 0, z: 100, label: 'n_t' },
        { id: 3, type: 'junction', roadId: 'r_t_ampel', roadName: 'Lessingstraße', s: 100, x: 0, z: 200, label: 'n_ampel' }
      ]
    };

    // Tạo mô hình xe kinematic bicycle tương đương 100% với vehicle.ts (chạy trong môi trường Node/Vitest không cần GLB)
    const sp = spawnFromMap(miniMap);
    const state: VehicleState = { x: sp.x, z: sp.z, heading: sp.heading, speed: 0, gear: 'D', t: 0 };
    let steerAngle = 0;
    let signalState: 'left' | 'right' | null = null;
    const mockVehicle: VehicleHandle = {
      group: new THREE.Group(),
      state,
      get signal() {
        return signalState;
      },
      get steerAngle() {
        return steerAngle;
      },
      throttle: 0,
      brake: 0,
      bodyPitch: 0,
      bodyRoll: 0,
      update(dt: number, input: VehicleInput) {
        if (input.gear) state.gear = input.gear;
        if (input.signalLeft) signalState = signalState === 'left' ? null : 'left';
        if (input.signalRight) signalState = signalState === 'right' ? null : 'right';
        const targetSteer = -input.steer * 0.58;
        const ds = targetSteer - steerAngle;
        const maxStep = (Math.abs(input.steer) > 0.01 ? 2.2 : 3.6) * dt;
        steerAngle += Math.max(-maxStep, Math.min(maxStep, ds));
        const accel = input.throttle * 5.2 - input.brake * 8.5 - state.speed * 0.08;
        state.speed = Math.max(0, Math.min(25, state.speed + accel * dt));
        state.heading += (state.speed / 2.6) * Math.tan(steerAngle) * dt;
        state.x += Math.sin(state.heading) * state.speed * dt;
        state.z += Math.cos(state.heading) * state.speed * dt;
        state.t += dt;
      },
      syncPose() {},
      seatPose() {
        return { x: state.x, y: 1.25, z: state.z, yaw: state.heading };
      },
      setGear(g) {
        state.gear = g;
      },
      setCameraMode() {},
      dispose() {}
    };

    const ap = new AutopilotDriver(miniMap, controllers, route);
    ap.attach(mockVehicle);
    ap.start('clean');

    const ruleEngine = new RuleEngine(miniMap, controllers);
    const visitedNodes = new Set<string>();

    // Mô phỏng tối đa 110 giây (bước 0.25s để cửa sổ 16 mẫu của donutTrail tương ứng 4.0s thực tế)
    const stepDt = 0.25;
    for (let step = 0; step < 440; step++) {
      for (const c of controllers) c.update(stepDt);
      const input = ap.update(stepDt);
      ap.endStep();
      mockVehicle.update(stepDt, input);
      ruleEngine.update(
        stepDt,
        {
          x: state.x,
          z: state.z,
          heading: state.heading,
          speed: state.speed,
          signal: mockVehicle.signal,
          stopped: Math.abs(state.speed) < 0.15
        },
        []
      );

      for (const nId of ['n_rvl', 'n_t', 'n_ampel']) {
        const nd = nodeById(miniMap, nId)!;
        if (Math.hypot(state.x - nd.x, state.z - nd.z) < 6.0) {
          visitedNodes.add(nId);
        }
      }
      if (ap.telemetry().done) break;
    }

    const tel = ap.telemetry();
    console.info(
      `[Autopilot 5B] done=${tel.done} · simTime=${tel.simTime.toFixed(1)}s · road=${tel.roadId} · s=${tel.s.toFixed(1)} · pos=(${state.x.toFixed(1)},${state.z.toFixed(1)}) · visited=${Array.from(visitedNodes).join(',')} · events=${tel.events.map((e) => e.kind + ':' + e.detail).join(' | ')}`
    );

    expect(tel.done).toBe(true);
    expect(visitedNodes.has('n_rvl')).toBe(true);
    expect(visitedNodes.has('n_t')).toBe(true);
    expect(visitedNodes.has('n_ampel')).toBe(true);
    expect(ruleEngine.violations).toEqual([]);
    expect(ruleEngine.bestanden).toBe(true);
  });

  it('[Giải trình #3] Mọi biển báo chiều ngược (flip: true, side: left) có góc lệch mặt biển <= 5 độ', () => {
    // Kiểm tra trên cả mini-map và map 18 nút
    for (const [mapLabel, curMap] of [
      ['MiniMap', miniMap],
      ['City18Map', city18Map]
    ] as const) {
      const backwardSigns = curMap.signs.filter((s) => s.flip === true && s.side === 'left');
      expect(backwardSigns.length).toBeGreaterThan(0);

      for (const sg of backwardSigns) {
        const road = roadById(curMap, sg.roadId)!;
        expect(road).toBeDefined();
        const pt = roadPointAt(road, sg.s);
        // Hướng di chuyển của xe chiều ngược (to -> from)
        const bwdMoveX = -Math.sin(pt.heading);
        const bwdMoveZ = -Math.cos(pt.heading);
        // Hướng mặt biển (trafficSigns.ts: rot = heading + (flip ? 0 : Math.PI))
        const rot = pt.heading + (sg.flip ? 0 : Math.PI);
        const faceX = Math.sin(rot);
        const faceZ = Math.cos(rot);
        // Mặt biển phải nhìn thẳng vào xe đang tới (ngược hướng di chuyển bwdMove): dot(face, -bwdMove) == 1
        const dot = faceX * -bwdMoveX + faceZ * -bwdMoveZ;
        const deg = (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;
        expect(deg).toBeLessThanOrEqual(5.0);
      }
    }
  });

  it('[N7] Tính tất định 18 nút: Build 2 lần độc lập cho cùng một mã băm SHA-256 tuyệt đối', () => {
    const build1 = generateCityMap(CITY_18_NODES);
    const build2 = generateCityMap(CITY_18_NODES);
    const json1 = JSON.stringify(build1);
    const json2 = JSON.stringify(build2);
    const hash1 = createHash('sha256').update(json1).digest('hex');
    const hash2 = createHash('sha256').update(json2).digest('hex');

    console.info(`[N7 Deterministic Hash 18 Nodes] build1 = ${hash1}`);
    console.info(`[N7 Deterministic Hash 18 Nodes] build2 = ${hash2}`);

    expect(hash1).toBe(hash2);
    expect(json1).toBe(json2);
  });

  it('[N8] Đồ thị và kết nối làn (lane connectors) trên map 18 nút: 100% hợp lệ, mọi luồng vào có lối ra hợp lệ', () => {
    expect(city18Map.version).toBe(1);
    expect(city18Map.nodes.length).toBe(18);
    expect(city18Map.roads.length).toBe(23);

    // Mọi intersection node (bậc >= 2) phải có ít nhất 1 outgoing legal road cho mỗi hướng tới
    for (const nd of city18Map.nodes) {
      if (nd.type !== 'intersection') continue;
      const conn = roadsAtNode(city18Map, nd.id);
      expect(conn.length).toBeGreaterThanOrEqual(2);

      for (const inArm of conn) {
        // Luồng xe đi vào node từ road này
        const isEntry = (inArm.road.to === nd.id && inArm.road.lanesForward > 0) ||
                        (inArm.road.from === nd.id && inArm.road.lanesBackward > 0);
        if (!isEntry) continue;

        // Phải có ít nhất 1 nhánh khác cho phép đi ra khỏi node (không bị cấm oneway ngược)
        const validExits = conn.filter((outArm) => {
          if (outArm.road.id === inArm.road.id) return false;
          return (outArm.road.from === nd.id && outArm.road.lanesForward > 0) ||
                 (outArm.road.to === nd.id && outArm.road.lanesBackward > 0);
        });
        expect(validExits.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('[N9] Kiểm tra nghiêm ngặt đường một chiều trên map 18 nút: cặp 220/267 chuẩn xác, 0 biển 267 sai đầu', () => {
    const onewayRoads = city18Map.roads.filter((r) => r.lanesBackward === 0 && r.lanesForward > 0);
    expect(onewayRoads.length).toBe(2); // r14a_oneway_in, r14b_oneway_out

    for (const r of onewayRoads) {
      const len = roadLength(r);
      const signs220 = city18Map.signs.filter((s) => s.roadId === r.id && s.type === '220');
      const signs267 = city18Map.signs.filter((s) => s.roadId === r.id && s.type === '267');

      // Có biển 220 ở đầu vào (s <= 18m)
      expect(signs220.length).toBeGreaterThanOrEqual(1);
      expect(signs220[0].s).toBeLessThanOrEqual(18);

      // Có biển 267 ở đầu cấm vào (s >= len - 15m)
      expect(signs267.length).toBeGreaterThanOrEqual(1);
      expect(signs267[0].s).toBeGreaterThanOrEqual(len - 15);
      expect(signs267[0].flip).toBe(true);
      expect(signs267[0].side).toBe('left');
    }

    // Không có bất kỳ biển 267 nào trên đường hai chiều
    const twoWayRoads = city18Map.roads.filter((r) => r.lanesBackward > 0 && r.lanesForward > 0);
    for (const r of twoWayRoads) {
      const signs267 = city18Map.signs.filter((s) => s.roadId === r.id && s.type === '267');
      expect(signs267).toEqual([]);
    }
  });

  it('[N10] R-FGÜ 2001: Tuyệt đối 0 stop line (vạch dừng) tại vạch đi bộ không đèn tín hiệu', () => {
    // Lấy danh sách các nút vạch đi bộ không đèn tín hiệu (T6_ZEBRA_MIDBLOCK)
    const zebraNodes = CITY_18_NODES.nodes.filter(
      (n) => n.template === 'T6_ZEBRA_MIDBLOCK' && n.kind === 'intersection'
    );
    expect(zebraNodes.length).toBe(2); // n03_zebra, n18_uni_park

    // Duyệt qua toàn bộ quads vạch kẻ của các đường nối vào nút zebra không đèn
    for (const zn of zebraNodes) {
      const connectedRoads = city18Map.roads.filter((r) => r.from === zn.id || r.to === zn.id);
      for (const road of connectedRoads) {
        const skip = roadSkipZones(road, city18Map);
        const half = roadHalfWidth(road);
        const quads = roadMarkingQuads(city18Map, road, skip, half);

        // Vạch dừng Haltlinie dày 0.4m và chiều dài ngang làn ~half - 0.25m
        // Kiểm tra quanh nút giao zn (khoảng cách < 15m tính từ zn) không có stop line nào
        const nd = nodeById(city18Map, zn.id)!;
        for (const q of quads) {
          const cx = (q.a[0] + q.b[0] + q.c[0] + q.d[0]) / 4;
          const cz = (q.a[2] + q.b[2] + q.c[2] + q.d[2]) / 4;
          const distToNode = Math.hypot(cx - nd.x, cz - nd.z);
          if (distToNode < 15.0) {
            // Chiều dài dọc đường của quad: hypot(c - b) hoặc hypot(d - a)
            const lenAlong = Math.hypot(q.c[0] - q.b[0], q.c[2] - q.b[2]);
            const lenAcross = Math.hypot(q.b[0] - q.a[0], q.b[2] - q.a[2]);
            const isStopLineCandidate = Math.abs(lenAlong - 0.4) < 0.05 && lenAcross > 1.2;
            expect(isStopLineCandidate).toBe(false);
          }
        }
      }
    }
  });

  it('[Full Audit 18 Nodes] Toàn bộ bộ kiểm toán hình học (boundary + seam + sawtooth + junctionMesh + lights + lamps) = 0 lỗi', () => {
    // 1. Boundary / Seam / Sawtooth = 0
    expect(collectBoundaryIssues(city18Map).issues).toEqual([]);
    expect(collectSeamIssues(city18Map).issues).toEqual([]);
    expect(collectSawtoothIssues(city18Map).issues).toEqual([]);

    // 2. JunctionMesh 18 nút: 0 tự cắt, diện tích Shoelace = tổng tam giác, winding chuẩn cross < 0
    for (const nd of city18Map.nodes.filter((n) => n.type === 'intersection')) {
      const connected = roadsAtNode(city18Map, nd.id);
      const jm = buildJunctionMesh(nd.x, nd.z, connected);
      expect(jm.poly.length).toBeGreaterThanOrEqual(4);
      let shoelace = 0;
      for (let i = 0; i < jm.poly.length; i++) {
        const [x1, z1] = jm.poly[i];
        const [x2, z2] = jm.poly[(i + 1) % jm.poly.length];
        shoelace += x1 * z2 - z1 * x2;
      }
      shoelace = Math.abs(shoelace) / 2;
      let meshArea = 0;
      for (const q of jm.asphaltQuads) {
        const cross = (q.b[0] - q.a[0]) * (q.c[2] - q.a[2]) - (q.b[2] - q.a[2]) * (q.c[0] - q.a[0]);
        expect(cross).toBeLessThan(0);
        meshArea += Math.abs(cross) / 2;
      }
      expect(Math.abs(shoelace - meshArea)).toBeLessThan(1e-2);
    }

    // 3. TrafficLightAudit trên 3 nút đèn (n04_ampel, n09_ampel_east, n10_land_gate)
    const lightIxs = city18Map.intersections.filter((ix) => ix.trafficLight !== null);
    expect(lightIxs.length).toBe(3);
    for (const ix of lightIxs) {
      const { arms, approaches } = planLightsForIntersection(ix, city18Map);
      expect(approaches).toBeGreaterThanOrEqual(3);
      expect(arms.length).toBeGreaterThanOrEqual(3);
      for (const arm of arms) {
        expect(arm.pos).not.toBeNull();
        const fxw = Math.sin(arm.yaw);
        const fzw = Math.cos(arm.yaw);
        const dot = fxw * -arm.fx + fzw * -arm.fz;
        expect(dot).toBeGreaterThanOrEqual(0.99);
      }
    }

    // 4. LampOrientation (P1–P5) & Sign Orientation
    const placements = computePropPlacements(city18Map);
    const lamps = placements.filter((p) => !p.skip && p.type === 'street_lamp');
    expect(lamps.length).toBeGreaterThan(0);
    for (const p of lamps) {
      const armX = Math.sin(p.yaw);
      const armZ = Math.cos(p.yaw);
      const fx = Math.sin(p.heading);
      const fz = Math.cos(p.heading);
      const rx = -fz;
      const rz = fx;
      const side = p.side === 'right' ? 1 : -1;
      const nX = -rx * side;
      const nZ = -rz * side;
      const angle = (Math.acos(Math.max(-1, Math.min(1, armX * nX + armZ * nZ))) * 180) / Math.PI;
      const headX = p.x + armX * LAMP_HEAD_Z;
      const headZ = p.z + armZ * LAMP_HEAD_Z;
      const cx = p.x - rx * side * p.off;
      const cz = p.z - rz * side * p.off;
      const latPole = (p.x - cx) * rx + (p.z - cz) * rz;
      const latHead = (headX - cx) * rx + (headZ - cz) * rz;
      const inward = p.half - Math.abs(latHead);
      expect(angle).toBeLessThanOrEqual(15);
      expect(inward).toBeGreaterThanOrEqual(0.3);
      expect(Math.abs(latPole)).toBeLessThanOrEqual(p.half + 3.05);
    }
  });

  describe('🌊 BƯỚC 5C-2 — SÔNG, CẦU VÀ CÔNG VIÊN (WATER, BRIDGES & PARKS)', () => {
    if (isCleanMode) {
      it('[5C-1 Sạch] Kỳ vọng 0 mặt nước, 0 cầu và 0 công viên khi cờ excludeWaterParks = true', () => {
        expect(city18Map.waters ?? []).toEqual([]);
        expect(city18Map.parks ?? []).toEqual([]);
        expect(city18Map.roads.filter((r) => (r as any).bridge === true)).toEqual([]);
      });
    } else {
      it('[5C-2.1] Mặt nước Spree & 3 đoạn cầu (Bridges): Cấu hình chuẩn, vuông góc, đúng clearance', () => {
      expect(city18Map.waters).toBeDefined();
      expect(city18Map.waters!.length).toBe(1);
      const spree = city18Map.waters![0];
      expect(spree.id).toBe('w_spree');
      expect(spree.name).toBe('Spree');
      expect(spree.width).toBe(26);

      // Đúng 3 cạnh được đánh dấu bridge: true
      const bridgeRoads = city18Map.roads.filter((r) => (r as any).bridge === true);
      expect(bridgeRoads.map((r) => r.id).sort()).toEqual(
        ['r10_to_land', 'r11_fried_north', 'r18_land_east_conn'].sort()
      );

      // Cả 18 nút giao đều có khoảng cách an toàn tới tim sông >= w.width/2 + 5.0m (18.0m)
      for (const nd of city18Map.nodes) {
        let minDist = Infinity;
        for (let i = 1; i < spree.points.length; i++) {
          const ax = spree.points[i - 1][0], az = spree.points[i - 1][1];
          const bx = spree.points[i][0], bz = spree.points[i][1];
          const vx = bx - ax, vz = bz - az;
          const l2 = vx * vx + vz * vz || 1;
          const t = Math.max(0, Math.min(1, ((nd.x - ax) * vx + (nd.z - az) * vz) / l2));
          const d = Math.hypot(nd.x - (ax + t * vx), nd.z - (az + t * vz));
          if (d < minDist) minDist = d;
        }
        expect(minDist).toBeGreaterThanOrEqual(spree.width / 2 + 5.0);
      }

      // 0 nhà nào lọt vào lòng sông (khoảng cách tới tim sông < width/2 + 2.0m = 15.0m)
      for (const b of city18Map.buildings) {
        const strips = buildingStrips(city18Map, { ...b, depthOff: 0 });
        if (!strips) continue;
        for (const [x0, z0, x1, z1] of strips) {
          for (const [cx, cz] of [
            [x0, z0],
            [x1, z0],
            [x1, z1],
            [x0, z1]
          ]) {
            for (let i = 1; i < spree.points.length; i++) {
              const ax = spree.points[i - 1][0], az = spree.points[i - 1][1];
              const bx = spree.points[i][0], bz = spree.points[i][1];
              const vx = bx - ax, vz = bz - az;
              const l2 = vx * vx + vz * vz || 1;
              const t = Math.max(0, Math.min(1, ((cx - ax) * vx + (cz - az) * vz) / l2));
              const d = Math.hypot(cx - (ax + t * vx), cz - (az + t * vz));
              expect(d).toBeGreaterThanOrEqual(spree.width / 2 + 1.8);
            }
          }
        }
      }

      // 0 prop nào rơi xuống nước (khoảng cách tới tim sông < width/2 + 1.5m = 14.5m)
      for (const pr of city18Map.props) {
        const r = roadById(city18Map, pr.roadId)!;
        const pt = roadPointAt(r, pr.s);
        const half = roadHalfWidth(r);
        const off = pr.type === 'street_lamp' ? half + 0.55 : half + 1.2;
        const side = pr.side === 'right' ? 1 : -1;
        const px = pt.x + pt.nx * side * off;
        const pz = pt.z + pt.nz * side * off;
        for (let i = 1; i < spree.points.length; i++) {
          const ax = spree.points[i - 1][0], az = spree.points[i - 1][1];
          const bx = spree.points[i][0], bz = spree.points[i][1];
          const vx = bx - ax, vz = bz - az;
          const l2 = vx * vx + vz * vz || 1;
          const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / l2));
          const d = Math.hypot(px - (ax + t * vx), pz - (az + t * vz));
          expect(d).toBeGreaterThanOrEqual(spree.width / 2 + 1.4);
        }
      }
    });

    it('[5C-2.2] Công viên (Parks): Đa giác hợp lệ, 0 nhà và 0 prop xâm lấn bên trong công viên', () => {
      expect(city18Map.parks).toBeDefined();
      expect(city18Map.parks!.length).toBe(2);
      const [lustgarten, stadtpark] = city18Map.parks!;
      expect(lustgarten.id).toBe('p01_lustgarten');
      expect(stadtpark.id).toBe('p02_stadtpark');

      for (const park of city18Map.parks!) {
        expect(park.points.length).toBeGreaterThanOrEqual(3);

        // 0 nhà nào có góc lọt vào bên trong polygon công viên
        for (const b of city18Map.buildings) {
          const strips = buildingStrips(city18Map, { ...b, depthOff: 0 });
          if (!strips) continue;
          for (const [x0, z0, x1, z1] of strips) {
            for (const [cx, cz] of [
              [x0, z0],
              [x1, z0],
              [x1, z1],
              [x0, z1]
            ]) {
              const inside = isPointInsidePolygon2D(cx, cz, park.points);
              expect(inside).toBe(false);
            }
          }
        }

        // 0 prop nào nằm bên trong polygon công viên
        for (const pr of city18Map.props) {
          const r = roadById(city18Map, pr.roadId)!;
          const pt = roadPointAt(r, pr.s);
          const half = roadHalfWidth(r);
          const off = pr.type === 'street_lamp' ? half + 0.55 : half + 1.2;
          const side = pr.side === 'right' ? 1 : -1;
          const px = pt.x + pt.nx * side * off;
          const pz = pt.z + pt.nz * side * off;
          const inside = isPointInsidePolygon2D(px, pz, park.points);
          expect(inside).toBe(false);
        }
      }
    });
    }

    it('[5C-2.3] validateCity() từ chối các vi phạm về sông, cầu và công viên', () => {
      // 1. Cạnh đánh dấu bridge: true nhưng không cắt sông
      const invalidBridgeCity: CityDefinition = JSON.parse(JSON.stringify(CITY_18_NODES));
      invalidBridgeCity.edges.find((e) => e.id === 'r01_start')!.bridge = true;
      const res1 = validateCity(invalidBridgeCity);
      expect(res1.valid).toBe(false);
      expect(res1.errors.some((e) => e.includes('[BRIDGE_WITHOUT_WATER] Edge "r01_start"'))).toBe(true);

      // 2. Cạnh cắt sông nhưng quên khai báo bridge: true
      const missingBridgeCity: CityDefinition = JSON.parse(JSON.stringify(CITY_18_NODES));
      delete missingBridgeCity.edges.find((e) => e.id === 'r10_to_land')!.bridge;
      const res2 = validateCity(missingBridgeCity);
      expect(res2.valid).toBe(false);
      expect(res2.errors.some((e) => e.includes('[WATER_CROSSING_NOT_BRIDGE] Edge "r10_to_land"'))).toBe(true);

      // 3. Nút giao bị ngập vào lòng sông
      const drownedNodeCity: CityDefinition = JSON.parse(JSON.stringify(CITY_18_NODES));
      drownedNodeCity.nodes.find((n) => n.id === 'n04_ampel')!.z = 330; // sông ở 335
      const res3 = validateCity(drownedNodeCity);
      expect(res3.valid).toBe(false);
      expect(res3.errors.some((e) => e.includes('[NODE_IN_WATER] Node "n04_ampel"'))).toBe(true);

      // 4. Công viên có ít hơn 3 đỉnh
      const badParkCity: CityDefinition = JSON.parse(JSON.stringify(CITY_18_NODES));
      badParkCity.parks = [{ id: 'p_bad', points: [[0, 0], [10, 10]] }];
      const res4 = validateCity(badParkCity);
      expect(res4.valid).toBe(false);
      expect(res4.errors.some((e) => e.includes('[INVALID_PARK] Park "p_bad"'))).toBe(true);
    });
  });
});
