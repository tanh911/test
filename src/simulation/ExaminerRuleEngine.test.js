import { describe, it, expect, beforeEach } from 'vitest';
import { RoadNetworkGraph } from './RoadNetworkGraph.js';
import { ExaminerRuleEngine } from './ExaminerRuleEngine.js';

describe('OSM Road Graph & Examiner Rule Engine Tests', () => {
  let graph;
  let examiner;

  const mockRoadGraph = {
    metadata: { name: 'Test Graph' },
    roads: [
      {
        id: 'road_main_1',
        name: 'Friedrichstraße',
        startNode: 101,
        endNode: 102,
        centerline: [[0, 0], [0, 100]],
        length: 100,
        width: 14,
        lanes: 4,
        speedLimit: 50,
        oneway: false,
        hasPedestrianCrossing: true,
        hasTrafficSignal: true
      },
      {
        id: 'road_branch_right',
        name: 'Unter den Linden',
        startNode: 102,
        endNode: 103,
        centerline: [[0, 100], [100, 100]], // Turns right (positive X)
        length: 100,
        width: 16,
        lanes: 4,
        speedLimit: 50,
        oneway: false,
        hasPedestrianCrossing: false,
        hasTrafficSignal: false
      },
      {
        id: 'road_branch_left',
        name: 'Behrenstraße',
        startNode: 102,
        endNode: 104,
        centerline: [[0, 100], [-100, 100]], // Turns left (negative X)
        length: 100,
        width: 9,
        lanes: 2,
        speedLimit: 30,
        oneway: false,
        hasPedestrianCrossing: true,
        hasTrafficSignal: false
      },
      {
        id: 'road_branch_straight',
        name: 'Friedrichstraße Nord',
        startNode: 102,
        endNode: 105,
        centerline: [[0, 100], [0, 200]], // Goes straight (positive Z)
        length: 100,
        width: 14,
        lanes: 4,
        speedLimit: 50,
        oneway: false,
        hasPedestrianCrossing: false,
        hasTrafficSignal: false
      }
    ],
    junctions: [
      {
        id: 'junc_102',
        center: [0, 100],
        polygon: [[-8, 92], [8, 92], [8, 108], [-8, 108]],
        hasTrafficLight: true,
        connectedRoadsCount: 4
      }
    ]
  };

  beforeEach(() => {
    graph = new RoadNetworkGraph();
    graph.init(mockRoadGraph);
    examiner = new ExaminerRuleEngine();
  });

  it('should index segments and find nearest road and travel direction', () => {
    // Car at [0, 20], heading towards +Z (heading 0 is +Z)
    const match = graph.findNearestSegment(0, 20, 0);
    expect(match).toBeDefined();
    expect(match.road.id).toBe('road_main_1');
    expect(match.travelDir).toBe(1); // Moving towards endNode (102)
  });

  it('should detect upcoming intersection and calculate left/right/straight branches', () => {
    const upcoming = graph.findUpcomingIntersection(0, 20, 0, 150);
    expect(upcoming).toBeDefined();
    expect(upcoming.junction.id).toBe('junc_102');
    expect(upcoming.distance).toBe(80); // From z=20 to z=100
    expect(upcoming.branches.length).toBe(3);

    const branchRight = upcoming.branches.find(b => b.maneuver === 'RIGHT');
    const branchLeft = upcoming.branches.find(b => b.maneuver === 'LEFT');
    const branchStraight = upcoming.branches.find(b => b.maneuver === 'STRAIGHT');

    expect(branchRight).toBeDefined();
    expect(branchRight.road.id).toBe('road_branch_right');
    expect(branchLeft).toBeDefined();
    expect(branchLeft.road.id).toBe('road_branch_left');
    expect(branchStraight).toBeDefined();
    expect(branchStraight.road.id).toBe('road_branch_straight');
  });

  it('should generate an examiner directive with German and Vietnamese instructions', () => {
    examiner.currentDirective = {
      id: 'test_dir',
      maneuver: 'RIGHT',
      commandDe: 'Biegen Sie an der nächsten Kreuzung rechts ab.',
      commandVi: 'Ở ngã tư kế tiếp, hãy rẽ phải.',
      speedLimit: 50,
      targetCenter: [0, 100],
      distanceToJunc: 50,
      incomingRoadId: 'road_main_1',
      expectedRoadId: 'road_branch_right'
    };
    examiner.phase = 'APPROACHING';

    expect(examiner.score).toBe(100);
    expect(examiner.currentDirective.maneuver).toBe('RIGHT');
  });

  it('should penalize missing indicator (blinker) when turning right (§ 9 Abs. 1 StVO)', () => {
    examiner.currentDirective = {
      id: 'test_dir',
      maneuver: 'RIGHT',
      commandDe: 'Biegen Sie an der nächsten Kreuzung rechts ab.',
      commandVi: 'Ở ngã tư kế tiếp, hãy rẽ phải.',
      speedLimit: 50,
      targetCenter: [0, 100],
      distanceToJunc: 20,
      incomingRoadId: 'road_main_1',
      expectedRoadId: 'road_branch_right'
    };
    examiner.phase = 'APPROACHING';

    // Car approaches junction at [0, 86] (dist = 14m < 16m), NO blinker right
    examiner.update(0.1, {
      x: 0,
      z: 86,
      speed: 25,
      blinkerLeft: false,
      blinkerRight: false, // VIOLATION!
      headLookAngle: 0,
      isDriving: true
    });

    expect(examiner.score).toBeLessThan(100);
    expect(examiner.violations.length).toBeGreaterThan(0);
    expect(examiner.violations[0].rule).toContain('§ 9 Abs. 1 StVO');
  });

  it('should approve correct right turn with indicator and safe speed', () => {
    examiner.currentDirective = {
      id: 'test_dir',
      maneuver: 'RIGHT',
      commandDe: 'Biegen Sie an der nächsten Kreuzung rechts ab.',
      commandVi: 'Ở ngã tư kế tiếp, hãy rẽ phải.',
      speedLimit: 50,
      targetCenter: [0, 100],
      distanceToJunc: 40,
      incomingRoadId: 'road_main_1',
      expectedRoadId: 'road_branch_right'
    };
    examiner.phase = 'APPROACHING';

    // 1. Car approaches at 40m, blinker RIGHT is activated early
    examiner.update(0.1, {
      x: 0,
      z: 60,
      speed: 35,
      blinkerLeft: false,
      blinkerRight: true,
      headLookAngle: 0.5, // Schulterblick done
      isDriving: true
    });

    // 2. Car enters junction (dist = 10m) with safe speed (< 28 km/h)
    examiner.update(0.1, {
      x: 0,
      z: 90,
      speed: 22,
      blinkerLeft: false,
      blinkerRight: true,
      headLookAngle: 0.5,
      isDriving: true
    });

    expect(examiner.score).toBe(100); // No penalties!
    expect(examiner.violations.length).toBe(0);
  });

  it('should penalize excessive speed (> speed limit + 7 km/h § 3 StVO)', () => {
    examiner.currentDirective = {
      id: 'test_dir',
      maneuver: 'STRAIGHT',
      commandDe: 'Fahren Sie geradeaus weiter.',
      commandVi: 'Đi thẳng tiếp tục.',
      speedLimit: 50,
      targetCenter: [0, 100],
      distanceToJunc: 60,
      incomingRoadId: 'road_main_1',
      expectedRoadId: 'road_branch_straight'
    };
    examiner.phase = 'APPROACHING';

    // Car drives 64 km/h in 50 km/h zone
    examiner.update(0.1, {
      x: 0,
      z: 40,
      speed: 64,
      blinkerLeft: false,
      blinkerRight: false,
      headLookAngle: 0,
      isDriving: true
    });

    expect(examiner.score).toBeLessThan(100);
    expect(examiner.violations.some(v => v.rule.includes('§ 3 StVO'))).toBe(true);
  });

  it('should penalize failing to stop at a STOP sign (§ 41 StVO Zeichen 206)', () => {
    examiner.currentDirective = {
      id: 'test_stop_dir',
      maneuver: 'RIGHT',
      hasStopSign: true,
      priorityRule: 'STOP',
      commandDe: 'Halten Sie am Stoppschild an und biegen Sie rechts ab.',
      commandVi: 'Dừng hẳn trước biển STOP và rẽ phải.',
      speedLimit: 50,
      targetCenter: [0, 100],
      distanceToJunc: 20,
      incomingRoadId: 'road_main_1',
      expectedRoadId: 'road_branch_right'
    };
    examiner.phase = 'APPROACHING';

    // Car enters junction at 20 km/h without stopping (dist = 14m < 16m)
    examiner.update(0.1, {
      x: 0,
      z: 86,
      speed: 20,
      blinkerLeft: false,
      blinkerRight: true,
      headLookAngle: 0.5,
      isDriving: true
    });

    expect(examiner.score).toBeLessThan(100);
    expect(examiner.violations.some(v => v.rule.includes('§ 41 StVO'))).toBe(true);
  });

  it('should pass STOP sign check when stopping completely (< 0.8 km/h for > 0.8s)', () => {
    examiner.currentDirective = {
      id: 'test_stop_pass',
      maneuver: 'RIGHT',
      hasStopSign: true,
      priorityRule: 'STOP',
      commandDe: 'Halten Sie am Stoppschild an und biegen Sie rechts ab.',
      commandVi: 'Dừng hẳn trước biển STOP và rẽ phải.',
      speedLimit: 50,
      targetCenter: [0, 100],
      distanceToJunc: 10,
      incomingRoadId: 'road_main_1',
      expectedRoadId: 'road_branch_right'
    };
    examiner.phase = 'APPROACHING';

    // Car stops before junction at dist = 20m (z: 80) for 1 second (10 updates of 0.1s dt with speed = 0)
    for (let i = 0; i < 10; i++) {
      examiner.update(0.1, {
        x: 0,
        z: 80,
        speed: 0,
        blinkerLeft: false,
        blinkerRight: true,
        headLookAngle: 0.5,
        isDriving: true
      });
    }

    expect(examiner.hasStoppedAtStopLine).toBe(true);

    // Car proceeds into junction (dist = 14m <= 16m)
    examiner.update(0.1, {
      x: 0,
      z: 86,
      speed: 15,
      blinkerLeft: false,
      blinkerRight: true,
      headLookAngle: 0.5,
      isDriving: true
    });

    // Should NOT have § 41 StVO violation
    expect(examiner.violations.some(v => v.rule.includes('§ 41 StVO'))).toBe(false);
  });
});
