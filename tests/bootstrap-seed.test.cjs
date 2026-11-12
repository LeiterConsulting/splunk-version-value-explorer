
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
let commit='a'.repeat(40),seedCommit='b'.repeat(40),engine='engine-'+'c'.repeat(20),revision='content-'+'d'.repeat(24),repo='LeiterConsulting/splunk-version-value-explorer',now=1700000000000;
function fixture(){
 const url='https://example.com/source',globals={SPLUNK_DATA:{},VersionCompassEnvironmentData:{},VersionCompassEditions:{},VersionCompassForwarderData:{},VersionCompassSOARData:{}},catalog={schemaVersion:1,records:[{id:'source-'+hash(url).slice(0,20),kind:'source',dataset:'sources',url}]};
 const manifest={schemaVersion:1,revision,engineRevision:engine,digest:hash({schemaVersion:1,globals,catalog}),datasetHashes:Object.fromEntries(['platform','products','guidance','environment','editions','forwarders','soar'].map(x=>[x,'e'.repeat(64)])),recordCount:1,provenance:'synthetic test',verificationPolicy:'test only',phase:'test'};
 manifest.revision=revision='content-'+hash({digest:manifest.digest,engineRevision:engine,datasetHashes:manifest.datasetHashes}).slice(0,24);
 const bundle={manifest,globals,catalog};
 const deployment={schemaVersion:1,repository:repo,sourceCommit:seedCommit,sourceTree:'f'.repeat(40),sitesVersion:290,sitesSourceCommit:'1'.repeat(40),seed:{schemaVersion:1,engineRevision:engine,revision,digest:manifest.digest,recordCount:1}};
 const env={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:repo,GITHUB_REF:'refs/heads/main',GITHUB_REF_TYPE:'branch',GITHUB_WORKFLOW_REF:repo+'/.github/workflows/publish-content.yml@refs/heads/main',GITHUB_SHA:commit,GITHUB_WORKFLOW_SHA:commit,VC_BOOTSTRAP_MODE:'bootstrap-only',VC_BOOTSTRAP_EXPECTED_COMMIT:commit,VC_BOOTSTRAP_EXPECTED_REF:'refs/heads/main',VC_BOOTSTRAP_EXPECTED_SEED_COMMIT:seedCommit,VC_BOOTSTRAP_EXPECTED_ENGINE:engine,VC_BOOTSTRAP_EXPECTED_REVISION:revision,VC_GITHUB_EVIDENCE_TOKEN:'e'.repeat(30),ACTIONS_ID_TOKEN_REQUEST_URL:'https://test.actions.githubusercontent.com/idtoken',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'t'.repeat(30)};
 return {env,manifest,checkoutSha:commit,deployment,sourceTree:deployment.sourceTree,candidate:{repository:repo,commit,bundle},deployedBundle:structuredClone(bundle),now:()=>now};
}
function token(){
 const c={iss:'https://token.actions.githubusercontent.com',aud:'https://versioncompass.com',repository:repo,repository_id:'1366223729',repository_owner_id:'152733483',repository_visibility:'public',ref:'refs/heads/main',ref_type:'branch',workflow_ref:repo+'/.github/workflows/publish-content.yml@refs/heads/main',sha:commit,runner_environment:'github-hosted',event_name:'workflow_dispatch',sub:'repo:'+repo+':ref:refs/heads/main',iat:now/1000,nbf:now/1000,exp:now/1000+300};
 return 'e30.'+Buffer.from(JSON.stringify(c)).toString('base64url')+'.signature';
}
async function run(options={},reply){
 const calls=[],f=fixture();Object.assign(f,options);
 f.fetcher=async(url,opts)=>{calls.push({url:String(url),opts});if(calls.length===1)return new Response(JSON.stringify({value:token()}));return reply?reply(url,opts):new Response(JSON.stringify({status:'initialized',revision,engineRevision:engine,generation:1}));};
 const r=await(await import('../scripts/bootstrap-seed.mjs')).bootstrapSeed(f);return {r,calls};
}
test('manual exact seed sends only credential GET and one stable bootstrap POST',async()=>{
 const a=await run(),b=await run();assert.equal(a.r.status,'bootstrap-reported');assert.equal(a.calls.length,2);assert.equal(a.calls[1].opts.method,'POST');assert.equal(a.calls[1].url,'https://versioncompass.com/api/publisher/bootstrap');assert.equal(a.r.operationId,b.r.operationId);assert.equal(a.r.claimedDelivered,false);assert.doesNotMatch(JSON.stringify(a.r),/e{30}|signature|evidenceCredential/);
});
test('automatic mode, wrong context and changed deployment fail before any request',async()=>{
 for(const mutate of [f=>f.env.GITHUB_ACTIONS='false',f=>f.env.GITHUB_EVENT_NAME='workflow_run',f=>f.env.VC_BOOTSTRAP_MODE='publish',f=>f.env.GITHUB_SHA='0'.repeat(40),f=>f.deployment.sourceTree='0'.repeat(40),f=>f.candidate.bundle.globals.SPLUNK_DATA.bad=true]){
 const f=fixture();mutate(f);const {r,calls}=await run(f);assert.equal(r.status,'failed');assert.equal(calls.length,0);}
});
test('current engine/candidate differing from reviewed seed is rejected before credentials',async()=>{
 const f=fixture();f.candidate.bundle.manifest.engineRevision='engine-'+'f'.repeat(20);const {r,calls}=await run(f);assert.equal(r.status,'failed');assert.equal(calls.length,0);
});
test('rejection and malformed POST results stop uncertain without retry or raw error',async()=>{
 for(const reply of [()=>new Response('{"private":"secret"}',{status:409}),()=>new Response('{"status":"initialized"}'),()=>{throw Error('PRIVATE secret');}]){
 const {r,calls}=await run({},reply);assert.equal(r.status,'failed');assert.equal(calls.length,2);assert.equal(r.mutationOutcome,'uncertain-read-back-before-retry');assert.ok(r.operationId);assert.doesNotMatch(JSON.stringify(r),/PRIVATE|secret/);}
});
test('POST timeout stops without later calls',async()=>{
 const {r,calls}=await run({timeoutMs:25},()=>new Promise(()=>{}));assert.equal(r.reason,'request-timeout');assert.equal(r.mutationAttempted,true);assert.equal(calls.length,2);
});
test('generation above one is accepted without a newly-created-history claim',async()=>{
 const {r}=await run({},()=>new Response(JSON.stringify({status:'initialized',revision,engineRevision:engine,generation:4})));assert.equal(r.status,'bootstrap-reported');assert.equal(r.generation,4);assert.match(r.qualification,/readback required/);
});
test('dirty checkout rejection precedes file reads',async()=>{
 const {loadBootstrapInputs}=await import('../scripts/bootstrap-seed.mjs');let calls=0;
 assert.throws(()=>loadBootstrapInputs({env:fixture().env,run:args=>{calls++;return '?? rogue.mjs';}}),/checkout-rejected/);assert.equal(calls,1);
});
test('unapproved/default loader environment rejected without git or network',async()=>{
 const {loadBootstrapInputs}=await import('../scripts/bootstrap-seed.mjs');
 assert.throws(()=>loadBootstrapInputs({env:{},run:()=>{throw Error('must not run')}}),/context-rejected/);
});

