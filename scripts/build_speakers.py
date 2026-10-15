"""Build speakers.json: who speaks when (Nora / Ben), per transcript turn + SRT cue ids.

The transcript's diarization gives two anonymous voices. Each voice is named by its
median pitch (Nora = higher voice), and every turn is re-checked by its own pitch so
a mislabelled turn is flagged instead of silently trusted.
Usage: python3 scripts/build_speakers.py <episode_dir> <basename>
"""
import json, re, subprocess, sys
import numpy as np

ep, name = sys.argv[1], sys.argv[2]
d = json.load(open(f"{ep}/assets/transcript/{name}.json"))
srt = open(f"{ep}/assets/transcript/{name}.srt", encoding="utf-8").read()
SR = 16000
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{ep}/assets/audio/{name}.mp3", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768

def pitch(t0, t1):
    x = a[int(t0 * SR):int(t1 * SR)]
    n, out = 1024, []
    for i in range(0, len(x) - n, n // 2):
        fr = x[i:i + n] * np.hanning(n)
        if np.sqrt((fr ** 2).mean()) < 0.02:
            continue
        ac = np.correlate(fr, fr, "full")[n - 1:]
        lo, hi = SR // 400, SR // 70
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] / ac[0] > 0.45:
            out.append(SR / k)
    return float(np.median(out)) if out else None

def ts(s):
    h, m, rest = s.split(":"); sec, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000

cues = []
for block in srt.strip().split("\n\n"):
    lines = block.strip().splitlines()
    if len(lines) >= 3:
        t0, t1 = [ts(x.strip()) for x in lines[1].split("-->")]
        cues.append({"id": int(lines[0]), "start": t0, "end": t1, "text": " ".join(lines[2:])})

turns = []
for s in d["segments"]:
    text = re.sub(r"\[[^\]]*\]\s*", "", s["text"]).strip()
    p = pitch(s["start_time"], s["end_time"]) if text else None
    turns.append({"start": s["start_time"], "end": s["end_time"], "voice": s["speaker"]["id"], "text": text, "pitchHz": p and round(p, 1)})

voices = {}
for t in turns:
    if t["pitchHz"]:
        voices.setdefault(t["voice"], []).append(t["pitchHz"])
med = {v: float(np.median(p)) for v, p in voices.items()}
high = max(med, key=med.get)
names = {v: ("Nora" if v == high else "Ben") for v in med}
split = sum(med.values()) / 2

out = []
for t in turns:
    if not t["text"]:
        continue
    who = names[t["voice"]]
    by_pitch = None if not t["pitchHz"] else ("Nora" if t["pitchHz"] > split else "Ben")
    ids = [c["id"] for c in cues if c["start"] < t["end"] - 0.05 and c["end"] > t["start"] + 0.05]
    out.append({"start": t["start"], "end": t["end"], "speaker": who, "srt": ids, "text": t["text"],
                "pitchHz": t["pitchHz"], **({"check": f"pitch suggests {by_pitch}"} if by_pitch and by_pitch != who else {})})

res = {"source": f"assets/transcript/{name}.json + .srt", "method": "diarization ids named by median pitch; each turn re-checked by its own pitch",
       "voices": {names[v]: {"diarizationId": v, "medianPitchHz": round(m, 1)} for v, m in med.items()},
       "turns": out}
json.dump(res, open(f"{ep}/speakers.json", "w"), ensure_ascii=False, indent=1)
print(res["voices"], len(out), "turns;", sum("check" in t for t in out), "flagged")
for t in out:
    if "check" in t: print("FLAG", t["start"], t["speaker"], t["pitchHz"], t["text"][:60])
