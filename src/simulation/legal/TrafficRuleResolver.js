/**
 * 🚦 TRAFFIC RULE RESOLVER (German StVO Dynamic Rule Engine - Phase 1)
 * ====================================================================
 * 
 * Central Facade & Resolution Engine bridging:
 *   Road Graph / Lane Graph  <───>  Traffic Rules  <───>  [AI, Examiner, RoutePlanner, 3D Signs]
 * 
 * Architectural Guarantees:
 *  1. Single Source of Truth: Both AI & Examiner evaluate identical rules.
 *  2. Separation of Concerns: Rules are semantic law (StVO); vehicle dynamics are behavior.
 *  3. Canonical Road Coordinates: Correct Frenet conversions for FORWARD & BACKWARD lanes.
 *  4. Strict Speed Hierarchy: EXPLICIT_SIGN > ZONE > OSM > STVO_DEFAULT.
 *  5. Provenance Tracking: Every resolved rule states its source & official StVO identity.
 */

import { TrafficRuleType, RuleSource, MovementType, StVOSignCatalog } from './TrafficRuleSchema.js';

// ── 1. TOẠ ĐỘ CANONICAL & CHUYỂN ĐỔI FRENET ─────────────────────────────────

export function getDistanceAlongRoad(lane, distAlongLane, roadLength) {
  const R = roadLength || lane?.totalLength || 0;
  const startTrim = lane?.startTrim || 0;
  const endTrim = lane?.endTrim || Math.max(0, R - startTrim - (lane?.totalLength || R));

  if (lane?.direction === 'BACKWARD') {
    const roadStart = R - endTrim;
    return Math.max(startTrim, Math.min(roadStart, roadStart - distAlongLane));
  }
  return Math.max(startTrim, Math.min(R - endTrim, startTrim + distAlongLane));
}

export function getDistanceAlongLane(lane, distAlongRoad, roadLength) {
  const R = roadLength || lane?.totalLength || 0;
  const startTrim = lane?.startTrim || 0;
  const endTrim = lane?.endTrim || Math.max(0, R - startTrim - (lane?.totalLength || R));
  const laneLen = lane?.totalLength || Math.max(0, R - startTrim - endTrim);

  if (lane?.direction === 'BACKWARD') {
    const roadStart = R - endTrim;
    return Math.max(0, Math.min(laneLen, roadStart - distAlongRoad));
  }
  return Math.max(0, Math.min(laneLen, distAlongRoad - startTrim));
}

// ── 2. SUB-RESOLVERS CHUYÊN TRÁCH (MODULAR SPECIALISTS) ─────────────────────

/**
 * 2.1 Bộ phân giải giới hạn tốc độ theo thứ bậc ưu tiên chuẩn CHLB Đức
 */
