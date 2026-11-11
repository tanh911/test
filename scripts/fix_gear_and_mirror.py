import os

vpath = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\world\vehicle.ts"
with open(vpath, "r", encoding="utf-8") as f:
    vc = f.read()

# 1. Update VehicleHandle interface
old_interface = """export interface VehicleHandle {
  group: THREE.Group;
  state: VehicleState;
  /** xi-nhan đang bật (null = tắt) — đọc để check vi phạm 'nosignal' + mini-map */
  readonly signal: 'left' | 'right' | null;
  readonly steerAngle: number;
  readonly throttle: number;
  readonly brake: number;
  update: (dt: number, input: VehicleInput) => void;
  /** áp lại pose từ state (sau va chạm đẩy vị trí) */
  syncPose: () => void;
  /** pose ghế lái cho camera cabin (local −0.38 = LHD) */
  seatPose: () => { x: number; y: number; z: number; yaw: number };
  dispose: () => void;
  /** Gán hàm xử lý sự kiện xe (signal_left/right/off) */
  onEvent?: (fn: VehicleEventHandler) => void;
}"""

new_interface = """export interface VehicleHandle {
  group: THREE.Group;
  state: VehicleState;
  /** xi-nhan đang bật (null = tắt) — đọc để check vi phạm 'nosignal' + mini-map */
  readonly signal: 'left' | 'right' | null;
  readonly steerAngle: number;
  readonly throttle: number;
  readonly brake: number;
  update: (dt: number, input: VehicleInput) => void;
  /** áp lại pose từ state (sau va chạm đẩy vị trí) */
  syncPose: () => void;
  /** pose ghế lái cho camera cabin */
  seatPose: () => { x: number; y: number; z: number; yaw: number };
  /** đổi số P R N D */
  setGear: (g: 'P' | 'R' | 'N' | 'D') => void;
  /** cập nhật hiển thị chi tiết theo camera mode (ẩn gương ngoài khi ở cabin) */
  setCameraMode: (mode: 'cabin' | 'outside' | 'mirror' | 'shoulder') => void;
  dispose: () => void;
  /** Gán hàm xử lý sự kiện xe (signal_left/right/off) */
  onEvent?: (fn: VehicleEventHandler) => void;
}"""

if old_interface in vc:
    vc = vc.replace(old_interface, new_interface)
    print("Updated VehicleHandle interface.")
else:
    print("Could not find old_interface.")

# 2. Update logic vận hành theo số trong update()
old_physics = """      // ── dọc: ga / phanh / lùi ──
      state.t += dt;
      lastThrottle = input.throttle;
      lastBrake = input.brake;
      let throttle = input.throttle;

      // ── chuyển số sân ──
      if (input.gear) {
        state.gear = input.gear;
        if (state.gear === 'D' && state.speed < 0) state.speed = 0;
        if (state.gear === 'R' && state.speed > 0.1) throttle = 0;
      }
      if (state.gear === 'P' || state.gear === 'N') throttle = 0;
      if (state.gear === 'D' && state.speed < -0.1) throttle = 0;
      if (state.gear === 'R' && state.speed > 0.1) throttle = 0;

      const currentAccel = input.boost ? ACCEL * 1.5 : ACCEL;
      let a = throttle * currentAccel - DRAG * state.speed;
      if (input.brake > 0) {
        if (state.speed > 0.1) a -= input.brake * BRAKE;
        else if (throttle === 0) a = -2.8; // lùi khi đứng
      }
      state.speed = Math.max(MAX_SPEED_REV, Math.min(MAX_SPEED_FWD, state.speed + a * dt));
      if (throttle === 0 && input.brake === 0 && Math.abs(state.speed) < 0.05) state.speed = 0;"""

