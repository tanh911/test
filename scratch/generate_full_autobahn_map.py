import bpy
import bmesh
import math
import random
from mathutils import Vector

print("--- GENERATING FULL AUTOBAHN MAP: STADT A -> RASTSTÄTTE -> STADT B ---")

# 1. Reset Scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# 2. Materials
def get_mats():
    mats = {}
    
    # Grass terrain
    m = bpy.data.materials.new("Terrain_Grass")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.15, 0.42, 0.16, 1.0)
    mats["grass"] = m
    
    # Asphalt road
    m = bpy.data.materials.new("Road_Asphalt")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.06, 0.06, 0.07, 1.0)
    mats["asphalt"] = m

    # Concrete / Parking / Pavement
    m = bpy.data.materials.new("Concrete_Plaza")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.55, 0.55, 0.58, 1.0)
    mats["concrete"] = m
    
    # White Markings
    m = bpy.data.materials.new("White_Marking")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.95, 0.95, 0.95, 1.0)
    mats["white"] = m
    
    # Blue German Sign
    m = bpy.data.materials.new("German_Sign_Blue")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.0, 0.22, 0.55, 1.0)
    mats["blue_sign"] = m
    
    # House Roof (Red tile)
    m = bpy.data.materials.new("House_Roof_Red")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.6, 0.15, 0.1, 1.0)
    mats["roof"] = m

    # House Wall (White plaster)
    m = bpy.data.materials.new("House_Wall_White")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.85, 0.82, 0.78, 1.0)
    mats["wall"] = m
    
    # Tree leaves
    m = bpy.data.materials.new("Tree_Leaves")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.1, 0.35, 0.12, 1.0)
    mats["tree"] = m
    
    return mats

mats = get_mats()

# 3. Ground Base Plane (Map bounds 800m x 600m)
MAP_X = 800.0
MAP_Y = 600.0

bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "Ground_Terrain"
ground.scale = (MAP_X, MAP_Y, 1.0)
ground.data.materials.append(mats["grass"])

# 4. Main Highway A2 (Horizontal East-West across middle)
# 2 Directions (Eastbound / Westbound), 3 Lanes each
ROAD_Y = 0.0
A2_LENGTH = MAP_X

def create_a2_highway():
    # Eastbound (x: -400 to 400, y: -12.0 to -1.0)
    # Westbound (x: -400 to 400, y: 1.0 to 12.0)
    # Median at y: -1.0 to 1.0
    
    # Road mesh
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0.01))
    a2 = bpy.context.active_object
    a2.name = "Autobahn_A2_Main"
    a2.scale = (MAP_X, 28.0, 1.0)
    a2.data.materials.append(mats["asphalt"])
    
    # Center Median Grass
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0.02))
    med = bpy.context.active_object
    med.name = "A2_Median"
    med.scale = (MAP_X, 3.0, 1.0)
    med.data.materials.append(mats["grass"])

    # White Lane Markings for 3 Lanes each side
    # Dashed lines
    bm = bmesh.new()
    for y_offset in [-9.0, -5.25, 5.25, 9.0]: # Lane boundaries
        x_pos = -MAP_X/2
        while x_pos < MAP_X/2:
            v1 = bm.verts.new((x_pos, y_offset - 0.08, 0.03))
            v2 = bm.verts.new((x_pos, y_offset + 0.08, 0.03))
            v3 = bm.verts.new((x_pos + 6.0, y_offset + 0.08, 0.03))
            v4 = bm.verts.new((x_pos + 6.0, y_offset - 0.08, 0.03))
            bm.faces.new((v1, v2, v3, v4))
            x_pos += 18.0 # 6m line / 12m gap
            
    mesh_m = bpy.data.meshes.new("A2_Markings_Mesh")
    bm.to_mesh(mesh_m)
    bm.free()
    obj_m = bpy.data.objects.new("A2_Markings", mesh_m)
    obj_m.data.materials.append(mats["white"])
    scene.collection.objects.link(obj_m)

create_a2_highway()

# 5. Interchange A (Left - Stadt A Entrance/Exit Ramp Cloverleaf)
def create_interchange_a():
    # Bridge over A2 at X = -240m
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-240, 0, 6.0))
    bridge = bpy.context.active_object
    bridge.name = "Bridge_Interchange_A"
    bridge.scale = (12.0, 36.0, 1.5)
    bridge.data.materials.append(mats["concrete"])
    
    # Connecting road from Stadt A (top-left X=-260, Y=200 to Bridge X=-240, Y=0)
    # Ramps (Cloverleaf loops)
    for side in [1, -1]:
        # Off-ramp (Ausfahrt)
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=(-280, side * 25, 0.015))
        ramp = bpy.context.active_object
        ramp.name = f"Ramp_Ausfahrt_A_{side}"
        ramp.scale = (60.0, 8.0, 1.0)
        ramp.rotation_euler = (0, 0, math.radians(side * 25))
        ramp.data.materials.append(mats["asphalt"])

create_interchange_a()

# 6. Raststätte (Middle Service Rest Area at X = 0, Y = -45)
def create_raststatte():
    # Service Area Compound Ground
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -55, 0.015))
    compound = bpy.context.active_object
    compound.name = "Raststaette_Compound"
    compound.scale = (160.0, 65.0, 1.0)
    compound.data.materials.append(mats["concrete"])
    
    # Service Building / Restaurant / Shop
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -60, 4.0))
    bldg = bpy.context.active_object
    bldg.name = "Raststaette_Main_Building"
    bldg.scale = (35.0, 18.0, 8.0)
    bldg.data.materials.append(mats["wall"])

    # Roof
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -60, 8.3))
    roof = bpy.context.active_object
    roof.name = "Raststaette_Roof"
    roof.scale = (37.0, 20.0, 0.6)
    roof.data.materials.append(mats["roof"])

    # Gas Station Canopy (Tankstelle)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(45, -55, 5.0))
    canopy = bpy.context.active_object
    canopy.name = "Gas_Station_Canopy"
    canopy.scale = (22.0, 12.0, 0.5)
    canopy.data.materials.append(mats["white"])

    # Gas station pillars
    for px in [37, 53]:
        for py in [-59, -51]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=5.0, location=(px, py, 2.5))
            p = bpy.context.active_object
            p.data.materials.append(mats["concrete"])

