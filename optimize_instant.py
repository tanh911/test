import bpy
import bmesh

file_path = r"G:\road\autobahn.blend"

print("--- INSTANT LIGHTWEIGHT OPTIMIZATION ---")

# 1. Turn ON Performance Mode in Roadscape modifier to prevent viewport freeze
gen_obj = bpy.data.objects.get('Roadscape Main Generator')
if gen_obj:
    for m in gen_obj.modifiers:
        if m.type == 'NODES':
            # Turn ON Performance Mode (Socket_29)
            m['Socket_29'] = True
            print(" Enabled Performance Mode (Socket_29 = True)")
            
            # Reduce curve and mesh subdivisions
            if 'Socket_470' in m: m['Socket_470'] = 10.0 # Resampling length 10m
            if 'Socket_472' in m: m['Socket_472'] = 1    # Path subd level 1
            if 'Socket_9' in m:   m['Socket_9'] = 1      # Subdivision level 1
            if 'Socket_14' in m:  m['Socket_14'] = 0     # Far subd level 0
            if 'Socket_16' in m:  m['Socket_16'] = 0     # Med subd level 0
            if 'Socket_18' in m:  m['Socket_18'] = 0     # Close subd level 0
            print(" Updated Geometry Nodes subdivision parameters")

# 2. Clean 'Areas' mesh (remove doubles in bmesh directly, NO depsgraph evaluation)
areas_obj = bpy.data.objects.get('Areas')
if areas_obj and areas_obj.type == 'MESH':
    bm = bmesh.new()
    bm.from_mesh(areas_obj.data)
    orig_v = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.1)
    bm.to_mesh(areas_obj.data)
    bm.free()
    areas_obj.data.update()
    print(f" Areas mesh: {orig_v:,} -> {len(areas_obj.data.vertices):,} vertices")

# 3. Clean 'Ways' mesh
ways_obj = bpy.data.objects.get('Ways')
if ways_obj and ways_obj.type == 'MESH':
    bm = bmesh.new()
    bm.from_mesh(ways_obj.data)
    orig_w = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.1)
    bm.to_mesh(ways_obj.data)
    bm.free()
    ways_obj.data.update()
    print(f" Ways mesh: {orig_w:,} -> {len(ways_obj.data.vertices):,} vertices")

# Save updated blend file
bpy.ops.wm.save_mainfile(filepath=file_path)
print("\nFINISHED! File saved successfully.")
