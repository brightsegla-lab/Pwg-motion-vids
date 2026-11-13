// {{TITLE}} — 3D layer. One render function per `set` used in shots.js.
// Build everything from primitives with W.clay(); animate only from t (and named cues).
import { createWorld, P, lerp } from "./clay3d.js";

const C = window.CUES;
const W = createWorld();
const { add, clay, cyl, box, sphere } = W;

/* ================================================================== STUDIO (intro) */
const studio = W.studioScene(0xf1ebde);
const ST = {};
{
  add(studio, cyl(1.2, 0.08, 96), clay(0xdfe9e2), [0, 0.04, 0]);
  const g = new W.THREE.Group();
  studio.add(g);
  ST.g = g;
  // placeholder hero object: replace with the episode's subject
  add(g, sphere(0.42, 48, 32), clay(0x2ecc91), [0, 0.55, 0]);
  add(g, cyl(0.16, 0.5, 40), clay(0xf4c430), [0.85, 0.33, 0.2]);
  add(g, box(0.5, 0.5, 0.5), clay(0xf2e6d0), [-0.85, 0.33, 0.1], [0, 0.5, 0]);
}
function renderStudio(t, shot) {
  ST.g.rotation.y = (t - shot.a) * 0.18;
  const keys = [
    // intro rule: the subject moves off-centre (o: 560 → left) so the big centred
    // orbs and the title never sit on top of it
    { t: 0, p: [0, 2.2, 6.4], l: [0, 1.0, 0] },
    { t: C.title - 0.4, p: [0, 2.0, 5.8], l: [0, 1.15, 0], o: 560, d: 3 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.04);
  W.renderer.render(studio, W.camera);
}

/* ================================================================== OBJECT (example shot) */
const objScene = W.studioScene(0xefe9dc);
const OB = {};
{
  add(objScene, cyl(0.6, 0.06, 64), clay(0xdfe9e2), [0, 0.03, 0]);
  const g = new W.THREE.Group();
  g.position.set(0, 0.7, 0);
  objScene.add(g);
  OB.g = g;
  OB.body = add(g, sphere(0.5, 64, 40), clay(0xeee3cc));
  OB.mark = add(g, sphere(0.12, 32, 24), W.glow(0xd9362b, 0), [0.3, 0.25, 0.32], [0, 0, 0], { cast: false });
}
function renderObject(t, shot) {
  OB.g.rotation.y = -0.4 + Math.sin((t - shot.a) * 0.35) * 0.35;
  // highlight pulses in on its cue
  OB.mark.material.emissiveIntensity = 1.4 * P(t, C.s2_a, 0.8);
  // o: +340 shifts the subject left to make room for the card on the right
  const keys = [
    { t: shot.a, p: [0, 1.2, 3.4], l: [0, 0.7, 0], o: 340 },
    { t: C.s2_a - 0.3, p: [0.5, 1.1, 2.4], l: [0.15, 0.8, 0], o: 340, d: 1.4 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.04);
  W.renderer.render(objScene, W.camera);
}

W.mount({ studio: renderStudio, object: renderObject });
