# Visuel « Zoomez… » (Instagram)

- `NEAM_Zoomez_publication.png` : publication 1080 × 1350 (format 4:5) ; `_HD` : 2160 × 2700.
- `NEAM_Zoomez_story.png` : story / statut WhatsApp 1080 × 1920 ; `_HD` : 2160 × 3840.

Principe : une vraie main (photo fournie par NEAM, `photo/main-neam.png`, détourée) fait le geste « tout petit » ; le texte minuscule, entre l'index et le pouce, oblige à zoomer. Il dit :
« Si vous avez dû zoomer pour lire ceci, imaginez vos clients qui vous cherchent sur Google. → Diagnostic digital gratuit : neamindustry.com »

Légende proposée pour la publication :
> Zoomez… 🔍 Si vous avez dû zoomer pour lire, vos clients ont peut-être le même problème avec votre entreprise sur Google. Faites le point gratuitement avec notre diagnostic digital (lien en bio). #EtÇaRapporteCombien #Libreville #Gabon #TransformationDigitale

Modifier : textes et mise en page dans `build.py` (le fond est recomposé à partir de `photo/main-neam.png`), puis `python3 build.py` et `node render.js`.
