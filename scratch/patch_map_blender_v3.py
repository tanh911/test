# -*- coding: utf-8 -*-
"""Patch build_map_blender.py v3: cobblestone vỉa hè + shop front + xe đỗ + asphalt chi tiết."""
import io

p = 'scratch/build_map_blender.py'
src = io.open(p, encoding='utf-8').read()

# ── E1: painters mới (cobblestone + shopfront) — chèn trước def mat_tex ──
E1_OLD = """    buf[3::4] = 1.0


def mat_tex(name, img, rough=0.9):"""
E1_NEW = """    buf[3::4] = 1.0


def paint_cobble(buf, w, h):
    \"\"\"Đá cobblestone 8x8 viên/tile: nền vữa tối, viên đá sáng lệch sắc từng viên.\"\"\"
    rng = np.random.default_rng(31)
    px = np.full((h, w, 3), 0.30)
    n_cell = 8
    cw, ch = w // n_cell, h // n_cell
    for cy in range(n_cell):
        for cx in range(n_cell):
            v = float(np.clip(0.50 + rng.normal(0, 0.06), 0.34, 0.70))
            x0 = cx * cw + 3
            x1 = (cx + 1) * cw - 3
            y0 = cy * ch + 3
            y1 = (cy + 1) * ch - 3
            if x1 <= x0 or y1 <= y0:
                continue
            px[y0:y1, x0:x1, 0] = v
            px[y0:y1, x0:x1, 1] = v
            px[y0:y1, x0:x1, 2] = min(1.0, v * 1.04)
    px += rng.normal(0, 0.018, (h, w, 3))
    px = np.clip(px, 0, 1)
    buf[0::4] = px.reshape(-1, 3)[:, 0]
    buf[1::4] = px.reshape(-1, 3)[:, 1]
    buf[2::4] = px.reshape(-1, 3)[:, 2]
    buf[3::4] = 1.0


def paint_shopfront(buf, w, h):
    \"\"\"Mặt tiền cửa hàng: mái hiên sọc đỏ (trên) + kính tối khung xám (dưới).\"\"\"
    rng = np.random.default_rng(41)
    px = np.zeros((h, w, 3))
    aw = int(h * 0.30)
    px[:aw, :, :] = np.array([0.55, 0.16, 0.14])          # mái hiên đỏ
    for sx in range(0, w, 32):                              # sọc sáng 16px
        px[:aw, sx:sx + 16, :] *= 1.30
    gy = aw + int(h * 0.06)
    px[gy:, :, :] = np.array([0.10, 0.14, 0.18])           # kính xanh tối
    px[gy:, :, :] += rng.normal(0, 0.02, (h - gy, w, 3))
    for sx in (0, w // 2, w - 3):                           # cột khung dọc
        px[aw:, sx:sx + 3, :] = 0.42
    dx0, dx1 = int(w * 0.42), int(w * 0.58)
    px[gy + 6:int(h * 0.92), dx0:dx1, :] = 0.24            # cửa đi giữa
    px[int(h * 0.92):, :, :] = 0.30                         # bậc cửa
    px = np.clip(px, 0, 1)
    buf[0::4] = px.reshape(-1, 3)[:, 0]
    buf[1::4] = px.reshape(-1, 3)[:, 1]
    buf[2::4] = px.reshape(-1, 3)[:, 2]
    buf[3::4] = 1.0


def emit_box(acc, cx, cy, cz, sx, sy, sz, yaw):
    \"\"\"Box 5 mặt (bỏ đáy) xoay yaw quanh trục Y — dùng cho xe đỗ.\"\"\"
    c, s = math.cos(yaw), math.sin(yaw)
    pts = []
    for dy in (0.0, 1.0):
        for dx in (-1.0, 1.0):
            for dz in (-1.0, 1.0):
                lx, lz = dx * sx * 0.5, dz * sz * 0.5
                pts.append((cx + lx * c - lz * s, cy + dy * sy, cz + lx * s + lz * c))
    # 0(-x,-z,dưới) 1(-x,+z,dưới) 2(+x,-z,dưới) 3(+x,+z,dưới)
    # 4(-x,-z,trên) 5(-x,+z,trên) 6(+x,-z,trên) 7(+x,+z,trên)
    acc.quad(pts[4], pts[5], pts[7], pts[6])   # nóc
    acc.quad(pts[2], pts[3], pts[7], pts[6])   # đầu +x
    acc.quad(pts[0], pts[1], pts[5], pts[4])   # đuôi -x
    acc.quad(pts[1], pts[3], pts[7], pts[5])   # hông +z
    acc.quad(pts[0], pts[2], pts[6], pts[4])   # hông -z


def mat_tex(name, img, rough=0.9):"""
assert E1_OLD in src, 'E1 anchor'
src = src.replace(E1_OLD, E1_NEW, 1)

