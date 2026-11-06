import bpy, json, os
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)

LIB = r"G:\road\Roadscape\Roadscape\Roadscape v4.13.10 (Asset Library)\Roadscape 4 (Release).blend"
OSM_JSON = r"G:\road\osm_road_data.json"
OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch"
GLB_OUT = OUT + r"\roads_full.glb"
MAX_WIDTH = 250.0
WIDTH_M = {"motorway": 32.0, "motorway_link": 9.0, "primary": 15.0,
           "secondary": 12.0, "secondary_link": 8.0, "tertiary": 11.0}

# ── 0. OSM data ──
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

# ── 1. Carrier: template object + mesh OSM tại vùng demo (config đã chứng minh) ──
before = set(bpy.data.objects)
with bpy.data.libraries.load(LIB, link=False) as (src, dst):
    dst.objects = ['Roadscape Main Generator WIP OSM']
carrier = next(o for o in bpy.data.objects if o not in before and 'WIP OSM' in o.name)
bpy.context.scene.collection.objects.link(carrier)
cmod = next(m for m in carrier.modifiers if m.node_group and m.node_group.name.startswith('Roadscape 4'))
cng = cmod.node_tree if hasattr(cmod, 'node_tree') else cmod.node_group
cng = cmod.node_group

def sock(ng, name, nth=0):
    k = 0
    for it in ng.interface.items_tree:
        if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name.lower() == name.lower():
            if k == nth:
                return it.identifier
            k += 1
    return None

# demo center (từ mesh demo gốc trước khi thay)
demo_cx = (min(v.co[0] for v in carrier.data.vertices) + max(v.co[0] for v in carrier.data.vertices)) / 2
demo_cy = (min(v.co[1] for v in carrier.data.vertices) + max(v.co[1] for v in carrier.data.vertices)) / 2
demo_z = sum(v.co[2] for v in carrier.data.vertices) / len(carrier.data.vertices)
DX, DY = demo_cx - my_cx, demo_cy - my_cy

verts, edges, creases, bws = [], [], [], []
for hw, pts in my_ways:
    start = len(verts)
    for (x, y) in pts:
        verts.append((x + DX, y + DY, demo_z + 0.3))
        creases.append(WIDTH_M[hw] / MAX_WIDTH)
        bws.append(0.5)
    for i in range(len(pts) - 1):
        edges.append((start + i, start + i + 1))
me = bpy.data.meshes.new("RS_OSM_Carrier")
me.from_pydata(verts, edges, [])
me.update()
cv = me.attributes.new('crease_vert', 'FLOAT', 'POINT')
bw = me.attributes.new('bevel_weight_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    cv.data[i].value = creases[i]
    bw.data[i].value = bws[i]
carrier.data = me
cmod[sock(cng, 'Wireframe Only')] = False
cmod[sock(cng, 'Show Road')] = True
cmod[sock(cng, 'Show Support')] = False
cmod[sock(cng, 'Display Support')] = False
cmod[sock(cng, 'Display Sidewalks')] = False
cmod[sock(cng, 'Output Subdivided Path Mesh for Markings')] = True
print(f"carrier: {len(verts)}v {len(edges)}e @demo offset ({DX:.0f},{DY:.0f})")

# ── 2. MARKINGS: append WIP generator, thay curve = skeleton của tôi ──
before = set(bpy.data.objects)
with bpy.data.libraries.load(LIB, link=False) as (src, dst):
    dst.objects = ['RDSCP Markings OSM Generator WIP']
mark = next(o for o in bpy.data.objects if o not in before and 'Markings OSM' in o.name)
bpy.context.scene.collection.objects.link(mark)
mmod = next(m for m in mark.modifiers if m.node_group and 'Markings' in m.node_group.name)
mng = mmod.node_group
mmod[sock(mng, 'RoaDscape Object')] = carrier

mcu = bpy.data.curves.new("MarkingRegion", type='CURVE')
mcu.dimensions = '3D'
for hw, pts in my_ways:
    sp = mcu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, (x, y) in enumerate(pts):
        sp.points[i].co = (x + DX, y + DY, demo_z + 0.31, 1.0)
mark.data = mcu
print("markings generator ready, splines:", len(mcu.splines))

# ── 3. GUARDRAILS: append generator, curve = lề đường A2 (centerline ± halfwidth) ──
before = set(bpy.data.objects)
with bpy.data.libraries.load(LIB, link=False) as (src, dst):
    dst.objects = ['RDSCP Guardrails']
grail = next(o for o in bpy.data.objects if o not in before and o.name == 'RDSCP Guardrails')
bpy.context.scene.collection.objects.link(grail)
gmod = next(m for m in grail.modifiers if m.node_group and 'Guardrails' in m.node_group.name)

gcu = bpy.data.curves.new("GuardrailEdges", type='CURVE')
gcu.dimensions = '3D'
n_gsplines = 0
for hw, pts in my_ways:
    if hw not in ('motorway', 'motorway_link'):
        continue
    half = WIDTH_M[hw] / 2 - 0.3
    # offset hai bên theo pháp tuyến từng đoạn
    for side in (1, -1):
        op = []
        n = len(pts)
        for i, (x, y) in enumerate(pts):
            if i == 0:
                dx, dy = pts[1][0] - x, pts[1][1] - y
            elif i == n - 1:
                dx, dy = x - pts[i - 1][0], y - pts[i - 1][1]
            else:
                dx, dy = pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]
            L = (dx * dx + dy * dy) ** 0.5 or 1.0
            nx, nz = -dy / L * side, dx / L * side
            op.append((x + nx * half, y + nz * half))
        sp = gcu.splines.new('POLY')
        sp.points.add(len(op) - 1)
        for i, (x, y) in enumerate(op):
            sp.points[i].co = (x + DX, y + DY, demo_z + 0.3, 1.0)
        n_gsplines += 1
