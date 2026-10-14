"""Static layout bounds for every settled educational card."""
import json,math,render as r
from PIL import Image,ImageDraw
from pathlib import Path
root=Path(__file__).parent;d=ImageDraw.Draw(Image.new('RGB',(1080,1920)));checks=0
for t in json.loads((root/'curriculum.json').read_text()):
 for idx,s in enumerate(t['scenes']):
  def check(text,w,h,size,minimum,wt,lines,lh=1.15):
   global checks
   f,L,z=r.fit(d,text,w,h,size,minimum,wt,lines,lh)
   assert len(L)*z*lh<=h and all(r.tw(d,l,f)<=w for l in L),(t['id'],idx,text,L,z)
   checks+=1
  check(s['headline'],888,330,80,44,700,3,1.1)
  assert r.tw(d,s['kicker'].upper(),r.font(36,700))<=888,(t['id'],idx,'kicker')
  labs=s['labels'];n=len(labs)
  if s['visual']=='grid':
   cols=2 if n<=6 else 3;rows=math.ceil(n/cols);cw=(888-22*(cols-1))/cols;ch=(690-22*(rows-1))/rows
   for lab in labs:check(lab,cw-44,ch-110,36,20,600,5)
  elif s['visual']=='document':
   rh=(690-16*(n-1))/n
   for lab in labs:check(lab,742,rh-30,46,28,650,3)
  elif s['visual']=='comparison':
   rows=math.ceil(n/2);rh=620//rows
   for lab in labs:check(lab,384,rh-60,38,22,600,5)
  elif s['visual']=='flow':
   bh=min(210,(690-54*(n-1))//n)
   for lab in labs:check(lab,698,bh-26,44,26,600,3)
  elif s['visual']=='pie':
   assert 10+440+50+(n-1)*52+42<=690
   for lab in labs:check(lab,698,44,34,22,500,1)
print('PASS',checks,'headlines/card labels;100kickers;allpie legend bounds')
