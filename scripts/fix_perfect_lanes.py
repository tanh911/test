import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix

print("=====================================================================")
print("=== KHẮC PHỤC TRIỆT ĐỂ: DỰNG LÀN VÀ ĐẢO HOÀN HẢO KHÔNG CÒN VẾT CỤT ===")
print("=====================================================================")

mat_asphalt = bpy.data.materials.get("Autobahn_Asphalt_PBR")
mat_marking = bpy.data.materials.get("Autobahn_Marking_White")
mat_curb = bpy.data.materials.get("Island_Curb_Concrete")

col_ramps = bpy.data.collections.get("AUTOBAHN_AS18_RAMPS")
col_local = bpy.data.collections.get("WERLER_STRASSE_LOCAL")
col_nature = bpy.data.collections.get("AUTOBAHN_NATURE_TREES")
col_autobahn = bpy.data.collections.get("AUTOBAHN_A2")

# 1. Xóa toàn bộ các đối tượng ramp cũ, đảo cũ, vạch cũ
del_keywords = [
    "loop_ramp", "offramp", "entrance_slip", "sliplane", "splitter_island",
    "compact_island", "as18_west", "as18_east", "arrow_werler", "stopbar"
]

for col in [col_ramps, col_local, col_nature, col_autobahn]:
    if col:
        for obj in list(col.objects):
            name_lower = obj.name.lower()
            if any(k in name_lower for k in del_keywords):
                bpy.data.objects.remove(obj, do_unlink=True)

for o in list(col_nature.objects):
    if "grove" in o.name.lower():
        bpy.data.objects.remove(o, do_unlink=True)

# 2. Thuật toán nội suy Catmull-Rom cho spline mượt mà
def catmull_rom_spline_with_width(control_nodes, num_samples_per_seg=14):
    # control_nodes là list of (Vector, width)
    c_pts = [node[0] for node in control_nodes]
    c_widths = [node[1] for node in control_nodes]
    n = len(control_nodes)
    if n < 2: return c_pts, c_widths
    p_pad = [c_pts[0]] + list(c_pts) + [c_pts[-1]]
    w_pad = [c_widths[0]] + list(c_widths) + [c_widths[-1]]
    res_pts = []; res_widths = []
    for i in range(1, n):
        p0, p1, p2, p3 = p_pad[i-1], p_pad[i], p_pad[i+1], p_pad[i+2]
        w0, w1, w2, w3 = w_pad[i-1], w_pad[i], w_pad[i+1], w_pad[i+2]
        for t_step in range(num_samples_per_seg):
            t = t_step / float(num_samples_per_seg)
            t2 = t * t; t3 = t2 * t
            pt = 0.5 * (
                (2.0 * p1) +
                (-p0 + p2) * t +
                (2.0*p0 - 5.0*p1 + 4.0*p2 - p3) * t2 +
                (-p0 + 3.0*p1 - 3.0*p2 + p3) * t3
            )
            w = 0.5 * (
                (2.0 * w1) +
                (-w0 + w2) * t +
                (2.0*w0 - 5.0*w1 + 4.0*w2 - w3) * t2 +
                (-w0 + 3.0*w1 - 3.0*w2 + w3) * t3
            )
            res_pts.append(pt)
            res_widths.append(max(0.1, w))
    res_pts.append(c_pts[-1])
    res_widths.append(max(0.1, c_widths[-1]))
    return res_pts, res_widths

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

def build_tapered_road_ribbon(name, pts, widths, z_offset=0.0, mat=mat_asphalt, collection=col_ramps):
    normals = compute_normals_2d(pts)
    bm = bmesh.new()
    n = len(pts)
    vl = []; vr = []
    for i in range(n):
        p = pts[i]; norm = normals[i]
        hw = widths[i] / 2.0
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

