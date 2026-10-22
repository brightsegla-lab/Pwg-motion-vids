# Pflege-WG — Engine (how an episode works)

An episode is a HyperFrames project in `episodes/<slug>/`: plain HTML + GSAP + Three.js,
rendered frame by frame by headless Chrome. **Every frame is a pure function of time**:
no `requestAnimationFrame` loop, no clocks, no `Math.random()`, no live audio analysis.
Everything time-dependent is precomputed into `assets/js/data.js`.

## Data flow

```
audio.mp3 ─┬─ build_loudness.py ─→ loudness.json   (1 value 0..1 per frame @30fps, ffmpeg RMS)
           └─ build_speakers.py ─→ speakers.json   (Nora/Ben turns; diarization ids named by pitch,
transcript.json + .srt ─┘                            each turn re-checked, mismatches flagged)
transcript.json + cues.spec.json ─ build_cues.py ─→ assets/js/data.js
                                                     CUES (spoken − 0.2 s), CUE_SOURCE, TURNS, LOUDNESS
```

`scripts/prepare_episode.sh episodes/<slug>` runs all of it plus the content check.

## Files in an episode

| File | Role | Edit? |
|---|---|---|
| `cues.spec.json` | named sync points: `"key": ["phrase as spoken", search_from_s, ±nudge]` | yes |
| `assets/js/data.js` | generated globals | never by hand |
| `assets/js/shots.js` | scene windows `{id, a, b, set?, mood?}` from cues; `SHOTS.at(t)` | yes |
| `index.html` | layers + one `<section id="s-ID" class="scene">` per shot | yes |
| `assets/js/timeline.js` | episode entrances, each at a cue | yes |
| `assets/js/world3d.js` | one render function per 3D `set` | yes |
| `assets/js/pwg-timeline.js` | kit: scene windows, 3D fades, dip, background, verbs | no (kit) |
| `assets/js/clay3d.js` | kit: renderer, clay materials, studio, camera, pins, mount | no (kit) |
| `assets/js/orbs.js` | kit: speaker orbs | no (kit) |
| `assets/css/style.css` | kit: brand + components | no (kit) |
| `keymoments.json` | cue → what appears (French), for the key-moment list | yes |
| `thumbnail/thumb.config.js` | thumbnail words + background frames | yes |

Kit files are **copied** into each episode at creation, so a finished episode never
changes when the kit evolves (reproducible renders). To bring a kit fix into an
episode, copy the file over deliberately.

## Layers (index.html, fixed order)

1. `#bg` — cream, dot grid, blobs, green outro layer
2. `#world-clip > #world > canvas#gl` — Three.js; opacity driven by the timeline
3. `#orb-clip` — `#dock` (glass) + `canvas#orbs`
4. `#stage` — 2D scenes, `#wm` watermark, `#dip` cream cut-dip
5. `<audio id="voice">`

The root timeline is paused and registered as `window.__timelines["main"]`.

## Timing model

- A cue = the first word of its phrase in the word-level transcript, at or after the
  search second, minus `lead` (0.2 s). Phrases are matched by word prefix, case- and
  punctuation-insensitive; a missing phrase stops the build with an error.
- Shots are cut on cues; the 2D layer (`pwg-timeline.js`) and the 3D layer
  (`clay3d.js` `mount`) both read `SHOTS`, so they cut on the same frame.
- 3D → 2D: the previous 3D shot keeps rendering 0.8 s while `#world` fades out.

## 3D

```js
import { createWorld, P, lerp } from "./clay3d.js";
const W = createWorld();                       // DRAFT (quality=draft) → half res, lighter shadows
const scene = W.studioScene(0xf1ebde);
const g = new W.THREE.Group(); scene.add(g);
W.add(g, W.sphere(0.5), W.clay(0xeee3cc));
function render(t, shot) {
  g.rotation.y = (t - shot.a) * 0.3;          // motion from t only
  W.applyCam(W.camAt([{ t: shot.a, p: [0,1.2,3.4], l: [0,0.7,0], o: 340 }], t), t);
  W.renderer.render(scene, W.camera);
}
W.mount({ myset: render });                    // shots.js: { id: "x", set: "myset", ... }
```

Helpers: `clay(hex)`, `glow(hex, intensity)`, `add(parent, geo, mat, pos, rot)`,
`cyl/box/sphere/tube`, `camAt(keys, t)` + `applyCam(cam, t, drift)`,
`pin(el, [x,y,z])` (HTML label follows a 3D point), `drawRange(mesh, k)` (grow a tube).

## Rendering

```bash
bash scripts/render_episode.sh episodes/<slug> draft   # review: 3D half-res, ~17 min for 6 min
bash scripts/render_episode.sh episodes/<slug> final   # master 1080p, ~55 min for 6 min (4 workers)
bash scripts/share_copy.sh episodes/<slug>/renders/<slug>-final-1080p.mp4   # ≤ 29 MB for the chat
```

Each render also writes `renders/keyframes-<mode>.jpg` (one frame per scene).
`renders/` is git-ignored; the validated master is copied to `release/` and committed.

`npx hyperframes check` on a full 6-min episode can time out — check in ranges:
`npx --yes hyperframes@0.8.162 check --range 40,60`.

Known lint warnings (harmless, same as Sturz): `nested_structure_needs_subcomposition`
for `#bg`, `#world-clip`, `#orb-clip`, `#stage` — Studio-timeline layout advice only.

## Environment notes (cloud session)

- `gsap` and `three` are vendored in `assets/vendor` (CDNs are blocked by the proxy).
- Chrome headless shell: `npx hyperframes browser ensure` once per container.
- Thumbnails render with playwright-core at `/opt/node-tools/node_modules/playwright-core`
  and Chromium at `/opt/pw-browsers/chromium` (override with `PLAYWRIGHT_CORE`, `CHROMIUM`).
