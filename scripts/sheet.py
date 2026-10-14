import sys
from PIL import Image
fs=sys.argv[2:]; out=sys.argv[1]
sheet=Image.new('RGB',(1920,1080),'white')
for j,f in enumerate(fs[:4]):
    sheet.paste(Image.open(f).resize((960,540)),((j%2)*960,(j//2)*540))
sheet.save(out,quality=85)
