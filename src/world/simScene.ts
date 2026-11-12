// 🎬 Khung scene simulator v2 — Prompt 1-9: scene + chunk streaming + xe người chơi + NPC + rule engine
import * as THREE from 'three';
import { palette } from '../art/palette';
import { loadGameMap, type GameMap } from './mapLoader';
import { createTerrain, createSkybox, applyFog } from './terrain';
import { buildWorld } from './worldBuilder';
import { ChunkManager } from './chunkManager';
import { createVehicle, spawnFromMap, type VehicleHandle } from './vehicle';
import { NPCController } from './npc';
import { PedestrianController } from './pedestrianController';
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
  headYaw?: number;
  headPitch?: number;
  /** tên phố hiện tại (road gần nhất) — hiển thị trên cụm đồng hồ */
  streetName?: string;
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

/** Vị trí debug report lỗi — hiện trên HUD trang sim-dev */
export interface PosDebug {
  x: number;
  z: number;
  /** ô chunk 100 m chứa vị trí (chunkKeyFor) */
  cell: string;
  /** node giao lộ gần nhất trong bán kính 80 m (nếu có) */
  node?: string;
  /** road gần nhất (quét segment, bất kể khoảng cách) */
  road?: string;
  /** tên phố thật của road gần nhất (OSM Berlin, gắn sẵn trong map JSON) */
  roadName?: string;
  /** hướng nhìn/lái (độ, 0 = bắc) */
  headingDeg: number;
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
  /** đổi số P R N D */
  setGear?: (g: 'P' | 'R' | 'N' | 'D') => void;
  /** dữ liệu mini-map (player-centered top-down) — đọc mỗi frame từ RAF của MiniMap */
  getMapState: () => MapState;
  /** tọa độ debug để report lỗi: x/z (m), ô chunk 100 m, node giao lộ + road gần nhất */
  getPosDebug: () => PosDebug;
  dispose: () => void;
  /** gọi mỗi frame từ host (React) — cập nhật camera bay/xe + render */
  update: (dt: number) => void;
}

const keys = new Set<string>();

