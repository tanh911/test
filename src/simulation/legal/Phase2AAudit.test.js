import { describe, it, expect } from 'vitest';
import {
  TrafficRuleResolver,
  getDistanceAlongRoad,
  getDistanceAlongLane
} from './TrafficRuleResolver.js';
import { TrafficRuleType, RuleSource, StVOSignCatalog } from './TrafficRuleSchema.js';
import { LaneGraphGenerator } from './LaneGraphGenerator.js';

describe('🔍 Phase 2A Audit Checklist (Strict Verification Before Phase 2B)', () => {
  // ── AUDIT ITEM 1: PROVENANCE TEST (ZONE VS EXPLICIT SIGN) ───────────────────
  it('Audit Item 1: Returns source = ZONE for Tempo-30-Zone, and source = EXPLICIT_SIGN for VZ_274', () => {
    const mockLaneGraph = {
      roadMap: new Map([
        ['road_zone', { id: 'road_zone', length: 100, centerline: [[0,0], [0,100]] }],
        ['road_sign', { id: 'road_sign', length: 100, centerline: [[0,0], [0,100]] }]
      ]),
      laneMap: new Map([
        ['lane_zone', { id: 'lane_zone', roadId: 'road_zone', direction: 'FORWARD', totalLength: 100 }],
        ['lane_sign', { id: 'lane_sign', roadId: 'road_sign', direction: 'FORWARD', totalLength: 100 }]
      ])
    };

    const mockRules = {
      zones: {
        zone_30: { id: 'zone_30', type: 'ZONE_30', defaultSpeed: 30, roadIds: ['road_zone'] }
      },
      rules: [
        {
          id: 'sign_274_test',
          type: TrafficRuleType.MAX_SPEED,
          source: RuleSource.EXPLICIT_SIGN,
          roadId: 'road_sign',
          direction: 'FORWARD',
          distanceAlongRoad: 20.0,
          value: 30,
          sign: { code: 'VZ_274' }
        }
      ]
    };

    const resolver = new TrafficRuleResolver(mockLaneGraph, mockRules);

    // 1. Zone test: Must return source === RuleSource.ZONE
    const zoneRes = resolver.getSpeedLimit({
      lane: mockLaneGraph.laneMap.get('lane_zone'),
      distAlongLane: 50.0
    });
    expect(zoneRes.value).toBe(30);
    expect(zoneRes.source).toBe(RuleSource.ZONE);
    expect(zoneRes.signCode).toBe('VZ_274.1');

    // 2. Explicit sign test: Must return source === RuleSource.EXPLICIT_SIGN
    const signRes = resolver.getSpeedLimit({
      lane: mockLaneGraph.laneMap.get('lane_sign'),
      distAlongLane: 50.0
    });
    expect(signRes.value).toBe(30);
    expect(signRes.source).toBe(RuleSource.EXPLICIT_SIGN);
    expect(signRes.signCode).toBe('VZ_274');
  });

  // ── AUDIT ITEM 2 & 3: MULTIPLE SPEED SIGNS ON ONE ROAD (NEAREST PASSED) ─────
  it('Audit Items 2 & 3: Correctly resolves multiple signs (before, between, after, and opposite direction)', () => {
    const mockLaneGraph = {
      roadMap: new Map([
        ['road_multi', { id: 'road_multi', length: 150, speedLimit: 50, centerline: [[0,0], [0,150]] }]
      ]),
      laneMap: new Map([
        ['lane_multi_fwd', { id: 'lane_multi_fwd', roadId: 'road_multi', direction: 'FORWARD', totalLength: 150 }],
        ['lane_multi_bwd', { id: 'lane_multi_bwd', roadId: 'road_multi', direction: 'BACKWARD', totalLength: 150 }]
      ])
    };

    const mockRules = {
      rules: [
        {
          id: 'sign_30_fwd',
          type: TrafficRuleType.MAX_SPEED,
          source: RuleSource.EXPLICIT_SIGN,
          roadId: 'road_multi',
          direction: 'FORWARD',
          distanceAlongRoad: 40.0,
          value: 30
        },
        {
          id: 'sign_50_fwd',
          type: TrafficRuleType.MAX_SPEED,
          source: RuleSource.EXPLICIT_SIGN,
          roadId: 'road_multi',
          direction: 'FORWARD',
          distanceAlongRoad: 100.0,
          value: 50
        },
        {
          id: 'sign_40_bwd',
          type: TrafficRuleType.MAX_SPEED,
          source: RuleSource.EXPLICIT_SIGN,
          roadId: 'road_multi',
          direction: 'BACKWARD',
          distanceAlongRoad: 60.0,
          value: 40
        }
      ]
    };

    const resolver = new TrafficRuleResolver(mockLaneGraph, mockRules);
    const laneFwd = mockLaneGraph.laneMap.get('lane_multi_fwd');
    const laneBwd = mockLaneGraph.laneMap.get('lane_multi_bwd');

    // A. Forward: Before first sign (dist = 20m < 40m) -> fallback to OSM 50 km/h
    const beforeFirst = resolver.getSpeedLimit({ lane: laneFwd, distAlongLane: 20.0 });
    expect(beforeFirst.value).toBe(50);
    expect(beforeFirst.source).toBe(RuleSource.OSM);

    // B. Forward: Between signs (dist = 70m: passed 40m sign, approaching 100m sign) -> 30 km/h
    const betweenSigns = resolver.getSpeedLimit({ lane: laneFwd, distAlongLane: 70.0 });
    expect(betweenSigns.value).toBe(30);
    expect(betweenSigns.ruleId).toBe('sign_30_fwd');
    expect(betweenSigns.distanceSinceSignMeters).toBe(30.0);

    // C. Forward: After second sign (dist = 120m: passed both 40m and 100m signs) -> nearest passed is 100m sign -> 50 km/h
    const afterSecond = resolver.getSpeedLimit({ lane: laneFwd, distAlongLane: 120.0 });
    expect(afterSecond.value).toBe(50);
    expect(afterSecond.ruleId).toBe('sign_50_fwd');
    expect(afterSecond.distanceSinceSignMeters).toBe(20.0);

    // D. Backward: Car enters at road 150m (distAlongLane = 0).
    // Sign is at road 60m -> in lane coordinates: 150 - 60 = 90m along lane.
    // At distAlongLane = 30m (< 90m): has NOT passed the sign yet
    const bwdBefore = resolver.getSpeedLimit({ lane: laneBwd, distAlongLane: 30.0 });
    expect(bwdBefore.value).toBe(50); // Not passed yet

    // At distAlongLane = 110m (> 90m): has passed the 40 km/h sign
    const bwdAfter = resolver.getSpeedLimit({ lane: laneBwd, distAlongLane: 110.0 });
    expect(bwdAfter.value).toBe(40);
    expect(bwdAfter.ruleId).toBe('sign_40_bwd');
    expect(bwdAfter.distanceSinceSignMeters).toBe(20.0);
  });

  // ── AUDIT ITEM 4: BACKWARD LANE CONVERSION WHEN lane.totalLength !== road.length
  it('Audit Item 4: Handles BACKWARD lane conversion accurately when lane.totalLength !== road.length (Trimmed road)', () => {
    // Road total length = 120m, trimmed 10m at each junction -> lane.totalLength = 100m
    const trimmedLaneFwd = {
      direction: 'FORWARD',
      totalLength: 100.0,
      startTrim: 10.0,
      endTrim: 10.0
    };
    const trimmedLaneBwd = {
      direction: 'BACKWARD',
      totalLength: 100.0,
      startTrim: 10.0,
      endTrim: 10.0
    };

    const roadLength = 120.0;

    // FORWARD:
    // lane s = 0 -> road s = 10m
    expect(getDistanceAlongRoad(trimmedLaneFwd, 0.0, roadLength)).toBe(10.0);
    // lane s = 100 -> road s = 110m
    expect(getDistanceAlongRoad(trimmedLaneFwd, 100.0, roadLength)).toBe(110.0);
    // Sign placed at road s = 40m -> lane s = 30m
    expect(getDistanceAlongLane(trimmedLaneFwd, 40.0, roadLength)).toBe(30.0);

    // BACKWARD:
    // lane s = 0 -> road s = 120 - 10 = 110m
    expect(getDistanceAlongRoad(trimmedLaneBwd, 0.0, roadLength)).toBe(110.0);
    // lane s = 100 -> road s = 10m
    expect(getDistanceAlongRoad(trimmedLaneBwd, 100.0, roadLength)).toBe(10.0);
    // Sign placed at road s = 40m:
    // Vehicle travels from road 110m down to 40m -> distance traveled on lane = 110 - 40 = 70m!
    expect(getDistanceAlongLane(trimmedLaneBwd, 40.0, roadLength)).toBe(70.0);
  });

  // ── AUDIT ITEM 5: ZONE APPLICABILITY & EXIT BEHAVIOR ───────────────────────
  it('Audit Item 5: Zone applies to roads in zone.roadIds and exits immediately when leaving', () => {
    const mockLaneGraph = {
      roadMap: new Map([
        ['road_in_zone', { id: 'road_in_zone', length: 80, speedLimit: 50, centerline: [[0,0], [0,80]] }],
        ['road_out_zone', { id: 'road_out_zone', length: 80, speedLimit: 50, centerline: [[0,80], [0,160]] }]
      ]),
      laneMap: new Map([
        ['lane_in', { id: 'lane_in', roadId: 'road_in_zone', direction: 'FORWARD', totalLength: 80 }],
        ['lane_out', { id: 'lane_out', roadId: 'road_out_zone', direction: 'FORWARD', totalLength: 80 }]
      ])
    };

    const mockRules = {
      zones: {
        zone_scheunen: {
          id: 'zone_scheunen',
          type: 'ZONE_30',
          defaultSpeed: 30,
          roadIds: ['road_in_zone'] // Only road_in_zone is inside!
        }
      }
    };

    const resolver = new TrafficRuleResolver(mockLaneGraph, mockRules);

    // In zone: returns 30 (ZONE)
    const inRes = resolver.getSpeedLimit({ lane: mockLaneGraph.laneMap.get('lane_in'), distAlongLane: 40 });
    expect(inRes.value).toBe(30);
    expect(inRes.source).toBe(RuleSource.ZONE);

    // Out of zone: returns 50 (OSM)
    const outRes = resolver.getSpeedLimit({ lane: mockLaneGraph.laneMap.get('lane_out'), distAlongLane: 40 });
    expect(outRes.value).toBe(50);
    expect(outRes.source).toBe(RuleSource.OSM);
  });

  // ── AUDIT ITEM 6: DETERMINISTIC CORRIDOR TO LANE MAPPING ────────────────────
  it('Audit Item 6: Every LaneGraph corridor maps deterministically to lane and has direct reference', () => {
    const roadGraphData = {
      roads: [
        {
          id: 'road_audit',
          name: 'Teststraße',
          length: 100.0,
          width: 8.0,
          lanes: 2,
          oneway: false,
          centerline: [[0, 0], [0, 100]]
        }
      ],
      junctions: []
    };

    const laneGraph = new LaneGraphGenerator(roadGraphData);
    const corridors = laneGraph.getDrivableCorridors();

    expect(corridors.length).toBeGreaterThan(0);

    for (const corridor of corridors) {
      // 1. corridor.id must be in laneMap
      expect(laneGraph.laneMap.has(corridor.id)).toBe(true);

      // 2. corridor.laneId must match corridor.id
      expect(corridor.laneId).toBe(corridor.id);

      // 3. corridor.lane must reference the exact lane object
      expect(corridor.lane).toBe(laneGraph.laneMap.get(corridor.id));
      expect(corridor.lane.id).toBe(corridor.id);
    }
  });
});
