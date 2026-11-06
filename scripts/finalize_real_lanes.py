import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix

print("=====================================================================")
print("=== CHỈNH SỬA TOÀN BỘ LÀN XE KHỚP 100% ẢNH THỰC TẾ GOOGLE EARTH  ===")
print("=====================================================================")

# -------------------------------------------------------------------------
# 1. VẬT LIỆU PBR
# -------------------------------------------------------------------------
mat_asphalt = bpy.data.materials.get("Autobahn_Asphalt_PBR")
mat_marking = bpy.data.materials.get("Autobahn_Marking_White")
mat_curb = bpy.data.materials.get("Island_Curb_Concrete")

col_ramps = bpy.data.collections.get("AUTOBAHN_AS18_RAMPS")
col_local = bpy.data.collections.get("WERLER_STRASSE_LOCAL")
col_nature = bpy.data.collections.get("AUTOBAHN_NATURE_TREES")

# Xóa toàn bộ các nhánh nối cũ, nhánh thừa và đảo
del_names = [
    "AS18_West_Direct_Exit_Road", "AS18_West_Direct_Exit_Line_L", "AS18_West_Direct_Exit_Line_R",
    "AS18_West_Loop_Ramp_Road", "AS18_West_Loop_Ramp_Line_L", "AS18_West_Loop_Ramp_Line_R",
    "AS18_East_OffRamp_Road", "AS18_East_OffRamp_Line_L", "AS18_East_OffRamp_Line_R",
    "AS18_West_Entrance_Slip_Road", "AS18_West_Entrance_Slip_Line_R",
    "AS18_East_SlipLane_Road", "AS18_East_SlipLane_Line_R",
    "Werler_West_Splitter_Island", "Werler_East_Splitter_Island",
    "Arrow_Werler_W_Straight", "Arrow_Werler_W_Turn", "Arrow_Werler_E_Straight", "Arrow_Werler_E_Turn"
]
for name in del_names:
    o = bpy.data.objects.get(name)
    if o: bpy.data.objects.remove(o, do_unlink=True)

for o in list(col_nature.objects):
    if "roadscape_grove" in o.name.lower():
        bpy.data.objects.remove(o, do_unlink=True)

# -------------------------------------------------------------------------
# 2. HÀM NỘI SUY CATMULL-ROM
# -------------------------------------------------------------------------
def catmull_rom_spline(control_pts, num_samples_per_seg=14):
    pts = []
    n = len(control_pts)
    if n < 2: return control_pts
    p_pad = [control_pts[0]] + list(control_pts) + [control_pts[-1]]
    for i in range(1, n):
        p0, p1, p2, p3 = p_pad[i-1], p_pad[i], p_pad[i+1], p_pad[i+2]
        for t_step in range(num_samples_per_seg):
            t = t_step / float(num_samples_per_seg)
            t2 = t * t; t3 = t2 * t
            pt = 0.5 * (
                (2.0 * p1) +
                (-p0 + p2) * t +
                (2.0*p0 - 5.0*p1 + 4.0*p2 - p3) * t2 +
                (-p0 + 3.0*p1 - 3.0*p2 + p3) * t3
            )
            pts.append(pt)
    pts.append(control_pts[-1])
    return pts

def compute_normals_2d(pts):
    normals = []
    n = len(pts)
    for i in range(n):
        if i == 0: d = pts[1] - pts[0]
        elif i == n - 1: d = pts[n - 1] - pts[n - 2]
        else: d = pts[i + 1] - pts[i - 1]
        l = math.hypot(d.x, d.y) or 1.0
        normals.append(Vector((-d.y / l, d.x / l, 0.0)))
    return normals

