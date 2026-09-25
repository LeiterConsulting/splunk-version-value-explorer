/* Deterministic CSP/region evidence, shared by UI, print and WebMCP. */
(function () {
  'use strict';
  const data=window.VersionCompassEnvironmentData;
  const keys=['csp','region','compliance','experience'];
  const labels={available:'Documented available',conditional:'Available with conditions',unavailable:'Documented unavailable',not_established:'Not established',conflicting:'Conflicting guidance'};
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const enabled=s=>s.product==='observability'||s.platform==='cloud'||s.platform==='migration'||s.view==='es-editions';
  function validate(input) {
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Cloud environment must be an object.');
    const result={};
    for(const key of Object.keys(input)){
      if(!keys.includes(key))throw Error('Unknown environment field: '+key);
      const allowed=key==='csp'?Object.keys(data.providers):key==='region'?data.regions.map(r=>r.id):key==='compliance'?Object.keys(data.regimes):Object.keys(data.experiences);
      if(typeof input[key]!=='string'||!allowed.includes(input[key]))throw Error('Unknown '+key+' selection. Choose a listed value.');
      result[key]=input[key];
    }
    if(result.csp&&result.region&&data.regions.find(r=>r.id===result.region).provider!==result.csp)throw Error('The region does not belong to the selected hosting provider.');
    return result;
  }
  function read(search){
    const p=new URLSearchParams(search),input={},errors=[];
    keys.forEach(k=>{if(p.has(k)){input[k]=p.get(k);if(p.getAll(k).length!==1)errors.push('The link repeats '+k+'.');}});
    try{return {value:validate(input),errors};}catch(e){return {value:{},errors:errors.concat(e.message)};}
  }
  function append(params,env){keys.forEach(k=>{params.delete(k);if(env&&env[k])params.set(k,env[k]);});return params;}
  function selectionText(env){return [env.csp&&data.providers[env.csp],env.region&&data.regions.find(r=>r.id===env.region)?.label,env.compliance&&data.regimes[env.compliance],env.experience&&data.experiences[env.experience]].filter(Boolean).join(' · ')||'All documented environments';}
  function assess(state){
    const environment=state.environment||{},errors=state.environmentErrors||[];
    const active=enabled(state)&&(Object.keys(environment).length>0||errors.length>0);
    const result={active,selection:environment,label:selectionText(environment),errors:errors.slice(),snapshotDate:data.checked,scope:'Current service evidence, separate from the selected historical release interval. Unlisted combinations and unqualified capabilities are not confirmed available. Authorization of an offering does not establish feature scope.',records:[],sources:[]};
    if(!active||errors.length)return result;
    const env=validate(environment),product=state.view==='es-editions'?'es':state.product;
    const products=product==='observability'?['observability']:product==='platform'?['platform']:['platform',product];
    result.records=data.records.filter(r=>products.includes(r.product)&&(!env.csp||r.provider===env.csp)&&(!env.region||r.regions.includes(env.region))&&(!env.compliance||r.regimes.includes(env.compliance))&&(!env.experience||!r.experience||r.experience===env.experience)).map(r=>Object.assign({},r,{availabilityLabel:labels[r.availability],regionLabels:r.regions.map(id=>data.regions.find(x=>x.id===id).label),citations:r.sources.map(key=>Object.assign({key},data.sources[key]))}));
    result.coverageNote=result.records.length?'Only the documented scopes below match these filters. Region lists are explicit; an omitted location is not an exclusion claim.':'No supporting record is established for this combination. This is not an unavailability or authorization determination.';
    if(product==='observability')result.productNote='These filters describe Observability hosting, independently of the connected Splunk platform and monitored workloads. The current evidence set does not establish Moderate or High feature coverage for Observability.';
    else if(product==='itsi')result.productNote='Platform rows describe ITSI’s host only. Product-specific FedRAMP feature coverage for ITSI is not established in this evidence set.';
    else if(product==='es')result.productNote='ES rows use the current 8.7 regional guide. Premier Moderate offering evidence does not certify every component, earlier ES release, or High availability.';
    if(env.compliance&&env.compliance!=='commercial')result.freshnessNote='The consolidated compliance matrix is dated February 2026. Its marks were not used to infer feature authorization; newer specific evidence is cited separately.';
    const sourceKeys=new Set(result.records.flatMap(r=>r.sources));sourceKeys.add('compliance');sourceKeys.add(product==='observability'?'o11y':'service');
    result.sources=[...sourceKeys].map(key=>Object.assign({key},data.sources[key]));
    return result;
  }
  function featureRecords(state,feature){
    const name=(feature.title||feature.name||'').toLowerCase();
    const names={ 'edge processor':/edge processor/, 'ingest processor':/ingest processor/, 'federated search for amazon s3':/federat.*s3/, 'federated analytics for amazon security lake':/security lake/, 'ingest actions':/ingest action/, 'security assistant':/ai assistant|security assistant/, 'ai assistant for spl':/ai assistant|agent mode/, 'agentic soc':/agentic|ai soc analyst|malware.*agent/, 'attack analyzer':/attack analyzer|threat analysis|malware|phishing/, 'soar':/soar/, 'database monitoring':/database monitoring/, 'es components beyond siem and soar':/ueba|threat intelligence|detection studio|exposure|assistant|agent|attack analyzer|threat analysis|malware|phishing|connector builder|automation builder|guided response|detection builder|playbook/ };
    return assess(state).records.filter(r=>r.product===(state.view==='es-editions'?'es':state.product)&&names[r.feature.toLowerCase()]?.test(name));
  }
  const link=s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a>';
  function recordHtml(r){return '<article class="env-record"><div class="env-record-head"><h4>'+esc(r.feature)+(window.VersionCompassUpdates?.html('environment:'+r.id)||'')+'</h4><span class="env-status env-'+r.availability+'">'+esc(r.availabilityLabel)+'</span></div><p class="env-scope">'+esc((r.product==='platform'?'Cloud Platform':r.product==='es'?'Enterprise Security':'Observability')+' · '+data.providers[r.provider]+' · '+r.regimes.map(x=>data.regimes[x]).join(' / ')+(r.experience?' · '+data.experiences[r.experience]+' Experience':'')+(r.realm?' · Realm '+r.realm:''))+'</p><p>'+esc(r.detail)+'</p><p class="env-regions"><strong>Regions:</strong> '+esc(r.regionLabels.join(', '))+'</p><p class="env-authorization"><strong>Authorization scope:</strong> '+(r.regimes.every(x=>x==='commercial')?'Not assessed for this commercial row.':r.authorization==='documented'?'Named offering documented; component scope remains separate.':'Not established for this feature by this record.')+'</p>'+ (r.claims?'<ul>'+r.claims.map(c=>'<li>'+esc(c.text)+' '+link(data.sources[c.source])+'</li>').join('')+'</ul>':'')+'<p class="env-evidence">'+r.citations.map(s=>link(s)+' · '+esc(s.published?'Source date '+s.published:'Source date unspecified')).join('<br>')+'<br>Checked '+esc(r.checked)+(r.effective?' · Effective entry '+esc(r.effective):'')+'</p></article>';}
  function body(state,printing=false){
    const a=assess(state);if(!a.active)return '';
    if(a.errors.length)return '<div class="env-warning" role="alert"><strong>Cloud environment link needs review</strong><p>'+esc(a.errors.join(' '))+' No environment assessment is shown. Choose filters again or clear them.</p></div>';
    const intro='<p class="env-selection"><strong>'+esc(a.label)+'</strong> · Evidence checked '+esc(a.snapshotDate)+'</p><p>'+esc(a.scope)+'</p><p>'+esc(a.coverageNote)+'</p>'+(a.productNote?'<p>'+esc(a.productNote)+'</p>':'')+(a.freshnessNote?'<p class="env-warning">'+esc(a.freshnessNote)+' '+link(data.sources.compliance)+'</p>':'');
    const conflicts=a.records.filter(r=>r.availability==='conflicting');
    const warning=conflicts.length?'<p class="env-warning"><strong>'+conflicts.length+' source conflict'+(conflicts.length===1?'':'s')+' need review:</strong> '+esc(conflicts.map(r=>r.feature).join(', '))+'. Both source statements are preserved below.</p>':'';
    const content=a.records.map(recordHtml).join('')||'<p>'+a.sources.map(link).join(' · ')+'</p>';
    return intro+warning+(printing?content:'<details class="env-records"><summary>'+a.records.length+' matching evidence records · availability, regions and sources</summary>'+content+'</details>');
  }
  function annotation(state,feature){const rows=featureRecords(state,feature);return rows.length?'<div class="env-feature-note"><strong>Current hosting guidance</strong><ul>'+rows.map(r=>'<li>'+esc(data.providers[r.provider]+' · '+r.regimes.map(x=>data.regimes[x]).join('/')+(r.experience?' · '+data.experiences[r.experience]+' Experience':'')+' · '+r.availabilityLabel+': '+r.detail)+' '+r.citations.map(link).join(' · ')+'</li>').join('')+'</ul></div>':'';}
  function controls(){return '<details class="env-controls" id="environment-controls"><summary>Cloud environment <span>Provider · region · Commercial / FR-M / FR-H</span></summary><p>Filter where the Splunk service is hosted, independently of where your workloads run. Leave a field unspecified to compare documented scopes.</p><div class="env-fields">'+[['csp','Hosting provider'],['region','Hosting region'],['compliance','Compliance environment'],['experience','Platform experience']].map(([k,label])=>'<label for="env-'+k+'">'+label+'<select id="env-'+k+'"></select></label>').join('')+'</div><button type="button" id="env-clear">Clear environment filters</button><p id="env-control-status" role="status"></p></details>';}
  function fill(state){
    const env=state.environment||{},panel=document.getElementById('environment-controls');if(!panel)return;
    panel.hidden=!enabled(state);
    const summary=panel.querySelector('summary');if(summary)summary.innerHTML='Cloud environment <span>'+esc(Object.keys(env).length?selectionText(env):'Provider · region · Commercial / FR-M / FR-H')+'</span>';
    keys.forEach(k=>{const el=document.getElementById('env-'+k);let opts=k==='csp'?Object.entries(data.providers):k==='compliance'?Object.entries(data.regimes):k==='experience'?Object.entries(data.experiences):data.regions.filter(r=>!env.csp||r.provider===env.csp).map(r=>[r.id,data.providers[r.provider]+' · '+r.label]);el.innerHTML='<option value="">All / unspecified</option>'+opts.map(([v,t])=>'<option value="'+esc(v)+'">'+esc(t)+'</option>').join('');el.value=env[k]||'';el.disabled=k==='experience'&&state.product==='observability';});
    if(state.environmentErrors?.length)panel.open=true;
    document.querySelectorAll('[data-site-link]').forEach(link=>{
      const url=new URL(link.getAttribute('href'),window.location.href);append(url.searchParams,enabled(state)?env:{});
      link.setAttribute('href',url.pathname+url.search+url.hash);
    });
  }
  function bind(state,render){
    keys.forEach(k=>document.getElementById('env-'+k).addEventListener('change',()=>{
      state.environmentErrors=[];state.environment=Object.assign({},state.environment);const value=document.getElementById('env-'+k).value;if(value)state.environment[k]=value;else delete state.environment[k];
      let notice='';if(k==='csp'&&state.environment.region&&value&&data.regions.find(r=>r.id===state.environment.region).provider!==value){delete state.environment.region;notice='Region cleared because the hosting provider changed.';}
      render();document.getElementById('env-control-status').textContent=notice;
    }));
    document.getElementById('env-clear').addEventListener('click',()=>{state.environment={};state.environmentErrors=[];render();});
  }
  window.VersionCompassEnvironment={data,keys,labels,validate,read,append,enabled,assess,body,controls,fill,bind,annotation,featureRecords,selectionText};
}());
