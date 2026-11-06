import bpy
from mathutils import Vector

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"

def socket_id(ng, name, nth=0):
    k = 0
    for it in ng.interface.items_tree:
        if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name == name:
            if k == nth:
                return it.identifier
            k += 1
    return None

HALF_WIDTH = {
    "Roadscape_A2_Curve": 16.0,    # A2: 2x3 làn + lề
    "Roadscape_Ramps_Curve": 6.0,
    "Roadscape_B63_Curve": 7.5,
}

ng = bpy.data.node_groups.get("Roadscape 4-13-10")

for obj_name, hw in HALF_WIDTH.items():
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        continue
    # Radius từng điểm curve = nửa chiều rộng đường
    for sp in obj.data.splines:
        for p in sp.points:
            p.radius = hw
    mod = obj.modifiers[0]
    for name, value in [('Show Road', True), ('Use Legacy Width', True)]:
        ident = socket_id(ng, name)
        if ident is not None:
            mod[ident] = value
    print(f"{obj_name}: radius={hw}, Show Road=True, Legacy Width=True")

# ── Render gần hơn: ortho scale 1400 quanh nút AS18 ──
mins = Vector((1e9, 1e9, 0)); maxs = Vector((-1e9, -1e9, 0))
obj = bpy.data.objects.get("Roadscape_A2_Curve")
for sp in obj.data.splines:
    for p in sp.points:
        mins.x = min(mins.x, p.co.x); mins.y = min(mins.y, p.co.y)
        maxs.x = max(maxs.x, p.co.x); maxs.y = max(maxs.y, p.co.y)
cx, cy = (mins.x + maxs.x) / 2, (mins.y + maxs.y) / 2
print(f"A2 center ({cx:.0f},{cy:.0f})")

scene = bpy.context.scene
cam_top = bpy.data.objects.get("Cam_Top_Ortho")
cam_top.data.ortho_scale = 1600
cam_top.location = (cx, cy, 600)
cam_top.rotation_euler = (0, 0, 0)

cam_drv = bpy.data.objects.get("Cam_Driving_View")
cam_drv.location = (cx - 80, cy - 220, 30)
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
scene.render.filepath = OUT + r"\roadscape_final_top.png"
bpy.ops.render.render(write_still=True)

scene.camera = cam_drv
scene.render.filepath = OUT + r"\roadscape_final_driving.png"
bpy.ops.render.render(write_still=True)
print("done")
