#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import re

p=Path("index.html")
soup=BeautifulSoup(p.read_text(encoding="utf-8"),"html.parser")

def by_heading(view_id,text):
    sec=soup.find(id=view_id)
    if not sec:return None
    for h in sec.find_all(["h1","h2","h3","h4"]):
        if h.get_text(" ",strip=True).casefold()==text.casefold():
            return h.find_parent("section") or h.parent
    return None

def setid(el,idv):
    if el: el["id"]=idv
    return el

setid(soup.find(id="repository-purpose"),"repository-purpose")

research=soup.find(id="view-research")
if research:
    controls=research.select_one(".hstu-refine-controls")
    setid(controls,"research-filters")
    grid=soup.find(id="refineResearchGrid")
    if grid:
        setid(grid.parent,"research-results")

capacity=soup.find(id="view-capacity")
if capacity:
    setid(capacity.select_one(".manual-toolbar"),"capacity-manuals")
    setid(by_heading("view-capacity","Programme Training & Technical Learning"),"capacity-training")

setid(by_heading("view-reports","National Reports"),"reports-national")
setid(by_heading("view-reports","Special Reports"),"reports-special")
setid(by_heading("view-data-audit","Data Quality Audit Reports"),"data-audit-reports")
setid(by_heading("view-data-audit","Data Systems Manuals & User Guides"),"data-systems-guides")

gallery=soup.find(id="view-gallery")
if gallery:
    wraps=gallery.find_all("div",class_="wrap",recursive=False)
    if len(wraps)>=2:setid(wraps[1],"gallery-campaigns")

resources=soup.find(id="view-resources")
if resources:
    setid(resources.select_one(".training-shell"),"resources-learning")
    setid(by_heading("view-resources","Presentations & Posters"),"resources-presentations")

services=soup.find(id="view-services")
if services:
    setid(services.select_one(".services-grid"),"services-directory")

mapping={
 ("home","Overview"):("repository-purpose",None),
 ("research","Latest studies"):("research-results",None),
 ("research","Strategic Objectives 1–15"):("research-filters",None),
 ("capacity","Manuals"):("capacity-manuals",None),
 ("capacity","Training materials"):("capacity-training",None),
 ("reports","National Reports"):("reports-national",None),
 ("reports","Special Reports"):("reports-special",None),
 ("data-audit","Data Audit"):("data-audit-reports",None),
 ("data-audit","DHIS2 and TSIS2"):("data-systems-guides",None),
 ("gallery","Campaign images"):("gallery-campaigns",None),
 ("resources","Learning links"):("resources-learning",None),
 ("resources","Presentations and Posters"):("resources-presentations",None),
 ("services","Treatment and PrEP"):("services-directory","treatment"),
 ("services","Health centres"):("services-directory","healthcentres"),
}

for item in soup.select(".hstu-nav-item"):
    main=item.select_one(":scope > .nav-btn")
    view=main.get("data-view") if main else None
    dropdown=item.select_one(":scope > .hstu-nav-dropdown")
    if main and dropdown:
        main["aria-haspopup"]="true"
        main["aria-expanded"]="false"
    for b in item.select(".hstu-nav-dropdown button"):
        key=(view,b.get_text(" ",strip=True))
        if key in mapping:
            target,mode=mapping[key]
            b["data-target"]=target
            if mode:b["data-service-mode-target"]=mode

for oldid in ["hstu-subsection-nav-v1","hstu-subsection-nav-v1-styles"]:
    old=soup.find(id=oldid)
    if old:old.decompose()

style=soup.new_tag("style",id="hstu-subsection-nav-v1-styles")
style.string="""
[id^="research-"],#capacity-manuals,#capacity-training,#reports-national,#reports-special,
#data-audit-reports,#data-systems-guides,#gallery-campaigns,#resources-learning,
#resources-presentations,#services-directory,#repository-purpose{scroll-margin-top:110px}
.hstu-nav-dropdown button[data-target]::after{content:"↘";float:right;margin-left:12px;opacity:.48;font-size:.85em}
.hstu-nav-dropdown button[data-target]:hover::after,.hstu-nav-dropdown button[data-target]:focus::after{opacity:.9}
@media(max-width:950px){
  .hstu-nav-item.touch-open>.hstu-nav-dropdown{
    display:flex!important;
    visibility:visible!important;
    opacity:1!important;
    pointer-events:auto!important;
    transform:none!important;
    position:static!important;
    width:100%!important;
    max-width:none!important;
    max-height:none!important;
    flex-direction:column!important;
  }
  .hstu-nav-item.touch-open>.nav-btn::after{transform:rotate(180deg)}
}
"""
soup.head.append(style)

