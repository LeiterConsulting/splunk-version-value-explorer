(function () {
  'use strict';
  const data = window.VersionCompassEditions;
  const params = new URLSearchParams(location.search);
  const environment=window.VersionCompassEnvironment, envLink=environment.read(location.search);
  const envState={product:'es',platform:'cloud',view:'es-editions',to:data.release,environment:envLink.value,environmentErrors:envLink.errors};
  const themed = value => {const u=new URL(value,'https://versioncompass.com/');environment.append(u.searchParams,envState.environment);const url=u.pathname+u.search+u.hash;return window.VersionCompassTheme ? window.VersionCompassTheme.href(url) : url;};
  const allowedFilters = ['all','essentials','premier','changed','review'];
  const state = { filter: allowedFilters.includes(params.get('filter')) ? params.get('filter') : 'all', query: (params.get('q') || '').slice(0,200), release: Object.hasOwn(data.history,params.get('release')) ? params.get('release') : data.release };
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const links = keys => keys.map(key => '<a href="'+esc(data.sources[key].u)+'" target="_blank" rel="noopener noreferrer">'+esc(data.sources[key].t)+' ↗</a>').join(' · ');
  const sources = keys => '<p class="edition-sources">'+links(keys)+'</p>';
  const jump = ids => '<p class="edition-jumps">'+ids.map(id=>'<a href="'+esc(themed('?view=es-editions&q='+encodeURIComponent(data.capabilities.find(c=>c.id===id).name)+'#edition-matrix-title'))+'">'+esc(data.capabilities.find(c=>c.id===id).name)+' →</a>').join('')+'</p>';
  const status = cell => '<strong class="edition-status status-'+esc(cell.v)+'">'+({yes:'Included',no:'Not included',part:'Conditional',review:'Confirm scope'}[cell.v])+'</strong><span>'+esc(cell.n || '')+'</span>';
  const refKeys = Object.keys(data.sources);
  const refs = keys => '<span class="report-citations">'+keys.map(key=>'<a href="#report-ref-'+esc(key)+'">['+(refKeys.indexOf(key)+1)+']</a>').join(' ')+'</span>';
  const reportCell = cell => '<strong>'+({yes:'Included',no:'Not included',part:'Conditional',review:'Confirm scope'}[cell.v])+'</strong><br>'+esc(cell.n || '');
  const reportHistory = () => '<h2>Cloud release history · ES '+esc(state.release)+'</h2><p>Selected Cloud matrix highlights; not a complete entitlement list or an on-premises assessment. '+refs(['matrix'])+'</p>'+[['Essentials (also in Premier)',data.history[state.release].e],['Premier column',data.history[state.release].p]].map(([title,items])=>'<h3>'+title+'</h3><ul>'+items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>').join('')+'<p>The matrix groups security-automation authoring under Premier in 8.7. Agent-specific scope differs; see the source questions in this report. '+refs(['matrix','agentic','rn87'])+'</p>';
  function report() { return `<article class="edition-report" aria-label="Printable ES editions report">
    <header class="report-title"><p>VERSION COMPASS / ENTERPRISE SECURITY</p><h1>Essentials &amp; Premier</h1><p class="report-subtitle">Capability comparison and deployment guidance</p><p>ES ${esc(data.release)} · Evidence reviewed ${esc(data.reviewed)} · Public-source edition comparison</p></header>
    <p class="report-disclaimer">Independent public-source comparison. Not an official Cisco or Splunk publication. <a href="${esc(themed('https://versioncompass.com/?view=es-editions'))}">Online comparison ↗</a></p>
    <p>This report includes all ${data.capabilities.length} capabilities and their qualifications, regardless of screen filters. Numbered citations link to the source directory. History reflects the selected release.</p>
    <section id="edition-environment-report" class="report-section"></section>
    <h2>Edition overview</h2><p><strong>Essentials:</strong> the shared SIEM foundation includes Detection Studio, TIM, Exposure Analytics and the ES AI Assistant. Deployment scope varies: Detection Studio and TIM reach on-premises through Cloud Connect; Essentials lists the assistant on Cloud where available. ${refs(['editions','cloudcx'])}</p>
    <p><strong>Premier:</strong> adds native SOAR, UEBA and Automated Threat Analysis; extends the assistant to on-premises through Cloud Connect. SOAR-dependent capabilities still require a supported, configured pairing. ${refs(['editions','regions'])}</p>
    <h2>What changed in ES 8.7</h2>${data.highlights.map(h=>'<div class="report-block"><h3>'+esc(h.title)+'</h3><p>'+esc(h.text)+' '+refs(h.src)+'</p></div>').join('')}
    <p class="report-callout"><strong>Availability questions:</strong> Connector Builder has a direct edition conflict. Guided Response has a version-and-enhancement scope ambiguity. Both are explained after the comparison; neither is treated as confirmed Essentials availability.</p>
    <section class="report-section"><h2>Capability comparison</h2><p>“Included” describes edition scope, not automatic activation. Read deployment and pairing requirements alongside each status.</p>
    <table class="report-matrix"><colgroup><col style="width:54%"><col style="width:23%"><col style="width:23%"></colgroup><thead><tr><th scope="col">Capability and requirements</th><th scope="col">Essentials</th><th scope="col">Premier</th></tr></thead><tbody>${data.capabilities.map(c=>`<tr><td><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>${c.flag ? '<p class="report-row-note">'+esc(c.flag)+'</p>' : ''}${refs(c.src)}</td><td>${reportCell(c.ess)}</td><td>${reportCell(c.prem)}</td></tr>`).join('')}</tbody></table></section>
    <section class="report-section"><h2>Source questions</h2>${data.conflicts.map(c=>`<div class="report-block report-question"><p class="report-label">${esc(c.kind)}</p><h3>${esc(c.title)}</h3>${c.claims.map((claim,i)=>'<p><strong>Source '+(i+1)+':</strong> '+esc(claim.text)+' '+refs(claim.src)+'</p>').join('')}<p><strong>Interpretation:</strong> ${esc(c.meaning)}</p><p><strong>Open question:</strong> ${esc(c.question)}</p></div>`).join('')}
    <h2>Capabilities in context</h2><p>These workflow groupings are editorial, not entitlement definitions.</p>${data.workflows.map(w=>'<div class="report-block"><h3>'+esc(w.title)+'</h3><p>'+esc(w.text)+' '+refs(w.src)+'</p></div>').join('')}</section>
    <section class="report-section"><h2>Deployment and licensing</h2>${data.notes.map(n=>'<div class="report-block"><h3>'+esc(n.title)+'</h3><p>'+esc(n.text)+'</p><p>'+esc(n.details)+' '+refs(n.src)+'</p></div>').join('')}</section>
    <section class="report-section" id="edition-report-history">${reportHistory()}</section>
    <section class="report-section report-references"><h2>Public sources</h2><p>Review dates belong to this evidence set. Conflicting or incomplete claims remain qualified. Links are clickable in PDF exports that preserve hyperlinks.</p><ol>${refKeys.map(key=>'<li id="report-ref-'+esc(key)+'"><strong>'+esc(data.sources[key].t)+'</strong> · Checked '+esc(data.sources[key].reviewed)+'<br><a href="'+esc(data.sources[key].u)+'">'+esc(data.sources[key].u)+'</a></li>').join('')}</ol></section>
  </article>`; }
  document.title = 'Version Compass | ES editions comparison';
  const agentNote = document.querySelector('.agent-note'); if (agentNote) agentNote.hidden = true;
  document.querySelector('.skip-link').href = '#edition-comparison';
  document.querySelector('main').innerHTML = `
    <section class="hero edition-hero" aria-labelledby="edition-title">
      <div class="eyebrow">ENTERPRISE SECURITY · EDITION COMPARISON</div>
      <h1 id="edition-title">Two editions.<br><span>See the differences.</span></h1>
      <p class="dek">Essentials and Premier, with deployment boundaries, prerequisites, and the public sources behind every comparison.</p>
      <div class="edition-preview-note">Independent Version Compass comparison. Not an official Cisco or Splunk tool.</div>
      ${environment.controls()}
      <div class="edition-toolbar"><a href="${esc(themed('./'))}">← Release upgrade guide</a><button id="edition-copy" type="button">Copy comparison link</button><button id="edition-print" type="button">Print / save PDF</button><span id="edition-share-status" role="status"></span></div>
    </section>
    <div class="edition-body" id="edition-comparison">
      <section id="environment-overview" class="env-overview" aria-label="Cloud environment guidance" hidden></section>
      <p class="edition-asof">Edition snapshot: ES ${esc(data.release)} · Sources checked ${esc(data.reviewed)} · ${links(['rn87','editions'])}</p>
      <nav class="edition-section-nav" aria-label="Editions sections"><a href="#edition-matrix-title">Compare</a><a href="#edition-conflicts">Source questions</a><a href="#edition-workflows">Workflows</a><a href="#edition-deployment">Deployment &amp; licensing</a><a href="#edition-history-title">History</a></nav>
      <div class="edition-cards">
        <article><p class="kicker">THE SHARED FOUNDATION</p><h2>Essentials</h2><p>The core SIEM workflow spans detection, triage, investigation, response and case management.</p><ul><li><strong>Detection and intelligence:</strong> Detection Studio and TIM run on Cloud, with on-premises access through Cloud Connect.</li><li><strong>Exposure context:</strong> Exposure Analytics is listed for Cloud and on-premises.</li><li><strong>AI assistance:</strong> Essentials lists the ES assistant on Cloud, where available. Individual agents have separate requirements.</li></ul>${sources(['editions'])}</article>
        <article class="edition-premier"><p class="kicker">EXTENDS ESSENTIALS</p><h2>Premier</h2><p>Includes the Essentials foundation and adds automation, behavioral analytics and threat analysis.</p><ul><li><strong>SOAR:</strong> included natively, with a supported, configured pairing still required for dependent agents.</li><li><strong>UEBA:</strong> native behavioral analytics on Cloud and on-premises; coverage differs by deployment.</li><li><strong>Threat analysis:</strong> powered by Attack Analyzer, Cloud only where available.</li><li><strong>AI assistant:</strong> extends on-premises access through Cloud Connect.</li></ul>${sources(['editions','ueba','regions'])}</article>
      </div>
      <section class="edition-highlights"><p class="kicker">RELEASE SPOTLIGHT · ES ${esc(data.release)}</p><h2>What changed in 8.7</h2><div class="edition-three-grid">${data.highlights.map(h=>`<article><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p>${sources(h.src)}</article>`).join('')}</div></section>
      <aside class="edition-caution"><strong>${data.conflicts.length} source questions need clarification.</strong> Edition scope, agent-version prerequisites and commercial eligibility have distinct qualifications. <a href="#edition-conflicts">Read the evidence side by side ↓</a></aside>
      <section class="edition-matrix-section" aria-labelledby="edition-matrix-title">
        <div class="edition-heading"><div><p class="kicker">01 / COMPARE CAPABILITIES</p><h2 id="edition-matrix-title">Essentials → Premier</h2></div><p>Read the purpose and deployment scope at a glance; follow the linked evidence for implementation guidance. These rows describe the current ${esc(data.release)} snapshot.</p></div>
        <div class="edition-controls"><label>Find a capability<input id="edition-search" type="search" maxlength="200" placeholder="Search capabilities and prerequisites" value="${esc(state.query)}"></label><label>Show<select id="edition-filter"><option value="all">All capabilities</option><option value="essentials">Included in Essentials</option><option value="premier">Premier additions</option><option value="changed">New or updated in 8.7</option><option value="review">Confirm scope</option></select></label></div>
        <p id="edition-count" role="status"></p><p class="edition-print-note">Printed report includes every capability and its citations. Search filters do not omit content.</p>
        <div class="edition-column-labels" aria-hidden="true"><span>Capability / public sources</span><span>Essentials</span><span>Premier</span></div>
        <div id="edition-rows">${data.capabilities.map(c => `<article class="edition-row" data-id="${esc(c.id)}"><div class="edition-row-grid"><div><h3>${esc(c.name)}</h3><small>${esc(c.lane)}${c.tag ? ' · '+({new:'New in 8.7',updated:'Updated in 8.7',conf:'September announcement'}[c.tag]) : ''}</small><p class="edition-description">${esc(c.desc)}</p>${sources(c.src)}<div id="env-cap-${esc(c.id)}"></div></div><div class="edition-cell"><span class="edition-mobile-label">Essentials</span>${status(c.ess)}</div><div class="edition-cell"><span class="edition-mobile-label">Premier</span>${status(c.prem)}</div></div>${c.ess.v === 'review' ? '<p class="edition-qualification"><strong>'+ (c.id==='connector-builder'?'Edition conflict: ':'Scope question: ')+'</strong><a href="#conflict-'+esc(c.id)+'">Compare the two source statements and what remains unresolved ↓</a></p>' : ''}${c.flag && c.ess.v !== 'review' ? '<details><summary>Additional qualification</summary><p>'+esc(c.flag)+'</p>'+sources(c.src)+'</details>' : ''}</article>`).join('')}</div>
        <p id="edition-empty" hidden>No matching capabilities. Try another search or filter.</p>
      </section>
      <section class="edition-detail-section" id="edition-conflicts"><p class="kicker">02 / READ THE EVIDENCE</p><h2>What is unresolved—and why</h2><p>These are different kinds of uncertainty. None is silently converted into an inclusion or exclusion claim.</p>${data.conflicts.map(c=>`<article class="edition-conflict" id="conflict-${esc(c.id)}"><p class="kicker">${esc(c.kind)}</p><h3>${esc(c.title)}</h3><div class="edition-cards">${c.claims.map((claim,i)=>`<article><strong>Source ${i+1} says</strong><p>${esc(claim.text)}</p>${sources(claim.src)}</article>`).join('')}</div><p><strong>How to read this:</strong> ${esc(c.meaning)}</p><p class="edition-qualification"><strong>Open question:</strong> ${esc(c.question)}</p></article>`).join('')}</section>
      <section class="edition-detail-section" id="edition-workflows"><p class="kicker">03 / PUT FEATURES IN CONTEXT</p><h2>How the capabilities fit the work</h2><p>Version Compass groups these capabilities to explain their roles. These groupings are editorial; use the comparison for edition and deployment scope.</p><div class="edition-note-grid">${data.workflows.map(w=>`<article><h3>${esc(w.title)}</h3><p>${esc(w.text)}</p>${sources(w.src)}${jump(w.ids)}</article>`).join('')}</div></section>
      <section class="edition-detail-section" id="edition-deployment"><p class="kicker">04 / DEPLOYMENT & LICENSING</p><h2>The boundaries that matter</h2><div class="edition-note-grid">${data.notes.map(note => `<article id="note-${esc(note.id)}"><h3>${esc(note.title)}</h3><p>${esc(note.text)}</p><details><summary>Read the practical details</summary><p>${esc(note.details)}</p></details>${sources(note.src)}</article>`).join('')}</div></section>
      <section class="edition-history-section"><p class="kicker">05 / RELEASE HISTORY</p><h2 id="edition-history-title">How the Cloud editions evolved</h2><p>Release-specific highlights from Splunk’s Cloud matrix—not complete entitlements or an on-premises compatibility assessment. Selecting a release changes only this history panel.</p><label class="edition-history-control">History release<select id="edition-history">${Object.keys(data.history).map(v=>'<option value="'+v+'">ES '+v+'</option>').join('')}</select></label><div id="edition-timeline"></div><p class="edition-qualification">The matrix groups security-automation authoring under Premier in 8.7; the agent compatibility table differs for specific agents. The history preserves the matrix’s grouping rather than silently rewriting it.</p>${sources(['matrix','agentic','rn87'])}</section>
      <details class="edition-provenance"><summary>Public sources and review scope</summary><p>Source checks apply to the edition snapshot above. The header links to the latest site release note; it does not imply every source was rechecked on that date. Unknown or conflicting entitlements remain unresolved.</p><ul>${Object.values(data.sources).map(s=>'<li><a href="'+esc(s.u)+'" target="_blank" rel="noopener noreferrer">'+esc(s.t)+'</a> · checked '+esc(s.reviewed)+'</li>').join('')}</ul></details>
      <p class="edition-print-url"></p>
    </div>${report()}`;
  const query = document.getElementById('edition-search'), filter = document.getElementById('edition-filter'), release = document.getElementById('edition-history');
  filter.value = state.filter; release.value = state.release;
  function url() { const p = new URLSearchParams({view:'es-editions'}); if(state.filter!=='all')p.set('filter',state.filter);if(state.query)p.set('q',state.query);p.set('release',state.release);return themed(location.pathname+'?'+p); }
  function syncUrl() { if(envState.environmentErrors.length)return;history.replaceState(null,'',url()+(location.hash || ''));document.querySelector('.edition-print-url').textContent='Comparison link: https://versioncompass.com'+url(); }
  function apply() {
    let count=0;
    data.capabilities.forEach(c=>{const match=(state.filter==='all'||state.filter==='essentials'&&['yes','part'].includes(c.ess.v)||state.filter==='premier'&&c.ess.v==='no'&&c.prem.v!=='no'||state.filter==='changed'&&['new','updated'].includes(c.tag)||state.filter==='review'&&c.ess.v==='review')&&JSON.stringify(c).toLowerCase().includes(state.query.toLowerCase());document.querySelector('[data-id="'+c.id+'"]').hidden=!match;if(match)count++;});
    document.getElementById('edition-count').textContent=count+' of '+data.capabilities.length+' capabilities';document.getElementById('edition-empty').hidden=count>0;syncUrl();
  }
  function timeline() { document.getElementById('edition-report-history').innerHTML=reportHistory(); const entry=data.history[state.release];document.getElementById('edition-timeline').innerHTML='<h3>ES '+esc(state.release)+' · Cloud matrix highlights</h3><div class="edition-cards">'+[['Essentials (also in Premier)',entry.e],['Premier column',entry.p]].map(([title,items])=>'<article><h3>'+title+'</h3><ul>'+items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul></article>').join('')+'</div>';syncUrl(); }
  query.addEventListener('input',()=>{state.query=query.value.trim();apply();});filter.addEventListener('change',()=>{state.filter=filter.value;apply();});release.addEventListener('change',()=>{state.release=release.value;timeline();});
  document.getElementById('edition-copy').addEventListener('click',async()=>{const target='https://versioncompass.com'+url();const el=document.getElementById('edition-share-status');try{await navigator.clipboard.writeText(target);el.textContent='Comparison link copied.';}catch(_){el.textContent='Copy this link: '+target;}});
  function printEnvironment(){
    let html=environment.body(envState,true);const urls=[],numbers=new Map();
    html=html.replace(/<a href="(https?:[^" ]+)"[^>]*>([\s\S]*?)<\/a>/g,(_a,url,label)=>{if(!numbers.has(url)){numbers.set(url,urls.length+1);urls.push({url,label});}return '<a href="#env-source-'+numbers.get(url)+'">'+label+' [E'+numbers.get(url)+']</a>';});
    return html+'<h3>Environment sources</h3><ol>'+urls.map((s,i)=>'<li id="env-source-'+(i+1)+'">[E'+(i+1)+'] '+s.label+'<br><a href="'+s.url+'">'+s.url+'</a></li>').join('')+'</ol>';
  }
  function renderEnvironment(){
    environment.fill(envState);const a=environment.assess(envState),box=document.getElementById('environment-overview');
    box.hidden=!a.active;box.innerHTML=a.active?'<h2>Cloud environment</h2>'+environment.body(envState):'';
    document.getElementById('edition-environment-report').innerHTML=a.active?'<h2>Cloud environment</h2>'+printEnvironment():'';
    data.capabilities.forEach(c=>{document.getElementById('env-cap-'+c.id).innerHTML=environment.annotation(envState,c);});
    document.getElementById('edition-copy').disabled=envState.environmentErrors.length>0;document.getElementById('edition-print').disabled=envState.environmentErrors.length>0;
    syncUrl();
  }
  environment.bind(envState,renderEnvironment);renderEnvironment();
  let beforePrint=null;
  function expandPrint(){if(beforePrint)return;beforePrint=[...document.querySelectorAll('main details')].map(el=>[el,el.open]);beforePrint.forEach(([el])=>el.open=true);}
  function restorePrint(){if(!beforePrint)return;beforePrint.forEach(([el,open])=>el.open=open);beforePrint=null;}
  window.addEventListener('beforeprint',expandPrint);window.addEventListener('afterprint',restorePrint);
  document.getElementById('edition-print').addEventListener('click',()=>{expandPrint();window.print();});
  apply();timeline();
}());