export class SpeedLimitResolver {
  static resolve({ lane, distAlongLane, road, roadRules, zones }) {
    const roadLength = road?.length || lane?.totalLength || 100;
    const distAlongRoad = getDistanceAlongRoad(lane, distAlongLane, roadLength);

    // Bậc 1: Explicit Traffic Sign (Biển báo cắm trực tiếp trên đường)
    if (roadRules && roadRules.length > 0) {
      // Lọc các biển tốc độ áp dụng cho hướng và làn này
      const candidateSigns = roadRules.filter(r => {
        if (r.type !== TrafficRuleType.MAX_SPEED && r.type !== TrafficRuleType.SPEED_UNRESTRICTED) return false;
        if (r.direction && r.direction !== 'BOTH' && r.direction !== lane.direction) return false;
        if (r.appliesToLanes && !r.appliesToLanes.includes('all') && !r.appliesToLanes.includes(lane.id) && !r.appliesToLanes.includes(lane.laneIndex)) return false;
        return true;
      });

      // Sắp xếp các biển theo thứ tự xe gặp phải trên làn (distAlongLaneToSign)
      const passedSigns = [];
      for (const sign of candidateSigns) {
        const signDistAlongLane = getDistanceAlongLane(lane, sign.distanceAlongRoad, roadLength);
        if (distAlongLane >= signDistAlongLane) {
          passedSigns.push({ sign, signDistAlongLane });
        }
      }

      if (passedSigns.length > 0) {
        // Lấy biển báo gần nhất mà xe vừa đi qua
        passedSigns.sort((a, b) => b.signDistAlongLane - a.signDistAlongLane);
        const activeSignEntry = passedSigns[0];
        const activeSign = activeSignEntry.sign;

        if (activeSign.type === TrafficRuleType.MAX_SPEED) {
          const signMeta = StVOSignCatalog[activeSign.sign?.code] || StVOSignCatalog.VZ_274;
          return {
            value: activeSign.value,
            source: activeSign.source || RuleSource.EXPLICIT_SIGN,
            ruleId: activeSign.id,
            signCode: signMeta.code,
            signNameDe: `${signMeta.titleDe} (${activeSign.value} km/h)`,
            signNameVi: `${signMeta.titleVi} (${activeSign.value} km/h)`,
            distanceSinceSignMeters: distAlongLane - activeSignEntry.signDistAlongLane
          };
        }
        // Nếu là SPEED_UNRESTRICTED (Zeichen 278), bỏ qua để rơi xuống Bậc 2
      }
    }

    // Bậc 2: Zone Rule (Khu vực Tempo-30-Zone hoặc Phố êm dịu)
    // NOTE: roadIds-based zone = simulation approximation when no continuous 2D spatial polygon boundary exists.
    // When a vehicle enters/exits a road not in zone.roadIds, zone status toggles deterministically.
    if (zones && road) {
      for (const zoneId of Object.keys(zones)) {
        const zone = zones[zoneId];
        if (zone.roadIds && zone.roadIds.includes(road.id)) {
          const isPlayStreet = zone.type === 'PLAY_STREET';
          const zoneMeta = isPlayStreet ? StVOSignCatalog.VZ_325_1 : StVOSignCatalog.VZ_274_1;
          const zoneSpeed = zone.defaultSpeed || (isPlayStreet ? 10 : 30);
          return {
            value: zoneSpeed,
            source: RuleSource.ZONE,
            zoneId: zone.id,
            signCode: zoneMeta.code,
            signNameDe: `${zone.nameDe || zoneMeta.titleDe} (${zoneSpeed} km/h)`,
            signNameVi: `${zone.nameVi || zoneMeta.titleVi} (${zoneSpeed} km/h)`
          };
        }
      }
    }

    // Bậc 3: OSM maxspeed tag (Thuộc tính bản đồ OpenStreetMap)
    if (road && typeof road.speedLimit === 'number' && road.speedLimit > 0) {
      return {
        value: road.speedLimit,
        source: RuleSource.OSM,
        roadId: road.id,
        signCode: null,
        signNameDe: `OSM Richtgeschwindigkeit (${road.speedLimit} km/h)`,
        signNameVi: `Tốc độ thiết kế theo bản đồ OSM (${road.speedLimit} km/h)`
      };
    }

    // Bậc 4: German StVO Statutory Default (§ 3 Abs. 3 Nr. 1 StVO - Nội thị)
    return {
      value: 50,
      source: RuleSource.STVO_DEFAULT,
      signCode: null,
      signNameDe: '§ 3 Abs. 3 Nr. 1 StVO (Innerorts 50 km/h)',
      signNameVi: 'Tốc độ tối đa mặc định trong đô thị CHLB Đức (§ 3 StVO: 50 km/h)'
    };
  }
}

/**
 * 2.2 Bộ phân giải sự kiện / biển báo sắp tới phía trước xe (Lookahead)
 */
