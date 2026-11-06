/**
 * 🏙️ BERLIN-MITTE 2.0 GRAND CITY MAP PRESET (Mạng Lưới Đô Thị Đỉnh Cao)
 * Kiến trúc Road Network + Junctions + Lane Connections + City Objects
 * Chuẩn định dạng JSON cho Trình Thiết Kế Bản Đồ Map Editor 2.0 & Simulation 3D
 * 
 * Bố cục liên hoàn:
 *  - Phía Bắc: Đại lộ TORSTRAßE (4 làn, ray đôi Tram M8/12, 50 km/h)
 *  - Phía Tây-Bắc: Khu phố cổ HACKESCHER MARKT & SCHEUNENVIERTEL (Shop, Café, Phố xe đạp Linienstr)
 *  - Trục trung tâm: Đại lộ FRIEDRICHSTRAßE & ROSA-LUXEMBURG-STRAßE
 *  - Trung tâm phía Đông: Quảng trường ALEXANDERPLATZ (Tram, Bến xe, Vòng xuyến Kreisverkehr)
 *  - Phía Nam: Đại lộ di sản UNTER DEN LINDEN (4 làn rợp bóng cây, 50 km/h)
 *  - Phía Tây: Cổng biểu tượng BRANDENBURGER TOR
 *  - Công viên lớn: TIERGARTEN (Rừng cây xanh, thảm cỏ)
 */

export { BERLIN_MITTE_REAL_OSM_PRESET } from './berlinMitteRealPreset.js';

