import bpy

print("--- PATCHING BLEND FILE TO PREVENT FREEZE ON OPEN ---")
blend_path = r"G:\road\autobahn.blend"

# Load blend file without loading UI or evaluating heavy viewports
bpy.ops.wm.open_mainfile(filepath=blend_path, load_ui=False)

gen_obj = bpy.data.objects.get('Roadscape Main Generator')
if gen_obj:
    for m in gen_obj.modifiers:
        if m.type == 'NODES':
            # Hide modifier in viewport so opening the file doesn't freeze Blender
            m.show_viewport = False
            m['Socket_29'] = True    # Performance Mode = True
            m['Socket_470'] = 10.0   # Resampling length = 10m
            m['Socket_472'] = 1      # Path Subdivision Level = 1
            m['Socket_9'] = 1        # Subdivision Level = 1
            print("Successfully disabled heavy modifier viewport display & enabled Performance Mode.")

# Save modified file
bpy.ops.wm.save_mainfile(filepath=blend_path)
print("SAVED FILE OK!")
