// 🎬 Khung scene simulator v2 — Prompt 1-9: scene + chunk streaming + xe người chơi + NPC + rule engine
import * as THREE from 'three';
import { palette } from '../art/palette';
import { loadGameMap, type GameMap } from './mapLoader';
import { createTerrain, createSkybox, applyFog } from './terrain';
import { buildWorld } from './worldBuilder';
import { ChunkManager } from './chunkManager';
import { createVehicle, spawnFromMap, type VehicleHandle } from './vehicle';
import { NPCController } from './npc';
import { buildingRects } from './collisions';
import { RuleEngine, type Violation } from '../simulation/ruleEngine';
import { nodeById } from './mapLoader';
import type { LightPhase } from './trafficLights';

export interface SimStats {
  drawCalls: number;
  triangles: number;
  cellsLoaded: number;
  cellsTotal: number;
  quads: number;
  fps: number; // trung bình trượt 1 giây
}

export interface RuleState {
  violations: Violation[];
  bestanden: boolean;
  summary: string;
  speedKmh: number;
  signal: 'left' | 'right' | null; // xi-nhan người chơi — HUD mũi tên đọc từ đây
  gear: 'P' | 'R' | 'N' | 'D'; // số sân hiện tại
  violationsBySeverity: { major: Violation[]; minor: Violation[] }; // báo cáo chi tiết Fahrprüfung
  elapsedTime: number; // thời gian thi (giây)
  steerAngle?: number;
  rpm?: number;
  speedLimit?: number;
  camMode?: 'cabin' | 'outside' | 'mirror' | 'shoulder';
  throttle?: number;
  brake?: number;
}

// 🗺️ MiniMap (Prompt 10): top-down quanh player, đọc mỗi frame riêng
export interface MapLightState {
  x: number;
  z: number;
  phase: LightPhase; // 'red' | 'red_yellow' | 'green' | 'yellow' → màu chấm đèn
}

export interface MapState {
  player: { x: number; z: number; heading: number; signal: 'left' | 'right' | null } | null;
  npcs: Array<{ x: number; z: number; heading: number }>;
  lights: MapLightState[];
}

export interface SimSceneOptions {
  /** chế độ lái xe: WASD điều khiển xe, camera cabin (mặc định: camera bay tự do) */
  drive?: boolean;
}

export interface SimSceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  map: GameMap;
  vehicle: VehicleHandle | null;
  getStats: () => SimStats;
  getRuleState: () => RuleState | null;
  /** dữ liệu mini-map (player-centered top-down) — đọc mỗi frame từ RAF của MiniMap */
  getMapState: () => MapState;
  dispose: () => void;
  /** gọi mỗi frame từ host (React) — cập nhật camera bay/xe + render */
  update: (dt: number) => void;
}

const keys = new Set<string>();

function bindFlyControls(dom: HTMLElement, camera: THREE.PerspectiveCamera): () => void {
  const onKeyDown = (e: KeyboardEvent) => keys.add(e.code);
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let yaw = 0; // nhìn về −Z (forward = (−sin yaw, 0, −cos yaw))
  let pitch = -0.2;

  const onMouseDown = (e: MouseEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY; };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    yaw -= (e.clientX - lastX) * 0.004;
    pitch -= (e.clientY - lastY) * 0.004;
    pitch = Math.max(-1.4, Math.min(1.3, pitch));
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onMouseUp = () => { dragging = false; };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  dom.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  camera.rotation.order = 'YXZ';

  const flyCam = camera as THREE.PerspectiveCamera & {
    userData: { _flyUpdate?: ((dt: number) => void) | null; _setPose?: (yaw: number, pitch: number) => void }
  };

  // gắn hàm cập nhật camera mỗi frame qua userData
  flyCam.userData._flyUpdate = (dt: number) => {
    const speed = keys.has('ShiftLeft') ? 60 : 18;
    const dir = new THREE.Vector3();
    if (keys.has('KeyW')) dir.z -= 1;
    if (keys.has('KeyS')) dir.z += 1;
    if (keys.has('KeyA')) dir.x -= 1;
    if (keys.has('KeyD')) dir.x += 1;
    if (keys.has('KeyE')) dir.y += 1;
    if (keys.has('KeyQ')) dir.y -= 1;
    if (dir.lengthSq() > 0) {
      dir.normalize().applyEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
      camera.position.addScaledVector(dir, speed * dt);
    }
    camera.rotation.set(pitch, yaw, 0);
  };

  // đặt pose tuyệt đối (dev/test dùng — đồng bộ state yaw/pitch nội bộ)
  flyCam.userData._setPose = (yawNew: number, pitchNew: number) => {
    yaw = yawNew;
    pitch = pitchNew;
    dragging = false;
    camera.rotation.set(pitch, yaw, 0);
  };

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    dom.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    flyCam.userData._flyUpdate = null;
    flyCam.userData._setPose = undefined;
  };
}

