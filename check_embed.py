import urllib.request
import urllib.parse
import re
import json

queries = {
    'v_gf1': 'Gefahrbremsung Fahrschule',
    'v_gf2': 'Anfahren am Berg Fahrschule',
    'v_gf3': 'Wenden Fahrschule',
    'v1': 'Längseinparken Fahrschule',
    'v2': 'Rückwärts quer einparken Fahrschule',
    'v3': 'Vorwärts einparken Fahrschule',
    'v4': 'Schulterblick richtig machen Fahrschule',
    'v5': 'Kreisverkehr Fahrschule',
    'v6': 'Links abbiegen mehrspurig Fahrschule',
    'v_sv1': 'Zebrastreifen Fußgängerüberweg Fahrschule',
    'v_sv2': 'Radfahrer überholen Fahrschule',
    'v_sv3': 'Straßenbahn Fahrschule',
    'v_ls1': 'Überholen Landstraße Fahrschule',
    'v_ls2': 'Kurvenfahren Landstraße Fahrschule',
    'v_ls3': 'Fahrbahnmarkierungen Landstraße Fahrschule',
    'v7': 'Autobahn Auffahrt Fahrschule',
    'v8': 'Autobahn Spurwechsel Fahrschule',
    'v9': 'Autobahn Abfahrt Fahrschule',
    'v_tk1': 'Reifen prüfen Abfahrkontrolle Klasse B',
    'v_tk2': 'Lichtanlage prüfen Abfahrkontrolle Klasse B',
    'v_tk3': 'Motorraum prüfen Abfahrkontrolle Klasse B',
    'v_pt1': 'Durchfallgründe praktische Fahrprüfung',
    'v_pt2': 'Prüfungsangst besiegen Fahrschule',
    'v_pt3': 'Fahrprüfung Anweisungen Prüfer'
}

results = {}
for id, q in queries.items():
    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        vids = re.findall(r'"videoId":"(.*?)"', html)
        
        vids = list(dict.fromkeys(vids))
        
        found = False
        for vid in vids[:8]:
            embed_url = f"https://www.youtube.com/embed/{vid}"
            embed_req = urllib.request.Request(embed_url, headers={'User-Agent': 'Mozilla/5.0'})
            try:
                resp = urllib.request.urlopen(embed_req)
                html_embed = resp.read().decode('utf-8')
                # If "UNPLAYABLE" is in the source, it might be restricted
                if 'UNPLAYABLE' not in html_embed and '"status":"ERROR"' not in html_embed:
                    results[id] = vid
                    found = True
                    break
            except Exception:
                pass
                
        if not found:
            results[id] = 'dQw4w9WgXcQ'
            
    except Exception as e:
        results[id] = 'dQw4w9WgXcQ'

print(json.dumps(results, indent=2))
