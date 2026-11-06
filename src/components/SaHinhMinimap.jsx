import React, { useState, useMemo } from 'react';
import { Compass, Maximize2, Minimize2, EyeOff, Map } from 'lucide-react';
import roadGraphData from '../simulation/data/road_graph.json';

export const SAHINH_ZONES = [
  {
    id: 'slalom',
    number: 1,
    nameVi: '1. Lái Ziczac (Slalom)',
    nameDe: 'Slalomparcours',
    icon: '🏎️',
    color: '#0284c7',
    bounds: { minX: -60, maxX: -28, minZ: -72, maxZ: 18 },
    tipVi: 'Vận tốc < 18 km/h. Đánh lái đều tay nhịp nhàng uốn lượn qua 8 cọc tiêu.',
    tipDe: 'Geschwindigkeit < 20 km/h. Gleichmäßig um die Leitkegel lenken.',
    exerciseId: 'sahinh_b1_slalom'
  },
  {
    id: 'parallel_parking',
    number: 2,
    nameVi: '2. Ghép Xe Song Song',
    nameDe: 'Längsparken',
    icon: '🅿️',
    color: '#2563eb',
    bounds: { minX: 28, maxX: 64, minZ: -65, maxZ: 18 },
    tipVi: 'Bật Xi-nhan Phải (E) -> Số R (2) -> Lùi góc 45° vào giữa 2 xe ô tô.',
    tipDe: 'Blinker rechts -> Rückwärtsgang (R) -> Parallel zwischen Fahrzeugen einparken.',
    exerciseId: 'sahinh_b3_parallel'
  },
  {
    id: 'perpendicular_parking',
    number: 3,
    nameVi: '3. Ghép Xe Vuông Góc 90°',
    nameDe: 'Querparken 90°',
    icon: '🚗',
    color: '#7c3aed',
    bounds: { minX: 30, maxX: 66, minZ: -160, maxZ: -90 },
    tipVi: 'Tiến qua cửa chuồng 1 thân xe -> Xi-nhan Phải (E) -> Lùi vuông góc 90°.',
    tipDe: 'Vorbeifahren -> Blinker rechts -> Im 90°-Winkel rückwärts einparken.',
    exerciseId: 'sahinh_b4_perpendicular'
  },
  {
    id: 'roundabout',
    number: 4,
    nameVi: '4. Vòng Xuyến Giao Thông',
    nameDe: 'Kreisverkehr',
    icon: '🔄',
    color: '#059669',
    center: { x: -55, z: -125, radius: 26 },
    tipVi: 'Nhường xe trong vòng xuyến. Bật Xi-nhan Phải (E) & Schulterblick khi ra.',
    tipDe: 'Vorfahrt im Kreisverkehr gewähren. Beim Ausfahren rechts blinken.',
    exerciseId: 'sahinh_b9_umkehren'
  },
  {
    id: 'intersection_4way',
    number: 5,
    nameVi: '5. Ngã Tư & Đèn Tín Hiệu',
    nameDe: 'Kreuzung & Ampel',
    icon: '🚦',
    color: '#d97706',
    bounds: { minX: -18, maxX: 18, minZ: -98, maxZ: -62 },
    tipVi: 'Dừng trước vạch Haltelinie đỏ. Tuân thủ Rechts vor Links (Ưu tiên bên phải).',
    tipDe: 'Vor der Haltelinie halten. Rechts vor Links beachten.',
    exerciseId: 'sahinh_b6_ampel'
  },
  {
    id: 'scurve',
    number: 6,
    nameVi: '6. Đường Quanh Co Chữ S',
    nameDe: 'S-Kurve',
    icon: '〰️',
    color: '#ea580c',
    bounds: { minX: -74, maxX: -22, minZ: -236, maxZ: -165 },
    tipVi: 'Tốc độ chậm < 15 km/h. Bám cua ngoài (tiến bám lưng), không chạm cọc rào.',
    tipDe: 'Niedrige Geschwindigkeit. Außen anfahren, Leitkegel nicht berühren.',
    exerciseId: 'sahinh_b5_scurve'
  },
  {
    id: 'brake',
    number: 7,
    nameVi: '7. Phanh Dừng Khẩn Cấp',
    nameDe: 'Gefahrenbremsung',
    icon: '🚨',
    color: '#dc2626',
    bounds: { minX: 6, maxX: 26, minZ: -238, maxZ: -145 },
    tipVi: 'Đạp ga tăng tốc 30 km/h -> Khi có hiệu lệnh, đạp phanh kịch sàn (S) dưới 6m!',
    tipDe: 'Auf mindestens 30 km/h beschleunigen -> Vollbremsung durchführen!',
    exerciseId: 'sahinh_b7_brake'
  },
  {
    id: 'finish',
    number: 8,
    nameVi: '8. Vạch Đích & Kết Thúc',
    nameDe: 'Ziel & Prüfungsende',
    icon: '🏁',
    color: '#16a34a',
    bounds: { minX: -18, maxX: 18, minZ: -262, maxZ: -222 },
    tipVi: 'Xi-nhan Phải (E) tấp lề -> Dừng bánh xe -> Về số P (1) -> Kéo phanh tay (Space).',
    tipDe: 'Rechts heranfahren -> Anhalten -> Parkstufe P -> Handbremse anziehen.',
    exerciseId: 'sahinh_b11_finish'
  },
  {
    id: 'main_avenue',
    number: 0,
    nameVi: 'Trục Đường Nối Sân Tập',
    nameDe: 'Verbindungsstraße',
    icon: '🛣️',
    color: '#64748b',
    bounds: { minX: -118, maxX: 118, minZ: -265, maxZ: 245 },
    tipVi: 'Đi theo các biển báo StVO và mũi tên dẫn hướng đến các bãi sa hình.',
    tipDe: 'Den Richtungspfeilen zu den Übungsbereichen folgen.',
    exerciseId: 'sahinh_full_01'
  }
];

export function detectSaHinhZone(x, z) {
  for (const zone of SAHINH_ZONES) {
    if (zone.id === 'main_avenue') continue;
    if (zone.center) {
      const dx = x - zone.center.x;
      const dz = z - zone.center.z;
      if (Math.hypot(dx, dz) <= zone.center.radius) return zone;
    } else if (zone.bounds) {
      if (x >= zone.bounds.minX && x <= zone.bounds.maxX &&
          z >= zone.bounds.minZ && z <= zone.bounds.maxZ) {
        return zone;
      }
    }
  }
  return SAHINH_ZONES.find(z => z.id === 'main_avenue') || null;
}

