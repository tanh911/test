import bpy, json
from mathutils import Vector

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"
LIB = r"G:\road\Roadscape\Roadscape\Roadscape v4.13.10 (Asset Library)\Roadscape 4 (Release).blend"
OSM_JSON = r"G:\road\osm_road_data.json"
MAX_WIDTH = 250.0
WIDTH_M = {"motorway": 32.0, "motorway_link": 9.0, "primary": 15.0,
           "secondary": 12.0, "secondary_link": 8.0, "tertiary": 11.0}

# ── 1. Dọn carrier cũ ──
for name in ["RS_OSM_All", "Roadscape Main Generator WIP OSM", "Roadscape Main Generator WIP OSM.001"]:
    o = bpy.data.objects.get(name)
    if o:
        bpy.data.objects.remove(o, do_unlink=True)

# ── 2. Append template object từ library (kéo theo collections/node groups/materials) ──
before = set(bpy.data.objects)
with bpy.data.libraries.load(LIB, link=False) as (src, dst):
    dst.objects = [n for n in src.objects if n == 'Roadscape Main Generator WIP OSM']
new_objs = [o for o in bpy.data.objects if o not in before]
tpl = next((o for o in new_objs if 'WIP OSM' in o.name), None)
print("appended:", [o.name for o in new_objs])
if not tpl:
    raise SystemExit("template not appended")

# Lấy modifier config gốc TRƯỚC khi thay mesh (node group có thể bị đổi tên .001 khi append)
tpl_mod = next(m for m in tpl.modifiers if m.node_group and m.node_group.name.startswith('Roadscape 4'))
ng = tpl_mod.node_group
print("template mod group:", ng.name)

def sock(name, nth=0):
    k = 0
    for it in ng.interface.items_tree:
        if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name == name:
            if k == nth:
                return it.identifier
            k += 1
    return None

# ── 3. Thay mesh data bằng OSM skeleton (giữ nguyên modifier + deps) ──
with open(OSM_JSON, encoding='utf-8') as f:
    osm = json.load(f)
nodes_map = osm.get('node_locations', {})

verts, edges, creases = [], [], []
for way in osm.get('ways', []):
    hw = way.get('highway', '')
    if hw not in WIDTH_M:
        continue
    pts = [nodes_map.get(str(nid)) for nid in way.get('node_ids', [])]
    pts = [nd for nd in pts if nd]
    if len(pts) < 2:
        continue
    start = len(verts)
    for nd in pts:
        verts.append((nd['x'], nd['y'], nd.get('z', 0.0) + 0.25))
        creases.append(WIDTH_M[hw] / MAX_WIDTH)
    for i in range(len(pts) - 1):
        edges.append((start + i, start + i + 1))

new_mesh = bpy.data.meshes.new("RS_OSM_Edges")
new_mesh.from_pydata(verts, edges, [])
new_mesh.update()
cv = new_mesh.attributes.new('crease_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    cv.data[i].value = creases[i]

old_mesh = tpl.data
tpl.data = new_mesh
print(f"mesh replaced: {len(verts)} verts, {len(edges)} edges")

# ── 4. Config: tắt wireframe, terrain của tôi ──
tpl_mod[sock('Wireframe Only')] = False
tpl_mod[sock('Show Road')] = True
tpl_mod[sock('Display Support')] = False
tpl_mod[sock('Display Sidewalks')] = False
terrain = bpy.data.objects.get("Ground_Base")
if terrain:
    tpl_mod[sock('Terrain Object')] = terrain
    print("terrain:", terrain.name)

# ── 5. Render ──
mins = Vector((1e9, 1e9, 0)); maxs = Vector((-1e9, -1e9, 0))
for v in new_mesh.vertices:
    mins.x = min(mins.x, v.co.x); mins.y = min(mins.y, v.co.y)
    maxs.x = max(maxs.x, v.co.x); maxs.y = max(maxs.y, v.co.y)
cx, cy = (mins.x + maxs.x) / 2, (mins.y + maxs.y) / 2
span = max(maxs.x - mins.x, maxs.y - mins.y)

scene = bpy.context.scene
cam_top = bpy.data.objects.get("Cam_Top_Ortho")
cam_top.data.ortho_scale = span * 1.05
cam_top.location = (cx, cy, 600)
cam_top.rotation_euler = (0, 0, 0)

cam_drv = bpy.data.objects.get("Cam_Driving_View")
cam_drv.location = (cx - 120, cy - 280, 35)
old_t = bpy.data.objects.get("DrvTarget")
if old_t:
    bpy.data.objects.remove(old_t, do_unlink=True)
target = bpy.data.objects.new("DrvTarget", None)
target.location = (cx, cy, 2)
scene.collection.objects.link(target)
for c in list(cam_drv.constraints):
    cam_drv.constraints.remove(c)
con = cam_drv.constraints.new('TRACK_TO')
con.target = target
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis = 'UP_Y'

shd = scene.display.shading
shd.light = 'STUDIO'
shd.color_type = 'MATERIAL'
shd.show_cavity = True
shd.show_shadows = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 900

scene.camera = cam_top
scene.render.filepath = OUT + r"\rs_template_mesh_top.png"
bpy.ops.render.render(write_still=True)

scene.camera = cam_drv
scene.render.filepath = OUT + r"\rs_template_mesh_driving.png"
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_mainfile()
print("done")
