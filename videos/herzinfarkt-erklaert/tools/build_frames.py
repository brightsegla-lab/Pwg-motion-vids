#!/usr/bin/env python3
"""Build pass: the 13 confirmed sketch layouts, now moving.

Reuses the illustration helpers from sketch_frames.py (the approved layouts) and
adds one paused GSAP timeline per frame. Every reveal is keyed to the word the
narration names it on (word timings from audio_meta.json), and frame durations
come from STORYBOARD.md (synced to the real voice).

Run: python3 tools/build_frames.py
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sketch_frames as S  # noqa: E402
from sketch_frames import C, handle, selbox, tangent, arrow, arrow_inline, heart, hand, icon, foam, vessel_long, PLAQUE, ecg_path  # noqa: E402,F401
from sketch_frames import HEART_BODY, AORTA, PULM, SVC, RCA, LAD, RCX  # noqa: E402,F401

ROOT = S.ROOT
OUT = S.OUT
META = json.loads((ROOT / "audio_meta.json").read_text())
SB = (ROOT / "STORYBOARD.md").read_text()
DUR = {}
for _blk in re.split(r"(?m)^## Frame ", SB)[1:]:
    DUR[int(re.match(r"\d+", _blk).group())] = float(re.search(r"(?m)^- duration: ([\d.]+)s", _blk).group(1))
WORDS = {v["frame"]: v["words"] for v in META["voices"]}


def cue(frame, needle, which=0, offset=0.0):
    """Frame-local start time of the word containing `needle`."""
    hits = [w for w in WORDS[frame] if needle.lower() in w["text"].lower()]
    if not hits:
        raise SystemExit(f"frame {frame}: no word matching {needle!r}")
    return round(hits[which]["start"] + offset, 3)


# ── shared markup pieces with ids ───────────────────────────────────────────
def defs(p):
    return S.defs(p).replace('<feTurbulence type="fractalNoise" baseFrequency="0.9"',
                             f'<feTurbulence id="{p}-turb" type="fractalNoise" baseFrequency="0.9"', 1)


def ground(p, dur, bloom, navy=False, bloom2=None):
    bx, by, bc, bo = bloom
    b2 = ""
    if bloom2:
        x2, y2, c2, o2 = bloom2
        b2 = f'<circle id="{p}-bloom2" cx="{x2}" cy="{y2}" r="420" fill="{c2}" opacity="{o2}" filter="url(#{p}-blur)"/>'
    g = C["navy"] if navy else C["ink"]
    return f"""
<div class="clip {p}-layer" id="{p}-ground" data-start="0" data-duration="{dur}" data-track-index="0" style="background:radial-gradient(120% 80% at 50% 45%, {g} 0%, #050508 100%);">
  <svg class="{p}-art" viewBox="0 0 1080 1920">{defs(p)}
    <g id="{p}-bloom"><circle cx="{bx}" cy="{by}" r="460" fill="{bc}" opacity="{bo}" filter="url(#{p}-blur)"/></g>{b2}
  </svg>
</div>"""


def grain_layer(p, dur):
    return f"""
<div class="clip {p}-layer" id="{p}-grainlayer" data-start="0" data-duration="{dur}" data-track-index="9" style="mix-blend-mode:overlay;opacity:.22;pointer-events:none;">
  <svg class="{p}-art" viewBox="0 0 1080 1920"><rect width="1080" height="1920" filter="url(#{p}-grain)"/></svg>
</div>"""


def content(p, dur, inner):
    return (f'<div class="clip {p}-layer" id="{p}-stage" data-start="0" data-duration="{dur}" data-track-index="1">'
            f'<div class="{p}-layer" id="{p}-cam">{inner}</div></div>')


def art(p, svg, sid="art"):
    return f'<svg class="{p}-art" id="{p}-{sid}" viewBox="0 0 1080 1920">{svg}</svg>'


def g(id_, inner, extra=""):
    return f'<g id="{id_}" {extra}>{inner}</g>'


def scatter(p, pts):
    return "".join(f'<rect class="{p}-pt" x="{x-7}" y="{y-7}" width="14" height="14" fill="{c}" opacity="{0.9 if f else 0.55}"/>'
                   for x, y, c, f in pts)


DRAW_CSS = lambda p: f".{p}-draw{{stroke-dasharray:1;stroke-dashoffset:0;}}"  # noqa: E731

JS_HELPERS = """
    const pop = (s, at, o = {}) => tl.fromTo(s, { opacity: 0, scale: o.s ?? 0.6, transformOrigin: o.origin ?? "50% 50%" }, { opacity: 1, scale: 1, duration: o.d ?? 0.5, ease: o.e ?? "back.out(2.2)", stagger: o.st ?? 0 }, at);
    const rise = (s, at, o = {}) => tl.fromTo(s, { opacity: 0, y: o.y ?? 46 }, { opacity: 1, y: 0, duration: o.d ?? 0.55, ease: o.e ?? "power3.out", stagger: o.st ?? 0 }, at);
    const slide = (s, at, o = {}) => tl.fromTo(s, { opacity: 0, x: o.x ?? -60 }, { opacity: 1, x: 0, duration: o.d ?? 0.5, ease: o.e ?? "power3.out", stagger: o.st ?? 0 }, at);
    const fade = (s, at, o = {}) => tl.fromTo(s, { opacity: 0 }, { opacity: o.to ?? 1, duration: o.d ?? 0.4, ease: "power1.out", stagger: o.st ?? 0 }, at);
    const slam = (s, at, o = {}) => tl.fromTo(s, { opacity: 0, scale: o.s ?? 1.7, filter: "blur(14px)", transformOrigin: o.origin ?? "0% 50%" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: o.d ?? 0.45, ease: "expo.out" }, at);
    const draw = (s, at, d = 0.8, e = "power2.inOut") => tl.fromTo(s, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d, ease: e }, at);
    const beat = (s, at, k = 1.08) => { tl.to(s, { scale: k, transformOrigin: "50% 50%", duration: 0.11, ease: "power2.out" }, at); tl.to(s, { scale: 1, duration: 0.32, ease: "power2.inOut" }, at + 0.11); };
"""


def ambient(p, dur, cam=(1.0, 1.035)):
    steps = max(1, round(dur * 12))
    return f"""
    tl.to("#{p}-turb", {{ attr: {{ seed: {11 + steps} }}, duration: {dur}, ease: "steps({steps})" }}, 0);
    tl.fromTo("#{p}-cam", {{ scale: {cam[0]}, transformOrigin: "50% 45%" }}, {{ scale: {cam[1]}, duration: {dur}, ease: "none" }}, 0);
    tl.fromTo(".{p}-pt", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: -50, duration: {dur}, ease: "power1.out", stagger: 0.12 }}, 0.05);
    tl.fromTo("#{p}-bloom", {{ opacity: 0.6, scale: 0.9, transformOrigin: "50% 50%" }}, {{ opacity: 1, scale: 1.05, duration: {dur}, ease: "sine.inOut" }}, 0);
"""


def write(fid, dur, css, body, js):
    p = "f" + fid[:2]
    html = f"""<template>
  <link rel="stylesheet" href="assets/css/med2be.css" />
  <style>{S.FONTS}{S.base_css(p)}{DRAW_CSS(p)}{css}
  </style>
  <div id="root" data-composition-id="{fid}" data-width="1080" data-height="1920" data-duration="{dur}">
{body}
{grain_layer(p, dur)}
  </div>
  <script src="assets/vendor/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{JS_HELPERS}{ambient(p, dur)}{js}
    window.__timelines["{fid}"] = tl;
  </script>
