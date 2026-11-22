import re
S=[l.strip() for l in open('sentences.txt',encoding='utf8') if l.strip()]
rep={'1982’de':'bin dokuz yüz seksen ikide','42':'kırk iki','4.880':'dört bin sekiz yüz seksen','1.500':'bin beş yüz','FAA':'ef a a','5':'beş','2 ':'iki '}
def syl(s):
    for k,v in rep.items(): s=s.replace(k,v)
    return len(re.findall('[aeıioöuüAEIİOÖUÜ]',s))
sy=[syl(s) for s in S]
toks=[l.split() for l in open('sil.txt')]
sil=[];cur=None
for t in toks:
    v=float(t[1])
    if t[0]=='silence_start:': cur=v
    else: sil.append((cur if cur is not None else 0.0,v)); cur=None
END=102.43
# speech segments
segs=[];prev=None
for a,b in sil:
    if prev is not None: segs.append((prev,a))
    prev=b
segs.append((prev,END))
gaps=[segs[i+1][0]-segs[i][1] for i in range(len(segs)-1)]
n=len(segs);m=len(S)
rate=sum(sy)/sum(b-a for a,b in segs)
import math
INF=1e9
# dp[i][j]: first i sentences cover first j segs
dp=[[INF]*(n+1) for _ in range(m+1)];bk=[[0]*(n+1) for _ in range(m+1)]
dp[0][0]=0
for i in range(1,m+1):
  for j in range(1,n+1):
    for k in range(i-1,j):
      if dp[i-1][k]>=INF: continue
      dur=segs[j-1][1]-segs[k][0]
      exp=sy[i-1]/rate
      c=(math.log(dur/exp))**2
      # bonus for long gap at boundary
      if j<n: c-= 0.15*min(gaps[j-1],1.2)
      if dp[i-1][k]+c<dp[i][j]: dp[i][j]=dp[i-1][k]+c;bk[i][j]=k
j=n;res=[]
for i in range(m,0,-1):
  k=bk[i][j];res.append((segs[k][0],segs[j-1][1],j-k));j=k
res.reverse()
for (a,b,c),s,y in zip(res,S,sy): print(f"{a:7.2f} {b:7.2f} {b-a:5.2f} n={c} syl={y} rate={y/(b-a):.1f} {s}")
import json;json.dump([[a,b] for a,b,c in res],open('times.json','w'))
