// ── Scenario types ──────────────────────────────────────────────────────────
// Each scenario triggers when player reaches `triggerZ` (world units traveled)
// and resolves when player passes `resolveZ`

export const EXERCISE_CATEGORIES = [
  {
    id: 'TRAINING',
    title: 'ÜBUNGSBEREICHE (Luyện Tập Tình Huống)',
    subtitle: 'Chọn bài luyện tập cụ thể theo từng kỹ năng và môi trường',
    groups: [
      {
        id: 'STADT',
        name: 'STADT (Đô thị)',
        mapId: 'STADTFAHRT',
        exercises: [
          { id: 'st_rvl', name: '01. Rechts vor Links', desc: 'Ưu tiên xe bên phải ngã tư', scenarioIdx: 4, environment: 'RECHTS_VOR_LINKS' },
          { id: 'st_turning', name: '02. Abbiegen (90°)', desc: 'Quy trình 3 bước rẽ góc 90°', scenarioIdx: 3, environment: 'TURNING_PRACTICE' },
          { id: 'st_kreis', name: '03. Kreisverkehr', desc: 'Vào & rời vòng xuyến StVO', scenarioIdx: 0, environment: 'KREISVERKEHR' },
          { id: 'st_ampel', name: '04. Ampel & STOP', desc: 'Đèn tín hiệu & Biển báo Dừng', scenarioIdx: 1, environment: 'STADTFAHRT' }
        ]
      },
      {
        id: 'AUTOBAHN',
        name: 'AUTOBAHN (Cao tốc)',
        mapId: 'AUTOBAHN',
        exercises: [
          { id: 'ab_enter', name: '01. Auffahren', desc: 'Nhập làn tăng tốc Beschleunigungsstreifen', scenarioIdx: 0, environment: 'AUTOBAHN' },
          { id: 'ab_cruise', name: '02. Überholen & Tempo', desc: 'Vận tốc Richtgeschwindigkeit 130 km/h', scenarioIdx: 1, environment: 'AUTOBAHN' },
          { id: 'ab_rettung', name: '03. Rettungsgasse', desc: 'Tạo hành lang xe cứu hộ khi tắc đường', scenarioIdx: 2, environment: 'AUTOBAHN' },
          { id: 'ab_exit', name: '04. Abfahren', desc: 'Xi-nhan & giảm tốc làn lối ra Ausfahrt', scenarioIdx: 3, environment: 'AUTOBAHN' }
        ]
      }
    ]
  },
  {
    id: 'PRUEFUNG',
    title: 'PRAKTISCHE PRÜFUNG (Thi Sát Hạch Tổng Hợp)',
    subtitle: 'Chạy toàn bộ lộ trình kiểm tra tiêu chuẩn sát hạch Fahrprüfer',
    exams: [
      { id: 'p_stadt', name: 'Stadtprüfung', desc: 'Bài thi tổng hợp Đô thị (560m)', environment: 'STADTFAHRT' },
      { id: 'p_autobahn', name: 'Autobahnprüfung', desc: 'Bài thi tổng hợp Cao tốc (820m)', environment: 'AUTOBAHN' },
      { id: 'p_rvl', name: 'Rechts vor Links Prüfung', desc: 'Bài thi Chuyên đề Ưu tiên bên phải', environment: 'RECHTS_VOR_LINKS' }
    ]
  },
  {
    id: 'FREI',
    title: 'FREIES FAHREN (Lái Tự Do)',
    subtitle: 'Tự do chọn môi trường lái xe để trải nghiệm',
    environments: [
      { id: 'STADTFAHRT', name: 'Stadt', desc: 'Phố xá đô thị Đức' },
      { id: 'AUTOBAHN', name: 'Autobahn', desc: 'Đường cao tốc không giới hạn' },
      { id: 'RECHTS_VOR_LINKS', name: 'Kreuzungsbereich', desc: 'Khu vực giao lộ ngã 3/4' },
      { id: 'KREISVERKEHR', name: 'Kreisverkehr', desc: 'Vòng xuyến giao thông' }
    ]
  }
];

export const MAP_TYPES = [
  {
    id: 'RECHTS_VOR_LINKS',
    nameVi: '🛑 Ngã 4 Rechts vor Links',
    nameDe: 'Rechts vor Links Kreuzung',
    desc: 'Luyện tập giao lộ ưu tiên xe bên phải. Yêu cầu giảm tốc (<20km/h), Schulterblick Phải (X) và nhường xe bên phải.',
    icon: '🛑'
  },
  {
    id: 'TURNING_PRACTICE',
    nameVi: '↗️ Ngã 3/4 Rẽ Trái & Rẽ Phải (90°)',
    nameDe: 'Links & Rechts Abbiegen 90°',
    desc: 'Luyện quy trình 3 bước trước khi rẽ: Gương -> Xi-nhan (Q/E) -> Schulterblick (Z/X) -> Rẽ vuông góc 90°.',
    icon: '↗️'
  },
  {
    id: 'KREISVERKEHR',
    nameVi: '🔄 Vòng Xuyến Đức (Kreisverkehr)',
    nameDe: 'Kreisverkehr (Z. 215/205)',
    desc: 'Nhường xe trong vòng xuyến, không bật xi-nhan khi vào, bắt buộc bật Xi-nhan Phải (E) & Schulterblick khi ra.',
    icon: '🔄'
  },
  {
    id: 'STADTFAHRT',
    nameVi: '🏙️ Đô Thị Tổng Hợp (Stadtfahrt)',
    nameDe: 'Stadtfahrt Gesamtprüfung',
    desc: 'Bài thi tổng hợp trong thành phố: Đèn đỏ, biển STOP, vạch đi bộ, đường 30km/h và ngã tư.',
    icon: '🏙️'
  },
  {
    id: 'AUTOBAHN',
    nameVi: '🛣️ Cao Tốc (Autobahn & Ausfahrt)',
    nameDe: 'Autobahnfahrt & Rettungsgasse',
    desc: 'Làn tăng tốc Beschleunigungsstreifen, tốc độ 130km/h, Rettungsgasse và lối ra Ausfahrt.',
    icon: '🛣️'
  },
  {
    id: 'SA_HINH_FAHRSCHULE',
    nameVi: '🏎️ Sa Hình Học Lái Xe 3D (11 Bài Thi)',
    nameDe: 'Fahrschule Grundfahraufgaben (11 Aufgaben)',
    desc: 'Luyện tập và thi sát hạch toàn diện 11 bài sa hình chuẩn Đức & Việt: Slalom, Dốc 10%, Ghép song song, Ghép vuông góc, Chữ S, Đèn đỏ, Phanh khẩn cấp, Lùi 90°, Quay đầu 3 điểm, Tăng tốc, Về đích.',
    icon: '🏎️'
  }
];

