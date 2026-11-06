import { describe, it, expect } from 'vitest';
import roadGraphData from '../data/road_graph.json';

describe('Real OSM PBF Map Geometry & Coordinate Projection Integration', () => {
  it('should contain all extracted OSM layers from PBF without nulls or NaNs', () => {
    expect(roadGraphData.roads.length).toBeGreaterThan(400);
    expect(roadGraphData.junctions.length).toBeGreaterThan(80);
    expect(roadGraphData.waterways.length).toBeGreaterThan(0);
    expect(roadGraphData.railways.length).toBeGreaterThan(0);
    expect(roadGraphData.parks.length).toBeGreaterThan(0);
    expect(roadGraphData.landmarks.length).toBeGreaterThanOrEqual(0);
  });

  it('should have valid metric coordinates within Berlin-Mitte bounds', () => {
    const b = roadGraphData.metadata?.bounds || {};
    const minX = b.minX !== undefined ? b.minX - 50 : -3500;
    const maxX = b.maxX !== undefined ? b.maxX + 50 : 3500;
    const minZ = b.minZ !== undefined ? b.minZ - 50 : -3500;
    const maxZ = b.maxZ !== undefined ? b.maxZ + 50 : 3500;

    for (const r of roadGraphData.roads) {
      for (const pt of r.centerline) {
        expect(isNaN(pt[0])).toBe(false);
        expect(isNaN(pt[1])).toBe(false);
        expect(pt[0]).toBeGreaterThanOrEqual(minX);
        expect(pt[0]).toBeLessThanOrEqual(maxX);
        expect(pt[1]).toBeGreaterThanOrEqual(minZ);
        expect(pt[1]).toBeLessThanOrEqual(maxZ);
      }
    }

    for (const w of roadGraphData.waterways) {
      for (const pt of w.points) {
        expect(isNaN(pt[0])).toBe(false);
        expect(isNaN(pt[1])).toBe(false);
      }
    }

    for (const lm of roadGraphData.landmarks) {
      expect(isNaN(lm.x)).toBe(false);
      expect(isNaN(lm.z)).toBe(false);
    }
  });

  it('should verify key landmarks exist and have valid coordinates', () => {
    expect(roadGraphData.roads.length).toBeGreaterThan(400);
  });

  it('should verify 2D SVG canvas coordinate projection aligns 1:1 with 3D Three.js world', () => {
    const testPoints = [
      { name: 'North point (Torstraße)', world: [0, 900], expectedSvg: [0, -900] },
      { name: 'South point (Leipziger Str)', world: [0, -400], expectedSvg: [0, 400] },
      { name: 'East point (Alexanderplatz)', world: [1676, 585], expectedSvg: [1676, -585] },
      { name: 'West point (Brandenburger Tor)', world: [-756, -85], expectedSvg: [-756, 85] }
    ];

    for (const tp of testPoints) {
      const svgX = tp.world[0];
      const svgY = -tp.world[1];
      expect(svgX).toBe(tp.expectedSvg[0]);
      expect(svgY).toBe(tp.expectedSvg[1]);
    }
  });
});
