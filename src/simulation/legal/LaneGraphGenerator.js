/**
 * 🛣️ LANE GRAPH GENERATOR (German StVO Lane-Aware Engine)
 * 
 * Generates true lateral lane offsets, centerlines, and junction topologies
 * directly from OpenStreetMap road_graph.json.
 * 
 * Key Principles:
 *  1. Rechtsfahrgebot (§ 2 StVO): In two-way traffic, forward traffic stays right
 *     of the dividing line; backward traffic stays on its respective right side.
 *  2. Multi-lane Awareness: Accurately calculates lane offsets for 1, 2, 3, 4, 5+ lanes.
 *  3. Junction Trimming: Trims road carriageways before junctions to prevent overlapping
 *     ribbons and to place Stop Lines (Haltelinie) and Zebrastreifen cleanly.
 *  4. 3D Curb & Sidewalk Profiles: Generates coordinates for 3D granite curbs (riser + top cap)
 *     and elevated pedestrian sidewalks.
 *  5. Single-Source for Traffic AI: Provides lane centerlines consumed directly by bot vehicles.
 */

import { JunctionGeometryBuilder } from './JunctionGeometryBuilder.js';

export class LaneGraphGenerator {
  constructor(roadGraphData) {
    this.roadGraphData = roadGraphData;
    this.roads = roadGraphData?.roads || [];
    this.junctions = roadGraphData?.junctions || [];

    this.roadMap = new Map();
    this.junctionMap = new Map();
    this.lanes = [];
    this.laneMap = new Map();
    this.dividers = [];
    this.curbs = [];
    this.stopLines = [];
    this.crosswalks = [];
    this.junctionPolygons = [];

    this._init();
  }

  _init() {
    if (!this.roads || this.roads.length === 0) return;

    // 1. Index roads and junctions
    for (const j of this.junctions) {
      this.junctionMap.set(j.id, j);
    }
    for (const r of this.roads) {
      this.roadMap.set(r.id, r);
    }

    // 1.5 Lọc bỏ ngã tư giả giữa đường thẳng/điểm tách làn và khử trùng lặp vạch đi bộ
    this._sanitizeRoadGraph();

    // 2. Process each junction polygon
    for (const j of this.junctions) {
      let poly = [];
      let mouthsList = [];

      if (j.mouths && Object.keys(j.mouths).length > 0) {
        mouthsList = Object.entries(j.mouths).map(([roadId, m]) => {
          const road = this.roadMap.get(roadId);
          if (road && road.centerline && road.centerline.length >= 2) {
            const fresh = JunctionGeometryBuilder.computeRoadMouth({
              road,
              junction: j,
              trimDist: m.trimDist !== undefined ? m.trimDist : 6.0
            });
            if (fresh) return fresh;
          }
          return {
            roadId,
            mouth: m.mouth,
            left: m.left,
            right: m.right,
            dir: m.dir,
            angle: Math.atan2(m.mouth[1] - j.center[1], m.mouth[0] - j.center[0])
          };
        }).filter(Boolean);
      }

      const hasPythonPoly = j.polygon && j.polygon.length >= 3;

      if (hasPythonPoly && !j.isInlineJoint) {
        poly = j.polygon;
      } else if (mouthsList.length >= 2 && !j.isInlineJoint) {
        poly = JunctionGeometryBuilder.buildJunctionPolygon({ junction: j, mouths: mouthsList });
      } else if (hasPythonPoly) {
        poly = j.polygon;
      }

      this.junctionPolygons.push({
        id: j.id,
        center: j.center,
        polygon: poly,
        hasTrafficLight: !!j.hasTrafficLight,
        priorityRule: j.priorityRule || 'RECHTS_VOR_LINKS'
      });

      // Tạo bó vỉa góc cua giữa các nhánh đường tiếp giáp nếu có mouths
      if (!j.isInlineJoint && mouthsList.length >= 2) {
        const cornerCurbs = JunctionGeometryBuilder.buildCornerCurbs({
          junction: j,
          mouths: mouthsList,
          curbWidth: 0.18,
          swWidth: 2.0
        });
        if (cornerCurbs.length > 0) {
          this.curbs.push(...cornerCurbs);
        }
      }
    }

    // 3. Process each road segment
    for (const road of this.roads) {
      if (!road.centerline || road.centerline.length < 2) continue;
      this._processRoadSegment(road);
    }

    // 4. Thu thập toàn bộ vạch sang đường đã qua xử lý lọc sạch
    this.crosswalks = [];
    for (const j of this.junctions) {
      if (j.crosswalks && Array.isArray(j.crosswalks)) {
        this.crosswalks.push(...j.crosswalks);
      }
    }
  }

