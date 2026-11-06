import osmium
import math
import numpy as np
from PIL import Image

nrw_pbf = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\nordrhein-westfalen-261002.osm.pbf"
tif_path = r"G:\road\dem_data\output_hh.tif"
out_script = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\build_a2_rhynern_pipeline.py"

# Bounding box around A2 Autobahn Hamm - Rhynern section (approx 15km stretch)
MIN_LAT, MAX_LAT = 51.580, 51.670
MIN_LON, MAX_LON = 7.720, 7.900

# Load Copernicus DEM 3D Elevation Raster
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
BASE_ELEV = get_elevation(REF_LAT, REF_LON)

class A2HighwayCropHandler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.highways = []

    def way(self, w):
        if 'highway' in w.tags:
            hw = w.tags['highway']
            if hw in ['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link']:
                coords = []
                in_bbox = False
                is_bridge = w.tags.get('bridge', 'no') != 'no' or w.tags.get('layer', '0') != '0'
                lanes = int(w.tags.get('lanes', '2') if w.tags.get('lanes', '2').isdigit() else '2')
                ref = w.tags.get('ref', '')
                name = w.tags.get('name', '')
                
                for n in w.nodes:
                    if n.location.valid():
                        lat, lon = n.location.lat, n.location.lon
                        if MIN_LAT <= lat <= MAX_LAT and MIN_LON <= lon <= MAX_LON:
                            in_bbox = True
                        elev = get_elevation(lat, lon)
                        coords.append((lat, lon, elev))
                        
                if in_bbox and len(coords) >= 2:
                    self.highways.append({
                        'id': w.id,
                        'type': hw,
                        'ref': ref,
                        'name': name,
                        'lanes': lanes,
                        'is_bridge': is_bridge,
                        'coords': coords
                    })

print(f"Parsing and cropping A2 Hamm-Rhynern Autobahn section from Geofabrik NRW PBF (893 MB)...")
handler = A2HighwayCropHandler()
handler.apply_file(nrw_pbf, locations=True)
print(f"Extracted {len(handler.highways)} cropped Autobahn & ramp segments!")

def latlon_to_xy(lat, lon):
    x = (lon - REF_LON) * LON_TO_M + 2622.0
    y = (lat - REF_LAT) * LAT_TO_M + 822.0
    return round(x, 2), round(y, 2)

blender_code = """import bpy
import mathutils

coll_name = "A2_Autobahn_Rhynern_Geofabrik_3D"
if coll_name in bpy.data.collections:
    coll = bpy.data.collections[coll_name]
    for obj in list(coll.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
else:
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)

mat_road = bpy.data.materials.get("Road") or bpy.data.materials.get("OSM Road")
mat_concrete = bpy.data.materials.get("Support Side Bridge") or bpy.data.materials.get("Support Spring")
mat_grass = bpy.data.materials.get("Autobahn_Grass_Mat") or bpy.data.materials.get("Terrain Spring")
"""

for h in handler.highways:
    hw_type = h['type']
    is_bridge = h['is_bridge']
    lanes = h['lanes']
    
    # Calculate road width based on OSM lanes tag
    road_width = 12.0 if lanes >= 3 else (8.5 if hw_type == 'motorway' else 5.5)
    
    pts_xyz = []
    for lat, lon, elev in h['coords']:
        x, y = latlon_to_xy(lat, lon)
        z_rel = elev - BASE_ELEV
        if is_bridge:
            z_rel += 7.5
        elif hw_type == 'motorway_link':
            z_rel += 3.5
        pts_xyz.append((x, y, round(z_rel, 2)))
        
    blender_code += f"""
# A2 Segment {h['id']} (Type: {hw_type}, Lanes: {lanes}, Width: {road_width}m, Bridge: {is_bridge})
c_name = "A2_{hw_type}_{h['id']}"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = 0.0          # Flat asphalt ribbon
cd.extrude = {road_width / 2.0} # Exact 3D road width in meters!
cd.fill_mode = 'FULL'

sp = cd.splines.new('POLY')
pts = {pts_xyz}
sp.points.add(len(pts) - 1)
for i, (x, y, z) in enumerate(pts):
    sp.points[i].co = (x, y, z, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)
"""

with open(out_script, "w", encoding="utf-8") as f:
    f.write(blender_code)

print(f"Generated A2 Rhynern pipeline script at {out_script}!")
