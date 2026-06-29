import urllib.request
import csv
import io
import re
import sys
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

url = 'https://raw.githubusercontent.com/yowmamasita/driving-theory/main/driving_theory_questions_de.csv'

print("Downloading CSV...")
response = urllib.request.urlopen(url)
csv_content = response.read().decode('latin-1')

print("Parsing CSV...")
reader = csv.DictReader(io.StringIO(csv_content))
rows = list(reader)

def get_prefix_and_suffix(id_str):
    try:
        parts = id_str.split('-')
        prefix = parts[0]
        suffix_str = parts[1] if len(parts) > 1 else '0'
        # clean suffix
        suffix_clean = suffix_str.replace('B', '').replace('M', '').strip()
        suffix = int(suffix_clean) if suffix_clean.isdigit() else 0
        return prefix, suffix
    except Exception:
        return id_str, 0

groups = defaultdict(list)
for row in rows:
    q_id = row.get('question_id', '')
    prefix, suffix = get_prefix_and_suffix(q_id)
    # group by the first two parts of prefix, e.g. "1.1" or "2.1"
    top_prefix = '.'.join(prefix.split('.')[:2])
    groups[top_prefix].append((q_id, suffix, row.get('question_text', ''), row.get('theme_name', '')))

print(f"Total rows: {len(rows)}")
print("\nGrouped by top prefix (first 2 segments):")
for top_pref in sorted(groups.keys()):
    items = groups[top_pref]
    suffixes = [x[1] for x in items]
    min_s, max_s = min(suffixes), max(suffixes)
    # count how many questions have suffixes < 200, 200-299, 300-399, >= 400
    c_lt_200 = sum(1 for s in suffixes if s < 200)
    c_200_299 = sum(1 for s in suffixes if 200 <= s < 300)
    c_300_399 = sum(1 for s in suffixes if 300 <= s < 400)
    c_ge_400 = sum(1 for s in suffixes if s >= 400)
    
    print(f"Prefix: {top_pref} | Count: {len(items)} | Suffix range: {min_s} to {max_s} | Theme: {items[0][3]}")
    print(f"  - Suffix < 200: {c_lt_200}")
    print(f"  - Suffix 200-299: {c_200_299}")
    print(f"  - Suffix 300-399: {c_300_399}")
    print(f"  - Suffix >= 400: {c_ge_400}")
    
    # print some sample questions for each range in this prefix
    sample_lt = [x for x in items if x[1] < 200][:1]
    sample_200 = [x for x in items if 200 <= x[1] < 300][:1]
    sample_300 = [x for x in items if 300 <= x[1] < 400][:1]
    sample_400 = [x for x in items if x[1] >= 400][:1]
    
    if sample_lt:
        print(f"    Sample < 200: {sample_lt[0][0]} -> {sample_lt[0][2][:80]}")
    if sample_200:
        print(f"    Sample 200-299: {sample_200[0][0]} -> {sample_200[0][2][:80]}")
    if sample_300:
        print(f"    Sample 300-399: {sample_300[0][0]} -> {sample_300[0][2][:80]}")
    if sample_400:
        print(f"    Sample >= 400: {sample_400[0][0]} -> {sample_400[0][2][:80]}")
    print()
