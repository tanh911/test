import os
import sys
import json
import math

extracted_file = r"scripts/osm_pbf_extracted_new_autobahn.json"

if not os.path.exists(extracted_file):
    print(f"[ERROR] Extracted JSON not found: {extracted_file}")
    sys.exit(1)

print(f"[Autobahn Builder] Loading extracted OSM data from: {extracted_file}...")
with open(extracted_file, "r", encoding="utf-8") as f:
    data = json.load(f)

raw_nodes = data.get("nodes", {})
raw_ways = data.get("ways", [])

lats = [nd["lat"] for nd in raw_nodes.values()]
lons = [nd["lon"] for nd in raw_nodes.values()]
ref_lat = sum(lats) / len(lats) if lats else 51.625
ref_lon = sum(lons) / len(lons) if lons else 7.865

R_EARTH = 6378137.0

def latlon_to_metric(lat, lon):
    d_lat = math.radians(lat - ref_lat)
    d_lon = math.radians(lon - ref_lon)
    x = d_lon * R_EARTH * math.cos(math.radians(ref_lat))
    z = d_lat * R_EARTH
    return round(x, 2), round(z, 2)

node_dict = {}
all_xs = []
all_zs = []

for nid_str, ndata in raw_nodes.items():
    nid = int(nid_str) if str(nid_str).isdigit() else nid_str
    x, z = latlon_to_metric(ndata["lat"], ndata["lon"])
    all_xs.append(x)
    all_zs.append(z)
    node_dict[nid] = {
        "id": nid,
        "lat": ndata["lat"],
        "lon": ndata["lon"],
        "x": x,
        "z": z,
        "trafficSignal": ndata.get("trafficSignal", False),
        "crossing": ndata.get("crossing", False),
        "stop": ndata.get("stop", False),
        "giveWay": ndata.get("giveWay", False)
    }

bounds = {
    "minX": min(all_xs) - 50 if all_xs else -2000,
    "maxX": max(all_xs) + 50 if all_xs else 2000,
    "minZ": min(all_zs) - 50 if all_zs else -2000,
    "maxZ": max(all_zs) + 50 if all_zs else 2000
}

drivable_highways = {
    "motorway", "motorway_link", "service", "trunk", "trunk_link",
    "primary", "primary_link", "secondary", "secondary_link", "tertiary"
}

ways_out = []
junction_node_counts = {}

for w in raw_ways:
    tags = w.get("tags", {})
    hw = tags.get("highway")
    if hw not in drivable_highways:
        continue

    valid_nids = [nid for nid in w["nodes"] if nid in node_dict]
    if len(valid_nids) < 2:
        continue

    polyline = [[node_dict[nid]["x"], node_dict[nid]["z"]] for nid in valid_nids]
    latlon_polyline = [[node_dict[nid]["lat"], node_dict[nid]["lon"]] for nid in valid_nids]

    length = sum(
        math.hypot(polyline[i+1][0] - polyline[i][0], polyline[i+1][1] - polyline[i][1])
        for i in range(len(polyline)-1)
    )

    lanes_str = tags.get("lanes")
    lanes_cnt = 3
    if lanes_str and lanes_str.isdigit():
        lanes_cnt = int(lanes_str)
    elif hw == "motorway_link":
        lanes_cnt = 1
    elif hw == "service":
        lanes_cnt = 1

    speed_str = tags.get("maxspeed")
    speed_limit = 130 if hw == "motorway" else 80
    if speed_str and speed_str.isdigit():
        speed_limit = int(speed_str)

    oneway = tags.get("oneway") in ("yes", "true", "1") or hw in ("motorway", "motorway_link")
    is_bridge = tags.get("bridge") in ("yes", "true", "1") or "bridge" in tags
    is_tunnel = tags.get("tunnel") in ("yes", "true", "1") or "tunnel" in tags

    dest = tags.get("destination", tags.get("destination:forward", ""))
    dest_ref = tags.get("destination:ref", tags.get("destination:ref:lanes", ""))
    ref = tags.get("ref", "")
    name = tags.get("name", f"A2 {hw.replace('_', ' ').title()}")

    for nid in valid_nids:
        junction_node_counts[nid] = junction_node_counts.get(nid, 0) + 1

    way_obj = {
        "id": f"way_{w['id']}",
        "osmWayId": w['id'],
        "name": name,
        "highway": hw,
        "ref": ref,
        "destination": dest,
        "destinationRef": dest_ref,
        "lanes": lanes_cnt,
        "laneWidth": 3.5,
        "speedLimit": speed_limit,
        "oneway": oneway,
        "bridge": is_bridge,
        "tunnel": is_tunnel,
        "startNode": valid_nids[0],
        "endNode": valid_nids[-1],
        "nodes": valid_nids,
        "centerline": polyline,
        "latlonPolyline": latlon_polyline,
        "length": round(length, 2),
        "lengthMeters": round(length, 2),
        "width": round(lanes_cnt * 3.5, 2),
        "tags": tags
    }

    if "Rhynern" in name or "Rhynern" in dest or "Rhynern" in str(tags):
        way_obj["rhynernFacility"] = True

    ways_out.append(way_obj)

junctions_out = []
for nid, count in junction_node_counts.items():
    if count >= 2:
        nd = node_dict[nid]
        junctions_out.append({
            "id": f"junc_node_{nid}",
            "osmNodeId": nid,
            "center": [nd["x"], nd["z"]],
            "x": nd["x"],
            "z": nd["z"],
            "lat": nd["lat"],
            "lon": nd["lon"],
            "degree": count
        })

out_data = {
    "metadata": {
        "id": "autobahn_rhynern",
        "name": "Autobahn A2 Hamm/Rhynern OSM Real Map",
        "source": "public/maps/new_autobahn.pbf",
        "refLat": ref_lat,
        "refLon": ref_lon,
        "bounds": bounds,
        "wayCount": len(ways_out),
        "roadCount": len(ways_out),
        "nodeCount": len(node_dict),
        "junctionCount": len(junctions_out),
        "generatedAt": "2026-09-26T11:06:00Z"
    },
    "nodes": node_dict,
    "roads": ways_out,
    "ways": ways_out,
    "junctions": junctions_out
}

os.makedirs("public/maps", exist_ok=True)
os.makedirs("src/simulation/data", exist_ok=True)

with open("public/maps/autobahn_rhynern.json", "w", encoding="utf-8") as f:
    json.dump(out_data, f, indent=2)

with open("src/simulation/data/road_graph_autobahn.json", "w", encoding="utf-8") as f:
    json.dump(out_data, f, indent=2)

print(f"[Autobahn Builder] Saved {len(ways_out)} real OSM roads and {len(junctions_out)} junctions with bounds to public/maps/autobahn_rhynern.json and src/simulation/data/road_graph_autobahn.json!")
