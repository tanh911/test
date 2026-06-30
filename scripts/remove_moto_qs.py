import json

def is_motorcycle_question(q):
    qid = str(q.get('id', ''))
    
    # List of known motorcycle-specific question prefixes that leaked into the dataset
    prefixes_to_drop = [
        '2.2.12-006', '2.2.12-007', '2.2.12-008',
        '2.2.14-001', '2.2.14-002', '2.2.14-003', '2.2.14-004', 
        '2.2.14-005', '2.2.14-006', '2.2.14-008', '2.2.14-009', '2.2.14-010',
        '2.1.01-006', '2.1.01-009', '2.1.01-010', '2.1.03-002', '2.1.03-035', '2.1.03-043',
        '2.6.02-024', '2.6.02-025', '2.6.02-026', '2.6.02-039', '2.6.02-040',
        '2.7.01' # All 2.7.01 are motorcycle driving dynamics
    ]
    
    for prefix in prefixes_to_drop:
        if qid.startswith(prefix):
            return True
            
    # Heuristics based on text for remaining
    textDe = q.get('textDe', '').lower()
    if 'ihr motorrad' in textDe or 'ihr kraftrad' in textDe or 'ihr zweirad' in textDe or 'ihrem mofa' in textDe:
        return True
    if 'sie als kraftradfahrer' in textDe or 'sie als motorradfahrer' in textDe or 'beim motorradfahren' in textDe:
        return True
    if 'hauptständer' in textDe or 'seitenständer' in textDe or 'motorradschutzkleidung' in textDe or 'helmvisier' in textDe:
        return True
    if 'motorradstiefel' in textDe or 'motorradhandschuhe' in textDe or 'integralhelm' in textDe:
        return True
    if 'lenkkopflager' in textDe or 'lenkungsdämpfer' in textDe:
        return True
        
    return False

def filter_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    initial_len = len(data)
    filtered = [q for q in data if not is_motorcycle_question(q)]
    final_len = len(filtered)
    
    print(f"  Removed {initial_len - final_len} questions.")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(filtered, f, indent=2, ensure_ascii=False)

filter_file('src/data/questions_klasse_b.json')
filter_file('src/data/questions_translated.json')
filter_file('scripts/raw_questions_B.json')

print("Done.")
