// Nichtraucherberatung: one paused GSAP timeline, every frame a function of time.
// Times come from data.js (build_data.py): CUES = element entrances, REPLIKEN = subtitles + speaker turns.
(function () {
  const C = window.CUES;
  const $ = (id) => document.getElementById(id);
  const tl = gsap.timeline({ paused: true });
  const END = window.DIALOG_END;
  const STEPS = ["Ask", "Advise", "Assess", "Assist", "Arrange"];
  const DEFS = {
    Ask: "Rauchstatus erfragen",
    Advise: "Zum Rauchstopp raten",
    Assess: "Abhängigkeit und Motivation einschätzen",
    Assist: "Beim Rauchstopp unterstützen",
    Arrange: "Folgekontakte vereinbaren",
  };

  const show = (el, t, from = { y: 26 }) =>
    tl.fromTo(el, { opacity: 0, ...from }, { opacity: 1, x: 0, y: 0, duration: 0.55, ease: "power2.out" }, t);
  const hide = (el, t, d = 0.4) => tl.to(el, { opacity: 0, duration: d, ease: "power2.inOut" }, t);
  const cue = (k) => {
    if (!(k in C)) throw new Error("missing cue " + k);
    return C[k];
  };

  // ---------- intro ----------
  show($("i-tag"), 0.4);
  show($("i-title"), 1.0, { y: 40 });
  show($("i-pf"), 2.2, { x: -30 });
  show($("i-p"), 2.7, { x: 30 });
  hide($("intro"), 9.1, 0.6);
  tl.to($("main"), { opacity: 1, duration: 0.6, ease: "power2.inOut" }, 9.3);

  // ---------- phases: top bar, panel, banner ----------
  const P = window.PHASES;
  P.forEach((p, i) => {
    const a = i === 0 ? 9.3 : p.a - 0.4; // phase panel switches in the 0.8 s pause before the phase
    const b = i + 1 < P.length ? P[i + 1].a - 0.4 : END + 0.3;
    tl.fromTo($("st-" + p.phase).querySelector(".on"), { opacity: 0 }, { opacity: 1, duration: 0.35 }, a);
    tl.to($("st-" + p.phase).querySelector(".on"), { opacity: 0, duration: 0.35 }, b);
    const label = $("st-" + p.phase).querySelectorAll("span, b");
    tl.fromTo(label, { color: "#44506A" }, { color: "#ffffff", duration: 0.35 }, a);
    tl.to(label, { color: "#44506A", duration: 0.35 }, b);
    const ph = $("ph-" + p.phase);
    const head = i === 0 ? a + 0.2 : p.a + 2.2; // after the banner
    tl.fromTo(ph, { opacity: 0 }, { opacity: 1, duration: 0.45 }, head);
    if (i + 1 < P.length) hide(ph, b - 0.1, 0.35);

    if (i > 0) {
      // banner: dark card over the panel for ~2.6 s at the start of each 5A step
      const n = STEPS.indexOf(p.phase) + 1;
      tl.call(() => {}, null, a); // keep a label-free anchor; text is set below with .set
      tl.set($("bn-num"), { textContent: "Schritt " + n + " von 5" }, a);
      tl.set($("bn-name"), { textContent: p.phase }, a);
      tl.set($("bn-def"), { textContent: DEFS[p.phase] }, a);
      tl.fromTo($("banner"), { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" }, a);
      tl.fromTo($("bn-name"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, a + 0.1);
      tl.fromTo($("bn-def"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, a + 0.35);
      tl.to($("banner"), { opacity: 0, duration: 0.45, ease: "power2.inOut" }, p.a + 2.0);
    }
  });

  // ---------- Takiyat sits down once Sami says "setzen Sie sich" ----------
  const sit = cue("sit") + 0.5;
  tl.fromTo($("tak-top"), { y: 0 }, { y: 70, duration: 0.7, ease: "power2.inOut" }, sit);
  tl.fromTo($("tak-stand"), { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.inOut" }, sit + 0.25);
  tl.fromTo($("tak-sit"), { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.inOut" }, sit + 0.25);

  // ---------- panel content ----------
  const at = (key, id, from) => show($(id || "c-" + key), cue(key), from);
  at("e-q");
  at("e-perm");
  at("e-arzt");
  at("ask-1");
  at("ask-2");
  ["adv-1", "adv-2", "adv-3", "adv-4", "adv-5"].forEach((k) => at(k, null, { x: -24 }));
  hide($("adv-a"), cue("adv-o2") - 0.1, 0.35);
  tl.fromTo($("c-adv-o2"), { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, cue("adv-o2"));

  at("as-q1");
  at("as-a1", null, { x: -16 });
  at("as-q2");
  at("as-a2", null, { x: -16 });
  at("as-res");
  tl.fromTo($("c-as-will"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, cue("as-will"));
  hide($("as-a"), cue("as-scale") - 0.1, 0.35);
  at("as-scale");
  show($("c-scale"), cue("as-scale") + 0.3);
  tl.fromTo($("c-knob"), { opacity: 0, left: "0%" }, { opacity: 1, left: "0%", duration: 0.3 }, cue("as-n") - 0.3);
  tl.to($("c-knob"), { left: "40%", duration: 0.9, ease: "power2.out" }, cue("as-n"));
  at("as-frau", null, { x: -16 });
  tl.fromTo($("c-low"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, cue("as-low"));
  at("as-low");
  at("as-why", null, { x: -16 });

  at("ass-net");
  ["ass-pfl", "ass-skat", "ass-kau", "ass-frau"].forEach((k) => at(k, null, { x: -24 }));
  hide($("ass-a"), cue("ass-tel") - 0.1, 0.35);
  at("ass-tel", null, { x: -24 });
  tl.fromTo($("c-ass-rueck"), { opacity: 0 }, { opacity: 1, duration: 0.45 }, cue("ass-rueck"));
  at("ass-info", null, { x: -24 });
  tl.fromTo($("prop-info"), { attr: { opacity: 0 } }, { attr: { opacity: 1 }, duration: 0.5 }, cue("ass-info"));
  at("ass-step", null, { x: -24 });
  tl.fromTo($("c-ass-try"), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, cue("ass-try"));

  // checklist: row on its words, tick once the measure has been said in full
  const ticks = [
    ["arr-1", cue("arr-2") - 0.4],
    ["arr-2", cue("arr-3") - 0.4],
    ["arr-3", cue("arr-ok") - 0.6],
  ];
  ticks.forEach(([k, tick]) => {
    const row = $("c-" + k);
    show(row, cue(k), { x: -24 });
    tl.fromTo(row.querySelector(".fill"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, tick);
    const path = row.querySelector("path");
    tl.fromTo(path, { strokeDasharray: 30, strokeDashoffset: 30 }, { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, tick + 0.1);
  });
  at("arr-ok");
  hide($("c-arr-ok"), cue("arr-q") - 0.35, 0.3);
  at("arr-q");

  // ---------- subtitles ----------
  const subs = $("subs");
  window.REPLIKEN.forEach((r) => {
    r.lines.forEach((l) => {
      const el = document.createElement("div");
      el.className = "sub " + (r.speaker === "PF" ? "pf" : "p");
      el.innerHTML = '<div class="who"></div><div class="tx"></div>';
      el.querySelector(".who").textContent = r.speaker === "PF" ? "Takiyat" : "Sami";
      const tx = el.querySelector(".tx");
      // keep the web address on one line
      l.text.split(/(rauchfrei-info\.de)/).forEach((part) => {
        const span = document.createElement("span");
        span.textContent = part;
        if (part === "rauchfrei-info.de") span.style.whiteSpace = "nowrap";
        tx.appendChild(span);
      });
      subs.appendChild(el);
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.12 }, l.a);
      tl.to(el, { opacity: 0, duration: 0.12 }, l.b - 0.12);
    });
  });

  // ---------- characters: talk, blink, breathe (pure functions of t) ----------
  const R = window.REPLIKEN;
  const L = window.LOUD;
  const who = (t) => {
    for (const r of R) if (t >= r.a - 0.05 && t <= r.b + 0.1) return r.speaker;
    return null;
  };
  const chars = {
    PF: { head: $("tak-head"), mouth: $("tak-mouth"), eyes: [$("tak-eye1"), $("tak-eye2")], waves: $("tak-waves"), hl: $("tag-pf").querySelector(".hl"), blink: [4.3, 0.0] },
    P: { head: $("sami-head"), mouth: $("sami-mouth"), eyes: [$("sami-eye1"), $("sami-eye2")], waves: $("sami-waves"), hl: $("tag-p").querySelector(".hl"), blink: [5.1, 1.7] },
  };
  function draw(t) {
    const sp = who(t);
    const loud = L[Math.min(L.length - 1, Math.max(0, Math.round(t * 30)))] || 0;
    for (const k of ["PF", "P"]) {
      const c = chars[k];
      const talking = sp === k;
      const l = talking ? loud : 0;
      const breathe = k === "P" ? Math.sin(t * 2.8 + 1.3) * 2.4 : Math.sin(t * 1.7) * 1.6; // Sami: short of breath (COPD)
      c.head.setAttribute("transform", "translate(0 " + (breathe - l * 4).toFixed(2) + ")");
      c.mouth.setAttribute("ry", (2 + l * 8).toFixed(2));
      c.mouth.setAttribute("rx", (8 + l * 2).toFixed(2));
      const [period, phase] = c.blink;
      const blinking = (t + phase) % period < 0.13;
      c.eyes.forEach((e) => e.setAttribute("ry", blinking ? "0.8" : "6"));
      c.waves.setAttribute("opacity", Math.min(1, l * 1.8).toFixed(2));
      c.hl.style.opacity = talking ? "1" : "0";
    }
  }
  const clock = { t: 0 };
  tl.to(clock, { t: window.DURATION, duration: window.DURATION, ease: "none", onUpdate: () => draw(clock.t) }, 0);

  // ---------- end card ----------
  const O = END + 0.15;
  hide($("main"), O, 0.6);
  tl.to(document.querySelector("#bg .green"), { opacity: 1, duration: 0.9, ease: "power2.inOut" }, O);
  show($("o-h"), O + 0.6);
  ["oc1", "oc2", "oc3", "oc4", "oc5"].forEach((id, i) => show($(id), O + 1.2 + i * 0.35));
  show($("o-src"), O + 3.6);
  show($("o-tel"), O + 4.4);
  show($("o-cred"), O + 5.4);

  window.__nrbTimeline = tl;
})();
