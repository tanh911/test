import urllib.request
import os

# Bounding box for a small road/autobahn area in Rhynern (Hamm, Germany)
# minlon, minlat, maxlon, maxlat
minlon, minlat, maxlon, maxlat = 7.850, 51.625, 7.865, 51.635

overpass_url = f"https://overpass-api.de/api/map?bbox={minlon},{minlat},{maxlon},{maxlat}"
output_osm = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\scratch\rhynern_sample.osm"

print(f"Downloading OSM data from {overpass_url}...")
req = urllib.request.Request(
    overpass_url, 
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)

with urllib.request.urlopen(req) as response, open(output_osm, 'wb') as out_file:
    data = response.read()
    out_file.write(data)
    print(f"Saved {len(data)} bytes to {output_osm}")
