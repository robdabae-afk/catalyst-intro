#!/usr/bin/env python3
"""Educational video renderer. Reads curriculum.json, writes videos/audio/captions/frames/thumbnails.
Usage: render.py [--only id[,id]] [--force] [--curriculum path] [--audio-workers 3] [--video-workers 2]"""
import argparse, asyncio, hashlib, json, math, os, re, subprocess, sys, time, logging
from concurrent.futures import ProcessPoolExecutor
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(ROOT, "fonts", "f.ttf")
VOICE = "en-US-EmmaMultilingualNeural"
RATE = "-3%"
W, H, FPS = 1080, 1920, 24
PAPER, INK, GREEN, RUST, GREY, RULE, TINT = (246,243,236),(17,17,17),(31,77,58),(181,83,47),(39,39,35),(215,210,198),(236,232,221)
ML = 96  # side margin
VIS = (ML, 600, W-ML, 1290)  # visual box
CAP_Y = (1400, 1640)  # caption zone (bottom 280px kept clear for platform UI)
_fc = {}

def font(size, wt=500):
    k = (size, wt)
    if k not in _fc:
        f = ImageFont.truetype(FONT, size)
        try: f.set_variation_by_axes([wt])
        except Exception: pass
        _fc[k] = f
    return _fc[k]

def mix(c, t, base=PAPER):
    t = max(0, min(1, t)); return tuple(int(base[i] + (c[i]-base[i])*t) for i in range(3))
def ease(t): t = max(0, min(1, t)); return 1 - (1-t)**3
def seg(p, a, b): return ease((p-a)/(b-a)) if b > a else 1.0
def tw(d, s, f): return d.textlength(s, font=f)

def wrap(d, text, f, maxw):
    lines, cur = [], ""
    for w in str(text).split():
        t = (cur+" "+w).strip()
        if tw(d, t, f) <= maxw or not cur: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def fit(d, text, maxw, maxh, size, minsize, wt=600, maxlines=99, lh=1.18):
    while True:
        f = font(size, wt); L = wrap(d, text, f, maxw)
        if (len(L)*size*lh <= maxh and len(L) <= maxlines and all(tw(d,l,f) <= maxw for l in L)) or size <= minsize:
            return f, L, size
        size -= 2

def draw_lines(d, lines, f, x, y, col, lh, anchor="l", cx=None):
    for i, l in enumerate(lines):
        xx = x if anchor == "l" else cx - tw(d, l, f)/2
        d.text((xx, y+i*lh), l, font=f, fill=col)

def fmtv(v, p):
    x = v*p
    return f"{x:,.0f}" if abs(v) >= 100 or float(v).is_integer() else f"{x:.1f}"

