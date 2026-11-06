import bpy, json
from mathutils import Vector
from mathutils.bvhtree import BVHTree

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\audit_shots"
OSM_JSON = r"G:\road\osm_road_data.json"
MAX_WIDTH = 250.0
WIDTH_M = {"motorway": 32.0, "motorway_link": 9.0, "primary": 15.0,
           "secondary": 12.0, "secondary_link": 8.0, "tertiary": 11.0}

col = bpy.data.collections.get("Roadscape_V413_Skeleton")
ng = bpy.data.node_groups.get("Roadscape 4-13-10.001") or bpy.data.node_groups.get("Roadscape 4-13-10")

# Carrier = template object append từ library + LINK VÀO SCENE (libraries.load không tự link
# → object 0 users bị drop khi save và không được evaluate khi render!)
LIB = r"G:\road\Roadscape\Roadscape\Roadscape v4.13.10 (Asset Library)\Roadscape 4 (Release).blend"

# GN tree tham chiếu nội bộ collection 'Ground' (COLLINFO) — phải có mặt trong file
if not any(c.name == 'Ground' for c in bpy.data.collections):
    with bpy.data.libraries.load(LIB, link=False) as (src, dst):
        dst.collections = ['Ground']
    gc = next(c for c in bpy.data.collections if c.name.startswith('Ground'))
    # KHÔNG link vào scene (tree đọc qua datablock) nhưng phải có user để khỏi bị drop khi save
    gc.use_fake_user = True
    print("appended Ground collection, objects:", len(gc.objects))

tpl = next((o for o in bpy.data.objects if 'Main Generator WIP OSM' in o.name), None)
if not tpl:
    before = set(bpy.data.objects)
    with bpy.data.libraries.load(LIB, link=False) as (src, dst):
        dst.objects = [n for n in src.objects if n == 'Roadscape Main Generator WIP OSM']
    tpl = next(o for o in bpy.data.objects if o not in before and 'WIP OSM' in o.name)
    bpy.context.scene.collection.objects.link(tpl)
    print("appended + linked:", tpl.name)
else:
    print("carrier existing:", tpl.name)
mod = next(m for m in tpl.modifiers if m.node_group and m.node_group.name.startswith('Roadscape 4'))
ng = mod.node_group
print("using node group:", ng.name)

def sock(name, nth=0):
    k = 0
    for it in ng.interface.items_tree:
        if it.item_type == 'SOCKET' and it.in_out == 'INPUT' and it.name == name:
            if k == nth:
                return it.identifier
            k += 1
    return None

# ── BVH của terrain để raycast Z ──
terrain = bpy.data.objects.get("Ground_Base")
tm = terrain.matrix_world
tverts = [tm @ v.co for v in terrain.data.vertices]
tfaces = [tuple(p.vertices) for p in terrain.data.polygons]
bvh = BVHTree.FromPolygons(tverts, tfaces)
print("terrain BVH:", len(tverts), "verts")

def terrain_z(x, y, fallback=0.0):
    hit = bvh.ray_cast(Vector((x, y, 500.0)), Vector((0, 0, -1)))
    if hit and hit[0]:
        return hit[0].z
    hit = bvh.ray_cast(Vector((x, y, -500.0)), Vector((0, 0, 1)))
    if hit and hit[0]:
        return hit[0].z
    return fallback

# ── OSM → mesh với Z raycast từ terrain ──
with open(OSM_JSON, encoding='utf-8') as f:
    osm = json.load(f)
nodes_map = osm.get('node_locations', {})

# cache z theo node
z_cache = {}
verts, edges, creases, bws = [], [], [], []
n_miss = 0
for way in osm.get('ways', []):
    hw = way.get('highway', '')
    if hw not in WIDTH_M:
        continue
    idxs = []
    for nid in way.get('node_ids', []):
        nd = nodes_map.get(str(nid))
        if not nd:
            continue
        key = str(nid)
        if key not in z_cache:
            z_cache[key] = terrain_z(nd['x'], nd['y'], fallback=None)
            if z_cache[key] is None:
                n_miss += 1
                z_cache[key] = 0.25
        idxs.append(len(verts))
        verts.append((nd['x'], nd['y'], z_cache[key] + 0.25))
        creases.append(WIDTH_M[hw] / MAX_WIDTH)
        bws.append(0.5)
    for i in range(len(idxs) - 1):
        edges.append((idxs[i], idxs[i + 1]))
print(f"mesh: {len(verts)} verts, {len(edges)} edges, z-miss {n_miss}")

me = bpy.data.meshes.new("RS_OSM_TerrainZ")
me.from_pydata(verts, edges, [])
me.update()
cv = me.attributes.new('crease_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    cv.data[i].value = creases[i]
bw = me.attributes.new('bevel_weight_vert', 'FLOAT', 'POINT')
for i in range(len(verts)):
    bw.data[i].value = bws[i]
tpl.data = me

mod[sock('Wireframe Only')] = False
mod[sock('Show Road')] = True
mod[sock('Show Support')] = False
mod[sock('Display Support')] = False
mod[sock('Display Sidewalks')] = False
mod[sock('Display Terrain')] = False
if terrain:
    mod[sock('Terrain Object')] = terrain

# ── Cameras + render ──
mins = Vector((1e9, 1e9, 0)); maxs = Vector((-1e9, -1e9, 0))
for v in me.vertices:
    mins.x = min(mins.x, v.co.x); mins.y = min(mins.y, v.co.y)
    maxs.x = max(maxs.x, v.co.x); maxs.y = max(maxs.y, v.co.y)
cx, cy = (mins.x + maxs.x) / 2, (mins.y + maxs.y) / 2
span = max(maxs.x - mins.x, maxs.y - mins.y)
print(f"BOUNDS center=({cx:.0f},{cy:.0f}) span={span:.0f}")

scene = bpy.context.scene
cam_top = bpy.data.objects.get("Cam_Top_Ortho")
cam_top.data.ortho_scale = span * 1.05
cam_top.location = (cx, cy, 600)
cam_top.rotation_euler = (0, 0, 0)

cam_drv = bpy.data.objects.get("Cam_Driving_View")
cam_drv.location = (cx - 120, cy - 280, 45)
old_t = bpy.data.objects.get("DrvTarget")
if old_t:
    bpy.data.objects.remove(old_t, do_unlink=True)
target = bpy.data.objects.new("DrvTarget", None)
target.location = (cx, cy, 5)
scene.collection.objects.link(target)
for c in list(cam_drv.constraints):
    cam_drv.constraints.remove(c)
con = cam_drv.constraints.new('TRACK_TO')
con.target = target
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis = 'UP_Y'

shd = scene.display.shading
shd.light = 'STUDIO'
shd.color_type = 'MATERIAL'
shd.show_cavity = True
shd.show_shadows = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 900

scene.camera = cam_top
scene.render.filepath = OUT + r"\rs_final_top.png"
bpy.ops.render.render(write_still=True)

scene.camera = cam_drv
scene.render.filepath = OUT + r"\rs_final_driving.png"
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_mainfile()
print("done")
