import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix

print("=====================================================================")
print("=== XÂY DỰNG TOÀN DIỆN NÚT GIAO AS18 & CẦU VƯỢT CHUẨN XÁC V2      ===")
print("=====================================================================")

# -------------------------------------------------------------------------
# 1. QUẢN LÝ VẬT LIỆU PBR ROADSCAPE
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
mat_deck = bpy.data.materials.get("Bridge Deck.002") or bpy.data.materials.get("Autobahn_Bridge_Concrete")
mat_abutment = bpy.data.materials.get("Bridge Abutment 1") or mat_deck
mat_column = bpy.data.materials.get("Bridge Column") or mat_deck
mat_rail = bpy.data.materials.get("Bridge Rail") or mat_deck
mat_crop = get_or_create_mat("Field_Crops_LushGreen", setup_crop_field)
mat_island = get_or_create_mat("Island_Curb_Concrete", setup_island_pavement)

# -------------------------------------------------------------------------
# 2. QUẢN LÝ COLLECTIONS
# -------------------------------------------------------------------------
def get_or_create_col(name):
    col = bpy.data.collections.get(name)
    if not col:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col

col_autobahn = get_or_create_col("AUTOBAHN_A2")
col_bridge = get_or_create_col("AUTOBAHN_BRIDGE_STRUCTURE")
col_ramps = get_or_create_col("AUTOBAHN_AS18_RAMPS")
col_nature = get_or_create_col("AUTOBAHN_NATURE_TREES")
col_local = get_or_create_col("WERLER_STRASSE_LOCAL")

# Dọn dẹp các mesh cũ của cầu và nút giao cần cập nhật
cleanup_objects = [
    "Roadscape_Bridge_Deck", "Roadscape_Bridge_Abutments", "Roadscape_Bridge_Piers", "Roadscape_Embankment_Slopes",
    "AS18_North_Connector_Road", "AS18_North_Connector_Line_Center", "AS18_North_Connector_Line_L", "AS18_North_Connector_Line_R",
    "Werler_North_SlipLane_Right", "Werler_North_SlipLane_Line_L", "Werler_North_SlipLane_Line_R",
    "Werler_North_Traffic_Island_Splitter", "Werler_North_Exit_Throat_Road",
    "Arrow_North_Straight_1", "Arrow_North_Straight_2", "Arrow_North_Right_1", "Arrow_North_Right_2", "Haltelinie_North"
]
for name in cleanup_objects:
    o = bpy.data.objects.get(name)
    if o: bpy.data.objects.remove(o, do_unlink=True)

for o in list(col_local.objects):
    if "north" in o.name.lower():
        bpy.data.objects.remove(o, do_unlink=True)

# -------------------------------------------------------------------------
# 3. HÀM TIỆN ÍCH DỰNG ĐƯỜNG DỌC DẢI POLYLINE
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
# 4. TÁI THIẾT CẦU VƯỢT CAO TỐC A2 KHỚP 100% TIM ĐƯỜNG WERLER STRASSE
# -------------------------------------------------------------------------
# Vị trí tim đường Werler Straße dưới cầu:
# Tại Y = -2578.5: X = 2323.6
# Tại Y = -2542.5: X = 2321.4
# Khổ đường xe chạy: X in [2315.5, 2329.5] (rộng 14m)
# Vỉa hè hai bên: X in [2313.5, 2331.5]
# Chiều cao tĩnh không: H = 4.74m (mặt đường Z = 0.06m, đáy dầm cầu Z = 4.80m, mặt cầu Z = 5.60m)

# A. Bản mặt cầu (Bridge Deck)
bm_deck = bmesh.new()
# Nhịp cầu thông thuyền vượt qua đường Werler Straße: từ X = 2307.0 đến X = 2338.0 (dài 31m)
# Chiều rộng phủ cả 2 chiều cao tốc A2: từ Y = -2579.5 đến Y = -2541.5 (rộng 38m)
x_deck_min, x_deck_max = 2307.0, 2338.0
y_deck_min, y_deck_max = -2579.5, -2541.5
z_deck_bot, z_deck_top = 4.80, 5.60

