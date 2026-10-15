// Pflege-WG · Sturzprophylaxe — the 2D timeline.
// Every entrance is keyed to a named cue (data.js: spoken time − 0.2 s); scene windows
// come from shots.js so the 2D and 3D layers cut on the same frame.
(function () {
  var C = window.CUES;
  var SH = window.SHOTS;
  var tl = gsap.timeline({ paused: true });
  var OUT = "power2.out";
  var IO = "power2.inOut";

  function inn(sel, at, o) {
    o = o || {};
    var from = { autoAlpha: 0 };
    var to = { autoAlpha: 1, duration: o.dur || 0.55, ease: o.ease || OUT };
    if (o.x !== undefined) { from.x = o.x; to.x = 0; }
    else if (!o.fadeOnly) { from.y = o.y !== undefined ? o.y : 26; to.y = 0; }
    tl.fromTo(sel, from, to, at);
  }
  function out(sel, at, dur) {
    tl.to(sel, { autoAlpha: 0, duration: dur || 0.4, ease: IO }, at);
  }
  function check(row, appear, done, night) {
    inn(row, appear, { x: -24 });
    tl.to(row + " .fill", { opacity: 1, duration: 0.28, ease: "power1.out" }, done);
    tl.to(row + " .box path", { strokeDashoffset: 0, duration: 0.36, ease: OUT }, done + 0.12);
    tl.to(row + " .t", { color: night ? "#8FF0C8" : "#1B8F5A", duration: 0.3, ease: OUT }, done + 0.1);
  }

  // ---------------------------------------------------------------- scenes
  SH.list.forEach(function (s) {
    var el = "#s-" + s.id;
    if (s.a <= 0) tl.set(el, { autoAlpha: 1 }, 0);
    else tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: IO }, s.a - 0.05);
    if (s.b < SH.END - 0.01) out(el, s.b - 0.3, 0.45);
  });

  // 3D layer: fade in/out per run of consecutive 3D shots, cream dip on 3D→3D cuts
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

  // background: slow ambient drift, brand green for the outro
  tl.to("#bg .b1", { x: 80, y: 50, duration: 19, ease: "sine.inOut", yoyo: true, repeat: 17 }, 0);
  tl.to("#bg .b2", { x: -70, y: -40, duration: 23, ease: "sine.inOut", yoyo: true, repeat: 14 }, 0);
  tl.to("#bg .b3", { x: -50, y: 30, duration: 17, ease: "sine.inOut", yoyo: true, repeat: 19 }, 0);
  tl.fromTo("#bg .green", { opacity: 0 }, { opacity: 1, duration: 0.9, ease: IO, immediateRender: false }, C.outro - 0.2);

  // watermark on content scenes (not intro, case at night, outro)
  tl.fromTo("#wm", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, C.frage_sturz);
  out("#wm", C.fall - 0.3);
  tl.to("#wm", { autoAlpha: 1, duration: 0.5 }, C.summary);
  out("#wm", C.outro - 0.3);

  // ---------------------------------------------------------------- 0 · intro
  tl.fromTo("#i-shade", { opacity: 0 }, { opacity: 1, duration: 1.4, ease: IO }, C.welcome - 0.8);
  inn("#i-brand", C.welcome, { y: -20 });
  inn("#i-reihe", C.reihe);
  tl.fromTo("#i-title", { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: "power3.out" }, C.title);
  inn("#i-haeufig", C.haeufig);

  // ---------------------------------------------------------------- 1 · definition
  inn("#d-def", C.def_sturz, { x: -30 });
  inn("#d-urs", C.ursachen, { x: 30 });
  inn("#d-u1", C.u_gang, { x: -20 });
  inn("#d-u2", C.u_rutsch, { x: -20 });
  inn("#d-u3", C.u_schwindel, { x: -20 });
  inn("#d-u4", C.u_schwaeche, { x: -20 });

  // ---------------------------------------------------------------- 2 · Folgen
  inn("#s-folgen .glass", C.f_prellung - 0.3, { x: 40 });
  ["f1", "f2", "f3", "f4", "f5", "f6", "f7"].forEach(function (id, i) {
    inn("#" + id, [C.f_prellung, C.f_brueche, C.f_oshb, C.f_kopf, C.f_schmerz, C.f_angst, C.f_selbst][i], { x: -20 });
  });

  // ---------------------------------------------------------------- 3 · Teufelskreis
  var k = C.kreis;
  ["#k-a1", "#k-a2", "#k-a3"].forEach(function (sel, i) {
    var p = document.querySelector(sel);
    var len = Math.ceil(p.getTotalLength()) + 2;
    tl.fromTo(sel, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: IO }, k + 0.55 + i * 1.1);
  });
  inn("#k-n1", k, { y: 20 });
  inn("#k-n2", k + 1.1, { y: 20 });
  inn("#k-n3", k + 2.2, { y: 20 });
  tl.fromTo("#k-runner", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, k + 3.2);
  var loops = Math.max(0, Math.floor((SH.by.kreis.b - (k + 3.2)) / 3.2) - 1);
  tl.fromTo("#k-runner", { rotation: 0, svgOrigin: "960 610" }, { rotation: 360, svgOrigin: "960 610", duration: 3.2, ease: "none", repeat: loops }, k + 3.2);
  inn("#k-q", C.frage_risiko);

  // ---------------------------------------------------------------- 4 · DNQP
  inn("#q-skalen", C.dnqp);
  inn("#q-kein", C.dnqp_kein);
  inn("#q-indiv", C.dnqp_indiv, { x: 30 });

  // ---------------------------------------------------------------- 5 · Risikofaktoren
  inn("#s-risk .hdr", C.drei_arten, { y: -16 });
  inn("#r-c1", C.r_person);
  inn("#r-p1", C.r_p_gang, { fadeOnly: true });
  inn("#r-p2", C.r_p_muskel, { fadeOnly: true });
  inn("#r-p3", C.r_p_sinne, { fadeOnly: true });
  inn("#r-p4", C.r_p_demenz, { fadeOnly: true });
  inn("#r-c2", C.r_med);
  inn("#r-m1", C.r_m_schwindel, { fadeOnly: true });
  inn("#r-m2", C.r_m_wahrn, { fadeOnly: true });
  inn("#r-m3", C.r_m_sedativa, { fadeOnly: true });
  inn("#r-c3", C.r_umg);
  inn("#r-u1", C.r_u_licht, { fadeOnly: true });
  inn("#r-u2", C.r_u_zimmer, { fadeOnly: true });
  inn("#r-umfeld", C.umfeld, { y: -16 });

  // ---------------------------------------------------------------- 6 · Umgebung
  inn("#s-env .glass", C.m_stolper - 0.3, { x: 40 });
  check("#e1", C.m_stolper, C.m_teppich + 0.5);
  check("#e2", C.m_schwellen, C.m_farbig + 0.4);
  check("#e3", C.m_verschuettet, C.m_aufwischen + 0.6);
  check("#e4", C.m_rollstuehle, C.m_feststellen + 0.5);
  check("#e5", C.m_wagen, C.m_wagen + 3.0);
  check("#e6", C.m_betthoehe, C.m_nichtzuhoch);

  // ---------------------------------------------------------------- 7 · Schuhwerk
  inn("#s-sock .glass", C.s_fest - 0.3, { x: 40 });
  inn("#k1", C.s_fest, { x: -20 });
  inn("#k2", C.s_schlappen, { x: -20 });
  inn("#k3", C.s_socken, { x: -20 });
  tl.fromTo("#k3s", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, C.s_gummi);

  // ---------------------------------------------------------------- 8 · Umgebung 2
  inn("#s-env2 .glass", C.m_haltegriffe - 0.2, { x: 40 });
  check("#g1", C.m_haltegriffe, C.m_festigkeit + 0.5);
  check("#g2", C.m_sitz, C.m_sitz + 1.6);
  check("#g3", C.m_nachtlicht, C.m_nachtlicht + 1.0);

  // ---------------------------------------------------------------- 9 · Hüftprotektoren
  inn("#s-hip .glass", C.h_neigung - 0.3, { x: 40 });
  inn("#h1", C.h_neigung, { x: -20 });
  inn("#h2", C.h_polster, { x: -20 });

  // ---------------------------------------------------------------- 10/11 · Medikamente
  inn("#m1", C.med_sedativa);
  inn("#m2", C.med_diuretika);
  inn("#m3", C.med_abfuehr);
  inn("#m4", C.med_eile);
  inn("#s-meds3d .glass", C.med_stuhl - 0.3, { x: 40 });
  check("#t1", C.med_stuhl, C.med_stuhl + 1.8);
  check("#t2", C.med_fest, C.med_fest + 0.6);
  check("#t3", C.med_armlehnen, C.med_armlehnen + 0.8);

  // ---------------------------------------------------------------- 12 · Doku + Merksatz
  inn("#o-doc", C.doku_hz, { x: -30 });
  inn("#o-merk", C.merksatz);
  tl.fromTo("#o-merk .marker", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, C.merk_quote);

  // ---------------------------------------------------------------- 13 · Fallbeispiel
  inn("#c-facts", C.fall_diur - 0.3, { x: -30 });
  inn("#c1", C.fall_diur, { x: -16 });
  inn("#c2", C.fall_gestuerzt, { x: -16 });
  inn("#c3", C.fall_dunkel, { x: -16 });
  inn("#c4", C.fall_kabel, { x: -16 });
  inn("#a-med .lab", C.fall_r_med, { y: 12 });
  inn("#a-med .pin", C.fall_r_med, { fadeOnly: true, dur: 0.3 });
  inn("#a-person .lab", C.fall_r_person, { y: 12 });
  inn("#a-person .pin", C.fall_r_person, { fadeOnly: true, dur: 0.3 });
  inn("#a-umg .lab", C.fall_r_umg, { y: 12 });
  inn("#a-umg .pin", C.fall_r_umg, { fadeOnly: true, dur: 0.3 });
  tl.to("#c-facts", { autoAlpha: 0.55, duration: 0.5 }, C.fall_s_kabel - 0.3);
  out("#a-med, #a-person, #a-umg", C.fall_s_kabel - 0.3);
  inn("#c-sol", C.fall_s_kabel - 0.3, { x: 40 });
  check("#cs1", C.fall_s_kabel, C.fall_s_kabel + 0.9, true);
  check("#cs2", C.fall_s_licht, C.fall_s_licht + 0.9, true);
  check("#cs3", C.fall_s_melden, C.fall_s_melden + 2.0, true);
  check("#cs4", C.fall_s_stuhl, C.fall_s_stuhl + 1.6, true);

  // ---------------------------------------------------------------- 14 · Zusammenfassung
  inn("#z1", C.sum_def);
  inn("#z2", C.sum_risk);
  inn("#z3", C.sum_mass);
  inn("#z3a", C.sum_m_stolper, { x: -16 });
  inn("#z3b", C.sum_m_schuh, { x: -16 });
  inn("#z3c", C.sum_m_hueft, { x: -16 });
  inn("#z3d", C.sum_m_licht, { x: -16 });
  inn("#z3e", C.sum_m_doku, { x: -16 });
  out("#z-cards", C.sum_quote - 0.2, 0.4);
  tl.fromTo("#z-quote", { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power3.out" }, C.sum_quote);

  // ---------------------------------------------------------------- 15 · Outro
  inn("#o-brand", C.outro + 0.2, { y: -20 });
  inn("#o-abo", C.abo);
  inn("#o-kom", C.kommentare);
  inn("#o-next", C.naechste);
  inn("#o-bye", C.bis_bald);

  window.__pwgTimeline = tl;
})();
