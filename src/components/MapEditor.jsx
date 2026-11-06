import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, Trash2, RotateCcw, Play, Copy, Sliders, Check, Navigation, ArrowRight } from 'lucide-react';
import {
  BERLIN_MITTE_REAL_OSM_PRESET,
  BERLIN_MITTE_GRAND_MAP_PRESET,
  SA_HINH_FAHRSCHULE_PRESET,
  BERLIN_MITTE_MODES
} from '../simulation/data/berlinMitteMapPreset.js';

// ── 1. ĐỊNH NGHĨA CÁC DANH MỤC PHẦN TỬ (MAP EDITOR 2.0) ──────────────
export const ELEMENT_CATEGORIES = [
  { id: 'ROADS', label: 'Đường Phố', icon: '🛣️' },
  { id: 'JUNCTIONS', label: 'Nút Giao', icon: '✚' },
  { id: 'MARKINGS', label: 'Vạch Kẻ Đường', icon: '➖' },
  { id: 'SIGNS', label: 'Biển & Đèn', icon: '🚦' },
  { id: 'OBJECTS', label: 'Đô Thị', icon: '🏛️' }
];

// Các phần tử mẫu phong phú theo chuẩn StVO Đức & Berlin-Mitte
export const MAP_ELEMENTS = [
  // ── NHÓM 1: ĐƯỜNG PHỐ (ROADS) ──
  {
    id: 'road_avenue', category: 'ROADS', name: 'Đại Lộ 4 Làn (Unter den Linden/Torstr)', icon: '🛣️', color: '#1e293b',
    width: 18, height: 60, length: 60, type: 'ROAD_STRAIGHT', lanes: 4, speedLimit: 50,
    bicycleLane: true, hasTram: true, roadType: 'avenue', sidewalk: true, oneWay: false
  },
  {
    id: 'road_standard', category: 'ROADS', name: 'Đường 2 Làn (Friedrichstr)', icon: '🛣️', color: '#1c2026',
    width: 14, height: 50, length: 50, type: 'ROAD_STRAIGHT', lanes: 2, speedLimit: 50,
    bicycleLane: true, hasTram: false, roadType: 'asphalt', sidewalk: true, oneWay: false
  },
  {
    id: 'road_bike', category: 'ROADS', name: 'Phố Xe Đạp (Linienstr 30)', icon: '🚲', color: '#064e3b',
    width: 10, height: 40, length: 40, type: 'ROAD_STRAIGHT', lanes: 2, speedLimit: 30,
    bicycleLane: true, hasTram: false, roadType: 'residential', sidewalk: true, oneWay: false
  },
  {
    id: 'road_cobble', category: 'ROADS', name: 'Phố Cổ Đá Cuội (Scheunenviertel)', icon: '🧱', color: '#451a03',
    width: 10, height: 35, length: 35, type: 'ROAD_STRAIGHT', lanes: 2, speedLimit: 30,
    bicycleLane: false, hasTram: false, roadType: 'cobblestone', sidewalk: true, oneWay: false
  },
  {
    id: 'road_curve', category: 'ROADS', name: 'Khúc Cua 90°', icon: '↪️', color: '#1c2026',
    width: 24, height: 24, type: 'ROAD_CURVE_90'
  },
  {
    id: 'road_s_curve', category: 'ROADS', name: 'Cua Chữ S (Slalom)', icon: '〰️', color: '#1c2026',
    width: 14, height: 40, type: 'ROAD_S_CURVE'
  },
  {
    id: 'hill_ramp', category: 'ROADS', name: 'Dốc Đề-pa 10%', icon: '📐', color: '#334155',
    width: 8, height: 36, type: 'HILL_RAMP'
  },

  // ── NHÓM 2: NÚT GIAO THÔNG (JUNCTIONS) ──
  {
    id: 'junction_ampel', category: 'JUNCTIONS', name: 'Giao Lộ Đèn Tín Hiệu (Ampel)', icon: '🚥', color: '#0f172a',
    width: 18, height: 18, type: 'JUNCTION_AMPEL', junctionType: 'ampel', hasTrafficLight: true, priorityRule: 'ampel'
  },
  {
    id: 'junction_4way', category: 'JUNCTIONS', name: 'Ngã Tư 4 Hướng (Kreuzung)', icon: '✚', color: '#1c2026',
    width: 16, height: 16, type: 'INTERSECTION_4WAY', junctionType: '4way', priorityRule: 'rechts_vor_links'
  },
  {
    id: 'junction_t', category: 'JUNCTIONS', name: 'Ngã Ba Chữ T (Einmündung)', icon: 'T', color: '#1c2026',
    width: 14, height: 14, type: 'INTERSECTION_3WAY', junctionType: '3way', priorityRule: 'rechts_vor_links'
  },
  {
    id: 'roundabout', category: 'JUNCTIONS', name: 'Vòng Xuyến Kreisverkehr (Z. 215)', icon: '🔄', color: '#1e293b',
    width: 32, height: 32, type: 'ROUNDABOUT_4WAY', junctionType: 'roundabout'
  },

  // ── NHÓM 3: VẠCH KẺ ĐƯỜNG (MARKINGS) ──
  {
    id: 'stop_line', category: 'MARKINGS', name: 'Vạch Dừng Haltelinie (StVO Z. 294)', icon: '🛑', color: '#ffffff',
    width: 7, height: 1, length: 1, type: 'STOP_LINE'
  },
  {
    id: 'zebra', category: 'MARKINGS', name: 'Vạch Đi Bộ (Zebrastreifen Z. 293)', icon: '🚶', color: '#ffffff',
    width: 14, height: 4, length: 4, type: 'ZEBRA'
  },
  {
    id: 'arrow_straight', category: 'MARKINGS', name: 'Mũi Tên Đi Thẳng (Z. 297)', icon: '⬆️', color: '#ffffff',
    width: 2, height: 5, length: 5, type: 'ARROW_STRAIGHT'
  },
  {
    id: 'arrow_left', category: 'MARKINGS', name: 'Mũi Tên Rẽ Trái (Z. 297)', icon: '↖️', color: '#ffffff',
    width: 3, height: 5, length: 5, type: 'ARROW_LEFT'
  },
  {
    id: 'arrow_right', category: 'MARKINGS', name: 'Mũi Tên Rẽ Phải (Z. 297)', icon: '↗️', color: '#ffffff',
    width: 3, height: 5, length: 5, type: 'ARROW_RIGHT'
  },

  // ── NHÓM 4: BIỂN BÁO & ĐÈN TÍN HIỆU (SIGNS & LIGHTS) ──
  {
    id: 'traffic_light', category: 'SIGNS', name: 'Cột Đèn Tín Hiệu StVO § 37', icon: '🚥', color: '#0f172a',
    width: 2, height: 2, type: 'TRAFFIC_LIGHT'
  },
  {
    id: 'sign_speed_30', category: 'SIGNS', name: 'Biển Tốc Độ 30 km/h (Z. 274)', icon: '3️⃣0️⃣', color: '#ef4444',
    width: 2, height: 4, type: 'SIGN', signType: 'SPEED_LIMIT', value: 30
  },
  {
    id: 'sign_speed_50', category: 'SIGNS', name: 'Biển Tốc Độ 50 km/h (Z. 274)', icon: '5️⃣0️⃣', color: '#ef4444',
    width: 2, height: 4, type: 'SIGN', signType: 'SPEED_LIMIT', value: 50
  },
  {
    id: 'sign_speed_70', category: 'SIGNS', name: 'Biển Tốc Độ 70 km/h (Z. 274)', icon: '7️⃣0️⃣', color: '#ef4444',
    width: 2, height: 4, type: 'SIGN', signType: 'SPEED_LIMIT', value: 70
  },
  {
    id: 'sign_speed_100', category: 'SIGNS', name: 'Biển Tốc Độ 100 km/h (Z. 274)', icon: '🔟0️⃣', color: '#ef4444',
    width: 2, height: 4, type: 'SIGN', signType: 'SPEED_LIMIT', value: 100
  },
  {
    id: 'sign_stop', category: 'SIGNS', name: 'Biển Dừng Lại (STOP Z. 206)', icon: '🛑', color: '#dc2626',
    width: 2, height: 4, type: 'SIGN', signType: 'STOP'
  },
  {
    id: 'sign_priority', category: 'SIGNS', name: 'Biển Đường Ưu Tiên (Z. 306)', icon: '🔶', color: '#fbbf24',
    width: 2, height: 4, type: 'SIGN', signType: 'PRIORITY'
  },
  {
    id: 'sign_yield', category: 'SIGNS', name: 'Biển Nhường Đường (Z. 205)', icon: '🔻', color: '#dc2626',
    width: 2, height: 4, type: 'SIGN', signType: 'YIELD'
  },
  {
    id: 'sign_no_entry', category: 'SIGNS', name: 'Biển Cấm Đi Vào (Z. 267)', icon: '⛔', color: '#dc2626',
    width: 2, height: 4, type: 'SIGN', signType: 'NO_ENTRY'
  },
  {
    id: 'sign_oneway', category: 'SIGNS', name: 'Biển Đường Một Chiều (Z. 220)', icon: '➡️', color: '#0284c7',
    width: 2, height: 4, type: 'SIGN', signType: 'ONEWAY'
  },
  {
    id: 'spawn_point', category: 'SIGNS', name: 'Điểm Xuất Phát Xe (Spawn)', icon: '📍', color: '#2563EB',
    width: 3, height: 5, type: 'SPAWN_POINT'
  },

  // ── NHÓM 5: ĐÔ THỊ & CÔNG TRÌNH (CITY OBJECTS) ──
  {
    id: 'landmark_brandenburg', category: 'OBJECTS', name: 'Cổng Brandenburger Tor', icon: '🏛️', color: '#78716c',
    width: 30, height: 12, type: 'BRANDENBURGER_TOR'
  },
  {
    id: 'tram_stop', category: 'OBJECTS', name: 'Trạm Tàu Điện (Straßenbahn)', icon: '🚋', color: '#991b1b',
    width: 4, height: 20, type: 'TRAM_STOP'
  },
  {
    id: 'bus_stop', category: 'OBJECTS', name: 'Trạm Xe Buýt BVG', icon: '🚏', color: '#854d0e',
    width: 4, height: 12, type: 'BUS_STOP'
  },
  {
    id: 'parked_car', category: 'OBJECTS', name: 'Hàng Xe Ô Tô Đỗ Bên Đường', icon: '🚗', color: '#1e40af',
    width: 3, height: 18, type: 'PARKED_CAR'
  },
  {
    id: 'construction', category: 'OBJECTS', name: 'Rào Chắn Công Trường', icon: '🚧', color: '#c2410c',
    width: 6, height: 12, type: 'CONSTRUCTION'
  },
  {
    id: 'building_altbau', category: 'OBJECTS', name: 'Dãy Nhà Phố Altbau Berlin', icon: '🏢', color: '#475569',
    width: 24, height: 16, type: 'BUILDING'
  },
  {
    id: 'building_shop', category: 'OBJECTS', name: 'Cửa Hàng / Quán Café', icon: '🏪', color: '#64748b',
    width: 14, height: 12, type: 'SHOP'
  },
  {
    id: 'parking_bay', category: 'OBJECTS', name: 'Bãi Đỗ Xe Lề Đường', icon: '🅿️', color: '#334155',
    width: 8, height: 25, type: 'PARKING_BAY'
  },
  {
    id: 'tree', category: 'OBJECTS', name: 'Cây Xanh / Tiergarten', icon: '🌳', color: '#15803d',
    width: 3, height: 5, type: 'TREE'
  },
  {
    id: 'promenade', category: 'OBJECTS', name: 'Lối Đi Bộ Giữa Đường (Linden Promenade)', icon: '🌳', color: '#2d3748',
    width: 14, height: 60, type: 'PROMENADE'
  },
  {
    id: 'park_lawn', category: 'OBJECTS', name: 'Công Viên Xanh (Park / Grünanlage)', icon: '🌲', color: '#14532d',
    width: 30, height: 30, type: 'PARK'
  }
];

