// Pflege-WG kit — clay 3D toolkit (Three.js), shared by every episode.
// Every frame is a pure function of HyperFrames time (hf-seek): no clocks, no RAF loop,
// no randomness, no external models. Objects are built from primitives in a matte
// "clay" material and lit like a soft studio.
//
//   import { createWorld } from "./clay3d.js";
//   const W = createWorld();                 // renderer + camera on canvas#gl
//   const scene = W.studioScene(0xf1ebde);   // cream studio: floor shadow + 3 lights
//   W.add(scene, W.cyl(0.5, 0.06, 64), W.clay(0xdfe9e2));
//   W.mount({ studio: (t, shot) => { W.applyCam(W.camAt(keys, t), t); W.renderer.render(scene, W.camera); } });
//
// mount() maps each SHOTS entry's `set` to a render function and keeps the previous
// 3D shot alive for 0.8 s while the layer fades out after a 3D → 2D cut.
import * as THREE from "three";

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ease = (x) => {
  x = clamp(x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const P = (t, a, d = 1) => ease((t - a) / d); // eased 0→1 progress starting at a
export const lerp = (a, b, k) => a + (b - a) * k;
export const TAU = Math.PI * 2;

// "draft" (composition variable quality=draft) renders the 3D at half resolution with
// lighter shadows for fast review renders; "final" renders full resolution.
const VARS = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
export const DRAFT = VARS.quality === "draft";

export function createWorld({ canvasId = "gl", W = 1920, H = 1080 } = {}) {
  const RES = DRAFT ? 0.5 : 1;
  const SHADOW = DRAFT ? 1024 : 2048;
  const canvas = document.getElementById(canvasId);
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
  const glow = (hex, intensity = 1.6) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: intensity });
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
  const sphere = (r, w = 32, h = 24) => new THREE.SphereGeometry(r, w, h);
  const tube = (points, radius, closed = false, seg = 120) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed), seg, radius, 12, closed);

  // Cream studio: invisible shadow-catching floor, warm hemisphere, soft key + mint rim.
  function studioScene(bg = 0xf1ebde) {
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
    s.userData.key = key;
    return s;
  }

  // Camera keyframes: [{t, p:[x,y,z], l:[x,y,z], d, o, f}] — eased hand-offs.
  // d = move duration (s), o = horizontal view offset in px (shifts the subject to make
  // room for a 2D card: +340 puts it left of centre), f = field of view.
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
  // drift = slow deterministic hand-held sway (a function of t only)
  function applyCam(c, t, drift = 0.05) {
    camera.position.set(c.p[0] + Math.sin(t * 0.21) * drift, c.p[1] + Math.sin(t * 0.17) * drift * 0.5, c.p[2] + Math.cos(t * 0.19) * drift);
    camera.lookAt(c.l[0], c.l[1], c.l[2]);
    if (Math.abs(camera.fov - c.f) > 1e-3) camera.fov = c.f;
    if (Math.abs(c.o) > 0.5) camera.setViewOffset(W, H, c.o, 0, W, H);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  // 3D point → screen px, for HTML labels pinned to objects (.anchor elements).
  const v = new THREE.Vector3();
  function project(p) {
    v.set(p[0], p[1], p[2]).project(camera);
    return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H];
  }
  function pin(el, p) {
    if (!el) return;
    const [x, y] = project(p);
    el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
  }

  // Grow a TubeGeometry/indexed mesh from 0 → k (0..1), e.g. a crack or a path drawing in.
  function drawRange(mesh, k) {
    const n = mesh.geometry.index.count;
    mesh.visible = k > 0.002;
    mesh.geometry.setDrawRange(0, Math.floor((n * clamp(k)) / 6) * 6);
  }

  function mount(RENDER, { clear = 0xf6f2e9 } = {}) {
    const SH = window.SHOTS;
    function shotAt(t) {
      const s = SH.at(t);
      if (s.set) return s;
      const i = SH.list.indexOf(s);
      const prev = SH.list[i - 1];
      if (prev && prev.set && t - s.a < 0.8) return prev;
      return null;
    }
    let blank = false;
    function renderAt(t) {
      const s = shotAt(t);
      if (!s) {
        if (!blank) {
          renderer.setClearColor(clear, 1);
          renderer.clear();
          blank = true;
        }
        return;
      }
      blank = false;
      const fn = RENDER[s.set];
      if (!fn) throw new Error("clay3d: no render function for set '" + s.set + "'");
      fn(t, s);
    }
    window.__world = { renderAt };
    window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
    renderAt(window.__hfThreeTime || 0);
    return renderAt;
  }

  return { THREE, renderer, camera, W, H, clay, glow, add, cyl, box, sphere, tube, studioScene, camAt, applyCam, project, pin, drawRange, mount };
}

export { THREE };