</template>
"""
    (OUT / f"{fid}.html").write_text(html)


def kicker(p, text, top=262, sid="kick"):
    return f'<div class="{p}-kicker" id="{p}-{sid}" style="left:76px;top:{top}px">{text}</div>'


def h2(p, text, top=312, sid="h2", style=""):
    return f'<div class="{p}-h2" id="{p}-{sid}" style="left:72px;top:{top}px;{style}">{text}</div>'


# ── F01 hook ────────────────────────────────────────────────────────────────
def f01():
    fid, n, p = "01-hook", 1, "f01"
    d = DUR[n]
    torso = (f'<path class="{p}-draw" pathLength="1" d="M-20 1660 C 70 1180, 250 1010, 420 960 L 440 850 M640 850 L 660 960 C 830 1010, 1010 1180, 1100 1660" '
             f'fill="none" stroke="{C["cream"]}" stroke-width="2" opacity=".45"/>'
             f'<path class="{p}-draw" pathLength="1" d="M440 850 C 460 790, 620 790, 640 850" fill="none" stroke="{C["cream"]}" stroke-width="2" opacity=".3"/>')
    svg = (g(f"{p}-torso", torso) + g(f"{p}-heart", heart(p, 400, 1000, .52, topo=True))
           + g(f"{p}-hand", hand(p, 600, 1235, -28, .92, op=.78))
           + g(f"{p}-sel", selbox(380, 1000, 330, 380, C["cream"]))
           + g(f"{p}-tan", tangent(712, 1060, 46, -30, C["mag"]))
           + scatter(p, [(160, 1180, C["blue"], 1), (930, 1230, C["teal"], 1), (880, 1440, C["blue"], 0), (210, 1450, C["orange"], 1),
                         (980, 980, C["blue"], 1), (120, 920, C["teal"], 0), (760, 880, C["orange"], 0), (330, 1540, C["blue"], 1)]))
    body = ground(p, d, (560, 1180, C["red"], .42)) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'med2be <b>· krankheitslehre</b>')}
  <div id="{p}-big" style="position:absolute;left:68px;top:322px;font-weight:900;font-size:21cqw;line-height:.86;letter-spacing:-.045em;"><span id="{p}-20">20</span><span id="{p}-min" style="color:{C['mag']}"> min.</span></div>
  <div class="{p}-h3" id="{p}-sub" style="position:absolute;left:76px;top:560px;color:{C['muted']}">druck auf der brust</div>
""")
    t_druck, t_20 = cue(n, "Druck"), cue(n, "zwanzig")
    js = f"""
    draw("#{p}-torso path", 0, 0.9);
    fade("#{p}-heart", 0, {{ d: 0.3 }});
    beat("#{p}-heart", 0.15, 1.12); beat("#{p}-heart", 1.2, 1.12); beat("#{p}-heart", 2.25, 1.1);
    tl.fromTo("#{p}-hand", {{ x: 260, y: 320, opacity: 0 }}, {{ x: 0, y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }}, 0.05);
    tl.to("#{p}-hand", {{ x: -6, y: -10, duration: 0.25, ease: "power2.out" }}, 0.8);
    tl.to("#{p}-hand", {{ x: 0, y: 0, duration: 0.6, ease: "power2.inOut" }}, 1.05);
    fade("#{p}-kick", 0.1);
    rise("#{p}-sub", {t_druck});
    pop("#{p}-sel", {t_druck + 0.3}, {{ s: 1.15, d: 0.4, e: "power3.out" }});
    pop("#{p}-tan", {t_druck + 0.55}, {{ s: 0.4 }});
    slam("#{p}-20", {t_20 - 0.05});
    slam("#{p}-min", {t_20 + 0.25});
"""
    write(fid, d, "", body, js)


# ── F02 title ───────────────────────────────────────────────────────────────
def f02():
    fid, n, p = "02-title", 2, "f02"
    d = DUR[n]
    frame_sq = (f'<rect x="210" y="370" width="660" height="660" rx="150" fill="rgba(240,236,229,.04)" stroke="{C["cream"]}" stroke-width="1.5" opacity=".7"/>'
                + "".join(handle(x, y) for x, y in [(540, 370), (870, 700), (540, 1030), (210, 700)]))
    svg = (g(f"{p}-sq", frame_sq) + g(f"{p}-heart", heart(p, 280, 400, .88, topo=True))
           + g(f"{p}-hl", hand(p, 120, 360, 128, .62, fill=C["red"], op=.9))
           + g(f"{p}-hr", hand(p, 960, 1060, -52, .62, fill=C["blue"], op=.92))
           + scatter(p, [(130, 1110, C["blue"], 1), (950, 330, C["teal"], 1), (980, 820, C["orange"], 0), (90, 640, C["teal"], 0)]))
    body = ground(p, d, (540, 700, C["red"], .3), bloom2=(540, 760, C["blue"], .18)) + content(p, d, S.mark(p).replace('class=', f'id="{p}-mark" class=', 1) + art(p, svg) + f"""
  {kicker(p, 'myokardinfarkt <b>· pathophysiologie</b>', 1150)}
  <div class="{p}-h1" id="{p}-title" style="left:66px;top:1205px;font-size:16cqw;">herzinfarkt</div>
  <div class="{p}-h3" id="{p}-sub" style="position:absolute;left:76px;top:1395px;color:{C['muted']}">schritt für schritt erklärt</div>
""")
    t_hi, t_hm = cue(n, "Herzinfarkt"), cue(n, "Herzmuskel")
    js = f"""
    pop("#{p}-sq", 0, {{ s: 0.86, d: 0.6, e: "expo.out" }});
    pop("#{p}-heart", 0.05, {{ s: 0.5, d: 0.7 }});
    beat("#{p}-heart", 0.9, 1.06); beat("#{p}-heart", 1.85, 1.06); beat("#{p}-heart", 2.8, 1.06); beat("#{p}-heart", 3.75, 1.06);
    tl.fromTo("#{p}-hl", {{ x: -220, y: -220, opacity: 0 }}, {{ x: 0, y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }}, 0.2);
    tl.fromTo("#{p}-hr", {{ x: 220, y: 220, opacity: 0 }}, {{ x: 0, y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }}, 0.3);
    fade("#{p}-mark", 0.2);
    fade("#{p}-kick", {t_hi - 0.3});
    tl.fromTo("#{p}-title", {{ opacity: 0, y: 70, clipPath: "inset(0 0 100% 0)" }}, {{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "expo.out" }}, {t_hi});
    rise("#{p}-sub", {t_hm});
"""
    write(fid, d, "", body, js)


# ── F03 Risikofaktoren ──────────────────────────────────────────────────────
def f03():
    fid, n, p = "03-risiko", 3, "f03"
    d = DUR[n]
    rows = [("smoke", "rauchen", "Rauchen"), ("bp", "bluthochdruck", "Bluthochdruck"), ("drop", "diabetes", "Diabetes"), ("ldl", "hohes ldl", "LDL")]
    ys = [520, 700, 880, 1060]
    svg = "".join(g(f"{p}-ic{i}", icon(k, 92, y)) for i, ((k, _, _), y) in enumerate(zip(rows, ys)))
    svg += "".join(g(f"{p}-ln{i}", f'<path d="M224 {y+66} C 700 {y+66}, 760 1330, 860 1330" fill="none" stroke="{C["blue"]}" stroke-width="2" opacity=".55" stroke-dasharray="6 10"/>') for i, y in enumerate(ys))
    vessel = (f'<rect x="-20" y="1300" width="1120" height="64" rx="32" fill="{C["blue"]}" opacity=".9" filter="url(#{p}-stip)"/>'
              f'<rect x="-20" y="1300" width="1120" height="64" rx="32" fill="none" stroke="{C["cream"]}" stroke-width="1.5" opacity=".5"/>')
    flow = "".join(f'<circle cx="{x}" cy="1332" r="9" fill="{C["cream"]}" opacity=".8"/>' for x in (150, 330, 520, 700, 890, 1070))
    svg += g(f"{p}-vessel", vessel + g(f"{p}-flow", flow)) + g(f"{p}-sel", selbox(70, 1270, 940, 124, C["cream"]))
    svg += scatter(p, [(980, 560, C["teal"], 1), (960, 1180, C["orange"], 0), (130, 1240, C["blue"], 1)])
    labels = "".join(f'<div class="{p}-h3" id="{p}-lb{i}" style="position:absolute;left:262px;top:{y+30}px">{t}</div>' for i, ((_, t, _), y) in enumerate(zip(rows, ys)))
    body = ground(p, d, (540, 1300, C["blue"], .25)) + content(p, d, art(p, svg) + labels + f"""
  {kicker(p, 'am anfang')}
  {h2(p, 'risikofaktoren')}
  <div class="{p}-chip" id="{p}-more" style="left:76px;top:1440px"><span class="{p}-lab">+ familie · alter · bewegungsmangel</span></div>
""")
    js = f"""
    fade("#{p}-kick", 0.1);
    rise("#{p}-h2", 0.3);
    tl.fromTo("#{p}-vessel", {{ opacity: 0, x: -300 }}, {{ opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }}, {cue(n, 'Risikofaktoren')});
    tl.fromTo("#{p}-flow", {{ x: -180 }}, {{ x: 0, duration: {d}, ease: "none" }}, 0);
    pop("#{p}-sel", {cue(n, 'Risikofaktoren') + 0.5}, {{ s: 1.05, d: 0.4, e: "power3.out" }});
"""
    for i, (_, _, w) in enumerate(rows):
        t = cue(n, w)
        js += f"""    pop("#{p}-ic{i}", {t}, {{ s: 0.4 }}); slide("#{p}-lb{i}", {t + 0.08}, {{ x: -40 }}); fade("#{p}-ln{i}", {t + 0.25}, {{ d: 0.5 }});\n"""
    js += f'    rise("#{p}-more", {cue(n, "LDL") + 0.55});\n'
    write(fid, d, "", body, js)


