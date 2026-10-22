# Vidéo « Budget du client » (format vertical 1080 × 1920, 29 s)

`NEAM_Budget_du_client_150k.mp4` : prête pour Instagram Reels, TikTok, Facebook et le statut WhatsApp. Image de couverture : `couverture.jpg`.

Déroulé : le budget du client baisse (3 000 000 → 1 500 000 → 750 000 → 300 000 → 150 000 → 50 000 FCFA → « On vous paiera en visibilité ») et l'équipe de 7 prestataires disparaît un à un. Retournement : « Et si 150 000 FCFA par mois vous offraient toute l'équipe ? » Toute l'équipe revient avec NEAM, à partir de 150 000 FCFA / mois, puis carte finale (diagnostic gratuit, site, WhatsApp).

Refaire la vidéo :
1. modifier les textes, prix ou rôles dans `index.html` (tableaux `TEAM` et `PRICES`) ;
2. `python3 son.py` (bande-son originale, synthétisée, sans droits d'auteur) ;
3. `node render.js <dossier>` puis
   `ffmpeg -framerate 30 -i <dossier>/f%04d.jpg -i son.wav -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -shortest -movflags +faststart NEAM_Budget_du_client_150k.mp4`
