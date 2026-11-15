"""
OpenStreetMap (OSM) PBF to Unified RoadGraph Converter
"""

import os
import sys
import json
import math
import re
import subprocess

PBF_FILENAME = "planet_13.20,52.40_13.45,52.55.osm.pbf"

PBF_MIN_LON = 13.33
PBF_MIN_LAT = 52.48
PBF_MAX_LON = 13.44
PBF_MAX_LAT = 52.54

REF_LAT = 52.5170   # Friedrichstraße / Unter den Linden
REF_LON = 13.3888

R_EARTH = 6378137.0

BOUNDS_MIN_X = None
BOUNDS_MAX_X = None
BOUNDS_MIN_Z = None
BOUNDS_MAX_Z = None


def latlon_to_metric(lat, lon, ref_lat=REF_LAT, ref_lon=REF_LON):
    d_lat = math.radians(lat - ref_lat)
    d_lon = math.radians(lon - ref_lon)
    x = d_lon * R_EARTH * math.cos(math.radians(ref_lat))
    z = d_lat * R_EARTH
    return x, z


BOUNDS_MIN_X, BOUNDS_MIN_Z = latlon_to_metric(PBF_MIN_LAT, PBF_MIN_LON)
BOUNDS_MAX_X, BOUNDS_MAX_Z = latlon_to_metric(PBF_MAX_LAT, PBF_MAX_LON)


def ensure_pbf_extracted():
    base_dir = os.path.dirname(__file__)
    pbf_path = os.path.join(base_dir, "..", "public", "maps", PBF_FILENAME)
    extracted_json = os.path.join(base_dir, "osm_pbf_extracted.json")
    extractor_script = os.path.join(base_dir, "extract_pbf.cjs")

    if not os.path.exists(pbf_path):
        raise FileNotFoundError(f"Missing PBF file: {pbf_path}")

    need_extract = False
    if not os.path.exists(extracted_json):
        need_extract = True
    elif os.path.getmtime(pbf_path) > os.path.getmtime(extracted_json):
        need_extract = True

    if need_extract:
        print("[OSM Pipeline] Extracting raw OSM geometry from PBF binary via Node.js...")
        res = subprocess.run(["node", extractor_script], capture_output=True, text=True)
        if res.returncode != 0:
            print(f"[ERROR] PBF extraction failed:\n{res.stderr}")
            sys.exit(1)
        print(f"[OSM Pipeline] PBF extraction completed successfully.")


def clip_polyline_to_bounds(pts, min_x, max_x, min_z, max_z):
    INSIDE = 0
    LEFT = 1
    RIGHT = 2
    BOTTOM = 4
    TOP = 8

    def compute_code(x, z):
        code = INSIDE
        if x < min_x: code |= LEFT
        elif x > max_x: code |= RIGHT
        if z < min_z: code |= BOTTOM
        elif z > max_z: code |= TOP
        return code

    def clip_segment(p1, p2):
        x1, z1 = p1[0], p1[1]
        x2, z2 = p2[0], p2[1]
        code1 = compute_code(x1, z1)
        code2 = compute_code(x2, z2)
        accept = False

        while True:
            if code1 == 0 and code2 == 0:
                accept = True
                break
            elif (code1 & code2) != 0:
                break
            else:
                code_out = code1 if code1 != 0 else code2
                if code_out & TOP:
                    x = x1 + (x2 - x1) * (max_z - z1) / (z2 - z1) if z2 != z1 else x1
                    z = max_z
                elif code_out & BOTTOM:
                    x = x1 + (x2 - x1) * (min_z - z1) / (z2 - z1) if z2 != z1 else x1
                    z = min_z
                elif code_out & RIGHT:
                    z = z1 + (z2 - z1) * (max_x - x1) / (x2 - x1) if x2 != x1 else z1
                    x = max_x
                elif code_out & LEFT:
                    z = z1 + (z2 - z1) * (min_x - x1) / (x2 - x1) if x2 != x1 else z1
                    x = min_x

                if code_out == code1:
                    x1, z1 = x, z
                    code1 = compute_code(x1, z1)
                else:
                    x2, z2 = x, z
                    code2 = compute_code(x2, z2)

        if accept:
            return [round(x1, 2), round(z1, 2)], [round(x2, 2), round(z2, 2)]
        return None

    sub_lines = []
    current_sub = []

    for i in range(len(pts) - 1):
        seg = clip_segment(pts[i], pts[i+1])
        if seg:
            cp1, cp2 = seg
            if not current_sub:
                current_sub.append(cp1)
            elif math.hypot(current_sub[-1][0] - cp1[0], current_sub[-1][1] - cp1[1]) > 0.01:
                if len(current_sub) >= 2:
                    sub_lines.append(current_sub)
                current_sub = [cp1]
            current_sub.append(cp2)
        else:
            if len(current_sub) >= 2:
                sub_lines.append(current_sub)
            current_sub = []

    if len(current_sub) >= 2:
        sub_lines.append(current_sub)

    return sub_lines


