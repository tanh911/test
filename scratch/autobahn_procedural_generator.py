import bpy
import bmesh
import math
from mathutils import Vector, Matrix

print("--- STARTING PROCEDURAL GERMAN AUTOBAHN GENERATOR ---")

# 1. Reset Scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# 2. Materials Setup
def create_materials():
    # Asphalt
    mat_asphalt = bpy.data.materials.new("Autobahn_Asphalt")
    mat_asphalt.use_nodes = True
    bsdf = mat_asphalt.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.05, 0.05, 0.06, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.9

    # Standstreifen / Shoulder Asphalt (Slightly lighter/textured)
    mat_shoulder = bpy.data.materials.new("Autobahn_Shoulder")
    mat_shoulder.use_nodes = True
    bsdf = mat_shoulder.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.07, 0.07, 0.08, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.95

    # German Lane Markings (Bright White)
    mat_marking = bpy.data.materials.new("Autobahn_Marking_White")
    mat_marking.use_nodes = True
    bsdf = mat_marking.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.95, 0.95, 0.95, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.3

    # Guardrail Steel (Schutzplanke Metallic)
    mat_steel = bpy.data.materials.new("Schutzplanke_Steel")
    mat_steel.use_nodes = True
    bsdf = mat_steel.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.7, 0.72, 0.75, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.9
    bsdf.inputs["Roughness"].default_value = 0.25

    # Autobahn Blue Sign (DIN 1451 German Highway Blue)
    mat_blue_sign = bpy.data.materials.new("Autobahn_Sign_Blue")
    mat_blue_sign.use_nodes = True
    bsdf = mat_blue_sign.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.0, 0.22, 0.55, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.4

    # Grass Median
    mat_grass = bpy.data.materials.new("Autobahn_Grass")
    mat_grass.use_nodes = True
    bsdf = mat_grass.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.12, 0.45, 0.15, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.85

    return {
        "asphalt": mat_asphalt,
        "shoulder": mat_shoulder,
        "marking": mat_marking,
        "steel": mat_steel,
        "blue_sign": mat_blue_sign,
        "grass": mat_grass
    }

mats = create_materials()

# 3. Define German 3-Lane Autobahn Parameters
LANE_WIDTH = 3.75          # 3.75m per lane (German Standard RAL-Q)
NUM_LANES = 3              # 3 Lanes
SHOULDER_WIDTH = 2.75      # Standstreifen (Hard Shoulder) 2.75m
MEDIAN_WIDTH = 2.00        # Central reserve median 2.0m
TOTAL_ROAD_WIDTH = (NUM_LANES * LANE_WIDTH) + SHOULDER_WIDTH # 14.0m

