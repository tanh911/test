import bpy
import json
from mathutils import Vector

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"
OSM_JSON = r"G:\road\osm_road_data.json"

# Lấy 1 đoạn A2 dài làm curve test (tách từ cách A2 đúng ra)
with open(OSM_JSON, encoding='utf-8') as f:
    osm = json.load(f)
nodes_map = osm.get('node_locations', {})
a2_ways = [w for w in osm.get('ways', []) if w.get('highway') == 'motorway']

# Curve test: cách A2
cu = bpy.data.curves.new("TestCurve", type='CURVE')
cu.dimensions = '3D'
n_splines = 0
for way in a2_ways[:8]:
    pts = []
    for nid in way.get('node_ids', []):
        nd = nodes_map.get(str(nid))
        if nd:
            pts.append((nd['x'], nd['y'], nd.get('z', 0.0) + 0.25))
    if len(pts) < 2:
        continue
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p[0], p[1], p[2], 1.0)
        sp.points[i].radius = 16.0
    n_splines += 1
print("test splines:", n_splines)

obj = bpy.data.objects.new("Test_RS_Road", cu)
bpy.context.scene.collection.objects.link(obj)

# Gắn sub-group Road Mesh Gen trực tiếp
rmg = bpy.data.node_groups.get("Road Mesh Gen")
print("Road Mesh Gen found:", bool(rmg))
if rmg:
    mod = obj.modifiers.new("RMG", type='NODES')
    mod.node_group = rmg
    print("RMG interface inputs:")
    for it in rmg.interface.items_tree:
        if it.item_type == 'SOCKET':
            io = 'IN ' if it.in_out == 'INPUT' else 'OUT'
            dv = ''
            if it.in_out == 'INPUT':
                try:
                    dv = getattr(it, 'default_value', '')
                except Exception:
                    dv = '?'
            print(f"   [{io}] {it.name} = {dv}")

# Camera render
mins = Vector((1e9, 1e9, 0)); maxs = Vector((-1e9, -1e9, 0))
for sp in cu.splines:
    for p in sp.points:
        mins.x = min(mins.x, p.co.x); mins.y = min(mins.y, p.co.y)
        maxs.x = max(maxs.x, p.co.x); maxs.y = max(maxs.y, p.co.y)
cx, cy = (mins.x + maxs.x) / 2, (mins.y + maxs.y) / 2
span = max(maxs.x - mins.x, maxs.y - mins.y)
print(f"test span {span:.0f} center ({cx:.0f},{cy:.0f})")

cam_data = bpy.data.cameras.new("TestCam")
cam_data.type = 'ORTHO'
cam_data.ortho_scale = span * 1.1
cam = bpy.data.objects.new("TestCam", cam_data)
bpy.context.scene.collection.objects.link(cam)
cam.location = (cx, cy, 500)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
shd = scene.display.shading
shd.light = 'STUDIO'
shd.color_type = 'MATERIAL'
shd.show_cavity = True
scene.render.resolution_x = 1400
scene.render.resolution_y = 900
scene.camera = cam
scene.render.filepath = OUT + r"\rmg_test.png"
bpy.ops.render.render(write_still=True)
print("done")
