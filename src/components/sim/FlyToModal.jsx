// tách từ DrivingSimulation.jsx (refactor phase A3)


export const FlyToModal = ({ showFlyModal, flyX, flyZ, setFlyX, setFlyZ, setShowFlyModal, handleFlyToCoords }) => (
{showFlyModal && (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 3000,
    background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
  }}>
    <div style={{
      background: 'linear-gradient(180deg, #0f172a 0%, #030712 100%)',
      border: '2px solid #8b5cf6', borderRadius: 20, padding: 24,
      maxWidth: 380, width: '100%', color: '#f8fafc',
      boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(139, 92, 246, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>🚀</span>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: '800', color: '#c084fc' }}>Bay Đến Tọa Độ Bất Kỳ</h3>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Nhập tọa độ X, Z mong muốn để dịch chuyển xe tức thì</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: 4 }}>Tọa độ X (Trục ngang / Làn xe):</label>
          <input
            type="number"
            value={flyX}
            onChange={(e) => setFlyX(e.target.value)}
            placeholder="Ví dụ: 3.5 (Làn 1) hoặc 7.5 (Làn 2)"
            style={{
              width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #475569',
              borderRadius: 8, padding: '10px 12px', color: '#38bdf8', fontSize: 14, fontWeight: '700',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: 4 }}>Tọa độ Z (Khoảng cách mét dọc tuyến):</label>
          <input
            type="number"
            value={flyZ}
            onChange={(e) => setFlyZ(e.target.value)}
            placeholder="Ví dụ: 0, 300, 500, 1000..."
            style={{
              width: '100%', background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #475569',
              borderRadius: 8, padding: '10px 12px', color: '#38bdf8', fontSize: 14, fontWeight: '700',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => setShowFlyModal(false)}
          style={{
            flex: 1, padding: '12px', borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.06)', border: '1px solid #334155',
            color: '#cbd5e1', fontSize: 13, fontWeight: '700', cursor: 'pointer'
          }}
        >
          Hủy
        </button>

        <button
          onClick={() => {
            handleFlyToCoords(flyX, flyZ);
            setShowFlyModal(false);
          }}
          style={{
            flex: 1.5, padding: '12px', borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            border: 'none', color: '#ffffff', fontSize: 13, fontWeight: '800',
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.5)'
          }}
        >
          🚀 Dịch Chuyển Ngay
        </button>
      </div>
    </div>
  </div>
)}
);
