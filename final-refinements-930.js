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
 try{
   if(typeof window.setView==='function') window.setView(view);
 }catch(_){}
 const ensure=()=>{
   const panel=document.getElementById('view-'+view);
   if(panel && !panel.classList.contains('active')){
     document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
     panel.classList.add('active');
   }
   document.querySelectorAll('.nav-btn[data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===view));
   const el=target&&document.getElementById(target);
   if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
 };
 ensure();
 setTimeout(ensure,90);
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
     if(it.gallery){
       setGalleryFilter(it.gallery);
       setTimeout(()=>setGalleryFilter(it.gallery),80);
       setTimeout(()=>setGalleryFilter(it.gallery),220);
     setTimeout(()=>setGalleryFilter(it.gallery),520);
     }
   });
   d.appendChild(b);
 });
 return true;
}
function fixHero(){
 const home=document.getElementById('view-home');
 const hero=home?.querySelector('.home-hero');
 if(!hero) return;
 hero.id='home-purpose-hero';
 hero.classList.add('hstu-purpose-hero-930');

 const heading=hero.querySelector('h1');
 const copyHost=heading?.closest('.hero-copy,.home-hero-copy,.hero-content,.home-hero-content,.hero-text')||heading?.parentElement||hero;
 const eye=copyHost.querySelector('.eyebrow,[class*="eyebrow"]');
 if(eye) eye.textContent='STRATEGIC INFORMATION · HSTU';
 if(heading) heading.textContent='About the Research Data Repository';

 let copy=copyHost.querySelector('.hstu-purpose-copy-930');
 if(!copy){
   copy=document.createElement('div');
   copy.className='hstu-purpose-copy-930';
   heading?.insertAdjacentElement('afterend',copy);
 }
 copy.innerHTML=
   '<p>The Research Data Repository was conceptualized in 2023 by the Strategic Information Component with the aim of systematically collecting and collating published and unpublished studies and reports.</p>'+
   '<p>The repository supports navigation of HIV/STI/TB research from Jamaica and the wider Caribbean, alongside capacity-building tools, national-level reports and data-utilization SOPs/User Guides for DHIS2 and TSIS2.</p>';

 [...copyHost.querySelectorAll('p')].forEach(p=>{if(!copy.contains(p)) p.style.display='none';});
 [...copyHost.querySelectorAll('a,button')].forEach(el=>{
   if(!el.closest('.hstu-purpose-cta-930') && /Explore research|Explore Capacity Building/i.test(tidy(el.textContent))) el.remove();
 });
 let actions=copyHost.querySelector('.hstu-purpose-cta-930');
 if(!actions){
   actions=document.createElement('div');
   actions.className='hstu-purpose-cta-930';
   copy.insertAdjacentElement('afterend',actions);
 }
 actions.innerHTML=
   '<button type="button" class="hstu-purpose-primary-930" data-purpose-view="research">Explore Research <span aria-hidden="true">→</span></button>'+
   '<button type="button" data-purpose-view="reports">View Reports</button>'+
   '<button type="button" data-purpose-view="data-audit">Data Audit &amp; Utilization</button>';
 actions.querySelectorAll('[data-purpose-view]').forEach(b=>{
   b.addEventListener('click',()=>openView(b.dataset.purposeView));
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
 setDropdown('home',[{label:'Overview',target:'home-purpose-hero'},{label:'15 Thematic Research Areas',target:'home-thematic-areas'},{label:'Quick Access',target:'home-quick-access'}]);
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

 document.querySelectorAll('#mainNav .hstu-nav-dropdown').forEach(d=>{
   d.setAttribute('aria-hidden','true');
 });
 buttons.forEach(b=>{
   const d=dropdown(b.dataset.view);
   if(d){
     b.parentElement?.classList.add('hstu-nav-item');
     b.setAttribute('aria-haspopup','true');
     if(!b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded','false');
   }
   if(!b.dataset.hstuViewBound){
     b.dataset.hstuViewBound='1';
     b.addEventListener('click',()=>openView(b.dataset.view));
   }
 });
 setupMobileSubnav(buttons,p||document.getElementById('mainNav'));
}
function setupMobileSubnav(buttons,navRoot){
 if(!navRoot) return;
 let rail=document.getElementById('hstuMobileSubnav930');
 if(!rail){
   rail=document.createElement('nav');
   rail.id='hstuMobileSubnav930';
   rail.className='hstu-mobile-subnav-930';
   rail.setAttribute('aria-label','Selected section navigation');
   rail.hidden=true;
   navRoot.insertAdjacentElement('afterend',rail);
 }
 const close=()=>{
   rail.hidden=true;
   rail.innerHTML='';
   delete rail.dataset.view;
   buttons.forEach(x=>x.setAttribute('aria-expanded','false'));
 };
 const openFor=(btn)=>{
   if(window.innerWidth>1000) return;
   const view=btn.dataset.view;
   const source=dropdown(view);
   if(!source||!source.children.length){close();return;}
   if(!rail.hidden && rail.dataset.view===view){close();return;}
   rail.innerHTML='';
   rail.dataset.view=view;
   rail.hidden=false;
   buttons.forEach(x=>x.setAttribute('aria-expanded',x===btn?'true':'false'));
   [...source.querySelectorAll('button')].forEach(original=>{
     const b=document.createElement('button');
     b.type='button';
     b.textContent=tidy(original.textContent);
     b.className='hstu-mobile-subnav-pill-930';
     b.dataset.view=view;
     if(original.dataset.target) b.dataset.target=original.dataset.target;
     if(original.dataset.galleryCategory) b.dataset.galleryCategory=original.dataset.galleryCategory;
     b.addEventListener('click',e=>{
       e.preventDefault();
       openView(view,b.dataset.target);
       if(b.dataset.galleryCategory) setTimeout(()=>setGalleryFilter(b.dataset.galleryCategory),120);
       close();
     });
     rail.appendChild(b);
   });
   rail.scrollLeft=0;
 };
 buttons.forEach(b=>{
   if(b.dataset.hstuMobileSubnavBound) return;
   b.dataset.hstuMobileSubnavBound='1';
   b.addEventListener('click',e=>{
     if(window.innerWidth<=1000 && e.isTrusted) setTimeout(()=>openFor(b),0);
   });
 });
 if(!document.documentElement.dataset.hstuMobileSubnavGlobalBound){
   document.documentElement.dataset.hstuMobileSubnavGlobalBound='1';
   document.addEventListener('click',e=>{
     const r=document.getElementById('hstuMobileSubnav930');
     if(!r||r.hidden||window.innerWidth>1000) return;
     if(r.contains(e.target)||e.target.closest?.('#mainNav .nav-btn[data-view]')) return;
     r.hidden=true; r.innerHTML=''; delete r.dataset.view;
     document.querySelectorAll('#mainNav .nav-btn[data-view]').forEach(x=>x.setAttribute('aria-expanded','false'));
   });
   document.addEventListener('keydown',e=>{
     if(e.key!=='Escape') return;
     const r=document.getElementById('hstuMobileSubnav930');
     if(r&&!r.hidden){
       r.hidden=true; r.innerHTML=''; delete r.dataset.view;
       document.querySelectorAll('#mainNav .nav-btn[data-view]').forEach(x=>x.setAttribute('aria-expanded','false'));
     }
   });
   window.addEventListener('resize',()=>{
     if(window.innerWidth>1000){
       const r=document.getElementById('hstuMobileSubnav930');
       if(r){r.hidden=true;r.innerHTML='';delete r.dataset.view;}
       document.querySelectorAll('#mainNav .nav-btn[data-view]').forEach(x=>x.setAttribute('aria-expanded','false'));
     }
   });
 }
}
function installNavigationDelegation(){
 if(document.documentElement.dataset.hstuNavDelegation930) return;
 document.documentElement.dataset.hstuNavDelegation930='1';
 const delegated=e=>{
   const top=e.target?.closest?.('#mainNav .nav-btn[data-view]');
   if(top){
     const view=top.dataset.view;
     setTimeout(()=>openView(view),0);
     setTimeout(()=>openView(view),90);
   }
   const galleryItem=e.target?.closest?.('#mainNav .hstu-nav-dropdown [data-gallery-category],#hstuMobileSubnav930 [data-gallery-category]');
   if(galleryItem){
     const cat=galleryItem.dataset.galleryCategory;
     const apply=()=>{openView('gallery','gallery-images');setGalleryFilter(cat);};
     setTimeout(apply,0);
     setTimeout(()=>setGalleryFilter(cat),80);
     setTimeout(()=>setGalleryFilter(cat),220);
     setTimeout(()=>setGalleryFilter(cat),520);
   }
 };
 window.addEventListener('pointerup',delegated,true);
 window.addEventListener('click',delegated,true);
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
 const summary=document.getElementById('home-purpose-summary');
 if(summary) summary.insertAdjacentElement('afterend',sec);
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
 const home=document.getElementById('view-home');
 const hero=home?.querySelector('.home-hero');
 const purpose=document.getElementById('repository-purpose');
 if(!home||!hero) return;
 if(purpose){
   purpose.setAttribute('aria-hidden','true');
   purpose.style.display='none';
 }
 let box=document.getElementById('home-purpose-summary');
 if(!box){
   box=document.createElement('section');
   box.id='home-purpose-summary';
   box.className='wrap hstu-purpose-summary-930';
   hero.insertAdjacentElement('afterend',box);
 }
 box.innerHTML=
   '<div class="hstu-purpose-highlights-930">'+
   '<button type="button" data-summary-view="research"><b>Research Data Repository</b><span>Published and unpublished HIV/STI/TB evidence in one searchable repository.</span></button>'+
   '<div><b>Jamaica + Wider Caribbean</b><span>Research spanning Jamaica and relevant Caribbean evidence.</span></div>'+
   '<button type="button" data-summary-target="home-thematic-areas"><b>15 Thematic Research Areas</b><span>Browse research through the repository’s 15 Strategic Objectives.</span></button>'+
   '<div><b>One Connected Evidence Environment</b><span>Research · Capacity Building · Reports · Data Audit &amp; Utilization · Gallery · Resources · Find Services.</span></div>'+
   '</div>';
 box.querySelector('[data-summary-view]')?.addEventListener('click',e=>openView(e.currentTarget.dataset.summaryView));
 box.querySelector('[data-summary-target]')?.addEventListener('click',e=>document.getElementById(e.currentTarget.dataset.summaryTarget)?.scrollIntoView({behavior:'smooth',block:'start'}));
}
function rebuildQuickAccess(){
 const home=document.getElementById('view-home'); if(!home) return;
 const head=[...home.querySelectorAll('h1,h2,h3,h4')].find(x=>/Everything important/i.test(tidy(x.textContent)));
 const oldSection=head?.closest('section');
 if(oldSection && oldSection!==home) oldSection.style.display='none';
 else if(head){
   const small=head.parentElement;
   if(small && small!==home && tidy(small.textContent).length<1200) small.style.display='none';
 }
 let sec=document.getElementById('home-quick-access');
 if(sec && sec===oldSection) sec=null;
 if(!sec){
   sec=document.createElement('section');
   sec.id='home-quick-access';
   sec.className='wrap hstu-quick-access-930';
   const anchor=document.getElementById('home-thematic-areas')||document.getElementById('repository-purpose')||home.querySelector('.home-hero')||home.firstElementChild;
   if(anchor) anchor.insertAdjacentElement('afterend',sec); else home.appendChild(sec);
 }
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
 const dead=['https://agora.unicef.org/course/info.php?id=41002'];
 [...root.querySelectorAll('a,.training-card,.course-card,.resource-card,.hstu-refine-card,article,li')].forEach(el=>{
   const href=el.getAttribute?.('href')||'';
   if(bad.test(tidy(el.textContent)+' '+href)||dead.some(u=>href.startsWith(u))){
     const card=el.closest('.training-card,.course-card,.resource-card,.hstu-refine-card,article,li');
     (card||el).remove();
   }
 });
}
const CAMPAIGN_CATEGORY={
 'campaign-01.webp':'TB',
 'campaign-02.webp':'STI',
 'campaign-03.webp':'STI',
 'campaign-04.webp':'HIV',
 'campaign-05.webp':'HIV',
 'campaign-06.webp':'HIV',
 'campaign-07.webp':'HIV',
 'campaign-08.webp':'HIV',
 'campaign-09.webp':'HIV',
 'campaign-10.webp':'HIV',
 'campaign-11.webp':'HIV',
 'campaign-12.webp':'PrEP',
 'campaign-13.webp':'HIV',
 'campaign-14.webp':'HIV',
 'campaign-15.webp':'HIV',
 'campaign-16.webp':'HIV',
 'campaign-17.webp':'HIV',
 'campaign-18.webp':'HIV',
 'campaign-19.webp':'HIV',
 'campaign-20.webp':'HIV',
 'campaign-21.webp':'STI',
 'campaign-22.webp':'HIV',
 'campaign-23.webp':'PrEP',
 'campaign-24.webp':'STI',
 'campaign-25.webp':'STI',
 'campaign-26.webp':'HIV',
 'campaign-27.webp':'HIV',
 'campaign-28.webp':'HIV',
 'campaign-29.webp':'HIV'
};
let galleryCategory='All';
function galleryCardCategory(card){
 const img=card.querySelector('img');
 const src=(img?.getAttribute('src')||'').split('?')[0].split('#')[0];
 const file=src.split('/').pop()?.toLowerCase()||'';
 const known=CAMPAIGN_CATEGORY[file];
 if(known){
   card.dataset.galleryCategory=known;
   return known;
 }
 if(/^archive-\\d+\\.webp$/i.test(file)){
   card.dataset.galleryCategory='Unclassified';
   return 'Unclassified';
 }
 const declared=tidy(card.dataset.galleryCategory||card.dataset.category||'');
 if(/^(HIV|STI|TB|PrEP)$/i.test(declared)) return declared;
 card.dataset.galleryCategory='Unclassified';
 return 'Unclassified';
}
function setGalleryFilter(cat){
 const allowed=['All','HIV','STI','TB','PrEP'];
 galleryCategory=allowed.find(x=>x.toLowerCase()===String(cat||'All').toLowerCase())||'All';
 const root=document.getElementById('hstuGalleryFilters');
 if(root){
   root.querySelectorAll('button').forEach(b=>{
     const on=(b.dataset.galleryFilter||tidy(b.textContent)).toLowerCase()===galleryCategory.toLowerCase();
     b.classList.toggle('active',on);
     b.setAttribute('aria-pressed',on?'true':'false');
   });
 }
 applyGallery();
}
function applyGallery(){
 const grid=document.getElementById('hstuGalleryGrid'); if(!grid) return;
 const q=(document.getElementById('hstuGallerySearch')?.value||'').trim().toLowerCase();
 let visible=0;
 [...grid.children].forEach(card=>{
   const category=galleryCardCategory(card);
   const img=card.querySelector('img');
   const hay=(tidy(card.textContent)+' '+tidy(img?.alt)+' '+tidy(img?.title)).toLowerCase();
   const catok=galleryCategory==='All'||category.toLowerCase()===galleryCategory.toLowerCase();
   const qok=!q||hay.includes(q);
   const show=catok&&qok;
   card.hidden=!show;
   card.style.display=show?'':'none';
   if(show) visible++;
 });
 const count=document.getElementById('hstuGalleryCount')||document.querySelector('[data-gallery-count]');
 if(count) count.textContent=visible+' image'+(visible===1?'':'s');
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
     const b=document.createElement('button');
     b.type='button';
     b.textContent=c;
     b.dataset.galleryFilter=c;
     b.className='hstu-gallery-filter-930'+(c==='All'?' active':'');
     b.setAttribute('aria-pressed',c==='All'?'true':'false');
     b.addEventListener('click',()=>setGalleryFilter(c));
     filters.appendChild(b);
   });
 }
 const search=document.getElementById('hstuGallerySearch');
 if(search){
   search.placeholder='Search Gallery';
   if(!search.dataset.hstuFilterBound){
     search.addEventListener('input',applyGallery);
     search.dataset.hstuFilterBound='1';
   }
 }
 document.querySelectorAll('.hst-gallery-cta').forEach(el=>{
   el.innerHTML='<span class="hst-gallery-cta-icon" aria-hidden="true">▦</span><span><b>Go to Gallery</b><small>Explore HIV, STI, TB and PrEP imagery →</small></span>';
 });
 const grid=document.getElementById('hstuGalleryGrid');
 if(grid){
   [...grid.children].forEach(galleryCardCategory);
   if(!grid.dataset.hstuGalleryObserved){
     new MutationObserver(()=>{[...grid.children].forEach(galleryCardCategory);applyGallery();}).observe(grid,{childList:true,subtree:false});
     grid.dataset.hstuGalleryObserved='1';
   }
 }
 setGalleryFilter(galleryCategory);
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
function addFinalHotfixStyles(){
 if(document.getElementById('hstu-final-930-hotfix-styles')) return;
 const s=document.createElement('style');
 s.id='hstu-final-930-hotfix-styles';
 s.textContent=
 'html,body{max-width:100%!important;overflow-x:hidden!important}'+
 '#home-purpose-summary{position:relative;z-index:2}'+
 '.hstu-purpose-hero-930 h1{font-size:clamp(42px,5.2vw,76px)!important;line-height:.98!important;letter-spacing:-.045em!important;max-width:760px!important}'+
 '.hstu-purpose-copy-930{max-width:780px;margin-top:22px}'+
 '.hstu-purpose-copy-930 p{display:block!important;margin:0 0 10px!important;max-width:760px!important;font-size:clamp(15px,1.15vw,18px)!important;line-height:1.58!important;color:rgba(255,255,255,.78)!important}'+
 '.hstu-purpose-cta-930{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}'+
 '.hstu-purpose-cta-930 button{min-height:48px;border-radius:16px;padding:11px 17px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#fff;font-weight:900;cursor:pointer;backdrop-filter:blur(8px)}'+
 '.hstu-purpose-cta-930 .hstu-purpose-primary-930{background:linear-gradient(135deg,#2d8138,#54ad3d 48%,#c91f2b);border-color:transparent;box-shadow:0 10px 24px rgba(0,0,0,.18)}'+
 '.hstu-purpose-summary-930{padding-top:24px!important;padding-bottom:14px!important}'+
 '.hstu-purpose-summary-930 .hstu-purpose-highlights-930{margin-top:0!important}'+
 '.hstu-purpose-highlights-930 button{font:inherit;text-align:left;border:0;cursor:pointer}'+
 '#repository-purpose[aria-hidden="true"]{display:none!important}'+
 '#mainNav{min-width:0!important;max-width:100%!important}'+
 '#mainNav .hstu-nav-item{min-width:0!important;position:relative}'+
 '@media(min-width:1001px){'+
 '#mainNav{display:flex!important;align-items:center!important;gap:clamp(2px,.35vw,7px)!important;overflow:visible!important;flex:1 1 auto!important}'+
 '#mainNav .nav-btn{white-space:nowrap!important;font-size:clamp(12px,.86vw,16px)!important;padding:10px clamp(7px,.58vw,12px)!important}'+
 '#mainNav .hstu-nav-dropdown{display:none!important;position:absolute!important;top:calc(100% + 8px)!important;left:0!important;min-width:220px!important;max-width:min(360px,90vw)!important;z-index:9999!important}'+
 '#mainNav .hstu-nav-item:hover>.hstu-nav-dropdown,#mainNav .hstu-nav-item:focus-within>.hstu-nav-dropdown,#mainNav .hstu-nav-dropdown:hover{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}'+
 '}'+
 '@media(max-width:1500px) and (min-width:1001px){#mainNav{gap:2px!important}#mainNav .nav-btn{font-size:13px!important;padding-left:8px!important;padding-right:8px!important}}'+
 '@media(max-width:1000px){'+
 '#menuToggle{display:none!important}'+
 '#mainNav,.hstu-primary-nav-scroll{display:flex!important;flex-direction:row!important;align-items:center!important;gap:8px!important;width:100%!important;max-width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;padding:9px 12px 11px!important;scroll-snap-type:x proximity!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-inline:contain!important;background:rgba(10,18,12,.98)!important}'+
 '#mainNav>*{flex:0 0 auto!important;width:max-content!important;min-width:0!important;max-width:none!important}'+
'#mainNav .hstu-nav-item,#mainNav .nav-item,#mainNav .nav-group{display:block!important;flex:0 0 auto!important;width:max-content!important;min-width:0!important;max-width:none!important;scroll-snap-align:start!important}'+
 '#mainNav .nav-btn{display:block!important;width:auto!important;min-width:max-content!important;white-space:nowrap!important;padding:10px 14px!important;border-radius:999px!important;font-size:13px!important}'+
 '#mainNav .hstu-nav-dropdown,#mainNav .nav-btn.active+.hstu-nav-dropdown,#mainNav .hstu-nav-item:focus-within>.hstu-nav-dropdown{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;position:absolute!important}'+
 '.hstu-nav-swipe-hint{display:block!important;padding:4px 14px 5px!important;background:#f7faf5!important}'+
 '#hstuMobileSectionRail{display:none!important}'+
'#hstuMobileSubnav930{display:flex!important;align-items:center!important;gap:8px!important;width:100%!important;max-width:100%!important;overflow-x:auto!important;padding:8px 12px 10px!important;background:#f7faf5!important;border-bottom:1px solid #dfe8dc!important;box-shadow:0 8px 18px rgba(22,45,27,.08)!important;scrollbar-width:thin!important}'+
'#hstuMobileSubnav930[hidden]{display:none!important}'+
'#hstuMobileSubnav930 button{flex:0 0 auto!important;white-space:nowrap!important;border:1px solid #d7e5d3!important;background:#fff!important;color:#315f34!important;border-radius:999px!important;padding:9px 13px!important;font-size:12px!important;font-weight:900!important;cursor:pointer!important}'+
'#hstuMobileSubnav930 button:focus-visible{outline:3px solid rgba(74,155,59,.28)!important;outline-offset:2px!important}'+
 '.hstu-purpose-hero-930 h1{font-size:clamp(38px,10.5vw,58px)!important;line-height:1.01!important;letter-spacing:-.04em!important}'+
 '.hstu-purpose-copy-930{margin-top:16px!important}.hstu-purpose-copy-930 p{font-size:15px!important;line-height:1.52!important}'+
 '.hstu-purpose-cta-930{gap:8px!important;margin-top:18px!important}.hstu-purpose-cta-930 button{min-height:44px!important;padding:9px 13px!important;font-size:13px!important}'+
 '}'+
 '@media(max-width:560px){.hstu-purpose-highlights-930{grid-template-columns:1fr!important}.hstu-purpose-cta-930 button{flex:1 1 100%!important}.hstu-purpose-hero-930 h1{font-size:clamp(36px,11vw,50px)!important}}';
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
 addStyles(); addFinalHotfixStyles(); fixHero(); fixPrimaryNav(); installNavigationDelegation(); updatePurpose(); buildThematicAreas(); rebuildQuickAccess();
 fixResearchAgenda(); fixCapacity(); splitResources(); fixGallery(); installResourceObserver(); cleanPublicTerms();
 setTimeout(()=>{fixPrimaryNav(); splitResources(); scrubCtech(); fixGallery();},450);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true}); else setTimeout(init,0);
})();