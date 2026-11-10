import bpy
import os

print("--- IMPORTING NEW_HAMM.GLB INTO AUTOBAHN MAP ---")

# 1. Open the Procedural Autobahn Map Blend
autobahn_blend = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\autobahn_3lanes_procedural.blend"
if os.path.exists(autobahn_blend):
    bpy.ops.wm.open_mainfile(filepath=autobahn_blend)
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)

# 2. Path to new_hamm.glb
hamm_glb = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\new_hamm.glb"

print(f"Importing GLB file: {hamm_glb}")
before_objs = set(bpy.data.objects)

try:
    bpy.ops.import_scene.gltf(filepath=hamm_glb)
    after_objs = set(bpy.data.objects)
    new_objs = list(after_objs - before_objs)
    print(f"Imported {len(new_objs)} new objects from new_hamm.glb:")
    for o in new_objs:
        print(f" - Object: {o.name} (Type: {o.type})")
except Exception as e:
    print(f"Error importing GLB: {e}")

# Also check test1.glb in workspace if new_hamm was small
test1_glb = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\test1.glb"
if os.path.exists(test1_glb):
    print(f"Importing test1.glb: {test1_glb}")
    try:
        b2 = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=test1_glb)
        a2 = set(bpy.data.objects)
        print(f"Imported {len(a2 - b2)} objects from test1.glb")
    except Exception as e:
        print(f"Error importing test1.glb: {e}")

# 3. Save combined scene
out_blend = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\combined_autobahn_hamm.blend"
bpy.ops.wm.save_as_mainfile(filepath=out_blend)
print(f"Saved combined blend file: {out_blend}")

# 4. Export combined GLB
out_glb = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\combined_autobahn_hamm.glb"
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB')
print(f"Exported combined GLB: {out_glb}")

# 5. Render Preview PNG
scene = bpy.context.scene
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.image_settings.file_format = 'PNG'

preview_png = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\combined_preview.png"
scene.render.filepath = preview_png
bpy.ops.render.render(write_still=True)
print(f"Rendered Preview PNG: {preview_png}")

print("--- IMPORT COMPLETED ---")
