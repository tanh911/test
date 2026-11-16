import { createHash } from 'crypto';
import {
  CITY_18_NODES,
  MINI_CITY_3_NODES,
  generateCityMap,
  validateCity,
  type CityDefinition
} from '../src/data/maps/cityGenerator';
import { loadGameMap, nodeById, roadById, type GameMap } from '../src/world/mapLoader';
import { AutopilotDriver, type AutopilotRoute } from '../src/world/autopilot';
import { RuleEngine } from '../src/simulation/ruleEngine';
import { auditStrictVisualSidewalkAndTriangles } from '../src/world/mapIntegrityAudit.test';
import {
  collectBoundaryIssues,
  collectSawtoothIssues,
  collectSeamIssues
} from '../src/world/testJunctionBoundary';
import { buildJunctionMesh, roadRibbonQuads, roadSkipZones, roadsAtNode } from '../src/world/roadMesh';
import { planLightsForIntersection, TrafficLightController } from '../src/world/trafficLights';
import { computePropPlacements, LAMP_HEAD_Z } from '../src/world/props';

// ==========================================
// MỤC 2: Kiểm tra stepDt = 0.25 vs 0.10 trên Mini-Map 3 nút
// ==========================================
console.log('--- [MỤC 2] SO SÁNH stepDt = 0.25 vs stepDt = 0.10 (dt chuẩn của simScene) ---');
const miniMap = loadGameMap(generateCityMap(MINI_CITY_3_NODES));
const routeMini: AutopilotRoute = {
  id: 'mini3_route',
  name: 'Mini 3 Nút',
  steps: [
    { targetRoadId: 'r_south_rvl', turn: 'straight', speed: 8.33 },
    { targetRoadId: 'r_rvl_t', turn: 'straight', speed: 8.33 },
    { targetRoadId: 'r_t_ampel', turn: 'straight', speed: 8.33 },
    { targetRoadId: 'r_ampel_n', turn: 'straight', speed: 8.33 }
  ]
};

function runMiniAutopilot(dtVal: number) {
  const state = { x: 0, z: -40, heading: 0, speed: 0, gear: 'D' as const, t: 0 };
  let steerAngle = 0;
  const mockVehicle: any = {
    state,
    steerAngle: 0,
    signal: 'none',
    setSignal(s: any) { mockVehicle.signal = s; },
    getPose() { return { x: state.x, y: 1.25, z: state.z, yaw: state.heading }; },
    setGear(g: any) { state.gear = g; },
    setCameraMode() {},
    dispose() {},
    update(dt: number, input: any) {
      steerAngle += (input.steer * 0.55 - steerAngle) * Math.min(1, 6 * dt);
      mockVehicle.steerAngle = steerAngle;
      const targetSpeed = Math.max(0, input.targetSpeed);
      const err = targetSpeed - state.speed;
      const throttle = input.brake ? 0 : Math.max(0, Math.min(1, input.throttle + err * 0.4));
      const brake = input.brake ? 1 : err < -0.5 ? Math.min(1, -err * 0.4) : 0;
      const accel = throttle * 5.2 - brake * 8.5 - state.speed * 0.08;
      state.speed = Math.max(0, Math.min(25, state.speed + accel * dt));
      state.heading += (state.speed / 2.6) * Math.tan(steerAngle) * dt;
      state.x += Math.sin(state.heading) * state.speed * dt;
      state.z += Math.cos(state.heading) * state.speed * dt;
      state.t += dt;
    }
  };

  const ap = new AutopilotDriver(miniMap, [], routeMini);
  ap.attach(mockVehicle);
  ap.start('clean');
  const ruleEngine = new RuleEngine(miniMap, []);
  const visited = new Set<string>();
  const maxSteps = Math.round(110 / dtVal);

  for (let s = 0; s < maxSteps; s++) {
    const input = ap.update(dtVal);
    ap.endStep();
    mockVehicle.update(dtVal, input);
    ruleEngine.update(dtVal, {
      x: state.x,
      z: state.z,
      heading: state.heading,
      speed: state.speed,
      signal: mockVehicle.signal,
      stopped: Math.abs(state.speed) < 0.15
    }, []);

    for (const nId of ['n_rvl', 'n_t', 'n_ampel']) {
      const nd = nodeById(miniMap, nId)!;
      if (Math.hypot(state.x - nd.x, state.z - nd.z) < 6.0) visited.add(nId);
    }
    if (ap.telemetry().done) break;
  }
  return {
    dt: dtVal,
    done: ap.telemetry().done,
    simTime: state.t.toFixed(1),
    violationsTotal: ruleEngine.violations.length,
    major: ruleEngine.violationsBySeverity.major.length,
    minor: ruleEngine.violationsBySeverity.minor.length,
    visitedNodes: Array.from(visited)
  };
}

console.log('Mini-Map AP stepDt=0.25:', runMiniAutopilot(0.25));
console.log('Mini-Map AP stepDt=0.10 (simScene dt):', runMiniAutopilot(0.10));