def clip_polygon_to_bounds(pts, min_x, max_x, min_z, max_z):
    poly = pts
    edges = [
        (lambda p: p[0] >= min_x, lambda p1, p2: [min_x, round(p1[1] + (p2[1]-p1[1])*(min_x-p1[0])/(p2[0]-p1[0]), 2) if p2[0]!=p1[0] else p1[1]]),
        (lambda p: p[0] <= max_x, lambda p1, p2: [max_x, round(p1[1] + (p2[1]-p1[1])*(max_x-p1[0])/(p2[0]-p1[0]), 2) if p2[0]!=p1[0] else p1[1]]),
        (lambda p: p[1] >= min_z, lambda p1, p2: [round(p1[0] + (p2[0]-p1[0])*(min_z-p1[1])/(p2[1]-p1[1]), 2) if p2[1]!=p1[1] else p1[0], min_z]),
        (lambda p: p[1] <= max_z, lambda p1, p2: [round(p1[0] + (p2[0]-p1[0])*(max_z-p1[1])/(p2[1]-p1[1]), 2) if p2[1]!=p1[1] else p1[0], max_z]),
    ]

    for inside_fn, intersect_fn in edges:
        if not poly:
            break
        output = []
        s = poly[-1]
        for p in poly:
            if inside_fn(p):
                if inside_fn(s):
                    output.append(p)
                else:
                    output.append(intersect_fn(s, p))
                    output.append(p)
            elif inside_fn(s):
                output.append(intersect_fn(s, p))
            s = p
        poly = output

    return poly


