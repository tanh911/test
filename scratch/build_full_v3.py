import bpy, json, os, math

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch"
GLB_OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\roads_full.glb"
GRAPH_JSON = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\simulation\data\road_graph_autobahn.json"

bpy.ops.wm.read_factory_settings(use_empty=True)
graph = json.load(open(GRAPH_JSON, encoding='utf-8'))
roads_in = graph['roads']

# ── Resample + quads helpers (frame: x = graph x, y = graph z; off dương = PHẢI chiều chạy) ──
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

ACC = {}
def add_quad(name, p1, p2, p3, p4):
    v, f = ACC[name]
    base = len(v)
    v.extend([p1, p2, p3, p4])
    f.append((base, base + 1, base + 2, base + 3))

def strip(name, pts, off1, off2, z):
    """Dải mặt phẳng giữa offset1 -> offset2 dọc polyline (off dương = phải chiều chạy)"""
    samples = resample(pts, 3.0)
    if len(samples) < 2:
        return 0
    n = 0
    for i in range(1, len(samples)):
        px, py, pux, puy, _ = samples[i - 1]
        x, y, ux, uy, _ = samples[i]
        n1x, n1y = -puy, pux
        n2x, n2y = -uy, ux
        add_quad(name,
                 (px + n1x * off1, py + n1y * off1, z),
                 (px + n1x * off2, py + n1y * off2, z),
                 (x + n2x * off2, y + n2y * off2, z),
                 (x + n2x * off1, y + n2y * off1, z))
        n += 1
    return n

def emit_line(name, pts, offset, solid, width=0.30, z=0.06, dash=6.0, gap=12.0):
    samples = resample(pts, 1.0)
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
        n1x, n1y = -puy, pux
        n2x, n2y = -uy, ux
        add_quad(name,
                 (px + n1x * (offset - width/2), py + n1y * (offset - width/2), z),
                 (px + n1x * (offset + width/2), py + n1y * (offset + width/2), z),
                 (x + n2x * (offset + width/2), y + n2y * (offset + width/2), z),
                 (x + n2x * (offset - width/2), y + n2y * (offset - width/2), z))
        n += 1
    return n

def emit_guardrail(name, pts, offset):
    """W-Beam rail liên tục (0.55..0.85m) + cột I mỗi 4m tại offset cho trước"""
    samples = resample(pts, 2.0)
    if len(samples) < 2:
        return 0
    n = 0
    for i in range(1, len(samples)):
        x0, y0, ux0, uy0, _ = samples[i - 1]
        x1, y1, ux1, uy1, _ = samples[i]
        n0x, n0y = -uy0, ux0
        n1x, n1y = -uy1, ux1
        ax, ay = x0 + n0x * offset, y0 + n0y * offset
        bx, by = x1 + n1x * offset, y1 + n1y * offset
        t = 0.03
        p1 = (ax - n0x*t, ay - n0y*t, 0.55); p2 = (ax + n0x*t, ay + n0y*t, 0.55)
        p3 = (bx + n1x*t, by + n1y*t, 0.55); p4 = (bx - n1x*t, by - n1y*t, 0.55)
        q1 = (p1[0], p1[1], 0.85); q2 = (p2[0], p2[1], 0.85)
        q3 = (p3[0], p3[1], 0.85); q4 = (p4[0], p4[1], 0.85)
        add_quad(GN, p1, p2, q2, q1)
        add_quad(GN, q1, q2, q3, q4)
        add_quad(GN, q4, q3, p3, p4)
        add_quad(GN, p4, p3, p2, p1)
        n += 4
    for (x, y, ux, uy, s) in samples:
        if s % 4.0 > 2.0:
            continue
        nx, ny = -uy, ux
        cx, cy = x + nx * offset, y + ny * offset
        e1 = (nx * 0.05, ny * 0.05); e2 = (ux * 0.05, uy * 0.05)
        c = [(cx + a + b, cy + d + e) for a, d in (e1, (-e1[0], -e1[1])) for b, e in (e2, (-e2[0], -e2[1]))]
        add_quad(GN, (c[0][0], c[0][1], 0.0), (c[1][0], c[1][1], 0.0),
                 (c[2][0], c[2][1], 0.70), (c[3][0], c[3][1], 0.70))
        n += 1
    return n

# Nâng z nhẹ theo loại đường để tránh z-fighting khi ribbon cắt nhau
Z_BY_TYPE = {'motorway': 0.00, 'motorway_link': 0.01, 'primary': 0.02,
             'secondary': 0.03, 'tertiary': 0.04, 'secondary_link': 0.05}
SHOULDER = 2.6  # Standstreifen bên phải chiều chạy (ngoài range làn của lane graph)

# ── 1. ROADS: mỗi way = MỘT chiều, bề rộng đúng theo lane graph ──
RN = "Autobahn_Roads"
ACC[RN] = ([], [])
roads_count = 0
for r in roads_in:
    hw = r['highway']
    pts = r['centerline']
    if len(pts) < 2:
        continue
    half = r['width'] / 2
    z = Z_BY_TYPE[hw]
    if hw == 'motorway':
        strip(RN, pts, -half, half + SHOULDER, z)  # lệch sang phải: thêm làn khẩn cấp
    else:
        strip(RN, pts, -half, half, z)
    roads_count += 1
mesh_r = bpy.data.meshes.new(RN)
mesh_r.from_pydata(ACC[RN][0], [], ACC[RN][1])
mesh_r.update()
road_ob = bpy.data.objects.new(RN, mesh_r)
bpy.context.scene.collection.objects.link(road_ob)
print(f"roads: {roads_count} ways, {len(ACC[RN][1])} quads, {len(ACC[RN][0])} verts")