// ==========================================
// MỤC 3: Đo kiểm 18 nút (validateCity, SV1, audits, hash)
// ==========================================
console.log('\n--- [MỤC 3] ĐO KIỂM 18 NÚT GIAO ---');
const city18Val = validateCity(CITY_18_NODES);
console.log('validateCity(CITY_18_NODES):', {
  valid: city18Val.valid,
  errorCount: city18Val.errors.length,
  warningCount: city18Val.warnings.length,
  warnings: city18Val.warnings
});

const city18Map = loadGameMap(generateCityMap(CITY_18_NODES));
const sv1 = auditStrictVisualSidewalkAndTriangles(city18Map);
console.log('SV1 Strict-Visual:', {
  intrusionsCount: sv1.intrusions.length,
  degenerateCount: sv1.degenerateTriangles.length,
  maxIntrusionM: sv1.maxIntrusionM
});

let seamCount = 0;
let boundaryCount = 0;
let sawtoothCount = 0;
for (const n of city18Map.nodes) {
  if (n.type === 'intersection') {
    seamCount += collectSeamIssues(city18Map, n).length;
    boundaryCount += collectBoundaryIssues(city18Map, n).length;
  }
}
for (const r of city18Map.roads) {
  sawtoothCount += collectSawtoothIssues(city18Map, r).length;
}
console.log('Junction/Road Audits:', {
  seamCount,
  boundaryCount,
  sawtoothCount
});

// Build Hash 2 lần
const b1 = JSON.stringify(generateCityMap(CITY_18_NODES));
const b2 = JSON.stringify(generateCityMap(CITY_18_NODES));
const h1 = createHash('sha256').update(b1).digest('hex');
const h2 = createHash('sha256').update(b2).digest('hex');
console.log('Deterministic Build Hashes:', {
  h1,
  h2,
  identical: h1 === h2
});

// ==========================================
// MỤC 4: Autopilot 18 nút - Chạy 2 lần so quỹ đạo theo tick
// ==========================================
console.log('\n--- [MỤC 4] AUTOPILOT 18 NÚT: SO QUỸ ĐẠO THEO TICK ---');
import { AUTOPILOT_18_ROUTE } from '../src/data/maps/cityGenerator';

function run18AutopilotRun(seed: number) {
  const map18 = loadGameMap(generateCityMap(CITY_18_NODES));
  const controllers: TrafficLightController[] = [];
  for (const ix of map18.intersections) {
    if (ix.rule === 'traffic_light') {
      const plan = planLightsForIntersection(map18, ix.nodeId);
      if (plan) controllers.push(new TrafficLightController(plan));
    }
  }

  // Khởi tạo xe tại vị trí xuất phát r01_start tại s=25m
  const startRoad = roadById(map18, 'r01_start')!;
  const state = { x: 0, z: -20 + 25, heading: 0, speed: 0, gear: 'D' as const, t: 0 };
  let steerAngle = 0;
  const mockVehicle: any = {
    state,
    steerAngle: 0,
    signal: 'none',
    setSignal(s: any) { mockVehicle.signal = s; },
    getPose() { return { x: state.x, y: 1.25, z: state.z, yaw: state.heading }; },
    setGear(g: any) { state.gear = g; },
    setCameraMode() {},
    dispose() {},
    update(dt: number, input: any) {
      steerAngle += (input.steer * 0.55 - steerAngle) * Math.min(1, 6 * dt);
      mockVehicle.steerAngle = steerAngle;
      const targetSpeed = Math.max(0, input.targetSpeed);
      const err = targetSpeed - state.speed;
      const throttle = input.brake ? 0 : Math.max(0, Math.min(1, input.throttle + err * 0.4));
      const brake = input.brake ? 1 : err < -0.5 ? Math.min(1, -err * 0.4) : 0;
      const accel = throttle * 5.2 - brake * 8.5 - state.speed * 0.08;
      state.speed = Math.max(0, Math.min(25, state.speed + accel * dt));
      state.heading += (state.speed / 2.6) * Math.tan(steerAngle) * dt;
      state.x += Math.sin(state.heading) * state.speed * dt;
      state.z += Math.cos(state.heading) * state.speed * dt;
      state.t += dt;
    }
  };

  const ap = new AutopilotDriver(map18, controllers, AUTOPILOT_18_ROUTE);
  ap.attach(mockVehicle);
  ap.start('clean');
  const ruleEngine = new RuleEngine(map18, controllers);

  const ticks: Array<{ t: number; x: number; z: number; speed: number; heading: number }> = [];
  const visitedNodes = new Set<string>();
  const dt = 0.1; // dt chuẩn 0.1 của simScene
  const maxSteps = 2500; // 250s

  for (let s = 0; s < maxSteps; s++) {
    for (const c of controllers) c.update(dt);
    const input = ap.update(dt);
    ap.endStep();
    mockVehicle.update(dt, input);
    ruleEngine.update(dt, {
      x: state.x,
      z: state.z,
      heading: state.heading,
      speed: state.speed,
      signal: mockVehicle.signal,
      stopped: Math.abs(state.speed) < 0.15
    }, []);

    ticks.push({ t: state.t, x: state.x, z: state.z, speed: state.speed, heading: state.heading });

    for (const n of map18.nodes) {
      if (Math.hypot(state.x - n.x, state.z - n.z) < 8.0) visitedNodes.add(n.id);
    }
    if (ap.telemetry().done) break;
  }

  return {
    ticks,
    done: ap.telemetry().done,
    simTime: state.t,
    violations: ruleEngine.violations,
    violationsBySeverity: ruleEngine.violationsBySeverity,
    visitedNodes: Array.from(visitedNodes),
    finalPos: { x: state.x, z: state.z }
  };
}