deck_corners_bot = [
    Vector((x_deck_min, y_deck_min, z_deck_bot)),
    Vector((x_deck_max, y_deck_min, z_deck_bot)),
    Vector((x_deck_max, y_deck_max, z_deck_bot)),
    Vector((x_deck_min, y_deck_max, z_deck_bot))
]
deck_corners_top = [
    Vector((x_deck_min, y_deck_min, z_deck_top)),
    Vector((x_deck_max, y_deck_min, z_deck_top)),
    Vector((x_deck_max, y_deck_max, z_deck_top)),
    Vector((x_deck_min, y_deck_max, z_deck_top))
]

vb_deck = [bm_deck.verts.new(p) for p in deck_corners_bot]
vt_deck = [bm_deck.verts.new(p) for p in deck_corners_top]

# 6 mặt của khối dầm cầu
bm_deck.faces.new((vb_deck[0], vb_deck[1], vb_deck[2], vb_deck[3])) # đáy
bm_deck.faces.new((vt_deck[3], vt_deck[2], vt_deck[1], vt_deck[0])) # đỉnh
for i in range(4):
    bm_deck.faces.new((vb_deck[i], vb_deck[(i+1)%4], vt_deck[(i+1)%4], vt_deck[i]))

# Lan can an toàn 2 bên thành cầu (Parapets & Railing)
parapet_w = 0.45; parapet_h = 1.0
# Lan can phía Nam
vp_s_bot = [Vector((x_deck_min, y_deck_min, z_deck_top)), Vector((x_deck_max, y_deck_min, z_deck_top)),
            Vector((x_deck_max, y_deck_min + parapet_w, z_deck_top)), Vector((x_deck_min, y_deck_min + parapet_w, z_deck_top))]
vp_s_top = [p + Vector((0, 0, parapet_h)) for p in vp_s_bot]
vsb = [bm_deck.verts.new(p) for p in vp_s_bot]; vst = [bm_deck.verts.new(p) for p in vp_s_top]
bm_deck.faces.new((vst[3], vst[2], vst[1], vst[0]))
for i in range(4): bm_deck.faces.new((vsb[i], vsb[(i+1)%4], vst[(i+1)%4], vst[i]))

# Lan can phía Bắc
vp_n_bot = [Vector((x_deck_min, y_deck_max - parapet_w, z_deck_top)), Vector((x_deck_max, y_deck_max - parapet_w, z_deck_top)),
            Vector((x_deck_max, y_deck_max, z_deck_top)), Vector((x_deck_min, y_deck_max, z_deck_top))]
vp_n_top = [p + Vector((0, 0, parapet_h)) for p in vp_n_bot]
vnb = [bm_deck.verts.new(p) for p in vp_n_bot]; vnt = [bm_deck.verts.new(p) for p in vp_n_top]
bm_deck.faces.new((vnt[3], vnt[2], vnt[1], vnt[0]))
for i in range(4): bm_deck.faces.new((vnb[i], vnb[(i+1)%4], vnt[(i+1)%4], vnt[i]))

m_deck = bpy.data.meshes.new("Roadscape_Bridge_Deck_Mesh")
bm_deck.to_mesh(m_deck); bm_deck.free()
m_deck.materials.append(mat_deck); m_deck.update()
obj_deck = bpy.data.objects.new("Roadscape_Bridge_Deck", m_deck)
col_bridge.objects.link(obj_deck)

# B. Trụ cầu ở giữa dải phân cách (Bridge Piers) - CHUẨN XÁC TIM ĐƯỜNG 100%
# Tim đường tại nhịp Nam: X = 2323.2, Y = -2569.0
# Tim đường tại nhịp Bắc: X = 2321.8, Y = -2551.5
bm_piers = bmesh.new()

