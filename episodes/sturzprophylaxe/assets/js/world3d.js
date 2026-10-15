// Pflege-WG · Sturzprophylaxe — 3D layer.
// Every frame is a pure function of HyperFrames time (hf-seek): no clocks, no RAF loop,
// no randomness, no external models. All objects are built from primitives in a
// matte "clay" material and lit like a soft studio.
import * as THREE from "three";

const C = window.CUES;
const SH = window.SHOTS;
const W = 1920;
const H = 1080;

/* ------------------------------------------------------------------ helpers */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => {
  x = clamp(x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const P = (t, a, d = 1) => ease((t - a) / d); // eased 0→1 progress starting at a
const lerp = (a, b, k) => a + (b - a) * k;
const TAU = Math.PI * 2;

// "draft" renders the 3D at half resolution with lighter shadows (fast review renders);
// the final render uses full resolution. Read once — variables never change mid-render.
const VARS = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
const DRAFT = VARS.quality === "draft";
const RES = DRAFT ? 0.5 : 1;
const SHADOW = DRAFT ? 1024 : 2048;
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !DRAFT, preserveDrawingBuffer: true });
renderer.setSize(W * RES, H * RES, false);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(34, W / H, 0.05, 80);

const clay = (hex, extra = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.92, metalness: 0, ...extra });
function add(parent, geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.recv !== false;
  parent.add(m);
  return m;
}
const cyl = (r, h, s = 32) => new THREE.CylinderGeometry(r, r, h, s);
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);

function studioScene(bg) {
  const s = new THREE.Scene();
  s.background = new THREE.Color(bg);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.2 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  s.add(floor);
  s.add(new THREE.HemisphereLight(0xfff8ec, 0xd9cdb6, 1.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3.5, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(SHADOW, SHADOW);
  key.shadow.radius = 6;
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 25 });
  key.shadow.bias = -0.0004;
  s.add(key);
  const rim = new THREE.DirectionalLight(0xcff5e4, 0.9);
  rim.position.set(-5, 3, -4);
  s.add(rim);
  return s;
}

