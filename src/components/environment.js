import * as THREE from 'three';
import {
  createBuildingFacadeTexture,
  createPbrRoadMaterial,
  createPbrGrassMaterial,
  createBikeLaneMaterial,
  createSidewalkMaterial,
  createCobblestoneMaterial,
  ensureUV2
} from './textures.js';
import { makeTrafficLight, createTrafficAICar } from './3dObjects.js';
import { buildBerlinMitteDistrict } from './berlinMitteDistrict.js';
import { buildLandstrasseDistrict } from './landstrasseDistrict.js';
import { buildAutobahnDistrict } from './autobahnDistrict.js';
import { buildSaHinhWorld } from './saHinhWorld.js';

// 🧩 Caches + prop factories đã tách sang streetProps.js — re-export giữ tương thích
export * from './streetProps.js';
import {
  canvasTextureCache, getOrCreateCanvasTexture, getSharedTexturedMaterial,
  sharedMaterials, getOrCreateWallMaterial, getOrCreateAwningMaterial,
  makeGermanStVOSign, createFinishArch, createAutobahnGantry,
  createControlCenterBuilding, createCornerPole, createEntranceGate,
  createFloodlightTower, createHillRamp, createLeitpfosten, createParkedDummyCar,
  createParkingMarkings, createPineTree, createRoadArrow, createSaHinhBanner,
  createSharkTeethYield, createTireWall, createTotemSign, createTrafficCone,
  createZebraCrosswalk
} from './streetProps.js';

