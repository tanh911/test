import bpy
# 1. crease values cua template OSM
lib_obj = None
o = next((o for o in bpy.data.objects if o.name == 'Roadscape Main Generator WIP OSM'), None)
if o:
    me = o.data
    ce = me.attributes.get('crease_edge')
    cv = me.attributes.get('crease_vert')
    if ce:
        vals = [d.value for d in ce.data]
        print('TEMPLATE crease_edge: n=%d min=%.3f max=%.3f' % (len(vals), min(vals), max(vals)))
        from collections import Counter
        print('  common:', Counter(round(v,2) for v in vals).most_common(6))
    if cv:
        vals = [d.value for d in cv.data]
        print('TEMPLATE crease_vert: n=%d min=%.3f max=%.3f' % (len(vals), min(vals), max(vals)))
    print('TEMPLATE edges:', len(me.edges), 'verts:', len(me.vertices))
    print('TEMPLATE mod Terrain Object:', [m.name for m in o.modifiers])
    ti = ng = None
    m = o.modifiers[0]
    for it in m.node_group.interface.items_tree:
        if it.item_type=='SOCKET' and it.in_out=='INPUT' and it.name=='Terrain Object':
            try:
                tv = m[it.identifier]
                print('  terrain obj set to:', tv.name if tv else None)
            except Exception: pass
