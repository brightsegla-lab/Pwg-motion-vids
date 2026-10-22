// Pneumonieprophylaxe — the 2D timeline. Every entrance is keyed to a named cue
// (data.js: spoken time − 0.2 s). Scene windows use the "breath" transition (inhale out,
// exhale in); 3D fades, background and the standard verbs come from the kit.
(function () {
  var K = window.PWG.timeline({ transition: "breath" });
  var tl = K.tl, C = K.C, inn = K.inn, out = K.out, check = K.check;

  K.watermark([[C.pneu, C.outro]]);

  // ---------------------------------------------------------------- 0 · intro
  inn("#i-brand", C.welcome, { y: -20 });
  inn("#i-reihe", C.folge);
  inn("#i-title", C.title, { fadeOnly: true, scale: 0.94, dur: 0.9, ease: "power3.out" });
  inn("#i-sub", C.lunge);

  // ---------------------------------------------------------------- 1 · Pneumonie
  inn("#p-card", C.p_def, { x: 30 });
  inn("#p-cause", C.p_bakt, { y: 14 });

  // ---------------------------------------------------------------- 2 · gefährdet + Risikofaktoren
  inn("#g1", C.g_bett, { x: -20 });
  inn("#g2", C.g_alt, { x: -20 });
  inn("#g3", C.g_imm, { x: -20 });
  inn("#rf-lbl", C.rf, { fadeOnly: true });
  ["rf_bett", "rf_alter", "rf_copd", "rf_rauch", "rf_ops", "rf_schluck", "rf_trink"].forEach(function (k, i) {
    inn("#rf" + (i + 1), C[k], { y: 30 });
  });
  inn("#rf5s", C.rf_flach, { x: -12 });

  // ---------------------------------------------------------------- 3 · Atelektase
  inn("#a-card", C.a_def, { x: 30 });
  tl.fromTo("#a-d2", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, C.a_gas);
  inn("#a-clbl", C.a_angeb, { fadeOnly: true });
  inn("#a-c1", C.a_angeb, { x: -16 });
  inn("#a-c2", C.a_op, { x: -16 });
  inn("#a-c3", C.a_bett, { x: -16 });
  inn("#a-c4", C.a_schon, { x: -16 });
  tl.fromTo("#a-pin", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, C.a_luft);
  inn("#a-sleep", C.a_schlaf, { fadeOnly: true });
  out("#a-pin", C.a_zus - 0.4);
  out("#a-card", C.a_zus - 0.4);
  inn("#a-m1", C.a_zus, { y: -16 });
  inn("#a-plus", C.a_zus + 0.4, { fadeOnly: true });
  inn("#a-m2", C.a_zus + 0.6, { y: 16 });
  inn("#a-m3", C.a_aehn);

  // ---------------------------------------------------------------- 4 · Ziele
  inn("#z1", C.z1);
  inn("#z2", C.z2);
  inn("#z3", C.z3);
  inn("#z4", C.z4);
  // secretion: thick drops loosen into fluid ones
  function loosen(sel, at) {
    tl.to(sel + " .drop", { backgroundColor: "#9FE6CC", scaleX: 0.72, scaleY: 1.35, y: 22, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", duration: 1.4, ease: "sine.inOut", stagger: 0.18 }, at);
  }
  loosen("#z2", C.z2 + 0.6);

  // ---------------------------------------------------------------- 5 · Basics
  inn("#pm", C.b_ben, { fadeOnly: true });
  inn("#pm1", C.b_ben + 0.1, { x: -16 });
  inn("#pma", C.b_ben + 0.6, { fadeOnly: true });
  inn("#pm2", C.b_ben + 0.8, { x: -16 });
  inn("#pmb", C.b_ben + 1.3, { fadeOnly: true });
  inn("#pm3", C.b_ben + 1.5, { x: -16 });
  inn("#b-card", C.b_mob - 0.3, { y: 20 });
  check("#b1", C.b_mob, C.b_mob + 1.2);
  out("#pm", C.b_hoch - 0.2, 0.3);
  check("#b2", C.b_hoch, C.b_hoch + 1.1);
  inn("#ph", C.b_hoch, { fadeOnly: true });
  tl.fromTo("#ph-arc", { opacity: 0 }, { opacity: 1, duration: 0.3 }, C.b_hoch + 0.7);
  tl.fromTo("#ph-back", { rotation: 0 }, { rotation: 32, svgOrigin: "270 200", duration: 0.8, ease: "power2.inOut", immediateRender: false }, C.b_hoch + 0.1);
  out("#ph", C.b_trink - 0.2, 0.3);
  check("#b3", C.b_trink, C.b_trink + 1.0);
  inn("#pt", C.b_trink, { fadeOnly: true });
  tl.fromTo("#pt-lvl", { scaleY: 0.12 }, { scaleY: 0.86, duration: 1.3, ease: "power2.out", immediateRender: false }, C.b_trink + 0.1);
  out("#pt", C.b_mund - 0.2, 0.3);
  check("#b4", C.b_mund, C.b_mund + 1.0);
  inn("#pmu", C.b_mund, { fadeOnly: true });
  out("#pmu", C.b_atem - 0.2, 0.3);
  check("#b5", C.b_atem, C.b_atem + 2.0);
  inn("#pd", C.b_atem, { fadeOnly: true });
  inn("#b-spez", C.b_spez);

  // ---------------------------------------------------------------- 6 · ASE Ablauf
  inn("#back", C.ase_t, { fadeOnly: true, scale: 0.97 });
  tl.fromTo("#rings", { opacity: 0 }, { opacity: 1, duration: 0.6 }, C.s_kreis);
  inn("#e-sub", C.ase_m, { x: -16 });
  inn("#e-card", C.s_lotion - 0.3, { y: 20 });
  check("#e1", C.s_lotion, C.s_lotion + 1.6);
  check("#e2", C.s_sitz, C.s_sitz + 2.6);
  check("#e3", C.s_hands, C.s_kreis + 1.2);
  check("#e4", C.s_rhythm, C.s_rhythm + 1.0);
  inn("#e-ex", C.s_aus, { x: -20 });
  inn("#e-in", C.s_ein, { x: -20 });
  inn("#e-5x", C.s_5x, { y: 14 });
  out("#e-5x", C.s_strich - 0.3, 0.3);
  tl.fromTo("#e-stroke", { strokeDasharray: 540, strokeDashoffset: 540, opacity: 1 }, { strokeDashoffset: 0, duration: 1.8, ease: "power1.inOut" }, C.s_strich + 0.2);
  out("#e-phases", C.s_strich - 0.3, 0.3);
  inn("#e-end", C.s_strich, { y: 14 });

  // ---------------------------------------------------------------- 7 · ASE Wirkung
  inn("#w1", C.w_tief);
  inn("#w2", C.w_ruhig);
  inn("#w3", C.w_wahr);
  inn("#w3s", C.w_verw, { fadeOnly: true });
  inn("#w-note", C.w_bewusst);
  inn("#w-hoer", C.w_hoer, { fadeOnly: true });

  // ---------------------------------------------------------------- 8 · SMI + PEP
  inn("#t-smi", C.smi, { x: 30 });
  inn("#smi-pin", C.smi, { fadeOnly: true });
  inn("#t-smi-n", C.smi_name, { fadeOnly: true });
  inn("#t-smi-r", C.smi_ein, { x: -16 });
  out("#smi-pin", C.smi_ein - 0.8, 0.3); // camera closes in on the chamber
  tl.to("#smi-pin", { autoAlpha: 1, duration: 0.4 }, C.pep_name);
  inn("#t-pep", C.pep_name, { x: 30 });
  inn("#pep-pin", C.pep_name, { fadeOnly: true });
  inn("#t-pep-r", C.pep_kugel, { x: -16 });
  inn("#t-pep-s", C.pep_sekret, { x: -16 });
  loosen("#t-pep-s", C.pep_sekret + 0.4);
  ["#t-smi", "#t-pep", "#smi-pin", "#pep-pin"].forEach(function (s) { out(s, C.d_10 - 0.5); });
  inn("#t-dauer", C.d_10, { x: 30 });
  inn("#t-hyper", C.d_hyper, { y: 12 });
  inn("#t-hyper-s", C.d_hyper + 0.6, { fadeOnly: true });

  // ---------------------------------------------------------------- 9 · Blubberflasche
  inn("#bl-card", C.b_pust - 0.1, { x: 30 });
  inn("#bl1", C.b_pust, { x: -16 });
  inn("#bl2", C.b_wid, { x: -16 });
  inn("#bl3", C.b_entf, { x: -16 });
  inn("#bl-simpel", C.b_simpel, { y: 14 });

  // ---------------------------------------------------------------- 10 · Rauchverzicht + Nasenpflege
  inn("#x1", C.x_rauch);
  inn("#x2", C.x_o2);
  inn("#x2s", C.x_luft, { fadeOnly: true });

  // ---------------------------------------------------------------- 11 · Fallbeispiel
  inn("#c-card", C.c_op - 0.4, { x: 30 });
  inn("#cf1", C.c_op, { x: -14 });
  inn("#cf1b", C.c_schmerz, { fadeOnly: true });
  inn("#cf2", C.c_flach, { x: -14 });
  inn("#cf2b", C.c_ben, { fadeOnly: true });
  inn("#cf3", C.c_beweg, { x: -14 });
  inn("#c-risk", C.c_risk, { scale: 0.92, y: 0 });
  out("#c-facts", C.m_schmerz - 0.45, 0.35);
  check("#cm1", C.m_schmerz, C.m_tiefer);
  check("#cm2", C.m_hoch, C.m_hoch + 1.0);
  check("#cm3", C.m_atem, C.m_smi + 0.8);
  check("#cm4", C.m_mob, C.m_frueh + 0.6);
  check("#cm5", C.m_ase, C.m_ruhig);

  // ---------------------------------------------------------------- 12 · Zusammenfassung
  inn("#zs1", C.sum_pneu);
  inn("#zs2", C.sum_atel);
  inn("#zs-link", C.sum_beide, { y: 14 });
  inn("#zs3", C.sum_mass, { x: 30 });
  inn("#zm1", C.sm_mob, { x: -16 });
  inn("#zm2", C.sm_atem, { x: -16 });
  inn("#zm3", C.sm_ase, { x: -16 });
  inn("#zm4", C.sm_trainer, { x: -16 });
  inn("#zm5", C.sm_blub, { x: -16 });
  out("#z-cards", C.sum_quote - 0.3, 0.4);
  inn("#z-quote", C.sum_quote, { fadeOnly: true, scale: 0.96, dur: 0.7, ease: "power3.out" });

  // ---------------------------------------------------------------- 13 · outro
  inn("#o-brand", C.outro + 0.2, { y: -20 });
  inn("#o-abo", C.abo);
  inn("#o-kom", C.kommentare);
  inn("#o-bye", C.bis_bald);

  window.__pwgTimeline = tl;
})();
