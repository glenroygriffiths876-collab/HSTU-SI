#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import re

p=Path("index.html")
soup=BeautifulSoup(p.read_text(encoding="utf-8"),"html.parser")

# --- Refresh visible Gia copy so it accurately reflects the current HSTU hub ---
head=soup.select_one(".clinical-head-copy")
if head:
    sm=head.find("small")
    h2=head.find("h2")
    pp=head.find("p")
    if sm: sm.string="GIA · HUB SEARCH"
    if h2: h2.string="Hi, I’m Gia 👋🏾"
    if pp: pp.string="Search the entire HSTU Resource Centre — research, reports, capacity building, data resources, services, gallery items and learning links. Spelling does not have to be exact."

inp=soup.select_one(".clinical-search input")
if inp:
    inp["placeholder"]="Try “syphlis”, “DHIS”, “adolesent HIV”, “Hanov” or any partial title…"
    inp["autocomplete"]="off"
    inp["spellcheck"]="true"
    inp["aria-label"]="Search the entire HSTU Resource Centre"

welcome=soup.select_one(".guide-welcome")
if welcome:
    h=welcome.find(["h2","h3"])
    pp=welcome.find("p")
    if h: h.string="Hi, I’m Gia 👋🏾"
    if pp: pp.string="I can find anything in the HSTU Resource Centre. Type a topic, title, author, report, manual, service, parish, programme or research area — even if it is misspelled or only partly typed."

foot=soup.select_one(".clinical-foot")
if foot:
    foot.clear()
    b=soup.new_tag("b"); b.string="Search tip: "
    foot.append(b)
    foot.append("You can type naturally. Gia searches the full HSTU hub and recognises close spellings, partial words, abbreviations and related terms.")

greet=soup.select_one(".clinical-greeting p")
if greet:
    greet.string="Hi, I’m Gia 👋🏾 I can find anything across the HSTU Resource Centre — even with a typo or a partly typed word."

# Refresh shortcuts without changing their underlying button count.
shortcuts=soup.select(".clinical-shortcuts button")
shortcut_labels=[
    ("Capacity Building","capacity building manuals"),
    ("HIV","HIV"),
    ("STI","sexually transmitted infection"),
    ("PrEP","PrEP"),
    ("TB","tuberculosis"),
    ("Research","research"),
    ("Reports","reports"),
    ("Data & Audit","DHIS2 TSIS2 data audit"),
    ("Find Services","clinics services parishes")
]
for i,btn in enumerate(shortcuts):
    if i < len(shortcut_labels):
        label,q=shortcut_labels[i]
        btn.string=label
        btn["data-gia-query"]=q
    else:
        # retain extra specialised actions such as arcade buttons
        pass

# Remove earlier universal override if this workflow is rerun.
old=soup.find(id="gia-universal-hub-search-v2")
if old: old.decompose()
oldstyle=soup.find(id="gia-universal-hub-search-v2-styles")
if oldstyle: oldstyle.decompose()

style=soup.new_tag("style",id="gia-universal-hub-search-v2-styles")
style.string=r"""
.gia-hub-summary{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin:0 0 12px;padding:12px 13px;border:1px solid #dce9e0;border-radius:15px;background:linear-gradient(135deg,#f2faf5,#fff)}
.gia-hub-summary b{display:block;font-size:13px;color:#173d2a}.gia-hub-summary span{display:block;margin-top:2px;font-size:10.5px;line-height:1.4;color:#69786f}
.gia-hub-result{background:#fff;border:1px solid #dfe9e2;border-radius:17px;padding:14px;margin:0 0 10px;box-shadow:0 7px 20px rgba(7,52,29,.055)}
.gia-hub-result-top{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 7px}.gia-hub-badge{display:inline-flex;border-radius:999px;padding:4px 8px;background:#eaf6ed;color:#0a6e3b;font-size:9px;font-weight:950;letter-spacing:.045em;text-transform:uppercase}
.gia-hub-badge.secondary{background:#f0f3f1;color:#607068}.gia-hub-result h3{margin:0 0 6px;font-size:15px;line-height:1.28;color:#13281b}
.gia-hub-result p{margin:0 0 10px;font-size:11.5px;line-height:1.5;color:#627268;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.gia-hub-actions{display:flex;gap:7px;flex-wrap:wrap}.gia-hub-actions button,.gia-hub-actions a{appearance:none;border:0;border-radius:11px;padding:9px 11px;background:#0b713d;color:#fff;font:850 10.5px/1.2 inherit;text-decoration:none;cursor:pointer}
.gia-hub-actions .subtle{background:#edf5f0;color:#155b37}.gia-hub-empty{background:#fff;border:1px solid #e1e9e4;border-radius:17px;padding:18px}.gia-hub-empty h3{margin:0 0 6px;font-size:16px}.gia-hub-empty p{margin:0;font-size:12px;line-height:1.5;color:#657168}
.gia-hub-hint{margin-top:8px;font-size:10px;color:#7a887f}.gia-hub-flash{outline:4px solid rgba(246,186,22,.8)!important;outline-offset:4px!important}
@media(max-width:520px){.gia-hub-result{padding:13px}.gia-hub-actions{display:grid;grid-template-columns:1fr}.gia-hub-actions button,.gia-hub-actions a{text-align:center;width:100%}}
"""
soup.head.append(style)

