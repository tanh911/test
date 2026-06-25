"""
enrich_questions.py
-------------------
Tự động sinh vocabulary và aiExplanation cho các câu hỏi còn thiếu.
Không cần API key - dùng từ điển có sẵn + template.

Cách chạy:
    python scripts/enrich_questions.py
"""

import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_PATH = "src/data/questions_translated.json"

# ─────────────────────────────────────────────────────────
# TỪ ĐIỂN THUẬT NGỮ GIAO THÔNG ĐỨC - VIỆT
# ─────────────────────────────────────────────────────────
VOCAB_DICT = {
    # Luật và quy tắc
    "Vorfahrt": "quyền ưu tiên đi trước",
    "Rechts vor Links": "bên phải trước bên trái",
    "Vorfahrtsstraße": "đường ưu tiên",
    "Vorfahrtstraße": "đường ưu tiên",
    "Vorfahrt gewähren": "nhường đường",
    "StVO": "Luật Giao thông Đường bộ Đức",
    "Schrittgeschwindigkeit": "tốc độ đi bộ (4-7 km/h)",
    "Richtgeschwindigkeit": "tốc độ khuyến nghị",
    "Höchstgeschwindigkeit": "tốc độ tối đa",
    "Mindestgeschwindigkeit": "tốc độ tối thiểu",
    "Geschwindigkeit": "tốc độ",
    "Geschwindigkeitsbegrenzung": "giới hạn tốc độ",
    "Tempolimit": "giới hạn tốc độ",
    # Đường và vị trí
    "Kreuzung": "ngã tư, giao lộ",
    "Einmündung": "ngã ba, điểm nhập đường",
    "Kreisverkehr": "vòng xuyến, bùng binh",
    "Autobahn": "đường cao tốc",
    "Landstraße": "đường ngoài đô thị",
    "Innerorts": "trong khu vực đô thị",
    "Außerorts": "ngoài khu vực đô thị",
    "Fahrbahn": "phần đường xe chạy",
    "Fahrstreifen": "làn đường",
    "Seitenstreifen": "lề đường",
    "Gehweg": "vỉa hè",
    "Radweg": "đường dành cho xe đạp",
    "Haltestelle": "điểm dừng xe buýt/tàu điện",
    "Fußgängerzone": "khu vực đi bộ",
    "Tunnel": "đường hầm",
    "Bahnübergang": "đường ray xe lửa băng qua",
    # Biển báo
    "Verkehrszeichen": "biển báo giao thông",
    "Zeichen": "biển báo/ký hiệu",
    "Haltzeichen": "biển báo dừng lại",
    "Stoppschild": "biển STOP",
    "Gefahrenzeichen": "biển báo nguy hiểm",
    "Vorschriftszeichen": "biển báo bắt buộc/cấm",
    "Richtzeichen": "biển chỉ dẫn",
    "Zusatzzeichen": "biển phụ",
    "Leitpfosten": "cột phản quang ven đường",
    # Phương tiện
    "Fahrzeug": "phương tiện giao thông",
    "Kraftfahrzeug": "xe cơ giới",
    "Personenkraftwagen": "xe ô tô con",
    "Pkw": "xe ô tô con",
    "Lkw": "xe tải",
    "Kraftrad": "xe máy",
    "Fahrrad": "xe đạp",
    "Bus": "xe buýt",
    "Fußgänger": "người đi bộ",
    "Radfahrer": "người đi xe đạp",
    # Kỹ thuật xe
    "Bremsweg": "quãng đường phanh",
    "Anhalteweg": "tổng quãng đường dừng",
    "Reaktionsweg": "quãng đường phản ứng",
    "Sicherheitsabstand": "khoảng cách an toàn",
    "Abstand": "khoảng cách",
    "Faustformel": "công thức tính nhẩm",
    "Reifen": "lốp xe",
    "Profiltiefe": "độ sâu rãnh lốp",
    "Winterreifen": "lốp mùa đông",
    "Sommerreifen": "lốp mùa hè",
    "Reifendruck": "áp suất lốp",
    "Bremsen": "phanh xe",
    "Gefahrenbremsung": "phanh khẩn cấp",
    "ABS": "hệ thống chống bó cứng phanh",
    "Stoßdämpfer": "bộ giảm xóc",
    "Unwucht": "mất cân bằng bánh xe",
    "Lenkrad": "vô lăng",
    "Scheinwerfer": "đèn pha xe",
    "Blinker": "đèn xi-nhan",
    "Warnblinklicht": "đèn nháy cảnh báo khẩn cấp",
    "Nebelscheinwerfer": "đèn sương mù trước",
    "Nebelschlussleuchte": "đèn sương mù sau",
    "Warndreieck": "tam giác cảnh báo",
    "Verbandskasten": "hộp sơ cứu",
    "Feuerlöscher": "bình chữa cháy",
    "Sicherheitsgurt": "dây an toàn",
    "Airbag": "túi khí an toàn",
    "Kindersitz": "ghế trẻ em trên xe",
    "Anhänger": "xe rơ-moóc",
    "Anhängelast": "trọng tải kéo rơ-moóc",
    # Hành vi lái xe
    "Überholen": "vượt xe",
    "Abbiegen": "rẽ đường",
    "Wenden": "quay đầu xe",
    "Einparken": "đỗ xe vào chỗ",
    "Parken": "đỗ xe, đậu xe",
    "Halten": "dừng xe tạm thời",
    "Blinken": "bật xi-nhan báo hiệu",
    "Einfahren": "lái xe vào",
    "Ausfahren": "lái xe ra",
    "Anfahren": "khởi động xe, bắt đầu lái",
    "Einordnen": "vào đúng làn đường",
    "Abstand halten": "giữ khoảng cách",
    "Rechts fahren": "đi về phía bên phải",
    "Linksfahrgebot": "quy định đi bên trái",
    # Điều kiện đường/thời tiết
    "Nebel": "sương mù",
    "Sichtweite": "tầm nhìn xa",
    "Glatteis": "băng trơn trượt",
    "Aquaplaning": "hiện tượng trượt nước",
    "Schnee": "tuyết",
    "Regen": "mưa",
    "Nacht": "ban đêm",
    "Dunkelheit": "bóng tối, điều kiện thiếu sáng",
    # Luật cụ thể
    "Promillegrenze": "giới hạn nồng độ cồn",
    "Probezeit": "thời gian thử thách (2 năm đầu)",
    "Fahranfänger": "người mới lái xe",
    "Fahrerlaubnis": "giấy phép lái xe",
    "Führerschein": "bằng lái xe",
    "Bußgeld": "tiền phạt hành chính",
    "Punkte": "điểm phạt (Flensburg)",
    "Fahrverbot": "lệnh cấm lái xe",
    "MPU": "kiểm tra tâm lý lái xe (idiot test)",
    "Umweltzone": "khu vực bảo vệ môi trường",
    "Feinstaubplakette": "nhãn dán phân loại khí thải",
    "Rettungsgasse": "làn đường cứu hộ khẩn cấp",
    "Pannenhilfe": "hỗ trợ sự cố xe trên đường",
    "Warndreieck": "tam giác cảnh báo",
    "Absicherung": "bảo đảm an toàn hiện trường",
    # Các loại đèn và tín hiệu
    "Lichtzeichen": "tín hiệu đèn",
    "Ampel": "đèn tín hiệu giao thông",
    "Grünlicht": "đèn xanh",
    "Rotlicht": "đèn đỏ",
    "Gelblichtt": "đèn vàng",
    "Rotlichtverstoß": "vi phạm vượt đèn đỏ",
    # Xe ưu tiên
    "Einsatzfahrzeug": "xe ưu tiên khẩn cấp",
    "Martinshorn": "còi hú khẩn cấp",
    "Blaulicht": "đèn xanh ưu tiên khẩn cấp",
    # Khác
    "Haltlinie": "vạch dừng xe",
    "Sichtlinie": "vạch tầm nhìn",
    "Zebrastreifen": "vạch kẻ đường cho người đi bộ",
    "Leitlinie": "vạch phân làn đứt quãng",
    "Fahrbahnmarkierung": "vạch kẻ đường",
    "Parkverbot": "cấm đỗ xe",
    "Haltverbot": "cấm dừng đỗ xe",
    "Einbahnstraße": "đường một chiều",
    "Durchfahrtverbot": "cấm đi qua",
    "TÜV": "cơ quan kiểm định kỹ thuật xe",
    "Hauptuntersuchung": "đăng kiểm định kỳ",
    "Abgasuntersuchung": "kiểm tra khí thải",
    "Pannenhilfe": "cứu hộ xe trên đường",
    "Erste Hilfe": "sơ cứu khẩn cấp",
    "Windschutzscheibe": "kính chắn gió trước",
    "Spiegel": "gương chiếu hậu",
    "Rückspiegel": "gương chiếu hậu trong",
    "Außenspiegel": "gương chiếu hậu ngoài",
    "Tempomat": "kiểm soát hành trình (cruise control)",
    "Navi": "hệ thống định vị GPS",
}

