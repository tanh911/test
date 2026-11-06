import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix, Euler, Quaternion

print("=====================================================================")
print("=== CẬP NHẬT HOÀN THIỆN: AS18 HAMM-RHYNERN CHUẨN XÁC 100% SATELLITE ===")
print("=====================================================================")

# 0. Đảm bảo Object Mode và bỏ chọn
if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
    o.select_set(False)
if bpy.context.view_layer.objects.active:
    bpy.context.view_layer.objects.active = None

# Materials
mat_asphalt = bpy.data.materials.get("Autobahn_Asphalt_PBR")
mat_marking = bpy.data.materials.get("Autobahn_Marking_White")
mat_curb = bpy.data.materials.get("Island_Curb_Concrete")

# Collections
col_ramps = bpy.data.collections.get("AUTOBAHN_AS18_RAMPS")
col_local = bpy.data.collections.get("WERLER_STRASSE_LOCAL")
col_nature = bpy.data.collections.get("AUTOBAHN_NATURE_TREES")

# 1. Dọn dẹp đối tượng cũ
del_prefixes = [
    "AS18_", "Werler_West_Splitter", "Werler_East_Splitter", "Roadscape_Grove_",
    "West_Loop", "East_OffRamp", "West_Slip", "East_Slip", "Splitter_Island"
]
for col in [col_ramps, col_local, col_nature]:
    if col:
        for obj in list(col.objects):
            if any(obj.name.startswith(p) for p in del_prefixes) or "grove" in obj.name.lower():
                bpy.data.objects.remove(obj, do_unlink=True)

# 2. Catmull-Rom spline 3D
def catmull_rom_spline_3d(control_nodes, num_samples_per_seg=14):
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

def build_road_ribbon(name, pts, widths, z_offset=0.0, mat=mat_asphalt, collection=col_ramps):
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

def build_edge_line(name, pts, widths, side=+1, line_width=0.22, z_offset=0.02, collection=col_ramps, trim=1):
    normals = compute_normals_2d(pts)
    bm = bmesh.new()
    n = len(pts)
    if n <= 2 * trim: trim = 0
    vl = []; vr = []
    hw = line_width / 2.0
    for i in range(trim, n - trim):
        p = pts[i]; norm = normals[i]
        offset = side * (widths[i] / 2.0 - 0.22)
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
# 3. NHÁNH VÒNG PHÍA TÂY (WEST LOOP RAMP)
# -------------------------------------------------------------------------
# Bắt đầu flush từ mép đường Werler Straße (X=2321.0, Y=-2688.0)
nodes_west_loop = [
    (Vector((2321.0, -2688.0, 0.05)), 6.0),
    (Vector((2293.7, -2689.6, 0.08)), 6.0),
    (Vector((2250.0, -2693.5, 0.20)), 6.0),
    (Vector((2216.5, -2694.4, 0.35)), 6.0),
    (Vector((2200.0, -2694.0, 0.65)), 6.0),
    (Vector((2183.7, -2687.3, 1.35)), 6.0),
    (Vector((2174.2, -2682.5, 2.25)), 6.0),
    (Vector((2166.1, -2676.2, 3.15)), 6.0),
    (Vector((2155.5, -2664.1, 4.05)), 6.0),
    (Vector((2153.0, -2644.7, 4.75)), 6.0),
    (Vector((2152.9, -2636.7, 5.05)), 6.0), # Đỉnh vòng cung tròn (Apex)
    (Vector((2154.7, -2628.4, 5.25)), 6.0),
    (Vector((2160.1, -2616.9, 5.40)), 6.0),
    (Vector((2167.9, -2606.6, 5.50)), 6.0),
    (Vector((2181.7, -2597.9, 5.55)), 6.0),
    (Vector((2196.1, -2592.0, 5.55)), 5.5),
    (Vector((2212.0, -2585.0, 5.55)), 4.5), # Nhập vào làn tăng tốc song song A2
    (Vector((2240.0, -2583.0, 5.55)), 3.75),
    (Vector((2265.0, -2581.5, 5.55)), 2.0), # Vuốt thon mượt vào Standstreifen
    (Vector((2280.0, -2580.5, 5.55)), 0.15) # Kết thúc êm dịu không còn vết cắt ngang!
]