# ── F04 Atherosklerose ──────────────────────────────────────────────────────
def f04():
    import math
    fid, n, p = "04-atherosklerose", 4, "f04"
    d = DUR[n]
    cx, cy = 540, 960
    pol = lambda r, a: (cx + r * math.cos(a), cy + r * math.sin(a))  # noqa: E731
    blood = "".join(f'<circle cx="{pol(r,a)[0]:.1f}" cy="{pol(r,a)[1]:.1f}" r="14" fill="{C["red"]}" opacity=".75"/>' for r, a in ((60, 0.3), (120, 2.1), (90, 3.6), (150, 4.4), (40, 5.2), (170, 1.1), (130, 2.9)))
    vessel = (f'<circle cx="{cx}" cy="{cy}" r="400" fill="none" stroke="{C["cream"]}" stroke-width="1.5" opacity=".35"/>'
              f'<circle cx="{cx}" cy="{cy}" r="370" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>'
              f'<circle cx="{cx}" cy="{cy}" r="300" fill="#2A1A24" opacity=".9"/>'
              f'<circle cx="{cx}" cy="{cy}" r="300" fill="none" stroke="#A9A9B4" stroke-width="22" opacity=".55" filter="url(#{p}-stip)"/>'
              f'<circle cx="{cx}" cy="{cy}" r="232" fill="#140A10"/>'
              f'<circle cx="{cx}" cy="{cy}" r="232" fill="none" stroke="{C["blue"]}" stroke-width="10" stroke-dasharray="22 8" opacity=".95"/>')
    gap = f'<path d="M{pol(232,-1.02)[0]:.1f} {pol(232,-1.02)[1]:.1f} A 232 232 0 0 1 {pol(232,-0.72)[0]:.1f} {pol(232,-0.72)[1]:.1f}" stroke="#140A10" stroke-width="16" fill="none"/>'
    # LDL particles: final positions in the wall, start positions in the lumen
    ldl_final = [(262, -0.9), (282, -0.7), (272, -1.05), (210, -1.1), (210, -0.95), (210, -0.8), (210, -0.65)]
    ldl = "".join(f'<circle class="{p}-ldl" cx="{pol(r,a)[0]:.1f}" cy="{pol(r,a)[1]:.1f}" r="{10 if r>250 else 11}" fill="#F2D28A" opacity=".92"/>' for r, a in ldl_final)
    macro = f'<circle cx="{pol(270,-1.35)[0]:.1f}" cy="{pol(270,-1.35)[1]:.1f}" r="26" fill="{C["blue"]}" opacity=".9"/>'
    foams = g(f"{p}-foam1", foam(*pol(268, -0.35), 30)) + g(f"{p}-foam2", foam(*pol(262, -0.08), 26))
    svg = (g(f"{p}-vessel", vessel + g(f"{p}-blood", blood)) + g(f"{p}-gap", gap) + g(f"{p}-ldlg", ldl) + g(f"{p}-macro", macro) + foams
           + g(f"{p}-sel", selbox(cx + 120, cy - 330, 250, 230, C["cream"]))
           + g(f"{p}-ar1", arrow(830, 1300, 760, 1150, C["cream"], 2)) + g(f"{p}-ar2", arrow(260, 1330, 340, 1190, C["cream"], 2))
           + g(f"{p}-tan", tangent(cx - 300, cy - 300, 40, 26, C["teal"]))
           + scatter(p, [(130, 600, C["blue"], 1), (980, 1250, C["orange"], 1), (930, 560, C["teal"], 0), (110, 1310, C["blue"], 0)]))
    body = ground(p, d, (540, 960, C["blue"], .2)) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'schritt 01')}
  {h2(p, 'atherosklerose')}
  <div class="{p}-chip" id="{p}-c-ldl" style="left:640px;top:470px"><span class="{p}-lab" style="color:#F2D28A">ldl</span><span class="{p}-h3" style="font-size:4.2cqw">dringt ein</span></div>
  <div class="{p}-chip" id="{p}-c-endo" style="left:66px;top:1320px"><span class="{p}-lab">endothel</span><span class="{p}-h3" style="font-size:4.2cqw">geschädigt</span></div>
  <div class="{p}-chip" id="{p}-c-mac" style="left:66px;top:1440px"><span class="{p}-lab">makrophage</span>{arrow_inline(C['cream'],44,28)}<span class="{p}-h3" style="font-size:4.2cqw">schaumzelle</span></div>
""")
    t_endo, t_ges, t_ldl, t_mac, t_sz = cue(n, "Endothel"), cue(n, "geschädigt"), cue(n, "LDL"), cue(n, "Makrophagen"), cue(n, "Schaumzellen")
    # each LDL dot starts deeper in the lumen (toward the centre) and drifts out into the wall
    starts = [(-150 * math.cos(a), -150 * math.sin(a)) for _, a in ldl_final]
    js = f"""
    fade("#{p}-kick", 0.05); rise("#{p}-h2", 0.2);
    pop("#{p}-vessel", 0, {{ s: 0.82, d: 0.8, e: "expo.out" }});
    tl.fromTo("#{p}-blood", {{ rotation: 0, svgOrigin: "{cx} {cy}" }}, {{ rotation: 40, svgOrigin: "{cx} {cy}", duration: {d}, ease: "none" }}, 0);
    rise("#{p}-c-endo", {t_endo}); fade("#{p}-ar2", {t_endo + 0.2});
    tl.fromTo("#{p}-gap", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, {t_ges});
    tl.fromTo("#{p}-ldlg", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, {t_ldl - 0.2});
"""
    for i, (dx, dy) in enumerate(starts):
        js += f'    tl.fromTo("#{p}-ldlg circle:nth-child({i+1})", {{ x: {dx:.1f}, y: {dy:.1f} }}, {{ x: 0, y: 0, duration: 1.2, ease: "power2.inOut" }}, {t_ldl - 0.2 + i*0.08:.2f});\n'
    js += f"""
    rise("#{p}-c-ldl", {t_ldl}); pop("#{p}-sel", {t_ldl + 0.4}, {{ s: 1.1, d: 0.4, e: "power3.out" }});
    tl.fromTo("#{p}-macro", {{ opacity: 0, x: -60, y: 120 }}, {{ opacity: 1, x: 0, y: 0, duration: 0.8, ease: "power2.out" }}, {t_mac});
    rise("#{p}-c-mac", {t_mac}); fade("#{p}-ar1", {t_mac + 0.2});
    pop("#{p}-foam1", {t_sz - 0.1}, {{ s: 0.2, d: 0.6 }}); pop("#{p}-foam2", {t_sz + 0.15}, {{ s: 0.2, d: 0.6 }});
    pop("#{p}-tan", {t_sz + 0.4}, {{ s: 0.4 }});
"""
    write(fid, d, "", body, js)


# ── F05 Plaque ──────────────────────────────────────────────────────────────
def blood_flow(p, pts):
    return "".join(f'<circle cx="{x}" cy="{y}" r="14" fill="{C["red"]}" opacity=".75"/>' for x, y in pts)


def f05():
    fid, n, p = "05-plaque", 5, "f05"
    d = DUR[n]
    pts = ((80, 760), (160, 900), (120, 1060), (300, 790), (420, 770), (560, 760), (690, 790), (820, 900), (950, 820), (1000, 1050), (260, 960))
    flow = g(f"{p}-flow", blood_flow(p, pts) + f'<g transform="translate(-1100 0)">{blood_flow(p, pts)}</g>')
    plaque = (f'<path d="{PLAQUE}" fill="#3A2A30" filter="url(#{p}-stip)"/>')
    core = (f'<ellipse cx="540" cy="1050" rx="230" ry="110" fill="{C["mag"]}" opacity=".55" filter="url(#{p}-blur)"/>'
            f'<ellipse cx="540" cy="1050" rx="200" ry="92" fill="#F2D28A" opacity=".85" filter="url(#{p}-stip)"/>')
    cap = f'<path class="{p}-draw" pathLength="1" d="M250 1160 C 330 1150, 380 880, 540 872 C 700 880, 750 1150, 830 1160" fill="none" stroke="{C["cream"]}" stroke-width="7"/>'
    brack = f'<line x1="540" y1="800" x2="540" y2="872" stroke="{C["cream"]}" stroke-width="1.5"/>' + handle(540, 862, C["mag"]) + handle(540, 880, C["mag"])
    svg = (g(f"{p}-vessel", vessel_long(p)) + flow + g(f"{p}-plaque", plaque) + g(f"{p}-core", core) + g(f"{p}-cap", cap) + g(f"{p}-brack", brack)
           + g(f"{p}-sel", selbox(320, 960, 440, 190, C["mag"])) + g(f"{p}-tan", tangent(720, 905, 42, 28, C["cream"]))
           + scatter(p, [(150, 1420, C["blue"], 1), (950, 520, C["teal"], 1), (980, 1420, C["orange"], 0), (90, 560, C["blue"], 0)]))
    body = ground(p, d, (540, 1050, C["mag"], .25)) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'schritt 02')}
  {h2(p, 'instabiler plaque')}
  <div class="{p}-chip" id="{p}-c-cap" style="left:560px;top:430px"><span class="{p}-lab" style="color:{C['mag']}">kappe</span><span class="{p}-h3" style="font-size:4.2cqw">dünn</span></div>
  <div class="{p}-chip" id="{p}-c-core" style="left:76px;top:1340px"><span class="{p}-lab" style="color:#F2D28A">lipidkern</span><span class="{p}-h3" style="font-size:4.2cqw">groß · weich</span></div>
  <div class="{p}-h1" id="{p}-inst" style="left:72px;top:1470px;color:{C['mag']}">instabil.</div>
""")
    t_pl, t_lk, t_ka, t_in = cue(n, "Plaque"), cue(n, "Lipidkern"), cue(n, "Kappe"), cue(n, "Instabil")
    js = f"""
    fade("#{p}-kick", 0.05); rise("#{p}-h2", 0.2);
    tl.fromTo("#{p}-flow", {{ x: 0 }}, {{ x: 520, duration: {d}, ease: "none" }}, 0);
    tl.fromTo("#{p}-plaque", {{ scaleY: 0.15, opacity: 0.4, transformOrigin: "50% 100%" }}, {{ scaleY: 1, opacity: 1, duration: 1.0, ease: "power2.out" }}, {t_pl - 0.1});
    tl.fromTo("#{p}-core", {{ scale: 0.3, opacity: 0, transformOrigin: "50% 70%" }}, {{ scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.6)" }}, {t_lk - 0.15});
    rise("#{p}-c-core", {t_lk});
    draw("#{p}-cap path", {t_ka - 0.35}, 0.6);
    fade("#{p}-brack", {t_ka}); rise("#{p}-c-cap", {t_ka}); pop("#{p}-sel", {t_ka + 0.2}, {{ s: 1.1, d: 0.35, e: "power3.out" }});
    slam("#{p}-inst", {t_in - 0.05});
    tl.to("#{p}-core", {{ opacity: 0.7, duration: 0.12, ease: "none" }}, {t_in + 0.3}); tl.to("#{p}-core", {{ opacity: 1, duration: 0.25, ease: "none" }}, {t_in + 0.42});
    pop("#{p}-tan", {t_in + 0.3}, {{ s: 0.4 }});
"""
    write(fid, d, "", body, js)


