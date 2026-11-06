import React from 'react';
import {
  ArrowLeft, Camera, Sun, Moon, CloudRain, AlertTriangle, Lightbulb,
  Volume2, VolumeX, Eye, Move, Layers
} from 'lucide-react';
import { MAP_TYPES, SCENARIOS, MAP_SCENARIOS } from '../components/SimScenarios.js';

export const MapSelector = ({ selectedMapId, onSelectMap }) => (
  <div style={{
    position: 'absolute', top: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 35,
    display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(9, 9, 11, 0.94)',
    padding: '6px 14px', borderRadius: 20, border: '1.5px solid rgba(56, 189, 248, 0.5)',
    backdropFilter: 'blur(14px)', boxShadow: '0 8px 25px rgba(0,0,0,0.7)', pointerEvents: 'all'
  }}>
    <div style={{ color: '#38bdf8', fontSize: 10, fontWeight: '900', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
      <Layers size={13} color="#38bdf8" /> BẢN ĐỒ:
    </div>
    {MAP_TYPES.map(m => (
      <button
        key={m.id}
        onClick={() => onSelectMap(m.id)}
        title={m.desc}
        style={{
          background: selectedMapId === m.id ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(255,255,255,0.06)',
          color: selectedMapId === m.id ? '#ffffff' : '#94a3b8',
          border: selectedMapId === m.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
          padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: '800', cursor: 'pointer'
        }}
      >
        <span>{m.icon}</span> <span>{m.nameVi}</span>
      </button>
    ))}
  </div>
);

export const TouchControls = ({ isDriving, refs, setSchulterblick, setIsDriving }) => {
  if (!isDriving) return null;

  return (
    <>
      <div style={{ position: 'absolute', top: 120, left: 16, zIndex: 28, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={() => setSchulterblick(-Math.PI / 2.5)} style={schulterBtnStyle}>
          <Eye size={12} /> Schulterblick Trái (Z)
        </button>
        <button onClick={() => setSchulterblick(Math.PI / 2.5)} style={schulterBtnStyle}>
          <Eye size={12} /> Schulterblick Phải (X)
        </button>
      </div>

      <div style={{ position: 'absolute', bottom: 110, left: 24, zIndex: 28, display: 'flex', gap: 10 }}>
        <SteerButton refs={refs} dir="a" label="◄ A" />
        <SteerButton refs={refs} dir="d" label="D ►" />
      </div>

      <div style={{ position: 'absolute', bottom: 110, right: 24, zIndex: 28, display: 'flex', gap: 10 }}>
        <PedalButton keyCode="s" refs={refs} label="PHANH (S)" emoji="🛑" color="red" />
        <PedalButton keyCode="w" refs={refs} setIsDriving={setIsDriving} label="TĂNG GA (W)" emoji="⚡" color="green" />
      </div>
    </>
  );
};

const schulterBtnStyle = {
  background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(56,189,248,0.5)',
  color: '#38bdf8', padding: '6px 12px', borderRadius: 10, fontSize: 10,
  fontWeight: '800', cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 4
};

function SteerButton({ refs, dir, label }) {
  return (
    <button
      onClick={() => {
        refs.current.buttonSteerActive = true;
        refs.current.targetSteer = dir === 'a' ? -1 : 1;
        setTimeout(() => { refs.current.targetSteer = 0; refs.current.buttonSteerActive = false; }, 800);
      }}
      onMouseDown={() => { refs.current.keys[dir] = true; }}
      onMouseUp={() => { refs.current.keys[dir] = false; }}
      onTouchStart={() => { refs.current.keys[dir] = true; }}
      onTouchEnd={() => { refs.current.keys[dir] = false; }}
      style={steerBtnStyle}
    >
      {label}
    </button>
  );
}

function PedalButton({ keyCode, refs, setIsDriving, label, emoji, color }) {
  const isGreen = color === 'green';
  return (
    <button
      onMouseDown={() => {
        refs.current.keys[keyCode] = true;
        if (isGreen && !refs.current.isDriving) {
          refs.current.isDriving = true;
          setIsDriving?.(true);
        }
      }}
      onMouseUp={() => { refs.current.keys[keyCode] = false; }}
      onTouchStart={() => {
        refs.current.keys[keyCode] = true;
        if (isGreen && !refs.current.isDriving) {
          refs.current.isDriving = true;
          setIsDriving?.(true);
        }
      }}
      onTouchEnd={() => { refs.current.keys[keyCode] = false; }}
      style={{
        width: 62, height: 62, borderRadius: 16,
        border: isGreen ? '1.5px solid rgba(34, 197, 94, 0.5)' : '1.5px solid rgba(239, 68, 68, 0.5)',
        background: isGreen
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(21, 128, 61, 0.4))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(185, 28, 28, 0.4))',
        color: isGreen ? '#86efac' : '#fca5a5', fontSize: 12, fontWeight: '900',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', backdropFilter: 'blur(10px)', userSelect: 'none'
      }}
    >
      <span>{emoji}</span>
      <span style={{ fontSize: 9 }}>{label}</span>
    </button>
  );
}

const steerBtnStyle = {
  width: 54, height: 54, borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.2)',
  background: 'rgba(15, 23, 42, 0.85)', color: '#38bdf8', fontSize: 20, fontWeight: '900',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  backdropFilter: 'blur(10px)', userSelect: 'none'
};

export const ControlToolbar = ({
  cameraViewMode, toggleCameraView, showAdjuster, setShowAdjuster,
  headlights, toggleHeadlights, weatherMode, toggleWeather, hazard, toggleHazard,
  isAudioMuted, toggleAudio, blinkerLeft, blinkerRight, toggleBlinkerL, toggleBlinkerR,
  selectedMapId, scenarioIdx, onJumpToScenario, isDriving, setIsDriving, onStartAudio
}) => (
  <div style={{
    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 30,
    display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(9, 9, 11, 0.94)',
    padding: '8px 18px', borderRadius: 24, border: '1.5px solid rgba(56, 189, 248, 0.4)',
    backdropFilter: 'blur(16px)', boxShadow: '0 12px 35px rgba(0,0,0,0.8)'
  }}>
    <button onClick={toggleCameraView} style={toolbarBtn(cameraViewMode === 'chase', '#6366f1')}>
      <Camera size={14} /> {cameraViewMode === 'cockpit' ? 'Góc Nhìn Cabin' : '📷 Xem Xe Mercedes (3rd)'}
    </button>
    <button onClick={() => setShowAdjuster(prev => !prev)} style={toolbarBtn(showAdjuster, '#10b981')}>
      <Move size={14} /> {showAdjuster ? '📍 Đóng Bảng Ghế' : '📍 Chỉnh Vị Trí Ghế (Drag)'}
    </button>
    <button onClick={toggleHeadlights} style={toolbarBtn(headlights, '#f59e0b', headlights ? 'black' : 'white')}>
      <Lightbulb size={14} /> Đèn (L)
    </button>
    <button onClick={toggleWeather} style={toolbarBtn(weatherMode !== 'day', weatherMode === 'rain' ? '#0284c7' : '#312e81')}>
      {weatherMode === 'rain' ? <CloudRain size={14} /> : weatherMode === 'night' ? <Moon size={14} /> : <Sun size={14} />}
      {weatherMode === 'rain' ? 'Trời Mưa' : weatherMode === 'night' ? 'Ban Đêm' : 'Ban Ngày'}
    </button>
    <button onClick={toggleHazard} style={toolbarBtn(hazard, '#ef4444')}>
      <AlertTriangle size={14} /> Hazard (H)
    </button>
    <button onClick={toggleAudio} style={toolbarBtn(false)}>
      {isAudioMuted ? <VolumeX size={14} color="#ef4444" /> : <Volume2 size={14} color="#22c55e" />}
    </button>
    <button onClick={toggleBlinkerL} style={{ ...toolbarBtn(blinkerLeft, '#22c55e'), padding: '6px 9px' }}>⬅ Q</button>
    <button onClick={toggleBlinkerR} style={{ ...toolbarBtn(blinkerRight, '#22c55e'), padding: '6px 9px' }}>E ➡</button>
    <select
      value={scenarioIdx}
      onChange={(e) => onJumpToScenario(e.target.value)}
      style={{
        background: 'rgba(15,23,42,0.95)', color: '#38bdf8', border: '1.5px solid rgba(56,189,248,0.5)',
        padding: '7px 12px', borderRadius: 12, fontSize: 11, fontWeight: '800', cursor: 'pointer', outline: 'none'
      }}
    >
      {(MAP_SCENARIOS[selectedMapId] || SCENARIOS).map((sc, i) => (
        <option key={sc.id} value={i} style={{ background: '#0f172a', color: 'white' }}>
          🎯 Bài {i + 1}: {sc.type} {sc.limit ? `(${sc.limit}km/h)` : ''}
        </option>
      ))}
    </select>
    <button onClick={() => { onStartAudio?.(); setIsDriving(p => !p); }} style={{
      padding: '8px 16px', borderRadius: 14, border: 'none',
      background: isDriving ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white', fontWeight: '900', fontSize: 12, cursor: 'pointer'
    }}>
      {isDriving ? '🛑 DỪNG XE' : '🚀 KHỞI HÀNH BÀI THI'}
    </button>
  </div>
);

function toolbarBtn(active, accent = '#6366f1', textColor = 'white') {
  return {
    background: active ? `linear-gradient(135deg, ${accent}, ${accent})` : 'rgba(255,255,255,0.08)',
    color: textColor, border: '1px solid rgba(255,255,255,0.15)', padding: '7px 11px',
    borderRadius: 12, fontSize: 11, fontWeight: '800', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 5
  };
}

export const BackButton = ({ onBack }) => (
  <button onClick={onBack} style={{
    position: 'absolute', top: 16, left: 16, zIndex: 30,
    background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '50%', width: 40, height: 40, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)'
  }}>
    <ArrowLeft size={20} color="white" />
  </button>
);
