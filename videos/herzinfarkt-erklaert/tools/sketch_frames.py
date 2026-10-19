#!/usr/bin/env python3
"""Pose the 13 med2be frames as static sketches (sketch pass, review-loop § 2).

Writes compositions/frames/NN-*.html as bare <template> sub-compositions with the
full frame.md treatment (fonts, palette, grain, handles) and an empty paused
timeline. Motion is added in the build pass on top of these confirmed layouts.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "compositions" / "frames"
OUT.mkdir(parents=True, exist_ok=True)

C = dict(ink="#0A0A10", navy="#0B1030", blue="#3D5AFE", cream="#F0ECE5", muted="#8E8E98",
         hint="#484950", border="#262628", mag="#E838C8", red="#E5483A", teal="#2EC4B6",
         orange="#F28A2E", grey="#6E6E74")

FONTS = """
@font-face{font-family:"Barlow";font-weight:500;font-display:block;src:url("assets/fonts/barlow-latin-500-normal.woff2") format("woff2")}
@font-face{font-family:"Barlow";font-weight:700;font-display:block;src:url("assets/fonts/barlow-latin-700-normal.woff2") format("woff2")}
@font-face{font-family:"Barlow";font-weight:800;font-display:block;src:url("assets/fonts/barlow-latin-800-normal.woff2") format("woff2")}
@font-face{font-family:"Barlow";font-weight:900;font-display:block;src:url("assets/fonts/barlow-latin-900-normal.woff2") format("woff2")}
@font-face{font-family:"IBM Plex Mono";font-weight:500;font-display:block;src:url("assets/fonts/ibm-plex-mono-latin-500-normal.woff2") format("woff2")}
"""


def base_css(p):
    return f"""
#root{{position:absolute;inset:0;overflow:hidden;container-type:size;color:{C['cream']};font-family:"Barlow",sans-serif;}}
.{p}-layer{{position:absolute;inset:0;}}
.{p}-art{{position:absolute;left:0;top:0;width:1080px;height:1920px;overflow:visible;}}
.{p}-kicker{{position:absolute;font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:2.6cqw;letter-spacing:.14em;text-transform:uppercase;color:{C['blue']};white-space:nowrap;}}
.{p}-kicker b{{font-weight:500;color:{C['cream']};}}
.{p}-h2{{position:absolute;font-weight:800;font-size:8.5cqw;line-height:1;letter-spacing:-.02em;text-transform:lowercase;white-space:nowrap;}}
.{p}-h1{{position:absolute;font-weight:900;font-size:12cqw;line-height:.92;letter-spacing:-.03em;text-transform:lowercase;white-space:nowrap;}}
.{p}-h3{{font-weight:700;font-size:6cqw;line-height:1.1;text-transform:lowercase;}}
.{p}-lab{{font-family:"IBM Plex Mono",monospace;font-weight:500;font-size:2.6cqw;letter-spacing:.14em;text-transform:uppercase;}}
.{p}-chip{{position:absolute;display:flex;align-items:center;gap:22px;padding:22px 30px;border:1.5px solid rgba(240,236,229,.28);border-radius:22px;background:rgba(10,10,16,.55);white-space:nowrap;}}
.{p}-chip .{p}-lab{{color:{C['blue']};}}
.{p}-mark{{position:absolute;font-weight:900;font-size:5.2cqw;letter-spacing:-.03em;line-height:1;}}
.{p}-mark i{{font-style:normal;color:{C['blue']};}}
"""


def defs(p, red_bloom=False):
    """Shared SVG filters: film grain, stipple fill, soft glow."""
    return f"""
<defs>
  <filter id="{p}-grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <filter id="{p}-stip" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="1.35" numOctaves="1" seed="4" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.55" result="m"/>
    <feComposite in="SourceGraphic" in2="m" operator="in"/>
  </filter>
  <filter id="{p}-glow" filterUnits="userSpaceOnUse" x="-600" y="-600" width="2400" height="3200">
    <feGaussianBlur stdDeviation="18" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="{p}-blur" filterUnits="userSpaceOnUse" x="-600" y="-600" width="2400" height="3200"><feGaussianBlur stdDeviation="60"/></filter>
  <linearGradient id="{p}-skin" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#9A9AA2"/><stop offset=".55" stop-color="#6E6E74"/><stop offset="1" stop-color="#3A3A40"/>
  </linearGradient>
  <linearGradient id="{p}-bm" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{C['blue']}"/><stop offset="1" stop-color="{C['mag']}"/>
  </linearGradient>
  <radialGradient id="{p}-heart" cx=".42" cy=".35" r=".75">
    <stop offset="0" stop-color="#FF7A6A"/><stop offset=".5" stop-color="{C['red']}"/><stop offset="1" stop-color="#5A1020"/>
  </radialGradient>
  <radialGradient id="{p}-mus" cx=".5" cy=".4" r=".8">
    <stop offset="0" stop-color="#8A8A92"/><stop offset="1" stop-color="#3A3A42"/>
  </radialGradient>
</defs>"""


def ground(p, dur, bloom=(540, 900, C["blue"], .22), navy=False, bloom2=None):
    bx, by, bc, bo = bloom
    b2 = ""
    if bloom2:
        x2, y2, c2, o2 = bloom2
        b2 = f'<circle cx="{x2}" cy="{y2}" r="420" fill="{c2}" opacity="{o2}" filter="url(#{p}-blur)"/>'
    g = C["navy"] if navy else C["ink"]
    return f"""
<div class="clip {p}-layer" id="{p}-ground" data-start="0" data-duration="{dur}" data-track-index="0" style="background:radial-gradient(120% 80% at 50% 45%, {g} 0%, #050508 100%);">
  <svg class="{p}-art" viewBox="0 0 1080 1920">{defs(p)}
    <circle cx="{bx}" cy="{by}" r="460" fill="{bc}" opacity="{bo}" filter="url(#{p}-blur)"/>{b2}
  </svg>
</div>"""


def grain_layer(p, dur):
    return f"""
<div class="clip {p}-layer" id="{p}-grainlayer" data-start="0" data-duration="{dur}" data-track-index="9" style="mix-blend-mode:overlay;opacity:.22;pointer-events:none;">
  <svg class="{p}-art" viewBox="0 0 1080 1920"><rect width="1080" height="1920" filter="url(#{p}-grain)"/></svg>
