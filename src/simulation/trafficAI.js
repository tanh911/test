import * as THREE from 'three';
import { createTrafficAICar } from '../components/3dObjects.js';
import berlinCorridorsData from './data/berlinTrafficCorridors.json';

export { createTrafficAICar };

/**
 * 🚦 GERMAN StVO TRAFFIC AI ENGINE (Hệ Thống Xe Bot Giao Thông Chuẩn Luật Đức StVO)
 * 
 * - Tự động di chuyển bám theo mạng đường OpenStreetMap (OSM Polyline Ribbons)
 * - Tuân thủ tuyệt đối làn đường bên phải (§ 2 StVO Rechtsfahrgebot)
 * - Tuân thủ tuyệt đối đèn tín hiệu giao thông (§ 37 StVO - Dừng trước Haltelinie khi đèn đỏ/vàng)
 * - Tuân thủ giới hạn tốc độ (§ 3 StVO: 50 km/h trên đại lộ, 30 km/h khu phố cổ / dân cư)
 * - Giữ khoảng cách an toàn (§ 4 StVO: Tự động phanh khi có xe đi trước hoặc xe người chơi)
 * - Mũi xe chuẩn xác 100% theo vector tiếp tuyến của cung đường (Smooth tangent heading)
 * - Hỗ trợ báo cáo vị trí xe trực quan cho Radar HUD Minimap và Bản đồ tổng quan (Overview Modal)
 */

// Màu sơn xe bot phong phú theo phong cách châu Âu
export const BOT_CAR_COLORS = [
  0x1e293b, // Slate Black
  0xf8fafc, // Alpine White
  0x2563eb, // Royal Blue
  0xdc2626, // Crimson Red
  0x475569, // Metallic Grey
  0x059669, // Forest Emerald
  0xd97706, // Amber Bronze
  0x7c3aed  // Deep Indigo
];

export const BERLIN_MITTE_TRAFFIC_CORRIDORS = berlinCorridorsData;

/**
 * 🛠️ Sinh corridor giao thông 2 chiều từ các element ROAD_STRAIGHT của bản đồ tùy chỉnh
 * (Map Editor). Trước đây map tùy chỉnh chỉ có xe AI chạy thẳng theo trục Z cố định
 * x=±3.2/4.8 — hoàn toàn không bám theo hình dạng đường của map người dùng.
 * Mỗi đoạn đường thẳng tạo 2 corridor (chiều đi + chiều ngược) lệch phải 3.2m theo § 2 StVO.
 */
export function buildCorridorsFromMapElements(elements = [], maxSpeedKmH = 50) {
  const corridors = [];
  const LANE_OFFSET = 3.2;

  (elements || []).forEach(el => {
    if (!el || el.type !== 'ROAD_STRAIGHT') return;
    const len = Math.abs(el.height || 0);
    if (len < 30) return; // Đoạn quá ngắn không đủ cho xe bot quay vòng

    const rot = (((el.rotation || 0) % 360) + 360) % 360;
    const alongX = rot === 90 || rot === 270;
    const p1 = alongX ? [el.x - len / 2, el.z] : [el.x, el.z - len / 2];
    const p2 = alongX ? [el.x + len / 2, el.z] : [el.x, el.z + len / 2];

    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const L = Math.hypot(dx, dz) || 1;
    const ux = dx / L;
    const uz = dz / L;

    const makeDir = (dir) => {
      const f = dir === 'fwd' ? 1 : -1;
      // Pháp tuyến bên phải của hướng tiến (-uz, ux)
      const nx = -uz * f;
      const nz = ux * f;
      const a = dir === 'fwd' ? p1 : p2;
      const b = dir === 'fwd' ? p2 : p1;
      return {
        id: `custom_${el.id}_${dir}`,
        speedLimitKmH: maxSpeedKmH,
        laneOffset: 0, // Đã bake lệch làn vào waypoint
        waypoints: [
          [a[0] + nx * LANE_OFFSET, a[1] + nz * LANE_OFFSET],
          [b[0] + nx * LANE_OFFSET, b[1] + nz * LANE_OFFSET]
        ],
        segmentDists: [0, L],
        totalLength: L,
        lights: []
      };
    };

    corridors.push(makeDir('fwd'), makeDir('rev'));
  });

  return corridors;
}

// Các hành lang phụ cho chế độ ngoại ô / cao tốc (Landstraße & Autobahn A2)
export const AUTOBAHN_TRAFFIC_CORRIDORS = [
  {
    id: 'autobahn_right_lane',
    speedLimitKmH: 100,
    laneOffset: 0,
    waypoints: [[2735.0, -800], [2735.0, -2200]],
    segmentDists: [0, 1400],
    totalLength: 1400,
    lights: []
  },
  {
    id: 'autobahn_middle_lane',
    speedLimitKmH: 130,
    laneOffset: 0,
    waypoints: [[2742.7, -800], [2742.7, -2200]],
    segmentDists: [0, 1400],
    totalLength: 1400,
    lights: []
  },
  {
    id: 'autobahn_fast_lane',
    speedLimitKmH: 155,
    laneOffset: 0,
    waypoints: [[2750.0, -800], [2750.0, -2200]],
    segmentDists: [0, 1400],
    totalLength: 1400,
    lights: []
  },
  {
    id: 'autobahn_north_lane',
    speedLimitKmH: 130,
    laneOffset: 0,
    waypoints: [[2765.0, -2200], [2765.0, -800]],
    segmentDists: [0, 1400],
    totalLength: 1400,
    lights: []
  }
];

export class TrafficAIManager {
  constructor(scene, isPerformance = false) {
    this.scene = scene;
    this.isPerformance = isPerformance;
    this.botCars = [];
    this.maxCars = isPerformance ? 14 : 34; // 🚗 34 bot desktop: mật độ đủ để "có giao thông" mà không tụt FPS
    this.globalTrafficLightState = 'GREEN'; // 'GREEN', 'YELLOW', 'RED'
    this.lightCycleTimer = 0;
    this.manualLightOverride = false;
    this.sceneLightGroups = [];
    // ♻️ Recycle: xe ra xa người chơi quá RECYCLE_DIST sẽ được chuyển đến đầu phía trước
    // để mật độ xe quanh người chơi luôn dày đặc (cảm giác phố đông xe liên tục)
    this.recycleDist = 560;
    this.respawnAheadMin = 260;
    this.respawnAheadMax = 460;
  }

