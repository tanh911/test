import json
import re

# Load the mock questions
with open('src/data/questions_translated.json', 'r', encoding='utf-8') as f:
    translated_qs = json.load(f)

# Load the full raw dataset
with open('scripts/raw_questions.json', 'r', encoding='utf-8') as f:
    raw_qs = json.load(f)

def clean_text(t):
    return re.sub(r'\W+', '', t.lower())

# Create a mapping from clean text to raw question
raw_map = {}
for rq in raw_qs:
    if 'textDe' in rq:
        raw_map[clean_text(rq['textDe'])] = rq

updated = 0
for tq in translated_qs:
    ct = clean_text(tq['textDe'])
    if ct in raw_map:
        rq = raw_map[ct]
        if rq.get('image'):
            # Replace github URL with local path
            filename = rq['image'].split('/')[-1]
            tq['image'] = f'/images/{filename}'
            print(f"Mapped image for Q{tq['id']}: {tq['image']}")
            tq['imageType'] = None
            updated += 1
        elif rq.get('video'):
            filename = rq['video'].split('/')[-1]
            tq['video'] = f'/videos/{filename}'
            print(f"Mapped video for Q{tq['id']}: {tq['video']}")
            tq['imageType'] = None
            updated += 1
    else:
        # try to find partial match
        for rct, rq in raw_map.items():
            if ct in rct or rct in ct:
                if rq.get('image'):
                    filename = rq['image'].split('/')[-1]
                    tq['image'] = f'/images/{filename}'
                    print(f"Partial match image for Q{tq['id']}: {tq['image']}")
                    tq['imageType'] = None
                    updated += 1
                elif rq.get('video'):
                    filename = rq['video'].split('/')[-1]
                    tq['video'] = f'/videos/{filename}'
                    print(f"Partial match video for Q{tq['id']}: {tq['video']}")
                    tq['imageType'] = None
                    updated += 1
                break

with open('src/data/questions_translated.json', 'w', encoding='utf-8') as f:
    json.dump(translated_qs, f, ensure_ascii=False, indent=2)

print(f"Updated {updated} questions with media.")