</div>"""


def handle(x, y, color=C["cream"], size=16, filled=False, kind="sq"):
    s = size / 2
    fill = color if filled else C["ink"]
    if kind == "dia":
        return (f'<g transform="translate({x} {y}) rotate(45)"><rect x="{-s}" y="{-s}" width="{size}" height="{size}" fill="{fill}" stroke="{color}" stroke-width="1.6"/></g>'
                f'<circle cx="{x}" cy="{y}" r="{s*0.45:.1f}" fill="none" stroke="{color}" stroke-width="1.4"/>')
    return f'<rect x="{x-s}" y="{y-s}" width="{size}" height="{size}" fill="{fill}" stroke="{color}" stroke-width="1.6"/>'


def selbox(x, y, w, h, color=C["cream"], dash=True, r=0):
    d = 'stroke-dasharray="8 8"' if dash else ""
    hs = "".join(handle(px, py, color) for px, py in [(x, y), (x + w, y), (x, y + h), (x + w, y + h)])
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="none" stroke="{color}" stroke-width="1.5" opacity=".75" {d}/>' + hs


def tangent(x, y, dx, dy, color=C["cream"]):
    """A bezier anchor (diamond) with its two tangent handles."""
    return (f'<line x1="{x-dx}" y1="{y-dy}" x2="{x+dx}" y2="{y+dy}" stroke="{color}" stroke-width="1.4" opacity=".7"/>'
            + handle(x - dx, y - dy, color, 12, True, "sq") + handle(x + dx, y + dy, color, 12, True, "sq")
            + handle(x, y, color, 18, False, "dia"))


def scatter(pts):
    out = []
    for x, y, c, f in pts:
        out.append(f'<rect x="{x-7}" y="{y-7}" width="14" height="14" fill="{c}" opacity="{0.9 if f else 0.55}"/>')
    return "".join(out)


def arrow(x1, y1, x2, y2, color=C["cream"], w=3):
    import math
    a = math.atan2(y2 - y1, x2 - x1)
    l = 18
    p1 = (x2 - l * math.cos(a - .45), y2 - l * math.sin(a - .45))
    p2 = (x2 - l * math.cos(a + .45), y2 - l * math.sin(a + .45))
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>'
            f'<polyline points="{p1[0]:.1f},{p1[1]:.1f} {x2},{y2} {p2[0]:.1f},{p2[1]:.1f}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')


def arrow_inline(color=C["cream"], w=56, h=34):
    """Inline SVG arrow for text runs (fonts lack →)."""
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 56 34" style="display:inline-block;vertical-align:middle;margin:0 14px">'
            f'<path d="M4 17 H48 M34 5 L50 17 L34 29" fill="none" stroke="{color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>')


# ── shared illustrations ─────────────────────────────────────────────────────
HEART_BODY = "M210 230 C 300 170, 430 190, 480 280 C 530 370, 500 500, 430 600 C 410 630, 385 650, 360 640 C 260 600, 160 520, 140 420 C 125 340, 150 270, 210 230 Z"
AORTA = "M285 245 C 272 150, 305 92, 362 92 C 420 92, 452 132, 452 196"
PULM = "M335 252 C 342 205, 382 178, 425 188"
SVC = "M232 270 L 226 118"
RCA = "M290 262 C 232 292, 192 342, 186 420 C 182 482, 212 542, 262 584"
LAD = "M322 266 C 342 362, 352 482, 366 632"
RCX = "M328 262 C 384 250, 442 272, 478 324 C 498 356, 504 392, 500 430"


def heart(p, tx, ty, s, mode="grain", glow=True, vessels=True, topo=False, vcol=None):
    """Stylised anatomical heart in a 600x700 box, apex lower right (anterior view)."""
    vcol = vcol or {}
    fill = f"url(#{p}-heart)" if mode == "grain" else "none"
    filt = f'filter="url(#{p}-stip)"' if mode == "grain" else ""
    stroke = "" if mode == "grain" else f'stroke="{C["cream"]}" stroke-width="{2/s:.2f}"'
    glow_el = (f'<path d="{HEART_BODY}" fill="{C["red"]}" opacity=".55" filter="url(#{p}-blur)"/>' if glow else "")
    tubes = ""
    tw = 1 if mode == "grain" else 0
    if mode == "grain":
        tubes = (f'<path d="{SVC}" stroke="#7A2A3A" stroke-width="38" fill="none" stroke-linecap="round" {filt}/>'
                 f'<path d="M318 96 L 312 40 M356 90 L 356 30 M396 96 L 402 38" stroke="#B8323A" stroke-width="20" fill="none" stroke-linecap="round" {filt}/>'
                 f'<path d="{AORTA}" stroke="#C83A3E" stroke-width="50" fill="none" stroke-linecap="round" {filt}/>'
                 f'<path d="{PULM}" stroke="#5B66D8" stroke-width="40" fill="none" stroke-linecap="round" {filt}/>')
    else:
        lw = 2 / s
        tubes = (f'<path d="{SVC}" stroke="{C["cream"]}" stroke-width="{lw:.2f}" fill="none"/>'
                 f'<path d="{AORTA}" stroke="{C["cream"]}" stroke-width="{lw:.2f}" fill="none"/>'
                 f'<path d="M262 240 C 255 140, 300 66, 362 66 C 438 66, 478 118, 478 196" stroke="{C["cream"]}" stroke-width="{lw:.2f}" fill="none"/>'
                 f'<path d="{PULM}" stroke="{C["cream"]}" stroke-width="{lw:.2f}" fill="none"/>')
    topo_el = ""
    if topo:
        rings = []
        for i, k in enumerate([0.92, 0.78, 0.64, 0.5, 0.36, 0.22]):
            cx, cy = 330, 420
            rings.append(f'<path d="{HEART_BODY}" transform="translate({cx*(1-k):.1f} {cy*(1-k):.1f}) scale({k})" fill="none" stroke="{C["cream"]}" stroke-width="{1.4/(s*k):.2f}" opacity="{0.18+0.08*i:.2f}"/>')
        topo_el = "".join(rings)
    ves = ""
    if vessels:
        def v(d, key):
            col = vcol.get(key, "#F6D7CF" if mode == "grain" else C["cream"])
            w = vcol.get(key + "_w", 7 if mode == "grain" else 3)
            op = vcol.get(key + "_o", .85)
            return f'<path d="{d}" stroke="{col}" stroke-width="{w/s if mode!="grain" else w}" fill="none" stroke-linecap="round" opacity="{op}"/>'
        ves = v(RCA, "rca") + v(LAD, "lad") + v(RCX, "rcx")
    return (f'<g transform="translate({tx} {ty}) scale({s})">{glow_el}{tubes}'
            f'<path d="{HEART_BODY}" fill="{fill}" {filt} {stroke}/>{topo_el}{ves}</g>')


def hand(p, tx, ty, rot, s, fill=None, op=.92, flip=False):
    """Flat stylised hand: palm + four fingers + thumb + wrist, fingers pointing up."""
    fill = fill or f"url(#{p}-skin)"
    fx = -1 if flip else 1
    fingers = "".join(
        f'<rect x="{x}" y="{-60-h}" width="66" height="{h+70}" rx="33" />'
        for x, h in [(-132, 210), (-62, 250), (8, 236), (78, 190)])
    return (f'<g transform="translate({tx} {ty}) rotate({rot}) scale({s*fx} {s})" fill="{fill}" opacity="{op}" filter="url(#{p}-stip)">'
            f'<rect x="-140" y="-80" width="292" height="300" rx="120"/>{fingers}'
            f'<rect x="-250" y="-20" width="66" height="230" rx="33" transform="rotate(-48 -217 95)"/>'
            f'<rect x="-120" y="150" width="250" height="700" rx="60"/></g>')


# ── frame writer ─────────────────────────────────────────────────────────────
def write(fid, dur, css, body):
    p = "f" + fid[:2]
    html = f"""<template>
  <link rel="stylesheet" href="assets/css/med2be.css" />
  <style>{FONTS}{base_css(p)}{css}
  </style>
  <div id="root" data-composition-id="{fid}" data-width="1080" data-height="1920" data-duration="{dur}">
{body}
{grain_layer(p, dur)}
  </div>
  <script src="assets/vendor/gsap.min.js"></script>
  <script>
    // Sketch pass: static pose. Motion arrives in the build pass.
    const tl = gsap.timeline({{ paused: true }});
    window.__timelines["{fid}"] = tl;
  </script>
