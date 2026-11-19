'use strict';
// HSTU staging-only administration service. No writes to the public checkout.
const http=require('node:http'), fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
const limit=25*1024*1024;
function readConfig(env=process.env){
 const source=fs.realpathSync(env.HSTU_SOURCE||'');
 const state=fs.realpathSync(env.HSTU_STATE||'');
 if(!env.HSTU_SOURCE||!env.HSTU_STATE||state===source||state.startsWith(source+path.sep)||source.startsWith(state+path.sep))throw Error('Use separate existing source and private state directories');
 const origin=new URL(env.HSTU_ORIGIN||'');
 if(origin.protocol!=='https:'||origin.href!==origin.origin+'/')throw Error('An HTTPS origin is required');
 const users=JSON.parse(env.HSTU_USERS||'{}');
 if(!Object.keys(users).length||Object.entries(users).some(([k,v])=>k!==k.toLowerCase()||!k.endsWith('@moh.gov.jm')||!['editor','reviewer'].includes(v)))throw Error('Configure named Ministry identities and roles');
 const secret=env.HSTU_CSRF_SECRET||'';
 if(secret.length<48)throw Error('Generate a private random CSRF secret of at least 48 characters');
 const port=Number(env.PORT||8787);
 if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
 return {source,state,origin:origin.origin,users,secret,port};
}
const sourceFiles=['research-catalogue.json','repository-content.json','index.html','shanille-refinements.js'];
function readSources(root){
 const raw=Object.fromEntries(sourceFiles.map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]));
 const research=JSON.parse(raw[sourceFiles[0]]), repository=JSON.parse(raw[sourceFiles[1]]);
 const manuals=JSON.parse(raw['index.html'].match(/^const MANUALS=(\[.*\]);\s*$/m)?.[1]||'null');
 const legacy=JSON.parse(raw['shanille-refinements.js'].match(/const DATA=(\[.*?\]);/s)?.[1]||'null');
 if(!Array.isArray(research.records)||!Array.isArray(manuals)||!Array.isArray(legacy))throw Error('Source format changed: stop and review adapters');
 const groups=[];
 function add(key,label,rows){groups.push({key,label,rows:rows.map((record,i)=>({id:key+':'+i,record}))});}
 add('research','Research catalogue',research.records);add('manuals','Clinical manuals',manuals);add('legacy','Additional website records',legacy);
 function walk(v,p=[]){if(Array.isArray(v)){if(v.length&&v.every(x=>x&&typeof x==='object'&&!Array.isArray(x)&&typeof x.title==='string'))add('content/'+p.join('/'),p.join(' / '),v);}
 else if(v&&typeof v==='object')for(const [k,w] of Object.entries(v))walk(w,[...p,k]);}
 walk(repository);
 const fingerprint=hash(JSON.stringify(sourceFiles.map(f=>hash(raw[f]))));
 return {groups,fingerprint,research,repository,raw};
}
function atomic(file,obj){const temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(obj,null,2),{flag:'wx',mode:0o600});fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}}
const cleanText=(v,n=4000)=>{if(typeof v!=='string'||v.length>n||/[<>\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(v))throw fail(400,'Invalid text field');return v.trim();};
function cleanUrl(v){v=cleanText(v,2048);if(!v)return '';let u;try{u=new URL(v);}catch{throw fail(400,'Enter a complete HTTPS link');}if(u.protocol!=='https:'||u.username||u.password||/["'<>\\]/.test(v))throw fail(400,'Only safe HTTPS links are allowed');return u.href;}
const fields=['title','url','authors','year','group','category','citation','subtitle','source','note','type','geography'];
function validateEdit(body,base,group){
 const patch={}; const allowed=new Set(fields);
 if(!body.fields||typeof body.fields!=='object'||Array.isArray(body.fields))throw fail(400,'Missing fields');
 for(const [k,v] of Object.entries(body.fields)){if(!allowed.has(k))throw fail(400,'Unsupported field');patch[k]=k==='url'?cleanUrl(v):cleanText(v,k==='title'?500:4000);}
 if(!String(patch.title??base?.title??'').trim())throw fail(400,'Title is required');
 if(group==='research'){
   const nums=body.objectiveNumbers;
   if(nums!==undefined){if(!Array.isArray(nums)||!nums.length||nums.some(n=>!Number.isInteger(n)||n<1||n>15))throw fail(400,'Choose objective numbers 1–15');patch.objectiveNumbers=[...new Set(nums)];}
   if(!base&&!patch.objectiveNumbers?.length)throw fail(400,'Research needs at least one strategic objective');
 }
 return patch;
}
function readBody(req,max){return new Promise((resolve,reject)=>{let parts=[],n=0,tooLarge=false;req.on('data',b=>{n+=b.length;if(n>max){tooLarge=true;parts=[];}else if(!tooLarge)parts.push(b);});req.on('end',()=>tooLarge?reject(fail(413,'Upload too large')):resolve(Buffer.concat(parts)));req.on('error',reject);});}
function jsonBody(b){try{const v=JSON.parse(b.toString('utf8'));if(!v||typeof v!=='object'||Array.isArray(v))throw Error();return v;}catch{throw fail(400,'Invalid JSON request');}}
function makeApp(cfg){
 const src=readSources(cfg.source), stateFile=path.join(cfg.state,'workspace.json'), uploadDir=path.join(cfg.state,'attachments');
 fs.mkdirSync(uploadDir,{recursive:true,mode:0o700});
 const blank=()=>({fingerprint:src.fingerprint,revision:0,drafts:[],uploads:{},audit:[]});
 function get(){const s=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):blank();if(s.fingerprint!==src.fingerprint)throw fail(409,'Source snapshot changed. Ask IT to rebase the workspace.');return s;}
 function save(s,identity,action,detail){s.revision++;s.audit.push({at:new Date().toISOString(),identity,action,detail,revision:s.revision});atomic(stateFile,s);}
 function csrf(id){return crypto.createHmac('sha256',cfg.secret).update(id).digest('hex');}
 function identity(req){const id=String(req.headers['x-hstu-authenticated-user']||'').trim().toLowerCase();const role=Object.hasOwn(cfg.users,id)?cfg.users[id]:null;if(!role)throw fail(403,'Ministry authentication required');return {id,role};}
 function tokenOK(req,id){const got=String(req.headers['x-hstu-csrf']||'');return got.length===64&&crypto.timingSafeEqual(Buffer.from(csrf(id)),Buffer.from(got,'ascii'));}
 function send(res,status,type,data,more={}){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",...more});res.end(data);}
 const json=(r,status,v)=>send(r,status,'application/json; charset=utf-8',JSON.stringify(v));
 function requireRev(b,s){if(!Number.isInteger(b.revision)||b.revision!==s.revision)throw fail(409,'Workspace changed. Reload before saving.');}
 function buildReview(s){
   const referenced=new Set(s.drafts.map(d=>d.attachment).filter(Boolean));
   return {schema:1,status:'REVIEW ONLY — not deployed',sourceFingerprint:s.fingerprint,sourceHashes:Object.fromEntries(sourceFiles.map(f=>[f,hash(src.raw[f])])),revision:s.revision,operations:s.drafts,attachments:[...referenced].map(key=>({id:key,...s.uploads[key],base64:fs.readFileSync(path.join(uploadDir,key+'.pdf')).toString('base64')})),audit:s.audit};
 }
 return http.createServer(async(req,res)=>{try{
   if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))throw fail(403,'Private service');
   const actor=identity(req), u=new URL(req.url,cfg.origin);
   if(u.origin!==cfg.origin)throw fail(400,'Invalid request target');
   const p=u.pathname;
   if(req.method==='GET'){
    if(p==='/admin'||p==='/admin/')return send(res,200,'text/html; charset=utf-8',fs.readFileSync(path.join(__dirname,'portal.html')));
    if(p==='/admin/portal.js')return send(res,200,'text/javascript; charset=utf-8',fs.readFileSync(path.join(__dirname,'portal.js')));
    if(p==='/admin/portal.css')return send(res,200,'text/css; charset=utf-8',fs.readFileSync(path.join(__dirname,'portal.css')));
    if(p==='/admin/api/workspace'){const s=get();return json(res,200,{actor,csrf:csrf(actor.id),groups:src.groups,...s});}
    if(p==='/admin/api/review'){if(actor.role!=='reviewer')throw fail(403,'Reviewer role required');return send(res,200,'application/json; charset=utf-8',JSON.stringify(buildReview(get()),null,2),{'Content-Disposition':'attachment; filename="hstu-review-bundle.json"'});}
    throw fail(404,'Not found');
   }
   if(req.method!=='POST')throw fail(405,'Method not allowed');
   if(req.headers.origin!==cfg.origin||!tokenOK(req,actor.id))throw fail(403,'Request verification failed');
   if(p==='/admin/api/upload'){
    if(req.headers['content-type']!=='application/pdf')throw fail(415,'PDF only');
    const b=await readBody(req,limit);
    if(b.length<10||b.subarray(0,5).toString()!=='%PDF-'||!b.subarray(Math.max(0,b.length-2048)).includes(Buffer.from('%%EOF')))throw fail(400,'File is not a recognizable PDF');
    const s=get();const key=crypto.randomUUID();
    const total=Object.values(s.uploads).reduce((n,f)=>n+f.bytes,0);
    if(total+b.length>100*1024*1024)throw fail(413,'Private workspace quota reached. Ask IT to archive it.');
    fs.writeFileSync(path.join(uploadDir,key+'.pdf'),b,{flag:'wx',mode:0o600});
    s.uploads[key]={sha256:hash(b),bytes:b.length,owner:actor.id,at:new Date().toISOString(),state:'unscanned'};
    save(s,actor.id,'upload',key);return json(res,201,{id:key,revision:s.revision});
   }
   if(p==='/admin/api/draft'){
    if(req.headers['content-type']!=='application/json')throw fail(415,'JSON required');
    const b=jsonBody(await readBody(req,128*1024)),s=get();requireRev(b,s);
    const g=src.groups.find(x=>x.key===b.group);if(!g)throw fail(400,'Unknown collection');
    const prior=s.drafts.find(d=>d.id===b.draftId);
    if(b.draftId&&!prior)throw fail(404,'Draft no longer exists');
    if(prior&&prior.group!==g.key)throw fail(400,'Draft collection cannot change');
    if(!['add','update','remove'].includes(b.action))throw fail(400,'Invalid action');
    const original=g.rows.find(row=>row.id===b.recordId);
    if(b.action!=='add'&&!original)throw fail(400,'Select an existing record');
    if(b.action==='add'&&b.recordId)throw fail(400,'New records cannot replace existing IDs');
    if(prior&&(prior.recordId!==(original?.id||null)||prior.action!==b.action))throw fail(400,'Discard the draft before changing its operation');
    if(original&&s.drafts.some(d=>d.recordId===original.id&&d.id!==b.draftId))throw fail(409,'This record already has a pending change');
    const attachment=b.attachment||null;
    if(attachment&&(!Object.hasOwn(s.uploads,attachment)||(s.uploads[attachment].owner!==actor.id&&actor.role!=='reviewer'&&prior?.attachment!==attachment)))throw fail(400,'Unknown or inaccessible attachment');
    if(b.action==='remove'&&attachment)throw fail(400,'A removal cannot have an attachment');
    const patch=b.action==='remove'?{}:validateEdit(b,original?.record,g.key);
    if(b.action==='add'&&!attachment&&!patch.url)throw fail(400,'Provide a link or PDF attachment');
    const draft={id:prior?.id||crypto.randomUUID(),group:g.key,action:b.action,recordId:original?.id||null,original:original?.record||null,patch,attachment,reason:cleanText(b.reason||'',1000),updatedBy:actor.id,updatedAt:new Date().toISOString()};
    if(!draft.reason)throw fail(400,'A change reason is required');
    if(prior)s.drafts=s.drafts.map(d=>d.id===prior.id?draft:draft===d?prior:d);else s.drafts.push(draft);
    save(s,actor.id,'save-draft',draft.id);return json(res,200,{revision:s.revision,id:draft.id});
   }
   if(p==='/admin/api/discard'){
    const b=jsonBody(await readBody(req,4096)),s=get();requireRev(b,s);
    if(!s.drafts.some(d=>d.id===b.id))throw fail(404,'Draft not found');
    s.drafts=s.drafts.filter(d=>d.id!==b.id);save(s,actor.id,'discard-draft',b.id);return json(res,200,{revision:s.revision});
   }
   throw fail(404,'Not found');
 }catch(e){if(!e.status)console.error(e.message);if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:'Service error. Contact IT.'});else res.destroy();}});
}
if(require.main===module){const cfg=readConfig();const server=makeApp(cfg);server.requestTimeout=120000;server.headersTimeout=15000;server.listen(cfg.port,'127.0.0.1',()=>console.log('HSTU staging admin listening on loopback only'));}
module.exports={readConfig,readSources,validateEdit,makeApp,cleanUrl};
