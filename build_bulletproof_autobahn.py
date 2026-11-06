import bpy

print("=== BUILDING BULLETPROOF ULTRA LIGHT AUTOBAHN ===")

src_blend = r"G:\road\autobahn_test1.blend"
dst_blend = r"G:\road\simple_autobahn.blend"

bpy.ops.wm.open_mainfile(filepath=src_blend, load_ui=False)

# Make sure scene settings are optimized
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'

# Save to simple_autobahn.blend
bpy.ops.wm.save_as_mainfile(filepath=dst_blend)

depsgraph = bpy.context.evaluated_depsgraph_get()
eval_total = sum(len(obj.evaluated_get(depsgraph).data.vertices) for obj in bpy.data.objects if obj.type == 'MESH' and obj.evaluated_get(depsgraph).data)

print(f"SUCCESSFULLY SAVED TO {dst_blend}")
print(f"TOTAL EVALUATED VERTICES: {eval_total:,}")
