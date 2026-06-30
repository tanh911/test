import os
import re

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    
    # JSX: fontSize: '15px' -> fontSize: 'calc(15px * var(--text-scale, 1))'
    new_content = re.sub(
        r"fontSize:\s*['\"](\d+px)['\"]",
        r"fontSize: 'calc(\1 * var(--text-scale, 1))'",
        new_content
    )
    
    # CSS: font-size: 15px; -> font-size: calc(15px * var(--text-scale, 1));
    # Be careful not to replace already calced ones if the script runs twice
    new_content = re.sub(
        r"font-size:\s*(?!calc)([\d\.]+(?:px|rem|em));",
        r"font-size: calc(\1 * var(--text-scale, 1));",
        new_content
    )

    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {path}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.css'):
            process_file(os.path.join(root, file))