</template>
"""
    (OUT / f"{fid}.html").write_text(html)


def content(p, dur, inner, track=1):
    return f'<div class="clip {p}-layer" id="{p}-stage" data-start="0" data-duration="{dur}" data-track-index="{track}">{inner}</div>'


def art(p, svg):
    return f'<svg class="{p}-art" viewBox="0 0 1080 1920">{svg}</svg>'


def mark(p, x=76, y=168):
    return (f'<div class="{p}-mark" style="left:{x}px;top:{y}px">med<i>2</i>be</div>')


# ── F01 hook ─────────────────────────────────────────────────────────────────
def f01():
    fid, d, p = "01-hook", 4, "f01"
    torso = (f'<path d="M-20 1660 C 70 1180, 250 1010, 420 960 L 440 850 M640 850 L 660 960 C 830 1010, 1010 1180, 1100 1660" '
             f'fill="none" stroke="{C["cream"]}" stroke-width="2" opacity=".45"/>'
             f'<path d="M440 850 C 460 790, 620 790, 640 850" fill="none" stroke="{C["cream"]}" stroke-width="2" opacity=".3"/>')
    svg = (torso + heart(p, 400, 1000, .52, topo=True)
           + hand(p, 600, 1235, -28, .92, op=.78)
           + selbox(380, 1000, 330, 380, C["cream"])
           + tangent(712, 1060, 46, -30, C["mag"])
           + scatter([(160, 1180, C["blue"], 1), (930, 1230, C["teal"], 1), (880, 1440, C["blue"], 0), (210, 1450, C["orange"], 1),
                      (980, 980, C["blue"], 1), (120, 920, C["teal"], 0), (760, 880, C["orange"], 0), (330, 1540, C["blue"], 1)]))
    body = ground(p, d, (560, 1180, C["red"], .42)) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">med2be <b>· krankheitslehre</b></div>
  <div style="position:absolute;left:68px;top:322px;font-weight:900;font-size:21cqw;line-height:.86;letter-spacing:-.045em;">20<span style="color:{C['mag']}"> min.</span></div>
  <div class="{p}-h3" style="position:absolute;left:76px;top:560px;color:{C['muted']}">druck auf der brust</div>
""")
    write(fid, d, "", body)


# ── F02 title ────────────────────────────────────────────────────────────────
def f02():
    fid, d, p = "02-title", 5.5, "f02"
    svg = (f'<rect x="210" y="370" width="660" height="660" rx="150" fill="rgba(240,236,229,.04)" stroke="{C["cream"]}" stroke-width="1.5" opacity=".7"/>'
           + "".join(handle(x, y) for x, y in [(540, 370), (870, 700), (540, 1030), (210, 700)])
           + heart(p, 280, 400, .88, topo=True)
           + hand(p, 120, 360, 128, .62, fill=C["red"], op=.9)
           + hand(p, 960, 1060, -52, .62, fill=C["blue"], op=.92)
           + scatter([(130, 1110, C["blue"], 1), (950, 330, C["teal"], 1), (980, 820, C["orange"], 0), (90, 640, C["teal"], 0)]))
    body = ground(p, d, (540, 700, C["red"], .3), bloom2=(540, 760, C["blue"], .18)) + content(p, d, mark(p) + art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:1150px">myokardinfarkt <b>· pathophysiologie</b></div>
  <div class="{p}-h1" style="left:66px;top:1205px;font-size:16cqw;">herzinfarkt</div>
  <div class="{p}-h3" style="position:absolute;left:76px;top:1395px;color:{C['muted']}">schritt für schritt erklärt</div>
""")
    write(fid, d, "", body)


# ── F03 Risikofaktoren ───────────────────────────────────────────────────────
def icon(kind, x, y):
    c = C["cream"]
    box = f'<rect x="{x}" y="{y}" width="132" height="132" rx="30" fill="rgba(240,236,229,.04)" stroke="{c}" stroke-width="1.6" opacity=".9"/>'
    cx, cy = x + 66, y + 66
    if kind == "smoke":
        g = (f'<rect x="{cx-42}" y="{cy+8}" width="84" height="18" rx="4" fill="none" stroke="{c}" stroke-width="3"/>'
             f'<line x1="{cx+22}" y1="{cy+8}" x2="{cx+22}" y2="{cy+26}" stroke="{C["orange"]}" stroke-width="3"/>'
             f'<path d="M{cx-20} {cy-4} C {cx-34} {cy-18}, {cx-6} {cy-26}, {cx-20} {cy-42}" fill="none" stroke="{c}" stroke-width="3" stroke-linecap="round"/>'
             f'<path d="M{cx} {cy-4} C {cx-14} {cy-18}, {cx+14} {cy-26}, {cx} {cy-42}" fill="none" stroke="{c}" stroke-width="3" stroke-linecap="round" opacity=".6"/>')
    elif kind == "bp":
        g = (f'<path d="M{cx-40} {cy+20} A 44 44 0 1 1 {cx+40} {cy+20}" fill="none" stroke="{c}" stroke-width="3"/>'
             f'<line x1="{cx}" y1="{cy+14}" x2="{cx+28}" y2="{cy-20}" stroke="{C["red"]}" stroke-width="4" stroke-linecap="round"/>'
             f'<circle cx="{cx}" cy="{cy+14}" r="6" fill="{c}"/>')
    elif kind == "drop":
        g = (f'<path d="M{cx} {cy-46} C {cx+30} {cy-10}, {cx+38} {cy+8}, {cx+38} {cy+18} A 38 38 0 0 1 {cx-38} {cy+18} C {cx-38} {cy+8}, {cx-30} {cy-10}, {cx} {cy-46} Z" fill="none" stroke="{c}" stroke-width="3"/>'
             f'<rect x="{cx-12}" y="{cy+6}" width="24" height="24" fill="none" stroke="{C["blue"]}" stroke-width="3"/>')
    else:  # ldl
        dots = "".join(f'<circle cx="{cx+34*__import__("math").cos(a/6*6.283):.1f}" cy="{cy+34*__import__("math").sin(a/6*6.283):.1f}" r="7" fill="{C["mag"]}"/>' for a in range(6))
        g = f'<circle cx="{cx}" cy="{cy}" r="34" fill="none" stroke="{c}" stroke-width="3"/><circle cx="{cx}" cy="{cy}" r="14" fill="#F2D28A" opacity=".85"/>' + dots
    return box + g


def f03():
    fid, d, p = "03-risiko", 6.5, "f03"
    rows = [("smoke", "rauchen"), ("bp", "bluthochdruck"), ("drop", "diabetes"), ("ldl", "hohes ldl")]
    ys = [520, 700, 880, 1060]
    svg = "".join(icon(k, 92, y) for (k, _), y in zip(rows, ys))
    # converging lines into the vessel
    svg += "".join(f'<path d="M224 {y+66} C 700 {y+66}, 760 {1330}, 860 {1330}" fill="none" stroke="{C["blue"]}" stroke-width="2" opacity=".55" stroke-dasharray="6 10"/>' for y in ys)
    svg += (f'<rect x="-20" y="1300" width="1120" height="64" rx="32" fill="{C["blue"]}" opacity=".9" filter="url(#{p}-stip)"/>'
            f'<rect x="-20" y="1300" width="1120" height="64" rx="32" fill="none" stroke="{C["cream"]}" stroke-width="1.5" opacity=".5"/>'
            + "".join(f'<circle cx="{x}" cy="1332" r="9" fill="{C["cream"]}" opacity=".8"/>' for x in (150, 330, 520, 700, 890))
            + selbox(70, 1270, 940, 124, C["cream"]))
    labels = "".join(f'<div class="{p}-h3" style="position:absolute;left:262px;top:{y+30}px">{t}</div>' for (_, t), y in zip(rows, ys))
    body = ground(p, d, (540, 1300, C["blue"], .25)) + content(p, d, art(p, svg) + labels + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">am anfang</div>
  <div class="{p}-h2" style="left:72px;top:312px">risikofaktoren</div>
  <div class="{p}-chip" style="left:76px;top:1440px"><span class="{p}-lab">+ familie · alter · bewegungsmangel</span></div>
""")
    write(fid, d, "", body)