def add_oval_pier(bm, center_x, center_y, rx=0.65, ry=1.2, height=4.75, segments=16):
    bot_v = []; top_v = []
    for s in range(segments):
        ang = 2.0 * math.pi * s / segments
        px = center_x + rx * math.cos(ang)
        py = center_y + ry * math.sin(ang)
        bot_v.append(bm.verts.new(Vector((px, py, 0.05))))
        top_v.append(bm.verts.new(Vector((px, py, 0.05 + height))))
    for s in range(segments):
        nxt = (s + 1) % segments
        bm.faces.new((bot_v[s], bot_v[nxt], top_v[nxt], top_v[s]))
    bm.faces.new(top_v[::-1])
    bm.faces.new(bot_v)
    
    # Bệ bảo vệ va chạm bê tông hình thoi/bo tròn (Crash Barrier Foundation)
    cb_bot = []; cb_top = []
    for s in range(segments):
        ang = 2.0 * math.pi * s / segments
        px = center_x + (rx + 0.35) * math.cos(ang)
        py = center_y + (ry + 0.45) * math.sin(ang)
        cb_bot.append(bm.verts.new(Vector((px, py, 0.05))))
        cb_top.append(bm.verts.new(Vector((px, py, 0.85))))
    for s in range(segments):
        nxt = (s + 1) % segments
        bm.faces.new((cb_bot[s], cb_bot[nxt], cb_top[nxt], cb_top[s]))
    bm.faces.new(cb_top[::-1])
    bm.faces.new(cb_bot)

add_oval_pier(bm_piers, 2323.2, -2569.0) # Trụ dầm phía Nam
add_oval_pier(bm_piers, 2321.8, -2551.5) # Trụ dầm phía Bắc

m_piers = bpy.data.meshes.new("Roadscape_Bridge_Piers_Mesh")
bm_piers.to_mesh(m_piers); bm_piers.free()
m_piers.materials.append(mat_column); m_piers.update()
obj_piers = bpy.data.objects.new("Roadscape_Bridge_Piers", m_piers)
col_bridge.objects.link(obj_piers)

# C. Mố cầu hai bên (Bridge Abutments) - Nằm ngoài phạm vi lòng đường và vỉa hè
# Mố phía Tây: X in [2302.0, 2307.0] (Mặt trước x=2307 cách vỉa hè x=2313.5 an toàn 6.5m)
# Mố phía Đông: X in [2338.0, 2343.0] (Mặt trước x=2338 cách vỉa hè x=2331.5 an toàn 6.5m)
bm_abut = bmesh.new()

def add_abutment_block(bm, x1, x2, y1, y2, z_bot=0.05, z_top=4.85):
    pts_bot = [Vector((x1, y1, z_bot)), Vector((x2, y1, z_bot)), Vector((x2, y2, z_bot)), Vector((x1, y2, z_bot))]
    pts_top = [Vector((x1, y1, z_top)), Vector((x2, y1, z_top)), Vector((x2, y2, z_top)), Vector((x1, y2, z_top))]
    vb = [bm.verts.new(p) for p in pts_bot]; vt = [bm.verts.new(p) for p in pts_top]
    bm.faces.new(vb)
    bm.faces.new(vt[::-1])
    for i in range(4): bm.faces.new((vb[i], vb[(i+1)%4], vt[(i+1)%4], vt[i]))

add_abutment_block(bm_abut, 2302.0, 2307.0, y_deck_min - 2.0, y_deck_max + 2.0) # Mố Tây
add_abutment_block(bm_abut, 2338.0, 2343.0, y_deck_min - 2.0, y_deck_max + 2.0) # Mố Đông

m_abut = bpy.data.meshes.new("Roadscape_Bridge_Abutments_Mesh")
bm_abut.to_mesh(m_abut); bm_abut.free()
m_abut.materials.append(mat_abutment); m_abut.update()
obj_abut = bpy.data.objects.new("Roadscape_Bridge_Abutments", m_abut)
col_bridge.objects.link(obj_abut)

