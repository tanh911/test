"""
filter_klasse_b.py
------------------
Lọc raw_questions.json chỉ giữ lại các câu hỏi dành cho bằng lái Klasse B (ô tô con).

Quy tắc lọc dựa trên phần suffix (số sau dấu gạch ngang cuối):
  - suffix < 200  → Klasse B             → GIỮ LẠI
  - suffix 200-299 → Klasse C/D (xe tải/bus) → XÓA
  - suffix 300-399 → Klasse CE/DE (xe kéo) → XÓA
  - suffix >= 400 → Klasse T/Mofa        → XÓA

Output:
  - scripts/raw_questions_B.json  (chỉ câu Klasse B)
  - scripts/raw_questions.json    (giữ nguyên - không đụng vào)
"""

import json
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

INPUT_PATH  = "scripts/raw_questions.json"
OUTPUT_PATH = "scripts/raw_questions_B.json"

def get_suffix(id_str):
    """Trích phần số sau dấu gạch ngang cuối, bỏ qua đuôi -B/-M."""
    try:
        raw = str(id_str).split('-')
        # ID dạng: "1.2.03-045" hoặc "1.1.02-009-B" hoặc "1.3.01-016-M"
        # Suffix là phần số ngay sau dấu gạch ngang đầu tiên sau dấu chấm cuối
        # Tìm phần tử đầu tiên là số thuần (chỉ digits)
        for part in raw[1:]:
            cleaned = part.replace('B', '').replace('M', '').strip()
            if cleaned.isdigit():
                return int(cleaned)
        return 0
    except Exception:
        return 0

def is_klasse_b(question):
    """Trả về True nếu câu hỏi thuộc Klasse B."""
    suffix = get_suffix(question.get('id', ''))
    return suffix < 200

# Load
if not os.path.exists(INPUT_PATH):
    print(f"[!] File không tìm thấy: {INPUT_PATH}")
    sys.exit(1)

with open(INPUT_PATH, 'r', encoding='utf-8') as f:
    all_questions = json.load(f)

total = len(all_questions)
klasse_b = [q for q in all_questions if is_klasse_b(q)]
removed  = total - len(klasse_b)

print(f"Tổng câu hỏi gốc        : {total}")
print(f"Câu Klasse B (giữ lại)  : {len(klasse_b)}")
print(f"Câu bị loại (C/D/CE/T)  : {removed}")

# Save filtered
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(klasse_b, f, indent=2, ensure_ascii=False)

print(f"\nDa luu vao: {OUTPUT_PATH}")
print("File raw_questions.json goc KHONG bi thay doi.")
