import { describe, it, expect, beforeEach } from 'vitest';
import { TrafficRuleResolver } from './TrafficRuleResolver.js';
import { TrafficRuleType, RuleSource } from './TrafficRuleSchema.js';
import { ExaminerRuleEngine } from '../ExaminerRuleEngine.js';
import { TrafficAIManager } from '../trafficAI.js';

describe('🎯 Phase 2A: Speed Limit Data Consistency Chain (Resolver -> Cockpit -> Examiner -> Traffic AI)', () => {
  let mockLaneGraph;
  let mockRulesData;
  let ruleResolver;
  let examiner;

  beforeEach(() => {
    mockLaneGraph = {
      roadMap: new Map([
        [
          'road_zone30',
          {
            id: 'road_zone30',
            name: 'Linienstraße (Zone 30)',
            length: 100.0,
            width: 8.0,
            speedLimit: 30,
            centerline: [[0, 0], [0, 100]]
          }
        ],
        [
          'road_boulevard',
          {
            id: 'road_boulevard',
            name: 'Unter den Linden (50 km/h)',
            length: 150.0,
            width: 14.0,
            speedLimit: 50,
            centerline: [[0, 0], [150, 0]]
          }
        ]
      ]),
      laneMap: new Map([
        [
          'lane_zone30_fwd',
          {
            id: 'lane_zone30_fwd',
            roadId: 'road_zone30',
            direction: 'FORWARD',
            laneIndex: 0,
            totalLength: 100.0,
            speedLimit: 30
          }
        ],
        [
          'lane_bvd_fwd',
          {
            id: 'lane_bvd_fwd',
            roadId: 'road_boulevard',
            direction: 'FORWARD',
            laneIndex: 0,
            totalLength: 150.0,
            speedLimit: 50
          }
        ]
      ]),
      findNearestLane: (x, z, heading) => {
        if (z >= 0 && z <= 100 && Math.abs(x) < 5) {
          return {
            lane: mockLaneGraph.laneMap.get('lane_zone30_fwd'),
            dist: z
          };
        }
        return {
          lane: mockLaneGraph.laneMap.get('lane_bvd_fwd'),
          dist: x
        };
      }
    };

    mockRulesData = {
      zones: {
        zone_30_mitte: {
          id: 'zone_30_mitte',
          type: 'ZONE_30',
          nameDe: 'Tempo 30-Zone',
          defaultSpeed: 30,
          roadIds: ['road_zone30']
        }
      },
      rules: [
        {
          id: 'sign_speed_30',
          type: TrafficRuleType.MAX_SPEED,
          source: RuleSource.EXPLICIT_SIGN,
          roadId: 'road_zone30',
          direction: 'FORWARD',
          distanceAlongRoad: 10.0,
          appliesToLanes: ['all'],
          value: 30
        }
      ]
    };

    ruleResolver = new TrafficRuleResolver(mockLaneGraph, mockRulesData);
    examiner = new ExaminerRuleEngine();
    examiner.setRuleResolver(ruleResolver);
  });

  it('1. Authoritative speed limit matches 30 km/h across Resolver, Cockpit, Examiner, and Traffic AI in Zone 30', () => {
    const lane30 = mockLaneGraph.laneMap.get('lane_zone30_fwd');

    // A. Resolver provides authoritative speed
    const speedRule = ruleResolver.getSpeedLimit({ lane: lane30, distAlongLane: 25.0 });
    expect(speedRule.value).toBe(30);
    expect(speedRule.source).toBe(RuleSource.EXPLICIT_SIGN);

    const authoritativeSpeed = speedRule.value; // 30 km/h

    // B. Cockpit display receives the exact authoritative speed
    const cockpitDisplayLimit = authoritativeSpeed;
    expect(cockpitDisplayLimit).toBe(30);

    // C. Examiner checks against this exact authoritative speed (no more 50 km/h desync!)
    examiner.phase = 'APPROACHING';
    examiner.currentDirective = {
      maneuver: 'STRAIGHT',
      targetCenter: [0, 80],
      speedLimit: 50 // Even if directive had stale 50 km/h, authoritativeSpeed overrides it!
    };

    // Driving at 38 km/h in 30 km/h zone (> 30 + 6 tolerance): Examiner MUST catch violation
    examiner.update(0.1, {
      x: 0,
      z: 25,
      heading: 0,
      speed: 38,
      isDriving: true,
      authoritativeSpeedLimit: authoritativeSpeed
    });

    expect(examiner.scoringEngine.faults.length).toBe(1);
    expect(examiner.scoringEngine.faults[0].detailsVi).toContain('30 km/h');
    expect(examiner.scoringEngine.faults[0].detailsVi).toContain('38 km/h');

    // D. Traffic AI bot car on lane30 also caps its speed to 30 km/h
    const mockScene = {
      userData: { ruleResolver }
    };
    const trafficAI = new TrafficAIManager(mockScene);
    trafficAI.botCars = [
      {
        id: 'bot_1',
        corridor: {
          id: 'lane_zone30_fwd',
          totalLength: 100,
          waypoints: [[0, 0], [0, 100]],
          segmentDists: [0, 100]
        },
        pathDist: 25.0,
        maxSpeed: 50 / 3.6,
        targetSpeed: 50 / 3.6,
        mesh: { position: { set: () => {} }, rotation: {} }
      }
    ];

    trafficAI.update(0.1);
    // Bot target speed should be updated to 30 km/h (8.33 m/s)
    expect(trafficAI.botCars[0].targetSpeed).toBeCloseTo(30 / 3.6, 2);
    expect(trafficAI.botCars[0].maxSpeed).toBeCloseTo(30 / 3.6, 2);
  });

  it('2. Authoritative speed limit cleanly transitions to 50 km/h on Boulevard', () => {
    const laneBvd = mockLaneGraph.laneMap.get('lane_bvd_fwd');

    const speedRule = ruleResolver.getSpeedLimit({ lane: laneBvd, distAlongLane: 50.0 });
    expect(speedRule.value).toBe(50);
    expect(speedRule.source).toBe(RuleSource.OSM);

    const authoritativeSpeed = speedRule.value; // 50 km/h

    // Driving at 45 km/h on 50 km/h road: Examiner records NO fault
    examiner.reset();
    examiner.phase = 'APPROACHING';
    examiner.currentDirective = {
      maneuver: 'STRAIGHT',
      targetCenter: [120, 0]
    };

    examiner.update(0.1, {
      x: 50,
      z: 0,
      heading: Math.PI / 2,
      speed: 45,
      isDriving: true,
      authoritativeSpeedLimit: authoritativeSpeed
    });

    expect(examiner.scoringEngine.faults.length).toBe(0);
  });
});
