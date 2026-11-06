import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix, Euler, Quaternion

print("==========================================================================")
print("=== TÁI THIẾT TOÀN DIỆN MẠNG LƯỚI ĐƯỜNG VÀ NÚT GIAO AS18 HAMM-RHYNERN ===")
print("==========================================================================")

# 0. Thiết lập Object Mode
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
mat_sidewalk = bpy.data.materials.get("Autobahn_Bridge_Concrete") or mat_curb
mat_grass = bpy.data.materials.get("Autobahn_Terrain_Grass") or bpy.data.materials.get("Autobahn_Median_Grass")

# Collections
col_ramps = bpy.data.collections.get("AUTOBAHN_AS18_RAMPS")
col_local = bpy.data.collections.get("WERLER_STRASSE_LOCAL")
col_nature = bpy.data.collections.get("AUTOBAHN_NATURE_TREES")

# 1. Dọn dẹp triệt để các đường cũ và đảo cũ
del_keywords = [
    "AS18_", "Werler_Strasse_", "Werler_West_Splitter", "Werler_East_Splitter",
    "Roadscape_Grove_", "Rhynerner_Strasse_", "Access_Road_"
]
for col in [col_ramps, col_local, col_nature]:
    if col:
        for obj in list(col.objects):
            if any(k in obj.name for k in del_keywords) or "grove" in obj.name.lower():
                bpy.data.objects.remove(obj, do_unlink=True)

# 2. Xóa các khối đất nông nghiệp bị đùn cao sai lệch trong Areas
areas = bpy.data.objects.get("Areas")
if areas:
    bm = bmesh.new()
    bm.from_mesh(areas.data)
    del_faces = []
    for f in bm.faces:
        cen = areas.matrix_world @ f.calc_center_median()
        # Đất nông nghiệp phía Đông Bắc cao tốc
        if cen.x < 2310 and -2480 < cen.y < -2130:
            del_faces.append(f)
    if del_faces:
        bmesh.ops.delete(bm, geom=del_faces, context='FACES_ONLY')
        del_verts = [v for v in bm.verts if not v.link_faces]
        bmesh.ops.delete(bm, geom=del_verts, context='VERTS')
        bm.to_mesh(areas.data)
        areas.data.update()
        print(f"-> Đã xóa {len(del_faces)} mặt đùn sai trong vùng đồng ruộng phía Đông Bắc.")
    bm.free()

# 3. Các hàm hình học đường bộ
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

def build_road_ribbon(name, pts, widths, z_offset=0.0, mat=mat_asphalt, collection=col_local):
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

def build_strip_marking(name, pts, widths, offset_ratio=0.0, line_width=0.20, z_offset=0.02, dashed=False, dash=3.0, gap=3.0, collection=col_local, trim=0):
    normals = compute_normals_2d(pts)
    bm = bmesh.new()
    n = len(pts)
    hw = line_width / 2.0
    
    cum_dist = [0.0]
    for i in range(1, n):
        cum_dist.append(cum_dist[-1] + (pts[i] - pts[i-1]).length)
        
    start_idx = trim
    end_idx = n - trim
    if end_idx <= start_idx:
        start_idx = 0; end_idx = n
        
    for i in range(start_idx, end_idx - 1):
        d_curr = cum_dist[i]
        if dashed:
            phase = d_curr % (dash + gap)
            if phase >= dash:
                continue
                
        p1 = pts[i]; norm1 = normals[i]
        p2 = pts[i+1]; norm2 = normals[i+1]
        
        off1 = offset_ratio * (widths[i] / 2.0)
        off2 = offset_ratio * (widths[i+1] / 2.0)
        
        v1 = bm.verts.new(Vector((p1.x + norm1.x * (off1 + hw), p1.y + norm1.y * (off1 + hw), p1.z + z_offset)))
        v2 = bm.verts.new(Vector((p1.x + norm1.x * (off1 - hw), p1.y + norm1.y * (off1 - hw), p1.z + z_offset)))
        v3 = bm.verts.new(Vector((p2.x + norm2.x * (off2 - hw), p2.y + norm2.y * (off2 - hw), p2.z + z_offset)))
        v4 = bm.verts.new(Vector((p2.x + norm2.x * (off2 + hw), p2.y + norm2.y * (off2 + hw), p2.z + z_offset)))
        bm.faces.new((v1, v2, v3, v4))
        
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat_marking); m.update()
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    return obj

