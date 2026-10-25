#!/usr/bin/env python3
"""Audio pipeline for the Nichtraucherberatung dialog (33 Repliken, ElevenLabs).

  python3 audio_pipeline.py fetch              # step 1: reuse ElevenLabs history, list what is missing
  python3 audio_pipeline.py generate --yes     # step 2: TTS only for missing Repliken (spends credits)
  python3 audio_pipeline.py assemble           # step 3: ffprobe check, dialog.mp3, timeline.json

The API key is read only from $ELEVENLABS_API_KEY and is never printed or written.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
AUDIO = HERE / "audio"
API = "https://api.elevenlabs.io"
RATE = 44100
GAP_REPLIK = 0.4
GAP_PHASE = 0.8
TARGET = 4 * 60 + 45
VOICE_SETTINGS = {"stability": 0.5}  # same as the Flows takes in the history


def load():
    return json.loads((HERE / "repliken.json").read_text(encoding="utf-8"))


def api_key():
    key = (os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVENLABS_API_KEYS") or "").strip()
    if not key:
        sys.exit("ELEVENLABS_API_KEY fehlt. Bitte als Umgebungsvariable setzen (nicht in eine Datei).")
    return key


def request(method, path, params=None, body=None, raw=False):
    url = API + path + ("?" + urllib.parse.urlencode(params) if params else "")
    headers = {"xi-api-key": api_key()}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            payload = r.read()
    except urllib.error.HTTPError as e:
        # only the status and the response body; the request headers (with the key) are never shown
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {e.read()[:300].decode(errors='replace')}") from None
    return payload if raw else json.loads(payload)


def strip_tags(text):
    return re.sub(r"\[[^\]]*\]", " ", text)


def norm(text):
    """Compare texts ignoring [tags], case, punctuation, quote style and whitespace."""
    t = unicodedata.normalize("NFC", strip_tags(text)).lower()
    t = re.sub(r"[^\w]+", " ", t)
    return " ".join(t.split())


def mp3(nr):
    return AUDIO / f"{nr:02d}.mp3"


def history(voice_id):
    items, after = [], None
    while True:
        params = {"page_size": 1000, "voice_id": voice_id}
        if after:
            params["start_after_history_item_id"] = after
        page = request("GET", "/v1/history", params)
        items += page.get("history", [])
        if not page.get("has_more"):
            return items
        after = page.get("last_history_item_id")


def entry_lines(h):
    """(voice_id, normalized text) of a history item; Flows items keep them in `dialogue`, not `text`."""
    if h.get("text"):
        return {(h.get("voice_id"), norm(h["text"]))}
    d = h.get("dialogue") or []
    if len(d) != 1:
        return set()
    return {(d[0].get("voice_id"), norm(d[0].get("text") or ""))}


def cmd_fetch(_):
    cfg = load()
    AUDIO.mkdir(exist_ok=True)
    by_voice = {}
    for sp, v in cfg["voices"].items():
        by_voice[v["voice_id"]] = history(v["voice_id"])
        print(f"History {v['name']}: {len(by_voice[v['voice_id']])} Einträge")
    missing = []
    for r in cfg["repliken"]:
        vid = cfg["voices"][r["speaker"]]["voice_id"]
        hits = [h for h in by_voice[vid] if (vid, norm(r["text"])) in entry_lines(h)]
        if not hits:
            missing.append(r["nr"])
            print(f"{r['nr']:02d} fehlt")
            continue
        best = max(hits, key=lambda h: h.get("date_unix", 0))
        mp3(r["nr"]).write_bytes(request("GET", f"/v1/history/{best['history_item_id']}/audio", raw=True))
        print(f"{r['nr']:02d} aus History ({len(hits)} Treffer, neuester genommen)")
    (AUDIO / "missing.json").write_text(json.dumps(missing))
    print(f"\n{33 - len(missing)} gefunden, {len(missing)} fehlen: {missing}")


def cmd_generate(args):
    cfg = load()
    todo = [r for r in cfg["repliken"] if not mp3(r["nr"]).exists()]
    print(f"Fehlende Repliken: {len(todo)} {[r['nr'] for r in todo]}")
    if not todo or not args.yes:
        if todo:
            print("Nichts generiert. Mit --yes bestätigen (verbraucht Credits).")
        return
    for r in todo:
        vid = cfg["voices"][r["speaker"]]["voice_id"]
        path = f"/v1/text-to-speech/{vid}"
        params = {"output_format": "mp3_44100_128"}
        try:
            audio = request("POST", path, params, {"text": r["text"], "model_id": "eleven_v4", "voice_settings": VOICE_SETTINGS}, raw=True)
            model = "eleven_v4"
        except RuntimeError as e:
            print(f"{r['nr']:02d} eleven_v4 abgelehnt ({e}); Fallback eleven_multilingual_v2 ohne Tags")
            text = " ".join(strip_tags(r["text"]).split())
            audio = request("POST", path, params, {"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": VOICE_SETTINGS}, raw=True)
            model = "eleven_multilingual_v2"
        mp3(r["nr"]).write_bytes(audio)
        print(f"{r['nr']:02d} generiert ({model})")


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type",
         "-of", "json", str(path)], capture_output=True, text=True)
    if out.returncode:
        return None
    info = json.loads(out.stdout)
    if not any(s.get("codec_type") == "audio" for s in info.get("streams", [])):
        return None
    return float(info["format"]["duration"])


def pcm(path):
    return subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(RATE), "-"],
        capture_output=True, check=True).stdout


def fmt(sec):
    return f"{int(sec // 60)}:{sec % 60:05.2f}"


def cmd_assemble(_):
    cfg = load()
    bad = [r["nr"] for r in cfg["repliken"] if not mp3(r["nr"]).exists() or probe(mp3(r["nr"])) is None]
    if bad:
        sys.exit(f"Fehlend oder nicht abspielbar: {bad}")
    print(f"01.mp3–{len(cfg['repliken']):02d}.mp3 vorhanden und abspielbar (ffprobe).")

    # durations come from decoded sample counts, so the timeline matches dialog.mp3 exactly
    buf, t, prev_phase = bytearray(), 0, None
    repliken = []
    for r in cfg["repliken"]:
        if prev_phase is not None:
            gap = GAP_PHASE if r["phase"] != prev_phase else GAP_REPLIK
            n = round(gap * RATE)
            buf += b"\x00\x00" * n
            t += n
        samples = pcm(mp3(r["nr"]))
        start = t
        buf += samples
        t += len(samples) // 2
        repliken.append({
            "nr": r["nr"], "file": f"audio/{r['nr']:02d}.mp3", "speaker": r["speaker"],
            "name": cfg["voices"][r["speaker"]]["name"], "phase": r["phase"],
            "text": " ".join(strip_tags(r["text"]).split()),
            "start": round(start / RATE, 3), "end": round(t / RATE, 3),
        })
        prev_phase = r["phase"]

    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(RATE), "-i", "-",
         "-c:a", "libmp3lame", "-b:a", "192k", str(AUDIO / "dialog.mp3")],
        input=bytes(buf), check=True)

    phases = []
    for p in cfg["phases"]:
        rs = [r for r in repliken if r["phase"] == p]
        phases.append({"phase": p, "start": rs[0]["start"], "end": rs[-1]["end"],
                       "repliken": [rs[0]["nr"], rs[-1]["nr"]]})
    total = round(t / RATE, 3)
    timeline = {"audio": "audio/dialog.mp3", "duration": total, "sample_rate": RATE,
                "gaps": {"replik": GAP_REPLIK, "phase": GAP_PHASE},
                "phases": phases, "repliken": repliken}
    (HERE / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    for p in phases:
        print(f"{p['phase']:<9} {fmt(p['start'])} – {fmt(p['end'])}")
    verdict = "OK, unter 4:45" if total < TARGET else f"ZU LANG um {fmt(total - TARGET)}"
    print(f"\nGesamtdauer dialog.mp3: {fmt(total)}  ({verdict})")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("fetch").set_defaults(fn=cmd_fetch)
    g = sub.add_parser("generate")
    g.add_argument("--yes", action="store_true", help="really generate (spends credits)")
    g.set_defaults(fn=cmd_generate)
    sub.add_parser("assemble").set_defaults(fn=cmd_assemble)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
