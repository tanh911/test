import bpy, sys

ng = bpy.data.node_groups.get("Roadscape 4-13-10")
if not ng:
    print("NO Roadscape group")
    sys.exit(1)

print("=== Roadscape 4-13-10 INTERFACE ===")
for item in ng.interface.items_tree:
    if item.item_type == 'SOCKET':
        io = 'IN ' if item.in_out == 'INPUT' else 'OUT'
        dv = ''
        if item.in_out == 'INPUT':
            try:
                dv = getattr(item, 'default_value', '')
                if hasattr(dv, 'default_value'):
                    dv = list(dv.default_value)
            except Exception:
                dv = '?'
        print(f"  [{io}] {item.name}  ({item.socket_type})  default={dv}")

# Modifier đang gắn trên object nào
for obj in bpy.data.objects:
    for m in obj.modifiers:
        if m.type == 'NODES' and m.node_group and 'Roadscape' in (m.node_group.name or ''):
            print(f"MOD on: {obj.name} -> {m.node_group.name}")
            for item in m.node_group.interface.items_tree:
                if item.item_type == 'SOCKET' and item.in_out == 'INPUT':
                    ident = item.identifier
                    try:
                        v = m[ident]
                        if hasattr(v, 'tolist'):
                            v = list(v)
                    except Exception:
                        v = 'n/a'
                    print(f"    {item.name}: {v}")
