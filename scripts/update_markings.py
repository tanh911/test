import os

rm_path = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\world\roadMarkings.ts"
with open(rm_path, "r", encoding="utf-8") as f:
    c = f.read()

# Kiểm tra findAcuteSiblings trong roadMarkings.ts
# Đảm bảo nếu khoảng cách giữa 2 polyline < half + otherHalf + 0.5 thì phát hiện là sibling
old_acute = """export function findAcuteSiblings(road: MapRoad, map: GameMap): AcuteSibling[] {
  const siblings: AcuteSibling[] = [];
  for (const other of map.roads) {
    if (other.id === road.id) continue;
    for (const end1 of ['from', 'to'] as const) {
      for (const end2 of ['from', 'to'] as const) {
        if (road[end1] === other[end2]) {
          const p1A = end1 === 'from' ? road.points[0] : road.points[road.points.length - 1];
          const p1B = end1 === 'from' ? road.points[1] : road.points[road.points.length - 2];
          const p2A = end2 === 'from' ? other.points[0] : other.points[other.points.length - 1];
          const p2B = end2 === 'from' ? other.points[1] : other.points[other.points.length - 2];
          const d1x = p1B[0] - p1A[0], d1z = p1B[1] - p1A[1];
          const d2x = p2B[0] - p2A[0], d2z = p2B[1] - p2A[1];
          const l1 = Math.hypot(d1x, d1z) || 1, l2 = Math.hypot(d2x, d2z) || 1;
          const dot = (d1x * d2x + d1z * d2z) / (l1 * l2);
          if (dot > 0.65) {
            const cross = (d2x * (-d1z) + d2z * d1x) / (l1 * l2);
            const facingSide: -1 | 1 = end1 === 'from' ? (cross > 0 ? 1 : -1) : (cross > 0 ? -1 : 1);
            siblings.push({ other, facingSide });
          }
        }
      }
    }
  }
  return siblings;
}"""

new_acute = """export function findAcuteSiblings(road: MapRoad, map: GameMap): AcuteSibling[] {
  const siblings: AcuteSibling[] = [];
  for (const other of map.roads) {
    if (other.id === road.id) continue;
    for (const end1 of ['from', 'to'] as const) {
      for (const end2 of ['from', 'to'] as const) {
        if (road[end1] === other[end2]) {
          const p1A = end1 === 'from' ? road.points[0] : road.points[road.points.length - 1];
          const p1B = end1 === 'from' ? road.points[1] : road.points[road.points.length - 2];
          const p2A = end2 === 'from' ? other.points[0] : other.points[other.points.length - 1];
          const p2B = end2 === 'from' ? other.points[1] : other.points[other.points.length - 2];
          const d1x = p1B[0] - p1A[0], d1z = p1B[1] - p1A[1];
          const d2x = p2B[0] - p2A[0], d2z = p2B[1] - p2A[1];
          const l1 = Math.hypot(d1x, d1z) || 1, l2 = Math.hypot(d2x, d2z) || 1;
          const dot = (d1x * d2x + d1z * d2z) / (l1 * l2);
          if (dot > 0.5) { // góc < ~60°
            const cross = (d2x * (-d1z) + d2z * d1x) / (l1 * l2);
            const facingSide: -1 | 1 = end1 === 'from' ? (cross > 0 ? 1 : -1) : (cross > 0 ? -1 : 1);
            siblings.push({ other, facingSide });
          }
        }
      }
    }
  }
  return siblings;
}"""

if old_acute in c:
    c = c.replace(old_acute, new_acute)
    with open(rm_path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated roadMarkings.ts successfully.")
else:
    print("old_acute not found directly, check content.")
