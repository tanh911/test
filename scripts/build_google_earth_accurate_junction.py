import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix

print("=====================================================================")
print("=== DỰNG CHUẨN XÁC NÚT GIAO THEO ẢNH VỆ TINH GOOGLE EARTH 3D V2   ===")
print("=====================================================================")

# -------------------------------------------------------------------------
# 1. VẬT LIỆU
# -------------------------------------------------------------------------
def get_or_create_mat(name, make_func):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    make_func(mat)
    return mat

def setup_crop_field(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.05, 0.16, 0.07, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.90
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

def setup_island_pavement(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.55, 0.57, 0.55, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.65
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

mat_asphalt = bpy.data.materials.get("Autobahn_Asphalt_PBR")
mat_marking = bpy.data.materials.get("Autobahn_Marking_White")
mat_concrete = bpy.data.materials.get("Bridge Deck.002") or bpy.data.materials.get("Autobahn_Bridge_Concrete")
mat_median = bpy.data.materials.get("Autobahn_Median_Grass")
mat_crop = get_or_create_mat("Field_Crops_LushGreen", setup_crop_field)
mat_island = get_or_create_mat("Island_Curb_Concrete", setup_island_pavement)

# -------------------------------------------------------------------------
# 2. DỌN DẸP COLLECTIONS VÀ MESH CŨ
# -------------------------------------------------------------------------
col_autobahn = bpy.data.collections.get("AUTOBAHN_A2")
col_ramps = bpy.data.collections.get("AUTOBAHN_AS18_RAMPS")
col_nature = bpy.data.collections.get("AUTOBAHN_NATURE_TREES")
col_local = bpy.data.collections.get("WERLER_STRASSE_LOCAL")

# Xóa các chi tiết cũ của nút giao phía Nam để dựng lại chuẩn xác
cleanup_names = [
    "AS18_South_Connector_Road", "AS18_South_Connector_Line_Center", "AS18_South_Connector_Line_L", "AS18_South_Connector_Line_R",
    "Werler_SlipLane_Right", "Werler_SlipLane_Right_Line_L", "Werler_SlipLane_Right_Line_R",
    "Werler_Traffic_Island_Splitter", "Crop_Field_SouthEast",
    "Arrow_Straight", "Arrow_Right", "Haltelinie",
    "A2_Parallel_Lane_Eastbound", "A2_Parallel_Lane_Westbound", "A2_Breitstrich_East", "A2_Breitstrich_West"
]

for name in cleanup_names:
    o = bpy.data.objects.get(name)
    if o: bpy.data.objects.remove(o, do_unlink=True)

for o in list(col_local.objects):
    if "arrow" in o.name.lower() or "slip" in o.name.lower() or "island" in o.name.lower() or "haltelinie" in o.name.lower():
        bpy.data.objects.remove(o, do_unlink=True)

# -------------------------------------------------------------------------
# 3. TIỆN ÍCH DỰNG ĐƯỜNG DỌC ĐƯỜNG CONG
# -------------------------------------------------------------------------
def resample_polyline(pts, step=3.0):
    total_len = 0.0; cum_lens = [0.0]
    for i in range(len(pts) - 1):
        total_len += (pts[i+1] - pts[i]).length
        cum_lens.append(total_len)
    num_samples = max(2, int(total_len / step))
    resampled = []
    curr_idx = 0
    for s in range(num_samples + 1):
        target_d = (s / num_samples) * total_len
        while curr_idx < len(cum_lens) - 2 and cum_lens[curr_idx + 1] < target_d:
            curr_idx += 1
        seg_len = cum_lens[curr_idx + 1] - cum_lens[curr_idx]
        t = (target_d - cum_lens[curr_idx]) / seg_len if seg_len > 0 else 0.0
        resampled.append(pts[curr_idx].lerp(pts[curr_idx + 1], t))
    return resampled, total_len

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

def build_road_ribbon(name, pts, normals, width, z_coords, mat=mat_asphalt, collection=col_local):
    bm = bmesh.new()
    n = len(pts)
    half_w = width / 2.0
    vl_list = []; vr_list = []
    for i in range(n):
        p = pts[i]; norm = normals[i]
        zv = z_coords[i]
        vl = bm.verts.new(Vector((p.x + norm.x * half_w, p.y + norm.y * half_w, zv)))
        vr = bm.verts.new(Vector((p.x - norm.x * half_w, p.y - norm.y * half_w, zv)))
        vl_list.append(vl); vr_list.append(vr)
    for i in range(n - 1):
        bm.faces.new((vl_list[i], vr_list[i], vr_list[i+1], vl_list[i+1]))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh); bm.free()
    mesh.materials.append(mat); mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj

def build_marking_line(name, pts, normals, offset, width, z_coords, collection=col_local, trim_ends=1):
    bm = bmesh.new()
    n = len(pts)
    if n <= 2 * trim_ends: trim_ends = 0
    start_i = trim_ends; end_i = n - trim_ends
    hw = width / 2.0
    vl_list = []; vr_list = []
    for i in range(start_i, end_i):
        p = pts[i]; norm = normals[i]
        zv = z_coords[i] + 0.02
        c_x = p.x + norm.x * offset; c_y = p.y + norm.y * offset
        vl = bm.verts.new(Vector((c_x + norm.x * hw, c_y + norm.y * hw, zv)))
        vr = bm.verts.new(Vector((c_x - norm.x * hw, c_y - norm.y * hw, zv)))
        vl_list.append(vl); vr_list.append(vr)
    for i in range(len(vl_list) - 1):
        bm.faces.new((vl_list[i], vr_list[i], vr_list[i+1], vl_list[i+1]))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh); bm.free()
    mesh.materials.append(mat_marking); mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj

