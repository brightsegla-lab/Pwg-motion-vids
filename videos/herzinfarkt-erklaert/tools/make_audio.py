#!/usr/bin/env python3
"""Offline audio for med2be / Herzinfarkt.

HeyGen, Hugging Face and the music libraries are unreachable from this session,
so this script stands in for `audio.mjs generate` + `fetch-sfx`:

  * narration  — Piper TTS (de-thorsten-low), one WAV per frame, sentence by
                 sentence, with lead-in/tail padding baked in so the WAV length
                 IS the frame length (then `audio.mjs sync-durations` applies it).
  * word times — sentence boundaries are exact (each sentence synthesised alone);
                 words inside a sentence are spread over its voiced span by
                 syllable weight, with extra weight before , – : pauses.
  * BGM        — a synthesised dark ambient bed with a slow heartbeat pulse.
  * SFX        — synthesised heartbeat, crack, ECG beeps, whooshes.

Writes assets/voice/*.wav, assets/bgm/bed.wav, assets/sfx/*.wav, audio_meta.json
(the product-launch meta shape assemble-index / captions read; entries marked
"source": "host").

Usage: python3 tools/make_audio.py [--piper DIR] [--model PATH]
"""
import argparse
import json
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 44100

ap = argparse.ArgumentParser()
ap.add_argument("--piper", default="/tmp/claude-0/tts/piper/piper")
ap.add_argument("--model", default="/tmp/claude-0/tts/de-thorsten-low.onnx")
ap.add_argument("--length-scale", default="1.0")
args = ap.parse_args()

LEAD = 0.35
GAP = 0.16
TAIL = {1: 0.9, 13: 2.6}
TAIL_DEFAULT = 0.6


def read_wav(path):
    with wave.open(str(path)) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return x, sr


