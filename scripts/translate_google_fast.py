"""
translate_google_fast.py
------------------------
Dịch câu hỏi Führerschein Klasse B bằng Google Translate - phiên bản NHANH.

Tối ưu: gộp toàn bộ text của 1 batch câu hỏi vào 1 request duy nhất
        thay vì gọi API riêng lẻ từng trường → nhanh hơn 5-8x.

Cách chạy:
    python scripts/translate_google_fast.py
"""

import json, sys, time, os
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("[!] pip install deep-translator")
    sys.exit(1)

# ── Config ────────────────────────────────────────────────
RAW_PATH      = "scripts/raw_questions_B.json"
OUTPUT_PATH   = "src/data/questions_translated.json"
BATCH_SIZE    = 8    # Số câu hỏi mỗi batch (gộp text lại dịch 1 lần)
SEP           = " ¶¶¶ "   # Separator ngắn, ít bị dịch sai hơn \n||||\n
SAVE_EVERY    = 5    # Lưu file sau mỗi N batch
DELAY         = 0.1  # Delay nhỏ giữa các batch (giây)
MAX_WORKERS   = 3    # Số luồng song song
# ─────────────────────────────────────────────────────────

def tr_batch(texts: list[str]) -> list[str]:
    """Dịch nhiều đoạn text cùng 1 lần bằng cách gộp với separator."""
    if not texts:
        return []
    # Lọc text rỗng, đánh dấu vị trí
    indexed = [(i, t) for i, t in enumerate(texts) if t and t.strip()]
    if not indexed:
        return [""] * len(texts)

    combined = SEP.join(t for _, t in indexed)
    for attempt in range(3):
        try:
            result = GoogleTranslator(source='de', target='vi').translate(combined)
            if not result:
                raise ValueError("Empty result")
            parts = result.split(SEP.strip())
            # Nếu split sai độ dài, fallback dịch từng cái
            if len(parts) != len(indexed):
                parts = [GoogleTranslator(source='de', target='vi').translate(t) or t for _, t in indexed]
            # Điền lại vị trí
            out = [""] * len(texts)
            for (orig_idx, _), translated in zip(indexed, parts):
                out[orig_idx] = translated.strip() if translated else ""
            return out
        except Exception as e:
            if attempt < 2:
                time.sleep(1.5 * (attempt + 1))
            else:
                # Fallback: dịch từng cái
                out = [""] * len(texts)
                for orig_idx, t in indexed:
                    try:
                        out[orig_idx] = GoogleTranslator(source='de', target='vi').translate(t) or t
                    except:
                        out[orig_idx] = t
                return out

def translate_batch(raw_batch: list) -> list:
    """Dịch 1 batch câu hỏi: gộp tất cả text → 1 lần dịch → tách ra."""
    # Thu thập tất cả text cần dịch
    texts = []
    positions = []  # (q_idx, field, opt_idx_or_None)

    for q_idx, q in enumerate(raw_batch):
        # question text
        texts.append(q.get("textDe", ""))
        positions.append((q_idx, "textDe", None))

        # explanation
        texts.append(q.get("explanationDe", ""))
        positions.append((q_idx, "explanationDe", None))

        # options
        for opt_idx, opt in enumerate(q.get("options", [])):
            texts.append(opt.get("textDe", ""))
            positions.append((q_idx, "option", opt_idx))

    # Dịch 1 lần
    translated_texts = tr_batch(texts)

    # Reconstruct câu hỏi
    results = []
    temp = {}  # q_idx → partial data

    for pos_idx, (q_idx, field, opt_idx) in enumerate(positions):
        if q_idx not in temp:
            temp[q_idx] = {"textVi": "", "explanationVi": "", "opt_vis": {}}
        val = translated_texts[pos_idx] if pos_idx < len(translated_texts) else ""
        if field == "textDe":
            temp[q_idx]["textVi"] = val
        elif field == "explanationDe":
            temp[q_idx]["explanationVi"] = val
        elif field == "option":
            temp[q_idx]["opt_vis"][opt_idx] = val

    for q_idx, q in enumerate(raw_batch):
        t = temp.get(q_idx, {})
        opts = []
        for oi, opt in enumerate(q.get("options", [])):
            opts.append({
                "id":        opt.get("id"),
                "textDe":    opt.get("textDe", ""),
                "textVi":    t.get("opt_vis", {}).get(oi, ""),
                "isCorrect": opt.get("isCorrect", False),
            })
        results.append({
            "id":            q.get("id"),
            "category":      q.get("category", ""),
            "points":        q.get("points", 0),
            "image":         q.get("image"),
            "video":         q.get("video"),
            "textDe":        q.get("textDe", ""),
            "textVi":        t.get("textVi", ""),
            "options":       opts,
            "vocabulary":    [],
            "explanationDe": q.get("explanationDe", ""),
            "explanationVi": t.get("explanationVi", ""),
            "aiExplanation": "",
        })
    return results

