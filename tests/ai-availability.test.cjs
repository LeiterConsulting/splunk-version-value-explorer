const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function model(){
 const c={window:{SPLUNK_DATA:{guidance:JSON.parse(fs.readFileSync('content/datasets/guidance.json'))},VersionCompassEnvironmentData:JSON.parse(fs.readFileSync('content/datasets/environment.json'))},URLSearchParams};
 vm.runInNewContext(fs.readFileSync('dist/ai-availability.js','utf8'),c);return c.window.VersionCompassAIAvailability;
}
function state(a,extra={}){return {...a.read('?view=ai-availability').state,...extra};}
function assess(a,id,extra={}){return a.assess(a.data().capabilities.find(r=>r.id===id),state(a,extra));}
test('AI catalog preserves named products, exact dependency floors and scoped dates',()=>{
 const a=model(),d=a.data();assert.equal(d.capabilities.length,10);
 const itsi=d.capabilities.find(r=>r.product==='itsi');assert.match(itsi.version,/ITSI 5\.0\+.*SAIA 2\.2\+.*MCP Server 1\.2\.1\+/);
 assert(d.capabilities.filter(r=>r.product==='es').every(r=>r.stage.includes('Controlled Availability')));
 for(const r of d.capabilities){assert(r.requirements.length);assert(r.qualification);assert(r.verified);assert(r.scope.product===r.product);for(const id of r.src){const s=a.source(id);assert(s.section);assert(s.checked);assert(s.reviewed);assert.equal(new URL(s.url).hostname,'help.splunk.com');}}
 for(const id of ['aiEsAgents88','aiEsThreatGraph88'])assert.equal(a.source(id).reviewed,'2026-10-26');
 assert.equal(a.source('aiEsSocTask87').reviewed,'2026-10-27');
 for(const id of ['aiEsEditions','aiEsRelease88'])assert.equal(a.source(id).reviewed,'2026-10-24');
});
test('Observability AI capabilities keep realm, rollout and metric limits scoped',()=>{
 const a=model(),d=a.data();assert(a.products.observability);assert.match(d.observabilityRealmConflict,/us3/);
 assert.equal(assess(a,'ai-observability-assistant',{region:'us-east-1'}).availability,'conditional');
 assert.equal(assess(a,'ai-observability-assistant',{region:'gcp-oregon'}).availability,'conditional');
 assert.equal(assess(a,'ai-observability-assistant',{region:'eu-south-1'}).availability,'not_established');
 assert.equal(assess(a,'ai-observability-assistant',{csp:'azure'}).availability,'not_established');
 assert.equal(assess(a,'ai-observability-assistant',{deployment:'enterprise'}).availability,'unavailable');
 assert.equal(assess(a,'ai-observability-rca',{compliance:'fr-m',region:'us-gov-east-1'}).availability,'unavailable');
 const r=d.capabilities.find(x=>x.id==='ai-observability-rca');assert(r.requirements.some(x=>/Custom metrics are not supported/i.test(x)));assert.match(r.qualification,/Kubernetes-related/);
 for(const id of ['aiObsAssistant','aiObsRca','aiObsServiceDetails','aiObsJulyRelease'])assert.equal(a.source(id).reviewed,'2026-10-24');
});
test('AI links preserve full context, comparison mode, version, theme, search and anchor',()=>{
 const a=model(),s=state(a,{aiProduct:'es',deployment:'enterprise',compliance:'fr-m',csp:'aws',region:'us-gov-east-1',edition:'premier',mode:'compare',aiVersion:'8.8',q:'SPL & detection',theme:'cisco'});
 const url=a.url(s,'#ai-results'),read=a.read(url.slice(url.indexOf('?'),url.indexOf('#')));
 assert.equal(read.errors.length,0);assert.equal(JSON.stringify(read.state),JSON.stringify(s));assert(url.endsWith('#ai-results'));
});
test('invalid, duplicate, foreign, empty or mismatched selections cannot silently become defaults',()=>{
 const a=model();
 for(const suffix of ['&view=about','&aiProduct=soar','&aiProduct=','&theme=','&deployment=other','&region=bad','&csp=aws&region=azure-ai-japan','&aiProduct=platform&aiVersion=8.8','&from=9.4','&q=a&q=b','&compliance=fr-m&compliance=fr-h','&mode=bad']){
  const query='?view=ai-availability'+suffix,r=a.read(query);assert(r.errors.length,query);assert.equal(r.original,query);
 }
});
test('SAIA known commercial service region is conditional; unlisted provider and regions stay unknown',()=>{
 const a=model();
 assert.equal(assess(a,'ai-saia-spl',{region:'us-east-1'}).availability,'conditional');
 assert.equal(assess(a,'ai-saia-spl',{csp:'gcp'}).availability,'not_established');
 assert.equal(assess(a,'ai-saia-spl',{region:'eu-west-1'}).availability,'not_established');
 assert.equal(assess(a,'ai-saia-spl',{region:'azure-ai-us-east'}).availability,'conditional');
 assert.equal(assess(a,'ai-saia-spl',{region:'azure-virginia'}).availability,'not_established');
});
test('limited IL2 support is not generalized to Moderate or High and Agent Mode limitation remains explicit',()=>{
 const a=model();for(const compliance of ['fr-m','fr-h']){
  const r=assess(a,'ai-saia-agent',{compliance,region:'us-gov-east-1'});
  assert.equal(r.availability,'not_established');assert.equal(r.authorization,'not_established');assert.match(r.detail,/excludes Agent Mode/);
 }
});
test('ITSI integration never inherits a positive regional rollout from base SAIA',()=>{
 const a=model(),r=assess(a,'ai-itsi-subagent',{region:'us-east-1'});
 assert.equal(r.availability,'not_established');assert.match(r.detail,/ITSI subagent/);
});
test('ES Cloud and CMP retain different Montreal and Calgary component exceptions',()=>{
 const a=model();
 assert.equal(assess(a,'ai-es-assistant',{region:'ca-central-1',edition:'premier'}).availability,'conditional');
 assert.equal(assess(a,'ai-es-assistant',{region:'ca-central-1',edition:'premier',deployment:'enterprise'}).availability,'unavailable');
 assert.equal(assess(a,'ai-es-assistant',{region:'ca-west-1',edition:'premier'}).availability,'unavailable');
 assert.equal(assess(a,'ai-es-assistant',{region:'ca-west-1',edition:'premier',deployment:'enterprise'}).availability,'conditional');
});
test('ES component and prerequisite differences prevent broad AI availability claims',()=>{
 const a=model(),s={region:'eu-south-1',edition:'premier'};
 assert.equal(assess(a,'ai-es-assistant',s).availability,'unavailable');
 assert.equal(assess(a,'ai-es-detection',s).availability,'conditional');
 assert.equal(assess(a,'ai-es-sop',s).availability,'unavailable');
 assert.equal(assess(a,'ai-es-sop',{deployment:'enterprise'}).availability,'unavailable');
 assert.equal(assess(a,'ai-es-soc',{edition:'essentials'}).availability,'unavailable');
 assert.equal(assess(a,'ai-es-threat-graph',{edition:'essentials'}).availability,'unavailable');
 assert.equal(assess(a,'ai-es-threat-graph',{deployment:'enterprise',edition:'premier'}).availability,'unavailable');
 const threat=assess(a,'ai-es-threat-graph',{edition:'premier'});assert.equal(threat.availability,'conditional');assert.match(threat.detail,/representative enablement/);
 const soc=a.data().capabilities.find(x=>x.id==='ai-es-soc');assert.equal(soc.verified,'2026-10-27');assert(soc.requirements.some(x=>/first 10.*approximately 200.*frontier models/i.test(x)));assert.match(soc.qualification,/es_soar_integration_user_role/);
});
test('ES GovCloud Cloud exclusion does not become CMP or universal offering authorization',()=>{
 const a=model();assert.equal(assess(a,'ai-es-assistant',{region:'us-gov-east-1',compliance:'fr-m'}).availability,'unavailable');
 const cmp=assess(a,'ai-es-assistant',{region:'us-gov-east-1',compliance:'fr-m',deployment:'enterprise',edition:'premier'});
 assert.equal(cmp.availability,'not_established');assert.equal(cmp.authorization,'not_established');
 assert.equal(assess(a,'ai-es-assistant',{region:'us-east-1',compliance:'fr-h'}).availability,'not_established');
});
test('ES provider exclusion remains a Cloud rule and Essentials uses its own regional evidence',()=>{
 const a=model();
 assert.equal(assess(a,'ai-es-assistant',{csp:'azure'}).availability,'unavailable');
 assert.equal(assess(a,'ai-es-assistant',{csp:'azure',deployment:'enterprise',edition:'premier'}).availability,'not_established');
 assert.equal(assess(a,'ai-es-assistant',{region:'us-east-1',edition:'essentials'}).availability,'conditional');
 assert.equal(assess(a,'ai-es-assistant',{region:'eu-north-1',edition:'essentials'}).availability,'unavailable');
 assert.equal(assess(a,'ai-es-assistant',{region:'eu-north-1',edition:'premier'}).availability,'not_established');
 assert.equal(assess(a,'ai-es-detection',{region:'eu-south-1',edition:'essentials'}).availability,'conditional');
 assert.equal(assess(a,'ai-es-sop',{region:'eu-south-1',edition:'essentials'}).availability,'unavailable');
 assert.equal(assess(a,'ai-es-assistant',{region:'ca-west-1',edition:'essentials'}).availability,'unavailable');
});
test('filtering, comparison and complete selected report share the same evidence and escape search',()=>{
 const a=model(),s=state(a,{aiProduct:'platform',mode:'compare',q:'<script>bad()</script>'});
 assert.equal(a.matching(s).length,0);const empty=a.report(s);assert(!empty.includes('<script>'));assert(empty.includes('&lt;script&gt;'));
 const selected=state(a,{aiProduct:'itsi',aiVersion:'5.0',mode:'compare'}),rows=a.matching(selected),report=a.report(selected);
 assert.equal(rows.length,1);assert(report.includes('Environment comparison'));assert(report.includes('ITSI 5.0+'));assert(!report.includes('<h3>ES ·'));
 for(const id of a.data().sourceIds)assert(report.includes('id="ai-ref-'+id+'"'));
 assert(report.includes('Not an authorization matrix'));
});
test('bounded model is deterministic, read-only and covers valid filter intersections',()=>{
 const a=model(),before=JSON.stringify(a.data()),ids=['all',...a.regions().map(r=>r.id)];
 for(const r of a.data().capabilities)for(const deployment of Object.keys(a.deployments))for(const compliance of Object.keys(a.regimes))for(const edition of Object.keys(a.editions))for(const region of ids){
  const result=a.assess(r,state(a,{deployment,compliance,edition,region}));assert(a.statuses[result.availability]);assert.equal(result.authorization,'not_established');
 }
 assert.equal(JSON.stringify(a.data()),before);
});
test('AI route loads bounded assets and no new browser agent tools',()=>{
 const loaded=[],main={},head=[],c={window:{location:{search:'?view=ai-availability'}},URLSearchParams,document:{querySelector:()=>main,querySelectorAll:()=>[],createElement:()=>({}),head:{appendChild:e=>head.push(e)},body:{appendChild:e=>{loaded.push(e.src);e.onload();}}}};
 vm.runInNewContext(fs.readFileSync('dist/site-router.js','utf8'),c);assert(loaded.includes('ai-availability-ui.js'));assert(loaded.includes('environment-data.js'));assert(!loaded.includes('app.js'));assert(!loaded.includes('webmcp.js'));assert(head.some(e=>e.href==='ai-availability.css'));
});
test('shared print footer and Cisco environment evidence use route-neutral readable styling',()=>{
 const editions=fs.readFileSync('dist/editions.css','utf8'),cisco=fs.readFileSync('dist/theme-cisco.css','utf8');
 assert(editions.includes('Version Compass · Independent public-source report'));
 assert(!editions.includes('Version Compass · Independent ES editions review'));
 assert.match(cisco,/\.theme-cisco \.edition-report \.env-record a[^}]*color:#8bb9ff!important/);
 assert.match(cisco,/\.theme-cisco \.edition-report \.env-evidence[^}]*color:#bac7df!important/);
});
