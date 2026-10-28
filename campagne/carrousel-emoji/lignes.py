# Génère slides.html : un panorama de 5 × 1080 px coupé en 5 slides (lignes continues d'une slide à l'autre) + une slide finale
X = [900, 1080, 1620, 2160, 2700, 3240, 3780, 4320, 4520, 4650]
LIGNES = [  # couleur, emoji de départ, y aux points X (la dernière valeur = carte d'arrivée)
    ('#6f7782', '🐘', [280, 290, 420, 800, 1000, 700, 500, 620, 840, 870]),
    ('#ef9a45', '🥭', [560, 560, 350, 250, 600, 960, 1110, 600, 300, 270]),
    ('#5b8a2e', '🌴', [840, 850, 1100, 1050, 350, 250, 720, 1010, 1150, 1170]),
    ('#2a9d8f', '🐢', [1120, 1110, 900, 500, 240, 1150, 860, 300, 540, 570]),
]
def chemin(xs, ys):
    pts = [(xs[0] - 1, ys[0])] + list(zip(xs, ys)) + [(xs[-1] + 1, ys[-1])]
    d = f'M{xs[0]},{ys[0]}'
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.0f},{c1[1]:.0f} {c2[0]:.0f},{c2[1]:.0f} {p2[0]},{p2[1]}'
    return d
ARRIVEES = {  # y de la carte -> (couleur de la ligne, pastille, titre, texte)
    270: ('📍', 'Être trouvé', 'Votre fiche Google', 'Les clients vous trouvent quand ils cherchent près de chez eux.'),
    570: ('🤖', 'Gagner du temps', 'Un assistant IA sur WhatsApp', 'Il répond à vos clients, même à 23 h.'),
    870: ('🌐', 'Vendre 24 h/24', 'Un site web qui vend', 'Commandes en ligne et paiement Mobile Money.'),
    1170: ('📱', 'Attirer', 'Des réseaux qui convertissent', 'Des visuels pros et des posts qui font venir les clients.'),
}
paths = ''.join(f'<path d="{chemin(X, ys)}" stroke="{c}"/>' for c, _, ys in LIGNES)
emojis = ''.join(f'<div class="emoji" style="top:{ys[0]}px">{e}</div>' for _, e, ys in LIGNES)
cartes = ''
for c, _, ys in LIGNES:
    ic, pill, titre, txt = ARRIVEES[ys[-1]]
    cartes += (f'<div class="carte" style="top:{ys[-1]}px;--c:{c}"><span class="pill"><i></i>{pill}</span>'
               f'<span class="ic">{ic}</span><div><h3>{titre}</h3><p>{txt}</p></div></div>')
html = open('modele.html', encoding='utf-8').read().replace('{{PATHS}}', paths).replace('{{EMOJIS}}', emojis).replace('{{CARTES}}', cartes)
open('slides.html', 'w', encoding='utf-8').write(html)
