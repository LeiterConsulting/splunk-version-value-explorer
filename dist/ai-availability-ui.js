(function(){
  'use strict';
  const a=window.VersionCompassAIAvailability,d=a.data(),parsed=a.read(location.search),state=parsed.state,esc=a.esc;
  const main=document.querySelector('main');
  document.documentElement.classList.add('perspective-enabled');
  document.body.classList.add('editions-preview','ai-view');
  document.title='Version Compass | AI Availability';
  document.querySelector('.skip-link').href='#ai-selection';
  const agentNote=document.querySelector('.agent-note');if(agentNote)agentNote.hidden=true;
  const options=(rows,value)=>Object.entries(rows).map(([key,label])=>'<option value="'+esc(key)+'"'+(key===value?' selected':'')+'>'+esc(label)+'</option>').join('');
  const control=(label,id,rows,value)=>'<label>'+esc(label)+'<select id="'+id+'">'+options(rows,value)+'</select></label>';
  main.innerHTML='<section class="hero ai-hero" aria-labelledby="ai-title"><div class="eyebrow">SPLUNK PLATFORM · SECURITY · ITSI · OBSERVABILITY</div><h1 id="ai-title">AI Availability. <span>Know what you can use.</span></h1><p class="dek">Explore SAIA, Security AI Assistant, ITSI assistance and Observability AI, with the versions, service regions and prerequisites behind each capability.</p><p class="ai-hero-note">Public evidence checked '+esc(d.checked)+' · '+d.capabilities.length+' curated capabilities · Independent guidance</p><div class="report-actions"><button id="copy-link" type="button">Copy report link</button><button id="print-report" type="button">Print / save PDF</button><span id="share-status" role="status"></span></div></section><div class="ai-body"><aside id="ai-warning" class="ai-warning" role="alert" hidden></aside><div id="ai-content"><section id="ai-selection" class="ai-section"><p class="kicker">01 / YOUR CONTEXT</p><h2>Find AI for your environment</h2><p>Choose the product and AI service context. Requirements and availability stay specific to each capability.</p><div class="ai-controls">'+control('View','ai-mode',a.modes,state.mode)+control('Product','ai-product',a.products,state.aiProduct)+control('Deployment','ai-deployment',a.deployments,state.deployment)+control('Service environment','ai-compliance',a.regimes,state.compliance)+control('Hosting provider','ai-provider',a.providers(),state.csp)+control('AI service region','ai-region',{},state.region)+control('ES edition','ai-edition',a.editions,state.edition)+control('Evidence version','ai-version',{},state.aiVersion)+'<label>Find a capability<input id="ai-search" type="search" maxlength="200" placeholder="SPL, episodes, investigations…" value="'+esc(state.q)+'"></label></div><p id="ai-context-feedback" class="ai-note" role="status"></p><p class="ai-note">Evidence version identifies the documentation reviewed; it does not validate your installed versions. Region means the AI service location. SAIA-specific Azure labels are distinct from Platform geographic labels.</p></section><section id="ai-results" class="ai-section"><p class="kicker">02 / CAPABILITIES</p><h2 id="ai-result-title">AI capabilities and conditions</h2><p id="ai-count" role="status"></p><p id="ai-context" class="ai-note"></p><div id="ai-comparison" hidden></div><div id="ai-cards" class="ai-card-grid"></div></section><section id="ai-boundaries" class="ai-section"><p class="kicker">03 / READ THE SCOPE</p><h2>Availability, release stage and authorization are separate</h2><p>'+esc(d.boundary)+'</p><p>'+esc(d.regulatedQualification)+'</p><p>“Not established” means the reviewed evidence cannot answer that exact combination. It does not mean unavailable. ES 8.8 Controlled Availability does not guarantee access to an individual tenant. Model-runtime choice can change processing location; review the linked product guidance.</p></section><section id="ai-sources" class="ai-section"><p class="kicker">04 / PUBLIC EVIDENCE</p><h2>Sources and review scope</h2><details><summary>View sources and supporting sections</summary>'+a.directory()+'</details><p>Maintained by the existing Release, ES Editions and CSP/FedRAMP watches; Guidance Audit independently checks completeness. ES 8.8 Essentials uses its independently reviewed regional table. ITSI subagent-specific and CMP agent-specific regional rollout remain bounded verification backlog items.</p></section></div></div>'+a.report(state);
  const get=id=>document.getElementById(id);
  function regions(){
    const rows=a.regions().filter(r=>state.csp==='all'||r.provider===state.csp);
    get('ai-region').innerHTML=options({all:'Any service region',...Object.fromEntries(rows.map(r=>[r.id,a.providers()[r.provider]+' · '+r.label]))},state.region);
  }
  function versions(){get('ai-version').innerHTML=options(Object.fromEntries(a.versions(state.aiProduct).map(v=>[v,v==='all'?'All documented versions':v])),state.aiVersion);}
  regions();versions();
  if(parsed.errors.length){
    get('ai-warning').hidden=false;get('ai-warning').innerHTML='<h2>This AI availability link needs correction</h2><ul>'+parsed.errors.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul><p>Original input: <code>'+esc(parsed.original)+'</code></p><a href="'+esc(a.url({...a.read('?view=ai-availability').state,theme:state.theme==='cisco'?'cisco':''}))+'">Open a fresh AI Availability view</a>';
    get('ai-content').hidden=true;get('copy-link').disabled=true;get('print-report').disabled=true;document.querySelector('main>.ai-report').remove();
  }
  function render(){
    if(parsed.errors.length)return;
    const rows=a.matching(state);
    get('ai-count').textContent=rows.length+' of '+d.capabilities.length+' curated AI capabilities';
    get('ai-context').textContent=a.context(state);
    get('ai-comparison').hidden=state.mode!=='compare';
    get('ai-comparison').innerHTML=state.mode==='compare'?a.comparison(rows,state):'';
    get('ai-cards').innerHTML=rows.length?rows.map(r=>a.record(r,state)).join(''):'<p class="ai-empty">No capabilities match these filters. Change the product, evidence version or search. This is a curated inventory.</p>';
    get('ai-deployment').disabled=state.mode==='compare';get('ai-compliance').disabled=state.mode==='compare';
    get('ai-edition').disabled=state.aiProduct!=='es';
    history.replaceState(null,'',a.url(state,location.hash));
    document.querySelector('main>.ai-report').outerHTML=a.report(state);
  }
  const fields={'ai-mode':'mode','ai-product':'aiProduct','ai-deployment':'deployment','ai-compliance':'compliance','ai-provider':'csp','ai-region':'region','ai-edition':'edition','ai-version':'aiVersion'};
  for(const [id,key]of Object.entries(fields))get(id).addEventListener('change',e=>{
    state[key]=e.target.value;get('ai-context-feedback').textContent='';
    if(key==='csp'){
      const r=a.regions().find(r=>r.id===state.region);
      if(r&&state.csp!=='all'&&r.provider!==state.csp){state.region='all';get('ai-context-feedback').textContent='The previous service region did not match this provider and was cleared.';}
      regions();
    }
    if(key==='aiProduct'){
      if(!a.versions(state.aiProduct).includes(state.aiVersion)){state.aiVersion='all';get('ai-context-feedback').textContent='The evidence-version filter was reset for the selected product.';}
      versions();
    }
    render();
  });
  get('ai-search').addEventListener('input',e=>{state.q=e.target.value;render();});
  get('copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(new URL(a.url(state,location.hash),location.origin).href);get('share-status').textContent='Link copied.';}catch{get('share-status').textContent='Copy this address: '+location.href;}});
  get('print-report').addEventListener('click',()=>window.print());
  window.VersionCompassBuildSnapshot=()=>{if(parsed.errors.length)throw Error('Correct the AI availability link before exporting.');return a.report(state);};
  const header=document.querySelector('.site-header');
  new ResizeObserver(()=>document.documentElement.style.setProperty('--perspective-header-height',header.getBoundingClientRect().height+'px')).observe(header);
  render();
}());
