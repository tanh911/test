import bpy
import os
import json

blend_path = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\roadscape_v413_run.blend"
asset_blend_path = r"G:\road\Roadscape\Roadscape\Roadscape v4.13.10 (Asset Library)\Roadscape 4 (Release).blend"
osm_json_path = r"G:\road\osm_road_data.json"

print("==========================================")
print("--- Roadscape v4.13 Generator Pipeline ---")
print("==========================================")

# 1. Load OSM Data
with open(osm_json_path, 'r', encoding='utf-8') as f:
    osm_data = json.load(f)

nodes_map = osm_data.get('node_locations', {})
ways = osm_data.get('ways', [])

a2_ways = [w for w in ways if w.get('highway') == 'motorway']
ramp_ways = [w for w in ways if w.get('highway') == 'motorway_link']
b63_ways = [w for w in ways if w.get('highway') in ['primary', 'secondary', 'secondary_link', 'tertiary']]

print(f"OSM Parsed -> A2: {len(a2_ways)} ways | Ramps: {len(ramp_ways)} ways | B63 & Local: {len(b63_ways)} ways")

# 2. Append Roadscape Node Group & Materials from Asset Library
if "Roadscape 4-13-10" not in bpy.data.node_groups:
    print("Appending 'Roadscape 4-13-10' from Asset Library...")
    with bpy.data.libraries.load(asset_blend_path, link=False) as (data_from, data_to):
        if "Roadscape 4-13-10" in data_from.node_groups:
            data_to.node_groups = ["Roadscape 4-13-10"]
        data_to.materials = data_from.materials

node_group = bpy.data.node_groups.get("Roadscape 4-13-10")
print("Roadscape Node Group loaded:", node_group)

# 3. Create Clean Collection
col_name = "Roadscape_V413_Skeleton"
if col_name in bpy.data.collections:
    col = bpy.data.collections[col_name]
else:
    col = bpy.data.collections.new(col_name)
    bpy.context.scene.collection.children.link(col)

def build_mesh_road_object(obj_name, way_list):
    # Remove existing object if present
    if obj_name in bpy.data.objects:
        existing_obj = bpy.data.objects[obj_name]
        bpy.data.objects.remove(existing_obj, do_unlink=True)
        
    vertices = []
    edges = []
    
    for way in way_list:
        node_ids = way.get('node_ids', [])
        way_vert_indices = []
        for nid in node_ids:
            nid_str = str(nid)
            if nid_str in nodes_map:
                nd = nodes_map[nid_str]
                idx = len(vertices)
                # Elevate slightly (+0.25m) to sit cleanly on 3D terrain
                vertices.append((nd['x'], nd['y'], nd.get('z', 0.0) + 0.25))
                way_vert_indices.append(idx)
        
        for i in range(len(way_vert_indices) - 1):
            edges.append((way_vert_indices[i], way_vert_indices[i+1]))
            
    mesh = bpy.data.meshes.new(name=obj_name + "_Mesh")
    mesh.from_pydata(vertices, edges, [])
    mesh.update()
    
    mesh_obj = bpy.data.objects.new(obj_name, mesh)
    col.objects.link(mesh_obj)
    print(f"Created MESH Road Object: {obj_name} ({len(vertices)} verts, {len(edges)} edges).")
    return mesh_obj

a2_mesh_obj = build_mesh_road_object("Roadscape_A2_Mainline", a2_ways)
ramp_mesh_obj = build_mesh_road_object("Roadscape_AS18_Ramps", ramp_ways)
b63_mesh_obj = build_mesh_road_object("Roadscape_B63_Werler", b63_ways)

# 4. Attach Roadscape v4.13 Geometry Nodes Modifier to Mesh Objects
if node_group:
    for obj, mod_name in [(a2_mesh_obj, "Mod_Roadscape_A2"), (ramp_mesh_obj, "Mod_Roadscape_Ramps"), (b63_mesh_obj, "Mod_Roadscape_B63")]:
        mod = obj.modifiers.new(name=mod_name, type='NODES')
        mod.node_group = node_group
        print(f"Attached Roadscape v4.13 modifier to MESH object {obj.name}")

# 5. Position Verification Cameras & Render Top Ortho & Driving Views
cam_top = bpy.data.objects.get("Cam_Top_Ortho")
if not cam_top:
    cam_data = bpy.data.cameras.new("Cam_Top_Ortho_Data")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 1200.0
    cam_top = bpy.data.objects.new("Cam_Top_Ortho", cam_data)
    bpy.context.scene.collection.objects.link(cam_top)

cam_top.location = (0, 0, 800)
cam_top.rotation_euler = (0, 0, 0)

cam_drive = bpy.data.objects.get("Cam_Driving_View")
if not cam_drive:
    cam_data2 = bpy.data.cameras.new("Cam_Driving_Data")
    cam_data2.type = 'PERSP'
    cam_data2.lens = 35.0
    cam_drive = bpy.data.objects.new("Cam_Driving_View", cam_data2)
    bpy.context.scene.collection.objects.link(cam_drive)

cam_drive.location = (-150, -120, 25)
cam_drive.rotation_euler = (1.2, 0, -0.6)

scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720

# Render Top View
scene.camera = cam_top
scene.render.filepath = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots\roadscape_v413_top.png"
bpy.ops.render.render(write_still=True)
print("Rendered Top Ortho View -> G:\\road\\roadscape_v413_top.png")

# Render Driving View
scene.camera = cam_drive
scene.render.filepath = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots\roadscape_v413_driving.png"
bpy.ops.render.render(write_still=True)
print("Rendered Driving View -> G:\\road\\roadscape_v413_driving.png")

# Save Scene
bpy.ops.wm.save_mainfile(filepath=blend_path)
print("Saved blend file to:", blend_path)
print("==========================================")
