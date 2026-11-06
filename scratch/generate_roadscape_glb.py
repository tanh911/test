import bpy, json
from mathutils import Vector

LIB = r"G:\road\Roadscape\Roadscape\Roadscape v4.13.10 (Asset Library)\Roadscape 4 (Release).blend"
OSM_JSON = r"G:\road\osm_road_data.json"
OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch"
GLB_OUT = OUT + r"\roadscape_generated.glb"
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
m[sock('Show Support')] = False
m[sock('Display Support')] = False
m[sock('Display Sidewalks')] = False

# Demo area reference (nơi generation ĐÃ CHỨNG MINH hoạt động với data của tôi)
old_verts = [tuple(v.co) for v in o.data.vertices]
demo_cx = (min(v[0] for v in old_verts) + max(v[0] for v in old_verts)) / 2
demo_cy = (min(v[1] for v in old_verts) + max(v[1] for v in old_verts)) / 2
demo_z = sum(v[2] for v in old_verts) / len(old_verts)

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

# Mesh OSM đặt tại vùng demo (z theo terrain demo) — config đã chứng minh sinh ribbon
verts, edges, creases, bws = [], [], [], []
for hw, pts in my_ways:
    start = len(verts)
    for (x, y) in pts:
        verts.append((x - my_cx + demo_cx, y - my_cy + demo_cy, demo_z + 0.3))
        creases.append(WIDTH_M[hw] / MAX_WIDTH)
        bws.append(0.5)
    for i in range(len(pts) - 1):
        edges.append((start + i, start + i + 1))

me = bpy.data.meshes.new("RS_OSM_Final")
me.from_pydata(verts, edges, [])
me.update()
cv = me.attributes.new('crease_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    cv.data[i].value = creases[i]
bw = me.attributes.new('bevel_weight_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    bw.data[i].value = bws[i]
o.data = me
print(f"carrier mesh: {len(verts)} verts, {len(edges)} edges @ demo area")

# Render kiểm tra trước khi apply
cam = bpy.data.cameras.new('TC'); cam.type = 'ORTHO'; cam.ortho_scale = 1600
co = bpy.data.objects.new('TCam', cam)
bpy.context.scene.collection.objects.link(co)
co.location = (demo_cx, demo_cy, 400)
sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 1500; sc.render.resolution_y = 1000
sc.camera = co
sc.render.filepath = OUT + r"\audit_shots\gen_precheck.png"
bpy.ops.render.render(write_still=True)
print("precheck rendered")

# ── APPLY modifier → real mesh ──
bpy.context.view_layer.objects.active = o
o.select_set(True)
bpy.ops.object.modifier_apply(modifier=m.name)
print("applied. result verts:", len(o.data.vertices), "polys:", len(o.data.polygons))

# ── Dịch trả về toạ độ OSM gốc + z về 0 ──
OFF = Vector((demo_cx - my_cx, demo_cy - my_cy, 0.0))
zmin = min((v.co.z for v in o.data.vertices), default=0.0)
for v in o.data.vertices:
    v.co.x -= OFF.x
    v.co.y -= OFF.y
    v.co.z -= (demo_z + 0.3)  # z=0 là mặt đường chuẩn
o.data.update()
xs = [v.co.x for v in o.data.vertices]; ys = [v.co.y for v in o.data.vertices]
print(f"back to OSM frame: x[{min(xs):.0f},{max(xs):.0f}] y[{min(ys):.0f},{max(ys):.0f}]")

# ── Export GLB: scene mới chỉ chứa object đường (bypass mọi khóa selection của library) ──
import os
# Material gốc của generator tham chiếu UVMap không tồn tại trên mesh applied → exporter crash.
# Web tự áp texture riêng nên thay bằng material PBR đơn giản + UV rỗng.
o.data.uv_layers.new(name="UVMap")
mat = bpy.data.materials.new("Road_Auto_Asphalt")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.045, 0.048, 0.052, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.85
o.data.materials.clear()
o.data.materials.append(mat)
print("material simplified, uv added")

for c in list(o.users_collection):
    c.objects.unlink(o)
exp_scene = bpy.data.scenes.new("EXPORT_ROADS")
bpy.context.window.scene = exp_scene
exp_scene.collection.objects.link(o)
bpy.context.view_layer.objects.active = o
o.hide_set(False)
o.hide_select = False
o.hide_viewport = False
o.hide_render = False
print("new scene objects:", [ob.name for ob in exp_scene.objects], "| polys:", len(o.data.polygons))
print("uv layers:", [uv.name for uv in o.data.uv_layers])
print("attrs:", [(a.name, a.domain) for a in o.data.attributes])
bpy.ops.export_scene.gltf(filepath=GLB_OUT, use_selection=False, export_format='GLB',
                          export_materials='NONE', export_apply=False)
print("exported GLB:", GLB_OUT, os.path.getsize(GLB_OUT), "bytes")

# Render driving view kiểm tra cuối (trong toạ độ OSM, dùng exp_scene)
cam2 = bpy.data.cameras.new('DC'); cam2.lens = 35
co2 = bpy.data.objects.new('DCam', cam2)
exp_scene.collection.objects.link(co2)
co2.location = (my_cx - 150, my_cy - 300, 40)
tgt = bpy.data.objects.new('DTgt', None)
tgt.location = (my_cx, my_cy, 0)
exp_scene.collection.objects.link(tgt)
con = co2.constraints.new('TRACK_TO'); con.target = tgt
con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
exp_scene.camera = co2
exp_scene.render.engine = 'BLENDER_WORKBENCH'
exp_scene.display.shading.light = 'STUDIO'
exp_scene.display.shading.color_type = 'MATERIAL'
exp_scene.display.shading.show_cavity = True
exp_scene.render.resolution_x = 1500
exp_scene.render.resolution_y = 900
bpy.context.window.scene = exp_scene
sc2 = bpy.context.scene
sc2.render.filepath = OUT + r"\audit_shots\gen_final_driving.png"
bpy.ops.render.render(write_still=True)
print("done")
