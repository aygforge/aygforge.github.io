# Sahne kareleri → tek temas sayfası (denetim için). Kullanım: python3 tools/sheet.py PREFIX [adım]
import sys, glob
from PIL import Image
pre = sys.argv[1]; step = int(sys.argv[2]) if len(sys.argv) > 2 else 2
files = sorted(glob.glob(f'docs/scenes/{pre}_*.png'))[::step][:9]
ims = [Image.open(f).resize((640, 288)) for f in files]
cols = 3; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (640 * cols, 288 * rows), 'black')
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 640, (i // cols) * 288))
sheet.save(f'/tmp/claude-0/-home-user-aygforge-github-io/136ed117-04c3-53d7-9fbc-884dd50ee19c/scratchpad/sheet_{pre}.png')
print(len(ims), 'kare')