export const MAP_SCENARIOS = {
  RECHTS_VOR_LINKS: [
    {
      id: 'rvl_approach', type: 'RIGHT_BEFORE_LEFT',
      triggerZ: 10, resolveZ: 120,
      warn: '⚠️ Đang tới Ngã 4 không biển ưu tiên (Rechts vor Links) — Giảm tốc (< 20 km/h) & Schulterblick Phải (X) để quan sát xe bên phải!',
      passMsg: '✅ Quan sát giao lộ & nhường đường xe bên phải xuất sắc! (Đạt § 8 StVO)',
      failMsg: '❌ Không giảm tốc (< 20km/h) hoặc quên Schulterblick Phải (X) quan sát xe bên phải! (-20 điểm)',
      failPenalty: 20,
      check: (speed, crossedCenter, refs) => {
        const okSpeed = speed <= 22;
        const okSchulter = refs ? (refs.schulterblickRightDone || refs.lastSchulterblickDir === 'right') : false;
        return okSpeed && okSchulter;
      },
      theoryRule: {
        title: 'Nhường đường bên phải trước (Rechts vor Links - § 8 StVO)',
        rule: 'Tại ngã 3 / ngã tư không có biển ưu tiên hay đèn tín hiệu, xe đến từ bên phải luôn có quyền ưu tiên. Bắt buộc giảm tốc độ và ngoái đầu quan sát lề đường bên phải.'
      }
    },
    {
      id: 'rvl_turn_right', type: 'TURN_RIGHT',
      triggerZ: 150, resolveZ: 250,
      warn: '↗️ Ngã tư tiếp theo: Rẽ Phải vào đường RvL — Bật Xi-nhan Phải (E) & Schulterblick Phải (X)!',
      passMsg: '✅ Rẽ phải chuẩn quy trình StVO! (+5 điểm)',
      passBonus: 5,
      failMsg: '❌ Quên xi-nhan phải hoặc quên Schulterblick phải kiểm tra điểm mù! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => {
        const okSpeed = speed <= 30;
        const okBlinker = refs ? (refs.blinkerRight || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickRightDone || refs.lastSchulterblickDir === 'right') : false;
        return okSpeed && okBlinker && okSchulter;
      },
      theoryRule: {
        title: 'Rẽ phải tại ngã tư (Rechtsabbiegen - § 9 StVO)',
        rule: 'Quy trình 3 bước: Gương -> Xi-nhan Phải (E) -> Schulterblick Phải (X) -> Rẽ ôm lề đường bên phải.'
      }
    },
    {
      id: 'rvl_turn_left', type: 'TURN_LEFT',
      triggerZ: 280, resolveZ: 380,
      warn: '↖️ Ngã 4 RvL tiếp theo: Rẽ Trái — Bật Xi-nhan Trái (Q) & Schulterblick Trái (Z)! Nhường xe ngược chiều & bên phải!',
      passMsg: '✅ Rẽ trái chuẩn quy trình StVO! (+5 điểm)',
      passBonus: 5,
      failMsg: '❌ Quên xi-nhan trái hoặc quên Schulterblick trái! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => {
        const okSpeed = speed <= 30;
        const okBlinker = refs ? (refs.blinkerLeft || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickLeftDone || refs.lastSchulterblickDir === 'left') : false;
        return okSpeed && okBlinker && okSchulter;
      },
      theoryRule: {
        title: 'Rẽ trái tại ngã tư RvL (Linksabbiegen - § 9 StVO)',
        rule: 'Rẽ trái phải nhường xe ngược chiều và xe bên phải. Bắt buộc bật Xi-nhan Trái (Q) & Schulterblick Trái (Z).'
      }
    },
    {
      id: 'rvl_finish', type: 'EXAM_FINISH',
      triggerZ: 410, resolveZ: 480,
      warn: '🏁 ĐÃ HOÀN THÀNH BÀI THI KỸ NĂNG RECHTS VOR LINKS! Giảm tốc dừng xe an toàn.',
      passMsg: '🎉 XUẤT SẮC! BẠN ĐÃ ĐẠT BÀI THI RECHTS VOR LINKS.',
      check: () => true,
      theoryRule: {
        title: 'Hoàn thành bài thi',
        rule: 'Bạn đã nắm vững quy tắc ưu tiên bên phải tại các giao lộ ngã tư ở Đức.'
      }
    }
  ],

  TURNING_PRACTICE: [
    {
      id: 'tp_turn_right_1', type: 'TURN_RIGHT',
      triggerZ: 10, resolveZ: 120,
      warn: '↗️ Ngã Tư 1: Rẽ Phải (90°) — Bật Xi-nhan Phải (E) & Schulterblick Phải (X) ngoái đầu xem điểm mù!',
      passMsg: '✅ Thực hiện rẽ phải 90° xuất sắc!',
      failMsg: '❌ Quên xi-nhan phải hoặc không Schulterblick phải! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => {
        const okSpeed = speed <= 32;
        const okBlinker = refs ? (refs.blinkerRight || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickRightDone || refs.lastSchulterblickDir === 'right') : false;
        return okSpeed && okBlinker && okSchulter;
      },
      theoryRule: {
        title: 'Quy trình Rẽ Phải 90°',
        rule: 'Gương -> Xi-nhan Phải (E) -> Schulterblick Phải (X) -> Rẽ góc 90° bám sát lề đường bên phải.'
      }
    },
    {
      id: 'tp_turn_left_1', type: 'TURN_LEFT',
      triggerZ: 150, resolveZ: 250,
      warn: '↖️ Ngã Tư 2: Rẽ Trái (90°) — Bật Xi-nhan Trái (Q) & Schulterblick Trái (Z)! Nhường xe ngược chiều!',
      passMsg: '✅ Thực hiện rẽ trái 90° chuẩn quy trình!',
      failMsg: '❌ Thiếu xi-nhan trái hoặc không Schulterblick trái! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => {
        const okSpeed = speed <= 32;
        const okBlinker = refs ? (refs.blinkerLeft || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickLeftDone || refs.lastSchulterblickDir === 'left') : false;
        return okSpeed && okBlinker && okSchulter;
      },
      theoryRule: {
        title: 'Quy trình Rẽ Trái 90° (Linksabbiegen)',
        rule: 'Rẽ trái phải nhường đường cho xe ngược chiều đi thẳng. Bật xi-nhan trái và quan sát góc mù bên trái.'
      }
    },
    {
      id: 'tp_turn_right_2', type: 'TURN_RIGHT',
      triggerZ: 280, resolveZ: 380,
      warn: '↗️ Ngã Tư 3 (Phố hẹp): Rẽ Phải (90°) — Giảm tốc (< 25km/h), Xi-nhan Phải (E) & Schulterblick Phải (X)!',
      passMsg: '✅ Rẽ vào phố hẹp an toàn đúng kỹ thuật!',
      failMsg: '❌ Quên xi-nhan hoặc quên Schulterblick góc mù bên phải! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => {
        const okSpeed = speed <= 28;
        const okBlinker = refs ? (refs.blinkerRight || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickRightDone || refs.lastSchulterblickDir === 'right') : false;
        return okSpeed && okBlinker && okSchulter;
      },
      theoryRule: {
        title: 'Rẽ vào phố hẹp',
        rule: 'Giảm tốc độ thấp, kiểm tra kỹ người đi bộ/xe đạp trước khi quay tay lái 90°.'
      }
    },
    {
      id: 'tp_finish', type: 'EXAM_FINISH',
      triggerZ: 410, resolveZ: 480,
      warn: '🏁 HOÀN THÀNH BÀI TẬP RẼ TRÁI & RẼ PHẢI 90°!',
      passMsg: '🎉 XUẤT SẮC! BẠN ĐÃ THẠO KỸ THUẬT RẼ GÓC 90°.',
      check: () => true,
      theoryRule: {
        title: 'Hoàn thành bài thi rẽ',
        rule: 'Kỹ năng bẻ lái và quan sát góc mù Schulterblick của bạn đạt chuẩn thi sát hạch StVO.'
      }
    }
  ],

  KREISVERKEHR: [
    {
      id: 'kv_entry', type: 'ROUNDABOUT_ENTER',
      triggerZ: 10, resolveZ: 100,
      warn: '🔄 Đang tiến tới Vòng Xuyến Kreisverkehr (Zeichen 215) — Giảm tốc (< 25 km/h), Nhường xe trong vòng xuyến (KHÔNG BẬT XI-NHAN KHI VÀO)!',
      passMsg: '✅ Vào vòng xuyến an toàn & đúng luật StVO § 8a (Không bật xi-nhan khi vào)!',
      failMsg: '❌ Phóng nhanh vào vòng xuyến hoặc bật xi-nhan khi VÀO vòng xuyến! (Blinken beim Einfahren verboten) (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => {
        const okSpeed = speed <= 28;
        const noEnterBlinker = refs ? (!refs.blinkerLeft && !refs.blinkerRight) : false;
        return okSpeed && noEnterBlinker;
      },
      theoryRule: {
        title: 'Luật Vòng Xuyến Đức (Kreisverkehr - § 8a StVO)',
        rule: 'Xe đang chạy bên trong vòng xuyến có quyền ưu tiên tuyệt đối. CẤM BẬT XI-NHAN KHI VÀO VÒNG XUYẾN (Blinken beim Einfahren verboten).'
      }
    },
    {
      id: 'kv_inside', type: 'SPEED_LIMIT', limit: 30,
      triggerZ: 110, resolveZ: 160,
      warn: '🔄 Đang lưu thông trong Vòng Xuyến — Giữ tốc độ ổn định (< 30km/h) bám theo làn tròn!',
      passMsg: '✅ Chạy trong vòng xuyến ổn định!',
      check: (speed) => speed <= 32,
      theoryRule: {
        title: 'Chạy trong vòng xuyến',
        rule: 'Giữ tốc độ vừa phải, chú ý các lối ra tiếp theo.'
      }
    },
    {
      id: 'kv_exit', type: 'ROUNDABOUT_EXIT',
      triggerZ: 170, resolveZ: 260,
      warn: '↘️ Chuẩn bị RỜI Vòng Xuyến tại lối ra — BẮT BUỘC Bật Xi-nhan Phải (E) & Schulterblick Phải (X)!',
      passMsg: '✅ Rời vòng xuyến xuất sắc! Đã bật Xi-nhan Phải & Schulterblick đúng luật StVO § 8a.',
      passBonus: 10,
      failMsg: '❌ Quên bật Xi-nhan Phải (E) hoặc quên Schulterblick Phải (X) khi rời khỏi vòng xuyến! (-20 điểm)',
      failPenalty: 20,
      check: (speed, crossedCenter, refs) => {
        const okBlinker = refs ? (refs.blinkerRight || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickRightDone || refs.lastSchulterblickDir === 'right') : false;
        return okBlinker && okSchulter;
      },
      theoryRule: {
        title: 'Rời Vòng Xuyến (Ausfahren aus dem Kreisverkehr - § 8a Abs. 2 StVO)',
        rule: 'Khi chuẩn bị ra khỏi vòng xuyến, BẮT BUỘC phải bật xi-nhan phải (E) và ngoái đầu Schulterblick bên phải (X) quan sát xe đạp/người đi bộ.'
      }
    },
    {
      id: 'kv_finish', type: 'EXAM_FINISH',
      triggerZ: 280, resolveZ: 340,
      warn: '🏁 HOÀN THÀNH BÀI THI VÒNG XUYẾN KREISVERKEHR!',
      passMsg: '🎉 CHÚC MỪNG BẠN ĐÃ ĐẠT BÀI THI KREISVERKEHR STVO!',
      check: () => true,
      theoryRule: {
        title: 'Hoàn thành bài thi vòng xuyến',
        rule: 'Bạn đã thực hiện chuẩn xác các thao tác vào và rời vòng xuyến theo luật Đức.'
      }
    }
  ],

  STADTFAHRT: [
    {
      id: 'st_50', type: 'SPEED_LIMIT', limit: 50,
      triggerZ: 10, resolveZ: 140,
      warn: '⚠️ Khu vực 50 km/h trong Đô thị (Zone 1) — Giữ tốc độ <= 50 km/h & chú ý xe buýt/xe đạp!',
      passMsg: '✅ Tốt! Giữ đúng tốc độ quy định 50 km/h trong đô thị.',
      failMsg: '❌ Vượt quá tốc độ đô thị 50 km/h! (-10 điểm)',
      failPenalty: 10,
      check: (speed) => speed <= 55,
      theoryRule: {
        title: 'Tốc độ đô thị (Innerorts - § 3 StVO)',
        rule: 'Tốc độ tối đa trong đô thị Đức là 50 km/h, trừ khi có biển báo quy định khác.'
      }
    },
    {
      id: 'st_ampel', type: 'TRAFFIC_LIGHT',
      triggerZ: 165, resolveZ: 235,
      warn: '🚦 Đèn Tín Hiệu Ngã 4 (Z = -200m) — Dừng xe hoàn toàn trước vạch dừng Haltelinie khi đèn đỏ!',
      passMsg: '✅ Dừng đúng vạch Haltelinie trước đèn đỏ StVO! (+5 điểm)',
      passBonus: 5,
      failMsg: '❌ Vượt đèn đỏ / Chèn vạch dừng giao lộ! (-25 điểm)',
      failPenalty: 25,
      check: (speed) => speed < 2,
      theoryRule: {
        title: 'Chấp hành Đèn Đỏ (Rotlicht - § 37 StVO)',
        rule: 'Bắt buộc dừng hẳn xe trước vạch Haltelinie khi đèn tín hiệu chuyển sang màu đỏ.'
      }
    },
    {
      id: 'st_t30', type: 'SPEED_LIMIT', limit: 30,
      triggerZ: 340, resolveZ: 450,
      warn: '🏘️ Bắt đầu Khu dân cư Tempo-30-Zone (Zeichen 274.1) & Đảo giảm tốc Chicane — Giảm tốc <= 30 km/h!',
      passMsg: '✅ Vào Tempo-30-Zone an toàn & qua đảo Chicane đúng kỹ thuật! (+5 điểm)',
      passBonus: 5,
      failMsg: '❌ Quá tốc độ 30 km/h trong khu dân cư hoặc đè đảo giảm tốc! (-15 điểm)',
      failPenalty: 15,
      check: (speed) => speed <= 33,
      theoryRule: {
        title: 'Khu vực 30 km/h (Tempo-30-Zone - § 45 StVO)',
        rule: 'Trong khu dân cư, tốc độ tối đa 30 km/h. Thường áp dụng quy tắc ưu tiên bên phải (Rechts vor Links).'
      }
    },
    {
      id: 'st_rvl', type: 'RIGHT_BEFORE_LEFT',
      triggerZ: 470, resolveZ: 550,
      warn: '⚠️ Ngã 3 Rechts vor Links (Z. 102) — Giảm tốc (< 20km/h) & Schulterblick Phải (X) quan sát nhường xe bên phải!',
      passMsg: '✅ Quan sát giao lộ & nhường đường xe bên phải xuất sắc! (Đạt § 8 StVO)',
      passBonus: 5,
      failMsg: '❌ Không giảm tốc (< 20km/h) hoặc quên Schulterblick Phải (X) quan sát góc mù bên phải! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => {
        const okSpeed = speed <= 22;
        const okSchulter = refs ? (refs.schulterblickRightDone || refs.lastSchulterblickDir === 'right') : false;
        return okSpeed && okSchulter;
      },
      theoryRule: {
        title: 'Ưu tiên bên phải (Rechts vor Links - § 8 StVO)',
        rule: 'Tại các giao lộ trong khu 30 không có biển báo ưu tiên, xe đến từ bên phải luôn được ưu tiên đi trước.'
      }
    },
    {
      id: 'st_school', type: 'PEDESTRIAN_CROSSING',
      triggerZ: 580, resolveZ: 670,
      warn: '🚸 Khu vực Trường học (Z. 136) & Vạch Zebrastreifen — Giảm tốc (< 30km/h) và chú ý người đi bộ qua đường!',
      passMsg: '✅ Đi qua khu vực trường học cẩn trọng & quan sát vạch đi bộ đúng chuẩn!',
      failMsg: '❌ Phóng nhanh qua khu vực trường học / Vạch người đi bộ! (-15 điểm)',
      failPenalty: 15,
      check: (speed) => speed <= 32,
      theoryRule: {
        title: 'Chú ý Trẻ em & Vạch qua đường (Fußgängerüberweg - § 26 StVO)',
        rule: 'Phải chạy với tốc độ vừa phải, sẵn sàng dừng xe khi có người đi bộ hoặc trẻ em chuẩn bị qua đường.'
      }
    },
    {
      id: 'st_kreisverkehr', type: 'ROUNDABOUT_EXIT',
      triggerZ: 780, resolveZ: 940,
      warn: '🔄 Vòng Xuyến Đô Thị Kreisverkehr (Z = -880m) — Nhường xe trong đảo, KHÔNG xi-nhan khi vào, BẮT BUỘC Xi-nhan Phải (E) & Schulterblick Phải (X) khi ra!',
      passMsg: '✅ Vào & rời Vòng xuyến chuẩn StVO § 8a (Xi-nhan Phải & Schulterblick đúng lúc)! (+10 điểm)',
      passBonus: 10,
      failMsg: '❌ Quên Xi-nhan Phải (E) hoặc quên Schulterblick Phải (X) khi rời vòng xuyến! (-20 điểm)',
      failPenalty: 20,
      check: (speed, crossedCenter, refs) => {
        const okBlinker = refs ? (refs.blinkerRight || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickRightDone || refs.lastSchulterblickDir === 'right') : false;
        return okBlinker && okSchulter;
      },
      theoryRule: {
        title: 'Luật Vòng Xuyến Đức (§ 8a StVO)',
        rule: 'Xe trong vòng xuyến có quyền ưu tiên. Cấm xi-nhan khi vào. Bắt buộc bật xi-nhan phải và quan sát góc mù xe đạp khi rời vòng xuyến.'
      }
    },
    {
      id: 'st_baustelle', type: 'BAUSTELLE',
      triggerZ: 1080, resolveZ: 1280,
      warn: '🚧 Công Trường Đô Thị Baustelle (Z. 123) — Giảm tốc <= 30 km/h, bám làn trái tránh chướng ngại vật thi công!',
      passMsg: '✅ Vượt qua đoạn đường hẹp công trường an toàn tuyệt đối!',
      failMsg: '❌ Chạy quá 30 km/h trong công trường hoặc va chạm cọc tiêu! (-15 điểm)',
      failPenalty: 15,
      check: (speed) => speed <= 35,
      theoryRule: {
        title: 'Đoạn đường công trường (Baustelle - § 41 StVO)',
        rule: 'Tuân thủ biển báo giảm tốc độ, giữ khoảng cách với xe ngược chiều và hàng rào thi công.'
      }
    },
    {
      id: 'st_ortsausgang', type: 'SPEED_LIMIT', limit: 100,
      triggerZ: 1420, resolveZ: 1650,
      warn: '🌳 Hết Đô Thị (Ortstafel Ende Z. 311) — Giới hạn tốc độ tăng lên 100 km/h đường trường Landstraße!',
      passMsg: '✅ Tăng tốc thoát đô thị chuẩn xác!',
      failMsg: '❌ Vượt 100 km/h ngoài đô thị hoặc chưa đạt tốc độ dòng chảy (≥ 50 km/h)! (-10 điểm)',
      failPenalty: 10,
      check: (speed, crossedCenter, refs) => speed <= 110 && (refs?._scMaxSpeed ?? speed) >= 50,
      theoryRule: {
        title: 'Kết thúc khu đô thị (Ortstafel Ende - Zeichen 311)',
        rule: 'Sau biển Ortstafel gạch chéo, tốc độ tối đa cho phép là 100 km/h ngoài đô thị (Außerorts).'
      }
    },
    {
      id: 'st_finish', type: 'EXAM_FINISH',
      triggerZ: 1710, resolveZ: 1780,
      warn: '🏁 CỔNG VÒM ĐÍCH ĐẾN — HOÀN THÀNH TOÀN DIỆN BÀI THI LÁI XE ĐÔ THỊ (STADTFAHRT)!',
      passMsg: '🎉 XUẤT SẮC! BẠN ĐÃ VƯỢT QUA TOÀN BỘ 5 PHÂN KHU ĐÔ THỊ ĐỨC ĐẠT CHUẨN SÁT HẠCH FAHRPRÜFUNG!',
      check: () => true,
      theoryRule: {
        title: 'Kết thúc bài thi sát hạch đô thị',
        rule: 'Đạt mọi tiêu chuẩn StVO về tốc độ, đèn tín hiệu, nhường đường, vòng xuyến và quan sát góc mù.'
      }
    }
  ],

  AUTOBAHN: [
    {
      id: 'ab_city_50', type: 'SPEED_LIMIT', limit: 50,
      triggerZ: 25, resolveZ: 1450,
      warn: '🏘️ Lái trong phố Rhynern (Werler Straße, 50 km/h) — Đi thẳng tới biển Auffahrt để nhập cao tốc A2!',
      passMsg: '✅ Lái phố Rhynern đúng tốc độ 50 km/h & tới điểm nhập cao tốc an toàn!',
      failMsg: '❌ Phóng nhanh trong phố Rhynern (> 55 km/h)! (-10 điểm)',
      failPenalty: 10,
      check: (speed) => speed <= 55,
      theoryRule: {
        title: 'Lái trong đô thị trước khi nhập cao tốc (§ 3 StVO)',
        rule: 'Trong đô thị tốc độ tối đa 50 km/h. Quan sát biển Auffahrt (Zeichen 431) chỉ dẫn nhập cao tốc.'
      }
    },
    {
      id: 'ab_enter', type: 'AUTOBAHN_ENTER',
      triggerZ: 1500, resolveZ: 1800,
      warn: '🛣️ Auffahrt Rhynern (làn nhập Beschleunigungsstreifen) — Tăng tốc > 60 km/h, Xi-nhan Trái (Q) & Schulterblick Trái (Z) rồi nhập làn A2!',
      passMsg: '✅ Nhập làn cao tốc xuất sắc đúng vận tốc & quy trình StVO! (+10 điểm)',
      passBonus: 10,
      failMsg: '❌ Chưa đạt vận tốc (> 60km/h) hoặc quên Xi-nhan Trái / Schulterblick Trái khi nhập làn cao tốc! (-20 điểm)',
      failPenalty: 20,
      check: (speed, crossedCenter, refs) => {
        const okSpeed = speed >= 55;
        const okBlinker = refs ? (refs.blinkerLeft || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickLeftDone || refs.lastSchulterblickDir === 'left') : false;
        return okSpeed && okBlinker && okSchulter;
      },
      theoryRule: {
        title: 'Nhập làn Cao tốc (Beschleunigungsstreifen - § 18 StVO)',
        rule: 'Tăng tốc đạt vận tốc dòng xe (> 60km/h), bật Xi-nhan Trái (Q), ngoái đầu Schulterblick Trái (Z) kiểm tra góc mù rồi nhập làn an toàn.'
      }
    },
    {
      id: 'ab_cruise', type: 'AUTOBAHN_SPEED',
      triggerZ: 1850, resolveZ: 3200,
      warn: '🚀 Tốc độ Khuyến nghị Richtgeschwindigkeit (130 km/h) — Tăng tốc chạy đường trường (> 75 km/h)!',
      passMsg: '✅ Duy trì tốc độ đường trường xuất sắc!',
      failMsg: '❌ Chạy quá chậm trên cao tốc gây nguy hiểm cho xe sau! (-10 điểm)',
      failPenalty: 10,
      check: (speed) => speed >= 70,
      theoryRule: {
        title: 'Tốc độ khuyến nghị Cao tốc (Richtgeschwindigkeit 130 km/h)',
        rule: 'Tránh chạy quá chậm dưới 60 km/h trên đường cao tốc.'
      }
    },
    {
      id: 'ab_rettungsgasse', type: 'RETTUNGSGASSE',
      triggerZ: 3300, resolveZ: 3700,
      warn: '🚑 Cảnh báo Ùn tắc / Xe Cứu hộ — Tạo hành lang cứu hộ Rettungsgasse (Xe làn trái ép sát bên trái)!',
      passMsg: '✅ Giữ làn Rettungsgasse mượt mà!',
      failMsg: '❌ Không bật đèn cảnh báo hazard hoặc không giảm tốc khi có xe cứu hộ! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => (refs?.hazard || speed <= 50),
      theoryRule: {
        title: 'Làn xe cứu hộ (Rettungsgasse - § 11 Abs. 2 StVO)',
        rule: 'Khi xe di chuyển chậm hoặc ùn tắc trên cao tốc, xe làn ngoài cùng bên trái phải tắp sát bên trái.'
      }
    },
    {
      id: 'ab_exit', type: 'AUTOBAHN_EXIT',
      triggerZ: 3800, resolveZ: 4700,
      warn: '↘️ Ausfahrt Rhynern-Süd phía trước (nút giao thật, biển 1000m) — Bật Xi-nhan Phải (E), Schulterblick Phải (X), giảm tốc trên làn thoát Ausfädelungsstreifen!',
      passMsg: '✅ Rời cao tốc an toàn đúng quy trình!',
      failMsg: '❌ Quên bật Xi-nhan Phải (E) hoặc không Schulterblick khi chuyển sang làn rời cao tốc! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => {
        const okBlinker = refs ? (refs.blinkerRight || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickRightDone || refs.lastSchulterblickDir === 'right') : false;
        return okBlinker && okSchulter;
      },
      theoryRule: {
        title: 'Rời Cao tốc (Ausfahrt / Ausfädelungsstreifen)',
        rule: 'Bật xi-nhan phải sớm 300m trước lối ra, chuyển sang làn Ausfädelungsstreifen mới đạp phanh giảm tốc.'
      }
    },
    {
      id: 'ab_finish', type: 'EXAM_FINISH',
      triggerZ: 4750, resolveZ: 5600,
      warn: '🏁 Đã thoát cao tốc về phố — HOÀN THÀNH VÒNG LUYỆN TẬP PHỐ ➔ AUFFAHRT ➔ AUTOBAHN ➔ AUSFAHRT ➔ PHỐ (route OSM thật)!',
      passMsg: '🎉 CHÚC MỪNG! BẠN ĐÃ HOÀN THÀNH TRỌN VÒNG LUYỆN TẬP AUTOBAHN STVO!',
      check: () => true,
      theoryRule: {
        title: 'Kết thúc vòng luyện tập Autobahn',
        rule: 'Kỹ năng lái phố, nhập làn, chạy đường trường và thoát cao tốc của bạn đạt chuẩn sát hạch StVO.'
      }
    }
  ],

  landstrasse_wald: [
    {
      id: 'land_tempo_cruise', type: 'LANDSTRASSE_TEMPO',
      triggerZ: 50, resolveZ: 220,
      warn: '🌳 Tốc độ đường trường ngoài đô thị — Tăng tốc lên 70 - 100 km/h (§ 3 StVO)!',
      passMsg: '✅ Duy trì tốc độ đường ngoài đô thị rất tốt!',
      failMsg: '❌ Chạy quá chậm dưới 50 km/h hoặc vượt quá 100 km/h! (-10 điểm)',
      failPenalty: 10,
      check: (speed) => speed >= 55 && speed <= 105,
      theoryRule: {
        title: 'Tốc độ ngoài đô thị (§ 3 Abs. 3 StVO)',
        rule: 'Tốc độ tối đa cho phép của xe con trên đường ngoài đô thị không có dải phân cách là 100 km/h.'
      }
    },
    {
      id: 'land_curve_approach', type: 'LANDSTRASSE_CURVE',
      triggerZ: 240, resolveZ: 400,
      warn: '⚠️ Khúc cua nguy hiểm phía trước (Z. 103) — Giảm tốc độ < 65 km/h trước khi vào cua!',
      passMsg: '✅ Vào khúc cua an toàn đúng kỹ thuật StVO!',
      failMsg: '❌ Vào cua quá nhanh gây nguy cơ mất lái! (-15 điểm)',
      failPenalty: 15,
      check: (speed) => speed <= 70,
      theoryRule: {
        title: 'Vào cua an toàn (Kurvenfahren)',
        rule: 'Giảm tốc độ trước khi vào cua, duy trì số phù hợp, đệm ga nhẹ khi chuẩn bị thoát cua.'
      }
    },
    {
      id: 'land_sharp_curve', type: 'SHARP_CURVE',
      triggerZ: 420, resolveZ: 530,
      warn: '↩️ Khúc cua tay áo gắt liên hoàn (Z. 105) — Giảm tốc độ < 50 km/h, bám đúng làn bên phải!',
      passMsg: '✅ Ôm cua tay áo mượt mà không lấn vạch!',
      failMsg: '❌ Cua quá nhanh hoặc đè vạch tim đường nguy hiểm! (-15 điểm)',
      failPenalty: 15,
      check: (speed) => speed <= 55,
      theoryRule: {
        title: 'Cua tay áo nguy hiểm',
        rule: 'Khúc cua khuất tầm nhìn, tuyệt đối không chém vạch tim đường để đề phòng xe ngược chiều.'
      }
    },
    {
      id: 'land_against_traffic', type: 'GEGENVERKEHR',
      triggerZ: 550, resolveZ: 680,
      warn: '🚗 Có xe ngược chiều đang tới — Giữ làn bên phải, duy trì khoảng cách an toàn sườn xe!',
      passMsg: '✅ Tránh xe ngược chiều an toàn tuyệt đối!',
      failMsg: '❌ Lấn vạch tim đường về phía xe ngược chiều! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter) => !crossedCenter,
      theoryRule: {
        title: 'Tránh xe ngược chiều (Gegenverkehr - § 6 StVO)',
        rule: 'Đi sát về bên phải, nhường khoảng trống an toàn cho xe ngược chiều.'
      }
    },
    {
      id: 'land_overtake_pass', type: 'OVERTAKE',
      triggerZ: 700, resolveZ: 830,
      warn: '🏎️ Đoạn đường thẳng cho phép vượt — Bật xi-nhan trái (Q), Schulterblick (Z), vượt dứt khoát!',
      passMsg: '✅ Thao tác vượt xe trên quốc lộ chuẩn StVO!',
      failMsg: '❌ Không xi-nhan hoặc không quan sát điểm mù khi vượt! (-15 điểm)',
      failPenalty: 15,
      check: (speed, crossedCenter, refs) => (refs?.blinkerLeft || speed >= 60),
      theoryRule: {
        title: 'Vượt xe ngoài đô thị (§ 5 StVO)',
        rule: 'Chỉ vượt khi tầm nhìn thông suốt, không có xe ngược chiều, bật xi-nhan báo hiệu trước khi vượt.'
      }
    },
    {
      id: 'land_bike_overtake', type: 'BIKE_OVERTAKE',
      triggerZ: 840, resolveZ: 930,
      warn: '🚲 Phía trước có người đi xe đạp — Vượt xe đạp ngoài đô thị giữ khoảng cách sườn TỐI THIỂU 2.0m!',
      passMsg: '✅ Vượt xe đạp đúng khoảng cách an toàn 2 mét (§ 5 Abs. 4 StVO)!',
      failMsg: '❌ Không xiết trái giữ khoảng cách khi vượt hoặc phóng qua quá nhanh! (-20 điểm)',
      failPenalty: 20,
      check: (speed, crossedCenter, refs) => (
        // Đạt 1 trong 2: xiết trái đủ xa vị trí ban đầu (tạo khoảng cách sườn ~2m)
        // hoặc chạy chậm thận trọng trong suốt đoạn vượt
        (refs?._scEntryLateral !== undefined && refs?._scMinLateral !== undefined
          && (refs._scEntryLateral - refs._scMinLateral) >= 1.2)
        || (refs?._scMaxSpeed ?? speed) <= 45
      ),
      theoryRule: {
        title: 'Khoảng cách vượt xe đạp ngoài đô thị (§ 5 Abs. 4 StVO)',
        rule: 'Khi vượt người đi xe đạp ngoài đô thị, luật StVO bắt buộc phải giữ khoảng cách hông tối thiểu 2.0 mét.'
      }
    },
    {
      id: 'land_wildlife_hazard', type: 'WILDWECHSEL',
      triggerZ: 940, resolveZ: 1080,
      warn: '🦌 CẢNH BÁO ĐỘNG VẬT HOANG DÃ (Wildwechsel Z. 142) — Giảm tốc độ < 60 km/h, sẵn sàng phanh khẩn cấp!',
      passMsg: '✅ Phản xạ nhạy bén trước nguy cơ động vật băng qua đường!',
      failMsg: '❌ Chạy quá nhanh trong khu vực cảnh báo Wildwechsel! (-15 điểm)',
      failPenalty: 15,
      check: (speed) => speed <= 65,
      theoryRule: {
        title: 'Động vật hoang dã băng qua đường (Zeichen 142 Wildwechsel)',
        rule: 'Nếu thấy thú rừng: Giảm tốc độ, tắt đèn pha (chiếu xa) chuyển sang đèn cốt, bấm còi. Nếu không kịp tránh: Đạp phanh khẩn cấp, giữ chặt vô lăng, không đánh lái bừa bãi ra lề.'
      }
    },
    {
      id: 'land_junction_watch', type: 'JUNCTION_WATCH',
      triggerZ: 1090, resolveZ: 1180,
      warn: '⚠️ Ngã 3 đường nhánh nhập vào quốc lộ — Chú ý quan sát xe từ đường nhánh!',
      passMsg: '✅ Quan sát giao lộ đường nhánh cẩn thận!',
      failMsg: '❌ Phóng qua giao lộ mà không rà giảm tốc quan sát! (-10 điểm)',
      failPenalty: 10,
      check: (speed, crossedCenter, refs) => (refs?._scMinSpeed ?? speed) <= 45,
      theoryRule: {
        title: 'Đường nhánh nhập quốc lộ',
        rule: 'Luôn cảnh giác xe từ đường phụ hoặc máy kéo nông nghiệp lao ra đường chính.'
      }
    },
    {
      id: 'land_forest_drive', type: 'FOREST_DRIVE',
      triggerZ: 1190, resolveZ: 1280,
      warn: '🌲 Đoạn đường rừng — Chú ý độ bám đường giảm do lá rụng ẩm ướt!',
      passMsg: '✅ Lái xe qua đoạn đường rừng an toàn!',
      failMsg: '❌ Chạy quá nhanh trên mặt đường rừng trơn trượt! (-10 điểm)',
      failPenalty: 10,
      check: (speed, crossedCenter, refs) => (refs?._scMaxSpeed ?? speed) <= 85,
      theoryRule: {
        title: 'Đoạn đường rừng',
        rule: 'Mặt đường dưới tán cây thường ẩm ướt và trơn trượt lâu hơn bình thường.'
      }
    },
    {
      id: 'land_crest_drive', type: 'CREST_DRIVE',
      triggerZ: 1290, resolveZ: 1370,
      warn: '⛰️ Đỉnh dốc khuất tầm nhìn (Kuppe) — Tuyệt đối cấm vượt xe, đi chậm bám sát bên phải!',
      passMsg: '✅ Vượt qua đỉnh dốc an toàn đúng luật StVO!',
      check: (speed) => speed <= 75,
      theoryRule: {
        title: 'Đỉnh dốc khuất tầm nhìn',
        rule: 'Không nhìn thấy phía sau đỉnh dốc thì cấm vượt xe hoặc chuyển làn.'
      }
    },
    {
      id: 'land_fog_drive', type: 'FOG_DRIVE',
      triggerZ: 1380, resolveZ: 1450,
      warn: '🌫️ Tầm nhìn bị hạn chế do sương mù — Bật đèn cốt (L) và giảm tốc độ thích ứng!',
      passMsg: '✅ Lái xe thích ứng điều kiện thời tiết chuẩn xác!',
      check: (speed, crossedCenter, refs) => (refs?.headlights || speed <= 60),
      theoryRule: {
        title: 'Lái xe khi tầm nhìn xấu',
        rule: 'Bật đèn cốt Abblendlicht, tầm nhìn bằng bao nhiêu mét thì tốc độ tối đa bấy nhiêu km/h.'
      }
    },
    {
      id: 'land_roadwork', type: 'ROADWORK',
      triggerZ: 1460, resolveZ: 1540,
      warn: '🚧 Công trường thi công (Z. 123) — Giảm tốc độ < 50 km/h, làn đường bị thu hẹp!',
      passMsg: '✅ Qua khu vực thi công an toàn!',
      failMsg: '❌ Quá tốc độ trong khu vực công trường! (-15 điểm)',
      failPenalty: 15,
      check: (speed) => speed <= 55,
      theoryRule: {
        title: 'Khu vực thi công Baustelle',
        rule: 'Tuân thủ biển báo tốc độ công trường, vạch kẻ đường màu vàng có hiệu lực ưu tiên hơn vạch trắng.'
      }
    },
    {
      id: 'land_highspeed_turn', type: 'HIGHSPEED_TURN',
      triggerZ: 1550, resolveZ: 1640,
      warn: '↘️ Rẽ phải từ quốc lộ — Bật Xi-nhan Phải (E) từ sớm, rà phanh giảm tốc êm dịu!',
      passMsg: '✅ Rẽ từ đường quốc lộ an toàn chuẩn quy trình!',
      check: (speed, crossedCenter, refs) => (refs?.blinkerRight || refs?.hazard),
      theoryRule: {
        title: 'Rẽ từ đường quốc lộ',
        rule: 'Báo hiệu xi-nhan từ xa để các xe sau đang chạy 100 km/h có đủ thời gian phanh giảm tốc an toàn.'
      }
    },
    {
      id: 'land_finish', type: 'EXAM_FINISH',
      triggerZ: 1650, resolveZ: 1720,
      warn: '🏁 HOÀN THÀNH BÀI THI ĐƯỜNG TRƯỜNG LANDSTRASSE!',
      passMsg: '🎉 XUẤT SẮC! BẠN ĐÃ ĐẠT BÀI THI ĐƯỜNG NGOÀI ĐÔ THỊ (BESTANDEN)!',
      check: () => true,
      theoryRule: {
        title: 'Kết thúc bài thi Landstraße',
        rule: 'Kỹ năng làm chủ tốc độ cao và xử lý tình huống bất ngờ ngoài đô thị đạt chuẩn StVO.'
      }
    }
  ],

  sa_hinh_fahrschule: [
    {
      id: 'sh_slalom', type: 'SLALOM',
      triggerZ: 15, resolveZ: 115,
      warn: '🏎️ 1. Lái Ziczac (Slalom) — Giữ vận tốc < 18 km/h, đánh lái đều tay uốn lượn qua các cọc tiêu!',
      passMsg: '✅ Vượt qua bài Ziczac (Slalom) xuất sắc! (+10 điểm)',
      failMsg: '❌ Quá tốc độ (> 18km/h) hoặc chạm cọc trong bài Ziczac! (-15 điểm)',
      failPenalty: 15, passBonus: 10,
      check: (speed) => speed <= 20,
      theoryRule: {
        title: 'Lái Ziczac (Slalomparcours)',
        rule: 'Rèn luyện cảm giác vô lăng, căn góc cua và kiểm soát chân ga ở tốc độ chậm.'
      }
    },
    {
      id: 'sh_hill', type: 'HILL_START',
      triggerZ: 5, resolveZ: 60,
      warn: '⛰️ 2. Dốc 10% (Anfahren am Berg) — Dừng xe trước vạch đỏ, kéo phanh tay (Space), khởi hành không để xe tuột lùi!',
      passMsg: '✅ Khởi hành ngang dốc xuất sắc không bị tuột xe! (+10 điểm)',
      failMsg: '❌ Xe bị trôi lùi trên dốc (> 30cm)! (-15 điểm)',
      failPenalty: 15, passBonus: 10,
      check: (speed, crossedCenter, refs) => !refs?.hillRolledBack,
      theoryRule: {
        title: 'Khởi hành ngang dốc (Anfahren an Steigungen - Grundfahraufgabe)',
        rule: 'Kéo phanh tay, nhấn ga vừa đủ và nhả côn từ từ (hoặc số D), nhả phanh tay để xe tiến dứt khoát không tụt dốc.'
      }
    },
    {
      id: 'sh_ampel_crosswalk', type: 'TRAFFIC_LIGHT',
      triggerZ: 125, resolveZ: 210,
      warn: '🚦 2. Đèn Đỏ & Vạch Đi Bộ — Dừng hẳn xe trước vạch Haltelinie đỏ & nhường đường cho người đi bộ!',
      passMsg: '✅ Dừng đúng trước vạch đèn đỏ & vạch người đi bộ! (+10 điểm)',
      failMsg: '❌ Vượt đèn đỏ hoặc chèn vạch người đi bộ! (-25 điểm)',
      failPenalty: 25, passBonus: 10,
      check: (speed) => speed < 2.0,
      theoryRule: {
        title: 'Tín hiệu đèn & Vạch người đi bộ (§ 26, 37 StVO)',
        rule: 'Dừng hoàn toàn trước vạch Haltelinie khi đèn chuyển sang đỏ, tuyệt đối không đè vạch người đi bộ qua đường.'
      }
    },
    {
      id: 'sh_ampel', type: 'TRAFFIC_LIGHT',
      triggerZ: 5, resolveZ: 65,
      warn: '🚦 6. Đèn Đỏ & Vạch Đi Bộ — Dừng hẳn xe trước vạch Haltelinie đỏ & nhường đường người đi bộ!',
      passMsg: '✅ Dừng đúng trước vạch đèn đỏ & vạch người đi bộ! (+10 điểm)',
      failMsg: '❌ Vượt đèn đỏ hoặc chèn vạch người đi bộ! (-25 điểm)',
      failPenalty: 25, passBonus: 10,
      check: (speed) => speed < 2.0,
      theoryRule: {
        title: 'Tín hiệu đèn & Vạch người đi bộ (§ 26, 37 StVO)',
        rule: 'Dừng hoàn toàn trước vạch Haltelinie khi đèn đỏ. Nhường người đi bộ qua đường.'
      }
    },
    {
      id: 'sh_intersection_4way', type: 'INTERSECTION_4WAY',
      triggerZ: 220, resolveZ: 310,
      warn: '➕ 3. Giao Lộ Ngã Tư — Giảm tốc độ < 25 km/h, quan sát 2 hướng ngang, áp dụng quy tắc Ưu tiên bên phải (Rechts vor Links)!',
      passMsg: '✅ Qua giao lộ ngã tư StVO an toàn đúng quy tắc! (+10 điểm)',
      failMsg: '❌ Không giảm tốc độ hoặc thiếu quan sát khi qua ngã tư! (-15 điểm)',
      failPenalty: 15, passBonus: 10,
      check: (speed) => speed <= 25,
      theoryRule: {
        title: 'Giao lộ Ngã tư (Kreuzung § 8 StVO)',
        rule: 'Tại ngã tư không có đèn, tuân thủ nguyên tắc Rechts vor Links (xe đến từ bên phải được quyền ưu tiên).'
      }
    },
    {
      id: 'sh_parallel_parking', type: 'PARALLEL_PARKING',
      triggerZ: 10, resolveZ: 100,
      warn: '🅿️ 4. Ghép Xe Song Song — Xi-nhan Phải (E), vào số R lùi ghép xe giữa 2 vị trí ô cọc!',
      passMsg: '✅ Ghép xe song song chuẩn xác StVO! (+10 điểm)',
      failMsg: '❌ Không bật xi-nhan phải hoặc lùi lệch ngoài chuồng! (-15 điểm)',
      failPenalty: 15, passBonus: 10,
      check: (speed, crossedCenter, refs) => (refs?.blinkerRight || refs?.hazard || refs?.isReverse || refs?.gear === 'R'),
      theoryRule: {
        title: 'Đỗ xe song song lề đường (Längsparken)',
        rule: 'Quan sát gương chiếu hậu, bật xi-nhan phải, lùi góc 45 độ căn cọc tiêu đuôi xe rồi trả lái song song lề đường.'
      }
    },
    {
      id: 'sh_intersection_3way', type: 'INTERSECTION_3WAY',
      triggerZ: 430, resolveZ: 520,
      warn: '🔀 5. Giao Lộ Ngã Ba (T-Junction) — Giảm tốc độ < 20 km/h, bật xi-nhan và quan sát phương tiện từ đường nhánh!',
      passMsg: '✅ Qua ngã 3 an toàn, quan sát góc rẽ chuẩn xác! (+10 điểm)',
      failMsg: '❌ Vào ngã 3 quá nhanh hoặc quên quan sát đường nhánh! (-15 điểm)',
      failPenalty: 15, passBonus: 10,
      check: (speed, crossedCenter, refs) => (speed <= 25 || refs?.blinkerLeft || refs?.blinkerRight),
      theoryRule: {
        title: 'Giao lộ Ngã ba (Einmündung § 8 StVO)',
        rule: 'Quan sát tầm nhìn ở góc đường nhánh cắt ngang, xi-nhan báo hướng chuyển làn và nhường đường StVO.'
      }
    },
    {
      id: 'sh_perpendicular_parking', type: 'PERPENDICULAR_PARKING',
      triggerZ: 10, resolveZ: 100,
      warn: '🚗 6. Ghép Xe Vuông Góc (90°) — Bật Xi-nhan Phải (E), vào số R lùi vuông góc 90 độ vào chuồng đỗ!',
      passMsg: '✅ Lùi chuồng ghép vuông góc 90 độ hoàn hảo! (+10 điểm)',
      failMsg: '❌ Thiếu quan sát góc lùi hoặc không vào số R lùi chuồng! (-15 điểm)',
      failPenalty: 15, passBonus: 10,
      check: (speed, crossedCenter, refs) => (refs?.blinkerRight || refs?.hazard || refs?.isReverse || refs?.gear === 'R'),
      theoryRule: {
        title: 'Ghép xe vuông góc (Querparken 90°)',
        rule: 'Tiến xe qua cửa chuồng 1 thân xe, đánh hết lái lùi 90 độ, nhìn 2 gương căn đều khoảng cách 2 bên chuồng.'
      }
    },
    {
      id: 'sh_s_curve', type: 'S_CURVE',
      triggerZ: 5, resolveZ: 85,
      warn: '〰️ 5. Đường Quanh Co Chữ S — Tốc độ < 18 km/h, bám mép cua ngoài, đánh lái nhịp nhàng không đè cọc ranh giới!',
      passMsg: '✅ Vượt qua cung đường chữ S mềm mại chuẩn xác! (+10 điểm)',
      failMsg: '❌ Chạy quá nhanh hoặc chạm cọc rào chữ S! (-15 điểm)',
      failPenalty: 15, passBonus: 10,
      check: (speed) => speed <= 22,
      theoryRule: {
        title: 'Đường quanh co hình chữ S (Kurvenfahren)',
        rule: 'Tiến bám lưng (ôm mép cua ngoài), lùi bám bụng. Luôn giữ tốc độ thấp và quan sát góc đầu xe.'
      }
    },
    {
      id: 'sh_emergency_brake', type: 'EMERGENCY_BRAKE',
      triggerZ: 10, resolveZ: 110,
      warn: '🚨 7. Phanh Khẩn Cấp (Gefahrenbremsung) — Đạp ga tăng tốc đạt 30 km/h, khi gặp vạch vàng ĐẠP PHANH HẾT CỠ (S)!',
      passMsg: '✅ Phanh khẩn cấp Vollbremsung xuất sắc, xe dừng đứng yên an toàn! (+10 điểm)',
      failMsg: '❌ Chưa đạt 30 km/h hoặc không đạp phanh kịch sàn kịp thời! (-20 điểm)',
      failPenalty: 20, passBonus: 10,
      check: (speed, crossedCenter, refs) => (speed < 2.0 || refs?.emergencyBrakeDone),
      theoryRule: {
        title: 'Phanh khẩn cấp (§ 5 FeV Grundfahraufgabe Gefahrenbremsung)',
        rule: 'Tài xế tăng tốc lên ít nhất 30 km/h. Ngay khi có hiệu lệnh, đạp phanh kịch sàn (Vollbremsung) để dừng xe nhanh nhất có thể.'
      }
    },
    {
      id: 'sh_backward_turn', type: 'BACKWARD_TURN',
      triggerZ: 5, resolveZ: 70,
      warn: '↩️ 8. Lùi Cua 90° (Rückwärts rechts) — Xi-nhan Phải (E), cài số R (2), lùi ôm mép vỉa hè cách 30-50cm!',
      passMsg: '✅ Lùi cua 90 độ chuẩn kỹ thuật StVO! (+10 điểm)',
      failMsg: '❌ Không bật xi-nhan hoặc để bánh xe đè vỉa hè khi lùi! (-15 điểm)',
      failPenalty: 15, passBonus: 10,
      check: (speed, crossedCenter, refs) => (refs?.blinkerRight || refs?.hazard || refs?.isReverse || refs?.gear === 'R'),
      theoryRule: {
        title: 'Lùi xe vào ngã rẽ bên phải (Fahren nach rechts rückwärts)',
        rule: 'Bật xi-nhan phải, quan sát không gian phía sau, lùi bám song song mép đường cong cách khoảng 30–50cm.'
      }
    },
    {
      id: 'sh_umkehren', type: 'UMKEHREN',
      triggerZ: 5, resolveZ: 75,
      warn: '🔄 9. Quay Đầu Xe 3 Điểm (Umkehren) — Xi-nhan Trái (Q) -> Đánh lái sang trái -> Số R lùi sang phải -> Đổi chiều xe!',
      passMsg: '✅ Quay đầu xe Umkehren gọn gàng an toàn! (+10 điểm)',
      failMsg: '❌ Quên xi-nhan hoặc va chạm khi quay đầu! (-15 điểm)',
      failPenalty: 15, passBonus: 10,
      check: (speed, crossedCenter, refs) => (refs?.blinkerLeft || refs?.blinkerRight || refs?.hazard || refs?.gear === 'R'),
      theoryRule: {
        title: 'Quay đầu xe (Umkehren durch Wenden)',
        rule: 'Quan sát toàn diện, bật xi-nhan thích hợp theo từng nhịp tiến/lùi, hoàn thành đổi chiều trong không gian hẹp.'
      }
    },
    {
      id: 'sh_acceleration', type: 'ACCELERATION',
      triggerZ: 5, resolveZ: 100,
      warn: '⚡ 10. Tăng Tốc & Chuyển Số — Nhấn ga tăng tốc đạt 40-50 km/h rồi giảm tốc êm dịu!',
      passMsg: '✅ Thao tác tăng tốc và kiểm soát gia tốc rất tốt! (+10 điểm)',
      failMsg: '❌ Chưa đạt ngưỡng tốc độ yêu cầu (tối thiểu 35 km/h)! (-10 điểm)',
      failPenalty: 10, passBonus: 10,
      check: (speed) => speed >= 32,
      theoryRule: {
        title: 'Tăng tốc và chuyển số (Beschleunigen & Gangwechsel)',
        rule: 'Tăng tốc dứt khoát, chuyển số nhịp nhàng để đạt vận tốc dòng giao thông và duy trì khoảng cách an toàn.'
      }
    },
    {
      id: 'sh_finish', type: 'EXAM_FINISH',
      triggerZ: 5, resolveZ: 60,
      warn: '🏁 11. Vạch Đích & Kết Thúc — Xi-nhan Phải (E) tấp lề, dừng xe sau vạch đích, về P, kéo phanh tay!',
      passMsg: '🎉 XUẤT SẮC! BẠN ĐÃ HOÀN THÀNH BÀI THI VỚI KẾT QUẢ ĐẠT (BESTANDEN)!',
      failMsg: null,
      check: () => true,
      theoryRule: {
        title: 'Kết thúc bài thi sa hình (Prüfungsende)',
        rule: 'Tài xế tấp lề bên phải, dừng hẳn bánh xe, chuyển cần số về P, kéo phanh tay và tắt máy theo hiệu lệnh Prüfer.'
      }
    }
  ],
  training_circuit: [
    {
      id: 'tc_town', type: 'SPEED_LIMIT', limit: 50,
      triggerZ: 25, resolveZ: 500,
      warn: '🏘️ Lái trong thị trấn Rhynern (50 km/h) — Đi qua các giao lộ, quan sát biển báo!',
      passMsg: '✅ Lái phố an toàn!',
      failMsg: '❌ Phóng nhanh trong thị trấn! (-10 điểm)',
      failPenalty: 10,
      check: (speed) => speed <= 55,
      theoryRule: { title: 'Lái trong đô thị', rule: 'Tốc độ tối đa 50 km/h trong đô thị.' }
    },
    {
      id: 'tc_verbindung', type: 'SPEED_LIMIT', limit: 50,
      triggerZ: 500, resolveZ: 900,
      warn: '🛣️ Verbindungstraße — Đi thẳng tới biển Auffahrt để nhập cao tốc A2!',
      passMsg: '✅ Đã tới cửa nhập cao tốc!',
      check: () => true,
      theoryRule: { title: 'Đường nối cao tốc', rule: 'Chuẩn bị tăng tốc trên làn nhập (Beschleunigungsstreifen).' }
    },
    {
      id: 'tc_enter', type: 'AUTOBAHN_ENTER',
      triggerZ: 900, resolveZ: 1300,
      warn: '🛣️ Auffahrt A2 — Tăng tốc > 60 km/h, Xi-nhan Trái (Q) & Schulterblick Trái (Z)!',
      passMsg: '✅ Nhập A2 thành công đúng quy trình!',
      passBonus: 10,
      failMsg: '❌ Nhập làn thiếu Xi-nhan hoặc Schulterblick! (-20 điểm)',
      failPenalty: 20,
      check: (speed, cc, refs) => {
        const okSpeed = speed >= 55;
        const okBlinker = refs ? (refs.blinkerLeft || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickLeftDone || refs.lastSchulterblickDir === 'left') : false;
        return okSpeed && okBlinker && okSchulter;
      },
      theoryRule: { title: 'Nhập cao tốc (§ 18 StVO)', rule: 'Tăng tốc trên làn nhập, xi-nhan trái, Schulterblick trái.' }
    },
    {
      id: 'tc_cruise', type: 'AUTOBAHN_SPEED',
      triggerZ: 1300, resolveZ: 2800,
      warn: '🚀 Richtgeschwindigkeit 130 km/h — Giữ làn phải, chỉ vượt trái!',
      passMsg: '✅ Chạy cao tốc xuất sắc!',
      failMsg: '❌ Chạy quá chậm trên A2! (-10 điểm)',
      failPenalty: 10,
      check: (speed) => speed >= 70,
      theoryRule: { title: 'Richtgeschwindigkeit', rule: 'Tránh chạy < 60 km/h trên Autobahn.' }
    },
    {
      id: 'tc_exit', type: 'AUTOBAHN_EXIT',
      triggerZ: 2800, resolveZ: 3800,
      warn: '↘️ Ausfahrt Rhynern — Xi-nhan Phải (E), Schulterblick Phải (X), giảm tốc!',
      passMsg: '✅ Thoát A2 an toàn!',
      failMsg: '❌ Thiếu Xi-nhan phải khi thoát! (-15 điểm)',
      failPenalty: 15,
      check: (speed, cc, refs) => {
        const okBlinker = refs ? (refs.blinkerRight || refs.hazard) : false;
        const okSchulter = refs ? (refs.schulterblickRightDone || refs.lastSchulterblickDir === 'right') : false;
        return okBlinker && okSchulter;
      },
      theoryRule: { title: 'Rời cao tốc', rule: 'Xi-nhan phải sớm 300m, giảm tốc trên làn thoát.' }
    },
    {
      id: 'tc_finish', type: 'EXAM_FINISH',
      triggerZ: 3800, resolveZ: 4800,
      warn: '🏁 HOÀN THÀNH VÒNG TẬP LÁI: Phố → Auffahrt → A2 → Ausfahrt → Phố!',
      passMsg: '🎉 HOÀN THÀNH TRAINING CIRCUIT!',
      check: () => true,
      theoryRule: { title: 'Kết thúc vòng tập lái', rule: 'Bạn đã thực hành đầy đủ: phố, nhập làn, cao tốc, thoát.' }
    }
  ]
};

