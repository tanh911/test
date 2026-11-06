import * as THREE from 'three';
import {
  createPbrRoadMaterial,
  createCobblestoneMaterial,
  createSidewalkMaterial
} from '../components/textures.js';
import { makeTrafficLight } from '../components/3dObjects.js';
import { makeGermanStVOSign, createTotemSign } from '../components/environment.js';
import { LaneGraphGenerator } from './legal/LaneGraphGenerator.js';
import { JunctionGeometryBuilder } from './legal/JunctionGeometryBuilder.js';

/**
 * 🛣️ PROCEDURAL ROAD MESH GENERATOR (Three.js)
 * Implements the OSM PBF -> RoadGraph -> LaneGraph -> Procedural 3D Road Mesh pipeline.
 *
 * Core Capabilities:
 *  1. Multi-Element Road Hierarchy:
 *     - Asphalt Carriageway (Fahrbahn) between curbs (Y = 0.02m)
 *     - Raised 3D Granite Curbs (3D Granitbordstein): vertical riser + top cap (Y = 0.02m -> 0.14m)
 *     - Elevated Sidewalks (Gehweg): Y = 0.14m
 *     - StVO Markings: outer edge lines (Z. 295), dashed dividers (Z. 340), stop lines (Z. 294), and zebras (Z. 293)
 *  2. PBF-Accurate Road Surface:
 *     - Base carriageways are rendered directly from road.centerline in the RoadGraph.
 *     - LaneGraph trimming is reserved for lane/curb/marking semantics.
 *  3. Junction Boundary Polygons:
 *     - Seamlessly fills intersection interior without box clipping or overlapping ribbons.
 *  4. Single-Source Lane Graph:
 *     - Produces lane centerlines shared directly with Traffic AI.
 *  5. Geometry Batching (60 FPS):
 *     - Merges city-wide geometry into only 5 batched draw calls.
 */

/**
 * Tính toán vector pháp tuyến miter-join có giới hạn (clamp) cho từng đỉnh polyline
 */
export function computeRibbonNormals(points) {
  return LaneGraphGenerator.computeNormals(points);
}

// Kích thước 1 ô texture mặt tiền: 3.5m ngang (cửa sổ + tường) × 3.0m dọc (1 tầng)
const FACADE_TILE_W = 3.5;
const FACADE_TILE_H = 3.0;

/**
 * 🏢 Sinh texture mặt tiền tòa nhà thủ tục (canvas): nền plaster sáng, khung cửa sổ trắng,
 * kính phản chiếu trời, chân tường sẫm màu — lặp theo mét thực qua UV quy đổi (u = mét / 3.5)
 */
