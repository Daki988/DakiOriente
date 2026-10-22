# Vidéo « Une journée d'entrepreneur » (offre Starter, format vertical 1080 × 1920, 36 s)

`NEAM_Starter_une_journee.mp4` : pour Instagram Reels, TikTok, Facebook et le statut WhatsApp. Couverture : `couverture.jpg`.

Scénario :
1. « Une journée d'entrepreneur. » Libreville, un mardi.
2. Mardi, sans aide : l'horloge défile de 06:30 à 23:50, les notifications s'empilent (« Vous êtes ouverts aujourd'hui ? », affiche à refaire, publication Facebook, « Vous avez un site ? », appel manqué « Je ne vous trouve pas sur Google… », « C'est combien la livraison ? »…). L'énergie tombe à 6 %, le temps pour soi à 0 h.
3. « Tu as créé ton entreprise pour être libre. Pas pour répondre à tout, tout seul, jusqu'à minuit. »
4. Le lendemain, avec NEAM : chaque question trouve sa réponse grâce à ce que couvre l'offre Starter (fiche Google, page de présentation, présence digitale, diagnostic). L'énergie remonte, la soirée est libre, « Aucune nouvelle notification ».
5. « Toi, tu gardes ton métier. NEAM s'occupe de ta présence en ligne. »
6. Carte finale : offre Starter, à partir de 150 000 FCFA / mois, diagnostic gratuit, neamindustry.com, WhatsApp 077 45 31 67.

Refaire la vidéo : textes dans `index.html` (tableaux `DAY` et `FIX`), `python3 son.py`, `node render.js <dossier>` puis
`ffmpeg -framerate 30 -i <dossier>/f%04d.jpg -i son.wav -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -shortest -movflags +faststart NEAM_Starter_une_journee.mp4`
