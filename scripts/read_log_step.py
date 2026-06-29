import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

f_path = 'C:/Users/Tuan Anh/.gemini/antigravity/brain/21ec5913-4085-4f18-9534-8efd2bb9c39c/.system_generated/logs/overview.txt'

with open(f_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def save_step(line_idx, filename):
    try:
        line = lines[line_idx]
        data = json.loads(line)
        cmd = data['tool_calls'][0]['args']['CommandLine']
        
        # Clean up command
        if cmd.startswith('node -e "'):
            script = cmd[9:-1]
        elif cmd.startswith('"node -e \\"'):
            script = cmd[11:-2]
        else:
            script = cmd
            
        script = script.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
        
        with open(f'scripts/{filename}', 'w', encoding='utf-8') as sf:
            sf.write(script)
        print(f"Extracted step at line {line_idx} to scripts/{filename}")
    except Exception as e:
        print(f"Error extracting line {line_idx}: {e}")

save_step(148, 'filter_148.js')
save_step(154, 'filter_154.js')
