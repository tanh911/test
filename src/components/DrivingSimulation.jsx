import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import { WebGLRenderer } from 'three';
import { float, color, time, mix, Fn } from 'three/tsl';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SCENARIOS, initScore, applyEvent } from './SimScenarios.js';
import { fetchOSMData, buildRoads, buildBuildings, buildGround, buildLaneMarkings, buildTrees, lngLatToXZ } from '../utils/osmCity.js';

// ── Cockpit HUD ──────────────────────────────────────────────────────────────
const Gauge = ({ value, max, unit, label, col, size = 110 }) => {
  const r = size / 2 - 14, cx = size / 2, cy = size / 2;
  const toR = d => d * Math.PI / 180;
  const arc = (a1, a2, rad) => {
    const s = toR(a1 - 90), e = toR(a2 - 90), lg = a2 - a1 > 180 ? 1 : 0;
    return `M${cx + rad * Math.cos(s)} ${cy + rad * Math.sin(s)} A${rad} ${rad} 0 ${lg} 1 ${cx + rad * Math.cos(e)} ${cy + rad * Math.sin(e)}`;
  };
  const pct = Math.min(value / max, 1);
  const needleA = 225 + pct * 270 - 90;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r + 12} fill="#111" stroke="#222" strokeWidth="1" />
      <path d={arc(225, 495, r)} fill="none" stroke="#333" strokeWidth="7" />
      <path d={arc(225, 225 + pct * 270, r)} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + r * 0.7 * Math.cos(toR(needleA))} y2={cy + r * 0.7 * Math.sin(toR(needleA))} stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#444" />
      <text x={cx} y={cy + 26} textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">{Math.round(value)}</text>
      <text x={cx} y={cy + 38} textAnchor="middle" fill="#888" fontSize="8">{unit}</text>
    </svg>
  );
};

const ScoreHUD = ({ score, events }) => (
  <div style={{ position: 'absolute', top: 16, right: '14%', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
    <div style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid #444', borderRadius: 10, padding: '8px 16px', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: '#aaa', fontSize: 12 }}>Điểm:</span>
      <span style={{ color: score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444', fontSize: 26, fontWeight: 'bold', fontFamily: 'monospace' }}>{score}</span>
      <span style={{ color: '#666', fontSize: 11 }}>/100</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflow: 'hidden' }}>
      {events.slice(-3).map((ev, i) => (
        <div key={i} style={{ background: ev.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${ev.passed ? '#22c55e44' : '#ef444444'}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: ev.passed ? '#86efac' : '#fca5a5', backdropFilter: 'blur(4px)', maxWidth: 240 }}>{ev.msg}</div>
      ))}
    </div>
  </div>
);

const InstructionPanel = ({ scenario }) => {
  if (!scenario) return null;
  const colors = { TRAFFIC_LIGHT: '#ef4444', STOP_SIGN: '#dc2626', YIELD: '#f59e0b', SPEED_LIMIT: '#3b82f6', PRIORITY: '#22c55e' };
  return (
    <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: 'rgba(0,0,0,0.8)', border: `2px solid ${colors[scenario.type] || '#666'}`, borderRadius: 12, padding: '10px 24px', backdropFilter: 'blur(8px)', textAlign: 'center', maxWidth: 340 }}>
      <div style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{scenario.warn}</div>
    </div>
  );
};

