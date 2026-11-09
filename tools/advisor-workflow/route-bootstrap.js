/* Native same-origin mount; compilation supplies only blank, public source bytes. */
(function(){
 'use strict';
 const html=/*STANDALONE_HTML*/;
 const parsed=new DOMParser().parseFromString(html,'text/html');
 const current=document.querySelector('main'),header=document.querySelector('.site-header');
 if(!current||!header)throw Error('Advisor requires the Version Compass navigation shell.');
 // Compare the host's validated public scope before installing the assessed
 // snapshot. A newer/different public bundle must not be silently discarded.
 const expected=JSON.parse(parsed.querySelector('#public-data').textContent);
 const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
 if(!window.VersionCompassContent?.loaded){
  current.innerHTML='<section class="hero" role="alert"><h1>Advisor host evidence is unavailable</h1><p>The current host public scope could not be confirmed. No private profile, assessment or export was loaded. A captured/offline workflow is a separate assessed snapshot and cannot establish current host evidence.</p><a href="advisor-workflow-candidate.html">Open an explicitly pinned offline blank workflow</a></section>';
  window.WorkflowRouteUnavailable=true;window.__workflowReady=true;return;
 }
 if(window.VersionCompassContent?.loaded){
  const g=window.SPLUNK_DATA?.guidance,e=window.VersionCompassEnvironmentData;
  const host={guidance:{aiAvailability:g?.aiAvailability,exactReleases:g?.exactReleases,sources:Object.fromEntries(expected.scopeSourceIds.map(id=>[id,g?.sources?.[id]]))},environment:{providers:e?.providers,regions:e?.regions}};
  if(JSON.stringify(canonical(host))!==JSON.stringify(canonical({guidance:expected.guidance,environment:expected.environment}))){
   current.innerHTML='<section class="hero" role="alert"><h1>Advisor public evidence needs reconciliation</h1><p>The loaded public scope differs from this assessed workflow build. No assessment, private profile load or export is available. Reload a coherent reviewed build or return to the Release Guide; no goal or fact has been substituted.</p><a href="/">Return to Release Guide</a></section>';
   window.WorkflowRouteUnavailable=true;window.__workflowReady=true;return;
  }
 }
 window.WorkflowStandaloneTemplate=html;
 window.WorkflowIntegratedRoute=true;
 document.title='Advisor requirement workflow | Version Compass';
 document.body.className='advisor-workflow-route';
 document.body.dataset.theme='light';
 // Remove comparison-only presentation; preserve the already initialized masthead.
 for(const link of document.querySelectorAll('link[rel="stylesheet"]'))if(!/site-chrome\.css(?:$|\?)/.test(link.getAttribute('href')||''))link.remove();
 const style=parsed.querySelector('#workflow-style');document.head.append(document.importNode(style,true));
 document.querySelectorAll('body>.skip-link,body>.site-footer').forEach(el=>el.remove());
 const skip=document.importNode(parsed.querySelector('.skip-link'),true);document.body.prepend(skip);
 header.after(document.importNode(parsed.querySelector('.top'),true));
 current.replaceWith(document.importNode(parsed.querySelector('main'),true));
 document.body.append(document.importNode(parsed.querySelector('#overlay'),true));
 for(const source of parsed.querySelectorAll('script')){
  const script=document.createElement('script');
  if(source.id)script.id=source.id;
  if(source.type)script.type=source.type;
  script.textContent=source.textContent;
  document.body.append(script);
 }
 // Only the compiler's source text is executable. Customer imports never enter
 // this template, script construction or the public build.
}());
