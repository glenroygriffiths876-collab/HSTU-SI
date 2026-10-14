import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';

const BASE='https://glenroygriffiths876-collab.github.io/HSTU-SI/';
const report={suite:'HSTU hosted PDF first-click reader',checkedAt:new Date().toISOString(),
  result:'IN_PROGRESS',checks:[],issues:[],source:'Live GitHub Pages'};
const requireTrue=(c,message)=>{if(!c)throw Error(message)};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function check(name,fn){
 try{const detail=await fn();report.checks.push({name,result:'PASS',detail:detail||''});console.log('PASS',name,detail||'')}
 catch(e){const reason=String(e.stack||e).slice(0,2200);report.checks.push({name,result:'FAIL',reason});report.issues.push({name,reason});console.error('FAIL',name,reason)}
}
async function waitPublished(){
 for(let i=0;i<40;i++){
  const [h,r,js,w]=await Promise.all([
   fetch(BASE+'?readerqa='+Date.now(),{cache:'no-store'}).then(r=>r.text()).catch(()=>''),
   fetch(BASE+'pdf-reader.html?readerqa='+Date.now(),{cache:'no-store'}).then(r=>r.text()).catch(()=>''),
   fetch(BASE+'vendor/pdfjs/pdf.min.js?readerqa='+Date.now(),{cache:'no-store'}).catch(()=>null),
   fetch(BASE+'vendor/pdfjs/pdf.worker.min.js?readerqa='+Date.now(),{cache:'no-store'}).catch(()=>null)
  ]);
  if(h.includes("function readerHref930(file,title)")&&r.includes('attempting full binary')
   &&js?.ok&&w?.ok)return;
  await pause(8000);
 }
 throw Error('Homepage, reader or bundled PDF.js not deployed within wait period');
}
const browser=await chromium.launch({headless:true});
try{
 await check('Live reader + two local PDF.js assets deployed',waitPublished);
 for(const [kind,options] of [['phone',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}],['desktop',{viewport:{width:1440,height:900},deviceScaleFactor:1}]]){
  const ctx=await browser.newContext(options);
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let popup,documentLink;
  await check(kind+': source reports visible',async()=>{
   const response=await page.goto(BASE+'?testreader='+Date.now()+'#reports',{waitUntil:'domcontentloaded',timeout:40000});
   requireTrue(response?.ok(),'homepage did not respond');
   await page.waitForFunction(()=>document.documentElement.dataset.hstuRefinements930==='ready',null,{timeout:18000});
   await page.evaluate(()=>window.setView('reports',{push:false}));
   await page.waitForTimeout(1000);
   requireTrue(await page.locator('#view-reports.active').count()===1,'Reports section did not open');
   const items=page.locator('#view-reports a[data-original-local-pdf][href*="pdf-reader.html"]');
   requireTrue(await items.count()>5,'Not enough report PDF reader links');
   const target=items.filter({hasText:/Open PDF/i}).first();
   documentLink=await (await target.count()?target:items.first()).getAttribute('href');
   requireTrue(documentLink.includes('pdf-reader.html?file='),'Report source not routed via reader');
   return await items.count()+' localized report links; first one '+documentLink;
  });
  await check(kind+': first tap opens branded nonblank preview reader',async()=>{
   requireTrue(documentLink,'No report link from previous check');
   const target=page.locator('#view-reports a[data-original-local-pdf][href*="pdf-reader.html"]').first();
   const [next]=await Promise.all([page.waitForEvent('popup',{timeout:16000}),target.click({timeout:16000})]);
   popup=next;
   await popup.waitForLoadState('domcontentloaded',{timeout:20000});
   requireTrue(popup.url().includes('/pdf-reader.html?file='),'Unexpected PDF destination '+popup.url());
   await popup.locator('#documentTitle').waitFor({state:'visible',timeout:10000});
   const state=await popup.evaluate(()=>{
    const cover=document.querySelector('#cover'),canvas=document.querySelector('#pageCanvas'),
          stage=document.querySelector('#stage'),status=document.querySelector('#status');
    return{heading:document.querySelector('h1')?.textContent,bodyColor:getComputedStyle(document.body).backgroundColor,
      cover:cover?.getAttribute('src'),coverShowing:!!cover&&!cover.hidden,canvasShowing:!!canvas&&!canvas.hidden,
      stageShowing:!!stage&&stage.offsetHeight>200,statusShowing:!!status&&!status.hidden};
   });
   requireTrue(state.stageShowing,'Reader stage hidden');
   requireTrue(state.coverShowing||state.canvasShowing,'Reader shows no cover or page after opening '+JSON.stringify(state));
   requireTrue(state.bodyColor!=='rgb(0, 0, 0)','Reader is black');
   await popup.screenshot({path:'/tmp/hstu-reader-'+kind+'-first.png'});
   return 'Branded reader visible on first tap with preview or page';
  });
  await check(kind+': PDF.js loads and renders full first page',async()=>{
   requireTrue(popup,'No reader popup');
   const readerErrors=[];
   popup.on('pageerror',e=>readerErrors.push('page: '+e.message));
   popup.on('console',m=>{if(m.type()==='error'||m.type()==='warning')readerErrors.push('console: '+m.text())});
   const isRendered=await popup.waitForFunction(()=>{
      const c=document.querySelector('#pageCanvas');
      return!!c && !c.hidden && c.width>100 && c.height>100 &&
        document.querySelector('#counter')?.textContent.includes(' of ');
   },null,{timeout:15000}).then(()=>true).catch(()=>false);
   if(!isRendered){
     const diag=await popup.evaluate(()=>({
       scriptLoaded:typeof window.pdfjsLib,
       pdfjsVersion:window.pdfjsLib?.version,
       worker:window.pdfjsLib?.GlobalWorkerOptions.workerSrc,
       status:document.querySelector('#statusText')?.textContent,
       counter:document.querySelector('#counter')?.textContent,
       cover:document.querySelector('#cover')?.src,
       coverVisible:!document.querySelector('#cover')?.hidden,
       canvasHidden:document.querySelector('#pageCanvas')?.hidden,
       activePDF:document.documentElement.dataset.hstuPdfFile,
       ready:document.documentElement.dataset.hstuPdfReady
     }));
     throw Error('Full PDF did not render: '+JSON.stringify({diag,readerErrors}));
   }
   const detail=await popup.evaluate(()=>({
     page:document.querySelector('#counter')?.textContent,
     canvas:[document.querySelector('#pageCanvas')?.width,document.querySelector('#pageCanvas')?.height],
     title:document.querySelector('#documentTitle')?.textContent,
     loadedPage:document.documentElement.dataset.hstuPdfRendered,
     statusDisplay:getComputedStyle(document.querySelector('#status')).display,
     previewDisplay:getComputedStyle(document.querySelector('#cover')).display,
     canvasDisplay:getComputedStyle(document.querySelector('#pageCanvas')).display
   }));
   requireTrue(detail.page.includes('Page 1 of '),'PDF did not expose page count');
   requireTrue(detail.loadedPage==='1'&&detail.statusDisplay==='none'&&
     detail.previewDisplay==='none'&&detail.canvasDisplay!=='none',
     'Reader still displays loading or preview AFTER PDF rendering: '+JSON.stringify(detail));
   await popup.screenshot({path:'/tmp/hstu-reader-'+kind+'-rendered.png'});
   return detail;
  });
  await check(kind+': next page and original PDF work',async()=>{
   requireTrue(popup,'No viewer');
   const count=await popup.locator('#counter').textContent();
   const total=Number(count?.split(' of ')[1]);
   requireTrue(total>1,'Report unexpectedly has only one page');
   await popup.locator('#next').click();
   await popup.waitForFunction(()=>document.querySelector('#counter')?.textContent.startsWith('Page 2 '),null,{timeout:20000});
   const href=await popup.locator('#original').getAttribute('href');
   requireTrue(/documents\/pdf-library\/.+\.pdf$/i.test(href||''),'Original document URL invalid '+href);
   const response=await fetch(href,{method:'HEAD',signal:AbortSignal.timeout(20000)});
   requireTrue(response.ok&&/application\/pdf/i.test(response.headers.get('content-type')||''),'Original document does not return PDF');
   return 'Page 2 renders; original '+href;
  });

  await check(kind+': switching July and March reports opens two DISTINCT correct PDFs',async()=>{
   const cases=[
    {title:'SI Report (July 2026)',
     local:'documents/pdf-library/8a054d-089d438912ef4d23a90c6a211e3c9f05-99b13548.pdf',
     id:'089d438912ef4d23a90c6a211e3c9f05'},
    {title:'SI Quarterly Report (March 2026)',
     local:'documents/pdf-library/8a054d-1479a1a62dc646c79c0da8c220455801-d583c09d.pdf',
     id:'1479a1a62dc646c79c0da8c220455801'}
   ];
   const observations=[];
   for(const item of cases){
    await page.evaluate(()=>window.setView('reports',{push:false}));
    await page.waitForTimeout(160);
    const cards=page.locator('#view-reports article.hstu-refine-card');
    const card=cards.filter({has:page.getByRole('heading',{name:item.title,exact:true})});
    requireTrue(await card.count()===1,'Expected one card for '+item.title+', received '+await card.count());
    const link=card.locator('a[href*="pdf-reader.html"]').first();
    requireTrue(await link.count()===1,'Reader link missing on '+item.title);
    const raw=await link.getAttribute('href');
    requireTrue(decodeURIComponent(raw).includes(item.local),
      'Card for '+item.title+' points to WRONG PDF '+raw);
    const pop=page.waitForEvent('popup',{timeout:18000});
    await link.click({timeout:18000});
    const opened=await pop;
    try{
     await opened.waitForLoadState('domcontentloaded',{timeout:20000});
     const url=new URL(opened.url());
     requireTrue(url.pathname.endsWith('/pdf-reader.html'),'Wrong destination '+url.href);
     requireTrue(url.searchParams.get('file')===item.local,
       'Clicked '+item.title+' but opened '+url.searchParams.get('file'));
     requireTrue(url.searchParams.get('title')===item.title,
       'Displayed title URL disagrees with clicked title: '+url.searchParams.get('title'));
     await opened.waitForFunction(()=>
       document.documentElement.dataset.hstuPdfReady==='1' &&
       document.querySelector('#pageCanvas')?.width>50 &&
       !document.querySelector('#pageCanvas')?.hidden,
       null,{timeout:15000});
     const details=await opened.evaluate(()=>{
      const p=document.documentElement.dataset.hstuPdfFile;
      const cover=document.querySelector('#cover')?.src||'';
      const orig=document.querySelector('#original')?.href||'';
      const canvas=document.querySelector('#pageCanvas');
      // Hash the page pixels to guarantee distinct visual content, not merely distinct paths.
      const raw=canvas.toDataURL('image/png');
      let hash=2166136261;
      for(let i=0;i<raw.length;i++) hash=Math.imul(hash^raw.charCodeAt(i),16777619)>>>0;
      return {file:p,title:document.querySelector('h1')?.textContent,
       cover,original:orig,renderHash:hash,renderLength:raw.length,
       pages:document.querySelector('#counter')?.textContent};
     });
     requireTrue(details.file===item.local,'Reader silently reused previous PDF: '+JSON.stringify(details));
     requireTrue(details.title===item.title,'Title mismatched on '+JSON.stringify(details));
     requireTrue(details.original.endsWith(item.local),'Original PDF mismatched '+details.original);
     requireTrue(details.cover.includes(item.id),'Wrong thumbnail shown for '+item.title+': '+details.cover);
     observations.push(details);
     await opened.screenshot({path:'/tmp/hstu-reader-'+kind+'-'+(observations.length===1?'july':'march')+'.png'});
    }finally{await opened.close();}
   }
   requireTrue(observations.length===2,'Did not complete both reports');
   requireTrue(observations[0].file!==observations[1].file,'Both reports use the SAME file');
   requireTrue(observations[0].renderHash!==observations[1].renderHash,
     'Both reports rendered identical pages despite different titles');
   return {verified:[
    {title:observations[0].title,source:observations[0].file,pageHash:observations[0].renderHash},
    {title:observations[1].title,source:observations[1].file,pageHash:observations[1].renderHash}
   ],distinctRenderedPages:true};
  });
  await check(kind+': original site and reader retain mobile-safe UI',async()=>{
   const a=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
   const b=await popup.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
   requireTrue(a.document<=a.viewport+4,'Home horizontal overflow '+JSON.stringify(a));
   requireTrue(b.document<=b.viewport+4,'Reader horizontal overflow '+JSON.stringify(b));
   requireTrue(errors.length===0,'Site JavaScript errors '+JSON.stringify(errors));
   return 'No site-wide overflow or JS errors';
  });
  await ctx.close();
 }
}finally{
 await browser.close();
 report.result=report.issues.length?'FAIL':'PASS';
 report.checksPassed=report.checks.filter(x=>x.result==='PASS').length;
 report.checksFailed=report.issues.length;
 mkdirSync('docs',{recursive:true});
 writeFileSync('docs/hstu-pdf-reader-acceptance.json',JSON.stringify(report,null,2)+'\n');
 console.log('HSTU LIVE READER ACCEPTANCE',report.result,report.checksPassed,report.checksFailed);
 if(report.issues.length)process.exitCode=1;
}
