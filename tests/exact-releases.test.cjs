const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const a=require('../dist/exact-releases.js'),d=require('../content/datasets/guidance.json'),seed=d.exactReleases,day='2026-11-02';
const clone=()=>structuredClone(seed),id=(v,c='enterprise')=>'splunk:'+c+':'+v;
const compare=(from,to,component='enterprise',g=seed,extra={})=>a.compare(g,d.sources,{from:id(from,component),to:id(to,component),asOf:day,...extra});
function routeFixture(){const g=clone();g.releases.push({id:id('10.4.1','universal-forwarder'),product:'splunk',component:'universal-forwarder',branch:'enterprise-10.4',version:'10.4.1',src:['exactUF']});return g;}
const row=(s,entity)=>s.rows.find(r=>r.entity===entity);
test('canonical graph has stable product/component identities and bounded official evidence',()=>{assert.equal(a.validate(seed,d.sources),true);assert.equal(seed.branches.length,2);for(const r of seed.releases)assert.equal(r.id,a.key(r));});
test('exact four-component versions retain identity and never round unlisted inputs',()=>{assert.deepEqual(a.version('9.4.0.1'),[9,4,0,1]);assert(a.order('9.4.0.1','9.4.0')>0);assert.notEqual(id('9.4.0.0'),id('9.4.0'));for(const v of ['9.4','9.04.1','9.4.1.','9.4.1.2.3','latest','9.4.-1'])assert.throws(()=>a.version(v));assert.throws(()=>compare('9.4.0.1','9.4.16'),/outside/);const g=clone(),r={...g.releases[0],id:id('9.4.0.1'),version:'9.4.0.1'};g.releases.push(r);assert.equal(a.snapshot(g,d.sources,r.id,day).release.version,'9.4.0.1');});
test('same-line security fix and cross-line older-branch remediation derive endpoint states',()=>{const r=compare('9.4.15','9.4.16');assert.equal(row(r.from,'CVE-2026-76288').status,'affected');assert.equal(row(r.to,'CVE-2026-76288').status,'fixed');const cross=compare('9.4.16','10.4.3');assert.equal(row(cross.from,'CVE-2026-76288').status,'fixed');assert.equal(row(cross.to,'CVE-2026-76288').status,'affected');assert.equal(seed.relationships.find(e=>e.type==='backport-of').qualification.includes('not source-code ancestry'),true);});
test('UF regression/fix never becomes Enterprise package evidence or vice versa',()=>{const r=compare('10.4.2','10.4.3','universal-forwarder');assert.equal(row(r.from,'uf-useack').status,'affected');assert.equal(row(r.to,'uf-useack').status,'fixed');assert.equal(row(r.to,'CVE-2026-76288').status,'unknown');assert.equal(row(compare('10.4.2','10.4.3').to,'uf-useack').status,'unknown');assert.match(row(r.from,'uf-useack').claims[0].qualification,/Receiving component/);});
test('capability change and documentation correction have distinct event identities',()=>{const r=compare('9.4.2','9.4.8');assert.equal(row(r.from,'filter-type').status,'blacklist-default');assert.equal(row(r.to,'filter-type').status,'whitelist-default');assert(r.intervalEvents.some(e=>e.id==='event-filter-after'));assert(!r.intervalEvents.some(e=>e.type==='documentation-correction'));const html=compare('9.4.0','10.4.0');assert.equal(row(html.to,'html-dashboards').status,'removed');assert.equal(row(html.to,'tls13').status,'available');});
test('two scoped published TLS statements remain conflicting without latest-wins selection',()=>{const r=compare('9.4.0','10.4.0');const tls=row(r.to,'legacy-tls');assert.equal(tls.status,'conflicting');assert.deepEqual(tls.claims.map(c=>c.state).sort(),['available-for-migration','removed']);assert.equal(tls.claims.length,2);});
test('unknown applicability, missing assessments, and staleness stay explicit',()=>{const r=compare('10.4.0','10.4.1');assert.equal(row(r.to,'tls13').status,'unknown');const old=a.snapshot(seed,d.sources,id('10.4.0'),'2026-11-01');assert(old.rows.every(r=>r.status==='unknown'));const later=a.snapshot(seed,d.sources,id('10.4.0'),'2026-12-03');assert.equal(row(later,'legacy-tls').status,'conflicting');assert.equal(row(later,'legacy-tls').freshness,'stale');assert.equal(row(later,'legacy-tls').claims[0].assessment.date,day);});
test('release intervals never certify upgrade edges or route changes',()=>{const r=compare('10.4.1','10.4.3','universal-forwarder',routeFixture());assert.equal(r.path.status,'unknown');assert.equal(r.path.events.length,0);assert.equal(r.intervalEvents.filter(e=>['regression','fix'].includes(e.type)).length,2);assert.throws(()=>compare('10.4.1','10.4.3','universal-forwarder',routeFixture(),{route:[id('10.4.1','universal-forwarder'),id('10.4.3','universal-forwarder')]}),/Unsupported/);});
test('an explicitly evidenced test route can encounter a regression absent as a target problem',()=>{const g=routeFixture(),c='universal-forwarder',nodes=['10.4.1','10.4.2','10.4.3'].map(v=>id(v,c));for(let i=1;i<nodes.length;i++)g.relationships.push({id:'test-edge-'+i,type:'supported-upgrade',assessed:day,from:nodes[i-1],to:nodes[i],src:['exactUF'],qualification:'Synthetic edge for evaluator test only; not vendor upgrade evidence.'});const r=compare('10.4.1','10.4.3',c,g,{route:nodes});assert.equal(r.path.events.length,2);assert.equal(row(r.to,'uf-useack').status,'fixed');assert.throws(()=>compare('10.4.1','10.4.3',c,g,{route:[...nodes,nodes[0],nodes[2]]}),/cyclic/);});
test('no cross-component, equal, downgrade, malformed date, or unknown-field comparisons',()=>{assert.throws(()=>a.compare(seed,d.sources,{from:id('10.4.2'),to:id('10.4.3','universal-forwarder'),asOf:day}),/same product/);for(const [x,y]of [['10.4.3','10.4.2'],['10.4.3','10.4.3']])assert.throws(()=>compare(x,y),/later distinct/);assert.throws(()=>compare('9.4.15','9.4.16','enterprise',seed,{asOf:'2026-02-30'}),/date/);assert.throws(()=>compare('9.4.15','9.4.16','enterprise',seed,{customer:'secret'}),/Unknown/);});
test('URL reader rejects ambiguous or foreign contexts and preserves all exact values',()=>{for(const q of ['view=exact-releases&from=','view=exact-releases&to=','view=exact-releases&component=','view=exact-releases&asOf=','view=exact-releases&from=9.4.15&from=9.4.16','view=exact-releases&platform=cloud','view=exact-releases&component=heavy-forwarder','view=exact-releases&from=9.4.0.1','view=exact-releases&theme=other'])assert(a.read('?'+q,seed).errors.length);const s={component:'enterprise',from:'9.4.15',to:'9.4.16',asOf:day,theme:'cisco'};assert.deepEqual(a.read(a.url(s).slice(1),seed).state,s);});
test('graph guards duplicates, dangling references, cycles, ambiguous histories and unsafe evidence',()=>{let g=clone();g.releases.push(g.releases[0]);assert.throws(()=>a.validate(g,d.sources),/Duplicate/);g=clone();g.events[0].release='missing';assert.throws(()=>a.validate(g,d.sources),/Invalid change/);g=clone();g.claims[0].assessments.push({...g.claims[0].assessments[0]});assert.throws(()=>a.validate(g,d.sources),/ambiguous/);g=clone();for(const [from,to]of [['tls-retained','tls-removed'],['tls-removed','tls-retained']])g.relationships.push({id:'cycle-'+from,type:'supersedes',assessed:day,from,to,src:['exact104']});assert.throws(()=>a.validate(g,d.sources),/Cycle/);const sources=structuredClone(d.sources);sources.exact104.url='https://private.example/';assert.throws(()=>a.validate(seed,sources),/public scoped/);});
test('explicit supersession preserves historical claims and does not rewrite prior as-of snapshots',()=>{const g=clone(),c=g.claims.find(c=>c.id==='tls-removed');c.assessments[0].date='2026-11-03';g.relationships.push({id:'test-supersession',type:'supersedes',assessed:day,from:'tls-removed',to:'tls-retained',src:['exactUpgrade']});assert.equal(row(a.snapshot(g,d.sources,id('10.4.0'),day),'legacy-tls').status,'available-for-migration');const current=row(a.snapshot(g,d.sources,id('10.4.0'),'2026-11-03'),'legacy-tls');assert.equal(current.status,'removed');assert.equal(current.history.length,2);});
test('explicit inheritance retains upstream verification date and cannot cross components',()=>{const g=clone(),original=g.claims.find(c=>c.id==='filter-after'),child=structuredClone(original);child.id='test-inherited';child.scope={...child.scope,versions:['9.4.16']};delete child.scope.from;delete child.scope.through;child.assessments[0].date='2026-11-20';g.claims.push(child);g.events.push({id:'event-inherited',type:'assessment',release:id('9.4.16'),claims:[child.id],softwareChange:false});g.relationships.push({id:'inherit-test',type:'inherits',assessed:day,from:child.id,to:original.id,src:['exact94'],qualification:'Explicit bounded propagation test'});const r=row(a.snapshot(g,d.sources,id('9.4.16'),'2026-12-03'),'filter-type');assert.equal(r.freshness,'stale');assert.equal(r.claims.find(c=>c.id===child.id).assessment.verificationDate,day);g.relationships.at(-1).to='uf-fixed';assert.throws(()=>a.validate(g,d.sources),/Cross-scope/);});
test('withdrawn assessment history is retained and snapshots never mutate canonical facts',()=>{const g=clone(),before=JSON.stringify(g);compare('9.4.15','10.4.4','enterprise',g);assert.equal(JSON.stringify(g),before);const c=g.claims.find(c=>c.id==='tls-retained');c.assessments.push({...c.assessments[0],date:'2026-11-03',status:'withdrawn'});const r=row(a.snapshot(g,d.sources,id('10.4.0'),'2026-11-03'),'legacy-tls');assert.equal(r.status,'removed');assert.equal(r.history.length,2);assert.equal(r.history.find(c=>c.id==='tls-retained').assessments.length,2);});
test('rendered report traces both conflicting claims, scope, unknowns and correction dates',()=>{const root={VersionCompassExactReleases:a,SPLUNK_DATA:{guidance:d}};vm.runInNewContext(fs.readFileSync('dist/exact-releases-view.js','utf8'),{window:root});const html=root.VersionCompassExactView.report(compare('9.4.0','10.4.0'));for(const value of ['conflicting','available-for-migration','about-upgrading-to-10.4-read-this-first','unknown','9.4.3','9.4.8','No exact supported upgrade route'])assert(html.includes(value),value);assert(!html.includes('undefined'));});
test('additive WebMCP uses the same evaluator, rejects writes, cleans up and tolerates missing support',async()=>{let registered,signal;const handlers={};const root={VersionCompassExactReleases:a,SPLUNK_DATA:{guidance:d},document:{modelContext:{registerTool(tool,options){registered=tool;signal=options.signal;}}},addEventListener(name,fn){handlers[name]=fn;}};const code=fs.readFileSync('dist/exact-releases-webmcp.js','utf8');vm.runInNewContext(code,{window:root,AbortController});assert.equal(registered.name,'versioncompass_compare_exact_releases');assert.equal(registered.annotations.readOnlyHint,true);const input={from:id('9.4.15'),to:id('9.4.16'),asOf:day};assert.equal(JSON.stringify(registered.execute(input).report),JSON.stringify(a.compare(seed,d.sources,input)));assert.equal(registered.execute({...input,write:true}).ok,false);handlers.pagehide();assert.equal(signal.aborted,true);handlers.pageshow();assert.equal(signal.aborted,false);delete root.document.modelContext;assert.doesNotThrow(()=>vm.runInNewContext(code,{window:root,AbortController}));});

