import os
import json
import math
import random
import bpy
import mathutils

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
json_path = os.path.join(base_dir, "public", "maps", "autobahn_rhynern.json")

if not os.path.exists(json_path):
    print(f"[ERROR] Map JSON not found at {json_path}")
    exit(1)

with open(json_path, "r", encoding="utf-8") as f:
    map_data = json.load(f)

# Clear existing objects in active scene safely without context reset
scene = bpy.context.scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

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

random.seed(42)

# --- Materials ---
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
mat_shoulder = create_material("Mat_HardShoulder", (0.13, 0.13, 0.14, 1.0), roughness=0.85)
mat_ramp_asphalt = create_material("Mat_RampAsphalt", (0.15, 0.15, 0.16, 1.0), roughness=0.84)
mat_local_road = create_material("Mat_LocalRoad", (0.1, 0.1, 0.11, 1.0), roughness=0.9)

mat_white_solid = create_material("Mat_SolidWhiteLine", (0.96, 0.96, 0.97, 1.0), roughness=0.3)
mat_white_dashed = create_material("Mat_DashedWhiteLine", (0.96, 0.96, 0.97, 1.0), roughness=0.3)
mat_guardrail = create_material("Mat_SteelGuardrail", (0.6, 0.62, 0.65, 1.0), roughness=0.25, metallic=0.85)
mat_median_barrier = create_material("Mat_ConcreteMedian", (0.35, 0.37, 0.40, 1.0), roughness=0.6)
mat_grass = create_material("Mat_GermanGrass", (0.06, 0.18, 0.05, 1.0), roughness=0.92)

mat_trunk = create_material("Mat_TreeTrunk", (0.12, 0.07, 0.03, 1.0), roughness=0.95)
mat_foliage_pine = create_material("Mat_PineFoliage", (0.03, 0.12, 0.04, 1.0), roughness=0.85)
mat_foliage_deciduous = create_material("Mat_DeciduousFoliage", (0.08, 0.22, 0.05, 1.0), roughness=0.88)
mat_foliage_bright = create_material("Mat_BrightFoliage", (0.12, 0.28, 0.06, 1.0), roughness=0.85)

mat_car_silver = create_material("Mat_CarSilver", (0.7, 0.72, 0.75, 1.0), roughness=0.2, metallic=0.9)
mat_car_black = create_material("Mat_CarBlack", (0.02, 0.02, 0.02, 1.0), roughness=0.25, metallic=0.8)
mat_truck_red = create_material("Mat_TruckRed", (0.7, 0.05, 0.05, 1.0), roughness=0.3)

# BUG #19 FIX: Ground Plane placed at z = -0.5 to eliminate Z-fighting with roads
plane_mesh = bpy.data.meshes.new("GrassMesh")
plane_mesh.from_pydata([(-8000, -8000, -0.5), (8000, -8000, -0.5), (8000, 8000, -0.5), (-8000, 8000, -0.5)], [], [(0, 1, 2, 3)])
plane_mesh.update()
ground = bpy.data.objects.new("German_Countryside_Grass", plane_mesh)
ground.data.materials.append(mat_grass)
collection.objects.link(ground)

raw_nodes = map_data.get("nodes", {})
if isinstance(raw_nodes, dict):
    nodes_dict = {int(k) if str(k).isdigit() else k: v for k, v in raw_nodes.items()}
else:
    nodes_dict = {n["id"]: n for n in raw_nodes}

raw_ways = map_data.get("ways", [])

# Merge main motorway ways, but KEEP motorway_link ramps unmerged to preserve 100% exact topology junction nodes
def merge_ways_by_connectivity(ways):
    merged = []
    by_hw = {}
    for w in ways:
        hw = w.get("highway", "unknown")
        if hw == "motorway_link":
            # Keep ramps exact raw polylines to prevent node disconnections
            merged.append(w)
            continue
            
        ref = w.get("ref", w.get("name", "unnamed"))
        is_oneway = bool(w.get("oneway", True) or w.get("tags", {}).get("oneway") == "yes")
        key = f"{hw}_{ref}_{is_oneway}"
        if key not in by_hw:
            by_hw[key] = []
        by_hw[key].append(w)
        
    for key, group in by_hw.items():
        used = set()
        for w in group:
            if w["id"] in used:
                continue
            chain_nodes = list(w["nodes"])
            chain_tags = dict(w)
            used.add(w["id"])
            
            extended = True
            while extended:
                extended = False
                for other in group:
                    if other["id"] in used:
                        continue
                    if chain_nodes[-1] == other["nodes"][0]:
                        chain_nodes.extend(other["nodes"][1:])
                        used.add(other["id"])
                        extended = True
                    elif chain_nodes[0] == other["nodes"][-1]:
                        chain_nodes = other["nodes"][:-1] + chain_nodes
                        used.add(other["id"])
                        extended = True
            
            chain_tags["nodes"] = chain_nodes
            chain_tags["id"] = f"merged_{key}_{len(merged)}"
            merged.append(chain_tags)
    return merged

