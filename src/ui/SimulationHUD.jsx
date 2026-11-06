import React, { useState } from 'react';
import {
  Camera, Move, Lightbulb, Sun, Moon, CloudRain, AlertTriangle, Volume2, VolumeX,
  ArrowLeft, CheckCircle2, AlertOctagon, RotateCcw, Home, Sliders, ShieldCheck, GraduationCap
} from 'lucide-react';

export const SimulationHUD = ({
  speed,
  gear,
  rpm,
  isDriving,
  setIsDriving,
  cameraViewMode,
  toggleCameraView,
  showAdjuster,
  setShowAdjuster,
  headlights,
  toggleHeadlights,
  weatherMode,
  toggleWeather,
  hazard,
  toggleHazard,
  isAudioMuted,
  setIsAudioMuted,
  blinkerLeft,
  toggleBlinkerL,
  blinkerRight,
  toggleBlinkerR,
  setSchulterblick,
  currentScenario,
  score,
  events,
  navigate
}) => {
  const [hudMode, setHudMode] = useState('training'); // 'training' | 'pruefung'

  const isPruefung = hudMode === 'pruefung';

  return (
    <>
      {/* ── Mode Switcher Badge (Top Right) ── */}
      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 35,
        display: 'flex', gap: 6, background: 'rgba(15, 23, 42, 0.92)',
        padding: 4, borderRadius: 16, border: '1px solid rgba(56, 189, 248, 0.4)',
        backdropFilter: 'blur(12px)'
      }}>
        <button
          onClick={() => setHudMode('training')}
          style={{
            background: hudMode === 'training' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
            color: 'white', border: 'none', padding: '6px 12px', borderRadius: 12,
            fontSize: 11, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <GraduationCap size={14} /> Training Mode
        </button>
        <button
          onClick={() => setHudMode('pruefung')}
          style={{
            background: hudMode === 'pruefung' ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'transparent',
            color: 'white', border: 'none', padding: '6px 12px', borderRadius: 12,
            fontSize: 11, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          <ShieldCheck size={14} /> Prüfung Mode (Thi Thật)
        </button>
      </div>

      {/* ── Top Left Navigation & Schulterblick Buttons ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 35,
          background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%', width: 40, height: 40, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)'
        }}
      >
        <ArrowLeft size={20} color="white" />
      </button>

      {/* Schulterblick (Shoulder Check) Controls */}
      <div style={{ position: 'absolute', top: 68, left: 16, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onMouseDown={() => setSchulterblick(-1.2)}
            onMouseUp={() => setSchulterblick(0)}
            onTouchStart={() => setSchulterblick(-1.2)}
            onTouchEnd={() => setSchulterblick(0)}
            style={{
              background: 'rgba(15, 23, 42, 0.88)', color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)', padding: '7px 12px',
              borderRadius: 12, fontSize: 11, fontWeight: '800', cursor: 'pointer',
              backdropFilter: 'blur(10px)', userSelect: 'none'
            }}
          >
            👁️ Schulterblick Trái (Z)
          </button>
          <button
            onMouseDown={() => setSchulterblick(1.2)}
            onMouseUp={() => setSchulterblick(0)}
            onTouchStart={() => setSchulterblick(1.2)}
            onTouchEnd={() => setSchulterblick(0)}
            style={{
              background: 'rgba(15, 23, 42, 0.88)', color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)', padding: '7px 12px',
              borderRadius: 12, fontSize: 11, fontWeight: '800', cursor: 'pointer',
              backdropFilter: 'blur(10px)', userSelect: 'none'
            }}
          >
            👁️ Schulterblick Phải (X)
          </button>
        </div>
      </div>

      {/* ── Mode Specific Cards ── */}
      {!isPruefung ? (
        /* Training Mode: GPS Navigation & Scenario Rule Banner */
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 30,
          background: 'rgba(15, 23, 42, 0.92)', color: 'white', padding: '10px 20px', borderRadius: 18,
          border: '1px solid rgba(56, 189, 248, 0.4)', backdropFilter: 'blur(12px)',
          textAlign: 'center', maxWidth: 480, width: '90%'
        }}>
          <div style={{ fontSize: 11, fontWeight: '800', color: '#38bdf8', letterSpacing: '0.5px' }}>
            🧭 GPS MERCEDES-BENZ • {currentScenario?.titleVi || 'Stadtfahrt Stadt'}
          </div>
          <div style={{ fontSize: 12, color: '#f8fafc', fontWeight: '700', marginTop: 2 }}>
            {currentScenario?.instructionVi || 'Giữ đúng làn đường, bật xi-nhan và quan sát Schulterblick trước khi rẽ!'}
          </div>
        </div>
      ) : (
        /* Prüfung Mode: Minimalist Examiner Card */
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 30,
          background: 'rgba(9, 9, 11, 0.95)', color: 'white', padding: '8px 20px', borderRadius: 16,
          border: '1.5px solid rgba(220, 38, 38, 0.6)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.8)'
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} className="animate-pulse" />
          <div>
            <div style={{ fontSize: 11, fontWeight: '900', color: '#fca5a5', textTransform: 'uppercase' }}>
              📋 FAHRPRÜFUNG KLASSE B • HERMAN SCHMIDT (Giám Khảo Thi Thật)
            </div>
            <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: '600' }}>
              Điểm thi: <span style={{ color: score > 70 ? '#22c55e' : '#ef4444', fontWeight: '900' }}>{score}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* Discreet Live StVO Violation Feed (Prüfung & Training) */}
      <div style={{
        position: 'absolute', top: 120, right: 16, zIndex: 30,
        display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 300
      }}>
        {events.slice(-3).map((ev, i) => (
          <div
            key={i}
            style={{
              background: ev.passed ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
              color: 'white', padding: '6px 12px', borderRadius: 12, fontSize: 11,
              fontWeight: '800', backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}
          >
            {ev.msg}
          </div>
        ))}
      </div>

      {/* ── Bottom Right Speedometer & Gear HUD ── */}
      <div style={{
        position: 'absolute', bottom: 85, right: 24, zIndex: 30,
        display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(9, 9, 11, 0.92)',
        padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(56, 189, 248, 0.3)',
        backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,0.7)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: '900', color: speed > 50 ? '#ef4444' : '#38bdf8', lineHeight: 1 }}>
            {Math.round(speed)} <span style={{ fontSize: 11, color: '#94a3b8' }}>km/h</span>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: '800', marginTop: 4 }}>
            SỐ: <span style={{ color: '#22c55e', fontWeight: '900' }}>{gear}</span> | {rpm} RPM
          </div>
        </div>
      </div>

      {/* ── Digital Cockpit Controls Toolbar (Bottom Center) ── */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 30,
        display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(9, 9, 11, 0.94)',
        padding: '8px 16px', borderRadius: 24, border: '1.5px solid rgba(56, 189, 248, 0.4)',
        backdropFilter: 'blur(16px)', boxShadow: '0 12px 35px rgba(0,0,0,0.8)'
      }}>
        <button onClick={toggleCameraView} style={{ background: cameraViewMode === 'chase' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '7px 11px', borderRadius: 12, fontSize: 11, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Camera size={14} /> {cameraViewMode === 'cockpit' ? 'Cabin' : '📷 3rd'}
        </button>

        <button onClick={() => setShowAdjuster(prev => !prev)} style={{ background: showAdjuster ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '7px 11px', borderRadius: 12, fontSize: 11, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Move size={14} color={showAdjuster ? '#fff' : '#38bdf8'} /> {showAdjuster ? '📍 Ghế' : '📍 Ghế (Drag)'}
        </button>

        <button onClick={toggleHeadlights} style={{ background: headlights ? '#f59e0b' : 'rgba(255,255,255,0.08)', color: headlights ? 'black' : 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '7px 10px', borderRadius: 12, fontSize: 11, fontWeight: '800', cursor: 'pointer' }}>
          Đèn (L)
        </button>

        <button onClick={toggleWeather} style={{ background: weatherMode === 'rain' ? '#0284c7' : weatherMode === 'night' ? '#312e81' : 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '7px 10px', borderRadius: 12, fontSize: 11, fontWeight: '800', cursor: 'pointer' }}>
          {weatherMode === 'rain' ? <CloudRain size={14} /> : weatherMode === 'night' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        <button onClick={toggleHazard} style={{ background: hazard ? '#ef4444' : 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '7px 10px', borderRadius: 12, fontSize: 11, fontWeight: '800', cursor: 'pointer' }}>
          <AlertTriangle size={14} color={hazard ? '#fff' : '#ef4444'} />
        </button>

        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={toggleBlinkerL} style={{ background: blinkerLeft ? '#22c55e' : 'rgba(255,255,255,0.08)', color: blinkerLeft ? 'black' : 'white', border: 'none', padding: '6px 8px', borderRadius: 8, fontSize: 11, fontWeight: '800', cursor: 'pointer' }}>
            ⬅ Q
          </button>
          <button onClick={toggleBlinkerR} style={{ background: blinkerRight ? '#22c55e' : 'rgba(255,255,255,0.08)', color: blinkerRight ? 'black' : 'white', border: 'none', padding: '6px 8px', borderRadius: 8, fontSize: 11, fontWeight: '800', cursor: 'pointer' }}>
            E ➡
          </button>
        </div>

        <button
          onClick={() => setIsDriving(p => !p)}
          style={{
            padding: '8px 16px', borderRadius: 14, border: 'none',
            background: isDriving ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', fontWeight: '900', fontSize: 12, cursor: 'pointer'
          }}
        >
          {isDriving ? '🛑 DỪNG' : '🚀 BẮT ĐẦU'}
        </button>
      </div>
    </>
  );
};
