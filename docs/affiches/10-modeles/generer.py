"""Génère les 10 modèles d'affiches (HTML 1080×1620). Rendu PNG via rendu.js."""
import calendar, pathlib

OUT = pathlib.Path(__file__).parent
TEL = "062 28 28 83"
ADDR = "Louis, entre le restaurant La&nbsp;Roma et le siège du PDG"
TT = "@gentlemanbarbershop4"
SERV = ["Coupe homme", "Coupe enfant", "Onglerie homme &amp; femme", "Dreadlocks",
        "Coloration", "Soins du visage", "Massages", "Produits cosmétiques"]
SIGN = "Votre style, notre priorité."
CAUSE = "Ensemble, luttons contre le cancer de la prostate."

FONTS = ("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500"
         "&family=Archivo:wght@400;500;600;700;800;900&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,700;0,6..96,900;1,6..96,400"
         "&family=IBM+Plex+Mono:wght@400;500;600&display=swap")

BASE = """
:root{--paper:#F1ECE3;--ink:#15171B;--mute:#6E6A63;--line:#CFC7BA;--blue:#1C3C8E;--night:#0D1830}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#777}
#poster{width:1080px;height:1620px;position:relative;overflow:hidden;font-family:Archivo,sans-serif;color:var(--ink);background:var(--paper)}
.grain::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.10;mix-blend-mode:multiply;z-index:50;
 background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.serif{font-family:'Cormorant Garamond',serif}
.bodoni{font-family:'Bodoni Moda',serif}
.mono{font-family:'IBM Plex Mono',monospace}
.caps{text-transform:uppercase;letter-spacing:.3em;font-size:13px;font-weight:500}
.lining{font-variant-numeric:lining-nums}
"""

def ribbon(color, w=6, cls=""):
    return (f'<svg class="{cls}" viewBox="0 0 100 150" fill="none" stroke="{color}" stroke-width="{w}" '
            'stroke-linecap="round" stroke-linejoin="round"><path d="M50 70 C 22 42, 24 8, 50 8 C 76 8, 78 42, 50 70 L 16 142"/>'
            '<path d="M50 70 L 84 142"/></svg>')

def page(n, title, css, body, grain=True):
    html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{title}</title>
