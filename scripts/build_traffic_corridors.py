import json
import math
import os

with open('src/simulation/data/road_graph.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

roads_by_id = {r['id']: r for r in data['roads']}
junctions = data['junctions']
ampels = [j for j in junctions if j.get('hasTrafficLight')]

def dist(p1, p2):
    return math.hypot(p2[0] - p1[0], p2[1] - p1[1])

def chain_to_points(seg_ids):
    pts = []
    for sid in seg_ids:
        r = roads_by_id.get(sid)
        if not r:
            continue
        c = r['centerline']
        for p in c:
            if not pts or dist(p, pts[-1]) > 5.0:
                pts.append([round(p[0], 2), round(p[1], 2)])
    return pts

def sample_ordered_points(pts, min_step=25):
    if not pts:
        return []
    res = [pts[0]]
    for p in pts[1:]:
        if dist(p, res[-1]) >= min_step:
            res.append([round(p[0], 2), round(p[1], 2)])
    if dist(pts[-1], res[-1]) > 10:
        res.append([round(pts[-1][0], 2), round(pts[-1][1], 2)])
    return res

# 1. Friedrichstraße Southbound & Northbound (Z: 1124 down to -530)
f_roads = [r for r in data['roads'] if 'Friedrich' in r.get('name', '')]
f_all = []
for r in f_roads:
    f_all.extend(r['centerline'])
f_all.sort(key=lambda p: p[1])
friedrich_nb = sample_ordered_points(f_all, 25)
friedrich_sb = [[p[0], p[1]] for p in reversed(friedrich_nb)]

# 2. Unter den Linden Eastbound (Brandenburger Tor -> Schlossbrücke -> Alexanderplatz)
linden_eb_chain = [
    'osm_seg_135', 'osm_seg_108', 'osm_seg_692', 'osm_seg_403', 'osm_seg_369',
    'osm_seg_688', 'osm_seg_322', 'osm_seg_323', 'osm_seg_606', 'osm_seg_607',
    'osm_seg_366', 'osm_seg_604', 'osm_seg_174', 'osm_seg_472',
    'osm_seg_96', 'osm_seg_60', 'osm_seg_307', 'osm_seg_77', 'osm_seg_190', 'osm_seg_266'
]
linden_eb_pts = [[-745.0, -84.0], [-700.0, -80.0]] + chain_to_points(linden_eb_chain) + [[1450.0, 480.0], [1676.0, 585.0]]
linden_eb = sample_ordered_points(linden_eb_pts, 30)

# 3. Unter den Linden Westbound (Alexanderplatz -> Karl-Liebknecht -> Schlossbrücke -> Brandenburger Tor)
linden_wb_chain = [
    'osm_seg_267', 'osm_seg_121', 'osm_seg_774', 'osm_seg_120', 'osm_seg_632',
    'osm_seg_436', 'osm_seg_308', 'osm_seg_1',
    'osm_seg_367', 'osm_seg_435', 'osm_seg_184', 'osm_seg_605',
    'osm_seg_88', 'osm_seg_61', 'osm_seg_635', 'osm_seg_636', 'osm_seg_258',
    'osm_seg_280', 'osm_seg_107'
]
linden_wb_pts = [[1676.0, 585.0], [1450.0, 480.0]] + chain_to_points(linden_wb_chain) + [[-700.0, -80.0], [-745.0, -84.0]]
linden_wb = sample_ordered_points(linden_wb_pts, 30)

# 4. Torstraße Eastbound & Westbound
t_roads = [r for r in data['roads'] if 'Tor' in r.get('name', '')]
t_all = []
for r in t_roads:
    t_all.extend(r['centerline'])
t_all.sort(key=lambda p: p[0])
tor_eb = sample_ordered_points(t_all, 30)
tor_wb = [[p[0], p[1]] for p in reversed(tor_eb)]

# 5. Wilhelmstraße Southbound & Northbound
w_roads = [r for r in data['roads'] if 'Wilhelm' in r.get('name', '')]
w_all = []
for r in w_roads:
    w_all.extend(r['centerline'])
w_all.sort(key=lambda p: p[1])
wilhelm_nb = sample_ordered_points(w_all, 30)
wilhelm_sb = [[p[0], p[1]] for p in reversed(wilhelm_nb)]

# 6. Französische Straße / Gendarmenmarkt (Zone 30 Eastbound & Westbound)
franz_chain = [
    'osm_seg_739', 'osm_seg_989', 'osm_seg_100', 'osm_seg_1031', 'osm_seg_781',
    'osm_seg_164', 'osm_seg_780', 'osm_seg_702', 'osm_seg_701', 'osm_seg_665',
    'osm_seg_776', 'osm_seg_777', 'osm_seg_992', 'osm_seg_991', 'osm_seg_990',
    'osm_seg_333', 'osm_seg_993', 'osm_seg_708', 'osm_seg_709', 'osm_seg_995',
    'osm_seg_143', 'osm_seg_994', 'osm_seg_996', 'osm_seg_808', 'osm_seg_809',
    'osm_seg_383', 'osm_seg_997', 'osm_seg_998', 'osm_seg_999', 'osm_seg_811',
    'osm_seg_810', 'osm_seg_1005', 'osm_seg_1236', 'osm_seg_1003', 'osm_seg_1004',
    'osm_seg_185'
]
franz_eb_pts = chain_to_points(franz_chain)
franz_eb = sample_ordered_points(franz_eb_pts, 25)
franz_wb = [[p[0], p[1]] for p in reversed(franz_eb)]

# 7. Hackescher Markt / Oranienburger Straße (Zone 30 Eastbound & Westbound)
o_roads = [r for r in data['roads'] if ('Oranienburger' in r.get('name', '')) and ('Tor' not in r.get('name', ''))]
o_all = []
for r in o_roads:
    o_all.extend(r['centerline'])
o_all.sort(key=lambda p: p[0])
hack_eb = sample_ordered_points(o_all, 25)
hack_wb = [[p[0], p[1]] for p in reversed(hack_eb)]

def build_corridor(cid, name_vi, name_de, points, speed_kmh, lane_offset=2.0):
    dists = [0.0]
    total_len = 0.0
    for i in range(len(points) - 1):
        seg_len = dist(points[i], points[i+1])
        total_len += seg_len
        dists.append(round(total_len, 2))
    
    lights = []
    for amp in ampels:
        c = amp['center']
        for i, pt in enumerate(points):
            if dist(c, pt) < 22.0:
                lights.append({
                    'id': amp['id'],
                    'x': round(c[0], 2),
                    'z': round(c[1], 2),
                    'pathDist': dists[i]
                })
                break
    
    seen_lights = set()
    uniq_lights = []
    for l in lights:
        if l['id'] not in seen_lights:
            seen_lights.add(l['id'])
            uniq_lights.append(l)
    
    return {
        'id': cid,
        'nameVi': name_vi,
        'nameDe': name_de,
        'speedLimitKmH': speed_kmh,
        'laneOffset': lane_offset,
        'waypoints': points,
        'segmentDists': dists,
        'totalLength': round(total_len, 2),
        'lights': uniq_lights
    }

corridors = [
    build_corridor('friedrich_southbound', 'Đại lộ Friedrichstraße (Bắc xuống Nam)', 'Friedrichstraße (Südwärts)', friedrich_sb, 50, 2.2),
    build_corridor('friedrich_northbound', 'Đại lộ Friedrichstraße (Nam lên Bắc)', 'Friedrichstraße (Nordwärts)', friedrich_nb, 50, 2.2),
    build_corridor('linden_eastbound', 'Đại lộ Unter den Linden -> Alexanderplatz (Đông)', 'Unter den Linden -> Alexanderplatz', linden_eb, 50, 2.4),
    build_corridor('linden_westbound', 'Alexanderplatz -> Unter den Linden -> Brandenburger Tor', 'Alexanderplatz -> Brandenburger Tor', linden_wb, 50, 2.4),
    build_corridor('tor_eastbound', 'Đại lộ Torstraße (Tây sang Đông)', 'Torstraße (Ostwärts)', tor_eb, 50, 2.0),
    build_corridor('tor_westbound', 'Đại lộ Torstraße (Đông sang Tây)', 'Torstraße (Westwärts)', tor_wb, 50, 2.0),
    build_corridor('wilhelm_southbound', 'Phố Wilhelmstraße (Bắc xuống Nam)', 'Wilhelmstraße (Südwärts)', wilhelm_sb, 50, 2.0),
    build_corridor('wilhelm_northbound', 'Phố Wilhelmstraße (Nam lên Bắc)', 'Wilhelmstraße (Nordwärts)', wilhelm_nb, 50, 2.0),
    build_corridor('franz_eastbound', 'Phố Französische Str. / Gendarmenmarkt (Zone 30 Đông)', 'Französische Straße / Gendarmenmarkt', franz_eb, 30, 1.8),
    build_corridor('franz_westbound', 'Phố Französische Str. / Gendarmenmarkt (Zone 30 Tây)', 'Französische Straße (Westwärts)', franz_wb, 30, 1.8),
    build_corridor('hackescher_eastbound', 'Phố Cổ Oranienburger Str. -> Hackescher Markt (Zone 30)', 'Oranienburger Str. -> Hackescher Markt', hack_eb, 30, 1.8),
    build_corridor('hackescher_westbound', 'Hackescher Markt -> Oranienburger Tor (Zone 30)', 'Hackescher Markt -> Oranienburger Tor', hack_wb, 30, 1.8)
]

print(f'Generated {len(corridors)} authentic Berlin-Mitte corridors:')
for c in corridors:
    print(f"  {c['id']}: {len(c['waypoints'])} pts, len={c['totalLength']}m, {len(c['lights'])} ampels")

output_path = 'src/simulation/data/berlinTrafficCorridors.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(corridors, f, indent=2, ensure_ascii=False)

print(f'Saved to {output_path}')
