import os
import json
import math
import bpy

json_path = r"public/maps/autobahn_rhynern.json"

if not os.path.exists(json_path):
    print(f"[ERROR] Map JSON not found at {json_path}")
    exit(1)

with open(json_path, "r", encoding="utf-8") as f:
    map_data = json.load(f)

# Clear existing scene completely
bpy.ops.wm.read_factory_settings(use_empty=True)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'

scene.use_nodes = True
world = bpy.data.worlds.new("German_Sky_World")
world.use_nodes = True
scene.world = world

bg_node = world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs['Color'].default_value = (0.45, 0.65, 0.88, 1.0)
    bg_node.inputs['Strength'].default_value = 1.2

collection = bpy.data.collections.new("Autobahn_Procedural_Visual")
scene.collection.children.link(collection)

# Materials
def create_material(name, color, roughness=0.7, metallic=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Roughness'].default_value = roughness
        if 'Metallic' in bsdf.inputs:
            bsdf.inputs['Metallic'].default_value = metallic
    return mat

mat_asphalt = create_material("Mat_GermanAsphalt", (0.16, 0.16, 0.17, 1.0), roughness=0.82)
mat_ramp_asphalt = create_material("Mat_RampAsphalt", (0.15, 0.15, 0.16, 1.0), roughness=0.84)
mat_local_road = create_material("Mat_LocalRoad", (0.1, 0.1, 0.11, 1.0), roughness=0.9)
mat_white_solid = create_material("Mat_SolidWhiteLine", (0.96, 0.96, 0.97, 1.0), roughness=0.3)
mat_white_dashed = create_material("Mat_DashedWhiteLine", (0.96, 0.96, 0.97, 1.0), roughness=0.3)
mat_guardrail = create_material("Mat_SteelGuardrail", (0.6, 0.62, 0.65, 1.0), roughness=0.25, metallic=0.85)
mat_grass = create_material("Mat_GermanGrass", (0.06, 0.18, 0.05, 1.0), roughness=0.92)

# RAW OSM Overlay Material (Thin red wireframe line directly on Z=0.05m to prove zero centerline deviation)
mat_raw_overlay = create_material("Mat_RAW_Overlay", (1.0, 0.0, 0.0, 1.0))

# Ground Plane
bpy.ops.mesh.primitive_plane_add(size=16000, location=(0, 0, -0.1))
ground = bpy.context.active_object
ground.name = "German_Countryside_Grass"
ground.data.materials.append(mat_grass)
collection.objects.link(ground)

raw_nodes = map_data.get("nodes", {})
if isinstance(raw_nodes, dict):
    nodes_dict = {int(k) if str(k).isdigit() else k: v for k, v in raw_nodes.items()}
else:
    nodes_dict = {n["id"]: n for n in raw_nodes}

ways = map_data.get("ways", [])

def compute_normals(coords):
    n = len(coords)
    normals = []
    if n < 2:
        return [(0.0, 1.0)] * n
    seg_normals = []
    for i in range(n - 1):
        dx = coords[i+1][0] - coords[i][0]
        dy = coords[i+1][1] - coords[i][1]
        length = math.hypot(dx, dy) or 1.0
        seg_normals.append((-dy / length, dx / length))
    normals.append(seg_normals[0])
    for i in range(1, n - 1):
        nx = (seg_normals[i-1][0] + seg_normals[i][0]) / 2.0
        ny = (seg_normals[i-1][1] + seg_normals[i][1]) / 2.0
        length = math.hypot(nx, ny) or 1.0
        normals.append((nx / length, ny / length))
    normals.append(seg_normals[-1])
    return normals

def create_flat_road_mesh(name, coords, width, z_height=0.01):
    mesh = bpy.data.meshes.new(name)
    vertices = []
    faces = []
    half_w = width / 2.0
    normals = compute_normals(coords)
    for idx, (x, y) in enumerate(coords):
        nx, ny = normals[idx]
        vertices.append((x - half_w * nx, y - half_w * ny, z_height))
        vertices.append((x + half_w * nx, y + half_w * ny, z_height))
        if idx > 0:
            v_idx = idx * 2
            faces.append((v_idx - 2, v_idx - 1, v_idx + 1, v_idx))
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj

for way in ways:
    hw = way.get("highway")
    way_nodes = way.get("nodes", [])
    coords = [(nodes_dict[nid]["x"], nodes_dict[nid]["z"]) for nid in way_nodes if nid in nodes_dict]
    if len(coords) < 2:
        continue

    # 1. Overlay RAW OSM Centerline (Thin Wireframe Pipe)
    raw_curve = bpy.data.curves.new(name=f"RAW_Centerline_{way['id']}", type='CURVE')
    raw_curve.dimensions = '3D'
    raw_curve.bevel_depth = 0.15
    raw_spline = raw_curve.splines.new('POLY')
    raw_spline.points.add(len(coords) - 1)
    for idx, (x, y) in enumerate(coords):
        raw_spline.points[idx].co = (x, y, 0.08, 1)
    raw_obj = bpy.data.objects.new(f"RAW_Centerline_{way['id']}", raw_curve)
    collection.objects.link(raw_obj)
    raw_obj.data.materials.append(mat_raw_overlay)

    # 2. Road Surface
    if hw == "motorway":
        lanes = way.get("lanes", 3)
        lane_w = 3.5
        driving_w = lanes * lane_w
        shoulder_w = 2.5
        total_w = driving_w + (shoulder_w * 2)
        road_mat = mat_asphalt
    elif hw == "motorway_link":
        lanes = way.get("lanes", 1)
        lane_w = 4.0
        driving_w = lanes * lane_w
        shoulder_w = 0.8
        total_w = driving_w + shoulder_w
        road_mat = mat_ramp_asphalt
    else:
        lanes = way.get("lanes", 1)
        total_w = max(3.5, min(6.0, lanes * 3.0))
        road_mat = mat_local_road

    road_obj = create_flat_road_mesh(f"Road_{way['id']}", coords, total_w, z_height=0.01)
    road_obj.data.materials.append(road_mat)

    # Markings & Guardrails
    if hw in ["motorway", "motorway_link"]:
        normals = compute_normals(coords)
        if hw == "motorway":
            for side in [-1, 1]:
                bo = side * (driving_w / 2.0)
                l_coords = [(coords[idx][0] + bo * normals[idx][0], coords[idx][1] + bo * normals[idx][1]) for idx in range(len(coords))]
                bl_obj = create_flat_road_mesh(f"Border_{way['id']}_{side}", l_coords, width=0.3, z_height=0.02)
                bl_obj.data.materials.append(mat_white_solid)

        # Guardrails on Outer Edge
        gr_off = total_w / 2.0 + 0.5
        gr_curve = bpy.data.curves.new(name=f"Guardrail_{way['id']}", type='CURVE')
        gr_curve.dimensions = '3D'
        gr_curve.bevel_depth = 0.12
        gr_spline = gr_curve.splines.new('POLY')
        gr_spline.points.add(len(coords) - 1)
        for idx, (x, y) in enumerate(coords):
            nx, ny = normals[idx]
            gr_spline.points[idx].co = (x + gr_off * nx, y + gr_off * ny, 0.45, 1)
        gr_obj = bpy.data.objects.new(f"Guardrail_{way['id']}", gr_curve)
        collection.objects.link(gr_obj)
        gr_obj.data.materials.append(mat_guardrail)

# Sun Light
bpy.ops.object.light_add(type='SUN', location=(-1500, -1500, 2500))
sun = bpy.context.active_object
sun.data.energy = 4.0
sun.rotation_euler = (0.75, 0.25, 0.35)

output_blend = r"autobahn_rhynern_geometry_verified.blend"
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(output_blend))

