/* Modo Caverna: app offline. A página vem da rede quando dá (para pegar atualizações) e do cache quando não dá. */
const CACHE='caverna-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

const guardar=(req,res)=>{if(res&&(res.ok||res.type==='opaque')){const c=res.clone();caches.open(CACHE).then(k=>k.put(req,c))}return res};

self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  // Fontes do Google: do cache primeiro; elas não mudam.
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>guardar(req,res))));
    return;
  }
  if(url.origin!==location.origin)return;
  // Arquivos do app: rede primeiro (com limite de tempo), cache como reserva.
  e.respondWith(new Promise(resolve=>{
    let feito=false;
    const doCache=()=>caches.match(req,{ignoreSearch:true}).then(r=>r||(req.mode==='navigate'?caches.match('./index.html'):undefined));
    const t=setTimeout(()=>doCache().then(r=>{if(r&&!feito){feito=true;resolve(r)}}),3000);
    fetch(req).then(res=>{clearTimeout(t);guardar(req,res);if(!feito){feito=true;resolve(res)}})
      .catch(()=>{clearTimeout(t);doCache().then(r=>{if(!feito){feito=true;resolve(r||Response.error())}})});
  }));
});
