# -*- coding: utf-8 -*-
"""Patch v4 'Gobesdorf style': facade v2 (khung cửa + ngạch + kính gradient),
gạch, ngói mái, billboard cây alpha, mái dốc 2 nước + ống khói + đầu hồi,
parapet mái bằng, hàng rào cây bụi, giao lộ cobble."""
import io

p = 'scratch/build_map_blender.py'
src = io.open(p, encoding='utf-8').read()

# ── G1: make_image hỗ trợ alpha ──
G1_OLD = "    img = bpy.data.images.new(name, w, h)"
G1_NEW = "    img = bpy.data.images.new(name, w, h, alpha=True)"
assert G1_OLD in src, 'G1'
src = src.replace(G1_OLD, G1_NEW, 1)

# ── G2: facade v2 — khung trắng dày, sill, lintel, kính gradient, nhụa vữa ──
G2_OLD = """def paint_facade(buf, w, h, tint):
    rng = np.random.default_rng(11)
    px = np.tile(tint, (w * h, 1))
    px += rng.normal(0, 0.02, (w * h, 3))
    uu = np.linspace(0, 1, w, endpoint=False)
    vv = np.linspace(0, 1, h, endpoint=False)
    um = np.tile(uu, h)
    vm = np.repeat(vv, w)
    win_u = (um > 0.22) & (um < 0.78)
    win_v = (vm > 0.30) & (vm < 0.72)
    win = win_u & win_v
    frame = win_u & (vm > 0.24) & (vm < 0.78) & ~win
    px[win] = np.array([0.25, 0.32, 0.40]) + rng.normal(0, 0.03, (int(win.sum()), 3))
    px[frame] = np.array([0.88, 0.88, 0.86])
    buf[0::4] = np.clip(px[:, 0], 0, 1)
    buf[1::4] = np.clip(px[:, 1], 0, 1)
    buf[2::4] = np.clip(px[:, 2], 0, 1)
    buf[3::4] = 1.0"""
G2_NEW = """def paint_facade(buf, w, h, tint):
    rng = np.random.default_rng(11)
    px = np.tile(tint, (w * h, 1))
    # nhụa vữa: mảng loang tần số thấp + nhiễu mịn
    cell = max(8, w // 8)
    gh, gw = math.ceil(h / cell), math.ceil(w / cell)
    blotch = rng.normal(0, 0.030, (gh, gw, 1))
    blotch = np.repeat(np.repeat(blotch, cell, 0), cell, 1)[:h, :w, 0]
    px += blotch.reshape(w * h, 1)
    px += rng.normal(0, 0.015, (w * h, 3))
    uu = np.tile(np.linspace(0, 1, w, endpoint=False), h)
    vm = np.repeat(np.linspace(0, 1, h, endpoint=False), w)
    win_u = (uu > 0.20) & (uu < 0.80)
    win_v = (vm > 0.28) & (vm < 0.74)
    frame_u = (uu > 0.15) & (uu < 0.85)
    frame_v = (vm > 0.23) & (vm < 0.79)
    frame = frame_u & frame_v & ~(win_u & win_v)
    glass = win_u & win_v
    px[frame] = np.array([0.92, 0.92, 0.90])
    # kính: gradient dọc — trên tối, dưới sáng phản trời
    gv = vm[glass]
    px[glass] = np.stack([0.20 + 0.16 * (1 - gv),
                          0.27 + 0.18 * (1 - gv),
                          0.36 + 0.20 * (1 - gv)], axis=1) + rng.normal(0, 0.02, (int(glass.sum()), 3))
    px[frame_u & (vm >= 0.74) & (vm < 0.79)] = np.array([0.95, 0.95, 0.93])   # sill
    px[frame_u & (vm >= 0.23) & (vm < 0.26)] = np.array([0.90, 0.90, 0.88])   # lintel
    buf[0::4] = np.clip(px[:, 0], 0, 1)
    buf[1::4] = np.clip(px[:, 1], 0, 1)
    buf[2::4] = np.clip(px[:, 2], 0, 1)
    buf[3::4] = 1.0"""
assert G2_OLD in src, 'G2'
src = src.replace(G2_OLD, G2_NEW, 1)