export const BERLIN_MITTE_ZONES = [
  {
    id: 'unter_den_linden',
    number: 1,
    nameVi: '1. Đại Lộ Unter den Linden',
    nameDe: 'Unter den Linden · Boulevard',
    icon: '🏛️',
    color: '#22c55e',
    bounds: { minX: -650, maxX: 650, minZ: -300, maxZ: 100 },
    teleport: { x: 0, z: 0, rot: Math.PI / 2 },
    tipVi: 'Đại lộ danh tiếng 4 làn: Kết nối Cổng Brandenburger Tor, Đại học Humboldt và Cầu sông Spree.',
    tipDe: 'Historischer Boulevard: Verbindet Brandenburger Tor, Humboldt-Universität und Spreebrücke.'
  },
  {
    id: 'alexanderplatz',
    number: 2,
    nameVi: '2. Quảng Trường Alexanderplatz',
    nameDe: 'Alexanderplatz & Fernsehturm',
    icon: '🗼',
    color: '#ef4444',
    bounds: { minX: 1000, maxX: 1900, minZ: 250, maxZ: 1200 },
    teleport: { x: 1485, z: 490, rot: 0 },
    tipVi: 'Giao thông phức tạp: Tháp truyền hình Berlin (368m), mạng lưới tàu điện Tram, Bus và vòng xuyến.',
    tipDe: 'Komplexer Verkehrsknotenpunkt: Berliner Fernsehturm, Straßenbahnnetz und Kreisverkehr.'
  },
  {
    id: 'friedrichstrasse',
    number: 3,
    nameVi: '3. Đại Lộ Friedrichstraße',
    nameDe: 'Friedrichstraße · Nord-Süd-Achse',
    icon: '🏬',
    color: '#3b82f6',
    bounds: { minX: -300, maxX: 200, minZ: -400, maxZ: 1150 },
    teleport: { x: -2.88, z: 32.0, rot: 0 },
    tipVi: 'Trục phố thương mại chính xuyên Bắc-Nam, cắt Unter den Linden và đi qua Ga U/S-Bahn Friedrichstraße.',
    tipDe: 'Zentrale Einkaufs- und Geschäftsstraße von der Torstraße bis zur Leipziger Straße.'
  },
  {
    id: 'hackescher_markt',
    number: 4,
    nameVi: '4. Phố Cổ Hackescher Markt',
    nameDe: 'Hackescher Markt & Scheunenviertel',
    icon: '☕',
    color: '#f97316',
    bounds: { minX: 700, maxX: 1200, minZ: 500, maxZ: 950 },
    teleport: { x: 980, z: 695, rot: 0 },
    tipVi: 'Khu phố cổ uốn lượn ven sông Spree: Đường đá cuội, quán café, đông người đi bộ và làn xe đạp 30 km/h.',
    tipDe: 'Lebendiges Altstadtviertel an der Spree mit vielen Cafés, Fußgängern und Radwegen.'
  },
  {
    id: 'gendarmenmarkt',
    number: 5,
    nameVi: '5. Quảng Trường Gendarmenmarkt',
    nameDe: 'Gendarmenmarkt & Französischer Dom',
    icon: '⛪',
    color: '#a855f7',
    bounds: { minX: 50, maxX: 450, minZ: -450, maxZ: -100 },
    teleport: { x: 154, z: -236, rot: Math.PI },
    tipVi: 'Quảng trường tuyệt đẹp: Nhà thờ Französischer Dom, khu vực luyện rẽ góc và bãi đỗ xe song song.',
    tipDe: 'Historischer Platz mit dem Französischen Dom. Ideal zum Üben von Abbiegen und Parken.'
  },
  {
    id: 'tiergarten_brandenburg',
    number: 6,
    nameVi: '6. Tiergarten & Brandenburger Tor',
    nameDe: 'Tiergarten & Brandenburger Tor',
    icon: '🌲',
    color: '#06b6d4',
    bounds: { minX: -1600, maxX: -600, minZ: -400, maxZ: 300 },
    teleport: { x: -781, z: -37, rot: -Math.PI / 2 },
    tipVi: 'Cổng biểu tượng Brandenburger Tor, quảng trường Pariser Platz và công viên Tiergarten rợp bóng cây.',
    tipDe: 'Berliner Wahrzeichen: Brandenburger Tor, Pariser Platz und der Große Tiergarten.'
  },
  {
    id: 'side_streets',
    number: 7,
    nameVi: '7. Tuyến Phố Dân Cư (Zone 30)',
    nameDe: 'Nebenstraßen & Wohngebiet 30',
    icon: '🏡',
    color: '#64748b',
    bounds: { minX: -400, maxX: 600, minZ: 900, maxZ: 1500 },
    teleport: { x: -16, z: 1290, rot: Math.PI / 2 },
    tipVi: 'Khu vực dân sinh giới hạn 30 km/h: Chú ý xe đỗ mở cửa đột ngột (§ 14 StVO) và ưu tiên bên phải.',
    tipDe: 'Tempo-30-Zone im Wohngebiet. Rechts vor Links und Dooring-Gefahr beachten (§ 14 StVO).'
  },
  {
    id: 'mitte_general',
    number: 0,
    nameVi: 'Bản Đồ Thủ Đô Berlin-Mitte 3.4x3.3 km (OSM Thật)',
    nameDe: 'Berlin-Mitte 3.4x3.3 km · Open World',
    icon: '🏙️',
    color: '#0284c7',
    bounds: { minX: -1612, maxX: 1775, minZ: -1336, maxZ: 2004 },
    teleport: { x: -2.88, z: 32.0, rot: 0 },
    tipVi: 'Thế giới mở đô thị Berlin-Mitte chuẩn 1:1 mét thật từ dữ liệu nhị phân OpenStreetMap (.osm.pbf).',
    tipDe: 'Nahtlose Stadtfahrt Berlin-Mitte aus OpenStreetMap PBF-Rohdaten.'
  }
];

import { LANDSTRASSE_ZONES, AUTOBAHN_ZONES } from './BerlinMitteOverviewMapModal.jsx';