# ── F04 Atherosklerose ───────────────────────────────────────────────────────
def foam(cx, cy, r):
    import math
    out = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{C["blue"]}" opacity=".75"/>']
    for i in range(9):
        a = i * 0.7
        rr = r * (0.3 + 0.35 * ((i * 37) % 10) / 10)
        out.append(f'<circle cx="{cx + r*0.5*math.cos(a):.1f}" cy="{cy + r*0.5*math.sin(a):.1f}" r="{rr*0.45:.1f}" fill="#F2D28A" opacity=".85"/>')
    return "".join(out)


def f04():
    fid, d, p = "04-atherosklerose", 8, "f04"
    import math
    cx, cy = 540, 960
    ldl = "".join(f'<circle cx="{cx + 210*math.cos(a):.1f}" cy="{cy + 210*math.sin(a):.1f}" r="11" fill="#F2D28A"/>' for a in (-1.1, -0.95, -0.8, -0.65))
    ldl_wall = "".join(f'<circle cx="{cx + r*math.cos(a):.1f}" cy="{cy + r*math.sin(a):.1f}" r="10" fill="#F2D28A" opacity=".9"/>' for r, a in ((262, -0.9), (282, -0.7), (272, -1.05)))
    blood = "".join(f'<circle cx="{cx + r*math.cos(a):.1f}" cy="{cy + r*math.sin(a):.1f}" r="14" fill="{C["red"]}" opacity=".75"/>' for r, a in ((60, 0.3), (120, 2.1), (90, 3.6), (150, 4.4), (40, 5.2), (170, 1.1), (130, 2.9)))
    svg = (f'<circle cx="{cx}" cy="{cy}" r="400" fill="none" stroke="{C["cream"]}" stroke-width="1.5" opacity=".35"/>'
           f'<circle cx="{cx}" cy="{cy}" r="370" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>'
           f'<circle cx="{cx}" cy="{cy}" r="300" fill="#2A1A24" opacity=".9"/>'
           f'<circle cx="{cx}" cy="{cy}" r="300" fill="none" stroke="#A9A9B4" stroke-width="22" opacity=".55" filter="url(#{p}-stip)"/>'
           f'<circle cx="{cx}" cy="{cy}" r="232" fill="#140A10"/>'
           f'<circle cx="{cx}" cy="{cy}" r="232" fill="none" stroke="{C["blue"]}" stroke-width="10" stroke-dasharray="22 8" opacity=".95"/>'
           # endothelial gap (top right)
           f'<path d="M{cx + 232*math.cos(-1.02):.1f} {cy + 232*math.sin(-1.02):.1f} A 232 232 0 0 1 {cx + 232*math.cos(-0.72):.1f} {cy + 232*math.sin(-0.72):.1f}" stroke="#140A10" stroke-width="16" fill="none"/>'
           + blood + ldl + ldl_wall
           + foam(cx + 268 * math.cos(-0.35), cy + 268 * math.sin(-0.35), 30)
           + foam(cx + 262 * math.cos(-0.08), cy + 262 * math.sin(-0.08), 26)
           + f'<circle cx="{cx + 270*math.cos(-1.35):.1f}" cy="{cy + 270*math.sin(-1.35):.1f}" r="26" fill="{C["blue"]}" opacity=".9"/>'
           + selbox(cx + 120, cy - 330, 250, 230, C["cream"])
           + arrow(830, 1300, 760, 1150, C["cream"], 2) + arrow(260, 1330, 340, 1190, C["cream"], 2)
           + tangent(cx - 300, cy - 300, 40, 26, C["teal"])
           + scatter([(130, 600, C["blue"], 1), (980, 1250, C["orange"], 1), (930, 560, C["teal"], 0), (110, 1310, C["blue"], 0)]))
    body = ground(p, d, (540, 960, C["blue"], .2)) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">schritt 01</div>
  <div class="{p}-h2" style="left:72px;top:312px">atherosklerose</div>
  <div class="{p}-chip" style="left:640px;top:470px"><span class="{p}-lab" style="color:#F2D28A">ldl</span><span class="{p}-h3" style="font-size:4.2cqw">dringt ein</span></div>
  <div class="{p}-chip" style="left:66px;top:1320px"><span class="{p}-lab">endothel</span><span class="{p}-h3" style="font-size:4.2cqw">geschädigt</span></div>
  <div class="{p}-chip" style="left:66px;top:1440px"><span class="{p}-lab">makrophage</span>{arrow_inline(C['cream'],44,28)}<span class="{p}-h3" style="font-size:4.2cqw">schaumzelle</span></div>
