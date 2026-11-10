/**
 * 🎓 ScenarioEngine.js
 * German Driving School (Fahrschule StVO) State Machine Evaluator
 */

export class ScenarioEngine {
  constructor() {
    this.blinkerChecked = false;
    this.schulterblickChecked = false;
    this.lastLaneX = 1.6;
    this.evaluationLog = [];
    this.score = 100;
  }

  evaluateFrame({ speed, carX, blinkerLeft, blinkerRight, headLookAngle, currentScenario, isDriving }) {
    if (!isDriving) return { score: this.score, log: this.evaluationLog };

    // 1. Detect Lane Change Attempt
    const laneDelta = carX - this.lastLaneX;
    const isChangingLane = Math.abs(laneDelta) > 0.6;

    if (isChangingLane) {
      const isLeft = laneDelta < -0.1;
      const hasBlinker = isLeft ? blinkerLeft : blinkerRight;
      const hasSchulterblick = isLeft ? (headLookAngle < -0.6) : (headLookAngle > 0.6);

      if (!hasBlinker && !this.blinkerChecked) {
        this.blinkerChecked = true;
        this.addPenalty('⚠️ Lỗi: Không bật xi-nhan trước khi đổi làn! (Blinker fehlt) (-10đ)', 10);
      }

      if (!hasSchulterblick && !this.schulterblickChecked) {
        this.schulterblickChecked = true;
        this.addPenalty('⚠️ Lỗi thi lái xe Đức: Thiếu Schulterblick quan sát góc điểm mù! (-15đ)', 15);
      }
    } else {
      this.blinkerChecked = false;
      this.schulterblickChecked = false;
      this.lastLaneX = carX;
    }

    // 2. Speed Limit Compliance
    const speedLimit = currentScenario?.limit || 50;
    if (speed > speedLimit + 5) {
      this.addPenalty(`⚠️ Vượt quá tốc độ cho phép! Tốc độ: ${Math.round(speed)} km/h (Giới hạn: ${speedLimit} km/h) (-10đ)`, 10);
    }

    return {
      score: this.score,
      log: this.evaluationLog,
      hasSchulterblick: Math.abs(headLookAngle) > 0.6,
      hasBlinker: blinkerLeft || blinkerRight
    };
  }

  addPenalty(msg, pts) {
    const now = Date.now();
    const recentSame = this.evaluationLog.find(e => e.msg === msg && (now - e.time) < 4000);
    if (!recentSame) {
      this.score = Math.max(0, this.score - pts);
      this.evaluationLog.push({ msg, passed: false, time: now, pts });
    }
  }

  reset() {
    this.blinkerChecked = false;
    this.schulterblickChecked = false;
    this.lastLaneX = 1.6;
    this.evaluationLog = [];
    this.score = 100;
  }
}
