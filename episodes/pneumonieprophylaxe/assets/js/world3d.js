// Pneumonieprophylaxe — 3D layer (clay, primitives only, no external models).
// Every motion is a function of t and the shared breathing model (breath.js → window.BREATH).
//   lungs   — intro / Pneumonie (alveoli turn murky on "Entzündung") / Atelektase (one lobe deflates)
//   devices — SMI trainer (ball rises on "atmet tief ein") + PEP device (ball resists the exhale)
//   bottle  — Blubberflasche (bubbles only while exhaling)
//   bed     — case study: hospital bed, back section rises on "Oberkörper hochlagern"
import { createWorld, P, lerp, clamp } from "./clay3d.js";

const C = window.CUES;
const B = window.BREATH;
const W = createWorld();
const { THREE, add, clay, cyl, box, sphere, tube } = W;
const hash = (i) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const breathK = (t) => B.v(t) * B.amp(t);

/* ================================================================== LUNGS */
const lungScene = W.studioScene(0xf1ebde);
const L = { lobes: [], alv: [] };
{
  const g = new THREE.Group();
  g.position.set(0, 0.2, 0);
  lungScene.add(g);
  L.g = g;
  L.ped = add(lungScene, cyl(0.9, 0.06, 96), clay(0xdfe9e2), [0, 0.03, 0]);
  const cart = clay(0xf3ece0);
  // trachea + rings + bronchi
  add(g, cyl(0.075, 0.62, 32), cart, [0, 2.12, 0]);
  for (let i = 0; i < 5; i++) add(g, new THREE.TorusGeometry(0.078, 0.014, 8, 32), clay(0xe6dccb), [0, 1.9 + i * 0.11, 0], [Math.PI / 2, 0, 0]);
  L.airMat = new THREE.MeshStandardMaterial({ color: 0xf3ece0, emissive: 0x2ecc91, emissiveIntensity: 0, roughness: 0.9 });
  add(g, tube([[0, 1.84, 0], [-0.14, 1.72, 0], [-0.3, 1.62, 0.02]], 0.05), L.airMat);
  add(g, tube([[0, 1.84, 0], [0.14, 1.72, 0], [0.3, 1.6, 0.02]], 0.05), L.airMat);
  // lobes: [x, y, z, sx, sy, sz, side]  — viewer's left = right lung (3 lobes), viewer's right = left lung (2 lobes)
  const LOBES = [
    [-0.5, 1.58, 0, 0.33, 0.46, 0.3],
    [-0.58, 1.22, 0.04, 0.38, 0.34, 0.31],
    [-0.55, 0.9, 0, 0.42, 0.36, 0.32], // index 2: lower right lobe → Atelektase
    [0.5, 1.48, 0, 0.34, 0.54, 0.3],
    [0.56, 0.95, 0, 0.41, 0.4, 0.32],
  ];
  LOBES.forEach((d, li) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf0a99c, roughness: 0.78, transparent: true, opacity: 0.9, emissive: 0xf08a7a, emissiveIntensity: 0.06 });
    const lobe = add(g, sphere(1, 64, 40), mat, [d[0], d[1], d[2]]);
    lobe.scale.set(d[3], d[4], d[5]);
    lobe.userData.base = d;
    L.lobes.push(lobe);
    // inflammation spots: flat murky patches embedded in the lobe surface, hidden while healthy
    const n = 22;
    const amat = new THREE.MeshStandardMaterial({ color: 0xb59e63, roughness: 0.9 });
    const inst = new THREE.InstancedMesh(sphere(1, 16, 12), amat, n);
    inst.castShadow = false;
    inst.userData.spots = [];
    for (let i = 0; i < n; i++) {
      const u = hash(li * 100 + i) * 2 - 1;
      const a = hash(li * 100 + i + 50) * Math.PI * 0.95 - Math.PI * 0.475;
      const yy = u * 0.8;
      const r = Math.sqrt(1 - yy * yy);
      const dir = new THREE.Vector3(Math.sin(a) * r, yy, Math.cos(a) * r);
      inst.userData.spots.push({ dir, size: 0.035 + hash(li * 100 + i + 7) * 0.045, th: (1 - (yy + 1) / 2) * 0.6 + hash(li * 100 + i + 3) * 0.4 });
    }
    g.add(inst);
    L.alv.push(inst);
  });
}
const PINK = new THREE.Color(0xf0a99c), PINK_A = new THREE.Color(0xf5b8ac);
const MURKY = new THREE.Color(0xc9b483), MURKY_A = new THREE.Color(0xb59e63);
const GREY = new THREE.Color(0xbdb5ae), GREY_A = new THREE.Color(0xaaa29b);

