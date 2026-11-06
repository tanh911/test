// 🏁 Card kết quả bài thi (BESTANDEN / NICHT BESTANDEN) — tách từ DrivingSimulation.jsx (phase A3)
import { CheckCircle2, AlertOctagon, RotateCcw, Home } from 'lucide-react';

export const FinishCard = ({ finished, score, events, handleRestartExam, navigate }) => (
  finished && (
finished && (
<div className="sim-finish-backdrop" style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
  <div className="sim-finish-card" style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', border: `2px solid ${score >= 70 ? '#10b981' : '#ef4444'}`, borderRadius: 24, padding: 36, maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.7)', overflowY: 'auto', maxHeight: '90vh' }}>
    <div style={{ width: 64, height: 64, borderRadius: '50%', background: score >= 70 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      {score >= 70 ? <CheckCircle2 size={36} color="#10b981" /> : <AlertOctagon size={36} color="#ef4444" />}
    </div>

    <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      KẾT QUẢ BÀI THI THỰC HÀNH THÀNH PHỐ (PRAKTISCHE PRÜFUNG)
    </div>

    <h2 style={{ fontSize: 26, fontWeight: '900', color: score >= 70 ? '#34d399' : '#f87171', margin: '8px 0 16px 0' }}>
      {score >= 70 ? '🎉 BESTANDEN - ĐÃ ĐỖ THI THỰC HÀNH!' : '⚠️ NICHT BESTANDEN - TRƯỢT THI THỰC HÀNH'}
    </h2>

    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
      <div>
        <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>TỔNG ĐIỂM</div>
        <div style={{ fontSize: 36, fontWeight: '900', color: score >= 70 ? '#10b981' : '#ef4444' }}>{score}<span style={{ fontSize: 16, color: '#64748b' }}>/100</span></div>
      </div>
      <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
      <div>
        <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>KẾT QUẢ</div>
        <div style={{ fontSize: 16, fontWeight: '800', color: 'white', marginTop: 4 }}>
          {score >= 70 ? 'ĐẠT ĐIỀU KIỆN 📜' : 'CẦN ÔN LẠI ⚠️'}
        </div>
      </div>
    </div>

    {events.filter(e => !e.passed).length > 0 && (
      <div style={{ textAlign: 'left', marginBottom: 24, background: 'rgba(239,68,68,0.1)', padding: 14, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)' }}>
        <div style={{ color: '#f87171', fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' }}>
          Danh sách lỗi vi phạm (Fehlerpunkte):
        </div>
        {events.filter(e => !e.passed).map((e, i) => (
          <div key={i} style={{ color: '#fca5a5', fontSize: 12, marginBottom: 4 }}>
            • {e.msg}
          </div>
        ))}
      </div>
    )}

    <div style={{ display: 'flex', gap: 12 }}>
      <button
        onClick={handleRestartExam}
        style={{ flex: 1, padding: 14, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: '800', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <RotateCcw size={16} /> Thi lại ngay
      </button>
      <button
        onClick={() => navigate('/')}
        style={{ flex: 1, padding: 14, background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, cursor: 'pointer', fontWeight: '800', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <Home size={16} /> Trang chủ
      </button>
    </div>
  </div>
</div>
      
  )
);
