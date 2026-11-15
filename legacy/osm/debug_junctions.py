import json
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(base_dir, 'osm_pbf_extracted.json')

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

ways = data.get('ways', [])
nodes = data.get('nodes', {})

print(f"Total ways: {len(ways)}")
print(f"Total nodes in JSON: {len(nodes)}")
print()

# Build node -> set of way indices (giống logic mới)
node_way_set = {}
# Đếm distribution
degree_counts = {}
for nid, way_set in node_way_set.items():
    d = len(way_set)
    degree_counts[d] = degree_counts.get(d, 0) + 1

print("Node way-degree distribution (số way khác nhau chứa node):")
total_nodes = sum(degree_counts.values())
for d, cnt in sorted(degree_counts.items()):
    pct = 100.0 * cnt / total_nodes
    print(f"  Degree {d:2d}: {cnt:5d}  ({pct:5.1f}%)")

# Endpoint analysis
endpoints = set()
for w in ways:
    w_nodes = w.get('nodes', [])
    if w_nodes:
        endpoints.add(w_nodes[0])
        endpoints.add(w_nodes[-1])

print(f"\nTotal unique endpoints: {len(endpoints)}")

# Junction theo logic mới
junctions_strict = set(endpoints)
for nid, way_set in node_way_set.items():
    if len(way_set) >= 3:
        junctions_strict.add(nid)

print(f"Junctions (strict): {len(junctions_strict)}")

# Junction theo logic cũ
node_degree = {}
for w in ways:
    for nid in w.get('nodes', []):
        node_degree[nid] = node_degree.get(nid, 0) + 1

junctions_old = set(endpoints)
for w in ways:
    w_nodes = [n for n in w.get('nodes', []) if n in node_degree]
    if len(w_nodes) >= 2:
        for nid in w_nodes[1:-1]:
            if node_degree.get(nid, 0) > 1:
                junctions_old.add(nid)

print(f"Junctions (old logic): {len(junctions_old)}")

# Tại sao endpoint nhiều?
print(f"\n--- ENDPOINT ANALYSIS ---")
print(f"Endpoints: {len(endpoints)}")
print(f"  Trong số này, chỉ {len(endpoints & set(n for n, ws in node_way_set.items() if len(ws) >= 2))} endpoints có >= 2 way")
print(f"  {len(endpoints - set(n for n, ws in node_way_set.items() if len(ws) >= 2))} endpoints chỉ thuộc 1 way (dead-end)")

# In một vài endpoint có degree >= 3 (thật sự là junction)
true_junctions = [nid for nid in endpoints if len(node_way_set.get(nid, set())) >= 2]
print(f"\nSample junction nodes (endpoint + >=2 ways):")
for nid in true_junctions[:10]:
    way_ids = list(node_way_set[nid])
    print(f"  Node {nid}: {len(way_ids)} ways, first 3 way ids = {way_ids[:3]}")