const GRID_SIZE = 10; // 1 mét = 10 pixels trên canvas
const SNAP_THRESHOLD = 25;

const normalizeRotation = (rotation = 0) => {
  const numeric = Number(rotation);
  if (!Number.isFinite(numeric)) return 0;
  return ((numeric % 360) + 360) % 360;
};

const getElementDimensionsPx = (element) => {
  const w = Number(element?.width) || 10;
  const h = Number(element?.height ?? element?.length) || 10;

  return {
    width: w * GRID_SIZE,
    height: h * GRID_SIZE,
  };
};

// Rotate an arbitrary point around a center. This is used by the editor
// itself so arbitrary angles (e.g. 17°, 37.5°, 123°) behave exactly like
// the CSS transform instead of relying on special cases for 90°/180°.
const rotatePoint = (x, y, centerX, centerY, degrees) => {
  const rad = (normalizeRotation(degrees) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - centerX;
  const dy = y - centerY;

  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos,
  };
};

const getElementCenterPx = (element, widthPx = null, heightPx = null) => {
  const dims = widthPx !== null && heightPx !== null
    ? { width: widthPx, height: heightPx }
    : getElementDimensionsPx(element);

  return {
    x: element.x + dims.width / 2,
    y: element.y + dims.height / 2,
  };
};

// Eight snap/connect points around the actual rotated rectangle.
const getElementConnectors = (element) => {
  const { width, height } = getElementDimensionsPx(element);
  const center = getElementCenterPx(element, width, height);
  const localPoints = [
    { x: element.x, y: element.y },
    { x: element.x + width / 2, y: element.y },
    { x: element.x + width, y: element.y },
    { x: element.x + width, y: element.y + height / 2 },
    { x: element.x + width, y: element.y + height },
    { x: element.x + width / 2, y: element.y + height },
    { x: element.x, y: element.y + height },
    { x: element.x, y: element.y + height / 2 },
  ];

  return localPoints.map(point => rotatePoint(
    point.x,
    point.y,
    center.x,
    center.y,
    element.rotation || 0
  ));
};

const pointInElement = (pointX, pointY, element) => {
  const { width, height } = getElementDimensionsPx(element);
  const center = getElementCenterPx(element, width, height);
  const unrotated = rotatePoint(
    pointX,
    pointY,
    center.x,
    center.y,
    -(element.rotation || 0)
  );

  return (
    unrotated.x >= element.x &&
    unrotated.x <= element.x + width &&
    unrotated.y >= element.y &&
    unrotated.y <= element.y + height
  );
};

