// Génère src/icones.ts à partir des pictogrammes Lucide versés dans assets/pictogrammes (licence ISC).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const dossier = join(ici, '../../../assets/pictogrammes');
const icones = {};
for (const f of readdirSync(dossier).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = readFileSync(join(dossier, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const interieur = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>'));
  icones[f.replace('.svg', '')] = interieur.replace(/\s+/g, ' ').replace(/> </g, '><').replace(/ \/>/g, '/>').trim();
}
const lignes = [
  '// Fichier généré par scripts/generer-icones.mjs — pictogrammes Lucide 1.58 (licence ISC, voir assets/pictogrammes/LICENSE-lucide.txt).',
  'export const ICONES = {',
  ...Object.entries(icones).map(([k, v]) => `  '${k}': ${JSON.stringify(v)},`),
  '} as const;',
  '',
  'export type NomIcone = keyof typeof ICONES;',
  '',
];
writeFileSync(join(ici, '../src/icones.ts'), lignes.join('\n'));
console.log(Object.keys(icones).length + ' pictogrammes');