# ── G3: paint_roof → ngói xếp hàng ──
G3_OLD = """def paint_roof(buf, w, h):
    rng = np.random.default_rng(23)
    px = np.array([0.30, 0.17, 0.14]) + rng.normal(0, 0.02, (w * h, 3))
    buf[0::4] = np.clip(px[:, 0], 0, 1)
    buf[1::4] = np.clip(px[:, 1], 0, 1)
    buf[2::4] = np.clip(px[:, 2], 0, 1)
    buf[3::4] = 1.0"""
G3_NEW = """def paint_roof(buf, w, h):
    \"\"\"Ngói xếp hàng so le — kiểu mái Đức.\"\"\"
    rng = np.random.default_rng(23)
    px = np.full((h, w, 3), 0.16)
    tw, th = 32, 18
    for row in range(h // th + 1):
        y0 = row * th + 2
        y1 = min(h, y0 + th - 2)
        if y0 >= h:
            break
        off = (row % 2) * (tw // 2)
        for x0 in range(-tw, w + tw, tw):
            xx0, xx1 = x0 + off, x0 + off + tw - 2
            if xx1 <= 0 or xx0 >= w or y1 <= y0:
                continue
            v = float(np.clip(0.44 + rng.normal(0, 0.05), 0.32, 0.58))
            px[y0:y1, max(0, xx0):min(w, xx1), 0] = v * 0.98
            px[y0:y1, max(0, xx0):min(w, xx1), 1] = v * 0.60
            px[y0:y1, max(0, xx0):min(w, xx1), 2] = v * 0.52
    px += rng.normal(0, 0.02, (h, w, 3))
    px = np.clip(px, 0, 1)
    buf[0::4] = px.reshape(-1, 3)[:, 0]
    buf[1::4] = px.reshape(-1, 3)[:, 1]
    buf[2::4] = px.reshape(-1, 3)[:, 2]
    buf[3::4] = 1.0


def paint_brick(buf, w, h):
    \"\"\"Gạch chạy mạch so le + mạch vữa sáng.\"\"\"
    rng = np.random.default_rng(53)
    px = np.full((h, w, 3), 0.74)
    row_h, bh, bw = 16, 12, 30
    for row in range(h // row_h + 1):
        y0 = row * row_h + 2
        y1 = min(h, y0 + bh)
        if y0 >= h:
            break
        off = (row % 2) * (bw // 2)
        for x0 in range(-bw, w + bw, bw + 2):
            xx0, xx1 = x0 + off + 2, x0 + off + bw
            if xx1 <= 0 or xx0 >= w or y1 <= y0:
                continue
            v = float(np.clip(0.40 + rng.normal(0, 0.06), 0.26, 0.56))
            px[y0:y1, max(0, xx0):min(w, xx1), 0] = v
            px[y0:y1, max(0, xx0):min(w, xx1), 1] = v * 0.58
            px[y0:y1, max(0, xx0):min(w, xx1), 2] = v * 0.46
    px += rng.normal(0, 0.015, (h, w, 3))
    px = np.clip(px, 0, 1)
    buf[0::4] = px.reshape(-1, 3)[:, 0]
    buf[1::4] = px.reshape(-1, 3)[:, 1]
    buf[2::4] = px.reshape(-1, 3)[:, 2]
    buf[3::4] = 1.0


def paint_tree(buf, w, h):
    \"\"\"Billboard cây RGBA: thân + tán cụm tròn, alpha clip.\"\"\"
    rng = np.random.default_rng(71)
    px = np.zeros((h, w, 4))
    yy, xx = np.mgrid[0:h, 0:w]
    yy, xx = yy.astype(np.float32), xx.astype(np.float32)
    tx = w * 0.5 + float(rng.normal(0, w * 0.015))
    trunk_m = (np.abs(xx - tx) < w * 0.022) & (yy > h * 0.60)
    px[trunk_m, 0] = 0.32
    px[trunk_m, 1] = 0.22
    px[trunk_m, 2] = 0.13
    px[trunk_m, 3] = 1.0
    for _ in range(52):
        cx = w * 0.5 + float(rng.normal(0, w * 0.20))
        cy = h * 0.50 + float(rng.normal(0, h * 0.17))
        r = float(rng.uniform(h * 0.06, h * 0.15))
        m = ((xx - cx) ** 2 + (yy - cy) ** 2) < r * r
        sh = float(rng.uniform(0.0, 1.0))
        px[m, 0] = 0.09 + sh * 0.10
        px[m, 1] = 0.28 + sh * 0.18
        px[m, 2] = 0.07 + sh * 0.06
        px[m, 3] = 1.0
    hl = (yy < h * 0.30) & (px[:, :, 3] > 0)
    px[hl, 0] += 0.06
    px[hl, 1] += 0.08
    px[hl, 2] += 0.04
    px = np.clip(px, 0, 1)
    buf[:] = px.reshape(-1)"""
