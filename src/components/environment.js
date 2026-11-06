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

  // 🏎️ KHU SA HÌNH HỌC LÁI XE TỔNG HỢP 3D FAHRSCHULE (SÂN BÃI RỘNG LỚN ĐA MÔ HÌNH - VERKEHRSÜBUNGSPLATZ)
  if (mapType === 'sa_hinh_fahrschule') {
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const branchMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const asphaltPadMat = new THREE.MeshStandardMaterial({ color: 0x161e2e, roughness: 0.8 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });

    // ── 0. HÀNG RÀO AN TOÀN BAO QUANH CHU VI SÂN BÃI (Perimeter Fencing) ──
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3 });

    // Cổng vào có barie & bốt kiểm soát tại Cạnh Bắc
    scenery.add(createEntranceGate(0, 243));

    // Cạnh Bắc (Z = +245): chừa cổng vào tại X: -10 đến +10
    for (let fx = -116; fx <= 116; fx += 5) {
      if (Math.abs(fx) > 9) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
        post.position.set(fx, 0.7, 245);
        scenery.add(post);
      }
    }
    const railNorthL = new THREE.Mesh(new THREE.BoxGeometry(105, 0.25, 0.1), railMat);
    railNorthL.position.set(-63, 0.85, 245);
    scenery.add(railNorthL);
    const railNorthR = new THREE.Mesh(new THREE.BoxGeometry(105, 0.25, 0.1), railMat);
    railNorthR.position.set(63, 0.85, 245);
    scenery.add(railNorthR);

    // Cạnh Nam (Z = -265)
    for (let fx = -116; fx <= 116; fx += 5) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
      post.position.set(fx, 0.7, -265);
      scenery.add(post);
    }
    const railSouth = new THREE.Mesh(new THREE.BoxGeometry(232, 0.25, 0.1), railMat);
    railSouth.position.set(0, 0.85, -265);
    scenery.add(railSouth);

    // Cạnh Tây (X = -118) & Cạnh Đông (X = +118)
    for (let fz = -265; fz <= 245; fz += 6) {
      [-118, 118].forEach(fx => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), fenceMat);
        post.position.set(fx, 0.7, fz);
        scenery.add(post);
      });
    }
    const railWest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 510), railMat);
    railWest.position.set(-118, 0.85, -10);
    scenery.add(railWest);
    const railEast = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 510), railMat);
    railEast.position.set(118, 0.85, -10);
    scenery.add(railEast);

    // Đăng ký Collider Hàng Rào Chu Vi Sân Bãi
    colliders.push({
      id: 'perimeter_fences',
      type: 'fence',
      shape: 'boundary',
      minX: -116.5,
      maxX: 116.5,
      minZ: -263.5,
      maxZ: 243.5,
      gateMinX: -9.5,
      gateMaxX: 9.5,
      penalty: 25,
      messageVi: 'Đâm hàng rào an toàn ranh giới sân bãi!',
      messageDe: 'Kollision mit der Platzbegrenzung! (-25đ)'
    });

    // ── CỘT ĐÈN CAO ÁP SÂN VẬN ĐỘNG / SÂN TẬP (Stadium Floodlights) ──
    const floodlightPositions = [
      { x: -112, z: 230 }, { x: 112, z: 230 },
      { x: -112, z: 30 }, { x: 112, z: 30 },
      { x: -112, z: -100 }, { x: 112, z: -100 },
      { x: -112, z: -250 }, { x: 112, z: -250 }
    ];
    floodlightPositions.forEach((p, idx) => {
      scenery.add(createFloodlightTower(p.x, p.z));
      colliders.push({
        id: `floodlight_${idx}`,
        type: 'pole',
        shape: 'circle',
        x: p.x,
        z: p.z,
        radius: 0.85,
        penalty: 25,
        messageVi: 'Đâm cột đèn chiếu sáng sân tập!',
        messageDe: 'Kollision mit Flutlichtmast! (-25đ)'
      });
    });

    // ── TÒA NHÀ TRUNG TÂM ĐIỀU HÀNH & SÁT HẠCH LÁI XE (Prüfungszentrum) ──
    scenery.add(createControlCenterBuilding(82, 10, 22, 14, 10));
    colliders.push({
      id: 'building_control_center',
      type: 'building',
      shape: 'box',
      x: 82,
      z: 10,
      minX: 82 - 11.5,
      maxX: 82 + 11.5,
      minZ: 10 - 7.5,
      maxZ: 10 + 7.5,
      penalty: 30,
      messageVi: 'Va chạm tòa nhà trung tâm điều hành sát hạch!',
      messageDe: 'Kollision mit Prüfungszentrum! (-30đ)'
    });

    // Cây xanh cảnh quan xung quanh sân
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 });
    const addDecoTree = (tx, tz) => {
      const tg = new THREE.Group();
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 3.5, 7), treeTrunkMat);
      tr.position.y = 1.75;
      const fol = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), treeLeavesMat);
      fol.position.y = 4.2;
      tg.add(tr); tg.add(fol);
      tg.position.set(tx, 0, tz);
      scenery.add(tg);
    };
    [-126, 126].forEach(tx => {
      for (let tz = -250; tz <= 230; tz += 35) {
        addDecoTree(tx, tz);
      }
    });

    // Cảnh quan phía sau vạch xuất phát (Z = +20 đến +240) để gương chiếu hậu soi thấy mặt đường và cây cối
    const rearDecoStep = isPerformance ? 44 : 22;
    for (let bz = 25; bz <= 235; bz += rearDecoStep) {
      [-12.5, 12.5].forEach(tx => {
        addDecoTree(tx, bz);
      });
      [-10.2, 10.2].forEach(px => {
        const pole = createCornerPole(px, bz, 0.9);
        scenery.add(pole);
        colliders.push({
          id: `pole_rear_${px}_${bz}`,
          type: 'pole',
          shape: 'circle',
          x: px,
          z: bz,
          radius: 0.28,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc ranh giới lề đường phía sau!',
          messageDe: 'Begrenzungsstange berührt! (-15đ)'
        });
      });
    }

    // ── 1. TRỤC ĐƯỜNG CHÍNH BẮC - NAM (Central Avenue: rộng 14m) ──
    const dashLength = 3.0;
    const dashGap = 3.0;
    for (let z = 240; z > -232; z -= (dashLength + dashGap)) {
      if (z > -72 || z < -88) { // Bỏ trống tại ngã tư Z = -80
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, dashLength), whiteLineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(0, 0.02, z);
        scenery.add(dash);
      }
    }

    // Vạch viền vàng hai bên trục chính
    [-6.8, 6.8].forEach(xBorder => {
      const borderLineN = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 314), yellowLineMat);
      borderLineN.rotation.x = -Math.PI / 2;
      borderLineN.position.set(xBorder, 0.02, 85);
      scenery.add(borderLineN);

      const borderLineS = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 144), yellowLineMat);
      borderLineS.rotation.x = -Math.PI / 2;
      borderLineS.position.set(xBorder, 0.02, -160);
      scenery.add(borderLineS);
    });

    // Mũi tên sơn dẫn hướng trên trục chính
    scenery.add(createRoadArrow(3.5, 45, 0, 'straight'));
    scenery.add(createRoadArrow(3.5, 12, 0, 'turn_right'));
    scenery.add(createRoadArrow(-3.5, 12, 0, 'turn_left'));
    scenery.add(createRoadArrow(3.5, -45, 0, 'straight'));
    scenery.add(createRoadArrow(3.5, -135, 0, 'straight'));

    // ── 2. TRỤC ĐƯỜNG NGANG ĐÔNG - TÂY (Cross Avenue: Z = -80, rộng 14m, từ X = -95 đến +95) ──
    const crossRoadPlane = new THREE.Mesh(new THREE.PlaneGeometry(190, 14), branchMat);
    crossRoadPlane.rotation.x = -Math.PI / 2;
    crossRoadPlane.position.set(0, 0.01, -80);
    scenery.add(crossRoadPlane);

    // Vạch nét đứt đường ngang
    for (let cx = -90; cx <= 90; cx += 6) {
      if (Math.abs(cx) > 8) {
        const cDash = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.18), whiteLineMat);
        cDash.rotation.x = -Math.PI / 2;
        cDash.position.set(cx, 0.02, -80);
        scenery.add(cDash);
      }
    }

    // Vạch vàng mép đường ngang
    [-73.2, -86.8].forEach(zy => {
      [-50, 50].forEach(cx => {
        const hBorder = new THREE.Mesh(new THREE.PlaneGeometry(84, 0.2), yellowLineMat);
        hBorder.rotation.x = -Math.PI / 2;
        hBorder.position.set(cx, 0.02, zy);
        scenery.add(hBorder);
      });
    });

    // Mũi tên sơn đường ngang
    scenery.add(createRoadArrow(-25, -80, -Math.PI / 2, 'straight'));
    scenery.add(createRoadArrow(25, -80, Math.PI / 2, 'straight'));

    // ── VẠCH XUẤT PHÁT & BANNER CHÀO MỪNG (Z = 0) ──
    const startLineMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.6), whiteLineMat);
    startLineMesh.rotation.x = -Math.PI / 2;
    startLineMesh.position.set(3.5, 0.03, 0);
    scenery.add(startLineMesh);

    scenery.add(createSaHinhBanner('KHU SA HÌNH LÁI XE TỔNG HỢP 3D', 'VERKEHRSÜBUNGSPLATZ - SÂN BÃI ĐA MÔ HÌNH LUYỆN TẬP', 0, 15, 22));

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 1: LÁI ZICZAC QUA CỌC TIÊU (SLALOM / SLALOMPARCOURS) ──────
    // Nằm ở cánh Tây Bắc (X: -30 đến -60, Z: 10 đến -60)
    // ══════════════════════════════════════════════════════════════════════
    const slalomPad = new THREE.Mesh(new THREE.PlaneGeometry(24, 76), asphaltPadMat);
    slalomPad.rotation.x = -Math.PI / 2;
    slalomPad.position.set(-45, 0.015, -25);
    scenery.add(slalomPad);

    // Đường nối phía Bắc từ trục chính sang khu ziczac
    const slalomConnector = new THREE.Mesh(new THREE.PlaneGeometry(35, 10), branchMat);
    slalomConnector.rotation.x = -Math.PI / 2;
    slalomConnector.position.set(-22, 0.012, 5);
    scenery.add(slalomConnector);
    scenery.add(createRoadArrow(-18, 5, -Math.PI / 2, 'straight'));

    // Đường nối phía Nam dẫn ra Đường Ngang Đông - Tây
    const slalomExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), branchMat);
    slalomExitConnector.rotation.x = -Math.PI / 2;
    slalomExitConnector.position.set(-45, 0.012, -69);
    scenery.add(slalomExitConnector);
    scenery.add(createRoadArrow(-45, -70, 0, 'turn_right'));

    scenery.add(createTotemSign('1. LÁI ZICZAC (SLALOM)', 'VẬN TỐC < 20 KM/H - UỐN LƯỢN QUA CỌC TIÊU', -30, 10, 0, '#0284c7'));

    const slalomPositions = [
      { x: -45, z: 2 },
      { x: -47.5, z: -8 },
      { x: -42.5, z: -18 },
      { x: -47.5, z: -28 },
      { x: -42.5, z: -38 },
      { x: -47.5, z: -48 },
      { x: -42.5, z: -58 },
      { x: -45, z: -68 }
    ];
    slalomPositions.forEach((p, idx) => {
      const cone = createTrafficCone(p.x, p.z, 1.25);
      scenery.add(cone);
      colliders.push({
        id: `cone_slalom_${idx}`,
        type: 'cone',
        shape: 'circle',
        x: p.x,
        z: p.z,
        radius: 0.45,
        mesh: cone,
        penalty: 10,
        messageVi: 'Chạm/làm đổ cọc tiêu ziczac Slalom!',
        messageDe: 'Leitkegel im Slalomparcours umgeworfen! (-10đ)'
      });
    });

    // Cọc rào viền mép bãi Slalom
    for (let sz = 10; sz >= -65; sz -= 15) {
      [-56, -34].forEach(px => {
        const pole = createCornerPole(px, sz, 1.0);
        scenery.add(pole);
        colliders.push({
          id: `pole_slalom_${px}_${sz}`,
          type: 'pole',
          shape: 'circle',
          x: px,
          z: sz,
          radius: 0.32,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc rào ranh giới bãi Slalom!',
          messageDe: 'Begrenzungsstange Slalom berührt! (-15đ)'
        });
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 1.5: DỐC ĐỀ-PA 10% (ANFAHREN AM BERG - Grundfahraufgabe) ──
    // Nằm ngay trên trục chính sau điểm xuất phát: xe leo dốc carZ 7→19, đỉnh
    // dốc 19→31, đổ xuống 31→43. Đăng ký vào `ramps` để vật lý leo dốc & phát
    // hiện tuột dốc (hillRolledBack — lỗi trượt bài khi xe lùi > 30cm) hoạt động.
    // LƯU Ý căn pha: physics đọc distFromStart = (carZ + centerZ) + length/2 với
    // centerZ = -25 → dốc vật lý trải carZ 7..43. Mesh createHillRamp vẽ từ gốc
    // group về phía -Z → đặt mesh tại worldZ = -7 để khớp chính xác sườn dốc.
    // ══════════════════════════════════════════════════════════════════════
    const hillRamp = createHillRamp(0, 0, 8.0, 36.0, 1.1);
    hillRamp.position.set(0, 0, -7);
    scenery.add(hillRamp);
    saHinhRamps.push({ centerX: 0, centerZ: -25, width: 8.0, length: 36.0, maxHeight: 1.1 });

    // Vạch đỏ Haltelinie giữa sườn dốc (điểm dừng đề-pa chuẩn, carZ ≈ 12)
    const hillHaltLine = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.45), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    hillHaltLine.rotation.x = -Math.PI / 2 + Math.atan2(1.1, 12.0);
    hillHaltLine.position.set(0, 0.5, -12.0);
    scenery.add(hillHaltLine);

    // Vạch đỏ thứ hai trên đỉnh dốc cho bài rèn cao hơn (carZ ≈ 25)
    const hillHaltLineTop = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 0.45), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    hillHaltLineTop.rotation.x = -Math.PI / 2;
    hillHaltLineTop.position.set(0, 1.12, -25.0);
    scenery.add(hillHaltLineTop);

    scenery.add(createTotemSign('2. ĐỀ-PA NGANG DỐC (ANFAHREN AM BERG)', 'DỪNG TRƯỚC VẠCH ĐỎ TRÊN DỐC - KÉO PHANH TAY - KHỞI HÀNH KHÔNG ĐỂ XE TUỘT LÙI', 13, -4, 0, '#dc2626'));

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 2: GHÉP XE SONG SONG (LÄNGSPARKEN) ────────────────────────
    // Nằm ở cánh Đông Bắc (X: 30 đến 60, Z: 10 đến -55)
    // ══════════════════════════════════════════════════════════════════════
    const parallelPad = new THREE.Mesh(new THREE.PlaneGeometry(24, 70), asphaltPadMat);
    parallelPad.rotation.x = -Math.PI / 2;
    parallelPad.position.set(45, 0.015, -25);
    scenery.add(parallelPad);

    // Đường nối phía Bắc từ trục chính sang khu ghép song song
    const parallelConnector = new THREE.Mesh(new THREE.PlaneGeometry(28, 10), branchMat);
    parallelConnector.rotation.x = -Math.PI / 2;
    parallelConnector.position.set(20, 0.012, 5);
    scenery.add(parallelConnector);
    scenery.add(createRoadArrow(18, 5, Math.PI / 2, 'straight'));

    // Đường nối phía Nam dẫn ra Đường Ngang Đông - Tây
    const parallelExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), branchMat);
    parallelExitConnector.rotation.x = -Math.PI / 2;
    parallelExitConnector.position.set(45, 0.012, -67);
    scenery.add(parallelExitConnector);
    scenery.add(createRoadArrow(45, -68, 0, 'turn_right'));

    // Vỉa hè bê tông mô phỏng lề đường
    const parallelSidewalk = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 68), sidewalkMat);
    parallelSidewalk.position.set(55, 0.08, -25);
    scenery.add(parallelSidewalk);

    // Vỉa đá ba-toa lề
    const curbP = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 68), curbMat);
    curbP.position.set(53.1, 0.1, -25);
    scenery.add(curbP);

    scenery.add(createTotemSign('2. GHÉP XE SONG SONG', 'XI-NHAN PHẢI -> LÙI SỐ R VÀO Ô GIỮA 2 XE', 32, 10, 0, '#2563eb'));

    const pSign1 = makeGermanStVOSign('PARKING');
    pSign1.position.set(52, 0, 8);
    scenery.add(pSign1);

    // 2 Xe ô tô mô hình (Parked Dummy Cars) với chi tiết cao cấp
    const frontDummyCar = createParkedDummyCar(49.5, -10, 0x2563eb, 0);
    scenery.add(frontDummyCar);
    colliders.push({
      id: 'dummy_car_front',
      type: 'vehicle',
      shape: 'box',
      x: 49.5,
      z: -10,
      minX: 49.5 - 1.15,
      maxX: 49.5 + 1.15,
      minZ: -10 - 2.35,
      maxZ: -10 + 2.35,
      penalty: 30,
      messageVi: 'Va chạm với xe ô tô đang đỗ phía trước!',
      messageDe: 'Kollision mit vorderem geparkten Fahrzeug! (-30đ)'
    });

    const rearDummyCar = createParkedDummyCar(49.5, -40, 0xdc2626, 0);
    scenery.add(rearDummyCar);
    colliders.push({
      id: 'dummy_car_rear',
      type: 'vehicle',
      shape: 'box',
      x: 49.5,
      z: -40,
      minX: 49.5 - 1.15,
      maxX: 49.5 + 1.15,
      minZ: -40 - 2.35,
      maxZ: -40 + 2.35,
      penalty: 30,
      messageVi: 'Va chạm với xe ô tô đang đỗ phía sau!',
      messageDe: 'Kollision mit hinterem geparkten Fahrzeug! (-30đ)'
    });

    // Ô đỗ xe chuẩn StVO ở giữa 2 xe dummy
    scenery.add(createParkingMarkings(49.5, -25, 2.7, 7.2, true));

    // Cọc tiêu căn lề đuôi xe
    const parallelConePositions = [
      { x: 47.8, z: -17 }, { x: 51.2, z: -17 },
      { x: 47.8, z: -33 }, { x: 51.2, z: -33 }
    ];
    parallelConePositions.forEach((p, idx) => {
      const cone = createTrafficCone(p.x, p.z, 0.95);
      scenery.add(cone);
      colliders.push({
        id: `cone_park_${idx}`,
        type: 'cone',
        shape: 'circle',
        x: p.x,
        z: p.z,
        radius: 0.38,
        mesh: cone,
        penalty: 10,
        messageVi: 'Chạm cọc tiêu căn chuồng ghép song song!',
        messageDe: 'Leitkegel beim Längsparken berührt! (-10đ)'
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 3: GHÉP XE VUÔNG GÓC 90° (QUERPARKEN) ─────────────────────
    // Nằm ở cánh Đông Nam (X: 30 đến 65, Z: -95 đến -155)
    // ══════════════════════════════════════════════════════════════════════
    const querPad = new THREE.Mesh(new THREE.PlaneGeometry(28, 70), asphaltPadMat);
    querPad.rotation.x = -Math.PI / 2;
    querPad.position.set(48, 0.015, -125);
    scenery.add(querPad);

    // Đường nối phía Bắc vào khu ghép vuông góc
    const querNorthConnector = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), branchMat);
    querNorthConnector.rotation.x = -Math.PI / 2;
    querNorthConnector.position.set(48, 0.012, -88);
    scenery.add(querNorthConnector);

    // Đường nối phía Nam dẫn ra Trục chính
    const querExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(42, 12), branchMat);
    querExitConnector.rotation.x = -Math.PI / 2;
    querExitConnector.position.set(27, 0.012, -162);
    scenery.add(querExitConnector);
    scenery.add(createRoadArrow(20, -162, -Math.PI / 2, 'straight'));

    scenery.add(createTotemSign('3. GHÉP XE VUÔNG GÓC 90°', 'TIẾN QUA CỬA CHUỒNG -> LÙI SỐ R VUÔNG GÓC', 32, -88, 0, '#7c3aed'));

    const pSign2 = makeGermanStVOSign('PARKING');
    pSign2.position.set(38, 0, -96);
    scenery.add(pSign2);

    // 4 Chuồng đỗ xe vuông góc liên tiếp
    [-106, -118, -130, -142].forEach(stallZ => {
      scenery.add(createParkingMarkings(54, stallZ, 3.2, 6.2, false));
      // Cọc tiêu cửa chuồng và đáy chuồng
      [
        { x: 52.2, z: stallZ + 3.0 },
        { x: 55.8, z: stallZ + 3.0 },
        { x: 52.2, z: stallZ - 3.0 },
        { x: 55.8, z: stallZ - 3.0 }
      ].forEach(p => {
        const pole = createCornerPole(p.x, p.z, 1.1);
        scenery.add(pole);
        colliders.push({
          id: `pole_quer_${p.x}_${p.z}`,
          type: 'pole',
          shape: 'circle',
          x: p.x,
          z: p.z,
          radius: 0.30,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc giới hạn chuồng đỗ vuông góc 90°!',
          messageDe: 'Begrenzungsstange Querparken berührt! (-15đ)'
        });
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 4: VÒNG XUYẾN ĐẢO GIAO THÔNG (KREISVERKEHR) ───────────────
    // Nằm ở cánh Tây Nam (Tâm tại X: -55, Z: -125)
    // ══════════════════════════════════════════════════════════════════════
    const roundaboutGroup = new THREE.Group();
    // Đảo cỏ tròn trung tâm (bán kính 11m)
    const islandGeo = new THREE.CylinderGeometry(11, 11, 0.35, 32);
    const islandGrass = new THREE.Mesh(islandGeo, new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }));
    islandGrass.position.y = 0.17;
    roundaboutGroup.add(islandGrass);

    // Vỉa ba-toa bao quanh đảo tròn
    const islandCurb = new THREE.Mesh(new THREE.RingGeometry(10.8, 11.4, 32), curbMat);
    islandCurb.rotation.x = -Math.PI / 2;
    islandCurb.position.y = 0.36;
    roundaboutGroup.add(islandCurb);

    // Cây xanh cảnh quan ở tâm đảo
    const centerTreeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 4.0, 8), treeTrunkMat);
    centerTreeTrunk.position.y = 2.2;
    const centerTreeFol = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 8), treeLeavesMat);
    centerTreeFol.position.y = 5.0;
    roundaboutGroup.add(centerTreeTrunk);
    roundaboutGroup.add(centerTreeFol);

    // Lòng đường vòng xuyến (Vành khăn nhựa asphalt: bán kính trong 11m, ngoài 21m)
    const ringRoad = new THREE.Mesh(new THREE.RingGeometry(11.2, 21.0, 36), branchMat);
    ringRoad.rotation.x = -Math.PI / 2;
    ringRoad.position.y = 0.015;
    roundaboutGroup.add(ringRoad);

    // Vạch sơn nét đứt phân 2 làn trong vòng xuyến (bán kính 16m)
    const numRingDashes = 18;
    for (let ri = 0; ri < numRingDashes; ri++) {
      const angle = (ri / numRingDashes) * Math.PI * 2;
      const rDash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.8), whiteLineMat);
      rDash.rotation.x = -Math.PI / 2;
      rDash.rotation.z = -angle;
      rDash.position.set(Math.cos(angle) * 16, 0.022, Math.sin(angle) * 16);
      roundaboutGroup.add(rDash);
    }

    roundaboutGroup.position.set(-55, 0, -125);
    scenery.add(roundaboutGroup);

    // Đăng ký Collider Đảo Vòng Xuyến
    colliders.push({
      id: 'roundabout_island',
      type: 'curb',
      shape: 'circle',
      x: -55,
      z: -125,
      radius: 11.2,
      penalty: 15,
      messageVi: 'Đè lên đảo cỏ vòng xuyến giao thông!',
      messageDe: 'Verkehrsinsel im Kreisverkehr überfahren! (-15đ)'
    });

    // Đường nối phía Bắc từ Cross Ave vào vòng xuyến
    const rbNorthConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 20), branchMat);
    rbNorthConnector.rotation.x = -Math.PI / 2;
    rbNorthConnector.position.set(-55, 0.012, -96);
    scenery.add(rbNorthConnector);

    // Đường nối phía Đông từ Trục chính sang vòng xuyến
    const rbEastConnector = new THREE.Mesh(new THREE.PlaneGeometry(28, 12), branchMat);
    rbEastConnector.rotation.x = -Math.PI / 2;
    rbEastConnector.position.set(-20, 0.012, -125);
    scenery.add(rbEastConnector);

    // Đường nối phía Nam từ vòng xuyến sang khu cua chữ S
    const rbSouthConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 26), branchMat);
    rbSouthConnector.rotation.x = -Math.PI / 2;
    rbSouthConnector.position.set(-55, 0.012, -156);
    scenery.add(rbSouthConnector);

    // Vạch răng cá mập (Haifischzähne) trước các cửa vào vòng xuyến
    scenery.add(createSharkTeethYield(-55, -104, 5, 1.1, 0));
    scenery.add(createSharkTeethYield(-34, -125, 5, 1.1, -Math.PI / 2));

    // Biển báo vòng xuyến StVO (Zeichen 215) & Nhường đường (Zeichen 205) tại các cửa vào
    const rbSignEast = makeGermanStVOSign('ROUNDABOUT');
    rbSignEast.position.set(-32, 0, -125);
    scenery.add(rbSignEast);

    const rbSignNorth = makeGermanStVOSign('ROUNDABOUT');
    rbSignNorth.position.set(-55, 0, -102);
    scenery.add(rbSignNorth);

    scenery.add(createTotemSign('4. VÒNG XUYẾN (KREISVERKEHR)', 'NHƯỜNG XE TRONG ĐẢO - XI-NHAN PHẢI KHI RA', -32, -88, 0, '#059669'));

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 5: GIAO LỘ NGÃ TƯ & ĐÈN TÍN HIỆU (KREUZUNG 4-WAY) ──────────
    // Giao điểm trung tâm tại X: 0, Z: -80
    // ══════════════════════════════════════════════════════════════════════
    scenery.add(createTotemSign('5. GIAO LỘ NGÃ TƯ & ĐÈN TÍN HIỆU', 'DỪNG TRƯỚC VẠCH ĐÈN ĐỎ - ƯU TIÊN BÊN PHẢI', 12, -65, 0, '#d97706'));

    // 4 Vạch người đi bộ qua đường (Zebrastreifen)
    scenery.add(createZebraCrosswalk(0, -68, 12, 4.5)); // Nhánh Bắc
    scenery.add(createZebraCrosswalk(0, -92, 12, 4.5)); // Nhánh Nam
    // Nhánh Đông & Tây
    const zebraEast = createZebraCrosswalk(10, -80, 12, 4.5);
    zebraEast.rotation.y = Math.PI / 2;
    scenery.add(zebraEast);
    const zebraWest = createZebraCrosswalk(-10, -80, 12, 4.5);
    zebraWest.rotation.y = Math.PI / 2;
    scenery.add(zebraWest);

    // 4 Vạch dừng màu đỏ (Haltelinie)
    const stopLineNorth = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    stopLineNorth.rotation.x = -Math.PI / 2;
    stopLineNorth.position.set(0, 0.03, -65);
    scenery.add(stopLineNorth);

    const stopLineSouth = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    stopLineSouth.rotation.x = -Math.PI / 2;
    stopLineSouth.position.set(0, 0.03, -95);
    scenery.add(stopLineSouth);

    // 4 Cột đèn tín hiệu giao thông (Traffic Lights) tại 4 góc ngã tư
    const tlNE = makeTrafficLight(true);
    tlNE.position.set(8.2, 0, -66);
    scenery.add(tlNE);

    const tlNW = makeTrafficLight(true);
    tlNW.position.set(-8.2, 0, -66);
    tlNW.rotation.y = Math.PI;
    scenery.add(tlNW);

    const tlSE = makeTrafficLight(true);
    tlSE.position.set(8.2, 0, -94);
    scenery.add(tlSE);

    const tlSW = makeTrafficLight(true);
    tlSW.position.set(-8.2, 0, -94);
    tlSW.rotation.y = Math.PI;
    scenery.add(tlSW);

    // Biển cảnh báo ngã tư / Ưu tiên bên phải
    const dangerSign1 = makeGermanStVOSign('DANGER');
    dangerSign1.position.set(8.5, 0, -50);
    scenery.add(dangerSign1);

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 6: ĐƯỜNG QUANH CO CHỮ S (S-KURVE) ─────────────────────────
    // Nằm ở khu vực phía Nam (X: -30 đến -70, Z: -170 đến -230)
    // ══════════════════════════════════════════════════════════════════════
    const scurvePad = new THREE.Mesh(new THREE.PlaneGeometry(42, 65), asphaltPadMat);
    scurvePad.rotation.x = -Math.PI / 2;
    scurvePad.position.set(-50, 0.015, -200);
    scenery.add(scurvePad);

    // Đường nối phía Nam dẫn từ cua chữ S về Trục chính & Cổng đích
    const scurveExitConnector = new THREE.Mesh(new THREE.PlaneGeometry(36, 12), branchMat);
    scurveExitConnector.rotation.x = -Math.PI / 2;
    scurveExitConnector.position.set(-23, 0.012, -230);
    scenery.add(scurveExitConnector);
    scenery.add(createRoadArrow(-15, -230, Math.PI / 2, 'straight'));

    // Hàng rào lốp an toàn tại góc cua gắt ngoài cùng
    scenery.add(createTireWall(-64, -198, 7, Math.PI / 4));

    scenery.add(createTotemSign('6. ĐƯỜNG QUANH CO CHỮ S', 'CĂN ĐƯỜNG MỀM MẠI - KHÔNG ĐÈ CỌC VÀ VẠCH', -24, -170, 0, '#ea580c'));

    // Các cặp cọc tiêu uốn lượn hình chữ S
    const scurvePoints = [
      { x: -35, z: -175 }, { x: -45, z: -182 }, { x: -55, z: -190 },
      { x: -62, z: -198 }, { x: -55, z: -208 }, { x: -45, z: -216 },
      { x: -36, z: -224 }, { x: -45, z: -230 }
    ];
    scurvePoints.forEach((pt, idx) => {
      [-3.5, 3.5].forEach((ox, sideIdx) => {
        const px = pt.x + ox;
        const pole = createCornerPole(px, pt.z, 1.15);
        scenery.add(pole);
        colliders.push({
          id: `pole_scurve_${idx}_${sideIdx}`,
          type: 'pole',
          shape: 'circle',
          x: px,
          z: pt.z,
          radius: 0.30,
          mesh: pole,
          penalty: 15,
          messageVi: 'Chạm cọc ranh giới đoạn đường uốn lượn chữ S!',
          messageDe: 'Begrenzungsstange in S-Kurve berührt! (-15đ)'
        });
      });

      const cone = createTrafficCone(pt.x, pt.z, 0.9);
      scenery.add(cone);
      colliders.push({
        id: `cone_scurve_${idx}`,
        type: 'cone',
        shape: 'circle',
        x: pt.x,
        z: pt.z,
        radius: 0.38,
        mesh: cone,
        penalty: 10,
        messageVi: 'Chạm cọc tiêu tim đường chữ S!',
        messageDe: 'Leitkegel in S-Kurve berührt! (-10đ)'
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 7: LÀN PHANH DỪNG KHẨN CẤP (GEFAHRENBREMSUNG) ────────────
    // Làn thẳng riêng biệt tại X: 16 (từ Z: -150 đến -235)
    // ══════════════════════════════════════════════════════════════════════
    const brakePad = new THREE.Mesh(new THREE.PlaneGeometry(16, 85), asphaltPadMat);
    brakePad.rotation.x = -Math.PI / 2;
    brakePad.position.set(16, 0.015, -192);
    scenery.add(brakePad);

    // Đường nối phía Bắc vào làn phanh khẩn cấp
    const brakeConnector = new THREE.Mesh(new THREE.PlaneGeometry(12, 25), branchMat);
    brakeConnector.rotation.x = -Math.PI / 2;
    brakeConnector.position.set(16, 0.012, -140);
    scenery.add(brakeConnector);
    scenery.add(createRoadArrow(16, -142, 0, 'straight'));

    // Hàng rào lốp xe giảm chấn ở cuối làn phanh
    scenery.add(createTireWall(16, -238, 8, 0));

    scenery.add(createTotemSign('7. PHANH DỪNG KHẨN CẤP', 'TĂNG TỐC 30-50 KM/H -> ĐẠP PHANH HẾT CỠ DƯỚI 6M', 10, -150, 0, '#dc2626'));

    const speedSign50 = makeGermanStVOSign('SPEED_LIMIT', 50);
    speedSign50.position.set(24, 0, -160);
    scenery.add(speedSign50);

    const dangerSign2 = makeGermanStVOSign('DANGER');
    dangerSign2.position.set(24, 0, -172);
    scenery.add(dangerSign2);

    // Vạch vàng cảnh báo chuẩn bị phanh khẩn cấp tại Z = -188
    const brakeWarningLine = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.6), yellowLineMat);
    brakeWarningLine.rotation.x = -Math.PI / 2;
    brakeWarningLine.position.set(16, 0.03, -188);
    scenery.add(brakeWarningLine);

    // Vạch đỏ giới hạn dừng xe khẩn cấp Haltelinie tại Z = -205
    const brakeStopLine = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    brakeStopLine.rotation.x = -Math.PI / 2;
    brakeStopLine.position.set(16, 0.03, -205);
    scenery.add(brakeStopLine);

    // Hàng cọc tiêu giới hạn 2 bên làn phanh
    for (let bz = -165; bz >= -225; bz -= 8) {
      [9.5, 22.5].forEach((bx, sideIdx) => {
        const cone = createTrafficCone(bx, bz, 1.05);
        scenery.add(cone);
        colliders.push({
          id: `cone_brake_${bx}_${bz}`,
          type: 'cone',
          shape: 'circle',
          x: bx,
          z: bz,
          radius: 0.40,
          mesh: cone,
          penalty: 10,
          messageVi: 'Chạm cọc tiêu giới hạn làn phanh khẩn cấp!',
          messageDe: 'Leitkegel der Gefahrenbremsung berührt! (-10đ)'
        });
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // ── MÔ HÌNH 8: CỔNG ĐÍCH & KẾT THÚC SA HÌNH (ZIEL & FINISH PARKPLATZ) ─
    // Cuối trục chính tại X: 0, Z: -235
    // ══════════════════════════════════════════════════════════════════════
    scenery.add(createSaHinhBanner('8. VẠCH ĐÍCH & KẾT THÚC SA HÌNH', 'XI-NHAN PHẢI TẤP LỀ - DỪNG BÁNH XE - VỀ SỐ P - KÉO PHANH TAY', 0, -228, 18));

    // Cổng vòm đích Finish Arch tại Z = -234
    scenery.add(createFinishArch(0, -234, 16));

    // Bãi đỗ xe trả bài thi kết thúc tại Z = -245
    scenery.add(createParkingMarkings(6.5, -246, 2.8, 6.5, true));
    scenery.add(createParkingMarkings(-6.5, -246, 2.8, 6.5, true));

    // Vòng quay đầu xe sau vạch đích để có thể tiếp tục lái dạo quanh sân
    const loopBackRoad = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), branchMat);
    loopBackRoad.rotation.x = -Math.PI / 2;
    loopBackRoad.position.set(0, 0.012, -255);
    scenery.add(loopBackRoad);

    const pSignFinal = makeGermanStVOSign('PARKING');
    pSignFinal.position.set(9.5, 0, -240);
    scenery.add(pSignFinal);
  }

  // 🌲 5. ĐƯỜNG NGOÀI ĐÔ THỊ ĐỨC (LANDSTRASSE WALD: RỪNG THÔNG, LEITPFOSTEN, WILDWECHSEL, 100 KM/H)
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
function createParkTree(scale = 1) {
  const treeGroup = new THREE.Group();
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
  const leafM2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.9 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.26 * scale, 2.8 * scale, 8), trunkM);
  trunk.position.y = 1.4 * scale;
  trunk.castShadow = true;
  treeGroup.add(trunk);

  const leavesLow = new THREE.Mesh(new THREE.SphereGeometry(1.7 * scale, 8, 8), leafM);
  leavesLow.position.y = 3.2 * scale;
  leavesLow.castShadow = true;
  treeGroup.add(leavesLow);

  const leavesTop = new THREE.Mesh(new THREE.SphereGeometry(1.15 * scale, 8, 8), leafM2);
  leavesTop.position.y = 4.5 * scale;
  leavesTop.castShadow = true;
  treeGroup.add(leavesTop);

  return treeGroup;
}

