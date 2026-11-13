"""Assemble a Pflege-WG podcast episode from generated dialogue blocks + the jingle.

Montage rules (series standard):
- Intro: the jingle plays in full; the first line starts as its last note decays.
- Gaps between turns: 0.2–0.4 s (varied, deterministic); 0.06 s where a line is interrupted ("—").
  Pauses inside a turn ([short pause] etc.) are kept as generated.
- Outro: the jingle starts UNDER the voices at the outro's first line (default: "So, das war's"),
  about 20 dB below the voices, looped smoothly while they talk. After the last word it rises to
  its normal level in 1.5 s and ends on its own ending, then fades out. No silence in between.
- Master: −16 LUFS integrated, true peak ≤ −1 dBTP (two-pass loudnorm).

Outputs: podcast_spotify.mp3 (stereo 192 kbps) and audio_video.wav (48 kHz), plus timing.json
(every turn's start/end in the final mix, used for speakers.json and the video).

Usage:
  python3 scripts/podcast/assemble.py episodes/<slug> [--outro-from 98] [--test]
  --test: only the cached blocks, output test_mix.mp3 (intro + first block … outro extract)
"""
import json, pathlib, re, subprocess, sys
import numpy as np

SR = 48000
ROOT = pathlib.Path(__file__).resolve().parents[2]
JINGLE = ROOT / "assets" / "jingles" / "pflege-wg-jingle.m4a"
JINGLE_MUSIC_END = 16.6        # the file is silent after the music (s)
JINGLE_TAIL = 19.0             # natural decay ends here
INTRO_OVERLAP = 0.4            # first line starts this long before the jingle's music end
BED_DB = -20.0                 # bed level under the voices (LU below the voices)
RISE = 1.5                     # bed rises to normal after the last word (s)

ep = pathlib.Path(sys.argv[1])
args = sys.argv[2:]
test = "--test" in args
outro_from = int(args[args.index("--outro-from") + 1]) if "--outro-from" in args else None
dlg = json.load(open(ep / "dialogue.json", encoding="utf-8"))
turns = dlg["turns"]
if outro_from is None:
    outro_from = next(t["i"] for t in turns if t["spoken"].startswith("So, das war"))

def load(path, start=None, dur=None):
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", str(start)] if start is not None else []) + \
          (["-t", str(dur)] if dur is not None else []) + ["-i", str(path), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return a.reshape(-1, 2).copy()

def lufs(x):
    """Integrated loudness (LUFS) of a stereo float array, via ffmpeg ebur128."""
    p = subprocess.run(["ffmpeg", "-v", "info", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                        "-af", "ebur128", "-f", "null", "-"], input=x.astype(np.float32).tobytes(), capture_output=True)
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", p.stderr.decode())
    return float(m[-1]) if m else -70.0

def db(g): return 10 ** (g / 20)

def trim(x, thr_db=-48, pad=0.03):
    """Trim leading/trailing silence of a turn (keeps a little air)."""
    env = np.abs(x).max(axis=1)
    idx = np.where(env > db(thr_db))[0]
    if not len(idx):
        return x[:0]
    a, b = max(0, idx[0] - int(pad * SR)), min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]

# ---- collect generated turns (in order) from the cached blocks.
# Cut points come from audio_gen/cuts.json (align_blocks.py: real word times found by Speech to Text);
# each turn starts just after the previous turn's last word (so a leading [laughs]/[sighs] stays with
# its own turn) and runs until just after its own last word.
blocks = sorted((ep / "audio_gen").glob("turns_*.json"))
cuts_path = ep / "audio_gen" / "cuts.json"
cuts = {int(k): v for k, v in json.load(open(cuts_path)).items()} if cuts_path.exists() else {}
POST = 0.12
clips = {}
for bj in blocks:
    meta = json.load(open(bj))
    audio = load(bj.with_suffix(".mp3"))
    ids = meta["turns"]
    if all(i in cuts for i in ids):
        for k, ti in enumerate(ids):
            a = 0 if k == 0 else cuts[ids[k - 1]]["end"] + POST
            b = len(audio) / SR if k == len(ids) - 1 else min(cuts[ti]["end"] + POST, cuts[ids[k + 1]]["start"])
            clips[ti] = audio[int(a * SR): int(b * SR)]
    else:  # fallback: API voice_segments (less precise)
        for seg in meta["voice_segments"]:
            ti = ids[seg["dialogue_input_index"]]
            a, b = int(seg["start_time_seconds"] * SR), int(seg["end_time_seconds"] * SR)
            clips[ti] = np.concatenate([clips[ti], audio[a:b]]) if ti in clips else audio[a:b]