assert G3_OLD in src, 'G3'
src = src.replace(G3_OLD, G3_NEW, 1)

# ── G4: mat_tex_alpha + disc() UV world-space ──
G4_OLD = """def mat_tex(name, img, rough=0.9):"""
G4_NEW = """def mat_tex_alpha(name, img, rough=0.9):
    \"\"\"Material texture có alpha (billboard cây) — GLTF export alphaMode mask/blend.\"\"\"
    m = mat_tex(name, img, rough)
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    for n in nt.nodes:
        if n.type == 'TEX_IMAGE':
            nt.links.new(n.outputs['Alpha'], bsdf.inputs['Alpha'])
            break
    for attr, val in (('blend_method', 'CLIP'), ('shadow_method', 'CLIP')):
        try:
            setattr(m, attr, val)
        except Exception:
            pass
    return m


def mat_tex(name, img, rough=0.9):"""
assert G4_OLD in src, 'G4'
src = src.replace(G4_OLD, G4_NEW, 1)

G4B_OLD = """    def disc(self, cx, cy, cz, radius, n=14):
        ring = []
        for i in range(n):
            ang = 2 * math.pi * i / n
            ring.append(len(self.verts))
            self.verts.append((cx + math.cos(ang) * radius, cy, cz + math.sin(ang) * radius))
            if self.use_uv:
                self.uvs.append((0.5, 0.5))
        center = len(self.verts)
        self.verts.append((cx, cy, cz))
        if self.use_uv:
            self.uvs.append((0.5, 0.5))"""
G4B_NEW = """    def disc(self, cx, cy, cz, radius, n=14):
        ring = []
        for i in range(n):
            ang = 2 * math.pi * i / n
            ring.append(len(self.verts))
            self.verts.append((cx + math.cos(ang) * radius, cy, cz + math.sin(ang) * radius))
            if self.use_uv:
                self.uvs.append(((cx + math.cos(ang) * radius) / 2.0, (cz + math.sin(ang) * radius) / 2.0))
        center = len(self.verts)
        self.verts.append((cx, cy, cz))
        if self.use_uv:
            self.uvs.append((cx / 2.0, cz / 2.0))"""
assert G4B_OLD in src, 'G4B'
src = src.replace(G4B_OLD, G4B_NEW, 1)

# ── G5: images + materials mới ──
G5_OLD = """    img_cobble = make_image('V2_TexCobble', 256, 256, paint_cobble)
    img_shop = make_image('V2_TexShopfront', 256, 128, paint_shopfront)"""
G5_NEW = """    img_cobble = make_image('V2_TexCobble', 256, 256, paint_cobble)
    img_shop = make_image('V2_TexShopfront', 256, 128, paint_shopfront)
    img_brick = make_image('V2_TexGach', 256, 256, paint_brick)
    img_tree = make_image('V2_TexCayBill', 256, 256, paint_tree)"""
assert G5_OLD in src, 'G5'
src = src.replace(G5_OLD, G5_NEW, 1)

G5B_OLD = "        'junc': mat_tex('V2_GiaoLoTex', img_asphalt, 0.96),"
G5B_NEW = """        'junc': mat_tex('V2_GiaoLoCobble', img_cobble, 0.95),
        'wall_brick': mat_tex('V2_NhaGachTex', img_brick, 0.9),
        'roof_flat': mat('V2_MaiBang', (0.16, 0.17, 0.18), 0.95),
        'tree': mat_tex_alpha('V2_CayBillTex', img_tree, 0.95),
        'hedge': mat('V2_RaoCay', (0.12, 0.30, 0.10), 1.0),"""
