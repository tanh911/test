// 🤖 autopilot.ts — PHẦN 9: lái xe người chơi theo tuyến cố định (route.json).
// - Pure-pursuit steering + P speed control qua CÙNG VehicleInput của xe người chơi (không teleport).
// - Tuân thủ luật mức cơ bản: dừng đèn đỏ, giảm tốc rẽ, đúng làn phải, xi-nhan khi rẽ.
// - Scenario frame cho Phần 10 (chỉ 'clean' có hành vi đầy đủ ở lượt này).
// KHÔNG sửa logic game — chỉ thêm đường đọc/điều khiển cho harness.
import type { GameMap, MapRoad } from './mapLoader';
import { roadById, roadLength, pointAtS } from './mapLoader';
import type { VehicleHandle, VehicleInput } from './vehicle';
import type { TrafficLightController } from './trafficLights';

export const AP_DT = 0.1; // bước sim cố định cho autopilot (deterministic theo số step)

export type AutopilotScenario =
  | 'clean'         // đi đúng luật
  | 'red_run'       // Ph10: chạy đèn đỏ
  | 'stop_line_run' // Ph10: không dừng vạch
  | 'wrong_lane'    // Ph10: lấn làn ngược
  | 'overspeed'     // Ph10: quá tốc độ
  | 'nosignal'      // Ph10: không xi-nhan khi rẽ
  | 'ignore_zebra'; // Ph10: không nhường zebra

export interface AutopilotStep {
  roadId: string;
  dir: 1 | -1;
  turnAtEnd: 'left' | 'right' | 'straight';
  viaNodeId: string;
}

export interface AutopilotRoute {
  seed: number;
  spawn: { roadId: string; s: number };
  steps: AutopilotStep[];
  checkpoints: Array<{ id: number; type: string; roadId: string; roadName: string; s: number | null; x: number; z: number; label: string }>;
}

export interface AutopilotEvent { t: number; kind: string; detail: string; x: number; z: number; }

export interface AutopilotTelemetry {
  active: boolean;
  done: boolean;
  scenario: AutopilotScenario;
  stepIdx: number;
  roadId: string;
  s: number;
  distToEnd: number;
  speed: number;
  vTarget: number;
  waitingRed: boolean;
  stuckT: number;
  simTime: number;
  distToNextCp: number | null;
  nextCpId: number | null;
  phase: string | null;
  distToStopLine: number | null;
  events: AutopilotEvent[];
  /** harness-debug: trạng thái pursuit hiện tại (frame cuối của update) */
  dbg?: { hErr: number; vTarget: number; tx: number; tz: number; lateral: number; turnPhase: boolean; recover: boolean };
}

// ── hình học ──
/** Chiếu điểm (x,z) lên polyline road → s + khoảng cách ngang (có dấu theo phải flow) */
function projectOnRoad(road: MapRoad, x: number, z: number): { s: number; lateral: number } {
  let best = { s: 0, d2: Infinity, lateral: 0 };
  let acc = 0;
  for (let i = 1; i < road.points.length; i++) {
    const ax = road.points[i-1][0], az = road.points[i-1][1];
    const bx = road.points[i][0], bz = road.points[i][1];
    const vx = bx-ax, vz = bz-az;
    const l2 = vx*vx + vz*vz || 1;
    const t = Math.max(0, Math.min(1, ((x-ax)*vx + (z-az)*vz) / l2));
    const px = ax + vx*t, pz = az + vz*t;
    const d2 = (x-px)*(x-px) + (z-pz)*(z-pz);
    if (d2 < best.d2) {
      const segLen = Math.sqrt(l2);
      const h = Math.atan2(vx, vz);
      // phải flow = (−cos h, sin h); lateral > 0 = bên phải flow
      const lateral = (x-px)*(-Math.cos(h)) + (z-pz)*(Math.sin(h));
      best = { s: acc + segLen*t, d2, lateral };
    }
    acc += Math.sqrt(l2);
  }
  return { s: best.s, lateral: best.lateral };
}