<link href="{FONTS}" rel="stylesheet"><style>{BASE}{css}</style></head>
<body><div id="poster" class="{'grain' if grain else ''}">{body}</div></body></html>"""
    (OUT / f"{n:02d}.html").write_text(html, encoding="utf-8")

serv_line = lambda sep: sep.join(SERV)

# 01 — Nuit typographique ------------------------------------------------------
page(1, "Nuit", """
#poster{background:var(--night);color:#EDE6D8}
.top{position:absolute;top:72px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center}
.top img{width:84px}
.top .caps{opacity:.7;text-align:right;line-height:1.9}
.big{position:absolute;left:52px;top:190px;font-family:'Cormorant Garamond';font-weight:300;font-size:760px;line-height:.8;letter-spacing:-.06em;color:#EDE6D8}
.k{position:absolute;right:80px;top:300px;text-align:right}
.k .z{font-family:'Cormorant Garamond';font-weight:300;font-size:150px;line-height:.85}
.k .c{font-weight:700;letter-spacing:.3em;font-size:22px;margin-top:14px}
.title{position:absolute;left:80px;top:950px;font-family:'Cormorant Garamond';font-style:italic;font-size:96px;line-height:1}
.title span{color:#7E9BE0}
.cause{position:absolute;left:80px;top:1075px;font-family:'Cormorant Garamond';font-style:italic;font-size:26px;opacity:.75}
.list{position:absolute;left:80px;right:80px;top:1170px;border-top:1px solid rgba(237,230,216,.25)}
.list div{display:flex;justify-content:space-between;padding:20px 0;border-bottom:1px solid rgba(237,230,216,.25);font-size:22px}
.list b{font-weight:600}
.foot{position:absolute;left:80px;right:80px;bottom:72px;display:flex;justify-content:space-between;align-items:flex-end;font-size:17px;line-height:1.6}
.foot .tel{font-size:34px;font-weight:600;letter-spacing:.03em}
.foot .r{text-align:right;opacity:.75;max-width:420px}
.rb{position:absolute;right:86px;top:968px;width:46px}
""", f"""
<div class="top"><img src="logo-clair.png"><div class="caps">Gentleman Barber &amp; Shop<br>Du 2 nov. au 1<sup>er</sup> déc. 2026</div></div>
<div class="big lining">15</div>
<div class="k"><div class="z lining">000</div><div class="c">FCFA</div></div>
<div class="title">Novembre <span>Bleu</span></div>
{ribbon('#7E9BE0',6,'rb')}
<div class="cause">{CAUSE}</div>
<div class="list"><div><span>Coupe, noircissage &amp; gommage</span><b>5 000</b></div><div><span>Manucure &amp; pédicure</span><b>10 000</b></div></div>
<div class="foot"><div><div class="tel">{TEL}</div>Appel &amp; WhatsApp · TikTok {TT}</div><div class="r">{ADDR}</div></div>
""", grain=False)

# 02 — Carte de grand restaurant ----------------------------------------------
page(2, "Carte", """
#poster{text-align:center;padding:96px 120px}
.frame{position:absolute;inset:40px;border:1px solid var(--ink)}
.frame::after{content:"";position:absolute;inset:8px;border:1px solid var(--ink)}
img.logo{width:92px;margin:0 auto;display:block}
.house{margin-top:24px}
.t1{font-family:'Cormorant Garamond';font-style:italic;font-size:30px;margin-top:70px;color:var(--mute)}
h1{font-family:'Cormorant Garamond';font-weight:400;font-size:112px;letter-spacing:.06em;line-height:1;margin-top:8px}
h1 em{display:block;font-style:italic;font-size:70px;letter-spacing:0;color:var(--blue);margin-top:8px}
.orn{margin:44px auto;width:120px;display:flex;align-items:center;gap:12px}
.orn i{flex:1;height:1px;background:var(--ink)}.orn b{width:7px;height:7px;transform:rotate(45deg);border:1px solid var(--ink)}
.course{margin-bottom:38px}
.course .caps{color:var(--mute);font-size:12px}
.course .n{font-family:'Cormorant Garamond';font-size:40px;margin-top:10px}
.course .p{font-family:'Cormorant Garamond';font-style:italic;font-size:26px;color:var(--mute);margin-top:4px}
.total .n{font-size:64px;font-weight:500}
.total .p{color:var(--blue);font-style:normal;letter-spacing:.2em;font-size:18px;font-family:Archivo;font-weight:600}
.dates{font-family:'Cormorant Garamond';font-style:italic;font-size:26px}
.cause{font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:var(--mute);margin-top:14px}
.foot{position:absolute;left:120px;right:120px;bottom:96px;font-size:16px;line-height:1.8}
.foot .tel{font-family:'Cormorant Garamond';font-size:36px;font-weight:500;letter-spacing:.05em}
""", f"""
<div class="frame"></div>
<img class="logo" src="logo.png"><div class="caps house">Gentleman Barber &amp; Shop</div>
<div class="t1">La carte de</div>
<h1>NOVEMBRE<em>bleu</em></h1>
<div class="orn"><i></i><b></b><i></i></div>
<div class="course"><div class="caps">Premier temps</div><div class="n">Coupe, noircissage, gommage</div><div class="p">cinq mille francs</div></div>
<div class="course"><div class="caps">Second temps</div><div class="n">Manucure &amp; pédicure</div><div class="p">dix mille francs</div></div>
<div class="course total"><div class="caps">Le menu complet</div><div class="n lining">15 000</div><div class="p">FCFA</div></div>
<div class="orn"><i></i><b></b><i></i></div>
<div class="dates">Servi du 2 novembre au 1<sup>er</sup> décembre 2026</div>
<div class="cause">{CAUSE}</div>
<div class="foot"><div class="tel">{TEL}</div>{ADDR}<br>TikTok {TT}</div>
""")

# 03 — Grille suisse ----------------------------------------------------------
page(3, "Suisse", """
#poster{background:#F4F3EF;padding:64px}
.g{display:grid;grid-template-columns:repeat(6,1fr);column-gap:24px;height:100%;position:relative}
.hd{grid-column:1/7;display:flex;justify-content:space-between;align-items:flex-start;font-size:15px;font-weight:600;line-height:1.35;border-top:6px solid var(--ink);padding-top:16px}
.hd img{width:64px}
.num{grid-column:1/7;font-weight:900;font-size:268px;letter-spacing:-.06em;line-height:.8;margin-top:110px;white-space:nowrap;word-spacing:.12em}
.cur{grid-column:1/3;font-weight:800;font-size:40px;margin-top:20px}
.blk{grid-column:3/7;background:var(--blue);color:#F4F3EF;padding:28px 30px 32px;margin-top:20px;height:330px;display:flex;flex-direction:column;justify-content:space-between}
.blk h1{font-weight:800;font-size:76px;line-height:.92;letter-spacing:-.03em}
.blk p{font-size:17px;font-weight:500;max-width:340px;line-height:1.35}
.it{grid-column:span 3;border-top:2px solid var(--ink);padding-top:14px;margin-top:70px}
.it .a{font-size:14px;font-weight:600}.it .b{font-size:34px;font-weight:800;letter-spacing:-.02em;margin-top:30px;line-height:1.05}
.it .c{font-size:22px;font-weight:600;margin-top:10px}
.ft{grid-column:1/7;position:absolute;bottom:0;left:0;right:0;display:grid;grid-template-columns:repeat(6,1fr);column-gap:24px;font-size:15px;line-height:1.4;border-top:2px solid var(--ink);padding-top:14px}
.ft>div{grid-column:span 2}
.ft .tel{font-size:30px;font-weight:800;letter-spacing:-.01em}
.dt{grid-column:1/3;font-size:16px;font-weight:600;line-height:1.35;margin-top:24px}
""", f"""
<div class="g">
<div class="hd"><div>Gentleman<br>Barber &amp; Shop</div><div>Promotion<br>novembre 2026</div><div>02.11 —<br>01.12</div><img src="logo.png"></div>
<div class="num lining">15 000</div>
<div class="cur">FCFA<div class="dt">Le package<br>complet</div></div>
<div class="blk"><h1>Novembre<br>Bleu</h1><p>{CAUSE}</p></div>
<div class="it"><div class="a">01</div><div class="b">Coupe<br>Noircissage<br>Gommage</div><div class="c">5 000 FCFA</div></div>
<div class="it"><div class="a">02</div><div class="b">Manucure<br>Pédicure</div><div class="c">10 000 FCFA</div></div>
<div class="ft"><div><div class="tel">{TEL}</div>Appel / WhatsApp</div><div>{ADDR}</div><div>TikTok<br>{TT}</div></div>
</div>
""", grain=False)

# 04 — Plein cadre photo ------------------------------------------------------
page(4, "Plein cadre", """
#poster{background:#111 url(salon-portrait.jpg) center/cover;color:#EFE9DD}
.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,10,.55) 0%,rgba(8,8,10,0) 22%,rgba(8,8,10,.15) 45%,rgba(8,8,10,.92) 72%,rgba(8,8,10,.97) 100%)}
.top{position:absolute;top:64px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center}
.top img{width:80px}.top .caps{opacity:.85;text-align:right;line-height:1.9}
.bt{position:absolute;left:72px;right:72px;bottom:64px}
.bt .k{color:#9DB3EA}
h1{font-family:'Cormorant Garamond';font-weight:300;font-size:150px;line-height:.86;letter-spacing:-.02em;margin-top:16px}
h1 em{font-style:italic;color:#9DB3EA}
.row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px;padding-top:26px;border-top:1px solid rgba(239,233,221,.3)}
.pr{font-family:'Cormorant Garamond';font-size:96px;font-weight:300;line-height:.8}
.pr small{font-family:Archivo;font-size:18px;letter-spacing:.24em;font-weight:600;margin-left:12px}
.dl{font-size:18px;line-height:1.6;text-align:right;opacity:.85}
.inf{display:flex;justify-content:space-between;margin-top:34px;font-size:16px;line-height:1.6;opacity:.85;gap:40px}
.inf b{font-size:26px;font-weight:600;opacity:1;letter-spacing:.03em}
""", f"""
<div class="sh"></div>
<div class="top"><img src="logo-clair.png"><div class="caps">Gentleman Barber &amp; Shop<br>présente</div></div>
<div class="bt"><div class="caps k">{CAUSE}</div>
<h1>Novembre<br><em>Bleu.</em></h1>
<div class="row"><div class="pr lining">15 000<small>FCFA</small></div><div class="dl">Coupe · noircissage · gommage — 5 000<br>Manucure · pédicure — 10 000<br>Du 2 nov. au 1<sup>er</sup> déc. 2026</div></div>
<div class="inf"><div><b>{TEL}</b><br>Appel &amp; WhatsApp</div><div style="text-align:right">{ADDR}<br>TikTok {TT}</div></div></div>
""")

# 05 — Le reçu ---------------------------------------------------------------
page(5, "Reçu", """
#poster{background:#1B1D21;display:flex;align-items:center;justify-content:center}
.r{width:700px;background:#F6F2EA;padding:70px 60px 56px;font-family:'IBM Plex Mono';font-size:21px;color:#1B1D21;position:relative;
 transform:rotate(-1.4deg);box-shadow:0 30px 60px rgba(0,0,0,.45);
 -webkit-mask:conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) 50%/22px 100%}
