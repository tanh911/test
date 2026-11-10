import bpy
from mathutils import Vector

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"

# Bounds gộp của cả 3 skeleton
mins = Vector((1e9, 1e9, 1e9)); maxs = Vector((-1e9, -1e9, -1e9))
for name in ["Roadscape_A2_Mainline", "Roadscape_AS18_Ramps", "Roadscape_B63_Werler"]:
    obj = bpy.data.objects.get(name)
    if obj and obj.data:
        for v in obj.data.vertices:
            co = obj.matrix_world @ v.co
            mins.x = min(mins.x, co.x); mins.y = min(mins.y, co.y)
            maxs.x = max(maxs.x, co.x); maxs.y = max(maxs.y, co.y)
cx, cy = (mins.x + maxs.x) / 2, (mins.y + maxs.y) / 2
span = max(maxs.x - mins.x, maxs.y - mins.y)
print(f"BOUNDS: x[{mins.x:.0f},{maxs.x:.0f}] y[{mins.y:.0f},{maxs.y:.0f}] center=({cx:.0f},{cy:.0f}) span={span:.0f}")

scene = bpy.context.scene

cam_top = bpy.data.objects.get("Cam_Top_Ortho")
cam_top.data.ortho_scale = span * 1.05
cam_top.location = (cx, cy, 600)
cam_top.rotation_euler = (0, 0, 0)

# Driving cam: đặt trên A2, track vào tâm mạng đường
cam_drv = bpy.data.objects.get("Cam_Driving_View")
cam_drv.data.lens = 35
cam_drv.location = (cx - 100, cy - 260, 45)

target = bpy.data.objects.new("DrvTarget", None)
target.location = (cx, cy, 2)
scene.collection.objects.link(target)
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
scene.render.filepath = OUT + r"\roadscape_ribbon_top2.png"
bpy.ops.render.render(write_still=True)

scene.camera = cam_drv
scene.render.filepath = OUT + r"\roadscape_ribbon_driving2.png"
bpy.ops.render.render(write_still=True)
print("done")
