import bpy
curves = [o for o in bpy.data.objects if o.type == 'CURVE']
print('TOTAL CURVES:', len(curves))
for o in curves[:6]:
    print('CURVE:', o.name, '| splines:', len(o.data.splines), '| spline type:', o.data.splines[0].type if o.data.splines else '-')
    print('  custom props:', dict(o.items()))
    print('  data props:', {k: v for k, v in o.data.items()} if o.data else {})
    print('  attrs:', [(a.name, a.domain, a.data_type) for a in o.data.attributes] if hasattr(o.data, 'attributes') else [])
    if o.data.splines:
        sp = o.data.splines[0]
        if sp.points:
            p = sp.points[0]
            print('  first point: co=', tuple(round(c,2) for c in p.co), 'radius=', getattr(p, 'radius', '?'), 'weight=', getattr(p, 'weight_softbody', '?'))
        print('  bevel_depth:', o.data.bevel_depth, 'resolution_u:', o.data.resolution_u)
