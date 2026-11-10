import json

with open('scripts/osm_pbf_extracted.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("Checking ways in Mitte with detailed lane attributes:")
count = 0
for w in data.get('ways', []):
    tags = w.get('tags', {})
    if 'lanes:forward' in tags or 'lanes:backward' in tags or 'turn:lanes' in tags:
        name = tags.get('name', 'unnamed')
        if any(term in name.lower() for term in ['friedrich', 'linden', 'tor', 'leipziger', 'wilhelm']):
            count += 1
            if count <= 15:
                print(f"{name}: lanes={tags.get('lanes')}, fwd={tags.get('lanes:forward')}, bwd={tags.get('lanes:backward')}, turn={tags.get('turn:lanes')}, turn_fwd={tags.get('turn:lanes:forward')}")

print(f"Total matching ways: {count}")
