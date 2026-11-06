import bpy
import bmesh

source_blend = r"G:\road\autobahn.blend"
target_blend = r"G:\road\simple_autobahn.blend"

print("==================================================")
print(" DỰA VÀO MAP AUTOBAHN.BLEND ĐỂ TẠO MESH ÍT VERTEX  ")
print("==================================================")

# 1. Open original autobahn.blend without UI
bpy.ops.wm.open_mainfile(filepath=source_blend, load_ui=False)

# 2. Optimize 'Ways' (Đường tim từ bản đồ OSM gốc)
ways_obj = bpy.data.objects.get('Ways')
if ways_obj and ways_obj.type == 'MESH':
    bm = bmesh.new()
    bm.from_mesh(ways_obj.data)
    orig_w_verts = len(bm.verts)
    
    # Merge các điểm quá gần nhau trong bán kính 1.5m
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1.5)
    
    # Hòa tan các điểm nằm trên đường thẳng (giảm bớt đỉnh dư thừa)
    dissolve_verts = []
    for v in bm.verts:
        if len(v.link_edges) == 2:
            e1, e2 = v.link_edges
            v1 = e1.other_vert(v)
            v2 = e2.other_vert(v)
            dir1 = (v.co - v1.co).normalized()
            dir2 = (v2.co - v.co).normalized()
            if dir1.dot(dir2) > 0.98: # Góc gần như thẳng
                dissolve_verts.append(v)
    bmesh.ops.dissolve_verts(bm, verts=dissolve_verts)
    
    bm.to_mesh(ways_obj.data)
    bm.free()
    ways_obj.data.update()
    print(f"Ways (Đường tim OSM): {orig_w_verts:,} -> {len(ways_obj.data.vertices):,} vertices")

# 3. Optimize 'Areas' (Mặt đất / Địa hình OSM gốc)
areas_obj = bpy.data.objects.get('Areas')
if areas_obj and areas_obj.type == 'MESH':
    orig_a_verts = len(areas_obj.data.vertices)
    
    bm = bmesh.new()
    bm.from_mesh(areas_obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2.0)
    bm.to_mesh(areas_obj.data)
    bm.free()
    
    # Decimate phẳng giảm 90% vertex của Areas
    dec = areas_obj.modifiers.new(name="LowPolyDecimate", type='DECIMATE')
    dec.decimate_type = 'COLLAPSE'
    dec.ratio = 0.08
    bpy.context.view_layer.objects.active = areas_obj
    bpy.ops.object.modifier_apply(modifier=dec.name)
    print(f"Areas (Mặt đất OSM): {orig_a_verts:,} -> {len(areas_obj.data.vertices):,} vertices")

# 4. Tối ưu thông số Geometry Nodes Roadscape 4
gen_obj = bpy.data.objects.get('Roadscape Main Generator')
if gen_obj:
    for m in gen_obj.modifiers:
        if m.type == 'NODES':
            m.show_viewport = True
            if 'Socket_29' in m:  m['Socket_29'] = False # Tắt Performance Mode để xem 3D đầy đủ
            if 'Socket_470' in m: m['Socket_470'] = 8.0  # Resampling length 8m
            if 'Socket_472' in m: m['Socket_472'] = 1    # Subd level 1
            if 'Socket_9' in m:   m['Socket_9'] = 1      # Subd level 1
            if 'Socket_14' in m:  m['Socket_14'] = 0
            if 'Socket_16' in m:  m['Socket_16'] = 0
            if 'Socket_18' in m:  m['Socket_18'] = 0
            print("Đã tối ưu thông số Geometry Nodes Roadscape 4.")

# 5. Lưu thành file simple_autobahn.blend
bpy.ops.wm.save_as_mainfile(filepath=target_blend)

# Thống kê tổng số vertex sau khi thu gọn
depsgraph = bpy.context.evaluated_depsgraph_get()
eval_total = 0
for obj in bpy.data.objects:
    eval_obj = obj.evaluated_get(depsgraph)
    if eval_obj.type == 'MESH' and eval_obj.data:
        eval_total += len(eval_obj.data.vertices)

print(f"\nTỔNG VERTEX EVALUATED SAU KHI THU GỌN BẢN ĐỒ GỐC: {eval_total:,}")
print(f"ĐÃ LƯU VÀO: {target_blend}")
