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
