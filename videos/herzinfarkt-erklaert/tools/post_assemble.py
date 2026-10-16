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
p.write_text(s)
print("post-assemble: gsap → assets/vendor, root ground → #0A0A10")
