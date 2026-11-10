import bpy
o = bpy.data.objects.get('RoaDscape Main Generator WIP OSM')
print('found:', bool(o))
if o:
    print('verts:', len(o.data.vertices), 'edges:', len(o.data.edges), 'curves attrs:', [a.name for a in o.data.attributes])
    for m in o.modifiers:
        ng = m.node_group
        print('MOD:', m.name, '->', ng.name if ng else None)
        for it in ng.interface.items_tree:
            if it.item_type != 'SOCKET' or it.in_out != 'INPUT':
                continue
            try:
                v = m[it.identifier]
            except Exception:
                continue
            if hasattr(v, 'name'):
                v = 'OBJ:' + v.name
            if isinstance(v, float):
                v = round(v, 2)
            print('   %-42s = %s' % (it.name, v))