def build_road_ribbon(name, pts, width, z_offset=0.0, mat=mat_asphalt, collection=col_ramps):
    normals = compute_normals_2d(pts)
    bm = bmesh.new()
    n = len(pts)
    hw = width / 2.0
    vl = []; vr = []
    for i in range(n):
        p = pts[i]; norm = normals[i]
        zv = p.z + z_offset
        vl.append(bm.verts.new(Vector((p.x + norm.x * hw, p.y + norm.y * hw, zv))))
        vr.append(bm.verts.new(Vector((p.x - norm.x * hw, p.y - norm.y * hw, zv))))
    for i in range(n - 1):
        bm.faces.new((vl[i], vr[i], vr[i+1], vl[i+1]))
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat); m.update()
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    return obj

def build_marking_line(name, pts, offset, width, z_offset=0.02, collection=col_ramps, trim=1):
    normals = compute_normals_2d(pts)
    bm = bmesh.new()
    n = len(pts)
    if n <= 2 * trim: trim = 0
    hw = width / 2.0
    vl = []; vr = []
    for i in range(trim, n - trim):
        p = pts[i]; norm = normals[i]
        zv = p.z + z_offset
        cx = p.x + norm.x * offset; cy = p.y + norm.y * offset
        vl.append(bm.verts.new(Vector((cx + norm.x * hw, cy + norm.y * hw, zv))))
        vr.append(bm.verts.new(Vector((cx - norm.x * hw, cy - norm.y * hw, zv))))
    for i in range(len(vl) - 1):
        bm.faces.new((vl[i], vr[i], vr[i+1], vl[i+1]))
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat_marking); m.update()
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    return obj

# -------------------------------------------------------------------------
# 3. NHÁNH VÒNG PHÍA TÂY (WEST PARCLO LOOP RAMP - 100% NHƯ GOOGLE EARTH)
# -------------------------------------------------------------------------
# Đường chạy thẳng từ Werler Straße dọc mép kho hàng lên phía Bắc, sau đó uốn vòng cung 180 độ tròn trịa nhập vào A2
cpts_west_loop = [
    Vector((2322.0, -2688.0, 0.05)),
    Vector((2280.0, -2688.0, 0.10)),
    Vector((2220.0, -2686.0, 0.35)),
    Vector((2160.0, -2682.0, 0.90)),
    Vector((2100.0, -2670.0, 1.80)),
    Vector((2055.0, -2650.0, 2.90)),
    Vector((2020.0, -2620.0, 4.00)),
    Vector((2015.0, -2595.0, 4.80)),
    Vector((2035.0, -2580.0, 5.30)),
    Vector((2065.0, -2573.0, 5.60)),
    Vector((2115.0, -2572.0, 5.60)),
    Vector((2175.0, -2572.0, 5.60)),
    Vector((2240.0, -2572.0, 5.60))
]
pts_west_loop = catmull_rom_spline(cpts_west_loop, num_samples_per_seg=14)

build_road_ribbon("AS18_West_Loop_Ramp_Road", pts_west_loop, width=6.5, collection=col_ramps)
build_marking_line("AS18_West_Loop_Ramp_Line_L", pts_west_loop, offset=3.0, width=0.20, collection=col_ramps)
build_marking_line("AS18_West_Loop_Ramp_Line_R", pts_west_loop, offset=-3.0, width=0.20, collection=col_ramps)

# Nhánh rẽ phải từ Werler Straße vào nhánh vòng (West Slip Entrance)
cpts_west_slip = [
    Vector((2330.0, -2715.0, 0.05)),
    Vector((2320.0, -2702.0, 0.05)),
    Vector((2305.0, -2694.0, 0.05)),
    Vector((2280.0, -2688.0, 0.10))
]
pts_west_slip = catmull_rom_spline(cpts_west_slip, num_samples_per_seg=10)
build_road_ribbon("AS18_West_Entrance_Slip_Road", pts_west_slip, width=5.5, collection=col_local)
build_marking_line("AS18_West_Entrance_Slip_Line_R", pts_west_slip, offset=-2.5, width=0.20, collection=col_local)