export function buildCityWorld(scene, mapType = 'stadt_zentrum', options = {}) {
  const isPerformance = !!options.isPerformance;
  const mapConfigs = {
    // 🏙️ 1. STADT (Thành phố: 50 km/h)
    stadt_zentrum: {
      roadWidth: 16,
      roadLength: 1000,
      roadZ: -100,
      grassWidth: 650,
      hasIntersections: true,
      intersectionSpacing: 100,
      buildingDensity: 0.5,
      treeDensity: 0.25,
      hasAutobahn: false,
      maxSpeedLimit: 50,
      buildingHeight: 22,
      roadColor: 0x111827,
      grassColor: 0x166534, // Cỏ xanh tự nhiên Đức
      skyColor: 0x38bdf8,
      playerSpawn: { x: 2.5, z: 25.0, rotation: 0 },
      aiSpawns: [
        { x: -66.0, z: -50, speed: 40, isOpposite: true },
        { x: -74.0, z: -90, speed: 45, isOpposite: false },
        { x: -66.0, z: -140, speed: 45, isOpposite: true }
      ]
    },
    // 🛣️ 2. AUTOBAHN A2 (Cao tốc: 130 km/h)
    autobahn_a9: {
      roadWidth: 36,
      roadLength: 5000,
      roadZ: -2300,
      grassWidth: 800,
      hasIntersections: false,
      intersectionSpacing: 0,
      buildingDensity: 0.0,
      treeDensity: 0.2,
      hasAutobahn: true,
      maxSpeedLimit: 130,
      buildingHeight: 0,
      roadColor: 0x0f172a,
      grassColor: 0x1e293b,
      skyColor: 0x0284c7,
      // 🏘️ Spawn trong phố Rhynern (Werler Straße) — route vòng: phố → Auffahrt → A2
      // → U-turn cuối A2 → Ausfahrt → về phố (khớp road_graph_autobahn.json + maps.js)
      playerSpawn: { x: -396, z: 895, rotation: 157 },
      aiSpawns: [
        { x: 12.0, z: -100, speed: 140, isOpposite: false },
        { x: 6.0, z: -250, speed: 110, isOpposite: false },
        { x: -6.0, z: -400, speed: 120, isOpposite: true },
        { x: -12.0, z: -600, speed: 150, isOpposite: true }
      ]
    },
    // 🌲 3. AUF DEM LAND (Nông thôn / Landstraße: 100 km/h)
    landstrasse_b2: {
      roadWidth: 8,
      roadLength: 2500,
      roadZ: -1100,
      grassWidth: 600,
      hasIntersections: true,
      intersectionSpacing: 300,
      buildingDensity: 0.04,
      treeDensity: 0.9,
      hasAutobahn: false,
      maxSpeedLimit: 100,
      buildingHeight: 8,
      roadColor: 0x1f2937,
      grassColor: 0x15803d, // Cỏ xanh mướt nổi bật
      skyColor: 0x7dd3fc,
      playerSpawn: { x: 2.0, z: 0 }
    },
    // 🌲 3.5 LANDSTRASSE WALD (Đường Rừng Ngoài Đô Thị Đức: 100 km/h)
    landstrasse_wald: {
      roadWidth: 9,
      roadLength: 2600,
      roadZ: -1200,
      grassWidth: 700,
      hasIntersections: true,
      intersectionSpacing: 450,
      buildingDensity: 0.01,
      treeDensity: 0.95,
      hasAutobahn: false,
      maxSpeedLimit: 100,
      buildingHeight: 6,
      roadColor: 0x1f2937,
      grassColor: 0x14532d, // Rừng thông Đức xanh sẫm
      skyColor: 0x38bdf8,
      playerSpawn: { x: 2.25, z: 0 },
      aiSpawns: [
        { x: 2.25, z: -180, speed: 85, isOpposite: false },
        { x: -2.25, z: -350, speed: 90, isOpposite: true },
        { x: -2.25, z: -700, speed: 95, isOpposite: true }
      ]
    },
    // 🏎️ 4. SA HÌNH HỌC LÁI XE 3D (Fahrschule Training Ground - Sân Tập Bãi Lớn Đa Mô Hình)
    sa_hinh_fahrschule: {
      roadWidth: 240, // Khoảng sân bãi rộng lớn 240m
      roadLength: 1200, // Chiều dài 1200m trải dài từ Z = +250 đến Z = -950 (gương chiếu hậu soi rõ mặt đường phía sau)
      roadZ: -350, // Tâm sân tại Z = -350
      grassWidth: 600,
      hasIntersections: false,
      buildingDensity: 0.0,
      treeDensity: 0.1,
      hasAutobahn: false,
      maxSpeedLimit: 60, // Mở khóa tốc độ 60 km/h (hết bị giới hạn 30)
      buildingHeight: 0,
      roadColor: 0x1e293b,
      grassColor: 0x15803d,
      skyColor: 0x38bdf8,
      playerSpawn: { x: 3.5, z: 0 },
      aiSpawns: []
    }
  };

  if (mapType === 'autobahn_a' || mapType === 'AUTOBAHN' || mapType === 'autobahn') mapType = 'autobahn_a9';
  if (mapType === 'STADT' || mapType === 'stadt') mapType = 'stadt_zentrum';
  if (mapType === 'SA_HINH' || mapType === 'sa_hinh') mapType = 'sa_hinh_fahrschule';

  const config = mapConfigs[mapType]
    // 🎓 training_circuit không có entry riêng ở trên — phải trả config có graphSource
    // để autobahnDistrict dựng graph training + GLB training_circuit.glb (không phải autobahn);
    // playerSpawn phải khớp maps.js (environment return playerSpawnPos: config.playerSpawn)
    || (mapType === 'training_circuit'
      ? { roadWidth: 12, roadLength: 1600, graphSource: 'training', playerSpawn: { x: -400, z: 185, rotation: 180 } }
      : mapConfigs.stadt_zentrum);

  // Material nhựa đường PBR chân thực từ bộ texture Poly Haven (Tỉ lệ thực tế: 2m x 2m / tile)
  const roadMat = createPbrRoadMaterial({
    repeatX: Math.max(1, Math.round(config.roadWidth / 2.0)),
    repeatZ: Math.round(config.roadLength / 2.0),
    roughness: mapType === 'autobahn_a9' ? 0.35 : 0.82,
    metalness: mapType === 'autobahn_a9' ? 0.15 : 0.05
  });

  const isPbfMap = mapType === 'stadt_zentrum' || mapType === 'landstrasse_b2' || mapType === 'autobahn_a9' || mapType === 'training_circuit';
  const isStadtZentrum = isPbfMap;
  const grassLength = mapType === 'sa_hinh_fahrschule' ? 1500 : (isPbfMap ? 8000 : config.roadLength);
  const grassWidth = isPbfMap ? 4000 : config.grassWidth;
  const grassMat = createPbrGrassMaterial({
    repeatX: Math.round(grassWidth / 4.0),
    repeatZ: Math.round(grassLength / 4.0),
    // Autobahn: tint xanh đồng cỏ ấm (giống ảnh chụp NRW) đỡ xỉn tối; map khác giữ màu gốc
    color: mapType === 'autobahn_a9' ? 0xa8c884 : 0xffffff
  });

  const swMat = createSidewalkMaterial({
    repeatX: 2,
    repeatZ: Math.round(config.roadLength / 2.0)
  });
  const colliders = [];
  const saHinhRamps = []; // Dốc đề-pa sa hình (hill-start) — DrivingSimulation đọc qua refs._ramps
  const scenery = new THREE.Group();

  // 1. Mặt đường với kênh uv2 cho Ambient Occlusion chân thực (cho Sa hình hoặc synthetic test maps)
  if (!isPbfMap) {
    const roadGeo = new THREE.PlaneGeometry(config.roadWidth, config.roadLength);
    ensureUV2(roadGeo);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = config.roadZ;
    road.receiveShadow = true;
    scenery.add(road);
  }

  // 2. Mặt cỏ với kênh uv2 cho Ambient Occlusion chân thực (bao phủ rộng lớn khu vực OSM PBF 4x4 km)
  const isAutobahnGrass = mapType === 'autobahn_a9' || mapType === 'autobahn_a' || mapType === 'AUTOBAHN' || (mapType || '').toLowerCase().includes('autobahn');
  const grassL = isAutobahnGrass ? 14000 : (isPbfMap ? 4000 : (mapType === 'sa_hinh_fahrschule' ? 1500 : config.roadLength));
  const grassW = isAutobahnGrass ? 14000 : (isPbfMap ? 4000 : config.grassWidth);
  const grassZ = isPbfMap ? 0 : config.roadZ;
  const grassGeo = new THREE.PlaneGeometry(grassW, grassL);
  ensureUV2(grassGeo);
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.name = 'PBF_GroundPlane'; // đặt tên để Blender-GLB overlay KHÔNG ẩn mặt đất
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(0, -0.01, grassZ);
  grass.receiveShadow = true;
  scenery.add(grass);

  if (isPbfMap) {
    scene.background = new THREE.Color(0x87ceeb);
    // Fog kết thúc trước camera.far (1500m) để nhà cửa tan dần vào sương thay vì bị cắt cụt đột ngột
    scene.fog = new THREE.Fog(0xbcd7ea, 380, 1380);
  } else {
    if (!scene.getObjectByName('physicalSky')) {
      scene.background = new THREE.Color(config.skyColor || 0x38bdf8);
    }
    scene.fog = new THREE.FogExp2(0x8faec2, 0.0007);
  }

  // ── ĐẶC THÙ MỖI MAP ───────────────────────────────────────────────
  if (!isPbfMap && config.hasAutobahn) {
    // AUTOBAHN SYNTHETIC: Dải phân cách với Hộ lan kim loại đôi (Doppelte Leitplanke)
    const guardrailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.25 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });

    // Dải phân cách giữa với cỏ/sỏi (Mittelstreifen)
    const medianStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, config.roadLength),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 })
    );
    medianStrip.rotation.x = -Math.PI / 2;
    medianStrip.position.set(0, 0.012, config.roadZ);
    scenery.add(medianStrip);

    // Cột chữ I đỡ hộ lan mỗi 6m
    for (let pz = config.roadZ + config.roadLength / 2; pz >= config.roadZ - config.roadLength / 2; pz -= 6) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), postMat);
      post.position.set(0, 0.38, pz);
      scenery.add(post);
    }

    // 2 thanh lượn sóng thép W-Beam kép ở 2 bên dải phân cách
    [-0.55, 0.55].forEach(rx => {
      const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, config.roadLength), guardrailMat);
      railTop.position.set(rx, 0.55, config.roadZ);
      railTop.castShadow = true;
      scenery.add(railTop);
    });

    // Hộ lan lề ngoài cùng hai bên (Seitenleitplanke)
    [-17.8, 17.8].forEach(xRail => {
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, config.roadLength), guardrailMat);
      sideRail.position.set(xRail, 0.55, config.roadZ);
      sideRail.castShadow = true;
      scenery.add(sideRail);
    });

    // Vạch xương cá Sperrfläche tại điểm nhập cao tốc (như ảnh auffahren_autobahn1.jpg)
    const hatchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let hz = 20; hz >= -120; hz -= 6) {
      const hatch = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.4), hatchMat);
      hatch.rotation.x = -Math.PI / 2;
      hatch.rotation.z = Math.PI / 4;
      hatch.position.set(9.0, 0.025, hz);
      scenery.add(hatch);
    }

    // ── VẠCH KẺ ĐƯỜNG AUTOBAHN STVO (LANE MARKINGS) ──
    // 1. Vạch liền mép dải phân cách giữa (x = ±1.4) và mép làn dừng khẩn cấp Standstreifen (x = ±14.5)
    const solidLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-14.5, -1.4, 1.4, 14.5].forEach(lx => {
      const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(0.28, config.roadLength), solidLineMat);
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(lx, 0.018, config.roadZ);
      edgeLine.receiveShadow = true;
      scenery.add(edgeLine);
    });

    // 2. Vạch đứt phân làn StVO Leitlinie (chu kỳ 12m: vạch trắng 6m, ngắt 6m)
    const dashCanvas = document.createElement('canvas');
    dashCanvas.width = 16;
    dashCanvas.height = 64;
    const dCtx = dashCanvas.getContext('2d');
    if (dCtx) {
      dCtx.clearRect(0, 0, 16, 64);
      dCtx.fillStyle = '#ffffff';
      dCtx.fillRect(0, 0, 16, 32);
    }
    const dashTex = new THREE.CanvasTexture(dashCanvas);
    dashTex.wrapS = THREE.RepeatWrapping;
    dashTex.wrapT = THREE.RepeatWrapping;
    dashTex.repeat.set(1, Math.round(config.roadLength / 12));
    const dashLineMat = new THREE.MeshBasicMaterial({
      map: dashTex,
      transparent: true,
      alphaTest: 0.5,
      depthWrite: false
    });

    [-10.0, -5.5, 5.5, 10.0].forEach(dx => {
      const dashMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.25, config.roadLength), dashLineMat);
      dashMesh.rotation.x = -Math.PI / 2;
      dashMesh.position.set(dx, 0.02, config.roadZ);
      dashMesh.receiveShadow = true;
      scenery.add(dashMesh);
    });
  }

  if (!isPbfMap && mapType === 'landstrasse_b2') {
    // LANDSTRAßE: Cột mốc Leitpfosten phản quang Đức 2 bên đường
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const capMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const reflectorMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });

    for (let z = config.roadZ; z > config.roadZ - config.roadLength; z -= 35) {
      [-4.5, 4.5].forEach(x => {
        const postGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.08), postMat);
        body.position.y = 0.5;
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.2, 0.09), capMat);
        cap.position.y = 0.9;
        const ref = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.25), reflectorMat);
        ref.position.set(0, 0.65, 0.05);

        postGroup.add(body); postGroup.add(cap); postGroup.add(ref);
        postGroup.position.set(x, 0, z);
        scenery.add(postGroup);
      });
    }
  }

  // ── BIỂN BÁO & CẢNH QUAN ──────────────────────────────────────────

  if (!isPbfMap && config.hasAutobahn) {
    [
      { z: -250, main: 'München · Nürnberg · Berlin', sub: 'Richtgeschwindigkeit 130 km/h · Rechtsfahrgebot' },
      { z: -1000, main: 'Ausfahrt 1000m · Raststätte Frankenwald', sub: 'Tankstelle · WC · Restaurant 24h' },
      { z: -2000, main: 'Rettungsgasse bilden!', sub: 'Bei Stau: Gasse zwischen linker und mittlerer Spur' },
      { z: -3200, main: 'Ausfahrt 500m · Gewerbegebiet Süd', sub: 'Rechts einordnen · Blinker rechts' },
      { z: -4500, main: 'Autobahnende 500m', sub: 'Geschwindigkeit auf 80 km/h reduzieren' }
    ].forEach(g => {
      scenery.add(createAutobahnGantry(g.z, g.main, g.sub));
    });
  }

  const crossStreetZ = (!isPbfMap && mapType === 'stadt_zentrum') ? [-200, -510, -880] : [];
  if (!isPbfMap && config.hasIntersections && mapType !== 'stadt_zentrum') {
    for (let zVal = -80; zVal >= -config.roadLength + 200; zVal -= config.intersectionSpacing) {
      crossStreetZ.push(zVal);
    }
  }

  if (!isPbfMap && mapType !== 'stadt_zentrum') {
    crossStreetZ.forEach((zCross, idx) => {
      // Ngã tư
      const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(120, 16), roadMat);
      crossRoad.rotation.x = -Math.PI / 2;
      crossRoad.position.set(0, 0.025, zCross);
      scenery.add(crossRoad);

      // Cắm biển báo StVO chuẩn sắc nét
      const speedSign = makeGermanStVOSign('SPEED_LIMIT', config.maxSpeedLimit);
      speedSign.position.set(config.roadWidth / 2 + 1.2, 0, zCross + 15);
      scenery.add(speedSign);

      if (idx % 2 === 0) {
        const stopSign = makeGermanStVOSign('STOP_SIGN');
        stopSign.position.set(config.roadWidth / 2 + 1.2, 0, zCross + 8);
        scenery.add(stopSign);
      } else {
        const yieldSign = makeGermanStVOSign('YIELD');
        yieldSign.position.set(config.roadWidth / 2 + 1.2, 0, zCross + 8);
        scenery.add(yieldSign);
      }
    });
  }

  // Cây cối & Tòa nhà cho các bản đồ tổng hợp Synthetic
  if (!isPbfMap) {
    const trunkM = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
    const leafM1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const leafM2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });

    const buildingPalette = [0xf1f5f9, 0xe2e8f0, 0xcbd5e1, 0x94a3b8, 0xd1d5db];
    const bMats = buildingPalette.map((col, idx) => new THREE.MeshStandardMaterial({
      map: createBuildingFacadeTexture(col, idx),
      roughness: 0.5, metalness: 0.1
    }));

    const STEP = 12;
    const numSteps = Math.floor(config.roadLength / STEP);
    for (let i = 0; i < numSteps; i++) {
      const z = config.roadZ - i * STEP;
      const isAtIntersection = crossStreetZ.some(cz => Math.abs(cz - z) < 14);

      if (Math.random() < config.treeDensity && !isAtIntersection) {
        const treeXOffset = config.roadWidth / 2 + (mapType === 'landstrasse_b2' ? 2.0 : 4.0);
        [-treeXOffset, treeXOffset].forEach(x => {
          const g = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.0, 8), trunkM);
          trunk.position.y = 1.5; trunk.castShadow = true;
          const f1 = new THREE.Mesh(new THREE.SphereGeometry(2.0, 8, 8), leafM1);
          f1.position.y = 3.8; f1.castShadow = true;
          const f2 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 6, 6), leafM2);
          f2.position.set(0.3, 4.5, -0.2); f2.castShadow = true;
          g.add(trunk); g.add(f1); g.add(f2);
          g.position.set(x, 0, z);
          scenery.add(g);
        });
      }

      if (Math.random() < config.buildingDensity && !isAtIntersection) {
        const h = config.buildingHeight + (i % 5) * 4;
        const bXOffset = config.roadWidth / 2 + 10;
        [-bXOffset, bXOffset].forEach(x => {
          const b = new THREE.Mesh(new THREE.BoxGeometry(18, h, 24), bMats[i % bMats.length]);
          b.position.set(x, h / 2, z);
          b.castShadow = true; b.receiveShadow = true;
          scenery.add(b);
        });
      }
    }
  }

  // 🏙️ PHÁT TRIỂN BẢN ĐỒ ĐỨC CHUẨN STVO TỪ PBF (STADT, LANDSTRASSE, AUTOBAHN)
  if (isPbfMap) {
    if (mapType === 'autobahn_a9' || mapType === 'autobahn' || mapType === 'training_circuit' || (mapType || '').toLowerCase().includes('training')) {
      buildAutobahnDistrict(scene, scenery, colliders, sharedMaterials, isPerformance, config);
    } else if (mapType === 'landstrasse_b2' || mapType === 'land') {
      buildLandstrasseDistrict(scene, scenery, colliders, sharedMaterials, isPerformance, config);
    } else {
      buildBerlinMitteDistrict(scene, scenery, colliders, sharedMaterials, isPerformance, config, mapType);
    }

    // 🌲 Map Landstrasse: đồ đường OSM nằm lệch xa gốc (bounds ±6km) trong khi mặt cỏ 4x4km
    // đặt tại (0,0) → người chơi đứng giữa "tuyệt địa" trắng toát. Co giãn + dịch mặt cỏ
    // theo bounds thật của đồ đường sau khi district đã nạp xong.
    const pbfBounds = scene.userData.roadGraphData?.metadata?.bounds;
    if (pbfBounds && Number.isFinite(pbfBounds.minX) && Number.isFinite(pbfBounds.minZ)) {
      const spanX = pbfBounds.maxX - pbfBounds.minX;
      const spanZ = pbfBounds.maxZ - pbfBounds.minZ;
      if (spanX > 4200 || spanZ > 4200) {
        const gw = spanX + 3000;
        const gl = spanZ + 3000;
        grass.geometry.dispose();
        grass.geometry = new THREE.PlaneGeometry(gw, gl);
        grass.position.set((pbfBounds.minX + pbfBounds.maxX) / 2, -0.01, (pbfBounds.minZ + pbfBounds.maxZ) / 2);
        grass.material = createPbrGrassMaterial({
          repeatX: Math.max(1, Math.round(gw / 4.0)),
          repeatZ: Math.max(1, Math.round(gl / 4.0)),
          color: mapType === 'autobahn_a9' ? 0xa8c884 : 0xffffff
        });
      }
    }
  }

  // 🏎️ Khu sa hình — tách sang saHinhWorld.js (phase B2)
  if (mapType === 'sa_hinh_fahrschule') {
    buildSaHinhWorld(scene, scenery, colliders, saHinhRamps, isPerformance);
  }

  if (mapType === 'landstrasse_wald') {
    // 1. Cọc tiêu phản quang Leitpfosten Z. 620 mỗi 45m dọc 2 bên lề đường
    for (let lz = 20; lz >= -2400; lz -= 45) {
      scenery.add(createLeitpfosten(-4.9, lz, 'left'));
      scenery.add(createLeitpfosten(4.9, lz, 'right'));
    }

    // 2. Hàng cây thông rừng Đức (Deutsche Waldtanne) 2 bên đường
    for (let tz = 30; tz >= -2500; tz -= 22) {
      [-12, -22, -35].forEach((ox, idx) => {
        const randScale = 0.85 + (Math.abs(tz * 7 + idx) % 5) * 0.15;
        const pTree = createPineTree(ox + (tz % 7) * 0.3, tz, randScale);
        scenery.add(pTree);
        colliders.push({
          id: `pine_L_${tz}_${idx}`,
          type: 'tree',
          shape: 'circle',
          x: ox,
          z: tz,
          radius: 0.55 * randScale,
          penalty: 25,
          messageVi: 'Đâm cây thông ven đường quốc lộ!',
          messageDe: 'Kollision mit Straßenbaum! (-25đ)'
        });
      });
      [12, 22, 35].forEach((ox, idx) => {
        const randScale = 0.85 + (Math.abs(tz * 11 + idx) % 5) * 0.15;
        const pTree = createPineTree(ox - (tz % 7) * 0.3, tz, randScale);
        scenery.add(pTree);
        colliders.push({
          id: `pine_R_${tz}_${idx}`,
          type: 'tree',
          shape: 'circle',
          x: ox,
          z: tz,
          radius: 0.55 * randScale,
          penalty: 25,
          messageVi: 'Đâm cây thông ven đường quốc lộ!',
          messageDe: 'Kollision mit Straßenbaum! (-25đ)'
        });
      });
    }

    // 3. Biển báo StVO đường trường
    // Z = -100: Tốc độ 100 km/h ngoài đô thị
    const s100 = makeGermanStVOSign('SPEED_LIMIT', 100);
    s100.position.set(5.5, 0, -100);
    scenery.add(s100);

    // Z = -240: Cảnh báo khúc cua nguy hiểm (Z. 103)
    const curveSign1 = makeGermanStVOSign('KURVE');
    curveSign1.position.set(5.5, 0, -240);
    scenery.add(curveSign1);

    // Z = -320: Tốc độ 70 km/h trước khúc cua
    const s70 = makeGermanStVOSign('SPEED_LIMIT', 70);
    s70.position.set(5.5, 0, -320);
    scenery.add(s70);

    // Z = -500: Tốc độ 80 km/h
    const s80 = makeGermanStVOSign('SPEED_LIMIT', 80);
    s80.position.set(5.5, 0, -500);
    scenery.add(s80);

    // Z = -840: Cảnh báo động vật hoang dã Wildwechsel (Z. 142)
    const wildSign1 = makeGermanStVOSign('WILDWECHSEL');
    wildSign1.position.set(5.5, 0, -840);
    scenery.add(wildSign1);

    // Z = -980: Mô hình nai rừng đứng mép bìa rừng
    const deerGroup = new THREE.Group();
    const deerMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    const deerBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 1.4), deerMat);
    deerBody.position.y = 1.0;
    const deerNeck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), deerMat);
    deerNeck.position.set(0, 1.5, -0.5);
    const deerHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.45), deerMat);
    deerHead.position.set(0, 1.8, -0.7);
    deerGroup.add(deerBody); deerGroup.add(deerNeck); deerGroup.add(deerHead);
    deerGroup.position.set(7.5, 0, -980);
    scenery.add(deerGroup);

    // Z = -1420: Cảnh báo công trường Baustelle (Z. 123)
    const bauSign = makeGermanStVOSign('BAUSTELLE');
    bauSign.position.set(5.5, 0, -1420);
    scenery.add(bauSign);

    // Cọc tiêu công trường tại Z = -1450 đến -1520
    for (let bcz = -1450; bcz >= -1520; bcz -= 12) {
      scenery.add(createTrafficCone(3.2, bcz, 1.1));
    }

    // Z = -1620: Hết mọi lệnh cấm / Trở lại 100 km/h
    const sEnd = makeGermanStVOSign('SPEED_LIMIT', 100);
    sEnd.position.set(5.5, 0, -1620);
    scenery.add(sEnd);

    // Z = -1720: Cổng vòm hoàn thành bài thi Landstraße
    scenery.add(createFinishArch(0, -1720, 14));
  }

  scene.add(scenery);

  // Tra về đầy đủ vị trí Spawn chuẩn xác & Colliders vật lý thế giới
  return {
    scenery,
    roadMat,
    crossStreetZ,
    config,
    disableSceneryMoving: true,
    playerSpawnPos: config.playerSpawn,
    aiSpawns: config.aiSpawns,
    colliders,
    ramps: saHinhRamps
  };
}

// Cây công viên dùng chung cho PARK & PROMENADE (thân + 2 tầng tán lá)
🛠️ Custom map builder tách sang customMapBuilder.js — re-export giữ tương thích
import { buildCustomMap, reloadCustomMap } from './customMapBuilder.js';
export { buildCustomMap, reloadCustomMap };
