const CACHE_NAME="hstu-resource-centre-v20261011-first-click-v1";
const APP_SHELL=[
  "./index.html",
  "./health-snake.html",
  "./manifest.webmanifest",
  "./shanille-refinements.js","./research-catalogue.json","./repository-content.json",
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
  event.waitUntil((async()=>{
    await Promise.all(
      (await caches.keys())
        .filter(k=>k!==CACHE_NAME)
        .map(k=>caches.delete(k))
    );
    if(self.registration.navigationPreload){
      try{await self.registration.navigationPreload.enable();}catch(_){}
    }
    await self.clients.claim();
  })());
});

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);

  /* Health Arcade document: keep its own document and never substitute index.html. */
  if(url.origin===self.location.origin && url.pathname.endsWith("/health-snake.html")){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=await cache.match("./health-snake.html");
      const network=fetch("./health-snake.html",{cache:"no-store"})
        .then(async r=>{
          if(r&&r.ok) await cache.put("./health-snake.html",r.clone());
          return r;
        });
      if(cached){
        event.waitUntil(network.catch(()=>{}));
        return cached;
      }
      return network;
    })());
    return;
  }

  /*
    Main Resource Centre navigation:
    - Prefer a fresh network document when it arrives promptly.
    - If the browser/network stalls, show the cached shell after 1.2s instead of
      leaving the user looking at a blank page and needing to tap the link again.
    - Refresh the cache in the background, so the next entry remains current.
    - On a first-ever visit (no cache yet), wait for the network normally.
  */
  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=await cache.match("./index.html");

      const network=(async()=>{
        try{
          const preload=await event.preloadResponse;
          const response=preload || await fetch(event.request,{cache:"no-store"});
          if(response&&response.ok) await cache.put("./index.html",response.clone());
          return response;
        }catch(e){
          if(cached) return cached.clone();
          throw e;
        }
      })();

      if(!cached){
        try{return await network;}
        catch(_){return Response.error();}
      }

      event.waitUntil(network.catch(()=>{}));
      return Promise.race([
        network,
        sleep(1200).then(()=>cached.clone())
      ]);
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const critical=/\/(?:service-worker\.js|shanille-refinements\.js|research-catalogue\.json|repository-content\.json|pdf-library\.json)$/.test(url.pathname);

      if(critical){
        try{
          const response=await fetch(event.request,{cache:"no-store"});
          if(response&&response.ok) await cache.put(event.request,response.clone());
          return response;
        }catch(e){
          const cached=await cache.match(event.request);
          return cached||Response.error();
        }
      }

      const cached=await cache.match(event.request);
      if(cached){
        event.waitUntil(
          fetch(event.request,{cache:"no-store"})
            .then(async r=>{if(r&&r.ok) await cache.put(event.request,r.clone())})
            .catch(()=>{})
        );
        return cached;
      }

      try{
        const response=await fetch(event.request);
        if(response&&response.ok) await cache.put(event.request,response.clone());
        return response;
      }catch(_){
        return Response.error();
      }
    })());
  }
});
