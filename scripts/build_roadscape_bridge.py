import bpy
import bmesh
import math
from mathutils import Vector

print("=====================================================================")
print("=== DỰNG CẦU VƯỢT AUTOBAHN A2 CHUẨN ROADSCAPE & KHỚP CAO TỐC 100% ===")
print("=====================================================================")

# -------------------------------------------------------------------------
# 1. THIẾT LẬP VẬT LIỆU ROADSCAPE
# -------------------------------------------------------------------------
mat_deck = bpy.data.materials.get("Bridge Deck.002")
mat_column = bpy.data.materials.get("Bridge Column")
mat_abutment = bpy.data.materials.get("Bridge Abutment 1") or bpy.data.materials.get("Bridge Abutment 2")
mat_rail = bpy.data.materials.get("Bridge Rail")
mat_terrain = bpy.data.materials.get("Autobahn_Terrain_Grass")
mat_concrete = bpy.data.materials.get("Autobahn_Bridge_Concrete")

# Đảm bảo các material đều có node
for m in [mat_deck, mat_column, mat_abutment, mat_rail, mat_terrain, mat_concrete]:
    if m: m.use_nodes = True

# -------------------------------------------------------------------------
# 2. DỌN DẸP TOÀN BỘ CẦU VÀ TALUY BỊ LỆCH CŨ
# -------------------------------------------------------------------------
col_bridge = bpy.data.collections.get("AUTOBAHN_BRIDGE_STRUCTURE")
if not col_bridge:
    col_bridge = bpy.data.collections.new("AUTOBAHN_BRIDGE_STRUCTURE")
    col_autobahn = bpy.data.collections.get("AUTOBAHN_A2")
    if col_autobahn: col_autobahn.children.link(col_bridge)
    else: bpy.context.scene.collection.children.link(col_bridge)

