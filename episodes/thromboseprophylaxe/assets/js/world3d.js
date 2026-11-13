// Thromboseprophylaxe — 3D layer (clay, primitives only, no external models).
// Every motion is a pure function of t (and the cues in data.js).
//   pad     — intro: Nora's notepad ("als wär's ein Lottoschein"); half of the lines turn red ("Die Hälfte … stimmt nicht")
//   vessel  — Satz 1: vein with flowing blood cells; slower flow, damaged wall, clot; clot detaches → lung (Lungenembolie)
//   leg     — Satz 3 (measuring, Diuretika: leg slims under the stocking), Pütter (bandage, pressure gradient,
//             blue toes alarm), Satz 7 (cutaway: calf muscle pump pushes blood up), Fallbeispiel (left leg thicker, warm, calf pain)
//   syringe — Satz 5: prefilled syringe; the air bubble stays in and pushes the whole dose out
import { createWorld, P, lerp, clamp } from "./clay3d.js";

const C = window.CUES;
const W = createWorld();
const { THREE, add, clay, cyl, box, sphere, tube } = W;
const hash = (i) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const frac = (x) => x - Math.floor(x);
const win = (t, a, b, d = 0.5) => P(t, a, d) * (1 - P(t, b - d, d)); // 0→1→0 inside [a, b]
const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), e3 = new THREE.Euler();
const el = (id) => document.getElementById(id);

