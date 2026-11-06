import bpy
# Markings OSM generator + Guardrails: object, modifier, interface
for name_part in ['Markings OSM Generator', 'Guardrails']:
    objs = [o for o in bpy.data.objects if name_part in o.name and not o.name.endswith(('.001','.002'))]
    for o in objs[:2]:
        print('=== OBJ:', repr(o.name), o.type, '| verts:', len(o.data.vertices) if o.type=='MESH' else '-', '| splines:', len(o.data.splines) if o.type=='CURVE' else '-')
        for m in o.modifiers:
            ng = m.node_group
            if not ng: continue
            print('  MOD ->', ng.name, '| nodes:', len(ng.nodes))
            for it in ng.interface.items_tree:
                if it.item_type == 'SOCKET' and it.in_out == 'INPUT':
                    try: v = m[it.identifier]
                    except Exception: v = '?'
                    if hasattr(v, 'name'): v = 'OBJ:' + v.name
                    if isinstance(v, float): v = round(v, 3)
                    if v not in (None, False, 0):
                        print('    IN %-38s = %s' % (it.name, v))
