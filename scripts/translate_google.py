"""
translate_google.py
-------------------
Dịch câu hỏi Führerschein Klasse B bằng Google Translate (MIỄN PHÍ, không cần API key).
Sử dụng thư viện: deep-translator (pip install deep-translator)

Tốc độ: ~60-100 câu/phút
Hạn chế: vocabulary và aiExplanation để trống (không sinh được bằng Google Translate)
         -> Chạy translate_questions.py sau để bổ sung nếu có API key

Cách chạy:
    python scripts/translate_google.py
"""

import json
import sys
import time
import os

sys.stdout.reconfigure(encoding='utf-8')

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("[!] Chưa cài deep-translator. Chạy: pip install deep-translator")
    sys.exit(1)

# ── Cấu hình ──────────────────────────────────────────────
RAW_PATH    = "scripts/raw_questions_B.json"
OUTPUT_PATH = "src/data/questions_translated.json"
BATCH_SAVE  = 20   # Lưu file sau mỗi N câu
DELAY_SEC   = 0.3  # Delay giữa các lần dịch (tránh ban IP)
# ─────────────────────────────────────────────────────────

translator = GoogleTranslator(source='de', target='vi')

def tr(text):
    """Dịch một đoạn văn bản De → Vi, có retry."""
    if not text or not isinstance(text, str):
        return ""
    text = text.strip()
    if not text:
        return ""
    for attempt in range(3):
        try:
            result = translator.translate(text)
            time.sleep(DELAY_SEC)
            return result or text
        except Exception as e:
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
            else:
                print(f"    [!] Lỗi dịch: {e} | Giữ nguyên text gốc.")
                return text

def translate_question(raw_q):
    """Tạo câu hỏi đã dịch từ câu hỏi gốc tiếng Đức."""
    q = {
        "id":            raw_q.get("id"),
        "category":      raw_q.get("category", ""),
        "points":        raw_q.get("points", 0),
        "image":         raw_q.get("image"),
        "video":         raw_q.get("video"),
        "textDe":        raw_q.get("textDe", ""),
        "textVi":        tr(raw_q.get("textDe", "")),
        "options":       [],
        "vocabulary":    [],           # Để trống - Google Translate không sinh được
        "explanationDe": raw_q.get("explanationDe", ""),
        "explanationVi": tr(raw_q.get("explanationDe", "")),
        "aiExplanation": "",           # Để trống - cần Gemini để sinh
    }

    for opt in raw_q.get("options", []):
        q["options"].append({
            "id":        opt.get("id"),
            "textDe":    opt.get("textDe", ""),
            "textVi":    tr(opt.get("textDe", "")),
            "isCorrect": opt.get("isCorrect", False),
        })

    return q

# ── Load dữ liệu ──────────────────────────────────────────
if not os.path.exists(RAW_PATH):
    print(f"[!] Không tìm thấy: {RAW_PATH}")
    sys.exit(1)

with open(RAW_PATH, 'r', encoding='utf-8') as f:
    raw_questions = json.load(f)

# Load progress
translated_map = {}
if os.path.exists(OUTPUT_PATH):
    try:
        existing = json.load(open(OUTPUT_PATH, 'r', encoding='utf-8'))
        translated_map = {str(q["id"]): q for q in existing}
        print(f"[*] Đã có sẵn: {len(translated_map)} câu")
    except Exception as e:
        print(f"[*] Không đọc được file cũ: {e}")

to_translate = [q for q in raw_questions if str(q["id"]) not in translated_map]
total        = len(raw_questions)
remaining    = len(to_translate)
already_done = total - remaining

print(f"\n{'='*60}")
print(f"  DỊCH TỰ ĐỘNG - GOOGLE TRANSLATE (FREE)")
print(f"{'='*60}")
print(f"  Đã có sẵn : {already_done} câu")
print(f"  Cần dịch  : {remaining} câu")
print(f"  Tổng      : {total} câu")
print(f"{'='*60}\n")

if not to_translate:
    print("[+] Tất cả đã được dịch!")
    sys.exit(0)

# ── Dịch từng câu ─────────────────────────────────────────
start_time   = time.time()
session_done = 0

for i, raw_q in enumerate(to_translate):
    qid = str(raw_q.get("id", ""))
    done_overall = already_done + session_done + 1
    pct = done_overall / total * 100

    # Progress bar
    bar_len = 28
    filled  = int(bar_len * done_overall / total)
    bar     = '█' * filled + '░' * (bar_len - filled)

    elapsed = time.time() - start_time
    speed   = (session_done + 1) / (elapsed / 60) if elapsed > 0 else 0
    eta_min = (remaining - session_done - 1) / speed if speed > 0 else 0
    eta_h   = int(eta_min // 60)
    eta_m   = int(eta_min % 60)

    print(f"[{done_overall}/{total}] [{bar}] {pct:.1f}% | {qid}", end='  ')

    try:
        translated = translate_question(raw_q)
        translated_map[qid] = translated
        session_done += 1
        print(f"✓ | {speed:.0f} câu/phút | ETA {eta_h}h{eta_m}m")
    except Exception as e:
        print(f"✗ LỖI: {e}")

    # Lưu định kỳ
    if session_done % BATCH_SAVE == 0:
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(list(translated_map.values()), f, indent=2, ensure_ascii=False)
        print(f"    [💾 Đã lưu {len(translated_map)} câu vào file]")

# Lưu lần cuối
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(list(translated_map.values()), f, indent=2, ensure_ascii=False)

total_elapsed = time.time() - start_time
print(f"\n{'='*60}")
print(f"  HOÀN THÀNH!")
print(f"  Tổng câu đã dịch : {len(translated_map)}")
print(f"  Thời gian        : {int(total_elapsed//3600)}h {int((total_elapsed%3600)//60)}m")
print(f"  File output      : {OUTPUT_PATH}")
print(f"{'='*60}")
