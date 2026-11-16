const test=require('node:test'),assert=require('node:assert/strict');
const repo='LeiterConsulting/splunk-version-value-explorer',sha='a'.repeat(40),now=1800000000000;
const manifest={schemaVersion:1,engineRevision:'engine-'+'b'.repeat(20),revision:'content-'+'c'.repeat(24),digest:'d'.repeat(64)};
const env={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',VC_COMMISSION_MODE:'commissioning-only',GITHUB_REPOSITORY:repo,GITHUB_REF:'refs/heads/main',GITHUB_REF_TYPE:'branch',GITHUB_WORKFLOW_REF:repo+'/.github/workflows/publish-content.yml@refs/heads/main',VC_COMMISSION_EXPECTED_REF:'refs/heads/main',GITHUB_SHA:sha,GITHUB_WORKFLOW_SHA:sha,VC_COMMISSION_EXPECTED_COMMIT:sha,GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1',VC_COMMISSION_EXPECTED_ENGINE:manifest.engineRevision,VC_COMMISSION_EXPECTED_REVISION:manifest.revision,ACTIONS_ID_TOKEN_REQUEST_URL:'https://test.actions.githubusercontent.com/token',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'secret'.repeat(5)};
const claims={iss:'https://token.actions.githubusercontent.com',aud:'https://versioncompass.com',repository:repo,repository_id:'1366223729',repository_owner_id:'152733483',repository_visibility:'public',ref:env.GITHUB_REF,ref_type:'branch',workflow_ref:env.GITHUB_WORKFLOW_REF,sha,workflow_sha:sha,run_id:'123',run_attempt:'1',runner_environment:'github-hosted',event_name:'workflow_dispatch',sub:'repo:'+repo+':ref:'+env.GITHUB_REF,iat:now/1000,nbf:now/1000,exp:now/1000+300};
const token=c=>'e30.'+Buffer.from(JSON.stringify(c)).toString('base64url')+'.c2ln';
const response={schemaVersion:1,status:'signed-identity-observed',identity:{repository:repo,commit:sha,eventName:'workflow_dispatch',runId:'123',runAttempt:'1',workflowSha:sha},runtime:{engineRevision:manifest.engineRevision,contentRevision:manifest.revision,digest:manifest.digest},controls:{reader:false,publisher:false},claimsSignatureVerified:true,serviceRunVerified:false,artifactUploadAttemptVerified:false,admission:'held',databaseAccessed:false,mutationAttempted:false,productionActionAllowed:false,deliveryVerified:false};
const load=()=>import('../scripts/commission-publisher.mjs');
const json=x=>new Response(JSON.stringify(x));
async function run({environment=env,c=claims,value=response,transport,timeoutMs=10000,monotonic,wallNow=()=>now}={}){const {commissionPublisher}=await load();const calls=[];const result=await commissionPublisher({env:environment,manifest,checkoutSha:sha,now:wallNow,timeoutMs,monotonic,fetcher:async(url,options)=>{calls.push({url:String(url),options});return transport?transport(url,options,calls.length):calls.length===1?json({value:token(c)}):json(value);}});return {result,calls};}
test('fixed GET only, sanitized exact identity, no admission or delivery claim',async()=>{const {result,calls}=await run();assert.equal(result.status,'signed-identity-observed',JSON.stringify(result));assert.equal(calls.length,2);assert.equal(calls[1].url,'https://versioncompass.com/api/publisher/commissioning-identity');for(const c of calls){assert.equal(c.options.method,'GET');assert.equal(c.options.redirect,'manual');assert.equal(c.options.body,undefined);}assert.equal(result.productionActionAllowed,false);assert.equal(JSON.stringify(result).includes(token(claims)),false);assert.equal(JSON.stringify(result).includes(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN),false);});
test('reject wrong context before credential/network',async()=>{for(const [key,value] of Object.entries({GITHUB_EVENT_NAME:'workflow_run',GITHUB_RUN_ID:'0123',GITHUB_RUN_ATTEMPT:1,GITHUB_WORKFLOW_SHA:'b'.repeat(40),VC_COMMISSION_EXPECTED_ENGINE:'engine-'+'e'.repeat(20),GITHUB_SHA:[sha],VC_COMMISSION_MODE:'publish'})){const {result,calls}=await run({environment:{...env,[key]:value}});assert.equal(result.status,'failed',key);assert.equal(calls.length,0,key);}});
test('credential exact attempt/workflow binding before route',async()=>{for(const patch of [{run_attempt:'2'},{workflow_sha:'b'.repeat(40)},{run_id:123},{aud:'https://evil.example'},{event_name:'push'},{exp:now/1000-1}]){const {result,calls}=await run({c:{...claims,...patch}});assert.equal(result.reason,'credential-context-rejected');assert.equal(calls.length,1);}});
test('reject response authority escalation, unknown fields and identity drift',async()=>{for(const value of [{...response,productionActionAllowed:true},{...response,secret:'never-retain'},{...response,controls:{reader:true,publisher:false}},{...response,identity:{...response.identity,runAttempt:'2'}},{...response,runtime:{...response.runtime,digest:'f'.repeat(64)}}]){const {result}=await run({value});assert.equal(result.status,'failed');assert.equal(JSON.stringify(result).includes('never-retain'),false);assert.equal(result.observation,undefined);}});
test('reject issuer outside GitHub and malformed request token',async()=>{for(const patch of [{ACTIONS_ID_TOKEN_REQUEST_URL:'https://evil.example/token'},{ACTIONS_ID_TOKEN_REQUEST_URL:'https://test.actions.githubusercontent.com.evil.example/token'},{ACTIONS_ID_TOKEN_REQUEST_TOKEN:'bad\nsecret'}]){const {result,calls}=await run({environment:{...env,...patch}});assert.equal(result.reason,'issuer-rejected');assert.equal(calls.length,0);}});
test('no redirect follow, oversized response or transport secret retained',async()=>{for(const transport of [()=>new Response('',{status:302,headers:{location:'https://evil.example'}}),()=>new Response('x'.repeat(32769)),()=>{throw Error('private-secret');}]){const {result,calls}=await run({transport});assert.equal(result.status,'failed');assert.equal(calls.length,1);assert.equal(JSON.stringify(result).includes('private-secret'),false);}});
test('stalled fetch and body abort within bounded deadline; no retry',async()=>{for(const transport of [()=>new Promise(()=>{}),()=>new Response(new ReadableStream({start(){}}))]){const start=Date.now();const {result,calls}=await run({transport,timeoutMs:30});assert.equal(result.reason,'request-timeout');assert.equal(calls.length,1);assert.equal(calls[0].options.signal.aborted,true);assert.ok(Date.now()-start<1500);}});
test('route HTTP rejection sanitized, no further request',async()=>{const {result,calls}=await run({transport:(u,o,n)=>n===1?json({value:token(claims)}):new Response(JSON.stringify({error:'private-secret'}),{status:401})});assert.equal(result.reason,'observation-http-rejected');assert.equal(calls.length,2);assert.equal(JSON.stringify(result).includes('private-secret'),false);});
test('route body size rejects oversized bytes without saving upstream content',async()=>{
 const {result,calls}=await run({transport:(u,o,n)=>n===1?json({value:token(claims)}):new Response('x'.repeat(16385))});
 assert.equal(result.status,'failed');assert.equal(result.reason,'response-too-large');assert.equal(calls.length,2);
 assert.equal(result.observation,undefined);assert.equal(calls[1].options.signal.aborted,true);
});
test('stalled route body is aborted by the real timer without retry or retained bytes',async()=>{
 // Keep logical CPU time fixed so issuer-phase scheduling cannot consume this
 // route-specific fixture's budget. The real 30ms timer must abort the stall.
 const start=Date.now();
 const {result,calls}=await run({timeoutMs:30,monotonic:()=>0,transport:(u,o,n)=>n===1?json({value:token(claims)}):new Response(new ReadableStream({start(){}}))});
 assert.equal(result.status,'failed');assert.equal(result.reason,'request-timeout');assert.equal(calls.length,2);
 assert.equal(result.observation,undefined);assert.equal(calls[1].options.signal.aborted,true);assert.ok(Date.now()-start<1500);
});
test('CLI source loader rejects dirty tracked/index bytes and ignores inherited Git selection',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
 const {loadCommissionInputs}=await load(),cwd=fs.mkdtempSync(path.join(os.tmpdir(),'vc-commission-source-'));
 const git=(...args)=>execFileSync('git',args,{cwd,stdio:'pipe'}).toString().trim();
 try{
  git('init');fs.mkdirSync(path.join(cwd,'content'));const file=path.join(cwd,'content/publication.json');fs.writeFileSync(file,JSON.stringify(manifest)+'\n');fs.writeFileSync(path.join(cwd,'tracked.txt'),'base');git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-m','fixture');
  const expected=git('rev-parse','HEAD');const badEnv={...process.env,GIT_DIR:'/does/not/exist',GIT_WORK_TREE:'/does/not/exist',GIT_INDEX_FILE:'/does/not/exist',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'core.bare',GIT_CONFIG_VALUE_0:'true'};
  assert.deepEqual(loadCommissionInputs({cwd,env:badEnv}),{manifest,checkoutSha:expected});
  fs.writeFileSync(path.join(cwd,'untracked.txt'),'receipt allowed');assert.equal(loadCommissionInputs({cwd}).checkoutSha,expected);
  fs.writeFileSync(path.join(cwd,'tracked.txt'),'dirty');assert.deepEqual(loadCommissionInputs({cwd}),{});git('add','tracked.txt');assert.deepEqual(loadCommissionInputs({cwd}),{});git('restore','--staged','tracked.txt');git('restore','tracked.txt');
  git('update-index','--assume-unchanged','content/publication.json');fs.writeFileSync(file,JSON.stringify({...manifest,digest:'f'.repeat(64)})+'\n');assert.deepEqual(loadCommissionInputs({cwd}),{});
 }finally{fs.rmSync(cwd,{recursive:true,force:true});}
});

