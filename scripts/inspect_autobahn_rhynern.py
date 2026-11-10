import json
import os

extracted_file = r"scripts/osm_pbf_extracted_new_autobahn.json"

with open(extracted_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

ways = data.get("ways", [])
nodes = data.get("nodes", {})

motorways = []
motorway_links = []
services = []
bridges = []
tunnels = []
junctions = []
rhynern_elements = []

for w in ways:
    tags = w.get("tags", {})
    hw = tags.get("highway")
    
    if hw == "motorway":
        motorways.append(w)
    elif hw == "motorway_link":
        motorway_links.append(w)
    elif hw == "service":
        services.append(w)
        
    if "bridge" in tags:
        bridges.append(w)
    if "tunnel" in tags:
        tunnels.append(w)
    if "junction" in tags:
        junctions.append(w)
        
    # Check Rhynern / Raststätte keywords
    name = tags.get("name", "")
    ref = tags.get("ref", "")
    dest = tags.get("destination", "")
    if "Rhynern" in name or "Rhynern" in dest or "Rhynern" in str(tags):
        rhynern_elements.append(w)

print(f"Total Drivable Ways: {len(ways)}")
print(f"  - Motorways (highway=motorway): {len(motorways)}")
print(f"  - Motorway Links (highway=motorway_link): {len(motorway_links)}")
print(f"  - Service Roads (highway=service): {len(services)}")
print(f"  - Bridges: {len(bridges)}")
print(f"  - Tunnels: {len(tunnels)}")
print(f"  - Junctions: {len(junctions)}")
print(f"  - Rhynern Elements: {len(rhynern_elements)}")

# Print sample tags of motorways and motorway_links
print("\n--- SAMPLE MOTORWAY TAGS ---")
for m in motorways[:5]:
    print(m['id'], m['tags'])

print("\n--- SAMPLE MOTORWAY_LINK TAGS ---")
for ml in motorway_links[:5]:
    print(ml['id'], ml['tags'])

print("\n--- RHYNERN ELEMENTS TAGS ---")
for rh in rhynern_elements[:5]:
    print(rh['id'], rh['tags'])