for obj in list(col_bridge.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

# -------------------------------------------------------------------------
# 3. THÔNG SỐ HÌNH HỌC CẦU VƯỢT KHỚP CHÍNH XÁC CAO TỐC A2 & B63
# -------------------------------------------------------------------------
# Tọa độ mặt cắt cao tốc A2 tại điểm giao cắt:
# Chiều Nam (Eastbound Hannover): Y từ -2577.0 đến -2560.5
# Dải phân cách giữa: Y từ -2560.5 đến -2559.0
# Chiều Bắc (Westbound Dortmund): Y từ -2559.0 đến -2542.5
# => Toàn bộ khổ cầu theo trục Y: Y_SOUTH = -2578.5, Y_NORTH = -2542.5 (rộng 36m)
Y_SOUTH = -2578.5
Y_NORTH = -2542.5

# Khổ hầm chui Werler Straße (B63):
# Werler Straße chạy qua từ X = 2314 đến X = 2332
# Hai mố cầu đặt cách mép đường:
# Mố Tây (West Abutment): X = 2302.0 (thân mố từ 2298.5 đến 2302.0)
# Mố Đông (East Abutment): X = 2336.0 (thân mố từ 2336.0 đến 2339.5)
# Nhịp cầu thông xe: 34m
X_WEST_FACE = 2302.0
X_WEST_BACK = 2298.5

X_EAST_FACE = 2336.0
X_EAST_BACK = 2339.5

# Cao độ:
Z_DECK_TOP  = 5.60   # Mặt cầu cao tốc
Z_SOFFIT    = 4.70   # Đáy dầm cầu (khoảng sáng gầm hầm chui = 4.70 - 0.05 = 4.65m)
Z_GROUND    = 0.05   # Mặt đất / vỉa hè Werler Straße

# -------------------------------------------------------------------------
# 4. DỰNG KẾT CẤU BẢN MẶT CẦU & DẦM CHỦ ROADSCAPE (BRIDGE DECK & GIRDERS)
# -------------------------------------------------------------------------
bm_deck = bmesh.new()

# Bản mặt dầm cầu hộp bê tông liền khối (Superstructure Box Slab)
# Đỉnh dầm (Z = 5.60)
d_t1 = bm_deck.verts.new((X_WEST_FACE, Y_SOUTH, Z_DECK_TOP))
d_t2 = bm_deck.verts.new((X_EAST_FACE, Y_SOUTH, Z_DECK_TOP))
d_t3 = bm_deck.verts.new((X_EAST_FACE, Y_NORTH, Z_DECK_TOP))
d_t4 = bm_deck.verts.new((X_WEST_FACE, Y_NORTH, Z_DECK_TOP))

# Đáy dầm (Z = 4.70)
d_b1 = bm_deck.verts.new((X_WEST_FACE, Y_SOUTH, Z_SOFFIT))
d_b2 = bm_deck.verts.new((X_EAST_FACE, Y_SOUTH, Z_SOFFIT))
d_b3 = bm_deck.verts.new((X_EAST_FACE, Y_NORTH, Z_SOFFIT))
d_b4 = bm_deck.verts.new((X_WEST_FACE, Y_NORTH, Z_SOFFIT))

# Mặt đáy (Soffit)
f_soffit = bm_deck.faces.new((d_b4, d_b3, d_b2, d_b1))

# Hai sườn dầm biên dọc cầu (Fascia Side Beams)
# Sườn Nam
bm_deck.faces.new((d_t1, d_t2, d_b2, d_b1))
# Sườn Bắc
bm_deck.faces.new((d_t3, d_t4, d_b4, d_b3))

# Hai gờ chắn bê tông bảo vệ thành cầu (Concrete Parapets / Barriers) cao 1.0m
W_PARAPET = 0.40
H_PARAPET = 1.00

# Parapet Nam
p_s1 = bm_deck.verts.new((X_WEST_FACE - 1.0, Y_SOUTH, Z_DECK_TOP))
p_s2 = bm_deck.verts.new((X_EAST_FACE + 1.0, Y_SOUTH, Z_DECK_TOP))
p_s3 = bm_deck.verts.new((X_EAST_FACE + 1.0, Y_SOUTH + W_PARAPET, Z_DECK_TOP))
p_s4 = bm_deck.verts.new((X_WEST_FACE - 1.0, Y_SOUTH + W_PARAPET, Z_DECK_TOP))

p_st1 = bm_deck.verts.new((X_WEST_FACE - 1.0, Y_SOUTH, Z_DECK_TOP + H_PARAPET))
p_st2 = bm_deck.verts.new((X_EAST_FACE + 1.0, Y_SOUTH, Z_DECK_TOP + H_PARAPET))
p_st3 = bm_deck.verts.new((X_EAST_FACE + 1.0, Y_SOUTH + W_PARAPET, Z_DECK_TOP + H_PARAPET))
p_st4 = bm_deck.verts.new((X_WEST_FACE - 1.0, Y_SOUTH + W_PARAPET, Z_DECK_TOP + H_PARAPET))

for f in [bm_deck.faces.new((p_s1, p_s2, p_st2, p_st1)),
          bm_deck.faces.new((p_s2, p_s3, p_st3, p_st2)),
          bm_deck.faces.new((p_s3, p_s4, p_st4, p_st3)),
          bm_deck.faces.new((p_s4, p_s1, p_st1, p_st4)),
          bm_deck.faces.new((p_st1, p_st2, p_st3, p_st4))]:
    pass

# Parapet Bắc
p_n1 = bm_deck.verts.new((X_WEST_FACE - 1.0, Y_NORTH - W_PARAPET, Z_DECK_TOP))
p_n2 = bm_deck.verts.new((X_EAST_FACE + 1.0, Y_NORTH - W_PARAPET, Z_DECK_TOP))
p_n3 = bm_deck.verts.new((X_EAST_FACE + 1.0, Y_NORTH, Z_DECK_TOP))
p_n4 = bm_deck.verts.new((X_WEST_FACE - 1.0, Y_NORTH, Z_DECK_TOP))

p_nt1 = bm_deck.verts.new((X_WEST_FACE - 1.0, Y_NORTH - W_PARAPET, Z_DECK_TOP + H_PARAPET))
p_nt2 = bm_deck.verts.new((X_EAST_FACE + 1.0, Y_NORTH - W_PARAPET, Z_DECK_TOP + H_PARAPET))
p_nt3 = bm_deck.verts.new((X_EAST_FACE + 1.0, Y_NORTH, Z_DECK_TOP + H_PARAPET))
p_nt4 = bm_deck.verts.new((X_WEST_FACE - 1.0, Y_NORTH, Z_DECK_TOP + H_PARAPET))

for f in [bm_deck.faces.new((p_n1, p_n2, p_nt2, p_nt1)),
          bm_deck.faces.new((p_n2, p_n3, p_nt3, p_nt2)),
          bm_deck.faces.new((p_n3, p_n4, p_nt4, p_nt3)),
          bm_deck.faces.new((p_n4, p_n1, p_nt1, p_nt4)),
          bm_deck.faces.new((p_nt1, p_nt2, p_nt3, p_nt4))]:
    pass

# Thanh tay vịn kim loại lan can cầu (Bridge Railing Handrails)
from mathutils import Matrix
for py, pz in [(Y_SOUTH + W_PARAPET/2, Z_DECK_TOP + H_PARAPET + 0.12),
               (Y_NORTH - W_PARAPET/2, Z_DECK_TOP + H_PARAPET + 0.12)]:
    bmesh.ops.create_cube(bm_deck, size=1.0, matrix=Matrix.Translation((
        (X_WEST_FACE + X_EAST_FACE) / 2.0, py, pz
    )) @ Matrix.Diagonal((X_EAST_FACE - X_WEST_FACE + 2.0, 0.08, 0.06, 1.0)))

mesh_deck = bpy.data.meshes.new("Roadscape_Bridge_Deck_Mesh")
bm_deck.to_mesh(mesh_deck); bm_deck.free()
mesh_deck.materials.append(mat_deck or mat_concrete)
obj_deck = bpy.data.objects.new("Roadscape_Bridge_Deck", mesh_deck)
col_bridge.objects.link(obj_deck)

# -------------------------------------------------------------------------
# 5. DỰNG MỐ CẦU BÊ TÔNG VÀ TƯỜNG CÁNH (ABUTMENTS & WINGWALLS)
# -------------------------------------------------------------------------
bm_abut = bmesh.new()

def build_abutment(x_front, x_back, dir_x):
    # Khối thân mố chính (Abutment Breastwall)
    # 4 đỉnh chân mố (Z = 0.05)
    b1 = bm_abut.verts.new((x_front, Y_SOUTH - 1.5, Z_GROUND))
    b2 = bm_abut.verts.new((x_back,  Y_SOUTH - 1.5, Z_GROUND))
    b3 = bm_abut.verts.new((x_back,  Y_NORTH + 1.5, Z_GROUND))
    b4 = bm_abut.verts.new((x_front, Y_NORTH + 1.5, Z_GROUND))

    # 4 đỉnh đỉnh mố đỡ dầm (Z = 4.70)
    t1 = bm_abut.verts.new((x_front, Y_SOUTH - 1.5, Z_SOFFIT))
    t2 = bm_abut.verts.new((x_back,  Y_SOUTH - 1.5, Z_DECK_TOP))
    t3 = bm_abut.verts.new((x_back,  Y_NORTH + 1.5, Z_DECK_TOP))
    t4 = bm_abut.verts.new((x_front, Y_NORTH + 1.5, Z_SOFFIT))

    # Mặt trước hướng ra hầm chui
    bm_abut.faces.new((b1, b4, t4, t1))
    # Mặt trên đỡ dầm và tường ngực
    bm_abut.faces.new((t1, t4, t3, t2))
    # Hai mặt hông
    bm_abut.faces.new((b2, b1, t1, t2))
    bm_abut.faces.new((b4, b3, t3, t4))

    # Tường cánh mố góc 45 độ giữ đất taluy (Wingwalls)
    # Tường cánh Nam
    w_s_tip_b = bm_abut.verts.new((x_back + dir_x * 8.0, Y_SOUTH - 8.0, Z_GROUND))
    w_s_tip_t = bm_abut.verts.new((x_back + dir_x * 8.0, Y_SOUTH - 8.0, Z_GROUND + 1.2))
    bm_abut.faces.new((b2, w_s_tip_b, w_s_tip_t, t2))

    # Tường cánh Bắc
    w_n_tip_b = bm_abut.verts.new((x_back + dir_x * 8.0, Y_NORTH + 8.0, Z_GROUND))
    w_n_tip_t = bm_abut.verts.new((x_back + dir_x * 8.0, Y_NORTH + 8.0, Z_GROUND + 1.2))
    bm_abut.faces.new((b3, t3, w_n_tip_t, w_n_tip_b))

# Mố Tây (dir_x = -1)
build_abutment(X_WEST_FACE, X_WEST_BACK, -1.0)
# Mố Đông (dir_x = +1)
build_abutment(X_EAST_FACE, X_EAST_BACK, 1.0)

mesh_abut = bpy.data.meshes.new("Roadscape_Bridge_Abutments_Mesh")
bm_abut.to_mesh(mesh_abut); bm_abut.free()
mesh_abut.materials.append(mat_abutment or mat_concrete)
obj_abut = bpy.data.objects.new("Roadscape_Bridge_Abutments", mesh_abut)
col_bridge.objects.link(obj_abut)

# -------------------------------------------------------------------------
# 6. TRỤ CẦU GIỮA BẰNG BÊ TÔNG KHỐI ROADSCAPE (CENTRAL PIERS)
# -------------------------------------------------------------------------
# Đặt tại dải phân cách Werler Straße (X = 2319.0)
bm_pier = bmesh.new()
X_PIER = 2319.0

# Dựng 2 trụ cầu độc lập cho 2 chiều cao tốc:
# Trụ 1: đỡ chiều Hannover (tâm Y = -2569.0)
# Trụ 2: đỡ chiều Dortmund (tâm Y = -2551.0)
for pier_y in [-2569.0, -2551.0]:
    pw = 1.8   # bề rộng theo trục X
    pl = 12.0  # bề dài theo trục Y
    
    # Chân móng trụ
    b1 = bm_pier.verts.new((X_PIER - pw/2, pier_y - pl/2, Z_GROUND))
    b2 = bm_pier.verts.new((X_PIER + pw/2, pier_y - pl/2, Z_GROUND))
    b3 = bm_pier.verts.new((X_PIER + pw/2, pier_y + pl/2, Z_GROUND))
    b4 = bm_pier.verts.new((X_PIER - pw/2, pier_y + pl/2, Z_GROUND))
    
    # Đỉnh trụ xà mũ (Pier Cap tại Z = 4.70m)
    t1 = bm_pier.verts.new((X_PIER - pw/2 - 0.3, pier_y - pl/2 - 0.4, Z_SOFFIT))
    t2 = bm_pier.verts.new((X_PIER + pw/2 + 0.3, pier_y - pl/2 - 0.4, Z_SOFFIT))
    t3 = bm_pier.verts.new((X_PIER + pw/2 + 0.3, pier_y + pl/2 + 0.4, Z_SOFFIT))
    t4 = bm_pier.verts.new((X_PIER - pw/2 - 0.3, pier_y + pl/2 + 0.4, Z_SOFFIT))
    
    bm_pier.faces.new((b1, b2, t2, t1))
    bm_pier.faces.new((b2, b3, t3, t2))
    bm_pier.faces.new((b3, b4, t4, t3))
    bm_pier.faces.new((b4, b1, t1, t4))
    bm_pier.faces.new((t1, t2, t3, t4))

mesh_pier = bpy.data.meshes.new("Roadscape_Bridge_Piers_Mesh")
bm_pier.to_mesh(mesh_pier); bm_pier.free()
mesh_pier.materials.append(mat_column or mat_concrete)
obj_pier = bpy.data.objects.new("Roadscape_Bridge_Piers", mesh_pier)
col_bridge.objects.link(obj_pier)

# -------------------------------------------------------------------------
# 7. TÁI ĐỊNH HÌNH MÁI DỐC TALUY CAO TỐC (EMBANKMENT SLOPES) CHUẨN XÁC 100%
# -------------------------------------------------------------------------
# Hàm cao độ dốc tiếp cận cao tốc A2
def get_a2_elevation(x):
    if 2120.0 <= x <= 2440.0: return 5.60
    elif 1650.0 <= x < 2120.0:
        t = (x - 1650.0) / (2120.0 - 1650.0)
        return 0.05 + (t * t * (3.0 - 2.0 * t)) * (5.60 - 0.05)
    elif 2440.0 < x <= 2850.0:
        t = (2850.0 - x) / (2850.0 - 2440.0)
        return 0.05 + (t * t * (3.0 - 2.0 * t)) * (5.60 - 0.05)
    return 0.05

bm_emb = bmesh.new()

# Hai đoạn taluy tiếp cận hai bên mố cầu:
# Đoạn Tây: từ X = 2050 đến X_WEST_BACK = 2298.5
# Đoạn Đông: từ X_EAST_BACK = 2339.5 đến X = 2550
for slope_x1, slope_x2 in [(2050.0, X_WEST_BACK), (X_EAST_BACK, 2550.0)]:
    n_seg = 24
    for s in range(n_seg):
        xa = slope_x1 + (slope_x2 - slope_x1) * (s / n_seg)
        xb = slope_x1 + (slope_x2 - slope_x1) * ((s + 1) / n_seg)
        za = get_a2_elevation(xa); zb = get_a2_elevation(xb)
        
        # Taluy Bắc: nối từ mép đường phía Bắc (Y_NORTH = -2542.5) thoải ra chân taluy (Y_NORTH + 12m)
        v1 = bm_emb.verts.new((xa, Y_NORTH, za)); v2 = bm_emb.verts.new((xb, Y_NORTH, zb))
        v3 = bm_emb.verts.new((xb, Y_NORTH + 12.0, Z_GROUND)); v4 = bm_emb.verts.new((xa, Y_NORTH + 12.0, Z_GROUND))
        bm_emb.faces.new((v1, v2, v3, v4))
        
        # Taluy Nam: nối từ mép đường phía Nam (Y_SOUTH = -2578.5) thoải ra chân taluy (Y_SOUTH - 12m)
        u1 = bm_emb.verts.new((xa, Y_SOUTH, za)); u2 = bm_emb.verts.new((xb, Y_SOUTH, zb))
        u3 = bm_emb.verts.new((xb, Y_SOUTH - 12.0, Z_GROUND)); u4 = bm_emb.verts.new((xa, Y_SOUTH - 12.0, Z_GROUND))
        bm_emb.faces.new((u4, u3, u2, u1))

mesh_emb = bpy.data.meshes.new("Roadscape_Embankment_Slopes_Mesh")
bm_emb.to_mesh(mesh_emb); bm_emb.free()
mesh_emb.materials.append(mat_terrain); mesh_emb.update()
obj_emb = bpy.data.objects.new("Roadscape_Embankment_Slopes", mesh_emb)
col_bridge.objects.link(obj_emb)

# -------------------------------------------------------------------------
# 8. LƯU MAINFILE
# -------------------------------------------------------------------------
bpy.ops.wm.save_mainfile()
print("=====================================================================")
print("=== THIẾT KẾ CẦU VƯỢT VÀ TALUY ROADSCAPE HOÀN TẤT THÀNH CÔNG RỰC RỠ ===")
print("=====================================================================")
