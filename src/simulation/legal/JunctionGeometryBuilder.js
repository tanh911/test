import * as THREE from 'three';

/**
 * 🏛️ JUNCTION GEOMETRY BUILDER (StVO Phase 2B)
 *
 * Implements precise junction geometry, road mouth boundaries, concave triangulation,
 * and StVO Zeichen 294 (Haltelinie) stop line placement.
 *
 * Key Principles:
 *  1. NO FORCED CONVEX HULL:
 *     Preserves true concave polygon shapes for T-junctions, Y-junctions, and skewed intersections.
 *  2. ACCURATE ROAD MOUTHS:
 *     Computes left and right curb corners matching trimmed road carriageway ribbons down to the millimeter.
 *  3. RADIAL ORDERING:
 *     Sorts approaching mouths counter-clockwise around the junction center.
 *  4. UPWARD-FACING TRIANGULATION:
 *     Guarantees that all generated triangle normals point strictly upward (+Y = 1),
 *     eliminating backface-culling and the gaping ground holes in the 3D viewport.
 *  5. CORNER CURB TRANSITIONS:
 *     Generates connecting 3D granite curbs and elevated sidewalks between adjacent road mouths.
 *  6. StVO § 37 / § 41 ZEICHEN 294 STOP LINES:
 *     Places 0.50m wide stop lines spanning strictly active forward lanes, 1.5m before crosswalks or mouths.
 */
export class JunctionGeometryBuilder {
  /**
   * Tính toán road mouth (miệng đường) của một đoạn đường tiếp cận ngã tư
   * @param {Object} params
   * @param {Object} params.road Tuyến đường OSM
   * @param {Object} params.junction Ngã tư tiếp giáp
   * @param {number} [params.trimDist] Khoảng cách lùi vào từ tâm giao lộ
   * @returns {Object} { roadId, mouth, left, right, dir, angle, trimDist, isEnd }
   */
  static computeRoadMouth({ road, junction, trimDist = 8.0 }) {
    if (!road || !road.centerline || road.centerline.length < 2 || !junction || !junction.center) {
      return null;
    }

    const points = road.centerline;
    const p0 = points[0];
    const pN = points[points.length - 1];
    const d0 = Math.hypot(p0[0] - junction.center[0], p0[1] - junction.center[1]);
    const dN = Math.hypot(pN[0] - junction.center[0], pN[1] - junction.center[1]);

    const isEnd = dN <= d0;
    const width = road.width || 8.0;
    const halfW = width / 2;

    let mouthCenter = [0, 0];
    let dir = [0, 0]; // Vector hướng ra ngoài ngã tư (đi vào lòng đường)
    let left = [0, 0];
    let right = [0, 0];

    if (isEnd) {
      // Nhánh đường đi VÀO ngã tư ở điểm cuối (pN)
      // Vector tiếp cận về phía ngã tư là từ pN-1 tới pN
      const pPrev = points[points.length - 2];
      const dx = pN[0] - pPrev[0];
      const dz = pN[1] - pPrev[1];
      const segLen = Math.hypot(dx, dz) || 1.0;
      const ux = dx / segLen;
      const uz = dz / segLen;

      // dir hướng ra ngoài từ ngã tư về phía ngược lại (-ux, -uz)
      dir = [-ux, -uz];

      // Điểm miệng đường lùi lại trimDist từ pN
      const actualTrim = Math.min(trimDist, (road.length || 10) * 0.4);
      mouthCenter = [pN[0] - ux * actualTrim, pN[1] - uz * actualTrim];

      // Normal vuông góc với dir: nhìn theo dir (-ux, -uz)
      // Left normal: [-dir.z, dir.x] = [-dir[1], dir[0]]
      // Right normal: [dir.z, -dir.x] = [dir[1], -dir[0]]
      const nlx = -dir[1];
      const nlz = dir[0];
      const nrx = dir[1];
      const nrz = -dir[0];

      left = [mouthCenter[0] + nlx * halfW, mouthCenter[1] + nlz * halfW];
      right = [mouthCenter[0] + nrx * halfW, mouthCenter[1] + nrz * halfW];
    } else {
      // Nhánh đường đi RA KHỎI ngã tư từ điểm đầu (p0)
      const pNext = points[1];
      const dx = pNext[0] - p0[0];
      const dz = pNext[1] - p0[1];
      const segLen = Math.hypot(dx, dz) || 1.0;
      const ux = dx / segLen;
      const uz = dz / segLen;

      // dir hướng ra ngoài ngã tư dọc theo polyline (ux, uz)
      dir = [ux, uz];

      const actualTrim = Math.min(trimDist, (road.length || 10) * 0.4);
      mouthCenter = [p0[0] + ux * actualTrim, p0[1] + uz * actualTrim];

      const nlx = -dir[1];
      const nlz = dir[0];
      const nrx = dir[1];
      const nrz = -dir[0];

      left = [mouthCenter[0] + nlx * halfW, mouthCenter[1] + nlz * halfW];
      right = [mouthCenter[0] + nrx * halfW, mouthCenter[1] + nrz * halfW];
    }

    // Góc cực (polar angle) chuẩn hóa [0, 2π) từ tâm ngã tư tới tâm miệng đường
    let angle = Math.atan2(mouthCenter[1] - junction.center[1], mouthCenter[0] - junction.center[0]);
    if (angle < 0) angle += Math.PI * 2;

    return {
      roadId: road.id,
      roadName: road.name,
      mouth: mouthCenter,
      left,
      right,
      dir,
      angle,
      trimDist,
      width,
      isEnd
    };
  }

