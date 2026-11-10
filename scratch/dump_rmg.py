import bpy
sub = bpy.data.node_groups.get('Road Mesh Gen')
for n in sub.nodes:
    if n.type == 'INPUT_ATTRIBUTE':
        for inp in n.inputs:
            if isinstance(getattr(inp, 'default_value', None), str) and inp.default_value:
                print('READ ATTR:', repr(inp.default_value), '| data_type:', n.data_type)
    if n.type == 'FIELD_ON_DOMAIN':
        print('EVAL DOMAIN:', n.domain)
    if n.type == 'CAPTURE_ATTRIBUTE':
        print('CAPTURE domain:', n.domain, 'data_type:', n.data_type)
    if n.type == 'GROUP':
        print('SUBGROUP:', n.node_tree.name if n.node_tree else None)
