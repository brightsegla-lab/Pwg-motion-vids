// Pflege-WG kit — 2D timeline helpers, shared by every episode.
// Builds the paused root GSAP timeline and the moves every episode repeats:
// scene windows from SHOTS, the 3D layer fade + cream dip between 3D shots,
// ambient background drift, the brand-green outro, the watermark, and the
// three entrance verbs (inn / out / check). Episode code (timeline.js) only
// adds its own element entrances, each keyed to a named cue.
(function () {
  var OUT = "power2.out";
  var IO = "power2.inOut";

  window.PWG = window.PWG || {};
  window.PWG.timeline = function () {
    var C = window.CUES;
    var SH = window.SHOTS;
    var tl = gsap.timeline({ paused: true });

    // Entrance: fade + 26 px rise (or slide from x), one move per element.
    function inn(sel, at, o) {
      o = o || {};
      var from = { autoAlpha: 0 };
      var to = { autoAlpha: 1, duration: o.dur || 0.55, ease: o.ease || OUT };
      if (o.x !== undefined) { from.x = o.x; to.x = 0; }
      else if (!o.fadeOnly) { from.y = o.y !== undefined ? o.y : 26; to.y = 0; }
      if (o.scale !== undefined) { from.scale = o.scale; to.scale = 1; }
      tl.fromTo(sel, from, to, at);
    }
    function out(sel, at, dur) {
      tl.to(sel, { autoAlpha: 0, duration: dur || 0.4, ease: IO }, at);
    }
    // App-like checklist row: row slides in at `appear`, box fills + tick draws at `done`.
    function check(row, appear, done, night) {
      inn(row, appear, { x: -24 });
      tl.to(row + " .fill", { opacity: 1, duration: 0.28, ease: "power1.out" }, done);
      tl.to(row + " .box path", { strokeDashoffset: 0, duration: 0.36, ease: OUT }, done + 0.12);
      tl.to(row + " .t", { color: night ? "#8FF0C8" : "#1B8F5A", duration: 0.3, ease: OUT }, done + 0.1);
    }

    // Scene windows: every <section id="s-ID"> follows its SHOTS entry.
    function scenes() {
      SH.list.forEach(function (s) {
        var el = "#s-" + s.id;
        if (!document.querySelector(el)) return;
        if (s.a <= 0) tl.set(el, { autoAlpha: 1 }, 0);
        else tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: IO }, s.a - 0.05);
        if (s.b < SH.END - 0.01) out(el, s.b - 0.3, 0.45);
      });
    }

    // 3D layer: fade in/out per run of consecutive 3D shots; cream dip on 3D → 3D cuts.
    function world() {
      var runs = [];
      SH.list.forEach(function (s, i) {
        var prev = SH.list[i - 1];
        if (!s.set) return;
        if (prev && prev.set && runs.length) {
          runs[runs.length - 1].b = s.b;
          tl.fromTo("#dip", { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power1.in", immediateRender: false }, s.a - 0.22);
          tl.to("#dip", { opacity: 0, duration: 0.35, ease: "power1.out" }, s.a);
        } else runs.push({ a: s.a, b: s.b });
      });
      runs.forEach(function (r) {
        if (r.a <= 0) tl.set("#world", { opacity: 1 }, 0);
        else tl.fromTo("#world", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: IO, immediateRender: false }, r.a - 0.1);
        if (r.b < SH.END - 0.01) tl.to("#world", { opacity: 0, duration: 0.5, ease: IO }, r.b - 0.3);
      });
    }

    // Background: slow ambient blob drift for the whole runtime, brand green from the outro.
    function background() {
      var n = function (period) { return Math.ceil(SH.END / period) + 1; };
      tl.to("#bg .b1", { x: 80, y: 50, duration: 19, ease: "sine.inOut", yoyo: true, repeat: n(19) }, 0);
      tl.to("#bg .b2", { x: -70, y: -40, duration: 23, ease: "sine.inOut", yoyo: true, repeat: n(23) }, 0);
      tl.to("#bg .b3", { x: -50, y: 30, duration: 17, ease: "sine.inOut", yoyo: true, repeat: n(17) }, 0);
      if (SH.by.outro) tl.fromTo("#bg .green", { opacity: 0 }, { opacity: 1, duration: 0.9, ease: IO, immediateRender: false }, SH.by.outro.a - 0.2);
    }

    // Watermark visible during [a, b) windows (content scenes; not intro, dark shots, outro).
    function watermark(windows) {
      windows.forEach(function (w) {
        tl.fromTo("#wm", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, immediateRender: false }, w[0]);
        out("#wm", w[1] - 0.3);
      });
      tl.set("#wm", { autoAlpha: 0 }, 0);
    }

    // The standard frame: scenes + 3D layer + background. Episode adds the rest.
    scenes();
    world();
    background();

    return { tl: tl, C: C, SH: SH, inn: inn, out: out, check: check, watermark: watermark, OUT: OUT, IO: IO };
  };
})();
