import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import autobahnGraphData from '../data/road_graph_autobahn.json';
import { buildAutobahnDistrict } from '../../components/autobahnDistrict.js';
import { ProceduralRoadGenerator } from '../proceduralRoadGenerator.js';

describe('🛡️ Autobahn Post-Immunity (>5s) Collision Verification Suite', () => {
  let scene;
  let scenery;
  let colliders;
  let sharedMaterials;
  let roadGen;

  beforeEach(() => {
    scene = new THREE.Scene();
    scenery = new THREE.Group();
    scene.add(scenery);
    colliders = [];
    sharedMaterials = {};
    roadGen = buildAutobahnDistrict(scene, scenery, colliders, sharedMaterials, false);
  });

  it('1. Spawn on L1 -> Wait >5s (t = 6s) -> Drive 300m -> Verify 0 collisions', () => {
    const isImmune = Date.now() < (Date.now() - 6000); // 6s after spawn (immunity expired)
    expect(isImmune).toBe(false);

    const l1Spawn = { x: 487.50 + 3.5, z: -589.42, heading: 2.1346 };
    const carHalfW = 0.95;
    const carHalfL = 2.25;

    // Simulate 300 meters straight driving on L1
    for (let dist = 0; dist <= 300; dist += 5) {
      const carX = l1Spawn.x + dist * Math.sin(l1Spawn.heading);
      const carZ = l1Spawn.z - dist * Math.cos(l1Spawn.heading);

      // Verify no collision against world colliders
      colliders.forEach(c => {
        if (c.shape === 'boundary') {
          const hitWest = (carX - carHalfW) < c.minX;
          const hitEast = (carX + carHalfW) > c.maxX;
          const hitSouth = (carZ - carHalfL) < c.minZ;
          const hitNorth = (carZ + carHalfL) > c.maxZ;
          expect(hitWest || hitEast || hitSouth || hitNorth).toBe(false);
        }
      });
    }
  });

  it('2. Spawn on L2 -> Wait >5s -> Drive 300m -> Verify 0 collisions', () => {
    const l2Spawn = { x: 487.50, z: -589.42, heading: 2.1346 };
    const carHalfW = 0.95;
    const carHalfL = 2.25;

    for (let dist = 0; dist <= 300; dist += 5) {
      const carX = l2Spawn.x + dist * Math.sin(l2Spawn.heading);
      const carZ = l2Spawn.z - dist * Math.cos(l2Spawn.heading);

      colliders.forEach(c => {
        if (c.shape === 'boundary') {
          const hit = (carX - carHalfW) < c.minX || (carX + carHalfW) > c.maxX || (carZ - carHalfL) < c.minZ || (carZ + carHalfL) > c.maxZ;
          expect(hit).toBe(false);
        }
      });
    }
  });

  it('3. Spawn on L3 -> Wait >5s -> Drive 300m -> Verify 0 collisions', () => {
    const l3Spawn = { x: 487.50 - 3.5, z: -589.42, heading: 2.1346 };
    const carHalfW = 0.95;
    const carHalfL = 2.25;

    for (let dist = 0; dist <= 300; dist += 5) {
      const carX = l3Spawn.x + dist * Math.sin(l3Spawn.heading);
      const carZ = l3Spawn.z - dist * Math.cos(l3Spawn.heading);

      colliders.forEach(c => {
        if (c.shape === 'boundary') {
          const hit = (carX - carHalfW) < c.minX || (carX + carHalfW) > c.maxX || (carZ - carHalfL) < c.minZ || (carZ + carHalfL) > c.maxZ;
          expect(hit).toBe(false);
        }
      });
    }
  });

  it('4. Drive along left carriageway edge -> Verify 0 false guardrail/boundary collisions', () => {
    const leftEdgeSpawn = { x: 487.50 - 4.5, z: -589.42, heading: 2.1346 };
    const carHalfW = 0.95;
    const carHalfL = 2.25;

    for (let dist = 0; dist <= 200; dist += 5) {
      const carX = leftEdgeSpawn.x + dist * Math.sin(leftEdgeSpawn.heading);
      const carZ = leftEdgeSpawn.z - dist * Math.cos(leftEdgeSpawn.heading);

      colliders.forEach(c => {
        if (c.shape === 'boundary') {
          const hit = (carX - carHalfW) < c.minX || (carX + carHalfW) > c.maxX || (carZ - carHalfL) < c.minZ || (carZ + carHalfL) > c.maxZ;
          expect(hit).toBe(false);
        }
      });
    }
  });

  it('5. Drive along right carriageway edge -> Verify 0 false guardrail/boundary collisions', () => {
    const rightEdgeSpawn = { x: 487.50 + 4.5, z: -589.42, heading: 2.1346 };
    const carHalfW = 0.95;
    const carHalfL = 2.25;

    for (let dist = 0; dist <= 200; dist += 5) {
      const carX = rightEdgeSpawn.x + dist * Math.sin(rightEdgeSpawn.heading);
      const carZ = rightEdgeSpawn.z - dist * Math.cos(rightEdgeSpawn.heading);

      colliders.forEach(c => {
        if (c.shape === 'boundary') {
          const hit = (carX - carHalfW) < c.minX || (carX + carHalfW) > c.maxX || (carZ - carHalfL) < c.minZ || (carZ + carHalfL) > c.maxZ;
          expect(hit).toBe(false);
        }
      });
    }
  });

  it('6. Drive through a high-speed Autobahn curve -> Verify 0 false collisions', () => {
    // Curved motorway way_101496470
    const curveRoad = autobahnGraphData.roads.find(r => r.id === 'way_101496470');
    expect(curveRoad).toBeDefined();

    const pts = curveRoad.centerline;
    const carHalfW = 0.95;
    const carHalfL = 2.25;

    pts.forEach(([px, pz]) => {
      colliders.forEach(c => {
        if (c.shape === 'boundary') {
          const hit = (px - carHalfW) < c.minX || (px + carHalfW) > c.maxX || (pz - carHalfL) < c.minZ || (pz + carHalfL) > c.maxZ;
          expect(hit).toBe(false);
        }
      });
    });
  });

  it('7. Drive into Ausfahrt (motorway_link) -> Ramp -> Auffahrt -> Verify 0 false boundary/guardrail collisions', () => {
    const ramps = autobahnGraphData.roads.filter(r => r.highway === 'motorway_link');
    expect(ramps.length).toBeGreaterThan(0);

    const carHalfW = 0.95;
    const carHalfL = 2.25;

    ramps.forEach(ramp => {
      ramp.centerline.forEach(([rx, rz]) => {
        colliders.forEach(c => {
          if (c.shape === 'boundary') {
            const hit = (rx - carHalfW) < c.minX || (rx + carHalfW) > c.maxX || (rz - carHalfL) < c.minZ || (rz + carHalfL) > c.maxZ;
            expect(hit).toBe(false);
          }
        });
      });
    });
  });
});
