/**
 * 🗺️ ROAD NETWORK GRAPH & TOPOLOGICAL INTERSECTION ENGINE (OSM StVO)
 * 
 * - Tải và lập chỉ mục topology từ road_graph.json trích xuất từ PBF
 * - Lập chỉ mục không gian 2D Spatial Hash Grid để truy vấn điểm/đoạn đường trong O(1)
 * - Tự động phát hiện giao lộ (Intersections) và các nhánh rẽ (Left, Right, Straight, U-Turn)
 * - Đo lường hướng di chuyển, khoảng cách tới ngã tư tiếp theo và tốc độ cho phép
 */

export class RoadNetworkGraph {
  constructor() {
    this.roads = [];
    this.junctions = [];
    this.roadMap = new Map();
    this.junctionMap = new Map();
    this.nodeToRoads = new Map(); // node ID -> [road]
    this.gridCellSize = 50; // 50m hash cell
    this.spatialGrid = new Map(); // "gx,gz" -> [road]
    this.isReady = false;
  }

  /**
   * Khởi tạo đồ thị đường từ dữ liệu road_graph.json
   */
  init(graphData) {
    if (!graphData || !graphData.roads) {
      console.warn('[RoadNetworkGraph] Invalid road graph data');
      return;
    }

    this.roads = graphData.roads;
    this.junctions = graphData.junctions || [];
    this.roadMap.clear();
    this.junctionMap.clear();
    this.nodeToRoads.clear();
    this.spatialGrid.clear();

    // 1. Index roads and nodes
    for (const r of this.roads) {
      this.roadMap.set(r.id, r);

      // Node indexing
      if (r.startNode) {
        if (!this.nodeToRoads.has(r.startNode)) this.nodeToRoads.set(r.startNode, []);
        this.nodeToRoads.get(r.startNode).push(r);
      }
      if (r.endNode) {
        if (!this.nodeToRoads.has(r.endNode)) this.nodeToRoads.set(r.endNode, []);
        this.nodeToRoads.get(r.endNode).push(r);
      }

      // 2. Spatial grid indexing along polyline
      if (r.centerline && r.centerline.length >= 2) {
        for (let i = 0; i < r.centerline.length - 1; i++) {
          const p1 = r.centerline[i];
          const p2 = r.centerline[i + 1];
          this._indexSegmentToGrid(r, p1, p2);
        }
      }
    }

    // 3. Index junctions
    for (const j of this.junctions) {
      this.junctionMap.set(j.id, j);
    }

    this.isReady = true;
    console.log(`[RoadNetworkGraph] Indexed ${this.roads.length} road segments and ${this.junctions.length} intersections from OSM graph.`);
  }

  _indexSegmentToGrid(road, p1, p2) {
    const minX = Math.min(p1[0], p2[0]);
    const maxX = Math.max(p1[0], p2[0]);
    const minZ = Math.min(p1[1], p2[1]);
    const maxZ = Math.max(p1[1], p2[1]);

    const startGx = Math.floor(minX / this.gridCellSize);
    const endGx = Math.floor(maxX / this.gridCellSize);
    const startGz = Math.floor(minZ / this.gridCellSize);
    const endGz = Math.floor(maxZ / this.gridCellSize);

    for (let gx = startGx; gx <= endGx; gx++) {
      for (let gz = startGz; gz <= endGz; gz++) {
        const key = `${gx},${gz}`;
        if (!this.spatialGrid.has(key)) {
          this.spatialGrid.set(key, []);
        }
        const cell = this.spatialGrid.get(key);
        if (!cell.includes(road)) {
          cell.push(road);
        }
      }
    }
  }

