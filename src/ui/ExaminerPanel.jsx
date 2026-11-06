import React from 'react';

export const ExaminerPanel = ({ scenario }) => {
  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
      background: 'rgba(9, 9, 11, 0.94)', border: `2px solid ${scenario ? '#f59e0b' : '#38bdf8'}`,
      borderRadius: 16, padding: '10px 18px', backdropFilter: 'blur(14px)',
      boxShadow: '0 12px 35px rgba(0,0,0,0.7)', maxWidth: 460, width: '88%', pointerEvents: 'all'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
          border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
        }}>
          👨‍✈️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#93c5fd', fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Giám khảo Fahrprüfer · Herr Schmidt
            </span>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: 'rgba(56,189,248,0.2)', color: '#38bdf8', fontWeight: '800', border: '1px solid #38bdf8' }}>
              🚘 Mercedes-Benz GLS 580 3D
            </span>
          </div>
          <div style={{ color: 'white', fontWeight: '800', fontSize: 13, marginTop: 2 }}>
            {scenario ? scenario.warn : ' "Lái xe trong thành phố: Quan sát các giao lộ ngã tư, biển báo tốc độ và vạch đi bộ."'}
          </div>
        </div>
      </div>

      {scenario && scenario.theoryRule && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 6, marginTop: 6,
          fontSize: 11, color: '#cbd5e1', lineHeight: '1.45'
        }}>
          <span style={{ color: '#38bdf8', fontWeight: '700' }}>💡 Luật StVO ({scenario.theoryRule.title}): </span>
          {scenario.theoryRule.rule}
        </div>
      )}
    </div>
  );
};
