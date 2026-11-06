/**
 * StVO Legal Rules Catalog (Luật Giao thông Đường bộ CHLB Đức)
 * ==========================================================
 * Clean Architecture Tier 3: LEGAL RULE ENGINE
 * Defines official statutory requirements under the German Straßenverkehrs-Ordnung (StVO).
 */

export const LEGAL_RULES = {
  STVO_37_AMPEL: {
    id: 'STVO_37_AMPEL',
    paragraph: '§ 37 Abs. 2 StVO',
    titleDe: 'Wechsellichtzeichen (Rotlichtverstoß)',
    titleVi: 'Chấp hành đèn tín hiệu giao thông (Cấm vượt đèn đỏ)',
    descriptionDe: 'Rot ordnet an: Halt vor der Kreuzung. Grün gibt den Verkehr frei.',
    descriptionVi: 'Đèn đỏ bắt buộc dừng xe trước ngã tư. Đèn xanh cho phép lưu thông.',
    officialCategory: 'VERKEHRSRECHTLICHE_GRUNDPFLICHT'
  },
  STVO_41_STOP: {
    id: 'STVO_41_STOP',
    paragraph: '§ 41 StVO (Zeichen 206 - Stoppschild)',
    titleDe: 'Halt! Vorfahrt gewähren! (Stoppschild)',
    titleVi: 'Biển STOP (Bắt buộc dừng hẳn xe và nhường quyền ưu tiên)',
    descriptionDe: 'Wer ein Fahrzeug führt, muss anhalten und Vorfahrt gewähren. Die Räder müssen vollständig stillstehen.',
    descriptionVi: 'Người lái bắt buộc phải dừng hẳn xe (bánh xe ngừng quay) trước khi nhường quyền ưu tiên.',
    officialCategory: 'VORFAHRT_UND_HALTEGEBOT'
  },
  STVO_41_GIVE_WAY: {
    id: 'STVO_41_GIVE_WAY',
    paragraph: '§ 41 StVO (Zeichen 205 - Vorfahrt gewähren)',
    titleDe: 'Vorfahrt gewähren!',
    titleVi: 'Biển nhường quyền ưu tiên (Vorfahrt gewähren)',
    descriptionDe: 'Wer ein Fahrzeug führt, muss Vorfahrt gewähren.',
    descriptionVi: 'Phải nhường quyền đi trước cho các phương tiện trên tuyến đường giao cắt.',
    officialCategory: 'VORFAHRT'
  },
  STVO_8_RECHTS_VOR_LINKS: {
    id: 'STVO_8_RECHTS_VOR_LINKS',
    paragraph: '§ 8 Abs. 1 StVO (Rechts vor Links)',
    titleDe: 'Rechts-vor-Links Vorfahrtregel',
    titleVi: 'Quy tắc quyền ưu tiên Bên Phải Trước (Rechts vor Links)',
    descriptionDe: 'An Kreuzungen und Einmündungen hat die Vorfahrt, wer von rechts kommt.',
    descriptionVi: 'Tại ngã ba, ngã tư không có biển báo ưu tiên, xe đi từ bên phải có quyền đi trước.',
    officialCategory: 'VORFAHRT'
  },
  STVO_9_ABS_1_INDICATOR: {
    id: 'STVO_9_ABS_1_INDICATOR',
    paragraph: '§ 9 Abs. 1 StVO (Blinker)',
    titleDe: 'Rechtzeitiges Ankündigen des Abbiegens',
    titleVi: 'Bật đèn xi-nhan báo chuyển hướng kịp thời và rõ ràng',
    descriptionDe: 'Wer abbiegen will, muss dies rechtzeitig und deutlich ankündigen; die Fahrtrichtungsanzeiger sind zu benutzen.',
    descriptionVi: 'Người lái muốn chuyển hướng phải báo hiệu kịp thời và rõ ràng bằng đèn xi-nhan.',
    officialCategory: 'ABBIEGEN'
  },
  STVO_9_ABS_3_SCHULTERBLICK: {
    id: 'STVO_9_ABS_3_SCHULTERBLICK',
    paragraph: '§ 9 Abs. 3 StVO (Schulterblick)',
    titleDe: 'Rücksicht auf Radfahrer und Fußgänger (Schulterblick)',
    titleVi: 'Quan sát điểm mù Schulterblick bảo vệ người đi xe đạp cùng chiều',
    descriptionDe: 'Wer abbiegen will, muss auf Radfahrer und Fußgänger besondere Rücksicht nehmen.',
    descriptionVi: 'Trước khi rẽ phải phải quay đầu Schulterblick để không gây nguy hiểm cho xe đạp đi thẳng cùng chiều.',
    officialCategory: 'ABBIEGEN_SCHUTZPFLICHT'
  },
  STVO_3_SPEED_LIMIT: {
    id: 'STVO_3_SPEED_LIMIT',
    paragraph: '§ 3 StVO (Höchstgeschwindigkeit)',
    titleDe: 'Zulässige Höchstgeschwindigkeit',
    titleVi: 'Chấp hành tốc độ tối đa cho phép',
    descriptionDe: 'Die zulässige Höchstgeschwindigkeit beträgt innerhalb geschlossener Ortschaften für alle Kraftfahrzeuge 50 km/h (oder 30 km/h in Zonen).',
    descriptionVi: 'Tuân thủ tốc độ quy định: 50 km/h trong đô thị hoặc 30 km/h trong Tempo-30-Zone.',
    officialCategory: 'GESCHWINDIGKEIT'
  },
  STVO_3_TURNING_SPEED: {
    id: 'STVO_3_TURNING_SPEED',
    paragraph: '§ 3 StVO (Abbiegegeschwindigkeit)',
    titleDe: 'Angepasste Abbiegegeschwindigkeit',
    titleVi: 'Giảm tốc độ an toàn thích ứng khi vào cua',
    descriptionDe: 'Das Fahrzeug darf nur so schnell gefahren werden, dass es ständig beherrscht wird.',
    descriptionVi: 'Phải rà phanh giảm tốc an toàn trước khi vào cua để kiểm soát xe hoàn toàn.',
    officialCategory: 'GESCHWINDIGKEIT'
  },
  FAHRPRUEFUNG_ROUTE_DIRECTION: {
    id: 'FAHRPRUEFUNG_ROUTE_DIRECTION',
    paragraph: 'Fahrprüfungs-Richtlinie (Anlage 7 FeV)',
    titleDe: 'Befolgen der Prüferanweisung',
    titleVi: 'Tuân thủ đúng hiệu lệnh chuyển hướng của Giám khảo',
    descriptionDe: 'Der Bewerber hat die vom Fahrprüfer angegebene Fahrtrichtung einzuschlagen.',
    descriptionVi: 'Thí sinh phải rẽ đúng nhánh đường theo hiệu lệnh của Giám khảo sát hạch.',
    officialCategory: 'PRUEFUNGSANWEISUNG'
  }
};

