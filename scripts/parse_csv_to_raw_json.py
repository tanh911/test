import urllib.request
import csv
import io
import json
import re

url = 'https://raw.githubusercontent.com/yowmamasita/driving-theory/main/driving_theory_questions_de.csv'

print("Downloading driving theory questions CSV...")
req = urllib.request.Request(url)
response = urllib.request.urlopen(req)
csv_data = response.read().decode('utf-8', errors='replace')

print("Parsing CSV...")
reader = csv.DictReader(io.StringIO(csv_data))
raw_questions = []

def parse_points(points_str):
    # E.g. "4 Punkte" -> 4
    match = re.search(r'\d+', points_str)
    return int(match.group()) if match else 3

def parse_options(options_str, correct_str):
    parts = [p.strip() for p in options_str.split(';') if p.strip()]
    correct_parts = [p.strip() for p in correct_str.split(';') if p.strip()]
    options = []
    
    for part in parts:
        # Match option prefix like "A. " or "A. - " or "A) "
        match = re.match(r'^([A-Za-z])[\.\)\:\-\s]+(.*)$', part)
        if match:
            letter = match.group(1).upper()
            text = match.group(2).strip()
            # Clean up leading dashes or spaces
            if text.startswith('-'):
                text = text[1:].strip()
        else:
            letter = ""
            text = part
            
        is_correct = False
        for cp in correct_parts:
            # Match if the correct answer starts with the same letter
            cp_match = re.match(r'^([A-Za-z])[\.\)\:\-\s]+', cp)
            if cp_match and letter and cp_match.group(1).upper() == letter:
                is_correct = True
                break
            # Or if text is an exact match or substring
            if text in cp or cp in text:
                is_correct = True
                break
                
        options.append({
            "id": letter if letter else str(len(options) + 1),
            "textDe": text,
            "isCorrect": is_correct
        })
    return options

for row in reader:
    q_id = row.get('question_id', '').strip()
    q_text = row.get('question_text', '').strip()
    if not q_id or not q_text:
        continue
        
    points = parse_points(row.get('points', ''))
    options = parse_options(row.get('options', ''), row.get('correct_answers', ''))
    
    img = row.get('image_paths', '').strip()
    vid = row.get('video_paths', '').strip()
    
    image_url = f"https://raw.githubusercontent.com/yowmamasita/driving-theory/main/{img}" if img else None
    video_url = f"https://raw.githubusercontent.com/yowmamasita/driving-theory/main/{vid}" if vid else None
    
    raw_questions.append({
        "id": q_id,
        "category": row.get('theme_name', 'All').strip(),
        "points": points,
        "image": image_url,
        "video": video_url,
        "textDe": q_text,
        "options": options,
        "explanationDe": row.get('comment', '').strip()
    })

print(f"Successfully parsed {len(raw_questions)} questions.")

# Save to file
output_file = 'scripts/raw_questions.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(raw_questions, f, indent=2, ensure_ascii=False)

print(f"Saved raw questions to {output_file}")
