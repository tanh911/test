/**
 * 👨‍✈️ EXAMINER RULE ENGINE & LIVE StVO EVALUATION (Hệ Thống Giám Sát Sát Hạch Thực Hành Lái Xe)
 * ==============================================================================================
 * 
 * Clean Architecture Overview:
 * ┌──────────────────────────────┐
 * │       OSM / PBF DATA         │  (Nodes, Drivable Ways, Tags)
 * └──────────────┬───────────────┘
 *                ↓
 * ┌──────────────────────────────┐
 * │       ROAD GRAPH             │  (RoadNetworkGraph: Topology, Segments, Inferred Priority)
 * └──────────────┬───────────────┘
 *                ↓
 * ┌──────────────────────────────┐
 * │      LEGAL RULE ENGINE       │  (LegalRuleDefinitions: § 9, § 8, § 37, § 41, § 3 StVO)
 * └──────────────┬───────────────┘
 *                ↓
 * ┌──────────────────────────────┐
 * │       EXAM SCORING           │  (ExamScoringEngine: Fehler, Schwerer Fehler, FeV Grading)
 * └──────────────────────────────┘
 */

import { roadNetwork } from './RoadNetworkGraph.js';
import { speakExaminerDirective } from './data/berlinDirectives.js';
import { LEGAL_RULES, SIMULATION_THRESHOLDS } from './legal/LegalRuleDefinitions.js';
import { ExamScoringEngine, FAULT_SEVERITY } from './legal/ExamScoringEngine.js';
import { autoRouteGenerator } from './legal/AutomatedExamRouteGenerator.js';

export class ExaminerRuleEngine {
  constructor() {
    this.scoringEngine = new ExamScoringEngine(100, 70);
    this.routeGenerator = autoRouteGenerator;

    this.currentDirective = null;
    this.phase = 'IDLE'; // 'IDLE', 'APPROACHING', 'AT_JUNCTION', 'COMPLETED'
    
    // Quản lý lộ trình sát hạch nhiều chặng (Multi-stage Itinerary)
    this.currentItinerary = null;
    this.currentStageIndex = 0;

    // Trạng thái kiểm tra kỹ thuật lái của lượt rẽ hiện tại
    this.blinkerActivated = false;
    this.blinkerTimely = false;
    this.schulterblickChecked = false;
    this.speedWarningGiven = false;
    this.stopSignHoldTime = 0;
    this.hasStoppedAtStopLine = false;
    this.stopSignViolationGiven = false;
    this.hasEnteredJunction = false;
    this.completionCooldown = 0;
    this.ruleResolver = null;
  }

  /**
   * Gán bộ phân giải luật StVO chuẩn (TrafficRuleResolver)
   */
  setRuleResolver(resolver) {
    this.ruleResolver = resolver;
  }

  // --- GETTERS DÀNH CHO HUD & TƯƠNG THÍCH NGƯỢC ---
  get score() {
    return this.scoringEngine.score;
  }
  set score(val) {
    this.scoringEngine.score = val;
  }

  get violations() {
    return this.scoringEngine.faults.map(f => ({
      rule: f.paragraph,
      titleDe: f.legalTitleDe,
      titleVi: f.detailsVi,
      penalty: f.penalty,
      isCritical: f.leadsToImmediateFailure,
      timestamp: f.timestamp
    }));
  }
  set violations(val) {
    // Không ghi đè trực tiếp để giữ tính toàn vẹn của scoringEngine
    if (Array.isArray(val) && val.length === 0) {
      this.scoringEngine.faults = [];
    }
  }

  get recentFeedback() {
    return this.scoringEngine.recentFeedback;
  }
  set recentFeedback(val) {
    this.scoringEngine.recentFeedback = val;
  }

  get status() {
    return this.scoringEngine.status;
  }

  /**
   * Khởi tạo lại bài kiểm tra từ vị trí ban đầu
   */
  reset(startX = 2.5, startZ = 25.0, heading = 0) {
    this.scoringEngine.reset();
    this.currentItinerary = null;
    this.currentStageIndex = 0;
    this.generateNextDirective(startX, startZ, heading);
  }

  /**
   * Khởi tạo một kỳ thi sát hạch hoàn chỉnh gồm nhiều ngã tư liên tiếp từ OSM
   * @param {Object} startPos { x, z, heading }
   * @param {number} stageCount Số lượng nút giao cần vượt qua (mặc định 5)
   */
  startMultiStageExam(startPos = { x: 2.5, z: 25.0, heading: 0 }, stageCount = 5) {
    this.scoringEngine.reset();
    this.currentItinerary = this.routeGenerator.generateExamItinerary(startPos, stageCount);
    this.currentStageIndex = 0;

    if (this.currentItinerary.stages.length > 0) {
      this.loadDirective(this.currentItinerary.stages[0]);
    } else {
      this.generateNextDirective(startPos.x, startPos.z, startPos.heading);
    }
  }

