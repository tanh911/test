import os
import sys
import json
import time
import urllib.request
import urllib.error
import argparse

sys.stdout.reconfigure(encoding='utf-8')

# Parse arguments
parser = argparse.ArgumentParser(description="Translate driving questions using Gemini API")
parser.add_argument("--api-key", help="Gemini API Key (can also be set via GEMINI_API_KEY env var)")
parser.add_argument("--batch-size", type=int, default=15, help="Number of questions per batch")
parser.add_argument("--limit", type=int, default=0, help="Limit number of questions to translate (0 for all)")
args = parser.parse_args()

# Retrieve API Key
api_key = args.api_key or os.environ.get("GEMINI_API_KEY")

if not api_key:
    print("\n[!] ERROR: Gemini API Key is required.")
    print("Please obtain a free API key from Google AI Studio (https://aistudio.google.com/)")
    print("Then run this script with: python scripts/translate_questions.py --api-key YOUR_API_KEY\n")
    sys.exit(1)

# Files
RAW_QUESTIONS_PATH = "scripts/raw_questions_B.json"  # Chỉ câu Klasse B (lọc bởi filter_klasse_b.py)
OUTPUT_QUESTIONS_PATH = "src/data/questions_translated.json"
BACKUP_PATH = "src/data/questions_translated.bak.json"

# Load raw questions
if not os.path.exists(RAW_QUESTIONS_PATH):
    print(f"[!] ERROR: Raw questions file not found at {RAW_QUESTIONS_PATH}.")
    print("Please run `python scripts/parse_csv_to_raw_json.py` first.")
    sys.exit(1)

with open(RAW_QUESTIONS_PATH, "r", encoding="utf-8") as f:
    raw_questions = json.load(f)

# Load existing progress
translated_questions = {}
if os.path.exists(OUTPUT_QUESTIONS_PATH):
    try:
        with open(OUTPUT_QUESTIONS_PATH, "r", encoding="utf-8") as f:
            existing_list = json.load(f)
            # Support list or dict
            if isinstance(existing_list, list):
                translated_questions = {q["id"]: q for q in existing_list}
            elif isinstance(existing_list, dict):
                translated_questions = existing_list
            print(f"[*] Found {len(translated_questions)} already translated questions.")
    except Exception as e:
        print(f"[*] Could not load existing translation file: {e}. Starting fresh.")

# Filter questions to translate
to_translate = [q for q in raw_questions if q["id"] not in translated_questions]
if args.limit > 0:
    to_translate = to_translate[:args.limit]

print(f"[*] Total questions in catalog: {len(raw_questions)}")
print(f"[*] Questions already translated: {len(translated_questions)}")
print(f"[*] Questions remaining to translate: {len(to_translate)}")

if not to_translate:
    print("[+] All questions are already translated!")
    sys.exit(0)

# Gemini models - xoay vòng khi bị rate limit / 503
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
]
current_model_idx = 0

def get_api_url(model):
    return f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

def call_gemini(prompt):
    global current_model_idx
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }
    data = json.dumps(payload).encode("utf-8")

    # Thử tối đa 3 vòng xoay model × 2 lần retry mỗi model
    total_attempts = len(GEMINI_MODELS) * 2
    for attempt in range(total_attempts):
        model = GEMINI_MODELS[current_model_idx % len(GEMINI_MODELS)]
        url   = get_api_url(model)
        req   = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["candidates"][0]["content"]["parts"][0]["text"]

        except urllib.error.HTTPError as e:
            err_body = ""
            try: err_body = e.read().decode("utf-8")[:200]
            except: pass

            if e.code == 429:
                wait_time = 15 * (attempt % 2 + 1)
                print(f"\n  [!] {model} → 429 Rate limit. Chờ {wait_time}s rồi thử model khác...")
                time.sleep(wait_time)
                current_model_idx += 1  # chuyển model
                print(f"  [>] Chuyển sang: {GEMINI_MODELS[current_model_idx % len(GEMINI_MODELS)]}")

            elif e.code == 503:
                wait_time = 10
                print(f"\n  [!] {model} → 503 Unavailable. Chờ {wait_time}s rồi thử model khác...")
                time.sleep(wait_time)
                current_model_idx += 1
                print(f"  [>] Chuyển sang: {GEMINI_MODELS[current_model_idx % len(GEMINI_MODELS)]}")

            else:
                print(f"\n  [!] {model} → HTTP {e.code}: {err_body}")
                raise e

        except Exception as e:
            print(f"\n  [!] {model} → Lỗi kết nối: {type(e).__name__}. Thử lại sau 5s...")
            time.sleep(5)
            current_model_idx += 1

    raise Exception(f"Tất cả {len(GEMINI_MODELS)} models đều thất bại sau {total_attempts} lần thử.")

