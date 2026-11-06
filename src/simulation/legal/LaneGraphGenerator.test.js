import { describe, it, expect, beforeAll } from 'vitest';
import { LaneGraphGenerator } from './LaneGraphGenerator.js';
import roadGraphData from '../data/road_graph.json';

describe('🛣️ LaneGraphGenerator (German StVO Lane-Aware Engine)', () => {
  let generator;

  beforeAll(() => {
    generator = new LaneGraphGenerator(roadGraphData);
  });

  it('should initialize and process all roads from road_graph.json', () => {
    expect(generator.lanes.length).toBeGreaterThan(500);
    expect(generator.dividers.length).toBeGreaterThan(400);
    expect(generator.curbs.length).toBeGreaterThan(400);
    expect(generator.junctionPolygons.length).toBe(roadGraphData.junctions.length);
  });

  it('should generate correct lateral offsets according to Rechtsfahrgebot (§ 2 StVO)', () => {
    // Find two-way roads
    const twoWayRoadIds = new Set(roadGraphData.roads.filter(r => !r.oneway && r.lanes >= 2).map(r => r.id));
    const twoWayLanes = generator.lanes.filter(l => twoWayRoadIds.has(l.roadId));
    const fwdLanes = twoWayLanes.filter(l => l.direction === 'FORWARD');
    const bwdLanes = twoWayLanes.filter(l => l.direction === 'BACKWARD');

    expect(fwdLanes.length).toBeGreaterThan(0);
    expect(bwdLanes.length).toBeGreaterThan(0);

    // Forward lanes on two-way roads must be on the right side of the forward direction (lateralOffset < divOffset in road coords)
    fwdLanes.forEach(lane => {
      expect(lane.lateralOffset).toBeLessThan(lane.divOffset);
    });

    // Backward lanes on two-way roads must be on the right side of the backward direction (lateralOffset > divOffset in road coords)
    bwdLanes.forEach(lane => {
      expect(lane.lateralOffset).toBeGreaterThan(lane.divOffset);
    });
  });

  it('should correctly configure oneway streets with all lanes in forward direction', () => {
    const onewayRoad = roadGraphData.roads.find(r => r.oneway === true && r.lanes >= 2);
    expect(onewayRoad).toBeDefined();

    const roadLanes = generator.lanes.filter(l => l.roadId === onewayRoad.id);
    expect(roadLanes.length).toBe(onewayRoad.lanes);

    roadLanes.forEach(lane => {
      expect(lane.direction).toBe('FORWARD');
    });
  });

  it('should accurately align with fixed player spawn on Friedrichstraße Southbound lane', () => {
    // Spawn is at X = -2.88, Z = 32.0, heading South (Right lane, StVO Rechtsfahrgebot)
    // Query nearest lane at spawn position
    const nearest = generator.findNearestLane(-2.88, 32.0);
    expect(nearest).toBeDefined();
    expect(nearest.lane.roadName).toContain('Friedrich');
    expect(nearest.dist).toBeLessThan(2.0); // Within 2m of lane centerline!
  });

  it('should generate Stop Lines (Haltelinie) on approach to traffic light junctions', () => {
    expect(generator.stopLines.length).toBeGreaterThan(0);

    generator.stopLines.forEach(sl => {
      expect(sl.p1).toBeDefined();
      expect(sl.p2).toBeDefined();
      expect(sl.width).toBeCloseTo(0.45, 1);
      const len = Math.hypot(sl.p2[0] - sl.p1[0], sl.p2[1] - sl.p1[1]);
      expect(len).toBeGreaterThan(0.8);
    });
  });

  it('should produce valid Traffic AI drivable corridors with zero lane offset', () => {
    const generator = new LaneGraphGenerator(roadGraphData);
    const corridors = generator.getDrivableCorridors();

    expect(corridors.length).toBe(generator.lanes.length);
    corridors.slice(0, 20).forEach(c => {
      expect(c.id).toBeDefined();
      expect(c.waypoints.length).toBeGreaterThanOrEqual(2);
      expect(c.totalLength).toBeGreaterThan(0);
      expect(c.laneOffset).toBe(0); // Centerline is already offset
      expect(c.speedLimitKmH).toBeGreaterThanOrEqual(30);
    });
  });

  it('should generate 3D curbs with inner, top-outer, and sidewalk coordinates', () => {
    const curb = generator.curbs[0];

    expect(curb).toBeDefined();
    expect(curb.innerPoints.length).toBeGreaterThanOrEqual(2);
    expect(curb.topOuterPoints.length).toBe(curb.innerPoints.length);
    expect(curb.swOuterPoints.length).toBe(curb.innerPoints.length);

    // Verify curb top cap width is ~0.18m
    const pIn = curb.innerPoints[0];
    const pOut = curb.topOuterPoints[0];
    const curbWidth = Math.hypot(pOut[0] - pIn[0], pOut[1] - pIn[1]);
    expect(curbWidth).toBeCloseTo(0.18, 1);
  });
});
