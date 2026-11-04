"""Vertical 9:16 Shorts (1080×1920) cut from an episode's final 16:9 render.

Each Short stacks crops of the 16:9 frame ("panels": the brand, the scene header, the
3D visual, the card, the Nora/Ben orbs) as tiles on a cream background, so the text stays
readable on a phone. Panels are listed top to bottom in episodes/<slug>/shorts.json:

  {"source": "release/<slug>-final-1080p.mp4",
   "shorts": [{"id": "1-blubberflasche", "start": 215.30, "end": 235.32,
               "panels": [{"crop": [x, y, w, h], "width": 1000}, ...]}]}

`width` is the panel's target width on the 1080-wide canvas (≤ 1032); heights follow the
crop's aspect ratio. If the stack is taller than the canvas, every panel is scaled down by
the same factor. Output: episodes/<slug>/renders/shorts/<id>.mp4 (H.264 + AAC, faststart).

Usage: python3 scripts/make_shorts.py episodes/<slug> [id ...]
"""
import json, pathlib, subprocess, sys

ep = pathlib.Path(sys.argv[1])
only = set(sys.argv[2:])
spec = json.load(open(ep / "shorts.json"))
src = ep / spec["source"]
out_dir = ep / "renders" / "shorts"
out_dir.mkdir(parents=True, exist_ok=True)

CW, CH = 1080, 1920
MARGIN, GAP = 48, 22
BG = spec.get("background", "0xE9E3D6")

for s in spec["shorts"]:
    if only and s["id"] not in only:
        continue
    panels = s["panels"]
    sizes = [(p["width"], p["width"] * p["crop"][3] / p["crop"][2]) for p in panels]
    total = sum(h for _, h in sizes) + GAP * (len(sizes) - 1)
    k = min(1.0, (CH - 2 * MARGIN) / total)
    sizes = [(round(w * k / 2) * 2, round(h * k / 2) * 2) for w, h in sizes]
    total = sum(h for _, h in sizes) + GAP * (len(sizes) - 1)
    y = (CH - total) // 2
    dur = s["end"] - s["start"]
    parts = [f"color=c={BG}:s={CW}x{CH}:r=30:d={dur:.3f}[bg]", f"[0:v]split={len(panels)}" + "".join(f"[s{i}]" for i in range(len(panels)))]
    last = "bg"
    for i, (p, (w, h)) in enumerate(zip(panels, sizes)):
        x0, y0, cw, ch = p["crop"]
        parts.append(f"[s{i}]crop={cw}:{ch}:{x0}:{y0},scale={w}:{h}:flags=lanczos[p{i}]")
        nxt = f"o{i}"
        parts.append(f"[{last}][p{i}]overlay=x={(CW - w) // 2}:y={y}:shortest=1[{nxt}]")
        last = nxt
        y += h + GAP
    fade_out = max(0, dur - 0.35)
    parts.append(f"[{last}]fade=t=in:st=0:d=0.25:color={BG},fade=t=out:st={fade_out:.3f}:d=0.35:color={BG},format=yuv420p[v]")
    parts.append(f"[0:a]afade=t=in:st=0:d=0.15,afade=t=out:st={fade_out:.3f}:d=0.35[a]")
    out = out_dir / f"{s['id']}.mp4"
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{s['start']:.3f}", "-to", f"{s['end']:.3f}", "-i", str(src),
           "-filter_complex", ";".join(parts), "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)
    print(out, f"{dur:.1f}s", f"scale {k:.2f}", f"{out.stat().st_size / 1e6:.1f} MB")