""")
    write(fid, d, "", body)


# ── vessel (longitudinal) used by F05/F06/F12 ────────────────────────────────
def vessel_long(p, y_top=690, y_bot=1170, wall=96):
    return (f'<rect x="-30" y="{y_top-wall}" width="1140" height="{wall}" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>'
            f'<rect x="-30" y="{y_bot}" width="1140" height="{wall}" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>'
            f'<rect x="-30" y="{y_top}" width="1140" height="{y_bot-y_top}" fill="#140A10" opacity=".9"/>'
            f'<line x1="-30" y1="{y_top}" x2="1110" y2="{y_top}" stroke="{C["blue"]}" stroke-width="5" stroke-dasharray="20 8"/>'
            f'<line x1="-30" y1="{y_bot}" x2="1110" y2="{y_bot}" stroke="{C["blue"]}" stroke-width="5" stroke-dasharray="20 8"/>')


PLAQUE = "M200 1170 C 300 1170, 360 860, 540 850 C 720 860, 780 1170, 880 1170 Z"


def f05():
    fid, d, p = "05-plaque", 5.5, "f05"
    blood = "".join(f'<circle cx="{x}" cy="{y}" r="14" fill="{C["red"]}" opacity=".75"/>' for x, y in ((80, 760), (160, 900), (120, 1060), (300, 790), (420, 770), (560, 760), (690, 790), (820, 900), (950, 820), (1000, 1050), (260, 960)))
    svg = (vessel_long(p) + blood
           + f'<path d="{PLAQUE}" fill="#3A2A30" filter="url(#{p}-stip)"/>'
           + f'<ellipse cx="540" cy="1050" rx="230" ry="110" fill="{C["mag"]}" opacity=".55" filter="url(#{p}-blur)"/>'
           + f'<ellipse cx="540" cy="1050" rx="200" ry="92" fill="#F2D28A" opacity=".85" filter="url(#{p}-stip)"/>'
           + f'<path d="M250 1160 C 330 1150, 380 880, 540 872 C 700 880, 750 1150, 830 1160" fill="none" stroke="{C["cream"]}" stroke-width="7"/>'
           # bracket on the cap
           + f'<line x1="540" y1="800" x2="540" y2="872" stroke="{C["cream"]}" stroke-width="1.5"/>' + handle(540, 862, C["mag"]) + handle(540, 880, C["mag"])
           + selbox(320, 960, 440, 190, C["mag"])
           + tangent(720, 905, 42, 28, C["cream"])
           + scatter([(150, 1420, C["blue"], 1), (950, 520, C["teal"], 1), (980, 1420, C["orange"], 0), (90, 560, C["blue"], 0)]))
    body = ground(p, d, (540, 1050, C["mag"], .25)) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">schritt 02</div>
  <div class="{p}-h2" style="left:72px;top:312px">instabiler plaque</div>
  <div class="{p}-chip" style="left:560px;top:430px"><span class="{p}-lab" style="color:{C['mag']}">kappe</span><span class="{p}-h3" style="font-size:4.2cqw">dünn</span></div>
  <div class="{p}-chip" style="left:76px;top:1340px"><span class="{p}-lab" style="color:#F2D28A">lipidkern</span><span class="{p}-h3" style="font-size:4.2cqw">groß · weich</span></div>
  <div class="{p}-h1" style="left:72px;top:1470px;color:{C['mag']}">instabil.</div>
""")
    write(fid, d, "", body)


def f06():
    fid, d, p = "06-ruptur", 7, "f06"
    import math
    plts = "".join(f'<ellipse cx="{x}" cy="{y}" rx="20" ry="13" transform="rotate({(i*47)%180} {x} {y})" fill="#C9C3BA" opacity=".9" filter="url(#{p}-stip)"/>'
                   for i, (x, y) in enumerate(((470, 850), (500, 820), (540, 800), (580, 815), (610, 845), (520, 770), (565, 760), (600, 790), (450, 800), (640, 805), (495, 735), (590, 725))))
    fibrin = "".join(f'<path d="M{380+i*40} 700 C {420+i*40} 760, {360+i*40} 820, {420+i*40} 880" fill="none" stroke="{C["cream"]}" stroke-width="2" opacity=".55"/>' for i in range(8))
    upstream = "".join(f'<circle cx="{x}" cy="{y}" r="14" fill="{C["red"]}" opacity=".8"/>' for x, y in ((60, 760), (110, 820), (160, 770), (210, 830), (260, 780), (300, 840), (90, 890), (150, 940), (230, 900), (310, 930)))
    flame = (f'<path d="M545 880 C 500 820, 590 760, 540 690 C 520 650, 560 600, 548 560 C 600 620, 610 700, 580 760 C 620 720, 630 680, 620 640 C 670 720, 640 820, 560 885 Z" fill="{C["mag"]}" opacity=".9" filter="url(#{p}-stip)"/>'
             f'<path d="M545 880 C 520 840, 560 800, 548 760" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round" opacity=".9"/>'
             f'<path d="M420 892 L 680 878 M 450 905 L 640 900" stroke="#FFFFFF" stroke-width="3" opacity=".8"/>')
    svg = (vessel_long(p) + upstream
           + f'<path d="{PLAQUE}" fill="#3A2A30" filter="url(#{p}-stip)"/>'
           + f'<ellipse cx="540" cy="1050" rx="200" ry="92" fill="#F2D28A" opacity=".8" filter="url(#{p}-stip)"/>'
           + f'<path d="M250 1160 C 330 1150, 380 880, 500 874 M 590 876 C 700 880, 750 1150, 830 1160" fill="none" stroke="{C["cream"]}" stroke-width="7"/>'
           + f'<path d="M360 690 C 420 700, 470 730, 480 870 L 620 870 C 640 760, 690 700, 760 690 Z" fill="#7A1A2A" opacity=".95" filter="url(#{p}-stip)"/>'
           + fibrin + plts
           + f'<circle cx="545" cy="820" r="170" fill="{C["mag"]}" opacity=".35" filter="url(#{p}-blur)"/>' + flame
           + selbox(350, 680, 420, 220, C["mag"])
           + tangent(300, 1250, 44, -26, C["cream"])
           + scatter([(150, 1440, C["blue"], 1), (950, 520, C["teal"], 1), (980, 1300, C["orange"], 1), (90, 560, C["blue"], 0)]))
    body = ground(p, d, (540, 800, C["mag"], .35)) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">schritt 03</div>
  <div class="{p}-h2" style="left:72px;top:312px">ruptur + thrombus</div>
  <div class="{p}-chip" style="left:640px;top:450px"><span class="{p}-lab" style="color:{C['mag']}">ruptur</span></div>
  <div class="{p}-chip" style="left:76px;top:470px"><span class="{p}-lab" style="color:#C9C3BA">thrombozyten</span></div>
  <div class="{p}-chip" style="left:600px;top:1320px"><span class="{p}-lab" style="color:{C['red']}">thrombus</span></div>
  <div class="{p}-h1" style="left:72px;top:1450px;color:{C['mag']}">verschluss.</div>
