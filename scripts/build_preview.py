"""Build a browser-playable review page for an episode (for iPad review without a render).

The HyperFrames composition is a paused GSAP timeline + hf-seek listeners. This wraps the
real index.html in a small player: the <audio> element is the clock, every animation frame
seeks the timeline and dispatches hf-seek (exactly what the renderer does per frame), the
1920×1080 stage is scaled to the screen, and chapters come from SHOTS. 3D runs at draft
quality for tablets. Output: episodes/<slug>/preview/index.html (published with its assets
as an Artifact; the composition files are referenced, not copied).

Usage: python3 scripts/build_preview.py episodes/<slug> "<Title>" [chapter labels as id=Label ...]
"""
import pathlib, re, sys

ep = pathlib.Path(sys.argv[1])
title = sys.argv[2]
labels = dict(a.split("=", 1) for a in sys.argv[3:])
src = (ep / "index.html").read_text(encoding="utf-8")

head = src[src.index("<head>") + 6: src.index("</head>")]
body = src[src.index("<body>") + 6: src.index("</body>")]
links = "\n".join(re.findall(r'<link rel="stylesheet"[^>]*>', head))
head_scripts = "\n".join(re.findall(r"<script src=[^>]*></script>", head))
# composition scripts at the end of body run after the player shim
comp_scripts = body[body.index('<script type="importmap">'):]
stage = body[: body.index('<script type="importmap">')]
stage = re.sub(r"<!--.*?-->", "", stage, flags=re.S)
chapters = ",".join(f'"{k}":"{v}"' for k, v in labels.items())

page = f"""<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
{links}
<style>
  /* Review player around the 1920×1080 composition: dark single-look video chrome. */
  :root {{ --ink: #0d1512; --panel: #16211c; --line: #2a3a32; --text: #eef5f1; --muted: #9fb3a9; --mint: #2ecc91; --gold: #f4c430; color-scheme: dark; }}
  html, body {{ width: auto !important; height: 100% !important; overflow: hidden !important; background: var(--ink) !important; }}
  body {{ color: var(--text); font-family: Montserrat, system-ui, sans-serif; display: flex; flex-direction: column;
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 12px; gap: 10px; box-sizing: border-box; }}
  #frame {{ position: relative; flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }}
  #box {{ position: relative; overflow: hidden; border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,.45); }}
  #root {{ position: absolute !important; left: 0; top: 0; width: 1920px !important; height: 1080px !important; transform-origin: 0 0; }}
  #bar {{ display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }}
  #play {{ width: 54px; height: 54px; border-radius: 50%; border: 0; background: var(--mint); color: var(--ink); font-size: 22px; font-weight: 800; cursor: pointer; flex-shrink: 0; }}
  #play:focus-visible, .ch:focus-visible, #seek:focus-visible {{ outline: 3px solid var(--gold); outline-offset: 2px; }}
  #seek {{ flex: 1; min-width: 160px; accent-color: var(--mint); height: 28px; }}
  #time {{ font-variant-numeric: tabular-nums; font-weight: 700; font-size: 15px; color: var(--muted); min-width: 104px; text-align: right; }}
  #chapters {{ display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: thin; }}
  .ch {{ flex-shrink: 0; border: 1px solid var(--line); background: var(--panel); color: var(--text); border-radius: 999px; padding: 8px 14px; font: 600 13px Montserrat, system-ui, sans-serif; cursor: pointer; }}
  .ch[aria-current="true"] {{ background: var(--mint); color: var(--ink); border-color: var(--mint); }}
  .ch span {{ font-variant-numeric: tabular-nums; opacity: .7; margin-right: 6px; }}
  #hint {{ font-size: 12px; color: var(--muted); }}
</style>
{head_scripts}
<script>
  window.__timelines = {{}};
  window.__hyperframes = {{ getVariables: function () {{ return {{ quality: "draft" }}; }} }};
</script>
<div id="frame"><div id="box">
{stage}
</div></div>
<div id="bar">
  <button id="play" type="button" aria-label="Abspielen">▶</button>
  <input id="seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Position">
  <div id="time">0:00 / 0:00</div>
</div>
<nav id="chapters" aria-label="Kapitel"></nav>
<div id="hint">Entwurf zur Durchsicht · 3D in Vorschauqualität · Ton startet mit ▶</div>
{comp_scripts}
<script>
  (function () {{
    var LABELS = {{{chapters}}};
    var audio = document.getElementById("voice");
    var root = document.getElementById("root");
    var box = document.getElementById("box");
    var frame = document.getElementById("frame");
    var play = document.getElementById("play");
    var seek = document.getElementById("seek");
    var time = document.getElementById("time");
    var nav = document.getElementById("chapters");
    var END = window.SHOTS.END;
    var fmt = function (t) {{ t = Math.max(0, t); return Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0"); }};
    function fit() {{
      var w = frame.clientWidth, h = frame.clientHeight;
      var s = Math.min(w / 1920, h / 1080);
      root.style.transform = "scale(" + s + ")";
      box.style.width = 1920 * s + "px";
      box.style.height = 1080 * s + "px";
    }}
    new ResizeObserver(fit).observe(frame);
    fit();
    var chips = window.SHOTS.list.map(function (s) {{
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ch";
      b.innerHTML = "<span>" + fmt(s.a) + "</span>" + (LABELS[s.id] || s.id);
      b.addEventListener("click", function () {{ go(s.a + 0.05); }});
      nav.appendChild(b);
      return {{ el: b, s: s }};
    }});
    var last = -1;
    function draw(t) {{
      var tl = window.__timelines.main;
      if (!tl) return;
      tl.seek(t, false);
      window.__hfThreeTime = t;
      window.dispatchEvent(new CustomEvent("hf-seek", {{ detail: {{ time: t }} }}));
      seek.value = Math.round((t / END) * 1000);
      time.textContent = fmt(t) + " / " + fmt(END);
      var cur = window.SHOTS.at(t);
      if (cur !== last) {{ chips.forEach(function (c) {{ c.el.setAttribute("aria-current", c.s === cur ? "true" : "false"); }}); last = cur; }}
    }}
    // own clock: the frame follows `cur`; while playing, cur follows the audio
    var cur = 0;
    function go(t) {{
      cur = Math.min(END - 0.05, Math.max(0, t));
      try {{ audio.currentTime = cur; }} catch (e) {{}}
      draw(cur);
    }}
    function loop() {{ if (!audio.paused) {{ cur = audio.currentTime; draw(cur); requestAnimationFrame(loop); }} }}
    play.addEventListener("click", function () {{
      if (audio.paused) {{ try {{ if (Math.abs(audio.currentTime - cur) > 0.3) audio.currentTime = cur; }} catch (e) {{}} audio.play().then(function () {{ play.textContent = "❚❚"; play.setAttribute("aria-label", "Pause"); loop(); }}).catch(function () {{}}); }}
      else {{ audio.pause(); }}
    }});
    audio.addEventListener("pause", function () {{ play.textContent = "▶"; play.setAttribute("aria-label", "Abspielen"); }});
    audio.addEventListener("ended", function () {{ play.textContent = "▶"; }});
    seek.addEventListener("input", function () {{ go((seek.value / 1000) * END); }});
    // first frame: the title moment, so the page is complete at rest
    function start() {{ if (window.__timelines.main && window.__world) go(24); else setTimeout(start, 120); }}
    start();
  }})();
</script>
"""
out = ep / "preview"
out.mkdir(exist_ok=True)
(out / "index.html").write_text(page, encoding="utf-8")
print(out / "index.html")