/* ================================================================== PAD (intro) */
const padScene = W.studioScene(0xf1ebde);
const PD = { lines: [] };
{
  PD.ped = add(padScene, cyl(1.0, 0.06, 96), clay(0xdfe9e2), [0, 0.03, 0]);
  const g = new THREE.Group();
  padScene.add(g);
  PD.g = g;
  add(g, box(1.3, 0.08, 1.7), clay(0xfbf7ee), [0, 0, 0]);
  add(g, box(1.3, 0.02, 1.7), clay(0xe4ddcf), [0, -0.05, 0]);
  for (let i = 0; i < 9; i++) add(g, new THREE.TorusGeometry(0.05, 0.012, 8, 24), clay(0x9aa5a0), [-0.52 + i * 0.13, 0.04, -0.85], [0, Math.PI / 2, 0]);
  for (let i = 0; i < 7; i++) {
    const len = 0.7 + hash(i + 4) * 0.35;
    const m = add(g, box(len, 0.012, 0.05), new THREE.MeshStandardMaterial({ color: 0x5f6e66, roughness: 0.9 }), [-0.5 + len / 2, 0.047, -0.55 + i * 0.19], [0, 0, 0], { cast: false });
    m.userData.len = len;
    PD.lines.push(m);
  }
  // red strikes over every second line ("Die Hälfte davon stimmt nicht")
  PD.strikes = [1, 3, 5].map((i) => {
    const L = PD.lines[i];
    const s = add(g, box(L.userData.len + 0.1, 0.016, 0.03), clay(0xd9362b), [L.position.x, 0.058, L.position.z], [0, 0.05, 0], { cast: false });
    s.userData.x0 = L.position.x - (L.userData.len + 0.1) / 2;
    s.userData.len = L.userData.len + 0.1;
    return s;
  });
  // pencil
  const pen = new THREE.Group();
  pen.position.set(0.78, 0.12, 0.1);
  pen.rotation.set(0, -0.5, Math.PI / 2);
  g.add(pen);
  add(pen, cyl(0.045, 1.0, 6), clay(0xf4c430), [0, 0, 0]);
  add(pen, new THREE.ConeGeometry(0.045, 0.14, 6), clay(0xe9d3b0), [0, -0.57, 0], [Math.PI, 0, 0]);
  add(pen, new THREE.ConeGeometry(0.014, 0.04, 6), clay(0x333333), [0, -0.64, 0], [Math.PI, 0, 0]);
  add(pen, cyl(0.047, 0.1, 12), clay(0xe28aa0), [0, 0.53, 0]);
}
const RED = new THREE.Color(0xd9362b), GREYL = new THREE.Color(0x5f6e66);
function renderPad(t) {
  const show = P(t, C.zettel - 1.4, 1.0);
  PD.g.visible = show > 0.002;
  PD.ped.visible = PD.g.visible;
  PD.ped.scale.setScalar(Math.max(0.001, show));
  PD.g.scale.setScalar(0.6 + 0.4 * show);
  PD.g.position.set(0, 0.7 + 0.05 * Math.sin(t * 1.1), 0);
  PD.g.rotation.set(0.95 + 0.04 * Math.sin(t * 0.7), 0.25 * Math.sin(t * 0.25), 0.05 * Math.sin(t * 0.9));
  const half = P(t, C.haelfte + 0.3, 0.8);
  PD.lines.forEach((m, i) => m.material.color.copy(GREYL).lerp(RED, i % 2 === 1 ? half * 0.6 : 0));
  PD.strikes.forEach((s, k) => {
    const g = clamp(half * 1.6 - k * 0.3);
    s.visible = g > 0.01;
    s.scale.x = Math.max(0.001, g);
    s.position.x = s.userData.x0 + (s.userData.len * g) / 2;
  });
  const keys = [
    { t: 0, p: [0, 2.0, 5.8], l: [0, 0.45, 0], o: 0 },
    { t: C.haelfte - 0.5, p: [0, 2.3, 5.1], l: [0, 0.35, 0], o: 0, d: 2.5 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.04);
  W.renderer.render(padScene, W.camera);
}

/* ================================================================== VESSEL (Satz 1) */
const vesScene = W.studioScene(0xf1ebde);
const V = {};
{
  V.curve = new THREE.CatmullRomCurve3([[-3.4, 0.9, 0], [-1.2, 0.9, 0], [1.2, 0.92, 0], [3.0, 1.02, 0], [4.4, 1.4, 0], [5.45, 1.88, 0]].map((p) => new THREE.Vector3(...p)));
  V.wall = add(vesScene, new THREE.TubeGeometry(V.curve, 200, 0.3, 32, false), new THREE.MeshStandardMaterial({ color: 0xe9a3a0, roughness: 0.5, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }), [0, 0, 0], [0, 0, 0], { cast: false });
  add(vesScene, new THREE.TubeGeometry(V.curve, 200, 0.302, 32, false), new THREE.MeshStandardMaterial({ color: 0xd98a86, roughness: 0.6, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.BackSide }), [0, 0, 0], [0, 0, 0], { cast: false });
  V.N = 90;
  V.cells = new THREE.InstancedMesh(sphere(1, 20, 12), clay(0xc8323a, { roughness: 0.6 }), V.N);
  V.cells.castShadow = false;
  vesScene.add(V.cells);
  // damaged wall: rough dark patch on the upper inner wall
  V.U0 = 0.36;
  const p0 = V.curve.getPointAt(V.U0);
  V.damage = new THREE.InstancedMesh(sphere(1, 12, 8), clay(0x8e3b3b), 14);
  V.damage.castShadow = false;
  vesScene.add(V.damage);
  V.dmg = [];
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * 0.5 + (hash(i + 20) - 0.5) * 1.2;
    V.dmg.push({ x: p0.x + (hash(i + 30) - 0.5) * 0.45, y: p0.y + Math.sin(a) * 0.29, z: Math.cos(a) * 0.29, s: 0.03 + hash(i + 40) * 0.035 });
  }
  // clot: a lumpy dark-red cluster growing on the damaged wall
  V.clot = new THREE.Group();
  vesScene.add(V.clot);
  const cm = clay(0x7a1e24, { roughness: 0.85 });
  [[0, 0, 0, 0.13], [0.11, 0.03, 0.04, 0.1], [-0.1, 0.02, -0.03, 0.1], [0.04, -0.06, 0.06, 0.09], [-0.03, 0.07, 0.05, 0.08]].forEach((d) => add(V.clot, sphere(d[3], 20, 14), cm, [d[0], d[1], d[2]]));
  // lungs at the end of the path
  V.lungs = new THREE.Group();
  vesScene.add(V.lungs);
  const lm = () => new THREE.MeshStandardMaterial({ color: 0xf0a99c, roughness: 0.78, emissive: 0xf08a7a, emissiveIntensity: 0.06 });
  V.lungL = add(V.lungs, sphere(1, 48, 32), lm(), [5.85, 2.05, 0]);
  V.lungL.scale.set(0.5, 0.72, 0.38);
  V.lungR = add(V.lungs, sphere(1, 48, 32), lm(), [6.95, 2.05, 0]);
  V.lungR.scale.set(0.52, 0.76, 0.38);
  add(V.lungs, cyl(0.07, 0.7, 24), clay(0xf3ece0), [6.4, 3.0, 0]);
  add(V.lungs, tube([[6.4, 2.68, 0], [6.2, 2.5, 0], [6.0, 2.35, 0.05]], 0.045), clay(0xf3ece0));
  add(V.lungs, tube([[6.4, 2.68, 0], [6.6, 2.5, 0], [6.8, 2.35, 0.05]], 0.045), clay(0xf3ece0));
  // embolism: blocked area of the lung turns grey-blue
  V.blocked = add(V.lungs, sphere(1, 32, 24), new THREE.MeshStandardMaterial({ color: 0x8c8fa8, roughness: 0.9, transparent: true, opacity: 0 }), [5.75, 1.82, 0.1], [0, 0, 0], { cast: false });
  V.blocked.scale.set(0.33, 0.3, 0.3);
  V.ped = add(vesScene, cyl(1.4, 0.05, 96), clay(0xdfe9e2), [6.4, 0.03, 0]);
}
// flow position: normal speed, then slower from "Erstens: Das Blut fließt langsamer"
function flowPos(t) {
  const v0 = 0.05, v1 = 0.016, a = C.s1_a + 0.4;
  if (t < a) return v0 * t;
  const d = t - a;
  return v0 * a + v0 * d - (v0 - v1) * (d < 1 ? (d * d) / 2 : d - 0.5);
}
const CLOT_END = 0.985;
function clotU(t) {
  return lerp(V.U0, CLOT_END, P(t, C.s1_loest + 0.2, C.s1_lunge + 1.2 - C.s1_loest));
}
function renderVessel(t, shot) {
  const fp = flowPos(t);
  const tan = new THREE.Vector3();
  for (let i = 0; i < V.N; i++) {
    const u = frac(hash(i) + fp * (0.8 + 0.4 * hash(i + 7)));
    const p = V.curve.getPointAt(u);
    V.curve.getTangentAt(u, tan);
    const r = 0.2 * Math.sqrt(hash(i + 3)), a = hash(i + 5) * Math.PI * 2;
    v3.set(p.x, p.y + Math.cos(a) * r, p.z + Math.sin(a) * r);
    e3.set(hash(i + 11) * 3 + t * 0.6 * (hash(i + 2) - 0.5), hash(i + 12) * 3, hash(i + 13) * 3);
    q.setFromEuler(e3);
    // cells pile up a little behind the clot while it sits in the vessel
    const sc = 0.065;
    V.cells.setMatrixAt(i, mtx.compose(v3, q, s3.set(sc, sc, sc * 0.4)));
  }
  V.cells.instanceMatrix.needsUpdate = true;
  const dmg = P(t, C.s1_b + 0.3, 1.2);
  V.dmg.forEach((d, i) => {
    const s = d.s * clamp(dmg * 1.4 - (i / 14) * 0.4);
    V.damage.setMatrixAt(i, mtx.compose(v3.set(d.x, d.y, d.z), q.identity(), s3.set(s + 1e-4, s * 0.6 + 1e-4, s + 1e-4)));
  });
  V.damage.instanceMatrix.needsUpdate = true;
  // clot grows on the wall ("Gerinnung verändert"), detaches ("Gerinnsel löst") and travels to the lung
  const grow = P(t, C.s1_c + 0.3, 2.0);
  V.clot.visible = grow > 0.01;
  const u = clotU(t);
  const cp = V.curve.getPointAt(Math.min(u, 0.999));
  const onWall = 1 - P(t, C.s1_loest, 0.6);
  V.clot.position.set(cp.x, cp.y + 0.17 * onWall, cp.z);
  V.clot.scale.setScalar(Math.max(0.001, grow) * (1 - 0.15 * (1 - onWall)));
  V.clot.rotation.set(t * 0.4 * (1 - onWall), t * 0.9 * (1 - onWall), 0);
  // embolism
  const emb = P(t, C.s1_embolie, 1.0);
  V.blocked.material.opacity = 0.85 * emb;
  const pulse = emb * (0.5 + 0.5 * Math.sin((t - C.s1_embolie) * 5));
  V.lungL.material.emissive.setHex(0xd9362b);
  V.lungL.material.emissiveIntensity = 0.06 + 0.25 * pulse;
  const keys = [
    { t: shot.a, p: [0.4, 1.7, 5.2], l: [0.4, 0.9, 0], o: -380 },
    { t: C.s1_b, p: [0.9, 1.45, 3.4], l: [0.9, 0.95, 0], o: -380, d: 2.0 },
    { t: C.s1_knie, p: [0.9, 1.6, 4.4], l: [0.9, 0.95, 0], o: -380, d: 1.6 },
    { t: C.s1_loest + 0.3, p: [3.6, 2.0, 5.6], l: [3.6, 1.3, 0], o: -380, d: 1.6 },
    { t: C.s1_lunge + 0.2, p: [6.2, 2.4, 5.4], l: [6.3, 1.95, 0], o: -380, d: 1.8 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.03);
  W.pin(el("clot-pin"), [V.clot.position.x - 0.1, V.clot.position.y + 0.12, 0.2]);
  W.renderer.render(vesScene, W.camera);
}

/* ================================================================== LEG */
const legScene = W.studioScene(0xf1ebde);
const LG = {};
// leg profile: [radius, height]
const PROF = [[0.001, 0.12], [0.07, 0.13], [0.082, 0.2], [0.1, 0.33], [0.135, 0.5], [0.158, 0.64], [0.15, 0.78], [0.128, 0.93], [0.118, 1.03], [0.126, 1.12], [0.152, 1.3], [0.188, 1.52], [0.218, 1.75], [0.232, 1.95], [0.001, 2.0]];
function profR(y) {
  for (let i = 1; i < PROF.length; i++) if (y <= PROF[i][1]) {
    const a = PROF[i - 1], b = PROF[i];
    return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1]));
  }
  return 0.23;
}
function latheFrom(prof, k = 1, y0 = -1, y1 = 9) {
  const sp = new THREE.SplineCurve(prof.filter((p) => p[1] >= y0 && p[1] <= y1).map((p) => new THREE.Vector2(p[0] * k, p[1])));
  return new THREE.LatheGeometry(sp.getPoints(80), 64);
}
function buildLeg(parent, skinHex) {
  const g = new THREE.Group();
  parent.add(g);
  const skin = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.85, transparent: true, opacity: 1, emissive: 0xff6a2b, emissiveIntensity: 0 });
  const leg = add(g, latheFrom(PROF), skin);
  const foot = add(g, new THREE.CapsuleGeometry(0.075, 0.26, 8, 24), skin, [0, 0.1, 0.1], [Math.PI / 2, 0, 0]);
  foot.scale.set(1.15, 1, 0.75);
  const toeMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.85, transparent: true });
  const toes = [];
  for (let i = 0; i < 5; i++) toes.push(add(g, sphere(0.026 - i * 0.002, 16, 12), toeMat, [0.055 - i * 0.027, 0.07, 0.33 - i * 0.012]));
  return { g, leg, foot, skin, toes, toeMat };
}
{
  LG.ped = add(legScene, cyl(0.85, 0.06, 96), clay(0xdfe9e2), [0, 0.03, 0]);
  LG.a = buildLeg(legScene, 0xf2c9a9); // the main leg (Herr K.'s left leg in the case)
  LG.b = buildLeg(legScene, 0xf2c9a9); // second leg, only in the case
  LG.a.g.position.y = LG.b.g.position.y = 0.06;
  // measuring tape (Satz 3)
  const gold = clay(0xf4c430);
  LG.len = add(legScene, tube([[0.3, 0.08, 0.05], [0.3, 1.0, 0.05], [0.3, 2.04, 0.05]], 0.012, false, 60), gold, [0, 0, 0], [0, 0, 0], { cast: false });
  LG.ringW = add(legScene, new THREE.TorusGeometry(0.17, 0.012, 10, 64), gold, [0, 0.7, 0], [Math.PI / 2, 0, 0]);
  LG.ringO = add(legScene, new THREE.TorusGeometry(0.24, 0.012, 10, 64), gold, [0, 1.81, 0], [Math.PI / 2, 0, 0]);
  // stocking (Satz 3 + case)
  const stockMat = () => new THREE.MeshStandardMaterial({ color: 0x8fd9c4, roughness: 0.6, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  LG.stockA = add(LG.a.g, latheFrom(PROF.slice(1, -2), 1.05, 0.12, 1.8), stockMat(), [0, 0, 0], [0, 0, 0], { cast: false });
  LG.stockB = add(LG.b.g, latheFrom(PROF.slice(1, -2), 1.05, 0.12, 1.8), stockMat(), [0, 0, 0], [0, 0, 0], { cast: false });
  // Pütter bandage: overlapping tilted turns from the foot up to the knee
  LG.bands = [];
  for (let i = 0; i < 11; i++) {
    const y = 0.16 + i * 0.085;
    const r = profR(y) + 0.022;
    const m = add(LG.a.g, new THREE.TorusGeometry(r, 0.032, 10, 64), new THREE.MeshStandardMaterial({ color: 0xeee3cc, roughness: 0.95 }), [0, y + 0.06, 0], [Math.PI / 2 + (i % 2 ? 0.28 : -0.28), 0, 0]);
    m.scale.set(1, 1, 1.6);
    LG.bands.push(m);
  }
  // calf muscle pump (Satz 7): muscle, vein with valves, blood particles
  LG.pump = new THREE.Group();
  LG.a.g.add(LG.pump);
  LG.muscle = add(LG.pump, sphere(1, 40, 28), clay(0xd2584f, { roughness: 0.7 }), [0, 0.6, -0.05]);
  LG.vein = add(LG.pump, tube([[0.05, 0.14, 0.04], [0.06, 0.6, 0.06], [0.05, 1.08, 0.04]], 0.032, false, 60), new THREE.MeshStandardMaterial({ color: 0x5a6fd0, roughness: 0.5, transparent: true, opacity: 0.55, depthWrite: false }), [0, 0, 0], [0, 0, 0], { cast: false });
  for (let i = 0; i < 3; i++) add(LG.pump, cyl(0.03, 0.01, 16), clay(0xe8ecff), [0.055, 0.35 + i * 0.25, 0.05]);
  LG.flow = new THREE.InstancedMesh(sphere(1, 12, 8), clay(0xc8323a), 16);
  LG.flow.castShadow = false;
  LG.pump.add(LG.flow);
  // case: calf pain halo
  LG.pain = add(LG.a.g, sphere(1, 32, 24), new THREE.MeshStandardMaterial({ color: 0xd9362b, emissive: 0xd9362b, emissiveIntensity: 0.6, transparent: true, opacity: 0, depthWrite: false }), [0, 0.62, -0.08], [0, 0, 0], { cast: false });
  LG.pain.scale.set(0.2, 0.22, 0.2);
}
const BAND0 = new THREE.Color(0xeee3cc), DEEP = new THREE.Color(0x0f5c3a), PALE = new THREE.Color(0xd8f5e8);
const SKIN = new THREE.Color(0xf2c9a9), BLUE = new THREE.Color(0x5a6fd0);
function renderLeg(t, shot) {
  const id = shot.id;
  const inS3 = id === "s3", inPu = id === "puetter", inS7 = id === "s7", inCase = id === "case";
  // ---- Satz 3: measuring, slimming under the stocking (Diuretika), re-measuring
  const slim = inS3 ? 0.17 * P(t, C.s3_schmal, 1.6) : 0;
  W.drawRange(LG.len, inS3 ? P(t, C.s3_laenge, 1.2) * (1 - P(t, C.s3_bonus - 0.3, 0.4)) : 0);
  const rw = inS3 ? Math.max(P(t, C.s3_wade, 0.6) * (1 - P(t, C.s3_bonus - 0.3, 0.4)), P(t, C.s3_wechsel + 0.3, 0.6)) : 0;
  LG.ringW.visible = rw > 0.01;
  LG.ringW.scale.setScalar(Math.max(0.001, rw) * (1 - slim * P(t, C.s3_wechsel, 0.1)));
  const ro = inS3 ? P(t, C.s3_ober, 0.6) * (1 - P(t, C.s3_bonus - 0.3, 0.4)) : 0;
  LG.ringO.visible = ro > 0.01;
  LG.ringO.scale.setScalar(Math.max(0.001, ro));
  // ---- case: two legs, stockings come off in the morning; left leg thicker, warm, calf pain
  const two = inCase ? P(t, C.case, 1.2) : 0;
  LG.a.g.position.x = 0.23 * two;
  LG.b.g.position.x = -0.23 * two;
  LG.b.g.visible = two > 0.01;
  LG.b.g.scale.setScalar(Math.max(0.001, two));
  const thick = inCase ? 0.16 * P(t, C.c_links, 1.4) : 0;
  const k = 1 - slim + thick;
  LG.a.leg.scale.set(k, 1, k);
  LG.a.foot.scale.set(1.15 * (1 + thick * 0.4), 1, 0.75 * (1 + thick * 0.4));
  LG.a.skin.emissiveIntensity = inCase ? 0.32 * P(t, C.c_warm, 1.0) : 0;
  const pain = inCase ? P(t, C.c_wade, 0.6) * (1 - P(t, C.c_m1 - 0.3, 0.5)) : 0;
  LG.pain.material.opacity = pain * (0.22 + 0.16 * Math.sin((t - C.c_wade) * 6));
  LG.pain.scale.set(0.2 * (1 + thick), 0.22, 0.2 * (1 + thick));
  // stockings: Satz 3 (from "verliert Wasser"), case (on until "morgens … aus")
  const stS3 = inS3 ? P(t, C.s3_wasser, 0.8) : 0;
  const stCase = inCase ? 1 - P(t, C.c_morgens + 1.0, 1.2) : 0;
  const st = Math.max(stS3, stCase);
  LG.stockA.visible = st > 0.01;
  LG.stockA.material.opacity = 0.55 * st;
  LG.stockA.position.y = inCase ? -0.25 * P(t, C.c_morgens + 1.0, 1.2) : 0;
  LG.stockA.scale.set(1 + thick, 1, 1 + thick);
  LG.stockB.visible = inCase && stCase > 0.01;
  LG.stockB.material.opacity = 0.55 * stCase;
  LG.stockB.position.y = LG.stockA.position.y;
  // ---- Pütter: bandage turns wrap in, then show the pressure gradient (firm below, looser above)
  const grad = inPu ? P(t, C.pu_druck + 0.2, 1.2) : 0;
  LG.bands.forEach((b, i) => {
    const s = inPu ? P(t, C.pu_kv + 0.35 + i * 0.28, 0.45) : 0;
    b.visible = s > 0.01;
    b.scale.set(Math.max(0.001, s), Math.max(0.001, s), 1.6 * Math.max(0.001, s));
    b.material.color.copy(BAND0).lerp(DEEP.clone().lerp(PALE, i / 10), grad);
  });
  const blue = inPu ? P(t, C.pu_alarm + 0.3, 0.6) * (1 - P(t, C.pu_neu - 0.6, 0.6)) : 0;
  LG.a.toeMat.color.copy(SKIN).lerp(BLUE, blue);
  // ---- Satz 7: cutaway, calf muscle contracts and pushes the blood up through the valves
  const cut = inS7 ? P(t, shot.a + 0.3, 1.0) * (1 - P(t, shot.b - 0.9, 0.8)) : 0;
  LG.a.skin.opacity = 1 - 0.68 * cut;
  LG.a.skin.depthWrite = cut < 0.05;
  LG.pump.visible = cut > 0.01;
  const on = inS7 ? P(t, C.s7_pumpe, 0.6) : 0;
  const ph = Math.max(0, t - C.s7_pumpe) / 1.6;
  const c = on * (0.5 - 0.5 * Math.cos(ph * Math.PI * 2));
  LG.muscle.scale.set(0.095 * (1 + 0.3 * c), 0.2 * (1 - 0.1 * c), 0.085 * (1 + 0.3 * c));
  const flow = on * 0.22 * (Math.floor(ph) + clamp(frac(ph) * 2));
  for (let i = 0; i < 16; i++) {
    const u = frac(hash(i + 50) + flow);
    const s = 0.018 * cut;
    LG.flow.setMatrixAt(i, mtx.compose(v3.set(0.055, 0.16 + u * 0.9, 0.05), q.identity(), s3.set(s, s, s)));
  }
  LG.flow.instanceMatrix.needsUpdate = true;
  // ---- camera per shot
  let keys;
  if (inS3) keys = [
    { t: shot.a, p: [2.1, 1.6, 5.9], l: [0.05, 1.02, 0], o: 360 },
    { t: C.s3_wade - 0.3, p: [1.7, 1.1, 4.3], l: [0.05, 0.8, 0], o: 360, d: 1.6 },
    { t: C.s3_ober - 0.2, p: [2.1, 1.6, 5.9], l: [0.05, 1.02, 0], o: 360, d: 1.4 },
    { t: C.s3_bonus, p: [2.1, 1.6, 5.9], l: [0.05, 1.02, 0], o: 360, d: 1.6 },
    { t: C.s3_schmal - 0.4, p: [1.7, 1.15, 4.4], l: [0.05, 0.8, 0], o: 360, d: 1.8 },
  ];
  else if (inPu) keys = [
    { t: shot.a, p: [2.1, 1.6, 5.9], l: [0.05, 1.02, 0], o: 360 },
    { t: C.pu_kv, p: [1.8, 1.15, 4.3], l: [0, 0.68, 0.05], o: 360, d: 1.8 },
    { t: C.pu_alarm, p: [1.3, 0.7, 2.9], l: [0, 0.3, 0.12], o: 360, d: 1.4 },
    { t: C.pu_neu, p: [1.8, 1.15, 4.3], l: [0, 0.68, 0.05], o: 360, d: 1.6 },
  ];
  else if (inS7) keys = [
    { t: shot.a, p: [2.1, 1.6, 5.9], l: [0.05, 1.02, 0], o: 360 },
    { t: C.s7_pumpe - 0.4, p: [1.5, 1.0, 3.7], l: [0, 0.68, 0], o: 360, d: 1.8 },
    { t: C.s7_mob, p: [2.1, 1.6, 5.9], l: [0.05, 1.02, 0], o: 360, d: 1.8 },
  ];
  else keys = [
    { t: shot.a, p: [2.1, 1.6, 5.9], l: [0.05, 1.02, 0], o: 360 },
    { t: C.case + 0.2, p: [1.2, 1.6, 6.3], l: [0, 1.02, 0], o: 430, d: 2.0 },
    { t: C.c_links - 0.3, p: [1.1, 1.35, 5.2], l: [0.08, 0.92, 0], o: 430, d: 1.8 },
    { t: C.c_m1, p: [1.2, 1.6, 6.3], l: [0, 1.02, 0], o: 430, d: 2.0 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.03);
  // pins
  const ax = LG.a.g.position.x;
  W.pin(el("pin-len"), [0.3, 1.2, 0.05]);
  W.pin(el("pin-wade"), [0.17, 0.7, 0.02]);
  W.pin(el("pin-ober"), [0.24, 1.81, 0.02]);
  W.pin(el("pin-passt"), [0.16, 0.55, 0.05]);
  W.pin(el("pin-zeh"), [0.03, 0.09, 0.34]);
  W.pin(el("pin-pumpe"), [-0.1, 0.62, 0]);
  W.pin(el("pin-blut"), [0.08, 0.98, 0.06]);
  W.pin(el("pin-dick"), [ax + 0.17 * (1 + thick), 1.1, 0]);
  W.pin(el("pin-warm"), [ax + 0.2 * (1 + thick), 1.55, 0]);
  W.pin(el("pin-weh"), [ax + 0.16 * (1 + thick), 0.62, 0]);
  W.renderer.render(legScene, W.camera);
}

/* ================================================================== SYRINGE (Satz 5) */
const syrScene = W.studioScene(0xf1ebde);
const SY = {};
{
  const g = new THREE.Group();
  g.position.set(0, 0.95, 0);
  g.rotation.set(0, 0, 0.12);
  syrScene.add(g);
  SY.g = g;
  const X = (o) => [0, 0, -Math.PI / 2]; // cylinders lie along x
  SY.barrel = add(g, cyl(0.16, 1.6, 48), new THREE.MeshStandardMaterial({ color: 0xeaf6f1, roughness: 0.12, transparent: true, opacity: 0.28, depthWrite: false }), [-0.02, 0, 0], X(), { cast: false });
  add(g, box(0.06, 0.52, 0.3), clay(0xdfe6e3), [-0.84, 0, 0]);
  for (let i = 0; i < 6; i++) add(g, box(0.006, 0.05, 0.002), clay(0x5f6e66), [-0.5 + i * 0.22, 0.13, 0.16], [0, 0, 0], { cast: false });
  SY.liquid = add(g, cyl(0.138, 1, 40), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, roughness: 0.2, transparent: true, opacity: 0.6, depthWrite: false }), [0, 0, 0], X(), { cast: false });
  SY.bubble = add(g, sphere(0.1, 32, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.85, emissive: 0xffffff, emissiveIntensity: 0 }), [0, 0.03, 0], [0, 0, 0], { cast: false });
  SY.plunger = new THREE.Group();
  g.add(SY.plunger);
  add(SY.plunger, cyl(0.15, 0.08, 40), clay(0x3d4448), [0, 0, 0], X());
  add(SY.plunger, box(0.9, 0.06, 0.06), clay(0xdfe6e3), [-0.49, 0, 0]);
  add(SY.plunger, box(0.9, 0.06, 0.06), clay(0xdfe6e3), [-0.49, 0, 0], [Math.PI / 2, 0, 0]);
  add(SY.plunger, cyl(0.2, 0.04, 40), clay(0xdfe6e3), [-0.95, 0, 0], X());
  add(g, new THREE.ConeGeometry(0.09, 0.16, 32), clay(0x2ecc91), [0.86, 0, 0], X());
  add(g, cyl(0.011, 0.62, 12), clay(0xb8c2c8, { metalness: 0.5, roughness: 0.35 }), [1.25, 0, 0], X());
  SY.drops = new THREE.InstancedMesh(sphere(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0xbfe8ff, roughness: 0.2, transparent: true, opacity: 0.85 }), 10);
  SY.drops.castShadow = false;
  g.add(SY.drops);
}
const HUB = 0.76, ST0 = -0.78, BUB = 0.2;
function renderSyringe(t, shot) {
  // plunger pushes the whole dose out; the air bubble rides ahead of the stopper and ends at the hub
  const push = P(t, C.s5_dosis + 0.3, 3.2);
  const st = lerp(ST0, HUB - BUB - 0.06, push);
  SY.plunger.position.x = st;
  const l0 = st + 0.04 + BUB, len = Math.max(0.001, HUB - l0);
  SY.liquid.scale.set(1, len, 1);
  SY.liquid.position.x = l0 + len / 2;
  SY.liquid.visible = len > 0.01;
  SY.bubble.position.x = st + 0.04 + BUB / 2;
  SY.bubble.material.emissiveIntensity = 0.35 * win(t, C.s5_blase, C.s5_dosis + 3.6, 0.4) * (0.6 + 0.4 * Math.sin(t * 6));
  for (let i = 0; i < 10; i++) {
    const age = frac(t * 1.4 + hash(i + 70));
    const born = t - age / 1.4;
    const on = born > C.s5_dosis + 0.4 && born < C.s5_dosis + 3.5 ? 1 : 0;
    const s = on * 0.022 * (1 - age);
    SY.drops.setMatrixAt(i, mtx.compose(v3.set(1.58 + age * 0.35, -age * age * 0.5, (hash(i) - 0.5) * 0.05), q.identity(), s3.set(s, s, s)));
  }
  SY.drops.instanceMatrix.needsUpdate = true;
  SY.g.rotation.y = 0.25 * Math.sin((t - shot.a) * 0.25) - 0.15;
  const keys = [
    { t: shot.a, p: [0.4, 1.9, 6.4], l: [0.2, 0.9, 0], o: -440 },
    { t: C.s5_blase - 0.2, p: [-0.1, 1.3, 3.4], l: [-0.2, 0.92, 0], o: -440, d: 1.6 },
    { t: C.s5_dosis + 0.1, p: [0.4, 1.7, 5.4], l: [0.25, 0.92, 0], o: -440, d: 1.6 },
    { t: C.s5_pruef, p: [0.4, 1.9, 6.4], l: [0.2, 0.9, 0], o: -440, d: 1.8 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.03);
  SY.g.updateMatrixWorld(true);
  const bp = SY.bubble.getWorldPosition(new THREE.Vector3());
  W.pin(el("pin-blase"), [bp.x, bp.y + 0.12, bp.z]);
  W.renderer.render(syrScene, W.camera);
}

W.mount({ pad: renderPad, vessel: renderVessel, leg: renderLeg, syringe: renderSyringe });
