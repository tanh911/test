// launchAudit.test.ts — 📊 PHẦN 7B.1: ĐO hành vi KHỞI HÀNH sau đèn đỏ (headless, KHÔNG sửa code).
// Mô phỏng ≥ 50 ca "dừng đèn đỏ → xanh" với hàng xe 1–5 chiếc, dùng NPCController THẬT.
// Ghi telemetry đầy đủ → scripts/launch_telemetry_<tag>.json (tag = env LAUNCH_AUDIT_TAG, mặc định "before").
// Phân tích bảng do scripts/audit_launch.mjs thực hiện.
// Chạy: LAUNCH_AUDIT_TAG=before npx vitest run src/world/launchAudit.test.ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GameMap } from './mapLoader';
import { NPCController, type NpcCar } from './npc';
import { TrafficLightController } from './trafficLights';

const DT = 1 / 60;
const GREEN_S = 25;          // pha xanh đủ dài để ghi 14s sau xanh + L5 đi 100m
const RED_SETTLE = 5;        // dừng đỏ 5s cho hàng xe ổn định trước khi chuyển xanh
const RECWindow = 18;        // cửa sổ ghi sau xanh (s) — đủ cho hàng 5 xe hoàn tất 0→30
const V30 = 30 / 3.6;        // 8.333 m/s
const CAR_LEN = 4.2;         // chiều dài xe quy ước (bumper gap = ds − CAR_LEN)

/** Mini map đường thẳng E–W: r1 (n1→n2, 140m) + r2 (n2→n3, 200m — ĐỦ DÀI để xe không
 *  kịp quay đầu dead-end trong cửa sổ ghi, tránh artifact headway tại điểm U-turn), n2 = đèn */
function makeMap(): GameMap {
  const nodes = [
    { id: 'n1', x: -140, z: 0, type: 'end' as const },
    { id: 'n2', x: 0, z: 0, type: 'intersection' as const },
    { id: 'n3', x: 200, z: 0, type: 'end' as const },
  ];
  const mkRoad = (id: string, from: string, to: string, pts: Array<[number, number]>) => ({
    id, from, to, points: pts, lanesForward: 1, lanesBackward: 1, laneWidth: 3,
    sidewalk: { left: true, right: true }, bikeLane: { left: false, right: false },
    parking: { left: 'none' as const, right: 'none' as const },
    speedLimit: 50, priority: 'equal' as const, surface: 'asphalt' as const,
  });
  return {
    version: 1,
    nodes,
    roads: [
      mkRoad('r1', 'n1', 'n2', [[-140, 0], [0, 0]]),
      mkRoad('r2', 'n2', 'n3', [[0, 0], [200, 0]]),
    ] as GameMap['roads'],
    intersections: [{
      nodeId: 'n2', rule: 'traffic_light' as const,
      trafficLight: { cycle: 'standard' as const, greenSeconds: GREEN_S, yellowSeconds: 3, redSeconds: 25 },
      crosswalks: [],
    }],
    signs: [], buildings: [], props: [],
    spawns: { player: { roadId: 'r1', s: 10, lane: 0 } },
    waters: [],
  } as unknown as GameMap;
}

interface CarRec {
  heavy: boolean;
  startVsGreen: number | null;   // s sau khi xanh mà xe bắt đầu nhúc nhích (v > 0.1)
  startVsLeader: number | null;  // so với xe TRƯỚC bắt đầu nhúc nhích
  t0to30: number | null;         // s từ khi nhúc nhích tới v ≥ 30 km/h
  maxAccel: number;              // m/s² (gia tốc dương lớn nhất trong cửa sổ)
  maxJerk: number;               // m/s³ (|da/dt| lớn nhất trong cửa sổ)
  vAtSwitchKmh: number | null;   // tốc độ khi đáy sang road mới (điểm cắt nút, len−4.2)
  vExitKmh: null | number;       // tốc độ tại 25m sau tâm nút
  targetBase: number;            // npc.targetSpeed (m/s) — cơ sở mục tiêu AI
  minStoppedGap: number;         // bumper gap nhỏ nhất khi cả 2 xe đứng (m)
  minHeadway: number;            // time-headway nhỏ nhất khi chạy (ds/v, s)
}

/** Đặt hàng xe: car0 cách vạch 1.0m, xe sau cách nhau 6.4m tâm-đối-tâm (ds < STOP_GAP → xếp hàng) */
function placeQueue(bag: NpcCar[], mk: (r: GameMap['roads'][number], s: number, d: 1 | -1, idx: number) => NpcCar, road: GameMap['roads'][number], stopS: number, queue: number, repeat: number): NpcCar[] {
  bag.length = 0;
  const cars: NpcCar[] = [];
  for (let i = 0; i < queue; i++) {
    const s = stopS - 1.0 - 6.4 * i - (repeat % 3) * 0.15;
    const c = mk(road, s, 1, i);
    c.speed = 0;
    c.targetSpeed = 11; // worst case (40 km/h mục tiêu cá nhân)
    cars.push(c);
    bag.push(c);
  }
  return cars;
}

