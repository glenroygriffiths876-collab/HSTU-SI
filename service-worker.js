const CACHE_NAME="hstu-resource-centre-v20261011-gia-unveiling-v3";
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
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    /* Never activate a navigation worker without a known-good app shell. */
    await cache.add(new Request("./index.html",{cache:"reload"}));
    await Promise.allSettled(
      APP_SHELL.filter(item=>item!=="./index.html").map(item=>cache.add(item))
    );
    self.skipWaiting();
  })());
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
    Returning visitors get the last known-good shell IMMEDIATELY on the first tap.
    A fresh copy is fetched in the background for the next navigation.
    First-ever visitors use the network because no service-worker cache exists yet.
  */
  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=await cache.match("./index.html");

      const refresh=(async()=>{
        try{
          const preload=await event.preloadResponse;
          const response=preload || await fetch(event.request,{cache:"no-store"});
          if(response&&response.ok) await cache.put("./index.html",response.clone());
          return response;
        }catch(_){
          return null;
        }
      })();

      if(cached){
        event.waitUntil(refresh);
        return cached.clone();
      }

      const network=await refresh;
      return network || Response.error();
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
