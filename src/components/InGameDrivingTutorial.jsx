import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, ChevronRight, X, Sparkles, Volume2, ArrowRight,
  Eye, ShieldCheck, Play, RotateCcw, HelpCircle, Minimize2, Maximize2,
  Gauge, Zap, Navigation, Compass, Car
} from 'lucide-react';
import audioEngine from './soundEngine.js';

export const InGameDrivingTutorial = ({
  isDriving,
  isEngineRunning = false,
  onToggleEngine,
  seatBelt,
  gear,
  speed,
  steer = 0,
  onToggleSeatBelt,
  onSelectGear,
  onClose,
  onStepChange,
  isMobile = false
}) => {
  // Step definitions:
  // 1: Thắt dây an toàn [B]
  // 2: Vào số Tiến [D]
  // 3: Đạp ga [W]
  // 4: Đánh lái [A]/[D] & Phanh [S]
  // 5: Hoàn thành!
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  const [stepNotice, setStepNotice] = useState(null);
  const completedAnimRef = useRef(null);

  useEffect(() => {
    if (onStepChange) onStepChange(currentStep);
  }, [currentStep, onStepChange]);

  // Load completed status from storage if previously finished
  useEffect(() => {
    const isDone = localStorage.getItem('driving_tutorial_completed') === 'true';
    if (isDone) {
      // If already completed previously, keep it minimized by default
      setIsMinimized(true);
    }
  }, []);

  // Step 1 Detection: Seatbelt fastened
  useEffect(() => {
    if (currentStep === 1 && seatBelt) {
      setCompletedSteps(prev => ({ ...prev, 1: true }));
      setStepNotice('Đã thắt dây an toàn!');
      audioEngine.playSuccess?.();
      
      clearTimeout(completedAnimRef.current);
      completedAnimRef.current = setTimeout(() => {
        setStepNotice(null);
        setCurrentStep(2);
      }, 1000);
    }
  }, [seatBelt, currentStep]);

  // Step 2 Detection: Shifted into Gear 'D' (D1)
  useEffect(() => {
    const isDriveGear = gear === 'D' || (typeof gear === 'string' && gear.startsWith('D'));
    if (currentStep === 2 && isDriveGear) {
      setCompletedSteps(prev => ({ ...prev, 2: true }));
      setStepNotice('Đã vào số D (Tiến)!');
      audioEngine.playSuccess?.();

      clearTimeout(completedAnimRef.current);
      completedAnimRef.current = setTimeout(() => {
        setStepNotice(null);
        setCurrentStep(3);
      }, 1000);
    }
  }, [gear, currentStep]);

  // Step 3 Detection: Speed > 3 km/h (Car is moving)
  useEffect(() => {
    if (currentStep === 3 && speed > 3) {
      setCompletedSteps(prev => ({ ...prev, 3: true }));
      setStepNotice('Xe đang lăn bánh! Rất tốt!');
      audioEngine.playSuccess?.();

      clearTimeout(completedAnimRef.current);
      completedAnimRef.current = setTimeout(() => {
        setStepNotice(null);
        setCurrentStep(4);
      }, 1200);
    }
  }, [speed, currentStep]);

  // Step 4 Detection: Steered or Tapped Brake
  useEffect(() => {
    if (currentStep === 4 && (Math.abs(steer) > 0.1 || (speed > 5 && speed < 4))) {
      setCompletedSteps(prev => ({ ...prev, 4: true }));
      setStepNotice('Đã làm quen đánh lái & phanh!');
      audioEngine.playSuccess?.();

      clearTimeout(completedAnimRef.current);
      completedAnimRef.current = setTimeout(() => {
        setStepNotice(null);
        setCurrentStep(5);
        localStorage.setItem('driving_tutorial_completed', 'true');
      }, 1200);
    }
  }, [steer, speed, currentStep]);

  // Auto-collapse when car starts rolling (speed > 2 km/h) or engine starts moving to keep windshield clear
  useEffect(() => {
    if (speed > 2 && !isMinimized) {
      setIsMinimized(true);
    }
  }, [speed, isMinimized]);

  useEffect(() => {
    if (currentStep >= 3 && isEngineRunning && !isMinimized) {
      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isEngineRunning, isMinimized]);

  // Cleanup timers
  useEffect(() => {
    return () => clearTimeout(completedAnimRef.current);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('driving_tutorial_completed', 'true');
    if (onClose) onClose();
  };

  const stepsData = [
    {
      id: 1,
      badge: 'Bước 1 / 4',
      title: 'Thắt dây an toàn',
      icon: ShieldCheck,
      color: '#10b981',
      keyPrompt: isMobile ? 'Chạm nút Dây an toàn trên mặt táp-lô' : 'Bấm phím [ B ] trên bàn phím',
      desc: 'Quy tắc StVO Đức bắt buộc thắt dây an toàn trước khi nổ máy và lăn bánh để tránh bị trừ điểm trượt.',
      actionBtn: !isEngineRunning && onToggleEngine ? {
        label: '⚡ NỔ MÁY Ở SỐ P (PHÍM I)',
        onClick: () => {
          if (onToggleEngine) onToggleEngine();
        }
      } : (!seatBelt ? {
        label: 'Thắt dây an toàn ngay [B]',
        onClick: () => {
          if (onToggleSeatBelt) onToggleSeatBelt();
        }
      } : null),
      isDone: !!completedSteps[1] || seatBelt
    },
    {
      id: 2,
      badge: 'Bước 2 / 4',
      title: 'Chuyển cần số sang [ D ]',
      icon: Gauge,
      color: '#38bdf8',
      keyPrompt: isMobile ? 'Chạm nút [ D (Tiến) ]' : 'Bấm phím [ D ] (hoặc chạm D trên táp-lô)',
      desc: 'Xe đang đỗ ở số P. Cần chuyển về số D để tiến lên phía trước hoặc R nếu muốn lùi.',
      actionBtn: !(typeof gear === 'string' && gear.startsWith('D')) ? {
        label: 'Vào số Tiến [D]',
        onClick: () => {
          if (onSelectGear) onSelectGear('D');
        }
      } : null,
      isDone: !!completedSteps[2] || (typeof gear === 'string' && gear.startsWith('D'))
    },
    {
      id: 3,
      badge: 'Bước 3 / 4',
      title: 'Nhấn ga để xe lăn bánh',
      icon: Zap,
      color: '#22c55e',
      keyPrompt: isMobile ? 'Chạm giữ bàn đạp [ GA ]' : 'Nhấn giữ phím [ W ] hoặc [ ↑ ]',
      desc: 'Đạp ga nhẹ nhàng để xe tăng tốc từ từ. Tốc độ khuyến nghị trong sân sa hình là dưới 30 km/h.',
      actionBtn: null,
      isDone: !!completedSteps[3] || speed > 3
    },
    {
      id: 4,
      badge: 'Bước 4 / 4',
      title: 'Đánh lái & Rà phanh',
      icon: Navigation,
      color: '#f59e0b',
      keyPrompt: isMobile ? 'Nút [ ◄ / ► ] bẻ lái · [ PHANH ] dừng' : 'Phím [ A ] / [ D ] bẻ lái · [ S ] phanh',
      desc: 'Bẻ lái để đưa xe vào đúng tâm làn đường. Khi cần dừng, nhấn phanh dứt khoát.',
      actionBtn: null,
      isDone: !!completedSteps[4]
    }
  ];

  const currentStepData = stepsData.find(s => s.id === currentStep) || stepsData[0];

  // If minimized, display an ultra-compact, non-intrusive floating HUD chip
  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="sim-tutorial-minimized"
        style={{
          position: 'absolute',
          top: 60,
          left: 16,
          zIndex: 80,
          background: 'rgba(15, 23, 42, 0.90)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: 10,
          padding: '7px 11px',
          color: '#f8fafc',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(10px)',
          fontSize: 12,
          transition: 'all 0.2s ease',
          userSelect: 'none',
          maxWidth: 210
        }}
        title="Bấm để mở rộng chi tiết hướng dẫn lái"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: currentStep <= 4 ? '#22c55e' : '#38bdf8',
              boxShadow: currentStep <= 4 ? '0 0 6px #22c55e' : 'none'
            }} />
            <span style={{ fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: '0.04em' }}>
              {currentStep <= 4 ? `BƯỚC ${currentStep} / 4` : 'HOÀN THÀNH'}
            </span>
          </div>
          <Maximize2 size={11} color="#94a3b8" />
        </div>
        <div style={{
          fontSize: 12, fontWeight: '800', color: '#f1f5f9',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {currentStep <= 4 ? currentStepData.title : 'Sẵn sàng thi lái StVO!'}
        </div>
        {currentStep <= 4 && (
          <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentStepData.keyPrompt}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="sim-interactive-tutorial-card"
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        zIndex: 85,
        width: 'min(310px, calc(100vw - 32px))',
        background: 'linear-gradient(160deg, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 0.94) 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.35)',
        borderRadius: 14,
        padding: '11px 14px',
        boxShadow: '0 16px 36px rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes tutorialGlowPulse {
          0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
          100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
        .sim-tut-action-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Compass size={16} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: '800', color: '#38bdf8', letterSpacing: '-0.01em' }}>
              HƯỚNG DẪN LÁI TRỰC TIẾP
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>
              Thao tác thực tế trong buồng lái
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setIsMinimized(true)}
            title="Thu nhỏ thanh hướng dẫn"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 6,
              color: '#94a3b8',
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Minimize2 size={13} />
          </button>
          <button
            onClick={handleDismiss}
            title="Đóng hướng dẫn (Đã biết lái)"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 6,
              color: '#94a3b8',
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress Dots / Steps */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {stepsData.map(s => {
          const isActive = s.id === currentStep;
          const isDone = s.isDone;
          return (
            <div
              key={s.id}
              onClick={() => setCurrentStep(s.id)}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 4,
                background: isDone
                  ? '#10b981'
                  : isActive
                  ? '#38bdf8'
                  : 'rgba(255, 255, 255, 0.15)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              title={`Bước ${s.id}: ${s.title}`}
            />
          );
        })}
      </div>

      {/* Step Notice Banner (if any) */}
      {stepNotice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.18)',
          border: '1px solid rgba(16, 185, 129, 0.45)',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 10,
          color: '#6ee7b7',
          fontSize: 12,
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <CheckCircle2 size={15} />
          <span>{stepNotice}</span>
        </div>
      )}

      {/* Main Content Body: Step 1 to 4 */}
      {currentStep <= 4 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              {React.createElement(currentStepData.icon, { size: 18, color: currentStepData.color || '#38bdf8' })}
            </div>
            <div>
              <span style={{
                fontSize: 10,
                fontWeight: '800',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '2px 6px',
                borderRadius: 4,
                textTransform: 'uppercase'
              }}>
                {currentStepData.badge}
              </span>
              <div style={{ fontSize: 13.5, fontWeight: '800', color: '#ffffff', marginTop: 2 }}>
                {currentStepData.title}
              </div>
            </div>
          </div>

          {/* Key Instruction Banner */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1.5px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 10,
            padding: '9px 12px',
            margin: '8px 0',
            color: '#e0f2fe',
            fontSize: 12,
            fontWeight: '700',
            lineHeight: 1.45,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
          }}>
            <ArrowRight size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span>{currentStepData.keyPrompt}</span>
          </div>

          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginBottom: 10 }}>
            {currentStepData.desc}
          </div>

          {/* Direct Interactive Click Button (For step 1 and step 2) */}
          {currentStepData.actionBtn && (
            <button
              onClick={currentStepData.actionBtn.onClick}
              className="sim-tut-action-btn"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                borderRadius: 10,
                padding: '9px 14px',
                fontSize: 12,
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginBottom: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <span>{currentStepData.actionBtn.label}</span>
            </button>
          )}

          {/* Footer Controls: Navigation & Skip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 8,
            marginTop: 4
          }}>
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              style={{
                background: 'transparent',
                border: 'none',
                color: currentStep === 1 ? '#475569' : '#94a3b8',
                fontSize: 11,
                cursor: currentStep === 1 ? 'default' : 'pointer',
                padding: '4px 6px'
              }}
            >
              ← Trước
            </button>

            <span style={{ fontSize: 11, color: '#64748b' }}>
              {currentStep} / 4
            </span>

            <button
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: 11,
                fontWeight: '700',
                cursor: 'pointer',
                padding: '4px 6px'
              }}
            >
              Tiếp theo →
            </button>
          </div>
        </div>
      ) : (
        /* Step 5: Hoàn tất & Mẹo nâng cao */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={20} color="#4ade80" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: '800', color: '#4ade80' }}>
                Khởi Hành Thành Công!
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Bạn đã nắm vững các thao tác điều khiển buồng lái
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '9px 12px',
            marginBottom: 10,
            fontSize: 11
          }}>
            <div style={{ fontWeight: '800', color: '#f8fafc', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={13} color="#f59e0b" />
              <span>Phím tắt tiện ích khi lái xe:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, color: '#cbd5e1' }}>
              <div>• <b style={{ color: '#38bdf8' }}>[ V ]</b> Đổi góc nhìn</div>
              <div>• <b style={{ color: '#38bdf8' }}>[ Q / E ]</b> Xi-nhan</div>
              <div>• <b style={{ color: '#38bdf8' }}>[ M ]</b> Gương hậu</div>
              <div>• <b style={{ color: '#38bdf8' }}>[ Space ]</b> Phanh tay</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 12,
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Car size={15} />
              <span>Bắt Đầu Lái Xe</span>
            </button>
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: 'none',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 11,
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
