const CACHE_NAME="hstu-resource-centre-v20260925-gallery-final";
const CORE=[
  "./","./index.html","./manifest.webmanifest",
  "./hstu-app-icon-192.png","./hstu-app-icon-512.png",
  "./hstu-app-maskable-512.png","./hstu-apple-touch-icon.png",
  "./hstu-favicon-64.png","./hstu-install-logo.png"
];

const GALLERY_FIX = `
<style id="gallery-live-fix">
.hstu-collage-brand{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;padding:14px!important;background:transparent!important;border:0!important;box-shadow:none!important}
.hstu-collage-brand-dot{display:none!important}
#liveGoGallery{display:flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-height:58px!important;padding:12px 22px!important;border:1px solid rgba(255,255,255,.25)!important;border-radius:18px!important;background:linear-gradient(135deg,#08713b,#12a45b)!important;color:#fff!important;box-shadow:0 12px 30px rgba(0,0,0,.25)!important;font:800 16px/1.1 system-ui,-apple-system,Segoe UI,sans-serif!important;cursor:pointer!important}
#liveGoGallery small{display:block!important;margin-top:4px!important;font-size:11px!important;font-weight:600!important;color:rgba(255,255,255,.84)!important}
#liveGoGallery .arrow{font-size:22px!important;margin-left:5px!important}
@media(max-width:620px){#liveGoGallery{width:100%!important;max-width:430px!important}}
</style>
<script id="gallery-live-fix-script">
(function(){
 function install(){
   var host=document.querySelector('.hstu-collage-brand');
   if(!host) return;
   host.innerHTML='<button id="liveGoGallery" type="button"><span>▧</span><span>Go to Gallery<small>Explore HST Health Living campaigns</small></span><span class="arrow">→</span></button>';
   var b=document.getElementById('liveGoGallery');
   if(!b) return;
   b.addEventListener('click',function(){
     var nav=document.querySelector('[data-view="gallery"]');
     if(nav){nav.click();return;}
     var view=document.getElementById('view-gallery');
     if(view){document.querySelectorAll('.view').forEach(function(v){v.classList.remove('active')});view.classList.add('active');view.scrollIntoView({behavior:'smooth',block:'start'});}
   });
 }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
<\/script>
`;

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);

  if(event.request.mode==="navigate"){
    event.respondWith(
      fetch(event.request,{cache:"no-store"}).then(async response=>{
        const raw=await response.text();
        const fixed=raw.includes('id="gallery-live-fix"')?raw:raw.replace("</body>",GALLERY_FIX+"</body>");
        const out=new Response(fixed,{status:response.status,statusText:response.statusText,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
        caches.open(CACHE_NAME).then(cache=>cache.put("./index.html",out.clone()));
        return out;
      }).catch(()=>caches.match("./index.html"))
    );
    return;
  }

  const fresh=/manifest\.webmanifest$|service-worker\.js$|hstu-(app|apple|favicon|install)/.test(url.pathname);
  if(fresh){
    event.respondWith(fetch(event.request,{cache:"reload"}).then(response=>{
      const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)); return response;
    }).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
