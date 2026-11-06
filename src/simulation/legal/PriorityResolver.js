/**
 * ⚖️ StVO § 8 PRIORITY RESOLVER (RECHTS VOR LINKS & VORFAHRT)
 * Evaluates right-of-way rules at intersections, roundabouts, and pedestrian crossings.
 */
export class PriorityResolver {
  constructor(laneGraph = null, trafficRules = {}) {
    this.laneGraph = laneGraph;
    this.trafficRules = trafficRules;
  }

  resolvePriority(approach, junction) {
    return this.evaluatePriority({ x: 0, z: 0, heading: 0, speed: 30 }, null, junction, []);
  }

  /**
   * Tính toán quyền ưu tiên khi xe tiến vào ngã tư
   * @param {Object} playerState { x, z, heading, speed }
   * @param {Object} currentRoad Tuyến đường hiện tại
   * @param {Object} junction Ngã tư tiếp cận
   * @param {Array} botCars Danh sách xe AI xung quanh
   * @returns {Object} { canProceed, yieldTo, ruleCode, messageVi, messageDe }
   */
  evaluatePriority(playerState, currentRoad, junction, botCars = []) {
    if (!junction) {
      return { canProceed: true, yieldTo: null, ruleCode: 'FREE_FLOW', messageVi: 'Đường tự do', messageDe: 'Freie Fahrt' };
    }

    // 1. Nếu có Đèn giao thông StVO § 37
    if (junction.hasTrafficLight) {
      const isRed = junction.signalState === 'RED' || junction.signalState === 'YELLOW';
      if (isRed) {
        return {
          canProceed: false,
          yieldTo: 'TRAFFIC_LIGHT',
          ruleCode: 'STVO_37_RED_LIGHT',
          messageVi: 'Dừng lại trước đèn đỏ (§ 37 StVO)!',
          messageDe: 'Halt vor roter Ampel (§ 37 StVO)!'
        };
      }
    }

    // 2. Biển dừng STOP Zeichen 206 (§ 41 StVO)
    if (junction.hasStopSign && !playerState.hasStoppedComplete) {
      return {
        canProceed: false,
        yieldTo: 'STOP_SIGN',
        ruleCode: 'STVO_41_ZEICHEN_206',
        messageVi: 'Phải dừng hẳn 3 giây trước biển STOP (§ 41 StVO)!',
        messageDe: 'Halt am Stoppschild vorgeschrieben (§ 41 StVO)!'
      };
    }

    // 3. Quy tắc Ưu tiên Bên phải (§ 8 Abs. 1 StVO - Rechts vor Links)
    if (!currentRoad?.isPriorityRoad && !junction.hasTrafficLight) {
      const rightVehicle = this.findVehicleApproachingFromRight(playerState, junction, botCars);
      if (rightVehicle) {
        return {
          canProceed: false,
          yieldTo: rightVehicle,
          ruleCode: 'STVO_8_RECHTS_VOR_LINKS',
          messageVi: 'Nhường đường cho xe từ bên phải tới (§ 8 StVO - Rechts vor Links)!',
          messageDe: 'Vorfahrt gewähren: Rechts vor Links (§ 8 StVO)!'
        };
      }
    }

    // 4. Vạch qua đường Zebrastreifen (§ 26 StVO)
    const pedestrianNearZebra = this.checkPedestrianOnZebra(playerState, junction);
    if (pedestrianNearZebra) {
      return {
        canProceed: false,
        yieldTo: 'PEDESTRIAN',
        ruleCode: 'STVO_26_ZEBRASTREIFEN',
        messageVi: 'Nhường đường cho người đi bộ qua đường (Zebrastreifen § 26 StVO)!',
        messageDe: 'Vorrang für Fußgänger am Zebrastreifen (§ 26 StVO)!'
      };
    }

    return {
      canProceed: true,
      yieldTo: null,
      ruleCode: 'VORFAHRT_OK',
      messageVi: 'Được phép di chuyển an toàn',
      messageDe: 'Vorfahrt frei'
    };
  }

  /**
   * Phát hiện xe AI đi từ nhánh bên phải tới ngã tư
   */
  findVehicleApproachingFromRight(playerState, junction, botCars) {
    if (!botCars || botCars.length === 0) return null;
    const playerHeading = playerState.heading || 0;
    const rightHeading = playerHeading + Math.PI / 2; // Góc 90 độ bên phải

    for (const bot of botCars) {
      if (!bot.mesh) continue;
      const dx = bot.mesh.position.x - junction.center[0];
      const dz = bot.mesh.position.z - junction.center[1];
      const distToJunction = Math.hypot(dx, dz);

      if (distToJunction < 18.0) {
        const botAngle = Math.atan2(bot.mesh.position.x - playerState.x, bot.mesh.position.z - playerState.z);
        const diff = Math.abs(botAngle - rightHeading);
        if (diff < 0.6) {
          return bot;
        }
      }
    }
    return null;
  }

  /**
   * Kiểm tra người đi bộ tại vạch Zebrastreifen
   */
  checkPedestrianOnZebra(playerState, junction) {
    if (!junction.hasCrosswalk) return false;
    // Kiểm tra khoảng cách xe tới ngã tư zebra
    const dx = playerState.x - junction.center[0];
    const dz = playerState.z - junction.center[1];
    return Math.hypot(dx, dz) < 12.0 && playerState.speed > 5.0;
  }
}
