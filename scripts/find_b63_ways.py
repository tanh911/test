import json

with open('osm_as18.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = {e['id']: (e['lat'], e['lon']) for e in data['elements'] if e['type'] == 'node'}
ways = [e for e in data['elements'] if e['type'] == 'way']

for w in ways:
    pts = [nodes[nid] for nid in w['nodes'] if nid in nodes]
    if pts:
        lats = [p[0] for p in pts]
        lons = [p[1] for p in pts]
        if 51.620 < min(lats) < 51.630 and 7.840 < min(lons) < 7.855:
            tags = w.get('tags', {})
            hw = tags.get('highway')
            name = tags.get('name')
            ref = tags.get('ref')
            print(f"Way {w['id']}: hw={hw}, name={name}, ref={ref}")
            print(f"   lats=[{min(lats):.5f}, {max(lats):.5f}], lons=[{min(lons):.5f}, {max(lons):.5f}]")
