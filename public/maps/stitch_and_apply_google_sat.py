import os
import glob
from PIL import Image

sat_dir = r"G:\road\google_satellite"
out_img_path = r"G:\road\google_earth_sat_hamm.jpg"

# Find tiles
tile_files = glob.glob(os.path.join(sat_dir, "sat_16_*.jpg"))
print(f"Found {len(tile_files)} satellite tiles!")

# Create 3x3 stitched image (768 x 768 pixels)
stitched = Image.new('RGB', (768, 768))

# Sort tiles by x and y
tiles_dict = {}
for f in tile_files:
    parts = os.path.basename(f).replace('.jpg', '').split('_')
    x_idx, y_idx = int(parts[2]), int(parts[3])
    tiles_dict[(x_idx, y_idx)] = f

sorted_xs = sorted(list(set(k[0] for k in tiles_dict.keys())))
sorted_ys = sorted(list(set(k[1] for k in tiles_dict.keys())))

for i, x in enumerate(sorted_xs):
    for j, y in enumerate(sorted_ys):
        if (x, y) in tiles_dict:
            tile_im = Image.open(tiles_dict[(x, y)])
            stitched.paste(tile_im, (i * 256, j * 256))

stitched.save(out_img_path, quality=95)
print(f"Saved stitched Google Earth 3D satellite texture at '{out_img_path}'!")

blender_code = f"""import bpy

# Apply Google Earth satellite texture to Autobahn_Terrain_Ground
ground = bpy.data.objects.get("Autobahn_Terrain_Ground")
if not ground:
    bpy.ops.mesh.primitive_plane_add(size=4000.0, location=(2622.0, 822.0, -0.05))
    ground = bpy.context.active_object
    ground.name = "Autobahn_Terrain_Ground"

ground.hide_viewport = False
ground.display_type = 'TEXTURED'

# Create Material with Google Earth Satellite Texture
mat_name = "Google_Earth_3D_Sat_Mat"
if mat_name in bpy.data.materials:
    mat = bpy.data.materials[mat_name]
else:
    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True

nodes = mat.node_tree.nodes
links = mat.node_tree.links

# Clear default nodes
for n in list(nodes):
    nodes.remove(n)

output_node = nodes.new(type='ShaderNodeOutputMaterial')
bsdf_node = nodes.new(type='ShaderNodeBsdfPrincipled')
tex_node = nodes.new(type='ShaderNodeTexImage')

# Load stitched Google Earth image
image_path = r"{out_img_path}"
img = bpy.data.images.load(image_path, check_existing=True)
tex_node.image = img

links.new(bsdf_node.outputs['BSDF'], output_node.inputs['Surface'])
links.new(tex_node.outputs['Color'], bsdf_node.inputs['Base Color'])

# Assign material to ground
if not ground.data.materials:
    ground.data.materials.append(mat)
else:
    ground.data.materials[0] = mat

# Set Material shading mode in Viewport
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.clip_start = 1.0
                space.clip_end = 100000.0
                space.shading.type = 'MATERIAL'
                rv3d = space.region_3d
                rv3d.view_location = (2622.0, 822.0, 20.0)
                rv3d.view_distance = 600.0
                rv3d.view_rotation = (0.425, 0.175, 0.342, 0.822)

print("Applied Google Earth 3D Satellite Orthophoto texture to Blender terrain & focused viewport!")
"""

out_blender_script = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\public\maps\apply_google_sat_mat.py"
with open(out_blender_script, "w", encoding="utf-8") as f:
    f.write(blender_code)

print("Generated Blender Google Earth texture script successfully!")
