import sys
from PIL import Image, ImageDraw
files=sys.argv[2:]; n=len(files); cols=min(5,n); rows=(n+cols-1)//cols
sw,sh=360,640
im=Image.new('RGB',(cols*sw,rows*(sh+24)),'white'); dr=ImageDraw.Draw(im)
for k,f in enumerate(files):
    a=Image.open(f).convert('RGB').resize((sw,sh),Image.LANCZOS)
    x=(k%cols)*sw; y=(k//cols)*(sh+24); im.paste(a,(x,y+24)); dr.text((x+5,y+5),f,fill='black')
im.save(sys.argv[1])