.c{text-align:center}
.r img{width:86px;display:block;margin:0 auto 18px}
.h{font-weight:600;letter-spacing:.2em}
.d{border-top:2px dashed #1B1D21;margin:26px 0}
.l{display:flex;justify-content:space-between;line-height:1.7}
.s{font-size:15px;color:#555;line-height:1.6}
.t{display:flex;justify-content:space-between;font-size:30px;font-weight:600;align-items:baseline}
.bl{color:var(--blue);font-weight:600}
.qr{width:120px;display:block;margin:10px auto}
.under{position:absolute;bottom:58px;left:0;right:0;text-align:center;color:#8C8A85;font-family:'Cormorant Garamond';font-style:italic;font-size:26px}
""", f"""
<div class="r">
<img src="logo.png"><div class="c h">GENTLEMAN BARBER &amp; SHOP</div>
<div class="c s">{ADDR}<br>Tél / WhatsApp {TEL}</div>
<div class="d"></div>
<div class="c">*** NOVEMBRE BLEU ***</div>
<div class="c s">Valable du 02/11/2026 au 01/12/2026</div>
<div class="d"></div>
<div class="l"><span>1 x COUPE</span><span></span></div>
<div class="l"><span>  + NOIRCISSAGE</span></div>
<div class="l"><span>  + GOMMAGE</span><span>5 000</span></div>
<div class="l" style="margin-top:10px"><span>1 x MANUCURE</span></div>
<div class="l"><span>  + PÉDICURE</span><span>10 000</span></div>
<div class="d"></div>
<div class="t"><span>TOTAL</span><span>15 000 FCFA</span></div>
<div class="d"></div>
<div class="c s bl">{CAUSE}</div>
<img class="qr" src="qr-tiktok.svg">
<div class="c s">TikTok {TT}</div>
<div class="c" style="margin-top:20px">MERCI, GENTLEMAN.</div>
</div>
<div class="under">{SIGN}</div>
""", grain=False)

# 06 — Le ruban ---------------------------------------------------------------
page(6, "Ruban", """
.rb{position:absolute;left:180px;top:120px;width:720px}
.tl{position:absolute;top:72px;left:80px;font-size:15px;line-height:1.7}
.tl img{width:70px;display:block;margin-bottom:16px}
.tr{position:absolute;top:72px;right:80px;text-align:right;color:var(--mute);line-height:1.9}
.mid{position:absolute;left:0;right:0;top:520px;text-align:center}
.mid h1{font-family:'Cormorant Garamond';font-weight:400;font-size:64px;letter-spacing:.24em;padding-left:.24em;background:var(--paper);display:inline-block;padding:10px 26px}
.mid h1 em{font-style:italic;letter-spacing:.02em;color:var(--blue)}
.bl{position:absolute;left:80px;bottom:72px;line-height:1.7;font-size:17px}
.bl .p{font-family:'Cormorant Garamond';font-size:120px;font-weight:300;line-height:.9}
.bl .p small{font-family:Archivo;font-size:18px;font-weight:600;letter-spacing:.24em;margin-left:10px}
.br{position:absolute;right:80px;bottom:72px;text-align:right;font-size:16px;line-height:1.7;max-width:380px}
.br .tel{font-size:30px;font-weight:600}
.cause{position:absolute;left:0;right:0;top:1180px;text-align:center;font-family:'Cormorant Garamond';font-style:italic;font-size:30px}
""", f"""
{ribbon('#1C3C8E',1.6,'rb')}
<div class="tl"><img src="logo.png">Gentleman<br>Barber &amp; Shop</div>
<div class="tr caps">Novembre<br>2026</div>
<div class="mid"><h1>NOVEMBRE <em>Bleu</em></h1></div>
<div class="cause">{CAUSE}</div>
<div class="bl"><div class="caps" style="color:var(--mute)">Le package complet</div><div class="p lining">15 000<small>FCFA</small></div>
Coupe, noircissage, gommage · 5 000<br>Manucure, pédicure · 10 000<br>Du 2 novembre au 1<sup>er</sup> décembre</div>
<div class="br"><div class="tel">{TEL}</div>{ADDR}<br>TikTok {TT}</div>
""")

# 07 — Diptyque ---------------------------------------------------------------
page(7, "Diptyque", """
#poster{display:grid;grid-template-columns:500px 1fr;background:var(--night);color:#EDE6D8}
.ph{background:#111 url(fauteuil.jpg) center/cover;position:relative}
.ph .v{position:absolute;left:44px;bottom:60px;writing-mode:vertical-rl;transform:rotate(180deg);font-family:'Cormorant Garamond';font-size:150px;font-weight:300;line-height:.8;color:#F1ECE3;letter-spacing:.02em}
.ph img{position:absolute;top:56px;left:44px;width:76px}
.tx{padding:72px 64px 64px;display:flex;flex-direction:column}
.tx .caps{opacity:.7;line-height:1.9}
.tx h1{font-family:'Cormorant Garamond';font-style:italic;font-weight:400;font-size:128px;line-height:.9;color:#8FA8E6;margin-top:150px}
.tx .ca{font-family:'Cormorant Garamond';font-style:italic;font-size:25px;margin-top:22px;opacity:.85;line-height:1.3}
.pr{margin-top:70px;font-family:'Cormorant Garamond';font-weight:300;font-size:128px;line-height:.85}
.pr small{display:block;font-family:Archivo;font-size:16px;font-weight:600;letter-spacing:.3em;margin-top:16px}
.ls{margin-top:46px;font-size:18px;line-height:1.9;border-top:1px solid rgba(237,230,216,.25);padding-top:18px}
.ls span{float:right;font-weight:600}
.ft{margin-top:auto;font-size:15px;line-height:1.7;opacity:.85}
.ft b{font-size:28px;letter-spacing:.03em;font-weight:600;display:block;opacity:1}
""", f"""
<div class="ph"><img src="logo-clair.png"><div class="v">Novembre</div></div>
<div class="tx"><div class="caps">Gentleman Barber &amp; Shop<br>02.11 — 01.12.2026</div>
<h1>Bleu.</h1><div class="ca">Ensemble, luttons contre<br>le cancer de la prostate.</div>
<div class="pr lining">15 000<small>FCFA · le package</small></div>
<div class="ls">Coupe, noircissage, gommage<span>5 000</span><br>Manucure, pédicure<span>10 000</span></div>
<div class="ft"><b>{TEL}</b>{ADDR}<br>TikTok {TT}</div></div>
""")

# 08 — Invitation ------------------------------------------------------------
page(8, "Invitation", """
#poster{background:var(--blue);display:flex;align-items:center;justify-content:center}
.card{width:840px;height:1340px;background:#F4EFE6;box-shadow:0 40px 80px rgba(0,0,0,.35);padding:96px 90px;text-align:center;position:relative;display:flex;flex-direction:column;align-items:center}
.card img.l{width:110px;opacity:.9}
.m{font-family:'Cormorant Garamond';font-style:italic;font-size:44px;margin-top:84px;line-height:1.25}
.m2{font-family:'Cormorant Garamond';font-size:26px;color:var(--mute);margin-top:22px;line-height:1.5;max-width:560px}
.h{font-family:'Cormorant Garamond';font-size:84px;letter-spacing:.14em;font-weight:400;margin-top:56px;line-height:1}
.h em{display:block;font-style:italic;letter-spacing:.02em;color:var(--blue);font-size:64px;margin-top:6px}
.dt{margin-top:48px}
.p{font-family:'Cormorant Garamond';font-size:30px;margin-top:40px;line-height:1.6}
.p b{font-weight:500;font-size:46px;display:block}
.rs{margin-top:auto;font-size:15px;line-height:1.7;color:var(--ink)}
.rs .t{font-family:'Cormorant Garamond';font-size:32px;font-weight:500;letter-spacing:.06em}
.rsvp{font-size:12px;letter-spacing:.3em;color:var(--mute);margin-bottom:6px}
""", f"""
<div class="card"><img class="l" src="logo.png">
<div class="m">Monsieur,<br>vous êtes attendu.</div>
<div class="m2">Tout le mois, Gentleman s'engage aux côtés de ceux qui luttent contre le cancer de la prostate.</div>
<div class="h">NOVEMBRE<em>Bleu</em></div>
<div class="caps dt">Du 2 novembre au 1<sup>er</sup> décembre 2026</div>
<div class="p">Coupe, noircissage &amp; gommage — 5 000<br>Manucure &amp; pédicure — 10 000<b class="lining">L'ensemble, 15 000 FCFA</b></div>
<div class="rs"><div class="rsvp">R.S.V.P.</div><div class="t">{TEL}</div>{ADDR}<br>TikTok {TT}</div></div>
""")

# 09 — Couverture de magazine -------------------------------------------------
page(9, "Magazine", """
#poster{background:#111 url(salon-portrait.jpg) center/cover;color:#F2EDE3}
.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,8,10,.6) 0%,rgba(8,8,10,.1) 28%,rgba(8,8,10,.15) 55%,rgba(8,8,10,.9) 100%),linear-gradient(90deg,rgba(8,8,10,.75) 0%,rgba(8,8,10,0) 45%)}
.mh{position:absolute;top:48px;left:0;right:0;text-align:center;font-family:'Bodoni Moda';font-weight:900;font-size:142px;letter-spacing:-.03em;line-height:1}
.iss{position:absolute;top:212px;left:60px;right:60px;display:flex;justify-content:space-between;font-size:13px;letter-spacing:.3em;text-transform:uppercase;border-top:1px solid rgba(242,237,227,.6);padding-top:12px}
.cl{position:absolute;left:60px;top:330px;width:330px;text-shadow:0 1px 12px rgba(0,0,0,.6)}
.cl div{margin-bottom:34px}
.cl b{display:block;font-family:'Bodoni Moda';font-size:34px;font-weight:700;line-height:1.05}
.cl span{font-size:15px;line-height:1.5;opacity:.9}
.hd{position:absolute;left:60px;right:60px;bottom:250px}
.hd h1{font-family:'Bodoni Moda';font-style:italic;font-weight:400;font-size:132px;line-height:.9}
.hd h1 em{color:#A9BDF0}
.px{position:absolute;right:60px;top:330px;width:200px;height:200px;border-radius:50%;background:var(--blue);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.px b{font-family:'Bodoni Moda';font-size:52px;line-height:1}
.px span{font-size:12px;letter-spacing:.24em;margin-top:6px}
.ft{position:absolute;left:60px;right:60px;bottom:56px;display:flex;justify-content:space-between;align-items:flex-end;font-size:15px;line-height:1.6;border-top:1px solid rgba(242,237,227,.5);padding-top:16px}
.ft b{font-size:28px;letter-spacing:.03em}
.ft img{width:84px;background:#F2EDE3;padding:6px}
""", f"""
<div class="sh"></div>
<div class="mh">GENTLEMAN</div>
<div class="iss"><span>N° 11 — Novembre 2026</span><span>Barber &amp; Shop</span><span>Édition Bleue</span></div>
<div class="cl"><div><b>La coupe, version soin</b><span>Coupe, noircissage &amp; gommage — 5 000 FCFA</span></div>
<div><b>Mains &amp; pieds nets</b><span>Manucure &amp; pédicure — 10 000 FCFA</span></div>
<div><b>Le combat du mois</b><span>{CAUSE}</span></div></div>
<div class="px"><b class="lining">15 000</b><span>FCFA<br>le package</span></div>
<div class="hd"><div class="caps">Du 2 novembre au 1<sup>er</sup> décembre</div><h1>Novembre <em>Bleu</em></h1></div>
<div class="ft"><div><b>{TEL}</b><br>{ADDR}</div><div style="display:flex;gap:16px;align-items:flex-end">TikTok<br>{TT}<img src="qr-tiktok.svg"></div></div>
""")

# 10 — Le calendrier ----------------------------------------------------------
weeks = calendar.monthcalendar(2026, 11)
cells = []
for wk in weeks:
    for d in wk:
        if d == 0: cells.append('<div class="e"></div>')
        elif d == 1: cells.append('<div class="off">1</div>')
        else: cells.append(f'<div class="on">{d}</div>')
cells[-6] = '<div class="on dec">1<small>déc.</small></div>'  # mardi 1er décembre
grid = "".join(cells)
page(10, "Calendrier", f"""
#poster{{padding:72px 80px}}
.hd{{display:flex;justify-content:space-between;align-items:center}}
.hd img{{width:76px}}
.hd .caps{{text-align:right;line-height:1.9;color:var(--mute)}}
h1{{font-family:'Cormorant Garamond';font-weight:300;font-size:128px;line-height:.9;margin-top:70px;letter-spacing:-.02em}}
h1 em{{font-style:italic;color:var(--blue)}}
.dw{{display:grid;grid-template-columns:repeat(7,1fr);margin-top:56px;font-size:12px;letter-spacing:.24em;color:var(--mute);border-bottom:1px solid var(--ink);padding-bottom:12px}}
.cal{{display:grid;grid-template-columns:repeat(7,1fr);}}
.cal div{{height:92px;border-bottom:1px solid var(--line);font-family:'Cormorant Garamond';font-variant-numeric:lining-nums;font-size:42px;padding-top:12px}}
.cal .off{{color:#B8B0A3}}
.cal .on{{color:var(--ink)}}
.cal .dec{{color:var(--blue);font-style:italic}}
.cal .dec small{{font-size:16px;margin-left:4px;font-family:Archivo;font-style:normal;letter-spacing:.1em}}
.band{{display:flex;justify-content:space-between;align-items:flex-end;margin-top:44px}}
.band .p{{font-family:'Cormorant Garamond';font-size:120px;font-weight:300;line-height:.8}}
.band .p small{{font-family:Archivo;font-size:18px;font-weight:600;letter-spacing:.24em;margin-left:10px}}
.band .l{{text-align:right;font-size:18px;line-height:1.7}}
.ft{{position:absolute;left:80px;right:80px;bottom:72px;display:flex;justify-content:space-between;font-size:16px;line-height:1.6;border-top:1px solid var(--ink);padding-top:16px;gap:40px}}
.ft b{{font-size:28px;font-weight:600;letter-spacing:.03em}}
.ca{{font-family:'Cormorant Garamond';font-style:italic;font-size:26px;margin-top:18px;color:var(--mute)}}
""", f"""
<div class="hd"><img src="logo.png"><div class="caps">Gentleman Barber &amp; Shop<br>Novembre 2026</div></div>
<h1>Tout le mois,<br>en <em>bleu.</em></h1>
<div class="ca">{CAUSE}</div>
<div class="dw"><span>LUN</span><span>MAR</span><span>MER</span><span>JEU</span><span>VEN</span><span>SAM</span><span>DIM</span></div>
<div class="cal">{grid}</div>
<div class="band"><div><div class="caps" style="color:var(--mute)">Le package complet</div><div class="p lining">15 000<small>FCFA</small></div></div>
<div class="l">Coupe, noircissage, gommage — 5 000<br>Manucure, pédicure — 10 000</div></div>
<div class="ft"><div><b>{TEL}</b><br>Appel &amp; WhatsApp</div><div style="text-align:right">{ADDR}<br>TikTok {TT}</div></div>
""")
print("ok")
