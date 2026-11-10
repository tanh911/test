import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/roadscape_generated.glb')
objs = [o for o in bpy.data.objects if o.type == 'MESH']
print('imported meshes:', [(o.name, len(o.data.vertices), len(o.data.polygons)) for o in objs])
xs, ys = [], []
for o in objs:
    for v in o.data.vertices:
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
sc.render.filepath = r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/audit_shots/glb_verify_top.png'
bpy.ops.render.render(write_still=True)
print('verify done, span', round(span))
