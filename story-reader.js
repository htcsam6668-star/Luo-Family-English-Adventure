/* Original user-provided story text. Reading never changes points or unlocks. */
(()=>{'use strict';
 const host=document.getElementById('stageDetail'),grid=document.getElementById('stageGrid');
 if(!host||!grid)return;
 let chapters=null,loading=null,request=0,current=null,font=22;
 try{const n=Number(localStorage.getItem('luo.story.font'));if(n>=18&&n<=36)font=n}catch{}
 const style=document.createElement('style');style.textContent='.story-reader{margin:22px 0;padding:clamp(16px,3vw,30px);border:1px solid #ded5ef;border-radius:20px;background:#fffdf8;color:#30264a}.story-reader .story-copy{font-size:var(--story-font,22px);line-height:2;white-space:pre-line;overflow-wrap:anywhere}.story-reader h4{font-size:1.15em;margin:26px 0 10px;color:#5c4399}.story-reader .reader-tools,.story-reader .reader-nav{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.story-reader .reader-nav button{flex:1;min-width:100px}.story-reader button{min-height:46px}.story-reader .reader-tools button{min-width:48px}.story-reader small{display:block;color:#776c85}@media(max-width:600px){.story-reader{padding:16px}.story-reader .story-copy{line-height:1.9}}';document.head.append(style);
 function validate(rows){if(!Array.isArray(rows)||rows.length!==50)throw Error('故事資料需要完整50話');return rows.map((c,i)=>{if(c.episode!==i+1||c.title!==ADVENTURE_CONTENT.titles[i]||!Array.isArray(c.sections)||c.sections.length!==4||c.sections.some(s=>typeof s.heading!=='string'||!s.heading.trim()||typeof s.text!=='string'||!s.text.trim()))throw Error('第'+(i+1)+'話故事資料不完整');return c})}
 async function load(){if(chapters)return chapters;if(!loading)loading=fetch('./chapters.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('無法載入故事正文');return r.json()}).then(validate).then(v=>chapters=v).finally(()=>loading=null);return loading}
 function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
 function button(text,fn){const b=node('button',text);b.type='button';b.onclick=fn;return b}
 function clear(){request++;current=null;host.querySelector('.story-reader')?.remove()}
 function navigate(n){if(!stageOpen(n))return;const b=grid.querySelector('[data-stage="'+n+'"]');if(b&&!b.disabled)b.click()}
 async function show(n){if(!Number.isInteger(n)||n<1||n>50||!stageOpen(n))return;const ticket=++request,childId=kid().id;current={n,childId};host.querySelector('.story-reader')?.remove();const reader=node('article',undefined,'story-reader');reader.dataset.episode=String(n);reader.setAttribute('aria-label','第'+n+'話故事正文');reader.style.setProperty('--story-font',font+'px');reader.append(node('p','故事正文載入中…'));host.append(reader);
  try{const rows=await load();if(ticket!==request||kid().id!==childId||!stageOpen(n)||!reader.isConnected)return;const c=rows[n-1];reader.replaceChildren();reader.append(node('small','第'+n+'話 · '+c.arc_name));reader.append(node('h3',c.title));const tools=node('div',undefined,'reader-tools'),size=node('span',font+' px');const smaller=button('A−',()=>resize(-2)),larger=button('A＋',()=>resize(2));smaller.setAttribute('aria-label','縮小故事字體');larger.setAttribute('aria-label','放大故事字體');function resize(d){font=Math.min(36,Math.max(18,font+d));reader.style.setProperty('--story-font',font+'px');size.textContent=font+' px';try{localStorage.setItem('luo.story.font',String(font))}catch{}}tools.append(smaller,larger,size);reader.append(tools);
  for(const s of c.sections){const section=node('section');section.append(node('h4',s.heading),node('p',s.text,'story-copy'));reader.append(section)}
  const nav=node('nav',undefined,'reader-nav');nav.setAttribute('aria-label','故事章節');const prev=button('← 上一話',()=>navigate(n-1)),next=button('下一話 →',()=>navigate(n+1));prev.disabled=n===1||!stageOpen(n-1);next.disabled=n===50||!stageOpen(n+1);nav.append(prev,next);reader.append(nav);if(n<50&&next.disabled)reader.append(node('small','繼續學英文、集星星，解鎖下一話！'));
  }catch(error){if(ticket!==request||!reader.isConnected)return;reader.replaceChildren(node('p','故事正文尚未載入，請先連網更新一次，再試一次。'),button('重試載入故事',()=>show(n)))}
 }
 grid.addEventListener('click',e=>{const b=e.target.closest('[data-stage]');if(b&&grid.contains(b)&&!b.disabled)show(Number(b.dataset.stage))});
 const priorChoose=chooseFamily;chooseFamily=function(id){clear();return priorChoose(id)};
 document.getElementById('familyHome').addEventListener('click',clear);
 window.addEventListener('luo-cloud-session',clear);
 // Poll refreshes can change cloud entitlement. Remove a now-locked reader.
 const priorRender=renderAdventure;renderAdventure=function(){priorRender();if(current&&(current.childId!==kid().id||!stageOpen(current.n)))clear()};
})();
