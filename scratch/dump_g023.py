import bpy
ng = bpy.data.node_groups.get('Roadscape 4-13-10')
g23 = next(n for n in ng.nodes if n.name == 'Group.023')
sub = g23.node_tree
print('GROUP.023 =', sub.name, '| nodes:', len(sub.nodes))
for n in sub.nodes:
    extra = ''
    if n.type == 'GROUP' and n.node_tree:
        extra = ' -> ' + n.node_tree.name
    if n.type == 'MATH':
        extra = ' op=%s b=%s' % (n.operation, round(n.inputs[1].default_value, 3) if hasattr(n.inputs[1].default_value, 'real') else '')
    if n.type == 'SEPARATE_GEOMETRY':
        extra = ' domain=%s' % n.domain
    print('  %-26s %s%s' % (n.type, n.name, extra))