def build_sidewalk_strip(name, pts, widths, side=+1, sw_width=2.5, curb_h=0.15, z_offset=0.04, collection=col_local, gaps=None):
    """
    gaps: list of (y_min, y_max) where sidewalk is omitted for road intersections
    """
    normals = compute_normals_2d(pts)
    bm = bmesh.new()
    n = len(pts)
    
    in_gap = [False] * n
    if gaps:
        for i, p in enumerate(pts):
            for gmin, gmax in gaps:
                if gmin <= p.y <= gmax:
                    in_gap[i] = True
                    break
                    
    i = 0
    while i < n - 1:
        if in_gap[i] or in_gap[i+1]:
            i += 1
            continue
        p1 = pts[i]; norm1 = normals[i]
        p2 = pts[i+1]; norm2 = normals[i+1]
        
        # Mép trong vỉa hè (tiếp giáp mép đường)
        hw1 = widths[i] / 2.0; hw2 = widths[i+1] / 2.0
        in1 = Vector((p1.x + norm1.x * (side * hw1), p1.y + norm1.y * (side * hw1), z_offset))
        in2 = Vector((p2.x + norm2.x * (side * hw2), p2.y + norm2.y * (side * hw2), z_offset))
        
        # Mép ngoài vỉa hè
        out1 = Vector((p1.x + norm1.x * (side * (hw1 + sw_width)), p1.y + norm1.y * (side * (hw1 + sw_width)), z_offset + curb_h))
        out2 = Vector((p2.x + norm2.x * (side * (hw2 + sw_width)), p2.y + norm2.y * (side * (hw2 + sw_width)), z_offset + curb_h))
        
        in1_top = Vector((in1.x, in1.y, z_offset + curb_h))
        in2_top = Vector((in2.x, in2.y, z_offset + curb_h))
        
        v_in1 = bm.verts.new(in1); v_in2 = bm.verts.new(in2)
        v_in1_t = bm.verts.new(in1_top); v_in2_t = bm.verts.new(in2_top)
        v_out1 = bm.verts.new(out1); v_out2 = bm.verts.new(out2)
        
        # Mặt đứng bó vỉa (curb face)
        bm.faces.new((v_in1, v_in2, v_in2_t, v_in1_t))
        # Mặt trên vỉa hè
        bm.faces.new((v_in1_t, v_in2_t, v_out2, v_out1))
        
        i += 1
        
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat_curb); m.update()
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    return obj

# -------------------------------------------------------------------------
# 4. TÁI LẬP TRỤC ĐƯỜNG CHÍNH B63 WERLER STRASSE CHUẨN XÁC 100% THEO OSM
# -------------------------------------------------------------------------
# Tim đường Werler Straße uốn cong nhẹ nhàng, hoàn toàn tránh mọi tòa nhà phía Nam (clearance > 25m)
nodes_werler = [
    (Vector((2365.0, -3004.0, 0.04)), 14.0),
    (Vector((2352.0, -2905.0, 0.04)), 14.0),
    (Vector((2340.0, -2780.0, 0.04)), 14.0),
    (Vector((2331.0, -2684.0, 0.04)), 15.0), # Chỗ nút giao nhánh vòng phía Tây
    (Vector((2326.0, -2620.0, 0.04)), 14.0),
    (Vector((2322.4, -2560.0, 0.04)), 14.0), # Tâm khe trụ cầu cao tốc A2
    (Vector((2318.0, -2500.0, 0.04)), 15.0), # Chỗ nút giao nhánh ra phía Đông
    (Vector((2311.8, -2408.0, 0.04)), 14.0),
    (Vector((2302.0, -2300.0, 0.04)), 14.0),
    (Vector((2293.0, -2215.0, 0.04)), 14.0),
    (Vector((2284.6, -2140.0, 0.04)), 15.0), # Ngã tư Rhynerner Straße
    (Vector((2274.0, -2052.0, 0.04)), 14.0),
    (Vector((2268.0, -2000.0, 0.04)), 14.0)
]

pts_werler, w_werler = catmull_rom_spline_3d(nodes_werler, num_samples_per_seg=14)
build_road_ribbon("Werler_Strasse_4Lanes_Underpass", pts_werler, w_werler, collection=col_local)

# Vạch sơn tim đường kép (double solid line)
build_strip_marking("Werler_Strasse_Line_Center_1", pts_werler, w_werler, offset_ratio=0.012, line_width=0.15, collection=col_local)
build_strip_marking("Werler_Strasse_Line_Center_2", pts_werler, w_werler, offset_ratio=-0.012, line_width=0.15, collection=col_local)

