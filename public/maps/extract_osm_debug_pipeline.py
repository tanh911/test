import osmium
import math
import json
import numpy as np
from PIL import Image

pbf_file = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\nordrhein-westfalen-261002.osm.pbf"
tif_path = r"G:\road\dem_data\output_hh.tif"
out_json = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\osm_road_data.json"
out_blender_script = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\build_osm_debug_overlay.py"

# Bounding Box around AS 18 Rhynern Interchange (~3.5km stretch)
MIN_LAT, MAX_LAT = 51.615, 51.632
MIN_LON, MAX_LON = 7.820, 7.860

REF_LAT = 51.6245
REF_LON = 7.8450
LAT_TO_M = 111139.0
LON_TO_M = 111139.0 * math.cos(math.radians(REF_LAT))

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

BASE_ELEV = get_elevation(REF_LAT, REF_LON)

def latlon_to_xy(lat, lon):
    x = (lon - REF_LON) * LON_TO_M
    y = (lat - REF_LAT) * LAT_TO_M
    return round(x, 2), round(y, 2)

class FullOSMGraphExtractor(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.node_locations = {}
        self.node_counts = {}
        self.ways = []

    def way(self, w):
        if 'highway' in w.tags:
            hw = w.tags['highway']
            if hw not in ['motorway', 'motorway_link', 'primary', 'secondary', 'tertiary', 'trunk', 'trunk_link', 'primary_link', 'secondary_link']:
                return
            
            node_ids = []
            for n in w.nodes:
                if n.location.valid():
                    lat, lon = n.location.lat, n.location.lon
                    if MIN_LAT <= lat <= MAX_LAT and MIN_LON <= lon <= MAX_LON:
                        node_ids.append(n.ref)
                        if n.ref not in self.node_locations:
                            elev = get_elevation(lat, lon)
                            x, y = latlon_to_xy(lat, lon)
                            z = round(elev - BASE_ELEV, 2)
                            self.node_locations[n.ref] = {
                                'lat': lat, 'lon': lon,
                                'x': x, 'y': y, 'z': z
                            }
            
            if len(node_ids) >= 2:
                for nid in node_ids:
                    self.node_counts[nid] = self.node_counts.get(nid, 0) + 1
                
                # Parse lanes from OSM tag
                lanes_tag = w.tags.get('lanes', '')
                if lanes_tag.isdigit():
                    lanes_count = int(lanes_tag)
                else:
                    if hw in ['motorway', 'trunk']:
                        lanes_count = 3
                    elif hw in ['motorway_link', 'trunk_link', 'primary_link']:
                        lanes_count = 1
                    else:
                        lanes_count = 2

                is_bridge = w.tags.get('bridge', 'no') != 'no' or w.tags.get('layer', '0') != '0'
                oneway = w.tags.get('oneway', 'no') == 'yes'

                self.ways.append({
                    'id': w.id,
                    'highway': hw,
                    'ref': w.tags.get('ref', ''),
                    'name': w.tags.get('name', ''),
                    'lanes': lanes_count,
                    'oneway': oneway,
                    'is_bridge': is_bridge,
                    'node_ids': node_ids
                })

handler = FullOSMGraphExtractor()
print("Parsing OSM PBF dataset...")
handler.apply_file(pbf_file, locations=True)
print(f"Extracted {len(handler.ways)} total road ways.")

# Identify Junction Nodes (shared between 2+ ways)
junction_nodes = {}
for nid, count in handler.node_counts.items():
    if count >= 2 and nid in handler.node_locations:
        junction_nodes[nid] = handler.node_locations[nid]

print(f"Identified {len(junction_nodes)} topological junction nodes.")

# Save JSON dataset
export_data = {
    'ref_lat': REF_LAT,
    'ref_lon': REF_LON,
    'base_elev': BASE_ELEV,
    'junction_nodes': junction_nodes,
    'ways': handler.ways,
    'node_locations': handler.node_locations
}

with open(out_json, "w", encoding="utf-8") as f:
    json.dump(export_data, f, indent=2)

print(f"Exported JSON dataset to {out_json}")

# Generate Blender Debug Overlay Builder Script
blender_code = f"""import bpy
import mathutils
import math
import json

json_path = r"{out_json}"

with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

node_locs = data['node_locations']
junctions = data['junction_nodes']
ways = data['ways']

def get_or_create_coll(c_name):
    if c_name in bpy.data.collections:
        c = bpy.data.collections[c_name]
        for o in list(c.objects):
            bpy.data.objects.remove(o, do_unlink=True)
        return c
    c = bpy.data.collections.new(c_name)
    bpy.context.scene.collection.children.link(c)
    return c

coll_centerlines = get_or_create_coll("OSM_CENTERLINES")
coll_ramps = get_or_create_coll("OSM_RAMP_CENTERLINES")
coll_junctions = get_or_create_coll("OSM_JUNCTIONS")
coll_roads = get_or_create_coll("BLENDER_ROADS")

# Create Debug Materials
def make_mat(name, color_rgba, emission_strength=1.0):
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = color_rgba
    if 'Emission Color' in bsdf.inputs:
        bsdf.inputs['Emission Color'].default_value = color_rgba
        bsdf.inputs['Emission Strength'].default_value = emission_strength
    output = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

mat_red = make_mat("Mat_OSM_Centerline_Red", (1.0, 0.0, 0.0, 1.0), 2.0)
mat_orange = make_mat("Mat_OSM_Ramp_Orange", (1.0, 0.5, 0.0, 1.0), 2.0)
mat_yellow = make_mat("Mat_OSM_Junction_Yellow", (1.0, 1.0, 0.0, 1.0), 3.0)
mat_blue = make_mat("Mat_Blender_Road_Blue", (0.0, 0.5, 1.0, 0.8), 0.5)

# 1. Build OSM Centerlines (Curves/Lines)
for w in ways:
    pts = []
    for nid in w['node_ids']:
        if str(nid) in node_locs:
            nl = node_locs[str(nid)]
            z = nl['z']
            if w['is_bridge']:
                z += 7.5
            pts.append((nl['x'], nl['y'], z + 0.3)) # slight z offset above ground
    
    if len(pts) >= 2:
        curve_data = bpy.data.curves.new(name=f"OSM_Centerline_{{w['id']}}", type='CURVE')
        curve_data.dimensions = '3D'
        spline = curve_data.splines.new('POLY')
        spline.points.add(len(pts) - 1)
        for i, (x, y, z) in enumerate(pts):
            spline.points[i].co = (x, y, z, 1.0)
        
        c_obj = bpy.data.objects.new(name=f"Centerline_{{w['highway']}}_{{w['id']}}", object_data=curve_data)
        curve_data.bevel_depth = 0.6 # 1.2m pipe width for visual clarity
        
        if 'link' in w['highway']:
            curve_data.materials.append(mat_orange)
            coll_ramps.objects.link(c_obj)
        else:
            curve_data.materials.append(mat_red)
            coll_centerlines.objects.link(c_obj)

# 2. Build OSM Junction Markers (Yellow Spheres)
for nid, nl in junctions.items():
    z = nl['z'] + 0.5
    mesh = bpy.data.meshes.new(f"JunctionMesh_{{nid}}")
    obj = bpy.data.objects.new(f"Junction_{{nid}}", mesh)
    
    # Create simple octahedron / sphere representation
    r = 3.5 # 3.5m sphere radius
    verts = [
        (nl['x']+r, nl['y'], z), (nl['x']-r, nl['y'], z),
        (nl['x'], nl['y']+r, z), (nl['x'], nl['y']-r, z),
        (nl['x'], nl['y'], z+r), (nl['x'], nl['y'], z-r)
    ]
    faces = [
        (0,2,4), (2,1,4), (1,3,4), (3,0,4),
        (0,2,5), (2,1,5), (1,3,5), (3,0,5)
    ]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    mesh.materials.append(mat_yellow)
    coll_junctions.objects.link(obj)

# 3. Build Blender Road Surface Meshes (Blue Ribbons derived directly from lanes)
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
        # Width derived from lanes (3.5m per lane)
        road_w = w['lanes'] * 3.75
        half_w = road_w / 2.0
        verts = []
        faces = []
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
            nx, ny = -dy / l, dx / l
            
            verts.append((x + nx * half_w, y + ny * half_w, z))
            verts.append((x - nx * half_w, y - ny * half_w, z))
            
            if i > 0:
                v_idx = i * 2
                faces.append((v_idx - 2, v_idx - 1, v_idx + 1, v_idx))
                
        mesh = bpy.data.meshes.new(f"RoadMesh_{{w['id']}}")
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        mesh.materials.append(mat_blue)
        obj = bpy.data.objects.new(f"Road_{{w['highway']}}_{{w['id']}}", mesh)
        coll_roads.objects.link(obj)

# Setup Fixed Debug Cameras
def setup_cam(c_name, loc, rot, ortho=True, scale=800.0):
    c_obj = bpy.data.objects.get(c_name)
    if not c_obj:
        cdata = bpy.data.cameras.new(c_name)
        c_obj = bpy.data.objects.new(c_name, cdata)
        bpy.context.scene.collection.objects.link(c_obj)
    c_obj.location = loc
    c_obj.rotation_euler = rot
    c_obj.data.type = 'ORTHO' if ortho else 'PERSP'
    if ortho:
        c_obj.data.ortho_scale = scale
    c_obj.data.clip_start = 0.1
    c_obj.data.clip_end = 20000.0
    return c_obj

setup_cam("CHECK_CAM_TOP", (-1500.0, -200.0, 3000.0), (0, 0, 0), ortho=True, scale=6000.0)
setup_cam("CHECK_CAM_ORTHO", (30.0, 50.0, 500.0), (0, 0, 0), ortho=True, scale=750.0)

print("Created Debug Overlay Scene: OSM Centerlines (Red/Orange), Junctions (Yellow), Blender Roads (Blue)!")
"""

with open(out_blender_script, "w", encoding="utf-8") as f:
    f.write(blender_code)

print(f"Generated Blender Debug Script at {out_blender_script}")