  /**
   * Tìm khoảng cách dọc tuyến s sao cho vị trí trên corridor gần (x, z) nhất.
   * Dò thô từng đoạn 12m — chỉ chạy khi spawn/recycle nên chi phí không đáng kể.
   */
  findClosestPathDist(corridor, x, z) {
    const waypoints = corridor.waypoints;
    const segDists = corridor.segmentDists;
    const totalLen = corridor.totalLength || 1000;
    if (!waypoints || !segDists || waypoints.length < 2) return null;

    let bestS = 0;
    let bestDistSq = Infinity;
    for (let k = 0; k < waypoints.length - 1; k++) {
      const p1 = waypoints[k];
      const p2 = waypoints[k + 1];
      const d1 = segDists[k];
      const d2 = segDists[k + 1] || totalLen;
      const segLen = Math.max(0.001, d2 - d1);
      const ux = (p2[0] - p1[0]) / segLen;
      const uz = (p2[1] - p1[1]) / segLen;
      const steps = Math.max(1, Math.ceil(segLen / 12));
      for (let i = 0; i <= steps; i++) {
        const s = d1 + Math.min(segLen, (i / steps) * segLen);
        const cx = p1[0] + ux * (s - d1);
        const cz = p1[1] + uz * (s - d1);
        const distSq = (cx - x) * (cx - x) + (cz - z) * (cz - z);
        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestS = s;
        }
      }
    }
    // Chỉ chấp nhận nếu điểm gần nhất nằm sát tuyến (bán kính 300m)
    return bestDistSq <= 300 * 300 ? bestS : null;
  }

  /**
   * Quét và lưu trữ tham chiếu các cột đèn giao thông trong scene để đồng bộ màu StVO
   */
  cacheSceneTrafficLights() {
    const cached = this.scene?.userData?.roadGen?.trafficLightMeshes || this.scene?.userData?.trafficLightMeshes;
    if (cached && cached.length > 0) {
      this.sceneLightGroups = cached;
      return;
    }
    this.sceneLightGroups = [];
    if (!this.scene || typeof this.scene.traverse !== 'function') return; // mock scene trong test
    this.scene.traverse((obj) => {
      if (obj.isGroup && (obj.name === 'trafficLightGroup' || obj._redLight)) {
        this.sceneLightGroups.push(obj);
      }
    });
  }

  /**
   * Tính toán vị trí (x, z), vector tiếp tuyến và góc quay heading từ khoảng cách dọc tuyến
   */
  evaluateCorridorPosition(corridor, dist) {
    const waypoints = corridor.waypoints;
    const segDists = corridor.segmentDists;
    const totalLen = corridor.totalLength || 1000;

    // Chuẩn hóa khoảng cách trong vòng lặp [0, totalLen)
    let s = dist % totalLen;
    if (s < 0) s += totalLen;

    // Tìm đoạn thẳng chứa khoảng cách s
    let k = 0;
    const n = segDists.length;
    while (k < n - 2 && segDists[k + 1] <= s) {
      k++;
    }

    const d1 = segDists[k];
    const d2 = segDists[k + 1] || totalLen;
    const segLen = Math.max(0.001, d2 - d1);
    const t = Math.max(0, Math.min(1, (s - d1) / segLen));

    const p1 = waypoints[k];
    const p2 = waypoints[k + 1] || p1;

    // Tọa độ tim đường nội suy
    const cx = p1[0] + t * (p2[0] - p1[0]);
    const cz = p1[1] + t * (p2[1] - p1[1]);

    // Vector tiếp tuyến hướng di chuyển
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const L = Math.hypot(dx, dz) || 1;
    const ux = dx / L;
    const uz = dz / L;

    // Vector pháp tuyến hướng sang làn bên phải (§ 2 StVO Rechtsfahrgebot)
    // Trong Three.js, khi xe tiến theo (ux, uz) thì bên phải xe là (-uz, ux)
    const nx = -uz;
    const nz = ux;
    const laneOffset = corridor.laneOffset !== undefined ? corridor.laneOffset : 2.0;

    const posX = cx + nx * laneOffset;
    const posZ = cz + nz * laneOffset;

    // Heading trong Three.js (Xe có mũi quay về -Z khi rotation.y = 0):
    // heading = atan2(-ux, -uz)
    const heading = Math.atan2(-ux, -uz);

    return { posX, posZ, ux, uz, heading, segIndex: k };
  }

  /**
   * 🗺️ SPATIAL GRID INDEX cho LaneGraph (lazy build 1 lần ~vài ms):
   * Trước đây _findLaneNear quét TOÀN BỘ lanes × segments mỗi lần gọi (O(n)) →
   * trên đồ OSM Berlin dày đặc (hàng nghìn segment) chiếm ~4% CPU với nhiều xe bot
   * băng ngã tư. Grid ô 25m cho phép query chỉ quét segment trong vùng lân cận (O(local)).
   */
  _getLaneIndex() {
    if (this._laneIndex) return this._laneIndex;
    const laneGraph = this.scene?.userData?.roadGen?.laneGraph || this.scene?.userData?.laneGraph;
    if (!laneGraph || !Array.isArray(laneGraph.lanes)) return null;
    const CELL = 25;
    const grid = new Map();
    let segCount = 0;
    for (const lane of laneGraph.lanes) {
      const pts = lane.drivableWaypoints || lane.centerline;
      if (!pts || pts.length < 2) continue;
      for (let i = 0; i < pts.length - 1; i++) {
        const ax = pts[i][0], az = pts[i][1];
        const bx = pts[i + 1][0], bz = pts[i + 1][1];
        const minCX = Math.floor(Math.min(ax, bx) / CELL);
        const maxCX = Math.floor(Math.max(ax, bx) / CELL);
        const minCZ = Math.floor(Math.min(az, bz) / CELL);
        const maxCZ = Math.floor(Math.max(az, bz) / CELL);
        for (let cx = minCX; cx <= maxCX; cx++) {
          for (let cz = minCZ; cz <= maxCZ; cz++) {
            const key = cx + ':' + cz;
            let arr = grid.get(key);
            if (!arr) { arr = []; grid.set(key, arr); }
            arr.push(lane, i);
            segCount++;
          }
        }
      }
    }
    this._laneIndex = { CELL, grid, segCount };
    return this._laneIndex;
  }

  /**
   * 🔍 Tìm lane CÙNG HƯỚNG gần điểm (x, z) trong LaneGraph — dùng cho re-anchor và cache lane.
   * Dùng spatial grid (ô 25m) để chỉ quét segment lân cận thay vì toàn bộ đồ đường.
   * @param {object} opts { radius = 12, dirTol = Math.PI * 0.25 } — re-anchor dùng nghiêm ngặt,
   *        re-cache khi lái dùng nới lỏng (qua ngã tư lane bị trim, khúc cua)
   */
  _findLaneNear(x, z, heading, opts = {}) {
    const radius = opts.radius ?? 12;
    const dirTol = opts.dirTol ?? Math.PI * 0.25;
    const laneGraph = this.scene?.userData?.roadGen?.laneGraph || this.scene?.userData?.laneGraph;
    if (!laneGraph || !Array.isArray(laneGraph.lanes)) return null;
    const index = this._getLaneIndex();
    let best = null;
    if (index) {
      // 🔥 Fast path: chỉ quét các segment nằm trong ô grid phủ bán kính radius
      const CELL = index.CELL;
      const c0 = Math.floor((x - radius) / CELL), c1 = Math.floor((x + radius) / CELL);
      const d0 = Math.floor((z - radius) / CELL), d1 = Math.floor((z + radius) / CELL);
      const radiusSq = radius * radius;
      for (let cx = c0; cx <= c1; cx++) {
        for (let cz = d0; cz <= d1; cz++) {
          const arr = index.grid.get(cx + ':' + cz);
          if (!arr) continue;
          for (let k = 0; k < arr.length; k += 2) {
            const lane = arr[k], i = arr[k + 1];
            const pts = lane.drivableWaypoints || lane.centerline;
            const ax = pts[i][0], az = pts[i][1];
            const bx = pts[i + 1][0], bz = pts[i + 1][1];
            const dx = bx - ax, dz = bz - az;
            const lenSq = dx * dx + dz * dz;
            if (lenSq === 0) continue;
            let t = ((x - ax) * dx + (z - az) * dz) / lenSq;
            t = Math.max(0, Math.min(1, t));
            const px = ax + t * dx;
            const pz = az + t * dz;
            const ex = x - px, ez = z - pz;
            const distSq = ex * ex + ez * ez;
            if (distSq > radiusSq) continue;
            const d = Math.sqrt(distSq);
            const L = Math.sqrt(lenSq);
            const laneHeading = Math.atan2(-dx / L, -dz / L);
            let diff = Math.abs(heading - laneHeading);
            if (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);
            if (diff > dirTol) continue;
            if (!best || d < best.dist) {
              best = { lane, dist: d, px, pz };
            }
          }
        }
      }
      return best;
    }
    // Fallback: quét tuyến tính toàn đồ (map không build được grid)
    for (const lane of laneGraph.lanes) {
      const pts = lane.drivableWaypoints || lane.centerline;
      if (!pts || pts.length < 2) continue;
      for (let i = 0; i < pts.length - 1; i++) {
        const ax = pts[i][0], az = pts[i][1];
        const bx = pts[i + 1][0], bz = pts[i + 1][1];
        const dx = bx - ax, dz = bz - az;
        const lenSq = dx * dx + dz * dz;
        if (lenSq === 0) continue;
        let t = ((x - ax) * dx + (z - az) * dz) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const px = ax + t * dx;
        const pz = az + t * dz;
        const d = Math.hypot(x - px, z - pz);
        if (d > radius) continue;
        const L = Math.sqrt(lenSq);
        const laneHeading = Math.atan2(-dx / L, -dz / L);
        let diff = Math.abs(heading - laneHeading);
        while (diff > Math.PI) diff -= Math.PI * 2;
        if (Math.abs(diff) > dirTol) continue; // chỉ nhận lane cùng hướng
        if (!best || d < best.dist) best = { dist: d, px, pz, lane };
      }
    }
    return best;
  }

  /**
   * Cache lane thật cho corridor: lấy mẫu 5 điểm dọc corridor, chọn lane cùng hướng gần nhất.
   * Dùng để clamp vị trí ngang của xe bot mỗi frame (đảm bảo bot luôn đúng tâm làn render).
   */
  _cacheCorridorLane(corridor, x, z, heading) {
    if (!corridor || corridor._laneCacheBanned) return null;
    const hasLaneGraph = !!(this.scene?.userData?.roadGen?.laneGraph || this.scene?.userData?.laneGraph);
    if (!hasLaneGraph) return null; // Map custom/không có LaneGraph: corridor là nguồn chuẩn duy nhất
    const candidates = [];
    if (Number.isFinite(x) && Number.isFinite(z)) {
      // Khi lái: nới lỏng bán kính + góc (qua ngã tư lane bị trim, khúc cua nhẹ)
      const hit = this._findLaneNear(x, z, heading, { radius: 20, dirTol: Math.PI / 3 });
      if (hit) {
        candidates.push(hit);
      } else {
        // 🛟 FALLBACK: dữ liệu oneway OSM không đồng nhất (mảnh A2 đổi hướng flags loạn) —
        // nếu KHÔNG lane nào cùng hướng trong 20m, lấy lane GẦN NHẤT bất kể hướng.
        // Cache lane chỉ dùng để clamp vị trí ngang (giữ bot trên mặt đường), sai hướng
        // vẫn tốt hơn corridor chết → migrate cả lũ bot về 1 làn gây ùn tắc toàn tuyến.
        const anyHit = this._findLaneNear(x, z, heading, { radius: 14, dirTol: Math.PI });
        if (anyHit) candidates.push(anyHit);
      }
    } else {
      const total = corridor.totalLength || 0;
      for (const ratio of [0.15, 0.35, 0.5, 0.65, 0.85]) {
        const sample = this.evaluateCorridorPosition(corridor, total * ratio);
        const hit = this._findLaneNear(sample.posX, sample.posZ, sample.heading)
          || this._findLaneNear(sample.posX, sample.posZ, sample.heading, { radius: 14, dirTol: Math.PI });
        if (hit) candidates.push(hit);
      }
    }
    if (candidates.length === 0) {
      corridor._laneCacheMisses = (corridor._laneCacheMisses || 0) + 1;
      // Chịu được ~20s không có lane (băng qua ngã tư) trước khi từ bỏ corridor này —
      // nâng từ 120 frames (~2s): miss thoáng qua trước đây giết corridor hàng loạt
      if (corridor._laneCacheMisses > 1200) corridor._laneCacheBanned = true;
      return null;
    }
    candidates.sort((a, b) => a.dist - b.dist);
    corridor._laneCacheMisses = 0;
    return candidates[0].lane;
  }

  /**
   * 📐 Chiếu điểm (x, z) lên polyline của lane → vị trí đúng tâm làn + hướng đoạn tại chỗ chiếu
   */
  _projectOntoLane(lane, x, z) {
    const pts = lane?.drivableWaypoints || lane?.centerline;
    if (!pts || pts.length < 2) return null;
    let best = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], az = pts[i][1];
      const bx = pts[i + 1][0], bz = pts[i + 1][1];
      const dx = bx - ax, dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) continue;
      let t = ((x - ax) * dx + (z - az) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const px = ax + t * dx;
      const pz = az + t * dz;
      const d = Math.hypot(x - px, z - pz);
      if (!best || d < best.dist) {
        const L = Math.sqrt(lenSq);
        best = { dist: d, px, pz, heading: Math.atan2(-dx / L, -dz / L) };
      }
    }
    return best;
  }

  /**
   * 🔧 RE-ANCHOR LATERAL: corridor JSON sinh từ bản đồ đường cũ nên tâm tuyến lệch ngang
   * so với mặt đường render hiện tại (xe bot chạy sát mép đường/vỉa hè). Tâm làn thật nằm
   * trong LaneGraph (single-source với geometry render) nhưng các lane chỉ là mảnh ngắn
   * (median 24m) nên không thể dùng trực tiếp. Giải pháp: giữ nguyên hình dài của corridor,
   * chỉ dịch NGANG toàn bộ waypoints sao cho các điểm mẫu rơi đúng tâm lane cùng hướng.
   * Kết hợp với clamp per-frame (update) để xử lý cả đoạn corridor cong/lệch lớn.
   */
  _reanchorCorridorsToLanes(corridors) {
    if (!this.scene?.userData?.roadGen?.laneGraph && !this.scene?.userData?.laneGraph) return;

    let fixed = 0;
    for (const corridor of corridors) {
      if (corridor._reanchored || !corridor.waypoints || corridor.waypoints.length < 2) continue;
      try {
        // Lấy mẫu 5 điểm dọc corridor: điểm giữa có thể rơi vào ngã tư (lane bị trim) →
        // mẫu nào tìm được lane cùng hướng thì dùng, lấy trung bình các offset khớp được
        const total = corridor.totalLength || 0;
        const sampleRatios = [0.15, 0.35, 0.5, 0.65, 0.85];
        const samples = sampleRatios.map(r => this.evaluateCorridorPosition(corridor, total * r));
        const offsets = [];
        let cachedLane = null;
        for (const sample of samples) {
          const hit = this._findLaneNear(sample.posX, sample.posZ, sample.heading);
          if (!hit) continue;
          if (!cachedLane) cachedLane = hit.lane;
          const nx = -sample.uz, nz = sample.ux;
          const lateral = (hit.px - sample.posX) * nx + (hit.pz - sample.posZ) * nz;
          if (Number.isFinite(lateral) && Math.abs(lateral) <= 12) offsets.push(lateral);
        }
        corridor._cachedLane = cachedLane;
        if (offsets.length === 0) continue;
        const lateral = offsets.reduce((s, v) => s + v, 0) / offsets.length;
        if (Math.abs(lateral) < 0.15) { corridor._reanchored = true; continue; } // đã thẳng làn
        // Dịch NGANG bằng pháp tuyến của điểm giữa (các mẫu cùng corridor gần như song song)
        const first = this.evaluateCorridorPosition(corridor, total * 0.5);
        const nx = -first.uz, nz = first.ux;
        corridor.waypoints = corridor.waypoints.map(w => [w[0] + nx * lateral, w[1] + nz * lateral]);
        corridor.laneOffset = 0; // Lane đã bao gồm offset làn, không cộng thêm nữa
        let acc = 0;
        corridor.segmentDists = corridor.waypoints.map((w, i) => {
          if (i > 0) acc += Math.hypot(w[0] - corridor.waypoints[i - 1][0], w[1] - corridor.waypoints[i - 1][1]);
          return acc;
        });
        corridor.totalLength = Math.max(1, acc);
        corridor._reanchored = true;
        fixed++;
      } catch {
        // Corridor lỗi giữ nguyên hình cũ (tốt hơn không có xe)
      }
    }
    if (fixed > 0 && this.scene) {
      console.log(`[TrafficAI] 🔧 Re-anchored ${fixed}/${corridors.length} corridors onto real lane centers`);
    }
  }

  /**
   * Khởi tạo và sinh các xe bot trên toàn bộ các trục đường chính hoặc từ LaneGraph
   * @param {string} mapId Loại bản đồ
   * @param {Array|null} customCorridors Tuyến đường tùy chỉnh từ LaneGraph
   * @param {object|null} ruleResolver Bộ giải luật giao thông StVO
   * @param {{x: number, z: number}|null} focusPoint Điểm tập trung mật độ xe (spawn người chơi).
   *        Khi có, xe được gom dày đặc quanh điểm này thay vì rải đều khắp mạng đường OSM
   *        (trước đây xe gần nhất cách người chơi 500m+ → phố vắng hoe).
   */
  init(mapId = 'stadt_zentrum', customCorridors = null, ruleResolver = null, focusPoint = null) {
    this.clear();
    this.ruleResolver = ruleResolver || this.scene?.userData?.ruleResolver || this.scene?.userData?.roadGen?.ruleResolver || null;

    const isStadt = mapId === 'stadt_zentrum' || mapId === 'STADT' || mapId === 'stadt';
    const isAutobahn = mapId === 'autobahn_a9' || mapId === 'AUTOBAHN';
    const corridors = customCorridors || (isStadt 
      ? BERLIN_MITTE_TRAFFIC_CORRIDORS 
      : (isAutobahn ? AUTOBAHN_TRAFFIC_CORRIDORS : BERLIN_MITTE_TRAFFIC_CORRIDORS));

    if (!corridors || corridors.length === 0) return;

    // Căn chỉnh corridor theo tâm làn thật trong LaneGraph (chạy trước mọi tính toán spawn)
    this._reanchorCorridorsToLanes(corridors);

    this.cacheSceneTrafficLights();

    // Tính trước khoảng cách dọc tuyến gần điểm tập trung nhất của từng hành lang
    corridors.forEach(corridor => {
      corridor._focusDist = (focusPoint && Number.isFinite(focusPoint.x))
        ? this.findClosestPathDist(corridor, focusPoint.x, focusPoint.z)
        : null;
    });
    const focusCorridors = corridors.filter(c => Number.isFinite(c._focusDist));

    // Sinh xe phân bổ đều trên các tuyến hành lang giao thông thực tế
    // 🚗 Dùng đủ maxCars: cap cũ corridors.length*2 (12×2=24) làm phố luôn thiếu xe —
    // bot chia đều theo corridor nên corridor 1.7km chứa 3-4 xe vẫn thưa hơn phố thật
    const carCount = this.maxCars;
    // 🔀 CHẾ ĐỘ MIXED (autobahn route vòng, customCorridors truyền vào): chia bot ĐỀU qua
    // TẤT CẢ corridor — corridor có focus (phố gần spawn) xếp xe quanh focus, corridor xa
    // (A2 mainline) rải đều dọc tuyến. Trước đây focusCorridors chỉ bắt được corridor
    // duy nhất qua sát spawn → CẢ 26 bot dồn vào 1 con phố, A2 vắng tanh.
    const useMixedCorridors = !!(customCorridors && customCorridors.length > 0 && focusPoint && Number.isFinite(focusPoint.x));
    for (let i = 0; i < carCount; i++) {
      let corridor;
      let initialPathDist;
      if (useMixedCorridors) {
        corridor = corridors[i % corridors.length];
        const carsOnCorridor = Math.ceil(carCount / corridors.length);
        const slot = Math.floor(i / corridors.length);
        if (Number.isFinite(corridor._focusDist)) {
          const offset = -100 + (slot / Math.max(1, carsOnCorridor)) * 500 + Math.random() * 30;
          initialPathDist = (corridor._focusDist + offset + corridor.totalLength) % corridor.totalLength;
        } else {
          const slotRatio = (slot + 0.35 + (i % 3) * 0.18) / Math.max(1, carsOnCorridor);
          initialPathDist = (slotRatio * corridor.totalLength) % corridor.totalLength;
        }
      } else if (focusCorridors.length > 0) {
        // Có điểm tập trung: DÙNG TOÀN BỘ xe cho các hành lang chạy qua gần người chơi
        // (trước đây mỗi corridor chỉ nhận 2 xe, số còn lại rải khắp mạng 2km+ → phố vắng hoe)
        corridor = focusCorridors[i % focusCorridors.length];
        const carsPerCorridor = Math.ceil(carCount / focusCorridors.length);
        const slot = Math.floor(i / focusCorridors.length);
        // 🚗 Window ±115..455m quanh player (trước ±120..620m) — đặc hơn trong tầm nhìn
        // camera (mọi bot từ ~150m vào trong là nhìn thấy được → cảm giác giao thông dày)
        let offset = -115 + (slot / Math.max(1, carsPerCorridor)) * 460 + Math.random() * 30;
        // ⛔ Không spawn bot sát player (|offset| < 40m): bot chạy 50km/h đâm thẳng xe
        // đang đậu ở spawn → màn hình va chạm chặn ngay khi vừa vào map
        if (Math.abs(offset) < 40) offset += offset >= 0 ? 55 : -55;
        initialPathDist = (corridor._focusDist + offset + corridor.totalLength) % corridor.totalLength;
      } else {
        // Không có điểm tập trung: phân bổ cách đều dọc theo chiều dài tuyến (hành vi cũ)
        corridor = corridors[i % corridors.length];
        const countOnCorridor = Math.ceil(carCount / corridors.length);
        const slotIndex = Math.floor(i / corridors.length);
        const slotRatio = (slotIndex + 0.3 + (i % 3) * 0.2) / Math.max(1, countOnCorridor);
        initialPathDist = (slotRatio * corridor.totalLength) % corridor.totalLength;
      }

      const color = BOT_CAR_COLORS[i % BOT_CAR_COLORS.length];
      const mesh = createTrafficAICar(i % 5, color);

      // 🚗 GIỮ KHOẢNG CÁCH SPAWN: đẩy tiến dọc tuyến tới khi cách xe đã đặt trên cùng
      // corridor ≥ minGap. Trước đây corridor phố NGẮN (mảnh LaneGraph 24m) + offset modulo
      // làm nhiều bot rơi cùng 1 điểm → chồng xe ngay khi spawn → Va chạm giả liên tục.
      {
        const totalLen = Math.max(1, corridor.totalLength || 1);
        const occupied = this.botCars.filter(b => b.corridor === corridor).map(b => b.pathDist);
        const minGap = Math.min(45, Math.max(10, totalLen / Math.max(1, occupied.length + 2)));
        let tries = 0;
        while (occupied.length > 0 && tries < 30) {
          let nearest = Infinity;
          for (const od of occupied) {
            let dAbs = Math.abs(initialPathDist - od);
            dAbs = Math.min(dAbs, totalLen - dAbs);
            if (dAbs < nearest) nearest = dAbs;
          }
          if (nearest >= minGap) break;
          initialPathDist = (initialPathDist + minGap) % totalLen;
          tries++;
        }
      }

      const { posX, posZ, heading } = this.evaluateCorridorPosition(corridor, initialPathDist);

      // 🌉 Bot spawn đúng cao độ mặt đường (cầu bridge/layer nâng bot lên)
      const spawnElev = this.getElevationAt ? this.getElevationAt(posX, posZ) : 0;
      mesh.position.set(posX, 0.02 + spawnElev, posZ);
      mesh.rotation.y = heading;
      if (this.scene) this.scene.add(mesh);

      const speedLimit = corridor.speedLimitKmH || 50;
      const targetSpeed = speedLimit / 3.6; // Chuyển sang m/s

      this.botCars.push({
        id: `bot_car_${i}`,
        mesh,
        corridor,
        color,
        pathDist: initialPathDist,
        speed: targetSpeed * (0.85 + Math.random() * 0.15),
        targetSpeed,
        maxSpeed: targetSpeed,
        isBraking: false,
        stopReason: null,
        wheelRot: 0
      });
    }
  }

  /**
   * Khởi tạo xe bot trực tiếp từ LaneGraph (Shared Single-Source Lane Graph)
   */
  initFromLaneGraph(laneGraph) {
    if (!laneGraph) return;
    const corridors = laneGraph.getDrivableCorridors ? laneGraph.getDrivableCorridors() : null;
    if (corridors && corridors.length > 0) {
      this.init('lane_graph', corridors);
    }
  }

  /**
   * Cập nhật chu kỳ đèn tín hiệu giao thông thành phố (§ 37 StVO)
   * 16s Xanh -> 3s Vàng -> 13s Đỏ
   */
  updateTrafficLights(dt) {
    if (this.manualLightOverride) return; // Giữ state do setTrafficLightState đặt (examiner/test § 37)

    // 🚦 CHỈ chạy chu kỳ đèn khi scene CÓ cột đèn thật (trafficLightGroup mesh):
    // trên map Autobahn/A2 không có đèn tại các giao lộ phố Rhynern (Rechts-vor-Links,
    // không tín hiệu) — trước đây chu kỳ Berlin vẫn chạy → bot đứng im 13s/32s tại
    // "đèn đỏ tưởng tượng" giữa phố, đông xe thành ùn tắc giả.
    // Scan đèn CHỈ 1 LẦN (traverse toàn scene tốn CPU — không được gọi mỗi frame).
    if (!this._lightsScanDone) {
      this.cacheSceneTrafficLights();
      this._lightsScanDone = true;
      this._lightsScanEmpty = !(this.sceneLightGroups && this.sceneLightGroups.length > 0);
    }
    if (this._lightsScanEmpty) {
      this.globalTrafficLightState = 'GREEN';
      return;
    }

    this.lightCycleTimer += dt;
    const cycle = this.lightCycleTimer % 32;
    let newState = 'GREEN';

    if (cycle < 16) {
      newState = 'GREEN';
    } else if (cycle < 19) {
      newState = 'YELLOW';
    } else {
      newState = 'RED';
    }

    if (newState !== this.globalTrafficLightState) {
      this.globalTrafficLightState = newState;
      this.applyTrafficLightVisuals(newState);
    }
  }

  setTrafficLightState(state) {
    this.manualLightOverride = true;
    this.globalTrafficLightState = state;
    this.applyTrafficLightVisuals(state);
  }

  applyTrafficLightVisuals(state) {
    if (!this.sceneLightGroups || this.sceneLightGroups.length === 0) {
      this.cacheSceneTrafficLights();
    }

    const isRed = state === 'RED';
    const isYel = state === 'YELLOW';
    const isGrn = state === 'GREEN';

    this.sceneLightGroups.forEach(tl => {
      if (tl._redLight?.material) {
        tl._redLight.material.color.set(isRed ? 0xef4444 : 0x450a0a);
      }
      if (tl._yelLight?.material) {
        tl._yelLight.material.color.set(isYel ? 0xfbbf24 : 0x451a03);
      }
      if (tl._grnLight?.material) {
        tl._grnLight.material.color.set(isGrn ? 0x22c55e : 0x052e16);
      }
    });
  }

  /**
   * Vòng lặp cập nhật chuyển động, phanh và luật StVO cho từng xe bot
   */
  update(dt, playerPos = null) {
    if (!this.ruleResolver && this.scene?.userData?.ruleResolver) {
      this.ruleResolver = this.scene.userData.ruleResolver;
    }

    this.updateTrafficLights(dt);

    for (let i = 0; i < this.botCars.length; i++) {
      const car = this.botCars[i];
      const mesh = car.mesh;
      const corridor = car.corridor;

      // ── 0. CORRIDOR MỒ CÔI: corridor không tìm được lane thật (đường đã dời trong đồ OSM mới)
      // → chuyển TOÀN BỘ xe sang corridor khác còn hoạt động để xe KHÔNG BAO GIỜ chạy off-road
      if (corridor._laneCacheBanned && !corridor._dead) {
        corridor._dead = true;
        // 🚗 Migration chọn corridor ÍT BOT NHẤT (trước đây chọn cái đầu tiên tìm được →
        // toàn bộ bot cả tuyến dồn về 1 làn duy nhất tạo đoàn xe 24 chiếc xếp hàng).
        const counts = new Map();
        for (const b of this.botCars) counts.set(b.corridor, (counts.get(b.corridor) || 0) + 1);
        const target = this.botCars.map(b => b.corridor)
          .filter(c => c !== corridor && c._cachedLane && !c._dead && !c._laneCacheBanned)
          .sort((a, b) => (counts.get(a) || 0) - (counts.get(b) || 0))[0];
        if (target) {
          for (const other of this.botCars) {
            if (other.corridor !== corridor) continue;
            const ratio = corridor.totalLength > 0 ? (other.pathDist % corridor.totalLength) / corridor.totalLength : 0;
            other.corridor = target;
            other.pathDist = (ratio * (target.totalLength || 1)) % (target.totalLength || 1);
            other.targetSpeed = (target.speedLimitKmH || 50) / 3.6;
            other.maxSpeed = other.targetSpeed;
          }
        }
      }
      if (corridor._dead) continue; // corridor chết: xe đã được chuyển đi (frame sau xử lý corridor mới)

      // Cập nhật tốc độ tối đa của xe theo TrafficRuleResolver nếu có (§ 3 StVO)
      if (this.ruleResolver && this.ruleResolver.laneGraph) {
        const lane = this.ruleResolver.laneGraph.laneMap.get(corridor.id);
        if (lane) {
          const speedRes = this.ruleResolver.getSpeedLimit({ lane, distAlongLane: car.pathDist });
          if (speedRes && typeof speedRes.value === 'number') {
            car.targetSpeed = speedRes.value / 3.6;
            car.maxSpeed = car.targetSpeed;
          }
          // 🏘️ Clamp tốc độ đô thị: lane KHÔNG phải motorway tối đa 50 km/h (§ 3 Abs. 3 StVO).
          // Trước đây lane phố không có maxspeed trong traffic_rules → bot chạy 70-80 km/h
          // trong phố Rhynern 50 km/h (giả lập quá tốc độ thường trực).
          if (lane.highway && !['motorway', 'trunk', 'motorway_link'].includes(lane.highway)) {
            car.targetSpeed = Math.min(car.targetSpeed, 50 / 3.6);
            car.maxSpeed = Math.min(car.maxSpeed, 50 / 3.6);
          }
        }
      }

      let desiredSpeed = car.maxSpeed;
      let stopReason = null;

      // ── 1. KIỂM TRA ĐÈN TÍN HIỆU GIAO THÔNG DỌC TUYẾN (§ 37 StVO) ──
      if (corridor.lights && corridor.lights.length > 0) {
        for (const light of corridor.lights) {
          let distToLight = light.pathDist - car.pathDist;
          if (distToLight < 0 && distToLight > -10) {
            // Đã vượt qua vạch dừng
            continue;
          }
          if (distToLight < 0 && (distToLight + corridor.totalLength < 35)) {
            distToLight += corridor.totalLength;
          }

          if (distToLight > 0 && distToLight < 35) {
            if (this.globalTrafficLightState === 'RED') {
              if (distToLight < 16) {
                // Dừng trước vạch dừng Haltelinie
                desiredSpeed = 0;
                stopReason = 'AMPEL_RED';
                break;
              } else {
                // Giảm tốc êm dịu tiếp cận ngã tư đèn đỏ
                desiredSpeed = Math.min(desiredSpeed, car.maxSpeed * ((distToLight - 14) / 20));
              }
            } else if (this.globalTrafficLightState === 'YELLOW') {
              if (distToLight > 12) {
                desiredSpeed = Math.min(desiredSpeed, car.maxSpeed * 0.35);
                stopReason = 'AMPEL_YELLOW';
              }
            }
          }
        }
      }

      // ── 2. GIỮ KHOẢNG CÁCH VỚI XE BOT PHÍA TRƯỚC TRÊN CÙNG TUYẾN (§ 4 StVO) ──
      for (let j = 0; j < this.botCars.length; j++) {
        if (i === j) continue;
        const other = this.botCars[j];
        if (other.corridor.id !== corridor.id) continue;

        let diffDist = other.pathDist - car.pathDist;
        if (diffDist < 0 && diffDist > -corridor.totalLength + 40) {
          diffDist += corridor.totalLength;
        }

        if (diffDist > 0 && diffDist < 30) {
          if (diffDist < 7.5) {
            desiredSpeed = 0;
            stopReason = 'CAR_AHEAD';
            break;
          } else if (diffDist < 18.0) {
            const ratio = (diffDist - 7.5) / 10.5;
            desiredSpeed = Math.min(desiredSpeed, other.speed * ratio);
            stopReason = 'CAR_PROXIMITY';
            break;
          }
        }
      }

      // ── 3. GIỮ KHOẢNG CÁCH AN TOÀN VỚI XE NGƯỜI CHƠI (§ 4 StVO) ──
      if (playerPos) {
        const dx = playerPos.x - mesh.position.x;
        const dz = playerPos.z - mesh.position.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < 30 * 30) {
          // Tính thành phần khoảng cách theo vector tiến (forward dot product)
          const curGeom = this.evaluateCorridorPosition(corridor, car.pathDist);
          const forwardDot = dx * curGeom.ux + dz * curGeom.uz;
          const lateralDist = Math.abs(dx * (-curGeom.uz) + dz * curGeom.ux);

          // Nếu người chơi ở phía trước trong cùng hành lang và cùng hướng
          if (forwardDot > 0 && forwardDot < 24 && lateralDist < 3.8) {
            if (forwardDot < 8.0) {
              desiredSpeed = 0;
              stopReason = 'PLAYER_AHEAD';
            } else if (forwardDot < 18.0) {
              const ratio = (forwardDot - 8.0) / 10.0;
              desiredSpeed = Math.min(desiredSpeed, car.maxSpeed * ratio * 0.75);
              stopReason = 'PLAYER_PROXIMITY';
            }
          }
        }
      }

      // ── 4. GIA TỐC VÀ PHANH MƯỢT MÀ ──
      car.stopReason = stopReason;
      const accelRate = desiredSpeed < car.speed ? 6.5 : 2.8;
      car.speed += (desiredSpeed - car.speed) * Math.min(1.0, accelRate * dt);
      if (car.speed < 0.05) car.speed = 0;
      car.isBraking = desiredSpeed < car.speed - 0.4 || car.speed < 0.2;

      // ── 5. TỊNH TIẾN VỊ TRÍ THEO ĐÚNG CUNG ĐƯỜNG POLYLINE ──
      const moveDist = car.speed * dt;
      car.pathDist = (car.pathDist + moveDist) % corridor.totalLength;

      // ── 6. RECYCLE: XE RA KHỎI VÙNG GẦN NGƯỜI CHƠI → DỜI VỀ PHÍA TRƯỚC ──
      // Giữ mật độ giao thông quanh người chơi luôn dày đặc như phố thật
      if (playerPos && Number.isFinite(playerPos.x)) {
        const distToPlayer = Math.hypot(mesh.position.x - playerPos.x, mesh.position.z - playerPos.z);
        if (distToPlayer > this.recycleDist) {
          const playerS = this.findClosestPathDist(corridor, playerPos.x, playerPos.z);
          if (playerS !== null) {
            const respawnAhead = this.respawnAheadMin
              + Math.random() * (this.respawnAheadMax - this.respawnAheadMin);
            let candidateS = (playerS + respawnAhead) % corridor.totalLength;
            // Tránh dồn xe chồng lên nhau khi teleport: lùi thêm nếu quá sát xe khác
            for (let attempt = 0; attempt < 5; attempt++) {
              const tooClose = this.botCars.some(other => {
                if (other === car || other.corridor.id !== corridor.id) return false;
                let dd = other.pathDist - candidateS;
                if (dd < 0) dd += corridor.totalLength;
                if (dd > corridor.totalLength / 2) dd -= corridor.totalLength;
                return Math.abs(dd) < 22;
              });
              if (!tooClose) break;
              candidateS = (candidateS + 26) % corridor.totalLength;
            }
            car.pathDist = candidateS;
            const recycled = this.evaluateCorridorPosition(corridor, car.pathDist);
            const botElev = this.getElevationAt ? this.getElevationAt(recycled.posX, recycled.posZ, mesh.position.y) : 0;
            mesh.position.set(recycled.posX, 0.02 + botElev, recycled.posZ);
            mesh.userData._botY = botElev;
            mesh.rotation.y = recycled.heading;
            car.speed = car.targetSpeed * (0.7 + Math.random() * 0.3);
          }
        }
      }

      const finalGeom = this.evaluateCorridorPosition(corridor, car.pathDist);

      // ── 6b. CLAMP LÀN THẬT: corridor chỉ làm "não điều khiển dọc" (đèn, spacing, recycle).
      // Vị trí ngang cuối cùng luôn được chiếu lên tâm lane THẬT trong LaneGraph — bảo đảm xe bot
      // luôn chạy đúng giữa làn được render, kể cả khi corridor JSON lệch/cong khác mặt đường.
      if (corridor._cachedLane) {
        const proj = this._projectOntoLane(corridor._cachedLane, finalGeom.posX, finalGeom.posZ);
        if (proj && proj.dist < 6) {
          finalGeom.posX = proj.px;
          finalGeom.posZ = proj.pz;
          finalGeom.heading = proj.heading;
        } else {
          // Corridor đã rời lane đang cache (hết fragment / rẽ đường) → tìm lane kế tiếp
          corridor._cachedLane = this._cacheCorridorLane(corridor, finalGeom.posX, finalGeom.posZ, finalGeom.heading);
        }
      } else if (!corridor._laneCacheBanned) {
        corridor._cachedLane = this._cacheCorridorLane(corridor, finalGeom.posX, finalGeom.posZ, finalGeom.heading);
      }

      mesh.position.x = finalGeom.posX;
      // 🌉 Bot y theo cao độ mặt đường (cầu bridge/layer) — sample liên tục theo y hiện tại
      const moveElev = this.getElevationAt ? this.getElevationAt(finalGeom.posX, finalGeom.posZ, mesh.position.y) : 0;
      mesh.position.y = 0.02 + moveElev;
      mesh.position.z = finalGeom.posZ;
      mesh.rotation.y = finalGeom.heading;

      // ── 7. HIỆU ỨNG CHUYỂN ĐỘNG: ĐÈN PHANH & LĂN BÁNH XE ──
      if (mesh._brakeLights && mesh._brakeLights.length > 0) {
        const brakeOn = car.isBraking || car.speed < 0.3;
        const targetIntensity = brakeOn ? 2.6 : 0.5;
        mesh._brakeLights.forEach(l => {
          l.material.emissiveIntensity += (targetIntensity - l.material.emissiveIntensity) * Math.min(1, 12 * dt);
        });
      }
      if (mesh._wheels && mesh._wheels.length > 0) {
        car.wheelRot += (car.speed / 0.32) * dt;
        for (const wheel of mesh._wheels) {
          wheel.node.rotation[wheel.axis] = wheel.base + car.wheelRot;
        }
      }
    }
  }

  /**
   * Cung cấp trạng thái trực quan thời gian thực của toàn bộ xe bot cho Radar Minimap & Overview Modal
   */
  getTrafficStates() {
    if (!this.botCars || this.botCars.length === 0) return [];
    return this.botCars.map(c => ({
      id: c.id,
      corridorId: c.corridor?.id,
      x: c.mesh.position.x,
      z: c.mesh.position.z,
      heading: c.mesh.rotation.y,
      speedKmH: Math.round(c.speed * 3.6),
      color: c.color,
      isBraking: c.isBraking,
      stopReason: c.stopReason
    }));
  }

  /**
   * Xóa toàn bộ xe bot khi chuyển bản đồ
   */
  clear() {
    if (this.botCars && this.botCars.length > 0) {
      this.botCars.forEach(car => {
        if (car.mesh && this.scene) {
          this.scene.remove(car.mesh);
        }
      });
      this.botCars = [];
    }
    this.sceneLightGroups = [];
  }
}