# Vạch phân làn đứt đoạn (dashed lane lines)
build_strip_marking("Werler_Strasse_Dashed_North", pts_werler, w_werler, offset_ratio=0.48, line_width=0.15, dashed=True, dash=3.0, gap=3.0, collection=col_local)
build_strip_marking("Werler_Strasse_Dashed_South", pts_werler, w_werler, offset_ratio=-0.48, line_width=0.15, dashed=True, dash=3.0, gap=3.0, collection=col_local)

# Vạch biên mép đường (solid edge lines)
build_strip_marking("Werler_Strasse_Line_Edge_North", pts_werler, w_werler, offset_ratio=0.92, line_width=0.20, collection=col_local)
build_strip_marking("Werler_Strasse_Line_Edge_South", pts_werler, w_werler, offset_ratio=-0.92, line_width=0.20, collection=col_local)

# Vỉa hè phía Nam (chỉ mở khoảng trống ở 2 hẻm vào khu công nghiệp)
build_sidewalk_strip("Werler_Strasse_Sidewalk_South", pts_werler, w_werler, side=-1, collection=col_local, gaps=[
    (-2720.0, -2695.0),
    (-2520.0, -2490.0)
])

# Vỉa hè phía Bắc (mở khoảng trống ở các nút giao nhánh cao tốc và ngã tư)
build_sidewalk_strip("Werler_Strasse_Sidewalk_North", pts_werler, w_werler, side=+1, collection=col_local, gaps=[
    (-2730.0, -2675.0), # Nhánh vòng Tây
    (-2525.0, -2455.0), # Nhánh ra Đông
    (-2155.0, -2125.0)  # Ngã tư Rhynerner Straße
])

# -------------------------------------------------------------------------
# 5. NHÁNH VÒNG PHÍA TÂY (WEST LOOP RAMP) KẾT NỐI LIỀN MẠCH VỚI B63
# -------------------------------------------------------------------------
nodes_west_loop = [
    (Vector((2323.0, -2684.0, 0.04)), 6.5), # Nối liền vào mép lòng đường Werler Straße
    (Vector((2295.0, -2688.0, 0.08)), 6.2),
    (Vector((2250.0, -2693.5, 0.20)), 6.0),
    (Vector((2216.5, -2694.4, 0.35)), 6.0),
    (Vector((2200.0, -2694.0, 0.65)), 6.0),
    (Vector((2183.7, -2687.3, 1.35)), 6.0),
    (Vector((2174.2, -2682.5, 2.25)), 6.0),
    (Vector((2166.1, -2676.2, 3.15)), 6.0),
    (Vector((2155.5, -2664.1, 4.05)), 6.0),
    (Vector((2153.0, -2644.7, 4.75)), 6.0),
    (Vector((2152.9, -2636.7, 5.05)), 6.0), # Đỉnh vòng xoay chữ U (Apex)
    (Vector((2154.7, -2628.4, 5.25)), 6.0),
    (Vector((2160.1, -2616.9, 5.40)), 6.0),
    (Vector((2167.9, -2606.6, 5.50)), 6.0),
    (Vector((2181.7, -2597.9, 5.55)), 6.0),
    (Vector((2196.1, -2592.0, 5.55)), 5.5),
    (Vector((2212.0, -2585.0, 5.55)), 4.5), # Làn tăng tốc song song A2
    (Vector((2240.0, -2583.0, 5.55)), 3.75),
    (Vector((2265.0, -2581.5, 5.55)), 2.0),
    (Vector((2280.0, -2580.5, 5.55)), 0.15) # Vuốt mịn vào Standstreifen
]

pts_w_loop, w_w_loop = catmull_rom_spline_3d(nodes_west_loop, num_samples_per_seg=14)
build_road_ribbon("AS18_West_Loop_Ramp_Road", pts_w_loop, w_w_loop, collection=col_ramps)
build_strip_marking("AS18_West_Loop_Ramp_Line_L", pts_w_loop, w_w_loop, offset_ratio=0.92, line_width=0.22, collection=col_ramps)
build_strip_marking("AS18_West_Loop_Ramp_Line_R", pts_w_loop, w_w_loop, offset_ratio=-0.92, line_width=0.22, collection=col_ramps)

