// Rend chaque NN.html en PNG 2160×3240 : node rendu.js 01 02 ...
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1620},deviceScaleFactor:2});
for(const n of process.argv.slice(2)){await p.goto('file://'+path.resolve(__dirname,n+'.html'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
await (await p.$('#poster')).screenshot({path:path.resolve(__dirname,'affiche-'+n+'.png')});}
await b.close();})();
