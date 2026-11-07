import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import {
  ArrowLeft, CheckCircle2, AlertOctagon, RotateCcw, Home, Camera,
  Sun, Moon, CloudRain, AlertTriangle, Lightbulb, Volume2, VolumeX, Eye, Compass,
  Sliders, Move, Crosshair, Save, Map, Upload, Trash2, HelpCircle, BookOpen,
  Settings, X, Sparkles, Check, Car, ShieldCheck, Gauge, Zap, Smartphone, Navigation, Power
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MAPS, SCENARIOS, EXERCISE_CATEGORIES, EXERCISES } from '../simulation/data/index.js';
import { initScore, applyEvent, MAP_SCENARIOS } from './SimScenarios.js';
import audioEngine from './soundEngine.js';
import { VirtualCockpitCluster, SmartRearviewMirror } from './uiComponents.jsx';
import { create3DPlayerCar, createTrafficAICar, makeTrafficLight, drawDigitalCluster, drawSmallClusterScreen, drawInfotainmentScreen } from './3dObjects.js';
import { createSkyGradientTexture } from './textures.js';
import { buildCityWorld, buildCustomMap } from './environment.js';
import { useSeatConfig, DEFAULT_SEAT_CONFIG } from './useSeatConfig.js';
import { QuickGuideModal } from '../ui/SimulationModals.jsx';
import { InGameDrivingTutorial } from './InGameDrivingTutorial.jsx';
import { SaHinhMinimap, DynamicZoneBanner, BERLIN_MITTE_ZONES, detectSaHinhZone, detectBerlinMitteZone, detectZoneForMap } from './SaHinhMinimap.jsx';
import { BerlinMitteOverviewMapModal } from './BerlinMitteOverviewMapModal.jsx';
import { AutobahnOverviewMapModal } from './AutobahnOverviewMapModal.jsx';
import { AutobahnTelemetryHUD } from './AutobahnTelemetryHUD.jsx';
import { TrafficAIManager, buildCorridorsFromMapElements, BERLIN_MITTE_TRAFFIC_CORRIDORS } from '../simulation/trafficAI.js';
import { ExaminerDirectiveHUD } from '../ui/ExaminerDirectiveHUD.jsx';
import { BERLIN_FIXED_SPAWN, BERLIN_DIRECTIVES, getRandomDirective, getDirectiveById, speakExaminerDirective } from '../simulation/data/berlinDirectives.js';
import roadGraphData from '../simulation/data/road_graph.json';
import { roadNetwork } from '../simulation/RoadNetworkGraph.js';
import { examinerEngine } from '../simulation/ExaminerRuleEngine.js';
import { TrafficLightController } from '../simulation/legal/TrafficLightController.js';
import { PriorityResolver } from '../simulation/legal/PriorityResolver.js';
import { GERMAN_FAHRSCHULE_LESSONS, LessonManager } from '../simulation/exam/LessonManager.js';
// 🎨 POST-PROCESSING
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import './sim/sim.css';
import { GLB_STEER_AXIS, _camEyeLocal, _camTargetLocal, _camTargetOffset, _collisionCorners, disposeGroupDeep, snapSpawnToLaneCenter, DRIVING_TIPS } from './sim/simHelpers.js';
import { buildDefaultFahrschuleMap } from '../simulation/saHinhDefaultMap.js';
import { FinishCard } from './sim/FinishCard.jsx';
import { createLoadMapIntoScene } from './sim/createLoadMapIntoScene.js';
import { FlyToModal } from './sim/FlyToModal.jsx';
import { SimHeaderBar } from './sim/SimHeaderBar.jsx';
import { SimLoadingScreen } from './sim/SimLoadingScreen.jsx';
import { StartMenu } from './sim/StartMenu.jsx';
import { SimOptionsMenu } from './sim/SimOptionsMenu.jsx';