export function createSimScene(container: HTMLElement, mapJson: unknown, opts: SimSceneOptions = {}): SimSceneHandle {
  const map = loadGameMap(mapJson);
  const driveMode = !!opts.drive;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.skyHorizon);

  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / Math.max(1, container.clientHeight), 0.3, 1500);
  if (!driveMode) {
    camera.position.set(40, 45, 130);
    bindFlyControls(container, camera);
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);

  // ── Ánh sáng Bavarian Altstadt — Cân bằng ambient tự nhiên, chống mặt tường đen xịt ──
  const hemi = new THREE.HemisphereLight(0xdcebfa, 0x7a7364, 1.15);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xfff5ea, 0.42);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.9);
  sun.position.set(140, 200, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  sun.shadow.camera.far = 500;
  sun.shadow.bias = -0.0004;      // chống shadow acne trên tường nhà
  sun.shadow.normalBias = 0.03;   // đẩy shadow theo normal — hết sọc chéo
  scene.add(sun);
  scene.add(sun.target);

  // ── Terrain + sky + fog ──
  createTerrain(scene);
  createSkybox(scene);
  applyFog(scene);

  // 🌍 World data (Prompt 2-4) + chunk streaming (Prompt 6)
  const world = buildWorld(scene, map);
  const chunkMgr = new ChunkManager(world.chunkData, scene, {
    loadRadius: 300,
    unloadRadius: 420,
    materials: world.materials,
    extras: world.extras
  });
  const debugMarkers = new THREE.Group();
  void debugMarkers;

  // 🗺️ mini-map: vị trí các giao lộ có đèn GIAO THÔNG (precompute 1 lần, phase đọc runtime)
  const lightNodes = world.controllers.map(c => {
    const n = nodeById(map, c.nodeId);
    return { x: n?.x ?? 0, z: n?.z ?? 0, phase: () => c.currentPhase };
  });

  let raf = 0;
  let last = performance.now();
  let chunkStats = { cellsLoaded: 0, cellsTotal: 0, meshes: 0 };
  // FPS counter: trung bình trượt 1 giây
  let fps = 0;
  let fpsFrames = 0;
  let fpsLast = performance.now();
  // Camera mode: 'cabin' (mặc định), 'outside' (third-person), 'mirror', 'shoulder'
  let camMode: 'cabin' | 'outside' | 'mirror' | 'shoulder' = 'cabin';
  let shoulderHold = 0; // thời gian giữ phím C (giây)
  let keyMPrev = false;
  let keyVPrev = false;
  const fly = (camera as THREE.PerspectiveCamera & { userData: { _flyUpdate?: (dt: number) => void } }).userData;

  // 🚙 Drive mode: WASD lái xe (dùng chung `keys` module), camera ghế lái
  let vehicle: VehicleHandle | null = null;
  let npcs: NPCController | null = null;
  let ruleEngine: RuleEngine | null = null;
  const npcCollisions: string[] = [];
  const staticRects = buildingRects(map);
  let headYaw = 0;
  let headPitch = 0;
  let isMouseLooking = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  if (driveMode) {
    camera.rotation.order = 'YXZ';
    const driveKey = (e: KeyboardEvent, down: boolean) => {
      if (down) keys.add(e.code);
      else keys.delete(e.code);
    };
    window.addEventListener('keydown', e => driveKey(e, true));
    window.addEventListener('keyup', e => driveKey(e, false));

    const onMouseDown = (e: MouseEvent) => {
      isMouseLooking = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isMouseLooking && camMode === 'cabin') {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        headYaw -= dx * 0.005;
        headPitch -= dy * 0.005;
        headYaw = Math.max(-1.45, Math.min(1.45, headYaw));
        headPitch = Math.max(-0.4, Math.min(0.4, headPitch));
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    };
    const onMouseUp = () => { isMouseLooking = false; };
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    createVehicle(scene, map).then(v => { vehicle = v; });
    ruleEngine = new RuleEngine(map, world.controllers);
    // NPC traffic (nạp GLB nền, không chặn render)
    npcs = new NPCController(map, scene);
    npcs.init(world.controllers, 8);
  }

  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (driveMode) {
      if (vehicle) {
        // va chạm công trình: dừng xe + ghi lỗi major (AABB nhà, radius 0.9)
        for (const r of staticRects) {
          if (vehicle.state.x > r.minX - 0.9 && vehicle.state.x < r.maxX + 0.9 &&
              vehicle.state.z > r.minZ - 0.9 && vehicle.state.z < r.maxZ + 0.9) {
            const near = ruleEngine?.nearestRoad({ x: vehicle.state.x, z: vehicle.state.z, heading: vehicle.state.heading, speed: vehicle.state.speed });
            const half = near ? (near.road.lanesForward + near.road.lanesBackward) * near.road.laneWidth / 2 : 3;
            if (near && near.dist < half + 1.2) {
              continue;
            }
            vehicle.state.speed = 0;
            vehicle.syncPose();
            if (npcCollisions[npcCollisions.length - 1] !== 'building') npcCollisions.push('building');
            break;
          }
        }
        // NPC + rule engine
        npcs?.update(dt, { player: { x: vehicle.state.x, z: vehicle.state.z }, controllers: world.controllers, collisions: npcCollisions });
        // ── số sân: 1=P, 2=R, 3=N, 4=D ──
        let gear: 'P' | 'R' | 'N' | 'D' | undefined;
        if (keys.has('Digit1')) gear = 'P';
        else if (keys.has('Digit2')) gear = 'R';
        else if (keys.has('Digit3')) gear = 'N';
        else if (keys.has('Digit4')) gear = 'D';
        ruleEngine?.update(dt, {
          x: vehicle.state.x,
          z: vehicle.state.z,
          heading: vehicle.state.heading,
          speed: vehicle.state.speed,
          signal: vehicle.signal, // phục vụ vi phạm 'nosignal' (quên xi-nhan khi rẽ)
          stopped: Math.abs(vehicle.state.speed) < 0.15, // xe đã dừng hẳn (dùng cho stop sign)
          inCrosswalk: false // sẽ cập nhật khi phát hiện player trong vùng zebra
        }, npcCollisions);
        vehicle?.update(dt, {
          throttle: keys.has('KeyW') ? 1 : 0,
          brake: keys.has('KeyS') ? 1 : 0,
          steer: keys.has('KeyD') ? 1 : keys.has('KeyA') ? -1 : 0,
          gear,
          signalLeft: keys.has('KeyQ'),
          signalRight: keys.has('KeyE'),
          boost: keys.has('ShiftLeft') || keys.has('ShiftRight')
        });
        // ── Camera mode: M = gương, C giữ = qua vai, V = camera ngoài ──
        if (keys.has('KeyM') && !keyMPrev) {
          camMode = camMode === 'cabin' ? 'mirror' : 'cabin';
          keyMPrev = true;
        } else if (!keys.has('KeyM')) {
          keyMPrev = false;
        }
        if (keys.has('KeyV') && !keyVPrev) {
          camMode = camMode === 'outside' ? 'cabin' : 'outside';
          keyVPrev = true;
        } else if (!keys.has('KeyV')) {
          keyVPrev = false;
        }
        if (keys.has('KeyC')) {
          shoulderHold += dt;
          if (shoulderHold >= 0.5) camMode = 'shoulder';
        } else {
          shoulderHold = 0;
          if (camMode === 'shoulder') camMode = 'cabin';
        }
        // Áp dụng camera theo mode
        if (camMode === 'outside') {
          // Camera bên ngoài, phía sau xe
          const dist = 6;
          const h = vehicle.state.heading + Math.PI;
          camera.position.set(
            vehicle.state.x - Math.sin(h) * dist,
            3,
            vehicle.state.z - Math.cos(h) * dist
          );
          camera.lookAt(vehicle.state.x, 1, vehicle.state.z);
        } else if (camMode === 'mirror') {
          // Gương phía sau: camera nhạy về phía sau xe
          const dist = 1.5;
          const h = vehicle.state.heading + Math.PI;
          camera.position.set(
            vehicle.state.x - Math.sin(h) * dist,
            1.2,
            vehicle.state.z - Math.cos(h) * dist
          );
          camera.lookAt(vehicle.state.x + Math.sin(h) * 10, 1, vehicle.state.z + Math.cos(h) * 10);
        } else if (camMode === 'shoulder') {
          // Qua vai phải
          const dist = 2;
          const h = vehicle.state.heading + Math.PI;
          const rx = Math.cos(h) * 1.2;
          const rz = Math.sin(h) * 1.2;
          camera.position.set(
            vehicle.state.x - Math.sin(h) * dist + rx,
            2,
            vehicle.state.z - Math.cos(h) * dist + rz
          );
          camera.lookAt(vehicle.state.x + Math.sin(h) * 8, 1.5, vehicle.state.z + Math.cos(h) * 8);
        } else {
          // Cabin (mặc định)
          // Liếc nhìn trái / phải bằng phím mũi tên hoặc Z/X (quan sát ngã tư StVO Blickführung)
          let glanceYaw = 0;
          if (keys.has('ArrowLeft') || keys.has('KeyZ')) glanceYaw = 1.15; // ~66° trái
          else if (keys.has('ArrowRight') || keys.has('KeyX')) glanceYaw = -1.15; // ~66° phải

          if (glanceYaw !== 0) {
            headYaw += (glanceYaw - headYaw) * Math.min(1, 10 * dt);
          } else if (!isMouseLooking) {
            // Tự động về vị trí nhìn thẳng mượt mà
            headYaw += (0 - headYaw) * Math.min(1, 6 * dt);
            headPitch += (0 - headPitch) * Math.min(1, 6 * dt);
          }

          // Động học rung lắc cabin theo tốc độ, gia tốc và góc đánh lái
          const steerAngle = vehicle.steerAngle || 0;
          const speedNorm = Math.min(1, Math.abs(vehicle.state.speed) / 18);
          const roll = -steerAngle * speedNorm * 0.06;
          const pitchSquat = keys.has('KeyS') ? -0.025 : (keys.has('KeyW') ? 0.015 : 0);

          // Dynamic FOV theo tốc độ: cảm giác tốc độ sống động
          camera.fov = 66 + Math.min(10, (Math.abs(vehicle.state.speed) / 25) * 8);
          camera.updateProjectionMatrix();

          const sp = vehicle.seatPose();
          camera.position.set(sp.x, sp.y, sp.z);
          camera.rotation.set(-0.03 + headPitch + pitchSquat, sp.yaw + headYaw, roll);
        }
      } else {
        // chờ GLB load — camera tạm tại spawn
        const s = spawnFromMap(map);
        camera.position.set(s.x, 1.18, s.z);
        camera.rotation.set(-0.03, s.heading + Math.PI, 0);
      }
    } else {
      fly._flyUpdate?.(dt);
    }
    world.update(dt);
    chunkStats = chunkMgr.update(camera.position.x, camera.position.z);
    renderer.render(scene, camera);
    // FPS trung bình trượt 1 giây
    fpsFrames++;
    const nowFps = performance.now();
    if (nowFps - fpsLast >= 1000) {
      fps = fpsFrames;
      fpsFrames = 0;
      fpsLast = nowFps;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const onResize = () => {
    const w = container.clientWidth;
    const h = Math.max(1, container.clientHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // ── Chế độ debug (phím G): tô mỗi material một màu rực, in quad count ──
  let debugMode = false;
  const debugColors: Record<string, number> = {
    road: 0xff0000,      // đỏ
    road_worn: 0x00ff00, // xanh lá
    white: 0x0000ff,     // xanh dương
    sidewalk: 0xff00ff,  // magenta
    building: 0xffff00   // vàng
  };

  function applyDebugColors() {
    for (const [key, mat] of Object.entries(world.materials)) {
      if (debugMode && debugColors[key] !== undefined) {
        (mat as any).color.setHex(debugColors[key]);
      } else if (!debugMode) {
        if (key === 'road') (mat as any).color.setHex(parseInt(palette.asphalt.slice(1), 16));
        if (key === 'road_worn') (mat as any).color.setHex(parseInt(palette.asphaltWorn.slice(1), 16));
        if (key === 'white') (mat as any).color.setHex(parseInt(palette.lineWhite.slice(1), 16));
        if (key === 'sidewalk') (mat as any).color.setHex(parseInt(palette.sidewalk.slice(1), 16));
        if (key === 'building') (mat as any).color.setHex(0xffffff);
      }
    }
    if (debugMode) {
      console.log('[DEBUG] Materials:', Object.keys(world.materials).join(', '));
      console.log('[DEBUG] Total quads:', world.stats.quads);
      console.log('[DEBUG] Cells:', world.stats.cells);
    }
  }

  function onDebugKey(e: KeyboardEvent) {
    if (e.code === 'KeyG') {
      e.preventDefault();
      debugMode = !debugMode;
      applyDebugColors();
      console.log(`[DEBUG] mode=${debugMode ? 'ON' : 'OFF'}`);
    }
  }
  window.addEventListener('keydown', onDebugKey);

  return {
    scene,
    camera,
    renderer,
    map,
    get vehicle() { return vehicle; },
    getStats: (): SimStats => ({
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      cellsLoaded: chunkStats.cellsLoaded,
      cellsTotal: chunkStats.cellsTotal,
      quads: world.stats.quads,
      fps
    }),
    getRuleState: (): RuleState | null => {
      if (!ruleEngine || !vehicle) return null;
      const speedKmh = Math.max(0, Math.round(vehicle.state.speed * 3.6));
      let rpm = 800; // vòng tua idle
      if (vehicle.state.gear === 'P' || vehicle.state.gear === 'N') {
        rpm = keys.has('KeyW') ? 4200 : 800;
      } else if (vehicle.state.gear === 'R') {
        rpm = 800 + Math.min(3200, Math.round(Math.abs(speedKmh) * 140));
      } else {
        const gearSpeed = speedKmh < 24 ? speedKmh : speedKmh < 45 ? speedKmh - 20 : speedKmh < 68 ? speedKmh - 40 : speedKmh - 62;
        rpm = Math.min(6200, Math.max(900, 900 + Math.round(gearSpeed * 85)));
      }
      return {
        violations: ruleEngine.violations.slice(-5),
        bestanden: ruleEngine.bestanden,
        summary: ruleEngine.summary,
        speedKmh,
        signal: vehicle.signal,
        gear: vehicle.state.gear,
        violationsBySeverity: ruleEngine.violationsBySeverity,
        elapsedTime: ruleEngine.elapsed,
        steerAngle: vehicle.steerAngle,
        rpm,
        speedLimit: ruleEngine.currentSpeedLimit ?? 50,
        camMode,
        throttle: vehicle.throttle,
        brake: vehicle.brake
      };
    },
    // 🗺️ mini-map: gom snapshot mỗi frame từ RAF riêng của MiniMap — không dùng chung RAF render
    getMapState: (): MapState => {
      const player = vehicle
        ? {
            x: vehicle.state.x,
            z: vehicle.state.z,
            heading: vehicle.state.heading,
            signal: vehicle.signal
          }
        : null;
      const npcDots = (npcs?.npcs ?? []).map(n => ({
        x: n.group.position.x,
        z: n.group.position.z,
        // GLB NPC mặt −Z → heading = ry − π (khớp convention pose() h + π)
        heading: n.group.rotation.y - Math.PI
      }));
      const lights = lightNodes.map(l => ({ x: l.x, z: l.z, phase: l.phase() }));
      return { player, npcs: npcDots, lights };
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onDebugKey);
      vehicle?.dispose();
      npcs?.dispose();
      chunkMgr.dispose();
      world.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
    update: (dt: number) => {
      fly._flyUpdate?.(dt);
    }
  };
}
