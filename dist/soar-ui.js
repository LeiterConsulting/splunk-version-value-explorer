(function(){
'use strict';
const api=window.VersionCompassSOAR,d=window.VersionCompassSOARData,parsed=api.read(location.search);let state=parsed.state,linkErrors=parsed.errors,model;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const themed=u=>window.VersionCompassTheme?.href(u)||u;
const labels={cmp:'Customer-managed (CMP)',cloud:'SOAR Cloud',commercial:'Commercial','fr-m':'FedRAMP Moderate','fr-h':'FedRAMP High',unspecified:'Not specified',unprivileged:'Unprivileged',privileged:'Privileged / conversion needed',supported:'Supported OS — exact version to verify',rhel7:'RHEL 7',centos7:'CentOS 7',al2:'Amazon Linux 2',aws:'AWS',gcp:'Google Cloud',azure:'Microsoft Azure'};
const fields={deployment:'SOAR deployment',from:'Current release',to:'Target release',installation:'Installation',os:'Current OS',compliance:'Environment',provider:'Provider',region:'Region'};
const values=k=>k==='from'?(d.releases[state.deployment]||d.releases.cmp):k==='to'?d.targets:api.options[k];
const options=k=>values(k).map(v=>'<option value="'+esc(v)+'">'+esc(labels[v]||v)+'</option>').join('');
const field=k=>'<label data-soar-field="'+k+'"><span>'+fields[k]+'</span><select data-soar="'+k+'">'+options(k)+'</select></label>';
document.documentElement.classList.add('perspective-enabled');document.body.classList.add('soar-view');
for(const href of ['perspectives.css','soar.css']){const css=document.createElement('link');css.rel='stylesheet';css.href=href;document.head.appendChild(css);}
new ResizeObserver(()=>document.documentElement.style.setProperty('--perspective-header-height',document.querySelector('.site-header').getBoundingClientRect().height+'px')).observe(document.querySelector('.site-header'));
const products=document.querySelector('.product-switcher').outerHTML;
document.querySelector('main').innerHTML='<section class="hero"><p class="eyebrow">SPLUNK SOAR</p><h1>Plan your SOAR update</h1>'+ (window.VersionCompassUpdates?.html('product:soar:introduction')||'') +'<div class="selector-card">'+products+'<div class="soar-controls">'+['deployment','from','to'].map(field).join('')+'</div><details class="soar-refine"><summary>Refine your environment</summary><div class="soar-controls">'+['installation','os','compliance','provider','region'].map(field).join('')+'</div></details><p class="soar-intro">Cloud service milestones and customer-managed upgrade paths, with requirements and evidence kept in scope.</p></div><div class="report-actions"><button id="copy-link" type="button">Copy comparison link</button><button id="print-report" type="button">Print / PDF</button><span id="share-status" role="status"></span></div></section><div id="soar-warnings" role="alert"></div><div id="results" tabindex="-1"></div><article id="release-report" class="release-report" aria-label="Complete SOAR report"></article>';
document.querySelectorAll('input[name="product"]').forEach(el=>{el.checked=el.value==='soar';el.addEventListener('change',()=>{location.href=themed('?product='+el.value);});});
function citations(ids){return ids.map(id=>{const s=d.sources[id];return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a><span class="soar-source-scope"> · '+esc(s.section)+' · Source checked '+esc(s.checked)+'</span>';}).join('<br>');}
function record(r){return '<article class="soar-record" id="soar-'+esc(r.id)+'"><h3>'+esc(r.title)+'</h3><p class="soar-meta">'+esc(r.status)+(r.release?' · '+esc(r.release):'')+'</p><p>'+esc(r.detail)+'</p>'+(r.qualification?'<p class="soar-qualification">'+esc(r.qualification)+'</p>':'')+'<details class="soar-evidence"><summary>Evidence and scope</summary><p>'+citations(r.src)+'</p><p>Claim verified: '+esc(r.verified||'Not established')+'. Applies only to the stated product, release and deployment.</p></details></article>';}
const list=a=>'<ul>'+a.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
function fullReport(m){
 const cloud=state.deployment==='cloud';
 const scope=['deployment','from','to',...(cloud?['compliance','provider','region']:['installation','os'])].map(k=>fields[k]+': '+(labels[state[k]]||state[k])).join(' · ');
 const restricted=cloud&&state.compliance==='fr-m'?record({id:'moderate-restrictions',title:'FedRAMP Moderate restrictions',status:'Required',detail:'Playbooks cannot use direct PostgreSQL access, cross-run filesystem sharing or direct vault filesystem access; use the automation APIs. Declared globals cannot be modified. Native data cannot be migrated from existing commercial or on-premises SOAR instances. Automation Brokers must run in FIPS mode.',src:['restricted'],verified:'2026-10-01'}):'';
 return '<section class="section" id="route-takeaway"><p class="kicker">YOUR SOAR COMPARISON</p><h2 id="path-title">'+esc(state.from)+' to '+esc(state.to)+'</h2><p>'+esc(scope)+'</p><p class="soar-route">'+esc(m.path.length?m.path.join(' → '):m.routeStatus)+'</p><p>'+esc(m.routeStatus)+'</p><p>'+citations([m.pathSource])+'</p>'+list(m.conditions)+'<p class="soar-alert"><strong>Before moving:</strong> '+esc(m.requirements.map(x=>x.title).join(' · '))+(m.issues.some(x=>x.id==='build243')?' · Confirm 8.7.0 build 243.':'')+'</p><details class="soar-summary"><summary>This route at a glance · '+m.features.length+' feature changes · '+m.issues.length+' issue / evidence notices · '+m.questions.length+' checks to resolve</summary><h3>What you gain</h3>'+list(m.features.map(x=>x.title))+'<h3>What must happen first</h3>'+list(m.requirements.map(x=>x.detail))+'<h3>What needs validation / remains uncertain</h3>'+list(m.questions)+'</details></section>'+
 '<section class="section" id="environment-overview"><h2>Deployment and availability</h2><p><strong>'+esc(m.availability.status)+'</strong> · '+esc(m.availability.detail)+'</p><p>'+citations(m.availability.src)+'</p>'+restricted+'</section>'+
 '<section class="section"><h2 id="value-title">Features along this route</h2><div class="soar-grid">'+(m.features.map(record).join('')||'<p>No additional feature is curated for this interval; consult the release notes for full coverage.</p>')+'</div></section>'+
 '<section class="section"><h2 id="breaking-title">Known issues and security</h2>'+m.issues.map(record).join('')+'</section>'+
 '<section class="section"><details class="technical-panel" id="technical-panel"><summary><span id="technical-title">Requirements &amp; dependencies</span></summary><div class="soar-technical"><h3>At the selected target</h3>'+m.requirements.concat(m.technical).map(record).join('')+'<p>Target requirements remain applicable even when introduced before your current release. App compatibility is not a recommendation to use an older or vulnerable platform patch.</p></div></details></section>'+
 '<section class="section"><h2 id="readiness-title">Resolve before scheduling</h2>'+list(m.questions)+'<h2 id="source-title">Evidence coverage</h2><p>'+esc(m.coverage)+'</p><p>Cloud 8.7 GA is dated September 2 in release notes; its known-issues heading says September 3, and the service table retains an inconsistent April label. These are recorded documentation discrepancies, not inferred rollout dates.</p><p><a href="'+esc(themed('?view=about'))+'">Browse the source register</a></p><p>Independent planning aid. No visitor data is collected. This report does not certify upgrade readiness or customer authorization.</p></section>';
}
function render(updateUrl=true){
 model=api.assess(state);const errors=[...new Set([...linkErrors,...model.errors])];
 document.querySelectorAll('[data-soar]').forEach(el=>{if(el.dataset.soar==='from')el.innerHTML=options('from');el.value=state[el.dataset.soar];});
 for(const k of ['installation','os'])document.querySelector('[data-soar-field="'+k+'"]').hidden=state.deployment==='cloud';
 for(const k of ['compliance','provider','region'])document.querySelector('[data-soar-field="'+k+'"]').hidden=state.deployment!=='cloud';
 document.getElementById('soar-warnings').innerHTML=errors.length?'<p>'+errors.map(esc).join('<br>')+'</p><button type="button" id="soar-reset">Use default SOAR comparison</button>':'';
 for(const id of ['copy-link','print-report'])document.getElementById(id).disabled=!!errors.length;
 document.getElementById('results').hidden=!!errors.length;document.getElementById('release-report').innerHTML='';
 if(errors.length){document.getElementById('soar-reset').onclick=()=>{state={...api.defaults};linkErrors=[];render();};return;}
 const open=document.getElementById('technical-panel')?.open,summary=document.querySelector('.soar-summary')?.open;
 document.getElementById('results').innerHTML=fullReport(model);document.getElementById('technical-panel').open=!!open;document.querySelector('.soar-summary').open=!!summary;
 document.title='Version Compass | SOAR '+state.from+' → '+state.to;
 if(updateUrl)history.replaceState(null,'',themed(api.url(state)));
}
document.querySelectorAll('[data-soar]').forEach(el=>el.addEventListener('change',()=>{const k=el.dataset.soar;state[k]=el.value;if(k==='deployment'&&!d.releases[state.deployment].includes(state.from))state.from='8.6.0';if(k==='provider')state.region='unspecified';linkErrors=[];render();}));
window.addEventListener('popstate',()=>{const p=api.read(location.search);state=p.state;linkErrors=p.errors;render(false);});
document.getElementById('copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);document.getElementById('share-status').textContent='Comparison link copied.';}catch{document.getElementById('share-status').textContent='Copy this link: '+location.href;}};
window.VersionCompassBuildSnapshot=()=>{if(linkErrors.length||model.errors.length)throw Error('Resolve selection warnings before exporting.');const html='<h1>'+esc(document.title)+'</h1>'+fullReport(model);return window.VersionCompassReports.decorate(html.replace(/<details\b/g,'<details open'));};
function prepare(){if(linkErrors.length||model.errors.length)return;document.getElementById('release-report').innerHTML=window.VersionCompassBuildSnapshot();document.documentElement.classList.add('printing-report');}
window.addEventListener('beforeprint',prepare);window.addEventListener('afterprint',()=>document.documentElement.classList.remove('printing-report'));
document.getElementById('print-report').onclick=()=>{prepare();window.print();};
window.VersionCompassPage={getSelection:()=>({product:"soar",platform:state.deployment==="cloud"?"cloud":"enterprise",from:state.from,to:state.to,installation:state.installation,os:state.os,environment:{provider:state.provider,region:state.region,compliance:state.compliance}}),getLinkContext:()=>({needsConfirmation:!!(linkErrors.length||model.errors.length)})};
render();
}());
