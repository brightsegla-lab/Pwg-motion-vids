# Pflege-WG — Episode workflow (audio → YouTube)

## 0 · What the user sends

- the audio (mp3/wav/m4a)
- the word-level transcript JSON + the SRT (same recording)
- the **script** if possible (speaker attribution without guessing)
- episode title, Folge number, title of the next episode

## 1 · Create + prepare (≈ 5 min)

```bash
python3 scripts/new_episode.py <slug> "<Titel>" --folge <n> --next "<Nächste Folge>" \
  --audio <audio> --transcript <words.json> --srt <subs.srt> [--script <script>]
bash scripts/prepare_episode.sh episodes/<slug>
```

Look at the flagged speaker turns. Fill `BRIEF.md`.

## 2 · Storyboard checkpoint (user approves before building)

Read the whole transcript. Fill `STORYBOARD.md`: one row per scene with time, 2D or
3D set, what is shown, and **the SRT quote that supports it**. Send it to the user
(French summary), wait for approval. Changes are cheap here, expensive after.

## 3 · Build

- `cues.spec.json`: one cue per element (exact spoken words), rebuild with
  `bash scripts/prepare_episode.sh episodes/<slug> --skip-audio`.
- `shots.js` → scene windows; `index.html` → one section per shot (copy the template's
  example scenes); `timeline.js` → entrances; `world3d.js` → one function per 3D set.
- Check in ranges while building; snapshot key moments:
  `npx --yes hyperframes@0.8.162 snapshot . --at 12,45,90 --no-end --describe false`.

## 4 · Review loop

1. `kit/REVIEW.md` sections A–C.
2. Draft: `bash scripts/render_episode.sh episodes/<slug> draft`, then
   `bash scripts/share_copy.sh episodes/<slug>/renders/<slug>-draft.mp4` and send it with
   the keyframe board (`renders/keyframes-draft.jpg`).
3. iPad review page (plays the real composition with its audio, chapters, no render needed):
   `python3 scripts/build_preview.py episodes/<slug> "<Titel> Vorschau" intro=Intro …` then publish
   `episodes/<slug>/preview/index.html` as an Artifact with its `assets/…` files (see the
   Pneumonieprophylaxe publish for the file list). Republish the same path after each fix.
4. Apply feedback, repeat until "validé".

## 5 · Final

```bash
bash scripts/render_episode.sh episodes/<slug> final
mkdir -p episodes/<slug>/release && cp episodes/<slug>/renders/<slug>-final-1080p.mp4 episodes/<slug>/release/
bash scripts/share_copy.sh episodes/<slug>/renders/<slug>-final-1080p.mp4
python3 scripts/keymoments.py episodes/<slug> > episodes/<slug>/KEYMOMENTS.md
```

Upload the **master** (`release/`) to YouTube, not the share copy.

## 6 · Thumbnail

```bash
bash scripts/grab_world.sh episodes/<slug> episodes/<slug>/thumbnail/grab <sec>,<sec>
# pick frames → thumbnail/world-a.png, world-b.png; edit thumb.config.js
node scripts/render_thumbnail.mjs episodes/<slug>
```

## 7 · Publishing texts (PUBLISHING.md)

YouTube title + description with chapters (from the cues), tags; podcast title +
description (audio-only wording, same chapters). Every sentence checked against the
transcript (`check_content.py` reads the fenced blocks of PUBLISHING.md).

## 8 · Release plan (validated pattern)

- YouTube: Tuesday 17:00 (Europe/Berlin) — first 24 h matter most.
- Podcast: next day 05:00 (feeds ready for the early-shift commute; YouTube link valid).
- Shorts: Wed 12:30, Thu 18:30, Sat 10:00, Sun 18:30, each pointing to the episode.
- Never overlap with the previous episode's Shorts still running.
- Check the channel's own "when your viewers are on YouTube" stats and shift if needed.