  /**
   * Lọc bỏ các ngã tư giả mạo (Fake junctions sinh ra do phân đoạn OSM trong cùng một tuyến phố)
   * và khử trùng lặp vạch sang đường Zebrastreifen
   */
  _sanitizeRoadGraph() {
    // 0. Làm sạch các miệng đường bị gắn nhầm (Intruder Road Mouths) do sai số bán kính gom cụm OSM
    for (const j of this.junctions) {
      if (!j.mouths || Object.keys(j.mouths).length < 2) continue;
      const roadIds = Object.keys(j.mouths);

      const endpoints = roadIds.map(rid => {
        const road = this.roadMap.get(rid);
        if (!road || !road.centerline || road.centerline.length < 2) return null;
        const p0 = road.centerline[0];
        const pN = road.centerline[road.centerline.length - 1];
        const d0 = Math.hypot(p0[0] - j.center[0], p0[1] - j.center[1]);
        const dN = Math.hypot(pN[0] - j.center[0], pN[1] - j.center[1]);
        return { rid, pt: d0 < dN ? p0 : pN, isEnd: dN < d0 };
      }).filter(Boolean);

      if (endpoints.length < 2) continue;

      // Tìm tâm cụm hội tụ (cluster) có nhiều nhánh đường giao cắt nhất trong phạm vi 3.5m
      let bestPt = null;
      let maxCount = 0;
      endpoints.forEach(ep1 => {
        const count = endpoints.filter(ep2 => Math.hypot(ep1.pt[0] - ep2.pt[0], ep1.pt[1] - ep2.pt[1]) < 3.5).length;
        if (count > maxCount) {
          maxCount = count;
          bestPt = ep1.pt;
        }
      });

      if (bestPt && maxCount >= 2) {
        // Loại bỏ mọi nhánh đường có đầu mút cách cụm giao lộ thực tế > 4.5m
        endpoints.forEach(ep => {
          const d = Math.hypot(ep.pt[0] - bestPt[0], ep.pt[1] - bestPt[1]);
          if (d > 4.5) {
            delete j.mouths[ep.rid];
            if (j.crosswalks && Array.isArray(j.crosswalks)) {
              j.crosswalks = j.crosswalks.filter(cw => cw.roadId !== ep.rid);
            }
          }
        });

        // Cập nhật tâm ngã tư chuẩn xác theo trọng tâm các nhánh hợp lệ
        const validEps = endpoints.filter(ep => Math.hypot(ep.pt[0] - bestPt[0], ep.pt[1] - bestPt[1]) <= 4.5);
        if (validEps.length >= 2) {
          const avgX = validEps.reduce((s, ep) => s + ep.pt[0], 0) / validEps.length;
          const avgZ = validEps.reduce((s, ep) => s + ep.pt[1], 0) / validEps.length;
          j.center = [Math.round(avgX * 100) / 100, Math.round(avgZ * 100) / 100];
        }
      }

      if (Object.keys(j.mouths).length < 2) {
        j.isInlineJoint = true;
        j.hasTrafficLight = false;
        j.hasStopSign = false;
        j.hasGiveWay = false;
        j.priorityRule = 'CONTINUOUS';
        j.crosswalks = [];
      }
    }

    // 1. Phân loại và làm sạch các giao lộ giả
    for (const j of this.junctions) {
      if (j.isInlineJoint) continue;

      const roadIds = Object.keys(j.mouths || {});
      const roads = roadIds.map(id => this.roadMap.get(id)).filter(Boolean);
      const distinctNames = new Set(roads.map(r => (r.name || '').toLowerCase().trim()).filter(Boolean));

      // ── FIX #1: Chỉ coi là inline joint nếu các road THẲNG HÀNG ──
      let isSameStreetTransition = false;
      if (distinctNames.size <= 1 && roads.length === 2) {
        const angles = roads.map(r => {
          if (!r.centerline || r.centerline.length < 2) return null;
          const p0 = r.centerline[0];
          const pN = r.centerline[r.centerline.length - 1];
          return Math.atan2(pN[1] - p0[1], pN[0] - p0[0]);
        }).filter(a => a !== null);

        if (angles.length === 2) {
          let diff = Math.abs(angles[0] - angles[1]);
          while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);
          const diffDeg = (diff * 180) / Math.PI;
          const isParallel = diffDeg < 25 || diffDeg > 155;
          isSameStreetTransition = isParallel;
        }
      }

      if (isSameStreetTransition) {
        // Điểm phân tách hoặc nhập làn trong cùng một phố (ví dụ Friedrichstraße tách thành dual-carriageway)
        // Tuyệt đối không đặt cột đèn giao thông hay vạch sang đường giữa chừng
        j.isInlineJoint = true;
        j.hasTrafficLight = false;
        j.hasStopSign = false;
        j.hasGiveWay = false;
        j.priorityRule = 'CONTINUOUS';
        j.crosswalks = [];
        if (j.mouths) {
          for (const rId of Object.keys(j.mouths)) {
            j.mouths[rId].trimDist = 0;
          }
        }
      }
    }