const CockpitOverlay = ({ speed, rpm, steer, isDriving, onToggle, activeScenario, score, events, rearMirrorRef, leftMirrorRef, rightMirrorRef }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}>

    {/* ── Left door frame + window pillar ── */}
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, width: '9%',
      background: 'linear-gradient(to right, #c8c0b0 0%, #b0a898 55%, transparent 100%)',
    }} />
    {/* Left A-pillar (angled — wide at top, narrow at bottom) */}
    <div style={{
      position: 'absolute', left: 0, top: 0, width: '14%', height: '72%',
      background: 'linear-gradient(135deg, #d4ccbc 0%, #b8b0a0 40%, transparent 100%)',
      clipPath: 'polygon(0 0, 100% 0, 28% 100%, 0 100%)',
    }} />

    {/* ── Right A-pillar (mirror) ── */}
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: '9%',
      background: 'linear-gradient(to left, #c8c0b0 0%, #b0a898 55%, transparent 100%)',
    }} />
    <div style={{
      position: 'absolute', right: 0, top: 0, width: '14%', height: '72%',
      background: 'linear-gradient(225deg, #d4ccbc 0%, #b8b0a0 40%, transparent 100%)',
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 72% 100%)',
    }} />

    {/* ── Rearview mirror (top center) ── */}
    <div style={{
      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '16%', height: 54,
      background: '#1a1510',
      borderRadius: '0 0 8px 8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      <canvas ref={rearMirrorRef} width={200} height={46}
        style={{ width: '92%', height: 42, borderRadius: 3, border: '1px solid #555', display: 'block' }} />
    </div>

    {/* ── Left wing mirror ── */}
    <div style={{
      position: 'absolute', left: '7%', top: '30%',
      width: 84, height: 50,
      background: 'linear-gradient(135deg, #c8c0b0, #a8a098)',
      borderRadius: '4px 8px 8px 4px', border: '1px solid #888',
      boxShadow: '4px 4px 12px rgba(0,0,0,0.4)', overflow: 'hidden',
    }}>
      <canvas ref={leftMirrorRef} width={112} height={64}
        style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>

    {/* ── Right wing mirror ── */}
    <div style={{
      position: 'absolute', right: '7%', top: '30%',
      width: 84, height: 50,
      background: 'linear-gradient(225deg, #c8c0b0, #a8a098)',
      borderRadius: '8px 4px 4px 8px', border: '1px solid #888',
      boxShadow: '-4px 4px 12px rgba(0,0,0,0.4)', overflow: 'hidden',
    }}>
      <canvas ref={rightMirrorRef} width={112} height={64}
        style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>

    {/* ── Dashboard bottom panel ── */}
    {/* Curved top of dashboard visible at ~65% down */}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%',
    }}>
      {/* Dark curved dash body */}
      <svg viewBox="0 0 1000 380" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
        <path d="M0,120 Q250,60 500,80 Q750,60 1000,120 L1000,380 L0,380 Z" fill="#1a1814" />
        <path d="M0,130 Q250,70 500,90 Q750,70 1000,130" fill="none" stroke="#2a2520" strokeWidth="3" />
      </svg>

      {/* Gauge cluster */}
      <div style={{
        position: 'absolute', bottom: 12, left: 0, right: 0,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 20,
      }}>
        <Gauge value={rpm} max={8000} unit="RPM" col="#ef4444" size={120} />

        {/* Center console */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          {/* Digital speedometer display */}
          <div style={{
            background: '#0c0c0c', border: '1px solid #222', borderRadius: 6,
            padding: '4px 16px', textAlign: 'center', minWidth: 80,
          }}>
            <div style={{ color: '#22d3ee', fontSize: 30, fontFamily: 'monospace', fontWeight: 'bold', lineHeight: 1 }}>{Math.round(speed)}</div>
            <div style={{ color: '#444', fontSize: 9, letterSpacing: 1 }}>km/h</div>
          </div>

          {/* Steering wheel */}
          <div style={{ transform: `rotate(${steer * 45}deg)`, transition: 'transform 0.08s ease' }}>
            <svg viewBox="0 0 100 100" width="100" height="100">
              {/* Outer rim */}
              <circle cx="50" cy="50" r="44" fill="none" stroke="#1a1510" strokeWidth="13" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#2d2820" strokeWidth="10" />
              {/* Grip sections */}
              <path d="M50,6 A44,44 0 0,1 88,28" fill="none" stroke="#3a3530" strokeWidth="10" strokeLinecap="round" />
              <path d="M88,72 A44,44 0 0,1 50,94" fill="none" stroke="#3a3530" strokeWidth="10" strokeLinecap="round" />
              <path d="M12,28 A44,44 0 0,1 50,6" fill="none" stroke="#3a3530" strokeWidth="10" strokeLinecap="round" />
              <path d="M50,94 A44,44 0 0,1 12,72" fill="none" stroke="#3a3530" strokeWidth="10" strokeLinecap="round" />
              {/* Spokes */}
              <line x1="50" y1="50" x2="50" y2="14" stroke="#252020" strokeWidth="7" strokeLinecap="round" />
              <line x1="50" y1="50" x2="80" y2="68" stroke="#252020" strokeWidth="7" strokeLinecap="round" />
              <line x1="50" y1="50" x2="20" y2="68" stroke="#252020" strokeWidth="7" strokeLinecap="round" />
              {/* Center hub */}
              <circle cx="50" cy="50" r="11" fill="#1a1510" stroke="#2a2520" strokeWidth="2" />
              <circle cx="50" cy="50" r="5" fill="#888" />
            </svg>
          </div>

          {/* Start/Stop */}
          <button onClick={onToggle} style={{
            pointerEvents: 'all', padding: '5px 18px', fontSize: 11, fontWeight: 'bold',
            borderRadius: 20, border: `2px solid ${isDriving ? '#ef4444' : '#22c55e'}`,
            background: isDriving ? 'rgba(127,29,29,0.9)' : 'rgba(20,83,45,0.9)',
            color: isDriving ? '#ef4444' : '#22c55e',
            cursor: 'pointer', backdropFilter: 'blur(4px)',
            boxShadow: `0 0 12px ${isDriving ? '#ef444460' : '#22c55e60'}`,
          }}>
            {isDriving ? '■ STOP' : '▶ START'}
          </button>
        </div>

        <Gauge value={speed} max={240} unit="km/h" col="#3b82f6" size={120} />
      </div>
    </div>

    {/* Instruction banner */}
    <InstructionPanel scenario={activeScenario} />
    {/* Score */}
    <ScoreHUD score={score} events={events} />
  </div>
);

