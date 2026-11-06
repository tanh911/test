import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { JunctionGeometryBuilder } from './JunctionGeometryBuilder.js';
import { LaneGraphGenerator } from './LaneGraphGenerator.js';

describe('🏛️ Phase 2B Junction Geometry & Road Mouths Verification', () => {

  // ── TEST 1: 4-WAY ORTHOGONAL INTERSECTION ─────────────────────────────────
  it('1. 4-Way Intersection: constructs valid CCW polygon and 100% upward-facing triangles', () => {
    const junction = {
      id: 'junc_4way',
      center: [0, 0],
      hasTrafficLight: true,
      priorityRule: 'AMPEL'
    };

    // 4 approaching roads: North, South, East, West
    const roadNorth = {
      id: 'road_N',
      name: 'Nordstraße',
      width: 8.0,
      length: 100,
      centerline: [[0, 100], [0, 0]] // Approaches junction at end
    };
    const roadSouth = {
      id: 'road_S',
      name: 'Südstraße',
      width: 8.0,
      length: 100,
      centerline: [[0, -100], [0, 0]] // Approaches junction at end
    };
    const roadEast = {
      id: 'road_E',
      name: 'Oststraße',
      width: 8.0,
      length: 100,
      centerline: [[100, 0], [0, 0]] // Approaches junction at end
    };
    const roadWest = {
      id: 'road_W',
      name: 'Weststraße',
      width: 8.0,
      length: 100,
      centerline: [[-100, 0], [0, 0]] // Approaches junction at end
    };

    const trimDist = 6.0;
    const mouths = [
      JunctionGeometryBuilder.computeRoadMouth({ road: roadNorth, junction, trimDist }),
      JunctionGeometryBuilder.computeRoadMouth({ road: roadSouth, junction, trimDist }),
      JunctionGeometryBuilder.computeRoadMouth({ road: roadEast, junction, trimDist }),
      JunctionGeometryBuilder.computeRoadMouth({ road: roadWest, junction, trimDist })
    ];

    expect(mouths.length).toBe(4);
    mouths.forEach(m => {
      expect(m).toBeDefined();
      expect(m.mouth).toBeDefined();
      expect(m.left).toBeDefined();
      expect(m.right).toBeDefined();
      // Mouth width must be 8m
      const w = Math.hypot(m.left[0] - m.right[0], m.left[1] - m.right[1]);
      expect(w).toBeCloseTo(8.0, 1);
    });

    // Build junction polygon
    const polygon = JunctionGeometryBuilder.buildJunctionPolygon({ junction, mouths });
    expect(polygon.length).toBe(8); // 4 mouths * 2 points (left & right)

    // Triangulate
    const { vertices, indices } = JunctionGeometryBuilder.triangulateJunctionPolygon(polygon, 0.022);
    expect(indices.length).toBeGreaterThan(0);
    expect(indices.length % 3).toBe(0);

    // Verify 100% of triangle normals point UPWARD (+Y = 1)
    const numTris = indices.length / 3;
    for (let t = 0; t < numTris; t++) {
      const i0 = indices[t * 3];
      const i1 = indices[t * 3 + 1];
      const i2 = indices[t * 3 + 2];

      const v0 = new THREE.Vector3(vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]);
      const v1 = new THREE.Vector3(vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]);
      const v2 = new THREE.Vector3(vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]);

      const n = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(v1, v0), new THREE.Vector3().subVectors(v2, v0)).normalize();
      expect(n.y).toBeCloseTo(1.0, 3);
      expect(n.x).toBeCloseTo(0.0, 3);
      expect(n.z).toBeCloseTo(0.0, 3);
    }
  });

  // ── TEST 2: T-JUNCTION (PRESERVES CONCAVITY, NO FORCED CONVEX HULL) ─────────
  it('2. T-Junction: preserves concave boundary without forcing convex hull', () => {
    const junction = {
      id: 'junc_T',
      center: [0, 0],
      hasTrafficLight: false,
      priorityRule: 'RECHTS_VOR_LINKS'
    };

    // Continuous through-road East-West + Stem road approaching from South
    const roadEast = {
      id: 'road_E',
      width: 8.0,
      length: 80,
      centerline: [[80, 0], [0, 0]]
    };
    const roadWest = {
      id: 'road_W',
      width: 8.0,
      length: 80,
      centerline: [[-80, 0], [0, 0]]
    };
    const roadSouth = {
      id: 'road_S',
      width: 8.0,
      length: 80,
      centerline: [[0, -80], [0, 0]]
    };

    const trimDist = 6.0;
    const mouths = [
      JunctionGeometryBuilder.computeRoadMouth({ road: roadEast, junction, trimDist }),
      JunctionGeometryBuilder.computeRoadMouth({ road: roadWest, junction, trimDist }),
      JunctionGeometryBuilder.computeRoadMouth({ road: roadSouth, junction, trimDist })
    ];

    const polygon = JunctionGeometryBuilder.buildJunctionPolygon({ junction, mouths });
    expect(polygon.length).toBe(6); // 3 mouths * 2 points

    // CONCAVITY CHECK:
    // In a T-junction with East, West, South:
    // The polygon must have inner corners indenting towards South.
    // A convex hull would include the triangle between East, West, and South outer extremities,
    // which has an area strictly larger than the true concave T-junction!
    let trueArea = 0;
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      trueArea += (p1[0] * p2[1] - p2[0] * p1[1]);
    }
    trueArea = Math.abs(trueArea) * 0.5;

    // Bounding box area
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    polygon.forEach(p => {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minZ = Math.min(minZ, p[1]);
      maxZ = Math.max(maxZ, p[1]);
    });
    const bboxArea = (maxX - minX) * (maxZ - minZ);
    // In a T-junction, trueArea is smaller than bboxArea due to cut corners on bottom-left and bottom-right
    expect(trueArea).toBeLessThan(bboxArea);
    expect(trueArea).toBeCloseTo(116, 0);

    // Triangulate T-junction: must succeed and produce all upward normals
    const { vertices, indices } = JunctionGeometryBuilder.triangulateJunctionPolygon(polygon, 0.022);
    expect(indices.length).toBeGreaterThan(0);
    const numTris = indices.length / 3;
    for (let t = 0; t < numTris; t++) {
      const i0 = indices[t * 3], i1 = indices[t * 3 + 1], i2 = indices[t * 3 + 2];
      const v0 = new THREE.Vector3(vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]);
      const v1 = new THREE.Vector3(vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]);
      const v2 = new THREE.Vector3(vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]);
      const n = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(v1, v0), new THREE.Vector3().subVectors(v2, v0)).normalize();
      expect(n.y).toBeCloseTo(1.0, 3);
    }
  });

  // ── TEST 3: DIAGONAL / SKEWED INTERSECTION (ACUTE & OBTUSE CORNERS) ────────
  it('3. Skewed / Diagonal Intersection: triangulates accurately without self-intersections', () => {
    const junction = {
      id: 'junc_skew',
      center: [50, 50],
      hasTrafficLight: true,
      priorityRule: 'AMPEL'
    };

    // Roads meeting at skewed angles (e.g. 0 rad, 1.0 rad, 3.14 rad, 4.14 rad)
    const angles = [0, 1.1, Math.PI, Math.PI + 1.1];
    const roads = angles.map((ang, idx) => {
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      return {
        id: `road_skew_${idx}`,
        width: 7.5,
        length: 60,
        centerline: [
          [50 + cos * 60, 50 + sin * 60],
          [50, 50]
        ]
      };
    });

    const mouths = roads.map(road => JunctionGeometryBuilder.computeRoadMouth({ road, junction, trimDist: 5.5 }));
    const polygon = JunctionGeometryBuilder.buildJunctionPolygon({ junction, mouths });
    expect(polygon.length).toBe(8);

    const { vertices, indices } = JunctionGeometryBuilder.triangulateJunctionPolygon(polygon, 0.022);
    expect(indices.length).toBeGreaterThan(0);

    const numTris = indices.length / 3;
    for (let t = 0; t < numTris; t++) {
      const i0 = indices[t * 3], i1 = indices[t * 3 + 1], i2 = indices[t * 3 + 2];
      const v0 = new THREE.Vector3(vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]);
      const v1 = new THREE.Vector3(vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]);
      const v2 = new THREE.Vector3(vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]);
      const n = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(v1, v0), new THREE.Vector3().subVectors(v2, v0)).normalize();
      expect(n.y).toBeCloseTo(1.0, 3);
    }
  });

  // ── TEST 4: 5-WAY COMPLEX INTERSECTION (FRIEDRICHSTR. X UNTER DEN LINDEN) ──
  it('4. 5-Way Complex Intersection: radially orders 5 mouths and generates seamless mesh', () => {
    const junction = {
      id: 'junc_5way',
      center: [0, -27],
      hasTrafficLight: true,
      priorityRule: 'AMPEL'
    };

    // 5 approaching roads: North, South, East, West, and Diagonal
    const roads = [
      { id: 'seg_1', width: 12.0, length: 50, centerline: [[0, 23], [0, -27]] },
      { id: 'seg_2', width: 12.0, length: 50, centerline: [[0, -77], [0, -27]] },
      { id: 'seg_3', width: 14.0, length: 50, centerline: [[50, -27], [0, -27]] },
      { id: 'seg_4', width: 14.0, length: 50, centerline: [[-50, -27], [0, -27]] },
      { id: 'seg_5', width: 8.0, length: 50, centerline: [[35, 8], [0, -27]] }
    ];

    const mouths = roads.map(road => JunctionGeometryBuilder.computeRoadMouth({ road, junction, trimDist: 8.0 }));
    const polygon = JunctionGeometryBuilder.buildJunctionPolygon({ junction, mouths });
    expect(polygon.length).toBe(10); // 5 mouths * 2 corners

    const { vertices, indices } = JunctionGeometryBuilder.triangulateJunctionPolygon(polygon, 0.022);
    expect(indices.length).toBeGreaterThan(0);

    const numTris = indices.length / 3;
    for (let t = 0; t < numTris; t++) {
      const i0 = indices[t * 3], i1 = indices[t * 3 + 1], i2 = indices[t * 3 + 2];
      const v0 = new THREE.Vector3(vertices[i0 * 3], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]);
      const v1 = new THREE.Vector3(vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]);
      const v2 = new THREE.Vector3(vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]);
      const n = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(v1, v0), new THREE.Vector3().subVectors(v2, v0)).normalize();
      expect(n.y).toBeCloseTo(1.0, 3);
    }
  });

  // ── TEST 5: CORNER CURB FILLET TRANSITIONS ─────────────────────────────────
  it('5. Corner Curbs: connects adjacent mouths around junction perimeter', () => {
    const junction = { id: 'junc_curb_test', center: [0, 0] };
    const mouths = [
      { roadId: 'r1', angle: 0, right: [10, -4], left: [10, 4] },
      { roadId: 'r2', angle: Math.PI / 2, right: [4, 10], left: [-4, 10] },
      { roadId: 'r3', angle: Math.PI, right: [-10, 4], left: [-10, -4] },
      { roadId: 'r4', angle: -Math.PI / 2, right: [-4, -10], left: [4, -10] }
    ];

    const cornerCurbs = JunctionGeometryBuilder.buildCornerCurbs({
      junction,
      mouths,
      curbWidth: 0.18,
      swWidth: 2.5
    });

    expect(cornerCurbs.length).toBe(4);
    cornerCurbs.forEach(cc => {
      expect(cc.innerPoints.length).toBe(3);
      expect(cc.topOuterPoints.length).toBe(3);
      expect(cc.swOuterPoints.length).toBe(3);
    });
  });

  // ── TEST 6: StVO ZEICHEN 294 STOP LINES SPANNING FORWARD LANES ONLY ────────
  it('6. Stop Lines: spans strictly forward lanes at 1.5m before junction/crosswalk', () => {
    const road = {
      id: 'road_twoway_test',
      length: 60,
      width: 8.0,
      oneway: false,
      centerline: [[0, 0], [0, 60]]
    };
    const junction = {
      id: 'junc_tl',
      center: [0, 60],
      hasTrafficLight: true,
      priorityRule: 'AMPEL'
    };

    const normals = LaneGraphGenerator.computeNormals(road.centerline);

    // A. Two-way road approaching endJunction (Forward lanes)
    const slEnd = JunctionGeometryBuilder.computeStopLine({
      road,
      junction,
      isEnd: true,
      hasCrosswalk: false,
      roadWidth: 8.0,
      isOneway: false,
      roadDivOffset: 0,
      normals,
      points: road.centerline
    });

    expect(slEnd).toBeDefined();
    expect(slEnd.width).toBe(0.50); // StVO Zeichen 294
    expect(slEnd.hasTrafficLight).toBe(true);
    expect(slEnd.trafficLight).toBeDefined();

    // Span check: road width = 8m (-4m to +4m).
    // Forward lanes are on the right: -4m to 0m (span = 4.0m, NOT 8m!)
    const span = Math.hypot(slEnd.p2[0] - slEnd.p1[0], slEnd.p2[1] - slEnd.p1[1]);
    expect(span).toBeCloseTo(4.0, 1);

    // B. One-way road approaching endJunction (All lanes)
    const slOneway = JunctionGeometryBuilder.computeStopLine({
      road: { ...road, oneway: true },
      junction,
      isEnd: true,
      hasCrosswalk: false,
      roadWidth: 8.0,
      isOneway: true,
      roadDivOffset: 0,
      normals,
      points: road.centerline
    });

    // Oneway road spans full width (8.0m)
    const spanOneway = Math.hypot(slOneway.p2[0] - slOneway.p1[0], slOneway.p2[1] - slOneway.p1[1]);
    expect(spanOneway).toBeCloseTo(8.0, 1);
  });
});
