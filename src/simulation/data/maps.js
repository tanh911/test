// Map defines the environment, NOT the exercise logic.
export const MAPS = {
  custom_map: {
    id: 'custom_map',
    area: 'CUSTOM',
    environmentType: 'CUSTOM',
    spawnPoints: {
      start: { x: 3.5, y: 0, z: 0 },
    },
    roads: {
      speedLimit: 50,
    },
    // Bật giao thông: xe bot bám theo các đoạn ROAD_STRAIGHT của map người dùng
    traffic: {
      enabled: true,
      density: 0.4,
    },
  },
  landstrasse_b2: {
    id: 'landstrasse_b2',
    area: 'LAND',
    environmentType: 'landstrasse_b2',
    spawnPoints: {
      // Vị trí spawn đang hoạt động (trên tuyến B2 đã lái/audit — giữ nguyên hành vi)
      start: { x: -3033, y: 0, z: 2300, rotation: 54 }
    },
    roads: { speedLimit: 100 },
    traffic: { enabled: true, density: 0.5 },
  },
  sa_hinh_fahrschule: {
    id: 'sa_hinh_fahrschule',
    area: 'SA_HINH',
    environmentType: 'TRAINING_GROUND',
    spawnPoints: {
      start: { x: 3.5, y: 0, z: 0 },
      b1_slalom: { x: -45, y: 0, z: -5 },
      b2_hill: { x: 3.5, y: 0, z: -25 },
      b3_parallel: { x: 45, y: 0, z: -5 },
      b4_perpendicular: { x: 48, y: 0, z: -98 },
      b5_scurve: { x: -35, y: 0, z: -170 },
      b6_ampel: { x: 3.5, y: 0, z: -45 },
      b7_brake: { x: 16, y: 0, z: -152 },
      b8_backturn: { x: 45, y: 0, z: -75 },
      b9_umkehren: { x: -30, y: 0, z: -125 },
      b10_accel: { x: 3.5, y: 0, z: -105 },
      b11_finish: { x: 3.5, y: 0, z: -215 }
    },
    roads: { speedLimit: 60 },
    traffic: { enabled: false, density: 0 }
  },
  stadt_zentrum: {
    id: 'stadt_zentrum',
    area: 'STADT',
    environmentType: 'CITY', // Determines procedural generation style
    spawnPoints: {
      start: { x: -2.88, y: 0, z: 32.0, rotation: 0 },
      start_torstrasse: { x: 0.0, y: 0, z: 1100.0, rotation: 0 },
      start_rvl: { x: 2.5, y: 0, z: -100.0, rotation: 0 },
      start_ampel: { x: 2.5, y: 0, z: 40.0, rotation: 0 },
      start_vorfahrt: { x: 2.5, y: 0, z: -35.0, rotation: 0 },
      start_kreuzung: { x: 2.5, y: 0, z: 15.0, rotation: 0 },
      start_turn_right: { x: 2.5, y: 0, z: 15.0, rotation: 0 },
      start_turn_left: { x: 2.5, y: 0, z: 15.0, rotation: 0 },
      start_mollstrasse: { x: 400.0, y: 0, z: 1200.0, rotation: 90 },
      start_kreisverkehr: { x: 50.0, y: 0, z: -5250.0, rotation: 0 },
      start_linienstrasse: { x: -20.0, y: 0, z: 80.0, rotation: 90 },
      start_parkende: { x: 2.5, y: 0, z: -60.0, rotation: 0 },
      start_engstelle: { x: 2.5, y: 0, z: -150.0, rotation: 0 },
      start_zebra: { x: 2.5, y: 0, z: -15.0, rotation: 0 },
      start_abbiegen_ped: { x: 2.5, y: 0, z: 12.0, rotation: 0 },
      start_radfahrer: { x: 2.5, y: 0, z: 12.0, rotation: 0 },
      start_tram: { x: -40.0, y: 0, z: 1126.0, rotation: 90 },
      start_spurwechsel: { x: 2.5, y: 0, z: -250.0, rotation: 0 },
      start_abknickend: { x: 2.5, y: 0, z: -350.0, rotation: 0 },
      start_unter_den_linden: { x: -80.0, y: 0, z: -3.5, rotation: 90 },
      start_brandenburger_tor: { x: -680.0, y: 0, z: -40.0, rotation: 90 },
      start_friedrichstrasse: { x: 2.5, y: 0, z: -80.0, rotation: 0 },
      start_gendarmenmarkt: { x: 70.0, y: 0, z: -250.0, rotation: 180 },
      start_alexanderplatz: { x: 800.0, y: 0, z: 300.0, rotation: 180 },
      start_leipziger_strasse: { x: 50.0, y: 0, z: -675.0, rotation: 90 },
      start_hackescher_markt: { x: 240.0, y: 0, z: 420.0, rotation: 0 }
    },
    roads: {
      speedLimit: 50,
    },
    traffic: {
      enabled: true,
      density: 0.6,
    },
  },
  STADT: {
    id: 'stadt_zentrum',
    area: 'STADT',
    environmentType: 'CITY',
    spawnPoints: {
      start: { x: -2.88, y: 0, z: 32.0, rotation: 0 },
      start_torstrasse: { x: 0.0, y: 0, z: 1100.0, rotation: 0 },
      start_rvl: { x: 2.5, y: 0, z: -100.0, rotation: 0 },
      start_ampel: { x: 2.5, y: 0, z: 40.0, rotation: 0 },
      start_vorfahrt: { x: 2.5, y: 0, z: -35.0, rotation: 0 },
      start_kreuzung: { x: 2.5, y: 0, z: 15.0, rotation: 0 },
      start_turn_right: { x: 2.5, y: 0, z: 15.0, rotation: 0 },
      start_turn_left: { x: 2.5, y: 0, z: 15.0, rotation: 0 },
      start_mollstrasse: { x: 400.0, y: 0, z: 1200.0, rotation: 90 },
      start_kreisverkehr: { x: 50.0, y: 0, z: -5250.0, rotation: 0 },
      start_linienstrasse: { x: -20.0, y: 0, z: 80.0, rotation: 90 },
      start_parkende: { x: 2.5, y: 0, z: -60.0, rotation: 0 },
      start_engstelle: { x: 2.5, y: 0, z: -150.0, rotation: 0 },
      start_zebra: { x: 2.5, y: 0, z: -15.0, rotation: 0 },
      start_abbiegen_ped: { x: 2.5, y: 0, z: 12.0, rotation: 0 },
      start_radfahrer: { x: 2.5, y: 0, z: 12.0, rotation: 0 },
      start_tram: { x: -40.0, y: 0, z: 1126.0, rotation: 90 },
      start_spurwechsel: { x: 2.5, y: 0, z: -250.0, rotation: 0 },
      start_abknickend: { x: 2.5, y: 0, z: -350.0, rotation: 0 },
      start_unter_den_linden: { x: -80.0, y: 0, z: -3.5, rotation: 90 },
      start_brandenburger_tor: { x: -680.0, y: 0, z: -40.0, rotation: 90 },
      start_friedrichstrasse: { x: 2.5, y: 0, z: -80.0, rotation: 0 },
      start_gendarmenmarkt: { x: 70.0, y: 0, z: -250.0, rotation: 180 },
      start_alexanderplatz: { x: 800.0, y: 0, z: 300.0, rotation: 180 },
      start_leipziger_strasse: { x: 50.0, y: 0, z: -675.0, rotation: 90 },
      start_hackescher_markt: { x: 240.0, y: 0, z: 420.0, rotation: 0 }
    },
    roads: {
      speedLimit: 50,
    },
    traffic: {
      enabled: true,
      density: 0.6,
    },
  },
  
  autobahn_a: {
    id: 'autobahn_a',
    area: 'AUTOBAHN',
    environmentType: 'HIGHWAY',
    spawnPoints: {
      // 🏘️ Spawn trong phố Rhynern (Werler Straße) — vòng luyện tập: phố → Auffahrt → A2
      // → U-turn cuối A2 → Ausfahrt → về phố (toạ độ khớp road_graph_autobahn.json)
      start: { x: -396, y: 0, z: 895, rotation: 157 },
      a2_rhynern_main: { x: 487.50, y: 0, z: -589.42, rotation: 122.3 },
      a2_ausfahrt_ramp: { x: -1745, y: 0, z: 1636, rotation: 187.4 }
    },
    roads: {
      speedLimit: null, // Unlimited/Richtgeschwindigkeit
    },
    traffic: {
      enabled: false,
      density: 0.0,
    },
  },
  autobahn_a9: {
    id: 'autobahn_a9',
    area: 'AUTOBAHN',
    environmentType: 'HIGHWAY',
    spawnPoints: {
      // 🏘️ Spawn trong phố Rhynern (Werler Straße) — vòng luyện tập: phố → Auffahrt → A2
      // → U-turn cuối A2 → Ausfahrt → về phố (toạ độ khớp road_graph_autobahn.json)
      start: { x: -396, y: 0, z: 895, rotation: 157 },
      a2_rhynern_main: { x: 487.50, y: 0, z: -589.42, rotation: 122.3 },
      a2_ausfahrt_ramp: { x: -1745, y: 0, z: 1636, rotation: 187.4 }
    },
    roads: {
      speedLimit: null,
    },
    traffic: {
      enabled: false,
      density: 0.0,
    },
  },
  AUTOBAHN: {
    id: 'autobahn_a9',
    area: 'AUTOBAHN',
    environmentType: 'HIGHWAY',
    spawnPoints: {
      // 🏘️ Spawn trong phố Rhynern (Werler Straße) — vòng luyện tập: phố → Auffahrt → A2
      // → U-turn cuối A2 → Ausfahrt → về phố (toạ độ khớp road_graph_autobahn.json)
      start: { x: -396, y: 0, z: 895, rotation: 157 },
      a2_rhynern_main: { x: 487.50, y: 0, z: -589.42, rotation: 122.3 },
      a2_ausfahrt_ramp: { x: -1745, y: 0, z: 1636, rotation: 187.4 }
    },
    roads: {
      speedLimit: null,
    },
    traffic: {
      enabled: false,
      density: 0.0,
    },
  },

  landstrasse_wald: {
    id: 'landstrasse_wald',
    area: 'LANDSTRASSE',
    environmentType: 'COUNTRY_ROAD',
    spawnPoints: {
      start: { x: 133.5, y: 0, z: -1400.0, rotation: 0 },
      curves: { x: 133.5, y: 0, z: -1650.0, rotation: 0 },
      overtake: { x: 133.5, y: 0, z: -1950.0, rotation: 0 },
      wildwechsel: { x: 133.5, y: 0, z: -2250.0, rotation: 0 },
      finish: { x: 133.5, y: 0, z: -2500.0, rotation: 0 }
    },
    roads: {
      speedLimit: 100, // Tốc độ chuẩn ngoài đô thị Đức (§ 3 StVO: 100 km/h)
    },
    traffic: {
      enabled: true,
      density: 0.5,
    },
  },

  kreuzung_rvl: {
    id: 'kreuzung_rvl',
    area: 'KREUZUNG',
    environmentType: 'SUBURB_RVL',
    spawnPoints: {
      start: { x: 0, y: 0, z: 0 },
    },
    roads: { speedLimit: 30 },
    traffic: { enabled: true, density: 0.4 },
  },

  kreuzung_abbiegen: {
    id: 'kreuzung_abbiegen',
    area: 'KREUZUNG',
    environmentType: 'CITY',
    spawnPoints: {
      start: { x: 0, y: 0, z: 0 },
    },
    roads: { speedLimit: 50 },
    traffic: { enabled: true, density: 0.5 },
  },

  kreisverkehr_01: {
    id: 'kreisverkehr_01',
    area: 'KREISVERKEHR',
    environmentType: 'ROUNDABOUT',
    spawnPoints: {
      start: { x: 0, y: 0, z: 0 },
    },
    roads: { speedLimit: 30 },
    traffic: { enabled: true, density: 0.5 },
  },
  training_circuit: {
    id: 'training_circuit',
    area: 'TRAINING',
    environmentType: 'TRAINING_CIRCUIT',
    spawnPoints: {
      // ⚠️ Spawn phải: (1) trong graph bounds Z[-100,480] (ngoài biên sẽ bị boundary clamp về
      // minZ+5), (2) NGOÀI vùng bump elevation ±130m quanh crossing Haupt×A2 (z≈10 và z≈45) —
      // vùng đó đường phố được nâng thành "cầu vượt A2" cao 6m, spawn sai chỗ sẽ đứng BÊN DƯỚI
      // đường (khối đen trùm đầu). z=185 thỏa cả 2 + hướng về junction Kreuz (đèn giao thông).
      start: { x: -400, y: 0, z: 185, rotation: 180 },
      a2_entry: { x: 350, y: 0, z: 180, rotation: 80 },
    },
    roads: { speedLimit: 50 },
    traffic: { enabled: true, density: 0.6 },
    graphSource: 'training',
  }
};