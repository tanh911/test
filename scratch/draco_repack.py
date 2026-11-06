import bpy, os
bpy.ops.wm.read_factory_settings(use_empty=True)
src = r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/public/maps/roads_full.glb'
bpy.ops.import_scene.gltf(filepath=src)
out = r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/public/maps/roads_full.glb'
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_draco_mesh_compression_enable=True)
print('draco exported:', os.path.getsize(out), 'bytes')