export function detectZoneForMap(mapId, x, z) {
  const m = (mapId || '').toLowerCase();
  if (m === 'custom_map') return null; // Bản đồ tùy chỉnh không có zone định sẵn
  let zones = BERLIN_MITTE_ZONES;
  if (m.includes('autobahn')) {
    zones = AUTOBAHN_ZONES;
  } else if (m.includes('land')) {
    zones = LANDSTRASSE_ZONES;
  } else if (m.includes('sa_hinh')) {
    zones = SAHINH_ZONES;
  } else if (m.includes('training')) {
    // 🏫 Fahrschule Circuit — không dùng zones Berlin mặc định (fallback cũ hiện
    // nhầm "1. Đại Lộ Unter den Linden" trên map training)
    return {
      id: 'training_route',
      number: 1,
      nameVi: 'Lộ Trình Tập Lái: Phố ➔ A2 ➔ Phố',
      nameDe: 'Fahrschule Circuit · Übungsroute',
      icon: '🏫',
      color: '#22d3ee',
      tipVi: 'Hauptstraße ➔ Verbindungstraße ➔ Auffahrt A2 ➔ Autobahn ➔ Ausfahrt ➔ Kreuzstraße. Tập nhập/thoát cao tốc trong 1 vòng.',
      tipDe: 'Hauptstraße ➔ Verbindungstraße ➔ Auffahrt A2 ➔ Autobahn ➔ Ausfahrt ➔ Kreuzstraße.'
    };
  }

  for (const zone of zones) {
    if (zone.id === 'mitte_general') continue;
    if (zone.bounds) {
      if (x >= zone.bounds.minX && x <= zone.bounds.maxX &&
          z >= zone.bounds.minZ && z <= zone.bounds.maxZ) {
        return zone;
      }
    }
  }
  return zones[0] || null;
}

export function detectBerlinMitteZone(x, z) {
  return detectZoneForMap('stadt_zentrum', x, z);
}

/**
 * 🗺️ 2D Radar Minimap HUD Component
 * Renders an interactive, high-contrast StVO training ground minimap
 */