new_physics = """      // ── dọc: ga / phanh / lùi chuẩn xe số tự động (P, R, N, D) ──
      state.t += dt;
      lastThrottle = input.throttle;
      lastBrake = input.brake;

      if (input.gear) {
        state.gear = input.gear;
      }

      let a = 0;
      const currentAccel = input.boost ? ACCEL * 1.5 : ACCEL;

      if (state.gear === 'P') {
        // Số P: Khóa bánh, phanh đỗ, xe đứng yên hoàn toàn
        state.speed = 0;
        a = 0;
      } else if (state.gear === 'N') {
        // Số N: Mo, không có lực kéo động cơ, trôi tự do và phanh
        if (input.brake > 0) {
          a = -Math.sign(state.speed) * input.brake * BRAKE;
        } else {
          a = -DRAG * state.speed * 1.2;
        }
        state.speed += a * dt;
        if (input.brake > 0 && Math.abs(state.speed) < 0.1) state.speed = 0;
      } else if (state.gear === 'D') {
        // Số D: Lái tiến
        // W = Ga tiến (tốc độ > 0)
        // S = Phanh dừng xe (tốc độ về 0 và đứng yên, KHÔNG BAO GIỜ LÙI KHI Ở SỐ D)
        if (state.speed < 0) state.speed = 0;

        if (input.brake > 0) {
          if (state.speed > 0.05) {
            a = -input.brake * BRAKE;
          } else {
            state.speed = 0;
            a = 0;
          }
        } else if (input.throttle > 0) {
          a = input.throttle * currentAccel - DRAG * state.speed;
        } else {
          a = -DRAG * state.speed * 1.5;
        }

        state.speed = Math.max(0, Math.min(MAX_SPEED_FWD, state.speed + a * dt));
        if (input.throttle === 0 && state.speed < 0.08) state.speed = 0;
      } else if (state.gear === 'R') {
        // Số R: Lùi xe (bấm phím 2 hoặc chọn R để lùi)
        // W = Đạp ga lùi (tốc độ âm: từ 0 tới MAX_SPEED_REV)
        // S = Đạp phanh lùi (hãm tốc độ lùi về 0)
        if (state.speed > 0) state.speed = 0;

        if (input.brake > 0) {
          if (state.speed < -0.05) {
            a = input.brake * BRAKE; // gia tốc dương để hãm lùi về 0
          } else {
            state.speed = 0;
            a = 0;
          }
        } else if (input.throttle > 0) {
          const revAccel = ACCEL * 0.75;
          a = -input.throttle * revAccel - DRAG * state.speed;
        } else {
          a = -DRAG * state.speed * 1.5;
        }

        state.speed = Math.max(MAX_SPEED_REV, Math.min(0, state.speed + a * dt));
        if (input.throttle === 0 && Math.abs(state.speed) < 0.08) state.speed = 0;
      }"""

if old_physics in vc:
    vc = vc.replace(old_physics, new_physics)
    print("Updated physics logic.")
else:
    print("Could not find old_physics.")

# 3. Add mirror hiding and methods in return object
old_return = """    seatPose() {
      // ghế lái LHD: glTF local (−0.35 = trái, mắt 1.15, z −0.05 = tiến lên phía trước qua khỏi cột B/khung cửa)
      // không bị cột A/B hay mép cửa che tầm nhìn bên trái
      const lx = -0.32;
      const ly = 1.15;
      const lz = -0.05;
      // xoay local → world: yaw = heading + π (xe mặt −Z)
      const s = Math.sin(state.heading + Math.PI);
      const c = Math.cos(state.heading + Math.PI);
      // three.js: world = R_y(θ)·local → x' = lx·cosθ + lz·sinθ; z' = −lx·sinθ + lz·cosθ
      const wx = state.x + lx * c + lz * s;
      const wz = state.z + -lx * s + lz * c;
      return { x: wx, y: ly, z: wz, yaw: state.heading + Math.PI };
    },

    dispose() {"""

new_return = """    seatPose() {
      // ghế lái LHD: glTF local (−0.32 = trái, mắt 1.18, z −0.10)
      const lx = -0.32;
      const ly = 1.18;
      const lz = -0.10;
      const s = Math.sin(state.heading + Math.PI);
      const c = Math.cos(state.heading + Math.PI);
      const wx = state.x + lx * c + lz * s;
      const wz = state.z + -lx * s + lz * c;
      return { x: wx, y: ly, z: wz, yaw: state.heading + Math.PI };
    },

    setGear(g: 'P' | 'R' | 'N' | 'D') {
      state.gear = g;
    },

    setCameraMode(mode: 'cabin' | 'outside' | 'mirror' | 'shoulder') {
      // Ẩn khối gương ngoài thô (body_4) khi ở trong cabin để không che góc kính lái
      const mirror = group.getObjectByName('body_4');
      if (mirror) {
        mirror.visible = mode !== 'cabin';
      }
    },

    dispose() {"""

if old_return in vc:
    vc = vc.replace(old_return, new_return)
    print("Updated seatPose and added setGear / setCameraMode.")
else:
    # Thử tìm seatPose
    idx_sp = vc.find("seatPose()")
    idx_disp = vc.find("dispose() {", idx_sp)
    if idx_sp != -1 and idx_disp != -1:
        vc = vc[:idx_sp] + new_return + vc[idx_disp + 10:]
        print("Updated via slice.")

with open(vpath, "w", encoding="utf-8") as f:
    f.write(vc)
print("Saved vehicle.ts.")
