// ── Web Audio API Realistic Procedural Automotive Sound Engine ────────────────
// Kiến trúc luồng âm thanh liên tục (Continuous Persistent Layers) + Cabin Mixer
// Không tạo mới oscillator/source mỗi frame - Điều biến liên tục theo RPM, Tải động cơ (Load), Vận tốc (Speed)
// 0 KB file ngoài, không tốn băng thông, 100% tự nhiên không có tiếng bíp/synth nhân tạo.

function createEngineCycleBuffer(ctx, baseRpm = 1200, duration = 2.0, isLoad = false) {
  const sampleRate = ctx.sampleRate || 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Ở 1200 RPM, động cơ 4 xi-lanh 4 kỳ nổ 40 lần/giây (T = 0.025s)
  const fireRate = (baseRpm / 60) * 2; // 40 Hz
  const periodSamples = sampleRate / fireRate;
  const totalCycles = Math.round(numSamples / periodSamples);
  const exactPeriod = numSamples / totalCycles; // Tuần hoàn chính xác 100%

  // Đặc tính âm học trầm ấm, nhịp pít-tông êm ái giữa 4 xi-lanh (Sedan Đức)
  const cylTuning = [
    { resFreq: 142, amp: 1.00, attack: 0.0035 },
    { resFreq: 148, amp: 0.94, attack: 0.0038 },
    { resFreq: 139, amp: 1.03, attack: 0.0034 },
    { resFreq: 145, amp: 0.97, attack: 0.0036 }
  ];

  for (let c = 0; c < totalCycles; c++) {
    const cyl = cylTuning[c % 4];
    const startSample = Math.floor(c * exactPeriod);
    const endSample = Math.min(numSamples, Math.floor((c + 1.0) * exactPeriod));
    const pulseLen = endSample - startSample;

    for (let i = 0; i < pulseLen; i++) {
      const idx = startSample + i;
      if (idx >= numSamples) break;
      const t = i / sampleRate;

      // 1. Xung nén nổ pít-tông mượt mà (Smooth asymmetric combustion pressure pulse)
      const tNorm = t / cyl.attack;
      const pressurePulse = tNorm * Math.exp(1 - tNorm);

      // 2. Dao động cộng hưởng khoang buồng đốt & cổ xả (Cylinder cavity resonance)
      const decay = Math.exp(-t * (isLoad ? 100 : 120));
      const resonance = Math.sin(2 * Math.PI * cyl.resFreq * t) * decay;

      // 3. Xung áp suất thấp thứ cấp của đường ống xả (Exhaust manifold pulse 42-65Hz)
      const exhaustRumble = Math.sin(2 * Math.PI * (cyl.resFreq * 0.45) * t) * Math.exp(-t * 55);

      let sampleVal = 0;
      if (isLoad) {
        // Chế độ chịu tải: Áp suất nén cực đại lớn, hài âm gầm gừ uy lực (Throaty roar)
        sampleVal = (pressurePulse * 0.48 + resonance * 0.36 + exhaustRumble * 0.42) * cyl.amp;
        sampleVal = Math.tanh(sampleVal * 1.3) * 0.65;
      } else {
        // Chế độ không tải (Garanti / Idle): Êm dịu, trầm ấm, cách âm tốt
        sampleVal = (pressurePulse * 0.36 + resonance * 0.28 + exhaustRumble * 0.45) * cyl.amp;
        sampleVal = Math.tanh(sampleVal * 1.0) * 0.50;
      }

      data[idx] += sampleVal;
    }
  }

  // Crossfade vi mô ở đầu và đuôi buffer (64 mẫu) để triệt tiêu hoàn toàn click khi lặp vô tận
  const fadeLen = 64;
  for (let i = 0; i < fadeLen; i++) {
    const fadeFactor = i / fadeLen;
    const startIdx = i;
    const endIdx = numSamples - fadeLen + i;
    const blended = data[startIdx] * fadeFactor + data[endIdx] * (1 - fadeFactor);
    data[startIdx] = blended;
    data[endIdx] = blended;
  }

  return buffer;
}

