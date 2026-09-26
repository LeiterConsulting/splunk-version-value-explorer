/* Print presentation of the existing, validated route view; no duplicate facts. */
(function () {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.VersionCompassReleasePrint = { build(document, url) {
    const sources = [], sourceMap = new Map();
    const html = id => { const el=document.getElementById(id); return el ? (el.innerHTML || esc(el.textContent || '')) : ''; };
    const text = id => esc(document.getElementById(id)?.textContent || '');
    function cite(fragment) {
      return fragment.replace(/\s(?:id|aria-labelledby|aria-describedby)="[^"]*"/g,'').replace(/<a\b([^>]*?)href="(https?:\/\/[^" ]+)"([^>]*)>([\s\S]*?)<\/a>/g,(_all,_a,href,_b,label)=>{
        let n=sourceMap.get(href);if(!n){n=sources.length+1;sourceMap.set(href,n);sources.push({href,label:label.replace(/<[^>]*>/g,'').replace(/[↗→]/g,'').trim()});}
        return '<a class="report-citations" href="#release-source-'+n+'">'+label+' ['+n+']</a>';
      });
    }
    const section=(title,body,intro='')=>body?'<section class="report-section"><h2>'+title+'</h2>'+(intro?'<p>'+intro+'</p>':'')+cite(body)+'</section>':'';
    let body='<header class="report-title"><p>VERSION COMPASS / RELEASE GUIDE</p><h1>'+text('print-title')+'</h1><p>'+text('print-subtitle')+'</p></header><p class="report-disclaimer">Independent public-source report. Not an official Cisco or Splunk publication.</p><p>This report includes all curated benefits and technical details for the selected route. Numbered citations refer to the source directory.</p><p class="report-online"><a href="'+esc(url)+'">Open current guidance for these selections</a></p>';
    body+=section('Route assessment',html('print-link-notice')+html('compatibility-gate')+html('route-takeaway'));
    const envState=window.VersionCompassPage?.getSelection();
    if(envState&&window.VersionCompassEnvironment)body+=section('Cloud environment',window.VersionCompassEnvironment.body(envState,true));
    body+=section('Support lifecycle',html('lifecycle-content'));
    body+=section(text('path-title')||'Selected path','<div class="report-path">'+html('path-line')+'</div><p>'+html('path-caption')+'</p>'+html('path-evidence'),text('path-intro'));
    if(!document.getElementById('migration-approaches').hidden)body+=section('Migration approaches',html('approach-grid')+'<p>Choose an approach with your account team or delivery partner after discovery; this guide does not collect enough environment detail to prescribe one.</p>'+html('source-actions'));
    body+=section(text('value-title')||'Capabilities and benefits',html('benefit-grid'),text('value-intro'));
    body+=section(text('technical-title')||'Technical changes',html('technical-content'),text('technical-intro').replace('A collapsed, route-specific view','A route-specific view'));
    body+=section(text('breaking-title')||'Potential breaking changes',html('breaking-list'),text('breaking-intro'));
    body+=section(text('readiness-title')||'Readiness',html('readiness-list'),text('readiness-intro'));
    body+=section('Further official guidance',html('source-actions'));
    body+='<section class="report-section report-references"><h2>Public sources</h2><p>Sources are listed once in order of first citation. Consult the linked documentation for full requirements and environment-specific applicability.</p><ol>'+sources.map((s,i)=>'<li id="release-source-'+(i+1)+'"><strong>'+s.label+'</strong><br><a href="'+s.href+'">'+s.href+'</a></li>').join('')+'</ol></section>';
    return window.VersionCompassReports?.decorate(body)||body;
  }};
}());
