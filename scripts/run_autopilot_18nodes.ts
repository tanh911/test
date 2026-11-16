import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import * as THREE from 'three';

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
}

import { CITY_18_NODES, generateCityMap } from '../src/data/maps/cityGenerator';
import { loadGameMap, nodeById, type GameMap } from '../src/world/mapLoader';
import { planLightsForIntersection, TrafficLightController } from '../src/world/trafficLights';
import { AutopilotDriver, type AutopilotRoute } from '../src/world/autopilot';
import { RuleEngine } from '../src/simulation/ruleEngine';
import { spawnFromMap, type VehicleHandle, type VehicleInput, type VehicleState } from '../src/world/vehicle';

const city18Map: GameMap = loadGameMap(generateCityMap(CITY_18_NODES));

// Khởi tạo controllers cho các nút đèn
const controllers: TrafficLightController[] = [];
for (const ix of city18Map.intersections) {
  if (!ix.trafficLight) continue;
  const ctrl = new TrafficLightController(ix.nodeId, ix.trafficLight.greenSeconds, ix.trafficLight.yellowSeconds);
  const { arms } = planLightsForIntersection(ix, city18Map);
  for (const arm of arms) {
    ctrl.registerArm(arm.roadId, arm.end, arm.group);
  }
  controllers.push(ctrl);
}