""")
    write(fid, d, "", body)


# ── F07 Nekrose ──────────────────────────────────────────────────────────────
def f07():
    fid, d, p = "07-nekrose", 8.5, "f07"
    x0, x1, y0, y1 = 110, 970, 620, 1180
    topo = "".join(f'<path d="M{x0} {y0+40+i*48} C {x0+200} {y0+10+i*48}, {x0+420} {y0+90+i*48}, {x0+620} {y0+40+i*48} S {x1-40} {y0+20+i*48}, {x1} {y0+50+i*48}" fill="none" stroke="{C["cream"]}" stroke-width="1.4" opacity=".28"/>' for i in range(11))
    nec = (f'<path d="M{x0} {y1} L {x0} 930 C 240 880, 330 960, 470 905 C 600 850, 700 940, 820 890 C 880 870, 930 900, {x1} 880 L {x1} {y1} Z" fill="{C["red"]}" opacity=".9" filter="url(#{p}-stip)"/>'
           f'<path d="M{x0} 930 C 240 880, 330 960, 470 905 C 600 850, 700 940, 820 890 C 880 870, 930 900, {x1} 880" fill="none" stroke="#FF9A8A" stroke-width="4" filter="url(#{p}-glow)"/>')
    svg = (f'<clipPath id="{p}-slab"><rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="40"/></clipPath>'
           f'<g clip-path="url(#{p}-slab)"><rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>{topo}{nec}</g>'
           f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="40" fill="none" stroke="{C["cream"]}" stroke-width="1.5" opacity=".6"/>'
           + arrow(1015, 1150, 1015, 860, C["red"], 3)
           + selbox(x0, y0, x1 - x0, y1 - y0, C["cream"])
           + scatter([(160, 1290, C["blue"], 1), (960, 520, C["teal"], 1), (900, 1300, C["orange"], 0)]))
    body = ground(p, d, (540, 1000, C["red"], .3)) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">schritt 04 <b>· ischämie {arrow_inline(C['cream'],40,24)} nekrose</b></div>
  <div style="position:absolute;left:72px;top:318px;font-weight:900;font-size:14cqw;line-height:.95;letter-spacing:-.04em;">20–30<span style="font-size:7cqw;color:{C['muted']}"> min</span></div>
  <div class="{p}-lab" style="position:absolute;left:150px;top:648px;color:{C['cream']}">epikard</div>
  <div class="{p}-lab" style="position:absolute;left:150px;top:1112px;color:{C['ink']}">endokard</div>
  <div class="{p}-lab" style="position:absolute;left:600px;top:1210px;color:{C['red']}">von innen nach außen</div>
  <div class="{p}-h1" style="left:72px;top:1330px">zeit ist</div>
  <div class="{p}-h1" style="left:72px;top:1450px;color:{C['red']}">muskel.</div>
""")
    write(fid, d, "", body)


# ── F08 Gefäße ───────────────────────────────────────────────────────────────
def f08():
    fid, d, p = "08-gefaesse", 8, "f08"
    s = 1.45
    vcol = {"lad": C["blue"], "lad_w": 9, "lad_o": 1, "rcx": C["teal"], "rcx_w": 7, "rca": C["mag"], "rca_w": 7}
    svg = (f'<g opacity=".9">{heart(p, 540-330*s, 250, s, mode="line", glow=False, vcol=vcol)}</g>'
           + f'<g transform="translate({540-330*s} 250) scale({s})" filter="url(#{p}-glow)"><path d="{LAD}" stroke="{C["blue"]}" stroke-width="9" fill="none" stroke-linecap="round"/></g>'
           + tangent(int(540 - 330 * s + 352 * s), int(250 + 482 * s), 40, -8, C["blue"])
           + scatter([(140, 1100, C["blue"], 1), (960, 560, C["teal"], 1), (980, 1060, C["orange"], 0)]))
    def row(y, name, col, wall, leads):
        return (f'<div class="{p}-chip" style="left:66px;top:{y}px;width:948px;justify-content:flex-start">'
                f'<span class="{p}-lab" style="color:{col};width:120px;font-size:3.2cqw">{name}</span>{arrow_inline(C["cream"],44,28)}'
                f'<span class="{p}-h3" style="font-size:5.2cqw;flex:1">{wall}</span><span class="{p}-lab" style="color:{C["muted"]}">{leads}</span></div>')
    body = ground(p, d, (540, 760, C["blue"], .22)) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:200px">versorgungsgebiete <b>· ekg</b></div>
  {row(1230, 'riva', C['blue'], 'vorderwand', 'V1–V4')}
  {row(1360, 'rcx', C['teal'], 'seitenwand', 'I · aVL · V5–V6')}
  {row(1490, 'rca', C['mag'], 'hinterwand', 'II · III · aVF')}
""")
    write(fid, d, "", body)


# ── F09 Symptome ─────────────────────────────────────────────────────────────
def f09():
    fid, d, p = "09-symptome", 9.5, "f09"
    sil = (f'<g fill="url(#{p}-skin)" filter="url(#{p}-stip)" opacity=".95">'
           f'<ellipse cx="540" cy="380" rx="105" ry="130"/>'
           f'<rect x="495" y="480" width="90" height="90" rx="30"/>'
           f'<path d="M300 620 C 300 560, 400 540, 540 540 C 680 540, 780 560, 780 620 L 760 1080 L 320 1080 Z"/>'
           f'<path d="M780 610 C 840 640, 860 700, 870 780 L 900 1000 C 905 1030, 860 1040, 850 1010 L 790 800 Z"/>'
           f'<path d="M300 610 C 240 640, 220 700, 210 780 L 180 1000 C 175 1030, 220 1040, 230 1010 L 290 800 Z"/></g>')
    pain = (f'<circle cx="560" cy="720" r="120" fill="{C["mag"]}" opacity=".55" filter="url(#{p}-blur)"/>'
            f'<circle cx="560" cy="720" r="46" fill="{C["mag"]}" filter="url(#{p}-glow)"/>'
            f'<path d="M580 690 C 700 640, 790 650, 840 760 C 860 830, 875 900, 880 980" fill="none" stroke="{C["mag"]}" stroke-width="4" stroke-dasharray="10 10"/>'
            f'<path d="M555 680 C 560 600, 565 540, 560 470" fill="none" stroke="{C["mag"]}" stroke-width="4" stroke-dasharray="10 10"/>'
            f'<path d="M550 760 C 540 840, 545 900, 540 960" fill="none" stroke="{C["mag"]}" stroke-width="4" stroke-dasharray="10 10"/>'
            + handle(880, 980, C["mag"], 18, True) + handle(560, 470, C["mag"], 18, True) + handle(540, 960, C["mag"], 18, True))
    svg = sil + pain + selbox(470, 640, 180, 160, C["cream"]) + scatter([(140, 520, C["blue"], 1), (980, 420, C["teal"], 1), (960, 1100, C["orange"], 0)])
    chip = lambda x, y, lab, txt, col=C["blue"]: f'<div class="{p}-chip" style="left:{x}px;top:{y}px"><span class="{p}-lab" style="color:{col}">{lab}</span><span class="{p}-h3" style="font-size:4.4cqw">{txt}</span></div>'
    warn = (f'<div class="{p}-chip" style="left:66px;top:1440px;border-color:{C["mag"]};background:rgba(232,56,200,.12)">'
            f'<svg width="40" height="36" viewBox="0 0 40 36"><path d="M20 3 L37 33 H3 Z" fill="none" stroke="{C["mag"]}" stroke-width="3.5" stroke-linejoin="round"/><path d="M20 14 V22 M20 27 V28" stroke="{C["mag"]}" stroke-width="3.5" stroke-linecap="round"/></svg>'
            f'<span class="{p}-h3" style="font-size:4.2cqw">frauen · diabetiker: <span style="color:{C["mag"]}">oft atypisch</span></span></div>')
    body = ground(p, d, (560, 720, C["mag"], .25)) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:200px">symptome</div>
  {chip(66, 1110, '&gt; 20 min', 'brustschmerz', C['mag'])}
  {chip(66, 1225, 'ausstrahlung', 'arm · kiefer · oberbauch')}
  {chip(66, 1340, 'vegetativ', 'kaltschweiß · todesangst')}
  {warn}
""")
    write(fid, d, "", body)