/**
 * Simulation Calibration Thresholds
 * =================================
 * NOTE: These numerical values are SIMULATOR SENSORY PROXIES used to verify
 * qualitative legal clauses in code (e.g. "rechtzeitig", "vollständiger Stillstand").
 * They are calibration thresholds of this software, NOT statutory numbers written in the StVO.
 */
export const SIMULATION_THRESHOLDS = {
  // StVO § 9 Abs. 1 requires "rechtzeitig" (timely): 12.0m is our simulation approach proxy
  INDICATOR_DISTANCE_M: 12.0,

  // StVO § 41 Zeichen 206 requires "vollständiger Stillstand der Räder":
  // 0.7s at speed < 0.8 km/h is the simulation numerical window to confirm complete halt
  STOP_CONFIRMATION_TIME_S: 0.7,
  STOP_SPEED_MAX_KMH: 0.8,

  // StVO § 3 Abs. 1 safe control: 30 km/h is the simulator safe cornering speed cap
  SAFE_TURNING_SPEED_KMH: 30.0,

  // Speed limit tolerance before penalizing (§ 3 StVO)
  SPEED_LIMIT_TOLERANCE_KMH: 6.0,

  // Head look angle threshold to confirm Schulterblick (§ 9 Abs. 3 StVO)
  HEAD_LOOK_MIN_RAD: 0.35,

  // Spatial boundaries for intersection state machine (meters from junction center)
  JUNCTION_ENTRY_RADIUS_M: 16.0,
  JUNCTION_EXIT_RADIUS_M: 22.0,
  STOP_LINE_SEARCH_RADIUS_M: 25.0
};
