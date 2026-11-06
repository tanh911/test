// 🏁 Sa Hình mặc định khép kín (Fahrschule Closed Circuit) — dùng cho khởi tạo và
// khôi phục khi người chơi xóa Map Custom khỏi Map Editor (luôn trả về object mới
// để effect hot-swap map nhận thấy sự thay đổi)
export const buildDefaultFahrschuleMap = () => ({
  mapInfo: {
    name: 'Sa Hình Thi Lái Xe Khép Kín (Fahrschule Closed Circuit)',
    type: 'custom',
    maxSpeedLimit: 50,
    gridSize: 10,
    spawnPoint: { x: 3.5, z: 5, rotation: 0 }
  },
  elements: [
    // ── 0. ĐOẠN ĐƯỜNG PHÍA SAU VẠCH XUẤT PHÁT (Gương hậu soi thấy mặt đường) ──
    { id: 'road_main_behind_1', type: 'ROAD_STRAIGHT', x: 0, z: -60, rotation: 0, width: 14, height: 60 },

    // ── 1. ĐẠI LỘ XUẤT PHÁT (Start Boulevard) ───────────────────────────
    { id: 'road_main_1', type: 'ROAD_STRAIGHT', x: 0, z: 0, rotation: 0, width: 14, height: 80 },
    { id: 'parking_bay_1', type: 'PARKING_BAY', x: 14, z: 25, rotation: 0, width: 8, height: 25 },
    { id: 'sign_speed_50_1', type: 'SIGN', signType: 'SPEED_LIMIT', value: 50, x: 14.5, z: 15, rotation: 0, width: 1.5, height: 3 },
    { id: 'sign_parking_1', type: 'SIGN', signType: 'PARKING', x: 22.5, z: 22, rotation: 0, width: 1.5, height: 3 },
    { id: 'lamp_1', type: 'LAMP_POST', x: 15.5, z: 45, rotation: 0, width: 1, height: 6 },
    { id: 'bldg_left_1', type: 'BUILDING', x: -18, z: 20, rotation: 0, width: 10, height: 16, bldgHeight: 18 },
    { id: 'bldg_right_1', type: 'BUILDING', x: 24, z: 20, rotation: 0, width: 10, height: 16, bldgHeight: 22 },
    { id: 'tree_left_1', type: 'TREE', x: -5, z: 10, rotation: 0, width: 2, height: 4 },
    { id: 'tree_right_1', type: 'TREE', x: 17, z: 10, rotation: 0, width: 2, height: 4 },

    // ── 2. KHÚC CUA 90° SỐ 1 (Turn 1 - North to East) ────────────────────
    { id: 'curve_1', type: 'ROAD_CURVE_90', x: 0, z: 80, rotation: 90, width: 24, height: 24 },

    // ── 3. NHÁNH ĐƯỜNG ĐÔNG & VẠCH NGƯỜI ĐI BỘ (East Avenue) ─────────────
    { id: 'road_east_1', type: 'ROAD_STRAIGHT', x: 24, z: 80, rotation: 90, width: 14, height: 60 },
    { id: 'zebra_1', type: 'ZEBRA', x: 35, z: 80, rotation: 90, width: 14, height: 3 },
    { id: 'tl_1', type: 'TRAFFIC_LIGHT', x: 35, z: 95, rotation: 0, width: 1, height: 4 },
    { id: 'sign_speed_30_1', type: 'SIGN', signType: 'SPEED_LIMIT', value: 30, x: 55, z: 95, rotation: 90, width: 1.5, height: 3 },

    // ── 4. BÀI THI CUA CHỮ S / VỆT BÁNH XE (S-Curve Slalom Section) ──────
    { id: 's_curve_1', type: 'ROAD_S_CURVE', x: 84, z: 80, rotation: 90, width: 14, height: 50, amplitude: 4.5 },

    // ── 5. KHÚC CUA 90° SỐ 2 (Turn 2 - East to South) ────────────────────
    { id: 'curve_2', type: 'ROAD_CURVE_90', x: 134, z: 80, rotation: 180, width: 24, height: 24 },

    // ── 6. ĐƯỜNG PHÍA ĐÔNG & NGÃ TƯ BIỂN STOP (East Corridor & 4-Way) ─────
    { id: 'road_south_1', type: 'ROAD_STRAIGHT', x: 146, z: 40, rotation: 0, width: 14, height: 40 },
    { id: 'inter_4way_1', type: 'INTERSECTION_4WAY', x: 146, z: 0, rotation: 0, width: 14, height: 14 },
    { id: 'sign_stop_1', type: 'SIGN', signType: 'STOP', x: 161, z: 5, rotation: 0, width: 1.5, height: 3 },
    { id: 'parking_bay_2', type: 'PARKING_BAY', x: 160, z: 20, rotation: 0, width: 8, height: 25 },

    // ── 7. BÀI THI DỐC ĐỀ-PA (Hill Start Ramp - Anfahren am Berg) ────────
    { id: 'road_to_hill', type: 'ROAD_STRAIGHT', x: 146, z: -40, rotation: 0, width: 14, height: 40 },
    { id: 'hill_ramp_1', type: 'HILL_RAMP', x: 149, z: -80, rotation: 0, width: 8, height: 36, maxHeight: 1.1 },
    { id: 'sign_priority_1', type: 'SIGN', signType: 'PRIORITY', x: 158, z: -60, rotation: 0, width: 1.5, height: 3 },

    // ── 8. KHÚC CUA 90° SỐ 3 (Turn 3 - South to West) ────────────────────
    { id: 'curve_3', type: 'ROAD_CURVE_90', x: 146, z: -116, rotation: 270, width: 24, height: 24 },

    // ── 9. ĐƯỜNG DẪN ĐẾN VÒNG XUYẾN (Avenue to Roundabout) ───────────────
    { id: 'road_to_roundabout', type: 'ROAD_STRAIGHT', x: 96, z: -128, rotation: 90, width: 14, height: 50 },

    // ── 10. VÒNG XUYẾN STVO 4 LỐI (4-Way Roundabout / Kreisverkehr) ──────
    { id: 'roundabout_main', type: 'ROUNDABOUT_4WAY', x: 50, z: -136, rotation: 0, width: 32, height: 32 },

    // ── 11. ĐƯỜNG THOÁT VÒNG XUYẾN & KHÉP KÍN VÒNG SA HÌNH ───────────────
    { id: 'road_from_roundabout', type: 'ROAD_STRAIGHT', x: 14, z: -128, rotation: 90, width: 14, height: 36 },
    { id: 'curve_4', type: 'ROAD_CURVE_90', x: 0, z: -116, rotation: 0, width: 24, height: 24 },
    { id: 'road_connector_close', type: 'ROAD_STRAIGHT', x: 0, z: -92, rotation: 0, width: 14, height: 32 },

    // ── 12. ĐIỂM XUẤT PHÁT (Spawn Point) ────────────────────────────────
    { id: 'spawn_start', type: 'SPAWN_POINT', x: 3.5, z: 5, rotation: 0, width: 3, height: 6 }
  ]
});
