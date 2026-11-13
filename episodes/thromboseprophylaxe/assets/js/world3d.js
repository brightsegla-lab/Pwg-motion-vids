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
  const show = P(t, 14.3, 1.1); // after the beat-synced intro (timeline.js B(27))
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
// Vertical vein on the right half of the frame (the Virchow triad sits on the left), blood flowing up.
// Biconcave red blood cells + platelets; damaged wall with exposed collagen; clot = trapped cells in a
// fibrin mesh; it detaches, travels up into the pulmonary artery and lodges in a branch of the right
// lung, whose downstream wedge darkens (Lungenembolie).
const vesScene = W.studioScene(0xf1ebde);
const V = {};
const rbcGeo = (() => {
  const pr = [[0.001, 0.13], [0.3, 0.17], [0.62, 0.3], [0.86, 0.3], [1, 0.12], [1, -0.12], [0.86, -0.3], [0.62, -0.3], [0.3, -0.17], [0.001, -0.13]];
  const g = new THREE.LatheGeometry(new THREE.SplineCurve(pr.map((p) => new THREE.Vector2(p[0], p[1]))).getPoints(40), 40);
  g.computeVertexNormals();
  return g;
})();
const rbcMat = new THREE.MeshPhysicalMaterial({ color: 0xb3222d, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color(0xff8a8a) });
const fibMat = new THREE.MeshStandardMaterial({ color: 0xf2dfae, roughness: 0.6, emissive: 0x6b5520, emissiveIntensity: 0.08 });
const pltMat = new THREE.MeshStandardMaterial({ color: 0xf3d58a, roughness: 0.55 });
{
  V.path = new THREE.CatmullRomCurve3([[0.05, -0.8, 0], [0.16, 0.4, 0.05], [-0.08, 1.4, 0], [0.1, 2.4, -0.04], [0, 3.4, 0], [0, 4.05, 0]].map((p) => new THREE.Vector3(...p)));
  const wallGeo = new THREE.TubeGeometry(V.path, 260, 0.3, 48, false);
  // endothelium: gentle deterministic bumps so the wall reads as tissue, not a plastic pipe
  const pos = wallGeo.attributes.position, nrm = wallGeo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const d = 0.012 * (Math.sin(y * 23 + x * 9) * Math.sin(z * 19 + y * 7) + 0.5 * Math.sin(y * 51 + z * 31));
    pos.setXYZ(i, x + nrm.getX(i) * d, y + nrm.getY(i) * d, z + nrm.getZ(i) * d);
  }
  wallGeo.computeVertexNormals();
  V.wall = add(vesScene, wallGeo, new THREE.MeshPhysicalMaterial({ color: 0xd98782, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }), [0, 0, 0], [0, 0, 0], { cast: false });
  add(vesScene, new THREE.TubeGeometry(V.path, 260, 0.29, 48, false), new THREE.MeshStandardMaterial({ color: 0x7a1820, roughness: 0.8, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.BackSide }), [0, 0, 0], [0, 0, 0], { cast: false });
  // flowing cells (in the vein part of the path: u in [0, 0.86])
  V.N = 150;
  V.cells = new THREE.InstancedMesh(rbcGeo, rbcMat, V.N);
  V.cells.castShadow = false;
  vesScene.add(V.cells);
  V.plt = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), pltMat, 26);
  V.plt.castShadow = false;
  vesScene.add(V.plt);
  // damaged wall: torn endothelium facing the camera, exposed collagen fibres
  V.U0 = 0.36;
  const p0 = V.path.getPointAt(V.U0);
  V.p0 = p0;
  V.side = new THREE.Vector3(0.62, 0, 0.78).normalize(); // towards the camera
  V.dmg = new THREE.InstancedMesh(new THREE.CapsuleGeometry(1, 3, 4, 8), new THREE.MeshStandardMaterial({ color: 0xf0d9a8, roughness: 0.7 }), 22);
  V.dmgRed = new THREE.InstancedMesh(sphere(1, 12, 8), clay(0x7e2a2e), 18);
  V.dmg.castShadow = V.dmgRed.castShadow = false;
  vesScene.add(V.dmg, V.dmgRed);
  // clot: trapped red cells + platelets inside a fibrin mesh, grown on the damaged wall
  V.clot = new THREE.Group();
  vesScene.add(V.clot);
  V.clotCells = new THREE.InstancedMesh(rbcGeo, rbcMat, 46);
  V.clotPlt = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), pltMat, 18);
  V.clot.add(V.clotCells, V.clotPlt);
  V.clotSeed = [];
  for (let i = 0; i < 46; i++) {
    const a = hash(i + 300) * Math.PI * 2, r = Math.sqrt(hash(i + 310)), h = hash(i + 320) * 2 - 1;
    V.clotSeed.push({ p: new THREE.Vector3(Math.cos(a) * r * 0.11, h * 0.2, Math.sin(a) * r * 0.1), r: [hash(i + 330) * 6, hash(i + 340) * 6, hash(i + 350) * 6], k: hash(i + 360) });
  }
  V.fib = [];
  for (let i = 0; i < 22; i++) {
    const a = new THREE.Vector3((hash(i + 400) - 0.5) * 0.28, (hash(i + 410) - 0.5) * 0.5, (hash(i + 420) - 0.5) * 0.24);
    const b = new THREE.Vector3((hash(i + 430) - 0.5) * 0.28, (hash(i + 440) - 0.5) * 0.5, (hash(i + 450) - 0.5) * 0.24);
    const m = add(V.clot, tube([[a.x, a.y, a.z], [(a.x + b.x) / 2 + 0.03, (a.y + b.y) / 2, (a.z + b.z) / 2 - 0.03], [b.x, b.y, b.z]], 0.0045, false, 16), fibMat, [0, 0, 0], [0, 0, 0], { cast: false });
    m.userData.k = hash(i + 460);
    V.fib.push(m);
  }
  // lungs: anatomical shape (apex, flat medial side, concave base), translucent over the airway and artery trees
  V.lungs = new THREE.Group();
  vesScene.add(V.lungs);
  function lungGeo(side) {
    const g = new THREE.SphereGeometry(1, 120, 90);
    const p = g.attributes.position, col = [];
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      y *= 1.32;
      if (y > 0) { const k = 1 - 0.5 * Math.pow(y / 1.32, 2); x *= k; z *= k; }
      const base = -1.05 + 0.42 * (1 - Math.min(1, x * x + z * z));
      if (y < base) y = base;
      const med = side * x;
      if (med < -0.25) x = side * (-0.25 + (med + 0.25) * 0.3);
      if (side < 0 && med < 0 && y < 0.1 && y > -0.9) x += side * -0.12 * Math.sin(((y + 0.9) / 1.0) * Math.PI); // cardiac notch (left lung)
      z *= 0.68;
      p.setXYZ(i, x, y, z);
      const n = 0.5 + 0.5 * Math.sin(x * 17 + y * 11) * Math.sin(z * 23 - y * 13);
      const c = new THREE.Color(0xeea397).lerp(new THREE.Color(0xd77b74), n * 0.45).lerp(new THREE.Color(0xf7c4b8), (1 - n) * 0.25);
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }
  const lungMat = () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.5, sheen: 0.5, sheenColor: new THREE.Color(0xffd0c8), transparent: true, opacity: 0.5, depthWrite: false });
  const LC = { L: new THREE.Vector3(-0.92, 4.85, 0), R: new THREE.Vector3(0.92, 4.85, 0) };
  V.LC = LC;
  V.lungR = add(V.lungs, lungGeo(1), lungMat(), [LC.R.x, LC.R.y, 0], [0, 0, 0], { cast: false }); // viewer's right
  V.lungR.scale.setScalar(0.82);
  V.lungL = add(V.lungs, lungGeo(-1), lungMat(), [LC.L.x, LC.L.y, 0], [0, 0, 0], { cast: false });
  V.lungL.scale.setScalar(0.8);
  // airway (trachea with rings + bronchial tree) and pulmonary artery tree
  const cart = clay(0xf4ede1);
  add(V.lungs, cyl(0.075, 1.0, 32), cart, [0, 6.35, -0.05]);
  for (let i = 0; i < 7; i++) add(V.lungs, new THREE.TorusGeometry(0.078, 0.013, 8, 32), clay(0xe8dccb), [0, 5.95 + i * 0.12, -0.05], [Math.PI / 2, 0, 0]);
  const inLung = (v) => {
    for (const c of [LC.L, LC.R]) {
      const dx = (v.x - c.x) / 0.62, dy = (v.y - c.y) / 1.0, dz = v.z / 0.45;
      if (dx * dx + dy * dy + dz * dz < 1) return true;
    }
    return false;
  };
  function tree(start, dir, len, rad, depth, mat, seed, out, zoff) {
    let end = start.clone().addScaledVector(dir, len);
    for (let k = 0; k < 6 && depth < 3 && !inLung(end); k++) end = start.clone().addScaledVector(dir, len * (0.8 - k * 0.12));
    const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0, zoff));
    add(V.lungs, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, end]), 12, rad, 10, false), mat, [0, 0, 0], [0, 0, 0], { cast: false });
    out.push({ start, end, dir, depth });
    if (depth === 0) return;
    for (let s = -1; s <= 1; s += 2) {
      const ang = s * (0.42 + 0.28 * hash(seed * 7 + s + depth * 13));
      const nd = dir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), ang).applyAxisAngle(new THREE.Vector3(0, 1, 0), (hash(seed * 3 + s) - 0.5) * 0.9).normalize();
      tree(end, nd, len * 0.7, rad * 0.68, depth - 1, mat, seed * 2 + (s > 0 ? 1 : 0), out, (hash(seed + depth) - 0.5) * 0.1);
    }
  }
  const airMat = clay(0xf1e8da), artMat = clay(0x5a6fcf, { roughness: 0.6 });
  const air = [];
  tree(new THREE.Vector3(0, 5.88, -0.05), new THREE.Vector3(-0.8, -0.6, 0).normalize(), 0.5, 0.05, 4, airMat, 3, air, 0);
  tree(new THREE.Vector3(0, 5.88, -0.05), new THREE.Vector3(0.8, -0.6, 0).normalize(), 0.5, 0.05, 4, airMat, 5, air, 0);
  // pulmonary trunk = continuation of the vein path, then left/right arteries
  add(V.lungs, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 3.6, 0], [0, 4.05, 0], [0, 4.3, 0.12]].map((p) => new THREE.Vector3(...p))), 16, 0.13, 16, false), artMat, [0, 0, 0], [0, 0, 0], { cast: false });
  V.art = [];
  tree(new THREE.Vector3(0, 4.3, 0.12), new THREE.Vector3(-0.85, 0.35, 0).normalize(), 0.55, 0.075, 4, artMat, 11, [], 0.04);
  tree(new THREE.Vector3(0, 4.3, 0.12), new THREE.Vector3(0.85, 0.35, 0).normalize(), 0.55, 0.075, 4, artMat, 17, V.art, 0.04);
  // lodging point: end of the second-level branch of the right artery tree, lower lobe
  const lodge = V.art.filter((b) => b.depth === 2).sort((a, b) => a.end.y - b.end.y)[0];
  V.lodge = lodge;
  V.clotPath = new THREE.CatmullRomCurve3([...[0.36, 0.5, 0.65, 0.8, 0.93].map((u) => V.path.getPointAt(u)), new THREE.Vector3(0, 4.3, 0.12), V.art[0].end.clone(), lodge.start.clone(), lodge.end.clone()]);
  // infarct wedge downstream of the blocked branch
  const wdir = lodge.dir.clone();
  // the tissue behind the blocked branch: a dark patch inside the lung, around the branch end
  V.wedge = add(V.lungs, sphere(1, 40, 30), new THREE.MeshStandardMaterial({ color: 0x5e1a33, emissive: 0x8e1a2a, emissiveIntensity: 0.2, roughness: 0.8, transparent: true, opacity: 0, depthWrite: false }), [0, 0, 0], [0, 0, 0], { cast: false });
  V.wedge.position.copy(lodge.end).addScaledVector(wdir, 0.06);
  V.wedge.scale.set(0.24, 0.2, 0.18);
}
function vesFlow(t) {
  const v0 = 0.045, v1 = 0.014, a = C.s1_a + 0.4;
  if (t < a) return v0 * t;
  const d = t - a;
  return v0 * a + v0 * d - (v0 - v1) * (d < 1.2 ? (d * d) / 2.4 : d - 0.6);
}
const tan = new THREE.Vector3(), nrm = new THREE.Vector3(), bin = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
function renderVessel(t, shot) {
  const fp = vesFlow(t);
  for (let i = 0; i < V.N; i++) {
    const u = 0.86 * frac(hash(i) + fp * (0.85 + 0.3 * hash(i + 7)));
    const p = V.path.getPointAt(u);
    V.path.getTangentAt(u, tan);
    nrm.set(1, 0, 0).cross(tan).normalize();
    bin.copy(tan).cross(nrm);
    const r = 0.21 * Math.sqrt(hash(i + 3)), a = hash(i + 5) * Math.PI * 2;
    v3.copy(p).addScaledVector(nrm, Math.cos(a) * r).addScaledVector(bin, Math.sin(a) * r);
    e3.set(hash(i + 11) * 6 + t * 0.7 * (hash(i + 2) - 0.5), hash(i + 12) * 6, hash(i + 13) * 6 + t * 0.4 * (hash(i + 9) - 0.5));
    q.setFromEuler(e3);
    V.cells.setMatrixAt(i, mtx.compose(v3, q, s3.set(0.075, 0.075, 0.075)));
  }
  V.cells.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < 26; i++) {
    const u = 0.86 * frac(hash(i + 90) + fp * 0.9);
    const p = V.path.getPointAt(u);
    const r = 0.22 * Math.sqrt(hash(i + 93)), a = hash(i + 95) * 6.28;
    v3.set(p.x + Math.cos(a) * r, p.y, p.z + Math.sin(a) * r);
    q.setFromEuler(e3.set(t + i, i, 0));
    V.plt.setMatrixAt(i, mtx.compose(v3, q, s3.set(0.022, 0.012, 0.018)));
  }
  V.plt.instanceMatrix.needsUpdate = true;
  // wall damage ("Gefäßwand geschädigt")
  const dmg = P(t, C.s1_b + 0.3, 1.4);
  const p0 = V.p0, sd = V.side;
  for (let i = 0; i < 22; i++) {
    const g = clamp(dmg * 1.5 - hash(i + 500) * 0.5);
    const yy = p0.y + (hash(i + 510) - 0.5) * 0.36, ang = (hash(i + 520) - 0.5) * 1.1;
    const dir = sd.clone().applyAxisAngle(up, ang);
    v3.copy(p0).setY(yy).addScaledVector(dir, 0.285);
    q.setFromEuler(e3.set(0, -Math.atan2(dir.z, dir.x), (hash(i + 530) - 0.5) * 0.9 + Math.PI / 2));
    const s = 0.012 * g + 1e-4;
    V.dmg.setMatrixAt(i, mtx.compose(v3, q, s3.set(s, s * (0.8 + hash(i + 540)), s)));
  }
  for (let i = 0; i < 18; i++) {
    const g = clamp(dmg * 1.5 - hash(i + 600) * 0.5);
    const yy = p0.y + (hash(i + 610) - 0.5) * 0.4, ang = (hash(i + 620) - 0.5) * 1.3;
    v3.copy(p0).setY(yy).addScaledVector(sd.clone().applyAxisAngle(up, ang), 0.29);
    const s = (0.02 + 0.02 * hash(i + 630)) * g + 1e-4;
    V.dmgRed.setMatrixAt(i, mtx.compose(v3, q.identity(), s3.set(s, s * 0.5, s)));
  }
  V.dmg.instanceMatrix.needsUpdate = V.dmgRed.instanceMatrix.needsUpdate = true;
  // clot grows on the damage ("Gerinnung verändert"), detaches and travels to the lung
  const grow = P(t, C.s1_c + 0.2, 3.0);
  V.clot.visible = grow > 0.01;
  V.clotSeed.forEach((c, i) => {
    const g = clamp(grow * 1.6 - c.k * 0.6);
    q.setFromEuler(e3.set(c.r[0], c.r[1], c.r[2]));
    V.clotCells.setMatrixAt(i, mtx.compose(c.p, q, s3.set(0.07 * g + 1e-4, 0.07 * g + 1e-4, 0.07 * g + 1e-4)));
    if (i < 18) V.clotPlt.setMatrixAt(i, mtx.compose(v3.copy(c.p).multiplyScalar(0.9).add(new THREE.Vector3(0.02, 0.03, 0.02)), q, s3.set(0.022 * g + 1e-4, 0.012 * g + 1e-4, 0.018 * g + 1e-4)));
  });
  V.clotCells.instanceMatrix.needsUpdate = V.clotPlt.instanceMatrix.needsUpdate = true;
  V.fib.forEach((f) => { f.visible = grow * 1.4 - f.userData.k * 0.5 > 0.05; });
  const go = P(t, C.s1_loest + 0.2, C.s1_lunge + 1.6 - C.s1_loest);
  const onWall = 1 - P(t, C.s1_loest, 0.7);
  const cp = go > 0 ? V.clotPath.getPointAt(Math.min(0.999, go)) : V.p0.clone();
  V.clot.position.copy(cp).addScaledVector(V.side, 0.16 * onWall);
  V.clot.scale.setScalar(Math.max(0.001, grow) * (1 - 0.4 * go));
  V.clot.rotation.set(0.6 * go * 3, 1.3 * go * 3, 0);
  // embolism: the wedge behind the blocked branch darkens and pulses
  const emb = P(t, C.s1_embolie, 1.2);
  V.wedge.material.opacity = 0.78 * emb;
  V.wedge.material.emissiveIntensity = 0.15 + 0.35 * emb * (0.5 + 0.5 * Math.sin((t - C.s1_embolie) * 4.5));
  // camera: close on the vein, follows the embolus up, then frames the lungs
  const keys = [
    { t: shot.a, p: [2.5, 1.85, 3.7], l: [0, 1.35, 0], o: -440 },
    { t: C.s1_b, p: [1.35, 1.6, 1.9], l: [0.05, 1.38, 0.1], o: -440, d: 2.0 },
    { t: C.s1_knie, p: [2.5, 1.85, 3.7], l: [0, 1.4, 0], o: -440, d: 1.6 },
    { t: C.s1_lunge + 0.9, p: [3.4, 5.3, 7.4], l: [0.15, 4.95, 0], o: -440, d: 1.8 },
    { t: C.s1_embolie + 0.6, p: [2.5, 4.9, 4.6], l: [0.7, 4.55, 0.1], o: -440, d: 1.8 },
  ];
  const cam = W.camAt(keys, t);
  const w = P(t, C.s1_loest, 0.8) * (1 - P(t, C.s1_lunge + 0.9, 1.6));
  if (w > 0) {
    const fol = V.clot.position;
    for (let j = 0; j < 3; j++) {
      cam.l[j] = lerp(cam.l[j], [fol.x, fol.y, fol.z][j], w);
      cam.p[j] = lerp(cam.p[j], [fol.x + 2.0, fol.y + 0.5, fol.z + 3.0][j], w);
    }
  }
  W.applyCam(cam, t, 0.02);
  W.pin(el("clot-pin"), [V.clot.position.x - 0.12, V.clot.position.y + 0.1, V.clot.position.z]);
  W.renderer.render(vesScene, W.camera);
}

