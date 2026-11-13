"""Generate short sound effects with ElevenLabs Sound Effects (cached: never regenerates an existing file).

Usage: python3 scripts/sfx_generate.py <name> <seconds> "<prompt>" [--force]
Writes assets/sfx/<name>.mp3 (shared by all episodes). Key injected by the session proxy.
"""
import json, os, pathlib, sys, urllib.request

name, dur, prompt = sys.argv[1], float(sys.argv[2]), sys.argv[3]
out = pathlib.Path(__file__).resolve().parent.parent / "assets" / "sfx" / f"{name}.mp3"
if out.exists() and "--force" not in sys.argv:
    sys.exit(f"{out} exists — not regenerating (use --force)")
body = {"text": prompt, "duration_seconds": dur, "prompt_influence": 0.6}
req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192", data=json.dumps(body).encode(),
                             method="POST", headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")})
try:
    data = urllib.request.urlopen(req, timeout=300).read()
except urllib.error.HTTPError as e:
    sys.exit(f"HTTP {e.code}: {e.read().decode()[:400]}")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(data)
print(out, len(data), "bytes")
