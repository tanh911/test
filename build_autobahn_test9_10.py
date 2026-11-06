import bpy
import bmesh
import math
import random
from mathutils import Vector

print("=====================================================================")
print("=== DỰNG CHUẨN XÁC NÚT GIAO AUTOBAHN A2 & CẦU CAO TỐC (RAA / RMS) ===")
print("=====================================================================")

# -------------------------------------------------------------------------
# 1. VẬT LIỆU PBR HOÀN THIỆN
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

def setup_guardrail(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.75, 0.78, 0.82, 1.0)
    if 'Metallic' in bsdf.inputs:
        bsdf.inputs['Metallic'].default_value = 0.95
    bsdf.inputs['Roughness'].default_value = 0.28
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

def setup_concrete(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.65, 0.66, 0.68, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.70
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

def setup_tunnel_dark(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.20, 0.21, 0.22, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.90
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

def setup_median_grass(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.12, 0.32, 0.14, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.90
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

def setup_terrain_grass(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.15, 0.40, 0.18, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.88
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

def setup_canopy(mat):
    nodes = mat.node_tree.nodes; nodes.clear()
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.07, 0.25, 0.09, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.80
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

mat_asphalt = get_or_create_mat("Autobahn_Asphalt_PBR", setup_asphalt)
mat_marking = get_or_create_mat("Autobahn_Marking_White", setup_marking)
mat_steel = get_or_create_mat("Autobahn_Steel_Guardrail", setup_guardrail)
mat_concrete = get_or_create_mat("Autobahn_Bridge_Concrete", setup_concrete)
mat_tunnel_dark = get_or_create_mat("Autobahn_Tunnel_Ceiling", setup_tunnel_dark)
mat_median = get_or_create_mat("Autobahn_Median_Grass", setup_median_grass)
mat_terrain = get_or_create_mat("Autobahn_Terrain_Grass", setup_terrain_grass)
mat_canopy = get_or_create_mat("Autobahn_Tree_Canopy", setup_canopy)

# -------------------------------------------------------------------------
# 2. QUẢN LÝ COLLECTIONS
# -------------------------------------------------------------------------
def get_or_create_collection(col_name, parent=None):
    if col_name in bpy.data.collections:
        c = bpy.data.collections[col_name]
    else:
        c = bpy.data.collections.new(col_name)
        if parent: parent.children.link(c)
        else: bpy.context.scene.collection.children.link(c)
    return c

col_autobahn = get_or_create_collection("AUTOBAHN_A2")
col_ramps = get_or_create_collection("AUTOBAHN_AS18_RAMPS", col_autobahn)
col_bridge = get_or_create_collection("AUTOBAHN_BRIDGE_STRUCTURE", col_autobahn)
col_local = get_or_create_collection("WERLER_STRASSE_LOCAL", col_autobahn)
col_nature = get_or_create_collection("AUTOBAHN_NATURE_TREES", col_autobahn)
col_env = get_or_create_collection("AUTOBAHN_ENVIRONMENT")

# Dọn dẹp object cũ
for c in [col_autobahn, col_bridge, col_ramps, col_local, col_nature]:
    for obj in list(c.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

# -------------------------------------------------------------------------
# 3. TRÍCH XUẤT TIM ĐƯỜNG AUTOBAHN A2 & THIẾT LẬP CAO ĐỘ CẦU (Z=5.6m)
# -------------------------------------------------------------------------
ways_obj = bpy.data.objects.get("Ways")
vg_m = ways_obj.vertex_groups.get("Tag:highway=motorway")
m_verts_indices = {v.index for v in ways_obj.data.vertices if any(g.group == vg_m.index for g in v.groups)}
m_edges = [e for e in ways_obj.data.edges if e.vertices[0] in m_verts_indices and e.vertices[1] in m_verts_indices]

bm = bmesh.new()
v_map = {vi: bm.verts.new(ways_obj.data.vertices[vi].co) for vi in m_verts_indices}
bm.verts.ensure_lookup_table()
for e in m_edges: bm.edges.new((v_map[e.vertices[0]], v_map[e.vertices[1]]))
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.1)

start_candidates = [v for v in bm.verts if len(v.link_edges) == 1]
start_v = start_candidates[0] if start_candidates else bm.verts[0]
chain = [start_v]
cur_e = start_v.link_edges[0]; cur_v = cur_e.other_vert(start_v)
chain.append(cur_v)

while len(cur_v.link_edges) == 2:
    e1, e2 = cur_v.link_edges
    next_e = e2 if e1 == cur_e else e1
    next_v = next_e.other_vert(cur_v)
    chain.append(next_v)
    cur_e = next_e; cur_v = next_v

raw_pts = [v.co.copy() for v in chain]
bm.free()
if raw_pts[0].x > raw_pts[-1].x: raw_pts.reverse()

def resample_polyline(pts, step=6.0):
    total_len = 0.0; cum_lens = [0.0]
    for i in range(len(pts) - 1):
        total_len += (pts[i+1] - pts[i]).length
        cum_lens.append(total_len)
    num_samples = max(2, int(total_len / step))
    resampled = []
    curr_idx = 0
    for s in range(num_samples + 1):
        target_d = (s / num_samples) * total_len
        while curr_idx < len(cum_lens) - 2 and cum_lens[curr_idx + 1] < target_d: curr_idx += 1
        seg_len = cum_lens[curr_idx + 1] - cum_lens[curr_idx]
        t = (target_d - cum_lens[curr_idx]) / seg_len if seg_len > 0 else 0.0
        resampled.append(pts[curr_idx].lerp(pts[curr_idx + 1], t))
    return resampled, total_len

a2_sampled, a2_total_len = resample_polyline(raw_pts, step=6.0)

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

a2_normals = compute_normals_2d(a2_sampled)

BRIDGE_ELEV = 5.60

def get_a2_elevation(x):
    # Cao độ cầu và dốc tiếp cận
    if 2120.0 <= x <= 2440.0: return BRIDGE_ELEV
    elif 1650.0 <= x < 2120.0:
        t = (x - 1650.0) / (2120.0 - 1650.0)
        return 0.05 + (t * t * (3.0 - 2.0 * t)) * (BRIDGE_ELEV - 0.05)
    elif 2440.0 < x <= 2850.0:
        t = (2850.0 - x) / (2850.0 - 2440.0)
        return 0.05 + (t * t * (3.0 - 2.0 * t)) * (BRIDGE_ELEV - 0.05)
    return 0.05

def create_elevated_ribbon(name, pts, normals, offset_left, offset_right, z_func, z_delta=0.0, mat=mat_asphalt, collection=col_autobahn):
    bm = bmesh.new()
    n = len(pts)
    vl_list = []; vr_list = []
    for i in range(n):
        p = pts[i]; norm = normals[i]
        z_b = z_func(p.x) + z_delta
        vl = bm.verts.new(Vector((p.x + norm.x * offset_left, p.y + norm.y * offset_left, z_b)))
        vr = bm.verts.new(Vector((p.x + norm.x * offset_right, p.y + norm.y * offset_right, z_b)))
        vl_list.append(vl); vr_list.append(vr)
    for i in range(n - 1):
        bm.faces.new((vl_list[i], vr_list[i], vr_list[i+1], vl_list[i+1]))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh); bm.free()
    mesh.materials.append(mat); mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj

# Mặt đường A2 (14m mỗi chiều)
create_elevated_ribbon("A2_Carriageway_Westbound_Dortmund", a2_sampled, a2_normals,
                       offset_left=15.75, offset_right=1.75, z_func=get_a2_elevation, z_delta=0.0, mat=mat_asphalt)
create_elevated_ribbon("A2_Carriageway_Eastbound_Hannover", a2_sampled, a2_normals,
                       offset_left=-1.75, offset_right=-15.75, z_func=get_a2_elevation, z_delta=0.0, mat=mat_asphalt)
create_elevated_ribbon("A2_Central_Median", a2_sampled, a2_normals,
                       offset_left=1.75, offset_right=-1.75, z_func=get_a2_elevation, z_delta=0.02, mat=mat_median)

# Vạch kẻ đường viền mép liền (RMS)
for name, off, w in [("A2_Solid_Standstreifen_West", 15.30, 0.30),
                     ("A2_Solid_Inner_West",         2.10, 0.30),
                     ("A2_Solid_Inner_East",        -2.10, 0.30),
                     ("A2_Solid_Standstreifen_East",-15.30, 0.30)]:
    create_elevated_ribbon(name, a2_sampled, a2_normals,
                           offset_left=off + w/2, offset_right=off - w/2,
                           z_func=get_a2_elevation, z_delta=0.03, mat=mat_marking)

# Vạch đứt phân làn 6m/12m
def create_elevated_dashed(name, pts, normals, offsets, dash_len=6.0, gap_len=12.0, w=0.15):
    bm = bmesh.new()
    total_period = dash_len + gap_len
    cum_d = [0.0]
    for i in range(len(pts) - 1):
        cum_d.append(cum_d[-1] + (pts[i+1] - pts[i]).length)
    tot_len = cum_d[-1]
    num_cycles = int(tot_len / total_period)
    
    def get_pt_norm(d):
        idx = 0
        while idx < len(cum_d) - 2 and cum_d[idx + 1] < d: idx += 1
        seg = cum_d[idx + 1] - cum_d[idx]
        t = (d - cum_d[idx]) / seg if seg > 0 else 0.0
        return pts[idx].lerp(pts[idx + 1], t), normals[idx].lerp(normals[idx + 1], t).normalized()

    for off in offsets:
        for c in range(num_cycles):
            d1 = c * total_period
            d2 = d1 + dash_len
            if d2 > tot_len: break
            p1, n1 = get_pt_norm(d1); p2, n2 = get_pt_norm(d2)
            z1 = get_a2_elevation(p1.x) + 0.03; z2 = get_a2_elevation(p2.x) + 0.03
            vl1 = bm.verts.new(Vector((p1.x + n1.x * (off + w/2), p1.y + n1.y * (off + w/2), z1)))
            vr1 = bm.verts.new(Vector((p1.x + n1.x * (off - w/2), p1.y + n1.y * (off - w/2), z1)))
            vl2 = bm.verts.new(Vector((p2.x + n2.x * (off + w/2), p2.y + n2.y * (off + w/2), z2)))
            vr2 = bm.verts.new(Vector((p2.x + n2.x * (off - w/2), p2.y + n2.y * (off - w/2), z2)))
            bm.faces.new((vl1, vr1, vr2, vl2))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh); bm.free()
    mesh.materials.append(mat_marking); mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    col_autobahn.objects.link(obj)
    return obj

create_elevated_dashed("A2_Dashed_Lane_Markings", a2_sampled, a2_normals, [11.80, 7.20, -7.20, -11.80])

# Hộ lan thép Leitplanken
def create_elevated_guardrail(name, pts, normals, offset_dist, height=0.75):
    bm = bmesh.new()
    n = len(pts)
    v_top = []; v_mid = []; v_bot = []
    for i in range(n):
        p = pts[i]; norm = normals[i]
        z_b = get_a2_elevation(p.x)
        pos = Vector((p.x + norm.x * offset_dist, p.y + norm.y * offset_dist, z_b))
        v_top.append(bm.verts.new(pos + Vector((0, 0, height))))
        v_mid.append(bm.verts.new(pos + norm * 0.06 + Vector((0, 0, height - 0.15))))
        v_bot.append(bm.verts.new(pos + Vector((0, 0, height - 0.30))))
    for i in range(n - 1):
        bm.faces.new((v_top[i], v_mid[i], v_mid[i+1], v_top[i+1]))
        bm.faces.new((v_mid[i], v_bot[i], v_bot[i+1], v_mid[i+1]))
    mesh = bpy.data.meshes.new(name + "_Mesh")
    bm.to_mesh(mesh); bm.free()
    mesh.materials.append(mat_steel); mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    col_autobahn.objects.link(obj)
    return obj

create_elevated_guardrail("A2_Median_Guardrail", a2_sampled, a2_normals, offset_dist=0.0)
create_elevated_guardrail("A2_Outer_Guardrail_West", a2_sampled, a2_normals, offset_dist=16.20)
create_elevated_guardrail("A2_Outer_Guardrail_East", a2_sampled, a2_normals, offset_dist=-16.20)

# -------------------------------------------------------------------------
# 4. KẾT CẤU CẦU CAO TỐC & HẦM CHUI SẠCH SẼ (UNTERFÜHRUNG)
# -------------------------------------------------------------------------
# Khổ hầm chui: Werler Straße chạy qua từ X = 2304 đến X = 2326 (rộng 22m)
# Trần hầm ở Z = 4.60m. Mặt cầu cao tốc ở Z = 5.60m
bx1, bx2 = 2304.0, 2326.0
by1, by2 = -2616.0, -2579.5
c_top, c_bot = 5.60, 4.60

bm_br = bmesh.new()

# Trần hầm chui (vật liệu sẫm màu tạo chiều sâu bóng tối thực tế)
u1 = bm_br.verts.new((bx1, by1, c_bot)); u2 = bm_br.verts.new((bx2, by1, c_bot))
u3 = bm_br.verts.new((bx2, by2, c_bot)); u4 = bm_br.verts.new((bx1, by2, c_bot))
f_soffit = bm_br.faces.new((u4, u3, u2, u1))
f_soffit.material_index = 1

# Hai mố cầu bê tông hai bên hầm chui
for wx, dir_w in [(bx1, -1.0), (bx2, 1.0)]:
    w_pts_b = [bm_br.verts.new((wx, by1, 0.0)), bm_br.verts.new((wx + dir_w*3.0, by1, 0.0)),
               bm_br.verts.new((wx + dir_w*3.0, by2, 0.0)), bm_br.verts.new((wx, by2, 0.0))]
    w_pts_t = [bm_br.verts.new((wx, by1, c_bot)), bm_br.verts.new((wx + dir_w*3.0, by1, c_bot)),
               bm_br.verts.new((wx + dir_w*3.0, by2, c_bot)), bm_br.verts.new((wx, by2, c_bot))]
    for k in range(4):
        f = bm_br.faces.new((w_pts_b[k], w_pts_b[(k+1)%4], w_pts_t[(k+1)%4], w_pts_t[k]))
        f.material_index = 0

# Gờ dầm cầu biên hai bên (Fascia Beams)
for py, dir_p in [(by1, -0.4), (by2, 0.4)]:
    b1 = bm_br.verts.new((bx1, py, c_top)); b2 = bm_br.verts.new((bx2, py, c_top))
    b3 = bm_br.verts.new((bx2, py + dir_p, c_top)); b4 = bm_br.verts.new((bx1, py + dir_p, c_top))
    b1_b = bm_br.verts.new((bx1, py, c_bot)); b2_b = bm_br.verts.new((bx2, py, c_bot))
    b3_b = bm_br.verts.new((bx2, py + dir_p, c_bot)); b4_b = bm_br.verts.new((bx1, py + dir_p, c_bot))
    for f in [bm_br.faces.new((b1, b2, b3, b4)), bm_br.faces.new((b4_b, b3_b, b2_b, b1_b)),
              bm_br.faces.new((b3, b2, b2_b, b3_b)), bm_br.faces.new((b1, b4, b4_b, b1_b)),
              bm_br.faces.new((b4, b3, b3_b, b4_b))]:
        f.material_index = 0

# Lan can an toàn thành cầu
for py, dir_p in [(by1 - 0.4, -0.4), (by2 + 0.4, 0.4)]:
    p1 = bm_br.verts.new((bx1 - 2.0, py, c_top)); p2 = bm_br.verts.new((bx2 + 2.0, py, c_top))
    p3 = bm_br.verts.new((bx2 + 2.0, py + dir_p, c_top)); p4 = bm_br.verts.new((bx1 - 2.0, py + dir_p, c_top))
    p1_t = bm_br.verts.new((bx1 - 2.0, py, c_top + 1.1)); p2_t = bm_br.verts.new((bx2 + 2.0, py, c_top + 1.1))
    p3_t = bm_br.verts.new((bx2 + 2.0, py + dir_p, c_top + 1.1)); p4_t = bm_br.verts.new((bx1 - 2.0, py + dir_p, c_top + 1.1))
    for f in [bm_br.faces.new((p1, p2, p2_t, p1_t)), bm_br.faces.new((p2, p3, p3_t, p2_t)),
              bm_br.faces.new((p3, p4, p4_t, p3_t)), bm_br.faces.new((p4, p1, p1_t, p4_t)),
              bm_br.faces.new((p1_t, p2_t, p3_t, p4_t))]:
        f.material_index = 0

mesh_br = bpy.data.meshes.new("Autobahn_Bridge_Structure_Mesh")
bm_br.to_mesh(mesh_br); bm_br.free()
mesh_br.materials.append(mat_concrete)
mesh_br.materials.append(mat_tunnel_dark)
mesh_br.update()
obj_br = bpy.data.objects.new("Autobahn_Bridge_Structure", mesh_br)
col_bridge.objects.link(obj_br)

# Mái dốc taluy đắp đất thoải hai bên tiếp cận mố cầu
bm_emb = bmesh.new()
for slope_x1, slope_x2 in [(2050.0, bx1), (bx2, 2550.0)]:
    n_seg = 16
    for s in range(n_seg):
        xa = slope_x1 + (slope_x2 - slope_x1) * (s / n_seg)
        xb = slope_x1 + (slope_x2 - slope_x1) * ((s + 1) / n_seg)
        za = get_a2_elevation(xa); zb = get_a2_elevation(xb)
        # Taluy Bắc
        v1 = bm_emb.verts.new((xa, by2, za)); v2 = bm_emb.verts.new((xb, by2, zb))
        v3 = bm_emb.verts.new((xb, by2 + 10.0, 0.0)); v4 = bm_emb.verts.new((xa, by2 + 10.0, 0.0))
        bm_emb.faces.new((v1, v2, v3, v4))
        # Taluy Nam
        u1 = bm_emb.verts.new((xa, by1, za)); u2 = bm_emb.verts.new((xb, by1, zb))
        u3 = bm_emb.verts.new((xb, by1 - 10.0, 0.0)); u4 = bm_emb.verts.new((xa, by1 - 10.0, 0.0))
        bm_emb.faces.new((u4, u3, u2, u1))

mesh_emb = bpy.data.meshes.new("Autobahn_Embankment_Slopes_Mesh")
bm_emb.to_mesh(mesh_emb); bm_emb.free()
mesh_emb.materials.append(mat_terrain); mesh_emb.update()
obj_emb = bpy.data.objects.new("Autobahn_Embankment_Slopes", mesh_emb)
col_bridge.objects.link(obj_emb)

# -------------------------------------------------------------------------
# 5. ĐƯỜNG WERLER STRASSE (B63) 4 LÀN XE + VỈA HÈ QUA HẦM CHUI
# -------------------------------------------------------------------------
vg_prim = ways_obj.vertex_groups.get("Tag:highway=primary")
vg_werler = ways_obj.vertex_groups.get("Name:Werler Straße")
prim_indices = set()
for vg in [vg_prim, vg_werler]:
    if vg: prim_indices.update(v.index for v in ways_obj.data.vertices if any(g.group == vg.index for g in v.groups))
edges_w = [e for e in ways_obj.data.edges if e.vertices[0] in prim_indices and e.vertices[1] in prim_indices]

bm_w = bmesh.new()
v_map_w = {vi: bm_w.verts.new(ways_obj.data.vertices[vi].co) for vi in prim_indices}
bm_w.verts.ensure_lookup_table()
for e in edges_w: bm_w.edges.new((v_map_w[e.vertices[0]], v_map_w[e.vertices[1]]))
bmesh.ops.remove_doubles(bm_w, verts=bm_w.verts, dist=0.1)

crossing_edges = [e for e in bm_w.edges if abs(e.verts[0].co.x - 2315) < 80 and -2950 <= e.verts[0].co.y <= -2100]
if crossing_edges:
    vs_cr = set()
    for ce in crossing_edges: vs_cr.add(ce.verts[0]); vs_cr.add(ce.verts[1])
    sorted_cr_pts = sorted(list(vs_cr), key=lambda v: v.co.y)
    cr_raw = [v.co.copy() for v in sorted_cr_pts]
    cr_samp, _ = resample_polyline(cr_raw, step=6.0)
    cr_norms = compute_normals_2d(cr_samp)
    
    # Mặt đường 4 làn (rộng 13m)
    create_elevated_ribbon("Werler_Strasse_4Lanes_Underpass", cr_samp, cr_norms,
                           offset_left=6.5, offset_right=-6.5, z_func=lambda x: 0.04, mat=mat_asphalt, collection=col_local)
    # Vạch tim đường đứt
    create_elevated_ribbon("Werler_Strasse_Line_Center", cr_samp, cr_norms,
                           offset_left=0.15, offset_right=-0.15, z_func=lambda x: 0.06, mat=mat_marking, collection=col_local)
    create_elevated_ribbon("Werler_Strasse_Line_Edge_L", cr_samp, cr_norms,
                           offset_left=6.35, offset_right=6.05, z_func=lambda x: 0.06, mat=mat_marking, collection=col_local)
    create_elevated_ribbon("Werler_Strasse_Line_Edge_R", cr_samp, cr_norms,
                           offset_left=-6.05, offset_right=-6.35, z_func=lambda x: 0.06, mat=mat_marking, collection=col_local)
    
    # Vỉa hè bê tông 2 bên (Gehweg) cao 0.15m
    create_elevated_ribbon("Werler_Strasse_Sidewalk_L", cr_samp, cr_norms,
                           offset_left=8.5, offset_right=6.5, z_func=lambda x: 0.15, mat=mat_concrete, collection=col_local)
    create_elevated_ribbon("Werler_Strasse_Sidewalk_R", cr_samp, cr_norms,
                           offset_left=-6.5, offset_right=-8.5, z_func=lambda x: 0.15, mat=mat_concrete, collection=col_local)
bm_w.free()

# -------------------------------------------------------------------------
# 6. DỰNG 4 NHÁNH RẼ (RAMPS) LEO DỐC THEO THUẬT TOÁN CHIỀU DÀI CUNG
# -------------------------------------------------------------------------
# Mỗi nhánh rẽ có:
# - Đầu nối Werler Straße (X ~ 2315 - 2330): Z = 0.06m (mặt đất)
# - Đầu nối Autobahn A2 (X ~ 2070 - 2206): Z = 5.60m (mặt cầu cao tốc)
# - Dọc cung đường: độ cao tăng/giảm mượt mà theo tỷ lệ chiều dài cung đường t = s / L!
vg_l = ways_obj.vertex_groups.get("Tag:highway=motorway_link")
l_verts = {v.index for v in ways_obj.data.vertices if any(g.group == vg_l.index for g in v.groups)}
l_edges = [e for e in ways_obj.data.edges if e.vertices[0] in l_verts and e.vertices[1] in l_verts]

bm_r = bmesh.new()
v_map_r = {vi: bm_r.verts.new(ways_obj.data.vertices[vi].co) for vi in l_verts}
bm_r.verts.ensure_lookup_table()
for e in l_edges: bm_r.edges.new((v_map_r[e.vertices[0]], v_map_r[e.vertices[1]]))
bmesh.ops.remove_doubles(bm_r, verts=bm_r.verts, dist=0.1)
bm_r.verts.ensure_lookup_table(); bm_r.edges.ensure_lookup_table()

def dijkstra_path(p_start, p_end):
    vs = min(bm_r.verts, key=lambda v: (v.co - p_start).length)
    ve = min(bm_r.verts, key=lambda v: (v.co - p_end).length)
    import heapq
    q = [(0.0, vs.index, [vs])]
    visited = {}
    while q:
        d, vi, path = heapq.heappop(q)
        if vi in visited and visited[vi] <= d: continue
        visited[vi] = d
        if vi == ve.index: return [v.co.copy() for v in path]
        v = bm_r.verts[vi]
        for e in v.link_edges:
            nv = e.other_vert(v)
            heapq.heappush(q, (d + e.calc_length(), nv.index, path + [nv]))
    return None

# Trích xuất 4 tuyến
raw_s_loop = dijkstra_path(Vector((2327.5, -2641.6, 0)), Vector((2072.0, -2592.3, 0)))
raw_s_dir  = dijkstra_path(Vector((2331.1, -2684.3, 0)), Vector((2208.2, -2583.2, 0)))
raw_n_dir  = dijkstra_path(Vector((2314.4, -2447.1, 0)), Vector((2067.7, -2577.0, 0)))
raw_n_exit = dijkstra_path(Vector((2311.8, -2408.3, 0)), Vector((2206.0, -2567.4, 0)))
bm_r.free()

# Thêm đoạn gia tốc chạy song song cao tốc A2 (150m) cho South Loop
if raw_s_loop:
    for x_acc in [2040.0, 2000.0, 1960.0, 1920.0]:
        raw_s_loop.append(Vector((x_acc, -2592.5 + (2072.0 - x_acc)*0.08, 0.0)))

# Thêm đoạn gia tốc cho North Direct
if raw_n_dir:
    for x_acc in [2030.0, 1990.0, 1950.0, 1910.0]:
        raw_n_dir.append(Vector((x_acc, -2576.0 - (2067.7 - x_acc)*0.06, 0.0)))

ramps_plan = [
    ("AS18_South_Loop_Ramp", raw_s_loop),
    ("AS18_South_Direct_Ramp", raw_s_dir),
    ("AS18_North_Direct_Ramp", raw_n_dir),
    ("AS18_North_Exit_Ramp", raw_n_exit)
]

for r_name, r_raw in ramps_plan:
    if not r_raw or len(r_raw) < 2: continue
    
    # Đảm bảo đầu p_start là Werler Straße (X lớn hơn), đầu p_end là Autobahn (X nhỏ hơn)
    if r_raw[0].x < r_raw[-1].x:
        r_raw.reverse()
        
    r_samp, r_total_len = resample_polyline(r_raw, step=4.0)
    r_norms = compute_normals_2d(r_samp)
    
    # Tính cao độ Z theo khoảng cách dọc cung đường t = s / L
    cum_s = [0.0]
    for i in range(len(r_samp) - 1):
        cum_s.append(cum_s[-1] + (r_samp[i+1] - r_samp[i]).length)
        
    def get_ramp_z(idx):
        t = cum_s[idx] / cum_s[-1] if cum_s[-1] > 0 else 0.0
        # t = 0 (Werler Straße) -> Z = 0.06m
        # t = 1 (Autobahn) -> Z = 5.60m
        st = t * t * (3.0 - 2.0 * t) # smoothstep
        return 0.06 + st * (BRIDGE_ELEV - 0.06)

    # 1. Mặt đường dốc rộng 6.5m
    bm_rp = bmesh.new()
    vl_list = []; vr_list = []
    for i in range(len(r_samp)):
        p = r_samp[i]; norm = r_norms[i]
        zv = get_ramp_z(i)
        vl = bm_rp.verts.new(Vector((p.x + norm.x * 3.25, p.y + norm.y * 3.25, zv)))
        vr = bm_rp.verts.new(Vector((p.x - norm.x * 3.25, p.y - norm.y * 3.25, zv)))
        vl_list.append(vl); vr_list.append(vr)
    for i in range(len(r_samp) - 1):
        bm_rp.faces.new((vl_list[i], vr_list[i], vr_list[i+1], vl_list[i+1]))
    mesh_rp = bpy.data.meshes.new(r_name + "_Mesh")
    bm_rp.to_mesh(mesh_rp); bm_rp.free()
    mesh_rp.materials.append(mat_asphalt); mesh_rp.update()
    obj_rp = bpy.data.objects.new(r_name, mesh_rp)
    col_ramps.objects.link(obj_rp)
    
    # 2. Vạch sơn viền 2 mép nhánh rẽ (RMS)
    bm_rl = bmesh.new()
    for side_sign in [-1.0, 1.0]:
        ll = []; lr = []
        for i in range(len(r_samp)):
            p = r_samp[i]; norm = r_norms[i]
            zv = get_ramp_z(i) + 0.02
            c_off = side_sign * 3.0
            vl = bm_rl.verts.new(Vector((p.x + norm.x * (c_off + 0.15), p.y + norm.y * (c_off + 0.15), zv)))
            vr = bm_rl.verts.new(Vector((p.x + norm.x * (c_off - 0.15), p.y + norm.y * (c_off - 0.15), zv)))
            ll.append(vl); lr.append(vr)
        for i in range(len(r_samp) - 1):
            bm_rl.faces.new((ll[i], lr[i], lr[i+1], ll[i+1]))
    mesh_rl = bpy.data.meshes.new(r_name + "_Line_Mesh")
    bm_rl.to_mesh(mesh_rl); bm_rl.free()
    mesh_rl.materials.append(mat_marking); mesh_rl.update()
    obj_rl = bpy.data.objects.new(r_name + "_Line", mesh_rl)
    col_ramps.objects.link(obj_rl)

print("-> Đã dựng hoàn hảo 4 nhánh rẽ leo dốc liền mạch không ngắt quãng.")

# -------------------------------------------------------------------------
# 7. ĐỒI CỎ & RỪNG CÂY TRONG LÒNG VÒNG XUYẾN (NHƯ ẢNH VỆ TINH GOOGLE EARTH)
# -------------------------------------------------------------------------
# Đồi cỏ thấp bên trong vòng xuyến (Knoll)
bm_knoll = bmesh.new()
k_center = Vector((2225.0, -2645.0, 0.0))
k_center_v = bm_knoll.verts.new((k_center.x, k_center.y, 2.0))
ring_k = []
for ang in [k * (math.pi / 8) for k in range(16)]:
    rx = k_center.x + math.cos(ang) * 44.0
    ry = k_center.y + math.sin(ang) * 38.0
    ring_k.append(bm_knoll.verts.new((rx, ry, 0.0)))
for k in range(16):
    bm_knoll.faces.new((k_center_v, ring_k[k], ring_k[(k+1)%16]))
mesh_knoll = bpy.data.meshes.new("Autobahn_Loop_Green_Knoll_Mesh")
bm_knoll.to_mesh(mesh_knoll); bm_knoll.free()
mesh_knoll.materials.append(mat_terrain); mesh_knoll.update()
obj_knoll = bpy.data.objects.new("Autobahn_Loop_Green_Knoll", mesh_knoll)
col_nature.objects.link(obj_knoll)

# Rừng cây rậm rạp bên trong đồi cỏ vòng xuyến và dọc Werler Straße
random.seed(42)
bm_trees = bmesh.new()
tree_locs = []

# 55 cây trong lòng vòng xuyến
for _ in range(55):
    ang = random.uniform(0, 2 * math.pi)
    r = random.uniform(4.0, 38.0)
    tx = 2225.0 + math.cos(ang) * r
    ty = -2645.0 + math.sin(ang) * (r * 0.85)
    tz = max(0.0, 2.0 * (1.0 - (r / 42.0)))
    tree_locs.append((tx, ty, tz, random.uniform(3.5, 5.2)))

# Hàng cây dọc Werler Straße
for wy in range(-2850, -2200, 25):
    if -2595 <= wy <= -2545: continue
    for side_x in [2303.0, 2337.0]:
        tree_locs.append((side_x + random.uniform(-1.5, 1.5), wy, 0.0, random.uniform(3.0, 4.2)))

for tx, ty, tz, tr in tree_locs:
    h_trunk = tr * 0.55
    c_b = [bm_trees.verts.new((tx + math.cos(a)*0.25, ty + math.sin(a)*0.25, tz)) for a in [0, 1.57, 3.14, 4.71]]
    c_t = [bm_trees.verts.new((tx + math.cos(a)*0.20, ty + math.sin(a)*0.20, tz + h_trunk)) for a in [0, 1.57, 3.14, 4.71]]
    for k in range(4):
        bm_trees.faces.new((c_b[k], c_b[(k+1)%4], c_t[(k+1)%4], c_t[k]))
        
    cz = tz + h_trunk + tr * 0.7
    v_bot = bm_trees.verts.new((tx, ty, tz + h_trunk))
    v_top = bm_trees.verts.new((tx, ty, cz + tr))
    ring1 = [bm_trees.verts.new((tx + math.cos(a)*tr*0.8, ty + math.sin(a)*tr*0.8, cz - tr*0.3)) for a in [0, 1.05, 2.09, 3.14, 4.19, 5.24]]
    ring2 = [bm_trees.verts.new((tx + math.cos(a + 0.5)*tr, ty + math.sin(a + 0.5)*tr, cz + tr*0.2)) for a in [0, 1.05, 2.09, 3.14, 4.19, 5.24]]
    for k in range(6):
        bm_trees.faces.new((v_bot, ring1[k], ring1[(k+1)%6]))
        bm_trees.faces.new((ring1[k], ring2[k], ring2[(k+1)%6], ring1[(k+1)%6]))
        bm_trees.faces.new((v_top, ring2[(k+1)%6], ring2[k]))

mesh_trees = bpy.data.meshes.new("Autobahn_Trees_Forest_Mesh")
bm_trees.to_mesh(mesh_trees); bm_trees.free()
mesh_trees.materials.append(mat_canopy); mesh_trees.update()
obj_trees = bpy.data.objects.new("Autobahn_Trees_Forest", mesh_trees)
col_nature.objects.link(obj_trees)

# -------------------------------------------------------------------------
# 8. MẶT ĐẤT CỎ NỀN & CAMERA CHÂN THỰC
# -------------------------------------------------------------------------
t_base = bpy.data.objects.get("Terrain_Base_Meadow")
if not t_base:
    bm_t = bmesh.new()
    bmesh.ops.create_grid(bm_t, x_segments=10, y_segments=10, size=24000.0)
    mesh_t = bpy.data.meshes.new("Terrain_Base_Meadow_Mesh")
    bm_t.to_mesh(mesh_t); bm_t.free()
    t_base = bpy.data.objects.new("Terrain_Base_Meadow", mesh_t)
    col_env.objects.link(t_base)
    t_base.location = (0, 0, -0.02)
    t_base.data.materials.append(mat_terrain)

cam_aerial = bpy.data.objects.get("Cam_Autobahn_Aerial")
if cam_aerial:
    cam_aerial.location = (2040.0, -2970.0, 235.0)
    cam_aerial.rotation_euler = (math.radians(60.0), 0.0, math.radians(-32.0))

bpy.context.scene.camera = cam_aerial

bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== THIẾT KẾ HOÀN HẢO AUTOBAHN CHO FILE test9_10.blend THÀNH CÔNG ===")
print("=====================================================================")
