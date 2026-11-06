import bpy
import bmesh

file_path = r"G:\road\autobahn.blend"

print("--- STARTING FAST OPTIMIZATION ---")

# 1. Optimize 'Areas' Mesh (Merge vertices close to each other & fast decimate)
areas_obj = bpy.data.objects.get('Areas')
if areas_obj and areas_obj.type == 'MESH':
    bm = bmesh.new()
    bm.from_mesh(areas_obj.data)
    orig_v = len(bm.verts)
    
    # Remove redundant doubles
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.05)
    bm.to_mesh(areas_obj.data)
    bm.free()
    areas_obj.data.update()
    
    # Decimate modifier
    dec = areas_obj.modifiers.new(name="QuickDecimate", type='DECIMATE')
    dec.decimate_type = 'COLLAPSE'
    dec.ratio = 0.3
    
    bpy.context.view_layer.objects.active = areas_obj
    bpy.ops.object.modifier_apply(modifier=dec.name)
    print(f"Areas: {orig_v:,} -> {len(areas_obj.data.vertices):,} vertices.")

# 2. Optimize 'Ways' Mesh
ways_obj = bpy.data.objects.get('Ways')
if ways_obj and ways_obj.type == 'MESH':
    bm = bmesh.new()
    bm.from_mesh(ways_obj.data)
    orig_w = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.05)
    bm.to_mesh(ways_obj.data)
    bm.free()
    ways_obj.data.update()
    print(f"Ways: {orig_w:,} -> {len(ways_obj.data.vertices):,} vertices.")

# 3. Adjust Roadscape Generator Geometry Node parameters
gen_obj = bpy.data.objects.get('Roadscape Main Generator')
if gen_obj:
    for m in gen_obj.modifiers:
        if m.type == 'NODES':
            if 'Socket_470' in m: m['Socket_470'] = 8.0  # Resampling Length (4 -> 8)
            if 'Socket_472' in m: m['Socket_472'] = 1    # Path Subd (3 -> 1)
            if 'Socket_9' in m:   m['Socket_9'] = 1      # Subd Level (2 -> 1)
            if 'Socket_14' in m:  m['Socket_14'] = 0     # Far Subd (1 -> 0)
            if 'Socket_16' in m:  m['Socket_16'] = 0     # Med Subd (1 -> 0)
            if 'Socket_18' in m:  m['Socket_18'] = 0     # Close Subd (1 -> 0)

# Save file
bpy.ops.wm.save_mainfile(filepath=file_path)
print("SUCCESSFULLY OPTIMIZED AND SAVED FILE.")
