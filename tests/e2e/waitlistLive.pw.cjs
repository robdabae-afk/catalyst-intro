const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  for (const width of [390,1440]) {
   const page = await browser.newPage({viewport:{width,height:1000}});
   const backend=[];
   page.on('request',req=>{if (/supabase|example.invalid/.test(req.url())) backend.push(req.url());});
   await page.goto((process.env.PREVIEW_URL || 'http://localhost:51508') + '/preview/waitlist');
   await page.getByRole('heading',{name:'Great things start with the right intro.'}).waitFor();
   await page.getByRole('button',{name:'Static',exact:true}).click();
   await page.getByRole('button',{name:'Animated',exact:true}).click();
   await page.getByRole('button',{name:/Replay/}).click();
   await page.getByRole('button',{name:'Join the waitlist',exact:true}).click();
   await page.getByRole('heading',{name:"You're on the list."}).waitFor();
   assert.equal(await page.locator('input').count(),0);
   await page.getByRole('button',{name:'Back to the preview'}).click();
   await page.getByRole('button',{name:'Join the waitlist',exact:true}).waitFor();
   assert.equal(backend.length,0,JSON.stringify(backend));
   console.log('PASS public SPA route, controls, mock CTA, zero backend requests at '+width);
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
