import React, { useState, useMemo, useRef } from 'react';
import { 
  X, Compass, Navigation, MapPin, Gauge, Shield, Flag, 
  Car, Layers, Info, CheckCircle2, ChevronRight, Zap,
  ZoomIn, ZoomOut, Maximize2, Move, Crosshair, Target, RefreshCw
} from 'lucide-react';
import { BERLIN_MITTE_ZONES } from './SaHinhMinimap.jsx';
import roadGraphStadt from '../simulation/data/road_graph.json';
import roadGraphLand from '../simulation/data/road_graph_land.json';
import roadGraphAutobahn from '../simulation/data/road_graph_autobahn.json';

export const LANDSTRASSE_ZONES = [
  { 
    id: 'land_start', 
    number: 1, 
    nameVi: '1. Trạm Xuất Phát B2', 
    nameDe: 'Landstraße B2 Start', 
    icon: '🌲', 
    color: '#22c55e', 
    bounds: { minX: -600, maxX: 600, minZ: -400, maxZ: 400 },
    teleport: { x: 0, z: 0, rot: 0 },
    tipVi: 'Bắt đầu tuyến đường tỉnh B2 tốc độ tối đa 100 km/h, 2 làn xe chạy song song.',
    tipDe: 'Start auf der Bundesstraße B2 mit Höchstgeschwindigkeit 100 km/h.'
  },
  { 
    id: 'land_forest', 
    number: 2, 
    nameVi: '2. Đoạn Rừng Thông Đức', 
    nameDe: 'Waldabschnitt 100 km/h', 
    icon: '🌲', 
    color: '#16a34a', 
    bounds: { minX: -1500, maxX: 500, minZ: -2000, maxZ: -800 },
    teleport: { x: -500, z: -1400, rot: 0 },
    tipVi: 'Tuyến đường băng qua rừng thông với khúc cua uốn lượn và cọc tiêu phản quang Leitpfosten.',
    tipDe: 'Waldstrecke mit Kurven und StVO-Leitpfosten.'
  },
  { 
    id: 'land_posts', 
    number: 3, 
    nameVi: '3. Cọc Tiêu Leitpfosten StVO', 
    nameDe: 'Reflektorpfosten StVO', 
    icon: '📍', 
    color: '#10b981', 
    bounds: { minX: 1000, maxX: 3000, minZ: -1000, maxZ: 1000 },
    teleport: { x: 2000, z: 0, rot: 0 },
    tipVi: 'Hệ thống cọc tiêu tiêu chuẩn 50m/cọc giúp định hình quỹ đạo xe ban đêm.',
    tipDe: 'Leitpfosten im 50m-Abstand zur Orientierung bei Nacht.'
  },
  { 
    id: 'land_junc', 
    number: 4, 
    nameVi: '4. Nút Giao Đường Tỉnh', 
    nameDe: 'Kreuzung Bundesstraße', 
    icon: '🚥', 
    color: '#84cc16', 
    bounds: { minX: -3000, maxX: -1000, minZ: 1000, maxZ: 3000 },
    teleport: { x: -2000, z: 2000, rot: 0 },
    tipVi: 'Nút giao ngã ba / ngã tư không đèn tín hiệu, cần chú ý nhường đường Rechts vor Links.',
    tipDe: 'Vorfahrt an Landstraßenkreuzungen beachten.'
  },
  { 
    id: 'land_loop', 
    number: 5, 
    nameVi: '5. Vòng Lặp Nối Biên', 
    nameDe: 'Connecting Loop Boundary', 
    icon: '🔄', 
    color: '#065f46', 
    bounds: { minX: 1500, maxX: 3500, minZ: 3000, maxZ: 5000 },
    teleport: { x: 2500, z: 4000, rot: 0 },
    tipVi: 'Điểm kết thúc bản đồ tỉnh, tự động lặp vô tận (Loop-back teleport) mượt mà.',
    tipDe: 'Nahtlose Teleportation am Ende der Karte.'
  }
];

