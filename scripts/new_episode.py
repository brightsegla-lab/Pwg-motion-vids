"""Create a new Pflege-WG episode from the kit template.

Copies kit/template → episodes/<slug>, fills the placeholders ({{SLUG}}, {{TITLE}},
{{FOLGE}}, {{NEXT}}, {{DURATION}}, {{CREATED}}), and puts the source files where the
pipeline expects them:
  assets/audio/<slug>.mp3            (converted with ffmpeg if needed)
  assets/transcript/<slug>.json      (word-level transcript: segments[].words[].start_time)
  assets/transcript/<slug>.srt
  assets/transcript/<slug>.script.*  (optional, the written script — best source for speakers)

Usage:
  python3 scripts/new_episode.py <slug> "<Titel>" --folge 3 --next "<Nächste Folge>" \
      --audio path/to/audio.(mp3|wav|m4a) --transcript path/to/words.json --srt path/to/subs.srt \
      [--script path/to/script.(md|txt|pdf|docx)]
Then: bash scripts/prepare_episode.sh episodes/<slug>
"""
import argparse, datetime, json, os, pathlib, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "kit" / "template"
TEXT = {".html", ".js", ".json", ".md", ".css"}

ap = argparse.ArgumentParser()
ap.add_argument("slug")
ap.add_argument("title")
ap.add_argument("--folge", required=True)
ap.add_argument("--next", default="«nächste Folge»")
ap.add_argument("--audio", required=True)
ap.add_argument("--transcript", required=True)
ap.add_argument("--srt", required=True)
ap.add_argument("--script")
a = ap.parse_args()

dst = ROOT / "episodes" / a.slug
if dst.exists():
    sys.exit(f"{dst} already exists — refusing to overwrite")
for p in [a.audio, a.transcript, a.srt] + ([a.script] if a.script else []):
    if not os.path.isfile(p):
        sys.exit(f"missing input: {p}")

tr = json.load(open(a.transcript))
if not tr.get("segments") or "words" not in tr["segments"][0]:
    sys.exit("transcript JSON must have segments[].words[] with start_time (word-level timestamps)")

dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.audio],
                           capture_output=True, text=True, check=True).stdout.strip())

shutil.copytree(TEMPLATE, dst)
for sub in ("audio", "transcript"):  # empty in git, so create them
    (dst / "assets" / sub).mkdir(parents=True, exist_ok=True)
audio_dst = dst / "assets" / "audio" / f"{a.slug}.mp3"
if a.audio.lower().endswith(".mp3"):
    shutil.copy(a.audio, audio_dst)
else:
    subprocess.run(["ffmpeg", "-v", "error", "-i", a.audio, "-codec:a", "libmp3lame", "-b:a", "192k", str(audio_dst)], check=True)
shutil.copy(a.transcript, dst / "assets" / "transcript" / f"{a.slug}.json")
shutil.copy(a.srt, dst / "assets" / "transcript" / f"{a.slug}.srt")
if a.script:
    shutil.copy(a.script, dst / "assets" / "transcript" / f"{a.slug}.script{pathlib.Path(a.script).suffix}")

subs = {
    "{{SLUG}}": a.slug,
    "{{TITLE}}": a.title,
    "{{FOLGE}}": str(a.folge),
    "{{NEXT}}": a.next,
    "{{DURATION}}": f"{dur:.2f}",
    "{{CREATED}}": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
}
for f in dst.rglob("*"):
    if f.is_file() and f.suffix in TEXT and "vendor" not in f.parts:
        s = f.read_text(encoding="utf-8")
        for k, v in subs.items():
            s = s.replace(k, v)
        f.write_text(s, encoding="utf-8")

print(f"created {dst.relative_to(ROOT)}  ({dur:.2f} s)")
print(f"next:   bash scripts/prepare_episode.sh episodes/{a.slug}")