# ── F06 Ruptur ──────────────────────────────────────────────────────────────
def f06():
    fid, n, p = "06-ruptur", 6, "f06"
    d = DUR[n]
    plts = "".join(f'<ellipse cx="{x}" cy="{y}" rx="20" ry="13" transform="rotate({(i*47)%180} {x} {y})" fill="#C9C3BA" opacity=".9" filter="url(#{p}-stip)"/>'
                   for i, (x, y) in enumerate(((470, 850), (500, 820), (540, 800), (580, 815), (610, 845), (520, 770), (565, 760), (600, 790), (450, 800), (640, 805), (495, 735), (590, 725))))
    fibrin = "".join(f'<path class="{p}-draw" pathLength="1" d="M{380+i*40} 700 C {420+i*40} 760, {360+i*40} 820, {420+i*40} 880" fill="none" stroke="{C["cream"]}" stroke-width="2" opacity=".55"/>' for i in range(8))
    upstream = "".join(f'<circle cx="{x}" cy="{y}" r="14" fill="{C["red"]}" opacity=".8"/>' for x, y in ((60, 760), (110, 820), (160, 770), (210, 830), (260, 780), (300, 840), (90, 890), (150, 940), (230, 900), (310, 930)))
    flame = (f'<path d="M545 880 C 500 820, 590 760, 540 690 C 520 650, 560 600, 548 560 C 600 620, 610 700, 580 760 C 620 720, 630 680, 620 640 C 670 720, 640 820, 560 885 Z" fill="{C["mag"]}" opacity=".9" filter="url(#{p}-stip)"/>'
             f'<path d="M545 880 C 520 840, 560 800, 548 760" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round" opacity=".9"/>'
             f'<path d="M420 892 L 680 878 M 450 905 L 640 900" stroke="#FFFFFF" stroke-width="3" opacity=".8"/>')
    cap_whole = f'<path d="M250 1160 C 330 1150, 380 880, 540 872 C 700 880, 750 1150, 830 1160" fill="none" stroke="{C["cream"]}" stroke-width="7"/>'
    cap_torn = f'<path d="M250 1160 C 330 1150, 380 880, 500 874 M 590 876 C 700 880, 750 1150, 830 1160" fill="none" stroke="{C["cream"]}" stroke-width="7"/>'
    thrombus = f'<path d="M360 690 C 420 700, 470 730, 480 870 L 620 870 C 640 760, 690 700, 760 690 Z" fill="#7A1A2A" opacity=".95" filter="url(#{p}-stip)"/>'
    svg = (g(f"{p}-vessel", vessel_long(p)) + g(f"{p}-up", upstream)
           + f'<path d="{PLAQUE}" fill="#3A2A30" filter="url(#{p}-stip)"/>'
           + f'<ellipse cx="540" cy="1050" rx="200" ry="92" fill="#F2D28A" opacity=".8" filter="url(#{p}-stip)"/>'
           + g(f"{p}-capw", cap_whole) + g(f"{p}-capt", cap_torn)
           + g(f"{p}-thr", thrombus) + g(f"{p}-fib", fibrin) + g(f"{p}-plt", plts)
           + g(f"{p}-flash", f'<circle cx="545" cy="820" r="170" fill="{C["mag"]}" opacity=".35" filter="url(#{p}-blur)"/>') + g(f"{p}-flame", flame)
           + g(f"{p}-sel", selbox(350, 680, 420, 220, C["mag"])) + g(f"{p}-tan", tangent(300, 1250, 44, -26, C["cream"]))
           + scatter(p, [(150, 1440, C["blue"], 1), (950, 520, C["teal"], 1), (980, 1300, C["orange"], 1), (90, 560, C["blue"], 0)]))
    body = ground(p, d, (540, 800, C["mag"], .35)) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'schritt 03')}
  {h2(p, 'ruptur + thrombus')}
  <div class="{p}-chip" id="{p}-c-rup" style="left:640px;top:450px"><span class="{p}-lab" style="color:{C['mag']}">ruptur</span></div>
  <div class="{p}-chip" id="{p}-c-plt" style="left:76px;top:470px"><span class="{p}-lab" style="color:#C9C3BA">thrombozyten</span></div>
  <div class="{p}-chip" id="{p}-c-thr" style="left:600px;top:1320px"><span class="{p}-lab" style="color:{C['red']}">thrombus</span></div>
  <div class="{p}-h1" id="{p}-occl" style="left:72px;top:1450px;color:{C['mag']}">verschluss.</div>
