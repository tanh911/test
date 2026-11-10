import struct
import json

glb_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior.glb'
with open(glb_path, 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    clen, ctype = struct.unpack('<II', f.read(8))
    data = json.loads(f.read(clen).decode('utf-8'))

accessors = data.get('accessors', [])
nodes = data.get('nodes', [])
meshes = data.get('meshes', [])

print("=== NODES & BOUNDING BOXES ===")
for idx, n in enumerate(nodes):
    name = n.get('name', f'node_{idx}')
    mesh_idx = n.get('mesh')
    pos = n.get('translation', [0,0,0])
    
    if mesh_idx is not None:
        mesh = meshes[mesh_idx]
        for p in mesh.get('primitives', []):
            pos_acc_idx = p['attributes'].get('POSITION')
            if pos_acc_idx is not None:
                acc = accessors[pos_acc_idx]
                mn = acc.get('min')
                mx = acc.get('max')
                print(f"Node: {name} | Mesh: {mesh.get('name', mesh_idx)} | Min: {mn} | Max: {mx} | Trans: {pos}")