# ── E2: asphalt chi tiết — vệt bánh + miếng vá + vết nứt ──
E2_OLD = """def paint_asphalt(buf, w, h):
    rng = np.random.default_rng(7)
    n = (w * h, 3)
    base = np.array([0.085, 0.089, 0.098])
    noise = rng.normal(0, 0.016, n)
    px = base + noise
    mask = rng.random(n[0]) < 0.04
    px[mask] += 0.045
    buf[0::4] = np.clip(px[:, 0], 0, 1)
    buf[1::4] = np.clip(px[:, 1], 0, 1)
    buf[2::4] = np.clip(px[:, 2], 0, 1)
    buf[3::4] = 1.0"""
E2_NEW = """def paint_asphalt(buf, w, h):
    rng = np.random.default_rng(7)
    n = (w * h, 3)
    base = np.array([0.085, 0.089, 0.098])
    noise = rng.normal(0, 0.016, n)
    px = base + noise
    mask = rng.random(n[0]) < 0.04
    px[mask] += 0.045
    # 🛞 vệt bánh xe: 2 dải tối dọc theo chiều dài đường (u ≈ 0.30 và 0.70)
    px2 = px.reshape(h, w, 3)
    uu = np.linspace(0, 1, w, endpoint=False)[None, :].repeat(h, 0)
    vv = np.linspace(0, 1, h, endpoint=False)[:, None].repeat(w, 1)
    for uc in (0.30, 0.70):
        px2[np.abs(uu - uc) < 0.055] -= 0.020
    # 🩹 miếng vá asphalt tối hơn
    for (ax, ay, awd, aht) in ((0.18, 0.30, 0.16, 0.22), (0.62, 0.62, 0.20, 0.16)):
        px2[(uu >= ax) & (uu <= ax + awd) & (vv >= ay) & (vv <= ay + aht)] -= 0.028
    # 🕸️ vết nứt: polyline tối mảnh chạy dọc
    for _ in range(4):
        cx = rng.uniform(0.1, 0.9)
        jit = rng.normal(0, 0.02, h)
        for row in range(h):
            x = int((cx + jit[row]) * w) % w
            px2[row, x] -= 0.05
            if row + 1 < h:
                px2[row + 1, min(w - 1, x + 1)] -= 0.03
    px = np.clip(px2.reshape(h * w, 3), 0, 1)
    buf[0::4] = px[:, 0]
    buf[1::4] = px[:, 1]
    buf[2::4] = px[:, 2]
    buf[3::4] = 1.0"""
assert E2_OLD in src, 'E2 anchor'
src = src.replace(E2_OLD, E2_NEW, 1)

# ── E3: tạo image cobble + shopfront ──
E3_OLD = """    img_roof = make_image('V2_TexRoof', 128, 128, paint_roof)"""
E3_NEW = """    img_roof = make_image('V2_TexRoof', 128, 128, paint_roof)
    img_cobble = make_image('V2_TexCobble', 256, 256, paint_cobble)
    img_shop = make_image('V2_TexShopfront', 256, 128, paint_shopfront)"""
