import bpy
import bmesh

file_path = r"G:\road\autobahn.blend"

print("==========================================")
print("     AUTOBAHN.BLEND OPTIMIZATION SCRIPT    ")
print("==========================================")

# 1. Inspect Initial State
depsgraph = bpy.context.evaluated_depsgraph_get()

print("\n--- INITIAL STATS ---")
initial_total_raw_verts = 0
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        initial_total_raw_verts += len(obj.data.vertices)
        print(f"Raw Object '{obj.name}': Vertices={len(obj.data.vertices):,}, Polygons={len(obj.data.polygons):,}")

initial_eval_total_verts = 0
for obj in bpy.data.objects:
    eval_obj = obj.evaluated_get(depsgraph)
    if eval_obj.type == 'MESH' and eval_obj.data:
        v_cnt = len(eval_obj.data.vertices)
        initial_eval_total_verts += v_cnt
        print(f"Eval Object '{obj.name}': Vertices={v_cnt:,}, Polygons={len(eval_obj.data.polygons):,}")

print(f"\nINITIAL RAW VERTICES TOTAL:  {initial_total_raw_verts:,}")
print(f"INITIAL EVAL VERTICES TOTAL: {initial_eval_total_verts:,}")

# 2. Optimize 'Areas' Mesh (Merge by distance & Decimate planar/collapse)
areas_obj = bpy.data.objects.get('Areas')
if areas_obj and areas_obj.type == 'MESH':
    print("\n--- OPTIMIZING 'Areas' MESH ---")
    bm = bmesh.new()
    bm.from_mesh(areas_obj.data)
    orig_v = len(bm.verts)
    
    # Remove doubles (merge vertices closer than 0.1m)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.1)
    
    # Dissolve planar faces (flat terrain faces)
    bmesh.ops.dissolve_limit(bm, angle_limit=0.0872665, verts=bm.verts, edges=bm.edges) # 5 degrees
    
    bm.to_mesh(areas_obj.data)
    bm.free()
    areas_obj.data.update()
    
    # Also add Decimate modifier with ratio 0.3 for collapse if still high
    dec = areas_obj.modifiers.new(name="AutoDecimate", type='DECIMATE')
    dec.decimate_type = 'COLLAPSE'
    dec.ratio = 0.35
    
    # Apply modifier directly to mesh data
    bpy.context.view_layer.objects.active = areas_obj
    bpy.ops.object.modifier_apply(modifier=dec.name)
    
    print(f"Areas mesh reduced from {orig_v:,} to {len(areas_obj.data.vertices):,} vertices.")

# 3. Optimize 'Ways' Mesh (Merge by distance & Dissolve degenerate)
ways_obj = bpy.data.objects.get('Ways')
if ways_obj and ways_obj.type == 'MESH':
    print("\n--- OPTIMIZING 'Ways' MESH ---")
    bm = bmesh.new()
    bm.from_mesh(ways_obj.data)
    orig_w_v = len(bm.verts)
    
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.1)
    bm.to_mesh(ways_obj.data)
    bm.free()
    ways_obj.data.update()
    print(f"Ways mesh reduced from {orig_w_v:,} to {len(ways_obj.data.vertices):,} vertices.")

# 4. Optimize 'Roadscape Main Generator' Geometry Nodes Modifier
gen_obj = bpy.data.objects.get('Roadscape Main Generator')
if gen_obj:
    print("\n--- OPTIMIZING 'Roadscape Main Generator' MODIFIER ---")
    for m in gen_obj.modifiers:
        if m.type == 'NODES':
            # Adjust Resampling Length from 4.0 to 8.0 (cuts segment density in half)
            if 'Socket_470' in m:
                m['Socket_470'] = 8.0
                print("  - Resampling Length set to 8.0m (was 4.0m)")
            
            # Adjust Path Subdivision Level from 3 to 1
            if 'Socket_472' in m:
                m['Socket_472'] = 1
                print("  - Path Subdivision Level set to 1 (was 3)")
            
            # Adjust Subdivision Level from 2 to 1
            if 'Socket_9' in m:
                m['Socket_9'] = 1
                print("  - Road Subdivision Level set to 1 (was 2)")
                
            # Terrain subdivision levels to 0
            if 'Socket_14' in m: m['Socket_14'] = 0
            if 'Socket_16' in m: m['Socket_16'] = 0
            if 'Socket_18' in m: m['Socket_18'] = 0
            print("  - Terrain Subdivision Levels set to 0")

# 5. Inspect Final State
depsgraph = bpy.context.evaluated_depsgraph_get()

print("\n--- FINAL STATS ---")
final_total_raw_verts = 0
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        final_total_raw_verts += len(obj.data.vertices)
        print(f"Raw Object '{obj.name}': Vertices={len(obj.data.vertices):,}, Polygons={len(obj.data.polygons):,}")

final_eval_total_verts = 0
for obj in bpy.data.objects:
    eval_obj = obj.evaluated_get(depsgraph)
    if eval_obj.type == 'MESH' and eval_obj.data:
        v_cnt = len(eval_obj.data.vertices)
        final_eval_total_verts += v_cnt
        print(f"Eval Object '{obj.name}': Vertices={v_cnt:,}, Polygons={len(eval_obj.data.polygons):,}")

print(f"\nFINAL RAW VERTICES TOTAL:  {final_total_raw_verts:,}")
print(f"FINAL EVAL VERTICES TOTAL: {final_eval_total_verts:,}")
print(f"RAW VERTICES REDUCTION:   {initial_total_raw_verts - final_total_raw_verts:,} (-{((initial_total_raw_verts - final_total_raw_verts)/initial_total_raw_verts)*100:.1f}%)")
print(f"EVAL VERTICES REDUCTION:  {initial_eval_total_verts - final_eval_total_verts:,} (-{((initial_eval_total_verts - final_eval_total_verts)/initial_eval_total_verts)*100:.1f}%)")

# Save optimized blend file
bpy.ops.wm.save_mainfile(filepath=file_path)
print(f"\nSaved optimized file to: {file_path}")
