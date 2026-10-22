# Carrousel Instagram « Reprends le contrôle de ton temps » : 10 slides 1080 × 1350 sur papier texturé
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))

# Conventions : _texte_ = voix intérieure (italique), **MOT** = mot souligné au surligneur
SLIDES = [
    """Tu as créé ton entreprise
pour reprendre le contrôle de ta vie.
Pas pour qu’elle prenne le contrôle
de chacune de tes journées.""",

    """Parce qu’au départ, on voulait quoi ?
_Être libre, non ?!_
Choisir ses horaires, vivre de ce qu’on aime, voir grandir ses enfants, prendre un week-end sans demander la permission…
Bref, avoir une vie qui nous ressemble.""",

    """_Et puis, petit à petit…_
Les messages WhatsApp à minuit.
Les factures le dimanche soir.
Les relances de paiement, les publications Facebook à faire, le fichier Excel « final_v2 » introuvable…
Sans t’en rendre compte, tu fais le travail du commercial, du comptable, du community manager et de l’informaticien.""",

    """Mais attends deux secondes…
C’est **QUI** qui a décidé qu’il fallait tout faire soi-même ?
On croit que déléguer, c’est un luxe de grande entreprise.
Que ça coûte trop cher.
_Que personne ne fera aussi bien que toi._""",

    """Le problème, c’est que l’argent, ça se regagne.
Le temps, **NON**.
Chaque heure passée à recopier une commande ou à chercher un fichier, c’est une heure de moins pour tes clients…
_ou pour ceux que tu aimes._""",

    """Alors pose-toi une question toute simple :
_qu’est-ce que tu es la seule personne à pouvoir faire dans ton entreprise ?_
Rencontrer tes clients. Prendre les décisions. Exercer ton métier.
Et tout le reste ?
Tout le reste, ça se **DÉLÈGUE**.""",

    """C’est exactement là que NEAM intervient.
On prend en charge ce qui te vole ton temps :
ton site et ta visibilité sur Google,
tes réseaux sociaux,
les relances, devis et confirmations automatiques,
des outils simples pour suivre tes ventes, sans Excel.""",

    """Toi, tu gardes la main sur l’**ESSENTIEL** :
tes clients, ton métier, tes décisions.
Nous, on s’occupe du reste.
_Et chaque mois, tu sais ce qu’on a fait… et ce que ça t’a rapporté._""",

    """Et tu récupères ce que tu cherchais au départ :
du **TEMPS**.
Du temps pour ta famille.
Pour réfléchir à la suite.
Pour souffler.
Pour te lever le matin avec l’envie de ta journée.""",

    """_Alors je ne sais pas si tu avais besoin de lire ça aujourd’hui._
Mais tu as le droit de construire une entreprise qui tourne bien…
sans qu’elle tourne autour de toi, 24 h sur 24.
Reprends le **CONTRÔLE** de ton temps.""",
]

def fmt(text):
    out = []
    for line in text.split('\n'):
        line = line.replace('&', '&amp;')
        line = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', line)
        line = re.sub(r'_(.+?)_', r'<em>\1</em>', line)
        # espaces insécables devant la ponctuation haute
        line = re.sub(r' ([?!:;»])', r'&nbsp;\1', line).replace('« ', '«&nbsp;')
        out.append(f'<p>{line}</p>')
    return ''.join(out)

sections = []
for i, s in enumerate(SLIDES, 1):
    extra = ''
    if i == 1:
        extra = '<span class="swipe">Glisse →</span>'
    if i == len(SLIDES):
        extra = ('<div class="cta"><span class="cta__btn">Diagnostic digital gratuit · neamindustry.com</span>'
                 '<span class="cta__sub">Offre Starter à partir de 150&nbsp;000&nbsp;FCFA&nbsp;/&nbsp;mois<br>WhatsApp 077 45 31 67</span></div>'
                 '<div class="sign"><img src="../../assets/logo-light.png" alt="NEAM"><span>@neam.industry</span></div>')
    sections.append(f'<section class="slide" id="s{i}"><div class="txt">{fmt(s)}</div>{extra}<span class="num">{i:02d} / {len(SLIDES):02d}</span></section>')

html = f'''<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>NEAM — Reprends le contrôle de ton temps</title>
<link rel="stylesheet" href="../../print/catalogue/fonts/fonts.css">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ background: #777; }}
  .slide {{ position: relative; width: 1080px; height: 1350px; background: url(papier.jpg) center / cover; display: grid; place-items: center; padding: 0 105px; overflow: hidden; margin-bottom: 20px; }}
  .txt {{ width: 100%; text-align: center; color: #221f20; font: 500 44px/1.5 "Instrument Sans", Arial, sans-serif; letter-spacing: .085em; }}
  .txt p {{ text-wrap: balance; }}
  .txt p + p {{ margin-top: .12em; }}
  .txt em {{ font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-weight: 400; letter-spacing: .015em; font-size: 1.24em; line-height: 1.25; color: #9a6400; }}
  .txt b {{ font-weight: 700; letter-spacing: .1em; background: linear-gradient(transparent 58%, rgba(245,179,27,.6) 58%, rgba(245,179,27,.6) 92%, transparent 92%); padding: 0 .1em; }}
  .num {{ position: absolute; right: 70px; bottom: 56px; font: 500 20px "IBM Plex Mono", monospace; letter-spacing: .12em; color: #a7a39a; }}
  .swipe {{ position: absolute; left: 50%; bottom: 120px; transform: translateX(-50%); font: 500 24px "IBM Plex Mono", monospace; letter-spacing: .16em; text-transform: uppercase; color: #9a6400; }}
  #s10 {{ align-content: center; gap: 70px; }}
  .cta {{ display: grid; justify-items: center; gap: 22px; text-align: center; }}
  .cta__btn {{ background: #0f0f10; color: #fff; border-radius: 60px; padding: 22px 40px; font: 600 30px "Instrument Sans", Arial, sans-serif; letter-spacing: .02em; }}
  .cta__sub {{ font: 500 21px/1.6 "IBM Plex Mono", monospace; color: #5b5853; letter-spacing: 0; white-space: nowrap; }}
  .sign {{ position: absolute; left: 0; right: 0; bottom: 110px; display: flex; justify-content: center; align-items: center; gap: 22px; }}
  .sign img {{ width: 150px; }}
  .sign span {{ font: 500 24px "IBM Plex Mono", monospace; color: #6d6a64; letter-spacing: .06em; }}
</style></head>
<body>
{chr(10).join(sections)}
<script>
// Ajuste la taille du texte de chaque slide pour qu'il tienne confortablement
document.fonts.ready.then(() => {{
  document.querySelectorAll('.slide').forEach(s => {{
    const t = s.querySelector('.txt');
    const max = s.id === 's10' ? 640 : 900;
    let size = 46;
    t.style.fontSize = size + 'px';
    while (t.scrollHeight > max && size > 30) {{ size -= 1; t.style.fontSize = size + 'px'; }}
  }});
  window.READY = true;
}});
</script>
</body></html>'''
open(os.path.join(HERE, 'slides.html'), 'w').write(html)
print(len(SLIDES), 'slides')