# ---------------- visuals: each draw(d, img, labels, values, p) with p in 0..1 ----------------
def v_flow(d, img, labels, values, p):
    x0,y0,x1,y1 = VIS; n = max(1, len(labels)); gap = 54
    bh = min(210, (y1-y0-gap*(n-1))//n)
    for i, lab in enumerate(labels):
        a = seg(p, 0.08+i*0.8/n, 0.08+i*0.8/n+0.16)
        if a <= 0: continue
        y = y0 + i*(bh+gap) + (1-a)*30
        hl = (i == n-1)
        d.rounded_rectangle((x0, y, x1, y+bh), 18, fill=mix(GREEN if hl else TINT, a), outline=mix(GREEN if hl else RULE, a), width=2)
        d.text((x0+34, y+bh/2), f"{i+1:02d}", font=font(34,600), fill=mix(PAPER if hl else GREEN, a), anchor="lm")
        f, L, s = fit(d, lab, x1-x0-190, bh-26, 44, 26, 600, 3)
        lh = s*1.15; ty = y+bh/2-len(L)*lh/2
        draw_lines(d, L, f, x0+120, ty, mix(PAPER if hl else INK, a), lh)
        if i < n-1:
            b = seg(p, 0.08+i*0.8/n+0.12, 0.08+i*0.8/n+0.24)
            ax = (x0+x1)//2; ya = y+bh+6; yb = ya+(gap-12)*b
            d.line((ax, ya, ax, yb), fill=mix(GREY, b), width=4)
            if b > .95: d.polygon([(ax-11,yb-4),(ax+11,yb-4),(ax,yb+9)], fill=GREY)

def v_bars(d, img, labels, values, p):
    x0,y0,x1,y1 = VIS; n = max(1, len(labels)); vals = list(values) + [0]*(n-len(values)); mx = max(vals) or 1
    rowh = min(210, (y1-y0)//n); bh = 64
    for i, lab in enumerate(labels):
        a = seg(p, 0.05+i*0.6/n, 0.05+i*0.6/n+0.3)
        y = y0 + i*rowh
        f, L, s = fit(d, lab, x1-x0, 52, 38, 24, 600, 2, 1.05)
        draw_lines(d, L, f, x0, y, mix(INK, min(1, a*3)), s*1.05)
        by = y + len(L)*s*1.05 + 10
        d.rectangle((x0, by, x1, by+bh), fill=mix(TINT, min(1,a*3)))
        wbar = (x1-x0-170) * vals[i]/mx * a
        d.rectangle((x0, by, x0+wbar, by+bh), fill=GREEN if vals[i]==mx else mix(GREEN,0.55))
        d.text((x0+wbar+16, by+bh/2), fmtv(vals[i], a), font=font(36,700), fill=mix(INK,min(1,a*3)), anchor="lm")

def v_pie(d, img, labels, values, p):
    x0,y0,x1,y1 = VIS; n = len(values) or 1; tot = sum(values) or 1
    cols = [GREEN, RUST, (214,170,60), (90,120,150), GREY, (150,180,150)]
    S = 3; R = 220; cx, cy = (x0+x1)//2, y0+R+10
    lay = Image.new("RGBA", (2*R*S+10, 2*R*S+10), (0,0,0,0)); ld = ImageDraw.Draw(lay)
    box = (5, 5, 2*R*S+5, 2*R*S+5); ang = -90; sweep = 360*ease(p/0.7 if p < .7 else 1)
    acc = 0
    for i, v in enumerate(values):
        a = 360*v/tot; take = max(0, min(a, sweep-acc)); acc += a
        if take > 0.2: ld.pieslice(box, ang, ang+take, fill=cols[i%6], outline=PAPER, width=6*S//2)
        ang += a
    ld.ellipse((5+R*S*0.58, 5+R*S*0.58, 5+R*S*1.42, 5+R*S*1.42), fill=PAPER)
    lay = lay.resize((lay.width//S, lay.height//S), Image.LANCZOS)
    img.paste(lay, (cx-R-2, cy-R-2), lay)
    ly = cy+R+50
    for i, lab in enumerate(labels[:n]):
        a = seg(p, 0.55+i*0.08, 0.7+i*0.08); pct = values[i]/tot*100 if i < len(values) else 0
        row = ly + i*52
        d.rectangle((x0, row+8, x0+26, row+34), fill=mix(cols[i%6], a))
        f, L, s = fit(d, lab, x1-x0-190, 44, 34, 22, 500, 1)
        d.text((x0+46, row+21), L[0], font=f, fill=mix(INK,a), anchor="lm")
        d.text((x1, row+21), f"{pct:.0f}%", font=font(34,700), fill=mix(INK,a), anchor="rm")

def v_timeline(d, img, labels, values, p):
    x0,y0,x1,y1 = VIS; n = max(1, len(labels)); step = (y1-y0-60)//n; lx = x0+60
    d.line((lx, y0+10, lx, y0+10+(n*step-40)*seg(p,0.02,0.9)), fill=GREY, width=4)
    for i, lab in enumerate(labels):
        a = seg(p, 0.05+i*0.8/n, 0.05+i*0.8/n+0.15); y = y0+10+i*step
        d.ellipse((lx-17, y-17, lx+17, y+17), fill=mix(PAPER,a), outline=mix(GREEN,a), width=5)
        if a > 0: d.ellipse((lx-8,y-8,lx+8,y+8), fill=mix(GREEN,a))
        f, L, s = fit(d, lab, x1-lx-70, step-30, 42, 24, 600, 3)
        ty = y - len(L)*s*1.15/2 + 14 + (1-a)*24
        draw_lines(d, L, f, lx+60, ty, mix(INK,a), s*1.15)
        d.text((lx+60, ty-12), f"STEP {i+1}", font=font(30,700), fill=mix(INK,a), anchor="ls")

def v_document(d, img, labels, values, p):
    """Actual checklist content; never placeholder document/skeleton strokes."""
    x0,y0,x1,y1 = VIS
    n = max(1,len(labels)); gap = 16; rh = (y1-y0-gap*(n-1))/n
    for i, lab in enumerate(labels):
        a = seg(p, .03+i*.7/n, .03+i*.7/n+.16)
        if a <= 0: continue
        y = y0+i*(rh+gap)+(1-a)*18
        d.rounded_rectangle((x0,y,x1,y+rh),18,fill=mix(TINT,a),outline=mix(RULE,a),width=2)
        # Each labeled row has a numbered check, conveying a review item rather than fake prose.
        cx,cy=x0+57,y+rh/2
        d.ellipse((cx-27,cy-27,cx+27,cy+27),fill=mix(GREEN,a))
        d.text((cx,cy),str(i+1),font=font(30,700),fill=mix(PAPER,a),anchor="mm")
        f,L,z=fit(d,lab,x1-x0-146,rh-30,46,28,650,3,1.15)
        draw_lines(d,L,f,x0+112,y+rh/2-len(L)*z*1.15/2,mix(INK,a),z*1.15)

def v_comparison(d, img, labels, values, p):
    x0,y0,x1,y1 = VIS; half = (x1-x0)//2; gap = 16
    n = len(labels); L1 = labels[:(n+1)//2]; L2 = labels[(n+1)//2:]
    rows = max(len(L1), len(L2), 1); head = 70; rh = (y1-y0-head)//rows
    d.line(((x0+x1)//2, y0, (x0+x1)//2, y1), fill=RULE, width=3)
    for col, (items, c, tag) in enumerate([(L1, GREEN, "A"), (L2, RUST, "B")]):
        xs = x0 + col*half + (gap if col else 0); xe = xs + half - gap
        d.rectangle((xs, y0, xe, y0+8), fill=mix(c, seg(p,0,0.15)))
        for i, lab in enumerate(items):
            a = seg(p, 0.1+(i*2+col)*0.8/(2*rows), 0.1+(i*2+col)*0.8/(2*rows)+0.14)
            y = y0+head+i*rh + (1-a)*26
            d.rounded_rectangle((xs, y, xe, y+rh-18), 16, fill=mix(TINT,a), outline=mix(c,a), width=2)
            f, L, s = fit(d, lab, xe-xs-44, rh-60, 38, 22, 600, 5, 1.15)
            draw_lines(d, L, f, xs+22, y+(rh-18)/2-len(L)*s*1.15/2, mix(INK,a), s*1.15)

def v_grid(d, img, labels, values, p):
    x0,y0,x1,y1 = VIS; n = max(1, len(labels)); cols = 2 if n <= 6 else 3
    rows = math.ceil(n/cols); g = 22; cw = (x1-x0-g*(cols-1))/cols; ch = (y1-y0-g*(rows-1))/rows
    for i, lab in enumerate(labels):
        r, c = divmod(i, cols); a = seg(p, 0.05+i*0.75/n, 0.05+i*0.75/n+0.18)
        xs = x0+c*(cw+g); ys = y0+r*(ch+g)+(1-a)*24
        d.rounded_rectangle((xs, ys, xs+cw, ys+ch), 16, fill=mix(TINT,a), outline=mix(RULE,a), width=2)
        d.rectangle((xs, ys, xs+cw, ys+8), fill=mix(GREEN if i%2==0 else RUST, a))
        hasv = True
        d.text((xs+22, ys+30), f"{i+1:02d}", font=font(46,700), fill=mix(GREEN,a))
        f, L, s = fit(d, lab, cw-44, ch-(110 if hasv else 60), 36, 20, 600, 5, 1.15)
        draw_lines(d, L, f, xs+22, ys+(100 if hasv else 40), mix(INK,a), s*1.15)

VISUALS = dict(flow=v_flow, bars=v_bars, pie=v_pie, timeline=v_timeline, document=v_document, comparison=v_comparison, grid=v_grid)

# ---------------- text / sentence handling ----------------
def split_sentences(t):
    s = re.split(r'(?<=[.!?])\s+', t.strip()); return [x for x in s if x]

async def tts(text, mp3, tries=4):
    import edge_tts
    last = None
    for k in range(tries):
        try:
            com = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
            bounds = []
            with open(mp3, "wb") as fh:
                async for ch in com.stream():
                    if ch["type"] == "audio": fh.write(ch["data"])
                    elif ch["type"] in ("SentenceBoundary","WordBoundary"):
                        bounds.append((ch["type"], ch["offset"]/1e7, (ch["offset"]+ch["duration"])/1e7, ch["text"]))
            return bounds
        except Exception as e:
            last = e; await asyncio.sleep(2+k*2)
    raise last

def probe_dur(path):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nw=1:nk=1",path]).decode())

def normalized(text):
    import html
    return "".join(re.findall(r"[\w]", html.unescape(text).casefold()))

def alignment(narr, bounds, total):
    words = [b for b in bounds if b[0] == "WordBoundary"]
    if not words or normalized(narr) != "".join(normalized(b[3]) for b in words):
        raise ValueError("TTS word boundary text differs from narration; no guessed timing allowed")
    positions=[]; pos=0
    for b in words:
        positions.append((pos,b[1],b[2]));pos += len(normalized(b[3]))
    def at(char):
        if char == 0:return 0.0
        if char >= pos:return total
        for c,a,b in positions:
            if c == char:return a
        raise ValueError("Text split is inside a spoken word; exact boundary unavailable")
    return at

def timed_parts(parts, narr, bounds, total):
    if normalized(" ".join(parts)) != normalized(narr):
        raise ValueError("Parts do not equal narration")
    at=alignment(narr,bounds,total); pos=0; starts=[]
    for part in parts:
        starts.append(at(pos));pos+=len(normalized(part))
    return [(a,starts[i+1] if i+1<len(starts) else total,parts[i]) for i,a in enumerate(starts)]

def sentence_times(narr, bounds, total):
    return timed_parts(split_sentences(narr),narr,bounds,total)

def assign_by_text(sent_t, parts, narr, bounds, total):
    return [(a,b) for a,b,_ in timed_parts(parts,narr,bounds,total)]

def caption_chunks(narr, bounds, total, probe_d):
    """Readable chunks at true provider events; grouped phrases remain indivisible."""
    f=font(54,650);maxw=W-2*ML;parts=[]
    allowed={0};pos=0
    for event in bounds:
        if event[0]=="WordBoundary":
            pos+=len(normalized(event[3]));allowed.add(pos)
    absolute=0
    for sentence in split_sentences(narr):
        atoms=[];group=[]
        for word in sentence.split():
            group.append(word);absolute+=len(normalized(word))
            if absolute in allowed:
                atoms.append(" ".join(group));group=[]
        if group:raise ValueError("Sentence ends inside a provider phrase")
        cur=[]
        for atom in atoms:
            if cur and len(wrap(probe_d," ".join(cur+[atom]),f,maxw))>2:
                parts.append(" ".join(cur));cur=[]
            cur.append(atom)
        if cur:parts.append(" ".join(cur))
    return timed_parts(parts,narr,bounds,total)

def srt_time(t):
    ms = int(round(t*1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"

# ---------------- frame rendering ----------------
def scene_static(topic, sc, idx, nscenes, tot_title):
    img = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(img)
    return img

def render_frame(topic, scenes, sbounds, chunks, t, dur, base):
    img = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(img)
    k = max(i for i in range(len(scenes)) if t >= sbounds[i][0] - 1e-6)
    sc = scenes[k]; s0, s1 = sbounds[k]; lt = t - s0; p = max(0, min(1, lt/max(0.5, (s1-s0)*0.82)))
    # header
    d.text((ML, 110), "CATALYST  /  INVESTOR EDUCATION", font=font(30,700), fill=INK, anchor="ls")
    d.line((ML, 130, W-ML, 130), fill=RULE, width=2)
    d.text((W-ML, 110), f"{k+1:02d} / {len(scenes):02d}", font=font(30,700), fill=INK, anchor="rs")
    # kicker + headline
    ka = seg(lt, 0, 0.45); ha = seg(lt, 0.1, 0.65)
    d.text((ML, 200), str(sc.get("kicker","")).upper(), font=font(36,700), fill=mix(INK,ka), anchor="ls")
    f, L, s = fit(d, sc.get("headline",""), W-2*ML, 330, 80, 44, 700, 3, 1.1)
    draw_lines(d, L, f, ML, 232+(1-ha)*28, mix(INK,ha), s*1.1)
    d.line((ML, 560, ML+120*ha, 560), fill=GREEN, width=6)
    # visual
    fn = VISUALS.get(sc.get("visual"), v_grid)
    fn(d, img, [str(x) for x in sc.get("labels", [])], [float(x) for x in sc.get("values", [])], p)
    # progress
    global_progress = max(0.0,min(1.0,t/dur))
    d.rectangle((ML,1700,W-ML,1710),fill=RULE)
    d.rectangle((ML,1700,ML+(W-2*ML)*global_progress,1710),fill=GREEN)
    d.text((ML, 1752), str(topic["title"]), font=font(30,600), fill=INK, anchor="ls")
    # caption
    for a, b, txt in chunks:
        if a <= t < b or (t >= b and chunks[-1][1] == b and txt == chunks[-1][2]):
            cf = font(54, 650); L = wrap(d, txt, cf, W-2*ML); lh = 68
            hbox = len(L)*lh+36; top = (CAP_Y[0]+CAP_Y[1])/2 - hbox/2
            d.rounded_rectangle((ML-24, top, W-ML+24, top+hbox), 20, fill=INK)
            for i, l in enumerate(L): d.text((W/2, top+18+i*lh+lh/2), l, font=cf, fill=(255,255,255), anchor="mm")
            break
    return img

def log_setup():
    logging.basicConfig(filename=os.path.join(ROOT,"render.log"), level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    h = logging.StreamHandler(); h.setLevel(logging.INFO); logging.getLogger().addHandler(h)

def paths(i):
    return {k: os.path.join(ROOT, v) for k, v in dict(mp3=f"audio/{i}.mp3", srt=f"captions/{i}.srt", mp4=f"videos/{i}.mp4",
        meta=f"audio/{i}.json", thumb=f"thumbnails/{i}.jpg", frames=f"frames/{i}").items()}

def nhash(topic): return hashlib.sha256((VOICE + RATE + "|WordBoundary|\n" + topic["narration"]).encode()).hexdigest()[:16]
def vhash(topic):
    return hashlib.sha256(json.dumps([nhash(topic), topic["scenes"], topic.get("scene_narration"), topic["title"], open(__file__,"rb").read().decode()], sort_keys=True).encode()).hexdigest()[:16]

def do_audio(topic):
    P = paths(topic["id"])
    if os.path.exists(P["meta"]) and os.path.exists(P["mp3"]):
        if json.load(open(P["meta"])).get("hash") == nhash(topic): return topic["id"], "cached"
        logging.info("narration changed for %s, regenerating audio", topic["id"])
    logging.info("audio %s", topic["id"])
    bounds = asyncio.run(tts(topic["narration"], P["mp3"]))
    total = probe_dur(P["mp3"])
    json.dump({"bounds": bounds, "total": total, "hash": nhash(topic)}, open(P["meta"], "w"))
    return topic["id"], f"{total:.1f}s"

def do_video(topic):
    i = topic["id"]; P = paths(i)
    vh = vhash(topic); hp = P["mp4"] + ".hash"
    if os.path.exists(P["mp4"]) and os.path.exists(hp) and open(hp).read() == vh: return i, "cached"
    meta = json.load(open(P["meta"]))
    if meta.get("hash") != nhash(topic): raise RuntimeError("audio stale for " + i)
    total = meta["total"] + 0.6
    probe = ImageDraw.Draw(Image.new("RGB",(10,10)))
    sent_t = sentence_times(topic["narration"], [tuple(b) for b in meta["bounds"]], meta["total"])
    scenes = topic["scenes"]; sn = topic.get("scene_narration")
    if sn and len(sn) == len(scenes): sb = assign_by_text(sent_t, sn, topic["narration"], meta["bounds"], meta["total"])
    else:
        raise ValueError("All scenes require exact scene_narration")
    sb[-1] = (sb[-1][0], total)
    chunks = caption_chunks(topic["narration"], meta["bounds"], meta["total"], probe)
    with open(P["srt"], "w") as fh:
        for n, (a, b, txt) in enumerate(chunks, 1):
            fh.write(f"{n}\n{srt_time(a)} --> {srt_time(b)}\n" + "\n".join(wrap(probe, txt, font(54,650), W-2*ML)) + "\n\n")
    os.makedirs(P["frames"], exist_ok=True)
    tmp = P["mp4"] + ".part.mp4"
    cmd = ["ffmpeg","-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-i",P["mp3"],
           "-c:v","libx264","-preset","medium","-crf","24","-maxrate","3M","-bufsize","6M","-pix_fmt","yuv420p","-profile:v","high",
           "-c:a","aac","-b:a","96k","-ar","44100","-t",f"{total:.3f}","-movflags","+faststart",tmp]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    nf = int(total*FPS); marks = {int(nf*q)-1 for q in (0.25,0.5,0.75)}; thumbsrc = None
    scene_marks = {int((sb[k][0] + (sb[k][1]-sb[k][0])*0.75)*FPS) for k in range(len(scenes))}
    for n in range(nf):
        t = n/FPS; img = render_frame(topic, scenes, sb, chunks, t, total, None)
        if n in scene_marks:
            img.resize((540,960), Image.LANCZOS).save(os.path.join(P["frames"], f"scene_{n:05d}.jpg"), quality=85)
        if n == int(nf*0.5): img.resize((720,1280), Image.LANCZOS).save(P["thumb"], quality=88)
        pr.stdin.write(img.tobytes())
    pr.stdin.close()
    if pr.wait() != 0: raise RuntimeError("ffmpeg failed " + i)
    os.replace(tmp, P["mp4"]); open(hp, "w").write(vh)
    return i, f"{total:.1f}s {os.path.getsize(P['mp4'])/1e6:.1f}MB"

def verify(topics):
    ok = True
    for t in topics:
        P = paths(t["id"])
        if not os.path.exists(P["mp4"]): logging.error("MISSING %s", t["id"]); ok = False; continue
        out = subprocess.check_output(["ffprobe","-v","error","-show_entries","stream=codec_type,width,height,duration","-of","json",P["mp4"]]).decode()
        j = json.loads(out)["streams"]; v = [s for s in j if s["codec_type"]=="video"][0]; a = [s for s in j if s["codec_type"]=="audio"]
        dur = float(v["duration"]); mb = os.path.getsize(P["mp4"])/1e6
        probs = []
        if (v["width"], v["height"]) != (W, H): probs.append("dimensions")
        if not a: probs.append("no audio")
        if not 45 <= dur <= 90: probs.append(f"duration {dur:.1f}s outside 45-90")
        if mb > 20: probs.append(f"size {mb:.1f}MB")
        logging.info("PROBE %s %sx%s %.1fs %.1fMB audio=%s %s", t["id"], v["width"], v["height"], dur, mb, bool(a), "OK" if not probs else "PROBLEM: "+", ".join(probs))
        ok &= not probs
    return ok

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--only"); ap.add_argument("--force", action="store_true")
    ap.add_argument("--curriculum", default=os.path.join(ROOT, "curriculum.json"))
    ap.add_argument("--audio-workers", type=int, default=3); ap.add_argument("--video-workers", type=int, default=2)
    a = ap.parse_args(); log_setup()
    if not os.path.exists(FONT): sys.exit("font missing: " + FONT)
    if not os.path.exists(a.curriculum): sys.exit("curriculum not found: " + a.curriculum)
    topics = json.load(open(a.curriculum))
    if a.only:
        want = set(a.only.split(",")); topics = [t for t in topics if t["id"] in want]
        if not topics: sys.exit("no matching ids")
    for d_ in ("audio","captions","videos","frames","thumbnails"): os.makedirs(os.path.join(ROOT,d_), exist_ok=True)
    for t in topics:
        assert len(t["scenes"]) >= 1 and t.get("narration"), t["id"]
        if a.force:
            for k in ("meta","mp4"):
                try: os.remove(paths(t["id"])[k])
                except FileNotFoundError: pass
    t0 = time.time(); failed = []
    with ProcessPoolExecutor(a.audio_workers) as ex:
        for f, t in zip([ex.submit(do_audio, t) for t in topics], topics):
            try: logging.info("audio done %s %s", *f.result())
            except Exception as e: logging.error("audio FAIL %s %s", t["id"], e); failed.append(t["id"])
    ready = [t for t in topics if t["id"] not in failed]
    with ProcessPoolExecutor(a.video_workers) as ex:
        for f, t in zip([ex.submit(do_video, t) for t in ready], ready):
            try: logging.info("video done %s %s", *f.result())
            except Exception as e: logging.error("video FAIL %s %s", t["id"], e); failed.append(t["id"])
    ok = verify([t for t in topics if t["id"] not in failed])
    logging.info("finished in %.0fs, failed=%s", time.time()-t0, failed)
    sys.exit(0 if ok and not failed else 1)

if __name__ == "__main__": main()
