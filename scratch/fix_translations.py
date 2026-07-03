import json
import re

file_path = 'src/data/questions_klasse_b.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Words to search for: 'phân loại', 'phù hợp', 'sắp xếp', 'lùi về', 'xếp hàng'
keywords = ['phân loại', 'phù hợp', 'sắp xếp', 'lùi về', 'xếp hàng']

matches = []
for q in data:
    found = False
    details = []
    
    # Check textVi
    text_vi = q.get('textVi', '')
    for kw in keywords:
        if kw in text_vi.lower():
            found = True
            details.append(('textVi', kw, text_vi))
            
    # Check options textVi
    for opt in q.get('options', []):
        opt_vi = opt.get('textVi', '')
        for kw in keywords:
            if kw in opt_vi.lower():
                found = True
                details.append((f"option {opt['id']}", kw, opt_vi))
                
    # Check explanationVi
    exp_vi = q.get('explanationVi', '')
    for kw in keywords:
        if kw in exp_vi.lower():
            pass
            
    if found:
        matches.append({
            'id': q['id'],
            'textDe': q['textDe'],
            'textVi': q['textVi'],
            'details': details
        })

out_path = 'scratch/fix_translations_output.txt'
with open(out_path, 'w', encoding='utf-8') as out:
    out.write(f"Found {len(matches)} questions with potential translation issues.\n")
    for m in matches:
        out.write(f"\nID: {m['id']}\n")
        out.write(f"DE: {m['textDe']}\n")
        out.write(f"VI: {m['textVi']}\n")
        for field, kw, text in m['details']:
            out.write(f"  [{field}] contains '{kw}': {text}\n")
print(f"Done. Wrote results to {out_path}")