""")
    t_r, t_tz, t_th, t_vs = cue(n, "reißt"), cue(n, "Thrombozyten"), cue(n, "Thrombus"), cue(n, "verschließt")
    js = f"""
    fade("#{p}-kick", 0.05); rise("#{p}-h2", 0.2);
    tl.fromTo("#{p}-up", {{ x: -300 }}, {{ x: 0, duration: {t_vs + 0.3}, ease: "power2.out" }}, 0);
    tl.set("#{p}-capt", {{ opacity: 0 }}, 0);
    tl.set("#{p}-capw", {{ opacity: 0 }}, {t_r - 0.05}); tl.set("#{p}-capt", {{ opacity: 1 }}, {t_r - 0.05});
    tl.fromTo("#{p}-flash", {{ opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }}, {{ opacity: 1, scale: 1.3, duration: 0.35, ease: "expo.out" }}, {t_r - 0.05});
    tl.to("#{p}-flash", {{ opacity: 0.45, scale: 1, duration: 0.8, ease: "power2.out" }}, {t_r + 0.3});
    tl.fromTo("#{p}-flame", {{ opacity: 0, scaleY: 0.1, scaleX: 0.6, transformOrigin: "50% 100%" }}, {{ opacity: 1, scaleY: 1, scaleX: 1, duration: 0.55, ease: "expo.out" }}, {t_r - 0.02});
    tl.to("#{p}-flame", {{ scaleY: 1.06, skewX: 4, duration: 0.6, ease: "sine.inOut" }}, {t_r + 0.55}); tl.to("#{p}-flame", {{ scaleY: 0.96, skewX: -3, duration: 0.7, ease: "sine.inOut" }}, {t_r + 1.15});
    tl.to("#{p}-flame", {{ opacity: 0.35, duration: 0.6 }}, {t_th});
    rise("#{p}-c-rup", {t_r}); pop("#{p}-sel", {t_r + 0.15}, {{ s: 1.15, d: 0.35, e: "power3.out" }});
    pop("#{p}-plt ellipse", {t_tz}, {{ s: 0.1, d: 0.35, st: 0.07 }});
    rise("#{p}-c-plt", {t_tz});
    draw("#{p}-fib path", {t_tz + 0.8}, 0.7);
    tl.fromTo("#{p}-thr", {{ opacity: 0, scale: 0.3, transformOrigin: "50% 100%" }}, {{ opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" }}, {t_th - 0.2});
    rise("#{p}-c-thr", {t_th});
    slam("#{p}-occl", {t_vs});
    pop("#{p}-tan", {t_vs + 0.3}, {{ s: 0.4 }});
"""
    write(fid, d, "", body, js)


# ── F07 Nekrose ─────────────────────────────────────────────────────────────
def f07():
    fid, n, p = "07-nekrose", 7, "f07"
    d = DUR[n]
    x0, x1, y0, y1 = 110, 970, 620, 1180
    topo = "".join(f'<path d="M{x0} {y0+40+i*48} C {x0+200} {y0+10+i*48}, {x0+420} {y0+90+i*48}, {x0+620} {y0+40+i*48} S {x1-40} {y0+20+i*48}, {x1} {y0+50+i*48}" fill="none" stroke="{C["cream"]}" stroke-width="1.4" opacity=".28"/>' for i in range(11))
    nec = (f'<path d="M{x0} {y1+40} L {x0} 930 C 240 880, 330 960, 470 905 C 600 850, 700 940, 820 890 C 880 870, 930 900, {x1} 880 L {x1} {y1+40} Z" fill="{C["red"]}" opacity=".9" filter="url(#{p}-stip)"/>'
           f'<path d="M{x0} 930 C 240 880, 330 960, 470 905 C 600 850, 700 940, 820 890 C 880 870, 930 900, {x1} 880" fill="none" stroke="#FF9A8A" stroke-width="4" filter="url(#{p}-glow)"/>')
    svg = (f'<clipPath id="{p}-slab"><rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="40"/></clipPath>'
           + g(f"{p}-slabg", f'<g clip-path="url(#{p}-slab)"><rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>{topo}{g(f"{p}-nec", nec)}</g>'
                              f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="40" fill="none" stroke="{C["cream"]}" stroke-width="1.5" opacity=".6"/>')
           + g(f"{p}-arr", arrow(1015, 1150, 1015, 860, C["red"], 3))
           + g(f"{p}-sel", selbox(x0, y0, x1 - x0, y1 - y0, C["cream"]))
           + scatter(p, [(160, 1290, C["blue"], 1), (960, 520, C["teal"], 1), (900, 1300, C["orange"], 0)]))
    body = ground(p, d, (540, 1000, C["red"], .3)) + content(p, d, art(p, svg) + f"""
  {kicker(p, f"schritt 04 <b>· ischämie {arrow_inline(C['cream'],40,24)} nekrose</b>")}
  <div id="{p}-time" style="position:absolute;left:72px;top:318px;font-weight:900;font-size:14cqw;line-height:.95;letter-spacing:-.04em;">20–30<span style="font-size:7cqw;color:{C['muted']}"> min</span></div>
  <div class="{p}-lab" id="{p}-epi" style="position:absolute;left:150px;top:648px;color:{C['cream']}">epikard</div>
  <div class="{p}-lab" id="{p}-endo" style="position:absolute;left:150px;top:1112px;color:{C['cream']};text-shadow:0 2px 10px rgba(0,0,0,.6)">endokard</div>
  <div class="{p}-lab" id="{p}-dir" style="position:absolute;left:600px;top:1210px;color:{C['red']}">von innen nach außen</div>
  <div class="{p}-h1" id="{p}-z1" style="left:72px;top:1330px">zeit ist</div>
  <div class="{p}-h1" id="{p}-z2" style="left:72px;top:1450px;color:{C['red']}">muskel.</div>
""")
    t_ohne, t_st, t_20, t_in, t_ze, t_mu = cue(n, "Ohne"), cue(n, "sterben"), cue(n, "zwanzig"), cue(n, "innen"), cue(n, "Zeit"), cue(n, "Muskel")
    js = f"""
    fade("#{p}-kick", 0.05);
    pop("#{p}-slabg", 0, {{ s: 0.9, d: 0.7, e: "expo.out" }}); fade("#{p}-epi", 0.4); fade("#{p}-endo", 0.4);
    tl.fromTo("#{p}-nec", {{ y: 330 }}, {{ y: 300, duration: 0.6, ease: "power1.out" }}, {t_ohne});
    tl.to("#{p}-nec", {{ y: 0, duration: {t_in + 0.8 - t_st:.2f}, ease: "power1.inOut" }}, {t_st});
    slam("#{p}-time", {t_20 - 0.05});
    pop("#{p}-sel", {t_20 + 0.4}, {{ s: 1.04, d: 0.4, e: "power3.out" }});
    tl.fromTo("#{p}-arr", {{ opacity: 0, scaleY: 0, transformOrigin: "50% 100%" }}, {{ opacity: 1, scaleY: 1, duration: 0.6, ease: "power3.out" }}, {t_in - 0.2});
    rise("#{p}-dir", {t_in});
    rise("#{p}-z1", {t_ze - 0.05}, {{ y: 60 }}); slam("#{p}-z2", {t_mu - 0.05});
"""
    write(fid, d, "", body, js)


# ── F08 Gefäße ──────────────────────────────────────────────────────────────
def f08():
    fid, n, p = "08-gefaesse", 8, "f08"
    d = DUR[n]
    s, tx, ty = 1.45, 540 - 330 * 1.45, 250
    lw = 2 / s
    outline = (f'<path class="{p}-draw" pathLength="1" d="{SVC}" stroke="{C["cream"]}" stroke-width="{lw:.2f}" fill="none"/>'
               f'<path class="{p}-draw" pathLength="1" d="{AORTA}" stroke="{C["cream"]}" stroke-width="{lw:.2f}" fill="none"/>'
               f'<path class="{p}-draw" pathLength="1" d="M262 240 C 255 140, 300 66, 362 66 C 438 66, 478 118, 478 196" stroke="{C["cream"]}" stroke-width="{lw:.2f}" fill="none"/>'
               f'<path class="{p}-draw" pathLength="1" d="{PULM}" stroke="{C["cream"]}" stroke-width="{lw:.2f}" fill="none"/>'
               f'<path class="{p}-draw" pathLength="1" d="{HEART_BODY}" stroke="{C["cream"]}" stroke-width="{lw:.2f}" fill="none"/>')
    ves = lambda id_, dd, col, w, glow=False: g(id_, f'<path class="{p}-draw" pathLength="1" d="{dd}" stroke="{col}" stroke-width="{w}" fill="none" stroke-linecap="round"' + (f' filter="url(#{p}-glow)"' if glow else "") + '/>')  # noqa: E731
    svg = (f'<g transform="translate({tx} {ty}) scale({s})">' + g(f"{p}-out", outline)
           + ves(f"{p}-lad", LAD, C["blue"], 9, True) + ves(f"{p}-rcx", RCX, C["teal"], 7, True) + ves(f"{p}-rca", RCA, C["mag"], 7, True) + "</g>"
           + g(f"{p}-tan", tangent(int(tx + 352 * s), int(ty + 482 * s), 40, -8, C["blue"]))
           + scatter(p, [(140, 1100, C["blue"], 1), (960, 560, C["teal"], 1), (980, 1060, C["orange"], 0)]))

    def row(i, y, name, col, wall, leads):
        return (f'<div class="{p}-chip" id="{p}-row{i}" style="left:66px;top:{y}px;width:948px;justify-content:flex-start">'
                f'<span class="{p}-lab" style="color:{col};width:120px;font-size:3.2cqw">{name}</span>{arrow_inline(C["cream"],44,28)}'
                f'<span class="{p}-h3" style="font-size:5.2cqw;flex:1">{wall}</span><span class="{p}-lab" style="color:{C["muted"]}">{leads}</span></div>')
    body = ground(p, d, (540, 760, C["blue"], .22)) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'versorgungsgebiete <b>· ekg</b>', 200)}
  {row(0, 1230, 'riva', C['blue'], 'vorderwand', 'V1–V4')}
  {row(1, 1360, 'rcx', C['teal'], 'seitenwand', 'I · aVL · V5–V6')}
  {row(2, 1490, 'rca', C['mag'], 'hinterwand', 'II · III · aVF')}
""")
    t1, t2, t3 = cue(n, "RIVA"), cue(n, "RCX"), cue(n, "RCA")
    js = f"""
    fade("#{p}-kick", 0.05);
    draw("#{p}-out path", 0.0, 1.6, "power2.out");
    draw("#{p}-lad path", {t1 - 0.2}, 0.7); slide("#{p}-row0", {t1}); pop("#{p}-tan", {t1 + 0.4}, {{ s: 0.4 }});
    draw("#{p}-rcx path", {t2 - 0.2}, 0.7); slide("#{p}-row1", {t2});
    draw("#{p}-rca path", {t3 - 0.2}, 0.8); slide("#{p}-row2", {t3});
    tl.to("#{p}-lad", {{ opacity: 0.45, duration: 0.3 }}, {t2}); tl.to("#{p}-rcx", {{ opacity: 0.45, duration: 0.3 }}, {t3});
    tl.to(["#{p}-lad", "#{p}-rcx"], {{ opacity: 1, duration: 0.4 }}, {t3 + 1.1});
"""
    write(fid, d, "", body, js)


# ── F09 Symptome ────────────────────────────────────────────────────────────
def f09():
    fid, n, p = "09-symptome", 9, "f09"
    d = DUR[n]
    sil = (f'<g fill="url(#{p}-skin)" filter="url(#{p}-stip)" opacity=".95">'
           f'<ellipse cx="540" cy="380" rx="105" ry="130"/><rect x="495" y="480" width="90" height="90" rx="30"/>'
           f'<path d="M300 620 C 300 560, 400 540, 540 540 C 680 540, 780 560, 780 620 L 760 1080 L 320 1080 Z"/>'
           f'<path d="M780 610 C 840 640, 860 700, 870 780 L 900 1000 C 905 1030, 860 1040, 850 1010 L 790 800 Z"/>'
           f'<path d="M300 610 C 240 640, 220 700, 210 780 L 180 1000 C 175 1030, 220 1040, 230 1010 L 290 800 Z"/></g>')
    core = (f'<circle cx="560" cy="720" r="120" fill="{C["mag"]}" opacity=".55" filter="url(#{p}-blur)"/>'
            f'<circle cx="560" cy="720" r="46" fill="{C["mag"]}" filter="url(#{p}-glow)"/>')
    rad = lambda id_, dd, hx, hy: g(id_, f'<path class="{p}-draw" pathLength="1" d="{dd}" fill="none" stroke="{C["mag"]}" stroke-width="4"/>') + g(id_ + "h", handle(hx, hy, C["mag"], 18, True))  # noqa: E731
    svg = (g(f"{p}-sil", sil) + g(f"{p}-core", core)
           + rad(f"{p}-arm", "M580 690 C 700 640, 790 650, 840 760 C 860 830, 875 900, 880 980", 880, 980)
           + rad(f"{p}-jaw", "M555 680 C 560 600, 565 540, 560 470", 560, 470)
           + rad(f"{p}-epi", "M550 760 C 540 840, 545 900, 540 960", 540, 960)
           + g(f"{p}-sel", selbox(470, 640, 180, 160, C["cream"]))
           + scatter(p, [(140, 520, C["blue"], 1), (980, 420, C["teal"], 1), (960, 1100, C["orange"], 0)]))
    chip = lambda i, x, y, lab, txt, col=C["blue"]: f'<div class="{p}-chip" id="{p}-ch{i}" style="left:{x}px;top:{y}px"><span class="{p}-lab" style="color:{col}">{lab}</span><span class="{p}-h3" style="font-size:4.4cqw">{txt}</span></div>'  # noqa: E731
    warn = (f'<div class="{p}-chip" id="{p}-warn" style="left:66px;top:1440px;border-color:{C["mag"]};background:rgba(232,56,200,.12)">'
            f'<svg width="40" height="36" viewBox="0 0 40 36"><path d="M20 3 L37 33 H3 Z" fill="none" stroke="{C["mag"]}" stroke-width="3.5" stroke-linejoin="round"/><path d="M20 14 V22 M20 27 V28" stroke="{C["mag"]}" stroke-width="3.5" stroke-linecap="round"/></svg>'
            f'<span class="{p}-h3" style="font-size:4.2cqw">frauen · diabetiker: <span style="color:{C["mag"]}">oft atypisch</span></span></div>')
    body = ground(p, d, (560, 720, C["mag"], .25)) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'symptome', 200)}
  {chip(0, 66, 1110, '&gt; 20 min', 'brustschmerz', C['mag'])}
  {chip(1, 66, 1225, 'ausstrahlung', 'arm · kiefer · oberbauch')}
  {chip(2, 66, 1340, 'vegetativ', 'kaltschweiß · todesangst')}
  {warn}
