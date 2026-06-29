import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load the raw B questions
with open('scripts/raw_questions_B.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Keywords to find two-wheeler related questions
bike_keywords = [
    'motorrad', 'kraftrad', 'zweirad', 'sozius', 'beiwagen', 
    'helm', 'schutzkleidung', 'moped', 'mofa', 'krad', 'lenker'
]

bike_in_zstoff = []
for q in questions:
    qid = q.get('id', '')
    if qid.startswith('2.'):  # Zusatzstoff
        text = q.get('textDe', '').lower()
        explanation = q.get('explanationDe', '').lower()
        combined = text + ' ' + explanation
        
        matches = [kw for kw in bike_keywords if kw in combined]
        if matches:
            bike_in_zstoff.append((qid, q.get('textDe'), matches))

print(f"Total Zusatzstoff (2.x) questions in raw_questions_B: {sum(1 for q in questions if q.get('id', '').startswith('2.'))}")
print(f"Found {len(bike_in_zstoff)} motorcycle/two-wheeler questions in Zusatzstoff:")
print("-" * 80)
for qid, text, matches in bike_in_zstoff:
    print(f"ID: {qid} | Matches: {matches}")
    print(f"  Text: {text}")
    print()
