// Thromboseprophylaxe — „Mythos oder Fakt“ — the 2D timeline. Every entrance is keyed to a
// named cue (data.js: spoken time − 0.2 s). Scene windows, 3D fades and background come from the kit.
// Game UI: question card (MYTHOS? / FAKT?), Ben's guess chip, verdict stamp, scoreboard Ben : Nora.
(function () {
  var K = window.PWG.timeline({ transition: "fade" });
  var tl = K.tl, C = K.C, inn = K.inn, out = K.out, check = K.check;

  // watermark only on explanation shots (the game cards keep the top-right free for the stamp)
  K.watermark([[C.willkommen, C.q1], [C.s1, C.q2], [C.s2, C.q3], [C.s3, C.q4], [C.s4, C.q5], [C.s5, C.q6], [C.s6, C.q7], [C.s7, C.outro]]);

  // ---------------------------------------------------------------- game helpers
  // Question card: label + quote + buttons; Ben's guess (+ his words); verdict lights MYTHOS?, stamp slams in.
  function question(n, o) {
    var p = "#q" + n;
    inn(p + "-card", o.card, { y: 30, scale: 0.97, dur: 0.6 });
    inn(p + "-text", o.text, { y: 14 });
    inn(p + "-btns", o.text + 0.5, { y: 14 });
    tl.fromTo([p + "-m", p + "-k"], { scale: 1 }, { scale: 1.04, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, o.text + 1.4);
    var qa = o.quoteAt !== undefined ? o.quoteAt : o.guess;
    inn(p + "-g", Math.min(qa, o.guess), { fadeOnly: true, dur: 0.3 });
    tl.fromTo(p + "-g .chip", { autoAlpha: 0, y: 18, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)", immediateRender: true }, o.guess);
    if (document.querySelector(p + "-g .q")) tl.fromTo(p + "-g .q", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, immediateRender: true }, qa + (qa === o.guess ? 0.4 : 0));
    if (o.pick) tl.to(o.pick === "k" ? p + "-k" : p + "-m", { boxShadow: "0 0 0 8px rgba(244,196,48,.55)", duration: 0.3 }, o.guess + 0.1);
    tl.to(p + "-m .f", { opacity: 1, duration: 0.25 }, o.verdict);
    tl.to(p + "-m", { color: "#fff", duration: 0.25 }, o.verdict);
    tl.to(p + "-k", { opacity: 0.35, duration: 0.3 }, o.verdict);
    tl.fromTo(p + "-st", { autoAlpha: 0, scale: 2.2, rotation: -24 }, { autoAlpha: 1, scale: 1, rotation: -10, duration: 0.32, ease: "power4.in", immediateRender: true }, o.verdict + 0.05);
    tl.to(p + "-st", { scale: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: "sine.out" }, o.verdict + 0.37);
  }
  // Score change: number cross-fades, "+n" floats up under the scoreboard.
  var shown = { b: 0, n: 0 };
  function score(side, idx, plusId, at) {
    var spans = document.querySelectorAll("#n" + side + " span");
    tl.to(spans[shown[side]], { autoAlpha: 0, y: -18, duration: 0.25, ease: "power2.in" }, at);
    tl.fromTo(spans[idx], { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "back.out(2.2)", immediateRender: false }, at + 0.2);
    shown[side] = idx;
    tl.fromTo("#" + plusId, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, at);
    tl.to("#" + plusId, { autoAlpha: 0, y: -16, duration: 0.5, ease: "power2.in" }, at + 1.6);
    tl.to("#score", { scale: 1.07, duration: 0.18, yoyo: true, repeat: 1, ease: "sine.out" }, at + 0.15);
  }

  // ---------------------------------------------------------------- 0 · intro — beat-synced to the jingle
  // Jingle: 117.5 BPM, first beat 0.44 s (onset analysis of the mix). B(k) = time of beat k.
  var B = function (k) { return 0.44 + k * 0.5108; };
  // logo pops on the first beat, the series chip on beat 4
  tl.fromTo("#i-brand", { autoAlpha: 0, scale: 0.6, y: 240 }, { autoAlpha: 1, scale: 1.25, y: 240, duration: 0.45, ease: "back.out(2.4)" }, B(0) - 0.05);
  tl.to("#i-brand", { scale: 1, y: 0, duration: 0.7, ease: "power3.inOut" }, B(2));
  inn("#i-reihe", B(4), { y: -16, scale: 0.9, ease: "back.out(2)" });
  // sunburst + rings pulse on every bar
  tl.fromTo("#i-burst", { autoAlpha: 0, rotation: 0 }, { autoAlpha: 1, rotation: 40, duration: 14, ease: "none", immediateRender: true }, B(0));
  for (var k = 0; k < 28; k += 2) {
    var ring = k % 4 === 0 ? "#i-ring" : "#i-ring2";
    tl.fromTo(ring, { autoAlpha: 0.7, scale: 0.4 }, { autoAlpha: 0, scale: k % 4 === 0 ? 4.2 : 3.0, duration: 0.95, ease: "power2.out", immediateRender: false }, B(k));
  }
  // seven claims slam onto a deck, one per beat
  var off = [[-40, -6], [50, 4], [-70, -3], [30, 6], [-20, -5], [70, 3], [0, -2]];
  for (var i = 0; i < 7; i++) {
    var c = "#ic" + (i + 1), at = B(5 + i);
    tl.fromTo(c, { autoAlpha: 0, scale: 1.45, x: off[i][0] * 4, y: -80, rotation: off[i][1] * 3 },
      { autoAlpha: 1, scale: 1, x: off[i][0], y: (i - 3) * 22, rotation: off[i][1], duration: 0.26, ease: "power3.in", immediateRender: true }, at - 0.2);
    tl.to(c + " .qm", { scale: 1.25, duration: 0.12, yoyo: true, repeat: 1 }, at + 0.06);
    if (i) tl.to("#ic" + i, { filter: "brightness(0.96)", duration: 0.2 }, at);
  }
  tl.to("#i-deck", { x: 6, duration: 0.05, yoyo: true, repeat: 5, ease: "none" }, B(12) - 0.02);
  // MYTHOS? / FAKT? stamps hit the deck
  [["#i-stm", 12, -12], ["#i-stf", 13, 8]].forEach(function (d) {
    tl.fromTo(d[0], { autoAlpha: 0, scale: 2.4, rotation: d[2] * 2.5 }, { autoAlpha: 1, scale: 1, rotation: d[2], duration: 0.24, ease: "power4.in", immediateRender: true }, B(d[1]) - 0.24);
  });
  tl.to(["#i-stm", "#i-stf"], { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1 }, B(14));
  // the deck explodes outward (whoosh), title slams in
  var fly = [[-1300, -500, -50], [1300, -420, 40], [-1250, 380, -35], [1300, 450, 55], [-600, -900, -20], [700, 950, 30], [0, 1100, 15]];
  for (i = 0; i < 7; i++) tl.to("#ic" + (i + 1), { x: fly[i][0], y: fly[i][1], rotation: fly[i][2], autoAlpha: 0, duration: 0.55, ease: "power3.in" }, B(15) - 0.3 + i * 0.015);
  tl.to("#i-stm", { x: -1200, y: 300, rotation: -60, autoAlpha: 0, duration: 0.5, ease: "power3.in" }, B(15) - 0.3);
  tl.to("#i-stf", { x: 1200, y: -300, rotation: 60, autoAlpha: 0, duration: 0.5, ease: "power3.in" }, B(15) - 0.3);
  tl.set("#i-card", { autoAlpha: 1 }, 0);
  tl.fromTo("#i-title", { autoAlpha: 0, scale: 1.9, letterSpacing: "0.12em" }, { autoAlpha: 1, scale: 1, letterSpacing: "-0.02em", duration: 0.32, ease: "power4.in", immediateRender: true }, B(16) - 0.3);
  tl.to("#i-title", { scale: 1.04, duration: 0.1, yoyo: true, repeat: 1 }, B(16) + 0.02);
  tl.fromTo("#i-burst", { scale: 1 }, { scale: 1.25, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.out", immediateRender: false }, B(16));
  inn("#i-sub", B(18) - 0.1, { y: 26, scale: 0.92, ease: "back.out(2)", dur: 0.45 });
  // game-show lights: MYTHOS / FAKT alternate on the beat
  [["#i-bm", 19], ["#i-bk", 20], ["#i-bm", 21], ["#i-bk", 22]].forEach(function (d) {
    tl.to(d[0] + " .f", { opacity: 1, duration: 0.06 }, B(d[1]));
    tl.to(d[0], { color: "#fff", scale: 1.06, duration: 0.06 }, B(d[1]));
    tl.to(d[0] + " .f", { opacity: 0, duration: 0.25 }, B(d[1]) + 0.36);
    tl.to(d[0], { color: d[0] === "#i-bm" ? "#D9362B" : "#1B8F5A", scale: 1, duration: 0.25 }, B(d[1]) + 0.36);
  });
  inn("#i-teaser", B(23) - 0.1, { y: 30, scale: 0.85, ease: "back.out(2.2)", dur: 0.45 });
  // everything clears for the notepad (3D) just before the dialogue starts
  ["#i-card", "#i-teaser", "#i-reihe-w"].forEach(function (s2, j) {
    tl.to(s2, { autoAlpha: 0, y: -40, scale: 0.94, duration: 0.45, ease: "power2.in" }, B(26) + j * 0.06);
  });
  tl.to("#i-burst", { autoAlpha: 0, duration: 1.0 }, B(26));
  inn("#i-half", C.haelfte, { y: 14 });

  // ---------------------------------------------------------------- 1 · Willkommen + rules
  inn("#r-folge", C.willkommen + 0.1);
  inn("#r-thema", C.title, { fadeOnly: true, scale: 0.95, dur: 0.7 });
  inn("#r-vortrag", C.vortrag, { y: 14 });
  tl.fromTo("#r-strike", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power2.out" }, C.vortrag + 1.0);
  out("#r-title", C.spiel - 0.1, 0.4);
  inn("#r-hdr", C.spiel + 0.2, { y: -16 });
  inn("#r1", C.r_satz, { y: 30 });
  inn("#r2", C.r_mf, { y: 30 });
  inn("#r3", C.r_punkt, { y: 30 });
  inn("#r-stake", C.verliere, { y: 24 });
  // scoreboard: in on "Los", stays for the whole game
  tl.set("#scorebox", { autoAlpha: 0 }, 0);
  inn("#scorebox", C.los, { y: -30, dur: 0.6, ease: "back.out(1.6)" });
  out("#scorebox", C.summary - 0.3, 0.5);

  // ---------------------------------------------------------------- Satz 1
  question(1, { card: C.q1, text: C.q1_text, guess: C.q1_ben, pick: "m", verdict: C.q1_ben + 1.0 });
  inn("#s1-sub", C.s1_drei, { x: -16 });
  tl.to("#tri", { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, C.s1_drei + 0.3);
  inn("#tri-l", C.s1_drei + 1.2, { fadeOnly: true });
  inn("#tc1", C.s1_a, { scale: 0.9, y: 10 });
  inn("#tc2", C.s1_b, { scale: 0.9, y: 10 });
  inn("#tc3", C.s1_c, { scale: 0.9, y: 10 });
  inn("#s1-knie", C.s1_knie, { y: 16 });
  ["#trias", "#s1-knie", "#s1-sub"].forEach(function (s) { out(s, C.s1_loest - 0.3, 0.4); });
  inn("#s1-emb", C.s1_loest + 0.2, { x: -24 });
  tl.set("#s1-emb2", { autoAlpha: 0 }, 0);
  inn("#s1-emb2", C.s1_embolie, { scale: 0.85, y: 0, ease: "back.out(2)" });
  inn("#clot-pin", C.s1_loest, { fadeOnly: true });
  out("#clot-pin", C.s1_lunge + 0.8, 0.3);
  score("b", 1, "pb1", C.p_1_0);

  // ---------------------------------------------------------------- Satz 2
  question(2, { card: C.q2, text: C.q2 + 1.0, guess: C.q2_ben_fakt, quoteAt: C.q2_ben, pick: "k", verdict: C.q2_mythos });
  inn("#clock", C.s2, { scale: 0.92, y: 0 });
  inn("#s2-card", C.s2 + 0.2, { x: 30 });
  tl.to("#ring", { strokeDashoffset: 0, duration: 2.0, ease: "power2.inOut" }, C.s2_uhr);
  check("#s2c1", C.s2_uhr, C.s2_nachts);
  tl.fromTo("#moon", { opacity: 0.25 }, { opacity: 1, duration: 0.4, immediateRender: true }, C.s2_nachts);
  tl.to("#moon", { scale: 1.25, svgOrigin: "262 388", duration: 0.25, yoyo: true, repeat: 1 }, C.s2_nachts + 0.1);
  check("#s2c2", C.s2_zwei, C.s2_pflege + 1.6);
  tl.fromTo(["#gap1", "#gap2"], { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.3, immediateRender: true }, C.s2_zwei + 0.4);
  inn("#s2-tip", C.s2_creme, { y: 20 });
  tl.set("#s2-tip2", { autoAlpha: 0 }, 0);
  inn("#s2-tip2", C.s2_probier, { fadeOnly: true });
  score("n", 1, "pn1", C.p_1_1);

  // ---------------------------------------------------------------- Satz 3
  question(3, { card: C.q3, text: C.q3 + 1.0, guess: C.q3_ben, quoteAt: C.s3_aus, pick: "m", verdict: C.q3_ben + 1.0 });
  inn("#pin-len", C.s3_laenge, { fadeOnly: true });
  inn("#pin-wade", C.s3_wade, { fadeOnly: true });
  inn("#pin-ober", C.s3_ober, { fadeOnly: true });
  ["#pin-len", "#pin-wade", "#pin-ober"].forEach(function (s) { out(s, C.s3_bonus - 0.2, 0.3); });
  inn("#s3-card", C.s3_bonus, { x: 30 });
  tl.set(["#s3r1", "#s3r2", "#s3c"], { autoAlpha: 0 }, 0);
  inn("#s3r1", C.s3_abgen, { x: -16 });
  inn("#s3r2", C.s3_diur, { x: -16 });
  inn("#pin-passt", C.s3_passt, { fadeOnly: true });
  out("#pin-passt", C.s3_wechsel + 1.2, 0.3);
  check("#s3c", C.s3_wechsel, C.s3_wechsel + 1.2);
  score("b", 2, "pb2", C.p_3_1);

  // ---------------------------------------------------------------- Satz 4 + Pütter
  question(4, { card: C.q4, text: C.q4 + 1.0, guess: C.q4_ben, pick: "k", verdict: C.q4_mythos });
  inn("#k1", C.s4, { y: 30 });
  inn("#k2", C.s4_avk, { y: 30 });
  inn("#k3", C.s4_pnp, { y: 30 });
  inn("#k4", C.s4_allergie, { y: 30 });
  inn("#k-arzt", C.s4_arzt, { y: 16 });
  score("n", 2, "pn2", C.p_3_2);

  inn("#pu-card", C.pu_kv, { x: 30 });
  tl.set(["#pu1", "#pu2", "#pu4"], { autoAlpha: 0 }, 0);
  inn("#pu1", C.pu_kurz, { x: -16 });
  inn("#pu2", C.pu_druck, { x: -16 });
  tl.fromTo("#pu-bar", { scaleY: 0.1 }, { scaleY: 1, duration: 1.2, ease: "power2.out", immediateRender: false }, C.pu_druck + 0.3);
  check("#pu3", C.pu_halb, C.pu_halb + 2.0);
  inn("#pu4", C.pu_alarm, { scale: 0.92, y: 0 });
  inn("#pin-zeh", C.pu_alarm + 0.4, { fadeOnly: true });
  out("#pin-zeh", C.pu_neu - 0.3, 0.3);
  check("#pu5", C.pu_neu, C.pu_neu + 1.6);

  // ---------------------------------------------------------------- Satz 5
  inn("#q5-pre", C.q5, { y: 14 });
  out("#q5-pre", C.q5_satz - 0.2, 0.3);
  question(5, { card: C.q5_satz, text: C.q5_satz + 1.0, guess: C.q5_ben, quoteAt: C.q5_erst, pick: "k", verdict: C.q5_mythos });
  tl.to("#q5-st", { scale: 1.1, duration: 0.14, yoyo: true, repeat: 3, ease: "sine.inOut" }, C.q5_mythos + 0.6);
  inn("#s5r1", C.s5, { x: -16 });
  tl.set("#s5r2", { autoAlpha: 0 }, 0);
  inn("#s5r2", C.s5_drin, { x: -16 });
  inn("#pin-blase", C.s5_blase, { fadeOnly: true });
  out("#pin-blase", C.s5_dosis + 1.5, 0.3);
  inn("#s5-pruef", C.s5_pruef, { y: 14, scale: 0.9 });

  inn("#body", C.s5b, { fadeOnly: true, scale: 0.97 });
  tl.set(["#zb1", "#zb2", "#zo1", "#zo2"], { opacity: 0 }, 0);
  tl.to(["#zb1", "#zb2"], { opacity: 1, duration: 0.4 }, C.s5b_bauch);
  tl.to(["#zo1", "#zo2"], { opacity: 1, duration: 0.4 }, C.s5b_ober);
  inn("#zl1", C.s5b_bauch, { x: 24 });
  inn("#zl2", C.s5b_ober, { x: 24 });
  score("n", 3, "pn3", C.p_3_3);

  // ---------------------------------------------------------------- Satz 6
  question(6, { card: C.q6, text: C.q6 + 1.0, guess: C.q6_ben, quoteAt: C.q6_grund, pick: "m", verdict: C.q6_richtig });
  inn("#rub", C.s6, { fadeOnly: true });
  tl.fromTo("#rub-arc", { strokeDasharray: 420, strokeDashoffset: 420 }, { strokeDashoffset: 0, duration: 0.9, ease: "power1.inOut", immediateRender: true }, C.s6 + 0.3);
  tl.fromTo("#rub-x", { autoAlpha: 0, scale: 1.4, svgOrigin: "280 250" }, { autoAlpha: 1, scale: 1, svgOrigin: "280 250", duration: 0.3, ease: "power3.in", immediateRender: true }, C.s6 + 1.3);
  inn("#s6-card", C.s6 + 0.6, { x: 30 });
  tl.set(["#s6r1", "#s6r2", "#s6r3", "#s6r4"], { autoAlpha: 0 }, 0);
  inn("#s6r1", C.s6_blut, { x: -16 });
  inn("#s6r2", C.s6_ab, { x: -16 });
  inn("#s6r3", C.s6_allerg, { x: -16 });
  inn("#s6r4", C.s6_roet, { x: -16 });
  inn("#s6-halb", C.s6_halb, { y: 14, scale: 0.9 });
  score("b", 3, "pb3", C.p_45_3);

  // ---------------------------------------------------------------- Satz 7
  question(7, { card: C.q7, text: C.q7_text, guess: C.q7_ben, pick: "m", verdict: C.q7_ben + 1.0 });
  inn("#pin-pumpe", C.s7_pumpe, { fadeOnly: true });
  inn("#pin-blut", C.s7_drueckt, { fadeOnly: true });
  out("#pin-pumpe", C.s7_mob - 0.2, 0.3);
  out("#pin-blut", C.s7_mob - 0.2, 0.3);
  inn("#s7-card", C.s7_mob - 0.2, { x: 30 });
  check("#s7c1", C.s7_mob, C.s7_mob + 1.4);
  check("#s7c2", C.s7_fuss, C.s7_fuss + 1.0);
  check("#s7c3", C.s7_trink, C.s7_trink + 0.9);
  inn("#s7-ers", C.s7_ersetzen, { y: 16 });
  score("b", 4, "pb4", C.p_55_3);

  // ---------------------------------------------------------------- Fallbeispiel
  inn("#c-card", C.c_herr - 0.3, { x: 30 });
  inn("#cf1", C.c_hueft, { x: -14 });
  inn("#cf2", C.c_traegt, { x: -14 });
  inn("#cf3", C.c_morgens, { x: -14 });
  inn("#cf4", C.c_links, { x: -14 });
  inn("#cf5", C.c_warm, { x: -14 });
  inn("#pin-dick", C.c_links + 0.4, { fadeOnly: true });
  inn("#pin-warm", C.c_warm, { fadeOnly: true });
  inn("#pin-weh", C.c_wade, { fadeOnly: true });
  tl.set("#c-badge", { autoAlpha: 0 }, 0);
  inn("#c-badge", C.c_thromb, { scale: 0.9, y: 0, ease: "back.out(2)" });
  ["#pin-dick", "#pin-warm", "#pin-weh"].forEach(function (s) { out(s, C.c_m1 - 0.3, 0.3); });
  out("#c-facts", C.c_m1 - 0.45, 0.35);
  tl.set("#c-meas", { autoAlpha: 0 }, 0);
  inn("#c-meas", C.c_m1 - 0.2, { fadeOnly: true });
  check("#cm1", C.c_m1, C.c_m1 + 1.6);
  check("#cm2", C.c_m2, C.c_m2 + 1.8);
  check("#cm3", C.c_m3, C.c_m3 + 1.2);
  check("#cm4", C.c_m4, C.c_m4 + 1.2);
  check("#cm5", C.c_m5, C.c_m5 + 2.0);
  inn("#c-sehen", C.c_sehen, { y: 16 });
  // Ben wins: gold glow + chip under the scoreboard
  tl.set("#win", { autoAlpha: 0 }, 0);
  tl.fromTo("#score-glow", { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, C.gewonnen);
  inn("#win", C.gewonnen_n, { y: -12, scale: 0.9, ease: "back.out(2)" });

  // ---------------------------------------------------------------- Zusammenfassung
  inn("#zs1", C.sum_vir, { y: 30 });
  inn("#z11", C.sum_vir + 0.8, { x: -14 });
  inn("#z12", C.sum_vir + 2.4, { x: -14 });
  inn("#z13", C.sum_vir + 3.8, { x: -14 });
  inn("#zs2", C.sum_mts, { y: 30 });
  inn("#z21", C.sm_mess, { x: -14 });
  inn("#z22", C.sm_uhr, { x: -14 });
  inn("#z23", C.sm_kontra, { x: -14 });
  inn("#z24", C.sm_puetter, { x: -14 });
  inn("#zs3", C.sum_hep, { y: 30 });
  inn("#z31", C.sum_hep + 0.6, { x: -14 });
  inn("#z32", C.sh_blase, { x: -14 });
  inn("#z33", C.sh_reib, { x: -14 });
  out("#z-cards", C.sum_beweg - 0.3, 0.4);
  inn("#z-quote", C.sum_beweg, { fadeOnly: true, scale: 0.96, dur: 0.7, ease: "power3.out" });

  // ---------------------------------------------------------------- outro
  inn("#o-brand", C.outro + 0.2, { y: -20 });
  inn("#o-abo", C.abo);
  inn("#o-kom", C.kommentare);
  inn("#o-bye", C.bis_bald);

  window.__pwgTimeline = tl;
})();
