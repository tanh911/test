import bpy
import bmesh

print("=== FAST FIX FOR AUTOBAHN.BLEND ===")

blend_file = r"G:\road\autobahn.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file, load_ui=False)

# 1. Turn on Performance Mode & Turn off viewport display of Roadscape modifier temporarily
gen_obj = bpy.data.objects.get('Roadscape Main Generator')
if gen_obj:
    for m in gen_obj.modifiers:
        if m.type == 'NODES':
            m.show_viewport = True
            m['Socket_29'] = True    # Performance Mode = True
            m['Socket_470'] = 10.0   # Resampling Length = 10.0m
            m['Socket_472'] = 1      # Path Subd Level = 1
            m['Socket_9'] = 1        # Subdivision Level = 1
            print("  Updated Roadscape 4 modifier settings (Performance Mode = ON)")

# 2. Aggressively decimate 'Areas' mesh (from 238,000 to ~15,000 vertices)
areas_obj = bpy.data.objects.get('Areas')
if areas_obj and areas_obj.type == 'MESH':
    orig_v = len(areas_obj.data.vertices)
    bm = bmesh.new()
    bm.from_mesh(areas_obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.2)
    bm.to_mesh(areas_obj.data)
    bm.free()
    
    # Decimate ratio 0.1
    dec = areas_obj.modifiers.new(name="FixDecimate", type='DECIMATE')
    dec.ratio = 0.1
    bpy.context.view_layer.objects.active = areas_obj
    bpy.ops.object.modifier_apply(modifier=dec.name)
    print(f"  Areas Mesh: {orig_v:,} -> {len(areas_obj.data.vertices):,} vertices")

# 3. Save optimized file
bpy.ops.wm.save_mainfile(filepath=blend_file)
print("=== AUTOBAHN.BLEND IS NOW FIXED AND OPTIMIZED ===")