// ── 3D World Builder ─────────────────────────────────────────────────────────
function buildWorld(scene) {
  const stdM = (c, r = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: r });

  // Road
  const road = new THREE.Mesh(new THREE.PlaneGeometry(12, 3000), stdM(0x444444));
  road.rotation.x = -Math.PI / 2; road.position.z = -1000; scene.add(road);

  // Grass
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 3000), stdM(0x3a7a2a, 1));
  grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.01, -1000); scene.add(grass);

  // Sidewalk strips
  [-7, 7].forEach(x => {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(3, 3000), stdM(0x999988, 0.9));
    sw.rotation.x = -Math.PI / 2; sw.position.set(x, 0.02, -1000); scene.add(sw);
  });

  // Scenery group (loops)
  const scenery = new THREE.Group();
  const LOOP = 100, STEP = 10;
  const trunkM = stdM(0x5c3d1e, 1), leafM = stdM(0x2d6b1e, 0.9);
  const bMats = [stdM(0xc8b89a), stdM(0xa05030, 0.9), stdM(0xd8d0b8, 0.7)];

  for (let i = 0; i < LOOP; i++) {
    const z = -i * STEP;
    // Lane dashes
    [-2, 2].forEach(x => {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      d.rotation.x = -Math.PI / 2; d.position.set(x, 0.03, z); scenery.add(d);
    });
    // Curbs
    [-5.5, 5.5].forEach(x => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, STEP), stdM(0xbbbbaa, 0.95));
      c.position.set(x, 0.05, z); scenery.add(c);
    });
    // Trees every 20m
    if (i % 2 === 0) {
      [-9, 9].forEach(x => {
        const g = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.5, 6), trunkM);
        trunk.position.y = 1.25;
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.7, 7, 6), leafM);
        leaf.position.y = 3.2;
        g.add(trunk); g.add(leaf); g.position.set(x, 0, z); scenery.add(g);
      });
    }
    // Buildings every 30m
    if (i % 3 === 0) {
      const h = 6 + (i % 6) * 1.5;
      [-16, 16].forEach(x => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(11, h, 18), bMats[i % 3]);
        b.position.set(x, h / 2, z); scenery.add(b);
      });
    }
  }
  scene.add(scenery);
  return { scenery, LOOP: LOOP * STEP };
}

// Build a traffic light object
function makeTrafficLight(isRed) {
  const g = new THREE.Group();
  // Post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4, 6), new THREE.MeshStandardMaterial({ color: 0x555555 }));
  post.position.set(0, 2, 0);
  g.add(post);
  // Housing
  const house = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  house.position.y = 4.5; g.add(house);
  // Red light
  const red = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshBasicMaterial({ color: isRed ? 0xff0000 : 0x440000 }));
  red.position.set(0, 4.85, 0.26); g.add(red);
  // Green light
  const grn = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshBasicMaterial({ color: isRed ? 0x004400 : 0x00cc00 }));
  grn.position.set(0, 4.15, 0.26); g.add(grn);
  g._redLight = red; g._grnLight = grn;
  return g;
}

// ── Mobile button style helper ───────────────────────────────────────────────
const btnStyle = (col) => ({
  background: `rgba(0,0,0,0.6)`,
  border: `2px solid ${col}`,
  borderRadius: 10,
  color: col,
  fontWeight: 'bold',
  fontSize: 11,
  width: '100%',
  height: '100%',
  cursor: 'pointer',
  backdropFilter: 'blur(6px)',
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
});

