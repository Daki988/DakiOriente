# Vidéos de présentation Navigoal (novembre 2026)

| Fichier | Style | Durée |
|---|---|---|
| `navigoal-demo-application-16x9.mp4` | Démonstration de l'application dans un téléphone (vrais écrans du site), texte animé, curseur qui clique, téléphones flous en arrière-plan ; intro logo, 8 fonctionnalités (test d'orientation, métiers, écoles, devis en F CFA, bourses, candidature, Navilease, NaviTravel), récapitulatif, fin avec QR | 71 s |
| `navigoal-video-explicative-16x9.mp4` | Vidéo explicative en motion design : les questions d'une élève après le bac, réponse Navigoal, site et téléphone, parcours en 6 étapes sur la route orange du logo jusqu'au Maroc, les parents rassurés, accroche avec la photo de groupe, fin avec QR | 67,5 s |

1920 × 1080, 30 images/s, H.264 + AAC. Musique originale générée (aucun droit à payer). Pas de voix off (aucune synthèse vocale disponible) : texte à l'écran, compréhensible sans le son. QR codes suivis : `utm_source=video&utm_campaign=video-demo` / `video-explication`.

À valider avant diffusion : droits des photos fournies (famille, groupe d'étudiants) et de la photo de l'étudiante ; captures prises sur le serveur de test (comptes de démonstration, données fictives).

## Régénérer
Sources dans `design/videos/` : captures des écrans (`ecrans*.cjs`, `bureau.cjs`, serveur local lancé), animations (`demo.html`, `explication.py`), rendu image par image (`rendu.cjs page.html sortie.mp4 30 1920 1080`), musique (`musique.py sortie.wav durée clics tonalité bpm`, numpy), puis `ffmpeg -i video.mp4 -i musique.wav -c:v copy -c:a aac`.
