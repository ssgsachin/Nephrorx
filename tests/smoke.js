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
  await ctx.route(/qrcode-generator/,r=>r.fulfill({body:fs.readFileSync(path.join(nm,'qrcode-generator/qrcode.js')),contentType:'text/javascript'}));
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
  if(name==='laptop'){
    // follow-up: last visit's medicines are ready
    await click('.pitem >> text=Test Patient');await click('[data-a=newVisit]');
    ok(await pg.$$eval('#rxt tr',r=>r.length)===2&&await pg.isVisible('[data-a=clearRx]'),'previous medicines ready at follow-up');
    await click('[data-a=rxDel][data-i="1"]');
    ok(await pg.isVisible('#sugg >> text=Your usual:')&&await pg.isVisible('#sugg >> text=Sodium bicarbonate'),'usual medicines offered');
    await click('#sugg >> text=Sodium bicarbonate');
    // smart suggestions + templates
    await pg.click('#v_cc');await pg.type('#v_cc','swel');
    await pg.click('#sg_cc >> text=Swelling of feet');
    ok((await pg.inputValue('#v_cc')).startsWith('Swelling of feet'),'complaint suggestion inserted');
    await pg.click('#sg_cc .pinbtn');
    await pg.fill('#p_hx','Diabetes since 8 years');
    // language on the prescription
    await click('.actions [data-a=preview]');
    await pg.selectOption('#rx_lang','mr');
    const paper=await pg.textContent('#paperbox');
    ok(paper.includes('सकाळी')&&paper.includes('जेवणानंतर')&&paper.includes('औषधे'),'Marathi on the prescription');
    ok(paper.includes('Past history')&&paper.includes('Diabetes since 8 years'),'past history printed');
    await pg.selectOption('#rx_lang','ta').catch(()=>{});
    for(const [l,word] of [['hi','सुबह'],['gu','સવારે'],['kn','ಬೆಳಿಗ್ಗೆ'],['ml','രാവിലെ'],['te','ఉదయం'],['or','ସକାଳେ'],['bn','সকালে'],['pa','ਸਵੇਰੇ'],['as','পুৱা']]){
      await pg.selectOption('#rx_lang',l);ok((await pg.textContent('#paperbox')).includes(word),'language '+l)}
    await pg.selectOption('#rx_lang','mr');
    await click('#modal [data-a=close]');
    await click('.actions [data-a=whatsapp]');
    ok((await pg.inputValue('#wa_txt')).includes('जेवणानंतर'),'WhatsApp message in Marathi');
    await click('#modal [data-a=close]');
    // scan photos
    await pg.setInputFiles('#ph_in',path.join(root,'icon-180.png'));
    await pg.waitForSelector('#files .thumb img');
    await click('#files .thumb');ok(!!(await pg.waitForSelector('.fullimg',{timeout:5000}).catch(()=>null)),'photo opens full size');
    await pg.fill('#fv_cap','Right kidney 9.1 cm');await click('[data-a=saveFile]');
    await pg.waitForSelector('#files >> text=Right kidney 9.1 cm');
    // templates list in settings
    await click('.top [data-a=settings]');ok(await pg.isVisible('#modal >> text=Swelling of feet'),'saved template listed');await click('#modal [data-a=close]');
    // links from the clinic website/app
    await pg.goto(url+'#patient?name=Asha%20Rao&phone=%2B91%2090000%2011111&age=50&sex=female');
    ok(await pg.inputValue('#pf_name')==='Asha Rao'&&await pg.inputValue('#pf_phone')==='9000011111','website link prefills New patient');
    ok(!(await pg.evaluate(()=>location.hash)),'patient details removed from the address bar');
    await click('#pf_consent');await click('#pform button[type=submit]');
    await pg.evaluate(()=>{location.hash='#patient?phone=9000011111'});
    await pg.waitForTimeout(200);
    ok((await pg.textContent('.phead h1'))==='Asha Rao','website link opens an existing patient');
    // website/app links + QR on the prescription and WhatsApp text
    await click('.top [data-a=settings]');
    await pg.fill('#s_website','www.example-clinic.in');await pg.fill('#s_bookLink','https://example-clinic.in/book');
    // CSV import
    await pg.setInputFiles('#imp_csv',{name:'p.csv',mimeType:'text/csv',buffer:Buffer.from('Name,Age,Gender,Mobile No,City\n"Kale, Sunita",62,Female,9822200000,Thane\nAsha Rao,50,F,9000011111,Thane\n,40,M,,\n')});
    await pg.waitForFunction(()=>/Added/.test(document.querySelector('#csv_st').textContent));
    ok(/Added 1 patient\..*Skipped 1 already.*Skipped 1 row/.test(await pg.textContent('#csv_st')),'CSV import: '+await pg.textContent('#csv_st'));
    await click('#modal [data-a=saveSettings]');
    ok(await pg.isVisible('text=Kale, Sunita'),'imported patient listed');
    await click('.actions [data-a=preview]');
    ok(await pg.isVisible('.paper .links .qr img'),'booking QR code on prescription');
    ok(/example-clinic\.in\/book/.test(await pg.textContent('.paper .links')),'booking link printed');
    await click('#modal [data-a=close]');await click('.actions [data-a=whatsapp]');
    ok(/Website: https:\/\/www\.example-clinic\.in/.test(await pg.inputValue('#wa_txt')),'links in WhatsApp message');
  }
  ok(errs.length===0,'no script errors '+errs.join('; '));
  await ctx.close();
}
// AI report reading, with a stand-in for the Claude app's AI
{const ctx=await b.newContext({viewport:{width:1280,height:900}});
  await ctx.route(/cdnjs|jsdelivr|fonts\./,r=>r.abort());
  await ctx.addInitScript(()=>{window.claude={use:async n=>{if(n!=='sample')return null;const f=async()=>({text:''});
    f.json=async(input,opts)=>{window.__imgs=(opts&&opts.images||[]).length;if(/^Translate/.test(input))return ['अनुवाद केलेला सल्ला'];
      return {reports:[{date:'2026-11-21',values:{cr:'3.1',k:'5.9',bogus:'1',hb:'nine'},other:[{name:'C3',value:'80',unit:'mg/dL'}]},{date:'2026-10-02',values:{cr:'2.8'},other:[]}]}};
    f.limits=async()=>({images:{maxCount:5,maxInputBytes:5e6,mediaTypes:['image/jpeg','image/png']}});return f}}});
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto(url);console.log('ai (simulated)');
  await pg.click('.top [data-a=newPatient]');await pg.fill('#pf_name','AI Patient');await pg.fill('#pf_age','60');await pg.click('[data-sex=M]');await pg.click('#pform button[type=submit]');
  await pg.click('[data-a=paste]');await pg.setInputFiles('#rp_photo',path.join(root,'icon-180.png'));
  await pg.waitForSelector('#rp_thumbs img');await pg.click('[data-a=readAI]');
  await pg.waitForSelector('.rev');
  ok(await pg.$$eval('.rev',r=>r.length)===2,'two report dates found');
  ok(await pg.evaluate(()=>window.__imgs)===1,'photo sent to AI');
  ok(await pg.$$eval('[data-pk]',e=>e.map(x=>x.dataset.pk).join())==='cr,k,cr','only valid values kept');
  await pg.click('[data-a=applyPaste]');
  await pg.waitForSelector('[data-lab="2026-11-21"][data-k=cr]');
  ok(await pg.inputValue('[data-lab="2026-11-21"][data-k=cr]')==='3.1'&&await pg.inputValue('[data-lab="2026-10-02"][data-k=cr]')==='2.8','AI values in the grid');
  ok(await pg.isVisible('th.tn >> text=C3'),'other test added as a new row');
  await pg.waitForSelector('#files .thumb');ok(true,'report photo kept in files');
  // translate own advice
  await pg.fill('#adv_add','Avoid star fruit');await pg.press('#adv_add','Enter');
  await pg.click('.actions [data-a=preview]');await pg.selectOption('#rx_lang','mr');await pg.click('[data-a=trAI]');
  await pg.waitForFunction(()=>document.querySelector('#paperbox').textContent.includes('अनुवाद केलेला सल्ला'));ok(true,'AI translation of own advice');
  ok(errs.length===0,'no script errors '+errs.join('; '));await ctx.close()}
await b.close();console.log(failed?`${failed} check(s) failed`:'All checks passed');process.exit(failed?1:0)})();