  /**
   * Tạo đa giác ranh giới ngã tư từ danh sách road mouths (Đảm bảo KHÔNG ÉP CONVEX HULL)
   * @param {Object} params
   * @param {Object} params.junction Đối tượng ngã tư
   * @param {Array<Object>} params.mouths Danh sách road mouths tiếp cận
   * @returns {Array<[number, number]>} Mảng các điểm tọa độ 2D của đa giác theo thứ tự ngược chiều kim đồng hồ
   */
  static buildJunctionPolygon({ junction, mouths }) {
    if (!mouths || mouths.length < 2) {
      if (junction && junction.polygon && junction.polygon.length >= 3) {
        return junction.polygon;
      }
      return [];
    }

    // Sắp xếp các mouths theo góc cực ngược chiều kim đồng hồ (CCW) chuẩn hóa [0, 2π)
    const getNormAngle = m => {
      let a = m.angle !== undefined ? m.angle : Math.atan2(m.mouth[1] - junction.center[1], m.mouth[0] - junction.center[0]);
      if (a < 0) a += Math.PI * 2;
      return a;
    };
    const sortedMouths = [...mouths].sort((a, b) => getNormAngle(a) - getNormAngle(b));
    const polygon = [];

    // Duyệt qua từng miệng đường:
    // Với mỗi mouth i: khi đi ngược chiều kim đồng hồ quanh ngã tư:
    // Điểm vào là mouth[i].right, điểm ra là mouth[i].left.
    // Sau đó nối sang mouth[i+1].right (tạo mép vỉa hè góc cua giữa hai nhánh).
    for (let i = 0; i < sortedMouths.length; i++) {
      const m = sortedMouths[i];
      polygon.push([m.right[0], m.right[1]]);
      polygon.push([m.left[0], m.left[1]]);
    }

    // Đảm bảo đa giác được định hướng CCW (diện tích Shoelace > 0 hoặc theo chuẩn Three.js)
    let areaSum = 0;
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];
      areaSum += (p2[0] - p1[0]) * (p2[1] + p1[1]);
    }
    // Trong tọa độ (X, Z), nếu areaSum > 0 thì đảo chiều để đảm bảo CCW
    if (areaSum > 0) {
      polygon.reverse();
    }

    return polygon;
  }

  /**
   * Triangulate đa giác ngã tư và đảm bảo 100% normal các tam giác hướng thẳng lên (+Y = 1)
   * @param {Array<[number, number]>} polygon Mảng điểm 2D
   * @param {number} [yElevation=0.022] Cao độ Y của mặt đường ngã tư
   * @returns {{ vertices: number[], indices: number[], uvs: number[] }}
   */
  static triangulateJunctionPolygon(polygon, yElevation = 0.022) {
    if (!polygon || polygon.length < 3) {
      return { vertices: [], indices: [], uvs: [] };
    }

    const vec2s = polygon.map(p => new THREE.Vector2(p[0], p[1]));
    const rawTris = THREE.ShapeUtils.triangulateShape(vec2s, []);

    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i < polygon.length; i++) {
      vertices.push(polygon[i][0], yElevation, polygon[i][1]);
      uvs.push(polygon[i][0] / 8, polygon[i][1] / 8);
    }

    for (let t = 0; t < rawTris.length; t++) {
      const i0 = rawTris[t][0];
      const i1 = rawTris[t][1];
      const i2 = rawTris[t][2];

      const p0 = polygon[i0];
      const p1 = polygon[i1];
      const p2 = polygon[i2];

      // Tích có hướng 2D trong mặt phẳng (X, Z):
      // cross = (p1.x - p0.x)*(p2.z - p0.z) - (p1.z - p0.z)*(p2.x - p0.x)
      // Trong không gian 3D (X, Y, Z) với Y = hằng số:
      // Vector3((p1 - p0) x (p2 - p0)).y = (p1.z - p0.z)*(p2.x - p0.x) - (p1.x - p0.x)*(p2.z - p0.z) = -cross
      // Để Normal hướng lên (+Y): ta cần -cross > 0  <=>  cross < 0!
      // Nếu cross > 0: đảo thứ tự đỉnh (i0, i2, i1) để normal luôn hướng thẳng lên trời (+Y)!
      const cross = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
      if (cross > 0) {
        indices.push(i0, i2, i1);
      } else {
        indices.push(i0, i1, i2);
      }
    }

    return { vertices, indices, uvs };
  }

  /**
   * Tạo bó vỉa 3D và vỉa hè góc cua (Corner Curb Fillet Transitions) giữa các nhánh đường
   * @param {Object} params
   * @param {Object} params.junction Ngã tư
   * @param {Array<Object>} params.mouths Danh sách road mouths đã sắp xếp CCW
   * @param {number} [params.curbWidth=0.18]
   * @param {number} [params.swWidth=2.5]
   * @returns {Array<Object>} Danh sách các đối tượng curb bổ sung cho ngã tư
   */
  static buildCornerCurbs({ junction, mouths, curbWidth = 0.18, swWidth = 2.5 }) {
    const getNormAngle = m => {
      let a = m.angle !== undefined ? m.angle : Math.atan2(m.mouth[1] - junction.center[1], m.mouth[0] - junction.center[0]);
      if (a < 0) a += Math.PI * 2;
      return a;
    };
    const sortedMouths = [...mouths].sort((a, b) => getNormAngle(a) - getNormAngle(b));
    const cornerCurbs = [];
    const K = sortedMouths.length;

    for (let i = 0; i < K; i++) {
      const cur = sortedMouths[i];
      const next = sortedMouths[(i + 1) % K];

      // Điểm mép trái của nhánh hiện tại nối sang mép phải của nhánh tiếp theo
      const pStart = cur.left;
      const pEnd = next.right;

      const dist = Math.hypot(pEnd[0] - pStart[0], pEnd[1] - pStart[1]);
      
      // Góc mở giữa 2 nhánh tiếp cận liên tiếp (phải là góc rẽ thực tế từ ~25° đến ~155°)
      let curAngle = getNormAngle(cur);
      let nextAngle = getNormAngle(next);
      let angleDiff = nextAngle - curAngle;
      while (angleDiff < 0) angleDiff += Math.PI * 2;
      while (angleDiff >= Math.PI * 2) angleDiff -= Math.PI * 2;

      // Không tạo bó vỉa góc cua nếu:
      // 1. Khoảng cách quá ngắn (< 0.5m) hoặc quá dài (> 12m)
      // 2. Hai nhánh chạy song song/cùng hướng (angleDiff < 0.4 rad) hoặc đối đỉnh/ngược chiều (angleDiff > 2.8 rad)
      if (dist < 0.5 || dist > 12.0) continue;
      if (angleDiff < 0.4 || angleDiff > 2.8) continue;

      // Vector hướng tâm từ tâm ngã tư tới điểm trung gian
      const midX = (pStart[0] + pEnd[0]) / 2;
      const midZ = (pStart[1] + pEnd[1]) / 2;

      // Hướng pháp tuyến ra ngoài ngã tư tại góc cua
      const outDx = midX - junction.center[0];
      const outDz = midZ - junction.center[1];
      const outLen = Math.hypot(outDx, outDz) || 1.0;
      const normOutX = outDx / outLen;
      const normOutZ = outDz / outLen;

      // Tạo đường cong vỉa hè góc cua (fillet 3 điểm)
      const innerPoints = [
        [pStart[0], pStart[1]],
        [midX, midZ],
        [pEnd[0], pEnd[1]]
      ];

      const topOuterPoints = [
        [pStart[0] + normOutX * curbWidth, pStart[1] + normOutZ * curbWidth],
        [midX + normOutX * curbWidth, midZ + normOutZ * curbWidth],
        [pEnd[0] + normOutX * curbWidth, pEnd[1] + normOutZ * curbWidth]
      ];

      const totalSw = curbWidth + swWidth;
      const swOuterPoints = [
        [pStart[0] + normOutX * totalSw, pStart[1] + normOutZ * totalSw],
        [midX + normOutX * totalSw, midZ + normOutZ * totalSw],
        [pEnd[0] + normOutX * totalSw, pEnd[1] + normOutZ * totalSw]
      ];

      cornerCurbs.push({
        roadId: `corner_${junction.id}_${cur.roadId}_${next.roadId}`,
        side: 1,
        innerPoints,
        topOuterPoints,
        swOuterPoints
      });
    }

    return cornerCurbs;
  }

  /**
   * Tính toán vị trí và kích thước vạch dừng Haltelinie (StVO Zeichen 294)
   * Chỉ kẻ trên các làn xuôi chiều (active forward lanes), 1.5m trước vạch đi bộ hoặc miệng đường
   * @param {Object} params
   * @returns {Object|null}
   */
  static computeStopLine({
    road,
    junction,
    isEnd,
    hasCrosswalk,
    roadWidth,
    isOneway,
    roadDivOffset,
    normals,
    points
  }) {
    if (!junction || junction.isInlineJoint) return null;
    const isSignalized = !!(junction.hasTrafficLight || junction.priorityRule === 'AMPEL');
    const isStopSign = !!(junction.hasStopSign || junction.priorityRule === 'STOP');
    const isGiveWay = !!(junction.hasGiveWay || junction.priorityRule === 'VORFAHRT_GEWAEHREN');

    if (!isSignalized && !isStopSign && !isGiveWay) return null;

    const halfW = roadWidth / 2;
    const totalRoadLen = road.length || 10;
    // Nếu có vạch đi bộ: lùi lại 4.9m (1.5m trước vạch đi bộ 3.2m); nếu không: lùi lại 1.5m
    // Giới hạn không vượt quá 35% chiều dài đường để tránh đè sang ngã tư phía sau
    const desiredDist = hasCrosswalk ? 4.9 : 1.5;
    const stopDist = Math.min(desiredDist, totalRoadLen * 0.35);

    if (isEnd) {
      // Nhánh tiếp cận ngã tư ở điểm cuối (xe di chuyển FORWARD về phía endJunction)
      const lastIdx = points.length - 1;
      const p = points[lastIdx];
      const { nx, nz, scale, ux, uz } = normals[lastIdx];

      const stopX = p[0] - ux * stopDist;
      const stopZ = p[1] - uz * stopDist;

      // Rechtsfahrgebot (§ 2 StVO): Làn xuôi chiều nằm từ -halfW đến roadDivOffset
      const fwdStart = -halfW;
      const fwdEnd = isOneway ? halfW : (roadDivOffset || 0);

      const p1 = [stopX + nx * fwdStart * scale, stopZ + nz * fwdStart * scale];
      const p2 = [stopX + nx * fwdEnd * scale, stopZ + nz * fwdEnd * scale];

      // Đặt cột đèn tín hiệu trên vỉa hè bên phải xe chạy (tại mép p1)
      const tlX = p1[0] - nx * 0.9;
      const tlZ = p1[1] - nz * 0.9;
      const tlRot = Math.atan2(-ux, -uz);

      return {
        roadId: road.id,
        junctionId: junction.id,
        p1,
        p2,
        width: 0.50, // Chuẩn StVO Zeichen 294: 50 cm
        priorityRule: junction.priorityRule,
        hasTrafficLight: isSignalized,
        trafficLight: isSignalized ? { position: [tlX, 0, tlZ], rotation: tlRot } : null
      };
    } else if (!isOneway) {
      // Nhánh tiếp cận ngã tư ở điểm đầu (xe di chuyển BACKWARD về phía startJunction)
      const p = points[0];
      const { nx, nz, scale, ux, uz } = normals[0];

      // Xe đi ngược polyline lùi lại stopDist theo hướng tiến của nó (+ux, +uz)
      const stopX = p[0] + ux * stopDist;
      const stopZ = p[1] + uz * stopDist;

      // Làn ngược chiều nằm từ roadDivOffset đến halfW
      const bwdStart = roadDivOffset || 0;
      const bwdEnd = halfW;

      const p1 = [stopX + nx * bwdStart * scale, stopZ + nz * bwdStart * scale];
      const p2 = [stopX + nx * bwdEnd * scale, stopZ + nz * bwdEnd * scale];

      // Đặt cột đèn tín hiệu trên vỉa hè bên phải xe chạy ngược chiều (tại mép p2)
      const tlX = p2[0] + nx * 0.9;
      const tlZ = p2[1] + nz * 0.9;
      const tlRot = Math.atan2(ux, uz);

      return {
        roadId: road.id,
        junctionId: junction.id,
        p1,
        p2,
        width: 0.50,
        priorityRule: junction.priorityRule,
        hasTrafficLight: isSignalized,
        trafficLight: isSignalized ? { position: [tlX, 0, tlZ], rotation: tlRot } : null
      };
    }

    return null;
  }
}