test('as-of knowledge cannot leak future assessed events into a historical comparison',()=>{const r=compare('9.4.0','10.4.0','enterprise',seed,{asOf:'2026-11-01'});assert.equal(r.intervalEvents.length,0);assert(r.to.rows.every(r=>r.status==='unknown'));});

function view(guidance){
 const root={VersionCompassExactReleases:a,SPLUNK_DATA:{guidance}};
 vm.runInNewContext(fs.readFileSync('dist/exact-releases-view.js','utf8'),{window:root});
 return root.VersionCompassExactView;
}
function fixtureReport(g,sources,asOf){return a.compare(g,sources,{from:id('9.4.2'),to:id('9.4.8'),asOf});}

test('historical renderer selects dated citations rather than the last assessment in the array',()=>{
 const g=clone(),c=g.claims.find(c=>c.id==='filter-after'),sources={...d.sources,fixtureFuture:{title:'FUTURE ASSESSMENT SOURCE',url:'https://help.splunk.com/fixture-future-assessment'}};
 c.assessments.push({...c.assessments[0],id:'fixture-future-assessment',date:'2026-11-05',src:['fixtureFuture'],section:'FUTURE SECTION'});
 const guidance={...d,sources,exactReleases:g},v=view(guidance),before=JSON.stringify(g);
 const historical=fixtureReport(g,sources,day),html=v.report(historical),historicalTimeline=v.timeline(historical);
 assert(v.timeline(historical).includes(d.sources.exact94.url));
 assert(!html.includes(sources.fixtureFuture.url));assert(!html.includes('FUTURE SECTION'));
 assert(!v.corrections(historical).includes('2026-11-05'));
 const later=fixtureReport(g,sources,'2026-11-06');
 assert(v.timeline(later).includes(sources.fixtureFuture.url));assert(v.corrections(later).includes('FUTURE SECTION'));
 c.assessments.reverse();
 assert.equal(v.timeline(fixtureReport(g,sources,day)),historicalTimeline);
 assert(v.timeline(fixtureReport(g,sources,'2026-11-06')).includes(sources.fixtureFuture.url));
 c.assessments.reverse();assert.equal(JSON.stringify(g),before);
});

