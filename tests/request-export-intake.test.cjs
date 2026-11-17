const {test}=require('node:test'),assert=require('node:assert/strict');
const repo='LeiterConsulting/splunk-version-value-explorer',sha='a'.repeat(40),now=1800000000000;
const env={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:repo,GITHUB_REF:'refs/heads/main',GITHUB_REF_TYPE:'branch',GITHUB_WORKFLOW_REF:repo+'/.github/workflows/publish-content.yml@refs/heads/main',GITHUB_RUN_ATTEMPT:'1',GITHUB_SHA:sha,GITHUB_WORKFLOW_SHA:sha,GITHUB_RUN_ID:'123',VC_EXPORT_INTAKE_MODE:'request-export-intake-only',VC_EXPORT_INTAKE_EXPECTED_COMMIT:sha,VC_EXPORT_INTAKE_EXPECTED_REF:'refs/heads/main',ACTIONS_ID_TOKEN_REQUEST_URL:'https://test.actions.githubusercontent.com/token',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'issuer-credential'.repeat(3)};
const claims={iss:'https://token.actions.githubusercontent.com',aud:'https://versioncompass.com',repository:repo,repository_id:'1366223729',repository_owner_id:'152733483',repository_visibility:'public',ref:env.GITHUB_REF,ref_type:'branch',workflow_ref:env.GITHUB_WORKFLOW_REF,sha,workflow_sha:sha,run_id:'123',run_attempt:'1',runner_environment:'github-hosted',event_name:'workflow_dispatch',sub:'repo:'+repo+':ref:'+env.GITHUB_REF,iat:now/1000,nbf:now/1000,exp:now/1000+300};
const token=c=>'e30.'+Buffer.from(JSON.stringify(c)).toString('base64url')+'.c2ln';
const expected={status:'protected-export-evidence-acquired',runId:'123',qualificationSha256:'b'.repeat(64),admission:'held',missingAuthorities:['semantic-review','runtime-and-head','rollback','policy-and-stop','server-owned-admission'],productionActionAllowed:false};
const load=()=>import('../scripts/request-export-intake.mjs');
const json=(x,status=200)=>new Response(JSON.stringify(x),{status});
async function run({environment=env,c=claims,response=expected,transport,checkoutSha=sha,timeoutMs=1000,wallNow=()=>now,monotonic}={}){
 const {requestExportIntake}=await load(),calls=[];
 const result=await requestExportIntake({env:environment,checkoutSha,now:wallNow,timeoutMs,monotonic,fetcher:async(u,o)=>{calls.push({url:String(u),options:o});return transport?transport(u,o,calls.length):calls.length===1?json({value:token(c)}):json(response,409)}});
 return {result,calls};
}
test('inactive real sender sends only fresh OIDC in one empty fixed intake POST; result remains held',async()=>{
 const secretGuard=new Proxy(env,{get(t,k){assert.ok(!['GITHUB_TOKEN','GH_TOKEN','VC_GITHUB_ACTIONS_READ_TOKEN'].includes(k),'forbidden credential read');return t[k]},ownKeys(){throw Error('must not enumerate environment')}});
 const {result,calls}=await run({environment:secretGuard});assert.equal(result.status,'protected-export-evidence-acquired');assert.equal(calls.length,2);
 assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].options.headers.Authorization,'Bearer '+env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);assert.equal(new URL(calls[0].url).searchParams.get('audience'),'https://versioncompass.com');
 assert.equal(calls[1].url,'https://versioncompass.com/api/publisher/export-qualification');assert.equal(calls[1].options.method,'POST');assert.equal(calls[1].options.body,undefined);assert.equal(calls[1].options.redirect,'manual');assert.deepEqual(calls[1].options.headers,{Authorization:'Bearer '+token(claims),Accept:'application/json'});
 assert.equal(result.productionActionAllowed,false);assert.equal(result.deliveryVerified,false);assert.deepEqual(result.observation,expected);assert.ok(!JSON.stringify(result).includes(token(claims)));
});
test('exact manual main attempt1 source and explicit mode rejected before token acquisition',async()=>{
 for(const patch of [{GITHUB_EVENT_NAME:'workflow_run'},{GITHUB_RUN_ATTEMPT:'2'},{GITHUB_REF:'refs/heads/pr'},{GITHUB_WORKFLOW_SHA:'c'.repeat(40)},{VC_EXPORT_INTAKE_EXPECTED_COMMIT:'c'.repeat(40)},{VC_EXPORT_INTAKE_MODE:'publish'},{GITHUB_RUN_ID:'123\n'},{GITHUB_SHA:sha+'\n'}]){const {result,calls}=await run({environment:{...env,...patch}});assert.equal(result.status,'failed');assert.equal(result.reason,'context-rejected');assert.equal(calls.length,0)}
 const {calls}=await run({checkoutSha:'c'.repeat(40)});assert.equal(calls.length,0);
});
test('issuer endpoint and scoped token failures never contact target',async()=>{
 for(const url of ['http://test.actions.githubusercontent.com/token','https://evil.test/token','https://test.actions.githubusercontent.com.evil.test/token','https://user@test.actions.githubusercontent.com/token']){const r=await run({environment:{...env,ACTIONS_ID_TOKEN_REQUEST_URL:url}});assert.equal(r.result.reason,'issuer-rejected');assert.equal(r.calls.length,0)}
 for(const patch of [{run_attempt:'2'},{run_id:'124'},{aud:'https://evil.test'},{exp:now/1000},{workflow_sha:'c'.repeat(40)}]){const r=await run({c:{...claims,...patch}});assert.equal(r.result.reason,'credential-context-rejected');assert.equal(r.calls.length,1)}
});
test('strict acquired response rejects permissive status, extras, mismatch and reordered authority',async()=>{
 for(const patch of [{runId:'124'},{qualificationSha256:'b'.repeat(64)+'\n'},{admission:'admitted'},{productionActionAllowed:true},{secret:'private-secret'},{status:'protected-intake-held'},{missingAuthorities:[...expected.missingAuthorities].reverse()}]){const r=await run({response:{...expected,...patch}});assert.equal(r.result.reason,'intake-schema-rejected');assert.equal(r.result.observation,undefined);assert.ok(!JSON.stringify(r.result).includes('private-secret'))}
 for(const status of [200,401,500]){const r=await run({transport:(u,o,n)=>n===1?json({value:token(claims)}):json(expected,status)});assert.equal(r.result.reason,'intake-http-rejected')}
});
test('redirects, huge bodies, malformed UTF8 and transport errors sanitized without retry',async()=>{
 for(const reply of [()=>new Response(null,{status:302,headers:{Location:'https://evil.test'}}),()=>new Response('x'.repeat(4097)),()=>new Response(new Uint8Array([255])),()=>{throw Error('private-secret')}]){const r=await run({transport:(u,o,n)=>n===1?json({value:token(claims)}):reply()});assert.equal(r.result.status,'failed');assert.equal(r.calls.length,2);assert.equal(r.result.observation,undefined);assert.ok(!JSON.stringify(r.result).includes('private-secret'))}
});
test('hanging target fetch or body is aborted with bounded deadline, no retry',async()=>{
 for(const reply of [()=>new Promise(()=>{}),()=>new Response(new ReadableStream({start(){}}))]){const start=Date.now();const r=await run({timeoutMs:30,monotonic:()=>0,transport:(u,o,n)=>n===1?json({value:token(claims)}):reply()});assert.equal(r.result.reason,'request-timeout');assert.equal(r.calls.length,2);assert.equal(r.calls[1].options.signal.aborted,true);assert.ok(Date.now()-start<1500)}
});
test('token expiry during response holds result, never retroactive success',async()=>{let clock=now;const r=await run({wallNow:()=>clock,transport:(u,o,n)=>{if(n===1)return json({value:token(claims)});clock+=301000;return json(expected,409)}});assert.equal(r.result.reason,'credential-context-rejected');assert.equal(r.result.observation,undefined)});
test('source loader checks clean tracked bytes and exact sender/helper without reading unrelated secrets',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process'),{loadExportIntakeInputs}=await load(),cwd=fs.mkdtempSync(path.join(os.tmpdir(),'vc-intake-source-'));
 const git=(...args)=>execFileSync('git',args,{cwd,stdio:'pipe'}).toString().trim();
 try{
  git('init');fs.mkdirSync(path.join(cwd,'scripts'));fs.mkdirSync(path.join(cwd,'content'));
  fs.writeFileSync(path.join(cwd,'content/publication.json'),'{}\n');for(const name of ['request-export-intake.mjs','commission-publisher.mjs'])fs.copyFileSync(path.join('scripts',name),path.join(cwd,'scripts',name));
  git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-m','fixture');const expectedSha=git('rev-parse','HEAD');const guarded=new Proxy({PATH:process.env.PATH},{get(t,k){assert.equal(k,'PATH');return t[k]},ownKeys(){throw Error('enumeration')}});
  assert.deepEqual(loadExportIntakeInputs({cwd,env:guarded}),{checkoutSha:expectedSha});
  git('update-index','--assume-unchanged','scripts/request-export-intake.mjs');fs.appendFileSync(path.join(cwd,'scripts/request-export-intake.mjs'),'\n// hidden mutation');assert.deepEqual(loadExportIntakeInputs({cwd,env:guarded}),{});
 }finally{fs.rmSync(cwd,{recursive:true,force:true})}
});
