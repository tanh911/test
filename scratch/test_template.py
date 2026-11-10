import bpy
o = next(o for o in bpy.data.objects if 'Main Generator WIP OSM' in o.name and not o.name.endswith('.001'))
m = o.modifiers[0]
ng = m.node_group
for it in ng.interface.items_tree:
    if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name == 'Wireframe Only':
        m[it.identifier] = False
        print('wireframe off on', repr(o.name))
# bounds của mesh template để canh camera
xs = [v.co.x for v in o.data.vertices]; ys = [v.co.y for v in o.data.vertices]
cx, cy = (min(xs)+max(xs))/2, (min(ys)+max(ys))/2
span = max(max(xs)-min(xs), max(ys)-min(ys))
print('template bounds center', round(cx), round(cy), 'span', round(span))
cam = bpy.data.cameras.new('T'); cam.type = 'ORTHO'; cam.ortho_scale = span*1.2
co = bpy.data.objects.new('TCam', cam); bpy.context.scene.collection.objects.link(co)
co.location = (cx, cy, 300)
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 1400; sc.render.resolution_y = 900
sc.camera = co
sc.render.filepath = r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/audit_shots/template_test.png'
bpy.ops.render.render(write_still=True)
print('done')
