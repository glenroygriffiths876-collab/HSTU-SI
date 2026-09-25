const CACHE_NAME="hstu-resource-centre-v20260925-gia-finder";
const APP_SHELL=[
  "./index.html",
  "./health-snake.html",
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

  /* IMPORTANT: health-snake.html is its own document.
     Never substitute index.html for this iframe navigation. */
  if(url.origin===self.location.origin && url.pathname.endsWith("/health-snake.html")){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=await cache.match("./health-snake.html");
      if(cached){
        event.waitUntil(
          fetch("./health-snake.html",{cache:"no-store"})
            .then(r=>{if(r&&r.ok)return cache.put("./health-snake.html",r.clone())})
            .catch(()=>{})
        );
        return cached;
      }
      const response=await fetch(event.request,{cache:"no-store"});
      if(response&&response.ok) await cache.put("./health-snake.html",response.clone());
      return response;
    })());
    return;
  }

  /* Main Resource Centre document only. */
  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=await cache.match("./index.html");
      if(cached){
        event.waitUntil(
          fetch("./index.html",{cache:"no-store"})
            .then(r=>{if(r&&r.ok)return cache.put("./index.html",r.clone())})
            .catch(()=>{})
        );
        return cached;
      }
      try{
        const response=await fetch(event.request,{cache:"no-store"});
        if(response&&response.ok) await cache.put("./index.html",response.clone());
        return response;
      }catch(e){
        return Response.error();
      }
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=await cache.match(event.request);
      if(cached){
        event.waitUntil(
          fetch(event.request,{cache:"no-store"})
            .then(r=>{if(r&&r.ok)return cache.put(event.request,r.clone())})
            .catch(()=>{})
        );
        return cached;
      }
      const response=await fetch(event.request);
      if(response&&response.ok) await cache.put(event.request,response.clone());
      return response;
    })());
  }
});