assert E3_OLD in src, 'E3 anchor'
src = src.replace(E3_OLD, E3_NEW, 1)

# ── E4: materials mới ──
E4_OLD = """        'sidewalk': mat('V2_ViaHe', (0.55, 0.57, 0.59), 0.92),"""
E4_NEW = """        'sidewalk': mat_tex('V2_ViaHeCobble', img_cobble, 0.95),
        'shop': mat_tex('V2_CuaHang', img_shop, 0.75),
        'car_white': mat('V2_XeTrang', (0.82, 0.83, 0.84), 0.45, 0.25),
        'car_dark': mat('V2_XeDen', (0.09, 0.10, 0.12), 0.4, 0.3),
        'car_silver': mat('V2_XeBac', (0.52, 0.54, 0.56), 0.42, 0.35),
        'car_red': mat('V2_XeDo', (0.42, 0.09, 0.08), 0.45, 0.2),
        'car_blue': mat('V2_XeXanh', (0.10, 0.18, 0.40), 0.45, 0.2),
        'wheel': mat('V2_LopXe', (0.05, 0.05, 0.055), 0.9),"""
assert E4_OLD in src, 'E4 anchor'
src = src.replace(E4_OLD, E4_NEW, 1)

# ── E5: accumulators mới + acc_walk dùng UV ──
E5_OLD = """    acc_walk = MeshAcc('V2_ViaHe', MATS['sidewalk'])"""
E5_NEW = """    acc_walk = MeshAcc('V2_ViaHe', MATS['sidewalk'], use_uv=True)
    acc_shop = MeshAcc('V2_CuaHangStore', MATS['shop'], use_uv=True)
    acc_car_white = MeshAcc('V2_XeDoTrang', MATS['car_white'])
    acc_car_dark = MeshAcc('V2_XeDoDen', MATS['car_dark'])
    acc_car_silver = MeshAcc('V2_XeDoBac', MATS['car_silver'])
    acc_car_red = MeshAcc('V2_XeDoDo', MATS['car_red'])
    acc_car_blue = MeshAcc('V2_XeDoXanh', MATS['car_blue'])
    acc_wheel = MeshAcc('V2_XeLop', MATS['wheel'])
    _car_accs = (acc_car_white, acc_car_dark, acc_car_silver, acc_car_red, acc_car_blue)"""
assert E5_OLD in src, 'E5 anchor'
src = src.replace(E5_OLD, E5_NEW, 1)

# ── E6: lưới tìm kiếm "gần đường phố" cho shop front ──
E6_OLD = """    elev_grid = build_elev_index(graph)"""
E6_NEW = """    elev_grid = build_elev_index(graph)

    # 🏪 lưới ô 50m chứa điểm centerline đường phố — truy vấn nhanh "building mặt phố"
    urban_cells = {}
    for rd in graph['roads']:
        if rd.get('highway') in URBAN:
            for p in rd['centerline'][::3]:
                urban_cells.setdefault((int(p[0] // 50), int(p[1] // 50)), []).append((p[0], p[1]))

    def near_urban(x, z, r=28.0):
        cx, cz = int(x // 50), int(z // 50)
        for ix in (cx - 1, cx, cx + 1):
            for iz in (cz - 1, cz, cz + 1):
                for q in urban_cells.get((ix, iz), ()):
                    if (q[0] - x) ** 2 + (q[1] - z) ** 2 < r * r:
                        return True
        return False"""
assert E6_OLD in src, 'E6 anchor'
src = src.replace(E6_OLD, E6_NEW, 1)

