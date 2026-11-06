import { describe, it, expect, beforeEach } from 'vitest';
import { ExamScoringEngine, FAULT_SEVERITY } from './ExamScoringEngine.js';
import { LEGAL_RULES, SIMULATION_THRESHOLDS } from './LegalRuleDefinitions.js';
import { AutomatedExamRouteGenerator } from './AutomatedExamRouteGenerator.js';
import { roadNetwork } from '../RoadNetworkGraph.js';

describe('Clean Architecture: Legal Rules & Exam Scoring Tests', () => {
  let scoring;

  beforeEach(() => {
    scoring = new ExamScoringEngine(100, 70);
  });

  it('should initialize with 100 points and IN_PROGRESS status', () => {
    expect(scoring.score).toBe(100);
    expect(scoring.status).toBe('IN_PROGRESS');
    expect(scoring.criticalFailureCount).toBe(0);
    expect(scoring.faults.length).toBe(0);
  });

  it('should record a minor fault without causing immediate failure', () => {
    scoring.recordFault(
      LEGAL_RULES.STVO_9_ABS_1_INDICATOR,
      FAULT_SEVERITY.LEICHTER_FEHLER,
      { penalty: 5, detailsVi: 'Bật xi-nhan muộn' }
    );

    expect(scoring.score).toBe(95);
    expect(scoring.status).toBe('IN_PROGRESS');
    expect(scoring.criticalFailureCount).toBe(0);
    expect(scoring.faults.length).toBe(1);
    expect(scoring.faults[0].paragraph).toContain('§ 9 Abs. 1 StVO');
  });

  it('should record a critical failure (Schwerer Fehler) and cause immediate failure', () => {
    // Failing to stop at a STOP sign is a Schwerer Fehler
    scoring.recordFault(
      LEGAL_RULES.STVO_41_STOP,
      FAULT_SEVERITY.SCHWERER_FEHLER,
      { penalty: 25, detailsVi: 'Không dừng tại biển STOP' }
    );

    expect(scoring.score).toBe(75);
    expect(scoring.criticalFailureCount).toBe(1);
    expect(scoring.status).toBe('NICHT_BESTANDEN');

    const verdict = scoring.getExamVerdict();
    expect(verdict.isPassed).toBe(false);
    expect(verdict.status).toBe('NICHT_BESTANDEN');
    expect(verdict.summaryVi).toMatch(/lỗi nghiêm trọng/i);
  });

  it('should pass the exam if score >= 70 and 0 critical failures', () => {
    // Two moderate faults (-10 and -10 -> 80 points)
    scoring.recordFault(
      LEGAL_RULES.STVO_3_TURNING_SPEED,
      FAULT_SEVERITY.MITTLERER_FEHLER,
      { penalty: 10, detailsVi: 'Vào cua hơi nhanh' }
    );
    scoring.recordFault(
      LEGAL_RULES.STVO_9_ABS_3_SCHULTERBLICK,
      FAULT_SEVERITY.MITTLERER_FEHLER,
      { penalty: 10, detailsVi: 'Thiếu quan sát vai' }
    );

    expect(scoring.score).toBe(80);
    const verdict = scoring.getExamVerdict();
    expect(verdict.isPassed).toBe(true);
    expect(verdict.status).toBe('BESTANDEN');
  });

  it('should fail the exam if accumulated points drop below 70 even with no critical failure', () => {
    scoring.score = 65;
    const verdict = scoring.getExamVerdict();
    expect(verdict.isPassed).toBe(false);
    expect(verdict.status).toBe('NICHT_BESTANDEN');
  });

  it('should expose calibration thresholds as simulator numerical proxies', () => {
    expect(SIMULATION_THRESHOLDS.INDICATOR_DISTANCE_M).toBe(12.0);
    expect(SIMULATION_THRESHOLDS.STOP_CONFIRMATION_TIME_S).toBe(0.7);
    expect(SIMULATION_THRESHOLDS.SAFE_TURNING_SPEED_KMH).toBe(30.0);
    expect(SIMULATION_THRESHOLDS.STOP_SPEED_MAX_KMH).toBe(0.8);
  });
});

describe('Automated Route Generator Tests', () => {
  const mockRoadGraph = {
    metadata: { name: 'Test Route Graph' },
    roads: [
      {
        id: 'road_1',
        name: 'Friedrichstraße',
        startNode: 1,
        endNode: 2,
        centerline: [[0, 0], [0, 50]],
        length: 50,
        width: 14,
        lanes: 4,
        speedLimit: 50,
        oneway: false
      },
      {
        id: 'road_2',
        name: 'Unter den Linden',
        startNode: 2,
        endNode: 3,
        centerline: [[0, 50], [60, 50]],
        length: 60,
        width: 16,
        lanes: 4,
        speedLimit: 50,
        oneway: false
      },
      {
        id: 'road_3',
        name: 'Behrenstraße',
        startNode: 2,
        endNode: 4,
        centerline: [[0, 50], [-60, 50]],
        length: 60,
        width: 10,
        lanes: 2,
        speedLimit: 30,
        oneway: false
      }
    ],
    junctions: [
      {
        id: 'junc_2',
        center: [0, 50],
        polygon: [[-8, 42], [8, 42], [8, 58], [-8, 58]],
        hasTrafficLight: true,
        priorityRule: 'AMPEL',
        inferredPriorityRule: 'AMPEL',
        inferredPriorityBasis: 'EXPLICIT_SIGNAL',
        connectedRoadsCount: 3
      }
    ]
  };

  beforeEach(() => {
    roadNetwork.init(mockRoadGraph);
  });

  it('should generate a live directive dynamically with StVO metadata', () => {
    const generator = new AutomatedExamRouteGenerator();
    const directive = generator.generateLiveDirective(0, 10, 0); // heading 0 towards +Z

    expect(directive).toBeDefined();
    expect(directive.maneuver).toMatch(/RIGHT|LEFT|STRAIGHT/);
    expect(directive.commandDe).toBeDefined();
    expect(directive.inferredPriorityRule).toBe('AMPEL');
    expect(directive.inferredPriorityBasis).toBe('EXPLICIT_SIGNAL');
  });

  it('should generate a multi-stage exam itinerary from the graph', () => {
    const generator = new AutomatedExamRouteGenerator();
    const itinerary = generator.generateExamItinerary({ x: 0, z: 10, heading: 0 }, 1);

    expect(itinerary).toBeDefined();
    expect(itinerary.stages.length).toBeGreaterThan(0);
    expect(itinerary.stages[0].stageLabel).toBeDefined();
  });
});