present = sorted(clips)
if not test:
    missing = [t["i"] for t in turns if t["i"] not in clips]
    if missing:
        sys.exit(f"turns not generated yet: {missing[:12]}{'…' if len(missing) > 12 else ''}")

def gap_after(i):
    t, n = turns[i], turns[i + 1] if i + 1 < len(turns) else None
    if t["interrupted"] or (n and n["interrupts"]):
        return 0.06
    return 0.2 + 0.2 * (((i * 7919) % 101) / 100)  # 0.2–0.4 s, deterministic

# ---- dialogue track: voices placed one after another with the montage gaps
def build(turn_ids):
    parts, timing, t = [], [], 0.0
    for k, i in enumerate(turn_ids):
        c = trim(clips[i])
        timing.append({"i": i, "speaker": turns[i]["speaker"], "start": round(t, 3), "end": round(t + len(c) / SR, 3), "text": turns[i]["spoken"]})
        parts.append(c)
        t += len(c) / SR
        if k < len(turn_ids) - 1:
            g = gap_after(i) if turn_ids[k + 1] == i + 1 else 0.6
            parts.append(np.zeros((int(g * SR), 2), np.float32))
            t += g
    return (np.concatenate(parts) if parts else np.zeros((0, 2), np.float32)), timing

jingle = load(JINGLE, 0, JINGLE_TAIL)
voice_ref = None

def mix(body_ids, outro_ids):
    """intro jingle + body + outro over the music bed; returns audio + timing (seconds in the mix)."""
    global voice_ref
    body, t_body = build(body_ids)
    outro, t_out = build(outro_ids)
    v_l = lufs(np.concatenate([body, outro]))
    voice_ref = v_l
    j_norm = db((v_l + 1.0) - lufs(jingle[: int(JINGLE_MUSIC_END * SR)]))   # jingle ≈ voices + 1 LU
    intro = jingle * j_norm
    intro[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))[:, None]
    start_body = JINGLE_MUSIC_END - INTRO_OVERLAP
    # outro bed: looped jingle body under the voices, its real ending after the last word
    body_loop = jingle[int(0.3 * SR): int(15.4 * SR)] * j_norm
    ending = jingle[int(9.0 * SR):] * j_norm
    last_word = len(outro) / SR
    ending_at = max(0.0, last_word - 1.0)                       # ending starts just before the last word ends
    xf = int(1.0 * SR)
    bed = body_loop.copy()
    while len(bed) < int(ending_at * SR) + xf:
        ramp = np.linspace(0, 1, xf)[:, None]
        bed = np.concatenate([bed[:-xf], bed[-xf:] * (1 - ramp) + body_loop[:xf] * ramp, body_loop[xf:]])
    bed = bed[: int(ending_at * SR) + xf]
    ramp = np.linspace(0, 1, xf)[:, None]
    bed = np.concatenate([bed[:-xf], bed[-xf:] * (1 - ramp) + ending[:xf] * ramp, ending[xf:]])
    # gain envelope: BED_DB under the voices, rise after the last word, fade out at the end
    o_l = lufs(outro)
    low = db((o_l + BED_DB) - (v_l + 1.0))
    n = len(bed)
    env = np.full(n, low, np.float32)
    r0, r1 = int((last_word + 0.15) * SR), int((last_word + 0.15 + RISE) * SR)
    env[r0:r1] = np.linspace(low, 1.0, max(1, r1 - r0)) if r1 <= n else env[r0:r1]
    env[r1:] = 1.0
    fo = int(2.0 * SR)
    env[-fo:] *= np.linspace(1, 0, fo)
    bed = bed * env[:, None]
    fi = int(0.4 * SR)
    bed[:fi] *= np.linspace(0, 1, fi)[:, None]
    # lay out
    out_start = start_body + len(body) / SR + 0.35
    total = int((out_start + max(len(bed), len(outro)) / SR) * SR) + 1
    mixbuf = np.zeros((max(total, len(intro)), 2), np.float32)
    mixbuf[: len(intro)] += intro
    s = int(start_body * SR); mixbuf[s: s + len(body)] += body
    s = int(out_start * SR); mixbuf[s: s + len(outro)] += outro; mixbuf[s: s + len(bed)] += bed
    timing = [dict(x, start=round(x["start"] + start_body, 3), end=round(x["end"] + start_body, 3)) for x in t_body] + \
             [dict(x, start=round(x["start"] + out_start, 3), end=round(x["end"] + out_start, 3)) for x in t_out]
    return mixbuf, timing, {"intro_music": [0, JINGLE_TAIL], "outro_start": round(out_start, 3),
                            "outro_music_full": round(out_start + last_word + 0.15 + RISE, 3)}