ways = merge_ways_by_connectivity(raw_ways)
print(f"Processed {len(raw_ways)} raw OSM ways into {len(ways)} topology-perfect road polylines.")

road_splines = []

print("Building High-Quality Procedural Autobahn Environment from OSM Topology...")

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

# BUG #19 FIX: z_height elevated to 0.1 for roads
def create_flat_road_mesh(name, coords, width, z_height=0.1):
    mesh = bpy.data.meshes.new(name)
    vertices = []
    faces = []
    
    half_w = width / 2.0
    normals = compute_normals(coords)
    
    for idx, (x_b, y_b) in enumerate(coords):
        nx, ny = normals[idx]
        cur_z = z_height[idx] if isinstance(z_height, list) else z_height
        vertices.append((x_b - half_w * nx, y_b - half_w * ny, cur_z))
        vertices.append((x_b + half_w * nx, y_b + half_w * ny, cur_z))
        
        if idx > 0:
            v_idx = idx * 2
            faces.append((v_idx - 2, v_idx - 1, v_idx + 1, v_idx))

    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj

# Find Werler Str. B63 junction X-coordinate center for dynamic 3D ramp elevation calculation
b63_x = 0.0
local_ways = [w for w in ways if w.get("highway") not in ["motorway", "motorway_link"]]
if local_ways:
    coords_x = [nodes_dict[nid]["x"] for w in local_ways for nid in w.get("nodes", []) if nid in nodes_dict]
    if coords_x:
        b63_x = sum(coords_x) / len(coords_x)