    // Lọc bỏ 100% đèn tín hiệu, vạch dừng, vạch đi bộ trên các nút giao cao tốc Autobahn
    for (const j of this.junctions) {
      const connectedRoads = (j.mouths ? Object.keys(j.mouths) : []).map(rid => this.roadMap.get(rid)).filter(Boolean);
      const isMotorwayJunction = connectedRoads.some(r => ['motorway', 'trunk', 'motorway_link'].includes(r?.highway));
      if (isMotorwayJunction) {
        j.hasTrafficLight = false;
        j.hasStopSign = false;
        j.hasGiveWay = false;
        j.priorityRule = 'CONTINUOUS';
        j.crosswalks = [];
      }
    }

    // 2. Khử trùng lặp vạch sang đường giữa các ngã tư lân cận
    const seenCrosswalks = [];
    for (const j of this.junctions) {
      if (!j.crosswalks || !Array.isArray(j.crosswalks)) continue;
      j.crosswalks = j.crosswalks.filter(cw => {
        if (!cw.p1 || !cw.p2) return false;
        const midX = (cw.p1[0] + cw.p2[0]) / 2;
        const midZ = (cw.p1[1] + cw.p2[1]) / 2;

        const isDuplicate = seenCrosswalks.some(sc => {
          return Math.hypot(sc.x - midX, sc.z - midZ) < 6.0;
        });

        if (isDuplicate) return false;
        seenCrosswalks.push({ x: midX, z: midZ, roadId: cw.roadId });
        return true;
      });
    }
  }

  /**
   * Kiểm tra xem một tọa độ mép bó vỉa có bị rơi vào lòng đường của nhánh song song cùng tên hay không
   */
  _isPointInsideSisterRoad(x, z, road) {
    if (!road.oneway) return false;
    const roadName = (road.name || '').toLowerCase().trim()
      .replace(/straße/g, 'str').replace(/strasse/g, 'str').replace(/\./g, '')
      .replace(/\s+/g, ' ');
    if (!roadName || roadName.length < 3) return false;

    for (const other of this.roads) {
      if (other.id === road.id || !other.oneway) continue;
      const otherName = (other.name || '').toLowerCase().trim()
        .replace(/straße/g, 'str').replace(/strasse/g, 'str').replace(/\./g, '')
        .replace(/\s+/g, ' ');
      if (otherName !== roadName) continue;
      if (!other.centerline || other.centerline.length < 2) continue;

      const otherHalfW = (other.width || 4.0) / 2;
      const pts = other.centerline;
      for (let k = 0; k < pts.length - 1; k++) {
        const p1 = pts[k];
        const p2 = pts[k + 1];
        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const lenSq = dx * dx + dz * dz;
        if (lenSq === 0) continue;
        let t = ((x - p1[0]) * dx + (z - p1[1]) * dz) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = p1[0] + t * dx;
        const projZ = p1[1] + t * dz;
        const dist = Math.hypot(x - projX, z - projZ);
        if (dist < otherHalfW + 0.6) {
          return true; // Rơi vào lòng đường xe chạy!
        }
      }
    }
    return false;
  }

  /**
   * Tính toán vector tiếp tuyến và pháp tuyến miter-clamped cho từng đỉnh polyline
   */
  static computeNormals(points) {
    const n = points.length;
    const normals = [];
    for (let i = 0; i < n; i++) {
      let nx = 0, nz = 0;
      let scale = 1.0;
      let ux = 0, uz = 0;

      if (i === 0) {
        const dx = points[1][0] - points[0][0];
        const dz = points[1][1] - points[0][1];
        const len = Math.hypot(dx, dz) || 1;
        ux = dx / len;
        uz = dz / len;
        // Right-hand normal: (uz, -ux)
        nx = uz;
        nz = -ux;
      } else if (i === n - 1) {
        const dx = points[n - 1][0] - points[n - 2][0];
        const dz = points[n - 1][1] - points[n - 2][1];
        const len = Math.hypot(dx, dz) || 1;
        ux = dx / len;
        uz = dz / len;
        nx = uz;
        nz = -ux;
      } else {
        const dx1 = points[i][0] - points[i - 1][0];
        const dz1 = points[i][1] - points[i - 1][1];
        const len1 = Math.hypot(dx1, dz1) || 1;
        const u1x = dx1 / len1;
        const u1z = dz1 / len1;
        const n1x = u1z;
        const n1z = -u1x;

        const dx2 = points[i + 1][0] - points[i][0];
        const dz2 = points[i + 1][1] - points[i][1];
        const len2 = Math.hypot(dx2, dz2) || 1;
        const u2x = dx2 / len2;
        const u2z = dz2 / len2;
        const n2x = u2z;
        const n2z = -u2x;

        ux = (u1x + u2x) * 0.5;
        uz = (u1z + u2z) * 0.5;
        const ulen = Math.hypot(ux, uz) || 1;
        ux /= ulen;
        uz /= ulen;

        const bisX = n1x + n2x;
        const bisZ = n1z + n2z;
        const bisLen = Math.hypot(bisX, bisZ);
        if (bisLen > 0.001) {
          nx = bisX / bisLen;
          nz = bisZ / bisLen;
          const dot = nx * n1x + nz * n1z;
          scale = dot > 0.2 ? Math.min(2.5, 1.0 / dot) : 2.5;
        } else {
          nx = n1x;
          nz = n1z;
        }
      }
      normals.push({ nx, nz, scale, ux, uz });
    }
    return normals;
  }

  /**
   * Cắt bớt (trim) đoạn đường ở 2 đầu nếu tiếp giáp với ngã tư để tránh đè mesh lên nhau
   */
  _getTrimmedCenterline(road) {
    const rawPoints = road.centerline;
    if (rawPoints.length < 2) return { points: rawPoints, startJunction: null, endJunction: null, startTrim: 0, endTrim: 0 };

    let startTrim = 0;
    let endTrim = 0;
    let startJunction = null;
    let endJunction = null;
    let minD0 = Infinity;
    let minDN = Infinity;

    const p0 = rawPoints[0];
    const pN = rawPoints[rawPoints.length - 1];

    for (const j of this.junctions) {
      const d0 = Math.hypot(p0[0] - j.center[0], p0[1] - j.center[1]);
      if (d0 < 12.0 && d0 < minD0) {
        minD0 = d0;
        startJunction = j;
        if (j.isInlineJoint) {
          startTrim = 0;
        } else if (j.mouths && j.mouths[road.id]) {
          startTrim = j.mouths[road.id].trimDist;
        } else {
          startTrim = Math.min(8.0, road.length * 0.35);
        }
      }
      const dN = Math.hypot(pN[0] - j.center[0], pN[1] - j.center[1]);
      if (dN < 12.0 && dN < minDN) {
        minDN = dN;
        endJunction = j;
        if (j.isInlineJoint) {
          endTrim = 0;
        } else if (j.mouths && j.mouths[road.id]) {
          endTrim = j.mouths[road.id].trimDist;
        } else {
          endTrim = Math.min(8.0, road.length * 0.35);
        }
      }
    }

    if (startTrim === 0 && endTrim === 0) {
      return { points: rawPoints, startJunction, endJunction, startTrim: 0, endTrim: 0 };
    }

    // Cắt bớt theo chiều dài tuyến đường nếu road ngắn
    // ── FIX #3: Đảm bảo luôn còn ít nhất 2m đường để vẽ ──
    const totalLen = road.length || 10;
    const minRemaining = 2.0;
    if (startTrim + endTrim > totalLen - minRemaining) {
      const scale = Math.max(0, totalLen - minRemaining) / Math.max(0.001, startTrim + endTrim);
      startTrim *= scale;
      endTrim *= scale;
    }

    const trimmed = this._slicePolyline(rawPoints, startTrim, Math.max(startTrim + 0.5, totalLen - endTrim));
    return {
      points: trimmed.length >= 2 ? trimmed : rawPoints,
      startJunction,
      endJunction,
      startTrim,
      endTrim
    };
  }

  /**
   * Cắt một polyline trong khoảng [distStart, distEnd]
   */
  _slicePolyline(points, distStart, distEnd) {
    if (points.length < 2) return points;
    const result = [];
    let accumulated = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      if (segLen === 0) continue;

      const segStart = accumulated;
      const segEnd = accumulated + segLen;

      // Đỉnh cắt đầu tiên
      if (distStart >= segStart && distStart <= segEnd) {
        const t = (distStart - segStart) / segLen;
        result.push([p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])]);
      }

      // Giữ lại các đỉnh trung gian nằm giữa distStart và distEnd
      if (segEnd > distStart && segEnd < distEnd) {
        result.push([p2[0], p2[1]]);
      }

      // Đỉnh cắt cuối cùng
      if (distEnd >= segStart && distEnd <= segEnd) {
        const t = (distEnd - segStart) / segLen;
        result.push([p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])]);
        break;
      }

      accumulated += segLen;
    }

    if (result.length < 2) {
      return [points[0], points[points.length - 1]];
    }
    return result;
  }

  /**
   * Xử lý phân làn, tim đường, vạch kẻ StVO và bó vỉa 3D cho một đoạn đường
   */
  _processRoadSegment(road) {
    const { points, startJunction, endJunction, startTrim, endTrim } = this._getTrimmedCenterline(road);
    if (!points || points.length < 2) {
      console.warn(`[LaneGraphGenerator] Road ${road.id} trimmed to <2 points, skipping`);
      return;
    }
    const normals = LaneGraphGenerator.computeNormals(points);

    const isOneway = !!road.oneway;
    const roadWidth = road.width || (isOneway ? 6.5 : 8.0);
    const rawLanes = road.lanes || (roadWidth >= 11 ? (isOneway ? 3 : 4) : 2);
    const totalLanes = Math.max(1, rawLanes);
    const halfW = roadWidth / 2;
    let roadDivOffset = 0;

    // 1. PHÂN BỔ LÀN ĐƯỜNG (LANES CONFIGURATION)
    const laneConfigs = [];

    if (isOneway) {
      // Đường một chiều: Tất cả làn đều chạy xuôi hướng polyline (FORWARD)
      const laneW = roadWidth / totalLanes;
      for (let i = 0; i < totalLanes; i++) {
        const offset = -halfW + (i + 0.5) * laneW;
        laneConfigs.push({
          laneIndex: i,
          direction: 'FORWARD',
          offset,
          width: laneW
        });
      }
    } else {
      // Đường 2 chiều (§ 2 StVO Rechtsfahrgebot)
      // Sử dụng số làn fwd / bwd thật từ OSM nếu có (lanes:forward / lanes:backward)
      let fwdCount = road.lanesForward;
      let bwdCount = road.lanesBackward;
      if (!fwdCount && !bwdCount) {
        bwdCount = Math.max(1, Math.floor(totalLanes / 2));
        fwdCount = Math.max(1, totalLanes - bwdCount);
      } else if (!fwdCount) {
        fwdCount = Math.max(1, totalLanes - bwdCount);
      } else if (!bwdCount) {
        bwdCount = Math.max(1, totalLanes - fwdCount);
      }

      const totalLanesAlloc = bwdCount + fwdCount;
      const laneW = roadWidth / totalLanesAlloc;
      const divOffset = -halfW + fwdCount * laneW; // Vị trí vạch tim đường phân cách 2 chiều
      roadDivOffset = divOffset;

      // § 2 StVO Rechtsfahrgebot (Lái xe bên phải theo luật Đức):
      // Khi polyline hướng tiến (+u), làn xuôi chiều (FORWARD) nằm bên phải hướng tiến (-halfW đến divOffset)
      for (let f = 0; f < fwdCount; f++) {
        let offset = -halfW + (f + 0.5) * laneW;
        if (Math.abs(offset) < 1e-10) offset = 0;
        laneConfigs.push({
          laneIndex: f,
          direction: 'FORWARD',
          offset,
          divOffset,
          width: laneW
        });
      }

      // Làn ngược chiều (BACKWARD) nằm bên phải hướng lùi (divOffset đến halfW)
      for (let b = 0; b < bwdCount; b++) {
        let offset = divOffset + (b + 0.5) * laneW;
        if (Math.abs(offset) < 1e-10) offset = 0;
        laneConfigs.push({
          laneIndex: b,
          direction: 'BACKWARD',
          offset,
          divOffset,
          width: laneW
        });
      }
    }

    // 2. SINH ĐƯỜNG TIM LÀN (LANE CENTERLINES CHO TRAFFIC AI & SIMULATION)
    for (const cfg of laneConfigs) {
      const laneCenterline = [];
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const { nx, nz, scale } = normals[i];
        const off = cfg.offset * scale;
        laneCenterline.push([p[0] + nx * off, p[1] + nz * off]);
      }

      // Đảo ngược thứ tự điểm nếu xe di chuyển BACKWARD để bot chạy đúng chiều tiếp tuyến
      const drivableWaypoints = cfg.direction === 'FORWARD'
        ? laneCenterline
        : laneCenterline.slice().reverse();

      const laneId = `${road.id}_lane_${cfg.direction.toLowerCase()}_${cfg.laneIndex}`;

      // Tính toán chiều dài làn
      let totalLength = 0;
      const segmentDists = [0];
      for (let i = 1; i < drivableWaypoints.length; i++) {
        const seg = Math.hypot(
          drivableWaypoints[i][0] - drivableWaypoints[i - 1][0],
          drivableWaypoints[i][1] - drivableWaypoints[i - 1][1]
        );
        totalLength += seg;
        segmentDists.push(totalLength);
      }

      // Kiểm tra nút giao tiếp cận ở cuối làn
      const targetJunction = cfg.direction === 'FORWARD' ? endJunction : startJunction;

      const isMotorway = ['motorway', 'trunk'].includes(road.highway);
      const isRamp = road.highway === 'motorway_link';
      const defaultSpeed = isRamp ? 80 : (isMotorway ? 130 : (road.speedLimit || 50));

      const isStandstreifen = isMotorway && laneConfigs.length >= 3 && cfg.laneIndex === 0;

      const laneObj = {
        id: laneId,
        roadId: road.id,
        roadName: road.name,
        highway: road.highway,
        direction: cfg.direction,
        laneIndex: cfg.laneIndex,
        isEmergencyLane: isStandstreifen,
        lateralOffset: cfg.offset,
        divOffset: cfg.divOffset !== undefined ? cfg.divOffset : 0,
        width: cfg.width,
        speedLimit: road.speedLimit || defaultSpeed,
        centerline: laneCenterline,
        drivableWaypoints,
        segmentDists,
        totalLength,
        startTrim: startTrim || 0,
        endTrim: endTrim || 0,
        targetJunctionId: targetJunction ? targetJunction.id : null
      };

      this.lanes.push(laneObj);
      this.laneMap.set(laneId, laneObj);
    }

    // 3. SINH VẠCH KẺ PHÂN LÀN StVO (LANE DIVIDERS & EDGE LINES)
    const isMotorwayRoad = ['motorway', 'trunk', 'motorway_link'].includes(road.highway);
    const edgeLineWidth = isMotorwayRoad ? 0.30 : 0.20; // Fahrbahnbegrenzung Zeichen 295: 30cm cho cao tốc
    const dashLenVal = isMotorwayRoad ? 6.0 : 3.0; // StVO Zeichen 340: 6m dash / 6m space cho Autobahn
    const gapLenVal = isMotorwayRoad ? 6.0 : 3.0;

    // 3.1 Vạch mép ngoài đường (Fahrbahnbegrenzung - Zeichen 295, nét liền)
    [-1, 1].forEach(side => {
      const edgePoints = [];
      const edgeOff = (halfW - 0.15) * side;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const { nx, nz, scale } = normals[i];
        edgePoints.push([p[0] + nx * edgeOff * scale, p[1] + nz * edgeOff * scale]);
      }
      this.dividers.push({
        type: 'SOLID',
        width: edgeLineWidth,
        points: edgePoints,
        roadId: road.id
      });
    });

    // 3.2 Vạch tim đường (Center Line) trên đường 2 chiều
    if (!isOneway) {
      let bwdCount = road.lanesBackward;
      let fwdCount = road.lanesForward;
      if (!bwdCount && !fwdCount) {
        bwdCount = Math.max(1, Math.floor(totalLanes / 2));
      } else if (!bwdCount) {
        bwdCount = Math.max(1, totalLanes - fwdCount);
      }
      const totalLanesAlloc = (bwdCount || 1) + (fwdCount || 1);
      const laneW = roadWidth / totalLanesAlloc;
      const divOffset = -halfW + bwdCount * laneW;

      const isStrictNoOvertake = road.overtaking === 'no' || road.hasCenterGuardrail;

      if (isStrictNoOvertake) {
        [-0.12, 0.12].forEach(dblOff => {
          const dblPoints = [];
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const { nx, nz, scale } = normals[i];
            dblPoints.push([p[0] + nx * (divOffset + dblOff) * scale, p[1] + nz * (divOffset + dblOff) * scale]);
          }
          this.dividers.push({
            type: 'SOLID',
            width: 0.15,
            points: dblPoints,
            roadId: road.id
          });
        });
      } else {
        // Vạch tim đường chuẩn StVO (Leitlinie Zeichen 340)
        const centerPoints = [];
        for (let i = 0; i < points.length; i++) {
          const p = points[i];
          const { nx, nz, scale } = normals[i];
          centerPoints.push([p[0] + nx * divOffset * scale, p[1] + nz * divOffset * scale]);
        }
        this.dividers.push({
          type: 'DASHED',
          width: 0.15,
          dashLen: dashLenVal,
          gapLen: gapLenVal,
          points: centerPoints,
          roadId: road.id
        });
      }
    }

    // 3.3 Vạch đứt quãng phân làn cùng chiều (Leitlinie giữa các làn)
    if (isOneway && totalLanes > 1) {
      const laneW = roadWidth / totalLanes;
      for (let i = 1; i < totalLanes; i++) {
        const divOff = -halfW + i * laneW;
        const divPoints = [];
        for (let k = 0; k < points.length; k++) {
          const p = points[k];
          const { nx, nz, scale } = normals[k];
          divPoints.push([p[0] + nx * divOff * scale, p[1] + nz * divOff * scale]);
        }
        this.dividers.push({
          type: 'DASHED',
          width: 0.15,
          dashLen: dashLenVal,
          gapLen: gapLenVal,
          points: divPoints,
          roadId: road.id
        });
      }
    } else if (!isOneway && totalLanes >= 4) {
      // Đường 2 chiều có nhiều làn mỗi bên (ví dụ 2 làn ngược, 2 làn xuôi)
      const bwdCount = Math.floor(totalLanes / 2);
      const fwdCount = totalLanes - bwdCount;
      const bwdLaneW = halfW / bwdCount;
      const fwdLaneW = halfW / fwdCount;

      // Giữa các làn ngược chiều
      for (let i = 1; i < bwdCount; i++) {
        const divOff = -halfW + i * bwdLaneW;
        const divPoints = [];
        for (let k = 0; k < points.length; k++) {
          const p = points[k];
          const { nx, nz, scale } = normals[k];
          divPoints.push([p[0] + nx * divOff * scale, p[1] + nz * divOff * scale]);
        }
        this.dividers.push({
          type: 'DASHED',
          width: 0.15,
          dashLen: dashLenVal,
          gapLen: gapLenVal,
          points: divPoints,
          roadId: road.id
        });
      }

      // Giữa các làn xuôi chiều
      for (let i = 1; i < fwdCount; i++) {
        const divOff = i * fwdLaneW;
        const divPoints = [];
        for (let k = 0; k < points.length; k++) {
          const p = points[k];
          const { nx, nz, scale } = normals[k];
          divPoints.push([p[0] + nx * divOff * scale, p[1] + nz * divOff * scale]);
        }
        this.dividers.push({
          type: 'DASHED',
          width: 0.12,
          dashLen: 3.0,
          gapLen: 3.0,
          points: divPoints,
          roadId: road.id
        });
      }
    }

    // 4. BÓ VỈA 3D & VỈA HÈ (3D GRANITE CURBS & RAISED SIDEWALKS)
    const curbWidth = 0.18; // Bề mặt trên bó vỉa đá rộng 18cm
    const swWidth = road.sidewalkWidth || (road.hasSidewalk ? 2.5 : 1.5);

    [-1, 1].forEach(side => {
      let currentSeg = { inner: [], top: [], sw: [] };
      const segments = [currentSeg];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const { nx, nz, scale } = normals[i];
        const curbInX = p[0] + nx * (halfW * scale) * side;
        const curbInZ = p[1] + nz * (halfW * scale) * side;

        // Bỏ qua điểm bó vỉa nếu nó rơi vào lòng đường của nhánh song song cùng tên (tránh cắt ngang làn xe tại điểm rẽ/nhập làn)
        if (this._isPointInsideSisterRoad(curbInX, curbInZ, road)) {
          if (currentSeg.inner.length > 0) {
            currentSeg = { inner: [], top: [], sw: [] };
            segments.push(currentSeg);
          }
          continue;
        }

        const curbOutX = p[0] + nx * ((halfW + curbWidth) * scale) * side;
        const curbOutZ = p[1] + nz * ((halfW + curbWidth) * scale) * side;
        const swOutX = p[0] + nx * ((halfW + curbWidth + swWidth) * scale) * side;
        const swOutZ = p[1] + nz * ((halfW + curbWidth + swWidth) * scale) * side;

        currentSeg.inner.push([curbInX, curbInZ]);
        currentSeg.top.push([curbOutX, curbOutZ]);
        currentSeg.sw.push([swOutX, swOutZ]);
      }

      for (const seg of segments) {
        if (seg.inner.length >= 2) {
          this.curbs.push({
            roadId: road.id,
            side,
            innerPoints: seg.inner,
            topOuterPoints: seg.top,
            swOuterPoints: seg.sw
          });
        }
      }
    });

    // 5. VẠCH DỪNG HALTELINIE TRƯỚC NGÃ TƯ (StVO Zeichen 294)
    // Quy chuẩn StVO: Phương tiện tiếp cận -> Haltelinie -> 1.5m -> Zebrastreifen (3.2m) -> 1.0m -> Giao lộ (Mouth)
    if (endJunction && !endJunction.isInlineJoint) {
      const hasCwEnd = endJunction.crosswalks && endJunction.crosswalks.some(cw => cw.roadId === road.id || cw.roadName === road.name);
      const slEnd = JunctionGeometryBuilder.computeStopLine({
        road,
        junction: endJunction,
        isEnd: true,
        hasCrosswalk: !!hasCwEnd,
        roadWidth,
        isOneway,
        roadDivOffset,
        normals,
        points
      });
      if (slEnd) this.stopLines.push(slEnd);
    }

    if (!isOneway && startJunction && !startJunction.isInlineJoint) {
      const hasCwStart = startJunction.crosswalks && startJunction.crosswalks.some(cw => cw.roadId === road.id || cw.roadName === road.name);
      const slStart = JunctionGeometryBuilder.computeStopLine({
        road,
        junction: startJunction,
        isEnd: false,
        hasCrosswalk: !!hasCwStart,
        roadWidth,
        isOneway,
        roadDivOffset,
        normals,
        points
      });
      if (slStart) this.stopLines.push(slStart);
    }
  }

  /**
   * Truy vấn làn đường gần nhất với tọa độ (x, z) và góc xoay xe
   */
  findNearestLane(x, z, heading = null) {
    let bestLane = null;
    let bestDist = Infinity;

    for (const lane of this.lanes) {
      const pts = lane.drivableWaypoints;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const lenSq = dx * dx + dz * dz;
        if (lenSq === 0) continue;

        // Hình chiếu điểm (x, z) lên đoạn thẳng
        let t = ((x - p1[0]) * dx + (z - p1[1]) * dz) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const projX = p1[0] + t * dx;
        const projZ = p1[1] + t * dz;
        const d = Math.hypot(x - projX, z - projZ);

        if (d < bestDist) {
          // Kiểm tra góc xoay nếu có
          if (heading !== null) {
            const segAngle = Math.atan2(-dx, -dz);
            let angleDiff = Math.abs(heading - segAngle);
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            angleDiff = Math.abs(angleDiff);

            // Phải cùng hướng trong phạm vi 90 độ (cos > 0)
            if (angleDiff > Math.PI * 0.55) continue;
          }

          bestDist = d;
          bestLane = {
            lane,
            dist: d,
            projX,
            projZ,
            segIndex: i
          };
        }
      }
    }

    return bestLane;
  }

  /**
   * Trả về danh sách hành lang lái xe (Corridors) tương thích hoàn toàn với TrafficAIManager
   */
  getDrivableCorridors() {
    return this.lanes.map(lane => ({
      id: lane.id,
      nameVi: `${lane.roadName} (${lane.direction === 'FORWARD' ? 'Xuôi' : 'Ngược'})`,
      nameDe: `${lane.roadName} (${lane.direction})`,
      speedLimitKmH: lane.speedLimit,
      laneOffset: 0, // Đã offset chính xác trên centerline
      waypoints: lane.drivableWaypoints,
      segmentDists: lane.segmentDists,
      totalLength: lane.totalLength,
      laneId: lane.id,
      lane: lane,
      lights: lane.targetJunctionId ? [{
        pathDist: Math.max(0, lane.totalLength - 3.0),
        junctionId: lane.targetJunctionId
      }] : []
    }));
  }
}
