import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

f_path = 'C:/Users/Tuan Anh/.gemini/antigravity/brain/21ec5913-4085-4f18-9534-8efd2bb9c39c/.system_generated/logs/overview.txt'

with open(f_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'node -e' in line:
            print(f"Line {i} matches:")
            try:
                data = json.loads(line)
                cmd = data['tool_calls'][0]['args']['CommandLine']
                print(cmd[:1000])
                if len(cmd) > 1000:
                    print("... [TRUNCATED IN PRINT] ...")
            except Exception as e:
                # manual regex match if it's not JSON
                print(f"Non-JSON or parse error: {e}")
                print(line[:500])
            print("="*80)