# Nhánh rẽ phải từ Werler Straße vào nhánh vòng (West Entrance Slip)
nodes_west_slip = [
    (Vector((2335.0, -2725.0, 0.04)), 5.0), # Nối liền vào mép làn ngoài Werler Straße
    (Vector((2323.0, -2710.0, 0.05)), 5.0),
    (Vector((2310.0, -2698.0, 0.06)), 5.2),
    (Vector((2295.0, -2688.0, 0.08)), 6.0)  # Nhập mượt vào thân nhánh vòng
]
pts_w_slip, w_w_slip = catmull_rom_spline_3d(nodes_west_slip, num_samples_per_seg=12)
build_road_ribbon("AS18_West_Entrance_Slip_Road", pts_w_slip, w_w_slip, collection=col_local)
build_strip_marking("AS18_West_Entrance_Slip_Line_R", pts_w_slip, w_w_slip, offset_ratio=-0.92, line_width=0.22, collection=col_local)

# Đảo phân luồng phía Tây (Werler_West_Splitter_Island)
def create_splitter_island(name, boundary_pts, height=0.14, z_base=0.04, mat_curb=mat_curb, collection=col_local):
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

create_splitter_island("Werler_West_Splitter_Island", [
    (2323.0, -2692.0),
    (2306.0, -2692.0),
    (2314.0, -2702.0),
    (2323.0, -2708.0)
])

# -------------------------------------------------------------------------
# 6. NHÁNH RA PHÍA ĐÔNG (EAST DIRECT OFF-RAMP) GỌN GÀNG THEO SATELLITE
# -------------------------------------------------------------------------
# Trong ảnh vệ tinh, nhánh ra ôm sát gò đồi cây xanh (Y ~ -2505), không đi xa ra đồng ruộng
nodes_east_ramp = [
    (Vector((2170.0, -2556.0, 5.55)), 0.15), # Tách vuốt êm từ làn ngoài A2 Dortmund
    (Vector((2182.0, -2548.0, 5.40)), 3.5),
    (Vector((2196.0, -2534.0, 4.90)), 5.5),
    (Vector((2212.0, -2518.0, 4.00)), 6.0),
    (Vector((2230.0, -2508.0, 2.90)), 6.0),
    (Vector((2252.0, -2505.0, 1.80)), 6.0),
    (Vector((2275.0, -2505.0, 0.70)), 6.0),
    (Vector((2292.0, -2505.0, 0.20)), 6.0)  # Điểm rẽ tách nhánh tại Werler Straße
]
pts_e_ramp, w_e_ramp = catmull_rom_spline_3d(nodes_east_ramp, num_samples_per_seg=14)
build_road_ribbon("AS18_East_OffRamp_Road", pts_e_ramp, w_e_ramp, collection=col_ramps)
build_strip_marking("AS18_East_OffRamp_Line_L", pts_e_ramp, w_e_ramp, offset_ratio=0.92, line_width=0.22, collection=col_ramps)
build_strip_marking("AS18_East_OffRamp_Line_R", pts_e_ramp, w_e_ramp, offset_ratio=-0.92, line_width=0.22, collection=col_ramps)

# Nhánh rẽ phải nhập vào Werler Straße hướng Hamm (East Slip Lane)
nodes_east_slip = [
    (Vector((2292.0, -2505.0, 0.20)), 5.0),
    (Vector((2298.0, -2496.0, 0.14)), 5.0),
    (Vector((2304.0, -2484.0, 0.08)), 5.0),
    (Vector((2310.0, -2470.0, 0.05)), 5.0),
    (Vector((2315.0, -2455.0, 0.04)), 5.0)  # Hòa mượt vào mép làn ngoài Werler Straße
]
pts_e_slip, w_e_slip = catmull_rom_spline_3d(nodes_east_slip, num_samples_per_seg=12)
build_road_ribbon("AS18_East_SlipLane_Road", pts_e_slip, w_e_slip, collection=col_local)
build_strip_marking("AS18_East_SlipLane_Line_R", pts_e_slip, w_e_slip, offset_ratio=-0.92, line_width=0.22, collection=col_local)

# Nhánh rẽ trái / đi thẳng chờ đèn giao thông
nodes_east_direct = [
    (Vector((2292.0, -2505.0, 0.20)), 5.5),
    (Vector((2304.0, -2506.0, 0.10)), 6.0),
    (Vector((2318.0, -2507.0, 0.04)), 6.5)  # Giao vuông góc bằng phẳng vào tim Werler Straße
]
pts_e_dir, w_e_dir = catmull_rom_spline_3d(nodes_east_direct, num_samples_per_seg=10)
build_road_ribbon("AS18_East_Direct_Road", pts_e_dir, w_e_dir, collection=col_local)
build_strip_marking("AS18_East_Direct_Line_L", pts_e_dir, w_e_dir, offset_ratio=0.92, line_width=0.22, collection=col_local)

