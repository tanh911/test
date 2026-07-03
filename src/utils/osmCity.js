/**
 * osmLoader.js
 * Fetches road + building data from OpenStreetMap (Overpass API)
 * and converts to Three.js geometry.
 *
 * Area: Munich city center (~2km × 2km around Marienplatz)
 */

import * as THREE from 'three/webgpu';
import osmtogeojson from 'osmtogeojson';

// ── Center of the map (Munich Marienplatz) ────────────────────────────────
const CENTER_LAT = 48.1374;
const CENTER_LNG = 11.5755;

// Convert lat/lng → Three.js world coords (Z forward = south)
export function lngLatToXZ(lng, lat) {
  const x = (lng - CENTER_LNG) * 111320 * Math.cos(CENTER_LAT * Math.PI / 180);
  const z = -(lat - CENTER_LAT) * 110540;
  return { x, z };
}

// ── Road width by OSM highway tag ─────────────────────────────────────────
const ROAD_WIDTHS = {
  motorway: 14,
  motorway_link: 6,
  trunk: 12,
  trunk_link: 5,
  primary: 10,
  primary_link: 4,
  secondary: 8,
  secondary_link: 4,
  tertiary: 6,
  residential: 5,
  living_street: 4,
  service: 3,
  footway: 1.5,
  cycleway: 1.5,
  path: 1.2,
  default: 5,
};

const ROAD_COLORS = {
  motorway: 0x888888,
  primary: 0x666666,
  secondary: 0x555555,
  residential: 0x444444,
  default: 0x3a3a3a,
};

// ── Fetch OSM data from Overpass ──────────────────────────────────────────
export async function fetchOSMData(onProgress) {
  // Bounding box: roughly 2km × 2km around Munich Marienplatz
  const south = 48.129, west = 11.561, north = 48.146, east = 11.590;

  const query = `[out:json][timeout:30];
(
  way["highway"](${south},${west},${north},${east});
  way["building"](${south},${west},${north},${east});
  relation["building"](${south},${west},${north},${east});
);
out body;
>;
out skel qt;`;

  onProgress?.('Đang tải bản đồ Munich từ OpenStreetMap…');

  const res = await fetch(
    'https://overpass-api.de/api/interpreter',
    { method: 'POST', body: query }
  );
  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
  const osm = await res.json();

  onProgress?.('Đang xử lý dữ liệu bản đồ…');
  return osmtogeojson(osm);
}

// ── Build road meshes from GeoJSON ────────────────────────────────────────
export function buildRoads(geojson, scene) {
  const group = new THREE.Group();

  geojson.features
    .filter(f => f.geometry.type === 'LineString' && f.properties.highway)
    .forEach(road => {
      const tag = f => f.properties.highway;
      const hw = road.properties.highway;
      const width = ROAD_WIDTHS[hw] || ROAD_WIDTHS.default;
      const col = ROAD_COLORS[hw] || ROAD_COLORS.default;

      const coords = road.geometry.coordinates;
      const points = coords.map(([lng, lat]) => {
        const { x, z } = lngLatToXZ(lng, lat);
        return new THREE.Vector3(x, 0.01, z);
      });

      if (points.length < 2) return;

      // Build road strip as series of quads
      const positions = [];
      const indices = [];
      let vi = 0;

      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        const dir = b.clone().sub(a).normalize();
        const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width / 2);

        const v0 = a.clone().add(perp);
        const v1 = a.clone().sub(perp);
        const v2 = b.clone().add(perp);
        const v3 = b.clone().sub(perp);

        positions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
        indices.push(vi, vi + 1, vi + 2, vi + 1, vi + 3, vi + 2);
        vi += 4;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 });
      group.add(new THREE.Mesh(geo, mat));

      // Sidewalk strips
      if (['primary', 'secondary', 'tertiary', 'residential', 'living_street'].includes(hw)) {
        addSidewalk(points, width + 2, group);
      }
    });

  scene.add(group);
  return group;
}

function addSidewalk(points, totalWidth, group) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x999988, roughness: 0.95 });
  const swWidth = 1.5;

  [-1, 1].forEach(side => {
    const positions = [], indices = [];
    let vi = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const dir = b.clone().sub(a).normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar((totalWidth / 2 + swWidth / 2) * side);
      const hw2 = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(swWidth / 2);

      const v0 = a.clone().add(perp).add(hw2);
      const v1 = a.clone().add(perp).sub(hw2);
      const v2 = b.clone().add(perp).add(hw2);
      const v3 = b.clone().add(perp).sub(hw2);

      positions.push(v0.x, 0.02, v0.z, v1.x, 0.02, v1.z, v2.x, 0.02, v2.z, v3.x, 0.02, v3.z);
      indices.push(vi, vi + 1, vi + 2, vi + 1, vi + 3, vi + 2);
      vi += 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, mat));
  });
}

