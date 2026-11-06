import bpy, json
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/roadscape_generated.glb')
roads = next(o for o in bpy.data.objects if o.type=='MESH' and 'Main Generator' in o.name)
for o in list(bpy.data.objects):
    if o != roads: bpy.data.objects.remove(o, do_unlink=True)
xs=[v.co.x for v in roads.data.vertices]; ys=[v.co.y for v in roads.data.vertices]; zs=[v.co.z for v in roads.data.vertices]
print('road bounds x[%.0f,%.0f] y[%.0f,%.0f] z[%.2f,%.2f]' % (min(xs),max(xs),min(ys),max(ys),min(zs),max(zs)))
osm = json.load(open(r'G:/road/osm_road_data.json', encoding='utf-8'))
nodes = osm['node_locations']
a2 = [w for w in osm['ways'] if w.get('highway')=='motorway']
best = max(a2, key=lambda w: len(w.get('node_ids', [])))
pts = [(nodes[str(n)]['x'], nodes[str(n)]['y']) for n in best['node_ids'] if str(n) in nodes]
mid = pts[len(pts)//2]
print('A2 mid osm:', [round(c) for c in mid])
sc = bpy.context.scene
cam = bpy.data.cameras.new('T'); cam.type='ORTHO'; cam.ortho_scale=140
co = bpy.data.objects.new('TCam', cam); sc.collection.objects.link(co)
co.location=(mid[0], mid[1], 100)
co.rotation_euler=(0,0,0)
sc.render.engine='BLENDER_WORKBENCH'
sc.display.shading.light='STUDIO'
sc.display.shading.color_type='MATERIAL'
sc.display.shading.show_cavity=True
sc.render.resolution_x=1400; sc.render.resolution_y=900
sc.camera=co
sc.render.filepath=r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/audit_shots/a2_closeup.png'
bpy.ops.render.render(write_still=True)
print('done')
