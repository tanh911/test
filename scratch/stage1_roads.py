import bpy, json, os
from mathutils import Vector, Matrix

OUT = r"C:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch"
GLB_OUT = OUT + r"\roads_stage1.glb"
OSM_JSON = r"G:\road\osm_road_data.json"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=OUT + r"\roadscape_generated.glb")
roads = max((o for o in bpy.data.objects if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
print("roads mesh:", roads.name, len(roads.data.vertices), "verts")
for o in list(bpy.data.objects):
    if o != roads:
        bpy.data.objects.remove(o, do_unlink=True)
for _ in range(3):
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

# Bake transform vào mesh rồi đưa về identity
mw = roads.matrix_world.copy()
roads.data.transform(mw)
roads.matrix_world = Matrix.Identity(4)
xs = [v.co.x for v in roads.data.vertices]; ys = [v.co.y for v in roads.data.vertices]
zs = [v.co.z for v in roads.data.vertices]
print(f"world bounds: x[{min(xs):.0f},{max(xs):.0f}] y[{min(ys):.0f},{max(ys):.0f}] z[{min(zs):.1f},{max(zs):.1f}]")

# Dịch về khung OSM: biết chuẩn x[-1715,1031] y[-1046,665] z=0 mặt đường
# Blender import từ glTF: blender_y = -osm_y (hoặc +) → xác định bằng tương quan bounds
osm = json.load(open(OSM_JSON, encoding='utf-8'))
nodes = osm['node_locations']
allx = [nd['x'] for nd in nodes.values()]; ally = [nd['y'] for nd in nodes.values()]
print(f"OSM expect: x[{min(allx):.0f},{max(allx):.0f}] y[{min(ally):.0f},{max(ally):.0f}]")

# Blender frame sau bake: đo offset theo min bounds (z min = mặt đường → 0)
OX = min(xs) - min(allx) if abs(min(xs) - max(allx)) > abs(min(xs) - min(allx)) else min(xs) - min(allx)
# thử 2 giả thiết cho trục Y: y_osm hoặc -y_osm
cand1 = min(ys) - min(ally)
cand2 = min(ys) + max(ally)
flipY = abs(cand2) < abs(cand1)
OY = cand2 if flipY else cand1
print(f"flipY={flipY} offset=({OX:.0f},{OY:.0f})")
for v in roads.data.vertices:
    v.co.x -= OX
    v.co.y += -OY if flipY else OY
    v.co.z -= min(zs)
roads.data.update()
xs = [v.co.x for v in roads.data.vertices]; ys = [v.co.y for v in roads.data.vertices]
print(f"osm frame: x[{min(xs):.0f},{max(xs):.0f}] y[{min(ys):.0f},{max(ys):.0f}] z[{min(v.co.z for v in roads.data.vertices):.2f},{max(v.co.z for v in roads.data.vertices):.2f}]")

# ── Mặt cắt ngang A2: histogram offset vuông góc quanh 1 đoạn thẳng ──
a2 = [w for w in osm['ways'] if w.get('highway') == 'motorway']
best = max(a2, key=lambda w: len(w.get('node_ids', [])))
pts = [(nodes[str(n)]['x'], nodes[str(n)]['y']) for n in best['node_ids'] if str(n) in nodes]
mid = Vector((pts[len(pts)//2][0], pts[len(pts)//2][1], 0))
nxt = Vector((pts[len(pts)//2 + 2][0], pts[len(pts)//2 + 2][1], 0))
dirv = (nxt - mid); dirv.z = 0; dirv.normalize()
nor = Vector((-dirv.y, dirv.x, 0))
mesh = roads.data
offs = []
for v in mesh.vertices:
    d = Vector((v.co.x, v.co.y, 0)) - mid
    along = d.dot(dirv); lat = d.dot(nor)
    if abs(along) < 40 and abs(lat) < 30:
        offs.append(round(lat, 1))
offs.sort()
# cụm hóa: gom offset cách nhau < 0.8m
clusters = []
for o in offs:
    if clusters and o - clusters[-1][-1] < 0.8:
        clusters[-1].append(o)
    else:
        clusters.append([o])
print("CROSS-SECTION clusters (offset, count):")
for c in clusters:
    if len(c) >= 3:
        print(f"  [{c[0]:+.1f} .. {c[-1]:+.1f}] n={len(c)}")

# ── Render cận cảnh ──
sc = bpy.context.scene
cam = bpy.data.cameras.new('T'); cam.type = 'ORTHO'; cam.ortho_scale = 140
co = bpy.data.objects.new('TCam', cam); sc.collection.objects.link(co)
co.location = (mid.x, mid.y, 100)
sc.render.engine = 'BLENDER_WORKBENCH'
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True
sc.render.resolution_x = 1400; sc.render.resolution_y = 900
sc.camera = co
sc.render.filepath = OUT + r"\audit_shots\a2_fixed_closeup.png"
bpy.ops.render.render(write_still=True)

# ── Material đơn giản + export ──
mat = bpy.data.materials.new("Road_Auto")
mat.use_nodes = True
b = mat.node_tree.nodes.get('Principled BSDF')
b.inputs['Base Color'].default_value = (0.045, 0.048, 0.052, 1.0)
b.inputs['Roughness'].default_value = 0.85
if not roads.data.uv_layers:
    roads.data.uv_layers.new(name="UVMap")
roads.data.materials.clear()
roads.data.materials.append(mat)
bpy.ops.export_scene.gltf(filepath=GLB_OUT, export_format='GLB')
print("exported:", GLB_OUT, os.path.getsize(GLB_OUT), "bytes")
