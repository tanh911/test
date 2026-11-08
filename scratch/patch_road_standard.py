# -*- coding: utf-8 -*-
"""Refactor 'duong chuan': stop bars + lane arrows tại junction signalized,
solid center line tại cua (cam vuot), Standstreifen cho motorway — build_map_blender.py."""
import io

p = 'scratch/build_map_blender.py'
src = io.open(p, encoding='utf-8').read()

# ── 0. junction signalized lookup — chèn ngay sau elev_grid ──
a0 = "    elev_grid = build_elev_index(graph)"
assert a0 in src
add0 = a0 + """

    # 🚦 Vị trí junction CÓ ĐÈN TÍN HIỆU (key = node name 'node_x_y') — cho stop bar + lane arrow
    signal_nodes = {}
    for j in graph.get('junctions', []):
        if j.get('trafficSignals'):
            signal_nodes[(j.get('id') or '').replace('junc_', '')] = (j.get('x'), j.get('z'))"""
src = src.replace(a0, add0, 1)

# ── 1. Stop bars + lane arrows — chèn trước block guardrail motorway ──
a1 = "        if hw == 'motorway':"
assert src.count(a1) == 1
add1 = """        # 🛑 STOP BAR (Z. 294) + 🔀 LANE ARROW (Z. 297) trước junction CÓ ĐÈN:
        # bar ngang 0.5m qua full-width, cách mút đường 4m; arrow thẳng mỗi làn cách 25m.
        endKey = road.get('endNode') or ''
        startKey = road.get('startNode') or ''
        for atEnd, key in ((True, endKey), (False, startKey)):
            if key not in signal_nodes:
                continue
            if len(rib) < 2:
                continue
            edge = rib[-1] if atEnd else rib[0]
            prevEdge = rib[-2] if atEnd and len(rib) >= 2 else rib[1]
            ex, ey, ez = edge[0], edge[1], edge[2]
            exC = (edge[0] + edge[3]) / 2
            ezC = (edge[2] + edge[5]) / 2
            nx_, nz_ = edge[6], edge[7]
            tx_, tz_ = (ex - prevEdge[0]), (ez - prevEdge[2])
            tl = math.hypot(tx_, tz_) or 1.0
            tx_, tz_ = tx_ / tl, tz_ / tl
            sign = 1.0 if atEnd else -1.0  # lùi vào trong tuyến
            # ── Stop bar: dải 0.5m cách mút 4m, full width ──
            bl = max(0.35, min(2.0, half - 0.2))
            for (qq, dd) in ((0, 4.0), (1, 3.5)):
                pxq = exC - tx_ * sign * dd
                pzq = ezC - tz_ * sign * dd
                if dd == 4.0:
                    barA_l = (pxq + nx_ * bl, ey + 0.014, pzq + nz_ * bl)
                    barA_r = (pxq - nx_ * bl, ey + 0.014, pzq - nz_ * bl)
                else:
                    barB_l = (pxq + nx_ * bl, ey + 0.014, pzq + nz_ * bl)
                    barB_r = (pxq - nx_ * bl, ey + 0.014, pzq - nz_ * bl)
            acc_white.quad(barA_l, barA_r, barB_r, barB_l)
            # ── Lane arrow: thẳng, mỗi làn, cách mút 25m ──
            ad = min(25.0, total * 0.3)
            for ln in range(lanes):
                off = -half + (ln + 0.5) * (width / lanes)
                pxl = exC - tx_ * sign * ad
                pzl = ezC - tz_ * sign * ad
                hx, hz = pxl + tx_ * 1.2, pzl + tz_ * 1.2
                bx, bz = pxl - tx_ * 1.1, pzl - tz_ * 1.1
                acc_white.quad(
                    (bx + nx_ * 0.16, ey + 0.013, bz + nz_ * 0.16),
                    (bx - nx_ * 0.16, ey + 0.013, bz - nz_ * 0.16),
                    (hx - nx_ * 0.16, ey + 0.013, hz - nz_ * 0.16),
                    (hx + nx_ * 0.16, ey + 0.013, hz + nz_ * 0.16),
                )
                # Đầu nhọn (2 quad nghiêng tạo tam giác)
                hx2, hz2 = pxl + tx_ * 2.3, pzl + tz_ * 2.3
                acc_white.quad(
                    (hx + nx_ * 0.16, ey + 0.013, hz + nz_ * 0.16),
                    (hx - nx_ * 0.16, ey + 0.013, hz - nz_ * 0.16),
                    (hx2, ey + 0.013, hz2),
                    (hx2, ey + 0.013, hz2),
                )

""" + a1
src = src.replace(a1, add1, 1)

