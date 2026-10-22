// Scene windows in absolute audio seconds, derived from the named cues (data.js).
// Shared by the 2D timeline (timeline.js) and the 3D world (world3d.js) so a cut
// happens on exactly the same frame in both layers.
//   id   → matches <section id="s-ID"> in index.html
//   set  → 3D set rendered under this scene (key in world3d.js RENDER); omit for 2D-only
//   mood → "night" makes intro orb names white (dark 3D shot); default light
// The first shot is the intro (orbs big + centred), the shot with id "outro" is the end card.
(function () {
  var C = window.CUES;
  var END = 350.04;
  var list = [
    { id: "intro", a: 0, b: C.s1, set: "studio" },
    { id: "s1", a: C.s1, b: C.s2 },
    { id: "s2", a: C.s2, b: C.s3, set: "object" },
    { id: "s3", a: C.s3, b: C.summary },
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
