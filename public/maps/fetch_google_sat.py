import os
import urllib.request
import math
import numpy as np

# Coordinates of Rhynern Hamm Interchange
LAT = 51.6180
LON = 7.8220
ZOOM = 16 # High-res Satellite Orthophoto tile

def latlon_to_tile(lat, lon, zoom):
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    xtile = int((lon + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return xtile, ytile

xtile, ytile = latlon_to_tile(LAT, LON, ZOOM)
out_dir = r"G:\road\google_satellite"
os.makedirs(out_dir, exist_ok=True)

print(f"Downloading Google 3D Earth Satellite Orthophoto tiles at zoom {ZOOM} around tile ({xtile}, {ytile})...")

# Download 3x3 satellite grid tiles
tiles = []
for dx in range(-1, 2):
    row = []
    for dy in range(-1, 2):
        x, y = xtile + dx, ytile + dy
        tile_path = os.path.join(out_dir, f"sat_{ZOOM}_{x}_{y}.jpg")
        url = f"https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={ZOOM}"
        if not os.path.exists(tile_path):
            try:
                headers = {'User-Agent': 'Mozilla/5.0'}
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req) as response, open(tile_path, 'wb') as out_file:
                    out_file.write(response.read())
            except Exception as e:
                print(f"Error fetching tile {x},{y}: {e}")
        row.append(tile_path)
    tiles.append(row)

print("Downloaded Google Earth Satellite tiles successfully!")
