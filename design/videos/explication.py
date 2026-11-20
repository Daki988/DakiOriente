"""Vidéo explicative Navigoal (style « motion design ») : génère explication.html, animée par window.render(t).
Usage : python3 explication.py <dossier icônes lucide>"""
import json
import os
import sys

ICONS = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))


def icon(n, s, c="#fff", w=2):
    svg = open(os.path.join(ICONS, f"{n}.svg")).read()
    return svg.replace('width="24"', f'width="{s}"').replace('height="24"', f'height="{s}"').replace('stroke="currentColor"', f'stroke="{c}"').replace('stroke-width="2"', f'stroke-width="{w}"')


QUESTIONS = [("briefcase", "Quel métier ?", 250, 210), ("school", "Quelle école ?", 1360, 170), ("wallet", "Combien ça coûte ?", 170, 520),
             ("house", "Où loger ?", 1430, 470), ("stamp", "Et le visa ?", 300, 800), ("users", "Et mes parents ?", 1380, 770)]
ETAPES = [("compass", "Ton orientation", "un test en images, gratuit", "test-question", "#1a47f5"),
          ("shield-check", "Ton école", "au statut officiel vérifié", "ecole", "#0b1a4f"),
          ("calculator", "Ton budget", "le vrai coût, en F CFA", "devis", "#ff8a00"),
          ("file-check-2", "Ta candidature", "en ligne, sans frais de dossier", "candidature", "#1a47f5"),
          ("house", "Ton logement", "résidences vérifiées", "navilease", "#0b1a4f"),
          ("plane", "Ton départ", "billet, visa, accueil", "navitravel", "#ff8a00")]
bulles = "".join(f"""<div class="bulle" id="q{i}" style="left:{x}px;top:{y}px"><span class="bi">{icon(ic, 40, "#1a47f5", 2.2)}</span>{t}</div>""" for i, (ic, t, x, y) in enumerate(QUESTIONS))
etapes = "".join(f"""<div class="etape" id="e{i}"><div class="mini"><div class="mini-ecran"><img src="ecrans/{ecr}.png"></div></div>
  <div class="rond" style="background:{coul}">{icon(ic, 66, "#fff", 2)}<b class="num">{i + 1}</b></div>
  <div class="lab"><b>{t}</b><span>{s}</span></div></div>""" for i, (ic, t, s, ecr, coul) in enumerate(ETAPES))
garanties = "".join(f"""<div class="gar" id="g{i}"><span class="gi" style="background:{c}">{icon(ic, 46, "#fff", 2.2)}</span><span><b>{t}</b><br><small>{s}</small></span></div>""" for i, (ic, t, s, c) in enumerate([
    ("eye", "Ils suivent chaque étape", "candidatures, réponses des écoles, paiements", "#1a47f5"),
    ("shield-check", "Des écoles vérifiées", "statut officiel et filières accréditées", "#0b7a3d"),
    ("wallet", "Un budget clair", "le coût total, avant de s'engager", "#ff8a00")]))

html = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Navigoal — vidéo explicative</title><style>
@font-face {{ font-family: J; src: url(assets/jakarta.woff2) format('woff2'); font-weight: 200 800; }}
* {{ box-sizing: border-box; margin: 0; }} html, body {{ width: 1920px; height: 1080px; overflow: hidden; font-family: J, sans-serif; color: #0b1533; background: #eef2f8; }}
.sc {{ position: absolute; inset: 0; overflow: hidden; display: none; }}
.l1 {{ font-size: 76px; font-weight: 800; letter-spacing: -.02em; line-height: 1.05; color: #0b1a4f; }}
.acc {{ color: #ff8a00; }}
.bulle {{ position: absolute; display: flex; align-items: center; gap: 18px; background: #fff; border-radius: 28px; padding: 22px 32px; font-size: 42px; font-weight: 800; color: #0b1a4f; box-shadow: 0 24px 50px -20px rgba(11,26,79,.35); white-space: nowrap; }}
.bi {{ width: 66px; height: 66px; border-radius: 20px; background: #eef2ff; display: flex; align-items: center; justify-content: center; }}
.legende {{ position: absolute; left: 0; right: 0; bottom: 60px; text-align: center; font-size: 46px; font-weight: 700; color: #0b1a4f; }}
.etape {{ position: absolute; width: 330px; display: flex; flex-direction: column; align-items: center; }}
.rond {{ position: relative; width: 150px; height: 150px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 8px solid #fff; box-shadow: 0 20px 40px -14px rgba(11,26,79,.5); }}
.num {{ position: absolute; right: -8px; top: -8px; width: 50px; height: 50px; border-radius: 50%; background: #ffc21f; color: #0b1533; font-size: 26px; display: flex; align-items: center; justify-content: center; border: 4px solid #fff; }}
.lab {{ text-align: center; margin-top: 18px; display: flex; flex-direction: column; gap: 4px; }} .lab b {{ font-size: 38px; color: #0b1a4f; }} .lab span {{ font-size: 26px; color: #3b4566; }}
.mini {{ width: 214px; height: 440px; border-radius: 34px; background: #0d1020; padding: 8px; margin-bottom: 26px; box-shadow: 0 30px 50px -20px rgba(11,26,79,.5); }}
.mini-ecran {{ width: 198px; height: 424px; border-radius: 27px; overflow: hidden; background: #fff; position: relative; }} .mini-ecran img {{ width: 198px; display: block; position: absolute; top: 0; }}
.gar {{ display: flex; align-items: center; gap: 26px; font-size: 38px; color: #0b1a4f; }} .gar small {{ font-size: 26px; color: #3b4566; font-weight: 500; }}
.gi {{ width: 92px; height: 92px; border-radius: 26px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }}
</style></head><body>
<!-- 1. Les questions -->
<div class="sc" id="s1"><div style="position:absolute;inset:0;background:radial-gradient(900px 700px at 50% 60%,#ffffff,#eef2f8 70%)"></div>
  <div id="disque" style="position:absolute;left:660px;top:250px;width:600px;height:600px;border-radius:50%;background:#1a47f5"></div>
  <img id="etu" src="assets/etudiante.webp" style="position:absolute;left:560px;bottom:0;width:800px">
  {bulles}<div class="legende" id="leg1" style="top:60px;bottom:auto;z-index:5;font-size:54px;font-weight:800">Après le bac, <span style="color:#ff8a00">tant de questions…</span></div></div>
<!-- 2. Réponse : Navigoal -->
<div class="sc" id="s2" style="background:#1a47f5"><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px">
  <div id="lg2" style="width:520px;height:520px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 40px 80px -30px rgba(0,0,0,.5)"><img src="assets/logo-cercle.png" style="width:500px"></div>
  <div id="t2" style="font-size:70px;font-weight:800;color:#fff">Navigoal a les réponses.</div></div></div>
<!-- 3. Site et téléphone -->
<div class="sc" id="s3"><div style="position:absolute;inset:0;background:linear-gradient(180deg,#eef2f8 0%,#eef2f8 62%,#dfe6f3 62%)"></div>
  <div id="pc" style="position:absolute;left:270px;top:190px;width:1120px">
    <div style="background:#0d1020;border-radius:26px 26px 0 0;padding:18px 18px 22px"><div style="height:640px;overflow:hidden;border-radius:6px;background:#fff;position:relative"><img id="pcimg" src="ecrans/bureau-accueil.png" style="width:1084px;position:absolute;top:0;left:0"></div></div>
    <div style="height:34px;margin:0 -70px;background:linear-gradient(180deg,#d6dae3,#a8adb8);border-radius:0 0 26px 26px"></div></div>
  <div id="tel" style="position:absolute;left:1300px;top:300px;width:300px;height:620px;border-radius:44px;background:#0d1020;padding:10px;box-shadow:0 40px 60px -25px rgba(11,26,79,.55)"><div style="width:280px;height:600px;border-radius:36px;overflow:hidden;background:#fff;position:relative"><img src="ecrans/accueil.png" id="telimg" style="width:280px;position:absolute;top:0"></div></div>
  <div class="legende" id="leg3" style="bottom:50px">Sur le site et sur ton téléphone, <span style="color:#1a47f5">gratuitement</span>.</div></div>
<!-- 4. Le parcours -->
<div class="sc" id="s4"><div style="position:absolute;inset:0;background:radial-gradient(1200px 800px at 50% 0%,#ffffff,#eef2f8 70%)"></div>
  <div class="l1" id="t4" style="position:absolute;left:0;right:0;top:60px;text-align:center;font-size:62px">Ton parcours, <span class="acc">étape par étape</span></div>
  <div id="monde" style="position:absolute;left:0;top:0;width:4300px;height:1080px">
    <svg width="4300" height="1080" style="position:absolute;left:0;top:0"><path id="route" d="" fill="none" stroke="#ffd56b" stroke-width="40" stroke-linecap="round"/><path id="route2" d="" fill="none" stroke="#ff8a00" stroke-width="7" stroke-dasharray="18 18" stroke-linecap="round"/></svg>
    {etapes}
    <div id="voyageur" style="position:absolute;width:96px;height:96px;margin:-90px 0 0 -48px">{icon("map-pin", 96, "#ff8a00", 2.4)}</div>
    <div id="maroc" style="position:absolute;width:300px;height:300px;border-radius:50%;overflow:hidden;border:10px solid #fff;box-shadow:0 30px 60px -20px rgba(11,26,79,.5)"><img src="assets/maroc-chefchaouen.jpg" style="width:100%;height:100%;object-fit:cover"></div>
    <div id="marocT" style="position:absolute;font-size:44px;font-weight:800;color:#0b1a4f;white-space:nowrap">Bienvenue au Maroc !</div></div></div>
<!-- 5. Les parents -->
<div class="sc" id="s5"><div style="position:absolute;inset:0;background:#eef2f8"></div>
  <div id="fam" style="position:absolute;left:110px;top:150px;width:880px;height:780px;border-radius:320px 320px 40px 40px;overflow:hidden;border:12px solid #ffc21f;box-shadow:0 40px 80px -30px rgba(11,26,79,.5)"><img src="assets/famille-scene.jpg" style="width:100%;height:100%;object-fit:cover;object-position:60% 0%"></div>
  <div style="position:absolute;left:1080px;top:200px;width:760px;display:flex;flex-direction:column;gap:46px">
    <div class="l1" id="t5" style="font-size:66px">Les parents,<br><span class="acc">rassurés.</span></div>{garanties}</div></div>
<!-- 6. Accroche -->
<div class="sc" id="s6"><img id="grp" src="assets/etudiants-scene.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,26,79,.05) 30%,rgba(11,26,79,.85) 100%)"></div>
  <div id="t6" style="position:absolute;left:0;right:0;bottom:90px;text-align:center;font-size:96px;font-weight:800;line-height:1.02;color:#fff;letter-spacing:-.02em">Trouve ta voie,<br><span style="color:#ffc21f">étudie en confiance.</span></div></div>
<!-- 7. Fin -->
<div class="sc" id="s7" style="background:#fff"><div style="position:absolute;inset:0;background:radial-gradient(900px 700px at -5% -10%,rgba(255,194,31,.5),transparent 60%),radial-gradient(1000px 800px at 105% 110%,rgba(26,71,245,.3),transparent 60%)"></div>
  <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:110px">
    <img id="flg" src="assets/logo-cercle.png" style="width:470px">
    <div id="fd" style="display:flex;flex-direction:column;gap:22px">
      <div style="font-size:30px;font-weight:800;letter-spacing:.12em;color:#ff8a00">GRATUIT POUR LES FAMILLES</div>
      <div style="font-size:108px;font-weight:800;letter-spacing:-.03em;color:#1a47f5;line-height:1">navigoal.net</div>
      <div style="display:flex;align-items:center;gap:34px;margin-top:10px">
        <div style="background:#fff;border-radius:26px;padding:14px;box-shadow:0 20px 40px -18px rgba(11,26,79,.45)"><img src="assets/qr-explication.png" style="width:190px;display:block"></div>
        <div style="display:flex;flex-direction:column;gap:14px;font-size:32px;font-weight:700"><span><span style="color:#25b357">●</span> WhatsApp +241 077 45 31 67</span><span><span style="color:#1a47f5">●</span> contact@navigoal.net</span></div></div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:6px;font-size:18px;font-weight:800;color:#5b6478;letter-spacing:.2em">BY <img src="assets/oaps-logo.webp" style="height:46px"></div></div></div></div>
<script>
const NQ = {len(QUESTIONS)}, NE = {len(ETAPES)};
const S = [["s1", 0, 9.4], ["s2", 9.0, 13.4], ["s3", 13.2, 21.4], ["s4", 21.2, 47.2], ["s5", 47.0, 55.4], ["s6", 55.2, 60.4], ["s7", 60.2, 67.5]];
window.DUREE = 67.5;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => cl((t - a) / (b - a));
const oc = (x) => 1 - Math.pow(1 - x, 3), io = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, ob = (x) => {{ const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }};
const $ = (id) => document.getElementById(id);
// route du parcours (monde de 4 300 px), étapes alternées haut / bas
const XS = [380, 1040, 1700, 2360, 3020, 3680], YS = [820, 700, 820, 700, 820, 700];
let d = `M ${{XS[0] - 300}} ${{YS[0]}}`;
XS.forEach((x, i) => {{ const px = i ? XS[i - 1] : XS[0] - 300, py = i ? YS[i - 1] : YS[0]; d += ` C ${{px + 220}} ${{py}} ${{x - 220}} ${{YS[i]}} ${{x}} ${{YS[i]}}`; }});
d += ` C ${{XS[5] + 200}} ${{YS[5]}} 3900 560 4050 560`;
$("route").setAttribute("d", d); $("route2").setAttribute("d", d);
const route = $("route"), LT = route.getTotalLength();
const LS = XS.map((x) => {{ let a = 0, b = LT; for (let k = 0; k < 40; k++) {{ const m = (a + b) / 2; if (route.getPointAtLength(m).x < x) a = m; else b = m; }} return a; }});
XS.forEach((x, i) => {{ const e = $("e" + i); e.style.left = (x - 165) + "px"; e.style.top = (YS[i] - 75 - 466) + "px"; }});
$("maroc").style.left = "3860px"; $("maroc").style.top = "150px"; $("marocT").style.left = "3790px"; $("marocT").style.top = "650px";
const T4 = 21.2, PAS = 3.5;

function voir(id, t, a, b) {{ const el = $(id), v = t >= a && t < b; el.style.display = v ? "block" : "none"; return v; }}
window.render = (t) => {{
  // 1. questions
  if (voir("s1", t, 0, 9.4)) {{
    $("disque").style.transform = `scale(${{ob(seg(t, 0, 1))}})`;
    $("etu").style.transform = `translateY(${{(1 - oc(seg(t, 0.2, 1.2))) * 500}}px)`;
    for (let i = 0; i < NQ; i++) {{ const v = ob(seg(t, 1.3 + i * 0.75, 1.8 + i * 0.75)); const q = $("q" + i);
      q.style.transform = `scale(${{v}}) translateY(${{Math.sin((t + i) * 1.6) * 6}}px)`; q.style.opacity = seg(t, 1.3 + i * 0.75, 1.5 + i * 0.75); }}
    $("leg1").style.opacity = seg(t, 0.8, 1.6);
    $("s1").style.clipPath = "none";
  }}
  // 2. vague bleue et logo
  if (voir("s2", t, 9.0, 13.4)) {{
    const r = io(seg(t, 9.0, 9.9)) * 1200; $("s2").style.clipPath = `circle(${{r}}px at 50% 50%)`;
    $("lg2").style.transform = `scale(${{ob(seg(t, 9.6, 10.5))}}) rotate(${{(1 - oc(seg(t, 9.6, 10.5))) * -30}}deg)`;
    $("t2").style.opacity = seg(t, 10.4, 11.0); $("t2").style.transform = `translateY(${{(1 - oc(seg(t, 10.4, 11.0))) * 40}}px)`;
    $("s2").style.opacity = 1 - seg(t, 13.0, 13.4);
  }}
  // 3. ordinateur et téléphone
  if (voir("s3", t, 13.2, 21.4)) {{
    const u = t - 13.2; $("s3").style.opacity = seg(u, 0, 0.4) * (1 - seg(u, 7.8, 8.2));
    $("pc").style.transform = `translateY(${{(1 - oc(seg(u, 0.1, 1.0))) * 700}}px)`;
    $("tel").style.transform = `translateX(${{(1 - oc(seg(u, 0.6, 1.5))) * 700}}px) rotate(${{(1 - oc(seg(u, 0.6, 1.5))) * 15}}deg)`;
    $("pcimg").style.transform = `translateY(${{-io(seg(u, 2, 7.4)) * 1300 * 1084 / 1440}}px)`;
    $("telimg").style.transform = `translateY(${{-io(seg(u, 2.4, 7.4)) * 1600 * 280 / 390}}px)`;
    $("leg3").style.opacity = seg(u, 1.2, 1.9);
  }}
  // 4. parcours
  if (voir("s4", t, 21.2, 47.2)) {{
    const u = t - T4; $("s4").style.opacity = seg(u, 0, 0.4) * (1 - seg(u, 25.6, 26));
    $("t4").style.opacity = seg(u, 0.2, 0.9) * (1 - seg(u, 24.5, 25));
    // avancée : de l'étape i à i+1 entre 1.2 + i*PAS et 1.2 + i*PAS + 1.6 ; dernière : vers le Maroc
    let L = 0;
    for (let i = 0; i <= NE; i++) {{ const a = 0.6 + i * PAS, pos0 = i ? LS[i - 1] : 0, pos1 = i < NE ? LS[i] : LT; if (u >= a) L = pos0 + (pos1 - pos0) * io(seg(u, a, a + 1.6)); }}
    const p = route.getPointAtLength(L);
    $("voyageur").style.transform = `translate(${{p.x}}px,${{p.y + Math.sin(u * 7) * 4}}px)`;
    route.style.strokeDasharray = `${{L + 2}} ${{LT}}`;
    $("route2").style.strokeDasharray = "18 18"; $("route2").style.clipPath = `inset(0 ${{4300 - p.x}}px 0 0)`;
    const cam = cl(p.x - 960, 0, 4300 - 1920); $("monde").style.transform = `translateX(${{-cam}}px)`;
    for (let i = 0; i < NE; i++) {{ const a = 0.6 + i * PAS + 1.4, e = $("e" + i), v = ob(seg(u, a, a + 0.6));
      e.style.opacity = seg(u, a, a + 0.3); e.querySelector(".rond").style.transform = `scale(${{v}})`;
      const m = e.querySelector(".mini"); const vm = oc(seg(u, a + 0.3, a + 1.0)); m.style.transform = `translateY(${{(1 - vm) * 80}}px) scale(${{0.8 + 0.2 * vm}})`; m.style.opacity = vm;
      const im = e.querySelector(".mini img"), haut = Math.max(0, im.naturalHeight * 198 / im.naturalWidth - 424);
      im.style.transform = `translateY(${{-io(seg(u, a + 1.0, a + 3.3)) * Math.min(420, haut)}}px)`;
      e.querySelector(".lab").style.opacity = seg(u, a + 0.4, a + 0.9); }}
    const am = 0.6 + NE * PAS + 1.5; const vm = ob(seg(u, am, am + 0.7));
    $("maroc").style.transform = `scale(${{vm}})`; $("maroc").style.opacity = seg(u, am, am + 0.3);
    $("marocT").style.opacity = seg(u, am + 0.4, am + 1.0);
  }}
  // 5. parents
  if (voir("s5", t, 47.0, 55.4)) {{
    const u = t - 47.0; $("s5").style.opacity = seg(u, 0, 0.4) * (1 - seg(u, 8.0, 8.4));
    $("fam").style.transform = `translateX(${{(1 - oc(seg(u, 0, 1))) * -900}}px)`;
    $("fam").querySelector("img").style.transform = `scale(${{1.08 - 0.08 * seg(u, 0, 8.4)}})`;
    $("t5").style.opacity = seg(u, 0.6, 1.3); $("t5").style.transform = `translateY(${{(1 - oc(seg(u, 0.6, 1.3))) * 40}}px)`;
    for (let i = 0; i < 3; i++) {{ const v = oc(seg(u, 1.6 + i * 0.9, 2.3 + i * 0.9)); const g = $("g" + i); g.style.opacity = v; g.style.transform = `translateX(${{(1 - v) * 120}}px)`; }}
  }}
  // 6. accroche
  if (voir("s6", t, 55.2, 60.4)) {{
    const u = t - 55.2; $("s6").style.opacity = seg(u, 0, 0.4) * (1 - seg(u, 4.8, 5.2));
    $("grp").style.transform = `scale(${{1.12 - 0.12 * seg(u, 0, 5.2)}})`;
    $("t6").style.opacity = seg(u, 0.6, 1.3); $("t6").style.transform = `translateY(${{(1 - oc(seg(u, 0.6, 1.3))) * 60}}px)`;
  }}
  // 7. fin
  if (voir("s7", t, 60.2, 99)) {{
    const u = t - 60.2; $("s7").style.opacity = seg(u, 0, 0.4) * (1 - seg(t, 66.9, 67.5));
    $("flg").style.transform = `scale(${{0.5 + 0.5 * ob(seg(u, 0.1, 1.1))}})`; $("flg").style.opacity = seg(u, 0.1, 0.6);
    $("fd").style.opacity = oc(seg(u, 0.6, 1.4)); $("fd").style.transform = `translateX(${{(1 - oc(seg(u, 0.6, 1.4))) * 60}}px)`;
  }}
}};
window.render(0);
</script></body></html>"""
open(os.path.join(HERE, "explication.html"), "w").write(html)
print("ok")