function createFacadeTexture() {
  // jsdom/Node test environment: không có canvas 2D → trả về null, buildingMat dùng màu phẳng
  if (typeof document === 'undefined' || !document.createElement) return null;
  let ctx;
  let c;
  try {
    c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    ctx = c.getContext('2d');
  } catch {
    return null;
  }
  if (!ctx) return null;

  // Nền tường plaster nhẹ nhàng với noise vân mờ
  ctx.fillStyle = '#e7e2d8';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(120, 113, 100, ${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }

  // Khung cửa sổ lớn chiếm phần trung tâm ô (cửa sổ kiểu Berlin Altbau)
  const wx = 30, wy = 26, ww = 196, wh = 158;
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(wx - 8, wy - 8, ww + 16, wh + 16);      // viền bao quanh
  ctx.fillStyle = '#b9ccc4';
  ctx.fillRect(wx, wy, ww, wh);                        // khung kính xanh ngả xám

  // Kính phản chiếu trời (gradient dọc)
  const glass = ctx.createLinearGradient(0, wy, 0, wy + wh);
  glass.addColorStop(0, '#d5e6ef');
  glass.addColorStop(0.5, '#9fb9c9');
  glass.addColorStop(1, '#c3d5dd');
  ctx.fillStyle = glass;
  ctx.fillRect(wx + 6, wy + 6, ww - 12, wh - 12);

  // Chia kiếng 2×2 với đế nhịp trắng
  ctx.strokeStyle = '#f4f1ea';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2);
  ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();

  // Bệ cửa sổ nổi nhẹ
  ctx.fillStyle = '#d8d2c6';
  ctx.fillRect(wx - 12, wy + wh + 6, ww + 24, 8);

  // Sọc chân tường sẫm (đá ốp chân nhà) ở mép dưới tile
  ctx.fillStyle = '#9a948a';
  ctx.fillRect(0, 236, 256, 20);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class ProceduralRoadGenerator {
  constructor(scenery, sharedMaterials = {}) {
    this.scenery = scenery;
    this.roadMat = createPbrRoadMaterial({ repeatX: 4, repeatZ: 4, roughness: 0.82 });
    this.roadMat.side = THREE.DoubleSide;
    this.whiteLineMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    this.swMat = createSidewalkMaterial({ repeatX: 2, repeatZ: 10 });
    this.curbMat = sharedMaterials.curbConcrete || new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.65 });
    this.grassMat = new THREE.MeshStandardMaterial({ color: 0x2d4a22, roughness: 0.85, side: THREE.DoubleSide });
    this.guardrailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.25 });
    this.guardrailPostMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });
    this.medianMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.1 });
    this.reflektorPostMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    this.reflektorCapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    this.reflektorRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, emissive: 0x991b1b });
    this.reflektorWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, emissive: 0x707070 });

    // 🌊 Materials bổ sung cho đầy đủ các layer PBF: Sông, Đường sắt, Công viên, Tòa nhà
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
    this.shorelineMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    this.railBedMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    this.steelRailMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25
    });
    this.buildingMat = new THREE.MeshStandardMaterial({
      map: createFacadeTexture(),
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    this.roofMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      side: THREE.DoubleSide
    });

    this.laneGraph = null;
    this.trafficLightMeshes = [];
    this.debugGroup = null;
  }

  /**
   * Sinh dải đường đơn lẻ (dùng cho các trường hợp phụ trợ hoặc custom)
   */
  createRoadRibbon(points, width, y = 0.02) {
    if (!points || points.length < 2) return null;

    const vertices = [];
    const uvs = [];
    const indices = [];

    const halfW = width / 2;
    let accumulatedDist = 0;
    const normals = computeRibbonNormals(points);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const { nx, nz, scale } = normals[i];
      const w = halfW * scale;

      if (i > 0) {
        accumulatedDist += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);
      }

      vertices.push(p[0] - nx * w, y, p[1] - nz * w);
      uvs.push(0, accumulatedDist / 8);

      vertices.push(p[0] + nx * w, y, p[1] + nz * w);
      uvs.push(1, accumulatedDist / 8);

      if (i < points.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.roadMat);
    mesh.receiveShadow = true;
    if (this.scenery) this.scenery.add(mesh);
    return mesh;
  }

  /**
   * Sinh vỉa hè nâng cao tự động bám theo hai mép ngoài của mặt đường kèm bó vỉa 3D
   */
  createSidewalkRibbons(points, roadWidth, swWidth = 3.0) {
    if (!points || points.length < 2) return;
    const halfW = roadWidth / 2;
    const curbW = 0.18;
    const normals = computeRibbonNormals(points);

    [-1, 1].forEach(side => {
      const topVertices = [];
      const topUvs = [];
      const topIndices = [];

      const curbVertices = [];
      const curbIndices = [];
      let accumDist = 0;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const { nx, nz, scale } = normals[i];

        if (i > 0) accumDist += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);

        const inX = p[0] + nx * (halfW * scale) * side;
        const inZ = p[1] + nz * (halfW * scale) * side;

        const curbOutX = p[0] + nx * ((halfW + curbW) * scale) * side;
        const curbOutZ = p[1] + nz * ((halfW + curbW) * scale) * side;

        const swOutX = p[0] + nx * ((halfW + curbW + swWidth) * scale) * side;
        const swOutZ = p[1] + nz * ((halfW + curbW + swWidth) * scale) * side;

        // Bó vỉa 3D: Mặt dựng (Riser Y = 0.02 -> 0.14) + Mặt đỉnh (Top cap Y = 0.14)
        curbVertices.push(inX, 0.02, inZ, inX, 0.14, inZ, curbOutX, 0.14, curbOutZ);

        // Mặt trên vỉa hè (Y = 0.14)
        if (side > 0) {
          topVertices.push(curbOutX, 0.14, curbOutZ, swOutX, 0.14, swOutZ);
        } else {
          topVertices.push(swOutX, 0.14, swOutZ, curbOutX, 0.14, curbOutZ);
        }
        topUvs.push(0, accumDist / 4, 1, accumDist / 4);

        if (i < points.length - 1) {
          const tb = i * 2;
          topIndices.push(tb, tb + 1, tb + 2, tb + 1, tb + 3, tb + 2);

          const cb = i * 3;
          // Riser
          curbIndices.push(cb, cb + 1, cb + 3, cb + 1, cb + 4, cb + 3);
          // Cap
          curbIndices.push(cb + 1, cb + 2, cb + 4, cb + 2, cb + 5, cb + 4);
        }
      }

      const topGeo = new THREE.BufferGeometry();
      topGeo.setAttribute('position', new THREE.Float32BufferAttribute(topVertices, 3));
      topGeo.setAttribute('uv', new THREE.Float32BufferAttribute(topUvs, 2));
      topGeo.setIndex(topIndices);
      topGeo.computeVertexNormals();
      const topMesh = new THREE.Mesh(topGeo, this.swMat);
      topMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(topMesh);

      const curbGeo = new THREE.BufferGeometry();
      curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVertices, 3));
      curbGeo.setIndex(curbIndices);
      curbGeo.computeVertexNormals();
      const curbMesh = new THREE.Mesh(curbGeo, this.curbMat);
      curbMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(curbMesh);
    });
  }

  /**
   * Nạp và dựng toàn bộ mạng lưới đường & các lớp dữ liệu PBF từ RoadGraph JSON
   * (Mặt đường, Giao lộ, Vạch kẻ StVO, Bó vỉa 3D, Sông/Kênh đào, Đường sắt/Tram, Công viên, Tòa nhà 3D)
   * Sử dụng Geometry Batching tối ưu hiệu năng toàn bộ 2x2 km thành phố (60 FPS)
   */
  buildFromRoadGraph(graphData) {
    if (!graphData || !graphData.roads) return;

    this.laneGraph = new LaneGraphGenerator(graphData);

    // Buffers cho 13 draw calls tối ưu hiệu năng toàn thành phố
    const roadBuffers = { vertices: [], uvs: [], indices: [] };
    const whiteLineBuffers = { vertices: [], indices: [] };
    const sidewalkBuffers = { vertices: [], uvs: [], indices: [] };
    const curbBuffers = { vertices: [], indices: [] };
    const guardrailBuffers = { vertices: [], indices: [] };
    const guardrailPostBuffers = { vertices: [], indices: [] };
    const medianBuffers = { vertices: [], indices: [] };
    const reflektorPostBuffers = { vertices: [], indices: [] };
    const reflektorCapBuffers = { vertices: [], indices: [] };
    const reflektorRedBuffers = { vertices: [], indices: [] };
    const reflektorWhiteBuffers = { vertices: [], indices: [] };
    const waterBuffers = { vertices: [], uvs: [], indices: [] };
    const shoreBuffers = { vertices: [], indices: [] };
    const railBedBuffers = { vertices: [], uvs: [], indices: [] };
    const steelRailBuffers = { vertices: [], indices: [] };
    const parkBuffers = { vertices: [], uvs: [], indices: [] };
    const buildingBuffers = { vertices: [], uvs: [], indices: [] };
    const roofBuffers = { vertices: [], indices: [] };

    // Calculate b63_x center for Werler Str B63 overpass bridge height calculations (matching Blender model)
    let b63_x = 0.0;
    const localRoads = graphData.roads.filter(r => r.highway && !['motorway', 'motorway_link'].includes(r.highway));
    if (localRoads.length > 0) {
      let sumX = 0;
      let countX = 0;
      localRoads.forEach(r => {
        if (r.centerline) {
          r.centerline.forEach(p => {
            sumX += p[0];
            countX++;
          });
        }
      });
      if (countX > 0) b63_x = sumX / countX;
    }
    const hasMotorways = graphData.roads.some(r => ['motorway', 'motorway_link'].includes(r.highway));

    // 🌉 ELEVATION ENGINE (fix đường phố trôi nổi 6m): chỉ road CẮT QUA thân A2 mới được
    // nâng thành cầu cao 6m (Werler B63, Caldenhofer Weg) — các đường phố còn lại nằm
    // mặt đất. Trước đây MỌI đường local đều ở y=6 → cả mạng phố Rhynern lơ lửng trên
    // cao tốc, xe (physics y=0) không thể chạy vào phố được.
    // ══════════════════════════════════════════════════════════════════════
    // 🌉 ELEVATION ENGINE v2 — nguồn cao độ cho CẦU TREN CAO:
    //   1. Road có tag `bridge` / `layer>0` (OSM thật): chính nó là cầu → height
    //      = max(4, layer × 5.5)m, ramp 22% chiều dài ở 2 đầu mo dốc.
    //   2. Road CẮT QUA thân A2 (motorway): profile 6m quanh điểm cắt (decay 130m).
    //   3. Road CẮT QUA sông/suối rộng ≥ 12m: profile 3m quanh điểm cắt (decay 90m)
    //      → cầu vượt sông Spree ở Berlin tự động nâng mà không cần tag.
    // Grid index 200m cho segment A2 + nước → intersection test chỉ quét lân cận.
    // ══════════════════════════════════════════════════════════════════════
    let _elevIndex = null;
    const getElevIndex = () => {
      if (_elevIndex) return _elevIndex;
      const CELL = 200;
      const grid = new Map();
      const addSeg = (ax, az, bx, bz, h) => {
        const c0x = Math.floor(Math.min(ax, bx) / CELL), c1x = Math.floor(Math.max(ax, bx) / CELL);
        const c0z = Math.floor(Math.min(az, bz) / CELL), c1z = Math.floor(Math.max(az, bz) / CELL);
        for (let cx = c0x; cx <= c1x; cx++) {
          for (let cz = c0z; cz <= c1z; cz++) {
            const k = cx + ':' + cz;
            if (!grid.has(k)) grid.set(k, []);
            grid.get(k).push([ax, az, bx, bz, h]);
          }
        }
      };
      graphData.roads.forEach(r => {
        if (r.highway === 'motorway' && r.centerline && r.centerline.length >= 2) {
          for (let i = 0; i < r.centerline.length - 1; i++) {
            addSeg(r.centerline[i][0], r.centerline[i][1], r.centerline[i + 1][0], r.centerline[i + 1][1], 6);
          }
        }
      });
      (graphData.waterways || []).forEach(w => {
        if ((w.width || 0) < 12 || w.isClosed || !w.points || w.points.length < 2) return;
        for (let i = 0; i < w.points.length - 1; i++) {
          addSeg(w.points[i][0], w.points[i][1], w.points[i + 1][0], w.points[i + 1][1], 3);
        }
      });
      _elevIndex = { CELL, grid };
      return _elevIndex;
    };

    const segIntersect2D = (a, b, c, d) => {
      const r1x = b[0] - a[0], r1z = b[1] - a[1];
      const r2x = d[0] - c[0], r2z = d[1] - c[1];
      const denom = r1x * r2z - r1z * r2x;
      if (Math.abs(denom) < 1e-9) return null;
      const t = ((c[0] - a[0]) * r2z - (c[1] - a[1]) * r2x) / denom;
      const u = ((c[0] - a[0]) * r1z - (c[1] - a[1]) * r1x) / denom;
      if (t < 0 || t > 1 || u < 0 || u > 1) return null;
      return [a[0] + t * r1x, a[1] + t * r1z];
    };

    const _crossCache = new Map();
    const getRoadCrossingPoints = (road) => {
      const rk = road.id || (road.name + '_' + (road.centerline ? road.centerline.length : 0));
      if (_crossCache.has(rk)) return _crossCache.get(rk);
      const out = [];
      const isBridgeSelf = !!road.bridge || (road.layer || 0) > 0;
      if (road.centerline && road.centerline.length >= 2 && !isBridgeSelf && road.highway !== 'motorway') {
        const idx = getElevIndex();
        const cl = road.centerline;
        for (let i = 0; i < cl.length - 1; i++) {
          const a = cl[i], b = cl[i + 1];
          const c0x = Math.floor(Math.min(a[0], b[0]) / idx.CELL), c1x = Math.floor(Math.max(a[0], b[0]) / idx.CELL);
          const c0z = Math.floor(Math.min(a[1], b[1]) / idx.CELL), c1z = Math.floor(Math.max(a[1], b[1]) / idx.CELL);
          for (let cx = c0x; cx <= c1x; cx++) {
            for (let cz = c0z; cz <= c1z; cz++) {
              const segs = idx.grid.get(cx + ':' + cz);
              if (!segs) continue;
              for (let s = 0; s < segs.length; s++) {
                const sg = segs[s];
                const hit = segIntersect2D(a, b, [sg[0], sg[1]], [sg[2], sg[3]]);
                if (hit) out.push({ x: hit[0], z: hit[1], h: sg[4] });
              }
            }
          }
        }
      }
      _crossCache.set(rk, out);
      return out;
    };

    const getRoadElevationY = (road, p, idx) => {
      let y = (road.highway === 'motorway' || road.highway === 'motorway_link') ? 0.1 : 0.02;
      // 1. Cầu của chính road này (tag bridge/layer): plateau + ramp 2 đầu theo tỷ lệ điểm
      if (road.bridge || (road.layer || 0) > 0) {
        const H = Math.max(4.0, (road.layer || 1) * 5.5);
        const N = road.centerline ? road.centerline.length : 1;
        const frac = N > 1 && idx >= 0 ? idx / (N - 1) : 1;
        const ramp = Math.max(0, Math.min(1, Math.min(frac, 1 - frac) / 0.3));
        y = Math.max(y, 0.02 + (H - 0.02) * ramp);
      }
      // 2+3. Điểm cắt qua A2 (h=6, decay 130m) / sông rộng (h=3, decay 90m)
      for (const cp of getRoadCrossingPoints(road)) {
        const dd = Math.hypot(p[0] - cp.x, p[1] - cp.z);
        const prof = cp.h >= 6 ? 130 : 90;
        y = Math.max(y, cp.h * Math.max(0, Math.min(1, (prof - dd) / prof)));
      }
      return y;
    };
    const getPointY = (p, highway, road, idx) => {
      if (road && road.centerline) return getRoadElevationY(road, p, idx === undefined ? -1 : idx);
      return 0.02;
    };

    const addQuad = (buf, x0, z0, x1, z1, x2, z2, x3, z3, y) => {
      const base = buf.vertices.length / 3;
      buf.vertices.push(
        x0, y, z0,
        x1, y, z1,
        x2, y, z2,
        x3, y, z3
      );
      buf.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };

    // ── 1. DỰNG MẶT ĐƯỜNG CARRIAGEWAY TRỰC TIẾP TỪ ROADGRAPH/PBF ───────
    graphData.roads.forEach(road => {
      if (road.type === 'roundabout') {
        // Vòng xuyến Kreisverkehr
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(road.innerRadius, road.outerRadius, 36),
          this.roadMat
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(road.center[0], 0.024, road.center[1]);
        ring.receiveShadow = true;
        if (this.scenery) this.scenery.add(ring);

        const island = new THREE.Mesh(
          new THREE.CylinderGeometry(road.innerRadius - 0.1, road.innerRadius - 0.1, 0.22, 36),
          this.grassMat
        );
        island.position.set(road.center[0], 0.11, road.center[1]);
        if (this.scenery) this.scenery.add(island);

        const islandCurb = new THREE.Mesh(
          new THREE.RingGeometry(road.innerRadius - 0.2, road.innerRadius, 36),
          this.curbMat
        );
        islandCurb.rotation.x = -Math.PI / 2;
        islandCurb.position.set(road.center[0], 0.028, road.center[1]);
        if (this.scenery) this.scenery.add(islandCurb);

        const signKreis = makeGermanStVOSign('KREISVERKEHR');
        signKreis.position.set(road.center[0], 0, road.center[1] + road.outerRadius + 1.0);
        if (this.scenery) this.scenery.add(signKreis);
      } else if (road.centerline && road.centerline.length >= 2) {
        // IMPORTANT: render the actual OSM/PBF road geometry directly.
        const points = road.centerline;
        const width =
          road.width ??
          ((road.lanes || 2) * (road.laneWidth || 3.5));
        const halfW = width / 2;
        const normals = LaneGraphGenerator.computeNormals(points);

        // 1.1 Batch Mặt đường lòng đường (Carriageway) với độ cao 3D chuẩn Blender
        const roadBase = roadBuffers.vertices.length / 3;
        let accumDist = 0;
        road._elevSamples = road._elevSamples || [];
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const y = getPointY(p, road.highway, road, i);
          road._elevSamples.push([p[0], p[1], y]);
          const { nx, nz, scale } = normals[i];
          const w = halfW * scale;
          if (i > 0) accumDist += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);

          roadBuffers.vertices.push(p[0] - nx * w, y, p[1] - nz * w);
          roadBuffers.uvs.push(0, accumDist / 8);

          roadBuffers.vertices.push(p[0] + nx * w, y, p[1] + nz * w);
          roadBuffers.uvs.push(1, accumDist / 8);

          if (i < points.length - 1) {
            const b = roadBase + i * 2;
            roadBuffers.indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
          }
        }

        // 1.2 Hộ lan thép đôi W-Beam StVO & Dải phân cách bê tông Jersey Barrier & Reflektorpfosten
        if (road.hasCenterGuardrail || ['motorway', 'trunk', 'motorway_link'].includes(road.highway)) {
          const isMotorway = ['motorway', 'trunk', 'motorway_link'].includes(road.highway);
          const isOneway = !!road.oneway;
          const railOffsets = [];

          // Chỉ đường 2 chiều không có dải phân cách cứng mới đâm hộ lan ở tim đường [-0.4, 0.4]
          if (road.hasCenterGuardrail || (isMotorway && !isOneway)) {
            railOffsets.push(-0.4, 0.4);
          }

          // Hộ lan lề đường: Với đường 1 chiều oneway, chỉ đặt ở lề phải (halfW + 0.5m) tránh đâm xuyên dải phân cách giữa
          if (isMotorway) {
            const sideOffset = halfW + 0.5;
            if (isOneway) {
              railOffsets.push(sideOffset);
            } else {
              railOffsets.push(-sideOffset, sideOffset);
            }
          }

          // 🚧 Concrete Jersey Median Barrier cho Autobahn 1 chiều (giữa 2 carriageway)
          if (isMotorway && isOneway && road.highway === 'motorway') {
            const medianOffset = - (halfW + 0.6);
            for (let i = 0; i < points.length - 1; i++) {
              const p1 = points[i];
              const p2 = points[i + 1];
              const y1 = getPointY(p1, road.highway, road, i);
              const y2 = getPointY(p2, road.highway, road, i + 1);
              const n1 = normals[i];
              const n2 = normals[i + 1];

              const mx1 = p1[0] + n1.nx * medianOffset;
              const mz1 = p1[1] + n1.nz * medianOffset;
              const mx2 = p2[0] + n2.nx * medianOffset;
              const mz2 = p2[1] + n2.nz * medianOffset;

              const base = medianBuffers.vertices.length / 3;
              const mh = 0.8; // Jersey Barrier Height = 0.8m
              medianBuffers.vertices.push(
                mx1, y1,        mz1,
                mx2, y2,        mz2,
                mx2, y2 + mh,  mz2,
                mx1, y1 + mh,  mz1
              );
              medianBuffers.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
            }
          }

          // Dải W-Beam kim loại
          for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const y1 = getPointY(p1, road.highway, road, i);
            const y2 = getPointY(p2, road.highway, road, i + 1);
            const dx = p2[0] - p1[0];
            const dz = p2[1] - p1[1];
            const dist = Math.hypot(dx, dz);
            if (dist < 0.5) continue;
            const ux = dx / dist;
            const uz = dz / dist;
            const nx = -uz;
            const nz = ux;

            railOffsets.forEach(off => {
              const cx1 = p1[0] + nx * off;
              const cz1 = p1[1] + nz * off;
              const cx2 = p2[0] + nx * off;
              const cz2 = p2[1] + nz * off;

              const base = guardrailBuffers.vertices.length / 3;
              guardrailBuffers.vertices.push(
                cx1, y1 + 0.48, cz1,
                cx2, y2 + 0.48, cz2,
                cx2, y2 + 0.82, cz2,
                cx1, y1 + 0.82, cz1
              );
              guardrailBuffers.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
            });
          }

          // Trụ I-Beam (Pfosten) đỡ hộ lan mỗi 6m
          let postDistAcc = 0;
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const py = getPointY(p, road.highway, road, i);
            const { nx, nz } = normals[i];

            if (i === 0 || postDistAcc >= 6.0) {
              postDistAcc = 0;
              railOffsets.forEach(off => {
                const px = p[0] + nx * off;
                const pz = p[1] + nz * off;

                const base = guardrailPostBuffers.vertices.length / 3;
                const pw = 0.08;
                const ph = 0.75;
                guardrailPostBuffers.vertices.push(
                  px - pw, py, pz - pw,
                  px + pw, py, pz + pw,
                  px + pw, py + ph, pz + pw,
                  px - pw, py + ph, pz - pw
                );
                guardrailPostBuffers.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
              });
            }

            if (i < points.length - 1) {
              postDistAcc += Math.hypot(points[i + 1][0] - p[0], points[i + 1][1] - p[1]);
            }
          }

          // Cọc tiêu Reflektorpfosten (Zeichen 620 StVO) hai bên lề cao tốc mỗi 40m
          if (isMotorway) {
            let reflDistAcc = 0;
            for (let i = 0; i < points.length; i++) {
              const p = points[i];
              const ry = getPointY(p, road.highway, road, i);
              const { nx, nz } = normals[i];

              if (i === 0 || reflDistAcc >= 40.0) {
                reflDistAcc = 0;

                [-1, 1].forEach(side => {
                  const off = (halfW + 0.6) * side;
                  const rx = p[0] + nx * off;
                  const rz = p[1] + nz * off;

                  // Thân cọc màu trắng
                  const basePost = reflektorPostBuffers.vertices.length / 3;
                  const rw = 0.06;
                  reflektorPostBuffers.vertices.push(
                    rx - rw, ry,        rz - rw,
                    rx + rw, ry,        rz + rw,
                    rx + rw, ry + 1.05, rz + rw,
                    rx - rw, ry + 1.05, rz - rw
                  );
                  reflektorPostBuffers.indices.push(basePost, basePost + 1, basePost + 2, basePost, basePost + 2, basePost + 3);

                  // Cap đen ở đỉnh
                  const baseCap = reflektorCapBuffers.vertices.length / 3;
                  reflektorCapBuffers.vertices.push(
                    rx - rw - 0.005, ry + 0.85, rz - rw - 0.005,
                    rx + rw + 0.005, ry + 0.85, rz + rw + 0.005,
                    rx + rw + 0.005, ry + 1.06, rz + rw + 0.005,
                    rx - rw - 0.005, ry + 1.06, rz - rw - 0.005
                  );
                  reflektorCapBuffers.indices.push(baseCap, baseCap + 1, baseCap + 2, baseCap, baseCap + 2, baseCap + 3);

                  // Phản quang (Right = Red, Left = White)
                  const isRight = side > 0;
                  const targetReflBuf = isRight ? reflektorRedBuffers : reflektorWhiteBuffers;
                  const baseRefl = targetReflBuf.vertices.length / 3;
                  targetReflBuf.vertices.push(
                    rx - rw - 0.008, ry + 0.88, rz - rw - 0.008,
                    rx + rw + 0.008, ry + 0.88, rz + rw + 0.008,
                    rx + rw + 0.008, ry + 0.98, rz + rw + 0.008,
                    rx - rw - 0.008, ry + 0.98, rz - rw - 0.008
                  );
                  targetReflBuf.indices.push(baseRefl, baseRefl + 1, baseRefl + 2, baseRefl, baseRefl + 2, baseRefl + 3);
                });
              }

              if (i < points.length - 1) {
                reflDistAcc += Math.hypot(points[i + 1][0] - p[0], points[i + 1][1] - p[1]);
              }
            }
          }
        }
      }
    });

    // ── 2. DỰNG BÓ VỈA 3D (3D GRANITE CURBS) & VỈA HÈ NÂNG CAO ────────
    for (const curb of this.laneGraph.curbs) {
      const inPts = curb.innerPoints;
      const topPts = curb.topOuterPoints;
      const swPts = curb.swOuterPoints;
      const n = inPts.length;
      if (n < 2) continue;

      const curbBase = curbBuffers.vertices.length / 3;
      const swBase = sidewalkBuffers.vertices.length / 3;
      let accumSw = 0;

      for (let i = 0; i < n; i++) {
        if (i > 0) accumSw += Math.hypot(inPts[i][0] - inPts[i - 1][0], inPts[i][1] - inPts[i - 1][1]);

        curbBuffers.vertices.push(
          inPts[i][0], 0.02, inPts[i][1],
          inPts[i][0], 0.14, inPts[i][1],
          topPts[i][0], 0.14, topPts[i][1]
        );

        if (curb.side > 0) {
          sidewalkBuffers.vertices.push(topPts[i][0], 0.14, topPts[i][1], swPts[i][0], 0.14, swPts[i][1]);
        } else {
          sidewalkBuffers.vertices.push(swPts[i][0], 0.14, swPts[i][1], topPts[i][0], 0.14, topPts[i][1]);
        }
        sidewalkBuffers.uvs.push(0, accumSw / 4, 1, accumSw / 4);

        if (i < n - 1) {
          const cb = curbBase + i * 3;
          curbBuffers.indices.push(cb, cb + 1, cb + 3, cb + 1, cb + 4, cb + 3);
          curbBuffers.indices.push(cb + 1, cb + 2, cb + 4, cb + 2, cb + 5, cb + 4);

          const sb = swBase + i * 2;
          sidewalkBuffers.indices.push(sb, sb + 1, sb + 2, sb + 1, sb + 3, sb + 2);
        }
      }
    }

    // ── 3. DỰNG VẠCH KẺ StVO (DIVIDERS, EDGE LINES, STOP LINES, ZEBRAS) ──
    for (const div of this.laneGraph.dividers) {
      const pts = div.points;
      if (!pts || pts.length < 2) continue;
      const normals = LaneGraphGenerator.computeNormals(pts);
      const halfLw = (div.width || 0.15) / 2;

      if (div.type === 'SOLID') {
        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const n1 = normals[i];
          const n2 = normals[i + 1];

          addQuad(
            whiteLineBuffers,
            p1[0] - n1.nx * halfLw, p1[1] - n1.nz * halfLw,
            p1[0] + n1.nx * halfLw, p1[1] + n1.nz * halfLw,
            p2[0] + n2.nx * halfLw, p2[1] + n2.nz * halfLw,
            p2[0] - n2.nx * halfLw, p2[1] - n2.nz * halfLw,
            0.024
          );
        }
      } else if (div.type === 'DASHED') {
        const dashLen = div.dashLen || 3.0;
        const gapLen = div.gapLen || 3.0;
        const cycle = dashLen + gapLen;

        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const dx = p2[0] - p1[0];
          const dz = p2[1] - p1[1];
          const dist = Math.hypot(dx, dz);
          if (dist < dashLen) continue;

          const ux = dx / dist;
          const uz = dz / dist;
          const nx = -uz;
          const nz = ux;
          const numDashes = Math.floor(dist / cycle);

          for (let d = 0; d < numDashes; d++) {
            const t = (d * cycle + dashLen / 2) / dist;
            const cx = p1[0] + dx * t;
            const cz = p1[1] + dz * t;
            const hl = dashLen / 2;

            addQuad(
              whiteLineBuffers,
              cx - nx * halfLw - ux * hl, cz - nz * halfLw - uz * hl,
              cx + nx * halfLw - ux * hl, cz + nz * halfLw - uz * hl,
              cx + nx * halfLw + ux * hl, cz + nz * halfLw + uz * hl,
              cx - nx * halfLw + ux * hl, cz - nz * halfLw + uz * hl,
              0.025
            );
          }
        }
      }
    }

    for (const sl of this.laneGraph.stopLines) {
      const p1 = sl.p1;
      const p2 = sl.p2;
      const dx = p2[0] - p1[0];
      const dz = p2[1] - p1[1];
      const dist = Math.hypot(dx, dz);
      if (dist < 1.0) continue;

      const ux = dx / dist;
      const uz = dz / dist;
      const px = -uz;
      const pz = ux;
      const hw = (sl.width || 0.45) / 2;

      addQuad(
        whiteLineBuffers,
        p1[0] - px * hw, p1[1] - pz * hw,
        p1[0] + px * hw, p1[1] + pz * hw,
        p2[0] + px * hw, p2[1] + pz * hw,
        p2[0] - px * hw, p2[1] - pz * hw,
        0.026
      );
    }

    const crosswalkList = (this.laneGraph && this.laneGraph.crosswalks) || [];
    for (const cw of crosswalkList) {
      if (!cw.p1 || !cw.p2) continue;
      const dx = cw.p2[0] - cw.p1[0];
      const dz = cw.p2[1] - cw.p1[1];
      const dist = Math.hypot(dx, dz);
      if (dist < 2.5) continue;

      const ux = dx / dist;
      const uz = dz / dist;
      const px = -uz;
      const pz = ux;

      const stripeWidth = 0.45;
      const gap = 0.45;
      const stripeLength = 3.2;
      const cycle = stripeWidth + gap;
      const count = Math.floor(dist / cycle);
      const offset = (dist - (count * cycle - gap)) / 2;
      const hw = stripeWidth / 2;
      const hl = stripeLength / 2;

      for (let k = 0; k < count; k++) {
        const d = offset + k * cycle + hw;
        const cx = cw.p1[0] + ux * d;
        const cz = cw.p1[1] + uz * d;

        addQuad(
          whiteLineBuffers,
          cx - ux * hw - px * hl, cz - uz * hw - pz * hl,
          cx + ux * hw - px * hl, cz + uz * hw - pz * hl,
          cx + ux * hw + px * hl, cz + uz * hw + pz * hl,
          cx - ux * hw + px * hl, cz - uz * hw + pz * hl,
          0.028
        );
      }
    }

    // ── 4. DỰNG MẶT ĐƯỜNG GIAO LỘ ĐA GIÁC (POLYGONAL JUNCTIONS) ───────
    for (const jp of this.laneGraph.junctionPolygons) {
      const pts = jp.polygon;
      if (!pts || pts.length < 3) continue;

      const { vertices, indices, uvs } = JunctionGeometryBuilder.triangulateJunctionPolygon(pts, 0.015);
      if (indices.length === 0) continue;

      const base = roadBuffers.vertices.length / 3;
      roadBuffers.vertices.push(...vertices);
      roadBuffers.uvs.push(...uvs);
      for (let t = 0; t < indices.length; t++) {
        roadBuffers.indices.push(base + indices[t]);
      }
    }

    // ── 5. CỘT ĐÈN TÍN HIỆU GIAO THÔNG TẠI CÁC VẠCH DỪNG HALTELINIE ──────
    this.trafficLightMeshes = [];
    const placedPositions = [];
    const minSeparationSq = 4.0 * 4.0;

    if (this.laneGraph && this.laneGraph.stopLines) {
      this.laneGraph.stopLines.forEach(sl => {
        if (!sl.hasTrafficLight || !sl.trafficLight) return;
        const [posX, posY, posZ] = sl.trafficLight.position;
        const rotY = sl.trafficLight.rotation;

        const isDuplicate = placedPositions.some(p => {
          const dx = p[0] - posX;
          const dz = p[1] - posZ;
          return (dx * dx + dz * dz) < minSeparationSq;
        });
        if (isDuplicate) return;

        let isInsideCarriageway = false;
        if (this.laneGraph && this.laneGraph.roads) {
          for (const road of this.laneGraph.roads) {
            if (!road.centerline || road.centerline.length < 2) continue;
            const rHalfW = (road.width ?? ((road.lanes || 2) * (road.laneWidth || 3.5))) / 2;
            const pts = road.centerline;
            for (let k = 0; k < pts.length - 1; k++) {
              const p1 = pts[k], p2 = pts[k + 1];
              const dx = p2[0] - p1[0], dz = p2[1] - p1[1];
              const lenSq = dx * dx + dz * dz;
              if (lenSq === 0) continue;
              let t = ((posX - p1[0]) * dx + (posZ - p1[1]) * dz) / lenSq;
              t = Math.max(0, Math.min(1, t));
              const projX = p1[0] + t * dx, projZ = p1[1] + t * dz;
              if (Math.hypot(posX - projX, posZ - projZ) < rHalfW - 0.2) {
                isInsideCarriageway = true;
                break;
              }
            }
            if (isInsideCarriageway) break;
          }
        }
        if (isInsideCarriageway) return;

        placedPositions.push([posX, posZ]);
        const tl = makeTrafficLight(false);
        tl.position.set(posX, 0, posZ);
        tl.rotation.y = rotY;
        if (this.scenery) this.scenery.add(tl);
        this.trafficLightMeshes.push(tl);
      });
    }

    // ── 6. DỰNG SÔNG & KÊNH ĐÀO OSM PBF (WATERWAYS: SPREE, LANDWEHRKANAL) ──
    if (Array.isArray(graphData.waterways)) {
      graphData.waterways.forEach(w => {
        if (!w.points || w.points.length < 2) return;
        if (w.isClosed && w.points.length >= 3) {
          const { vertices, indices, uvs } = JunctionGeometryBuilder.triangulateJunctionPolygon(w.points, 0.005);
          if (indices.length > 0) {
            const base = waterBuffers.vertices.length / 3;
            waterBuffers.vertices.push(...vertices);
            waterBuffers.uvs.push(...uvs);
            for (let t = 0; t < indices.length; t++) {
              waterBuffers.indices.push(base + indices[t]);
            }
          }
        } else if (!w.isClosed) {
          const points = w.points;
          const width = w.width || 18.0;
          const halfW = width / 2;
          const shoreW = 1.5;
          const normals = LaneGraphGenerator.computeNormals(points);
          
          const waterBase = waterBuffers.vertices.length / 3;
          const shoreBase = shoreBuffers.vertices.length / 3;
          let accumDist = 0;

          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const { nx, nz, scale } = normals[i];
            const wDist = halfW * scale;
            const sDist = (halfW + shoreW) * scale;
            if (i > 0) accumDist += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);

            waterBuffers.vertices.push(p[0] - nx * wDist, 0.005, p[1] - nz * wDist);
            waterBuffers.uvs.push(0, accumDist / 12);
            waterBuffers.vertices.push(p[0] + nx * wDist, 0.005, p[1] + nz * wDist);
            waterBuffers.uvs.push(1, accumDist / 12);

            shoreBuffers.vertices.push(
              p[0] - nx * sDist, 0.012, p[1] - nz * sDist,
              p[0] - nx * wDist, 0.012, p[1] - nz * wDist,
              p[0] + nx * wDist, 0.012, p[1] + nz * wDist,
              p[0] + nx * sDist, 0.012, p[1] + nz * sDist
            );

            if (i < points.length - 1) {
              const wb = waterBase + i * 2;
              waterBuffers.indices.push(wb, wb + 1, wb + 2, wb + 1, wb + 3, wb + 2);

              const sb = shoreBase + i * 4;
              shoreBuffers.indices.push(sb, sb + 1, sb + 4, sb + 1, sb + 5, sb + 4);
              shoreBuffers.indices.push(sb + 2, sb + 3, sb + 6, sb + 3, sb + 7, sb + 6);
            }
          }
        }
      });
    }

    // ── 7. DỰNG MẠNG LƯỚI TÀU ĐIỆN OSM PBF (RAILWAYS: S-BAHN, TRAM) ──────
    if (Array.isArray(graphData.railways)) {
      graphData.railways.forEach(r => {
        if (!r.points || r.points.length < 2) return;
        const points = r.points;
        const isTram = r.railway === 'tram';
        const bedWidth = isTram ? 2.6 : 4.5;
        const halfBed = bedWidth / 2;
        const railOffset = isTram ? 0.5 : 0.75;
        const railWidth = 0.12;
        const halfRail = railWidth / 2;
        const normals = LaneGraphGenerator.computeNormals(points);

        const bedBase = railBedBuffers.vertices.length / 3;
        let accumDist = 0;

        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const { nx, nz, scale } = normals[i];
          const bw = halfBed * scale;
          if (i > 0) accumDist += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);

          railBedBuffers.vertices.push(p[0] - nx * bw, 0.021, p[1] - nz * bw);
          railBedBuffers.uvs.push(0, accumDist / 6);
          railBedBuffers.vertices.push(p[0] + nx * bw, 0.021, p[1] + nz * bw);
          railBedBuffers.uvs.push(1, accumDist / 6);

          if (i < points.length - 1) {
            const bb = bedBase + i * 2;
            railBedBuffers.indices.push(bb, bb + 1, bb + 2, bb + 1, bb + 3, bb + 2);
          }
        }

        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const n1 = normals[i];
          const n2 = normals[i + 1];

          [-railOffset, railOffset].forEach(off => {
            const r1x = p1[0] + n1.nx * off * n1.scale;
            const r1z = p1[1] + n1.nz * off * n1.scale;
            const r2x = p2[0] + n2.nx * off * n2.scale;
            const r2z = p2[1] + n2.nz * off * n2.scale;

            const base = steelRailBuffers.vertices.length / 3;
            steelRailBuffers.vertices.push(
              r1x - n1.nx * halfRail, 0.038, r1z - n1.nz * halfRail,
              r1x + n1.nx * halfRail, 0.038, r1z + n1.nz * halfRail,
              r2x + n2.nx * halfRail, 0.038, r2z + n2.nz * halfRail,
              r2x - n2.nx * halfRail, 0.038, r2z - n2.nz * halfRail
            );
            steelRailBuffers.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
          });
        }
      });
    }

    // ── 8. DỰNG CÔNG VIÊN & KHU XANH OSM PBF (PARKS: TIERGARTEN, PLAZAS) ──
    if (Array.isArray(graphData.parks)) {
      graphData.parks.forEach(park => {
        if (!park.points || park.points.length < 3) return;
        const { vertices, indices, uvs } = JunctionGeometryBuilder.triangulateJunctionPolygon(park.points, 0.003);
        if (indices.length > 0) {
          const base = parkBuffers.vertices.length / 3;
          parkBuffers.vertices.push(...vertices);
          parkBuffers.uvs.push(...uvs);
          for (let t = 0; t < indices.length; t++) {
            parkBuffers.indices.push(base + indices[t]);
          }
        }
      });
    }

    // ── 9. DỰNG KHỐI TÒA NHÀ & ĐỊA ĐIỂM NỔI BẬT OSM PBF (LANDMARKS & BUILDINGS) ──
    if (Array.isArray(graphData.landmarks)) {
      graphData.landmarks.forEach(lm => {
        if (lm.points && lm.points.length >= 3) {
          const pts = lm.points;
          const height = lm.height || (lm.category === 'station' ? 14 : 22);
          
          const { vertices, indices } = JunctionGeometryBuilder.triangulateJunctionPolygon(pts, height);
          if (indices.length > 0) {
            const rBase = roofBuffers.vertices.length / 3;
            roofBuffers.vertices.push(...vertices);
            for (let t = 0; t < indices.length; t++) {
              roofBuffers.indices.push(rBase + indices[t]);
            }
          }

          for (let i = 0; i < pts.length; i++) {
            const p1 = pts[i];
            const p2 = pts[(i + 1) % pts.length];

            const bBase = buildingBuffers.vertices.length / 3;
            buildingBuffers.vertices.push(
              p1[0], 0, p1[1],
              p2[0], 0, p2[1],
              p2[0], height, p2[1],
              p1[0], height, p1[1]
            );
            // UV theo mét thực: u dọc theo chiều dài tường, v theo tầng (3m/tầng)
            const wallLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
            buildingBuffers.uvs.push(
              0, 0,
              wallLen / FACADE_TILE_W, 0,
              wallLen / FACADE_TILE_W, height / FACADE_TILE_H,
              0, height / FACADE_TILE_H
            );
            buildingBuffers.indices.push(
              bBase, bBase + 1, bBase + 2,
              bBase, bBase + 2, bBase + 3
            );
          }
        } else if (Number.isFinite(lm.x) && Number.isFinite(lm.z)) {
          const h = 18;
          const w = 3.5;
          const bBase = buildingBuffers.vertices.length / 3;
          buildingBuffers.vertices.push(
            lm.x - w, 0, lm.z - w,
            lm.x + w, 0, lm.z - w,
            lm.x + w, h, lm.z - w,
            lm.x - w, h, lm.z - w,

            lm.x + w, 0, lm.z - w,
            lm.x + w, 0, lm.z + w,
            lm.x + w, h, lm.z + w,
            lm.x + w, h, lm.z - w,

            lm.x + w, 0, lm.z + w,
            lm.x - w, 0, lm.z + w,
            lm.x - w, h, lm.z + w,
            lm.x + w, h, lm.z + w,

            lm.x - w, 0, lm.z + w,
            lm.x - w, 0, lm.z - w,
            lm.x - w, h, lm.z - w,
            lm.x - w, h, lm.z + w
          );
          for (let q = 0; q < 4; q++) {
            const base = bBase + q * 4;
            buildingBuffers.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
          }
          // UV 4 mặt hộp theo mét thực (mỗi mặt rộng 2w, cao h)
          for (let q = 0; q < 4; q++) {
            buildingBuffers.uvs.push(
              0, 0,
              (w * 2) / FACADE_TILE_W, 0,
              (w * 2) / FACADE_TILE_W, h / FACADE_TILE_H,
              0, h / FACADE_TILE_H
            );
          }
        }
      });
    }

    if (this.scenery) {
      this.scenery.userData.trafficLightMeshes = this.trafficLightMeshes;
      this.scenery.userData.roadGraphSource = graphData?.metadata?.source || 'RoadGraph';
      this.scenery.userData.roadGeometryMode = 'DIRECT_PBF_CENTERLINE';
    }

    // ── 10. TẠO MERGED BATCHED MESHES TỐI ƯU HÓA 60 FPS ────────────
    // 10.1 Lòng đường + Giao lộ
    if (roadBuffers.vertices.length > 0) {
      const roadGeo = new THREE.BufferGeometry();
      roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadBuffers.vertices, 3));
      roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadBuffers.uvs, 2));
      roadGeo.setIndex(roadBuffers.indices);
      roadGeo.computeVertexNormals();
      const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
      roadMesh.name = 'PBF_RoadSurface';
      roadMesh.userData.source = 'road_graph.json';
      roadMesh.userData.geometrySource = 'OSM_PBF_CENTERLINES';
      roadMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(roadMesh);

      // 🌉 ELEVATION SAMPLER: grid 25m chứa sample cao độ của MỌI mặt đường
      // (xe AI + người chơi đọc y theo vị trí → chạy TRÊN mặt cầu thật sự).
      // getElevationAt(x, z, currentY): ưu tiên sample có y LIÊN TỤC với currentY —
      // khi xe chạy dưới cầu (A2 y=0.1) sample cầu 5.5m bị phạt khoảng cách y → không teleport lên.
      this._elevCell = 25;
      this._elevGrid = new Map();
      graphData.roads.forEach(road => {
        const samples = road._elevSamples || [];
        for (const s of samples) {
          const k = Math.floor(s[0] / this._elevCell) + '_' + Math.floor(s[1] / this._elevCell);
          if (!this._elevGrid.has(k)) this._elevGrid.set(k, []);
          this._elevGrid.get(k).push(s);
        }
      });
      // 🌉 Sampler public: xe người chơi & bot AI gọi mỗi frame (O(các cell lân cận))
      this.getElevationAt = (x, z, currentY = null) => {
        const ECELL = this._elevCell || 25;
        const cx = Math.floor(x / ECELL), cz = Math.floor(z / ECELL);
        let best = null, bestScore = Infinity;
        for (let ddx = -1; ddx <= 1; ddx++) {
          for (let ddz = -1; ddz <= 1; ddz++) {
            const arr = this._elevGrid ? this._elevGrid.get((cx + ddx) + '_' + (cz + ddz)) : null;
            if (!arr) continue;
            for (const s of arr) {
              const d = Math.hypot(s[0] - x, s[1] - z);
              if (d > ECELL * 1.6) continue;
              const score = currentY !== null ? Math.abs(s[2] - currentY) * 2.5 + d : d;
              if (score < bestScore) { bestScore = score; best = s; }
            }
          }
        }
        return best ? best[2] : 0;
      };
    }

    // 10.2 Bó vỉa 3D
    if (curbBuffers.vertices.length > 0) {
      const curbGeo = new THREE.BufferGeometry();
      curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbBuffers.vertices, 3));
      curbGeo.setIndex(curbBuffers.indices);
      curbGeo.computeVertexNormals();
      const curbMesh = new THREE.Mesh(curbGeo, this.curbMat);
      curbMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(curbMesh);
    }

    // 10.3 Vỉa hè nâng cao
    if (sidewalkBuffers.vertices.length > 0) {
      const swGeo = new THREE.BufferGeometry();
      swGeo.setAttribute('position', new THREE.Float32BufferAttribute(sidewalkBuffers.vertices, 3));
      swGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sidewalkBuffers.uvs, 2));
      swGeo.setIndex(sidewalkBuffers.indices);
      swGeo.computeVertexNormals();
      const swMesh = new THREE.Mesh(swGeo, this.swMat);
      swMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(swMesh);
    }

    // 10.4 Toàn bộ vạch kẻ StVO (Trắng)
    if (whiteLineBuffers.vertices.length > 0) {
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(whiteLineBuffers.vertices, 3));
      lineGeo.setIndex(whiteLineBuffers.indices);
      lineGeo.computeVertexNormals();
      const lineMesh = new THREE.Mesh(lineGeo, this.whiteLineMat);
      if (this.scenery) this.scenery.add(lineMesh);
    }

    // 10.5 Hộ lan thép cao tốc & Trụ I-beam & Cọc tiêu Reflektorpfosten StVO 620
    if (guardrailBuffers.vertices.length > 0) {
      const railGeo = new THREE.BufferGeometry();
      railGeo.setAttribute('position', new THREE.Float32BufferAttribute(guardrailBuffers.vertices, 3));
      railGeo.setIndex(guardrailBuffers.indices);
      railGeo.computeVertexNormals();
      const railMesh = new THREE.Mesh(railGeo, this.guardrailMat);
      if (this.scenery) this.scenery.add(railMesh);
    }

    if (guardrailPostBuffers.vertices.length > 0) {
      const postGeo = new THREE.BufferGeometry();
      postGeo.setAttribute('position', new THREE.Float32BufferAttribute(guardrailPostBuffers.vertices, 3));
      postGeo.setIndex(guardrailPostBuffers.indices);
      postGeo.computeVertexNormals();
      const postMesh = new THREE.Mesh(postGeo, this.guardrailPostMat);
      if (this.scenery) this.scenery.add(postMesh);
    }

    if (medianBuffers.vertices.length > 0) {
      const medGeo = new THREE.BufferGeometry();
      medGeo.setAttribute('position', new THREE.Float32BufferAttribute(medianBuffers.vertices, 3));
      medGeo.setIndex(medianBuffers.indices);
      medGeo.computeVertexNormals();
      const medMesh = new THREE.Mesh(medGeo, this.medianMat);
      medMesh.name = 'PBF_ConcreteJerseyMedian';
      if (this.scenery) this.scenery.add(medMesh);
    }

    if (reflektorPostBuffers.vertices.length > 0) {
      const refPostGeo = new THREE.BufferGeometry();
      refPostGeo.setAttribute('position', new THREE.Float32BufferAttribute(reflektorPostBuffers.vertices, 3));
      refPostGeo.setIndex(reflektorPostBuffers.indices);
      refPostGeo.computeVertexNormals();
      const refPostMesh = new THREE.Mesh(refPostGeo, this.reflektorPostMat);
      if (this.scenery) this.scenery.add(refPostMesh);
    }

    if (reflektorCapBuffers.vertices.length > 0) {
      const capGeo = new THREE.BufferGeometry();
      capGeo.setAttribute('position', new THREE.Float32BufferAttribute(reflektorCapBuffers.vertices, 3));
      capGeo.setIndex(reflektorCapBuffers.indices);
      capGeo.computeVertexNormals();
      const capMesh = new THREE.Mesh(capGeo, this.reflektorCapMat);
      if (this.scenery) this.scenery.add(capMesh);
    }

    if (reflektorRedBuffers.vertices.length > 0) {
      const redGeo = new THREE.BufferGeometry();
      redGeo.setAttribute('position', new THREE.Float32BufferAttribute(reflektorRedBuffers.vertices, 3));
      redGeo.setIndex(reflektorRedBuffers.indices);
      redGeo.computeVertexNormals();
      const redMesh = new THREE.Mesh(redGeo, this.reflektorRedMat);
      if (this.scenery) this.scenery.add(redMesh);
    }

    if (reflektorWhiteBuffers.vertices.length > 0) {
      const whiteGeo = new THREE.BufferGeometry();
      whiteGeo.setAttribute('position', new THREE.Float32BufferAttribute(reflektorWhiteBuffers.vertices, 3));
      whiteGeo.setIndex(reflektorWhiteBuffers.indices);
      whiteGeo.computeVertexNormals();
      const whiteMesh = new THREE.Mesh(whiteGeo, this.reflektorWhiteMat);
      if (this.scenery) this.scenery.add(whiteMesh);
    }

    // 10.6 Mặt nước Sông / Kênh đào (Spree, Landwehrkanal)
    if (waterBuffers.vertices.length > 0) {
      const waterGeo = new THREE.BufferGeometry();
      waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterBuffers.vertices, 3));
      waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(waterBuffers.uvs, 2));
      waterGeo.setIndex(waterBuffers.indices);
      waterGeo.computeVertexNormals();
      const waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
      waterMesh.name = 'PBF_WaterwaysSurface';
      waterMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(waterMesh);
    }

    // 10.7 Kè sông / Bờ kè đá
    if (shoreBuffers.vertices.length > 0) {
      const shoreGeo = new THREE.BufferGeometry();
      shoreGeo.setAttribute('position', new THREE.Float32BufferAttribute(shoreBuffers.vertices, 3));
      shoreGeo.setIndex(shoreBuffers.indices);
      shoreGeo.computeVertexNormals();
      const shoreMesh = new THREE.Mesh(shoreGeo, this.shorelineMat);
      shoreMesh.name = 'PBF_WaterEmbankment';
      shoreMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(shoreMesh);
    }

    // 10.8 Nền đường sắt / Tàu điện
    if (railBedBuffers.vertices.length > 0) {
      const bedGeo = new THREE.BufferGeometry();
      bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(railBedBuffers.vertices, 3));
      bedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(railBedBuffers.uvs, 2));
      bedGeo.setIndex(railBedBuffers.indices);
      bedGeo.computeVertexNormals();
      const bedMesh = new THREE.Mesh(bedGeo, this.railBedMat);
      bedMesh.name = 'PBF_RailwayTrackbed';
      bedMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(bedMesh);
    }

    // 10.9 Thanh ray thép song song
    if (steelRailBuffers.vertices.length > 0) {
      const railGeo = new THREE.BufferGeometry();
      railGeo.setAttribute('position', new THREE.Float32BufferAttribute(steelRailBuffers.vertices, 3));
      railGeo.setIndex(steelRailBuffers.indices);
      railGeo.computeVertexNormals();
      const railMesh = new THREE.Mesh(railGeo, this.steelRailMat);
      railMesh.name = 'PBF_SteelRails';
      if (this.scenery) this.scenery.add(railMesh);
    }

    // 10.10 Thảm cỏ Công viên (Tiergarten, Green zones)
    if (parkBuffers.vertices.length > 0) {
      const parkGeo = new THREE.BufferGeometry();
      parkGeo.setAttribute('position', new THREE.Float32BufferAttribute(parkBuffers.vertices, 3));
      parkGeo.setAttribute('uv', new THREE.Float32BufferAttribute(parkBuffers.uvs, 2));
      parkGeo.setIndex(parkBuffers.indices);
      parkGeo.computeVertexNormals();
      const parkMesh = new THREE.Mesh(parkGeo, this.grassMat);
      parkMesh.name = 'PBF_ParksAndGreenery';
      parkMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(parkMesh);
    }

    // 10.11 Tường khối tòa nhà đô thị 3D
    if (buildingBuffers.vertices.length > 0) {
      const buildGeo = new THREE.BufferGeometry();
      buildGeo.setAttribute('position', new THREE.Float32BufferAttribute(buildingBuffers.vertices, 3));
      if (buildingBuffers.uvs.length === buildingBuffers.vertices.length / 3 * 2) {
        buildGeo.setAttribute('uv', new THREE.Float32BufferAttribute(buildingBuffers.uvs, 2));
      }
      buildGeo.setIndex(buildingBuffers.indices);
      buildGeo.computeVertexNormals();
      const buildMesh = new THREE.Mesh(buildGeo, this.buildingMat);
      buildMesh.name = 'PBF_BuildingWalls';
      buildMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(buildMesh);
    }

    // 10.12 Mái tòa nhà 3D
    if (roofBuffers.vertices.length > 0) {
      const roofGeo = new THREE.BufferGeometry();
      roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(roofBuffers.vertices, 3));
      roofGeo.setIndex(roofBuffers.indices);
      roofGeo.computeVertexNormals();
      const roofMesh = new THREE.Mesh(roofGeo, this.roofMat);
      roofMesh.name = 'PBF_BuildingRoofs';
      roofMesh.receiveShadow = true;
      if (this.scenery) this.scenery.add(roofMesh);
    }

    // Tạo visualizer cho chế độ Debug
    this._createDebugVisualizer();
  }

  /**
   * Khởi tạo nhóm đối tượng Debug Visualization (đường bao mép đường, tim làn, đa giác ngã tư)
   */
  _createDebugVisualizer() {
    if (!this.laneGraph || !this.scenery) return;

    this.debugGroup = new THREE.Group();
    this.debugGroup.name = 'RoadDebugGroup';
    this.debugGroup.visible = false; // Mặc định ẩn

    // 1. Tim làn đường (Cyan 0x06b6d4)
    const laneLinePositions = [];
    for (const lane of this.laneGraph.lanes) {
      const pts = lane.centerline;
      for (let i = 0; i < pts.length - 1; i++) {
        laneLinePositions.push(pts[i][0], 0.25, pts[i][1], pts[i + 1][0], 0.25, pts[i + 1][1]);
      }
    }
    if (laneLinePositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(laneLinePositions, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0x06b6d4 });
      this.debugGroup.add(new THREE.LineSegments(geo, mat));
    }

    // 2. Mép bó vỉa đường (Amber 0xf59e0b)
    const curbLinePositions = [];
    for (const curb of this.laneGraph.curbs) {
      const pts = curb.innerPoints;
      for (let i = 0; i < pts.length - 1; i++) {
        curbLinePositions.push(pts[i][0], 0.22, pts[i][1], pts[i + 1][0], 0.22, pts[i + 1][1]);
      }
    }
    if (curbLinePositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(curbLinePositions, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
      this.debugGroup.add(new THREE.LineSegments(geo, mat));
    }

    // 3. Chu vi đa giác nút giao (Pink 0xec4899)
    const junctionLinePositions = [];
    for (const jp of this.laneGraph.junctionPolygons) {
      const pts = jp.polygon;
      if (!pts || pts.length < 3) continue;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        junctionLinePositions.push(p1[0], 0.28, p1[1], p2[0], 0.28, p2[1]);
      }
    }
    if (junctionLinePositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(junctionLinePositions, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0xec4899 });
      this.debugGroup.add(new THREE.LineSegments(geo, mat));
    }

    // 4. Vạch dừng ngã tư (Red 0xef4444)
    const stopLinePositions = [];
    for (const sl of this.laneGraph.stopLines) {
      stopLinePositions.push(sl.p1[0], 0.30, sl.p1[1], sl.p2[0], 0.30, sl.p2[1]);
    }
    if (stopLinePositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(stopLinePositions, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0xef4444 });
      this.debugGroup.add(new THREE.LineSegments(geo, mat));
    }

    this.scenery.add(this.debugGroup);
  }

  /**
   * Bật/tắt chế độ hiển thị trực quan Debug
   */
  toggleDebug(visible = null) {
    if (!this.debugGroup) return false;
    this.debugGroup.visible = visible !== null ? visible : !this.debugGroup.visible;
    return this.debugGroup.visible;
  }
}

