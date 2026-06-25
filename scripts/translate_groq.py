"""
translate_groq.py
-----------------
Dịch câu hỏi Führerschein Klasse B bằng Groq API (MIỄN PHÍ, rất nhanh).
Sinh đầy đủ: textVi, options, vocabulary, explanationVi, aiExplanation

Rate limit Groq free: 30 RPM / 14400 RPD
Models sử dụng (xoay vòng khi bị limit):
  - llama-3.3-70b-versatile  (chất lượng cao nhất)
  - llama-3.1-8b-instant     (nhanh nhất, TPM cao)
  - gemma2-9b-it             (backup)

Cách chạy:
    python scripts/translate_groq.py --api-key gsk_...
    hoặc set env: GROQ_API_KEY=gsk_...
"""

import os, sys, json, time, argparse, urllib.request, urllib.error

sys.stdout.reconfigure(encoding='utf-8')

parser = argparse.ArgumentParser()
parser.add_argument("--api-key",    help="Groq API key")
parser.add_argument("--batch-size", type=int, default=10, help="Câu/batch (default 10)")
args = parser.parse_args()

api_key = args.api_key or os.environ.get("GROQ_API_KEY")
if not api_key:
    print("[!] Cần Groq API key: --api-key gsk_...")
    sys.exit(1)

RAW_PATH    = "scripts/raw_questions_B.json"
OUTPUT_PATH = "src/data/questions_translated.json"
BACKUP_PATH = "src/data/questions_translated.bak.json"

# ── Groq models xoay vòng ─────────────────────────────────
MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "llama-3.3-70b-versatile",  # thêm lần 2 để ưu tiên hơn
]
model_idx = 0

