---
workflow: general-video
flow: automation
storyboard: no
message: "Stürze verhindern: Risiken erkennen (Person, Medikamente, Umgebung) und gezielt vorbeugen"
destination: youtube
aspect: 1920x1080
language: de
audience: Pflege-Azubis (Pflegefachfrau/-mann)
length: 348.55s (fixed by the episode audio)
---

## Intent

Pflege-WG #2 · Prophylaxen-Reihe – Sturzprophylaxe. Motion-design video on top of an
existing two-voice podcast audio (Nora & Ben, ElevenLabs). Same visual identity as the
Dekubitus episode (mint/deep-green, cream, house+stethoscope logo, Montserrat + marker
accent), with a light SaaS influence (frosted-glass cards, dot grid, UI tags, app-like
checklists) and stylised clay-like 3D (~40 % of the runtime requested).

## Assets

- assets/audio/sturzprophylaxe.mp3 — episode audio (converted from the delivered .m4a), the only sound.
- assets/transcript/sturzprophylaxe.json / .srt — word-level timing; the only timing source.
- assets/brand/* — logo variants and studio photo copied from the Dekubitus project.

## Customizations

- Every element appears ~0.2 s before its keyword (cues.spec.json → assets/js/data.js).
- speakers.json — who speaks when (Nora / Ben); loudness.json — per-frame (30 fps) volume envelope via ffmpeg.
- Two "Siri-style" speaker orbs (Nora mint, Ben gold) reacting to the precomputed envelope; docked bottom-right, large and centred in intro/outro.
- Three.js scenes driven only by HyperFrames time (hf-seek), primitive-built clay models, no external models.
- Review loop on iPad: 720p drafts + keyframe contact sheet, final 1080p render only after approval.

## Notes

- Medical content only from the SRT/transcript. The delivered "script" file was not attached; speakers are
  identified from the transcript's diarization + voice pitch (see speakers.json).
- End card announces the next episode (Pneumonieprophylaxe) as requested, although it is not said in the audio.
