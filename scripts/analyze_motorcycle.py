import urllib.request
import csv
import io
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load raw_questions_B
with open('scripts/raw_questions_B.json', 'r', encoding='utf-8') as f:
    raw_b = json.load(f)

# Build a map from id to item
raw_b_map = {q['id']: q for q in raw_b}

# Download CSV
url = 'https://raw.githubusercontent.com/yowmamasita/driving-theory/main/driving_theory_questions_de.csv'
print("Downloading CSV...")
response = urllib.request.urlopen(url)
csv_content = response.read().decode('latin-1')

print("Parsing CSV...")
reader = csv.DictReader(io.StringIO(csv_content))
rows = list(reader)

motorcycle_qs = []
for row in rows:
    qid = row.get('question_id')
    if qid in raw_b_map:
        text = row.get('question_text', '')
        if 'motorrad' in text.lower() or 'motorräder' in text.lower() or 'kraftrad' in text.lower() or 'zweirad' in text.lower():
            motorcycle_qs.append(row)

print(f"Found {len(motorcycle_qs)} motorcycle-related questions in raw_questions_B.")
print("Sample motorcycle questions with URLs:")
for q in motorcycle_qs[:15]:
    print(f"  ID: {q['question_id']}")
    print(f"    Text: {q['question_text']}")
    print(f"    URL:  {q['url']}")
    print()
