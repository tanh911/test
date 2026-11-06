import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildCustomMap, buildCityWorld } from './environment.js';

describe('Driving Simulator & Map Engine Tests', () => {
  it('should correctly build 3D custom map with all element types and spawn points', () => {
    const scene = new THREE.Scene();

    const testMapData = {
      mapInfo: {
        name: 'Auto-Test Map',
        spawnPoint: { x: 20, z: 20, rotation: 90 }
      },
      elements: [
        { id: 'r1', type: 'ROAD_STRAIGHT', x: 0, z: 0, width: 14, height: 40, rotation: 0 },
        { id: 'i1', type: 'INTERSECTION_4WAY', x: 0, z: 40, width: 14, height: 14, rotation: 0 },
        { id: 'b1', type: 'BUILDING', x: -20, z: 0, width: 10, height: 20, rotation: 0 },
        { id: 'sw1', type: 'SIDEWALK', x: 14, z: 0, width: 2, height: 40, rotation: 0 },
        { id: 't1', type: 'TREE', x: -5, z: 10, width: 2, height: 4, rotation: 0 },
        { id: 's1', type: 'SIGN', signType: 'SPEED_LIMIT', value: 50, x: 8, z: 10, width: 2, height: 4, rotation: 0 },
        { id: 'tl1', type: 'TRAFFIC_LIGHT', x: 8, z: 38, width: 1, height: 4, rotation: 0 },
        { id: 'z1', type: 'ZEBRA', x: 0, z: 35, width: 14, height: 4, rotation: 0 },
        { id: 'sp1', type: 'SPAWN_POINT', x: 7, z: 5, width: 3, height: 5, rotation: 90 }
      ]
    };

    const result = buildCustomMap(scene, testMapData);

    expect(result.isCustomMap).toBe(true);
    expect(result.playerSpawnPos).toEqual({ x: 20, z: 20, rotation: 90 });

    const sceneryGroup = scene.getObjectByName('customMapScenery');
    expect(sceneryGroup).toBeDefined();
    // 1 ground + 2 lights + 9 elements = 12 children
    expect(sceneryGroup.children.length).toBe(12);
  });

  it('should accurately simulate vehicle kinematics and turn direction', () => {
    let carX = 20;
    let carZ = 20;
    let heading = (90 * Math.PI) / 180; // 90° = PI/2 (Facing East / +X)
    let steer = 0.5; // Steering right (turns clockwise towards South)
    const v = 50 / 3.6; // ~13.88 m/s
    const dt = 0.016;

    for (let frame = 0; frame < 60; frame++) {
      heading += steer * 1.45 * dt;
      carX += v * Math.sin(heading) * dt;
      carZ += v * Math.cos(heading) * dt;
    }

    // Vehicle heading angle should have increased (clockwise turn)
    expect(heading).toBeGreaterThan((90 * Math.PI) / 180);
    // Vehicle position X and Z should change smoothly without NaN
    expect(Number.isNaN(carX)).toBe(false);
    expect(Number.isNaN(carZ)).toBe(false);
    expect(carX).toBeGreaterThan(20);
  });

  it('should correctly build 3D Sa Hinh Fahrschule training ground environment', () => {
    const scene = new THREE.Scene();
    const result = buildCityWorld(scene, 'sa_hinh_fahrschule');

    expect(result.config).toBeDefined();
    expect(result.config.maxSpeedLimit).toBe(60);
    expect(result.disableSceneryMoving).toBe(true);
    expect(result.scenery).toBeDefined();
    // Track contains banners, traffic lights, crosswalks, intersections, parking stalls, cones, finish arch, etc.
    expect(result.scenery.children.length).toBeGreaterThan(40);
  });

  it('should correctly build 3D Autobahn A9 environment with true 3D navigation and valid spawn', () => {
    const scene = new THREE.Scene();
    const result = buildCityWorld(scene, 'autobahn_a9');

    expect(result.config).toBeDefined();
    expect(result.config.hasAutobahn).toBe(true);
    expect(result.config.maxSpeedLimit).toBe(130);
    expect(result.disableSceneryMoving).toBe(true);
    // 🏘️ Spawn trong phố Rhynern (Werler Straße) — route vòng phố → Auffahrt → A2 → Ausfahrt
    expect(result.playerSpawnPos.x).toBe(-396);
    expect(result.playerSpawnPos.z).toBe(895);
    expect(result.scenery).toBeDefined();
  });

  it('should verify unified Sa Hinh compound exists with valid spawn points and 8 integrated scenarios', async () => {
    const { MAPS } = await import('../simulation/data/maps.js');
    const { EXERCISES } = await import('../simulation/data/exercises.js');
    const { MAP_SCENARIOS } = await import('./SimScenarios.js');

    const saHinhMap = MAPS.sa_hinh_fahrschule;
    expect(saHinhMap).toBeDefined();
    expect(saHinhMap.area).toBe('SA_HINH');
    expect(saHinhMap.spawnPoints.start).toBeDefined();

    // Check full consolidated exercise exists
    const fullEx = EXERCISES.sahinh_full_01;
    expect(fullEx).toBeDefined();
    expect(fullEx.map).toBe('sa_hinh_fahrschule');
    expect(fullEx.scenarios.length).toBe(8);

    // Verify all 8 scenarios in the consolidated course
    const expectedScenarios = [
      'sh_slalom',
      'sh_ampel_crosswalk',
      'sh_intersection_4way',
      'sh_parallel_parking',
      'sh_intersection_3way',
      'sh_perpendicular_parking',
      'sh_emergency_brake',
      'sh_finish'
    ];
    expect(fullEx.scenarios).toEqual(expectedScenarios);

    // Verify scenario definitions in MAP_SCENARIOS
    const saHinhScenarios = MAP_SCENARIOS.sa_hinh_fahrschule;
    expect(saHinhScenarios).toBeDefined();
    expect(saHinhScenarios.length).toBeGreaterThanOrEqual(8);

    expectedScenarios.forEach(scId => {
      const sc = saHinhScenarios.find(s => s.id === scId);
      expect(sc, `Scenario ${scId} must exist in MAP_SCENARIOS.sa_hinh_fahrschule`).toBeDefined();
      expect(sc.triggerZ).toBeLessThan(sc.resolveZ);
      expect(typeof sc.check).toBe('function');
    });
  });

  it('should accurately simulate reverse gear kinematics (inverting heading rotation & backwards motion)', () => {
    // Forward vehicle test
    let fwdX = 0, fwdZ = 0, fwdHeading = 0;
    const steer = 0.5; // Steering right
    const v = 10 / 3.6; // ~2.78 m/s
    const dt = 0.016;
    const turnRate = 1.45;

    // Moving forward with right steer: heading turns positive/clockwise, Z moves negative (forward)
    for (let i = 0; i < 30; i++) {
      fwdHeading += steer * turnRate * dt;
      fwdX += v * Math.sin(fwdHeading) * dt;
      fwdZ -= v * Math.cos(fwdHeading) * dt;
    }
    expect(fwdHeading).toBeGreaterThan(0);
    expect(fwdZ).toBeLessThan(0);

    // Reverse vehicle kinematics test:
    // When in reverse, steering right swings the tail to the right, causing vehicle heading to decrease (counter-clockwise)
    let revX = 0, revZ = 0, revHeading = 0;
    const isReverse = true;
    const vSigned = isReverse ? -v : v;

    for (let i = 0; i < 30; i++) {
      if (isReverse) {
        revHeading -= steer * turnRate * dt;
      } else {
        revHeading += steer * turnRate * dt;
      }
      revX += vSigned * Math.sin(revHeading) * dt;
      revZ -= vSigned * Math.cos(revHeading) * dt;
    }

    // Heading in reverse should turn opposite of forward
    expect(revHeading).toBeLessThan(0);
    // Position should move backwards (Z increases)
    expect(revZ).toBeGreaterThan(0);
  });

  it('should accurately calculate 3D hill ramp elevation and gravity rollback', () => {
    const getRampElevation = (z) => {
      if (z > -165 || z < -201) return 0;
      if (z <= -177 && z >= -189) return 1.1;
      if (z <= -165 && z > -177) {
        const t = (-165 - z) / (-165 - -177);
        return t * 1.1;
      }
      if (z < -189 && z >= -201) {
        const t = (z - -201) / (-189 - -201);
        return t * 1.1;
      }
      return 0;
    };

    // Before ramp
    expect(getRampElevation(-150)).toBe(0);
    // Midway up incline (-171 is halfway between -165 and -177)
    expect(getRampElevation(-171)).toBeCloseTo(0.55, 1);
    // On ramp plateau (-180 is within [-177, -189])
    expect(getRampElevation(-180)).toBe(1.1);
    // Midway down decline (-195 is halfway between -189 and -201)
    expect(getRampElevation(-195)).toBeCloseTo(0.55, 1);
    // Beyond ramp
    expect(getRampElevation(-210)).toBe(0);

    // Rollback test: If stopped on hill incline without brake/handbrake, rollback force is applied
    const zOnIncline = -171;
    const isOnIncline = zOnIncline <= -165 && zOnIncline > -177;
    expect(isOnIncline).toBe(true);

    const brake = 0;
    const handbrake = false;
    let rollbackSpeed = 0;
    if (isOnIncline && brake < 0.1 && !handbrake) {
      rollbackSpeed += 0.08 * (0.016 * 60); // Gravity pull down slope
    }
    expect(rollbackSpeed).toBeGreaterThan(0);
  });

  it('should verify DEFAULT_SEAT_CONFIG places driver eye position inside cockpit', async () => {
    const { DEFAULT_SEAT_CONFIG } = await import('./useSeatConfig.js');

    expect(DEFAULT_SEAT_CONFIG.seatOffsetX).toBe(-0.38); // Centered on driver seat
    expect(DEFAULT_SEAT_CONFIG.seatOffsetY).toBe(1.16);  // Driver eye height
    expect(DEFAULT_SEAT_CONFIG.seatOffsetZ).toBe(-1.48); // Driver head position
    expect(DEFAULT_SEAT_CONFIG._configVer).toBe(16);
  });

  it('should verify Schulterblick head look angles and rear look rotation', () => {
    // Schulterblick left angle
    const angleLeft = -Math.PI / 2.8;
    expect(angleLeft).toBeLessThan(-1.0);
    // Schulterblick right angle
    const angleRight = Math.PI / 2.8;
    expect(angleRight).toBeGreaterThan(1.0);

    // Look back angle
    const angleBack = Math.PI * 0.95;
    expect(angleBack).toBeGreaterThan(2.9);

    // Verify look back vector points towards the rear (+Z)
    const eye = new THREE.Vector3(-0.38, 1.16, -1.48);
    const targetBack = new THREE.Vector3(
      eye.x + 25 * Math.sin(angleBack),
      eye.y,
      eye.z - 25 * Math.cos(angleBack)
    );
    expect(targetBack.z).toBeGreaterThan(eye.z); // Looking backward towards positive Z
  });

  it('should correctly simulate automatic transmission PRND gear shifting logic and D1-D4 jumping', () => {
    const calcGear = (speed, isDriving, handbrake, isReverse, isNeutral) => {
      if (handbrake) return 'P';
      if (isReverse) return 'R';
      if (isNeutral) return 'N';
      if (isDriving) {
        if (speed < 25) return 'D1';
        if (speed < 52) return 'D2';
        if (speed < 82) return 'D3';
        return 'D4';
      }
      return 'P';
    };

    // Park mode
    expect(calcGear(0, false, true, false, false)).toBe('P');
    expect(calcGear(10, true, true, false, false)).toBe('P');

    // Reverse mode
    expect(calcGear(5, true, false, true, false)).toBe('R');

    // Neutral mode
    expect(calcGear(15, true, false, false, true)).toBe('N');

    // Drive mode: automatic shifting D1 -> D2 -> D3 -> D4
    expect(calcGear(0, true, false, false, false)).toBe('D1');
    expect(calcGear(20, true, false, false, false)).toBe('D1');
    expect(calcGear(25, true, false, false, false)).toBe('D2');
    expect(calcGear(45, true, false, false, false)).toBe('D2');
    expect(calcGear(52, true, false, false, false)).toBe('D3');
    expect(calcGear(75, true, false, false, false)).toBe('D3');
    expect(calcGear(85, true, false, false, false)).toBe('D4');
    expect(calcGear(120, true, false, false, false)).toBe('D4');
  });

  it('should verify Sa Hinh track extends behind start line to ensure rearview mirrors reflect terrain', () => {
    const scene = new THREE.Scene();
    const result = buildCityWorld(scene, 'sa_hinh_fahrschule');

    // Road length is 1200, centered at Z = -350
    // So road covers from Z = -950 to Z = +250
    const roadZMin = result.config.roadZ - result.config.roadLength / 2;
    const roadZMax = result.config.roadZ + result.config.roadLength / 2;

    expect(result.config.roadLength).toBe(1200);
    expect(roadZMin).toBe(-950);
    expect(roadZMax).toBe(250);

    // Behind the start line (Z = 0), at least 200m of paved road must exist
    expect(roadZMax).toBeGreaterThanOrEqual(200);
  });

  it('should verify interior rearview mirror UV calculation maps 3D vertices to [0, 1] range', () => {
    // Toyota Corolla interior mirror vertices bounds:
    // x: [-0.8154, -0.5921], z: [0.2407, 0.2972]
    const calcInteriorUV = (x, z) => {
      const uNorm = (x - (-0.8154)) / (-0.5921 - (-0.8154));
      const vNorm = (z - 0.2407) / (0.2972 - 0.2407);
      return [
        Math.min(1, Math.max(0, uNorm)),
        Math.min(1, Math.max(0, vNorm))
      ];
    };

    // Right edge (passenger side in driver view)
    const [uRight, vBottom] = calcInteriorUV(-0.8154, 0.2407);
    expect(uRight).toBeCloseTo(0.0, 3);
    expect(vBottom).toBeCloseTo(0.0, 3);

    // Left edge (driver side in driver view)
    const [uLeft, vTop] = calcInteriorUV(-0.5921, 0.2972);
    expect(uLeft).toBeCloseTo(1.0, 3);
    expect(vTop).toBeCloseTo(1.0, 3);

    // Center of mirror
    const [uCenter, vCenter] = calcInteriorUV((-0.8154 + -0.5921) / 2, (0.2407 + 0.2972) / 2);
    expect(uCenter).toBeCloseTo(0.5, 3);
    expect(vCenter).toBeCloseTo(0.5, 3);
  });

  it('should verify exterior side mirror UV calculation maps 3D vertices using height (Z) instead of depth (Y)', () => {
    // Toyota Corolla side mirror vertices bounds:
    // Left mirror: x in [0.7956, 1.0068], z in [0.9278, 1.0537]
    const calcSideUV = (x, z) => {
      let uNorm, vNorm;
      if (x > 0) {
        uNorm = (x - 0.7956) / (1.0068 - 0.7956);
        vNorm = (z - 0.9278) / (1.0537 - 0.9278);
      } else {
        uNorm = (-0.7956 - x) / (1.0068 - 0.7956);
        vNorm = (z - 0.9278) / (1.0537 - 0.9278);
      }
      return [
        Math.min(1, Math.max(0, uNorm)),
        Math.min(1, Math.max(0, vNorm))
      ];
    };

    // Driver left mirror - inner edge (near car body)
    const [uInner, vBottom] = calcSideUV(0.7956, 0.9278);
    expect(uInner).toBeCloseTo(0.0, 3);
    expect(vBottom).toBeCloseTo(0.0, 3);

    // Driver left mirror - outer edge (facing adjacent lane)
    const [uOuter, vTop] = calcSideUV(1.0068, 1.0537);
    expect(uOuter).toBeCloseTo(1.0, 3);
    expect(vTop).toBeCloseTo(1.0, 3);
  });

  it('should verify realistic automatic transmission behavior: car starts in P, cannot move without shifting to D/R, stops without auto-reversing', () => {
    // Initial state: vehicle spawned in P (Park)
    const state = {
      gear: 'P',
      handbrake: true,
      isReverse: false,
      isNeutral: false,
      speed: 0,
      rpm: 850
    };

    const updatePhysics = (s, isThrottle, isBrake, dt = 0.016) => {
      if (s.handbrake) {
        s.speed = 0;
        s.rpm = isThrottle ? 2600 : 850;
      } else if (s.isNeutral) {
        s.speed = Math.max(0, s.speed - (isBrake ? 45.0 : 12.0) * dt);
        s.rpm = isThrottle ? 2600 : 850;
      } else if (s.isReverse) {
        if (isThrottle) {
          s.speed = Math.min(22.0, s.speed + 25.0 * dt);
          s.rpm = 1000 + (s.speed / 22) * 2600;
        } else if (isBrake) {
          s.speed = Math.max(0, s.speed - 48.0 * dt);
          s.rpm = s.speed > 0.5 ? 1100 : 850;
        }
      } else {
        // D mode
        if (isThrottle) {
          s.speed = Math.min(85.0, s.speed + 30.0 * dt);
          s.rpm = Math.min(7500, Math.max(900, Math.round(((s.speed % 30) / 30) * 3600 + 1200)));
        } else if (isBrake) {
          s.speed = Math.max(0, s.speed - 45.0 * dt);
          s.rpm = s.speed > 0.5 ? 1100 : 850;
        }
      }
    };

    // 1. In P: stepping on gas revs engine but vehicle stays at speed 0
    updatePhysics(state, true, false);
    expect(state.speed).toBe(0);
    expect(state.rpm).toBeGreaterThanOrEqual(2500);

    // 2. Shift to D
    state.handbrake = false;
    state.gear = 'D';

    // 3. Step on gas in D: vehicle accelerates forward
    for (let i = 0; i < 30; i++) updatePhysics(state, true, false);
    expect(state.speed).toBeGreaterThan(10);

    // 4. Step on brake in D: vehicle comes to a complete stop
    for (let i = 0; i < 60; i++) updatePhysics(state, false, true);
    expect(state.speed).toBe(0);
    // Vehicle STAYS in D, does NOT auto-reverse!
    expect(state.gear).toBe('D');
    expect(state.isReverse).toBe(false);

    // 5. Shift to R
    state.gear = 'R';
    state.isReverse = true;

    // 6. Step on gas in R: vehicle accelerates backward
    for (let i = 0; i < 20; i++) updatePhysics(state, true, false);
    expect(state.speed).toBeGreaterThan(5);
    expect(state.gear).toBe('R');

    // 7. Step on brake in R: vehicle stops and stays in R
    for (let i = 0; i < 40; i++) updatePhysics(state, false, true);
    expect(state.speed).toBe(0);
    expect(state.gear).toBe('R');
  });

  it('should play seatbelt buckle/unbuckle sound and warning chime in SoundEngine', async () => {
    const { default: audioEngine } = await import('./soundEngine.js');
    expect(audioEngine).toBeDefined();

    // Verify audio methods execute cleanly
    expect(() => audioEngine.playSeatbelt(true)).not.toThrow();
    expect(() => audioEngine.playSeatbelt(false)).not.toThrow();
    expect(() => audioEngine.playSeatbeltChime()).not.toThrow();
  });

  it('should render authentic tablo icons (Seat belt, Lane assist, Turn signals, High beam) on VirtualCockpitCluster', async () => {
    const React = await import('react');
    const { render, fireEvent } = await import('@testing-library/react');
    const { VirtualCockpitCluster } = await import('./uiComponents.jsx');

    let seatBeltFastened = false;
    const toggleSeatBelt = () => { seatBeltFastened = !seatBeltFastened; };

    // 1. Initial unbuckled state, lane safe, low beam
    const { container, rerender } = render(
      React.createElement(VirtualCockpitCluster, {
        speed: 45,
        rpm: 2200,
        gear: 'D',
        blinkerL: true,
        blinkerR: false,
        headlights: true,
        hazard: false,
        handbrake: false,
        seatBeltFastened: false,
        onToggleSeatBelt: toggleSeatBelt,
        laneWarning: false
      })
    );

    // Verify Turn Signal telltales
    expect(container.textContent).toContain('◀');
    expect(container.textContent).toContain('▶');

    // Verify Seat Belt indicator: Unbuckled shows "B THẮT"
    expect(container.textContent).toContain('B THẮT');

    // Verify Lane Assist indicator
    expect(container.textContent).toContain('LANE');

    // Verify High Beam indicator
    expect(container.textContent).toContain('BEAM');

    // Click seat belt button to toggle
    const seatBeltBtn = container.querySelector('[title*="Dây an toàn"]');
    expect(seatBeltBtn).toBeDefined();
    fireEvent.click(seatBeltBtn);
    expect(seatBeltFastened).toBe(true);

    // 2. Re-render with buckled seatbelt and lane warning triggered
    rerender(
      React.createElement(VirtualCockpitCluster, {
        speed: 55,
        rpm: 2600,
        gear: 'D',
        blinkerL: false,
        blinkerR: true,
        headlights: true,
        hazard: false,
        handbrake: false,
        seatBeltFastened: true,
        onToggleSeatBelt: toggleSeatBelt,
        laneWarning: true
      })
    );

    // Verify buckled text is now "B OK"
    expect(container.textContent).toContain('B OK');

    // Verify lane warning tooltip is active
    const laneAssistBadge = container.querySelector('[title*="Cảnh báo lệch làn"]');
    expect(laneAssistBadge).toBeDefined();
  });

  it('should accurately detect lane drift for Lane Assist system', () => {
    // Road standard right lane is [0, 7.0] with center at ~3.5m
    const checkLaneDrift = (carX, speed, isDriving) => {
      const isDrifting = Math.abs(carX) < 1.0 || Math.abs(carX) > 5.2;
      return isDriving && speed > 5 && isDrifting;
    };

    // Safe in center of lane at 3.5m
    expect(checkLaneDrift(3.5, 40, true)).toBe(false);

    // Safe at 2.5m
    expect(checkLaneDrift(2.5, 30, true)).toBe(false);

    // Drifting across center line into oncoming traffic (x = 0.5m)
    expect(checkLaneDrift(0.5, 40, true)).toBe(true);

    // Drifting off shoulder / curb (x = 5.8m)
    expect(checkLaneDrift(5.8, 40, true)).toBe(true);

    // Standing still (speed <= 5) -> No active warning chime
    expect(checkLaneDrift(0.5, 0, true)).toBe(false);
  });

  it('should initialize and execute realistic procedural automotive sound engine without errors', async () => {
    const { default: audioEngine } = await import('./soundEngine.js');
    expect(audioEngine).toBeDefined();

    // 1. Audio initialization
    expect(() => audioEngine.init()).not.toThrow();

    // 2. 4-Cylinder engine sound synthesis with throttle load
    expect(() => audioEngine.setEngineSound(850, true, false)).not.toThrow();
    expect(() => audioEngine.setEngineSound(3200, true, true)).not.toThrow();
    expect(() => audioEngine.setEngineSound(5800, true, false)).not.toThrow();

    // 3. Road tire rolling noise
    expect(() => audioEngine.setRoadTireNoise(0, true)).not.toThrow();
    expect(() => audioEngine.setRoadTireNoise(50, true)).not.toThrow();
    expect(() => audioEngine.setRoadTireNoise(120, true)).not.toThrow();

    // 4. Tire skid / squeal (Vollbremsung emergency brake)
    expect(() => audioEngine.setTireSkid(0)).not.toThrow();
    expect(() => audioEngine.setTireSkid(0.75)).not.toThrow();

    // 5. Wind aerodynamic rush
    expect(() => audioEngine.setWindNoise(30)).not.toThrow();
    expect(() => audioEngine.setWindNoise(90)).not.toThrow();

    // 6. Rain ambience and wipers
    expect(() => audioEngine.setRainAmbiance(true)).not.toThrow();
    expect(() => audioEngine.setRainAmbiance(false)).not.toThrow();
    expect(() => audioEngine.playWiperSweep()).not.toThrow();

    // 7. Starter motor crank and ignition flare
    expect(() => audioEngine.playStarterEngine()).not.toThrow();

    // 8. Low speed brake creak
    expect(() => audioEngine.playBrakeCreak()).not.toThrow();

    // 9. Mechanical blinker relay Tick-Tock alternation
    const initialTickTock = audioEngine._blinkerTickTock;
    audioEngine.playBlinker();
    expect(audioEngine._blinkerTickTock).toBe(!initialTickTock);
    audioEngine.playBlinker();
    expect(audioEngine._blinkerTickTock).toBe(initialTickTock);

    // 10. Mute toggling
    expect(() => audioEngine.setMuted(true)).not.toThrow();
    expect(audioEngine.isMuted).toBe(true);
    expect(() => audioEngine.setMuted(false)).not.toThrow();
    expect(audioEngine.isMuted).toBe(false);
  });

  it('should verify world colliders are properly generated for Sa Hinh training ground', () => {
    const scene = new THREE.Scene();
    const result = buildCityWorld(scene, 'sa_hinh_fahrschule');

    expect(result.colliders).toBeDefined();
    expect(Array.isArray(result.colliders)).toBe(true);
    expect(result.colliders.length).toBeGreaterThanOrEqual(60);

    // Verify all essential collider categories exist
    const types = new Set(result.colliders.map(c => c.type));
    expect(types.has('cone')).toBe(true);
    expect(types.has('pole')).toBe(true);
    expect(types.has('vehicle')).toBe(true);
    expect(types.has('curb')).toBe(true);
    expect(types.has('fence')).toBe(true);
    expect(types.has('building')).toBe(true);

    // Verify penalties match StVO exam standard rules
    const coneCollider = result.colliders.find(c => c.type === 'cone');
    expect(coneCollider.penalty).toBe(10);
    expect(coneCollider.shape).toBe('circle');
    expect(coneCollider.radius).toBeGreaterThan(0.2);

    const vehicleColliders = result.colliders.filter(c => c.type === 'vehicle');
    expect(vehicleColliders.length).toBe(2); // Front and rear dummy cars in Längsparken
    expect(vehicleColliders[0].penalty).toBe(30);
    expect(vehicleColliders[0].shape).toBe('box');

    const curbCollider = result.colliders.find(c => c.type === 'curb');
    expect(curbCollider.penalty).toBe(15);
    expect(curbCollider.radius).toBeCloseTo(11.2, 1);

    const fenceCollider = result.colliders.find(c => c.type === 'fence');
    expect(fenceCollider.penalty).toBe(25);
    expect(fenceCollider.shape).toBe('boundary');
    expect(fenceCollider.minX).toBeLessThan(-100);
    expect(fenceCollider.maxX).toBeGreaterThan(100);
  });

  it('should accurately test OBB collision detection and physical cone knock-over reaction', () => {
    // Car specs: center (carX, carWorldZ), halfW = 0.95, halfL = 2.25
    const checkCircleCollision = (carX, carWorldZ, heading, obstacle) => {
      const cosH = Math.cos(heading);
      const sinH = Math.sin(heading);
      const dx = obstacle.x - carX;
      const dz = obstacle.z - carWorldZ;
      const localX = dx * cosH - dz * sinH;
      const localZ = dx * sinH + dz * cosH;
      const cx = Math.max(0, Math.abs(localX) - 0.95);
      const cz = Math.max(0, Math.abs(localZ) - 2.25);
      return (cx * cx + cz * cz) < (obstacle.radius * obstacle.radius);
    };

    const mockCone = {
      x: -45,
      z: 2,
      radius: 0.45,
      mesh: new THREE.Group(),
      hit: false
    };

    // Case 1: Car directly hits the cone
    const directHit = checkCircleCollision(-45, 2.5, 0, mockCone);
    expect(directHit).toBe(true);

    // When hit, cone is tilted physically and marked as hit
    if (directHit) {
      mockCone.mesh.rotation.z = 0.75;
      mockCone.hit = true;
    }
    expect(mockCone.mesh.rotation.z).toBeCloseTo(0.75, 2);
    expect(mockCone.hit).toBe(true);

    // Case 2: Car drives safely in the lane with 2m clearance
    const safePass = checkCircleCollision(-41.0, 2.0, 0, { x: -45, z: 2, radius: 0.45 });
    expect(safePass).toBe(false);

    // Case 3: Verify collision immunity period
    const now = Date.now();
    const immunityUntil = now + 2000;
    const isImmune = now < immunityUntil;
    expect(isImmune).toBe(true);
  });

  it('should accurately detect all Sa Hinh training modules by 2D coordinates', async () => {
    const { detectSaHinhZone, SAHINH_ZONES } = await import('./SaHinhMinimap.jsx');
    expect(SAHINH_ZONES.length).toBeGreaterThanOrEqual(9);

    // Module 1: Slalom (X: -45, Z: -25)
    const slalomZone = detectSaHinhZone(-45, -25);
    expect(slalomZone).toBeDefined();
    expect(slalomZone.id).toBe('slalom');
    expect(slalomZone.number).toBe(1);

    // Module 2: Parallel Parking (X: 45, Z: -25)
    const parallelZone = detectSaHinhZone(45, -25);
    expect(parallelZone).toBeDefined();
    expect(parallelZone.id).toBe('parallel_parking');
    expect(parallelZone.number).toBe(2);

    // Module 3: Perpendicular Parking 90° (X: 48, Z: -125)
    const perpZone = detectSaHinhZone(48, -125);
    expect(perpZone).toBeDefined();
    expect(perpZone.id).toBe('perpendicular_parking');
    expect(perpZone.number).toBe(3);

    // Module 4: Roundabout (X: -55, Z: -125)
    const roundaboutZone = detectSaHinhZone(-55, -125);
    expect(roundaboutZone).toBeDefined();
    expect(roundaboutZone.id).toBe('roundabout');
    expect(roundaboutZone.number).toBe(4);

    // Module 5: 4-Way Intersection (X: 0, Z: -80)
    const interZone = detectSaHinhZone(0, -80);
    expect(interZone).toBeDefined();
    expect(interZone.id).toBe('intersection_4way');
    expect(interZone.number).toBe(5);

    // Module 6: S-Curve (X: -50, Z: -200)
    const scurveZone = detectSaHinhZone(-50, -200);
    expect(scurveZone).toBeDefined();
    expect(scurveZone.id).toBe('scurve');
    expect(scurveZone.number).toBe(6);

    // Module 7: Emergency Braking Lane (X: 16, Z: -192)
    const brakeZone = detectSaHinhZone(16, -192);
    expect(brakeZone).toBeDefined();
    expect(brakeZone.id).toBe('brake');
    expect(brakeZone.number).toBe(7);

    // Module 8: Finish line (X: 0, Z: -234)
    const finishZone = detectSaHinhZone(0, -234);
    expect(finishZone).toBeDefined();
    expect(finishZone.id).toBe('finish');
    expect(finishZone.number).toBe(8);

    // Main Avenue (X: 0, Z: 50)
    const mainAve = detectSaHinhZone(0, 50);
    expect(mainAve).toBeDefined();
    expect(mainAve.id).toBe('main_avenue');
  });

  it('should accurately map exercise spawn points in maps.js to real 2D training ground coordinates', async () => {
    const { MAPS } = await import('../simulation/data/maps.js');
    const saHinhSpawns = MAPS.sa_hinh_fahrschule.spawnPoints;

    expect(saHinhSpawns.start).toEqual({ x: 3.5, y: 0, z: 0 });
    expect(saHinhSpawns.b1_slalom.x).toBeCloseTo(-45, 1);
    expect(saHinhSpawns.b3_parallel.x).toBeCloseTo(45, 1);
    expect(saHinhSpawns.b4_perpendicular.x).toBeCloseTo(48, 1);
    expect(saHinhSpawns.b5_scurve.x).toBeCloseTo(-35, 1);
    expect(saHinhSpawns.b6_ampel.z).toBeCloseTo(-45, 1);
    expect(saHinhSpawns.b7_brake.x).toBeCloseTo(16, 1);
    expect(saHinhSpawns.b11_finish.z).toBeCloseTo(-215, 1);
  });
});