# -------------------------------------------------------------------------
# 4. TỔ CHỨC LẠI NÚT GIAO PHÍA NAM CHUẨN XÁC THEO ẢNH 1
# -------------------------------------------------------------------------
# Tuyến đường nối nhánh Nam (AS18_South_Connector_Road):
# Đi từ nút rẽ vòng xuyến (X=2155.5, Y=-2664.1) chạy về Werler Straße.
# Khi tới gần Werler Straße (X=2280), tuyến chia làm 2 nhánh rõ ràng:
# 1) Nhánh rẽ phải lượn cong êm thuận (Sweeping right-turn slip lane) dành cho xe từ Werler Straße vào cao tốc
# 2) Nhánh vuốt miệng rộng (Flared junction mouth) dành cho xe từ cao tốc rẽ ra Werler Straße (rẽ trái/phải)

# A. Tuyến đường nối chính (Main Connector Trunk từ X=2155.5 đến X=2280)
pts_conn_trunk = [
    Vector((2155.5, -2664.1, 0.50)),
    Vector((2166.1, -2676.2, 0.45)),
    Vector((2174.1, -2682.5, 0.38)),
    Vector((2183.7, -2687.3, 0.30)),
    Vector((2194.3, -2691.8, 0.22)),
    Vector((2206.1, -2694.0, 0.15)),
    Vector((2216.5, -2694.4, 0.10)),
    Vector((2250.0, -2693.0, 0.06)),
    Vector((2280.0, -2690.5, 0.04))
]
samp_trunk, len_trunk = resample_polyline(pts_conn_trunk, step=3.0)
norm_trunk = compute_normals_2d(samp_trunk)
z_trunk = [p.z for p in samp_trunk]

