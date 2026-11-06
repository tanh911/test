import React from 'react';
import { Volume2, AlertTriangle, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import { speakExaminerDirective } from '../simulation/data/berlinDirectives.js';

/**
 * 👨‍✈️ FAHRPRÜFER HUD (Bảng Hiệu Lệnh Sát Hạch Thực Hành Chuẩn Đức)
 * - Tối giản, tập trung vào hiệu lệnh bằng lời nói / chữ của Giám khảo
 * - Không hiển thị cờ giải đáp gian lận trên minimap — người lái phải tự quan sát đường phố
 * - Đo đếm khoảng cách tới ngã tư theo thời gian thực (🎯 ... m)
 * - Cảnh báo lỗi StVO trực tiếp khi tài xế vi phạm (quên xi-nhan, quá tốc độ, thiếu Schulterblick)
 */
export const ExaminerDirectiveHUD = React.memo(({
  directive,
  score = 100,
  recentFeedback = null,
  blinkerLeft = false,
  blinkerRight = false,
  speed = 0,
  onRandomizeDirective = null
}) => {
  if (!directive) return null;

  const handleSpeak = () => {
    if (directive.commandDe) {
      speakExaminerDirective(directive.commandDe);
    }
  };

  const distM = directive.distanceToJunc !== undefined ? directive.distanceToJunc : 0;
  const isRightTurn = directive.maneuver === 'RIGHT';
  const isLeftTurn = directive.maneuver === 'LEFT';
  const hasCorrectBlinker = (isRightTurn && blinkerRight) || (isLeftTurn && blinkerLeft);

  return (
    <div className="sim-examiner-hud" style={{
      position: 'absolute',
      top: 56,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 80,
      width: '90%',
      maxWidth: 580,
      background: 'rgba(9, 14, 26, 0.94)',
      border: recentFeedback?.type === 'error' || recentFeedback?.type === 'critical'
        ? '2px solid #ef4444'
        : (recentFeedback?.type === 'success' ? '2px solid #22c55e' : '1.5px solid rgba(56, 189, 248, 0.45)'),
      borderRadius: 14,
      padding: '10px 18px',
      boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(16px)',
      color: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      userSelect: 'none',
      transition: 'all 0.25s ease'
    }}>
      {/* 1. Header: Giám khảo Fahrprüfer & Điểm số StVO */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>👨‍✈️</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            FAHRPRÜFER · STVO PRAXISPRÜFUNG
          </span>
          {directive.stageLabel && (
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              color: '#38bdf8',
              padding: '1px 6px',
              borderRadius: 4
            }}>
              {directive.stageLabel}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Điểm StVO */}
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 6,
            background: score >= 80 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: score >= 80 ? '#4ade80' : '#f87171',
            border: `1px solid ${score >= 80 ? '#22c55e' : '#ef4444'}`
          }}>
            Điểm: {score}/100
          </div>

          <button
            onClick={handleSpeak}
            title="Nghe lại hiệu lệnh của Giám khảo (Tiếng Đức)"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Volume2 size={12} />
            <span>Nghe Lại</span>
          </button>

          {onRandomizeDirective && (
            <button
              onClick={onRandomizeDirective}
              title="Đổi hiệu lệnh khác (Phím G)"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <RefreshCw size={11} />
              <span>Đổi Lệnh</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Hiệu lệnh chính thức từ Giám khảo */}
      <div style={{ margin: '4px 0 6px 0' }}>
        <div style={{
          fontSize: 14,
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.35,
          fontStyle: 'italic',
          letterSpacing: '-0.01em'
        }}>
          „{directive.commandDe}“
        </div>
        <div style={{
          fontSize: 11,
          color: '#38bdf8',
          fontWeight: 600,
          marginTop: 2,
          lineHeight: 1.3
        }}>
          ➔ {directive.commandVi}
        </div>
      </div>

      {/* 3. Footer: Khoảng cách tới ngã tư + Trạng thái Xi-nhan & Luật StVO */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        paddingTop: 6,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Khoảng cách */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(2, 132, 199, 0.25)',
            border: '1px solid #0284c7',
            padding: '2px 8px',
            borderRadius: 6,
            fontWeight: 800,
            color: '#38bdf8',
            fontFamily: 'monospace'
          }}>
            <span>🎯 {distM} m</span>
          </div>

          {/* Trạng thái xi-nhan */}
          {(isRightTurn || isLeftTurn) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              borderRadius: 4,
              background: hasCorrectBlinker ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: hasCorrectBlinker ? '#4ade80' : '#fbbf24',
              fontWeight: 700
            }}>
              <span>Xi-nhan:</span>
              <span>{hasCorrectBlinker ? '✓ ĐÃ BẬT' : '⚠️ CHƯA BẬT'}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
          <Shield size={11} color="#fbbf24" />
          <span>{directive.lawBadge || 'StVO § 9'}</span>
        </div>
      </div>

      {/* 4. Banner phản hồi StVO trực tiếp khi có lỗi hoặc khi rẽ đúng */}
      {recentFeedback && (
        <div style={{
          marginTop: 6,
          padding: '6px 10px',
          borderRadius: 6,
          background: recentFeedback.type === 'success'
            ? 'rgba(34, 197, 94, 0.25)'
            : (recentFeedback.type === 'critical' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.22)'),
          border: `1.5px solid ${recentFeedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
          display: 'flex',
          flexDirection: recentFeedback.type === 'critical' ? 'column' : 'row',
          alignItems: recentFeedback.type === 'critical' ? 'flex-start' : 'center',
          gap: 4,
          fontSize: 11,
          fontWeight: 700,
          color: recentFeedback.type === 'success' ? '#4ade80' : '#f87171',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {recentFeedback.type === 'success' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            <span>
              {recentFeedback.type === 'critical' && (
                <strong style={{ color: '#fca5a5', textTransform: 'uppercase', marginRight: 4 }}>
                  [SCHWERER FEHLER · TRƯỢT TRỰC TIẾP]
                </strong>
              )}
              {recentFeedback.text}
            </span>
          </div>
          {recentFeedback.paragraph && (
            <div style={{ fontSize: 9.5, color: '#fca5a5', opacity: 0.9, marginLeft: 19 }}>
              Căn cứ pháp lý: {recentFeedback.paragraph}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