// ── Build buildings from GeoJSON (footprint extrusion) ───────────────────
export function buildBuildings(geojson, scene) {
  const group = new THREE.Group();

  const bMats = [
    new THREE.MeshStandardMaterial({ color: 0xc8b89a, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0xa05030, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0xd8d0b8, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.75 }),
    new THREE.MeshStandardMaterial({ color: 0xbbaa99, roughness: 0.85 }),
  ];

  const roofMat = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.9 });

  let bIdx = 0;
  geojson.features
    .filter(f => f.properties.building && f.geometry.type === 'Polygon')
    .forEach(building => {
      try {
        const rings = building.geometry.coordinates;
        const outer = rings[0];
        const pts2d = outer.map(([lng, lat]) => {
          const { x, z } = lngLatToXZ(lng, lat);
          return new THREE.Vector2(x, z);
        });

        // Height from OSM tags or default
        const levels = parseInt(building.properties['building:levels']) || 0;
        const tagHeight = parseFloat(building.properties.height) || 0;
        const h = tagHeight > 0 ? tagHeight : (levels > 0 ? levels * 3.2 : 3 + (bIdx % 7) * 2.5);

        const shape = new THREE.Shape(pts2d);
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: h, bevelEnabled: false,
        });

        // Rotate so Y is up (ExtrudeGeometry extrudes along Z)
        geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        geo.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0));

        const mat = bMats[bIdx % bMats.length];
        const mesh = new THREE.Mesh(geo, [mat, roofMat]);
        group.add(mesh);
        bIdx++;
      } catch (e) {
        // skip malformed polygons
      }
    });

  scene.add(group);
  return group;
}

// ── Ground plane for the whole map ───────────────────────────────────────
export function buildGround(scene) {
  // Grass base
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.MeshStandardMaterial({ color: 0x3a7a2a, roughness: 1 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.02;
  scene.add(grass);
}

// ── Lane dashes (painted markings on roads) ───────────────────────────────
export function buildLaneMarkings(geojson, scene) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const dashLen = 3, dashGap = 6;

  geojson.features
    .filter(f => f.geometry.type === 'LineString' &&
      ['primary', 'secondary', 'tertiary', 'residential'].includes(f.properties.highway))
    .forEach(road => {
      const coords = road.geometry.coordinates;
      const points = coords.map(([lng, lat]) => {
        const { x, z } = lngLatToXZ(lng, lat);
        return new THREE.Vector3(x, 0.03, z);
      });

      let distAcc = 0;
      let drawing = true;
      for (let i = 0; i < points.length - 1; i++) {
        const seg = points[i + 1].clone().sub(points[i]);
        const segLen = seg.length();
        const dir = seg.clone().normalize();
        let traveled = 0;

        while (traveled < segLen) {
          const start = points[i].clone().add(dir.clone().multiplyScalar(traveled));
          const dashEnd = Math.min(traveled + (drawing ? dashLen : dashGap), segLen);
          if (drawing) {
            const end = points[i].clone().add(dir.clone().multiplyScalar(dashEnd));
            const mid = start.clone().add(end).multiplyScalar(0.5);
            const len = dashEnd - traveled;
            const geo = new THREE.PlaneGeometry(0.18, len);
            geo.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.atan2(dir.x, dir.z)));
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(mid);
            mesh.rotation.x = -Math.PI / 2;
            group.add(mesh);
          }
          traveled = dashEnd;
          drawing = !drawing;
        }
      }
    });

  scene.add(group);
  return group;
}

// ── Instanced Trees along roads ───────────────────────────────────────────
export function buildTrees(geojson, scene) {
  const count = 500;
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 5);
  const leafGeo = new THREE.SphereGeometry(1.6, 6, 5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a6b1a, roughness: 0.9 });

  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, count);

  const matrix = new THREE.Matrix4();
  let idx = 0;

  geojson.features
    .filter(f => f.geometry.type === 'LineString' &&
      ['residential', 'tertiary', 'secondary'].includes(f.properties.highway))
    .forEach(road => {
      if (idx >= count) return;
      const coords = road.geometry.coordinates;
      for (let i = 0; i < coords.length - 1 && idx < count; i += 2) {
        const [lng, lat] = coords[i];
        const { x, z } = lngLatToXZ(lng, lat);
        // Offset from road center
        const offset = 5 + Math.random() * 2;
        const side = Math.random() > 0.5 ? 1 : -1;

        matrix.makeTranslation(x + offset * side, 1.25, z);
        trunks.setMatrixAt(idx, matrix);
        matrix.makeTranslation(x + offset * side, 3.5, z);
        leaves.setMatrixAt(idx, matrix);
        idx++;
      }
    });

  trunks.count = idx; leaves.count = idx;
  trunks.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;
  scene.add(trunks); scene.add(leaves);
}