build_road_ribbon("AS18_South_Connector_Road", samp_trunk, norm_trunk, width=7.6, z_coords=z_trunk, collection=col_ramps)
build_marking_line("AS18_South_Connector_Line_Center", samp_trunk, norm_trunk, offset=0.0, width=0.15, z_coords=z_trunk, collection=col_ramps, trim_ends=1)
build_marking_line("AS18_South_Connector_Line_L", samp_trunk, norm_trunk, offset=3.55, width=0.20, z_coords=z_trunk, collection=col_ramps, trim_ends=1)
build_marking_line("AS18_South_Connector_Line_R", samp_trunk, norm_trunk, offset=-3.55, width=0.20, z_coords=z_trunk, collection=col_ramps, trim_ends=1)

# B. Làn rẽ phải cong êm thuận (Sweeping Right Turn Slip Lane):
# Nối liên tục từ Werler Straße (Y = -2760) lượn cong bán kính R~35m nhập êm vào đầu đường nối tại (X=2280, Y=-2690.5)
pts_slip_curve = [
    Vector((2333.0, -2760.0, 0.04)),
    Vector((2330.0, -2740.0, 0.04)),
    Vector((2324.5, -2722.0, 0.04)),
    Vector((2315.0, -2707.0, 0.04)),
    Vector((2302.0, -2697.0, 0.04)),
    Vector((2288.0, -2692.0, 0.04)),
    Vector((2280.0, -2690.5, 0.04))
]
samp_slip, len_slip = resample_polyline(pts_slip_curve, step=2.5)
norm_slip = compute_normals_2d(samp_slip)
z_slip = [0.04 for _ in samp_slip]

build_road_ribbon("Werler_SlipLane_Right", samp_slip, norm_slip, width=5.6, z_coords=z_slip, collection=col_local)
build_marking_line("Werler_SlipLane_Right_Line_L", samp_slip, norm_slip, offset=2.55, width=0.20, z_coords=z_slip, collection=col_local, trim_ends=1)
build_marking_line("Werler_SlipLane_Right_Line_R", samp_slip, norm_slip, offset=-2.55, width=0.20, z_coords=z_slip, collection=col_local, trim_ends=1)

# C. Nhánh rẽ từ cao tốc ra nhập vào Werler Straße (Exit Throat / Bellmouth tại Y = -2687):
pts_exit_throat = [
    Vector((2280.0, -2690.5, 0.04)),
    Vector((2295.0, -2688.0, 0.04)),
    Vector((2310.0, -2687.0, 0.04)),
    Vector((2323.0, -2687.0, 0.04))
]
samp_exit, len_exit = resample_polyline(pts_exit_throat, step=2.5)
norm_exit = compute_normals_2d(samp_exit)
z_exit = [0.04 for _ in samp_exit]

build_road_ribbon("Werler_Exit_Throat_Road", samp_exit, norm_exit, width=6.2, z_coords=z_exit, collection=col_local)
build_marking_line("Werler_Exit_Throat_Line_L", samp_exit, norm_exit, offset=2.85, width=0.20, z_coords=z_exit, collection=col_local, trim_ends=1)
build_marking_line("Werler_Exit_Throat_Line_R", samp_exit, norm_exit, offset=-2.85, width=0.20, z_coords=z_exit, collection=col_local, trim_ends=1)

# -------------------------------------------------------------------------
# 5. ĐẢO GIAO THÔNG TAM GIÁC PHÂN LUỒNG NỔI (SPLITTER ISLAND)
# -------------------------------------------------------------------------
bm_isl = bmesh.new()

# Đảo tam giác nằm kẹp giữa:
# 1) Làn đi thẳng Werler Straße (X ~ 2322 - 2325)
# 2) Đường cong rẽ phải (lượn từ Y=-2745 đến X=2288)
# 3) Nhánh ra Werler Straße (Y ~ -2689)
island_pts = [
    Vector((2329.0, -2745.0, 0.04)),
    Vector((2325.5, -2725.0, 0.04)),
    Vector((2323.0, -2705.0, 0.04)),
    Vector((2321.5, -2690.0, 0.04)),
    Vector((2292.0, -2694.0, 0.04)),
    Vector((2303.0, -2702.0, 0.04)),
    Vector((2314.0, -2715.0, 0.04)),
    Vector((2322.0, -2730.0, 0.04))
]

