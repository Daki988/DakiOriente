const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
await p.goto('file://'+__dirname+'/creas.html',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
for(const id of ['A-sq','A-st','B-sq','B-st','C-sq','C-st']){const el=await p.$('#'+id);await el.screenshot({path:`${__dirname}/NEAM_essai_${id}.png`});}
await b.close();console.log('ok');})();
