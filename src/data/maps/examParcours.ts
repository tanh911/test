// 🎯 examParcours.ts — Sa hình Sát hạch & Luyện Phản xạ Tình huống Chuẩn Đức (Prüfungs-Parcours)
// Thiết kế tinh gọn (loop 130m × 260m), hình học vuông góc sạch 100% không chồng lấn,
// tích hợp đầy đủ 6 trạm tình huống sát hạch thực tế (TÜV / DEKRA):
//   1. Khu Tempo 30 & Ngã tư đồng cấp (Rechts vor links - Z.102)
//   2. Vạch qua đường người đi bộ (Zebrastreifen - Z.350)
//   3. Ngã tư Đèn tín hiệu giao thông (Ampelkreuzung) + Rẽ phải
//   4. Khu 50 km/h & Giao lộ Biển STOP (Halt! Vorfahrt gewähren - Z.206)
//   5. Vòng xuyến chuẩn Đức (Kreisverkehr - Z.215 + Z.205)
//   6. Đỗ xe về đích (Ziel-Parkbucht - Z.314, về số P)

import type { GameMap, MapRoad, MapSign, MapIntersection, MapBuilding, MapProp } from '../../world/mapLoader';

export interface ExamStation {
  id: string;
  index: number;
  titleVi: string;
  titleDe: string;
  instructionVi: string;
  instructionDe: string;
  ruleTag: string;
  x: number;
  z: number;
  triggerRadius: number;
  /** Hướng dẫn thao tác cốt lõi hiển thị dạng badge */
  actionHintVi: string;
  actionHintDe: string;
}

