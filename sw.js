const CACHE='luo-english-v14-static-20261101-story50-pwa';
const ASSETS=['./','./index.html','./legacy-v11.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./family-adventure.png','./supplement-grades-3-6.json','./sample-import.json','./practice-expansion.json','./adventure-content.json'];
ASSETS.push(...Array.from({length:45},(_,i)=>'./stories/panel_'+String(i+1).padStart(2,'0')+'.png'));
ASSETS.push(...Array.from({length:5},(_,i)=>'./stories/episode_'+(i+46)+'.png'));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('luo-english-v14-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url),base=new URL('./',self.location.href);if(u.origin!==base.origin||!ASSETS.some(p=>new URL(p,base).pathname===u.pathname)||u.search)return;e.respondWith(e.request.mode==='navigate'?fetch(e.request).catch(()=>caches.match(e.request)):caches.match(e.request).then(r=>r||fetch(e.request)))});