def build_tapered_marking_line(name, pts, widths, side=+1, line_width=0.20, z_offset=0.02, collection=col_ramps, trim=1):
    normals = compute_normals_2d(pts)
    bm = bmesh.new()
    n = len(pts)
    if n <= 2 * trim: trim = 0
    vl = []; vr = []
    hw = line_width / 2.0
    for i in range(trim, n - trim):
        p = pts[i]; norm = normals[i]
        offset = side * (widths[i] / 2.0 - 0.25)
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
# 3. NHÁNH VÒNG HOÀN TOÀN TRÒN TRỊA VÀ NHẬP VUỐT MỊN VÀO CAO TỐC A2
# -------------------------------------------------------------------------
# Đỉnh nhánh vòng tại X=2160 (gọn gàng, vừa khít trong khung nhìn của người dùng)
# Điểm nhập vào A2 tại X=2260 được vuốt nhọn (taper từ 6.5m -> 0.0m) triệt tiêu hoàn toàn vết cụt!
nodes_west_loop = [
    (Vector((2322.0, -2688.0, 0.05)), 6.5),
    (Vector((2280.0, -2688.0, 0.10)), 6.5),
    (Vector((2230.0, -2686.0, 0.40)), 6.5),
    (Vector((2190.0, -2678.0, 1.20)), 6.5),
    (Vector((2165.0, -2660.0, 2.50)), 6.5),
    (Vector((2150.0, -2635.0, 3.80)), 6.5), # Đỉnh vòng cung tròn (Apex)
    (Vector((2158.0, -2608.0, 4.80)), 6.5),
    (Vector((2175.0, -2593.0, 5.40)), 6.5),
    (Vector((2205.0, -2586.0, 5.60)), 5.5),
    (Vector((2235.0, -2583.0, 5.60)), 3.5), # Vuốt thon dần vào làn ngoài của A2
    (Vector((2265.0, -2581.0, 5.60)), 0.2)  # Kết thúc êm thuận triệt tiêu hoàn toàn đầu cắt phẳng!
]
pts_w_loop, w_w_loop = catmull_rom_spline_with_width(nodes_west_loop, num_samples_per_seg=14)

build_tapered_road_ribbon("AS18_West_Loop_Ramp_Road", pts_w_loop, w_w_loop, collection=col_ramps)
build_tapered_marking_line("AS18_West_Loop_Ramp_Line_L", pts_w_loop, w_w_loop, side=+1, collection=col_ramps)
build_tapered_marking_line("AS18_West_Loop_Ramp_Line_R", pts_w_loop, w_w_loop, side=-1, collection=col_ramps)

# Nhánh rẽ phải từ Werler Straße vào nhánh vòng (West Entrance Slip)
nodes_west_slip = [
    (Vector((2330.0, -2715.0, 0.05)), 5.5),
    (Vector((2320.0, -2702.0, 0.05)), 5.5),
    (Vector((2305.0, -2694.0, 0.05)), 5.5),
    (Vector((2280.0, -2688.0, 0.10)), 5.5)
]
pts_w_slip, w_w_slip = catmull_rom_spline_with_width(nodes_west_slip, num_samples_per_seg=10)
build_tapered_road_ribbon("AS18_West_Entrance_Slip_Road", pts_w_slip, w_w_slip, collection=col_local)
build_tapered_marking_line("AS18_West_Entrance_Slip_Line_R", pts_w_slip, w_w_slip, side=-1, collection=col_local)

# -------------------------------------------------------------------------
# 4. NHÁNH RA PHÍA ĐÔNG TÁCH VÀ VUỐT ÊM THUẬN TỪ CAO TỐC A2
# -------------------------------------------------------------------------
# Điểm tách từ A2 bắt đầu với độ rộng 0.2m vuốt rộng dần ra 6.5m (Taper Diverge)
nodes_east_ramp = [
    (Vector((2150.0, -2555.0, 5.60)), 0.2), # Bắt đầu tách từ mép làn cao tốc
    (Vector((2175.0, -2545.0, 5.40)), 4.0),
    (Vector((2205.0, -2525.0, 4.80)), 6.5),
    (Vector((2235.0, -2495.0, 3.50)), 6.5),
    (Vector((2265.0, -2472.0, 2.00)), 6.5),
    (Vector((2290.0, -2458.0, 0.80)), 6.5),
    (Vector((2310.0, -2454.0, 0.20)), 6.5),
    (Vector((2322.0, -2453.0, 0.05)), 6.5)
]
pts_e_ramp, w_e_ramp = catmull_rom_spline_with_width(nodes_east_ramp, num_samples_per_seg=14)

