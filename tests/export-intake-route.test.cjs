const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {fixture,NOW}=require('./helpers/protected-export-fixture.cjs');
const endpoint='https://versioncompass.com/api/publisher/export-qualification',route=import('../tools/release-coordination/export-intake-route.mjs');
function configured(f){return {VC_EXPORT_INTAKE_ENABLED:'1',VC_PUBLISHER_OIDC:'1',VC_ACTIVE_DELIVERY:'0',VC_PUBLISHER_ACTIVATION:'0',VC_EXPORT_INTAKE_POLICY:JSON.stringify(f.policy),VC_EXPORT_INTAKE_GITHUB_TOKEN:'SERVER_ONLY'}}
test('inactive configured route invokes real signed-fixture intake without DB access',async()=>{
 const f=await fixture(),read=[];const env=new Proxy(configured(f),{get(o,k){read.push(k);assert.notEqual(k,'DB');return o[k]}});
 const r=await(await route).exportIntakeRequest(new Request(endpoint,{method:'POST',headers:{Authorization:'Bearer '+f.token}}),env,{fetcher:f.fetcher,clock:()=>NOW});
 assert.equal(r.status,409);const text=await r.text(),v=JSON.parse(text);assert.equal(v.status,'protected-export-evidence-acquired');assert.equal(v.runId,'123');assert.equal(v.admission,'held');assert.equal(v.productionActionAllowed,false);assert.equal(f.calls.length,24);assert(!text.includes(f.token));assert(!text.includes('SERVER_ONLY'));assert(!text.includes('runnerAssertion'));assert(read.includes('VC_EXPORT_INTAKE_GITHUB_TOKEN'));
});
test('wrong origin/path/selectors/method/body/auth never reads runtime secret or fetches',async()=>{
 const env=new Proxy({},{get(){throw Error('environment-read-before-boundary')}});let calls=0;
 for(const [url,init] of [['https://evil.invalid/api/publisher/export-qualification',{method:'POST'}],[endpoint+'?artifact=1',{method:'POST'}],[endpoint+'#x',{method:'POST'}],[endpoint,{}],[endpoint,{method:'POST',body:'{}'}],[endpoint,{method:'POST',headers:{Origin:'https://versioncompass.com'}}],[endpoint,{method:'POST',headers:{'x-github-token':'NEVER',Authorization:'Bearer a.b.c'}}],[endpoint,{method:'POST',headers:{Authorization:'Bearer a.b'}}],[endpoint,{method:'POST'}]]){
  let request;try{request=new Request(url,init)}catch{continue}
  const r=await(await route).exportIntakeRequest(request,env,{fetcher:async()=>{calls++;throw Error('no')}});assert.notEqual(r.status,409,'reject before environment access');assert(!await r.text().then(x=>x.includes('NEVER')));
 }assert.equal(calls,0);
});
test('inactive controls missing secret malformed policy and raw failures always hold sanitized',async()=>{
 for(const change of [e=>delete e.VC_EXPORT_INTAKE_ENABLED,e=>e.VC_ACTIVE_DELIVERY='1',e=>e.VC_PUBLISHER_ACTIVATION='1',e=>delete e.VC_EXPORT_INTAKE_GITHUB_TOKEN,e=>e.VC_EXPORT_INTAKE_POLICY='{"x":1,"x":2}',e=>e.VC_EXPORT_INTAKE_POLICY='x'.repeat(4097)]){
  const f=await fixture(),e=configured(f);change(e);const r=await(await route).exportIntakeRequest(new Request(endpoint,{method:'POST',headers:{Authorization:'Bearer '+f.token}}),e,{fetcher:f.fetcher,clock:()=>NOW});assert([409,423].includes(r.status));assert.equal(f.calls.length,0);assert(!await r.text().then(x=>x.includes('SERVER_ONLY')));
 }
 const f=await fixture(),r=await(await route).exportIntakeRequest(new Request(endpoint,{method:'POST',headers:{Authorization:'Bearer '+f.token}}),configured(f),{fetcher:async()=>{throw Error('SERVER_ONLY '+f.token)},clock:()=>NOW});const text=await r.text();assert.equal(r.status,409);assert(!text.includes('SERVER_ONLY'));assert(!text.includes(f.token));
});
test('wrapper remains outside active Worker and workflow and has no persistence capabilities',()=>{
 for(const p of ['worker/index.mjs','worker/publisher.mjs','scripts/build-worker.cjs','.github/workflows/publish-content.yml'])assert(!fs.readFileSync(p,'utf8').includes('export-intake-route'));
 const s=fs.readFileSync('tools/release-coordination/export-intake-route.mjs','utf8');assert.doesNotMatch(s,/env\.DB|console\.|localStorage|issuer-cas|\.put\(|\.prepare\(/);
});
test('actual sender to wrapper to authenticated intake remains held, without job token or DB',async()=>{
 const {requestExportIntake}=await import('../scripts/request-export-intake.mjs'),{SHA,REPO,WORKFLOW}=require('./helpers/protected-export-fixture.cjs');
 const f=await fixture(),clientCalls=[];
 const e={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:REPO,GITHUB_REF:'refs/heads/main',GITHUB_REF_TYPE:'branch',GITHUB_RUN_ATTEMPT:'1',GITHUB_WORKFLOW_REF:REPO+'/'+WORKFLOW+'@refs/heads/main',GITHUB_SHA:SHA,GITHUB_WORKFLOW_SHA:SHA,GITHUB_RUN_ID:'123',VC_EXPORT_INTAKE_MODE:'request-export-intake-only',VC_EXPORT_INTAKE_EXPECTED_COMMIT:SHA,VC_EXPORT_INTAKE_EXPECTED_REF:'refs/heads/main',ACTIONS_ID_TOKEN_REQUEST_URL:'https://test.actions.githubusercontent.com/token',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'synthetic-issuer-token-only'};
 const guarded=new Proxy(e,{get(o,k){assert(!/GITHUB_TOKEN|GH_TOKEN|SECRET/.test(k));return o[k]},ownKeys(){throw Error('environment enumeration')}});
 const result=await requestExportIntake({env:guarded,checkoutSha:SHA,now:()=>NOW,fetcher:async(u,opt)=>{
  clientCalls.push(String(u));if(clientCalls.length===1)return Response.json({value:f.token});
  assert.equal(String(u),endpoint);assert.deepEqual(Object.keys(opt.headers).sort(),['Accept','Authorization']);assert.equal(opt.body,undefined);
  return(await route).exportIntakeRequest(new Request(u,opt),new Proxy(configured(f),{get(o,k){assert.notEqual(k,'DB');return o[k]}}),{fetcher:f.fetcher,clock:()=>NOW});
 }});
 assert.equal(result.status,'protected-export-evidence-acquired');assert.equal(result.admission,'held');assert.equal(result.productionActionAllowed,false);assert.equal(result.deliveryVerified,false);assert.equal(clientCalls.length,2);assert.equal(f.calls.length,24);assert(!JSON.stringify(result).includes(f.token));assert(!JSON.stringify(result).includes('SERVER_ONLY'));
});