# ── 2. Landstraße: solid center tại cua (cấm vượt theo Markierung 340) ──
a2 = "        def center_at(fr):"
assert src.count(a2) == 1
add2 = """        # ⛔ Markierung 340: vạch LIỀN giữa đường tại khúc cua/đèo (cấm vượt)
        # — nơi góc đổi hướng giữa 2 segment liên tiếp > 0.3 rad
        for i in range(len(rib) - 1):
            h0 = math.atan2(cl[min(i + 1, len(cl) - 1)][0] - cl[i][0], cl[min(i + 1, len(cl) - 1)][1] - cl[i][1])
            h1 = math.atan2(cl[min(i + 2, len(cl) - 1)][0] - cl[min(i + 1, len(cl) - 1)][0],
                            cl[min(i + 2, len(cl) - 1)][1] - cl[min(i + 1, len(cl) - 1)][1])
            dh = abs(h1 - h0)
            if dh > math.pi:
                dh = abs(dh - 2 * math.pi)
            if dh < 0.3:
                continue
            l0s, r0s = rib[i], rib[i + 1]
            acc_white.quad(
                ((l0s[0] + l0s[3]) / 2 - l0s[6] * 0.09, l0s[1] + 0.012, (l0s[2] + l0s[5]) / 2 - l0s[7] * 0.09),
                ((l0s[0] + l0s[3]) / 2 + l0s[6] * 0.09, l0s[1] + 0.012, (l0s[2] + l0s[5]) / 2 + l0s[7] * 0.09),
                ((r0s[0] + r0s[3]) / 2 + r0s[6] * 0.09, r0s[1] + 0.012, (r0s[2] + r0s[5]) / 2 + r0s[7] * 0.09),
                ((r0s[0] + r0s[3]) / 2 - r0s[6] * 0.09, r0s[1] + 0.012, (r0s[2] + r0s[5]) / 2 - r0s[7] * 0.09),
            )

""" + a2
src = src.replace(a2, add2, 1)

# ── 3. Motorway Standstreifen: dải nhựa 2.6m ngoài mép phải + vạch rời ──
a3 = """        for i in range(len(rib) - 1):
            l0, r0 = rib[i], rib[i + 1]
            acc.quad(
                (l0[0], l0[1], l0[2]), (r0[0], r0[1], r0[2]),
                (r0[3], r0[4], r0[5]), (l0[3], l0[4], l0[5]),
                uvs=[(0, l0[8]), (1, l0[8]), (1, r0[8]), (0, r0[8])],
            )"""
assert a3 in src
add3 = a3 + """

        # 🛟 Standstreifen (làn khẩn cấp 2.6m) cho motorway: dải nhựa + vạch rời Z. 295
        if hw in ('motorway',) and len(rib) >= 2:
            for i in range(len(rib) - 1):
                l0, r0 = rib[i], rib[i + 1]
                n0x, n0z = l0[6], l0[7]
                n1x, n1z = r0[6], r0[7]
                # nhựa Standstreifen bên PHẢI chiều đi (motorway oneway)
                ss0a = (l0[3] + n0x * 0.1, l0[1], l0[2] + n0z * 0.1)
                ss0b = (l0[3] + n0x * 2.7, l0[1], l0[2] + n0z * 2.7)
                ss1a = (r0[3] + n1x * 0.1, r0[1], r0[2] + n1z * 0.1)
                ss1b = (r0[3] + n1x * 2.7, r0[1], r0[2] + n1z * 2.7)
                acc2.quad(ss0a, ss0b, ss1b, ss1a)
                # vạch trắng rời tại mép làn (0.18m)
                acc_white.quad(
                    (l0[3] + n0x * 0.02, l0[1] + 0.012, l0[2] + n0z * 0.02),
                    (l0[3] + n0x * 0.2, l0[1] + 0.012, l0[2] + n0z * 0.2),
                    (r0[3] + n1x * 0.2, r0[1] + 0.012, r0[2] + n1z * 0.2),
                    (r0[3] + n1x * 0.02, r0[1] + 0.012, r0[2] + n1z * 0.02),
                )"""
src = src.replace(a3, add3, 1)

io.open(p, 'w', encoding='utf-8').write(src)
import ast
ast.parse(src)
print('road-standard patch OK')