// Default SCENARIOS
// 🛣️ Landstrase B2: dung chung bo tinh huong Land (cung cap giao trinh)
MAP_SCENARIOS.landstrasse_b2 = MAP_SCENARIOS.landstrasse_wald;

export const SCENARIOS = [
  {
    id: 's1', type: 'SPEED_LIMIT', limit: 50,
    triggerZ: 80, resolveZ: 200,
    sign: 'limit_50',
    warn: '⚠️ Khu vực 50 km/h — Giảm tốc độ trong đô thị!',
    passMsg: '✅ Tốt! Đã giảm đúng tốc độ 50 km/h.',
    failMsg: '❌ Vượt tốc độ! (-10 điểm)',
    failPenalty: 10,
    check: (speed) => speed <= 55,
    theoryRule: {
      title: 'Tốc độ trong đô thị (Innerorts)',
      rule: 'Theo Điều 3 Luật Giao thông Đường bộ Đức (StVO), tốc độ tối đa cho phép trong khu vực đô thị là 50 km/h.'
    }
  },
  {
    id: 's2', type: 'TRAFFIC_LIGHT',
    triggerZ: 250, resolveZ: 310, lightDuration: 4,
    warn: '🚦 Đèn đỏ tại Ngã Tư — Dừng lại trước vạch Stop (Haltelinie)!',
    passMsg: '✅ Dừng đúng trước vạch Haltelinie! (+5 điểm)',
    passBonus: 5,
    failMsg: '❌ Vượt đèn đỏ / Chèn vạch dừng! (-25 điểm)',
    failPenalty: 25,
    check: (speed) => speed < 2,
    theoryRule: {
      title: 'Chấp hành Đèn tín hiệu & Vạch Haltelinie',
      rule: 'Vượt đèn đỏ (Rotlichtverstoß) là lỗi vi phạm nghiêm trọng nhóm A ở Đức. Bạn bắt buộc phải dừng hẳn xe trước vạch dừng (Haltelinie) khi đèn màu đỏ.'
    }
  },
  {
    id: 's3_turn_right', type: 'TURN_RIGHT',
    triggerZ: 320, resolveZ: 400,
    sign: 'turn_right',
    warn: '↗️ Chuẩn bị Rẽ Phải tại Ngã Tư — Bật Xi-nhan Phải (E) & Schulterblick Phải (X)!',
    passMsg: '✅ Rẽ phải xuất sắc! Đã bật Xi-nhan & Schulterblick đúng quy chuẩn StVO.',
    failMsg: '❌ Quên bật Xi-nhan hoặc quên Schulterblick kiểm tra điểm mù! (-15 điểm)',
    failPenalty: 15,
    check: (speed, crossedCenter, refs) => {
      const okSpeed = speed <= 35;
      const okBlinker = refs ? (refs.blinkerRight || refs.hazard) : true;
      const okSchulter = refs ? (refs.lastSchulterblickDir === 'right' || refs.schulterblickRightDone) : true;
      return okSpeed && okBlinker && okSchulter;
    },
    theoryRule: {
      title: 'Quy trình Rẽ tại Giao lộ (Abbiegen)',
      rule: 'Quy tắc 3 bước bắt buộc ở Đức: 1. Quan sát Gương (Innenspiegel & Außenspiegel) -> 2. Bật Xi-nhan (Blinken) -> 3. Ngoái đầu kiểm tra điểm mù (Schulterblick) trước khi chuyển hướng.'
    }
  },
  {
    id: 's4_stop', type: 'STOP_SIGN',
    triggerZ: 430, resolveZ: 480,
    sign: 'stop',
    warn: '🛑 Biển STOP — Dừng hẳn xe (0 km/h) tại vạch dừng!',
    passMsg: '✅ Dừng đúng quy định! (+5 điểm)',
    passBonus: 5,
    failMsg: '❌ Không dừng hẳn tại STOP! (-20 điểm)',
    failPenalty: 20,
    check: (speed) => speed < 1,
    theoryRule: {
      title: 'Biển báo dừng STOP (Zeichen 206)',
      rule: 'Tại biển STOP, bạn bắt buộc phải dừng bánh xe hoàn toàn (0 km/h) ít nhất 3 giây để quan sát trước khi đi tiếp.'
    }
  },
  {
    id: 's5_rvl', type: 'RIGHT_BEFORE_LEFT',
    triggerZ: 580, resolveZ: 650,
    sign: 'right_before_left',
    warn: '⚠️ Ngã 3 Rechts vor Links — Giảm tốc (< 25 km/h) & Schulterblick Phải (X) nhường xe bên phải!',
    passMsg: '✅ Chú ý giao lộ nhường đường bên phải xuất sắc!',
    failMsg: '❌ Phóng nhanh hoặc không quan sát đường nhánh bên phải! (-15 điểm)',
    failPenalty: 15,
    check: (speed, crossedCenter, refs) => {
      const okSpeed = speed <= 25;
      const okSchulter = refs ? (refs.lastSchulterblickDir === 'right' || refs.schulterblickRightDone) : true;
      return okSpeed && okSchulter;
    },
    theoryRule: {
      title: 'Nhường đường bên phải trước (Rechts vor Links)',
      rule: 'Tại các ngã ba / ngã tư không có biển ưu tiên hoặc đèn giao thông, mặc định xe đi từ bên phải có quyền ưu tiên tuyệt đối.'
    }
  },
  {
    id: 's6_turn_left', type: 'TURN_LEFT',
    triggerZ: 720, resolveZ: 820,
    sign: 'turn_left',
    warn: '↖️ Chuẩn bị Rẽ Trái tại Ngã Tư — Bật Xi-nhan Trái (Q) & Schulterblick Trái (Z)!',
    passMsg: '✅ Rẽ trái chuẩn quy trình StVO!',
    failMsg: '❌ Thiếu bật Xi-nhan trái hoặc quên Schulterblick trái! (-15 điểm)',
    failPenalty: 15,
    check: (speed, crossedCenter, refs) => {
      const okSpeed = speed <= 35;
      const okBlinker = refs ? (refs.blinkerLeft || refs.hazard) : true;
      const okSchulter = refs ? (refs.lastSchulterblickDir === 'left' || refs.schulterblickLeftDone) : true;
      return okSpeed && okBlinker && okSchulter;
    },
    theoryRule: {
      title: 'Rẽ trái tại ngã tư (Linksabbiegen)',
      rule: 'Khi rẽ trái, bạn phải nhường đường cho xe đi ngược chiều đi thẳng. Bắt buộc bật Xi-nhan trái và ngoái đầu Schulterblick bên trái quan sát xe đạp/người đi bộ.'
    }
  },
  {
    id: 's7_tempo30', type: 'SPEED_LIMIT', limit: 30,
    triggerZ: 880, resolveZ: 980,
    sign: 'limit_30',
    warn: '🏫 Khu dân cư 30 km/h — Chú ý trẻ em & vạch đi bộ!',
    passMsg: '✅ Tốc độ an toàn!',
    failMsg: '❌ Vượt tốc độ khu dân cư! (-15 điểm)',
    failPenalty: 15,
    check: (speed) => speed <= 35,
    theoryRule: {
      title: 'Khu vực giới hạn 30 km/h (Tempo-30-Zone)',
      rule: 'Trong khu dân cư, tốc độ tối đa 30 km/h. Hãy chủ động nhường đường cho người đi bộ và trẻ em.'
    }
  },
  {
    id: 's8_prio', type: 'PRIORITY',
    triggerZ: 1050, resolveZ: 1120,
    sign: 'priority',
    warn: '✅ Đường ưu tiên (Vorfahrtsstraße) — Bạn được đi trước!',
    passMsg: '✅ Giữ đúng quyền ưu tiên!',
    failMsg: null,
    check: () => true,
    theoryRule: {
      title: 'Đường ưu tiên (Vorfahrtsstraße - Zeichen 306)',
      rule: 'Biển hình thoi vàng cho biết bạn đang di chuyển trên đường ưu tiên.'
    }
  },
  {
    id: 's9_no_overtake', type: 'NO_OVERTAKING',
    triggerZ: 1200, resolveZ: 1320,
    sign: 'no_overtaking',
    warn: '🚫 Biển Cấm Vượt (Überholverbot) — Đi đúng làn đường bên phải!',
    passMsg: '✅ Giữ làn chuẩn xác!',
    failMsg: '❌ Đè vạch/vượt xe trong đoạn cấm vượt! (-20 điểm)',
    failPenalty: 20,
    check: (speed, crossedCenter) => !crossedCenter,
    theoryRule: {
      title: 'Biển Cấm Vượt (Überholverbot - Zeichen 276)',
      rule: 'Không được đè vạch liền hoặc lấn sang làn đường ngược chiều để vượt xe.'
    }
  },
  {
    id: 's10_zebra', type: 'PEDESTRIAN_CROSSING',
    triggerZ: 1250, resolveZ: 1330,
    sign: 'pedestrian',
    warn: '🚶 Vạch đi bộ (Zebrastreifen) — Giảm tốc (< 25km/h) & quan sát người đi bộ!',
    passMsg: '✅ Đi qua an toàn đúng luật!',
    failMsg: '❌ Không phanh giảm tốc tại vạch đi bộ! (-15 điểm)',
    failPenalty: 15,
    check: (speed) => speed <= 25,
    theoryRule: {
      title: 'Vạch đi bộ qua đường (Zebrastreifen - Zeichen 293)',
      rule: 'Người đi bộ luôn có quyền ưu tiên tuyệt đối tại Zebrastreifen. Tài xế phải giảm tốc độ sẵn sàng dừng lại.'
    }
  },
  {
    id: 's11_autobahn_enter', type: 'AUTOBAHN_ENTER',
    triggerZ: 1400, resolveZ: 1520,
    sign: 'autobahn_start',
    warn: '🛣️ Gia nhập Cao tốc Autobahn — Bật Xi-nhan Trái (Q), Schulterblick Trái (Z) & Tăng tốc trên làn Beschleunigungsstreifen (> 65 km/h)!',
    passMsg: '✅ Gia nhập cao tốc Autobahn chuẩn quy trình StVO! (+10 điểm)',
    passBonus: 10,
    failMsg: '❌ Không tăng đủ tốc độ hoặc quên xi-nhan/Schulterblick khi nhập làn cao tốc! (-20 điểm)',
    failPenalty: 20,
    check: (speed, crossedCenter, refs) => {
      const okSpeed = speed >= 60;
      const okBlinker = refs ? (refs.blinkerLeft || refs.hazard) : true;
      const okSchulter = refs ? (refs.lastSchulterblickDir === 'left' || refs.schulterblickLeftDone) : true;
      return okSpeed && okBlinker && okSchulter;
    },
    theoryRule: {
      title: 'Nhập làn Cao Tốc (Beschleunigungsstreifen)',
      rule: 'Bắt buộc tăng tốc đạt tốc độ dòng xe trên cao tốc (> 65 km/h) trên làn tăng tốc, quan sát gương + Schulterblick trái và bật xi-nhan trái để nhập làn an toàn.'
    }
  },
  {
    id: 's12_autobahn_speed', type: 'AUTOBAHN_SPEED',
    triggerZ: 1650, resolveZ: 1800,
    sign: 'autobahn_130',
    warn: '🚀 Tốc độ Khuyến nghị Cao Tốc (Richtgeschwindigkeit 130 km/h) — Tăng tốc chạy đường trường (> 80 km/h)!',
    passMsg: '✅ Giữ tốc độ đường cao tốc rất tốt!',
    failMsg: '❌ Chạy quá chậm trên cao tốc gây nguy hiểm! (-10 điểm)',
    failPenalty: 10,
    check: (speed) => speed >= 75,
    theoryRule: {
      title: 'Tốc độ khuyến nghị Cao Tốc (Richtgeschwindigkeit)',
      rule: 'Trên cao tốc Đức không giới hạn tốc độ, tốc độ khuyến nghị chung là 130 km/h. Tránh chạy quá chậm dưới 60 km/h nếu không có tắc đường.'
    }
  },
  {
    id: 's13_rettungsgasse', type: 'RETTUNGSGASSE',
    triggerZ: 1900, resolveZ: 2020,
    sign: 'rettungsgasse',
    warn: '🚑 Cảnh báo Xe Cứu Hộ / Tắc Đường — Giữ làn đường cứu hộ Rettungsgasse (Xe làn trái ép trái)!',
    passMsg: '✅ Giữ làn Rettungsgasse chuẩn mực!',
    failMsg: '❌ Không bật đèn cảnh báo hazard hoặc không giảm tốc khi có xe cứu hộ! (-15 điểm)',
    failPenalty: 15,
    check: (speed, crossedCenter, refs) => (refs?.hazard || speed <= 50),
    theoryRule: {
      title: 'Hành lang cứu hộ (Rettungsgasse)',
      rule: 'Khi xe di chuyển chậm hoặc ùn tắc trên cao tốc, xe ở làn ngoài cùng bên trái phải tắp sát bên trái để tạo làn ưu tiên cho xe cứu thương/cảnh sát.'
    }
  },
  {
    id: 's14_autobahn_exit', type: 'AUTOBAHN_EXIT',
    triggerZ: 2150, resolveZ: 2280,
    sign: 'autobahn_exit',
    warn: '↘️ Chuẩn bị Rời Cao Tốc (Ausfahrt 500m) — Bật Xi-nhan Phải (E) & Giảm tốc độ trên làn Ausfädelungsstreifen!',
    passMsg: '✅ Rời cao tốc an toàn!',
    failMsg: '❌ Không bật xi-nhan phải khi rời cao tốc! (-15 điểm)',
    failPenalty: 15,
    check: (speed, crossedCenter, refs) => {
      const okBlinker = refs ? (refs.blinkerRight || refs.hazard) : true;
      return okBlinker;
    },
    theoryRule: {
      title: 'Rời Cao Tốc (Ausfahrt / Ausfädelungsstreifen)',
      rule: 'Bật xi-nhan phải sớm trước 300m, chuyển sang làn rẽ lối ra rồi mới đạp phanh giảm tốc độ.'
    }
  },
  {
    id: 's15_exam_finish', type: 'EXAM_FINISH',
    triggerZ: 2400, resolveZ: 2500,
    sign: 'finish_flag',
    warn: '🏁 HOÀN THÀNH BÀI THI THỰC HÀNH LÁI XE TỔNG HỢP ĐỨC (PRAKTISCHE PRÜFUNG)! Dừng xe an toàn.',
    passMsg: '🎉 CHÚC MỪNG BẠN ĐÃ ĐẠT BÀI THI THỰC HÀNH LÁI XE ĐỨC! (PRÜFUNG BESTANDEN)',
    failMsg: null,
    check: () => true,
    theoryRule: {
      title: 'Kết thúc Bài thi Thực hành (Prüfungsende)',
      rule: 'Tài xế dừng xe, kéo phanh tay, về số P và tắt máy an toàn theo hướng dẫn của Giám khảo Fahrprüfer.'
    }
  }
];

export const MAX_SCORE = 100;

export const initScore = () => ({ points: MAX_SCORE, events: [] });

export const applyEvent = (scoreState, scenario, passed) => {
  const bonus = passed ? (scenario.passBonus || 0) : 0;
  const penalty = passed ? 0 : (scenario.failPenalty || 0);
  const newPoints = Math.max(0, Math.min(MAX_SCORE + 10, scoreState.points + bonus - penalty));
  const msg = passed ? scenario.passMsg : scenario.failMsg;
  return {
    points: newPoints,
    events: msg ? [...scoreState.events, { msg, passed, time: Date.now() }] : scoreState.events,
  };
};