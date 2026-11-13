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

## Episode audio — generated from the script (since Folge 4)

The user only sends the episode script (PDF/text with "Nora:" / "Ben:" turns and [Regie] tags).
Claude produces the audio itself with the ElevenLabs API, then the video.

- **Key**: saved as a network secret for `api.elevenlabs.io` (header `xi-api-key`); the proxy
  injects it — scripts send the placeholder `proxy-injected`. If a call returns 401, ask for the
  credential again (request_credential), never in chat.
- **Voices**: Nora = `XFigb6fqZPxl2Q2dFOXN` (Nadine Convo), Ben = `IeQubAjK1ujbppIdhJw4` (Markus).
  German. Model `eleven_v3` via **Text to Dialogue** (multi-voice, natural hand-overs).
- **Jingle**: `assets/jingles/pflege-wg-jingle.m4a` (16.5 s of music, then silence) — intro and outro.
- **Steps** (`scripts/podcast/`):
  1. `parse_script.py <slug>/script.txt <slug>/dialogue.json` — turns; German tags → English audio
     tags ([lacht]→[laughs] …, table in the script; unknown tag = stop); names never spoken;
     [Intro-Musik]/[Outro-Musik] are montage markers, never generated.
  2. **Test first**: generate the first 6 turns + the outro block, `assemble.py --test`, send
     `test_mix.mp3`, wait for the user's OK. Generated blocks are cached and reused (credits).
  3. `generate_dialogue.py <ep> a-b` per section (≈ 500–1000 chars; bigger blocks hit HTTP 502).
  4. `align_blocks.py <ep>` — Speech to Text on the raw blocks to find each turn's real word
     boundaries (the API's voice_segments lag by up to a word: never cut on them).
  5. `assemble.py <ep>` — jingle intro; 0.2–0.4 s gaps (0.06 s on "—" interruptions); outro music
     starts UNDER the voices at "So, das war's", ≈ −20 dB below them, rises in 1.5 s after the
     last word, ends on the jingle's real ending; master −16 LUFS, true peak ≤ −1 dBTP.
  6. `transcribe.py <ep>` — Speech to Text of the final mix (German, word timestamps, diarization):
     `words.json`, `sous-titres.srt`, `speakers.json` (who speaks = from the script via timing.json),
     and `assets/transcript/<slug>.json` for the video's cue system.
- **Deliverables**: `podcast_spotify.mp3` (stereo 192 kbps, send it to the user) and
  `audio_video.wav` (48 kHz, for the video; >100 MB, so git-ignored — regenerate with assemble.py).
- Check after assembly: every turn's transcript matches its script line (no word moved to the
  neighbouring turn, nothing dropped); regenerate only the block that has a real omission.

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
