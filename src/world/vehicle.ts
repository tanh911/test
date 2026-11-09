// 🚙 vehicle.ts — xe người chơi (Protocol Prompt 7: physics + camera cabin)
// Kinematic bicycle model, không cần rapier cho MVP:
//   speed: ga/phanh/tự do; heading += (speed/L)·tan(δ)·dt (δ dương = quay trái).
// Convention map: heading h → hướng chạy (sin h, cos h); GLB xe mặt −Z → rotation.y = h + π.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GameMap } from './mapLoader';
import { roadById, pointAtS } from './mapLoader';

export interface VehicleInput {
  throttle: number; // 0..1 (W)
  brake: number;    // 0..1 (S) — đang tiến = phanh, đứng = lùi
  steer: number;    // −1 (A trái→h tăng) .. +1 (D phải→h giảm) — xử lý ở update
  gear?: 'P' | 'R' | 'N' | 'D'; // chuyển số sân (null = giữ nguyên)
  signalLeft?: boolean;   // Q: bật/tắt xi-nhan trái
  signalRight?: boolean;  // E: bật/tắt xi-nhan phải
}

export interface VehicleState {
  x: number;
  z: number;
  heading: number;
  speed: number; // m/s, âm = lùi
  gear: 'P' | 'R' | 'N' | 'D'; // số sân hiện tại
}

const MAX_SPEED_FWD = 16.7; // 60 km/h
const MAX_SPEED_REV = -3.5;
const ACCEL = 3.5;
const BRAKE = 9.0;
const DRAG = 0.5;
const WHEELBASE = 2.6;
const MAX_STEER = 0.58;      // ~33°
const STEER_RATE = 1.8;      // rad/s khi giữ phím
const STEER_CENTER = 3.0;    // tự về tim lái

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
  update: (dt: number, input: VehicleInput) => void;
  /** áp lại pose từ state (sau va chạm đẩy vị trí) */
  syncPose: () => void;
  /** pose ghế lái cho camera cabin (local −0.38 = LHD) */
  seatPose: () => { x: number; y: number; z: number; yaw: number };
  dispose: () => void;
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
      // Blender export doubleSided → camera cabin nhìn mặt trong hộp kính thành đen.
      // Ép FrontSide: từ trong cabin, mặt trong bị culled → thấy ra ngoài qua kính.
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) mat.side = THREE.FrontSide;
    }
  });
  group.name = 'vehicle_player';

  const spawn = spawnFromMap(map);
  const state: VehicleState = { x: spawn.x, z: spawn.z, heading: spawn.heading, speed: 0, gear: 'D' };
  let steerAngle = 0; // dương = trái (A)

  // ── xi-nhan: latch theo hướng lái, `signal` đổi chỉ qua latch để đồng bộ đèn ──
  const lamps = attachBlinkers(group);
  let signal: 'left' | 'right' | null = null;
  let signalT = 0;      // thời gian nhấp nháy đã trôi (chỉ tăng khi signal bật)
  let signalLeftPrev = false;
  let signalRightPrev = false;
  let wasTurning = false; // đang rẽ, chờ vô lăng về giữa để tắt xi-nhan

  const applyPose = () => {
    group.position.set(state.x, 0, state.z);
    group.rotation.y = state.heading + Math.PI;
  };
  applyPose();
  scene.add(group);

  return {
    group,
    state,
    get signal() {
      return signal;
    },
    update(dt, input) {
      // ── lái: input.steer −1 = A (trái, δ↑), +1 = D (phải, δ↓) ──
      if (input.steer !== 0) {
        steerAngle += -input.steer * STEER_RATE * dt;
      } else {
        steerAngle -= Math.sign(steerAngle) * Math.min(Math.abs(steerAngle), STEER_CENTER * dt);
      }
      steerAngle = Math.max(-MAX_STEER, Math.min(MAX_STEER, steerAngle));

      // ── chuyển số sân ──
      if (input.gear) {
        state.gear = input.gear;
        // khi chuyển số, nếu xe đang di chuyển ngược với số mới → giảm speed về 0
        if (state.gear === 'D' && state.speed < 0) state.speed = 0;
        if (state.gear === 'R' && state.speed > 0) state.speed = 0;
      }

      // ── dọc: ga / phanh / lùi ──
      let throttle = input.throttle;
      // không thể ga ở P hoặc N
      if (state.gear === 'P' || state.gear === 'N') throttle = 0;
      // D chỉ cho tiến, R chỉ cho lùi
      if (state.gear === 'D' && state.speed < -0.1) throttle = 0;
      if (state.gear === 'R' && state.speed > 0.1) throttle = 0;

      let a = throttle * ACCEL - DRAG * state.speed;
      if (input.brake > 0) {
        if (state.speed > 0.1) a -= input.brake * BRAKE;
        else if (throttle === 0) a = -2.2; // lùi chậm khi đứng
      }
      state.speed = Math.max(MAX_SPEED_REV, Math.min(MAX_SPEED_FWD, state.speed + a * dt));
      if (throttle === 0 && input.brake === 0 && Math.abs(state.speed) < 0.05) state.speed = 0;

      // ── bicycle model ──
      if (Math.abs(state.speed) > 0.01) {
        state.heading += (state.speed / WHEELBASE) * Math.tan(steerAngle) * dt;
        state.x += Math.sin(state.heading) * state.speed * dt;
        state.z += Math.cos(state.heading) * state.speed * dt;
      }

      // ── xi-nhan do người chơi điều khiển: Q trái, E phải, bấm lại tắt ──
      // Tự tắt khi vô lăng về giữa sau khi rẽ (steerAngle quay về gần 0).
      if (input.signalLeft && !signalLeftPrev) {
        signal = signal === 'left' ? null : 'left';
      }
      if (input.signalRight && !signalRightPrev) {
        signal = signal === 'right' ? null : 'right';
      }
      signalLeftPrev = !!input.signalLeft;
      signalRightPrev = !!input.signalRight;

      // Tự tắt khi vô lăng về giữa sau khi rẽ (steerAngle ≈ 0 và vừa rẽ).
      if (signal !== null && Math.abs(steerAngle) < 0.05 && wasTurning) {
        signal = null;
        wasTurning = false;
      }
      if (Math.abs(steerAngle) > STEER_SIGNAL_ON) {
        wasTurning = true; // đang rẽ, chờ vô lăng về giữa để tắt
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
      // ghế lái LHD: glTF local (−0.38 = trái, mắt ~1.18, z +0.25 = vị trí ghế sau cabin)
      // dash glTF z ≈ −0.73..−0.97 nằm TRƯỚC mắt, đỉnh y 0.97 < mắt → không che windshield
      const lx = -0.38;
      const ly = 1.18;
      const lz = 0.25;
      // xoay local → world: yaw = heading + π (xe mặt −Z)
      const s = Math.sin(state.heading + Math.PI);
      const c = Math.cos(state.heading + Math.PI);
      // three.js: world = R_y(θ)·local → x' = lx·cosθ + lz·sinθ; z' = −lx·sinθ + lz·cosθ
      const wx = state.x + lx * c + lz * s;
      const wz = state.z + -lx * s + lz * c;
      return { x: wx, y: ly, z: wz, yaw: state.heading + Math.PI };
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
}