  /**
   * Tải một đối tượng directive và phát giọng nói Giám khảo
   */
  loadDirective(directive) {
    this.currentDirective = directive;
    this.phase = 'APPROACHING';
    this.blinkerActivated = false;
    this.blinkerTimely = false;
    this.schulterblickChecked = false;
    this.speedWarningGiven = false;
    this.stopSignHoldTime = 0;
    this.hasStoppedAtStopLine = false;
    this.stopSignViolationGiven = false;
    this.hasEnteredJunction = false;

    // Giọng nói hiệu lệnh chỉ được phát khi xe đã khởi động động cơ (được điều khiển từ Engine loop/Ignition start)
    return this.currentDirective;
  }

  /**
   * Tự động sinh hiệu lệnh tiếp theo từ đồ thị mạng đường OSM (Streaming Mode)
   */
  generateNextDirective(carX, carZ, heading) {
    const directive = this.routeGenerator.generateLiveDirective(carX, carZ, heading);
    return this.loadDirective(directive);
  }

  /**
   * Ghi nhận một lỗi vi phạm luật StVO thông qua ExamScoringEngine
   */
  addViolation(ruleKeyOrText, titleDe, titleVi, penalty, isCritical = false) {
    let legalRule = Object.values(LEGAL_RULES).find(r => r.paragraph.includes(ruleKeyOrText) || r.id === ruleKeyOrText);
    if (!legalRule) {
      legalRule = {
        id: 'CUSTOM_STVO_RULE',
        paragraph: ruleKeyOrText || 'StVO',
        titleDe: titleDe || 'Verkehrsverstoß',
        titleVi: titleVi || 'Lỗi vi phạm giao thông',
        descriptionDe: titleDe,
        descriptionVi: titleVi
      };
    }

    const severity = isCritical
      ? FAULT_SEVERITY.SCHWERER_FEHLER
      : (penalty >= 10 ? FAULT_SEVERITY.MITTLERER_FEHLER : FAULT_SEVERITY.LEICHTER_FEHLER);

    return this.scoringEngine.recordFault(legalRule, severity, {
      penalty,
      detailsVi: titleVi,
      detailsDe: titleDe
    });
  }

