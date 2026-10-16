// Assemble la version en ligne : une page unique (CSS et JS inlinés) publiable comme Artifact claude.ai.
// Usage : npm run build:artifact  →  artifact/bet-intelligence-ai.html
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist-artifact/assets';
const files = readdirSync(dist);
const js = files.filter((f) => f.endsWith('.js'));
const css = files.filter((f) => f.endsWith('.css'));
if (js.length !== 1 || css.length !== 1) throw new Error(`Attendu 1 JS et 1 CSS, trouvé ${js} / ${css}`);

const script = readFileSync(join(dist, js[0]), 'utf8').replace(/<\/script/gi, '<\\/script');
const style = readFileSync(join(dist, css[0]), 'utf8').replace(/<\/style/gi, '<\\/style');

// Le squelette (doctype, head, body) est ajouté à la publication : on n'écrit que le contenu.
const page = `<title>BET INTELLIGENCE AI</title>
<meta name="theme-color" content="#070d1a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap">
<style>${style}</style>
<div id="root"></div>
<script>${script}</script>
`;
mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/bet-intelligence-ai.html', page);
console.log(`artifact/bet-intelligence-ai.html — ${(page.length / 1024).toFixed(0)} Kio`);
