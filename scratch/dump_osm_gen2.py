import bpy
targets = []
for o in bpy.data.objects:
    for m in o.modifiers:
        if m.type == 'NODES' and m.node_group and m.node_group.name == 'Roadscape 4-13-10':
            targets.append((o, m))
print('carriers:', [repr(o.name) for o, m in targets])
pick = [t for t in targets if 'osm' in t[0].name.lower()]
if pick:
    o, m = pick[0]
    ng = m.node_group
    print('PICKED:', repr(o.name), '| verts:', len(o.data.vertices), 'edges:', len(o.data.edges))
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
        if v not in (None, False, 0) and it.name not in ('Geometry',):
            print('   %-42s = %s' % (it.name, v))