v_bot = [bm_isl.verts.new(p) for p in island_pts]
v_top = [bm_isl.verts.new(p + Vector((0, 0, 0.14))) for p in island_pts]
n_isl = len(island_pts)

for i in range(n_isl):
    bm_isl.faces.new((v_bot[i], v_bot[(i+1)%n_isl], v_top[(i+1)%n_isl], v_top[i]))
bm_isl.faces.new(reversed(v_top))

mesh_isl = bpy.data.meshes.new("Werler_Traffic_Island_Splitter_Mesh")
bm_isl.to_mesh(mesh_isl); bm_isl.free()
mesh_isl.materials.append(mat_island); mesh_isl.update()
obj_isl = bpy.data.objects.new("Werler_Traffic_Island_Splitter", mesh_isl)
col_local.objects.link(obj_isl)

# -------------------------------------------------------------------------
# 6. MŨI TÊN CHỈ HƯỚNG SƠN MẶT ĐƯỜNG (StVO DIRECTION ARROWS)
# -------------------------------------------------------------------------
def create_arrow(name, pts, pos, yaw):
    bm = bmesh.new()
    rot = Matrix.Rotation(yaw, 4, 'Z')
    verts = [bm.verts.new(rot @ p + pos) for p in pts]
    bm.faces.new(verts)
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat_marking)
    obj = bpy.data.objects.new(name, m)
    col_local.objects.link(obj)
    return obj

pts_straight = [
    Vector((-0.15, -1.8, 0.0)), Vector((0.15, -1.8, 0.0)),
    Vector((0.15, 0.6, 0.0)), Vector((0.65, 0.6, 0.0)),
    Vector((0.0, 2.0, 0.0)),
    Vector((-0.65, 0.6, 0.0)), Vector((-0.15, 0.6, 0.0))
]

pts_right = [
    Vector((-0.15, -1.8, 0.0)), Vector((0.15, -1.8, 0.0)),
    Vector((0.15, -0.2, 0.0)), Vector((0.8, 0.6, 0.0)),
    Vector((0.8, 0.2, 0.0)), Vector((1.8, 0.8, 0.0)),
    Vector((1.1, 1.6, 0.0)), Vector((1.1, 1.1, 0.0)),
    Vector((0.4, 0.8, 0.0)), Vector((-0.15, 0.2, 0.0))
]

# Mũi tên đi thẳng trên làn qua hầm (làn trái)
create_arrow("Arrow_Straight_1", pts_straight, Vector((2330.0, -2720.0, 0.05)), math.radians(4.0))
create_arrow("Arrow_Straight_2", pts_straight, Vector((2327.0, -2700.0, 0.05)), math.radians(4.0))

# Mũi tên rẽ phải trên làn rẽ vào cao tốc (làn phải)
create_arrow("Arrow_Right_1", pts_right, Vector((2324.5, -2725.0, 0.05)), math.radians(12.0))
create_arrow("Arrow_Right_2", pts_right, Vector((2315.0, -2710.0, 0.05)), math.radians(26.0))

# Vạch dừng xe trước nút giao (Haltelinie)
bm_stop = bmesh.new()
bmesh.ops.create_grid(bm_stop, x_segments=1, y_segments=1, size=1.0)
m_stop = bpy.data.meshes.new("Haltelinie_Mesh")
bm_stop.to_mesh(m_stop); bm_stop.free()
m_stop.materials.append(mat_marking)
obj_stop = bpy.data.objects.new("Haltelinie", m_stop)
col_local.objects.link(obj_stop)
obj_stop.location = Vector((2324.5, -2687.0, 0.05))
obj_stop.scale = Vector((6.5, 0.5, 1.0))