// ── Main Component ───────────────────────────────────────────────────────────
export const DrivingSimulation = () => {
  const containerRef = useRef(null);
  const rearMirrorRef = useRef(null);
  const leftMirrorRef = useRef(null);
  const rightMirrorRef = useRef(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isDriving, setIsDriving] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [steerAngle, setSteerAngle] = useState(0);
  const [activeScenario, setActiveScenario] = useState(null);
  const [score, setScore] = useState(100);
  const [events, setEvents] = useState([]);
  const [finished, setFinished] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Đang khởi động...');
  const isMobile = 'ontouchstart' in window;

  const refs = useRef({ isDriving: false, speed: 0, steer: 0, keys: {}, distanceTraveled: 0, scenarioIdx: 0, activeScenario: null, scenarioChecked: false, scoreState: initScore() });

  useEffect(() => { refs.current.isDriving = isDriving; }, [isDriving]);

  // Keyboard controls
  useEffect(() => {
    const dn = e => { refs.current.keys[e.key] = true; };
    const up = e => { refs.current.keys[e.key] = false; };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  // Touch helpers: press/release virtual key
  const touchPress = key => { refs.current.keys[key] = true; };
  const touchRelease = key => { refs.current.keys[key] = false; };
  const touchBtn = (key) => ({
    onTouchStart: e => { e.preventDefault(); touchPress(key); },
    onTouchEnd: e => { e.preventDefault(); touchRelease(key); },
    onMouseDown: () => touchPress(key),
    onMouseUp: () => touchRelease(key),
    onMouseLeave: () => touchRelease(key),
  });

  useEffect(() => {
    let isMounted = true, renderer, clock, reqId;
    const trafficLights = [];

    const init = async () => {
      try {
        if (!navigator.gpu) throw new Error('WebGPU not supported. Use Chrome 113+ or Edge 113+.');
        clock = new THREE.Clock();
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.Fog(0x87ceeb, 60, 320);

        scene.add(new THREE.AmbientLight(0xffffff, 1.3));
        const sun = new THREE.DirectionalLight(0xfff5e0, 2);
        sun.position.set(30, 80, 50); scene.add(sun);

        const camera = new THREE.PerspectiveCamera(68, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 700);
        camera.position.set(0, 1.3, 0);
        camera.lookAt(0, 1.3, -50);

        renderer = new THREE.WebGPURenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        await renderer.init();
        if (!isMounted) { renderer.dispose(); return; }
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);

        // ── Load OSM city (Munich) ──
        setLoadingMsg('Đang tải bản đồ Munich từ OpenStreetMap...');
        let geojson;
        try {
          geojson = await fetchOSMData(msg => setLoadingMsg(msg));
        } catch (osmErr) {
          console.warn('OSM load failed, using fallback:', osmErr);
          geojson = null;
        }

        buildGround(scene);

        let carStartX = 0, carStartZ = 0;
        if (geojson) {
          setLoadingMsg('Đang vẽ đường phố...');
          buildRoads(geojson, scene);
          setLoadingMsg('Đang xây dựng tòa nhà...');
          buildBuildings(geojson, scene);
          setLoadingMsg('Đang thêm chi tiết...');
          buildLaneMarkings(geojson, scene);
          buildTrees(geojson, scene);

          // Start car on a main road in Munich center
          const start = lngLatToXZ(11.575, 48.137);
          carStartX = start.x; carStartZ = start.z;
        } else {
          // Fallback to procedural if OSM fails
          const { scenery } = buildWorld(scene);
          refs.current._scenery = scenery;
          refs.current._LOOP = 1000;
        }

        camera.position.set(carStartX, 1.3, carStartZ);
        camera.lookAt(carStartX, 1.3, carStartZ - 50);
        setLoadingMsg(null);

        // Traffic lights at scenario positions (offset from car start)
        SCENARIOS.filter(s => s.type === 'TRAFFIC_LIGHT').forEach(s => {
          const tl = makeTrafficLight(true);
          tl.position.set(carStartX + 7, 0, carStartZ - s.triggerZ - 5);
          scene.add(tl);
          trafficLights.push({ tl, scenario: s });
        });

        refs.current._carX = carStartX;
        refs.current._carZ = carStartZ;
        refs.current._yaw = 0;

        // ── Traffic AI ──────────────────────────────────────────────────────
        const TRAFFIC_COUNT = 24;
        const trafficColors = [0xcc2222, 0x1133aa, 0xeeeeee, 0x111111, 0x445533, 0xcc8822, 0x4477aa];
        
        // Car Body
        const trafficInstances = trafficColors.map(col => {
          const m = new THREE.InstancedMesh(
            new THREE.BoxGeometry(1.8, 0.7, 4.4),
            new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, metalness: 0.3 }),
            Math.ceil(TRAFFIC_COUNT / trafficColors.length)
          );
          scene.add(m);
          return m;
        });
        
        // Car Windows/Cabin (Black Glass)
        const roofInstances = trafficColors.map(() => {
          const m = new THREE.InstancedMesh(
            new THREE.BoxGeometry(1.5, 0.6, 2.2),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.1, metalness: 0.8 }),
            Math.ceil(TRAFFIC_COUNT / trafficColors.length)
          );
          scene.add(m);
          return m;
        });

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const wheelInstances = new THREE.InstancedMesh(wheelGeo, wheelMat, TRAFFIC_COUNT * 4);
        scene.add(wheelInstances);

        // Headlights/Taillights
        const lightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
        const frontLightInstances = new THREE.InstancedMesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xffffee }), TRAFFIC_COUNT * 2);
        const rearLightInstances = new THREE.InstancedMesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }), TRAFFIC_COUNT * 2);
        scene.add(frontLightInstances); scene.add(rearLightInstances);

        // Each AI car state
        const aiCars = Array.from({ length: TRAFFIC_COUNT }, (_, i) => {
          const isSameDir = Math.random() > 0.5;
          return {
            x: carStartX + (isSameDir ? -2.2 : 2.2),
            z: carStartZ - 20 - Math.random() * 300,
            speed: 25 + Math.random() * 30, // absolute km/h
            isSameDir,
            yaw: isSameDir ? 0 : Math.PI,
            colorIdx: i % trafficColors.length,
            id: i
          };
        });

        const _matrix = new THREE.Matrix4();
        const _quat = new THREE.Quaternion();
        const _scale = new THREE.Vector3(1, 1, 1);

        // ── Mirror renderer (small WebGL for compatibility) ──────────────────
        let mirrorRenderer = null;
        const rearCam = new THREE.PerspectiveCamera(100, 3.2, 0.1, 300);
        const leftCam = new THREE.PerspectiveCamera(80, 1.75, 0.1, 80);
        const rightCam = new THREE.PerspectiveCamera(80, 1.75, 0.1, 80);

        if (rearMirrorRef.current) {
          try {
            mirrorRenderer = new WebGLRenderer({ antialias: false });
            mirrorRenderer.setPixelRatio(1);
            mirrorRenderer.shadowMap.enabled = false;
          } catch (e) { mirrorRenderer = null; }
        }

        const animate = () => {
          reqId = requestAnimationFrame(animate);
          const dt = clock.getDelta();
          const r = refs.current;
          const keys = r.keys;

          // Speed
          if (r.isDriving) {
            if (keys['w'] || keys['ArrowUp']) r.speed = Math.min(r.speed + 50 * dt, 150);
            else if (keys['s'] || keys['ArrowDown']) r.speed = Math.max(r.speed - 80 * dt, 0);
            else r.speed = Math.max(r.speed - 20 * dt, 0);
          } else {
            r.speed = Math.max(r.speed - 40 * dt, 0);
          }
          // Steer — update heading angle based on input
          const MAX_TURN_RATE = 1.2; // rad/s at full steer
          if (keys['a'] || keys['ArrowLeft']) {
            r.steer = Math.max(r.steer - 3 * dt, -1);
          } else if (keys['d'] || keys['ArrowRight']) {
            r.steer = Math.min(r.steer + 3 * dt, 1);
          } else {
            r.steer *= (1 - 8 * dt);
          }

          setSpeed(r.speed); setSteerAngle(r.steer);

          // Update heading: steer rotates yaw proportionally to speed
          const mps = r.speed / 3.6;
          const turnRate = r.steer * MAX_TURN_RATE * Math.min(mps / 10, 1);
          r._yaw = (r._yaw || 0) + turnRate * dt;
          r.distanceTraveled += mps * dt;

          // Direction vector from yaw
          const dirX = Math.sin(r._yaw);
          const dirZ = -Math.cos(r._yaw); // -Z is forward

          if (r._scenery) {
            // Fallback procedural: scroll scenery, steer offset only
            r._scenery.position.z += mps * dt;
            if (r._scenery.position.z > r._LOOP) r._scenery.position.z -= r._LOOP;
            camera.position.x = r.steer * 0.3;
            camera.lookAt(r.steer * 0.3, 1.3, -50);
          } else {
            // OSM mode: move car position along heading direction
            r._carX = (r._carX || 0) + dirX * mps * dt;
            r._carZ = (r._carZ || 0) + dirZ * mps * dt;

            // 1st-person camera: slightly offset left (driver seat)
            const seatX = r._carX - Math.sin(r._yaw + Math.PI / 2) * 0.25;
            const seatZ = r._carZ - Math.cos(r._yaw + Math.PI / 2) * 0.25;
            camera.position.set(seatX, 1.3, seatZ);

            // Look ahead in direction of travel
            const lookDist = 20;
            camera.lookAt(seatX + dirX * lookDist, 1.3, seatZ + dirZ * lookDist);
          }

          // Scenario logic
          if (!finished) {
            const dist = r.distanceTraveled;
            const idx = r.scenarioIdx;
            if (idx < SCENARIOS.length) {
              const sc = SCENARIOS[idx];
              if (dist >= sc.triggerZ && !r.activeScenario) {
                r.activeScenario = sc; r.scenarioChecked = false;
                setActiveScenario(sc);
              }
              if (r.activeScenario && dist >= sc.resolveZ) {
                const passed = sc.check(r.speed);
                const newSS = applyEvent(r.scoreState, sc, passed);
                r.scoreState = newSS;
                setScore(newSS.points);
                setEvents([...newSS.events]);
                r.activeScenario = null; r.scenarioIdx = idx + 1;
                setActiveScenario(null);
                if (idx + 1 >= SCENARIOS.length) setFinished(true);
              }
            }
          }

          // Traffic light color sync
          trafficLights.forEach(({ tl, scenario, isRed }) => {
            const dist = refs.current.distanceTraveled;
            const active = dist >= scenario.triggerZ - 30 && dist < scenario.resolveZ;
            const red = active; // simple: red when approaching
            tl._redLight.material.color.set(red ? 0xff2200 : 0x330000);
            tl._grnLight.material.color.set(red ? 0x002200 : 0x00cc44);
          });

          // ── Update traffic AI ────────────────────────────────────────────
          const colorCount = new Array(trafficColors.length).fill(0);
          
          aiCars.forEach(car => {
            const carMPS = car.speed / 3.6;
            // Move forward along its yaw
            car.x += Math.sin(car.yaw) * carMPS * dt;
            car.z -= Math.cos(car.yaw) * carMPS * dt;
            
            // Distance check relative to player
            const dx = car.x - (r._carX || 0);
            const dz = car.z - (r._carZ || 0);
            const dist = Math.sqrt(dx*dx + dz*dz);
            
            const fwdX = Math.sin(r._yaw || 0);
            const fwdZ = -Math.cos(r._yaw || 0);
            const rightX = Math.cos(r._yaw || 0);
            const rightZ = Math.sin(r._yaw || 0);
            
            // Project distance onto player's forward vector
            const relFwd = dx * fwdX + dz * fwdZ;
            
            // Respawn if too far behind/ahead
            if (relFwd < -120 || relFwd > 250 || dist > 300) {
              const spawnDist = (Math.random() > 0.3 ? 180 : -100) + Math.random() * 60;
              const laneOffset = car.isSameDir ? -2.2 : 2.2;
              
              car.yaw = (r._yaw || 0) + (car.isSameDir ? 0 : Math.PI);
              car.x = (r._carX || 0) + fwdX * spawnDist + rightX * laneOffset;
              car.z = (r._carZ || 0) + fwdZ * spawnDist + rightZ * laneOffset;
            }

            // Matrices
            const iIdx = colorCount[car.colorIdx];
            colorCount[car.colorIdx]++;
            _quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), car.yaw);
            
            // Body
            _matrix.compose(new THREE.Vector3(car.x, 0.45, car.z), _quat, _scale);
            trafficInstances[car.colorIdx].setMatrixAt(iIdx, _matrix);
            
            // Cabin (shifted backward relative to car heading)
            const cFwdX = Math.sin(car.yaw), cFwdZ = -Math.cos(car.yaw);
            _matrix.compose(new THREE.Vector3(car.x - cFwdX * 0.3, 1.1, car.z - cFwdZ * 0.3), _quat, _scale);
            roofInstances[car.colorIdx].setMatrixAt(iIdx, _matrix);

            // Wheels (4 per car)
            const wRightX = Math.cos(car.yaw), wRightZ = Math.sin(car.yaw);
            const offsets = [
              { f: 1.4, r: 1.0 }, { f: 1.4, r: -1.0 }, // Front L/R
              { f: -1.2, r: 1.0 }, { f: -1.2, r: -1.0 } // Rear L/R
            ];
            offsets.forEach((off, wI) => {
              const wx = car.x + cFwdX * off.f + wRightX * off.r;
              const wz = car.z + cFwdZ * off.f + wRightZ * off.r;
              _matrix.compose(new THREE.Vector3(wx, 0.35, wz), _quat, _scale);
              wheelInstances.setMatrixAt(car.id * 4 + wI, _matrix);
            });

            // Lights
            _matrix.compose(new THREE.Vector3(car.x + cFwdX * 2.2 + wRightX * 0.7, 0.6, car.z + cFwdZ * 2.2 + wRightZ * 0.7), _quat, _scale);
            frontLightInstances.setMatrixAt(car.id * 2, _matrix);
            _matrix.compose(new THREE.Vector3(car.x + cFwdX * 2.2 - wRightX * 0.7, 0.6, car.z + cFwdZ * 2.2 - wRightZ * 0.7), _quat, _scale);
            frontLightInstances.setMatrixAt(car.id * 2 + 1, _matrix);

            _matrix.compose(new THREE.Vector3(car.x - cFwdX * 2.2 + wRightX * 0.7, 0.6, car.z - cFwdZ * 2.2 + wRightZ * 0.7), _quat, _scale);
            rearLightInstances.setMatrixAt(car.id * 2, _matrix);
            _matrix.compose(new THREE.Vector3(car.x - cFwdX * 2.2 - wRightX * 0.7, 0.6, car.z - cFwdZ * 2.2 - wRightZ * 0.7), _quat, _scale);
            rearLightInstances.setMatrixAt(car.id * 2 + 1, _matrix);
          });
          
          trafficInstances.forEach(m => { m.instanceMatrix.needsUpdate = true; });
          roofInstances.forEach(m => { m.instanceMatrix.needsUpdate = true; });
          wheelInstances.instanceMatrix.needsUpdate = true;
          frontLightInstances.instanceMatrix.needsUpdate = true;
          rearLightInstances.instanceMatrix.needsUpdate = true;

          // ── Render mirrors via secondary WebGL renderer ───────────────────
          if (mirrorRenderer && r._carX !== undefined) {
            const cx = r._carX, cz = r._carZ;
            const dx = Math.sin(r._yaw), dz = -Math.cos(r._yaw);
            const rx = -Math.sin(r._yaw + Math.PI / 2) * 0.4; // driver seat offset

            // Rear mirror: camera behind car, looking back forward
            const bx = cx - dx * 4, bz = cz - dz * 4;
            rearCam.position.set(bx + rx, 1.8, bz);
            rearCam.lookAt(cx + dx * 20 + rx, 1.2, cz + dz * 20); // look forward = what's behind us

            // Actually rear mirror should show what's BEHIND = camera looks backward
            rearCam.position.set(cx + rx, 1.8, cz);
            rearCam.lookAt(cx - dx * 30 + rx, 1.0, cz - dz * 30);

            if (rearMirrorRef.current) {
              mirrorRenderer.setSize(rearMirrorRef.current.width, rearMirrorRef.current.height);
              mirrorRenderer.render(scene, rearCam);
              const ctx = rearMirrorRef.current.getContext('2d');
              if (ctx) ctx.drawImage(mirrorRenderer.domElement, 0, 0);
            }

            // Left mirror: behind-left
            const perpX = -Math.cos(r._yaw), perpZ = -Math.sin(r._yaw);
            leftCam.position.set(cx - perpX * 1, 1.4, cz - perpZ * 1);
            leftCam.lookAt(cx - dx * 20 - perpX * 5, 1.0, cz - dz * 20 - perpZ * 5);
            if (leftMirrorRef.current) {
              mirrorRenderer.setSize(leftMirrorRef.current.width, leftMirrorRef.current.height);
              mirrorRenderer.render(scene, leftCam);
              const ctx = leftMirrorRef.current.getContext('2d');
              if (ctx) ctx.drawImage(mirrorRenderer.domElement, 0, 0);
            }

            // Right mirror: behind-right
            rightCam.position.set(cx + perpX * 1, 1.4, cz + perpZ * 1);
            rightCam.lookAt(cx - dx * 20 + perpX * 5, 1.0, cz - dz * 20 + perpZ * 5);
            if (rightMirrorRef.current) {
              mirrorRenderer.setSize(rightMirrorRef.current.width, rightMirrorRef.current.height);
              mirrorRenderer.render(scene, rightCam);
              const ctx = rightMirrorRef.current.getContext('2d');
              if (ctx) ctx.drawImage(mirrorRenderer.domElement, 0, 0);
            }
          }

          renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
          if (!containerRef.current || !renderer) return;
          camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        });
      } catch (err) {
        console.error(err); setError(err.message);
      }
    };
    init();
    return () => {
      isMounted = false;
      if (reqId) cancelAnimationFrame(reqId);
      if (renderer) renderer.dispose();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  const rpm = isDriving ? Math.min(800 + (speed / 150) * 6500, 7300) : 800;

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 60px)', background: '#000', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading Screen */}
      {loadingMsg && (
        <div style={{ position: 'absolute', inset: 0, background: '#0a0c10', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30, gap: 20 }}>
          <div style={{ fontSize: 48 }}>🗺️</div>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>Đang tải bản đồ Munich</div>
          <div style={{ color: '#60a5fa', fontSize: 14 }}>{loadingMsg}</div>
          {/* Progress bar animation */}
          <div style={{ width: 280, height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(to right, #3b82f6, #60a5fa)', borderRadius: 2, animation: 'osmLoad 2s ease-in-out infinite' }} />
          </div>
          <div style={{ color: '#475569', fontSize: 12, maxWidth: 300, textAlign: 'center' }}>
            Dữ liệu đường phố thật từ OpenStreetMap · Munich, Đức
          </div>
          <style>{`@keyframes osmLoad { 0%{width:5%} 50%{width:85%} 100%{width:5%} }`}</style>
        </div>
      )}

      {!error && (
        <CockpitOverlay
          speed={speed} rpm={rpm} steer={steerAngle}
          isDriving={isDriving} onToggle={() => setIsDriving(p => !p)}
          activeScenario={activeScenario} score={score} events={events}
          rearMirrorRef={rearMirrorRef}
          leftMirrorRef={leftMirrorRef}
          rightMirrorRef={rightMirrorRef}
        />
      )}

      <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: '12%', zIndex: 20, background: 'rgba(0,0,0,0.65)', border: '1px solid #555', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <ArrowLeft size={18} color="white" />
      </button>

      {!isDriving && !error && !finished && speed < 1 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '24px 36px', borderRadius: 14, textAlign: 'center', border: '1px solid #444', zIndex: 10 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🚗</div>
          <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 6 }}>Mô phỏng lái xe Đức</div>
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 12 }}>Làm theo hướng dẫn để không bị trừ điểm!</div>
          {isMobile
            ? <div style={{ color: '#666', fontSize: 11, lineHeight: 1.8 }}>Dùng nút điều khiển ở góc màn hình</div>
            : <div style={{ color: '#666', fontSize: 11, lineHeight: 1.8 }}>W/↑ Tăng ga · S/↓ Phanh · A/← D/→ Lái</div>
          }
        </div>
      )}

      {/* ── Mobile Touch D-pad ── */}
      {isMobile && !error && !finished && (
        <div style={{ position: 'absolute', bottom: '40%', left: 0, right: 0, zIndex: 20, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
          {/* Left cluster: steer */}
          <div style={{ pointerEvents: 'all', display: 'grid', gridTemplateColumns: '56px 56px', gridTemplateRows: '56px', gap: 8 }}>
            <button {...touchBtn('ArrowLeft')} style={btnStyle('#3b82f6')}>◀ Lái</button>
            <button {...touchBtn('ArrowRight')} style={btnStyle('#3b82f6')}>Lái ▶</button>
          </div>
          {/* Right cluster: gas + brake */}
          <div style={{ pointerEvents: 'all', display: 'grid', gridTemplateColumns: '56px 56px', gridTemplateRows: '56px', gap: 8 }}>
            <button {...touchBtn('ArrowDown')} style={btnStyle('#ef4444')}>🛑 Phanh</button>
            <button {...touchBtn('ArrowUp')} style={btnStyle('#22c55e')}>⬆ Ga</button>
          </div>
        </div>
      )}

      {finished && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.92)', color: 'white', padding: '32px 48px', borderRadius: 16, textAlign: 'center', border: '1px solid #555', zIndex: 30, minWidth: 300 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{score >= 80 ? '🏆' : score >= 60 ? '✅' : '❌'}</div>
          <div style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 8 }}>Kết thúc bài lái thử!</div>
          <div style={{ fontSize: 40, color: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444', fontWeight: 'bold', marginBottom: 4 }}>{score} điểm</div>
          <div style={{ color: '#aaa', fontSize: 14, marginBottom: 20 }}>{score >= 80 ? 'Xuất sắc! Bạn đã vượt qua bài thi thực hành.' : score >= 60 ? 'Tạm được, cần cải thiện thêm.' : 'Cần ôn luyện thêm về luật giao thông.'}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => { refs.current = { isDriving: false, speed: 0, steer: 0, keys: {}, distanceTraveled: 0, scenarioIdx: 0, activeScenario: null, scenarioChecked: false, scoreState: initScore() }; setScore(100); setEvents([]); setFinished(false); setActiveScenario(null); setIsDriving(false); setSpeed(0); }} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>🔄 Chơi lại</button>
            <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#374151', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>← Quay lại</button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', inset: 0, background: '#0d0d0d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 20, color: 'white' }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2>WebGPU không khả dụng</h2>
          <p style={{ color: '#aaa', maxWidth: 380, textAlign: 'center' }}>{error}</p>
          <button onClick={() => navigate(-1)} style={{ padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Quay lại</button>
        </div>
      )}
    </div>
  );
};
