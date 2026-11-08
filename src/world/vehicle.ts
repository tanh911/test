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
}

export interface VehicleState {
  x: number;
  z: number;
  heading: number;
  speed: number; // m/s, âm = lùi
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

export interface VehicleHandle {
  group: THREE.Group;
  state: VehicleState;
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
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      // Blender export doubleSided → camera cabin nhìn mặt trong hộp kính thành đen.
      // Ép FrontSide: từ trong cabin, mặt trong bị culled → thấy ra ngoài qua kính.
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) m.side = THREE.FrontSide;
    }
  });
  group.name = 'vehicle_player';

  const spawn = spawnFromMap(map);
  const state: VehicleState = { x: spawn.x, z: spawn.z, heading: spawn.heading, speed: 0 };
  let steerAngle = 0; // dương = trái (A)

  const applyPose = () => {
    group.position.set(state.x, 0, state.z);
    group.rotation.y = state.heading + Math.PI;
  };
  applyPose();
  scene.add(group);

  return {
    group,
    state,
    update(dt, input) {
      // ── lái: input.steer −1 = A (trái, δ↑), +1 = D (phải, δ↓) ──
      if (input.steer !== 0) {
        steerAngle += -input.steer * STEER_RATE * dt;
      } else {
        steerAngle -= Math.sign(steerAngle) * Math.min(Math.abs(steerAngle), STEER_CENTER * dt);
      }
      steerAngle = Math.max(-MAX_STEER, Math.min(MAX_STEER, steerAngle));

      // ── dọc: ga / phanh / lùi ──
      let a = input.throttle * ACCEL - DRAG * state.speed;
      if (input.brake > 0) {
        if (state.speed > 0.1) a -= input.brake * BRAKE;
        else if (input.throttle === 0) a = -2.2; // lùi chậm khi đứng
      }
      state.speed = Math.max(MAX_SPEED_REV, Math.min(MAX_SPEED_FWD, state.speed + a * dt));
      if (input.throttle === 0 && input.brake === 0 && Math.abs(state.speed) < 0.05) state.speed = 0;

      // ── bicycle model ──
      if (Math.abs(state.speed) > 0.01) {
        state.heading += (state.speed / WHEELBASE) * Math.tan(steerAngle) * dt;
        state.x += Math.sin(state.heading) * state.speed * dt;
        state.z += Math.cos(state.heading) * state.speed * dt;
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
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach(m => m?.dispose());
        }
      });
    }
  };
}