/* camera keyframes: [{t, p:[x,y,z], l:[x,y,z], d, o}] — eased hand-offs, o = view offset px */
function camAt(keys, t) {
  const cur = { p: [...keys[0].p], l: [...keys[0].l], o: keys[0].o || 0, f: keys[0].f || 34 };
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    const f = P(t, k.t, k.d || 1.6);
    if (f <= 0) break;
    for (let j = 0; j < 3; j++) {
      cur.p[j] = lerp(cur.p[j], k.p[j], f);
      cur.l[j] = lerp(cur.l[j], k.l[j], f);
    }
    cur.o = lerp(cur.o, k.o || 0, f);
    cur.f = lerp(cur.f, k.f || 34, f);
  }
  return cur;
}
function applyCam(c, t, drift = 0.08) {
  camera.position.set(c.p[0] + Math.sin(t * 0.21) * drift, c.p[1] + Math.sin(t * 0.17) * drift * 0.5, c.p[2] + Math.cos(t * 0.19) * drift);
  camera.lookAt(c.l[0], c.l[1], c.l[2]);
  if (Math.abs(camera.fov - c.f) > 1e-3) camera.fov = c.f;
  if (Math.abs(c.o) > 0.5) camera.setViewOffset(W, H, c.o, 0, W, H);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

/* ================================================================== ROOM */
const room = new THREE.Scene();
const R = {};
{
  const s = room;
  s.background = new THREE.Color(0x0d1b2a);
  const floor = add(s, new THREE.PlaneGeometry(16, 16), clay(0xcfc6b5), [0, 0, 0], [-Math.PI / 2, 0, 0], { cast: false });
  R.floor = floor;
  add(s, new THREE.PlaneGeometry(16, 4.2), clay(0xe9e2d3), [0, 2.1, -3.2], [0, 0, 0], { cast: false });
  add(s, new THREE.PlaneGeometry(16, 4.2), clay(0xe3dccb), [-3.6, 2.1, 0], [0, Math.PI / 2, 0], { cast: false });
  add(s, box(16, 0.12, 0.04), clay(0xbfb6a3), [0, 0.06, -3.18]);
  add(s, box(0.04, 0.12, 16), clay(0xbfb6a3), [-3.58, 0.06, 0]);

  // window (moonlight)
  add(s, box(1.5, 1.3, 0.08), clay(0xf3eee4), [1.7, 1.95, -3.17]);
  R.windowGlass = add(s, new THREE.PlaneGeometry(1.3, 1.1), new THREE.MeshStandardMaterial({ color: 0x9fc3ff, emissive: 0x6f9be6, emissiveIntensity: 0.6, roughness: 0.4 }), [1.7, 1.95, -3.12], [0, 0, 0], { cast: false });
  add(s, box(0.05, 1.1, 0.03), clay(0xf3eee4), [1.7, 1.95, -3.1]);

  // door + threshold
  add(s, box(0.06, 2.15, 1.05), clay(0xb9a58a), [-3.56, 1.08, 1.45]);
  add(s, box(0.08, 2.25, 0.08), clay(0xf3eee4), [-3.55, 1.12, 0.9]);
  add(s, box(0.08, 2.25, 0.08), clay(0xf3eee4), [-3.55, 1.12, 2.0]);
  add(s, box(0.08, 0.08, 1.18), clay(0xf3eee4), [-3.55, 2.24, 1.45]);
  add(s, new THREE.SphereGeometry(0.035, 16, 12), clay(0x8a7a63), [-3.5, 1.0, 1.05]);
  R.threshold = add(s, box(0.32, 0.03, 1.05), clay(0x9a917f), [-3.34, 0.015, 1.45]);

  // bed
  const bed = new THREE.Group();
  bed.position.set(0.2, 0, -2.0);
  s.add(bed);
  R.bed = bed;
  R.bedLegs = [];
  for (const [x, z] of [[-0.95, -0.42], [0.95, -0.42], [-0.95, 0.42], [0.95, 0.42]]) {
    const leg = add(bed, cyl(0.035, 1, 16), clay(0x9aa3a8), [x, 0.5, z]);
    R.bedLegs.push(leg);
    add(bed, new THREE.SphereGeometry(0.05, 16, 12), clay(0x3d4448), [x, 0.05, z]);
  }
  const top = new THREE.Group();
  bed.add(top);
  R.bedTop = top;
  add(top, box(2.1, 0.14, 1.0), clay(0xb8c2c8), [0, 0, 0]);
  add(top, box(2.0, 0.2, 0.94), clay(0xf4f1ea), [0, 0.17, 0]);
  add(top, new THREE.SphereGeometry(1, 32, 16), clay(0xffffff), [-0.72, 0.31, 0], [0, 0, 0]).scale.set(0.26, 0.08, 0.36);
  add(top, box(1.25, 0.08, 0.98), clay(0x8fd4b6), [0.33, 0.3, 0]);
  add(top, box(0.08, 0.95, 1.04), clay(0xc6ced3), [-1.07, 0.2, 0]);
  add(top, box(0.08, 0.6, 1.04), clay(0xc6ced3), [1.07, 0.06, 0]);
  add(top, box(1.1, 0.05, 0.03), clay(0x9aa3a8), [0.1, 0.38, 0.52]);
  R.callBtn = add(top, box(0.1, 0.06, 0.05), new THREE.MeshStandardMaterial({ color: 0xd9362b, emissive: 0xd9362b, emissiveIntensity: 0.0, roughness: 0.6 }), [-0.35, 0.38, 0.55]);

  // nightstand + lamp + pill bottle
  const ns = new THREE.Group();
  ns.position.set(-1.45, 0, -2.55);
  s.add(ns);
  add(ns, box(0.52, 0.56, 0.46), clay(0xd9cdb8), [0, 0.28, 0]);
  add(ns, box(0.44, 0.02, 0.01), clay(0xb3a68f), [0, 0.38, 0.235]);
  add(ns, cyl(0.09, 0.04), clay(0xe8e2d6), [0.08, 0.58, 0.02]);
  add(ns, cyl(0.014, 0.32, 12), clay(0x9aa3a8), [0.08, 0.76, 0.02]);
  R.lampShade = add(ns, new THREE.ConeGeometry(0.17, 0.2, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0xf6efe0, emissive: 0xffd9a0, emissiveIntensity: 0.0, roughness: 0.9, side: THREE.DoubleSide }), [0.08, 0.96, 0.02]);
  R.pill = add(ns, cyl(0.04, 0.11, 20), clay(0xf08a24), [-0.14, 0.615, 0.08]);
  add(ns, cyl(0.043, 0.035, 20), clay(0xffffff), [-0.14, 0.685, 0.08]);

  // loose lamp cable: lamp → floor → towards the door
  const pts = [
    [-1.37, 0.58, -2.53], [-1.2, 0.45, -2.78], [-1.1, 0.016, -2.7], [-0.75, 0.016, -1.3],
    [-1.25, 0.016, -0.55], [-2.05, 0.016, 0.1], [-2.6, 0.016, 0.75], [-3.05, 0.016, 1.15],
  ].map((p) => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const cableGeo = new THREE.TubeGeometry(curve, 260, 0.016, 10, false);
  R.cable = add(s, cableGeo, clay(0x1b1f22, { roughness: 0.55 }));
  R.cableIndex = cableGeo.index.count;
  R.cableMid = curve.getPoint(0.62);

  // rug (trip hazard) + puddle
  R.rug = add(s, box(1.3, 0.025, 0.8), clay(0x7fc4a4), [0.95, 0.0125, -0.55], [0, 0.25, 0]);
  R.puddle = add(s, new THREE.CircleGeometry(0.34, 48), new THREE.MeshStandardMaterial({ color: 0xa9cfe8, roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.8 }), [-2.35, 0.004, 1.15], [-Math.PI / 2, 0, 0], { cast: false });
  R.puddle.scale.set(1.5, 1, 1);

  // wheelchair
  const wc = new THREE.Group();
  wc.position.set(2.15, 0, 0.55);
  wc.rotation.y = -0.75;
  s.add(wc);
  R.wc = wc;
  const metal = clay(0x8f9aa1, { roughness: 0.55 });
  for (const z of [-0.28, 0.28]) {
    add(wc, new THREE.TorusGeometry(0.3, 0.028, 12, 48), clay(0x2b3035), [-0.05, 0.31, z]);
    add(wc, new THREE.TorusGeometry(0.26, 0.008, 8, 48), metal, [-0.05, 0.31, z * 1.08]);
    add(wc, cyl(0.035, 0.06, 16), metal, [-0.05, 0.31, z], [Math.PI / 2, 0, 0]);
    add(wc, new THREE.TorusGeometry(0.06, 0.018, 10, 24), clay(0x2b3035), [0.38, 0.075, z * 0.85]);
    add(wc, box(0.62, 0.025, 0.025), metal, [0.12, 0.47, z]);
    add(wc, box(0.025, 0.55, 0.025), metal, [-0.22, 0.72, z]);
    add(wc, box(0.3, 0.025, 0.05), clay(0x2b3035), [-0.04, 0.68, z * 1.05]);
  }
  add(wc, box(0.46, 0.06, 0.52), clay(0x1b8f5a), [0.04, 0.5, 0]);
  add(wc, box(0.05, 0.42, 0.52), clay(0x1b8f5a), [-0.22, 0.76, 0]);
  add(wc, box(0.16, 0.02, 0.36), metal, [0.42, 0.12, 0]);
  R.brakes = [];
  R.brakeRings = [];
  for (const z of [-0.36, 0.36]) {
    const lever = add(wc, box(0.03, 0.16, 0.03), clay(0xd9362b, { roughness: 0.6 }), [0.14, 0.44, z]);
    lever.geometry.translate(0, 0.08, 0);
    R.brakes.push(lever);
    R.brakeRings.push(add(wc, new THREE.TorusGeometry(0.075, 0.014, 10, 32), new THREE.MeshStandardMaterial({ color: 0x9aa3a8, emissive: 0x2ecc91, emissiveIntensity: 0, roughness: 0.5 }), [-0.05, 0.31, z * 0.93]));
  }

  // grab bar on the left wall
  R.grab = [];
  const gmat = new THREE.MeshStandardMaterial({ color: 0xdfe6e8, emissive: 0x2ecc91, emissiveIntensity: 0, roughness: 0.4, metalness: 0.2 });
  R.grabMat = gmat;
  add(s, cyl(0.025, 0.7, 20), gmat, [-3.48, 1.0, -1.05], [Math.PI / 2, 0, 0]);
  add(s, cyl(0.035, 0.12, 16), gmat, [-3.53, 1.0, -1.37], [0, 0, Math.PI / 2]);
  add(s, cyl(0.035, 0.12, 16), gmat, [-3.53, 1.0, -0.73], [0, 0, Math.PI / 2]);

  // night light
  R.nlMat = new THREE.MeshStandardMaterial({ color: 0xf3e6c8, emissive: 0xffc46b, emissiveIntensity: 0, roughness: 0.5 });
  add(s, box(0.18, 0.1, 0.04), R.nlMat, [-0.75, 0.3, -3.17]);
  R.nl = new THREE.PointLight(0xffc06a, 0, 5.5, 1.6);
  R.nl.position.set(-0.75, 0.32, -2.95);
  s.add(R.nl);

  // commode (Toilettenstuhl)
  const cm = new THREE.Group();
  s.add(cm);
  R.commode = cm;
  const cmFrame = clay(0xdfe6e8, { roughness: 0.6 });
  add(cm, box(0.5, 0.06, 0.5), clay(0xf6f3ec), [0, 0.48, 0]);
  add(cm, new THREE.TorusGeometry(0.15, 0.03, 12, 36), clay(0xffffff), [0, 0.52, 0], [Math.PI / 2, 0, 0]);
  add(cm, box(0.06, 0.5, 0.5), cmFrame, [-0.24, 0.76, 0]);
  R.cmArms = new THREE.MeshStandardMaterial({ color: 0x1b8f5a, emissive: 0x2ecc91, emissiveIntensity: 0, roughness: 0.6 });
  for (const z of [-0.25, 0.25]) add(cm, box(0.46, 0.04, 0.05), R.cmArms, [0, 0.72, z]);
  R.cmFeet = new THREE.MeshStandardMaterial({ color: 0x3d4448, emissive: 0x2ecc91, emissiveIntensity: 0, roughness: 0.6 });
  for (const [x, z] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
    add(cm, cyl(0.02, 0.48, 12), cmFrame, [x, 0.24, z]);
    add(cm, new THREE.SphereGeometry(0.04, 12, 10), R.cmFeet, [x, 0.03, z]);
  }
  add(cm, cyl(0.16, 0.18, 32), clay(0xcfd6d9), [0, 0.32, 0]);

  // lights
  R.hemi = new THREE.HemisphereLight(0xfff6e8, 0xc9bfae, 1.2);
  s.add(R.hemi);
  R.key = new THREE.DirectionalLight(0xffffff, 2.0);
  R.key.castShadow = true;
  R.key.shadow.mapSize.set(SHADOW, SHADOW);
  R.key.shadow.radius = 5;
  Object.assign(R.key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 30 });
  R.key.shadow.bias = -0.0004;
  s.add(R.key);
  s.add(R.key.target);
  R.spot = new THREE.SpotLight(0xcfe2ff, 0, 9, 0.36, 0.75, 1.2);
  R.spot.position.set(-1.6, 3.6, 0.2);
  R.spot.target.position.set(-1.7, 0, 0.1);
  R.spot.castShadow = true;
  R.spot.shadow.mapSize.set(SHADOW / 2, SHADOW / 2);
  s.add(R.spot);
  s.add(R.spot.target);
  R.beam = add(s, new THREE.ConeGeometry(1.25, 3.6, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfe2ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), [-1.65, 1.8, 0.15], [0, 0, 0], { cast: false, recv: false });
}

