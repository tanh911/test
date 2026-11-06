export const EXERCISES = {
  // ══════════════════════════════════════════════════════════════════════════
  // 🚗 1. GRUNDLAGEN — SA HÌNH & CƠ BẢN (Dành cho người mới)
  // ══════════════════════════════════════════════════════════════════════════
  sh_kennenlernen: {
    id: 'sh_kennenlernen',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '01. Fahrzeug kennenlernen',
    description: 'Làm quen buồng lái: Vô lăng, cần số P-R-N-D, chân ga, chân phanh, gương và cụm đồng hồ Virtual Cockpit',
    startPoint: 'start',
    scenarios: ['sh_slalom']
  },
  sh_anfahren: {
    id: 'sh_anfahren',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '02. Anfahren',
    description: 'Kỹ thuật khởi hành: Chuyển cần số sang D (4), nhả phanh tay (Space), đệm ga từ từ để xe lăn bánh êm ái',
    startPoint: 'start',
    scenarios: ['sh_slalom']
  },
  sh_bremsen: {
    id: 'sh_bremsen',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '03. Bremsen (Zielbremsung)',
    description: 'Rèn luyện cảm giác phanh: Rà phanh giảm tốc êm dịu và dừng xe chuẩn xác trước vạch dừng Haltelinie',
    startPoint: 'b6_ampel',
    scenarios: ['sh_ampel']
  },
  sh_lenken: {
    id: 'sh_lenken',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '04. Lenken & Slalom',
    description: 'Kỹ thuật đánh lái vô lăng: Giữ vận tốc < 18 km/h, đánh lái đều tay uốn lượn qua 8 cọc tiêu ziczac',
    startPoint: 'b1_slalom',
    scenarios: ['sh_slalom']
  },
  sh_schalten: {
    id: 'sh_schalten',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '05. Schalten / Getriebe',
    description: 'Thao tác cần số tự động: Chuyển đổi chính xác giữa P (Đỗ), R (Lùi), N (Mo) và D (Tiến)',
    startPoint: 'b10_accel',
    scenarios: ['sh_acceleration']
  },
  sh_rueckwaerts: {
    id: 'sh_rueckwaerts',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '06. Rückwärtsfahren & Wenden',
    description: 'Lùi xe an toàn: Bật xi-nhan phải (E), cài số R (2), quan sát camera lùi (M) và 2 gương hông',
    startPoint: 'b8_backturn',
    scenarios: ['sh_backward_turn']
  },
  sh_berg: {
    id: 'sh_berg',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '07. Berganfahrten (Dốc 10%)',
    description: 'Khởi hành ngang dốc StVO: Dừng trước vạch đỏ, kéo phanh tay, nhấn ga vừa đủ tiến dứt khoát không tụt lùi',
    startPoint: 'b2_hill',
    scenarios: ['sh_hill']
  },
  sh_blick: {
    id: 'sh_blick',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '08. Blickführung (Tầm nhìn)',
    description: 'Kỹ thuật quan sát: Nhìn xa về phía trước bám tim đường, quét mắt qua gương trung tâm mỗi 5-8 giây',
    startPoint: 'start',
    scenarios: ['sh_slalom']
  },
  sh_schulter: {
    id: 'sh_schulter',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '09. Schulterblick (Điểm mù)',
    description: 'Ngoái đầu quan sát điểm mù qua vai Trái (Z) và Phải (X) trước khi đánh lái chuyển hướng xe',
    startPoint: 'b3_parallel',
    scenarios: ['sh_parallel_parking']
  },
  sh_bedienung: {
    id: 'sh_bedienung',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: '10. Blinker / Licht / Warnblinker',
    description: 'Sử dụng hệ thống tín hiệu xe: Xi-nhan Trái (Q), Xi-nhan Phải (E), Bật đèn (L), Cảnh báo nguy hiểm (H)',
    startPoint: 'start',
    scenarios: ['sh_slalom']
  },

  // Giữ nguyên các alias bài tập Sa Hình cũ để tương thích 100%
  sahinh_full_01: {
    id: 'sahinh_full_01',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Khu Sa Hình Lái Xe Tổng Hợp Liên Hoàn',
    description: 'Lộ trình liên hoàn đầy đủ: Ziczac, Ghép xe song song, Ngã tư đèn đỏ, Ghép vuông góc, Chữ S, Phanh gấp',
    startPoint: 'start',
    scenarios: [
      'sh_slalom', 'sh_ampel_crosswalk', 'sh_intersection_4way', 'sh_parallel_parking',
      'sh_intersection_3way', 'sh_perpendicular_parking', 'sh_emergency_brake', 'sh_finish'
    ]
  },
  sahinh_b1_slalom: {
    id: 'sahinh_b1_slalom',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 1: Lái Ziczac (Slalom)',
    description: 'Vận tốc < 18 km/h, đánh lái đều tay uốn lượn qua 8 cọc tiêu',
    startPoint: 'b1_slalom',
    scenarios: ['sh_slalom']
  },
  sahinh_b2_hill: {
    id: 'sahinh_b2_hill',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 2: Dốc 10% (Anfahren am Berg)',
    description: 'Dừng đúng vạch đỏ, kéo phanh tay và khởi hành không tuột dốc',
    startPoint: 'b2_hill',
    scenarios: ['sh_hill']
  },
  sahinh_b3_parallel: {
    id: 'sahinh_b3_parallel',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 3: Ghép xe song song (Längsparken)',
    description: 'Bật xi-nhan phải, vào số R lùi ghép xe giữa 2 xe ô tô đỗ bên đường',
    startPoint: 'b3_parallel',
    scenarios: ['sh_parallel_parking']
  },
  sahinh_b4_perpendicular: {
    id: 'sahinh_b4_perpendicular',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 4: Ghép vuông góc (Querparken 90°)',
    description: 'Xi-nhan phải, đánh lái lùi vuông góc 90 độ vào chuồng đỗ',
    startPoint: 'b4_perpendicular',
    scenarios: ['sh_perpendicular_parking']
  },
  sahinh_b5_scurve: {
    id: 'sahinh_b5_scurve',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 5: Đường quanh co chữ S',
    description: 'Tốc độ < 18 km/h, bám mép ngoài, không đè cọc tiêu hai bên',
    startPoint: 'b5_scurve',
    scenarios: ['sh_s_curve']
  },
  sahinh_b6_ampel: {
    id: 'sahinh_b6_ampel',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 6: Đèn đỏ & Vạch đi bộ (Ampel)',
    description: 'Dừng bánh xe trước vạch Haltelinie đỏ và nhường người đi bộ',
    startPoint: 'b6_ampel',
    scenarios: ['sh_ampel']
  },
  sahinh_b7_brake: {
    id: 'sahinh_b7_brake',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 7: Phanh khẩn cấp (Gefahrenbremsung)',
    description: 'Đạt 30 km/h -> Hiệu lệnh phanh gấp -> Đạp phanh kịch sàn dừng dưới 6m',
    startPoint: 'b7_brake',
    scenarios: ['sh_emergency_brake']
  },
  sahinh_b8_backturn: {
    id: 'sahinh_b8_backturn',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 8: Lùi cua 90° (Rückwärts rechts)',
    description: 'Tiến qua ngã 3, xi-nhan phải, vào số R lùi ôm mép đường 30-50cm',
    startPoint: 'b8_backturn',
    scenarios: ['sh_backward_turn']
  },
  sahinh_b9_umkehren: {
    id: 'sahinh_b9_umkehren',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 9: Quay đầu 3 điểm (Umkehren)',
    description: 'Đánh lái trái -> Vào số R lùi sang lề -> Tiến thẳng đổi chiều xe',
    startPoint: 'b9_umkehren',
    scenarios: ['sh_umkehren']
  },
  sahinh_b10_accel: {
    id: 'sahinh_b10_accel',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 10: Tăng tốc & chuyển số (Gangwechsel)',
    description: 'Tăng tốc đạt 40-50 km/h qua các cấp số rồi giảm tốc êm dịu',
    startPoint: 'b10_accel',
    scenarios: ['sh_acceleration']
  },
  sahinh_b11_finish: {
    id: 'sahinh_b11_finish',
    area: 'SA_HINH',
    tab: 'SA_HINH',
    map: 'sa_hinh_fahrschule',
    title: 'Bài 11: Vạch đích & Dừng đỗ an toàn (Ziel)',
    description: 'Xi-nhan phải tấp lề, dừng sau vạch đích, về số P, kéo phanh tay',
    startPoint: 'b11_finish',
    scenarios: ['sh_finish']
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🏙️ 2. STADTVERKEHR — TRONG THÀNH PHỐ (Mục lớn nhất)
  // ══════════════════════════════════════════════════════════════════════════
  stadt_geradeaus: {
    id: 'stadt_geradeaus',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '01. Geradeausfahren (50 & 30 km/h)',
    description: 'Chạy thẳng đúng làn đường trong đô thị, tuân thủ biển báo tốc độ 50 km/h và khu vực 30-Zone',
    startPoint: 'start_torstrasse',
    scenarios: ['st_50']
  },
  stadt_rvl_01: {
    id: 'stadt_rvl_01',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '02. Rechts vor Links (§ 8 StVO)',
    description: 'Quy tắc ưu tiên xe bên phải: Giảm tốc độ < 20 km/h, Schulterblick phải (X) quan sát và nhường xe bên phải',
    startPoint: 'start_rvl',
    scenarios: ['rvl_approach', 'rvl_turn_right', 'rvl_turn_left', 'rvl_finish']
  },
  stadt_ampel_01: {
    id: 'stadt_ampel_01',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '03. Ampel & Haltelinie (§ 37 StVO)',
    description: 'Đèn tín hiệu giao thông: Dừng hẳn trước vạch dừng khi đèn đỏ/vàng, chỉ di chuyển khi đèn xanh bật',
    startPoint: 'start_ampel',
    scenarios: ['st_ampel', 'st_stop']
  },
  stadt_vorfahrt: {
    id: 'stadt_vorfahrt',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '04. Vorfahrtsschilder (Z. 306, 205, 206)',
    description: 'Biển báo quyền ưu tiên: Biển đường ưu tiên hình thoi vàng (Z. 306), Tam giác ngược nhường đường (Z. 205) và STOP (Z. 206)',
    startPoint: 'start_vorfahrt',
    scenarios: ['rvl_approach', 'rvl_turn_right']
  },
  stadt_kreuzungen: {
    id: 'stadt_kreuzungen',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '05. Kreuzungen & Einmündungen',
    description: 'Vượt qua các giao lộ ngã 3, ngã 4: Giảm tốc độ, quan sát tầm nhìn 2 hướng, xác định đúng thứ tự đi trước',
    startPoint: 'start_kreuzung',
    scenarios: ['tp_turn_right_1', 'tp_turn_left_1']
  },
  stadt_turn_01: {
    id: 'stadt_turn_01',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '06. Rechtsabbiegen (Rẽ phải 90°)',
    description: 'Quy trình 3 bước rẽ phải StVO: Gương chiếu hậu -> Xi-nhan Phải (E) -> Schulterblick Phải (X) -> Rẽ ôm sát lề',
    startPoint: 'start_turn_right',
    scenarios: ['tp_turn_right_1', 'tp_turn_right_2', 'tp_finish']
  },
  stadt_linksabbiegen: {
    id: 'stadt_linksabbiegen',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '07. Linksabbiegen (Rẽ trái)',
    description: 'Quy trình rẽ trái StVO: Xi-nhan Trái (Q), Schulterblick Trái (Z), tiến đến giữa ngã tư và NHƯỜNG XE ĐI THẲNG',
    startPoint: 'start_turn_left',
    scenarios: ['tp_turn_left_1', 'tp_finish']
  },
  stadt_mehrspurig: {
    id: 'stadt_mehrspurig',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '08. Mehrspuriges Abbiegen',
    description: 'Rẽ tại giao lộ nhiều làn đường: Chọn đúng làn mũi tên chỉ dẫn từ xa, giữ nguyên làn xe trong suốt khúc rẽ',
    startPoint: 'start_mollstrasse',
    scenarios: ['st_turn_right', 'st_50']
  },
  stadt_kreisverkehr_01: {
    id: 'stadt_kreisverkehr_01',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '09. Kreisverkehr (Z. 215 / Z. 205)',
    description: 'Vòng xuyến StVO: Không bật xi-nhan khi vào, nhường xe trong đảo, bắt buộc bật Xi-nhan Phải (E) & Schulterblick khi ra',
    startPoint: 'start_kreisverkehr',
    scenarios: ['kv_entry', 'kv_inside', 'kv_exit', 'kv_finish']
  },
  stadt_einbahnstrasse: {
    id: 'stadt_einbahnstrasse',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '10. Einbahnstraße (Đường 1 chiều)',
    description: 'Đặc thù đường 1 chiều (Z. 220): Được đỗ xe 2 bên lề; khi muốn rẽ trái bắt buộc phải ép sát lề đường bên trái',
    startPoint: 'start_linienstrasse',
    scenarios: ['st_turn_right', 'st_rvl']
  },
  stadt_parkende: {
    id: 'stadt_parkende',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '11. Parkende Fahrzeuge (Vượt xe đỗ)',
    description: 'Tránh xe đang dừng đỗ bên đường: Bật xi-nhan trái, giữ khoảng cách hông tối thiểu 1.0m đề phòng cửa xe bật mở',
    startPoint: 'start_parkende',
    scenarios: ['st_50', 'st_ampel']
  },
  stadt_engstellen: {
    id: 'stadt_engstellen',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '12. Engstellen & Hindernisse (Z. 208/308)',
    description: 'Đi qua đường hẹp có chướng ngại vật: Xe nào có chướng ngại vật bên làn mình thì phải dừng lại nhường đường',
    startPoint: 'start_engstelle',
    scenarios: ['st_stop', 'st_turn_right']
  },
  stadt_fussgaengerweg: {
    id: 'stadt_fussgaengerweg',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '13. Fußgängerüberweg (Zebrastreifen)',
    description: 'Vạch sang đường cho người đi bộ (Z. 293): Giảm tốc độ từ xa, dừng hẳn xe khi có người đi bộ chuẩn bị bước qua',
    startPoint: 'start_zebra',
    scenarios: ['st_ampel', 'st_stop']
  },
  stadt_fussgaenger: {
    id: 'stadt_fussgaenger',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '14. Fußgänger beim Abbiegen',
    description: 'Nhường người đi bộ khi rẽ: Khi rẽ phải hoặc rẽ trái, luôn phải dừng lại nhường người đi bộ đang băng qua đường song song',
    startPoint: 'start_abbiegen_ped',
    scenarios: ['st_turn_right', 'st_finish']
  },
  stadt_radfahrer: {
    id: 'stadt_radfahrer',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '15. Radfahrer & Toter Winkel',
    description: 'Xe đạp cùng chiều & Điểm mù: Cực kỳ nguy hiểm khi rẽ phải, bắt buộc Schulterblick Phải (X) kiểm tra làn xe đạp',
    startPoint: 'start_radfahrer',
    scenarios: ['st_turn_right', 'st_rvl']
  },
  stadt_bus_bahn: {
    id: 'stadt_bus_bahn',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '16. Linienbus & Straßenbahn (§ 20 StVO)',
    description: 'Xe buýt bật đèn cảnh báo tại trạm đỗ: Chỉ được vượt qua với tốc độ đi bộ (Schrittgeschwindigkeit 4-7 km/h)',
    startPoint: 'start_tram',
    scenarios: ['st_50', 'st_stop']
  },
  stadt_spurwechsel: {
    id: 'stadt_spurwechsel',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '17. Spurwechsel im Stadtverkehr',
    description: 'Chuyển làn đường trong phố: Gương trong -> Gương ngoài -> Xi-nhan -> Schulterblick -> Đổi làn dứt khoát êm dịu',
    startPoint: 'start_spurwechsel',
    scenarios: ['st_50', 'st_turn_right']
  },
  stadt_abknickend: {
    id: 'stadt_abknickend',
    area: 'STADT',
    tab: 'STADT',
    map: 'stadt_zentrum',
    title: '18. Abknickende Vorfahrtstraße (Z. 306)',
    description: 'Đường ưu tiên bẻ cua: Bắt buộc bật xi-nhan theo hướng đường ưu tiên bẻ cong, dù vẫn đi trên đường ưu tiên',
    startPoint: 'start_abknickend',
    scenarios: ['rvl_turn_right', 'rvl_turn_left']
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🌳 3. LANDSTRASSE — ĐƯỜNG NGOÀI ĐÔ THỊ
  // ══════════════════════════════════════════════════════════════════════════
  land_tempo: {
    id: 'land_tempo',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '01. Fahren mit 70/80/100 km/h (§ 3 StVO)',
    description: 'Tốc độ tối đa ngoài đô thị là 100 km/h. Điều chỉnh tốc độ thích ứng theo biển báo 70 hoặc 80 km/h',
    startPoint: 'start',
    scenarios: ['land_tempo_cruise']
  },
  land_kurven: {
    id: 'land_kurven',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '02. Kurven (Vào cua đường trường)',
    description: 'Kỹ thuật vào cua tốc độ cao: Giảm tốc trước khi vào cua, đệm ga nhẹ giữ thăng bằng xe khi thoát cua',
    startPoint: 'curves',
    scenarios: ['land_curve_approach']
  },
  land_enge_kurven: {
    id: 'land_enge_kurven',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '03. Enge Kurven & Kurvenradius',
    description: 'Khúc cua tay áo gắt (Z. 103/105): Giảm tốc độ xuống < 50 km/h, bám đúng làn bên phải, tuyệt đối không chém vạch',
    startPoint: 'curves',
    scenarios: ['land_sharp_curve']
  },
  land_gegenverkehr: {
    id: 'land_gegenverkehr',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '04. Gegenverkehr (Xe ngược chiều)',
    description: 'Tránh xe ngược chiều trên đường hẹp không dải phân cách: Giữ khoảng cách sườn, bám sát mép phải vạch liền',
    startPoint: 'start',
    scenarios: ['land_against_traffic']
  },
  land_ueberholen: {
    id: 'land_ueberholen',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '05. Überholen auf Landstraßen (§ 5 StVO)',
    description: 'Vượt xe trên quốc lộ: Chỉ vượt khi tầm nhìn phía trước thông thoáng > 600m và không có biển cấm vượt (Z. 276)',
    startPoint: 'overtake',
    scenarios: ['land_overtake_pass']
  },
  land_ueberholen_rad: {
    id: 'land_ueberholen_rad',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '06. Überholen von Radfahrern (2.0m)',
    description: 'Vượt người đi xe đạp ngoài đô thị: Luật StVO bắt buộc giữ khoảng cách hông tối thiểu 2.0 mét!',
    startPoint: 'start',
    scenarios: ['land_bike_overtake']
  },
  land_einmuendungen: {
    id: 'land_einmuendungen',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '07. Einmündungen & Einbiegen',
    description: 'Giao cắt đường nhánh từ thôn xóm: Chú ý phương tiện nông nghiệp (máy cày) hoặc xe bất ngờ lao ra đường chính',
    startPoint: 'start',
    scenarios: ['land_junction_watch']
  },
  land_waldstrecken: {
    id: 'land_waldstrecken',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '08. Waldstrecken (Đoạn đường rừng)',
    description: 'Đoạn đường đi xuyên qua rừng: Tầm nhìn bị che khuất bởi bóng cây, mặt đường dễ trơn trượt do lá rụng ẩm ướt',
    startPoint: 'wildwechsel',
    scenarios: ['land_forest_drive']
  },
  land_wildwechsel: {
    id: 'land_wildwechsel',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '09. Wildwechsel (Động vật hoang dã - Z. 142)',
    description: 'Cảnh báo hươu/nai chạy qua đường: Giảm tốc độ, sẵn sàng đạp phanh. Nếu gặp thú rừng: Đạp phanh khẩn cấp, giữ chặt lái',
    startPoint: 'wildwechsel',
    scenarios: ['land_wildlife_hazard']
  },
  land_kuppen: {
    id: 'land_kuppen',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '10. Kuppen (Đỉnh dốc khuất tầm nhìn)',
    description: 'Lên đỉnh dốc khuất tầm nhìn phía trước: Tuyệt đối cấm vượt xe, đi chậm bám sát lề đường bên phải',
    startPoint: 'curves',
    scenarios: ['land_crest_drive']
  },
  land_schlechte_sicht: {
    id: 'land_schlechte_sicht',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '11. Schlechte Sicht (Mưa & Sương mù)',
    description: 'Lái xe trong điều kiện tầm nhìn kém: Bật đèn cốt Abblendlicht (L), giữ quy tắc: Tầm nhìn bằng bao nhiêu mét thì chạy bấy nhiêu km/h',
    startPoint: 'start',
    scenarios: ['land_fog_drive']
  },
  land_baustellen: {
    id: 'land_baustellen',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '12. Baustellen (Công trường đường trường)',
    description: 'Đoạn đường đang thi công (Z. 123): Tuân thủ biển hạn chế tốc độ 50 km/h, vạch sơn màu vàng thay thế vạch trắng',
    startPoint: 'overtake',
    scenarios: ['land_roadwork']
  },
  land_abbiegen: {
    id: 'land_abbiegen',
    area: 'LANDSTRASSE',
    tab: 'LANDSTRASSE',
    map: 'landstrasse_wald',
    title: '13. Abbiegen auf Landstraßen',
    description: 'Rẽ trái/phải từ quốc lộ tốc độ cao: Bật xi-nhan báo hiệu sớm từ xa, phanh giảm tốc độ từ từ tránh bị xe sau húc đuôi',
    startPoint: 'finish',
    scenarios: ['land_highspeed_turn']
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🛣️ 4. AUTOBAHN — ĐƯỜNG CAO TỐC
  // ══════════════════════════════════════════════════════════════════════════
  autobahn_enter_01: {
    id: 'autobahn_enter_01',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '01. Auffahren auf die Autobahn',
    description: 'Tiếp cận lối vào cao tốc: Nhận diện biển bắt đầu cao tốc (Zeichen 330.1), chuẩn bị gia tốc',
    startPoint: 'start',
    scenarios: ['ab_enter']
  },
  autobahn_beschleunigung: {
    id: 'autobahn_beschleunigung',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '02. Beschleunigungsstreifen',
    description: 'Làn tăng tốc: Đạp hết ga tăng tốc lên tốc độ tương đương dòng xe trên cao tốc (> 80-100 km/h)',
    startPoint: 'start',
    scenarios: ['ab_enter']
  },
  autobahn_einfaedeln: {
    id: 'autobahn_einfaedeln',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '03. Einfädeln (Nhập làn cao tốc)',
    description: 'Nhập làn xe: Xi-nhan Trái (Q), Schulterblick Trái (Z) quan sát khoảng trống an toàn và hòa vào luồng xe',
    startPoint: 'start',
    scenarios: ['ab_enter']
  },
  autobahn_rechtsfahrgebot: {
    id: 'autobahn_rechtsfahrgebot',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '04. Rechtsfahrgebot (§ 2 Abs. 2 StVO)',
    description: 'Quy tắc đi bên phải: Luôn di chuyển ở làn ngoài cùng bên phải, các làn bên trái chỉ dùng để vượt xe',
    startPoint: 'start',
    scenarios: ['ab_cruise']
  },
  autobahn_spurwechsel: {
    id: 'autobahn_spurwechsel',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '05. Spurwechsel bei hoher Geschwindigkeit',
    description: 'Chuyển làn tốc độ cao: Quy trình 3 bước (Gương -> Xi-nhan -> Schulterblick) và đánh lái cực kỳ êm dịu',
    startPoint: 'start',
    scenarios: ['ab_cruise']
  },
  autobahn_cruise_01: {
    id: 'autobahn_cruise_01',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '06. Überholen & Richtgeschwindigkeit (130 km/h)',
    description: 'Chạy đường trường và vượt xe: Duy trì tốc độ khuyến nghị 130 km/h, chỉ vượt bên trái, cấm vượt bên phải',
    startPoint: 'start',
    scenarios: ['ab_cruise']
  },
  autobahn_sicherheitsabstand: {
    id: 'autobahn_sicherheitsabstand',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '07. Sicherheitsabstand (Halber Tacho)',
    description: 'Khoảng cách an toàn theo StVO: Khoảng cách tối thiểu bằng nửa tốc độ đồng hồ (100 km/h = 50m khoảng cách)',
    startPoint: 'start',
    scenarios: ['ab_cruise']
  },
  autobahn_lkw: {
    id: 'autobahn_lkw',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '08. LKW überholen (Vượt xe tải dài)',
    description: 'Kỹ năng vượt xe tải nặng: Chú ý lực gió hút sườn xe, chỉ nhập lại làn phải khi đã nhìn thấy đầu xe tải trong gương giữa',
    startPoint: 'start',
    scenarios: ['ab_cruise']
  },
  autobahn_kreuz: {
    id: 'autobahn_kreuz',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '09. Autobahnkreuz & Dreieck',
    description: 'Nút giao cao tốc phức hợp: Đọc biển báo chỉ dẫn từ xa (Blaue Vorwegweiser), chọn làn theo hướng đi',
    startPoint: 'start',
    scenarios: ['ab_cruise', 'ab_exit']
  },
  autobahn_exit_01: {
    id: 'autobahn_exit_01',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '10. Ausfahrt (Rời cao tốc - Z. 332)',
    description: 'Quy trình rời cao tốc: Bật Xi-nhan Phải (E) từ biển báo 300m, Schulterblick Phải (X) chuyển sang làn ra',
    startPoint: 'start',
    scenarios: ['ab_exit', 'ab_finish']
  },
  autobahn_verzoegerung: {
    id: 'autobahn_verzoegerung',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '11. Verzögerungsstreifen (Làn giảm tốc)',
    description: 'Quy tắc StVO: Chỉ đạp phanh giảm tốc độ SAU KHI đã sang hẳn làn Verzögerungsstreifen, tránh xe sau húc đuôi',
    startPoint: 'start',
    scenarios: ['ab_exit', 'ab_finish']
  },
  autobahn_stau: {
    id: 'autobahn_stau',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '12. Stauende absichern (Cảnh báo ùn tắc)',
    description: 'Khi phát hiện đuôi đoàn xe ùn tắc phía trước: Bật ngay đèn cảnh báo khẩn cấp Warnblinklicht (H), giảm tốc từ xa',
    startPoint: 'start',
    scenarios: ['ab_rettungsgasse']
  },
  autobahn_rettung_01: {
    id: 'autobahn_rettung_01',
    area: 'AUTOBAHN',
    tab: 'AUTOBAHN',
    map: 'autobahn_a',
    title: '13. Rettungsgasse (§ 11 Abs. 2 StVO)',
    description: 'Hành lang cứu hộ khẩn cấp: Xe làn ngoài cùng bên trái áp sát sang trái, tất cả các làn còn lại ép sang phải',
    startPoint: 'start',
    scenarios: ['ab_rettungsgasse', 'ab_finish']
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🎓 5. BÀI TEST — THI SÁT HẠCH TỔNG HỢP (PRÜFUNGSSIMULATION)
  // ══════════════════════════════════════════════════════════════════════════
  exam_sahinh_01: {
    id: 'exam_sahinh_01',
    area: 'PRUEFUNG',
    tab: 'PRUEFUNG',
    map: 'sa_hinh_fahrschule',
    title: '01. Sa Hình Gesamtprüfung (850m)',
    description: 'Sát hạch liên hoàn 8 bài Grundfahraufgaben: Slalom, Ghép song song, Ngã tư, Ghép vuông góc, Chữ S, Phanh khẩn cấp',
    startPoint: 'start',
    scenarios: [
      'sh_slalom', 'sh_ampel_crosswalk', 'sh_intersection_4way', 'sh_parallel_parking',
      'sh_intersection_3way', 'sh_perpendicular_parking', 'sh_emergency_brake', 'sh_finish'
    ]
  },
  exam_stadt_01: {
    id: 'exam_stadt_01',
    area: 'PRUEFUNG',
    tab: 'PRUEFUNG',
    map: 'stadt_zentrum',
    title: '02. Stadtprüfung Gesamt (560m)',
    description: 'Bài thi sát hạch Đô thị tổng hợp: Tốc độ 50/30 km/h, đèn đỏ, biển STOP, rẽ phải 90°, Rechts vor Links',
    startPoint: 'start',
    scenarios: ['st_50', 'st_ampel', 'st_stop', 'st_turn_right', 'st_rvl', 'st_finish']
  },
  exam_landstrasse_01: {
    id: 'exam_landstrasse_01',
    area: 'PRUEFUNG',
    tab: 'PRUEFUNG',
    map: 'landstrasse_wald',
    title: '03. Landstraßenprüfung (Überlandfahrt - 1200m)',
    description: 'Bài thi sát hạch Đường ngoài đô thị: Tốc độ 100 km/h, vào cua an toàn, phản xạ động vật Wildwechsel, vượt xe',
    startPoint: 'start',
    scenarios: ['land_tempo_cruise', 'land_curve_approach', 'land_sharp_curve', 'land_wildlife_hazard', 'land_finish']
  },
  exam_autobahn_01: {
    id: 'exam_autobahn_01',
    area: 'PRUEFUNG',
    tab: 'PRUEFUNG',
    map: 'autobahn_a',
    title: '04. Autobahnprüfung Gesamt (820m)',
    description: 'Bài thi sát hạch Cao tốc tổng hợp: Làn tăng tốc Auffahren, tốc độ 130 km/h, Rettungsgasse, lối ra Ausfahrt',
    startPoint: 'start',
    scenarios: ['ab_enter', 'ab_cruise', 'ab_rettungsgasse', 'ab_exit', 'ab_finish']
  },
  exam_gesamt_b: {
    id: 'exam_gesamt_b',
    area: 'PRUEFUNG',
    tab: 'PRUEFUNG',
    map: 'sa_hinh_fahrschule',
    title: '05. Praktische Fahrprüfung Klasse B (TÜV / DEKRA)',
    description: 'Mô phỏng buổi thi sát hạch chính thức: Giám khảo chấm điểm nghiêm ngặt, áp dụng lỗi trượt trực tiếp StVO',
    startPoint: 'start',
    scenarios: [
      'sh_slalom', 'sh_ampel_crosswalk', 'sh_intersection_4way', 'sh_parallel_parking',
      'sh_perpendicular_parking', 'sh_emergency_brake', 'sh_finish'
    ]
  },
  exam_rvl_01: {
    id: 'exam_rvl_01',
    area: 'PRUEFUNG',
    tab: 'PRUEFUNG',
    map: 'kreuzung_rvl',
    title: '06. Rechts vor Links Spezialprüfung',
    description: 'Bài thi chuyên đề ngã 4 ưu tiên bên phải: Xử lý 3 giao lộ liên tiếp đúng quy tắc StVO',
    startPoint: 'start',
    scenarios: ['rvl_approach', 'rvl_turn_right', 'rvl_turn_left', 'rvl_finish']
  }
};
