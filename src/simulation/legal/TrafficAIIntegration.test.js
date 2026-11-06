import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { TrafficAIManager, BERLIN_MITTE_TRAFFIC_CORRIDORS } from '../trafficAI.js';
import { BERLIN_FIXED_SPAWN, BERLIN_DIRECTIVES } from '../data/berlinDirectives.js';
import { LaneGraphGenerator } from './LaneGraphGenerator.js';
import roadGraphData from '../data/road_graph.json';

describe('🚦 Berlin-Mitte StVO Traffic Flow & Positions Integration Tests', () => {
  it('should load all 12 authentic OpenStreetMap Berlin-Mitte traffic corridors', () => {
    expect(BERLIN_MITTE_TRAFFIC_CORRIDORS).toBeDefined();
    expect(BERLIN_MITTE_TRAFFIC_CORRIDORS.length).toBe(12);

    const expectedCorridors = [
      'friedrich_southbound',
      'friedrich_northbound',
      'linden_eastbound',
      'linden_westbound',
      'tor_eastbound',
      'tor_westbound',
      'wilhelm_southbound',
      'wilhelm_northbound',
      'franz_eastbound',
      'franz_westbound',
      'hackescher_eastbound',
      'hackescher_westbound'
    ];

    expectedCorridors.forEach(id => {
      const c = BERLIN_MITTE_TRAFFIC_CORRIDORS.find(item => item.id === id);
      expect(c).toBeDefined();
      expect(c.waypoints.length).toBeGreaterThan(10);
      expect(c.totalLength).toBeGreaterThan(500); // Arteries must be continuous > 500m
      expect(c.speedLimitKmH).toBeGreaterThanOrEqual(30);
      expect(c.speedLimitKmH).toBeLessThanOrEqual(50);
      expect(c.laneOffset).toBeGreaterThan(0); // Right-hand drive Rechtsfahrgebot (§ 2 StVO)
    });
  });

  it('should ensure all traffic corridor waypoints lie within Berlin-Mitte metric boundaries', () => {
    const minX = -1150;
    const maxX = 1800;
    const minZ = -650;
    const maxZ = 1450;

    BERLIN_MITTE_TRAFFIC_CORRIDORS.forEach(corridor => {
      corridor.waypoints.forEach(([x, z]) => {
        expect(isNaN(x)).toBe(false);
        expect(isNaN(z)).toBe(false);
        expect(x).toBeGreaterThanOrEqual(minX);
        expect(x).toBeLessThanOrEqual(maxX);
        expect(z).toBeGreaterThanOrEqual(minZ);
        expect(z).toBeLessThanOrEqual(maxZ);
      });
    });
  });

  it('should accurately evaluate corridor position, tangent, and right-hand heading', () => {
    const mgr = new TrafficAIManager(null);
    const corridor = BERLIN_MITTE_TRAFFIC_CORRIDORS.find(c => c.id === 'friedrich_southbound');
    expect(corridor).toBeDefined();

    // Evaluate position at 100m into corridor
    const geom = mgr.evaluateCorridorPosition(corridor, 100);
    expect(isNaN(geom.posX)).toBe(false);
    expect(isNaN(geom.posZ)).toBe(false);
    expect(isNaN(geom.heading)).toBe(false);
    expect(Math.hypot(geom.ux, geom.uz)).toBeCloseTo(1.0, 3); // Unit tangent vector

    // Friedrichstraße Southbound should be moving South (uz < 0)
    expect(geom.uz).toBeLessThan(0);
  });

  it('should initialize bot cars without stacking or colliding at spawn', () => {
    const scene = new THREE.Scene();
    const mgr = new TrafficAIManager(scene, false);
    mgr.init('stadt_zentrum');

    expect(mgr.botCars.length).toBeGreaterThanOrEqual(12);

    // Verify all bot cars have valid 3D positions and non-NaN speeds
    mgr.botCars.forEach(car => {
      expect(isNaN(car.mesh.position.x)).toBe(false);
      expect(isNaN(car.mesh.position.z)).toBe(false);
      expect(isNaN(car.speed)).toBe(false);
      expect(car.speed).toBeGreaterThan(0);
    });

    // Check that cars on the same corridor maintain initial headway separation
    const carsByCorridor = {};
    mgr.botCars.forEach(car => {
      const cid = car.corridor.id;
      if (!carsByCorridor[cid]) carsByCorridor[cid] = [];
      carsByCorridor[cid].push(car);
    });

    Object.values(carsByCorridor).forEach(cars => {
      if (cars.length > 1) {
        for (let i = 0; i < cars.length; i++) {
          for (let j = i + 1; j < cars.length; j++) {
            const d = Math.abs(cars[i].pathDist - cars[j].pathDist);
            expect(d).toBeGreaterThan(30); // At least 30m spacing on spawn
          }
        }
      }
    });
  });

  it('should decelerate or stop when approaching red traffic lights (§ 37 StVO)', () => {
    const scene = new THREE.Scene();
    const mgr = new TrafficAIManager(scene, false);
    mgr.init('stadt_zentrum');

    // Force traffic light to RED
    mgr.setTrafficLightState('RED');

    // Find a car with lights ahead
    const carWithLight = mgr.botCars.find(c => c.corridor.lights && c.corridor.lights.length > 0);
    expect(carWithLight).toBeDefined();

    // Place car 12m before the light
    const targetLight = carWithLight.corridor.lights[0];
    carWithLight.pathDist = Math.max(0, targetLight.pathDist - 12);
    const prevSpeed = carWithLight.speed;

    mgr.update(0.5, null);

    // Car should decelerate towards 0
    expect(carWithLight.speed).toBeLessThan(prevSpeed);
    expect(carWithLight.stopReason).toBe('AMPEL_RED');
  });

  it('should maintain safe following distance behind player car (§ 4 StVO)', () => {
    const scene = new THREE.Scene();
    const mgr = new TrafficAIManager(scene, false);
    mgr.init('stadt_zentrum');

    const car = mgr.botCars[0];
    // Put player directly in front of this bot car along its tangent
    const geom = mgr.evaluateCorridorPosition(car.corridor, car.pathDist);
    const playerSimPos = {
      x: geom.posX + geom.ux * 10,
      z: geom.posZ + geom.uz * 10
    };

    const initialSpeed = car.speed;
    mgr.update(0.5, playerSimPos);

    expect(car.speed).toBeLessThan(initialSpeed);
    expect(['PLAYER_AHEAD', 'PLAYER_PROXIMITY']).toContain(car.stopReason);
  });

  it('should report clean real-time traffic telemetry via getTrafficStates()', () => {
    const scene = new THREE.Scene();
    const mgr = new TrafficAIManager(scene, false);
    mgr.init('stadt_zentrum');

    const states = mgr.getTrafficStates();
    expect(states.length).toBe(mgr.botCars.length);

    states.forEach(s => {
      expect(s.id).toMatch(/^bot_car_/);
      expect(typeof s.x).toBe('number');
      expect(typeof s.z).toBe('number');
      expect(typeof s.heading).toBe('number');
      expect(typeof s.speedKmH).toBe('number');
      expect(s.color).toBeDefined();
    });
  });

  it('should verify fixed player spawn position is on Friedrichstraße drivable lane', () => {
    expect(BERLIN_FIXED_SPAWN.x).toBeCloseTo(-2.88, 1);
    expect(BERLIN_FIXED_SPAWN.z).toBeCloseTo(32.0, 1);
    expect(BERLIN_FIXED_SPAWN.rot).toBe(0); // Facing South towards Unter den Linden intersection

    // Centerline of Friedrichstraße at Z = 32 is around X = -5.88 with road width 12m (-11.88 to +0.12)
    // -2.88 is dead-center inside the Right-hand Southbound lane (§ 2 StVO Rechtsfahrgebot), safely 7.3m before the Haltelinie!
    expect(BERLIN_FIXED_SPAWN.x).toBeGreaterThan(-5.88);
    expect(BERLIN_FIXED_SPAWN.x).toBeLessThan(0.5);
  });

  it('should verify all examiner directive destinations have valid coordinates', () => {
    const alexDir = BERLIN_DIRECTIVES.find(d => d.id === 'dir_east_alexanderplatz');
    expect(alexDir.dest.x).toBeDefined();
    expect(alexDir.dest.z).toBeDefined();

    const brandenDir = BERLIN_DIRECTIVES.find(d => d.id === 'dir_west_brandenburg');
    expect(brandenDir.dest.x).toBeDefined();
    expect(brandenDir.dest.z).toBeDefined();

    const gendarmeDir = BERLIN_DIRECTIVES.find(d => d.id === 'dir_south_gendarmenmarkt');
    expect(gendarmeDir.dest.x).toBeDefined();
    expect(gendarmeDir.dest.z).toBeDefined();

    const hackDir = BERLIN_DIRECTIVES.find(d => d.id === 'dir_north_hackescher');
    expect(hackDir.dest.x).toBeDefined();
    expect(hackDir.dest.z).toBeDefined();
  });

  it('should seamlessly spawn and navigate bot cars on dynamic LaneGraph centerlines', () => {
    const scene = new THREE.Scene();
    const mgr = new TrafficAIManager(scene, false);
    const laneGraph = new LaneGraphGenerator(roadGraphData);

    mgr.initFromLaneGraph(laneGraph);

    expect(mgr.botCars.length).toBeGreaterThan(0);
    expect(mgr.botCars.length).toBeLessThanOrEqual(mgr.maxCars);

    mgr.botCars.forEach(car => {
      expect(car.corridor.laneOffset).toBe(0); // Driven right on lane centerline
      expect(isNaN(car.mesh.position.x)).toBe(false);
      expect(isNaN(car.mesh.position.z)).toBe(false);
      expect(car.speed).toBeGreaterThan(0);
    });

    // Run 1 simulation step
    const initialPos = { x: mgr.botCars[0].mesh.position.x, z: mgr.botCars[0].mesh.position.z };
    mgr.update(0.1, null);
    const updatedPos = { x: mgr.botCars[0].mesh.position.x, z: mgr.botCars[0].mesh.position.z };

    // Car must have moved along the lane
    const moved = Math.hypot(updatedPos.x - initialPos.x, updatedPos.z - initialPos.z);
    expect(moved).toBeGreaterThan(0);
  });
});