const DAY = { bg: new THREE.Color(0xe9e2d3), sky: new THREE.Color(0xfff6e8), gnd: new THREE.Color(0xc9bfae), hemi: 1.25, key: 2.1, keyCol: new THREE.Color(0xfff3e2), win: 0.25 };
const NIGHT = { bg: new THREE.Color(0x0b1724), sky: new THREE.Color(0x5276b3), gnd: new THREE.Color(0x101c2b), hemi: 0.55, key: 1.3, keyCol: new THREE.Color(0x9bbcff), win: 1.1 };
const tmpC = new THREE.Color();

function renderRoom(t, shot) {
  const id = shot.id;
  // --- mood (0 = day, 1 = night)
  let night = shot.mood === "night" ? 1 : 0;
  if (id === "env2") night = 0.75 * P(t, C.m_nachtlicht, 1.6);
  room.background.copy(DAY.bg).lerp(NIGHT.bg, night);
  R.hemi.color.copy(DAY.sky).lerp(NIGHT.sky, night);
  R.hemi.groundColor.copy(DAY.gnd).lerp(NIGHT.gnd, night);
  R.hemi.intensity = lerp(DAY.hemi, NIGHT.hemi, night);
  R.key.color.copy(DAY.keyCol).lerp(NIGHT.keyCol, night);
  R.key.intensity = lerp(DAY.key, NIGHT.key, night);
  R.key.position.set(lerp(4.5, 2.2, night), lerp(7, 4.2, night), lerp(5, -2.4, night));
  R.key.target.position.set(lerp(-0.4, -0.6, night), 0, lerp(-1, 0.6, night));
  R.windowGlass.material.emissiveIntensity = lerp(DAY.win, NIGHT.win, night);

  // --- intro spotlight on the cable
  const spot = id === "intro" ? P(t, 1.0, 3.0) * (1 - 0.55 * P(t, C.welcome, 3)) : 0;
  R.spot.intensity = 70 * spot;
  R.beam.material.opacity = 0.09 * spot;
  R.beam.visible = spot > 0.001;

  // --- cable: present in the intro, the measures scene until "Kabel", the case until "Kabel wegräumen"
  let cableK = 1;
  if (id === "env") cableK = 1 - P(t, C.m_kabel, 1.2);
  else if (id === "case") cableK = 1 - P(t, C.fall_s_kabel, 1.4);
  else if (id !== "intro") cableK = 0;
  R.cable.visible = cableK > 0.002;
  R.cable.geometry.setDrawRange(0, Math.floor((R.cableIndex * cableK) / 6) * 6);

  // --- rug & puddle (env only; tidy afterwards)
  const rugK = id === "env" ? 1 - P(t, C.m_teppich + 0.2, 1.0) : id === "intro" ? 1 : 0;
  R.rug.visible = rugK > 0.002;
  R.rug.scale.set(lerp(0.2, 1, rugK), 1, lerp(0.2, 1, rugK));
  const pudK = id === "env" ? 1 - P(t, C.m_aufwischen, 1.0) : 0;
  R.puddle.visible = pudK > 0.002;
  R.puddle.scale.set(1.5 * pudK, pudK, 1);

  // --- threshold marked in colour
  const mark = id === "env" ? P(t, C.m_farbig, 0.8) : id === "intro" || id === "case" ? 0 : 1;
  R.threshold.material.color.set(0x9a917f).lerp(tmpC.set(0xf4c430), mark);

  // --- wheelchair brakes
  const brake = id === "env" ? P(t, C.m_feststellen, 0.7) : id === "intro" || id === "case" ? 0 : 1;
  R.brakes.forEach((b) => (b.rotation.z = lerp(-0.7, 0.25, brake)));
  R.brakeRings.forEach((r) => (r.material.emissiveIntensity = 1.4 * brake));
  R.wc.visible = id === "env" || id === "env2" || id === "intro";

  // --- bed height
  const low = id === "env" ? P(t, C.m_betthoehe + 0.3, 1.8) : id === "intro" || id === "case" ? 0 : 1;
  const legH = lerp(0.62, 0.36, low);
  R.bedLegs.forEach((l) => {
    l.scale.y = legH;
    l.position.y = legH / 2;
  });
  R.bedTop.position.y = legH + 0.07;

  // --- grab bar glow
  const grab = id === "env2" ? P(t, C.m_haltegriffe + 0.4, 0.8) * (0.55 + 0.45 * P(t, C.m_festigkeit, 0.8)) : 0;
  R.grabMat.emissiveIntensity = 1.2 * grab;

  // --- night light
  let nl = 0;
  if (id === "env2") nl = P(t, C.m_nachtlicht, 1.0);
  else if (id === "case") nl = P(t, C.fall_s_licht, 1.0);
  else if (id === "meds3d") nl = 1;
  R.nlMat.emissiveIntensity = 2.4 * nl;
  R.nl.intensity = 6 * nl * (0.5 + 0.5 * night);

  // --- call button (case: "vor dem Aufstehen melden")
  R.callBtn.material.emissiveIntensity = id === "case" ? 1.6 * P(t, C.fall_s_melden, 0.8) : 0;

  // --- commode slides next to the bed
  let slide = 0;
  if (id === "meds3d") slide = P(t, C.med_stuhl, 1.8);
  else if (id === "case") slide = P(t, C.fall_s_stuhl, 1.8);
  R.commode.visible = id === "meds3d" || id === "case";
  R.commode.position.set(lerp(3.0, 1.55, slide), 0, lerp(2.4, -1.05, slide));
  R.commode.rotation.y = lerp(-1.2, -Math.PI / 2, slide);
  R.cmFeet.emissiveIntensity = id === "meds3d" ? 1.5 * P(t, C.med_fest, 0.6) : 0;
  R.cmArms.emissiveIntensity = id === "meds3d" ? 0.9 * P(t, C.med_armlehnen, 0.6) : 0;

  // --- camera
  const keys = ROOM_CAMS[id] || ROOM_CAMS.env;
  applyCam(camAt(keys, t), t, 0.05);
  renderer.render(room, camera);
  if (id === "case") placeAnchors(t);
}

