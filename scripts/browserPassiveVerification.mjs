import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
// Operator-only private preview: static files are local; the approved-note RPC stays real. No Auth or CAPTCHA is initiated.
const root=path.resolve(process.env.FAITH_BROWSER_CONTROLLED_DIST || '.supabase-test/controlled-dist'),site=process.env.FAITH_BROWSER_PREVIEW_URL || 'https://leo0331.github.io/taipei-faith-map/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const words={en:{garden:'Quiet Garden',open:'Open Quiet Corner',empty:'There are no approved notes to read right now.',close:'Close Quiet Corner',refresh:'Read again',failure:'Quiet Corner is temporarily unavailable. Solo exploration remains available.'},zh:{garden:'靜心庭院',open:'開啟留言角落',empty:'目前沒有可閱讀的已審核留言。',close:'關閉留言角落',refresh:'重新讀取',failure:'留言角落目前無法使用，仍可自由探索。'}};
const browser=await chromium.launch({headless:true,chromiumSandbox:true}); const results=[];
try{
 for(const width of [1280,768,390,375,320])for(const language of ['zh','en']){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:900}});
  try{
   await context.addInitScript(value=>localStorage.setItem('taipei-faith-map-language',value),language);
   await context.route(site+'**',async route=>{const file=path.resolve(root,new URL(route.request().url()).pathname.slice('/taipei-faith-map/'.length)||'index.html');if(path.relative(root,file).startsWith('..'))return route.abort();try{await route.fulfill({body:await readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Missing preview asset'});}});
   const page=await context.newPage();let auth=0,captcha=0,rpc=0;
   page.on('request',r=>{const u=new URL(r.url());if(u.pathname.startsWith('/auth/'))auth++;if(u.hostname==='challenges.cloudflare.com')captcha++;if(u.pathname.includes('/rpc/get_approved_quiet_notes'))rpc++;});
   await page.goto(site,{waitUntil:'domcontentloaded'});
   const opener=page.getByRole('button',{name:words[language].garden,exact:true});await opener.click();
   const dialog=page.getByRole('dialog',{name:words[language].garden});await expect(dialog).toBeVisible();
   await page.getByRole('button',{name:words[language].open,exact:true}).click();await expect(page.getByText(words[language].empty,{exact:true})).toBeVisible();
   assert.equal(auth,0);assert.equal(captcha,0);assert.equal(rpc,1);
   assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true);
   if(width===1280||width===320){await page.addScriptTag({path:path.resolve('node_modules/axe-core/axe.min.js')});const v=await page.evaluate(async()=>{const r=await window.axe.run(document.querySelector('.garden-dialog'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(x=>({id:x.id,targets:x.nodes.map(n=>n.target)}));});assert.equal(v.length,0,JSON.stringify(v));}
   await page.screenshot({path:`.supabase-test/browser-results/garden-${width}-${language}.png`});
   if(width===320){await context.route('https://*.supabase.co/**',r=>r.abort('internetdisconnected'));await page.getByRole('button',{name:words[language].refresh,exact:true}).click();await expect(page.getByText(words[language].failure,{exact:true})).toBeVisible();}
   await page.getByRole('button',{name:words[language].close,exact:true}).click();await expect(page.getByRole('button',{name:words[language].open,exact:true})).toBeFocused();
   await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();
   const result={width,language,passiveReading:'live-passed',authRequests:auth,captchaRequests:captcha,keyboardReturn:'passed',networkFailureInjection:width===320?'passed':'not-performed'};results.push(result);console.log(JSON.stringify(result));
  }finally{await context.close();}
 }
 await writeFile('.supabase-test/browser-results/passive-summary.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
