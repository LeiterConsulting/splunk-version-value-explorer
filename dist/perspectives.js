/* Shared perspective presentation; all evidence comes from the shared engine. */
(function(){
'use strict';
const E=window.VersionCompassEnvironment,original=E.body;
const choices={overview:'Decision overview',security:'Security & compliance',platform:'Platform & data operations',application:'Application observability',all:'All perspectives'};
const params=new URLSearchParams(location.search);let role=Object.hasOwn(choices,params.get('perspective'))?params.get('perspective'):'overview';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function preserve(value){const u=new URL(value,location.href);if(u.origin===location.origin){u.searchParams.delete('lab');u.searchParams.set('perspective',role);}return u.pathname+u.search+u.hash;}
for(const method of ['replaceState','pushState']){const fn=history[method].bind(history);history[method]=function(s,t,u){return fn(s,t,u?preserve(u):u)}}
// Existing copy controls use their own URL builders. Preserve preview on clipboard writes too.
if(navigator.clipboard?.writeText){const write=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=text=>{try{const u=new URL(text);if(u.origin===location.origin||u.hostname==='versioncompass.com'){u.searchParams.delete('lab');u.searchParams.set('perspective',role);text=u.href;}}catch{}return write(text);};}
document.addEventListener('click',event=>{const a=event.target.closest('a');if(!a)return;const u=new URL(a.href,location.href);if(u.origin===location.origin&&(!u.pathname||u.pathname==='/'||u.pathname.endsWith('index.html'))){a.href=preserve(u.href);}},true);
document.documentElement.classList.add('perspective-enabled');
const css=document.createElement('link');css.rel='stylesheet';css.href='perspectives.css';document.head.appendChild(css);
const header=document.querySelector('.site-header');
const area=document.createElement('div');area.className='perspective-controls';
const label=document.createElement('label');label.className='perspective-choice';label.innerHTML='Perspective <select aria-label="Viewing perspective">'+Object.entries(choices).map(([id,title])=>'<option value="'+id+'"'+(id===role?' selected':'')+'>'+title+'</option>').join('')+'</select>';area.append(label);
const select=label.querySelector('select');
let renderer=null,lastState=null;
const feedback=document.createElement('div');feedback.className='perspective-feedback';
const message=document.createElement('span');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
const reveal=document.createElement('button');reveal.type='button';reveal.textContent='View guidance';feedback.append(message,reveal);area.append(feedback);
select.setAttribute('aria-controls','environment-overview');
function describe(state){
 lastState=state;const a=E.assess(state),box=document.getElementById('environment-overview');
 area.hidden=!E.enabled(state)||!a.active||!box||box.hidden;
 if(area.hidden){area.remove();}
 else {
  let heading=box.querySelector('.cloud-environment-heading');
  if(!heading){heading=document.createElement('div');heading.className='cloud-environment-heading';const title=box.querySelector('h2');if(title){title.replaceWith(heading);heading.append(title);}else box.prepend(heading);}
  heading.append(area);
 }
 reveal.hidden=!E.enabled(state);
 if(!E.enabled(state)){message.textContent='Cloud guidance only · not applicable to this journey';return;}
 if(a.errors.length){message.textContent='Cloud filters need review before applying this view';return;}
 if(!a.active){message.textContent='Cloud guidance only · choose an environment to see differences';reveal.textContent='Choose environment';return;}
 reveal.textContent='View guidance';
 const count=a.records.filter(relevant).length,total=a.records.length;
 message.textContent=role==='overview'?'Cloud guidance · decision summary of '+total+' records':role==='all'?'Cloud guidance · all '+total+' records in comparison':count?'Cloud guidance · '+count+' of '+total+' records prioritized':'Cloud guidance · no matching priority records; full comparison retained';
}
window.VersionCompassPerspective={describe,setRenderer(fn){renderer=fn;}};
function update(value){
 role=Object.hasOwn(choices,value)?value:'overview';select.value=role;
 const u=new URL(location.href);u.searchParams.delete('lab');u.searchParams.set('perspective',role);history.replaceState(history.state,'',u.href);
 const box=document.getElementById('environment-overview');const disclosure=box?.querySelector('.perspective-full');const wasOpen=disclosure?.open;
 const x=window.scrollX,y=window.scrollY,restoreFocus=document.activeElement===select;
 if(renderer)renderer();
 // Preserve an explicitly open full comparison while changing the focused view.
 if(wasOpen){const next=box?.querySelector('.perspective-full');if(next)next.open=true;}
 if(lastState)describe(lastState);
 if(restoreFocus){
  if(!area.hidden)select.focus({preventScroll:true});
  else {const fallback=document.getElementById('environment-controls');if(fallback&&!fallback.hidden){fallback.setAttribute('tabindex','-1');fallback.focus({preventScroll:true});}}
 }
 window.scrollTo({left:x,top:y,behavior:'instant'});
 if(box&&!box.hidden){box.classList.remove('perspective-changed');requestAnimationFrame(()=>box.classList.add('perspective-changed'));}
}
select.addEventListener('change',e=>update(e.target.value));
window.addEventListener('popstate',()=>{const value=new URLSearchParams(location.search).get('perspective');role=Object.hasOwn(choices,value)?value:'overview';select.value=role;if(renderer)renderer();});
reveal.addEventListener('click',()=>{const box=document.getElementById('environment-overview');let target=box&&!box.hidden?(box.querySelector('.perspective-results')||box):document.getElementById('environment-controls');if(!target)return;if(target.tagName==='DETAILS')target.open=true;target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
new ResizeObserver(()=>document.documentElement.style.setProperty('--perspective-header-height',header.getBoundingClientRect().height+'px')).observe(header);
function relevant(r){return role==='security'?r.product==='es'||r.regimes.some(x=>x!=='commercial'):role==='platform'?r.product==='platform':role==='application'?r.product==='observability':true;}
E.body=function(state,printing=false){
 const base=original(state,printing),a=E.assess(state);if(!a.active||a.errors.length)return base;
 const root=document.createElement('div');root.innerHTML=original(state,true);
 const cards=[...root.querySelectorAll('.env-record')];cards.forEach(c=>c.remove());
 const intro=root.innerHTML;const items=a.records.map((r,i)=>({r,html:cards[i]?.outerHTML||''}));
 const conflict=items.filter(x=>x.r.availability==='conflicting');
 const priority=items.filter(x=>relevant(x.r)&&x.r.availability!=='conflicting');
 const full='<details class="perspective-full"'+(printing||role==='all'?' open':'')+'><summary>Complete availability comparison · '+items.length+' records</summary><table class="perspective-matrix"><thead><tr><th>Feature</th><th>Availability</th><th>Scope, qualifications & sources</th></tr></thead><tbody>'+items.map(({r,html})=>'<tr><th scope="row">'+esc(r.feature)+(window.VersionCompassUpdates?.html('environment:'+r.id)||'')+'</th><td><span class="env-status env-'+r.availability+'">'+esc(r.availabilityLabel)+'</span></td><td>'+html+'</td></tr>').join('')+'</tbody></table></details>';
 let focused='';
 if(role==='overview')focused='<div class="perspective-summary">'+['unavailable','conditional','not_established','available'].map(k=>{const rows=items.filter(x=>x.r.availability===k);return '<section><h4>'+esc(E.labels[k])+' · '+rows.length+'</h4>'+(rows.length?'<ul>'+[...new Set(rows.map(x=>x.r.feature))].map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>':'<p>No matching records.</p>')+'</section>';}).join('')+'</div>';
 else if(role!=='all')focused='<h3>Prioritized for '+esc(choices[role])+'</h3>'+(priority.length?priority.map(x=>x.html).join(''):'<p>No additional matching records for this perspective within the current filters. Explore the complete comparison or adjust the product and environment.</p>');
 return '<div class="perspective-results"><p class="perspective-report-label"><strong>'+esc(choices[role])+'</strong> · Current cloud guidance</p>'+intro+(conflict.length?'<section class="perspective-conflicts"><h3>Source conflicts need review</h3>'+conflict.map(x=>x.html).join('')+'</section>':'')+focused+'<p class="env-scope">Counts describe documented scopes, not unique features. Perspective is editorial organization; it does not establish availability or authorization.</p>'+full+'</div>';
};
}());
