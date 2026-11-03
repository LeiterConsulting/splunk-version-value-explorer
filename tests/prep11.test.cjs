const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function model(){const c={window:{SPLUNK_DATA:{guidance:JSON.parse(fs.readFileSync('content/datasets/guidance.json'))}},URLSearchParams};vm.runInNewContext(fs.readFileSync('dist/prep11.js','utf8'),c);return c.window.VersionCompassPrep11;}
test('future-release preparation preserves unknown requirements and exact current source conflicts',()=>{
 const a=model(),d=a.data();assert.equal(d.announcements.length,0);assert.match(d.boundary,/No version-specific public 11\.x.*located/);assert.match(d.boundary,/unconfirmed/);assert.equal(d.questions.length,6);
 const r=d.baseline.find(x=>x.id==='prep11-operator-baseline');assert.match(r.text,/1\.32–1\.37/);assert.match(r.text,/1\.32–1\.36/);assert.match(r.text,/September 8.*September 24/);assert.equal(r.src.length,2);
 assert(d.contextUpdates.every(r=>r.kind==='context'&&r.qualification.includes('11.x')));
 for(const r of [...d.baseline,...d.contextUpdates]){assert(r.verified);assert(r.qualification);for(const id of r.src){const s=a.source(id);assert(s.section);assert(s.checked);assert(s.reviewed);assert(['help.splunk.com','www.splunk.com','newsroom.cisco.com','lantern.splunk.com','splunk.github.io'].includes(new URL(s.url).hostname));}}
});
test('preparation links round-trip selected filters, theme, search and meaningful anchor',()=>{
 const a=model(),state={area:'apps',updates:'context',q:'apps & scripts',theme:'cisco'};
 const url=a.url(state,'#prep11-prepare'),r=a.read(url.slice(url.indexOf('?'),url.indexOf('#')));assert.equal(r.errors.length,0);assert.equal(JSON.stringify(r.state),JSON.stringify(state));assert(url.endsWith('#prep11-prepare'));assert.equal(a.url(r.state),a.url(state));
});
test('ambiguous or comparison inputs retain original input and cannot become a replacement prep report',()=>{
 const a=model();for(const query of ['?view=splunk-11&from=9.4&to=11.0','?view=splunk-11&view=about','?view=splunk-11&area=unknown','?view=splunk-11&theme=other','?view=splunk-11&q=a&q=b','?view=splunk-11&compliance=fr-h']){const r=a.read(query);assert(r.errors.length,query);assert.equal(r.original,query);}
});
test('filtered prep screen leaves full citation-bearing report intact and escapes arbitrary search',()=>{
 const a=model(),d=a.data(),state={area:'apps',updates:'announcement',q:'<script>bad()</script>',theme:''};
 assert.equal(a.matching(d.baseline,state).length,0);const report=a.report(state);
 assert(!report.includes('<script>'));assert(report.includes('&lt;script&gt;'));for(const r of d.baseline)assert(report.includes(a.esc(r.title)));for(const q of d.questions)assert(report.includes(a.esc(q.title)));for(const id of d.sourceIds)assert(report.includes('id="prep11-ref-'+id+'"'));
 for(const r of d.contextUpdates)assert(report.includes(r.sourceDate));assert(report.includes('complete public update inventory'));
});
test('prep route loads its bounded model and renderer without exposing new browser agent tools',()=>{
 const loaded=[],main={},head=[],c={window:{location:{search:'?view=splunk-11'}},URLSearchParams,document:{querySelector:()=>main,querySelectorAll:()=>[],createElement:()=>({}),head:{appendChild:e=>head.push(e)},body:{appendChild:e=>{loaded.push(e.src);e.onload();}}}};
 vm.runInNewContext(fs.readFileSync('dist/site-router.js','utf8'),c);assert(loaded.includes('prep11-ui.js'));assert(!loaded.includes('app.js'));assert(!loaded.includes('webmcp.js'));assert(head.some(e=>e.href==='prep11.css'));
});

test('scoped follow-up refreshes exact workload and migration claims without borrowing other dates',()=>{
 const a=model(),d=a.data(),operator=d.baseline.find(r=>r.id==='prep11-operator-baseline');
 assert.match(operator.version,/10\.0\.12–10\.6\.0/);assert(!operator.text.includes('9.4.15'));
 assert.match(operator.text,/Enterprise 10\.6\.0/);assert.match(operator.qualification,/neither source certifies 11\.x/);
 const workload=d.baseline.find(r=>r.id==='prep11-workload-baseline');assert.equal(workload.verified,'2026-11-03');assert.equal(a.source('prep11workload').checked,'2026-11-03');assert.match(workload.text,/Basic mode supports admission rules only/);assert.match(workload.text,/allow_basic.*false by default/);assert.match(workload.reviewStatus,/Basic does not load categories or pools/);
 const cloud=d.baseline.find(r=>r.id==='prep11-cloud-option');assert.equal(cloud.verified,'2026-11-03');assert.match(cloud.text,/staffing plan.*communications plan.*transition plan/);assert.match(cloud.reviewStatus,/not guaranteed staffing reductions/);
 assert.equal(operator.verified,'2026-11-02');assert.equal(d.contextUpdates.find(r=>r.id==='prep11-news-versioning').verified,'2026-11-02');
 const report=a.report({area:'all',updates:'all',q:'',theme:''});assert(report.includes('Discovery checked 2026-11-03'));assert(report.includes(a.esc(workload.reviewStatus)));assert(report.includes(a.esc(cloud.reviewStatus)));assert(report.includes('not an 11.x promise'));
});
test('recovered Cisco context and bounded discovery retain historical failure and future-release uncertainty',()=>{
 const a=model(),d=a.data(),context=d.contextUpdates.find(r=>r.id==='prep11-news-selfmanaged-ai');
 assert.equal(context.verified,'2026-11-03');assert.equal(context.sourceDate,'2026-09-15');assert.equal(context.effectiveDate,null);
 assert.match(context.reviewStatus,/earlier semantic Site Unavailable/);assert.match(context.qualification,/does not establish an 11.x deployment model/);
 assert.match(d.boundary,/November 3, 2026/);assert.match(d.boundary,/does not prove none exists/);
 const prior=JSON.parse(fs.readFileSync('docs/audits/2026-11-03-release-watch-scheduled-coverage.json'));
 assert.equal(prior.coverage.find(c=>c.capabilityId==='prep11.context-ai').disposition,'blocked');
 assert.equal(prior.claimedComplete,false);
});
