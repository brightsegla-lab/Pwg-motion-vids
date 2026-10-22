# Pflege-WG — Style (HyperFrames episodes)

The look validated with *Sturzprophylaxe* (Prophylaxen-Reihe, Folge 2). Every new
episode starts from `kit/template`, which already implements all of this. Change the
style here first, then in the template — never only in one episode.

## Brand

| Token | Hex | Use |
|---|---|---|
| `--mint` | `#2ECC91` | Nora's orb, chips, list dots, ticked checkboxes |
| `--green` | `#1B8F5A` | labels (`.lbl`), ticked text, "WG" in the watermark |
| `--deep` | `#0F5C3A` | tag text, quotes |
| `--ink` | `#0F1A15` | all body text, dark chips |
| `--ink2` | `#36463E` | secondary text (`.sub`, `.s`) |
| `--cream` | `#F6F2E9` | page background |
| `--gold` | `#F4C430` | Ben's orb, "WG" on dark/green, highlights, 3D pins |
| `--red` | `#D9362B` | danger / complication only (fracture, warning) — sparingly |

- **Fonts** (shipped as woff2, no network): Montserrat 500–900 for everything,
  Kalam 700 for the handwritten accent (`.marker`, "WG", quotes, thumbnail accent).
- **Wordmark**: `PFLEGE-` Montserrat 800 + `WG` Kalam rotated −4°. "WG" is gold on dark
  and on the green outro (brand exemption from the contrast check), green on cream.
- **Logo**: `assets/brand/mark-black.png` on light, `mark-white.png` on dark.

## Canvas & layout (1920 × 1080, 30 fps)

- **Background**: cream + dot grid (36 px, green 20 %) + three slow-drifting blobs
  (mint top-left, green bottom-right, gold top). The outro fades to brand green.
- **Header** (`.hdr`) at left 120 / top 76: UI tag (`.tag`, uppercase pill with a dot:
  mint = default, gold = consequence/attention, red = danger) above an `.h1` (76 px / 800).
- **Watermark** top-right (right 96 / top 70) on content scenes only — not on the intro,
  dark (night) 3D shots, or the outro.
- **Orbs dock** bottom-right (right 56 / bottom 40, 330 × 132, frosted glass). Keep that
  corner free of content. YouTube also puts the duration there in thumbnails.
- **Safe area**: content between x 100–1820, y 60–1000. Minimum text size 22 px (labels),
  body 30–38 px, key statements 46–52 px.

## Components (assets/css/style.css)

| Class | What |
|---|---|
| `.glass` | white 72 % card, 1.5 px white border, soft green shadow, radius 22 |
| `.glass.frost` | same + backdrop blur — use over 3D |
| `.glass.night` | dark translucent card for night 3D shots (white text, mint labels) |
| `.card` `.lbl` `.big` `.mid` `.sub` | padding + label + 52 / 38 / 30 px text |
| `.rows` `.row` `.dot` `.t` `.s` | bullet list (dot colour = mint / gold / red) |
| `.check` `.box` `.fill` | app-like checklist: box fills mint, white tick draws, text turns green |
| `.chip.ink` `.chip.mint` | pills (CTAs, series chip) |
| `.marker` | Kalam handwritten (quotes, Merksatz) |
| `.anchor` `.pin` `.lab` | HTML label pinned to a 3D point (gold pin + glass label) |

## Motion

- One move per element: fade + 26 px rise (or 24 px slide for list rows), 0.55 s,
  `power2.out`. Scene in/out 0.5 / 0.45 s `power2.inOut`. No bounce, no elastic, no spin.
- **Every element appears 0.2 s before the word that names it** (cues.spec.json, `lead`).
- Checklist: row slides in on its word, tick lands 0.9–2 s later (when the measure has
  been said in full).
- Cuts between two 3D shots go through a short cream dip (0.22 s in, 0.35 s out).
- Ambient motion only from time (blob drift, orb idle, 3D camera sway) — never random.

## 3D (clay)

- Matte "clay" (`roughness 0.92`, no metal), built from primitives only — no external
  models, no textures. Soft studio light: warm hemisphere + key with soft shadow + mint rim.
- Palette: cream studio `0xF1EBDE` / `0xEFE9DC`, bone/skin `0xEEE3CC`, pedestal
  `0xDFE9E2`, accents mint `0x2ECC91`, green `0x1B8F5A`, gold `0xF4C430`,
  emphasis glow red `0xD9362B` (`W.glow`).
- Subject on a pedestal disc, slow turn; camera eases between keyframes with a small sway.
  When a 2D card shares the frame, shift the subject with a view offset (`o: 340`).
- **Intro rule**: the subject sits off-centre (`o: 560`) so the big centred orbs and
  the title never overlap it.
- Target ≈ 40 % of the runtime in 3D (Sturz ended at ≈ 55 %, accepted). Night/dark
  shots (`mood: "night"`) are for situations (a room at night), not for explanations.

## Speaker orbs

- Nora = mint, Ben = gold; Siri-like blobs driven by the precomputed loudness of the
  speaker who is talking (speakers.json turns). Names under each orb, the active one at
  full opacity.
- Big and centred during the intro shot and the outro; docked bottom-right otherwise.

## Language

- On-screen text: **German**, taken from the SRT (same words, or a faithful shortening
  — see REVIEW.md). Talking to the user: French.
- Medical content: **only** what the episode says. No additions, no "logical" extensions
  (Sturz lesson: "weniger Bewegung" in the Teufelskreis was never said).

## Thumbnail

- Dark left panel (logo, mint series chip, headline 1–2 words white 250 px, Kalam accent
  on a gold highlight, white subline), right: a clean 3D still from the episode, optional
  gold callout pill with a dotted leader. ≤ 4 big words, readable at 160 px wide.