# 4. Generate Main Highway Mesh along a Curve Path (500m length with gentle curve)
def generate_autobahn_mesh():
    bm = bmesh.new()

    # Generate path points (S-curve over 400m)
    num_segments = 200
    length = 400.0

    path_points = []
    for i in range(num_segments + 1):
        t = i / num_segments
        y = t * length
        # Gentle curve equation: X offset
        x = math.sin(t * math.pi * 1.5) * 25.0
        z = math.sin(t * math.pi * 0.8) * 4.0 # Gentle slope elevation
        path_points.append(Vector((x, y, z)))

    # Compute tangents and normals along path
    verts_left = []
    verts_right = []
    tangents = []
    normals = []

    for i in range(len(path_points)):
        p = path_points[i]
        if i == 0:
            tangent = (path_points[1] - path_points[0]).normalized()
        elif i == len(path_points) - 1:
            tangent = (path_points[-1] - path_points[-2]).normalized()
        else:
            tangent = (path_points[i+1] - path_points[i-1]).normalized()

        tangents.append(tangent)
        # Normal perpendicular to tangent on XY plane
        normal = Vector((-tangent.y, tangent.x, 0.0)).normalized()
        normals.append(normal)

    # Build Road Surface Mesh & Sub-lanes
    # We create cross sections:
    # Offset -1.0: Median Grass edge
    # Offset  0.0: Inner Edge (Fast Lane 3 left)
    # Offset 3.75: Lane 3 / Lane 2 boundary
    # Offset 7.50: Lane 2 / Lane 1 boundary
    # Offset 11.25: Lane 1 / Standstreifen boundary
    # Offset 14.00: Standstreifen outer edge
    # Offset 14.50: Outer Shoulder embankment

    offsets = [
        -MEDIAN_WIDTH*0.5, # -1.0m (Median)
        0.0,               # 0.0m (Inner edge)
        LANE_WIDTH,        # 3.75m
        LANE_WIDTH * 2,    # 7.50m
        LANE_WIDTH * 3,    # 11.25m
        TOTAL_ROAD_WIDTH,  # 14.00m
        TOTAL_ROAD_WIDTH + 0.75 # 14.75m (Outer embankment)
    ]

    section_verts = [] # Grid of verts: [segment_idx][offset_idx]

    for i in range(len(path_points)):
        p = path_points[i]
        n = normals[i]
        row = []
        for off in offsets:
            v_pos = p + n * off
            v = bm.verts.new(v_pos)
            row.append(v)
        section_verts.append(row)

    bm.verts.ensure_lookup_table()

    # Create Faces for each strip along the road
    for i in range(len(path_points) - 1):
        r1 = section_verts[i]
        r2 = section_verts[i+1]
        for j in range(len(offsets) - 1):
            face = bm.faces.new((r1[j], r2[j], r2[j+1], r1[j+1]))
            # Assign material slots
            if j == 0:
                face.material_index = 5 # Grass median
            elif j in (1, 2, 3):
                face.material_index = 0 # Asphalt main lanes
            elif j == 4:
                face.material_index = 1 # Standstreifen shoulder
            else:
                face.material_index = 5 # Grass embankment

    mesh_road = bpy.data.meshes.new("Autobahn_Road_Mesh")
    bm.to_mesh(mesh_road)
    bm.free()

    obj_road = bpy.data.objects.new("Autobahn_3Lanes_Main", mesh_road)
    for m in [mats["asphalt"], mats["shoulder"], mats["marking"], mats["steel"], mats["blue_sign"], mats["grass"]]:
        obj_road.data.materials.append(m)

    scene.collection.objects.link(obj_road)
    return obj_road, path_points, normals, tangents

obj_road, path_points, normals, tangents = generate_autobahn_mesh()

# 5. Generate German Dashed & Solid Lane Markings (White 3D Strips)
def generate_lane_markings():
    bm = bmesh.new()

    # German Autobahn Lane Markings rules:
    # - Lane dividers: 6m dash, 12m gap (Dashed line, width 15cm)
    # - Standstreifen boundary line: Solid line, width 30cm
    # - Inner edge line: Solid line, width 30cm

    length_so_far = 0.0
    marking_offsets = [
        (0.0, 0.30, True),             # Inner edge solid line (30cm)
        (LANE_WIDTH, 0.15, False),     # Lane 3/2 divider (15cm dashed)
        (LANE_WIDTH * 2, 0.15, False), # Lane 2/1 divider (15cm dashed)
        (LANE_WIDTH * 3, 0.30, True)   # Standstreifen solid line (30cm)
    ]

    for off, width, is_solid in marking_offsets:
        half_w = width * 0.5
        dash_on = True

        accum_dist = 0.0
        for i in range(len(path_points) - 1):
            p1 = path_points[i]
            p2 = path_points[i+1]
            seg_len = (p2 - p1).length
            n1 = normals[i]
            n2 = normals[i+1]

            # Check dashed pattern: 6m dash / 12m gap (total period 18m)
            if not is_solid:
                cycle_pos = accum_dist % 18.0
                dash_on = cycle_pos < 6.0

            if is_solid or dash_on:
                c1 = p1 + n1 * off
                c2 = p2 + n2 * off

                v1 = bm.verts.new(c1 + n1 * half_w + Vector((0,0, 0.025)))
                v2 = bm.verts.new(c1 - n1 * half_w + Vector((0,0, 0.025)))
                v3 = bm.verts.new(c2 - n2 * half_w + Vector((0,0, 0.025)))
                v4 = bm.verts.new(c2 + n2 * half_w + Vector((0,0, 0.025)))

                f = bm.faces.new((v1, v2, v3, v4))
                f.material_index = 0

            accum_dist += seg_len

    mesh_markings = bpy.data.meshes.new("Autobahn_Markings_Mesh")
    bm.to_mesh(mesh_markings)
    bm.free()

    obj_markings = bpy.data.objects.new("Autobahn_Lane_Markings", mesh_markings)
    obj_markings.data.materials.append(mats["marking"])
    scene.collection.objects.link(obj_markings)

generate_lane_markings()