# -------------------------------------------------------------------------
# 7. LÀN CHẠY SONG SONG TRÊN CAO TỐC A2 (ACCELERATION / PARALLEL LANES)
# -------------------------------------------------------------------------
# Khớp 2 vệt màu xanh mà người dùng vẽ trên A2 trong Ảnh 1:
pts_p_east = [Vector((x, -2581.5 + (2250 - x)*0.015, 5.60)) for x in range(2160, 2370, 10)]
norm_p_east = [Vector((0, -1, 0)) for _ in pts_p_east]
z_p_east = [5.60 for _ in pts_p_east]
build_road_ribbon("A2_Parallel_Lane_Eastbound", pts_p_east, norm_p_east, width=4.5, z_coords=z_p_east, collection=col_autobahn)
build_marking_line("A2_Breitstrich_East", pts_p_east, norm_p_east, offset=2.15, width=0.45, z_coords=z_p_east, collection=col_autobahn, trim_ends=2)

pts_p_west = [Vector((x, -2539.0 - (2250 - x)*0.015, 5.60)) for x in range(2160, 2370, 10)]
norm_p_west = [Vector((0, 1, 0)) for _ in pts_p_west]
z_p_west = [5.60 for _ in pts_p_west]
build_road_ribbon("A2_Parallel_Lane_Westbound", pts_p_west, norm_p_west, width=4.5, z_coords=z_p_west, collection=col_autobahn)
build_marking_line("A2_Breitstrich_West", pts_p_west, norm_p_west, offset=-2.15, width=0.45, z_coords=z_p_west, collection=col_autobahn, trim_ends=2)

# -------------------------------------------------------------------------
# 8. CÁNH ĐỒNG NÔNG NGHIỆP SẪM MÀU (CROP FIELD GÓC DƯỚI BÊN PHẢI ẢNH 1)
# -------------------------------------------------------------------------
# Thửa ruộng lớn màu xanh thẫm ôm trọn góc ngoài của cung đường cong
bm_crop = bmesh.new()
field_pts = [
    Vector((2335.0, -2765.0, 0.02)),
    Vector((2328.0, -2735.0, 0.02)),
    Vector((2315.0, -2712.0, 0.02)),
    Vector((2295.0, -2700.0, 0.02)),
    Vector((2270.0, -2696.0, 0.02)),
    Vector((2160.0, -2700.0, 0.02)),
    Vector((2160.0, -2860.0, 0.02)),
    Vector((2345.0, -2860.0, 0.02))
]
v_crop = [bm_crop.verts.new(p) for p in field_pts]
bm_crop.faces.new(v_crop)

m_crop = bpy.data.meshes.new("Crop_Field_SouthEast_Mesh")
bm_crop.to_mesh(m_crop); bm_crop.free()
m_crop.materials.append(mat_crop)
obj_crop = bpy.data.objects.new("Crop_Field_SouthEast", m_crop)
col_local.objects.link(obj_crop)

# -------------------------------------------------------------------------
# 9. PHÂN BỐ CÂY RỪNG CHUẨN XÁC THEO ẢNH 1 (EXCLUSION ZONE TRÁNH MẶT ĐƯỜNG 100%)
# -------------------------------------------------------------------------
# Xóa sạch toàn bộ cây cũ để tạo lại đúng vị trí như Google Earth
for obj in list(col_nature.objects):
    if "tree" in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)

# Thu thập tất cả các đường giao thông để loại trừ (Exclusion check)
road_check_polylines = [
    samp_trunk, samp_slip, samp_exit, pts_p_east, pts_p_west
]
obj_w = bpy.data.objects.get("Werler_Strasse_4Lanes_Underpass")
if obj_w:
    w_pts = [Vector((2318.0 + (y - (-2500))*0.03, y, 0.0)) for y in range(-2900, -2100, 15)]
    road_check_polylines.append(w_pts)

