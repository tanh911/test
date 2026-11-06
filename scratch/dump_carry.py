import bpy
ng = bpy.data.node_groups.get('Roadscape 4-13-10')
print('=== objects carrying the main RS modifier ===')
for o in bpy.data.objects:
    for m in o.modifiers:
        if m.type == 'NODES' and m.node_group and m.node_group.name == 'Roadscape 4-13-10':
            print(' OBJ:', o.name, o.type, '| collections:', [c.name for c in o.users_collection])
print('=== Object Info / Collection Info nodes in main tree ===')
for n in ng.nodes:
    if n.type == 'OBJECT_INFO' and n.inputs['Object'].default_value:
        print(' OBJINFO obj:', n.inputs['Object'].default_value.name)
    if n.type == 'COLLECTION_INFO' and n.inputs['Collection'].default_value:
        print(' COLLINFO:', n.inputs['Collection'].default_value.name)
