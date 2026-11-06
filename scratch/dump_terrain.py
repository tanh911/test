import bpy
big = sorted(((o, len(o.data.vertices)) for o in bpy.data.objects if o.type=='MESH'), key=lambda t: -t[1])[:6]
for o, n in big:
    print('MESH:', repr(o.name), n, 'verts')
