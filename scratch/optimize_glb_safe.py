import struct
import json
import io
import os
from PIL import Image

input_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior_backup.glb'
output_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior.glb'

with open(input_path, 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    clen, ctype = struct.unpack('<II', f.read(8))
    json_bytes = f.read(clen)
    data = json.loads(json_bytes.decode('utf-8'))
    
    blen, btype = struct.unpack('<II', f.read(8))
    bin_bytes = bytearray(f.read(blen))

images = data.get('images', [])
buffer_views = data.get('bufferViews', [])

# Find which bufferViews belong to images vs geometry
img_bv_set = set()
for img in images:
    if 'bufferView' in img:
        img_bv_set.add(img['bufferView'])

print(f"Total bufferViews: {len(buffer_views)}, Image bufferViews: {len(img_bv_set)}")

# We will construct a new BIN buffer
# Geometry bufferViews will stay untouched.
# Image bufferViews will be replaced with compressed JPEGs/PNGs.

new_bin = bytearray()
new_buffer_views = []

# Map old bufferView index to new bufferView index & data
old_to_new_bv = {}

for old_idx, bv in enumerate(buffer_views):
    offset = bv.get('byteOffset', 0)
    blen = bv['byteLength']
    chunk = bin_bytes[offset:offset+blen]
    
    if old_idx in img_bv_set:
        # Find which image uses this bufferView
        img_obj = next((im for im in images if im.get('bufferView') == old_idx), None)
        try:
            pil_img = Image.open(io.BytesIO(chunk))
            w, h = pil_img.size
            
            # Resize if large
            max_dim = 1024
            if w > max_dim or h > max_dim:
                ratio = min(max_dim / w, max_dim / h)
                w = max(1, int(w * ratio))
                h = max(1, int(h * ratio))
                pil_img = pil_img.resize((w, h), Image.Resampling.LANCZOS)
            
            out_io = io.BytesIO()
            # If transparent PNG with actual alpha variations, use PNG
            if pil_img.mode in ('RGBA', 'LA'):
                alpha = pil_img.convert('RGBA').split()[-1]
                min_a, max_a = alpha.getextrema()
                if min_a < 255:
                    pil_img.save(out_io, format='PNG', optimize=True)
                    if img_obj: img_obj['mimeType'] = 'image/png'
                else:
                    pil_img = pil_img.convert('RGB')
                    pil_img.save(out_io, format='JPEG', quality=80, optimize=True)
                    if img_obj: img_obj['mimeType'] = 'image/jpeg'
            else:
                pil_img = pil_img.convert('RGB')
                pil_img.save(out_io, format='JPEG', quality=80, optimize=True)
                if img_obj: img_obj['mimeType'] = 'image/jpeg'
                
            chunk = out_io.getvalue()
        except Exception as e:
            print(f"Error processing image {old_idx}: {e}")
            
    # Align byteOffset to 4-byte boundary
    pad = (4 - (len(new_bin) % 4)) % 4
    if pad > 0:
        new_bin.extend(b'\x00' * pad)
        
    new_offset = len(new_bin)
    new_bin.extend(chunk)
    
    # Create updated bufferView copy
    new_bv = dict(bv)
    new_bv['byteOffset'] = new_offset
    new_bv['byteLength'] = len(chunk)
    new_buffer_views.append(new_bv)

data['bufferViews'] = new_buffer_views
data['buffers'][0]['byteLength'] = len(new_bin)

# Serialize JSON
json_out = json.dumps(data, separators=(',', ':')).encode('utf-8')
json_pad = (4 - (len(json_out) % 4)) % 4
json_out_padded = json_out + b' ' * json_pad

header_len = 12
chunk0_header_len = 8
chunk1_header_len = 8
total_len = header_len + chunk0_header_len + len(json_out_padded) + chunk1_header_len + len(new_bin)

with open(output_path, 'wb') as f:
    f.write(struct.pack('<4sII', b'glTF', 2, total_len))
    f.write(struct.pack('<II', len(json_out_padded), 0x4E4F534A))
    f.write(json_out_padded)
    f.write(struct.pack('<II', len(new_bin), 0x00454C42))
    f.write(new_bin)

print(f"SAFE Optimization complete! New GLB size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")
