import json

with open('src/data/questions_klasse_b.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

to_drop = []

for q in questions:
    text = q.get('textDe', '').lower()
    
    # Heuristics for 'motorcycle driver'
    if any(phrase in text for phrase in [
        'ihr motorrad', 'ihr kraftrad', 'ihr zweirad', 
        'sie als kraftradfahrer', 'sie als motorradfahrer',
        'seitenständer', 'hauptständer', 'helmpflicht', 'sturzhelm',
        'sozius', 'soziussitz', 'motorrad nicht abgestellt',
        'parken ihres kraftrads', 'parken eines zweirads',
        'sie ein zweirad', 'sie ein motorrad'
    ]):
        to_drop.append(q)

print(f'Found {len(to_drop)} motorcycle questions to drop:')
for q in to_drop:
    print(f"{q['id']}: {q['textDe']}")