const ROOM_CAMS = {
  intro: [
    { t: 0, p: [4.8, 3.6, 5.6], l: [-0.6, 0.5, -1.2] },
    { t: 1.5, p: [1.2, 1.25, 2.2], l: [-1.8, 0.05, 0.35], d: 9.5 },
    { t: C.welcome - 0.6, p: [4.6, 3.1, 5.2], l: [-0.5, 0.4, -1.0], d: 6 },
  ],
  env: [
    { t: C.massnahmen_intro, p: [4.6, 3.0, 4.9], l: [-0.5, 0.5, -1.0], o: 320 },
    { t: C.m_stolper - 0.3, p: [1.1, 2.3, 2.6], l: [-1.4, 0.0, -0.6], o: 330 },
    { t: C.m_schwellen - 0.3, p: [-0.4, 1.7, 3.6], l: [-2.9, 0.0, 1.2], o: 330 },
    { t: C.m_rollstuehle - 0.3, p: [4.0, 1.8, 3.4], l: [2.0, 0.4, 0.5], o: 330 },
    { t: C.m_betthoehe - 0.4, p: [2.6, 1.6, 1.3], l: [0.1, 0.5, -2.0], o: 330 },
  ],
  env2: [
    { t: C.m_haltegriffe, p: [-0.3, 1.6, 2.7], l: [-3.4, 0.95, -1.0], o: 330 },
    { t: C.m_sitz, p: [1.8, 2.2, 3.4], l: [-1.0, 0.6, -1.4], o: 330, d: 2.4 },
    { t: C.m_nachtlicht - 0.2, p: [1.3, 1.25, 0.6], l: [-0.8, 0.35, -2.9], o: 330 },
  ],
  meds3d: [
    { t: C.med_stuhl - 1.0, p: [4.2, 2.3, 4.2], l: [1.4, 0.4, -0.2], o: 320 },
    { t: C.med_stuhl + 1.0, p: [3.4, 1.7, 1.6], l: [1.2, 0.5, -1.2], o: 320, d: 2.2 },
  ],
  case: [
    { t: C.fall, p: [4.4, 2.9, 4.8], l: [-0.8, 0.35, -1.2], o: -260 },
    { t: C.fall_dunkel, p: [3.7, 2.4, 3.9], l: [-0.9, 0.35, -1.3], o: -260, d: 6 },
    { t: C.fall_s_kabel - 0.4, p: [4.3, 2.8, 4.6], l: [-0.6, 0.35, -1.0], o: 300, d: 2.5 },
  ],
};

