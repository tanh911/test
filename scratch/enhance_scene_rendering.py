import bpy
import math

print("--- ENHANCING MOSAIQ SCENE QUALITY ---")

# 1. Open generated blend file
blend_file = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\rhynern_mosaiq_output.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

# 2. Fix Z-Fighting & Layering for Roads, Markings, Sidewalks, Crosswalks
for obj in bpy.data.objects:
    if obj.type != 'MESH':
        continue
    
    name = obj.name.lower()
    
    # Ground plane
    if "ground" in name or "aoi" in name:
        obj.location.z = 0.0
        # Set grass material
        if obj.data.materials:
            mat = obj.data.materials[0]
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.12, 0.42, 0.14, 1.0) # Green grass
                bsdf.inputs["Roughness"].default_value = 0.8
                
    # Road markings
    elif "road_marking" in name or "marking" in name:
        obj.location.z = 0.028
        if obj.data.materials:
            mat = obj.data.materials[0]
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.95, 0.95, 0.95, 1.0) # White
                bsdf.inputs["Roughness"].default_value = 0.3
                
    # Crosswalks
    elif "crosswalk" in name:
        obj.location.z = 0.032
        if obj.data.materials:
            mat = obj.data.materials[0]
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.98, 0.98, 0.95, 1.0)
                bsdf.inputs["Roughness"].default_value = 0.2
                
    # Sidewalks
    elif "sidewalk" in name:
        obj.location.z = 0.025
        if obj.data.materials:
            mat = obj.data.materials[0]
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.68, 0.68, 0.70, 1.0) # Concrete light gray
                bsdf.inputs["Roughness"].default_value = 0.6

    # Parking
    elif "parking" in name:
        obj.location.z = 0.015
        if obj.data.materials:
            mat = obj.data.materials[0]
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.25, 0.25, 0.27, 1.0)

    # Roads
    elif "road_" in name or "way_" in name:
        obj.location.z = 0.010
        if obj.data.materials:
            mat = obj.data.materials[0]
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.08, 0.08, 0.09, 1.0) # Dark asphalt
                bsdf.inputs["Roughness"].default_value = 0.95

    # Buildings
    elif "building" in name or "bldg" in name:
        obj.location.z = 0.001
        if obj.data.materials:
            mat = obj.data.materials[0]
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.85, 0.82, 0.78, 1.0) # Plaster warm white
                bsdf.inputs["Roughness"].default_value = 0.7

# 3. Add Sun Light & World Sky Lighting
if "Sun" not in bpy.data.objects:
    bpy.ops.object.light_add(type='SUN', location=(100, 100, 150))
    sun = bpy.context.active_object
    sun.name = "Sun"
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(45), math.radians(30), math.radians(60))

# 4. Save enhanced blend file
enhanced_blend = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\rhynern_mosaiq_enhanced.blend"
bpy.ops.wm.save_as_mainfile(filepath=enhanced_blend)
print(f"Saved enhanced blend file: {enhanced_blend}")

# 5. Export enhanced GLB file
enhanced_glb = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\rhynern_mosaiq_enhanced.glb"
bpy.ops.export_scene.gltf(filepath=enhanced_glb, export_format='GLB')
print(f"Exported enhanced GLB: {enhanced_glb}")

# 6. Render preview image
scene = bpy.context.scene
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = 'PNG'

# Setup camera
if "Camera" not in bpy.data.objects:
    bpy.ops.object.camera_add(location=(100, -120, 90), rotation=(math.radians(55), 0, math.radians(40)))
    cam = bpy.context.active_object
    scene.camera = cam

preview_png = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\enhanced_preview.png"
scene.render.filepath = preview_png
bpy.ops.render.render(write_still=True)
print(f"Rendered preview PNG: {preview_png}")

print("--- ENHANCEMENT COMPLETE ---")