def call_groq(prompt):
    global model_idx
    payload = {
        "model":       MODELS[model_idx % len(MODELS)],
        "messages":    [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "max_tokens":  4096,
    }
    data = json.dumps(payload).encode("utf-8")

    for attempt in range(len(MODELS) * 2):
        model = MODELS[model_idx % len(MODELS)]
        payload["model"] = model
        data = json.dumps(payload).encode("utf-8")
        req  = urllib.request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=data,
            headers={
                "Content-Type":   "application/json",
                "Authorization":  f"Bearer {api_key}",
                "User-Agent":     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "Accept":         "application/json",
                "Accept-Language":"en-US,en;q=0.9",
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                return res["choices"][0]["message"]["content"]

        except urllib.error.HTTPError as e:
            body = ""
            try: body = e.read().decode("utf-8")[:300]
            except: pass

            if e.code == 429:
                wait = 20 * (attempt % 2 + 1)
                print(f"\n  [!] {model} → 429. Chờ {wait}s, thử model khác...")
                time.sleep(wait)
                model_idx += 1
                print(f"  [>] Chuyển sang: {MODELS[model_idx % len(MODELS)]}")
            elif e.code in (503, 502):
                print(f"\n  [!] {model} → {e.code}. Chờ 10s...")
                time.sleep(10)
                model_idx += 1
            else:
                print(f"\n  [!] {model} → HTTP {e.code}: {body}")
                raise e
        except Exception as e:
            print(f"\n  [!] {model} → {type(e).__name__}: {e}. Chờ 5s...")
            time.sleep(5)
            model_idx += 1

    raise Exception("Tất cả models đều thất bại.")

# ── Load dữ liệu ──────────────────────────────────────────
with open(RAW_PATH, 'r', encoding='utf-8') as f:
    raw_questions = json.load(f)
raw_map = {str(q["id"]): q for q in raw_questions}

translated_map = {}
if os.path.exists(OUTPUT_PATH):
    try:
        existing = json.load(open(OUTPUT_PATH, 'r', encoding='utf-8'))
        translated_map = {str(q["id"]): q for q in existing}
    except: pass

# Câu cần dịch: chưa có HOẶC thiếu aiExplanation (từ Google Translate)
def needs_translation(qid):
    if qid not in translated_map:
        return True
    q = translated_map[qid]
    return not q.get("aiExplanation") or not q.get("vocabulary")

to_translate = [q for q in raw_questions if needs_translation(str(q["id"]))]
already_full = len(raw_questions) - len(to_translate)

print(f"\n{'='*62}")
print(f"  DỊCH TỰ ĐỘNG GROQ - FÜHRERSCHEIN KLASSE B")
print(f"{'='*62}")
print(f"  Đã đầy đủ (Gemini/Groq) : {already_full} câu  ✅")
print(f"  Cần dịch / bổ sung      : {len(to_translate)} câu")
print(f"  Tổng                    : {len(raw_questions)} câu")
print(f"  Batch size              : {args.batch_size} câu")
print(f"{'='*62}\n")

if not to_translate:
    print("[+] Tất cả đã được dịch đầy đủ!")
    sys.exit(0)

# ── Prompt template ───────────────────────────────────────
def make_prompt(batch):
    q_data = []
    for q in batch:
        q_data.append({
            "id":           q["id"],
            "category":     q.get("category", ""),
            "points":       q.get("points", 0),
            "textDe":       q.get("textDe", ""),
            "options":      q.get("options", []),
            "explanationDe": q.get("explanationDe", ""),
        })

    return f"""Bạn là chuyên gia dịch thuật và đào tạo lý thuyết lái xe Đức - Việt.
Dịch danh sách câu hỏi sau sang tiếng Việt.

Yêu cầu:
1. "textVi": Dịch câu hỏi sang tiếng Việt rõ ràng, đúng thuật ngữ luật giao thông Đức.
2. "options": Dịch textDe của mỗi option sang textVi. Giữ nguyên id, textDe, isCorrect.
3. "explanationVi": Dịch explanationDe sang tiếng Việt chuyên nghiệp.
4. "vocabulary": Trích 3-4 từ tiếng Đức quan trọng kèm nghĩa tiếng Việt. [{{"de":"...","vi":"..."}}]
5. "aiExplanation": Giải thích thân thiện ~4-5 câu bằng tiếng Việt như giáo viên dạy học: tại sao đáp án đúng, tại sao các đáp án khác sai, mẹo ghi nhớ.

Dữ liệu đầu vào:
{json.dumps(q_data, ensure_ascii=False, indent=2)}

Trả về JSON object với key "questions" là mảng kết quả:
{{
  "questions": [
    {{
      "id": "...",
      "category": "...",
      "points": ...,
      "textDe": "...",
      "textVi": "...",
      "options": [{{"id":"A","textDe":"...","textVi":"...","isCorrect":true}}],
      "vocabulary": [{{"de":"...","vi":"..."}}],
      "explanationDe": "...",
      "explanationVi": "...",
      "aiExplanation": "..."
    }}
  ]
}}"""

def save():
    if os.path.exists(OUTPUT_PATH):
        try: os.replace(OUTPUT_PATH, BACKUP_PATH)
        except: pass
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(list(translated_map.values()), f, indent=2, ensure_ascii=False)

# ── Batch loop ────────────────────────────────────────────
batch_size   = args.batch_size
total_batches = (len(to_translate) + batch_size - 1) // batch_size
session_done  = 0
session_start = time.time()

for i in range(total_batches):
    batch = to_translate[i * batch_size:(i + 1) * batch_size]
    done_overall = already_full + session_done
    pct  = done_overall / len(raw_questions) * 100
    bar  = '█' * int(28 * done_overall / len(raw_questions)) + '░' * (28 - int(28 * done_overall / len(raw_questions)))
    elapsed = time.time() - session_start
    speed = session_done / (elapsed / 60) if elapsed > 0 else 0
    eta   = (len(to_translate) - session_done) / speed if speed > 0 else 0

    print(f"\n[Batch {i+1}/{total_batches}] [{bar}] {pct:.1f}% | {done_overall}/{len(raw_questions)} câu", end="")
    if speed > 0:
        print(f" | {speed:.0f} câu/phút | ETA {int(eta//60)}h{int(eta%60)}m")
    else:
        print()

    print(f"  Đang dịch: {batch[0]['id']} → {batch[-1]['id']}")

    try:
        start = time.time()
        prompt = make_prompt(batch)
        raw_resp = call_groq(prompt)

        # Parse JSON
        resp_json = json.loads(raw_resp)
        translated_batch = resp_json.get("questions", resp_json if isinstance(resp_json, list) else [])

        for t_q in translated_batch:
            qid = str(t_q["id"])
            orig = raw_map.get(qid, {})
            t_q["image"] = orig.get("image")
            t_q["video"] = orig.get("video")
            translated_map[qid] = t_q

        session_done += len(translated_batch)
        save()
        elapsed_batch = time.time() - start
        print(f"  ✅ {len(translated_batch)} câu xong trong {elapsed_batch:.1f}s | Đã lưu {len(translated_map)} câu")

        # Rate limit buffer: 30 RPM → tối thiểu 2s/request
        sleep = max(2.0, 6.0 - elapsed_batch)
        time.sleep(sleep)

    except Exception as e:
        print(f"  ❌ Batch {i+1} thất bại: {e}")
        print("     Bỏ qua, tiếp tục batch sau.")
        time.sleep(10)

total_elapsed = time.time() - session_start
print(f"\n{'='*62}")
print(f"  HOÀN THÀNH!")
print(f"  Tổng câu đã dịch : {len(translated_map)}")
print(f"  Thời gian        : {int(total_elapsed//3600)}h {int((total_elapsed%3600)//60)}m {int(total_elapsed%60)}s")
print(f"  File             : {OUTPUT_PATH}")
print(f"{'='*62}")
