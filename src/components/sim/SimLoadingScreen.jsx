// tách từ DrivingSimulation.jsx (refactor phase A3)


export const SimLoadingScreen = ({ DRIVING_TIPS, loadingState }) => (
loadingState.isLoading && (
  <div style={{
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at center, #0F172A 0%, #030712 100%)',
    zIndex: 3000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    fontFamily: "'Inter', sans-serif",
    color: '#F8FAFC',
    userSelect: 'none'
  }}>
    {/* Animated Spinner & Icon */}
    <div style={{ position: 'relative', width: 88, height: 88, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '3px solid transparent',
        borderTopColor: '#38BDF8',
        borderRightColor: '#0284C7',
        animation: 'spinRing 1.1s linear infinite'
      }} />
      <div style={{
        position: 'absolute', inset: 6, borderRadius: '50%',
        border: '2px dashed rgba(56, 189, 248, 0.3)',
        animation: 'spinRingReverse 4s linear infinite'
      }} />
      <div style={{
        position: 'absolute', inset: 12, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)',
        boxShadow: '0 0 24px rgba(56,189,248,0.3)',
        animation: 'pulseGlow 1.8s ease-in-out infinite alternate'
      }} />
      <div style={{ position: 'relative', zIndex: 2, fontSize: 32 }}>
        🏎️
      </div>
    </div>

    {/* Subtitle & Title */}
    <div style={{
      fontSize: 11, fontWeight: '700', color: '#38BDF8',
      letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6
    }}>
      Fahrschule Simulator · StVO Deutschland
    </div>
    <h2 style={{
      fontSize: 20, fontWeight: '700', color: '#F8FAFC',
      margin: '0 0 16px 0', letterSpacing: '-0.01em'
    }}>
      Khởi tạo buồng lái & Bản đồ nước Đức 3D
    </h2>

    {/* Progress Bar Container */}
    <div style={{ width: 340, maxWidth: '90vw', marginBottom: 12 }}>
      <div style={{
        height: 7, width: '100%', background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, Math.max(8, loadingState.progress))}%`,
          background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 55%, #10b981 100%)',
          borderRadius: 8,
          transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 14px rgba(56, 189, 248, 0.6)'
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 8, fontSize: 12
      }}>
        <span style={{ color: '#94A3B8', fontWeight: '500' }}>
          {loadingState.statusText}
        </span>
        <span style={{ color: '#38BDF8', fontWeight: '700', fontFamily: 'monospace' }}>
          {Math.round(loadingState.progress)}%
        </span>
      </div>
    </div>

    {/* Driving Tip Box */}
    <div style={{
      marginTop: 20, maxWidth: 460, width: '90vw',
      background: 'rgba(15, 23, 42, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 8, padding: '10px 16px',
      fontSize: 12, color: '#CBD5E1', lineHeight: '1.5',
      textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(8px)'
    }}>
      {DRIVING_TIPS[loadingState.tipIndex]}
    </div>

    <style>{`
      @keyframes spinRing {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes spinRingReverse {
        from { transform: rotate(360deg); }
        to { transform: rotate(0deg); }
      }
      @keyframes pulseGlow {
        0% { transform: scale(0.95); opacity: 0.7; }
        100% { transform: scale(1.05); opacity: 1; }
      }
    `}</style>
  </div>
)
);