// Ghế đá công viên (Parkbank Berlin kiểu băng ghế sơn xanh lá)
function createParkBench() {
  const bench = new THREE.Group();
  const woodM = new THREE.MeshStandardMaterial({ color: 0x2f6b4f, roughness: 0.75 });
  const legM = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.3 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.07, 0.45), woodM);
  seat.position.y = 0.45;
  seat.castShadow = true;
  bench.add(seat);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.06), woodM);
  backrest.position.set(0, 0.72, -0.2);
  backrest.rotation.x = -0.15;
  bench.add(backrest);

  [-0.75, 0.75].forEach(bx => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.42), legM);
    leg.position.set(bx, 0.22, 0);
    bench.add(leg);
  });

  return bench;
}

// ── 3. CUSTOM MAP BUILDER (Build từ file JSON MapEditor) ────────────────────────
export function buildCustomMap(scene, mapData, options = {}) {
  if (!mapData) {
    return { scenery: null, roadMat: null, crossStreetZ: [], config: null, isCustomMap: false };
  }
  const isPerformance = !!options.isPerformance;

  const scenery = new THREE.Group();
  scenery.name = 'customMapScenery';

  const ambientLight = new THREE.AmbientLight(0xffffff, isPerformance ? 0.6 : 0.25);
  scenery.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, isPerformance ? 0.6 : 0.35);
  dirLight.position.set(50, 100, 50);
  dirLight.castShadow = !isPerformance;
  scenery.add(dirLight);

  const roadMat = createPbrRoadMaterial({ repeatX: 7, repeatZ: 40, roughness: 0.82 });
  const grassMat = createPbrGrassMaterial({ repeatX: 1000, repeatZ: 1000, color: 0xffffff });
  const swMat = createSidewalkMaterial({ repeatX: 2, repeatZ: 40 });
  const cobbleMat = createCobblestoneMaterial({ repeatX: 4, repeatZ: 4 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.05 });

  const customRamps = [];

  const groundGeo = new THREE.PlaneGeometry(2000, 2000);
  ensureUV2(groundGeo);
  const ground = new THREE.Mesh(groundGeo, grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, 0);
  ground.receiveShadow = true;
  scenery.add(ground);

  if (mapData.elements) {
    mapData.elements.forEach((element) => {
      const x = element.x;
      const z = element.z || 0;
      const width = element.width;
      const height = element.height;
      const rotationDeg = element.rotation || 0;
      const isQuarterTurn = rotationDeg === 90 || rotationDeg === 270;

      const effWidth = isQuarterTurn ? height : width;
      const effHeight = isQuarterTurn ? width : height;

      const centerX = x + effWidth / 2;
      const centerZ = -(z + effHeight / 2);
      const rotRad = -(rotationDeg * Math.PI / 180);
      switch (element.type) {
        case 'ROAD':
        case 'ROAD_STRAIGHT': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          // Road surface - Hỗ trợ mặt đường Asphalt hoặc Đá cuội Cobblestone
          const surfaceMat = element.roadType === 'cobblestone' ? cobbleMat : roadMat;
          const roadGeo = new THREE.PlaneGeometry(width, height);
          ensureUV2(roadGeo);
          const road = new THREE.Mesh(roadGeo, surfaceMat);
          road.rotation.x = -Math.PI / 2;
          road.receiveShadow = true;
          group.add(road);

          // Ray đôi tàu điện Straßenbahn Tram M8/12 nếu có hasTram
          if (element.hasTram) {
            const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
            [-0.75, 0.75].forEach(rX => {
              const rail = new THREE.Mesh(new THREE.PlaneGeometry(0.12, height), railMat);
              rail.rotation.x = -Math.PI / 2;
              rail.position.set(rX, 0.007, 0);
              group.add(rail);
            });
          }

          // Làn đường xe đạp sơn đỏ chuyên dụng (Radwegefurt)
          if (element.bicycleLane) {
            const bikeLaneMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 });
            [-width / 2 + 0.9, width / 2 - 0.9].forEach(bX => {
              const bikeLane = new THREE.Mesh(new THREE.PlaneGeometry(1.3, height), bikeLaneMat);
              bikeLane.rotation.x = -Math.PI / 2;
              bikeLane.position.set(bX, 0.003, 0);
              group.add(bikeLane);
            });
          }

          // Center dashed white line (hoặc vạch kép nếu là đại lộ 4 làn)
          if (element.lanes === 4) {
            [-0.4, 0.4].forEach(offX => {
              const borderLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, height), lineMat);
              borderLine.rotation.x = -Math.PI / 2;
              borderLine.position.set(offX, 0.005, 0);
              group.add(borderLine);
            });
          } else {
            const numDashes = Math.max(1, Math.floor(height / 4));
            for (let d = 0; d < numDashes; d++) {
              const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 2), lineMat);
              dash.rotation.x = -Math.PI / 2;
              dash.position.set(0, 0.005, -height / 2 + 1 + d * 4);
              group.add(dash);
            }
          }

          // Outer solid white lines
          [-width / 2 + 0.3, width / 2 - 0.3].forEach(lineX => {
            const borderLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, height), lineMat);
            borderLine.rotation.x = -Math.PI / 2;
            borderLine.position.set(lineX, 0.005, 0);
            group.add(borderLine);
          });

          // Vỉa hè 2 bên đường nếu sidewalk !== false
          if (element.sidewalk !== false) {
            [-width / 2 - 0.9, width / 2 + 0.9].forEach(swX => {
              const sw = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, height), swMat);
              sw.position.set(swX, 0.075, 0);
              group.add(sw);
            });
          }

          scenery.add(group);
          break;
        }
        case 'ROAD_CURVE_90': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const tileSize = Math.max(width, height);
          const roadW = Math.min(width, height, 14);
          const Rcenter = tileSize / 2;
          const Rin = Math.max(2, Rcenter - roadW / 2);
          const Rout = Rcenter + roadW / 2;

          const arcGroup = new THREE.Group();
          arcGroup.position.set(-tileSize / 2, 0, tileSize / 2);

          const curveGeo = new THREE.RingGeometry(Rin, Rout, 36, 1, 0, Math.PI / 2);
          const curveMesh = new THREE.Mesh(curveGeo, roadMat);
          curveMesh.rotation.x = -Math.PI / 2;
          curveMesh.receiveShadow = true;
          arcGroup.add(curveMesh);

          // Vạch kẻ đứt cong ở giữa (Center curved dashed line)
          const numDashes = 6;
          const angleSpan = Math.PI / 2;
          for (let d = 0; d < numDashes; d++) {
            const startAng = (d / numDashes) * angleSpan + 0.04;
            const dashAng = (angleSpan / numDashes) * 0.55;
            const dashGeo = new THREE.RingGeometry(Rcenter - 0.12, Rcenter + 0.12, 6, 1, startAng, dashAng);
            const dashMesh = new THREE.Mesh(dashGeo, lineMat);
            dashMesh.rotation.x = -Math.PI / 2;
            dashMesh.position.y = 0.005;
            arcGroup.add(dashMesh);
          }

          // Vạch liền mép trong & mép ngoài
          const innerLineGeo = new THREE.RingGeometry(Rin + 0.3, Rin + 0.45, 36, 1, 0, Math.PI / 2);
          const innerLineMesh = new THREE.Mesh(innerLineGeo, lineMat);
          innerLineMesh.rotation.x = -Math.PI / 2;
          innerLineMesh.position.y = 0.005;
          arcGroup.add(innerLineMesh);

          const outerLineGeo = new THREE.RingGeometry(Rout - 0.45, Rout - 0.3, 36, 1, 0, Math.PI / 2);
          const outerLineMesh = new THREE.Mesh(outerLineGeo, lineMat);
          outerLineMesh.rotation.x = -Math.PI / 2;
          outerLineMesh.position.y = 0.005;
          arcGroup.add(outerLineMesh);

          // Vỉa hè cong mép ngoài & trong
          const outerCurbGeo = new THREE.RingGeometry(Rout, Rout + 1.2, 36, 1, 0, Math.PI / 2);
          const outerCurb = new THREE.Mesh(outerCurbGeo, swMat);
          outerCurb.rotation.x = -Math.PI / 2;
          outerCurb.position.y = 0.04;
          arcGroup.add(outerCurb);

          const innerCurbGeo = new THREE.RingGeometry(Math.max(0.1, Rin - 1.2), Rin, 36, 1, 0, Math.PI / 2);
          const innerCurb = new THREE.Mesh(innerCurbGeo, swMat);
          innerCurb.rotation.x = -Math.PI / 2;
          innerCurb.position.y = 0.04;
          arcGroup.add(innerCurb);

          // Gờ sa hình kerb sọc đỏ trắng ôm cua
          const numKerbs = 8;
          for (let k = 0; k < numKerbs; k++) {
            const kStart = (k / numKerbs) * angleSpan;
            const kLen = angleSpan / numKerbs;
            const kerbMat = (k % 2 === 0)
              ? new THREE.MeshBasicMaterial({ color: 0xef4444 })
              : new THREE.MeshBasicMaterial({ color: 0xffffff });
            const kGeo = new THREE.RingGeometry(Rin, Rin + 0.45, 4, 1, kStart, kLen);
            const kMesh = new THREE.Mesh(kGeo, kerbMat);
            kMesh.rotation.x = -Math.PI / 2;
            kMesh.position.y = 0.01;
            arcGroup.add(kMesh);
          }

          group.add(arcGroup);
          scenery.add(group);
          break;
        }
        case 'ROAD_S_CURVE': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const roadW = width || 14;
          const roadLen = height || 40;
          const steps = 40;
          const amplitude = element.amplitude || 4.2;

          const sCurveFunc = (t) => {
            return amplitude * Math.sin(Math.PI * 2 * t) * Math.pow(Math.sin(Math.PI * t), 1.5);
          };

          const positions = [];
          const uvs = [];
          const indices = [];

          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const zLocal = -roadLen / 2 + t * roadLen;
            const xLocal = sCurveFunc(t);

            const eps = 0.001;
            const dx = sCurveFunc(Math.min(1, t + eps)) - sCurveFunc(Math.max(0, t - eps));
            const dz = (2 * eps) * roadLen;
            const angle = Math.atan2(dx, dz);
            const nx = Math.cos(angle);
            const nz = -Math.sin(angle);

            positions.push(xLocal - nx * (roadW / 2), 0, zLocal - nz * (roadW / 2));
            uvs.push(0, t * (roadLen / 4));

            positions.push(xLocal + nx * (roadW / 2), 0, zLocal + nz * (roadW / 2));
            uvs.push(1, t * (roadLen / 4));

            if (i < steps) {
              const baseIdx = i * 2;
              indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
              indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
            }
          }

          const sGeo = new THREE.BufferGeometry();
          sGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          sGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
          sGeo.setIndex(indices);
          sGeo.computeVertexNormals();

          const sMesh = new THREE.Mesh(sGeo, roadMat);
          sMesh.receiveShadow = true;
          group.add(sMesh);

          // Vạch tim đường đứt khúc uốn lượn theo cua S
          const numDashes = Math.floor(roadLen / 3.5);
          for (let d = 0; d < numDashes; d++) {
            const t = (d + 0.5) / numDashes;
            const zLocal = -roadLen / 2 + t * roadLen;
            const xLocal = sCurveFunc(t);
            const dashMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.8), lineMat);
            dashMesh.rotation.x = -Math.PI / 2;
            dashMesh.position.set(xLocal, 0.005, zLocal);
            group.add(dashMesh);
          }

          // Cọc tiêu sa hình phản quang (Traffic cones) dọc 2 mép bài thi đường quanh co
          for (let i = 2; i <= steps - 2; i += 4) {
            const t = i / steps;
            const zLocal = -roadLen / 2 + t * roadLen;
            const xLocal = sCurveFunc(t);
            const eps = 0.001;
            const dx = sCurveFunc(Math.min(1, t + eps)) - sCurveFunc(Math.max(0, t - eps));
            const dz = (2 * eps) * roadLen;
            const angle = Math.atan2(dx, dz);
            const nx = Math.cos(angle);
            const nz = -Math.sin(angle);

            [-roadW / 2 + 0.4, roadW / 2 - 0.4].forEach(sideOffset => {
              const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
              const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.22, 0.6, 8), coneMat);
              cone.position.set(xLocal + nx * sideOffset, 0.3, zLocal + nz * sideOffset);
              cone.castShadow = true;
              group.add(cone);
            });
          }

          scenery.add(group);
          break;
        }
        case 'ROUNDABOUT_4WAY':
        case 'ROUNDABOUT': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const outerR = Math.max(width, height) / 2;
          const innerR = Math.max(4, outerR - 9.5);

          // Mặt đường vòng xuyến (Circular asphalt ring)
          const ringGeo = new THREE.RingGeometry(innerR, outerR, 48);
          const ringMesh = new THREE.Mesh(ringGeo, roadMat);
          ringMesh.rotation.x = -Math.PI / 2;
          ringMesh.receiveShadow = true;
          group.add(ringMesh);

          // Đảo cỏ trung tâm & viền đá (Center island)
          const islandGeo = new THREE.CylinderGeometry(innerR, innerR + 0.25, 0.3, 48);
          const islandMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
          const island = new THREE.Mesh(islandGeo, islandMat);
          island.position.y = 0.15;
          island.receiveShadow = true;
          group.add(island);

          // Cây xanh & tiểu cảnh trung tâm bùng binh
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 4.0, 8), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
          trunk.position.y = 2.0;
          trunk.castShadow = true;
          group.add(trunk);

          const crown = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 12), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
          crown.position.y = 4.8;
          crown.castShadow = true;
          group.add(crown);

          // 4 đường dẫn nối vào vòng xuyến (4 Approach legs with Shark's teeth markings)
          const legW = 14;
          const legLen = outerR;
          [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(angle => {
            const legMesh = new THREE.Mesh(new THREE.PlaneGeometry(legW, legLen), roadMat);
            legMesh.rotation.x = -Math.PI / 2;
            legMesh.rotation.z = angle;
            const legDist = (outerR + innerR) / 2;
            legMesh.position.set(Math.sin(angle) * legDist, -0.002, Math.cos(angle) * legDist);
            group.add(legMesh);

            // Vạch răng cá mập StVO Zeichen 342 nhường đường khi vào vòng xuyến
            const numTeeth = 5;
            const toothW = (legW - 2) / numTeeth;
            for (let t = 0; t < numTeeth; t++) {
              const toothShape = new THREE.Shape();
              toothShape.moveTo(-toothW * 0.4, 0);
              toothShape.lineTo(toothW * 0.4, 0);
              toothShape.lineTo(0, toothW * 0.8);
              toothShape.closePath();
              const toothGeo = new THREE.ShapeGeometry(toothShape);
              const toothMesh = new THREE.Mesh(toothGeo, lineMat);
              toothMesh.rotation.x = -Math.PI / 2;
              toothMesh.rotation.z = angle;
              const tx = -legW / 2 + 1 + (t + 0.5) * toothW;
              const distFromCenter = outerR - 0.5;
              toothMesh.position.set(
                Math.sin(angle) * distFromCenter + Math.cos(angle) * tx,
                0.006,
                Math.cos(angle) * distFromCenter - Math.sin(angle) * tx
              );
              group.add(toothMesh);
            }
          });

          scenery.add(group);
          break;
        }
        case 'HILL_RAMP': {
          const rampWidth = width || 8.0;
          const rampLength = height || 36.0;
          const maxHeight = element.maxHeight || 1.1;

          const rampMesh = createHillRamp(0, 0, rampWidth, rampLength, maxHeight);
          rampMesh.position.set(centerX, 0, centerZ);
          rampMesh.rotation.y = rotRad;
          scenery.add(rampMesh);

          // Biển cảnh báo dốc 10% (StVO Zeichen 108: Steigung)
          const slopeSign = makeGermanStVOSign('PRIORITY', 10);
          slopeSign.position.set(centerX + rampWidth / 2 + 1.2, 0, centerZ + rampLength / 2);
          scenery.add(slopeSign);

          // Lưu thông tin ramp cho vật lý leo dốc & trôi dốc của xe
          customRamps.push({
            centerX,
            centerZ,
            width: rampWidth,
            length: rampLength,
            maxHeight,
            rotationDeg
          });
          break;
        }
        case 'JUNCTION_AMPEL':
        case 'INTERSECTION_4WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          // Intersection road base
          const intersection = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          intersection.rotation.x = -Math.PI / 2;
          intersection.receiveShadow = true;
          group.add(intersection);

          // Crosswalk lines around all 4 entrances
          const numStripes = 6;
          const stripeWidth = (width - 2) / numStripes;

          // Top and Bottom crosswalks
          [-height / 2 + 1.2, height / 2 - 1.2].forEach(cwZ => {
            for (let i = 0; i < numStripes; i += 2) {
              const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeWidth * 0.8, 1.2), lineMat);
              stripe.rotation.x = -Math.PI / 2;
              stripe.position.set(-width / 2 + 1 + i * stripeWidth + stripeWidth / 2, 0.005, cwZ);
              group.add(stripe);
            }
          });

          // Left and Right crosswalks
          [-width / 2 + 1.2, width / 2 - 1.2].forEach(cwX => {
            for (let i = 0; i < numStripes; i += 2) {
              const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, stripeWidth * 0.8), lineMat);
              stripe.rotation.x = -Math.PI / 2;
              stripe.position.set(cwX, 0.005, -height / 2 + 1 + i * stripeWidth + stripeWidth / 2);
              group.add(stripe);
            }
          });

          // Nếu có đèn tín hiệu giao thông (Ampel), đặt 4 cột đèn StVO § 37 ở 4 góc giao lộ
          if (element.hasTrafficLight || element.type === 'JUNCTION_AMPEL') {
            const tlPositions = [
              { x: width / 2 + 1.2, z: height / 2 + 1.2, rot: 0 },
              { x: -width / 2 - 1.2, z: height / 2 + 1.2, rot: Math.PI / 2 },
              { x: -width / 2 - 1.2, z: -height / 2 - 1.2, rot: Math.PI },
              { x: width / 2 + 1.2, z: -height / 2 - 1.2, rot: -Math.PI / 2 }
            ];
            tlPositions.forEach(pos => {
              const tl = makeTrafficLight(true);
              tl.position.set(pos.x, 0, pos.z);
              tl.rotation.y = pos.rot;
              group.add(tl);
            });
          }

          scenery.add(group);
          break;
        }
        case 'INTERSECTION_3WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const base = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          base.rotation.x = -Math.PI / 2;
          base.receiveShadow = true;
          group.add(base);

          const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(width - 2, 0.4), lineMat);
          stopLine.rotation.x = -Math.PI / 2;
          stopLine.position.set(0, 0.005, height / 2 - 1.2);
          group.add(stopLine);

          scenery.add(group);
          break;
        }
        case 'LAMP_POST': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.0, 12), poleMat);
          pole.position.y = 3.0;
          pole.castShadow = true;
          group.add(pole);

          const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), poleMat);
          arm.position.set(0.5, 5.8, 0);
          group.add(arm);

          const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
          bulb.position.set(1.0, 5.7, 0);
          group.add(bulb);

          const light = new THREE.SpotLight(0xfef08a, 1.2, 25, Math.PI / 4, 0.5, 1);
          light.position.set(1.0, 5.7, 0);
          light.target.position.set(1.0, 0, 0);
          group.add(light);
          group.add(light.target);

          scenery.add(group);
          break;
        }
        case 'PARKING_BAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const base = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cobbleMat);
          base.rotation.x = -Math.PI / 2;
          base.receiveShadow = true;
          group.add(base);

          const numStalls = Math.max(1, Math.floor(width / 3.0));
          const stallW = width / numStalls;
          for (let s = 0; s <= numStalls; s++) {
            const pLine = new THREE.Mesh(new THREE.PlaneGeometry(0.15, height), lineMat);
            pLine.rotation.x = -Math.PI / 2;
            pLine.position.set(-width / 2 + s * stallW, 0.005, 0);
            group.add(pLine);
          }

          // 🚗 Đỗ sẵn các xe ô tô bot trong ô đỗ xe bên đường
          const parkColors = [0x3b82f6, 0xef4444, 0x10b981, 0x64748b, 0x0f172a];
          const parkedCount = Math.min(numStalls, 3);
          for (let pIdx = 0; pIdx < parkedCount; pIdx++) {
            const parkedCar = createTrafficAICar(pIdx, parkColors[(pIdx + Math.floor(Math.abs(centerX))) % parkColors.length]);
            const stallX = -width / 2 + (pIdx + 0.5) * stallW;
            parkedCar.position.set(stallX, 0, 0);
            parkedCar.rotation.y = Math.PI / 2;
            group.add(parkedCar);
          }

          scenery.add(group);
          break;
        }
        case 'BUILDING': {
          const styleIdx = Math.floor(Math.abs(centerX * 7 + centerZ * 13)) % 3;
          const facadeTex = createBuildingFacadeTexture(0xe2e8f0, styleIdx);
          const bldgMat = new THREE.MeshStandardMaterial({
            map: facadeTex,
            roughness: 0.5
          });

          const bldgHeight = Math.max(10, element.bldgHeight || 16);
          const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, bldgHeight, height),
            bldgMat
          );
          building.position.set(centerX, bldgHeight / 2, centerZ);
          building.rotation.y = rotRad;
          building.castShadow = true;
          building.receiveShadow = true;
          scenery.add(building);
          break;
        }
        case 'SIDEWALK': {
          const sidewalk = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.15, height),
            swMat
          );
          sidewalk.position.set(centerX, 0.075, centerZ);
          sidewalk.rotation.y = rotRad;
          sidewalk.receiveShadow = true;
          scenery.add(sidewalk);
          break;
        }
        case 'TREE': {
          const treeGroup = new THREE.Group();
          const trunkM = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0 });
          const leafM = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });

          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.0, 8), trunkM);
          trunk.position.y = 1.5;
          trunk.castShadow = true;

          const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), leafM);
          leaves.position.y = 3.6;
          leaves.castShadow = true;

          treeGroup.add(trunk);
          treeGroup.add(leaves);
          treeGroup.position.set(centerX, 0, centerZ);
          treeGroup.rotation.y = rotRad;
          scenery.add(treeGroup);
          break;
        }
        case 'SIGN': {
          const signObj = makeGermanStVOSign(element.signType || 'SPEED_LIMIT', element.value || 50);
          signObj.position.set(centerX, 0, centerZ);
          signObj.rotation.y = rotRad;
          scenery.add(signObj);
          break;
        }
        case 'TRAFFIC_LIGHT': {
          const tlObj = makeTrafficLight(true);
          tlObj.position.set(centerX, 0, centerZ);
          tlObj.rotation.y = rotRad;
          scenery.add(tlObj);
          break;
        }
        case 'STOP_LINE': {
          // Vạch dừng xe StVO Zeichen 294 (Haltelinie)
          const group = new THREE.Group();
          group.position.set(centerX, 0.035, centerZ);
          group.rotation.y = rotRad;

          const stopLineW = width || 7.0;
          const stopLineH = height || 0.6; // Bề dày chuẩn StVO 50-60cm
          const stopMesh = new THREE.Mesh(new THREE.PlaneGeometry(stopLineW, stopLineH), lineMat);
          stopMesh.rotation.x = -Math.PI / 2;
          stopMesh.receiveShadow = true;
          group.add(stopMesh);

          scenery.add(group);
          break;
        }
        case 'ZEBRA': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.04, centerZ);
          group.rotation.y = rotRad;

          const numStripes = 6;
          const stripeWidth = width / numStripes;
          for (let i = 0; i < numStripes; i += 2) {
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeWidth * 0.85, height), lineMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(-width / 2 + i * stripeWidth + stripeWidth / 2, 0, 0);
            group.add(stripe);
          }
          scenery.add(group);
          break;
        }
        case 'SPAWN_POINT': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.05, centerZ);
          group.rotation.y = rotRad;

          const spawnBoxMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.5 });
          const spawnBox = new THREE.Mesh(new THREE.PlaneGeometry(width, height), spawnBoxMat);
          spawnBox.rotation.x = -Math.PI / 2;
          group.add(spawnBox);

          // Arrow indicating start direction
          const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const arrowBody = new THREE.Mesh(new THREE.PlaneGeometry(0.4, height * 0.5), arrowMat);
          arrowBody.rotation.x = -Math.PI / 2;
          arrowBody.position.set(0, 0.01, 0.2);
          group.add(arrowBody);

          scenery.add(group);
          break;
        }
        case 'BRANDENBURGER_TOR':
        case 'LANDMARK': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const stoneMat = new THREE.MeshStandardMaterial({ color: 0xdfd7c2, roughness: 0.8 });
          const roofMat = new THREE.MeshStandardMaterial({ color: 0xc4b59d, roughness: 0.7 });
          const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x22553b, metalness: 0.6, roughness: 0.4 });

          // Attic / Dầm mái trên cùng
          const attic = new THREE.Mesh(new THREE.BoxGeometry(28, 3.8, 7.5), roofMat);
          attic.position.y = 11.5;
          attic.castShadow = true;
          group.add(attic);

          // Cụm tượng cỗ xe tứ mã Quadriga trên đỉnh
          const quadriga = new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.2, 3.5), bronzeMat);
          quadriga.position.y = 14.8;
          quadriga.castShadow = true;
          group.add(quadriga);

          // 6 hàng cột trụ Doric tạo 5 cổng vòm
          const colXs = [-10.5, -6.3, -2.1, 2.1, 6.3, 10.5];
          colXs.forEach(cx => {
            [-2.2, 2.2].forEach(cz => {
              const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 9.8, 12), stoneMat);
              col.position.set(cx, 4.9, cz);
              col.castShadow = true;
              group.add(col);
            });
          });

          // Hai cánh cổng vây tường bên ngoài
          [-14.5, 14.5].forEach(wx => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(3.5, 8.5, 7.5), stoneMat);
            wing.position.set(wx, 4.25, 0);
            wing.castShadow = true;
            group.add(wing);
          });

          scenery.add(group);
          break;
        }
        case 'TRAM_STOP': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          // Bục chờ hành khách
          const platform = new THREE.Mesh(new THREE.BoxGeometry(width, 0.25, height), swMat);
          platform.position.y = 0.125;
          group.add(platform);

          // Mái che trạm tàu
          const shelterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
          const shelterRoof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.1, height * 0.5), shelterMat);
          shelterRoof.position.set(0, 3.2, 0);
          group.add(shelterRoof);

          // Cột đỡ mái
          [-height * 0.2, height * 0.2].forEach(pz => {
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), shelterMat);
            pole.position.set(0, 1.6, pz);
            group.add(pole);
          });

          // Biển hiệu Tram chữ T màu đỏ
          const signMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
          const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), signMat);
          signMesh.position.set(0, 3.8, 0);
          group.add(signMesh);

          scenery.add(group);
          break;
        }
        case 'BUS_STOP': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const bvgMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
          const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4, roughness: 0.1 });

          const roof = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, height * 0.6), bvgMat);
          roof.position.y = 2.8;
          group.add(roof);

          const backGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.7, height * 0.6), glassMat);
          backGlass.position.set(-width / 2 + 0.1, 1.35, 0);
          group.add(backGlass);

          // Biển tròn chữ H bến xe buýt StVO Zeichen 224
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 8), bvgMat);
          pole.position.set(width / 2 - 0.2, 1.5, height / 2);
          group.add(pole);

          const hSign = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), new THREE.MeshBasicMaterial({ color: 0x15803d }));
          hSign.rotation.x = Math.PI / 2;
          hSign.position.set(width / 2 - 0.2, 2.9, height / 2);
          group.add(hSign);

          scenery.add(group);
          break;
        }
        case 'PARKED_CAR': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const numCars = Math.max(1, Math.floor(height / 6));
          const parkColors = [0x2563eb, 0xdc2626, 0x475569, 0x1e293b, 0xffffff];
          for (let cIdx = 0; cIdx < numCars; cIdx++) {
            const pCar = createTrafficAICar(cIdx, parkColors[(cIdx + Math.floor(Math.abs(centerX))) % parkColors.length]);
            pCar.position.set(0, 0, -height / 2 + 3 + cIdx * 5.5);
            group.add(pCar);
          }

          scenery.add(group);
          break;
        }
        case 'CONSTRUCTION': {
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
          const barrier = new THREE.Mesh(new THREE.BoxGeometry(width, 0.8, 0.15), barMat);
          barrier.position.y = 0.6;
          group.add(barrier);

          const warnLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
          warnLight.position.set(0, 1.2, 0);
          group.add(warnLight);

          scenery.add(group);
          break;
        }
        case 'SHOP': {
          const bldgHeight = Math.max(10, element.bldgHeight || 14);
          const building = new THREE.Mesh(
            new THREE.BoxGeometry(width, bldgHeight, height),
            new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.6 })
          );
          building.position.set(centerX, bldgHeight / 2, centerZ);
          building.rotation.y = rotRad;
          scenery.add(building);

          const awningMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
          const awning = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.1, 2.0), awningMat);
          awning.position.set(centerX, 3.2, centerZ + height / 2 + 0.8);
          awning.rotation.x = 0.2;
          awning.rotation.y = rotRad;
          scenery.add(awning);
          break;
        }
        case 'JUNCTION_AMPEL': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;

          const interBase = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          interBase.rotation.x = -Math.PI / 2;
          interBase.receiveShadow = true;
          group.add(interBase);

          // 4 cột đèn tín hiệu ở 4 góc giao lộ
          const corners = [
            [-width / 2 + 1, -height / 2 + 1],
            [width / 2 - 1, -height / 2 + 1],
            [-width / 2 + 1, height / 2 - 1],
            [width / 2 - 1, height / 2 - 1]
          ];
          corners.forEach(([cx, cz]) => {
            const tl = makeTrafficLight(true);
            tl.position.set(cx, 0, cz);
            group.add(tl);
          });

          scenery.add(group);
          break;
        }
        case 'JUNCTION_4WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;
          const intersection = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          intersection.rotation.x = -Math.PI / 2;
          intersection.receiveShadow = true;
          group.add(intersection);
          scenery.add(group);
          break;
        }
        case 'JUNCTION_3WAY': {
          const group = new THREE.Group();
          group.position.set(centerX, 0.03, centerZ);
          group.rotation.y = rotRad;
          const base = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMat);
          base.rotation.x = -Math.PI / 2;
          base.receiveShadow = true;
          group.add(base);
          scenery.add(group);
          break;
        }
        case 'ARROW_STRAIGHT':
        case 'ARROW_LEFT':
        case 'ARROW_RIGHT': {
          // Mũi tên chỉ làn StVO Zeichen 297 sơn trắng trên mặt đường
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const arrowShape = new THREE.Shape();
          if (element.type === 'ARROW_STRAIGHT') {
            // Thân thẳng + đầu nhọn hướng tiến (Z. 297)
            arrowShape.moveTo(-0.18, -1.5);
            arrowShape.lineTo(-0.18, 0.6);
            arrowShape.lineTo(-0.55, 0.6);
            arrowShape.lineTo(0, 1.5);
            arrowShape.lineTo(0.55, 0.6);
            arrowShape.lineTo(0.18, 0.6);
            arrowShape.lineTo(0.18, -1.5);
            arrowShape.closePath();
          } else {
            // Thân dọc + cánh ngang + đầu mũi tên rẽ (Z. 297-10 / 297-20)
            const dir = element.type === 'ARROW_LEFT' ? -1 : 1;
            arrowShape.moveTo(-0.18, -1.5);
            arrowShape.lineTo(-0.18, 0.28);
            arrowShape.lineTo(dir * -1.2, 0.28);
            arrowShape.lineTo(dir * -1.2, 0.5);
            arrowShape.lineTo(dir * -1.75, 0.1);
            arrowShape.lineTo(dir * -1.2, -0.3);
            arrowShape.lineTo(0.18, -0.08);
            arrowShape.lineTo(0.18, -1.5);
            arrowShape.closePath();
          }

          const arrowGeo = new THREE.ShapeGeometry(arrowShape);
          const arrowMesh = new THREE.Mesh(arrowGeo, lineMat);
          arrowMesh.rotation.x = -Math.PI / 2;
          arrowMesh.position.y = 0.006;
          group.add(arrowMesh);

          scenery.add(group);
          break;
        }
        case 'PARK': {
          // Công viên xanh: thảm cỏ + lối đi + cây + ghế đá
          const group = new THREE.Group();
          group.position.set(centerX, 0, centerZ);
          group.rotation.y = rotRad;

          const lawn = new THREE.Mesh(new THREE.PlaneGeometry(width, height), grassMat);
          lawn.rotation.x = -Math.PI / 2;
          lawn.position.y = 0.01;
          lawn.receiveShadow = true;
          group.add(lawn);

          // Lối đi bộ vòng quanh mép công viên
          const pathMat = swMat;
          const pathW = 1.6;
          [
            [0, -height / 2 + pathW / 2, width, pathW],
            [0, height / 2 - pathW / 2, width, pathW]
          ].forEach(([px, pz, pw, ph]) => {
            const pathH = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), pathMat);
            pathH.rotation.x = -Math.PI / 2;
            pathH.position.set(px, 0.02, pz);
            pathH.receiveShadow = true;
            group.add(pathH);
          });
          [
            [-width / 2 + pathW / 2, 0],
            [width / 2 - pathW / 2, 0]
          ].forEach(([px, pz]) => {
            const pathV = new THREE.Mesh(new THREE.PlaneGeometry(pathW, height - pathW * 2), pathMat);
            pathV.rotation.x = -Math.PI / 2;
            pathV.position.set(px, 0.02, pz);
            pathV.receiveShadow = true;
            group.add(pathV);
          });

          // Cây trồng so le theo lưới, tránh đè lối đi mép
          const treeStepX = Math.max(6, width / 4);
          const treeStepZ = Math.max(6, height / 4);
          let rowIdx = 0;
          for (let tz = -height / 2 + pathW + 2.5; tz <= height / 2 - pathW - 2.5; tz += treeStepZ) {
            for (let tx = -width / 2 + pathW + 2.5; tx <= width / 2 - pathW - 2.5; tx += treeStepX) {
              const jitterX = ((rowIdx % 2) * 0.5 - 0.25) * treeStepX * 0.3;
              const tree = createParkTree(0.9 + ((rowIdx % 3) * 0.15));
              tree.position.set(tx + jitterX, 0, tz);
              group.add(tree);
              rowIdx++;
            }
          }

          // Ghế đá đặt dọc lối đi phía bắc & nam
          [
            [-width * 0.22, -height / 2 + pathW / 2 + 0.65, 0],
            [width * 0.22, -height / 2 + pathW / 2 + 0.65, 0],
            [-width * 0.22, height / 2 - pathW / 2 - 0.65, Math.PI],
            [width * 0.22, height / 2 - pathW / 2 - 0.65, Math.PI]
          ].forEach(([bx, bz, bRot]) => {
            const bench = createParkBench();
            bench.position.set(bx, 0, bz);
            bench.rotation.y = bRot;
            group.add(bench);
          });

          scenery.add(group);
          break;
        }
        case 'PROMENADE': {
          // Đại lộ đi bộ: sàn lát đá + hàng cây 2 bên + ghế nghỉ
          const group = new THREE.Group();
          group.position.set(centerX, 0.02, centerZ);
          group.rotation.y = rotRad;

          const promenadeFloor = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cobbleMat);
          promenadeFloor.rotation.x = -Math.PI / 2;
          promenadeFloor.receiveShadow = true;
          group.add(promenadeFloor);

          // Dải cỏ trung tâm tách luống đi bộ (Mitelstreifen)
          if (width >= 12) {
            const medianGrass = new THREE.Mesh(new THREE.PlaneGeometry(2.4, height - 4), grassMat);
            medianGrass.rotation.x = -Math.PI / 2;
            medianGrass.position.y = 0.005;
            medianGrass.receiveShadow = true;
            group.add(medianGrass);
          }

          // Hàng cây dọc 2 mép mỗi 8m, xen kẽ ghế đá giữa các cây
          const treeXs = width >= 12 ? [-(width / 2 - 1.4), width / 2 - 1.4] : [-(width / 2 - 1.2), width / 2 - 1.2];
          let promIdx = 0;
          for (let pz = -height / 2 + 4; pz <= height / 2 - 4; pz += 8) {
            treeXs.forEach(tx => {
              const tree = createParkTree(1.0 + ((promIdx % 2) * 0.12));
              tree.position.set(tx, 0, pz);
              group.add(tree);
            });
            if (promIdx % 2 === 1) {
              const bench = createParkBench();
              bench.position.set(0, 0, pz - 2);
              bench.rotation.y = Math.PI / 2;
              group.add(bench);
            }
            promIdx++;
          }

          // Cột đèn lồng dọc promenade
          const lampM = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.6 });
          const lampGlowM = new THREE.MeshBasicMaterial({ color: 0xfde68a });
          for (let pz = -height / 2 + 6; pz <= height / 2 - 6; pz += 12) {
            [-(width / 2 - 0.5), width / 2 - 0.5].forEach(lx => {
              const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 8), lampM);
              pole.position.set(lx, 1.8, pz);
              pole.castShadow = true;
              group.add(pole);

              const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), lampGlowM);
              lampHead.position.set(lx, 3.7, pz);
              group.add(lampHead);
            });
          }

          scenery.add(group);
          break;
        }
        default:
          break;
      }
    });
  }

  scene.add(scenery);

  let playerSpawnPos = { x: 3.5, z: 0 };

  // Ưu tiên sử dụng spawn point từ mapData nếu có
  if (mapData.mapInfo && mapData.mapInfo.spawnPoint) {
    console.log('🚗 Using spawn point from mapData:', mapData.mapInfo.spawnPoint);
    playerSpawnPos = {
      x: mapData.mapInfo.spawnPoint.x,
      z: mapData.mapInfo.spawnPoint.z,
      rotation: mapData.mapInfo.spawnPoint.rotation || 0
    };
  } else if (mapData.elements) {
    // Fallback: Tìm SPAWN_POINT hoặc đường đầu tiên nếu không có spawn point trong mapInfo
    const spawnEl = mapData.elements.find(el => el.type === 'SPAWN_POINT');
    if (spawnEl) {
      const isQuarterTurn = (spawnEl.rotation === 90 || spawnEl.rotation === 270);
      const effW = isQuarterTurn ? spawnEl.height : spawnEl.width;
      const effH = isQuarterTurn ? spawnEl.width : spawnEl.height;
      playerSpawnPos = {
        x: spawnEl.x + effW / 2,
        z: spawnEl.z + effH / 2,
        rotation: spawnEl.rotation || 0
      };
    } else {
      const firstRoad = mapData.elements.find(el => el.type === 'ROAD_STRAIGHT' || el.type === 'INTERSECTION_4WAY');
      if (firstRoad) {
        playerSpawnPos = {
          x: firstRoad.x + firstRoad.width / 2,
          z: firstRoad.z + firstRoad.height / 2,
          rotation: firstRoad.rotation || 0
        };
      }
    }
  }

  return {
    scenery,
    roadMat,
    crossStreetZ: [],
    config: mapData.mapInfo || { roadLength: 2000, maxSpeedLimit: 50 },
    isCustomMap: true,
    playerSpawnPos,
    disableSceneryMoving: true,
    ramps: customRamps
  };
}