// Functional tests use the unchanged production budget. Only deadline tests
// shorten it: Response initialization/CPU scheduling is not a protocol failure.
test('valid responses slower than the old 30ms fixture budget still satisfy production deadlines',async()=>{
 const {result,calls}=await run({transport:async(u,o,n)=>{await new Promise(resolve=>setTimeout(resolve,40));return n===1?json({value:token(claims)}):json(response);}});
 assert.equal(result.status,'signed-identity-observed',JSON.stringify(result));assert.equal(calls.length,2);
});
test('unchanged production per-request and total deadlines reject exact boundaries without retry',async()=>{
 for(const mode of ['request','total']){
  let elapsed=0;
  const {result,calls}=await run({monotonic:()=>elapsed,wallNow:()=>{if(mode==='total'&&elapsed===9000)elapsed=11000;return now;},transport:(u,o,n)=>{
   // In the total case, non-network work moves the second request start to
   // 11s: its 21s individual deadline must be capped at the 20s total budget.
   elapsed=mode==='request'?10000:n===1?9000:20000;
   return n===1?json({value:token(claims)}):json(response);
  }});
  assert.equal(result.reason,'request-timeout');assert.equal(calls.length,mode==='request'?1:2);
  assert.equal(calls.at(-1).options.signal.aborted,true);assert.equal(result.observation,undefined);
 }
});
