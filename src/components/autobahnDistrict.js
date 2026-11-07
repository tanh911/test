import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ProceduralRoadGenerator } from '../simulation/proceduralRoadGenerator.js';
import roadGraphAutobahn from '../simulation/data/road_graph_autobahn.json';
import roadGraphTraining from '../simulation/data/road_graph_training.json';
import { TrafficRuleResolver } from '../simulation/legal/TrafficRuleResolver.js';
import trafficRulesBerlin from '../simulation/data/traffic_rules_berlin.json';
import { examinerEngine } from '../simulation/ExaminerRuleEngine.js';
import { createAutobahnGantry, makeGermanStVOSign, getOrCreateCanvasTexture, getSharedTexturedMaterial, sharedMaterials } from './streetProps.js';
import { makeTrafficLight } from './3dObjects.js';

/**
 * 🛣️ AUTOBAHN A2 HAMM/RHYNERN DISTRICT BUILDER (PBF Map Engine)
 * Renders 4+ lane motorways, W-Beam guardrails, I-beam posts, Reflektorpfosten StVO 620,
 * Overhead Gantry Signs (Schilderbrücke), and VZ 330.1 Autobahn Start signs.
 * Spawn point is computed authoritatively from the OSM road graph (A2 mainline).
 */

/**
 * Tính điểm xuất phát chuẩn trên trục chính A2 từ road graph OSM thật.
 * Chọn đoạn motorway dài nhất, đặt xe ở giữa đoạn (làn phải - Rechtsfahrgebot)
 * và hướng xe theo chiều centerline (quy ước heading: rot = atan2(dx, -dz)).
 */
function computeAutobahnSpawn(graphData) {
  const motorways = (graphData?.roads || []).filter(r => r.highway === 'motorway' && Array.isArray(r.centerline) && r.centerline.length >= 2);
  if (motorways.length === 0) return null;

  let best = null;
  motorways.forEach((r) => {
    let len = 0;
    for (let i = 1; i < r.centerline.length; i++) {
      len += Math.hypot(r.centerline[i][0] - r.centerline[i - 1][0], r.centerline[i][1] - r.centerline[i - 1][1]);
    }
    if (!best || len > best.len) best = { r, len };
  });

  const c = best.r.centerline;
  const target = best.len * 0.4; // Điểm nhập làn sau Auffahrt, tránh giữa đoạn quá trống
  let total = 0;
  let px = c[0][0], pz = c[0][1], dx = 0, dz = 1;
  for (let i = 1; i < c.length; i++) {
    const segLen = Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]);
    if (segLen < 1e-6) continue;
    if (total + segLen >= target) {
      const t = (target - total) / segLen;
      px = c[i - 1][0] + (c[i][0] - c[i - 1][0]) * t;
      pz = c[i - 1][1] + (c[i][1] - c[i - 1][1]) * t;
      dx = (c[i][0] - c[i - 1][0]) / segLen;
      dz = (c[i][1] - c[i - 1][1]) / segLen;
      break;
    }
    total += segLen;
  }

  // Lệch sang phải theo hướng chạy (làn phải) khoảng nửa chiều rộng mặt đường.
  // Pháp tuyến phải của hướng chạy (dx,dz) là R = (-dz, dx) — đã kiểm chứng với
  // vị trí xe ngược chiều (median nằm bên trái người lái, quy tắc đi bên phải Đức).
  const roadWidth = best.r.width || 14;
  const rightX = -dz;
  const rightZ = dx;
  const laneWidth = roadWidth / (best.r.lanes || 3);
  const laneOffset = roadWidth / 2 - laneWidth / 2; // tâm làn phải
  const rot = Math.atan2(dx, -dz);

  return {
    x: px + rightX * laneOffset,
    z: pz + rightZ * laneOffset,
    rot,
    roadName: best.r.name || 'A 2'
  };
}

/**
 * 🚧 BỘ LỌC KHÔNG GIAN CHO THỰC VẬT (Road Clearance Index)
 * Lấy mẫu điểm mỗi 12m dọc TẤT CẢ đường trong graph vào lưới không gian.
 * Dùng để chặn cây mọc trên mặt đường (kể cả làn xe của xa lộ song song,
 * ramp nhập/xuất hay đường cao vượt B63 đi ngang).
 */
