import numpy as np
from PIL import Image

tif_path = r"G:\road\dem_data\output_hh.tif"
im = Image.open(tif_path)
dem_arr = np.array(im)

min_lon = im.tag_v2[33922][3]
max_lat = im.tag_v2[33922][4]
dx = im.tag_v2[33550][0]
dy = im.tag_v2[33550][1]

height_rows, width_cols = dem_arr.shape

def get_elevation(lat, lon):
    px = int((lon - min_lon) / dx)
    py = int((max_lat - lat) / dy)
    px = max(0, min(width_cols - 1, px))
    py = max(0, min(height_rows - 1, py))
    val = float(dem_arr[py, px])
    if val < -100 or val > 9000:
        return 72.54
    return val

REF_LAT = 51.6250
REF_LON = 7.7850
LAT_TO_M = 111139.0
LON_TO_M = 111139.0 * np.cos(np.radians(REF_LAT))
BASE_ELEV = 72.54

nx, ny = 100, 80
xs = np.linspace(-4000, 4000, nx)
ys = np.linspace(-3000, 3000, ny)

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

blender_code = f"""import bpy

ground_name = "Autobahn_Terrain_Ground"
if ground_name in bpy.data.objects:
    ground_obj = bpy.data.objects[ground_name]
else:
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, 0, 0))
    ground_obj = bpy.context.active_object
    ground_obj.name = ground_name

mesh = bpy.data.meshes.new("Hamm_3D_Terrain_Mesh")
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

print("Applied 3D Copernicus DEM elevation mesh to Autobahn_Terrain_Ground!")
"""

out_file = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\apply_terrain_mesh.py"
with open(out_file, "w", encoding="utf-8") as f:
    f.write(blender_code)

print("Generated terrain mesh script successfully!")
