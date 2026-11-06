import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'C:/Users/Tuan Anh/.gemini/antigravity/scratch/viet-de-fuhrerschein/public/maps/roads_full.glb')
road = next(o for o in bpy.data.objects if o.type=='MESH' and 'Roads' in o.name)
mark = next(o for o in bpy.data.objects if o.type=='MESH' and 'Markings' in o.name)
# BVH của markings
from mathutils.bvhtree import BVHTree
mverts = [v.co.copy() for v in mark.data.vertices]
mpolys = [tuple(p.vertices) for p in mark.data.polygons]
mbvh = BVHTree.FromPolygons(mverts, mpolys)
import random
random.seed(1)
roadv = [v.co.copy() for v in road.data.vertices]
sample = random.sample(roadv, min(400, len(roadv)))
dists = []
for co in sample:
    loc, nrm, idx, dist = mbvh.find_nearest(co)
    if dist is not None:
        dists.append(dist)
dists.sort()
n = len(dists)
print('dist road->markings: p10=%.2f p25=%.2f median=%.2f p75=%.2f p90=%.2f' % (
    dists[n//10], dists[n//4], dists[n//2], dists[3*n//4], dists[9*n//10]))
# Với những vert SÁT markings (<=1m): mọi thứ ok. Với những vert xa: đo vector
far = [co for co in sample if mbvh.find_nearest(co)[3] is not None and mbvh.find_nearest(co)[3] > 5]
print('road verts >5m from any marking: %d/%d' % (len(far), len(sample)))
