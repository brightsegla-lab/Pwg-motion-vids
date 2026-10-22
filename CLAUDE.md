# Pflege-WG — motion videos

YouTube explainers for German nursing trainees (Pflege-Azubis), hosted by **Nora**
(higher voice, mint) and **Ben** (lower voice, gold). Series in progress: the
*Prophylaxen-Reihe* — Dekubitus, Sturz (Folge 2), Pneumonie next.

## Rules that always apply

1. **Content comes only from the episode** (audio / SRT / script). No added facts,
   causes, consequences, steps, numbers or "logical" extensions — on screen, in
   thumbnails, titles, descriptions and podcast texts alike. When unsure, quote the SRT.
   Run `python3 scripts/check_content.py episodes/<slug>` and read every flag.
2. **Language**: talk to the user in French; everything published is German.
3. **New episodes are built with the kit** (HyperFrames): read `kit/README.md`, follow
   `kit/WORKFLOW.md`, keep `kit/STYLE.md`, pass `kit/REVIEW.md` before any render.
   Show the storyboard (with SRT quotes) for approval before building.
4. Deterministic renders only: every frame a function of time, all analysis precomputed.
5. Renders go to `episodes/<slug>/renders/` (git-ignored). The validated 1080p master is
   copied to `episodes/<slug>/release/` and committed. Chat uploads are limited to ~30 MB:
   send `scripts/share_copy.sh` output, say it's a compressed copy.
6. Commit and push finished work on the session branch; never leave the repo dirty.

## Layout

| Path | What |
|---|---|
| `kit/` | Pflege-WG HyperFrames kit: template episode, style, engine, review rubric |
| `episodes/<slug>/` | one HyperFrames project per episode (`sturzprophylaxe/` = reference) |
| `scripts/` | pipeline: new_episode, prepare_episode, build_*, check_content, render_episode, grab_world, render_thumbnail, share_copy, keymoments |
| `src/`, `public/` | Remotion project — Dekubitusprophylaxe episode + YouTube thumbnail Stills |
| `videos/`, `audiogram/` | other projects (med2be Herzinfarkt explainer, Remotion audiogram template) |
| `.claude/skills/` | HyperFrames + Remotion agent skills |

## Known issue to remember

- Sturzprophylaxe (published): the Teufelskreis scene shows "weniger Bewegung", which is
  not said in the episode (the audio says: fear of falling → loss of independence, not
  daring to get up alone). Keep it out of Shorts/reuse; never repeat this pattern.
