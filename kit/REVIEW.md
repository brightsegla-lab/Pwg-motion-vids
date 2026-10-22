# Pflege-WG — Review rubric

Run this before showing a draft, and again before the final render. Each item is
pass / fix. Do not render the final while anything in **A** is open.

## A · Content (blocking)

1. `python3 scripts/check_content.py episodes/<slug>` — every flag looked at. A flag is
   either fixed or added to the episode's `allowed_words.txt` **with a comment saying
   which SRT words support it**. No placeholders `«…»` left.
2. Meaning check, scene by scene against the SRT: the screen says what the speakers say —
   no extra causes, consequences, numbers, drugs, steps or "logical" extensions.
   (The word check cannot see a wrong statement made of right words.)
3. Lists keep the speakers' order and grouping (e.g. the three risk-factor kinds).
4. Speakers: `speakers.json` flagged turns resolved (script > pitch > diarization).
   Orbs light up for the right person in the case study and the Q&A moments.
5. Publishing texts (PUBLISHING.md: title, description, chapters, podcast) pass the
   same check — they are content too (Sturz lesson: "Nachtschicht" was never said).

## B · Sync

6. Each element appears ≈ 0.2 s before its word (spot-check 5 cues in the draft against
   `CUE_SOURCE`). Nothing appears more than ~1 s early or after its word ends.
7. Scene cuts land on the right sentence; no scene ends mid-thought.
8. Checklist ticks land after the measure is said in full.

## C · Readability & look

9. `npx --yes hyperframes@0.8.162 check --range a,b` per section: 0 errors, contrast AA
   (WG gold-on-green in the outro is the only accepted exception).
10. Nothing in the orbs dock corner; watermark only on content scenes.
11. Text ≥ 22 px, key statements ≥ 46 px; no card overlaps the 3D subject.
12. 3D: subject readable at a glance, no z-fighting/flicker, no hard cuts between 3D
    shots without the cream dip; ≈ 40 % 3D share.
13. Intro: logo → series chip → title → big orbs, nothing overlapping. Outro: green,
    CTA chips, next-episode card with the right title.

## D · Delivery

14. Final: 1920 × 1080, 30 fps, duration = audio duration, audio present (mean ≈ −28 dB).
15. Keyframe board looked at; key-moment list (KEYMOMENTS.md) regenerated from the final cues.
16. Thumbnail: words pass the content check, readable at 160 px, bottom-right unimportant.
17. Master copied to `release/`, share copy (≤ 29 MB) sent, everything committed + pushed.