def extract_vocabulary(textDe: str, explanationDe: str) -> list:
    """Tìm từ vựng trong text bằng cách so khớp từ điển."""
    combined = f"{textDe} {explanationDe}"
    found = []
    seen  = set()

    for de_term, vi_meaning in VOCAB_DICT.items():
        # Tìm kiếm không phân biệt hoa thường, từ nguyên vẹn
        pattern = r'\b' + re.escape(de_term) + r'\b'
        if re.search(pattern, combined, re.IGNORECASE):
            key = de_term.lower()
            if key not in seen:
                seen.add(key)
                found.append({"de": de_term, "vi": vi_meaning})
        if len(found) >= 4:
            break

    return found[:4]  # Tối đa 4 từ

def generate_ai_explanation(q: dict) -> str:
    """Sinh giải thích tự động từ template."""
    correct_opts = [o for o in q.get('options', []) if o.get('isCorrect')]
    wrong_opts   = [o for o in q.get('options', []) if not o.get('isCorrect')]
    text_vi      = q.get('textVi', '')
    explanation  = q.get('explanationVi', '')
    correct_ids  = ', '.join(o.get('id', '') for o in correct_opts)
    correct_txts = '; '.join(
        f"**{o.get('id','')}** \"{o.get('textVi', o.get('textDe',''))}\"" 
        for o in correct_opts
    )

    lines = []

    # Câu mở đầu
    if correct_opts:
        lines.append(f"Đáp án đúng cho câu hỏi này là {correct_ids}: {correct_txts}.")
    
    # Giải thích từ explanationVi
    if explanation and len(explanation) > 20:
        lines.append(explanation)
    
    # Phân tích đáp án sai
    if wrong_opts:
        wrong_descs = []
        for o in wrong_opts:
            txt = o.get('textVi') or o.get('textDe', '')
            if txt and txt.strip() and not txt.startswith('Option ') and not txt.startswith('Phương án'):
                wrong_descs.append(f"Phương án {o.get('id','')} (\"{txt}\") là sai")
        if wrong_descs:
            lines.append('. '.join(wrong_descs) + ' theo quy định StVO.')
    
    # Lời kết
    lines.append("Hãy đọc kỹ câu hỏi và ghi nhớ quy tắc này để tự tin trong kỳ thi lý thuyết.")

    return '\n'.join(lines)