export const BERLIN_MITTE_GRAND_MAP_PRESET = {
  mapInfo: {
    name: 'Khu Đô Thị Berlin-Mitte (Layout 2D - 7 Zones - Locked Boundary)',
    type: 'custom',
    maxSpeedLimit: 50,
    gridSize: 5, // Snap 5m chuẩn
    spawnPoint: { x: 3.5, z: 75, rotation: 90 },
    boundary: {
      minX: -240,
      maxX: 230,
      minZ: -50,
      maxZ: 265,
      locked: true,
      lockMessage: 'Đã đến ranh giới bản đồ Berlin-Mitte (Bitte wenden)!'
    }
  },
  elements: [
    // ══════════════════════════════════════════════════════════════════
    // 1. ĐẠI LỘ TORSTRAßE (Trục Ngang Phía Bắc, Z = 80, 4 làn + Tram)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'road_tor_west',
      type: 'ROAD_STRAIGHT',
      name: 'Đại Lộ Torstraße (Tây)',
      x: -120, z: 80, rotation: 90,
      width: 18, height: 70, length: 70,
      lanes: 4, laneWidth: 3.5, speedLimit: 50,
      oneWay: false, bicycleLane: true, hasTram: true,
      roadType: 'avenue', sidewalk: true,
      connectedTo: ['junc_tor_friedrich', 'junc_tor_rosalux']
    },
    // Giao lộ ngã tư Friedrichstraße x Torstraße
    {
      id: 'junc_tor_friedrich',
      type: 'INTERSECTION_4WAY',
      name: 'Giao lộ Torstraße x Friedrichstraße',
      x: -80, z: 80, rotation: 0,
      width: 18, height: 18,
      junctionType: '4way', hasTrafficLight: true,
      connectedTo: ['road_tor_west', 'road_tor_mid', 'road_friedrich_north']
    },
    {
      id: 'road_tor_mid',
      type: 'ROAD_STRAIGHT',
      name: 'Đại Lộ Torstraße (Trung tâm)',
      x: -40, z: 80, rotation: 90,
      width: 18, height: 60, length: 60,
      lanes: 4, laneWidth: 3.5, speedLimit: 50,
      oneWay: false, bicycleLane: true, hasTram: true,
      roadType: 'avenue', sidewalk: true,
      connectedTo: ['junc_tor_friedrich', 'junc_tor_rosalux']
    },
    // Giao lộ trung tâm có đèn tín hiệu Torstraße x Rosa-Luxemburg-Str
    {
      id: 'junc_tor_rosalux',
      type: 'INTERSECTION_4WAY',
      name: 'Ngã tư Torstraße x Rosa-Luxemburg-Str (Đèn tín hiệu)',
      x: 0, z: 80, rotation: 0,
      width: 18, height: 18,
      junctionType: 'ampel', hasTrafficLight: true,
      connectedTo: ['road_tor_mid', 'road_tor_east', 'road_rosalux_1']
    },
    {
      id: 'road_tor_east',
      type: 'ROAD_STRAIGHT',
      name: 'Đại Lộ Torstraße (Đông)',
      x: 50, z: 80, rotation: 90,
      width: 18, height: 80, length: 80,
      lanes: 4, laneWidth: 3.5, speedLimit: 50,
      oneWay: false, bicycleLane: true, hasTram: true,
      roadType: 'avenue', sidewalk: true,
      connectedTo: ['junc_tor_rosalux', 'junc_tor_moll']
    },
    // Giao lộ lớn phía Đông Karl-Liebknecht / Mollstraße
    {
      id: 'junc_tor_moll',
      type: 'INTERSECTION_4WAY',
      name: 'Giao lộ lớn Mollstraße / Karl-Liebknecht-Str',
      x: 100, z: 80, rotation: 0,
      width: 20, height: 20,
      junctionType: '4way', hasTrafficLight: true,
      connectedTo: ['road_tor_east', 'road_moll_south']
    },
    {
      id: 'road_moll_south',
      type: 'ROAD_STRAIGHT',
      name: 'Trục Mollstraße hướng Alexanderplatz',
      x: 100, z: 20, rotation: 0,
      width: 18, height: 100, length: 100,
      lanes: 4, speedLimit: 50, hasTram: true,
      connectedTo: ['junc_tor_moll', 'junc_alexanderplatz']
    },

    // ══════════════════════════════════════════════════════════════════
    // 2. TRỤC DỌC FRIEDRICHSTRAßE (Từ Torstraße nối xuống Unter den Linden)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'road_friedrich_north',
      type: 'ROAD_STRAIGHT',
      name: 'Phố Friedrichstraße (Bắc)',
      x: -80, z: 30, rotation: 0,
      width: 14, height: 80, length: 80,
      lanes: 2, speedLimit: 50, bicycleLane: true,
      connectedTo: ['junc_tor_friedrich', 'junc_friedrich_hackescher']
    },
    {
      id: 'junc_friedrich_hackescher',
      type: 'INTERSECTION_4WAY',
      name: 'Giao lộ Friedrichstraße x Hackescher Markt',
      x: -80, z: -20, rotation: 0,
      width: 14, height: 14,
      junctionType: '4way', hasTrafficLight: true,
      connectedTo: ['road_friedrich_north', 'road_friedrich_mid', 'road_hackescher_east']
    },
    {
      id: 'road_friedrich_mid',
      type: 'ROAD_STRAIGHT',
      name: 'Phố Friedrichstraße (Trung tâm thương mại)',
      x: -80, z: -80, rotation: 0,
      width: 14, height: 100, length: 100,
      lanes: 2, speedLimit: 50, bicycleLane: true,
      connectedTo: ['junc_friedrich_hackescher', 'junc_friedrich_linden']
    },
    // Giao lộ biểu tượng Friedrichstraße x Unter den Linden
    {
      id: 'junc_friedrich_linden',
      type: 'INTERSECTION_4WAY',
      name: 'Giao lộ Friedrichstraße x Unter den Linden',
      x: -80, z: -140, rotation: 0,
      width: 22, height: 22,
      junctionType: 'ampel', hasTrafficLight: true,
      connectedTo: ['road_friedrich_mid', 'road_linden_west', 'road_linden_east']
    },

    // ══════════════════════════════════════════════════════════════════
    // 3. KHU HACKESCHER MARKT & PHỐ XE ĐẠP LINIENSTRAßE
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'road_linien_bike',
      type: 'ROAD_STRAIGHT',
      name: 'Phố xe đạp Linienstraße (Fahrradstraße 30)',
      x: -30, z: 30, rotation: 90,
      width: 10, height: 80, length: 80,
      lanes: 2, speedLimit: 30, bicycleLane: true, roadType: 'residential',
      connectedTo: ['junc_friedrich_hackescher', 'junc_rosalux_linien']
    },
    {
      id: 'road_hackescher_east',
      type: 'ROAD_STRAIGHT',
      name: 'Tuyến nối Hackescher Markt sang Alexanderplatz',
      x: -40, z: -20, rotation: 90,
      width: 14, height: 60, length: 60,
      lanes: 2, speedLimit: 30, roadType: 'cobblestone',
      connectedTo: ['junc_friedrich_hackescher', 'junc_alex_west']
    },

    // ══════════════════════════════════════════════════════════════════
    // 4. TRỤC ROSA-LUXEMBURG-STRAßE & QUẢNG TRƯỜNG ALEXANDERPLATZ
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'road_rosalux_1',
      type: 'ROAD_STRAIGHT',
      name: 'Phố Rosa-Luxemburg-Str (Bắc)',
      x: 0, z: 35, rotation: 0,
      width: 14, height: 70, length: 70,
      lanes: 2, speedLimit: 50, bicycleLane: true,
      connectedTo: ['junc_tor_rosalux', 'junc_rosalux_linien']
    },
    {
      id: 'junc_rosalux_linien',
      type: 'INTERSECTION_4WAY',
      name: 'Giao cắt Rosa-Luxemburg-Str x Linienstraße',
      x: 0, z: -5, rotation: 0,
      width: 14, height: 14,
      junctionType: '4way',
      connectedTo: ['road_rosalux_1', 'road_rosalux_2', 'road_linien_bike']
    },
    {
      id: 'road_rosalux_2',
      type: 'ROAD_STRAIGHT',
      name: 'Phố Rosa-Luxemburg-Str hướng bùng binh',
      x: 0, z: -40, rotation: 0,
      width: 14, height: 50, length: 50,
      lanes: 2, speedLimit: 50,
      connectedTo: ['junc_rosalux_linien', 'roundabout_alexanderplatz']
    },
    // Vòng xuyến Kreisverkehr Alexanderplatz / Rosa-Luxemburg-Platz
    {
      id: 'roundabout_alexanderplatz',
      type: 'ROUNDABOUT_4WAY',
      name: 'Vòng xuyến Alexanderplatz (Kreisverkehr StVO Z. 215)',
      x: 10, z: -75, rotation: 0,
      width: 32, height: 32,
      junctionType: 'roundabout',
      connectedTo: ['road_rosalux_2', 'road_alex_south', 'road_moll_south']
    },
    {
      id: 'road_alex_south',
      type: 'ROAD_STRAIGHT',
      name: 'Đại lộ Karl-Liebknecht-Str hướng Unter den Linden',
      x: -30, z: -110, rotation: 135,
      width: 18, height: 80, length: 80,
      lanes: 4, speedLimit: 50, hasTram: true,
      connectedTo: ['roundabout_alexanderplatz', 'junc_linden_alex']
    },

    // ══════════════════════════════════════════════════════════════════
    // 5. ĐẠI LỘ UNTER DEN LINDEN (Trục Ngang Phía Nam, 4 làn rợp bóng cây)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'road_linden_east',
      type: 'ROAD_STRAIGHT',
      name: 'Đại lộ Unter den Linden (Đoạn Cầu Lâu Đài / Schlossbrücke)',
      x: -25, z: -140, rotation: 90,
      width: 22, height: 90, length: 90,
      lanes: 4, speedLimit: 50, bicycleLane: true,
      roadType: 'avenue', sidewalk: true,
      connectedTo: ['junc_linden_alex', 'junc_friedrich_linden']
    },
    {
      id: 'junc_linden_alex',
      type: 'INTERSECTION_4WAY',
      name: 'Giao lộ Unter den Linden x Karl-Liebknecht-Str',
      x: 20, z: -140, rotation: 0,
      width: 22, height: 22,
      junctionType: 'ampel', hasTrafficLight: true,
      connectedTo: ['road_linden_east', 'road_alex_south']
    },
    {
      id: 'road_linden_west',
      type: 'ROAD_STRAIGHT',
      name: 'Đại lộ Unter den Linden (Hướng Cổng Brandenburg)',
      x: -115, z: -140, rotation: 90,
      width: 22, height: 60, length: 60,
      lanes: 4, speedLimit: 50, bicycleLane: true,
      roadType: 'avenue', sidewalk: true,
      connectedTo: ['junc_friedrich_linden', 'junc_brandenburger_tor']
    },
    // Quảng trường trước Cổng Brandenburg (Pariser Platz)
    {
      id: 'junc_brandenburger_tor',
      type: 'INTERSECTION_4WAY',
      name: 'Quảng trường Pariser Platz trước Cổng Brandenburg',
      x: -150, z: -140, rotation: 0,
      width: 24, height: 24,
      junctionType: '4way',
      connectedTo: ['road_linden_west', 'road_tiergarten_boulevard']
    },

    // ══════════════════════════════════════════════════════════════════
    // 6. CỔNG BRANDENBURG & CÔNG VIÊN TIERGARTEN (Phía Tây)
    // ══════════════════════════════════════════════════════════════════
    {
      id: 'landmark_brandenburger_tor',
      type: 'BRANDENBURGER_TOR',
      name: 'Cổng Brandenburg (Brandenburger Tor)',
      x: -150, z: -140, rotation: 0,
      width: 30, height: 12
    },
    {
      id: 'road_tiergarten_boulevard',
      type: 'ROAD_STRAIGHT',
      name: 'Đại lộ Straße des 17. Juni xuyên qua Rừng Tiergarten',
      x: -210, z: -140, rotation: 90,
      width: 20, height: 100, length: 100,
      lanes: 4, speedLimit: 50, bicycleLane: true,
      connectedTo: ['junc_brandenburger_tor']
    },

    // ══════════════════════════════════════════════════════════════════
    // 7. ĐIỂM XUẤT PHÁT XE (SPAWN POINTS)
    // ══════════════════════════════════════════════════════════════════
    { id: 'spawn_torstrasse', type: 'SPAWN_POINT', name: 'Xuất phát Torstraße', x: 3.5, z: 75, rotation: 90, width: 3, height: 5 },
    { id: 'spawn_friedrichstrasse', type: 'SPAWN_POINT', name: 'Xuất phát Friedrichstraße', x: -77, z: 60, rotation: 180, width: 3, height: 5 },
    { id: 'spawn_alexanderplatz', type: 'SPAWN_POINT', name: 'Xuất phát Alexanderplatz', x: 10, z: -50, rotation: 180, width: 3, height: 5 },
    { id: 'spawn_linden', type: 'SPAWN_POINT', name: 'Xuất phát Unter den Linden', x: -60, z: -143, rotation: 270, width: 3, height: 5 },
    { id: 'spawn_brandenburg', type: 'SPAWN_POINT', name: 'Xuất phát Cổng Brandenburg', x: -135, z: -143, rotation: 270, width: 3, height: 5 },

    // ══════════════════════════════════════════════════════════════════
    // 8. ĐỐI TƯỢNG ĐÔ THỊ ĐẶC TRƯNG (CITY OBJECTS)
    // ══════════════════════════════════════════════════════════════════
    // Trạm tàu điện Tram & Xe buýt
    { id: 'tram_alexanderplatz', type: 'TRAM_STOP', name: 'Trạm Tram Alexanderplatz', x: 50, z: -65, rotation: 90, width: 4, height: 20 },
    { id: 'tram_torstrasse', type: 'TRAM_STOP', name: 'Trạm Tram Torstraße / Rosenthaler', x: -20, z: 86, rotation: 90, width: 4, height: 20 },
    { id: 'bus_hackescher', type: 'BUS_STOP', name: 'Trạm Xe Buýt BVG Hackescher Markt', x: -70, z: -10, rotation: 0, width: 3, height: 12 },
    { id: 'bus_linden', type: 'BUS_STOP', name: 'Trạm Xe Buýt BVG Unter den Linden', x: -100, z: -130, rotation: 90, width: 3, height: 12 },

    // Xe ô tô đỗ ven đường (Luyện quan sát mở cửa Dooring & vượt StVO)
    { id: 'parked_friedrich', type: 'PARKED_CAR', name: 'Dãy ô tô đỗ Friedrichstraße', x: -74, z: 10, rotation: 0, width: 3, height: 25 },
    { id: 'parked_rosalux', type: 'PARKED_CAR', name: 'Ô tô đỗ Rosa-Luxemburg-Str', x: 7, z: 20, rotation: 0, width: 3, height: 20 },
    { id: 'parked_linden', type: 'PARKED_CAR', name: 'Xe ngoại giao Unter den Linden', x: -90, z: -132, rotation: 90, width: 3, height: 18 },

    // Rào chắn công trường đang thi công StVO
    { id: 'const_hackescher', type: 'CONSTRUCTION', name: 'Rào chắn thi công Hackescher Markt', x: -45, z: 5, rotation: 0, width: 6, height: 12 },
    { id: 'const_moll', type: 'CONSTRUCTION', name: 'Sửa đường ray Mollstraße', x: 110, z: 40, rotation: 0, width: 6, height: 14 },

    // Cửa hàng / Quán café tầng trệt phố mua sắm
    { id: 'shop_hackescher_1', type: 'SHOP', name: 'Café & Bakery Hackescher Markt', x: -55, z: 5, rotation: 0, width: 14, height: 12 },
    { id: 'shop_hackescher_2', type: 'SHOP', name: 'Boutique Fashion & Gallery', x: -55, z: -40, rotation: 0, width: 14, height: 12 },
    { id: 'shop_friedrich_1', type: 'SHOP', name: 'Trung tâm Lafayette Friedrichstraße', x: -95, z: -60, rotation: 0, width: 16, height: 18 },

    // Tòa nhà khối dãy phố Altbau Berlin
    { id: 'bldg_tor_n1', type: 'BUILDING', name: 'Dãy phố Altbau Bắc Torstraße', x: -100, z: 98, rotation: 0, width: 26, height: 14 },
    { id: 'bldg_tor_n2', type: 'BUILDING', name: 'Khối nhà Torstraße Mitte', x: -30, z: 98, rotation: 0, width: 24, height: 14 },
    { id: 'bldg_tor_n3', type: 'BUILDING', name: 'Apotheke & Tòa nhà văn phòng', x: 60, z: 98, rotation: 0, width: 28, height: 14 },
    { id: 'bldg_alex_center', type: 'BUILDING', name: 'Tòa nhà phức hợp Alexanderplatz', x: 60, z: -105, rotation: 0, width: 30, height: 26 },
    { id: 'bldg_volksbuehne', type: 'BUILDING', name: 'Nhà hát kịch Volksbühne Berlin', x: 10, z: -115, rotation: 0, width: 28, height: 22 },

    // Vạch sang đường cho người đi bộ (Zebrastreifen)
    { id: 'zebra_tor_1', type: 'ZEBRA', x: -60, z: 80, rotation: 90, width: 18, height: 4 },
    { id: 'zebra_tor_2', type: 'ZEBRA', x: 20, z: 80, rotation: 90, width: 18, height: 4 },
    { id: 'zebra_friedrich', type: 'ZEBRA', x: -80, z: 0, rotation: 0, width: 14, height: 4 },
    { id: 'zebra_linden_1', type: 'ZEBRA', x: -60, z: -140, rotation: 90, width: 22, height: 4 },
    { id: 'zebra_linden_brandenburg', type: 'ZEBRA', x: -140, z: -140, rotation: 90, width: 24, height: 5 },

    // Biển báo StVO quan trọng
    { id: 'sign_tor_50', type: 'SIGN', signType: 'SPEED_LIMIT', value: 50, x: -110, z: 89, rotation: 90, width: 2, height: 4 },
    { id: 'sign_linien_30', type: 'SIGN', signType: 'SPEED_LIMIT', value: 30, x: -50, z: 35, rotation: 90, width: 2, height: 4 },
    { id: 'sign_linden_50', type: 'SIGN', signType: 'SPEED_LIMIT', value: 50, x: -130, z: -130, rotation: 90, width: 2, height: 4 },
    { id: 'sign_friedrich_stop', type: 'SIGN', signType: 'STOP', x: -75, z: -128, rotation: 0, width: 2, height: 4 },
    { id: 'sign_tor_prio', type: 'SIGN', signType: 'PRIORITY', x: -20, z: 89, rotation: 90, width: 2, height: 4 },

    // Rừng cây đại thụ Công viên Tiergarten & Dãy cây đại lộ Unter den Linden
    { id: 'tree_tier_1', type: 'TREE', x: -175, z: -120, rotation: 0, width: 3, height: 6 },
    { id: 'tree_tier_2', type: 'TREE', x: -195, z: -120, rotation: 0, width: 3, height: 6 },
    { id: 'tree_tier_3', type: 'TREE', x: -215, z: -120, rotation: 0, width: 3, height: 6 },
    { id: 'tree_tier_4', type: 'TREE', x: -175, z: -160, rotation: 0, width: 3, height: 6 },
    { id: 'tree_tier_5', type: 'TREE', x: -195, z: -160, rotation: 0, width: 3, height: 6 },
    { id: 'tree_tier_6', type: 'TREE', x: -215, z: -160, rotation: 0, width: 3, height: 6 },
    { id: 'tree_linden_1', type: 'TREE', x: -70, z: -130, rotation: 0, width: 2, height: 5 },
    { id: 'tree_linden_2', type: 'TREE', x: -100, z: -130, rotation: 0, width: 2, height: 5 },
    { id: 'tree_linden_3', type: 'TREE', x: -70, z: -150, rotation: 0, width: 2, height: 5 },
    { id: 'tree_linden_4', type: 'TREE', x: -100, z: -150, rotation: 0, width: 2, height: 5 }
  ],
  createdAt: '2026-09-17T18:15:00.000Z'
};

