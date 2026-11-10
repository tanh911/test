import bpy, json
from mathutils import Vector

LIB = r"G:\road\Roadscape\Roadscape\Roadscape v4.13.10 (Asset Library)\Roadscape 4 (Release).blend"
OSM_JSON = r"G:\road\osm_road_data.json"
OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"
MAX_WIDTH = 250.0
WIDTH_M = {"motorway": 32.0, "motorway_link": 9.0, "primary": 15.0,
           "secondary": 12.0, "secondary_link": 8.0, "tertiary": 11.0}

o = next(o for o in bpy.data.objects if o.name == 'Roadscape Main Generator WIP OSM')
m = o.modifiers[0]
ng = m.node_group

def sock(name, nth=0):
    k = 0
    for it in ng.interface.items_tree:
        if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name == name:
            if k == nth:
                return it.identifier
            k += 1
    return None

m[sock('Wireframe Only')] = False
m[sock('Show Road')] = True

old_me = o.data
old_verts = [tuple(v.co) for v in old_me.vertices]
old_creases = [d.value for d in old_me.attributes['crease_vert'].data]
old_bw = [d.value for d in old_me.attributes['bevel_weight_vert'].data] if 'bevel_weight_vert' in old_me.attributes else [0.5]*len(old_verts)

# Vùng demo: center + Z trung bình
demo_cx = (min(v[0] for v in old_verts) + max(v[0] for v in old_verts)) / 2
demo_cy = (min(v[1] for v in old_verts) + max(v[1] for v in old_verts)) / 2
demo_z = sum(v[2] for v in old_verts) / len(old_verts)
print(f"demo center ({demo_cx:.0f},{demo_cy:.0f}) avg z {demo_z:.2f}")

# OSM của tôi → dịch vào THẲNG vùng demo (center trùng), Z = demo_z + 0.3
with open(OSM_JSON, encoding='utf-8') as f:
    osm = json.load(f)
nodes_map = osm.get('node_locations', {})
my_ways = []
for way in osm.get('ways', []):
    hw = way.get('highway', '')
    if hw not in WIDTH_M:
        continue
    pts = [(nd['x'], nd['y']) for nid in way.get('node_ids', [])
           if (nd := nodes_map.get(str(nid)))]
    if len(pts) >= 2:
        my_ways.append((hw, pts))
my_cx = (min(p[0] for _, wp in my_ways for p in wp) + max(p[0] for _, wp in my_ways for p in wp)) / 2
my_cy = (min(p[1] for _, wp in my_ways for p in wp) + max(p[1] for _, wp in my_ways for p in wp)) / 2

verts, edges, creases, bws = [], [], [], []
for hw, pts in my_ways:
    start = len(verts)
    for (x, y) in pts:
        verts.append((x - my_cx + demo_cx, y - my_cy + demo_cy, demo_z + 0.3))
        creases.append(WIDTH_M[hw] / MAX_WIDTH)
        bws.append(0.5)
    for i in range(len(pts) - 1):
        edges.append((start + i, start + i + 1))

me = bpy.data.meshes.new("OSMOnDemo")
me.from_pydata(verts, edges, [])
me.update()
cv = me.attributes.new('crease_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    cv.data[i].value = creases[i]
bw = me.attributes.new('bevel_weight_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    bw.data[i].value = bws[i]
o.data = me
print(f"OSM moved onto demo area: {len(verts)} verts, {len(edges)} edges")

cam = bpy.data.cameras.new('TC'); cam.type = 'ORTHO'; cam.ortho_scale = 1400
co = bpy.data.objects.new('TCam', cam); bpy.context.scene.collection.objects.link(co)
co.location = (demo_cx, demo_cy, 400)
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 1500; sc.render.resolution_y = 1000
sc.camera = co
sc.render.filepath = OUT + r"\osm_on_demo_area.png"
bpy.ops.render.render(write_still=True)
print("done")