test('withdrawal removes current correction assertions while earlier reports and history remain intact',()=>{
 const g=clone(),c=g.claims.find(c=>c.id==='filter-after');
 c.assessments.push({...c.assessments[0],id:'fixture-withdrawal',date:'2026-11-03',status:'withdrawn',reason:'Synthetic withdrawal for renderer regression test.'});
 c.assessments.push({...c.assessments[0],id:'fixture-later-reassessment',date:'2026-11-05'});
 const v=view({...d,exactReleases:g}),before=JSON.stringify(g);
 const historical=fixtureReport(g,d.sources,day),withdrawn=fixtureReport(g,d.sources,'2026-11-04');
 assert(v.corrections(historical).includes(c.text));
 assert.equal(row(withdrawn.to,'filter-type').status,'unknown');
 assert(!v.corrections(withdrawn).includes(c.text));assert(!v.corrections(withdrawn).includes('9.4.8 / enterprise'));
 assert(!v.timeline(withdrawn).includes(c.text));assert(!v.report(withdrawn).includes(c.text));
 assert(v.corrections(fixtureReport(g,d.sources,'2026-11-06')).includes(c.text));
 assert.equal(row(withdrawn.to,'filter-type').history.find(h=>h.id===c.id).assessments.length,3);
 assert.equal(JSON.stringify(g),before);
});

