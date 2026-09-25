const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');
const window={};for(const f of ['environment-data.js','environment.js'])vm.runInNewContext(fs.readFileSync('dist/'+f,'utf8'),{window,URL,URLSearchParams});
const env=window.VersionCompassEnvironment;
const route=(environment,product='platform')=>({product,platform:'cloud',to:'10.5.2605',environment});
test('Ingest Processor retains its Victoria prerequisite and visible Classic restriction',()=>{
 for(const [region,compliance] of [['us-east-1','commercial'],['us-gov-east-1','fr-m']]){
  for(const product of ['platform','es','itsi']){
   const base={csp:'aws',region,compliance};
   const classic=route({...base,experience:'classic'},product);
   const victoria=route({...base,experience:'victoria'},product);
   const rows=s=>env.assess(s).records.filter(r=>r.feature==='Ingest Processor');
   assert.equal(rows(classic).length,1);assert.equal(rows(classic)[0].availability,'unavailable');
   assert.equal(rows(victoria).length,1);assert.equal(rows(victoria)[0].availability,'conditional');
   assert(rows(victoria)[0].sources.includes('ingest'));assert.match(rows(victoria)[0].detail,/tenant/);
   for(const r of [...rows(classic),...rows(victoria)])assert.equal(r.authorization,'not_established');
   assert.equal(rows(route(base,product)).length,2);
   const html=env.body(classic,true);assert.match(html,/Classic Experience/);assert(html.includes(env.data.sources.ingest.url));assert(!html.includes('<details'));
   assert.match(env.body(victoria,true),/Victoria Experience/);
   const restored=env.read('?'+env.append(new URLSearchParams(),classic.environment));assert.deepEqual({...restored.value},classic.environment);
  }
 }
 const high=env.assess(route({csp:'aws',compliance:'fr-h',experience:'victoria'}));
 assert.equal(high.records.find(r=>r.id==='ingest-high-unknown').availability,'not_established');
 assert.equal(high.records.find(r=>r.id==='s3-high').availability,'conflicting');
 const historical={...route({csp:'aws',region:'us-east-1',experience:'classic'}),from:'8.2.2203',to:'9.2.2406'};
 assert.match(env.assess(historical).scope,/separate from the selected historical/);
 assert.match(env.annotation(historical,{title:'Ingest Processor'}),/Classic Experience.*Documented unavailable/);
 const editions={...historical,view:'es-editions',product:'es'};
 assert(env.assess(editions).records.some(r=>r.id==='ingest-classic-commercial'));
 assert(!env.assess({...historical,product:'observability'}).records.some(r=>r.feature==='Ingest Processor'));
});
test('provider, region and compliance filters intersect without inferring unavailable combinations',()=>{
 const high=env.assess(route({csp:'aws',region:'us-gov-east-1',compliance:'fr-h'}));
 assert(high.records.length>0);assert(high.records.every(r=>r.provider==='aws'&&r.regions.includes('us-gov-east-1')&&r.regimes.includes('fr-h')));
 assert.equal(high.records.find(r=>r.id==='s3-high').availability,'conflicting');
 assert.equal(high.records.find(r=>r.id==='edge-high-unknown').availability,'not_established');
 const moderate=env.assess(route({compliance:'fr-m'}));assert(moderate.records.some(r=>r.id==='edge-moderate'));assert(!moderate.records.some(r=>r.id==='s3-high'));
 const missing=env.assess(route({csp:'azure',compliance:'fr-h'}));assert.equal(missing.records.length,0);assert.match(missing.coverageNote,/not an unavailability/);
 const region=env.assess(route({region:'gcp-oregon'},'es'));assert.equal(region.records.find(r=>r.id==='soar-oregon').availability,'unavailable');assert(!region.records.some(r=>r.id==='es-base-gcp'));
});
test('evidence scope, separate authorization, freshness, and source conflicts remain explicit',()=>{
 for(const r of env.data.records){assert(r.sources.length);assert(r.regions.length);for(const region of r.regions)assert(env.data.regions.some(x=>x.id===region&&x.provider===r.provider));for(const source of r.sources){const s=env.data.sources[source];assert(s);assert(/^https:\/\//.test(s.url));assert(s.checked);assert(s.scope);}assert(r.scope);assert(['documented','not_established'].includes(r.authorization));}
 assert.equal(env.data.sources.compliance.published,'2026-02');
 const conflict=env.data.records.find(r=>r.id==='s3-high');assert.equal(conflict.claims.length,2);assert.equal(new Set(conflict.claims.map(c=>c.source)).size,2);
 const itsi=env.assess(route({compliance:'fr-h'},'itsi'));assert.match(itsi.productNote,/host only/);
 const o=env.assess(route({compliance:'fr-h'},'observability'));assert.equal(o.records.length,0);assert.match(o.productNote,/does not establish/);
 const commercial=env.assess(route({csp:'gcp',region:'gcp-oregon',compliance:'commercial'},'observability'));assert(commercial.records.some(r=>r.realm==='us2'));
});
test('malformed and duplicated environment inputs never become verified defaults',()=>{
 for(const q of ['?csp=aws&csp=azure','?csp=unknown','?csp=aws&region=gcp-oregon','?compliance=fr-h&compliance=fr-m','?region=unknown'])assert(env.read(q).errors.length,q);
 assert.throws(()=>env.validate({csp:'__proto__'}));assert.throws(()=>env.validate({csp:1}));assert.throws(()=>env.validate({unknown:'aws'}));
 const read=env.read('?csp=gcp&region=gcp-oregon&compliance=commercial');assert.equal(read.errors.length,0);assert.equal(env.append(new URLSearchParams(),read.value).get('region'),'gcp-oregon');
 assert(!env.assess({product:'platform',platform:'enterprise',environment:{csp:'aws'}}).active);
 const invalid=env.assess({...route({}),environmentErrors:['Unrecognized region']});assert.equal(invalid.records.length,0);assert.match(env.body({...route({}),environmentErrors:['Unrecognized region']}),/needs review/);
});
test('regional feature notes and print retain every matching record and both conflict citations',()=>{
 const state=route({csp:'aws',region:'us-gov-east-1',compliance:'fr-h'}),a=env.assess(state),html=env.body(state,true);
 assert(!html.includes('<details'));for(const r of a.records)assert(html.includes(r.feature));
 for(const s of ['service','changes'])assert(html.includes(env.data.sources[s].url));
 assert.match(env.annotation(state,{title:'Federated search for Amazon S3'}),/Conflicting guidance/);
 const es=route({csp:'azure',region:'azure-london',compliance:'commercial'},'es');assert.match(env.annotation(es,{title:'UEBA'}),/Documented unavailable/);
 assert.equal(env.annotation(es,{title:'SOAR'}),'');
});