# 6. Generate Schutzplanke (Guardrail W-Beam & Posts)
def generate_guardrails():
    # We place guardrails at Inner Median (-0.5m) and Outer Edge (14.25m)
    guardrail_offsets = [-0.5, TOTAL_ROAD_WIDTH + 0.35]

    bm_rails = bmesh.new()
    bm_posts = bmesh.new()

    for off in guardrail_offsets:
        # Extrude W-Beam profile along path
        for i in range(len(path_points) - 1):
            p1 = path_points[i]
            p2 = path_points[i+1]
            n1 = normals[i]
            n2 = normals[i+1]

            pos1 = p1 + n1 * off
            pos2 = p2 + n2 * off

            # Rail height Z = 0.75m
            # W-Beam profile: top edge, middle crease, bottom edge
            z_base = 0.55
            z_mid = 0.68
            z_top = 0.80

            r1_top = pos1 + Vector((0,0, z_top))
            r1_mid = pos1 + n1 * 0.08 + Vector((0,0, z_mid))
            r1_bot = pos1 + Vector((0,0, z_base))

            r2_top = pos2 + Vector((0,0, z_top))
            r2_mid = pos2 + n2 * 0.08 + Vector((0,0, z_mid))
            r2_bot = pos2 + Vector((0,0, z_base))

            v1_t = bm_rails.verts.new(r1_top); v1_m = bm_rails.verts.new(r1_mid); v1_b = bm_rails.verts.new(r1_bot)
            v2_t = bm_rails.verts.new(r2_top); v2_m = bm_rails.verts.new(r2_mid); v2_b = bm_rails.verts.new(r2_bot)

            bm_rails.faces.new((v1_t, v1_m, v2_m, v2_t))
            bm_rails.faces.new((v1_m, v1_b, v2_b, v2_m))

        # Place Posts every 4.0 meters
        accum_dist = 0.0
        for i in range(len(path_points) - 1):
            p1 = path_points[i]
            p2 = path_points[i+1]
            seg_len = (p2 - p1).length

            if accum_dist == 0 or accum_dist >= 4.0:
                pos = p1 + normals[i] * off
                # Create Sigma Post (I-beam box)
                post_bottom = pos
                post_top = pos + Vector((0, 0, 0.75))

                # Post vertices
                v_p1 = bm_posts.verts.new(pos + Vector((-0.04, -0.06, 0)))
                v_p2 = bm_posts.verts.new(pos + Vector(( 0.04, -0.06, 0)))
                v_p3 = bm_posts.verts.new(pos + Vector(( 0.04,  0.06, 0)))
                v_p4 = bm_posts.verts.new(pos + Vector((-0.04,  0.06, 0)))

                v_t1 = bm_posts.verts.new(pos + Vector((-0.04, -0.06, 0.75)))
                v_t2 = bm_posts.verts.new(pos + Vector(( 0.04, -0.06, 0.75)))
                v_t3 = bm_posts.verts.new(pos + Vector(( 0.04,  0.06, 0.75)))
                v_t4 = bm_posts.verts.new(pos + Vector((-0.04,  0.06, 0.75)))

                bm_posts.faces.new((v_p1, v_p2, v_t2, v_t1))
                bm_posts.faces.new((v_p2, v_p3, v_t3, v_t2))
                bm_posts.faces.new((v_p3, v_p4, v_t4, v_t3))
                bm_posts.faces.new((v_p4, v_p1, v_t1, v_t4))

                accum_dist = 0.0
            accum_dist += seg_len

    mesh_rails = bpy.data.meshes.new("Schutzplanke_Rails_Mesh")
    bm_rails.to_mesh(mesh_rails)
    bm_rails.free()

    obj_rails = bpy.data.objects.new("Schutzplanke_Rails", mesh_rails)
    obj_rails.data.materials.append(mats["steel"])
    scene.collection.objects.link(obj_rails)

    mesh_posts = bpy.data.meshes.new("Schutzplanke_Posts_Mesh")
    bm_posts.to_mesh(mesh_posts)
    bm_posts.free()

    obj_posts = bpy.data.objects.new("Schutzplanke_Posts", mesh_posts)
    obj_posts.data.materials.append(mats["steel"])
    scene.collection.objects.link(obj_posts)

generate_guardrails()