for way in ways:
    hw = way.get("highway")
    way_nodes = way.get("nodes", [])
    
    coords = []
    for nid in way_nodes:
        if nid in nodes_dict:
            n = nodes_dict[nid]
            coords.append((n["x"], n["z"]))
            all_node_x.append(n["x"])
            all_node_y.append(n["z"])
            
    if len(coords) < 2:
        continue

    # Assign 3D Layer Elevations matching authentic German Autobahn A2 interchange map
    # Autobahn A2 main corridor sits at Ground Level (z = 0.1m)
    # Werler Str. (B63) regional road sits elevated on Bridge Overpass (z = 6.0m)
    # Ramp links (motorway_link) create a vertical transition slope ramp (0.1m ground Autobahn to 6.0m bridge Werler Str)
    if hw == "motorway":
        base_z = 0.1  # Autobahn A2 Ground Level (0.1m)
        lanes = way.get("lanes", 3)
        lane_width = 3.5
        driving_width = lanes * lane_width
        shoulder_width = 2.5
        total_width = driving_width + (shoulder_width * 2)
    elif hw == "motorway_link":
        # Calculate dynamic elevation based on distance to B63 overpass (b63_x)
        # Near Werler Str B63 overpass -> 6.0m high, near Autobahn A2 -> 0.1m ground level
        base_z = []
        for x_pt, y_pt in coords:
            dist_to_b63 = abs(x_pt - b63_x)
            t = max(0.0, min(1.0, 1.0 - (dist_to_b63 / 250.0)))
            base_z.append(0.1 + (5.9 * t))
        lanes = way.get("lanes", 1)
        lane_width = 4.0
        driving_width = lanes * lane_width
        shoulder_width = 0.8
        total_width = driving_width + shoulder_width
    else:
        base_z = 6.0  # Werler Str. B63 Bridge Overpass flyover (6.0m elevated)
        lanes = way.get("lanes", 1)
        total_width = max(6.0, min(10.0, lanes * 4.0))

    road_splines.append({"coords": coords, "width": total_width, "hw": hw, "lanes": lanes})

    # 1. Flat Road Surface Ribbon
    road_mat = mat_asphalt if hw == "motorway" else (mat_ramp_asphalt if hw == "motorway_link" else mat_local_road)
    road_obj = create_flat_road_mesh(f"Road_{way['id']}", coords, total_width, z_height=base_z)
    road_obj.data.materials.append(road_mat)

    # 2. Markings & Median Barrier for Motorways
    if hw == "motorway":
        normals = compute_normals(coords)
        is_oneway = way.get("oneway", True) or way.get("tags", {}).get("oneway") == "yes"
        
        for side in [-1, 1]:
            border_offset = side * (driving_width / 2.0)
            line_coords = []
            for idx, (x_b, y_b) in enumerate(coords):
                nx, ny = normals[idx]
                line_coords.append((x_b + border_offset * nx, y_b + border_offset * ny))

            bl_obj = create_flat_road_mesh(f"BorderLine_{way['id']}_{side}", line_coords, width=0.3, z_height=base_z + 0.05)
            bl_obj.data.materials.append(mat_white_solid)

        if lanes > 1:
            for lane_idx in range(1, lanes):
                lane_offset = - (driving_width / 2.0) + (lane_idx * lane_width)
                lm_coords = []
                for idx, (x_b, y_b) in enumerate(coords):
                    nx, ny = normals[idx]
                    lm_coords.append((x_b + lane_offset * nx, y_b + lane_offset * ny))

                lm_obj = create_flat_road_mesh(f"LaneMarking_{way['id']}_{lane_idx}", lm_coords, width=0.15, z_height=base_z + 0.05)
                lm_obj.data.materials.append(mat_white_dashed)

        if is_oneway:
            median_offset = - (total_width / 2.0 + 0.6)
            med_curve = bpy.data.curves.new(name=f"Median_{way['id']}", type='CURVE')
            med_curve.dimensions = '3D'
            med_curve.fill_mode = 'FULL'
            med_curve.extrude = 0.0
            med_curve.bevel_depth = 0.25
            
            med_spline = med_curve.splines.new('POLY')
            med_spline.points.add(len(coords) - 1)
            for idx, (x_b, y_b) in enumerate(coords):
                nx, ny = normals[idx]
                mx = x_b + median_offset * nx
                my = y_b + median_offset * ny
                med_spline.points[idx].co = (mx, my, base_z + 0.8, 1)

            med_obj = bpy.data.objects.new(f"Median_{way['id']}", med_curve)
            collection.objects.link(med_obj)
            med_obj.data.materials.append(mat_median_barrier)

        guardrail_sides = [1] if is_oneway else [-1, 1]
        for side in guardrail_sides:
            gr_offset = side * (total_width / 2.0 + 0.5)
            gr_curve = bpy.data.curves.new(name=f"Guardrail_{way['id']}_{side}", type='CURVE')
            gr_curve.dimensions = '3D'
            gr_curve.fill_mode = 'FULL'
            gr_curve.extrude = 0.0
            gr_curve.bevel_depth = 0.12
            
            gr_spline = gr_curve.splines.new('POLY')
            gr_spline.points.add(len(coords) - 1)
            
            for idx, (x_b, y_b) in enumerate(coords):
                nx, ny = normals[idx]
                gx = x_b + gr_offset * nx
                gy = y_b + gr_offset * ny
                gr_spline.points[idx].co = (gx, gy, base_z + 0.65, 1)

            gr_obj = bpy.data.objects.new(f"Guardrail_{way['id']}_{side}", gr_curve)
            collection.objects.link(gr_obj)
            gr_obj.data.materials.append(mat_guardrail)

    # 3. Guardrails for Motorway Links / Ramps
    elif hw == "motorway_link":
        normals = compute_normals(coords)
        gr_offset = total_width / 2.0 + 0.4
        
        ramp_coords = coords[1:-1] if len(coords) > 3 else coords
        ramp_normals = normals[1:-1] if len(coords) > 3 else normals
        
        if len(ramp_coords) >= 2:
            gr_curve = bpy.data.curves.new(name=f"RampGuardrail_{way['id']}", type='CURVE')
            gr_curve.dimensions = '3D'
            gr_curve.fill_mode = 'FULL'
            gr_curve.bevel_depth = 0.12
            
            num_ramp = len(ramp_coords)
            gr_spline = gr_curve.splines.new('POLY')
            gr_spline.points.add(num_ramp - 1)
            for idx in range(num_ramp):
                x_b, y_b = ramp_coords[idx]
                nx, ny = ramp_normals[idx]
                ramp_z = (base_z[idx] if isinstance(base_z, list) else base_z) + 0.65
                gr_spline.points[idx].co = (x_b + gr_offset * nx, y_b + gr_offset * ny, ramp_z, 1)

            gr_obj = bpy.data.objects.new(f"RampGuardrail_{way['id']}", gr_curve)
            collection.objects.link(gr_obj)
            gr_obj.data.materials.append(mat_guardrail)

