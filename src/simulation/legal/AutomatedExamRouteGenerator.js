/**
 * Automated Exam Route Generator (Hệ Thống Tự Động Sinh Bài Thi Lái Xe Từ Đồ Thị OSM)
 * ===================================================================================
 * 
 * Thay thế hoàn toàn các directive hard-code cố định:
 * 1. Nhận điểm xuất phát (Fixed Spawn hoặc vị trí hiện tại của xe).
 * 2. Tự động duyệt qua đồ thị mạng đường (OSM Road Graph) bằng thuật toán DFS Backtracking.
 * 3. Tìm các ngã tư thực thụ (True Intersections: kết nối >= 3 nhánh), bỏ qua các node chia đoạn thẳng.
 * 4. Tạo ra một lộ trình thi sát hạch thực tế 5 chặng liên thông 100%, không cụt đường, không ngược chiều oneway.
 * 5. Hỗ trợ cả 2 chế độ:
 *    - Multi-Stage Exam Itinerary: Lộ trình 5 giao lộ liên tiếp với tiến độ "Giao lộ 1/5", "2/5", ...
 *    - Streaming Live Mode: Sinh hiệu lệnh động theo thời gian thực khi xe chạy tự do.
 */

import { roadNetwork } from '../RoadNetworkGraph.js';

export class AutomatedExamRouteGenerator {
  constructor() {
    this.historyDirectives = [];
  }

  /**
   * Lần theo một tuyến đường qua các điểm trung gian (node bậc 2) để tìm ngã tư thực thụ tiếp theo (bậc >= 3)
   */
  followStreetToJunction(startRoad, fromNode, visitedRoads = new Set()) {
    let curRoad = startRoad;
    let curNode = fromNode;
    let targetNode = (curRoad.startNode === curNode) ? curRoad.endNode : curRoad.startNode;
    let distance = curRoad.length || 20;

    while (true) {
      const conns = roadNetwork.nodeToRoads?.get(targetNode) || [];
      // Nếu là ngã 3, ngã 4 trở lên (conns >= 3) hoặc đường cụt (conns <= 1) -> Đây là điểm giao cắt chính
      if (conns.length !== 2) {
        return { finalJunctionNode: targetNode, arrivingRoad: curRoad, totalDist: Math.round(distance) };
      }

      // Đúng 2 đoạn gặp nhau: 1 đoạn hiện tại, 1 đoạn tiếp nối cùng trục đường
      const nextRoad = conns.find(r => r.id !== curRoad.id);
      if (!nextRoad || visitedRoads.has(nextRoad.id)) {
        return { finalJunctionNode: targetNode, arrivingRoad: curRoad, totalDist: Math.round(distance) };
      }

      // Kiểm tra đường một chiều: không được đi ngược chiều quy định
      if (nextRoad.oneway && nextRoad.endNode === targetNode) {
        return { finalJunctionNode: targetNode, arrivingRoad: curRoad, totalDist: Math.round(distance) };
      }

      visitedRoads.add(nextRoad.id);
      curRoad = nextRoad;
      curNode = targetNode;
      targetNode = (curRoad.startNode === curNode) ? curRoad.endNode : curRoad.startNode;
      distance += (curRoad.length || 20);
      if (distance > 1200) break; // Giới hạn an toàn tránh vòng lặp
    }

    return { finalJunctionNode: targetNode, arrivingRoad: curRoad, totalDist: Math.round(distance) };
  }

