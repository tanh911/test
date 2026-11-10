import bpy, json
from mathutils import Vector

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"
OSM_JSON = r"G:\road\osm_road_data.json"
MAX_WIDTH = 250.0  # Use Legacy Width = False → width = crease_vert * Max Width

# width mục tiêu (m) theo loại đường
WIDTH_M = {
    "motorway": 32.0,        # A2: 2x3 làn + dải phân cách
    "motorway_link": 9.0,    # ramp 1 làn
    "primary": 15.0,
    "secondary": 12.0,
    "secondary_link": 8.0,
    "tertiary": 11.0,
}

# ── 1. Dọn skeleton cũ ──
for name in ["RS_OSM_A2", "RS_OSM_Ramps", "RS_OSM_B63"]:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

col = bpy.data.collections.get("Roadscape_V413_Skeleton")

# ── 2. MỘT carrier mesh gộp tất cả (giống template) + crease_VERT = width ratio ──
with open(OSM_JSON, encoding='utf-8') as f:
    osm = json.load(f)
nodes_map = osm.get('node_locations', {})

verts, edges, creases = [], [], []
n_by_type = {}
for way in osm.get('ways', []):
    hw = way.get('highway', '')
    if hw not in WIDTH_M:
        continue
    pts = []
    for nid in way.get('node_ids', []):
        nd = nodes_map.get(str(nid))
        if nd:
            pts.append((nd['x'], nd['y'], nd.get('z', 0.0) + 0.25))
    if len(pts) < 2:
        continue
    start = len(verts)
    for p in pts:
        verts.append(p)
        creases.append(WIDTH_M[hw] / MAX_WIDTH)
    for i in range(len(pts) - 1):
        edges.append((start + i, start + i + 1))
    n_by_type[hw] = n_by_type.get(hw, 0) + 1

mesh = bpy.data.meshes.new("RS_OSM_All_Mesh")
mesh.from_pydata(verts, edges, [])
mesh.update()
cv = mesh.attributes.new('crease_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    cv.data[i].value = creases[i]

obj = bpy.data.objects.new("RS_OSM_All", mesh)
col.objects.link(obj)
print(f"carrier: {len(verts)} verts, {len(edges)} edges | ways by type: {n_by_type}")

# ── 3. Modifier config khớp template OSM + tắt wireframe ──
ng = bpy.data.node_groups.get("Roadscape 4-13-10")
mod = obj.modifiers.new("Roadscape 4", type='NODES')
mod.node_group = ng

def sock(name, nth=0):
    k = 0
    for it in ng.interface.items_tree:
        if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name == name:
            if k == nth:
                return it.identifier
            k += 1
    return None

terrain = bpy.data.objects.get("Ground_Base")
for name, value in [
    ('Wireframe Only', False), ('Show Road', True), ('Show Support', False),
    ('Display Sidewalks', False), ('Display Support', False), ('Display Terrain', False),
    ('Generation Mode', 1), ('Smooth Iterations', 25), ('Subdivide Roads', True),
    ('Subdivision Level', 2), ('Use Legacy Width', False),
    ('Min Width', 0.1), ('Max Width', 250.0),
    ('Output Subdivided Path Mesh for Markings', True),
]:
    ident = sock(name)
    if ident is not None:
        mod[ident] = value
for ident in sock('Enable'):  # tất cả các Enable (crease, elevation, noise...)
    mod[ident] = True
if terrain:
    ident = sock('Terrain Object')
    if ident:
        mod[ident] = terrain
        print("terrain:", terrain.name)

# ── 4. Cameras + render ──
mins = Vector((1e9, 1e9, 0)); maxs = Vector((-1e9, -1e9, 0))
for v in mesh.vertices:
    mins.x = min(mins.x, v.co.x); mins.y = min(mins.y, v.co.y)
    maxs.x = max(maxs.x, v.co.x); maxs.y = max(maxs.y, v.co.y)
cx, cy = (mins.x + maxs.x) / 2, (mins.y + maxs.y) / 2
span = max(maxs.x - mins.x, maxs.y - mins.y)
print(f"BOUNDS center=({cx:.0f},{cy:.0f}) span={span:.0f}")

scene = bpy.context.scene
cam_top = bpy.data.objects.get("Cam_Top_Ortho")
cam_top.data.ortho_scale = span * 1.05
cam_top.location = (cx, cy, 600)
cam_top.rotation_euler = (0, 0, 0)

cam_drv = bpy.data.objects.get("Cam_Driving_View")
cam_drv.data.lens = 35
cam_drv.location = (cx - 120, cy - 280, 35)
old = bpy.data.objects.get("DrvTarget")
if old:
    bpy.data.objects.remove(old, do_unlink=True)
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
scene.render.filepath = OUT + r"\rs_osm_creuse_top.png"
bpy.ops.render.render(write_still=True)

scene.camera = cam_drv
scene.render.filepath = OUT + r"\rs_osm_crease_driving.png"
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_mainfile()
print("done")