// ── 4. CUSTOM MAP RELOAD HELPER ──────────────────────────────────────────────
export function reloadCustomMap(scene, mapData, playerCar, aiCars, trafficLights, refs) {
  if (!mapData) return;

  const oldScenery = scene.getObjectByName('customMapScenery');
  if (oldScenery) {
    scene.remove(oldScenery);
    oldScenery.clear();
  }

  aiCars.forEach(ai => scene.remove(ai.mesh));
  aiCars.length = 0;
  trafficLights.forEach(tl => scene.remove(tl.tl));
  trafficLights.length = 0;

  const { scenery, playerSpawnPos } = buildCustomMap(scene, mapData);

  console.log('🚗 Setting player car position to spawn point:', playerSpawnPos);
  playerCar.position.set(playerSpawnPos.x, 0, -playerSpawnPos.z);
  playerCar.rotation.y = -(playerSpawnPos.rotation || 0) * Math.PI / 180;
  playerCar.visible = true;

  refs.current.carX = playerSpawnPos.x;
  refs.current.carZ = playerSpawnPos.z;
  refs.current.heading = (playerSpawnPos.rotation || 0) * Math.PI / 180;
  refs.current.speed = 0;
  refs.current.isDriving = false;

  const cam = refs.current.camera || refs.current._camera;
  if (cam) {
    const spawnX = playerSpawnPos.x;
    const spawnZ = playerSpawnPos.z;
    const heading = (playerSpawnPos.rotation || 0) * Math.PI / 180;
    console.log('🎥 Setting camera position based on spawn point:', { spawnX, spawnZ });
    cam.position.set(
      spawnX - 5.2 * Math.sin(heading),
      2.2,
      -spawnZ + 5.2 * Math.cos(heading)
    );
    cam.lookAt(
      spawnX + 12 * Math.sin(heading),
      0.8,
      -spawnZ - 12 * Math.cos(heading)
    );
  }
}