/* 3D-anchored labels (case) */
const anchorEls = {
  med: document.getElementById("a-med"),
  person: document.getElementById("a-person"),
  umg: document.getElementById("a-umg"),
};
const anchorPts = {
  med: new THREE.Vector3(-1.59, 0.72, -2.47),
  person: new THREE.Vector3(0.0, 0.95, -1.8),
  umg: R.cableMid.clone(),
};
const v = new THREE.Vector3();
function placeAnchors() {
  for (const k in anchorEls) {
    const el = anchorEls[k];
    if (!el) continue;
    v.copy(anchorPts[k]).project(camera);
    const x = (v.x * 0.5 + 0.5) * W;
    const y = (-v.y * 0.5 + 0.5) * H;
    el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
  }
}

/* ================================================================== FEMUR */
const femurScene = studioScene(0xefe9dc);
const F = {};
{
  const s = femurScene;
  const g = new THREE.Group();
  g.position.set(0, 0.25, 0);
  s.add(g);
  F.g = g;
  const bone = clay(0xeee3cc);
  F.neckMat = new THREE.MeshStandardMaterial({ color: 0xeee3cc, emissive: 0xd9362b, emissiveIntensity: 0, roughness: 0.9 });
  // shaft (slight bow)
  const shaftPts = [];
  for (let i = 0; i <= 20; i++) {
    const y = i / 20;
    shaftPts.push(new THREE.Vector3(Math.sin(y * Math.PI) * 0.03, 0.18 + y * 1.38, 0));
  }
  add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shaftPts), 40, 0.085, 24, false), bone);
  // distal condyles
  add(g, new THREE.SphereGeometry(0.15, 32, 24), bone, [-0.08, 0.16, 0.02]);
  add(g, new THREE.SphereGeometry(0.14, 32, 24), bone, [0.1, 0.15, 0.0]);
  add(g, new THREE.SphereGeometry(0.12, 32, 24), bone, [0.01, 0.24, 0.04]);
  // proximal: trochanter, neck, head
  add(g, new THREE.SphereGeometry(0.12, 32, 24), bone, [0.11, 1.56, 0.0]);
  add(g, new THREE.SphereGeometry(0.09, 32, 24), bone, [0.0, 1.5, 0.0]);
  const neck = add(g, cyl(0.068, 0.34, 28), F.neckMat, [-0.12, 1.66, 0], [0, 0, 0.82]);
  F.neck = neck;
  add(g, new THREE.SphereGeometry(0.145, 40, 28), bone, [-0.27, 1.78, 0]);
  // fracture line around the neck (jagged ring)
  const ring = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * TAU;
    const j = 0.012 * Math.sin(a * 7) + 0.008 * Math.sin(a * 13 + 1.3);
    ring.push(new THREE.Vector3(Math.cos(a) * 0.072, j, Math.sin(a) * 0.072));
  }
  const crackGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true), 120, 0.011, 8, true);
  F.crack = add(g, crackGeo, new THREE.MeshStandardMaterial({ color: 0xd9362b, emissive: 0xd9362b, emissiveIntensity: 1.6 }), [-0.2, 1.72, 0], [0, 0, 0.82], { cast: false });
  F.crackIndex = crackGeo.index.count;
  // pedestal disc
  add(s, cyl(0.55, 0.06, 64), clay(0xdfe9e2), [0, 0.03, 0]);
}
function renderFemur(t, shot) {
  const a = shot.a;
  const tL = C.f_oshb - 1.4;
  const free = (x) => (x - a) * 0.55;
  let rot;
  if (t < tL) rot = free(t);
  else {
    const r0 = free(tL);
    const target = Math.ceil(r0 / TAU) * TAU + 0.25;
    rot = lerp(r0, target, P(t, tL, 1.4)) + Math.sin((t - tL) * 0.5) * 0.12 * P(t, tL + 1.4, 1);
  }
  F.g.rotation.y = rot;
  const crack = P(t, C.f_oshb, 0.9);
  F.crack.visible = crack > 0.001;
  F.crack.geometry.setDrawRange(0, Math.floor((F.crackIndex * crack) / 6) * 6);
  F.neckMat.emissiveIntensity = 0.55 * crack * (0.75 + 0.25 * Math.sin((t - C.f_oshb) * 3));
  const keys = [
    { t: a, p: [0.1, 1.35, 4.9], l: [0, 1.12, 0], o: 340 },
    { t: C.f_oshb - 0.3, p: [-0.6, 2.05, 2.5], l: [-0.18, 1.88, 0], o: 340, d: 1.4 },
    { t: C.f_kopf + 0.4, p: [0.1, 1.35, 4.9], l: [0, 1.12, 0], o: 340, d: 2.0 },
  ];
  applyCam(camAt(keys, t), t, 0.04);
  renderer.render(femurScene, camera);
}

