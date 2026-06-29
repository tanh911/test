import json
import re
import sys
import urllib.request
import csv
import io
import time

sys.stdout.reconfigure(encoding='utf-8')

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("[!] ERROR: deep-translator is not installed.")
    sys.exit(1)

# Paths
TRANSLATED_INPUT_PATH = "src/data/questions_translated.json"
OUTPUT_PATH = "src/data/questions_klasse_b.json"

# Load existing translations
print("Loading existing translations...")
try:
    with open(TRANSLATED_INPUT_PATH, "r", encoding="utf-8") as f:
        existing_list = json.load(f)
        translated_map = {str(q["id"]): q for q in existing_list}
    print(f"Loaded {len(translated_map)} translated questions.")
except Exception as e:
    print(f"Error loading {TRANSLATED_INPUT_PATH}: {e}")
    sys.exit(1)

# Download CSV
url = 'https://raw.githubusercontent.com/yowmamasita/driving-theory/main/driving_theory_questions_de.csv'
print("Downloading source CSV...")
response = urllib.request.urlopen(url)
csv_content = response.read().decode('latin-1')

print("Parsing CSV...")
reader = csv.DictReader(io.StringIO(csv_content))
rows = list(reader)
print(f"Total rows in CSV: {len(rows)}")

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

def is_motorcycle_only(q_id, text, options_str):
    if not q_id.startswith('2.'):
        return False  # Keep all Grundstoff (1.x)
        
    t = (text + ' ' + options_str).lower()
    
    A_patterns = [
        # Pronoun + (optional adjective) + vehicle noun
        r'\b(?:ihr|sein)(?:em|es|en|er|e)?\b(?:\s+[a-zäöüß]+){0,2}\s+(?:motorrad|kraftrad|zweirad|mofa|gespann)',
        
        # Self-driving / rider role
        r'\bals kraftradfahrer',
        r'\bals motorradfahrer',
        r'\bals zweiradfahrer',
        r'\bals mofafahrer',
        r'\bmit\s+(?:einem|ihrem|seinem)\s+(?:motorrad|kraftrad|zweirad|mofa)',
        r'\bein\s+(?:motorrad|kraftrad|zweirad|mofa)\s+fahren',
        r'\bein\s+mofa\s+führen',
        
        # Motorcycle-only components / actions
        r'\baufbocken eines motorrads',
        r'\bmittelständer\b',
        r'\bseitenständer\b',
        r'\blenkkopflager\b',
        r'\bnot-aus-schalter\b',
        r'\bsozius',
        r'\bbeiwagen\b',
        r'\bkettenantrieb\b',
        r'\briemenantrieb\b',
        r'\bpacktaschen\b',
        r'\bmotorradkoffer\b',
        r'\bhelmpflicht\b',
        r'\bschutzkleidung\b',
        r'\bschutzhelm',
        r'\bschutzhelme',
        r'\bsoziusfahrer',
        
        # Specific motorcycle tech questions
        r'\bbremshebel\b.*\bdruckpunkt\b',
        r'\bhebelweg\b.*\bvorderradbremse\b',
        r'\bhinterradschwinge\b',
        r'\bspiel im lenkkopflager\b',
        r'\bspannen der kette\b',
        r'\bprofiltiefe.*mofas\b',
        r'\bprofiltiefe.*motorrads\b',
        r'\bautomatischem blockierverhinderer.*abv.*motorrad\b'
    ]
    
    for pattern in A_patterns:
        if re.search(pattern, t):
            return True
            
    # Class restrictions
    if re.search(r'\bklasse a\b', t) or re.search(r'\bklasse a1\b', t) or re.search(r'\bklasse a2\b', t) or re.search(r'\bklasse am\b', t):
        if not re.search(r'\bklasse b\b', t):
            return True
            
    return False

