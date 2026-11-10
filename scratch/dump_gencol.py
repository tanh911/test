import bpy
col = bpy.data.collections.get('RoaDscape Generators')
if col:
    for o in col.objects:
        mods = [m.node_group.name if m.node_group else m.type for m in o.modifiers]
        print('OBJ:', repr(o.name), o.type, '| mods:', mods)
else:
    print('collection not found; collections:', [c.name for c in bpy.data.collections])
