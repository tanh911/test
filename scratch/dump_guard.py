import bpy
for o in bpy.data.objects:
    if 'Guardrails' in o.name:
        print('=== OBJ:', repr(o.name), o.type, '| splines:', len(o.data.splines) if o.type=='CURVE' else '-')
        for m in o.modifiers:
            ng = m.node_group
            if not ng: continue
            print('  MOD ->', ng.name, '| nodes:', len(ng.nodes))
            for it in ng.interface.items_tree:
                if it.item_type == 'SOCKET' and it.in_out == 'INPUT':
                    try: v = m[it.identifier]
                    except Exception: v = '?'
                    if hasattr(v, 'name'): v = 'OBJ:' + v.name
                    if hasattr(v, 'collection'): v = 'COLL:' + v.collection.name if v.collection else 'COLL:None'
                    if isinstance(v, float): v = round(v, 3)
                    if v not in (None, False, 0):
                        print('    IN %-38s = %s' % (it.name, v))
