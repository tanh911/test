// 🚙 vehicle.ts — xe người chơi (Protocol Prompt 7: physics + camera cabin)
// Kinematic bicycle model, không cần rapier cho MVP:
//   speed: ga/phanh/tự do; heading += (speed/L)·tan(δ)·dt (δ dương = quay trái).
// Convention map: heading h → hướng chạy (sin h, cos h); GLB xe mặt −Z → rotation.y = h + π.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameMap, MapRoad } from './mapLoader';
import { roadById, pointAtS, roadPointAt } from './mapLoader';
import { roadHalfWidth, roadSkipZones, roadsAtNode } from './roadMesh';

// ── Sự kiện xe người chơi (G5) ──
export type VehicleEvent =
  | { type: 'signal_left'; x: number; z: number; t: number }
  | { type: 'signal_right'; x: number; z: number; t: number }
  | { type: 'signal_off'; x: number; z: number; t: number };

// Dispatcher tùy chọn: caller gán hàm này để nhận sự kiện xe
export type VehicleEventHandler = (ev: VehicleEvent) => void;

export interface VehicleInput {
  throttle: number; // 0..1 (W)
  brake: number;    // 0..1 (S) — đang tiến = phanh, đứng = lùi
  steer: number;    // −1 (A trái→h tăng) .. +1 (D phải→h giảm) — xử lý ở update
  gear?: 'P' | 'R' | 'N' | 'D'; // chuyển số sân (null = giữ nguyên)
  signalLeft?: boolean;   // Q: bật/tắt xi-nhan trái
  signalRight?: boolean;  // E: bật/tắt xi-nhan phải
  boost?: boolean;        // Shift: tăng tốc thể thao
}

export interface VehicleState {
  x: number;
  z: number;
  heading: number;
  speed: number; // m/s, âm = lùi
  gear: 'P' | 'R' | 'N' | 'D'; // số sân hiện tại
  t: number; // thời gian (giây)
}

const MAX_SPEED_FWD = 25.0; // 90 km/h (nâng từ 60 km/h để cảm giác lái thoát ga)
const MAX_SPEED_REV = -4.5;
const ACCEL = 5.2;          // m/s² (tăng từ 3.5 m/s² cho xe bốc và thật hơn)
const BRAKE = 8.5;          // m/s² (phanh dứt khoát chuẩn thực tế)
const DRAG = 0.08;
const WHEELBASE = 2.6;
const MAX_STEER = 0.58;      // ~33°
const STEER_RATE = 2.2;      // rad/s khi giữ phím
const STEER_CENTER = 3.6;    // tự về tim lái

// ── xi-nhan người chơi: TỰ BẬT khi lái, đối xứng với npc.ts (Prompt 8) ──
const STEER_SIGNAL_ON = 0.2;    // góc lái vượt ~11° = đang rẽ
const PLAYER_SIGNAL_HOLD = 1.6; // giữ đèn thêm sau khi thả lái (s)
const BLINK_PERIOD = 0.55;      // chu kỳ nhấp nháy (đồng bộ npc.ts)

// 🎇 4 đèn quad (trước/sau × trái/phải) — mẫu giống npc.ts, không import chéo
// (npc.ts import vehicle.ts → vehicle KHÔNG import npc để tránh vòng phụ thuộc)
const blinkerGeo = new THREE.BoxGeometry(0.03, 0.09, 0.18);
const blinkerMat = new THREE.MeshBasicMaterial({ color: 0xffa733 });

function attachBlinkers(group: THREE.Group): THREE.Mesh[] {
  const box = new THREE.Box3().setFromObject(group); // đo bbox GLB để đèn ôm sát thân
  const size = box.getSize(new THREE.Vector3());
  const hw = size.x / 2;
  const hl = size.z / 2;
  const lamps: THREE.Mesh[] = [];
  for (const side of ['left', 'right'] as const) {
    const x = (side === 'left' ? -1 : 1) * (hw + 0.03); // local −X = trái flow, +X = phải flow
    for (const zi of [-1, 1]) {
      const m = new THREE.Mesh(blinkerGeo, blinkerMat);
      m.position.set(x, size.y * 0.62, zi * (hl - 0.02)); // mặt trước GLB = −Z
      m.userData._blinkerSide = side;
      m.visible = false; // tắt mặc định → 0 draw call khi không rẽ
      group.add(m);
      lamps.push(m);
    }
  }
  return lamps;
}

