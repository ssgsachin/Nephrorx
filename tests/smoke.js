// End-to-end check of the main workflow on a laptop, iPad portrait, iPad landscape and a phone.
// Run: npm test   (needs Playwright + Chromium, pre-installed in Claude cloud sessions)
const {chromium,devices}=require('playwright');const fs=require('fs');const path=require('path');
const root=path.join(__dirname,'..');const nm=path.join(root,'node_modules');
const url='file://'+path.join(root,'index.html');
let failed=0;const ok=(c,m)=>{if(!c){failed++;console.log('  FAIL',m)}};
(async()=>{const b=await chromium.launch();
const views=[['laptop',{viewport:{width:1280,height:900}}],['ipad-portrait',devices['iPad (gen 7)']],['ipad-landscape',devices['iPad Pro 11 landscape']],['phone',devices['iPhone 13']]];
for(const [name,dev] of views){
  const ctx=await b.newContext({...dev,acceptDownloads:true});
  await ctx.route(/cdnjs\.cloudflare\.com.*html2canvas/,r=>r.fulfill({body:fs.readFileSync(path.join(nm,'html2canvas/dist/html2canvas.min.js')),contentType:'text/javascript'}));
  await ctx.route(/cdnjs\.cloudflare\.com.*jspdf/,r=>r.fulfill({body:fs.readFileSync(path.join(nm,'jspdf/dist/jspdf.umd.min.js')),contentType:'text/javascript'}));
  await ctx.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  const click=s=>dev.hasTouch?pg.tap(s):pg.click(s);
  await pg.goto(url);console.log(name);
  // new patient
  await click('.top [data-a=newPatient]');
  await pg.fill('#pf_name','Test Patient');await pg.fill('#pf_age','45');await click('[data-sex=F]');await pg.fill('#pf_phone','9123456789');
  await click('#pf_consent');await click('#pform button[type=submit]');
  ok(await pg.isVisible('text=CONSENT ✓'),'consent recorded');
  // paste report
  await click('[data-a=paste]');
  await pg.fill('#pt_txt','Date: 20/11/2026\nSerum Creatinine 2.31 mg/dL 0.6 - 1.2\nPotassium 5.6 mmol/L\nHaemoglobin 9.8 g/dL\nHbA1c 7.2 %\n25-OH Vitamin D3 18.2 ng/mL\nBUN 40');
  await click('[data-a=readPaste]');
  const vals=Object.fromEntries(await pg.$$eval('[data-pk]',els=>els.map(e=>[e.dataset.pk,e.value])));
  ok(vals.cr==='2.31'&&vals.k==='5.6'&&vals.hb==='9.8'&&vals.hba1c==='7.2'&&vals.vitd==='18.2'&&vals.urea==='86','report reader values '+JSON.stringify(vals));
  ok(await pg.inputValue('#pt_date')==='2026-11-20','report date read');
  await click('[data-a=applyPaste]');
  ok((await pg.textContent('#eg_2026-11-20')).trim()==='26','eGFR CKD-EPI 2021 (F 45y cr 2.31 = 25.9 -> 26)');
  // medicines
  await pg.fill('#drug_q','telmi');await pg.press('#drug_q','Enter');
  await pg.fill('#drug_q','bicarb');await pg.press('#drug_q','Enter');
  ok(await pg.$$eval('#rxt tr',r=>r.length)===2,'two medicines added');
  ok(await pg.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no sideways scrolling');
  if(dev.hasTouch)ok(await pg.$eval('#v_bp',e=>getComputedStyle(e).fontSize)==='16px','16px fields on touch (no iOS zoom)');
  // PDF
  await click('.actions [data-a=preview]');await click('#modal [data-a=pdf]');
  await pg.waitForFunction(()=>/Ready|could not/.test(document.querySelector('#pdf_st').textContent),null,{timeout:30000});
  ok(/Ready/.test(await pg.textContent('#pdf_st')),'PDF created');
  // reload keeps data
  await pg.reload();ok(await pg.isVisible('text=Test Patient'),'data kept after reload');
  ok(errs.length===0,'no script errors '+errs.join('; '));
  await ctx.close();
}
await b.close();console.log(failed?`${failed} check(s) failed`:'All checks passed');process.exit(failed?1:0)})();