/* ================================================================== PLINTHS */
const plinthScene = studioScene(0xf1ebde);
const PL = { spots: [], tops: [] };
{
  const s = plinthScene;
  const cols = [0xcfeadc, 0xf7e6b0, 0xe9e1d0];
  [-2.2, 0, 2.2].forEach((x, i) => {
    add(s, cyl(0.66, 0.62, 64), clay(cols[i]), [x, 0.31, 0]);
    add(s, cyl(0.7, 0.04, 64), clay(0xffffff), [x, 0.64, 0]);
    const sp = new THREE.SpotLight(0xffffff, 0, 8, 0.42, 0.8, 1.2);
    sp.position.set(x, 4.2, 2.2);
    sp.target.position.set(x, 0.8, 0);
    s.add(sp);
    s.add(sp.target);
    PL.spots.push(sp);
  });
  // cane
  const cane = new THREE.Group();
  cane.position.set(-2.2, 0.66, 0);
  cane.rotation.z = 0.12;
  s.add(cane);
  const wood = clay(0x9a6a43);
  add(cane, cyl(0.03, 0.95, 20), wood, [0, 0.475, 0]);
  add(cane, new THREE.TorusGeometry(0.11, 0.03, 16, 40, Math.PI), wood, [-0.11, 0.95, 0]);
  add(cane, cyl(0.04, 0.06, 20), clay(0x2b3035), [0, 0.03, 0]);
  // pill organizer + pills
  const po = new THREE.Group();
  po.position.set(0, 0.66, 0);
  po.rotation.y = -0.25;
  s.add(po);
  add(po, box(0.86, 0.12, 0.32), clay(0xffffff), [0, 0.06, 0]);
  const lid = [0x2ecc91, 0xf4c430, 0x8fd4b6, 0xf08a24, 0x2ecc91, 0xf4c430, 0x8fd4b6];
  lid.forEach((c, i) => add(po, box(0.105, 0.035, 0.29), clay(c), [-0.36 + i * 0.12, 0.135, 0]));
  [[0.2, 0.36, 0xffffff], [0.32, 0.3, 0xd9362b], [-0.3, 0.33, 0xf4c430]].forEach(([x, z, c], i) =>
    add(po, new THREE.CapsuleGeometry(0.028, 0.06, 6, 16), clay(c), [x, 0.03, z], [0, i, Math.PI / 2]),
  );
  // bedside lamp + clutter
  const lp = new THREE.Group();
  lp.position.set(2.2, 0.66, 0);
  s.add(lp);
  add(lp, cyl(0.15, 0.05, 40), clay(0xe8e2d6), [0, 0.025, 0]);
  add(lp, cyl(0.02, 0.5, 16), clay(0x9aa3a8), [0, 0.3, 0]);
  PL.shade = add(lp, new THREE.ConeGeometry(0.26, 0.3, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0xf6efe0, emissive: 0xffd28a, emissiveIntensity: 0.15, roughness: 0.9, side: THREE.DoubleSide }), [0, 0.66, 0]);
  PL.clutter = [
    add(lp, box(0.26, 0.05, 0.2), clay(0x1b8f5a), [0.42, 0.025, 0.15], [0, 0.5, 0]),
    add(lp, box(0.22, 0.05, 0.17), clay(0xd9362b), [0.4, 0.075, 0.13], [0, 0.9, 0.05]),
    add(lp, box(0.2, 0.04, 0.14), clay(0xf4c430), [-0.4, 0.02, 0.2], [0, -0.4, 0]),
  ];
}
function renderPlinths(t, shot) {
  const act = [
    t >= C.r_person && t < C.r_med ? 1 : 0,
    t >= C.r_med && t < C.r_umg ? 1 : 0,
    t >= C.r_umg && t < C.umfeld ? 1 : 0,
  ];
  const on = P(t, C.drei_arten, 1.2);
  PL.spots.forEach((sp, i) => {
    const k = act[i] ? P(t, [C.r_person, C.r_med, C.r_umg][i], 0.8) : 0;
    sp.intensity = 18 * on + 55 * k;
  });
  PL.shade.material.emissiveIntensity = 0.15 + 0.25 * P(t, C.r_u_licht, 0.8);
  PL.clutter.forEach((c, i) => (c.visible = t >= C.r_u_zimmer + i * 0.15));
  let fx = 0;
  if (act[0]) fx = -2.2 * P(t, C.r_person, 1.4);
  if (act[1]) fx = lerp(-2.2, 0, P(t, C.r_med, 1.4));
  if (act[2]) fx = lerp(0, 2.2, P(t, C.r_umg, 1.4));
  if (t >= C.umfeld) fx = lerp(2.2, 0, P(t, C.umfeld, 1.6));
  const focus = act[0] || act[1] || act[2] ? 1 : 0;
  const keys = [
    { t: shot.a, p: [0, 3.0, 10.6], l: [0, 0.5, 0], f: 30 },
    { t: C.drei_arten, p: [0, 2.3, 9.6], l: [0, 0.3, 0], f: 30, d: 1.8 },
  ];
  const c = camAt(keys, t);
  c.l[0] += fx * 0.35;
  c.p[0] += fx * 0.35;
  c.p[2] -= 0.4 * focus * P(t, C.r_person, 1.4);
  applyCam(c, t, 0.04);
  renderer.render(plinthScene, camera);
}

