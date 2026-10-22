"""Content-fidelity check: is every word shown on screen actually said in the episode?

Pflege-WG rule #1: medical content comes only from the script / SRT. This script reads
every visible text node of index.html (plus thumbnail/thumb.config.js and PUBLISHING.md
if present, or any extra file given with --also) and looks each content word up in the
word-level transcript. A word counts as said if it appears in the transcript as a word,
as a word stem (inflection: Sturz/Stürze, Prellung/Prellungen), or inside a compound.
Brand and UI words (kit/allowed_words.txt, plus an optional per-episode allowed_words.txt)
are skipped. Placeholders «…» left from the template are reported too.

It is a safety net, not a judge: a flagged word may be a fair paraphrase, but every
flag must be looked at by a human before render. A clean run does not prove the
meaning is right — wording can be correct while the statement is not (kit/REVIEW.md).

Usage: python3 scripts/check_content.py episodes/<slug> [--also FILE ...]
Exit code 1 if anything is flagged.
"""
import html.parser, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]
if not args:
    sys.exit(__doc__)
ep = pathlib.Path(args[0])
also = [pathlib.Path(p) for p in args[args.index("--also") + 1:]] if "--also" in args else []
slug = ep.resolve().name

def norm(w):
    w = w.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z0-9]", "", w)

WORD = re.compile(r"[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\-]*")

# ---- transcript vocabulary
tr = json.load(open(ep / "assets" / "transcript" / f"{slug}.json"))
said = [norm(w["text"]) for s in tr["segments"] for w in s["words"] if not w["text"].startswith("[")]
said = [w for w in said if w]
said_set = set(said)
said_blob = "|" + "|".join(said) + "|"
said_joined = "".join(said)  # catches compounds written as one word but spoken as two

allowed = set()
for f in [ROOT / "kit" / "allowed_words.txt", ep / "allowed_words.txt"]:
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.split("#")[0].strip()
            if line:
                allowed.add(norm(line))

def is_said(w):
    n = norm(w)
    if len(n) < 4 or n in allowed or n in said_set:
        return True
    # same stem, other ending (Sturz/Stürze, Prellung/Prellungen) — strict enough that
    # "Bewegung" does not pass on "bewegliche"
    stem = n[: max(5, len(n) - 2)]
    if f"|{stem}" in said_blob:
        return True
    if len(n) >= 6 and n in said_joined:  # compound spoken as several words
        return True
    # compound shown hyphenated or as one word whose parts are each said
    parts = [p for p in re.split(r"-", w) if p]
    if len(parts) > 1 and all(is_said(p) for p in parts):
        return True
    return False

# ---- visible text of index.html, grouped by nearest element id
class Texts(html.parser.HTMLParser):
    SKIP = {"script", "style", "title", "head"}
    def __init__(self):
        super().__init__()
        self.stack, self.skip, self.out = [], 0, []
    def handle_starttag(self, tag, attrs):
        if tag in ("img", "br", "meta", "link", "input", "source"):
            return
        self.stack.append((tag, dict(attrs).get("id")))
        if tag in self.SKIP:
            self.skip += 1
    def handle_endtag(self, tag):
        while self.stack:
            t, _ = self.stack.pop()
            if t in self.SKIP:
                self.skip -= 1
            if t == tag:
                break
    def handle_data(self, data):
        if self.skip or not data.strip():
            return
        where = next((i for _, i in reversed(self.stack) if i), "?")
        self.out.append((where, data.strip()))

sources = []
p = Texts()
p.feed((ep / "index.html").read_text(encoding="utf-8"))
sources += [("index.html#" + w, t) for w, t in p.out]

thumb = ep / "thumbnail" / "thumb.config.js"
if thumb.exists():
    for m in re.finditer(r'(chip|headline|accent|sub|callout)\s*:\s*"([^"]*)"', thumb.read_text(encoding="utf-8")):
        sources.append((f"thumbnail:{m.group(1)}", m.group(2)))
# publishing texts: only what gets pasted (```fenced``` blocks); --also files: every line
for f in ([ep / "PUBLISHING.md"] if (ep / "PUBLISHING.md").exists() else []) + also:
    fenced = f.name == "PUBLISHING.md"
    inside = False
    for i, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
        if line.lstrip().startswith("```"):
            inside = not inside
            continue
        if line.strip() and (inside or not fenced) and not line.lstrip().startswith("http"):
            sources.append((f"{f.name}:{i}", re.sub(r"\[[^\]]*\]", "", line)))

# ---- report
flags, placeholders = [], []
for where, text in sources:
    if "«" in text or "{{" in text:
        placeholders.append((where, text))
        continue
    missing = sorted({w for w in WORD.findall(text) if not is_said(w)}, key=str.lower)
    if missing:
        flags.append((where, missing, text))

if placeholders:
    print(f"PLACEHOLDERS LEFT ({len(placeholders)}):")
    for where, text in placeholders:
        print(f"  {where}: {text[:80]}")
if flags:
    print(f"NOT FOUND IN TRANSCRIPT ({len(flags)} places) — check each one against the SRT:")
    for where, missing, text in flags:
        print(f"  {where}: {', '.join(missing)}   ← \"{text[:70]}\"")
if not flags and not placeholders:
    print(f"OK — all on-screen words found in the transcript ({len(sources)} text nodes checked)")
sys.exit(1 if flags or placeholders else 0)
