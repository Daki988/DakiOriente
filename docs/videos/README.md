# Vidéos de présentation Navigoal (novembre 2026)

| Fichier | Style | Durée |
|---|---|---|
| `navigoal-demo-application-16x9.mp4` | Démonstration de l'application dans un téléphone (vrais écrans du site), texte animé, curseur qui clique, téléphones flous en arrière-plan ; intro logo, 8 fonctionnalités (test d'orientation, métiers, écoles, devis en F CFA, bourses, candidature, Navilease, NaviTravel), récapitulatif, fin avec QR | 71 s |
| `navigoal-demo-application-9x16.mp4` | Même démonstration au format vertical (titre en haut, téléphone en dessous) pour TikTok, Reels, stories, statut WhatsApp | 71 s |
| `navigoal-demo-courte-30s-16x9.mp4` / `-9x16.mp4` | Version courte pour la publicité : intro, test d'orientation, vrai coût, candidature, fin avec QR | 32 s |
| `navigoal-video-explicative-9x16.mp4` | Vidéo explicative au format vertical | 67,5 s |
| `navigoal-video-explicative-16x9.mp4` | Vidéo explicative en motion design : les questions d'une élève après le bac, réponse Navigoal, site et téléphone, parcours en 6 étapes sur la route orange du logo jusqu'au Maroc, les parents rassurés, accroche avec la photo de groupe, fin avec QR | 67,5 s |

| `navigoal-reel-teaser-1er-decembre.mp4` | Reel d'annonce (Instagram, TikTok, statut WhatsApp) : « Bac 2027. Et après ? », le rêve marocain, rafale de questions (école, reconnaissance, coût, départ), « Bientôt, toutes les réponses au même endroit », logo, « Navigoal arrive le 1er décembre », navigoal.net, « Abonne-toi ». Couverture : `-couverture.jpg` | 19 s |
| `navigoal-reel-teaser-bientot.mp4` | Même Reel avec « Très bientôt » à la place de la date | 19 s |

Formats 16:9 (1920 × 1080) et 9:16 (1080 × 1920), 30 images/s, H.264 + AAC. Musique originale générée (aucun droit à payer). Pas de voix off (aucune synthèse vocale disponible) : texte à l'écran, compréhensible sans le son. QR codes suivis : `utm_source=video&utm_campaign=video-demo` / `video-explication`.

À valider avant diffusion : droits des photos fournies (famille, groupe d'étudiants) et de la photo de l'étudiante ; captures prises sur le serveur de test (comptes de démonstration, données fictives).

## Régénérer
Sources dans `design/videos/` : captures des écrans (`ecrans*.cjs`, `bureau.cjs`, serveur local lancé), animations (`demo.html`, `explication.py`, `teaser.html` : `?date=0` pour la version sans date), rendu image par image (`rendu.cjs page.html sortie.mp4 30 1920 1080`), musique (`musique.py sortie.wav durée clics tonalité bpm`, numpy), puis `ffmpeg -i video.mp4 -i musique.wav -c:v copy -c:a aac`.

Paramètres des pages d'animation : `?v=1` (vertical 1080 × 1920), `?court=1` (version courte de la démo). Ex. : `node rendu.cjs "demo.html?court=1&v=1" sortie.mp4 30 1080 1920`.
