const CACHE_NAME="hstu-resource-centre-v20260925-stable";
const APP_SHELL=[
  "./manifest.webmanifest",
  "./hstu-app-icon-192.png","./hstu-app-icon-512.png",
  "./hstu-app-maskable-512.png","./hstu-apple-touch-icon.png",
  "./hstu-favicon-64.png","./hstu-install-logo.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>Promise.allSettled(APP_SHELL.map(item=>cache.add(item))))
  );
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);

  // Never trap page navigation behind the service worker.
  // Try the live page first, with a short timeout; use the last good page only if offline.
  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),8000);
        const response=await fetch(event.request,{cache:"no-store",signal:controller.signal});
        clearTimeout(timer);
        if(response && response.ok) await cache.put("./index.html",response.clone());
        return response;
      }catch(err){
        return (await cache.match("./index.html")) || Response.redirect("./",302);
      }
    })());
    return;
  }

  // Branding/manifest: network first so installed-app identity stays current.
  if(/manifest\.webmanifest$|service-worker\.js$|hstu-(app|apple|favicon|install)/.test(url.pathname)){
    event.respondWith(
      fetch(event.request,{cache:"reload"})
        .then(response=>{
          if(response && response.ok){
            const copy=response.clone();
            caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
          }
          return response;
        })
        .catch(()=>caches.match(event.request))
    );
    return;
  }

  // Other same-origin assets: stale-while-revalidate.
  if(url.origin===self.location.origin){
    event.respondWith(
      caches.match(event.request).then(cached=>{
        const network=fetch(event.request).then(response=>{
          if(response && response.ok){
            const copy=response.clone();
            caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
          }
          return response;
        }).catch(()=>cached);
        return cached || network;
      })
    );
  }
});