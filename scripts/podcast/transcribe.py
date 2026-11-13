"""Transcribe the episode mix with ElevenLabs Speech to Text and build the files the video needs.

- words.json      : raw STT result (German, word timestamps, diarization) + source info
- sous-titres.srt : subtitles from the words (≤ 42 chars per line, ≤ 2 lines, split on speaker change / pause)
- speakers.json   : who speaks when (Nora / Ben) — taken from the SCRIPT via the montage timing
                    (timing.json), not guessed from the voices; each turn lists the STT words inside it,
                    and any disagreement with the diarization is flagged.
Also writes assets/transcript/<slug>.json in the segments/words format the pipeline (build_cues.py)
already reads, so the video uses the same cue system as the previous episodes.

Usage: python3 scripts/podcast/transcribe.py episodes/<slug> [--reuse]
"""
import json, os, pathlib, subprocess, sys, uuid, urllib.request

ep = pathlib.Path(sys.argv[1])
reuse = "--reuse" in sys.argv
wav = ep / "audio_video.wav"
raw_path = ep / "words.json"

def stt():
    boundary = uuid.uuid4().hex
    fields = {"model_id": os.environ.get("STT_MODEL", "scribe_v1"), "language_code": "deu", "timestamps_granularity": "word",
              "diarize": "true", "num_speakers": "2", "tag_audio_events": "true"}
    body = b"".join(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode() for k, v in fields.items())
    body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{wav.name}\"\r\n"
             f"Content-Type: audio/wav\r\n\r\n").encode() + wav.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body, method="POST",
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}",
                                          "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")})
    try:
        return json.load(urllib.request.urlopen(req, timeout=900))
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code}: {e.read().decode()[:600]}")

if reuse and raw_path.exists():
    res = json.load(open(raw_path))
else:
    res = stt()
    json.dump(res, open(raw_path, "w"), ensure_ascii=False, indent=1)

words = [w for w in res["words"] if w.get("type") == "word"]
timing = json.load(open(ep / "timing.json"))
turns = timing["turns"]

# ---- speakers.json: script turns with their time span; STT words assigned by midpoint
diar_votes = {}
spk = []
for t in turns:
    inside = [w for w in words if t["start"] - 0.15 <= (w["start"] + w["end"]) / 2 <= t["end"] + 0.15]
    ids = [w.get("speaker_id") for w in inside if w.get("speaker_id")]
    dom = max(set(ids), key=ids.count) if ids else None
    if dom:
        diar_votes.setdefault(dom, []).append(t["speaker"])
    spk.append({"i": t["i"], "speaker": t["speaker"], "start": t["start"], "end": t["end"], "text": t["text"],
                "stt": " ".join(w["text"] for w in inside), "diarization": dom})
name_of = {d: max(set(v), key=v.count) for d, v in diar_votes.items()}
flags = 0
for s in spk:
    if s["diarization"] and name_of.get(s["diarization"]) != s["speaker"]:
        s["check"] = f"diarization says {name_of.get(s['diarization'])}"
        flags += 1
json.dump({"source": "script turns placed by the montage (timing.json); STT words matched by time",
           "voices": {"Nora": "XFigb6fqZPxl2Q2dFOXN (Nadine Convo)", "Ben": "IeQubAjK1ujbppIdhJw4 (Markus)"},
           "diarization_map": name_of, "turns": spk}, open(ep / "speakers.json", "w"), ensure_ascii=False, indent=1)

# ---- pipeline transcript: one segment per script turn, STT words inside
slug = ep.name
seg = []
for s in spk:
    ws = [{"text": w["text"], "start_time": round(w["start"], 3), "end_time": round(w["end"], 3)}
          for w in words if s["start"] - 0.15 <= (w["start"] + w["end"]) / 2 <= s["end"] + 0.15]
    seg.append({"text": s["stt"], "start_time": s["start"], "end_time": s["end"],
                "speaker": {"id": s["speaker"], "name": s["speaker"]}, "words": ws})
(ep / "assets" / "transcript").mkdir(parents=True, exist_ok=True)
json.dump({"language_code": "deu", "segments": seg}, open(ep / "assets" / "transcript" / f"{slug}.json", "w"), ensure_ascii=False, indent=1)

# ---- subtitles
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
cues, cur = [], []
def flush():
    if cur:
        cues.append((cur[0]["start"], cur[-1]["end"], " ".join(w["text"] for w in cur)))
        cur.clear()
prev_turn = None
for w in words:
    turn = next((s["i"] for s in spk if s["start"] - 0.15 <= (w["start"] + w["end"]) / 2 <= s["end"] + 0.15), None)
    text = " ".join(x["text"] for x in cur + [w])
    if cur and (turn != prev_turn or len(text) > 84 or w["start"] - cur[-1]["end"] > 0.7 or cur[-1]["text"][-1:] in ".?!"):
        flush()
    cur.append(w)
    prev_turn = turn
flush()
def wrap(t):
    if len(t) <= 42:
        return t
    cut = t.rfind(" ", 0, len(t) // 2 + 8)
    return t[:cut] + "\n" + t[cut + 1:]
with open(ep / "sous-titres.srt", "w", encoding="utf-8") as f:
    for k, (a, b, t) in enumerate(cues, 1):
        f.write(f"{k}\n{ts(a)} --> {ts(b)}\n{wrap(t)}\n\n")
print(f"{len(words)} words, {len(cues)} subtitles, {len(spk)} turns, diarization map {name_of}, {flags} flagged")
