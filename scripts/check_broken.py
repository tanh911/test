"""
Fix 8 câu hỏi có options không có textDe/textVi (câu hỏi nhận biết biển báo bằng hình ảnh).
Điền placeholder để app không bị lỗi hiển thị.
"""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')

PATH = 'src/data/questions_translated.json'
data = json.load(open(PATH, 'r', encoding='utf-8'))

fixed = 0
for q in data:
    opts = q.get('options', [])
    if not all(o.get('textVi', '').strip() for o in opts):
        for o in opts:
            if not o.get('textVi', '').strip():
                o['textVi'] = f"Phương án {o.get('id', '')}"
            if not o.get('textDe', '').strip():
                o['textDe'] = f"Option {o.get('id', '')}"
        fixed += 1
        print(f"Fixed: {q['id']}")

with open(PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\nDa sua {fixed} cau. File da luu.")