export class AutopilotDriver {
  scenario: AutopilotScenario = 'clean';
  debugCam: 'none' | 'topdown' = 'none';
  private stepIdx = 0;
  private done = false;
  private started = false;
  private simT = 0;
  private stuckT = 0;
  private events: AutopilotEvent[] = [];
  private signalPulse: { left: boolean; right: boolean } = { left: false, right: false };
  private signalPulsed = false;
  private turnPhase = false; // đang băng qua nút (sau khi đáy step)
  private lastLateral = 0;
  private cpIdx = 0; // checkpoint kế tiếp theo thứ tự route
  private cpLastDist: number | null = null;
  private lastSwitchT = -10;
  private lastSignalPulseT = -10;
  private lastWaitingRed = false;
  private lastDbg: AutopilotTelemetry['dbg'] = undefined;
  private recoverUntil = -10;
  private stuckDriveT = 0;
  private reverseUntil = -10;
  private donutTrail: Array<{ t: number; x: number; z: number }> = [];
  private vehicle: VehicleHandle | null = null;

  constructor(
    private map: GameMap,
    private controllers: TrafficLightController[],
    private route: AutopilotRoute,
  ) {}

  /** gắn vehicle handle sau khi createVehicle resolve (async) */
  attach(vehicle: VehicleHandle): void {
    this.vehicle = vehicle;
  }

  start(scenario: AutopilotScenario = 'clean'): void {
    this.scenario = scenario;
    this.started = true;
    this.done = false;
    this.stepIdx = 0;
    this.cpIdx = 0;
    this.pushEvent('start', `scenario=${scenario} steps=${this.route.steps.length}`);
  }

  private pushEvent(kind: string, detail: string): void {
    const st = this.vehicle?.state;
    if (!st) return;
    this.events.push({ t: +this.simT.toFixed(1), kind, detail, x: +st.x.toFixed(2), z: +st.z.toFixed(2) });
  }

  private road(): MapRoad | null { return roadById(this.map, this.route.steps[this.stepIdx]?.roadId ?? '') ?? null; }
  private dir(): 1 | -1 { return this.route.steps[this.stepIdx]?.dir ?? 1; }

  /** offset làn PHẢI từ tim đường (khớp convention spawnFromMap: phải flow = (−cos h, sin h)) */
  private laneOff(road: MapRoad, dir: 1 | -1): number {
    const isSingleOneway = road.lanesBackward === 0 && road.lanesForward === 1;
    if (isSingleOneway) return 0;
    return (dir > 0 ? road.lanesForward - 0.5 : road.lanesBackward - 0.5) * road.laneWidth;
  }
  /** điểm tâm-làn tại s: pointAtS + right-of-flow × laneOff */
  private lanePoint(road: MapRoad, dir: 1 | -1, s: number, off: number): { x: number; z: number } {
    const pt = pointAtS(road, s);
    const flowH = dir > 0 ? pt.heading : pt.heading + Math.PI;
    return { x: pt.x + (-Math.cos(flowH)) * off, z: pt.z + Math.sin(flowH) * off };
  }

