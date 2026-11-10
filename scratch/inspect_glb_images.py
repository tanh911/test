import struct
import json
import os

glb_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior.glb'
with open(glb_path, 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    clen, ctype = struct.unpack('<II', f.read(8))
    json_data = f.read(clen)
    data = json.loads(json_data.decode('utf-8'))

print("=== GLB INTERNAL ANALYSIS ===")
print("Images in GLB:", len(data.get('images', [])))
for idx, img in enumerate(data.get('images', [])):
    bv_idx = img.get('bufferView')
    if bv_idx is not None:
        bv = data['bufferViews'][bv_idx]
        print(f"  Image {idx} ({img.get('name', 'unnamed')}): mimeType={img.get('mimeType')}, byteLength={bv['byteLength'] / 1024 / 1024:.2f} MB")

print("\nBufferViews Summary:")
total_img_bytes = sum(data['bufferViews'][img['bufferView']]['byteLength'] for img in data.get('images', []) if 'bufferView' in img)
print(f"Total Image Bytes: {total_img_bytes / 1024 / 1024:.2f} MB")
print(f"Total Buffer Bytes: {data['buffers'][0]['byteLength'] / 1024 / 1024:.2f} MB")