# Đảo phân luồng phía Đông (Werler_East_Splitter_Island)
create_splitter_island("Werler_East_Splitter_Island", [
    (2317.0, -2502.0),
    (2299.0, -2502.0),
    (2306.0, -2488.0),
    (2317.0, -2475.0)
])

# -------------------------------------------------------------------------
# 7. CÁC TUYẾN ĐƯỜNG KẾT NỐI KHU ĐÔ THỊ / CÔNG NGHIỆP VÀ NGOẠI Ô
# -------------------------------------------------------------------------
# 7.1. Ngã tư Rhynerner Straße (K18) tại mép đông cánh đồng (Y ~ -2140)
# Nhánh Bắc: Chạy dọc mép đông cánh đồng nông nghiệp
nodes_rhynern_north = [
    (Vector((2284.6, -2140.0, 0.04)), 7.0),
    (Vector((2230.0, -2140.0, 0.04)), 7.0),
    (Vector((2150.0, -2140.0, 0.04)), 7.0),
    (Vector((2050.0, -2140.0, 0.04)), 7.0)
]
pts_rh_n, w_rh_n = catmull_rom_spline_3d(nodes_rhynern_north, num_samples_per_seg=10)
build_road_ribbon("Rhynerner_Strasse_North", pts_rh_n, w_rh_n, collection=col_local)
build_strip_marking("Rhynerner_Strasse_North_Line_Center", pts_rh_n, w_rh_n, offset_ratio=0.0, line_width=0.15, dashed=True, dash=3.0, gap=3.0, collection=col_local)

# Nhánh Nam: Chạy vào khu dân cư phía Nam
nodes_rhynern_south = [
    (Vector((2284.6, -2140.0, 0.04)), 7.0),
    (Vector((2340.0, -2140.0, 0.04)), 7.0),
    (Vector((2420.0, -2140.0, 0.04)), 7.0),
    (Vector((2480.0, -2140.0, 0.04)), 7.0)
]
pts_rh_s, w_rh_s = catmull_rom_spline_3d(nodes_rhynern_south, num_samples_per_seg=10)
build_road_ribbon("Rhynerner_Strasse_South", pts_rh_s, w_rh_s, collection=col_local)
build_strip_marking("Rhynerner_Strasse_South_Line_Center", pts_rh_s, w_rh_s, offset_ratio=0.0, line_width=0.15, dashed=True, dash=3.0, gap=3.0, collection=col_local)

# 7.2. Đường nhánh vào bãi hậu cần công nghiệp (Y ~ -2505, phía Nam Werler Straße)
nodes_access_east = [
    (Vector((2318.0, -2505.0, 0.04)), 6.0),
    (Vector((2350.0, -2505.0, 0.04)), 6.0),
    (Vector((2410.0, -2505.0, 0.04)), 6.0)
]
pts_acc_e, w_acc_e = catmull_rom_spline_3d(nodes_access_east, num_samples_per_seg=8)
build_road_ribbon("Access_Road_Industrial_Depot", pts_acc_e, w_acc_e, collection=col_local)

# 7.3. Đường nhánh vào khu thương mại phía Tây Nam (Y ~ -2705)
nodes_access_west = [
    (Vector((2330.0, -2705.0, 0.04)), 6.0),
    (Vector((2365.0, -2705.0, 0.04)), 6.0),
    (Vector((2415.0, -2705.0, 0.04)), 6.0)
]
pts_acc_w, w_acc_w = catmull_rom_spline_3d(nodes_access_west, num_samples_per_seg=8)
build_road_ribbon("Access_Road_Commercial_West", pts_acc_w, w_acc_w, collection=col_local)

# -------------------------------------------------------------------------
# 8. TẠO MẶT ĐẤT ĐỒNG RUỘNG PHÍA ĐÔNG BẮC (NORTHEAST CROPLAND)
# -------------------------------------------------------------------------
# Tạo mảng xanh nông nghiệp rộng lớn phẳng phiu thay cho các khối nhà đùn sai cũ
def create_cropland_meadow(name, x_range, y_range, z=0.02, mat=mat_grass, collection=col_local):
    bm = bmesh.new()
    v1 = bm.verts.new(Vector((x_range[0], y_range[0], z)))
    v2 = bm.verts.new(Vector((x_range[1], y_range[0], z)))
    v3 = bm.verts.new(Vector((x_range[1], y_range[1], z)))
    v4 = bm.verts.new(Vector((x_range[0], y_range[1], z)))
    bm.faces.new((v1, v2, v3, v4))
    m = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(m); bm.free()
    m.materials.append(mat); m.update()
    obj = bpy.data.objects.new(name, m)
    collection.objects.link(obj)
    return obj

