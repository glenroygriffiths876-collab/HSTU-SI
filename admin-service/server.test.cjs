'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {makeApp,readSources,cleanUrl,validateEdit}=require('./server.cjs');
test('validate edits and reject unsafe links, HTML and invalid objectives',()=>{
 assert.equal(cleanUrl('https://example.org/a.pdf'),'https://example.org/a.pdf');
 for(const v of ['javascript:alert(1)','http://example.org','https://a:b@example.org','https://example.org/"'])assert.throws(()=>cleanUrl(v));
 assert.throws(()=>validateEdit({fields:{title:'<img src=x>'}},null,'manuals'));
 assert.throws(()=>validateEdit({fields:{title:'Study'},objectiveNumbers:[16]},null,'research'));
 assert.deepEqual(validateEdit({fields:{title:'Study'},objectiveNumbers:[1,1,15]},null,'research'),{title:'Study',objectiveNumbers:[1,15]});
});
test('private staging integration: identity/CSRF/role checks, draft conflict, upload, review and no public writes',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'hstu-test-')),source=path.join(root,'source'),state=path.join(root,'state');fs.mkdirSync(source);fs.mkdirSync(state,{mode:0o700});
 const files={'index.html':'const MANUALS=[{"id":"m","title":"Manual","url":"https://example.org/m.pdf"}];\n','shanille-refinements.js':'const DATA=[{"title":"Report","url":"https://example.org/report.pdf"}];\n','research-catalogue.json':JSON.stringify({records:[{title:'Study',url:'https://example.org/study',objectiveNumbers:[1]}]}),'repository-content.json':JSON.stringify({reports:{national:[{title:'Report',url:'https://example.org/report.pdf'}]}})};
 for(const [f,v] of Object.entries(files))fs.writeFileSync(path.join(source,f),v);assert.equal(readSources(source).groups.length,4);
 const editor='editor@moh.gov.jm', reviewer='reviewer@moh.gov.jm', origin='https://test.moh.gov.jm';
 const server=makeApp({source,state,origin,users:{[editor]:'editor',[reviewer]:'reviewer'},secret:crypto.randomBytes(48).toString('hex')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});});
 function req(route,{user=editor,token,body,type='application/json',method='GET',requestOrigin=origin}={}){
 return new Promise((resolve,reject)=>{const headers={};if(user)headers['X-HSTU-Authenticated-User']=user;if(token)headers['X-HSTU-CSRF']=token;if(method==='POST'){headers.Origin=requestOrigin;headers['Content-Type']=type;}
 const r=http.request({host:'127.0.0.1',port:server.address().port,path:'/admin/'+route,method,headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{let data;try{data=JSON.parse(Buffer.concat(chunks).toString());}catch{data=Buffer.concat(chunks).toString();}resolve({status:res.statusCode,data});});});r.on('error',reject);r.end(body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body));});}
 assert.equal((await req('api/workspace',{user:null})).status,403);
 const ws=(await req('api/workspace')).data,token=ws.csrf;assert.equal(ws.revision,0);
 const draft={revision:0,group:'research',action:'update',recordId:'research:0',fields:{title:'Updated study'},reason:'Correct title'};
 assert.equal((await req('api/draft',{method:'POST',body:draft})).status,403);
 assert.equal((await req('api/draft',{method:'POST',token,body:draft,requestOrigin:'https://other.example'})).status,403);
 assert.equal((await req('api/draft',{method:'POST',token,body:draft})).status,200);
 assert.equal((await req('api/draft',{method:'POST',token,body:draft})).status,409);
 assert.equal((await req('api/upload',{method:'POST',token,type:'application/pdf',body:Buffer.from('not pdf')})).status,400);
 const pdf=Buffer.from('%PDF-1.4\n%%EOF\n');
 const upload=await req('api/upload',{method:'POST',token,type:'application/pdf',body:pdf});assert.equal(upload.status,201);
 const after=(await req('api/workspace')).data;assert.equal(after.revision,2);
 const change={revision:2,group:'manuals',action:'update',recordId:'manuals:0',fields:{},attachment:upload.data.id,reason:'Replace approved manual'};
 assert.equal((await req('api/draft',{method:'POST',token,body:change})).status,200);
 assert.equal((await req('api/review')).status,403);
 const exportResult=await req('api/review',{user:reviewer});assert.equal(exportResult.status,200);assert.equal(exportResult.data.operations.length,2);assert.equal(exportResult.data.attachments[0].base64,pdf.toString('base64'));
 const last=(await req('api/workspace')).data;
 assert.equal((await req('api/discard',{method:'POST',token,body:{id:last.drafts[0].id,revision:last.revision}})).status,200);
 for(const [f,v] of Object.entries(files))assert.equal(fs.readFileSync(path.join(source,f),'utf8'),v);
});