function runScenario(
  npc: NPCController,
  ctrl: TrafficLightController,
  cars: NpcCar[],
  jerkSeries: boolean,
): { cars: CarRec[]; series: Array<{ t: number; v: number[] }>; jerks: number[] } {
  const recs: CarRec[] = cars.map(c => ({
    heavy: (c as NpcCar & { heavy?: boolean }).heavy ?? false,
    startVsGreen: null, startVsLeader: null, t0to30: null,
    maxAccel: 0, maxJerk: 0, vAtSwitchKmh: null, vExitKmh: null,
    targetBase: c.targetSpeed, minStoppedGap: Infinity, minHeadway: Infinity,
  }));
  const started: Array<number | null> = cars.map(() => null);
  const vHist: number[][] = cars.map(() => []); // chuỗi v từng tick (đo jerk)
  const series: Array<{ t: number; v: number[] }> = [];
  const collisions: string[] = [];
  const player = { x: 9999, z: 9999 };
  const setTimer = (tctrl: TrafficLightController, v: number) => { (tctrl as unknown as { timer: number }).timer = v; };

  // ── pha ĐỎ 5s (timer vào vùng đỏ nhóm 0: tt ∈ [1.5+25+3, 62)) ──
  setTimer(ctrl, 35);
  for (let t = 0; t < RED_SETTLE; t += DT) {
    ctrl.update(DT);
    npc.update(DT, { player, controllers: [ctrl], collisions });
  }
  expect(ctrl.phaseForArm('r1', 'to')).toBe('red');

  // ── chuyển XANH (tt = 1.5 → green ngay, kéo dài GREEN_S) ──
  setTimer(ctrl, 1.5);
  const tGreen = RED_SETTLE;
  let prevV = cars.map(c => c.speed);
  for (let k = 0; k <= Math.round(RECWindow / DT); k++) {
    const t = tGreen + k * DT;
    ctrl.update(DT);
    npc.update(DT, { player, controllers: [ctrl], collisions });
    if (jerkSeries && k % 6 === 0) series.push({ t: +(t - tGreen).toFixed(3), v: cars.map(c => +c.speed.toFixed(3)) });
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      const r = recs[i];
      vHist[i].push(c.speed);
      if (started[i] === null && c.speed > 0.1) started[i] = t;
      if (started[i] !== null && r.startVsGreen === null) r.startVsGreen = +(t - tGreen).toFixed(2);
      if (started[i] !== null && r.t0to30 === null && c.speed >= V30) {
        r.t0to30 = +(t - (started[i] as number)).toFixed(2);
      }
      if (started[i] !== null && t - (started[i] as number) < 12) {
        const a = (c.speed - prevV[i]) / DT;
        if (a > r.maxAccel) r.maxAccel = +a.toFixed(2);
      }
      if (r.vAtSwitchKmh === null && c.roadId === 'r2') r.vAtSwitchKmh = +(c.speed * 3.6).toFixed(1);
      if (r.vExitKmh === null && c.roadId === 'r2' && c.s >= 25) r.vExitKmh = +(c.speed * 3.6).toFixed(1);
      if (i > 0) {
        const ahead = cars[i - 1];
        // khoảng cách DỌC CHIỀU di chuyển: leader ở TRƯỚC → ds dương bất kể dir
        const ds = Math.abs(ahead.s - c.s);
        if (c.speed < 0.3 && ahead.speed < 0.3 && c.roadId === ahead.roadId) {
          r.minStoppedGap = Math.min(r.minStoppedGap, +(ds - CAR_LEN).toFixed(2));
        }
        if (c.speed > 1 && c.roadId === ahead.roadId) {
          r.minHeadway = Math.min(r.minHeadway, +(ds / c.speed).toFixed(2));
        }
      }
    }
    prevV = cars.map(c => c.speed);
  }
  // jerk: |Δa/Δt| lớn nhất trong PHA 0→30 km/h (từ lúc nhúc nhích tới khi đạt 30 km/h)
  // — đúng ngữ nghĩa L2 (khởi hành); phanh giữa dòng dùng ramp riêng 3/8 m/s³ theo thiết kế
  const jerks = vHist.map(seq => {
    const s0 = seq.findIndex(v => v > 0.1);
    if (s0 < 0) return 0;
    let e0 = seq.length;
    for (let k = s0; k < seq.length; k++) { if (seq[k] >= V30) { e0 = k + 1; break; } }
    let maxJerk = 0;
    for (let k = Math.max(2, s0 + 2); k < e0; k++) {
      const a1 = (seq[k - 1] - seq[k - 2]) / DT;
      const a2 = (seq[k] - seq[k - 1]) / DT;
      const j = Math.abs(a2 - a1) / DT;
      if (j > maxJerk) maxJerk = j;
    }
    return +maxJerk.toFixed(1);
  });
  for (let i = 0; i < recs.length; i++) recs[i].maxJerk = jerks[i];
  return { cars: recs, series, jerks };
}