# ── 2. MARKINGS: khớp isofare lane graph (làn i tâm tại -half + (i+0.5)*laneW) ──
MN = "Autobahn_Markings"
ACC[MN] = ([], [])
total_m = 0
for r in roads_in:
    hw = r['highway']
    pts = r['centerline']
    if len(pts) < 2:
        continue
    half = r['width'] / 2
    z = Z_BY_TYPE[hw] + 0.06
    if hw == 'motorway':
        laneW = r['width'] / r['lanes']
        for i in range(1, r['lanes']):
            total_m += emit_line(MN, pts, -half + i * laneW, False, z=z)  # vạch đứt phân làn
        total_m += emit_line(MN, pts, -(half - 0.45), True, z=z)          # mép trái (median)
        total_m += emit_line(MN, pts, half + 0.15, True, z=z)             # mép phải (ranh Standstreifen)
    elif hw == 'motorway_link':
        pass  # ramp: không vạch
    elif r.get('oneway'):
        total_m += emit_line(MN, pts, half - 0.45, True, z=z)
        total_m += emit_line(MN, pts, -(half - 0.45), True, z=z)
    else:
        total_m += emit_line(MN, pts, 0.0, False, z=z)                    # vạch tim đứt
        total_m += emit_line(MN, pts, half - 0.45, True, z=z)
        total_m += emit_line(MN, pts, -(half - 0.45), True, z=z)
mesh_m = bpy.data.meshes.new(MN)
mesh_m.from_pydata(ACC[MN][0], [], ACC[MN][1])
mesh_m.update()
mark_ob = bpy.data.objects.new(MN, mesh_m)
bpy.context.scene.collection.objects.link(mark_ob)
print(f"markings: {total_m} quads")

# ── 3. GUARDRAIL: motorway 2 bên (phải ngoài Standstreifen, trái median), ramp 2 bên ──
GN = "Autobahn_Guardrails"
ACC[GN] = ([], [])
total_g = 0
for r in roads_in:
    hw = r['highway']
    pts = r['centerline']
    if len(pts) < 2:
        continue
    half = r['width'] / 2
    if hw == 'motorway':
        total_g += emit_guardrail(GN, pts, half + SHOULDER + 0.9)
        total_g += emit_guardrail(GN, pts, -(half + 0.9))
    elif hw == 'motorway_link':
        total_g += emit_guardrail(GN, pts, half + 0.9)
        total_g += emit_guardrail(GN, pts, -(half + 0.9))
mesh_g = bpy.data.meshes.new(GN)
mesh_g.from_pydata(ACC[GN][0], [], ACC[GN][1])
mesh_g.update()
grail_ob = bpy.data.objects.new(GN, mesh_g)
bpy.context.scene.collection.objects.link(grail_ob)
print(f"guardrails: {total_g} quads")

# ── 4. Materials ──
def simple_mat(name, color, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1.0)
    b.inputs['Roughness'].default_value = rough
    return m

for ob, mname, color, rough in [(road_ob, "Road_Auto", (0.045, 0.048, 0.052), 0.85),
                                (mark_ob, "Marking_White", (0.92, 0.92, 0.92), 0.5),
                                (grail_ob, "Guardrail_Steel", (0.55, 0.57, 0.60), 0.35)]:
    if not ob.data.uv_layers:
        ob.data.uv_layers.new(name="UVMap")
    ob.data.materials.clear()
    ob.data.materials.append(simple_mat(mname, color, rough))

# ── 5. Lật Y cho hệ toạ độ web (world z = -carZ, graph y ≡ world z; glTF Z = -y_blender) ──
for ob in (road_ob, mark_ob, grail_ob):
    for v in ob.data.vertices:
        v.co.y = -v.co.y
    ob.data.update()
print("Y flipped")

# ── 6. Render verify: closeup giữa A2 + overview toàn mạng ──
sc = bpy.context.scene
main_a2 = max((r for r in roads_in if r['highway'] == 'motorway'), key=lambda r: len(r['centerline']))
mid = main_a2['centerline'][len(main_a2['centerline']) // 2]
cam = bpy.data.cameras.new('T'); cam.type = 'ORTHO'; cam.ortho_scale = 140; cam.clip_start = 1; cam.clip_end = 5000
co = bpy.data.objects.new('TCam', cam); sc.collection.objects.link(co)
co.location = (mid[0], -mid[1], 120)
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 1400; sc.render.resolution_y = 900
sc.camera = co
sc.render.filepath = OUT + r"\audit_shots\v3_closeup.png"
bpy.ops.render.render(write_still=True)

cam2 = bpy.data.cameras.new('O'); cam2.type = 'ORTHO'; cam2.ortho_scale = 9500; cam2.clip_start = 1; cam2.clip_end = 5000
co2 = bpy.data.objects.new('OCam', cam2); sc.collection.objects.link(co2)
co2.location = (0, 0, 2000)
sc.render.resolution_x = 1400; sc.render.resolution_y = 1100
sc.camera = co2
sc.render.filepath = OUT + r"\audit_shots\v3_overview.png"
bpy.ops.render.render(write_still=True)

# ── 7. Export Draco ──
bpy.ops.export_scene.gltf(filepath=GLB_OUT, export_format='GLB', export_draco_mesh_compression_enable=True)
print("exported:", GLB_OUT, os.path.getsize(GLB_OUT), "bytes")
