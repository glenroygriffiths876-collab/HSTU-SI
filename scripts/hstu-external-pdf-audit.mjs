import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync('pdf-library.json','utf8'));
const items=Object.entries(manifest.by_url).filter(([,v])=>!v.local);
const result={checkedUtc:new Date().toISOString(),records:[],exceptions:[]};
const deadline=(ms=18000)=>AbortSignal.timeout(ms);
for(const [src,item] of items){
  const data={source:src,status:item.status||'',result:'UNVERIFIED',finalUrl:'',http:null,type:'',detail:''};
  const trial=[];
  for(const method of ['HEAD','GET']){
    try{
      const u=new URL(src);
      let r=await fetch(u,{method,redirect:'follow',signal:deadline(),headers:method==='GET'?{'Range':'bytes=0-64'}:{}});
      data.http=r.status;data.finalUrl=r.url;data.type=r.headers.get('content-type')||'';
      const looksPDF=/application\/pdf|application\/octet-stream/i.test(data.type);
      if(r.ok && looksPDF){
        data.result='REACHABLE_PDF';data.detail='Content type verified';if(r.body)await r.body.cancel();break;
      }
      if(r.body)await r.body.cancel();
      trial.push(method+' '+r.status+' '+data.type);
    }catch(e){trial.push(method+' '+String(e).slice(0,130))}
  }
  if(data.result!=='REACHABLE_PDF'){
    data.result='REQUIRES_REVIEW';data.detail=trial.join(' | ');
    result.exceptions.push(data);
  }
  result.records.push(data);
  console.log('EXTERNAL_PDF',JSON.stringify(data));
}
fs.mkdirSync('docs',{recursive:true});
fs.writeFileSync('docs/hstu-external-pdf-audit.json',JSON.stringify(result,null,2)+'\n');
console.log('EXTERNAL_PDF_SUMMARY',result.records.length,'checked,',result.exceptions.length,'require review');