export const EXAM_STATIONS: ExamStation[] = [
  {
    id: 'rvl',
    index: 1,
    titleVi: 'Trạm 1/6: Khu Tempo 30 & Ngã tư Đồng cấp',
    titleDe: 'Station 1/6: Tempo-30-Zone & Rechts vor links',
    instructionVi: 'Giữ tốc độ ≤ 30 km/h. Phía trước là ngã tư đồng cấp (Z.102) — Chú ý giảm tốc nhường xe từ bên phải đi ra, đi thẳng qua ngã tư.',
    instructionDe: 'Max. 30 km/h halten. Kreuzung mit Rechts-vor-links voraus — Fahrzeug von rechts vorlassen und geradeaus fahren.',
    ruleTag: 'Rechts vor links (§8 StVO)',
    x: 0,
    z: 90,
    triggerRadius: 16,
    actionHintVi: 'Giảm tốc ≤ 30 km/h • Nhường xe bên phải • Đi thẳng',
    actionHintDe: 'Tempo ≤ 30 • Rechts vorlassen • Geradeaus'
  },
  {
    id: 'zebra',
    index: 2,
    titleVi: 'Trạm 2/6: Vạch qua đường Người đi bộ (Zebrastreifen)',
    titleDe: 'Station 2/6: Fußgängerüberweg (Zebrastreifen)',
    instructionVi: 'Quan sát biển Z.350 phía trước! Có người đi bộ đang sang đường — Phanh dừng trước vạch kẻ trắng cho người đi bộ qua hết rồi mới đi tiếp.',
    instructionDe: 'Zebrastreifen (Z.350) voraus! Fußgänger queren die Fahrbahn — Vor dem Überweg anhalten und passieren lassen.',
    ruleTag: 'Zebrastreifen (§26 StVO)',
    x: 0,
    z: 175,
    triggerRadius: 14,
    actionHintVi: 'Phanh dừng trước vạch Zebra • Nhường người đi bộ',
    actionHintDe: 'Vor Zebrastreifen halten • Fußgänger vorlassen'
  },
  {
    id: 'ampel',
    index: 3,
    titleVi: 'Trạm 3/6: Ngã tư Đèn tín hiệu (Dorotheenstraße)',
    titleDe: 'Station 3/6: Ampelkreuzung (Dorotheenstraße)',
    instructionVi: 'Dừng trước vạch dừng nếu đèn Vàng/Đỏ. Khi đèn Xanh: Bật xi-nhan phải (phím E) và rẽ phải vào phố Dorotheenstraße.',
    instructionDe: 'Bei Gelb/Rot an der Haltelinie warten. Bei Grün: Rechts blinken (Taste E) und rechts in die Dorotheenstraße abbiegen.',
    ruleTag: 'Lichtzeichen (§37 StVO)',
    x: 0,
    z: 260,
    triggerRadius: 18,
    actionHintVi: 'Dừng đèn đỏ • Bật xi-nhan phải [E] • Rẽ phải',
    actionHintDe: 'Bei Rot halten • Rechts blinken [E] • Rechts abbiegen'
  },
  {
    id: 'stop',
    index: 4,
    titleVi: 'Trạm 4/6: Khu 50 km/h & Giao lộ Biển STOP',
    titleDe: 'Station 4/6: Tempo 50 & Stoppschild (Z.206)',
    instructionVi: 'Đoạn đường cho phép 50 km/h. Cuối đường có biển STOP (Z.206): Bắt buộc dừng hẳn (0 km/h) trước vạch dừng, bật xi-nhan phải (E) và rẽ phải vào đại lộ Friedrichstraße.',
    instructionDe: 'Tempo 50 erlaubt. Am Ende Stoppschild (Z.206): Vollständig anhalten (0 km/h), rechts blinken (E) und rechts in die Friedrichstraße abbiegen.',
    ruleTag: 'Stoppschild Z.206 (§41 StVO)',
    x: 130,
    z: 260,
    triggerRadius: 18,
    actionHintVi: 'Dừng hẳn 0 km/h tại vạch STOP • Xi-nhan phải [E] • Rẽ phải',
    actionHintDe: 'Komplett halten (0 km/h) • Rechts blinken [E] • Rechts abbiegen'
  },
  {
    id: 'roundabout',
    index: 5,
    titleVi: 'Trạm 5/6: Vòng xuyến (Kreisverkehr Clara-Zetkin)',
    titleDe: 'Station 5/6: Kreisverkehr (Z.215 + Z.205)',
    instructionVi: 'Giảm tốc về 30 km/h. Nhường xe đang ở trong vòng xuyến, rẽ phải vào vòng và BẬT XI-NHAN PHẢI (phím E) để ra ở lối thứ nhất (Universitätsstraße).',
    instructionDe: 'Auf 30 km/h reduzieren. Fahrzeugen im Kreis Vorfahrt gewähren, einfahren und bei der 1. Ausfahrt RECHTS BLINKEN (Taste E).',
    ruleTag: 'Kreisverkehr (§8 Abs. 1a StVO)',
    x: 130,
    z: 90,
    triggerRadius: 20,
    actionHintVi: 'Nhường xe trong vòng • Bật xi-nhan phải [E] khi ra lối 1',
    actionHintDe: 'Vorfahrt achten • Bei Ausfahrt rechts blinken [E]'
  },
  {
    id: 'finish',
    index: 6,
    titleVi: 'Trạm 6/6: Đỗ xe Về đích (Universitätsstraße)',
    titleDe: 'Station 6/6: Ziel-Parkbucht (Prüfungsende)',
    instructionVi: 'Bật xi-nhan phải (E), đưa xe dừng gọn vào Ô ĐỖ XE MÀU XANH bên lề phải (biển P) và bấm phím 1 (về số P) để hoàn thành bài thi!',
    instructionDe: 'Rechts blinken (E), in der GRÜNEN PARKBUCHT am rechten Rand anhalten und Taste 1 (Parkstufe P) drücken!',
    ruleTag: 'Parken & Sicherung (§12 StVO)',
    x: 64,
    z: 88.25,
    triggerRadius: 9.5,
    actionHintVi: 'Dừng trong ô xanh • Bấm phím [1] về số P để kết thúc',
    actionHintDe: 'In grüner Bucht halten • Taste [1] (Gang P) drücken'
  }
];

/** Tọa độ polyline lộ trình dẫn đường chuẩn để vẽ mũi tên 3D trên mặt đường & đường chỉ dẫn MiniMap */
export const EXAM_ROUTE_WAYPOINTS: Array<[number, number]> = [
  [0, -4],
  [0, 90],
  [0, 175],
  [0, 260],
  [130, 260],
  [130, 90],
  [64, 90]
];