# ── F10 EKG ──────────────────────────────────────────────────────────────────
def ecg_path(x, y, w):
    """Normal beat then a STEMI beat with tombstone ST elevation."""
    u = w / 900
    def P(px, py):
        return f"{x+px*u:.1f} {y+py*u:.1f}"
    normal = f"M{P(0,0)} L{P(60,0)} C{P(75,-25)} {P(95,-25)} {P(110,0)} L{P(140,0)} L{P(150,20)} L{P(165,-150)} L{P(180,40)} L{P(192,0)} L{P(240,0)} C{P(265,-45)} {P(305,-45)} {P(330,0)} L{P(430,0)}"
    stemi = f"L{P(490,0)} C{P(505,-25)} {P(525,-25)} {P(540,0)} L{P(570,0)} L{P(580,20)} L{P(595,-150)} L{P(608,-70)} C{P(640,-80)} {P(700,-95)} {P(740,-40)} C{P(760,-10)} {P(780,0)} {P(800,0)} L{P(900,0)}"
    return normal, stemi


def f10():
    fid, d, p = "10-ekg", 6.5, "f10"
    gx, gy, gw, gh = 60, 500, 960, 520
    grid = "".join(f'<line x1="{gx+i*40}" y1="{gy}" x2="{gx+i*40}" y2="{gy+gh}" stroke="{C["mag"]}" stroke-width="{1.4 if i%5==0 else .7}" opacity="{.35 if i%5==0 else .16}"/>' for i in range(25))
    grid += "".join(f'<line x1="{gx}" y1="{gy+i*40}" x2="{gx+gw}" y2="{gy+i*40}" stroke="{C["mag"]}" stroke-width="{1.4 if i%5==0 else .7}" opacity="{.35 if i%5==0 else .16}"/>' for i in range(14))
    n, s = ecg_path(gx + 30, gy + 330, gw - 60)
    svg = (f'<rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" rx="36" fill="rgba(11,16,48,.75)"/>'
           f'<clipPath id="{p}-g"><rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" rx="36"/></clipPath><g clip-path="url(#{p}-g)">{grid}</g>'
           f'<rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" rx="36" fill="none" stroke="{C["cream"]}" stroke-width="1.5" opacity=".5"/>'
           f'<path d="{n}" fill="none" stroke="{C["blue"]}" stroke-width="7" stroke-linejoin="round" filter="url(#{p}-glow)"/>'
           f'<path d="M{n.split(" L")[-1]} {s}" fill="none" stroke="{C["red"]}" stroke-width="7" stroke-linejoin="round" filter="url(#{p}-glow)"/>'
           + f'<line x1="{gx+30+605*(gw-60)/900:.0f}" y1="{gy+330}" x2="{gx+30+760*(gw-60)/900:.0f}" y2="{gy+330}" stroke="{C["cream"]}" stroke-width="2" stroke-dasharray="6 6"/>'
           + selbox(int(gx + 30 + 600 * (gw - 60) / 900), gy + 220, 160, 110, C["cream"])
           + scatter([(140, 1560, C["blue"], 1), (960, 440, C["teal"], 1)]))
    card = lambda x, col, big, small: (f'<div style="position:absolute;left:{x}px;top:1090px;width:450px;height:480px;border-radius:36px;border:1.5px solid {col};background:rgba(10,10,16,.6);padding:40px 36px;">'
                                       f'<div class="{p}-lab" style="color:{col}">{small[0]}</div>'
                                       f'<div style="font-weight:900;font-size:10cqw;letter-spacing:-.03em;line-height:.95;margin-top:18px">{big}</div>'
                                       f'<div class="{p}-h3" style="font-size:4.4cqw;margin-top:22px;color:{C["muted"]};white-space:normal">{small[1]}</div></div>')
    body = ground(p, d, (540, 760, C["red"], .2), navy=True) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">diagnose <b>· 12-kanal-ekg</b></div>
  <div class="{p}-h2" style="left:72px;top:312px">ekg in 10 min</div>
  <div class="{p}-lab" style="position:absolute;left:{int(60+30+610*900/900)}px;top:556px;color:{C['red']};font-size:3.4cqw">st ↑</div>
  {card(60, C['red'], 'STEMI', ('st-hebung', 'in 2 benachbarten ableitungen'))}
  {card(570, C['blue'], 'NSTE-ACS', ('keine hebung', 'troponin entscheidet'))}
""")
    write(fid, d, "", body)


# ── F11 Troponin ─────────────────────────────────────────────────────────────
def f11():
    fid, d, p = "11-troponin", 7, "f11"
    ax, ay, aw, ah = 150, 520, 830, 560
    thr = ay + ah * 0.58
    svg = (f'<line x1="{ax}" y1="{ay}" x2="{ax}" y2="{ay+ah}" stroke="{C["cream"]}" stroke-width="1.5" opacity=".6"/>'
           f'<line x1="{ax}" y1="{ay+ah}" x2="{ax+aw}" y2="{ay+ah}" stroke="{C["cream"]}" stroke-width="1.5" opacity=".6"/>'
           f'<line x1="{ax}" y1="{thr}" x2="{ax+aw}" y2="{thr}" stroke="{C["cream"]}" stroke-width="2" stroke-dasharray="10 10" opacity=".7"/>'
           f'<path d="M{ax} {ay+ah-40} C {ax+200} {ay+ah-60}, {ax+300} {ay+ah-190}, {ax+430} {ay+150} S {ax+700} {ay+40}, {ax+aw-30} {ay+50}" fill="none" stroke="{C["mag"]}" stroke-width="8" stroke-linecap="round" filter="url(#{p}-glow)"/>'
           f'<path d="M{ax} {ay+ah-40} C {ax+300} {ay+ah-50}, {ax+600} {ay+ah-70}, {ax+aw-30} {ay+ah-80}" fill="none" stroke="{C["grey"]}" stroke-width="7" stroke-linecap="round"/>'
           + handle(ax + 330, ay + ah * 0.58, C["mag"], 20, True)
           + "".join(f'<line x1="{ax+aw*t:.0f}" y1="{ay+ah}" x2="{ax+aw*t:.0f}" y2="{ay+ah+14}" stroke="{C["cream"]}" stroke-width="2"/>' for t in (0, .4, .8))
           + selbox(ax + 260, ay + 200, 160, 210, C["cream"])
           + scatter([(110, 470, C["teal"], 1), (980, 1250, C["blue"], 1)]))
    body = ground(p, d, (700, 640, C["mag"], .22), navy=True) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">labor <b>· hs-troponin 0h/1h</b></div>
  <div class="{p}-h2" style="left:72px;top:312px">troponin</div>
  <div class="{p}-lab" style="position:absolute;left:{ax-20}px;top:{ay+ah+30}px">0 h</div>
  <div class="{p}-lab" style="position:absolute;left:{int(ax+aw*.4-20)}px;top:{ay+ah+30}px">1 h</div>
  <div class="{p}-lab" style="position:absolute;left:{int(ax+aw*.8-20)}px;top:{ay+ah+30}px">3 h</div>
  <div class="{p}-lab" style="position:absolute;left:{ax+20}px;top:{int(thr)-52}px;color:{C['muted']}">99. perzentile</div>
  <div class="{p}-chip" style="left:640px;top:440px;border-color:{C['mag']}"><span class="{p}-h3" style="font-size:4.6cqw;color:{C['mag']};text-transform:none">NSTEMI</span></div>
  <div class="{p}-chip" style="left:560px;top:{ay+ah-200}px"><span class="{p}-h3" style="font-size:4.4cqw;color:{C['muted']}">instabile angina</span></div>
  <div style="position:absolute;left:66px;top:1230px;width:948px;">
    <div class="{p}-h3" style="font-size:6.4cqw"><span style="color:{C['mag']}">erhöht</span> = nstemi</div>
    <div class="{p}-h3" style="font-size:6.4cqw;margin-top:26px;color:{C['muted']}">normal = instabile angina</div>
  </div>
""")
    write(fid, d, "", body)


