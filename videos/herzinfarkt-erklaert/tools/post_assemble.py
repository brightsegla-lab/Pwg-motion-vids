#!/usr/bin/env python3
"""Patch the assembled index.html for this offline, dark-canvas project.

assemble-index.mjs loads GSAP from jsDelivr (unreachable here) and paints the
root with frame.md's lightest colour (cream). med2be is a dark system, so
point GSAP at the vendored copy and paint the root ink-black. Re-run after
every assemble-index / transitions inject.
"""
import re
from pathlib import Path

p = Path(__file__).resolve().parent.parent / "index.html"
s = p.read_text()
s = re.sub(r'<script src="https://cdn\.jsdelivr\.net/npm/gsap@[^"]+"[^>]*></script>',
           '<script src="assets/vendor/gsap.min.js"></script>', s)
s = re.sub(r'(#root \{[^}]*?background: )#[0-9A-Fa-f]{6};', r'\g<1>#0A0A10;', s, count=1)
s = s.replace('<div\n        id="el-captions"', '<div\n        id="el-captions"\n        data-track-kind="captions"', 1)
p.write_text(s)
cap = p.parent / "compositions" / "captions.html"
if cap.exists():
    c = cap.read_text()
    c = re.sub(r'<script src="https://cdn\.jsdelivr\.net/npm/gsap@[^"]+"[^>]*></script>', '<script src="assets/vendor/gsap.min.js"></script>', c)
    # med2be caption look: blue active block with cream text, rounded glass plate,
    # sentence case (German nouns keep their capitals).
    c = c.replace("--cap-accent: #F28A2E;", "--cap-accent: #3D5AFE;")
    c = c.replace("--cap-accent-2: #3D5AFE;", "--cap-accent-2: #E838C8;")
    c = c.replace(".caption-word.is-active {\n    color: var(--cap-ink, #111111);", ".caption-word.is-active {\n    color: var(--cap-canvas, #f0ece5);")
    c = c.replace("    border: 1px solid var(--cap-accent, #e85d26);\n    border-radius: 0;", "    border: 1.5px solid rgba(240,236,229,.22);\n    border-radius: 22px;\n    background: rgba(10,10,16,.82);")
    c = c.replace("    letter-spacing: -0.03em;\n    text-transform: lowercase;", "    letter-spacing: -0.02em;\n    text-transform: none;")
    cap.write_text(c)
print("post-assemble: gsap → assets/vendor, root ground → #0A0A10")