export const DrivingSimulation = ({ languageMode = 'vi' }) => {
  const containerRef = useRef(null);
  const isFirstMapMountRef = useRef(true);
  const navigate = useNavigate();
  const location = useLocation();

  const [currentMapId, setCurrentMapId] = useState(() => {
    if (localStorage.getItem('testMapData')) {
      return 'custom_map';
    }
    return location.state?.mapId || "stadt_zentrum";
  });

  // Load test map from localStorage if exists (when clicking Run thử from Map Editor)
  const [customMapData, setCustomMapData] = useState(() => {
    const testMapData = localStorage.getItem('testMapData');
    if (testMapData) {
      try {
        return JSON.parse(testMapData);
      } catch (e) {
        console.error('Error parsing test map data:', e);
        localStorage.removeItem('testMapData');
      }
    }

    // Default Sa Hình Thi Lái Xe Khép Kín (Fahrschule Closed Circuit)
    return buildDefaultFahrschuleMap();
  });



  // 🚀 LAZY INIT: three.js chỉ khởi tạo khi user bấm "BẮT ĐẦU" — không init khi mount
  // (trước đây init chạy ngay trên mount → build 3269 roads sync → menu đơ vài giây)
  const [simStarted, setSimStarted] = useState(false);
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    progress: 15,
    statusText: 'Đang khởi tạo môi trường 3D & buồng lái...',
    tipIndex: 0
  });

  useEffect(() => {
    if (!loadingState.isLoading) return;
    const interval = setInterval(() => {
      setLoadingState(prev => {
        if (!prev.isLoading) return prev;
        const nextProgress = prev.progress < 90
          ? Math.min(90, prev.progress + Math.floor(Math.random() * 8 + 4))
          : prev.progress;
        return {
          ...prev,
          progress: nextProgress,
          tipIndex: (prev.tipIndex + 1) % DRIVING_TIPS.length
        };
      });
    }, 1100);
    return () => clearInterval(interval);
  }, [loadingState.isLoading]);

  useEffect(() => {
    // Safety fallback: đảm bảo loading screen không bao giờ bị kẹt quá 15s kể cả khi mạng chậm
    const timer = setTimeout(() => {
      setLoadingState(prev => {
        if (prev.isLoading) {
          return { ...prev, isLoading: false, progress: 100, statusText: 'Khởi tạo sẵn sàng.' };
        }
        return prev;
      });
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const [activeTab, setActiveTab] = useState("SA_HINH");
  const [activeCategory, setActiveCategory] = useState(EXERCISE_CATEGORIES ? EXERCISE_CATEGORIES[0].id : 'SA_HINH');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isDriving, setIsDriving] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [activeScenario, setActiveScenario] = useState(null);
  const [score, setScore] = useState(100);
  const [events, setEvents] = useState([]);
  const [finished, setFinished] = useState(false);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  // 📱 Nhận diện thiết bị di động (Mobile Web)
  const isMobileDevice = typeof window !== 'undefined' && (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 1024) ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
  );

  // 🎨 Mặc định theo thiết bị: desktop dùng 'normal' (antialias + highp + pixelRatio 1.25x +
  // bóng đổ throttle → hình ảnh đẹp rõ ràng), mobile giữ 'performance' cho 60 FPS.
  // GPU yếu vẫn an toàn nhờ Adaptive DRS tự hạ resolution khi FPS giảm.
  // Đổi quality → effect init WebGL (deps có graphicsQuality) tự rebuild toàn bộ scene
  const [graphicsQuality, setGraphicsQuality] = useState(isMobileDevice ? 'performance' : 'normal');

  const [blinkerLeft, setBlinkerLeft] = useState(false);
  const [blinkerRight, setBlinkerRight] = useState(false);

  const [collision, setCollision] = useState(null);

  const [cameraMode, setCameraMode] = useState('cockpit'); // Góc nhìn thứ nhất (Cockpit) mặc định
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showInGameTutorial, setShowInGameTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showBerlinOverviewMap, setShowBerlinOverviewMap] = useState(false);
  const [showAutobahnOverviewMap, setShowAutobahnOverviewMap] = useState(false);
  const [currentZone, setCurrentZone] = useState(null);
  const [activeDirective, setActiveDirective] = useState(() => getRandomDirective());
  const [examinerScore, setExaminerScore] = useState(100);
  const [examinerFeedback, setExaminerFeedback] = useState(null);
  const [authoritativeSpeedLimit, setAuthoritativeSpeedLimit] = useState(50);
  const [trafficCars, setTrafficCars] = useState([]);

  const handleRandomizeDirective = useCallback(() => {
    const r = refs.current;
    if (!r) return;
    const curZ = r._disableSceneryMoving ? -r.carZ : -(r.distanceTraveled || 0);
    const next = examinerEngine.generateNextDirective(r.carX || 2.5, curZ || 25.0, r.heading || 0);
    setActiveDirective(next);
    setExaminerFeedback(null);
    if (audioEngine) audioEngine.playSuccess?.();
  }, []);
  const [playerCarWorldPos, setPlayerCarWorldPos] = useState({
    x: BERLIN_FIXED_SPAWN.x,
    z: BERLIN_FIXED_SPAWN.z,
    heading: BERLIN_FIXED_SPAWN.rot
  });
  const [autobahnTelemetry, setAutobahnTelemetry] = useState(null);
  const [headlights, setHeadlights] = useState(false);
  const [hazard, setHazard] = useState(false);
  const [weatherMode, setWeatherMode] = useState('day');
  const [_nitroEnergy, setNitroEnergy] = useState(100);
  const [rpm, setRpm] = useState(0);
  const [gear, setGear] = useState('P');
  const [isReverse, setIsReverse] = useState(false);
  const [handbrake, setHandbrake] = useState(true);
  const [gearWarning, setGearWarning] = useState(null);
  const [seatBelt, setSeatBelt] = useState(false);
  const [laneWarning, setLaneWarning] = useState(false);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [selectedPresetMap, setSelectedPresetMap] = useState('stadt_zentrum');

  const showGearWarning = useCallback((msg) => {
    setGearWarning(msg);
    if (refs.current._gearWarnTimer) clearTimeout(refs.current._gearWarnTimer);
    refs.current._gearWarnTimer = setTimeout(() => {
      setGearWarning(null);
    }, 3000);
  }, []);

  const toggleSeatBelt = useCallback(() => {
    setSeatBelt(prev => {
      const next = !prev;
      refs.current.seatBelt = next;
      audioEngine.playSeatbelt(next);
      if (next) {
        showGearWarning({ text: '✓ ĐÃ THẮT DÂY AN TOÀN (Sicherheitsgurt angelegt)', type: 'info' });
      } else {
        showGearWarning({ text: '⚠️ ĐÃ THÁO DÂY AN TOÀN (Sicherheitsgurt abgelegt)', type: 'warn' });
      }
      return next;
    });
  }, [showGearWarning]);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showRearMirror, setShowRearMirror] = useState(false);
  const [headLookAngle, setHeadLookAngle] = useState(0);
  const [mobileToolbarOpen, setMobileToolbarOpen] = useState(false);
  const [dismissRotatePrompt, setDismissRotatePrompt] = useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isPortrait);
    };
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  const [mirrorConfig, setMirrorConfig] = useState({
    yaw: 0,
    pitch: 0,
    target: 'center'
  });

  // 🌟 Low-Tech Minimalist UI States
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showFlyModal, setShowFlyModal] = useState(false);
  const [flyX, setFlyX] = useState(0);
  const [flyZ, setFlyZ] = useState(0);

  const handleFlyToCoords = useCallback((targetX, targetZ) => {
    const r = refs.current;
    if (!r) return;
    const numX = parseFloat(targetX) || 0;
    const numZ = parseFloat(targetZ) || 0;
    const heading = r.heading || 0;

    r.carX = numX;
    r.speed = 0;
    r.targetSpeed = 0;

    if (r._disableSceneryMoving) {
      r.carZ = -numZ;
      if (r.playerCar) {
        r.playerCar.position.set(numX, 0, numZ);
      }
      setPlayerCarWorldPos({ x: numX, z: numZ, heading });
    } else {
      const absZ = Math.abs(numZ);
      r.carZ = absZ;
      r.distanceTraveled = absZ;
      if (r.playerCar) {
        r.playerCar.position.set(numX, 0, 0);
      }
      if (r._scenery) {
        r._scenery.position.z = absZ;
      }
      setPlayerCarWorldPos({ x: numX, z: -absZ, heading });
    }

    // Đồng bộ camera lập tức về vị trí xe mới dịch chuyển
    if (r.camera) {
      const camHeight = r.cameraMode === 'cockpit' ? 1.18 : 1.65;
      const camDist = r.cameraMode === 'cockpit' ? 0.3 : 4.8;
      const worldCarZ = r._disableSceneryMoving ? (r.playerCar?.position?.z || numZ) : 0;
      const camX = numX - camDist * Math.sin(heading);
      const camZ = worldCarZ + camDist * Math.cos(heading);
      r.camera.position.set(camX, camHeight, camZ);
      r.camera.lookAt(numX + 12 * Math.sin(heading), 0.65, worldCarZ - 12 * Math.cos(heading));
    }

    showGearWarning({ text: `🚀 Đã bay xe tới tọa độ X: ${numX}, Z: ${numZ}!`, type: 'info' });
  }, [showGearWarning]);
  const [showQuickTip, setShowQuickTip] = useState(true);
  // Auto-detect PC vs Mobile: hide touch pedals on desktop pointer/keyboard users by default
  const [showTouchControls, setShowTouchControls] = useState(() => {
    if (typeof window === 'undefined') return false;
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
  });

  // Tự động mờ gợi ý 3 bước sau 8 giây
  useEffect(() => {
    if (isDriving) {
      const timer = setTimeout(() => {
        setShowQuickTip(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isDriving]);

  const setSchulterblick = useCallback((targetAngle) => {
    // Nếu bấm lại cùng hướng thì quay về chính diện (0), ngược lại quay tới góc yêu cầu
    const currentTgt = refs.current.headLookTarget || 0;
    const isSame = Math.abs(currentTgt - targetAngle) < 0.18;
    const newAngle = isSame ? 0 : targetAngle;

    refs.current.headLookTarget = newAngle;
    setHeadLookAngle(newAngle);

    // Ghi nhận hoàn thành Schulterblick kiểm tra điểm mù cho bài thi lái xe
    if (newAngle < -0.5) refs.current.schulterblickLeftDone = true;
    if (newAngle > 0.5 && newAngle < 2.0) refs.current.schulterblickRightDone = true;
  }, []);

  const handleAdjustMirror = useCallback((type, val) => {
    setMirrorConfig(prev => {
      let next = { ...prev };
      if (type === 'pitch') {
        next.pitch = Math.max(-15, Math.min(15, next.pitch + val));
      } else if (type === 'yaw') {
        next.yaw = Math.max(-25, Math.min(25, next.yaw + val));
      } else if (type === 'set') {
        next = { ...next, ...val };
      }
      refs.current.mirrorConfig = next;
      return next;
    });
  }, []);

  const handleSelectMirror = useCallback((target) => {
    setMirrorConfig(prev => {
      const next = { ...prev, target };
      refs.current.mirrorConfig = next;
      return next;
    });
  }, []);

  const handleResetMirror = useCallback(() => {
    setMirrorConfig(prev => {
      const next = { ...prev, yaw: 0, pitch: 0 };
      refs.current.mirrorConfig = next;
      return next;
    });
  }, []);

  const toggleRearMirror = useCallback(() => {
    setShowRearMirror(prev => {
      const next = !prev;
      refs.current.showRearMirror = next;
      return next;
    });
  }, []);

  const handleSelectGear = useCallback((mode) => {
    if (mode === 'P') {
      if (refs.current.speed > 5) {
        showGearWarning('⚠️ Vui lòng dừng hẳn xe (tốc độ < 5 km/h) trước khi gài số P!');
        return;
      }
      refs.current.handbrake = true;
      refs.current.isReverse = false;
      refs.current.isNeutral = false;
      refs.current.gear = 'P';
      refs.current._lastGear = 'P';
      refs.current.speed = 0;
      setHandbrake(true);
      setIsReverse(false);
      setGear('P');
      setGearWarning(null);
      audioEngine.playGearShift();
    } else if (mode === 'R') {
      if (!refs.current.isEngineRunning) {
        showGearWarning({ text: '⚠️ Động cơ chưa nổ máy! Hãy về số P và bấm [ Nổ máy ] (Phím I) trước.', type: 'warn' });
        return;
      }
      if (refs.current.speed > 8) {
        showGearWarning('⚠️ Vui lòng giảm tốc hoặc dừng hẳn xe trước khi gài số lùi (R)!');
        return;
      }
      refs.current.handbrake = false;
      refs.current.isReverse = true;
      refs.current.isNeutral = false;
      refs.current.gear = 'R';
      refs.current._lastGear = 'R';
      setHandbrake(false);
      setIsReverse(true);
      setGear('R');
      setGearWarning(null);
      audioEngine.playGearShift();
      showGearWarning({ text: '✓ Đã vào số R (Số lùi). Nhấn ga [ W ] để lùi xe.', type: 'info' });
    } else if (mode === 'N') {
      refs.current.handbrake = false;
      refs.current.isReverse = false;
      refs.current.isNeutral = true;
      refs.current.gear = 'N';
      refs.current._lastGear = 'N';
      setHandbrake(false);
      setIsReverse(false);
      setGear('N');
      setGearWarning(null);
      audioEngine.playGearShift();
      showGearWarning({ text: '✓ Đã về số N (Số Mo - Ngắt truyền động). Đạp ga chỉ rồ máy!', type: 'info' });
    } else if (mode === 'D') {
      if (!refs.current.isEngineRunning) {
        showGearWarning({ text: '⚠️ Động cơ chưa nổ máy! Hãy về số P và bấm [ Nổ máy ] (Phím I) trước khi vào số D.', type: 'warn' });
        return;
      }
      if (refs.current.isReverse && refs.current.speed > 8) {
        showGearWarning('⚠️ Vui lòng dừng xe trước khi gạt sang số tiến (D)!');
        return;
      }
      refs.current.handbrake = false;
      refs.current.isReverse = false;
      refs.current.isNeutral = false;
      refs.current.gear = 'D1';
      refs.current._lastGear = 'D1';
      setHandbrake(false);
      setIsReverse(false);
      setGear('D1');
      setGearWarning(null);
      audioEngine.playGearShift();
      showGearWarning({ text: '✓ Đã vào số D1 (Số tiến). Nhấn giữ GA [ W ] để xe lăn bánh!', type: 'info' });
    }
  }, [showGearWarning]);

  const handleToggleEngine = useCallback(() => {
    if (!refs.current.isEngineRunning) {
      // ── QUY TẮC AN TOÀN Ô TÔ: CHỈ ĐƯỢC NỔ MÁY KHI CẦN SỐ Ở VỊ TRÍ P ──
      const isAtPark = refs.current.gear === 'P' || (refs.current.handbrake && !refs.current.isReverse && !refs.current.isNeutral);
      if (!isAtPark) {
        audioEngine.playBlinker?.();
        showGearWarning({
          text: '⚠️ Chỉ có thể nổ máy khi cần số ở vị trí P (Đỗ xe)! Hãy gạt cần số về [ P ] trước.',
          type: 'warn'
        });
        return;
      }

      audioEngine.init();
      audioEngine.playStarterEngine();
      setIsEngineRunning(true);
      refs.current.isEngineRunning = true;

      // 🔊 Giọng nói Giám khảo sát hạch phát hiệu lệnh rẽ/hướng đi ngay khi tài xế vừa nổ máy xe
      if (activeDirective && activeDirective.commandDe) {
        speakExaminerDirective(activeDirective.commandDe);
      }

      // Động cơ nổ êm ái ở số P (Garanti 850 RPM), giữ nguyên phanh đỗ xe an toàn
      showGearWarning({
        text: '✓ ĐỘNG CƠ ĐÃ NỔ (Số P · Garanti 850 RPM). Gạt cần số sang [ D ] để vào số D1 và lái!',
        type: 'info'
      });
      if (showInGameTutorial) {
        setTutorialStep(2); // Hướng dẫn gạt cần số sang D
      }
    } else {
      // ── TẮT MÁY (STOP ENGINE) ──
      setIsEngineRunning(false);
      refs.current.isEngineRunning = false;
      audioEngine.setEngineSound(0, false, false);
      showGearWarning({ text: '(!) Đã tắt máy xe (Động cơ dừng).', type: 'warn' });
    }
  }, [showGearWarning, showInGameTutorial]);

  const {
    seatConfig,
    setSeatConfig,
    showAdjuster,
    setShowAdjuster,
    activeDragTarget,
    isSavedNotice,
    updateConfigField,
    saveSeatConfig,
    resetSeatConfig,
    applyPreset,
    handlePointerDownDrag
  } = useSeatConfig();

  const refs = useRef({
    trafficLightManager: new TrafficLightController(),
    priorityResolver: new PriorityResolver(),
    lessonManager: new LessonManager(),
    roadNetwork: roadNetwork,
    isDriving: false,
    speed: 0,
    targetSpeed: 0,
    steer: 0,
    targetSteer: 0,
    showRearMirror: false,
    headLookTarget: 0,
    headLookCurrent: 0,
    mirrorConfig: { yaw: 0, pitch: 0, target: 'center' },
    carX: 3.5, // Spawn point
    carZ: 0,
    heading: 0,
    keys: {},
    distanceTraveled: 0,
    scenarioIdx: 0,
    activeScenario: null,
    currentScenarios: Object.values(SCENARIOS),
    scoreState: initScore(),
    collisionOccurred: false,
    _collisionImmunityUntil: 0,
    worldColliders: [],
    crossedCenter: false,
    blinkerLeft: false,
    blinkerRight: false,
    headlights: false,
    hazard: false,
    weatherMode: 'day',
    cameraMode: 'cockpit',
    nitroEnergy: 100,
    isReverse: false,
    handbrake: true,
    isNeutral: false,
    gear: 'P',
    isEngineRunning: false,
    hillRolledBack: false,
    hillPassed: false,
    emergencyBrakeDone: false,
    seatConfig: seatConfig,
    seatBelt: false,
    laneWarning: false,
    playerCar: null,
    aiCars: [],
    trafficLights: [],
    trafficAIManager: null,
    scene: null,
    camera: null
  });
  if (typeof window !== 'undefined') { window.refs = refs; }

  useEffect(() => { refs.current.isDriving = isDriving; }, [isDriving]);
  useEffect(() => { refs.current.gear = gear; }, [gear]);
  useEffect(() => { refs.current.seatBelt = seatBelt; }, [seatBelt]);
  useEffect(() => { refs.current.seatConfig = seatConfig; }, [seatConfig]);
  useEffect(() => { refs.current.currentMapId = currentMapId; }, [currentMapId]);
  useEffect(() => { refs.current.cameraMode = cameraMode; }, [cameraMode]);
  useEffect(() => { refs.current.isReverse = isReverse; }, [isReverse]);
  useEffect(() => { refs.current.handbrake = handbrake; }, [handbrake]);
  useEffect(() => { refs.current.isEngineRunning = isEngineRunning; }, [isEngineRunning]);

  const toggleCameraView = useCallback(() => {
    audioEngine.playLightSwitch();
    setCameraMode(prev => {
      const next = prev === 'chase' ? 'cockpit' : prev === 'cockpit' ? 'hood' : 'chase';
      refs.current.cameraMode = next;
      return next;
    });
  }, []);

  // 🎛️ Xoay vòng chất lượng đồ họa: Siêu nhẹ (performance) → Cân bằng (normal) → Cao (ultra)
  // Đổi state làm effect init WebGL rebuild scene với cấu hình mới
  const toggleGraphicsQuality = useCallback(() => {
    audioEngine.playLightSwitch();
    setGraphicsQuality(prev => prev === 'performance' ? 'normal' : prev === 'normal' ? 'ultra' : 'performance');
  }, []);

  // Clear test map data from localStorage after loading to avoid conflicts
  useEffect(() => {
    if (localStorage.getItem('testMapData')) {
      console.log('🧹 Đã load test map từ localStorage, xóa sau khi load');
      localStorage.removeItem('testMapData');
    }
  }, []);

  const toggleHeadlights = () => {
    audioEngine.playLightSwitch();
    setHeadlights(prev => {
      const next = !prev;
      refs.current.headlights = next;
      return next;
    });
  };

  const toggleHazard = () => {
    audioEngine.playBlinker();
    setHazard(prev => {
      const next = !prev;
      refs.current.hazard = next;
      if (next) {
        setBlinkerLeft(true); refs.current.blinkerLeft = true;
        setBlinkerRight(true); refs.current.blinkerRight = true;
      } else {
        setBlinkerLeft(false); refs.current.blinkerLeft = false;
        setBlinkerRight(false); refs.current.blinkerRight = false;
      }
      return next;
    });
  };

  const toggleWeather = () => {
    audioEngine.playLightSwitch();
    setWeatherMode(prev => {
      const next = prev === 'day' ? 'night' : prev === 'night' ? 'rain' : 'day';
      refs.current.weatherMode = next;
      return next;
    });
  };

  useEffect(() => {
    const dn = e => {
      refs.current.keys[e.key] = true;
      audioEngine.init();

      const code = e.code;
      const key = (e.key || '').toLowerCase();

      // ⚡ Phím I hoặc Enter: Nổ máy xe 1 chạm (Engine Start / Stop)
      if (key === 'i' || code === 'KeyI' || code === 'Enter') {
        handleToggleEngine();
      }

      // Nhấn ga (W / Mũi tên lên) khi xe chưa nổ máy: Nhắc nhở nổ máy trước ở số P
      if (key === 'w' || code === 'KeyW' || code === 'ArrowUp') {
        if (!refs.current.isEngineRunning) {
          const now = Date.now();
          if (!refs.current._lastEngineOffWarn || now - refs.current._lastEngineOffWarn > 2500) {
            refs.current._lastEngineOffWarn = now;
            showGearWarning({
              text: '⚠️ Động cơ chưa nổ máy! Hãy về số P và bấm [ Nổ máy ] (Phím I hoặc Enter) trước khi nhấn ga.',
              type: 'warn'
            });
          }
        }
      }

      // Schulterblick & Quay đầu quan sát
      if (code === 'KeyZ' || key === 'z') {
        const cur = refs.current.headLookTarget || 0;
        setSchulterblick(cur < -0.2 ? 0 : -Math.PI / 2.8);
      }
      if (code === 'KeyX' || key === 'x') {
        const cur = refs.current.headLookTarget || 0;
        setSchulterblick((cur > 0.2 && cur < 2.0) ? 0 : Math.PI / 2.8);
      }
      // Phím C hoặc Mũi tên Xuống: Quay đầu nhìn ra cửa sổ phía sau (Blick nach hinten)
      if (code === 'KeyC' || key === 'c' || code === 'ArrowDown') {
        const cur = refs.current.headLookTarget || 0;
        setSchulterblick(cur > 2.0 ? 0 : Math.PI * 0.95);
      }
      // Phím V: Nếu đang quay đầu thì nhìn thẳng lại; nếu đã thẳng thì đổi góc nhìn camera
      if (code === 'KeyV' || key === 'v') {
        if (Math.abs(refs.current.headLookTarget || 0) > 0.1) {
          setSchulterblick(0);
        } else {
          toggleCameraView();
        }
      }

      if (key === 'l') toggleHeadlights();
      if (key === 'h') toggleHazard();
      if (key === 'b') toggleSeatBelt();
      if (key === 'k') audioEngine.playHorn();
      if (key === 'j' || e.key === 'F2') {
        const roadGen = refs.current.scene?.userData?.roadGen;
        if (roadGen) roadGen.toggleDebug();
      }
      if (key === 'm') {
        const mid = (refs.current?.currentMapId || '').toLowerCase();
        const hasOverview = mid.includes('stadt') || mid.includes('land') || mid.includes('autobahn') || mid === 'sa_hinh_fahrschule';
        if (hasOverview) {
          setShowBerlinOverviewMap(prev => !prev);
        } else {
          toggleRearMirror();
        }
      }
      if (key === 'o') setShowMinimap(prev => !prev);
      if (key === 'g' || (e.shiftKey && key === 'n')) {
        handleRandomizeDirective();
      }
      if (e.key === 'F1' || key === '?' || (e.shiftKey && key === '/')) {
        setShowGuideModal(prev => !prev);
      }

      // Phím tắt chuyển số trên bàn phím:
      // Phím 1 hoặc P: Chuyển sang số P (Park)
      if (key === 'p' || e.key === '1') {
        handleSelectGear('P');
      }

      // Phím 2 hoặc R: Chuyển sang số R (Reverse)
      if (key === 'r' || e.key === '2') {
        handleSelectGear('R');
      }

      // Phím 3 hoặc N: Chuyển sang số N (Neutral)
      if (key === 'n' || e.key === '3') {
        handleSelectGear('N');
      }

      // Phím 4 hoặc D (khi đang ở P, R hoặc N): Chuyển sang số D (Drive)
      if (e.key === '4' || (key === 'd' && (refs.current.handbrake || refs.current.isReverse || refs.current.isNeutral))) {
        handleSelectGear('D');
      }

      if (e.key === 'q' || e.key === 'Q') {
        setBlinkerLeft(prev => {
          const next = !prev; refs.current.blinkerLeft = next;
          if (next) { setBlinkerRight(false); refs.current.blinkerRight = false; audioEngine.playBlinker(); }
          return next;
        });
      }
      if (e.key === 'e' || e.key === 'E') {
        setBlinkerRight(prev => {
          const next = !prev; refs.current.blinkerRight = next;
          if (next) { setBlinkerLeft(false); refs.current.blinkerLeft = false; audioEngine.playBlinker(); }
          return next;
        });
      }
    };
    const up = e => { refs.current.keys[e.key] = false; };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  const handleResumeAfterCollision = () => {
    setCollision(null);
    refs.current.collisionOccurred = false;
    refs.current.steer = 0;
    refs.current.targetSteer = 0;
    refs.current.speed = 0;
    refs.current.targetSpeed = 0;
    refs.current._collisionImmunityUntil = Date.now() + 2000; // 2 giây miễn nhiễm tránh kẹt vòng lặp va chạm
  };

  const handleLoadExercise = (ex) => {
    setSimStarted(true); // 🚀 trigger lazy init
    setSelectedExercise(ex);
    if (refs.current) refs.current.selectedExercise = ex;

    const mapConfig = MAPS[ex.map];
    if (mapConfig) {
      // Cleanup GLB map cũ khi switch map khác
      if (refs.current._customGlbMap && refs.current.scene && mapConfig.id !== 'stadt_zentrum') {
        disposeGroupDeep(refs.current._customGlbMap, true);
        refs.current.scene.remove(refs.current._customGlbMap);
        refs.current._customGlbMap = null;
        console.log("🧹 Đã xóa GLB map khi switch từ stadt sang map khác");
      }

      setCurrentMapId(mapConfig.id);
      if (refs.current) refs.current.currentMapId = mapConfig.id;
    }

    // Autobahn dùng id bản đồ riêng (autobahn_a9/autobahn_a/AUTOBAHN) nhưng key scenario chung là 'AUTOBAHN'
    const scenarioKey = (mapConfig && MAP_SCENARIOS[mapConfig.id])
      ? mapConfig.id
      : (mapConfig?.area === 'AUTOBAHN' && MAP_SCENARIOS.AUTOBAHN) ? 'AUTOBAHN'
      : null;
    const mapScenarios = scenarioKey ? MAP_SCENARIOS[scenarioKey] : [];
    const exScenarios = (ex.scenarios || []).map(sid => SCENARIOS[sid] || mapScenarios.find(s => s.id === sid)).filter(Boolean);
    const firstSc = exScenarios[0] || null;

    const isStadtEnv = (mapConfig?.id === 'stadt_zentrum' || mapConfig?.id === 'STADT' || mapConfig?.id === 'stadt');
    const startPointKey = ex.startPoint || 'start';
    const spawnPos = mapConfig?.spawnPoints?.[startPointKey] || mapConfig?.spawnPoints?.start;
    let startZ = isStadtEnv ? BERLIN_FIXED_SPAWN.z : (spawnPos ? Math.abs(spawnPos.z) : 0);
    let startX = isStadtEnv ? BERLIN_FIXED_SPAWN.x : (spawnPos ? spawnPos.x : 3.5);
    let startRot = isStadtEnv ? BERLIN_FIXED_SPAWN.rot : (spawnPos ? ((spawnPos.rotation || 0) * Math.PI / 180) : 0);

    // 🎯 Căn spawn vào tâm làn cùng hướng (frame world: worldZ = -startZ với map PBF đã load)
    const spawnLaneGraph = refs.current?.scene?.userData?.roadGen?.laneGraph;
    if (spawnLaneGraph) {
      const snapped = snapSpawnToLaneCenter(spawnLaneGraph, startX, -startZ, startRot);
      startX = snapped.x;
      startZ = -snapped.z;
      startRot = snapped.rot;
    }

    setIsReverse(false);
    setHandbrake(true);
    setGear('P');

    if (refs.current) {
      refs.current.carX = startX;
      refs.current.carZ = startZ;
      refs.current.distanceTraveled = startZ;
      refs.current.scenarioIdx = 0;
      refs.current.activeScenario = firstSc;
      refs.current.currentScenarios = exScenarios.length > 0 ? exScenarios : (mapScenarios.length > 0 ? mapScenarios : Object.values(SCENARIOS));
      // 🔑 Reset odometer NGAY LÚC LOAD: tiến trình scenario đo bằng quãng đường tích lũy
      // thật (vòng phố → Auffahrt → A2 → U-turn → Ausfahrt → phố là route khép kín).
      refs.current._odoDist = 0;
      const cfgId = (mapConfig?.id || '').toLowerCase();
      const isSpawnOffsetMap = mapConfig?.area === 'AUTOBAHN' || cfgId.includes('autobahn') || cfgId.includes('land');
      refs.current._scenarioBaseZ = isSpawnOffsetMap ? Math.abs(startZ) : undefined;
      refs.current.isDriving = false;
      refs.current.finished = false;
      refs.current.scoreState = initScore();
      refs.current.schulterblickLeftDone = false;
      refs.current.schulterblickRightDone = false;
      refs.current.stopTimer = 0;
      refs.current.heading = startRot;
      refs.current.steer = 0;
      refs.current.isReverse = false;
      refs.current.handbrake = true;
      refs.current.isNeutral = false;
      refs.current.speed = 0;
      refs.current.hillRolledBack = false;
      refs.current.hillPassed = false;
      refs.current.emergencyBrakeDone = false;
      refs.current._reachedBrakeSpeed = false;

      if (refs.current.playerCar) {
        refs.current.playerCar.position.set(startX, 0, refs.current._disableSceneryMoving ? -startZ : 0);
        refs.current.playerCar.rotation.set(0, -startRot, 0);
      }
      if (refs.current.camera && refs.current._disableSceneryMoving) {
        refs.current.camera.position.set(
          startX - 5.2 * Math.sin(startRot),
          2.2,
          -startZ + 5.2 * Math.cos(startRot)
        );
        refs.current.camera.lookAt(
          startX + 12 * Math.sin(startRot),
          0.8,
          -startZ - 12 * Math.cos(startRot)
        );
      }
      if (refs.current._scenery && !refs.current._disableSceneryMoving) {
        refs.current._scenery.position.z = startZ;
      }
    }

    // Cập nhật tọa độ thực tế cho Radar Minimap & Dynamic Zone ban đầu
    // Dùng refs.current.currentMapId (đã set đồng bộ) thay vì state currentMapId còn giữ map cũ
    const initWorldZ = -startZ;
    setPlayerCarWorldPos({ x: startX, z: initWorldZ, heading: startRot });
    const initZone = detectZoneForMap(refs.current?.currentMapId || currentMapId, startX, initWorldZ);
    setCurrentZone(initZone);
    if (refs.current) refs.current._lastZoneId = initZone?.id;

    // Load Berlin GLB nếu exercise dùng map stadt_zentrum
    if (mapConfig && mapConfig.id === 'stadt_zentrum' && refs.current.loadBerlinMap) {
      setTimeout(() => {
        refs.current.loadBerlinMap();
      }, 100); // Delay nhỏ để đảm bảo scene đã sẵn sàng
    }

    setScore(100);
    setEvents([]);
    setIsDriving(false);
    setFinished(false);
    setDistanceTraveled(startZ);
    setScenarioIdx(0);
    setActiveScenario(firstSc);

    audioEngine.init();
    if (refs.current) refs.current.isDriving = true;
    setIsDriving(true);
  };

  const handleStartExercise = (ex) => handleLoadExercise(ex);
  const handleStartExam = (exam) => handleLoadExercise(exam);
  const handleStartFreeDrive = (envId) => {
    setSimStarted(true); // 🚀 trigger lazy init
    // 🛣️ Autobahn A2 chạy chung engine three.js như bài thi (đồng nhất hành vi):
    // telemetry HUD, lane-keep assist, AI traffic theo làn thật & hộ lan guardrail
    // hoạt động ở cả free-drive thay vì đổ sang engine Babylon song song.
    // 0. Hiển thị loading screen khi nạp bản đồ mới
    if (envId !== currentMapId) {
      setLoadingState({
        isLoading: true,
        progress: 20,
        statusText: `Đang tải môi trường ${envId === 'stadt_zentrum' ? 'Thủ đô Berlin - Rosa-Luxemburg-Platz (Stadt)' :
            (envId === 'autobahn_a' || envId === 'autobahn_a9' || envId === 'AUTOBAHN') ? 'Cao tốc (Autobahn)' :
              (envId === 'training_circuit') ? 'Fahrschule Circuit (Phố ➔ A2 ➔ Phố)' :
                'Sa hình StVO'
          }...`,
        tipIndex: Math.floor(Math.random() * DRIVING_TIPS.length)
      });
    }

    // 1. Cleanup GLB map cũ nếu có (tránh xung đột khi switch map)
    if (refs.current._customGlbMap && refs.current.scene) {
      disposeGroupDeep(refs.current._customGlbMap, true);
      refs.current.scene.remove(refs.current._customGlbMap);
      refs.current._customGlbMap = null;
      console.log("🧹 Đã xóa GLB map cũ khi switch map");
    }

    // 2. Cập nhật Map ID
    setCurrentMapId(envId);
    if (refs.current) {
      refs.current.currentMapId = envId;
    }

    // 3. Chạy hàm load exercise với thông số map mới
    handleLoadExercise({
      id: 'free_drive_' + envId,
      title: 'Freies Fahren',
      map: envId,
      scenarios: []
    });

    // 4. Load Berlin GLB nếu switch sang map stadt_zentrum
    if (envId === 'stadt_zentrum' && refs.current.loadBerlinMap) {
      setTimeout(() => {
        refs.current.loadBerlinMap();
      }, 100); // Delay nhỏ để đảm bảo scene đã sẵn sàng
    }
  };

  const handleJumpToScenario = (scenarioIndex) => {
    const idx = parseInt(scenarioIndex, 10);
    const currentScenarios = refs.current?.currentScenarios || [];
    if (idx >= 0 && idx < currentScenarios.length) {
      const sc = currentScenarios[idx];
      refs.current.distanceTraveled = sc.triggerZ;
      refs.current._odoDist = sc.triggerZ; // Đồng bộ odometer với điểm jump (tiến trình scenario đo bằng odometer)
      refs.current.scenarioIdx = idx;
      refs.current.activeScenario = sc;
      setActiveScenario(sc);
      setScenarioIdx(idx);
    }
  };

  // 🗑️ Xóa Map Custom do Map Editor lưu (localStorage testMapData): khôi phục Sa Hình mặc định
  const handleClearCustomMap = useCallback(() => {
    localStorage.removeItem('testMapData');
    setCustomMapData(buildDefaultFahrschuleMap());
    setCurrentMapId('custom_map');
    setScore(100);
    setEvents([]);
    audioEngine.playSuccess();
    setShowOptionsMenu(false);
  }, []);

  const handleRestartExam = () => {
    const r = refs.current;
    if (!r) return;

    const mapId = r.currentMapId || currentMapId;
    const currentMapDef = MAPS[mapId];
    const activeEx = r.selectedExercise || selectedExercise;
    const isStadtEnv = (mapId === 'stadt_zentrum' || mapId === 'STADT' || mapId === 'stadt');

    let spawnX = 3.5;
    let spawnZ = 0;
    let spawnRot = 0;

    if (isStadtEnv) {
      spawnX = BERLIN_FIXED_SPAWN.x;
      spawnZ = BERLIN_FIXED_SPAWN.z;
      spawnRot = BERLIN_FIXED_SPAWN.rot;
    } else if (activeEx && currentMapDef?.spawnPoints?.[activeEx.startPoint]) {
      const sp = currentMapDef.spawnPoints[activeEx.startPoint];
      spawnX = sp.x;
      spawnZ = sp.z;
      spawnRot = (sp.rotation || 0) * Math.PI / 180;
    } else if (r.playerSpawnPos) {
      spawnX = r.playerSpawnPos.x;
      spawnZ = r.playerSpawnPos.z;
      spawnRot = (r.playerSpawnPos.rotation || 0) * Math.PI / 180;
    } else if (currentMapDef?.spawnPoints?.start) {
      spawnX = currentMapDef.spawnPoints.start.x;
      spawnZ = currentMapDef.spawnPoints.start.z;
      spawnRot = (currentMapDef.spawnPoints.start.rotation || 0) * Math.PI / 180;
    }

    const initCarZ = r._disableSceneryMoving ? -spawnZ : Math.abs(spawnZ);

    r.isDriving = false;
    r.speed = 0;
    r.targetSpeed = 0;
    r.steer = 0;
    r.targetSteer = 0;
    r.carX = spawnX;
    r.carZ = initCarZ;
    r.heading = spawnRot;
    r.keys = {};
    r.distanceTraveled = Math.abs(initCarZ);
    r.scenarioIdx = 0;
    r.activeScenario = null;
    r.scoreState = initScore();
    r.collisionOccurred = false;
    r._collisionImmunityUntil = Date.now() + 3000;
    r.crossedCenter = false;
    r.blinkerLeft = false;
    r.blinkerRight = false;
    r.cameraViewMode = 'cockpit';
    r.headLookTarget = 0;
    r.headLookCurrent = 0;
    r.finished = false;

    if (r.playerCar) {
      r.playerCar.position.set(spawnX, 0, r._disableSceneryMoving ? spawnZ : 0);
      r.playerCar.rotation.set(0, -spawnRot, 0);
    }
    if (r._scenery && !r._disableSceneryMoving) {
      r._scenery.position.z = Math.abs(spawnZ);
    }

    const initWorldZ = r._disableSceneryMoving ? spawnZ : -Math.abs(spawnZ);
    setPlayerCarWorldPos({ x: spawnX, z: initWorldZ, heading: spawnRot });

    setScore(100);
    setEvents([]);
    setFinished(false);
    setActiveScenario(null);
    setIsDriving(false);
    setSpeed(0);
    setCollision(null);
    setScenarioIdx(0);
    setBlinkerLeft(false);
    setBlinkerRight(false);
    setDistanceTraveled(Math.abs(initCarZ));
  };

  useEffect(() => {
    if (!simStarted) return; // 🚀 LAZY INIT: chưa bấm BẮT ĐẦU → không tốn GPU/CPU
    let isMounted = true, renderer, clock, reqId, rearRenderTarget = null, sideMirrorRenderTarget = null;
    let handleResize = null;
    const trafficLights = [];
    const aiCars = [];
    let blinkTimer = 0;

    const init = async () => {
      try {
        setLoadingState(prev => ({
          ...prev,
          isLoading: true,
          progress: Math.max(15, prev.progress || 15),
          statusText: 'Đang khởi tạo môi trường 3D & buồng lái...'
        }));
        clock = new THREE.Clock();
        const scene = new THREE.Scene();

        // 🌅 Physical Atmospheric Sky Shader (Rayleigh & Mie Scattering)
        const sky = new Sky();
        sky.name = 'physicalSky';
        sky.scale.setScalar(450000);
        scene.add(sky);

        const sunElevation = 38;
        const sunAzimuth = 145;
        const sunPhi = THREE.MathUtils.degToRad(90 - sunElevation);
        const sunTheta = THREE.MathUtils.degToRad(sunAzimuth);
        const sunDir = new THREE.Vector3().setFromSphericalCoords(1, sunPhi, sunTheta);

        const skyUniforms = sky.material.uniforms;
        // Trời xanh chuẩn ngày đẹp Đức: turbidity/rayleigh cân bằng, mie thấp hạn chế cháy chân trời
        skyUniforms['turbidity'].value = 2.5;
        skyUniforms['rayleigh'].value = 2.2;
        skyUniforms['mieCoefficient'].value = 0.004;
        skyUniforms['mieDirectionalG'].value = 0.8;
        skyUniforms['sunPosition'].value.copy(sunDir);

        // ⚙️ 3 tier đúng nghĩa: 'performance' (siêu nhẹ, mobile) / 'normal' (cân bằng: antialias
        // + highp + pixelRatio 1.25x + bóng đổ throttle 20fps + IBL) / 'ultra' (cao nhất).
        // Trước đây 'normal' bị gộp vào performance → tier giữa là no-op (không khác gì gì).
        const isPerformance = graphicsQuality === 'performance';
        const isUltra = graphicsQuality === 'ultra';

        // ⚡ Fog & Clip plane: Giới hạn tầm xa 280-380m để Frustum Culling loại bỏ 80% vật thể xa, mượt 60-120 FPS
        const cameraFar = isUltra ? 2000 : (isMobileDevice ? 280 : 380);
        const camera = new THREE.PerspectiveCamera(68, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.05, cameraFar);
        refs.current.camera = camera;

        // 🌤️ SKY BOX PHẢI NẰM TRONG camera.far: Sky scale 450.000km trước đây bị far-plane
        // (380–3500m) cắt hết → "trời" chỉ còn màu nền nhạt (cháy trắng như sương mù).
        // Sky shader là direction-based nên scale nhỏ hơn vẫn hiển thị gradient đầy đủ.
        sky.scale.setScalar(Math.max(260, camera.far * 0.9));
        scene.background = new THREE.Color(0xbcd7ea); // Fallback khớp màu chân trời khi Sky chưa vẽ

        scene.fog = new THREE.Fog(
          0xe0f2fe,
          isUltra ? 300 : (isMobileDevice ? 90 : 130),
          isUltra ? 1800 : (isMobileDevice ? 280 : 380)
        );

        // 💡 Cân bằng sáng với IBL: Hemisphere + Ambient giảm xuống vì scene.environment đã supply ánh sáng môi trường
        const hemiLight = new THREE.HemisphereLight(0xf0f9ff, 0xcbd5e1, 2.3);
        scene.add(hemiLight);

        const sun = new THREE.DirectionalLight(0xfffdf5, 4.2);
        sun.position.set(sunDir.x * 120, 110, sunDir.z * 120);
        if (!isMobileDevice) {
          // Bóng đổ mềm cho desktop (ultra 2048, cân bằng 2048, mobile tắt)
          sun.castShadow = true;
          sun.shadow.mapSize.width = isPerformance ? 1024 : 2048;
          sun.shadow.mapSize.height = isPerformance ? 1024 : 2048;
          sun.shadow.camera.near = 1.0;
          sun.shadow.camera.far = 500;
          const dShadow = 110;
          sun.shadow.camera.left = -dShadow;
          sun.shadow.camera.right = dShadow;
          sun.shadow.camera.top = dShadow;
          sun.shadow.camera.bottom = -dShadow;
          sun.shadow.bias = -0.0003;
          sun.shadow.normalBias = 0.02;
        } else {
          sun.castShadow = false;
        }
        scene.add(sun);
        scene.add(sun.target);

        const ambientFill = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientFill);

        // 1. Camera & Render Target phục vụ gương chiếu hậu trong cabin
        const rearCamera = new THREE.PerspectiveCamera(50, 2.0, 0.2, isPerformance ? 60 : 120);
        refs.current.rearCamera = rearCamera;

        // 🪞 Mirror RT: 1280×640 ultra / 1024×512 normal / 512×256 performance.
        // Renderer chạy ở pixelRatio 1.25–1.75 → RT 512 bị upscale → mờ. Nâng độ phân giải gấp 2.
        const mirrorW = isPerformance ? 512 : (isUltra ? 1280 : 1024);
        const mirrorH = isPerformance ? 256 : (isUltra ? 640 : 512);
        rearRenderTarget = new THREE.WebGLRenderTarget(mirrorW, mirrorH, {
          format: THREE.RGBAFormat,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          samples: isPerformance ? 2 : 4
        });
        refs.current.rearRenderTarget = rearRenderTarget;

        // 2. Camera & Render Target gương cánh — MỌI quality (trước chỉ ultra
        //    → normal gương 2 bên đen/lỗi). Samples 4 = MSAA diệt răng cưa.
        {
          const sideMirrorCamera = new THREE.PerspectiveCamera(44, 256 / 160, 0.2, 100);
          refs.current.sideMirrorCamera = sideMirrorCamera;

          const sw = isPerformance ? 512 : (isUltra ? 1280 : 1024);
          const sh = isPerformance ? 256 : (isUltra ? 640 : 512);
          sideMirrorRenderTarget = new THREE.WebGLRenderTarget(sw, sh, {
            format: THREE.RGBAFormat,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            samples: isPerformance ? 2 : 4
          });
          refs.current.sideMirrorRenderTarget = sideMirrorRenderTarget;
        }

        renderer = new THREE.WebGLRenderer({
          antialias: !isPerformance,
          powerPreference: 'high-performance',
          precision: isPerformance ? 'mediump' : 'highp'
          // 🚀 KHÔNG dùng preserveDrawingBuffer: nó chặn buffer-swap tối ưu của driver
          // (mất 10-30% GPU trên nhiều máy). Capture (__simCapture.capture) đã tự
          // renderer.render() ngay trước toDataURL nên ảnh vẫn chụp được chuẩn.
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.shadowMap.enabled = !isMobileDevice;
        if (isUltra) {
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        } else if (!isPerformance) {
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        refs.current.renderer = renderer;

        // 🌍 IMAGE-BASED LIGHTING: nắm bắt Sky shader thành environment map (PMREM)
        // → phản chiếu trời/xung quanh tự nhiên lên sơn xe, kính, hộ lan & mặt đường PBR
        try {
          const pmrem = new THREE.PMREMGenerator(renderer);
          pmrem.compileEquirectangularShader();
          const envScene = new THREE.Scene();
          scene.remove(sky);
          envScene.add(sky);
          const envRT = pmrem.fromScene(envScene);
          scene.add(sky);
          scene.environment = envRT.texture;
          pmrem.dispose();
        } catch (e) {
          console.warn('[DrivingSimulation] PMREM IBL generation failed, fallback lights only:', e);
        }

        if (typeof window !== 'undefined') {
          window.__simCapture = {
            toggleDebug: (val) => {
              const roadGen = scene.userData?.roadGen;
              if (roadGen) return roadGen.toggleDebug(val);
              return false;
            },
            setCamera: (x, y, z, tx, ty, tz) => {
              refs.current._customCam = { x, y, z, tx, ty, tz };
            },
            resetCamera: () => {
              refs.current._customCam = null;
            },
            startDriving: () => {
              refs.current.isEngineRunning = true;
              refs.current.isDriving = true;
              refs.current.handbrake = false;
              refs.current.isNeutral = false;
              refs.current.isReverse = false;
              refs.current.gear = 'D1';
              refs.current.speed = 28;
              setIsEngineRunning(true);
              setIsDriving(true);
              setHandbrake(false);
              setGear('D1');
              setShowQuickTip(false);
              setShowGuideModal(false);
            },
            capture: () => {
              renderer.render(scene, camera);
              return renderer.domElement.toDataURL('image/png');
            }
          };
          window.refs = refs;
        }

        if (!refs.current.trafficLightManager) {
          refs.current.trafficLightManager = new TrafficLightController();
        }
        if (!refs.current.priorityResolver) {
          refs.current.priorityResolver = new PriorityResolver();
        }
        if (!refs.current.lessonManager) {
          refs.current.lessonManager = new LessonManager();
        }
        refs.current.roadNetwork = roadNetwork;

        // ⚡ Pixel ratio: 0.85 trên điện thoại (giảm 60% GPU fillrate trên màn Retina), 1.0 desktop performance
        const targetPixelRatio = isPerformance
          ? (isMobileDevice ? 0.85 : 1.0)
          : isUltra
            ? Math.min(window.devicePixelRatio, 1.75)
            : Math.min(window.devicePixelRatio, 1.25);
        renderer.setPixelRatio(targetPixelRatio);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;

        // 🎨 POST-PROCESSING: Vignette (+SSAO ở ultra). KHÔNG dùng UnrealBloomPass:
        // Sky shader HDR sáng > threshold ở MỌI ngưỡng (bầu trời vốn HDR) → bloom phủ
        // trắng toàn khung hình (bug "white washout" đã verify bằng ?pp probe).
        // ?pp=none|ssao|bloom|vig — debug thủ công khi cần.
        const _ppParam = new URLSearchParams(window.location.search).get('pp');
        const _ppSet = new Set(_ppParam ? _ppParam.split(',').map(s => s.trim()) : ['vig']);
        let composer = null;
        if (_ppParam !== 'none' && !isPerformance) {
          composer = new EffectComposer(renderer);
          composer.addPass(new RenderPass(scene, camera));
          if (isUltra && _ppSet.has('ssao')) {
            const ssao = new SSAOPass(scene, camera, containerRef.current.clientWidth, containerRef.current.clientHeight);
            ssao.kernelRadius = 0.5;
            ssao.minDistance = 0.002;
            ssao.maxDistance = 0.08;
            composer.addPass(ssao);
          }
          if (_ppSet.has('bloom')) {
            const bloom = new UnrealBloomPass(
              new THREE.Vector2(containerRef.current.clientWidth, containerRef.current.clientHeight),
              0.15, 0.25, 4.0
            );
            composer.addPass(bloom);
          }
          if (_ppSet.has('vig')) {
            const vignetteShader = {
              uniforms: { tDiffuse: { value: null } },
              vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
              fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { vec4 col = texture2D(tDiffuse, vUv); float vig = smoothstep(0.78, 0.38, distance(vUv, vec2(0.5))); col.rgb *= mix(1.0, vig, 0.28); col.rgb = (col.rgb - 0.5) * 1.05 + 0.5; float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114)); col.rgb = mix(vec3(lum), col.rgb, 1.08); gl_FragColor = col; }'
            };
            composer.addPass(new ShaderPass(vignetteShader));
          }
          composer.addPass(new OutputPass());
        }
        // ⚠️ 0.55 là cặp chuẩn với Sky shader HDR (1.05 làm trời nổ trắng hoàn toàn);
        // đèn hemisphere/sun/ambient được tăng bù để scene giữ độ sáng như cũ.
        renderer.toneMappingExposure = 0.35;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        // 🌟 Image-Based Lighting (IBL): Bỏ qua PMREM ở performance để giảm tải shader tính toán phản xạ
        if (!isPerformance) {
          try {
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();
            skyUniforms['showSunDisc'].value = 0;
            const skyEnvTex = pmremGenerator.fromScene(sky, 0.04).texture;
            skyUniforms['showSunDisc'].value = 1;
            scene.environment = skyEnvTex;
            scene.environmentIntensity = 0.20;
            pmremGenerator.dispose();
          } catch (e) {
            console.warn('PMREM Generator warning:', e);
          }
        } else {
          scene.environment = null;
        }

        // ⚡ Shadow optimization: Tắt 100% bóng đổ ở performance mode
        const enableShadows = !isPerformance;
        renderer.shadowMap.enabled = enableShadows;
        if (enableShadows) {
          renderer.shadowMap.type = isUltra ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
          renderer.shadowMap.autoUpdate = false;
          renderer.shadowMap.needsUpdate = true;
          const shadowRes = isUltra ? 2048 : 1024;
          sun.castShadow = true;
          sun.shadow.mapSize.width = shadowRes;
          sun.shadow.mapSize.height = shadowRes;
          sun.shadow.camera.near = 1.0;
          sun.shadow.camera.far = 380;
          sun.shadow.camera.left = -65;
          sun.shadow.camera.right = 65;
          sun.shadow.camera.top = 65;
          sun.shadow.camera.bottom = -65;
          sun.shadow.bias = -0.0004;
          sun.shadow.normalBias = 0.03;
        } else {
          sun.castShadow = false;
        }
        scene.add(sun);
        scene.add(sun.target);

        if (!isMounted) { renderer.dispose(); return; }
        const currentContainer = containerRef.current;
        currentContainer.innerHTML = '';
        currentContainer.appendChild(renderer.domElement);

        let isCarLoaded = false;
        let isSceneReady = false;
        let initFinalized = false;

        const finalizeInit = () => {
          if (initFinalized || !isMounted) return;
          initFinalized = true;

          if (renderer && scene) {
            try {
              if (camera) renderer.compile(scene, camera);
              if (rearCamera) renderer.compile(scene, rearCamera);
              if (camera) renderer.render(scene, camera);
            } catch (e) {
              // ignore compile warning
            }
          }
          setLoadingState(prev => {
            if (prev.isLoading) {
              setTimeout(() => {
                if (isMounted) {
                  setLoadingState(p => ({ ...p, isLoading: false }));
                }
              }, 300);
              return { ...prev, progress: 100, statusText: 'Khởi tạo hoàn tất! Sẵn sàng.' };
            }
            return prev;
          });
        };

        const playerCar = create3DPlayerCar(scene, (loadedCar) => {
          if (loadedCar._mirrorMaterial && rearRenderTarget) {
            loadedCar._mirrorMaterial.map = rearRenderTarget.texture;
            loadedCar._mirrorMaterial.needsUpdate = true;
          }
          if (loadedCar._sideMirrorMaterial && sideMirrorRenderTarget) {
            loadedCar._sideMirrorMaterial.map = sideMirrorRenderTarget.texture;
            loadedCar._sideMirrorMaterial.needsUpdate = true;
          }
          isCarLoaded = true;
          setLoadingState(prev => ({
            ...prev,
            progress: 95,
            statusText: 'Đã nạp xong buồng lái & xe Toyota. Đang hoàn thiện...'
          }));
          if (isSceneReady) {
            finalizeInit();
          }
        }, (pct) => {
          setLoadingState(prev => ({
            ...prev,
            progress: Math.max(prev.progress, Math.min(92, Math.round(15 + pct * 0.77))),
            statusText: `Đang tải mô hình xe Toyota Corolla (${pct}%)...`
          }));
        });
        scene.add(playerCar);
        refs.current.playerCar = playerCar;

        const wheelGroup = refs.current._wheelGroup || null;
        const stalkGroup = refs.current._stalkGroup || null;
        const wiperGroup = refs.current._wiperGroup || null;

        const headLightL = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 4.8, 0.4, 1);
        headLightL.position.set(-0.75, 0.72, -3.78);
        headLightL.target.position.set(-0.75, 0.2, -45);
        playerCar.add(headLightL); playerCar.add(headLightL.target);

        const headLightR = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 4.8, 0.4, 1);
        headLightR.position.set(0.75, 0.72, -3.78);
        headLightR.target.position.set(0.75, 0.2, -45);
        playerCar.add(headLightR); playerCar.add(headLightR.target);

        const cockpitLightL = new THREE.SpotLight(0xffffff, 0, 80, Math.PI / 4.8, 0.4, 1);
        cockpitLightL.position.set(0, 1.2, -0.6);
        cockpitLightL.target.position.set(0, 0.1, -45);
        camera.add(cockpitLightL); camera.add(cockpitLightL.target);

        // 🗺️ XÂY DỰNG HÀM HOT-SWAP MAP VÀO SCENE (KHÔNG TÁI TẠO WEBGL VÀ KHÔNG LOAD LẠI XE COROLLA)
        const loadMapIntoScene = createLoadMapIntoScene({ refs, scene, isPerformance, setPlayerCarWorldPos, setCurrentZone, roadNetwork, examinerEngine, selectedExercise, playerCar, renderer, camera, setActiveDirective, setExaminerFeedback, setExaminerScore });

        refs.current.loadMapIntoScene = loadMapIntoScene;
        refs.current.setCurrentMapId = setCurrentMapId;
        loadMapIntoScene(currentMapId, customMapData);

        refs.current.scene = scene;

        const rainGeo = new THREE.BufferGeometry();
        const rainCount = isPerformance ? 150 : 1500;
        const rainPositions = new Float32Array(rainCount * 3);
        for (let rIdx = 0; rIdx < rainCount * 3; rIdx += 3) {
          rainPositions[rIdx] = (Math.random() - 0.5) * 50;
          rainPositions[rIdx + 1] = Math.random() * 30;
          rainPositions[rIdx + 2] = (Math.random() - 0.5) * 160;
        }
        rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
        const rainMat = new THREE.PointsMaterial({
          color: 0x38bdf8,
          size: 0.22,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending
        });
        const rainParticles = new THREE.Points(rainGeo, rainMat);
        scene.add(rainParticles);

        const pedMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
        const pedHeadMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.8 });
        const pedestrian = new THREE.Group();
        const pedBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.4, 8), pedMat);
        pedBody.position.y = 0.7; pedBody.castShadow = true;
        const pedHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), pedHeadMat);
        pedHead.position.y = 1.6; pedHead.castShadow = true;
        pedestrian.add(pedBody); pedestrian.add(pedHead);
        pedestrian.position.set(-8, 0, -1580);
        scene.add(pedestrian);

        let wiperTime = 0;
        let wheelRotationAngle = 0;
        let lastWeatherMode = null;

        // 🚀 Đánh dấu cảnh 3D đã sẵn sàng và đồng bộ với tiến trình nạp xe Toyota Corolla
        isSceneReady = true;
        if (isCarLoaded) {
          finalizeInit();
        } else {
          // Safety fallback: nếu mạng chậm hoặc lỗi nạp GLTF quá 4.5s, tự động finalize
          setTimeout(() => {
            if (isMounted && !initFinalized) {
              finalizeInit();
            }
          }, 4500);
        }

        let lastFrameTime = performance.now();
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;

        const animate = (now) => {
          reqId = requestAnimationFrame(animate);
          if (now) {
            const elapsed = now - lastFrameTime;
            if (elapsed < frameInterval - 1.5) return;
            lastFrameTime = now - (elapsed % frameInterval);
          }

          const rawDt = clock.getDelta();
          const r = refs.current;

          // 📉 MENU LAG FIX: khi menu chính hiển thị (!isDriving), render chỉ 10 FPS
          // thay vì 60 → DOM menu phản hồi mượt, nền 3D chỉ là preview mờ.
          if (!r.isDriving && r._menuSkipFrames === undefined) r._menuSkipFrames = 0;
          if (!r.isDriving) {
            r._menuSkipFrames = ((r._menuSkipFrames || 0) + 1) % 6;
            if (r._menuSkipFrames !== 0) return; // chỉ render 1/6 frame = 10 FPS
          }

          // ⚡ ADAPTIVE DYNAMIC RESOLUTION (DRS): tự cân pixelRatio theo FPS đo được
          // Cứ ~2.5s: < 45 FPS → hạ 0.12x (tối thiểu 0.6x); > 57 FPS → nâng dần về chuẩn.
          // GPU yếu / màn 4K không còn bị giật lag kéo dài — không cần chỉnh tay Settings.
          r._drsFrames = (r._drsFrames || 0) + 1;
          const drsNow = now || performance.now();
          if (r._drsWindowStart === undefined || drsNow < r._drsWindowStart) {
            r._drsWindowStart = drsNow;
          } else if (drsNow - r._drsWindowStart >= 2500) {
            const measuredFps = (r._drsFrames * 1000) / (drsNow - r._drsWindowStart);
            r._drsFrames = 0;
            r._drsWindowStart = drsNow;
            if (r._drsRatio === undefined) r._drsRatio = targetPixelRatio;
            const baseRatio = r._drsBaseRatio || targetPixelRatio;
            if (measuredFps < 45 && r._drsRatio > 0.6) {
              r._drsRatio = Math.max(0.6, r._drsRatio - 0.12);
              renderer.setPixelRatio(r._drsRatio);
              console.log(`[Perf] 📉 DRS giảm resolution → ${r._drsRatio.toFixed(2)}x (FPS ${Math.round(measuredFps)})`);
            } else if (measuredFps > 57 && r._drsRatio < baseRatio - 0.01) {
              r._drsRatio = Math.min(baseRatio, r._drsRatio + 0.08);
              renderer.setPixelRatio(r._drsRatio);
              console.log(`[Perf] 📈 DRS nâng resolution → ${r._drsRatio.toFixed(2)}x (FPS ${Math.round(measuredFps)})`);
            }
          }
          r._warmupFrames = (r._warmupFrames || 0) + 1;
          const isWarmedUp = r._warmupFrames > 6;
          const dt = isWarmedUp ? Math.min(rawDt, 0.05) : Math.min(rawDt, 0.016);

          // 🌞 SHADOW CAMERA BÁM THEO XE: dịch khung bóng đổ theo vị trí người lái
          // (directional shadow box ±110m quanh xe — bóng sắc nét mọi lúc, không tốn CSM thật)
          if (sun.castShadow && r.playerCar) {
            const px = r.playerCar.position.x, pz = r.playerCar.position.z;
            sun.position.set(px + sunDir.x * 180, 160, pz + sunDir.z * 180);
            sun.target.position.set(px, 0, pz);
            sun.target.updateMatrixWorld();
          }

          // 🌤️ SKY BÁM THEO CAMERA: Sky box giờ nằm trong far-plane (không còn bị cắt) nhưng
          // phải di chuyển theo người lái — nếu không xe lái vài km sẽ ra khỏi hộp trời → mất trời
          if (r.playerCar) {
            sky.position.set(r.playerCar.position.x, 0, r.playerCar.position.z);
          }

          if (r.trafficLightManager) {
            r.trafficLightManager.update(dt);
          }
          const keys = r.keys;
          const cfg = refs.current.seatConfig || DEFAULT_SEAT_CONFIG;

          const isNitro = (keys[' '] || keys['Space']) && r.speed > 30 && r.nitroEnergy > 5;
          const isThrottle = keys['w'] || keys['W'] || keys['ArrowUp'] || isNitro;
          const isBrake = keys['s'] || keys['S'] || keys['ArrowDown'];

          // 🚗 TỰ ĐỘNG HÓA THÔNG MINH (Auto-Drive Assist):
          // Khi người dùng nhấn ga [ W / Mũi tên lên ], nếu xe đang tắt máy hoặc đang ở P/Phanh tay,
          // tự động khởi động máy và vào số D1 để người dùng có thể lái mượt mà ngay tức thì.
          if (isThrottle) {
            if (!r.isEngineRunning) {
              try { audioEngine.init?.(); audioEngine.playStarterEngine?.(); } catch (e) { }
              r.isEngineRunning = true;
              setIsEngineRunning(true);
            }
            if (r.handbrake || r.gear === 'P' || (!r.isDriving && !r.isReverse && !r.isNeutral)) {
              r.handbrake = false;
              r.isDriving = true;
              r.isReverse = false;
              r.isNeutral = false;
              r.gear = 'D1';
              r._lastGear = 'D1';
              setHandbrake(false);
              setIsDriving(true);
              setIsReverse(false);
              setGear('D1');
              setGearWarning(null);
            }
          }

          // ── 1. REALISTIC AUTOMOTIVE POWERTRAIN, ACCELERATION & BRAKING PHYSICS ──
          const VEHICLE_MASS = 1480; // kg (standard European compact sedan)
          const WHEEL_RADIUS = 0.31; // meters (205/55 R16 tire radius)
          const WHEELBASE = 2.65; // meters

          // 1.1 Smooth pedal inputs with mechanical inertia
          const rawThrottle = (isThrottle && r.isEngineRunning) ? 1.0 : 0.0;
          const rawBrake = isBrake ? 1.0 : 0.0;

          // Throttle build-up: ~0.22s to max, releases in ~0.15s
          const throttleRate = rawThrottle > (r.throttleInput || 0) ? 4.6 : 6.8;
          r.throttleInput = (r.throttleInput || 0) + (rawThrottle - (r.throttleInput || 0)) * Math.min(1.0, throttleRate * dt);

          // Brake pedal build-up: firm response in ~0.12s
          const brakeRate = rawBrake > (r.brakeInput || 0) ? 8.8 : 7.5;
          r.brakeInput = (r.brakeInput || 0) + (rawBrake - (r.brakeInput || 0)) * Math.min(1.0, brakeRate * dt);

          let currentVelocity = (r.speed || 0) / 3.6; // m/s
          let tractiveForce = 0; // Driving propulsion force in Newtons
          let brakeForce = 0; // Service brake force in Newtons
          let aeroDrag = 0.38 * currentVelocity * currentVelocity; // Air drag: 1/2 * Cd * A * rho * v^2
          let rollingResistance = (currentVelocity > 0.05) ? (0.015 * VEHICLE_MASS * 9.81 * Math.min(1.0, currentVelocity / 0.5)) : 0;
          let engineBraking = 0;

          // Automatic Transmission Mode & Gear Determination
          let currentGear = 'P';
          let gearRatio = 3.60;

          if (r.handbrake) {
            currentGear = 'P';
            r.speed = 0;
            currentVelocity = 0;
            r.accelX = 0;
          } else if (r.isNeutral) {
            currentGear = 'N';
            tractiveForce = 0;
            engineBraking = 0; // Free coasting in neutral!
            brakeForce = r.brakeInput * 11200;
            if (rawThrottle > 0.1) {
              const now = Date.now();
              if (!r._lastWarnTime || now - r._lastWarnTime > 2500) {
                r._lastWarnTime = now;
                showGearWarning({
                  text: '⚠️ Xe đang ở số N (Số Mo): Đạp ga chỉ rồ máy! Gạt cần số sang [ D ] để chạy.',
                  type: 'warn'
                });
              }
            }
          } else if (r.isReverse) {
            currentGear = 'R';
            gearRatio = 3.40;
            const maxRevSpeedMps = 24.0 / 3.6;
            if (currentVelocity < maxRevSpeedMps) {
              tractiveForce = -r.throttleInput * 3600;
            }
            brakeForce = r.brakeInput * 11000;
            if (r.throttleInput < 0.05 && currentVelocity > 0.1) {
              engineBraking = 420;
            }
          } else if (r.isDriving) {
            // Automatic Drive Mode: D1 -> D2 -> D3 -> D4 -> D5 with hysteresis
            const spdKmh = r.speed || 0;
            const prevD = (r._lastGear && r._lastGear.startsWith('D')) ? r._lastGear : 'D1';

            if (prevD === 'D1') {
              if (spdKmh >= 24) currentGear = 'D2';
              else currentGear = 'D1';
            } else if (prevD === 'D2') {
              if (spdKmh >= 50) currentGear = 'D3';
              else if (spdKmh < 18) currentGear = 'D1';
              else currentGear = 'D2';
            } else if (prevD === 'D3') {
              if (spdKmh >= 80) currentGear = 'D4';
              else if (spdKmh < 42) currentGear = 'D2';
              else currentGear = 'D3';
            } else if (prevD === 'D4') {
              if (spdKmh >= 115) currentGear = 'D5';
              else if (spdKmh < 70) currentGear = 'D3';
              else currentGear = 'D4';
            } else {
              if (spdKmh < 105) currentGear = 'D4';
              else currentGear = 'D5';
            }

            const gearRatios = { D1: 3.60, D2: 2.15, D3: 1.42, D4: 1.00, D5: 0.76 };
            gearRatio = gearRatios[currentGear] || 2.0;

            const gearTractionLookup = {
              D1: 5500, // N — lực kéo tăng ~22%: vào số bền hơn, đạt 130 km/h trên cao tốc nhanh
              D2: 3650,
              D3: 2450,
              D4: 1750,
              D5: 1400
            };
            const maxGearForce = (gearTractionLookup[currentGear] || 2400) + (isNitro ? 2200 : 0);

            // Driving tractive force
            tractiveForce = r.throttleInput * maxGearForce;

            // Torque converter creep in D (nhả phanh tự bò ~5.5 km/h)
            if (r.throttleInput < 0.05 && r.brakeInput < 0.05 && spdKmh < 6.0) {
              tractiveForce += Math.max(0, 320 * (1 - spdKmh / 6.0));
            }

            // Engine braking when throttle released in gear
            if (r.throttleInput < 0.05 && currentVelocity > 0.15) {
              engineBraking = 300 + gearRatio * 90;
            }

            // Service braking force
            brakeForce = r.brakeInput * 11500;
          }

          // 1.2 Longitudinal Net Force & Acceleration: F = m * a
          let accelX = 0;
          if (!r.handbrake) {
            if (r.isReverse) {
              let netForceRev = tractiveForce;
              if (currentVelocity > 0.05) {
                netForceRev += aeroDrag + rollingResistance + engineBraking + brakeForce;
              }
              accelX = netForceRev / VEHICLE_MASS;
              let nextVel = currentVelocity - accelX * dt;
              if (r.brakeInput > 0.1 && nextVel <= 0.05) nextVel = 0;
              currentVelocity = Math.max(0, Math.min(24 / 3.6, nextVel));
            } else {
              let resistiveForces = aeroDrag + rollingResistance + engineBraking;
              let netForce = tractiveForce - resistiveForces - brakeForce;
              accelX = netForce / VEHICLE_MASS;
              let nextVel = currentVelocity + accelX * dt;

              if (tractiveForce < 60 && r.brakeInput > 0.05 && nextVel <= 0.06) {
                nextVel = 0;
                accelX = 0;
              } else if (tractiveForce < 60 && nextVel <= 0.02) {
                nextVel = 0;
                accelX = 0;
              }
              const vehicleMaxSpeedMps = 240 / 3.6; // tốc độ tối đa vật lý của xe (Cao tốc Đức)
              currentVelocity = Math.max(
                0,
                Math.min(vehicleMaxSpeedMps + (isNitro ? 6 : 0), nextVel)
              );
            }
          }

          r.speed = currentVelocity * 3.6;
          r.accelX = accelX;
          const v = currentVelocity;
          const vSigned = r.isReverse ? -v : v;

          // ── 2. SPEED-SENSITIVE STEERING, CASTER SELF-CENTERING & UNDERSTEER ──
          const rawSteerTarget = (keys['a'] || keys['A'] || keys['ArrowLeft']) ? -1.0
            : (keys['d'] || keys['D'] || keys['ArrowRight']) ? 1.0
              : 0.0;

          // Speed-sensitive steering angle limit:
          // Low speed (~0-20 km/h): up to 32° (0.558 rad) for slalom & parking
          // High speed (~100 km/h): ~7° (0.124 rad) — bám làn ổn định, không giật khi chạm A/D
          const currentSpdKmh = r.speed || 0;
          const maxSteerAtSpeed = 0.558 / (1.0 + 0.05 * currentSpdKmh);

          // ── 🛣️ AUTOBAHN LANE INFO & LANE KEEPING ASSIST (Spurhalteassistent) ──
          // Tính vị trí xe so với tâm làn phải của A2 từ road graph OSM thật.
          // Nhả lái (không A/D) trên autobahn: xe tự bám làn phải kiểu pure-pursuit —
          // người lái chỉ cần tập trung ga/phanh & quan sát. Đánh lái = toàn quyền người lái.
          let assistTargetAngle = null;
          r._laneInfo = null;
          const isAutobahnActive = (r.currentMapId || '').toLowerCase().includes('autobahn');
          if (isAutobahnActive && refs.current.roadNetwork?.isReady && r.isDriving && currentSpdKmh > 4) {
            const laneWorldZ = -r.carZ;
            const laneSeg = refs.current.roadNetwork.findNearestSegment(r.carX, laneWorldZ, r.heading);
            if (laneSeg && laneSeg.road && laneSeg.projectedPoint && Array.isArray(laneSeg.road.centerline)) {
              const laneRoad = laneSeg.road;
              const cl = laneRoad.centerline;
              const i0 = Math.min(Math.max(0, laneSeg.segmentIndex ?? 0), cl.length - 2);
              let sdx = cl[i0 + 1][0] - cl[i0][0];
              let sdz = cl[i0 + 1][1] - cl[i0][1];
              const segLen = Math.hypot(sdx, sdz) || 1;
              sdx /= segLen; sdz /= segLen;
              // Căn hướng đoạn đường theo chiều xe đang chạy (motion = (sin h, -cos h))
              const motX = Math.sin(r.heading), motZ = -Math.cos(r.heading);
              if (sdx * motX + sdz * motZ < 0) { sdx = -sdx; sdz = -sdz; }
              // Pháp tuyến phải của hướng chạy: R = (-dz, dx)
              const rnx = -sdz, rnz = sdx;
              const laneWidthM = (laneRoad.width || 14) / (laneRoad.lanes || 3);
              const targetE = (laneRoad.width || 14) / 2 - laneWidthM / 2; // tâm làn phải
              const eRight = (r.carX - laneSeg.projectedPoint[0]) * rnx + (laneWorldZ - laneSeg.projectedPoint[1]) * rnz;
              r._laneInfo = { e: eRight, targetE, laneWidthM, roadWidth: laneRoad.width || 14, highway: laneRoad.highway || '' };

              if (Math.abs(rawSteerTarget) < 0.01 && laneSeg.distance < 25) {
                // Pure pursuit tới điểm nhìn trước trên tâm làn phải
                const lookAhead = Math.min(30, 7 + currentSpdKmh * 0.22);
                const tgx = laneSeg.projectedPoint[0] + sdx * lookAhead + rnx * targetE;
                const tgz = laneSeg.projectedPoint[1] + sdz * lookAhead + rnz * targetE;
                let tdx = tgx - r.carX, tdz = tgz - laneWorldZ;
                const tLen = Math.hypot(tdx, tdz) || 1;
                tdx /= tLen; tdz /= tLen;
                const crossZ = motX * tdz - motZ * tdx;
                const dotP = motX * tdx + motZ * tdz;
                const headingErr = Math.atan2(crossZ, dotP);
                assistTargetAngle = Math.max(-1, Math.min(1, headingErr * 1.5)) * maxSteerAtSpeed * 0.8;
              }
            }
          }

          let currentSteerAngle = r.steerAngle || 0;
          if (Math.abs(rawSteerTarget) > 0.01) {
            const steerBuildRate = 6.2; // rad/s
            const targetAngle = rawSteerTarget * maxSteerAtSpeed;
            currentSteerAngle += (targetAngle - currentSteerAngle) * Math.min(1.0, steerBuildRate * dt);
          } else if (assistTargetAngle !== null) {
            // Spurhalteassistent: bám làn êm tay, chậm hơn lái tay để cảm giác tự nhiên
            currentSteerAngle += (assistTargetAngle - currentSteerAngle) * Math.min(1.0, 3.0 * dt);
          } else {
            // CASTER SELF-CENTERING TORQUE: returns to zero smoothly
            // Returns faster and firmer at higher speeds
            const casterReturnRate = 4.2 + 0.09 * currentSpdKmh; // rad/s
            currentSteerAngle += (0 - currentSteerAngle) * Math.min(1.0, casterReturnRate * dt);
            if (Math.abs(currentSteerAngle) < 0.001) currentSteerAngle = 0;
          }

          r.steerAngle = currentSteerAngle;
          r.steer = currentSteerAngle / 0.558; // normalized [-1, 1]

          // 2.1 Bicycle Kinematics with Tire Lateral Grip Limit (Understeer)
          let yawRate = 0;
          if (v > 0.08) {
            const kinematicYawRate = (v / WHEELBASE) * Math.tan(currentSteerAngle);
            const demandedLatG = v * Math.abs(kinematicYawRate);
            const maxLatG = 7.2; // m/s^2 (~0.73g on dry asphalt) — chặn quay đầu quá mạnh ở tốc độ cao

            let gripRatio = 1.0;
            if (demandedLatG > maxLatG) {
              // Understeer occurs: front tires slip, car cannot rotate as fast as wheels turn
              gripRatio = Math.max(0.24, maxLatG / demandedLatG);
              r._currentSkid = Math.min(1.0, (demandedLatG - maxLatG) / 4.0);
            } else {
              r._currentSkid = (r._currentSkid || 0) * 0.88;
            }

            yawRate = kinematicYawRate * Math.pow(gripRatio, 0.75);

            if (r.isReverse) {
              r.heading -= yawRate * dt;
            } else {
              r.heading += yawRate * dt;
            }
          }
          r.yawRate = yawRate;
          r.lateralG = v * yawRate;

          // ── 3. XOAY VÔ-LĂNG VÀ BÁNH XE GLB (DUAL WHEEL MOTION) ──
          // 3.1 Bẻ lái 2 bánh trước GLB theo góc steering thực tế
          if (playerCar._glbFrontWheels) {
            playerCar._glbFrontWheels.forEach(wheel => {
              wheel.rotation.y = -r.steerAngle;
            });
          }

          // 3.2 XOAY VÔ-LĂNG GLB (Tỉ số truyền lái 14:1)
          if (playerCar._glbSteeringWheel) {
            const sw = playerCar._glbSteeringWheel;
            if (sw._initialQuaternion) {
              sw.quaternion.copy(sw._initialQuaternion);
              sw.rotateOnAxis(GLB_STEER_AXIS, -r.steerAngle * 4.2);
            } else {
              const baseZ = sw._initialRotZ !== undefined ? sw._initialRotZ : 0;
              sw.rotation.z = baseZ - r.steerAngle * 4.2;
            }
          }

          // 3.3 Lăn bánh 4 bánh xe GLB theo tốc độ thực tế (v / R_wheel)
          const wheelDir = r.isReverse ? -1 : 1;
          wheelRotationAngle += wheelDir * (v / WHEEL_RADIUS) * dt;
          if (playerCar._glbAllWheels) {
            playerCar._glbAllWheels.forEach(wheel => {
              wheel.rotation.x = wheelRotationAngle;
            });
          }

          // Tịnh tiến vị trí xe
          r.carX += vSigned * Math.sin(r.heading) * dt;
          if (!r._disableSceneryMoving) {
            r.carX = Math.max(-52.0, Math.min(52.0, r.carX));
          }

          // 📏 ODOMETER: quãng đường tích lũy thực tế (m) — dùng cho tiến trình scenario
          // theo VÒNG (phố → Auffahrt → A2 → U-turn → Ausfahrt → phố). Trước đây dùng
          // |carZ| lệch gốc trên map PBF tọa độ xa & gãy khi route quay đầu (z đảo chiều).
          // Frame có teleport (loop-back) bị skip để odometer không nhảy vọt.
          if (r._odoSkip) {
            r._odoSkip = false;
          } else {
            r._odoDist = (r._odoDist || 0) + Math.abs(vSigned) * dt;
          }

          if (r._scenery && !r._disableSceneryMoving) {
            r._scenery.position.z += vSigned * Math.cos(r.heading) * dt;
            if (r._scenery.position.z > r._LOOP) r._scenery.position.z -= r._LOOP;
            if (r._scenery.position.z < 0) r._scenery.position.z += r._LOOP;
          } else if (r._disableSceneryMoving) {
            // Custom map / Sa hình / Autobahn / Stadt: move car in 3D world
            r.carZ += vSigned * Math.cos(r.heading) * dt;

            // ── HỆ THỐNG XỬ LÝ RANH GIỚI BẢN ĐỒ THÔNG MINH (SMART MAP BOUNDARY HANDLER) ──
            const activeMapId = r.currentMapId;
            const activeBounds = r._scenery?.userData?.mapInfo?.bounds
              || r._scenery?.userData?.roadGraphData?.metadata?.bounds;

            if (activeMapId === 'autobahn_a9' || activeMapId === 'AUTOBAHN' || (activeMapId || '').toLowerCase().includes('autobahn') || r._mapConfig?.hasAutobahn) {
              // 🏎️ AUTOBAHN (Cao tốc 130+ km/h): Loop-back vô tận an toàn (đã kiểm tra va chạm xe AI tại điểm đến)
              // Bỏ qua 3 giây đầu sau khi load map để không teleport xe mới spawn
              const boundaryReady = !r._mapLoadTime || performance.now() - r._mapLoadTime > 3000;
              if (boundaryReady) {
              const b = activeBounds || { minX: -4000, maxX: 4000, minZ: -4000, maxZ: 4000 };
              let teleported = false;
              let targetZ = r.carZ;
              let targetX = r.carX;

              if (r.carZ > b.maxZ - 30) {
                targetZ = b.minZ + 50;
                teleported = true;
              } else if (r.carZ < b.minZ + 30) {
                targetZ = b.maxZ - 50;
                teleported = true;
              }
              if (r.carX > b.maxX - 30) {
                targetX = b.minX + 50;
                teleported = true;
              } else if (r.carX < b.minX + 30) {
                targetX = b.maxX - 50;
                teleported = true;
              }

              if (teleported) {
                // 🛡️ Kiểm tra va chạm với xe AI ở tọa độ lặp điểm đến
                const botCars = refs.current.trafficAIManager?.trafficCars || [];
                const isBlockedByAi = botCars.some(bot => Math.hypot(bot.x - targetX, bot.z - (-targetZ)) < 25.0);
                if (isBlockedByAi) {
                  targetZ += (targetZ < 0 ? 65 : -65);
                }

                r.carX = targetX;
                r.carZ = targetZ;
                r._odoSkip = true; // Odometer không cộng nhảy vọt khi loop-back teleport

                const nowWarn = performance.now();
                if (nowWarn - (r._lastBoundaryWarn || 0) > 4000) {
                  r._lastBoundaryWarn = nowWarn;
                  showGearWarning({
                    text: '🏎️ ĐÃ KẾT NỐI VÒNG LẶP CAO TỐC AUTOBAHN A2 HAMM/RHYNERN (AN TOÀN AI). THOẢI MÁI TĂNG TỐC!',
                    type: 'info'
                  });
                }
              }
              }
            } else if (activeMapId === 'landstrasse_b2' || activeMapId === 'LAND' || (activeMapId || '').toLowerCase().includes('land')) {
              // 🌲 LANDSTRAßE (Đường tỉnh 100 km/h): Connecting loop-back liền mạch & an toàn AI
              const b = activeBounds || { minX: -2000, maxX: 2000, minZ: -2000, maxZ: 2000 };
              let teleported = false;
              let targetZ = r.carZ;
              let targetX = r.carX;

              if (r.carZ > b.maxZ - 25) {
                targetZ = b.minZ + 40;
                teleported = true;
              } else if (r.carZ < b.minZ + 25) {
                targetZ = b.maxZ - 40;
                teleported = true;
              }
              if (r.carX > b.maxX - 25) {
                targetX = b.minX + 40;
                teleported = true;
              } else if (r.carX < b.minX + 25) {
                targetX = b.maxX - 40;
                teleported = true;
              }

              if (teleported) {
                const botCars = refs.current.trafficAIManager?.trafficCars || [];
                const isBlockedByAi = botCars.some(bot => Math.hypot(bot.x - targetX, bot.z - (-targetZ)) < 25.0);
                if (isBlockedByAi) {
                  targetZ += (targetZ < 0 ? 50 : -50);
                }

                r.carX = targetX;
                r.carZ = targetZ;

                const nowWarn = performance.now();
                if (nowWarn - (r._lastBoundaryWarn || 0) > 4000) {
                  r._lastBoundaryWarn = nowWarn;
                  showGearWarning({
                    text: '🌲 ĐÃ NỐI LIỀN TUYẾN ĐƯỜNG TỈNH LANDSTRAßE B2. TIẾP TỤC HÀNH TRÌNH!',
                    type: 'info'
                  });
                }
              }
            } else {
              // 🏙️ STADT (Nội đô 50 km/h) & SA HÌNH & BẢN ĐỒ TỰ TẠO: Soft Wall + Cảnh báo Bitte wenden
              let mapBounds = null;
              if (activeMapId === 'stadt_zentrum' || activeMapId === 'STADT' || activeMapId === 'stadt') {
                const b = activeBounds;
                mapBounds = b
                  ? { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ, name: 'Nội Đô Berlin' }
                  : { minX: -600, maxX: 600, minZ: -600, maxZ: 600, name: 'Nội Đô Berlin' };
              } else if (activeMapId === 'sa_hinh_fahrschule') {
                mapBounds = { minX: -116, maxX: 116, minZ: -243, maxZ: 263, name: 'Sa Hình Fahrschule' };
              } else if (activeMapId === 'custom_map') {
                const cb = r._mapConfig?.boundary;
                mapBounds = cb ? { minX: cb.minX, maxX: cb.maxX, minZ: cb.minCarZ ?? -cb.maxZ, maxZ: cb.maxCarZ ?? -cb.minZ, name: 'Bản Đồ Tự Tạo' }
                  : { minX: -250, maxX: 250, minZ: -80, maxZ: 280, name: 'Bản Đồ Thiết Kế' };
              } else if (activeBounds) {
                // ⚠️ Graph bounds là hệ graph-Z, còn carZ là world-Z = -graphZ → PHẢI ĐẢO DẤU Z
                // (training graph Z[-100,480] → world Z[-480,100]; dùng thẳng sẽ clamp xe về biên sai)
                mapBounds = { minX: activeBounds.minX, maxX: activeBounds.maxX, minZ: -activeBounds.maxZ, maxZ: -activeBounds.minZ, name: 'Bản Đồ StVO' };
              }

              if (mapBounds) {
                let hitBoundary = false;
                if (r.carX <= mapBounds.minX + 5) { r.carX = mapBounds.minX + 5; hitBoundary = true; }
                if (r.carX >= mapBounds.maxX - 5) { r.carX = mapBounds.maxX - 5; hitBoundary = true; }
                if (r.carZ <= mapBounds.minZ + 5) { r.carZ = mapBounds.minZ + 5; hitBoundary = true; }
                if (r.carZ >= mapBounds.maxZ - 5) { r.carZ = mapBounds.maxZ - 5; hitBoundary = true; }

                if (hitBoundary) {
                  if (r.speed > 0) {
                    r.speed *= 0.5;
                    r.targetSpeed = 0;
                  }
                  const nowWarn = performance.now();
                  if (nowWarn - (r._lastBoundaryWarn || 0) > 3000) {
                    r._lastBoundaryWarn = nowWarn;
                    audioEngine.playPenalty?.();
                    showGearWarning({
                      text: `⚠️ BẠN ĐÃ ĐẾN RANH GIỚI BẢN ĐỒ ${mapBounds.name.toUpperCase()}! (BITTE WENDEN - VUI LÒNG QUAY ĐẦU XE)`,
                      type: 'warn'
                    });
                  }
                }
              }
            }
          }

          // ── 3.4 Vật lý Mặt bằng Khu Sa Hình Tổng Hợp & Dốc Đề-pa (Hill Ramp) ──
          let rampElevation = 0;
          let rampPitch = 0;
          if (refs.current._ramps && refs.current._ramps.length > 0) {
            for (const ramp of refs.current._ramps) {
              const rx = r.carX - ramp.centerX;
              const rz = r.carZ - (-ramp.centerZ);
              const halfW = ramp.width / 2 + 1.2;
              const halfL = ramp.length / 2;
              if (Math.abs(rx) <= halfW && Math.abs(rz) <= halfL) {
                const upL = ramp.length / 3;
                const topL = ramp.length / 3;
                const downL = ramp.length / 3;
                const maxH = ramp.maxHeight || 1.1;
                const distFromStart = rz + halfL;

                if (distFromStart >= 0 && distFromStart < upL) {
                  const t = distFromStart / upL;
                  rampElevation = t * maxH;
                  rampPitch = Math.atan2(maxH, upL);
                  // Lực trôi dốc do trọng lực khi nhả phanh
                  if (Math.abs(r.speed) < 6.0 && !isBrake && !r.handbrake) {
                    r.speed -= 0.08 * 60 * dt;
                  }
                  // 🏔️ Đề-pa ngang dốc (Anfahren am Berg): nhả phanh mà ga chưa đủ giữ xe
                  // → xe tuột lùi thật sự theo hướng ngược chiều chạy (lỗi trượt bài khi tuột > 30cm)
                  if (!r.isReverse && (r.throttleInput || 0) < 0.05 && !isBrake && !r.handbrake && r.speed <= 1.2) {
                    if ((r.hillRollbackDist || 0) < 8.0) { // Chặn trôi vô hạn cho gameplay
                      const rollMps = Math.min(2.0, 0.55 + (r.hillRollbackDist || 0) * 0.9);
                      r.hillRollbackDist = (r.hillRollbackDist || 0) + rollMps * dt;
                      r.carX -= Math.sin(r.heading) * rollMps * dt;
                      r.carZ -= Math.cos(r.heading) * rollMps * dt;
                    }
                    r.speed = Math.max(0, r.speed - 6.0 * dt);
                    if (!r.hillRolledBack && (r.hillRollbackDist || 0) >= 0.3) {
                      r.hillRolledBack = true;
                      showGearWarning({ text: '⚠️ Xe tuột dốc! Giữ ga + phanh tay khi đề-pa ngang dốc.', type: 'warn' });
                    }
                  }
                } else if (distFromStart >= upL && distFromStart <= upL + topL) {
                  rampElevation = maxH;
                  rampPitch = 0;
                } else if (distFromStart > upL + topL && distFromStart <= ramp.length) {
                  const t = (distFromStart - (upL + topL)) / downL;
                  rampElevation = (1 - t) * maxH;
                  rampPitch = -Math.atan2(maxH, downL);
                }
                break;
              }
            }
          }

          // 🚨 Phanh khẩn cấp (Gefahrenbremsung): theo dõi trong suốt cửa sổ bài EMERGENCY_BRAKE
          // (trước đây chỉ quét vùng Z cứng 650–750 của map tuyến tính cũ → chết trên world map)
          if (r.activeScenario?.type === 'EMERGENCY_BRAKE') {
            if (r.speed >= 28) {
              r._reachedBrakeSpeed = true;
            }
            if (r._reachedBrakeSpeed && isBrake && r.speed < 2.0) {
              r.emergencyBrakeDone = true;
            }
          }

          // ── 4. Cập nhật vị trí & Hiệu ứng Nhún Chassis ──
          playerCar.position.x = r.carX;
          const carZ = !isNaN(r.carZ) ? r.carZ : 0;
          playerCar.position.z = r._disableSceneryMoving ? -carZ : 0;
          // 🌉 CAO ĐỘ CẦU: sample y mặt đường tại vị trí xe (grid 25m từ graph).
          // Ưu tiên sample LIÊN TỤC với y hiện tại (trọng số |Δy|×2.5 trong sampler)
          // → xe trên cầu Werler giữ y≈5.5, xe trên A2 dưới cầu giữ y≈0.1, không teleport.
          let bridgeY = 0;
          const roadGenInst = r._disableSceneryMoving ? (scene?.userData?.roadGen || null) : null;
          if (roadGenInst && typeof roadGenInst.getElevationAt === 'function' && r.isDriving) {
            const targetY = roadGenInst.getElevationAt(r.carX, -carZ, playerCar.position.y);
            if (r._bridgeY === undefined) r._bridgeY = targetY;
            const dYb = targetY - r._bridgeY;
            r._bridgeY = Math.abs(dYb) > 7 ? targetY : r._bridgeY + dYb * Math.min(1, 8 * dt);
            bridgeY = r._bridgeY;
          } else {
            r._bridgeY = 0;
          }
          playerCar.position.y = rampElevation + bridgeY;
          playerCar.rotation.y = -r.heading;
          playerCar.rotation.x = rampPitch;

          if (playerCar._mercedesModel) {
            const m = playerCar._mercedesModel;
            const userScaleMult = cfg.glbScale !== undefined ? cfg.glbScale : 1.0;
            const baseScale = m._baseScale || 0.8105;
            const finalScale = baseScale * userScaleMult;

            m.scale.set(finalScale, finalScale, finalScale);
            m.rotation.y = ((cfg.glbRotY !== undefined ? cfg.glbRotY : 180.0) * Math.PI) / 180;
            m.position.set(cfg.glbOffsetX || 0.0, cfg.glbOffsetY || 0.0, -1.45 + (cfg.glbOffsetZ || 0.0));

            // 4.1 Hiệu ứng nhún khung xe (Pitch do gia tốc dọc accelX & Roll do lực ly tâm lateralG)
            const targetPitch = Math.max(-0.042, Math.min(0.026, (r.accelX || 0) * 0.0058));
            const targetRoll = Math.max(-0.052, Math.min(0.052, -(r.lateralG || 0) * 0.0058));

            r.chassisPitch = (r.chassisPitch || 0) + (targetPitch - (r.chassisPitch || 0)) * Math.min(1.0, 8.0 * dt);
            r.chassisRoll = (r.chassisRoll || 0) + (targetRoll - (r.chassisRoll || 0)) * Math.min(1.0, 8.5 * dt);

            m.rotation.x = r.chassisPitch;
            m.rotation.z = r.chassisRoll;
          }

          // Phân tích ngã tư
          const currentZ = r._scenery ? r._scenery.position.z : r.distanceTraveled;
          let isAtIntersection = false;
          if (r._crossStreetZ && r._crossStreetZ.length > 0) {
            for (let i = 0; i < r._crossStreetZ.length; i++) {
              if (Math.abs(currentZ - Math.abs(r._crossStreetZ[i])) < 26.0) {
                isAtIntersection = true;
                break;
              }
            }
          }
          r.isAtIntersection = isAtIntersection;

          if (playerCar._brakeL && playerCar._brakeR) {
            const brakeIntensity = isBrake ? 4.5 : 0.4;
            playerCar._brakeL.intensity = brakeIntensity;
            playerCar._brakeR.intensity = brakeIntensity;
          }

          blinkTimer += dt * 2.8;
          const isBlinkOn = Math.floor(blinkTimer) % 2 === 0;

          const blinkerActive = r.blinkerLeft || r.blinkerRight || r.hazard;
          if (blinkerActive && isBlinkOn !== r._lastBlinkTick) {
            r._lastBlinkTick = isBlinkOn;
            audioEngine.playBlinker();
          } else if (!blinkerActive) {
            r._lastBlinkTick = null;
          }

          if (playerCar._blinkerL) {
            const activeL = (r.blinkerLeft || r.hazard) && isBlinkOn;
            playerCar._blinkerL.intensity = activeL ? 3.5 : 0;
          }
          if (playerCar._blinkerR) {
            const activeR = (r.blinkerRight || r.hazard) && isBlinkOn;
            playerCar._blinkerR.intensity = activeR ? 3.5 : 0;
          }

          const mode = r.weatherMode;
          const isNightMode = mode === 'night';
          const isRainMode = mode === 'rain';

          const lightsOn = r.headlights || isNightMode || isRainMode;
          const targetLightIntensity = lightsOn ? 9.5 : 0.0;
          headLightL.intensity = targetLightIntensity;
          headLightR.intensity = targetLightIntensity;
          cockpitLightL.intensity = targetLightIntensity;

          if (lastWeatherMode !== mode) {
            lastWeatherMode = mode;
            const physSky = scene.getObjectByName('physicalSky');
            const activeRoadMat = refs.current._roadMat;
            if (isNightMode) {
              if (physSky) physSky.visible = false;
              scene.background = new THREE.Color(0x020617);
              scene.fog.color.setHex(0x020617);
              hemiLight.intensity = 0.55; sun.intensity = 0.24; rainMat.opacity = 0;
              if (activeRoadMat) { activeRoadMat.roughness = 0.75; activeRoadMat.metalness = 0.1; }
              if (wiperGroup) wiperGroup.rotation.z = -1.2;
            } else if (isRainMode) {
              if (physSky) physSky.visible = false;
              scene.background = new THREE.Color(0x334155);
              scene.fog.color.setHex(0x334155);
              hemiLight.intensity = 1.2; sun.intensity = 1.05; rainMat.opacity = 0.85;
              if (activeRoadMat) { activeRoadMat.roughness = 0.15; activeRoadMat.metalness = 0.65; }
            } else {
              if (physSky) {
                physSky.visible = true;
                scene.background = null;
              } else {
                scene.background = new THREE.Color(0x38bdf8);
              }
              // Trời quang: nắng ấm đủ mạnh + sương mù xanh nhạt hòa với chân trời (tránh xám xịt)
              scene.fog.color.setHex(0xbcd7ea);
              hemiLight.intensity = 2.1; sun.intensity = 4.2; rainMat.opacity = 0;
              if (activeRoadMat) { activeRoadMat.roughness = 0.75; activeRoadMat.metalness = 0.1; }
              if (wiperGroup) wiperGroup.rotation.z = -1.2;
            }
          }

          if (isRainMode) {
            const posArray = rainGeo.attributes.position.array;
            for (let p = 1; p < rainCount * 3; p += 3) {
              posArray[p] -= 55 * dt;
              if (posArray[p] < 0) posArray[p] = 30;
            }
            rainGeo.attributes.position.needsUpdate = true;
            wiperTime += dt * 4;
            if (wiperGroup) {
              const prevWiperZ = wiperGroup.rotation.z;
              wiperGroup.rotation.z = Math.sin(wiperTime) * 0.7;
              if ((prevWiperZ < 0 && wiperGroup.rotation.z >= 0) || (prevWiperZ > 0 && wiperGroup.rotation.z <= 0)) {
                audioEngine.playWiperSweep();
              }
            }
          }

          // 4.3 Đồng bộ cấp số & hiệu ứng chuyển số cơ học (Shift drop effect)
          if (r._lastGear !== currentGear) {
            // Khi xe tự động chuyển số trong chế độ D (D1 -> D2 -> D3...):
            // Hộp số tự động hiện đại chuyển số cơ học êm ái, KHÔNG phát tiếng bíp/click điện tử.
            // Người lái cảm nhận chuyển số tự nhiên qua việc sụt vòng tua máy (RPM shift drop).
            if (r._lastGear && (r._lastGear.startsWith('D') && currentGear.startsWith('D'))) {
              r._shiftDropTimer = 0.35; // 350ms shift drop tự nhiên theo cơ học
            }
            r._lastGear = currentGear;
            setGear(currentGear);
          }

          if (r._shiftDropTimer > 0) {
            r._shiftDropTimer -= dt;
          }

          // 4.4 Tính toán vòng tua máy thực tế (RPM) theo trạng thái P/N/D, tải trọng & tỉ số truyền cơ học
          let calculatedRpm = 0;
          if (r.isEngineRunning) {
            const isParkOrNeutral = r.gear === 'P' || r.isNeutral || (r.handbrake && !r.isReverse);
            if (isParkOrNeutral) {
              // Ở số P hoặc N: ngắt ly hợp hoàn toàn. Đạp ga rồ máy vù tua (free rev ~4000 RPM), nhả ga hồi về garanti 850 RPM
              const targetRev = isThrottle ? 4000 + Math.sin(performance.now() * 0.015) * 200 : 850;
              const revRate = isThrottle ? 12.0 : 8.5;
              r._freeRevRpm = (r._freeRevRpm || 850) + (targetRev - (r._freeRevRpm || 850)) * Math.min(1.0, revRate * dt);
              calculatedRpm = Math.round(r._freeRevRpm);
            } else if (r.isReverse) {
              // Số lùi R: tỉ số truyền 3.40, final drive 3.85, 0 - 24 km/h
              const mechanicalRpm = (v * 3.40 * 3.85 * 60) / (2 * Math.PI * WHEEL_RADIUS);
              const throttleBoost = isThrottle ? 450 : 0;
              calculatedRpm = Math.round(Math.max(850, Math.min(3800, mechanicalRpm + 850 + throttleBoost)));
            } else {
              // Chế độ D (D1 - D5):
              const finalDrive = 3.85;
              const mechanicalRpm = (v * (gearRatio || 2.0) * finalDrive * 60) / (2 * Math.PI * WHEEL_RADIUS);
              // Biến mô trượt (Torque converter slip) khi nhấn ga ở dải tốc độ thấp
              const slipRpm = isThrottle ? Math.max(0, 520 * (1 - Math.min(1.0, r.speed / 45))) : 0;
              // Hiệu ứng giảm vòng tua máy tức thời khi nhảy số (shift drop)
              const shiftDrop = (r._shiftDropTimer > 0) ? Math.sin((r._shiftDropTimer / 0.35) * Math.PI) * 420 : 0;
              const nitroBoost = isNitro ? 1600 : 0;

              let baseRpm = Math.max(850, mechanicalRpm + slipRpm - shiftDrop + nitroBoost);
              if (!isThrottle && r.speed < 1.0) {
                baseRpm = 850;
              }
              calculatedRpm = Math.round(Math.min(7200, baseRpm));
            }
          } else {
            // Động cơ tắt hoàn toàn: RPM = 0
            calculatedRpm = 0;
          }
          r.rpm = calculatedRpm;

          // Tính toán tải trọng động cơ thực tế (Drivetrain Load):
          // P/N: load = 0 (vù tua tự do, không tải, tiếng máy thanh thoát)
          // D/R + Ga: load > 0 (động cơ chịu tải kéo xe, buồng đốt gầm lực trầm ấm)
          // D + Buông ga khi đang chạy: load = -0.15 (hãm động cơ / engine overrun êm ái)
          let engineLoad = 0;
          if (r.isDriving && r.isEngineRunning) {
            if (r.handbrake || r.isNeutral) {
              engineLoad = 0;
            } else if (isThrottle) {
              const accelContribution = Math.max(0, (r.accelX || 0) / 3.5);
              engineLoad = Math.min(1.0, 0.45 + accelContribution * 0.55);
            } else if (r.speed > 5) {
              engineLoad = -0.15;
            }
          }

          // ── CẬP NHẬT HỆ THỐNG ÂM THANH MÔ PHỎNG VẬT LÝ XE HƠI (PROCEDURAL AUDIO) ──
          // Throttled ~30Hz (33ms) để tránh tràn bộ đệm AudioParam IPC của trình duyệt
          const nowAudio = performance.now();
          if (nowAudio - (r._lastAudioParamTime || 0) >= 33) {
            r._lastAudioParamTime = nowAudio;
            audioEngine.setEngineSound(calculatedRpm, r.isDriving && r.isEngineRunning, isThrottle, engineLoad);
            audioEngine.setRoadTireNoise(r.speed, r.isDriving);
            audioEngine.setWindNoise(r.speed);
            // 🏎️ Tiếng rít lốp theo độ trượt (understeer + ESP can thiệp)
            audioEngine.setSkidIntensity(Math.max(r._currentSkid || 0, (r.espActive || r.absActive) ? 0.45 : 0));
            audioEngine.setRainAmbiance(isRainMode && r.isDriving);
            audioEngine.setTireSkid(r._currentSkid);
          }

          // ── TÍNH TOÁN ĐỘ TRƯỢT LỐP & TIẾNG RÍT PHANH GẤP (TIRE SKID) ──
          let targetSkid = 0;
          if (r.isDriving) {
            // Phanh thông thường (service brake) luôn êm ái hoàn toàn, KHÔNG rít lốp.
            // Tiếng rít lốp chỉ xuất hiện khi phanh khẩn cấp cực mạnh (Vollbremsung hãm gắt vượt giới hạn bám),
            // kéo phanh tay trượt bánh ở tốc độ cao, hoặc đánh lái gắt văng đuôi ở tốc độ cao.
            const isHardEmergencyBrake = isBrake && r.speed > 42 && ((r.accelX && r.accelX < -6.0) || r.emergencyBrakeDone);
            const isHandbrakeSlide = r.handbrake && r.speed > 25;
            const isAggressiveDrift = Math.abs(r.steer) > 0.65 && r.speed > 55;

            if (isHardEmergencyBrake) {
              targetSkid = Math.min(0.85, (Math.abs(r.accelX || -6.0) - 5.5) * 0.25);
            } else if (isHandbrakeSlide) {
              targetSkid = Math.min(0.85, (r.speed / 50) * 0.75);
            } else if (isAggressiveDrift) {
              targetSkid = Math.min(0.75, (r.speed / 70) * (Math.abs(r.steer) * 0.85));
            }
          }
          r._currentSkid = (r._currentSkid || 0) * 0.82 + targetSkid * 0.18;
          r._lastSpeed = r.speed;

          if (isNitro) {
            r.nitroEnergy = Math.max(0, r.nitroEnergy - 32 * dt);
          } else if (!isNitro && r.nitroEnergy < 100) {
            r.nitroEnergy = Math.min(100, r.nitroEnergy + 15 * dt);
          }

          if (wheelGroup) wheelGroup.rotation.z = -r.steer * 2.5;
          if (stalkGroup) {
            if (r.blinkerLeft) stalkGroup.rotation.z = -0.3;
            else if (r.blinkerRight) stalkGroup.rotation.z = 0.3;
            else stalkGroup.rotation.z = 0;
          }

          if (r._disableSceneryMoving) {
            r.distanceTraveled = Math.abs(r.carZ);
          } else {
            r.distanceTraveled += v * dt;
          }

          // ── TÍNH TOÁN CẢNH BÁO LÀN ĐƯỜNG (LANE ASSIST) ──
          // Autobahn/PBF: dùng khoảng cách thật tới tâm làn phải từ road graph OSM
          // (cảnh báo khi đè vạch sang trái hoặc chệch ra lề). Map trục Z: vạch tim x = 0.
          let isDriftingLane = Math.abs(r.carX) < 1.0 || Math.abs(r.carX) > 5.2;
          if (r._laneInfo && (r.currentMapId || '').toLowerCase().includes('autobahn')) {
            const { e, targetE, laneWidthM, roadWidth } = r._laneInfo;
            isDriftingLane = Math.abs(e - targetE) > laneWidthM * 0.55 || Math.abs(e) > roadWidth / 2 - 0.7;
          }
          const currentLaneWarning = r.isDriving && r.speed > 5 && isDriftingLane;
          r.laneWarning = currentLaneWarning;

          // ── CẢNH BÁO DÂY AN TOÀN (SEATBELT CHIME) ──
          // Chỉ nhắc nhở chuông 1 lần êm dịu khi xe lăn bánh nhanh (> 15 km/h), không spam chuông liên tục gây khó chịu
          if (r.isDriving && r.speed > 15 && !r.seatBelt) {
            if (!r._hasWarnedBelt) {
              r._hasWarnedBelt = true;
              audioEngine.playSeatbeltChime();
              showGearWarning({ text: '⚠️ CHƯA THẮT DÂY AN TOÀN! (Bấm phím B để thắt)', type: 'warn' });
            }
          } else if (r.seatBelt) {
            r._hasWarnedBelt = false;
          }

          // 🚀 Telemetry Throttle (~15 FPS / 66ms) with State Dirty-Checking:
          // Cực kỳ quan trọng: Chỉ set state khi giá trị hiển thị thực tế thay đổi,
          // giải phóng hoàn toàn gánh nặng Virtual DOM diffing của React 18, giữ Three.js mượt 60 FPS
          const nowPerf = performance.now();
          if (nowPerf - (r._lastTelemetryTime || 0) >= 66) {
            r._lastTelemetryTime = nowPerf;
            const roundSpd = Math.round(r.speed);
            if (r._lastReactSpd !== roundSpd) {
              r._lastReactSpd = roundSpd;
              setSpeed(roundSpd);
            }
            const steppedRpm = Math.round(calculatedRpm / 25) * 25;
            if (r._lastReactRpm !== steppedRpm) {
              r._lastReactRpm = steppedRpm;
              setRpm(steppedRpm);
            }
            const roundDist = Math.round(r.distanceTraveled);
            if (r._lastReactDist !== roundDist) {
              r._lastReactDist = roundDist;
              setDistanceTraveled(roundDist);
            }
            if (r._lastReactLaneWarn !== currentLaneWarning) {
              r._lastReactLaneWarn = currentLaneWarning;
              setLaneWarning(currentLaneWarning);
            }
            if (isNitro || r.nitroEnergy < 100) {
              const roundNitro = Math.round(r.nitroEnergy);
              if (r._lastReactNitro !== roundNitro) {
                r._lastReactNitro = roundNitro;
                setNitroEnergy(roundNitro);
              }
            }

            // 🗺️ Cập nhật Radar Minimap & Dynamic Zone Detection
            const isSaHinh = (r.currentMapId === 'sa_hinh_fahrschule' || currentMapId === 'sa_hinh_fahrschule');
            const isStadt = (r.currentMapId === 'stadt_zentrum' || currentMapId === 'stadt_zentrum' || r.currentMapId === 'STADT' || currentMapId === 'STADT' || r.currentMapId === 'stadt' || currentMapId === 'stadt');
            const isAutobahnWorld = ((r.currentMapId || '') + (currentMapId || '')).toLowerCase().includes('autobahn');
            if (isSaHinh || isStadt || isAutobahnWorld) {
              const curPosZ = r._disableSceneryMoving ? -r.carZ : 0;
              setPlayerCarWorldPos({
                x: r.carX,
                z: curPosZ,
                heading: r.heading
              });

              // Dùng refs.current.currentMapId (đồng bộ) — closure currentMapId có thể là map cũ khi switch map
              const zone = detectZoneForMap(r.currentMapId || currentMapId, r.carX, curPosZ);
              if (r._lastZoneId !== zone?.id) {
                r._lastZoneId = zone?.id;
                setCurrentZone(zone);
              }

              // 👨‍✈️ CẬP NHẬT KIỂM TRA ĐÁNH GIÁ STVO THỰC TẾ (LIVE EXAMINER EVALUATION)
              let speedLimitForFrame = 50;
              const activeRuleResolver = scene?.userData?.ruleResolver || refs.current.ruleResolver;
              if (activeRuleResolver && activeRuleResolver.laneGraph) {
                const nearest = activeRuleResolver.laneGraph.findNearestLane(r.carX, curPosZ, r.heading);
                if (nearest && nearest.lane) {
                  const res = activeRuleResolver.getSpeedLimit({
                    lane: nearest.lane,
                    distAlongLane: nearest.dist
                  });
                  speedLimitForFrame = res.value;
                } else if (examinerEngine.currentDirective?.speedLimit) {
                  speedLimitForFrame = examinerEngine.currentDirective.speedLimit;
                }
              } else if (examinerEngine.currentDirective?.speedLimit) {
                speedLimitForFrame = examinerEngine.currentDirective.speedLimit;
              } else if (activeScenario?.limit) {
                speedLimitForFrame = activeScenario.limit;
              }

              // 🛣️ Autobahn MAINLINE (motorway/link): Richtgeschwindigkeit 130 km/h khuyến nghị.
              // Đường phố trong map autobahn (Rhynern) → giữ limit từ resolver (50 km/h).
              // Trước đây override theo mapId → vào phố vẫn hiện 130 (sai StVO).
              const nearRoadSeg = refs.current.roadNetwork?.isReady
                ? refs.current.roadNetwork.findNearestSegment(r.carX, curPosZ, r.heading)
                : null;
              if (nearRoadSeg?.road && (nearRoadSeg.road.highway === 'motorway' || nearRoadSeg.road.highway === 'motorway_link')) {
                speedLimitForFrame = 130;
              }

              if (r._lastAuthoritativeSpeed !== speedLimitForFrame) {
                r._lastAuthoritativeSpeed = speedLimitForFrame;
                setAuthoritativeSpeedLimit(speedLimitForFrame);
              }

              if (isStadt && r.isDriving) {
                if (!r._trafficLightController) {
                  r._trafficLightController = new TrafficLightController();
                }
                if (!r._priorityResolver) {
                  r._priorityResolver = new PriorityResolver(scene?.userData?.roadGen?.laneGraph);
                }

                // 🚦 Cập nhật đèn giao thông real-time StVO § 37
                r._trafficLightController.update(dt, scene?.userData?.roadGen?.trafficLightMeshes);

                // ⚖️ Kiểm tra quyền ưu tiên StVO § 8 (Rechts vor Links & STOP Sign)
                const currentRoad = examinerEngine.nearestRoad;
                const upcomingJunction = examinerEngine.upcomingJunction;
                const botCars = r.trafficAIManager ? r.trafficAIManager.trafficCars : [];
                const priorityResult = r._priorityResolver.evaluatePriority(
                  { x: r.carX, z: curPosZ, heading: r.heading, speed: r.speed, hasStoppedComplete: (r.speed < 0.8) },
                  currentRoad,
                  upcomingJunction,
                  botCars
                );

                if (!priorityResult.canProceed && r.speed > 8) {
                  if (nowPerf - (r._lastPriorityWarn || 0) > 4000) {
                    r._lastPriorityWarn = nowPerf;
                    setExaminerFeedback({
                      titleVi: priorityResult.messageVi,
                      titleDe: priorityResult.messageDe,
                      rule: priorityResult.ruleCode,
                      severity: 'WARN'
                    });
                    if (audioEngine) audioEngine.playWarning?.();
                  }
                }

                examinerEngine.update(dt, {
                  x: r.carX,
                  z: curPosZ,
                  heading: r.heading,
                  speed: r.speed,
                  blinkerLeft: r.blinkerLeft,
                  blinkerRight: r.blinkerRight,
                  headLookAngle: r.headLookCurrent || 0,
                  isDriving: r.isDriving,
                  isReverse: r.isReverse,
                  authoritativeSpeedLimit: speedLimitForFrame
                });

                if (examinerEngine.currentDirective && examinerEngine.currentDirective.id !== activeDirective?.id) {
                  setActiveDirective({ ...examinerEngine.currentDirective });
                }
                if (examinerEngine.score !== examinerScore) {
                  setExaminerScore(examinerEngine.score);
                }
                if (examinerEngine.recentFeedback !== examinerFeedback) {
                  setExaminerFeedback(examinerEngine.recentFeedback);
                }
              }
            }
          }

          // ── 🏎️ CẬP NHẬT REALTIME AUTOBAHN TELEMETRY HUD (~10 FPS) ──
          const nowTelemetryTick = performance.now();
          if (nowTelemetryTick - (r._lastTelemetryUiUpdate || 0) > 100) {
            r._lastTelemetryUiUpdate = nowTelemetryTick;
            const curPosZ = r._disableSceneryMoving ? -r.carZ : -(r._scenery ? r._scenery.position.z : r.distanceTraveled);
            const headingDeg = ((r.heading * 180 / Math.PI) % 360 + 360) % 360;

            let roadId = 'N/A';
            let highwayType = 'N/A';
            let laneId = 'N/A';
            let laneIndex = 0;
            let isRamp = false;

            if (refs.current.roadNetwork && refs.current.roadNetwork.isReady) {
              const nearSeg = refs.current.roadNetwork.findNearestSegment(r.carX, curPosZ, r.heading);
              if (nearSeg && nearSeg.road) {
                const nr = nearSeg.road;
                roadId = nr.name || nr.id || 'N/A';
                highwayType = nr.highway || 'N/A';
                isRamp = highwayType === 'motorway_link';
                const laneCount = nr.lanes ? parseInt(nr.lanes, 10) : 0;
                laneIndex = Number.isFinite(laneCount) && laneCount > 0 ? laneCount : 0;
                laneId = laneIndex > 0 ? `lane_${laneIndex}` : 'N/A';
              }
            }

            setAutobahnTelemetry({
              carX: r.carX || 0,
              carZ: curPosZ || 0,
              headingDeg,
              roadId,
              highwayType,
              laneId,
              laneIndex,
              speedKmH: (r.speed || 0) * 3.6,
              isRamp,
              junctionTransition: isRamp ? 'MOTORWAY_LINK' : 'MAINLINE'
            });
          }

          // ── CẬP NHẬT AI XE BOT THAM GIA GIAO THÔNG (Di chuyển liên tục trong World Space) ──
          if (refs.current.trafficAIManager) {
            const curPosZ = refs.current._disableSceneryMoving ? -r.carZ : -(refs.current._scenery ? refs.current._scenery.position.z : refs.current.distanceTraveled);
            refs.current.trafficAIManager.update(dt, { x: r.carX, z: curPosZ });

            // Throttle cập nhật trạng thái xe cho Radar Minimap và Overview Modal (~10 FPS)
            const nowTrafficTick = performance.now();
            if (nowTrafficTick - (r._lastTrafficUiUpdate || 0) > 100) {
              r._lastTrafficUiUpdate = nowTrafficTick;
              const states = refs.current.trafficAIManager.getTrafficStates();
              setTrafficCars(states);
            }

            // Tính khoảng cách xe bám đuôi gần nhất phía sau cho Gương chiếu hậu
            let closestBehind = null;
            refs.current.trafficAIManager.botCars.forEach(bot => {
              const dz = bot.mesh.position.z - curPosZ;
              const dx = Math.abs(bot.mesh.position.x - r.carX);
              if (dz > 0 && dz < 65 && dx < 3.5) {
                const d = Math.round(dz);
                if (closestBehind === null || d < closestBehind) {
                  closestBehind = d;
                }
              }
            });
            refs.current.trafficBehindDist = closestBehind;
          } else {
            aiCars.forEach((ai) => {
              let targetSpd = ai.baseSpeed || 13.8; // Tốc độ chuẩn 50 km/h (13.8 m/s)

              // 1. Dừng trước vạch khi gặp đèn đỏ tại ngã tư
              const trafficLightState = refs.current._trafficLightRed;
              const lightZ = -100;
              const distToLight = Math.abs(ai.mesh.position.z - lightZ);
              if (trafficLightState && distToLight < 20 && ai.mesh.position.z > lightZ) {
                targetSpd = 0;
              }

              // 2. Giữ khoảng cách an toàn tránh va chạm với xe người lái
              const playerZ = -refs.current.carZ;
              const distToPlayer = Math.abs(ai.mesh.position.z - playerZ);
              if (!ai.isOpposite && distToPlayer < 14 && Math.abs(ai.mesh.position.x - r.carX) < 2.5) {
                targetSpd = Math.min(targetSpd, Math.max(0, v * 0.8));
              }

              // Nội suy tốc độ mượt mà
              ai.currentSpeed += (targetSpd - ai.currentSpeed) * Math.min(1, 4.0 * dt);

              // 3. Di chuyển độc lập trong World Space:
              const pZ = -refs.current.carZ;
              if (ai.isOpposite) {
                // Xe ngược chiều di chuyển từ Z âm về Z dương
                ai.mesh.position.z += ai.currentSpeed * dt;
                if (ai.mesh.position.z > pZ + 80) {
                  ai.mesh.position.z = pZ - 380 - Math.random() * 150;
                }
              } else {
                // Xe cùng chiều di chuyển từ Z dương về Z âm
                ai.mesh.position.z -= ai.currentSpeed * dt;
                if (ai.mesh.position.z > pZ + 90) {
                  ai.mesh.position.z = pZ - 280 - Math.random() * 150;
                } else if (ai.mesh.position.z < pZ - 550) {
                  ai.mesh.position.z = pZ + 60;
                }
              }
            });

            // Tính khoảng cách xe bám đuôi gần nhất phía sau (cho Gương chiếu hậu thông minh)
            let closestBehind = null;
            const playerZ = -refs.current.carZ;
            aiCars.forEach((ai) => {
              if (!ai.isOpposite && ai.mesh.position.z > playerZ && (ai.mesh.position.z - playerZ) < 65) {
                const d = Math.round(ai.mesh.position.z - playerZ);
                if (closestBehind === null || d < closestBehind) {
                  closestBehind = d;
                }
              }
            });
            refs.current.trafficBehindDist = closestBehind;
          }

          r.headLookCurrent += (r.headLookTarget - r.headLookCurrent) * 10 * dt;

          if (refs.current._cockpit) {
            refs.current._cockpit.position.set(
              cfg.seatOffsetX !== undefined ? cfg.seatOffsetX : -0.38,
              cfg.seatOffsetY !== undefined ? cfg.seatOffsetY : 1.16,
              cfg.seatOffsetZ !== undefined ? cfg.seatOffsetZ : -1.48
            );
          }

          // ── 5. Camera View Update ──
          camera.up.set(0, 1, 0);

          const currentCamMode = refs.current.cameraMode || cameraMode || 'chase';
          const carZVal = !isNaN(r.carZ) ? r.carZ : 0;
          const carPosZ = r._disableSceneryMoving ? (playerCar.position.z || -carZVal) : 0;

          if (r._customCam) {
            camera.position.set(r._customCam.x, r._customCam.y, r._customCam.z);
            camera.lookAt(r._customCam.tx, r._customCam.ty, r._customCam.tz);
          } else if (currentCamMode === 'cockpit') {
            // ── GÓC NHÌN THỨ 1 (COCKPIT / INTERIOR DRIVER SEAT) ──
            if (refs.current._cockpit) refs.current._cockpit.visible = true;
            playerCar.visible = true;

            const seatX = cfg.seatOffsetX !== undefined ? cfg.seatOffsetX : -0.38;
            const seatY = cfg.seatOffsetY !== undefined ? cfg.seatOffsetY : 1.18;
            const seatZ = cfg.seatOffsetZ !== undefined ? cfg.seatOffsetZ : -1.50;

            const headAngle = r.headLookCurrent || 0;
            // Khi quay đầu nhìn sau (headAngle > 2.0 rad), người lái tự nhiên hơi nghiêng vào giữa xe để nhìn qua khe 2 ghế
            const isLookingBack = Math.abs(headAngle) > 2.0;
            const eyeShiftX = isLookingBack ? 0.10 : 0.0;
            const basePitch = isLookingBack ? 0.0 : (cfg.seatPitch !== undefined ? cfg.seatPitch * 0.045 : -0.11);
            const pitchOffset = basePitch + (r.chassisPitch || 0) * 0.35;

            // Tọa độ mắt và hướng nhìn chuẩn trong hệ trục Local của xe (playerCar)
            // (dùng scratch vector — tránh new Vector3 mỗi frame gây GC spike)
            _camEyeLocal.set(seatX + eyeShiftX, seatY, seatZ);
            _camTargetLocal.set(
              seatX + eyeShiftX + 25 * Math.sin(headAngle),
              seatY + pitchOffset,
              seatZ - 25 * Math.cos(headAngle)
            );

            // Chuyển đổi chính xác sang World Space:
            // Khắc phục triệt để lỗi góc xoay cam khi đánh vô-lăng, cam gắn cố định tại mắt người lái
            playerCar.updateMatrixWorld(true);
            const worldEye = _camEyeLocal.applyMatrix4(playerCar.matrixWorld);
            const worldTarget = _camTargetLocal.applyMatrix4(playerCar.matrixWorld);

            // Lực quán tính nghiêng đầu tài xế theo lực ly tâm khi vào cua (lateral G head tilt)
            camera.up.set(Math.sin((r.chassisRoll || 0) * 0.22), Math.cos((r.chassisRoll || 0) * 0.22), 0);
            camera.position.copy(worldEye);
            // Rung micro theo mat duong: bien do theo toc do, pha theo quang duong (<= 2cm)
            const bumpAmp = Math.min(0.02, (r.speed || 0) * 0.0009);
            if (bumpAmp > 0.002) {
              camera.position.y += Math.sin((r.distanceTraveled || 0) * 2.1) * bumpAmp
                + Math.sin((r.distanceTraveled || 0) * 5.3) * bumpAmp * 0.35;
            }
            camera.lookAt(worldTarget);
          } else if (currentCamMode === 'hood') {
            // ── GÓC NHÌN NẮP CAPO (HOOD) ──
            if (refs.current._cockpit) refs.current._cockpit.visible = false;
            playerCar.visible = true;

            _camEyeLocal.set(0, 0.72, -2.6);
            _camTargetLocal.set(0, 0.65, -27.6);
            playerCar.updateMatrixWorld(true);
            const hoodEye = _camEyeLocal.applyMatrix4(playerCar.matrixWorld);
            const hoodTarget = _camTargetLocal.applyMatrix4(playerCar.matrixWorld);

            camera.position.copy(hoodEye);
            camera.lookAt(hoodTarget);
          } else {
            // ── GÓC NHÌN THỨ 3 (CHASE BEHIND CAR) ──
            if (refs.current._cockpit) refs.current._cockpit.visible = false;
            playerCar.visible = true;

            const rampY = playerCar.position.y || 0;
            const camDist = cfg.chaseCamZ || 4.8;
            const camHeight = cfg.chaseCamY || 1.65;

            if (r._disableSceneryMoving) {
              const targetCamX = r.carX - camDist * Math.sin(r.heading);
              const targetCamZ = carPosZ + camDist * Math.cos(r.heading);
              const targetCamY = camHeight + rampY;

              camera.position.x += (targetCamX - camera.position.x) * Math.min(1, 12 * dt);
              camera.position.y += (targetCamY - camera.position.y) * Math.min(1, 12 * dt);
              camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, 12 * dt);

              const lookAtX = r.carX + 12 * Math.sin(r.heading);
              const lookAtZ = carPosZ - 12 * Math.cos(r.heading);

              camera.lookAt(lookAtX, 0.65 + rampY, lookAtZ);
            } else {
              const targetCamX = r.carX - camDist * Math.sin(r.heading);
              const targetCamZ = camDist * Math.cos(r.heading);
              const targetCamY = camHeight + rampY;

              if (!isNaN(targetCamX) && !isNaN(targetCamY) && !isNaN(targetCamZ)) {
                camera.position.x += (targetCamX - camera.position.x) * Math.min(1, 12 * dt);
                camera.position.y += (targetCamY - camera.position.y) * Math.min(1, 12 * dt);
                camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, 12 * dt);
              }

              const lookAtX = r.carX + 12 * Math.sin(r.heading);
              const lookAtZ = -12 * Math.cos(r.heading);

              camera.lookAt(lookAtX, 0.65 + rampY, lookAtZ);
            }
          }
          // 🎥 Cảm giác tốc độ: FOV mở dần theo km/h (mượt, không nhảy)
          const speedKmhFov = (r.speed || 0) * 3.6;
          const targetFov = (cfg.fov || 68) + Math.min(7, speedKmhFov * 0.055) + (isNitro ? 6 : 0);
          if (Math.abs((camera.fov || 0) - targetFov) > 0.02) {
            camera.fov = (camera.fov || cfg.fov || 68) + (targetFov - (camera.fov || cfg.fov || 68)) * Math.min(1.0, 4.0 * dt);
            camera.updateProjectionMatrix();
          }

          // ── 6. KIỂM TRA VA CHẠM (COLLISION HITBOX DETECTION) ──
          if (!r._disableCollisionCheck) {
            const triggerCollision = ({ type, messageVi, messageDe, penalty = 20 }) => {
              r.collisionOccurred = true;
              r.speed = 0;
              r.targetSpeed = 0;
              r.isDriving = false;
              setIsDriving(false);
              audioEngine.playPenalty();

              const newSS = {
                points: Math.max(0, r.scoreState.points - penalty),
                events: [...r.scoreState.events, {
                  msg: `❌ ${messageVi} (-${penalty}đ)`,
                  passed: false,
                  time: Date.now()
                }]
              };
              r.scoreState = newSS;
              setScore(newSS.points);
              setEvents(newSS.events);
              setCollision({
                type,
                messageVi: `💥 ${messageVi}`,
                messageDe: `💥 ${messageDe}`
              });
            };

            // 🚀 Cập nhật hitbox xe người lái siêu tốc (O(1) 0ms, loại bỏ hoàn toàn vòng lặp quét 120.000 đỉnh của mô hình CAD Corolla)
            if (playerCar._hitbox) {
              const pcPos = playerCar.position;
              playerCar._hitbox.min.set(pcPos.x - 0.95, pcPos.y, pcPos.z - 2.25);
              playerCar._hitbox.max.set(pcPos.x + 0.95, pcPos.y + 1.5, pcPos.z + 2.25);
            }

            // 6.1. Va chạm với xe AI giao thông (O(1) hitbox, mảng mesh tái sử dụng — không cấp phát mỗi frame)
            const allBotMeshes = r._botMeshScratch || (r._botMeshScratch = []);
            allBotMeshes.length = 0;
            if (refs.current.trafficAIManager) {
              const mgrBots = refs.current.trafficAIManager.botCars;
              for (let bm = 0; bm < mgrBots.length; bm++) {
                if (mgrBots[bm].mesh) allBotMeshes.push(mgrBots[bm].mesh);
              }
            } else {
              for (let bm = 0; bm < aiCars.length; bm++) {
                if (aiCars[bm].mesh) allBotMeshes.push(aiCars[bm].mesh);
              }
            }

            for (let bi = 0; bi < allBotMeshes.length; bi++) {
              const aiMesh = allBotMeshes[bi];
              if (aiMesh && aiMesh._hitbox) {
                const aiPos = aiMesh.position;
                aiMesh._hitbox.min.set(aiPos.x - 0.95, aiPos.y, aiPos.z - 2.25);
                aiMesh._hitbox.max.set(aiPos.x + 0.95, aiPos.y + 1.5, aiPos.z + 2.25);
              }
              if (playerCar._hitbox && aiMesh && aiMesh._hitbox) {
                if (playerCar._hitbox.intersectsBox(aiMesh._hitbox)) {
                  if (!r.collisionOccurred) {
                    triggerCollision({
                      type: 'traffic',
                      messageVi: 'VA CHẠM VỚI XE KHÁC!',
                      messageDe: 'KOLLISION MIT ANDEREM VERKEHRSTEILNEHMER!',
                      penalty: 30
                    });
                  }
                }
              }
            }

            // 6.2. Va chạm các vật thể thế giới 3D (World Colliders: Cọc tiêu, xe đỗ, cọc ranh giới, đảo vòng xuyến, hàng rào)
            const worldColliders = r.worldColliders;
            const isImmune = r._collisionImmunityUntil && Date.now() < r._collisionImmunityUntil;

            if (!r.collisionOccurred && !isImmune && worldColliders && worldColliders.length > 0) {
              const carWorldX = r.carX;
              const carWorldZ = r._disableSceneryMoving ? r.carZ : -(r._scenery ? r._scenery.position.z : r.distanceTraveled);
              const carHalfW = 0.95;
              const carHalfL = 2.25;
              const heading = r.heading;
              const cosH = Math.cos(heading);
              const sinH = Math.sin(heading);

              for (let ci = 0; ci < worldColliders.length; ci++) {
                const c = worldColliders[ci];
                if (c.hit) continue;

                let isHit = false;

                if (c.shape === 'boundary') {
                  const hitWest = (carWorldX - carHalfW) < c.minX;
                  const hitEast = (carWorldX + carHalfW) > c.maxX;
                  const hitSouth = (carWorldZ - carHalfL) < c.minZ;
                  const hitNorth = (carWorldZ + carHalfL) > c.maxZ && (carWorldX < c.gateMinX || carWorldX > c.gateMaxX);
                  if (hitWest || hitEast || hitSouth || hitNorth) {
                    isHit = true;
                  }
                } else if (c.shape === 'circle') {
                  const dx = c.x - carWorldX;
                  const dz = c.z - carWorldZ;
                  const maxDist = carHalfL + c.radius + 0.5;

                  if (dx * dx + dz * dz <= maxDist * maxDist) {
                    const localX = dx * cosH - dz * sinH;
                    const localZ = dx * sinH + dz * cosH;
                    const cx = Math.max(0, Math.abs(localX) - carHalfW);
                    const cz = Math.max(0, Math.abs(localZ) - carHalfL);
                    if (cx * cx + cz * cz < c.radius * c.radius) {
                      isHit = true;
                    }
                  }
                } else if (c.shape === 'box') {
                  const bMinX = c.minX !== undefined ? c.minX : (c.x - (c.width || 1) / 2);
                  const bMaxX = c.maxX !== undefined ? c.maxX : (c.x + (c.width || 1) / 2);
                  const bMinZ = c.minZ !== undefined ? c.minZ : (c.z - (c.depth || 1) / 2);
                  const bMaxZ = c.maxZ !== undefined ? c.maxZ : (c.z + (c.depth || 1) / 2);
                  const dx = c.x - carWorldX;
                  const dz = c.z - carWorldZ;
                  const halfBoxW = (bMaxX - bMinX) / 2;
                  const halfBoxD = (bMaxZ - bMinZ) / 2;
                  const maxDist = carHalfL + Math.max(halfBoxW, halfBoxD) + 0.6;

                  if (dx * dx + dz * dz <= maxDist * maxDist) {
                    // (dùng scratch _collisionCorners — không cấp phát mảng/object mỗi frame)
                    _collisionCorners[0].x = carWorldX + (-carHalfW) * cosH + (-carHalfL) * sinH;
                    _collisionCorners[0].z = carWorldZ - (-carHalfW) * sinH + (-carHalfL) * cosH;
                    _collisionCorners[1].x = carWorldX + carHalfW * cosH + (-carHalfL) * sinH;
                    _collisionCorners[1].z = carWorldZ - carHalfW * sinH + (-carHalfL) * cosH;
                    _collisionCorners[2].x = carWorldX + carHalfW * cosH + carHalfL * sinH;
                    _collisionCorners[2].z = carWorldZ - carHalfW * sinH + carHalfL * cosH;
                    _collisionCorners[3].x = carWorldX + (-carHalfW) * cosH + carHalfL * sinH;
                    _collisionCorners[3].z = carWorldZ - (-carHalfW) * sinH + carHalfL * cosH;

                    for (let cci = 0; cci < 4; cci++) {
                      const pt = _collisionCorners[cci];
                      if (pt.x >= bMinX && pt.x <= bMaxX && pt.z >= bMinZ && pt.z <= bMaxZ) {
                        isHit = true;
                        break;
                      }
                    }

                    if (!isHit) {
                      const boxCorners = [
                        { x: bMinX, z: bMinZ },
                        { x: bMaxX, z: bMinZ },
                        { x: bMaxX, z: bMaxZ },
                        { x: bMinX, z: bMaxZ }
                      ];
                      for (let bi = 0; bi < boxCorners.length; bi++) {
                        const bpt = boxCorners[bi];
                        const bdx = bpt.x - carWorldX;
                        const bdz = bpt.z - carWorldZ;
                        const blocalX = bdx * cosH - bdz * sinH;
                        const blocalZ = bdx * sinH + bdz * cosH;
                        if (Math.abs(blocalX) <= carHalfW && Math.abs(blocalZ) <= carHalfL) {
                          isHit = true;
                          break;
                        }
                      }
                    }
                  }
                }

                if (isHit) {
                  if (c.mesh) {
                    c.mesh.rotation.z = (Math.random() > 0.5 ? 1 : -1) * 0.75;
                    c.mesh.position.y = 0.08;
                    c.hit = true;
                  }

                  triggerCollision({
                    type: c.type,
                    messageVi: c.messageVi,
                    messageDe: c.messageDe,
                    penalty: c.penalty || 20
                  });
                  break;
                }
              }
            }

            // 6.3 Guardrail / Curb collision check cho Autobahn & bản đồ thông thường
            if (r._mapConfig?.hasAutobahn && !r.collisionOccurred && !isImmune) {
              const laneInfo = r._laneInfo;
              if (refs.current.roadNetwork?.isReady) {
                // 🛣️ Autobahn PBF (A2 OSM): hộ lan cong theo địa hình thật → kiểm tra theo độ
                // lệch sườn xe so với tâm làn (laneInfo) thay vì toạ độ carX cứng.
                // CHỈ áp cho motorway/motorway_link — đường phố Rhynern KHÔNG có hộ lan
                // (trước đây mọi road đều bị check → lái phố lệch mép bị phạt "đâm hộ lan" oan).
                // laneInfo null khi xe gần như dừng → bỏ qua frame, tránh false positive.
                if (laneInfo && (laneInfo.highway === 'motorway' || laneInfo.highway === 'motorway_link')) {
                  if (laneInfo.e < -(laneInfo.laneWidthM / 2 + 0.7)) {
                    triggerCollision({
                      type: 'curb',
                      messageVi: 'Đâm vào dải phân cách giữa cao tốc (Mittelleitplanke)!',
                      messageDe: 'Kollision mit der Mittelleitplanke!',
                      penalty: 25
                    });
                  } else if (laneInfo.e > laneInfo.laneWidthM / 2 + 2.1) {
                    triggerCollision({
                      type: 'curb',
                      messageVi: 'Đâm vào hộ lan lề ngoài cao tốc (Seitenleitplanke)!',
                      messageDe: 'Kollision mit der Seitenleitplanke!',
                      penalty: 25
                    });
                  }
                }
              } else if (r.carX <= 1.25) {
                triggerCollision({
                  type: 'curb',
                  messageVi: 'Đâm vào dải phân cách giữa cao tốc (Mittelleitplanke)!',
                  messageDe: 'Kollision mit der Mittelleitplanke!',
                  penalty: 25
                });
              } else if (r.carX >= 17.15) {
                triggerCollision({
                  type: 'curb',
                  messageVi: 'Đâm vào hộ lan lề ngoài cao tốc (Seitenleitplanke)!',
                  messageDe: 'Kollision mit der Seitenleitplanke!',
                  penalty: 25
                });
              }
            } else if (!r._disableSceneryMoving && (r.carX < -50.0 || r.carX > 50.0) && !r.collisionOccurred) {
              triggerCollision({
                type: 'curb',
                messageVi: 'Đâm rào chắn giới hạn bản đồ!',
                messageDe: 'Kollision mit der Begrenzung!',
                penalty: 20
              });
            }
          }

          // Người đi bộ băng qua đường (chỉ trên map tuyến tính legacy có scenery di chuyển)
          if (!r._disableSceneryMoving && r.distanceTraveled > 1500 && r.distanceTraveled < 1660) {
            pedestrian.position.x = -8 + ((r.distanceTraveled - 1500) / 160) * 16;
          }

          // Chấm điểm scenario CHỈ khi đang lái thật: không chạy trong menu chính (isDriving=false),
          // không chạy khi đang dừng sau va chạm, không chạy khi đã hoàn thành bài thi
          if (!r.finished && r.isDriving) {
            // 📏 Tiến trình scenario = ODOMETER (quãng đường tích lũy thật từ lúc load map):
            // hoạt động đúng cả trên route VÒNG (phố → Auffahrt → A2 → U-turn → Ausfahrt → phố)
            // nơi trục z đảo chiều nhiều lần — metric |carZ| cũ sẽ gãy trên route như vậy.
            const dist = r._odoDist || 0;
            const idx = r.scenarioIdx;
            const currentMapScenarios = r.currentScenarios || [];
            if (idx < currentMapScenarios.length) {
              const sc = currentMapScenarios[idx];
              if (dist >= sc.triggerZ && !r.activeScenario) {
                r.activeScenario = sc;
                // Reset đầy đủ cờ chấm điểm cho từng bài — tránh kết quả "dính" từ bài trước
                r.crossedCenter = false;
                r.stopTimer = 0;
                r.hillRolledBack = false;
                r.hillRollbackDist = 0;
                r.emergencyBrakeDone = false;
                r._reachedBrakeSpeed = false;
                r._scMinSpeed = r.speed;
                r._scMaxSpeed = r.speed;
                r._scEntryLateral = undefined;
                r._scMinLateral = undefined;
                setActiveScenario(sc); setScenarioIdx(idx);
              }

              if (r.activeScenario) {
                if (r.speed < 1.0) r.stopTimer = (r.stopTimer || 0) + dt;
                // 📊 Theo dõi tốc độ min/max trong cửa sổ bài thi — giám khảo dùng để chấm
                // theo cả hành trình (giảm tốc trước cua, không phóng qua khu trường học...)
                r._scMinSpeed = Math.min(r._scMinSpeed ?? r.speed, r.speed);
                r._scMaxSpeed = Math.max(r._scMaxSpeed ?? r.speed, r.speed);
              }

              // 🛣️ Đo độ lệch sườn xe so với tim đường bằng LaneGraph OSM (đường cong thật):
              // - NO_OVERTAKING / GEGENVERKEHR: phát hiện lấn làn ngược chiều → crossedCenter
              // - BIKE_OVERTAKE: ghi nhận việc xiết trái giữ khoảng cách sườn khi vượt
              const latScenarioTypes = ['NO_OVERTAKING', 'GEGENVERKEHR', 'BIKE_OVERTAKE'];
              if (r.activeScenario && latScenarioTypes.includes(r.activeScenario.type)
                && refs.current.roadNetwork?.isReady && r.speed > 3) {
                const latPosZ = r._disableSceneryMoving ? -r.carZ : -(r._scenery ? r._scenery.position.z : r.distanceTraveled);
                const latSeg = refs.current.roadNetwork.findNearestSegment(r.carX, latPosZ, r.heading);
                if (latSeg && latSeg.road && latSeg.projectedPoint && Array.isArray(latSeg.road.centerline) && latSeg.distance < 12) {
                  const latCl = latSeg.road.centerline;
                  const latI0 = Math.min(Math.max(0, latSeg.segmentIndex ?? 0), latCl.length - 2);
                  let latDx = latCl[latI0 + 1][0] - latCl[latI0][0];
                  let latDz = latCl[latI0 + 1][1] - latCl[latI0][1];
                  const latSegLen = Math.hypot(latDx, latDz) || 1;
                  latDx /= latSegLen; latDz /= latSegLen;
                  const motLx = Math.sin(r.heading), motLz = -Math.cos(r.heading);
                  if (latDx * motLx + latDz * motLz < 0) { latDx = -latDx; latDz = -latDz; }
                  const rnLx = -latDz, rnLz = latDx; // Pháp tuyến phải của hướng chạy
                  const lateral = (r.carX - latSeg.projectedPoint[0]) * rnLx + (latPosZ - latSeg.projectedPoint[1]) * rnLz;
                  if (r._scEntryLateral === undefined) r._scEntryLateral = lateral;
                  if (r._scMinLateral === undefined || lateral < r._scMinLateral) r._scMinLateral = lateral;
                  if (r.activeScenario.type === 'NO_OVERTAKING' || r.activeScenario.type === 'GEGENVERKEHR') {
                    // Đâm qua tim đường sang làn ngược chiều: quá nửa bề rộng làn khỏi tâm làn
                    const halfLane = Math.min(2.2, Math.max(1.1, (latSeg.road.width || 7) / 2));
                    if (lateral < -halfLane) r.crossedCenter = true;
                  }
                }
              } else if (r.activeScenario && (r.activeScenario.type === 'NO_OVERTAKING' || r.activeScenario.type === 'GEGENVERKEHR')
                && !refs.current.roadNetwork?.isReady) {
                // Map tuyến tính legacy (không LaneGraph): tim đường tại carX = 0
                if (r.carX < -1.0) r.crossedCenter = true;
              }

              if (r.activeScenario && dist >= sc.resolveZ) {
                const passed = sc.check(r.speed, r.crossedCenter, r);
                if (passed) audioEngine.playSuccess(); else audioEngine.playPenalty();

                const newSS = applyEvent(r.scoreState, sc, passed);
                r.scoreState = newSS; setScore(newSS.points); setEvents([...newSS.events]);
                r.activeScenario = null; r.scenarioIdx = idx + 1;
                setActiveScenario(null); setScenarioIdx(idx + 1);
                if (idx + 1 >= currentMapScenarios.length) {
                  setFinished(true);
                  r.finished = true;
                }
              }
            }
          }

          trafficLights.forEach(({ tl, scenario }) => {
            const dist = refs.current.distanceTraveled;
            const isRed = dist >= scenario.triggerZ - 25 && dist < scenario.resolveZ;
            // Ghi trạng thái đèn đỏ cho xe AI legacy (dừng đúng đèn tại ngã tư)
            refs.current._trafficLightRed = isRed;
            if (tl._redLight?.material) {
              tl._redLight.material.color.setHex(isRed ? 0xff0000 : 0x330000);
              if (tl._redLight.material.emissive) {
                tl._redLight.material.emissive.setHex(isRed ? 0xff0000 : 0x000000);
                tl._redLight.material.emissiveIntensity = isRed ? 3.0 : 0;
              }
            }
            if (tl._grnLight?.material) {
              tl._grnLight.material.color.setHex(!isRed ? 0x00ff44 : 0x003311);
              if (tl._grnLight.material.emissive) {
                tl._grnLight.material.emissive.setHex(!isRed ? 0x00ff44 : 0x000000);
                tl._grnLight.material.emissiveIntensity = !isRed ? 3.0 : 0;
              }
            }
          });

          // ☀️ Cho ánh sáng mặt trời và bóng đổ di chuyển mượt mà theo vị trí xe người lái
          if (sun && playerCar) {
            sun.position.set(playerCar.position.x + 50, 110, playerCar.position.z + 40);
            sun.target.position.set(playerCar.position.x, 0, playerCar.position.z);
            sun.target.updateMatrixWorld();
          }

          // ── CẬP NHẬT MÀN HÌNH ĐỒNG HỒ CÔNG TƠ MÉT VÔ-LĂNG & MÀN HÌNH GPS TRUNG TÂM ──
          const isCockpit = currentCamMode === 'cockpit';
          const isMirrorVisible = (r.gear === 'R') || refs.current.showRearMirror;

          // 🚀 Performance: Chỉ vẽ canvas màn hình xe khi ở góc nhìn buồng lái (Cockpit),
          // và throttle ở tần số 15 FPS (chuẩn xe hơi thật) để loại bỏ 75% tải 2D draw calls & texture uploads
          if (isCockpit && isWarmedUp) {
            const currentZoneId = refs.current?._lastZoneId;
            let currentStVOSpeedLimit = 50;
            if (currentZoneId === 'side_streets' || currentZoneId === 'hackescher_markt') {
              currentStVOSpeedLimit = 30; // Zone 30 phố cổ / dân cư
            } else {
              currentStVOSpeedLimit = activeScenario?.limit || 50;
            }

            let warningText = null;
            if (refs.current.collisionOccurred) {
              warningText = '⚠️ VA CHẠM! DỪNG!';
            } else if (r.speed > currentStVOSpeedLimit + 5) {
              warningText = `⚠️ QUÁ TỐC ĐỘ ${currentStVOSpeedLimit}!`;
            } else if (r.handbrake) {
              warningText = '(!) PHANH TAY BẬT';
            } else if (r.hazard) {
              warningText = '⚠️ ĐÈN KHẨN CẤP';
            }

            const clusterThrottle = isPerformance ? 8 : 4;
            r._clusterFrame = ((r._clusterFrame || 0) + 1) % clusterThrottle;
            if (r._clusterFrame === 0 && playerCar._smalScreenCtx && playerCar._smalScreenTexture) {
              drawSmallClusterScreen(playerCar._smalScreenCtx, {
                speed: r.speed,
                rpm: r.isEngineRunning ? (r.rpm ?? 850) : 0,
                gear: r.gear,
                blinkerL: r.blinkerLeft,
                blinkerR: r.blinkerRight,
                headlights: r.headlights,
                handbrake: r.handbrake,
                hazard: r.hazard,
                seatBelt: r.seatBelt,
                laneWarning: r.laneWarning,
                distanceTraveled: r.distanceTraveled,
                speedLimit: currentStVOSpeedLimit,
                warning: warningText
              });
              playerCar._smalScreenTexture.needsUpdate = true;
            } else if (r._clusterFrame === (isPerformance ? 4 : 2) && playerCar._navScreenCtx && playerCar._navScreenTexture) {
              drawInfotainmentScreen(playerCar._navScreenCtx, {
                speed: r.speed,
                rpm: r.isEngineRunning ? (r.rpm ?? 850) : 0,
                distanceTraveled: r.distanceTraveled,
                scenarioName: activeScenario?.name || 'Sa hình StVO Đức',
                scenarioDetail: activeScenario?.warn || 'Đang dẫn đường...'
              });
              playerCar._navScreenTexture.needsUpdate = true;
            }
          }

          // ── CẬP NHẬT GƯƠNG CHIẾU HẬU (REAR CAMERA & 3D/HUD MIRRORS) ──
          // 🚀 Performance: Chỉ tính toán góc camera gương khi người lái thực sự nhìn thấy gương (Cockpit hoặc bật HUD lùi)
          if (isCockpit || isMirrorVisible) {
            const mCfg = refs.current.mirrorConfig || { yaw: 0, pitch: 0, target: 'center' };
            const mYaw = ((mCfg.yaw || 0) * Math.PI) / 180;
            const mPitch = ((mCfg.pitch || 0) * Math.PI) / 180;

            // 1. Camera gương chiếu hậu trong cabin (Cabin Rearview)
            const centerUserYaw = (mCfg.target === 'center' ? mYaw : 0);
            const centerUserPitch = (mCfg.target === 'center' ? mPitch : 0);
            const defaultCenterPitch = -0.16; // Góc chúc xuống ~9.2° rọi mặt đường và xe bám đuôi sau xe
            const effCenterPitch = defaultCenterPitch + centerUserPitch;
            // (scratch vectors — tránh new Vector3 mỗi frame gây GC spike)
            _camEyeLocal.set(0.0, 1.25, 1.4);
            _camTargetOffset.set(Math.sin(centerUserYaw) * 50, Math.sin(effCenterPitch) * 50, Math.cos(centerUserYaw) * 50);
            _camTargetLocal.copy(_camEyeLocal).add(_camTargetOffset);

            playerCar.updateMatrixWorld(true);
            const rearEye = _camEyeLocal.applyMatrix4(playerCar.matrixWorld);
            const rearTarget = _camTargetLocal.applyMatrix4(playerCar.matrixWorld);
            rearCamera.position.copy(rearEye);
            rearCamera.lookAt(rearTarget);
            rearCamera.updateMatrixWorld(true);

            // 2. Camera gương chiếu hậu ngoài cánh xe (Exterior Side Mirror - Chỉ cần khi ở Cockpit và không phải performance mode)
            if (isCockpit && refs.current.sideMirrorCamera) {
              const sideCamX = (mCfg.target === 'right') ? 1.12 : -1.12;
              const defaultSideYaw = (mCfg.target === 'right') ? 0.26 : -0.26;
              const defaultSidePitch = -0.14;
              const sideUserYaw = (mCfg.target === 'left' || mCfg.target === 'right') ? mYaw : 0;
              const sideUserPitch = (mCfg.target === 'left' || mCfg.target === 'right') ? mPitch : 0;
              const effSideYaw = defaultSideYaw + sideUserYaw;
              const effSidePitch = defaultSidePitch + sideUserPitch;
              _camEyeLocal.set(sideCamX, 1.05, -0.65);
              _camTargetOffset.set(Math.sin(effSideYaw) * 50, Math.sin(effSidePitch) * 50, Math.cos(effSideYaw) * 50);
              _camTargetLocal.copy(_camEyeLocal).add(_camTargetOffset);

              const smCam = refs.current.sideMirrorCamera;
              const sideEye = _camEyeLocal.applyMatrix4(playerCar.matrixWorld);
              const sideTarget = _camTargetLocal.applyMatrix4(playerCar.matrixWorld);
              smCam.position.copy(sideEye);
              smCam.lookAt(sideTarget);
              smCam.updateMatrixWorld(true);
            }

            if (playerCar._mirrorMaterial && !playerCar._mirrorMaterial.map && rearRenderTarget) {
              playerCar._mirrorMaterial.map = rearRenderTarget.texture;
              playerCar._mirrorMaterial.needsUpdate = true;
            }
            if (playerCar._sideMirrorMaterial && !playerCar._sideMirrorMaterial.map && sideMirrorRenderTarget) {
              playerCar._sideMirrorMaterial.map = sideMirrorRenderTarget.texture;
              playerCar._sideMirrorMaterial.needsUpdate = true;
            }
          }

          // ── RENDER PIPELINE TỐI ƯU HÓA ĐỈNH CAO ──
          // 🚀 Shadow Throttling: Cập nhật bóng đổ mỗi 3 frames (~20 FPS) thay vì 60 FPS, tiết kiệm 66% gánh nặng đổ bóng
          if (enableShadows) {
            r._shadowFrame = ((r._shadowFrame || 0) + 1) % 3;
            if (r._shadowFrame === 0) {
              renderer.shadowMap.needsUpdate = true;
            }
          }

          // Pass 1: Cập nhật kết cấu gương 3D
          // 🚀 CỰC KỲ QUAN TRỌNG: Ở góc nhìn Chase (nhìn từ ngoài), người chơi KHÔNG nhìn thấy gương nội thất!
          // Hoàn toàn bỏ qua Pass 1 khi ở góc nhìn Chase/Hood, tiết kiệm ngay 2 lần render toàn bộ scene mỗi frame (giảm 66% render passes)!
          // Khi ở Cockpit: Luân phiên xen kẽ (Interleaved) mỗi frame chỉ render 1 gương (30 FPS/gương), hình ảnh mượt tuyệt đối nhưng chỉ tốn 1 render pass thay vì 2!
          if (isCockpit && isWarmedUp) {
            if (isPerformance) {
              // 🪞 Performance mode: gương hậu cập nhật mỗi 2 frames (~30 FPS)
              // Trước đây %8 → 7.5 FPS gây giật lag rõ rệt. Side mirror vẫn tắt để tiết kiệm.
              r._mirrorFrame = ((r._mirrorFrame || 0) + 1) % 2;
              if (r._mirrorFrame === 0 && rearRenderTarget) {
                playerCar.visible = false;
                rearCamera.aspect = 2.0;
                rearCamera.updateProjectionMatrix();
                renderer.setRenderTarget(rearRenderTarget);
                renderer.render(scene, rearCamera);
                renderer.setRenderTarget(null);
                playerCar.visible = true;
              }
            } else {
              r._mirrorFrame = ((r._mirrorFrame || 0) + 1) % 2;
              playerCar.visible = false;

              if (r._mirrorFrame === 0 && rearRenderTarget) {
                // Frame chẵn: Cập nhật gương hậu cabin
                rearCamera.aspect = 2.0;
                rearCamera.updateProjectionMatrix();
                renderer.setRenderTarget(rearRenderTarget);
                renderer.render(scene, rearCamera);
              } else if (r._mirrorFrame === 1 && sideMirrorRenderTarget && refs.current.sideMirrorCamera) {
                // Frame lẻ: Cập nhật gương hậu cánh xe
                renderer.setRenderTarget(sideMirrorRenderTarget);
                renderer.render(scene, refs.current.sideMirrorCamera);
              }

              renderer.setRenderTarget(null);
              playerCar.visible = true;
            }
          }

          // Pass 2 (Chính): Vẽ góc nhìn người lái (Cockpit / Chase / Hood)
          playerCar.visible = true;
          if (composer) composer.render(); else renderer.render(scene, camera);

          // Pass 3: Camera lùi / Gương HUD dạng Scissor Overlay (CHỈ khi vào số R hoặc bấm mở thủ công M)
          if (isMirrorVisible) {
            playerCar.visible = false;

            const pr = renderer.getPixelRatio();
            const domW = renderer.domElement.clientWidth;
            const domH = renderer.domElement.clientHeight;
            const actualHudW = Math.min(320, domW * 0.9);
            const actualHudH = 78;
            const topOffset = domW <= 768 ? 86 : 76;
            const hudWidth = Math.round(actualHudW * pr);
            const hudHeight = Math.round(actualHudH * pr);
            const hudX = Math.round((domW - actualHudW) / 2 * pr);
            const hudY = Math.round((domH - (topOffset + 22 + actualHudH)) * pr);

            rearCamera.aspect = actualHudW / actualHudH;
            rearCamera.updateProjectionMatrix();
            renderer.setScissorTest(true);
            renderer.setViewport(hudX, hudY, hudWidth, hudHeight);
            renderer.setScissor(hudX, hudY, hudWidth, hudHeight);
            renderer.render(scene, rearCamera);
            renderer.setScissorTest(false);
            renderer.setViewport(0, 0, renderer.domElement.width, renderer.domElement.height);

            playerCar.visible = true;
          }
        };
        animate();

        handleResize = () => {
          if (!currentContainer || !renderer) return;
          camera.aspect = currentContainer.clientWidth / currentContainer.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(currentContainer.clientWidth, currentContainer.clientHeight);
        };
        window.addEventListener('resize', handleResize);
      } catch (err) {
        console.error(err);
      }
    };
    init();

    return () => {
      isMounted = false;
      if (handleResize) window.removeEventListener('resize', handleResize);
      if (reqId) cancelAnimationFrame(reqId);
      if (renderer) renderer.dispose();
      if (rearRenderTarget) {
        rearRenderTarget.dispose();
        rearRenderTarget = null;
      }
      if (sideMirrorRenderTarget) {
        sideMirrorRenderTarget.dispose();
        sideMirrorRenderTarget = null;
      }
      if (refs.current.rearRenderTarget) {
        refs.current.rearRenderTarget.dispose();
        refs.current.rearRenderTarget = null;
      }
      if (refs.current.sideMirrorRenderTarget) {
        refs.current.sideMirrorRenderTarget.dispose();
        refs.current.sideMirrorRenderTarget = null;
      }
      if (refs.current.trafficAIManager) {
        refs.current.trafficAIManager.clear();
        refs.current.trafficAIManager = null;
      }
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [graphicsQuality, simStarted]);

  // 🗺️ HOT-SWAP MAP KHI currentMapId HOẶC customMapData THAY ĐỔI (KHÔNG RELOAD WEBGL, KHÔNG LOAD LẠI TOYOTA COROLLA)
  useEffect(() => {
    if (isFirstMapMountRef.current) {
      isFirstMapMountRef.current = false;
      return;
    }
    if (!refs.current.loadMapIntoScene) return;

    // Hiển thị loading screen khi chuyển đổi sang bản đồ mới
    setLoadingState({
      isLoading: true,
      progress: 35,
      statusText: `Đang nạp môi trường ${currentMapId === 'stadt_zentrum' ? 'Thủ đô Berlin - Rosa-Luxemburg-Platz' :
          (currentMapId === 'autobahn_a' || currentMapId === 'autobahn_a9' || currentMapId === 'AUTOBAHN') ? 'Cao tốc Autobahn A9' :
            (currentMapId === 'landstrasse' || currentMapId === 'LANDSTRASSE') ? 'Đường ngoài đô thị Landstraße' :
              'Sa hình Fahrschule StVO'
        }...`,
      tipIndex: Math.floor(Math.random() * DRIVING_TIPS.length)
    });

    const timer = setTimeout(() => {
      if (!refs.current.loadMapIntoScene) return;
      refs.current.loadMapIntoScene(currentMapId, customMapData);

      setLoadingState(prev => ({
        ...prev,
        progress: 85,
        statusText: 'Đang biên dịch bóng đổ & mặt đường...'
      }));

      requestAnimationFrame(() => {
        const r = refs.current;
        if (r.renderer && r.scene && r.camera) {
          try {
            r.renderer.compile(r.scene, r.camera);
            r.renderer.render(r.scene, r.camera);
          } catch (e) {
            // ignore compile warning
          }
        }
        setLoadingState(prev => ({
          ...prev,
          progress: 100,
          statusText: 'Bản đồ đã sẵn sàng!'
        }));

        setTimeout(() => {
          setLoadingState(prev => ({
            ...prev,
            isLoading: false
          }));
        }, 250);
      });
    }, 40);

    return () => clearTimeout(timer);
  }, [currentMapId, customMapData]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#020617', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <SimHeaderBar activeScenario={activeScenario} authoritativeSpeedLimit={authoritativeSpeedLimit} cameraMode={cameraMode} currentMapId={currentMapId} currentZone={currentZone} gear={gear} handleToggleEngine={handleToggleEngine} isDriving={isDriving} isEngineRunning={isEngineRunning} scenarioIdx={scenarioIdx} score={score} setIsDriving={setIsDriving} setShowAutobahnOverviewMap={setShowAutobahnOverviewMap} setShowBerlinOverviewMap={setShowBerlinOverviewMap} setShowGuideModal={setShowGuideModal} setShowInGameTutorial={setShowInGameTutorial} setShowOptionsMenu={setShowOptionsMenu} showInGameTutorial={showInGameTutorial} showRearMirror={showRearMirror} toggleCameraView={toggleCameraView} toggleRearMirror={toggleRearMirror} />
      {isDriving && (
        <>
          {showInGameTutorial && (
            <InGameDrivingTutorial
              isDriving={isDriving}
              isEngineRunning={isEngineRunning}
              onToggleEngine={handleToggleEngine}
              seatBelt={seatBelt}
              gear={gear}
              speed={speed}
              steer={refs.current?.steer || 0}
              onToggleSeatBelt={toggleSeatBelt}
              onSelectGear={handleSelectGear}
              onStepChange={setTutorialStep}
              onClose={() => setShowInGameTutorial(false)}
              isMobile={isPortraitMobile || (typeof window !== 'undefined' && window.innerWidth < 768)}
            />
          )}

          {gearWarning && (
            <div className="sim-gear-warning" style={{
              position: 'absolute',
              top: 68,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 90,
              background: 'rgba(15, 23, 42, 0.94)',
              border: typeof gearWarning === 'object' && gearWarning?.type === 'info' ? '1.5px solid #10B981' : '1.5px solid #F59E0B',
              color: typeof gearWarning === 'object' && gearWarning?.type === 'info' ? '#D1FAE5' : '#FEF3C7',
              padding: '8px 20px',
              borderRadius: 8,
              boxShadow: '0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(245, 158, 11, 0.35)',
              backdropFilter: 'blur(10px)',
              fontSize: 12,
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              pointerEvents: 'none',
              animation: 'shiftPulse 0.3s ease-out'
            }}>
              {typeof gearWarning === 'object' && gearWarning?.type === 'info' ? (
                <ShieldCheck size={18} color="#38bdf8" />
              ) : (
                <AlertTriangle size={18} color="#f59e0b" />
              )}
              <span>{typeof gearWarning === 'object' && gearWarning?.text ? gearWarning.text : gearWarning}</span>
            </div>
          )}

          <VirtualCockpitCluster
            speed={speed}
            rpm={rpm}
            gear={gear}
            blinkerL={blinkerLeft}
            blinkerR={blinkerRight}
            headlights={headlights}
            hazard={hazard}
            weatherMode={weatherMode}
            handbrake={handbrake}
            seatBeltFastened={seatBelt}
            onToggleSeatBelt={toggleSeatBelt}
            laneWarning={laneWarning}
            distanceTraveled={distanceTraveled}
            speedLimit={authoritativeSpeedLimit}
            onSelectGear={handleSelectGear}
          />

          {(showRearMirror || gear === 'R') && (
            <SmartRearviewMirror
              onClose={() => setShowRearMirror(false)}
              isReverse={gear === 'R'}
              steer={refs.current.steer}
              speed={speed}
              trafficBehind={refs.current.trafficBehindDist || null}
              mirrorConfig={mirrorConfig}
              onAdjustMirror={handleAdjustMirror}
              onSelectMirror={handleSelectMirror}
              onResetMirror={handleResetMirror}
            />
          )}
        </>
      )}

      {/* 🔄 Mobile Landscape Recommendation Banner (Chỉ hiện khi cầm dọc trên điện thoại) */}
      {isDriving && !dismissRotatePrompt && (
        <div className="sim-landscape-banner">
          <div className="sim-landscape-banner-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="#38bdf8" strokeWidth="2" fill="none" className="rotate-phone-anim">
              <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
              <path d="M12 18h.01" />
            </svg>
          </div>
          <div className="sim-landscape-banner-content">
            <div className="sim-landscape-banner-title">
              Khuyên dùng: Xoay ngang màn hình
            </div>
            <div className="sim-landscape-banner-desc">
              Mở rộng góc nhìn 2 gương chiếu hậu & lái 2 tay chân thực
            </div>
          </div>
          <button
            className="sim-landscape-banner-btn"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => { });
              }
              setDismissRotatePrompt(true);
            }}
          >
            Đã Hiểu
          </button>
          <button
            className="sim-landscape-banner-dismiss"
            onClick={() => setDismissRotatePrompt(true)}
            title="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {/* 👨‍✈️ CỤM RA LỆNH HƯỚNG ĐI ĐỘNG CỦA GIÁM KHẢO FAHRPRÜFER (BERLIN-MITTE) */}
      {isDriving && (currentMapId === 'stadt_zentrum' || refs.current?.currentMapId === 'stadt_zentrum' || currentMapId === 'STADT' || refs.current?.currentMapId === 'STADT' || currentMapId === 'stadt' || refs.current?.currentMapId === 'stadt') && (
        <ExaminerDirectiveHUD
          directive={activeDirective}
          score={examinerScore}
          recentFeedback={examinerFeedback}
          blinkerLeft={blinkerLeft}
          blinkerRight={blinkerRight}
          speed={speed}
          onRandomizeDirective={handleRandomizeDirective}
        />
      )}

      {/* 🗺️ 2D Radar Minimap HUD & Dynamic Zone Guidance */}
      {currentZone && <DynamicZoneBanner zone={currentZone} />}
      <SaHinhMinimap
        mapId={currentMapId}
        customMapData={currentMapId === 'custom_map' ? customMapData : null}
        playerX={playerCarWorldPos.x}
        playerZ={playerCarWorldPos.z}
        heading={playerCarWorldPos.heading}
        speed={speed}
        activeZone={currentZone}
        targetDirective={activeDirective}
        trafficCars={trafficCars}
        isOpen={showMinimap}
        onToggleOpen={setShowMinimap}
        onOpenOverviewMap={() => setShowBerlinOverviewMap(true)}
        onSelectExercise={(exId) => {
          if (EXERCISES[exId]) handleLoadExercise(EXERCISES[exId]);
        }}
        onTeleport={(tx, tz, rot) => {
          if (refs.current) {
            refs.current.carX = tx;
            refs.current.carZ = -tz;
            refs.current.heading = rot !== undefined ? rot : 0;
            refs.current.speed = 0;
            if (refs.current.playerCar) {
              refs.current.playerCar.position.set(tx, 0, tz);
              refs.current.playerCar.rotation.y = rot !== undefined ? rot : 0;
            }
            setPlayerCarWorldPos({ x: tx, z: tz, heading: rot !== undefined ? rot : 0 });
            const newZone = detectZoneForMap(currentMapId, tx, tz);
            setCurrentZone(newZone);
          }
        }}
      />

      {/* 🗺️ 2D Overview Map Modal (Hỗ trợ tất cả bản đồ: Stadt, Landstraße, Autobahn) */}
      <BerlinMitteOverviewMapModal
        isOpen={showBerlinOverviewMap}
        onClose={() => setShowBerlinOverviewMap(false)}
        mapType={currentMapId}
        playerX={playerCarWorldPos.x}
        playerZ={playerCarWorldPos.z}
        heading={playerCarWorldPos.heading}
        speed={speed}
        activeZone={currentZone}
        trafficCars={trafficCars}
        onTeleport={(tx, tz, rot) => {
          if (refs.current) {
            refs.current.carX = tx;
            refs.current.carZ = -tz;
            refs.current.heading = rot !== undefined ? rot : 0;
            refs.current.speed = 0;
            if (refs.current.playerCar) {
              refs.current.playerCar.position.set(tx, 0, tz);
              refs.current.playerCar.rotation.y = rot !== undefined ? rot : 0;
            }
            setPlayerCarWorldPos({ x: tx, z: tz, heading: rot !== undefined ? rot : 0 });
            const newZone = detectZoneForMap(currentMapId, tx, tz);
            setCurrentZone(newZone);
          }
        }}
        onSelectExercise={(exId) => {
          if (EXERCISES[exId]) handleLoadExercise(EXERCISES[exId]);
        }}
      />

      {/* 🛣️ 2D Autobahn A9 Overview & StVO Modal */}
      <AutobahnOverviewMapModal
        isOpen={showAutobahnOverviewMap}
        onClose={() => setShowAutobahnOverviewMap(false)}
        playerX={playerCarWorldPos.x}
        playerZ={playerCarWorldPos.z}
        heading={playerCarWorldPos.heading}
        speed={speed}
        activeZone={currentZone}
        onTeleport={(tx, tz, rot) => {
          if (refs.current) {
            refs.current.carX = tx;
            refs.current.carZ = -tz;
            refs.current.heading = rot !== undefined ? rot : 0;
            refs.current.speed = 0;
            if (refs.current.playerCar) {
              refs.current.playerCar.position.set(tx, 0, tz);
              refs.current.playerCar.rotation.y = rot !== undefined ? rot : 0;
            }
            setPlayerCarWorldPos({ x: tx, z: tz, heading: rot !== undefined ? rot : 0 });
            const newZone = detectZoneForMap(currentMapId, tx, tz);
            setCurrentZone(newZone);
          }
          setShowAutobahnOverviewMap(false);
        }}
      />

      {/* 🌟 2. CỤM ĐIỀU KHIỂN CẢM ỨNG (Chỉ hiển thị trên thiết bị cảm ứng / màn hình chạm) */}
      {isDriving && showTouchControls && (
        <>
          {/* Cụm Bẻ Lái Trái / Phải (Bên Trái) */}
          <div className="sim-touch-steering" style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 35,
            display: 'flex', gap: 8
          }}>
            <button
              className="sim-touch-btn sim-steer-left"
              onMouseDown={() => { refs.current.keys['a'] = true; }}
              onMouseUp={() => { refs.current.keys['a'] = false; }}
              onMouseLeave={() => { refs.current.keys['a'] = false; }}
              onTouchStart={(e) => { e.preventDefault(); refs.current.keys['a'] = true; }}
              onTouchEnd={(e) => { e.preventDefault(); refs.current.keys['a'] = false; }}
              onContextMenu={(e) => e.preventDefault()}
              title="Bẻ lái sang TRÁI (Phím A)"
              style={{
                width: 50, height: 46, borderRadius: 10,
                border: (showInGameTutorial && tutorialStep === 4) ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.88)', color: '#38bdf8',
                fontSize: 12, fontWeight: '900',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', backdropFilter: 'blur(8px)', userSelect: 'none', touchAction: 'none'
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>◄</span>
              <span style={{ fontSize: 8, marginTop: 1, letterSpacing: '0.04em' }}>TRÁI</span>
            </button>
            <button
              className="sim-touch-btn sim-steer-right"
              onMouseDown={() => { refs.current.keys['d'] = true; }}
              onMouseUp={() => { refs.current.keys['d'] = false; }}
              onMouseLeave={() => { refs.current.keys['d'] = false; }}
              onTouchStart={(e) => { e.preventDefault(); refs.current.keys['d'] = true; }}
              onTouchEnd={(e) => { e.preventDefault(); refs.current.keys['d'] = false; }}
              onContextMenu={(e) => e.preventDefault()}
              title="Bẻ lái sang PHẢI (Phím D)"
              style={{
                width: 50, height: 46, borderRadius: 10,
                border: (showInGameTutorial && tutorialStep === 4) ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.88)', color: '#38bdf8',
                fontSize: 12, fontWeight: '900',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', backdropFilter: 'blur(8px)', userSelect: 'none', touchAction: 'none'
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>►</span>
              <span style={{ fontSize: 8, marginTop: 1, letterSpacing: '0.04em' }}>PHẢI</span>
            </button>
          </div>

          {/* Cụm Bàn Đạp Ga/Phanh (Bên Phải) */}
          <div className="sim-touch-pedals-wrap" style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 35,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6
          }}>
            {!isEngineRunning && (
              <button
                className="sim-engine-start-btn"
                onClick={handleToggleEngine}
                title="Nổ máy xe 1 chạm để sẵn sàng lăn bánh (Phím I hoặc Enter)"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: '1.5px solid #ef4444',
                  borderRadius: 8, padding: '4px 8px', fontSize: 10, fontWeight: '900',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)'
                }}
              >
                <Power size={11} strokeWidth={2.8} />
                <span>NỔ MÁY [I]</span>
              </button>
            )}

            {/* Bàn đạp PHANH & GA */}
            <div className="sim-touch-pedals" style={{ display: 'flex', gap: 6 }}>
              {/* Nút Phanh Đỏ */}
              <button
                className="sim-touch-btn sim-pedal-brake"
                onMouseDown={() => { refs.current.keys['s'] = true; }}
                onMouseUp={() => { refs.current.keys['s'] = false; }}
                onMouseLeave={() => { refs.current.keys['s'] = false; }}
                onTouchStart={(e) => { e.preventDefault(); refs.current.keys['s'] = true; }}
                onTouchEnd={(e) => { e.preventDefault(); refs.current.keys['s'] = false; }}
                onContextMenu={(e) => e.preventDefault()}
                title="Đạp phanh dừng xe (Phím S)"
                style={{
                  width: 56, height: 48, borderRadius: 10,
                  border: (showInGameTutorial && tutorialStep === 4) ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.6)',
                  background: 'rgba(185, 28, 28, 0.85)',
                  color: '#ffffff', fontSize: 11, fontWeight: '900',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', userSelect: 'none', touchAction: 'none'
                }}
              >
                <AlertOctagon size={14} color="#ffffff" />
                <span style={{ fontSize: 9, marginTop: 1, letterSpacing: '0.04em' }}>PHANH</span>
              </button>

              {/* Nút Ga Xanh Lá Cây */}
              <button
                className="sim-touch-btn sim-pedal-gas"
                onMouseDown={() => {
                  if (!refs.current.isEngineRunning) {
                    showGearWarning({ text: '⚠️ Động cơ chưa nổ máy! Hãy gạt cần số về [ P ] và bấm [ Nổ máy ] trước.', type: 'warn' });
                  }
                  refs.current.keys['w'] = true;
                }}
                onMouseUp={() => { refs.current.keys['w'] = false; }}
                onMouseLeave={() => { refs.current.keys['w'] = false; }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (!refs.current.isEngineRunning) {
                    showGearWarning({ text: '⚠️ Động cơ chưa nổ máy! Hãy gạt cần số về [ P ] và bấm [ Nổ máy ] trước.', type: 'warn' });
                  }
                  refs.current.keys['w'] = true;
                }}
                onTouchEnd={(e) => { e.preventDefault(); refs.current.keys['w'] = false; }}
                onContextMenu={(e) => e.preventDefault()}
                title="Đạp ga tăng tốc (Phím W)"
                style={{
                  width: 66, height: 48, borderRadius: 10,
                  border: (showInGameTutorial && tutorialStep === 3) ? '2px solid #4ade80' : '1px solid rgba(34, 197, 94, 0.6)',
                  background: 'rgba(22, 163, 74, 0.85)',
                  color: '#ffffff', fontSize: 11, fontWeight: '900',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', userSelect: 'none', touchAction: 'none'
                }}
              >
                <Zap size={14} color="#ffffff" fill="#ffffff" />
                <span style={{ fontSize: 9, marginTop: 1, letterSpacing: '0.04em' }}>GA</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 💡 Banner Hướng Dẫn Nhanh 3 Bước (Dành cho người mới & Low-Tech) */}
      {isDriving && showQuickTip && !showInGameTutorial && (
        <div className="sim-quick-tip-toast" style={{
          position: 'absolute', bottom: 92, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)', border: '1.5px solid rgba(16, 185, 129, 0.6)',
          borderRadius: 20, padding: '7px 16px', zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.7), 0 0 16px rgba(16, 185, 129, 0.25)',
          backdropFilter: 'blur(12px)', color: '#f8fafc', fontSize: 12, fontWeight: '600',
          whiteSpace: 'nowrap'
        }}>
          <Lightbulb size={16} color="#38bdf8" />
          <span>
            <strong>Cách lái xe:</strong> Giữ nút <span style={{ color: '#4ade80', fontWeight: '800' }}>GA [W]</span> để chạy • Nhấn <span style={{ color: '#f87171', fontWeight: '800' }}>PHANH [S]</span> để dừng • Nút <span style={{ color: '#38bdf8', fontWeight: '800' }}>[R]</span> để lùi
          </span>
          <button
            onClick={() => setShowQuickTip(false)}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              fontSize: 14, fontWeight: '800', cursor: 'pointer', padding: '0 4px', marginLeft: 4
            }}
            title="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {/* ⚙️ MODAL CÀI ĐẶT & TÙY CHỌN MÔ PHỎNG (Gọn gàng - Ngăn nắp - Dễ dùng) */}
      <SimOptionsMenu cameraMode={cameraMode} currentMapId={currentMapId} customMapData={customMapData} graphicsQuality={graphicsQuality} handleClearCustomMap={handleClearCustomMap} handleFlyToCoords={handleFlyToCoords} handleJumpToScenario={handleJumpToScenario} hazard={hazard} headlights={headlights} isAudioMuted={isAudioMuted} navigate={navigate} refs={refs} scenarioIdx={scenarioIdx} seatBelt={seatBelt} setCameraMode={setCameraMode} setFlyX={setFlyX} setFlyZ={setFlyZ} setIsAudioMuted={setIsAudioMuted} setIsDriving={setIsDriving} setShowBerlinOverviewMap={setShowBerlinOverviewMap} setShowFlyModal={setShowFlyModal} setShowMinimap={setShowMinimap} setShowOptionsMenu={setShowOptionsMenu} setShowTouchControls={setShowTouchControls} setWeatherMode={setWeatherMode} showMinimap={showMinimap} showOptionsMenu={showOptionsMenu} showRearMirror={showRearMirror} showTouchControls={showTouchControls} toggleGraphicsQuality={toggleGraphicsQuality} toggleHazard={toggleHazard} toggleHeadlights={toggleHeadlights} toggleRearMirror={toggleRearMirror} toggleSeatBelt={toggleSeatBelt} weatherMode={weatherMode} />
      <FlyToModal showFlyModal={showFlyModal} flyX={flyX} flyZ={flyZ} setFlyX={setFlyX} setFlyZ={setFlyZ} setShowFlyModal={setShowFlyModal} handleFlyToCoords={handleFlyToCoords} />


      {/* 🏎️ Fullscreen Immersive 3D Loading Screen */}
      <SimLoadingScreen DRIVING_TIPS={DRIVING_TIPS} loadingState={loadingState} />
      {/* Menu Khởi Hành Tối Giản - Không chia tab, Lộ trình liên hoàn nước Đức */}
      <StartMenu finished={finished} handleStartFreeDrive={handleStartFreeDrive} isDriving={isDriving} loadingState={loadingState} selectedPresetMap={selectedPresetMap} setSelectedPresetMap={setSelectedPresetMap} showGuideModal={showGuideModal} speed={speed} />
      {collision && (
        <div className="sim-collision-backdrop" style={{ position: 'absolute', inset: 0, background: 'rgba(220, 38, 38, 0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div className="sim-collision-card" style={{ background: '#0f172a', border: '2px solid #ef4444', borderRadius: 20, padding: 32, maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: 54, marginBottom: 12 }}>💥</div>
            <h2 style={{ margin: 0, fontSize: 20, color: '#f87171', fontWeight: '800' }}>{collision.messageVi}</h2>
            <h3 style={{ margin: '6px 0 16px 0', fontSize: 14, color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>{collision.messageDe}</h3>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: '1.6', marginBottom: 24 }}>
              Trong bài thi thực hành tại Đức, va chạm giao thông hoặc đâm vỉa hè/rào chắn thành phố là lỗi vi phạm nghiêm trọng làm dừng bài thi lập tức.
            </p>
            <button onClick={handleResumeAfterCollision} style={{ width: '100%', background: '#ef4444', color: 'white', border: 'none', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: '800', cursor: 'pointer' }}>
              Tiếp tục bài thi / Fortfahren
            </button>
            <button
              onClick={() => { handleResumeAfterCollision(); setShowOptionsMenu(true); }}
              style={{ width: '100%', marginTop: 10, background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.4)', padding: 11, borderRadius: 12, fontSize: 13, fontWeight: '700', cursor: 'pointer' }}
            >
              ← Về Menu chọn bản đồ / Hauptmenü
            </button>
          </div>
        </div>
      )}

      {finished && (
        <FinishCard
          finished={finished}
          score={score}
          events={events}
          handleRestartExam={handleRestartExam}
          navigate={navigate}
        />
      )}

      {/* Adjuster Panel */}
      {showAdjuster && (
        <>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: 35, pointerEvents: 'none', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.88)', color: '#38bdf8', padding: '6px 16px',
              borderRadius: 20, border: '1px solid rgba(56, 189, 248, 0.5)', backdropFilter: 'blur(10px)',
              fontSize: 12, fontWeight: '800', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 8px 25px rgba(0,0,0,0.6)', pointerEvents: 'auto'
            }}>
              <Move size={14} color="#10b981" />
              <span>Kéo rê các biểu tượng 🎯 ↕️ 📐 trên màn hình để chỉnh vị trí ngồi trực tiếp!</span>
            </div>

            <div
              onPointerDown={(e) => handlePointerDownDrag('reticleXY', e)}
              title="Kéo rê để chỉnh Trái/Phải (X) và Độ Cao (Y) ghế ngồi"
              style={{
                position: 'absolute',
                left: `${Math.max(12, Math.min(88, 50 + (seatConfig.seatOffsetX / 2.4) * 75))}%`,
                top: `${Math.max(12, Math.min(84, 50 - ((seatConfig.seatOffsetY - 1.22) / 1.5) * 60))}%`,
                transform: 'translate(-50%, -50%)',
                cursor: activeDragTarget === 'reticleXY' ? 'grabbing' : 'grab',
                pointerEvents: 'auto', zIndex: 40,
                display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                border: activeDragTarget === 'reticleXY' ? '3px solid #10b981' : '2px dashed #38bdf8',
                background: activeDragTarget === 'reticleXY' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.25)',
                backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: activeDragTarget === 'reticleXY' ? '0 0 25px #10b981' : '0 0 15px rgba(56,189,248,0.5)'
              }}>
                <Crosshair size={22} color={activeDragTarget === 'reticleXY' ? '#fff' : '#38bdf8'} />
              </div>
            </div>
          </div>

          <div className="sim-adjuster-panel" style={{
            position: 'absolute', top: 68, right: 16, width: 330,
            maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', zIndex: 45,
            background: 'rgba(15, 23, 42, 0.94)', borderRadius: 20,
            border: '1.5px solid rgba(56, 189, 248, 0.4)', color: 'white',
            padding: 16, backdropFilter: 'blur(16px)', boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
              <div style={{ fontWeight: '900', fontSize: 13, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={16} /> 💺 Tùy Chỉnh Vị Trí Ghế & Xe
              </div>
              <button onClick={() => setShowAdjuster(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', fontWeight: '800' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={saveSeatConfig}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                  fontWeight: '900', fontSize: 11, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 5
                }}
              >
                <Save size={14} /> {isSavedNotice ? '✅ Đã Lưu!' : '💾 Lưu Vị Trí'}
              </button>
              <button
                onClick={resetSeatConfig}
                style={{
                  padding: '9px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)', color: 'white',
                  fontWeight: '800', fontSize: 11, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 4
                }}
              >
                <RotateCcw size={14} /> Đặt lại
              </button>
            </div>
          </div>
        </>
      )}

      {/* Autobahn Telemetry HUD for Empirical Driving Diagnostics */}
      {(currentMapId === 'autobahn_a' || currentMapId === 'autobahn_a9' || currentMapId === 'AUTOBAHN') && (
        <AutobahnTelemetryHUD telemetry={autobahnTelemetry} />
      )}

      {/* Bảng Hướng Dẫn Cơ Bản Ban Đầu (Quick Guide Modal) - Chỉ hiển thị khi 3D đã nạp xong */}
      {!loadingState.isLoading && showGuideModal && (
        <QuickGuideModal
          initialTab={
            (currentMapId === 'stadt_zentrum' || currentMapId === 'STADT') ? 'STADT' :
              (currentMapId === 'landstrasse_b2' || currentMapId === 'LAND') ? 'LAND' :
              (currentMapId === 'autobahn_a' || currentMapId === 'autobahn_a9' || currentMapId === 'AUTOBAHN') ? 'AUTOBAHN' : 'SA_HINH'
          }
          isDriving={isDriving}
          onClose={() => setShowGuideModal(false)}
          onStartDriving={(tabId, targetMap) => {
            setShowGuideModal(false);
            const chosenMap = targetMap || (
              tabId === 'STADT' ? 'stadt_zentrum' :
                tabId === 'LAND' ? 'landstrasse_b2' :
                tabId === 'AUTOBAHN' ? 'autobahn_a9' : 'sa_hinh_fahrschule'
            );
            if (!isDriving || chosenMap !== currentMapId) {
              handleStartFreeDrive(chosenMap);
            }
          }}
        />
      )}

      {/* 📱 Gợi ý xoay ngang màn hình chuyên nghiệp cho Mobile */}
      {!loadingState.isLoading && isPortraitMobile && !dismissRotatePrompt && (
        <div className="sim-rotate-overlay">
          <div className="sim-rotate-card">
            <div className="sim-rotate-icon-wrap">
              <svg viewBox="0 0 24 24" width="38" height="38" stroke="#38bdf8" strokeWidth="2" fill="none" className="rotate-phone-modal-anim">
                <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
                <path d="M12 18h.01" />
              </svg>
              <div className="sim-rotate-wheel-badge"><Car size={16} color="#38bdf8" /></div>
            </div>

            <h3 className="sim-rotate-title">
              Vui lòng xoay ngang màn hình
            </h3>

            <p className="sim-rotate-desc">
              Chế độ xoay ngang (Landscape) giúp bạn có trải nghiệm lái xe 3D chuẩn xác nhất:
            </p>

            <div className="sim-rotate-benefits">
              <div className="sim-rotate-benefit-item">
                <span className="sim-rotate-benefit-icon"><Eye size={18} color="#38bdf8" /></span>
                <span><strong>Thấy trọn gương chiếu hậu</strong> trái và kính chắn gió toàn cảnh.</span>
              </div>
              <div className="sim-rotate-benefit-item">
                <span className="sim-rotate-benefit-icon"><Sliders size={18} color="#38bdf8" /></span>
                <span><strong>Điều khiển 2 ngón tay cái:</strong> ngón trái bẻ lái, ngón phải ga/phanh.</span>
              </div>
              <div className="sim-rotate-benefit-item">
                <span className="sim-rotate-benefit-icon"><Navigation size={18} color="#38bdf8" /></span>
                <span><strong>Tầm nhìn thông thoáng:</strong> không còn bị che khuất mặt đường.</span>
              </div>
            </div>

            <div className="sim-rotate-actions">
              <button
                className="sim-rotate-btn-primary"
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen?.().catch(() => { });
                  }
                  screen.orientation?.lock?.('landscape')?.catch(() => { });
                  setDismissRotatePrompt(true);
                }}
              >
                🔄 Bật Toàn Màn Hình & Xoay Ngang
              </button>
              <button
                className="sim-rotate-btn-secondary"
                onClick={() => setDismissRotatePrompt(true)}
              >
                Vẫn tiếp tục lái màn hình dọc
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Responsive Stylesheet for Driving Simulator on iPad, Tablet & Mobile */}
    </div>
  );
};