export const SaHinhMinimap = React.memo(({
  mapId = 'sa_hinh_fahrschule',
  customMapData = null,
  playerX = 3.5,
  playerZ = 0,
  heading = 0,
  speed = 0,
  activeZone = null,
  onSelectExercise = null,
  onTeleport = null,
  isOpen = true,
  onToggleOpen = null,
  onOpenOverviewMap = null,
  targetDirective = null,
  trafficCars = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isRealWorldMap = (
    mapId === 'stadt_zentrum' || mapId === 'STADT' || mapId === 'stadt' ||
    mapId === 'landstrasse_b2' || mapId === 'landstrasse' || mapId === 'LANDSTRASSE' ||
    mapId === 'autobahn_a9' || mapId === 'autobahn_a' || mapId === 'autobahn' || mapId === 'AUTOBAHN' ||
    (mapId && (mapId.includes('stadt') || mapId.includes('land') || mapId.includes('autobahn')))
  );
  const isBerlinMitte = isRealWorldMap;
  const isCustomRadar = (mapId === 'custom_map') && !!(customMapData && Array.isArray(customMapData.elements) && customMapData.elements.length);
  const isRadarMode = isBerlinMitte || isCustomRadar;

  if (!isOpen) {
    return (
      <button
        onClick={() => onToggleOpen && onToggleOpen(true)}
        title={isRealWorldMap ? "Mở Bản Đồ 2D (O)" : "Mở Radar Bản Đồ Sa Hình (O)"}
        style={{
          position: 'absolute',
          top: 60,
          right: 16,
          zIndex: 40,
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1.5px solid #38bdf8',
          color: '#38bdf8',
          borderRadius: 8,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: '700',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
        }}
      >
        <Compass size={14} />
        <span>{isBerlinMitte ? 'Bản Đồ Berlin' : 'Bản Đồ Sân'}</span>
      </button>
    );
  }

  // SVG coordinate transformation:
  // World X [-118, 118] / [-160, 160] -> SVG x
  // World Z -> SVG y maps -Z so North (positive Z) is UP (negative y in SVG)
  const svgX = playerX;
  const svgY = -playerZ;

  // Heading rotation: heading 0 is driving South (downwards on map, angle = 180deg)
  const headingDeg = 180 - (heading * 180 / Math.PI);

  const minimapWidth = isExpanded ? (isRadarMode ? 320 : 250) : (isRadarMode ? 210 : 170);
  const minimapHeight = isExpanded ? (isRadarMode ? 290 : 400) : (isRadarMode ? 195 : 270);

  const radarRadius = isExpanded ? 240 : 130;
  const viewBox = isRadarMode
    ? `${playerX - radarRadius} ${-playerZ - radarRadius} ${radarRadius * 2} ${radarRadius * 2}`
    : "-125 -255 250 515";
  const compassPos = isRadarMode
    ? { x: playerX - radarRadius + 18, y: -playerZ - radarRadius + 18 }
    : { x: -105, y: -230 };

  // Calculate nearby features for high performance 60fps radar
  const nearbyRoads = useMemo(() => {
    if (!isBerlinMitte || !roadGraphData?.roads) return [];
    const r = radarRadius + 60;
    return roadGraphData.roads.filter(road => {
      return road.centerline?.some(([x, z]) => Math.abs(x - playerX) <= r && Math.abs(z - playerZ) <= r);
    });
  }, [isBerlinMitte, playerX, playerZ, radarRadius]);

  const nearbyWaterways = useMemo(() => {
    if (!isBerlinMitte || !roadGraphData?.waterways) return [];
    const r = radarRadius + 80;
    return roadGraphData.waterways.filter(w => {
      return w.points?.some(([x, z]) => Math.abs(x - playerX) <= r && Math.abs(z - playerZ) <= r);
    });
  }, [isBerlinMitte, playerX, playerZ, radarRadius]);

  const nearbyRailways = useMemo(() => {
    if (!isBerlinMitte || !roadGraphData?.railways) return [];
    const r = radarRadius + 60;
    return roadGraphData.railways.filter(rw => {
      return rw.points?.some(([x, z]) => Math.abs(x - playerX) <= r && Math.abs(z - playerZ) <= r);
    });
  }, [isBerlinMitte, playerX, playerZ, radarRadius]);

  const nearbyParks = useMemo(() => {
    if (!isBerlinMitte || !roadGraphData?.parks) return [];
    const r = radarRadius + 60;
    return roadGraphData.parks.filter(p => {
      return p.points?.some(([x, z]) => Math.abs(x - playerX) <= r && Math.abs(z - playerZ) <= r);
    });
  }, [isBerlinMitte, playerX, playerZ, radarRadius]);

  const nearbyLandmarks = useMemo(() => {
    if (!isBerlinMitte || !roadGraphData?.landmarks) return [];
    const r = radarRadius + 90;
    return roadGraphData.landmarks.filter(lm => {
      return Math.abs(lm.x - playerX) <= r && Math.abs(lm.z - playerZ) <= r;
    });
  }, [isBerlinMitte, playerX, playerZ, radarRadius]);

  const nearbyJunctions = useMemo(() => {
    if (!isBerlinMitte || !roadGraphData?.junctions) return [];
    const r = radarRadius + 50;
    return roadGraphData.junctions.filter(j => {
      return j.center && Math.abs(j.center[0] - playerX) <= r && Math.abs(j.center[1] - playerZ) <= r;
    });
  }, [isBerlinMitte, playerX, playerZ, radarRadius]);

  // Phần tử bản đồ tùy chỉnh (MapEditor) trong tầm radar — hệ tọa độ editor (z hướng xuống)
  const nearbyCustomElements = useMemo(() => {
    if (!isCustomRadar || !customMapData?.elements) return [];
    const r = radarRadius + 80;
    return customMapData.elements.filter(el => {
      if (!el) return false;
      const isQ = el.rotation === 90 || el.rotation === 270;
      const ew = isQ ? (el.height || 0) : (el.width || 0);
      const eh = isQ ? (el.width || 0) : (el.height || 0);
      const cx = el.x + ew / 2;
      const cy = el.z + eh / 2;
      const half = Math.max(ew, eh) / 2 + 10;
      return Math.abs(cx - playerX) <= r + half && Math.abs(cy - (-playerZ)) <= r + half;
    });
  }, [isCustomRadar, customMapData, playerX, playerZ, radarRadius]);

  return (
    <div style={{
      position: 'absolute',
      top: 60,
      right: 16,
      zIndex: 40,
      width: minimapWidth,
      background: 'rgba(15, 23, 42, 0.92)',
      border: '1.5px solid rgba(56, 189, 248, 0.45)',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 16px rgba(56, 189, 248, 0.15)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 10px',
        background: 'rgba(30, 41, 59, 0.8)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>{isCustomRadar ? '🛠️' : mapId?.includes('autobahn') ? '🏎️' : mapId?.includes('land') ? '🌲' : mapId?.includes('training') ? '🏫' : isBerlinMitte ? '🏙️' : '🗺️'}</span>
          <span style={{ fontSize: 11, fontWeight: '800', color: '#f8fafc', letterSpacing: '0.02em' }}>
            {isCustomRadar ? 'BẢN ĐỒ CUSTOM' : mapId?.includes('autobahn') ? 'AUTOBAHN A2' : mapId?.includes('land') ? 'LANDSTRAßE B2' : mapId?.includes('training') ? 'FAHRSCHULE CIRCUIT' : isBerlinMitte ? 'BERLIN-MITTE' : 'RADAR SA HÌNH'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onOpenOverviewMap && (
            <button
              onClick={onOpenOverviewMap}
              title="Mở Bản Đồ Tổng Thể 2D (M)"
              style={{
                background: 'rgba(2, 132, 199, 0.3)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                cursor: 'pointer',
                padding: '2px 5px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10,
                fontWeight: '700'
              }}
            >
              <Map size={11} />
              <span>2D (M)</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            title={isExpanded ? "Thu nhỏ" : "Phóng to"}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 2,
              display: 'flex'
            }}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={() => onToggleOpen && onToggleOpen(false)}
            title="Đóng bản đồ (O)"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 2,
              display: 'flex'
            }}
          >
            <EyeOff size={13} />
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div style={{ position: 'relative', width: '100%', height: minimapHeight, background: '#090d16' }}>
        <svg
          viewBox={viewBox}
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {isCustomRadar ? (
            /* ══════════════════════════════════════════════════════════ */
            /* 🛠️ RADAR BẢN ĐỒ CUSTOM (MapEditor JSON)                  */
            /* ══════════════════════════════════════════════════════════ */
            <g id="custom_map_radar">
              {/* Ground Base centered on current radar viewport */}
              <rect
                x={playerX - radarRadius}
                y={-playerZ - radarRadius}
                width={radarRadius * 2}
                height={radarRadius * 2}
                fill="#070c16"
              />

              {/* Concentric radar range rings */}
              <circle
                cx={playerX}
                cy={-playerZ}
                r={radarRadius * 0.45}
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.8"
                strokeDasharray="4,6"
              />
              <circle
                cx={playerX}
                cy={-playerZ}
                r={radarRadius * 0.85}
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.8"
                strokeDasharray="4,6"
              />

              {nearbyCustomElements.map(el => {
                if (!el) return null;
                const rot = el.rotation || 0;
                const isQ = rot === 90 || rot === 270;
                const ew = isQ ? (el.height || 0) : (el.width || 0);
                const eh = isQ ? (el.width || 0) : (el.height || 0);
                const cx = el.x + ew / 2;
                const cy = el.z + eh / 2;
                const rotTransform = rot ? `rotate(${rot}, ${cx}, ${cy})` : undefined;

                switch (el.type) {
                  case 'ROAD_STRAIGHT': {
                    const roadW = Math.max(4, Math.min(ew, eh) * 0.8);
                    const vertical = eh >= ew;
                    const pts = vertical
                      ? `${cx},${cy - eh / 2} ${cx},${cy + eh / 2}`
                      : `${cx - ew / 2},${cy} ${cx + ew / 2},${cy}`;
                    return (
                      <g key={el.id}>
                        <polyline points={pts} stroke="#172233" strokeWidth={roadW} fill="none" />
                        <polyline points={pts} stroke="#475569" strokeWidth={0.6} strokeDasharray="3,3" fill="none" />
                      </g>
                    );
                  }
                  case 'ROAD_CURVE_90': {
                    // Cua 90°: cung từ giữa cạnh bắc đến giữa cạnh tây, phồi toả về phía trong ô
                    const ts = Math.max(el.width || 0, el.height || 0);
                    const roadW = Math.max(4, Math.min(el.width || 0, el.height || 0, 14) * 0.8);
                    const R = ts / 2;
                    return (
                      <path
                        key={el.id}
                        d={`M ${cx},${cy - ts / 2} A ${R},${R} 0 0 1 ${cx - ts / 2},${cy}`}
                        transform={rotTransform}
                        stroke="#172233"
                        strokeWidth={roadW}
                        fill="none"
                      />
                    );
                  }
                  case 'ROAD_S_CURVE': {
                    const roadW = Math.max(4, (el.width || 14) * 0.7);
                    const len = el.height || 40;
                    const amp = el.amplitude || 4.2;
                    const pts = [];
                    for (let i = 0; i <= 12; i++) {
                      const t = i / 12;
                      const sx = amp * Math.sin(Math.PI * 2 * t) * Math.pow(Math.sin(Math.PI * t), 1.5);
                      pts.push(`${cx + sx},${cy - len / 2 + t * len}`);
                    }
                    return (
                      <polyline
                        key={el.id}
                        points={pts.join(' ')}
                        transform={rotTransform}
                        stroke="#172233"
                        strokeWidth={roadW}
                        fill="none"
                      />
                    );
                  }
                  case 'ROUNDABOUT':
                  case 'ROUNDABOUT_4WAY': {
                    const outerR = Math.max(el.width || 0, el.height || 0) / 2;
                    const innerR = Math.max(4, outerR - 9.5);
                    return (
                      <g key={el.id}>
                        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#172233" strokeWidth={(outerR - innerR) * 2} />
                        <circle cx={cx} cy={cy} r={innerR * 0.85} fill="#14532d" stroke="#166534" strokeWidth="0.8" />
                      </g>
                    );
                  }
                  case 'JUNCTION_AMPEL':
                  case 'JUNCTION_4WAY':
                  case 'JUNCTION_3WAY': {
                    return (
                      <g key={el.id} transform={`translate(${cx}, ${cy})`}>
                        <rect x={-ew / 2} y={-eh / 2} width={ew} height={eh} fill="#172233" />
                        {el.hasTrafficLight || el.type === 'JUNCTION_AMPEL' ? (
                          <circle cx="0" cy="0" r="3" fill="#0f172a" stroke="#eab308" strokeWidth="0.8" />
                        ) : null}
                      </g>
                    );
                  }
                  case 'PARK':
                    return (
                      <rect
                        key={el.id}
                        x={el.x} y={el.z} width={el.width} height={el.height}
                        transform={rotTransform}
                        fill="#064e3b" stroke="#047857" strokeWidth="0.8" opacity="0.75"
                      />
                    );
                  case 'PROMENADE':
                    return (
                      <rect
                        key={el.id}
                        x={el.x} y={el.z} width={el.width} height={el.height}
                        transform={rotTransform}
                        fill="#27272a" stroke="#57534e" strokeWidth="0.6" opacity="0.9"
                      />
                    );
                  case 'BUILDING':
                  case 'SHOP':
                  case 'BRANDENBURGER_TOR':
                    return (
                      <rect
                        key={el.id}
                        x={el.x} y={el.z} width={el.width} height={el.height}
                        transform={rotTransform}
                        fill="#1e293b" stroke="#334155" strokeWidth="0.5"
                      />
                    );
                  case 'SPAWN_POINT':
                    return (
                      <g key={el.id} transform={`translate(${cx}, ${cy})`}>
                        <circle cx="0" cy="0" r="7" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="0" y="3" textAnchor="middle" fontSize="8">🚗</text>
                      </g>
                    );
                  case 'TREE':
                    return <circle key={el.id} cx={cx} cy={cy} r={1.8} fill="#166534" />;
                  default:
                    return null;
                }
              })}

              {/* Target Directive destination marker if active */}
              {targetDirective?.targetPoint && (
                <g transform={`translate(${targetDirective.targetPoint[0]}, ${-targetDirective.targetPoint[1]})`}>
                  <circle cx="0" cy="0" r="14" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3,3" />
                  <circle cx="0" cy="0" r="6" fill="#f59e0b" />
                  <text x="0" y="14" fill="#fbbf24" fontSize="7" fontWeight="bold" textAnchor="middle">MỤC TIÊU</text>
                </g>
              )}
            </g>
          ) : isBerlinMitte ? (
            /* ══════════════════════════════════════════════════════════ */
            /* 🏙️ RADAR BERLIN-MITTE 100% REAL OSM PBF GEOMETRY         */
            /* ══════════════════════════════════════════════════════════ */
            <g id="berlin_mitte_real_osm">
              {/* Ground Base centered on current radar viewport */}
              <rect
                x={playerX - radarRadius}
                y={-playerZ - radarRadius}
                width={radarRadius * 2}
                height={radarRadius * 2}
                fill="#070c16"
              />

              {/* Concentric radar range rings */}
              <circle
                cx={playerX}
                cy={-playerZ}
                r={radarRadius * 0.45}
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.8"
                strokeDasharray="4,6"
              />
              <circle
                cx={playerX}
                cy={-playerZ}
                r={radarRadius * 0.85}
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.8"
                strokeDasharray="4,6"
              />

              {/* 1. Real Parks within radar range */}
              {nearbyParks.map(park => {
                if (!park.points || park.points.length < 3) return null;
                const ptsStr = park.points.map(([x, z]) => `${x},${-z}`).join(' ');
                return (
                  <polygon
                    key={park.id}
                    points={ptsStr}
                    fill="#064e3b"
                    stroke="#047857"
                    strokeWidth="1"
                    opacity="0.7"
                  />
                );
              })}

              {/* 2. Real Waterways within radar range (Spree river & canals) */}
              {nearbyWaterways.map(w => {
                if (!w.points || w.points.length < 2) return null;
                const ptsStr = w.points.map(([x, z]) => `${x},${-z}`).join(' ');
                if (w.isClosed) {
                  return (
                    <polygon
                      key={w.id}
                      points={ptsStr}
                      fill="#0284c7"
                      stroke="#0369a1"
                      strokeWidth="1.2"
                      opacity="0.85"
                    />
                  );
                }
                return (
                  <g key={w.id}>
                    <polyline
                      points={ptsStr}
                      stroke="#1e3a5f"
                      strokeWidth={w.width + 4}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points={ptsStr}
                      stroke="#0284c7"
                      strokeWidth={w.width}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.9"
                    />
                  </g>
                );
              })}

              {/* 3. Real Railways within radar range (S-Bahn / Tram) */}
              {nearbyRailways.map(r => {
                if (!r.points || r.points.length < 2) return null;
                const ptsStr = r.points.map(([x, z]) => `${x},${-z}`).join(' ');
                const isTram = r.railway === 'tram';
                return (
                  <polyline
                    key={r.id}
                    points={ptsStr}
                    stroke={isTram ? '#ef4444' : '#f59e0b'}
                    strokeWidth={isTram ? 2 : 3.5}
                    strokeDasharray={isTram ? '6,3' : '8,4'}
                    fill="none"
                    opacity="0.75"
                  />
                );
              })}

              {/* 4. Real OSM Roads within radar range */}
              {nearbyRoads.map(road => {
                if (!road.centerline || road.centerline.length < 2) return null;
                const ptsStr = road.centerline.map(([x, z]) => `${x},${-z}`).join(' ');
                const isPrimary = ['primary', 'primary_link', 'trunk', 'motorway'].includes(road.highway);
                const isSecondary = ['secondary', 'secondary_link', 'tertiary', 'tertiary_link'].includes(road.highway);

                if (isPrimary) {
                  return (
                    <g key={road.id}>
                      <polyline
                        points={ptsStr}
                        stroke="#334155"
                        strokeWidth={Math.max(12, road.width + 2)}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={ptsStr}
                        stroke="#0f172a"
                        strokeWidth={Math.max(10, road.width)}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={ptsStr}
                        stroke="#f8fafc"
                        strokeWidth="1"
                        strokeDasharray="6,6"
                        fill="none"
                        opacity="0.7"
                      />
                    </g>
                  );
                }

                if (isSecondary) {
                  return (
                    <polyline
                      key={road.id}
                      points={ptsStr}
                      stroke="#1e293b"
                      strokeWidth={Math.max(8, road.width)}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                }

                return (
                  <polyline
                    key={road.id}
                    points={ptsStr}
                    stroke="#172233"
                    strokeWidth={Math.max(6, road.width)}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              })}

              {/* 5. Real Junctions & Traffic signals within radar range */}
              {nearbyJunctions.filter(j => j.hasTrafficLight).map(j => (
                <g key={`ampel_${j.id}`} transform={`translate(${j.center[0]}, ${-j.center[1]})`}>
                  <circle cx="0" cy="0" r="4.5" fill="#0f172a" stroke="#eab308" strokeWidth="1" />
                  <circle cx="0" cy="0" r="2.2" fill="#22c55e" />
                </g>
              ))}

              {/* 6. Real Landmarks within radar range */}
              {nearbyLandmarks.map(lm => (
                <g key={`lm_${lm.id}`} transform={`translate(${lm.x}, ${-lm.z})`}>
                  <rect
                    x="-34"
                    y="-7"
                    width="68"
                    height="14"
                    fill="rgba(15, 23, 42, 0.88)"
                    stroke="#38bdf8"
                    strokeWidth="0.8"
                    rx="3"
                  />
                  <text
                    x="0"
                    y="3"
                    fill="#f8fafc"
                    fontSize="6.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {lm.icon} {lm.name}
                  </text>
                </g>
              ))}

              {/* 7. Target Directive destination marker if active */}
              {targetDirective?.targetPoint && (
                <g transform={`translate(${targetDirective.targetPoint[0]}, ${-targetDirective.targetPoint[1]})`}>
                  <circle cx="0" cy="0" r="14" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3,3" />
                  <circle cx="0" cy="0" r="6" fill="#f59e0b" />
                  <text x="0" y="14" fill="#fbbf24" fontSize="7" fontWeight="bold" textAnchor="middle">MỤC TIÊU</text>
                </g>
              )}
            </g>
          ) : (
            /* ══════════════════════════════════════════════════════════ */
            /* 🏎️ SƠ ĐỒ SA HÌNH FAHRSCHULE CŨ                            */
            /* ══════════════════════════════════════════════════════════ */
            <g id="sahinh_ground">
              {/* Ground Grass / Base */}
              <rect x="-120" y="-250" width="240" height="500" fill="#0b1320" rx="4" />

              {/* Grid lines for scale */}
              <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,6">
                {[-80, -40, 0, 40, 80].map(gx => (
                  <line key={`gx_${gx}`} x1={gx} y1="-250" x2={gx} y2="250" />
                ))}
                {[-200, -100, 0, 80, 160, 240].map(gy => (
                  <line key={`gy_${gy}`} x1="-120" y1={gy} x2="120" y2={gy} />
                ))}
              </g>

              {/* Perimeter Safety Fence Boundary */}
              <rect
                x="-116.5" y="-243.5" width="233" height="507"
                fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,3"
              />

              {/* 1. TRỤC ĐƯỜNG CHÍNH (Central Avenue: X = 0, Width = 14m) */}
              <rect x="-7" y="-240" width="14" height="480" fill="#1e293b" />
              <line x1="0" y1="-240" x2="0" y2="240" stroke="#f8fafc" strokeWidth="0.8" strokeDasharray="4,4" />

              {/* 2. CÁC ĐƯỜNG NHÁNH NỐI BÃI TẬP */}
              {/* Nhánh Tây Bắc (Z = -20) */}
              <rect x="-65" y="14" width="58" height="12" fill="#1e293b" />
              {/* Nhánh Đông Bắc (Z = -20) */}
              <rect x="7" y="14" width="58" height="12" fill="#1e293b" />
              {/* Nhánh Đông Nam (Z = -125) */}
              <rect x="7" y="119" width="58" height="12" fill="#1e293b" />
              {/* Vành đai Tây Nam (Z = -200) */}
              <rect x="-75" y="194" width="68" height="12" fill="#1e293b" />

              {/* ── CÁC PHÂN KHU BÀI THI (ZONES) ── */}

              {/* Module 1: Lái Ziczac Slalom (X: -44, y: 27 [Z = -27]) */}
              <g onClick={() => onSelectExercise && onSelectExercise('sahinh_b1_slalom')} style={{ cursor: 'pointer' }}>
                <rect
                  x="-58" y="-18" width="28" height="90"
                  fill={activeZone?.id === 'slalom' ? 'rgba(2, 132, 199, 0.35)' : 'rgba(2, 132, 199, 0.15)'}
                  stroke="#0284c7" strokeWidth={activeZone?.id === 'slalom' ? 1.6 : 0.8} rx="2"
                />
                {[-10, 0, 10, 20, 30, 40, 50, 60].map((py, idx) => (
                  <circle key={`sl_${idx}`} cx="-44" cy={py} r="2" fill="#f97316" />
                ))}
                <text x="-44" y="76" fill="#38bdf8" fontSize="5" fontWeight="bold" textAnchor="middle">1. SLALOM</text>
              </g>

              {/* Module 2: Ghép xe song song Längsparken (X: 46, y: 23 [Z = -23]) */}
              <g onClick={() => onSelectExercise && onSelectExercise('sahinh_b3_parallel')} style={{ cursor: 'pointer' }}>
                <rect
                  x="30" y="-18" width="32" height="83"
                  fill={activeZone?.id === 'parallel_parking' ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.15)'}
                  stroke="#2563eb" strokeWidth={activeZone?.id === 'parallel_parking' ? 1.6 : 0.8} rx="2"
                />
                <rect x="42" y="-10" width="8" height="14" fill="#64748b" rx="1" />
                <rect x="42" y="32" width="8" height="14" fill="#64748b" rx="1" />
                <rect x="41" y="8" width="10" height="20" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="2,2" />
                <text x="46" y="70" fill="#60a5fa" fontSize="5" fontWeight="bold" textAnchor="middle">2. GHÉP XE // </text>
              </g>

              {/* Module 3: Ghép xe vuông góc 90° Querparken (X: 48, y: 125 [Z = -125]) */}
              <g onClick={() => onSelectExercise && onSelectExercise('sahinh_b4_perpendicular')} style={{ cursor: 'pointer' }}>
                <rect
                  x="32" y="90" width="32" height="70"
                  fill={activeZone?.id === 'perpendicular_parking' ? 'rgba(124, 58, 237, 0.35)' : 'rgba(124, 58, 237, 0.15)'}
                  stroke="#7c3aed" strokeWidth={activeZone?.id === 'perpendicular_parking' ? 1.6 : 0.8} rx="2"
                />
                <rect x="36" y="96" width="14" height="8" fill="#64748b" rx="1" />
                <rect x="36" y="136" width="14" height="8" fill="#64748b" rx="1" />
                <rect x="35" y="114" width="18" height="12" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="2,2" />
                <text x="48" y="165" fill="#c084fc" fontSize="5" fontWeight="bold" textAnchor="middle">3. LÙI CHUỒNG 90°</text>
              </g>

              {/* Module 4: Vòng xuyến Kreisverkehr (Center: X: -55, y: 125 [Z = -125]) */}
              <g onClick={() => onSelectExercise && onSelectExercise('sahinh_b9_umkehren')} style={{ cursor: 'pointer' }}>
                <circle
                  cx="-55" cy="125" r="26"
                  fill={activeZone?.id === 'roundabout' ? 'rgba(5, 150, 105, 0.35)' : 'rgba(5, 150, 105, 0.15)'}
                  stroke="#059669" strokeWidth={activeZone?.id === 'roundabout' ? 1.6 : 0.8}
                />
                <circle cx="-55" cy="125" r="18" fill="#1e293b" stroke="#34d399" strokeWidth="0.8" strokeDasharray="3,3" />
                <circle cx="-55" cy="125" r="8" fill="#047857" />
                <text x="-55" y="127" fill="#6ee7b7" fontSize="4.5" fontWeight="bold" textAnchor="middle">4. VÒNG XUYẾN</text>
              </g>

              {/* Module 5: Ngã tư có đèn tín hiệu Ampel (X: 0, y: 80 [Z = -80]) */}
              <g onClick={() => onSelectExercise && onSelectExercise('sahinh_b6_ampel')} style={{ cursor: 'pointer' }}>
                <rect
                  x="-18" y="62" width="36" height="36"
                  fill={activeZone?.id === 'intersection_4way' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(217, 119, 6, 0.15)'}
                  stroke="#d97706" strokeWidth={activeZone?.id === 'intersection_4way' ? 1.6 : 0.8} rx="2"
                />
                <rect x="-8" y="72" width="16" height="16" fill="#0f172a" />
                <line x1="-7" y1="72" x2="7" y2="72" stroke="#ef4444" strokeWidth="1.5" />
                <line x1="-7" y1="88" x2="7" y2="88" stroke="#ef4444" strokeWidth="1.5" />
                <circle cx="-10" cy="70" r="2" fill="#ef4444" />
                <circle cx="10" cy="90" r="2" fill="#22c55e" />
                <text x="0" y="82" fill="#fcd34d" fontSize="4" fontWeight="bold" textAnchor="middle">5. NGÃ TƯ</text>
              </g>

              {/* Module 6: Đường quanh co chữ S S-Kurve (X: -48, y: 200 [Z = -200]) */}
              <g onClick={() => onSelectExercise && onSelectExercise('sahinh_b5_scurve')} style={{ cursor: 'pointer' }}>
                <rect
                  x="-72" y="165" width="48" height="71"
                  fill={activeZone?.id === 'scurve' ? 'rgba(234, 88, 12, 0.35)' : 'rgba(234, 88, 12, 0.15)'}
                  stroke="#ea580c" strokeWidth={activeZone?.id === 'scurve' ? 1.6 : 0.8} rx="2"
                />
                <path d="M -60 172 Q -38 188 -60 205 Q -38 222 -60 230" fill="none" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
                <text x="-48" y="228" fill="#fdba74" fontSize="4.5" fontWeight="bold" textAnchor="middle">6. ĐƯỜNG CHỮ S</text>
              </g>

              {/* Module 7: Phanh gấp dừng xe khẩn cấp Gefahrenbremsung (X: 16, y: 191 [Z = -191]) */}
              <g onClick={() => onSelectExercise && onSelectExercise('sahinh_b7_brake')} style={{ cursor: 'pointer' }}>
                <rect
                  x="8" y="145" width="16" height="93"
                  fill={activeZone?.id === 'brake' ? 'rgba(220, 38, 38, 0.35)' : 'rgba(220, 38, 38, 0.15)'}
                  stroke="#dc2626" strokeWidth={activeZone?.id === 'brake' ? 1.6 : 0.8} rx="2"
                />
                <line x1="8" y1="205" x2="24" y2="205" stroke="#ef4444" strokeWidth="1.5" />
                <text x="16" y="185" fill="#fca5a5" fontSize="5" fontWeight="bold" textAnchor="middle">7. PHANH</text>
              </g>

              {/* Module 8: Vạch Đích & Kết Thúc (X: 0, y: 234 [Z = -234]) */}
              <g onClick={() => onSelectExercise && onSelectExercise('sahinh_b11_finish')} style={{ cursor: 'pointer' }}>
                <rect
                  x="-9" y="226" width="18" height="24"
                  fill={activeZone?.id === 'finish' ? 'rgba(22, 163, 74, 0.35)' : 'rgba(22, 163, 74, 0.15)'}
                  stroke="#22c55e" strokeWidth={activeZone?.id === 'finish' ? 1.6 : 0.8} rx="2"
                />
                <line x1="-8" y1="234" x2="8" y2="234" stroke="#22c55e" strokeWidth="2" strokeDasharray="1,1" />
                <text x="0" y="242" fill="#86efac" fontSize="5" fontWeight="bold" textAnchor="middle">8. ĐÍCH</text>
              </g>

              {/* Control Center Building (X: 82, y: -10 [Z = 10]) */}
              <rect x="71" y="-17" width="22" height="14" fill="#334155" stroke="#64748b" strokeWidth="0.8" rx="2" />
              <text x="82" y="-9" fill="#94a3b8" fontSize="3.5" fontWeight="bold" textAnchor="middle">PRÜFUNGSZENTRUM</text>

              {/* Start Line Marker (y = 0) */}
              <line x1="-1" y1="0" x2="8" y2="0" stroke="#f8fafc" strokeWidth="1.5" />
              <text x="12" y="2" fill="#94a3b8" fontSize="4.5" fontWeight="bold">XUẤT PHÁT</text>
            </g>
          )}

          {/* 🚦 LIVE TRAFFIC AI VEHICLES WITHIN RADAR RANGE */}
          {isBerlinMitte && trafficCars && trafficCars.map(tc => {
            const tSvgX = tc.x;
            const tSvgY = -tc.z;
            const tDist = Math.hypot(tSvgX - svgX, tSvgY - svgY);
            if (tDist > radarRadius + 20) return null;
            const tHeadingDeg = 180 - (tc.heading * 180 / Math.PI);
            const colorHex = typeof tc.color === 'number' 
              ? `#${tc.color.toString(16).padStart(6, '0')}` 
              : (tc.color || '#ef4444');

            return (
              <g key={`minimap_traffic_${tc.id}`} transform={`translate(${tSvgX}, ${tSvgY})`}>
                {/* Traffic vehicle blip */}
                <g transform={`rotate(${tHeadingDeg})`}>
                  <polygon points="0,-6 3.2,4 -3.2,4" fill={colorHex} stroke="#ffffff" strokeWidth="0.6" />
                  {tc.isBraking && (
                    <circle cx="0" cy="4.5" r="1.2" fill="#ef4444" />
                  )}
                </g>
              </g>
            );
          })}

          {/* 🏎️ PLAYER CAR MARKER (Shared between both maps) */}
          <g transform={`translate(${svgX}, ${svgY})`}>
            {/* Radar ripple glow effect */}
            <circle cx="0" cy="0" r="10" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.4" />
            <circle cx="0" cy="0" r="4.5" fill="rgba(56, 189, 248, 0.3)" />

            {/* Rotatable Car Arrow */}
            <g transform={`rotate(${headingDeg})`}>
              <polygon points="0,-7 3.5,4 -3.5,4" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
              <circle cx="0" cy="1" r="1.6" fill="#0284c7" />
            </g>
          </g>

          {/* North Arrow / Compass indicator */}
          <g transform={`translate(${compassPos.x}, ${compassPos.y})`}>
            <circle cx="0" cy="0" r="9" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
            <polygon points="0,-7 2.5,0 -2.5,0" fill="#ef4444" />
            <polygon points="0,7 2.5,0 -2.5,0" fill="#e2e8f0" />
            <text x="0" y="-8.5" fill="#f8fafc" fontSize="4.5" fontWeight="bold" textAnchor="middle">N</text>
          </g>
        </svg>
      </div>

      {/* Footer info: Coordinates & Current Zone */}
      <div style={{
        padding: '6px 10px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgba(56, 189, 248, 0.2)',
        fontSize: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: activeZone?.color || '#38bdf8', fontWeight: '700' }}>
            {activeZone?.icon || '📍'} {activeZone?.nameVi || 'Đang di chuyển'}
          </span>
          <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
            {Math.round(speed)} km/h
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 9 }}>
          <span>X: {playerX.toFixed(1)}m</span>
          <span>Z: {playerZ.toFixed(1)}m</span>
          <span>Góc: {Math.round(heading * 180 / Math.PI)}°</span>
        </div>
      </div>

      {/* Quick Jump Buttons (When expanded) */}
      {isExpanded && (
        <div style={{
          padding: '6px 8px',
          background: 'rgba(30, 41, 59, 0.95)',
          borderTop: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 4
        }}>
          {isCustomRadar ? (
            <div style={{
              gridColumn: '1 / -1',
              color: '#64748b',
              fontSize: 9,
              fontWeight: '600',
              textAlign: 'center',
              padding: '4px 0'
            }}>
              🛠️ Bản đồ tùy chỉnh từ Map Editor · {customMapData?.elements?.length || 0} phần tử
            </div>
          ) : isBerlinMitte ? (
            BERLIN_MITTE_ZONES.filter(z => z.number > 0).map(z => (
              <button
                key={z.id}
                onClick={() => {
                  if (onTeleport && z.teleport) {
                    onTeleport(z.teleport.x, z.teleport.z, z.teleport.rot);
                  }
                }}
                style={{
                  background: activeZone?.id === z.id ? `${z.color}33` : 'rgba(15, 23, 42, 0.7)',
                  border: activeZone?.id === z.id ? `1px solid ${z.color}` : '1px solid rgba(148, 163, 184, 0.2)',
                  color: activeZone?.id === z.id ? '#ffffff' : '#cbd5e1',
                  padding: '3px 6px',
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{z.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{z.nameVi}</span>
              </button>
            ))
          ) : (
            SAHINH_ZONES.filter(z => z.number > 0).map(z => (
              <button
                key={z.id}
                onClick={() => onSelectExercise && onSelectExercise(z.exerciseId)}
                style={{
                  background: activeZone?.id === z.id ? `${z.color}33` : 'rgba(15, 23, 42, 0.7)',
                  border: activeZone?.id === z.id ? `1px solid ${z.color}` : '1px solid rgba(148, 163, 184, 0.2)',
                  color: activeZone?.id === z.id ? '#ffffff' : '#cbd5e1',
                  padding: '3px 6px',
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{z.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{z.nameVi}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
});

/**
 * 🏷️ Dynamic Zone Floating HUD Banner
 * Displays top center with real-time driving tips when entering any training zone
 */
export const DynamicZoneBanner = React.memo(({ zone }) => {
  if (!zone || zone.id === 'main_avenue' || zone.id === 'mitte_general') return null;

  return (
    <div className="sim-dynamic-zone-banner" style={{
      position: 'absolute',
      top: 110,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 85,
      background: 'rgba(15, 23, 42, 0.94)',
      border: `1.5px solid ${zone.color || '#38bdf8'}`,
      borderRadius: 10,
      padding: '7px 18px',
      boxShadow: `0 8px 28px rgba(0, 0, 0, 0.7), 0 0 16px ${zone.color}40`,
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      maxWidth: '90vw',
      animation: 'fadeInDown 0.3s ease-out',
      userSelect: 'none',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        fontSize: 22,
        background: `${zone.color}22`,
        borderRadius: 8,
        padding: '4px 8px',
        border: `1px solid ${zone.color}66`
      }}>
        {zone.icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
            {zone.nameVi}
          </span>
          <span style={{ fontSize: 10, fontWeight: '600', color: zone.color, opacity: 0.9 }}>
            · {zone.nameDe}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2, fontWeight: '500' }}>
          💡 {zone.tipVi}
        </div>
      </div>
    </div>
  );
});
