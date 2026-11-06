import json
import os

print("=== JUNCTION DIAGNOSTIC ===")

base_dir = os.path.dirname(os.path.abspath(__file__))
candidates = [
    os.path.join(base_dir, '..', 'src', 'simulation', 'data', 'road_graph.json'),
    os.path.join(base_dir, 'road_graph.json'),
    'src/simulation/data/road_graph.json',
    'road_graph.json',
]

graph_path = None
for c in candidates:
    if os.path.exists(c):
        graph_path = c
        break

if not graph_path:
    print("ERROR: road_graph.json not found in any of:")
    for c in candidates:
        print(f"  {c}")
    exit(1)

print(f"Loading: {graph_path}\n")

with open(graph_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

juncs = data.get('junctions', [])
roads = data.get('roads', [])

print(f"Total roads:    {len(roads)}")
print(f"Total junctions: {len(juncs)}")
print()

# 1. Phân loại theo số nhánh
by_count = {}
for j in juncs:
    c = j.get('connectedRoadsCount', 0)
    by_count[c] = by_count.get(c, 0) + 1

print("Junctions by connected roads:")
for c, cnt in sorted(by_count.items()):
    pct = 100.0 * cnt / len(juncs)
    print(f"  {c:2d} roads: {cnt:5d}  ({pct:5.1f}%)")

# 2. Inline joints
inline = sum(1 for j in juncs if j.get('isInlineJoint'))
print(f"\nInline joints: {inline} / {len(juncs)} ({100.0*inline/len(juncs):.1f}%)")

# 3. Priority rules
rules = {}
for j in juncs:
    r = j.get('priorityRule', 'NONE')
    rules[r] = rules.get(r, 0) + 1

print("\nPriority rule distribution:")
for r, cnt in sorted(rules.items(), key=lambda x: -x[1]):
    pct = 100.0 * cnt / len(juncs)
    print(f"  {r:30s}: {cnt:5d}  ({pct:5.1f}%)")

# 4. Kích thước polygon (phát hiện polygon phình to)
import math
big_polygons = 0
tiny_polygons = 0
sizes = []

for j in juncs:
    poly = j.get('polygon', [])
    if len(poly) < 3:
        tiny_polygons += 1
        continue
    # Shoelace area
    area = 0.0
    for i in range(len(poly)):
        p1 = poly[i]
        p2 = poly[(i + 1) % len(poly)]
        area += p1[0] * p2[1] - p2[0] * p1[1]
    area = abs(area) / 2.0
    sizes.append(area)
    if area > 400:  # > 20m × 20m
        big_polygons += 1

if sizes:
    sizes.sort()
    print(f"\nJunction polygon area (m²):")
    print(f"  Min:    {sizes[0]:.1f}")
    print(f"  Median: {sizes[len(sizes)//2]:.1f}")
    print(f"  Max:    {sizes[-1]:.1f}")
    print(f"  Polygons > 400 m²: {big_polygons} ({100.0*big_polygons/len(juncs):.1f}%)")
    print(f"  Polygons < 3 points: {tiny_polygons}")

# 5. Chẩn đoán
print("\n--- DIAGNOSIS ---")
two_road_pct = 100.0 * by_count.get(2, 0) / len(juncs)
if two_road_pct > 60:
    print(f"⚠️  {two_road_pct:.1f}% junction chỉ có 2 nhánh")
    print("   → Clustering radius 18m quá lớn, gộp junction thật thành 1")
    print("   → Sửa: osm_to_roadgraph.py, giảm 18.0 → 8.0")
elif inline < len(juncs) * 0.1:
    print(f"⚠️  Chỉ {100.0*inline/len(juncs):.1f}% là inline joints")
    print("   → Có thể đang đánh dấu junction thật là inline")
elif big_polygons > len(juncs) * 0.2:
    print(f"⚠️  {100.0*big_polygons/len(juncs):.1f}% polygon có diện tích > 400 m²")
    print("   → Polygon junction phình to, che mất đường")
    print("   → Sửa: giảm d_junc trong osm_to_roadgraph.py")
else:
    print("✅ Junction clustering có vẻ hợp lý")

print("\n=== DONE ===")