/**
 * Xác định vị trí 3D và góc xoay của một điểm nằm dọc theo tim đường polyline
 */
export function placeAlongPolyline(points, distance, lateralOffset = 0) {
  if (!points || points.length < 2) return null;
  let accumulated = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2[0] - p1[0];
    const dz = p2[1] - p1[1];
    const segLen = Math.hypot(dx, dz);
    if (segLen === 0) continue;

    if (accumulated + segLen >= distance || i === points.length - 2) {
      const remaining = Math.max(0, distance - accumulated);
      const t = Math.min(1.0, remaining / segLen);
      const cx = p1[0] + dx * t;
      const cz = p1[1] + dz * t;
      const ux = dx / segLen;
      const uz = dz / segLen;
      const nx = -uz;
      const nz = ux;
      const heading = Math.atan2(dx, dz);
      return {
        x: cx + nx * lateralOffset,
        z: cz + nz * lateralOffset,
        heading,
        dirX: ux,
        dirZ: uz,
        nx,
        nz
      };
    }
    accumulated += segLen;
  }
  return null;
}

/**
 * Tìm vị trí đặt vật thể cảnh quan/biển báo dọc theo một tuyến đường trong RoadGraph
 */
export function placeAlongRoad(roadGraph, roadIdOrName, distance, lateralOffset = 0) {
  if (!roadGraph || !roadGraph.roads) return null;
  const road = roadGraph.roads.find(r => r.id === roadIdOrName || r.name === roadIdOrName);
  if (!road || !road.centerline) return null;
  return placeAlongPolyline(road.centerline, distance, lateralOffset);
}