function renderLungs(t, shot) {
  // lungs appear on "Pneumonieprophylaxe" — nothing before the keyword
  const show = P(t, C.title - 0.25, 0.9);
  L.g.visible = show > 0.002;
  L.ped.visible = L.g.visible;
  L.ped.scale.setScalar(Math.max(0.001, show));
  const k = breathK(t);
  L.g.scale.setScalar(0.7 + 0.3 * show);
  L.g.rotation.y = Math.sin(t * 0.12) * 0.18;
  // inflammation (Pneumonie shot): alveoli fill with a murky tint, lower lobes first
  const inflam = P(t, C.p_entz, 1.6) * (1 - P(t, C.atel - 0.6, 1.0));
  // Atelektase: lower right lobe loses its light and deflates
  const atel = P(t, C.a_def, 1.4) * (1 - P(t, C.ziele - 0.4, 0.6));
  L.airMat.emissiveIntensity = 0.55 * (1 - B.phase(t) / 0.4 > 0 && !B.exhaling(t) ? Math.sin((B.phase(t) / 0.4) * Math.PI) : 0) * show;
  L.lobes.forEach((lobe, i) => {
    const d = lobe.userData.base;
    const isAtel = i === 2;
    const a = isAtel ? atel : 0;
    const inf = inflam; // spots appear lower lobes first (threshold per spot)
    const live = 1 - a;
    const breathe = 1 + 0.07 * k * live;
    const deflate = 1 - 0.2 * a;
    lobe.scale.set(d[3] * breathe * deflate, d[4] * (1 + 0.04 * k * live) * (1 - 0.1 * a), d[5] * breathe * (1 - 0.25 * a));
    lobe.position.set(d[0] * (1 + 0.03 * k * live), d[1] - 0.05 * a, d[2]);
    lobe.material.color.copy(PINK).lerp(MURKY, inf * 0.3).lerp(GREY, a);
    lobe.material.emissiveIntensity = 0.06 * (1 - a) + 0.05 * k * (1 - a);
    lobe.material.opacity = 0.93 - 0.1 * a;
    const am = L.alv[i];
    am.userData.spots.forEach((sp, j) => {
      const grow = clamp((inf * 1.05 - sp.th) / 0.3);
      const sc = grow * sp.size;
      v3.set(sp.dir.x * lobe.scale.x, sp.dir.y * lobe.scale.y, sp.dir.z * lobe.scale.z).multiplyScalar(0.97).add(lobe.position);
      am.setMatrixAt(j, mtx.compose(v3, q0, s3.set(sc, sc, sc * 0.3)));
    });
    am.instanceMatrix.needsUpdate = true;
  });
  // camera: intro keeps the lungs off-centre (title + big orbs centred); then make room for a card
  const keys = [
    { t: 0, p: [0, 2.0, 9.4], l: [0, 2.35, 0], o: 600 },
    { t: C.title - 0.4, p: [0, 1.9, 8.8], l: [0, 2.3, 0], o: 600, d: 2.4 },
    { t: C.pneu - 0.3, p: [0.2, 1.75, 6.8], l: [0, 1.4, 0], o: 400, d: 1.4 },
    { t: C.p_entz - 0.2, p: [-0.15, 1.6, 6.1], l: [-0.05, 1.35, 0], o: 400, d: 1.8 },
    { t: C.atel - 0.2, p: [0.1, 1.75, 6.8], l: [0, 1.4, 0], o: 400, d: 0.01 },
    { t: C.a_def - 0.3, p: [-0.45, 1.5, 6.0], l: [-0.25, 1.3, 0], o: 400, d: 1.8 },
    { t: C.a_zus - 0.4, p: [0.1, 1.75, 6.8], l: [0, 1.4, 0], o: 400, d: 1.8 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.04);
  const wp = L.lobes[2].getWorldPosition(new THREE.Vector3());
  W.pin(document.getElementById("a-pin"), [wp.x, wp.y - 0.28, wp.z + 0.3]);
  W.renderer.render(lungScene, W.camera);
}

/* ================================================================== DEVICES (SMI + PEP) */
const devScene = W.studioScene(0xefe9dc);
const D = {};
{
  add(devScene, cyl(1.7, 0.06, 96), clay(0xdfe9e2), [0, 0.03, 0]);
  const clear = () => new THREE.MeshStandardMaterial({ color: 0xe8f4ef, roughness: 0.15, transparent: true, opacity: 0.32, depthWrite: false });
  // SMI trainer (left): base, one clear chamber with a ball, hose + mouthpiece
  const smi = new THREE.Group();
  smi.position.set(-0.75, 0.06, 0);
  devScene.add(smi);
  D.smi = smi;
  add(smi, box(0.62, 0.12, 0.36), clay(0x2ecc91), [0, 0.06, 0]);
  add(smi, box(0.5, 0.04, 0.26), clay(0x1b8f5a), [0, 0.14, 0]);
  D.chamber = add(smi, cyl(0.12, 0.86, 48), clear(), [0, 0.58, 0], [0, 0, 0], { cast: false });
  add(smi, new THREE.TorusGeometry(0.12, 0.012, 8, 48), clay(0x1b8f5a), [0, 1.0, 0], [Math.PI / 2, 0, 0]);
  for (let i = 1; i <= 3; i++) add(smi, new THREE.TorusGeometry(0.121, 0.005, 6, 48), clay(0x9fb8ad), [0, 0.2 + i * 0.2, 0], [Math.PI / 2, 0, 0], { cast: false });
  D.ball = add(smi, sphere(0.09, 32, 24), clay(0xf4c430), [0, 0.25, 0]);
  add(smi, tube([[0.3, 0.1, 0.05], [0.55, 0.18, 0.25], [0.6, 0.55, 0.42], [0.45, 0.8, 0.55]], 0.032), clay(0xcfd9d4));
  add(smi, cyl(0.045, 0.16, 24), clay(0x1b8f5a), [0.42, 0.86, 0.57], [0.6, 0, 0.3]);
  // PEP device (right): mouthpiece tube + clear housing with a ball inside
  const pep = new THREE.Group();
  pep.position.set(0.95, 0.75, 0.1);
  devScene.add(pep);
  D.pep = pep;
  add(pep, cyl(0.05, 0.62, 32), clay(0xf4c430), [-0.32, 0, 0], [0, 0, Math.PI / 2]);
  add(pep, cyl(0.06, 0.12, 32), clay(0x1b8f5a), [-0.68, 0, 0], [0, 0, Math.PI / 2]);
  add(pep, sphere(0.2, 40, 28), clear(), [0.08, 0, 0], [0, 0, 0], { cast: false });
  add(pep, new THREE.TorusGeometry(0.2, 0.012, 8, 48), clay(0x1b8f5a), [0.08, 0, 0], [0, Math.PI / 2, 0]);
  D.pepBall = add(pep, sphere(0.085, 32, 24), clay(0xffffff), [0.04, -0.06, 0]);
  // stand belongs to the PEP group so it appears with the device
  add(pep, cyl(0.04, 0.68, 16), clay(0xcfd9d4), [0, -0.37, 0]);
  add(pep, cyl(0.16, 0.05, 32), clay(0xcfd9d4), [0, -0.69, 0]);
  // air particles leaving the PEP slowly
  D.air = new THREE.InstancedMesh(sphere(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0xbfeedd, emissive: 0x2ecc91, emissiveIntensity: 0.4, transparent: true, opacity: 0.8 }), 18);
  devScene.add(D.air);
}
const mtx = new THREE.Matrix4(), q0 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();

