import * as THREE from 'three';
import { SCENARIOS, MAP_SCENARIOS, initScore, applyEvent } from '../components/SimScenarios.js';
import { DEFAULT_SEAT_CONFIG } from './seatConfig.js';
import { audioEngine } from './SoundEngine.js';
import { create3DPlayerCar, create3DCockpit } from './carBuilder.js';
import { buildCityWorld } from './worldBuilder.js';
import { createTrafficAICar } from './trafficAI.js';
import { makeGermanSign, makeTrafficLight } from './signs.js';
import { createSkyGradientTexture } from './textures.js';

export function initSimulationEngine(container, refs, callbacks) {
  let isMounted = true;
  let renderer;
  let clock;
  let reqId;
  let handleResize;
  const trafficLights = [];
  const aiCars = [];
  let blinkTimer = 0;

  const init = async () => {
    try {
      clock = new THREE.Clock();
    const scene = new THREE.Scene();
    const skyTex = createSkyGradientTexture();
    const skyColor = new THREE.Color(0x38bdf8);
    scene.background = skyTex;
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0035);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 1.4);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfff7ed, 2.8);
    sun.position.set(50, 120, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(68, container.clientWidth / container.clientHeight, 0.1, 700);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (!isMounted) { renderer.dispose(); return; }
    const currentContainer = container;
    currentContainer.innerHTML = '';
    currentContainer.appendChild(renderer.domElement);

    const playerCar = create3DPlayerCar(scene);
    scene.add(playerCar);

    const { cockpit, wheelGroup, stalkGroup, wiperGroup } = create3DCockpit(scene, playerCar);
    refs.current._cockpit = cockpit;
    refs.current._wheelGroup = wheelGroup;

    const headLightL = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 4.8, 0.4, 1);
    headLightL.position.set(-0.75, 0.72, -3.78);
    headLightL.target.position.set(-0.75, 0.2, -45);
    playerCar.add(headLightL); playerCar.add(headLightL.target);

    const headLightR = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 4.8, 0.4, 1);
    headLightR.position.set(0.75, 0.72, -3.78);
    headLightR.target.position.set(0.75, 0.2, -45);
    playerCar.add(headLightR); playerCar.add(headLightR.target);

    const cockpitLightL = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 4.8, 0.4, 1);
    cockpitLightL.position.set(0, 1.2, -0.6);
    cockpitLightL.target.position.set(0, 0.1, -45);
    camera.add(cockpitLightL); camera.add(cockpitLightL.target);

    const { scenery, roadMat, crossStreetZ, config, isCustomMap, playerSpawnPos } = buildCityWorld(scene);
    refs.current._scenery = scenery;
    refs.current._crossStreetZ = crossStreetZ;
    refs.current._LOOP = 2000;
    refs.current._isCustomMap = isCustomMap || false;

    // Spawn xe người lái ở vị trí phù hợp
    let carStartX = 1.6, carStartZ = 0;
    if (isCustomMap && playerSpawnPos) {
      carStartX = playerSpawnPos.x;
      carStartZ = playerSpawnPos.z;
      // Update vị trí thực tế của playerCar mesh
      playerCar.position.set(carStartX, 0, -carStartZ);
    }
    refs.current._carX = carStartX;
    refs.current._carZ = carStartZ;

    // Chỉ spawn biển báo mặc định nếu KHÔNG phải custom map
    if (!isCustomMap) {
      SCENARIOS.forEach(sc => {
        if (sc.type === 'SPEED_LIMIT' || sc.type === 'STOP_SIGN' || sc.type === 'YIELD' || sc.type === 'PRIORITY') {
          const signObj = makeGermanSign(sc.type, sc.limit);
          signObj.position.set(6.2, 0, -sc.triggerZ);
          scene.add(signObj);
        }
      });
    }

    // Spawn AI cars: chỉ spawn trên custom map nếu có, hoặc spawn mặc định
    const aiColors = [0xef4444, 0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b];
    
    if (isCustomMap && config && config.elements) {
      // Spawn AI cars trên custom map roads
      const roadElements = config.elements.filter(el => el.type === 'ROAD_STRAIGHT');
      roadElements.forEach((road, index) => {
        const aiMesh = createTrafficAICar(aiColors[index % aiColors.length]);
        const roadCenterX = road.x + road.width / 2;
        const roadCenterZ = road.z + road.height / 2;
        aiMesh.position.set(roadCenterX, 0, -roadCenterZ);
        aiMesh.rotation.y = (road.rotation || 0) * (Math.PI / 180);
        scene.add(aiMesh);
        aiCars.push({ mesh: aiMesh, initialZ: roadCenterZ, speed: 15, isOpposite: false });
      });
    } else {
      // Spawn AI cars mặc định trên city map
      [ -150, -350, -600, -950, -1300 ].forEach((zPos, index) => {
        const aiMesh = createTrafficAICar(aiColors[index % aiColors.length]);
        const isOppositeLane = index % 2 === 0;
        const initialX = isOppositeLane ? -3.2 : 4.8;
        aiMesh.position.set(initialX, 0, zPos);
        if (isOppositeLane) aiMesh.rotation.y = Math.PI;
        scene.add(aiMesh);
        aiCars.push({ mesh: aiMesh, initialZ: zPos, speed: 18 + index * 2, isOpposite: isOppositeLane });
      });
    }

    const rainGeo = new THREE.BufferGeometry();
    const rainCount = 1500;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let rIdx = 0; rIdx < rainCount * 3; rIdx += 3) {
      rainPositions[rIdx] = (Math.random() - 0.5) * 50;
      rainPositions[rIdx + 1] = Math.random() * 30;
      rainPositions[rIdx + 2] = (Math.random() - 0.5) * 160;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.22,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    scene.add(rainParticles);

    refs.current._carZ = carStartZ;

    SCENARIOS.filter(s => s.type === 'TRAFFIC_LIGHT').forEach(s => {
      const tl = makeTrafficLight(true);
      tl.position.set(carStartX + 5.5, 0, carStartZ - s.triggerZ - 4);
      scene.add(tl);
      trafficLights.push({ tl, scenario: s });
    });

    let wiperTime = 0;
    let wheelRotationAngle = 0;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const r = refs.current;
      const keys = r.keys;
      const cfg = refs.current.seatConfig || DEFAULT_SEAT_CONFIG;

      const isNitro = (keys[' '] || keys['Space']) && r.speed > 30 && r.nitroEnergy > 5;
      const isThrottle = keys['w'] || keys['W'] || keys['ArrowUp'] || isNitro;
      const isBrake = keys['s'] || keys['S'] || keys['ArrowDown'];

      // ── 1. Real Pedal-Based Driving Physics (W = Gas, S = Brake, no auto-cruise) ──
      if (r.isDriving) {
        const maxSpeedLimit = r.selectedMapId === 'AUTOBAHN' ? 150 : 85;
        if (isNitro) {
          // Nitro boost
          r.speed = Math.min(maxSpeedLimit + 20, r.speed + 45.0 * dt);
        } else if (isThrottle) {
          // Gas pedal: accelerate smoothly
          const accel = r.speed < 20 ? 32.0 : r.speed < 50 ? 22.0 : r.speed < 90 ? 15.0 : 10.0;
          r.speed = Math.min(maxSpeedLimit, r.speed + accel * dt);
        } else if (isBrake) {
          // Brake pedal: strong deceleration
          r.speed = Math.max(0, r.speed - 45.0 * dt);
        } else {
          // Coasting / engine braking (no gas, no brake)
          r.speed = Math.max(0, r.speed - 4.0 * dt);
        }
      } else {
        // Emergency stop
        r.speed = Math.max(0, r.speed - 20.0 * dt);
      }
      const v = r.speed / 3.6; // Velocity in m/s

      // ── 2. Steering Kinematics (speed-dependent sensitivity) ──────────
      if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        r.targetSteer = -1;
      } else if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        r.targetSteer = 1;
      } else if (!r.buttonSteerActive) {
        r.targetSteer = 0;
      }

      // Smooth steering input & return to center torque
      const steerInputSpeed = r.targetSteer !== 0 ? 7.0 : 9.0;
      r.steer += (r.targetSteer - r.steer) * Math.min(1, steerInputSpeed * dt);

      // Speed-dependent max steer angle (less at high speed = more stable)
      const maxSteerAngleRad = Math.max(0.22, 0.54 - (r.speed / 80) * 0.22);
      const turnAngle = -r.steer * maxSteerAngleRad;

      // Ackermann Front Wheel Pivots
      const wheelbase = 2.90;
      const trackWidth = 1.88;
      let deltaL = turnAngle;
      let deltaR = turnAngle;
      if (Math.abs(turnAngle) > 0.001) {
        const tanD = Math.tan(turnAngle);
        deltaL = Math.atan2(wheelbase * tanD, wheelbase + 0.5 * trackWidth * tanD);
        deltaR = Math.atan2(wheelbase * tanD, wheelbase - 0.5 * trackWidth * tanD);
      }
      if (playerCar._frontSteerPivots) {
        if (playerCar._frontSteerPivots[0]) playerCar._frontSteerPivots[0].rotation.y = deltaL;
        if (playerCar._frontSteerPivots[1]) playerCar._frontSteerPivots[1].rotation.y = deltaR;
      }

      // ── Real Vehicle Steering & Accumulated Heading Kinematics ─────────
      const mps = r.speed / 3.6;
      const currentZ = r._scenery ? r._scenery.position.z : r.distanceTraveled;
      let isAtIntersection = false;
      if (r._crossStreetZ) {
        for (let i = 0; i < r._crossStreetZ.length; i++) {
          const crossDist = Math.abs(r._crossStreetZ[i]);
          if (Math.abs(currentZ - crossDist) < 26.0) {
            isAtIntersection = true;
            break;
          }
        }
      }
      r.isAtIntersection = isAtIntersection;

      // Ackermann Yaw Velocity Rate (rad/sec) based on steering input & speed:
      // Turning steering wheel (A/D) accumulates heading changes smoothly and realistically.
      // At 25-35 km/h, holding steer turns 90° (~1.57 rad) in 1.4 seconds.
      const turnYawSens = isAtIntersection ? 1.85 : 1.35;
      const yawVelocity = v > 0.05 ? (v / wheelbase) * Math.tan(turnAngle) * turnYawSens : 0;
      r.heading += yawVelocity * dt;

      // Limit max absolute heading orientation between -PI/2 and +PI/2 (-90° to +90°)
      r.heading = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, r.heading));

      // When driver releases steer keys (A/D released -> r.targetSteer === 0):
      // The car RETAINS its current heading angle!
      // Gentle road-centering alignment ONLY if wheels are straight and vehicle is close to parallel (within ~10° / 0.18 rad)
      if (r.targetSteer === 0 && Math.abs(r.steer) < 0.08) {
        const snapTargets = [0, Math.PI / 2, -Math.PI / 2];
        let nearestSnap = 0;
        let minDiff = Infinity;
        for (const snapVal of snapTargets) {
          const diff = Math.abs(r.heading - snapVal);
          if (diff < minDiff) {
            minDiff = diff;
            nearestSnap = snapVal;
          }
        }
        // Gently align to nearest lane direction (0°, 90°, -90°) if close (within ~10°)
        if (minDiff < 0.18) {
          r.heading += (nearestSnap - r.heading) * Math.min(1, 4.0 * dt);
        }
      }

      // Ground Motion Vector (Trigonometrics: forward along Z, side along X)
      const forwardSpeed = mps * Math.cos(r.heading);
      const lateralSpeed = v > 0.05 ? mps * Math.sin(r.heading) : 0;

      if (r._scenery) {
        r._scenery.position.z += forwardSpeed * dt;
        if (r._scenery.position.z > r._LOOP) r._scenery.position.z -= r._LOOP;
        if (r._scenery.position.z < 0) r._scenery.position.z += r._LOOP;
      }

      r.carX -= lateralSpeed * dt;
      r.carX = Math.max(-52.0, Math.min(52.0, r.carX));

      // ── 3. Tire Rotation & Physical Suspension Inertia ───────────────
      wheelRotationAngle += (v / 0.38) * dt;
      if (playerCar._rollingWheels) {
        playerCar._rollingWheels.forEach(w => {
          w.rotation.x = wheelRotationAngle;
        });
      }

      // Body Roll & Pitch Inertia
      const targetRoll = -r.steer * 0.05 * Math.min(1, r.speed / 35);
      const targetPitch = isBrake ? -0.055 : isThrottle ? 0.035 : 0;
      const roadBumpBounce = r.speed > 5 ? Math.sin(r.distanceTraveled * 0.5) * 0.012 * Math.min(1, r.speed / 40) : 0;

      if (playerCar._mercedesModel) {
        const m = playerCar._mercedesModel;

        const userScaleMult = cfg.glbScale !== undefined ? cfg.glbScale : 1.0;
        const baseScale = m._baseScale || 0.8105;
        const finalScale = baseScale * userScaleMult;

        m.scale.set(finalScale, finalScale, finalScale);

        const userRotY = cfg.glbRotY !== undefined ? cfg.glbRotY : 180.0;
        const rotYRad = (userRotY * Math.PI) / 180;
        m.rotation.y = rotYRad;

        const posX = cfg.glbOffsetX || 0.0;
        const posY = roadBumpBounce + (cfg.glbOffsetY || 0.0);
        const posZ = -1.45 + (cfg.glbOffsetZ || 0.0);

        m.position.set(posX, posY, posZ);

        m.rotation.z += (targetRoll - m.rotation.z) * Math.min(1, 8 * dt);
        m.rotation.x += (targetPitch - m.rotation.x) * Math.min(1, 8 * dt);

        if (cfg.bodyColor) {
          m.traverse(child => {
            if (child._isBodyPaint && child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach(mat => mat.color.setStyle(cfg.bodyColor));
            }
          });
        }
      }

      // Active Rear LED Brake Lights & Flashing Indicators
      if (playerCar._brakeL && playerCar._brakeR) {
        const brakeIntensity = isBrake ? 4.5 : 0.4;
        playerCar._brakeL.intensity = brakeIntensity;
        playerCar._brakeR.intensity = brakeIntensity;
      }

      blinkTimer += dt * 5;
      const isBlinkOn = Math.floor(blinkTimer) % 2 === 0;

      if (playerCar._blinkerL) {
        const activeL = (r.blinkerLeft || r.hazard) && isBlinkOn;
        playerCar._blinkerL.intensity = activeL ? 3.5 : 0;
      }
      if (playerCar._blinkerR) {
        const activeR = (r.blinkerRight || r.hazard) && isBlinkOn;
        playerCar._blinkerR.intensity = activeR ? 3.5 : 0;
      }

      const mode = r.weatherMode;
      const isNightMode = mode === 'night';
      const isRainMode = mode === 'rain';

      const lightsOn = r.headlights || isNightMode || isRainMode;
      const targetLightIntensity = lightsOn ? 9.5 : 0.0;
      headLightL.intensity = targetLightIntensity;
      headLightR.intensity = targetLightIntensity;
      cockpitLightL.intensity = targetLightIntensity;

      if (isNightMode) {
        scene.background = skyColor;
        skyColor.setHex(0x020617);
        scene.fog.color.setHex(0x020617);
        hemiLight.intensity = 0.25;
        sun.intensity = 0.15;
        rainMat.opacity = 0;
        roadMat.roughness = 0.75; roadMat.metalness = 0.1;
        if (wiperGroup) wiperGroup.rotation.z = -1.2;
      } else if (isRainMode) {
        scene.background = skyColor;
        skyColor.setHex(0x334155);
        scene.fog.color.setHex(0x334155);
        hemiLight.intensity = 0.55;
        sun.intensity = 0.45;
        rainMat.opacity = 0.85;
        roadMat.roughness = 0.15; roadMat.metalness = 0.65;

        const posArray = rainGeo.attributes.position.array;
        for (let p = 1; p < rainCount * 3; p += 3) {
          posArray[p] -= 55 * dt;
          if (posArray[p] < 0) posArray[p] = 30;
        }
        rainGeo.attributes.position.needsUpdate = true;

        wiperTime += dt * 4;
        if (wiperGroup) wiperGroup.rotation.z = Math.sin(wiperTime) * 0.7;
      } else {
        scene.background = skyTex;
        scene.fog.color.setHex(0x7dd3fc);
        hemiLight.intensity = 1.4;
        sun.intensity = 2.8;
        rainMat.opacity = 0;
        roadMat.roughness = 0.75; roadMat.metalness = 0.1;
        if (wiperGroup) wiperGroup.rotation.z = -1.2;
      }

      let currentGear = 'P';
      if (r.isDriving) {
        if (r.speed < 25) currentGear = 'D1';
        else if (r.speed < 55) currentGear = 'D2';
        else if (r.speed < 85) currentGear = 'D3';
        else currentGear = 'D4';
      }
      callbacks.setGear(currentGear);

      const calculatedRpm = r.isDriving
        ? Math.min(7500, Math.max(850, Math.round(((r.speed % 30) / 30) * 3600 + 1200 + (isNitro ? 2200 : 0))))
        : 0;
      callbacks.setRpm(calculatedRpm);

      audioEngine.setEngineSound(calculatedRpm, r.isDriving, isThrottle);

      if (isNitro) {
        r.nitroEnergy = Math.max(0, r.nitroEnergy - 32 * dt);
      } else if (!isNitro && r.nitroEnergy < 100) {
        r.nitroEnergy = Math.min(100, r.nitroEnergy + 15 * dt);
      }
      callbacks.setNitroEnergy(Math.round(r.nitroEnergy));

      callbacks.setSpeed(r.speed); callbacks.setSteerAngle(r.steer);

      // ── 5. Cockpit Steering Wheel & Turn Signal Stalk Sync ────────────
      if (wheelGroup) {
        wheelGroup.rotation.z = -r.steer * 2.5;
      }

      if (stalkGroup) {
        if (r.blinkerLeft) stalkGroup.rotation.z = -0.3;
        else if (r.blinkerRight) stalkGroup.rotation.z = 0.3;
        else stalkGroup.rotation.z = 0;
      }

      r.distanceTraveled += mps * dt;
      callbacks.setDistanceTraveled(r.distanceTraveled);

      // Move Traffic AI Cars along Waypoints
      aiCars.forEach(ai => {
        if (ai.isOpposite) {
          ai.mesh.position.z += (ai.speed / 3.6 + mps) * dt;
          if (ai.mesh.position.z > 50) ai.mesh.position.z = -1600;
        } else {
          ai.mesh.position.z += (mps - ai.speed / 3.6) * dt;
          if (ai.mesh.position.z < -1600) ai.mesh.position.z = 50;
        }
      });

      const playerX = r.carX;
      playerCar.position.set(playerX, 0, 0);
      playerCar.rotation.y = r.heading; // Subtle 4.5-degree car nose angle

      r.headLookCurrent += (r.headLookTarget - r.headLookCurrent) * 10 * dt;

      // ── 6. Dynamic Camera Rig (Stable Horizon & Frame Alignment) ────────
      const speedShake = (r.speed > 50 ? (Math.random() - 0.5) * (r.speed / 120) * 0.018 : 0);
      const camLeanBack = isThrottle ? 0.22 : isBrake ? -0.25 : 0;

      if (refs.current._cockpit) {
        refs.current._cockpit.position.set(
          cfg.seatOffsetX !== undefined ? cfg.seatOffsetX : -0.38,
          (cfg.seatOffsetY !== undefined ? cfg.seatOffsetY : 1.52) + roadBumpBounce,
          cfg.seatOffsetZ !== undefined ? cfg.seatOffsetZ : -1.48
        );
      }

      if (refs.current._wheelGroup) {
        refs.current._wheelGroup.position.set(
          cfg.wheelOffsetX !== undefined ? cfg.wheelOffsetX : 0.0,
          cfg.wheelOffsetY !== undefined ? cfg.wheelOffsetY : -0.36,
          cfg.wheelOffsetZ !== undefined ? cfg.wheelOffsetZ : -0.58
        );
        const wScale = cfg.wheelScale || 1.0;
        refs.current._wheelGroup.scale.set(wScale, wScale, wScale);
      }

      if (r.cameraViewMode === 'chase') {
        // 3rd Person Chase View framing 3D Mercedes-Benz GLS 580 model
        cockpit.visible = false;
        playerCar.visible = true;
        if (playerCar._mercedesModel) playerCar._mercedesModel.visible = true;

        // Local chase camera offset behind car tail
        const localChaseX = -r.steer * 0.5;
        const localChaseY = (cfg.chaseCamY || 2.05) + speedShake + roadBumpBounce * 0.5;
        const localChaseZ = (cfg.chaseCamZ || 4.20) + camLeanBack;

        // Rotate local chase offset by car heading angle around Y
        const cosH = Math.cos(r.heading);
        const sinH = Math.sin(r.heading);

        const targetCamX = playerX + localChaseX * cosH - localChaseZ * sinH;
        const targetCamY = localChaseY;
        const targetCamZ = localChaseX * sinH + localChaseZ * cosH;

        camera.position.x += (targetCamX - camera.position.x) * Math.min(1, 12 * dt);
        camera.position.y += (targetCamY - camera.position.y) * Math.min(1, 12 * dt);
        camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, 12 * dt);

        // Target point ahead of car nose along car heading
        const lookTargetX = playerX - 18 * Math.sin(r.heading - r.steer * 0.2);
        const lookTargetZ = -18 * Math.cos(r.heading - r.steer * 0.2);
        const lookTargetY = 1.0 + roadBumpBounce;

        camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);
        const rollAngle = -r.steer * 0.035;
        camera.up.set(Math.sin(rollAngle), Math.cos(rollAngle), 0);
        camera.fov = isNitro ? (cfg.fov || 68) + 10 : (cfg.fov || 68) - 3 + (r.speed / 140) * 8;
        camera.updateProjectionMatrix();
      } else {
        // 1st Person Cockpit View: driver eyes position in world space
        cockpit.visible = true;
        playerCar.visible = true;
        if (playerCar._mercedesModel) {
          playerCar._mercedesModel.visible = true;
        }

        // Seat offset in local car frame
        const seatX = cfg.seatOffsetX !== undefined ? cfg.seatOffsetX : -0.38;
        const seatY = (cfg.seatOffsetY !== undefined ? cfg.seatOffsetY : 1.16) + speedShake + roadBumpBounce;
        const seatZ = cfg.seatOffsetZ !== undefined ? cfg.seatOffsetZ : -1.48;

        // Transform local seat position by car heading (rotation around Y)
        const cosH = Math.cos(r.heading);
        const sinH = Math.sin(r.heading);

        const camX = playerX + seatX * cosH - seatZ * sinH;
        const camY = seatY + targetPitch * 0.4;
        const camZ = seatX * sinH + seatZ * cosH + camLeanBack * 0.15;

        // City Car Driving dynamic turn look-ahead (looking into corner apex)
        // When driver steers (A/D), head dynamically turns into corner apex (~42° pan)
        const isSchulterblick = Math.abs(r.headLookCurrent) > 0.1;
        const dynamicTurnLook = isSchulterblick ? 0 : -r.steer * 0.72;
        const totalYaw = r.heading + r.headLookCurrent + dynamicTurnLook;

        const lookTargetX = camX - 50 * Math.sin(totalYaw);
        const lookTargetZ = camZ - 50 * Math.cos(totalYaw);
        const pitchRad = ((cfg.seatPitch || 0) * Math.PI) / 180;
        const lookTargetY = camY + Math.tan(pitchRad) * 50 + targetPitch * 4 + speedShake;

        // Natural head roll into curves
        const rollAngle = -r.steer * 0.04;
        camera.up.set(Math.sin(rollAngle), Math.cos(rollAngle), 0);
        camera.position.set(camX, camY, camZ);
        camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);
        camera.fov = isNitro ? (cfg.fov || 68) + 7 : (cfg.fov || 68);
        camera.updateProjectionMatrix();
      }

      if ((playerX < -50.0 || playerX > 50.0) && !r.collisionOccurred) {
        r.collisionOccurred = true;
        r.speed = 0; r.targetSpeed = 0; r.isDriving = false; callbacks.setIsDriving(false);
        audioEngine.playPenalty();

        const newSS = {
          points: Math.max(0, r.scoreState.points - 20),
          events: [...r.scoreState.events, {
            msg: '❌ Đâm rào chắn giới hạn bản đồ! (-20đ)',
            passed: false, time: Date.now()
          }]
        };
        r.scoreState = newSS; callbacks.setScore(newSS.points); callbacks.setEvents(newSS.events);
        callbacks.setCollision({
          type: 'curb',
          messageVi: '💥 VA CHẠM RÀO CHẮN BẢN ĐỒ THÀNH PHỐ!',
          messageDe: '💥 KOLLISION! Sie sind gegen die Kartengrenze gefahren.'
        });
      }

      if (r.distanceTraveled > 1500 && r.distanceTraveled < 1660) {
        pedestrian.position.x = -8 + ((r.distanceTraveled - 1500) / 160) * 16;
      }

      if (!r.finished) {
        const dist = r.distanceTraveled;
        const idx = r.scenarioIdx;
        const currentMapScenarios = MAP_SCENARIOS[r.selectedMapId || 'RECHTS_VOR_LINKS'] || SCENARIOS;
        if (idx < currentMapScenarios.length) {
          const sc = currentMapScenarios[idx];
          if (dist >= sc.triggerZ && !r.activeScenario) {
            r.activeScenario = sc;
            r.crossedCenter = false;
            r.schulterblickLeftDone = false;
            r.schulterblickRightDone = false;
            r.stopTimer = 0;
            r.lastSchulterblickDir = null;
            callbacks.setActiveScenario(sc); callbacks.setScenarioIdx(idx);
          }

          // Update active scenario real-time measurements (STOP duration, Schulterblick)
          if (r.activeScenario) {
            if (r.speed < 1.0) r.stopTimer = (r.stopTimer || 0) + dt;
            if (r.headLookTarget < -0.1) { r.schulterblickLeftDone = true; r.lastSchulterblickDir = 'left'; }
            if (r.headLookTarget > 0.1) { r.schulterblickRightDone = true; r.lastSchulterblickDir = 'right'; }
          }

          if (r.activeScenario && dist >= sc.resolveZ) {
            const passed = sc.check(r.speed, r.crossedCenter, r);
            if (passed) audioEngine.playSuccess(); else audioEngine.playPenalty();

            const newSS = applyEvent(r.scoreState, sc, passed);
            r.scoreState = newSS; callbacks.setScore(newSS.points); callbacks.setEvents([...newSS.events]);
            r.activeScenario = null; r.scenarioIdx = idx + 1;
            callbacks.setActiveScenario(null); callbacks.setScenarioIdx(idx + 1);
            if (idx + 1 >= currentMapScenarios.length) {
              callbacks.setFinished(true);
              r.finished = true;
            }
          }
        }
      }

      trafficLights.forEach(({ tl, scenario }) => {
        const dist = refs.current.distanceTraveled;
        const isRed = dist >= scenario.triggerZ - 25 && dist < scenario.resolveZ;
        tl._redLight.material.color.set(isRed ? 0xef4444 : 0x450a0a);
        tl._grnLight.material.color.set(isRed ? 0x052e16 : 0x22c55e);
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!currentContainer || !renderer) return;
      camera.aspect = currentContainer.clientWidth / currentContainer.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentContainer.clientWidth, currentContainer.clientHeight);
    };
      window.addEventListener('resize', handleResize);
    } catch (err) {
      console.error(err);
    }
  };

  init();

  return () => {
    isMounted = false;
    if (reqId) cancelAnimationFrame(reqId);
    if (handleResize) window.removeEventListener('resize', handleResize);
    if (renderer) renderer.dispose();
    if (container) container.innerHTML = '';
  };
}
