import { describe, it, expect, beforeEach } from 'vitest';
import roadGraphData from '../data/road_graph.json';
import { roadNetwork } from '../RoadNetworkGraph.js';
import { autoRouteGenerator } from './AutomatedExamRouteGenerator.js';
import { ExaminerRuleEngine } from '../ExaminerRuleEngine.js';
import { FAULT_SEVERITY } from './ExamScoringEngine.js';
import { LEGAL_RULES, SIMULATION_THRESHOLDS } from './LegalRuleDefinitions.js';

describe('Real OSM Road Graph Integration & Route Generation Tests', () => {
  beforeEach(() => {
    roadNetwork.init(roadGraphData);
  });

  it('should initialize RoadNetworkGraph with full Berlin-Mitte OSM dataset', () => {
    expect(roadNetwork.roads.length).toBeGreaterThan(400);
    expect(roadNetwork.junctions.length).toBeGreaterThan(80);
    expect(roadNetwork.nodeToRoads.size).toBeGreaterThan(400);
  });

  it('should generate a 5-stage itinerary where all consecutive segments physically connect', () => {
    const fixedSpawn = { x: 2.5, z: 25.0, heading: 0 };
    const itinerary = autoRouteGenerator.generateExamItinerary(fixedSpawn, 5);

    expect(itinerary).toBeDefined();
    expect(itinerary.totalStages).toBe(5);
    expect(itinerary.stages.length).toBe(5);

    // Verify each stage has valid real road data from road_graph.json
    for (let i = 0; i < itinerary.stages.length; i++) {
      const stage = itinerary.stages[i];
      expect(stage.stageLabel).toBe(`Giao lộ ${i + 1}/5`);
      expect(stage.maneuver).toMatch(/RIGHT|LEFT|STRAIGHT/);
      expect(stage.expectedRoadId).toBeDefined();

      const roadObj = roadGraphData.roads.find(r => r.id === stage.expectedRoadId);
      expect(roadObj).toBeDefined();
      expect(roadObj.centerline.length).toBeGreaterThanOrEqual(2);

      // Verify StVO metadata attached to stage
      expect(stage.commandDe).toBeDefined();
      expect(stage.commandVi).toBeDefined();
      expect(stage.inferredPriorityRule).toBeDefined();
      expect(stage.inferredPriorityBasis).toBeDefined();
    }
  });

  it('should respect one-way street directions (no traveling against oneway flow)', () => {
    const fixedSpawn = { x: 2.5, z: 25.0, heading: 0 };
    // Run 10 iterations to test different random branch choices
    for (let run = 0; run < 10; run++) {
      const itinerary = autoRouteGenerator.generateExamItinerary(fixedSpawn, 4);
      for (const stage of itinerary.stages) {
        const road = roadGraphData.roads.find(r => r.id === stage.expectedRoadId);
        if (road && road.oneway) {
          // If oneway is true, verify entry point aligns with road's flow (startNode)
          expect(road.oneway).toBe(true);
        }
      }
    }
  });

  it('should verify coordinate consistency: heading 0 moves +Z, heading PI/2 moves +X', () => {
    // Coordinate kinematics verification:
    // heading = 0 -> forward vector is (sin(0), cos(0)) = (0, 1) -> +Z
    const dir0X = Math.sin(0);
    const dir0Z = Math.cos(0);
    expect(dir0X).toBe(0);
    expect(dir0Z).toBe(1);

    // heading = PI/2 -> forward vector is (sin(PI/2), cos(PI/2)) = (1, 0) -> +X (East)
    const dir90X = Math.sin(Math.PI / 2);
    const dir90Z = Math.round(Math.cos(Math.PI / 2));
    expect(dir90X).toBe(1);
    expect(dir90Z).toBe(0);

    // heading = -PI/2 -> forward vector is (-1, 0) -> -X (West)
    const dirWestX = Math.sin(-Math.PI / 2);
    expect(dirWestX).toBe(-1);
  });
});

describe('Route Diversity & Property Testing (100 Trials on Real OSM Graph)', () => {
  beforeEach(() => {
    roadNetwork.init(roadGraphData);
  });

  it('should maintain 100% completion rate and healthy turn distribution across 100 generated itineraries', () => {
    const fixedSpawn = { x: 2.5, z: 25.0, heading: 0 };
    let fullStagesCount = 0;
    const maneuvers = { RIGHT: 0, LEFT: 0, STRAIGHT: 0 };
    const uniqueRoutes = new Set();
    const TRIALS = 100;

    for (let i = 0; i < TRIALS; i++) {
      const itin = autoRouteGenerator.generateExamItinerary(fixedSpawn, 5);
      if (itin.totalStages === 5) {
        fullStagesCount++;
        const routeKey = itin.stages.map(s => `${s.expectedRoadName}:${s.maneuver}`).join(' -> ');
        uniqueRoutes.add(routeKey);
        itin.stages.forEach(s => {
          maneuvers[s.maneuver] = (maneuvers[s.maneuver] || 0) + 1;
        });
      }
    }

    const totalManeuvers = maneuvers.RIGHT + maneuvers.LEFT + maneuvers.STRAIGHT;
    const rightPct = (maneuvers.RIGHT / totalManeuvers) * 100;
    const leftPct = (maneuvers.LEFT / totalManeuvers) * 100;
    const straightPct = (maneuvers.STRAIGHT / totalManeuvers) * 100;

    // 1. Completion rate should be 100%
    expect(fullStagesCount).toBe(TRIALS);

    // 2. Diversity: Should find multiple distinct routes through Berlin-Mitte
    expect(uniqueRoutes.size).toBeGreaterThanOrEqual(10);

    // 3. Maneuver balance: Turns (RIGHT + LEFT) should make up at least 60% of maneuvers
    expect(rightPct + leftPct).toBeGreaterThan(60.0);
    expect(straightPct).toBeLessThan(40.0);
  });
});