/* ================================================================== SHOE / SOCK */
const sockScene = studioScene(0xf1ebde);
const S = {};
{
  const s = sockScene;
  add(s, cyl(0.75, 0.08, 64), clay(0xdfe9e2), [0, 0.04, 0]);
  // firm shoe
  const shoe = new THREE.Group();
  s.add(shoe);
  S.shoe = shoe;
  add(shoe, box(0.8, 0.07, 0.32), clay(0x3d3a36), [0, 0.035, 0]);
  add(shoe, cyl(0.16, 0.07, 32), clay(0x3d3a36), [0.4, 0.035, 0]);
  const up = add(shoe, new THREE.CapsuleGeometry(0.15, 0.48, 12, 24), clay(0x1b8f5a), [0.05, 0.17, 0], [0, 0, Math.PI / 2]);
  up.scale.set(0.8, 1, 0.95);
  add(shoe, cyl(0.15, 0.2, 32), clay(0x1b8f5a), [-0.24, 0.22, 0]);
  add(shoe, new THREE.TorusGeometry(0.13, 0.025, 12, 32), clay(0x0f5c3a), [-0.24, 0.32, 0], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) add(shoe, box(0.03, 0.015, 0.16), clay(0xffffff), [-0.05 + i * 0.09, 0.29 - i * 0.015, 0], [0, 0, -0.2]);
  // anti-slip sock with rubber dots
  const sock = new THREE.Group();
  s.add(sock);
  S.sock = sock;
  const knit = clay(0x86d9b8);
  add(sock, cyl(0.15, 0.62, 40), knit, [-0.25, 0.62, 0]);
  for (let i = 0; i < 4; i++) add(sock, new THREE.TorusGeometry(0.152, 0.012, 10, 40), clay(0x2ecc91), [-0.25, 0.86 + i * 0.03, 0], [Math.PI / 2, 0, 0]);
  add(sock, new THREE.SphereGeometry(0.16, 32, 24), knit, [-0.25, 0.3, 0]);
  add(sock, new THREE.CapsuleGeometry(0.145, 0.42, 12, 32), knit, [0.06, 0.17, 0], [0, 0, Math.PI / 2]);
  const dots = [];
  for (let x = -0.3; x <= 0.36; x += 0.055) for (let z = -0.09; z <= 0.091; z += 0.045) dots.push([x, z]);
  const dg = new THREE.SphereGeometry(0.019, 12, 8);
  S.dotMat = new THREE.MeshStandardMaterial({ color: 0xf4c430, emissive: 0xf4c430, emissiveIntensity: 0, roughness: 0.6 });
  const inst = new THREE.InstancedMesh(dg, S.dotMat, dots.length);
  const m4 = new THREE.Matrix4();
  dots.forEach(([x, z], i) => {
    m4.makeTranslation(x + 0.06, 0.03, z);
    inst.setMatrixAt(i, m4);
  });
  inst.castShadow = true;
  sock.add(inst);
}
function renderSock(t, shot) {
  const sw = P(t, C.s_socken, 1.4);
  S.shoe.visible = sw < 0.999;
  S.shoe.position.set(lerp(0, -2.4, sw), 0.08, 0);
  S.shoe.rotation.y = 0.5 + (t - shot.a) * 0.25;
  S.sock.visible = sw > 0.001;
  const lift = P(t, C.s_gummi - 0.2, 1.6);
  S.sock.position.set(lerp(2.4, 0, sw), lerp(0.08, 0.45, lift), 0);
  S.sock.rotation.set(lerp(0, -1.25, lift), lerp(-0.4, 0.3, sw) + (t - C.s_socken) * 0.12, lerp(0, 0.35, lift));
  S.dotMat.emissiveIntensity = 0.9 * lift;
  const keys = [
    { t: shot.a, p: [0.2, 1.25, 3.4], l: [0, 0.35, 0], o: 340 },
    { t: C.s_gummi - 0.2, p: [0.2, 1.0, 3.1], l: [0, 0.5, 0], o: 340, d: 1.6 },
  ];
  applyCam(camAt(keys, t), t, 0.03);
  renderer.render(sockScene, camera);
}

