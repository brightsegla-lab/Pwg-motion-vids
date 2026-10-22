// Pneumonieprophylaxe — the 2D timeline. Every entrance is keyed to a named cue
// (data.js: spoken time − 0.2 s). Scene windows, 3D fades, background and the
// standard verbs come from the kit (pwg-timeline.js).
(function () {
  var K = window.PWG.timeline();
  var tl = K.tl, C = K.C, inn = K.inn, out = K.out, check = K.check;

  // watermark on content scenes (not on the intro or the outro)
  K.watermark([[C.s1, C.outro]]);

  // ---------------------------------------------------------------- intro
  inn("#i-brand", C.welcome, { y: -20 });
  inn("#i-reihe", C.reihe);
  inn("#i-title", C.title, { fadeOnly: true, scale: 0.94, dur: 0.9, ease: "power3.out" });

  // ---------------------------------------------------------------- s1 · definition + list
  inn("#d-def", C.s1_a);
  inn("#d-list", C.s1_b);
  inn("#d-l1", C.s1_l1, { x: -16 });
  inn("#d-l2", C.s1_l2, { x: -16 });
  inn("#d-l3", C.s1_l3, { x: -16 });

  // ---------------------------------------------------------------- s2 · 3D object + card
  inn("#o-card", C.s2 + 0.4, { x: 30 });
  inn("#o-r1", C.s2_a, { x: -16 });

  // ---------------------------------------------------------------- s3 · checklist
  inn("#m-card", C.s3 + 0.2);
  check("#m1", C.s3_a, C.s3_a + 0.9);
  check("#m2", C.s3_b, C.s3_b + 0.9);
  check("#m3", C.s3_c, C.s3_c + 0.9);

  // ---------------------------------------------------------------- summary
  inn("#z1", C.sum_a);
  inn("#z2", C.sum_b);
  out("#z-cards", C.sum_quote - 0.2, 0.4);
  inn("#z-quote", C.sum_quote, { fadeOnly: true, scale: 0.96, dur: 0.7, ease: "power3.out" });

  // ---------------------------------------------------------------- outro
  inn("#o-brand", C.outro + 0.2, { y: -20 });
  inn("#o-abo", C.abo);
  inn("#o-kom", C.kommentare);
  inn("#o-next", C.naechste);
  inn("#o-bye", C.bis_bald);

  window.__pwgTimeline = tl;
})();
