"""Keyframe board: one frame per scene from a rendered video, timestamp + label burned in.
Usage: python3 scripts/keyframe_sheet.py <video.mp4> <out.jpg> "<sec>|<label>" ...
"""
import subprocess, sys, tempfile, os
from PIL import Image, ImageDraw, ImageFont

video, out, items = sys.argv[1], sys.argv[2], sys.argv[3:]
cols, tw, th = 3, 640, 360
rows = (len(items) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * th), (20, 26, 23))
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except OSError:
    font = ImageFont.load_default()
tmp = tempfile.mkdtemp()
for i, it in enumerate(items):
    sec, label = it.split("|", 1)
    f = os.path.join(tmp, f"{i}.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", sec, "-i", video, "-frames:v", "1", "-vf", f"scale={tw}:{th}", f], check=True)
    im = Image.open(f).convert("RGB")
    d = ImageDraw.Draw(im)
    t = float(sec)
    tag = f"{int(t // 60)}:{t % 60:04.1f}  {label}"
    w = d.textlength(tag, font=font)
    d.rectangle([0, th - 38, w + 20, th], fill=(15, 26, 21))
    d.text((10, th - 33), tag, fill=(143, 240, 200), font=font)
    sheet.paste(im, ((i % cols) * tw, (i // cols) * th))
sheet.save(out, quality=85)
print(out)
