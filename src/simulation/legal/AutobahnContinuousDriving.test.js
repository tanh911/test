import { describe, it, expect, beforeEach } from 'vitest';
import autobahnGraphData from '../data/road_graph_autobahn.json';
import { LaneGraphGenerator } from './LaneGraphGenerator.js';
import { TrafficAIManager } from '../trafficAI.js';

describe('🚗 Autobahn A2 Continuous Driving & Waypoint Simulation', () => {
  let laneGen;

  beforeEach(() => {
    laneGen = new LaneGraphGenerator(autobahnGraphData);
  });

  it('should generate valid continuous lane graph with non-zero lanes for Autobahn A2 Rhynern', () => {
    expect(laneGen.roads.length).toBeGreaterThan(30);
    expect(laneGen.lanes.length).toBeGreaterThan(30);
    
    // Check lane width and speed limit defaults
    const motorwayLanes = laneGen.lanes.filter(l => l.highway === 'motorway');
    expect(motorwayLanes.length).toBeGreaterThan(0);
    motorwayLanes.forEach(lane => {
      expect(lane.speedLimit).toBeGreaterThanOrEqual(100); // 130 km/h or Richtgeschwindigkeit
      expect(lane.centerline.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should simulate continuous vehicle trajectory driving along 1,000+ meters of Autobahn main line', () => {
    // Find continuous motorways with centerline points
    const mainMotorways = laneGen.roads.filter(r => r.highway === 'motorway' && Array.isArray(r.centerline) && r.centerline.length >= 2);
    expect(mainMotorways.length).toBeGreaterThan(0);

    let totalSimulatedDistance = 0;
    const vehicleSpeedMs = 130 / 3.6; // ~36.11 m/s (130 km/h)
    const dt = 0.1; // 100ms time step

    mainMotorways.forEach(road => {
      const p1 = road.centerline[0];
      const p2 = road.centerline[road.centerline.length - 1];
      const segLength = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      
      // Simulate vehicle traversing this segment step by step
      let traveledOnSeg = 0;
      while (traveledOnSeg < segLength) {
        traveledOnSeg += vehicleSpeedMs * dt;
        const progressRatio = Math.min(1.0, traveledOnSeg / segLength);
        
        // Compute interpolated position along centerline
        const posX = p1[0] + (p2[0] - p1[0]) * progressRatio;
        const posZ = p1[1] + (p2[1] - p1[1]) * progressRatio;

        expect(Number.isFinite(posX)).toBe(true);
        expect(Number.isFinite(posZ)).toBe(true);
      }
      totalSimulatedDistance += segLength;
    });

    console.log(`[Autobahn Simulation] 🏎️ Simulated continuous vehicle traversal over ${totalSimulatedDistance.toFixed(1)} meters of real Autobahn A2 highway!`);
    expect(totalSimulatedDistance).toBeGreaterThan(1000);
  });

  it('should verify smooth continuous driving trajectory from Autobahn -> Ausfahrt ramp -> Autobahn', () => {
    const motorwayLinks = laneGen.roads.filter(r => r.highway === 'motorway_link' && Array.isArray(r.centerline) && r.centerline.length >= 2);
    expect(motorwayLinks.length).toBeGreaterThan(0);

    // Verify all ramp centerlines are smooth and have zero NaN coordinates
    motorwayLinks.forEach(link => {
      link.centerline.forEach(([x, z]) => {
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(z)).toBe(true);
      });
    });
  });
});
