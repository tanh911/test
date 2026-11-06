import * as THREE from 'three';
import { ProceduralRoadGenerator } from '../simulation/proceduralRoadGenerator.js';
import roadGraphStadt from '../simulation/data/road_graph.json';
import { TrafficRuleResolver } from '../simulation/legal/TrafficRuleResolver.js';
import trafficRulesBerlin from '../simulation/data/traffic_rules_berlin.json';
import { examinerEngine } from '../simulation/ExaminerRuleEngine.js';
import { makeGermanSign, makeTrafficLight } from './3dObjects.js';
import { buildLandstrasseDistrict } from './landstrasseDistrict.js';
import { buildAutobahnDistrict } from './autobahnDistrict.js';

/**
 * 🏙️ BERLIN MITTE (STADT ZENTRUM) DISTRICT BUILDER (PBF Map Engine)
 * Renders city center road network, traffic signals, STOP/Yield signs, pedestrian crosswalks, urban buildings.
 */
export function buildBerlinMitteDistrict(
  scene,
  scenery,
  colliders,
  sharedMaterials,
  isPerformance,
  _config,
  mapType = 'stadt_zentrum'
) {
  if (!scenery) {
    throw new Error('[BerlinMitteDistrict] scenery group is required.');
  }

  const effectiveMapType = mapType || _config?.mapType || 'stadt_zentrum';

  if (effectiveMapType === 'landstrasse_b2' || effectiveMapType === 'land' || effectiveMapType === 'LANDSTRASSE') {
    return buildLandstrasseDistrict(scene, scenery, colliders, sharedMaterials, isPerformance, _config);
  }
  if (effectiveMapType === 'autobahn_a9' || effectiveMapType === 'autobahn_a' || effectiveMapType === 'autobahn' || effectiveMapType === 'AUTOBAHN') {
    return buildAutobahnDistrict(scene, scenery, colliders, sharedMaterials, isPerformance, _config);
  }

  const roadGraphData = roadGraphStadt;
  const roadGen = new ProceduralRoadGenerator(
    scenery,
    sharedMaterials
  );

  try {
    roadGen.buildFromRoadGraph(roadGraphData);
    console.log(`[BerlinMitteDistrict] ✅ buildFromRoadGraph OK for mapType: ${mapType}`);
  } catch (err) {
    console.error('[BerlinMitteDistrict] ❌ buildFromRoadGraph FAILED:', err);
    console.error('Stack:', err.stack);
    throw err;
  }

  const ruleResolver = new TrafficRuleResolver(
    roadGen.laneGraph,
    trafficRulesBerlin
  );

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

  // 🚦 REGISTER ALL TRAFFIC LIGHT JUNCTIONS & 3D SIGNALS
  const trafficLightMgr = (typeof window !== 'undefined' && window.refs?.current?.trafficLightManager) || null;
  const junctions = Array.isArray(roadGraphData?.junctions) ? roadGraphData.junctions : [];
  const signsGroup = new THREE.Group();
  signsGroup.name = 'PBF_StVO_Signs_3D';

  let totalSignalCount = 0;
  let totalSignCount = 0;

  // Center coordinate of spawn (Friedrichstraße / Unter den Linden)
  const spawnX = 2.5;
  const spawnZ = 25.0;
  const maxRenderRadius = isPerformance ? 750 : 2500;

  junctions.forEach((j) => {
    if (!j || !j.center) return;
    const [jx, jz] = j.center;

    if (j.hasTrafficLight && trafficLightMgr) {
      trafficLightMgr.registerJunction(j);
    }

    const distToSpawn = Math.hypot(jx - spawnX, jz - spawnZ);
    if (distToSpawn > maxRenderRadius) return;

    if (j.hasTrafficLight) {
      const corners = [
        { x: jx - 5.5, z: jz - 5.5, rot: 0 },
        { x: jx + 5.5, z: jz + 5.5, rot: Math.PI }
      ];

      corners.forEach((c, idx) => {
        const tlMesh = makeTrafficLight(idx % 2 === 0);
        tlMesh.position.set(c.x, 0, c.z);
        tlMesh.rotation.y = c.rot;
        tlMesh.userData = { type: 'TRAFFIC_LIGHT', junctionId: j.id, signCode: 'VZ_AMPEL' };
        signsGroup.add(tlMesh);
        if (trafficLightMgr) {
          trafficLightMgr.addMeshToJunction(j.id, tlMesh);
        }
        totalSignalCount++;
      });
    }

    if (j.hasStopSign) {
      const stopSign = makeGermanSign('STOP_SIGN');
      stopSign.position.set(jx + 4.5, 0, jz + 4.5);
      stopSign.userData = { type: 'SIGN', signCode: 'VZ_206', paragraph: '§ 41 StVO' };
      stopSign.name = `StVO_StopSign_${j.id}`;
      signsGroup.add(stopSign);
      totalSignCount++;
    } else if (j.hasYieldSign) {
      const yieldSign = makeGermanSign('NO_U_TURN');
      yieldSign.position.set(jx - 4.5, 0, jz - 4.5);
      yieldSign.userData = { type: 'SIGN', signCode: 'VZ_205', paragraph: '§ 41 StVO' };
      yieldSign.name = `StVO_YieldSign_${j.id}`;
      signsGroup.add(yieldSign);
      totalSignCount++;
    }
  });

  // Render 3D statutory signs from traffic_rules_berlin.json
  const rules = Array.isArray(trafficRulesBerlin?.rules) ? trafficRulesBerlin.rules : [];
  const roadMap = new Map();
  if (Array.isArray(roadGraphData?.roads)) {
    roadGraphData.roads.forEach(r => roadMap.set(r.id, r));
  }

  rules.forEach((rule) => {
    if (!rule || !rule.roadId) return;
    const road = roadMap.get(rule.roadId);
    if (!road || !Array.isArray(road.centerline) || road.centerline.length < 2) return;

    const [pt1, pt2] = road.centerline;
    const sx = (pt1[0] + pt2[0]) / 2 + 3.5;
    const sz = (pt1[1] + pt2[1]) / 2 + 3.5;

    const distToSpawn = Math.hypot(sx - spawnX, sz - spawnZ);
    if (distToSpawn > maxRenderRadius) return;

    let signType = 'SPEED_LIMIT';
    let val = 30;
    if (rule.type === 'MAX_SPEED') {
      val = rule.value || 30;
    } else if (rule.type === 'STOP') {
      signType = 'STOP_SIGN';
    } else if (rule.type === 'NO_U_TURN') {
      signType = 'NO_U_TURN';
    }

    const signMesh = makeGermanSign(signType, val);
    signMesh.position.set(sx, 0, sz);
    signMesh.userData = { type: 'SIGN', signCode: rule.sign?.code || 'VZ_274', ruleId: rule.id };
    signMesh.name = `StVO_ExplicitSign_${rule.id}`;
    signsGroup.add(signMesh);
    totalSignCount++;
  });

  scenery.add(signsGroup);
  console.log(`[BerlinMitteDistrict] 🚦 Rendered ${totalSignalCount} Signals & ${totalSignCount} 3D StVO Signs`);

  const bounds = roadGraphData?.metadata?.bounds;

  if (
    bounds &&
    Number.isFinite(bounds.minX) &&
    Number.isFinite(bounds.maxX) &&
    Number.isFinite(bounds.minZ) &&
    Number.isFinite(bounds.maxZ) &&
    Array.isArray(colliders)
  ) {
    colliders.push({
      id: 'osm_pbf_perimeter_boundary',
      type: 'fence',
      shape: 'boundary',
      minX: bounds.minX,
      maxX: bounds.maxX,
      minZ: bounds.minZ,
      maxZ: bounds.maxZ,
      gateMinX: 0,
      gateMaxX: 0,
      penalty: 15,
      messageVi:
        'Đâm vào ranh giới khu vực bản đồ OSM! Vui lòng quay đầu xe.',
      messageDe:
        'Kollision mit der Grenze des OSM-Kartenbereichs!'
    });
  }

  const mapInfo = {
    source: 'OSM_PBF',
    roadCount: Array.isArray(roadGraphData?.roads) ? roadGraphData.roads.length : 0,
    junctionCount: junctions.length,
    trafficLightCount: trafficLightMgr ? trafficLightMgr.controllers.size : totalSignalCount / 2,
    signCount: totalSignCount,
    waterwaysCount: Array.isArray(roadGraphData?.waterways) ? roadGraphData.waterways.length : 0,
    railwayCount: Array.isArray(roadGraphData?.railways) ? roadGraphData.railways.length : 0,
    parkCount: Array.isArray(roadGraphData?.parks) ? roadGraphData.parks.length : 0,
    landmarkCount: Array.isArray(roadGraphData?.landmarks) ? roadGraphData.landmarks.length : 0,
    bounds: bounds ?? null
  };

  scenery.userData.mapInfo = mapInfo;
  if (scene) {
    scene.userData.mapInfo = mapInfo;
  }

  return roadGen;
}
