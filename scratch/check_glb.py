import struct
import json

glb_path = 'public/simu/32-mercedes-benz-gls-580-2020/mercedes_gls580.glb'

with open(glb_path, 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_bytes = f.read(chunk_len)
    data = json.loads(json_bytes.decode('utf-8'))

print("=== MATERIALS & PRIMITIVES ===")
for m_idx, mesh in enumerate(data.get('meshes', [])):
    for p_idx, prim in enumerate(mesh.get('primitives', [])):
        mat_idx = prim.get('material')
        mat_name = data['materials'][mat_idx]['name'] if mat_idx is not None else 'NoMat'
        pos_acc_idx = prim['attributes']['POSITION']
        pos_acc = data['accessors'][pos_acc_idx]
        print(f"Mesh {m_idx} Prim {p_idx} ({mat_name}): min={pos_acc.get('min')}, max={pos_acc.get('max')}")