# 7. Generate Ausfahrt Exit Ramp & Overhead German Traffic Signs
def generate_exit_ramp_and_signs():
    # Branching Exit Ramp at segment 120 (around Y=240m)
    branch_idx = 120
    ramp_length = 80.0

    p_branch = path_points[branch_idx]
    n_branch = normals[branch_idx]
    t_branch = tangents[branch_idx]

    bm_ramp = bmesh.new()

    # Ramp curves outwards to the right
    ramp_num_segs = 40
    ramp_verts_left = []
    ramp_verts_right = []

    for i in range(ramp_num_segs + 1):
        t = i / ramp_num_segs
        dist = t * ramp_length
        # Curve equation: outward angle shift
        angle = t * math.radians(25.0)
        direction = Vector((
            t_branch.x * math.cos(angle) - t_branch.y * math.sin(angle),
            t_branch.x * math.sin(angle) + t_branch.y * math.cos(angle),
            t_branch.z
        )).normalized()

        normal_r = Vector((-direction.y, direction.x, 0)).normalized()

        center = p_branch + n_branch * TOTAL_ROAD_WIDTH + direction * dist

        v_l = bm_ramp.verts.new(center)
        v_r = bm_ramp.verts.new(center + normal_r * 4.5) # 4.5m Ramp width

        ramp_verts_left.append(v_l)
        ramp_verts_right.append(v_r)

    bm_ramp.verts.ensure_lookup_table()

    for i in range(ramp_num_segs):
        l1, r1 = ramp_verts_left[i], ramp_verts_right[i]
        l2, r2 = ramp_verts_left[i+1], ramp_verts_right[i+1]
        f = bm_ramp.faces.new((l1, l2, r2, r1))
        f.material_index = 0

    mesh_ramp = bpy.data.meshes.new("Ausfahrt_Ramp_Mesh")
    bm_ramp.to_mesh(mesh_ramp)
    bm_ramp.free()

    obj_ramp = bpy.data.objects.new("Ausfahrt_Exit_Ramp", mesh_ramp)
    obj_ramp.data.materials.append(mats["asphalt"])
    scene.collection.objects.link(obj_ramp)

    # Create German Ausfahrt 300m / 200m / 100m Banners & Main Sign
    sign_distances = [
        (branch_idx - 60, "Ausfahrt_300m", 300),
        (branch_idx - 40, "Ausfahrt_200m", 200),
        (branch_idx - 20, "Ausfahrt_100m", 100),
        (branch_idx,      "Ausfahrt_Exit_Main", 0)
    ]

    for idx, name, dist in sign_distances:
        if idx >= len(path_points):
            continue
        p = path_points[idx]
        n = normals[idx]
        t_vec = tangents[idx]

        sign_pos = p + n * (TOTAL_ROAD_WIDTH + 2.5)

        # Create Sign Board
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=sign_pos + Vector((0,0, 2.5)))
        sign_obj = bpy.context.active_object
        sign_obj.name = name
        sign_obj.scale = (2.2, 0.1, 1.4)
        sign_obj.rotation_euler = (0, 0, math.atan2(t_vec.y, t_vec.x) + math.pi/2)
        sign_obj.data.materials.append(mats["blue_sign"])

        # Create Pole
        bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=3.5, location=sign_pos + Vector((0,0, 1.75)))
        pole_obj = bpy.context.active_object
        pole_obj.name = f"{name}_Pole"
        pole_obj.data.materials.append(mats["steel"])

generate_exit_ramp_and_signs()

# 8. Setup Lighting, Camera & World Environment
if "Sun" not in scene.objects:
    bpy.ops.object.light_add(type='SUN', location=(100, 100, 200))
    sun = scene.objects["Sun"]
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(50), math.radians(20), math.radians(40))

# Setup Camera for Dramatic View of 3-Lane Autobahn & Exit Ramp
if "Camera" not in scene.objects:
    bpy.ops.object.camera_add(location=(-25, 180, 25), rotation=(math.radians(72), 0, math.radians(-115)))
    cam = scene.objects["Camera"]
    scene.camera = cam

# 9. Save .blend & Export .glb
out_blend = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\autobahn_3lanes_procedural.blend"
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print(f"Saved Procedural Autobahn Blend: {out_blend}")

out_glb = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\autobahn_3lanes_procedural.glb"
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB')
print(f"Exported Procedural Autobahn GLB: {out_glb}")

# 10. Render High Resolution Preview PNG
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = 'PNG'
preview_png = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\autobahn_3lanes_preview.png"
scene.render.filepath = preview_png
bpy.ops.render.render(write_still=True)
print(f"Rendered Preview PNG: {preview_png}")

print("--- PROCEDURAL GERMAN AUTOBAHN GENERATED SUCCESSFULLY ---")
