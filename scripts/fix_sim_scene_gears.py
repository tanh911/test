import os

spath = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\world\simScene.ts"
with open(spath, "r", encoding="utf-8") as f:
    sc = f.read()

# 1. Update SimSceneHandle interface
old_handle = """export interface SimSceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  map: GameMap;
  vehicle: VehicleHandle | null;
  getStats: () => SimStats;
  getRuleState: () => RuleState | null;
  /** dữ liệu mini-map (player-centered top-down) — đọc mỗi frame từ RAF của MiniMap */
  getMapState: () => MapState;
  dispose: () => void;
  /** gọi mỗi frame từ host (React) — cập nhật camera bay/xe + render */
  update: (dt: number) => void;
}"""

new_handle = """export interface SimSceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  map: GameMap;
  vehicle: VehicleHandle | null;
  getStats: () => SimStats;
  getRuleState: () => RuleState | null;
  /** đổi số P R N D */
  setGear?: (g: 'P' | 'R' | 'N' | 'D') => void;
  /** dữ liệu mini-map (player-centered top-down) — đọc mỗi frame từ RAF của MiniMap */
  getMapState: () => MapState;
  dispose: () => void;
  /** gọi mỗi frame từ host (React) — cập nhật camera bay/xe + render */
  update: (dt: number) => void;
}"""

if old_handle in sc:
    sc = sc.replace(old_handle, new_handle)
    print("Updated SimSceneHandle interface.")
else:
    print("Could not match old_handle.")

# 2. Update gear key handling
old_gears = """        // ── số sân: 1=P, 2=R, 3=N, 4=D ──
        let gear: 'P' | 'R' | 'N' | 'D' | undefined;
        if (keys.has('Digit1')) gear = 'P';
        else if (keys.has('Digit2')) gear = 'R';
        else if (keys.has('Digit3')) gear = 'N';
        else if (keys.has('Digit4')) gear = 'D';"""

new_gears = """        // ── số: 1=P, 2=R, 3=N, 4=D (hỗ trợ cả Digit và Numpad) ──
        let gear: 'P' | 'R' | 'N' | 'D' | undefined;
        if (keys.has('Digit1') || keys.has('Numpad1')) gear = 'P';
        else if (keys.has('Digit2') || keys.has('Numpad2')) gear = 'R';
        else if (keys.has('Digit3') || keys.has('Numpad3')) gear = 'N';
        else if (keys.has('Digit4') || keys.has('Numpad4')) gear = 'D';"""

if old_gears in sc:
    sc = sc.replace(old_gears, new_gears)
    print("Updated gear key handling.")
else:
    print("Could not match old_gears.")

# 3. Update createVehicle load
old_load = "createVehicle(scene, map).then(v => { vehicle = v; });"
new_load = "createVehicle(scene, map).then(v => { vehicle = v; v.setCameraMode(camMode); });"
if old_load in sc:
    sc = sc.replace(old_load, new_load)
    print("Updated vehicle creation callback.")

# 4. Update camMode changes
old_cam_m = """        if (keys.has('KeyM') && !keyMPrev) {
          camMode = camMode === 'cabin' ? 'mirror' : 'cabin';
          keyMPrev = true;
        }"""
new_cam_m = """        if (keys.has('KeyM') && !keyMPrev) {
          camMode = camMode === 'cabin' ? 'mirror' : 'cabin';
          vehicle?.setCameraMode(camMode);
          keyMPrev = true;
        }"""
if old_cam_m in sc:
    sc = sc.replace(old_cam_m, new_cam_m)

old_cam_v = """        if (keys.has('KeyV') && !keyVPrev) {
          camMode = camMode === 'outside' ? 'cabin' : 'outside';
          keyVPrev = true;
        }"""
new_cam_v = """        if (keys.has('KeyV') && !keyVPrev) {
          camMode = camMode === 'outside' ? 'cabin' : 'outside';
          vehicle?.setCameraMode(camMode);
          keyVPrev = true;
        }"""
if old_cam_v in sc:
    sc = sc.replace(old_cam_v, new_cam_v)

# 5. Add setGear in returned object
old_get_stats = "getStats: () => chunkStats,"
new_get_stats = """getStats: () => chunkStats,
    setGear: (g: 'P' | 'R' | 'N' | 'D') => {
      vehicle?.setGear(g);
    },"""
if old_get_stats in sc:
    sc = sc.replace(old_get_stats, new_get_stats)
    print("Added setGear to return object.")

with open(spath, "w", encoding="utf-8") as f:
    f.write(sc)
print("Saved simScene.ts.")
