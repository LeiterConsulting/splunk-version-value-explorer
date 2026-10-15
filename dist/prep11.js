/* Public-source preparation model. Future plans never create released upgrade edges. */
(function () {
  'use strict';
  const data = () => window.SPLUNK_DATA.guidance.preparation11;
  const tracks = {all:'All preparation areas',infrastructure:'Infrastructure',apps:'Apps and integrations',operations:'Operations',cloud:'Cloud option'};
  const kinds = {all:'All public updates',announcement:'11.x announcements',context:'Current-release context'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function read(search) {
    const p = new URLSearchParams(search), errors = [];
    const allowed = ['view','theme','area','updates','q'];
    for (const key of new Set(p.keys())) {
      if (!allowed.includes(key)) errors.push('The field “'+key+'” is not part of this preparation page. Your original link has been retained.');
      if (p.getAll(key).length > 1) errors.push('The field “'+key+'” appears more than once.');
    }
    if (p.get('view') !== 'splunk-11') errors.push('This link does not identify the Splunk 11.x preparation page.');
    if (p.has('theme') && p.get('theme') !== 'cisco') errors.push('The requested theme is not recognized.');
    if (p.has('area') && !Object.hasOwn(tracks,p.get('area'))) errors.push('The preparation area is not recognized.');
    if (p.has('updates') && !Object.hasOwn(kinds,p.get('updates'))) errors.push('The update type is not recognized.');
    if ((p.get('q')||'').length > 200) errors.push('Search is limited to 200 characters.');
    return {state:{area:p.get('area')||'all',updates:p.get('updates')||'all',q:(p.get('q')||'').slice(0,200),theme:p.get('theme')||''},errors,original:search};
  }
  function url(state,hash='') {
    const p = new URLSearchParams({view:'splunk-11'});
    if (state.area !== 'all') p.set('area',state.area);
    if (state.updates !== 'all') p.set('updates',state.updates);
    if (state.q) p.set('q',state.q);
    if (state.theme === 'cisco') p.set('theme','cisco');
    return '/?'+p+hash;
  }
  function matching(records,state) {
    const query=state.q.toLocaleLowerCase();
    return records.filter(r=>(state.area==='all'||r.track===state.area)&&(!query||[r.title,r.text,r.action,r.qualification,r.version].join(' ').toLocaleLowerCase().includes(query)));
  }
  function source(key) { return window.SPLUNK_DATA.guidance.sources[key]; }
  function refs(keys,print=false) { return keys.map(key=>{
    const s=source(key), number=data().sourceIds.indexOf(key)+1;
    return '<a href="'+esc(print?'#prep11-ref-'+key:s.url)+'"'+(print?'':' target="_blank" rel="noopener noreferrer"')+'>['+number+']'+(print?'':' '+esc(s.title)+' ↗')+'</a>';
  }).join(' · '); }
  function record(r,print=false) {
    return '<article class="prep11-record" id="'+(print?'report-':'')+esc(r.id)+'"><p class="prep11-label">'+esc(r.status)+' · '+esc(r.version)+'</p><h3>'+esc(r.title)+'</h3><p>'+esc(r.text)+'</p><p class="prep11-qualification"><strong>Scope:</strong> '+esc(r.qualification)+'</p><p><strong>Prepare now:</strong> '+esc(r.action)+'</p><p class="prep11-evidence">Claim verified '+esc(r.verified)+' · '+refs(r.src,print)+'</p></article>';
  }
  function update(r,print=false) {
    return '<article class="prep11-record"><p class="prep11-label">'+esc(r.sourceDate||'Source date not recorded')+' · '+esc(r.status)+'</p><h3>'+esc(r.title)+'</h3><p>'+esc(r.text)+'</p><p class="prep11-qualification"><strong>Scope:</strong> '+esc(r.qualification)+'</p><p class="prep11-evidence">Claim verified '+esc(r.verified)+' · '+refs(r.src,print)+'</p></article>';
  }
  function questions() { return data().questions.map(q=>'<article class="prep11-question"><h3>'+esc(q.title)+'</h3><p>'+esc(q.text)+'</p><p><strong>Evidence to watch:</strong> '+esc(q.needed)+'</p></article>').join(''); }
  function directory() { return '<ol class="prep11-sources">'+data().sourceIds.map(key=>{const s=source(key);return '<li id="prep11-ref-'+esc(key)+'"><strong>'+esc(s.title)+'</strong><br><a href="'+esc(s.url)+'">'+esc(s.url)+'</a><p>Section: '+esc(s.section)+' · Source checked '+esc(s.checked)+' · Scope reviewed '+esc(s.reviewed)+'</p></li>';}).join('')+'</ol>'; }
  function report(state) {
    const d=data(), updates=[...d.announcements,...(d.contextUpdates||[])].sort((a,b)=>(b.sourceDate||'').localeCompare(a.sourceDate||''));
    const html='<article class="prep11-report-body"><header class="report-title"><p>VERSION COMPASS / FUTURE RELEASE PREPARATION</p><h1>Prep for Splunk 11.x</h1><p>Upcoming Enterprise 11.x+ · Evidence checked '+esc(d.checked)+'</p></header><p>Independent public-source preparation guide. Not an official Cisco or Splunk publication.</p><p>'+esc(d.boundary)+'</p><p>Screen selection: '+esc(tracks[state.area])+' · '+esc(kinds[state.updates])+(state.q?' · Search: '+esc(state.q):'')+'. This report includes the complete public update inventory, every preparation area, all open questions and numbered citations.</p><section class="report-section"><h2>Public updates</h2><p>'+esc(d.announcementPolicy)+'</p><p>'+d.announcements.length+' version-specific 11.x announcements recorded. Current-release context is labeled separately.</p>'+updates.map(r=>update(r,true)).join('')+'</section><section class="report-section"><h2>Prepare now</h2><p>These are editorial preparation actions supported by current documentation. They are not confirmed 11.x requirements.</p>'+d.baseline.map(r=>record(r,true)).join('')+'</section><section class="report-section"><h2>Still to be confirmed</h2>'+questions()+'</section><section class="report-section"><h2>Public sources and review scope</h2>'+directory()+'<p>'+esc(d.monitoring.scope)+'</p></section></article>';
    return '<div class="edition-report prep11-report">'+(window.VersionCompassReports?.decorate(html)||html)+'</div>';
  }
  window.VersionCompassPrep11={data,tracks,kinds,esc,read,url,matching,source,refs,record,update,questions,directory,report};
}());
