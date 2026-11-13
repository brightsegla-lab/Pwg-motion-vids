// Scene windows in absolute audio seconds, derived from the named cues (data.js).
// Shared by the 2D timeline, the 3D world and the orbs, so every layer cuts on the same frame.
// Game format: every myth = a question shot (qN, 2D game card) + an explanation shot (sN).
// Each qN+sN pair is self-contained so it can later be cut into a 9:16 Short.
//   set → 3D set (world3d.js); consecutive shots on the same set run as one camera move
(function () {
  var C = window.CUES;
  var END = 528.05;
  var list = [
    { id: "intro", a: 0, b: C.willkommen, set: "pad" },
    { id: "rules", a: C.willkommen, b: C.q1 },
    { id: "q1", a: C.q1, b: C.s1, myth: 1 },
    { id: "s1", a: C.s1, b: C.q2, set: "vessel", myth: 1 },
    { id: "q2", a: C.q2, b: C.s2, myth: 2 },
    { id: "s2", a: C.s2, b: C.q3, myth: 2 },
    { id: "q3", a: C.q3, b: C.s3, myth: 3 },
    { id: "s3", a: C.s3, b: C.q4, set: "leg", myth: 3 },
    { id: "q4", a: C.q4, b: C.s4, myth: 4 },
    { id: "s4", a: C.s4, b: C.puetter, myth: 4 },
    { id: "puetter", a: C.puetter, b: C.q5, set: "leg" },
    { id: "q5", a: C.q5, b: C.s5, myth: 5 },
    { id: "s5", a: C.s5, b: C.s5b, set: "syringe", myth: 5 },
    { id: "s5b", a: C.s5b, b: C.q6, myth: 5 },
    { id: "q6", a: C.q6, b: C.s6, myth: 6 },
    { id: "s6", a: C.s6, b: C.q7, myth: 6 },
    { id: "q7", a: C.q7, b: C.s7, myth: 7 },
    { id: "s7", a: C.s7, b: C.case, set: "leg", myth: 7 },
    { id: "case", a: C.case, b: C.summary, set: "leg" },
    { id: "sum", a: C.summary, b: C.outro },
    { id: "outro", a: C.outro, b: END },
  ];
  var by = {};
  list.forEach(function (s) { by[s.id] = s; });
  window.SHOTS = { list: list, by: by, END: END };
  window.SHOTS.at = function (t) {
    var cur = list[0];
    for (var i = 0; i < list.length; i++) if (t >= list[i].a) cur = list[i];
    return cur;
  };
})();