export class SignRuleResolver {
  static getUpcoming({ lane, distAlongLane, road, roadRules, lookaheadMeters = 50.0 }) {
    const roadLength = road?.length || lane?.totalLength || 100;
    const upcoming = [];

    if (!roadRules || roadRules.length === 0) return upcoming;

    for (const rule of roadRules) {
      // Bỏ qua nếu không cùng chiều di chuyển
      if (rule.direction && rule.direction !== 'BOTH' && rule.direction !== lane.direction) continue;
      if (rule.appliesToLanes && !rule.appliesToLanes.includes('all') && !rule.appliesToLanes.includes(lane.id) && !rule.appliesToLanes.includes(lane.laneIndex)) continue;

      const ruleDistAlongLane = getDistanceAlongLane(lane, rule.distanceAlongRoad, roadLength);
      const delta = ruleDistAlongLane - distAlongLane;

      // Chỉ lấy các biển nằm phía trước trong tầm nhìn lookahead
      if (delta > 0 && delta <= lookaheadMeters) {
        const signMeta = StVOSignCatalog[rule.sign?.code] || null;
        upcoming.push({
          ruleId: rule.id,
          type: rule.type,
          source: rule.source || RuleSource.EXPLICIT_SIGN,
          distanceMeters: Math.round(delta * 10) / 10,
          value: rule.value,
          junctionId: rule.junctionId,
          stopLineId: rule.stopLineId,
          movement: rule.movement,
          allowed: rule.allowed !== false,
          signCode: signMeta?.code || rule.sign?.code || null,
          titleDe: signMeta?.titleDe || rule.type,
          titleVi: signMeta?.titleVi || rule.type,
          paragraph: signMeta?.paragraph || null
        });
      }
    }

    // Sắp xếp tăng dần theo khoảng cách gần nhất tới xa nhất
    return upcoming.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}

/**
 * 2.3 Bộ phân giải quy tắc tại nút giao & hướng rẽ bắt buộc
 */
export class JunctionRuleResolver {
  static isMovementAllowed({ rules, incomingLane, junctionId, movement }) {
    if (!rules || rules.length === 0) {
      return { allowed: true, reasonDe: 'Keine Abbiegebeschränkungen', reasonVi: 'Không có biển cấm rẽ' };
    }

    const relevantRules = rules.filter(r => {
      if (r.type !== TrafficRuleType.TURN_RESTRICTION) return false;
      if (junctionId && r.junctionId && r.junctionId !== junctionId) return false;
      if (incomingLane) {
        if (r.incomingRoadId && r.incomingRoadId !== incomingLane.roadId) return false;
        if (r.incomingLaneId && r.incomingLaneId !== incomingLane.id) return false;
      }
      return true;
    });

    for (const r of relevantRules) {
      // Kiểm tra quy định cấm rẽ cụ thể (NO_LEFT_TURN, v.v.)
      if (r.movement === movement && r.allowed === false) {
        const signMeta = StVOSignCatalog[r.sign?.code] || null;
        return {
          allowed: false,
          ruleId: r.id,
          source: r.source || RuleSource.MAP_EDITOR,
          signCode: signMeta?.code || null,
          reasonDe: `Abbiegen verboten: ${movement} (${signMeta?.titleDe || 'Zeichen 209'})`,
          reasonVi: `Cấm chuyển hướng: ${movement} (${signMeta?.titleVi || 'Biển hiệu lệnh'})`
        };
      }

      // Kiểm tra hiệu lệnh hướng đi bắt buộc (Vorgeschriebene Fahrtrichtung)
      if (r.mandatoryMovements && Array.isArray(r.mandatoryMovements)) {
        if (!r.mandatoryMovements.includes(movement)) {
          return {
            allowed: false,
            ruleId: r.id,
            source: r.source || RuleSource.MAP_EDITOR,
            reasonDe: `Vorgeschriebene Fahrtrichtung: nur ${r.mandatoryMovements.join(', ')} erlaubt`,
            reasonVi: `Chỉ được phép đi các hướng: ${r.mandatoryMovements.join(', ')}`
          };
        }
      }
    }

    return { allowed: true, reasonDe: 'Abbiegen erlaubt', reasonVi: 'Được phép chuyển hướng' };
  }