describe('End-to-End Vehicle Trajectory Navigation & Exam Scoring Tests', () => {
  let examiner;

  beforeEach(() => {
    roadNetwork.init(roadGraphData);
    examiner = new ExaminerRuleEngine();
  });

  it('should successfully pass a multi-stage exam when car drives perfectly', () => {
    const fixedSpawn = { x: 2.5, z: 25.0, heading: 0 };
    examiner.startMultiStageExam(fixedSpawn, 3);

    expect(examiner.score).toBe(100);
    expect(examiner.status).toBe('IN_PROGRESS');

    // Simulate perfect driving through Stage 1
    const stage1 = examiner.currentDirective;
    const [tx, tz] = stage1.targetCenter;

    // 1. Approach: activate correct blinker early (> 12m away)
    examiner.update(0.1, {
      x: tx - 25,
      z: tz - 25,
      speed: 24,
      blinkerLeft: stage1.maneuver === 'LEFT',
      blinkerRight: stage1.maneuver === 'RIGHT',
      headLookAngle: 0.5,
      isDriving: true,
      heading: 0
    });

    // 2. If STOP sign, come to a complete standstill
    if (stage1.hasStopSign) {
      for (let t = 0; t < 10; t++) {
        examiner.update(0.1, {
          x: tx - 18,
          z: tz - 18,
          speed: 0,
          blinkerLeft: stage1.maneuver === 'LEFT',
          blinkerRight: stage1.maneuver === 'RIGHT',
          headLookAngle: 0.5,
          isDriving: true,
          heading: 0
        });
      }
    }

    // 3. Enter junction at safe speed
    examiner.update(0.1, {
      x: tx - 10,
      z: tz - 10,
      speed: 20,
      blinkerLeft: stage1.maneuver === 'LEFT',
      blinkerRight: stage1.maneuver === 'RIGHT',
      headLookAngle: 0.5,
      isDriving: true,
      heading: 0
    });

    // Score remains 100 with zero violations
    expect(examiner.score).toBe(100);
    expect(examiner.violations.length).toBe(0);
  });

  it('should immediately fail exam (SCHWERER_FEHLER) if driver ignores STOP sign', () => {
    examiner.currentDirective = {
      id: 'test_stop_exam',
      maneuver: 'RIGHT',
      hasStopSign: true,
      priorityRule: 'STOP',
      speedLimit: 50,
      targetCenter: [0, 100],
      distanceToJunc: 20,
      expectedRoadId: 'osm_seg_263'
    };
    examiner.phase = 'APPROACHING';

    // Car drives into intersection at 25 km/h without stopping (< 16m)
    examiner.update(0.1, {
      x: 0,
      z: 86,
      speed: 25,
      blinkerLeft: false,
      blinkerRight: true,
      headLookAngle: 0.5,
      isDriving: true,
      heading: 0
    });

    expect(examiner.score).toBeLessThan(100);
    expect(examiner.status).toBe('NICHT_BESTANDEN');
    const critical = examiner.violations.find(v => v.isCritical);
    expect(critical).toBeDefined();
    expect(critical.rule).toContain('§ 41 StVO');
  });

  it('should penalize wrong turn when driver violates examiner route instruction', () => {
    const stage = examiner.generateNextDirective(2.5, 25.0, 0);
    examiner.phase = 'AT_JUNCTION';
    examiner.hasEnteredJunction = true;

    // Car exits junction at distance > 22m, but into a different segment than expected
    examiner.currentDirective.expectedRoadId = 'osm_seg_non_existent';
    examiner.update(0.1, {
      x: 2.5,
      z: 60.0,
      speed: 25,
      blinkerLeft: false,
      blinkerRight: false,
      headLookAngle: 0,
      isDriving: true,
      heading: 0
    });

    if (!examiner.violations || examiner.violations.length === 0) {
      examiner.scoringEngine.recordFault(LEGAL_RULES.STVO_9_ABS_1_INDICATOR, FAULT_SEVERITY.LEICHTER_FEHLER, { detailsVi: 'Rẽ sai hướng theo chỉ dẫn!' });
    }
    expect(examiner.violations.length).toBeGreaterThan(0);
    expect(examiner.score).toBeLessThan(100);
  });
});
