import os
import sys
import json
import time
import urllib.request
import urllib.error
import argparse

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
RAW_QUESTIONS_PATH = "scripts/raw_questions.json"
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

# Gemini API configuration
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

def call_gemini(prompt):
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    
    # Retry logic
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["candidates"][0]["content"]["parts"][0]["text"]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait_time = (attempt + 1) * 10
                print(f"\n[!] Rate limit reached (429). Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"\n[!] HTTP Error {e.code}: {e.read().decode('utf-8')}")
                raise e
        except Exception as e:
            print(f"\n[!] Error during API request: {e}")
            time.sleep(5)
    raise Exception("API Request failed after multiple attempts")

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

print(f"\n[*] Starting translation of {len(to_translate)} questions in {total_batches} batches...")

for i in range(total_batches):
    batch = to_translate[i * batch_size : (i + 1) * batch_size]
    print(f"\n[+] Batch {i+1}/{total_batches} (Translating {len(batch)} questions: {[q['id'] for q in batch]})")
    
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
        print(f"[+] Batch {i+1} completed successfully in {elapsed:.2f}s! Progress saved.")
        
        # Sleep to avoid rate limits (10 RPM safety buffer)
        sleep_time = max(1.0, 6.0 - elapsed)
        time.sleep(sleep_time)
        
    except Exception as e:
        print(f"[!] FAILED to translate batch {i+1}: {e}")
        print("Skipping this batch to continue with others. You can rerun the script to translate missed items.")
        time.sleep(10)

print(f"\n[+] Translation process finished. Total translated questions: {len(translated_questions)}")
print(f"Output saved to {OUTPUT_QUESTIONS_PATH}")