grail.data = gcu
print("guardrail curves:", n_gsplines, "splines")

# ── 4. APPLY/EVALUATE tất cả ──
def apply(obj, modname):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modname)

def eval_to_mesh(obj):
    """GN trên curve object: lấy mesh đã evaluate qua depsgraph (không apply được trên curve)"""
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(deps)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=deps)
    out = bpy.data.objects.new(obj.name + "_Eval", me)
    bpy.context.scene.collection.objects.link(out)
    return out

apply(carrier, cmod.name)
print("carrier applied:", len(carrier.data.vertices), "verts")

mark_mesh = eval_to_mesh(mark)
print("markings evaluated:", len(mark_mesh.data.vertices), "verts,",
      len(mark_mesh.data.polygons), "polys")

grail_mesh = eval_to_mesh(grail)
print("guardrails evaluated:", len(grail_mesh.data.vertices), "verts,",
      len(grail_mesh.data.polygons), "polys")

# ── 5. Về toạ độ OSM + material đơn giản ──
SIMPLE = {
    "Road_Auto": (0.045, 0.048, 0.052, 0.85),
    "Marking_Auto": (0.92, 0.92, 0.92, 0.5),
    "Guardrail_Auto": (0.55, 0.57, 0.60, 0.35),
}
mats = {}
for name, (r, g, b, rough) in SIMPLE.items():
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
    bsdf.inputs['Roughness'].default_value = rough
    mats[name] = mat

for obj, matname in [(carrier, "Road_Auto"), (mark_mesh, "Marking_Auto"), (grail_mesh, "Guardrail_Auto")]:
    if obj.type != 'MESH' or len(obj.data.vertices) == 0:
        continue
    for v in obj.data.vertices:
        v.co.x -= DX
        v.co.y -= DY
        v.co.z -= (demo_z + 0.3)
    obj.data.update()
    if not obj.data.uv_layers:
        obj.data.uv_layers.new(name="UVMap")
    obj.data.materials.clear()
    obj.data.materials.append(mats[matname])

for obj in (carrier, mark_mesh, grail_mesh):
    if obj.type != 'MESH' or not len(obj.data.vertices):
        continue
    xs = [v.co.x for v in obj.data.vertices]; ys = [v.co.y for v in obj.data.vertices]
    print(f"  {obj.name}: x[{min(xs):.0f},{max(xs):.0f}] y[{min(ys):.0f},{max(ys):.0f}]")

# ── 6. Export GLB (3 object) ──
exp_scene = bpy.data.scenes.new("EXPORT")
bpy.context.window.scene = exp_scene
for obj in (carrier, mark_mesh, grail_mesh):
    if obj.type == 'MESH' and len(obj.data.vertices):
        exp_scene.collection.objects.link(obj)
exp_scene.render.engine = 'BLENDER_WORKBENCH'
bpy.ops.export_scene.gltf(filepath=GLB_OUT, use_selection=False, export_format='GLB')
print("exported:", GLB_OUT, os.path.getsize(GLB_OUT), "bytes")