# D. Mái taluy đất đắp đầu cầu (Embankment Slopes)
bm_slopes = bmesh.new()
# Mái dốc Tây: nối từ X=2302 (mặt mố z=4.85) thoải dần ra X=2280 (mặt đất z=0.05)
pts_slope_w = [
    (Vector((2302.0, y_deck_max + 3.0, 4.85)), Vector((2302.0, y_deck_min - 3.0, 4.85)),
     Vector((2275.0, y_deck_min - 6.0, 0.05)), Vector((2275.0, y_deck_max + 6.0, 0.05)))
]
for p in pts_slope_w:
    v = [bm_slopes.verts.new(pt) for pt in p]
    bm_slopes.faces.new(v)

# Mái dốc Đông: nối từ X=2343 (mặt mố z=4.85) thoải dần ra X=2370 (mặt đất z=0.05)
pts_slope_e = [
    (Vector((2343.0, y_deck_min - 3.0, 4.85)), Vector((2343.0, y_deck_max + 3.0, 4.85)),
     Vector((2370.0, y_deck_max + 6.0, 0.05)), Vector((2370.0, y_deck_min - 6.0, 0.05)))
]
for p in pts_slope_e:
    v = [bm_slopes.verts.new(pt) for pt in p]
    bm_slopes.faces.new(v)

m_slopes = bpy.data.meshes.new("Roadscape_Embankment_Slopes_Mesh")
bm_slopes.to_mesh(m_slopes); bm_slopes.free()
mat_grass = bpy.data.materials.get("Autobahn_Median_Grass") or mat_crop
m_slopes.materials.append(mat_grass); m_slopes.update()
obj_slopes = bpy.data.objects.new("Roadscape_Embankment_Slopes", m_slopes)
col_bridge.objects.link(obj_slopes)

# -------------------------------------------------------------------------
# 5. XÂY DỰNG NÚT GIAO PHÍA BẮC (NORTH INTERSECTION - KHỚP 100% ẢNH GOOGLE EARTH)
# -------------------------------------------------------------------------
# A. Tuyến đường nối nhánh Bắc (AS18_North_Connector_Road):
# Đi từ nút nhập cao tốc (X=2152.0, Y=-2490.8) chạy về Werler Straße (X=2275 - 2315).
pts_conn_north = [
    Vector((2152.0, -2490.8, 0.50)),
    Vector((2168.0, -2478.0, 0.42)),
    Vector((2185.0, -2469.0, 0.32)),
    Vector((2205.0, -2464.0, 0.22)),
    Vector((2230.0, -2461.0, 0.14)),
    Vector((2255.0, -2459.0, 0.08)),
    Vector((2275.0, -2458.0, 0.04))
]
samp_c_north, len_c_north = resample_polyline(pts_conn_north, step=3.0)
norm_c_north = compute_normals_2d(samp_c_north)
z_c_north = [p.z for p in samp_c_north]

build_road_ribbon("AS18_North_Connector_Road", samp_c_north, norm_c_north, width=7.6, z_coords=z_c_north, collection=col_ramps)
build_marking_line("AS18_North_Connector_Line_Center", samp_c_north, norm_c_north, offset=0.0, width=0.15, z_coords=z_c_north, collection=col_ramps, trim_ends=1)
build_marking_line("AS18_North_Connector_Line_L", samp_c_north, norm_c_north, offset=3.55, width=0.20, z_coords=z_c_north, collection=col_ramps, trim_ends=1)
build_marking_line("AS18_North_Connector_Line_R", samp_c_north, norm_c_north, offset=-3.55, width=0.20, z_coords=z_c_north, collection=col_ramps, trim_ends=1)

