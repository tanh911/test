import osmium
import math
import numpy as np
from PIL import Image

pbf_path = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\hamm.osm.pbf"
tif_path = r"G:\road\dem_data\output_hh.tif"
out_script = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\reimport_clean_autobahn.py"

# Load DEM TIF Elevation Raster
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

# Reference center lat/lon matching Rhynern Hamm (2622, 822)
REF_LAT = 51.6180
REF_LON = 7.8220
LAT_TO_M = 111139.0
LON_TO_M = 111139.0 * math.cos(math.radians(REF_LAT))
BASE_ELEV = get_elevation(REF_LAT, REF_LON)

class OSMHighwayExtractor(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.highways = []

    def way(self, w):
        if 'highway' in w.tags:
            hw = w.tags['highway']
            if hw in ['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link']:
                coords = []
                is_bridge = w.tags.get('bridge', 'no') != 'no' or w.tags.get('layer', '0') != '0'
                for n in w.nodes:
                    if n.location.valid():
                        lat, lon = n.location.lat, n.location.lon
                        elev = get_elevation(lat, lon)
                        coords.append((lat, lon, elev))
                if len(coords) >= 2:
                    self.highways.append({
                        'id': w.id,
                        'type': hw,
                        'name': w.tags.get('name', ''),
                        'ref': w.tags.get('ref', ''),
                        'is_bridge': is_bridge,
                        'coords': coords
                    })

handler = OSMHighwayExtractor()
handler.apply_file(pbf_path, locations=True)
print(f"Extracted {len(handler.highways)} highway segments from Hamm PBF!")

def latlon_to_xy(lat, lon):
    x = (lon - REF_LON) * LON_TO_M + 2622.0
    y = (lat - REF_LAT) * LAT_TO_M + 822.0
    return round(x, 2), round(y, 2)

blender_code = """import bpy

coll_name = "OSM_Autobahn_Hamm_3D"
if coll_name in bpy.data.collections:
    coll = bpy.data.collections[coll_name]
    for obj in list(coll.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
else:
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)

mat_road = bpy.data.materials.get("Road") or bpy.data.materials.get("OSM Road")
"""

for h in handler.highways:
    hw_type = h['type']
    is_bridge = h['is_bridge']
    
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
# Highway {h['id']} ({hw_type})
c_name = "Autobahn_{hw_type}_{h['id']}"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = {4.0 if hw_type == 'motorway' else 2.5}
cd.extrude = 0.5
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

print(f"Generated clean re-import script at {out_script}!")