def is_safe(x, y, r=8.0):
    p = Vector((x, y, 0.0))
    # Không trồng lên cánh đồng trống (X < 2330 và Y < -2700)
    if x < 2320.0 and y < -2705.0:
        return False
    # Không trồng lên mặt đường
    for poly in road_check_polylines:
        for pt in poly:
            if (p.x - pt.x)**2 + (p.y - pt.y)**2 < (r * r):
                return False
    return True

tree_dense = bpy.data.objects.get('RSEA LOD Tree Dense Leafy')
tree_medium = bpy.data.objects.get('RSEA LOD Tree Medium')
tree_small = bpy.data.objects.get('RSEA LOD Tree Small')
tree_pine = bpy.data.objects.get('RSEA LOD Tree Pine')
tree_pool = [t for t in [tree_dense, tree_medium, tree_small] if t is not None]

random.seed(42)
tree_count = 0

def plant_tree(x, y, z=0.05, sc=1.0):
    global tree_count
    base_t = random.choice(tree_pool)
    t = bpy.data.objects.new(f"Roadscape_Grove_{tree_count:04d}", base_t.data)
    col_nature.objects.link(t)
    t.location = (x, y, z)
    t.rotation_euler = (0, 0, random.uniform(0, 6.28))
    s = sc * random.uniform(0.9, 1.25)
    t.scale = (s, s, s)
    tree_count += 1
    return t

# 1. CỤM RỪNG CÂY RẬM RẠP ĐÔNG NAM (South-East Grove - ngay góc cua như trong Ảnh 1):
# Tọa độ X từ 2220 đến 2315, Y từ -2682 đến -2600
attempts = 0
n_southeast = 0
while n_southeast < 55 and attempts < 400:
    attempts += 1
    tx = random.uniform(2220.0, 2315.0)
    ty = random.uniform(-2682.0, -2605.0)
    if is_safe(tx, ty, r=7.5):
        plant_tree(tx, ty, z=0.05, sc=1.15)
        n_southeast += 1

# 2. HÀNG CÂY DỌC PHÍA TÂY WERLER STRASSE (Phía trước bãi xe máy công trình trong Ảnh 1):
for wy in range(-2850, -2640, 20):
    tx = 2339.0 + random.uniform(-1.0, 1.0)
    ty = wy + random.uniform(-2.0, 2.0)
    if is_safe(tx, ty, r=6.5):
        plant_tree(tx, ty, z=0.05, sc=1.05)

# 3. CỤM RỪNG PHÍA SAU CẦU VƯỢT (Phía Tây Bắc - vòng xuyến đối diện trong Ảnh 1):
attempts = 0
n_northwest = 0
while n_northwest < 45 and attempts < 300:
    attempts += 1
    tx = random.uniform(2180.0, 2300.0)
    ty = random.uniform(-2540.0, -2470.0)
    if is_safe(tx, ty, r=7.5):
        plant_tree(tx, ty, z=0.05, sc=1.0)
        n_northwest += 1

# 4. HÀNG THÔNG XANH DỌC TALUY CAO TỐC A2:
if tree_pine:
    for ax in range(1950, 2450, 25):
        if 2285 <= ax <= 2345: continue
        for ay in [-2622.0, -2528.0]:
            if is_safe(ax, ay, r=8.0):
                t = bpy.data.objects.new(f"Roadscape_Pine_{tree_count:04d}", tree_pine.data)
                col_nature.objects.link(t)
                t.location = (ax + random.uniform(-1.5, 1.5), ay + random.uniform(-1.5, 1.5), 0.05)
                t.rotation_euler = (0, 0, random.uniform(0, 6.28))
                t.scale = (1.1, 1.1, 1.1)
                tree_count += 1

print(f"-> Đã bố trí {tree_count} cây Roadscape khớp 100% bố cục ảnh vệ tinh Google Earth 3D.")

bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== DỰNG CHUẨN XÁC THEO GOOGLE EARTH 3D HOÀN TẤT THÀNH CÔNG!     ===")
print("=====================================================================")
