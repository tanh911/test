import urllib.request
import urllib.parse
import re
import json
import time

queries = [
    'Gefahrbremsung Fahrschule Auto',
    'Anfahren am Berg Fahrschule',
    'Wenden Fahrschule',
    'Längseinparken Fahrschule',
    'Rückwärts einparken quer Fahrschule',
    'Vorwärts einparken Fahrschule',
    'Schulterblick Fahrschule',
    'Kreisverkehr Fahrschule',
    'Links abbiegen Gegenverkehr Fahrschule',
    'Zebrastreifen Fahrschule',
    'Radfahrer überholen Fahrschule',
    'Straßenbahn Fahrschule',
    'Überholen Landstraße Fahrschule',
    'Kurvenfahren Landstraße Fahrschule',
    'Verkehrszeichen Landstraße Fahrschule',
    'Autobahn auffahren Fahrschule',
    'Spurwechsel Autobahn Fahrschule',
    'Autobahn abfahren Fahrschule',
    'Reifen prüfen Fahrschule Technik',
    'Lichtanlage Fahrschule Technik',
    'Motorraum prüfen Fahrschule Technik',
    'Durchfallgründe praktische Fahrprüfung',
    'Prüfungsangst Fahrprüfung',
    'Fahrprüfer Kommandos'
]

results = {}
for q in queries:
    url = 'https://www.youtube.com/results?search_query=' + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        match = re.search(r'\"videoId\":\"([a-zA-Z0-9_-]{11})\"', html)
        if match:
            results[q] = match.group(1)
        else:
            results[q] = 'FAIL'
    except Exception as e:
        results[q] = 'ERROR'
    time.sleep(0.1)

print(json.dumps(results, indent=2))