assert G5B_OLD in src, 'G5B'
src = src.replace(G5B_OLD, G5B_NEW, 1)

# ── G6: accumulators mới ──
G6_OLD = """    _car_accs = (acc_car_white, acc_car_dark, acc_car_silver, acc_car_red, acc_car_blue)"""
G6_NEW = """    _car_accs = (acc_car_white, acc_car_dark, acc_car_silver, acc_car_red, acc_car_blue)
    acc_brick = MeshAcc('V2_NhaGach', MATS['wall_brick'], use_uv=True)
    acc_roof_flat = MeshAcc('V2_MaiBang', MATS['roof_flat'])
    acc_tree = MeshAcc('V2_CayBill', MATS['tree'], use_uv=True)
    acc_hedge = MeshAcc('V2_RaoCayRunh', MATS['hedge'])"""
assert G6_OLD in src, 'G6'
src = src.replace(G6_OLD, G6_NEW, 1)

# ── G7: block cây → billboard 2 quad chéo ──
G7_OLD = """    # 🌳 CAY DỌC PHỐ: thân cylinder + tán cone dọc urban roads mỗi 35m
    acc_trunk = MeshAcc('V2_CayThan', mat('V2_TruCay', (0.35, 0.24, 0.14), 0.9))
    acc_canopy = MeshAcc('V2_CayTan', mat('V2_TanCay', (0.15, 0.38, 0.12), 1.0))
    tree_rng = random.Random(99)
    for road in graph['roads']:
        hw_t = road['highway']
        if hw_t not in ('residential', 'living_street', 'tertiary', 'secondary'):
            continue
        cl_t = road.get('centerline') or []
        if len(cl_t) < 2:
            continue
        w_t = road.get('width') or 7.0
        cum_t = [0.0]
        for i in range(1, len(cl_t)):
            cum_t.append(cum_t[i-1] + math.hypot(cl_t[i][0]-cl_t[i-1][0], cl_t[i][1]-cl_t[i-1][1]))
        total_t = cum_t[-1] or 1.0
        if total_t < 50:
            continue
        n_trees = int(total_t // 55)
        for k in range(n_trees):
            fr = (k * 55 + 24) / total_t
            tgt = fr * total_t
            for i in range(len(cum_t) - 1):
                if cum_t[i + 1] >= tgt:
                    t = (tgt - cum_t[i]) / max(0.001, cum_t[i + 1] - cum_t[i])
                    px = cl_t[i][0] + (cl_t[i + 1][0] - cl_t[i][0]) * t
                    pz = cl_t[i][1] + (cl_t[i + 1][1] - cl_t[i][1]) * t
                    dx = cl_t[i + 1][0] - cl_t[i][0]
                    dz = cl_t[i + 1][1] - cl_t[i][1]
                    L = math.hypot(dx, dz) or 1.0
                    nx, nz = -dz / L, dx / L
                    for side in (-1.0, 1.0):
                        if tree_rng.random() < 0.5:
                            continue
                        off = w_t / 2.0 + 3.0 + tree_rng.random() * 1.5
                        tx = px + nx * side * off
                        tz = pz + nz * side * off
                        tree_h = 3.5 + tree_rng.random() * 2.5
                        trunk_r = 0.12
                        canopy_r = 1.2 + tree_rng.random() * 0.8
                        base_t = len(acc_trunk.verts)
                        for k8 in range(6):
                            ang = 2 * math.pi * k8 / 6
                            acc_trunk.verts.append((tx + math.cos(ang) * trunk_r, 0.0, tz + math.sin(ang) * trunk_r))
                        for k8 in range(6):
                            ang = 2 * math.pi * k8 / 6
                            acc_trunk.verts.append((tx + math.cos(ang) * trunk_r * 0.6, tree_h, tz + math.sin(ang) * trunk_r))
                        for k8 in range(6):
                            a0i = base_t + k8
                            a1i = base_t + (k8 + 1) % 6
                            b0i = base_t + 6 + k8
                            b1i = base_t + 6 + (k8 + 1) % 6
                            acc_trunk.faces.append((a0i, a1i, b1i, b0i))
                        base_c = len(acc_canopy.verts)
                        tip = len(acc_canopy.verts)
                        acc_canopy.verts.append((tx, tree_h + canopy_r * 1.4, tz))
                        ring0 = base_c + 1
                        ring1 = base_c + 9
                        for k8 in range(8):
                            ang = 2 * math.pi * k8 / 8
                            acc_canopy.verts.append((tx + math.cos(ang) * canopy_r, tree_h, tz + math.sin(ang) * canopy_r))
                        for k8 in range(8):
                            ang = 2 * math.pi * k8 / 8
                            acc_canopy.verts.append((tx + math.cos(ang) * canopy_r * 0.3, tree_h + canopy_r, tz + math.sin(ang) * canopy_r * 0.3))
                        for k8 in range(8):
                            acc_canopy.faces.append((ring0 + k8, ring0 + (k8 + 1) % 8, tip))
                            acc_canopy.faces.append((ring0 + (k8 + 1) % 8, ring0 + k8, ring1 + k8))
                            acc_canopy.faces.append((ring1 + k8, ring1 + (k8 + 1) % 8, tip))
                    break"""
