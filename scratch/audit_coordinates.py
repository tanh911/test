import json
import math

with open('public/maps/autobahn_rhynern.json', 'r', encoding='utf-8') as f:
    map_data = json.load(f)

nodes = map_data['nodes']
ways = map_data['ways']
metadata = map_data['metadata']

ref_lat = metadata['refLat']
ref_lon = metadata['refLon']

print(f"=== METADATA ===")
print(f"refLat: {ref_lat}")
print(f"refLon: {ref_lon}")
print(f"wayCount: {len(ways)}")
print(f"nodeCount: {len(nodes)}")

R_EARTH = 6378137.0

def latlon_to_metric_py(lat, lon):
    d_lat = math.radians(lat - ref_lat)
    d_lon = math.radians(lon - ref_lon)
    x = d_lon * R_EARTH * math.cos(math.radians(ref_lat))
    z = d_lat * R_EARTH
    return round(x, 2), round(z, 2)

print("\n=== 10 CHECKPOINT NODES AUDIT ===")
sample_nids = list(nodes.keys())[:10]
errors = []

for nid in sample_nids:
    nd = nodes[nid]
    lat, lon = nd['lat'], nd['lon']
    json_x, json_z = nd['x'], nd['z']
    calc_x, calc_z = latlon_to_metric_py(lat, lon)
    dx = abs(json_x - calc_x)
    dz = abs(json_z - calc_z)
    delta = math.hypot(dx, dz)
    errors.append(delta)
    print(f"Node {nid}: lat={lat:.7f}, lon={lon:.7f} | JSON: ({json_x:.2f}, {json_z:.2f}) | Calc: ({calc_x:.2f}, {calc_z:.2f}) | Delta: {delta:.4f}m")

print(f"\nMax Delta: {max(errors):.4f}m")
print(f"Avg Delta: {sum(errors)/len(errors):.4f}m")