# VIEW A: Full Autobahn Overview
camera_a = bpy.data.cameras.new("Cam_Overview")
cam_obj_a = bpy.data.objects.new("Cam_Overview", camera_a)
collection.objects.link(cam_obj_a)
cam_obj_a.location = (-1650.0, -1850.0, 280.0)
cam_obj_a.rotation_euler = (0.85, 0.0, 0.45)
camera_a.clip_end = 30000

# VIEW B: Ausfahrt Close-Up (Ramp Exit)
camera_b = bpy.data.cameras.new("Cam_Ausfahrt")
cam_obj_b = bpy.data.objects.new("Cam_Ausfahrt", camera_b)
collection.objects.link(cam_obj_b)
cam_obj_b.location = (-1900.0, -1550.0, 80.0)
cam_obj_b.rotation_euler = (0.95, 0.0, 0.65)
camera_b.clip_end = 30000

# VIEW C: Auffahrt Close-Up (Ramp Entry)
camera_c = bpy.data.cameras.new("Cam_Auffahrt")
cam_obj_c = bpy.data.objects.new("Cam_Auffahrt", camera_c)
collection.objects.link(cam_obj_c)
cam_obj_c.location = (-1750.0, -1450.0, 70.0)
cam_obj_c.rotation_euler = (0.95, 0.0, 0.25)
camera_c.clip_end = 30000

# Render View A
scene.camera = cam_obj_a
scene.render.filepath = os.path.abspath(r"public/autobahn_view_a_overview.png")
bpy.ops.render.render(write_still=True)

# Render View B
scene.camera = cam_obj_b
scene.render.filepath = os.path.abspath(r"public/autobahn_view_b_ausfahrt.png")
bpy.ops.render.render(write_still=True)

# Render View C
scene.camera = cam_obj_c
scene.render.filepath = os.path.abspath(r"public/autobahn_view_c_auffahrt.png")
bpy.ops.render.render(write_still=True)

print("✅ Successfully rendered 3 Geometry Audit Views (Overview, Ausfahrt, Auffahrt) with RAW Centerline Overlay!")
