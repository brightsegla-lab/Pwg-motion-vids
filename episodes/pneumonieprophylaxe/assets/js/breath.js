// Pneumonieprophylaxe — "Atmung" thread.
// One deterministic breathing model shared by every layer:
//   BREATH.v(t)     lung volume 0..1 (inhale ≈ 40 % of the cycle, slower exhale), 13 breaths/min
//   BREATH.amp(t)   depth envelope keyed to cues (shallow breathing in the case study, deep on "tief ein")
//   BREATH.exhaling(t)
// It draws the spirometry curve (canvas#breath) and drives the calm "resting breath" pulse of the
// background and the 2D stage. Everything is a pure function of HyperFrames time (hf-seek).
(function () {
  var C = window.CUES;
  var SH = window.SHOTS;
  var PERIOD = 60 / 13; // s per breath
  var TAU = Math.PI * 2;
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var smooth = function (x) { x = clamp(x); return x * x * (3 - 2 * x); };
  var ramp = function (t, a, d) { return smooth((t - a) / d); };

  // phase 0..1 inside the breath; inhale 0..0.4 (sine up), exhale 0.4..1 (eased down)
  function phase(t) { var p = t / PERIOD; return p - Math.floor(p); }
  function wave(p) {
    if (p < 0.4) return 0.5 - 0.5 * Math.cos((p / 0.4) * Math.PI);
    var q = (p - 0.4) / 0.6;
    return 0.5 + 0.5 * Math.cos(Math.pow(q, 0.8) * Math.PI);
  }
  // depth envelope: 1 = calm normal breathing
  function amp(t) {
    var a = 1;
    // SMI: one long, deep inhalation while "atmet tief ein" is said
    a += 0.7 * ramp(t, C.smi_ein - 0.3, 0.8) * (1 - ramp(t, C.smi_ein + 3.2, 1.2));
    // case study: shallow while the situation is described, deeper again with the measures
    var shallow = ramp(t, C.c_flach, 1.2) * (1 - ramp(t, C.m_tiefer, 2.2));
    a *= 1 - 0.72 * shallow;
    a *= 1 + 0.35 * ramp(t, C.m_tiefer, 2.2) * (1 - ramp(t, C.summary, 2));
    return a;
  }
  function v(t) { return wave(phase(t)); }
  function exhaling(t) { return phase(t) >= 0.4; }
  window.BREATH = { PERIOD: PERIOD, phase: phase, v: v, amp: amp, exhaling: exhaling };

  // ---------------------------------------------------------------- spirometry curve
  var canvas = document.getElementById("breath");
  var ctx = canvas && canvas.getContext("2d");
  var stage = document.getElementById("pulse");
  var dots = document.querySelector("#bg .dots");
  var OUTRO = SH.by.outro ? SH.by.outro.a : SH.END + 1;
  var e3 = function (x) { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

  // band geometry: hero (intro, across the middle) → docked (bottom band, left of the orbs dock)
  var HERO = { x0: 140, x1: 1780, y: 640, h: 150 };
  var DOCK = { x0: 96, x1: 1540, y: 1012, h: 40 };
  var WINDOW = 12; // seconds of history across the band

  function geom(t) {
    var k = e3((t - (C.title - 1.2)) / 1.6); // hero until the title lands, then docks
    var g = {};
    ["x0", "x1", "y", "h"].forEach(function (n) { g[n] = HERO[n] + (DOCK[n] - HERO[n]) * k; });
    g.alpha = clamp((t - 0.3) / 1.2);
    g.onGreen = t >= OUTRO + 0.2;
    return g;
  }

  function render(t) {
    // calm resting-breath pulse: background dots + every 2D card, tiny and slow
    var vv = v(t) * Math.min(1, amp(t));
    if (stage) stage.style.transform = "scale(" + (1 + 0.0055 * vv).toFixed(5) + ")";
    if (dots) dots.style.transform = "scale(" + (1 + 0.009 * vv).toFixed(5) + ")";
    if (!ctx) return;
    ctx.clearRect(0, 0, 1920, 1080);
    var g = geom(t);
    if (g.alpha <= 0.001) return;
    var line = g.onGreen ? "255,255,255" : "27,143,90";
    ctx.save();
    ctx.globalAlpha = g.alpha;
    // baseline
    ctx.strokeStyle = "rgba(" + line + ",0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x0, g.y);
    ctx.lineTo(g.x1, g.y);
    ctx.stroke();
    // trace: the last WINDOW seconds, oldest at the left; fades in from the left edge
    var w = g.x1 - g.x0;
    var steps = Math.round(w / 3);
    var grad = ctx.createLinearGradient(g.x0, 0, g.x1, 0);
    grad.addColorStop(0, "rgba(" + line + ",0)");
    grad.addColorStop(0.18, "rgba(" + line + ",0.75)");
    grad.addColorStop(1, "rgba(" + line + ",1)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = g.h > 80 ? 5 : 3.2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = g.onGreen ? "rgba(255,255,255,0.5)" : "rgba(46,204,145,0.55)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    var hx = g.x1, hy = g.y, started = false;
    for (var i = 0; i <= steps; i++) {
      var f = i / steps;
      var tt = t - WINDOW * (1 - f);
      if (tt < 0) continue; // no history before the episode starts
      var x = g.x0 + w * f;
      var y = g.y - g.h * amp(tt) * v(tt);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      hx = x; hy = y;
    }
    ctx.stroke();
    // head dot
    ctx.shadowBlur = 18;
    ctx.fillStyle = g.onGreen ? "#ffffff" : "#2ECC91";
    ctx.beginPath();
    ctx.arc(hx, hy, g.h > 80 ? 9 : 6.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  window.BREATH.render = render;
  window.addEventListener("hf-seek", function (e) { render(e.detail.time); });
  render(window.__hfThreeTime || 0);
})();
