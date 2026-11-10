import bpy, json, os, math
from mathutils import Vector, Matrix

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch"
GLB_OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\roads_full.glb"
OSM_JSON = r"G:\road\osm_road_data.json"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=OUT + r"\roadscape_generated.glb")
roads = max((o for o in bpy.data.objects if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
for o in list(bpy.data.objects):
    if o != roads:
        bpy.data.objects.remove(o, do_unlink=True)
for _ in range(3):
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

# Bake transform + đưa về khung OSM (đã xác minh: không flip, min bounds trừ trực tiếp)
roads.data.transform(roads.matrix_world.copy())
roads.matrix_world = Matrix.Identity(4)
zs = [v.co.z for v in roads.data.vertices]
zmin = min(zs)
for v in roads.data.vertices:
    v.co.z -= zmin
roads.name = "Autobahn_Roads"
print("roads:", len(roads.data.vertices), "verts")

# ── Helpers dựng mesh thủ tục (accumulator + from_pydata) ──
ACC = {}

def new_mesh_obj(name):
    ACC[name] = ([], [])
    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob, name

def add_quad(name, p1, p2, p3, p4):
    v, f = ACC[name]
    base = len(v)
    v.extend([p1, p2, p3, p4])
    f.append((base, base + 1, base + 2, base + 3))

def flush(name):
    me = bpy.data.meshes.get(name)
    v, f = ACC[name]
    me.from_pydata(v, [], f)
    me.update()
    return me

def resample(pts, step=2.0):
    """Rời rạc hóa polyline theo bước ~step, trả [(x,y,dirx,diry,len_s)]"""
    out = []
    acc = 0.0
    carry = None
    for i in range(len(pts) - 1):
        ax, ay = pts[i]; bx, by = pts[i + 1]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy)
        if L < 1e-6:
            continue
        ux, uy = dx / L, dy / L
        s = 0.0
        if carry is not None:
            # điểm dở dari đoạn trước
            pass
        while s < L:
            if carry is not None:
                sx, sy = carry
                carry = None
            else:
                sx, sy = ax + ux * s, ay + uy * s
            nxt_s = s + step
            if nxt_s <= L:
                out.append((sx, sy, ux, uy, acc + s))
                s = nxt_s
            else:
                carry = (sx, sy)
                break
        else:
            pass
        acc += L
    return out

# ── Load OSM ──
osm = json.load(open(OSM_JSON, encoding='utf-8'))
nodes = osm['node_locations']
WAYS = []
for w in osm['ways']:
    hw = w.get('highway', '')
    if hw in ('motorway', 'motorway_link', 'primary', 'secondary', 'tertiary', 'secondary_link'):
        pts = [(nodes[str(n)]['x'], nodes[str(n)]['y']) for n in w.get('node_ids', []) if str(n) in nodes]
        if len(pts) >= 2:
            WAYS.append((hw, pts))

# ── 1. VẠCH KẺ ──
mark_ob, _ = new_mesh_obj("Autobahn_Markings")
MN = "Autobahn_Markings"
DASH, GAP, MW = 6.0, 12.0, 0.30

def emit_line(name, pts, offset, solid, width=MW, z=0.02, dash=DASH, gap=GAP):
    samples = resample(pts, 2.0)
    if len(samples) < 2:
        return 0
    n = 0
    for i in range(1, len(samples)):
        px, py, pux, puy, ps = samples[i - 1]
        x, y, ux, uy, s = samples[i]
        p_on = True if solid else ((ps % (dash + gap)) < dash)
        c_on = True if solid else ((s % (dash + gap)) < dash)
        if not (p_on and c_on):
            continue
        nx1, ny1 = -puy, pux
        nx2, ny2 = -uy, ux
        a = (px + nx1 * (offset - width / 2), py + ny1 * (offset - width / 2), z)
        b = (px + nx1 * (offset + width / 2), py + ny1 * (offset + width / 2), z)
        c = (x + nx2 * (offset + width / 2), y + ny2 * (offset + width / 2), z)
        d = (x + nx2 * (offset - width / 2), y + ny2 * (offset - width / 2), z)
        add_quad(name, a, b, c, d)
        n += 1
    return n

total_m = 0
for hw, pts in WAYS:
    if hw == 'motorway':
        # mặt cắt đo được: làn chạy +[1.7, 13.3], median [-2.7, +1.7], mirror chiều - qua tâm median
        for offs, solid in (((5.57, 9.44), False), ((13.4,), True)):
            for off in offs:
                total_m += emit_line(MN, pts, off, solid)
        for offs, solid in (((-6.57, -10.44), False), ((-14.4,), True)):
            for off in offs:
                total_m += emit_line(MN, pts, off, solid)
    elif hw in ('primary', 'secondary', 'tertiary'):
        total_m += emit_line(MN, pts, 0.0, solid=False)
        total_m += emit_line(MN, pts, 6.9, solid=True)
        total_m += emit_line(MN, pts, -6.9, solid=True)
flush(MN)
print("marking quads:", total_m, "-> verts:", len(ACC[MN][0]))

# ── 2. GUARDRAIL (chỉ A2 + ramp) ──
RN = "Autobahn_Guardrails"
rail_ob, _ = new_mesh_obj(RN)
for hw, pts in WAYS:
    if hw not in ('motorway', 'motorway_link'):
        continue
    half = 18.6 if hw == 'motorway' else 5.2
    samples = resample(pts, 2.0)
    if len(samples) < 2:
        continue
    for sign in (1, -1):
        # rail beam: hộp 0.30 cao × 0.06 dày, z 0.55..0.85, chạy liên tục
        for i in range(1, len(samples)):
            x0, y0, ux0, uy0, _ = samples[i - 1]
            x1, y1, ux1, uy1, _ = samples[i]
            n0x, n0y = -uy0 * sign, ux0 * sign
            n1x, n1y = -uy1 * sign, ux1 * sign
            ax, ay = x0 + n0x * half, y0 + n0y * half
            bx, by = x1 + n1x * half, y1 + n1y * half
            t = 0.03
            p1 = (ax - n0x * t, ay - n0y * t, 0.55)
            p2 = (ax + n0x * t, ay + n0y * t, 0.55)
            p3 = (bx + n1x * t, by + n1y * t, 0.55)
            p4 = (bx - n1x * t, by - n1y * t, 0.55)
            q1 = (p1[0], p1[1], 0.85); q2 = (p2[0], p2[1], 0.85)
            q3 = (p3[0], p3[1], 0.85); q4 = (p4[0], p4[1], 0.85)
            add_quad(RN, p1, p2, q2, q1)   # mặt trong
            add_quad(RN, q1, q2, q3, q4)   # mép trên
            add_quad(RN, q4, q3, p3, p4)   # mặt ngoài
            add_quad(RN, p4, p3, p2, p1)   # mép dưới
        # cột mỗi ~4m: hộp 0.10×0.10×0.70
        for (x, y, ux, uy, s) in samples:
            if s % 4.0 > 2.0:
                continue
            nx, ny = -uy * sign, ux * sign
            cx, cy = x + nx * half, y + ny * half
            e1 = (nx * 0.05, ny * 0.05)
            e2 = (ux * 0.05, uy * 0.05)
            c = [(cx + a + b, cy + d + e) for a, d in (e1, (-e1[0], -e1[1])) for b, e in (e2, (-e2[0], -e2[1]))]
            add_quad(RN,
                     (c[0][0], c[0][1], 0.0), (c[1][0], c[1][1], 0.0),
                     (c[2][0], c[2][1], 0.70), (c[3][0], c[3][1], 0.70))
flush(RN)
print("guardrail polys:", len(ACC[RN][1]))

# ── 3. Material ──
def simple_mat(name, color, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1.0)
    b.inputs['Roughness'].default_value = rough
    return m

mats = {
    roads: simple_mat("Road_Auto", (0.045, 0.048, 0.052), 0.85),
    mark_ob: simple_mat("Marking_White", (0.92, 0.92, 0.92), 0.5),
    rail_ob: simple_mat("Guardrail_Steel", (0.55, 0.57, 0.60), 0.35),
}
for ob, m in mats.items():
    if not ob.data.uv_layers:
        ob.data.uv_layers.new(name="UVMap")
    ob.data.materials.clear()
    ob.data.materials.append(m)

# ── 4. Render verify ──
sc = bpy.context.scene
osm_a2 = max((w for w in WAYS if w[0] == 'motorway'), key=lambda w: len(w[1]))[1]
mid = osm_a2[len(osm_a2) // 2]
cam = bpy.data.cameras.new('T'); cam.type = 'ORTHO'; cam.ortho_scale = 140
co = bpy.data.objects.new('TCam', cam); sc.collection.objects.link(co)
co.location = (mid[0], mid[1], 120)
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 1400; sc.render.resolution_y = 900
sc.camera = co
sc.render.filepath = OUT + r"\audit_shots\full_closeup.png"
bpy.ops.render.render(write_still=True)

cam2 = bpy.data.cameras.new('O'); cam2.type = 'ORTHO'; cam2.ortho_scale = 3200
co2 = bpy.data.objects.new('OCam', cam2); sc.collection.objects.link(co2)
co2.location = (-340, -190, 800)
sc.render.resolution_x = 1400; sc.render.resolution_y = 1000
sc.camera = co2
sc.render.filepath = OUT + r"\audit_shots\full_overview.png"
bpy.ops.render.render(write_still=True)

# ── 5. Export GLB vào public/maps ──
bpy.ops.export_scene.gltf(filepath=GLB_OUT, export_format='GLB')
print("exported:", GLB_OUT, os.path.getsize(GLB_OUT), "bytes")
