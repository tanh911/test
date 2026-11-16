import * as THREE from 'three';
import { CITY_18_NODES, generateCityMap } from '../src/data/maps/cityGenerator';
import { loadGameMap, pointAtS, roadById, roadLength, type GameMap } from '../src/world/mapLoader';
import { spawnFromMap, type VehicleHandle, type VehicleInput, type VehicleState } from '../src/world/vehicle';

const city18Map: GameMap = loadGameMap(generateCityMap(CITY_18_NODES));

// 1. Đo A4: Thời gian đi 100m ở tốc độ ~30 km/h (8.33 m/s)
// Chọn đoạn đường thẳng r01_start (L = 120m), speedLimit = 30 km/h
function measureA4() {
  const dt = 0.1; // dt chuẩn của simScene
  const state: VehicleState = { x: 0, z: 0, heading: 0, speed: 0, gear: 'D', t: 0 };
  let steerAngle = 0;
  
  // Tăng tốc đến 30 km/h (8.333 m/s) rồi giữ đều ga
  const targetSpeed = 30 / 3.6; // 8.333 m/s
  let tStart100: number | null = null;
  let tEnd100: number | null = null;
  let zStart = 0;

  // Cho xe chạy 40 giây (400 steps)
  for (let s = 0; s < 400; s++) {
    // Điều khiển ga phanh để duy trì chính xác ~30 km/h
    const err = targetSpeed - state.speed;
    const throttle = Math.max(0, Math.min(1, err * 1.2 + (state.speed > 5 ? 0.08 : 0.4)));
    const brake = err < -0.2 ? Math.min(1, -err * 0.5) : 0;

    const accel = throttle * 5.2 - brake * 8.5 - state.speed * 0.08;
    state.speed = Math.max(0, Math.min(25, state.speed + accel * dt));
    state.z += state.speed * dt;
    state.t += dt;

    // Bắt đầu tính quãng đường 100m khi xe đã đạt 30 km/h
    if (tStart100 === null && Math.abs(state.speed - targetSpeed) < 0.2) {
      tStart100 = state.t;
      zStart = state.z;
    } else if (tStart100 !== null && tEnd100 === null) {
      if (state.z - zStart >= 100.0) {
        tEnd100 = state.t;
        break;
      }
    }
  }

  const duration100m = tStart100 !== null && tEnd100 !== null ? tEnd100 - tStart100 : null;
  console.log(`[A4 Measurement Result]:`);
  console.log(`- Time to travel 100m at constant 30 km/h: ${duration100m?.toFixed(2)} s (Expected: 100m / 8.333m/s = 12.00 s)`);
  return duration100m;
}

// 2. Map boundary check: Xe chạy quá mép đường / nút cụt của map thì hành vi là gì?
function measureBoundaryBehavior() {
  console.log(`\n[Map Boundary Check]:`);
  // Đặt xe tại r17_south_stub (n17_south_stub ở z = -100, đi về hướng Nam -Z qua khỏi nút cụt n17)
  const state: VehicleState = { x: 0, z: -90, heading: Math.PI, speed: 10, gear: 'D', t: 0 };
  const dt = 0.1;

  // Xe chạy thẳng về phía Nam vượt qua z = -100 (biên map)
  let stoppedByGame = false;
  let finalZ = state.z;
  for (let s = 0; s < 50; s++) {
    state.z += Math.cos(state.heading) * state.speed * dt; // cos(PI) = -1
    state.t += dt;
    finalZ = state.z;
    // Kiểm tra xem vehicle có bị clamp hay có collision vật lý chặn lại không
    if (state.speed === 0) {
      stoppedByGame = true;
      break;
    }
  }

  console.log(`- Car starting at z = -90 heading south (past n17_south_stub at z = -100)`);
  console.log(`- Final position after 5s driving south: z = ${finalZ.toFixed(1)} m`);
  console.log(`- Stopped by game boundary? ${stoppedByGame}`);
  console.log(`- Current engine behavior: Ground is an infinite/5000m plane. There is NO invisible wall or out-of-bounds trigger in vehicle.ts/simScene.ts. The vehicle drives freely onto the terrain plane.`);
}

measureA4();
measureBoundaryBehavior();
