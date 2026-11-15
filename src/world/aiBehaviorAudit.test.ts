// aiBehaviorAudit.test.ts — 🤖 AUDIT HÀNH VI AI (không cần GLB loader):
// 1. NPC dừng đèn ĐỎ TRƯỚC VẠCH (không bao giờ vượt khi đỏ), đi tiếp khi XANH.
// 2. NPC giữ khoảng cách xe trước (không đâm xe trước cùng làn).
// 3. Người đi bộ đi trên VỈA HÈ (không bước vào lòng đường khi không băng qua).
// Mini map: đường E-W (n1→n2→n3) + nhánh N (n2→n4); n2 = traffic_light.
// Chạy: npx vitest run src/world/aiBehaviorAudit.test.ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { GameMap } from './mapLoader';
import { roadLength } from './mapLoader';
import { NPCController } from './npc';
import { TrafficLightController } from './trafficLights';
import { PedestrianController } from './pedestrianController';

/** Mini map 3 road: n1→n2→n3 (đường chính, 60m mỗi đoạn), n2→n4 (nhánh Bắc 40m) */
function makeMiniMap(): GameMap {
  const nodes = [
    { id: 'n1', x: -60, z: 0, type: 'end' as const },
    { id: 'n2', x: 0, z: 0, type: 'intersection' as const },
    { id: 'n3', x: 60, z: 0, type: 'end' as const },
    { id: 'n4', x: 0, z: -60, type: 'end' as const },
  ];
  const roads = [
    { id: 'r1', from: 'n1', to: 'n2', points: [[-60, 0], [0, 0]] as Array<[number, number]>, lanesForward: 1, lanesBackward: 1, laneWidth: 3, sidewalk: { left: true, right: true }, bikeLane: { left: false, right: false }, parking: { left: 'none' as const, right: 'none' as const }, speedLimit: 50, priority: 'equal' as const, surface: 'asphalt' as const },
    { id: 'r2', from: 'n2', to: 'n3', points: [[0, 0], [60, 0]] as Array<[number, number]>, lanesForward: 1, lanesBackward: 1, laneWidth: 3, sidewalk: { left: true, right: true }, bikeLane: { left: false, right: false }, parking: { left: 'none' as const, right: 'none' as const }, speedLimit: 50, priority: 'equal' as const, surface: 'asphalt' as const },
    { id: 'r3', from: 'n2', to: 'n4', points: [[0, 0], [0, -60]] as Array<[number, number]>, lanesForward: 1, lanesBackward: 0, laneWidth: 3, sidewalk: { left: true, right: true }, bikeLane: { left: false, right: false }, parking: { left: 'none' as const, right: 'none' as const }, speedLimit: 50, priority: 'equal' as const, surface: 'asphalt' as const },
  ];
  return {
    version: 1,
    nodes,
    roads: roads as GameMap['roads'],
    intersections: [{
      nodeId: 'n2', rule: 'traffic_light' as const,
      trafficLight: { cycle: 'standard' as const, greenSeconds: 8, yellowSeconds: 2, redSeconds: 8 },
      crosswalks: [],
    }],
    signs: [],
    buildings: [],
    props: [],
    spawns: { player: { roadId: 'r1', s: 10, lane: 0 } },
    waters: [],
  } as unknown as GameMap;
}

