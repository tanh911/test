import bpy
print('OBJECTS with Generator/RoaDscape/RS in name:')
for o in bpy.data.objects:
    if any(k in o.name for k in ('Generator', 'Roadscape', 'RS_OSM', 'Landscape')):
        print('  ', repr(o.name), o.type, '| mods:', [m.node_group.name if m.node_group else m.type for m in o.modifiers])
print('node groups:', [g.name for g in bpy.data.node_groups if 'Roadscape' in g.name])