# B. Làn rẽ phải cong êm thuận phía Bắc (Werler_North_SlipLane_Right):
# Xe đi từ phía Bắc (Y = -2400) xuôi về Nam, rẽ phải vào đường nối lên cao tốc A2
# Mép phải Werler Straße tại Y=-2410 là X ~ 2307.0.
pts_north_slip = [
    Vector((2306.5, -2410.0, 0.04)),
    Vector((2304.0, -2425.0, 0.04)),
    Vector((2299.0, -2439.0, 0.04)),
    Vector((2290.0, -2450.0, 0.04)),
    Vector((2278.0, -2456.0, 0.04)),
    Vector((2265.0, -2458.0, 0.05)),
    Vector((2255.0, -2459.0, 0.08))
]
samp_sn, len_sn = resample_polyline(pts_north_slip, step=2.5)
norm_sn = compute_normals_2d(samp_sn)
z_sn = [p.z for p in samp_sn]

build_road_ribbon("Werler_North_SlipLane_Right", samp_sn, norm_sn, width=5.6, z_coords=z_sn, collection=col_local)
build_marking_line("Werler_North_SlipLane_Line_L", samp_sn, norm_sn, offset=2.55, width=0.20, z_coords=z_sn, collection=col_local, trim_ends=1)
build_marking_line("Werler_North_SlipLane_Line_R", samp_sn, norm_sn, offset=-2.55, width=0.20, z_coords=z_sn, collection=col_local, trim_ends=1)

# C. Nhánh ra Werler Straße từ đường nối phía Bắc (Werler_North_Exit_Throat_Road):
pts_north_exit = [
    Vector((2275.0, -2458.0, 0.04)),
    Vector((2290.0, -2457.5, 0.04)),
    Vector((2302.0, -2457.0, 0.04)),
    Vector((2310.0, -2457.0, 0.04))
]
samp_ne, len_ne = resample_polyline(pts_north_exit, step=2.5)
norm_ne = compute_normals_2d(samp_ne)
z_ne = [0.04 for _ in samp_ne]

build_road_ribbon("Werler_North_Exit_Throat_Road", samp_ne, norm_ne, width=6.2, z_coords=z_ne, collection=col_local)

# D. Đảo tam giác phân luồng nổi phía Bắc (Werler_North_Traffic_Island_Splitter):
bm_isl_n = bmesh.new()
island_pts_north = [
    Vector((2305.5, -2420.0, 0.04)),
    Vector((2306.0, -2435.0, 0.04)),
    Vector((2306.5, -2448.0, 0.04)),
    Vector((2306.5, -2455.0, 0.04)),
    Vector((2278.0, -2455.5, 0.04)),
    Vector((2288.0, -2449.0, 0.04)),
    Vector((2296.0, -2438.0, 0.04)),
    Vector((2302.0, -2428.0, 0.04))
]

v_bot_n = [bm_isl_n.verts.new(p) for p in island_pts_north]
v_top_n = [bm_isl_n.verts.new(p + Vector((0, 0, 0.14))) for p in island_pts_north]
n_isl_n = len(island_pts_north)

for i in range(n_isl_n):
    bm_isl_n.faces.new((v_bot_n[i], v_bot_n[(i+1)%n_isl_n], v_top_n[(i+1)%n_isl_n], v_top_n[i]))
bm_isl_n.faces.new(v_top_n[::-1])

mesh_isl_n = bpy.data.meshes.new("Werler_North_Traffic_Island_Splitter_Mesh")
bm_isl_n.to_mesh(mesh_isl_n); bm_isl_n.free()
mesh_isl_n.materials.append(mat_island); mesh_isl_n.update()
obj_isl_n = bpy.data.objects.new("Werler_North_Traffic_Island_Splitter", mesh_isl_n)
col_local.objects.link(obj_isl_n)

# E. Mũi tên chỉ hướng sơn mặt đường phía Bắc (StVO Arrows)
def create_arrow_mesh(name, pts, pos, yaw, collection=col_local):
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

pts_right = [
    Vector((-0.15, -1.8, 0.0)), Vector((0.15, -1.8, 0.0)),
    Vector((0.15, -0.2, 0.0)), Vector((0.8, 0.6, 0.0)),
    Vector((0.8, 0.2, 0.0)), Vector((1.8, 0.8, 0.0)),
    Vector((1.1, 1.6, 0.0)), Vector((1.1, 1.1, 0.0)),
    Vector((0.4, 0.8, 0.0)), Vector((-0.15, 0.2, 0.0))
]

