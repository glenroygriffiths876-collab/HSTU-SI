import {chromium} from 'playwright';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const BASE=process.env.HSTU_TEST_BASE||'https://glenroygriffiths876-collab.github.io/HSTU-SI/';
const manifest=JSON.parse(fs.readFileSync('pdf-library.json','utf8'));
const hosted=Object.values(manifest.by_url).filter(v=>v.local);
const views=['home','research','capacity','reports','data-audit','gallery','resources','services'];
const report={base:BASE,utc:new Date().toISOString(),result:'IN_PROGRESS',
  hostedTotal:hosted.length,checks:[],errors:[],warnings:[],linkInventory:[],rendered:[]};
const fail=(m)=>{throw Error(m)};
const check=(ok,m)=>{if(!ok)fail(m)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function task(name,fn){
  try{const detail=await fn();report.checks.push({name,result:'PASS',detail});console.log('PASS '+name+' '+JSON.stringify(detail).slice(0,400));}
  catch(e){const message=String(e.stack||e).slice(0,1900);report.errors.push({name,message});report.checks.push({name,result:'FAIL',message});console.error('FAIL '+name+' '+message);}
}
async function ready(page){
  await page.waitForFunction(()=>document.documentElement.dataset.hstuRefinements930==='ready',null,{timeout:22000});
  await page.waitForTimeout(600);
}
const extract=(href)=>{
  const u=new URL(href,BASE);
  return u.pathname.endsWith('/pdf-reader.html')?{file:u.searchParams.get('file'),title:u.searchParams.get('title')}:null;
};
const indexed=new Map(hosted.map(x=>[x.local,x]));
const browser=await chromium.launch({headless:true});
try{
  await task('Every manifest record has unique safe hosted paths',()=>{
    check(hosted.length===75,'Expected 75 PDFs; actual '+hosted.length);
    check(new Set(hosted.map(x=>x.local)).size===hosted.length,'PDF paths duplicated in manifest');
    check(new Set(hosted.map(x=>x.preview)).size===hosted.length,'Preview paths duplicated');
    check(Object.values(manifest.by_url).filter(x=>!x.local).every(x=>x.status==='external'),
      'Undeclared inaccessible source');
    return {pdf:hosted.length,external:Object.values(manifest.by_url).filter(x=>!x.local).length};
  });
  for(const device of ['phone','desktop']){
    const mobile=device==='phone';
    const context=await browser.newContext({
      viewport:mobile?{width:390,height:844}:{width:1440,height:900},
      isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,
      serviceWorkers:'block',acceptDownloads:true
    });
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await task(device+': clickable PDF anchors preserve original-to-reader-to-preview identity',async()=>{
      const rsp=await page.goto(BASE+'?documentQa='+Date.now()+'#home',{waitUntil:'domcontentloaded',timeout:40000});
      check(rsp?.ok(),'Home not reachable');
      await ready(page);
      const found=[];
      for(const view of views){
        await page.evaluate(v=>window.setView(v,{push:false}),view);
        await sleep(180);
        const data=await page.locator('#view-'+view+' a[href]').evaluateAll(els=>
          els.map(el=>{
            const card=el.closest('article.hstu-refine-card,.hstu-parity-card,.external-ref,.manual-card');
            return {view:document.querySelector('.view.active')?.id||'',
              href:el.href,raw:el.getAttribute('href'),
              original:el.getAttribute('data-original-pdf-url'),
              local:el.getAttribute('data-original-local-pdf'),
              cardTitle:card?.querySelector('h3,b')?.textContent?.trim()||'',
              previewImg:card?.querySelector('img.hstu-pdf-preview-image-930,img.hstu-pdf-preview-930, .hstu-pdf-preview-930 img')?.getAttribute('src')||null
            };
          }).filter(x=>x.local||x.raw?.includes('pdf-reader.html?file=')||/\.pdf(?:$|[?#])/i.test(x.raw||''))
        );
        for(const entry of data){ entry.view=view;found.push(entry); }
      }
      check(found.length>40,'Only '+found.length+' PDF link anchors discovered in 8 sections');
      console.log('UNMAPPED_PDF_ANCHORS',device,JSON.stringify(found.filter(x=>!extract(x.href))));
      let verified=0;
      for(const a of found){
        const dest=extract(a.href);
        if(!dest){
          if(a.local)fail('Localized link still opens outside reader '+JSON.stringify(a));
          continue;
        }
        const item=indexed.get(dest.file);
        check(!!item,'Reader references nonexistent hosted PDF '+JSON.stringify(a));
        if(a.original){
          check(a.original===item.source,'Wrong source PDF associated with '+JSON.stringify(a));
        }
        if(a.local)check(a.local===dest.file,'Mapped document replaced by different file '+JSON.stringify(a));
        if(a.previewImg){
          check(new URL(a.previewImg,BASE).pathname.endsWith('/HSTU-SI/'+item.preview)||
            new URL(a.previewImg,BASE).pathname.endsWith('/'+item.preview),
            'Preview image does not match clicked PDF '+JSON.stringify(a));
        }
        if(a.cardTitle&&dest.title){
          check(a.cardTitle===dest.title,
            'Displayed title differs from clicked PDF title '+JSON.stringify(a));
        }
        verified++;
      }
      report.linkInventory.push(...found.map(a=>({...a,device})));
      return {allAnchors:found.length,localizedReaderAnchors:verified,sections:views.length};
    });
    await task(device+': verified report-to-report user clicks (July then March then Mystery)',async()=>{
      const cases=[
        ['SI Report (July 2026)','089d438912ef4d23a90c6a211e3c9f05',55],
        ['SI Quarterly Report (March 2026)','1479a1a62dc646c79c0da8c220455801',61],
        ['Mystery Shopping Assessment Report 2026 Q2 (Final)','be0da640263d48f8be133853c42b4c33',16],
        ['SI Report (July 2026)','089d438912ef4d23a90c6a211e3c9f05',55]
      ];
      const signatures=[];
      for(const [name,id,pages] of cases){
        await page.evaluate(()=>window.setView('reports',{push:false}));
        await sleep(150);
        const card=page.locator('#view-reports article.hstu-refine-card').filter({has:page.getByRole('heading',{name,exact:true})});
        check(await card.count()===1,'Wrong number of report cards for '+name);
        const link=card.locator('a[href*="pdf-reader.html?file="]').first();
        check(await link.count()===1,'Report does not use verified reader '+name);
        const [reader]=await Promise.all([page.waitForEvent('popup',{timeout:16000}),link.click()]);
        try{
          await reader.waitForFunction(()=>document.documentElement.dataset.hstuPdfRendered==='1'&&
            document.querySelector('#status')?.hidden===true&&
            document.querySelector('#cover')?.hidden===true, null,{timeout:40000});
          const obs=await reader.evaluate(()=>({
            title:document.querySelector('#documentTitle')?.textContent||'',
            file:document.documentElement.dataset.hstuPdfFile||'',
            pages:document.querySelector('#counter')?.textContent||'',
            spinner:getComputedStyle(document.querySelector('#status')).display,
            cover:getComputedStyle(document.querySelector('#cover')).display,
            canvas:getComputedStyle(document.querySelector('#pageCanvas')).display,
            hash:(()=>{
              const text=document.querySelector('#pageCanvas').toDataURL('image/png');
              let h=2166136261;
              for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;
              return h;
            })()
          }));
          check(obs.title===name,'Wrong reader title '+JSON.stringify(obs));
          check(obs.file.includes(id),'Clicked '+name+' but displayed another document '+JSON.stringify(obs));
          check(obs.pages==='Page 1 of '+pages,'Incorrect page count '+JSON.stringify(obs));
          check(obs.spinner==='none'&&obs.cover==='none'&&obs.canvas!=='none',
            'Loading status or preview remains visible after PDF rendered '+JSON.stringify(obs));
          if(signatures.length&&cases[signatures.length-1][0]!==name){
            check(signatures[signatures.length-1].hash!==obs.hash,
              'Reused previous report image when selecting different document');
          }
          signatures.push(obs);
          if(device==='phone'&&signatures.length===3)
            await reader.screenshot({path:'/tmp/hstu-mystery-reader.png'});
        }finally{await reader.close()}
      }
      return {reports:cases.map(x=>x[0]),distinctPageImages:true,spinnerHidden:true};
    });
    await task(device+': reader UI no horizontal overflow or script errors',async()=>{
      const size=await page.evaluate(()=>({inner:innerWidth,html:document.documentElement.scrollWidth}));
      check(size.html<=size.inner+4,'Responsive width regression '+JSON.stringify(size));
      check(errors.length===0,'Uncaught script errors '+JSON.stringify(errors));
      return size;
    });
    await context.close();
  }
  // Exercise the real hosted reader for ALL 75 PDFs on mobile screen dimensions.
  const context=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    deviceScaleFactor:1,serviceWorkers:'block'});
  const viewer=await context.newPage();
  let count=0;
  for(const item of hosted){
    const name='PDF '+(++count)+'/75: '+item.local;
    await task(name,async()=>{
      const url=new URL('pdf-reader.html',BASE);
      url.searchParams.set('file',item.local);
      url.searchParams.set('title','Verified document '+count);
      const resp=await viewer.goto(url.href,{waitUntil:'domcontentloaded',timeout:50000});
      check(resp?.ok(),'Reader HTTP failure');
      await viewer.waitForFunction(()=>document.documentElement.dataset.hstuPdfRendered==='1'||
        !!document.documentElement.dataset.hstuPdfError,null,{timeout:65000});
      const data=await viewer.evaluate(()=>({
        file:document.documentElement.dataset.hstuPdfFile,
        page:document.querySelector('#counter')?.textContent,
        rendered:document.documentElement.dataset.hstuPdfRendered,
        error:document.documentElement.dataset.hstuPdfError,
        loadingVisible:getComputedStyle(document.querySelector('#status')).display!=='none',
        coverVisible:getComputedStyle(document.querySelector('#cover')).display!=='none'
      }));
      check(data.file===item.local,'Opened wrong PDF '+JSON.stringify(data));
      check(data.rendered==='1'&&!data.error,'Document cannot render: '+JSON.stringify(data));
      check(!data.loadingVisible&&!data.coverVisible,
        'Preview/loading indicator stuck after real page render '+JSON.stringify(data));
      report.rendered.push({file:item.local,firstPage:data.page,status:'PASS'});
      return data.page;
    });
  }
  await context.close();
}finally{
  await browser.close();
  report.result=report.errors.length?'FAIL':'PASS';
  report.passed=report.checks.filter(x=>x.result==='PASS').length;
  report.failed=report.errors.length;
  fs.mkdirSync('docs',{recursive:true});
  fs.writeFileSync('docs/hstu-all-documents-browser-audit.json',JSON.stringify(report,null,2)+'\n');
  console.log('DOCUMENT REGRESSION FINAL',report.result,report.passed,report.failed,report.rendered.length);
  if(report.errors.length)process.exitCode=1;
}
