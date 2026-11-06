import bpy
import os
import sys

print("--- STARTING MOSAIQ TEST IN BLENDER ---")

# 1. Enable Add-on
addon_name = "mosaiq_osm_vr"
if addon_name not in bpy.context.preferences.addons:
    print(f"Enabling add-on {addon_name}...")
    bpy.ops.preferences.addon_enable(module=addon_name)
else:
    print(f"Add-on {addon_name} is already enabled.")

# 2. Configure BBox props
props = bpy.context.scene.osm_bbox_props
props.minlon = 7.850
props.minlat = 51.625
props.maxlon = 7.865
props.maxlat = 51.635
props.shift_origin = True
props.import_roads = True
props.import_buildings = True
props.import_pois = True

osm_file = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\rhynern_sample.osm"

print(f"Importing OSM file: {osm_file}")
res = bpy.ops.osm_bbox.import_pbf(filepath=osm_file)
print(f"Import Operator Result: {res}")

# 3. Report objects created
obj_count = len(bpy.data.objects)
mesh_count = len([o for o in bpy.data.objects if o.type == 'MESH'])
print(f"Total objects created in scene: {obj_count} (Meshes: {mesh_count})")

for coll in bpy.data.collections:
    print(f"Collection: '{coll.name}' - {len(coll.objects)} objects")

# 4. Save .blend file
output_blend = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\rhynern_mosaiq_output.blend"
bpy.ops.wm.save_as_mainfile(filepath=output_blend)
print(f"Saved blend file to: {output_blend}")

# 5. Export .glb file for simulator/web
output_glb = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\rhynern_mosaiq_output.glb"
bpy.ops.export_scene.gltf(filepath=output_glb, export_format='GLB')
print(f"Exported GLB to: {output_glb}")

print("--- MOSAIQ TEST COMPLETED SUCCESSFULLY ---")
