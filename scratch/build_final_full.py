import bpy, json, os, math
from mathutils import Vector, Matrix

LIB = r"G:\road\Roadscape\Roadscape\Roadscape v4.13.10 (Asset Library)\Roadscape 4 (Release).blend"
OSM_JSON = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\osm_full_graph_frame.json"
OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch"
GLB_OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\roads_full.glb"
MAX_WIDTH = 250.0
WIDTH_M = {"motorway": 32.0, "motorway_link": 9.0, "primary": 15.0,
           "secondary": 12.0, "secondary_link": 8.0, "tertiary": 11.0,
           "primary_link": 8.0}

bpy.ops.wm.read_factory_settings(use_empty=True)
osm = json.load(open(OSM_JSON, encoding='utf-8'))
nodes = osm['node_locations']
my_ways = []
for w in osm['ways']:
    hw = w['highway']
    pts = [(nodes[n]['x'], nodes[n]['y']) for n in w['node_ids']]
    if len(pts) >= 2:
        my_ways.append((hw, pts))
my_cx = (min(p[0] for _, wp in my_ways for p in wp) + max(p[0] for _, wp in my_ways for p in wp)) / 2
my_cy = (min(p[1] for _, wp in my_ways for p in wp) + max(p[1] for _, wp in my_ways for p in wp)) / 2
print(f"ways: {len(my_ways)}, center ({my_cx:.0f},{my_cy:.0f})")

# ── 1. Carrier tại vùng demo (context đã chứng minh) ──
before = set(bpy.data.objects)
with bpy.data.libraries.load(LIB, link=False) as (src, dst):
    dst.objects = ['Roadscape Main Generator WIP OSM']
carrier = next(o for o in bpy.data.objects if o not in before and 'WIP OSM' in o.name)
bpy.context.scene.collection.objects.link(carrier)
cmod = next(m for m in carrier.modifiers if m.node_group and m.node_group.name.startswith('Roadscape 4'))
cng = cmod.node_group

def sock(ng, name, nth=0):
    k = 0
    for it in ng.interface.items_tree:
        if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name.lower() == name.lower():
            if k == nth:
                return it.identifier
            k += 1
    return None

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
me = bpy.data.meshes.new("RS_OSM_Full")
me.from_pydata(verts, edges, [])
me.update()
cv = me.attributes.new('crease_vert', 'FLOAT', 'POINT')
bw = me.attributes.new('bevel_weight_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    cv.data[i].value = creases[i]
    bw.data[i].value = bws[i]
carrier.data = me
for name, value in [('Wireframe Only', False), ('Show Road', True), ('Show Support', False),
                    ('Display Support', False), ('Display Sidewalks', False)]:
    cmod[sock(cng, name)] = value
print(f"carrier: {len(verts)}v {len(edges)}e")

bpy.context.view_layer.objects.active = carrier
carrier.select_set(True)
bpy.ops.object.modifier_apply(modifier=cmod.name)
print("applied:", len(carrier.data.vertices), "verts,", len(carrier.data.polygons), "polys")

# ── 2. Về khung graph + z=0 ──
for v in carrier.data.vertices:
    v.co.x -= DX
    v.co.y -= DY
    v.co.z -= (demo_z + 0.3)
carrier.data.update()
carrier.name = "Autobahn_Roads"
xs = [v.co.x for v in carrier.data.vertices]; ys = [v.co.y for v in carrier.data.vertices]
print(f"roads graph frame: x[{min(xs):.0f},{max(xs):.0f}] y[{min(ys):.0f},{max(ys):.0f}] z[~0]")

# ── 3. Vạch kẻ + guardrail thủ tục (khung graph) ──
ACC = {}
def add_quad(name, p1, p2, p3, p4):
    v, f = ACC[name]
    base = len(v)
    v.extend([p1, p2, p3, p4])
    f.append((base, base + 1, base + 2, base + 3))

def resample(pts, step=2.0):
    raw = []
    for i in range(len(pts) - 1):
        ax, ay = pts[i]; bx, by = pts[i + 1]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy)
        if L < 1e-6:
            continue
        ux, uy = dx / L, dy / L
        s = 0.0
        while s < L:
            raw.append((ax + ux * s, ay + uy * s, ux, uy))
            s += step
    out = []
    acc = 0.0
    for i, (x, y, ux, uy) in enumerate(raw):
        if i > 0:
            acc += math.hypot(x - raw[i-1][0], y - raw[i-1][1])
        out.append((x, y, ux, uy, acc))
    return out

MN = "Autobahn_Markings"
ACC[MN] = ([], [])
DASH, GAP, MW = 6.0, 12.0, 0.30

def emit_line(name, pts, offset, solid, width=MW, z=0.02):
    samples = resample(pts, 2.0)
    if len(samples) < 2:
        return 0
    n = 0
    for i in range(1, len(samples)):
        px, py, pux, puy, ps = samples[i - 1]
        x, y, ux, uy, s = samples[i]
        p_on = True if solid else ((ps % (DASH + GAP)) < DASH)
        c_on = True if solid else ((s % (DASH + GAP)) < DASH)
        if not (p_on and c_on):
            continue
        nx1, ny1 = -puy, pux
        nx2, ny2 = -uy, ux
        add_quad(name,
                 (px + nx1 * (offset - width/2), py + ny1 * (offset - width/2), z),
                 (px + nx1 * (offset + width/2), py + ny1 * (offset + width/2), z),
                 (x + nx2 * (offset + width/2), y + ny2 * (offset + width/2), z),
                 (x + nx2 * (offset - width/2), y + ny2 * (offset - width/2), z))
        n += 1
    return n

