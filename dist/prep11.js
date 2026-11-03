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
    return '<article class="prep11-record" id="'+(print?'report-':'')+esc(r.id)+'"><div class="prep11-record-lead"><p class="prep11-label">'+esc(r.status)+' · '+esc(r.version)+'</p><h3>'+esc(r.title)+'</h3><p>'+esc(r.text)+'</p></div><p class="prep11-qualification"><strong>Scope:</strong> '+esc(r.qualification)+'</p><p><strong>Prepare now:</strong> '+esc(r.action)+'</p><p class="prep11-evidence">Claim verified '+esc(r.verified)+' · '+refs(r.src,print)+'</p>'+(r.reviewStatus?'<p class="prep11-qualification"><strong>Review status:</strong> '+esc(r.reviewStatus)+'</p>':'')+'</article>';
  }
  function update(r,print=false) {
    return '<article class="prep11-record"><div class="prep11-record-lead"><p class="prep11-label">'+esc(r.sourceDate||'Source date not recorded')+' · '+esc(r.status)+'</p><h3>'+esc(r.title)+'</h3><p>'+esc(r.text)+'</p></div><p class="prep11-qualification"><strong>Scope:</strong> '+esc(r.qualification)+'</p><p class="prep11-evidence">Claim verified '+esc(r.verified)+' · '+refs(r.src,print)+'</p>'+(r.reviewStatus?'<p class="prep11-qualification"><strong>Review status:</strong> '+esc(r.reviewStatus)+'</p>':'')+'</article>';
  }
  function questions(rows=data().questions) { return rows.map(q=>'<article class="prep11-question"><div class="prep11-question-lead"><h3>'+esc(q.title)+'</h3><p>'+esc(q.text)+'</p></div><p><strong>Evidence to watch:</strong> '+esc(q.needed)+'</p></article>').join(''); }
  function sourceItems() { return data().sourceIds.map(key=>{const s=source(key);return '<li id="prep11-ref-'+esc(key)+'"><div class="prep11-source-entry"><strong>'+esc(s.title)+'</strong><br><a href="'+esc(s.url)+'">'+esc(s.url)+'</a><p>Section: '+esc(s.section)+' · Source checked '+esc(s.checked)+' · Scope reviewed '+esc(s.reviewed)+'</p></div></li>';}); }
  function sourceList(items,start=1) { return items.length?'<ol class="prep11-sources'+(start>1?' prep11-source-continuation':'')+'"'+(start>1?' start="'+start+'"':'')+'>'+items.join('')+'</ol>':''; }
  function directory() { return sourceList(sourceItems()); }
  function report(state) {
    const d=data(), updates=[...d.announcements,...(d.contextUpdates||[])].sort((a,b)=>(b.sourceDate||'').localeCompare(a.sourceDate||''));
    const section=(title,lead,rest='')=>'<section class="report-section"><div class="prep11-section-lead"><h2>'+esc(title)+'</h2>'+lead+'</div>'+rest+'</section>';
    const sources=sourceItems();
    const html='<article class="prep11-report-body"><header class="report-title"><p>VERSION COMPASS / FUTURE RELEASE PREPARATION</p><h1>Prep for Splunk 11.x</h1><p>Upcoming Enterprise 11.x+ · Discovery checked '+esc(d.checked)+'</p></header><p>Independent public-source preparation guide. Not an official Cisco or Splunk publication.</p><p>'+esc(d.boundary)+'</p><p>Screen selection: '+esc(tracks[state.area])+' · '+esc(kinds[state.updates])+(state.q?' · Search: '+esc(state.q):'')+'. This report includes the complete public update inventory, every preparation area, all open questions and numbered citations.</p>'+
      section('Public updates','<p>'+esc(d.announcementPolicy)+'</p><p>'+d.announcements.length+' version-specific 11.x announcements recorded. Current-release context is labeled separately.</p>',updates.map(r=>update(r,true)).join(''))+
      section('Prepare now','<p>These are editorial preparation actions supported by current documentation. They are not confirmed 11.x requirements.</p>',d.baseline.map(r=>record(r,true)).join(''))+
      section('Still to be confirmed',questions(d.questions.slice(0,1)),questions(d.questions.slice(1)))+
      section('Public sources and review scope',sourceList(sources.slice(0,1)),sourceList(sources.slice(1),2)+'<p>'+esc(d.monitoring.scope)+'</p>')+'</article>';
    return '<div class="edition-report prep11-report">'+(window.VersionCompassReports?.decorate(html,undefined,{keepSectionLeads:true})||html)+'</div>';
  }
  window.VersionCompassPrep11={data,tracks,kinds,esc,read,url,matching,source,refs,record,update,questions,directory,report};
}());