G7_NEW = """    # 🌳 CÂY BILLBOARD (kiểu Gobesdorf): 2 quad chéo 90° + texture alpha — rẻ & thật hơn cone
    tree_rng = random.Random(99)
    for road in graph['roads']:
        hw_t = road['highway']
        if hw_t not in ('residential', 'living_street', 'tertiary', 'secondary'):
            continue
        cl_t = road.get('centerline') or []
        if len(cl_t) < 2:
            continue
        w_t = road.get('width') or 7.0
        cum_t = [0.0]
        for i in range(1, len(cl_t)):
            cum_t.append(cum_t[i-1] + math.hypot(cl_t[i][0]-cl_t[i-1][0], cl_t[i][1]-cl_t[i-1][1]))
        total_t = cum_t[-1] or 1.0
        if total_t < 50:
            continue
        n_trees = int(total_t // 42)
        for k in range(n_trees):
            fr = (k * 42 + 20) / total_t
            tgt = fr * total_t
            for i in range(len(cum_t) - 1):
                if cum_t[i + 1] >= tgt:
                    t = (tgt - cum_t[i]) / max(0.001, cum_t[i + 1] - cum_t[i])
                    px = cl_t[i][0] + (cl_t[i + 1][0] - cl_t[i][0]) * t
                    pz = cl_t[i][1] + (cl_t[i + 1][1] - cl_t[i][1]) * t
                    dx = cl_t[i + 1][0] - cl_t[i][0]
                    dz = cl_t[i + 1][1] - cl_t[i][1]
                    L = math.hypot(dx, dz) or 1.0
                    nx, nz = -dz / L, dx / L
                    ddx, ddz = dx / L, dz / L
                    for side in (-1.0, 1.0):
                        if tree_rng.random() < 0.42:
                            continue
                        off = w_t / 2.0 + 3.0 + tree_rng.random() * 1.5
                        tx = px + nx * side * off
                        tz = pz + nz * side * off
                        tree_h = 3.5 + tree_rng.random() * 2.5
                        canopy_r = 1.4 + tree_rng.random() * 0.9
                        tw_ = canopy_r * 2.7
                        th_ = tree_h + canopy_r * 1.5
                        uv_t = ((0, 0), (1, 0), (1, 1), (0, 1))
                        acc_tree.quad(   # quad vuông góc đường
                            (tx - nx * tw_ * 0.5, 0.0, tz - nz * tw_ * 0.5),
                            (tx + nx * tw_ * 0.5, 0.0, tz + nz * tw_ * 0.5),
                            (tx + nx * tw_ * 0.5, th_, tz + nz * tw_ * 0.5),
                            (tx - nx * tw_ * 0.5, th_, tz - nz * tw_ * 0.5),
                            uvs=uv_t)
                        acc_tree.quad(   # quad dọc đường
                            (tx - ddx * tw_ * 0.5, 0.0, tz - ddz * tw_ * 0.5),
                            (tx + ddx * tw_ * 0.5, 0.0, tz + ddz * tw_ * 0.5),
                            (tx + ddx * tw_ * 0.5, th_, tz + ddz * tw_ * 0.5),
                            (tx - ddx * tw_ * 0.5, th_, tz - ddz * tw_ * 0.5),
                            uvs=uv_t)
                    break"""
