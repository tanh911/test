import json
import os

def verify():
    raw_json_path = 'scripts/raw_questions.json'
    images_dir = 'public/images'

    if not os.path.exists(raw_json_path):
        print(f"Error: {raw_json_path} does not exist.")
        return

    if not os.path.exists(images_dir):
        print(f"Error: {images_dir} does not exist.")
        return

    # Load questions
    with open(raw_json_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    # Get all files in public/images
    actual_images = set(os.listdir(images_dir))
    print(f"Total image files in {images_dir}: {len(actual_images)}")

    referenced_images = set()
    missing_images = []
    
    for q in questions:
        img_path = q.get('image')
        if img_path:
            # e.g., "/images/1_1_02-125-M.png"
            filename = img_path.split('/')[-1]
            referenced_images.add(filename)
            if filename not in actual_images:
                missing_images.append((q['id'], filename))

    print(f"Total unique images referenced in raw_questions.json: {len(referenced_images)}")
    
    if missing_images:
        print(f"\n[WARNING] Found {len(missing_images)} missing image files:")
        for q_id, fname in missing_images[:20]:
            print(f" - Question {q_id}: referenced '{fname}', but it is NOT in {images_dir}")
        if len(missing_images) > 20:
            print(f" ... and {len(missing_images) - 20} more.")
    else:
        print("\n[SUCCESS] All referenced images exist in public/images!")

    # Check for unreferenced files in public/images
    unreferenced = actual_images - referenced_images
    print(f"\nTotal unreferenced image files in {images_dir}: {len(unreferenced)}")
    if unreferenced:
        print(f"Example unreferenced files (first 10): {list(unreferenced)[:10]}")

if __name__ == '__main__':
    verify()
