import urllib.request
import urllib.parse
import json

query = """[out:json][timeout:25];
(
  way["highway"]["name"="Friedrichstraße"](52.505,13.380,52.535,13.395);
  way["highway"]["name"="Unter den Linden"](52.514,13.375,52.520,13.405);
  way["highway"]["name"="Torstraße"](52.526,13.380,52.535,13.415);
  way["highway"]["name"="Leipziger Straße"](52.508,13.380,52.515,13.410);
  way["highway"]["name"="Karl-Liebknecht-Straße"](52.518,13.400,52.526,13.415);
  way["highway"]["name"="Charlottenstraße"](52.508,13.385,52.522,13.395);
  way["highway"]["name"="Französische Straße"](52.513,13.382,52.517,13.398);
  way["highway"]["name"="Mohrenstraße"](52.510,13.382,52.514,13.398);
  way["highway"]["name"="Mauerstraße"](52.508,13.380,52.517,13.388);
  way["highway"]["name"="Linienstraße"](52.526,13.380,52.533,13.410);
);
out body;
>;
out skel qt;"""

url = "https://overpass-api.de/api/interpreter"
data = urllib.parse.urlencode({"data": query}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"User-Agent": "VietDeFuhrerschein/2.0"})

print("Sending targeted query to Overpass API...")
with urllib.request.urlopen(req, timeout=30) as resp:
    res = json.loads(resp.read().decode("utf-8"))
    elements = res.get("elements", [])
    nodes = {e["id"]: (e["lat"], e["lon"]) for e in elements if e["type"] == "node"}
    ways = [e for e in elements if e["type"] == "way"]
    print(f"Success! {len(nodes)} nodes, {len(ways)} ways.")
    with open("scripts/osm_berlin_cache.json", "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False)
    print("Saved cache: scripts/osm_berlin_cache.json")
