"""Parse a Pflege-WG episode script ("Nora: …" / "Ben: …" turns, [Regie] tags) into dialogue.json.

- Turns start with "Nora:" or "Ben:" (the names are never spoken).
- [Intro-Musik] / [Outro-Musik] are montage markers, not generated.
- German stage directions in [brackets] become English ElevenLabs v3 audio tags. An unknown
  tag stops the parse, so nothing is ever sent untranslated (add it to TAGS below).
- A line that ends with "—" is interrupted; a line that starts with "—" interrupts the previous
  one: the montage uses a shorter gap there.

Usage: python3 scripts/podcast/parse_script.py episodes/<slug>/script.txt episodes/<slug>/dialogue.json
"""
import json, re, sys

TAGS = {
    "lacht": "laughs", "lacht nervös": "nervous laugh", "seufzt": "sighs", "kurze pause": "short pause",
    "pause": "pause", "neugierig": "curious", "warm": "warmly", "überlegt": "thinking", "zufrieden": "satisfied",
    "stolz": "proudly", "zögert": "hesitates", "schnell": "quickly", "beeindruckt": "impressed",
    "ernst": "serious", "ruhig": "calmly", "flüstert": "whispers", "lacht leise": "chuckles",
    "überrascht": "surprised", "begeistert": "excited", "genervt": "annoyed", "räuspert sich": "clears throat",
}
MARKERS = {"intro-musik": "intro", "outro-musik": "outro"}

src, out = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read().replace("\f", "\n")
# re-flow: join wrapped lines, keep turn starts and markers on their own line
flat = re.sub(r"\s*\n\s*", " ", text)
flat = re.sub(r"\s*(\[(?:Intro|Outro)-Musik\])\s*", r"\n\1\n", flat)
flat = re.sub(r"\s+(?=(?:Nora|Ben):\s)", "\n", flat)

turns, markers = [], []
unknown = set()
def tagify(m):
    key = m.group(1).strip().lower()
    if key in TAGS:
        return f"[{TAGS[key]}]"
    unknown.add(m.group(1))
    return m.group(0)

for line in [l.strip() for l in flat.split("\n") if l.strip()]:
    mk = re.fullmatch(r"\[(Intro|Outro)-Musik\]", line, re.I)
    if mk:
        markers.append({"marker": MARKERS[mk.group(0)[1:-1].lower()], "before_turn": len(turns)})
        continue
    m = re.match(r"(Nora|Ben):\s*(.*)", line)
    if not m:
        sys.exit(f"cannot parse line: {line[:80]}")
    speaker, de = m.group(1), m.group(2).strip()
    tts = re.sub(r"\[([^\]]+)\]", tagify, de)
    plain = re.sub(r"\s*\[[^\]]+\]\s*", " ", de).strip()
    turns.append({"i": len(turns), "speaker": speaker, "text": de, "spoken": plain, "tts": tts,
                  "interrupted": de.endswith("—"), "interrupts": de.startswith("—")})

if unknown:
    sys.exit("untranslated tags: " + ", ".join(sorted(unknown)))
json.dump({"turns": turns, "markers": markers}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(turns), "turns,", sum(len(t["tts"]) for t in turns), "characters to generate; markers:", markers)
