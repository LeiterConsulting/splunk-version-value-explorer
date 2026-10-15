const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const url='https://advisory.splunk.com/advisories/SVD-2026-1006';
test('advance notice retains exact named versions without rewriting disclosed floors or Cloud scope',()=>{
 const p=require('../content/datasets/platform.json');
 for(const [line,version] of Object.entries({'9.4':'9.4.16','10.0':'10.0.11','10.2':'10.2.8','10.4':'10.4.4'})){
  const records=p.enterprise.releasesData[line].technicalChanges;
  const n=records.find(x=>x.component==='October 21 security advisory advance notice');
  assert(n);assert.equal(n.source,url);assert.equal(n.changeType,'Advance notice');assert.equal(n.actionLevel,'Review');
  assert(n.to.includes(version));assert(n.to.includes('October 21, 2026'));
  assert.match(n.implication,/not disclosed CVE detail/);assert.match(n.action,/existing vulnerability-specific actions/);
  assert(records.some(x=>x.component===`Enterprise ${line} October security floor`&&x.source.endsWith('SVD-2026-1001')));
 }
 assert(!JSON.stringify(p.cloud).includes('SVD-2026-1006'));
 assert(!p.enterprise.releasesData['10.6'].technicalChanges.some(x=>x.source===url));
});
test('UF/HF reports cite the notice on named route lines without treating 10.6 as exempt',()=>{
 const c={window:{},URLSearchParams};for(const f of ['data.js','product-data.js','comparison.js','forwarders-data.js','forwarders.js'])vm.runInNewContext(fs.readFileSync('dist/'+f,'utf8'),c);
 const a=c.window.VersionCompassForwarders,d=c.window.VersionCompassForwarderData;
 for(const type of ['uf','hf'])for(const destination of a.options.destination){
  const r=a.assess({...a.defaults,type,destination,from:'10.4',to:'10.6',receiver:'10.6',cloudReceiver:'10.6'});
  const n=r.risks.find(x=>x.source==='securityNotice');assert(n);assert(n.detail.includes('10.4.4'));
  assert.match(n.detail,/safe 10.6 exemption/);assert.equal(d.sources[n.source].url,url);
  assert(r.security.source=== (type==='uf'?'ufSecurity':'hfSecurity'));
  assert.equal(r.claims.find(x=>x.title==='Authorization').status,'not_established');
 }
});
test('SOAR notice does not infer build, deployment, vulnerability or tenant rollout',()=>{
 const c={window:{},URLSearchParams};for(const f of ['soar-data.js','soar.js'])vm.runInNewContext(fs.readFileSync('dist/'+f,'utf8'),c);
 const a=c.window.VersionCompassSOAR;
 for(const deployment of ['cmp','cloud']){
  const r=a.assess({...a.defaults,deployment}),n=r.issues.find(x=>x.id==='security-notice-20261021');assert(n);
  assert.match(n.status,/deployment scope unestablished/);assert.match(n.detail,/No CVEs, affected-version range, exact build or Cloud\/on-premises scope/);
  assert.equal(r.sources[n.src[0]].url,url);assert(r.requirements.some(x=>x.id==='python87'));
  assert.equal(r.issues.some(x=>x.id==='build243'),deployment==='cmp');
 }
 const high=a.assess({...a.defaults,deployment:'cloud',compliance:'fr-h'});assert.equal(high.availability.status,'Not established');
});