/* ================================================================== LEG */
const legScene = W.studioScene(0xf1ebde);
const LG = {};
// leg profile: [radius, height]; the lathe is then shaped anatomically (deformLeg): calf bulge at the
// back (medial head larger), flatter shin, kneecap, hollow behind the knee, ankle bones, oval thigh.
const PROF = [[0.001, 0.1], [0.052, 0.105], [0.062, 0.16], [0.066, 0.24], [0.085, 0.36], [0.118, 0.5], [0.138, 0.63], [0.132, 0.76], [0.115, 0.9], [0.106, 1.0], [0.112, 1.08], [0.13, 1.22], [0.165, 1.45], [0.198, 1.7], [0.218, 1.92], [0.001, 2.0]];
function profR(y) {
  for (let i = 1; i < PROF.length; i++) if (y <= PROF[i][1]) {
    const a = PROF[i - 1], b = PROF[i];
    return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1]));
  }
  return 0.22;
}
const bell = (y, c, w) => Math.exp(-((y - c) * (y - c)) / (2 * w * w));
// side: +1 = medial towards −x (patient's left leg seen from the front), −1 mirrored
function legShape(x, y, z) {
  const r = Math.hypot(x, z) || 1e-6, nx = x / r, nz = z / r;
  let k = 1;
  const back = Math.max(0, -nz), front = Math.max(0, nz), med = Math.max(0, -nx), lat = Math.max(0, nx);
  k += 0.3 * bell(y, 0.66, 0.15) * back * (0.75 + 0.35 * med); // gastrocnemius
  k += 0.08 * bell(y, 0.42, 0.12) * back; // soleus / Achilles taper below
  k -= 0.1 * bell(y, 0.6, 0.25) * front * (1 - Math.abs(nx)); // shin flatter
  k += 0.2 * bell(y, 1.07, 0.045) * Math.pow(front, 3); // kneecap
  k -= 0.08 * bell(y, 1.07, 0.05) * Math.pow(back, 2); // hollow behind the knee
  k += 0.24 * bell(y, 0.16, 0.028) * Math.pow(lat, 4); // lateral malleolus (lower)
  k += 0.22 * bell(y, 0.19, 0.03) * Math.pow(med, 4); // medial malleolus
  k += 0.07 * bell(y, 1.5, 0.3) * (back + front * 0.6) - 0.05 * bell(y, 1.5, 0.3) * Math.abs(nx); // oval thigh
  k += 0.1 * bell(y, 1.3, 0.12) * med; // vastus medialis above the knee
  return k;
}
function deformLeg(geo, extra = 0) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = legShape(x, y, z) + extra;
    p.setXYZ(i, x * k, y, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}
