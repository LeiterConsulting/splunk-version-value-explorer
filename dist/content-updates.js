/* Editorial change provenance. Cycles advance only with material factual updates. */
(function(){
'use strict';
const policy={currentCycle:2,retentionCycles:2};
const note25='https://github.com/LeiterConsulting/splunk-version-value-explorer/blob/main/docs/releases/2026-09-25.md';
const note26='https://github.com/LeiterConsulting/splunk-version-value-explorer/blob/main/docs/releases/2026-09-26.md';
const enterprise1043='https://help.splunk.com/en/splunk-enterprise/release-notes-and-updates/release-notes/10.4/fixed-issues/fixed-issues/splunk-enterprise-10.4.3-fixed-issues';
const rum='https://github.com/signalfx/splunk-otel-js-web/releases/tag/v3.2.0';
const ingest='https://help.splunk.com/en/splunk-cloud-platform/process-data-at-ingest-time/use-ingest-processors/introduction/about-ingest-processor';
const entries={
 'feature:observability:Browser RUM 3.2':{kind:'new',cycle:1,date:'2026-09-25',version:'Browser RUM 3.2.0 · September 2026 service milestone',detail:'Added to this guide: manual page-load registration and optional blocking-element spans.',source:rum,sourceDate:'2026-09-24'},
 'technical:observability:Browser RUM navigation configuration':{kind:'deprecated',cycle:1,date:'2026-09-25',version:'Browser RUM 3.2.0',detail:'spaMetrics is deprecated but remains functional as an alias for navigationMetrics. This is not removal of Browser RUM.',source:rum,sourceDate:'2026-09-24'},
 'technical:enterprise:Enterprise 10.4 maintenance target':{kind:'new',cycle:2,date:'2026-09-26',version:'Splunk Enterprise 10.4 maintenance line',detail:'Added the documented 10.4.3-or-higher target because 10.4.2 can block acknowledged forwarding pipelines.',source:enterprise1043,sourceDate:'2026-09-23',note:note26}
};
for(const id of ['ingest-aws','ingest-moderate','ingest-classic-commercial','ingest-classic-moderate'])entries['environment:'+id]={kind:id.includes('classic')?'new':'updated',cycle:1,date:'2026-09-25',version:'Current Cloud service guidance · Classic / Victoria',detail:id.includes('classic')?'Added a visible Classic restriction: Ingest Processor requires Victoria. This documents an existing prerequisite, not a new product restriction.':'Corrected scope to require Victoria Experience and a provisioned Ingest Processor tenant.',source:ingest,sourceDate:'2026-06-16'};
const labels={new:'New',updated:'Updated',deprecated:'Deprecated',removed:'Removed',corrected:'Corrected'};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function active(entry,cycle=policy.currentCycle){return !!entry&&cycle>=entry.cycle&&cycle-entry.cycle<policy.retentionCycles;}
function html(key){const e=entries[key];if(!active(e))return '';const text='Guide change '+e.date+' · '+e.version+' · '+e.detail+' Source dated '+e.sourceDate+'.';return '<span class="content-change content-change-'+e.kind+'"><button type="button" class="content-change-marker" aria-label="'+esc(labels[e.kind]+'. '+text)+'">'+labels[e.kind]+'</button><span class="content-change-popover" role="tooltip"><strong>'+esc(e.kind==='new'?'New to this guide':labels[e.kind])+'</strong><br>'+esc(text)+' <a href="'+esc(e.source)+'" target="_blank" rel="noopener noreferrer">Official source</a> · <a href="'+esc(e.note||note25)+'" target="_blank" rel="noopener noreferrer">Change log</a></span><span class="content-change-print"> — '+esc(labels[e.kind]+': '+text)+'</span></span>';}
window.VersionCompassUpdates={policy,entries,active,html};
if(typeof document!=='undefined')document.addEventListener('keydown',e=>{if(e.key==='Escape'&&e.target.closest?.('.content-change'))e.target.blur();});
}());
