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

# Đọc mesh gốc template
old_me = o.data
old_verts = [tuple(v.co) for v in old_me.vertices]
old_creases = [d.value for d in old_me.attributes['crease_vert'].data]
old_creases_bw = [d.value for d in old_me.attributes['bevel_weight_vert'].data] if 'bevel_weight_vert' in old_me.attributes else [0.0] * len(old_verts)

# OSM edges của tôi
with open(OSM_JSON, encoding='utf-8') as f:
    osm = json.load(f)
nodes_map = osm.get('node_locations', {})
my_verts, my_edges, my_creases = [], [], []
for way in osm.get('ways', []):
    hw = way.get('highway', '')
    if hw not in WIDTH_M:
        continue
    pts = [nodes_map.get(str(nid)) for nid in way.get('node_ids', [])]
    pts = [nd for nd in pts if nd]
    if len(pts) < 2:
        continue
    start = len(my_verts)
    for nd in pts:
        my_verts.append((nd['x'], nd['y'], nd.get('z', 0.0) + 0.25))
        my_creases.append(WIDTH_M[hw] / MAX_WIDTH)
    for i in range(len(pts) - 1):
        my_edges.append((start + i, start + i + 1))

# DỊCH OSM của tôi sang khu vực template (offset sao cho không chồng lấn)
# template ở (1629,663) span 1101; OSM của tôi ở (-342,-190) span 2744 → dịch +4000 lên X
OFF = Vector((4000.0, 0.0, 0.0))
my_verts_world = [(v[0] + OFF.x, v[1] + OFF.y, v[2]) for v in my_verts]

# Ghép: giữ nguyên demo + thêm OSM của tôi (dịch)
all_verts = old_verts + my_verts_world
all_creases = list(old_creases) + my_creases
all_edges = [(a, b) for (a, b) in old_me.edge_keys] + [(a + len(old_verts), b + len(old_verts)) for (a, b) in my_edges]

me = bpy.data.meshes.new("CombinedMesh")
me.from_pydata(all_verts, all_edges, [])
me.update()
cv = me.attributes.new('crease_vert', 'FLOAT', 'POINT')
for i in range(len(all_verts)):
    cv.data[i].value = all_creases[i]
bw = me.attributes.new('bevel_weight_vert', 'FLOAT', 'POINT')
for i in range(len(all_verts)):
    # demo giữ nguyên giá trị gốc; OSM của tôi = 0.5 (thử nghiệm)
    bw.data[i].value = old_creases_bw[i] if i < len(old_verts) else 0.5
o.data = me

print(f"combined: {len(all_verts)} verts (demo {len(old_verts)} + osm {len(my_verts)})")

# Camera phủ CẢ HAI khu (demo + OSM dịch)
cx = (min(v[0] for v in all_verts) + max(v[0] for v in all_verts)) / 2
cy = (min(v[1] for v in all_verts) + max(v[1] for v in all_verts)) / 2
span_x = max(v[0] for v in all_verts) - min(v[0] for v in all_verts)
span_y = max(v[1] for v in all_verts) - min(v[1] for v in all_verts)
span = max(span_x, span_y)
print(f"combined bounds center ({cx:.0f},{cy:.0f}) span {span:.0f}")

cam = bpy.data.cameras.new('TC'); cam.type = 'ORTHO'; cam.ortho_scale = span * 1.05
co = bpy.data.objects.new('TCam', cam); bpy.context.scene.collection.objects.link(co)
co.location = (cx, cy, 500)
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 1600; sc.render.resolution_y = 1000
sc.camera = co
sc.render.filepath = OUT + r"\bisect_combined.png"
bpy.ops.render.render(write_still=True)
print("done")
