
import bpy
ng = bpy.data.node_groups.get('Roadscape 4-13-10')
obj = bpy.data.objects.get('Roadscape_A2_Curve')
m = obj.modifiers[0]
for it in ng.interface.items_tree:
    if it.item_type == 'SOCKET' and it.in_out == 'INPUT':
        try:
            v = m[it.identifier]
        except Exception:
            v = 'ERR'
        if hasattr(v, 'name'):
            v = '<obj %s>' % v.name
        print('%-45s = %s' % (it.name, v))