# ── E7: vỉa hè cobblestone dùng UV world-space (1 tile / 2m) ──
E7_OLD = """                for side in (-1.0, 1.0):
                    acc_walk.quad(
                        (l0[0] + n0x * side * sw_in, l0[1] + 0.14, l0[2] + n0z * side * sw_in),
                        (r0[0] + n1x * side * sw_in, r0[1] + 0.14, r0[2] + n1z * side * sw_in),
                        (r0[0] + n1x * side * sw_out, r0[1] + 0.14, r0[2] + n1z * side * sw_out),
                        (l0[0] + n0x * side * sw_out, l0[1] + 0.14, l0[2] + n0z * side * sw_out),
                    )"""
E7_NEW = """                for side in (-1.0, 1.0):
                    ax0 = l0[0] + n0x * side * sw_in
                    az0 = l0[2] + n0z * side * sw_in
                    ax1 = r0[0] + n1x * side * sw_in
                    az1 = r0[2] + n1z * side * sw_in
                    bx1 = r0[0] + n1x * side * sw_out
                    bz1 = r0[2] + n1z * side * sw_out
                    bx0 = l0[0] + n0x * side * sw_out
                    bz0 = l0[2] + n0z * side * sw_out
                    acc_walk.quad(
                        (ax0, l0[1] + 0.14, az0), (ax1, r0[1] + 0.14, az1),
                        (bx1, r0[1] + 0.14, bz1), (bx0, l0[1] + 0.14, bz0),
                        uvs=[(ax0 / 2.0, az0 / 2.0), (ax1 / 2.0, az1 / 2.0),
                             (bx1 / 2.0, bz1 / 2.0), (bx0 / 2.0, bz0 / 2.0)],
                    )"""
assert E7_OLD in src, 'E7 anchor'
src = src.replace(E7_OLD, E7_NEW, 1)

# ── E8: xe đỗ lề đường — chèn trước block guardrail motorway ──
E8_OLD = """        if hw == 'motorway':
            for i in range(len(rib) - 1):
                l0, r0 = rib[i], rib[i + 1]
                n0x, n0z = l0[6], l0[7]"""
E8_NEW = """        # 🚗 XE ĐỖ LỀ ĐƯỜNG: thân + khoang + 4 bánh, dọc phố mỗi ~21m, bỏ gần giao lộ
        if hw in ('primary', 'secondary', 'residential') and total > 60:
            for si in range(int((total - 24) / 21.0)):
                if rng.random() < 0.45:
                    continue
                fr = (12 + si * 21.0) / total
                side = 1.0 if rng.random() < 0.5 else -1.0
                tgt = fr * total
                px_c = pz_c = tx = tz = None
                for gi in range(len(cum) - 1):
                    if cum[gi + 1] >= tgt:
                        t = (tgt - cum[gi]) / max(0.001, cum[gi + 1] - cum[gi])
                        px_c = cl[gi][0] + (cl[gi + 1][0] - cl[gi][0]) * t
                        pz_c = cl[gi][1] + (cl[gi + 1][1] - cl[gi][1]) * t
                        tx = cl[gi + 1][0] - cl[gi][0]
                        tz = cl[gi + 1][1] - cl[gi][1]
                        tl = math.hypot(tx, tz) or 1.0
                        tx, tz = tx / tl, tz / tl
                        break
                if px_c is None:
                    continue
                nxc, nzc = -tz, tx
                off = half - 1.05
                cxp = px_c + nxc * side * off
                czp = pz_c + nzc * side * off
                pyp = point_y(road, (cxp, czp), crossings, fr)
                yaw = math.atan2(tz, tx)
                acc_car = _car_accs[int(rng.random() * len(_car_accs))]
                emit_box(acc_car, cxp, pyp + 0.18, czp, 4.1, 0.62, 1.72, yaw)
                emit_box(acc_car, cxp - tx * 0.25, pyp + 0.80, czp - tz * 0.25, 2.15, 0.55, 1.58, yaw)
                for lwx in (-1.35, 1.35):
                    for lwz in (-0.86, 0.86):
                        emit_box(acc_wheel,
                                 cxp + lwx * tx - lwz * tz, pyp, czp + lwx * tz + lwz * tx,
                                 0.62, 0.34, 0.30, yaw)

        if hw == 'motorway':
            for i in range(len(rib) - 1):
                l0, r0 = rib[i], rib[i + 1]
                n0x, n0z = l0[6], l0[7]"""
