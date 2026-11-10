import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix

print("=====================================================================")
print("=== TÁI LẬP HỆ THỐNG LÀN ĐƯỜNG CHUẨN XÁC 100% THEO GOOGLE EARTH 3D ===")
print("=====================================================================")

# -------------------------------------------------------------------------
# 1. VẬT LIỆU PBR
# -------------------------------------------------------------------------
mat_asphalt = bpy.data.materials.get("Autobahn_Asphalt_PBR")
mat_marking = bpy.data.materials.get("Autobahn_Marking_White")
mat_curb = bpy.data.materials.get("Island_Curb_Concrete")
mat_grass = bpy.data.materials.get("Autobahn_Median_Grass") or bpy.data.materials.get("Field_Crops_LushGreen")

# -------------------------------------------------------------------------
# 2. DỌN DẸP TOÀN BỘ CÁC LÀN CŨ BỊ LỖI / ĐỨT ĐOẠN / TAM GIÁC XÁM TO
# -------------------------------------------------------------------------
col_ramps = bpy.data.collections.get("AUTOBAHN_AS18_RAMPS")
col_local = bpy.data.collections.get("WERLER_STRASSE_LOCAL")
col_nature = bpy.data.collections.get("AUTOBAHN_NATURE_TREES")
col_autobahn = bpy.data.collections.get("AUTOBAHN_A2")

delete_patterns = [
    "AS18_South_OnRamp", "AS18_South_OffRamp", "AS18_South_Connector",
    "AS18_North_OnRamp", "AS18_North_OffRamp", "AS18_North_Connector",
    "Werler_SlipLane", "Werler_Traffic_Island", "Werler_Exit_Throat",
    "Werler_North_SlipLane", "Werler_North_Traffic_Island", "Werler_North_Exit_Throat",
    "Crop_Field_SouthEast", "Crop_Field_NorthWest",
    "Arrow_North", "Arrow_Straight", "Arrow_Right", "Haltelinie",
    "Roadscape_Grove_", "Roadscape_Pine_"
]

for col in [col_ramps, col_local, col_nature, col_autobahn]:
    if col:
        for obj in list(col.objects):
            for pat in delete_patterns:
                if pat.lower() in obj.name.lower():
                    bpy.data.objects.remove(obj, do_unlink=True)
                    break

# -------------------------------------------------------------------------
# 3. HÀM NỘI SUY SPLINE MỊN (Catmull-Rom / Bezier Resampling)
# -------------------------------------------------------------------------
def catmull_rom_spline(control_pts, num_samples_per_seg=10):
    pts = []
    n = len(control_pts)
    if n < 2: return control_pts
    # Pad ends
    p_pad = [control_pts[0]] + list(control_pts) + [control_pts[-1]]
    for i in range(1, n):
        p0, p1, p2, p3 = p_pad[i-1], p_pad[i], p_pad[i+1], p_pad[i+2]
        for t_step in range(num_samples_per_seg):
            t = t_step / float(num_samples_per_seg)
            t2 = t * t; t3 = t2 * t
            # Catmull-Rom formula
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

def build_continuous_road_ribbon(name, pts, width, z_offset=0.0, mat=mat_asphalt, collection=col_ramps):
    normals = compute_normals_2d(pts)
    bm = bmesh.new()
    n = len(pts)
    hw = width / 2.0
    vl_list = []; vr_list = []
    for i in range(n):
        p = pts[i]; norm = normals[i]
        zv = p.z + z_offset
        vl = bm.verts.new(Vector((p.x + norm.x * hw, p.y + norm.y * hw, zv)))
        vr = bm.verts.new(Vector((p.x - norm.x * hw, p.y - norm.y * hw, zv)))
        vl_list.append(vl); vr_list.append(vr)
    for i in range(n - 1):
        bm.faces.new((vl_list[i], vr_list[i], vr_list[i+1], vl_list[i+1]))
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat); m.update()
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    return obj