export const AUTOBAHN_ZONES = [
  {
    id: 'autobahn_start',
    number: 1,
    nameVi: '1. Làn Nhập Cao Tốc Auffahrt Rhynern',
    nameDe: 'Beschleunigungsstreifen A2 Rhynern',
    icon: '🏎️',
    color: '#f59e0b',
    bounds: { minX: 200, maxX: 750, minZ: -800, maxZ: -450 },
    teleport: { x: 488, z: -589, rot: 2.134 },
    tipVi: 'Tăng tốc trên làn nhập (Beschleunigungsstreifen), quan sát gương & nhường đường xe trên A2 trước khi nhập làn.',
    tipDe: 'Auf dem Beschleunigungsstreifen beschleunigen, Verkehr auf der A2 beachten und zügig einfädeln.'
  },
  {
    id: 'autobahn_raststatte',
    number: 2,
    nameVi: '2. Raststätte Rhynern (Khu Nghỉ Dưỡng)',
    nameDe: 'Raststätte Rhynern & Tankstelle',
    icon: '⛽',
    color: '#eab308',
    bounds: { minX: -500, maxX: -100, minZ: -1200, maxZ: -900 },
    teleport: { x: -303, z: -1061, rot: 2.09 },
    tipVi: 'Lối ra vào Raststätte: giảm tốc về 60 km/h, nhường xe trên cao tốc khi tái nhập làn (§ 18 StVO).',
    tipDe: 'Einfahrt zur Raststätte: Tempo reduzieren und beim Wiedereinfädeln Vorfahrt beachten (§ 18 StVO).'
  },
  {
    id: 'autobahn_ausfahrt',
    number: 3,
    nameVi: '3. Ausfahrt Hamm/Werl (Lối Ra)',
    nameDe: 'Ausfahrt Hamm/Werl',
    icon: '🔚',
    color: '#ec4899',
    bounds: { minX: -2050, maxX: -1780, minZ: -1660, maxZ: -1470 },
    teleport: { x: -1918, z: -1560, rot: 2.0 },
    tipVi: 'Xuất cao tốc: bật xi-nhan phải sớm, giảm tốc trên làn giảm tốc (Verzögerungsstreifen), không phanh gấp trên trục chính.',
    tipDe: 'Ausfahrt: rechtzeitig blinken, auf dem Verzögerungsstreifen bremsen, nicht auf der Hauptspur abrupt abbremsen.'
  },
  {
    id: 'autobahn_kreuz',
    number: 4,
    nameVi: '4. Nút Giao Kreuz Werl (A2/A445)',
    nameDe: 'Autobahnkreuz Werl',
    icon: '🌉',
    color: '#f97316',
    bounds: { minX: -2150, maxX: -1600, minZ: -1720, maxZ: -1300 },
    teleport: { x: -1800, z: -1400, rot: 1.67 },
    tipVi: 'Nút giao nhiều làn: định hướng làn sớm qua biển gantry, giữ làn ổn định, không đổi làn qua vạch liền.',
    tipDe: 'Großes Autobahnkreuz: Fahrspur rechtzeitig über die Schilderbrücke wählen und durchgezogene Linien nicht überfahren.'
  },
  {
    id: 'autobahn_fast',
    number: 5,
    nameVi: '5. Đoạn Tốc Độ Cao A2 (Richtgeschwindigkeit)',
    nameDe: 'A2 Richtgeschwindigkeit 130 km/h',
    icon: '⚡',
    color: '#ef4444',
    bounds: { minX: 1000, maxX: 2900, minZ: -150, maxZ: 950 },
    teleport: { x: 2400, z: 600, rot: 2.134 },
    tipVi: 'Đoạn thẳng dài: Richtgeschwindigkeit 130 km/h, Rechtsfahrgebot — luôn đi làn phải khi không vượt xe.',
    tipDe: 'Gerader Streckenabschnitt: Richtgeschwindigkeit 130 km/h und Rechtsfahrgebot (§ 2 StVO).'
  }
];