assert E8_OLD in src, 'E8 anchor'
src = src.replace(E8_OLD, E8_NEW, 1)

# ── E9: shop front tầng trệt cho building mặt phố ──
E9_OLD = """        base = len(acc_roof.verts)
        for p in pts:
            acc_roof.verts.append((p[0], h, p[1]))
            acc_roof.uvs.append((p[0] / 8.0, p[1] / 8.0))
        acc_roof.faces.append(tuple(range(base, base + len(pts))))"""
E9_NEW = """        # 🏪 shop front tầng trệt (0 → 3.1m): kính + mái hiên, chỉ building mặt phố
        if h >= 5.5 and near_urban(sum(p[0] for p in pts) / len(pts),
                                   sum(p[1] for p in pts) / len(pts)):
            for i in range(len(pts)):
                p1 = pts[i]
                p2 = pts[(i + 1) % len(pts)]
                elen = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
                if elen < 3.0 or elen > 34.0 or rng.random() < 0.25:
                    continue
                nx_ = -(p2[1] - p1[1]) / elen
                nz_ = (p2[0] - p1[0]) / elen
                mx_ = (p1[0] + p2[0]) / 2 - sum(q[0] for q in pts) / len(pts)
                mz_ = (p1[1] + p2[1]) / 2 - sum(q[1] for q in pts) / len(pts)
                if nx_ * mx_ + nz_ * mz_ < 0:
                    nx_, nz_ = -nx_, -nz_
                o = 0.035
                acc_shop.quad(
                    (p1[0] + nx_ * o, 0.05, p1[1] + nz_ * o),
                    (p2[0] + nx_ * o, 0.05, p2[1] + nz_ * o),
                    (p2[0] + nx_ * o, 3.1, p2[1] + nz_ * o),
                    (p1[0] + nx_ * o, 3.1, p1[1] + nz_ * o),
                    uvs=[(0, 0), (elen / 3.0, 0), (elen / 3.0, 1), (0, 1)],
                )
        base = len(acc_roof.verts)
        for p in pts:
            acc_roof.verts.append((p[0], h, p[1]))
            acc_roof.uvs.append((p[0] / 8.0, p[1] / 8.0))
        acc_roof.faces.append(tuple(range(base, base + len(pts))))"""
assert E9_OLD in src, 'E9 anchor'
src = src.replace(E9_OLD, E9_NEW, 1)

# ── E10: commit các accumulator mới ──
E10_OLD = """    for acc in [acc_road, acc_road2, acc_junc, acc_white, acc_walk, acc_curb,
                acc_wall, acc_wall2, acc_roof, acc_park, acc_water, acc_railbed, acc_rail,
                acc_bridge, acc_pier, acc_pole, acc_lamp, acc_guard,
                acc_trunk, acc_canopy]:
        acc.commit()"""
E10_NEW = """    for acc in [acc_road, acc_road2, acc_junc, acc_white, acc_walk, acc_curb,
                acc_wall, acc_wall2, acc_roof, acc_park, acc_water, acc_railbed, acc_rail,
                acc_bridge, acc_pier, acc_pole, acc_lamp, acc_guard,
                acc_trunk, acc_canopy,
                acc_shop, acc_car_white, acc_car_dark, acc_car_silver, acc_car_red,
                acc_car_blue, acc_wheel]:
        acc.commit()"""
assert E10_OLD in src, 'E10 anchor'
src = src.replace(E10_OLD, E10_NEW, 1)

io.open(p, 'w', encoding='utf-8').write(src)
print('patched OK: cobble + shopfront + parked cars + asphalt detail')
