"""Per-frame loudness envelope for audio-reactive visuals.
ffmpeg decodes the audio to mono PCM; RMS is measured over exactly one video frame of
samples, converted to dB and mapped to 0..1 between the quiet floor and the speech peak.
Usage: python3 scripts/build_loudness.py <audio> <out.json> [fps]
"""
import json, subprocess, sys
import numpy as np

audio, out = sys.argv[1], sys.argv[2]
fps = int(sys.argv[3]) if len(sys.argv) > 3 else 30
sr = 48000
spf = sr // fps
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.int16).astype(np.float64) / 32768
dur = len(a) / sr
n = int(np.ceil(dur * fps))
a = np.pad(a, (0, n * spf - len(a)))
rms = np.sqrt((a.reshape(n, spf) ** 2).mean(axis=1))
db = 20 * np.log10(rms + 1e-9)
floor = float(np.percentile(db, 8))
ceil = float(np.percentile(db, 99))
vals = np.clip((db - floor) / (ceil - floor), 0, 1)
json.dump({"fps": fps, "frames": n, "duration": round(dur, 3), "floorDb": round(floor, 1), "ceilDb": round(ceil, 1),
           "source": audio, "values": [round(float(v), 3) for v in vals]}, open(out, "w"), separators=(",", ":"))
print(n, "frames", round(dur, 3), "s  floor", round(floor, 1), "dB  ceil", round(ceil, 1), "dB")
