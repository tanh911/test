import json
import os

base_dir = os.path.dirname(__file__)
json_path = os.path.join(base_dir, 'osm_pbf_extracted.json')

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

ways = data.get('ways', [])
print(f'Total ways in JSON: {len(ways)}')

hw_counts = {}
for w in ways:
    tags = w.get('tags', {})
    hw = tags.get('highway', '<no-highway-tag>')
    hw_counts[hw] = hw_counts.get(hw, 0) + 1

print('\nHighway type distribution:')
for hw, cnt in sorted(hw_counts.items(), key=lambda x: -x[1]):
    print(f'  {hw:25s}: {cnt}')

# Bonus: kiểm tra service subtypes
print('\nService subtypes:')
svc_counts = {}
for w in ways:
    tags = w.get('tags', {})
    if tags.get('highway') == 'service':
        svc = tags.get('service', '<no-service-tag>')
        svc_counts[svc] = svc_counts.get(svc, 0) + 1
for svc, cnt in sorted(svc_counts.items(), key=lambda x: -x[1]):
    print(f'  service={svc:25s}: {cnt}')

# Bonus: kiểm tra pedestrian với motor_vehicle
print('\nPedestrian ways:')
for w in ways:
    tags = w.get('tags', {})
    if tags.get('highway') == 'pedestrian':
        motor = tags.get('motor_vehicle', tags.get('motorcar', '<none>'))
        print(f'  way {w["id"]}: motor_vehicle={motor}')