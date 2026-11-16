/* Manual, read-only identity commissioning. No publication imports or retries. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
const repository='LeiterConsulting/splunk-version-value-explorer';
const origin='https://versioncompass.com';
const endpoint=origin+'/api/publisher/commissioning-identity';
const ref='refs/heads/main';
const workflow=repository+'/.github/workflows/publish-content.yml@'+ref;
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const keys=(x,list)=>object(x)&&Object.keys(x).length===list.length&&list.every(k=>Object.hasOwn(x,k));
const match=(x,re)=>typeof x==='string'&&re.test(x);
const sha=x=>match(x,/^[a-f0-9]{40}$(?![\s\S])/);
const decimal=x=>match(x,/^[1-9][0-9]{0,19}$(?![\s\S])/);
const allowedErrors=new Set(['context-rejected','issuer-rejected','credential-unavailable','credential-context-rejected','request-timeout','transport-unavailable','redirect-rejected','response-too-large','invalid-json','observation-http-rejected','observation-schema-invalid','observation-identity-mismatch']);
const fail=reason=>{throw Object.assign(Error(reason),{safeReason:reason});};
export function validateContext(env,manifest,checkoutSha){
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_EVENT_NAME!=='workflow_dispatch'||env.VC_COMMISSION_MODE!=='commissioning-only'||env.GITHUB_REPOSITORY!==repository||env.GITHUB_REF!==ref||env.GITHUB_REF_TYPE!=='branch'||env.GITHUB_WORKFLOW_REF!==workflow||env.VC_COMMISSION_EXPECTED_REF!==ref||!sha(env.GITHUB_SHA)||env.VC_COMMISSION_EXPECTED_COMMIT!==env.GITHUB_SHA||env.GITHUB_WORKFLOW_SHA!==env.GITHUB_SHA||checkoutSha!==env.GITHUB_SHA||!decimal(env.GITHUB_RUN_ID)||!decimal(env.GITHUB_RUN_ATTEMPT))fail('context-rejected');
 if(!object(manifest)||manifest.schemaVersion!==1||!match(manifest.engineRevision,/^engine-[a-f0-9]{20}$(?![\s\S])/ )||!match(manifest.revision,/^content-[a-f0-9]{24}$(?![\s\S])/ )||!match(manifest.digest,/^[a-f0-9]{64}$(?![\s\S])/ )||manifest.engineRevision!==env.VC_COMMISSION_EXPECTED_ENGINE||manifest.revision!==env.VC_COMMISSION_EXPECTED_REVISION)fail('context-rejected');
 return {commit:env.GITHUB_SHA,workflowSha:env.GITHUB_WORKFLOW_SHA,runId:env.GITHUB_RUN_ID,runAttempt:env.GITHUB_RUN_ATTEMPT,engineRevision:manifest.engineRevision,contentRevision:manifest.revision,digest:manifest.digest};
}
function credential(token,e,now){
 if(!match(token,/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$(?![\s\S])/ )||token.length>16000)fail('credential-unavailable');
 let c;try{c=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));}catch{fail('credential-context-rejected');}
 const t=Math.floor(now/1000);
 if(!object(c)||c.iss!=='https://token.actions.githubusercontent.com'||c.aud!==origin||c.repository!==repository||c.repository_id!=='1366223729'||c.repository_owner_id!=='152733483'||c.repository_visibility!=='public'||c.ref!==ref||c.ref_type!=='branch'||c.workflow_ref!==workflow||c.sha!==e.commit||c.workflow_sha!==e.workflowSha||c.run_id!==e.runId||c.run_attempt!==e.runAttempt||c.runner_environment!=='github-hosted'||c.event_name!=='workflow_dispatch'||!['repo:'+repository+':ref:'+ref,'repo:LeiterConsulting@152733483/splunk-version-value-explorer@1366223729:ref:'+ref].includes(c.sub)||!Number.isSafeInteger(c.exp)||!Number.isSafeInteger(c.iat)||!Number.isSafeInteger(c.nbf)||c.exp<=t||c.nbf>t+30||c.iat>t+30||c.iat<t-600||c.exp-c.iat>600)fail('credential-context-rejected');
 // Local parsing is scope checking only. The fixed remote route verifies signature.
 return token;
}
export function validateObservation(v,e){
 if(!keys(v,['schemaVersion','status','identity','runtime','controls','claimsSignatureVerified','serviceRunVerified','artifactUploadAttemptVerified','admission','databaseAccessed','mutationAttempted','productionActionAllowed','deliveryVerified'])||v.schemaVersion!==1||v.status!=='signed-identity-observed'||v.claimsSignatureVerified!==true||v.admission!=='held'||['serviceRunVerified','artifactUploadAttemptVerified','databaseAccessed','mutationAttempted','productionActionAllowed','deliveryVerified'].some(k=>v[k]!==false)||!keys(v.identity,['repository','commit','eventName','runId','runAttempt','workflowSha'])||!keys(v.runtime,['engineRevision','contentRevision','digest'])||!keys(v.controls,['reader','publisher'])||v.controls.reader!==false||v.controls.publisher!==false)fail('observation-schema-invalid');
 if(v.identity.repository!==repository||v.identity.eventName!=='workflow_dispatch'||['commit','runId','runAttempt','workflowSha'].some(k=>v.identity[k]!==e[k])||['engineRevision','contentRevision','digest'].some(k=>v.runtime[k]!==e[k]))fail('observation-identity-mismatch');
 return JSON.parse(JSON.stringify(v));
}
// A single deadline spans headers and all body bytes, including non-cooperative
// test transports. Aborting/cancelling the client does not cancel server work.
async function requestJSON(url, headers, maxBytes, fetcher, timeoutMs, monotonic, totalDeadline, onRequest) {
  const deadlineAt = Math.min(monotonic() + timeoutMs, totalDeadline);
  const controller = new AbortController();
  let reader, timer;
  const checkDeadline = () => { if (controller.signal.aborted || monotonic() >= deadlineAt) fail('request-timeout'); };
  checkDeadline();
  const operation = (async () => {
    checkDeadline(); onRequest();
    const response = await fetcher(url, { method: 'GET', headers, redirect: 'manual', signal: controller.signal });
    if (controller.signal.aborted || monotonic() >= deadlineAt) { try { Promise.resolve(response.body?.cancel()).catch(() => {}); } catch {} fail('request-timeout'); }
    if (response.redirected || response.status >= 300 && response.status < 400 || response.url && response.url !== String(url)) fail('redirect-rejected');
    const declaredLength = response.headers.get('content-length');
    if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBytes)) fail('response-too-large');
    if (!response.body) fail('invalid-json');
    reader = response.body.getReader();
    const chunks = []; let size = 0;
    while (true) {
      checkDeadline();
      const { value, done } = await reader.read();
      checkDeadline();
      if (done) break;
      size += value.byteLength; if (size > maxBytes) fail('response-too-large');
      if (value.byteLength) chunks.push(value);
    }
    let data;
    try { data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))); } catch { fail('invalid-json'); }
    checkDeadline();
    return { status: response.status, data };
  })();
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Object.assign(Error('request-timeout'), { safeReason: 'request-timeout' })); }, Math.max(0, deadlineAt - monotonic())); });
  try { return await Promise.race([operation, deadline]); }
  catch (error) { if (allowedErrors.has(error?.safeReason)) throw error; fail('transport-unavailable'); }
  finally {
    clearTimeout(timer); controller.abort();
    // Do not wait for a stuck transport to acknowledge cancellation.
    try { if (reader) Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  }
}


export async function commissionPublisher({env=process.env,manifest,checkoutSha,fetcher=(...a)=>globalThis.fetch(...a),now=Date.now,monotonic=()=>performance.now(),timeoutMs=10000}={}){
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>10000)timeoutMs=10000;
 const start=monotonic();let expected,requests=0,action='context-validation';
 const base={mode:'commissioning-only',target:endpoint,mutationAttempted:false,databaseAccessed:false,productionActionAllowed:false,claimedDelivered:false,admission:'held',qualification:'Signed identity observation only; not service run, artifact attempt, admission, database integrity or delivery proof.'};
 try{
  expected=validateContext(env,manifest,checkoutSha);action='credential-acquisition';
  let url;try{url=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);}catch{fail('issuer-rejected');}
  if(url.protocol!=='https:'||!url.hostname.endsWith('.actions.githubusercontent.com')||url.port||url.username||url.password||url.hash||!match(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,/^[A-Za-z0-9._~+\/-]{20,16000}={0,2}$(?![\s\S])/))fail('issuer-rejected');
  url.searchParams.set('audience',origin);
  const minted=await requestJSON(url,{Authorization:'Bearer '+env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},32768,fetcher,timeoutMs,monotonic,start+20000,()=>requests++);
  if(minted.status!==200)fail('credential-unavailable');
  const token=credential(minted.data?.value,expected,now());action='commissioning-identity';
  const response=await requestJSON(endpoint,{Authorization:'Bearer '+token,Accept:'application/json'},16384,fetcher,timeoutMs,monotonic,start+20000,()=>requests++);
  if(response.status!==200)fail('observation-http-rejected');
  const observation=validateObservation(response.data,expected);
  return {...base,...expected,status:'signed-identity-observed',observation,requests,recordedAt:new Date(now()).toISOString()};
 }catch(error){return {...base,...(expected||{}),status:'failed',action,reason:allowedErrors.has(error?.safeReason)?error.safeReason:'context-rejected',requests,recordedAt:new Date(now()).toISOString()};}
}
export function writeCommissionReceipt(receipt,{output='publisher-commissioning-outcome.json',summary=process.env.GITHUB_STEP_SUMMARY}={}){
 fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
 if(summary)fs.appendFileSync(summary,'\nRead-only commissioning: **'+receipt.status+'**\n\nAdmission remains held; no database or publication action.\n');
}
export function loadCommissionInputs({cwd=process.cwd(),env=process.env}={}){
 // Do not let inherited index/worktree/config variables select a different source.
 const gitEnv=Object.fromEntries(Object.entries(env).filter(([key])=>!/^GIT_/i.test(key)));
 gitEnv.GIT_CONFIG_NOSYSTEM='1';gitEnv.GIT_CONFIG_GLOBAL='/dev/null';
 const git=args=>execFileSync('git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null',...args],{cwd,env:gitEnv,encoding:'utf8',stdio:['ignore','pipe','ignore'],maxBuffer:1048576,timeout:10000});
 try{
  if(fs.realpathSync(git(['rev-parse','--show-toplevel']).trim())!==fs.realpathSync(cwd))fail('context-rejected');
  const checkoutSha=git(['rev-parse','HEAD']).trim();if(!sha(checkoutSha))fail('context-rejected');
  git(['diff','--no-ext-diff','--quiet','--ignore-submodules=none','--']);
  git(['diff','--cached','--no-ext-diff','--quiet','--ignore-submodules=none','HEAD','--']);
  if(git(['status','--porcelain=v1','--untracked-files=no','--ignore-submodules=none']).trim())fail('context-rejected');
  // Read the manifest only after the source/index cleanliness check, and bind its
  // actual bytes too (including files hidden with assume-unchanged/skip-worktree).
  const file=path.join(cwd,'content/publication.json');
  if(!fs.lstatSync(file).isFile())fail('context-rejected');
  const bytes=fs.readFileSync(file,'utf8');
  if(bytes!==git(['show',checkoutSha+':content/publication.json']))fail('context-rejected');
  return {manifest:JSON.parse(bytes),checkoutSha};
 }catch{ return {}; }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {manifest,checkoutSha}=loadCommissionInputs();
 const receipt=await commissionPublisher({manifest,checkoutSha});writeCommissionReceipt(receipt);console.log(JSON.stringify(receipt));if(receipt.status==='failed')process.exitCode=1;
}