  static getPriorityRule({ rules, junction, approachLane }) {
    // 1. Nếu nút giao có đèn giao thông đang hoạt động
    if (junction?.hasTrafficLight) {
      return {
        priority: 'AMPEL',
        paragraph: '§ 37 Abs. 2 StVO',
        titleDe: 'Lichtzeichenanlage (Ampel)',
        titleVi: 'Đèn tín hiệu giao thông (§ 37 StVO)'
      };
    }

    // 2. Kiểm tra biển báo ưu tiên cụ thể gắn trên làn tiếp cận
    if (rules && approachLane) {
      const approachRules = rules.filter(r => 
        (r.roadId === approachLane.roadId || r.laneIds?.includes(approachLane.id)) &&
        r.junctionId === junction?.id
      );

      for (const r of approachRules) {
        if (r.type === TrafficRuleType.STOP) {
          return {
            priority: 'STOP',
            ruleId: r.id,
            stopLineId: r.stopLineId,
            paragraph: '§ 41 Abs. 1 StVO (Zeichen 206)',
            titleDe: 'Halt! Vorfahrt gewähren! (Stoppschild)',
            titleVi: 'Biển STOP: Bắt buộc dừng xe và nhường quyền ưu tiên'
          };
        }
        if (r.type === TrafficRuleType.YIELD) {
          return {
            priority: 'YIELD',
            ruleId: r.id,
            paragraph: '§ 41 Abs. 1 StVO (Zeichen 205)',
            titleDe: 'Vorfahrt gewähren!',
            titleVi: 'Biển nhường quyền ưu tiên (Zeichen 205)'
          };
        }
        if (r.type === TrafficRuleType.PRIORITY_ROAD) {
          return {
            priority: 'PRIORITY_ROAD',
            ruleId: r.id,
            paragraph: '§ 42 Abs. 2 StVO (Zeichen 306)',
            titleDe: 'Vorfahrtstraße',
            titleVi: 'Đường ưu tiên (Zeichen 306)'
          };
        }
      }
    }

    // 3. Quyền ưu tiên từ thuộc tính của Junction trong RoadGraph nếu có
    if (junction?.priorityRule === 'STOP' || junction?.hasStopSign) {
      return {
        priority: 'STOP',
        paragraph: '§ 41 Abs. 1 StVO (Zeichen 206)',
        titleDe: 'Halt! Vorfahrt gewähren!',
        titleVi: 'Biển STOP'
      };
    }
    if (junction?.priorityRule === 'GIVE_WAY' || junction?.hasGiveWay) {
      return {
        priority: 'YIELD',
        paragraph: '§ 41 Abs. 1 StVO (Zeichen 205)',
        titleDe: 'Vorfahrt gewähren!',
        titleVi: 'Biển nhường quyền'
      };
    }
    if (junction?.priorityRule === 'PRIORITY') {
      return {
        priority: 'PRIORITY_ROAD',
        paragraph: '§ 42 Abs. 2 StVO (Zeichen 306)',
        titleDe: 'Vorfahrtstraße',
        titleVi: 'Đường ưu tiên'
      };
    }

    // 4. Mặc định quy tắc bên phải trước Rechts vor Links (§ 8 StVO)
    return {
      priority: 'RECHTS_VOR_LINKS',
      paragraph: '§ 8 Abs. 1 StVO',
      titleDe: 'Rechts-vor-Links Vorfahrtregel',
      titleVi: 'Quy tắc Bên Phải Trước (Rechts vor Links - § 8 StVO)'
    };
  }
}

// ── 3. FACADE CHÍNH: TRAFFIC RULE RESOLVER ──────────────────────────────────

export class TrafficRuleResolver {
  /**
   * @param {LaneGraphGenerator} laneGraph
   * @param {Object} trafficRulesData (chứa rules[] và zones{})
   */
  constructor(laneGraph, trafficRulesData = {}) {
    this.laneGraph = laneGraph;
    this.rawRules = trafficRulesData.rules || [];
    this.zones = trafficRulesData.zones || {};

    // Index nhanh theo roadId
    this.rulesByRoad = new Map();
    this.rulesById = new Map();

    this._indexRules();
  }

  _indexRules() {
    this.rulesByRoad.clear();
    this.rulesById.clear();

    for (const rule of this.rawRules) {
      this.rulesById.set(rule.id, rule);
      if (rule.roadId) {
        if (!this.rulesByRoad.has(rule.roadId)) {
          this.rulesByRoad.set(rule.roadId, []);
        }
        this.rulesByRoad.get(rule.roadId).push(rule);
      }
    }
  }