test('one supported event claim cannot cause a withdrawn sibling conclusion to be rendered',()=>{
 const g=clone(),c=g.claims.find(c=>c.id==='filter-after'),supported=structuredClone(c);
 c.assessments.push({...c.assessments[0],id:'fixture-sibling-withdrawal',date:'2026-11-03',status:'withdrawn'});
 supported.id='fixture-supported-correction';supported.text='INDEPENDENT SUPPORTED CORRECTION';
 supported.assessments=[{...supported.assessments[0],id:'fixture-sibling-supported',date:'2026-11-03'}];g.claims.push(supported);
 const event=g.events.find(e=>e.id==='event-filter-docs');event.claims.push(supported.id);
 const r=fixtureReport(g,d.sources,'2026-11-03'),html=view({...d,exactReleases:g}).corrections(r);
 assert(html.includes(supported.text));assert(!html.includes(c.text));assert(!html.includes('Claim filter-after'));
 assert(!html.includes(event.detail));assert(html.includes('Some event claims are not supported'));
});

test('documentation corrections match the selected component and endpoint branches',()=>{
 const v=view(d);
 assert(!v.corrections(compare('10.4.2','10.4.3','universal-forwarder')).includes('9.4.8 / enterprise'));
 assert(!v.corrections(compare('10.4.2','10.4.3')).includes('9.4.8 / enterprise'));
 assert(v.corrections(compare('9.4.2','9.4.8')).includes('9.4.8 / enterprise'));
 assert(v.corrections(compare('9.4.16','10.4.3')).includes('9.4.8 / enterprise'));
});
