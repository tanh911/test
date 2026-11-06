import bpy, sys, math, bmesh

sys.path.append(r"G:\road\scripts")
import rdscp_helper

TARGET_BLEND = r"G:\road\simple_autobahn.blend"

print("==========================================")
print("   BUILDING ULTRA LOW-VERTEX AUTOBAHN    ")
print("==========================================")

# 1. Reset Scene
bpy.ops.wm.read_factory_settings(use_empty=True)

# 2. Low-Poly Terrain Plane (only 10x10 grid, ultra lightweight)
mesh_terrain = bpy.data.meshes.new("Simple_Terrain")
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=10, y_segments=10, size=600.0)
bm.to_mesh(mesh_terrain)
bm.free()

obj_terrain = bpy.data.objects.new("Terrain_Plane", mesh_terrain)
bpy.context.scene.collection.objects.link(obj_terrain)
obj_terrain.location = (0, 0, -0.2)

mat_terrain = bpy.data.materials.new("Grass_Material")
mat_terrain.use_nodes = True
bsdf = mat_terrain.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.12, 0.42, 0.15, 1.0)
obj_terrain.data.materials.append(mat_terrain)

# 3. Main Autobahn with Overpass Bridge (step=10.0m for low vertex density)
raw_pts = [(0, -300, 0), (0, 0, 0), (0, 200, 0), (0, 500, 0)]
pts = rdscp_helper.densify(raw_pts, step=10.0)

pts_bridge = []
for x, y, z in pts:
    if 50.0 <= y <= 250.0:
        t = (y - 50.0) / 200.0
        z_elev = 8.0 * (0.5 - 0.5 * math.cos(t * 2 * math.pi))
    else:
        z_elev = 0.0
    pts_bridge.append((x, y, z + z_elev))

edges = rdscp_helper.chain_edges(0, len(pts_bridge))
obj_autobahn = rdscp_helper.road_object("Autobahn_Main", pts_bridge, edges)

# 4. Entry Ramp (Einfahrt) & Exit Ramp (Ausfahrt)
ein_pts = rdscp_helper.densify([(60, -200, 0), (35, -100, 0), (15, 0, 0), (0, 80, 0)], step=10.0)
rdscp_helper.road_object("Einfahrt_Ramp", ein_pts, rdscp_helper.chain_edges(0, len(ein_pts)))

aus_pts = rdscp_helper.densify([(0, 280, 0), (15, 360, 0), (35, 440, 0), (60, 520, 0)], step=10.0)
rdscp_helper.road_object("Ausfahrt_Ramp", aus_pts, rdscp_helper.chain_edges(0, len(aus_pts)))

# 5. Optimize Modifier Settings on all Road objects for minimal vertices
for obj in bpy.data.objects:
    for m in obj.modifiers:
        if m.type == 'NODES':
            if 'Socket_470' in m: m['Socket_470'] = 10.0 # Resampling length 10m
            if 'Socket_472' in m: m['Socket_472'] = 1    # Path subd level 1
            if 'Socket_9' in m:   m['Socket_9'] = 1      # Subdivision level 1
            if 'Socket_14' in m:  m['Socket_14'] = 0     # Far subd level 0
            if 'Socket_16' in m:  m['Socket_16'] = 0     # Med subd level 0
            if 'Socket_18' in m:  m['Socket_18'] = 0     # Close subd level 0

# 6. Sun Light & Environment
scene = bpy.context.scene
light_data = bpy.data.lights.new(name="Sun", type='SUN')
light_data.energy = 4.0
light_obj = bpy.data.objects.new(name="Sun", object_data=light_data)
scene.collection.objects.link(light_obj)
light_obj.rotation_euler = (math.radians(45), math.radians(25), math.radians(50))

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs['Color'].default_value = (0.65, 0.82, 1.0, 1.0)
    bg.inputs['Strength'].default_value = 1.2

# 7. Save file to simple_autobahn.blend
bpy.ops.wm.save_as_mainfile(filepath=TARGET_BLEND)

# Count and display final stats
depsgraph = bpy.context.evaluated_depsgraph_get()
total_verts = 0
for obj in bpy.data.objects:
    eval_obj = obj.evaluated_get(depsgraph)
    if eval_obj.type == 'MESH' and eval_obj.data:
        v_count = len(eval_obj.data.vertices)
        total_verts += v_count
        print(f"Object '{obj.name}': Evaluated Vertices = {v_count:,}")

print(f"\nULTRA LOW-VERTEX AUTOBAHN CREATED!")
print(f"TOTAL EVALUATED VERTICES IN SCENE: {total_verts:,}")
print(f"SAVED TO: {TARGET_BLEND}")