const run1 = run18AutopilotRun(42);
const run2 = run18AutopilotRun(42);

let maxPosDev = 0;
let maxSpeedDev = 0;
let maxHeadingDev = 0;
const tickLen = Math.min(run1.ticks.length, run2.ticks.length);
for (let i = 0; i < tickLen; i++) {
  const p1 = run1.ticks[i];
  const p2 = run2.ticks[i];
  const posDev = Math.hypot(p1.x - p2.x, p1.z - p2.z);
  const spdDev = Math.abs(p1.speed - p2.speed);
  const headDev = Math.abs(p1.heading - p2.heading);
  if (posDev > maxPosDev) maxPosDev = posDev;
  if (spdDev > maxSpeedDev) maxSpeedDev = spdDev;
  if (headDev > maxHeadingDev) maxHeadingDev = headDev;
}

console.log('Run 1 & Run 2 Tick-by-Tick Comparison:', {
  run1Ticks: run1.ticks.length,
  run2Ticks: run2.ticks.length,
  maxPosDevMeters: maxPosDev.toFixed(6),
  maxSpeedDev: maxSpeedDev.toFixed(6),
  maxHeadingDev: maxHeadingDev.toFixed(6),
  run1Done: run1.done,
  run2Done: run2.done,
  simTime: run1.simTime.toFixed(1) + 's',
  visitedCount: run1.visitedNodes.length,
  visitedNodes: run1.visitedNodes
});

// ==========================================
// MỤC 5 & 6: A4, Biên Map, Danh sách lỗi Autopilot
// ==========================================
console.log('\n--- [MỤC 5 & 6] A4, BIÊN MAP & DANH SÁCH LỖI AUTOPILOT ---');
console.log('Autopilot Clean Run Violations Total:', run1.violations.length);
console.log('Major Violations:', run1.violationsBySeverity.major.length);
console.log('Minor Violations:', run1.violationsBySeverity.minor.length);
for (const v of run1.violations) {
  console.log(`- [${v.severity.toUpperCase()}] ${v.type}: "${v.message}" @ pos=(${v.x.toFixed(1)}, ${v.z.toFixed(1)}), t=${v.t.toFixed(1)}s`);
}

// ==========================================
// MỤC 7: ruleEngine trên Berlin - Đo lường dừng STOP L288 vs L293
// ==========================================
console.log('\n--- [MỤC 7] RULE ENGINE TRÊN BERLIN: TRACE checkStopSign L288 vs L293 ---');
import berlinClean from '../src/data/maps/berlin-mitte-clean.json';
const berlinMap = loadGameMap(berlinClean as any);

// Thống kê bao nhiêu cạnh nối vào node có rule === 'stop'
const stopNodes = new Set(berlinMap.intersections.filter(i => i.rule === 'stop').map(i => i.nodeId));
console.log('Berlin intersections with rule === "stop":', stopNodes.size, Array.from(stopNodes));

// Khảo sát các road có from hoặc to là stop node
const stopRoads = berlinMap.roads.filter(r => stopNodes.has(r.from) || stopNodes.has(r.to));
console.log('Berlin roads connected to stop nodes:', stopRoads.length);

let l288FalseAlarmCount = 0;
let l288DuplicateCount = 0;
for (const r of stopRoads) {
  const len = roadById(berlinMap, r.id) ? (r as any).length ?? 50 : 50;
  // Giả sử xe đi từ 'to' về 'from' (dir = -1)
  if (stopNodes.has(r.from)) {
    // Với dir = -1, stopS = half + 2. Xe đang ở nearS = len - 10 (gần đầu 'to', vừa vào đường).
    // Dòng 288 gọi với dir = 1: distToStop = stopS - nearS = (half + 2) - (len - 10) < 0
    // => Nếu < -PASS_STOP_LINE (2.0m), dòng 288 sẽ kích hoạt lỗi STOP ngay lập tức khi xe vừa vào đầu 'to'!
    const half = (r.lanesForward + r.lanesBackward) * r.laneWidth / 2;
    const stopS = half + 2;
    const nearS = Math.min(len, 30);
    const distToStopDir1 = stopS - nearS;
    if (distToStopDir1 < -2.0) {
      l288FalseAlarmCount++;
    }
  }
}
console.log('Berlin stopRoads where L288 creates false distToStop < -2m on dir=-1 entry:', l288FalseAlarmCount);
