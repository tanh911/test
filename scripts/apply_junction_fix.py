import os

rmpath = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\world\roadMesh.ts"
with open(rmpath, "r", encoding="utf-8") as f:
    c = f.read()

# 1. Update junctionCutExtent
cut_old = """  for (const other of connected) {
    if (other.road.id === road.id) continue;
    const dot = ndx * other.dirX + ndz * other.dirZ;
    if (dot > 0.8) { // góc < ~36 độ
      const otherHalf = roadHalfWidth(other.road);
      const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
      const sinHalf = Math.sin(ang / 2);
      const goreD = (half + otherHalf + 0.5) / (2 * Math.max(0.08, sinHalf));
      d = Math.max(d, goreD);
    }
  }"""

cut_new = """  for (const other of connected) {
    if (other.road.id === road.id) continue;
    const dot = ndx * other.dirX + ndz * other.dirZ;
    if (dot > 0.5) { // góc < ~60 độ
      const otherHalf = roadHalfWidth(other.road);
      const ang = Math.acos(Math.max(-1, Math.min(1, dot)));
      const sinHalf = Math.sin(ang / 2);
      const goreD = (half + otherHalf + 0.2) / (2 * Math.max(0.08, sinHalf));
      d = Math.max(d, goreD);
    }
  }"""

if cut_old in c:
    c = c.replace(cut_old, cut_new)
    print("Updated junctionCutExtent.")

# 2. Update buildJunctionMesh
build_old = """    // Check acute gore
    for (const other of connectedRoads) {
      if (other.road.id === road.id) continue;
      const dot = dirX * other.dirX + dirZ * other.dirZ;
      if (dot > 0.8) {
        const oHalf = roadHalfWidth(other.road);
        const angDiff = Math.acos(Math.max(-1, Math.min(1, dot)));
        const sinHalf = Math.sin(angDiff / 2);
        const goreD = (half + oHalf + 0.5) / (2 * Math.max(0.08, sinHalf));
        d = Math.max(d, goreD);
      }
    }
    d = Math.min(d, len * 0.45);"""

build_new = """    // Check acute gore (< 60 độ)
    for (const other of connectedRoads) {
      if (other.road.id === road.id) continue;
      const dot = dirX * other.dirX + dirZ * other.dirZ;
      if (dot > 0.5) {
        const oHalf = roadHalfWidth(other.road);
        const angDiff = Math.acos(Math.max(-1, Math.min(1, dot)));
        const sinHalf = Math.sin(angDiff / 2);
        const goreD = (half + oHalf + 0.2) / (2 * Math.max(0.08, sinHalf));
        d = Math.max(d, goreD);
      }
    }
    d = Math.min(d, len * 0.45);"""

if build_old in c:
    c = c.replace(build_old, build_new)
    print("Updated buildJunctionMesh gore check.")

# 3. Update miter check t >= 0.0 && u >= 0.0
miter_old = "if (t >= -0.5 && u >= -0.5) {"
miter_new = "if (t >= 0.0 && u >= 0.0) {"
if miter_old in c:
    c = c.replace(miter_old, miter_new)
    print("Updated miter check.")

with open(rmpath, "w", encoding="utf-8") as f:
    f.write(c)
print("Saved roadMesh.ts.")
