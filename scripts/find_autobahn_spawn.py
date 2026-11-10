import json
import math
import os

base_dir = os.path.dirname(__file__)
autobahn_json = os.path.join(base_dir, '..', 'src', 'simulation', 'data', 'road_graph_autobahn.json')

if not os.path.exists(autobahn_json):
    print(f"Error: {autobahn_json} not found.")
    exit(1)

with open(autobahn_json, 'r', encoding='utf-8') as f:
    data = json.load(f)

roads = data.get('roads', [])
metadata = data.get('metadata', {})
bounds = metadata.get('bounds', {})

print(f"Total Autobahn roads: {len(roads)}")
print(f"Map Bounds: {bounds}\n")

motorway_segments = [r for r in roads if r.get('highway') in ('motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary')]
print(f"Motorway/Trunk/Primary segments: {len(motorway_segments)}")

candidates = []
for r in motorway_segments:
    pts = r.get('centerline', [])
    if len(pts) < 2:
        continue
    
    length = r.get('length', 0)
    if length < 100:
        continue
    
    p_start = pts[0]
    p_end = pts[-1]
    dx = p_end[0] - p_start[0]
    dz = p_end[1] - p_start[1]
    seg_len = math.hypot(dx, dz)
    if seg_len < 1:
        continue
    
    angle_rad = math.atan2(dx, -dz)  # Standard Three.js angle where heading 0 is facing -Z (North)
    angle_deg = math.degrees(angle_rad)
    
    direction = 'UNKNOWN'
    if -45 <= angle_deg <= 45:
        direction = 'N'  # Facing -Z (North)
    elif 45 < angle_deg <= 135:
        direction = 'E'  # Facing +X (East)
    elif -135 <= angle_deg < -45:
        direction = 'W'  # Facing -X (West)
    else:
        direction = 'S'  # Facing +Z (South)
    
    lanes = r.get('lanes', 2)
    width = r.get('width', 12.0)
    
    mid_idx = len(pts) // 2
    mid_pt = pts[mid_idx]
    
    candidates.append({
        'id': r['id'],
        'name': r.get('name', 'Autobahn A9'),
        'highway': r.get('highway'),
        'length': length,
        'width': width,
        'lanes': lanes,
        'direction': direction,
        'angle_rad': round(angle_rad, 4),
        'angle_deg': round(angle_deg, 1),
        'start': p_start,
        'end': p_end,
        'mid': mid_pt
    })

candidates.sort(key=lambda c: -c['length'])

print(f"\n=== TOP 15 AUTOHBAHN CANDIDATES ===")
print(f"{'ID':<18} {'Dir':<4} {'Len(m)':<8} {'Lanes':<6} {'Angle(deg)':<10} {'Start (x,z)':<22} {'Heading(rad)':<12}")
for c in candidates[:15]:
    print(f"{c['id']:<18} {c['direction']:<4} {c['length']:<8.0f} {c['lanes']:<6} {c['angle_deg']:<10.1f} "
          f"({c['start'][0]:>7.1f}, {c['start'][1]:>7.1f})   {c['angle_rad']:<12.4f}")

if candidates:
    best = candidates[0]
    print(f"\n=== RECOMMENDED PRIMARY SPAWN ===")
    print(f"Segment ID: {best['id']}")
    print(f"Name: {best['name']} ({best['highway']})")
    print(f"Direction: {best['direction']} ({best['angle_deg']}°)")
    print(f"Length: {best['length']:.1f}m | Lanes: {best['lanes']} | Width: {best['width']:.1f}m")
    print(f"Recommended Spawn Pos: x = {best['start'][0]:.2f}, z = {best['start'][1]:.2f}")
    print(f"Recommended Heading: {best['angle_rad']} rad ({best['angle_deg']}°)")
