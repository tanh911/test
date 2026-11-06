import bpy
for c in bpy.data.collections:
    if 'generator' in c.name.lower():
        print('COLL:', repr(c.name))
        for o in c.objects:
            mods = [m.node_group.name if m.node_group else m.type for m in o.modifiers]
            print('  OBJ:', repr(o.name), o.type, '| verts:', len(o.data.vertices) if o.type=='MESH' else '-', '| mods:', mods[:2])
            if o.type == 'MESH' and o.data.attributes:
                print('    attrs:', [a.name for a in o.data.attributes])
