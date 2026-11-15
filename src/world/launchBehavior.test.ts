// launchBehavior.test.ts — 🚦 PHẦN 7B.3: TEST L1–L6 hành vi KHỞI HÀNH sau đèn đỏ.
// Guard chống hồi quy cho các sửa npc.ts (P-control + accel/jerk cap + reaction delay + headway).
// Mini map đường thẳng (r1 140m + r2 200m, n2 đèn) và map CỤC 90° (r1 → r3 đi Bắc) cho L4-rẽ.
// Chạy: npx vitest run src/world/launchBehavior.test.ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { GameMap } from './mapLoader';
import { NPCController, type NpcCar } from './npc';
import { TrafficLightController } from './trafficLights';

const DT = 1 / 60;
const V30 = 30 / 3.6;   // 8.333 m/s
const CAR_LEN = 4.2;

function road(id: string, from: string, to: string, pts: Array<[number, number]>) {
  return {
    id, from, to, points: pts, lanesForward: 1, lanesBackward: 1, laneWidth: 3,
    sidewalk: { left: true, right: true }, bikeLane: { left: false, right: false },
    parking: { left: 'none' as const, right: 'none' as const },
    speedLimit: 50, priority: 'equal' as const, surface: 'asphalt' as const,
  };
}

/** Đường thẳng E–W: r1 (140m) + r2 (200m), n2 = đèn giao thông (green 25s) */
function straightMap(): GameMap {
  return {
    version: 1,
    nodes: [
      { id: 'n1', x: -140, z: 0, type: 'end' as const },
      { id: 'n2', x: 0, z: 0, type: 'intersection' as const },
      { id: 'n3', x: 200, z: 0, type: 'end' as const },
    ],
    roads: [
      road('r1', 'n1', 'n2', [[-140, 0], [0, 0]]),
      road('r2', 'n2', 'n3', [[0, 0], [200, 0]]),
    ] as GameMap['roads'],
    intersections: [{
      nodeId: 'n2', rule: 'traffic_light' as const,
      trafficLight: { cycle: 'standard' as const, greenSeconds: 25, yellowSeconds: 3, redSeconds: 25 },
      crosswalks: [],
    }],
    signs: [], buildings: [], props: [],
    spawns: { player: { roadId: 'r1', s: 10, lane: 0 } },
    waters: [],
  } as unknown as GameMap;
}

/** Cục 90°: r1 (140m) vào n2, ra r3 (60m hướng Bắc) — mọi xe PHẢI RẼ → cap TURN_SPEED */
function bendMap(): GameMap {
  return {
    version: 1,
    nodes: [
      { id: 'n1', x: -140, z: 0, type: 'end' as const },
      { id: 'n2', x: 0, z: 0, type: 'intersection' as const },
      { id: 'n4', x: 0, z: -60, type: 'end' as const },
    ],
    roads: [
      road('r1', 'n1', 'n2', [[-140, 0], [0, 0]]),
      road('r3', 'n2', 'n4', [[0, 0], [0, -60]]),
    ] as GameMap['roads'],
    intersections: [{
      nodeId: 'n2', rule: 'traffic_light' as const,
      trafficLight: { cycle: 'standard' as const, greenSeconds: 25, yellowSeconds: 3, redSeconds: 25 },
      crosswalks: [],
    }],
    signs: [], buildings: [], props: [],
    spawns: { player: { roadId: 'r1', s: 10, lane: 0 } },
    waters: [],
  } as unknown as GameMap;
}

interface Rig {
  npc: NPCController;
  ctrl: TrafficLightController;
  bag: NpcCar[];
  mk: (r: GameMap['roads'][number], s: number, d: 1 | -1, idx: number) => NpcCar;
  stopS: number;
  setTimer: (v: number) => void;
}

function makeRig(map: GameMap, green = 25): Rig {
  const scene = new THREE.Scene();
  const npc = new NPCController(map, scene);
  const ctrl = new TrafficLightController('n2', green, 3);
  for (const r of map.roads) ctrl.registerArm(r.id, r.from === 'n2' ? 'from' : 'to', 0);
  const tpl = new THREE.Group();
  void npc.init([ctrl], 0, [tpl]);
  const bag = (npc as unknown as { npcs: NpcCar[] }).npcs;
  const mk = (npc as unknown as { makeNpc: (r: GameMap['roads'][number], s: number, d: 1 | -1, idx: number) => NpcCar }).makeNpc.bind(npc);
  const lenR1 = 140;
  return {
    npc, ctrl, bag, mk,
    stopS: lenR1 - 3 - 2,
    setTimer: (v: number) => { (ctrl as unknown as { timer: number }).timer = v; },
  };
}

