import os

sidewalk_path = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\world\sidewalk.ts"
with open(sidewalk_path, "r", encoding="utf-8") as f:
    c = f.read()

old_block = """      const inner0 = pointWithNormalAtS(road.points, s);
      const inner1 = pointWithNormalAtS(road.points, nextS);
      const ix0 = inner0.x + inner0.nx * side * half;
      const iz0 = inner0.z + inner0.nz * side * half;
      const ox0 = inner0.x + inner0.nx * side * (half + SIDEWALK_W);
      const oz0 = inner0.z + inner0.nz * side * (half + SIDEWALK_W);
      const ix1 = inner1.x + inner1.nx * side * half;
      const iz1 = inner1.z + inner1.nz * side * half;
      const ox1 = inner1.x + inner1.nx * side * (half + SIDEWALK_W);
      const oz1 = inner1.z + inner1.nz * side * (half + SIDEWALK_W);

      let culled = false;
      const midOx = (ox0 + ox1) / 2;
      const midOz = (oz0 + oz1) / 2;
      for (const sib of siblings) {
        if (sib.facingSide === side) {
          const oHalf = roadHalfWidth(sib.other);
          const d = distToRoad(midOx, midOz, sib.other);
          if (d < oHalf + 0.3) {
            culled = true;
            break;
          }
        }
      }

      if (!culled) {
        const top: [number, number, number][] = side === 1
          ? [[ix0, h0, iz0], [ox0, h0, oz0], [ox1, h1, oz1], [ix1, h1, iz1]]
          : [[ix0, h0, iz0], [ix1, h1, iz1], [ox1, h1, oz1], [ox0, h0, oz0]];
        const isFullRamp = h0 === RAMP_H && h1 === RAMP_H;
        const curb: [number, number, number][] | null = isFullRamp ? null : (side === 1
          ? [[ix0, 0, iz0], [ix0, h0, iz0], [ix1, h1, iz1], [ix1, 0, iz1]]
          : [[ix0, h0, iz0], [ix0, 0, iz0], [ix1, 0, iz1], [ix1, h1, iz1]]);
        pieces.push({ top, curb, height: hAvg });
      }"""

new_block = """      const inner0 = pointWithNormalAtS(road.points, s);
      const inner1 = pointWithNormalAtS(road.points, nextS);
      const ix0 = inner0.x + inner0.nx * side * half;
      const iz0 = inner0.z + inner0.nz * side * half;
      const ix1 = inner1.x + inner1.nx * side * half;
      const iz1 = inner1.z + inner1.nz * side * half;

      let culled = false;
      let effW0 = SIDEWALK_W;
      let effW1 = SIDEWALK_W;

      for (const sib of siblings) {
        if (sib.facingSide === side) {
          const oHalf = roadHalfWidth(sib.other);
          const d0 = distToRoad(ix0, iz0, sib.other);
          const d1 = distToRoad(ix1, iz1, sib.other);
          // Nếu mép đường đã chạm hoặc nằm trong lòng đường đối diện
          if (d0 < oHalf + 0.2 || d1 < oHalf + 0.2) {
            culled = true;
            break;
          }
          const clear0 = d0 - oHalf;
          const clear1 = d1 - oHalf;
          if (clear0 < 0.5 || clear1 < 0.5) {
            culled = true;
            break;
          }
          effW0 = Math.min(effW0, Math.max(0.3, clear0 - 0.15));
          effW1 = Math.min(effW1, Math.max(0.3, clear1 - 0.15));
        }
      }

      if (!culled) {
        const ox0 = ix0 + inner0.nx * side * effW0;
        const oz0 = iz0 + inner0.nz * side * effW0;
        const ox1 = ix1 + inner1.nx * side * effW1;
        const oz1 = iz1 + inner1.nz * side * effW1;

        const top: [number, number, number][] = side === 1
          ? [[ix0, h0, iz0], [ox0, h0, oz0], [ox1, h1, oz1], [ix1, h1, iz1]]
          : [[ix0, h0, iz0], [ix1, h1, iz1], [ox1, h1, oz1], [ox0, h0, oz0]];
        const isFullRamp = h0 === RAMP_H && h1 === RAMP_H;
        const curb: [number, number, number][] | null = isFullRamp ? null : (side === 1
          ? [[ix0, 0, iz0], [ix0, h0, iz0], [ix1, h1, iz1], [ix1, 0, iz1]]
          : [[ix0, h0, iz0], [ix0, 0, iz0], [ix1, 0, iz1], [ix1, h1, iz1]]);
        pieces.push({ top, curb, height: hAvg });
      }"""

if old_block in c:
    c = c.replace(old_block, new_block)
    with open(sidewalk_path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Updated sidewalk.ts successfully.")
else:
    # Thử tìm inner0
    print("Could not match exact old_block, trying fuzzy replace...")
    idx = c.find("const inner0 = pointWithNormalAtS(road.points, s);")
    end_idx = c.find("pieces.push({ top, curb, height: hAvg });", idx)
    if idx != -1 and end_idx != -1:
        end_brace = c.find("}", end_idx) + 1
        c = c[:idx] + new_block + c[end_brace:]
        with open(sidewalk_path, "w", encoding="utf-8") as f:
            f.write(c)
        print("Fuzzy replaced sidewalk.ts successfully.")
    else:
        print("Failed to locate target in sidewalk.ts")
