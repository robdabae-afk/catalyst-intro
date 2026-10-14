"""Deterministic QA of synthesized alignment and encoded global progress."""
import json,pathlib,subprocess,importlib.util
from PIL import Image,ImageDraw
root=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('renderer',root/'render.py'); r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
report=[]
for topic in json.loads((root/'curriculum.json').read_text()):
 id=topic['id'];meta=json.loads((root/'audio'/f'{id}.json').read_text());total=meta['total'];bounds=meta['bounds']
 assert meta['hash']==r.nhash(topic),id
 assert (root/'videos'/f'{id}.mp4.hash').read_text()==r.vhash(topic),id
 assert ''.join(topic['scene_narration'])==topic['narration'],id
 st=r.sentence_times(topic['narration'],bounds,total)
 sb=r.assign_by_text(st,topic['scene_narration'],topic['narration'],bounds,total)
 chunks=r.caption_chunks(topic['narration'],bounds,total,ImageDraw.Draw(Image.new('RGB',(10,10))))
 assert all(a<b for a,b,_ in chunks),id
 assert all(len(r.wrap(ImageDraw.Draw(Image.new('RGB',(10,10))),txt,r.font(54,650),888))<=2 for _,_,txt in chunks),id
 times=sorted(set([0,10,30,47,48,49,51,52,total-.1]));progress=[]
 for t in times:
  if t>=total:continue
  # Decode the encoded pixel row, rather than trusting renderer calculation alone.
  raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(t),'-i',str(root/'videos'/f'{id}.mp4'),'-frames:v','1','-vf','crop=1080:2:0:1704','-f','rawvideo','-pix_fmt','rgb24','-'])
  im=Image.frombytes('RGB',(1080,2),raw)
  xs=[x for x in range(96,984) if (lambda c:c[1]>c[0]+12 and c[1]>c[2]+8 and c[1]<120)(im.getpixel((x,0)))]
  edge=max(xs) if xs else 96
  progress.append([round(t,3),edge]);assert abs(edge-(96+888*t/(total+.6)))<5,(id,t,edge)
 assert all(a[1]<=b[1] for a,b in zip(progress,progress[1:])),id
 report.append(dict(id=id,word_boundaries=len(bounds),scene_cuts=sb,caption_chunks=len(chunks),encoded_progress=progress))
(root/'polish-qa-report.json').write_text(json.dumps(report,indent=2))
print('PASS all 20 exact word alignments, caption fit, cache hashes, and encoded monotonic progress including 47/48/49/51/52s')