  /**
   * Sinh một lộ trình thi sát hạch hoàn chỉnh gồm nhiều nút giao liên tiếp từ OSM bằng DFS Backtracking
   * @param {Object} startPos { x, z, heading }
   * @param {number} stageCount Số lượng nút giao cần vượt qua trong bài thi (mặc định 5 giao lộ)
   */
  generateExamItinerary(startPos = { x: 2.5, z: 25.0, heading: 0 }, stageCount = 5) {
    const nearest = roadNetwork.findNearestSegment(startPos.x, startPos.z, startPos.heading);
    const startRoad = nearest ? nearest.road : (roadNetwork.roads[0] || null);

    if (!startRoad) {
      return { id: `itinerary_${Date.now()}`, totalStages: 0, stages: [] };
    }

    // Xác định node phía trước theo hướng di chuyển của xe
    const isGoingToEnd = nearest ? (nearest.travelDir === 1) : true;
    const startFromNode = isGoingToEnd ? startRoad.startNode : startRoad.endNode;

    const initialVisited = new Set([startRoad.id]);
    const initialHop = this.followStreetToJunction(startRoad, startFromNode, initialVisited);

    const self = this;

    // Thuật toán DFS tìm kiếm đường đi liên thông đủ stageCount giao lộ
    function dfs(juncNode, currentRoad, visited, path) {
      if (path.length === stageCount) return path;

      const conns = roadNetwork.nodeToRoads?.get(juncNode) || [];
      // Lọc các nhánh có thể đi: chưa thăm và không đi ngược đường 1 chiều
      const drivable = conns
        .filter(r => !visited.has(r.id))
        .filter(r => !(r.oneway && r.endNode === juncNode));

      if (drivable.length === 0) return null;

      // Tính vector tới của dòng xe tại giao lộ
      const isCurrentEnd = currentRoad.endNode === juncNode;
      const inP1 = isCurrentEnd ? currentRoad.centerline[currentRoad.centerline.length - 1] : currentRoad.centerline[0];
      const inP0 = isCurrentEnd ? currentRoad.centerline[currentRoad.centerline.length - 2] : currentRoad.centerline[1];
      const inDx = inP1[0] - inP0[0];
      const inDz = inP1[1] - inP0[1];
      const inAngle = Math.atan2(inDx, inDz);

      const branches = drivable.map(nextR => {
        const isNextStart = nextR.startNode === juncNode;
        const outP0 = isNextStart ? nextR.centerline[0] : nextR.centerline[nextR.centerline.length - 1];
        const outP1 = isNextStart ? nextR.centerline[1] : nextR.centerline[nextR.centerline.length - 2];
        const outDx = outP1[0] - outP0[0];
        const outDz = outP1[1] - outP0[1];
        const outAngle = Math.atan2(outDx, outDz);

        let rel = outAngle - inAngle;
        while (rel > Math.PI) rel -= 2 * Math.PI;
        while (rel < -Math.PI) rel += 2 * Math.PI;
        const deg = Math.round((rel * 180) / Math.PI);

        let m = 'STRAIGHT';
        if (deg > 35 && deg < 145) m = 'RIGHT';
        else if (deg < -35 && deg > -145) m = 'LEFT';
        else if (Math.abs(deg) >= 145) m = 'U_TURN';

        return { road: nextR, maneuver: m, deg, outPoint: outP0 };
      }).filter(b => b.maneuver !== 'U_TURN');

      if (branches.length === 0) return null;

      // Xáo trộn ngẫu nhiên các nhánh nhưng ưu tiên rẽ (RIGHT/LEFT) để tạo bài thi đa dạng
      branches.sort((a, b) => {
        const aTurn = a.maneuver !== 'STRAIGHT' ? 1 : 0;
        const bTurn = b.maneuver !== 'STRAIGHT' ? 1 : 0;
        if (aTurn !== bTurn) return (bTurn - aTurn) * (Math.random() < 0.7 ? 1 : -1);
        return Math.random() - 0.5;
      });

      for (const b of branches) {
        const nextVisited = new Set(visited);
        nextVisited.add(b.road.id);
        const nextHop = self.followStreetToJunction(b.road, juncNode, nextVisited);

        const stageStep = {
          juncNode,
          junctionPoint: inP1,
          fromRoad: currentRoad,
          selectedBranch: b,
          distToJunc: nextHop.totalDist
        };

        const res = dfs(nextHop.finalJunctionNode, nextHop.arrivingRoad, nextVisited, [...path, stageStep]);
        if (res) return res;
      }

      return null;
    }

    const rawPath = dfs(initialHop.finalJunctionNode, initialHop.arrivingRoad, initialVisited, []) || [];
    
    // Đóng gói các chặng thành danh sách Directive hoàn chỉnh
    const stages = rawPath.map((step, idx) => {
      // Tìm polygon junction tương ứng trong roadNetwork
      let matchedJunc = null;
      let bestDist = Infinity;
      for (const j of (roadNetwork.junctions || [])) {
        const d = Math.hypot(step.junctionPoint[0] - j.center[0], step.junctionPoint[1] - j.center[1]);
        if (d < 28.0 && d < bestDist) {
          bestDist = d;
          matchedJunc = j;
        }
      }

      const junctionObj = matchedJunc || {
        id: `junc_node_${step.juncNode}`,
        center: step.junctionPoint,
        hasTrafficLight: step.fromRoad.hasTrafficSignal || false,
        priorityRule: step.fromRoad.hasTrafficSignal ? 'AMPEL' : 'RECHTS_VOR_LINKS'
      };

      const upcomingInfo = {
        junction: junctionObj,
        incomingRoad: step.fromRoad,
        center: junctionObj.center,
        distance: idx === 0 ? Math.round(Math.hypot(startPos.x - junctionObj.center[0], startPos.z - junctionObj.center[1])) : step.distToJunc,
        hasTrafficLight: !!junctionObj.hasTrafficLight,
        hasStopSign: !!junctionObj.hasStopSign,
        hasGiveWay: !!junctionObj.hasGiveWay,
        priorityRule: junctionObj.priorityRule || (junctionObj.hasTrafficLight ? 'AMPEL' : 'RECHTS_VOR_LINKS'),
        inferredPriorityBasis: junctionObj.inferredPriorityBasis || (junctionObj.hasTrafficLight ? 'EXPLICIT_SIGNAL' : 'HEURISTIC_RIGHT_BEFORE_LEFT')
      };

      return this.buildDirectiveObject(upcomingInfo, step.selectedBranch, idx + 1, rawPath.length);
    });

    return {
      id: `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      startLocation: { ...startPos },
      totalStages: stages.length,
      stages
    };
  }

  /**
   * Sinh hiệu lệnh động trực tiếp tại thời điểm hiện tại cho xe đang lưu thông (Streaming Mode)
   */
  generateLiveDirective(carX, carZ, heading) {
    const upcoming = roadNetwork.findUpcomingIntersection(carX, carZ, heading, 320);

    if (!upcoming || !upcoming.branches || upcoming.branches.length === 0) {
      return {
        id: `dir_straight_${Date.now()}`,
        maneuver: 'STRAIGHT',
        arrow: '⬆️',
        color: '#38bdf8',
        commandDe: 'Fahren Sie auf dieser Straße geradeaus weiter.',
        commandVi: 'Tiếp tục đi thẳng trên đoạn đường này.',
        lawBadge: '§ 2 StVO (Giữ làn đường)',
        speedLimit: 50,
        targetSpeedLimit: 50,
        targetCenter: [carX, carZ + 50],
        distanceToJunc: 50,
        incomingRoadId: null,
        expectedRoadId: null,
        expectedRoadName: 'Straße',
        hasTrafficLight: false,
        hasStopSign: false,
        hasGiveWay: false,
        inferredPriorityRule: 'RECHTS_VOR_LINKS',
        inferredPriorityBasis: 'HEURISTIC_RIGHT_BEFORE_LEFT',
        isDefaultKeepStraight: true
      };
    }

    const branches = upcoming.branches;
    const turnBranches = branches.filter(b => b.maneuver === 'RIGHT' || b.maneuver === 'LEFT');
    const selectedBranch = (turnBranches.length > 0 && Math.random() < 0.7)
      ? turnBranches[Math.floor(Math.random() * turnBranches.length)]
      : branches[Math.floor(Math.random() * branches.length)];

    return this.buildDirectiveObject(upcoming, selectedBranch);
  }

  /**
   * Định dạng câu lệnh tiếng Đức và tiếng Việt chuẩn văn phong Giám khảo Fahrprüfung
   */
  buildDirectiveObject(upcoming, selectedBranch, stageIndex = null, totalStages = null) {
    const junction = upcoming.junction;
    const incomingRoad = upcoming.incomingRoad;
    const center = upcoming.center;
    const distance = upcoming.distance;

    const maneuver = selectedBranch.maneuver;
    const targetName = selectedBranch.road?.name || selectedBranch.name || 'die Querstraße';
    const isZone30 = (selectedBranch.road?.speedLimit <= 30 || selectedBranch.speedLimit <= 30);
    const hasSignal = !!upcoming.hasTrafficLight;
    const priorityRule = upcoming.priorityRule || (hasSignal ? 'AMPEL' : 'RECHTS_VOR_LINKS');
    const priorityBasis = upcoming.inferredPriorityBasis || (hasSignal ? 'EXPLICIT_SIGNAL' : 'HEURISTIC_RIGHT_BEFORE_LEFT');
    const isStopSign = (priorityRule === 'STOP' || !!upcoming.hasStopSign);
    const isGiveWay = (priorityRule === 'GIVE_WAY' || !!upcoming.hasGiveWay);

    let commandDe = '';
    let commandVi = '';
    let arrow = '⬆️';
    let color = '#38bdf8';
    let lawBadge = '§ 9 StVO (Abbiegen)';

    if (maneuver === 'RIGHT') {
      arrow = '↗️';
      color = '#22c55e';
      if (isStopSign) {
        commandDe = `Halten Sie am Stoppschild an und biegen Sie rechts ab auf ${targetName}.`;
        commandVi = `Dừng hẳn trước biển STOP và rẽ phải vào đường ${targetName}.`;
        lawBadge = '§ 41 StVO (STOP Zeichen 206) & § 9 StVO';
      } else if (isZone30) {
        commandDe = `Biegen Sie an der nächsten Kreuzung rechts ab in die Tempo-30-Zone (${targetName}).`;
        commandVi = `Ở ngã tư kế tiếp, hãy rẽ phải vào khu vực 30 km/h (${targetName}).`;
        lawBadge = '§ 9 StVO (Rẽ phải) & § 45 StVO (Zone 30)';
      } else if (hasSignal) {
        commandDe = `Biegen Sie an der nächsten Ampelkreuzung rechts ab auf ${targetName}.`;
        commandVi = `Ở ngã tư có đèn tín hiệu kế tiếp, hãy rẽ phải vào ${targetName}.`;
        lawBadge = '§ 37 StVO (Đèn Ampel) & § 9 StVO';
      } else if (isGiveWay) {
        commandDe = `Achten Sie auf die Vorfahrt und biegen Sie rechts ab auf ${targetName}.`;
        commandVi = `Chú ý nhường đường (Vorfahrt gewähren) và rẽ phải vào ${targetName}.`;
        lawBadge = '§ 41 StVO (Zeichen 205) & § 9 StVO';
      } else {
        commandDe = `Biegen Sie an der nächsten Kreuzung rechts ab auf ${targetName}.`;
        commandVi = `Ở ngã tư kế tiếp, hãy rẽ phải vào đường ${targetName}.`;
        lawBadge = '§ 9 Abs. 1 StVO (Xi-nhan & Schulterblick xe đạp)';
      }
    } else if (maneuver === 'LEFT') {
      arrow = '↖️';
      color = '#3b82f6';
      if (isStopSign) {
        commandDe = `Halten Sie am Stoppschild an und biegen Sie links ab auf ${targetName}.`;
        commandVi = `Dừng hẳn trước biển STOP và rẽ trái vào đường ${targetName}.`;
        lawBadge = '§ 41 StVO (STOP Zeichen 206) & § 9 StVO';
      } else if (hasSignal) {
        commandDe = `Biegen Sie an der nächsten Ampelkreuzung links ab auf ${targetName}.`;
        commandVi = `Ở ngã tư đèn tín hiệu tới, hãy rẽ trái vào ${targetName}.`;
        lawBadge = '§ 37 StVO (Đèn Ampel) & § 9 Abs. 3 StVO';
      } else if (isGiveWay) {
        commandDe = `Achten Sie auf Vorfahrt und biegen Sie links ab auf ${targetName}.`;
        commandVi = `Nhường đường xe ưu tiên và rẽ trái vào đường ${targetName}.`;
        lawBadge = '§ 41 StVO (Zeichen 205) & § 9 StVO';
      } else {
        commandDe = `Biegen Sie an der nächsten Kreuzung links ab auf ${targetName}.`;
        commandVi = `Ở ngã tư kế tiếp, hãy rẽ trái vào đường ${targetName}.`;
        lawBadge = '§ 9 Abs. 3 StVO (Nhường dòng xe đi thẳng)';
      }
    } else {
      arrow = '⬆️';
      color = '#f59e0b';
      if (hasSignal) {
        commandDe = `Fahren Sie an der nächsten Ampelkreuzung geradeaus weiter.`;
        commandVi = `Đi thẳng qua ngã tư có đèn tín hiệu giao thông tiếp theo.`;
        lawBadge = '§ 37 StVO (Chấp hành đèn tín hiệu)';
      } else if (priorityRule === 'RECHTS_VOR_LINKS') {
        commandDe = `Fahren Sie an der nächsten Kreuzung geradeaus weiter auf ${targetName}.`;
        commandVi = `Đi thẳng qua ngã tư kế tiếp vào ${targetName} (Chú ý Rechts vor Links).`;
        lawBadge = '§ 8 Abs. 1 StVO (Rechts vor Links)';
      } else {
        commandDe = `Fahren Sie an der nächsten Kreuzung geradeaus weiter auf ${targetName}.`;
        commandVi = `Tiếp tục đi thẳng qua ngã tư kế tiếp vào ${targetName}.`;
        lawBadge = '§ 8 StVO (Quyền ưu tiên tại ngã tư)';
      }
    }

    return {
      id: `dir_${junction.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      stageIndex,
      totalStages,
      stageLabel: stageIndex && totalStages ? `Giao lộ ${stageIndex}/${totalStages}` : null,
      maneuver,
      arrow,
      color,
      commandDe,
      commandVi,
      lawBadge,
      speedLimit: incomingRoad.speedLimit || 50,
      targetSpeedLimit: selectedBranch.road?.speedLimit || selectedBranch.speedLimit || 50,
      targetCenter: center,
      distanceToJunc: distance,
      incomingRoadId: incomingRoad.id,
      expectedRoadId: selectedBranch.road?.id,
      expectedRoadName: targetName,
      hasTrafficLight: hasSignal,
      hasStopSign: isStopSign,
      hasGiveWay: isGiveWay,
      inferredPriorityRule: priorityRule,
      inferredPriorityBasis: priorityBasis,
      junction
    };
  }
}

export const autoRouteGenerator = new AutomatedExamRouteGenerator();
