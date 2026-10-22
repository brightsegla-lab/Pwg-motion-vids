// ASE (atemstimulierende Einreibung) — the two glowing "hands" on the back outline.
// Pure function of t and the shared breathing model (breath.js), following the SRT / Thieme:
//   Ausatmung: pressure beside the spine, the circle starts outward (lower half of the loop, brighter)
//   Einatmung: pressure released, the circle closes back towards the spine (upper half, dimmer)
// One loop per breath; the loops move down the back row by row (4 rows), then start again.
(function () {
  var C = window.CUES;
  var B = window.BREATH;
  var L = document.getElementById("hand-l");
  var R = document.getElementById("hand-r");
  var EX = document.getElementById("e-ex");
  var IN = document.getElementById("e-in");
  if (!L || !R) return;
  var SPINE = 350, DX = 95, RAD = 52, ROW0 = 230, ROWH = 105, ROWS = 4;
  var clamp = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };

  function place(el, x, y, s, o) {
    el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
    el.style.opacity = o.toFixed(3);
  }

  function render(t) {
    var show = clamp((t - C.s_hands) / 0.6) * (1 - clamp((t - C.s_strich) / 0.6)) * (t < C.ase_why ? 1 : 0);
    if (show <= 0.001) { L.style.opacity = 0; R.style.opacity = 0; }
    else if (t < C.s_kreis) {
      // hands resting on the shoulders
      place(R, SPINE + DX, 168, 1, show);
      place(L, SPINE - DX, 168, 1, show);
    } else {
      var p = B.phase(t);
      var n = Math.floor(t / B.PERIOD) - Math.floor(C.s_kreis / B.PERIOD);
      var row = ((n % ROWS) + ROWS) % ROWS;
      var cy = ROW0 + row * ROWH;
      var ang, press;
      if (p >= 0.4) { // exhale: spine side → down → outside
        var q = (p - 0.4) / 0.6;
        ang = Math.PI - q * Math.PI;
        press = Math.sin(q * Math.PI);
      } else { // inhale: outside → up → back to the spine side, sliding to the next row
        var r = p / 0.4;
        ang = -r * Math.PI;
        press = 0;
        var prevRow = (((n - 1) % ROWS) + ROWS) % ROWS;
        cy = ROW0 + prevRow * ROWH + (row - prevRow) * ROWH * r;
      }
      var x = SPINE + DX + RAD * Math.cos(ang);
      var y = cy + RAD * Math.sin(ang);
      var s = 0.85 + 0.45 * press;
      var o = show * (0.7 + 0.3 * press);
      place(R, x, y, s, o);
      place(L, 2 * SPINE - x, y, s, o);
    }
    // phase pills: the current phase is highlighted
    if (EX && IN) {
      var live = t >= C.s_aus;
      var ex = B.exhaling(t);
      EX.classList.toggle("off", live && !ex);
      IN.classList.toggle("off", live && ex);
    }
  }
  window.addEventListener("hf-seek", function (e) { render(e.detail.time); });
  render(window.__hfThreeTime || 0);
})();
