export const DEFAULT_SEAT_CONFIG = {
  seatOffsetX: -0.38, // Centered directly behind Toyota Corolla steering wheel
  seatOffsetY: 1.24,  // Eye height +8cm: nhìn xa hơn qua mui, dash chiếm ít màn hình hơn
  seatOffsetZ: -1.48, // Driver eye depth inside Toyota Corolla cabin seat cushion
  seatPitch: -2.0,    // Gaze angle nâng nhẹ — thấy xa hơn khi tiếp cận giao lộ
  wheelOffsetX: 0.0,
  wheelOffsetY: -0.24,
  wheelOffsetZ: -0.48,
  wheelScale: 1.2,
  chaseCamY: 1.65,
  chaseCamZ: 4.80,
  fov: 68,
  _configVer: 15,

  // GLB 3D Car Model Configuration
  glbRotY: 180.0,      // 180° = Correct orientation (Rear faces chase camera, front faces forward -Z)
  glbScale: 1.0,      // 1.0x normalized
  glbOffsetX: 0.0,
  glbOffsetY: 0.0,
  glbOffsetZ: 0.0,
  bodyColor: '#1e293b',
  showGlbInCockpit: true // Renders GLB model interior & dashboard in 1st-person cockpit view
};

const STORAGE_KEY = 'vietduc_seat_config';

export function loadSeatConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Math.abs(parsed.glbOffsetX || 0) > 1.2) parsed.glbOffsetX = 0.0;
      if (Math.abs(parsed.glbOffsetY || 0) > 0.8) parsed.glbOffsetY = 0.0;
      if (Math.abs(parsed.glbOffsetZ || 0) > 1.5) parsed.glbOffsetZ = 0.0;
      if (parsed.glbRotY === 0 && !parsed._userCustomRot) {
        parsed.glbRotY = 180.0;
      }
      if (!parsed._configVer || parsed._configVer < 15) {
        parsed.seatOffsetX = -0.38;
        parsed.seatOffsetY = 1.24;
        parsed.seatOffsetZ = -1.48;
        parsed.seatPitch = -2.0;
        parsed.wheelOffsetX = 0.0;
        parsed.wheelOffsetY = -0.24;
        parsed.wheelOffsetZ = -0.48;
        parsed.wheelScale = 1.2;
        parsed.chaseCamY = 1.65;
        parsed.chaseCamZ = 4.80;
        parsed._configVer = 15;
      }
      return { ...DEFAULT_SEAT_CONFIG, ...parsed };
    }
    return DEFAULT_SEAT_CONFIG;
  } catch {
    return DEFAULT_SEAT_CONFIG;
  }
}

export function saveSeatConfigToStorage(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearSeatConfigStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getSeatPreset(presetKey) {
  if (presetKey === 'sports_low') {
    return { ...DEFAULT_SEAT_CONFIG, seatOffsetY: 1.55, seatOffsetZ: -1.55, seatPitch: -2.0, fov: 70 };
  }
  if (presetKey === 'suv_high') {
    return { ...DEFAULT_SEAT_CONFIG, seatOffsetY: 1.76, seatOffsetZ: -1.42, seatPitch: -5.0, fov: 66 };
  }
  return { ...DEFAULT_SEAT_CONFIG };
}