def build_marking_line_ribbon(name, pts, offset, width, z_offset=0.02, collection=col_ramps, trim=1):
    normals = compute_normals_2d(pts)
    bm = bmesh.new()
    n = len(pts)
    if n <= 2 * trim: trim = 0
    hw = width / 2.0
    vl_list = []; vr_list = []
    for i in range(trim, n - trim):
        p = pts[i]; norm = normals[i]
        zv = p.z + z_offset
        cx = p.x + norm.x * offset; cy = p.y + norm.y * offset
        vl = bm.verts.new(Vector((cx + norm.x * hw, cy + norm.y * hw, zv)))
        vr = bm.verts.new(Vector((cx - norm.x * hw, cy - norm.y * hw, zv)))
        vl_list.append(vl); vr_list.append(vr)
    for i in range(len(vl_list) - 1):
        bm.faces.new((vl_list[i], vr_list[i], vr_list[i+1], vl_list[i+1]))
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat_marking); m.update()
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    return obj

# -------------------------------------------------------------------------
# 4. TÁI LẬP NHÁNH CONG VÒNG TRÒN PHÍA TÂY (WEST PARCLO LOOP RAMP)
# -------------------------------------------------------------------------
# Nhánh này bắt đầu từ đường Werler Straße (X=2320, Y=-2688) ở cao độ Z=0.05
# Chạy dọc mép nhà kho đến X=2040, sau đó uốn vòng 180 độ tròn trịa bán kính R~45m
# Lên cao độ Z=5.60m nhập êm vào chiều xe chạy về phía Tây của cao tốc A2 (X=1930)
cpts_west_loop = [
    Vector((2322.0, -2688.0, 0.05)),
    Vector((2280.0, -2685.0, 0.15)),
    Vector((2220.0, -2680.0, 0.40)),
    Vector((2150.0, -2673.0, 0.85)),
    Vector((2080.0, -2664.0, 1.80)),
    Vector((2035.0, -2650.0, 2.90)),
    Vector((2005.0, -2628.0, 3.90)),
    Vector((1995.0, -2598.0, 4.70)),
    Vector((2010.0, -2572.0, 5.30)),
    Vector((2045.0, -2558.0, 5.60)),
    Vector((2100.0, -2553.0, 5.60)),
    Vector((2180.0, -2550.0, 5.60)),
    Vector((2260.0, -2548.0, 5.60))
]
pts_west_loop = catmull_rom_spline(cpts_west_loop, num_samples_per_seg=12)

# Xây dựng mặt đường nhánh vòng (rộng 6.5m)
build_continuous_road_ribbon("AS18_West_Loop_Ramp_Road", pts_west_loop, width=6.5, collection=col_ramps)
build_marking_line_ribbon("AS18_West_Loop_Ramp_Line_L", pts_west_loop, offset=3.0, width=0.20, collection=col_ramps)
build_marking_line_ribbon("AS18_West_Loop_Ramp_Line_R", pts_west_loop, offset=-3.0, width=0.20, collection=col_ramps)

# Nhánh nối thẳng thoát từ cao tốc A2 phía Tây xuống Werler Straße:
# Tách khỏi A2 tại X=1930, Z=5.6m, lượn xuống Z=0.05m nhập vào nút giao
cpts_west_direct = [
    Vector((1930.0, -2588.0, 5.60)),
    Vector((2010.0, -2592.0, 5.50)),
    Vector((2070.0, -2605.0, 4.20)),
    Vector((2120.0, -2625.0, 2.80)),
    Vector((2155.0, -2655.0, 1.40)),
    Vector((2180.0, -2678.0, 0.50)),
    Vector((2220.0, -2688.0, 0.15)),
    Vector((2275.0, -2689.0, 0.05)),
    Vector((2320.0, -2688.0, 0.05))
]
pts_west_direct = catmull_rom_spline(cpts_west_direct, num_samples_per_seg=12)
build_continuous_road_ribbon("AS18_West_Direct_Exit_Road", pts_west_direct, width=6.0, collection=col_ramps)
build_marking_line_ribbon("AS18_West_Direct_Exit_Line_L", pts_west_direct, offset=2.75, width=0.20, collection=col_ramps)
build_marking_line_ribbon("AS18_West_Direct_Exit_Line_R", pts_west_direct, offset=-2.75, width=0.20, collection=col_ramps)

