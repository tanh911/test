import json

with open('osm_as18.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = {e['id']: (e['lat'], e['lon']) for e in data['elements'] if e['type'] == 'node'}
ways = [e for e in data['elements'] if e['type'] == 'way']

links = [w for w in ways if w.get('tags', {}).get('highway') == 'motorway_link']
print('Motorway links found:', len(links))
for idx, l in enumerate(links):
    tags = l.get('tags', {})
    pts = [nodes[nid] for nid in l['nodes'] if nid in nodes]
    if pts:
        lat_span = (min(p[0] for p in pts), max(p[0] for p in pts))
        lon_span = (min(p[1] for p in pts), max(p[1] for p in pts))
        name = tags.get('name', tags.get('destination', 'Unnamed'))
        oneway = tags.get('oneway', 'unknown')
        print(f"Link {idx}: name={name}, oneway={oneway}")
        print(f"   lat: {lat_span[0]:.5f}..{lat_span[1]:.5f}, lon: {lon_span[0]:.5f}..{lon_span[1]:.5f}")

# Also check primary road (B63 / Werler Strasse)
primaries = [w for w in ways if w.get('tags', {}).get('highway') == 'primary']
print('\nPrimary roads (B63):', len(primaries))
for idx, p in enumerate(primaries):
    tags = p.get('tags', {})
    print(f"Primary {idx}: name={tags.get('name')}")