# Hướng xe chạy về Nam (yaw ~ 180 độ so với trục +Y)
create_arrow_mesh("Arrow_North_Straight_1", pts_straight, Vector((2312.0, -2430.0, 0.05)), math.radians(182.0))
create_arrow_mesh("Arrow_North_Straight_2", pts_straight, Vector((2312.5, -2448.0, 0.05)), math.radians(182.0))

create_arrow_mesh("Arrow_North_Right_1", pts_right, Vector((2303.0, -2430.0, 0.05)), math.radians(195.0))
create_arrow_mesh("Arrow_North_Right_2", pts_right, Vector((2292.0, -2445.0, 0.05)), math.radians(220.0))

# Vạch dừng xe phía Bắc (Haltelinie)
bm_stop_n = bmesh.new()
bmesh.ops.create_grid(bm_stop_n, x_segments=1, y_segments=1, size=1.0)
m_stop_n = bpy.data.meshes.new("Haltelinie_North_Mesh")
bm_stop_n.to_mesh(m_stop_n); bm_stop_n.free()
m_stop_n.materials.append(mat_marking)
obj_stop_n = bpy.data.objects.new("Haltelinie_North", m_stop_n)
col_local.objects.link(obj_stop_n)
obj_stop_n.location = Vector((2303.0, -2458.0, 0.05))
obj_stop_n.scale = Vector((6.5, 0.5, 1.0))

# -------------------------------------------------------------------------
# 6. BỐ TRÍ CÂY XANH ROADSCAPE LOD RẬM RẠP & AN TOÀN TUYỆT ĐỐI
# -------------------------------------------------------------------------
# Xóa sạch cây cũ để rải lại chuẩn xác quanh cả nút giao Bắc & Nam
for obj in list(col_nature.objects):
    if "grove" in obj.name.lower() or "pine" in obj.name.lower() or "tree" in obj.name.lower():
        bpy.data.objects.remove(obj, do_unlink=True)

tree_dense = bpy.data.objects.get('RSEA LOD Tree Dense Leafy')
tree_medium = bpy.data.objects.get('RSEA LOD Tree Medium')
tree_small = bpy.data.objects.get('RSEA LOD Tree Small')
tree_pine = bpy.data.objects.get('RSEA LOD Tree Pine')
tree_pool = [t for t in [tree_dense, tree_medium, tree_small] if t is not None]

all_road_polys = [
    samp_c_north, samp_sn, samp_ne,
    [Vector((2315.0, y, 0.0)) for y in range(-2850, -2200, 15)], # Werler Straße
    [Vector((x, -2560.0, 5.6)) for x in range(2100, 2400, 15)], # A2 bridge
    [Vector((x, -2540.0, 5.6)) for x in range(2100, 2400, 15)],
    [Vector((x, -2580.0, 5.6)) for x in range(2100, 2400, 15)]
]

def is_safe_pos(x, y, r=8.0):
    p = Vector((x, y, 0.0))
    # Loại trừ mặt đường
    for poly in all_road_polys:
        for pt in poly:
            if (p.x - pt.x)**2 + (p.y - pt.y)**2 < (r * r):
                return False
    # Loại trừ cánh đồng Đông Nam (X > 2335 và Y < -2700)
    if x > 2335.0 and y < -2700.0:
        return False
    return True

random.seed(101)
planted_count = 0

def add_tree(x, y, z=0.05, sc=1.0):
    global planted_count
    base_t = random.choice(tree_pool)
    t = bpy.data.objects.new(f"Roadscape_Grove_{planted_count:04d}", base_t.data)
    col_nature.objects.link(t)
    t.location = (x, y, z)
    t.rotation_euler = (0, 0, random.uniform(0, 6.28))
    s = sc * random.uniform(0.9, 1.25)
    t.scale = (s, s, s)
    planted_count += 1
    return t

