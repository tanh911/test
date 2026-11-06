import struct
import json
import numpy as np

glb_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior.glb'
with open(glb_path, 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    clen, ctype = struct.unpack('<II', f.read(8))
    json_data = f.read(clen)
    data = json.loads(json_data.decode('utf-8'))
    
    b_len, b_type = struct.unpack('<II', f.read(8))
    bin_data = f.read(b_len)

accessors = data.get('accessors', [])
nodes = data.get('nodes', [])
meshes = data.get('meshes', [])
bufferViews = data.get('bufferViews', [])

def get_accessor_data(acc_idx):
    acc = accessors[acc_idx]
    bv = bufferViews[acc['bufferView']]
    offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count']
    comp_type = acc['componentType'] # 5126 is FLOAT
    dtype = np.float32 if comp_type == 5126 else np.int16
    byte_len = count * 3 * 4 if acc['type'] == 'VEC3' else count * 4
    arr = np.frombuffer(bin_data[offset:offset + byte_len], dtype=np.float32)
    if acc['type'] == 'VEC3':
        arr = arr.reshape((-1, 3))
    return arr

print("=== WHEEL NODES DETAILED MESH INSPECTION ===")
wheels_node = nodes[20] # corolla_e180_wheels
for c_idx in wheels_node.get('children', []):
    cn = nodes[c_idx]
    mesh = meshes[cn['mesh']]
    print(f"Child node {cn['name']} mesh {mesh.get('name')}:")
    for p in mesh['primitives']:
        pos_arr = get_accessor_data(p['attributes']['POSITION'])
        print(f"  Primitive pos count={len(pos_arr)}, Min={pos_arr.min(axis=0)}, Max={pos_arr.max(axis=0)}")
        front_mask = pos_arr[:, 2] > 0
        rear_mask = pos_arr[:, 2] < 0
        print(f"    Vertices Z > 0 (Front): {front_mask.sum()}, Vertices Z < 0 (Rear): {rear_mask.sum()}")
