import bpy

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"

# ── 1. Bật chế độ road thật (tắt wireframe-only) trên mọi modifier Roadscape ──
def socket_id_by_name(ng, name):
    for item in ng.interface.items_tree:
        if item.item_type == 'SOCKET' and item.in_out == 'INPUT' and item.name == name:
            return item.identifier
    return None

fixed = 0
for obj in bpy.data.objects:
    for m in obj.modifiers:
        if m.type == 'NODES' and m.node_group and 'Roadscape' in (m.node_group.name or ''):
            ng = m.node_group
            for name, value in [
                ('Wireframe Only', False),
                ('Display Support', False),      # bớt rác visual, chỉ mặt đường + vạch
                ('Display Sidewalks', False),
                ('Display Terrain', False),
                ('Smooth Iterations', 2),
                ('Path Subdivision Level', 3),
            ]:
                ident = socket_id_by_name(ng, name)
                if ident is not None:
                    m[ident] = value
                    fixed += 1
            print(f"Configured {obj.name}: Wireframe Only -> False")

print(f"Set {fixed} socket values")

# ── 2. Cameras ──
scene = bpy.context.scene

# Tâm của skeleton A2 để nhắm camera
a2 = bpy.data.objects.get("Roadscape_A2_Mainline")
cx = cz = 0.0
if a2 and a2.data and a2.data.vertices:
    xs = [v.co.x for v in a2.data.vertices]
    ys = [v.co.y for v in a2.data.vertices]
    cx, cz = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    print(f"A2 center: ({cx:.0f}, {cz:.0f})")

cam_top = bpy.data.objects.get("Cam_Top_Ortho")
if cam_top:
    cam_top.data.ortho_scale = 700.0
    cam_top.location = (cx, cz, 500)
    cam_top.rotation_euler = (0, 0, 0)

cam_drv = bpy.data.objects.get("Cam_Driving_View") or bpy.data.objects.new(
    "Cam_Driving_View", bpy.data.cameras.new("Cam_Driving_Data"))
if cam_drv.name not in [o.name for o in scene.collection.objects]:
    scene.collection.objects.link(cam_drv)
cam_drv.data.lens = 32
cam_drv.location = (cx - 120, cz - 150, 22)
cam_drv.rotation_euler = (1.25, 0, -0.5)

# ── 3. Render Workbench có cavity + shadow cho dễ đọc hình ──
scene.render.engine = 'BLENDER_WORKBENCH'
shd = scene.display.shading
shd.light = 'STUDIO'
shd.color_type = 'MATERIAL'
shd.show_cavity = True
shd.cavity_type = 'BOTH'
shd.show_shadows = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 900

scene.camera = cam_top
scene.render.filepath = OUT + r"\roadscape_ribbon_top.png"
bpy.ops.render.render(write_still=True)
print("rendered top")

scene.camera = cam_drv
scene.render.filepath = OUT + r"\roadscape_ribbon_driving.png"
bpy.ops.render.render(write_still=True)
print("rendered driving")

bpy.ops.wm.save_mainfile()
print("saved")
