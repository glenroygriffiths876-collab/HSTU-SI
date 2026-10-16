import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://glenroygriffiths876-collab.github.io/HSTU-SI/';
const views=['home','research','capacity','reports','data-audit','gallery','resources','services'];
const report={title:'HSTU-SI inspection acceptance',timestamp:new Date().toISOString(),target:BASE,
  deployedVersion:'',checks:[],failures:[],warnings:[],measurements:{},result:'IN_PROGRESS'};
const sleep=t=>new Promise(r=>setTimeout(r,t));
const assert=(condition,message)=>{if(!condition)throw Error(message)};
async function check(name,fn){
  const started=Date.now();
  try{
    const detail=await fn();
    report.checks.push({name,status:'PASS',duration_ms:Date.now()-started,detail:detail||null});
    console.log('PASS',name,detail||'');
  }catch(e){
    const reason=String(e.message||e).slice(0,7000);
    report.checks.push({name,status:'FAIL',duration_ms:Date.now()-started,reason});
    report.failures.push({name,reason});
    console.error('FAIL',name,reason);
  }
}
async function get(url,opts={}){
  return fetch(url,{signal:AbortSignal.timeout(18000),...opts});
}
async function pool(items,fn,limit=8){
  const out=new Array(items.length);let idx=0;
  await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
    while(idx<items.length){const i=idx++;out[i]=await fn(items[i],i);}
  }));return out;
}
async function openHome(context,lab){
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const resp=await page.goto(BASE+'?preflight='+Date.now()+'#home',{waitUntil:'domcontentloaded',timeout:35000});
  assert(resp?.ok(),lab+': homepage HTTP '+resp?.status());
  await page.waitForFunction(()=>
    document.documentElement.dataset.hstuRefinements930==='ready' &&
    document.querySelector('#view-home.active')!==null,{timeout:18000}).catch(()=>{});
  // Some enhancements initialize after DOMContentLoaded.
  await page.waitForTimeout(1300);
  assert(await page.locator('#view-home.active').count()===1,lab+': homepage not active');
  return {page,errors};
}
async function headFile(rel,type){
  const url=new URL(rel,BASE);
  for(let a=0;a<3;a++){
    try{
      const r=await get(url,{method:'HEAD',cache:'no-store'});
      if(r.status>=500 && a<2){await sleep(500);continue}
      return {path:rel,http:r.status,type:r.headers.get('content-type')||'',
        ok:r.ok&&type.test(r.headers.get('content-type')||'')};
    }catch(e){if(a===2)return{path:rel,ok:false,error:String(e)};await sleep(500);}
  }
}

