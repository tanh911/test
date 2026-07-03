import json

def apply_fixes_to_file(file_path):
    print(f"Applying translation fixes to {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Convert to list if it's a dict
    is_dict = isinstance(data, dict)
    q_list = list(data.values()) if is_dict else data

    fixed_count = 0
    for q in q_list:
        q_id = q.get('id', '')
        if q_id == '1.2.05-104':
            q['textVi'] = "Bạn phải kết thúc động tác vượt như thế nào?"
            for opt in q.get('options', []):
                if opt['id'] == 'A':
                    opt['textVi'] = "Không cản trở người bị vượt, hãy nhập lại làn bên phải càng sớm càng tốt"
                elif opt['id'] == 'B':
                    opt['textVi'] = "Báo hiệu kịp thời và rõ ràng việc nhập lại làn bên phải"
                elif opt['id'] == 'C':
                    opt['textVi'] = "Chuyển về bên phải đường ngay sát phía trước người bị vượt"
            fixed_count += 1
            print(f"  Fixed {q_id}")

        elif q_id == '1.2.09-103-B':
            q['textVi'] = "Cả ba xe đều muốn rẽ trái. Ai đã đi vào làn (vị trí chuẩn bị rẽ) chính xác?"
            fixed_count += 1
            print(f"  Fixed {q_id}")

        elif q_id == '1.2.09-104-B':
            q['textVi'] = "Sau khi rẽ trái, bạn muốn rẽ phải ngay. Bạn đi vào làn (vị trí chuẩn bị rẽ) như thế nào?"
            fixed_count += 1
            print(f"  Fixed {q_id}")

        elif q_id == '1.2.09-120':
            for opt in q.get('options', []):
                if opt['id'] == 'A':
                    opt['textVi'] = "Quan sát phương tiện giao thông phía sau, bật xi-nhan báo hướng rẽ, đi vào làn (vị trí chuẩn bị rẽ)"
                elif opt['id'] == 'B':
                    opt['textVi'] = "Bật xi-nhan báo hướng rẽ, đi vào làn (vị trí chuẩn bị rẽ), quan sát phương tiện giao thông phía sau"
                elif opt['id'] == 'C':
                    opt['textVi'] = "Đi vào làn (vị trí chuẩn bị rẽ), bật xi-nhan báo hướng rẽ, quan sát phương tiện giao thông phía sau"
            fixed_count += 1
            print(f"  Fixed {q_id}")

        elif q_id == '2.1.01-007-M':
            for opt in q.get('options', []):
                if opt['id'] == 'B':
                    opt['textVi'] = "Tôi tăng tốc để người vượt có thể nhập làn vào phía sau tôi"
            fixed_count += 1
            print(f"  Fixed {q_id}")

        elif q_id == '2.2.02-001':
            q['textVi'] = "Bạn muốn rẽ trái trên đường có một làn đường cho mỗi hướng. Bạn phải đi vào làn (vị trí chuẩn bị rẽ) ở vị trí nào?"
            fixed_count += 1
            print(f"  Fixed {q_id}")

        elif q_id == '2.2.06-101-M':
            for opt in q.get('options', []):
                if opt['id'] == 'B':
                    opt['textVi'] = "Tôi đi vào làn bên phải phía sau những xe đang chờ"
            fixed_count += 1
            print(f"  Fixed {q_id}")

    # Write back
    res = {q['id']: q for q in q_list} if is_dict else q_list
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(res, f, indent=2, ensure_ascii=False)
    print(f"Saved {file_path}. Fixed {fixed_count} questions.")

# Fix both files
apply_fixes_to_file('src/data/questions_translated.json')
apply_fixes_to_file('src/data/questions_klasse_b.json')
