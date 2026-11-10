import os
import json

# 1. Update vehicle.ts
vpath = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\world\vehicle.ts"
with open(vpath, "r", encoding="utf-8") as f:
    vc = f.read()

idx_seat = vc.find("seatPose()")
if idx_seat != -1:
    idx_lx = vc.find("const lx =", idx_seat)
    idx_lz = vc.find("const lz =", idx_seat)
    idx_end = vc.find(";", idx_lz) + 1
    new_seat_vars = """const lx = -0.32;
      const ly = 1.15;
      const lz = -0.05;"""
    vc = vc[:idx_lx] + new_seat_vars + vc[idx_end:]
    with open(vpath, "w", encoding="utf-8") as f:
        f.write(vc)
    print("Updated vehicle.ts seatPose.")

# 2. Update spawns in muenchen-altstadt-clean.json
mpath = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\data\maps\muenchen-altstadt-clean.json"
with open(mpath, "r", encoding="utf-8") as f:
    m = json.load(f)

m["spawns"]["player"] = {
    "roadId": "r256",
    "s": 135,
    "lane": 0
}

with open(mpath, "w", encoding="utf-8") as f:
    json.dump(m, f, indent=2)
print("Updated player spawn in muenchen-altstadt-clean.json.")
