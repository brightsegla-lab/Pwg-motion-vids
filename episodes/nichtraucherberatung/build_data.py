#!/usr/bin/env python3
"""Precompute everything the composition needs into assets/js/data.js.

Inputs: repliken.json (script), timeline.json (replik windows in dialog.mp3),
words.json (word timestamps of dialog.mp3, ElevenLabs speech-to-text), audio/dialog.mp3.
Output globals (seconds are video time = dialog time + OFFSET):
  REPLIKEN  [{nr, speaker, phase, a, b, lines:[{a, b, text}]}]   subtitles from the SCRIPT text
  PHASES    [{phase, a, b}]
  CUES      {key: t}   element entrances, 0.2 s before the first word of their phrase
  LOUD      [0..1 per frame @30 fps]
  DURATION, OFFSET, DIALOG_END
"""
import difflib
import json
import re
import subprocess
import sys
from array import array
from pathlib import Path

HERE = Path(__file__).resolve().parent
OFFSET = 10.0          # intro length
OUTRO = 16.0           # end card after the last replik
FPS = 30
LEAD = 0.2
MAX_CHUNK = 96         # subtitle characters per chunk (shown on up to two lines)

# key: (replik nr, phrase as written in the script)
CUES = {
    "e-q": (1, "Darf ich mich kurz"),
    "e-perm": (5, "Ich möchte Ihnen keine Vorwürfe"),
    "e-arzt": (6, "Mein Arzt erzählt"),
    "ask-1": (8, "Eine Schachtel"),
    "ask-2": (10, "Seit über vierzig"),
    "adv-1": (11, "Mit dem Rauchen aufzuhören"),
    "adv-2": (11, "Der Schaden"),
    "adv-3": (11, "Aber ohne Rauch"),
    "adv-4": (12, "Von meinen Skatbrüdern"),
    "adv-5": (13, "Jede Lunge reagiert anders"),
    "adv-o2": (15, "In der Nähe von Sauerstoff"),
    "as-q1": (17, "Wann rauchen Sie morgens"),
    "as-a1": (18, "Direkt nach dem Aufstehen"),
    "as-q2": (19, "Und fällt es Ihnen schwer"),
    "as-a2": (20, "Ehrlich gesagt"),
    "as-res": (21, "Das spricht für eine deutliche"),
    "as-will": (21, "Das ist keine Willensschwäche"),
    "as-scale": (21, "Auf einer Skala"),
    "as-n": (22, "Vielleicht eine Vier"),
    "as-frau": (22, "Wegen meiner Frau"),
    "as-low": (23, "Und warum keine Zwei"),
    "as-why": (24, "Weil ich wieder ohne Pause"),
    "ass-net": (25, "Nikotinersatztherapie"),
    "ass-pfl": (25, "zum Beispiel ein Pflaster"),
    "ass-skat": (26, "Und beim Skat"),
    "ass-kau": (27, "Dafür gibt es Nikotinkaugummis"),
    "ass-frau": (27, "Und vielleicht kann Ihre Frau"),
    "ass-tel": (29, "Dazu gibt es eine kostenlose"),
    "ass-rueck": (29, "Dort ruft man Sie"),
    "ass-info": (29, "Ich gebe Ihnen ein Infoblatt"),
    "ass-step": (31, "Dann gehen wir es Schritt"),
    "ass-try": (32, "Ausprobieren kann ich"),
    "arr-1": (33, "Ich spreche heute mit der Ärztin"),
    "arr-2": (33, "Sie bekommen das Infoblatt"),
    "arr-3": (33, "Und morgen früh"),
    "arr-ok": (34, "Ja. Und die Zigaretten"),
    "arr-q": (35, "Das ist ein guter erster Schritt"),
}


def toks(text):
    return [t for t in re.sub(r"\[[^\]]*\]", " ", text).split()]


def key(tok):
    return re.sub(r"[^\w]", "", tok.lower())


def text_of(ws):
    return " ".join(w["tok"] for w in ws)


def sentences(ws):
    out, cur = [], []
    for w in ws:
        cur.append(w)
        if w["tok"][-1] in ".?!:":
            out.append(cur)
            cur = []
    return out + ([cur] if cur else [])


def split_long(ws):
    """Split a sentence longer than MAX_CHUNK at the comma (else the word) closest to its middle."""
    if len(text_of(ws)) <= MAX_CHUNK:
        return [ws]
    mid = len(text_of(ws)) / 2
    cands = [i for i in range(1, len(ws)) if ws[i - 1]["tok"][-1] in ",;"] or list(range(1, len(ws)))
    i = min(cands, key=lambda i: abs(len(text_of(ws[:i])) - mid))
    return split_long(ws[:i]) + split_long(ws[i:])


