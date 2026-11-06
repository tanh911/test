import os
import json
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
scene.use_nodes = True
world = bpy.data.worlds.new("German_Sky_World")
world.use_nodes = True
scene.world = world

bg_node = world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs['Color'].default_value = (0.05, 0.05, 0.08, 1.0)
    bg_node.inputs['Strength'].default_value = 1.0

# Add Sun light
bpy.ops.object.light_add(type='SUN', location=(-1500, -1500, 2500))
sun = bpy.context.active_object
sun.data.energy = 3.0

collection = bpy.data.collections.new("RAW_OSM_TRUTH_LAYER")
scene.collection.children.link(collection)

raw_nodes = map_data.get("nodes", {})
if isinstance(raw_nodes, dict):
    nodes_dict = {int(k) if str(k).isdigit() else k: v for k, v in raw_nodes.items()}
else:
    nodes_dict = {n["id"]: n for n in raw_nodes}

ways = map_data.get("ways", [])

print(f"[RAW OSM DEBUG] Rendering {len(ways)} RAW polylines without mesh, smoothing, offset, or lanes...")

# Materials by highway tag
def create_line_mat(name, color):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
    return mat

mat_motorway = create_line_mat("RAW_Mat_Motorway", (1.0, 0.0, 0.0, 1.0))      # Red for Motorway
mat_link = create_line_mat("RAW_Mat_MotorwayLink", (1.0, 1.0, 0.0, 1.0))     # Yellow for Motorway Link
mat_service = create_line_mat("RAW_Mat_Service", (0.0, 0.8, 1.0, 1.0))        # Cyan for Local/Service

count = 0
for way in ways:
    hw = way.get("highway")
    way_nodes = way.get("nodes", [])
    
    coords = []
    for nid in way_nodes:
        if nid in nodes_dict:
            n = nodes_dict[nid]
            coords.append((n["x"], n["z"]))
            
    if len(coords) < 2:
        continue

    curve = bpy.data.curves.new(name=f"RAW_WAY_{way['id']}", type='CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = 0.2  # 20cm thin tube wireframe for visibility
    curve.extrude = 0.0
    
    spline = curve.splines.new('POLY')
    spline.points.add(len(coords) - 1)
    
    for idx, (x, y) in enumerate(coords):
        spline.points[idx].co = (x, y, 0.0, 1)

    obj = bpy.data.objects.new(f"RAW_WAY_{way['id']}_{hw}", curve)
    collection.objects.link(obj)
    
    if hw == "motorway":
        obj.data.materials.append(mat_motorway)
    elif hw == "motorway_link":
        obj.data.materials.append(mat_link)
    else:
        obj.data.materials.append(mat_service)
        
    count += 1

print(f"✅ Generated {count} RAW OSM Polylines in Blender scene!")

output_blend = r"autobahn_rhynern_raw_osm.blend"
abs_blend_path = os.path.abspath(output_blend)
bpy.ops.wm.save_as_mainfile(filepath=abs_blend_path)

# Camera Bird-eye overview of interchange
bpy.ops.object.camera_add(location=(-1650.0, -1850.0, 280.0), rotation=(0.85, 0.0, 0.45))
camera = bpy.context.active_object
camera.data.clip_end = 30000
scene.camera = camera

render_img_path = r"public/autobahn_raw_osm_preview.png"
abs_preview_path = os.path.abspath(render_img_path)
scene.render.filepath = abs_preview_path
bpy.ops.render.render(write_still=True)

print(f"✅ Saved RAW Debug Scene: {abs_blend_path}")
print(f"✅ Rendered RAW Debug Screenshot: {abs_preview_path}")