  /**
   * Tìm đoạn đường gần nhất với vị trí xe (x, z) và góc xoay heading
   * @param {number} x - Tọa độ X của xe
   * @param {number} z - Tọa độ Z thế giới của xe
   * @param {number} heading - Góc xoay xe (Three.js heading)
   */
  findNearestSegment(x, z, heading) {
    if (!this.isReady || this.roads.length === 0) return null;

    const gx = Math.floor(x / this.gridCellSize);
    const gz = Math.floor(z / this.gridCellSize);
    const candidateRoads = new Set();

    // Query 3x3 surrounding cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const cell = this.spatialGrid.get(`${gx + dx},${gz + dz}`);
        if (cell) {
          cell.forEach(r => candidateRoads.add(r));
        }
      }
    }

    // Fallback if no nearby grid cells found
    const roadsToTest = candidateRoads.size > 0 ? Array.from(candidateRoads) : this.roads;

    let bestRoad = null;
    let bestDistSq = Infinity;
    let bestProj = null;
    let bestDir = 1; // 1: start->end, -1: end->start
    let bestSegIdx = 0;

    // Vector hướng xe di chuyển trong Three.js (heading 0 = dir +Z, heading Math.PI = dir -Z)
    const carDirX = Math.sin(heading);
    const carDirZ = Math.cos(heading);

    for (const r of roadsToTest) {
      const pts = r.centerline;
      if (!pts || pts.length < 2) continue;

      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const segDx = p2[0] - p1[0];
        const segDz = p2[1] - p1[1];
        const segLenSq = segDx * segDx + segDz * segDz;
        if (segLenSq < 0.001) continue;

        // Project point onto line segment
        const t = Math.max(0, Math.min(1, ((x - p1[0]) * segDx + (z - p1[1]) * segDz) / segLenSq));
        const projX = p1[0] + t * segDx;
        const projZ = p1[1] + t * segDz;
        const distSq = (x - projX) * (x - projX) + (z - projZ) * (z - projZ);

        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestRoad = r;
          bestProj = [projX, projZ];
          bestSegIdx = i;

          // Hướng đi xuôi (start -> end) hay ngược (end -> start)
          const segLen = Math.sqrt(segLenSq);
          const unitSegX = segDx / segLen;
          const unitSegZ = segDz / segLen;
          const dot = carDirX * unitSegX + carDirZ * unitSegZ;
          bestDir = dot >= 0 ? 1 : -1;
        }
      }
    }

    if (!bestRoad || Math.sqrt(bestDistSq) > 35.0) return null;

    return {
      road: bestRoad,
      distance: Math.sqrt(bestDistSq),
      travelDir: bestDir, // 1: going towards endNode, -1: going towards startNode
      projectedPoint: bestProj,
      segmentIndex: bestSegIdx
    };
  }

  /**
   * Tìm ngã tư / giao lộ kế tiếp theo hướng xe đang di chuyển
   * @param {number} x - Tọa độ X
   * @param {number} z - Tọa độ Z
   * @param {number} heading - Góc xe
   * @param {number} maxDist - Khoảng cách tối đa nhìn phía trước (m)
   */
  findUpcomingIntersection(x, z, heading, maxDist = 280) {
    const current = this.findNearestSegment(x, z, heading);
    if (!current) return null;

    const { road, travelDir, projectedPoint } = current;
    const targetNodeId = travelDir === 1 ? road.endNode : road.startNode;
    const targetEndPt = travelDir === 1 ? road.centerline[road.centerline.length - 1] : road.centerline[0];

    // Khoảng cách từ vị trí hiện tại tới điểm cuối đoạn đường
    const distToEnd = Math.hypot(targetEndPt[0] - projectedPoint[0], targetEndPt[1] - projectedPoint[1]);
    if (distToEnd > maxDist) return null;

    // Tìm junction gắn với targetNodeId hoặc nằm gần targetEndPt (< 18m)
    let matchedJunction = null;
    let bestJuncDist = Infinity;

    for (const junc of this.junctions) {
      const jx = junc.center[0];
      const jz = junc.center[1];
      const d = Math.hypot(targetEndPt[0] - jx, targetEndPt[1] - jz);
      if (d < 12.0 && d < bestJuncDist) {
        bestJuncDist = d;
        matchedJunction = junc;
      }
    }

    // Nếu không có polygon junction định nghĩa sẵn, tạo junction ảo từ các nhánh kết nối tại node
    const connectedRoads = this.nodeToRoads.get(targetNodeId) || [];
    const outgoingBranches = [];

    // Vector tới của xe khi vào ngã tư
    const lastP = travelDir === 1 ? road.centerline[road.centerline.length - 1] : road.centerline[0];
    const prevP = travelDir === 1 ? road.centerline[road.centerline.length - 2] : road.centerline[1];
    const inDx = lastP[0] - prevP[0];
    const inDz = lastP[1] - prevP[1];
    const inLen = Math.hypot(inDx, inDz) || 1.0;
    const inUnitX = inDx / inLen;
    const inUnitZ = inDz / inLen;
    const inAngle = Math.atan2(inUnitX, inUnitZ);

    for (const otherRoad of connectedRoads) {
      if (otherRoad.id === road.id) continue;

      // Xác định đầu nào của otherRoad gắn vào node này
      const isStartNode = otherRoad.startNode === targetNodeId;
      const branchP0 = isStartNode ? otherRoad.centerline[0] : otherRoad.centerline[otherRoad.centerline.length - 1];
      const branchP1 = isStartNode ? otherRoad.centerline[1] : otherRoad.centerline[otherRoad.centerline.length - 2];

      const outDx = branchP1[0] - branchP0[0];
      const outDz = branchP1[1] - branchP0[1];
      const outLen = Math.hypot(outDx, outDz) || 1.0;
      const outUnitX = outDx / outLen;
      const outUnitZ = outDz / outLen;
      const outAngle = Math.atan2(outUnitX, outUnitZ);

      // Góc tương đối: dương = rẽ phải, âm = rẽ trái, ~0 = đi thẳng
      let relAngle = outAngle - inAngle;
      while (relAngle > Math.PI) relAngle -= 2 * Math.PI;
      while (relAngle < -Math.PI) relAngle += 2 * Math.PI;
      const relDeg = (relAngle * 180) / Math.PI;

      let maneuver = 'STRAIGHT';
      if (relDeg > 35 && relDeg < 145) maneuver = 'RIGHT';
      else if (relDeg < -35 && relDeg > -145) maneuver = 'LEFT';
      else if (Math.abs(relDeg) >= 145) maneuver = 'UTURN';
      else maneuver = 'STRAIGHT';

      // Kiểm tra đường 1 chiều cấm vào
      const isOnewayBlocked = otherRoad.oneway && !isStartNode;

      if (!isOnewayBlocked) {
        outgoingBranches.push({
          road: otherRoad,
          maneuver,
          relativeAngleDeg: Math.round(relDeg),
          name: otherRoad.name,
          speedLimit: otherRoad.speedLimit || 50,
          hasTrafficSignal: otherRoad.hasTrafficSignal,
          hasCrossing: otherRoad.hasPedestrianCrossing,
          entryPoint: branchP0
        });
      }
    }

    const juncCenter = matchedJunction ? matchedJunction.center : targetEndPt;
    const totalDistToJunc = Math.hypot(juncCenter[0] - x, juncCenter[1] - z);

    const priorityRule = matchedJunction?.priorityRule || (road.hasTrafficSignal ? 'AMPEL' : 'RECHTS_VOR_LINKS');

    return {
      junction: matchedJunction || {
        id: `node_junc_${targetNodeId}`,
        center: targetEndPt,
        hasTrafficLight: road.hasTrafficSignal || (matchedJunction && matchedJunction.hasTrafficLight),
        priorityRule
      },
      distance: Math.round(totalDistToJunc),
      incomingRoad: road,
      branches: outgoingBranches,
      center: juncCenter,
      hasTrafficLight: !!(matchedJunction?.hasTrafficLight || road.hasTrafficSignal),
      hasStopSign: !!matchedJunction?.hasStopSign,
      hasGiveWay: !!matchedJunction?.hasGiveWay,
      priorityRule
    };
  }
}

export const roadNetwork = new RoadNetworkGraph();