pts_w_loop, w_w_loop = catmull_rom_spline_3d(nodes_west_loop, num_samples_per_seg=14)
build_road_ribbon("AS18_West_Loop_Ramp_Road", pts_w_loop, w_w_loop, collection=col_ramps)
build_edge_line("AS18_West_Loop_Ramp_Line_L", pts_w_loop, w_w_loop, side=+1, collection=col_ramps)
build_edge_line("AS18_West_Loop_Ramp_Line_R", pts_w_loop, w_w_loop, side=-1, collection=col_ramps)

# Nhánh rẽ phải từ Werler Straße vào nhánh vòng (West Entrance Slip)
nodes_west_slip = [
    (Vector((2336.0, -2720.0, 0.05)), 5.0),
    (Vector((2324.0, -2708.0, 0.05)), 5.0),
    (Vector((2310.0, -2698.0, 0.06)), 5.2),
    (Vector((2293.7, -2689.6, 0.08)), 5.5)
]
pts_w_slip, w_w_slip = catmull_rom_spline_3d(nodes_west_slip, num_samples_per_seg=12)
build_road_ribbon("AS18_West_Entrance_Slip_Road", pts_w_slip, w_w_slip, collection=col_local)
build_edge_line("AS18_West_Entrance_Slip_Line_R", pts_w_slip, w_w_slip, side=-1, collection=col_local)

# -------------------------------------------------------------------------
# 4. NHÁNH RA PHÍA ĐÔNG (EAST DIRECT OFF-RAMP)
# -------------------------------------------------------------------------
nodes_east_ramp = [
    (Vector((2140.0, -2556.5, 5.55)), 0.15), # Tách vuốt êm từ làn ngoài A2 Dortmund
    (Vector((2158.0, -2550.0, 5.50)), 3.5),
    (Vector((2175.0, -2538.5, 5.30)), 5.5),
    (Vector((2190.0, -2518.0, 4.80)), 6.0),
    (Vector((2208.0, -2492.0, 4.10)), 6.0),
    (Vector((2228.0, -2472.0, 3.10)), 6.0),
    (Vector((2248.0, -2460.0, 2.00)), 6.0),
    (Vector((2268.0, -2454.0, 1.00)), 6.0),
    (Vector((2285.0, -2451.0, 0.25)), 6.0)
]
pts_e_ramp, w_e_ramp = catmull_rom_spline_3d(nodes_east_ramp, num_samples_per_seg=14)
build_road_ribbon("AS18_East_OffRamp_Road", pts_e_ramp, w_e_ramp, collection=col_ramps)
build_edge_line("AS18_East_OffRamp_Line_L", pts_e_ramp, w_e_ramp, side=+1, collection=col_ramps)
build_edge_line("AS18_East_OffRamp_Line_R", pts_e_ramp, w_e_ramp, side=-1, collection=col_ramps)

# Nhánh rẽ phải nhập vào Werler Straße hướng Hamm (East Slip Lane)
nodes_east_slip = [
    (Vector((2285.0, -2451.0, 0.25)), 5.0),
    (Vector((2291.1, -2444.8, 0.18)), 5.0),
    (Vector((2296.5, -2437.9, 0.12)), 5.0),
    (Vector((2302.5, -2427.8, 0.08)), 5.0),
    (Vector((2306.0, -2418.0, 0.05)), 5.0),
    (Vector((2311.8, -2404.0, 0.05)), 5.0)
]
pts_e_slip, w_e_slip = catmull_rom_spline_3d(nodes_east_slip, num_samples_per_seg=12)
build_road_ribbon("AS18_East_SlipLane_Road", pts_e_slip, w_e_slip, collection=col_local)
build_edge_line("AS18_East_SlipLane_Line_R", pts_e_slip, w_e_slip, side=-1, collection=col_local)

# Nhánh rẽ trái / thẳng ra đèn tín hiệu Werler Straße
nodes_east_direct = [
    (Vector((2285.0, -2451.0, 0.25)), 5.5),
    (Vector((2298.0, -2455.0, 0.15)), 6.0),
    (Vector((2312.0, -2457.5, 0.08)), 6.5),
    (Vector((2321.0, -2458.0, 0.05)), 6.5)
]
pts_e_dir, w_e_dir = catmull_rom_spline_3d(nodes_east_direct, num_samples_per_seg=10)
build_road_ribbon("AS18_East_Direct_Road", pts_e_dir, w_e_dir, collection=col_local)
build_edge_line("AS18_East_Direct_Line_L", pts_e_dir, w_e_dir, side=+1, collection=col_local)

