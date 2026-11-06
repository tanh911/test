import bpy, json
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/roads_clean.glb')
roads = next(o for o in bpy.data.objects if 'Main Generator' in o.name)
osm = json.load(open(r'G:/road/osm_road_data.json', encoding='utf-8'))
nodes = osm['node_locations']
a2 = [w for w in osm['ways'] if w.get('highway')=='motorway']
# way dài nhất
best = max(a2, key=lambda w: len(w.get('node_ids', [])))
pts = [(nodes[str(n)]['x'], nodes[str(n)]['y']) for n in best['node_ids'] if str(n) in nodes]
mid = pts[len(pts)//2]
print('A2 mid:', [round(c) for c in mid])
sc = bpy.context.scene
cam = bpy.data.cameras.new('T'); cam.type='ORTHO'; cam.ortho_scale=160
co = bpy.data.objects.new('TCam', cam); sc.collection.objects.link(co)
# Blender glTF import: (x, z, -y) -> blender frame? glTF +Y up, Blender +Z up: import map (x, -z, y)?? kiem tra bounds
xs=[v.co.x for v in roads.data.vertices]; ys=[v.co.y for v in roads.data.vertices]; zs=[v.co.z for v in roads.data.vertices]
print('imported bounds x[%.0f,%.0f] y[%.0f,%.0f] z[%.2f,%.2f]' % (min(xs),max(xs),min(ys),max(ys),min(zs),max(zs)))
co.location=(mid[0], -mid[1], 100)
sc.render.engine='BLENDER_WORKBENCH'
sc.display.shading.light='STUDIO'
sc.display.shading.color_type='MATERIAL'
sc.display.shading.show_cavity=True
sc.render.resolution_x=1400; sc.render.resolution_y=900
sc.camera=co
sc.render.filepath=r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/audit_shots/a2_closeup.png'
bpy.ops.render.render(write_still=True)
print('done')
