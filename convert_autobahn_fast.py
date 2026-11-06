import bpy
import bmesh
from bpy.app.handlers import persistent

source_blend = r"G:\road\autobahn.blend"
target_blend = r"G:\road\simple_autobahn.blend"

@persistent
def disable_heavy_eval(dummy):
    gen_obj = bpy.data.objects.get('Roadscape Main Generator')
    if gen_obj:
        for m in gen_obj.modifiers:
            m.show_viewport = False

bpy.app.handlers.load_post.append(disable_heavy_eval)

print("--- OPENING ORIGINAL MAP FAST ---")
bpy.ops.wm.open_mainfile(filepath=source_blend, load_ui=False)

# Make sure all objects are in OBJECT mode
if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')

# 1. Thu gọn 'Ways' (Đường tim OSM gốc)
ways_obj = bpy.data.objects.get('Ways')
if ways_obj and ways_obj.type == 'MESH':
    bpy.context.view_layer.objects.active = ways_obj
    if ways_obj.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
        
    orig_w = len(ways_obj.data.vertices)
    bm = bmesh.new()
    bm.from_mesh(ways_obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1.5)
    
    # Dissolve collinear vertices
    dissolve_verts = []
    for v in bm.verts:
        if len(v.link_edges) == 2:
            e1, e2 = v.link_edges
            v1, v2 = e1.other_vert(v), e2.other_vert(v)
            dir1 = (v.co - v1.co).normalized()
            dir2 = (v2.co - v.co).normalized()
            if dir1.dot(dir2) > 0.98:
                dissolve_verts.append(v)
    bmesh.ops.dissolve_verts(bm, verts=dissolve_verts)
    
    bm.to_mesh(ways_obj.data)
    bm.free()
    ways_obj.data.update()
    print(f"Ways OSM: {orig_w:,} -> {len(ways_obj.data.vertices):,} vertices")

# 2. Thu gọn 'Areas' (Mặt đất OSM gốc)
areas_obj = bpy.data.objects.get('Areas')
if areas_obj and areas_obj.type == 'MESH':
    bpy.context.view_layer.objects.active = areas_obj
    if areas_obj.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
        
    orig_a = len(areas_obj.data.vertices)
    bm = bmesh.new()
    bm.from_mesh(areas_obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2.0)
    bm.to_mesh(areas_obj.data)
    bm.free()
    areas_obj.data.update()
    
    # Decimate low poly
    dec = areas_obj.modifiers.new(name="FastDecimate", type='DECIMATE')
    dec.ratio = 0.08
    bpy.ops.object.modifier_apply(modifier=dec.name)
    print(f"Areas OSM: {orig_a:,} -> {len(areas_obj.data.vertices):,} vertices")

# 3. Tối ưu thông số Roadscape Geometry Nodes
gen_obj = bpy.data.objects.get('Roadscape Main Generator')
if gen_obj:
    for m in gen_obj.modifiers:
        if m.type == 'NODES':
            m.show_viewport = True
            m['Socket_29'] = False  # Bật hiển thị 3D đầy đủ
            m['Socket_470'] = 8.0   # Resampling length 8m
            m['Socket_472'] = 1     # Subd level 1
            m['Socket_9'] = 1       # Subd level 1
            m['Socket_14'] = 0
            m['Socket_16'] = 0
            m['Socket_18'] = 0

# 4. Lưu thành file simple_autobahn.blend
bpy.ops.wm.save_as_mainfile(filepath=target_blend)

depsgraph = bpy.context.evaluated_depsgraph_get()
eval_total = sum(len(obj.evaluated_get(depsgraph).data.vertices) for obj in bpy.data.objects if obj.type == 'MESH' and obj.evaluated_get(depsgraph).data)

print(f"\nCOMPLETED SUCCESSFULLY!")
print(f"TỔNG VERTEX EVALUATED SAU KHI THU GỌN BẢN ĐỒ GỐC: {eval_total:,}")
print(f"SAVED TO: {target_blend}")
