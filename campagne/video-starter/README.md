# Vidéo « La journée de Brice » (offre Starter, format vertical 1080 × 1920, 40 s)

`NEAM_Starter_une_journee.mp4` : pour Instagram Reels, TikTok, Facebook et le statut WhatsApp. Couverture : `couverture.jpg`.
Personnages en pions illustrés, dans le style de l'histoire de Denise. Mention « Histoire illustrative » à l'écran : Brice et sa boutique sont fictifs.

Scénario :
1. « Voici Brice. Il tient une boutique de vêtements à Libreville. Ses clients l'adorent. »
2. Mardi, sans aide : devant « Chez Brice », l'horloge défile de 06:30 à 23:50 et les notifications s'empilent (« Vous êtes ouverts aujourd'hui ? », affiche à refaire, publication Facebook, « Vous avez un site ? », appel manqué « Je ne vous trouve pas sur Google… », « C'est combien la livraison ? »…). Un client passe, ne trouve pas, repart. La nuit tombe, la boutique ferme, Brice est toujours au téléphone. Énergie à 6 %, temps pour lui : 0 h.
3. « Brice a créé son entreprise pour être libre. Pas pour répondre à tout, tout seul, jusqu'à minuit. »
4. Le lendemain, avec NEAM : chaque question trouve sa réponse grâce à ce que couvre l'offre Starter (fiche Google, page de présentation, présence digitale, diagnostic). Les clients arrivent, l'énergie remonte, la boutique ferme à 18:30 et Brice rentre.
5. 18:45, à la maison avec sa famille : « Brice garde son métier. NEAM s'occupe de sa présence en ligne. »
6. Carte finale : « Et toi ? Reprends le contrôle de ton temps. » Offre Starter, à partir de 90 000 FCFA / mois, diagnostic gratuit, neamindustry.com, WhatsApp 077 45 31 67.

Refaire la vidéo : textes dans `index.html` (tableaux `DAY` et `FIX`), `python3 son.py`, `node render.js <dossier>` puis
`ffmpeg -framerate 30 -i <dossier>/f%04d.jpg -i son.wav -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -shortest -movflags +faststart NEAM_Starter_une_journee.mp4`