# ── Load ──────────────────────────────────────────────────
with open(RAW_PATH, 'r', encoding='utf-8') as f:
    raw_questions = json.load(f)

translated_map = {}
if os.path.exists(OUTPUT_PATH):
    try:
        existing = json.load(open(OUTPUT_PATH, 'r', encoding='utf-8'))
        # Giữ lại câu đã có aiExplanation (từ Gemini/Groq) - không ghi đè
        for q in existing:
            translated_map[str(q["id"])] = q
    except: pass

to_translate = [q for q in raw_questions if str(q["id"]) not in translated_map]
already_done = len(raw_questions) - len(to_translate)

print(f"\n{'='*60}")
print(f"  GOOGLE TRANSLATE NHANH - FÜHRERSCHEIN KLASSE B")
print(f"{'='*60}")
print(f"  Đã có sẵn  : {already_done} câu")
print(f"  Cần dịch   : {len(to_translate)} câu")
print(f"  Batch size  : {BATCH_SIZE} câu/batch | Threads: {MAX_WORKERS}")
print(f"  Ước tính    : ~{len(to_translate) * BATCH_SIZE * 0.15 / 60:.0f} phút")
print(f"{'='*60}\n")

if not to_translate:
    print("[+] Tất cả đã được dịch!")
    sys.exit(0)

# ── Chia batches ──────────────────────────────────────────
batches = [to_translate[i:i+BATCH_SIZE] for i in range(0, len(to_translate), BATCH_SIZE)]
total_batches = len(batches)

# ── Chạy song song (MAX_WORKERS luồng) ────────────────────
session_start = time.time()
session_done  = 0
batch_counter = 0

def save():
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(list(translated_map.values()), f, indent=2, ensure_ascii=False)

with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = {executor.submit(translate_batch, batch): bi for bi, batch in enumerate(batches)}

    for future in as_completed(futures):
        bi = futures[future]
        batch_counter += 1
        try:
            results = future.result()
            for q in results:
                translated_map[str(q["id"])] = q
            session_done += len(results)

            # Progress
            done_overall = already_done + session_done
            elapsed = time.time() - session_start
            speed   = session_done / (elapsed / 60) if elapsed > 0 else 0
            eta     = (len(to_translate) - session_done) / speed if speed > 0 else 0
            pct     = done_overall / len(raw_questions) * 100
            bar_f   = int(28 * done_overall / len(raw_questions))
            bar     = '█' * bar_f + '░' * (28 - bar_f)

            print(f"[{done_overall}/{len(raw_questions)}] [{bar}] {pct:.1f}% | "
                  f"{speed:.0f} câu/phút | ETA {int(eta//60)}h{int(eta%60)}m")

            # Lưu định kỳ
            if batch_counter % SAVE_EVERY == 0:
                save()
                print(f"  [💾 Đã lưu {len(translated_map)} câu]")

        except Exception as e:
            print(f"  [!] Batch {bi+1} lỗi: {e}")

        time.sleep(DELAY)

# Lưu lần cuối
save()
total_elapsed = time.time() - session_start
print(f"\n{'='*60}")
print(f"  HOÀN THÀNH!")
print(f"  Tổng câu đã dịch : {len(translated_map)}")
print(f"  Thời gian        : {int(total_elapsed//3600)}h {int((total_elapsed%3600)//60)}m {int(total_elapsed%60)}s")
print(f"  Tốc độ trung bình: {session_done / (total_elapsed/60):.0f} câu/phút")
print(f"{'='*60}")
