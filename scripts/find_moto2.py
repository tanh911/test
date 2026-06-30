import json

with open('src/data/questions_klasse_b.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

for q in questions:
    if q['id'].startswith('2.2.14-0') or q['id'].startswith('2.2.12-0') or q['id'].startswith('2.1.01-0') or q['id'].startswith('2.1.03-0') or q['id'].startswith('2.6.02-0') or q['id'].startswith('2.7.01-0'):
        # Let's print them to see if they are motorcycle specific
        text = q.get('textDe', '').lower()
        if 'motorrad' in text or 'zweirad' in text or 'kraftrad' in text or 'seitenständer' in text or 'hauptständer' in text:
            print(f"{q['id']}: {q['textDe']}")
