"""Generate a block of dialogue turns with ElevenLabs Text to Dialogue (with timestamps).

One request per block: all turns of the block go in one generation, so the hand-overs between
Nora and Ben sound natural. The response's voice_segments give each turn's start/end in the
block, which the montage uses to set the gaps between turns. Blocks are cached on disk and never
regenerated unless --force: generating costs credits.

Voices (Pflege-WG): Nora = XFigb6fqZPxl2Q2dFOXN (Nadine Convo), Ben = IeQubAjK1ujbppIdhJw4 (Markus).
The API key is injected by the session's network proxy; ELEVENLABS_API_KEY is used if set.

Usage: python3 scripts/podcast/generate_dialogue.py episodes/<slug> <first>-<last> [--force]
Writes episodes/<slug>/audio_gen/turns_<first>-<last>.mp3 + .json
"""
import base64, json, os, pathlib, sys, urllib.request

VOICES = {"Nora": "XFigb6fqZPxl2Q2dFOXN", "Ben": "IeQubAjK1ujbppIdhJw4"}
MODEL = "eleven_v3"

ep = pathlib.Path(sys.argv[1])
a, b = map(int, sys.argv[2].split("-"))
force = "--force" in sys.argv
turns = json.load(open(ep / "dialogue.json", encoding="utf-8"))["turns"][a:b + 1]
out = ep / "audio_gen"
out.mkdir(exist_ok=True)
stem = out / f"turns_{a:03d}-{b:03d}"
if stem.with_suffix(".mp3").exists() and not force:
    sys.exit(f"{stem}.mp3 exists — not regenerating (use --force to spend credits again)")

body = {"model_id": MODEL, "inputs": [{"text": t["tts"], "voice_id": VOICES[t["speaker"]]} for t in turns]}
req = urllib.request.Request("https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps",
                             data=json.dumps(body).encode(), method="POST",
                             headers={"Content-Type": "application/json", "Accept": "application/json",
                                      "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")})
try:
    res = json.load(urllib.request.urlopen(req, timeout=600))
except urllib.error.HTTPError as e:
    sys.exit(f"HTTP {e.code}: {e.read().decode()[:600]}")

stem.with_suffix(".mp3").write_bytes(base64.b64decode(res.pop("audio_base64")))
meta = {"model": MODEL, "turns": [t["i"] for t in turns], "characters": sum(len(t["tts"]) for t in turns),
        "voice_segments": res.get("voice_segments"), "alignment": res.get("alignment")}
json.dump(meta, open(stem.with_suffix(".json"), "w"), ensure_ascii=False)
segs = meta["voice_segments"] or []
print(stem.with_suffix(".mp3"), f"{meta['characters']} chars, {len(segs)} segments")
for s in segs:
    print(" ", s.get("dialogue_input_index"), round(s["start_time_seconds"], 2), round(s["end_time_seconds"], 2))