  /**
   * Cập nhật đánh giá StVO mỗi frame mô phỏng
   */
  update(dt, carState) {
    this.scoringEngine.update(dt);

    if (this.completionCooldown > 0) {
      this.completionCooldown -= dt;
      if (this.completionCooldown <= 0 && this.phase === 'COMPLETED') {
        // Chuyển sang nút giao tiếp theo trong bài thi
        if (this.currentItinerary && this.currentStageIndex + 1 < this.currentItinerary.totalStages) {
          this.currentStageIndex++;
          this.loadDirective(this.currentItinerary.stages[this.currentStageIndex]);
        } else if (this.currentItinerary && this.currentStageIndex + 1 >= this.currentItinerary.totalStages) {
          // Hoàn thành toàn bộ lộ trình bài thi!
          const verdict = this.scoringEngine.getExamVerdict();
          this.scoringEngine.recordSuccess(
            verdict.isPassed ? '✓ XUẤT SẮC! Hoàn thành toàn bộ bài thi sát hạch StVO!' : 'Đã kết thúc bài thi.',
            verdict.summaryDe
          );
          this.phase = 'IDLE';
        } else {
          // Streaming mode: Tự động tìm ngã tư kế tiếp theo hướng xe đang chạy
          const nextDir = this.generateNextDirective(carState.x, carState.z, carState.heading);
          if (nextDir && nextDir.commandDe) {
            speakExaminerDirective(nextDir.commandDe);
          }
        }
      }
    }

    if (!this.currentDirective) return;

    const { x, z, speed, blinkerLeft, blinkerRight, headLookAngle, isDriving } = carState;
    if (!isDriving) return;

    const [tx, tz] = this.currentDirective.targetCenter;
    const distToJunc = Math.hypot(x - tx, z - tz);
    this.currentDirective.distanceToJunc = Math.round(distToJunc);

    const maneuver = this.currentDirective.maneuver;

    // ── GIAI ĐOẠN 1: TIẾP CẬN NGÃ TƯ (APPROACHING) ──────────────────────────
    if (this.phase === 'APPROACHING') {
      // 1. Kiểm tra xi-nhan trước khi rẽ (§ 9 Abs. 1 StVO: Timely indicator proxy)
      if (maneuver === 'RIGHT') {
        if (blinkerRight) {
          this.blinkerActivated = true;
          if (distToJunc >= SIMULATION_THRESHOLDS.INDICATOR_DISTANCE_M) {
            this.blinkerTimely = true;
          }
        }
      } else if (maneuver === 'LEFT') {
        if (blinkerLeft) {
          this.blinkerActivated = true;
          if (distToJunc >= SIMULATION_THRESHOLDS.INDICATOR_DISTANCE_M) {
            this.blinkerTimely = true;
          }
        }
      }

      // 2. Kiểm tra quan sát điểm mù Schulterblick (§ 9 Abs. 3 StVO)
      if (Math.abs(headLookAngle || 0) > SIMULATION_THRESHOLDS.HEAD_LOOK_MIN_RAD) {
        this.schulterblickChecked = true;
      }

      // 3. Kiểm tra tốc độ trên đoạn đường tiếp cận (§ 3 Abs. 1 & 3 StVO)
      let allowedSpeed = 50;
      if (typeof carState.authoritativeSpeedLimit === 'number') {
        allowedSpeed = carState.authoritativeSpeedLimit;
      } else if (this.ruleResolver && this.ruleResolver.laneGraph) {
        const nearest = this.ruleResolver.laneGraph.findNearestLane(x, z, carState.heading);
        if (nearest && nearest.lane) {
          const res = this.ruleResolver.getSpeedLimit({
            lane: nearest.lane,
            distAlongLane: nearest.dist
          });
          allowedSpeed = res.value;
        } else {
          allowedSpeed = this.currentDirective.speedLimit || 50;
        }
      } else {
        allowedSpeed = this.currentDirective.speedLimit || 50;
      }

      if (speed > allowedSpeed + SIMULATION_THRESHOLDS.SPEED_LIMIT_TOLERANCE_KMH && !this.speedWarningGiven) {
        this.speedWarningGiven = true;
        this.scoringEngine.recordFault(
          LEGAL_RULES.STVO_3_SPEED_LIMIT,
          FAULT_SEVERITY.MITTLERER_FEHLER,
          {
            penalty: 10,
            detailsVi: `Chạy quá tốc độ (${Math.round(speed)} km/h trên đoạn quy định ${allowedSpeed} km/h)`,
            detailsDe: `Geschwindigkeitsüberschreitung (${Math.round(speed)} km/h bei erlaubten ${allowedSpeed} km/h)`
          }
        );
      }

      // 4. Kiểm tra nghĩa vụ dừng xe tại biển STOP (§ 41 Abs. 1 StVO i.V.m. Zeichen 206)
      // Sử dụng ngưỡng mô phỏng tốc độ < 0.8 km/h trong >= 0.7s để xác nhận bánh xe dừng hoàn toàn
      if (this.currentDirective.hasStopSign && distToJunc <= SIMULATION_THRESHOLDS.STOP_LINE_SEARCH_RADIUS_M) {
        if (speed < SIMULATION_THRESHOLDS.STOP_SPEED_MAX_KMH) {
          this.stopSignHoldTime += dt;
          if (this.stopSignHoldTime >= SIMULATION_THRESHOLDS.STOP_CONFIRMATION_TIME_S) {
            this.hasStoppedAtStopLine = true;
          }
        }
      }

      // Chuyển sang GIAI ĐOẠN 2 khi xe vào bán kính ngã tư (< JUNCTION_ENTRY_RADIUS_M = 16m)
      if (distToJunc <= SIMULATION_THRESHOLDS.JUNCTION_ENTRY_RADIUS_M) {
        this.phase = 'AT_JUNCTION';
        this.hasEnteredJunction = true;

        // Phạt nếu có biển STOP mà không dừng hẳn (Schwerer Fehler -> Sofortiges Nichtbestehen)
        if (this.currentDirective.hasStopSign && !this.hasStoppedAtStopLine && !this.stopSignViolationGiven) {
          this.stopSignViolationGiven = true;
          this.scoringEngine.recordFault(
            LEGAL_RULES.STVO_41_STOP,
            FAULT_SEVERITY.SCHWERER_FEHLER,
            {
              penalty: 25,
              detailsVi: 'Không dừng hẳn xe tại biển STOP (Zeichen 206) - Lỗi nghiêm trọng trượt trực tiếp!',
              detailsDe: 'Haltgebot am Stoppschild nicht beachtet (Zeichen 206 - Schwerer Fehler).'
            }
          );
        }

        // Đánh giá bật đèn xi-nhan (§ 9 Abs. 1 StVO)
        if ((maneuver === 'RIGHT' || maneuver === 'LEFT') && !this.blinkerActivated) {
          this.scoringEngine.recordFault(
            LEGAL_RULES.STVO_9_ABS_1_INDICATOR,
            FAULT_SEVERITY.MITTLERER_FEHLER,
            {
              penalty: 15,
              detailsVi: `Không bật đèn xi-nhan ${maneuver === 'RIGHT' ? 'phải' : 'trái'} trước khi rẽ`,
              detailsDe: 'Kein Fahrtrichtungsanzeiger beim Abbiegen gesetzt'
            }
          );
        } else if ((maneuver === 'RIGHT' || maneuver === 'LEFT') && !this.blinkerTimely) {
          this.scoringEngine.recordFault(
            LEGAL_RULES.STVO_9_ABS_1_INDICATOR,
            FAULT_SEVERITY.LEICHTER_FEHLER,
            {
              penalty: 5,
              detailsVi: `Bật xi-nhan quá muộn sát ngã tư (< ${SIMULATION_THRESHOLDS.INDICATOR_DISTANCE_M}m)`,
              detailsDe: 'Fahrtrichtungsanzeiger zu spät gesetzt'
            }
          );
        }
      }
    }

    // ── GIAI ĐOẠN 2: ĐANG TRONG GIAO LỘ (AT_JUNCTION: < 16m) ────────────────
    else if (this.phase === 'AT_JUNCTION') {
      // Tiếp tục tích lũy thời gian dừng nếu tài xế dừng sát ngã tư
      if (this.currentDirective.hasStopSign && distToJunc <= SIMULATION_THRESHOLDS.JUNCTION_ENTRY_RADIUS_M) {
        if (speed < SIMULATION_THRESHOLDS.STOP_SPEED_MAX_KMH) {
          this.stopSignHoldTime += dt;
          if (this.stopSignHoldTime >= SIMULATION_THRESHOLDS.STOP_CONFIRMATION_TIME_S) {
            this.hasStoppedAtStopLine = true;
          }
        }
      }

      // 1. Kiểm tra tốc độ bẻ lái khi rẽ (§ 3 Abs. 1 StVO)
      if ((maneuver === 'RIGHT' || maneuver === 'LEFT') && speed > SIMULATION_THRESHOLDS.SAFE_TURNING_SPEED_KMH) {
        this.scoringEngine.recordFault(
          LEGAL_RULES.STVO_3_TURNING_SPEED,
          FAULT_SEVERITY.MITTLERER_FEHLER,
          {
            penalty: 10,
            detailsVi: `Tốc độ vào cua ngã tư quá nhanh (${Math.round(speed)} km/h)`,
            detailsDe: `Zu hohe Abbiegegeschwindigkeit (${Math.round(speed)} km/h)`
          }
        );
      }

      // 2. Kiểm tra Schulterblick nếu rẽ phải (§ 9 Abs. 3 StVO)
      if (maneuver === 'RIGHT' && !this.schulterblickChecked && distToJunc < 8.0) {
        this.scoringEngine.recordFault(
          LEGAL_RULES.STVO_9_ABS_3_SCHULTERBLICK,
          FAULT_SEVERITY.MITTLERER_FEHLER,
          {
            penalty: 10,
            detailsVi: 'Thiếu quan sát Schulterblick điểm mù xe đạp bên phải',
            detailsDe: 'Fehlender Schulterblick für Radfahrer beim Rechtsabbiegen'
          }
        );
      }

      // Xe đã vượt qua giao lộ và đang rời đi (dist tăng > JUNCTION_EXIT_RADIUS_M = 22m)
      if (distToJunc > SIMULATION_THRESHOLDS.JUNCTION_EXIT_RADIUS_M && this.hasEnteredJunction) {
        this.phase = 'COMPLETED';

        // Xác minh xe có vào đúng đoạn đường yêu cầu (Fahrprüfungs-Richtlinie)
        const currentSeg = roadNetwork.findNearestSegment(x, z, carState.heading);
        const expectedId = this.currentDirective.expectedRoadId;

        if (currentSeg && expectedId && currentSeg.road.id !== expectedId) {
          this.scoringEngine.recordFault(
            LEGAL_RULES.FAHRPRUEFUNG_ROUTE_DIRECTION,
            FAULT_SEVERITY.MITTLERER_FEHLER,
            {
              penalty: 20,
              detailsVi: 'Rẽ sai hướng so với hiệu lệnh của Giám khảo sát hạch',
              detailsDe: 'Falsche Fahrtrichtung gewählt (Prüfungsanweisung nicht befolgt)'
            }
          );
        } else {
          this.scoringEngine.recordSuccess(
            '✓ Rất tốt! Rẽ chuẩn xác và chấp hành đúng luật StVO.',
            'Sehr gut abgebogen!'
          );
        }

        // Đặt thời gian chờ 3.5 giây trước khi chuyển sang ngã tư kế tiếp
        this.completionCooldown = 3.5;
      }
    }
  }
}

export const examinerEngine = new ExaminerRuleEngine();
