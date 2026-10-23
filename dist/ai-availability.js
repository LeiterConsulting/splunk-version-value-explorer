/* One public evidence model for the AI screen, comparison, print and saved HTML. */
(function () {
  'use strict';
  const data = () => window.SPLUNK_DATA.guidance.aiAvailability;
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const products = {all:'All products',platform:'Splunk Platform · SAIA',es:'Enterprise Security',itsi:'IT Service Intelligence'};
  const deployments = {cloud:'Splunk Cloud',enterprise:'Enterprise · cloud-connected AI'};
  const regimes = {commercial:'Commercial','fr-m':'FedRAMP Moderate','fr-h':'FedRAMP High'};
  const editions = {all:'Any ES edition',essentials:'ES Essentials',premier:'ES Premier'};
  const modes = {environment:'AI for my environment',compare:'Compare environments'};
  const statuses = {conditional:'Available with conditions',available:'Documented available',unavailable:'Documented unavailable',not_established:'Not established',conflicting:'Conflicting guidance'};
  const providers = () => ({all:'Any provider',...window.VersionCompassEnvironmentData.providers});
  const regions = () => [...window.VersionCompassEnvironmentData.regions,...data().serviceRegions];
  const versions = product => ['all',...new Set(data().capabilities.filter(r=>product==='all'||r.product===product).map(r=>r.evidenceVersion))];
  function read(search) {
    const p=new URLSearchParams(search),errors=[];
    const allowed=['view','theme','aiProduct','deployment','compliance','csp','region','edition','mode','aiVersion','q'];
    for(const key of new Set(p.keys())){
      if(!allowed.includes(key))errors.push('The field “'+key+'” is not part of AI Availability. The original link is retained.');
      if(p.getAll(key).length>1)errors.push('The field “'+key+'” appears more than once.');
    }
    if(p.get('view')!=='ai-availability')errors.push('This link does not identify AI Availability.');
    const defaults={aiProduct:'all',deployment:'cloud',compliance:'commercial',csp:'all',region:'all',edition:'all',mode:'environment',aiVersion:'all',q:'',theme:''};
    const state=Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,p.has(key)?p.get(key):value]));
    for(const [key,options]of Object.entries({aiProduct:products,deployment:deployments,compliance:regimes,csp:providers(),edition:editions,mode:modes})){
      if(!Object.hasOwn(options,state[key]))errors.push('The '+key+' selection is not recognized.');
    }
    if(!versions(state.aiProduct).includes(state.aiVersion))errors.push('The evidence version does not match this product.');
    const region=regions().find(r=>r.id===state.region);
    if(state.region!=='all'&&!region)errors.push('The service region is not recognized.');
    if(region&&state.csp!=='all'&&region.provider!==state.csp)errors.push('The service region and provider do not match.');
    if(p.has('theme')&&state.theme!=='cisco')errors.push('The requested theme is not recognized.');
    if(state.q.length>200)errors.push('Search is limited to 200 characters.');
    return {state,errors,original:search};
  }
  function url(state,hash=''){
    const p=new URLSearchParams({view:'ai-availability'});
    const defaults={aiProduct:'all',deployment:'cloud',compliance:'commercial',csp:'all',region:'all',edition:'all',mode:'environment',aiVersion:'all',q:'',theme:''};
    for(const key of Object.keys(defaults))if(state[key]!==defaults[key]&&state[key])p.set(key,state[key]);
    return '/?'+p+hash;
  }
  function source(id){return window.SPLUNK_DATA.guidance.sources[id];}
  function matching(state){
    const q=state.q.toLocaleLowerCase();
    return data().capabilities.filter(r=>(state.aiProduct==='all'||r.product===state.aiProduct)&&(state.aiVersion==='all'||r.evidenceVersion===state.aiVersion)&&(!q||[r.title,r.description,r.requirements,r.runtime,r.qualification].flat().join(' ').toLocaleLowerCase().includes(q)));
  }
  function assess(record,state){
    const d=data(),region=regions().find(r=>r.id===state.region);
    const provider=region?.provider||(state.csp==='all'?'':state.csp);
    const result=(availability,detail,extra=[])=>({availability,detail,authorization:'not_established',src:[...new Set([...record.src,...extra])],verified:record.verified});
    if(record.product==='es'){
      if(state.deployment==='cloud'&&region?.id.startsWith('us-gov-'))return result('unavailable','The ES 8.8 regional table excludes Security AI Assistant and Agentic SOC in both GovCloud regions. Offering authorization remains a separate question.',['aiEsRegions88']);
      if(state.compliance!=='commercial')return result('not_established','No capability-specific '+regimes[state.compliance]+' availability or authorization is established here. A hosting or offering listing is insufficient.');
      if(state.edition!=='all'&&!record.editions.includes(state.edition))return result('unavailable','The cited agent table lists this capability for '+record.editions.map(k=>editions[k]).join(' / ')+'.',['aiEsAgents88']);
      if(state.deployment==='enterprise'&&!record.deployments.includes('enterprise'))return result('unavailable','The cited capability row is Cloud only. This restriction is specific to this capability.',['aiEsAgents88']);
      if(state.deployment==='cloud'&&['gcp','azure'].includes(provider))return result('unavailable','The ES 8.8 GCP/Azure section lists ES and SOAR only; other components are unavailable.',['aiEsRegions88']);
      if(record.id==='ai-es-assistant'&&state.deployment==='enterprise'&&state.edition!=='premier')return result('not_established','Confirm edition-specific Cloud Connect entitlement. Generic compatibility does not establish Essentials access.',['aiEsEditions']);
      if(record.id==='ai-es-sop'){
        const prerequisite=assess(d.capabilities.find(r=>r.id==='ai-es-assistant'),state);
        if(['unavailable','not_established','conflicting'].includes(prerequisite.availability))return result(prerequisite.availability,'Required Security AI Assistant: '+prerequisite.detail,prerequisite.src);
      }
      if(region){
        if(state.edition!=='premier')return result('not_established','This initial regional mapping is verified for the ES 8.8 Premier and Cloud Connect tables. Select Premier to apply it; Essentials-specific regional mapping remains in the review backlog.',['aiEsRegions88']);
        const policy=state.deployment==='enterprise'?d.esCloudConnect:d.esPremier;
        if(state.deployment==='enterprise'&&record.id!=='ai-es-assistant')return result('not_established','The Cloud Connect regional component table does not independently establish this 8.8 agent’s regional rollout.',['aiEsRegions88','aiEsAgents88']);
        const exclusions=record.id==='ai-es-assistant'?policy.assistantExcluded:policy.agenticExcluded;
        if(exclusions.includes(region.id))return result('unavailable','The selected ES 8.8 table explicitly excludes this component in '+region.label+'.',['aiEsRegions88']);
        if(!policy.regions.includes(region.id))return result('not_established','The selected service region is not established by this capability’s scoped regional table.',['aiEsRegions88']);
      }else if(provider&&provider!=='aws')return result('not_established','A supported AI service region for this deployment has not been established.');
      return result('conditional',(region?'Regional evidence matches. ':'Select an exact service region to narrow the evidence. ')+record.condition+' ES 8.8 Controlled Availability access, entitlement and enablement still need confirmation.',['aiEsRegions88']);
    }
    if(state.compliance!=='commercial'||region?.id.startsWith('us-gov-')){
      return result('not_established',d.regulatedQualification+(record.id==='ai-saia-agent'?' The documented IL2 assistant excludes Agent Mode.':''),['aiSaiaInstall']);
    }
    if(region&&!d.saiaRegions.includes(region.id))return result('not_established','The selected region is not listed in the reviewed SAIA service table. Absence is not an unavailability claim.',['aiSaiaInstall']);
    if(!region&&provider&&!['aws','azure'].includes(provider))return result('not_established','This provider is not established by the reviewed SAIA region table.',['aiSaiaInstall']);
    if(record.product==='itsi'&&region)return result('not_established','The base SAIA service has regional evidence, but the ITSI subagent’s specific regional rollout is not independently established here. Its version prerequisites are documented.',['aiSaiaAbout']);
    return result('conditional',(region?'The SAIA service region is listed. ':'Select a listed SAIA service region. ')+record.condition);
  }
  function context(state){
    const region=regions().find(r=>r.id===state.region);
    return [products[state.aiProduct],deployments[state.deployment],regimes[state.compliance],providers()[state.csp],region?.label||'Any service region',editions[state.edition],state.aiVersion==='all'?'All evidence versions':'Evidence '+state.aiVersion].join(' · ');
  }
  function refs(ids,print=false){return ids.map(id=>{
    const s=source(id),n=data().sourceIds.indexOf(id)+1;
    return '<a href="'+esc(print?'#ai-ref-'+id:s.url)+'"'+(print?'':' target="_blank" rel="noopener noreferrer"')+'>['+n+']'+(print?'':' '+esc(s.title))+'</a>';
  }).join(' · ');}
  function record(r,state,print=false){
    const a=assess(r,state);
    return '<article class="ai-card" id="'+(print?'report-':'')+esc(r.id)+'"><div class="ai-card-meta"><span>'+esc(products[r.product])+'</span><span class="ai-status ai-'+esc(a.availability)+'">'+esc(statuses[a.availability])+'</span></div><h3>'+esc(r.title)+'</h3><p>'+esc(r.description)+'</p><p class="ai-version">'+esc(r.version)+' · '+esc(r.stage)+'</p><p class="ai-assessment">'+esc(a.detail)+'</p><details'+(print?' open':'')+'><summary>Requirements and evidence</summary><h4>Requirements</h4><ul>'+r.requirements.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p><strong>AI service:</strong> '+esc(r.runtime)+'</p><p><strong>Scope:</strong> '+esc(r.qualification)+'</p><p><strong>Authorization:</strong> Not established by this feature assessment.</p><p class="ai-evidence">Claim verified '+esc(r.verified)+' · '+refs(a.src,print)+'</p></details></article>';
  }
  function comparison(records,state,print=false){
    const columns=[['cloud','commercial','Commercial Cloud'],['enterprise','commercial','Enterprise / connected AI'],['cloud','fr-m','FedRAMP Moderate'],['cloud','fr-h','FedRAMP High']];
    return '<div class="ai-table-scroll" role="region" aria-label="AI environment comparison" tabindex="0"><table class="ai-matrix"><caption>Same product, region and edition filters; deployment and compliance vary by column. Not an authorization matrix.</caption><thead><tr><th scope="col">Capability</th>'+columns.map(c=>'<th scope="col">'+c[2]+'</th>').join('')+'</tr></thead><tbody>'+records.map(r=>'<tr><th scope="row">'+esc(r.title)+'</th>'+columns.map(([deployment,compliance])=>{const a=assess(r,{...state,deployment,compliance});return '<td><strong>'+esc(statuses[a.availability])+'</strong><p>'+esc(a.detail)+'</p>'+refs(a.src,print)+'</td>';}).join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  function directory(print=false){return '<ol class="ai-sources">'+data().sourceIds.map(id=>{const s=source(id);return '<li id="'+(print?'ai-ref-':'ai-screen-ref-')+esc(id)+'"><strong>'+esc(s.title)+'</strong><br><a href="'+esc(s.url)+'">'+esc(s.url)+'</a><p>Supporting section: '+esc(s.section)+' · Source checked '+esc(s.checked)+' · Scope reviewed '+esc(s.reviewed)+(s.retrieval?' · '+esc(s.retrieval):'')+'</p></li>';}).join('')+'</ol>';}
  function report(state){
    const rows=matching(state);
    const html='<article class="ai-report-body"><header class="report-title"><p>VERSION COMPASS / AI AVAILABILITY</p><h1>AI Availability</h1><p>'+esc(context(state))+'</p></header><p>Independent public-source feature guidance. Not a tenant-readiness or authorization certificate.</p><p>'+esc(data().boundary)+'</p><p>Search: '+esc(state.q||'None')+' · '+rows.length+' matching capabilities. Evidence versions are documentation scopes, not a test of your installed stack.</p>'+(state.mode==='compare'?'<section class="report-section"><h2>Environment comparison</h2>'+comparison(rows,state,true)+'</section>':'')+'<section class="report-section"><h2>Capabilities, requirements and limitations</h2>'+(rows.length?rows.map(r=>record(r,state,true)).join(''):'<p>No capabilities match these filters. This does not establish that no AI capabilities exist.</p>')+'</section><section class="report-section"><h2>Sources and verification scope</h2>'+directory(true)+'</section></article>';
    return '<div class="edition-report ai-report">'+(window.VersionCompassReports?.decorate(html)||html)+'</div>';
  }
  window.VersionCompassAIAvailability={data,esc,products,deployments,regimes,editions,modes,statuses,providers,regions,versions,read,url,source,matching,assess,context,refs,record,comparison,directory,report};
}());
