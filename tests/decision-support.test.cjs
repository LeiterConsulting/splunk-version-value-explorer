const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function context(){const c={window:{},document:{addEventListener(){}},URL,URLSearchParams};for(const f of ['data.js','product-data.js','guidance-data.js','environment-data.js','environment.js','comparison.js','guidance.js','source-register.js','content-updates.js','editions-data.js','decision-support.js','report-tools.js'])vm.runInNewContext(fs.readFileSync('dist/'+f,'utf8'),c);return c;}
test('decision change history follows actual selected milestones and environment scopes',()=>{
 const c=context(),w=c.window,state={product:'observability',platform:'cloud',host:'10.5.2605',from:'2026-08',to:'2026-09',environment:{},environmentErrors:[]};
 const track=w.SPLUNK_DATA.productTracks.observability;state.from=track.releases.at(-2);state.to=track.releases.at(-1);
 const m=w.VersionCompassDecision.model(state,w.VersionCompassComparison.create(w.SPLUNK_DATA,state));
 assert(m.changes.some(x=>x.key.includes('Browser RUM')));
 assert(!m.changes.some(x=>x.key.startsWith('environment:')));
 const previous={...state,to:state.from};
 assert(!w.VersionCompassDecision.model(previous,w.VersionCompassComparison.create(w.SPLUNK_DATA,previous)).changes.some(x=>x.key.includes('Browser RUM')));
 const env={product:'platform',platform:'cloud',from:'10.2.2406',to:'10.5.2605',environment:{csp:'aws',experience:'classic'},environmentErrors:[]};
 const scoped=w.VersionCompassDecision.model(env,null);assert(scoped.changes.every(x=>x.key.includes('classic')));assert(scoped.changes.length);
});
test('decision history retains successive changes to the same stable record',()=>{
 const c=context(),w=c.window,state={product:'platform',platform:'enterprise',from:'10.2',to:'10.4',environment:{},environmentErrors:[]};
 const m=w.VersionCompassDecision.model(state,w.VersionCompassComparison.create(w.SPLUNK_DATA,state));
 const maintenance=m.changes.filter(x=>x.key==='technical:platform:Enterprise 10.4 maintenance target');
 assert.equal(maintenance.length,2);
 assert.deepEqual(Array.from(maintenance,x=>x.date),['2026-09-30','2026-09-26']);
});
test('uncertainty questions preserve recorded edition conflicts rather than resolving them',()=>{
 const w=context().window,s={product:'es',platform:'cloud',view:'es-editions',to:'8.7',environment:{},environmentErrors:[]};
 const m=w.VersionCompassDecision.model(s,null,w.VersionCompassEditions);
 for(const conflict of w.VersionCompassEditions.conflicts)assert(m.issues.some(i=>i.question===conflict.question&&i.impact===conflict.meaning));
 assert(w.VersionCompassDecision.questions([{title:'<script>',impact:'unknown',question:'Ask vendor'}]).includes('&lt;script&gt;'));
});
test('report revision and verification appendix use only citations actually in the report',()=>{
 const w=context().window;w.VersionCompassRevision={id:'vc-test',publication:'2026-09-25'};
 const source=w.VersionCompassSources.sources[0],body=w.VersionCompassReports.decorate('<a href="'+source.url+'">Source</a>');
 assert(body.includes('vc-test'));assert(body.includes(source.title));assert(body.includes(source.reviewed||'not recorded'));assert(!body.includes(w.VersionCompassSources.sources[1].url));
});

test('compact counts separate blockers, required actions and evidence questions',()=>{
 const w=context().window,s={product:'platform',platform:'enterprise',from:'9.4',to:'10.4',environment:{},environmentErrors:[]};
 const m=w.VersionCompassDecision.model(s,w.VersionCompassComparison.create(w.SPLUNK_DATA,s));
 assert(m.blockers.length>0);assert(m.blockers.every(x=>x.level==='Blocker'));
 assert(m.requiredChecks.some(x=>x.title==='Legacy TLS protocols'));
 assert(m.requiredChecks.some(x=>x.title==='KV Store binaries'));
 assert.equal(m.requiredChecks.length,3);
 assert(m.requiredChecks.every(x=>x.level!=='Blocker'));
});

test('repeated technical titles retain only matching release-scoped change history',()=>{const w=context().window;function changes(from,to){const s={product:'platform',platform:'enterprise',from,to,environment:{},environmentErrors:[]};return w.VersionCompassDecision.model(s,w.VersionCompassComparison.create(w.SPLUNK_DATA,s)).changes;}const older=changes('10.2','10.4');assert(!older.some(e=>e.milestones?.includes('Enterprise 10.6')));const newer=changes('10.4','10.6');assert(newer.some(e=>e.key==='technical:platform:KV Store database engine'&&e.cycle===6));assert(!newer.some(e=>e.milestones?.includes('Cloud 10.6')));});
