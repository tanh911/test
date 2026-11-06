import { useState, useRef } from 'react';

export const DEFAULT_SEAT_CONFIG = {
  seatOffsetX: -0.38, // Căn giữa vị trí ghế lái, ngay trước vô-lăng Toyota Corolla
  seatOffsetY: 1.16,  // Độ cao mắt người lái chuẩn vừa vặn, không bị tấm chắn nắng che và thấy rõ vô lăng
  seatOffsetZ: -1.48, // Vị trí khoang lái chuẩn ngay trước tựa đầu ghế lái
  seatPitch: -2.5,    // Góc nhìn tự nhiên hướng về mặt đường và bảng đồng hồ phía trước
  wheelOffsetX: 0.0,
  wheelOffsetY: -0.24,
  wheelOffsetZ: -0.48,
  wheelScale: 1.2,
  chaseCamY: 1.65,    // Độ cao camera 3rd Person
  chaseCamZ: 4.80,    // Khoảng cách lùi camera 3rd Person
  fov: 68,
  _configVer: 16,

  glbRotY: 180.0,
  glbScale: 1.0,
  glbOffsetX: 0.0,
  glbOffsetY: 0.0,
  glbOffsetZ: 0.0,
  bodyColor: '#1e293b',
  showGlbInCockpit: true
};

export const useSeatConfig = () => {
  const [seatConfig, setSeatConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('vietduc_seat_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Math.abs(parsed.glbOffsetX || 0) > 1.2) parsed.glbOffsetX = 0.0;
        if (Math.abs(parsed.glbOffsetY || 0) > 0.8) parsed.glbOffsetY = 0.0;
        if (Math.abs(parsed.glbOffsetZ || 0) > 1.5) parsed.glbOffsetZ = 0.0;
        if (parsed.glbRotY === 0 && !parsed._userCustomRot) {
          parsed.glbRotY = 180.0;
        }
        // Nâng cấp tự động sửa vị trí ghế nếu người dùng có bản lưu cũ
        if (!parsed._configVer || parsed._configVer < 16) {
          parsed.seatOffsetX = -0.38;
          parsed.seatOffsetY = 1.16;
          parsed.seatOffsetZ = -1.48;
          parsed.seatPitch = -2.5;
          parsed.chaseCamY = 1.65;
          parsed.chaseCamZ = 4.80;
          parsed._configVer = 16;
        }
        return { ...DEFAULT_SEAT_CONFIG, ...parsed };
      }
      return DEFAULT_SEAT_CONFIG;
    } catch (e) {
      return DEFAULT_SEAT_CONFIG;
    }
  });

  const [showAdjuster, setShowAdjuster] = useState(false);
  const [activeDragTarget, setActiveDragTarget] = useState(null);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const updateConfigField = (key, val) => {
    setSeatConfig(prev => ({ ...prev, [key]: Number(val) }));
  };

  const saveSeatConfig = () => {
    try {
      localStorage.setItem('vietduc_seat_config', JSON.stringify(seatConfig));
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const resetSeatConfig = () => {
    setSeatConfig(DEFAULT_SEAT_CONFIG);
    try {
      localStorage.removeItem('vietduc_seat_config');
    } catch (e) { }
  };

  const applyPreset = (presetKey) => {
    let preset = { ...DEFAULT_SEAT_CONFIG };
    if (presetKey === 'sports_low') {
      preset = { ...DEFAULT_SEAT_CONFIG, seatOffsetY: 1.10, seatOffsetZ: -1.55, seatPitch: -2.0, fov: 70 };
    } else if (presetKey === 'suv_high') {
      preset = { ...DEFAULT_SEAT_CONFIG, seatOffsetY: 1.25, seatOffsetZ: -1.42, seatPitch: -4.0, fov: 66 };
    }
    setSeatConfig(preset);
  };

  const handlePointerDownDrag = (targetType, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDragTarget(targetType);

    const startX = e.clientX;
    const startY = e.clientY;
    const initConfig = { ...seatConfig };

    const handlePointerMove = (moveEv) => {
      moveEv.preventDefault();
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;

      setSeatConfig(prev => {
        let next = { ...prev };
        if (targetType === 'reticleXY') {
          const sensX = 0.004;
          const sensY = 0.004;
          next.seatOffsetX = Math.max(-1.4, Math.min(1.4, Number((initConfig.seatOffsetX + dx * sensX).toFixed(2))));
          next.seatOffsetY = Math.max(0.7, Math.min(2.3, Number((initConfig.seatOffsetY - dy * sensY).toFixed(2))));
        } else if (targetType === 'reticleZ') {
          const sensZ = 0.006;
          next.seatOffsetZ = Math.max(-3.5, Math.min(0.2, Number((initConfig.seatOffsetZ - dy * sensZ).toFixed(2))));
        } else if (targetType === 'reticlePitch') {
          const sensP = 0.15;
          next.seatPitch = Math.max(-25, Math.min(25, Number((initConfig.seatPitch - dy * sensP).toFixed(1))));
        }
        return next;
      });
    };

    const handlePointerUp = () => {
      setActiveDragTarget(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
  };

  return {
    seatConfig,
    setSeatConfig,
    showAdjuster,
    setShowAdjuster,
    activeDragTarget,
    isSavedNotice,
    updateConfigField,
    saveSeatConfig,
    resetSeatConfig,
    applyPreset,
    handlePointerDownDrag
  };
};