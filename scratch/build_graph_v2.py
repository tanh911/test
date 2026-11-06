# -*- coding: utf-8 -*-
"""Build road_graph_autobahn.json v2 từ autobahn_v2.osm (Overpass XML).

Output schema khớp 100% với road_graph JSON cũ (roads/junctions/waterways/railways/
parks/landmarks + metadata) để LaneGraphGenerator + ProceduralRoadGenerator đọc trực tiếp.

Chạy: python -I scratch/build_graph_v2.py
"""
import json
import math
import os
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OSM_PATH = os.path.join(ROOT, 'public', 'maps', 'autobahn_v2.osm')
OUT_PATH = os.path.join(ROOT, 'src', 'simulation', 'data', 'road_graph_autobahn.json')
BACKUP_PATH = os.path.join(ROOT, 'src', 'simulation', 'data', 'road_graph_autobahn_v1.json')

# Giữ nguyên ref của graph v1 → toạ độ world của vùng Rhynern không đổi
REF_LAT = 51.6384484860723
REF_LON = 7.872684108474258
COS_LAT = math.cos(math.radians(REF_LAT))
M_PER_DEG = 111320.0

# Trung tâm 2 cụm đô thị (world coords) — đo từ mật độ buildings OSM thật:
# Rhynern town ≈ (-350,950); Hamm ≈ (-2950,-3800)
CITY_CENTERS = [
    (-350.0, 950.0),          # Rhynern (thị trấn thật, không phải nút giao)
    (-2950.0, -3800.0),       # Hamm
]

KEEP_MAIN = {'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link'}
KEEP_MID = {'secondary', 'secondary_link', 'tertiary', 'tertiary_link'}
KEEP_LOCAL = {'residential', 'living_street', 'unclassified'}

A2_PROX_MAIN = 1800.0   # motorway/trunk/primary: giữ nếu gần A2 hoặc gần city
A2_PROX_MID = 1200.0    # secondary/tertiary
CITY_PROX_LOCAL = 1300.0  # residential: chỉ giữ quanh 2 city
MAX_ROADS = 4200
MAX_BUILDINGS = 5200
BUILDING_PROX = 1100.0
MAX_PARKS = 900
PARK_PROX = 2200.0
MIN_ROAD_LEN = 8.0

roads_out = []
junctions_out = []
waterways_out = []
railways_out = []
parks_out = []
landmarks_out = []


def to_world(lat, lon):
    x = (lon - REF_LON) * M_PER_DEG * COS_LAT
    z = (REF_LAT - lat) * M_PER_DEG
    return [round(x, 2), round(z, 2)]


def dist2(a, b):
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def dist_to_polyline(pts, poly):
    """Khoảng cách nhỏ nhất giữa BẤT KỶ điểm trong pts và các điểm poly (m)."""
    best = float('inf')
    for p in pts:
        for q in poly:
            d = dist2(p, q)
            if d < best:
                best = d
    return math.sqrt(best)


def dist_to_centers(pts):
    """Khoảng cách nhỏ nhất tới city center gần nhất (m).
    Nhận 1 điểm [x,z] HOẶC danh sách điểm [[x,z],...]."""
    if pts and isinstance(pts[0], (int, float)):
        pts = [pts]
    best = float('inf')
    for p in pts:
        for c in CITY_CENTERS:
            d = dist2(p, c)
            if d < best:
                best = d
    return math.sqrt(best)


def parse_maxspeed(v):
    if not v:
        return None
    v = v.strip().lower()
    for tok in v.replace(',', ' ').split():
        try:
            return int(float(tok))
        except ValueError:
            continue
    return None


def parse_lanes(v):
    try:
        return max(1, int(float(v)))
    except (TypeError, ValueError):
        return None


def default_lanes(hw, oneway):
    if hw == 'motorway':
        return 3 if oneway else 6
    if hw == 'motorway_link':
        return 1
    if hw in ('trunk', 'trunk_link'):
        return 2 if oneway else 4
    if hw in ('primary', 'primary_link'):
        return 2 if oneway else 3
    if hw in ('secondary', 'secondary_link'):
        return 1 if oneway else 2
    if hw == 'tertiary':
        return 2
    return 1