def save_progress():
    # Save a backup first
    if os.path.exists(OUTPUT_QUESTIONS_PATH):
        try:
            os.replace(OUTPUT_QUESTIONS_PATH, BACKUP_PATH)
        except Exception:
            pass
            
    # Save active list
    with open(OUTPUT_QUESTIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(list(translated_questions.values()), f, indent=2, ensure_ascii=False)

# Batch processing
batch_size = args.batch_size
total_batches = (len(to_translate) + batch_size - 1) // batch_size
total_to_do   = len(to_translate)
already_done  = len(translated_questions)
total_overall = already_done + total_to_do

def print_progress(done_so_far, total, elapsed_session, session_count):
    pct = done_so_far / total * 100 if total > 0 else 0
    bar_len = 30
    filled = int(bar_len * done_so_far / total) if total > 0 else 0
    bar = '█' * filled + '░' * (bar_len - filled)
    speed = session_count / (elapsed_session / 60) if elapsed_session > 0 else 0
    remaining = total_to_do - session_count
    eta_min = remaining / speed if speed > 0 else 0
    eta_h = int(eta_min // 60)
    eta_m = int(eta_min % 60)
    print(f"  [{bar}] {pct:.1f}%  |  {done_so_far}/{total} câu  |  {speed:.1f} câu/phút  |  ETA: {eta_h}h {eta_m}m")

print(f"\n{'='*60}")
print(f"  DỊCH TỰ ĐỘNG KLASSE B - FÜHRERSCHEIN")
print(f"{'='*60}")
print(f"  Đã có sẵn : {already_done} câu")
print(f"  Cần dịch  : {total_to_do} câu")
print(f"  Tổng      : {total_overall} câu")
print(f"  Số batch  : {total_batches} (mỗi batch {batch_size} câu)")
print(f"{'='*60}\n")

session_start   = time.time()
session_done    = 0

for i in range(total_batches):
    batch = to_translate[i * batch_size : (i + 1) * batch_size]
    done_overall = already_done + session_done
    print(f"\n[Batch {i+1}/{total_batches}] Đang dịch {len(batch)} câu: {batch[0]['id']} → {batch[-1]['id']}") 
    # Prepare batch data (strip unnecessary fields to save tokens)
    prompt_data = []
    for q in batch:
        prompt_data.append({
            "id": q["id"],
            "category": q["category"],
            "points": q["points"],
            "textDe": q["textDe"],
            "options": q["options"],
            "explanationDe": q["explanationDe"]
        })
        
    prompt = f"""
Bạn là một chuyên gia dịch thuật và đào tạo bằng lái xe Đức - Việt.
Nhiệm vụ của bạn là dịch danh sách các câu hỏi lý thuyết lái xe của Đức sang tiếng Việt.

Yêu cầu dịch:
1. "textVi": Dịch câu hỏi (textDe) sang tiếng Việt rõ ràng, dễ hiểu, chính xác theo thuật ngữ luật giao thông đường bộ Đức.
2. "options": Dịch phần textDe của từng phương án lựa chọn sang tiếng Việt và gán vào trường "textVi" tương ứng. Giữ nguyên "id", "textDe", và "isCorrect" cho từng lựa chọn.
3. "explanationVi": Dịch phần giải thích luật giao thông (explanationDe) sang tiếng Việt một cách khoa học, chuyên nghiệp.
4. "vocabulary": Trích xuất 3-4 từ vựng tiếng Đức cốt lõi trong câu (hoặc đáp án) kèm theo nghĩa tiếng Việt phù hợp ngữ cảnh giao thông. Định dạng: [{{"de": "...", "vi": "..."}}].
5. "aiExplanation": Viết một đoạn văn giải thích ngắn gọn, thân thiện (khoảng 3-4 câu) bằng tiếng Việt giống như một giáo viên giảng bài trực tiếp. Giải thích rõ tại sao đáp án đúng lại đúng, tại sao các đáp án khác lại sai, và đưa ra mẹo ghi nhớ cho học viên.

Dưới đây là danh sách câu hỏi cần dịch (định dạng JSON):
{json.dumps(prompt_data, ensure_ascii=False, indent=2)}

Hãy trả về kết quả dưới dạng một mảng JSON duy nhất chứa đầy đủ các câu hỏi đã dịch với cấu trúc sau:
[
  {{
    "id": "mã câu hỏi gốc",
    "category": "dịch tên chuyên mục sang tiếng Việt nếu cần, hoặc giữ nguyên",
    "points": số điểm phạt,
    "textDe": "câu hỏi tiếng Đức gốc",
    "textVi": "câu hỏi dịch tiếng Việt",
    "options": [
      {{
        "id": "A",
        "textDe": "tiếng Đức gốc",
        "textVi": "tiếng Việt dịch",
        "isCorrect": true/false
      }}
    ],
    "vocabulary": [
      {{"de": "từ tiếng Đức", "vi": "nghĩa tiếng Việt"}}
    ],
    "explanationDe": "giải thích tiếng Đức gốc",
    "explanationVi": "giải thích tiếng Việt",
    "aiExplanation": "đoạn giải thích thân thiện tiếng Việt"
  }}
]
    """
    
    try:
        start_time = time.time()
        response_text = call_gemini(prompt)
        
        # Clean up any potential markdown code blocks returned by Gemini
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse output
        translated_batch = json.loads(response_text)
        
        # Save to main list
        for t_q in translated_batch:
            q_id = t_q["id"]
            # Remerge image/video from raw question
            original = next((q for q in batch if q["id"] == q_id), None)
            if original:
                t_q["image"] = original["image"]
                t_q["video"] = original["video"]
            
            translated_questions[q_id] = t_q
            
        save_progress()
        elapsed = time.time() - start_time
        session_done += len(translated_batch)
        elapsed_session = time.time() - session_start
        done_overall = already_done + session_done

        print(f"[+] Batch {i+1} xong trong {elapsed:.1f}s | Đã lưu {done_overall} câu")
        print_progress(done_overall, total_overall, elapsed_session, session_done)

        # Sleep to avoid rate limits
        sleep_time = max(1.0, 6.0 - elapsed)
        print(f"    Chờ {sleep_time:.1f}s trước batch tiếp theo...")
        time.sleep(sleep_time)

    except Exception as e:
        print(f"[!] FAILED batch {i+1}: {e}")
        print("    Bỏ qua batch này, tiếp tục. Chạy lại script để dịch bù.")
        time.sleep(10)

total_elapsed = time.time() - session_start
print(f"\n{'='*60}")
print(f"  HOÀN THÀNH!")
print(f"  Tổng câu đã dịch : {len(translated_questions)}")
print(f"  Thời gian session: {int(total_elapsed//3600)}h {int((total_elapsed%3600)//60)}m {int(total_elapsed%60)}s")
print(f"  File output      : {OUTPUT_QUESTIONS_PATH}")
print(f"{'='*60}")
