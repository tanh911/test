import json, math

with open('src/data/maps/berlin-mitte-clean.json', 'r', encoding='utf-8') as f:
    m = json.load(f)

roads = {r['id']: r for r in m['roads']}

def dist_pt_seg(px, pz, ax, az, bx, bz):
    dx, dz = bx - ax, bz - az
    l2 = dx*dx + dz*dz
    if l2 == 0: return math.hypot(px - ax, pz - az)
    t = max(0, min(1, ((px - ax)*dx + (pz - az)*dz) / l2))
    return math.hypot(px - (ax + t*dx), pz - (az + t*dz))

clashes = []
for b in m['buildings']:
    road = roads.get(b['roadId'])
    if not road: continue
    pts = road['points']
    s = b['s'] + b['length'] / 2
    cur_s = 0
    bx, bz = None, None
    for i in range(len(pts) - 1):
        p0, p1 = pts[i], pts[i+1]
        slen = math.hypot(p1[0] - p0[0], p1[1] - p0[1])
        if cur_s + slen >= s or i == len(pts) - 2:
            t = (s - cur_s) / max(0.001, slen)
            cx = p0[0] + t * (p1[0] - p0[0])
            cz = p0[1] + t * (p1[1] - p0[1])
            fx, fz = (p1[0] - p0[0]) / slen, (p1[1] - p0[1]) / slen
            side = 1 if b['side'] == 'right' else -1
            nx, nz = fz * side, -fx * side
            half = (road.get('lanesForward', 1) + road.get('lanesBackward', 1)) * road.get('laneWidth', 3) / 2
            frontOff = half + 2.0
            bx = cx + nx * (frontOff + 5.5)
            bz = cz + nz * (frontOff + 5.5)
            break
        cur_s += slen
    
    if bx is None: continue
    for other_id, other_r in roads.items():
        if other_id == b['roadId']: continue
        other_half = (other_r.get('lanesForward', 1) + other_r.get('lanesBackward', 1)) * other_r.get('laneWidth', 3) / 2
        opts = other_r['points']
        for i in range(len(opts) - 1):
            d = dist_pt_seg(bx, bz, opts[i][0], opts[i][1], opts[i+1][0], opts[i+1][1])
            if d < other_half + 4.0:
                clashes.append((b, other_id, d, other_half))
                break

print(f'Total clashes found: {len(clashes)}')
for b, other_id, d, other_half in clashes[:25]:
    print(f"Building on {b['roadId']} side {b['side']} s={b['s']} CLASHES with road {other_id} (dist={d:.2f} vs road_half={other_half})")