def build_real_osm_roadgraph(extracted_filename="osm_pbf_extracted_stadt.json", out_filename="road_graph.json"):
    base_dir = os.path.dirname(__file__)
    json_path = os.path.join(base_dir, extracted_filename)

    if not os.path.exists(json_path):
        ensure_pbf_extracted()

    print(f"[OSM Pipeline] Loading extracted OSM data from: {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_nodes = data.get("nodes", {})
    raw_nodes_list = list(raw_nodes.values()) if isinstance(raw_nodes, dict) else (raw_nodes if isinstance(raw_nodes, list) else [])

    if "stadt" in extracted_filename.lower():
        ref_lat_center = REF_LAT
        ref_lon_center = REF_LON
    else:
        lats = [n["lat"] for n in raw_nodes_list if isinstance(n, dict) and "lat" in n]
        lons = [n["lon"] for n in raw_nodes_list if isinstance(n, dict) and "lon" in n]
        ref_lat_center = sum(lats) / len(lats) if lats else REF_LAT
        ref_lon_center = sum(lons) / len(lons) if lons else REF_LON

    def local_latlon_to_metric(lat, lon):
        return latlon_to_metric(lat, lon, ref_lat_center, ref_lon_center)

    nodes = {}
    if isinstance(raw_nodes, dict):
        for nid_str, ndata in raw_nodes.items():
            nid = int(nid_str) if str(nid_str).isdigit() else nid_str
            x, z = local_latlon_to_metric(ndata["lat"], ndata["lon"])
            node_obj = {**ndata, "id": nid, "x": x, "z": z}
            nodes[nid] = node_obj
    elif isinstance(raw_nodes, list):
        for ndata in raw_nodes:
            nid = ndata["id"]
            x, z = local_latlon_to_metric(ndata["lat"], ndata["lon"])
            node_obj = {**ndata, "x": x, "z": z}
            nodes[nid] = node_obj

    if nodes:
        all_xs = [n["x"] for n in nodes.values()]
        all_zs = [n["z"] for n in nodes.values()]
        bounds_min_x = min(all_xs) - 50
        bounds_max_x = max(all_xs) + 50
        bounds_min_z = min(all_zs) - 50
        bounds_max_z = max(all_zs) + 50
    else:
        bounds_min_x, bounds_max_x = BOUNDS_MIN_X, BOUNDS_MAX_X
    raw_ways = data.get("ways", [])
    print(f"[OSM Pipeline] Loaded {len(raw_ways)} raw ways and {len(nodes)} nodes from PBF.")

    used_nodes = set()
    for w in raw_ways:
        used_nodes.update(w.get("nodes", []))
    missing = used_nodes - set(nodes.keys())
    if missing:
        print(f"[OSM Pipeline] WARNING: Missing nodes: {len(missing)} / {len(used_nodes)}")
    else:
        print(f"[OSM Pipeline] SUCCESS: All {len(used_nodes)} used nodes present in extracted data.")

    ALWAYS_EXCLUDED = {
        "footway", "steps", "path", "cycleway", "bridleway",
        "proposed", "construction", "raceway", "bus_guideway",
        "corridor", "platform", "escape"
    }

    drivable_ways = []
    node_degree = {}

    for w in raw_ways:
        tags = w.get("tags", {})
        if "highway" not in tags:
            continue

        hw = tags["highway"]

        if hw in ALWAYS_EXCLUDED:
            continue

        if hw == "service":
            svc = tags.get("service", "")
            if svc in ("parking_aisle", "driveway", "emergency_access", "parking"):
                continue

        if hw == "pedestrian":
            motor = tags.get("motor_vehicle", tags.get("motorcar", ""))
            if motor not in ("yes", "designated", "permissive"):
                continue

        valid_nodes = [nid for nid in w["nodes"] if nid in nodes]
        if len(valid_nodes) < 2:
            continue

        pts = [[nodes[nid]["x"], nodes[nid]["z"]] for nid in valid_nodes]

        in_bounds = any(
            bounds_min_x <= p[0] <= bounds_max_x and
            bounds_min_z <= p[1] <= bounds_max_z
            for p in pts
        )
        if not in_bounds:
            continue

        drivable_ways.append(w)
        for nid in valid_nodes:
            node_degree[nid] = node_degree.get(nid, 0) + 1

    print(f"[OSM Pipeline] Filtered to {len(drivable_ways)} drivable ways within the PBF boundary.")

    # ══════════════════════════════════════════════════════════════════
    # 2. JUNCTION DETECTION (strict v3)
    # ══════════════════════════════════════════════════════════════════

    node_way_set = {}
    for w_idx, w in enumerate(drivable_ways):
        for nid in w["nodes"]:
            if nid not in nodes:
                continue
            if nid not in node_way_set:
                node_way_set[nid] = set()
            node_way_set[nid].add(w_idx)

    node_way_names = {}
    for nid, way_idxs in node_way_set.items():
        names = set()
        for w_idx in way_idxs:
            name = drivable_ways[w_idx].get("tags", {}).get("name", "")
            if name:
                names.add(name.lower().strip())
        node_way_names[nid] = names

    junction_node_ids = set()
    link_types = {
        "motorway_link", "trunk_link", "primary_link",
        "secondary_link", "tertiary_link"
    }

    for nid, way_idxs in node_way_set.items():
        if len(way_idxs) >= 3:
            junction_node_ids.add(nid)
            continue

        if len(way_idxs) == 2:
            names = node_way_names.get(nid, set())
            if len(names) >= 2:
                junction_node_ids.add(nid)
            elif len(names) == 1:
                hw_types = set()
                for w_idx in way_idxs:
                    hw = drivable_ways[w_idx].get("tags", {}).get("highway", "")
                    hw_types.add(hw)
                if hw_types & link_types:
                    junction_node_ids.add(nid)
            elif len(names) == 0:
                junction_node_ids.add(nid)

    print(f"[OSM Pipeline] Identified {len(junction_node_ids)} topological junction nodes (strict v3).")

    # ══════════════════════════════════════════════════════════════════
    # 3. EXTRACT ROAD SEGMENTS
    # ══════════════════════════════════════════════════════════════════

    raw_segments = []
    seg_idx = 0

    for w in drivable_ways:
        tags = w.get("tags", {})
        hw = tags["highway"]
        name = tags.get("name", f"Straße ({hw})")
        w_nodes = [nid for nid in w["nodes"] if nid in nodes]

        def parse_first_number(value):
            if value is None:
                return None
            try:
                text = str(value).strip().replace(",", ".")
                match = re.search(r"[-+]?\d+(?:\.\d+)?", text)
                return float(match.group(0)) if match else None
            except Exception:
                return None

        def parse_lane_count(value):
            value_num = parse_first_number(value)
            if value_num is None:
                return None
            return max(1, int(round(value_num)))

        def lane_width_for(highway_type):
            if highway_type in ["motorway", "trunk", "primary"]:
                return 3.50
            if highway_type in ["secondary", "tertiary"]:
                return 3.25
            return 3.00

        explicit_width = parse_first_number(tags.get("width"))
        lanes = parse_lane_count(tags.get("lanes"))
        lanes_fwd = parse_lane_count(tags.get("lanes:forward"))
        lanes_bwd = parse_lane_count(tags.get("lanes:backward"))
        has_lane_data = lanes is not None or lanes_fwd is not None or lanes_bwd is not None

        if lanes is None and (lanes_fwd is not None or lanes_bwd is not None):
            lanes = (lanes_fwd or 0) + (lanes_bwd or 0)

        lane_width = lane_width_for(hw)

        if explicit_width is not None and explicit_width >= 1.0:
            width = explicit_width
            width_source = "OSM:width"
        elif has_lane_data and lanes is not None and lanes > 0:
            width = lanes * lane_width
            width_source = "derived:lanes"
        else:
            defaults = {
                "motorway": 10.50, "trunk": 7.00, "primary": 7.00,
                "secondary": 6.50, "tertiary": 6.50, "unclassified": 6.00,
                "residential": 6.00, "living_street": 5.50
            }
            width = defaults.get(hw, 6.00)
            width_source = "derived:highway-default"

        if width <= 0:
            width = lane_width
            width_source = "derived:default"

        width = float(width)

        if lanes is None:
            lanes = max(1, int(round(width / lane_width)))

        speed_limit = 50
        parsed_speed = parse_first_number(tags.get("maxspeed"))
        if parsed_speed is not None:
            speed_limit = int(round(parsed_speed))
        elif hw in ["residential", "living_street"]:
            speed_limit = 30

        current_sub = [w_nodes[0]]

        for nid in w_nodes[1:]:
            current_sub.append(nid)

            if nid in junction_node_ids or nid == w_nodes[-1]:
                pts = [[nodes[n]["x"], nodes[n]["z"]] for n in current_sub]

                clean_pts = []
                for p in pts:
                    if (
                        not clean_pts
                        or math.hypot(
                            p[0] - clean_pts[-1][0],
                            p[1] - clean_pts[-1][1]
                        ) >= 0.01
                    ):
                        clean_pts.append([round(p[0], 2), round(p[1], 2)])

                if len(clean_pts) >= 2:
                    seg_len = sum(
                        math.hypot(clean_pts[i+1][0] - clean_pts[i][0], clean_pts[i+1][1] - clean_pts[i][1])
                        for i in range(len(clean_pts)-1)
                    )

                    if seg_len >= 1.5:
                        seg_idx += 1
                        has_crossing = any(nodes[n].get("crossing", False) for n in current_sub)
                        has_signal = any(nodes[n].get("trafficSignal", False) for n in current_sub)

                        raw_segments.append({
                            "id": f"osm_seg_{seg_idx}",
                            "name": name,
                            "highway": hw,
                            "startNode": current_sub[0],
                            "endNode": current_sub[-1],
                            "centerline": clean_pts,
                            "length": round(seg_len, 2),
                            "width": round(width, 2),
                            "laneWidth": round(width / max(lanes, 1), 2),
                            "lanes": lanes,
                            "speedLimit": speed_limit,
                            "oneway": tags.get("oneway") in ("yes", "true", "1"),
                            "hasSidewalk": hw in ["primary", "secondary", "tertiary", "residential"],
                            "hasPedestrianCrossing": has_crossing,
                            "hasTrafficSignal": has_signal
                        })

                current_sub = [nid]

    print(f"[OSM Pipeline] Extracted {len(raw_segments)} topological road segments from PBF.")

    # ══════════════════════════════════════════════════════════════════
    # 4. CLUSTER JUNCTION NODES (radius 8m using spatial grid index for O(N) speed)
    # ══════════════════════════════════════════════════════════════════

    GRID_SIZE = 8.0
    grid = {}
    for jid in junction_node_ids:
        jn = nodes[jid]
        gx = int(math.floor(jn["x"] / GRID_SIZE))
        gz = int(math.floor(jn["z"] / GRID_SIZE))
        key = (gx, gz)
        if key not in grid:
            grid[key] = []
        grid[key].append(jn)

    junc_clusters = []
    seen_nids = set()

    for jid in junction_node_ids:
        if jid in seen_nids:
            continue
        jn = nodes[jid]
        cluster = [jn]
        seen_nids.add(jid)

        gx = int(math.floor(jn["x"] / GRID_SIZE))
        gz = int(math.floor(jn["z"] / GRID_SIZE))

        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1):
                cell = grid.get((gx + dx, gz + dz), [])
                for o_jn in cell:
                    o_jid = o_jn["id"]
                    if o_jid in seen_nids:
                        continue
                    if math.hypot(jn["x"] - o_jn["x"], jn["z"] - o_jn["z"]) <= 8.0:
                        cluster.append(o_jn)
                        seen_nids.add(o_jid)

        junc_clusters.append(cluster)

    # ══════════════════════════════════════════════════════════════════
    # 5. GENERATE JUNCTION POLYGONS & PRIORITY RULES (O(1) Spatial Lookups)
    # ══════════════════════════════════════════════════════════════════

    # Pre-index node to road segments
    node_to_segs = {}
    for seg in raw_segments:
        s_node = seg["startNode"]
        e_node = seg["endNode"]
        if s_node not in node_to_segs:
            node_to_segs[s_node] = []
        node_to_segs[s_node].append((seg, "start"))

        if e_node not in node_to_segs:
            node_to_segs[e_node] = []
        node_to_segs[e_node].append((seg, "end"))

    # Pre-index special nodes in a 30m spatial grid
    SIG_GRID_SIZE = 30.0
    sig_grid = {}
    def add_to_sig_grid(n, ntype):
        gx = int(math.floor(n["x"] / SIG_GRID_SIZE))
        gz = int(math.floor(n["z"] / SIG_GRID_SIZE))
        key = (gx, gz)
        if key not in sig_grid:
            sig_grid[key] = []
        sig_grid[key].append((n, ntype))

    traffic_signal_nodes = [n for n in nodes.values() if n.get("trafficSignal", False)]
    crossing_nodes = [n for n in nodes.values() if n.get("crossing", False)]
    stop_nodes = [n for n in nodes.values() if n.get("stop", False)]
    give_way_nodes = [n for n in nodes.values() if n.get("giveWay", False)]

    for n in traffic_signal_nodes: add_to_sig_grid(n, "signal")
    for n in crossing_nodes: add_to_sig_grid(n, "crossing")
    for n in stop_nodes: add_to_sig_grid(n, "stop")
    for n in give_way_nodes: add_to_sig_grid(n, "giveWay")

    print(f"[OSM Pipeline] Indexed {len(traffic_signal_nodes)} traffic signals, "
          f"{len(crossing_nodes)} crossings, "
          f"{len(stop_nodes)} stop signs, "
          f"{len(give_way_nodes)} give-way signs.")

    junctions_data = []
    SIGNAL_RADIUS = 30.0

    for c_idx, cluster in enumerate(junc_clusters):
        cx = sum(n["x"] for n in cluster) / len(cluster)
        cz = sum(n["z"] for n in cluster) / len(cluster)
        cluster_nids = set(n["id"] for n in cluster)

        connected_ends = []

        # ── Fast Signal / Sign detection by spatial grid ──
        is_signalized = any(n.get("trafficSignal", False) for n in cluster)
        has_stop = any(n.get("stop", False) for n in cluster)
        has_give_way = any(n.get("giveWay", False) for n in cluster)
        has_crossing_at_junction = any(n.get("crossing", False) for n in cluster)

        cgx = int(math.floor(cx / SIG_GRID_SIZE))
        cgz = int(math.floor(cz / SIG_GRID_SIZE))

        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1):
                cell = sig_grid.get((cgx + dx, cgz + dz), [])
                for snode, stype in cell:
                    if math.hypot(snode["x"] - cx, snode["z"] - cz) <= SIGNAL_RADIUS:
                        if stype == "signal": is_signalized = True
                        elif stype == "stop": has_stop = True
                        elif stype == "giveWay": has_give_way = True
                        elif stype == "crossing": has_crossing_at_junction = True

        # ── Fast Find connected road ends via node_to_segs ──
        seen_seg_ends = set()
        for nid in cluster_nids:
            for seg, end_type in node_to_segs.get(nid, []):
                key = (seg["id"], end_type)
                if key in seen_seg_ends:
                    continue
                seen_seg_ends.add(key)
                pts = seg["centerline"]

                if end_type == "start":
                    p0 = pts[0]
                    p1 = pts[min(2, len(pts)-1)]
                    dx = p1[0] - p0[0]
                    dz = p1[1] - p0[1]
                    length = math.hypot(dx, dz)
                    if length > 0.01:
                        connected_ends.append({
                            "seg": seg, "end": "start",
                            "dir": [dx / length, dz / length],
                            "entryPoint": p0, "width": seg["width"]
                        })
                else:
                    p0 = pts[-1]
                    p1 = pts[max(0, len(pts)-3)]
                    dx = p1[0] - p0[0]
                    dz = p1[1] - p0[1]
                    length = math.hypot(dx, dz)
                    if length > 0.01:
                        connected_ends.append({
                            "seg": seg, "end": "end",
                            "dir": [dx / length, dz / length],
                            "entryPoint": p0, "width": seg["width"]
                        })

        if not connected_ends or len(connected_ends) < 2:
            continue

        n_roads = len(connected_ends)
        corner_points = []
        mouths = {}
        crosswalks = []
        is_inline_joint = False

        if n_roads == 2:
            d1 = connected_ends[0]["dir"]
            d2 = connected_ends[1]["dir"]
            dot = d1[0] * d2[0] + d1[1] * d2[1]
            if dot < -0.5:
                is_inline_joint = True

        hwy_types = set(c["seg"]["highway"] for c in connected_ends)
        has_major_hierarchy_gap = False
        if len(hwy_types) > 1:
            major_set = {"primary", "trunk", "motorway"}
            minor_set = {"tertiary", "residential", "unclassified", "living_street"}
            if any(h in major_set for h in hwy_types) and any(h in minor_set for h in hwy_types):
                has_major_hierarchy_gap = True

        if is_inline_joint:
            priority_rule = "CONTINUOUS"
            priority_basis = "INLINE_ROAD_CONTINUATION"
        elif is_signalized:
            priority_rule = "AMPEL"
            priority_basis = "EXPLICIT_SIGNAL"
        elif has_stop:
            priority_rule = "STOP"
            priority_basis = "EXPLICIT_SIGN"
        elif has_give_way:
            priority_rule = "GIVE_WAY"
            priority_basis = "EXPLICIT_SIGN"
        elif has_major_hierarchy_gap:
            priority_rule = "HIERARCHY_MAJOR_PRIORITY"
            priority_basis = "INFERRED_HIGHWAY_HIERARCHY"
        else:
            priority_rule = "RECHTS_VOR_LINKS"
            priority_basis = "HEURISTIC_RIGHT_BEFORE_LEFT"

        if not is_inline_joint:
            for i in range(n_roads):
                cur = connected_ends[i]
                w_other = max([o["width"] for o in connected_ends if o != cur] or [cur["width"]])
                d_junc = min(cur["seg"]["length"] * 0.35, max(6.0, w_other / 2.0 + 1.5))

                ux, uz = cur["dir"]
                nx, nz = -uz, ux
                hw = cur["width"] / 2.0

                pm_x = cur["entryPoint"][0] + ux * d_junc
                pm_z = cur["entryPoint"][1] + uz * d_junc

                c_left = [round(pm_x - nx * hw, 2), round(pm_z - nz * hw, 2)]
                c_right = [round(pm_x + nx * hw, 2), round(pm_z + nz * hw, 2)]

                corner_points.append(c_left)
                corner_points.append(c_right)

                mouths[cur["seg"]["id"]] = {
                    "trimDist": round(d_junc, 2),
                    "mouth": [round(pm_x, 2), round(pm_z, 2)],
                    "left": c_left,
                    "right": c_right,
                    "dir": [round(ux, 3), round(uz, 3)]
                }

                needs_crossing = (
                    cur["seg"].get("hasPedestrianCrossing") or
                    has_crossing_at_junction or
                    (is_signalized and len(connected_ends) >= 3)
                )

                if needs_crossing and cur["seg"]["length"] >= (d_junc + 4.0):
                    d_zebra = d_junc + 1.8
                    pz_x = cur["entryPoint"][0] + ux * d_zebra
                    pz_z = cur["entryPoint"][1] + uz * d_zebra

                    crosswalks.append({
                        "roadId": cur["seg"]["id"],
                        "roadName": cur["seg"]["name"],
                        "p1": [round(pz_x - nx * hw, 2), round(pz_z - nz * hw, 2)],
                        "p2": [round(pz_x + nx * hw, 2), round(pz_z + nz * hw, 2)],
                        "width": 3.2,
                        "dZebra": round(d_zebra, 2)
                    })

            corner_points.sort(key=lambda p: math.atan2(p[0] - cx, p[1] - cz))

            dedup_corners = []
            for p in corner_points:
                if not dedup_corners or math.hypot(p[0] - dedup_corners[-1][0], p[1] - dedup_corners[-1][1]) >= 0.5:
                    dedup_corners.append(p)

            if len(dedup_corners) >= 3 and math.hypot(dedup_corners[0][0] - dedup_corners[-1][0], dedup_corners[0][1] - dedup_corners[-1][1]) < 0.5:
                dedup_corners.pop()

            corner_points = dedup_corners

        junctions_data.append({
            "id": f"junc_{c_idx+1}",
            "center": [round(cx, 2), round(cz, 2)],
            "polygon": corner_points,
            "hasTrafficLight": is_signalized,
            "hasStopSign": has_stop,
            "hasGiveWay": has_give_way,
            "priorityRule": priority_rule,
            "inferredPriorityRule": priority_rule,
            "inferredPriorityBasis": priority_basis,
            "connectedRoadsCount": len(connected_ends),
            "isInlineJoint": is_inline_joint,
            "mouths": mouths,
            "crosswalks": crosswalks
        })

    print(f"[OSM Pipeline] Generated {len(junctions_data)} polygonal junctions.")

    # ══════════════════════════════════════════════════════════════════
    # 6. WATERWAYS
    # ══════════════════════════════════════════════════════════════════

    waterways_data = []
    raw_waterways = data.get("waterways", [])

    for w in raw_waterways:
        valid_nodes = [nid for nid in w["nodes"] if nid in nodes]
        if len(valid_nodes) < 2:
            continue
        pts = [[nodes[nid]["x"], nodes[nid]["z"]] for nid in valid_nodes]
        clipped_sublines = clip_polyline_to_bounds(pts, bounds_min_x, bounds_max_x, bounds_min_z, bounds_max_z)
        tags = w.get("tags", {})
        name = tags.get("name", "Spree" if tags.get("water") == "river" or "spree" in tags.get("waterway", "").lower() else "Wasser")
        w_type = tags.get("waterway", tags.get("water", "river"))
        width = 28.0
        if "spreekanal" in name.lower() or "kupfergraben" in name.lower(): width = 16.0
        elif "spree" in name.lower(): width = 30.0
        elif w_type == "canal": width = 18.0
        elif w_type == "stream": width = 6.0

        for sub_idx, sub_pts in enumerate(clipped_sublines):
            waterways_data.append({
                "id": f"water_{w['id']}_{sub_idx}",
                "osmWayId": w["id"],
                "name": name,
                "type": w_type,
                "points": sub_pts,
                "isClosed": False,
                "width": width
            })

    print(f"[OSM Pipeline] Extracted {len(waterways_data)} clipped waterway segments from PBF.")

    # ══════════════════════════════════════════════════════════════════
    # 7. RAILWAYS
    # ══════════════════════════════════════════════════════════════════

    railways_data = []
    raw_railways = data.get("railways", [])

    for w in raw_railways:
        valid_nodes = [nid for nid in w["nodes"] if nid in nodes]
        if len(valid_nodes) < 2:
            continue
        pts = [[nodes[nid]["x"], nodes[nid]["z"]] for nid in valid_nodes]
        clipped_sublines = clip_polyline_to_bounds(pts, bounds_min_x, bounds_max_x, bounds_min_z, bounds_max_z)
        tags = w.get("tags", {})

        for sub_idx, sub_pts in enumerate(clipped_sublines):
            railways_data.append({
                "id": f"rail_{w['id']}_{sub_idx}",
                "osmWayId": w["id"],
                "name": tags.get("name", "Bahn"),
                "railway": tags.get("railway", "rail"),
                "points": sub_pts
            })

    print(f"[OSM Pipeline] Extracted {len(railways_data)} clipped railway tracks from PBF.")

    # ══════════════════════════════════════════════════════════════════
    # 8. PARKS
    # ══════════════════════════════════════════════════════════════════

    parks_data = []
    raw_parks = data.get("parks", [])

    for w in raw_parks:
        valid_nodes = [nid for nid in w["nodes"] if nid in nodes]
        if len(valid_nodes) < 3:
            continue
        pts = [[nodes[nid]["x"], nodes[nid]["z"]] for nid in valid_nodes]
        clipped_poly = clip_polygon_to_bounds(pts, bounds_min_x, bounds_max_x, bounds_min_z, bounds_max_z)
        if len(clipped_poly) >= 3:
            tags = w.get("tags", {})
            name = tags.get("name", "Grünfläche")
            parks_data.append({
                "id": f"park_{w['id']}",
                "osmWayId": w["id"],
                "name": name,
                "points": clipped_poly
            })

    print(f"[OSM Pipeline] Extracted {len(parks_data)} clipped park polygons from PBF.")

    # ══════════════════════════════════════════════════════════════════
    # 9. LANDMARKS
    # ══════════════════════════════════════════════════════════════════

    landmarks_data = []
    raw_landmarks = data.get("landmarks", {})
    raw_landmark_nodes = (raw_landmarks.get("nodes", []) if isinstance(raw_landmarks, dict) else [])
    raw_landmark_ways = (raw_landmarks.get("ways", []) if isinstance(raw_landmarks, dict) else [])

    def add_landmark(landmark_id, name, category, x, z, osm_type, osm_id, tags=None, points=None):
        if not (bounds_min_x <= x <= bounds_max_x and bounds_min_z <= z <= bounds_max_z):
            return
        landmarks_data.append({
            "id": landmark_id,
            "name": name or "OSM Landmark",
            "category": category or "landmark",
            "x": round(x, 2),
            "z": round(z, 2)
        })

    for lm in raw_landmark_nodes:
        nid = lm.get("id")
        node = nodes.get(nid) or nodes.get(str(nid))
        if node is None:
            x, z = local_latlon_to_metric(lm["lat"], lm["lon"])
        else:
            x, z = node["x"], node["z"]

        add_landmark(
            landmark_id=f"osm_landmark_node_{nid}",
            name=lm.get("name"),
            category=lm.get("category"),
            x=x, z=z,
            osm_type="node", osm_id=nid,
            tags=lm.get("tags", {})
        )

    for lm in raw_landmark_ways:
        lm_nodes = []
        for nid in lm.get("nodes", []):
            node = nodes.get(nid) or nodes.get(str(nid))
            if node is not None:
                lm_nodes.append(node)
        if not lm_nodes:
            continue
        points = [[round(n["x"], 2), round(n["z"], 2)] for n in lm_nodes]
        cx = sum(p[0] for p in points) / len(points)
        cz = sum(p[1] for p in points) / len(points)

        add_landmark(
            landmark_id=f"osm_landmark_way_{lm['id']}",
            name=lm.get("name"),
            category=lm.get("category"),
            x=cx, z=cz,
            osm_type="way", osm_id=lm["id"],
            tags=lm.get("tags", {}),
            points=points
        )

    print(f"[OSM Pipeline] Extracted {len(landmarks_data)} real OSM landmarks.")

    # ══════════════════════════════════════════════════════════════════
    # 10. OUTPUT
    # ══════════════════════════════════════════════════════════════════

    out_graph = {
        "metadata": {
            "name": "Unified OSM RoadGraph",
            "version": "8.3-PBF-STRICT-JUNCTIONS-WITH-SIGNALS",
            "source": f"public/maps/{PBF_FILENAME}",
            "scale": 1.0,
            "scaleUnit": "1 Three.js unit = 1 real meter",
            "geometrySource": "OSM_PBF",
            "geometryPolicy": "Road centerlines preserved from OSM. Junctions detected by strict way-way-name topology.",
            "bounds": {
                "minX": bounds_min_x,
                "maxX": bounds_max_x,
                "minZ": bounds_min_z,
                "maxZ": bounds_max_z,
                "description": "Exact local metric bounds derived from the PBF bbox"
            },
            "origin": {"lat": REF_LAT, "lon": REF_LON, "description": "Geographic center of the source PBF bbox"},
            "roadCount": len(raw_segments),
            "osmSegmentCount": len(raw_segments),
            "syntheticSegmentCount": 0,
            "junctionCount": len(junctions_data),
            "waterwayCount": len(waterways_data),
            "railwayCount": len(railways_data),
            "parkCount": len(parks_data),
            "landmarkCount": len(landmarks_data)
        },
        "roads": raw_segments,
        "junctions": junctions_data,
        "waterways": waterways_data,
        "railways": railways_data,
        "parks": parks_data,
        "landmarks": landmarks_data
    }

    out_dir = os.path.join(os.path.dirname(__file__), "..", "src", "simulation", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, out_filename)

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(out_graph, f, ensure_ascii=False, indent=2)

    print(f"[OK] Successfully built Unified PBF RoadGraph to: {out_file}")
    print(f"  - Total OSM segments: {len(raw_segments)} (100% from PBF)")
    print(f"  - Polygonal junctions: {len(junctions_data)}")
    print(f"  - Real waterways: {len(waterways_data)}")
    print(f"  - Real railways: {len(railways_data)}")
    print(f"  - Real parks: {len(parks_data)}")
    print(f"  - Real landmarks: {len(landmarks_data)}")


if __name__ == "__main__":
    extracted_fn = sys.argv[1] if len(sys.argv) > 1 else "osm_pbf_extracted_stadt.json"
    out_fn = sys.argv[2] if len(sys.argv) > 2 else "road_graph.json"
    build_real_osm_roadgraph(extracted_fn, out_fn)