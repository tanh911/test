# -*- coding: utf-8 -*-
"""THIẾT KẾ MAP TẬP LÁI COMPACT — 800m × 600m — tất cả tình huống thi trong 1 vòng.

Layout:
  ┌──────────────────── A2 Autobahn (2×2 lane) ────────────────────┐
  │ ═════════════╡Auff╞════════════════╡Aus╞═════════════════════ │
  └───────────────┬──────────────────────┬─────────────────────────┘
                  │ Verbindungstraße     │ Ausfahrtstraße
  ┌───────────────┼──────────────────────┼───────────────────────┐
  │ ══ Hauptstraße ╪══════╗   ╔═══════╪═══ Kreuzstraße ══════ │
  │ ══ (traffic)   ║ Ring ║   ║ RvL   ║   ║ (stop/prio)      │
  │ ══ Bahnhofstr. ║══════╝   ╚═══════╪═════                  │
  │        ┌───────┘                  │                       │
  │   Schulstraße ════════════════════┘                       │
  └───────────────────────────────────────────────────────────┘

5 giao lộ:
  1. Haupt × Bahnhof  = TRAFFIC LIGHT (ampel)
  2. Ring × Kreuz     = ROUNDABOUT (Kreisverkehr)
  3. Kreuz × Verbindung = RIGHT-BEFORE-LEFT
  4. Haupt × Verbindung = PRIORITY ROAD (Vorfahrt)
  5. Kreuz × Ausfahrt = STOP sign

Route thi: Spawn Bahnhof → Hauptstraße → Ring → Kreuz → Verbindung → A2 → Ausfahrt → về
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ═══════════════ LAYOUT: toạ độ graph (x đông, z nam) ═══════════════
# Tất cả toạ độ meter, tâm map tại (0,0)

W_MAIN = 14      # Hauptstraße 2×2 lane + median
W_SECONDARY = 10  # đường phố 2 chiều
W_CONNECT = 12   # Verbindungstraße (2 lane)
W_A2 = 32        # A2 full width (2×3 lane + median)
W_RAMP = 8       # ramp nhập/thoát


def snap_node(p):
    """Snap toạ độ → node ID chia sẻ (grid 5m) — roads gặp nhau = cùng node"""
    return f'node_{int(round(p[0]/5))}_{int(round(p[1]/5))}'


def road(name, hw, centerline, lanes, oneway=False, bridge=False, layer=0,
         speed=50, dest='', ref=''):
    cl = [[round(p[0], 2), round(p[1], 2)] for p in centerline]
    length = sum(math.hypot(cl[i][0] - cl[i-1][0], cl[i][1] - cl[i-1][1])
                 for i in range(1, len(cl)))
    width = round(lanes * 3.5 + (1.0 if hw in ('motorway', 'motorway_link') else 0.5), 2)
    return {
        'id': f'way_{name}', 'osmWayId': 0, 'name': name, 'highway': hw,
        'ref': ref, 'destination': dest, 'destinationRef': '',
        'lanes': lanes, 'laneWidth': 3.5, 'speedLimit': speed,
        'oneway': oneway, 'bridge': bridge, 'layer': layer, 'tunnel': False,
        'startNode': snap_node(cl[0]), 'endNode': snap_node(cl[-1]),
        'nodes': [snap_node(p) for p in cl],
        'centerline': cl, 'latlonPolyline': [],
        'length': round(length, 1), 'lengthMeters': round(length, 1),
        'width': width, 'tags': {},
    }


def build_training_map():
    roads = []

    # ═══ PHỐ THỊ (600×500m, tâm tại (-200, 200)) ═══
    # Hauptstraße: N→S, x = -400, z từ 0 → 400 (2 chiều, 2 lane)
    roads.append(road('Hauptstraße_N', 'primary',
                      [[-400, 0], [-400, 200]], 2, speed=50, ref='K 1'))
    roads.append(road('Hauptstraße_S', 'primary',
                      [[-400, 200], [-400, 400]], 2, speed=50, ref='K 1'))
    # Bahnhofstraße: N→S, x = 0, z từ 0 → 400
    roads.append(road('Bahnhofstraße_N', 'secondary',
                      [[0, 0], [0, 200]], 2, speed=50))
    roads.append(road('Bahnhofstraße_S', 'secondary',
                      [[0, 200], [0, 400]], 2, speed=50))
    # Kreuzstraße: E→W, z = 200, x từ -400 → 200
    roads.append(road('Kreuzstraße_W', 'secondary',
                      [[-400, 200], [-200, 200]], 2, speed=50))
    roads.append(road('Kreuzstraße_E', 'secondary',
                      [[-200, 200], [0, 200]], 2, speed=50))
    # Schulstraße: E→W, z = 400, x từ -400 → 0
    roads.append(road('Schulstraße', 'residential',
                      [[-400, 400], [0, 400]], 1, speed=30))
    # Ringstraße: N→S, x = -200, z từ 200 → 400 (qua roundabout)
    roads.append(road('Ringstraße_N', 'residential',
                      [[-200, 200], [-200, 300]], 1, speed=30))
    roads.append(road('Ringstraße_S', 'residential',
                      [[-200, 300], [-200, 400]], 1, speed=30))

    # ═══ VERBINDUNGSTRASSE: nối phố → A2 (x = 200 → 500, z = 200 → 100) ═══
    roads.append(road('Verbindungstraße', 'primary',
                      [[0, 200], [200, 200], [350, 180], [500, 150]],
                      2, speed=50, dest='A 2 Hamm/Bielefeld'))

    # ═══ A2 AUTOBAHN (E→W và W→E, z = 0, x từ -800 → 800) ═══
    # Eastbound (traffic → đông)
    roads.append(road('A2_East_1', 'motorway',
                      [[-800, -30], [-500, -20], [-200, -10], [100, 0],
                       [400, 10], [700, 20], [800, 25]],
                      3, oneway=True, speed=130, ref='A 2'))
    # Westbound (traffic → tây)
    roads.append(road('A2_West_1', 'motorway',
                      [[800, 80], [500, 70], [200, 60], [-100, 50],
                       [-400, 40], [-700, 30], [-800, 25]],
                      3, oneway=True, speed=130, ref='A 2'))

    # ═══ AUFFAHRT (ramp: Verbindungstraße → A2 eastbound) ═══
    roads.append(road('Auffahrt_Ramp', 'motorway_link',
                      [[500, 150], [550, 100], [580, 40], [590, -10]],
                      1, oneway=True, speed=60, dest='A 2 Bielefeld/Hamm'))

    # ═══ AUSFAHRT (ramp: A2 westbound → Ausfahrtstraße → phố) ═══
    roads.append(road('Ausfahrt_Ramp', 'motorway_link',
                      [[-100, 50], [-150, 100], [-180, 160], [-200, 200]],
                      1, oneway=True, speed=60, dest='Rhynern Zentrum'))

    # (Ausfahrtstraße cũ bị XÓA: centerline 2 điểm trùng → length 0 → NaN elevation
    #  → quad khổng lồ phủ trắng map. Ausfahrt_Ramp đã nối thẳng vào (-200,200) = Kreuzstraße)

    # ═══ Landstraße (quanh thị trấn,Practice 100km/h) ═══
    roads.append(road('Landstraße_Süd', 'primary',
                      [[-800, 400], [-400, 420], [0, 440], [400, 460], [800, 480]],
                      2, speed=100, ref='B 1'))
    roads.append(road('Landstraße_Nord', 'primary',
                      [[-800, -100], [-400, -80], [0, -60], [400, -40], [800, -20]],
                      2, speed=100, ref='B 1'))

    return roads


# ═══════════════ JUNCTIONS ═══════════════
def build_junctions(roads):
    # Tự động: node chia sẻ giữa ≥ 2 roads
    node_map = {}
    for r in roads:
        for i, nid in enumerate(r['nodes']):
            node_map.setdefault(nid, {'roads': [], 'pos': r['centerline'][i]})
            node_map[nid]['roads'].append(r['id'])

    junctions = []
    for nid, info in node_map.items():
        if len(info['roads']) >= 2:
            junctions.append({
                'id': f'junc_{nid}', 'osmNodeId': 0,
                'center': [info['pos'][0], info['pos'][1]],
                'x': info['pos'][0], 'z': info['pos'][1],
                'lat': 0, 'lon': 0, 'degree': len(info['roads']),
                'roads': info['roads'],
                # 🚦 2 giao lộ có đèn: Haupt×Kreuz (-400,200) + Bahnhof×Kreuz (0,200)
                'trafficSignals': (abs(info['pos'][0] - (-400)) < 3 and abs(info['pos'][1] - 200) < 3) or (abs(info['pos'][0] - 0) < 3 and abs(info['pos'][1] - 200) < 3),
            })
    return junctions


def main():
    roads = build_training_map()
    junctions = build_junctions(roads)

    all_pts = [p for r in roads for p in r['centerline']]
    xs = [p[0] for p in all_pts]
    zs = [p[1] for p in all_pts]

    graph = {
        'metadata': {
            'id': 'training_circuit_v1',
            'name': 'Fahrschule Training Circuit — Kompakt map cho học lái',
            'source': 'custom_designed',
            'refLat': 51.6384, 'refLon': 7.8727,
            'bounds': {'minX': min(xs), 'maxX': max(xs), 'minZ': min(zs), 'maxZ': max(zs)},
            'wayCount': len(roads), 'roadCount': len(roads),
            'nodeCount': len(node_map) if 'node_map' in dir() else 0,
            'junctionCount': len(junctions),
        },
        'nodes': {},
        'roads': roads,
        'junctions': junctions,
        'waterways': [], 'railways': [], 'parks': [], 'landmarks': [],
    }

    out = os.path.join(ROOT, 'src', 'simulation', 'data', 'road_graph_training.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(graph, f, ensure_ascii=False, separators=(',', ':'))
    print(f'WROTE {out} ({os.path.getsize(out)/1024:.0f} KB)')
    print(f'roads: {len(roads)}, junctions: {len(junctions)}')
    print(f'bounds: X[{min(xs):.0f},{max(xs):.0f}] Z[{min(zs):.0f},{max(zs):.0f}]')


if __name__ == '__main__':
    main()
