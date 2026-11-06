import bpy

ng = bpy.data.node_groups.get("Roadscape 4-13-10")

# 1. Sub-group Road Mesh Gen toàn bộ
sub = bpy.data.node_groups.get("Road Mesh Gen")
print("=== ROAD MESH GEN ===")
for n in sub.nodes:
    print(f"  {n.type:<28} {n.name}")

# 2. Trong MAIN: node nào nối Group Input -> đâu (depth 1 theo link)
print("=== MAIN: input chain ===")
gin = next(n for n in ng.nodes if n.type == 'GROUP_INPUT')
visited = set()
frontier = [(gin, 0)]
while frontier:
    node, d = frontier.pop(0)
    if d > 3 or node.name in visited:
        continue
    visited.add(node.name)
    outs = []
    for out in node.outputs:
        for link in out.links:
            outs.append(f"{link.to_node.type}({link.to_node.name})")
    if outs:
        print(f"  d{d} {node.type} {node.name} -> {outs[:6]}")
    for out in node.outputs:
        for link in out.links:
            frontier.append((link.to_node, d + 1))