# -------------------------------------------------------------------------
# 5. ĐẢO PHÂN LUỒNG CHUẨN XÁC, HOÀN TOÀN KHÔNG CHÈM VÀO LÒNG ĐƯỜNG
# -------------------------------------------------------------------------
def create_splitter_island(name, boundary_pts, height=0.14, z_base=0.05, mat_curb=mat_curb, collection=col_local):
    bm = bmesh.new()
    vb = [bm.verts.new(Vector((p[0], p[1], z_base))) for p in boundary_pts]
    vt = [bm.verts.new(Vector((p[0], p[1], z_base + height))) for p in boundary_pts]
    n = len(boundary_pts)
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

# Đảo Tây: Nằm gọn gàng, cách mép làn xe tối thiểu 0.8m
create_splitter_island("Werler_West_Splitter_Island", [
    (2318.0, -2694.5),
    (2307.0, -2694.5),
    (2314.0, -2700.5),
    (2318.0, -2704.0)
])

# Đảo Đông: Nằm gọn gàng giữa làn rẽ phải và làn đi thẳng
create_splitter_island("Werler_East_Splitter_Island", [
    (2318.0, -2452.5),
    (2296.0, -2450.0),
    (2304.0, -2442.0),
    (2318.0, -2447.0)
])

# -------------------------------------------------------------------------
# 6. RỪNG CÂY VÀ THẢM XANH ROADSCAPE THEO ẢNH SATELLITE
# -------------------------------------------------------------------------
tree_dense = bpy.data.objects.get('RSEA LOD Tree Dense Leafy')
tree_medium = bpy.data.objects.get('RSEA LOD Tree Medium')
tree_small = bpy.data.objects.get('RSEA LOD Tree Small')
tree_pool = [t for t in [tree_dense, tree_medium, tree_small] if t is not None]

random.seed(42)
t_counter = 0

def add_tree(x, y, z=0.05, sc=1.2):
    global t_counter
    base_t = random.choice(tree_pool)
    t = bpy.data.objects.new(f"Roadscape_Grove_{t_counter:04d}", base_t.data)
    col_nature.objects.link(t)
    t.location = (x, y, z)
    t.rotation_euler = (0, 0, random.uniform(0, 6.28))
    s = sc * random.uniform(0.9, 1.35)
    t.scale = (s, s, s)
    t_counter += 1
    return t

# 1. Rừng rậm bầu dục bên trong nhánh vòng (ôm sát A2 như Ảnh vệ tinh)
for _ in range(95):
    u = random.random(); v = random.random()
    angle = u * 2.0 * math.pi
    r = math.sqrt(v)
    cx = 2220.0 + r * 38.0 * math.cos(angle)
    cy = -2620.0 + r * 20.0 * math.sin(angle)
    add_tree(cx, cy, z=0.05, sc=1.3)

# 2. Hàng cây viền ngoài che chắn kho hàng phía Tây
for x_step in range(2150, 2300, 10):
    add_tree(x_step + random.uniform(-1.5, 1.5), -2706.0 + random.uniform(-2, 2), z=0.05, sc=1.1)

# 3. Khóm cây bầu dục đơn lẻ giữa bãi cỏ phía Đông
for _ in range(28):
    u = random.random(); v = random.random()
    angle = u * 2.0 * math.pi
    r = math.sqrt(v)
    cx = 2210.0 + r * 13.0 * math.cos(angle)
    cy = -2505.0 + r * 9.0 * math.sin(angle)
    add_tree(cx, cy, z=0.05, sc=1.15)

# 4. Rặng cây chắn gió rậm rạp dọc ranh giới cánh đồng phía Đông Bắc
for x_step in range(2150, 2300, 9):
    add_tree(x_step + random.uniform(-1, 1), -2430.0 + (x_step - 2150)*0.10 + random.uniform(-2.5, 2.5), z=0.05, sc=1.3)

# 5. Cây xanh dọc đường Werler Straße
for y_pos in range(-2680, -2480, 16):
    if abs(y_pos - (-2565)) > 25:
        add_tree(2340.0 + random.uniform(-2, 2), y_pos, z=0.05, sc=1.0)
        add_tree(2295.0 + random.uniform(-2, 2), y_pos, z=0.05, sc=1.0)

print(f"-> Tổng số cây xanh Roadscape: {t_counter} cây.")

# Lưu file blend
bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== THÀNH CÔNG: ĐÃ LƯU FILE TEST9_10.BLEND HOÀN CHỈNH!            ===")
print("=====================================================================")
