import bpy
import os
import math

# Target assets directory in MOSAIQ addon
assets_dir = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\MOSAIQ-Addon\assets"
os.makedirs(assets_dir, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_tree_prefab():
    reset_scene()
    # Trunk
    bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=2.0, location=(0, 0, 1.0))
    trunk = bpy.context.active_object
    trunk.name = "Trunk"
    mat_trunk = bpy.data.materials.new(name="Bark")
    mat_trunk.use_nodes = True
    mat_trunk.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.25, 0.15, 0.08, 1.0)
    trunk.data.materials.append(mat_trunk)
    
    # Leaves Canopy
    bpy.ops.mesh.primitive_ico_sphere_add(radius=1.5, subdivisions=2, location=(0, 0, 2.8))
    leaves = bpy.context.active_object
    leaves.name = "Leaves"
    mat_leaves = bpy.data.materials.new(name="Leaves")
    mat_leaves.use_nodes = True
    mat_leaves.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.1, 0.45, 0.15, 1.0)
    leaves.data.materials.append(mat_leaves)
    
    out_path = os.path.join(assets_dir, "natural-tree.glb")
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
    print(f"Created tree asset: {out_path}")

def create_street_lamp_prefab():
    reset_scene()
    # Pole
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=5.0, location=(0, 0, 2.5))
    pole = bpy.context.active_object
    mat_pole = bpy.data.materials.new(name="PoleMat")
    mat_pole.use_nodes = True
    mat_pole.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.2, 0.22, 0.25, 1.0)
    pole.data.materials.append(mat_pole)
    
    # Lamp head
    bpy.ops.mesh.primitive_cube_add(size=0.4, location=(0, 0.3, 5.0))
    lamp = bpy.context.active_object
    lamp.scale = (0.8, 1.5, 0.4)
    mat_lamp = bpy.data.materials.new(name="LampLight")
    mat_lamp.use_nodes = True
    nodes = mat_lamp.node_tree.nodes
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (1.0, 0.9, 0.7, 1.0)
    bsdf.inputs["Emission Color"].default_value = (1.0, 0.9, 0.7, 1.0)
    bsdf.inputs["Emission Strength"].default_value = 5.0
    lamp.data.materials.append(mat_lamp)
    
    out_path = os.path.join(assets_dir, "highway-street_lamp.glb")
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
    print(f"Created street lamp asset: {out_path}")

def create_bench_prefab():
    reset_scene()
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.4))
    bench = bpy.context.active_object
    bench.scale = (1.2, 0.5, 0.4)
    mat_wood = bpy.data.materials.new(name="Wood")
    mat_wood.use_nodes = True
    mat_wood.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.4, 0.22, 0.1, 1.0)
    bench.data.materials.append(mat_wood)
    
    out_path = os.path.join(assets_dir, "amenity-bench.glb")
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB')
    print(f"Created bench asset: {out_path}")

create_tree_prefab()
create_street_lamp_prefab()
create_bench_prefab()

print("All prefabs generated successfully!")
