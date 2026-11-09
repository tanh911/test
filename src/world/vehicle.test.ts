// vehicle.test.ts — test mô hình xe người chơi (G5)
// Tính toán trực tiếp công thức vật lý từ vehicle.ts (không cần load GLB).
import { describe, expect, it } from 'vitest';

// Các hằng số từ vehicle.ts
const MAX_SPEED_FWD = 16.7; // 60 km/h
const MAX_SPEED_REV = -3.5;
const ACCEL = 3.5;
const BRAKE = 9.0;
const DRAG = 0.5;
const WHEELBASE = 2.6;
const MAX_STEER = 0.58; // rad

const KMH_TO_MS = 1 / 3.6;
const DT = 0.01;

function stepVehicle(state: any, input: any, dt: number) {
  // Giống hệt logic trong vehicle.ts update()
  let steerAngle = state.steerAngle || 0;
  if (input.steer !== 0) {
    steerAngle += -input.steer * 1.8 * dt;
  } else {
    steerAngle -= Math.sign(steerAngle) * Math.min(Math.abs(steerAngle), 3.0 * dt);
  }
  steerAngle = Math.max(-MAX_STEER, Math.min(MAX_STEER, steerAngle));

  let throttle = input.throttle;
  if (state.gear === 'P' || state.gear === 'N') throttle = 0;
  if (state.gear === 'D' && state.speed < -0.1) throttle = 0;
  if (state.gear === 'R' && state.speed > 0.1) throttle = 0;

  let a = throttle * ACCEL - DRAG * state.speed;
  if (input.brake > 0) {
    if (state.speed > 0.1) a -= input.brake * BRAKE;
    else if (throttle === 0) a = -2.2;
  }
  state.speed = Math.max(MAX_SPEED_REV, Math.min(MAX_SPEED_FWD, state.speed + a * dt));
  if (throttle === 0 && input.brake === 0 && Math.abs(state.speed) < 0.05) state.speed = 0;

  if (Math.abs(state.speed) > 0.01) {
    state.heading += (state.speed / WHEELBASE) * Math.tan(steerAngle) * dt;
    state.x += Math.sin(state.heading) * state.speed * dt;
    state.z += Math.cos(state.heading) * state.speed * dt;
  }
  state.steerAngle = steerAngle;
}

describe('Vehicle physics model', () => {
  it('phanh từ 50 km/h: quãng phanh nằm trong khoảng hợp lý', () => {
    const state = { x: 0, z: 0, heading: 0, speed: 50 * KMH_TO_MS, gear: 'D', steerAngle: 0 };
    let dist = 0;
    let prevX = state.x;
    let prevZ = state.z;
    let steps = 0;
    while (Math.abs(state.speed) > 0.05 && steps < 5000) {
      stepVehicle(state, { throttle: 0, brake: 1, steer: 0, gear: 'D' }, DT);
      dist += Math.hypot(state.x - prevX, state.z - prevZ);
      prevX = state.x;
      prevZ = state.z;
      steps++;
    }
    console.log(`[vehicle] brake 50->0: dist=${dist.toFixed(2)} m, steps=${steps}, finalSpeed=${(state.speed * 3.6).toFixed(1)} km/h`);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(25);
  });

  it('bán kính quay ở 50 km/h lớn hơn ở 10 km/h (cùng lái hết cỡ)', () => {
    // Tại 10 km/h
    const s1 = { x: 0, z: 0, heading: 0, speed: 10 * KMH_TO_MS, gear: 'D', steerAngle: 0 };
    let startH1 = s1.heading;
    let steps1 = 0;
    while (steps1 < 2000) {
      stepVehicle(s1, { throttle: 0, brake: 0, steer: 1, gear: 'D' }, DT);
      if (Math.abs(s1.heading - startH1) > Math.PI / 2) break;
      steps1++;
    }
    const dist10 = Math.hypot(s1.x, s1.z);
    const radius10 = dist10 / (Math.PI / 2);

    // Tại 50 km/h
    const s2 = { x: 0, z: 0, heading: 0, speed: 50 * KMH_TO_MS, gear: 'D', steerAngle: 0 };
    let startH2 = s2.heading;
    let steps2 = 0;
    while (steps2 < 2000) {
      stepVehicle(s2, { throttle: 0, brake: 0, steer: 1, gear: 'D' }, DT);
      if (Math.abs(s2.heading - startH2) > Math.PI / 2) break;
      steps2++;
    }
    const dist50 = Math.hypot(s2.x, s2.z);
    const radius50 = dist50 / (Math.PI / 2);

    console.log(`[vehicle] radius@10kmh=${radius10.toFixed(1)} m, radius@50kmh=${radius50.toFixed(1)} m`);
    expect(radius50).toBeGreaterThan(radius10);
    expect(radius10).toBeGreaterThan(0);
    expect(radius50).toBeGreaterThan(0);
  });
});