total_m = 0
for hw, pts in my_ways:
    if hw == 'motorway':
        for off in (5.57, 9.44):
            total_m += emit_line(MN, pts, off, False)
        total_m += emit_line(MN, pts, 13.4, True)
        for off in (-6.57, -10.44):
            total_m += emit_line(MN, pts, off, False)
        total_m += emit_line(MN, pts, -14.4, True)
    elif hw in ('primary', 'secondary', 'tertiary'):
        total_m += emit_line(MN, pts, 0.0, False)
        total_m += emit_line(MN, pts, 6.9, True)
        total_m += emit_line(MN, pts, -6.9, True)

RN = "Autobahn_Guardrails"
ACC[RN] = ([], [])
for hw, pts in my_ways:
    if hw not in ('motorway', 'motorway_link'):
        continue
    half = 18.6 if hw == 'motorway' else 5.2
    samples = resample(pts, 2.0)
    if len(samples) < 2:
        continue
    for sign in (1, -1):
        for i in range(1, len(samples)):
            x0, y0, ux0, uy0, _ = samples[i - 1]
            x1, y1, ux1, uy1, _ = samples[i]
            n0x, n0y = -uy0 * sign, ux0 * sign
            n1x, n1y = -uy1 * sign, ux1 * sign
            ax, ay = x0 + n0x * half, y0 + n0y * half
            bx, by = x1 + n1x * half, y1 + n1y * half
            t = 0.03
            p1 = (ax - n0x*t, ay - n0y*t, 0.55); p2 = (ax + n0x*t, ay + n0y*t, 0.55)
            p3 = (bx + n1x*t, by + n1y*t, 0.55); p4 = (bx - n1x*t, by - n1y*t, 0.55)
            q1 = (p1[0], p1[1], 0.85); q2 = (p2[0], p2[1], 0.85)
            q3 = (p3[0], p3[1], 0.85); q4 = (p4[0], p4[1], 0.85)
            add_quad(RN, p1, p2, q2, q1)
            add_quad(RN, q1, q2, q3, q4)
            add_quad(RN, q4, q3, p3, p4)
            add_quad(RN, p4, p3, p2, p1)
        for (x, y, ux, uy, s) in samples:
            if s % 4.0 > 2.0:
                continue
            nx, ny = -uy * sign, ux * sign
            cx, cy = x + nx * half, y + ny * half
            e1 = (nx * 0.05, ny * 0.05); e2 = (ux * 0.05, uy * 0.05)
            c = [(cx + a + b, cy + d + e) for a, d in (e1, (-e1[0], -e1[1])) for b, e in (e2, (-e2[0], -e2[1]))]
            add_quad(RN, (c[0][0], c[0][1], 0.0), (c[1][0], c[1][1], 0.0),
                     (c[2][0], c[2][1], 0.70), (c[3][0], c[3][1], 0.70))

def simple_mat(name, color, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1.0)
    b.inputs['Roughness'].default_value = rough
    return m

objs = [(carrier, "Road_Auto", (0.045, 0.048, 0.052), 0.85)]
for nm in (MN, RN):
    mesh = bpy.data.meshes.new(nm)
    mesh.from_pydata(ACC[nm][0], [], ACC[nm][1])
    mesh.update()
    ob = bpy.data.objects.new(nm, mesh)
    bpy.context.scene.collection.objects.link(ob)
    if nm == MN:
        mark_ob = ob
    else:
        rail_ob = ob
objs.append((mark_ob, "Marking_White", (0.92, 0.92, 0.92), 0.5))
objs.append((rail_ob, "Guardrail_Steel", (0.55, 0.57, 0.60), 0.35))

for ob, mname, color, rough in objs:
    if not ob.data.uv_layers:
        ob.data.uv_layers.new(name="UVMap")
    ob.data.materials.clear()
    ob.data.materials.append(simple_mat(mname, color, rough))
    print(f"  {ob.name}: {len(ob.data.vertices)}v {len(ob.data.polygons)}f")

# ── 4. LẬT Y (Blender y → glTF Z = -y; web cần world z = +graph y) ──
for ob, _, _, _ in objs:
    for v in ob.data.vertices:
        v.co.y = -v.co.y
    ob.data.update()
print("Y flipped for glTF/web axis")

# ── 5. Render verify (frame đã lật) ──
sc = bpy.context.scene
a2 = max((w for w in my_ways if w[0] == 'motorway'), key=lambda w: len(w[1]))[1]
mid = a2[len(a2) // 2]
cam = bpy.data.cameras.new('T'); cam.type = 'ORTHO'; cam.ortho_scale = 140
co = bpy.data.objects.new('TCam', cam); sc.collection.objects.link(co)
co.location = (mid[0], -mid[1], 120)
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 1400; sc.render.resolution_y = 900
sc.camera = co
sc.render.filepath = OUT + r"\audit_shots\final_closeup.png"
bpy.ops.render.render(write_still=True)

cam2 = bpy.data.cameras.new('O'); cam2.type = 'ORTHO'; cam2.ortho_scale = 9500
co2 = bpy.data.objects.new('OCam', cam2); sc.collection.objects.link(co2)
co2.location = (0, 0, 2000)
sc.render.resolution_x = 1400; sc.render.resolution_y = 1100
sc.camera = co2
sc.render.filepath = OUT + r"\audit_shots\final_overview.png"
bpy.ops.render.render(write_still=True)

# ── 6. Export ──
bpy.ops.export_scene.gltf(filepath=GLB_OUT, export_format='GLB')
print("exported:", GLB_OUT, os.path.getsize(GLB_OUT), "bytes")