  /** mỗi sim-step: trả VehicleInput cho vehicle.update */
  update(dt: number): VehicleInput {
    const idle: VehicleInput = { throttle: 0, brake: 1, steer: 0 };
    if (!this.vehicle || !this.started || this.done) return idle;
    const st = this.vehicle.state;
    this.simT += dt;

    const road = this.road();
    if (!road) { this.done = true; this.pushEvent('done', 'hết route (road không tồn tại)'); return idle; }
    const dir = this.dir();
    const len = roadLength(road);
    const proj = projectOnRoad(road, st.x, st.z);
    let s = proj.s;
    if (dir < 0) s = len - s; // s theo chiều DI CHUYỂN

    // đáy qua nút → chuyển step kế (s vượt gần hết road).
    // cooldown 0.8s sau switch: trường hợp U-turn (road cũ chiều ngược) s mới ≈ len ngay
    // → không chặn thì sẽ advance 2 step trong 1 frame.
    const endMargin = 3.0;
    if (this.simT - this.lastSwitchT > 0.8 && s >= len - endMargin) {
      if (this.stepIdx >= this.route.steps.length - 1) {
        this.done = true;
        this.pushEvent('done', `hoàn thành route`);
        return idle;
      }
      this.turnPhase = true;
      this.stepIdx++;
      this.lastSwitchT = this.simT;
      this.signalPulsed = false;
      const next = this.road();
      this.pushEvent('arrive_node', `step=${this.stepIdx} road=${next?.id} turn=${this.route.steps[this.stepIdx - 1]?.turnAtEnd}`);
      return this.update(0); // chạy lại với road mới (dt=0 để không trôi thời gian)
    }

    const laneOff = this.laneOff(road, dir);
    const distToEnd = len - s;
    const turn = this.route.steps[this.stepIdx].turnAtEnd;

    // ── xi-nhan: toggle semantics (input 1 frame = bật/đổi) — pulse CHỈ khi trạng thái
    // hiện tại của xe khác desired. Pulse cùng side 2 lần = TẮT (bug nosignal oan đã sửa).
    const wantSignal: 'left' | 'right' | null =
      turn === 'left' ? 'left' : turn === 'right' ? 'right' : null;
    if (this.vehicle && this.scenario !== 'nosignal') {
      const cur = this.vehicle.signal;
      const approachingTurn = wantSignal !== null && distToEnd < 55 && distToEnd > 8;
      const passedTurn = wantSignal === null && distToEnd < Math.max(10, len * 0.35);
      if (approachingTurn && cur !== wantSignal && this.simT - this.lastSignalPulseT > 0.6) {
        this.signalPulse[wantSignal] = true;
        this.lastSignalPulseT = this.simT;
      } else if (passedTurn && cur !== wantSignal && this.simT - this.lastSignalPulseT > 1.2) {
        // tắt đèn sau khi qua (pulse side đang bật)
        const side: 'left' | 'right' = cur === 'left' ? 'left' : 'right';
        this.signalPulse[side] = true;
        this.lastSignalPulseT = this.simT;
      }
    }

    // ── đèn đỏ phía trước (nút cuối của step hiện tại) ──
    const nodeAhead = this.route.steps[this.stepIdx].viaNodeId;
    const ctrl = this.controllers.find(c => c.nodeId === nodeAhead);
    const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
    const stopS = dir > 0 ? len - half - 2 : half + 2;
    const distToStop = dir > 0 ? stopS - s : s - stopS;
    let phase: string | null = null;
    let waitingRed = false;
    if (ctrl) {
      phase = ctrl.phaseForArm(road.id, dir > 0 ? 'to' : 'from');
    }

    // ── tốc mục tiêu ──
    const roadLimit = (road.speedLimit ?? 50) / 3.6;
    let vTarget = Math.min(11, roadLimit);
    if (this.scenario === 'overspeed') vTarget = Math.min(14, roadLimit + 5);
    if (this.turnPhase || (turn !== 'straight' && distToEnd < 22)) vTarget = Math.min(vTarget, 3.5); // rẽ chậm — U-turn 180° cần R nhỏ

    if (ctrl && phase && (phase === 'red' || phase === 'red_yellow') && this.scenario !== 'red_run') {
      if (distToStop > -1 && distToStop < 30) {
        vTarget = Math.min(vTarget, Math.max(0, (distToStop - 1.2) * 0.55));
        if (distToStop <= 6) { waitingRed = true; } // chờ đèn trong 6m cuối = KHÔNG tính stuck
        if (distToStop <= 2.2) vTarget = 0;
      }
    }

    // ── pure-pursuit steering (công thức hình học chuẩn δ = atan(2·L·sinα / ld)) ──
    // P-gain theo heading error (bản cũ) saturate ±33° → xe snaking, quăng vào nhà, donuts.
    // PP hình học tự giới hạn δ ≤ atan(2L/ld) ≈ 23° với ld 12m → theo lane mượt, U-turn ổn.
    const donutActive = this.simT < this.recoverUntil;
    const look = donutActive ? 18 : Math.max(9, Math.min(16, 7 + st.speed * 0.9));
    const lookS = Math.min(len - 0.1, s + look);
    const tp = this.lanePoint(road, dir, lookS, laneOff);
    const dx = tp.x - st.x, dz = tp.z - st.z;
    const targetH = Math.atan2(dx, dz);
    let hErr = targetH - st.heading;
    while (hErr > Math.PI) hErr -= 2 * Math.PI;
    while (hErr < -Math.PI) hErr += 2 * Math.PI;
    if (Math.abs(hErr) > 1.0) vTarget = Math.min(vTarget, 2.5);
    if (donutActive) vTarget = Math.min(vTarget, 2.0);
    const ld = Math.max(4, Math.hypot(dx, dz));
    const WHEELBASE = 2.6; // khớp vehicle.ts (không export)
    const delta = Math.atan((2 * WHEELBASE * Math.sin(hErr)) / ld); // δ dương = quay trái
    // input: steer −1 = trái (h tăng) — δ dương (trái) → input âm
    const steer = Math.max(-1, Math.min(1, -delta / 0.58));
    if (this.turnPhase && Math.abs(hErr) < 0.2 && st.speed > 0.5) this.turnPhase = false;

    // ── P speed control → ga/phanh ──
    const err = vTarget - st.speed;
    const throttle = Math.max(0, Math.min(1, err * 0.55));
    const brake = err < -0.25 ? Math.max(0, Math.min(1, -err * 0.4)) : 0;

    // ── Reverse-escape: (a) ga đầy mà xe đứng (|v| < 0.3) quá 2.5s (kẹt trong building), hoặc
    // (b) lệch làn > 5m kéo dài 5s dù xe vẫn lăn bánh chậm (trượt dọc tường nhà, không cắt được
    // về làn) → lùi 1.6s, phanh 1s dừng đà, trả số D lái tiếp — gear LUÔN trả rõ (D/R) ──
    if ((Math.abs(st.speed) < 0.3 && throttle > 0.8) ||
        (Math.abs(proj.lateral) > 5 && st.speed < 3 && throttle > 0.5)) this.stuckDriveT += dt;
    else this.stuckDriveT = 0;
    if (this.simT < this.reverseUntil) {
      return { throttle: 0.8, brake: 0, steer: 0, gear: 'R' };
    }
    if (this.simT < this.reverseUntil + 1.0) {
      return { throttle: 0, brake: 1, steer: 0, gear: 'D' }; // dừng đà lùi trước khi lái tiếp
    }
    if (this.stuckDriveT > 2.5) {
      this.reverseUntil = this.simT + 1.6;
      this.stuckDriveT = 0;
      this.pushEvent('reverse_escape', `kẹt (throttle đầy, |v|<0.3) → lùi 1.6s tại road=${road.id}`);
      return { throttle: 0.8, brake: 0, steer: 0, gear: 'R' };
    }

    // ── donut detector: 5s qua di chuyển < 14m dù xe vẫn chạy nhanh (vòng tròn 2.5 vòng
    // chỉ biến vị 2×bán kính) → recovery: look 18m + v ≤ 2 m/s để pursuit kịp hội tụ ──
    this.donutTrail.push({ t: this.simT, x: st.x, z: st.z });
    while (this.donutTrail.length && this.simT - this.donutTrail[0].t > 5) this.donutTrail.shift();
    if (this.donutTrail.length > 15) {
      const first = this.donutTrail[0];
      const disp = Math.hypot(st.x - first.x, st.z - first.z);
      if (disp < 14 && st.speed > 3 && this.simT > this.recoverUntil) {
        this.recoverUntil = this.simT + 6;
        this.donutTrail = [];
        this.pushEvent('donut', `xe quay vòng tại (${st.x.toFixed(0)},${st.z.toFixed(0)}) — recovery look=18 v≤2`);
      }
    }

    // ── stuck detection (ngoài chờ đèn) ──
    if (Math.abs(st.speed) < 0.15 && !waitingRed) this.stuckT += dt;
    else this.stuckT = 0;
    if (this.stuckT > 10 && this.stuckT % 10 < dt) this.pushEvent('stuck', `speed<0.15 quá 10s tại road=${road.id} s=${s.toFixed(0)}`);

    // ── checkpoint kế tiếp ──
    let distCp = Infinity;
    let cpId: number | null = null;
    while (this.cpIdx < this.route.checkpoints.length) {
      const cp = this.route.checkpoints[this.cpIdx];
      const d = Math.hypot(cp.x - st.x, cp.z - st.z);
      if (d < 7) { distCp = 0; cpId = cp.id; break; } // trigger playwright chụp
      if (d < 30) { distCp = d; cpId = cp.id; }
      break;
    }

    this.lastLateral = proj.lateral;
    this.lastWaitingRed = waitingRed;
    this.lastDbg = { hErr: +hErr.toFixed(2), vTarget: +vTarget.toFixed(2), tx: +tp.x.toFixed(1), tz: +tp.z.toFixed(1), lateral: +proj.lateral.toFixed(1), turnPhase: this.turnPhase, recover: this.simT < this.recoverUntil };
    return {
      throttle,
      brake,
      steer,
      gear: 'D', // LUÔN trả D — gear R chỉ tồn tại trong reverse-escape (bug kẹt số R đã sửa)
      signalLeft: this.signalPulse.left,
      signalRight: this.signalPulse.right,
    };
  }