# -------------------------------------------------------------------------
# 5. TÁI LẬP NHÁNH LƯỢN NỐI PHÍA ĐÔNG (EAST DIRECT OFF-RAMP & ON-RAMP)
# -------------------------------------------------------------------------
# Nhánh ra từ A2 chiều về Đông: tách từ X=2050, Z=5.60m, lượn qua bãi cỏ xuống Werler Straße (X=2320, Y=-2455)
cpts_east_ramp = [
    Vector((2060.0, -2562.0, 5.60)),
    Vector((2100.0, -2548.0, 5.20)),
    Vector((2140.0, -2522.0, 4.10)),
    Vector((2180.0, -2490.0, 2.80)),
    Vector((2220.0, -2468.0, 1.50)),
    Vector((2260.0, -2458.0, 0.60)),
    Vector((2295.0, -2456.0, 0.15)),
    Vector((2322.0, -2455.0, 0.05))
]
pts_east_ramp = catmull_rom_spline(cpts_east_ramp, num_samples_per_seg=12)

build_continuous_road_ribbon("AS18_East_OffRamp_Road", pts_east_ramp, width=6.5, collection=col_ramps)
build_marking_line_ribbon("AS18_East_OffRamp_Line_L", pts_east_ramp, offset=3.0, width=0.20, collection=col_ramps)
build_marking_line_ribbon("AS18_East_OffRamp_Line_R", pts_east_ramp, offset=-3.0, width=0.20, collection=col_ramps)

# Làn rẽ phải cong êm thuận tại nút giao phía Đông (East Slip Lane)
cpts_east_slip = [
    Vector((2270.0, -2458.0, 0.05)),
    Vector((2285.0, -2452.0, 0.05)),
    Vector((2298.0, -2440.0, 0.05)),
    Vector((2306.0, -2425.0, 0.05)),
    Vector((2310.0, -2405.0, 0.05))
]
pts_east_slip = catmull_rom_spline(cpts_east_slip, num_samples_per_seg=10)
build_continuous_road_ribbon("Werler_East_SlipLane_Road", pts_east_slip, width=5.5, collection=col_local)
build_marking_line_ribbon("Werler_East_SlipLane_Line_L", pts_east_slip, offset=2.5, width=0.20, collection=col_local)
build_marking_line_ribbon("Werler_East_SlipLane_Line_R", pts_east_slip, offset=-2.5, width=0.20, collection=col_local)

# -------------------------------------------------------------------------
# 6. ĐẢO PHÂN LUỒNG BÊ TÔNG GỌN GÀNG, CHUẨN XÁC (COMPACT SPLITTER ISLANDS)
# -------------------------------------------------------------------------
# Thay thế 2 khối tam giác xám khổng lồ bằng đảo giao thông tiêu chuẩn (dài ~18m, rộng ~3.5m, gờ nổi 14cm)

def build_compact_island(name, base_pts, collection=col_local):
    bm = bmesh.new()
    vb = [bm.verts.new(Vector((p.x, p.y, 0.05))) for p in base_pts]
    vt = [bm.verts.new(Vector((p.x, p.y, 0.19))) for p in base_pts]
    n = len(base_pts)
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

# Đảo phía Tây (giữa nhánh vòng và Werler Straße)
island_west_pts = [
    Vector((2318.0, -2695.0)),
    Vector((2302.0, -2693.0)),
    Vector((2310.0, -2715.0)),
    Vector((2317.0, -2710.0))
]
build_compact_island("Werler_West_Compact_Island", island_west_pts)

# Đảo phía Đông (giữa nhánh ra và Werler Straße)
island_east_pts = [
    Vector((2315.0, -2448.0)),
    Vector((2298.0, -2452.0)),
    Vector((2305.0, -2430.0)),
    Vector((2312.0, -2435.0))
]
build_compact_island("Werler_East_Compact_Island", island_east_pts)

# -------------------------------------------------------------------------
# 7. KẺ VẠCH SƠN SPERRFLÄCHE (CHEVRON GORE) & MŨI TÊN CHỈ HƯỚNG
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