script=soup.new_tag("script",id="hstu-subsection-nav-v1")
script.string=r"""
(()=>{
'use strict';
const compact=()=>window.matchMedia('(max-width:950px)').matches;

function stickyOffset(){
 const header=document.querySelector('header,.navbar,.site-header');
 const r=header?.getBoundingClientRect();
 return Math.max(76,(r&&r.height)||0)+18;
}
function collapseTouchMenus(except){
 document.querySelectorAll('.hstu-nav-item.touch-open').forEach(item=>{
   if(item===except)return;
   item.classList.remove('touch-open');
   const main=item.querySelector(':scope > .nav-btn[aria-expanded]');
   if(main)main.setAttribute('aria-expanded','false');
 });
}
function closeMobileNav(){
 collapseTouchMenus(null);
 const nav=document.querySelector('#mainNav');
 if(nav)nav.classList.remove('open');
 const toggle=document.querySelector('#menuToggle');
 if(toggle?.hasAttribute('aria-expanded'))toggle.setAttribute('aria-expanded','false');
 document.querySelectorAll('.nav-menu.open,.mobile-menu.open,.navbar.open,[aria-expanded="true"].nav-toggle').forEach(el=>{
   el.classList.remove('open');
   if(el.matches('[aria-expanded]'))el.setAttribute('aria-expanded','false');
 });
}
function go(btn){
 const view=btn.dataset.view;
 const targetId=btn.dataset.target;
 if(!view||!targetId)return;
 if(typeof window.setView==='function'){
   const nativeScrollTo=window.scrollTo;
   window.scrollTo=()=>{};
   try{window.setView(view)}finally{window.scrollTo=nativeScrollTo}
 }else{
   document.querySelectorAll('[id^="view-"]').forEach(v=>v.hidden=v.id!=='view-'+view);
 }
 const scroller=document.scrollingElement||document.documentElement;
 scroller.scrollTop=0;
 closeMobileNav();
 setTimeout(()=>{
   const mode=btn.dataset.serviceModeTarget;
   if(mode){
     const modeBtn=document.querySelector('#view-services [data-service-mode="'+CSS.escape(mode)+'"]');
     if(modeBtn&&!modeBtn.classList.contains('active'))modeBtn.click();
   }
   const finishScroll=()=>{
     const target=document.getElementById(targetId);
     if(!target)return;
     const root=document.scrollingElement||document.documentElement;
     const y=root.scrollTop+target.getBoundingClientRect().top-stickyOffset();
     root.scrollTop=Math.max(0,y);
     target.classList.add('hstu-subsection-arrival');
     setTimeout(()=>target.classList.remove('hstu-subsection-arrival'),900);
     try{history.replaceState(null,'','#'+targetId)}catch(_){}
   };
   const base=mode?160:0;
   [base,base+260,base+760].forEach(delay=>setTimeout(finishScroll,delay));
 },120);
}

document.addEventListener('click',e=>{
 const main=e.target.closest('.hstu-nav-item > .nav-btn[data-view]');
 if(!main||!compact())return;
 const item=main.closest('.hstu-nav-item');
 const dropdown=item?.querySelector(':scope > .hstu-nav-dropdown');
 if(!dropdown)return;
 e.preventDefault();
 e.stopImmediatePropagation();
 const willOpen=!item.classList.contains('touch-open');
 collapseTouchMenus(item);
 item.classList.toggle('touch-open',willOpen);
 main.setAttribute('aria-expanded',willOpen?'true':'false');
},true);

document.addEventListener('click',e=>{
 const btn=e.target.closest('.hstu-nav-dropdown button[data-target]');
 if(!btn)return;
 e.preventDefault();
 e.stopImmediatePropagation();
 go(btn);
},true);

document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 collapseTouchMenus(null);
},true);

window.addEventListener('resize',()=>{if(!compact())collapseTouchMenus(null)});
})();
"""
soup.body.append(script)

style.string += """
.hstu-subsection-arrival{animation:hstuArrival .9s ease}
@keyframes hstuArrival{0%{outline:0 solid rgba(15,140,71,0)}30%{outline:4px solid rgba(15,140,71,.22);outline-offset:8px}100%{outline:0 solid rgba(15,140,71,0)}}
@media(prefers-reduced-motion:reduce){.hstu-subsection-arrival{animation:none}}
"""

p.write_text(str(soup),encoding="utf-8")
print("Subsection dropdown navigation wired:",len(mapping))