# ── F12 Therapie ─────────────────────────────────────────────────────────────
def f12():
    fid, d, p = "12-therapie", 11.5, "f12"
    rows = [("112", "notruf"), ("ass", "+ heparin"), ("nitro", "wenn rr syst. &gt; 90"), ("analgesie", "schmerz lindern"),
            ("o<sub style='font-size:.7em'>2</sub>", "nur bei spo<sub style='font-size:.7em'>2</sub> &lt; 90 %")]
    rws = "".join(f'<div style="display:flex;align-items:baseline;gap:28px;padding:22px 0;border-top:1px solid rgba(240,236,229,.16)">'
                  f'<span class="{p}-lab" style="color:{C["blue"]};width:210px;font-size:3.2cqw">{a}</span><span class="{p}-h3" style="font-size:5.2cqw">{b}</span></div>' for a, b in rows)
    vy0, vy1 = 1290, 1400
    svg = (f'<rect x="70" y="1220" width="940" height="360" rx="44" fill="rgba(61,90,254,.14)" stroke="{C["blue"]}" stroke-width="1.5"/>'
           f'<rect x="70" y="1220" width="940" height="360" rx="44" fill="none" stroke="{C["blue"]}" stroke-width="2" filter="url(#{p}-glow)" opacity=".6"/>'
           f'<rect x="110" y="{vy0-30}" width="860" height="30" rx="10" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>'
           f'<rect x="110" y="{vy1}" width="860" height="30" rx="10" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>'
           f'<rect x="110" y="{vy0}" width="860" height="{vy1-vy0}" fill="#140A10"/>'
           + "".join(f'<path d="M{x} {vy0+6} L {x+40} {vy1-6} M {x+40} {vy0+6} L {x} {vy1-6}" stroke="{C["cream"]}" stroke-width="2" opacity=".75"/>' for x in range(470, 650, 40))
           + f'<line x1="110" y1="{(vy0+vy1)//2}" x2="760" y2="{(vy0+vy1)//2}" stroke="{C["cream"]}" stroke-width="4"/>'
           + "".join(f'<circle cx="{x}" cy="{(vy0+vy1)//2 + (18 if i%2 else -24)}" r="11" fill="{C["red"]}" opacity=".85"/>' for i, x in enumerate(range(160, 960, 70)))
           + handle(760, (vy0 + vy1) // 2, C["blue"], 18, True)
           + scatter([(990, 1180, C["teal"], 1), (100, 1640, C["orange"], 0)]))
    body = ground(p, d, (540, 1380, C["blue"], .3)) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">therapie <b>· esc 2023</b></div>
  <div class="{p}-h2" style="left:72px;top:312px">jede minute zählt</div>
  <div style="position:absolute;left:70px;top:450px;width:940px;padding:10px 44px 20px;border-radius:44px;background:rgba(240,236,229,.04);border:1.5px solid rgba(240,236,229,.22)">{rws}</div>
  <div style="position:absolute;left:110px;top:1430px;display:flex;align-items:baseline;gap:20px">
    <span style="font-weight:900;font-size:8cqw;letter-spacing:-.03em">STEMI</span>{arrow_inline(C['cream'],50,30)}<span style="font-weight:900;font-size:8cqw;letter-spacing:-.03em;color:{C['blue']}">PCI</span>
    <span class="{p}-lab" style="margin-left:18px;color:{C['cream']}">innerhalb 120 min</span></div>
""")
    write(fid, d, "", body)


# ── F13 Merke + CTA ──────────────────────────────────────────────────────────
def f13():
    fid, d, p = "13-merke", 7, "f13"
    svg = (arrow(110, 450, 110, 520, C["muted"], 3) + arrow(110, 640, 110, 710, C["muted"], 3)
           + selbox(395, 1062, 105, 148, C["blue"])
           + scatter([(980, 330, C["teal"], 1), (960, 980, C["blue"], 1), (120, 1290, C["orange"], 0), (940, 1330, C["blue"], 0)]))
    body = ground(p, d, (540, 1150, C["blue"], .3)) + content(p, d, art(p, svg) + f"""
  <div class="{p}-kicker" style="left:76px;top:262px">merke</div>
  <div class="{p}-h2" style="left:160px;top:330px">plaque reißt</div>
  <div class="{p}-h2" style="left:160px;top:530px">thrombus verschließt</div>
  <div class="{p}-h2" style="left:160px;top:720px;color:{C['red']}">muskel stirbt.</div>
  <div style="position:absolute;left:72px;top:1040px;font-weight:900;font-size:16cqw;letter-spacing:-.04em;line-height:1">med<span style="color:{C['blue']}">2</span>be</div>
  <div class="{p}-lab" style="position:absolute;left:80px;top:1250px;color:{C['muted']}">medizin · verständlich</div>
  <div class="{p}-chip" style="left:72px;top:1330px;background:{C['blue']};border-color:{C['blue']}"><span class="{p}-h3" style="font-size:5cqw">folgen</span>{arrow_inline(C['cream'],44,28)}</div>
  <div class="{p}-lab" style="position:absolute;left:76px;top:1530px;width:930px;white-space:normal;font-size:2.1cqw;line-height:1.5;color:{C['hint']}">nur zu lernzwecken · kein ersatz für ärztlichen rat · esc-leitlinie acs 2023</div>
""")
    write(fid, d, "", body)


if __name__ == "__main__":
    for f in (f01, f02, f03, f04, f05, f06, f07, f08, f09, f10, f11, f12, f13):
        f()
    print("wrote", len(list(OUT.glob("*.html"))), "frames")