// Tuyến đường GĐ0 18 nút
const route18: AutopilotRoute = {
  seed: CITY_18_NODES.seed,
  spawn: { roadId: 'r01_start', s: 20 },
  steps: [
    { roadId: 'r01_start', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n02_rvl' },
    { roadId: 'r02_to_zebra', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n03_zebra' },
    { roadId: 'r03_to_ampel', dir: 1, turnAtEnd: 'right', viaNodeId: 'n04_ampel' },
    { roadId: 'r09_ampel_east', dir: 1, turnAtEnd: 'left', viaNodeId: 'n09_ampel_east' },
    { roadId: 'r18_land_east_conn', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n16_land_east' },
    { roadId: 'r20_land_east', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n10_land_gate' },
    { roadId: 'r19_land_west', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n15_land_west' },
    { roadId: 'r11_fried_north', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n05_stop' },
    { roadId: 'r05_fried_main', dir: 1, turnAtEnd: 'right', viaNodeId: 'n06_round' },
    { roadId: 'r06a_round_to_park', dir: 1, turnAtEnd: 'straight', viaNodeId: 'n18_uni_park' }
  ],
  checkpoints: [
    { id: 1, type: 'junction', roadId: 'r01_start', roadName: 'Georgenstraße Süd', s: 120, x: 0, z: 100, label: 'n02_rvl' },
    { id: 2, type: 'junction', roadId: 'r02_to_zebra', roadName: 'Georgenstraße Mitte', s: 90, x: 0, z: 190, label: 'n03_zebra' },
    { id: 3, type: 'junction', roadId: 'r03_to_ampel', roadName: 'Georgenstraße Nord', s: 90, x: 0, z: 280, label: 'n04_ampel' },
    { id: 4, type: 'junction', roadId: 'r09_ampel_east', roadName: 'Dorotheenstraße Ost', s: 140, x: 140, z: 280, label: 'n09_ampel_east' },
    { id: 5, type: 'junction', roadId: 'r18_land_east_conn', roadName: 'Invalidenstraße Ost', s: 90, x: 140, z: 370, label: 'n16_land_east' },
    { id: 6, type: 'junction', roadId: 'r20_land_east', roadName: 'Oranienburger Landstraße Ost', s: 150, x: 0, z: 420, label: 'n10_land_gate' },
    { id: 7, type: 'junction', roadId: 'r19_land_west', roadName: 'Oranienburger Landstraße West', s: 150, x: -130, z: 370, label: 'n15_land_west' },
    { id: 8, type: 'junction', roadId: 'r11_fried_north', roadName: 'Friedrichstraße Nord', s: 90, x: -130, z: 280, label: 'n05_stop' },
    { id: 9, type: 'junction', roadId: 'r05_fried_main', roadName: 'Friedrichstraße Mitte', s: 180, x: -130, z: 100, label: 'n06_round' },
    { id: 10, type: 'junction', roadId: 'r06a_round_to_park', roadName: 'Universitätsstraße West', s: 65, x: -65, z: 100, label: 'n18_uni_park' }
  ]
};

writeFileSync('qa-autopilot/route-city18.json', JSON.stringify(route18, null, 2), 'utf-8');

function runAutopilot(runId: number, dt: number) {
  const ctrlClones = controllers.map(c => new TrafficLightController(c.nodeId, 14, 3));
  for (let i = 0; i < controllers.length; i++) {
    const { arms } = planLightsForIntersection(city18Map.intersections.find(x => x.nodeId === controllers[i].nodeId)!, city18Map);
    for (const arm of arms) {
      ctrlClones[i].registerArm(arm.roadId, arm.end, arm.group);
    }
  }

  const sp = spawnFromMap(city18Map);
  const state: VehicleState = { x: sp.x, z: sp.z, heading: sp.heading, speed: 0, gear: 'D', t: 0 };
  let steerAngle = 0;
  let signalState: 'left' | 'right' | null = null;
  const mockVehicle: VehicleHandle = {
    group: new THREE.Group(),
    state,
    get signal() { return signalState; },
    get steerAngle() { return steerAngle; },
    throttle: 0,
    brake: 0,
    bodyPitch: 0,
    bodyRoll: 0,
    update(stepDt: number, input: VehicleInput) {
      if (input.gear) state.gear = input.gear;
      if (input.signalLeft) signalState = signalState === 'left' ? null : 'left';
      if (input.signalRight) signalState = signalState === 'right' ? null : 'right';
      const targetSteer = -input.steer * 0.58;
      const ds = targetSteer - steerAngle;
      const maxStep = (Math.abs(input.steer) > 0.01 ? 2.2 : 3.6) * stepDt;
      steerAngle += Math.max(-maxStep, Math.min(maxStep, ds));
      const accel = input.throttle * 5.2 - input.brake * 8.5 - state.speed * 0.08;
      state.speed = Math.max(0, Math.min(25, state.speed + accel * stepDt));
      state.heading += (state.speed / 2.6) * Math.tan(steerAngle) * stepDt;
      state.x += Math.sin(state.heading) * state.speed * stepDt;
      state.z += Math.cos(state.heading) * state.speed * stepDt;
      state.t += stepDt;
    },
    syncPose() {},
    seatPose() { return { x: state.x, y: 1.25, z: state.z, yaw: state.heading }; },
    setGear(g) { state.gear = g; },
    setCameraMode() {},
    dispose() {}
  };

  const ap = new AutopilotDriver(city18Map, ctrlClones, route18);
  ap.attach(mockVehicle);
  ap.start('clean');

  const ruleEngine = new RuleEngine(city18Map, ctrlClones);
  const trajectory: Array<{ t: number; x: number; z: number; v: number; h: number }> = [];

  const maxSteps = Math.round(250 / dt);
  for (let s = 0; s < maxSteps; s++) {
    for (const c of ctrlClones) c.update(dt);
    const input = ap.update(dt);
    ap.endStep();
    mockVehicle.update(dt, input);
    ruleEngine.update(
      dt,
      {
        x: state.x,
        z: state.z,
        heading: state.heading,
        speed: state.speed,
        signal: mockVehicle.signal,
        stopped: Math.abs(state.speed) < 0.15
      },
      []
    );
    trajectory.push({
      t: Number(state.t.toFixed(2)),
      x: Number(state.x.toFixed(2)),
      z: Number(state.z.toFixed(2)),
      v: Number((state.speed * 3.6).toFixed(1)),
      h: Number(state.heading.toFixed(3))
    });
    if (ap.telemetry().done) break;
  }

  const tel = ap.telemetry();
  return { tel, violations: ruleEngine.violations, bestanden: ruleEngine.bestanden, trajectory };
}

// Chạy 2 lần độc lập cùng seed và so sánh sai lệch
const run1 = runAutopilot(1, 0.25);
const run2 = runAutopilot(2, 0.25);

let maxDevM = 0;
const compareLen = Math.min(run1.trajectory.length, run2.trajectory.length);
for (let i = 0; i < compareLen; i++) {
  const p1 = run1.trajectory[i];
  const p2 = run2.trajectory[i];
  const d = Math.hypot(p1.x - p2.x, p1.z - p2.z);
  if (d > maxDevM) maxDevM = d;
}

console.log(`[Autopilot 18-Node Route Results]:`);
console.log(`- Run 1: done=${run1.tel.done}, simTime=${run1.tel.simTime.toFixed(1)}s, steps=${run1.trajectory.length}, violations=${run1.violations.length}, bestanden=${run1.bestanden}`);
console.log(`- Run 2: done=${run2.tel.done}, simTime=${run2.tel.simTime.toFixed(1)}s, steps=${run2.trajectory.length}, violations=${run2.violations.length}, bestanden=${run2.bestanden}`);
console.log(`- Tick-by-tick Max Deviation across 2 runs: ${maxDevM.toFixed(4)} m (< 0.5m target)`);

if (run1.violations.length > 0) {
  console.log(`- Violations details:`, JSON.stringify(run1.violations, null, 2));
}

// Xuất manifest
const manifest = {
  map: 'de-pruefungsstadt-18nodes-v1',
  nodes: 18,
  edges: 23,
  seed: CITY_18_NODES.seed,
  route: route18,
  run1: {
    done: run1.tel.done,
    simTime: run1.tel.simTime,
    violations: run1.violations,
    bestanden: run1.bestanden
  },
  run2: {
    done: run2.tel.done,
    simTime: run2.tel.simTime,
    violations: run2.violations,
    bestanden: run2.bestanden
  },
  maxTickDeviationM: maxDevM
};

writeFileSync('qa-autopilot/manifest-18nodes-5c2.json', JSON.stringify(manifest, null, 2), 'utf-8');
console.log('Successfully saved qa-autopilot/manifest-18nodes-5c2.json');