script=soup.new_tag("script",id="gia-universal-hub-search-v2")
script.string=r"""
(()=>{
'use strict';

const state={records:[],ready:false,loading:null,lastQuery:''};
const VIEW_NAMES={
 home:'Home',research:'Research',capacity:'Capacity Building',reports:'Reports',
 'data-audit':'Data Audit & Utilization',gallery:'Gallery',resources:'Resources',
 services:'Find Services',about:'About'
};
const SECTION_TERMS={
 home:'home repository programme overview about',
 research:'research study studies strategic objectives jamaica caribbean literature paper article publication',
 capacity:'capacity building manual manuals training technical learning guide guidelines clinical pharmacology',
 reports:'reports national report special report surveys studies monitoring annual quarterly',
 'data-audit':'data audit utilization dhis dhis2 tsis tsis2 data quality database user guide sop',
 gallery:'gallery images photos campaign media',
 resources:'resources learning links presentations posters training external links',
 services:'services clinic clinics treatment site health centre health center prep facility facilities parish directions map'
};

const aliasMap={
 'hiv':'human immunodeficiency virus',
 'aids':'acquired immunodeficiency syndrome',
 'sti':'sexually transmitted infection infections',
 'std':'sexually transmitted infection infections',
 'tb':'tuberculosis',
 'prep':'pre exposure prophylaxis',
 'pep':'post exposure prophylaxis',
 'art':'antiretroviral therapy treatment',
 'arv':'antiretroviral',
 'dhis':'dhis2 data',
 'tsis':'tsis2 treatment site information system',
 'clinic':'clinics service services facility site',
 'centre':'center centre clinic service',
 'center':'center centre clinic service',
 'manual':'manual guide guideline capacity building',
 'report':'report reports monitoring strategic information',
 'research':'research study studies publication literature',
 'syph':'syphilis',
 'gon':'gonorrhea gonorrhoea',
 'adoles':'adolescent adolescents youth',
 'pmtct':'prevention mother child transmission',
 'emtct':'elimination mother child transmission',
 'kp':'key populations',
 'msm':'men who have sex with men key population',
 'fsw':'female sex workers key population',
 'vl':'viral load',
 'oi':'opportunistic infection infections'
};

function norm(v){
 return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
   .replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function words(v){return norm(v).split(' ').filter(Boolean);}
function expandQuery(q){
 const raw=words(q), out=[];
 for(const t of raw){out.push(t); if(aliasMap[t])out.push(...words(aliasMap[t]));}
 return [...new Set(out)];
}
function damerau(a,b){
 a=norm(a);b=norm(b);
 if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;
 const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
 for(let i=0;i<=a.length;i++)d[i][0]=i;
 for(let j=0;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
  const cost=a[i-1]===b[j-1]?0:1;
  d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
 }
 return d[a.length][b.length];
}
function tri(s){
 s='  '+norm(s)+'  ';const x=[];for(let i=0;i<s.length-2;i++)x.push(s.slice(i,i+3));return x;
}
function trigram(a,b){
 const A=tri(a),B=tri(b);if(!A.length||!B.length)return 0;
 const bag=new Map();for(const x of A)bag.set(x,(bag.get(x)||0)+1);
 let hit=0;for(const x of B){const n=bag.get(x)||0;if(n){hit++;bag.set(x,n-1);}}
 return 2*hit/(A.length+B.length);
}
function tokenScore(q,t){
 if(!q||!t)return 0;
 if(q===t)return 110;
 if(q.length>=2&&t.startsWith(q))return 94-Math.min(18,t.length-q.length);
 if(t.length>=3&&q.startsWith(t))return 82-Math.min(18,q.length-t.length);
 if(q.length>=3&&t.includes(q))return 78;
 if(t.length>=3&&q.includes(t))return 72;
 const min=Math.min(q.length,t.length);
 if(min>=4){
   const d=damerau(q,t);
   if(d===1)return 76;
   if(d===2&&min>=6)return 64;
   if(d===3&&min>=9)return 50;
 }
 const tg=trigram(q,t);
 if(min>=4&&tg>=.64)return 58;
 if(min>=5&&tg>=.48)return 44;
 return 0;
}
function fieldScore(qTokens,text,weight){
 const tw=words(text);if(!tw.length)return 0;
 let sum=0,matched=0;
 for(const q of qTokens){
   let best=0;
   for(const t of tw){const sc=tokenScore(q,t);if(sc>best)best=sc;if(best>=110)break;}
   if(best>=40){matched++;sum+=best;}
 }
 if(!matched)return 0;
 const coverage=matched/Math.max(1,qTokens.length);
 return sum*weight*coverage;
}
function scoreRecord(r,q){
 const nq=norm(q);if(!nq)return 0;
 const qt=expandQuery(q);
 let score=0;
 const nt=norm(r.title);
 if(nt===nq)score+=900;
 else if(nt.includes(nq))score+=500;
 else if(nq.length>=3&&nt.startsWith(nq))score+=420;
 score+=fieldScore(qt,r.title,2.8);
 score+=fieldScore(qt,r.keywords,1.55);
 score+=fieldScore(qt,r.description,1.15);
 score+=fieldScore(qt,(r.category||'')+' '+(r.section||''),1.35);
 // Require at least one meaningful match to the unexpanded user tokens.
 const original=words(q);
 let hard=0;
 for(const q0 of original){
   const corpus=words([r.title,r.keywords,r.description,r.category,r.section].join(' '));
   let best=0;for(const t of corpus)best=Math.max(best,tokenScore(q0,t));
   if(best>=40)hard++;
 }
 if(original.length&&hard===0)return 0;
 if(original.length>1&&hard/original.length<.45)score*=.45;
 return score;
}
function viewFromElement(el){
 const view=el.closest('[id^="view-"]');
 return view?view.id.replace(/^view-/,''):'home';
}
function viewForGroup(group){
 const g=norm(group);
 if(/audit|dhis|tsis|data system|data quality/.test(g))return'data-audit';
 if(/report|survey|monitoring/.test(g))return'reports';
 if(/capacity|training|manual|technical learning/.test(g))return'capacity';
 if(/presentation|poster|official hstu|resource/.test(g))return'resources';
 if(/research|study|literature|operational/.test(g))return'research';
 return'resources';
}
function add(rec,map){
 if(!rec||!rec.title)return;
 rec.title=String(rec.title).trim();
 if(rec.title.length<2)return;
 rec.view=rec.view||'home';
 rec.section=rec.section||VIEW_NAMES[rec.view]||rec.view;
 rec.keywords=[rec.keywords,SECTION_TERMS[rec.view]||'',rec.category||'',rec.section||''].filter(Boolean).join(' ');
 const key=[norm(rec.title),rec.href||'',rec.view].join('|');
 const prior=map.get(key);
 if(prior){
  prior.keywords+=' '+rec.keywords;
  if(!prior.description&&rec.description)prior.description=rec.description;
  return;
 }
 map.set(key,rec);
}
function domRecords(map){
 const selectors=[
  'article','.hstu-refine-card','.training-card-v2','.guide-card','.role-card',
  '.jmerg-card','.jmerg-mini','.service-card','.site-card','.clinic-card',
  '[data-parish]','[data-service]','.hstu-visual-card','.gallery-card'
 ];
 const els=[...new Set(document.querySelectorAll(selectors.join(',')))];
 let seq=0;
 for(const el of els){
   if(el.closest('.clinical-drawer'))continue;
   const view=viewFromElement(el);
   const heading=el.querySelector('h1,h2,h3,h4,b,strong,[class*="title"]');
   const link=el.querySelector('a[href]');
   const title=(heading?.textContent||link?.textContent||el.getAttribute('aria-label')||'').trim();
   if(!title)continue;
   const desc=(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,700);
   const id='gia-target-'+(++seq);if(!el.id)el.dataset.giaTarget=id;
   add({title,description:desc,href:link?.href||'',view,section:VIEW_NAMES[view],target:el.id||id,category:'Hub content'},map);
 }
 // Index meaningful links that are not already represented by a card.
 for(const a of document.querySelectorAll('main a[href],footer a[href]')){
   if(a.closest('.clinical-drawer'))continue;
   const title=(a.textContent||a.getAttribute('aria-label')||a.getAttribute('title')||'').replace(/\s+/g,' ').trim();
   if(title.length<3)continue;
   const view=viewFromElement(a);
   const ctx=(a.closest('section,article,div')?.textContent||'').replace(/\s+/g,' ').trim().slice(0,500);
   add({title,description:ctx,href:a.href,view,section:VIEW_NAMES[view],category:'Link'},map);
 }
 // Every top-level HSTU view is itself searchable.
 for(const section of document.querySelectorAll('[id^="view-"]')){
   const view=section.id.replace(/^view-/,'');
   const h=section.querySelector('h1,h2');
   const title=(h?.textContent||VIEW_NAMES[view]||view).trim();
   const body=(section.textContent||'').replace(/\s+/g,' ').trim().slice(0,1600);
   add({title,description:body,href:'',view,section:VIEW_NAMES[view],category:'Section',keywords:body},map);
 }
}
function flattenRepository(obj,map,path=[]){
 if(Array.isArray(obj)){obj.forEach(x=>flattenRepository(x,map,path));return;}
 if(!obj||typeof obj!=='object')return;
 if(obj.title){
   const group=obj.group||path[path.length-1]||obj.type||'Resource';
   add({
    title:obj.title,href:obj.url||'',view:viewForGroup(group),section:group,
    category:obj.type||group,description:[obj.year,obj.group,obj.type].filter(Boolean).join(' · '),
    keywords:[obj.group,obj.type,obj.year].filter(Boolean).join(' ')
   },map);
 }
 for(const [k,v] of Object.entries(obj))if(k!=='title'&&k!=='url')flattenRepository(v,map,[...path,k]);
}
async function buildIndex(){
 if(state.loading)return state.loading;
 state.loading=(async()=>{
  const map=new Map();
  domRecords(map);
  const [research,repository]=await Promise.all([
    fetch('research-catalogue.json',{cache:'no-store'}).then(r=>r.ok?r.json():{records:[]}).catch(()=>({records:[]})),
    fetch('repository-content.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({}))
  ]);
  for(const r of research.records||[]){
    add({
      title:r.title||r.citation||'Research study',href:r.url||'',view:'research',section:'Research',
      category:(r.categories||[]).join(' · ')||'Research Literature',
      description:[r.authors,r.year,r.geography,r.citation].filter(Boolean).join(' · '),
      keywords:[r.authors,r.year,r.geography,(r.categories||[]).join(' '),r.citation].filter(Boolean).join(' ')
    },map);
  }
  flattenRepository(repository,map);
  state.records=[...map.values()];
  state.ready=true;
  return state.records;
 })();
 return state.loading;
}
function resultsNode(){return document.querySelector('.clinical-results');}
function renderWelcome(){
 const node=resultsNode();if(!node)return;
 node.innerHTML='<div class="guide-welcome"><div class="mini-avatar">'+(document.querySelector('.clinical-head .clinical-avatar')?.innerHTML||'')+'</div><h3>Hi, I’m Gia 👋🏾</h3><p>I can find anything in the HSTU Resource Centre. Type a topic, title, author, report, manual, service, parish, programme or research area — even if it is misspelled or only partly typed.</p></div>';
}
function openResult(btn){
 const view=btn.dataset.view||'home',href=btn.dataset.href||'',target=btn.dataset.target||'';
 if(href&&href!=='#'&&!href.startsWith('javascript:')){
   if(href.startsWith(location.origin)||href.startsWith('#')){
     location.href=href;return;
   }
   location.assign(href);return;
 }
 if(typeof window.setView==='function')window.setView(view);
 document.querySelector('.clinical-drawer')?.classList.remove('open');
 document.body.style.overflow='';
 if(target){
   setTimeout(()=>{
     const el=document.getElementById(target)||document.querySelector('[data-gia-target="'+CSS.escape(target)+'"]');
     if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('gia-hub-flash');setTimeout(()=>el.classList.remove('gia-hub-flash'),1800);}
   },180);
 }else window.scrollTo({top:0,behavior:'smooth'});
}
async function search(q){
 q=String(q||'').trim();state.lastQuery=q;
 const node=resultsNode();if(!node)return;
 if(q.length<2){renderWelcome();return;}
 node.innerHTML='<div class="gia-hub-summary"><div><b>Searching the HSTU Resource Centre…</b><span>Checking research, reports, capacity building, data resources, services, gallery and learning resources.</span></div></div>';
 const records=await buildIndex();
 if(state.lastQuery!==q)return;
 const ranked=records.map(r=>({r,s:scoreRecord(r,q)})).filter(x=>x.s>=45).sort((a,b)=>b.s-a.s||a.r.title.localeCompare(b.r.title));
 const top=ranked.slice(0,30);
 if(!top.length){
   node.innerHTML='<div class="gia-hub-empty"><h3>No strong match yet</h3><p>Keep typing, try a shorter part of the word, or search by topic, author, report, service, parish or programme. Gia accepts misspellings and partial words.</p><div class="gia-hub-hint">Examples: “syph”, “adolesent HIV”, “DHIS”, “Hanov”, “viral lod”, “TB”.</div></div>';
   return;
 }
 const userNorm=norm(q);
 const exactish=top.some(x=>norm(x.r.title).includes(userNorm));
 const summary='<div class="gia-hub-summary"><div><b>'+top.length+(ranked.length>top.length?'+':'')+' matches for “'+esc(q)+'”</b><span>'+(exactish?'Results from across the HSTU Resource Centre.':'Gia used partial/fuzzy matching, so close spellings are included.')+'</span></div></div>';
 node.innerHTML=summary+top.map(({r,s})=>{
   const desc=esc((r.description||'').replace(/\s+/g,' ').slice(0,360));
   const openLabel=r.href?'Open resource':'Go to '+esc(r.section||VIEW_NAMES[r.view]||'section');
   return '<article class="gia-hub-result"><div class="gia-hub-result-top"><span class="gia-hub-badge">'+esc(r.category||'Resource')+'</span><span class="gia-hub-badge secondary">'+esc(r.section||VIEW_NAMES[r.view]||'HSTU')+'</span></div><h3>'+esc(r.title)+'</h3>'+(desc?'<p>'+desc+'</p>':'')+'<div class="gia-hub-actions"><button type="button" data-gia-open="1" data-view="'+esc(r.view)+'" data-href="'+esc(r.href||'')+'" data-target="'+esc(r.target||'')+'">'+openLabel+'</button></div></article>';
 }).join('');
}
function inputNode(){return document.querySelector('.clinical-search input');}
let timer=null;
function runFromInput(){const i=inputNode();search(i?.value||'');}

document.addEventListener('DOMContentLoaded',()=>{
 // Prime the comprehensive index shortly after initial render.
 setTimeout(()=>buildIndex(),350);
 const i=inputNode();if(i){i.placeholder='Try “syphlis”, “DHIS”, “adolesent HIV”, “Hanov” or any partial title…';}
}, {once:true});

// Capture search before older Gia handlers can apply narrower matching.
document.addEventListener('submit',e=>{
 if(e.target.closest('.clinical-search')){e.preventDefault();e.stopImmediatePropagation();runFromInput();}
},true);
document.addEventListener('keydown',e=>{
 if(e.target.matches('.clinical-search input')&&e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();runFromInput();}
},true);
document.addEventListener('input',e=>{
 if(!e.target.matches('.clinical-search input'))return;
 e.stopImmediatePropagation();
 clearTimeout(timer);timer=setTimeout(()=>search(e.target.value),110);
},true);
document.addEventListener('click',e=>{
 const open=e.target.closest('[data-gia-open="1"]');
 if(open){e.preventDefault();e.stopImmediatePropagation();openResult(open);return;}
 const searchBtn=e.target.closest('.clinical-search button');
 if(searchBtn){e.preventDefault();e.stopImmediatePropagation();runFromInput();return;}
 const shortcut=e.target.closest('.clinical-shortcuts button[data-gia-query]');
 if(shortcut){
   e.preventDefault();e.stopImmediatePropagation();
   const i=inputNode();if(i){i.value=shortcut.dataset.giaQuery||shortcut.textContent.trim();search(i.value);}
 }
},true);

// Rebuild the DOM portion of the index when major hub content is dynamically added.
let rebuildTimer=null;
const mo=new MutationObserver(muts=>{
 if(!state.ready)return;
 if(muts.some(m=>m.addedNodes&&m.addedNodes.length)){
   clearTimeout(rebuildTimer);rebuildTimer=setTimeout(()=>{state.loading=null;state.ready=false;buildIndex();},1200);
 }
});
document.addEventListener('DOMContentLoaded',()=>mo.observe(document.querySelector('main')||document.body,{childList:true,subtree:true}),{once:true});
})();
"""
soup.body.append(script)

p.write_text(str(soup),encoding="utf-8")
print("Gia universal hub search v2 injected.")
