import bpy, json
from mathutils import Vector

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"
OSM_JSON = r"G:\road\osm_road_data.json"

# ── 1. Dọn curve test cũ ──
for name in ["Roadscape_A2_Curve", "Roadscape_Ramps_Curve", "Roadscape_B63_Curve", "Test_RS_Road"]:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

col = bpy.data.collections.get("Roadscape_V413_Skeleton")
if not col:
    col = bpy.data.collections.new("Roadscape_V413_Skeleton")
    bpy.context.scene.collection.children.link(col)

ng = bpy.data.node_groups.get("Roadscape 4-13-10")

def socket_ids(ng, name):
    return [it.identifier for it in ng.interface.items_tree
            if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name == name]

# ── 2. Dựng MESH EDGE skeleton (đúng format carrier của template) ──
with open(OSM_JSON, encoding='utf-8') as f:
    osm = json.load(f)
nodes_map = osm.get('node_locations', {})
ways = osm.get('ways', [])

groups = [
    ("RS_OSM_A2",     [w for w in ways if w.get('highway') == 'motorway'], 0.10),
    ("RS_OSM_Ramps",  [w for w in ways if w.get('highway') == 'motorway_link'], 0.04),
    ("RS_OSM_B63",    [w for w in ways if w.get('highway') in ('primary', 'secondary', 'secondary_link', 'tertiary')], 0.05),
]

CONFIG = [
    ('Wireframe Only', False), ('Show Road', True), ('Show Support', False),
    ('Display Sidewalks', False), ('Display Support', False), ('Display Terrain', False),
    ('Generation Mode', 1),          # 1 = OSM mode (template dùng 1, default 0 = Legacy)
    ('Smooth Iterations', 25), ('Subdivide Roads', True), ('Subdivision Level', 2),
    ('Output Subdivided Path Mesh for Markings', True),
    ('Use Legacy Width', False),
    ('Enable', True),                # set True cho TẤT CẢ các socket Enable (crease/elevation...)
]

for obj_name, way_list, crease_w in groups:
    verts, edges = [], []
    for way in way_list:
        idxs = []
        for nid in way.get('node_ids', []):
            nd = nodes_map.get(str(nid))
            if nd:
                idxs.append(len(verts))
                verts.append((nd['x'], nd['y'], nd.get('z', 0.0) + 0.25))
        for i in range(len(idxs) - 1):
            edges.append((idxs[i], idxs[i + 1]))
    mesh = bpy.data.meshes.new(obj_name + "_Mesh")
    mesh.from_pydata(verts, edges, [])
    mesh.update()
    # crease_edge = quy định width (Min 0.1 → Max 250 linear)
    if edges:
        ce = mesh.attributes.new('crease_edge', 'FLOAT', 'EDGE')
        for i, e in enumerate(mesh.edges):
            ce.data[i].value = crease_w
    obj = bpy.data.objects.new(obj_name, mesh)
    col.objects.link(obj)

    mod = obj.modifiers.new("Mod_RS_OSM", type='NODES')
    mod.node_group = ng
    for name, value in CONFIG:
        for ident in socket_ids(ng, name):
            mod[ident] = value
    print(f"{obj_name}: {len(verts)} verts, {len(edges)} edges, crease={crease_w}")

# ── 3. Bounds + cameras ──
mins = Vector((1e9, 1e9, 0)); maxs = Vector((-1e9, -1e9, 0))
for obj_name, _, _ in groups:
    o = bpy.data.objects.get(obj_name)
    for v in o.data.vertices:
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
scene.render.filepath = OUT + r"\rs_osm_mesh_top.png"
bpy.ops.render.render(write_still=True)

scene.camera = cam_drv
scene.render.filepath = OUT + r"\rs_osm_mesh_driving.png"
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_mainfile()
print("done")
