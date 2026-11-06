import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/roadscape_generated.glb')
roads = next(o for o in bpy.data.objects if 'Main Generator WIP OSM' in o.name)
for o in list(bpy.data.objects):
    if o != roads:
        bpy.data.objects.remove(o, do_unlink=True)
# dọn data mồ côi
for _ in range(3):
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
print('kept:', [(o.name, len(o.data.polygons)) for o in bpy.data.objects if o.type=='MESH'])
print('materials:', [m.name for m in bpy.data.materials])

xs, ys = [], []
for v in roads.data.vertices:
    xs.append(v.co.x); ys.append(v.co.y)
cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
span = max(max(xs)-min(xs), max(ys)-min(ys))
sc = bpy.context.scene
cam = bpy.data.cameras.new('T'); cam.type = 'ORTHO'; cam.ortho_scale = span*1.05
co = bpy.data.objects.new('TCam', cam); sc.collection.objects.link(co)
co.location = (cx, cy, 500)
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 1500; sc.render.resolution_y = 1000
sc.camera = co
sc.render.filepath = r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/audit_shots/roads_clean_top.png'
bpy.ops.render.render(write_still=True)

# export GLB sach
import os
out = r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/roads_clean.glb'
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_materials='NONE')
print('clean glb:', out, os.path.getsize(out), 'bytes')