export const MapEditor = ({ onSave, onLoad }) => {
  const navigate = useNavigate();
  const [mapElements, setMapElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ROADS');
  const [snapGridMeters, setSnapGridMeters] = useState(5); // Snap 5m chuẩn
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const [activeMode, setActiveMode] = useState('free_drive'); // 'free_drive' | 'pruefung'
  const [rotationStep, setRotationStep] = useState(15); // arbitrary-angle rotation step

  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // ── 2. SMART CONNECTOR & AUTO-ATTACH (HÚT NỐI ĐẦU ĐƯỜNG) ────────────
  const findNearestConnector = useCallback((
    elementX, elementY, elementWidth, elementHeight, existingElements, rotation = 0
  ) => {
    let nearestConnector = null;
    let minDistance = SNAP_THRESHOLD;

    const candidate = {
      x: elementX,
      y: elementY,
      width: elementWidth || 10,
      height: elementHeight || 10,
      rotation: normalizeRotation(rotation),
    };

    const newConnectors = getElementConnectors(candidate);

    existingElements.forEach(el => {
      const existingConnectors = getElementConnectors(el).map(point => ({
        ...point,
        id: el.id,
      }));

      existingConnectors.forEach(conn => {
        newConnectors.forEach(newConn => {
          const dist = Math.hypot(conn.x - newConn.x, conn.y - newConn.y);
          if (dist < minDistance) {
            minDistance = dist;
            nearestConnector = {
              targetId: conn.id,
              targetX: conn.x,
              targetY: conn.y,
              offsetX: conn.x - newConn.x,
              offsetY: conn.y - newConn.y,
            };
          }
        });
      });
    });

    return nearestConnector;
  }, []);

  // Bắt đầu kéo phần tử trên canvas
  const handleMouseDown = useCallback((e, element) => {
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

    setIsDragging(true);
    dragStartPosRef.current = { x, y };
    dragRef.current = element;
    setSelectedElement(element);
  }, [zoomLevel]);

  // Di chuyển chuột khi kéo (Áp dụng Snap 5m & Auto-Attach)
  const handleMouseMove = useCallback((e) => {
    const currentDragged = dragRef.current;
    if (!currentDragged) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

    const dx = x - dragStartPosRef.current.x;
    const dy = y - dragStartPosRef.current.y;

    let newX = currentDragged.x + dx;
    let newY = currentDragged.y + dy;

    // Smart Snap to Grid (5m = 50px hoặc 10m = 100px)
    const snapPx = snapGridMeters * GRID_SIZE;
    newX = Math.round(newX / snapPx) * snapPx;
    newY = Math.round(newY / snapPx) * snapPx;

    // Auto-attach khi kéo gần cổng kết nối đường hoặc giao lộ
    const otherElements = mapElements.filter(el => el.id !== currentDragged.id);
    const connector = findNearestConnector(
      newX, newY, currentDragged.width, currentDragged.height,
      otherElements, currentDragged.rotation
    );

    let attachedConnections = currentDragged.connectedTo || [];
    if (connector) {
      newX += connector.offsetX;
      newY += connector.offsetY;
      if (connector.targetId && !attachedConnections.includes(connector.targetId)) {
        attachedConnections = [...attachedConnections, connector.targetId];
      }
    }

    setMapElements(prev => prev.map(el =>
      el.id === currentDragged.id ? { ...el, x: newX, y: newY, connectedTo: attachedConnections } : el
    ));
    setSelectedElement(prev => prev ? { ...prev, x: newX, y: newY, connectedTo: attachedConnections } : null);
  }, [zoomLevel, snapGridMeters, mapElements, findNearestConnector]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      const moveHandler = (e) => handleMouseMove(e);
      const upHandler = () => handleMouseUp();
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', upHandler);
      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', upHandler);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);


  // Zoom controls
  const handleZoomIn = useCallback(() => setZoomLevel(prev => Math.min(prev + 0.15, 3)), []);
  const handleZoomOut = useCallback(() => setZoomLevel(prev => Math.max(prev - 0.15, 0.2)), []);
  const handleZoomReset = useCallback(() => setZoomLevel(0.5), []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoomLevel(prev => Math.max(0.2, Math.min(3, prev + delta)));
  }, []);

  // Kéo từ Palette thả vào Canvas
  const handleDragStart = useCallback((e, element) => {
    e.dataTransfer.setData('application/json', JSON.stringify(element));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

    const dataTransferData = e.dataTransfer.getData('application/json');
    if (!dataTransferData) return;

    let paletteElement;
    try {
      paletteElement = JSON.parse(dataTransferData);
    } catch {
      return;
    }

    const snapPx = snapGridMeters * GRID_SIZE;
    let snappedX = Math.round(x / snapPx) * snapPx;
    let snappedY = Math.round(y / snapPx) * snapPx;

    // Hút vào connector nếu gần
    const connector = findNearestConnector(snappedX, snappedY, paletteElement.width, paletteElement.height, mapElements);
    let connectedTo = [];
    if (connector) {
      snappedX += connector.offsetX;
      snappedY += connector.offsetY;
      if (connector.targetId) connectedTo.push(connector.targetId);
    }

    const newElement = {
      ...paletteElement,
      id: `${paletteElement.id}_${Date.now()}`,
      x: snappedX,
      y: snappedY,
      rotation: 0,
      connectedTo
    };

    setMapElements(prev => [...prev, newElement]);
    setSelectedElement(newElement);
  }, [zoomLevel, snapGridMeters, mapElements, findNearestConnector]);

  // Arbitrary-angle rotation. The old editor only supported fixed 90° turns;
  // now every element can be rotated by any degree and the same value is
  // persisted to JSON and used by snapping/hit-testing/rendering.
  const handleRotateElement = useCallback((element, delta = rotationStep) => {
    if (!element) return;
    const numericDelta = Number(delta);
    const safeDelta = Number.isFinite(numericDelta) ? numericDelta : 0;
    const nextRotation = normalizeRotation((element.rotation || 0) + safeDelta);

    setMapElements(prev => prev.map(el => (
      el.id === element.id ? { ...el, rotation: nextRotation } : el
    )));
    setSelectedElement(prev => prev ? { ...prev, rotation: nextRotation } : null);
  }, [rotationStep]);

  // Xóa phần tử
  const handleDeleteElement = useCallback((id) => {
    setMapElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null);
  }, []);

  // Nhân bản phần tử (Duplicate)
  const handleDuplicateElement = useCallback((element) => {
    if (!element) return;
    const snapPx = snapGridMeters * GRID_SIZE;
    const duplicated = {
      ...element,
      id: `${element.id}_copy_${Date.now()}`,
      rotation: normalizeRotation(element.rotation || 0),
      x: element.x + snapPx,
      y: element.y + snapPx
    };
    setMapElements(prev => [...prev, duplicated]);
    setSelectedElement(duplicated);
  }, [snapGridMeters]);

  // Cập nhật thuộc tính của phần tử được chọn
  const handleUpdateSelectedProperty = useCallback((key, value) => {
    if (!selectedElement) return;
    setMapElements(prev => prev.map(el => {
      if (el.id === selectedElement.id) {
        const updated = { ...el, [key]: value };
        if (key === 'length') updated.height = value;
        return updated;
      }
      return el;
    }));
    setSelectedElement(prev => {
      const updated = { ...prev, [key]: value };
      if (key === 'length') updated.height = value;
      return updated;
    });
  }, [selectedElement]);

  const handleSetRotation = useCallback((value) => {
    if (!selectedElement) return;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;
    const nextRotation = normalizeRotation(numericValue);
    handleUpdateSelectedProperty('rotation', nextRotation);
  }, [selectedElement, handleUpdateSelectedProperty]);

  // Keyboard shortcuts for arbitrary rotation while an element is selected.
  // [ and ] rotate by the currently selected step; Shift makes it finer (1°).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!selectedElement) return;
      const target = e.target;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT' || target?.isContentEditable) {
        return;
      }

      if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        const delta = e.shiftKey ? 1 : rotationStep;
        handleRotateElement(selectedElement, e.key === ']' ? delta : -delta);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedElement, rotationStep, handleRotateElement]);
  // ── 2.5 HÀM GẮN NHANH VẬT THỂ & VẠCH ĐƯỜNG (QUICK ATTACH) ──────────
  const handleAddAttachedElement = useCallback((kind) => {
    if (!selectedElement) return;

    const roadW = Number(selectedElement.width || 14);
    const roadH = Number(selectedElement.height || selectedElement.length || 40);
    const roadRot = normalizeRotation(selectedElement.rotation || 0);
    const roadCenter = getElementCenterPx(selectedElement);
    const id = `${kind.toLowerCase()}_${Date.now()}`;

    // Offsets are defined in the road's local coordinate system and then
    // rotated with the road. This keeps attached signs/markings aligned even
    // when the parent road is rotated by an arbitrary angle.
    const localPoint = (localX, localY) => {
      const point = {
        x: selectedElement.x + localX * GRID_SIZE,
        y: selectedElement.y + localY * GRID_SIZE,
      };
      return rotatePoint(point.x, point.y, roadCenter.x, roadCenter.y, roadRot);
    };

    let newEl = null;
    if (kind === 'STOP_LINE') {
      const pos = localPoint(0, Math.max(0, roadH - 2));
      newEl = {
        id, category: 'MARKINGS', type: 'STOP_LINE',
        name: `Vạch Dừng Haltelinie (${selectedElement.name || 'Đường'})`,
        x: pos.x, y: pos.y, width: roadW, height: 1, length: 1,
        rotation: roadRot, color: '#ffffff', icon: '🛑'
      };
    } else if (kind === 'TRAFFIC_LIGHT') {
      const pos = localPoint(roadW + 1, Math.max(0, roadH - 2));
      newEl = {
        id, category: 'SIGNS', type: 'TRAFFIC_LIGHT',
        name: `Cột Đèn StVO (${selectedElement.name || 'Đường'})`,
        x: pos.x, y: pos.y, width: 2, height: 2,
        rotation: roadRot, color: '#0f172a', icon: '🚥'
      };
    } else if (kind === 'ZEBRA') {
      const pos = localPoint(0, Math.max(0, roadH - 6));
      newEl = {
        id, category: 'MARKINGS', type: 'ZEBRA',
        name: `Vạch Đi Bộ Zebrastreifen (${selectedElement.name || 'Đường'})`,
        x: pos.x, y: pos.y, width: roadW, height: 4, length: 4,
        rotation: roadRot, color: '#ffffff', icon: '🚶'
      };
    } else if (kind === 'SIGN_30' || kind === 'SIGN_50') {
      const speedVal = kind === 'SIGN_30' ? 30 : 50;
      const pos = localPoint(roadW + 1, 5);
      newEl = {
        id, category: 'SIGNS', type: 'SIGN',
        name: `Biển ${speedVal} km/h (${selectedElement.name || 'Đường'})`,
        signType: 'SPEED_LIMIT', value: speedVal,
        x: pos.x, y: pos.y, width: 2, height: 4,
        rotation: roadRot, color: '#ef4444', icon: '🚦'
      };
    }

    if (newEl) {
      setMapElements(prev => [...prev, newEl]);
      setSelectedElement(newEl);
    }
  }, [selectedElement]);

  const handleAutoEquipJunction = useCallback((junction) => {
    if (!junction) return;
    const jX = junction.x;
    const jY = junction.y;
    const jW = (junction.width || 16) * GRID_SIZE;
    const jH = (junction.height || 16) * GRID_SIZE;
    const now = Date.now();

    const tls = [
      { id: `tl_tr_${now}`, type: 'TRAFFIC_LIGHT', category: 'SIGNS', name: 'Đèn Tín Hiệu (Đông Bắc)', x: jX + jW + 10, y: jY - 10, width: 2, height: 2, rotation: 0, color: '#0f172a', icon: '🚥' },
      { id: `tl_tl_${now}`, type: 'TRAFFIC_LIGHT', category: 'SIGNS', name: 'Đèn Tín Hiệu (Tây Bắc)', x: jX - 25, y: jY - 10, width: 2, height: 2, rotation: 90, color: '#0f172a', icon: '🚥' },
      { id: `tl_bl_${now}`, type: 'TRAFFIC_LIGHT', category: 'SIGNS', name: 'Đèn Tín Hiệu (Tây Nam)', x: jX - 25, y: jY + jH + 10, width: 2, height: 2, rotation: 180, color: '#0f172a', icon: '🚥' },
      { id: `tl_br_${now}`, type: 'TRAFFIC_LIGHT', category: 'SIGNS', name: 'Đèn Tín Hiệu (Đông Nam)', x: jX + jW + 10, y: jY + jH + 10, width: 2, height: 2, rotation: 270, color: '#0f172a', icon: '🚥' }
    ];

    const stopLines = [
      { id: `sl_top_${now}`, type: 'STOP_LINE', category: 'MARKINGS', name: 'Vạch Dừng Haltelinie (Bắc)', x: jX, y: jY - 15, width: junction.width || 16, height: 1, length: 1, rotation: 0, color: '#ffffff', icon: '🛑' },
      { id: `sl_bot_${now}`, type: 'STOP_LINE', category: 'MARKINGS', name: 'Vạch Dừng Haltelinie (Nam)', x: jX, y: jY + jH + 15, width: junction.width || 16, height: 1, length: 1, rotation: 0, color: '#ffffff', icon: '🛑' },
      { id: `sl_left_${now}`, type: 'STOP_LINE', category: 'MARKINGS', name: 'Vạch Dừng Haltelinie (Tây)', x: jX - 15, y: jY, width: 1, height: junction.height || 16, length: junction.height || 16, rotation: 0, color: '#ffffff', icon: '🛑' },
      { id: `sl_right_${now}`, type: 'STOP_LINE', category: 'MARKINGS', name: 'Vạch Dừng Haltelinie (Đông)', x: jX + jW + 15, y: jY, width: 1, height: junction.height || 16, length: junction.height || 16, rotation: 0, color: '#ffffff', icon: '🛑' }
    ];

    setMapElements(prev => [...prev, ...tls, ...stopLines]);
    handleUpdateSelectedProperty('hasTrafficLight', true);
  }, [handleUpdateSelectedProperty]);

  // Helper icons & colors
  const getIconForType = (type, signType) => {
    if (type === 'SIGN') {
      switch (signType) {
        case 'SPEED_LIMIT': return '🚦';
        case 'STOP':
        case 'STOP_SIGN': return '🛑';
        case 'PRIORITY':
        case 'PRIORITY_ROAD': return '🔶';
        case 'YIELD':
        case 'VORFAHRT_GEWAEHREN': return '🔻';
        case 'NO_ENTRY':
        case 'VERBOT_EINFAHRT': return '⛔';
        case 'ONEWAY':
        case 'ONE_WAY': return '➡️';
        default: return '🚦';
      }
    }
    switch (type) {
      case 'ROAD_STRAIGHT': return '🛣️';
      case 'ROAD_CURVE_90': return '↪️';
      case 'ROAD_S_CURVE': return '〰️';
      case 'ROUNDABOUT_4WAY': return '🔄';
      case 'HILL_RAMP': return '📐';
      case 'PARKING_BAY': return '🅿️';
      case 'INTERSECTION_4WAY': return '✚';
      case 'INTERSECTION_3WAY': return 'T';
      case 'JUNCTION_AMPEL': return '🚥';
      case 'TRAFFIC_LIGHT': return '🚥';
      case 'STOP_LINE': return '🛑';
      case 'ZEBRA': return '🚶';
      case 'ARROW_STRAIGHT': return '⬆️';
      case 'ARROW_LEFT': return '↖️';
      case 'ARROW_RIGHT': return '↗️';
      case 'BRANDENBURGER_TOR': return '🏛️';
      case 'TRAM_STOP': return '🚋';
      case 'BUS_STOP': return '🚏';
      case 'PARKED_CAR': return '🚗';
      case 'CONSTRUCTION': return '🚧';
      case 'BUILDING': return '🏢';
      case 'SHOP': return '🏪';
      case 'TREE': return '🌳';
      case 'PROMENADE': return '🌳';
      case 'PARK': return '🌲';
      case 'SPAWN_POINT': return '📍';
      default: return '📦';
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'ROAD_STRAIGHT': return '#1e293b';
      case 'ROAD_CURVE_90':
      case 'ROAD_S_CURVE':
      case 'ROUNDABOUT_4WAY':
      case 'INTERSECTION_4WAY':
      case 'INTERSECTION_3WAY':
      case 'JUNCTION_AMPEL': return '#1e293b';
      case 'TRAFFIC_LIGHT': return '#0f172a';
      case 'STOP_LINE': return '#ffffff';
      case 'ZEBRA': return '#ffffff';
      case 'ARROW_STRAIGHT':
      case 'ARROW_LEFT':
      case 'ARROW_RIGHT': return '#ffffff';
      case 'HILL_RAMP':
      case 'PARKING_BAY': return '#334155';
      case 'BRANDENBURGER_TOR': return '#78716c';
      case 'BUILDING':
      case 'SHOP': return '#475569';
      case 'TREE': return '#15803d';
      case 'PROMENADE': return '#27272a';
      case 'PARK': return '#14532d';
      case 'TRAM_STOP': return '#991b1b';
      case 'BUS_STOP': return '#854d0e';
      case 'PARKED_CAR': return '#1e40af';
      case 'CONSTRUCTION': return '#c2410c';
      case 'SIGN': return '#ef4444';
      case 'SPAWN_POINT': return '#2563EB';
      default: return '#64748b';
    }
  };

  // ── 3. BUILD JSON CHUẨN ĐỂ LƯU VÀ RUN THỬ 3D ────────────────────────
  const buildMapData = useCallback((name = 'Custom Map') => {
    const spawnPoint = mapElements.find(el => el.type === 'SPAWN_POINT');

    return {
      mapInfo: {
        name,
        type: 'custom',
        maxSpeedLimit: 50,
        gridSize: snapGridMeters,
        activeMode,
        spawnPoint: spawnPoint ? {
          x: (spawnPoint.x + spawnPoint.width * GRID_SIZE / 2) / GRID_SIZE,
          z: (spawnPoint.y + spawnPoint.height * GRID_SIZE / 2) / GRID_SIZE,
          rotation: spawnPoint.rotation || 0
        } : { x: 3.5, z: 5, rotation: 0 }
      },
      elements: mapElements.map(el => ({
        id: el.id,
        type: el.type || 'ROAD_STRAIGHT',
        name: el.name || el.id,
        x: el.x / GRID_SIZE,
        z: el.y / GRID_SIZE,
        rotation: normalizeRotation(el.rotation),
        width: el.width || 10,
        height: el.height || el.length || 10,
        length: el.length || el.height || 10,
        lanes: el.lanes || 2,
        laneWidth: el.laneWidth || 3.5,
        speedLimit: el.speedLimit || 50,
        oneWay: !!el.oneWay,
        bicycleLane: !!el.bicycleLane,
        hasTram: !!el.hasTram,
        roadType: el.roadType || 'asphalt',
        sidewalk: el.sidewalk !== false,
        junctionType: el.junctionType,
        hasTrafficLight: !!el.hasTrafficLight,
        priorityRule: el.priorityRule || 'rechts_vor_links',
        connectedTo: el.connectedTo || [],
        ...(el.signType ? { signType: el.signType } : {}),
        ...(el.value !== undefined && el.value !== null ? { value: el.value } : {})
      })),
      createdAt: new Date().toISOString()
    };
  }, [mapElements, snapGridMeters, activeMode]);

  // Lưu file JSON
  const handleSave = useCallback(() => {
    const mapData = buildMapData('Berlin-Mitte Custom');
    const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `berlin-mitte-map-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (onSave) onSave(mapData);
  }, [buildMapData, onSave]);

  // Nạp Preset Bản đồ
  const loadPreset = useCallback((preset) => {
    if (!preset || !preset.elements) return;

    let minX = Infinity;
    let minZ = Infinity;
    preset.elements.forEach(el => {
      const xVal = el.x !== undefined ? el.x : 0;
      const zVal = el.z !== undefined ? el.z : (el.y !== undefined ? el.y / GRID_SIZE : 0);
      if (xVal < minX) minX = xVal;
      if (zVal < minZ) minZ = zVal;
    });

    const offsetX = minX < 2 ? Math.abs(minX) + 6 : 4;
    const offsetZ = minZ < 2 ? Math.abs(minZ) + 6 : 4;

    const parsedElements = preset.elements.map(el => {
      const rawX = el.x !== undefined ? el.x : 0;
      const rawZ = el.z !== undefined ? el.z : (el.y !== undefined ? el.y / GRID_SIZE : 0);
      const canvasX = Math.round((rawX + offsetX) * GRID_SIZE);
      const canvasY = Math.round((rawZ + offsetZ) * GRID_SIZE);

      return {
        id: el.id || `elem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: el.type,
        name: el.name || el.id,
        x: canvasX,
        y: canvasY,
        rotation: normalizeRotation(el.rotation || 0),
        width: el.width || 10,
        height: el.height || el.length || 10,
        length: el.length || el.height || 10,
        lanes: el.lanes || 2,
        laneWidth: el.laneWidth || 3.5,
        speedLimit: el.speedLimit || (el.value || 50),
        oneWay: !!el.oneWay,
        bicycleLane: !!el.bicycleLane,
        hasTram: !!el.hasTram,
        roadType: el.roadType || 'asphalt',
        sidewalk: el.sidewalk !== false,
        junctionType: el.junctionType,
        hasTrafficLight: !!el.hasTrafficLight,
        priorityRule: el.priorityRule || 'rechts_vor_links',
        connectedTo: el.connectedTo || [],
        signType: el.signType,
        value: el.value,
        icon: getIconForType(el.type, el.signType),
        color: getColorForType(el.type)
      };
    });

    setMapElements(parsedElements);
    setSelectedElement(null);
    setZoomLevel(parsedElements.length > 50 ? 0.3 : 0.45);
    if (onLoad) onLoad(preset);
  }, [onLoad]);

  // Tự động khôi phục bản đồ đang chỉnh sửa dở trong localStorage (hoặc nạp mẫu Sa Hình mặc định)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('testMapData');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.elements) && parsed.elements.length > 0) {
          loadPreset(parsed);
          return;
        }
      }
    } catch { /* ignore */ }
    loadPreset(SA_HINH_FAHRSCHULE_PRESET);
  }, [loadPreset]);

  // Load JSON từ máy
  const handleLoad = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const mapData = JSON.parse(event.target.result);
        loadPreset(mapData);
      } catch (err) {
        console.error('Load error:', err);
        alert('Lỗi nạp file JSON: Định dạng không hợp lệ.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadPreset]);

  // Xóa toàn bộ canvas
  const handleClear = useCallback(() => {
    setMapElements([]);
    setSelectedElement(null);
  }, []);

  // Chạy thử 3D ngay lập tức trên Three.js Simulator (custom map: testMapData + state mapId)
  const handleRunTest = useCallback(() => {
    if (mapElements.length === 0) {
      alert('Vui lòng thêm ít nhất 1 đoạn đường vào bản đồ trước khi chạy thử 3D!');
      return;
    }

    const mapData = buildMapData('Custom Map');
    localStorage.setItem('testMapData', JSON.stringify(mapData));
    navigate('/simulation', { state: { mapId: 'custom_map' } });
  }, [mapElements, buildMapData, navigate]);

  const filteredPaletteElements = MAP_ELEMENTS.filter(el => el.category === activeCategory);

  const rotationButtonStyle = {
    background: '#1f1f23',
    border: '1px solid #334155',
    color: '#e2e8f0',
    padding: '5px 2px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 800,
    cursor: 'pointer'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 60px)',
      background: '#020617',
      color: '#E5E5E5',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* ── TOP HEADER TOOLBAR ────────────────────────────────────────── */}
      <div style={{
        padding: '10px 20px',
        background: '#0B0B0B',
        borderBottom: '1px solid #292929',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/simulation')}
            title="Quay lại mô phỏng lái xe 3D"
            style={{
              background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1',
              padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5
            }}
          >
            ← Về Lái Xe 3D
          </button>
          <div style={{ fontSize: 15, fontWeight: '800', color: '#F8FAFC', letterSpacing: '0.3px' }}>
            🗺️ Map Editor 2.0 <span style={{ fontSize: 11, fontWeight: 500, color: '#38bdf8', background: '#0369a1', padding: '2px 6px', borderRadius: 4 }}>ROAD NETWORK</span>
          </div>
        </div>

        {/* Snap Grid Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#18181b', padding: '4px 8px', borderRadius: 6, border: '1px solid #27272a' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a' }}>SNAP GRID:</span>
          {[5, 10].map(meters => (
            <button
              key={meters}
              onClick={() => setSnapGridMeters(meters)}
              style={{
                background: snapGridMeters === meters ? '#2563eb' : 'transparent',
                color: snapGridMeters === meters ? '#ffffff' : '#a1a1aa',
                border: 'none', padding: '3px 8px', borderRadius: 4,
                fontSize: 11, fontWeight: 700, cursor: 'pointer'
              }}
            >
              {meters}m
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, marginRight: 8, paddingRight: 12, borderRight: '1px solid #292929' }}>
            <span style={{ fontSize: 11, fontWeight: '700', color: '#8A8A8A', alignSelf: 'center' }}>
              MẪU PRESET:
            </span>
            <button
              onClick={() => loadPreset(BERLIN_MITTE_REAL_OSM_PRESET)}
              title="Nạp Bản Đồ Thực Tế Berlin-Mitte từ OpenStreetMap (Unter den Linden x Friedrichstr, 143 phần tử chuẩn StVO)"
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', border: '1px solid #60a5fa', color: '#ffffff',
                padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
              }}
            >
              <span>🏛️</span> Berlin-Mitte Thực Tế (OSM)
            </button>
            <button
              onClick={() => loadPreset(BERLIN_MITTE_GRAND_MAP_PRESET)}
              title="Nạp Đại Bản Đồ Berlin-Mitte (Torstraße - Alexanderplatz - Unter den Linden - Cổng Brandenburg)"
              style={{
                background: '#1e293b', border: '1px solid #3b82f6', color: '#60a5fa',
                padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5
              }}
            >
              <span>🏙️</span> Berlin-Mitte 2.0
            </button>
            <button
              onClick={() => loadPreset(SA_HINH_FAHRSCHULE_PRESET)}
              title="Nạp sa hình khép kín đầy đủ đề-pa, cua chữ S, ghép xe"
              style={{
                background: '#1e293b', border: '1px solid #10b981', color: '#34d399',
                padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5
              }}
            >
              <span>🚗</span> Sa Hình Sát Hạch
            </button>
          </div>

          <button onClick={handleSave} style={{
            background: '#2563EB', border: 'none', color: '#FFFFFF',
            padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <Save size={14} /> Lưu JSON
          </button>
          <button onClick={handleRunTest} style={{
            background: '#059669', border: 'none', color: '#FFFFFF',
            padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: '700', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(5, 150, 105, 0.4)'
          }}>
            <Play size={14} /> Run thử 3D
          </button>
          <label style={{
            background: '#16A34A', border: 'none', color: '#FFFFFF',
            padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <Upload size={14} /> Load Map
            <input type="file" accept=".json" onChange={handleLoad} style={{ display: 'none' }} />
          </label>
          <button onClick={handleClear} style={{
            background: '#DC2626', border: 'none', color: '#FFFFFF',
            padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <Trash2 size={14} /> Xóa tất cả
          </button>
        </div>
      </div>

      {/* ── WORKSPACE CHÍNH (SIDEBAR + CANVAS + INSPECTOR) ─────────────── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* SIDEBAR BÊN TRÁI: PALETTE CÓ 4 DANH MỤC */}
        <div style={{
          width: 260,
          background: '#0B0B0B',
          borderRight: '1px solid #292929',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Category Tabs */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 4, padding: '10px 12px', borderBottom: '1px solid #292929', background: '#121214'
          }}>
            {ELEMENT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  background: activeCategory === cat.id ? '#2563eb' : '#1e1e24',
                  color: activeCategory === cat.id ? '#ffffff' : '#a1a1aa',
                  border: 'none', padding: '6px 8px', borderRadius: 5,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Danh sách phần tử drag-drop */}
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#71717a', marginBottom: 8, letterSpacing: '0.5px' }}>
              KÉO THẢ VÀO BẢN ĐỒ (SNAP {snapGridMeters}M):
            </div>
            {filteredPaletteElements.map((element) => (
              <div
                key={element.id}
                draggable
                onDragStart={(e) => handleDragStart(e, element)}
                style={{
                  background: '#151518',
                  border: '1px solid #27272a',
                  borderRadius: 6,
                  padding: '10px 12px',
                  marginBottom: 8,
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#27272a'}
              >
                <span style={{ fontSize: 22 }}>{element.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: '700', color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {element.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', display: 'flex', gap: 6, marginTop: 2 }}>
                    <span>{element.width}m × {element.height}m</span>
                    {element.speedLimit && <span style={{ color: '#ef4444', fontWeight: 600 }}>{element.speedLimit} km/h</span>}
                    {element.hasTram && <span style={{ color: '#f59e0b', fontWeight: 600 }}>Tram</span>}
                    {element.bicycleLane && <span style={{ color: '#10b981', fontWeight: 600 }}>Xe đạp</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KHÔNG GIAN THIẾT KẾ CANVAS 2D (CENTER) */}
        <div style={{ flex: 1, padding: 20, overflow: 'auto', position: 'relative' }}>
          {/* Floating Zoom Bar */}
          <div style={{
            position: 'absolute', top: 30, right: 30, zIndex: 10,
            background: '#0B0B0B', border: '1px solid #292929', borderRadius: 8,
            padding: 8, display: 'flex', gap: 6, alignItems: 'center'
          }}>
            <button onClick={handleZoomOut} style={{
              background: '#18181b', border: '1px solid #27272a', color: '#E5E5E5',
              width: 30, height: 30, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>−
            </button>
            <span style={{ fontSize: 11, color: '#a1a1aa', minWidth: 42, textAlign: 'center', fontWeight: 600 }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button onClick={handleZoomIn} style={{
              background: '#18181b', border: '1px solid #27272a', color: '#E5E5E5',
              width: 30, height: 30, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>+
            </button>
            <button onClick={handleZoomReset} style={{
              background: '#2563EB', border: 'none', color: '#FFFFFF',
              padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: '700', cursor: 'pointer'
            }}>Reset
            </button>
          </div>

          {/* Canvas Viewport 6400 x 4200 với CSS Grid */}
          <div
            ref={canvasRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onWheel={handleWheel}
            onClick={(e) => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const rect = canvas.getBoundingClientRect();
              const x = (e.clientX - rect.left) / zoomLevel;
              const y = (e.clientY - rect.top) / zoomLevel;
              const clickedElement = [...mapElements].reverse().find(el => pointInElement(x, y, el));
              if (!clickedElement) setSelectedElement(null);
            }}
            style={{
              width: 6400,
              height: 4200,
              background: '#09090b',
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                linear-gradient(to right, rgba(37, 99, 235, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(37, 99, 235, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px, 50px 50px, 100px 100px, 100px 100px',
              border: '2px dashed #27272a',
              borderRadius: 8,
              position: 'relative',
              cursor: 'crosshair',
              overflow: 'hidden',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              transition: 'transform 0.15s ease-out'
            }}
          >
            {/* Khung viền chỉ dẫn ranh giới bản đồ (Map Locked Boundary) */}
            <div style={{
              position: 'absolute',
              left: 30, top: 30,
              width: 6340, height: 4140,
              border: '2px dashed rgba(220, 38, 38, 0.5)',
              pointerEvents: 'none',
              borderRadius: 8,
              boxShadow: 'inset 0 0 40px rgba(220, 38, 38, 0.08)'
            }}>
              <div style={{
                position: 'absolute', top: 8, left: 12,
                fontSize: 11, fontWeight: 800, color: '#ef4444',
                background: 'rgba(15, 23, 42, 0.9)', padding: '3px 10px', borderRadius: 4,
                border: '1px solid rgba(220, 38, 38, 0.3)',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <span>🔒</span>
                <span>RANH GIỚI BẢN ĐỒ (LOCKED BOUNDARY - NGOÀI KHU VỰC SẼ BỊ KHÓA)</span>
              </div>
            </div>

            {/* Quick Start Modal khi canvas trống */}
            {mapElements.length === 0 && (
              <div style={{
                position: 'absolute', top: 120, left: 280, zIndex: 20,
                background: '#0F172A', border: '1px solid #334155', borderRadius: 12,
                padding: '36px 44px', textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', maxWidth: 660
              }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🗺️</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', margin: '0 0 8px 0' }}>
                  Map Editor 2.0 - Thiết Kế Bản Đồ Giao Thông StVO
                </h3>
                <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 }}>
                  Xây dựng mạng lưới đường phố liên hoàn (Roads + Junctions + Markings + Signs) hoặc nạp nhanh bản đồ mẫu:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    onClick={() => loadPreset(BERLIN_MITTE_REAL_OSM_PRESET)}
                    style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                      color: '#ffffff', border: '1px solid #60a5fa', borderRadius: 8,
                      padding: '14px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🏛️</span>
                    <span>Nạp Bản Đồ Berlin-Mitte Thực Tế (Unter den Linden x Friedrichstr - OSM)</span>
                  </button>
                  <button
                    onClick={() => loadPreset(BERLIN_MITTE_GRAND_MAP_PRESET)}
                    style={{
                      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                      color: '#ffffff', border: '1px solid #475569', borderRadius: 8,
                      padding: '12px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🏙️</span>
                    <span>Nạp Bản Đồ Quy Hoạch Berlin-Mitte 2.0 (Torstraße - Alexanderplatz)</span>
                  </button>
                  <button
                    onClick={() => loadPreset(SA_HINH_FAHRSCHULE_PRESET)}
                    style={{
                      background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
                      color: '#ffffff', border: '1px solid #10b981', borderRadius: 8,
                      padding: '12px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🚗</span>
                    <span>Nạp Sa Hình Thi Sát Hạch Khép Kín (Đề-pa, Vòng Xuyến, Lùi Chuồng)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Render các phần tử bản đồ 2D */}
            {mapElements.map((element) => {
              const dims = getElementDimensionsPx(element);
              const isSelected = selectedElement?.id === element.id;

              return (
                <div
                  key={element.id}
                  onMouseDown={(e) => handleMouseDown(e, element)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(element);
                  }}
                  style={{
                    position: 'absolute',
                    left: element.x,
                    top: element.y,
                    width: dims.width,
                    height: dims.height,
                    background: element.color,
                    border: isSelected ? '2.5px solid #38bdf8' : (element.type === 'ROAD_STRAIGHT' ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.12)'),
                    boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.6)' : 'none',
                    borderRadius: (element.type === 'ROAD_STRAIGHT' || element.type === 'PROMENADE') ? 0 : 4,
                    cursor: isDragging && dragRef.current?.id === element.id ? 'grabbing' : 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `rotate(${normalizeRotation(element.rotation || 0)}deg)`,
                    transformOrigin: 'center center',
                    userSelect: 'none',
                    overflow: 'hidden'
                  }}
                >
                  {/* Đường thẳng / Đại lộ với Ray Tram & Làn xe đạp */}
                  {element.type === 'ROAD_STRAIGHT' && (
                    <div style={{ width: '100%', height: '100%', position: 'relative', background: element.roadType === 'cobblestone' ? '#3e2723' : '#1e293b' }}>
                      {/* Vạch kẻ trung tâm */}
                      <div style={{
                        position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)',
                        width: element.lanes === 4 ? 6 : 2,
                        borderLeft: element.lanes === 4 ? '2px solid #ffffff' : 'none',
                        borderRight: element.lanes === 4 ? '2px solid #ffffff' : 'none',
                        backgroundImage: element.lanes === 4 ? 'none' : 'repeating-linear-gradient(180deg, #ffffff 0px, #ffffff 8px, transparent 8px, transparent 16px)'
                      }} />

                      {/* Ray đôi tàu điện Tram */}
                      {element.hasTram && (
                        <div style={{
                          position: 'absolute', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)',
                          width: 16, borderLeft: '2px solid #94a3b8', borderRight: '2px solid #94a3b8'
                        }} />
                      )}

                      {/* Làn xe đạp đỏ ở mép */}
                      {element.bicycleLane && (
                        <>
                          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 8, background: '#ef4444', opacity: 0.8 }} />
                          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 8, background: '#ef4444', opacity: 0.8 }} />
                        </>
                      )}

                      {/* Tên đường hiển thị mờ */}
                      {element.name && dims.height > 40 && (
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(90deg)',
                          fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap'
                        }}>
                          {element.name}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vòng xuyến Kreisverkehr */}
                  {element.type === 'ROUNDABOUT_4WAY' && (
                    <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute' }}>
                      <rect x="36" y="0" width="28" height="100" fill="#1e293b" />
                      <rect x="0" y="36" width="100" height="28" fill="#1e293b" />
                      <circle cx="50" cy="50" r="46" fill="#1c2026" stroke="#06b6d4" strokeWidth="2" />
                      <circle cx="50" cy="50" r="32" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="5,4" />
                      <circle cx="50" cy="50" r="20" fill="#15803d" stroke="#cbd5e1" strokeWidth="2" />
                      <text x="50" y="54" textAnchor="middle" fontSize="12" fill="#ffffff">🔄</text>
                    </svg>
                  )}

                  {/* Giao lộ có đèn tín hiệu Ampel hoặc ngã tư có đèn */}
                  {(element.type === 'JUNCTION_AMPEL' || element.type === 'INTERSECTION_4WAY') && (
                    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1e293b' }}>
                      {/* Vạch ranh giới ngã tư tinh tế */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        border: '1px dashed rgba(255,255,255,0.12)',
                        boxSizing: 'border-box'
                      }} />
                      {/* Bó vỉa góc 4 góc ngã tư (corner curb accents) */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 6, height: 6, borderRight: '1.5px solid #475569', borderBottom: '1.5px solid #475569', background: '#334155' }} />
                      <div style={{ position: 'absolute', top: 0, right: 0, width: 6, height: 6, borderLeft: '1.5px solid #475569', borderBottom: '1.5px solid #475569', background: '#334155' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 6, height: 6, borderRight: '1.5px solid #475569', borderTop: '1.5px solid #475569', background: '#334155' }} />
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 6, height: 6, borderLeft: '1.5px solid #475569', borderTop: '1.5px solid #475569', background: '#334155' }} />

                      {/* Đèn tín hiệu nhỏ tại góc nếu có */}
                      {(element.type === 'JUNCTION_AMPEL' || element.hasTrafficLight) && (
                        <>
                          <div style={{ position: 'absolute', top: 2, left: 2, fontSize: 10, lineHeight: 1 }}>🚥</div>
                          <div style={{ position: 'absolute', top: 2, right: 2, fontSize: 10, lineHeight: 1 }}>🚥</div>
                          <div style={{ position: 'absolute', bottom: 2, left: 2, fontSize: 10, lineHeight: 1 }}>🚥</div>
                          <div style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 10, lineHeight: 1 }}>🚥</div>
                        </>
                      )}

                      {/* Tâm ngã tư kín đáo */}
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)'
                      }} />
                    </div>
                  )}

                  {/* Lối đi bộ giữa đại lộ (Mittelpromenade Unter den Linden) */}
                  {element.type === 'PROMENADE' && (
                    <div style={{
                      width: '100%', height: '100%', position: 'relative',
                      background: '#3f3f46',
                      borderLeft: '4px solid #166534',
                      borderRight: '4px solid #166534',
                      boxSizing: 'border-box',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around',
                      overflow: 'hidden'
                    }}>
                      {/* Dải cỏ hoa viên và hàng cây linden dọc hai bên */}
                      <div style={{ position: 'absolute', top: 4, left: 2, fontSize: 12 }}>🌳</div>
                      <div style={{ position: 'absolute', top: 4, right: 2, fontSize: 12 }}>🌳</div>
                      <div style={{ position: 'absolute', top: '45%', left: 2, fontSize: 12 }}>🌳</div>
                      <div style={{ position: 'absolute', top: '45%', right: 2, fontSize: 12 }}>🌳</div>
                      <div style={{ position: 'absolute', bottom: 4, left: 2, fontSize: 12 }}>🌳</div>
                      <div style={{ position: 'absolute', bottom: 4, right: 2, fontSize: 12 }}>🌳</div>
                      <div style={{
                        fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                        letterSpacing: '1px', textTransform: 'uppercase', transform: 'rotate(90deg)',
                        whiteSpace: 'nowrap'
                      }}>
                        {element.name || 'Mittelpromenade'}
                      </div>
                    </div>
                  )}

                  {/* Khu công viên / bãi cỏ (Park / Grünanlage) */}
                  {element.type === 'PARK' && (
                    <div style={{
                      width: '100%', height: '100%', position: 'relative',
                      background: 'radial-gradient(circle, #15803d 0%, #14532d 100%)',
                      border: '1.5px solid #166534',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: 18 }}>🌲</div>
                      <div style={{
                        position: 'absolute', bottom: 4, left: 0, right: 0,
                        textAlign: 'center', fontSize: 8, fontWeight: 700, color: '#86efac'
                      }}>
                        {element.name || 'Grünanlage'}
                      </div>
                    </div>
                  )}

                  {/* Cột đèn tín hiệu giao thông StVO § 37 (Ampel Kontrastblende) */}
                  {element.type === 'TRAFFIC_LIGHT' && (
                    <div style={{
                      width: '100%', height: '100%', background: '#09090b', border: '1.5px solid #eab308',
                      borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'space-around', padding: '2px 1px', boxShadow: '0 0 6px rgba(0,0,0,0.8)'
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 3px #ef4444' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 3px #22c55e' }} />
                    </div>
                  )}

                  {/* Vạch dừng xe StVO Zeichen 294 (Haltelinie) */}
                  {element.type === 'STOP_LINE' && (
                    <div style={{
                      width: '100%', height: '100%', background: '#ffffff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 4px rgba(255,255,255,0.7)'
                    }}>
                      <span style={{ fontSize: 7, fontWeight: 900, color: '#09090b', letterSpacing: '0.4px' }}>
                        HALT Z.294
                      </span>
                    </div>
                  )}

                  {/* Vạch đi bộ Zebrastreifen (StVO Zeichen 293) */}
                  {element.type === 'ZEBRA' && (
                    <div style={{
                      width: '100%', height: '100%', background: '#18181b',
                      backgroundImage: 'repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 8px, transparent 8px, transparent 16px)',
                      border: '1px solid rgba(255,255,255,0.4)'
                    }} />
                  )}

                  {/* Biển báo giao thông StVO Đức */}
                  {element.type === 'SIGN' && (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {element.signType === 'SPEED_LIMIT' && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', background: '#ffffff',
                          border: '3px solid #dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#000000', fontSize: 9, fontWeight: 900
                        }}>
                          {element.value || 50}
                        </div>
                      )}
                      {(element.signType === 'STOP' || element.signType === 'STOP_SIGN') && (
                        <div style={{
                          width: 22, height: 22, background: '#dc2626', clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: 6.5, fontWeight: 900
                        }}>
                          STOP
                        </div>
                      )}
                      {(element.signType === 'PRIORITY' || element.signType === 'PRIORITY_ROAD') && (
                        <div style={{
                          width: 18, height: 18, transform: 'rotate(45deg)', background: '#f59e0b',
                          border: '2px solid #ffffff', boxShadow: '0 0 2px #000'
                        }} />
                      )}
                      {(element.signType === 'YIELD' || element.signType === 'VORFAHRT_GEWAEHREN') && (
                        <div style={{
                          width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
                          borderTop: '18px solid #dc2626', position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute', top: -16, left: -6, width: 0, height: 0,
                            borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                            borderTop: '11px solid #ffffff'
                          }} />
                        </div>
                      )}
                      {(element.signType === 'NO_ENTRY' || element.signType === 'VERBOT_EINFAHRT') && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', background: '#dc2626',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <div style={{ width: 14, height: 3, background: '#ffffff' }} />
                        </div>
                      )}
                      {(element.signType === 'ONEWAY' || element.signType === 'ONE_WAY') && (
                        <div style={{
                          width: 24, height: 14, background: '#0284c7', border: '1px solid #ffffff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: 10
                        }}>
                          ➡️
                        </div>
                      )}
                      {!['SPEED_LIMIT', 'STOP', 'STOP_SIGN', 'PRIORITY', 'PRIORITY_ROAD', 'YIELD', 'VORFAHRT_GEWAEHREN', 'NO_ENTRY', 'VERBOT_EINFAHRT', 'ONEWAY', 'ONE_WAY'].includes(element.signType) && (
                        <span style={{ fontSize: 16 }}>{element.icon || '🚦'}</span>
                      )}
                    </div>
                  )}

                  {/* Vạch mũi tên chỉ hướng (Directional arrows) */}
                  {(element.type === 'ARROW_STRAIGHT' || element.type === 'ARROW_LEFT' || element.type === 'ARROW_RIGHT') && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: 16, fontWeight: 900 }}>
                      {element.type === 'ARROW_STRAIGHT' ? '⬆️' : element.type === 'ARROW_LEFT' ? '↖️' : '↗️'}
                    </div>
                  )}

                  {/* Cổng Brandenburger Tor */}
                  {element.type === 'BRANDENBURGER_TOR' && (
                    <div style={{
                      width: '100%', height: '100%', background: '#78716c', border: '1px solid #d6d3d1',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 4
                    }}>
                      <div style={{ fontSize: 18 }}>🏛️</div>
                      <div style={{ fontSize: 8, fontWeight: 900, color: '#ffffff', textAlign: 'center' }}>BRANDENBURGER TOR</div>
                    </div>
                  )}

                  {/* Icon mặc định cho các đối tượng khác */}
                  {element.type !== 'ROAD_STRAIGHT' && element.type !== 'ROUNDABOUT_4WAY' && element.type !== 'JUNCTION_AMPEL' && element.type !== 'INTERSECTION_4WAY' && element.type !== 'PROMENADE' && element.type !== 'PARK' && element.type !== 'BRANDENBURGER_TOR' && element.type !== 'TRAFFIC_LIGHT' && element.type !== 'STOP_LINE' && element.type !== 'ZEBRA' && element.type !== 'SIGN' && !element.type.startsWith('ARROW_') && (
                    <span style={{ fontSize: 18 }}>{element.icon || '📦'}</span>
                  )}

                  {/* Visual Connection Ports khi được chọn */}
                  {isSelected && (
                    <>
                      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', border: '1px solid #fff' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translate(-50%, 50%)', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', border: '1px solid #fff' }} />
                      <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translate(-50%, -50%)', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', border: '1px solid #fff' }} />
                      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translate(50%, -50%)', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', border: '1px solid #fff' }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SIDEBAR BÊN PHẢI: INSPECTOR 2.0 (CHỈNH SỬA THUỘC TÍNH CHI TIẾT) ── */}
        <div style={{
          width: 290,
          background: '#0B0B0B',
          borderLeft: '1px solid #292929',
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <div style={{ fontSize: 13, fontWeight: '800', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #27272a', paddingBottom: 10 }}>
            <Sliders size={16} color="#38bdf8" />
            <span>THUỘC TÍNH 2.0 (INSPECTOR)</span>
          </div>

          {selectedElement ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Tên & Type */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>TÊN ĐOẠN ĐƯỜNG / PHẦN TỬ:</label>
                <input
                  type="text"
                  value={selectedElement.name || ''}
                  onChange={(e) => handleUpdateSelectedProperty('name', e.target.value)}
                  style={{
                    width: '100%', background: '#18181b', border: '1px solid #27272a',
                    borderRadius: 4, padding: '6px 8px', color: '#fff', fontSize: 12, marginTop: 4, boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Tọa độ X, Z */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>X (MÉT):</label>
                  <input
                    type="number"
                    step={snapGridMeters}
                    value={(selectedElement.x / GRID_SIZE).toFixed(0)}
                    onChange={(e) => {
                      const newX = parseFloat(e.target.value) * GRID_SIZE;
                      handleUpdateSelectedProperty('x', newX);
                    }}
                    style={{
                      width: '100%', background: '#18181b', border: '1px solid #27272a',
                      borderRadius: 4, padding: '6px 8px', color: '#fff', fontSize: 12, marginTop: 4, boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>Z (MÉT):</label>
                  <input
                    type="number"
                    step={snapGridMeters}
                    value={(selectedElement.y / GRID_SIZE).toFixed(0)}
                    onChange={(e) => {
                      const newY = parseFloat(e.target.value) * GRID_SIZE;
                      handleUpdateSelectedProperty('y', newY);
                    }}
                    style={{
                      width: '100%', background: '#18181b', border: '1px solid #27272a',
                      borderRadius: 4, padding: '6px 8px', color: '#fff', fontSize: 12, marginTop: 4, boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* XOAY TỰ DO: mọi component có thể xoay 0..359.9° */}
              <div style={{
                background: '#141417',
                padding: 10,
                borderRadius: 6,
                border: '1px solid #27272a',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8' }}>↻ XOAY TỰ DO</div>
                    <div style={{ fontSize: 9, color: '#71717a', marginTop: 2 }}>Không giới hạn 90° — nhập góc bất kỳ</div>
                  </div>
                  <div style={{
                    minWidth: 62,
                    textAlign: 'center',
                    padding: '4px 7px',
                    borderRadius: 5,
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: 12,
                    fontWeight: 800
                  }}>
                    {normalizeRotation(selectedElement.rotation || 0).toFixed(1)}°
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="359.9"
                  step="0.1"
                  value={Math.min(359.9, normalizeRotation(selectedElement.rotation || 0))}
                  onChange={(e) => handleSetRotation(e.target.value)}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <input
                    type="number"
                    min="-360"
                    max="360"
                    step="0.1"
                    value={Number(selectedElement.rotation || 0).toFixed(1)}
                    onChange={(e) => handleSetRotation(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: '#18181b',
                      border: '1px solid #334155', borderRadius: 5, padding: '6px 8px',
                      color: '#fff', fontSize: 12, fontWeight: 700
                    }}
                    aria-label="Góc xoay theo độ"
                  />
                  <select
                    value={rotationStep}
                    onChange={(e) => setRotationStep(Number(e.target.value))}
                    style={{
                      width: '100%', background: '#18181b', border: '1px solid #334155',
                      borderRadius: 5, padding: '6px 8px', color: '#fff', fontSize: 11
                    }}
                    title="Bước xoay cho nút +/−"
                  >
                    <option value={1}>Bước 1°</option>
                    <option value={5}>Bước 5°</option>
                    <option value={10}>Bước 10°</option>
                    <option value={15}>Bước 15°</option>
                    <option value={22.5}>Bước 22.5°</option>
                    <option value={30}>Bước 30°</option>
                    <option value={45}>Bước 45°</option>
                    <option value={90}>Bước 90°</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                  <button onClick={() => handleRotateElement(selectedElement, -rotationStep)} style={rotationButtonStyle}>−</button>
                  <button onClick={() => handleSetRotation(0)} style={rotationButtonStyle}>0°</button>
                  <button onClick={() => handleRotateElement(selectedElement, 15)} style={rotationButtonStyle}>+15°</button>
                  <button onClick={() => handleRotateElement(selectedElement, 45)} style={rotationButtonStyle}>+45°</button>
                  <button onClick={() => handleRotateElement(selectedElement, 90)} style={rotationButtonStyle}>+90°</button>
                </div>
              </div>

              {/* Kích thước: Chiều dài & Chiều rộng */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>CHIỀU DÀI (M):</label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    step={5}
                    value={selectedElement.length || selectedElement.height || 20}
                    onChange={(e) => handleUpdateSelectedProperty('length', parseInt(e.target.value) || 20)}
                    style={{
                      width: '100%', background: '#18181b', border: '1px solid #27272a',
                      borderRadius: 4, padding: '6px 8px', color: '#fff', fontSize: 12, marginTop: 4, boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>CHIỀU RỘNG (M):</label>
                  <input
                    type="number"
                    min={6}
                    max={40}
                    step={2}
                    value={selectedElement.width || 14}
                    onChange={(e) => handleUpdateSelectedProperty('width', parseInt(e.target.value) || 14)}
                    style={{
                      width: '100%', background: '#18181b', border: '1px solid #27272a',
                      borderRadius: 4, padding: '6px 8px', color: '#fff', fontSize: 12, marginTop: 4, boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* THUỘC TÍNH DÀNH RIÊNG CHO ĐƯỜNG PHỐ (ROADS) */}
              {selectedElement.type === 'ROAD_STRAIGHT' && (
                <div style={{ background: '#141417', padding: 10, borderRadius: 6, border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8' }}>⚙️ ĐẶC TÍNH ĐƯỜNG PHỐ:</div>

                  {/* Số làn xe (Lanes) */}
                  <div>
                    <label style={{ fontSize: 10, color: '#a1a1aa' }}>SỐ LÀN XE:</label>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {[1, 2, 4].map(lanes => (
                        <button
                          key={lanes}
                          onClick={() => handleUpdateSelectedProperty('lanes', lanes)}
                          style={{
                            flex: 1, background: selectedElement.lanes === lanes ? '#2563eb' : '#1f1f23',
                            border: 'none', color: '#fff', padding: '4px 0', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          {lanes} làn
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tốc độ tối đa */}
                  <div>
                    <label style={{ fontSize: 10, color: '#a1a1aa' }}>TỐC ĐỘ GIỚI HẠN:</label>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {[30, 50, 60, 100].map(speed => (
                        <button
                          key={speed}
                          onClick={() => handleUpdateSelectedProperty('speedLimit', speed)}
                          style={{
                            flex: 1, background: selectedElement.speedLimit === speed ? '#dc2626' : '#1f1f23',
                            border: 'none', color: '#fff', padding: '4px 0', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles: Làn xe đạp, Ray tram, Đường 1 chiều */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#e4e4e7', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedElement.bicycleLane}
                      onChange={(e) => handleUpdateSelectedProperty('bicycleLane', e.target.checked)}
                    />
                    <span>🚲 Có làn xe đạp đỏ (Radwegefurt)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#e4e4e7', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedElement.hasTram}
                      onChange={(e) => handleUpdateSelectedProperty('hasTram', e.target.checked)}
                    />
                    <span>🚋 Có đường ray tàu điện Tram</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#e4e4e7', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedElement.oneWay}
                      onChange={(e) => handleUpdateSelectedProperty('oneWay', e.target.checked)}
                    />
                    <span>➡️ Đường một chiều (Einbahnstraße)</span>
                  </label>

                  {/* Loại mặt đường */}
                  <div>
                    <label style={{ fontSize: 10, color: '#a1a1aa' }}>LOẠI MẶT ĐƯỜNG:</label>
                    <select
                      value={selectedElement.roadType || 'asphalt'}
                      onChange={(e) => handleUpdateSelectedProperty('roadType', e.target.value)}
                      style={{
                        width: '100%', background: '#18181b', border: '1px solid #27272a',
                        borderRadius: 4, padding: '5px 8px', color: '#fff', fontSize: 11, marginTop: 4
                      }}
                    >
                      <option value="asphalt">Nhựa đường tiêu chuẩn (Asphalt)</option>
                      <option value="avenue">Đại lộ đô thị lớn (Grand Avenue)</option>
                      <option value="cobblestone">Phố cổ lát đá cuội (Kopfsteinpflaster)</option>
                      <option value="residential">Đường dân sinh / Phố xe đạp</option>
                    </select>
                  </div>

                  {/* NÚT THAO TÁC NHANH: GẮN VẬT THỂ LÊN ĐOẠN ĐƯỜNG */}
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #27272a', paddingTop: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#38bdf8', letterSpacing: '0.3px' }}>
                      📍 GẮN NHANH VẬT THỂ & VẠCH KẺ:
                    </div>
                    <button
                      onClick={() => handleAddAttachedElement('STOP_LINE')}
                      style={{
                        background: '#1e293b', border: '1px solid #94a3b8', color: '#f8fafc',
                        padding: '6px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <span>🛑</span>
                      <span>Gắn Vạch Dừng Haltelinie (Z. 294)</span>
                    </button>
                    <button
                      onClick={() => handleAddAttachedElement('TRAFFIC_LIGHT')}
                      style={{
                        background: '#1e293b', border: '1px solid #eab308', color: '#fde047',
                        padding: '6px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <span>🚥</span>
                      <span>Gắn Cột Đèn Tín Hiệu StVO § 37</span>
                    </button>
                    <button
                      onClick={() => handleAddAttachedElement('ZEBRA')}
                      style={{
                        background: '#1e293b', border: '1px solid #cbd5e1', color: '#f8fafc',
                        padding: '6px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <span>🚶</span>
                      <span>Gắn Vạch Đi Bộ Zebrastreifen (Z. 293)</span>
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <button
                        onClick={() => handleAddAttachedElement('SIGN_30')}
                        style={{
                          background: '#1e293b', border: '1px solid #ef4444', color: '#fca5a5',
                          padding: '5px 4px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        3️⃣0️⃣ Biển 30
                      </button>
                      <button
                        onClick={() => handleAddAttachedElement('SIGN_50')}
                        style={{
                          background: '#1e293b', border: '1px solid #ef4444', color: '#fca5a5',
                          padding: '5px 4px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        5️⃣0️⃣ Biển 50
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* THUỘC TÍNH DÀNH CHO NÚT GIAO THÔNG (JUNCTIONS) */}
              {(selectedElement.type === 'JUNCTION_AMPEL' || selectedElement.type === 'INTERSECTION_4WAY' || selectedElement.type === 'INTERSECTION_3WAY' || selectedElement.type === 'ROUNDABOUT_4WAY') && (
                <div style={{ background: '#141417', padding: 10, borderRadius: 6, border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b' }}>🚦 LUẬT ƯU TIÊN NÚT GIAO (StVO):</div>

                  <div>
                    <label style={{ fontSize: 10, color: '#a1a1aa' }}>QUY TẮC NHƯỜNG ĐƯỜNG:</label>
                    <select
                      value={selectedElement.priorityRule || (selectedElement.type === 'JUNCTION_AMPEL' ? 'ampel' : 'rechts_vor_links')}
                      onChange={(e) => {
                        handleUpdateSelectedProperty('priorityRule', e.target.value);
                        if (e.target.value === 'ampel') {
                          handleUpdateSelectedProperty('hasTrafficLight', true);
                        }
                      }}
                      style={{
                        width: '100%', background: '#18181b', border: '1px solid #27272a',
                        borderRadius: 4, padding: '5px 8px', color: '#fff', fontSize: 11, marginTop: 4
                      }}
                    >
                      <option value="ampel">🚥 Đèn Tín Hiệu (Lichtzeichenanlage § 37)</option>
                      <option value="rechts_vor_links">👉 Phải Trước Trái (Rechts vor Links § 8)</option>
                      <option value="stop">🛑 Dừng Lại Nhường Đường (STOP Z. 206)</option>
                      <option value="vorfahrt">🔶 Đường Ưu Tiên (Vorfahrtstraße Z. 306)</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#e4e4e7', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!selectedElement.hasTrafficLight || selectedElement.type === 'JUNCTION_AMPEL'}
                      onChange={(e) => handleUpdateSelectedProperty('hasTrafficLight', e.target.checked)}
                    />
                    <span>🚥 Có đèn tín hiệu Ampel ở các góc</span>
                  </label>

                  <button
                    onClick={() => handleAutoEquipJunction(selectedElement)}
                    style={{
                      background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                      border: '1px solid #f59e0b', color: '#ffffff',
                      padding: '8px 10px', borderRadius: 5, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                    }}
                  >
                    <span>⚡</span>
                    <span>Tự Động Gắn 4 Đèn & 4 Vạch Dừng</span>
                  </button>
                </div>
              )}

              {/* THUỘC TÍNH CỘT ĐÈN TÍN HIỆU (TRAFFIC LIGHT) */}
              {selectedElement.type === 'TRAFFIC_LIGHT' && (
                <div style={{ background: '#141417', padding: 10, borderRadius: 6, border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#eab308' }}>🚥 CỘT ĐÈN TÍN HIỆU StVO § 37:</div>

                  <div>
                    <label style={{ fontSize: 10, color: '#a1a1aa' }}>HƯỚNG ĐÈN QUAY MẶT (GÓC BẤT KỲ):</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                      <input
                        type="number"
                        min="-360"
                        max="360"
                        step="0.1"
                        value={Number(selectedElement.rotation || 0).toFixed(1)}
                        onChange={(e) => handleSetRotation(e.target.value)}
                        style={{
                          width: '100%', boxSizing: 'border-box', background: '#18181b',
                          border: '1px solid #334155', borderRadius: 4, padding: '6px 8px',
                          color: '#fff', fontSize: 11, fontWeight: 700
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="359.9"
                        step="0.1"
                        value={Math.min(359.9, normalizeRotation(selectedElement.rotation || 0))}
                        onChange={(e) => handleSetRotation(e.target.value)}
                        style={{ width: '100%', accentColor: '#eab308', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 6 }}>
                      {[
                        { rot: 0, label: 'Bắc ⬆️' },
                        { rot: 90, label: 'Đông ➡️' },
                        { rot: 180, label: 'Nam ⬇️' },
                        { rot: 270, label: 'Tây ⬅️' }
                      ].map(dir => (
                        <button
                          key={dir.rot}
                          onClick={() => handleSetRotation(dir.rot)}
                          style={{
                            background: Math.abs(normalizeRotation(selectedElement.rotation || 0) - dir.rot) < 0.05 ? '#2563eb' : '#1f1f23',
                            border: 'none', color: '#fff', padding: '5px 2px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          {dir.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* THUỘC TÍNH VẠCH DỪNG XE (STOP LINE) */}
              {selectedElement.type === 'STOP_LINE' && (
                <div style={{ background: '#141417', padding: 10, borderRadius: 6, border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#ffffff' }}>🛑 VẠCH DỪNG HALTELINIE (Z. 294):</div>

                  <div>
                    <label style={{ fontSize: 10, color: '#a1a1aa' }}>BỀ RỘNG VẠCH DỪNG (M):</label>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {[3.5, 7.0, 10.5, 14.0].map(w => (
                        <button
                          key={w}
                          onClick={() => handleUpdateSelectedProperty('width', w)}
                          style={{
                            flex: 1, background: selectedElement.width === w ? '#2563eb' : '#1f1f23',
                            border: 'none', color: '#fff', padding: '4px 0', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          {w}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, color: '#a1a1aa' }}>BỀ DÀY VẠCH (CHUẨN StVO 50CM):</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0.3}
                      max={1.5}
                      value={selectedElement.height || 0.6}
                      onChange={(e) => handleUpdateSelectedProperty('height', parseFloat(e.target.value) || 0.6)}
                      style={{
                        width: '100%', background: '#18181b', border: '1px solid #27272a',
                        borderRadius: 4, padding: '5px 8px', color: '#fff', fontSize: 11, marginTop: 4
                      }}
                    />
                  </div>
                </div>
              )}

              {/* THUỘC TÍNH BIỂN BÁO GIAO THÔNG (SIGN) */}
              {selectedElement.type === 'SIGN' && (
                <div style={{ background: '#141417', padding: 10, borderRadius: 6, border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444' }}>🚦 BIỂN BÁO GIAO THÔNG StVO:</div>

                  <div>
                    <label style={{ fontSize: 10, color: '#a1a1aa' }}>LOẠI BIỂN BÁO:</label>
                    <select
                      value={selectedElement.signType || 'SPEED_LIMIT'}
                      onChange={(e) => handleUpdateSelectedProperty('signType', e.target.value)}
                      style={{
                        width: '100%', background: '#18181b', border: '1px solid #27272a',
                        borderRadius: 4, padding: '5px 8px', color: '#fff', fontSize: 11, marginTop: 4
                      }}
                    >
                      <option value="SPEED_LIMIT">⭕ Biển Giới Hạn Tốc Độ (Z. 274)</option>
                      <option value="STOP">🛑 Biển Dừng Lại (STOP Z. 206)</option>
                      <option value="PRIORITY">🔶 Biển Đường Ưu Tiên (Z. 306)</option>
                      <option value="YIELD">🔻 Biển Nhường Đường (Z. 205)</option>
                      <option value="NO_ENTRY">⛔ Biển Cấm Đi Vào (Z. 267)</option>
                      <option value="ONEWAY">➡️ Biển Đường Một Chiều (Z. 220)</option>
                    </select>
                  </div>

                  {selectedElement.signType === 'SPEED_LIMIT' && (
                    <div>
                      <label style={{ fontSize: 10, color: '#a1a1aa' }}>TỐC ĐỘ GIỚI HẠN (KM/H):</label>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        {[30, 50, 70, 100].map(spd => (
                          <button
                            key={spd}
                            onClick={() => handleUpdateSelectedProperty('value', spd)}
                            style={{
                              flex: 1, background: (selectedElement.value || 50) === spd ? '#dc2626' : '#1f1f23',
                              border: 'none', color: '#fff', padding: '4px 0', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            {spd}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* THUỘC TÍNH VẠCH ĐI BỘ (ZEBRA) */}
              {selectedElement.type === 'ZEBRA' && (
                <div style={{ background: '#141417', padding: 10, borderRadius: 6, border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#ffffff' }}>🚶 VẠCH ĐI BỘ ZEBRASTREIFEN (Z. 293):</div>

                  <div>
                    <label style={{ fontSize: 10, color: '#a1a1aa' }}>CHIỀU RỘNG SANG ĐƯỜNG (M):</label>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {[7.0, 10.0, 14.0, 18.0].map(w => (
                        <button
                          key={w}
                          onClick={() => handleUpdateSelectedProperty('width', w)}
                          style={{
                            flex: 1, background: selectedElement.width === w ? '#2563eb' : '#1f1f23',
                            border: 'none', color: '#fff', padding: '4px 0', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          {w}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => handleRotateElement(selectedElement)}
                  style={{
                    background: '#1f1f23', border: '1px solid #27272a', color: '#fff',
                    padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                  title={`Xoay +${rotationStep}°. Phím ] / [ để xoay nhanh`}
                >
                  <RotateCcw size={14} /> Xoay +{rotationStep}°
                </button>

                <button
                  onClick={() => handleDuplicateElement(selectedElement)}
                  style={{
                    background: '#1e3a8a', border: '1px solid #3b82f6', color: '#93c5fd',
                    padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <Copy size={14} /> Nhân Bản Phần Tử (Duplicate)
                </button>

                <button
                  onClick={() => handleDeleteElement(selectedElement.id)}
                  style={{
                    background: '#991b1b', border: '1px solid #dc2626', color: '#fca5a5',
                    padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <Trash2 size={14} /> Xóa Phần Tử
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#71717a', textAlign: 'center', padding: '40px 10px', lineHeight: 1.6 }}>
              Bấm chọn một đoạn đường, nút giao hoặc công trình trên bản đồ để tùy biến thông số chi tiết (chiều dài, làn xe, tốc độ, ray tàu điện...).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
