import bpy
import json
import math

json_path = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\osm_road_data.json"
blend_path = r"G:\road\new_hamm.blend"

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

node_locs = data['node_locations']
ways = data['ways']

# 1. Reset bevel depth on all 3D curves so they are thin 2D vector lines, NOT 3D pipes
for o in bpy.data.objects:
    if o.type == 'CURVE':
        o.data.bevel_depth = 0.0
        o.data.extrude = 0.0

def get_or_create_coll(c_name):
    if c_name in bpy.data.collections:
        c = bpy.data.collections[c_name]
        for o in list(c.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        return c
    c = bpy.data.collections.new(c_name)
    bpy.context.scene.collection.children.link(c)
    return c

coll_p1 = get_or_create_coll("PHASE_1_A2_Mainlines")
coll_p2 = get_or_create_coll("PHASE_2_B63_Crossroads")
coll_p3 = get_or_create_coll("PHASE_3_Rhynern_Ramps")

# Create clean Flat Asphalt Road Materials
def get_asphalt_mat(name, color_rgba):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = color_rgba
    bsdf.inputs['Roughness'].default_value = 0.6
    output = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

mat_a2 = get_asphalt_mat("Mat_Asphalt_A2", (0.15, 0.17, 0.20, 1.0))      # Dark Asphalt for A2
mat_b63 = get_asphalt_mat("Mat_Asphalt_B63", (0.35, 0.35, 0.37, 1.0))    # Lighter Asphalt for B63
mat_ramps = get_asphalt_mat("Mat_Asphalt_Ramp", (0.25, 0.27, 0.30, 1.0)) # Medium Asphalt for Ramps

# Rebuild 100% Horizontal Flat Quad Mesh Ribbons (NO pipes, NO rounded cylinders)
for w in ways:
    pts = []
    for nid in w['node_ids']:
        if str(nid) in node_locs:
            nl = node_locs[str(nid)]
            z = nl['z']
            if w['is_bridge']:
                z += 7.5
            pts.append((nl['x'], nl['y'], z))
            
    if len(pts) >= 2:
        hw = w['highway']
        lanes = w['lanes']
        
        # Bề rộng chuẩn làn đường (Autobahn 11.5m / B63 8.5m / Ramp 6.5m)
        if hw == 'motorway':
            road_w = 11.5
            target_coll = coll_p1
            target_mat = mat_a2
        elif hw in ['motorway_link', 'trunk_link', 'primary_link']:
            road_w = 6.5
            target_coll = coll_p3
            target_mat = mat_ramps
        else:
            road_w = 8.5
            target_coll = coll_p2
            target_mat = mat_b63

        half_w = road_w / 2.0
        verts = []
        faces = []
        
        # Moving average Z elevation smoothing across ribbon vertices
        n_pts = len(pts)
        smoothed_pts = []
        for i in range(n_pts):
            start_i = max(0, i - 2)
            end_i = min(n_pts, i + 3)
            avg_z = sum(pts[k][2] for k in range(start_i, end_i)) / float(end_i - start_i)
            smoothed_pts.append((pts[i][0], pts[i][1], round(avg_z, 2)))
        
        pts = smoothed_pts
        
        for i in range(len(pts)):
            x, y, z = pts[i]
            if i < len(pts) - 1:
                dx = pts[i+1][0] - x
                dy = pts[i+1][1] - y
            else:
                dx = x - pts[i-1][0]
                dy = y - pts[i-1][1]
            
            l = math.sqrt(dx*dx + dy*dy)
            if l == 0: l = 1.0
            
            # Normal vector in horizontal XY plane
            nx = -dy / l
            ny = dx / l
            
            # Create left and right horizontal boundary vertices
            verts.append((round(x + nx * half_w, 2), round(y + ny * half_w, 2), z))
            verts.append((round(x - nx * half_w, 2), round(y - ny * half_w, 2), z))
            
            if i > 0:
                v_idx = i * 2
                faces.append((v_idx - 2, v_idx - 1, v_idx + 1, v_idx))
                
        mesh = bpy.data.meshes.new(f"FlatRoadMesh_{w['id']}")
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        
        # Assign flat material
        mesh.materials.append(target_mat)
        obj = bpy.data.objects.new(f"FlatRoad_{hw}_{w['id']}", mesh)
        target_coll.objects.link(obj)

# Hide debug curves collections, keep clean flat road collections active
for c in bpy.data.collections:
    if c.name in ["PHASE_1_A2_Mainlines", "PHASE_2_B63_Crossroads", "PHASE_3_Rhynern_Ramps"]:
        c.hide_viewport = False
        c.hide_render = False
    else:
        c.hide_viewport = True
        c.hide_render = True

# Render flat road meshes
bpy.context.scene.render.engine = 'BLENDER_WORKBENCH'
bpy.context.scene.display.shading.light = 'STUDIO'
bpy.context.scene.display.shading.color_type = 'MATERIAL'
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080

# 1. TOP VIEW
cam_top = bpy.data.objects.get("CHECK_CAM_TOP")
if cam_top:
    cam_top.location = (-342.0, -176.0, 3000.0)
    cam_top.rotation_euler = (0, 0, 0)
    cam_top.data.type = 'ORTHO'
    cam_top.data.ortho_scale = 2800.0
    cam_top.data.clip_start = 0.1
    cam_top.data.clip_end = 20000.0
    bpy.context.scene.camera = cam_top

out_top = r"C:\Users\Tuan Anh\.gemini\antigravity\brain\ab6dbbd9-d36d-4f97-a7ff-09566a60cf29\flat_roads_top.png"
bpy.context.scene.render.filepath = out_top
bpy.ops.render.render(write_still=True)
print(f"Rendered Flat Roads TOP View to {out_top}")

# 2. PERSPECTIVE VIEW (Driver/Viewport view)
cam_persp = bpy.data.objects.get("CHECK_CAM_DRIVING")
if cam_persp:
    cam_persp.location = (-150.0, 21.6, 23.8)
    cam_persp.rotation_euler = (math.radians(82), 0, math.radians(-88))
    cam_persp.data.type = 'PERSP'
    cam_persp.data.lens = 35.0
    cam_persp.data.clip_start = 0.1
    cam_persp.data.clip_end = 20000.0
    bpy.context.scene.camera = cam_persp

out_persp = r"C:\Users\Tuan Anh\.gemini\antigravity\brain\ab6dbbd9-d36d-4f97-a7ff-09566a60cf29\flat_roads_perspective.png"
bpy.context.scene.render.filepath = out_persp
bpy.ops.render.render(write_still=True)
print(f"Rendered Flat Roads Perspective View to {out_persp}")

bpy.ops.wm.save_mainfile()
print("Saved fixed flat road meshes to G:\\road\\new_hamm.blend!")