  /**
   * Thêm hoặc cập nhật rule mới (Hỗ trợ mở rộng từ Map Editor / Scenario)
   */
  registerRule(rule) {
    if (!rule.id) rule.id = `rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const existingIdx = this.rawRules.findIndex(r => r.id === rule.id);
    if (existingIdx >= 0) {
      this.rawRules[existingIdx] = rule;
    } else {
      this.rawRules.push(rule);
    }
    this._indexRules();
    return rule;
  }

  /**
   * Xóa một rule theo ID
   */
  removeRule(ruleId) {
    this.rawRules = this.rawRules.filter(r => r.id !== ruleId);
    this._indexRules();
  }

  /**
   * Truy vấn giới hạn tốc độ hiện tại tại vị trí (lane, distAlongLane)
   */
  getSpeedLimit({ lane, distAlongLane }) {
    if (!lane) {
      return {
        value: 50,
        source: RuleSource.STVO_DEFAULT,
        signNameDe: '§ 3 StVO (Innerorts 50 km/h)',
        signNameVi: 'Tốc độ đô thị mặc định (50 km/h)'
      };
    }

    const road = this.laneGraph?.roadMap?.get(lane.roadId);
    const roadRules = this.rulesByRoad.get(lane.roadId) || [];

    return SpeedLimitResolver.resolve({
      lane,
      distAlongLane: distAlongLane || 0,
      road,
      roadRules,
      zones: this.zones
    });
  }

  /**
   * Quét các biển báo / sự kiện luật sắp xuất hiện trong tầm nhìn phía trước
   */
  getUpcomingRules({ lane, distAlongLane, lookaheadMeters = 50.0 }) {
    if (!lane) return [];

    const road = this.laneGraph?.roadMap?.get(lane.roadId);
    const roadRules = this.rulesByRoad.get(lane.roadId) || [];

    return SignRuleResolver.getUpcoming({
      lane,
      distAlongLane: distAlongLane || 0,
      road,
      roadRules,
      lookaheadMeters
    });
  }

  /**
   * Kiểm tra xem hướng rẽ có bị cấm không
   */
  isMovementAllowed({ incomingLane, junctionId, movement }) {
    return JunctionRuleResolver.isMovementAllowed({
      rules: this.rawRules,
      incomingLane,
      junctionId,
      movement
    });
  }

  /**
   * Xác định luật ưu tiên tại ngã tư
   */
  getPriorityRule({ junction, approachLane }) {
    return JunctionRuleResolver.getPriorityRule({
      rules: this.rawRules,
      junction,
      approachLane
    });
  }

  /**
   * Tính toán vị trí 3D chính xác trên vỉa hè phải (§ 2 StVO) cho Three.js Rendering
   */
  getSign3DPlacement(rule) {
    if (!rule.roadId || rule.distanceAlongRoad === undefined) return null;
    const road = this.laneGraph?.roadMap?.get(rule.roadId);
    if (!road || !road.centerline || road.centerline.length < 2) return null;

    const roadLength = road.length || 50;
    const s = Math.max(0, Math.min(roadLength, rule.distanceAlongRoad));
    const isForward = rule.direction !== 'BACKWARD';

    // Nội suy vị trí điểm P và vector tiếp tuyến dọc theo polyline
    const points = road.centerline;
    let accumulated = 0;
    let targetP = points[0];
    let ux = 1, uz = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      if (segLen === 0) continue;

      if (accumulated + segLen >= s) {
        const t = (s - accumulated) / segLen;
        targetP = [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
        ux = (p2[0] - p1[0]) / segLen;
        uz = (p2[1] - p1[1]) / segLen;
        break;
      }
      accumulated += segLen;
    }

    // Right-hand normal: (uz, -ux)
    const nx = uz;
    const nz = -ux;

    const halfW = (road.width || 8.0) / 2;
    const curbOffset = 0.35; // Nằm cách mép đường 35cm trên vỉa hè
    const sideMultiplier = isForward ? -1 : 1; // Hướng FORWARD lề phải là bên -n; BACKWARD lề phải là bên +n
    const lateralDist = (halfW + curbOffset) * sideMultiplier;

    const posX = targetP[0] + nx * lateralDist;
    const posZ = targetP[1] + nz * lateralDist;

    // Mặt biển quay đối diện hướng xe chạy
    const rotY = isForward ? Math.atan2(-ux, -uz) : Math.atan2(ux, uz);

    return {
      position: [posX, 0, posZ],
      rotation: [0, rotY, 0],
      signCode: rule.sign?.code || null,
      value: rule.value
    };
  }
}
