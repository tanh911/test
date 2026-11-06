/**
 * 🚦 TRAFFIC RULE SCHEMA & GERMAN StVO CATALOG (Phase 0)
 * =======================================================
 * Defines official statutory rules, sign codes, and movement types
 * according to the German Straßenverkehrs-Ordnung (StVO).
 */

export const TrafficRuleType = Object.freeze({
  MAX_SPEED: 'MAX_SPEED',                                   // Zeichen 274 (Zulässige Höchstgeschwindigkeit)
  SPEED_UNRESTRICTED: 'SPEED_UNRESTRICTED',                 // Zeichen 278 (Ende der zulässigen Höchstgeschwindigkeit)
  ZONE_START: 'ZONE_START',                                 // Zeichen 274.1 (Beginn einer Tempo 30-Zone)
  ZONE_END: 'ZONE_END',                                     // Zeichen 274.2 (Ende einer Tempo 30-Zone)
  PLAY_STREET: 'PLAY_STREET',                               // Zeichen 325.1 (Verkehrsberuhigter Bereich / Schrittgeschwindigkeit)
  PLAY_STREET_END: 'PLAY_STREET_END',                       // Zeichen 325.2 (Ende eines verkehrsberuhigten Bereichs)
  STOP: 'STOP',                                             // Zeichen 206 (Halt! Vorfahrt gewähren!)
  YIELD: 'YIELD',                                           // Zeichen 205 (Vorfahrt gewähren!)
  PRIORITY_ROAD: 'PRIORITY_ROAD',                           // Zeichen 306 (Vorfahrtstraße)
  PRIORITY_AT_NEXT_JUNCTION: 'PRIORITY_AT_NEXT_JUNCTION',   // Zeichen 301 (Vorfahrt an der nächsten Kreuzung)
  TURN_RESTRICTION: 'TURN_RESTRICTION',                     // Biển hiệu lệnh hướng đi (VZ 209/211/214) hoặc cấm chuyển hướng
  NO_ENTRY: 'NO_ENTRY',                                     // Zeichen 267 (Verbot der Einfahrt)
  NO_OVERTAKING: 'NO_OVERTAKING'                            // Zeichen 276 (Überholverbot für Kraftfahrzeuge aller Art)
});

export const RuleSource = Object.freeze({
  EXPLICIT_SIGN: 'EXPLICIT_SIGN',     // Biển báo thực tế trên tuyến đường
  ZONE: 'ZONE',                       // Luật vùng (Tempo-30-Zone, Verkehrsberuhigter Bereich)
  OSM: 'OSM',                         // Tag thuộc tính từ mạng lưới OpenStreetMap
  MAP_EDITOR: 'MAP_EDITOR',           // Quy tắc tùy chỉnh tạo từ Map Editor
  STVO_DEFAULT: 'STVO_DEFAULT'        // Mặc định nội thị / ngoại thị theo § 3 StVO
});

export const MovementType = Object.freeze({
  STRAIGHT: 'STRAIGHT',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UTURN: 'UTURN'
});