  /** sau khi vehicle.update chạy xong, gọi để tắt pulse xi-nhan */
  endStep(): void {
    this.signalPulse.left = false;
    this.signalPulse.right = false;
  }

  telemetry(): AutopilotTelemetry {
    const st = this.vehicle?.state ?? { x: 0, z: 0, heading: 0, speed: 0, gear: 'D' as const, t: 0 };
    const road = this.road();
    const dir = this.dir();
    const len = road ? roadLength(road) : 0;
    const proj = road ? projectOnRoad(road, st.x, st.z) : { s: 0, lateral: 0 };
    const s = road ? (dir > 0 ? proj.s : len - proj.s) : 0;
    let distCp = Infinity;
    let cpId: number | null = null;
    const cp = this.route.checkpoints[this.cpIdx];
    if (cp) { distCp = Math.hypot(cp.x - st.x, cp.z - st.z); cpId = cp.id; }
    let phase: string | null = null;
    let distToStopLine: number | null = null;
    if (road) {
      const nodeAhead = this.route.steps[this.stepIdx]?.viaNodeId;
      const ctrl = this.controllers.find(c => c.nodeId === nodeAhead);
      if (ctrl) phase = ctrl.phaseForArm(road.id, dir > 0 ? 'to' : 'from');
      const half = (road.lanesForward + road.lanesBackward) * road.laneWidth / 2;
      const stopS = dir > 0 ? len - half - 2 : half + 2;
      distToStopLine = +(dir > 0 ? stopS - s : s - stopS).toFixed(1);
    }
    return {
      active: this.started && !this.done,
      done: this.done,
      scenario: this.scenario,
      stepIdx: this.stepIdx,
      roadId: road?.id ?? '',
      s: +s.toFixed(1),
      distToEnd: +Math.max(0, len - s).toFixed(1),
      speed: +st.speed.toFixed(2),
      vTarget: 0,
      waitingRed: this.lastWaitingRed,
      stuckT: +this.stuckT.toFixed(1),
      simTime: +this.simT.toFixed(1),
      distToNextCp: Number.isFinite(distCp) ? +distCp.toFixed(1) : null,
      nextCpId: cpId,
      phase,
      distToStopLine,
      events: this.events.slice(-20),
      dbg: this.lastDbg,
    };
  }

  /** playwright hỏi: checkpoint này đã trigger chưa (và tiêu thụ nó).
   *  Nếu xe ĐÃ LƯỚT QUA (tới gần rồi đi xa) mà chưa trigger → đánh dấu missed, nhảy cp kế. */
  consumeTriggeredCp(): number | null {
    const cp = this.route.checkpoints[this.cpIdx];
    if (!cp || !this.vehicle) return null;
    const st = this.vehicle.state;
    const d = Math.hypot(cp.x - st.x, cp.z - st.z);
    const last = this.cpLastDist ?? d;
    this.cpLastDist = d;
    if (d < 7) { this.cpIdx++; this.cpLastDist = null; return cp.id; }
    if (last < 26 && d >= 26) {
      this.cpIdx++;
      this.cpLastDist = null;
      this.pushEvent('missed_cp', `CP${cp.id} ${cp.type} @${cp.roadName || cp.roadId} — xe đi qua ngoài bán kính 7m`);
    }
    return null;
  }
}