export const SA_HINH_FAHRSCHULE_PRESET = {
  mapInfo: {
    name: 'Sa Hình Thi Lái Xe Khép Kín (Fahrschule Closed Circuit)',
    type: 'custom',
    maxSpeedLimit: 50,
    gridSize: 5,
    spawnPoint: { x: 3.5, z: 5, rotation: 0 }
  },
  elements: [
    { id: 'road_main_behind_1', type: 'ROAD_STRAIGHT', x: 0, z: -60, rotation: 0, width: 14, height: 60 },
    { id: 'road_main_1', type: 'ROAD_STRAIGHT', x: 0, z: 0, rotation: 0, width: 14, height: 80 },
    { id: 'parking_bay_1', type: 'PARKING_BAY', x: 14, z: 25, rotation: 0, width: 8, height: 25 },
    { id: 'sign_speed_50_1', type: 'SIGN', signType: 'SPEED_LIMIT', value: 50, x: 14.5, z: 15, rotation: 0, width: 1.5, height: 3 },
    { id: 'bldg_left_1', type: 'BUILDING', x: -18, z: 20, rotation: 0, width: 10, height: 16 },
    { id: 'bldg_right_1', type: 'BUILDING', x: 24, z: 20, rotation: 0, width: 10, height: 16 },
    { id: 'tree_left_1', type: 'TREE', x: -5, z: 10, rotation: 0, width: 2, height: 4 },
    { id: 'tree_right_1', type: 'TREE', x: 17, z: 10, rotation: 0, width: 2, height: 4 },
    { id: 'curve_1', type: 'ROAD_CURVE_90', x: 0, z: 80, rotation: 90, width: 24, height: 24 },
    { id: 'road_east_1', type: 'ROAD_STRAIGHT', x: 24, z: 80, rotation: 90, width: 14, height: 60 },
    { id: 'zebra_1', type: 'ZEBRA', x: 35, z: 80, rotation: 90, width: 14, height: 3 },
    { id: 'tl_1', type: 'TRAFFIC_LIGHT', x: 35, z: 95, rotation: 0, width: 1, height: 4 },
    { id: 'sign_speed_30_1', type: 'SIGN', signType: 'SPEED_LIMIT', value: 30, x: 55, z: 95, rotation: 90, width: 1.5, height: 3 },
    { id: 's_curve_1', type: 'ROAD_S_CURVE', x: 84, z: 80, rotation: 90, width: 14, height: 50 },
    { id: 'curve_2', type: 'ROAD_CURVE_90', x: 134, z: 80, rotation: 180, width: 24, height: 24 },
    { id: 'road_south_1', type: 'ROAD_STRAIGHT', x: 146, z: 40, rotation: 0, width: 14, height: 40 },
    { id: 'inter_4way_1', type: 'INTERSECTION_4WAY', x: 146, z: 0, rotation: 0, width: 14, height: 14 },
    { id: 'sign_stop_1', type: 'SIGN', signType: 'STOP', x: 161, z: 5, rotation: 0, width: 1.5, height: 3 },
    { id: 'parking_bay_2', type: 'PARKING_BAY', x: 160, z: 20, rotation: 0, width: 8, height: 25 },
    { id: 'road_to_hill', type: 'ROAD_STRAIGHT', x: 146, z: -40, rotation: 0, width: 14, height: 40 },
    { id: 'hill_ramp_1', type: 'HILL_RAMP', x: 149, z: -80, rotation: 0, width: 8, height: 36 },
    { id: 'sign_priority_1', type: 'SIGN', signType: 'PRIORITY', x: 158, z: -60, rotation: 0, width: 1.5, height: 3 },
    { id: 'curve_3', type: 'ROAD_CURVE_90', x: 146, z: -116, rotation: 270, width: 24, height: 24 },
    { id: 'road_to_roundabout', type: 'ROAD_STRAIGHT', x: 96, z: -128, rotation: 90, width: 14, height: 50 },
    { id: 'roundabout_main', type: 'ROUNDABOUT_4WAY', x: 50, z: -136, rotation: 0, width: 32, height: 32 },
    { id: 'road_from_roundabout', type: 'ROAD_STRAIGHT', x: 14, z: -128, rotation: 90, width: 14, height: 36 },
    { id: 'curve_4', type: 'ROAD_CURVE_90', x: 0, z: -116, rotation: 0, width: 24, height: 24 },
    { id: 'road_connector_close', type: 'ROAD_STRAIGHT', x: 0, z: -92, rotation: 0, width: 14, height: 32 },
    { id: 'spawn_start', type: 'SPAWN_POINT', x: 3.5, z: 5, rotation: 0, width: 3, height: 6 }
  ],
  createdAt: '2026-09-17T18:00:00.000Z'
};

