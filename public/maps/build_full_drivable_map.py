import bpy
import mathutils
import math
import random
import numpy as np
from PIL import Image

# 1. Load Copernicus DEM Satellite Heightmap
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
LON_TO_M = 111139.0 * math.cos(math.radians(REF_LAT))
BASE_ELEV = 72.54

# 2. Build 3D Terrain Ground for Nordbögge -> Rhynern (12km x 8km)
ground_name = "Autobahn_Terrain_Ground"
if ground_name in bpy.data.objects:
    ground_obj = bpy.data.objects[ground_name]
else:
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0))
    ground_obj = bpy.context.active_object
    ground_obj.name = ground_name

ground_obj.hide_viewport = False
ground_obj.display_type = 'TEXTURED'

# Rebuild high-detail 3D terrain grid matching full corridor
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

mesh = bpy.data.meshes.new("Nordboegge_Rhynern_3D_Terrain")
mesh.from_pydata(verts, [], faces)
mesh.update()

ground_obj.data = mesh

mat_grass = bpy.data.materials.get("Autobahn_Grass_Mat") or bpy.data.materials.get("Terrain Spring")
if mat_grass:
    if not ground_obj.data.materials:
        ground_obj.data.materials.append(mat_grass)
    else:
        ground_obj.data.materials[0] = mat_grass

# Smooth terrain faces
for poly in ground_obj.data.polygons:
    poly.use_smooth = True

# 3. Create Concrete Bridge Abutments & Support Pillars at AS 18 Rhynern & Overpasses
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

# AS 18 Rhynern Bridge Abutments & Pillars
create_bridge_structure("Rhynern_AS18_Abutment_West", (2608.0, 815.0, 3.75), (3.0, 45.0, 7.5))
create_bridge_structure("Rhynern_AS18_Abutment_East", (2636.0, 815.0, 3.75), (3.0, 45.0, 7.5))
create_bridge_structure("Rhynern_AS18_Pillar_1", (2622.0, 800.0, 3.0), (1.8, 1.8, 6.0))
create_bridge_structure("Rhynern_AS18_Pillar_2", (2622.0, 830.0, 3.0), (1.8, 1.8, 6.0))

# B63 Overpass Bridge Pillars
create_bridge_structure("B63_Overpass_Pillar_1", (2180.0, 990.0, 3.0), (2.0, 2.0, 6.0))
create_bridge_structure("B63_Overpass_Pillar_2", (2195.0, 990.0, 3.0), (2.0, 2.0, 6.0))

# 4. Dense Tree & Forest Placement along A2 Embankments, AS 18, Raststätte Rhynern & Osterbönen
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

    random.seed(2026)
    
    # 4a. Scatter 120 trees along A2 motorway embankments & median strip
    for i in range(120):
        t_obj = tree_template.copy()
        t_obj.name = f"A2_Forest_Tree_{i}"
        
        # Along A2 corridor (-5500 to 4200)
        x = random.uniform(-5500.0, 4200.0)
        # Offset 15m to 40m away from Autobahn center line
        side = 1 if i % 2 == 0 else -1
        y = random.uniform(200.0, 1500.0) + (side * random.uniform(18.0, 65.0))
        z = random.uniform(0.5, 4.0)
        
        t_obj.location = (x, y, z)
        s = random.uniform(0.8, 1.6)
        t_obj.scale = (s, s, s)
        t_obj.rotation_euler[2] = random.uniform(0, 6.28)
        t_obj.hide_viewport = False
        tree_coll.objects.link(t_obj)

    # 4b. Scatter 50 trees at Raststätte Rhynern rest area & Osterbönen forest patch
    for i in range(50):
        t_obj = tree_template.copy()
        t_obj.name = f"Raststaette_Tree_{i}"
        x = random.uniform(1000.0, 2500.0)
        y = random.uniform(-800.0, 400.0)
        z = random.uniform(0.5, 3.5)
        
        t_obj.location = (x, y, z)
        s = random.uniform(1.0, 1.7)
        t_obj.scale = (s, s, s)
        t_obj.rotation_euler[2] = random.uniform(0, 6.28)
        t_obj.hide_viewport = False
        tree_coll.objects.link(t_obj)

# 5. Position Perspective Viewport Camera
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
                rv3d.view_location = (2622.0, 822.0, 15.0)
                rv3d.view_distance = 1200.0
                rv3d.view_rotation = (0.5, 0.2, 0.2, 0.8)

print("Built full drivable 3D map: 3D DEM terrain, bridge abutments, pillars & 170 scattered forest trees!")