def write_wav(path, x, sr=SR):
    path.parent.mkdir(parents=True, exist_ok=True)
    y = np.clip(x, -1, 1)
    if y.ndim == 1:
        y = np.stack([y, y], axis=1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((y * 32767).astype(np.int16).tobytes())


def resample(x, sr_in, sr_out=SR):
    n = int(round(len(x) * sr_out / sr_in))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


# Spoken forms for the TTS input only (captions keep the written form).
SAY = [(r"\bNSTEMI\b", "N-Stemi"), (r"\bSTEMI\b", "Stemi"), (r"\bASS\b", "A S S"), (r"\bLDL\b", "L D L"),
       (r"\bEKG\b", "E K G"), (r"\bST-Hebung\b", "S T Hebung"), (r"\bRCX\b", "R C X"), (r"\bRCA\b", "R C A"),
       (r"\bRIVA\b", "Riva"), (r"\bmed2be\b", "med tu bi")]


def spoken(text):
    for a, b in SAY:
        text = re.sub(a, b, text)
    return text


def tts(text, out):
    text = spoken(text)
    subprocess.run([args.piper, "-m", args.model, "--length_scale", args.length_scale,
                    "--sentence_silence", "0", "-f", str(out)],
                   input=text.encode(), capture_output=True, check=True)
    x, sr = read_wav(out)
    return resample(x, sr)


def voiced_span(x, thr=0.02):
    env = np.convolve(np.abs(x), np.ones(441) / 441, mode="same")
    idx = np.where(env > thr)[0]
    if not len(idx):
        return 0, len(x)
    return max(0, idx[0] - 220), min(len(x), idx[-1] + 441)


def syllables(w):
    w = w.lower()
    if re.fullmatch(r"[a-zäöü]*\d+", w) or w.isupper():
        return max(1, len(w))  # acronyms (LDL, ASS, PCI) are spelled out
    n = len(re.findall(r"[aeiouyäöü]+", w))
    return max(1, n)


def spell_weight(tok):
    core = re.sub(r"[^\wäöüÄÖÜß-]", "", tok)
    if re.fullmatch(r"[A-ZÄÖÜ]{2,}", core):
        return 1.2 * len(core)
    return float(syllables(core))


# ── narration ───────────────────────────────────────────────────────────────
script = (ROOT / "SCRIPT.md").read_text()
lines = {int(n): t.strip() for n, t in re.findall(r"## Line (\d+).*?\n(?:.*?\n)*?    (.+)", script)}
tmp = ROOT / ".hyperframes" / "tts"
tmp.mkdir(parents=True, exist_ok=True)
voices = []
for n in sorted(lines):
    text = lines[n]
    sents = [s.strip() for s in re.findall(r"[^.?:!]+[.?:!]?", text) if s.strip()]
    pieces = [np.zeros(int(LEAD * SR), np.float32)]
    t = LEAD
    words = []
    for si, s in enumerate(sents):
        x = tts(s, tmp / f"{n:02d}-{si}.wav")
        a, b = voiced_span(x)
        x = x[a:b]
        dur = len(x) / SR
        toks = s.split()
        wts = []
        for tk in toks:
            w = spell_weight(tk)
            if re.search(r"[,–\-]$", tk) or tk in ("–", "-"):
                w += 0.9
            wts.append(w)
        # dashes standing alone carry only pause weight
        tot = sum(wts)
        cur = t
        for tk, w in zip(toks, wts):
            span = dur * w / tot
            if tk not in ("–", "-"):
                words.append({"text": tk, "start": round(cur, 3), "end": round(cur + span * 0.92, 3)})
            cur += span
        pieces.append(x)
        t += dur
        if si < len(sents) - 1:
            pieces.append(np.zeros(int(GAP * SR), np.float32))
            t += GAP
    pieces.append(np.zeros(int(TAIL.get(n, TAIL_DEFAULT) * SR), np.float32))
    y = np.concatenate(pieces)
    # gentle polish: DC-free, normalised to -1.5 dBFS peak
    y = y - np.mean(y)
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.84
    path = ROOT / "assets" / "voice" / f"{n:02d}.wav"
    write_wav(path, y)
    for i, w in enumerate(words):
        w["id"] = f"w{n:02d}-{i}"
    voices.append({"frame": n, "path": f"assets/voice/{n:02d}.wav", "duration_s": round(len(y) / SR, 2),
                   "words": words, "source": "host"})
    print(f"voice {n:02d}: {len(y)/SR:5.2f}s  {len(words)} words")

durs = [v["duration_s"] for v in voices]
starts = np.concatenate([[0], np.cumsum(durs)[:-1]])
TOTAL = float(sum(durs))


def word_time(frame, needle, which=0):
    """Absolute start time of the first word in `frame` containing `needle`."""
    v = voices[frame - 1]
    hits = [w for w in v["words"] if needle.lower() in w["text"].lower()]
    return float(starts[frame - 1] + hits[which]["start"])


# ── synthesis helpers ───────────────────────────────────────────────────────
rng = np.random.default_rng(7)


def tvec(sec):
    return np.arange(int(sec * SR)) / SR


def env_ad(t, a, d):
    return np.where(t < a, t / a, np.exp(-(t - a) / d))


def thump(f0=52, dur=0.42, amp=1.0, click=0.15):
    t = tvec(dur)
    f = f0 * (1 + 0.9 * np.exp(-t / 0.03))
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_ad(t, 0.004, 0.11)
    n = rng.standard_normal(len(t)) * np.exp(-t / 0.008) * click
    return (body + n) * amp


def heartbeat(amp=1.0):
    lub = thump(55, 0.45, amp)
    dub = thump(68, 0.38, amp * 0.62)
    out = np.zeros(int(0.9 * SR))
    out[: len(lub)] += lub
    o = int(0.24 * SR)
    out[o: o + len(dub)] += dub[: len(out) - o]
    return out


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def lowpass_fast(x, fc):
    # one-pole IIR via scipy-free vectorised block trick: use FFT brickwall-ish taper
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x)).astype(np.float32)


def place(buf, clip, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(clip))
    buf[i:j] += clip[: j - i] * gain


# ── BGM: dark ambient bed + heartbeat pulse ─────────────────────────────────
t = tvec(TOTAL)
bed = np.zeros_like(t, dtype=np.float32)
# A-minor drone: A1, E2, A2, C3 with slow detune + swell
for f, g in ((55, .30), (82.41, .20), (110, .16), (130.81, .10), (164.81, .06)):
    lfo = 1 + 0.003 * np.sin(2 * np.pi * 0.07 * t + f)
    bed += g * np.sin(2 * np.pi * f * lfo * t)
    bed += g * 0.5 * np.sin(2 * np.pi * f * 1.004 * t + 1.3)
