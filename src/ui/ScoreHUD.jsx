import React from 'react';

export const ScoreHUD = ({ score, events, scenarioIdx, totalScenarios }) => (
  <div style={{ position: 'absolute', top: 16, right: '3%', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, pointerEvents: 'none' }}>
    <div style={{ background: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: '8px 16px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div>
        <div style={{ color: '#94a3b8', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRAKTISCHE PRÜFUNG</div>
        <div style={{ color: '#38bdf8', fontSize: 12, fontWeight: '900' }}>Tình huống {Math.min(scenarioIdx + 1, totalScenarios)}/{totalScenarios}</div>
      </div>
      <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.15)' }} />
      <div>
        <div style={{ color: '#94a3b8', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ĐIỂM THI THỰC HÀNH</div>
        <div style={{ color: score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444', fontSize: 24, fontWeight: '900', fontFamily: 'monospace', lineHeight: 1 }}>
          {score}<span style={{ fontSize: 11, color: '#64748b' }}>/100</span>
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 110, overflow: 'hidden' }}>
      {events.slice(-3).map((ev, i) => (
        <div key={i} style={{ background: ev.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.25)', border: `1px solid ${ev.passed ? '#22c55e66' : '#ef444466'}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, color: ev.passed ? '#86efac' : '#fca5a5', backdropFilter: 'blur(8px)', maxWidth: 260 }}>
          {ev.msg}
        </div>
      ))}
    </div>
  </div>
);