create_cropland_meadow("Farmland_Northeast_GreenField", (2050.0, 2300.0), (-2495.0, -2145.0))

# -------------------------------------------------------------------------
# 9. CÂY XANH ROADSCAPE BỐ TRÍ CHUẨN XÁC 100% THEO ẢNH VỆ TINH
# -------------------------------------------------------------------------
tree_dense = bpy.data.objects.get('RSEA LOD Tree Dense Leafy')
tree_medium = bpy.data.objects.get('RSEA LOD Tree Medium')
tree_small = bpy.data.objects.get('RSEA LOD Tree Small')
tree_pool = [t for t in [tree_dense, tree_medium, tree_small] if t is not None]

random.seed(999)
t_count = 0

def plant(x, y, z=0.05, sc=1.2):
    global t_count
    base_t = random.choice(tree_pool)
    t = bpy.data.objects.new(f"Roadscape_Grove_{t_count:04d}", base_t.data)
    col_nature.objects.link(t)
    t.location = (x, y, z)
    t.rotation_euler = (0, 0, random.uniform(0, 6.28))
    s = sc * random.uniform(0.9, 1.35)
    t.scale = (s, s, s)
    t_count += 1
    return t

# 1. Rừng rậm bầu dục bên trong nhánh vòng chữ U (West Loop)
for _ in range(95):
    u = random.random(); v = random.random()
    angle = u * 2.0 * math.pi
    r = math.sqrt(v)
    cx = 2220.0 + r * 38.0 * math.cos(angle)
    cy = -2620.0 + r * 20.0 * math.sin(angle)
    plant(cx, cy, z=0.05, sc=1.3)

# 2. Hàng cây viền ngoài che chắn kho hàng phía Tây
for x_step in range(2150, 2300, 10):
    plant(x_step + random.uniform(-1.5, 1.5), -2706.0 + random.uniform(-2, 2), z=0.05, sc=1.1)

# 3. Khóm cây bầu dục nằm trên gò đất bên trong nhánh ra phía Đông (X~2205, Y~-2530)
for _ in range(28):
    u = random.random(); v = random.random()
    angle = u * 2.0 * math.pi
    r = math.sqrt(v)
    cx = 2205.0 + r * 12.0 * math.cos(angle)
    cy = -2532.0 + r * 8.0 * math.sin(angle)
    plant(cx, cy, z=0.05, sc=1.2)

# 4. Rặng cây chắn gió rậm rạp dọc ranh giới giữa nhánh ra phía Đông và cánh đồng lớn
for x_step in range(2160, 2300, 8):
    plant(x_step + random.uniform(-1, 1), -2492.0 + random.uniform(-2, 2), z=0.05, sc=1.3)

# 5. Hàng cây dọc đường Rhynerner Straße (K18)
for x_step in range(2060, 2280, 15):
    plant(x_step, -2150.0 + random.uniform(-2, 2), z=0.05, sc=1.1)

# 6. Cây xanh bóng mát dọc đường Werler Straße
for y_pos in range(-2950, -2050, 22):
    if abs(y_pos - (-2565)) > 30 and abs(y_pos - (-2685)) > 20 and abs(y_pos - (-2500)) > 20:
        # Tìm tọa độ X của tim đường tại y_pos
        interp_x = 2322.4 - (y_pos - (-2560.0)) * 0.08
        plant(interp_x + 9.5 + random.uniform(-1, 1), y_pos, z=0.05, sc=1.0)
        plant(interp_x - 9.5 + random.uniform(-1, 1), y_pos, z=0.05, sc=1.0)

print(f"-> Tổng số cây xanh Roadscape đã bố trí: {t_count} cây.")

# Lưu file blend
bpy.ops.wm.save_mainfile()
print("==========================================================================")
print("=== HOÀN TẤT THÀNH CÔNG: ĐÃ TÁI LẬP HỆ THỐNG GIAO THÔNG TOÀN DIỆN!    ===")
print("==========================================================================")