# 1. Cụm rừng rậm góc Tây-Bắc nút giao (giữa nhánh rẽ và cao tốc A2 như trong Ảnh 1)
# X từ 2200 đến 2300, Y từ -2535 đến -2465
attempts = 0
n_northwest = 0
while n_northwest < 60 and attempts < 400:
    attempts += 1
    tx = random.uniform(2200.0, 2300.0)
    ty = random.uniform(-2535.0, -2465.0)
    if is_safe_pos(tx, ty, r=7.5):
        add_tree(tx, ty, z=0.05, sc=1.15)
        n_northwest += 1

# 2. Cụm rừng rậm góc Tây-Nam nút giao (giữa nhánh rẽ Nam và cao tốc A2)
# X từ 2200 đến 2305, Y từ -2655 đến -2585
attempts = 0
n_southwest = 0
while n_southwest < 60 and attempts < 400:
    attempts += 1
    tx = random.uniform(2200.0, 2305.0)
    ty = random.uniform(-2655.0, -2585.0)
    if is_safe_pos(tx, ty, r=7.5):
        add_tree(tx, ty, z=0.05, sc=1.15)
        n_southwest += 1

# 3. Hàng thông xanh dọc taluy cao tốc A2
if tree_pine:
    for ax in range(1950, 2450, 22):
        if 2290 <= ax <= 2345: continue
        for ay in [-2618.0, -2532.0]:
            if is_safe_pos(ax, ay, r=7.5):
                t = bpy.data.objects.new(f"Roadscape_Pine_{planted_count:04d}", tree_pine.data)
                col_nature.objects.link(t)
                t.location = (ax + random.uniform(-1.5, 1.5), ay + random.uniform(-1.5, 1.5), 0.05)
                t.rotation_euler = (0, 0, random.uniform(0, 6.28))
                t.scale = (1.1, 1.1, 1.1)
                planted_count += 1

print(f"-> Đã bố trí {planted_count} cây Roadscape chất lượng cao.")

# -------------------------------------------------------------------------
# 7. ĐẶT CAMERA GÓC NHÌN CHUẨN XÁC THEO ẢNH GOOGLE EARTH 3D
# -------------------------------------------------------------------------
# Góc nhìn từ phía Bắc (Y = -2360) nhìn xuôi về phía Nam (Y = -2560):
# Nhìn thấy:
# - Ngay trước mặt: Đường Werler Straße với làn rẽ phải lượn cong, đảo tam giác nổi, mũi tên chỉ hướng
# - Bên phải (Tây): Cụm rừng rậm rạp che phủ góc nút giao
# - Bên trái (Đông): Khu nhà xưởng Gewerbepark / bãi xe máy thi công
# - Ở giữa: Cầu vượt Autobahn A2 với trụ cầu đặt chuẩn xác ở dải phân cách giữa hai chiều xe chạy
# - Phía sau cầu: Cao tốc A2 và nhánh rẽ phía đối diện
cam = bpy.data.objects.get("Camera")
if not cam:
    cam_data = bpy.data.cameras.new("Camera")
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam

cam.location = Vector((2316.0, -2370.0, 52.0))
# Camera nhìn về hướng Y âm (hướng Nam) và hơi chúc xuống mặt đường:
# Rotation Euler: X = 74 độ (chúc xuống 16 độ), Y = 0, Z = 180 độ (nhìn về hướng -Y)
cam.rotation_euler = (math.radians(73.5), 0.0, math.radians(179.2))
cam.data.lens = 35.0 # Tiêu cự góc rộng chuẩn 35mm
cam.data.clip_end = 5000.0

bpy.context.scene.camera = cam

# Lưu file blend
bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== XÂY DỰNG TOÀN DIỆN NÚT GIAO VÀ CẦU VƯỢT THÀNH CÔNG RỰC RỠ!   ===")
print("=====================================================================")