/* ================================================================== HIP PAD */
const padScene = studioScene(0xf1ebde);
const PD = {};
{
  const s = padScene;
  const g = new THREE.Group();
  g.position.set(0, 0.9, 0);
  s.add(g);
  PD.g = g;
  const pad = add(g, new THREE.SphereGeometry(1, 64, 40), clay(0xf2e6d0), [0, 0, 0]);
  pad.scale.set(0.5, 0.62, 0.14);
  PD.pad = pad;
  for (let i = 0; i < 3; i++) {
    const r = 0.18 + i * 0.13;
    const q = add(g, new THREE.TorusGeometry(r, 0.008, 8, 64), clay(0x2ecc91), [0, 0, 0.115 - i * 0.02]);
    q.scale.set(0.8, 1, 1);
  }
  const rim = add(g, new THREE.TorusGeometry(0.56, 0.03, 12, 80), clay(0x1b8f5a), [0, 0, 0]);
  rim.scale.set(0.9, 1.1, 1);
  const strap = add(g, new THREE.TorusGeometry(1.4, 0.035, 10, 80, Math.PI * 0.55), clay(0x1b8f5a), [0, -0.05, -1.32], [Math.PI / 2, 0, Math.PI * 0.225]);
  strap.scale.set(1, 1, 0.5);
}
function renderPad(t, shot) {
  PD.g.rotation.y = -0.45 + Math.sin((t - shot.a) * 0.35) * 0.4;
  PD.g.rotation.x = -0.12;
  const sq = P(t, C.h_polster, 0.8) * (1 - P(t, C.h_polster + 1.2, 1.0));
  PD.pad.scale.z = 0.14 * (1 - 0.3 * sq);
  const keys = [{ t: shot.a, p: [0, 1.15, 3.2], l: [0, 0.9, 0], o: 340 }];
  applyCam(camAt(keys, t), t, 0.04);
  renderer.render(padScene, camera);
}

/* ================================================================== dispatch */
const RENDER = { room: renderRoom, femur: renderFemur, plinths: renderPlinths, sock: renderSock, pad: renderPad };

function setShotAt(t) {
  const s = SH.at(t);
  if (s.set) return s;
  // keep the previous 3D shot alive while the layer fades out
  const i = SH.list.indexOf(s);
  const prev = SH.list[i - 1];
  if (prev && prev.set && t - s.a < 0.8) return prev;
  return null;
}

let lastKey = "";
function renderAt(t) {
  const s = setShotAt(t);
  if (!s) {
    if (lastKey !== "none") {
      renderer.setClearColor(0xf6f2e9, 1);
      renderer.clear();
      lastKey = "none";
    }
    return;
  }
  lastKey = s.id;
  RENDER[s.set](t, s);
}

window.__world = { renderAt };
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
