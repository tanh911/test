import bpy
import bmesh
import math
import random
from mathutils import Vector

print("=====================================================================")
print("=== DỰNG CHUẨN NÚT GIAO HAMM-RHYNERN (AS18) & ROADSCAPE ASSETS   ===")
print("=====================================================================")

# -------------------------------------------------------------------------
# 1. VẬT LIỆU PBR & ROADSCAPE ASSETS
# -------------------------------------------------------------------------
def get_or_create_mat(name, make_func):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    make_func(mat)
    return mat

def setup_asphalt(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.045, 0.048, 0.052, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.65
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

def setup_marking(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.96, 0.96, 0.96, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.25
    if 'Emission Color' in bsdf.inputs:
        bsdf.inputs['Emission Color'].default_value = (0.95, 0.95, 0.95, 1.0)
        bsdf.inputs['Emission Strength'].default_value = 0.25
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

mat_asphalt = get_or_create_mat("Autobahn_Asphalt_PBR", setup_asphalt)
mat_marking = get_or_create_mat("Autobahn_Marking_White", setup_marking)

# Kiểm tra & load các asset Roadscape từ thư viện
lib_path = r"G:\road\Roadscape\Roadscape\Roadscape v4.13.10 (Asset Library)\Roadscape 4 (Release).blend"
asset_names = [
    'RSEA LOD Tree Dense Leafy',
    'RSEA LOD Tree Medium',
    'RSEA LOD Tree Pine',
    'RSEA LOD Tree Small',
    'RSEA Env Streetlight'
]

needed_assets = [name for name in asset_names if name not in bpy.data.objects]
if needed_assets:
    with bpy.data.libraries.load(lib_path, link=False) as (data_from, data_to):
        data_to.objects = [name for name in needed_assets if name in data_from.objects]

# -------------------------------------------------------------------------
# 2. DỌN DẸP COLLECTIONS VÀ MESH CŨ
# -------------------------------------------------------------------------
col_autobahn = bpy.data.collections.get("AUTOBAHN_A2")
col_ramps = bpy.data.collections.get("AUTOBAHN_AS18_RAMPS")
col_nature = bpy.data.collections.get("AUTOBAHN_NATURE_TREES")

if not col_ramps:
    col_ramps = bpy.data.collections.new("AUTOBAHN_AS18_RAMPS")
    if col_autobahn: col_autobahn.children.link(col_ramps)
    else: bpy.context.scene.collection.children.link(col_ramps)

if not col_nature:
    col_nature = bpy.data.collections.new("AUTOBAHN_NATURE_TREES")
    if col_autobahn: col_autobahn.children.link(col_nature)
    else: bpy.context.scene.collection.children.link(col_nature)

# Xóa toàn bộ objects cũ trong col_ramps và col_nature
for c in [col_ramps, col_nature]:
    for obj in list(c.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

# -------------------------------------------------------------------------
# 3. THUẬT TOÁN HÌNH HỌC DỰNG ĐƯỜNG
# -------------------------------------------------------------------------
def resample_polyline(pts, step=3.5):
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

def build_road_ribbon(name, pts, normals, width, z_coords, mat=mat_asphalt, collection=col_ramps):
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

def build_marking_line(name, pts, normals, offset, width, z_coords, collection=col_ramps, trim_ends=1):
    bm = bmesh.new()
    n = len(pts)
    if n <= 2 * trim_ends:
        trim_ends = 0
    start_i = trim_ends
    end_i = n - trim_ends
    hw = width / 2.0
    vl_list = []; vr_list = []
    for i in range(start_i, end_i):
        p = pts[i]; norm = normals[i]
        zv = z_coords[i] + 0.02
        c_x = p.x + norm.x * offset
        c_y = p.y + norm.y * offset
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

def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)

BRIDGE_Z = 5.60
GROUND_Z = 0.05
SPLIT_Z  = 0.50

# Danh sách tất cả tim đường đã dựng để kiểm tra va chạm khi trồng cây
all_road_polylines = []

# -------------------------------------------------------------------------
# 4. KHU VỰC PHÍA NAM (SOUTH INTERCHANGE SYSTEM)
# -------------------------------------------------------------------------

# --- A. ĐƯỜNG NỐI CHÍNH PHÍA NAM (SOUTH CONNECTOR TRUNK) ---
# Nối mượt mà từ mép đường Werler Straße (X=2325, Y=-2688) sang nút rẽ vòng xuyến (X=2155.5, Y=-2664.1)
raw_s_trunk = [
    Vector((2325.0, -2688.0, 0.0)),
    Vector((2293.7, -2689.6, 0.0)),
    Vector((2216.5, -2694.4, 0.0)),
    Vector((2206.1, -2694.0, 0.0)),
    Vector((2194.3, -2691.8, 0.0)),
    Vector((2183.7, -2687.3, 0.0)),
    Vector((2174.1, -2682.5, 0.0)),
    Vector((2166.1, -2676.2, 0.0)),
    Vector((2155.5, -2664.1, 0.0))
]
samp_s_trunk, len_s_trunk = resample_polyline(raw_s_trunk, step=3.5)
norm_s_trunk = compute_normals_2d(samp_s_trunk)
all_road_polylines.append(samp_s_trunk)

z_s_trunk = []
for i in range(len(samp_s_trunk)):
    t = i / (len(samp_s_trunk) - 1)
    z_s_trunk.append(GROUND_Z + smoothstep(t) * (SPLIT_Z - GROUND_Z))

# Đường nối 2 chiều rộng 7.6m
build_road_ribbon("AS18_South_Connector_Road", samp_s_trunk, norm_s_trunk, width=7.6, z_coords=z_s_trunk)
# Vạch tim đường đứt & vạch mép 2 bên
build_marking_line("AS18_South_Connector_Line_Center", samp_s_trunk, norm_s_trunk, offset=0.0, width=0.15, z_coords=z_s_trunk, trim_ends=2)
build_marking_line("AS18_South_Connector_Line_L", samp_s_trunk, norm_s_trunk, offset=3.55, width=0.20, z_coords=z_s_trunk, trim_ends=1)
build_marking_line("AS18_South_Connector_Line_R", samp_s_trunk, norm_s_trunk, offset=-3.55, width=0.20, z_coords=z_s_trunk, trim_ends=1)

# --- B. NHÁNH LÊN CAO TỐC A2 HƯỚNG HANNOVER (SOUTH ON-RAMP) ---
# Tách ra từ nút X=2155.5, Y=-2664.1 tại Z=0.50m, leo dốc lên cao tốc A2 tại Z=5.60m + làn gia tốc
raw_s_on = [
    Vector((2155.5, -2664.1, 0.0)),
    Vector((2155.5, -2656.0, 0.0)),
    Vector((2153.0, -2644.7, 0.0)),
    Vector((2152.9, -2636.7, 0.0)),
    Vector((2154.7, -2628.4, 0.0)),
    Vector((2160.1, -2616.9, 0.0)),
    Vector((2167.9, -2606.6, 0.0)),
    Vector((2181.7, -2597.9, 0.0)),
    Vector((2196.1, -2592.0, 0.0)),
    Vector((2208.2, -2583.2, 0.0)),
    # Làn gia tốc chạy song song cao tốc A2 Eastbound
    Vector((2250.0, -2581.5, 0.0)),
    Vector((2295.0, -2580.0, 0.0)),
    Vector((2340.0, -2578.5, 0.0))
]
samp_s_on, len_s_on = resample_polyline(raw_s_on, step=3.5)
norm_s_on = compute_normals_2d(samp_s_on)
all_road_polylines.append(samp_s_on)

cum_len_s_on = [0.0]
for i in range(len(samp_s_on) - 1):
    cum_len_s_on.append(cum_len_s_on[-1] + (samp_s_on[i+1] - samp_s_on[i]).length)

idx_merge_s = min(range(len(samp_s_on)), key=lambda i: (samp_s_on[i].x - 2208.2)**2 + (samp_s_on[i].y - (-2583.2))**2)
len_climb_s = cum_len_s_on[idx_merge_s]

z_s_on = []
for i in range(len(samp_s_on)):
    d = cum_len_s_on[i]
    if d <= len_climb_s:
        t = d / len_climb_s
        z_s_on.append(SPLIT_Z + smoothstep(t) * (BRIDGE_Z - SPLIT_Z))
    else:
        z_s_on.append(BRIDGE_Z)

build_road_ribbon("AS18_South_OnRamp_Road", samp_s_on, norm_s_on, width=5.5, z_coords=z_s_on)
build_marking_line("AS18_South_OnRamp_Line_L", samp_s_on, norm_s_on, offset=2.50, width=0.20, z_coords=z_s_on, trim_ends=2)
build_marking_line("AS18_South_OnRamp_Line_R", samp_s_on, norm_s_on, offset=-2.50, width=0.20, z_coords=z_s_on, trim_ends=2)

# --- C. NHÁNH RỜI CAO TỐC A2 VÀO WERLER STRASSE (SOUTH OFF-RAMP) ---
# Tách ra từ A2 Eastbound tại Z=5.60m, chạy vòng xuống nút X=2155.5 tại Z=0.50m
raw_s_off = [
    Vector((1930.0, -2591.5, 0.0)),
    Vector((1980.0, -2591.8, 0.0)),
    Vector((2030.0, -2592.0, 0.0)),
    Vector((2072.0, -2592.3, 0.0)),
    Vector((2089.2, -2601.3, 0.0)),
    Vector((2105.7, -2606.7, 0.0)),
    Vector((2119.8, -2616.4, 0.0)),
    Vector((2130.9, -2630.0, 0.0)),
    Vector((2142.9, -2650.6, 0.0)),
    Vector((2147.2, -2657.3, 0.0)),
    Vector((2155.5, -2664.1, 0.0))
]
samp_s_off, len_s_off = resample_polyline(raw_s_off, step=3.5)
norm_s_off = compute_normals_2d(samp_s_off)
all_road_polylines.append(samp_s_off)

cum_len_s_off = [0.0]
for i in range(len(samp_s_off) - 1):
    cum_len_s_off.append(cum_len_s_off[-1] + (samp_s_off[i+1] - samp_s_off[i]).length)

idx_split_s = min(range(len(samp_s_off)), key=lambda i: (samp_s_off[i].x - 2072.0)**2 + (samp_s_off[i].y - (-2592.3))**2)
len_decel_s = cum_len_s_off[idx_split_s]
len_descent_s = cum_len_s_off[-1] - len_decel_s

z_s_off = []
for i in range(len(samp_s_off)):
    d = cum_len_s_off[i]
    if d <= len_decel_s:
        z_s_off.append(BRIDGE_Z)
    else:
        t = (d - len_decel_s) / len_descent_s
        z_s_off.append(BRIDGE_Z - smoothstep(t) * (BRIDGE_Z - SPLIT_Z))

build_road_ribbon("AS18_South_OffRamp_Road", samp_s_off, norm_s_off, width=5.5, z_coords=z_s_off)
build_marking_line("AS18_South_OffRamp_Line_L", samp_s_off, norm_s_off, offset=2.50, width=0.20, z_coords=z_s_off, trim_ends=2)
build_marking_line("AS18_South_OffRamp_Line_R", samp_s_off, norm_s_off, offset=-2.50, width=0.20, z_coords=z_s_off, trim_ends=2)

# -------------------------------------------------------------------------
# 5. KHU VỰC PHÍA BẮC (NORTH INTERCHANGE SYSTEM)
# -------------------------------------------------------------------------

# --- A. ĐƯỜNG NỐI CHÍNH PHÍA BẮC (NORTH CONNECTOR TRUNK) ---
raw_n_trunk = [
    Vector((2315.5, -2452.0, 0.0)),
    Vector((2280.9, -2452.7, 0.0)),
    Vector((2266.0, -2453.7, 0.0)),
    Vector((2218.4, -2457.0, 0.0)),
    Vector((2196.3, -2458.8, 0.0)),
    Vector((2176.6, -2464.0, 0.0)),
    Vector((2161.3, -2472.8, 0.0)),
    Vector((2146.8, -2491.2, 0.0))
]
samp_n_trunk, len_n_trunk = resample_polyline(raw_n_trunk, step=3.5)
norm_n_trunk = compute_normals_2d(samp_n_trunk)
all_road_polylines.append(samp_n_trunk)

z_n_trunk = []
for i in range(len(samp_n_trunk)):
    t = i / (len(samp_n_trunk) - 1)
    z_n_trunk.append(GROUND_Z + smoothstep(t) * (SPLIT_Z - GROUND_Z))

build_road_ribbon("AS18_North_Connector_Road", samp_n_trunk, norm_n_trunk, width=7.6, z_coords=z_n_trunk)
build_marking_line("AS18_North_Connector_Line_Center", samp_n_trunk, norm_n_trunk, offset=0.0, width=0.15, z_coords=z_n_trunk, trim_ends=2)
build_marking_line("AS18_North_Connector_Line_L", samp_n_trunk, norm_n_trunk, offset=3.55, width=0.20, z_coords=z_n_trunk, trim_ends=1)
build_marking_line("AS18_North_Connector_Line_R", samp_n_trunk, norm_n_trunk, offset=-3.55, width=0.20, z_coords=z_n_trunk, trim_ends=1)

# --- B. NHÁNH LÊN CAO TỐC A2 HƯỚNG DORTMUND (NORTH ON-RAMP) ---
raw_n_on = [
    Vector((2146.8, -2491.2, 0.0)),
    Vector((2136.3, -2506.1, 0.0)),
    Vector((2127.4, -2525.9, 0.0)),
    Vector((2112.3, -2548.6, 0.0)),
    Vector((2102.9, -2557.9, 0.0)),
    Vector((2087.2, -2564.9, 0.0)),
    Vector((2067.7, -2577.0, 0.0)),
    # Làn gia tốc chạy song song cao tốc A2 Westbound
    Vector((2020.0, -2579.5, 0.0)),
    Vector((1970.0, -2582.0, 0.0)),
    Vector((1920.0, -2584.5, 0.0))
]
samp_n_on, len_n_on = resample_polyline(raw_n_on, step=3.5)
norm_n_on = compute_normals_2d(samp_n_on)
all_road_polylines.append(samp_n_on)

cum_len_n_on = [0.0]
for i in range(len(samp_n_on) - 1):
    cum_len_n_on.append(cum_len_n_on[-1] + (samp_n_on[i+1] - samp_n_on[i]).length)

idx_merge_n = min(range(len(samp_n_on)), key=lambda i: (samp_n_on[i].x - 2067.7)**2 + (samp_n_on[i].y - (-2577.0))**2)
len_climb_n = cum_len_n_on[idx_merge_n]

z_n_on = []
for i in range(len(samp_n_on)):
    d = cum_len_n_on[i]
    if d <= len_climb_n:
        t = d / len_climb_n
        z_n_on.append(SPLIT_Z + smoothstep(t) * (BRIDGE_Z - SPLIT_Z))
    else:
        z_n_on.append(BRIDGE_Z)

build_road_ribbon("AS18_North_OnRamp_Road", samp_n_on, norm_n_on, width=5.5, z_coords=z_n_on)
build_marking_line("AS18_North_OnRamp_Line_L", samp_n_on, norm_n_on, offset=2.50, width=0.20, z_coords=z_n_on, trim_ends=2)
build_marking_line("AS18_North_OnRamp_Line_R", samp_n_on, norm_n_on, offset=-2.50, width=0.20, z_coords=z_n_on, trim_ends=2)

# --- C. NHÁNH RỜI CAO TỐC A2 VÀO WERLER STRASSE (NORTH OFF-RAMP) ---
raw_n_off = [
    Vector((2340.0, -2556.0, 0.0)),
    Vector((2295.0, -2559.0, 0.0)),
    Vector((2250.0, -2562.5, 0.0)),
    Vector((2206.0, -2567.4, 0.0)),
    Vector((2192.4, -2560.0, 0.0)),
    Vector((2178.7, -2555.5, 0.0)),
    Vector((2164.9, -2548.3, 0.0)),
    Vector((2155.0, -2538.5, 0.0)),
    Vector((2147.7, -2525.7, 0.0)),
    Vector((2145.4, -2513.1, 0.0)),
    Vector((2146.8, -2491.2, 0.0))
]
samp_n_off, len_n_off = resample_polyline(raw_n_off, step=3.5)
norm_n_off = compute_normals_2d(samp_n_off)
all_road_polylines.append(samp_n_off)

cum_len_n_off = [0.0]
for i in range(len(samp_n_off) - 1):
    cum_len_n_off.append(cum_len_n_off[-1] + (samp_n_off[i+1] - samp_n_off[i]).length)

idx_split_n = min(range(len(samp_n_off)), key=lambda i: (samp_n_off[i].x - 2206.0)**2 + (samp_n_off[i].y - (-2567.4))**2)
len_decel_n = cum_len_n_off[idx_split_n]
len_descent_n = cum_len_n_off[-1] - len_decel_n

z_n_off = []
for i in range(len(samp_n_off)):
    d = cum_len_n_off[i]
    if d <= len_decel_n:
        z_n_off.append(BRIDGE_Z)
    else:
        t = (d - len_decel_n) / len_descent_n
        z_n_off.append(BRIDGE_Z - smoothstep(t) * (BRIDGE_Z - SPLIT_Z))

build_road_ribbon("AS18_North_OffRamp_Road", samp_n_off, norm_n_off, width=5.5, z_coords=z_n_off)
build_marking_line("AS18_North_OffRamp_Line_L", samp_n_off, norm_n_off, offset=2.50, width=0.20, z_coords=z_n_off, trim_ends=2)
build_marking_line("AS18_North_OffRamp_Line_R", samp_n_off, norm_n_off, offset=-2.50, width=0.20, z_coords=z_n_off, trim_ends=2)

print("-> Thiết kế hệ thống mạng lưới đường nút giao hoàn chỉnh 100%.")

# -------------------------------------------------------------------------
# 6. BỐ TRÍ CÂY CỐI ROADSCAPE CHÍNH XÁC (CÓ EXCLUSION ZONE)
# -------------------------------------------------------------------------
# Lấy danh sách tim đường Werler Straße để tránh trồng cây đè lên
obj_w = bpy.data.objects.get("Werler_Strasse_4Lanes_Underpass")
if obj_w:
    w_pts = [v.co for v in obj_w.data.vertices]
    # Lấy mẫu tâm Werler Straße
    w_samp = [Vector((2318.0 + (y - (-2500))*0.03, y, 0.0)) for y in range(-2900, -2100, 20)]
    all_road_polylines.append(w_samp)

# Hàm kiểm tra khoảng cách an toàn tới mọi mặt đường (tối thiểu 7.5m)
def is_safe_tree_loc(tx, ty, min_dist=7.5):
    p = Vector((tx, ty, 0.0))
    for poly in all_road_polylines:
        for r_pt in poly:
            if (p.x - r_pt.x)**2 + (p.y - r_pt.y)**2 < (min_dist * min_dist):
                return False
    # Kiểm tra dải lưu không cao tốc A2 (Y từ -2600 đến -2545)
    if -2605 <= ty <= -2540:
        return False
    return True

tree_assets = [
    bpy.data.objects.get('RSEA LOD Tree Dense Leafy'),
    bpy.data.objects.get('RSEA LOD Tree Medium'),
    bpy.data.objects.get('RSEA LOD Tree Pine'),
    bpy.data.objects.get('RSEA LOD Tree Small')
]
tree_assets = [t for t in tree_assets if t is not None]
streetlight_asset = bpy.data.objects.get('RSEA Env Streetlight')

random.seed(42)
tree_count = 0

def place_tree(base_obj, x, y, z, scale_factor=1.0):
    global tree_count
    t_obj = bpy.data.objects.new(f"Roadscape_Tree_{tree_count:04d}", base_obj.data)
    col_nature.objects.link(t_obj)
    t_obj.location = (x, y, z)
    yaw = random.uniform(0.0, 2.0 * math.pi)
    t_obj.rotation_euler = (0.0, 0.0, yaw)
    sc = scale_factor * random.uniform(0.85, 1.25)
    t_obj.scale = (sc, sc, sc)
    tree_count += 1
    return t_obj

# A. Rừng cây lòng vòng xuyến Nam (X: 2160 - 2260, Y: -2685 đến -2605)
attempts = 0
while tree_count < 45 and attempts < 300:
    attempts += 1
    ang = random.uniform(0.0, 2.0 * math.pi)
    r = random.uniform(6.0, 36.0)
    tx = 2215.0 + math.cos(ang) * r
    ty = -2648.0 + math.sin(ang) * (r * 0.85)
    if is_safe_tree_loc(tx, ty, min_dist=7.5):
        tz = max(0.05, 1.6 * (1.0 - (r / 40.0)))
        base_t = random.choice(tree_assets)
        place_tree(base_t, tx, ty, tz, scale_factor=0.95)

# B. Cụm cây lòng vòng xuyến Bắc (X: 2160 - 2250, Y: -2530 đến -2460)
n_trees_north = 0
attempts = 0
while n_trees_north < 35 and attempts < 300:
    attempts += 1
    ang = random.uniform(0.0, 2.0 * math.pi)
    r = random.uniform(6.0, 30.0)
    tx = 2210.0 + math.cos(ang) * r
    ty = -2505.0 + math.sin(ang) * (r * 0.80)
    if is_safe_tree_loc(tx, ty, min_dist=7.5):
        base_t = random.choice(tree_assets)
        place_tree(base_t, tx, ty, 0.05, scale_factor=0.90)
        n_trees_north += 1

# C. Hàng cây dọc Werler Straße (offset an toàn ~11-13m)
for wy in range(-2850, -2150, 30):
    if -2635 <= wy <= -2555: continue # Không trồng cây che hầm chui
    for sx in [2302.0, 2340.0]:
        tx = sx + random.uniform(-1.0, 1.0)
        ty = wy + random.uniform(-2.0, 2.0)
        if is_safe_tree_loc(tx, ty, min_dist=6.5):
            base_t = random.choice(tree_assets)
            place_tree(base_t, tx, ty, 0.05, scale_factor=1.0)

# D. Rừng thông xanh dọc chân taluy Autobahn A2
pine_asset = bpy.data.objects.get('RSEA LOD Tree Pine') or random.choice(tree_assets)
for ax in range(1930, 2460, 24):
    if 2280 <= ax <= 2345: continue
    for ay in [-2622.0, -2528.0]:
        tx = ax + random.uniform(-2.0, 2.0)
        ty = ay + random.uniform(-2.0, 2.0)
        if is_safe_tree_loc(tx, ty, min_dist=8.0):
            place_tree(pine_asset, tx, ty, 0.05, scale_factor=1.1)

print(f"-> Đã bố trí {tree_count} cây Roadscape chất lượng cao hoàn toàn không lấn mặt đường.")

# E. Cột đèn đường Roadscape (RSEA Env Streetlight) dọc Werler Straße
light_count = 0
if streetlight_asset:
    for wy in range(-2820, -2180, 40):
        if -2625 <= wy <= -2565: continue
        for sx, rot_z in [(2324.0, 0.0), (2310.0, math.pi)]:
            sl_obj = bpy.data.objects.new(f"Roadscape_Streetlight_{light_count:03d}", streetlight_asset.data)
            col_nature.objects.link(sl_obj)
            sl_obj.location = (sx, wy, 0.15)
            sl_obj.rotation_euler = (0.0, 0.0, rot_z)
            light_count += 1
    print(f"-> Đã bố trí {light_count} cột đèn đường chuẩn Roadscape.")

# -------------------------------------------------------------------------
# 7. LƯU MAINFILE
# -------------------------------------------------------------------------
bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== THỰC THI HOÀN TẤT THÀNH CÔNG RỰC RỠ! ===")
print("=====================================================================")