""")
    t_bs, t_au, t_arm, t_kie, t_ob, t_ks, t_ach = (cue(n, "Brustschmerz"), cue(n, "ausstrahlend"), cue(n, "Arm"), cue(n, "Kiefer"),
                                                    cue(n, "Oberbauch"), cue(n, "Kaltschweiß"), cue(n, "Achtung"))
    beats = "".join(f'beat("#{p}-core", {t:.2f}, 1.15); ' for t in [t_bs + i * 0.9 for i in range(9) if t_bs + i * 0.9 < d - 0.5])
    js = f"""
    fade("#{p}-kick", 0.05);
    rise("#{p}-sil", 0, {{ y: 80, d: 0.8 }});
    pop("#{p}-core", {t_bs - 0.1}, {{ s: 0.2, d: 0.5 }}); {beats}
    pop("#{p}-sel", {t_bs + 0.2}, {{ s: 1.2, d: 0.35, e: "power3.out" }});
    rise("#{p}-ch0", {t_bs}); rise("#{p}-ch1", {t_au});
    draw("#{p}-arm path", {t_arm - 0.2}, 0.6); pop("#{p}-armh", {t_arm + 0.35}, {{ s: 0.2 }});
    draw("#{p}-jaw path", {t_kie - 0.2}, 0.5); pop("#{p}-jawh", {t_kie + 0.25}, {{ s: 0.2 }});
    draw("#{p}-epi path", {t_ob - 0.2}, 0.5); pop("#{p}-epih", {t_ob + 0.25}, {{ s: 0.2 }});
    rise("#{p}-ch2", {t_ks});
    rise("#{p}-warn", {t_ach});
    tl.to("#{p}-warn", {{ x: 10, duration: 0.06, ease: "none" }}, {t_ach + 0.55}); tl.to("#{p}-warn", {{ x: -8, duration: 0.08, ease: "none" }}, {t_ach + 0.61});
    tl.to("#{p}-warn", {{ x: 0, duration: 0.1, ease: "power2.out" }}, {t_ach + 0.69});
"""
    write(fid, d, "", body, js)


# ── F10 EKG ─────────────────────────────────────────────────────────────────
def f10():
    fid, n, p = "10-ekg", 10, "f10"
    d = DUR[n]
    gx, gy, gw, gh = 60, 500, 960, 520
    grid = "".join(f'<line x1="{gx+i*40}" y1="{gy}" x2="{gx+i*40}" y2="{gy+gh}" stroke="{C["mag"]}" stroke-width="{1.4 if i%5==0 else .7}" opacity="{.35 if i%5==0 else .16}"/>' for i in range(25))
    grid += "".join(f'<line x1="{gx}" y1="{gy+i*40}" x2="{gx+gw}" y2="{gy+i*40}" stroke="{C["mag"]}" stroke-width="{1.4 if i%5==0 else .7}" opacity="{.35 if i%5==0 else .16}"/>' for i in range(14))
    nrm, st = ecg_path(gx + 30, gy + 330, gw - 60)
    panel = (f'<rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" rx="36" fill="rgba(11,16,48,.75)"/>'
             f'<clipPath id="{p}-g"><rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" rx="36"/></clipPath><g clip-path="url(#{p}-g)">{grid}</g>'
             f'<rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" rx="36" fill="none" stroke="{C["cream"]}" stroke-width="1.5" opacity=".5"/>')
    x_st = int(gx + 30 + 600 * (gw - 60) / 900)
    svg = (g(f"{p}-panel", panel)
           + g(f"{p}-nrm", f'<path class="{p}-draw" pathLength="1" d="{nrm}" fill="none" stroke="{C["blue"]}" stroke-width="7" stroke-linejoin="round" filter="url(#{p}-glow)"/>')
           + g(f"{p}-st", f'<path class="{p}-draw" pathLength="1" d="M{nrm.split(" L")[-1]} {st}" fill="none" stroke="{C["red"]}" stroke-width="7" stroke-linejoin="round" filter="url(#{p}-glow)"/>')
           + g(f"{p}-base", f'<line x1="{x_st+5}" y1="{gy+330}" x2="{int(gx+30+760*(gw-60)/900)}" y2="{gy+330}" stroke="{C["cream"]}" stroke-width="2" stroke-dasharray="6 6"/>')
           + g(f"{p}-sel", selbox(x_st, gy + 220, 160, 110, C["cream"]))
           + scatter(p, [(140, 1560, C["blue"], 1), (960, 440, C["teal"], 1)]))
    card = lambda id_, x, col, big, small: (f'<div id="{id_}" style="position:absolute;left:{x}px;top:1090px;width:450px;height:480px;border-radius:36px;border:1.5px solid {col};background:rgba(10,10,16,.6);padding:40px 36px;">'  # noqa: E731
                                            f'<div class="{p}-lab" style="color:{col}">{small[0]}</div>'
                                            f'<div style="font-weight:900;font-size:10cqw;letter-spacing:-.03em;line-height:.95;margin-top:18px">{big}</div>'
                                            f'<div class="{p}-h3" style="font-size:4.4cqw;margin-top:22px;color:{C["muted"]};white-space:normal">{small[1]}</div></div>')
    body = ground(p, d, (540, 760, C["red"], .2), navy=True) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'diagnose <b>· 12-kanal-ekg</b>')}
  {h2(p, 'ekg in 10 min')}
  <div class="{p}-lab" id="{p}-stl" style="position:absolute;left:{x_st+10}px;top:556px;color:{C['red']};font-size:3.4cqw">st ↑</div>
  {card(f'{p}-stemi', 60, C['red'], 'STEMI', ('st-hebung', 'in 2 benachbarten ableitungen'))}
  {card(f'{p}-nste', 570, C['blue'], 'NSTE-ACS', ('keine hebung', 'troponin entscheidet'))}
""")
    t_ekg, t_st, t_stemi = cue(n, "EKG"), cue(n, "ST-Hebung"), cue(n, "STEMI")
    js = f"""
    fade("#{p}-kick", 0.05); rise("#{p}-h2", 0.2);
    pop("#{p}-panel", 0, {{ s: 0.94, d: 0.6, e: "expo.out" }});
    draw("#{p}-nrm path", 0.45, 1.45, "none");
    draw("#{p}-st path", 1.9, 1.3, "none");
    fade("#{p}-base", {t_st}); pop("#{p}-sel", {t_st + 0.1}, {{ s: 1.2, d: 0.35, e: "power3.out" }}); rise("#{p}-stl", {t_st}, {{ y: 20 }});
    tl.to("#{p}-st path", {{ strokeWidth: 10, duration: 0.2 }}, {t_st}); tl.to("#{p}-st path", {{ strokeWidth: 7, duration: 0.4 }}, {t_st + 0.2});
    rise("#{p}-stemi", {t_stemi - 0.3}, {{ y: 70 }});
    rise("#{p}-nste", {t_stemi + 0.45}, {{ y: 70 }});
"""
    write(fid, d, "", body, js)