export interface VehicleHandle {
  group: THREE.Group;
  state: VehicleState;
  /** xi-nhan đang bật (null = tắt) — đọc để check vi phạm 'nosignal' + mini-map */
  readonly signal: 'left' | 'right' | null;
  readonly steerAngle: number;
  readonly throttle: number;
  readonly brake: number;
  update: (dt: number, input: VehicleInput) => void;
  /** áp lại pose từ state (sau va chạm đẩy vị trí) */
  syncPose: () => void;
  /** pose ghế lái cho camera cabin */
  seatPose: () => { x: number; y: number; z: number; yaw: number };
  /** đổi số P R N D */
  setGear: (g: 'P' | 'R' | 'N' | 'D') => void;
  /** cập nhật hiển thị chi tiết theo camera mode (ẩn gương ngoài khi ở cabin) */
  setCameraMode: (mode: 'cabin' | 'outside' | 'mirror' | 'shoulder') => void;
  dispose: () => void;
  /** Gán hàm xử lý sự kiện xe (signal_left/right/off) */
  onEvent?: (fn: VehicleEventHandler) => void;
}

/** Vị trí spawn từ map.spawns.player: roadId + s + lane (0 = làn phải của chiều xuôi) */
export function spawnFromMap(map: GameMap): { x: number; z: number; heading: number } {
  const sp = map.spawns.player;
  const road = roadById(map, sp.roadId);
  if (!road) return { x: 0, z: 0, heading: 0 };
  const pt = pointAtS(road, sp.s);
  const flowX = Math.sin(pt.heading);
  const flowZ = Math.cos(pt.heading);
  // phải flow = (−fz, fx); lane k tâm = (k + 0.5)·laneWidth
  const laneOff = (sp.lane + 0.5) * road.laneWidth;
  const rx = -flowZ;
  const rz = flowX;
  return {
    x: pt.x + rx * laneOff,
    z: pt.z + rz * laneOff,
    heading: pt.heading
  };
}

