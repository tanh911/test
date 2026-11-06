/**
 * Exam Scoring Engine (Hệ Thống Đánh Giá Chấm Thi Sát Hạch Lái Xe Đức)
 * ===================================================================
 * Clean Architecture Tier 4: EXAM SCORING
 * 
 * Separates statutory legal duties (StVO) from exam grading policies (FeV / Fahrschul-Prüfungsrichtlinie).
 * In Germany:
 * - "Leichter Fehler": Trừ điểm nhẹ (-5đ), nhắc nhở.
 * - "Mittlerer Fehler": Trừ điểm vừa (-10 đến -15đ).
 * - "Schwerer Fehler": Lỗi nghiêm trọng (Vượt đèn đỏ, không dừng biển STOP, vi phạm quyền ưu tiên)
 *   -> Dẫn tới "Sofortiges Nichtbestehen" (Trượt trực tiếp bài thi sát hạch thực hành).
 */

export const FAULT_SEVERITY = {
  LEICHTER_FEHLER: {
    level: 'LEICHTER_FEHLER',
    defaultPenalty: 5,
    titleDe: 'Leichter Fehler',
    titleVi: 'Lỗi nhẹ',
    leadsToImmediateFailure: false
  },
  MITTLERER_FEHLER: {
    level: 'MITTLERER_FEHLER',
    defaultPenalty: 10,
    titleDe: 'Mittlerer Fehler',
    titleVi: 'Lỗi trung bình',
    leadsToImmediateFailure: false
  },
  SCHWERER_FEHLER: {
    level: 'SCHWERER_FEHLER',
    defaultPenalty: 25,
    titleDe: 'Schwerer Fehler (Sofortiges Nichtbestehen)',
    titleVi: 'Lỗi nghiêm trọng (Trượt trực tiếp)',
    leadsToImmediateFailure: true
  }
};

export class ExamScoringEngine {
  constructor(initialScore = 100, passScoreThreshold = 70) {
    this.initialScore = initialScore;
    this.passScoreThreshold = passScoreThreshold;
    this.score = initialScore;
    this.faults = [];
    this.status = 'IN_PROGRESS'; // 'IN_PROGRESS', 'BESTANDEN', 'NICHT_BESTANDEN'
    this.criticalFailureCount = 0;
    this.recentFeedback = null;
    this.feedbackTimer = 0;
  }

  /**
   * Reset hệ thống chấm điểm cho bài thi mới
   */
  reset() {
    this.score = this.initialScore;
    this.faults = [];
    this.status = 'IN_PROGRESS';
    this.criticalFailureCount = 0;
    this.recentFeedback = null;
    this.feedbackTimer = 0;
  }

  /**
   * Ghi nhận một lỗi vi phạm theo chuẩn danh mục lỗi Fahrprüfungsrichtlinie
   * @param {Object} legalRule Đối tượng định nghĩa luật từ LegalRuleDefinitions
   * @param {Object} severity FAULT_SEVERITY (LEICHTER_FEHLER, MITTLERER_FEHLER, SCHWERER_FEHLER)
   * @param {Object} options { penalty, detailsVi, detailsDe }
   */
  recordFault(legalRule, severity = FAULT_SEVERITY.MITTLERER_FEHLER, options = {}) {
    const now = Date.now();
    // Chống spam lặp cùng 1 lỗi trong 3.5 giây
    const existing = this.faults.find(f => f.ruleId === legalRule.id && (now - f.timestamp < 3500));
    if (existing) return existing;

    const penalty = (typeof options.penalty === 'number') ? options.penalty : severity.defaultPenalty;
    this.score = Math.max(0, this.score - penalty);

    if (severity.leadsToImmediateFailure) {
      this.criticalFailureCount++;
      this.status = 'NICHT_BESTANDEN';
    } else if (this.score < this.passScoreThreshold) {
      this.status = 'NICHT_BESTANDEN';
    }

    const faultRecord = {
      id: `fault_${now}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: now,
      ruleId: legalRule.id,
      paragraph: legalRule.paragraph,
      legalTitleDe: legalRule.titleDe,
      legalTitleVi: legalRule.titleVi,
      severity: severity.level,
      penalty,
      leadsToImmediateFailure: severity.leadsToImmediateFailure,
      detailsVi: options.detailsVi || legalRule.descriptionVi,
      detailsDe: options.detailsDe || legalRule.descriptionDe
    };

    this.faults.push(faultRecord);

    // Cập nhật phản hồi tức thời cho HUD
    this.recentFeedback = {
      type: severity.leadsToImmediateFailure ? 'critical' : 'warning',
      paragraph: legalRule.paragraph,
      title: severity.titleVi,
      text: faultRecord.detailsVi,
      sub: `${faultRecord.detailsDe} (-${penalty}đ)`,
      penalty
    };
    this.feedbackTimer = 5.0;

    return faultRecord;
  }

  /**
   * Ghi nhận thành công một thao tác / giai đoạn
   */
  recordSuccess(textVi, textDe) {
    this.recentFeedback = {
      type: 'success',
      text: textVi,
      sub: textDe
    };
    this.feedbackTimer = 3.5;
  }

  /**
   * Cập nhật bộ đếm thời gian phản hồi
   */
  update(dt) {
    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= dt;
      if (this.feedbackTimer <= 0) {
        this.recentFeedback = null;
      }
    }
  }

  /**
   * Kết luận kết quả bài thi theo quy chế Fahrprüfung
   */
  getExamVerdict() {
    const isPassed = (this.criticalFailureCount === 0 && this.score >= this.passScoreThreshold);
    return {
      status: isPassed ? 'BESTANDEN' : 'NICHT_BESTANDEN',
      isPassed,
      score: this.score,
      maxScore: this.initialScore,
      totalFaultsCount: this.faults.length,
      criticalFailureCount: this.criticalFailureCount,
      faults: [...this.faults],
      summaryDe: isPassed
        ? `Herzlichen Glückwunsch! Praktische Prüfung bestanden (${this.score}/100 Punkte).`
        : (this.criticalFailureCount > 0
            ? `Prüfung nicht bestanden: Schwerer Fehler begangen (${this.criticalFailureCount} schwerer Fehler).`
            : `Prüfung nicht bestanden: Zu viele Fehlerpunkte (${this.score}/${this.passScoreThreshold} Punkte erforderlich).`),
      summaryVi: isPassed
        ? `Chúc mừng! Bạn đã thi ĐỖ bài lái xe thực hành (${this.score}/100 điểm).`
        : (this.criticalFailureCount > 0
            ? `KHÔNG ĐẠT (Trượt trực tiếp): Đã vi phạm lỗi nghiêm trọng StVO.`
            : `KHÔNG ĐẠT: Điểm số dưới ngưỡng đạt (${this.score}/${this.passScoreThreshold} điểm).`)
    };
  }
}