# ── F11 Troponin ────────────────────────────────────────────────────────────
def f11():
    fid, n, p = "11-troponin", 11, "f11"
    d = DUR[n]
    ax, ay, aw, ah = 150, 520, 830, 560
    thr = ay + ah * 0.58
    axes = (f'<line x1="{ax}" y1="{ay}" x2="{ax}" y2="{ay+ah}" stroke="{C["cream"]}" stroke-width="1.5" opacity=".6"/>'
            f'<line x1="{ax}" y1="{ay+ah}" x2="{ax+aw}" y2="{ay+ah}" stroke="{C["cream"]}" stroke-width="1.5" opacity=".6"/>'
            + "".join(f'<line x1="{ax+aw*t:.0f}" y1="{ay+ah}" x2="{ax+aw*t:.0f}" y2="{ay+ah+14}" stroke="{C["cream"]}" stroke-width="2"/>' for t in (0, .4, .8)))
    svg = (g(f"{p}-axes", axes)
           + g(f"{p}-thr", f'<line x1="{ax}" y1="{thr}" x2="{ax+aw}" y2="{thr}" stroke="{C["cream"]}" stroke-width="2" stroke-dasharray="10 10" opacity=".7"/>')
           + g(f"{p}-up", f'<path class="{p}-draw" pathLength="1" d="M{ax} {ay+ah-40} C {ax+200} {ay+ah-60}, {ax+300} {ay+ah-190}, {ax+430} {ay+150} S {ax+700} {ay+40}, {ax+aw-30} {ay+50}" fill="none" stroke="{C["mag"]}" stroke-width="8" stroke-linecap="round" filter="url(#{p}-glow)"/>')
           + g(f"{p}-flat", f'<path class="{p}-draw" pathLength="1" d="M{ax} {ay+ah-40} C {ax+300} {ay+ah-50}, {ax+600} {ay+ah-70}, {ax+aw-30} {ay+ah-80}" fill="none" stroke="{C["grey"]}" stroke-width="7" stroke-linecap="round"/>')
           + g(f"{p}-x", handle(ax + 330, ay + ah * 0.58, C["mag"], 20, True))
           + g(f"{p}-sel", selbox(ax + 260, ay + 200, 160, 210, C["cream"]))
           + scatter(p, [(110, 470, C["teal"], 1), (980, 1250, C["blue"], 1)]))
    body = ground(p, d, (700, 640, C["mag"], .22), navy=True) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'labor <b>· hs-troponin 0h/1h</b>')}
  {h2(p, 'troponin')}
  <div id="{p}-ticks">
    <div class="{p}-lab" style="position:absolute;left:{ax-20}px;top:{ay+ah+30}px">0 h</div>
    <div class="{p}-lab" style="position:absolute;left:{int(ax+aw*.4-20)}px;top:{ay+ah+30}px">1 h</div>
    <div class="{p}-lab" style="position:absolute;left:{int(ax+aw*.8-20)}px;top:{ay+ah+30}px">3 h</div>
  </div>
  <div class="{p}-lab" id="{p}-pz" style="position:absolute;left:{ax+20}px;top:{int(thr)-52}px;color:{C['muted']}">99. perzentile</div>
  <div class="{p}-chip" id="{p}-c-n" style="left:640px;top:440px;border-color:{C['mag']}"><span class="{p}-h3" style="font-size:4.6cqw;color:{C['mag']};text-transform:none">NSTEMI</span></div>
  <div class="{p}-chip" id="{p}-c-a" style="left:560px;top:{ay+ah-200}px"><span class="{p}-h3" style="font-size:4.4cqw;color:{C['muted']}">instabile angina</span></div>
  <div class="{p}-h3" id="{p}-r1" style="position:absolute;left:66px;top:1230px;font-size:6.4cqw"><span style="color:{C['mag']}">erhöht</span> = nstemi</div>
  <div class="{p}-h3" id="{p}-r2" style="position:absolute;left:66px;top:1330px;font-size:6.4cqw;color:{C['muted']}">normal = instabile angina</div>
""")
    t_tro, t_er, t_ns, t_no, t_ia = cue(n, "Troponin"), cue(n, "erhöht"), cue(n, "NSTEMI"), cue(n, "Normal"), cue(n, "instabile")
    js = f"""
    fade("#{p}-kick", 0.05);
    fade("#{p}-axes", 0.1, {{ d: 0.5 }}); fade("#{p}-ticks", 0.3);
    rise("#{p}-h2", {t_tro - 0.4});
    tl.fromTo("#{p}-thr", {{ opacity: 0, scaleX: 0, transformOrigin: "0% 50%" }}, {{ opacity: 1, scaleX: 1, duration: 0.7, ease: "power3.out" }}, {t_tro});
    fade("#{p}-pz", {t_tro + 0.3});
    draw("#{p}-up path", {t_er - 0.35}, 1.2, "power1.inOut");
    pop("#{p}-x", {t_er + 0.15}, {{ s: 0.2 }}); pop("#{p}-sel", {t_er + 0.25}, {{ s: 1.2, d: 0.35, e: "power3.out" }});
    pop("#{p}-c-n", {t_ns}, {{ s: 0.7 }}); rise("#{p}-r1", {t_ns});
    draw("#{p}-flat path", {t_no - 0.2}, 1.0, "power1.inOut");
    pop("#{p}-c-a", {t_ia}, {{ s: 0.7 }}); rise("#{p}-r2", {t_ia});
