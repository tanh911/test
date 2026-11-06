import { describe, it, expect, beforeEach } from 'vitest';
import {
  TrafficRuleResolver,
  getDistanceAlongRoad,
  getDistanceAlongLane,
  SpeedLimitResolver,
  SignRuleResolver,
  JunctionRuleResolver
} from './TrafficRuleResolver.js';
import { TrafficRuleType, RuleSource, MovementType, StVOSignCatalog } from './TrafficRuleSchema.js';

describe('🚦 TrafficRuleResolver & StVO Rule Engine (Phase 1)', () => {
  let mockLaneGraph;
  let mockRulesData;
  let resolver;

  beforeEach(() => {
    // Mock Road & Lane Graph
    mockLaneGraph = {
      roadMap: new Map([
        [
          'road_friedrich',
          {
            id: 'road_friedrich',
            name: 'Friedrichstraße',
            length: 120.0,
            width: 8.0,
            speedLimit: 50,
            centerline: [
              [0, 0],
              [0, 120]
            ]
          }
        ],
        [
          'road_scheunen',
          {
            id: 'road_scheunen',
            name: 'Linienstraße',
            length: 80.0,
            width: 6.0,
            speedLimit: null, // Không có tag maxspeed trong OSM
            centerline: [
              [10, 0],
              [10, 80]
            ]
          }
        ]
      ]),
      laneMap: new Map([
        [
          'lane_fwd_0',
          {
            id: 'lane_fwd_0',
            roadId: 'road_friedrich',
            direction: 'FORWARD',
            laneIndex: 0,
            totalLength: 120.0,
            speedLimit: 50
          }
        ],
        [
          'lane_bwd_0',
          {
            id: 'lane_bwd_0',
            roadId: 'road_friedrich',
            direction: 'BACKWARD',
            laneIndex: 0,
            totalLength: 120.0,
            speedLimit: 50
          }
        ],
        [
          'lane_scheunen_fwd',
          {
            id: 'lane_scheunen_fwd',
            roadId: 'road_scheunen',
            direction: 'FORWARD',
            laneIndex: 0,
            totalLength: 80.0
          }
        ]
      ])
    };

    mockRulesData = {
      zones: {
        zone_scheunen_30: {
          id: 'zone_scheunen_30',
          type: 'ZONE_30',
          nameDe: 'Tempo 30-Zone Scheunenviertel',
          nameVi: 'Khu vực Tempo-30',
          defaultSpeed: 30,
          roadIds: ['road_scheunen']
        }
      },
      rules: [
        {
          id: 'sign_speed_30_friedrich',
          type: TrafficRuleType.MAX_SPEED,
          source: RuleSource.EXPLICIT_SIGN,
          roadId: 'road_friedrich',
          direction: 'FORWARD',
          distanceAlongRoad: 40.0,
          appliesToLanes: ['all'],
          value: 30,
          sign: { code: 'VZ_274', variant: '30' }
        },
        {
          id: 'sign_stop_friedrich_end',
          type: TrafficRuleType.STOP,
          source: RuleSource.EXPLICIT_SIGN,
          roadId: 'road_friedrich',
          direction: 'FORWARD',
          distanceAlongRoad: 115.0,
          junctionId: 'j_udl',
          stopLineId: 'stopline_friedrich_udl',
          sign: { code: 'VZ_206' }
        },
        {
          id: 'sign_no_left_turn_udl',
          type: TrafficRuleType.TURN_RESTRICTION,
          source: RuleSource.MAP_EDITOR,
          roadId: 'road_friedrich',
          junctionId: 'j_udl',
          incomingRoadId: 'road_friedrich',
          movement: MovementType.LEFT,
          allowed: false,
          sign: { code: 'VZ_209_10' }
        }
      ]
    };

    resolver = new TrafficRuleResolver(mockLaneGraph, mockRulesData);
  });

  // ── 1. KIỂM THỬ TOẠ ĐỘ FRENET CANONICAL & HƯỚNG LÀN ĐƯỜNG ───────────────
  describe('1. Canonical Frenet Coordinate Transformations', () => {
    const laneFwd = { direction: 'FORWARD', totalLength: 120.0 };
    const laneBwd = { direction: 'BACKWARD', totalLength: 120.0 };

    it('should map distance on FORWARD lane 1:1 with road centerline', () => {
      expect(getDistanceAlongRoad(laneFwd, 35.0, 120.0)).toBe(35.0);
      expect(getDistanceAlongLane(laneFwd, 35.0, 120.0)).toBe(35.0);
    });

    it('should correctly invert distance on BACKWARD lane relative to road centerline', () => {
      // Trên làn ngược, xe ở điểm xuất phát distAlongLane = 0 tương ứng với cuối đường distAlongRoad = 120
      expect(getDistanceAlongRoad(laneBwd, 0.0, 120.0)).toBe(120.0);
      expect(getDistanceAlongRoad(laneBwd, 30.0, 120.0)).toBe(90.0);

      // Biển báo cắm tại 40m trên tim đường thì xe đi ngược chiều sẽ gặp ở vị trí 120 - 40 = 80m
      expect(getDistanceAlongLane(laneBwd, 40.0, 120.0)).toBe(80.0);
    });
  });

  // ── 2. KIỂM THỬ THỨ BẬC ƯU TIÊN TỐC ĐỘ (SPEED LIMIT HIERARCHY) ─────────
  describe('2. Speed Limit Resolution Hierarchy & Provenance', () => {
    it('Bậc 1: Explicit Traffic Sign overrides Zone, OSM and StVO default', () => {
      const laneFwd = mockLaneGraph.laneMap.get('lane_fwd_0');

      // Trước khi đi qua biển 30 (ở vị trí 20m < 40m): hưởng tốc độ OSM = 50 km/h
      const preSign = resolver.getSpeedLimit({ lane: laneFwd, distAlongLane: 20.0 });
      expect(preSign.value).toBe(50);
      expect(preSign.source).toBe(RuleSource.OSM);

      // Sau khi đi qua biển 30 (ở vị trí 50m >= 40m): tốc độ chuyển thành 30 km/h có nguồn EXPLICIT_SIGN
      const postSign = resolver.getSpeedLimit({ lane: laneFwd, distAlongLane: 50.0 });
      expect(postSign.value).toBe(30);
      expect(postSign.source).toBe(RuleSource.EXPLICIT_SIGN);
      expect(postSign.ruleId).toBe('sign_speed_30_friedrich');
      expect(postSign.signCode).toBe('VZ_274');
      expect(postSign.distanceSinceSignMeters).toBe(10.0);
    });

    it('Bậc 2: Zone Rule applies if no explicit sign overrides it', () => {
      const laneScheunen = mockLaneGraph.laneMap.get('lane_scheunen_fwd');

      // Đường nằm trong Tempo 30-Zone
      const res = resolver.getSpeedLimit({ lane: laneScheunen, distAlongLane: 15.0 });
      expect(res.value).toBe(30);
      expect(res.source).toBe(RuleSource.ZONE);
      expect(res.zoneId).toBe('zone_scheunen_30');
      expect(res.signCode).toBe('VZ_274.1');
    });

    it('Bậc 4: Falls back to German StVO statutory default (50 km/h Innerorts) if no metadata', () => {
      const unmappedLane = {
        id: 'lane_unknown',
        roadId: 'road_unknown',
        direction: 'FORWARD',
        totalLength: 100.0
      };

      const res = resolver.getSpeedLimit({ lane: unmappedLane, distAlongLane: 10.0 });
      expect(res.value).toBe(50);
      expect(res.source).toBe(RuleSource.STVO_DEFAULT);
      expect(res.signNameDe).toContain('Innerorts 50 km/h');
    });
  });

  // ── 3. KIỂM THỬ QUÉT BIỂN BÁO SẮP TỚI (LOOKAHEAD SCANNING) ───────────────
  describe('3. Upcoming Signs & Lookahead Event Scanning', () => {
    it('detects upcoming signs ahead within lookahead distance', () => {
      const laneFwd = mockLaneGraph.laneMap.get('lane_fwd_0');

      // Xe đang ở vị trí 10m: biển 30 ở 40m (cách 30m) nằm trong tầm nhìn lookahead 40m
      const upcoming = resolver.getUpcomingRules({ lane: laneFwd, distAlongLane: 10.0, lookaheadMeters: 40.0 });
      expect(upcoming.length).toBe(1);
      expect(upcoming[0].ruleId).toBe('sign_speed_30_friedrich');
      expect(upcoming[0].distanceMeters).toBe(30.0);
      expect(upcoming[0].value).toBe(30);
    });

    it('ignores signs that the vehicle has already passed', () => {
      const laneFwd = mockLaneGraph.laneMap.get('lane_fwd_0');

      // Xe đã ở vị trí 60m: biển 30 ở 40m đã đi qua; chỉ còn biển STOP ở 115m (cách 55m)
      const upcoming = resolver.getUpcomingRules({ lane: laneFwd, distAlongLane: 60.0, lookaheadMeters: 60.0 });
      expect(upcoming.length).toBe(1);
      expect(upcoming[0].ruleId).toBe('sign_stop_friedrich_end');
      expect(upcoming[0].type).toBe(TrafficRuleType.STOP);
      expect(upcoming[0].distanceMeters).toBe(55.0);
      expect(upcoming[0].stopLineId).toBe('stopline_friedrich_udl');
    });
  });

  // ── 4. KIỂM THỬ QUY TẮC NÚT GIAO & CẤM RẼ (JUNCTION RESTRICTIONS) ────────
  describe('4. Junction Movement Restrictions & Priority Rules', () => {
    it('correctly identifies forbidden movements (NO_LEFT_TURN)', () => {
      const laneFwd = mockLaneGraph.laneMap.get('lane_fwd_0');

      // Rẽ trái bị cấm theo rule_no_left_turn_udl
      const turnLeft = resolver.isMovementAllowed({
        incomingLane: laneFwd,
        junctionId: 'j_udl',
        movement: MovementType.LEFT
      });
      expect(turnLeft.allowed).toBe(false);
      expect(turnLeft.ruleId).toBe('sign_no_left_turn_udl');
      expect(turnLeft.source).toBe(RuleSource.MAP_EDITOR);

      // Đi thẳng vẫn được phép
      const goStraight = resolver.isMovementAllowed({
        incomingLane: laneFwd,
        junctionId: 'j_udl',
        movement: MovementType.STRAIGHT
      });
      expect(goStraight.allowed).toBe(true);
    });

    it('resolves priority rules for intersection approaches', () => {
      const laneFwd = mockLaneGraph.laneMap.get('lane_fwd_0');
      const junction = { id: 'j_udl', hasTrafficLight: false };

      // Có biển STOP gắn vào laneFwd tại junction j_udl
      const prio = resolver.getPriorityRule({ junction, approachLane: laneFwd });
      expect(prio.priority).toBe('STOP');
      expect(prio.stopLineId).toBe('stopline_friedrich_udl');
      expect(prio.paragraph).toContain('Zeichen 206');
    });

    it('falls back to Rechts-vor-Links (§ 8 StVO) when no lights or signs exist', () => {
      const neutralJunction = { id: 'j_neutral', hasTrafficLight: false };
      const laneScheunen = mockLaneGraph.laneMap.get('lane_scheunen_fwd');

      const prio = resolver.getPriorityRule({ junction: neutralJunction, approachLane: laneScheunen });
      expect(prio.priority).toBe('RECHTS_VOR_LINKS');
      expect(prio.paragraph).toContain('§ 8 Abs. 1 StVO');
    });
  });

  // ── 5. KIỂM THỬ TÍNH TOÁN VỊ TRÍ 3D TRÊN LỀ PHẢI (3D CURB PLACEMENT) ───
  describe('5. Procedural 3D Sign Placement (§ 2 StVO Rechtsfahrgebot)', () => {
    it('calculates 3D position on right curb facing oncoming traffic for FORWARD rule', () => {
      const ruleFwd = {
        id: 'sign_3d_test_fwd',
        roadId: 'road_friedrich',
        direction: 'FORWARD',
        distanceAlongRoad: 50.0,
        sign: { code: 'VZ_274' }
      };

      const placement = resolver.getSign3DPlacement(ruleFwd);
      expect(placement).not.toBeNull();
      // Với đường hướng từ [0,0] đến [0,120] (dọc trục Z, +u = [0, 1]):
      // Right normal n = (uz, -ux) = (1, 0) -> Lề phải là x = -(halfW + curbOffset) = -(4.0 + 0.35) = -4.35
      expect(placement.position[0]).toBeCloseTo(-4.35, 1);
      expect(placement.position[1]).toBe(0);
      expect(placement.position[2]).toBeCloseTo(50.0, 1);
    });

    it('calculates 3D position on right curb facing oncoming traffic for BACKWARD rule', () => {
      const ruleBwd = {
        id: 'sign_3d_test_bwd',
        roadId: 'road_friedrich',
        direction: 'BACKWARD',
        distanceAlongRoad: 50.0,
        sign: { code: 'VZ_274' }
      };

      const placement = resolver.getSign3DPlacement(ruleBwd);
      expect(placement).not.toBeNull();
      // Đối với xe chạy ngược chiều (từ 120 về 0), lề phải của nó nằm ở phía x = +(halfW + curbOffset) = +4.35
      expect(placement.position[0]).toBeCloseTo(4.35, 1);
      expect(placement.position[2]).toBeCloseTo(50.0, 1);
    });
  });
});
