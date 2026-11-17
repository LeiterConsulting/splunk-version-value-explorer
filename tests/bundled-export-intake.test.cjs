const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {fixture,NOW}=require('./helpers/protected-export-fixture.cjs');
const endpoint='https://versioncompass.com/api/publisher/export-qualification';
let worker;
async function built(){if(!worker){require('node:child_process').execFileSync(process.execPath,['scripts/build-worker.cjs'],{stdio:'pipe'});worker=(await import('data:text/javascript;base64,'+fs.readFileSync('dist/server/index.js').toString('base64'))).default;}return worker;}
function env(f,patch={}){const e={VC_EXPORT_INTAKE_ENABLED:'1',VC_PUBLISHER_OIDC:'1',VC_ACTIVE_DELIVERY:'0',VC_PUBLISHER_ACTIVATION:'0',VC_EXPORT_INTAKE_POLICY:JSON.stringify(f.policy),VC_EXPORT_INTAKE_GITHUB_TOKEN:'SERVER_ONLY',...patch};return new Proxy(e,{get(o,k){assert(Object.hasOwn(o,k),'unexpected environment access '+String(k));return o[k]},ownKeys(){throw Error('environment enumeration')}})}
async function request(f,{patch={},url=endpoint,init={},fetcher=f.fetcher}={}){const oldFetch=global.fetch,oldNow=Date.now;global.fetch=fetcher;Date.now=()=>NOW;try{return await(await built()).fetch(new Request(url,{method:'POST',headers:{Authorization:'Bearer '+f.token},...init}),env(f,patch));}finally{global.fetch=oldFetch;Date.now=oldNow;}}
test('built entry invokes real signed intake without DB/capability forwarding',async()=>{
 const f=await fixture(),r=await request(f),text=await r.text(),x=JSON.parse(text);assert.equal(r.status,409);assert.equal(x.status,'protected-export-evidence-acquired');assert.equal(x.admission,'held');assert.equal(x.productionActionAllowed,false);assert.equal(f.calls.length,24);assert(!text.includes(f.token));assert(!text.includes('SERVER_ONLY'));
});
test('built entry default-off and invalid controls never read secret or make network requests',async()=>{
 const f=await fixture();for(const patch of [{VC_EXPORT_INTAKE_ENABLED:undefined},{VC_EXPORT_INTAKE_ENABLED:'0'},{VC_ACTIVE_DELIVERY:'1'},{VC_PUBLISHER_ACTIVATION:'1'},{VC_EXPORT_INTAKE_POLICY:'{"x":1,"x":2}'}]){
  let reads=0,calls=0;const e=env(f,patch),guard=new Proxy(e,{get(o,k){if(k==='VC_EXPORT_INTAKE_GITHUB_TOKEN'){reads++;throw Error('secret read')}return o[k]}});const old=global.fetch;global.fetch=()=>{calls++;throw Error('network')};try{const r=await(await built()).fetch(new Request(endpoint,{method:'POST',headers:{Authorization:'Bearer '+f.token}}),guard);assert([409,423].includes(r.status));assert.equal(reads,0);assert.equal(calls,0)}finally{global.fetch=old}
 }
});
test('built entry rejects selectors/body/origin and sanitized failures without DB fallback',async()=>{
 const f=await fixture();for(const opts of [{url:endpoint+'?run=1'},{url:'https://evil.invalid/api/publisher/export-qualification'},{init:{body:'{}'}},{init:{headers:{Origin:'https://versioncompass.com',Authorization:'Bearer '+f.token}}}]){const r=await request(f,opts);assert([400,404].includes(r.status));assert.equal(f.calls.length,0)}
 const r=await request(f,{fetcher:async()=>{throw Error('SERVER_ONLY '+f.token)}}),text=await r.text();assert.equal(r.status,409);assert(!text.includes(f.token));assert(!text.includes('SERVER_ONLY'));
});
test('built entry fails closed for expired identity and main drift',async()=>{
 for(const opts of [{claims:{exp:NOW/1000-1}},{change:(p,d)=>p==='/branches/main'?Response.json({commit:{sha:'f'.repeat(40)}}):null}]){const f=await fixture(opts),r=await request(f),x=await r.json();assert.equal(r.status,409);assert.notEqual(x.status,'protected-export-evidence-acquired');assert.equal(x.productionActionAllowed,false)}
});
test('built public page routing preserved without reading intake secret',async()=>{
 const r=await(await built()).fetch(new Request('https://versioncompass.com/'),new Proxy({},{get(o,k){assert.notEqual(k,'VC_EXPORT_INTAKE_GITHUB_TOKEN');return undefined}}));assert.equal(r.status,200);assert.match(await r.text(),/Version Compass|VersionCompass/);
});
test('every intake graph and packaging input participates in engine identity',()=>{
 const source=fs.readFileSync('scripts/sync-content.cjs','utf8'),line=source.split('\n').find(x=>x.startsWith('const engineFiles = '));assert(line);
 // Evaluate only the repository-owned deterministic file-list expression.
 const files=Function(line+';return engineFiles;')();const expected=['worker/export-intake-entry.mjs','tools/release-coordination/export-intake-route.mjs','tools/release-coordination/protected-export-intake.mjs','tools/release-coordination/publisher-run-identity.mjs','tools/release-coordination/qualification-artifact.mjs','scripts/build-worker.cjs','package.json','package-lock.json'];
 const rows=files.map(p=>[p,fs.readFileSync(p,'utf8')]),hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');const base=hash(rows);assert.equal('engine-'+base.slice(0,20),JSON.parse(fs.readFileSync('content/publication.json')).engineRevision);
 for(const p of expected){assert(files.includes(p),p);const changed=rows.map(([n,s])=>[n,s+(n===p?'\n// mutation':'')]);assert.notEqual(hash(changed),base,p)}
});
test('built entry supports deflate-raw artifact decoding through runtime APIs',async()=>{
 const f=await fixture({zipOptions:{method:8}}),r=await request(f),x=await r.json();assert.equal(r.status,409);assert.equal(x.status,'protected-export-evidence-acquired');assert.equal(x.productionActionAllowed,false);
});
test('fresh build jobs install locked dependencies with lifecycle scripts disabled',()=>{
 for(const p of ['.github/workflows/validate.yml','.github/workflows/prepare-publication.yml','.github/workflows/publish-content.yml']){
  const s=fs.readFileSync(p,'utf8'),install=s.indexOf('run: npm ci --ignore-scripts --no-audit --no-fund');assert(install>=0,p);
  const build=s.indexOf(p.includes('publish-content')?'run: node scripts/build-worker.cjs':'run: node --test tests/*.test.cjs');assert(build>install,p);
  if(p.includes('publish-content')){assert(install>s.indexOf('run: node scripts/export-qualification-workflow.cjs'));const q=s.slice(s.indexOf('  qualify-exports:'));assert(!q.includes('id-token: write'));assert(!q.includes('request-export-intake.mjs'));}
 }
});
