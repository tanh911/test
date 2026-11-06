import struct
import json

glb_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior.glb'
with open(glb_path, 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    clen, ctype = struct.unpack('<II', f.read(8))
    data = json.loads(f.read(clen).decode('utf-8'))

nodes = data.get('nodes', [])

def print_tree(node_idx, depth=0):
    n = nodes[node_idx]
    name = n.get('name', f'node_{node_idx}')
    trans = n.get('translation', [0,0,0])
    rot = n.get('rotation', [0,0,0,1])
    scale = n.get('scale', [1,1,1])
    mesh = n.get('mesh')
    indent = "  " * depth
    print(f"{indent}- [{node_idx}] {name} (mesh: {mesh}) trans={trans} rot={rot} scale={scale}")
    for child_idx in n.get('children', []):
        print_tree(child_idx, depth + 1)

# Find root nodes
children_set = set()
for n in nodes:
    for c in n.get('children', []):
        children_set.add(c)

root_nodes = [i for i in range(len(nodes)) if i not in children_set]
print("=== NODE TREE HIERARCHY ===")
for r in root_nodes:
    print_tree(r)
