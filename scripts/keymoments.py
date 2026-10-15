"""Key-moment list (timestamp + what appears) for an episode, from data.js cues.
Usage: python3 scripts/keymoments.py <episode_dir>  (reads keymoments.json next to cues.spec.json)"""
import json, re, sys
ep = sys.argv[1]
js = open(f"{ep}/assets/js/data.js").read()
cues = json.loads(re.search(r"window\.CUES = (\{.*?\});", js).group(1))
src = json.loads(re.search(r"window\.CUE_SOURCE = (\{.*?\});", js).group(1))
km = json.load(open(f"{ep}/keymoments.json"))
rows = []
for key, label in km.items():
    t = cues[key]
    rows.append((t, label, src[key]["phrase"]))
rows.sort()
fmt = lambda t: f"{int(t // 60)}:{t % 60:04.1f}"
print("| Temps | Ce qui apparaît | Mot dit |\n|---|---|---|")
for t, label, phrase in rows:
    print(f"| {fmt(t)} | {label} | {phrase} |")
