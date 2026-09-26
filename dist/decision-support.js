/* Decision summaries are projections of maintained evidence, not readiness scores. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(u,label)=>u?'<a href="'+esc(u)+'">'+esc(label)+'</a>':'';
function model(state,engine,editions){
 const environment=window.VersionCompassEnvironment?.assess(state)||{records:[],active:false};
 const features=engine?engine.selectedFeatures():[],technical=engine?engine.selectedTechnicalChanges():[];
 const readiness=engine?engine.selectedReadinessItems():[],compat=engine?.compatibilityAssessment();
 const issues=[];
 if(compat&&compat.status!=='ok')issues.push({title:compat.title,impact:compat.detail,question:'For '+state.product+' '+state.to+' on '+state.platform+' '+state.host+', what exact supported pairing and deployment prerequisites must we satisfy?',source:compat.source,target:'#compatibility-gate'});
 for(const r of environment.records.filter(r=>['conflicting','not_established'].includes(r.availability)||(r.regimes.some(x=>x!=='commercial')&&r.authorization!=='documented'))){
  issues.push({title:r.feature,impact:r.detail,question:'Is '+r.feature+' supported for '+r.provider+' in '+r.regionLabels.join(', ')+' under '+r.regimes.join(' / ')+'? Please confirm feature scope separately from offering authorization.',source:r.citations[0]?.url,target:'#environment-overview'});
 }
 if(environment.active&&!environment.records.length&&!environment.errors?.length)issues.push({title:'Environment evidence missing',impact:'No supporting record matches these filters. Availability is not established.',question:'Can Splunk provide dated evidence for this exact provider, region, compliance scope and product?',target:'#environment-overview'});
 if(editions)for(const c of editions.conflicts)issues.push({title:c.title,impact:c.meaning,question:c.question,source:editions.sources[c.claims[0].src[0]].u,target:'#conflict-'+c.id});
 const sources=new Set([...features,...technical,...readiness].map(r=>r.source).filter(Boolean));if(compat)sources.add(compat.source);
 const unverified=(window.VersionCompassSources?.sources||[]).filter(r=>sources.has(r.url)&&(!r.reviewed||['Needs reconciliation','Out of date'].includes(r.status)));
 if(unverified.length)issues.push({title:'Evidence needs review',impact:unverified.length+' cited sources have no recorded verification date or have unresolved findings. This does not prove their claims are wrong.',question:'Before approving this plan, can the affected version-specific requirements be checked against the current official documents?',source:unverified[0].url,target:'?view=about&source_search='+encodeURIComponent(unverified[0].url)+'#sources-title'});
 const keys=new Set([...features.map(f=>'feature:'+state.product+':'+f.title),...technical.map(t=>'technical:'+state.product+':'+t.component),...environment.records.map(r=>'environment:'+r.id)]);
 if(editions)editions.capabilities.forEach(c=>keys.add('edition:'+c.id));
 const changes=Object.entries(window.VersionCompassUpdates?.entries||{}).filter(([key])=>keys.has(key)).map(([key,e])=>({...e,key})).sort((a,b)=>b.date.localeCompare(a.date)||a.key.localeCompare(b.key));
 return {features,readiness,issues,changes,environment,compat};
}
function questions(items){return items.length?items.map(i=>'<article class="decision-question"><h4>'+esc(i.title)+'</h4><p><strong>Decision affected:</strong> '+esc(i.impact)+'</p><p><strong>Ask / verify:</strong> '+esc(i.question)+'</p><p>'+link(i.target,'View affected guidance')+' '+link(i.source,'Official evidence')+'</p></article>').join(''):'<p>No explicit unresolved issue is recorded for these selections. This is not confirmation that the environment is ready.</p>';}
function mount(id,state,engine,editions){
 const box=document.getElementById(id);if(!box)return;
 const m=model(state,engine,editions),summary=engine?window.VersionCompassGuidance.takeaway(state):null;
 const gains=summary?summary.highlights.map(i=>'<li>'+esc(i.text)+' '+link(i.source,'Source')+'</li>').join(''):'<li>Compare documented Essentials and Premier capabilities, with deployment and entitlement qualifications.</li>';
 const before=summary?.prerequisite;
 const validation=m.readiness.filter(i=>/Validate|Test/i.test(i.level)).slice(0,3);
 box.innerHTML='<h2 id="takeaway-title">'+(editions?'This comparison':'This route')+' at a glance</h2><div class="decision-grid"><div><h3>What you gain</h3><ul>'+gains+'</ul>'+link(editions?'#edition-matrix-title':'#value-title','Explore capabilities')+'</div><div><h3>What must happen first</h3><p>'+esc(before?.text||'Confirm deployment, licensing and supported service pairing before choosing an edition or planning rollout.')+'</p>'+link(before?.source,'Source')+' '+link(editions?'#edition-deployment':'#readiness-title','Review prerequisites')+'</div><div><h3>What needs validation</h3>'+(validation.length?'<ul>'+validation.map(i=>'<li>'+esc(i.title)+' '+link(i.source,'Source')+'</li>').join('')+'</ul>':'<p>Validate exact maintenance versions, integrations, permissions and deployment-specific requirements.</p>')+link(editions?'#edition-deployment':'#readiness-title','Review validation work')+'</div><div><h3>What remains uncertain</h3><p>'+esc(m.issues.length?m.issues.length+' recorded questions need resolution.':'No explicit unresolved question is recorded. Environment-specific validation is still required.')+'</p><a href="#decision-questions">Review questions</a></div></div><details id="decision-questions"><summary>Questions to resolve · '+m.issues.length+'</summary>'+questions(m.issues)+'</details><details id="comparison-changes"><summary>What changed for this comparison?</summary><p>Guide changes relevant to these selections, including markers that have rolled off. History begins September 25, 2026; absence of an entry is not proof of no upstream change.</p><label>On or after <input type="date" id="changes-since" value="2026-09-25" min="2026-09-25"></label><div id="comparison-change-list"></div></details><div class="report-provenance"><p>Live guidance · Content revision <code>'+esc(window.VersionCompassRevision?.id||'Not recorded')+'</code>. Shared links may change as evidence evolves.</p><button type="button" data-save-snapshot>Save dated snapshot (.html)</button><span class="snapshot-status" role="status"></span></div>';
 const input=box.querySelector('#changes-since'),list=box.querySelector('#comparison-change-list');
 function draw(){const rows=m.changes.filter(c=>!input.value||c.date>=input.value);list.innerHTML='<p>Guide changes on or after '+esc(input.value||'the start of recorded history')+'.</p><p role="status">'+rows.length+' recorded changes match this date and comparison.</p>'+rows.map(c=>'<article><h4>'+esc(c.date+' · '+c.kind+' · '+c.version)+'</h4><p>'+esc(c.detail)+'</p>'+link(c.source,'Supporting source')+'</article>').join('');}
 input.addEventListener('change',draw);draw();
}
window.VersionCompassDecision={model,mount,questions};
}());