# Mũi tên trên đường Werler Straße
make_arrow("Arrow_Werler_W1", pts_straight, Vector((2323.0, -2705.0, 0.06)), math.radians(0.0))
make_arrow("Arrow_Werler_W2", pts_turn, Vector((2315.0, -2700.0, 0.06)), math.radians(35.0))

make_arrow("Arrow_Werler_E1", pts_straight, Vector((2318.0, -2435.0, 0.06)), math.radians(180.0))
make_arrow("Arrow_Werler_E2", pts_turn, Vector((2308.0, -2430.0, 0.06)), math.radians(215.0))

# Vạch dừng xe (Stop bar)
def make_stop_bar(name, pos, scale, collection=col_local):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat_marking)
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    obj.location = pos
    obj.scale = scale
    return obj

make_stop_bar("StopBar_West", Vector((2315.0, -2692.0, 0.06)), Vector((4.0, 0.5, 1.0)))
make_stop_bar("StopBar_East", Vector((2312.0, -2454.0, 0.06)), Vector((4.0, 0.5, 1.0)))

# -------------------------------------------------------------------------
# 8. THẢM CỎ & BỐ TRÍ CÂY XANH ROADSCAPE THEO ĐÚNG CỤM NHƯ GOOGLE EARTH
# -------------------------------------------------------------------------
# Xóa các cụm cây rải rác lộn xộn cũ
for o in list(col_nature.objects):
    if "roadscape_grove" in o.name.lower() or "roadscape_pine" in o.name.lower():
        bpy.data.objects.remove(o, do_unlink=True)

tree_dense = bpy.data.objects.get('RSEA LOD Tree Dense Leafy')
tree_medium = bpy.data.objects.get('RSEA LOD Tree Medium')
tree_small = bpy.data.objects.get('RSEA LOD Tree Small')
tree_pool = [t for t in [tree_dense, tree_medium, tree_small] if t is not None]

random.seed(2026)
n_trees = 0

def plant_clump_tree(x, y, z=0.05, sc=1.1):
    global n_trees
    base_t = random.choice(tree_pool)
    t = bpy.data.objects.new(f"Roadscape_Grove_{n_trees:04d}", base_t.data)
    col_nature.objects.link(t)
    t.location = (x, y, z)
    t.rotation_euler = (0, 0, random.uniform(0, 6.28))
    s = sc * random.uniform(0.9, 1.25)
    t.scale = (s, s, s)
    n_trees += 1
    return t

# Cụm 1: Rừng cây hình bầu dục dày đặc bên trong nhánh vòng phía Tây (sát cao tốc A2 như trong Ảnh 2)
# X in [2100, 2220], Y in [-2640, -2590]
for _ in range(45):
    tx = random.uniform(2120.0, 2220.0)
    ty = random.uniform(-2635.0, -2595.0)
    plant_clump_tree(tx, ty, z=0.05, sc=1.2)

# Cụm 2: Hàng cây viền ngoài ôm trọn cung tròn của nhánh vòng (phía sát mép kho hàng aba Logistics)
for ang_deg in range(0, 185, 12):
    rad = math.radians(ang_deg)
    cx = 2050.0 - 55.0 * math.sin(rad)
    cy = -2620.0 - 55.0 * math.cos(rad)
    plant_clump_tree(cx + random.uniform(-2, 2), cy + random.uniform(-2, 2), z=0.05, sc=1.05)

# Cụm 3: Hàng cây dầy đặc viền góc Đông Bắc (chắn giữa nhánh ra và cánh đồng nông nghiệp trong Ảnh 2)
# X in [2050, 2250], Y in [-2450, -2410]
for ax in range(2070, 2260, 14):
    plant_clump_tree(ax + random.uniform(-2, 2), -2430.0 + (ax - 2070)*0.15 + random.uniform(-3, 3), z=0.05, sc=1.15)

print(f"-> Đã bố trí {n_trees} cây Roadscape theo đúng các cụm rừng tự nhiên trong Google Earth.")

# Lưu file blend
bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== TÁI LẬP HỆ THỐNG LÀN ĐƯỜNG THEO GOOGLE EARTH 3D THÀNH CÔNG!   ===")
print("=====================================================================")
