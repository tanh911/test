import * as THREE from 'three';
import { ProceduralRoadGenerator } from '../simulation/proceduralRoadGenerator.js';
import roadGraphLand from '../simulation/data/road_graph_land.json';
import { TrafficRuleResolver } from '../simulation/legal/TrafficRuleResolver.js';
import trafficRulesBerlin from '../simulation/data/traffic_rules_berlin.json';
import { examinerEngine } from '../simulation/ExaminerRuleEngine.js';
import { makeGermanStVOSign } from './streetProps.js';

/**
 * 🌲 LANDSTRASSE B2 DISTRICT BUILDER (PBF Map Engine)
 * Renders country roads, tree avenues (Allee), speed limit 100/70 km/h signs,
 * curve warnings, and Wildwechsel (deer crossing) signs.
 */
export function buildLandstrasseDistrict(
  scene,
  scenery,
  colliders,
  sharedMaterials,
  isPerformance,
  _config
) {
  if (!scenery) {
    throw new Error('[LandstrasseDistrict] scenery group is required.');
  }

  const roadGraphData = roadGraphLand;
  const roadGen = new ProceduralRoadGenerator(scenery, sharedMaterials);

  try {
    roadGen.buildFromRoadGraph(roadGraphData);
    console.log('[LandstrasseDistrict] ✅ buildFromRoadGraph OK for Landstraße B2');
  } catch (err) {
    console.error('[LandstrasseDistrict] ❌ buildFromRoadGraph FAILED:', err);
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
  signsGroup.name = 'PBF_Landstrasse_StVO_Signs_3D';
  let curveSigns = 0;
  let tempoSigns = 0;
  let prioritySigns = 0;
  let wildSigns = 0;

  // ── Biển báo đặt theo vị trí nguy hiểm THẬT trên tuyến (giống lái xe ngoài đời) ──
  // Trước đây mỗi đường thứ 4 đặt 1 biển ở giữa đoạn → biển không trùng cua/thực tế.
  // Giờ: phân tích độ cong centerline — cua bán kính nhỏ (< ~200m) → Z.103 (KURVE)
  // trước lưỡi cua bên phía appropriate; B2 (primary) cắm Z.306 Vorfahrtstraße định kỳ;
  // đoạn rừng/hồ → Z.142 Wildwechsel; và tấm giới hạn 100/70 đầu một số tuyến.
  if (Array.isArray(roadGraphData?.roads)) {
    const primaryRoads = roadGraphData.roads.filter(r => ['primary', 'secondary'].includes(r.highway));
    const CURVE_WINDOW = 2;          // so sánh hướng cách 2 điểm (~2 × độ dài segment OSM)
    const CURVE_THRESHOLD = 0.3;     // rad đổi hướng trên ~50m → cua đáng báo hiệu
    const MIN_SPACING_M = 70;        // khoảng cách tối thiểu giữa 2 biển trên cùng tuyến
    const SIGN_OFFSET_M = 4.6;       // biển đứng cách mép đường hữu (lề phải)
    let maxTempo = 6;
    let maxWild = 5;
    let maxPriority = 8;

    for (let ri = 0; ri < primaryRoads.length; ri++) {
      const r = primaryRoads[ri];
      const cl = r.centerline;
      if (!cl || cl.length < CURVE_WINDOW * 2 + 1) continue;

      // Khoảng cách tích luỹ dọc tuyến để kiểm soát spacing
      const cum = [0];
      for (let i = 1; i < cl.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(cl[i][0] - cl[i - 1][0], cl[i][1] - cl[i - 1][1]));
      }
      const roadLen = cum[cum.length - 1];
      if (roadLen < 30) continue;

      let lastSignS = -Infinity;
      for (let i = CURVE_WINDOW; i < cl.length - CURVE_WINDOW; i++) {
        const s = cum[i];
        if (s - lastSignS < MIN_SPACING_M) continue;

        const [ax, az] = cl[i - CURVE_WINDOW];
        const [bx, bz] = cl[i];
        const [cx, cz] = cl[i + CURVE_WINDOW];
        // Đổi hướng giữa 2 đoạn (dùng quy ước heading của sim: atan2(-dx, -dz))
        const h1 = Math.atan2(-(bx - ax), -(bz - az));
        const h2 = Math.atan2(-(cx - bx), -(cz - bz));
        let dh = h2 - h1;
        while (dh > Math.PI) dh -= 2 * Math.PI;
        while (dh < -Math.PI) dh += 2 * Math.PI;

        const dx = cx - ax, dz = cz - az;
        const L = Math.hypot(dx, dz) || 1;

        // 🔸 Cua gắt → biển Z.103 đặt trước lưỡi cua ~25m, bên phải theo hướng đi
        if (Math.abs(dh) > CURVE_THRESHOLD && curveSigns < 40) {
          lastSignS = s;
          const rnx = -dz / L, rnz = dx / L; // pháp tuyến phải của hướng chạy
          // Vị trí đặt: trước lưỡi cua (lùi về sau 25m dọc tuyến)
          let back = i;
          while (back > 0 && s - cum[back] < 25) back--;
          const [px, pz] = cl[back];
          const bdx = cl[back + 1] ? cl[back + 1][0] - px : dx;
          const bdz = cl[back + 1] ? cl[back + 1][1] - pz : dz;
          const bl = Math.hypot(bdx, bdz) || 1;
          const sign = makeGermanStVOSign('KURVE', dh < 0 ? -1 : 1);
          sign.position.set(px + rnx * SIGN_OFFSET_M, 0, pz + rnz * SIGN_OFFSET_M);
          // Mặt biển quay về phía xe đang tới (đối nghịch hướng chạy)
          sign.rotation.y = Math.atan2(-bdx / bl, -bdz / bl);
          signsGroup.add(sign);
          curveSigns++;
          continue;
        }

        // 🔸 B2 primary: Z.306 Vorfahrtstraße mỗi ~400m (khẳng định đường ưu tiên)
        if (r.highway === 'primary' && prioritySigns < maxPriority && s > 200 && s % 400 < 25) {
          lastSignS = s;
          const rnx = -dz / L, rnz = dx / L;
          const sign = makeGermanStVOSign('PRIORITY_ROAD');
          sign.position.set(bx + rnx * SIGN_OFFSET_M, 0, bz + rnz * SIGN_OFFSET_M);
          sign.rotation.y = Math.atan2(-dx / L, -dz / L);
          signsGroup.add(sign);
          prioritySigns++;
          continue;
        }

        // 🔸 Giới hạn tốc độ đầu một số tuyến (100 ngoài đô thị / 70 vào khúc đông)
        if (tempoSigns < maxTempo && ri % 3 === 0 && s < 40) {
          lastSignS = s;
          const rnx = -dz / L, rnz = dx / L;
          const limit = (roadIdxCycle(ri) ? 100 : 70);
          const sign = makeGermanStVOSign('SPEED_LIMIT', limit);
          sign.position.set(bx + rnx * SIGN_OFFSET_M, 0, bz + rnz * SIGN_OFFSET_M);
          sign.rotation.y = Math.atan2(-dx / L, -dz / L);
          signsGroup.add(sign);
          tempoSigns++;
          continue;
        }

        // 🔸 Wildwechsel rải rác (giáo án Z.142 cho bài land_wildlife_hazard)
        if (wildSigns < maxWild && ri % 5 === 2 && s > 150 && s % 250 < 25) {
          lastSignS = s;
          const rnx = -dz / L, rnz = dx / L;
          const sign = makeGermanStVOSign('WILDWECHSEL');
          sign.position.set(bx + rnx * SIGN_OFFSET_M, 0, bz + rnz * SIGN_OFFSET_M);
          sign.rotation.y = Math.atan2(-dx / L, -dz / L);
          signsGroup.add(sign);
          wildSigns++;
        }
      }
    }

    function roadIdxCycle(n) { return n % 2 === 0; }
  }

  scenery.add(signsGroup);
  console.log(`[LandstrasseDistrict] 🌲 StVO Signs: ${curveSigns} cua Z.103, ${prioritySigns} ưu tiên Z.306, ${tempoSigns} tốc độ, ${wildSigns} Wildwechsel Z.142`);

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
      id: 'osm_pbf_landstrasse_boundary',
      type: 'fence',
      shape: 'boundary',
      minX: bounds.minX,
      maxX: bounds.maxX,
      minZ: bounds.minZ,
      maxZ: bounds.maxZ,
      gateMinX: 0,
      gateMaxX: 0,
      penalty: 15,
      messageVi: 'Đâm vào ranh giới khu vực Landstraße B2! Vui lòng quay đầu xe.',
      messageDe: 'Kollision mit der Grenze der Landstraße B2!'
    });
  }

  const mapInfo = {
    source: 'OSM_PBF_LANDSTRASSE',
    roadCount: Array.isArray(roadGraphData?.roads) ? roadGraphData.roads.length : 0,
    junctionCount: Array.isArray(roadGraphData?.junctions) ? roadGraphData.junctions.length : 0,
    signCount: curveSigns + prioritySigns + tempoSigns + wildSigns,
    bounds: bounds ?? null
  };

  scenery.userData.mapInfo = mapInfo;
  if (scene) scene.userData.mapInfo = mapInfo;

  return roadGen;
}
