import osmium
import math

pbf_path = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\hamm.osm.pbf"
out_script = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\build_autobahn_nodes.py"

class OSMHighwayExtractor(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.highways = []

    def way(self, w):
        if 'highway' in w.tags:
            hw = w.tags['highway']
            if hw in ['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link']:
                coords = []
                for n in w.nodes:
                    if n.location.valid():
                        coords.append((n.location.lat, n.location.lon))
                if len(coords) >= 2:
                    name = w.tags.get('name', '')
                    ref = w.tags.get('ref', '')
                    self.highways.append({
                        'id': w.id,
                        'type': hw,
                        'name': name,
                        'ref': ref,
                        'coords': coords
                    })

handler = OSMHighwayExtractor()
handler.apply_file(pbf_path, locations=True)
print(f"Extracted {len(handler.highways)} highway segments from PBF!")

REF_LAT = 51.6250
REF_LON = 7.7850
LAT_TO_M = 111139.0
LON_TO_M = 111139.0 * math.cos(math.radians(REF_LAT))

def latlon_to_xy(lat, lon):
    x = (lon - REF_LON) * LON_TO_M
    y = (lat - REF_LAT) * LAT_TO_M
    return round(x, 2), round(y, 2)

blender_code = """import bpy

coll_name = "OSM_Autobahn_Full_Network"
if coll_name in bpy.data.collections:
    coll = bpy.data.collections[coll_name]
else:
    coll = bpy.data.collections.new(coll_name)
    bpy.context.scene.collection.children.link(coll)

mat_road = bpy.data.materials.get("Road") or bpy.data.materials.get("OSM Road")
"""

for h in handler.highways:
    hw_type = h['type']
    pts_xy = [latlon_to_xy(lat, lon) for lat, lon in h['coords']]
    z_val = 0.0 if hw_type == 'primary' else (4.0 if hw_type == 'motorway_link' else 0.0)
    
    blender_code += f"""
# Highway {h['id']} ({hw_type} {h['ref']} {h['name']})
c_name = "OSM_{hw_type}_{h['id']}"
if c_name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[c_name], do_unlink=True)

cd = bpy.data.curves.new(name=c_name, type='CURVE')
cd.dimensions = '3D'
cd.bevel_depth = {3.5 if hw_type == 'motorway' else 2.0}
sp = cd.splines.new('POLY')
pts = {pts_xy}
sp.points.add(len(pts) - 1)
for i, (x, y) in enumerate(pts):
    sp.points[i].co = (x, y, {z_val}, 1.0)

obj = bpy.data.objects.new(c_name, cd)
coll.objects.link(obj)
if mat_road:
    obj.data.materials.append(mat_road)
"""

with open(out_script, "w", encoding="utf-8") as f:
    f.write(blender_code)

print(f"Generated Blender import script at {out_script} with {len(handler.highways)} highways!")
