import os

bpath = r"c:\Users\Tuan Anh\.gemini\antigravity\scratch\viet-de-fuhrerschein\src\world\buildings.ts"
with open(bpath, "r", encoding="utf-8") as f:
    c = f.read()

# 1. Đổi frontOff
old_front = "const frontOff = half + 3.2; // vùng đệm mặt tiền thoáng đãng, mở rộng khoảng cách giữa 2 dãy phố"
new_front = "const frontOff = half + 2.0; // sát mép vỉa hè, tạo tỷ lệ phố cổ Altstadt chuẩn xác"
if old_front in c:
    c = c.replace(old_front, new_front)
    print("Replaced frontOff.")

# 2. Xóa bỏ cửa sổ mặt sau
old_back_win = """  // Thêm cửa sổ mặt sau để mọi góc nhìn trong phố và từ trên cao đều có kết cấu mặt tiền nhất quán
  for (let f = 0; f < floors; f++) {
    const y0 = f * FLOOR_H + WIN_BOTTOM;
    const y1 = y0 + WIN_H;
    for (let c = 0; c < cols; c++) {
      const wx0 = s0 + c * colStep + (colStep - WIN_W) / 2;
      const wx1 = wx0 + WIN_W;
      out.push(facade(wx0, wx1, y0, y1, backOff + 0.02, WINDOW, false, side));
    }
  }"""

if old_back_win in c:
    c = c.replace(old_back_win, "")
    print("Removed back windows.")
else:
    # Thử tìm substring
    idx = c.find("// Thêm cửa sổ mặt sau")
    idx_roof = c.find("// ── Mái ──")
    if idx != -1 and idx_roof != -1:
        c = c[:idx] + c[idx_roof:]
        print("Removed back windows via slice.")

with open(bpath, "w", encoding="utf-8") as f:
    f.write(c)
print("Saved buildings.ts.")
