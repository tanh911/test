import bpy
import bmesh
import math
from mathutils import Vector

print("=====================================================================")
print("=== KHẮC PHỤC TRIỆT ĐỂ LỖI GAI ĐƯỜNG WERLER STRASSE BỊ LỆCH LOOP  ===")
print("=====================================================================")

# -------------------------------------------------------------------------
# 1. VẬT LIỆU
# -------------------------------------------------------------------------
mat_asphalt = bpy.data.materials.get("Autobahn_Asphalt_PBR")
mat_marking = bpy.data.materials.get("Autobahn_Marking_White")
mat_concrete = bpy.data.materials.get("Bridge Deck.002") or bpy.data.materials.get("Autobahn_Bridge_Concrete")

# -------------------------------------------------------------------------
# 2. DỌN DẸP CÁC OBJECT WERLER STRASSE BỊ LỖI CŨ
# -------------------------------------------------------------------------
col_local = bpy.data.collections.get("WERLER_STRASSE_LOCAL")
if not col_local:
    col_local = bpy.data.collections.new("WERLER_STRASSE_LOCAL")
    col_autobahn = bpy.data.collections.get("AUTOBAHN_A2")
    if col_autobahn: col_autobahn.children.link(col_local)
    else: bpy.context.scene.collection.children.link(col_local)

for obj in list(col_local.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# -------------------------------------------------------------------------
# 3. TRÍCH XUẤT TIM ĐƯỜNG CHUẨN XÁC LIÊN TỤC (KHÔNG BỊ LẪN ĐƯỜNG RẼ NHÁNH)
# -------------------------------------------------------------------------
# Danh sách tọa độ tim đường chính Werler Straße (B63) liên tục từ Nam lên Bắc:
# Tuyệt đối không lẫn các vertex của nhánh rẽ sang khu công nghiệp Rudolf-Diesel-Straße
clean_werler_pts = [
    Vector((2352.4, -2905.6, 0.04)),
    Vector((2350.3, -2880.8, 0.04)),
    Vector((2345.0, -2820.0, 0.04)),
    Vector((2337.7, -2762.2, 0.04)),
    Vector((2332.5, -2699.8, 0.04)),
    Vector((2332.2, -2695.1, 0.04)),
    Vector((2331.1, -2684.3, 0.04)),
    Vector((2329.8, -2672.8, 0.04)),
    Vector((2328.6, -2651.5, 0.04)),
    Vector((2327.5, -2641.6, 0.04)),
    Vector((2326.2, -2619.5, 0.04)),
    Vector((2321.7, -2547.1, 0.04)),
    Vector((2318.2, -2498.0, 0.04)),
    Vector((2316.6, -2474.3, 0.04)),
    Vector((2315.2, -2457.9, 0.04)),
    Vector((2314.4, -2447.1, 0.04)),
    Vector((2313.4, -2434.9, 0.04)),
    Vector((2311.8, -2408.3, 0.04)),
    Vector((2309.1, -2366.9, 0.04)),
    Vector((2308.1, -2353.1, 0.04)),
    Vector((2298.0, -2260.0, 0.04)),
    Vector((2293.1, -2215.8, 0.04)),
    Vector((2283.4, -2132.4, 0.04)),
    Vector((2280.2, -2104.0, 0.04))
]

def resample_polyline(pts, step=4.0):
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

def create_elevated_ribbon(name, pts, normals, offset_left, offset_right, z_delta=0.0, mat=mat_asphalt, collection=col_local):
    bm = bmesh.new()
    n = len(pts)
    vl_list = []; vr_list = []
    for i in range(n):
        p = pts[i]; norm = normals[i]
        zv = p.z + z_delta
        vl = bm.verts.new(Vector((p.x + norm.x * offset_left, p.y + norm.y * offset_left, zv)))
        vr = bm.verts.new(Vector((p.x + norm.x * offset_right, p.y + norm.y * offset_right, zv)))
        vl_list.append(vl); vr_list.append(vr)
    for i in range(n - 1):
        bm.faces.new((vl_list[i], vr_list[i], vr_list[i+1], vl_list[i+1]))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh); bm.free()
    mesh.materials.append(mat); mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj

