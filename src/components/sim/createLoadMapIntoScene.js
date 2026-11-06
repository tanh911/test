// 🗺️ loadMapIntoScene — tách từ DrivingSimulation.jsx (refactor phase A4)
// Factory: trả về hàm (mapId, mapData) hot-swap map vào scene hiện có.
import { MAPS } from '../../simulation/data/index.js';
import { MAP_SCENARIOS, SCENARIOS } from '../../SimScenarios.js';
import { buildCityWorld, buildCustomMap } from '../environment.js';
import { disposeGroupDeep, snapSpawnToLaneCenter } from './simHelpers.js';
import { detectZoneForMap } from '../SaHinhMinimap.jsx';

export const createLoadMapIntoScene = ({ refs, scene, isPerformance, setPlayerCarWorldPos, setCurrentZone }) => (mapId, mapData) => {
  if (!scene) return;
  // 1. Dọn dẹp scenery cũ
  if (refs.current._scenery) {
    // GLB map (Autobahn_GLB_Model_blender_v2) nằm BÊN TRONG scenery group —
    // material/texture của nó do GLTFLoader tạo mới mỗi lần nạp → dispose sâu,
    // còn material procedural dùng shared cache toàn cục chỉ bỏ geometry.
    refs.current._scenery.traverse((o) => {
      if (o.name === 'Autobahn_GLB_Model_blender_v2') disposeGroupDeep(o, true);
    });
    disposeGroupDeep(refs.current._scenery, false);
    scene.remove(refs.current._scenery);
    refs.current._scenery = null;
  }
  // 2. Dọn dẹp xe AI cũ
  if (refs.current.aiCars && refs.current.aiCars.length > 0) {
    refs.current.aiCars.forEach(ai => {
      if (ai.mesh) scene.remove(ai.mesh);
    });
    refs.current.aiCars = [];
  }
  // Dọn dẹp TrafficAIManager cũ nếu có
  if (refs.current.trafficAIManager) {
    refs.current.trafficAIManager.clear();
    refs.current.trafficAIManager = null;
  }
  // 3. Dọn dẹp traffic lights cũ
  if (refs.current.trafficLights && refs.current.trafficLights.length > 0) {
    refs.current.trafficLights.forEach(item => {
      if (item.tl) scene.remove(item.tl);
    });
    refs.current.trafficLights = [];
  }

  // 4. Xây dựng môi trường bản đồ mới
  const { scenery, roadMat, crossStreetZ, config, disableSceneryMoving, playerSpawnPos, colliders, ramps } =
    (mapId === 'custom_map' && mapData)
      ? buildCustomMap(scene, mapData, { isPerformance })
      : buildCityWorld(scene, mapId, { isPerformance });

  refs.current._scenery = scenery;
  refs.current._roadMat = roadMat;
  refs.current._crossStreetZ = crossStreetZ;
  refs.current._LOOP = config?.roadLength || 2000;
  refs.current._mapConfig = config;
  refs.current._disableSceneryMoving = disableSceneryMoving !== undefined ? disableSceneryMoving : true;
  const isAutobahnMap = mapId === 'autobahn_a9' || mapId === 'autobahn_a' || mapId === 'AUTOBAHN' || mapId === 'training_circuit' || (mapId || '').toLowerCase().includes('autobahn') || (mapId || '').toLowerCase().includes('training') || (mapId || '').toLowerCase().includes('training');
  // ✅ HOÀN THIỆN VA CHẠM: bật full hitbox (xe AI, world colliders, hộ lan cao tốc).
  // 3 giây miễn nhiễm lúc mới vào map (set tại khối spawn bên dưới) chống va chạm nhầm lúc spawn.
  refs.current._disableCollisionCheck = false;
  refs.current._isAutobahnMap = isAutobahnMap;
  refs.current._mapLoadTime = performance.now(); // Chống loop-back boundary teleport ngay sau spawn
  refs.current.worldColliders = colliders || []; // Nạp colliders world-space do district builder trả về (trước đây bị bỏ trống → hệ thống va chạm chết)
  refs.current._ramps = ramps || [];
  refs.current.playerSpawnPos = playerSpawnPos;

  // 5. Định vị xe người lái tại điểm Spawn chuẩn xác
  const currentMapDef = MAPS[mapId];
  const activeEx = refs.current.selectedExercise || selectedExercise;
  let spawnX = 3.5;
  let spawnZ = 0;
  let spawnRot = 0;

  const isCurrentStadt = (mapId === 'stadt_zentrum' || mapId === 'STADT' || mapId === 'stadt');
  const isLandMap = (mapId || '').toLowerCase().includes('land') || mapId === 'landstrasse_b2';
  if (isCurrentStadt) {
    // 🏙️ Berlin-Mitte: Khóa 1 vị trí spawn cố định duy nhất chuẩn StVO
    spawnX = BERLIN_FIXED_SPAWN.x;
    spawnZ = BERLIN_FIXED_SPAWN.z;
    spawnRot = BERLIN_FIXED_SPAWN.rot;
  } else if (isLandMap && (scene.userData.roadGen?.laneGraph || scenery.userData.roadGen?.laneGraph)) {
    // 🌲 Landstraße: đồ đường OSM nằm xa gốc toạ độ (bounds ±6km) trong khi spawn mặc định
    // (2, 0) rơi ra CÁNH ĐỒNG không có đường → snap người chơi xuống làn đường chính gần nhất
    // (ưu tiên B2/primary) theo LaneGraph, kèm hướng tiến dọc làn (trước đây đứng trên cỏ)
    const laneGraph = scene.userData.roadGen?.laneGraph || scenery.userData.roadGen?.laneGraph;
    const lanes = laneGraph?.lanes || [];
    const isMajorLane = (l) => /B\s?2|primary|trunk/i.test(l.roadName || '');
    // Toàn bộ đồ đường OSM của Land nằm lệch xa gốc toạ độ (đường gần nhất ~511m) nên:
    // 1) Ưu tiên tuyệt đối đường chính B2/primary (dù phải dịch spawn vài km)
    // 2) Fallback: lane bất kỳ trong bán kính 2km — tuyệt đối không để người chơi đứng trên cỏ
    const majorLanes = lanes.filter(isMajorLane);
    const pickBest = (pool) => {
      // Chọn điểm giữa của segment DÀI (>60m) — tránhspawn sát ngã tư/vạch dấu khiến
      // giám khảo examiner trừ điểm vi phạm liên tục khi người chơi vừa vào map
      let bestMid = null;
      for (const lane of pool) {
        const pts = lane.drivableWaypoints || lane.centerline;
        if (!pts || pts.length < 2) continue;
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, az] = pts[i];
          const [bx, bz] = pts[i + 1];
          const dx = bx - ax, dz = bz - az;
          const lenSq = dx * dx + dz * dz;
          if (lenSq === 0) continue;
          const L = Math.sqrt(lenSq);
          if (L > 60) {
            const mx = ax + dx * 0.5, mz = az + dz * 0.5;
            const d = Math.hypot(spawnX - mx, spawnZ - mz);
            if (!bestMid || d < bestMid.dist) {
              const ux = dx / L, uz = dz / L;
              bestMid = { dist: d, x: mx, z: mz, rot: Math.atan2(ux, -uz), roadName: lane.roadName };
            }
          }
        }
      }
      if (bestMid) return bestMid;
      // Fallback: điểm chiếu gần nhất trên mọi segment
      let best = null;
      for (const lane of pool) {
        const pts = lane.drivableWaypoints || lane.centerline;
        if (!pts || pts.length < 2) continue;
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, az] = pts[i];
          const [bx, bz] = pts[i + 1];
          const dx = bx - ax, dz = bz - az;
          const lenSq = dx * dx + dz * dz;
          if (lenSq === 0) continue;
          let t = ((spawnX - ax) * dx + (spawnZ - az) * dz) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const d = Math.hypot(spawnX - (ax + t * dx), spawnZ - (az + t * dz));
          if (!best || d < best.dist) {
            const L = Math.sqrt(lenSq);
            const ux = dx / L, uz = dz / L;
            best = { dist: d, x: ax + t * dx, z: az + t * dz, rot: Math.atan2(ux, -uz), roadName: lane.roadName };
          }
        }
      }
      return best;
    };
    const best = pickBest(majorLanes) || pickBest(lanes);
    if (best) {
      spawnX = best.x;
      spawnZ = best.z;
      spawnRot = best.rot;
      console.log(`[Landstrasse] 🎯 Spawn snapped onto road "${best.roadName}" (offset ${Math.round(best.dist)}m)`);
    }
  } else if (activeEx && currentMapDef?.spawnPoints?.[activeEx.startPoint]) {
    const sp = currentMapDef.spawnPoints[activeEx.startPoint];
    spawnX = sp.x;
    spawnZ = sp.z;
    spawnRot = (sp.rotation || 0) * Math.PI / 180;
  } else if (playerSpawnPos) {
    spawnX = playerSpawnPos.x;
    spawnZ = playerSpawnPos.z;
    spawnRot = (playerSpawnPos.rotation || 0) * Math.PI / 180;
  } else if (currentMapDef?.spawnPoints?.start) {
    spawnX = currentMapDef.spawnPoints.start.x;
    spawnZ = currentMapDef.spawnPoints.start.z;
    spawnRot = (currentMapDef.spawnPoints.start.rotation || 0) * Math.PI / 180;
  }

  // 🎯 Căn người chơi vào tâm làn cùng hướng (PBF maps có LaneGraph)
  const spawnLaneGraph = scene.userData.roadGen?.laneGraph || scenery.userData.roadGen?.laneGraph;
  if (spawnLaneGraph) {
    const snapped = snapSpawnToLaneCenter(spawnLaneGraph, spawnX, spawnZ, spawnRot);
    spawnX = snapped.x;
    spawnZ = snapped.z;
    spawnRot = snapped.rot;
  }

  const absZ = Math.abs(spawnZ);
  const initCarZ = refs.current._disableSceneryMoving ? -spawnZ : absZ;
  // Map Land & Autobahn spawn rất xa gốc toạ độ (|z| vài trăm tới vài nghìn mét) —
  // quãng đường scenario đo bằng ODOMETER (tích lũy thật), reset khi nạp map.
  refs.current._odoDist = 0;
  refs.current._scenarioBaseZ = (isLandMap || isAutobahnMap) ? Math.abs(initCarZ) : undefined;
  refs.current.carX = spawnX;
  refs.current.carZ = initCarZ;
  refs.current.distanceTraveled = Math.abs(initCarZ);
  refs.current.speed = 0;
  refs.current.targetSpeed = 0;
  refs.current.steer = 0;
  refs.current.targetSteer = 0;
  refs.current.heading = spawnRot;
  refs.current.collisionOccurred = false;
  refs.current._collisionImmunityUntil = Date.now() + 3000; // 3 seconds immunity on map entry

  const pCar = refs.current.playerCar || playerCar;
  if (pCar) {
    pCar.position.set(spawnX, 0, refs.current._disableSceneryMoving ? spawnZ : 0);
    pCar.rotation.set(0, -spawnRot, 0);
  }
  if (refs.current._scenery && !refs.current._disableSceneryMoving) {
    refs.current._scenery.position.z = absZ;
  }

  // Cập nhật tọa độ thực tế cho Radar Minimap & Dynamic Zone
  const initWorldZ = refs.current._disableSceneryMoving ? spawnZ : -absZ;
  setPlayerCarWorldPos({ x: spawnX, z: initWorldZ, heading: spawnRot });
  const isStadtEnv = (mapId === 'stadt_zentrum' || mapId === 'STADT' || mapId === 'stadt');
  if (isStadtEnv) {
    roadNetwork.init(roadGraphData);
    examinerEngine.startMultiStageExam({ x: spawnX, z: initWorldZ, heading: spawnRot }, 5);
    setActiveDirective(examinerEngine.currentDirective);
    setExaminerScore(100);
    setExaminerFeedback(null);
  } else if ((mapId || '').toLowerCase().includes('autobahn')) {
    // 🛣️ Index đồ thị đường OSM thật của A2 cho Telemetry & Zone detection
    const autobahnGraph = scene.userData.roadGraphData || scenery.userData.roadGraphData;
    if (autobahnGraph) {
      roadNetwork.init(autobahnGraph);
    }
    setActiveDirective({
      id: 'autobahn_directive_1',
      titleVi: '1. Cao Tốc Autobahn A2 (Auffahrt Rhynern)',
      titleDe: '1. Autobahn A2 · Richtgeschwindigkeit 130 km/h',
      descVi: 'Tăng tốc nhập làn an toàn (Beschleunigungsstreifen) · Tốc độ đề xuất 130 km/h.',
      descDe: 'Richtgeschwindigkeit 130 km/h · Rechtsfahrgebot & Standstreifen beachten.',
      icon: '🛣️'
    });
    setExaminerScore(100);
    setExaminerFeedback(null);
  }
  const initZone = detectZoneForMap(mapId, spawnX, initWorldZ);
  setCurrentZone(initZone);
  refs.current._lastZoneId = initZone?.id;

  const cam = refs.current.camera || camera;
  if (cam) {
    const isAutobahnMap = mapId === 'autobahn_a9' || mapId === 'autobahn_a' || mapId === 'AUTOBAHN' || mapId === 'training_circuit' || (mapId || '').toLowerCase().includes('autobahn') || (mapId || '').toLowerCase().includes('training') || (mapId || '').toLowerCase().includes('training');
    cam.far = isAutobahnMap ? 3500 : 1500;
    cam.updateProjectionMatrix();

    // Giữ Sky mesh trong tầm nhìn sau khi far thay đổi theo map (tránh bị cắt mất trời)
    const skyMesh = scene.children.find(c => c.name === 'physicalSky');
    if (skyMesh) skyMesh.scale.setScalar(Math.max(260, cam.far * 0.9));

    if (isAutobahnMap && scene) {
      // Fog màu chân trời khớp sky texture (#e4eff9) để chân trời liền mạch
      scene.fog = new THREE.Fog(0xdcecf8, 500, 3600);
      // autobahnDistrict đã đặt scene.background = sky texture equirect — chỉ fallback màu
      if (!scene.userData.autobahnSkyTexture) {
        scene.background = new THREE.Color(0xdcecf8);
      }
    }

    cam.position.set(
      spawnX - 5.2 * Math.sin(spawnRot),
      2.2,
      initWorldZ + 5.2 * Math.cos(spawnRot)
    );
    cam.lookAt(
      spawnX + 12 * Math.sin(spawnRot),
      0.8,
      initWorldZ - 12 * Math.cos(spawnRot)
    );
  }

  // 6. Traffic lights cho các kịch bản (Không áp dụng cho Stadt & PBF maps vì đã có StVO procedural lights)
  const isPbfMapEnv = mapId === 'stadt_zentrum' || mapId === 'landstrasse_b2' || mapId === 'autobahn_a9' || (mapId || '').toLowerCase().includes('autobahn') || (mapId || '').toLowerCase().includes('land') || (mapId || '').toLowerCase().includes('training');
  if (mapId !== 'custom_map' && !isCurrentStadt && !isPbfMapEnv) {
    const mapScenarios = (currentMapDef && MAP_SCENARIOS[mapId]) ? MAP_SCENARIOS[mapId] : Object.values(SCENARIOS);
    mapScenarios
      .filter(s => s.type === 'TRAFFIC_LIGHT')
      .forEach(s => {
        const tl = makeTrafficLight(true);
        tl.position.set(spawnX + 5.5, 0, absZ - s.triggerZ - 4);
        scene.add(tl);
        refs.current.trafficLights.push({ tl, scenario: s });
      });
  }

  // 7. Sinh xe AI giao thông nếu có (giảm còn 3 xe trên mobile/performance để tránh giật lag)
  const isSaHinh = mapId === 'sa_hinh_fahrschule';
  const isStadt = mapId === 'stadt_zentrum' || mapId === 'STADT' || mapId === 'stadt';
  const shouldSpawnTraffic = !isSaHinh && (currentMapDef?.traffic?.enabled !== false);

  if (isStadt) {
    // 🚦 Kích hoạt Hệ thống Giao thông Chuẩn Luật Đức StVO (Berlin-Mitte Traffic Engine)
    // Gom mật độ xe bot dày đặc quanh điểm xuất phát thay vì rải đều 2km+ mạng đường OSM
    const trafficMgr = new TrafficAIManager(scene, isPerformance);
    trafficMgr.init(mapId, null, null, { x: spawnX, z: initWorldZ });
    refs.current.trafficAIManager = trafficMgr;

    // 🚗 XE ĐỖ LỀ ĐƯỜNG Berlin-Mitte: phố phải có xe đỗ hai bên mới có "cảm giác
    // tham gia giao thông". Đặt xe tĩnh dọc corridor (dùng lại mesh bot — rẻ),
    // cách ~34m một slot, random 45% bỏ slot, bán kính 420m quanh spawn.
    // Add vào scenery group → tự động dọn khi switch map (đã có disposeGroupDeep).
    if (!isPerformance && refs.current._scenery) {
      try {
        const PARK_COLORS = ['#94a3b8', '#e2e8f0', '#334155', '#7f1d1d', '#1e3a5f', '#475569', '#b45309'];
        let parked = 0;
        for (const corridor of BERLIN_MITTE_TRAFFIC_CORRIDORS) {
          const wps = corridor.waypoints || [];
          if (wps.length < 4) continue;
          let acc = 0;
          for (let i = 0; i < wps.length - 1 && parked < 26; i++) {
            const ax = wps[i][0], az = wps[i][1];
            const bx = wps[i + 1][0], bz = wps[i + 1][1];
            const segLen = Math.hypot(bx - ax, bz - az);
            if (segLen < 0.01) continue;
            acc += segLen;
            if (acc < 34) continue;
            acc = 0;
            if (Math.random() < 0.45) continue;
            const ux = (bx - ax) / segLen, uz = (bz - az) / segLen;
            const side = Math.random() < 0.5 ? 1 : -1;
            const off = (corridor.laneOffset || 3) + 2.2;
            const px = bx + (-uz) * side * off;
            const pz = az + ux * side * off;
            if (Math.hypot(px - spawnX, pz - initWorldZ) > 420) continue;
            const pm = createTrafficAICar(parked % 5, PARK_COLORS[parked % PARK_COLORS.length]);
            pm.position.set(px, 0.02, pz);
            pm.rotation.y = Math.atan2(ux, uz);
            refs.current._scenery.add(pm);
            parked++;
          }
        }
        console.log('[Stadt] 🚗 Parked cars:', parked);
      } catch (e) {
        console.warn('[Stadt] parked cars error:', e?.message);
      }
    }
  } else if (mapId === 'autobahn_a9' || mapId === 'autobahn_a' || mapId === 'AUTOBAHN' || mapId === 'training_circuit' || (mapId || '').toLowerCase().includes('autobahn') || (mapId || '').toLowerCase().includes('training') || (mapId || '').toLowerCase().includes('training')) {
    // 🏎️ AI Traffic trên Autobahn A2: xe bot chạy theo đúng làn thật từ LaneGraph
    // (motorway + ramps) + cả corridor ĐƯỜNG PHỐ quanh điểm spawn (Rhynern) —
    // route vòng phố → Auffahrt → A2 → Ausfahrt có xe thực hành ở cả 2 phía.
    const laneGraph = scene.userData.roadGen?.laneGraph || scenery.userData.roadGen?.laneGraph;
    if (laneGraph && typeof laneGraph.getDrivableCorridors === 'function') {
      const allCorridors = laneGraph.getDrivableCorridors();
      const centroidOf = (c) => {
        let sx = 0, sz = 0;
        for (const w of c.waypoints) { sx += w[0]; sz += w[1]; }
        return [sx / Math.max(1, c.waypoints.length), sz / Math.max(1, c.waypoints.length)];
      };
      const abFocus = playerSpawnPos ? { x: playerSpawnPos.x, z: playerSpawnPos.z } : { x: spawnX, z: initWorldZ };

      // 🧹 LỌC MẢNH VỤN: LaneGraph chỉ ra ~300 mảnh ngắn (median 24m) quanh nút giao —
      // trước đây 164 corridor A2 (gồm mảnh chồng toạ độ) → bot spawn đè nhau (minPair 0m)
      // rồi đứng phanh sau nhau vĩnh viễn → "20/26 bot kẹt". Chỉ giữ mảnh dài đủ dùng
      // (A2 ≥ 200m, phố ≥ 80m) + dedupe trọng tâm.
      const motorCandidates = allCorridors.filter(c =>
        ((c.lane?.roadName || '').includes('A 2') || (c.lane?.roadName || '').includes('A2')
          || (c.speedLimitKmH || 0) >= 90) && (c.totalLength || 0) >= 200
      );
      const motorCorridors = [];
      for (const c of motorCandidates) {
        const mid = centroidOf(c);
        const tooClose = motorCorridors.some(prev => {
          const pm = centroidOf(prev);
          return Math.hypot(mid[0] - pm[0], mid[1] - pm[1]) < 120;
        });
        if (!tooClose) motorCorridors.push(c);
      }

      // ➕ Corridor phố gần spawn (≤ 450m): mảnh ≥ 80m + dedupe trọng tâm ≥ 80m, tối đa 14
      const cityCandidates = allCorridors.filter(c => {
        if (motorCorridors.includes(c)) return false;
        if ((c.totalLength || 0) < 80) return false;
        // Chỉ corridor đường PHỐ (loại trừ motorway/link — đã có ở nhóm A2)
        if (c.lane?.highway && ['motorway', 'trunk', 'motorway_link'].includes(c.lane.highway)) return false;
        let best = Infinity;
        for (const w of c.waypoints) {
          const dd = Math.hypot(w[0] - abFocus.x, w[1] - abFocus.z);
          if (dd < best) best = dd;
        }
        return best <= 450;
      });
      const cityNearCorridors = [];
      for (const c of cityCandidates) {
        if (cityNearCorridors.length >= 14) break;
        const mid = centroidOf(c);
        const tooClose = cityNearCorridors.some(prev => {
          const pm = centroidOf(prev);
          return Math.hypot(mid[0] - pm[0], mid[1] - pm[1]) < 80;
        });
        if (!tooClose) cityNearCorridors.push(c);
      }
      const chosenCorridors = [
        ...(motorCorridors.length > 0 ? motorCorridors : allCorridors.filter(c => (c.totalLength || 0) >= 200)),
        ...cityNearCorridors
      ];
      const trafficMgr = new TrafficAIManager(scene, isPerformance);
      trafficMgr.init('autobahn_a9', chosenCorridors, null, abFocus);
      refs.current.trafficAIManager = trafficMgr;
      console.log(`[Autobahn] 🚗 Spawned ${trafficMgr.botCars.length} AI cars on ${chosenCorridors.length} lanes (${motorCorridors.length} A2 + ${cityNearCorridors.length} phố Rhynern)`);
    }
  } else if ((mapId || '').toLowerCase().includes('land') || mapId === 'landstrasse_b2') {
    // 🌲 AI Traffic trên Landstraße B2: dùng đúng LaneGraph của district (2 chiều, mỗi chiều 1 làn)
    const laneGraph = scene.userData.roadGen?.laneGraph || scenery.userData.roadGen?.laneGraph;
    if (laneGraph && typeof laneGraph.getDrivableCorridors === 'function') {
      const allLandCorridors = laneGraph.getDrivableCorridors();
      // LaneGraph Land gồm hàng trăm mảnh segment ngắn rải khắp bbox OSM 11km — chỉ chọn
      // các corridor đi qua gần người chơi, nếu không xe bot sẽ sinh ở những mảnh xa 2km+
      const landFocus = { x: spawnX, z: initWorldZ };
      const nearCorridors = allLandCorridors.filter(c => {
        let best = Infinity;
        for (const w of c.waypoints) {
          const d = Math.hypot(w[0] - landFocus.x, w[1] - landFocus.z);
          if (d < best) best = d;
        }
        return best <= 300;
      });
      const chosenCorridors = nearCorridors.length > 0 ? nearCorridors : allLandCorridors;
      if (chosenCorridors.length > 0) {
        const trafficMgr = new TrafficAIManager(scene, isPerformance);
        trafficMgr.init(mapId, chosenCorridors, null, landFocus);
        refs.current.trafficAIManager = trafficMgr;
        console.log(`[Landstrasse] 🚗 Spawned ${trafficMgr.botCars.length} AI cars on ${chosenCorridors.length}/${allLandCorridors.length} lanes near player`);
      }
    }
  } else if (shouldSpawnTraffic) {
    const isAutobahn = mapId === 'autobahn_a9' || mapId === 'autobahn_a' || mapId === 'AUTOBAHN';
    const customCorridors = (mapId === 'custom_map' && mapData && Array.isArray(mapData.elements))
      ? buildCorridorsFromMapElements(mapData.elements, mapData.mapInfo?.maxSpeedLimit || 50)
      : null;

    if (customCorridors && customCorridors.length > 0) {
      // 🛠️ Map tùy chỉnh (Map Editor): xe bot bám theo đúng các đoạn đường thẳng của map
      const trafficMgr = new TrafficAIManager(scene, isPerformance);
      trafficMgr.init('custom_map', customCorridors, null, { x: spawnX, z: initWorldZ });
      refs.current.trafficAIManager = trafficMgr;
      console.log(`[CustomMap] 🚗 Spawned ${trafficMgr.botCars.length} AI cars on ${customCorridors.length} custom lanes`);
    } else {
      const aiColors = [0xef4444, 0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b, 0x06b6d4, 0xeab308];
      const spawnDistances = isPerformance
        ? (isAutobahn ? [-150, -400, -800] : [-70, -180, -350])
        : (isAutobahn
          ? [-120, -260, -420, -600, -850, -1150, -1500, -1900]
          : [-60, -120, -180, -260, -340, -450, -600, -800]);
      spawnDistances.forEach((zPos, index) => {
        const aiMesh = createTrafficAICar(index, aiColors[index % aiColors.length]);
        const isOppositeLane = index % 2 === 0;
        let initialX;
        let baseSpeed;
        if (isAutobahn) {
          const laneChoice = index % 3;
          const laneX = laneChoice === 0 ? 11.5 : (laneChoice === 1 ? 7.5 : 3.5);
          initialX = isOppositeLane ? -laneX : laneX;
          baseSpeed = laneChoice === 0 ? 25.0 : (laneChoice === 1 ? 33.0 : 40.0);
        } else {
          initialX = isOppositeLane ? -3.2 : 4.8;
          baseSpeed = 13.8;
        }
        aiMesh.position.set(initialX, 0, zPos);
        if (isOppositeLane) aiMesh.rotation.y = Math.PI;
        scene.add(aiMesh);
        refs.current.aiCars.push({
          mesh: aiMesh,
          initialZ: zPos,
          baseSpeed,
          currentSpeed: baseSpeed,
          isOpposite: isOppositeLane
        });
      });
    }
  }

  // 8. Non-blocking compile
  setTimeout(() => {
    const rend = refs.current.renderer || renderer;
    const sc = refs.current.scene || scene;
    const c = refs.current.camera || camera;
    if (rend && sc && c) {
      try { rend.compile(sc, c); } catch (e) { }
    }
  }, 60);
};