"""
    write(fid, d, "", body, js)


# ── F12 Therapie ────────────────────────────────────────────────────────────
def f12():
    fid, n, p = "12-therapie", 12, "f12"
    d = DUR[n]
    rows = [("112", "notruf"), ("ass", "+ heparin"), ("nitro", "wenn rr syst. &gt; 90"), ("analgesie", "schmerz lindern"),
            ("o<sub style='font-size:.7em'>2</sub>", "nur bei spo<sub style='font-size:.7em'>2</sub> &lt; 90 %")]
    rws = "".join(f'<div id="{p}-r{i}" style="display:flex;align-items:baseline;gap:28px;padding:22px 0;border-top:1px solid rgba(240,236,229,.16)">'
                  f'<span class="{p}-lab" style="color:{C["blue"]};width:210px;font-size:3.2cqw">{a}</span><span class="{p}-h3" style="font-size:5.2cqw">{b}</span></div>' for i, (a, b) in enumerate(rows))
    vy0, vy1 = 1290, 1400
    mid = (vy0 + vy1) // 2
    card = (f'<rect x="70" y="1220" width="940" height="360" rx="44" fill="rgba(61,90,254,.14)" stroke="{C["blue"]}" stroke-width="1.5"/>'
            f'<rect x="70" y="1220" width="940" height="360" rx="44" fill="none" stroke="{C["blue"]}" stroke-width="2" filter="url(#{p}-glow)" opacity=".6"/>'
            f'<rect x="110" y="{vy0-30}" width="860" height="30" rx="10" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>'
            f'<rect x="110" y="{vy1}" width="860" height="30" rx="10" fill="url(#{p}-mus)" filter="url(#{p}-stip)"/>'
            f'<rect x="110" y="{vy0}" width="860" height="{vy1-vy0}" fill="#140A10"/>')
    stent = "".join(f'<path d="M{x} {vy0+6} L {x+40} {vy1-6} M {x+40} {vy0+6} L {x} {vy1-6}" stroke="{C["cream"]}" stroke-width="2" opacity=".75"/>' for x in range(470, 650, 40))
    clot = f'<path d="M480 {vy0} C 520 {vy0+20}, 600 {vy0+10}, 640 {vy0} L 650 {vy1} C 600 {vy1-15}, 520 {vy1-10}, 470 {vy1} Z" fill="#7A1A2A" filter="url(#{p}-stip)"/>'
    flow_pts = [(x, mid + (18 if i % 2 else -24)) for i, x in enumerate(range(160, 960, 70))]
    flow = "".join(f'<circle cx="{x}" cy="{y}" r="11" fill="{C["red"]}" opacity=".85"/>' for x, y in flow_pts)
    flow2 = "".join(f'<circle cx="{x-800}" cy="{y}" r="11" fill="{C["red"]}" opacity=".85"/>' for x, y in flow_pts)
    svg = (g(f"{p}-card", card) + f'<clipPath id="{p}-lum"><rect x="110" y="{vy0}" width="860" height="{vy1-vy0}"/></clipPath>'
           + f'<g clip-path="url(#{p}-lum)">' + g(f"{p}-flow", flow + flow2) + "</g>"
           + g(f"{p}-clot", clot) + g(f"{p}-stent", stent)
           + f'<g clip-path="url(#{p}-lum)">' + g(f"{p}-wire", f'<line x1="110" y1="{mid}" x2="760" y2="{mid}" stroke="{C["cream"]}" stroke-width="4"/>' + handle(760, mid, C["blue"], 18, True)) + "</g>"
           + scatter(p, [(990, 1180, C["teal"], 1), (100, 1640, C["orange"], 0)]))
    body = ground(p, d, (540, 1380, C["blue"], .3)) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'therapie <b>· esc 2023</b>')}
  {h2(p, 'jede minute zählt')}
  <div id="{p}-panel" style="position:absolute;left:70px;top:450px;width:940px;padding:10px 44px 20px;border-radius:44px;background:rgba(240,236,229,.04);border:1.5px solid rgba(240,236,229,.22)">{rws}</div>
  <div id="{p}-pci" style="position:absolute;left:110px;top:1430px;display:flex;align-items:baseline;gap:20px">
    <span style="font-weight:900;font-size:8cqw;letter-spacing:-.03em">STEMI</span>{arrow_inline(C['cream'],50,30)}<span id="{p}-pciw" style="font-weight:900;font-size:8cqw;letter-spacing:-.03em;color:#9AA8FF">PCI</span>
    <span class="{p}-lab" id="{p}-120" style="margin-left:18px;color:{C['cream']}">innerhalb 120 min</span></div>
""")
    t_th, t_nr, t_as, t_ni, t_sa, t_st, t_hk, t_ih = (cue(n, "Therapie"), cue(n, "Notruf"), cue(n, "ASS"), cue(n, "Nitro"), cue(n, "Sauerstoff"),
                                                       cue(n, "STEMI"), cue(n, "Herzkatheter"), cue(n, "innerhalb"))
    js = f"""
    fade("#{p}-kick", 0.05); rise("#{p}-h2", 0.2);
    rise("#{p}-panel", {t_th + 0.2}, {{ y: 60, d: 0.6 }});
    slide("#{p}-r0", {t_nr}); slide("#{p}-r1", {t_as}); slide("#{p}-r2", {t_ni}); slide("#{p}-r3", {t_ni + 0.9}); slide("#{p}-r4", {t_sa});
    pop("#{p}-card", {t_st - 0.4}, {{ s: 0.9, d: 0.6, e: "expo.out" }});
    fade("#{p}-clot", {t_st - 0.3});
    rise("#{p}-pci", {t_st}, {{ y: 30 }});
    tl.fromTo("#{p}-wire", {{ opacity: 0, x: -650 }}, {{ opacity: 1, x: 0, duration: 0.9, ease: "power2.inOut" }}, {t_hk - 0.6});
    pop("#{p}-stent", {t_hk + 0.25}, {{ s: 0.7, d: 0.4, e: "power3.out" }});
    tl.to("#{p}-clot", {{ opacity: 0, scaleY: 0.2, transformOrigin: "50% 50%", duration: 0.6, ease: "power2.in" }}, {t_hk + 0.3});
    tl.fromTo("#{p}-flow", {{ x: -400 }}, {{ x: 800, duration: {d - t_hk - 0.4:.2f}, ease: "power1.in" }}, {t_hk + 0.4});
    tl.to("#{p}-pciw", {{ textShadow: "0 0 36px rgba(61,90,254,.95)", duration: 0.4 }}, {t_hk + 0.3});
    fade("#{p}-120", {t_ih});
"""
    write(fid, d, "", body, js)


# ── F13 Merke + CTA ─────────────────────────────────────────────────────────
def f13():
    fid, n, p = "13-merke", 13, "f13"
    d = DUR[n]
    svg = (g(f"{p}-a1", arrow(110, 450, 110, 520, C["muted"], 3)) + g(f"{p}-a2", arrow(110, 640, 110, 710, C["muted"], 3))
           + g(f"{p}-box", selbox(395, 1062, 105, 148, C["blue"]))
           + scatter(p, [(980, 330, C["teal"], 1), (960, 980, C["blue"], 1), (120, 1290, C["orange"], 0), (940, 1330, C["blue"], 0)]))
    body = ground(p, d, (540, 1150, C["blue"], .3)) + content(p, d, art(p, svg) + f"""
  {kicker(p, 'merke')}
  {h2(p, 'plaque reißt', 330, 'l1', 'left:160px')}
  {h2(p, 'thrombus verschließt', 530, 'l2', 'left:160px')}
  {h2(p, 'muskel stirbt.', 720, 'l3', 'left:160px;color:' + C['red'])}
  <div id="{p}-wm" style="position:absolute;left:72px;top:1040px;font-weight:900;font-size:16cqw;letter-spacing:-.04em;line-height:1;white-space:nowrap"><span id="{p}-wm1">med</span><span id="{p}-wm2" style="color:#8496FF;display:inline-block">2</span><span id="{p}-wm3">be</span></div>
  <div class="{p}-lab" id="{p}-tag" style="position:absolute;left:80px;top:1250px;color:{C['muted']}">medizin · verständlich</div>
  <div class="{p}-chip" id="{p}-cta" style="left:72px;top:1330px;background:{C['blue']};border-color:{C['blue']}"><span class="{p}-h3" style="font-size:5cqw">folgen</span>{arrow_inline(C['cream'],44,28)}</div>
  <div class="{p}-lab" id="{p}-disc" style="position:absolute;left:76px;top:1530px;width:930px;white-space:normal;font-size:2.1cqw;line-height:1.5;color:{C['muted']}">nur zu lernzwecken · kein ersatz für ärztlichen rat · esc-leitlinie acs 2023</div>
""")
    t_m, t_pl, t_th, t_mu, t_fo = cue(n, "Merke"), cue(n, "Plaque"), cue(n, "Thrombus"), cue(n, "Muskel"), cue(n, "Folge")
    js = f"""
    fade("#{p}-kick", {t_m - 0.2});
    slide("#{p}-l1", {t_pl - 0.05}); fade("#{p}-a1", {t_pl + 0.4});
    slide("#{p}-l2", {t_th - 0.05}); fade("#{p}-a2", {t_th + 0.4});
    slam("#{p}-l3", {t_mu - 0.05});
    rise("#{p}-wm1", {t_fo}, {{ y: 80 }}); rise("#{p}-wm3", {t_fo + 0.12}, {{ y: 80 }});
    tl.fromTo("#{p}-wm2", {{ opacity: 0, scale: 0.2, rotation: -25, transformOrigin: "50% 60%" }}, {{ opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2.4)" }}, {t_fo + 0.2});
    pop("#{p}-box", {t_fo + 0.55}, {{ s: 1.3, d: 0.4, e: "power3.out" }});
    fade("#{p}-tag", {t_fo + 0.7}); rise("#{p}-cta", {t_fo + 0.95}, {{ y: 30 }});
    tl.to("#{p}-cta", {{ scale: 1.06, transformOrigin: "0% 50%", duration: 0.25, ease: "power2.out" }}, {t_fo + 2.0}); tl.to("#{p}-cta", {{ scale: 1, duration: 0.35, ease: "power2.inOut" }}, {t_fo + 2.25});
    fade("#{p}-disc", {t_fo + 1.2});
"""
    write(fid, d, "", body, js)


if __name__ == "__main__":
    for f in (f01, f02, f03, f04, f05, f06, f07, f08, f09, f10, f11, f12, f13):
        f()
    print("built", len(list(OUT.glob("*.html"))), "frames; durations", DUR)
