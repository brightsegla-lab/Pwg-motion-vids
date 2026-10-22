# Pflege-WG kit

Everything needed to turn a new Pflege-WG episode (audio + transcript) into a finished
HyperFrames video with the validated *Sturzprophylaxe* look — without rebuilding the
basics each time.

| Doc | For |
|---|---|
| [WORKFLOW.md](WORKFLOW.md) | the steps from audio to YouTube, with commands |
| [STYLE.md](STYLE.md) | brand, layout, components, motion, 3D, orbs, thumbnail |
| [ENGINE.md](ENGINE.md) | how an episode works: data flow, files, timing, 3D API, rendering |
| [REVIEW.md](REVIEW.md) | the checklist before a draft and before the final |
| [allowed_words.txt](allowed_words.txt) | brand/UI words the content check accepts |

`template/` is the episode skeleton `scripts/new_episode.py` copies: intro (3D studio),
a 2D definition + list scene, a 3D object + card scene, a checklist scene, summary +
Merksatz, green outro, orbs, watermark, thumbnail template — all wired to named cues.

Quick start:

```bash
python3 scripts/new_episode.py pneumonieprophylaxe "Pneumonieprophylaxe" --folge 3 \
  --next "«…»" --audio in/pneumonie.mp3 --transcript in/pneumonie.json --srt in/pneumonie.srt
bash scripts/prepare_episode.sh episodes/pneumonieprophylaxe
```

Tested end to end (create → prepare → lint/check → snapshots → clean 3D grab →
thumbnail) on a throw-away episode built from the Sturz audio.
