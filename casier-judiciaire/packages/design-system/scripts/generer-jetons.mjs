// VIS-09 : génère src/jetons.css à partir de design/tokens.json (source unique, miroir des variables Figma).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const jetons = JSON.parse(readFileSync(join(ici, '../../../design/tokens.json'), 'utf8'));
const nom = (s) => s.replace(/[\/ ]/g, '-').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const arrondi = (x) => Number(x.toFixed(4));
const ref = (chemin) => { const [famille, nuance] = chemin.split('.'); return `var(--cj-${famille}-${nuance})`; };

const lignes = ['/* Fichier généré par scripts/generer-jetons.mjs — ne pas modifier à la main (VIS-09). */', ':root {'];
for (const [famille, nuances] of Object.entries(jetons.primitives)) {
  for (const [nuance, valeur] of Object.entries(nuances)) lignes.push(`  --cj-${famille}-${nuance}: ${valeur};`);
}
for (const [cle, valeur] of Object.entries(jetons.couleurs)) {
  if (cle.startsWith('$')) continue;
  lignes.push(`  --cj-${nom(cle)}: ${ref(valeur.clair)};`);
}
for (const [cle, px] of Object.entries(jetons.espace)) lignes.push(`  --cj-espace-${cle}: ${px}px;`);
for (const [cle, px] of Object.entries(jetons.rayon)) lignes.push(`  --cj-rayon-${cle}: ${px}px;`);
lignes.push(`  --cj-police-titres: '${jetons.typographie.familles.titres}', Georgia, 'Times New Roman', serif;`);
lignes.push(`  --cj-police-texte: '${jetons.typographie.familles.texte}', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;`);
for (const [cle, valeur] of Object.entries(jetons.ombres)) lignes.push(`  --cj-${nom(cle)}: ${valeur};`);
lignes.push('}', '', '/* VIS-12 : mode sombre des espaces de travail ; le portail public reste clair par défaut. */', '[data-theme="sombre"] {');
for (const [cle, valeur] of Object.entries(jetons.couleurs)) {
  if (cle.startsWith('$')) continue;
  lignes.push(`  --cj-${nom(cle)}: ${ref(valeur.sombre)};`);
}
lignes.push('}', '');

lignes.push('/* Styles de texte (Figma : Titre/…, Texte/…, Libellé/…). */');
for (const [cle, s] of Object.entries(jetons.typographie.styles)) {
  const police = s.famille === jetons.typographie.familles.titres ? 'var(--cj-police-titres)' : 'var(--cj-police-texte)';
  const decl = [`font-family: ${police}`, `font-weight: ${s.graisse}`, `font-size: ${arrondi(s.taille / 16)}rem`, `line-height: ${arrondi(s.interligne / s.taille)}`];
  if (s.approche) decl.push(`letter-spacing: ${arrondi(s.approche / s.taille)}em`);
  if (s.casse === 'majuscules') decl.push('text-transform: uppercase');
  lignes.push(`.cj-texte-${nom(cle)} { ${decl.join('; ')}; }`);
}
writeFileSync(join(ici, '../src/jetons.css'), lignes.join('\n') + '\n');
console.log('jetons.css généré');
