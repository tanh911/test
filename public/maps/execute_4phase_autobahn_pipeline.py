import osmium
import math
import numpy as np
from PIL import Image

nrw_pbf = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\nordrhein-westfalen-261002.osm.pbf"
tif_path = r"G:\road\dem_data\output_hh.tif"
out_script = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\build_4phase_pipeline.py"

# Bounding Box around AS 18 Rhynern Interchange
MIN_LAT, MAX_LAT = 51.605, 51.640
MIN_LON, MAX_LON = 7.790, 7.865

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

REF_LAT = 51.6245
REF_LON = 7.8450
LAT_TO_M = 111139.0
LON_TO_M = 111139.0 * math.cos(math.radians(REF_LAT))
BASE_ELEV = get_elevation(REF_LAT, REF_LON)

class PhaseRoadGraphExtractor(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.phase1_a2 = []
        self.phase2_b63 = []
        self.phase3_ramps = []

    def way(self, w):
        if 'highway' in w.tags:
            hw = w.tags['highway']
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
                item = {
                    'id': w.id,
                    'type': hw,
                    'ref': ref,
                    'name': name,
                    'lanes': lanes,
                    'is_bridge': is_bridge,
                    'coords': coords
                }
                if hw == 'motorway':
                    self.phase1_a2.append(item)
                elif hw in ['primary', 'secondary', 'tertiary']:
                    self.phase2_b63.append(item)
                elif hw == 'motorway_link':
                    self.phase3_ramps.append(item)

handler = PhaseRoadGraphExtractor()
handler.apply_file(nrw_pbf, locations=True)

print(f"Extracted Phase 1 A2 Mainline: {len(handler.phase1_a2)} ways")
print(f"Extracted Phase 2 B63 & Local Roads: {len(handler.phase2_b63)} ways")
print(f"Extracted Phase 3 Auffahrt / Ausfahrt Ramps: {len(handler.phase3_ramps)} ways")

def latlon_to_xy(lat, lon):
    x = (lon - REF_LON) * LON_TO_M
    y = (lat - REF_LAT) * LAT_TO_M
    return round(x, 2), round(y, 2)

blender_code = """import bpy
import mathutils
import math

# Create modular collections for Phase 1, Phase 2, Phase 3
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

mat_road = bpy.data.materials.get("Road") or bpy.data.materials.get("OSM Road")

def build_flat_ribbon_mesh(coll, item_id, hw_type, coords, road_width, is_bridge):
    pts_xyz = []
    for lat, lon, elev in coords:
        x, y = latlon_to_xy(lat, lon)
        z_rel = elev - BASE_ELEV
        if is_bridge:
            z_rel += 7.5
        elif hw_type == 'motorway_link':
            z_rel += 3.5
        pts_xyz.append((x, y, round(z_rel, 2)))
        
    n_pts = len(pts_xyz)
    smoothed_pts = []
    for i in range(n_pts):
        start_i = max(0, i - 2)
        end_i = min(n_pts, i + 3)
        avg_z = sum(pts_xyz[k][2] for k in range(start_i, end_i)) / float(end_i - start_i)
        smoothed_pts.append((pts_xyz[i][0], pts_xyz[i][1], round(avg_z, 2)))

    pts = smoothed_pts
    if len(pts) >= 2:
        half_w = road_width / 2.0
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
            
            length = math.sqrt(dx*dx + dy*dy)
            if length == 0:
                length = 1.0
            
            nx = -dy / length
            ny = dx / length
            
            v_left = (round(x + nx * half_w, 2), round(y + ny * half_w, 2), z)
            v_right = (round(x - nx * half_w, 2), round(y - ny * half_w, 2), z)
            verts.append(v_left)
            verts.append(v_right)
            
            if i > 0:
                v1 = (i - 1) * 2
                v2 = (i - 1) * 2 + 1
                v3 = i * 2 + 1
                v4 = i * 2
                faces.append((v1, v2, v3, v4))
                
        mesh_data = bpy.data.meshes.new(f"Mesh_{item_id}")
        mesh_data.from_pydata(verts, [], faces)
        mesh_data.update()
        
        obj = bpy.data.objects.new(f"Road_{hw_type}_{item_id}", mesh_data)
        coll.objects.link(obj)
        if mat_road:
            obj.data.materials.append(mat_road)
"""

# Build Phase 1: A2 Main Carriageways (3 lanes each = 11.5m width)
for h in handler.phase1_a2:
    blender_code += f"""
build_flat_ribbon_mesh(coll_p1, {h['id']}, '{h['type']}', {h['coords']}, 11.5, {h['is_bridge']})
"""

# Build Phase 2: B63 Cross Road & Feeder Roads (8.5m width)
for h in handler.phase2_b63:
    blender_code += f"""
build_flat_ribbon_mesh(coll_p2, {h['id']}, '{h['type']}', {h['coords']}, 8.5, {h['is_bridge']})
"""

# Build Phase 3: Auffahrt / Ausfahrt Ramps (6.5m width)
for h in handler.phase3_ramps:
    blender_code += f"""
build_flat_ribbon_mesh(coll_p3, {h['id']}, '{h['type']}', {h['coords']}, 6.5, {h['is_bridge']})
"""

# Setup 3 Fixed Check Cameras (TOP, ORTHOGRAPHIC, DRIVING_CAMERA)
blender_code += """
def create_or_get_camera(cam_name, loc, rot_euler, ortho=False, ortho_scale=3000.0):
    if cam_name in bpy.data.objects:
        cam_obj = bpy.data.objects[cam_name]
    else:
        cam_data = bpy.data.cameras.new(cam_name)
        cam_obj = bpy.data.objects.new(cam_name, cam_data)
        bpy.context.scene.collection.objects.link(cam_obj)
    
    cam_obj.location = loc
    cam_obj.rotation_euler = rot_euler
    if ortho:
        cam_obj.data.type = 'ORTHO'
        cam_obj.data.ortho_scale = ortho_scale
    else:
        cam_data.type = 'PERSP'
        cam_data.lens = 35.0
    return cam_obj

# Camera 1: TOP (Plan view shape check)
create_or_get_camera("CHECK_CAM_TOP", (0.0, 0.0, 2500.0), (0, 0, 0), ortho=True, ortho_scale=3000.0)

# Camera 2: ORTHOGRAPHIC (Lane & Ramp detail check)
create_or_get_camera("CHECK_CAM_ORTHO", (0.0, 0.0, 400.0), (0, 0, 0), ortho=True, ortho_scale=500.0)

# Camera 3: DRIVING_CAMERA (Eye-level driver experience check)
create_or_get_camera("CHECK_CAM_DRIVING", (-50.0, -2.0, 2.5), (math.radians(85), 0, math.radians(-90)), ortho=False)

print("Created 3 Fixed Check Cameras: CHECK_CAM_TOP, CHECK_CAM_ORTHO, CHECK_CAM_DRIVING!")
"""

with open(out_script, "w", encoding="utf-8") as f:
    f.write(blender_code)

print(f"Generated 4-phase pipeline script at {out_script}!")
