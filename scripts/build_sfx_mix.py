"""Video-only audio: the episode mix + short sound effects placed on cues (the podcast stays clean).

Reads <ep>/sfx.json  {"master": "assets/audio/<slug>.mp3", "events": [[sfx, at, gain_db], ...]}
where `at` is a number (seconds) or "cue_key" / "cue_key+0.35" (cues from assets/js/data.js),
and sfx names a file in assets/sfx/<sfx>.mp3. Writes assets/audio/<slug>-video.mp3 (same length
as the master). Deterministic: same inputs → same file.
Usage: python3 scripts/build_sfx_mix.py episodes/<slug>
"""
import json, pathlib, re, subprocess, sys
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
ep = pathlib.Path(sys.argv[1])
slug = ep.resolve().name
spec = json.load(open(ep / "sfx.json"))
js = open(ep / "assets/js/data.js", encoding="utf-8").read()
CUES = json.loads(re.search(r"window\.CUES = (\{.*?\});", js).group(1))
SR = 48000

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

def when(at):
    if isinstance(at, (int, float)):
        return float(at)
    m = re.fullmatch(r"([a-z0-9_]+)([+-][0-9.]+)?", at)
    return CUES[m.group(1)] + float(m.group(2) or 0)

master = load(ep / spec["master"])
fx = np.zeros_like(master)
cache = {}
for name, at, gain in spec["events"]:
    s = cache.setdefault(name, load(ROOT / "assets" / "sfx" / f"{name}.mp3"))
    i = int(round(when(at) * SR))
    n = min(len(s), len(fx) - i)
    fx[i:i + n] += s[:n] * (10 ** (gain / 20))
mix = master + fx
peak = np.abs(mix).max()
if peak > 0.89:  # keep true-peak headroom (≈ −1 dBTP)
    mix *= 0.89 / peak
out = ep / "assets" / "audio" / f"{slug}-video.mp3"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-codec:a", "libmp3lame", "-b:a", "192k", str(out)],
               input=mix.astype(np.float32).tobytes(), check=True)
print(out, f"{len(spec['events'])} effects, peak {20*np.log10(peak):.1f} dBFS")
