import json,re,pathlib,subprocess,hashlib
root=pathlib.Path(__file__).resolve().parent
topics=json.loads((root/'curriculum.json').read_text())
assert len(topics)>=20
seen=set(); report=[]
for t in topics:
    slug=t['id']; assert re.fullmatch(r'[0-9]{2}-[a-z0-9-]+',slug),slug
    assert slug not in seen; seen.add(slug)
    assert len(t['scenes'])>=5
    assert t['sources'] and all(x.startswith('https://') for x in t['sources'])
    md=(root/'writing'/f'{slug}.md').read_text()
    body=re.split(r'(?im)^#+\s*(?:sources|references)',md)[0]
    wc=len(re.findall(r"\b[\w'-]+\b",body))
    assert 200<=wc<=400,(slug,'companion word count',wc)
    vid=root/'videos'/f'{slug}.mp4'
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(vid)]))
    video=next(s for s in probe['streams'] if s['codec_type']=='video')
    audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
    duration=float(probe['format']['duration'])
    assert (video['width'],video['height'])==(1080,1920),slug
    assert 45<=duration<=90,(slug,duration)
    assert audio['codec_name']=='aac',slug
    assert (root/'captions'/f'{slug}.srt').stat().st_size>100
    report.append(dict(id=slug,title=t['title'],seconds=round(duration,2),width=1080,height=1920,companion_words=wc,bytes=vid.stat().st_size,sha256=hashlib.sha256(vid.read_bytes()).hexdigest()))
(root/'qa-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