/** Road gần nhất với điểm (x,z) — quét segment polyline toàn map (poll 2 Hz, rẻ) */
function nearestRoadAt(
  map: { roads: Array<{ id: string; name?: string; points: [number, number][] }> },
  x: number,
  z: number
): { road: { id: string; name?: string }; dist: number } | null {
  let best: { road: { id: string; name?: string }; dist: number } | null = null;
  for (const r of map.roads) {
    const pts = r.points;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], az = pts[i - 1][1];
      const vx = pts[i][0] - ax, vz = pts[i][1] - az;
      const l2 = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2));
      const d = Math.hypot(x - (ax + t * vx), z - (az + t * vz));
      if (!best || d < best.dist) best = { road: r, dist: d };
    }
  }
  return best;
}

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
    // tốc độ bay (m/s): thường 30, giữ Shift tăng lực 105 — quét map 1.4 km nhanh
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 105 : 30;
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

  // far 4000 > bán kính skybox 3000 — không còn cắt mặt cầu trời (vòm nhọn ở fly view)
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / Math.max(1, container.clientHeight), 0.3, 4000);
  if (!driveMode) {
    camera.position.set(40, 45, 130);
    bindFlyControls(container, camera);
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // ── Color grading điện ảnh: ACES Filmic + sRGB — hết hiện tượng "giấy bồi" phẳng trắng,
  //    highlight trời/nhà có rolloff mềm, màu façade đậm nét như ảnh chụp thật ──
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  container.appendChild(renderer.domElement);

  // ── Ánh sáng Bavarian Altstadt — nâng cường độ để bù tone mapping ACES (nén ~0.8 stop) ──
  const hemi = new THREE.HemisphereLight(0xd8ecff, 0x8a8272, 1.7);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xfff3e0, 0.62);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffedd0, 2.6);
  sun.position.set(140, 200, 90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left = -140;
  sun.shadow.camera.right = 140;
  sun.shadow.camera.top = 140;
  sun.shadow.camera.bottom = -140;
  sun.shadow.camera.far = 600;
  sun.shadow.bias = -0.0004;      // chống shadow acne trên tường nhà
  sun.shadow.normalBias = 0.04;   // đẩy shadow theo normal — hết sọc chéo
  scene.add(sun);
  scene.add(sun.target);

  // ── Terrain + sky + fog ──
  createTerrain(scene);
  const skybox = createSkybox(scene);
  const fog = applyFog(scene); // fog động: near/far cập nhật theo độ cao camera mỗi frame

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
  let peds: PedestrianController | null = null;
  let ruleEngine: RuleEngine | null = null;
  const npcCollisions: string[] = [];
  const staticRects = buildingRects(map);
  let headYaw = 0;
  let headPitch = 0;
  const rearCam = new THREE.PerspectiveCamera(42, 310 / 74, 0.5, 320);
  const leftMirrorCam = new THREE.PerspectiveCamera(44, 188 / 108, 0.3, 250);
  const rightMirrorCam = new THREE.PerspectiveCamera(44, 182 / 104, 0.3, 250);
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

    createVehicle(scene, map).then(v => { vehicle = v; v.setCameraMode(camMode); });
    ruleEngine = new RuleEngine(map, world.controllers);
    // NPC traffic + người đi bộ (nạp GLB nền, không chặn render)
    npcs = new NPCController(map, scene);
    npcs.init(world.controllers, 36);
    peds = new PedestrianController(scene, map);
    peds.init();
  }

  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    // mây trôi chậm trên trời (uTime giây)
    const skyMat = skybox.material as THREE.ShaderMaterial;
    skyMat.uniforms.uTime.value = now / 1000;
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
        // NPC + người đi bộ + rule engine
        npcs?.update(dt, { player: { x: vehicle.state.x, z: vehicle.state.z }, controllers: world.controllers, collisions: npcCollisions });
        peds?.update(dt);
        // ── số: 1=P, 2=R, 3=N, 4=D (hỗ trợ cả Digit và Numpad) ──
        let gear: 'P' | 'R' | 'N' | 'D' | undefined;
        if (keys.has('Digit1') || keys.has('Numpad1')) gear = 'P';
        else if (keys.has('Digit2') || keys.has('Numpad2')) gear = 'R';
        else if (keys.has('Digit3') || keys.has('Numpad3')) gear = 'N';
        else if (keys.has('Digit4') || keys.has('Numpad4')) gear = 'D';
        ruleEngine?.update(dt, {
          x: vehicle.state.x,
          z: vehicle.state.z,
          heading: vehicle.state.heading,
          speed: vehicle.state.speed,
          signal: vehicle.signal, // phục vụ vi phạm 'nosignal' (quên xi-nhan khi rẽ)
          stopped: Math.abs(vehicle.state.speed) < 0.15, // xe đã dừng hẳn (dùng cho stop sign)
          inCrosswalk: peds ? peds.isPedNearCrosswalk(vehicle.state.x, vehicle.state.z) : false
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
          vehicle?.setCameraMode(camMode);
          keyMPrev = true;
        } else if (!keys.has('KeyM')) {
          keyMPrev = false;
        }
        if (keys.has('KeyV') && !keyVPrev) {
          camMode = camMode === 'outside' ? 'cabin' : 'outside';
          vehicle?.setCameraMode(camMode);
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
          camera.rotation.set(-0.005 + headPitch + pitchSquat, sp.yaw + headYaw, roll);
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
    // ── Fog + streaming scale theo độ cao camera ──
    // Mặt đất: 250/1400. Bay lên thì lùi fog ra xa NHƯNG vẫn phải hết gọn TRƯỚC mép
    // terrain (2500 m) — nếu fog còn "đang giữa chừng" ở mép đất thì gặp trời bị seam.
    const camY = Math.max(0, camera.position.y);
    const lift = Math.max(0, camY - 10);
    fog.near = 250 + lift * 0.5;
    fog.far = Math.min(1400 + lift * 0.8, 1900);
    chunkMgr.setLoadRadius(Math.min(300 + camY * 1.5, 1000));
    chunkStats = chunkMgr.update(camera.position.x, camera.position.z);
    // ── Shadow camera bám theo xe/camera: hết bóng biến mất ngoài 120 m từ gốc toạ độ ──
    const shadowFocusX = driveMode && vehicle ? vehicle.state.x : camera.position.x;
    const shadowFocusZ = driveMode && vehicle ? vehicle.state.z : camera.position.z;
    sun.position.set(shadowFocusX + 140, 200, shadowFocusZ + 90);
    sun.target.position.set(shadowFocusX, 0, shadowFocusZ);
    sun.target.updateMatrixWorld();
    const pr = renderer.getPixelRatio();
    const screenW = renderer.domElement.clientWidth;
    const screenH = renderer.domElement.clientHeight;

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, screenW * pr, screenH * pr);
    renderer.render(scene, camera);

    if (driveMode && vehicle && camMode === 'cabin') {
      const h = vehicle.state.heading;
      const cRect = renderer.domElement.getBoundingClientRect();

      renderer.setScissorTest(true);
      vehicle.group.visible = false; // Tạm ẩn xe để vỏ xe không che góc nhìn gương

      // 1. Gương chiếu hậu trung tâm (Center Rearview Mirror)
      const centerEl = document.getElementById('sim-mirror-center');
      if (centerEl) {
        const m = centerEl.getBoundingClientRect();
        const rX = Math.round((m.left - cRect.left) * pr);
        const rY = Math.round((cRect.bottom - m.bottom) * pr);
        const rW = Math.round(m.width * pr);
        const rH = Math.round(m.height * pr);
        if (rW > 0 && rH > 0 && rX + rW > 0 && rX < screenW * pr && rY + rH > 0 && rY < screenH * pr) {
          rearCam.aspect = m.width / m.height;
          rearCam.updateProjectionMatrix();
          rearCam.position.set(vehicle.state.x, 1.32, vehicle.state.z);
          rearCam.lookAt(
            vehicle.state.x - Math.sin(h) * 45,
            0.92,
            vehicle.state.z - Math.cos(h) * 45
          );
          renderer.setScissor(rX, rY, rW, rH);
          renderer.setViewport(rX, rY, rW, rH);
          renderer.render(scene, rearCam);
        }
      }

      // 2. Gương chiếu hậu ngoài bên trái (Left Wing Mirror)
      const leftEl = document.getElementById('sim-mirror-left');
      if (leftEl) {
        const m = leftEl.getBoundingClientRect();
        const lX = Math.round((m.left - cRect.left) * pr);
        const lY = Math.round((cRect.bottom - m.bottom) * pr);
        const lW = Math.round(m.width * pr);
        const lH = Math.round(m.height * pr);
        if (lW > 0 && lH > 0 && lX + lW > 0 && lX < screenW * pr && lY + lH > 0 && lY < screenH * pr) {
          leftMirrorCam.aspect = m.width / m.height;
          leftMirrorCam.updateProjectionMatrix();
          const camX = vehicle.state.x - Math.cos(h) * 1.05 - Math.sin(h) * 0.15;
          const camZ = vehicle.state.z + Math.sin(h) * 1.05 - Math.cos(h) * 0.15;
          leftMirrorCam.position.set(camX, 1.15, camZ);
          const ang = h - Math.PI + 0.11;
          leftMirrorCam.lookAt(camX + Math.sin(ang) * 45, 0.85, camZ + Math.cos(ang) * 45);
          renderer.setScissor(lX, lY, lW, lH);
          renderer.setViewport(lX, lY, lW, lH);
          renderer.render(scene, leftMirrorCam);
        }
      }

      // 3. Gương chiếu hậu ngoài bên phải (Right Wing Mirror)
      const rightEl = document.getElementById('sim-mirror-right');
      if (rightEl) {
        const m = rightEl.getBoundingClientRect();
        const rxX = Math.round((m.left - cRect.left) * pr);
        const rxY = Math.round((cRect.bottom - m.bottom) * pr);
        const rxW = Math.round(m.width * pr);
        const rxH = Math.round(m.height * pr);
        if (rxW > 0 && rxH > 0 && rxX + rxW > 0 && rxX < screenW * pr && rxY + rxH > 0 && rxY < screenH * pr) {
          rightMirrorCam.aspect = m.width / m.height;
          rightMirrorCam.updateProjectionMatrix();
          const camX = vehicle.state.x + Math.cos(h) * 1.05 - Math.sin(h) * 0.15;
          const camZ = vehicle.state.z - Math.sin(h) * 1.05 - Math.cos(h) * 0.15;
          rightMirrorCam.position.set(camX, 1.15, camZ);
          const ang = h - Math.PI - 0.11;
          rightMirrorCam.lookAt(camX + Math.sin(ang) * 45, 0.85, camZ + Math.cos(ang) * 45);
          renderer.setScissor(rxX, rxY, rxW, rxH);
          renderer.setViewport(rxX, rxY, rxW, rxH);
          renderer.render(scene, rightMirrorCam);
        }
      }

      vehicle.group.visible = true; // Hiện lại xe cho main view
      renderer.setScissorTest(false);
    }
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
    setGear: (g: 'P' | 'R' | 'N' | 'D') => {
      vehicle?.setGear(g);
    },
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
        brake: vehicle.brake,
        headYaw,
        headPitch,
        // tên phố hiện tại cho cụm đồng hồ (road gần nhất)
        streetName: nearestRoadAt(map, vehicle.state.x, vehicle.state.z)?.road.name
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
    // 📍 tọa độ debug report lỗi — drive: vị trí xe; fly: vị trí camera
    getPosDebug: (): PosDebug => {
      const p = driveMode && vehicle
        ? { x: vehicle.state.x, z: vehicle.state.z, heading: vehicle.state.heading }
        : { x: camera.position.x, z: camera.position.z, heading: (camera.rotation as THREE.Euler).y };
      const cell = `${Math.floor(p.x / 100)},${Math.floor(p.z / 100)}`;
      // node giao lộ gần nhất ≤ 80 m
      let node: string | undefined;
      let bestNode = 80;
      for (const n of map.nodes) {
        if (n.type !== 'intersection') continue;
        const d = Math.hypot(n.x - p.x, n.z - p.z);
        if (d < bestNode) {
          bestNode = d;
          node = n.id;
        }
      }
      // road gần nhất — quét segment polyline (HUD poll 2 Hz nên chi phí không đáng kể)
      const near = nearestRoadAt(map, p.x, p.z);
      const road = near?.road.id;
      const roadName = near?.road.name;
      let headingDeg = (p.heading * 180) / Math.PI;
      // chuẩn 0..360, quy về la bàn (0 = bắc = −Z)
      headingDeg = ((-headingDeg % 360) + 360) % 360;
      return { x: p.x, z: p.z, cell, node, road, roadName, headingDeg };
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
