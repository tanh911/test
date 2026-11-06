import bpy, json, math
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/public/maps/roads_full.glb')
road = next(o for o in bpy.data.objects if o.type=='MESH' and 'Roads' in o.name)
mark = next(o for o in bpy.data.objects if o.type=='MESH' and 'Markings' in o.name)

osm = json.load(open(r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/osm_full_graph_frame.json', encoding='utf-8'))
nodes = osm['node_locations']
a2 = [w for w in osm['ways'] if w['highway']=='motorway']
best = max(a2, key=lambda w: len(w['node_ids']))
pts = [(nodes[n]['x'], nodes[n]['y']) for n in best['node_ids']]
mid = Vector((pts[len(pts)//2][0], -pts[len(pts)//2][1], 0))
nxt = Vector((pts[len(pts)//2+2][0], -pts[len(pts)//2+2][1], 0))
dirv = (nxt-mid); dirv.z=0; dirv.normalize()
nor = Vector((-dirv.y, dirv.x, 0))

def cross_section(ob, label):
    offs = []
    for v in ob.data.vertices:
        d = Vector((v.co.x, v.co.y, 0)) - mid
        along = d.dot(dirv); lat = d.dot(nor)
        if abs(along) < 40 and abs(lat) < 30:
            offs.append(round(lat, 1))
    offs.sort()
    clusters = []
    for o in offs:
        if clusters and o - clusters[-1][-1] < 0.8: clusters[-1].append(o)
        else: clusters.append([o])
    print(label, 'clusters:')
    for c in clusters:
        if len(c) >= 3: print('   [%+.1f .. %+.1f] n=%d' % (c[0], c[-1], len(c)))

cross_section(road, 'ROADS')
cross_section(mark, 'MARKINGS')
