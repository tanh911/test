import bpy

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
image_path = r"G:\road\google_earth_sat_hamm.jpg"
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