function latheFrom(prof, k = 1, y0 = -1, y1 = 9) {
  const sp = new THREE.SplineCurve(prof.filter((p) => p[1] >= y0 && p[1] <= y1).map((p) => new THREE.Vector2(p[0] * k, p[1])));
  return new THREE.LatheGeometry(sp.getPoints(120), 96);
}
// foot: deformed sphere — rounded heel, ankle rising into the leg, high instep, medial arch, flat sole,
// widest at the ball; toes point to +z.
function footGeo() {
  const g = new THREE.SphereGeometry(1, 120, 80);
  const p = g.attributes.position;
  const sq = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e); // squircle: broad front, no pinched tip
  const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  for (let i = 0; i < p.count; i++) {
    const sx = sq(p.getX(i), 0.62), sy = sq(p.getY(i), 0.8), sz = sq(p.getZ(i), 0.55);
    const Z = 0.08 + sz * 0.155; // heel −0.075 … front 0.235
    const u = (Z + 0.075) / 0.31;
    const half = 0.041 + 0.027 * ss(0, 0.72, u) - 0.007 * ss(0.78, 1, u);
    const top = 0.082 + 0.045 * ss(0, 0.22, u) - 0.087 * ss(0.25, 1, u); // heel, ankle, instep falling to the toes
    let Y = sy > 0 ? sy * top : sy * 0.012;
    if (sy < 0.2 && sx < 0 && u > 0.2 && u < 0.72) Y += 0.02 * Math.sin(((u - 0.2) / 0.52) * Math.PI) * Math.min(1, -sx * 1.4) * (1 - Math.max(0, sy) * 4); // medial arch
    Y = Math.max(0.003, Y + 0.012);
    p.setXYZ(i, sx * half, Y, Z);
  }
  g.computeVertexNormals();
  return g;
}
const skinMat = (hex) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.52, sheen: 0.7, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffd6c2), clearcoat: 0.06, clearcoatRoughness: 0.6, transparent: true, opacity: 1, emissive: 0xff6a2b, emissiveIntensity: 0 });
function buildLeg(parent, skinHex, mirror) {
  const g = new THREE.Group();
  parent.add(g);
  const inner = new THREE.Group(); // mirrored for the other leg so the big toe is always medial
  inner.scale.x = mirror ? -1 : 1;
  g.add(inner);
  const skin = skinMat(skinHex);
  const leg = add(inner, deformLeg(latheFrom(PROF)), skin);
  const fg = new THREE.Group(); // whole foot scaled to real proportions (≈ 26 cm foot for a 90 cm leg)
  fg.scale.setScalar(1.3);
  inner.add(fg);
  const foot = add(fg, footGeo(), skin);
  const toeMat = skinMat(skinHex);
  const nailMat = new THREE.MeshPhysicalMaterial({ color: 0xf7ddd3, roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.2 });
  // big toe medial (−x), toe line curving back to the little toe
  const TOES = [[-0.038, 0.214, 0.02, 0.04], [-0.01, 0.222, 0.0128, 0.026], [0.012, 0.216, 0.0122, 0.024], [0.031, 0.205, 0.0115, 0.021], [0.048, 0.19, 0.0108, 0.017]];
  const toes = [];
  TOES.forEach(([x, z, r, l]) => {
    const t = new THREE.Group();
    t.position.set(x, r * 0.92 + 0.004, z);
    t.rotation.set(0.1, x * 1.2, 0);
    fg.add(t);
    const m = add(t, new THREE.CapsuleGeometry(r, l, 8, 20), toeMat, [0, 0, l / 2], [Math.PI / 2, 0, 0]);
    m.scale.set(1.12, 0.84, 1);
    const tip = add(t, sphere(r * 1.02, 24, 16), toeMat, [0, -r * 0.1, l + r * 0.1]);
    tip.scale.set(1.08, 0.82, 0.92);
    const nail = add(t, sphere(r * 0.74, 24, 12), nailMat, [0, r * 0.6, l + r * 0.02], [0.28, 0, 0], { cast: false });
    nail.scale.set(1, 0.26, 0.92);
    toes.push(t);
  });
  return { g, inner, leg, foot, skin, toes, toeMat };
}
{
  LG.ped = add(legScene, cyl(0.85, 0.06, 96), clay(0xdfe9e2), [0, 0.03, 0]);
  LG.a = buildLeg(legScene, 0xefc3a1, false); // the main leg (Herr K.'s left leg in the case)
  LG.b = buildLeg(legScene, 0xefc3a1, true); // his right leg, only in the case
  LG.a.g.position.y = LG.b.g.position.y = 0.06;
  // measuring tape (Satz 3)
  const gold = clay(0xf4c430);
  LG.len = add(legScene, tube([[0.3, 0.08, 0.05], [0.3, 1.0, 0.05], [0.3, 2.04, 0.05]], 0.012, false, 60), gold, [0, 0, 0], [0, 0, 0], { cast: false });
  LG.ringW = add(legScene, new THREE.TorusGeometry(0.185, 0.012, 10, 64), gold, [0, 0.7, -0.02], [Math.PI / 2, 0, 0]);
  LG.ringO = add(legScene, new THREE.TorusGeometry(0.24, 0.012, 10, 64), gold, [0, 1.81, 0], [Math.PI / 2, 0, 0]);
  // stocking (Satz 3 + case)
  const stockMat = () => new THREE.MeshStandardMaterial({ color: 0x8fd9c4, roughness: 0.6, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  LG.stockA = add(LG.a.inner, deformLeg(latheFrom(PROF.slice(1, -2), 1.04, 0.12, 1.8), 0.02), stockMat(), [0, 0, 0], [0, 0, 0], { cast: false });
  LG.stockB = add(LG.b.inner, deformLeg(latheFrom(PROF.slice(1, -2), 1.04, 0.12, 1.8), 0.02), stockMat(), [0, 0, 0], [0, 0, 0], { cast: false });
  // Pütter bandage: overlapping tilted turns from the foot up to the knee
  LG.bands = [];
  for (let i = 0; i < 11; i++) {
    const y = 0.16 + i * 0.085;
    const r = profR(y) * (1 + 0.24 * bell(y, 0.66, 0.16)) + 0.026;
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
  LG.a.foot.scale.set(1 + thick * 0.4, 1, 1 + thick * 0.15);
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
    { t: C.pu_alarm, p: [0.75, 0.45, 1.35], l: [0, 0.1, 0.22], o: 360, d: 1.4 },
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
  W.pin(el("pin-zeh"), [-0.05, 0.06, 0.32]);
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
