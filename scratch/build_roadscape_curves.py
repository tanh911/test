import bpy, json, sys
from mathutils import Vector

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"
OSM_JSON = r"G:\road\osm_road_data.json"

# ── 1. Xóa skeleton mesh cũ + modifier cũ ──
for name in ["Roadscape_A2_Mainline", "Roadscape_AS18_Ramps", "Roadscape_B63_Werler"]:
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)

col = bpy.data.collections.get("Roadscape_V413_Skeleton") or bpy.data.collections.new("Roadscape_V413_Skeleton")
if col.name not in [c.name for c in bpy.context.scene.collection.children]:
    bpy.context.scene.collection.children.link(col)

# ── 2. Load OSM và dựng CURVE objects (workflow chuẩn Roadscape) ──
with open(OSM_JSON, encoding='utf-8') as f:
    osm = json.load(f)
nodes_map = osm.get('node_locations', {})
ways = osm.get('ways', [])

groups = {
    "Roadscape_A2_Curve":  [w for w in ways if w.get('highway') == 'motorway'],
    "Roadscape_Ramps_Curve": [w for w in ways if w.get('highway') == 'motorway_link'],
    "Roadscape_B63_Curve": [w for w in ways if w.get('highway') in ('primary', 'secondary', 'secondary_link', 'tertiary')],
}

def socket_id(ng, name):
    for it in ng.interface.items_tree:
        if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name == name:
            return it.identifier
    return None

ng = bpy.data.node_groups.get("Roadscape 4-13-10")

for obj_name, way_list in groups.items():
    cu = bpy.data.curves.new(obj_name + "_Curve", type='CURVE')
    cu.dimensions = '3D'
    n_curves = 0
    for way in way_list:
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
        n_curves += 1
    obj = bpy.data.objects.new(obj_name, cu)
    col.objects.link(obj)
    print(f"{obj_name}: {n_curves} splines")

    if ng:
        mod = obj.modifiers.new("Mod_Roadscape", type='NODES')
        mod.node_group = ng
        for name, value in [
            ('Wireframe Only', False),
            ('Display Support', False),
            ('Display Sidewalks', False),
            ('Display Terrain', False),
            ('Smooth Iterations', 2),
            ('Resampling Length', 6.0),
        ]:
            ident = socket_id(ng, name)
            if ident is not None:
                mod[ident] = value

# ── 3. Bounds + cameras ──
mins = Vector((1e9, 1e9, 0)); maxs = Vector((-1e9, -1e9, 0))
for obj_name in groups:
    obj = bpy.data.objects.get(obj_name)
    if obj:
        for v in obj.data.vertices if hasattr(obj.data, 'vertices') else obj.data.splines:
            pass
        for sp in obj.data.splines:
            for p in sp.points:
                mins.x = min(mins.x, p.co.x); mins.y = min(mins.y, p.co.y)
                maxs.x = max(maxs.x, p.co.x); maxs.y = max(maxs.y, p.co.y)
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
cam_drv.location = (cx - 120, cy - 300, 40)
old_target = bpy.data.objects.get("DrvTarget")
if old_target:
    bpy.data.objects.remove(old_target, do_unlink=True)
target = bpy.data.objects.new("DrvTarget", None)
target.location = (cx + 100, cy + 100, 2)
scene.collection.objects.link(target)
for c in list(cam_drv.constraints):
    cam_drv.constraints.remove(c)
con = cam_drv.constraints.new('TRACK_TO')
con.target = target
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis = 'UP_Y'

scene.render.engine = 'BLENDER_WORKBENCH'
shd = scene.display.shading
shd.light = 'STUDIO'
shd.color_type = 'MATERIAL'
shd.show_cavity = True
shd.show_shadows = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 900

scene.camera = cam_top
scene.render.filepath = OUT + r"\roadscape_curve_top.png"
bpy.ops.render.render(write_still=True)

scene.camera = cam_drv
scene.render.filepath = OUT + r"\roadscape_curve_driving.png"
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_mainfile()
print("done")