# --- Procedural Trees (Pure Data API without operator context dependencies) ---
def create_pine_tree(name, location, scale=1.0):
    trunk_mesh = bpy.data.meshes.new(f"{name}_TrunkMesh")
    r = 0.25 * scale
    h = 3.0 * scale
    verts = [(r * math.cos(i * math.pi / 4), r * math.sin(i * math.pi / 4), z) for z in [0, h] for i in range(8)]
    faces = [(i, (i+1)%8, (i+1)%8 + 8, i + 8) for i in range(8)]
    trunk_mesh.from_pydata(verts, [], faces)
    trunk_mesh.update()
    trunk = bpy.data.objects.new(f"{name}_Trunk", trunk_mesh)
    trunk.location = (location[0], location[1], location[2])
    trunk.data.materials.append(mat_trunk)
    collection.objects.link(trunk)
    
    for i in range(3):
        cone_mesh = bpy.data.meshes.new(f"{name}_ConeMesh_{i}")
        cone_r = (2.2 - i * 0.5) * scale
        cone_h = 3.2 * scale
        c_verts = [(0, 0, cone_h)] + [(cone_r * math.cos(j * math.pi / 4), cone_r * math.sin(j * math.pi / 4), 0) for j in range(8)]
        c_faces = [(0, j+1, (j+1)%8 + 1) for j in range(8)]
        cone_mesh.from_pydata(c_verts, [], c_faces)
        cone_mesh.update()
        cone = bpy.data.objects.new(f"{name}_Cone_{i}", cone_mesh)
        cone.location = (location[0], location[1], location[2] + (3.0 + i * 2.2) * scale)
        cone.data.materials.append(mat_foliage_pine)
        collection.objects.link(cone)

def create_deciduous_tree(name, location, scale=1.0):
    trunk_mesh = bpy.data.meshes.new(f"{name}_TrunkMesh")
    r = 0.3 * scale
    h = 3.5 * scale
    verts = [(r * math.cos(i * math.pi / 4), r * math.sin(i * math.pi / 4), z) for z in [0, h] for i in range(8)]
    faces = [(i, (i+1)%8, (i+1)%8 + 8, i + 8) for i in range(8)]
    trunk_mesh.from_pydata(verts, [], faces)
    trunk_mesh.update()
    trunk = bpy.data.objects.new(f"{name}_Trunk", trunk_mesh)
    trunk.location = (location[0], location[1], location[2])
    trunk.data.materials.append(mat_trunk)
    collection.objects.link(trunk)
    
    foliage_mat = mat_foliage_deciduous if random.random() > 0.4 else mat_foliage_bright
    canopy_mesh = bpy.data.meshes.new(f"{name}_CanopyMesh")
    sr = 3.0 * scale
    c_verts = [
        (0, 0, sr*1.2), (0, 0, -sr*1.2),
        (sr, 0, 0), (-sr, 0, 0), (0, sr, 0), (0, -sr, 0)
    ]
    c_faces = [(0, 2, 4), (0, 4, 3), (0, 3, 5), (0, 5, 2), (1, 4, 2), (1, 3, 4), (1, 5, 3), (1, 2, 5)]
    canopy_mesh.from_pydata(c_verts, [], c_faces)
    canopy_mesh.update()
    canopy = bpy.data.objects.new(f"{name}_Canopy", canopy_mesh)
    canopy.location = (location[0], location[1], location[2] + 5.0 * scale)
    canopy.data.materials.append(foliage_mat)
    collection.objects.link(canopy)

print("Planting German forest trees with strict 22m+ Clear Zone buffer from dense road centerlines...")
tree_count = 0

all_dense_road_pts = []
for spline_info in road_splines:
    coords = spline_info["coords"]
    for i in range(len(coords) - 1):
        p1 = coords[i]
        p2 = coords[i+1]
        dist = math.hypot(p2[0]-p1[0], p2[1]-p1[1])
        if dist == 0:
            continue
        steps = max(1, int(dist / 1.0))
        for s in range(steps + 1):
            t = s / float(steps)
            all_dense_road_pts.append((p1[0] + (p2[0]-p1[0])*t, p1[1] + (p2[0]-p1[1])*t))