export async function createVehicle(scene: THREE.Scene, map: GameMap): Promise<VehicleHandle> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('/simv2/car_player.glb');
  const group = gltf.scene;
  group.traverse(o => {
    if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh;
      m.castShadow = true;
      m.receiveShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) mat.side = THREE.FrontSide;
    }
  });
  group.name = 'vehicle_player';

  const spawn = spawnFromMap(map);
  const state: VehicleState = { x: spawn.x, z: spawn.z, heading: spawn.heading, speed: 0, gear: 'D', t: 0 };
  let steerAngle = 0; // dương = trái (A)
  let lastThrottle = 0;
  let lastBrake = 0;

  const lamps = attachBlinkers(group);
  let signal: 'left' | 'right' | null = null;
  let signalT = 0;      // thời gian nhấp nháy đã trôi (chỉ tăng khi signal bật)
  let signalLeftPrev = false;
  let signalRightPrev = false;
  let signalState: 'IDLE' | 'SIGNAL_ON' | 'TURNING' = 'IDLE';
  let eventHandler: VehicleEventHandler | undefined;
  const emitEvent = (ev: VehicleEvent) => { eventHandler?.(ev); };

  const applyPose = () => {
    group.position.set(state.x, 0, state.z);
    group.rotation.y = state.heading + Math.PI;
  };
  applyPose();
  scene.add(group);

  const vehicle: VehicleHandle = {
    group,
    state,
    get signal() {
      return signal;
    },
    get steerAngle() {
      return steerAngle;
    },
    get throttle() {
      return lastThrottle;
    },
    get brake() {
      return lastBrake;
    },
    onEvent(fn: VehicleEventHandler) {
      eventHandler = fn;
    },
    update(dt: number, input: VehicleInput) {
      // ── lái: input.steer −1 = A (trái, δ↑), +1 = D (phải, δ↓) ──
      // Độ nhạy đánh lái linh hoạt: nhạy hơn ở tốc độ chậm để dễ vào cua ngã tư
      const steerSpeedFactor = Math.max(0.65, 1.2 - 0.5 * (Math.abs(state.speed) / 15));
      const effectiveSteerRate = STEER_RATE * steerSpeedFactor;
      if (input.steer !== 0) {
        steerAngle += -input.steer * effectiveSteerRate * dt;
      } else {
        steerAngle -= Math.sign(steerAngle) * Math.min(Math.abs(steerAngle), STEER_CENTER * dt);
      }
      steerAngle = Math.max(-MAX_STEER, Math.min(MAX_STEER, steerAngle));

      // ── dọc: ga / phanh / lùi chuẩn xe số tự động (P, R, N, D) ──
      state.t += dt;
      lastThrottle = input.throttle;
      lastBrake = input.brake;

      if (input.gear) {
        state.gear = input.gear;
      }

      let a = 0;
      const currentAccel = input.boost ? ACCEL * 1.5 : ACCEL;

      if (state.gear === 'P') {
        // Số P: Khóa bánh, phanh đỗ, xe đứng yên hoàn toàn
        state.speed = 0;
        a = 0;
      } else if (state.gear === 'N') {
        // Số N: Mo, không có lực kéo động cơ, trôi tự do và phanh
        if (input.brake > 0) {
          a = -Math.sign(state.speed) * input.brake * BRAKE;
        } else {
          a = -DRAG * state.speed * 1.2;
        }
        state.speed += a * dt;
        if (input.brake > 0 && Math.abs(state.speed) < 0.1) state.speed = 0;
      } else if (state.gear === 'D') {
        // Số D: Lái tiến
        // W = Ga tiến (tốc độ > 0)
        // S = Phanh dừng xe (tốc độ về 0 và đứng yên, KHÔNG BAO GIỜ LÙI KHI Ở SỐ D)
        if (state.speed < 0) state.speed = 0;

        if (input.brake > 0) {
          if (state.speed > 0.05) {
            a = -input.brake * BRAKE;
          } else {
            state.speed = 0;
            a = 0;
          }
        } else if (input.throttle > 0) {
          a = input.throttle * currentAccel - DRAG * state.speed;
        } else {
          a = -DRAG * state.speed * 1.5;
        }

        state.speed = Math.max(0, Math.min(MAX_SPEED_FWD, state.speed + a * dt));
        if (input.throttle === 0 && state.speed < 0.08) state.speed = 0;
      } else if (state.gear === 'R') {
        // Số R: Lùi xe (bấm phím 2 hoặc chọn R để lùi)
        // W = Đạp ga lùi (tốc độ âm: từ 0 tới MAX_SPEED_REV)
        // S = Đạp phanh lùi (hãm tốc độ lùi về 0)
        if (state.speed > 0) state.speed = 0;

        if (input.brake > 0) {
          if (state.speed < -0.05) {
            a = input.brake * BRAKE; // gia tốc dương để hãm lùi về 0
          } else {
            state.speed = 0;
            a = 0;
          }
        } else if (input.throttle > 0) {
          const revAccel = ACCEL * 0.75;
          a = -input.throttle * revAccel - DRAG * state.speed;
        } else {
          a = -DRAG * state.speed * 1.5;
        }

        state.speed = Math.max(MAX_SPEED_REV, Math.min(0, state.speed + a * dt));
        if (input.throttle === 0 && Math.abs(state.speed) < 0.08) state.speed = 0;
      }

      // ── bicycle model ──
      if (Math.abs(state.speed) > 0.01) {
        state.heading += (state.speed / WHEELBASE) * Math.tan(steerAngle) * dt;
        state.x += Math.sin(state.heading) * state.speed * dt;
        state.z += Math.cos(state.heading) * state.speed * dt;
      }

      // ── xi-nhan do người chơi điều khiển: Q trái, E phải, bấm lại tắt ──
      // Máy trạng thái:
      //   IDLE       → người bật Q/E → SIGNAL_ON
      //   SIGNAL_ON  → vô lăng vượt ±15° → TURNING
      //   TURNING    → vô lăng quay về dưới ±15° → IDLE (signal tắt)
      // Người bật lại cùng nút → tắt ngay (IDLE).
      if (input.signalLeft && !signalLeftPrev) {
        if (signalState === 'SIGNAL_ON' && signal === 'left') {
          signal = null;
          signalState = 'IDLE';
          emitEvent({ type: 'signal_off', x: state.x, z: state.z, t: state.t });
        } else {
          signal = 'left';
          signalState = 'SIGNAL_ON';
          emitEvent({ type: 'signal_left', x: state.x, z: state.z, t: state.t });
        }
      }
      if (input.signalRight && !signalRightPrev) {
        if (signalState === 'SIGNAL_ON' && signal === 'right') {
          signal = null;
          signalState = 'IDLE';
          emitEvent({ type: 'signal_off', x: state.x, z: state.z, t: state.t });
        } else {
          signal = 'right';
          signalState = 'SIGNAL_ON';
          emitEvent({ type: 'signal_right', x: state.x, z: state.z, t: state.t });
        }
      }
      signalLeftPrev = !!input.signalLeft;
      signalRightPrev = !!input.signalRight;

      // Tự tắt khi vô lăng quay về dưới ngưỡng sau khi đã rẽ vượt ngưỡng.
      const STEER_TURN_THRESHOLD = 0.26; // ~15°
      if (signalState === 'SIGNAL_ON' && Math.abs(steerAngle) > STEER_TURN_THRESHOLD) {
        signalState = 'TURNING';
      }
      if (signalState === 'TURNING' && Math.abs(steerAngle) < STEER_TURN_THRESHOLD) {
        signal = null;
        signalState = 'IDLE';
        emitEvent({ type: 'signal_off', x: state.x, z: state.z, t: state.t });
      }
      if (signal) signalT += dt;

      // ── đèn nhấp nháy (chỉ rẽ mới có draw call) ──
      const blinkOn = signal !== null && (signalT % BLINK_PERIOD) < BLINK_PERIOD / 2;
      for (const lamp of lamps) {
        lamp.visible = blinkOn && (lamp.userData._blinkerSide as string) === signal;
      }

      applyPose();
    },

    syncPose() {
      applyPose();
    },

        seatPose() {
      // ghế lái LHD: glTF local (−0.32 = trái, mắt 1.18, z −0.10)
      const lx = -0.32;
      const ly = 1.18;
      const lz = -0.10;
      const s = Math.sin(state.heading + Math.PI);
      const c = Math.cos(state.heading + Math.PI);
      const wx = state.x + lx * c + lz * s;
      const wz = state.z + -lx * s + lz * c;
      return { x: wx, y: ly, z: wz, yaw: state.heading + Math.PI };
    },

    setGear(g: 'P' | 'R' | 'N' | 'D') {
      state.gear = g;
    },

    setCameraMode(mode: 'cabin' | 'outside' | 'mirror' | 'shoulder') {
      // Ẩn khối gương ngoài thô (body_4) khi ở trong cabin để không che góc kính lái
      const mirror = group.getObjectByName('body_4');
      if (mirror) {
        mirror.visible = mode !== 'cabin';
      }
    },

    dispose() {
      scene.remove(group);
      group.traverse(o => {
        const m = o as THREE.Mesh;
        // đèn xi-nhan dùng geo/mat chia sẻ cấp module → KHÔNG dispose (khớp npc.ts)
        if (m.userData?._blinkerSide) return;
        if (m.isMesh) {
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach(mat => mat?.dispose());
        }
      });
    }
  };

  return vehicle;
}