function step(rig: Rig, player = { x: 9999, z: 9999 }): void {
  rig.ctrl.update(DT);
  rig.npc.update(DT, { player, controllers: [rig.ctrl], collisions: [] });
}

describe('🚦 PHẦN 7B.3 — khởi hành sau đèn đỏ (L1–L6)', () => {
  it('[L1+L2] launch thuần: 0→30 km/h trong [4;8]s, a ≤ 2.5 m/s², jerk ≤ 3 m/s³', () => {
    const map = straightMap();
    const rig = makeRig(map);
    const car = rig.mk(map.roads[0], rig.stopS - 1, 1, 0);
    car.speed = 0;
    car.targetSpeed = 11;
    rig.bag.push(car);
    rig.setTimer(35);
    for (let t = 0; t < 3; t += DT) step(rig); // đỏ 3s
    expect(rig.ctrl.phaseForArm('r1', 'to')).toBe('red');
    rig.setTimer(1.5); // xanh
    const vs: number[] = [];
    let tFirst: number | null = null;
    let t30: number | null = null;
    for (let k = 0; k < 15 * 60; k++) {
      const t = k * DT;
      step(rig);
      vs.push(car.speed);
      if (tFirst === null && car.speed > 0.1) tFirst = t;
      if (tFirst !== null && t30 === null && car.speed >= V30) t30 = t - (tFirst as number);
      if (t30 !== null) break;
    }
    console.info(`[L1] 0→30 km/h = ${t30?.toFixed(2)}s · [L2] kiểm a/jerk dưới`);
    expect(t30).not.toBeNull();
    expect(t30 as number).toBeGreaterThanOrEqual(4);
    expect(t30 as number).toBeLessThanOrEqual(8);
    // L2: gia tốc + jerk trong PHA 0→30
    let maxA = 0;
    let maxJerk = 0;
    const s0 = vs.findIndex(v => v > 0.1);
    let e0 = vs.length;
    for (let k = s0; k < vs.length; k++) { if (vs[k] >= V30) { e0 = k + 1; break; } }
    for (let k = Math.max(1, s0 + 1); k < e0; k++) {
      const a = (vs[k] - vs[k - 1]) / DT;
      if (a > maxA) maxA = a;
      if (k >= s0 + 2) {
        const a1 = (vs[k - 1] - vs[k - 2]) / DT;
        const j = Math.abs(a - a1) / DT;
        if (j > maxJerk) maxJerk = j;
      }
    }
    console.info(`[L2] aMax=${maxA.toFixed(2)} m/s² · jerkMax=${maxJerk.toFixed(1)} m/s³`);
    expect(maxA).toBeLessThanOrEqual(2.5);
    expect(maxJerk).toBeLessThanOrEqual(3);
  });

  it('[L3] hàng 3 xe: trễ khởi hành giữa 2 xe liên tiếp trong [0.8; 2.5]s', () => {
    const map = straightMap();
    const rig = makeRig(map);
    const cars: NpcCar[] = [];
    for (let i = 0; i < 3; i++) {
      const c = rig.mk(map.roads[0], rig.stopS - 1 - 6.4 * i, 1, i);
      c.speed = 0;
      c.targetSpeed = 11;
      cars.push(c);
      rig.bag.push(c);
    }
    rig.setTimer(35);
    for (let t = 0; t < 4; t += DT) step(rig); // đỏ 4s
    rig.setTimer(1.5); // xanh
    const started: Array<number | null> = [null, null, null];
    for (let k = 0; k < 12 * 60; k++) {
      const t = k * DT;
      step(rig);
      for (let i = 0; i < 3; i++) if (started[i] === null && cars[i].speed > 0.1) started[i] = t;
      if (started.every(s => s !== null)) break;
    }
    const delays = [1, 2].map(i => (started[i] as number) - (started[i - 1] as number));
    console.info(`[L3] trễ n→n+1: ${delays.map(d => d.toFixed(2)).join(' / ')}s`);
    for (const d of delays) {
      expect(d).toBeGreaterThanOrEqual(0.8);
      expect(d).toBeLessThanOrEqual(2.5);
    }
  });

  it('[L4] tốc qua nút: đi thẳng ≤ 32 km/h, rẽ ≤ 22 km/h', () => {
    // thẳng: xe lăn bánh 40 km/h tiến nút → cap 30 km/h
    const mapS = straightMap();
    const rigS = makeRig(mapS);
    const carS = rigS.mk(mapS.roads[0], 60, 1, 0);
    carS.speed = 11;
    carS.targetSpeed = 11;
    rigS.bag.push(carS);
    rigS.setTimer(1.5); // xanh
    let vSwitchS: number | null = null;
    for (let k = 0; k < 15 * 60 && vSwitchS === null; k++) {
      step(rigS);
      if (carS.roadId === 'r2') vSwitchS = carS.speed * 3.6;
    }
    console.info(`[L4-thẳng] tốc tại điểm cắt nút: ${vSwitchS?.toFixed(1)} km/h`);
    expect(vSwitchS).not.toBeNull();
    expect(vSwitchS as number).toBeLessThanOrEqual(32);

    // rẽ: map cục 90° — cap 20 km/h
    const mapB = bendMap();
    const rigB = makeRig(mapB);
    const carB = rigB.mk(mapB.roads[0], 60, 1, 0);
    carB.speed = 11;
    carB.targetSpeed = 11;
    rigB.bag.push(carB);
    rigB.setTimer(1.5);
    let vSwitchB: number | null = null;
    for (let k = 0; k < 15 * 60 && vSwitchB === null; k++) {
      step(rigB);
      if (carB.roadId === 'r3') vSwitchB = carB.speed * 3.6;
    }
    console.info(`[L4-rẽ] tốc tại điểm cắt nút: ${vSwitchB?.toFixed(1)} km/h`);
    expect(vSwitchB).not.toBeNull();
    expect(vSwitchB as number).toBeLessThanOrEqual(22);
  });

  it('[L5] dt đúng hệ số: 100m ở 30 km/h mất 12 ± 0.5s đồng hồ sim', () => {
    const map = straightMap();
    const rig = makeRig(map);
    const car = rig.mk(map.roads[0], 10, 1, 0);
    car.speed = V30;
    car.targetSpeed = V30;
    rig.bag.push(car);
    rig.setTimer(1.5); // xanh, đủ 25s
    let tSim = 0;
    let t100: number | null = null;
    for (let k = 0; k < 40 * 60 && t100 === null; k++) {
      step(rig);
      tSim += DT;
      if (car.roadId === 'r2') break;
      if (car.s >= 110) t100 = tSim; // 10+100=110, trước vùng giảm tốc nút (s>115)
    }
    console.info(`[L5] 100m @30 km/h = ${t100?.toFixed(2)}s (kỳ vọng 12±0.5)`);
    expect(t100).not.toBeNull();
    expect(Math.abs((t100 as number) - 12)).toBeLessThanOrEqual(0.5);
  });

  it('[L6] hai xe cùng làn khi đứng: bumper gap ≥ 2m', () => {
    const map = straightMap();
    const rig = makeRig(map);
    const cars: NpcCar[] = [];
    for (let i = 0; i < 2; i++) {
      const c = rig.mk(map.roads[0], rig.stopS - 1 - 6.4 * i, 1, i);
      c.speed = 0;
      c.targetSpeed = 11;
      cars.push(c);
      rig.bag.push(c);
    }
    rig.setTimer(35);
    let minGap = Infinity;
    for (let t = 0; t < 4; t += DT) {
      step(rig);
      if (cars[0].speed < 0.3 && cars[1].speed < 0.3) {
        minGap = Math.min(minGap, Math.abs(cars[0].s - cars[1].s) - CAR_LEN);
      }
    }
    console.info(`[L6] bumper gap khi đứng: ${minGap.toFixed(2)}m`);
    expect(minGap).toBeGreaterThanOrEqual(2.0);
    expect(minGap).toBeLessThan(4.0); // không đứng quá xa quái đản
  });
});
