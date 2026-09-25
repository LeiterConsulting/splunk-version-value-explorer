/* Shared perspective presentation; all evidence comes from the shared engine. */
(function(){
'use strict';
const E=window.VersionCompassEnvironment,original=E.body;
const choices={overview:'Decision overview',security:'Security & compliance',platform:'Platform & data operations',application:'Application observability',all:'All perspectives'};
const params=new URLSearchParams(location.search);const role=Object.hasOwn(choices,params.get('perspective'))?params.get('perspective'):'overview';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function preserve(value){const u=new URL(value,location.href);if(u.origin===location.origin){u.searchParams.delete('lab');u.searchParams.set('perspective',role);}return u.pathname+u.search+u.hash;}
for(const method of ['replaceState','pushState']){const fn=history[method].bind(history);history[method]=function(s,t,u){return fn(s,t,u?preserve(u):u)}}
// Existing copy controls use their own URL builders. Preserve preview on clipboard writes too.
if(navigator.clipboard?.writeText){const write=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=text=>{try{const u=new URL(text);if(u.origin===location.origin||u.hostname==='versioncompass.com'){u.searchParams.delete('lab');u.searchParams.set('perspective',role);text=u.href;}}catch{}return write(text);};}
document.addEventListener('click',event=>{const a=event.target.closest('a');if(!a)return;const u=new URL(a.href,location.href);if(u.origin===location.origin&&(!u.pathname||u.pathname==='/'||u.pathname.endsWith('index.html'))){a.href=preserve(u.href);}},true);
document.documentElement.classList.add('perspective-enabled');
const css=document.createElement('link');css.rel='stylesheet';css.href='perspectives.css';document.head.appendChild(css);
const header=document.querySelector('.site-header'),reviewed=header.querySelector('.reviewed');
const area=document.createElement('div');area.className='perspective-header';reviewed.replaceWith(area);area.append(reviewed);
const label=document.createElement('label');label.className='perspective-choice';label.innerHTML='Perspective <select aria-label="Viewing perspective">'+Object.entries(choices).map(([id,title])=>'<option value="'+id+'"'+(id===role?' selected':'')+'>'+title+'</option>').join('')+'</select>';area.append(label);
label.querySelector('select').addEventListener('change',e=>{const u=new URL(location.href);u.searchParams.delete('lab');u.searchParams.set('perspective',e.target.value);location.assign(u.href)});
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
