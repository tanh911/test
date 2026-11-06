import struct
import json
import io
import os
from PIL import Image

input_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior.glb'
output_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior.glb'
backup_path = 'public/models/2014_toyota_corolla_e180_eu_with_interior_backup.glb'

if not os.path.exists(backup_path):
    import shutil
    shutil.copyfile(input_path, backup_path)
    print("Created backup of original 75MB file.")

with open(backup_path, 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    clen, ctype = struct.unpack('<II', f.read(8))
    json_bytes = f.read(clen)
    data = json.loads(json_bytes.decode('utf-8'))
    
    blen, btype = struct.unpack('<II', f.read(8))
    bin_bytes = bytearray(f.read(blen))

images = data.get('images', [])
buffer_views = data.get('bufferViews', [])

print(f"Original GLB size: {os.path.getsize(backup_path) / 1024 / 1024:.2f} MB")

new_bin_bytes = bytearray()
new_buffer_views = []

# Map old bufferView index to new bufferView data
bv_data_map = {}
for idx, bv in enumerate(buffer_views):
    offset = bv.get('byteOffset', 0)
    blen = bv['byteLength']
    bv_data_map[idx] = bin_bytes[offset:offset+blen]

# Optimize images
for img_idx, img in enumerate(images):
    bv_idx = img.get('bufferView')
    if bv_idx is None:
        continue
    img_raw = bv_data_map[bv_idx]
    
    try:
        pil_img = Image.open(io.BytesIO(img_raw))
        w, h = pil_img.size
        
        # Downscale max dimension to 1024px if larger
        max_dim = 1024
        if w > max_dim or h > max_dim:
            ratio = min(max_dim / w, max_dim / h)
            new_w = max(1, int(w * ratio))
            new_h = max(1, int(h * ratio))
            pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Save as JPEG if RGB/RGBA without transparent alpha, or WebP / PNG compressed
        out_io = io.BytesIO()
        if pil_img.mode in ('RGBA', 'LA') or (pil_img.mode == 'P' and 'transparency' in pil_img.info):
            # Check if alpha channel is actually used
            alpha = pil_img.convert('RGBA').split()[-1]
            min_a, max_a = alpha.getextrema()
            if min_a == 255:
                # Fully opaque, convert to JPEG
                pil_img = pil_img.convert('RGB')
                pil_img.save(out_io, format='JPEG', quality=82, optimize=True)
                img['mimeType'] = 'image/jpeg'
            else:
                # Transparent, save as WebP / PNG
                pil_img.save(out_io, format='WEBP', quality=80)
                img['mimeType'] = 'image/webp'
        else:
            pil_img = pil_img.convert('RGB')
            pil_img.save(out_io, format='JPEG', quality=82, optimize=True)
            img['mimeType'] = 'image/jpeg'
            
        opt_data = out_io.getvalue()
        bv_data_map[bv_idx] = opt_data
        print(f"Optimized image {img_idx}: {w}x{h} -> {pil_img.size[0]}x{pil_img.size[1]} ({len(img_raw)/1024:.1f} KB -> {len(opt_data)/1024:.1f} KB)")
    except Exception as e:
        print(f"Skipping image {img_idx} optimization due to: {e}")

# Rebuild bin buffer & bufferViews
current_offset = 0
for idx, bv in enumerate(buffer_views):
    chunk = bv_data_map[idx]
    # Pad alignment to 4 bytes
    pad = (4 - (len(chunk) % 4)) % 4
    chunk_padded = chunk + b'\x00' * pad
    
    bv['byteOffset'] = current_offset
    bv['byteLength'] = len(chunk)
    new_bin_bytes.extend(chunk_padded)
    current_offset += len(chunk_padded)

# Update main buffer length
data['buffers'][0]['byteLength'] = len(new_bin_bytes)

# Serialize JSON
json_out = json.dumps(data, separators=(',', ':')).encode('utf-8')
json_pad = (4 - (len(json_out) % 4)) % 4
json_out_padded = json_out + b' ' * json_pad

# Total GLB length
header_len = 12
chunk0_header_len = 8
chunk1_header_len = 8
total_len = header_len + chunk0_header_len + len(json_out_padded) + chunk1_header_len + len(new_bin_bytes)

with open(output_path, 'wb') as f:
    # 12-byte header
    f.write(struct.pack('<4sII', b'glTF', 2, total_len))
    # Chunk 0 (JSON)
    f.write(struct.pack('<II', len(json_out_padded), 0x4E4F534A)) # JSON
    f.write(json_out_padded)
    # Chunk 1 (BIN)
    f.write(struct.pack('<II', len(new_bin_bytes), 0x00454C42)) # BIN
    f.write(new_bin_bytes)

print(f"\n✅ Optimization complete! New GLB size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")