# ── Main ──────────────────────────────────────────────────
data = json.load(open(OUTPUT_PATH, 'r', encoding='utf-8'))

enriched_vocab = 0
enriched_ai    = 0

for q in data:
    changed = False

    # Bổ sung vocabulary nếu còn trống
    if not q.get('vocabulary'):
        vocab = extract_vocabulary(
            q.get('textDe', '') + ' ' + ' '.join(o.get('textDe','') for o in q.get('options',[])),
            q.get('explanationDe', '')
        )
        if vocab:
            q['vocabulary'] = vocab
            enriched_vocab += 1
            changed = True

    # Bổ sung aiExplanation nếu còn trống
    if not q.get('aiExplanation', '').strip():
        q['aiExplanation'] = generate_ai_explanation(q)
        enriched_ai += 1
        changed = True

with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Da bo sung vocabulary   : {enriched_vocab} cau")
print(f"Da bo sung aiExplanation: {enriched_ai} cau")
print(f"File da luu: {OUTPUT_PATH}")

# Verify
data2 = json.load(open(OUTPUT_PATH, 'r', encoding='utf-8'))
has_v  = sum(1 for q in data2 if q.get('vocabulary'))
has_ai = sum(1 for q in data2 if q.get('aiExplanation','').strip())
print(f"\nKet qua cuoi:")
print(f"  vocabulary    : {has_v}/{len(data2)}")
print(f"  aiExplanation : {has_ai}/{len(data2)}")