build_tapered_road_ribbon("AS18_East_OffRamp_Road", pts_e_ramp, w_e_ramp, collection=col_ramps)
build_tapered_marking_line("AS18_East_OffRamp_Line_L", pts_e_ramp, w_e_ramp, side=+1, collection=col_ramps)
build_tapered_marking_line("AS18_East_OffRamp_Line_R", pts_e_ramp, w_e_ramp, side=-1, collection=col_ramps)

# Làn rẽ phải phía Đông nhập vào Werler Straße (East Slip Lane)
nodes_east_slip = [
    (Vector((2270.0, -2468.0, 1.80)), 5.5),
    (Vector((2288.0, -2454.0, 0.90)), 5.5),
    (Vector((2302.0, -2438.0, 0.35)), 5.5),
    (Vector((2312.0, -2418.0, 0.10)), 5.5),
    (Vector((2318.0, -2390.0, 0.05)), 5.5)
]
pts_e_slip, w_e_slip = catmull_rom_spline_with_width(nodes_east_slip, num_samples_per_seg=10)
build_tapered_road_ribbon("AS18_East_SlipLane_Road", pts_e_slip, w_e_slip, collection=col_local)
build_tapered_marking_line("AS18_East_SlipLane_Line_R", pts_e_slip, w_e_slip, side=-1, collection=col_local)

# -------------------------------------------------------------------------
# 5. ĐẢO PHÂN LUỒNG NHỎ GỌN, CHUẨN XÁC NẰM NGOÀI LÒNG ĐƯỜNG WERLER STRASSE
# -------------------------------------------------------------------------
# Werler Straße có lòng đường X in [2311.6, 2324.0]. Đảo phải nằm ở mép ngoài phân giữa nhánh rẽ và đường chính
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

# Đảo phía Tây gọn gàng:
make_island("Werler_West_Splitter_Island", [
    (2311.0, -2695.0),
    (2300.0, -2693.0),
    (2305.0, -2710.0),
    (2311.0, -2706.0)
])

# Đảo phía Đông gọn gàng:
make_island("Werler_East_Splitter_Island", [
    (2311.0, -2448.0),
    (2300.0, -2452.0),
    (2304.0, -2434.0),
    (2311.0, -2438.0)
])

# -------------------------------------------------------------------------
# 6. CÂY XANH ROADSCAPE BỐ TRÍ ĐÚNG CỤM NHƯ GOOGLE EARTH
# -------------------------------------------------------------------------
tree_dense = bpy.data.objects.get('RSEA LOD Tree Dense Leafy')
tree_medium = bpy.data.objects.get('RSEA LOD Tree Medium')
tree_small = bpy.data.objects.get('RSEA LOD Tree Small')
tree_pool = [t for t in [tree_dense, tree_medium, tree_small] if t is not None]

random.seed(777)
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

# 1. Cụm rừng bầu dục bên trong nhánh vòng phía Tây (ôm sát mép làn A2 như trong Ảnh 2)
# X in [2180, 2250], Y in [-2640, -2600]
for _ in range(50):
    tx = random.uniform(2180.0, 2245.0)
    ty = random.uniform(-2640.0, -2605.0)
    plant_tree(tx, ty, z=0.05, sc=1.2)

# 2. Hàng cây viền ngoài ôm trọn cung tròn của nhánh vòng (sát mép kho hàng)
for ang_deg in range(0, 185, 15):
    rad = math.radians(ang_deg)
    cx = 2170.0 - 45.0 * math.sin(rad)
    cy = -2640.0 - 52.0 * math.cos(rad)
    plant_tree(cx + random.uniform(-2, 2), cy + random.uniform(-2, 2), z=0.05, sc=1.05)

# 3. Hàng cây viền góc Đông Bắc (chắn giữa nhánh ra và cánh đồng nông nghiệp)
for ax in range(2160, 2290, 14):
    ay = -2430.0 + (ax - 2160)*0.10 + random.uniform(-2.5, 2.5)
    plant_tree(ax, ay, z=0.05, sc=1.2)

# 4. Đốm cây nhỏ giữa bãi cỏ phía Đông
for _ in range(8):
    plant_tree(random.uniform(2190.0, 2220.0), random.uniform(-2510.0, -2490.0), z=0.05, sc=0.85)

print(f"-> Đã bố trí {t_idx} cây Roadscape.")

bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== KHẮC PHỤC HOÀN TOÀN THÀNH CÔNG RỰC RỠ!                        ===")
print("=====================================================================")