create_raststatte()

# 7. Interchange B (Right - Stadt B Entrance/Exit Ramp at X = 240m)
def create_interchange_b():
    # Bridge over A2 at X = 240m
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(240, 0, 6.0))
    bridge = bpy.context.active_object
    bridge.name = "Bridge_Interchange_B"
    bridge.scale = (12.0, 36.0, 1.5)
    bridge.data.materials.append(mats["concrete"])

create_interchange_b()

# 8. Stadt A (Top-Left Town) & Stadt B (Bottom-Right Town) Houses
def create_towns():
    # Stadt A (Top-Left: X=-340 to -240, Y=160 to 260)
    for i in range(18):
        hx = -340 + random.random() * 90
        hy = 160 + random.random() * 90
        h_h = 6.0 + random.random() * 4.0
        
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(hx, hy, h_h/2))
        house = bpy.context.active_object
        house.name = f"StadtA_House_{i}"
        house.scale = (10.0, 12.0, h_h)
        house.data.materials.append(mats["wall"])
        
        # Roof
        bpy.ops.mesh.primitive_cone_add(radius1=8.0, depth=4.0, location=(hx, hy, h_h + 2.0))
        roof = bpy.context.active_object
        roof.data.materials.append(mats["roof"])

    # Stadt B (Bottom-Right: X=240 to 340, Y=-260 to -160)
    for i in range(18):
        hx = 240 + random.random() * 90
        hy = -260 + random.random() * 90
        h_h = 6.0 + random.random() * 4.0
        
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(hx, hy, h_h/2))
        house = bpy.context.active_object
        house.name = f"StadtB_House_{i}"
        house.scale = (10.0, 12.0, h_h)
        house.data.materials.append(mats["wall"])
        
        # Roof
        bpy.ops.mesh.primitive_cone_add(radius1=8.0, depth=4.0, location=(hx, hy, h_h + 2.0))
        roof = bpy.context.active_object
        roof.data.materials.append(mats["roof"])

create_towns()

# 9. Forest & Trees Scatter (Dense European Forest Terrain)
def scatter_forest():
    # Random trees across countryside
    for i in range(250):
        tx = -380 + random.random() * 760
        ty = -280 + random.random() * 560
        
        # Avoid highway & raststätte corridor
        if abs(ty) < 25 or (abs(tx) < 100 and ty > -90 and ty < 10):
            continue
            
        bpy.ops.mesh.primitive_ico_sphere_add(radius=2.5 + random.random()*1.5, subdivisions=2, location=(tx, ty, 3.5))
        tree = bpy.context.active_object
        tree.name = f"Forest_Tree_{i}"
        tree.data.materials.append(mats["tree"])

scatter_forest()

# 10. German Road Signs Labels (3D Blue Signs matching user's image)
signs_data = [
    ("Stadt A", (-290, 230, 12), (30, 8, 5)),
    ("Auffahrt (Einfahrt)", (-310, 110, 10), (32, 6, 4)),
    ("Ausfahrt (Abfahrt)", (-200, 110, 10), (32, 6, 4)),
    ("Raststätte", (0, 45, 10), (28, 6, 4)),
    ("Ausfahrt (Abfahrt)", (180, 110, 10), (32, 6, 4)),
    ("Auffahrt (Einfahrt)", (310, 110, 10), (32, 6, 4)),
    ("Stadt B", (290, -230, 12), (30, 8, 5)),
    ("← Dortmund (A2)", (-380, 20, 12), (32, 7, 5)),
    ("→ Berlin (A2)", (380, 20, 12), (32, 7, 5)),
]

for title, pos, sz in signs_data:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=pos)
    s = bpy.context.active_object
    s.name = f"Sign_{title}"
    s.scale = (sz[0], sz[1], sz[2])
    s.data.materials.append(mats["blue_sign"])

# 11. Lighting & Top-Down Isometric Camera View (Matching user's photo!)
if "Sun" not in scene.objects:
    bpy.ops.object.light_add(type='SUN', location=(200, 200, 400))
    sun = scene.objects["Sun"]
    sun.data.energy = 4.5
    sun.rotation_euler = (math.radians(40), math.radians(20), math.radians(35))

# Top-Down Overhead Camera matching exact angle in image
if "Camera" not in scene.objects:
    bpy.ops.object.camera_add(location=(0, -480, 520), rotation=(math.radians(48), 0, 0))
    cam = scene.objects["Camera"]
    scene.camera = cam

# 12. Save & Export
out_blend = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\full_autobahn_map_stadt_a_b.blend"
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print(f"Saved Full Autobahn Map Blend: {out_blend}")

out_glb = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\full_autobahn_map_stadt_a_b.glb"
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB')
print(f"Exported Full Autobahn Map GLB: {out_glb}")

# Render HD Preview matching user's photo angle
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = 'PNG'
preview_png = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\full_autobahn_map_preview.png"
scene.render.filepath = preview_png
bpy.ops.render.render(write_still=True)
print(f"Rendered Full Map Preview PNG: {preview_png}")

print("--- FULL AUTOBAHN MAP GENERATION COMPLETED ---")