def main():
    global landmarks_out, parks_out
    if not os.path.exists(OSM_PATH):
        print('KHONG TIM THAY', OSM_PATH)
        sys.exit(1)

    # ── 1. Parse XML ──────────────────────────────────────────────
    nodes = {}      # osmId -> (lat, lon, tags)
    ways = []       # (osmId, refs, tags)
    print('Parsing XML...')
    for event, elem in ET.iterparse(OSM_PATH, events=('end',)):
        if elem.tag == 'node':
            nid = int(elem.get('id'))
            tags = {}
            for t in elem.findall('tag'):
                tags[t.get('k')] = t.get('v')
            nodes[nid] = (float(elem.get('lat')), float(elem.get('lon')), tags)
            elem.clear()
        elif elem.tag == 'way':
            tags = {}
            refs = []
            for child in elem:
                if child.tag == 'nd':
                    refs.append(int(child.get('ref')))
                elif child.tag == 'tag':
                    tags[child.get('k')] = child.get('v')
            ways.append((int(elem.get('id')), refs, tags))
            elem.clear()
    print('nodes:', len(nodes), 'ways:', len(ways))

    # ── 2. Lấy polyline A2 (motorway) làm trục trim ────────────────
    a2_points = []
    for wid, refs, tags in ways:
        if tags.get('highway') == 'motorway':
            for nid in refs:
                if nid in nodes:
                    a2_points.append(to_world(nodes[nid][0], nodes[nid][1]))
    print('A2 polyline points:', len(a2_points))
    if not a2_points:
        print('KHONG CO MOTORWAY!')
        sys.exit(1)

    def near_a2(pts, r):
        # pts = danh sách điểm của way: đủ nếu BẤT KỶ điểm nào nằm trong bán kính r của A2
        return dist_to_polyline(pts, a2_points) <= r

    # ── 3. Chọn road ways: MỌI way đúng class trong bbox (KHÔNG trim vùng) ──
    # Trim vùng cũ làm vỡ kết nối OSM (34 components) → routing/guidance/bots gãy.
    # Số way ~3.4k vẫn ổn hiệu năng (render batched + corridor filter phía sim).
    kept = []
    for wid, refs, tags in ways:
        hw = tags.get('highway')
        if not hw:
            continue
        if tags.get('tunnel') in ('yes', 'true'):
            continue
        if hw not in (KEEP_MAIN | KEEP_MID | KEEP_LOCAL):
            continue
        pts = []
        for nid in refs:
            if nid in nodes:
                pts.append(to_world(nodes[nid][0], nodes[nid][1]))
        if len(pts) < 2:
            continue
        kept.append((wid, refs, tags, pts, hw))

    # Chỉ cap khi vượt an toàn hiệu năng (ưu tiên đường dài)
    if len(kept) > MAX_ROADS:
        kept.sort(key=lambda k: -sum(math.dist(k[3][i - 1], k[3][i]) for i in range(1, len(k[3]))))
        kept = kept[:MAX_ROADS]
    print('roads kept:', len(kept))

    # ── 4. Node usage → junctions ─────────────────────────────────
    usage = {}
    for wid, refs, tags, pts, hw in kept:
        for nid in refs:
            usage[nid] = usage.get(nid, 0) + 1

    signal_nodes = []
    for nid, (lat, lon, tags) in nodes.items():
        if tags.get('highway') == 'traffic_signals':
            signal_nodes.append((nid, to_world(lat, lon)))

    for nid, cnt in usage.items():
        if cnt >= 2 and nid in nodes:
            lat, lon, _ = nodes[nid]
            p = to_world(lat, lon)
            junctions_out.append({
                'id': 'junc_node_%d' % nid,
                'osmNodeId': nid,
                'center': p,
                'x': p[0],
                'z': p[1],
                'lat': lat,
                'lon': lon,
                'degree': cnt,
            })

    # Gắn traffic_signals vào junction gần nhất ≤ 20m
    for j in junctions_out:
        for nid, p in signal_nodes:
            if dist2(p, [j['x'], j['z']]) <= 20 * 20:
                j['trafficSignals'] = True
                break
    n_signals = sum(1 for j in junctions_out if j.get('trafficSignals'))
    print('junctions:', len(junctions_out), 'signalized:', n_signals)

    # ── 5. Dựng roads[] ───────────────────────────────────────────
    for wid, refs, tags, pts, hw in kept:
        # Bỏ mảnh quá ngắn
        length = sum(math.dist(pts[i - 1], pts[i]) for i in range(1, len(pts)))
        if length < MIN_ROAD_LEN:
            continue
        oneway_raw = tags.get('oneway', '').strip().lower()
        if hw in ('motorway', 'motorway_link', 'trunk', 'trunk_link'):
            oneway = oneway_raw != 'no'
        else:
            oneway = oneway_raw in ('yes', 'true', '1')
        reverse = oneway_raw == '-1'
        if reverse:
            pts = list(reversed(pts))
        # 🌉 DENSIFY: bridge/layer road cần vertex dày (~15m) để profile mô dốc cầu
        # render đúng (2 điểm thẳng thì mặt cầu bị phẳng rìa). Cầu dùng chung cho
        # đường cắt qua A2/sông — densify mọi road giữ chi phí ổn định.
        is_bridge_way = tags.get('bridge') in ('yes', 'true', '1', 'viaduct')
        if is_bridge_way:
            densified = [pts[0]]
            for i in range(1, len(pts)):
                ax, az = densified[-1]
                bx, bz = pts[i]
                seg = math.hypot(bx - ax, bz - az)
                steps = max(1, math.ceil(seg / 15.0))
                for s in range(1, steps + 1):
                    densified.append([ax + (bx - ax) * s / steps, az + (bz - az) * s / steps])
            pts = densified
        lanes = parse_lanes(tags.get('lanes')) or default_lanes(hw, oneway)
        speed = parse_maxspeed(tags.get('maxspeed'))
        if hw == 'motorway':
            speed = speed or 130
        elif hw == 'motorway_link':
            speed = speed or 60
        elif hw in ('trunk', 'primary'):
            speed = speed or 100
        else:
            speed = speed or 50
        lane_width = 3.5 if hw != 'motorway' else 3.75
        name = tags.get('name', '')
        if not name and tags.get('ref'):
            name = tags['ref']
        road = {
            'id': 'way_%d' % wid,
            'osmWayId': wid,
            'name': name or ('A2 Motorway' if hw == 'motorway' else hw),
            'highway': hw,
            'ref': tags.get('ref', ''),
            'destination': tags.get('destination', ''),
            'destinationRef': tags.get('destination:ref', ''),
            'lanes': lanes,
            'laneWidth': lane_width,
            'speedLimit': speed,
            'oneway': oneway,
            'bridge': tags.get('bridge') in ('yes', 'true', '1', 'viaduct'),
            'layer': max(0, parse_lanes(tags.get('layer')) or 0),
            'tunnel': False,
            'startNode': 'node_%d' % refs[0],
            'endNode': 'node_%d' % refs[-1],
            'nodes': ['node_%d' % n for n in refs],
            'centerline': pts,
            'latlonPolyline': [[nodes[nid][0], nodes[nid][1]] for nid in refs if nid in nodes],
            'length': round(length, 1),
            'lengthMeters': round(length, 1),
            'width': round(lanes * lane_width + (1.0 if hw in ('motorway', 'motorway_link') else 0.5), 2),
            'tags': {'maxspeed': tags.get('maxspeed', ''), 'oneway': oneway_raw},
        }
        roads_out.append(road)

    # ── 6. Waterways / railways ───────────────────────────────────
    for wid, refs, tags in ways:
        hw_water = tags.get('waterway')
        hw_rail = tags.get('railway')
        if not hw_water and not (hw_rail in ('rail', 'tram')):
            continue
        pts = [to_world(nodes[nid][0], nodes[nid][1]) for nid in refs if nid in nodes]
        if len(pts) < 2:
            continue
        closed = refs[0] == refs[-1]
        if hw_water:
            if near_a2(pts, 2500) or dist_to_centers(pts) <= 2000:
                width = {'riverbank': 40, 'river': 30, 'canal': 25, 'stream': 6, 'ditch': 4}.get(hw_water, 18)
                waterways_out.append({
                    'id': 'water_%d' % wid, 'osmWayId': wid,
                    'waterway': hw_water, 'points': pts,
                    'isClosed': closed and len(pts) >= 3,
                    'width': width,
                })
        if hw_rail:
            if near_a2(pts, 2500) or dist_to_centers(pts) <= 2000:
                railways_out.append({
                    'id': 'rail_%d' % wid, 'osmWayId': wid,
                    'railway': hw_rail, 'points': pts, 'isClosed': False,
                })
    print('waterways:', len(waterways_out), 'railways:', len(railways_out))

    # ── 7. Parks (forest/meadow/wood) + Buildings (landmarks) ─────
    for wid, refs, tags in ways:
        landuse = tags.get('landuse')
        natural = tags.get('natural')
        building = tags.get('building')
        if not landuse and not natural and not building:
            continue
        pts = [to_world(nodes[nid][0], nodes[nid][1]) for nid in refs if nid in nodes]
        if building:
            # Building: closed polygon quanh 2 city center
            if refs and refs[0] == refs[-1] and len(pts) >= 4:
                if dist_to_centers(pts) <= BUILDING_PROX:
                    poly = pts[:-1] if pts[0] == pts[-1] else pts
                    # Đơn giản hoá polygon dài
                    if len(poly) > 16:
                        poly = poly[::2]
                    if len(poly) >= 3:
                        levels = parse_lanes(tags.get('building:levels'))
                        height = levels * 3.2 if levels else 9.0
                        landmarks_out.append({
                            'id': 'bld_%d' % wid, 'osmWayId': wid,
                            'name': tags.get('name', 'Building'),
                            'category': 'building',
                            'points': poly,
                            'height': round(height, 1),
                        })
        else:
            green = (landuse in ('forest', 'meadow', 'village_green', 'orchard', 'grass')) or (natural == 'wood')
            if green and refs and refs[0] == refs[-1] and len(pts) >= 4:
                p0 = pts[0]
                if near_a2([p0], PARK_PROX) or dist_to_centers([p0]) <= PARK_PROX:
                    poly = pts[:-1] if pts[0] == pts[-1] else pts
                    if len(poly) > 24:
                        poly = poly[::2]
                    if len(poly) >= 3:
                        parks_out.append({
                            'id': 'park_%d' % wid, 'osmWayId': wid,
                            'name': tags.get('name', 'Grünfläche'),
                            'category': landuse or natural,
                            'points': poly,
                        })

    # Cap buildings/parks theo khoảng cách tới city center gần nhất
    if len(landmarks_out) > MAX_BUILDINGS:
        landmarks_out.sort(key=lambda b: dist_to_centers(b['points'][0]))
        landmarks_out = landmarks_out[:MAX_BUILDINGS]
    if len(parks_out) > MAX_PARKS:
        parks_out.sort(key=lambda p: dist_to_centers(p['points'][0]))
        parks_out = parks_out[:MAX_PARKS]
    print('buildings:', len(landmarks_out), 'parks:', len(parks_out))

    # ── 8. Bounds + metadata + ghi file ───────────────────────────
    all_pts = []
    for r in roads_out:
        all_pts.extend(r['centerline'])
    xs = [p[0] for p in all_pts]
    zs = [p[1] for p in all_pts]
    graph = {
        'metadata': {
            'id': 'autobahn_rhynern_v2',
            'name': 'Autobahn A2 Hamm/Rhynern/Bönen OSM Real Map v2',
            'source': 'public/maps/autobahn_v2.osm',
            'refLat': REF_LAT,
            'refLon': REF_LON,
            'bounds': {'minX': min(xs), 'maxX': max(xs), 'minZ': min(zs), 'maxZ': max(zs)},
            'wayCount': len(roads_out),
            'roadCount': len(roads_out),
            'nodeCount': len(usage),
            'junctionCount': len(junctions_out),
            'signalizedJunctions': n_signals,
            'buildings': len(landmarks_out),
            'generatedAt': __import__('datetime').datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
        },
        'nodes': {},
        'roads': roads_out,
        'junctions': junctions_out,
        'waterways': waterways_out,
        'railways': railways_out,
        'parks': parks_out,
        'landmarks': landmarks_out,
    }
    if os.path.exists(OUT_PATH) and not os.path.exists(BACKUP_PATH):
        os.rename(OUT_PATH, BACKUP_PATH)
        print('backup old graph ->', BACKUP_PATH)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(graph, f, ensure_ascii=False, separators=(',', ':'))
    size_mb = os.path.getsize(OUT_PATH) / 1048576
    print('WROTE %s (%.1f MB)' % (OUT_PATH, size_mb))
    print('roads:', len(roads_out), 'junctions:', len(junctions_out), 'signals:', n_signals)


if __name__ == '__main__':
    main()
