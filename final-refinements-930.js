(()=>{
'use strict';
const THEMES=[
 [1,'Coinfection and Communicable Diseases'],
 [2,'Sexually Transmitted Infections'],
 [3,'Stigma and Discrimination'],
 [4,'Psychosocial Determinants and Effects of HIV/AIDS'],
 [5,'Antiretroviral Drug Resistance'],
 [6,'Antiretroviral Therapy Outcomes'],
 [7,'Prevention of Mother-to-Child Transmission'],
 [8,'Adolescent HIV/AIDS'],
 [9,'Pediatric HIV/AIDS'],
 [10,'Key and Vulnerable Populations'],
 [11,'Knowledge, Attitudes, Behaviors, and Practices'],
 [12,'Epidemiology of HIV in Jamaica'],
 [13,'The National HIV Response'],
 [14,'Tuberculosis Prevention and Control'],
 [15,'Risk Communication']
];
const tidy=s=>(s||'').replace(/\s+/g,' ').trim();
function navBtn(view){return document.querySelector('.nav-btn[data-view="'+view+'"]');}
function openView(view,target){
 const b=navBtn(view); if(b) b.click();
 setTimeout(()=>{const el=target&&document.getElementById(target); if(el) el.scrollIntoView({behavior:'smooth',block:'start'});},90);
}
function dropdown(view){
 const b=navBtn(view); if(!b) return null;
 const p=b.parentElement;
 return p?.querySelector('.hstu-nav-dropdown') || (b.nextElementSibling?.classList?.contains('hstu-nav-dropdown')?b.nextElementSibling:null);
}
function setDropdown(view,items){
 const d=dropdown(view); if(!d) return false;
 d.innerHTML='';
 items.forEach(it=>{
   const b=document.createElement('button');
   b.type='button'; b.textContent=it.label;
   b.dataset.view=view;
   if(it.target) b.dataset.target=it.target;
   if(it.gallery) b.dataset.galleryCategory=it.gallery;
   b.addEventListener('click',e=>{
     e.preventDefault(); e.stopPropagation();
     openView(view,it.target);
     if(it.gallery) setTimeout(()=>setGalleryFilter(it.gallery),120);
   });
   d.appendChild(b);
 });
 return true;
}
function fixHero(){
 const hero=document.querySelector('#view-home');
 if(!hero) return;
 [...hero.querySelectorAll('button,a')].forEach(el=>{
   const t=tidy(el.textContent);
   if(/^Explore research/i.test(t)){
     el.innerHTML='Explore Research <span aria-hidden="true">→</span>';
     el.dataset.view='research';
   }else if(/^Explore Capacity Building/i.test(t)){
     el.remove();
   }
 });
}
function fixPrimaryNav(){
 const buttons=[...document.querySelectorAll('.nav-btn[data-view]')];
 if(!buttons.length) return;
 let p=buttons[0].parentElement;
 while(p && !buttons.every(b=>p.contains(b))) p=p.parentElement;
 if(p){
   p.classList.add('hstu-primary-nav-scroll');
   if(!p.parentElement?.querySelector('.hstu-nav-swipe-hint')){
     const hint=document.createElement('div');
     hint.className='hstu-nav-swipe-hint';
     hint.textContent='Swipe tabs →';
     p.parentElement?.insertBefore(hint,p.nextSibling);
   }
 }
 setDropdown('home',[{label:'Overview',target:'repository-purpose'},{label:'15 Thematic Research Areas',target:'home-thematic-areas'},{label:'Quick Access',target:'home-quick-access'}]);
 setDropdown('research',[{label:'Latest Studies',target:'research-results'},{label:'Strategic Objectives 1–15',target:'research-filters'},{label:'Research Agenda Priorities',target:'research-agenda-priorities'}]);
 setDropdown('capacity',[{label:'Manuals',target:'capacity-manuals'},{label:'Training Materials',target:'capacity-training'}]);
 setDropdown('reports',[{label:'National Reports',target:'reports-national'},{label:'Special Reports',target:'reports-special'}]);
 setDropdown('data-audit',[{label:'Data Audit',target:'data-audit-reports'},{label:'DHIS2 / TSIS2 User Guides',target:'data-systems-guides'}]);
 setDropdown('gallery',[
   {label:'All',target:'gallery-images',gallery:'All'},
   {label:'HIV',target:'gallery-images',gallery:'HIV'},
   {label:'STI',target:'gallery-images',gallery:'STI'},
   {label:'TB',target:'gallery-images',gallery:'TB'},
   {label:'PrEP',target:'gallery-images',gallery:'PrEP'}
 ]);
 setDropdown('resources',[
   {label:'Presentations',target:'resources-presentations'},
   {label:'Posters',target:'resources-posters'},
   {label:'External Links',target:'resources-external'},
   {label:'Learning',target:'resources-learning'}
 ]);
 setDropdown('services',[{label:'Treatment and PrEP',target:'services-directory'},{label:'Health Centres',target:'services-directory'}]);
}
function buildThematicAreas(){
 const purpose=document.getElementById('repository-purpose');
 const home=document.getElementById('view-home');
 if(!home) return;
 let sec=document.getElementById('home-thematic-areas');
 if(sec) sec.remove();
 sec=document.createElement('section');
 sec.id='home-thematic-areas';
 sec.className='wrap hstu-thematic-areas-930';
 sec.innerHTML='<div class="hstu-section-kicker">Research navigation</div><div class="hstu-section-heading"><div><h2>15 Thematic Research Areas</h2><p>Select an area to open Research with the corresponding Strategic Objective applied.</p></div><span class="hstu-count-pill">15 areas</span></div><div class="hstu-theme-grid"></div>';
 const grid=sec.querySelector('.hstu-theme-grid');
 THEMES.forEach(([n,name])=>{
   const b=document.createElement('button');
   b.type='button'; b.className='hstu-theme-card';
   b.innerHTML='<span class="hstu-theme-number">'+String(n).padStart(2,'0')+'</span><span>'+name+'</span><span class="hstu-theme-arrow" aria-hidden="true">→</span>';
   b.addEventListener('click',()=>openObjective(n));
   grid.appendChild(b);
 });
 if(purpose) purpose.insertAdjacentElement('afterend',sec);
 else home.querySelector('.home-hero')?.insertAdjacentElement('afterend',sec);
}
function openObjective(n){
 openView('research','research-filters');
 setTimeout(()=>{
   const sel=document.getElementById('refineResearchObjective');
   if(sel){
     const opts=[...sel.options];
     const o=opts.find(x=>String(x.value)===String(n))||opts.find(x=>new RegExp('(^|\\D)'+n+'(\\D|$)').test(tidy(x.textContent)));
     if(o){sel.value=o.value; sel.dispatchEvent(new Event('change',{bubbles:true}));}
   }
   document.getElementById('research-filters')?.scrollIntoView({behavior:'smooth',block:'start'});
 },180);
}
function updatePurpose(){
 const purpose=document.getElementById('repository-purpose');
 if(!purpose) return;
 purpose.querySelectorAll('.hstu-purpose-highlights-930').forEach(x=>x.remove());
 purpose.querySelectorAll('.card,[class*="stat"],[class*="highlight"]').forEach(el=>{
   const t=tidy(el.textContent);
   if(t.length<420 && (/Research Data Repository/i.test(t)||/Jamaica.*Wider Caribbean/i.test(t)||/15 Thematic Research Areas/i.test(t)||/Research.*Reports.*Capacity/i.test(t))) el.style.display='none';
 });
 const box=document.createElement('div');
 box.className='hstu-purpose-highlights-930';
 box.innerHTML=
 '<div><b>Research Data Repository</b><span>Published and unpublished HIV/STI/TB evidence in one searchable repository.</span></div>'+
 '<div><b>Jamaica + Wider Caribbean</b><span>Research spanning Jamaica and relevant Caribbean evidence.</span></div>'+
 '<div><b>15 Thematic Research Areas</b><span>Browse research through the repository’s 15 Strategic Objectives.</span></div>'+
 '<div><b>One Connected Evidence Environment</b><span>Research, Reports, Capacity Building and Data Audit & Utilization remain clearly grouped.</span></div>';
 purpose.appendChild(box);
}
function rebuildQuickAccess(){
 const home=document.getElementById('view-home'); if(!home) return;
 const head=[...home.querySelectorAll('h1,h2,h3,h4')].find(x=>/Everything important/i.test(tidy(x.textContent)));
 let sec=head?.closest('section')||head?.closest('.wrap');
 if(!sec){
   sec=document.getElementById('home-quick-access');
   if(!sec){sec=document.createElement('section'); home.appendChild(sec);}
 }
 sec.id='home-quick-access';
 sec.classList.add('hstu-quick-access-930');
 sec.innerHTML=
 '<div class="hstu-section-kicker">Quick access</div>'+
 '<div class="hstu-section-heading"><div><h2>Everything important, easier to reach.</h2><p>Jump directly to the main areas of the Research Data Repository.</p></div></div>'+
 '<div class="hstu-quick-grid">'+
 [
 ['Research','Search recent studies and the 15 Strategic Objectives.','research','research-results'],
 ['Capacity Building','Manuals, technical guidance and training materials.','capacity','capacity-manuals'],
 ['Reports','National and Special Reports, prioritised by recency.','reports','reports-national'],
 ['Data Audit & Utilization','Data audit reports plus DHIS2 and TSIS2 user guides.','data-audit','data-audit-reports'],
 ['Gallery','Browse HIV, STI, TB and PrEP imagery.','gallery','gallery-images'],
 ['Resources','Presentations, Posters, External Links and Learning.','resources','resources-presentations'],
 ['Find Services','Treatment, PrEP and health-centre information across Jamaica.','services','services-directory']
 ].map(x=>'<button type="button" class="hstu-quick-card" data-quick-view="'+x[2]+'" data-quick-target="'+x[3]+'"><b>'+x[0]+'</b><span>'+x[1]+'</span><em>Open →</em></button>').join('')+
 '</div>';
 sec.querySelectorAll('[data-quick-view]').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.quickView,b.dataset.quickTarget)));
}
function fixResearchAgenda(){
 const research=document.getElementById('view-research'); if(!research) return;
 const candidates=[...research.querySelectorAll('h1,h2,h3,h4,strong,b')];
 const h=candidates.find(x=>/research agenda priorities/i.test(tidy(x.textContent)));
 if(h){
   h.textContent='Research Agenda Priorities';
   const sec=h.closest('.hstu-agenda-block')||h.closest('section')||h.parentElement;
   if(sec){
     sec.id='research-agenda-priorities';
     sec.classList.add('hstu-nav-instruction-930');
     if(!sec.querySelector('.hstu-nav-note-930')){
       const p=document.createElement('p'); p.className='hstu-nav-note-930';
       p.textContent='Use these priorities to understand the programme research agenda, then browse the Strategic Objectives below to locate stored studies.';
       h.insertAdjacentElement('afterend',p);
     }
   }
 }
}
function fixCapacity(){
 const v=document.getElementById('view-capacity'); if(!v) return;
 const e=v.querySelector('.page-hero .eyebrow,.page-hero [class*="eyebrow"]');
 if(e) e.textContent='Capacity Building · technical guidance · professional development';
}
function splitResources(){
 const v=document.getElementById('view-resources'); if(!v) return;
 const heroEye=v.querySelector('.page-hero .eyebrow,.page-hero [class*="eyebrow"]');
 if(heroEye) heroEye.textContent='Presentations · Posters · External Links · Learning';
 const learning=document.getElementById('resources-learning');
 if(learning && !learning.querySelector('.hstu-resource-section-title-930')){
   const h=document.createElement('div'); h.className='hstu-resource-section-title-930'; h.innerHTML='<h2>Learning</h2><p>Verified learning resources supporting HIV/STI/TB programme practice.</p>';
   learning.prepend(h);
 }
 let pres=document.getElementById('resources-presentations');
 if(pres){
   const head=[...pres.querySelectorAll('h1,h2,h3,h4')].find(x=>/Presentations\s*&\s*Posters/i.test(tidy(x.textContent)));
   if(head) head.textContent='Presentations';
   let posters=document.getElementById('resources-posters');
   if(!posters){
     posters=document.createElement('section');
     posters.id='resources-posters'; posters.className='wrap hstu-parity-group hstu-resource-split-930';
     posters.innerHTML='<div class="hstu-resource-section-title-930"><h2>Posters</h2><p>Repository posters and visual presentation assets.</p></div><div class="hstu-refine-grid hstu-posters-grid-930"></div>';
     pres.insertAdjacentElement('afterend',posters);
   }
   const grid=posters.querySelector('.hstu-posters-grid-930');
   [...pres.querySelectorAll('.hstu-refine-card,.hstu-parity-card')].forEach(card=>{if(/poster/i.test(tidy(card.textContent))) grid.appendChild(card);});
 }
 const groups=[...v.querySelectorAll('section,.hstu-parity-group')];
 const external=groups.find(g=>/Official HSTU Collections/i.test(tidy(g.textContent))||(/^External Links/i.test(tidy(g.textContent))&&g!==learning));
 if(external){
   external.id='resources-external';
   const h=[...external.querySelectorAll('h1,h2,h3,h4')][0];
   if(h) h.textContent='External Links';
 }
 scrubCtech();
}
function scrubCtech(){
 const root=document.getElementById('resources-learning'); if(!root) return;
 const bad=/c[\s-]?tech/i;
 [...root.querySelectorAll('a,.training-card,.course-card,.resource-card,.hstu-refine-card,article,li')].forEach(el=>{
   if(bad.test(tidy(el.textContent)+' '+(el.getAttribute?.('href')||''))) el.remove();
 });
}
let galleryCategory='All';
function setGalleryFilter(cat){
 galleryCategory=cat;
 const root=document.getElementById('hstuGalleryFilters');
 if(root){
   root.querySelectorAll('button').forEach(b=>b.classList.toggle('active',tidy(b.textContent).toLowerCase()===cat.toLowerCase()));
 }
 applyGallery();
}
function applyGallery(){
 const grid=document.getElementById('hstuGalleryGrid'); if(!grid) return;
 const q=(document.getElementById('hstuGallerySearch')?.value||'').toLowerCase();
 [...grid.children].forEach(card=>{
   const txt=tidy(card.textContent).toLowerCase();
   const data=tidy(card.dataset.category||card.getAttribute('data-category')||'').toLowerCase();
   const cat=galleryCategory.toLowerCase();
   const catok=cat==='all'||data===cat||txt.includes(cat==='prep'?'prep':cat);
   const qok=!q||txt.includes(q);
   card.style.display=catok&&qok?'':'none';
 });
}
function fixGallery(){
 const v=document.getElementById('view-gallery'); if(!v) return;
 const h=[...v.querySelectorAll('h1,h2')].find(x=>/Campaign Gallery/i.test(tidy(x.textContent))||tidy(x.textContent)==='Gallery');
 if(h) h.textContent='Gallery';
 const eye=v.querySelector('.page-hero .eyebrow,.page-hero [class*="eyebrow"]'); if(eye) eye.textContent='HSTU · HIV/STI/TB media';
 const old=document.getElementById('gallery-campaigns'); if(old) old.id='gallery-images';
 const filters=document.getElementById('hstuGalleryFilters');
 if(filters){
   filters.innerHTML='';
   ['All','HIV','STI','TB','PrEP'].forEach(c=>{
     const b=document.createElement('button'); b.type='button'; b.textContent=c; b.className='hstu-gallery-filter-930'+(c==='All'?' active':'');
     b.addEventListener('click',()=>setGalleryFilter(c)); filters.appendChild(b);
   });
 }
 const search=document.getElementById('hstuGallerySearch');
 if(search){search.placeholder='Search Gallery'; search.addEventListener('input',applyGallery);}
 document.querySelectorAll('.hst-gallery-cta').forEach(el=>{
   el.innerHTML='<span class="hst-gallery-cta-icon" aria-hidden="true">▦</span><span><b>Go to Gallery</b><small>Explore HIV, STI, TB and PrEP imagery →</small></span>';
 });
 const grid=document.getElementById('hstuGalleryGrid');
 if(grid) new MutationObserver(applyGallery).observe(grid,{childList:true,subtree:false});
 setTimeout(applyGallery,160);
}
function installResourceObserver(){
 const l=document.getElementById('resources-learning');
 if(l) new MutationObserver(scrubCtech).observe(l,{childList:true,subtree:true});
}
function addStyles(){
 if(document.getElementById('hstu-final-930-styles')) return;
 const s=document.createElement('style'); s.id='hstu-final-930-styles';
 s.textContent=`
 #homeManuals{display:none!important}
 .hstu-nav-swipe-hint{display:none}
 .hstu-section-kicker{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#a51f28;margin-bottom:7px}
 .hstu-section-heading{display:flex;justify-content:space-between;gap:18px;align-items:flex-end;margin-bottom:18px}
 .hstu-section-heading h2{margin:0;color:#233a29;font-size:clamp(26px,3vw,40px)}
 .hstu-section-heading p{margin:7px 0 0;color:#66746a;max-width:760px}
 .hstu-count-pill{white-space:nowrap;border-radius:999px;background:#edf7e8;color:#315f34;border:1px solid #d4e9ca;padding:7px 11px;font-weight:850;font-size:12px}
 .hstu-thematic-areas-930{padding-top:36px;padding-bottom:36px}
 .hstu-theme-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
 .hstu-theme-card{border:1px solid #dbe8d6;background:linear-gradient(145deg,#fff 0%,#f4f9f1 78%,#fff3f4 100%);border-radius:18px;padding:16px;text-align:left;display:grid;grid-template-columns:auto 1fr auto;gap:11px;align-items:center;color:#203326;font-weight:800;min-height:78px;cursor:pointer;box-shadow:0 8px 24px rgba(47,93,55,.07)}
 .hstu-theme-card:hover,.hstu-theme-card:focus-visible{transform:translateY(-2px);border-color:#65bd3a;box-shadow:0 12px 30px rgba(47,93,55,.13)}
 .hstu-theme-number{width:34px;height:34px;border-radius:11px;background:#315f34;color:#fff;display:grid;place-items:center;font-size:12px}
 .hstu-theme-arrow{color:#bd1822;font-size:20px}
 .hstu-purpose-highlights-930{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:22px}
 .hstu-purpose-highlights-930>div{border-left:4px solid #65bd3a;background:linear-gradient(135deg,#f1f8ed,#fff 72%,#fff4f4);padding:15px 16px;border-radius:14px;box-shadow:0 7px 20px rgba(45,77,51,.06)}
 .hstu-purpose-highlights-930 b{display:block;color:#24432b;margin-bottom:4px}
 .hstu-purpose-highlights-930 span{color:#66746a;font-size:13px;line-height:1.5}
 .hstu-quick-access-930{padding-top:34px!important;padding-bottom:38px!important;background:linear-gradient(180deg,#fbfdf9,#f5f9f2)!important}
 .hstu-quick-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
 .hstu-quick-card{border:1px solid #dfe9db;border-radius:18px;background:#fff;padding:17px;text-align:left;display:flex;flex-direction:column;gap:8px;min-height:150px;cursor:pointer}
 .hstu-quick-card b{font-size:16px;color:#24432b}.hstu-quick-card span{font-size:13px;line-height:1.45;color:#68766b;flex:1}.hstu-quick-card em{font-style:normal;font-size:12px;font-weight:900;color:#a51f28}
 .hstu-quick-card:hover,.hstu-quick-card:focus-visible{border-color:#65bd3a;transform:translateY(-2px);box-shadow:0 10px 26px rgba(47,93,55,.1)}
 .hstu-nav-instruction-930{background:linear-gradient(135deg,#fff6f6,#fff 46%,#eef8ea)!important;border:1px solid #e7d9d7!important;border-left:5px solid #bd1822!important}
 .hstu-nav-note-930{margin:8px 0 0!important;padding:10px 12px;border-radius:12px;background:#fff;color:#55645a!important;border:1px solid #e8ede5;font-size:13px}
 #view-resources .hstu-parity-group>h2,#view-resources .hstu-parity-group>h3,.hstu-resource-section-title-930 h2,#view-reports .hstu-parity-group>h2,#view-data-audit .hstu-parity-group>h2{color:#315f34!important}
 .hstu-resource-section-title-930{margin:0 0 16px}.hstu-resource-section-title-930 h2{margin:0 0 4px;font-size:28px}.hstu-resource-section-title-930 p{margin:0;color:#69766d}
 .hstu-gallery-filters{gap:9px!important;flex-wrap:wrap!important}
 .hstu-gallery-filter-930{min-height:42px!important;padding:9px 16px!important;border-radius:999px!important;border:1px solid #d4e3cf!important;background:#fff!important;color:#315f34!important;font-size:15px!important;font-weight:850!important;cursor:pointer}
 .hstu-gallery-filter-930.active{background:linear-gradient(135deg,#315f34,#4d9a3c 48%,#bd1822)!important;color:#fff!important;border-color:transparent!important}
 #hstuGallerySearch{font-size:16px!important;min-height:48px!important}
 @media(max-width:1100px){
   .hstu-primary-nav-scroll{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overscroll-behavior-inline:contain;scroll-snap-type:x proximity;scrollbar-width:thin;-webkit-overflow-scrolling:touch;padding-bottom:5px!important}
   .hstu-primary-nav-scroll>.nav-item,.hstu-primary-nav-scroll>.nav-group,.hstu-primary-nav-scroll>.hstu-nav-group,.hstu-primary-nav-scroll>.nav-btn{flex:0 0 auto!important;scroll-snap-align:start}
   .hstu-primary-nav-scroll .nav-btn{white-space:nowrap!important}
   .hstu-nav-swipe-hint{display:block;text-align:right;padding:3px 14px 0;font-size:11px;font-weight:800;color:#69766d}
   .hstu-quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 }
 @media(max-width:760px){
   .hstu-theme-grid{grid-template-columns:1fr!important}.hstu-purpose-highlights-930{grid-template-columns:1fr!important}
   .hstu-quick-grid{grid-template-columns:1fr 1fr!important}.hstu-quick-card{min-height:132px}
   .hstu-section-heading{align-items:flex-start;flex-direction:column}.hstu-count-pill{align-self:flex-start}
 }
 @media(max-width:430px){.hstu-quick-grid{grid-template-columns:1fr!important}}
 `;
 document.head.appendChild(s);
}
function cleanPublicTerms(){
 const g=document.getElementById('view-gallery');
 if(g){
   [...g.querySelectorAll('h1,h2,h3,.eyebrow')].forEach(el=>{if(/campaign gallery/i.test(tidy(el.textContent))) el.textContent=tidy(el.textContent).replace(/Campaign Gallery/ig,'Gallery');});
 }
}
function init(){
 document.documentElement.dataset.hstuRefinements930='ready';
 addStyles(); fixHero(); fixPrimaryNav(); buildThematicAreas(); updatePurpose(); rebuildQuickAccess();
 fixResearchAgenda(); fixCapacity(); splitResources(); fixGallery(); installResourceObserver(); cleanPublicTerms();
 setTimeout(()=>{fixPrimaryNav(); splitResources(); scrubCtech(); fixGallery();},450);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true}); else setTimeout(init,0);
})();