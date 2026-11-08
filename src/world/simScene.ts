// 🎬 Khung scene simulator v2 — Protocol Prompt 1 (khung dự án, chưa làm xe)
// Scene + ánh sáng (mục 5) + terrain/skybox + camera bay tự do + đọc map.json
import * as THREE from 'three';
import { palette } from '../art/palette';
import { loadGameMap, type GameMap } from './mapLoader';
import { createTerrain, createSkybox, applyFog } from './terrain';
import { buildWorld } from './worldBuilder';

export interface SimSceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  map: GameMap;
  dispose: () => void;
  /** gọi mỗi frame từ host (React) — cập nhật camera bay + render */
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

export function createSimScene(container: HTMLElement, mapJson: unknown): SimSceneHandle {
  const map = loadGameMap(mapJson);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.skyHorizon);

  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / Math.max(1, container.clientHeight), 0.1, 1500);
  camera.position.set(40, 45, 130);
  bindFlyControls(container, camera);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);

  // ── Ánh sáng — Protocol mục 5 ──
  const hemi = new THREE.HemisphereLight(0xbfd6ef, 0x59503a, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.4);
  sun.position.set(120, 160, 60);
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

  // 🌍 World meshes (Prompt 2): đường + ngã tư + vạch + vỉa hè từ map.json
  const world = buildWorld(scene, map);
  const debugMarkers = new THREE.Group();
  void debugMarkers;

  let raf = 0;
  let last = performance.now();
  const fly = (camera as THREE.PerspectiveCamera & { userData: { _flyUpdate?: (dt: number) => void } }).userData;

  const tick = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    fly._flyUpdate?.(dt);
    world.update(dt);
    renderer.render(scene, camera);
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

  return {
    scene,
    camera,
    renderer,
    map,
    stats: world.stats,
    dispose: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
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