describe('📊 PHẦN 7B.1 — audit khởi hành sau đèn đỏ (headless)', () => {
  it('50 ca dừng→khởi hành (hàng 1–5 xe) + L5 dt/100m — dump telemetry', { timeout: 180_000 }, async () => {
    // tag BẮT BUỘC đặt env khi đo snapshot (before/after); chạy lang thang (full suite)
    // không có env → tag "check" để KHÔNG BAO GIỜ ghi đè snapshot đo trước/sau đã lưu
    const tag = (process.env.LAUNCH_AUDIT_TAG ?? 'check').replace(/[^a-z]/gi, '');
    const map = makeMap();
    const scene = new THREE.Scene();
    const npc = new NPCController(map, scene);
    const ctrl = new TrafficLightController('n2', GREEN_S, 3);
    ctrl.registerArm('r1', 'to', 0);
    ctrl.registerArm('r2', 'from', 0);
    const tpl = new THREE.Group();
    await npc.init([ctrl], 0, [tpl]); // spawn 0 — đặt tay toàn bộ

    const mk = (npc as unknown as { makeNpc: (r: GameMap['roads'][number], s: number, d: 1 | -1, idx: number) => NpcCar }).makeNpc.bind(npc);
    const bag = (npc as unknown as { npcs: NpcCar[] }).npcs;
    const roadLenR1 = 140;
    const stopS = roadLenR1 - 3 - 2; // 135 (half=3)

    const scenarios: Array<{ queue: number; repeat: number; recs: CarRec[] }> = [];
    let chartSeries: Array<{ t: number; v: number[] }> | null = null;

    for (let queue = 1; queue <= 5; queue++) {
      for (let repeat = 0; repeat < 10; repeat++) {
        const cars = placeQueue(bag, mk, map.roads[0], stopS, queue, repeat);
        const isChart = queue === 3 && repeat === 0;
        const { cars: recs, series } = runScenario(npc, ctrl, cars, isChart);
        if (isChart) chartSeries = series;
        for (let i = 1; i < recs.length; i++) {
          const prev = recs[i - 1].startVsGreen;
          recs[i].startVsLeader = prev !== null && recs[i].startVsGreen !== null
            ? +(recs[i].startVsGreen - prev).toFixed(2) : null;
        }
        scenarios.push({ queue, repeat, recs });
      }
    }

    // ── L5: dt/tỷ lệ thời gian — 100m ở 30 km/h phải mất 12 ± 0.5s đồng hồ sim ──
    // start s=10 → kết thúc s=110, TRƯỚC vùng giảm tốc nút (s>115) nên giữ tốc độ phẳng
    bag.length = 0;
    const solo = mk(map.roads[0], 10, 1, 0);
    solo.speed = V30;
    solo.targetSpeed = V30;
    bag.push(solo);
    const collisions: string[] = [];
    (ctrl as unknown as { timer: number }).timer = 1.5; // xanh ngay, đủ 25s
    let tSim = 0;
    let t100: number | null = null;
    for (let k = 0; k < 40 * 60 && t100 === null; k++) {
      ctrl.update(DT);
      npc.update(DT, { player: { x: 9999, z: 9999 }, controllers: [ctrl], collisions });
      tSim += DT;
      if (solo.roadId === 'r2') break; // đáy nút sớm — lộ trình sai, bỏ
      if (solo.s >= 110) t100 = +tSim.toFixed(2);
    }
    const dtCheck = { t100s: t100, expected: 12, tol: 0.5, ok: t100 !== null && Math.abs(t100 - 12) <= 0.5 };
    console.info(`[launch-audit] L5 dt-check: 100m @30km/h = ${t100}s (kỳ vọng 12±0.5) → ${dtCheck.ok ? 'OK' : 'SAI HỆ SỐ THỜI GIAN'}`);

    const out = { tag, dt: DT, greenS: GREEN_S, carLen: CAR_LEN, scenarios, chartSeries, dtCheck };
    const file = join(process.cwd(), 'scripts', `launch_telemetry_${tag}.json`);
    writeFileSync(file, JSON.stringify(out));
    console.info(`[launch-audit] ${scenarios.length} ca → ${file}`);
    expect(scenarios.length).toBe(50);
    expect(dtCheck.ok).toBe(true); // dt KHÔNG bị lệch hệ số thời gian
  });
});
