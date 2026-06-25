"""
fix_encoding.py
---------------
Sửa lỗi Mojibake (UTF-8 bị đọc nhầm thành Latin-1/CP1252) trong các file JSON.

Triệu chứng: "StraÃŸenverkehr" thay vì "Straßenverkehr"
Nguyên nhân: bytes UTF-8 của ký tự Đức (ä,ö,ü,ß,...) bị giải mã sai thành Latin-1
Cách sửa:   encode chuỗi lại thành latin-1 rồi decode thành utf-8

Files sẽ được sửa:
  - scripts/raw_questions_B.json
  - src/data/questions_translated.json (nếu có lỗi)
"""

import json
import sys
import os
import copy

sys.stdout.reconfigure(encoding='utf-8')

def fix_mojibake(text):
    """Sửa chuỗi bị lỗi Mojibake: latin-1 → utf-8."""
    if not isinstance(text, str):
        return text
    if 'Ã' not in text and 'â' not in text:
        return text  # Không bị lỗi, bỏ qua
    try:
        return text.encode('latin-1').decode('utf-8')
    except (UnicodeDecodeError, UnicodeEncodeError):
        return text  # Không sửa được, giữ nguyên

def fix_question(q):
    """Sửa tất cả các trường text trong một câu hỏi."""
    q = copy.deepcopy(q)
    
    # Các trường text cấp cao
    for field in ['textDe', 'textVi', 'explanationDe', 'explanationVi', 'aiExplanation', 'category']:
        if field in q:
            q[field] = fix_mojibake(q[field])
    
    # Các trường trong options
    if 'options' in q and isinstance(q['options'], list):
        for opt in q['options']:
            for field in ['textDe', 'textVi']:
                if field in opt:
                    opt[field] = fix_mojibake(opt[field])
    
    # Vocabulary
    if 'vocabulary' in q and isinstance(q['vocabulary'], list):
        for voc in q['vocabulary']:
            for field in ['de', 'vi']:
                if field in voc:
                    voc[field] = fix_mojibake(voc[field])
    
    return q

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"[!] File không tìm thấy: {filepath}, bỏ qua.")
        return
    
    print(f"\n[*] Đang xử lý: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    fixed_count = 0
    fixed_data = []
    for q in data:
        fixed_q = fix_question(q)
        if fixed_q != q:
            fixed_count += 1
        fixed_data.append(fixed_q)
    
    # Backup
    backup_path = filepath + '.encoding_backup'
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    # Save fixed
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(fixed_data, f, indent=2, ensure_ascii=False)
    
    print(f"[+] Đã sửa {fixed_count}/{len(fixed_data)} câu hỏi")
    print(f"[+] Backup lưu tại: {backup_path}")

# Fix cả hai file
fix_file("scripts/raw_questions_B.json")
fix_file("src/data/questions_translated.json")

# Verify
print("\n[*] Kiểm tra kết quả...")
data = json.load(open('scripts/raw_questions_B.json', 'r', encoding='utf-8'))
still_broken = [q['id'] for q in data if 'Ã' in q.get('textDe', '') or 'Ã' in q.get('explanationDe', '')]
print(f"[{'OK' if not still_broken else 'WARN'}] Câu còn lỗi sau khi sửa: {len(still_broken)}")
if still_broken:
    print("  Samples:", still_broken[:5])
else:
    print("[+] Tất cả ký tự tiếng Đức đã được khôi phục đúng!")

# Show sample fixed
sample = data[1]  # câu index 1 thường là câu bị lỗi
print(f"\n[*] Mẫu câu đã sửa (id={sample['id']}):")
print(f"    textDe: {sample.get('textDe', '')[:100]}")