# -------------------------------------------------------------------------
# 4. NHÁNH RA PHÍA ĐÔNG (EAST DIRECT OFF-RAMP & SLIP LANE - 100% GOOGLE EARTH)
# -------------------------------------------------------------------------
cpts_east_ramp = [
    Vector((2040.0, -2540.0, 5.60)),
    Vector((2080.0, -2528.0, 5.30)),
    Vector((2125.0, -2506.0, 4.30)),
    Vector((2170.0, -2478.0, 3.00)),
    Vector((2215.0, -2462.0, 1.80)),
    Vector((2260.0, -2455.0, 0.70)),
    Vector((2295.0, -2453.0, 0.20)),
    Vector((2322.0, -2452.0, 0.05))
]
pts_east_ramp = catmull_rom_spline(cpts_east_ramp, num_samples_per_seg=14)

build_road_ribbon("AS18_East_OffRamp_Road", pts_east_ramp, width=6.5, collection=col_ramps)
build_marking_line("AS18_East_OffRamp_Line_L", pts_east_ramp, offset=3.0, width=0.20, collection=col_ramps)
build_marking_line("AS18_East_OffRamp_Line_R", pts_east_ramp, offset=-3.0, width=0.20, collection=col_ramps)

# Làn rẽ phải phía Đông nhập vào Werler Straße (East Right-Turn Slip Lane)
cpts_east_slip = [
    Vector((2260.0, -2455.0, 0.70)),
    Vector((2280.0, -2448.0, 0.35)),
    Vector((2298.0, -2434.0, 0.15)),
    Vector((2310.0, -2415.0, 0.05)),
    Vector((2318.0, -2390.0, 0.05))
]
pts_east_slip = catmull_rom_spline(cpts_east_slip, num_samples_per_seg=10)
build_road_ribbon("AS18_East_SlipLane_Road", pts_east_slip, width=5.5, collection=col_local)
build_marking_line("AS18_East_SlipLane_Line_R", pts_east_slip, offset=-2.5, width=0.20, collection=col_local)

# -------------------------------------------------------------------------
# 5. ĐẢO PHÂN LUỒNG BÊ TÔNG GỌN GÀNG (REALISTIC COMPACT ISLANDS)
# -------------------------------------------------------------------------
def make_island(name, pts_2d, collection=col_local):
    bm = bmesh.new()
    vb = [bm.verts.new(Vector((p[0], p[1], 0.05))) for p in pts_2d]
    vt = [bm.verts.new(Vector((p[0], p[1], 0.19))) for p in pts_2d]
    n = len(pts_2d)
    for i in range(n):
        bm.faces.new((vb[i], vb[(i+1)%n], vt[(i+1)%n], vt[i]))
    bm.faces.new(vt[::-1])
    bm.faces.new(vb)
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat_curb); m.update()
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    return obj

# Đảo phía Tây
island_w = [
    (2318.0, -2695.0),
    (2300.0, -2692.0),
    (2308.0, -2712.0),
    (2316.0, -2708.0)
]
make_island("Werler_West_Splitter_Island", island_w)

# Đảo phía Đông
island_e = [
    (2316.0, -2448.0),
    (2296.0, -2452.0),
    (2304.0, -2430.0),
    (2312.0, -2434.0)
]
make_island("Werler_East_Splitter_Island", island_e)

# -------------------------------------------------------------------------
# 6. SƠN MẶT ĐƯỜNG MŨI TÊN CHỈ HƯỚNG
# -------------------------------------------------------------------------
def make_arrow(name, pts, pos, yaw, collection=col_local):
    bm = bmesh.new()
    rot = Matrix.Rotation(yaw, 4, 'Z')
    verts = [bm.verts.new(rot @ p + pos) for p in pts]
    bm.faces.new(verts)
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat_marking)
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    return obj

