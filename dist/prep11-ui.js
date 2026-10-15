(function () {
  'use strict';
  const a=window.VersionCompassPrep11,d=a.data(),parsed=a.read(location.search),state=parsed.state,esc=a.esc;
  const main=document.querySelector('main');
  document.documentElement.classList.add('perspective-enabled');
  document.body.classList.add('editions-preview','prep11-view');
  document.title='Version Compass | Prep for Splunk 11.x';
  document.querySelector('.skip-link').href='#prep11-updates';
  const agentNote=document.querySelector('.agent-note');if(agentNote)agentNote.hidden=true;
  const options=(rows,value)=>Object.entries(rows).map(([key,label])=>'<option value="'+esc(key)+'"'+(key===value?' selected':'')+'>'+esc(label)+'</option>').join('');
  main.innerHTML='<section class="hero prep11-hero" aria-labelledby="prep11-title"><div class="eyebrow">SPLUNK ENTERPRISE · FUTURE RELEASE PREPARATION</div><h1 id="prep11-title">Prep for Splunk 11.x. <span>Plan with evidence.</span></h1><p class="dek">'+esc(d.summary)+'</p><div class="prep11-status"><strong>'+esc(d.evidenceStatus)+'</strong><p>'+esc(d.boundary)+'</p></div><p class="prep11-stats">'+d.announcements.length+' confirmed 11.x announcements · '+d.baseline.length+' preparation areas · '+d.questions.length+' open questions</p><p class="prep11-independent">Independent Version Compass guide · Public sources checked '+esc(d.checked)+'</p><div class="report-actions"><button id="copy-link" type="button">Copy report link</button><button id="print-report" type="button">Print / save PDF</button><span id="share-status" role="status"></span></div></section><div class="prep11-body"><aside id="prep11-warning" class="prep11-warning" role="alert" hidden></aside><div id="prep11-content"><section id="prep11-updates" class="prep11-section"><p class="kicker">01 / THE PUBLIC RECORD</p><h2>Public updates</h2><p>'+esc(d.announcementPolicy)+'</p><div class="prep11-controls"><label>Update type<select id="prep11-update-type">'+options(a.kinds,state.updates)+'</select></label></div><div id="prep11-update-list"></div></section><section id="prep11-prepare" class="prep11-section"><p class="kicker">02 / PREPARE NOW</p><h2>Build your preparation plan</h2><p>Start with documented current capabilities. Each action is preparation guidance; it does not establish an 11.x requirement.</p><div class="prep11-controls"><label>Preparation area<select id="prep11-area">'+options(a.tracks,state.area)+'</select></label><label>Find a topic<input id="prep11-search" type="search" maxlength="200" value="'+esc(state.q)+'" placeholder="Storage, apps, recovery…"></label></div><p id="prep11-count" role="status"></p><div id="prep11-records"></div></section><section id="prep11-questions" class="prep11-section"><p class="kicker">03 / STILL TO BE CONFIRMED</p><h2>The decisions that need release-specific evidence</h2><div class="prep11-question-grid">'+a.questions()+'</div></section><section id="prep11-sources" class="prep11-section"><p class="kicker">04 / PUBLIC EVIDENCE</p><h2>Sources and review scope</h2><p>Source access, source dates and claim verification are recorded separately. Existing 10.x and Kubernetes evidence remains current-release context. Saved HTML preserves this report; its external source links may change.</p><details><summary>View the complete source directory</summary>'+a.directory()+'</details><p>Updates are maintained with the existing Version Release Watch and independently reviewed by Guidance Audit. '+esc(d.monitoring.scope)+'</p><p><a href="'+esc(window.VersionCompassTheme?.href('/?product=platform&platform=enterprise')||'/?product=platform&platform=enterprise')+'">Open the released Enterprise upgrade guide →</a></p></section></div></div>'+a.report(state);
  const get=id=>document.getElementById(id);
  if(parsed.errors.length){
    get('prep11-warning').hidden=false;
    get('prep11-warning').innerHTML='<h2>This preparation link needs correction</h2><ul>'+parsed.errors.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul><p>Original input: <code>'+esc(parsed.original)+'</code></p><p>No replacement report or exports are available until you choose a fresh preparation view.</p><a href="'+esc(a.url({area:'all',updates:'all',q:'',theme:state.theme==='cisco'?'cisco':''}))+'">Open a fresh preparation view</a>';
    get('prep11-content').hidden=true;get('copy-link').disabled=true;get('print-report').disabled=true;
    document.querySelector('main>.prep11-report').remove();
  }
  function render(){
    if(parsed.errors.length)return;
    const records=a.matching(d.baseline,state);
    get('prep11-records').innerHTML=records.length?records.map(r=>a.record(r)).join(''):'<p class="prep11-empty">No matching preparation topics. Change the area or search to see more.</p>';
    get('prep11-count').textContent=records.length+' of '+d.baseline.length+' preparation areas';
    const updates=[...d.announcements,...(d.contextUpdates||[])].filter(r=>state.updates==='all'||r.kind===state.updates).sort((x,y)=>(y.sourceDate||'').localeCompare(x.sourceDate||''));
    get('prep11-update-list').innerHTML=updates.length?updates.map(r=>a.update(r)).join(''):'<p class="prep11-empty">No version-specific 11.x announcement is recorded in the public evidence checked '+esc(d.checked)+'. Open questions and current preparation guidance remain below.</p>';
    history.replaceState(null,'',a.url(state,location.hash));
    document.querySelector('main>.prep11-report').outerHTML=a.report(state);
  }
  get('prep11-area').addEventListener('change',e=>{state.area=e.target.value;render();});
  get('prep11-update-type').addEventListener('change',e=>{state.updates=e.target.value;render();});
  get('prep11-search').addEventListener('input',e=>{state.q=e.target.value;render();});
  get('copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(new URL(a.url(state,location.hash),location.origin).href);get('share-status').textContent='Link copied.';}catch{get('share-status').textContent='Copy this address: '+location.href;}});
  get('print-report').addEventListener('click',()=>window.print());
  window.VersionCompassBuildSnapshot=()=>{if(parsed.errors.length)throw Error('Correct the preparation link before exporting.');return a.report(state);};
  const header=document.querySelector('.site-header');
  new ResizeObserver(()=>document.documentElement.style.setProperty('--perspective-header-height',header.getBoundingClientRect().height+'px')).observe(header);
  render();
}());