test('automatic/default workflow stays held and bootstrap is manual explicit only',()=>{
 const {workflowMode}=require('../scripts/publisher-workflow-mode.cjs');
 assert.equal(workflowMode('workflow_run',{inputs:{mode:'bootstrap-only'}}),'held');
 assert.equal(workflowMode('workflow_dispatch',{inputs:{mode:'publish'}}),'held');
 assert.equal(workflowMode('workflow_dispatch',{inputs:{mode:'bootstrap-only'}}),'bootstrap-only');
 assert.throws(()=>workflowMode('push',{inputs:{mode:'bootstrap-only'}}));
 const w=require('node:fs').readFileSync('.github/workflows/publish-content.yml','utf8');
 assert.match(w,/github.event_name != 'workflow_dispatch' \|\|/);assert.match(w,/inputs.mode != 'bootstrap-only'/);
});
test('redirect, oversize and malformed response do not cause retries',async()=>{
 for(const reply of [()=>new Response('{}',{status:302,headers:{location:'https://other.example/'}}),()=>new Response('x'.repeat(17000)),()=>new Response('not json')]){
 const {r,calls}=await run({},reply);assert.equal(r.status,'failed');assert.equal(calls.length,2);assert.equal(r.mutationOutcome,'uncertain-read-back-before-retry');}
});
test('successful receipt is not a delivery or fresh-history claim',async()=>{
 const {r}=await run();assert.equal(r.claimedDelivered,false);assert.match(r.mutationOutcome,/read-back-required/);assert.match(r.qualification,/No activation/);
});

test('manual workflow labels disclose bootstrap D1 writes separately from observations',()=>{
 const w=require('node:fs').readFileSync('.github/workflows/publish-content.yml','utf8');
 assert.match(w,/bootstrap-only writes reviewed seed\/history to D1 without activation/);
 assert.match(w,/Bootstrap reviewed seed \(D1 write\)/);
 assert.doesNotMatch(w,/Read-only modes/);
});
