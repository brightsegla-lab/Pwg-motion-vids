// Scene windows in absolute audio seconds, derived from the named cues (data.js).
// Shared by the 2D timeline (timeline.js) and the 3D world (world3d.js) so a cut
// happens on exactly the same frame in both layers.
(function () {
  var C = window.CUES;
  var END = 348.55;
  var list = [
    { id: "intro", a: 0, b: C.frage_sturz, set: "room", mood: "night" },
    { id: "def", a: C.frage_sturz, b: C.folgen },
    { id: "folgen", a: C.folgen, b: C.kreis, set: "femur" },
    { id: "kreis", a: C.kreis, b: C.dnqp },
    { id: "dnqp", a: C.dnqp, b: C.konkret },
    { id: "risk", a: C.konkret, b: C.massnahmen_intro, set: "plinths" },
    { id: "env", a: C.massnahmen_intro, b: C.schuhwerk, set: "room", mood: "day" },
    { id: "sock", a: C.schuhwerk, b: C.m_haltegriffe, set: "sock" },
    { id: "env2", a: C.m_haltegriffe, b: C.hueft, set: "room", mood: "day" },
    { id: "hip", a: C.hueft, b: C.meds, set: "pad" },
    { id: "meds", a: C.meds, b: C.med_stuhl - 1.0 },
    { id: "meds3d", a: C.med_stuhl - 1.0, b: C.doku, set: "room", mood: "day" },
    { id: "doku", a: C.doku, b: C.fall },
    { id: "case", a: C.fall, b: C.summary, set: "room", mood: "night" },
    { id: "sum", a: C.summary, b: C.outro },
    { id: "outro", a: C.outro, b: END },
  ];
  var by = {};
  list.forEach(function (s) { by[s.id] = s; });
  window.SHOTS = { list: list, by: by, END: END };
  // Shot active at time t (last one whose start <= t).
  window.SHOTS.at = function (t) {
    var cur = list[0];
    for (var i = 0; i < list.length; i++) if (t >= list[i].a) cur = list[i];
    return cur;
  };
})();
