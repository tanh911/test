import urllib.request
import urllib.parse
import json

overpass_url = 'https://overpass-api.de/api/interpreter'
query = """[out:json];
(
  way["highway"](51.618, 7.835, 51.632, 7.858);
);
out body;
>;
out skel qt;
"""

data = urllib.parse.urlencode({'data': query}).encode('utf-8')
req = urllib.request.Request(overpass_url, data=data, headers={'User-Agent': 'VietDeFuhrerschein/1.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        ways = [e for e in res['elements'] if e['type'] == 'way']
        print('Downloaded ways from OSM:', len(ways))
        with open('osm_as18_exact.json', 'w', encoding='utf-8') as f:
            json.dump(res, f)
        print('Saved to osm_as18_exact.json')
except Exception as e:
    print('Error:', e)