export function generateExamParcoursMap(): GameMap {
  const nodes: GameMap['nodes'] = [
    // Trục Tây (Georgenstraße): Nam -> Bắc
    { id: 'n_start', x: 0, z: -30, type: 'end' },
    { id: 'n_rvl', x: 0, z: 90, type: 'intersection' },
    { id: 'n_zebra', x: 0, z: 175, type: 'intersection' },
    { id: 'n_ampel', x: 0, z: 260, type: 'intersection' },

    // Trục Đông (Friedrichstraße): Bắc -> Nam
    { id: 'n_stop', x: 130, z: 260, type: 'intersection' },
    { id: 'n_round', x: 130, z: 90, type: 'intersection' },

    // Các nhánh phụ tạo lưu lượng giao thông cắt ngang tại các ngã tư
    { id: 'n_rvl_w', x: -85, z: 90, type: 'end' },
    { id: 'n_ampel_w', x: -85, z: 260, type: 'end' },
    { id: 'n_ampel_n', x: 0, z: 345, type: 'end' },
    { id: 'n_fried_n', x: 130, z: 345, type: 'end' },
    { id: 'n_stop_e', x: 215, z: 260, type: 'end' },
    { id: 'n_round_e', x: 215, z: 90, type: 'end' },
    { id: 'n_round_s', x: 130, z: 5, type: 'end' }
  ];

  const makeRoad = (
    id: string,
    name: string,
    from: string,
    to: string,
    points: [number, number][],
    speedLimit: number,
    priority: MapRoad['priority'] = 'equal'
  ): MapRoad & { name: string } => ({
    id,
    name,
    from,
    to,
    points,
    lanesForward: 1,
    lanesBackward: 1,
    laneWidth: 3.5,
    sidewalk: { left: true, right: true },
    bikeLane: { left: false, right: false },
    parking: { left: 'none', right: 'none' },
    speedLimit,
    priority,
    surface: 'asphalt'
  });

  const roads: Array<MapRoad & { name: string }> = [
    // 1. Đoạn xuất phát -> Trạm 1 (Rechts vor links)
    makeRoad('r_start', 'Georgenstraße', 'n_start', 'n_rvl', [[0, -30], [0, 90]], 30, 'equal'),
    // 2. Trạm 1 -> Trạm 2 (Zebrastreifen)
    makeRoad('r_rvl_zebra', 'Georgenstraße', 'n_rvl', 'n_zebra', [[0, 90], [0, 175]], 30, 'equal'),
    // 3. Trạm 2 -> Trạm 3 (Ampelkreuzung)
    makeRoad('r_zebra_ampel', 'Georgenstraße', 'n_zebra', 'n_ampel', [[0, 175], [0, 260]], 30, 'equal'),
    // 4. Trạm 3 -> Trạm 4 (Dorotheenstraße 50 km/h -> STOP)
    makeRoad('r_ampel_stop', 'Dorotheenstraße', 'n_ampel', 'n_stop', [[0, 260], [130, 260]], 50, 'stop'),
    // 5. Trạm 4 -> Trạm 5 (Đại lộ Friedrichstraße -> Vòng xuyến)
    makeRoad('r_stop_round', 'Friedrichstraße', 'n_stop', 'n_round', [[130, 260], [130, 90]], 50, 'main'),
    // 6. Trạm 5 -> Trạm 6 -> Trạm 1 (Universitätsstraße: Đích đỗ xe & Nhánh phải của Rechts vor links)
    makeRoad('r_uni_return', 'Universitätsstraße', 'n_round', 'n_rvl', [[130, 90], [0, 90]], 30, 'equal'),

    // Các nhánh giao cắt tạo dòng xe NPC thực tế tại từng ngã tư
    makeRoad('r_rvl_w', 'Universitätsstraße', 'n_rvl_w', 'n_rvl', [[-85, 90], [0, 90]], 30, 'equal'),
    makeRoad('r_ampel_w', 'Dorotheenstraße', 'n_ampel_w', 'n_ampel', [[-85, 260], [0, 260]], 50, 'main'),
    makeRoad('r_ampel_n', 'Georgenstraße Nord', 'n_ampel', 'n_ampel_n', [[0, 260], [0, 345]], 30, 'equal'),
    makeRoad('r_fried_n', 'Friedrichstraße Nord', 'n_fried_n', 'n_stop', [[130, 345], [130, 260]], 50, 'main'),
    makeRoad('r_stop_e', 'Dorotheenstraße Ost', 'n_stop', 'n_stop_e', [[130, 260], [215, 260]], 50, 'give_way'),
    makeRoad('r_round_e', 'Clara-Zetkin-Straße', 'n_round', 'n_round_e', [[130, 90], [215, 90]], 30, 'give_way'),
    makeRoad('r_round_s', 'Friedrichstraße Süd', 'n_round', 'n_round_s', [[130, 90], [130, 5]], 30, 'give_way')
  ];

  const intersections: MapIntersection[] = [
    {
      nodeId: 'n_rvl',
      rule: 'right_before_left',
      trafficLight: null,
      crosswalks: []
    },
    {
      nodeId: 'n_zebra',
      rule: 'priority_road',
      trafficLight: null,
      crosswalks: ['r_rvl_zebra']
    },
    {
      nodeId: 'n_ampel',
      rule: 'traffic_light',
      trafficLight: { cycle: 'standard', greenSeconds: 12, yellowSeconds: 3, redSeconds: 10 },
      crosswalks: ['r_zebra_ampel', 'r_ampel_stop', 'r_ampel_w']
    },
    {
      nodeId: 'n_stop',
      rule: 'stop',
      trafficLight: null,
      crosswalks: []
    },
    {
      nodeId: 'n_round',
      rule: 'roundabout',
      trafficLight: null,
      crosswalks: ['r_stop_round', 'r_uni_return']
    }
  ];

  const signs: MapSign[] = [
    // Trạm 1: Khu Tempo 30 + Báo trước Ngã tư đồng cấp (Z.102)
    { type: '274', value: 30, roadId: 'r_start', s: 42, side: 'right' },
    { type: '274.1', roadId: 'r_start', s: 42, side: 'left' },
    { type: '102', roadId: 'r_start', s: 96, side: 'right' },

    // Trạm 2: Biển vạch người đi bộ (Z.350) hai bên vạch Zebra
    { type: '350', roadId: 'r_rvl_zebra', s: 68, side: 'right' },
    { type: '350', roadId: 'r_rvl_zebra', s: 68, side: 'left' },

    // Trạm 3: Ngã tư đèn tín hiệu + Khu 30
    { type: '274', value: 30, roadId: 'r_zebra_ampel', s: 18, side: 'right' },
    { type: '101', roadId: 'r_zebra_ampel', s: 58, side: 'right' },

    // Trạm 4: Nâng tốc độ 50 km/h trên Dorotheenstraße + Biển STOP (Z.206) ở cuối đường
    { type: '274', value: 50, roadId: 'r_ampel_stop', s: 22, side: 'right' },
    { type: '206', roadId: 'r_ampel_stop', s: 112, side: 'right' },

    // Trạm 5: Đường ưu tiên (Z.306) trên Friedrichstraße -> Hạ xuống 30 -> Vòng xuyến (Z.215 + Z.205)
    { type: '306', roadId: 'r_stop_round', s: 24, side: 'right' },
    { type: '274', value: 30, roadId: 'r_stop_round', s: 112, side: 'right' },
    { type: '215', roadId: 'r_stop_round', s: 148, side: 'right' },
    { type: '205', roadId: 'r_stop_round', s: 152, side: 'right' },

    // Trạm 6: Đường về đích Universitätsstraße (Tempo 30 + Biển Đỗ xe Z.314 tại đích)
    { type: '274', value: 30, roadId: 'r_uni_return', s: 22, side: 'right' },
    { type: '314', roadId: 'r_uni_return', s: 64, side: 'right' },

    // Biển phụ cho các nhánh cắt ngang
    { type: '306', roadId: 'r_fried_n', s: 60, side: 'right' },
    { type: '205', roadId: 'r_stop_e', s: 18, side: 'left' }
  ];

  // Các dãy nhà phố được căn lùi đều đặn, chừa thoáng 22m quanh mọi ngã tư để góc nhìn biển báo/đèn luôn 100% rõ ràng
  const buildings: MapBuilding[] = [
    { roadId: 'r_start', side: 'right', s: 20, length: 42, floors: 4, style: 'altbau', seed: 101 },
    { roadId: 'r_start', side: 'left', s: 20, length: 44, floors: 4, style: 'backstein', seed: 102 },
    { roadId: 'r_start', side: 'right', s: 66, length: 28, floors: 3, style: 'neubau', seed: 103 },
    { roadId: 'r_start', side: 'left', s: 68, length: 26, floors: 4, style: 'altbau', seed: 104 },

    { roadId: 'r_rvl_zebra', side: 'right', s: 20, length: 38, floors: 4, style: 'altbau', seed: 105 },
    { roadId: 'r_rvl_zebra', side: 'left', s: 20, length: 38, floors: 3, style: 'neubau', seed: 106 },

    { roadId: 'r_zebra_ampel', side: 'right', s: 18, length: 42, floors: 4, style: 'backstein', seed: 107 },
    { roadId: 'r_zebra_ampel', side: 'left', s: 18, length: 42, floors: 5, style: 'altbau', seed: 108 },

    { roadId: 'r_ampel_stop', side: 'right', s: 26, length: 38, floors: 4, style: 'neubau', seed: 109 },
    { roadId: 'r_ampel_stop', side: 'left', s: 26, length: 38, floors: 4, style: 'altbau', seed: 110 },
    { roadId: 'r_ampel_stop', side: 'right', s: 70, length: 34, floors: 4, style: 'backstein', seed: 111 },
    { roadId: 'r_ampel_stop', side: 'left', s: 70, length: 34, floors: 5, style: 'altbau', seed: 112 },

    { roadId: 'r_stop_round', side: 'right', s: 26, length: 46, floors: 5, style: 'altbau', seed: 113 },
    { roadId: 'r_stop_round', side: 'left', s: 26, length: 46, floors: 4, style: 'neubau', seed: 114 },
    { roadId: 'r_stop_round', side: 'right', s: 82, length: 44, floors: 4, style: 'backstein', seed: 115 },
    { roadId: 'r_stop_round', side: 'left', s: 82, length: 44, floors: 4, style: 'altbau', seed: 116 },

    { roadId: 'r_uni_return', side: 'left', s: 28, length: 36, floors: 4, style: 'altbau', seed: 117 },
    { roadId: 'r_uni_return', side: 'left', s: 70, length: 34, floors: 3, style: 'neubau', seed: 118 },
    { roadId: 'r_uni_return', side: 'right', s: 24, length: 28, floors: 4, style: 'backstein', seed: 119 },

    { roadId: 'r_rvl_w', side: 'right', s: 16, length: 42, floors: 4, style: 'altbau', seed: 120 },
    { roadId: 'r_ampel_w', side: 'left', s: 16, length: 42, floors: 4, style: 'backstein', seed: 121 },
    { roadId: 'r_fried_n', side: 'right', s: 16, length: 42, floors: 5, style: 'altbau', seed: 122 },
    { roadId: 'r_stop_e', side: 'right', s: 22, length: 42, floors: 4, style: 'neubau', seed: 123 },
    { roadId: 'r_round_e', side: 'left', s: 22, length: 42, floors: 4, style: 'altbau', seed: 124 }
  ];

  const props: MapProp[] = [
    { type: 'tree', roadId: 'r_start', s: 32, side: 'left' },
    { type: 'street_lamp', roadId: 'r_start', s: 52, side: 'right' },
    { type: 'tree', roadId: 'r_start', s: 78, side: 'left' },

    { type: 'street_lamp', roadId: 'r_rvl_zebra', s: 35, side: 'right' },
    { type: 'tree', roadId: 'r_rvl_zebra', s: 52, side: 'left' },

    { type: 'tree', roadId: 'r_zebra_ampel', s: 32, side: 'right' },
    { type: 'street_lamp', roadId: 'r_zebra_ampel', s: 48, side: 'left' },

    { type: 'tree', roadId: 'r_ampel_stop', s: 45, side: 'right' },
    { type: 'street_lamp', roadId: 'r_ampel_stop', s: 65, side: 'left' },
    { type: 'tree', roadId: 'r_ampel_stop', s: 92, side: 'right' },

    { type: 'tree', roadId: 'r_stop_round', s: 45, side: 'left' },
    { type: 'street_lamp', roadId: 'r_stop_round', s: 75, side: 'right' },
    { type: 'tree', roadId: 'r_stop_round', s: 125, side: 'left' },

    { type: 'tree', roadId: 'r_uni_return', s: 38, side: 'left' },
    { type: 'street_lamp', roadId: 'r_uni_return', s: 55, side: 'right' },
    { type: 'parkscheinautomat', roadId: 'r_uni_return', s: 64, side: 'right' },
    { type: 'tree', roadId: 'r_uni_return', s: 88, side: 'right' }
  ];

  return {
    version: 1,
    nodes,
    roads,
    intersections,
    signs,
    buildings,
    props,
    spawns: {
      player: {
        roadId: 'r_start',
        s: 26, // Xuất phát tại (0, -4), nhìn thẳng hướng Bắc (+Z) về Trạm 1
        lane: 0
      }
    }
  };
}
