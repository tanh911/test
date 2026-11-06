import bpy
ng = bpy.data.node_groups.get('Roadscape 4-13-10')
names = set()
for n in ng.nodes:
    if 'attribute' in n.type.lower():
        for inp in n.inputs:
            if hasattr(inp, 'default_value') and isinstance(inp.default_value, str):
                names.add(inp.default_value)
print('ATTRS:', sorted(names))
obj = bpy.data.objects.get('Roadscape_A2_Curve')
print('curve attrs:', [a.name for a in obj.data.attributes] if hasattr(obj.data,'attributes') else 'n/a')