export const StVOSignCatalog = Object.freeze({
  VZ_274: {
    code: 'VZ_274',
    titleDe: 'Zulässige Höchstgeschwindigkeit',
    titleVi: 'Tốc độ tối đa cho phép',
    paragraph: '§ 41 Abs. 1 StVO (Zeichen 274)',
    category: 'GESCHWINDIGKEIT'
  },
  VZ_274_1: {
    code: 'VZ_274.1',
    titleDe: 'Beginn einer Tempo 30-Zone',
    titleVi: 'Bắt đầu khu vực Tempo-30',
    paragraph: '§ 45 Abs. 1c StVO (Zeichen 274.1)',
    category: 'ZONE'
  },
  VZ_274_2: {
    code: 'VZ_274.2',
    titleDe: 'Ende einer Tempo 30-Zone',
    titleVi: 'Kết thúc khu vực Tempo-30',
    paragraph: '§ 45 Abs. 1c StVO (Zeichen 274.2)',
    category: 'ZONE'
  },
  VZ_325_1: {
    code: 'VZ_325.1',
    titleDe: 'Verkehrsberuhigter Bereich',
    titleVi: 'Khu vực đi bộ / phố êm dịu (Tốc độ đi bộ Schrittgeschwindigkeit)',
    paragraph: '§ 42 Abs. 2 StVO (Zeichen 325.1)',
    category: 'VERKEHRSBERUHIGT'
  },
  VZ_325_2: {
    code: 'VZ_325.2',
    titleDe: 'Ende eines verkehrsberuhigten Bereichs',
    titleVi: 'Kết thúc khu vực phố êm dịu',
    paragraph: '§ 42 Abs. 2 StVO (Zeichen 325.2)',
    category: 'VERKEHRSBERUHIGT'
  },
  VZ_206: {
    code: 'VZ_206',
    titleDe: 'Halt! Vorfahrt gewähren!',
    titleVi: 'Biển STOP: Bắt buộc dừng xe và nhường quyền ưu tiên',
    paragraph: '§ 41 Abs. 1 StVO (Zeichen 206)',
    category: 'VORFAHRT'
  },
  VZ_205: {
    code: 'VZ_205',
    titleDe: 'Vorfahrt gewähren!',
    titleVi: 'Biển nhường quyền ưu tiên (Give Way / Yield)',
    paragraph: '§ 41 Abs. 1 StVO (Zeichen 205)',
    category: 'VORFAHRT'
  },
  VZ_306: {
    code: 'VZ_306',
    titleDe: 'Vorfahrtstraße',
    titleVi: 'Đường ưu tiên',
    paragraph: '§ 42 Abs. 2 StVO (Zeichen 306)',
    category: 'VORFAHRT'
  },
  VZ_301: {
    code: 'VZ_301',
    titleDe: 'Vorfahrt an der nächsten Kreuzung',
    titleVi: 'Quyền ưu tiên tại ngã tư tiếp theo',
    paragraph: '§ 42 Abs. 2 StVO (Zeichen 301)',
    category: 'VORFAHRT'
  },
  VZ_209_10: {
    code: 'VZ_209-10',
    titleDe: 'Vorgeschriebene Fahrtrichtung - rechts',
    titleVi: 'Hướng đi bắt buộc: Phải rẽ phải',
    paragraph: '§ 41 Abs. 1 StVO (Zeichen 209-10)',
    category: 'RICHTUNG'
  },
  VZ_209_20: {
    code: 'VZ_209-20',
    titleDe: 'Vorgeschriebene Fahrtrichtung - links',
    titleVi: 'Hướng đi bắt buộc: Phải rẽ trái',
    paragraph: '§ 41 Abs. 1 StVO (Zeichen 209-20)',
    category: 'RICHTUNG'
  },
  VZ_209_30: {
    code: 'VZ_209-30',
    titleDe: 'Vorgeschriebene Fahrtrichtung - geradeaus',
    titleVi: 'Hướng đi bắt buộc: Phải đi thẳng',
    paragraph: '§ 41 Abs. 1 StVO (Zeichen 209-30)',
    category: 'RICHTUNG'
  },
  VZ_267: {
    code: 'VZ_267',
    titleDe: 'Verbot der Einfahrt',
    titleVi: 'Đường cấm đi vào (Cấm ngược chiều)',
    paragraph: '§ 41 Abs. 1 StVO (Zeichen 267)',
    category: 'VERBOT'
  },
  VZ_276: {
    code: 'VZ_276',
    titleDe: 'Überholverbot für Kraftfahrzeuge aller Art',
    titleVi: 'Cấm vượt các loại xe cơ giới',
    paragraph: '§ 41 Abs. 1 StVO (Zeichen 276)',
    category: 'VERBOT'
  }
});
