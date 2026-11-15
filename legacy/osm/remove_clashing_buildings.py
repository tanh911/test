import json, math

MAP_PATH = 'src/data/maps/berlin-mitte-clean.json'

with open(MAP_PATH, 'r', encoding='utf-8') as f:
    m = json.load(f)

roads = {r['id']: r for r in m['roads']}
nodes = {n['id']: n for n in m['nodes']}

def dist_pt_seg(px, pz, ax, az, bx, bz):
    dx, dz = bx - ax, bz - az
    l2 = dx*dx + dz*dz
    if l2 == 0: return math.hypot(px - ax, pz - az)
    t = max(0.0, min(1.0, ((px - ax)*dx + (pz - az)*dz) / l2))
    return math.hypot(px - (ax + t*dx), pz - (az + t*dz))

def building_corners(b):
    road = roads.get(b['roadId'])
    if not road: return None
    pts = road['points']
    s0 = b['s']
    s1 = b['s'] + b['length']
    half = (road.get('lanesForward', 1) + road.get('lanesBackward', 1)) * road.get('laneWidth', 3) / 2.0
    frontOff = half + 2.0
    backOff = frontOff + 11.0 # BUILDING_DEPTH = 11
    side = 1.0 if b['side'] == 'right' else -1.0
    
    # Sample at s0, s_mid, s1
    corners = []
    for s in (s0, s1):
        cur_s = 0.0
        for i in range(len(pts) - 1):
            p0, p1 = pts[i], pts[i+1]
            slen = math.hypot(p1[0] - p0[0], p1[1] - p0[1])
            if cur_s + slen >= s or i == len(pts) - 2:
                t = (s - cur_s) / max(0.001, slen)
                cx = p0[0] + t * (p1[0] - p0[0])
                cz = p0[1] + t * (p1[1] - p0[1])
                fx, fz = (p1[0] - p0[0]) / max(0.001, slen), (p1[1] - p0[1]) / max(0.001, slen)
                nx, nz = fz * side, -fx * side
                corners.append((cx + nx * frontOff, cz + nz * frontOff))
                corners.append((cx + nx * backOff, cz + nz * backOff))
                break
            cur_s += slen
    return corners

original_count = len(m['buildings'])
valid_buildings = []
removed_buildings = []

for b in m['buildings']:
    corners = building_corners(b)
    if not corners or len(corners) < 4:
        removed_buildings.append((b, 'invalid corners'))
        continue
    
    # Check if any corner penetrates any other road's asphalt
    clashed = False
    for other_id, other_r in roads.items():
        if other_id == b['roadId']: continue
        other_half = (other_r.get('lanesForward', 1) + other_r.get('lanesBackward', 1)) * other_r.get('laneWidth', 3) / 2.0
        opts = other_r['points']
        for i in range(len(opts) - 1):
            p0, p1 = opts[i], opts[i+1]
            for cx, cz in corners:
                d = dist_pt_seg(cx, cz, p0[0], p0[1], p1[0], p1[1])
                if d < other_half + 0.5: # penetrates other road asphalt
                    clashed = True
                    break
            if clashed: break
        if clashed: break
    
    # Also check if building penetrates near any node (crossroads)
    if not clashed:
        for nid, node in nodes.items():
            if node.get('type') == 'intersection':
                # check if corners penetrate within 7m of intersection node
                for cx, cz in corners:
                    if math.hypot(cx - node['x'], cz - node['z']) < 7.0:
                        clashed = True
                        break
                if clashed: break

    if clashed:
        removed_buildings.append((b, f"penetrates road/junction"))
    else:
        valid_buildings.append(b)

m['buildings'] = valid_buildings
print(f"Original buildings: {original_count}")
print(f"Removed clashing buildings: {len(removed_buildings)}")
print(f"Remaining valid buildings: {len(valid_buildings)}")

with open(MAP_PATH, 'w', encoding='utf-8') as f:
    json.dump(m, f, indent=2, ensure_ascii=False)

print("Saved updated map cleanly!")
