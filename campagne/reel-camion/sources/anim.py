import math, sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np
D=os.path.dirname(os.path.abspath(__file__)); os.makedirs(D+'/out',exist_ok=True)
W,H,FPS,DUR=1080,1920,30,8.0
plate=Image.open(D+'/plate.png').convert('RGB').resize((W,H),Image.LANCZOS)
HOOD=int(H*0.845)  # haut du capot
hood=plate.crop((0,HOOD-40,W,H)).convert('RGBA')
m=Image.new('L',hood.size,255); dr=ImageDraw.Draw(m)
for i in range(40): dr.line([(0,i),(W,i)],fill=int(255*i/40))
hood.putalpha(m)
def prep(p,w):
    im=Image.open(p).convert('RGBA'); im=im.resize((w,int(im.height*w/im.width)),Image.LANCZOS)
    rgb=im.convert('RGB'); rgb=ImageEnhance.Color(rgb).enhance(1.05); rgb=ImageEnhance.Brightness(rgb).enhance(1.03)
    r,g,b=rgb.split(); r=r.point(lambda v:min(255,int(v*1.03))); b=b.point(lambda v:int(v*0.97))
    out=Image.merge('RGB',(r,g,b)).filter(ImageFilter.GaussianBlur(0.6)).convert('RGBA'); out.putalpha(im.getchannel('A')); return out
TW=440
biz=prep(D+'/truck-biz-cut.png',TW); neam=prep(D+'/truck-neam-logo.png',TW)
VP=(575,800)
def ease(x): x=max(0,min(1,x)); return x*x*(3-2*x)
def place(canvas,img,cx,by,scale,ang,pivot='c'):
    w,h=img.size; s=img.resize((max(1,int(w*scale)),max(1,int(h*scale))),Image.LANCZOS); w,h=s.size
    if ang==0: canvas.alpha_composite(s,(int(cx-w/2),int(by-h))); return
    # rotation autour de la roue droite (pivot bas droit), sens horaire = penche vers la droite
    pad=max(w,h)*2; big=Image.new('RGBA',(pad,pad),(0,0,0,0)); px,py=pad//2,pad//2
    big.alpha_composite(s,(px-w,py-h))  # coin bas droit au centre
    r=big.rotate(-ang,resample=Image.BICUBIC,center=(px,py))
    canvas.alpha_composite(r,(int(cx+w/2-px),int(by-py)))
def shadow(canvas,cx,by,w,op):
    sh=Image.new('RGBA',canvas.size,(0,0,0,0)); d=ImageDraw.Draw(sh)
    d.ellipse([cx-w*0.55,by-14,cx+w*0.55,by+16],fill=(0,0,0,int(op)))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))
N=int(DUR*FPS)
BIZX,BY=400,1345; PIV=BIZX+TW/2; HB=biz.height
NEAM_FINAL=PIV+TW/2+6
for f in range(N):
    t=f/FPS
    z=1+0.035*t/DUR; sx=2.2*math.sin(t*9.1)+1.3*math.sin(t*23); sy=1.6*math.sin(t*11.3)
    bg=plate.resize((int(W*z),int(H*z)),Image.BILINEAR)
    ox=int(VP[0]*(z-1))-sx; oy=int(VP[1]*(z-1))-sy
    fr=bg.crop((ox,oy,ox+W,oy+H)).convert('RGBA')
    # camion NEAM : arrive par la droite (plus près), puis pousse
    a=ease((t-1.2)/1.6); xL_arr=1340+(PIV+math.sin(math.radians(24))*HB+4-1340)*a
    b=ease((t-2.9)/1.5); xL=xL_arr+(NEAM_FINAL-TW/2+0-xL_arr)*b if t>2.9 else xL_arr
    ns=1.55-(0.55)*a; nby=1640-(1640-BY)*a
    # angle du camion "Votre entreprise"
    wob=23+4.5*math.sin(t*2*math.pi*1.1)+1.2*math.sin(t*17)
    cont=math.degrees(math.asin(max(0,min(1,(xL-PIV)/HB)))) if ns<1.05 else 90
    ang=min(wob,cont)
    land=t-4.4
    if land>0: ang=-2.2*math.exp(-land*4)*math.sin(land*14)
    bump=0 if land<=0 else -6*math.exp(-land*5)*abs(math.sin(land*12))
    jit=1.5*math.sin(t*19)
    ncx=xL+TW*ns/2
    shadow(fr,BIZX,BY+2,TW*0.9,140); 
    place(fr,biz,BIZX,BY+jit+bump,1,max(-3,ang) if abs(ang)>0.05 else 0)
    shadow(fr,ncx,nby+2,TW*ns*0.9,150)
    place(fr,neam,ncx,nby+1.5*math.sin(t*17+1),ns,0)
    fr.alpha_composite(hood,(0,HOOD-40))
    arr=np.asarray(fr.convert('RGB')).astype(np.float32)
    arr+=np.random.default_rng(f).normal(0,3.2,arr.shape[:2])[...,None]
    arr=(arr-128)*1.04+128+np.array([3,1,-3])
    Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).save(f'{D}/out/f{f:04d}.jpg',quality=92)
print('ok',N)
