/* Editorial change provenance. Cycles advance only with material factual updates. */
(function(){
'use strict';
const policy={currentCycle:1,retentionCycles:2};
const note='https://github.com/LeiterConsulting/splunk-version-value-explorer/blob/main/docs/releases/2026-09-25.md';
const rum='https://github.com/signalfx/splunk-otel-js-web/releases/tag/v3.2.0';
const ingest='https://help.splunk.com/en/splunk-cloud-platform/process-data-at-ingest-time/use-ingest-processors/introduction/about-ingest-processor';
const entries={
 'feature:observability:Browser RUM 3.2':{kind:'new',cycle:1,date:'2026-09-25',version:'Browser RUM 3.2.0 · September 2026 service milestone',detail:'Added to this guide: manual page-load registration and optional blocking-element spans.',source:rum,sourceDate:'2026-09-24'},
 'technical:observability:Browser RUM navigation configuration':{kind:'deprecated',cycle:1,date:'2026-09-25',version:'Browser RUM 3.2.0',detail:'spaMetrics is deprecated but remains functional as an alias for navigationMetrics. This is not removal of Browser RUM.',source:rum,sourceDate:'2026-09-24'}
};
for(const id of ['ingest-aws','ingest-moderate','ingest-classic-commercial','ingest-classic-moderate'])entries['environment:'+id]={kind:id.includes('classic')?'new':'updated',cycle:1,date:'2026-09-25',version:'Current Cloud service guidance · Classic / Victoria',detail:id.includes('classic')?'Added a visible Classic restriction: Ingest Processor requires Victoria. This documents an existing prerequisite, not a new product restriction.':'Corrected scope to require Victoria Experience and a provisioned Ingest Processor tenant.',source:ingest,sourceDate:'2026-06-16'};
const labels={new:'New',updated:'Updated',deprecated:'Deprecated',removed:'Removed',corrected:'Corrected'};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function active(entry,cycle=policy.currentCycle){return !!entry&&cycle>=entry.cycle&&cycle-entry.cycle<policy.retentionCycles;}
function html(key){const e=entries[key];if(!active(e))return '';const text='Guide change '+e.date+' · '+e.version+' · '+e.detail+' Source dated '+e.sourceDate+'.';return '<span class="content-change content-change-'+e.kind+'"><button type="button" class="content-change-marker" aria-label="'+esc(labels[e.kind]+'. '+text)+'">'+labels[e.kind]+'</button><span class="content-change-popover" role="tooltip"><strong>'+esc(e.kind==='new'?'New to this guide':labels[e.kind])+'</strong><br>'+esc(text)+' <a href="'+esc(e.source)+'" target="_blank" rel="noopener noreferrer">Official source</a> · <a href="'+note+'" target="_blank" rel="noopener noreferrer">Change log</a></span><span class="content-change-print"> — '+esc(labels[e.kind]+': '+text)+'</span></span>';}
window.VersionCompassUpdates={policy,entries,active,html};
if(typeof document!=='undefined')document.addEventListener('keydown',e=>{if(e.key==='Escape'&&e.target.closest?.('.content-change'))e.target.blur();});
}());
