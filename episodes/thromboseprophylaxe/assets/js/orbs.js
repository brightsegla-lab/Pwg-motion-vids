// Pflege-WG kit — speaker orbs (Nora mint, Ben gold), shared by every episode.
// Input (data.js): window.TURNS [[start, end, "Nora"|"Ben"], …] and
// window.LOUDNESS {fps, values[]} (one 0..1 value per video frame, precomputed with ffmpeg).
// Everything below is a pure function of time: the smoothed envelopes are computed once,
// up front, so seeking to any frame gives the same pixels.
(function () {
  var W = 1920, H = 1080;
  var canvas = document.getElementById("orbs");
  var dock = document.getElementById("dock");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var C = window.CUES || {};
  var L = window.LOUDNESS;
  var FPS = L.fps;
  var N = L.values.length;

  var VOICES = {
    Nora: { name: "Nora", c: ["#2ECC91", "#8FF5CC", "#12A36E", "#D9FFF0"], halo: "46,204,145" },
    Ben: { name: "Ben", c: ["#F4C430", "#FFE58F", "#E0A214", "#FFF6D6"], halo: "244,196,48" },
  };
  var ORDER = ["Nora", "Ben"];

  // ---- precompute: per-speaker talk gate (eased in/out) × smoothed loudness
  function smooth(arr, attack, release) {
    var out = new Float32Array(arr.length), y = 0;
    for (var i = 0; i < arr.length; i++) {
      var x = arr[i];
      y += (x > y ? attack : release) * (x - y);
      out[i] = y;
    }
    return out;
  }
  var env = smooth(L.values, 0.55, 0.16);
  var act = {};
  ORDER.forEach(function (who) {
    var gate = new Float32Array(N);
    (window.TURNS || []).forEach(function (tr) {
      if (tr[2] !== who) return;
      var a = Math.max(0, Math.floor(tr[0] * FPS)), b = Math.min(N, Math.ceil(tr[1] * FPS));
      for (var i = a; i < b; i++) gate[i] = 1;
    });
    gate = smooth(gate, 0.25, 0.12);
    var a2 = new Float32Array(N);
    for (var i = 0; i < N; i++) a2[i] = gate[i] * env[i];
    act[who] = { gate: gate, level: smooth(a2, 0.5, 0.2) };
  });

  // ---- layout: hero (centred, big) during the intro shot + outro, docked bottom-right otherwise.
  // Driven by SHOTS (first shot = intro, shot id "outro"), so no episode-specific cue names.
  var SH = window.SHOTS || { list: [{ a: 0, b: N / FPS }], by: {}, END: N / FPS };
  var END = SH.END;
  var INTRO = SH.list[0];
  var OUTRO_AT = SH.by.outro ? SH.by.outro.a : END + 1;
  var APPEAR = C.welcome !== undefined ? C.welcome : 0.6; // orbs fade in with the first greeting
  var e3 = function (x) { x = Math.min(1, Math.max(0, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  function heroAmount(t) {
    var intro = e3((t - (APPEAR - 0.6)) / 0.8) * (1 - e3((t - (INTRO.b - 0.8)) / 0.9));
    var outro = e3((t - OUTRO_AT) / 1.0);
    return Math.max(intro, outro);
  }
  function visible(t) {
    var x = Math.min(1, Math.max(0, (t - (APPEAR - 0.8)) / 0.8));
    return x * x * (3 - 2 * x);
  }
  var DOCK = { Nora: [1640, 962], Ben: [1760, 962], r: 28, label: 1020 };
  function heroPos(t) {
    var outro = t >= OUTRO_AT;
    var y = outro ? 450 : 770;
    return { Nora: [860, y], Ben: [1060, y], r: outro ? 54 : 54, label: y + 100 };
  }

  // ---- drawing
  function blobPath(cx, cy, r, t, amp, seed) {
    ctx.beginPath();
    var n = 96;
    for (var i = 0; i <= n; i++) {
      var a = (i / n) * Math.PI * 2;
      var k = 1 + amp * (0.55 * Math.sin(3 * a + t * 2.1 + seed) + 0.3 * Math.sin(5 * a - t * 2.9 + seed * 2) + 0.15 * Math.sin(7 * a + t * 3.7));
      var x = cx + Math.cos(a) * r * k, y = cy + Math.sin(a) * r * k;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  function drawOrb(v, cx, cy, R, level, gate, t, seed) {
    var idle = 1 + 0.035 * Math.sin(t * (Math.PI * 2 / 4.2) + seed);
    var r = R * idle * (1 + 0.5 * level + 0.08 * gate);
    var glow = 0.25 + 0.75 * Math.min(1, level * 1.4 + gate * 0.25);
    // halo
    var hg = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * (2.2 + level * 0.9));
    hg.addColorStop(0, "rgba(" + v.halo + "," + (0.42 * glow).toFixed(3) + ")");
    hg.addColorStop(1, "rgba(" + v.halo + ",0)");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (2.2 + level * 0.9), 0, Math.PI * 2);
    ctx.fill();
    // body
    var amp = 0.025 + 0.11 * level;
    ctx.save();
    blobPath(cx, cy, r, t, amp, seed);
    var bg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r * 1.15);
    bg.addColorStop(0, v.c[3]);
    bg.addColorStop(0.45, v.c[0]);
    bg.addColorStop(1, v.c[2]);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.clip();
    // swirling inner lights
    ctx.globalCompositeOperation = "screen";
    for (var i = 0; i < 3; i++) {
      var ang = t * (0.7 + i * 0.35) * (i % 2 ? -1 : 1) + seed + i * 2.1;
      var ox = cx + Math.cos(ang) * r * (0.35 + 0.15 * level);
      var oy = cy + Math.sin(ang * 1.3) * r * (0.3 + 0.15 * level);
      var g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * 0.85);
      g.addColorStop(0, i === 1 ? "rgba(255,255,255,0.55)" : hexA(v.c[1], 0.75));
      g.addColorStop(1, hexA(v.c[1], 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    }
    ctx.globalCompositeOperation = "source-over";
    // specular highlight
    var sg = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, 0, cx - r * 0.35, cy - r * 0.45, r * 0.55);
    sg.addColorStop(0, "rgba(255,255,255,0.75)");
    sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    ctx.restore();
    // rim
    ctx.lineWidth = Math.max(1.5, r * 0.04);
    ctx.strokeStyle = "rgba(255,255,255," + (0.35 + 0.35 * glow).toFixed(3) + ")";
    blobPath(cx, cy, r, t, amp, seed);
    ctx.stroke();
  }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  function render(t) {
    ctx.clearRect(0, 0, W, H);
    var vis = visible(t);
    var hero = heroAmount(t);
    if (dock) dock.style.opacity = (vis * (1 - hero)).toFixed(3);
    if (vis <= 0.001) return;
    var f = Math.min(N - 1, Math.max(0, Math.round(t * FPS)));
    var hp = heroPos(t);
    ctx.globalAlpha = vis;
    ORDER.forEach(function (who, i) {
      var p = [DOCK[who][0] + (hp[who][0] - DOCK[who][0]) * hero, DOCK[who][1] + (hp[who][1] - DOCK[who][1]) * hero];
      var R = DOCK.r + (hp.r - DOCK.r) * hero;
      var a = act[who];
      drawOrb(VOICES[who], p[0], p[1], R, a.level[f], a.gate[f], t, i * 1.7);
    });
    // names
    ORDER.forEach(function (who) {
      var x = DOCK[who][0] + (hp[who][0] - DOCK[who][0]) * hero;
      var y = DOCK.label + (hp.label - DOCK.label) * hero;
      var a = act[who];
      ctx.font = "700 " + Math.round(22 + 8 * hero) + "px Montserrat";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // names in white over a dark (night) intro shot, ink everywhere else
      var onDark = hero > 0.5 && t < OUTRO_AT && INTRO.mood === "night";
      var base = onDark ? "255,255,255" : "15,26,21";
      ctx.fillStyle = "rgba(" + base + "," + (0.6 + 0.4 * a.gate[f]).toFixed(3) + ")";
      ctx.fillText(VOICES[who].name, x, y);
    });
    ctx.globalAlpha = 1;
  }

  window.__orbs = { render: render };
  window.addEventListener("hf-seek", function (e) { render(e.detail.time); });
  render(window.__hfThreeTime || 0);
})();