describe('🤖 AI BEHAVIOR AUDIT — xe bot + người đi bộ', () => {
  it('1. NPC DỪNG trước vạch khi đèn ĐỎ (không bao giờ vượt), đi tiếp khi XANH', async () => {
    const map = makeMiniMap();
    const scene = new THREE.Scene();
    const npc = new NPCController(map, scene);
    const ctrl = new TrafficLightController('n2', 8, 2);
    ctrl.registerArm('r1', 'to', 0);
    ctrl.registerArm('r2', 'from', 0);
    ctrl.registerArm('r3', 'from', 1);
    const tpl = new THREE.Group(); // template rỗng — không cần GLB
    await npc.init([ctrl], 0, [tpl]);

    // đặt 1 NPC trên r1 s=25 dir=1 (đi về n2) — cách vạch (len−half−2=55) 30m
    const placed = new Set<number>();
    const car = (npc as unknown as { makeNpc: (r: GameMap['roads'][number], s: number, d: 1 | -1, idx: number) => { roadId: string; s: number; dir: 1 | -1; speed: number; waiting: boolean } }).makeNpc(
      map.roads[0], 25, 1, placed.size
    );
    (npc as unknown as { npcs: Array<unknown> }).npcs.push(car);

    // ép pha ĐỎ cho nhóm 0: tt ∈ [redYellow+green+yellow, 2·half)
    const half = 1.5 + 8 + 2 + 1.5;
    (ctrl as unknown as { timer: number }).timer = half + 2; // red cho group 0
    expect(ctrl.phaseForArm('r1', 'to')).toBe('red');

    // mô phỏng 20 s (dt=0.05) — xe phải dừng TRƯỚC vạch, KHÔNG vượt
    let maxS = 0;
    const collisions: string[] = [];
    for (let t = 0; t < 20; t += 0.05) {
      npc.update(0.05, { player: { x: 9999, z: 9999 }, controllers: [ctrl], collisions });
      maxS = Math.max(maxS, (car as unknown as { s: number }).s);
    }
    const lenR1 = roadLength(map.roads[0]);
    const stopS = lenR1 - 3 - 2;
    const sNow = (car as unknown as { s: number }).s;
    const speedNow = (car as unknown as { speed: number }).speed;
    console.info(`[AI-1] sau 20s ĐỎ: s=${sNow.toFixed(1)} (vạch ${stopS.toFixed(1)}) speed=${speedNow.toFixed(2)} maxS=${maxS.toFixed(1)}`);
    expect(maxS).toBeLessThanOrEqual(stopS + 0.5); // không vượt vạch khi đỏ
    expect(speedNow).toBeLessThan(0.3); // đã dừng hẳn
    expect(stopS - sNow).toBeLessThan(10); // dừng cách vạch hợp lý (<10 m, không dừng sớm quái đản)

    // chuyển XANH (timer về đầu pha red_yellow→green) — xe phải đi tiếp
    (ctrl as unknown as { timer: number }).timer = 1.5; // group 0: red_yellow 1.5s → green
    for (let t = 0; t < 12; t += 0.05) {
      npc.update(0.05, { player: { x: 9999, z: 9999 }, controllers: [ctrl], collisions });
    }
    const sGreen = (car as unknown as { s: number }).s;
    const roadGreen = (car as unknown as { roadId: string }).roadId;
    console.info(`[AI-1] sau 12s XANH: road=${roadGreen} s=${sGreen.toFixed(1)} speed=${(car as unknown as { speed: number }).speed.toFixed(2)}`);
    // đã qua vạch: chuyển sang road sau (r2/r3 — rẽ ngẫu nhiên đều hợp lệ)
    // HOẶC vượt stopS trên r1
    expect((roadGreen === 'r2' || roadGreen === 'r3') || sGreen > stopS + 2).toBe(true);
  });

  it('2. NPC giữ khoảng cách — không đâm xe trước cùng làn', async () => {
    const map = makeMiniMap();
    const scene = new THREE.Scene();
    const npc = new NPCController(map, scene);
    const ctrl = new TrafficLightController('n2', 8, 2);
    ctrl.registerArm('r1', 'to', 0);
    const tpl = new THREE.Group();
    await npc.init([ctrl], 0, [tpl]);
    const mk = (npc as unknown as { makeNpc: (r: GameMap['roads'][number], s: number, d: 1 | -1, idx: number) => { roadId: string; s: number; dir: 1 | -1; speed: number; waiting: boolean } });
    // xe TRƯỚC đứng ở s=40 (giữa đường), xe SAU chạy từ s=10
    const front = mk.makeNpc(map.roads[0], 40, 1, 0);
    const rear = mk.makeNpc(map.roads[0], 10, 1, 1);
    const bag = (npc as unknown as { npcs: Array<unknown> }).npcs;
    bag.push(front); bag.push(rear);
    (front as unknown as { speed: number }).speed = 0;
    (front as unknown as { targetSpeed: number }).targetSpeed = 0; // xe ĐỰNG (hỏng xe/đỗ)
    (rear as unknown as { targetSpeed: number }).targetSpeed = 11;
    (ctrl as unknown as { timer: number }).timer = 1.5; // XANH — không chặn đèn

    const collisions: string[] = [];
    let minGap = Infinity;
    for (let t = 0; t < 10; t += 0.05) {
      npc.update(0.05, { player: { x: 9999, z: 9999 }, controllers: [ctrl], collisions });
      if ((front as unknown as { roadId: string }).roadId !== (rear as unknown as { roadId: string }).roadId) continue;
      const gap = ((front as unknown as { s: number }).s - (rear as unknown as { s: number }).s);
      if (gap < minGap) minGap = gap;
    }
    console.info(`[AI-2] gap nhỏ nhất xe trước-sau: ${minGap.toFixed(1)} m`);
    expect(minGap).toBeGreaterThan(2.5); // không đâm (STOP_GAP=6, dừng xa hơn chút)
    expect(collisions.length).toBe(0);
  });

  it('3. Người đi bộ đi trên VỈA HÈ — không bước vào lòng đường (không có zebra)', async () => {
    const map = makeMiniMap();
    const scene = new THREE.Scene();
    const peds = new PedestrianController(scene, map);
    const tpl = new THREE.Group();
    (peds as unknown as { init: (pre?: THREE.Group[]) => void }).init([tpl]);
    // mô phỏng 15 s
    for (let t = 0; t < 15; t += 0.05) peds.update(0.05);
    const pedList = (peds as unknown as { peds: Array<{ group: THREE.Group; roadId: string; crossing?: boolean }> }).peds;
    expect(pedList.length).toBeGreaterThan(0);
    const issues: string[] = [];
    for (const ped of pedList) {
      const road = map.roads.find((r) => r.id === ped.roadId)!;
      const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
      const dCenter = Math.hypot(ped.group.position.x - nearestX(ped.group.position.x, road), 0) || distToRoadCenter(ped.group.position.x, ped.group.position.z, road);
      const dist = distToRoadCenter(ped.group.position.x, ped.group.position.z, road);
      void dCenter;
      if (!ped.crossing && dist < half + 0.4) {
        issues.push(`ped ${ped.group.name}: cách tim đường ${dist.toFixed(1)}m < half+0.4 (${(half + 0.4).toFixed(1)})`);
      }
    }
    if (issues.length) console.info(`[AI-3] ${issues.length} ped vào lòng đường:\n  ${issues.slice(0, 8).join('\n  ')}`);
    expect(issues).toEqual([]);
  });
});

function distToRoadCenter(px: number, pz: number, road: GameMap['roads'][number]): number {
  let best = Infinity;
  for (let i = 1; i < road.points.length; i++) {
    const vx = road.points[i][0] - road.points[i - 1][0], vz = road.points[i][1] - road.points[i - 1][1];
    const l2 = vx * vx + vz * vz || 1;
    const t = Math.max(0, Math.min(1, ((px - road.points[i - 1][0]) * vx + (pz - road.points[i - 1][1]) * vz) / l2));
    best = Math.min(best, Math.hypot(px - (road.points[i - 1][0] + vx * t), pz - (road.points[i - 1][1] + vz * t)));
  }
  return best;
}
function nearestX(px: number, road: GameMap['roads'][number]): number {
  return road.points[0][0];
}