w_sampled, w_total_len = resample_polyline(clean_werler_pts, step=4.0)
w_normals = compute_normals_2d(w_sampled)

# 1. Mặt đường chính Werler Straße (B63) 4 làn xe chuẩn (rộng 13.0m)
create_elevated_ribbon("Werler_Strasse_4Lanes_Underpass", w_sampled, w_normals,
                       offset_left=6.5, offset_right=-6.5, z_delta=0.0, mat=mat_asphalt)

# 2. Vạch tim đường đứt nét kép phân chia 2 chiều
create_elevated_ribbon("Werler_Strasse_Line_Center", w_sampled, w_normals,
                       offset_left=0.15, offset_right=-0.15, z_delta=0.02, mat=mat_marking)

# 3. Vạch mép đường viền trắng liền 2 bên (RMS)
create_elevated_ribbon("Werler_Strasse_Line_Edge_L", w_sampled, w_normals,
                       offset_left=6.35, offset_right=6.10, z_delta=0.02, mat=mat_marking)
create_elevated_ribbon("Werler_Strasse_Line_Edge_R", w_sampled, w_normals,
                       offset_left=-6.10, offset_right=-6.35, z_delta=0.02, mat=mat_marking)

# 4. Vỉa hè bê tông 2 bên (Gehweg) cao 0.15m, rộng 2.0m
create_elevated_ribbon("Werler_Strasse_Sidewalk_L", w_sampled, w_normals,
                       offset_left=8.5, offset_right=6.5, z_delta=0.12, mat=mat_concrete)
create_elevated_ribbon("Werler_Strasse_Sidewalk_R", w_sampled, w_normals,
                       offset_left=-6.5, offset_right=-8.5, z_delta=0.12, mat=mat_concrete)

# -------------------------------------------------------------------------
# 4. ĐỒNG BỘ CỘT ĐÈN ĐƯỜNG VÀ CÂY CỐI ROADSCAPE
# -------------------------------------------------------------------------
col_nature = bpy.data.collections.get("AUTOBAHN_NATURE_TREES")
streetlight_asset = bpy.data.objects.get('RSEA Env Streetlight')

if col_nature and streetlight_asset:
    # Xóa các cột đèn cũ bị đặt lệch theo đường cũ
    for o in list(col_nature.objects):
        if "streetlight" in o.name.lower():
            bpy.data.objects.remove(o, do_unlink=True)
            
    # Bố trí cột đèn mới chạy chuẩn dọc vỉa hè Werler Straße
    light_count = 0
    for s_pt, s_norm in zip(w_sampled[::10], w_normals[::10]):
        # Bỏ qua khu vực gầm cầu vượt (-2600 <= Y <= -2540)
        if -2605 <= s_pt.y <= -2535:
            continue
        for side, offset, rot_yaw in [("L", 7.5, 0.0), ("R", -7.5, math.pi)]:
            sl_obj = bpy.data.objects.new(f"Roadscape_Streetlight_{light_count:03d}", streetlight_asset.data)
            col_nature.objects.link(sl_obj)
            sl_obj.location = (s_pt.x + s_norm.x * offset, s_pt.y + s_norm.y * offset, 0.15)
            # Hướng đèn chiếu vào lòng đường
            base_yaw = math.atan2(s_norm.y, s_norm.x)
            sl_obj.rotation_euler = (0.0, 0.0, base_yaw + rot_yaw)
            light_count += 1
    print(f"-> Đã bố trí {light_count} cột đèn chiếu sáng chuẩn dọc vỉa hè Werler Straße.")

bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== KHẮC PHỤC HOÀN TOÀN THÀNH CÔNG! ===")
print("=====================================================================")
