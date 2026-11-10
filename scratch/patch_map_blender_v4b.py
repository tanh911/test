# -*- coding: utf-8 -*-
"""Patch v4b: G7-G9 cho build_map_blender.py (G1-G6 đã apply từ patch v4)."""
import io
import ast

p = 'scratch/build_map_blender.py'
src = io.open(p, encoding='utf-8').read()

# ── G7 (range replace): block cây từ comment CAY DỌC PHỐ đến trước junction loop ──
start_m = "    # 🌳 CAY DỌC PHỐ"
end_m = "    for j in graph.get('junctions', []):"
i0 = src.find(start_m)
i1 = src.find(end_m)
assert i0 != -1 and i1 != -1 and i0 < i1, ('markers', i0, i1)

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
                    break

"""
src = src[:i0] + G7_NEW + src[i1:]

# ── G8: pick 3 facade ──
G8_OLD = "        acc = acc_wall if rng.random() < 0.6 else acc_wall2"
G8_NEW = """        r_pick = rng.random()
        if r_pick < 0.45:
            acc = acc_wall
        elif r_pick < 0.82:
            acc = acc_wall2
        else:
            acc = acc_brick"""
assert G8_OLD in src, 'G8'
src = src.replace(G8_OLD, G8_NEW, 1)

# ── G8B: mái v2 (range replace từ flat-roof emission cũ) ──
start_m2 = """        base = len(acc_roof.verts)
        for p in pts:
            acc_roof.verts.append((p[0], h, p[1]))
            acc_roof.uvs.append((p[0] / 8.0, p[1] / 8.0))
        acc_roof.faces.append(tuple(range(base, base + len(pts))))"""
i2 = src.find(start_m2)
assert i2 != -1, 'roof start'

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
                )
"""
src = src[:i2] + G8B_NEW + src[i2 + len(start_m2):]

# ── G9: commit list ──
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
if G9_OLD in src:
    src = src.replace(G9_OLD, G9_NEW, 1)
    print('G9 applied')
else:
    print('G9 anchor NOT found — check manually!')

io.open(p, 'w', encoding='utf-8').write(src)
ast.parse(src)
print('patched v4b OK, syntax valid')