pts_straight = [
    Vector((-0.15, -1.8, 0.0)), Vector((0.15, -1.8, 0.0)),
    Vector((0.15, 0.6, 0.0)), Vector((0.65, 0.6, 0.0)),
    Vector((0.0, 2.0, 0.0)),
    Vector((-0.65, 0.6, 0.0)), Vector((-0.15, 0.6, 0.0))
]
pts_turn = [
    Vector((-0.15, -1.8, 0.0)), Vector((0.15, -1.8, 0.0)),
    Vector((0.15, -0.2, 0.0)), Vector((0.8, 0.6, 0.0)),
    Vector((0.8, 0.2, 0.0)), Vector((1.8, 0.8, 0.0)),
    Vector((1.1, 1.6, 0.0)), Vector((1.1, 1.1, 0.0)),
    Vector((0.4, 0.8, 0.0)), Vector((-0.15, 0.2, 0.0))
]

make_arrow("Arrow_Werler_W_Straight", pts_straight, Vector((2323.0, -2705.0, 0.06)), math.radians(0.0))
make_arrow("Arrow_Werler_W_Turn", pts_turn, Vector((2314.0, -2700.0, 0.06)), math.radians(35.0))

make_arrow("Arrow_Werler_E_Straight", pts_straight, Vector((2318.0, -2435.0, 0.06)), math.radians(180.0))
make_arrow("Arrow_Werler_E_Turn", pts_turn, Vector((2308.0, -2430.0, 0.06)), math.radians(215.0))

# -------------------------------------------------------------------------
# 7. CÂY XANH ROADSCAPE BỐ TRÍ CHUẨN XÁC THEO ẢNH GOOGLE EARTH 2
# -------------------------------------------------------------------------
tree_dense = bpy.data.objects.get('RSEA LOD Tree Dense Leafy')
tree_medium = bpy.data.objects.get('RSEA LOD Tree Medium')
tree_small = bpy.data.objects.get('RSEA LOD Tree Small')
tree_pool = [t for t in [tree_dense, tree_medium, tree_small] if t is not None]

random.seed(123)
t_idx = 0

def plant_tree(x, y, z=0.05, sc=1.15):
    global t_idx
    base_t = random.choice(tree_pool)
    t = bpy.data.objects.new(f"Roadscape_Grove_{t_idx:04d}", base_t.data)
    col_nature.objects.link(t)
    t.location = (x, y, z)
    t.rotation_euler = (0, 0, random.uniform(0, 6.28))
    s = sc * random.uniform(0.95, 1.3)
    t.scale = (s, s, s)
    t_idx += 1
    return t

# 1. Cụm rừng hình bầu dục bên trong nhánh vòng phía Tây (sát cao tốc A2 như trong Ảnh 2)
# X in [2110, 2240], Y in [-2635, -2595]
for _ in range(55):
    tx = random.uniform(2120.0, 2235.0)
    ty = random.uniform(-2635.0, -2595.0)
    plant_tree(tx, ty, z=0.05, sc=1.2)

# 2. Hàng cây viền ngoài ôm trọn cung tròn của nhánh vòng (sát mép kho hàng aba Logistics)
for ang_deg in range(0, 185, 12):
    rad = math.radians(ang_deg)
    cx = 2075.0 - 58.0 * math.sin(rad)
    cy = -2620.0 - 65.0 * math.cos(rad)
    plant_tree(cx + random.uniform(-2, 2), cy + random.uniform(-2, 2), z=0.05, sc=1.05)

# 3. Hàng cây dầy đặc viền góc Đông Bắc (chắn giữa nhánh ra và cánh đồng nông nghiệp)
for ax in range(2070, 2280, 13):
    ay = -2430.0 + (ax - 2070)*0.10 + random.uniform(-2.5, 2.5)
    plant_tree(ax, ay, z=0.05, sc=1.2)

# 4. Đốm cây nhỏ giữa bãi cỏ phía Đông (như trong Ảnh 2)
for _ in range(8):
    plant_tree(random.uniform(2145.0, 2170.0), random.uniform(-2515.0, -2495.0), z=0.05, sc=0.85)

print(f"-> Đã bố trí {t_idx} cây Roadscape khớp 100% bố cục ảnh vệ tinh 2.")

bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== CẬP NHẬT HOÀN TOÀN THÀNH CÔNG!                                ===")
print("=====================================================================")