assert G7_OLD in src, 'G7'
src = src.replace(G7_OLD, G7_NEW, 1)

# ── G8: building — 3 loại facade + mái dốc/ống khói/đầu hồi/hàng rào ──
G8_OLD = """        acc = acc_wall if rng.random() < 0.6 else acc_wall2"""
G8_NEW = """        r_pick = rng.random()
        if r_pick < 0.45:
            acc = acc_wall
        elif r_pick < 0.82:
            acc = acc_wall2
        else:
            acc = acc_brick"""
assert G8_OLD in src, 'G8'
src = src.replace(G8_OLD, G8_NEW, 1)

G8B_OLD = """        base = len(acc_roof.verts)
        for p in pts:
            acc_roof.verts.append((p[0], h, p[1]))
            acc_roof.uvs.append((p[0] / 8.0, p[1] / 8.0))
        acc_roof.faces.append(tuple(range(base, base + len(pts))))"""
G8B_NEW = """        # 🏠 MÁI v2: mái dốc 2 nước + ống khói + đầu hồi cho nhà đều; mái bằng + parapet cho còn lại
        xs_ = [q[0] for q in pts]
        zs_ = [q[1] for q in pts]
        minx_, maxx_ = min(xs_), max(xs_)
        minz_, maxz_ = min(zs_), max(zs_)
        bw_, bz_ = maxx_ - minx_, maxz_ - minz_
        n_pts = len(pts)
        area_poly = abs(sum(pts[i][0] * pts[(i + 1) % n_pts][1] - pts[(i + 1) % n_pts][0] * pts[i][1]
                            for i in range(n_pts))) / 2.0
        is_regular = bw_ > 4 and bz_ > 4 and area_poly / max(0.01, bw_ * bz_) > 0.72
        if h <= 13 and is_regular:
            over = 0.30
            if bw_ >= bz_:
                rx0, rx1 = minx_ - over, maxx_ + over
                rzc = (minz_ + maxz_) / 2
                e0, e1 = minz_ - over, maxz_ + over
                slope = math.hypot((e1 - e0) / 2.0, 3.0)
                for ze in (e0, e1):
                    acc_roof.quad(
                        (rx0, h, ze), (rx1, h, ze),
                        (rx1, h + 3.0, rzc), (rx0, h + 3.0, rzc),
                        uvs=[(0, 0), ((rx1 - rx0) / 2.2, 0), ((rx1 - rx0) / 2.2, slope / 2.2), (0, slope / 2.2)],
                    )
                for xe in (rx0, rx1):   # đầu hồi tam giác
                    acc.quad(
                        (xe, h, e0), (xe, h, e1),
                        (xe, h + 3.0, rzc), (xe, h + 3.0, rzc),
                        uvs=[(0, 0), ((e1 - e0) / 3.0, 0), (0, 0), (0, 0)],
                    )
                if rng.random() < 0.75:
                    cxm = rng.uniform(minx_ + 1.2, maxx_ - 1.2)
                    emit_box(acc_brick, cxm, h + 2.1, rzc + rng.uniform(-bz_ * 0.25, bz_ * 0.25),
                             0.55, 1.6, 0.55, 0.0)
            else:
                rz0, rz1 = minz_ - over, maxz_ + over
                rxc = (minx_ + maxx_) / 2
                e0, e1 = minx_ - over, maxx_ + over
                slope = math.hypot((e1 - e0) / 2.0, 3.0)
                for xe in (e0, e1):
                    acc_roof.quad(
                        (xe, h, rz0), (xe, h, rz1),
                        (rxc, h + 3.0, rz1), (rxc, h + 3.0, rz0),
                        uvs=[(0, 0), ((rz1 - rz0) / 2.2, 0), ((rz1 - rz0) / 2.2, slope / 2.2), (0, slope / 2.2)],
                    )
                for ze in (rz0, rz1):
                    acc.quad(
                        (e0, h, ze), (e1, h, ze),
                        (rxc, h + 3.0, ze), (rxc, h + 3.0, ze),
                        uvs=[(0, 0), ((e1 - e0) / 3.0, 0), (0, 0), (0, 0)],
                    )
                if rng.random() < 0.75:
                    czm = rng.uniform(minz_ + 1.2, maxz_ - 1.2)
                    emit_box(acc_brick, rxc + rng.uniform(-bw_ * 0.25, bw_ * 0.25), h + 2.1, czm,
                             0.55, 1.6, 0.55, 0.0)
            # hàng rào cây bụi trước nhà thấp
            if h <= 10 and rng.random() < 0.5:
                i_ = max(range(n_pts), key=lambda ii: math.hypot(pts[(ii + 1) % n_pts][0] - pts[ii][0],
                                                                 pts[(ii + 1) % n_pts][1] - pts[ii][1]))
                p1_ = pts[i_]
                p2_ = pts[(i_ + 1) % n_pts]
                el_ = math.hypot(p2_[0] - p1_[0], p2_[1] - p1_[1])
                if 6.0 < el_ < 30.0:
                    nx_ = -(p2_[1] - p1_[1]) / el_
                    nz_ = (p2_[0] - p1_[0]) / el_
                    cx_ = (p1_[0] + p2_[0]) / 2
                    cz_ = (p1_[1] + p2_[1]) / 2
                    if (cx_ - (minx_ + maxx_) / 2) * nx_ + (cz_ - (minz_ + maxz_) / 2) * nz_ < 0:
                        nx_, nz_ = -nx_, -nz_
                    emit_box(acc_hedge, cx_ + nx_ * 3.4, 0.0, cz_ + nz_ * 3.4,
                             el_ - 1.5, 0.85, 0.45, math.atan2(p2_[1] - p1_[1], p2_[0] - p1_[0]))
        else:
            base = len(acc_roof_flat.verts)
            for q in pts:
                acc_roof_flat.verts.append((q[0], h + 0.35, q[1]))
            acc_roof_flat.faces.append(tuple(range(base, base + n_pts)))
            for i in range(n_pts):   # parapet
                p1 = pts[i]
                p2 = pts[(i + 1) % n_pts]
                acc_roof_flat.quad(
                    (p1[0], h, p1[1]), (p2[0], h, p2[1]),
                    (p2[0], h + 0.55, p2[1]), (p1[0], h + 0.55, p1[1]),
                )"""
