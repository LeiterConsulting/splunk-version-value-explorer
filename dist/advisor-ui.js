/* Explicit decision -> relevant context -> captured brief. All profiles remain local. */
(function () {
  'use strict';
  const a=window.VersionCompassAdvisor,esc=a.esc,parsed=a.read(location.search);
  const main=document.querySelector('main'),profileKey='versioncompass-advisor-profile-v1',handoffKey='versioncompass-advisor-handoff-v1';
  let state=parsed.state,brief=null;
  const theme=new URLSearchParams(location.search).get('theme')==='cisco'?'cisco':'';
  document.documentElement.classList.add('perspective-enabled');
  document.body.classList.add('editions-preview','advisor-view');
  document.title='Version Compass | Advisor decision briefs';
  const skip=document.querySelector('.skip-link');skip.href='#advisor-decisions';skip.textContent='Skip to Advisor decisions';
  document.querySelector('.agent-note')?.setAttribute('hidden','');
  const stamp=goal=>{const review=a.review(goal.id);return review.ok?'Assessed public documentation':'Evidence review needed';};
  const card=goal=>'<button type="button" class="advisor-decision-card" data-advisor-goal="'+goal.id+'" aria-pressed="false" aria-controls="advisor-context" aria-describedby="coverage-'+goal.id+' boundary-'+goal.id+'"><span class="advisor-card-status">'+esc(stamp(goal))+'</span><span class="advisor-card-title">'+esc(goal.title)+'</span><span class="advisor-card-question">'+esc(goal.question)+'</span><span id="coverage-'+goal.id+'" class="advisor-card-scope"><strong>Can answer</strong> '+esc(goal.coverage)+'</span><span id="boundary-'+goal.id+'" class="advisor-card-boundary"><strong>Does not establish</strong> '+esc(goal.exclusions)+'</span><span class="advisor-card-action">Choose this decision <span aria-hidden="true">→</span></span></button>';
  main.innerHTML='<section class="hero advisor-hero"><p class="eyebrow">ADVISOR / WORK IN PROGRESS</p><h1 id="advisor-title">Prepare the decision. <br><span>Know what supports it.</span></h1><p class="dek">Turn a specific Splunk question and your reported context into a decision brief: what the assessed documentation establishes, what remains uncertain, and what to verify next.</p><p class="advisor-hero-note">Your context stays in this browser. Unknown is a useful answer.</p><div class="report-actions"><button id="copy-link" type="button">Copy decision link</button><button id="print-report" type="button" disabled aria-describedby="advisor-export-status">Print / save PDF</button><span id="share-status" role="status"></span></div></section>'+
  '<div class="advisor-body"><aside id="advisor-warning" class="advisor-warning" role="alert" hidden></aside><div id="advisor-content">'+
  '<section id="advisor-decisions" class="advisor-section"><p class="kicker">01 / CHOOSE AN ANSWERABLE DECISION</p><h2>What are you deciding?</h2><p>Coverage is deliberately specific. Read what each decision can establish before entering your context.</p><div class="advisor-decision-grid" role="group" aria-label="Choose a decision">'+a.registry.goals.map(card).join('')+'</div>'+
  '<aside id="advisor-legacy" class="advisor-legacy" hidden></aside><details class="advisor-coverage"><summary>Not covered yet, and how coverage will grow</summary><ul>'+a.registry.notCovered.map(row=>'<li><strong>'+esc(row.title)+'</strong><p>'+esc(row.reason)+'</p></li>').join('')+'</ul><p>Coverage grows when assessed documentation supports a useful decision and its limitations. The ideas below are opportunities, not answered decisions or promised availability.</p><ol>'+a.registry.expansionBacklog.map(row=>'<li><strong>'+esc(row.opportunity)+'</strong><p>'+esc(row.publicNote)+'</p></li>').join('')+'</ol></details></section>'+
  '<section id="advisor-context" class="advisor-section" hidden><p class="kicker">02 / YOUR REPORTED CONTEXT</p><h2 id="advisor-context-title" tabindex="-1"></h2><p id="advisor-context-scope"></p><form id="advisor-form" autocomplete="off"><div id="advisor-context-fields" class="advisor-fields"></div><p class="advisor-fineprint">These are your reports, not findings from an inspection. Leave versions blank if unknown. Reported access does not prove entitlement or authorization.</p><button type="submit" id="advisor-build" class="advisor-primary">Build decision brief</button></form><div class="advisor-profile-actions" role="group" aria-label="Local profile"><button id="advisor-save" type="button">Save context on this device</button><button id="advisor-load" type="button">Load saved context</button><button id="advisor-clear" type="button">Clear context</button></div><p id="advisor-profile-status" class="advisor-fineprint" role="status">Saving is optional. Context stays in this browser; copied decision links exclude it.</p></section>'+
  '<section id="advisor-results" class="advisor-section" aria-labelledby="advisor-brief-title"><p class="kicker">03 / YOUR DECISION BRIEF</p><h2 id="advisor-brief-title">Start with a decision</h2><p id="advisor-brief-status" role="status">Choose a covered decision above, add what you know, then build your brief.</p><p id="advisor-export-status" class="advisor-fineprint">Build a brief before printing or saving. Downloads include your self-reported context; a copied link does not.</p><div id="advisor-result"></div></section>'+
  '<section id="advisor-sources" class="advisor-section" hidden><p class="kicker">04 / EVIDENCE AND DATES</p><h2>What this brief relies on</h2><div id="advisor-review"></div><details class="advisor-source-details"><summary>Read the sources and their assessed sections</summary><div id="advisor-source-list"></div></details></section>'+
  '<section id="advisor-scope" class="advisor-section"><p class="kicker">THE BOUNDARY</p><h2>A brief for the next decision, not a readiness certificate</h2><p>Advisor uses previously assessed published Splunk documentation and deterministic rules. It does not discover your environment or establish complete compatibility, entitlement, tenant availability, health, compliance or customer authorization.</p><p>Licensing, sizing, ingest troubleshooting and operational recommendations without sufficient assessed evidence remain outside this build. The existing watches maintain the dated evidence; a matching local record does not prove its upstream page is unchanged.</p><p><a href="/?view=ai-availability">Explore the broader AI evidence</a> · <a href="/">Open the Release Guide</a></p></section></div></div><div class="edition-report advisor-report" hidden></div>';
  const get=id=>document.getElementById('advisor-'+id);
  const resume=document.createElement('button');resume.type='button';resume.className='advisor-resume';resume.textContent='Resume a saved context';get('decisions').append(resume);resume.addEventListener('click',()=>get('load').click());
  const hints={
    deployment:'Choose the deployment path you are considering. Unknown keeps the path unresolved.',
    compliance:'Commercial capability evidence does not establish a regulated offering or your organization’s authorization.',
    edition:'The aggregate workflow and an individual component have different scope; do not infer edition access.',
    access:'Has capability access and enablement been confirmed with your organization and Splunk? This is self-reported.',
    platformVersion:'Enter the reported numeric Platform version, for example 9.4 or 10.4.0. A minimum is not an upgrade recommendation.',
    itsiVersion:'Enter the installed ITSI version, or leave this blank for Unknown.',
    saiaVersion:'Enter the installed SAIA app version, or leave this blank for Unknown.',
    mcpVersion:'Enter the installed Splunk MCP Server version, or leave this blank for Unknown.',
    esVersion:'Enter the installed ES version. Known source discrepancies are not resolved by entering a version.',
    cloudConnectVersion:'Enter the installed Cloud Connect version. ES 8.8 packaging remains separately qualified.',
    region:'Where would the assistant’s AI service run? This may differ from your Splunk hosting region. Base-assistant locations and feature-specific requirements are assessed separately.'
  };
  function options(rows,value){return Object.entries(rows).map(([key,label])=>'<option value="'+esc(key)+'"'+(key===value?' selected':'')+'>'+esc(label)+'</option>').join('');}
  function regionOptions(){let html=options({unknown:'Unknown / not confirmed',other:'Another location / not in this list'},state.region);
    for(const provider of ['aws','azure']){const data=window.VersionCompassAIAvailability.data(),locations=[...data.saiaRegions,...(data.agentModeRegions||[])],rows=window.VersionCompassAIAvailability.regions().filter(row=>row.provider===provider&&locations.includes(row.id));html+='<optgroup label="'+(provider==='aws'?'AWS AI service locations':'Azure AI service locations')+'">'+rows.map(row=>'<option value="'+esc(row.id)+'"'+(state.region===row.id?' selected':'')+'>'+esc(row.label)+'</option>').join('')+'</optgroup>';}return html;}
  function renderFields(){
    const focused=document.activeElement?.id;
    get('context-fields').innerHTML=a.fields(state).map(key=>'<div class="advisor-field"><label for="advisor-'+key+'">'+esc(a.labels[key])+(key.endsWith('Version')?' <span class="advisor-optional">optional if unknown</span>':'')+'</label>'+
      (key==='region'?'<select id="advisor-region" aria-describedby="advisor-region-help">'+regionOptions()+'</select>':a.choices[key]?'<select id="advisor-'+key+'" aria-describedby="advisor-'+key+'-help">'+options(a.choices[key],state[key])+'</select>':'<input id="advisor-'+key+'" type="text" maxlength="40" value="'+esc(state[key])+'" placeholder="Unknown" aria-describedby="advisor-'+key+'-help">')+
      '<p id="advisor-'+key+'-help" class="advisor-field-help">'+esc(hints[key])+'</p></div>').join('');
    if(focused&&get('context-fields').querySelector('#'+focused))document.getElementById(focused).focus({preventScroll:true});
  }
  function resetBrief(message){
    brief=null;document.body.classList.remove('advisor-has-brief');document.getElementById('print-report').disabled=true;get('result').replaceChildren();get('sources').hidden=true;document.querySelector('main>.advisor-report').innerHTML='';
    get('brief-title').textContent=a.definition(state.goal)?'Ready to build your brief':'Start with a decision';
    get('brief-status').textContent=message||'Add what you know. Unknown inputs stay visible in the brief; no assessment has been made yet.';
  }
  function selectGoal(id,moveFocus=false,push=true){
    state=a.normalize({...state,goal:id});
    document.querySelectorAll('[data-advisor-goal]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.advisorGoal===state.goal)));
    const goal=a.definition(state.goal),old=a.legacy[state.goal];
    get('legacy').hidden=!old;
    get('legacy').innerHTML=old?'<h3>'+esc(old.title)+'</h3><p>'+esc(old.detail)+'</p>'+(old.replacement?'<button type="button" data-advisor-replacement="'+old.replacement+'">Review the dependency-check coverage</button>':''):'';
    get('context').hidden=!goal;
    if(goal){get('context-title').textContent=goal.question;get('context-scope').textContent=goal.coverage+' '+goal.exclusions;renderFields();}
    resetBrief(old?'This earlier decision is not treated as a new assessment. Choose a covered decision to continue.':goal?'Review your context, then build a brief.':'Choose a covered decision above, add what you know, then build your brief.');
    if(push)history.pushState(null,'',a.url(state,theme));
    if(moveFocus&&goal){get('context-title').focus({preventScroll:true});get('context').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
  }
  main.addEventListener('click',event=>{
    const card=event.target.closest('[data-advisor-goal]');if(card){selectGoal(card.dataset.advisorGoal,true);return;}
    const replacement=event.target.closest('[data-advisor-replacement]');if(replacement){selectGoal(replacement.dataset.advisorReplacement,true);return;}
    if(event.target.closest('[data-advisor-guide]')&&brief?.handoff){
      try{sessionStorage.setItem(handoffKey,JSON.stringify(brief.handoff));location.href='/?product=platform&platform=enterprise'+(theme?'&theme=cisco':'');}
      catch{get('brief-status').textContent='This browser could not carry private context. The reported version remains in this brief; open the Release Guide using the link below.';}
    }
  });
  get('context-fields').addEventListener('change',event=>{
    const key=event.target.id.replace('advisor-','');if(!Object.hasOwn(a.defaults,key))return;state[key]=event.target.value;
    if(key==='deployment')renderFields();resetBrief('Context changed. Build the brief to assess these reports.');
  });
  get('context-fields').addEventListener('input',event=>{const key=event.target.id.replace('advisor-','');if(!key.endsWith('Version'))return;state[key]=event.target.value;resetBrief('Context changed. Build the brief to assess these reports.');});
  get('form').addEventListener('submit',event=>{
    event.preventDefault();if(parsed.errors.length||!a.definition(state.goal))return;
    state=a.normalize(state);brief=a.evaluate(state);document.body.classList.add('advisor-has-brief');get('brief-title').textContent='Decision brief';get('brief-status').textContent='Brief built from your reported context and the dated evidence below.';
    get('result').innerHTML=a.resultHTML(brief);get('review').innerHTML=a.reviewHTML(brief);get('source-list').innerHTML=a.sources(brief);get('sources').hidden=false;
    const report=document.querySelector('main>.advisor-report');report.outerHTML=a.report(brief);document.getElementById('print-report').disabled=false;
    get('brief-title').setAttribute('tabindex','-1');get('brief-title').focus({preventScroll:true});get('results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  });
  get('save').addEventListener('click',()=>{try{localStorage.setItem(profileKey,JSON.stringify({schemaVersion:2,profile:state}));get('profile-status').textContent='Context saved in this browser only. A new brief still needs to be built.';}catch{get('profile-status').textContent='This browser could not save context. You can continue without saving.';}});
  get('load').addEventListener('click',()=>{try{const saved=JSON.parse(localStorage.getItem(profileKey));if(![1,2].includes(saved?.schemaVersion)||!saved.profile)throw Error();state=a.normalize(saved.profile);selectGoal(state.goal,false);get('profile-status').textContent='Saved self-reported context loaded. Review the coverage and current values, then build a new brief.';}catch{get('profile-status').textContent='No usable saved context is available in this browser.';}});
  get('clear').addEventListener('click',()=>{try{localStorage.removeItem(profileKey);}catch{}state=a.normalize();selectGoal('unknown');get('profile-status').textContent='Saved context cleared. No assessment has been made.';});
  window.addEventListener('popstate',()=>{const next=a.read(location.search);if(next.errors.length){location.reload();return;}selectGoal(next.state.goal,false,false);});
  document.getElementById('copy-link').addEventListener('click',async()=>{const link=new URL(a.url(state,theme),location.origin).href;try{await navigator.clipboard.writeText(link);document.getElementById('share-status').textContent='Decision link copied. Your private context is excluded.';}catch{document.getElementById('share-status').textContent='Decision link: '+link;}});
  function exportBrief(){if(parsed.errors.length||!brief)throw Error('Build the current decision brief before exporting.');if(brief.status!=='needs_review'&&!a.review(brief.state.goal).ok){resetBrief('Evidence changed or became overdue. Build a new brief before exporting.');throw Error('The evidence needs a new review before exporting this decision.');}return a.report(brief);}
  document.getElementById('print-report').addEventListener('click',()=>{try{exportBrief();window.print();}catch(error){get('brief-status').textContent=error.message;}});
  window.VersionCompassBuildSnapshot=exportBrief;
  if(parsed.errors.length){get('warning').hidden=false;get('warning').innerHTML='<h2>This Advisor link needs correction</h2><ul>'+parsed.errors.map(row=>'<li>'+esc(row)+'</li>').join('')+'</ul><a href="/?view=advisor'+(theme?'&amp;theme=cisco':'')+'">Open a fresh Advisor view</a>';get('content').hidden=true;document.getElementById('copy-link').disabled=true;}
  else selectGoal(state.goal,false,false);
}());