let browser=null;
try {
  await check('Production deployment corresponds to fixed PDF code',async()=>{
    for(let i=0;i<24;i++){
      const [h,s]=await Promise.all([
        get(BASE+'?inspection='+Date.now(),{cache:'no-store'}).then(x=>x.text()).catch(()=>''),
        get(BASE+'service-worker.js?inspection='+Date.now(),{cache:'no-store'}).then(x=>x.text()).catch(()=>'')]);
      if(h.includes('const HSTU_LOCAL_MANUALS=') &&
         h.includes('"staff-orders":"documents/pdf-library/manual-staff-orders.pdf"') &&
         s.includes('hstu-resource-centre-v20261016-firsttap-documents-v1') &&
         s.includes('if(event.request.mode==="navigate" && !isAppEntry) return;')){
        report.deployedVersion='All 18 public manuals hosted locally, document-safe service worker confirmed';
        return 'Fixed HTML and service worker served by GitHub Pages';
      }
      await sleep(4000);
    }
    throw Error('GitHub Pages is serving an older HTML/service-worker version');
  });
  const manifest=JSON.parse(readFileSync('pdf-library.json','utf8'));
  const localized=Object.values(manifest.by_url||{}).filter(x=>x.local);
  await check('Localized PDF + preview manifest preserves all content',()=>{
    assert(localized.length===75,'Expected 75 PDF records, got '+localized.length);
    assert(new Set(localized.map(x=>x.local)).size===75,'Duplicate PDF path');
    assert(new Set(localized.map(x=>x.preview)).size===75,'Duplicate preview path');
    return '75 unique documents, 75 unique previews';
  });
  await check('Every localized PDF and image preview is hosted as correct media',async()=>{
    const paths=[...new Set(localized.flatMap(x=>[x.local,x.preview]))];
    const result=await pool(paths,rel=>headFile(rel,/\.pdf$/i.test(rel)?/application\/pdf/i:/image\/webp/i),10);
    const bad=result.filter(x=>!x.ok);
    assert(bad.length===0,'Bad document/preview responses '+JSON.stringify(bad.slice(0,15)));
    report.measurements.hostedPdfFiles=75;report.measurements.hostedPreviewFiles=75;
    return '150/150 hosted paths return correct content type';
  });
  await check('Local PDF contains actual PDF bytes',async()=>{
    const sample=localized.filter(x=>x.bytes<1000000).slice(0,4);
    assert(sample.length>1,'Insufficient sample PDFs');
    const records=[];
    for(const x of sample){
      const r=await get(new URL(x.local,BASE),{headers:{Range:'bytes=0-31'}});
      assert(r.ok,'GET failed '+x.local);
      const bytes=Buffer.from(await r.arrayBuffer());
      const header=bytes.subarray(0,5).toString('ascii');
      assert(header==='%PDF-','HTML or wrong file at '+x.local+': '+header);
      records.push(x.local);
    }
    return '4 independent documents have PDF magic header';
  });
  const catalog=JSON.parse(readFileSync('research-catalogue.json','utf8'));
  await check('Research catalogue and repository content parse correctly',()=>{
    const data=JSON.parse(readFileSync('repository-content.json','utf8'));
    assert(data.about?.researchAreas?.length===15,'15 thematic areas missing');
    assert(!!catalog,'Research catalogue missing');
    return 'Both JSON data sources parsed; 15 thematic areas';
  });
  browser=await chromium.launch({headless:true});
  for(const [label,viewport] of [['phone',{width:390,height:844}],['desktop',{width:1440,height:900}]]){
    const context=await browser.newContext({viewport,isMobile:label==='phone',hasTouch:label==='phone'});
    let session=null;
    await check(label+': cold first-entry renders without blank page',async()=>{
      session=await openHome(context,label);
      const page=session.page;
      assert(await page.locator('html').getAttribute('data-hstu-refinements930')==='ready','Refinement startup incomplete');
      assert(await page.getByText('About the Research Data Repository',{exact:true}).first().isVisible(),'Home title missing');
      const dims=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
      assert(dims.doc<=dims.width+3&&dims.body<=dims.width+3,'Horizontal overflow '+JSON.stringify(dims));
      await page.screenshot({path:'/tmp/hstu-inspection-'+label+'-home.png'});
      return 'Page ready, full Home text and responsive width';
    });
    if(!session){await context.close();continue;}
    const page=session.page;
    await check(label+': eight sections show the proper view',async()=>{
      const seen=[];
      for(const view of views){
        await page.evaluate(v=>{window.setView(v,{push:false});},view);
        await page.waitForTimeout(90);
        assert(await page.locator('#view-'+view+'.active').isVisible(),view+' is not visible');
        seen.push(view);
      }
      await page.evaluate(()=>window.setView('home',{push:false}));
      return seen.join(', ');
    });
    await check(label+': homepage buttons, branding and core collections',async()=>{
      const buttons=page.locator('#home-purpose-hero .hstu-purpose-cta-930 button');
      assert(await buttons.count()===3,'Three Home actions missing');
      for(const [route,color,fg] of [
        ['research','rgb(22, 148, 71)','rgb(255, 255, 255)'],
        ['reports','rgb(215, 25, 32)','rgb(255, 255, 255)'],
        ['data-audit','rgb(242, 183, 20)','rgb(22, 19, 7)']]){
        const btn=buttons.locator('[data-purpose-view="'+route+'"]');
        // buttons.locator filters descendants; use direct attribute selector instead.
        const target=page.locator('#home-purpose-hero button[data-purpose-view="'+route+'"]');
        const style=await target.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,text:getComputedStyle(el).color}));
        assert(style.bg===color&&style.text===fg,route+' colour changed: '+JSON.stringify(style));
        await target.click();
        await page.waitForTimeout(200);
        assert(await page.locator('#view-'+route+'.active').count()===1,route+' failed first click');
        await page.evaluate(()=>window.setView('home',{push:false}));
        await page.waitForTimeout(300);
      }
      assert(await page.locator('#home-thematic-areas .hstu-theme-card').count()===15,'Thematic cards changed');
      assert(await page.locator('#home-quick-access .hstu-quick-card').count()===7,'Quick Access count changed');
      return 'Green/red/gold buttons and first clicks; 15 themes; 7 Quick Access';
    });
    await check(label+': all five Gallery filters work',async()=>{
      await page.evaluate(()=>window.setView('gallery',{push:false}));
      await page.waitForTimeout(350);
      const expected={All:51,HIV:21,STI:5,TB:1,PrEP:2};
      for(const [name,count] of Object.entries(expected)){
        await page.locator('#hstuGalleryFilters button').filter({hasText:new RegExp('^'+name+'$')}).click();
        await page.waitForTimeout(240);
        const visible=await page.locator('#hstuGalleryGrid > *:visible').count();
        assert(visible===count,name+': expected '+count+', received '+visible);
      }
      await page.locator('#hstuGalleryFilters button').filter({hasText:/^All$/}).click();
      const urls=await page.locator('#hstuGalleryGrid img').evaluateAll(els=>els.map(el=>el.src));
      assert(urls.length>=51,'Gallery card images missing '+urls.length);
      const results=await pool([...new Set(urls)],u=>headFile(u,/image\/(webp|jpeg|png|gif|avif)/i),8);
      const failed=results.filter(x=>!x.ok);
      assert(failed.length===0,'Broken Gallery images: '+JSON.stringify(failed.slice(0,10)));
      return 'All 51 | HIV 21 | STI 5 | TB 1 | PrEP 2; all Gallery image URLs valid';
    });
    await check(label+': 18 Capacity Building manual cards point to real sources',async()=>{
      await page.evaluate(()=>window.setView('capacity',{push:false}));
      const items=await page.evaluate(()=>MANUALS.map(m=>({
        id:m.id,title:m.title,source:manualHref(m),local:HSTU_LOCAL_MANUALS[m.id]
      })));
      assert(items.length===18,'Only '+items.length+' manual records');
      const cardNodes=await page.locator('#manualGrid a[data-open-manual]').evaluateAll(nodes=>nodes.map(x=>({
        id:x.dataset.openManual,href:x.href
      })));
      assert(cardNodes.length===18,'Only '+cardNodes.length+' manual cards');
      for(const item of items){
        const dest=new URL(item.source,BASE);
        assert(item.local && dest.pathname.endsWith('/HSTU-SI/pdf-reader.html')
          && dest.searchParams.get('file')===item.local
          && dest.searchParams.get('title')===item.title,
          'Wrong hosted manual document identity: '+item.id);
        const displayed=cardNodes.find(x=>x.id===item.id);
        assert(displayed && displayed.href===dest.href,
          'Wrong manual card link: '+item.id+' -> '+JSON.stringify(displayed));
        const pdf=await headFile(item.local,/application\/pdf/i);
        assert(pdf.ok,'Hosted public manual PDF missing: '+item.id+' '+JSON.stringify(pdf));
      }
      return '18/18 correct source links, none point at nonexistent root PDFs';
    });
    await check(label+': actual PDF reader displays correct document on first tap',async()=>{
      await page.evaluate(()=>window.setView('capacity',{push:false}));
      await page.waitForTimeout(250);
      const target=page.locator('#view-capacity a.external-ref[href*="pdf-reader.html?file="]').first();
      assert(await target.count()===1,'No localized PDF reader link in Capacity Building');
      const href=await target.getAttribute('href');
      const expected=new URL(href,BASE).searchParams.get('file');
      assert(/^documents\/pdf-library\/.+\.pdf$/i.test(expected),'Invalid reader file '+expected);
      const popupPromise=page.waitForEvent('popup',{timeout:15000});
      await target.click();
      const reader=await popupPromise;
      try{
        await reader.waitForLoadState('domcontentloaded',{timeout:20000});
        assert(reader.url().includes('/pdf-reader.html?file='),'Click opened wrong destination '+reader.url());
        await reader.waitForFunction(()=>document.documentElement.dataset.hstuPdfReady==='1' &&
          document.querySelector('#pageCanvas')?.width>100 && !document.querySelector('#pageCanvas').hidden,
          null,{timeout:22000});
        const state=await reader.evaluate(()=>({
          file:document.documentElement.dataset.hstuPdfFile,
          original:document.querySelector('#original')?.href,
          firstPage:document.querySelector('#counter')?.textContent
        }));
        assert(state.file===expected,'Reader opened WRONG document: '+JSON.stringify(state));
        assert(state.original.endsWith(expected),'Original PDF mismatch: '+JSON.stringify(state));
        const resp=await get(state.original,{method:'HEAD'});
        assert(resp.ok&&/application\/pdf/i.test(resp.headers.get('content-type')||''),
          'Reader original file is not a real PDF');
        return 'One tap loads the correct full PDF page and preserves original PDF';
      }finally{await reader.close();}
    });
    await check(label+': Gia, Gallery and PWA controls remain present',async()=>{
      const fab=page.locator('#clinicalFab');
      assert(await fab.count()===1,'Gia avatar missing');
      await fab.click();
      assert(await page.locator('#clinicalDrawer').getAttribute('aria-hidden')==='false' ||
             await page.locator('#clinicalDrawer').isVisible(),'Gia drawer did not open');
      const close=page.locator('#clinicalBack,#clinicalClose').first();
      if(await close.count())await close.click().catch(()=>{});
      const gallery=page.locator('#hstuGalleryGrid');
      assert(await gallery.count()===1,'Gallery missing');
      assert(await page.locator('[class*="hstu-pwa"],[class*="install"]').count()>=1,'PWA install/share controls missing');
      return 'Gia opens, Gallery exists, PWA actions remain';
    });
    await check(label+': phone/desktop menu is operable',async()=>{
      if(label==='phone'){
        const toggle=page.locator('#menuToggle');
        assert(await toggle.isVisible(),'Hamburger missing');
        await toggle.click();
        assert(await page.locator('#hstuMobileMenu930').isVisible(),'Mobile menu failed to open');
        const galleryParent=page.locator('#hstuMobileMenu930 .hstu-mobile-parent-930').filter({hasText:/^Gallery$/});
        await galleryParent.click();
        const tb=page.locator('#hstuMobileMenu930 .hstu-mobile-children-930:visible button').filter({hasText:/^TB$/});
        assert(await tb.count()===1,'TB submenu missing');
        await tb.click();
        await page.waitForTimeout(450);
        assert(await page.locator('#view-gallery.active').count()===1,'Gallery submenu not navigated');
        assert(await page.locator('#hstuGalleryGrid > *:visible').count()===1,'TB filter not retained');
      }else{
        const home=page.locator('#mainNav .nav-btn[data-view="home"]');
        await home.hover();
        assert(await home.locator('xpath=..').locator('.hstu-nav-dropdown').isVisible(),'Desktop dropdown absent');
        await page.locator('#mainNav .nav-btn[data-view="research"]').click();
        assert(await page.locator('#view-research.active').count()===1,'Desktop Research first click failed');
      }
      return 'Navigation menu + section selection succeeded';
    });
    await check(label+': JavaScript and layout regression scan',async()=>{
      const dims=await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
      assert(dims.doc<=dims.width+3&&dims.body<=dims.width+3,'Overflow '+JSON.stringify(dims));
      assert(session.errors.length===0,'Uncaught JS errors: '+JSON.stringify(session.errors));
      return 'Zero uncaught JavaScript exceptions; no horizontal overflow';
    });
    await context.close();
  }
} catch(e) {
  report.failures.push({name:'Runner',reason:String(e.stack||e)});
}finally{
  if(browser)await browser.close().catch(()=>{});
  report.result=report.failures.length?'FAIL':'PASS';
  report.measurements.checks=report.checks.length;
  report.measurements.passed=report.checks.filter(x=>x.status==='PASS').length;
  report.measurements.failed=report.failures.length;
  mkdirSync('docs',{recursive:true});
  writeFileSync('docs/hstu-inspection-acceptance.json',JSON.stringify(report,null,2)+'\n');
  console.log('ACCEPTANCE SUMMARY',JSON.stringify({result:report.result,checked:report.checks.length,failed:report.failures.length,failures:report.failures}));
  process.exitCode=report.failures.length?1:0;
}