for spline_info in road_splines:
    if spline_info["hw"] != "motorway":
        continue
        
    coords = spline_info["coords"]
    w = spline_info["width"]
    normals = compute_normals(coords)
    
    for i in range(0, len(coords) - 1, 6):
        x_b, y_b = coords[i]
        nx, ny = normals[i]
        
        for side in [-1, 1]:
            for row in range(2):
                dist = (w / 2.0) + 24.0 + row * 12.0
                tx = x_b + side * dist * nx + random.uniform(-2, 2)
                ty = y_b + side * dist * ny + random.uniform(-2, 2)
                
                too_close = False
                for rx, ry in all_dense_road_pts:
                    if math.hypot(tx - rx, ty - ry) < 22.0:
                        too_close = True
                        break
                if too_close:
                    continue

                scale = random.uniform(1.0, 1.8)
                tree_count += 1
                if random.random() > 0.5:
                    create_pine_tree(f"Tree_{tree_count}", (tx, ty, 0.0), scale)
                else:
                    create_deciduous_tree(f"Tree_{tree_count}", (tx, ty, 0.0), scale)

# Traffic Vehicles (Direct Mesh API)
def create_box_mesh(name, size):
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    sx, sy, sz = size[0]/2.0, size[1]/2.0, size[2]/2.0
    verts = [
        (-sx, -sy, -sz), (sx, -sy, -sz), (sx, sy, -sz), (-sx, sy, -sz),
        (-sx, -sy, sz), (sx, -sy, sz), (sx, sy, sz), (-sx, sy, sz)
    ]
    faces = [
        (0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1),
        (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)
    ]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return mesh

def add_car(name, location, rot_z, color_mat):
    mesh = create_box_mesh(name, (1.9, 4.5, 1.4))
    car = bpy.data.objects.new(name, mesh)
    car.location = location
    car.rotation_euler = (0, 0, rot_z)
    car.data.materials.append(color_mat)
    collection.objects.link(car)

def add_truck(name, location, rot_z, color_mat):
    mesh = create_box_mesh(name, (2.5, 14.0, 3.8))
    truck = bpy.data.objects.new(name, mesh)
    truck.location = location
    truck.rotation_euler = (0, 0, rot_z)
    truck.data.materials.append(color_mat)
    collection.objects.link(truck)

# BUG #5 FIX: Place vehicles dynamically along main Autobahn carriageway centerline
mw_splines = [s for s in road_splines if s["hw"] == "motorway"]
if mw_splines:
    main_coords = mw_splines[0]["coords"]
    if len(main_coords) >= 4:
        p0, p1 = main_coords[1], main_coords[2]
        rot_z = math.atan2(p1[1]-p0[1], p1[0]-p0[0]) - math.pi / 2.0
        add_car("Car_Passat", (p0[0] + 1.7, p0[1], 0.7), rot_z, mat_car_silver)
        add_car("Car_BMW", (p0[0] - 1.7, p0[1] + 20.0, 0.7), rot_z, mat_car_black)
        add_truck("Truck_MAN", (p0[0] + 1.7, p0[1] + 60.0, 1.9), rot_z, mat_truck_red)


# Sun Light (Data API)
sun_data = bpy.data.lights.new(name="SunLightData", type='SUN')
sun_data.energy = 4.0
sun = bpy.data.objects.new("SunLight", sun_data)
sun.location = (-1500, -1500, 2500)
sun.rotation_euler = (0.75, 0.25, 0.35)
collection.objects.link(sun)

# Camera (Data API with mathutils orientation)
min_x = min(all_node_x) if all_node_x else -1650.0
max_x = max(all_node_x) if all_node_x else 1650.0
min_y = min(all_node_y) if all_node_y else -1850.0
max_y = max(all_node_y) if all_node_y else 1850.0

center_x = (min_x + max_x) / 2.0
center_y = (min_y + max_y) / 2.0

cam_loc = mathutils.Vector((center_x, center_y - 2400.0, 1200.0))
target_loc = mathutils.Vector((center_x, center_y, 0.0))
dir_vec = target_loc - cam_loc
rot_quat = dir_vec.to_track_quat('-Z', 'Y')

camera_data = bpy.data.cameras.new(name="AutobahnCameraData")
camera_data.clip_end = 50000
camera = bpy.data.objects.new("AutobahnCamera", camera_data)
camera.location = cam_loc
camera.rotation_euler = rot_quat.to_euler()
collection.objects.link(camera)
scene.camera = camera

output_blend = r"autobahn_rhynern_generated.blend"
abs_blend_path = os.path.abspath(output_blend)
bpy.ops.wm.save_as_mainfile(filepath=abs_blend_path)

render_img_path = r"public/autobahn_blender_preview.png"
abs_preview_path = os.path.abspath(render_img_path)
scene.render.filepath = abs_preview_path
bpy.ops.render.render(write_still=True)

print(f"✅ Generated Clean Procedural German Autobahn Geometry: {abs_blend_path}")
print(f"✅ Rendered Preview Image: {abs_preview_path}")

