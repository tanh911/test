import struct
import json
import numpy as np

glb_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior.glb'
with open(glb_path, 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    clen, ctype = struct.unpack('<II', f.read(8))
    data = json.loads(f.read(clen).decode('utf-8'))

accessors = data.get('accessors', [])
nodes = data.get('nodes', [])
meshes = data.get('meshes', [])

def get_node_matrix(n):
    # Returns 4x4 matrix
    mat = np.identity(4)
    if 'matrix' in n:
        mat = np.array(n['matrix']).reshape((4,4)).T
    else:
        if 'translation' in n:
            t = n['translation']
            T = np.identity(4)
            T[0:3, 3] = t
            mat = mat @ T
        if 'rotation' in n:
            q = n['rotation'] # x,y,z,w
            x,y,z,w = q
            R = np.array([
                [1 - 2*y*y - 2*z*z, 2*x*y - 2*z*w, 2*x*z + 2*y*w, 0],
                [2*x*y + 2*z*w, 1 - 2*x*x - 2*z*z, 2*y*z - 2*x*w, 0],
                [2*x*z - 2*y*w, 2*y*z + 2*x*w, 1 - 2*x*x - 2*y*y, 0],
                [0, 0, 0, 1]
            ])
            mat = mat @ R
        if 'scale' in n:
            s = n['scale']
            S = np.diag([s[0], s[1], s[2], 1.0])
            mat = mat @ S
    return mat

world_mats = [None] * len(nodes)

def compute_world_matrices(node_idx, parent_mat=np.identity(4)):
    n = nodes[node_idx]
    local_mat = get_node_matrix(n)
    w_mat = parent_mat @ local_mat
    world_mats[node_idx] = w_mat
    for c in n.get('children', []):
        compute_world_matrices(c, w_mat)

compute_world_matrices(0)

print("=== EXACT WORLD BOUNDING BOXES & CENTERS IN GLB SPACE ===")
for idx, n in enumerate(nodes):
    name = n.get('name', f'node_{idx}')
    mesh_idx = n.get('mesh')
    w_mat = world_mats[idx]
    
    if mesh_idx is not None:
        mesh = meshes[mesh_idx]
        for p in mesh.get('primitives', []):
            pos_acc_idx = p['attributes'].get('POSITION')
            if pos_acc_idx is not None:
                acc = accessors[pos_acc_idx]
                mn = np.array(acc.get('min') + [1.0])
                mx = np.array(acc.get('max') + [1.0])
                
                # compute 8 corners
                corners = []
                for x in [mn[0], mx[0]]:
                    for y in [mn[1], mx[1]]:
                        for z in [mn[2], mx[2]]:
                            corners.append(w_mat @ np.array([x,y,z,1.0]))
                corners = np.array(corners)
                w_min = corners[:, :3].min(axis=0)
                w_max = corners[:, :3].max(axis=0)
                w_center = (w_min + w_max) / 2.0
                print(f"Node: {name:<45} | Center: [{w_center[0]:.3f}, {w_center[1]:.3f}, {w_center[2]:.3f}] | Min Z={w_min[2]:.3f}, Max Z={w_max[2]:.3f}")
