#!/bin/bash
# sheet.sh outname files...
out=$1; shift
python3 - "$out" "$@" <<'P'
import sys
from PIL import Image
out=sys.argv[1]; fs=sys.argv[2:]
ims=[Image.open(f).resize((360,640)) for f in fs]
cols=min(len(ims),4); rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*364,rows*644),'white')
for i,im in enumerate(ims): S.paste(im,((i%cols)*364,(i//cols)*644))
S.save(out,quality=88)
P
