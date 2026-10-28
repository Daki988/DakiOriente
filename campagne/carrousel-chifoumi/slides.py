# Génère slides.html : carrousel « chifoumi » NEAM (6 slides 1080 × 1350, même photo, textes différents)
PAIRES = [
    ('Se demander chaque jour <b>quoi poster</b>', 'Recevoir son calendrier du mois avec <b>NEAM</b>'),
    ('Être <b>introuvable</b> sur Google', 'Sortir sur Google à Libreville avec <b>NEAM</b>'),
    ('Répondre aux clients <b>à minuit</b>', 'Une IA qui répond sur WhatsApp avec <b>NEAM</b>'),
    ('Avoir un site <b>qui ne vend rien</b>', 'Encaisser en Mobile Money avec <b>NEAM</b>'),
    ('<b>Booster</b> une pub au hasard', 'Cibler les bons clients avec <b>NEAM</b>'),
    ('Continuer à <b>tout faire</b> seul', 'Faire son diagnostic gratuit avec <b>NEAM</b> : <b>lien en bio</b>'),
]
bande = ''.join(('<b>@neam.industry</b>' if i % 2 else '@neam.industry') + ' ' for i in range(8))
slides = ''.join(f'''<section class="slide"><div class="bande">{bande}</div>
<p class="g">{g}</p><p class="d">{d}</p><img class="logo" src="../../assets/logo-light.png" alt="NEAM"></section>''' for g, d in PAIRES)
html = '''<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>NEAM — Chifoumi</title>
<link rel="stylesheet" href="../../print/catalogue/fonts/fonts.css">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #777; } :root { --fond: #ded3c4; }
.slide { position: relative; width: 1080px; height: 1350px; overflow: hidden; margin-bottom: 20px;
  background: url(mains.png) center 70px / 1080px auto no-repeat, var(--fond); font-family: "Instrument Sans", Arial, sans-serif; color: #1d1b1c; }
.bande { position: absolute; left: -40px; right: -40px; top: 40px; height: 52px; background: #f5b31b; white-space: nowrap; overflow: hidden;
  font-size: 27px; line-height: 52px; letter-spacing: -.01em; color: #0f0f10; }
.bande b { font-weight: 700; }
.g, .d { position: absolute; top: 265px; width: 490px; text-align: center; font-size: 60px; line-height: .98; letter-spacing: -.055em; font-weight: 400; text-wrap: balance; }
.g { left: 40px; } .d { right: 30px; }
.g b, .d b { font-weight: 700; }
.logo { position: absolute; left: 50%; bottom: 150px; width: 300px; transform: translateX(-50%); }
</style></head><body>''' + slides + '</body></html>'
open('slides.html', 'w', encoding='utf-8').write(html)
