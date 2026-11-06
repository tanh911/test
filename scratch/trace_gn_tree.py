import bpy

ng = bpy.data.node_groups.get("Roadscape 4-13-10")

def dump_tree(tree, prefix, depth=0, max_depth=2):
    if depth > max_depth:
        return
    print(f"--- {prefix} ({tree.name}) nodes={len(tree.nodes)} ---")
    for n in tree.nodes:
        # Node đọc attribute hoặc split curve
        if 'attribute' in n.type.lower():
            attrs = []
            for inp in n.inputs:
                if hasattr(inp, 'default_value') and isinstance(inp.default_value, str) and inp.default_value:
                    attrs.append(inp.default_value)
            if attrs:
                print(f"  [ATTR] {n.type}: {attrs}")
        if n.type in ('GROUP',) and n.node_tree and depth < max_depth:
            dump_tree(n.node_tree, n.label or n.node_tree.name, depth + 1, max_depth)

dump_tree(ng, "MAIN", 0, 1)