function renderDevices(t, shot) {
  // SMI ball: a small lift on each breath, a full rise + short hold on the deep inhalation
  const rise = (a) => P(t, a, 1.6) * (1 - P(t, a + 3.0, 0.7));
  const full = Math.max(rise(C.ball + 0.6), rise(C.smi_ein));
  const small = 0.12 * B.v(t) * (B.exhaling(t) ? 0.6 : 1);
  D.ball.position.y = 0.25 + 0.62 * Math.max(full, small);
  // PEP appears with its keyword; ball rattles against the exhale (resistance)
  const pepIn = P(t, C.pep, 0.8);
  D.pep.visible = pepIn > 0.01;
  D.pep.scale.setScalar(0.6 + 0.4 * pepIn);
  const active = P(t, C.pep_kugel - 0.4, 0.6);
  const ex = B.exhaling(t) ? Math.sin(((B.phase(t) - 0.4) / 0.6) * Math.PI) : 0;
  D.pepBall.position.set(0.04 + 0.05 * ex * active, -0.06 + 0.07 * ex * active + 0.012 * Math.sin(t * 47) * ex * active, 0);
  for (let i = 0; i < 18; i++) {
    const rate = 0.5;
    const age = ((t * rate + hash(i)) % 1) / rate; // 0..2 s
    const born = t - age;
    const on = active * (B.exhaling(born) ? 1 : 0) * (born > C.pep_kugel ? 1 : 0);
    const x = 1.28 + age * 0.22; // slow, braked outflow
    const y = 0.75 + Math.sin(i * 1.7 + age * 2) * 0.05 + age * 0.06;
    const s = on * 0.028 * (1 - age / 2);
    D.air.setMatrixAt(i, mtx.compose(v3.set(x, y, 0.1 + (hash(i + 9) - 0.5) * 0.12), q0, s3.set(s, s, s)));
  }
  D.air.instanceMatrix.needsUpdate = true;
  const keys = [
    { t: shot.a, p: [-0.4, 1.4, 3.6], l: [-0.6, 0.6, 0], o: 360 },
    { t: C.smi_ein - 0.6, p: [-0.75, 1.0, 2.5], l: [-0.75, 0.6, 0], o: 360, d: 1.6 },
    { t: C.pep - 0.2, p: [0.1, 1.35, 4.0], l: [0.1, 0.62, 0], o: 360, d: 1.6 },
    { t: C.dauer - 0.2, p: [0.1, 1.5, 4.2], l: [0.1, 0.6, 0], o: 360, d: 1.6 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.03);
  W.pin(document.getElementById("smi-pin"), [-0.75, 1.12, 0]);
  W.pin(document.getElementById("pep-pin"), [1.03, 0.98, 0.1]);
  W.renderer.render(devScene, W.camera);
}

/* ================================================================== BOTTLE (Blubberflasche) */
const botScene = W.studioScene(0xf1ebde);
const BT = {};
{
  add(botScene, cyl(0.9, 0.06, 96), clay(0xdfe9e2), [0, 0.03, 0]);
  const prof = [[0.001, 0], [0.3, 0], [0.33, 0.04], [0.34, 0.12], [0.34, 0.92], [0.3, 1.04], [0.16, 1.18], [0.12, 1.3], [0.125, 1.38]].map((p) => new THREE.Vector2(p[0], p[1]));
  const glass = new THREE.MeshStandardMaterial({ color: 0xe8f4ef, roughness: 0.12, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
  add(botScene, new THREE.LatheGeometry(prof, 64), glass, [0, 0.06, 0], [0, 0, 0], { cast: false });
  BT.waterTop = 0.06 + 0.47;
  add(botScene, cyl(0.325, 0.45, 64), new THREE.MeshStandardMaterial({ color: 0x8fd9c4, roughness: 0.3, transparent: true, opacity: 0.55, depthWrite: false }), [0, 0.06 + 0.245, 0], [0, 0, 0], { cast: false });
  add(botScene, new THREE.CylinderGeometry(0.325, 0.325, 0.004, 64), new THREE.MeshStandardMaterial({ color: 0xbfeedd, roughness: 0.2, transparent: true, opacity: 0.7 }), [0, BT.waterTop, 0], [0, 0, 0], { cast: false });
  add(botScene, tube([[1.1, 1.05, 0.25], [0.7, 1.75, 0.1], [0.12, 1.7, 0], [0.02, 1.25, 0], [0.0, 0.2, 0]], 0.028, false, 160), new THREE.MeshStandardMaterial({ color: 0xd2ded9, roughness: 0.3, transparent: true, opacity: 0.8 }));
  add(botScene, cyl(0.05, 0.14, 24), clay(0x1b8f5a), [1.12, 1.0, 0.26], [0.5, 0, 0.6]);
  BT.bub = new THREE.InstancedMesh(sphere(1, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, transparent: true, opacity: 0.85 }), 40);
  BT.bub.castShadow = false;
  botScene.add(BT.bub);
}
function renderBottle(t, shot) {
  const go = P(t, C.b_pust, 0.5);
  for (let i = 0; i < 40; i++) {
    const rate = 1.1;
    const age = ((t * rate + hash(i + 3)) % 1) / rate;
    const born = t - age;
    const y = 0.22 + age * 0.75;
    const on = go * (B.exhaling(born) ? 1 : 0) * (born > C.b_pust ? 1 : 0) * (y < BT.waterTop - 0.01 ? 1 : 0);
    const s = on * (0.03 + hash(i) * 0.025) * (1 + age * 0.6);
    const x = (hash(i + 1) - 0.5) * 0.12 + Math.sin(age * 9 + i) * 0.02;
    BT.bub.setMatrixAt(i, mtx.compose(v3.set(x, y, (hash(i + 2) - 0.5) * 0.12), q0, s3.set(s, s, s)));
  }
  BT.bub.instanceMatrix.needsUpdate = true;
  const keys = [
    { t: shot.a, p: [0.4, 1.6, 4.9], l: [0.3, 0.85, 0], o: 360 },
    { t: C.b_pust - 0.4, p: [0.15, 1.25, 4.1], l: [0.1, 0.66, 0], o: 360, d: 1.8 },
    { t: C.b_entf - 0.4, p: [0.4, 1.6, 4.9], l: [0.3, 0.85, 0], o: 360, d: 1.8 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.03);
  W.renderer.render(botScene, W.camera);
}

/* ================================================================== BED (case study) */
const bedScene = W.studioScene(0xf1ebde);
const BD = {};
{
  const bed = new THREE.Group();
  bed.rotation.y = -0.5;
  bedScene.add(bed);
  BD.bed = bed;
  const frame = clay(0xb8c2c8), dark = clay(0x3d4448);
  for (const [x, z] of [[-0.95, -0.42], [0.95, -0.42], [-0.95, 0.42], [0.95, 0.42]]) {
    add(bed, cyl(0.035, 0.48, 16), frame, [x, 0.3, z]);
    add(bed, sphere(0.06, 16, 12), dark, [x, 0.06, z]);
  }
  add(bed, box(2.1, 0.1, 0.96), frame, [0, 0.56, 0]);
  add(bed, box(0.08, 0.7, 1.0), clay(0xe9e2d3), [-1.06, 0.82, 0]);
  add(bed, box(0.08, 0.5, 1.0), clay(0xe9e2d3), [1.06, 0.72, 0]);
  add(bed, box(1.25, 0.16, 0.9), clay(0x8fd9c4), [0.36, 0.69, 0]); // foot section (mint sheet)
  add(bed, box(0.9, 0.04, 0.04), frame, [0.2, 0.86, 0.5]);
  // back section pivots at the middle of the bed
  const back = new THREE.Group();
  back.position.set(-0.26, 0.62, 0);
  bed.add(back);
  BD.back = back;
  add(back, box(0.82, 0.16, 0.9), clay(0x8fd9c4), [-0.41, 0.07, 0]);
  const pillow = add(back, sphere(1, 32, 20), clay(0xffffff), [-0.6, 0.2, 0]);
  pillow.scale.set(0.2, 0.08, 0.34);
}
function renderBed(t, shot) {
  BD.back.rotation.z = -0.62 * P(t, C.m_hoch, 1.6);
  const keys = [
    { t: shot.a, p: [0.2, 2.2, 4.6], l: [-0.1, 0.65, 0], o: 380 },
    { t: C.m_hoch - 0.4, p: [-0.3, 1.6, 3.6], l: [-0.35, 0.75, 0], o: 380, d: 1.8 },
    { t: C.m_ase, p: [0.2, 2.2, 4.6], l: [-0.1, 0.65, 0], o: 380, d: 2.0 },
  ];
  W.applyCam(W.camAt(keys, t), t, 0.03);
  W.renderer.render(bedScene, W.camera);
}

W.mount({ lungs: renderLungs, devices: renderDevices, bottle: renderBottle, bed: renderBed });
