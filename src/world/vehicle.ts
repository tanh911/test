// 🚙 vehicle.ts — xe người chơi (Protocol Prompt 7: physics + camera cabin)
// Kinematic bicycle model, không cần rapier cho MVP:
//   speed: ga/phanh/tự do; heading += (speed/L)·tan(δ)·dt (δ dương = quay trái).
// Convention map: heading h → hướng chạy (sin h, cos h); GLB xe mặt −Z → rotation.y = h + π.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
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
  /** độ chúc/ngóc đầu xe theo hệ thống treo (rad, âm = chúi mũi khi phanh) */
  readonly bodyPitch: number;
  /** độ nghiêng thân xe khi vào cua theo lực ly tâm (rad) */
  readonly bodyRoll: number;
  update: (dt: number, input: VehicleInput) => void;
  /** áp lại pose từ state (sau va chạm đẩy vị trí) */
  syncPose: () => void;
  /** pose ghế lái cho camera cabin */
  seatPose: () => { x: number; y: number; z: number; yaw: number };
  /** đổi số P R N D */
  setGear: (g: 'P' | 'R' | 'N' | 'D') => void;
  /** cập nhật hiển thị chi tiết theo camera mode (ẩn gương ngoài khi ở cabin/hood) */
  setCameraMode: (mode: 'cabin' | 'hood' | 'outside' | 'mirror' | 'shoulder') => void;
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
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  loader.setDRACOLoader(dracoLoader);

  let gltf;
  try {
    gltf = await loader.loadAsync('/simv2/car_real_player.glb');
  } catch {
    gltf = await loader.loadAsync('/simv2/car_player.glb');
  }

  const group = gltf.scene;
  group.rotation.order = 'YXZ';
  const brakeLightMats: THREE.MeshStandardMaterial[] = [];

  group.traverse(o => {
    if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh;
      m.castShadow = true;
      m.receiveShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        mat.side = THREE.FrontSide;
        const mstd = mat as THREE.MeshStandardMaterial;
        if (mat.name === 'Body_Color' || mat.name === 'paint_player') {
          mstd.color.set('#1d4ed8'); // Xanh Sapphire ánh kim Đức (Bavarian Metallic Blue)
          mstd.roughness = 0.20;
          mstd.metalness = 0.68;
        } else if (mat.name === 'Glass_Gray' || mat.name === 'Projector_Glass' || mat.name === 'window') {
          mstd.color.set('#0f172a');
          mstd.transparent = true;
          mstd.opacity = 0.28;
          mstd.roughness = 0.08;
          mstd.metalness = 0.15;
          mstd.depthWrite = false;
        } else if (mat.name === 'Taillight_Glass' || m.name === 'lights_red') {
          mstd.color.set('#dc2626');
          mstd.emissive = new THREE.Color(0xff1111);
          mstd.emissiveIntensity = 0.45;
          if (!brakeLightMats.includes(mstd)) brakeLightMats.push(mstd);
        } else if (mat.name === 'metal_chrome' || mat.name === 'metal_gray') {
          mstd.roughness = 0.18;
          mstd.metalness = 0.85;
        } else if (mat.name === 'Tires' || mat.name === 'tire') {
          mstd.color.set('#18181b');
          mstd.roughness = 0.82;
          mstd.metalness = 0.08;
        }
      }
    }
  });
  group.name = 'vehicle_player';

  // Thiết lập khớp xoay trục lái (steerPivot) và trục lăn bánh (spinPivot) cho 4 bánh xe thật
  const frontSteerPivots: THREE.Group[] = [];
  const wheelSpinPivots: THREE.Group[] = [];
  for (const wName of ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']) {
    const wObj = group.getObjectByName(wName);
    if (wObj && wObj.parent) {
      const steerPivot = new THREE.Group();
      steerPivot.name = `${wName}_steer`;
      steerPivot.position.copy(wObj.position);

      const spinPivot = new THREE.Group();
      spinPivot.name = `${wName}_spin`;

      wObj.parent.add(steerPivot);
      steerPivot.add(spinPivot);
      wObj.position.set(0, 0, 0);
      spinPivot.add(wObj);

      if (wName === 'wheel_fl' || wName === 'wheel_fr') {
        frontSteerPivots.push(steerPivot);
      }
      wheelSpinPivots.push(spinPivot);
    }
  }

  // Vô lăng 3D bên trong buồng lái xe thật
  const steeringWheelObj = group.getObjectByName('steering_wheel');
  const steeringWheelInitQuat = steeringWheelObj ? steeringWheelObj.quaternion.clone() : null;
  const steerColAxis = new THREE.Vector3(0, 1, 0);
  const steerRotQuat = new THREE.Quaternion();

  // Scale xe chuẩn kích thước thực tế trên làn đường Đức (~1.82 m rộng) và đặt lốp chạm đúng mặt nhựa đường (y = 0)
  const preBox = new THREE.Box3().setFromObject(group);
  const preSize = preBox.getSize(new THREE.Vector3());
  if (preSize.x > 0.5) {
    const fit = 1.82 / preSize.x;
    if (Math.abs(fit - 1) > 0.03) group.scale.setScalar(fit);
  }
  group.updateMatrixWorld(true);
  const groundBox = new THREE.Box3().setFromObject(group);
  const baseY = -groundBox.min.y;

  const spawn = spawnFromMap(map);
  const state: VehicleState = { x: spawn.x, z: spawn.z, heading: spawn.heading, speed: 0, gear: 'D', t: 0 };
  let steerAngle = 0; // dương = trái (A)
  let steerHoldTime = 0;
  let lastSteerDir = 0;
  let smoothThrottle = 0;
  let smoothBrake = 0;
  let lastThrottle = 0;
  let lastBrake = 0;
  let wheelRoll = 0;
  let bodyPitch = 0;
  let bodyRoll = 0;
  let hasStartedDriving = false;
  let autoHold = true; // giữ phanh đứng yên ở vạch xuất phát / đèn đỏ cho đến khi nhấp ga W

  const lamps = attachBlinkers(group);
  let signal: 'left' | 'right' | null = null;
  let signalT = 0;      // thời gian nhấp nháy đã trôi (chỉ tăng khi signal bật)
  let signalLeftPrev = false;
  let signalRightPrev = false;
  let signalState: 'IDLE' | 'SIGNAL_ON' | 'TURNING' = 'IDLE';
  let eventHandler: VehicleEventHandler | undefined;
  const emitEvent = (ev: VehicleEvent) => { eventHandler?.(ev); };

  const applyPose = () => {
    group.position.set(state.x, baseY, state.z);
    group.rotation.set(bodyPitch, state.heading + Math.PI, bodyRoll);
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
    get bodyPitch() {
      return bodyPitch;
    },
    get bodyRoll() {
      return bodyRoll;
    },
    onEvent(fn: VehicleEventHandler) {
      eventHandler = fn;
    },
    update(dt: number, input: VehicleInput) {
      // ── 1. Hệ thống đánh lái lũy tiến (Progressive EPS Steering) ──
      // Nhấp nhẹ phím A/D -> chỉnh làn cực mượt; giữ phím A/D -> đánh lái nhanh để ôm cua 90°
      const spd = Math.abs(state.speed);
      const steerSpeedFactor = Math.max(0.52, 1.15 - 0.55 * (spd / 16));
      const dynamicMaxSteer = MAX_STEER * Math.max(0.50, 1.0 - 0.45 * (spd / 18));

      if (input.steer !== 0) {
        if (input.steer === lastSteerDir) {
          steerHoldTime = Math.min(0.5, steerHoldTime + dt);
        } else {
          steerHoldTime = 0;
          lastSteerDir = input.steer;
        }
        // Độ nhạy tăng mượt từ 42% (nhấp chỉnh làn) lên 100% sau 0.22 giây giữ phím
        const progressiveCurve = 0.42 + 0.58 * Math.min(1, steerHoldTime / 0.22);
        const effectiveSteerRate = STEER_RATE * steerSpeedFactor * progressiveCurve;
        steerAngle += -input.steer * effectiveSteerRate * dt;
      } else {
        steerHoldTime = 0;
        lastSteerDir = 0;
        // Lực tự trả lái (Caster / Ackermann self-aligning torque) tỷ lệ thuận với tốc độ xe
        const returnFactor = Math.max(0.32, Math.min(1.25, 0.28 + spd / 5.8));
        const returnStep = STEER_CENTER * returnFactor * dt;
        if (Math.abs(steerAngle) <= returnStep) {
          steerAngle = 0;
        } else {
          steerAngle -= Math.sign(steerAngle) * returnStep;
        }
      }
      steerAngle = Math.max(-dynamicMaxSteer, Math.min(dynamicMaxSteer, steerAngle));

      // ── 2. Độ trễ bàn đạp Ga / Phanh & Hộp số tự động Đức (P, R, N, D + Kriechmodus + Auto-Hold) ──
      state.t += dt;
      lastThrottle = input.throttle;
      lastBrake = input.brake;
      smoothThrottle += (input.throttle - smoothThrottle) * Math.min(1, 10.5 * dt);
      smoothBrake += (input.brake - smoothBrake) * Math.min(1, 14.0 * dt);

      if (input.gear) {
        state.gear = input.gear;
      }
      if (input.throttle > 0) {
        hasStartedDriving = true;
        autoHold = false;
      }

      let a = 0;
      const currentAccel = input.boost ? ACCEL * 1.45 : ACCEL;
      const CREEP_SPEED = 1.45; // ~5.2 km/h (Kriechmodus chuẩn xe số tự động khi nhả phanh)

      if (state.gear === 'P') {
        state.speed = 0;
        a = 0;
        autoHold = true;
      } else if (state.gear === 'N') {
        if (input.brake > 0) {
          a = -Math.sign(state.speed) * (0.45 + 0.55 * smoothBrake) * BRAKE;
        } else {
          a = -DRAG * state.speed * 1.2;
        }
        state.speed += a * dt;
        if (input.brake > 0 && Math.abs(state.speed) < 0.1) state.speed = 0;
      } else if (state.gear === 'D') {
        if (state.speed < 0) state.speed = 0;

        if (input.brake > 0) {
          if (state.speed > 0.05) {
            // Phanh êm ở đầu hành trình bàn đạp và ăn mạnh dần khi giữ S
            a = -(0.45 + 0.55 * smoothBrake) * BRAKE;
          } else {
            state.speed = 0;
            a = 0;
            autoHold = true; // Kích hoạt Auto-Hold giữ xe đứng yên khi đã phanh dừng hẳn
          }
        } else if (input.throttle > 0) {
          a = smoothThrottle * currentAccel - DRAG * state.speed;
        } else if (hasStartedDriving && !autoHold) {
          // Nhả ga & nhả phanh khi đang lăn bánh: phanh động cơ (Engine Braking) êm ái về tốc độ bò Kriechmodus (~5 km/h)
          if (state.speed > CREEP_SPEED + 0.1) {
            a = -(0.85 + DRAG * state.speed * 1.35);
          } else if (state.speed < CREEP_SPEED - 0.05) {
            a = 1.25;
          } else {
            a = 0;
          }
        } else {
          state.speed = 0;
          a = 0;
        }

        state.speed = Math.max(0, Math.min(MAX_SPEED_FWD, state.speed + a * dt));
      } else if (state.gear === 'R') {
        if (state.speed > 0) state.speed = 0;

        if (input.brake > 0) {
          if (state.speed < -0.05) {
            a = (0.45 + 0.55 * smoothBrake) * BRAKE;
          } else {
            state.speed = 0;
            a = 0;
            autoHold = true;
          }
        } else if (input.throttle > 0) {
          const revAccel = ACCEL * 0.72;
          a = -smoothThrottle * revAccel - DRAG * state.speed;
        } else {
          a = -DRAG * state.speed * 1.8 - Math.sign(state.speed) * 0.65;
        }

        state.speed = Math.max(MAX_SPEED_REV, Math.min(0, state.speed + a * dt));
        if (input.throttle === 0 && Math.abs(state.speed) < 0.08) state.speed = 0;
      }

      // ── 3. Kinematic Bicycle Model + Hệ thống treo (Suspension Pitch & Roll) ──
      const yawRate = Math.abs(state.speed) > 0.01 ? (state.speed / WHEELBASE) * Math.tan(steerAngle) : 0;
      if (Math.abs(state.speed) > 0.01) {
        state.heading += yawRate * dt;
        state.x += Math.sin(state.heading) * state.speed * dt;
        state.z += Math.cos(state.heading) * state.speed * dt;
      }

      // Tính độ chúc đầu xe (Pitch) theo gia tốc dọc a và độ nghiêng thân xe (Roll) theo gia tốc hướng tâm v * yawRate
      const targetPitch = Math.max(-0.028, Math.min(0.020, a * 0.0032));
      const lateralAccel = state.speed * yawRate;
      const targetRoll = Math.max(-0.048, Math.min(0.048, -lateralAccel * 0.0065));
      bodyPitch += (targetPitch - bodyPitch) * Math.min(1, 8.5 * dt);
      bodyRoll += (targetRoll - bodyRoll) * Math.min(1, 7.5 * dt);

      // ── 4. Chuyển động 4 bánh xe (Steer + Spin), Vô lăng 3D & Đèn phanh ──
      const tireRadius = 0.34;
      wheelRoll = (wheelRoll + (state.speed * dt) / tireRadius) % (Math.PI * 2);
      for (const fp of frontSteerPivots) {
        fp.rotation.y = steerAngle;
      }
      for (const sp of wheelSpinPivots) {
        sp.rotation.x = -wheelRoll;
      }
      if (steeringWheelObj && steeringWheelInitQuat) {
        steerRotQuat.setFromAxisAngle(steerColAxis, -steerAngle * 2.6);
        steeringWheelObj.quaternion.copy(steeringWheelInitQuat).multiply(steerRotQuat);
      }
      const isBrakingOrHeld = input.brake > 0 || (Math.abs(state.speed) < 0.08 && state.gear !== 'P');
      for (const bMat of brakeLightMats) {
        bMat.emissiveIntensity = isBrakingOrHeld ? 2.5 : 0.42;
      }

      // ── 5. Xi-nhan do người chơi điều khiển: Q trái, E phải, bấm lại tắt ──
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
      // ghế lái LHD chuẩn của mô hình xe 3D
      const lx = -0.34;
      const ly = 1.18;
      const lz = -0.08;
      const s = Math.sin(state.heading + Math.PI);
      const c = Math.cos(state.heading + Math.PI);
      const wx = state.x + lx * c + lz * s;
      const wz = state.z + -lx * s + lz * c;
      return { x: wx, y: ly, z: wz, yaw: state.heading + Math.PI };
    },

    setGear(g: 'P' | 'R' | 'N' | 'D') {
      state.gear = g;
    },

    setCameraMode(mode: 'cabin' | 'hood' | 'outside' | 'mirror' | 'shoulder') {
      const isCabin = mode === 'cabin';
      const mirror = group.getObjectByName('body_4');
      if (mirror) mirror.visible = !isCabin;
      const dash = group.getObjectByName('body_7');
      if (dash) dash.visible = !isCabin;
      const seat = group.getObjectByName('body_8');
      if (seat) seat.visible = !isCabin;
    },

    dispose() {
      dracoLoader.dispose();
      scene.remove(group);
      group.traverse(o => {
        const m = o as THREE.Mesh;
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
