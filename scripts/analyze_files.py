import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def load_ids(f_path):
    with open(f_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return {q.get('id'): q for q in data}

raw_b = load_ids('scripts/raw_questions_B.json')
klasse_b = load_ids('src/data/questions_klasse_b.json')
trans = load_ids('src/data/questions_translated.json')

# 1. Print some integer-id questions
integer_ids = [k for k in klasse_b.keys() if isinstance(k, int) or (isinstance(k, str) and k.isdigit())]
print(f"Integer-ID questions count: {len(integer_ids)}")
print("Samples of integer-ID questions:")
for qid in sorted(integer_ids)[:3]:
    q = klasse_b[qid]
    print(f"  ID: {q['id']}, category: {q.get('category')}")
    print(f"    textDe: {q.get('textDe')}")
    print(f"    textVi: {q.get('textVi')}")

# 2. Print some of the 217 missing questions
only_in_trans = set(trans.keys()) - set(klasse_b.keys())
print(f"\nMissing questions count: {len(only_in_trans)}")
print("Samples of missing questions in klasse_b:")
for qid in sorted(list(only_in_trans))[:3]:
    q = trans[qid]
    print(f"  ID: {q['id']}, category: {q.get('category')}")
    print(f"    textDe: {q.get('textDe')}")
    print(f"    textVi: {q.get('textVi')}")

# 3. Analyze the suffixes of all 217 missing questions
def get_suffix(id_str):
    try:
        raw = str(id_str).split('-')
        for part in raw[1:]:
            cleaned = part.replace('B', '').replace('M', '').strip()
            if cleaned.isdigit():
                return int(cleaned)
        return 0
    except Exception:
        return 0

suffixes = [get_suffix(qid) for qid in only_in_trans]
print(f"\nSuffix stats for missing questions:")
print(f"  Suffixes range: {min(suffixes)} to {max(suffixes)}")
print(f"  Suffixes < 200: {sum(1 for s in suffixes if s < 200)}")
print(f"  Suffixes >= 200: {sum(1 for s in suffixes if s >= 200)}")
