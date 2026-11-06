import bpy
o = next(o for o in bpy.data.objects if o.name == 'Roadscape Main Generator WIP OSM')
me = o.data
print('=== TEMPLATE MESH ATTRS ===')
for a in me.attributes:
    info = ''
    if a.data_type == 'FLOAT' and a.domain == 'POINT':
        vals = [d.value for d in a.data]
        info = ' min=%.3f max=%.3f nonzero=%d/%d' % (min(vals), max(vals), sum(1 for v in vals if abs(v) > 1e-6), len(vals))
    elif a.data_type == 'BOOLEAN':
        vals = [d.value for d in a.data]
        info = ' true=%d/%d' % (sum(vals), len(vals))
    elif a.data_type == 'INT':
        vals = [d.value for d in a.data]
        from collections import Counter
        info = ' ' + str(Counter(vals).most_common(4))
    print(' attr: %-30s domain=%-8s type=%-8s%s' % (a.name, a.domain, a.data_type, info))