export const BerlinMitteOverviewMapModal = React.memo(({
  isOpen,
  onClose,
  mapType = 'stadt_zentrum',
  playerX = 3.5,
  playerZ = -40,
  heading = 0,
  speed = 0,
  activeZone = null,
  trafficCars = [],
  onTeleport = null,
  onSelectExercise = null
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState(activeZone?.id || 'unter_den_linden');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [spawnPing, setSpawnPing] = useState(null);
  const svgRef = useRef(null);

  const targetRoadGraphData = useMemo(() => {
    const m = (mapType || '').toLowerCase();
    if (m.includes('land')) {
      return roadGraphLand;
    }
    if (m.includes('autobahn')) {
      return roadGraphAutobahn;
    }
    return roadGraphStadt;
  }, [mapType]);

  const mapHeaderInfo = useMemo(() => {
    const m = (mapType || '').toLowerCase();
    if (m.includes('land')) {
      return {
        title: 'Bản Đồ 2D Đường Liên Tỉnh (Landstraße B2)',
        badge: 'land.pbf',
        desc: `Mạng lưới đường tỉnh trích xuất từ file land.pbf: ${targetRoadGraphData.roads?.length || 0} đoạn đường, ${targetRoadGraphData.junctions?.length || 0} nút giao`,
        zonesCount: LANDSTRASSE_ZONES.length,
        zones: LANDSTRASSE_ZONES
      };
    }
    if (m.includes('autobahn')) {
      return {
        title: 'Bản Đồ 2D Cao Tốc Đức (Autobahn A2 Hamm/Rhynern)',
        badge: 'autobahn.pbf',
        desc: `Mạng lưới cao tốc trích xuất từ file autobahn.pbf: ${targetRoadGraphData.roads?.length || 0} đoạn đường, ${targetRoadGraphData.junctions?.length || 0} nút giao`,
        zonesCount: AUTOBAHN_ZONES.length,
        zones: AUTOBAHN_ZONES
      };
    }
    return {
      title: 'Bản Đồ 2D Nội Đô Berlin (Stadtfahrt)',
      badge: 'stadt.pbf',
      desc: `Mạng lưới đường phố trích xuất từ file stadt.pbf: ${targetRoadGraphData.roads?.length || 0} đoạn đường, ${targetRoadGraphData.junctions?.length || 0} nút giao`,
      zonesCount: BERLIN_MITTE_ZONES.filter(z => z.number > 0).length,
      zones: BERLIN_MITTE_ZONES.filter(z => z.number > 0)
    };
  }, [mapType, targetRoadGraphData]);

  const primaryRoads = useMemo(() => targetRoadGraphData.roads?.filter(r => ['primary', 'primary_link', 'trunk', 'motorway'].includes(r.highway)) || [], [targetRoadGraphData]);
  const secondaryRoads = useMemo(() => targetRoadGraphData.roads?.filter(r => ['secondary', 'secondary_link', 'tertiary', 'tertiary_link'].includes(r.highway)) || [], [targetRoadGraphData]);
  const residentialRoads = useMemo(() => targetRoadGraphData.roads?.filter(r => !['primary', 'primary_link', 'trunk', 'motorway', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link'].includes(r.highway)) || [], [targetRoadGraphData]);

  // Lấy bounds thực tế từ metadata
  const mapBounds = useMemo(() => {
    const b = targetRoadGraphData.metadata?.bounds;
    if (b) return { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ };
    return { minX: -1628, maxX: 1628, minZ: -1002, maxZ: 1002 };
  }, [targetRoadGraphData]);

  // Tỉ lệ phóng to nét vẽ (strokeWidth & markers) cho các map lớn như Autobahn/Land
  const scaleFactor = useMemo(() => {
    const w = mapBounds.maxX - mapBounds.minX;
    const h = mapBounds.maxZ - mapBounds.minZ;
    const extent = Math.max(w, h);
    return Math.max(1, extent / 2500);
  }, [mapBounds]);

  const PAD = useMemo(() => {
    const w = mapBounds.maxX - mapBounds.minX;
    const h = mapBounds.maxZ - mapBounds.minZ;
    return Math.max(w, h) * 0.05;
  }, [mapBounds]);

  // Khung hình cơ bản của bản đồ
  const baseBox = useMemo(() => {
    const vx = mapBounds.minX - PAD;
    const vy = -(mapBounds.maxZ + PAD);
    const vw = (mapBounds.maxX - mapBounds.minX) + PAD * 2;
    const vh = (mapBounds.maxZ - mapBounds.minZ) + PAD * 2;
    return { vx, vy, vw, vh };
  }, [mapBounds, PAD]);

  // viewBox SVG động phục vụ Phóng to (Zoom) và Bắt hình / Kéo (Pan)
  const currentVw = baseBox.vw / zoom;
  const currentVh = baseBox.vh / zoom;
  const currentVx = baseBox.vx + (baseBox.vw - currentVw) / 2 + pan.x;
  const currentVy = baseBox.vy + (baseBox.vh - currentVh) / 2 + pan.y;

  const dynamicViewBox = `${currentVx.toFixed(1)} ${currentVy.toFixed(1)} ${currentVw.toFixed(1)} ${currentVh.toFixed(1)}`;

  // Các hàm điều khiển Zoom & Pan
  const handleZoomIn = () => setZoom(prev => Math.min(15, +(prev * 1.35).toFixed(2)));
  const handleZoomOut = () => setZoom(prev => Math.max(0.3, +(prev / 1.35).toFixed(2)));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    setZoom(prev => Math.min(15, Math.max(0.3, +(prev * zoomFactor).toFixed(2))));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      setHasDragged(true);
    }
    
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const svgDx = -(dx / rect.width) * currentVw;
      const svgDy = -(dy / rect.height) * currentVh;

      setPan(prev => ({ x: prev.x + svgDx, y: prev.y + svgDy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click vào điểm bất kỳ trên bản đồ 2D để Spawn/Teleport xe thông minh
  const handleSvgClick = (e) => {
    if (hasDragged) return;
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clickXRelative = (e.clientX - rect.left) / rect.width;
    const clickYRelative = (e.clientY - rect.top) / rect.height;

    const worldX = currentVx + clickXRelative * currentVw;
    const worldSvgY = currentVy + clickYRelative * currentVh;
    const worldZ = -worldSvgY;

    let finalX = worldX;
    let finalZ = worldZ;
    let finalRot = heading;

    // Tìm đoạn đường gần nhất trong road graph để hít (snap) xe vào giữa lòng đường
    if (targetRoadGraphData.roads && targetRoadGraphData.roads.length > 0) {
      let minDistSq = Infinity;
      let bestPoint = null;
      let bestHeading = null;

      for (const road of targetRoadGraphData.roads) {
        if (!road.centerline || road.centerline.length < 2) continue;
        for (let i = 0; i < road.centerline.length - 1; i++) {
          const [x1, z1] = road.centerline[i];
          const [x2, z2] = road.centerline[i + 1];

          const dx = x2 - x1;
          const dz = z2 - z1;
          const lenSq = dx * dx + dz * dz;
          if (lenSq === 0) continue;

          let t = ((worldX - x1) * dx + (worldZ - z1) * dz) / lenSq;
          t = Math.max(0, Math.min(1, t));

          const projX = x1 + t * dx;
          const projZ = z1 + t * dz;
          const distSq = (worldX - projX) * (worldX - projX) + (worldZ - projZ) * (worldZ - projZ);

          if (distSq < minDistSq) {
            minDistSq = distSq;
            bestPoint = { x: projX, z: projZ };
            bestHeading = Math.atan2(dx, -dz);
          }
        }
      }

      // Hít vào lòng đường nếu khoảng cách < 150m
      if (bestPoint && minDistSq < 150 * 150) {
        finalX = bestPoint.x;
        finalZ = bestPoint.z;
        finalRot = bestHeading;
      }
    }

    setSpawnPing({ x: finalX, z: finalZ, id: Date.now() });

    if (onTeleport) {
      onTeleport(finalX, finalZ, finalRot);
    }
  };

  // Grid lines mỗi 250m, tự tính theo bounds thực
  const gridLines = useMemo(() => {
    const step = 250;
    const xs = [], zs = [];
    for (let x = Math.ceil(mapBounds.minX / step) * step; x <= mapBounds.maxX; x += step) xs.push(x);
    for (let z = Math.ceil(mapBounds.minZ / step) * step; z <= mapBounds.maxZ; z += step) zs.push(z);
    return { xs, zs };
  }, [mapBounds]);

  // Danh sách kịch bản chuẩn StVO ở đáy bản đồ
  const scenariosList = useMemo(() => {
    if (mapType.includes('land')) {
      return [
        { id: 'land_fahrt', name: 'Landstraßenfahrt', sub: 'Tốc độ 100 km/h', icon: '🌲', color: '#22c55e' },
        { id: 'land_kurve', name: 'Kurvenfahrt', sub: 'Khúc cua uốn lượn', icon: '〰️', color: '#16a34a' },
        { id: 'land_überholen', name: 'Überholvorgang', sub: 'Vượt xe an toàn', icon: '🔀', color: '#3b82f6' },
        { id: 'land_leitpfosten', name: 'Leitpfosten', sub: 'Cọc tiêu phản quang', icon: '📍', color: '#10b981' },
        { id: 'land_kreuzung', name: 'Kreuzung B2', sub: 'Nút giao đường tỉnh', icon: '🚥', color: '#f59e0b' }
      ];
    }
    if (mapType.includes('autobahn')) {
      return [
        { id: 'autobahn_fahrt', name: 'Autobahnfahrt', sub: 'Tốc độ 130+ km/h', icon: '🏎️', color: '#f59e0b' },
        { id: 'autobahn_auffahrt', name: 'Auffahrt', sub: 'Nhập làn cao tốc', icon: '⚡', color: '#ef4444' },
        { id: 'autobahn_spurwechsel', name: 'Spurwechsel', sub: 'Chuyển làn tốc độ cao', icon: '🔀', color: '#3b82f6' },
        { id: 'autobahn_standstreifen', name: 'Standstreifen', sub: 'Làn khẩn cấp StVO', icon: '🚨', color: '#a855f7' },
        { id: 'autobahn_beschilderung', name: 'Gantry Sign', sub: 'Biển báo long môn', icon: '🛣️', color: '#ec4899' }
      ];
    }
    return [
      { id: 'stadt_geradeaus', name: 'Stadtfahrt', sub: 'Đi trong thành phố', icon: '🟢', color: '#22c55e' },
      { id: 'stadt_ampel_01', name: 'Ampel', sub: 'Đèn giao thông', icon: '🚦', color: '#ef4444' },
      { id: 'stadt_mehrspurig', name: 'Spurwechsel', sub: 'Chuyển làn', icon: '🔀', color: '#3b82f6' },
      { id: 'stadt_rvl_01', name: 'Rechts vor Links', sub: 'Ưu tiên bên phải', icon: '⚠️', color: '#f59e0b' },
      { id: 'stadt_parkende', name: 'Parken', sub: 'Đỗ xe', icon: '🅿️', color: '#8b5cf6' },
      { id: 'stadt_fussgaenger', name: 'Fußgänger', sub: 'Người đi bộ', icon: '🚶', color: '#10b981' },
      { id: 'stadt_radfahrer', name: 'Fahrradfahrer', sub: 'Xe đạp', icon: '🚲', color: '#ec4899' }
    ];
  }, [mapType]);

  if (!isOpen) return null;

  // Tọa độ GPS SVG (World X -> svgX, World Z -> svgY = -Z)
  const svgX = playerX;
  const svgY = -playerZ;
  const headingDeg = 180 - (heading * 180 / Math.PI);

  const zonesList = mapHeaderInfo.zones;

  const handleZoneClick = (zone) => {
    setSelectedZoneId(zone.id);
    if (zone.teleport) {
      const targetSvgX = zone.teleport.x;
      const targetSvgY = -zone.teleport.z;

      const centerVx = targetSvgX - currentVw / 2;
      const centerVy = targetSvgY - currentVh / 2;

      const defaultVx = baseBox.vx + (baseBox.vw - currentVw) / 2;
      const defaultVy = baseBox.vy + (baseBox.vh - currentVh) / 2;

      setPan({
        x: centerVx - defaultVx,
        y: centerVy - defaultVy
      });

      setSpawnPing({ x: zone.teleport.x, z: zone.teleport.z, id: Date.now() });

      if (onTeleport) {
        onTeleport(zone.teleport.x, zone.teleport.z, zone.teleport.rot);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(7, 11, 20, 0.96)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      flexDirection: 'column',
      color: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      userSelect: 'none',
      overflow: 'hidden'
    }}>
      {/* ── 1. HEADER CHÍNH ──────────────────────────────────────────────── */}
      <div style={{
        height: '56px',
        padding: '0 20px',
        background: 'linear-gradient(90deg, #091322 0%, #0f1d32 100%)',
        borderBottom: '1.5px solid rgba(56, 189, 248, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            padding: '6px 10px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 0 16px rgba(37, 99, 235, 0.5)'
          }}>
            <Compass size={20} color="#ffffff" />
            <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.04em' }}>DEUTSCHLAND</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>
                {mapHeaderInfo.title}
              </span>
              <span style={{
                fontSize: 10,
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                padding: '2px 8px',
                borderRadius: 12,
                fontWeight: 700
              }}>
                {mapHeaderInfo.badge}
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {mapHeaderInfo.desc}
            </span>
          </div>
        </div>

        {/* GPS Live Telemetry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '4px 14px',
            borderRadius: 8,
            fontSize: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ color: '#94a3b8' }}>GPS:</span>
              <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 'bold' }}>
                X: {playerX.toFixed(1)}m | Z: {playerZ.toFixed(1)}m
              </span>
            </div>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gauge size={14} color="#f59e0b" />
              <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {Math.round(speed)} km/h
              </span>
            </div>
            {activeZone && (
              <>
                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />
                <span style={{ color: activeZone.color || '#38bdf8', fontWeight: 700 }}>
                  {activeZone.icon} {activeZone.nameVi}
                </span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            title="Đóng bản đồ (ESC)"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700
            }}
          >
            <X size={16} />
            <span>ĐÓNG</span>
          </button>
        </div>
      </div>

      {/* ── 2. KHUNG NỘI DUNG CHÍNH (3 CỘT: ZONES - VECTOR MAP - LEGEND & STATS) ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* CỘT TRÁI: DANH SÁCH CÁC KHU VỰC (ZONES) */}
        <div style={{
          width: '270px',
          background: 'rgba(11, 19, 34, 0.95)',
          borderRight: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10
        }}>
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
            background: 'rgba(15, 23, 42, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={16} color="#38bdf8" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  Khu vực (Zones)
                </span>
              </div>
              <span style={{ fontSize: 10, background: '#0284c7', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                {mapHeaderInfo.zonesCount} Zones
              </span>
            </div>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '4px 0 0 0' }}>
              Bấm vào từng khu vực để Dịch chuyển (Spawn) xe tới đó
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {zonesList.map(z => {
              const isSelected = selectedZoneId === z.id;
              const isCurrent = activeZone?.id === z.id;
              return (
                <div
                  key={z.id}
                  onClick={() => handleZoneClick(z)}
                  style={{
                    padding: '10px 12px',
                    marginBottom: 6,
                    borderRadius: 8,
                    background: isSelected 
                      ? `linear-gradient(135deg, ${z.color}28 0%, rgba(15, 23, 42, 0.9) 100%)`
                      : 'rgba(15, 23, 42, 0.5)',
                    border: isSelected ? `1.5px solid ${z.color}` : '1px solid rgba(148, 163, 184, 0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: 6,
                      background: `${z.color}25`,
                      border: `1px solid ${z.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 900,
                      color: z.color
                    }}>
                      {z.number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: isSelected ? '#ffffff' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {z.nameVi.replace(/^\d+\.\s*/, '')}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: 9, background: '#22c55e', color: '#000', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                            ĐANG Ở ĐÂY
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: z.color, opacity: 0.9, display: 'block', marginTop: 1 }}>
                        {z.nameDe}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: '6px 0 0 0', lineHeight: '1.3' }}>
                    {z.tipVi}
                  </p>
                  
                  {isSelected && (
                    <div style={{
                      marginTop: 8,
                      paddingTop: 6,
                      borderTop: `1px dashed ${z.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      color: z.color,
                      fontWeight: 700
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Zap size={11} /> Spawn / Dịch chuyển xe
                      </span>
                      <ChevronRight size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT GIỮA: BẢN ĐỒ VECTOR 2D CHI TIẾT (INTERACTIVE SVG MAP TỪ PBF THỰC TẾ) */}
        <div 
          style={{ flex: 1, position: 'relative', background: '#070c16', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'crosshair' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleSvgClick}
        >
          <svg
            ref={svgRef}
            viewBox={dynamicViewBox}
            style={{ width: '100%', height: '100%', display: 'block' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Pattern khu vực công viên */}
              <pattern id="parkGrassPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="16" height="16" fill="#064e3b" />
                <circle cx="4" cy="4" r="2" fill="#047857" opacity="0.6" />
                <circle cx="12" cy="12" r="2.5" fill="#10b981" opacity="0.4" />
              </pattern>
              {/* Gradient mặt nước sông Spree */}
              <linearGradient id="spreeWaterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0369a1" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>

            {/* 1. NỀN BẢN ĐỒ BASE — tự động theo bounds PBF */}
            <rect
              x={mapBounds.minX - PAD}
              y={-(mapBounds.maxZ + PAD)}
              width={(mapBounds.maxX - mapBounds.minX) + PAD * 2}
              height={(mapBounds.maxZ - mapBounds.minZ) + PAD * 2}
              fill="#070c16"
            />

            {/* Lưới tọa độ kiến trúc mỗi 250m — tự tính theo bounds thực */}
            <g stroke="#172338" strokeWidth="0.8" strokeDasharray="6,12">
              {gridLines.xs.map(gx => (
                <line key={`svg_gx_${gx}`} x1={gx} y1={-(mapBounds.maxZ + PAD)} x2={gx} y2={-(mapBounds.minZ - PAD)} />
              ))}
              {gridLines.zs.map(gz => (
                <line key={`svg_gz_${gz}`} x1={mapBounds.minX - PAD} y1={-gz} x2={mapBounds.maxX + PAD} y2={-gz} />
              ))}
            </g>

            {/* 2. CÔNG VIÊN & CÁC KHU VỰC CÂY XANH (PARKS FROM PBF THỰC TẾ) */}
            {/* Các công viên thực tế từ PBF (Lustgarten, Monbijoupark, Marx-Engels-Forum...) */}
            {targetRoadGraphData.parks?.map(park => {
              if (!park.points || park.points.length < 3) return null;
              const ptsStr = park.points.map(([x, z]) => `${x},${-z}`).join(' ');
              return (
                <polygon
                  key={park.id}
                  points={ptsStr}
                  fill="#064e3b"
                  stroke="#059669"
                  strokeWidth="1.2"
                  opacity="0.75"
                />
              );
            })}

            {/* 3. DÒNG SÔNG SPREE & KÊNH NƯỚC THỰC TẾ (REAL WATERWAYS FROM PBF) */}
            {targetRoadGraphData.waterways?.map(w => {
              if (!w.points || w.points.length < 2) return null;
              const ptsStr = w.points.map(([x, z]) => `${x},${-z}`).join(' ');
              if (w.isClosed) {
                return (
                  <polygon
                    key={w.id}
                    points={ptsStr}
                    fill="url(#spreeWaterGrad)"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />
                );
              }
              return (
                <g key={w.id}>
                  {/* Kè đá bảo vệ 2 bên bờ sông */}
                  <polyline
                    points={ptsStr}
                    stroke="#1e3a5f"
                    strokeWidth={w.width + 6}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Lòng sông Spree */}
                  <polyline
                    points={ptsStr}
                    stroke="url(#spreeWaterGrad)"
                    strokeWidth={w.width}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.95"
                  />
                  {/* Làn nước óng ánh tâm sông */}
                  <polyline
                    points={ptsStr}
                    stroke="#7dd3fc"
                    strokeWidth={Math.max(2, w.width * 0.18)}
                    strokeDasharray="24,16"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.6"
                  />
                </g>
              );
            })}

            {/* 4. ĐƯỜNG SẮT S-BAHN & RAY TRAM THỰC TẾ (REAL RAILWAYS FROM PBF) */}
            {targetRoadGraphData.railways?.map(r => {
              if (!r.points || r.points.length < 2) return null;
              const ptsStr = r.points.map(([x, z]) => `${x},${-z}`).join(' ');
              const isTram = r.railway === 'tram';
              return (
                <polyline
                  key={r.id}
                  points={ptsStr}
                  stroke={isTram ? '#ef4444' : '#f59e0b'}
                  strokeWidth={isTram ? 2.5 : 4.5}
                  strokeDasharray={isTram ? '8,4' : '12,6'}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
              );
            })}

            {/* 5. MẠNG LƯỚI ĐƯỜNG BỘ 100% TỪ OSM PBF (REAL ROAD NETWORK) */}
            
            {/* A. Đường phụ & ngõ dân cư (Residential / Living Streets) */}
            {residentialRoads.map(r => {
              if (!r.centerline || r.centerline.length < 2) return null;
              const ptsStr = r.centerline.map(([x, z]) => `${x},${-z}`).join(' ');
              return (
                <polyline
                  key={r.id}
                  points={ptsStr}
                  stroke="#172233"
                  strokeWidth={Math.max(7, r.width) * scaleFactor}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* B. Đường liên khu vực (Secondary & Tertiary) */}
            {secondaryRoads.map(r => {
              if (!r.centerline || r.centerline.length < 2) return null;
              const ptsStr = r.centerline.map(([x, z]) => `${x},${-z}`).join(' ');
              return (
                <g key={r.id}>
                  <polyline
                    points={ptsStr}
                    stroke="#334155"
                    strokeWidth={Math.max(10, r.width + 1.5) * scaleFactor}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points={ptsStr}
                    stroke="#1e293b"
                    strokeWidth={Math.max(9, r.width) * scaleFactor}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

            {/* C. Các trục đại lộ chính & Cao tốc Autobahn */}
            {primaryRoads.map(r => {
              if (!r.centerline || r.centerline.length < 2) return null;
              const ptsStr = r.centerline.map(([x, z]) => `${x},${-z}`).join(' ');
              const isMotorway = ['motorway', 'trunk'].includes(r.highway);
              return (
                <g key={r.id}>
                  {/* Vỉa hè / Gờ đường bảo vệ */}
                  <polyline
                    points={ptsStr}
                    stroke={isMotorway ? '#f59e0b' : '#475569'}
                    strokeWidth={Math.max(15, r.width + 3) * scaleFactor}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Lòng đường nhựa */}
                  <polyline
                    points={ptsStr}
                    stroke={isMotorway ? '#1e293b' : '#0f172a'}
                    strokeWidth={Math.max(13, r.width) * scaleFactor}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Vạch kẻ tim đường đứt quãng */}
                  <polyline
                    points={ptsStr}
                    stroke="#f8fafc"
                    strokeWidth={1.2 * scaleFactor}
                    strokeDasharray={`${8 * scaleFactor},${8 * scaleFactor}`}
                    fill="none"
                    opacity="0.8"
                  />
                </g>
              );
            })}

            {/* 6. GIAO LỘ & ĐÈN TÍN HIỆU GIAO THÔNG (REAL JUNCTIONS & TRAFFIC LIGHTS) */}
            {targetRoadGraphData.junctions?.map(j => {
              if (!j.polygon || j.polygon.length < 3) return null;
              const ptsStr = j.polygon.map(([x, z]) => `${x},${-z}`).join(' ');
              return (
                <polygon
                  key={j.id}
                  points={ptsStr}
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth={0.8 * scaleFactor}
                  opacity="0.9"
                />
              );
            })}

            {/* Đèn giao thông tại các nút giao có trafficSignal */}
            {targetRoadGraphData.junctions?.filter(j => j.hasTrafficLight).map(j => (
              <g key={`ampel_${j.id}`} transform={`translate(${j.center[0]}, ${-j.center[1]})`}>
                <circle cx="0" cy="0" r={5.5 * scaleFactor} fill="#0f172a" stroke="#eab308" strokeWidth={1.2 * scaleFactor} />
                <circle cx="0" cy="0" r={2.8 * scaleFactor} fill="#22c55e" />
              </g>
            ))}

            {/* 7. PHÂN KHU ĐÔ THỊ (ZONES 1 -> 7 CLICKABLE TELEPORT BOUNDARIES) */}
            {zonesList.map(z => {
              if (!z.bounds) return null;
              const isSelected = selectedZoneId === z.id;
              const isCurrent = activeZone?.id === z.id;
              const bWidth = z.bounds.maxX - z.bounds.minX;
              const bHeight = z.bounds.maxZ - z.bounds.minZ;
              const midX = (z.bounds.minX + z.bounds.maxX) / 2;
              const midY = -((z.bounds.minZ + z.bounds.maxZ) / 2);

              return (
                <g key={`zone_overlay_${z.id}`} onClick={() => handleZoneClick(z)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={z.bounds.minX}
                    y={-z.bounds.maxZ}
                    width={bWidth}
                    height={bHeight}
                    fill={isSelected ? `${z.color}22` : (isCurrent ? `${z.color}15` : 'rgba(15, 23, 42, 0.08)')}
                    stroke={z.color}
                    strokeWidth={isSelected ? 3 : 1.5}
                    strokeDasharray="10,8"
                    rx="8"
                  />
                  {/* Zone Tag Badge */}
                  <rect
                    x={midX - 75}
                    y={midY - 14}
                    width={150}
                    height={26}
                    fill="rgba(11, 19, 34, 0.9)"
                    stroke={z.color}
                    strokeWidth="1.2"
                    rx="6"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    fill={isSelected ? '#ffffff' : z.color}
                    fontSize="11"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    {z.icon} {z.nameVi.replace(/^\d+\.\s*/, '')}
                  </text>
                </g>
              );
            })}

            {/* 8. CÁC ĐỊA DANH NỔI TIẾNG (REAL LANDMARKS FROM PBF) */}
            {targetRoadGraphData.landmarks?.map(lm => {
              const lmY = -lm.z;
              return (
                <g key={`landmark_${lm.id}`} transform={`translate(${lm.x}, ${lmY}) scale(${scaleFactor})`}>
                  <rect
                    x="-70"
                    y="-13"
                    width="140"
                    height="24"
                    fill="rgba(15, 23, 42, 0.92)"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    rx="5"
                  />
                  <text
                    x="0"
                    y="3"
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight="900"
                    textAnchor="middle"
                  >
                    {lm.icon} {lm.name}
                  </text>
                </g>
              );
            })}

            {/* 9. RANH GIỚI KHÓA AN TOÀN (PERIMETER FENCE — dynamic from PBF bounds) */}
            <rect
              x={mapBounds.minX}
              y={-mapBounds.maxZ}
              width={mapBounds.maxX - mapBounds.minX}
              height={mapBounds.maxZ - mapBounds.minZ}
              fill="none"
              stroke="#ef4444"
              strokeWidth={3.5 * scaleFactor}
              strokeDasharray={`${16 * scaleFactor},${12 * scaleFactor}`}
            />
            <text
              x={(mapBounds.minX + mapBounds.maxX) / 2}
              y={-(mapBounds.maxZ + PAD * 0.4)}
              fill="#ef4444"
              fontSize={18 * scaleFactor}
              fontWeight="bold"
              textAnchor="middle"
            >
              🔒 RANH GIỚI BẢN ĐỒ (OSM PBF BOUNDARY)
            </text>

            {/* 9.5 DÒNG PHƯƠNG TIỆN GIAO THÔNG AI THỰC TẾ (LIVE StVO TRAFFIC FLOW) */}
            {trafficCars && trafficCars.map(tc => {
              const tSvgX = tc.x;
              const tSvgY = -tc.z;
              const tHeadingDeg = 180 - (tc.heading * 180 / Math.PI);
              const colorHex = typeof tc.color === 'number' 
                ? `#${tc.color.toString(16).padStart(6, '0')}` 
                : (tc.color || '#3b82f6');

              return (
                <g key={`overview_traffic_${tc.id}`} transform={`translate(${tSvgX}, ${tSvgY}) scale(${scaleFactor})`}>
                  {/* Quầng sáng xe AI */}
                  <circle cx="0" cy="0" r="14" fill={colorHex} opacity="0.25" />
                  {/* Thân xe xoay theo hướng di chuyển thật */}
                  <g transform={`rotate(${tHeadingDeg})`}>
                    <polygon points="0,-16 8,10 -8,10" fill={colorHex} stroke="#f8fafc" strokeWidth="1.5" />
                    <circle cx="0" cy="2" r="3" fill="#0f172a" />
                    {tc.isBraking && (
                      <circle cx="0" cy="11" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
                    )}
                  </g>
                </g>
              );
            })}

            {/* 10. XE CỦA BẠN TRÊN BẢN ĐỒ THỰC TẾ (PLAYER GPS CAR MARKER) */}
            <g transform={`translate(${svgX}, ${svgY}) scale(${scaleFactor})`}>
              {/* Sóng radar xung quanh xe */}
              <circle cx="0" cy="0" r="36" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" />
              <circle cx="0" cy="0" r="18" fill="rgba(56, 189, 248, 0.35)" />

              {/* Mũi tên định hướng xe xoay theo heading thật */}
              <g transform={`rotate(${headingDeg})`}>
                <polygon points="0,-22 11,14 -11,14" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                <circle cx="0" cy="3" r="4.5" fill="#0284c7" />
              </g>

              {/* Nhãn xe bạn */}
              <rect x="-38" y="24" width="76" height="18" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" rx="4" />
              <text x="0" y="37" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
                XE CỦA BẠN
              </text>
            </g>

            {/* 11. ĐIỂM SÓNG PHÁT THẤP CHO SPAWN TELEPORT (CLICK TO SPAWN ANIMATION PING) */}
            {spawnPing && (
              <g key={`spawn_ping_${spawnPing.id}`} transform={`translate(${spawnPing.x}, ${-spawnPing.z}) scale(${scaleFactor})`}>
                <circle cx="0" cy="0" r="28" fill="none" stroke="#ef4444" strokeWidth="2.5" opacity="0.9">
                  <animate attributeName="r" values="10;45" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                <rect x="-45" y="-36" width="90" height="18" fill="#ef4444" rx="4" />
                <text x="0" y="-24" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
                  📍 VỊ TRÍ SPAWN
                </text>
              </g>
            )}

            {/* La bàn hướng Bắc (Compass) — góc trên trái theo bounds động */}
            <g transform={`translate(${mapBounds.minX + PAD * 1.5}, ${-(mapBounds.maxZ + PAD * 0.7)}) scale(${scaleFactor})`}>
              <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <polygon points="0,-22 8,0 -8,0" fill="#ef4444" />
              <polygon points="0,22 8,0 -8,0" fill="#e2e8f0" />
              <text x="0" y="-25" fill="#f8fafc" fontSize="12" fontWeight="bold" textAnchor="middle">N</text>
              <text x="0" y="34" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">S</text>
              <text x="32" y="4" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">E</text>
              <text x="-32" y="4" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">W</text>
            </g>
          </svg>

          {/* FLOATING MAP CONTROL TOOLBAR (ZOOM IN, ZOOM OUT, RESET, DRAG / CLICK GUIDANCE) */}
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
            pointerEvents: 'none'
          }}>
            {/* Zoom Control Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: 10,
              padding: '4px 6px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              pointerEvents: 'auto'
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                title="Phóng to (Zoom In)"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  borderRadius: 6,
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                <ZoomIn size={18} />
              </button>

              <span style={{ fontSize: 11, fontWeight: 900, color: '#f8fafc', padding: '0 8px', minWidth: 42, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                title="Thu nhỏ (Zoom Out)"
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  borderRadius: 6,
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ZoomOut size={18} />
              </button>

              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />

              <button
                onClick={(e) => { e.stopPropagation(); handleResetView(); }}
                title="Đặt lại toàn cảnh (Reset View)"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  borderRadius: 6,
                  padding: '0 8px', height: 32,
                  display: 'flex', alignItems: 'center', gap: 4,
                  cursor: 'pointer',
                  fontSize: 11, fontWeight: 700
                }}
              >
                <Maximize2 size={14} />
                <span>Toàn Cảnh</span>
              </button>
            </div>

            {/* Hướng dẫn thao tác Zoom / Pan / Click Spawn */}
            <div style={{
              background: 'rgba(11, 19, 34, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 10,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
            }}>
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>💡 HD:</span>
              <span>Cuộn chuột / Drag để Zoom &amp; Pan | <b>Click lên đường để chọn vị trí Spawn xe</b></span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: CHÚ THÍCH (LEGEND) & THÔNG SỐ MAP */}
        <div style={{
          width: '270px',
          background: 'rgba(11, 19, 34, 0.95)',
          borderLeft: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          overflowY: 'auto'
        }}>
          {/* CHÚ THÍCH (LEGEND) */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(56, 189, 248, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Info size={16} color="#38bdf8" />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
                Chú thích (Legend)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 10px', fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#22c55e', fontSize: 12 }}>🟢</span>
                <span style={{ color: '#cbd5e1' }}>Điểm xuất phát</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#38bdf8', fontSize: 12 }}>↔️</span>
                <span style={{ color: '#cbd5e1' }}>Tuyến đường</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🚦</span>
                <span style={{ color: '#cbd5e1' }}>Đèn giao thông</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🚶</span>
                <span style={{ color: '#cbd5e1' }}>Vạch qua đường</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🚌</span>
                <span style={{ color: '#cbd5e1' }}>Trạm xe buýt</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🚊</span>
                <span style={{ color: '#cbd5e1' }}>Trạm tram</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🚲</span>
                <span style={{ color: '#cbd5e1' }}>Làn xe đạp</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🅿️</span>
                <span style={{ color: '#cbd5e1' }}>Bãi đỗ xe</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>⚠️</span>
                <span style={{ color: '#cbd5e1' }}>Biển báo StVO</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>🔴</span>
                <span style={{ color: '#cbd5e1' }}>50 / 30 Tốc độ</span>
              </div>
            </div>

            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 10, color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 14, height: 4, background: '#0f172a', border: '1px solid #475569', display: 'inline-block' }} />
                <span>Đường chính (50 km/h)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 14, height: 4, background: '#1e293b', border: '1px dashed #34d399', display: 'inline-block' }} />
                <span>Đường phụ / Phố 30-Zone</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 14, height: 4, background: '#f59e0b', display: 'inline-block' }} />
                <span>Đường sắt (S-Bahn/U-Bahn)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 4, background: '#0284c7', display: 'inline-block' }} />
                <span>Sông Spree &amp; Kênh nước</span>
              </div>
            </div>
          </div>

          {/* THÔNG SỐ MAP (DỮ LIỆU THỰC TẾ TỪ PBF) */}
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CheckCircle2 size={16} color="#22c55e" />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
                Thông số map (Thực tế OSM PBF)
              </span>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 11,
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>• Kích thước khu vực:</span>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                  {((mapBounds.maxX - mapBounds.minX) / 1000).toFixed(1)} x {((mapBounds.maxZ - mapBounds.minZ) / 1000).toFixed(1)} km
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>• Đoạn đường OSM:</span>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{(targetRoadGraphData.roads?.length || targetRoadGraphData.metadata?.roadCount || 0).toLocaleString()} đoạn</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>• Giao lộ thực tế:</span>
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{(targetRoadGraphData.junctions?.length || targetRoadGraphData.metadata?.junctionCount || 0).toLocaleString()} giao lộ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>• Dòng sông / Thủy văn:</span>
                <span style={{ color: '#0284c7', fontWeight: 'bold' }}>{(targetRoadGraphData.waterways?.length || targetRoadGraphData.metadata?.waterwayCount || 0).toLocaleString()} nhánh &amp; kênh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>• Tuyến đường sắt/Tram:</span>
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{(targetRoadGraphData.railways?.length || targetRoadGraphData.metadata?.railwayCount || 0).toLocaleString()} tuyến</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>• Công viên &amp; Cây xanh:</span>
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{(targetRoadGraphData.parks?.length || targetRoadGraphData.metadata?.parkCount || 0).toLocaleString()} khu vực</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>• Địa danh nổi tiếng:</span>
                <span style={{ color: '#ec4899', fontWeight: 'bold' }}>{(targetRoadGraphData.landmarks?.length || targetRoadGraphData.metadata?.landmarkCount || 0).toLocaleString()} Landmarks</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '2px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: '#64748b' }}>Hệ tọa độ:</span>
                <span style={{ color: '#cbd5e1' }}>WGS84 ➔ Flat Metric 1:1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: '#64748b' }}>Nguồn dữ liệu:</span>
                <span style={{ color: '#38bdf8' }}>planet_*.osm.pbf</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. THANH ĐÁY: CÁC KỊCH BẢN LÁI XE (SCENARIOS) ────────────────── */}
      <div style={{
        height: '76px',
        padding: '0 16px',
        background: 'linear-gradient(90deg, #091322 0%, #0f1d32 100%)',
        borderTop: '1.5px solid rgba(56, 189, 248, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '170px' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc' }}>
            Kịch bản lái xe
          </span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>
            Scenarios luyện tập StVO
          </span>
        </div>

        {/* 7 Nút kịch bản theo ảnh */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
          {scenariosList.map(sc => (
            <button
              key={sc.id}
              onClick={() => {
                if (onSelectExercise) onSelectExercise(sc.id);
                onClose();
              }}
              style={{
                flex: 1,
                minWidth: '110px',
                padding: '7px 10px',
                borderRadius: 8,
                background: 'rgba(15, 23, 42, 0.85)',
                border: `1px solid ${sc.color}55`,
                color: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = sc.color;
                e.currentTarget.style.background = `${sc.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${sc.color}55`;
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
              }}
            >
              <span style={{ fontSize: 18 }}>{sc.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sc.name}
                </span>
                <span style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sc.sub}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Slogan */}
        <div style={{
          paddingLeft: 12,
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          minWidth: '130px'
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#38bdf8' }}>
            {mapType.includes('land') ? 'Landstraße B2' : mapType.includes('autobahn') ? 'Autobahn A2' : 'Berlin-Mitte'}
          </span>
          <span style={{ fontSize: 10, fontStyle: 'italic', color: '#94a3b8' }}>Fahren. Lernen. Sicher.</span>
        </div>
      </div>
    </div>
  );
});
