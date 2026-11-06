import bpy, json, math
from mathutils.bvhtree import BVHTree
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/public/maps/roads_full.glb')
road = next(o for o in bpy.data.objects if o.type=='MESH' and 'Roads' in o.name)
verts = [(v.co.x, v.co.y) for v in road.data.vertices]
# BVH 2D đơn giản: grid bucket
GRID = 40
cells = {}
for i, (x, y) in enumerate(verts):
    cells.setdefault((int(x//GRID), int(y//GRID)), []).append(i)
def nearest(x, y):
    cx, cy = int(x//GRID), int(y//GRID)
    best = 1e18
    for gx in range(cx-2, cx+3):
        for gy in range(cy-2, cy+3):
            for i in cells.get((gx, gy), ()):
                dx = verts[i][0]-x; dy = verts[i][1]-y
                d = dx*dx+dy*dy
                if d < best: best = d
    return math.sqrt(best) if best < 1e17 else 999

osm = json.load(open(r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/scratch/osm_full_graph_frame.json', encoding='utf-8'))
nodes = osm['node_locations']
from collections import Counter
missing = Counter(); total = Counter()
for w in osm['ways']:
    pts = [(nodes[n]['x'], nodes[n]['y']) for n in w['node_ids']]
    mid = pts[len(pts)//2]
    total[w['highway']] += 1
    if nearest(mid[0], -mid[1]) > 9:
        missing[w['highway']] += 1
print('missing ribbons by type:', dict(missing))
print('total by type:', dict(total))