air = lowpass_fast(rng.standard_normal(len(t)).astype(np.float32), 900) * 0.10
bed = bed + air
swell = 0.75 + 0.25 * np.sin(2 * np.pi * t / 23.0)
# tension curve: rise into rupture/necrosis, relief at PCI, warm close
f6, f12 = starts[5], starts[11] + 7.0
tension = np.interp(t, [0, f6 - 4, f6, starts[7], f12, f12 + 2, TOTAL], [0.7, 0.75, 1.0, 1.0, 0.95, 0.75, 0.65])
bed *= swell * tension
# shimmer pad from frame 12's PCI moment (relief): add E4 / A4 fifths
rel = np.clip((t - f12) / 2.0, 0, 1)
bed += rel * 0.05 * (np.sin(2 * np.pi * 329.63 * t) + np.sin(2 * np.pi * 440 * t))
# heartbeat throughout, 64 bpm, faster (96 bpm) in rupture→necrosis, regular after PCI
beat_t = 0.4
while beat_t < TOTAL - 1:
    in_crisis = starts[5] <= beat_t < starts[7]
    place(bed, heartbeat(), beat_t, 0.38 if not in_crisis else 0.5)
    beat_t += 60 / (96 if in_crisis else 64)
fade = np.clip(np.minimum(t / 1.5, (TOTAL - t) / 2.5), 0, 1)
bed *= fade
bed = bed / (np.max(np.abs(bed)) + 1e-9) * 0.7
write_wav(ROOT / "assets" / "bgm" / "bed.wav", bed)
print(f"bgm: {TOTAL:.1f}s")

# ── SFX ─────────────────────────────────────────────────────────────────────
sfx = []


def save_sfx(name, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
    write_wav(ROOT / "assets" / "sfx" / f"{name}.wav", x.astype(np.float32))
    return f"assets/sfx/{name}.wav", round(len(x) / SR, 3)


def add(frame, name, abs_t, vol):
    path, d = SFXFILES[name]
    sfx.append({"frame": frame, "file": path, "offset_s": round(abs_t - starts[frame - 1], 3),
                "duration_s": d, "volume": vol, "source": "host"})


def whoosh(dur=0.7):
    tt = tvec(dur)
    n = rng.standard_normal(len(tt)).astype(np.float32)
    X = np.fft.rfft(n)
    f = np.fft.rfftfreq(len(n), 1 / SR)
    X *= np.exp(-((np.log(f + 1) - np.log(1800)) ** 2) / 1.2)
    y = np.fft.irfft(X, len(n))
    return y * np.sin(np.pi * tt / dur) ** 2


def crack():
    tt = tvec(0.9)
    n = rng.standard_normal(len(tt))
    snap = n * np.exp(-tt / 0.02)
    crackle = np.zeros_like(tt)
    for k in range(14):
        crackle += rng.standard_normal(len(tt)) * np.exp(-np.abs(tt - 0.03 - k * 0.025) / 0.004) * (0.8 ** k)
    boom = np.sin(2 * np.pi * 45 * tt) * np.exp(-tt / 0.25)
    return snap * 0.8 + crackle * 0.6 + boom * 0.9


def beep(f=1000, dur=0.12):
    tt = tvec(dur)
    return np.sin(2 * np.pi * f * tt) * env_ad(tt, 0.004, 0.05)


def chime():
    tt = tvec(1.6)
    return sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) * g for f, d, g in ((523.25, .6, .6), (783.99, .5, .4), (1046.5, .35, .25)))


SFXFILES = {
    "heartbeat": save_sfx("heartbeat", heartbeat(1.0)),
    "crack": save_sfx("crack", crack()),
    "beep": save_sfx("beep", beep()),
    "whoosh": save_sfx("whoosh", whoosh()),
    "chime": save_sfx("chime", chime()),
}

# frame 1: two strong heartbeats under the hook
add(1, "heartbeat", starts[0] + 0.15, 0.55)
add(1, "heartbeat", starts[0] + 1.2, 0.55)
# whooshes on the zoom-through seams (frames 2, 7, 13)
for f in (2, 7, 13):
    add(f, "whoosh", starts[f - 1] + 0.0, 0.35)
# frame 6: crack exactly when "reißt" is spoken
add(6, "crack", word_time(6, "reißt") - 0.05, 0.6)
# frame 10: monitor beeps on the two QRS complexes (drawn around 0.9s and 2.2s in)
add(10, "beep", starts[9] + 0.95, 0.25)
add(10, "beep", starts[9] + 2.25, 0.25)
# frame 12: chime when blood flow restarts after PCI ("Herzkatheter")
add(12, "chime", word_time(12, "Herzkatheter"), 0.3)
# frame 13: whoosh + chime on the wordmark
add(13, "chime", word_time(13, "Folge"), 0.25)

meta = {"bgm": {"path": "assets/bgm/bed.wav", "volume": 0.32, "source": "host", "duration_s": round(TOTAL, 2)},
        "bgm_pending": False, "voices": voices, "sfx": sfx}
(ROOT / "audio_meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False))
print(f"audio_meta.json: {len(voices)} voices, {len(sfx)} sfx, total {TOTAL:.2f}s")