function buildRoadClearanceIndex(graphData) {
  const cell = 50;
  const grid = new Map();
  const addSample = (x, z, halfW) => {
    const key = `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
    let arr = grid.get(key);
    if (!arr) { arr = []; grid.set(key, arr); }
    arr.push({ x, z, halfW });
  };
  (graphData?.roads || []).forEach((r) => {
    const c = r.centerline;
    if (!Array.isArray(c) || c.length < 2) return;
    const halfW = (r.width || 14) / 2;
    for (let i = 1; i < c.length; i++) {
      const [x1, z1] = c[i - 1];
      const [x2, z2] = c[i];
      const segLen = Math.hypot(x2 - x1, z2 - z1);
      const steps = Math.max(1, Math.ceil(segLen / 12));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        addSample(x1 + (x2 - x1) * t, z1 + (z2 - z1) * t, halfW);
      }
    }
  });
  return (x, z, margin = 4) => {
    const gx = Math.floor(x / cell), gz = Math.floor(z / cell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const arr = grid.get(`${gx + dx},${gz + dz}`);
        if (!arr) continue;
        for (let i = 0; i < arr.length; i++) {
          const s = arr[i];
          const ddx = x - s.x, ddz = z - s.z;
          if (ddx * ddx + ddz * ddz < (s.halfW + margin) * (s.halfW + margin)) return true;
        }
      }
    }
    return false;
  };
}

/**
 * 🌲 THỰC VẬT DỌC AUTOBAHN (Waldsäume & Feldgehölze)
 * Trồng cây hai bên trục cao tốc từ road graph OSM thật: rừng thông xen lá rộng
 * kiểu viền rừng Đức (Waldrand), nhịp 40-60m, né nút giao & lối ra vào.
 * Dùng shared geometry + material toàn bộ (chỉ ~4 draw-call material) để giữ 60 FPS.
 */
function buildAutobahnVegetation(scenery, roadGraphData, isNearRoad) {
  const group = new THREE.Group();
  group.name = 'Autobahn_Vegetation';

  // RNG deterministic (mulberry32) — bố cục cây giống nhau mỗi lần load
  let seed = 20060401;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Shared materials
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.95 });
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x1a4d2e, roughness: 0.85 });
  const pineLightMat = new THREE.MeshStandardMaterial({ color: 0x256b3a, roughness: 0.85 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a30, roughness: 0.9 });
  const leafLightMat = new THREE.MeshStandardMaterial({ color: 0x3f8f45, roughness: 0.9 });

  // Shared geometries (unit size, scale theo từng cây)
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 2.6, 6);
  const coneGeo = new THREE.ConeGeometry(1.0, 1.0, 7);
  const sphereGeo = new THREE.SphereGeometry(1.0, 7, 6);

  const makePine = (x, z, s) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.3 * s; trunk.scale.set(s, s, s);
    g.add(trunk);
    const tiers = [
      { r: 1.9, h: 3.0, y: 3.2, m: pineMat },
      { r: 1.45, h: 2.4, y: 4.9, m: rand() > 0.5 ? pineMat : pineLightMat },
      { r: 1.0, h: 1.8, y: 6.3, m: pineLightMat }
    ];
    tiers.forEach(t => {
      const c = new THREE.Mesh(coneGeo, t.m);
      c.scale.set(t.r * s, t.h * s, t.r * s);
      c.position.y = t.y * s;
      g.add(c);
    });
    g.position.set(x, 0, z);
    g.rotation.y = rand() * Math.PI * 2;
    return g;
  };

  const makeDeciduous = (x, z, s) => {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5 * s; trunk.scale.set(s * 1.1, s * 1.5, s * 1.1);
    g.add(trunk);
    const main = new THREE.Mesh(sphereGeo, rand() > 0.5 ? leafMat : leafLightMat);
    main.scale.set(2.4 * s, 2.2 * s, 2.4 * s); main.position.y = 4.6 * s;
    g.add(main);
    const crown = new THREE.Mesh(sphereGeo, leafLightMat);
    crown.scale.set(1.6 * s, 1.5 * s, 1.6 * s);
    crown.position.set(0.7 * s, 5.8 * s, -0.3 * s);
    g.add(crown);
    g.position.set(x, 0, z);
    return g;
  };

  const motorways = (roadGraphData?.roads || []).filter(r =>
    ['motorway', 'motorway_link', 'trunk'].includes(r.highway) && Array.isArray(r.centerline) && r.centerline.length >= 2
  );
  const junctions = (roadGraphData?.junctions || []).map(j => [j.x ?? j.center?.[0], j.z ?? j.center?.[1]]).filter(p => Number.isFinite(p[0]));

  let treeCount = 0;
  const MAX_TREES = 260;
  const nearJunction = (x, z) => junctions.some(([jx, jz]) => Math.hypot(x - jx, z - jz) < 38);

  motorways.forEach((road) => {
    const c = road.centerline;
    const roadHalfWidth = (road.width || 14) / 2;
    let acc = rand() * 40; // offset nhịp đầu ngẫu nhiên
    for (let i = 1; i < c.length && treeCount < MAX_TREES; i++) {
      const [x1, z1] = c[i - 1];
      const [x2, z2] = c[i];
      const segLen = Math.hypot(x2 - x1, z2 - z1);
      if (segLen < 0.5) continue;
      const dirX = (x2 - x1) / segLen;
      const dirZ = (z2 - z1) / segLen;
      // Pháp tuyến 2 bên (trái/phải) của hướng chạy
      const normals = [[dirZ, -dirX], [-dirZ, dirX]];

      while (acc < segLen && treeCount < MAX_TREES) {
        const px = x1 + dirX * acc;
        const pz = z1 + dirZ * acc;
        acc += 42 + rand() * 22; // nhịp 42-64m

        if (nearJunction(px, pz)) continue;
        // Bỏ qua đoạn trên cầu lớn (tree trên cầu trông sai)
        if (road.bridge && road.bridge !== 'no') continue;

        normals.forEach(([nx, nz]) => {
          if (treeCount >= MAX_TREES || rand() < 0.38) return;
          const offset = roadHalfWidth + 7 + rand() * 16; // 7-23m ra ngoài hộ lan
          const s = 0.75 + rand() * 0.75;
          const tx = px + nx * offset;
          const tz = pz + nz * offset;
          // Chặn cây trên mặt đường (làn xa lộ song song, ramp, đường vượt)
          if (isNearRoad && isNearRoad(tx, tz, 4)) return;
          const tree = rand() < 0.62 ? makePine(tx, tz, s) : makeDeciduous(tx, tz, s);
          group.add(tree);
          treeCount++;
        });
      }
      acc -= segLen;
    }
  });

  scenery.add(group);
  return treeCount;
}

/**
 * 🌤️ BẦU TRỜI & CẢNH QUANH AUTOBAHN (Skyline Nordrhein-Westfalen)
 * - scene.background = sky texture equirect (gradient xanh + mây canvas) — hiển thị chắc chắn,
 *   không phụ thuộc far-plane/frustum như sky dome mesh
 * - Vòng đồi rừng low-poly xa 2.6-3km tạo chiều sâu thung lũng
 * - Rừng thông InstancedMesh dày đặc hai bên (hàng nghìn cây, chỉ 2 draw-call)
 */
function buildAutobahnSkyline(scene, scenery, roadGraphData, isNearRoad) {
  const group = new THREE.Group();
  group.name = 'Autobahn_Skyline';

  // ── 1. SKY TEXTURE: gradient trời xanh đậm trên cao → trắng xanh chân trời + mây mềm ──
  if (typeof document !== 'undefined' && scene) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 512;
    const ctx = cv.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      // Đặt xanh đậm trải rộng xuống gần chân trời — vùng nhìn thấy của camera (0-35° độ cao)
      grad.addColorStop(0.0, '#2b78cf');   // zenith
      grad.addColorStop(0.55, '#4f95d6');
      grad.addColorStop(0.82, '#9cc4e6');
      grad.addColorStop(1.0, '#e4eff9');   // chân trời
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Mây Cumulus mềm: mỗi đám = 5-9 quả cầu trắng mờ chồng nhau
      let cSeed = 42;
      const cRand = () => { cSeed = (cSeed * 16807) % 2147483647; return cSeed / 2147483647; };
      for (let i = 0; i < 34; i++) {
        const cx = cRand() * 1024;
        const cy = 60 + cRand() * 260; // mây phủ cả dải trời giữa
        const base = 14 + cRand() * 30;
        ctx.save();
        for (let p = 0; p < 6 + Math.floor(cRand() * 4); p++) {
          const px = cx + (cRand() - 0.5) * base * 4.5;
          const py = cy + (cRand() - 0.5) * base * 0.9;
          const pr = base * (0.5 + cRand() * 0.7);
          const g = ctx.createRadialGradient(px, py - pr * 0.2, pr * 0.1, px, py, pr);
          g.addColorStop(0, 'rgba(255,255,255,0.85)');
          g.addColorStop(0.7, 'rgba(250,252,255,0.5)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      const skyTex = new THREE.CanvasTexture(cv);
      if (THREE.SRGBColorSpace) skyTex.colorSpace = THREE.SRGBColorSpace;
      // Equirect mapping => three render như skybox quay theo hướng nhìn camera
      if (THREE.EquirectangularReflectionMapping !== undefined) {
        skyTex.mapping = THREE.EquirectangularReflectionMapping;
      }
      scene.background = skyTex;
      scene.userData.autobahnSkyTexture = skyTex;
    }
  }

  // ── 2. VÒNG ĐỒI RỪNG PHÍA XA (Richtung Sauerland / Westfälische Bucht) ──
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x39572e, roughness: 1.0 });
  const hillMat2 = new THREE.MeshStandardMaterial({ color: 0x46663a, roughness: 1.0 });
  const hillGeo = new THREE.SphereGeometry(1, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2);
  let hSeed = 7;
  const hRand = () => { hSeed = (hSeed * 48271) % 2147483647; return hSeed / 2147483647; };
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + hRand() * 0.25;
    const dist = 2500 + hRand() * 450;
    const hill = new THREE.Mesh(hillGeo, i % 2 ? hillMat : hillMat2);
    hill.scale.set(380 + hRand() * 380, 90 + hRand() * 170, 380 + hRand() * 380);
    hill.position.set(Math.cos(ang) * dist, -14, Math.sin(ang) * dist);
    group.add(hill);
  }

  // ── 3. RỪNG INSTANCED DÀY ĐẶC HAI BÊN (Waldrand sâu 24-70m) ──
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 2.4, 5);
  const canopyGeo = new THREE.ConeGeometry(1, 1, 6);
  const trunkMatI = new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.95 });
  const canopyMatI = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 });

  const MAX_INST = 1600;
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMatI, MAX_INST);
  const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMatI, MAX_INST);
  trunkInst.castShadow = false; trunkInst.receiveShadow = false;
  canopyInst.castShadow = false; canopyInst.receiveShadow = false;
  trunkInst.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  canopyInst.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const colorA = new THREE.Color(0x1e4d2b);
  const colorB = new THREE.Color(0x35703e);
  const tmpColor = new THREE.Color();
  const mtx = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const eul = new THREE.Euler();
  const posV = new THREE.Vector3();
  const sclV = new THREE.Vector3();

  const motorways = (roadGraphData?.roads || []).filter(r =>
    ['motorway', 'motorway_link', 'trunk'].includes(r.highway) && Array.isArray(r.centerline) && r.centerline.length >= 2
  );
  const junctions = (roadGraphData?.junctions || []).map(j => [j.x ?? j.center?.[0], j.z ?? j.center?.[1]]).filter(p => Number.isFinite(p[0]));
  const nearJunction = (x, z) => junctions.some(([jx, jz]) => Math.hypot(x - jx, z - jz) < 40);

  let fSeed = 991;
  const fRand = () => { fSeed = (fSeed * 16807) % 2147483647; return fSeed / 2147483647; };
  let placed = 0;

  outer:
  for (const road of motorways) {
    if (road.bridge && road.bridge !== 'no') continue;
    const c = road.centerline;
    let acc = fRand() * 12;
    for (let i = 1; i < c.length; i++) {
      const [x1, z1] = c[i - 1];
      const [x2, z2] = c[i];
      const segLen = Math.hypot(x2 - x1, z2 - z1);
      if (segLen < 0.5) continue;
      const dirX = (x2 - x1) / segLen, dirZ = (z2 - z1) / segLen;
      while (acc < segLen) {
        const px = x1 + dirX * acc, pz = z1 + dirZ * acc;
        acc += 8 + fRand() * 9; // mật độ dày: cây mỗi 8-17m mỗi bên
        if (placed >= MAX_INST || nearJunction(px, pz)) continue;
        // 2 bên + cụm 1-2 cây mỗi vị trí
        const sides = fRand() < 0.5 ? [1, -1] : [-1, 1];
        for (const side of sides) {
          if (placed >= MAX_INST) break outer;
          if (fRand() < 0.12) continue;
          const offset = 24 + fRand() * 46; // sâu 24-70m tạo tường rừng
          const s = 0.9 + fRand() * 1.5;
          const tx = px + dirZ * side * offset * -1; // pháp tuyến (-dz, dx)*side
          const tz = pz + dirX * side * offset;
          // Chặn cây đè lên bất kỳ mặt đường nào (xa lộ song song, ramp, đường vượt)
          if (isNearRoad && isNearRoad(tx, tz, 5)) continue;
          posV.set(tx, 0, tz);
          eul.set(0, fRand() * Math.PI * 2, (fRand() - 0.5) * 0.06);
          quat.setFromEuler(eul);
          sclV.set(s, s * (0.9 + fRand() * 0.5), s);
          mtx.compose(posV, quat, sclV);
          trunkInst.setMatrixAt(placed, mtx);
          // Tán nón cao 6-11m
          sclV.set(2.0 * s, 5.5 * s + fRand() * 2.5, 2.0 * s);
          posV.y = 3.2 * s;
          mtx.compose(posV, quat, sclV);
          canopyInst.setMatrixAt(placed, mtx);
          tmpColor.copy(colorA).lerp(colorB, fRand());
          canopyInst.setColorAt(placed, tmpColor);
          placed++;
        }
      }
      acc -= segLen;
    }
  }
  trunkInst.count = placed;
  canopyInst.count = placed;
  if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
  trunkInst.frustumCulled = false;
  canopyInst.frustumCulled = false;
  group.add(trunkInst);
  group.add(canopyInst);

  scenery.add(group);
  return { trees: placed };
}

export function buildAutobahnDistrict(
  scene,
  scenery,
  colliders,
  sharedMaterials,
  isPerformance,
  config = {}
) {
  if (!scenery) {
    throw new Error('[AutobahnDistrict] scenery group is required.');
  }

  const isTraining = (config?.graphSource === 'training') || (config?.id === 'training_circuit');
  const roadGraphData = isTraining ? roadGraphTraining : roadGraphAutobahn;

  // 🏘️ SPAWN: dùng config.playerSpawn từ environment.js (phố Rhynern, Werler Straße) —
  // route vòng phố → Auffahrt → A2 → U-turn → Ausfahrt → phố. Trước đây hàm này tự ghi đè
  // spawn lên giữa trục A2 → người chơi "thả giữa cao tốc" rất kỳ khi bắt đầu.
  // (computeAutobahnSpawn vẫn chạy để lưu metadata autobahnSpawn cho debug/overview.)
  const autobahnSpawn = computeAutobahnSpawn(roadGraphData);
  if (autobahnSpawn) {
    scenery.userData.autobahnSpawn = autobahnSpawn;
    if (scene) scene.userData.autobahnSpawn = autobahnSpawn;
  }

  // 🚫 GLB overlay roads_full.glb TẮT cho graph v2: mesh GLB dựng theo đồ đường v1 —
  // nhúng vào sẽ đè/khớp sai lớp procedural v2 (graph mới có phố + vạch kẻ riêng đầy đủ).
  // Vô hiệu hoá để chỉ còn 1 nguồn hình (procedural v2 nhất quán từ cùng 1 dữ liệu OSM).
  let glbRoadsReady = false;
  // 🎨 BLENDER PIPELINE v2: GLB dựng từ Blender (đường sweep + giao lộ + vỉa hè/curb +
  // vạch kẻ geometry + nhà + công viên/nước/đường sắt + cầu trụ) — thay toàn bộ lớp
  // procedural static tương ứng. Three.js giữ: động lực, signs, đèn, trees, xe.
  const HIDDEN_BY_GLB = new Set([
    'PBF_RoadSurface', 'PBF_ConcreteJerseyMedian', 'PBF_BuildingWalls', 'PBF_BuildingRoofs',
    'PBF_ParksAndGreenery', 'PBF_WaterwaysSurface', 'PBF_WaterEmbankment',
    'PBF_RailwayTrackbed', 'PBF_SteelRails'
  ]);
  const hideProceduralRoadSurfaces = () => {
    // Ẩn MỌI mesh static procedural trực tiếp dưới scenery: có tên trong danh sách
    // HOẶC KHÔNG TÊN (sidewalk/markings của PBF pipeline là mesh ẩn danh — trước đây
    // không bị ẩn → đè lên GLB Blender làm mất mặt đường). Giữ lại: GLB model +
    // các Group động (biển, đèn, cây, skyline — là Group không phải Mesh trực tiếp).
    scenery.children.forEach((child) => {
      if (!child.isMesh) return;
      if (child.name === 'Autobahn_GLB_Model_blender_v2') return;
      if (child.name === 'PBF_GroundPlane') return; // mặt cỏ giữ nguyên (GLB nằm trên nó)
      if (!child.name || child.name.startsWith('PBF_') || HIDDEN_BY_GLB.has(child.name)) {
        child.visible = false;
      }
    });
    scenery.traverse((child) => {
      if (child.isMesh && HIDDEN_BY_GLB.has(child.name)) {
        child.visible = false;
      }
    });
  };
  const GLB_ROADS_OVERLAY_ENABLED = true;
  if (GLB_ROADS_OVERLAY_ENABLED && typeof window !== 'undefined' && window.location && (window.location.protocol.startsWith('http') || window.location.protocol.startsWith('https'))) {
    try {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);
      gltfLoader.load(
        isTraining ? '/maps/training_circuit.glb' : '/maps/autobahn_v2_blender.glb',
        (gltf) => {
          const glbModel = gltf.scene;
          glbModel.name = 'Autobahn_GLB_Model_blender_v2';
          // 🔁 GLB giữ trục Blender (x, -graphZ, height) → quay -90° quanh X để có
          // (graphX, height, graphZ) khớp hệ toạ độ sim: y' = z (cao độ), z' = -y = graphZ
          glbModel.rotation.x = 0; // vertex GLB đã dựng thẳng hệ three.js (export_yup=False)
          glbModel.position.y = 0.0;
          glbModel.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = true;
              child.frustumCulled = true;
              if (child.material) {
                child.material.side = THREE.DoubleSide; // windings bị lật sau xoay trục — render 2 mặt
                // 🎨 GLB v3 có texture tự sinh — texture màu đã chuẩn, KHÔNG nhân 0.3
                // (nhân sẽ làm texture quá tối). Chỉ cần DoubleSide cho windings lật.
              }
            }
          });
          scenery.add(glbModel);
          glbRoadsReady = true;
          hideProceduralRoadSurfaces();
          console.log('[AutobahnDistrict] ✅ Loaded GLB /maps/autobahn_v2_blender.glb (Blender pipeline v2, 509k verts)');
        },
        undefined,
        (err) => {
          console.warn('[AutobahnDistrict] Could not load /maps/autobahn_v2_blender.glb:', err);
          dracoLoader.dispose();
        }
      );
    } catch (err) {
      console.warn('[AutobahnDistrict] GLTFLoader error:', err);
    }
  }

  const roadGen = new ProceduralRoadGenerator(scenery, sharedMaterials);

  try {
    roadGen.buildFromRoadGraph(roadGraphData);
    console.log('[AutobahnDistrict] ✅ buildFromRoadGraph OK for Autobahn A2 Hamm/Rhynern');
    // GLB nạp xong trước procedural → ẩn procedural tại đây (pha 2)
    if (glbRoadsReady) {
      hideProceduralRoadSurfaces();
    }
  } catch (err) {
    console.error('[AutobahnDistrict] ❌ buildFromRoadGraph FAILED:', err);
    throw err;
  }

  const ruleResolver = new TrafficRuleResolver(roadGen.laneGraph, trafficRulesBerlin);
  roadGen.ruleResolver = ruleResolver;

  scenery.userData.roadGen = roadGen;
  scenery.userData.ruleResolver = ruleResolver;
  scenery.userData.roadGraphData = roadGraphData;
  scenery.userData.mapSource = 'OSM_PBF';

  if (scene) {
    scene.userData.roadGen = roadGen;
    scene.userData.ruleResolver = ruleResolver;
    scene.userData.roadGraphData = roadGraphData;
    scene.userData.mapSource = 'OSM_PBF';
  }

  examinerEngine.setRuleResolver(ruleResolver);

  const signsGroup = new THREE.Group();
  signsGroup.name = 'PBF_Autobahn_StVO_Signs_3D';

  // ── 🚦 ĐÈN GIAO THÔNG THẬT từ node OSM `highway=traffic_signals` (graph v2) ──
  // Mỗi junction signalized đặt 1 cột Lichtsignalanlage → TrafficAIManager quét được
  // (trafficLightGroup) → chu kỳ đèn § 37 chạy thật, bot dừng đèn đỏ ĐÚNG VỊ TRÍ.
  {
    // ── 🚦 ĐÈN THEO HƯỚNG TIẾP CẬN THẬT ──
    // Với mỗi junction signalized: tìm các road KẾT THÚC tại junction (luồng xe ĐANG TỚI),
    // đặt đèn ở PHẢI luồng (pháp tuyến R = (-dz, dx)), quay mặt NGƯỢC luồng để tài xế
    // nhìn thẳng đèn đỏ khi tiến gần. Trước đây chỉ đặt 1 đèn góc +5.5/+5.5 cố định —
    // sai phía, sai hướng với đa số tiếp cận.
    const signalized = (roadGraphData?.junctions || []).filter(j => j.trafficSignals);
    if (signalized.length > 0) {
      const lightsGroup = new THREE.Group();
      lightsGroup.name = 'PBF_Autobahn_TrafficLights';
      const FOCUS = config.playerSpawn || { x: -396, z: 895 };
      const HW_RANK = { motorway: 0, trunk: 1, primary: 2, secondary: 3, tertiary: 4, residential: 5, unclassified: 6, living_street: 7 };
      const juncById = new Map(signalized.map(j => [j.osmNodeId, j]));
      const sorted = signalized
        .map(j => ({ j, d: Math.hypot(j.x - FOCUS.x, j.z - FOCUS.z) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 50);

      let lightCount = 0;
      // ⚡ Index roads theo endNode MỘT LẦN (trước đây quét O(junction × roads) = 778k)
      const roadsByEnd = new Map();
      for (const r of roadGraphData?.roads || []) {
        // Key = END NODE STRING: parseInt('node_-80_40') lam custom graph khong khop junction nao -> 0 den
        const endKey = r.endNode || '';
        if (!endKey || !endKey.startsWith('node_')) continue;
        if (!roadsByEnd.has(endKey)) roadsByEnd.set(endKey, []);
        roadsByEnd.get(endKey).push(r);
      }
      for (const { j } of sorted) {
        // Các luồng KẾT THÚC tại junction này
        const approaches = [];
        const juncNodeKey = (j.id || '').replace('junc_', '') || ('node_' + j.osmNodeId);
        for (const r of roadsByEnd.get(juncNodeKey) || []) {
          if (!r.centerline || r.centerline.length < 2) continue;
          const cl = r.centerline;
          const prev = cl[cl.length - 2];
          const last = cl[cl.length - 1];
          const ddx = last[0] - prev[0];
          const ddz = last[1] - prev[1];
          const dl = Math.hypot(ddx, ddz) || 1;
          approaches.push({
            dirX: ddx / dl, dirZ: ddz / dl,
            rank: HW_RANK[r.highway] ?? 9,
            width: r.width || 7
          });
        }
        // Lấy tối đa 2 tiếp cận quan trọng nhất (đường chính trước)
        approaches.sort((a, b) => a.rank - b.rank);
        for (const ap of approaches.slice(0, 2)) {
          const tl = makeTrafficLight(false);
          // Đèn đứng PHẢI luồng tới: R = (-dirZ, dirX)
          const rnx = -ap.dirZ, rnz = ap.dirX;
          tl.position.set(j.x + rnx * (ap.width / 2 + 2.2), 0, j.z + rnz * (ap.width / 2 + 2.2));
          // Mặt đèn quay NGƯỢC hướng luồng → tài xế đang tới nhìn thẳng đèn
          tl.rotation.y = Math.atan2(-ap.dirX, -ap.dirZ);
          lightsGroup.add(tl);
          lightCount++;
        }
      }
      scenery.add(lightsGroup);
      console.log(`[AutobahnDistrict] 🚦 Placed ${lightCount} traffic lights (approach-aware) at signalized OSM junctions (/${signalized.length})`);
    }
  }

  // ── 🧭 BIỂN CHỈ DẪN VÀO CAO TỐC (Wegweiser Z. 431) — sinh theo đường đi thật ──
  // Dijkstra trên graph local (loại trừ motorway): spawn → Auffahrt gần nhất.
  // Tại mỗi giao lộ có RẼ (góc > 25°) đặt biển xanh "A 2 <destination>" + mũi tên
  // trái/thẳng/phải; đoạn dài ≥ 450m thêm biển xác nhận mũi tên thẳng.
  {
    const FOCUS = config.playerSpawn || { x: -396, z: 895 };
    const allRoads = roadGraphData?.roads || [];
    const links = allRoads.filter(r => r.highway === 'motorway_link' && r.centerline?.length >= 2);

    // ── 🕸️ ADJACENCY bằng OSM NODE ID thật (chính xác 100%): ──
    // road.nodes = ['node_<osmId>'...] khớp 1-1 với centerline[i]. Ways chia sẻ node
    // tại junction → nối tự nhiên. Trước đây nối theo endpoint bucket 12m → graph
    // vỡ thành 143 mảnh (ways chạy xuyên junction không bị bắt kết nối).
    const nodePos = new Map();   // osmId -> [x, z]
    const adj = new Map();       // osmId -> [{ to, len }]
    for (const r of allRoads) {
      if (r.highway === 'motorway') continue;
      const cl = r.centerline || [];
      const nids = (r.nodes || []).map(s => parseInt(s.replace('node_', ''), 10));
      if (cl.length < 2 || nids.length !== cl.length) continue;
      for (let i = 0; i < cl.length; i++) {
        if (!nodePos.has(nids[i])) nodePos.set(nids[i], cl[i]);
        if (i > 0) {
          const a = nids[i - 1], b = nids[i];
          const L = Math.hypot(cl[i][0] - cl[i - 1][0], cl[i][1] - cl[i - 1][1]);
          if (!adj.has(a)) adj.set(a, []);
          if (!adj.has(b)) adj.set(b, []);
          adj.get(a).push({ to: b, len: L });
          adj.get(b).push({ to: a, len: L });
        }
      }
    }
    const snapNearest = (px, pz) => {
      let bestId = null, bestD = Infinity;
      for (const [id, p] of nodePos) {
        const dd = Math.hypot(p[0] - px, p[1] - pz);
        if (dd < bestD) { bestD = dd; bestId = id; }
      }
      return bestId;
    };
    const dijkstra = (fromId, toId) => {
      const dist = new Map([[fromId, 0]]);
      const prev = new Map();
      const pq = [[0, fromId]];
      while (pq.length) {
        pq.sort((a, b) => a[0] - b[0]);
        const [dd, u] = pq.shift();
        if (u === toId) break;
        if (dd > (dist.get(u) ?? 1e12)) continue;
        for (const e of adj.get(u) || []) {
          const nd = dd + e.len;
          if (nd < (dist.get(e.to) ?? 1e12)) { dist.set(e.to, nd); prev.set(e.to, u); pq.push([nd, e.to]); }
        }
      }
      if (!dist.has(toId)) return null;
      const path = [toId];
      let cur = toId;
      while (cur !== fromId) { cur = prev.get(cur); path.unshift(cur); }
      return path.map(id => nodePos.get(id));
    };

    const guidanceGroup = new THREE.Group();
    guidanceGroup.name = 'PBF_Autobahn_GuidanceSigns';
    let guidanceCount = 0;

    const makeDirectionSign = (text, arrow) => {
      const key = `dirsign_v2_${text}_${arrow}`;
      const tex = getOrCreateCanvasTexture(key, (ctx) => {
        ctx.fillStyle = '#00438a';
        ctx.fillRect(0, 0, 768, 384);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 14;
        ctx.strokeRect(18, 18, 732, 348);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 76px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(text.slice(0, 20), 44, 155);
        ctx.font = 'bold 52px Arial';
        ctx.fillText('Autobahn', 44, 250);
        ctx.font = 'bold 180px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(arrow, 728, 310);
      }, 768, 384);
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.4, 10), sharedMaterials.trussMetal);
      pole.position.y = 1.7;
      g.add(pole);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), getSharedTexturedMaterial(tex));
      panel.position.set(0, 3.1, 0);
      g.add(panel);
      // khung viền
      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.9, 0.04), new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.6 }));
      frame.position.set(0, 3.1, -0.02);
      g.add(frame);
      return g;
    };

    const placeSignAt = (px, pz, dirX, dirZ, text, arrow) => {
      const L = Math.hypot(dirX, dirZ) || 1;
      const rnx = -dirZ / L, rnz = dirX / L; // pháp tuyến phải của hướng chạy
      const s = makeDirectionSign(text, arrow);
      s.position.set(px + rnx * 4.4, 0, pz + rnz * 4.4);
      s.rotation.y = Math.atan2(-dirX / L, -dirZ / L); // mặt quay về xe đang tới
      guidanceGroup.add(s);
      guidanceCount++;
    };

    {
      // 🎯 Spawn node + BFS reachable set
      const startId = snapNearest(FOCUS.x, FOCUS.z);
      const reachable = new Set([startId]);
      const _q = [startId];
      while (_q.length) {
        const _u = _q.shift();
        for (const _e of (adj.get(_u) || [])) {
          if (!_reachableHas(reachable, _e.to)) { reachable.add(_e.to); _q.push(_e.to); }
        }
      }
      function _reachableHas(set, k) { return set.has(k); }
      // 🎯 Chọn Auffahrt: ramp gần nhất mà đầu-ramp CÓ NỐI vào mạng phố reachable
      // (ramp mồ côi chỉ nối mainline → target không reachable → mất toàn bộ biển)
      let endId = null;
      let aufLocalId = null;
      let bestD = Infinity;
      for (const l of links) {
        const p = l.centerline[0];
        const localId = snapNearest(p[0], p[1]);
        if (!localId || !reachable.has(localId)) continue;
        const lp = nodePos.get(localId);
        const dLocal = Math.hypot(lp[0] - p[0], lp[1] - p[1]);
        if (dLocal > 80) continue;
        const dd = Math.hypot(p[0] - FOCUS.x, p[1] - FOCUS.z);
        if (dd < bestD) { bestD = dd; endId = localId; aufLocalId = localId; }
      }
      // destination của ramp được chọn
      let aufDest = 'Bielefeld';
      for (const l of links) {
        const dd = Math.hypot(l.centerline[0][0] - (nodePos.get(endId) || [0, 0])[0],
                              l.centerline[0][1] - (nodePos.get(endId) || [0, 0])[1]);
        if (dd < 60 && l.destination) { aufDest = l.destination.split(';')[0].trim(); break; }
      }
      const path = startId && endId ? dijkstra(startId, endId) : null;
      if (path && path.length >= 3) {
        // Đi dọc path: tại node có rẽ > 25° → biển arrow; đoạn ≥ 450m → biển thẳng
        const destText = `A 2 ${aufDest}`;
        let prevDir = null;
        let lastSignS = 0;
        let distAcc = 0;
        for (let i = 1; i < path.length; i++) {
          const p0 = path[i - 1], p1 = path[i];
          const segL = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
          distAcc += segL;
          const dirX = (p1[0] - p0[0]) / (segL || 1);
          const dirZ = (p1[1] - p0[1]) / (segL || 1);
          if (prevDir) {
            const cross = prevDir.x * dirZ - prevDir.z * dirX;
            const dot = prevDir.x * dirX + prevDir.z * dirZ;
            const turnDeg = Math.abs(Math.atan2(cross, dot)) * 180 / Math.PI;
            if (turnDeg > 25) {
              const arrow = cross > 0 ? '→' : '←';
              placeSignAt(p0[0], p0[1], prevDir.x, prevDir.z, destText, arrow);
              lastSignS = distAcc;
            } else if (distAcc - lastSignS >= 250) {
              placeSignAt(p0[0], p0[1], dirX, dirZ, destText, '↑');
              lastSignS = distAcc;
            }
          }
          prevDir = { x: dirX, z: dirZ };
        }
        // Biển cuối ngay trước cửa Auffahrt
        const finalPos = nodePos.get(endId) || [FOCUS.x, FOCUS.z];
        placeSignAt(finalPos[0], finalPos[1], prevDir ? prevDir.x : 1, prevDir ? prevDir.z : 0, `A 2 ${aufDest}`, '↗');
        console.log(`[AutobahnDistrict] 🧭 ${guidanceCount} direction signs along route to Auffahrt (${aufDest})`);
      }
    }

    // Ortstafel "Rhynern" + Z.274 50 tại cửa thị trấn (cạnh spawn)
    {
      const townSign = makeDirectionSign('Rhynern', '⊖');
      townSign.position.set(FOCUS.x + 8, 0, FOCUS.z - 6);
      townSign.rotation.y = Math.PI * 0.75;
      guidanceGroup.add(townSign);
      const z50 = makeGermanStVOSign('SPEED_LIMIT', 50);
      if (z50) {
        z50.position.set(FOCUS.x + 10.5, 0, FOCUS.z - 8.5);
        z50.rotation.y = Math.PI * 0.75;
        guidanceGroup.add(z50);
      }
      guidanceCount += 2;
    }

    scenery.add(guidanceGroup);
  }
  let totalSignCount = 0;

  if (Array.isArray(roadGraphData?.roads)) {
    const motorways = roadGraphData.roads.filter(r => ['motorway', 'trunk'].includes(r.highway));
    const motorwayLinks = roadGraphData.roads.filter(r => r.highway === 'motorway_link');

    // 1. Giàn biển hiệu trên cao (Schilderbrücke) mỗi ~700m trên trục chính Autobahn
    const GANTRY_INTERVAL = 700; // Place overhead gantries every ~700m
    let gantryAcc = GANTRY_INTERVAL; // Trigger initial gantry near network start

    // 🪧 GANTRY: node order way OSM oneway = HƯỚNG LƯU THÔNG thật. Mặt biển quay
    // NGƯỢC chiều chạy (rotY = atan2(-dx,-dz)) — trước đây quay theo chiều node →
    // driver nhìn thấy mặt lưng (chữ mirror). Destination lấy từ tag `destination`
    // của ramp motorway_link PHÍA TRƯỚC theo chiều chạy (≤ 2km).
    motorways.forEach((r) => {
      const cl = r.centerline;
      if (!cl || cl.length < 2) return;
      // Chiều dài theo POLYLINE thật (fragment cong): đi từng đoạn, không nội suy
      // đường thẳng 2 endpoint — trước đây gantry lệch khỏi đường 11-26m trên khúc cua.
      const segLens = [];
      let total = 0;
      for (let i = 0; i < cl.length - 1; i++) {
        const L = Math.hypot(cl[i + 1][0] - cl[i][0], cl[i + 1][1] - cl[i][1]);
        segLens.push(L);
        total += L;
      }
      if (total < 1) return;

      gantryAcc += total;

      while (gantryAcc >= GANTRY_INTERVAL) {
        gantryAcc -= GANTRY_INTERVAL;
        const target = total - gantryAcc;
        let acc2 = 0, gx = cl[0][0], gz = cl[0][1], ux = 0, uz = 1;
        for (let i = 0; i < cl.length - 1; i++) {
          if (acc2 + segLens[i] >= target) {
            const t = (target - acc2) / (segLens[i] || 1);
            gx = cl[i][0] + (cl[i + 1][0] - cl[i][0]) * t;
            gz = cl[i][1] + (cl[i + 1][1] - cl[i][1]) * t;
            ux = (cl[i + 1][0] - cl[i][0]) / (segLens[i] || 1);
            uz = (cl[i + 1][1] - cl[i][1]) / (segLens[i] || 1);
            break;
          }
          acc2 += segLens[i];
        }
        const rotY = Math.atan2(-ux, -uz);

        let textMain = 'A 2 Hannover / Dortmund';
        let textSub = 'Richtgeschwindigkeit 130 km/h · Rechtsfahrgebot';
        let bestExit = null;
        let bestExitD = Infinity;
        for (const link of motorwayLinks) {
          if (!link.destination || !link.centerline || link.centerline.length < 2) continue;
          const ex = link.centerline[link.centerline.length - 1][0] - gx;
          const ez = link.centerline[link.centerline.length - 1][1] - gz;
          const distE = Math.hypot(ex, ez);
          if (distE > 2000 || distE < 5) continue;
          if ((ex / distE) * ux + (ez / distE) * uz < 0.4) continue;
          if (distE < bestExitD) { bestExitD = distE; bestExit = link; }
        }
        if (bestExit) {
          textMain = 'A 2 ' + bestExit.destination.split(';')[0].trim();
          textSub = 'Ausfahrt ' + Math.max(1, Math.round(bestExitD / 100) * 100) + 'm · Rechtsfahrgebot';
        }

        const gantry = createAutobahnGantry(gx, gz, rotY, textMain, textSub);
        signsGroup.add(gantry);
        totalSignCount++;
      }
    });

    // 2. Biển VZ 330.1 (Autobahn Start) tại các lối nhập làn Auffahrt / motorway_link
    const RAMP_SIGN_INTERVAL = 3; // Filter density for ramp VZ 330.1 signs to prevent visual clutter
    motorwayLinks.forEach((r, idx) => {
      if (idx % RAMP_SIGN_INTERVAL !== 0 || !r.centerline || r.centerline.length < 2) return;
      const pt1 = r.centerline[0];
      const pt2 = r.centerline[r.centerline.length - 1];
      const rx = (pt1[0] + pt2[0]) / 2;
      const rz = (pt1[1] + pt2[1]) / 2;

      const autoStartSign = makeGermanStVOSign('AUTOBAHN_START');
      if (autoStartSign) {
        // Đặt ở ĐẦU ramp (nơi xe từ phố lói vào), lệch PHẢI chiều chạy, mặt quay
        // ngược hướng chạy để người nhập làn đọc được chữ
        const rdx = pt2[0] - pt1[0];
        const rdz = pt2[1] - pt1[1];
        const rLen = Math.hypot(rdx, rdz) || 1;
        const rnx = -rdz / rLen;
        const rnz = rdx / rLen;
        autoStartSign.position.set(pt1[0] + rnx * 4.2, 0, pt1[1] + rnz * 4.2);
        autoStartSign.rotation.y = Math.atan2(-rdx / rLen, -rdz / rLen);
        signsGroup.add(autoStartSign);
        totalSignCount++;
      }
    });

    // 3. 🚧 BAUSTELLE (Công Trường 80 km/h @ km 3.7 / osm_seg_1385 section)
    const baustelleRoads = motorways.filter((r, idx) => idx % 7 === 2);
    baustelleRoads.forEach((r) => {
      if (!r.centerline || r.centerline.length < 2) return;
      const [pt1, pt2] = r.centerline;
      const bdx = pt2[0] - pt1[0];
      const bdz = pt2[1] - pt1[1];
      const bLen = Math.hypot(bdx, bdz) || 1;
      const bx = (pt1[0] + pt2[0]) / 2;
      const bz = (pt1[1] + pt2[1]) / 2;
      // Mặt biển quay NGƯỢC chiều chạy + đứng bên PHẢI lề xe đang tới
      const rotY = Math.atan2(-bdx / bLen, -bdz / bLen);
      const rnx = -bdz / bLen;
      const rnz = bdx / bLen;
      const fx = bdx / bLen, fz = bdz / bLen;

      const bauSign = makeGermanStVOSign('BAUSTELLE');
      if (bauSign) {
        bauSign.position.set(bx + rnx * 12.0 - fx * 20.0, 0, bz + rnz * 12.0 - fz * 20.0);
        bauSign.rotation.y = rotY;
        signsGroup.add(bauSign);
        totalSignCount++;
      }
      const limit80 = makeGermanStVOSign('SPEED_LIMIT', 80);
      if (limit80) {
        limit80.position.set(bx + rnx * 12.0 + fx * 20.0, 0, bz + rnz * 12.0 + fz * 20.0);
        limit80.rotation.y = rotY;
        signsGroup.add(limit80);
        totalSignCount++;
      }

      // Baustellenbaken dọc LỀ PHẢI công trường
      const bakeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      for (let offsetAlong = -30; offsetAlong <= 30; offsetAlong += 6) {
        const bake = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.1), bakeMat);
        bake.position.set(bx + rnx * 6.5 + fx * offsetAlong, 0.55, bz + rnz * 6.5 + fz * offsetAlong);
        bake.rotation.y = Math.atan2(fx, fz);
        signsGroup.add(bake);
      }
    });

    // 4. 🧱 LÄRMSCHUTZWAND (Tường Chống Ồn Ven Cao Tốc)
    const noiseWallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7, metalness: 0.2 });
    motorways.slice(0, 8).forEach((r) => {
      if (!r.centerline || r.centerline.length < 2) return;
      const [pt1, pt2] = r.centerline;
      const wx = (pt1[0] + pt2[0]) / 2;
      const wz = (pt1[1] + pt2[1]) / 2;
      const dx = pt2[0] - pt1[0];
      const dz = pt2[1] - pt1[1];
      const len = Math.hypot(dx, dz);
      if (len < 10) return;

      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.5, len), noiseWallMat);
      wall.position.set(wx - 16.5, 2.25, wz);
      wall.rotation.y = Math.atan2(dx, dz);
      scenery.add(wall);
    });

    // 5. 🌉 BRÜCKE / ÜBERFÜHRUNG (Cầu Vượt Bằng Bê Tông Qua Cao Tốc)
    const bridgeRoads = motorways.filter((r, idx) => idx % 9 === 4);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });

    bridgeRoads.forEach((r) => {
      if (!r.centerline || r.centerline.length < 2) return;
      const [pt1, pt2] = r.centerline;
      const brX = (pt1[0] + pt2[0]) / 2;
      const brZ = (pt1[1] + pt2[1]) / 2;
      const rotY = Math.atan2(pt2[0] - pt1[0], pt2[1] - pt1[1]);

      // Xà cầu vượt đúc bê tông ở độ cao 6.2m
      const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(45.0, 1.2, 8.5), bridgeMat);
      bridgeDeck.position.set(brX, 6.2, brZ);
      bridgeDeck.rotation.y = rotY + Math.PI / 2;
      bridgeDeck.castShadow = true;
      scenery.add(bridgeDeck);

      // Trụ đỡ hai bên
      [-20.0, 20.0].forEach(px => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 6.2, 12), pillarMat);
        pillar.position.set(brX + px * Math.cos(rotY), 3.1, brZ + px * Math.sin(rotY));
        scenery.add(pillar);
      });
    });
  }

  scenery.add(signsGroup);
  console.log(`[AutobahnDistrict] 🛣️ Rendered ${totalSignCount} Autobahn Signs, Gantries, Baustellen & Bridges`);

  // 🌲 Rừng thông & lá rộng viền hai bên cao tốc (Waldrand) — có kiểm tra khoảng cách mặt đường
  const isNearRoad = buildRoadClearanceIndex(roadGraphData);
  const treeCount = buildAutobahnVegetation(scenery, roadGraphData, isNearRoad);
  console.log(`[AutobahnDistrict] 🌲 Planted ${treeCount} trees along the A2 corridors`);

  // 🌤️ Vòng đồi xa + rừng instanced dày đặc
  const skyline = buildAutobahnSkyline(scene, scenery, roadGraphData, isNearRoad);
  console.log(`[AutobahnDistrict] 🌤️ Skyline ready: ${skyline.trees} instanced forest trees + hills`);

  const bounds = roadGraphData?.metadata?.bounds;
  if (
    bounds &&
    Number.isFinite(bounds.minX) &&
    Number.isFinite(bounds.maxX) &&
    Number.isFinite(bounds.minZ) &&
    Number.isFinite(bounds.maxZ) &&
    Array.isArray(colliders)
  ) {
    // High-speed motorway boundary penalty (25 km/h equivalent deduction or custom config penalty)
    const boundaryPenalty = config?.boundaryPenalty ?? 25;
    colliders.push({
      id: 'osm_pbf_autobahn_boundary',
      type: 'fence',
      shape: 'boundary',
      minX: bounds.minX - 200,
      maxX: bounds.maxX + 200,
      minZ: bounds.minZ - 200,
      maxZ: bounds.maxZ + 200,
      gateMinX: 0,
      gateMaxX: 0,
      penalty: boundaryPenalty,
      messageVi: 'Đâm vào ranh giới cao tốc Autobahn A2 (Hamm/Rhynern)! Vui lòng quay đầu xe.',
      messageDe: 'Kollision mit der Grenze der Autobahn A2!'
    });
  }

  const mapInfo = {
    source: 'OSM_PBF_AUTOBAHN',
    roadCount: Array.isArray(roadGraphData?.roads) ? roadGraphData.roads.length : 0,
    junctionCount: Array.isArray(roadGraphData?.junctions) ? roadGraphData.junctions.length : 0,
    signCount: totalSignCount,
    bounds: bounds ?? null
  };

  scenery.userData.mapInfo = mapInfo;
  if (scene) scene.userData.mapInfo = mapInfo;

  return roadGen;
}