function createPinkNoiseBuffer(ctx, duration = 3) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function createWhiteNoiseBuffer(ctx, duration = 3) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createSkidNoiseBuffer(ctx, duration = 2.0) {
  const sampleRate = ctx.sampleRate || 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0;
  for (let i = 0; i < numSamples; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.88 * b0 + white * 0.12;
    b1 = 0.85 * b1 + b0 * 0.15;
    data[i] = b1 * 0.35;
  }

  const fadeLen = 64;
  for (let i = 0; i < fadeLen; i++) {
    const fadeFactor = i / fadeLen;
    data[i] = data[i] * fadeFactor;
    data[numSamples - 1 - i] = data[numSamples - 1 - i] * fadeFactor;
  }
  return buffer;
}

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
    this._blinkerTickTock = false;

    // Bộ trộn âm Cabin & Âm lượng tổng
    this.cabinMixer = null;
    this.masterGain = null;

    // Các tầng âm thanh liên tục (Continuous Persistent Layers)
    this.engineIdleSource = null;
    this.engineIdleGain = null;
    this.engineLoadSource = null;
    this.engineLoadGain = null;
    this.engineCabinFilter = null;
    this.engineMasterGain = null;
    this.engineGain = null; // Alias cho backward compatibility

    this.roadSource = null;
    this.roadFilter = null;
    this.roadGain = null;

    this.windSource = null;
    this.windFilter = null;
    this.windGain = null;

    this.skidSource = null;
    this.skidFilter = null;
    this.skidGain = null;

    this.rainSource = null;
    this.rainFilter = null;
    this.rainGain = null;
  }

  _getCtx() {
    if (this.ctx) return this.ctx;
    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        return this.ctx;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      const now = this.ctx.currentTime;

      // ── CABIN MIXER & MASTER GAIN ──
      this.cabinMixer = this.ctx.createGain();
      this.cabinMixer.gain.setValueAtTime(1.0, now);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0001 : 1.0, now);

      this.cabinMixer.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // ── 1. ĐỘNG CƠ LIÊN TỤC (PERSISTENT ENGINE DUAL-LAYER: IDLE & LOAD) ──
      const idleBuffer = createEngineCycleBuffer(this.ctx, 1200, 2.0, false);
      const loadBuffer = createEngineCycleBuffer(this.ctx, 1200, 2.0, true);

      this.engineIdleSource = this.ctx.createBufferSource();
      this.engineIdleSource.buffer = idleBuffer;
      this.engineIdleSource.loop = true;
      this.engineIdleSource.playbackRate.setValueAtTime(850 / 1200, now);

      this.engineLoadSource = this.ctx.createBufferSource();
      this.engineLoadSource.buffer = loadBuffer;
      this.engineLoadSource.loop = true;
      this.engineLoadSource.playbackRate.setValueAtTime(850 / 1200, now);

      this.engineIdleGain = this.ctx.createGain();
      this.engineIdleGain.gain.setValueAtTime(0.0001, now);

      this.engineLoadGain = this.ctx.createGain();
      this.engineLoadGain.gain.setValueAtTime(0.0001, now);

      // Bộ lọc cách âm khoang lái (Cabin Lowpass Firewall Filter)
      this.engineCabinFilter = this.ctx.createBiquadFilter();
      this.engineCabinFilter.type = 'lowpass';
      this.engineCabinFilter.frequency.setValueAtTime(220, now);
      this.engineCabinFilter.Q.setValueAtTime(1.2, now);

      this.engineMasterGain = this.ctx.createGain();
      this.engineMasterGain.gain.setValueAtTime(0.0001, now);
      this.engineGain = this.engineMasterGain; // Alias

      this.engineIdleSource.connect(this.engineIdleGain);
      this.engineLoadSource.connect(this.engineLoadGain);
      this.engineIdleGain.connect(this.engineCabinFilter);
      this.engineLoadGain.connect(this.engineCabinFilter);
      this.engineCabinFilter.connect(this.engineMasterGain);
      this.engineMasterGain.connect(this.cabinMixer);

      this.engineIdleSource.start();
      this.engineLoadSource.start();

      // ── 2. TIẾNG LỐP LĂN MẶT ĐƯỜNG (PERSISTENT ROAD ROLLING NOISE) ──
      const pinkBuffer = createPinkNoiseBuffer(this.ctx, 3.0);
      this.roadSource = this.ctx.createBufferSource();
      this.roadSource.buffer = pinkBuffer;
      this.roadSource.loop = true;

      this.roadFilter = this.ctx.createBiquadFilter();
      this.roadFilter.type = 'lowpass';
      this.roadFilter.frequency.setValueAtTime(190, now);
      this.roadFilter.Q.setValueAtTime(0.7, now);

      this.roadGain = this.ctx.createGain();
      this.roadGain.gain.setValueAtTime(0.0001, now);

      this.roadSource.connect(this.roadFilter);
      this.roadFilter.connect(this.roadGain);
      this.roadGain.connect(this.cabinMixer);
      this.roadSource.start();

      // ── 3. TIẾNG GIÓ LÙA KHÍ ĐỘNG HỌC (PERSISTENT WIND NOISE) ──
      const whiteBuffer = createWhiteNoiseBuffer(this.ctx, 3.0);
      this.windSource = this.ctx.createBufferSource();
      this.windSource.buffer = whiteBuffer;
      this.windSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(340, now);
      this.windFilter.Q.setValueAtTime(0.6, now);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.0001, now);

      this.windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.cabinMixer);
      this.windSource.start();

      // ── 4. TIẾNG TRƯỢT LỐP KHẨN CẤP / ABS (PERSISTENT TIRE SLIP NOISE) ──
      const skidBuffer = createSkidNoiseBuffer(this.ctx, 2.0);
      this.skidSource = this.ctx.createBufferSource();
      this.skidSource.buffer = skidBuffer;
      this.skidSource.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.setValueAtTime(760, now);
      this.skidFilter.Q.setValueAtTime(1.8, now);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0.0001, now);

      this.skidSource.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.cabinMixer);
      this.skidSource.start();

      // ── 5. TIẾNG MƯA RƠI NÓC XE (PERSISTENT RAIN AMBIENCE) ──
      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = pinkBuffer;
      this.rainSource.loop = true;

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'bandpass';
      this.rainFilter.frequency.setValueAtTime(1400, now);
      this.rainFilter.Q.setValueAtTime(0.8, now);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.0001, now);

      this.rainSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.cabinMixer);
      this.rainSource.start();

      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext init failed:', e);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(muted ? 0.0001 : 1.0, now, 0.05);
    }
  }

  // ── ĐIỀU BIẾN ÂM THANH ĐỘNG CƠ THỜI GIAN THỰC (RPM, THROTTLE, LOAD) ───────
  setEngineSound(rpm, isDriving, isThrottle, load = 0) {
    if (!this.ctx || !this.initialized) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const now = this.ctx.currentTime;
    if (!isDriving || rpm <= 0) {
      if (this.engineMasterGain) this.engineMasterGain.gain.setTargetAtTime(0.0001, now, 0.08);
      return;
    }

    const safeRpm = Math.max(700, Math.min(7500, rpm));
    // Tỉ lệ playbackRate chuẩn hóa theo base reference 1200 RPM
    const targetRate = Math.max(0.55, Math.min(6.0, safeRpm / 1200));

    if (this.engineIdleSource && this.engineIdleSource.playbackRate) {
      this.engineIdleSource.playbackRate.setTargetAtTime(targetRate, now, 0.05);
    }
    if (this.engineLoadSource && this.engineLoadSource.playbackRate) {
      this.engineLoadSource.playbackRate.setTargetAtTime(targetRate, now, 0.05);
    }

    // Phối khí theo Tải Động Cơ (Engine Load):
    // P/N: load = 0 -> chỉ vù tua idle layer, không có tiếng gầm nặng nề
    // D + đạp ga: load > 0 -> load layer hòa vào tạo tiếng gầm uy lực trầm ấm (vrrrrrrrRRRRR)
    const effectiveLoad = Math.max(0, Math.min(1.0, load));
    const targetIdleGain = isThrottle ? 0.055 + (safeRpm / 6000) * 0.035 : (safeRpm > 1100 ? 0.042 : 0.032);
    const targetLoadGain = effectiveLoad > 0.05 ? Math.min(0.13, effectiveLoad * 0.13) : 0.0001;

    if (this.engineIdleGain) {
      this.engineIdleGain.gain.setTargetAtTime(targetIdleGain, now, 0.05);
    }
    if (this.engineLoadGain) {
      this.engineLoadGain.gain.setTargetAtTime(targetLoadGain, now, 0.05);
    }

    // Bộ lọc cabin mở rộng nhẹ nhàng theo RPM và tải, không nhảy dải đột ngột
    const cabinCutoff = 170 + (safeRpm / 6000) * 250 + effectiveLoad * 110;
    if (this.engineCabinFilter) {
      this.engineCabinFilter.frequency.setTargetAtTime(cabinCutoff, now, 0.06);
    }
    if (this.engineMasterGain) {
      this.engineMasterGain.gain.setTargetAtTime(0.42, now, 0.05);
    }
  }

  // ── ĐIỀU BIẾN TIẾNG LỐP LĂN TRÊN ĐƯỜNG THEO VẬN TỐC ──────────────────────
  setRoadTireNoise(speed, isDriving) {
    if (!this.ctx || !this.initialized || !this.roadGain) return;
    const now = this.ctx.currentTime;
    if (!isDriving || speed <= 0.2) {
      this.roadGain.gain.setTargetAtTime(0.0001, now, 0.1);
      return;
    }
    // Đường cong tăng mượt mà theo vận tốc xe, tần số lọc giữ ổn định ở dải trầm
    const safeSpd = Math.max(0, Math.min(180, speed));
    const targetGain = Math.min(0.045, Math.pow(safeSpd / 120, 1.35) * 0.04);
    this.roadGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  // ── TIẾNG LỐP RÍT PHANH GẤP / VOLLBREMSUNG / ABS ─────────────────────────
  setTireSkid(intensity = 0) {
    if (!this.ctx || !this.initialized || !this.skidGain) return;
    const now = this.ctx.currentTime;
    const safeInt = Math.max(0, Math.min(1.0, intensity));
    if (safeInt <= 0.04) {
      this.skidGain.gain.setTargetAtTime(0.0001, now, 0.08);
      return;
    }
    // Chỉ kích hoạt khi thực sự có hiện tượng trượt lốp / bó cứng phanh
    const targetGain = Math.min(0.08, (safeInt - 0.04) * 0.085);
    this.skidGain.gain.setTargetAtTime(targetGain, now, 0.04);
  }

  // ── TIẾNG GIÓ LÙA KHÍ ĐỘNG HỌC THEO TỐC ĐỘ ──────────────────────────────
  setWindNoise(speed) {
    if (!this.ctx || !this.initialized || !this.windGain) return;
    const now = this.ctx.currentTime;
    // Không dùng ngưỡng cứng, âm lượng gió tăng liên tục bậc 2 theo khí động học
    const safeSpd = Math.max(0, Math.min(180, speed));
    const targetGain = Math.min(0.038, Math.pow(safeSpd / 140, 2.2) * 0.038);
    this.windGain.gain.setTargetAtTime(targetGain, now, 0.12);
  }

  // ── TIẾNG RÍT LỐP (tire skid) theo độ trượt — nối với understeer/phanh khẩn cấp ──
  setSkidIntensity(intensity) {
    if (!this.ctx || !this.initialized || !this.skidGain) return;
    const now = this.ctx.currentTime;
    const v = Math.max(0, Math.min(1, intensity));
    // Trượt nhẹ: rít khẽ tần số thấp; trượt mạnh: rít gằn cao hơn
    const targetGain = v * v * 0.085;
    this.skidGain.gain.setTargetAtTime(Math.max(0.0001, targetGain), now, 0.08);
    if (this.skidFilter) {
      this.skidFilter.frequency.setTargetAtTime(600 + v * 500, now, 0.1);
    }
  }


  setRainAmbiance(isRaining) {
    if (!this.ctx || !this.initialized || !this.rainGain) return;
    const now = this.ctx.currentTime;
    this.rainGain.gain.setTargetAtTime(isRaining ? 0.055 : 0.0001, now, 0.2);
  }

  // ── TIẾNG GẠT NƯỚC KÍNH LÁI ──────────────────────────────────────────────
  playWiperSweep() {
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Âm thanh chà gạt nước trên kính êm ái bằng noise lọc dải, không dùng sóng dao động quét tần số chói tai
      const buffer = createPinkNoiseBuffer(ctx, 0.22);
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(380, now);
      filter.Q.setValueAtTime(1.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(now);
      source.stop(now + 0.22);
    } catch (e) {}
  }

  // ── TIẾNG CỦ ĐỀ KHỞI ĐỘNG XE (ENGINE STARTER CRANK & IGNITION) ────────────
  playStarterEngine(onStarted) {
    if (this.isMuted) {
      if (onStarted) onStarted();
      return;
    }
    try {
      const ctx = this._getCtx();
      if (!ctx) {
        if (onStarted) onStarted();
        return;
      }
      const now = ctx.currentTime;

      // 1. Rơ-le đề đóng tiếp điểm điện ("Tách" cơ khí sắc nét)
      const clickOsc = ctx.createOscillator();
      const clickFilter = ctx.createBiquadFilter();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1600, now);
      clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.018);
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(1200, now);
      clickGain.gain.setValueAtTime(0.04, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      clickOsc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.022);

      // 2. Tiếng mô-tơ củ đề điện quay bánh đà (Electric starter motor whine)
      const motorOsc = ctx.createOscillator();
      const motorFilter = ctx.createBiquadFilter();
      const motorGain = ctx.createGain();
      motorOsc.type = 'sine';
      motorOsc.frequency.setValueAtTime(260, now + 0.03);
      motorOsc.frequency.linearRampToValueAtTime(380, now + 0.48);
      motorFilter.type = 'lowpass';
      motorFilter.frequency.setValueAtTime(450, now);
      motorGain.gain.setValueAtTime(0.001, now);
      motorGain.gain.linearRampToValueAtTime(0.025, now + 0.08);
      motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.50);
      motorOsc.connect(motorFilter);
      motorFilter.connect(motorGain);
      motorGain.connect(ctx.destination);
      motorOsc.start(now + 0.03);
      motorOsc.stop(now + 0.52);

      // 3. Tiếng 4 nhịp pít-tông nén khí cơ khí êm ái ("khục - khục - khục - khục")
      for (let i = 0; i < 4; i++) {
        const t = now + 0.06 + i * 0.11;
        const crankOsc = ctx.createOscillator();
        const crankFilter = ctx.createBiquadFilter();
        const crankGain = ctx.createGain();

        crankOsc.type = 'triangle';
        crankOsc.frequency.setValueAtTime(68, t);
        crankOsc.frequency.exponentialRampToValueAtTime(32, t + 0.075);

        crankFilter.type = 'lowpass';
        crankFilter.frequency.setValueAtTime(135, t);
        crankFilter.Q.setValueAtTime(2.0, t);

        crankGain.gain.setValueAtTime(0.07, t);
        crankGain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

        crankOsc.connect(crankFilter);
        crankFilter.connect(crankGain);
        crankGain.connect(ctx.destination);

        crankOsc.start(t);
        crankOsc.stop(t + 0.08);
      }

      // 4. Bắt lửa buồng đốt & vù ga garanti (Ignition flare & smooth settle to 850 RPM)
      const ignTime = now + 0.48;
      const ignOsc = ctx.createOscillator();
      const ignSub = ctx.createOscillator();
      const ignFilter = ctx.createBiquadFilter();
      const ignGain = ctx.createGain();

      ignOsc.type = 'triangle';
      ignSub.type = 'sine';

      // Vù tua máy từ 55Hz vọt lên 110Hz (~1300 RPM) rồi êm dịu hạ về 28.3Hz (850 RPM)
      ignOsc.frequency.setValueAtTime(55, ignTime);
      ignOsc.frequency.exponentialRampToValueAtTime(115, ignTime + 0.22);
      ignOsc.frequency.exponentialRampToValueAtTime(28.3, ignTime + 0.65);

      ignSub.frequency.setValueAtTime(27.5, ignTime);
      ignSub.frequency.exponentialRampToValueAtTime(57.5, ignTime + 0.22);
      ignSub.frequency.exponentialRampToValueAtTime(14.15, ignTime + 0.65);

      ignFilter.type = 'lowpass';
      ignFilter.frequency.setValueAtTime(240, ignTime);
      ignFilter.Q.setValueAtTime(1.4, ignTime);

      ignGain.gain.setValueAtTime(0.001, ignTime);
      ignGain.gain.linearRampToValueAtTime(0.09, ignTime + 0.15);
      ignGain.gain.exponentialRampToValueAtTime(0.001, ignTime + 0.65);

      ignOsc.connect(ignFilter);
      ignSub.connect(ignFilter);
      ignFilter.connect(ignGain);
      ignGain.connect(ctx.destination);

      ignOsc.start(ignTime);
      ignSub.start(ignTime);
      ignOsc.stop(ignTime + 0.68);
      ignSub.stop(ignTime + 0.68);

      if (onStarted) {
        setTimeout(onStarted, 650);
      }
    } catch (e) {
      if (onStarted) onStarted();
    }
  }

  // ── RƠ-LE XI-NHAN CƠ KHÍ "TICK - TOCK" CHÂN THỰC ─────────────────────────
  playBlinker() {
    this._blinkerTickTock = !this._blinkerTickTock;
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);

      if (this._blinkerTickTock) {
        // "TICK" - Cơ cấu đóng tiếp điểm rơ-le trong táp-lô êm ái
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.022);
        gain.gain.setValueAtTime(0.022, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      } else {
        // "TOCK" - Nhả tiếp điểm trầm hơn
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.022);
        gain.gain.setValueAtTime(0.018, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      }

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.026);
    } catch (e) {}
  }

  // ── TIẾNG PHANH DỪNG XE CƠ KHÍ (BRAKE CREAK KHI V = 0) ───────────────────
  playBrakeCreak() {
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      if (this._lastBrakeCreakTime && now - this._lastBrakeCreakTime < 1.5) return;
      this._lastBrakeCreakTime = now;

      // Tiếng má phanh miết êm ái khi dừng hẳn xe, lọc hạ âm trầm, không dùng sawtooth chói tai
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    } catch (e) {}
  }

  playHorn() {
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(415, ctx.currentTime);
      osc2.frequency.setValueAtTime(520, ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(465, ctx.currentTime);
      filter.Q.setValueAtTime(1.4, ctx.currentTime);

      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(); osc2.start();
      osc1.stop(ctx.currentTime + 0.35); osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playLightSwitch() {
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.02);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } catch (e) {}
  }

  // ── TIẾNG CƠ HỌC CẦN SỐ (MANUAL GEAR SELECTOR LEVER DETENT CLICK) ──────────
  playGearShift() {
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Âm cơ học vào ngàm số (mechanical notch click trầm)
      const oscThud = ctx.createOscillator();
      const gainThud = ctx.createGain();
      oscThud.type = 'triangle';
      oscThud.frequency.setValueAtTime(180, now);
      oscThud.frequency.exponentialRampToValueAtTime(60, now + 0.035);
      gainThud.gain.setValueAtTime(0.035, now);
      gainThud.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      oscThud.connect(gainThud);
      gainThud.connect(ctx.destination);
      oscThud.start(now);
      oscThud.stop(now + 0.035);

      // 2. Tiếng lẫy lò xo nảy nhẹ (subtle latch release)
      const oscSnap = ctx.createOscillator();
      const gainSnap = ctx.createGain();
      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(650, now);
      snapFilter.Q.setValueAtTime(2.2, now);

      oscSnap.type = 'triangle';
      oscSnap.frequency.setValueAtTime(540, now);
      oscSnap.frequency.exponentialRampToValueAtTime(280, now + 0.02);
      gainSnap.gain.setValueAtTime(0.015, now);
      gainSnap.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      oscSnap.connect(snapFilter);
      snapFilter.connect(gainSnap);
      gainSnap.connect(ctx.destination);
      oscSnap.start(now);
      oscSnap.stop(now + 0.02);
    } catch (e) {}
  }

  playPenalty() {
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Cảnh báo táp-lô êm ái: 2 tiếng "bụp bụp" trầm ấm thay vì còi rè chói tai
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.10;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);

        gain.gain.setValueAtTime(0.035, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.065);
      }
    } catch (e) {}
  }

  playSuccess() {
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playSeatbelt(fastened) {
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(fastened ? 340 : 220, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.035);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  playSeatbeltChime() {
    if (this.isMuted) return;
    try {
      const ctx = this._getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, now);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }
}

const audioEngine = new SoundEngine();
export default audioEngine;

