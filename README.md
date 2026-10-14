# Pflege-WG – Motion-Design-Videos

YouTube-Videos zum Podcast **Pflege-WG** („Der Podcast für Pflege-Azubis“), gebaut mit
[Remotion](https://remotion.dev) (React + TypeScript). Kinetic Typography auf der fertigen
Podcast-Tonspur, ohne Avatare.

## Schnellstart

```bash
npm install
npm run dev        # Remotion Studio: Vorschau, Timeline, Scrubbing mit Ton
npm run render     # → out/dekubitusprophylaxe.mp4 (1920×1080, 30 fps, H.264 + AAC)
```

Vorschau-Standbilder einzelner Sekunden: `node scripts/stills.mjs 12 75 200` → `out/stills/`.

## Aufbau

```
assets/            Originale (Marken-PNGs, Audio)
public/            Was im Video landet: brand/ (Logo-Varianten, Studio-Foto), audio/
src/
  brand/           theme.ts (Farben, Schriften, Größen), fonts.ts (lokale Fonts)
  lib/anim.ts      Ein Easing für alles (ease-in-out), enter/fade/cues-Helfer
  components/      Hintergründe, Logo/Wordmark, Icons, Illustrationen, SceneFrame
  scenes/          Wiederverwendbare Szenentypen
  engine/          types.ts (Datenmodell), Episode.tsx (Timeline, Crossfades, Kapitel-Leiste, Audio)
  episodes/        Eine Datei pro Folge – nur Inhalt + Timing
```

### Szenentypen

| `type`       | Komponente          | Einsatz                                                     |
|--------------|---------------------|-------------------------------------------------------------|
| `title`      | TitleScene          | Intro: Show-Logo → Folgentitel, Studio-Foto mit Grün-Overlay |
| `list`       | ListScene           | `layout: 'chain'` (Ursache→Wirkung + Illustration) oder `'grid'` (Icon-Karten) |
| `body`       | BodyDiagramScene    | Körpersilhouette mit nummerierten Risikostellen             |
| `fingertest` | FingerTestScene     | Ablauf-Schritte + zwei animierte Ergebnisse                 |
| `stages`     | StageCardsScene     | 4 Stufen-Karten mit Schweregrad-Farben & Hautschnitt        |
| `case`       | CaseScene           | Patientenfall auf Creme (Klemmbrett, Frage, Lösungen)       |
| `outro`      | OutroScene          | Zusammenfassung → Endkarte (Abo-CTA, nächste Folge)         |

## Neue Folge anlegen (z. B. Sturzprophylaxe)

1. Audio nach `public/audio/sturzprophylaxe.mp3` legen, Länge messen:
   `ffprobe -v error -show_entries format=duration -of csv=p=0 public/audio/sturzprophylaxe.mp3`
2. `src/episodes/dekubitusprophylaxe.ts` kopieren, Inhalte, `duration` und `start`-Zeiten anpassen.
3. In `src/Root.tsx` zur `episodes`-Liste hinzufügen.
4. Neue Icons bei Bedarf in `src/components/Icons.tsx` ergänzen (64×64, Linienstil).

## Timing feinjustieren

- `start` (Sekunden auf der Tonspur) legt fest, wann eine Szene beginnt; sie endet automatisch
  beim nächsten `start` (18 Frames weicher Crossfade).
- Ohne `at` werden Listenpunkte gleichmäßig über die Szene verteilt. Mit `at` (Sekunden ab
  Szenenbeginn) erscheint ein Punkt genau dann, wenn er im Dialog fällt.
- Im Studio (`npm run dev`) mit Ton scrubben, die Sekunde ablesen und eintragen.

## Gestaltungsregeln

- Nur weiche ease-in-out-Kurven, kein Bounce/Elastic; pro Element genau eine Bewegung.
- Mindestschrift ~30 px, Haupttexte 44–54 px, dunkle Schrift auf Mint/Weiß für starken Kontrast.
- Fotos nie roh: immer weichgezeichnet und mit Marken-Grün überlagert.
