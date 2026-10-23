const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const enterpriseUrl='https://advisory.splunk.com/advisories/SVD-2026-1007';

test('definitive Enterprise advisories replace the advance notice with exact affected and fixed versions',()=>{
 const p=require('../content/datasets/platform.json');
 const ranges={'9.4':['9.4.0 through 9.4.15','9.4.16'],'10.0':['10.0.0 through 10.0.10','10.0.11'],'10.2':['10.2.0 through 10.2.7','10.2.8'],'10.4':['10.4.0 through 10.4.3','10.4.4']};
 for(const [line,[affected,fixed]] of Object.entries(ranges)){
  const release=p.enterprise.releasesData[line],records=release.technicalChanges;
  const n=records.find(x=>x.component==='October 21 Enterprise security advisories');
  assert(n);assert.equal(n.source,enterpriseUrl);assert.equal(n.changeType,'Definitive advisories published');assert.equal(n.actionLevel,'Review');
  assert(n.to.includes(fixed));assert.match(n.implication,/customer-managed Splunk Enterprise/);
  const floor=records.find(x=>x.component===`Enterprise ${line} October security floor`);assert(floor);assert.equal(floor.source,enterpriseUrl);assert(floor.from.includes(affected));assert(floor.to.includes(fixed));
  const requirement=release.requirements.find(x=>x[0].includes('October 21')||x[0].includes(fixed));assert(requirement);assert.equal(requirement[3],enterpriseUrl);assert(requirement[1].includes(fixed));
 }
 assert(!JSON.stringify(p.cloud).includes('SVD-2026-1007'));
 assert(!p.enterprise.releasesData['10.6'].technicalChanges.some(x=>x.source===enterpriseUrl));
});

test('HF reports get Enterprise advisory floors while UF reports do not inherit them',()=>{
 const c={window:{},URLSearchParams};for(const f of ['data.js','product-data.js','comparison.js','forwarders-data.js','forwarders.js'])vm.runInNewContext(fs.readFileSync('dist/'+f,'utf8'),c);
 const a=c.window.VersionCompassForwarders,d=c.window.VersionCompassForwarderData;
 for(const destination of a.options.destination){
  const base={destination,from:'10.4',to:'10.6',receiver:'10.6',cloudReceiver:'10.6'};
  const uf=a.assess({...a.defaults,...base,type:'uf'});assert(!uf.risks.some(x=>x.source==='securityOctober'));
  const hf=a.assess({...a.defaults,...base,type:'hf'}),n=hf.risks.find(x=>x.source==='securityOctober');assert(n);assert.match(n.detail,/10.4.4/);assert.match(n.detail,/Heavy Forwarders only/);assert.equal(d.sources[n.source].url,enterpriseUrl);
  assert(uf.security.source==='ufSecurity');assert(hf.security.source==='hfSecurity');
  assert.equal(uf.claims.find(x=>x.title==='Authorization').status,'not_established');assert.equal(hf.claims.find(x=>x.title==='Authorization').status,'not_established');
 }
});

test('SOAR definitive advisories stay on-premises and preserve build/runtime boundaries',()=>{
 const c={window:{},URLSearchParams};for(const f of ['soar-data.js','soar.js'])vm.runInNewContext(fs.readFileSync('dist/'+f,'utf8'),c);
 const a=c.window.VersionCompassSOAR,cmp=a.assess({...a.defaults,deployment:'cmp'}),n=cmp.issues.find(x=>x.id==='security-notice-20261021');
 assert(n);assert.equal(n.status,'Required');assert.match(n.detail,/versions below 8\.7\.0 as affected/);assert.match(n.qualification,/do not establish SOAR Cloud tenant rollout/);
 assert.deepEqual(Array.from(n.src),['securityOctober','securityHardeningOctober','packagesOctober']);
 for(const id of n.src)assert.match(cmp.sources[id].url,/SVD-2026-101[012]/);
 assert(cmp.requirements.some(x=>x.id==='python87'));assert(cmp.issues.some(x=>x.id==='build243'));
 const cloud=a.assess({...a.defaults,deployment:'cloud'});assert(!cloud.issues.some(x=>x.id==='security-notice-20261021'));
 const high=a.assess({...a.defaults,deployment:'cloud',compliance:'fr-h'});assert.equal(high.availability.status,'Not established');
});
