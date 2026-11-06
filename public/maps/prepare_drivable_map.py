import numpy as np
import math
import random
from PIL import Image

tif_path = r"G:\road\dem_data\output_hh.tif"
im = Image.open(tif_path)
dem_arr = np.array(im)

min_lon_dem = im.tag_v2[33922][3]
max_lat_dem = im.tag_v2[33922][4]
dx_dem = im.tag_v2[33550][0]
dy_dem = im.tag_v2[33550][1]
height_rows, width_cols = dem_arr.shape

def get_elevation(lat, lon):
    px = int((lon - min_lon_dem) / dx_dem)
    py = int((max_lat_dem - lat) / dy_dem)
    px = max(0, min(width_cols - 1, px))
    py = max(0, min(height_rows - 1, py))
    val = float(dem_arr[py, px])
    if val < -100 or val > 9000:
        return 72.54
    return val

REF_LAT = 51.6180
REF_LON = 7.8220
LAT_TO_M = 111139.0
LON_TO_M = 111139.0 * np.cos(np.radians(REF_LAT))
BASE_ELEV = 72.54

nx, ny = 120, 90
xs = np.linspace(-6000, 5000, nx)
ys = np.linspace(-3500, 4500, ny)

verts = []
for y in ys:
    lat = REF_LAT + (y / LAT_TO_M)
    for x in xs:
        lon = REF_LON + (x / LON_TO_M)
        z_elev = round(get_elevation(lat, lon) - BASE_ELEV, 2)
        verts.append((round(x, 1), round(y, 1), z_elev))

faces = []
for j in range(ny - 1):
    for i in range(nx - 1):
        v1 = j * nx + i
        v2 = j * nx + (i + 1)
        v3 = (j + 1) * nx + (i + 1)
        v4 = (j + 1) * nx + i
        faces.append((v1, v2, v3, v4))

# Forest tree positions (170 trees)
random.seed(2026)
tree_positions = []
# 120 trees along A2
for i in range(120):
    x = round(random.uniform(-5500.0, 4200.0), 1)
    side = 1 if i % 2 == 0 else -1
    y = round(random.uniform(200.0, 1500.0) + (side * random.uniform(18.0, 65.0)), 1)
    z = round(random.uniform(0.5, 4.0), 1)
    scale = round(random.uniform(0.8, 1.6), 2)
    rot = round(random.uniform(0, 6.28), 2)
    tree_positions.append((x, y, z, scale, rot))

# 50 trees around Raststätte Rhynern & Osterbönen
for i in range(50):
    x = round(random.uniform(1000.0, 2500.0), 1)
    y = round(random.uniform(-800.0, 400.0), 1)
    z = round(random.uniform(0.5, 3.5), 1)
    scale = round(random.uniform(1.0, 1.7), 2)
    rot = round(random.uniform(0, 6.28), 2)
    tree_positions.append((x, y, z, scale, rot))

blender_code = f"""import bpy
import mathutils

# 1. Build 3D Terrain Mesh for Nordbögge -> Rhynern (11km x 8km)
ground_name = "Autobahn_Terrain_Ground"
if ground_name in bpy.data.objects:
    ground_obj = bpy.data.objects[ground_name]
else:
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0))
    ground_obj = bpy.context.active_object
    ground_obj.name = ground_name

ground_obj.hide_viewport = False
ground_obj.display_type = 'TEXTURED'

mesh = bpy.data.meshes.new("Nordboegge_Rhynern_3D_Terrain")
verts = {verts}
faces = {faces}

mesh.from_pydata(verts, [], faces)
mesh.update()
ground_obj.data = mesh

mat_grass = bpy.data.materials.get("Autobahn_Grass_Mat") or bpy.data.materials.get("Terrain Spring")
if mat_grass:
    if not ground_obj.data.materials:
        ground_obj.data.materials.append(mat_grass)
    else:
        ground_obj.data.materials[0] = mat_grass

for poly in ground_obj.data.polygons:
    poly.use_smooth = True

# 2. Build Bridge Abutments & Concrete Support Pillars
mat_concrete = bpy.data.materials.get("Support Side Bridge") or bpy.data.materials.get("Support Spring")

def create_bridge_structure(name, loc, scale):
    if name in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = mathutils.Vector(scale)
    if mat_concrete:
        obj.data.materials.append(mat_concrete)
    return obj

# AS 18 Rhynern & B63 Bridges
create_bridge_structure("Rhynern_AS18_Abutment_West", (2608.0, 815.0, 3.75), (3.0, 45.0, 7.5))
create_bridge_structure("Rhynern_AS18_Abutment_East", (2636.0, 815.0, 3.75), (3.0, 45.0, 7.5))
create_bridge_structure("Rhynern_AS18_Pillar_1", (2622.0, 800.0, 3.0), (1.8, 1.8, 6.0))
create_bridge_structure("Rhynern_AS18_Pillar_2", (2622.0, 830.0, 3.0), (1.8, 1.8, 6.0))
create_bridge_structure("B63_Overpass_Pillar_1", (2180.0, 990.0, 3.0), (2.0, 2.0, 6.0))
create_bridge_structure("B63_Overpass_Pillar_2", (2195.0, 990.0, 3.0), (2.0, 2.0, 6.0))

# 3. Dense Forest Tree Placement along A2 Embankments & Raststätte Rhynern
tree_pine = bpy.data.objects.get("RSEA Tree Pine")
tree_small = bpy.data.objects.get("RSEA Tree Small")
tree_template = tree_pine or tree_small

if tree_template:
    tree_coll_name = "Nordboegge_Rhynern_Forests_3D"
    if tree_coll_name in bpy.data.collections:
        tree_coll = bpy.data.collections[tree_coll_name]
        for o in list(tree_coll.objects):
            bpy.data.objects.remove(o, do_unlink=True)
    else:
        tree_coll = bpy.data.collections.new(tree_coll_name)
        bpy.context.scene.collection.children.link(tree_coll)

    tree_pts = {tree_positions}
    for idx, (x, y, z, s, rot) in enumerate(tree_pts):
        t_obj = tree_template.copy()
        t_obj.name = "Forest_Tree_" + str(idx)
        t_obj.location = (x, y, z)
        t_obj.scale = (s, s, s)
        t_obj.rotation_euler[2] = rot
        t_obj.hide_viewport = False
        tree_coll.objects.link(t_obj)

# 4. Position Viewport
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.clip_start = 1.0
                space.clip_end = 200000.0
                space.shading.type = 'SOLID'
                space.shading.color_type = 'MATERIAL'
                space.shading.show_cavity = True
                rv3d = space.region_3d
                rv3d.view_location = (2622.0, 822.0, 20.0)
                rv3d.view_distance = 1500.0
                rv3d.view_rotation = (0.5, 0.2, 0.2, 0.8)

print("Generated full drivable 3D map script successfully!")
"""

out_script = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\apply_drivable_map.py"
with open(out_script, "w", encoding="utf-8") as f:
    f.write(blender_code)

print("Pre-calculated 3D terrain grid & 170 tree positions successfully!")