assert G8B_OLD in src, 'G8B'
src = src.replace(G8B_OLD, G8B_NEW, 1)

# ── G9: commit list mới ──
G9_OLD = """    for acc in [acc_road, acc_road2, acc_junc, acc_white, acc_walk, acc_curb,
                acc_wall, acc_wall2, acc_roof, acc_park, acc_water, acc_railbed, acc_rail,
                acc_bridge, acc_pier, acc_pole, acc_lamp, acc_guard,
                acc_trunk, acc_canopy,
                acc_shop, acc_car_white, acc_car_dark, acc_car_silver, acc_car_red,
                acc_car_blue, acc_wheel]:
        acc.commit()"""
G9_NEW = """    for acc in [acc_road, acc_road2, acc_junc, acc_white, acc_walk, acc_curb,
                acc_wall, acc_wall2, acc_roof, acc_park, acc_water, acc_railbed, acc_rail,
                acc_bridge, acc_pier, acc_pole, acc_lamp, acc_guard,
                acc_shop, acc_car_white, acc_car_dark, acc_car_silver, acc_car_red,
                acc_car_blue, acc_wheel,
                acc_brick, acc_roof_flat, acc_tree, acc_hedge]:
        acc.commit()"""
assert G9_OLD in src, 'G9'
src = src.replace(G9_OLD, G9_NEW, 1)

io.open(p, 'w', encoding='utf-8').write(src)
print('patched v4 Gobesdorf OK')
