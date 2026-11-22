import sys,glob
from PIL import Image
fs=sorted(glob.glob(sys.argv[1]+'/f_*.png'),key=lambda f:float(f.split('_')[-1][:-4]))
n=len(fs); cols=6; rows=(n+cols-1)//cols
m=Image.new('RGB',(270*cols,480*rows),'white')
for i,f in enumerate(fs): m.paste(Image.open(f).convert('RGB').resize((270,480)),((i%cols)*270,(i//cols)*480))
m.save(sys.argv[2])