export const BERLIN_MITTE_MODES = [
  {
    id: 'free_drive',
    title: 'Lái Xe Tự Do (Free Drive)',
    desc: 'Khám phá toàn bộ khu vực Berlin-Mitte từ Torstraße đến Unter den Linden & Tiergarten',
    startPoint: { x: 3.5, z: 75, rotation: 90 }
  },
  {
    id: 'pruefung_route',
    title: 'Tuyến Thi Sát Hạch (Prüfung Route)',
    desc: 'Torstraße → Friedrichstraße → Nhường xe đạp Hackescher Markt → Alexanderplatz chuyển làn → Unter den Linden → Đỗ xe Cổng Brandenburg',
    startPoint: { x: -60, z: 80, rotation: 90 },
    waypoints: [
      { name: 'Torstraße (Khởi hành)', x: -60, z: 80 },
      { name: 'Friedrichstraße (Rẽ phải)', x: -80, z: 30 },
      { name: 'Hackescher Markt (Phố xe đạp 30 km/h)', x: -30, z: 30 },
      { name: 'Alexanderplatz (Vòng xuyến & chuyển làn)', x: 10, z: -75 },
      { name: 'Unter den Linden (Đại lộ 50 km/h)', x: -60, z: -140 },
      { name: 'Cổng Brandenburg (Dừng đỗ an toàn)', x: -140, z: -140 }
    ]
  }
];