def main():
    cfg = json.loads((HERE / "repliken.json").read_text(encoding="utf-8"))
    tl = json.loads((HERE / "timeline.json").read_text(encoding="utf-8"))
    stt = json.loads((HERE / "words.json").read_text(encoding="utf-8"))["words"]

    # script tokens with their replik, aligned to the speech-to-text words
    script = []
    for r in cfg["repliken"]:
        for i, t in enumerate(toks(r["text"])):
            script.append({"nr": r["nr"], "i": i, "tok": t})
    sm = difflib.SequenceMatcher(None, [key(s["tok"]) for s in script], [key(w["w"]) for w in stt], autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            w = stt[blk.b + k]
            script[blk.a + k].update(s=w["s"], e=w["e"])
    win = {r["nr"]: r for r in tl["repliken"]}
    # unmatched tokens: interpolate inside their replik window
    for nr in win:
        idx = [j for j, s in enumerate(script) if s["nr"] == nr]
        known = [j for j in idx if "s" in script[j]]
        if not known:
            sys.exit(f"replik {nr}: no word matched")
        for j in idx:
            if "s" in script[j]:
                continue
            prev = max([k for k in known if k < j], default=None)
            nxt = min([k for k in known if k > j], default=None)
            a = script[prev]["e"] if prev is not None else win[nr]["start"]
            b = script[nxt]["s"] if nxt is not None else win[nr]["end"]
            script[j].update(s=a, e=max(a, b))
    matched = sum(1 for blk in sm.get_matching_blocks() for _ in range(blk.size))
    print(f"aligned {matched}/{len(script)} script words")

    by_nr = {}
    for s in script:
        by_nr.setdefault(s["nr"], []).append(s)

    # subtitle lines: break at sentence ends, then at commas/length
    rep_out = []
    for r in cfg["repliken"]:
        ws = by_nr[r["nr"]]
        lines = []
        for sent in sentences(ws):
            lines += split_long(sent)
        # merge very short chunks ("Ja.", "Sport.") into the next one when it stays readable
        k = 0
        while k < len(lines) - 1:
            if len(text_of(lines[k])) < 16 and len(text_of(lines[k] + lines[k + 1])) <= MAX_CHUNK:
                lines[k:k + 2] = [lines[k] + lines[k + 1]]
            else:
                k += 1
        out_lines = []
        for k, ln in enumerate(lines):
            a = ln[0]["s"] + OFFSET - 0.1
            b = (lines[k + 1][0]["s"] + OFFSET - 0.1) if k + 1 < len(lines) else win[r["nr"]]["end"] + OFFSET + 0.15
            out_lines.append({"a": round(a, 3), "b": round(b, 3), "text": " ".join(x["tok"] for x in ln)})
        rep_out.append({"nr": r["nr"], "speaker": r["speaker"], "phase": r["phase"],
                        "a": round(win[r["nr"]]["start"] + OFFSET, 3), "b": round(win[r["nr"]]["end"] + OFFSET, 3),
                        "lines": out_lines})

    cues = {}
    for k, (nr, phrase) in CUES.items():
        want = [key(t) for t in phrase.split()]
        ws = by_nr[nr]
        hit = next((i for i in range(len(ws)) if [key(w["tok"]) for w in ws[i:i + len(want)]] == want), None)
        if hit is None:
            sys.exit(f"cue {k}: phrase not in replik {nr}: {phrase}")
        cues[k] = round(ws[hit]["s"] + OFFSET - LEAD, 3)

    phases = [{"phase": p["phase"], "a": round(p["start"] + OFFSET, 3), "b": round(p["end"] + OFFSET, 3)} for p in tl["phases"]]
    dialog_end = round(tl["duration"] + OFFSET, 3)
    duration = round(dialog_end + OUTRO, 2)

    # loudness per frame (RMS of 1/30 s windows, normalised to the 98th percentile)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(HERE / "audio/dialog.mp3"), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    pcm = array("h", raw)
    step = 16000 // FPS
    rms = []
    for i in range(0, len(pcm), step):
        seg = pcm[i:i + step]
        rms.append((sum(x * x for x in seg) / max(1, len(seg))) ** 0.5)
    ref = sorted(rms)[int(len(rms) * 0.98)] or 1
    loud = [0.0] * int(OFFSET * FPS) + [round(min(1, v / ref), 2) for v in rms]
    loud += [0.0] * (int(duration * FPS) + 2 - len(loud))

    js = "// generated by build_data.py — do not edit\n"
    for name, val in [("OFFSET", OFFSET), ("DURATION", duration), ("DIALOG_END", dialog_end), ("REPLIKEN", rep_out),
                      ("PHASES", phases), ("CUES", cues), ("LOUD", loud)]:
        js += f"window.{name} = {json.dumps(val, ensure_ascii=False)};\n"
    (HERE / "assets/js").mkdir(parents=True, exist_ok=True)
    (HERE / "assets/js/data.js").write_text(js, encoding="utf-8")
    print(f"duration {duration} s, {len(cues)} cues, {sum(len(r['lines']) for r in rep_out)} subtitle lines")


if __name__ == "__main__":
    main()