def master(x, wav_out, mp3_out=None):
    raw = ep / "audio_gen" / "_premaster.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(raw)],
                   input=x.astype(np.float32).tobytes(), check=True)
    p = subprocess.run(["ffmpeg", "-v", "info", "-i", str(raw), "-af", "loudnorm=I=-16:TP=-1:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True)
    st = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr.decode()).group(0))
    af = (f"loudnorm=I=-16:TP=-1:LRA=11:measured_I={st['input_i']}:measured_TP={st['input_tp']}:"
          f"measured_LRA={st['input_lra']}:measured_thresh={st['input_thresh']}:offset={st['target_offset']}:linear=true,"
          f"aresample={SR}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", af, "-c:a", "pcm_s16le", str(wav_out)], check=True)
    if mp3_out:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav_out), "-c:a", "libmp3lame", "-b:a", "192k", "-ac", "2", str(mp3_out)], check=True)
    raw.unlink()
    m = subprocess.run(["ffmpeg", "-v", "info", "-i", str(wav_out), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True).stderr.decode()
    return re.findall(r"I:\s+(-?[\d.]+) LUFS", m)[-1], re.findall(r"Peak:\s+(-?[\d.]+) dBFS", m)[-1]

if test:
    head = [i for i in present if i < outro_from]
    tail = [i for i in present if i >= outro_from]
    x, timing, marks = mix(head, tail)
    # test file: intro + first block, then a 20 s extract of the ending (bed level + rise)
    first_end = int((timing[len(head) - 1]["end"] + 0.6) * SR)
    end_extract = x[-int(min(len(x) / SR, 20.0 + 0.0) * SR):]
    sep = np.zeros((int(1.2 * SR), 2), np.float32)
    test_x = np.concatenate([x[:first_end], sep, end_extract])
    I, P = master(test_x, ep / "audio_gen" / "test_mix.wav", ep / "test_mix.mp3")
    print("test_mix.mp3", f"{len(test_x) / SR:.1f}s", "loudness", I, "LUFS, true peak", P, "dBTP", "| bed starts", marks)
else:
    body_ids = [t["i"] for t in turns if t["i"] < outro_from]
    outro_ids = [t["i"] for t in turns if t["i"] >= outro_from]
    x, timing, marks = mix(body_ids, outro_ids)
    I, P = master(x, ep / "audio_video.wav", ep / "podcast_spotify.mp3")
    json.dump({"duration": round(len(x) / SR, 3), **marks, "turns": timing}, open(ep / "timing.json", "w"), ensure_ascii=False, indent=1)
    print("podcast_spotify.mp3 + audio_video.wav", f"{len(x) / SR:.1f}s", "loudness", I, "LUFS, true peak", P)
