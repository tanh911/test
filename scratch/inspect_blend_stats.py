import bpy
import sys

scene = bpy.context.scene
total_polys = 0
total_objs = 0
mats = set()
top = []
for obj in scene.objects:
    if obj.type != 'MESH':
        continue
    total_objs += 1
    polys = sum(len(p.vertices) for p in obj.data.polygons) if obj.data else 0
    total_polys += polys
    top.append((polys, obj.name))
    for slot in obj.material_slots:
        if slot.material:
            mats.add(slot.material.name)

top.sort(reverse=True)
print(f"=== STATS: {bpy.data.filepath} ===")
print(f"mesh objects: {total_objs}")
print(f"total polys (faces): {total_polys:,}")
print(f"materials: {len(mats)}")
print("top 8 heavy objects:")
for polys, name in top[:8]:
    print(f"  {polys:>10,}  {name}")

# Thông tin render/extras
print(f"engines available: Cycles={hasattr(bpy.types, 'Scene') and 'yes'}")
sys.stdout.flush()
