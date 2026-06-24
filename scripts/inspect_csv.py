import urllib.request
import csv
import io
import json

url = 'https://raw.githubusercontent.com/yowmamasita/driving-theory/main/driving_theory_questions_de.csv'

print("Fetching CSV from remote repository...")
response = urllib.request.urlopen(url)
csv_content = response.read().decode('utf-8')

print("Parsing CSV...")
reader = csv.DictReader(io.StringIO(csv_content))
rows = list(reader)
print(f"Total rows parsed: {len(rows)}")

count_img = 0
count_vid = 0
samples = []

for row in rows:
    img = row.get('image_paths', '').strip()
    vid = row.get('video_paths', '').strip()
    if img:
        count_img += 1
    if vid:
        count_vid += 1
    if (img or vid) and len(samples) < 5:
        samples.append({
            'question_id': row.get('question_id'),
            'question_text': row.get('question_text'),
            'image_paths': img,
            'video_paths': vid,
            'url': row.get('url')
        })

print(f"Total rows with images: {count_img}")
print(f"Total rows with videos: {count_vid}")
print("Some sample rows with media:")
print(json.dumps(samples, indent=2, ensure_ascii=False))