def is_truck_bus_only(q_id, text, options_str):
    if not q_id.startswith('2.'):
        return False
    t = (text + ' ' + options_str).lower()
    
    # Check if driving a truck/bus/tractor
    truck_patterns = [
        r'\bsie fahren einen lkw\b',
        r'\bsie fahren einen lastkraftwagen\b',
        r'\bsie fahren eine zugmaschine\b',
        r'\bsie fahren einen omnibus\b',
        r'\bsie fahren ein sattelkraftfahrzeug\b',
        r'\bmehr als 3,5\s*t\b',
        r'\bmehr als 3\.5\s*t\b',
        r'\bgewerblich güter\b',
        r'\blenk- und ruhezeiten\b',
        r'\blenkzeit\b',
        r'\bruhezeit\b',
        r'\bberufskraftfahrer\b',
        r'\bfahrtschreiber\b',
        r'\bkontrollgerät\b'
    ]
    for pattern in truck_patterns:
        if re.search(pattern, t):
            return True
    return False

def translate_via_google(text):
    if not text or not text.strip():
        return ""
    try:
        # Translate from German to Vietnamese
        return GoogleTranslator(source='de', target='vi').translate(text)
    except Exception as e:
        print(f"Translation error: {e}")
        return text

# Filtering phase
final_questions = []
mock_questions = []

# Collect mock questions (numerical IDs like 1, 2, 3...)
for q in existing_list:
    q_id = str(q.get("id", ""))
    if q_id.isdigit():
        mock_questions.append(q)

print(f"Found {len(mock_questions)} mock questions to preserve.")

translated_count = 0
for row in rows:
    q_id = row.get('question_id', '')
    text = row.get('question_text', '')
    options_str = row.get('options', '')
    comment = row.get('comment', '')
    
    suffix = get_suffix(q_id)
    
    # Check if kept
    keep = False
    if q_id.startswith('1.'):
        keep = True
    elif q_id.startswith('2.'):
        if suffix < 200 and not is_motorcycle_only(q_id, text, options_str) and not is_truck_bus_only(q_id, text, options_str):
            keep = True
            
    if not keep:
        continue
        
    # Check if already translated
    if q_id in translated_map:
        final_questions.append(translated_map[q_id])
    else:
        # Translate this missing question!
        print(f"Translating missing question {q_id}: {text}")
        text_vi = translate_via_google(text)
        comment_vi = translate_via_google(comment)
        
        # Parse options
        # Options string in CSV looks like: "A. text; B. text; C. text"
        # We need to split and structure it
        options_raw = options_str.split('; ')
        options_list = []
        
        # The correct_answers column contains the letters of correct options, e.g. "A, B"
        correct_raw = row.get('correct_answers', '')
        correct_letters = [c.strip().upper() for c in correct_raw.split(',')]
        
        for opt in options_raw:
            opt = opt.strip()
            if not opt:
                continue
            # Options format: "A. Content"
            match = re.match(r'^([A-C])\.\s*(.*)$', opt)
            if match:
                letter = match.group(1)
                opt_text_de = match.group(2)
                opt_text_vi = translate_via_google(opt_text_de)
                is_correct = letter in correct_letters
                options_list.append({
                    "id": letter,
                    "textDe": opt_text_de,
                    "textVi": opt_text_vi,
                    "isCorrect": is_correct
                })
            else:
                options_list.append({
                    "id": "",
                    "textDe": opt,
                    "textVi": translate_via_google(opt),
                    "isCorrect": False
                })
                
        # Parse points
        try:
            points = int(row.get('points', '0'))
        except:
            points = 0
            
        # Parse category / theme
        theme_name = row.get('theme_name', '')
        
        # Build translated question structure
        new_q = {
            "id": q_id,
            "category": theme_name,
            "points": points,
            "image": row.get('image_paths', '') or None,
            "video": row.get('video_paths', '') or None,
            "textDe": text,
            "textVi": text_vi,
            "options": options_list,
            "vocabulary": [],
            "explanationDe": comment,
            "explanationVi": comment_vi,
            "aiExplanation": f"Đây là câu hỏi số {q_id} bổ sung thuộc chương {theme_name}."
        }
        final_questions.append(new_q)
        translated_count += 1
        time.sleep(0.5)  # Avoid rate limits

# Add mock questions
final_questions.extend(mock_questions)

print(f"\nFinal question count: {len(final_questions)} (including {len(mock_questions)} mock questions)")
print(f"Successfully translated and added {translated_count} missing questions.")

# Save output
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(final_questions, f, indent=2, ensure_ascii=False)

print(f"Saved new dataset to {OUTPUT_PATH}")
