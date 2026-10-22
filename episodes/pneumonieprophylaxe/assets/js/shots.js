// Scene windows in absolute audio seconds, derived from the named cues (data.js).
// Shared by the 2D timeline (timeline.js), the 3D world (world3d.js), the orbs and the
// breathing curve, so every layer cuts on the same frame.
//   set  → 3D set (world3d.js RENDER); consecutive shots on the same set run as one camera move
(function () {
  var C = window.CUES;
  var END = 350.04;
  var list = [
    { id: "intro", a: 0, b: C.pneu, set: "lungs" },
    { id: "pneu", a: C.pneu, b: C.gef, set: "lungs" },
    { id: "risk", a: C.gef, b: C.atel },
    { id: "atel", a: C.atel, b: C.ziele, set: "lungs" },
    { id: "ziele", a: C.ziele, b: C.basics },
    { id: "basics", a: C.basics, b: C.ase },
    { id: "ase", a: C.ase, b: C.ase_why },
    { id: "ase2", a: C.ase_why, b: C.geraete },
    { id: "smi", a: C.geraete, b: C.blub, set: "devices" },
    { id: "blub", a: C.blub, b: C.extra, set: "bottle" },
    { id: "extra", a: C.extra, b: C.fall },
    { id: "case", a: C.fall, b: C.summary, set: "bed" },
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
