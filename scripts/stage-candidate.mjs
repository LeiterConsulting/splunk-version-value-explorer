/* Explicit manual stage-only caller. Writes at most 50 missing exact candidate rows; provenance only after full integrity, never publication head/history.
 * Workflow draft requires separate review and production dispatch approval. */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { validateContext } from './observe-seed.mjs';
import { validateBundle } from '../worker/publication-core.mjs';
const origin='https://versioncompass.com', repository='LeiterConsulting/splunk-version-value-explorer';
const ref='refs/heads/main', workflow=repository+'/.github/workflows/publish-content.yml@'+ref;
const sha=/^[a-f0-9]{40}$(?![\s\S])/;
const allowedErrors=new Set(['context-rejected','checkout-rejected','seed-mismatch','issuer-rejected','credential-unavailable','credential-context-rejected','request-timeout','response-too-large','invalid-json','redirect-rejected','transport-unavailable','stage-http-rejected','stage-response-invalid']);
const fail=s=>{throw Object.assign(Error(s),{safeReason:s})};
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
function validateCredential(token, expected, now) {
  if (typeof token !== 'string' || token.length > 16000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) fail('credential-unavailable');
  let c;
  try { c = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')); } catch { fail('credential-context-rejected'); }
  const seconds = Math.floor(now / 1000);
  if (!object(c) || c.iss !== 'https://token.actions.githubusercontent.com' || c.aud !== origin || c.repository !== repository ||
      c.repository_id !== '1366223729' || c.repository_owner_id !== '152733483' || c.repository_visibility !== 'public' ||
      c.ref !== ref || c.ref_type !== 'branch' || c.workflow_ref !== workflow || c.sha !== expected.commit ||
      c.runner_environment !== 'github-hosted' || c.event_name !== 'workflow_dispatch' ||
      !['repo:' + repository + ':ref:' + ref, 'repo:LeiterConsulting@152733483/splunk-version-value-explorer@1366223729:ref:' + ref].includes(c.sub) ||
      !Number.isSafeInteger(c.exp) || !Number.isSafeInteger(c.nbf) || !Number.isSafeInteger(c.iat) || c.exp <= seconds || c.nbf > seconds + 30 ||
      c.iat > seconds + 30 || c.iat < seconds - 600 || c.exp - c.iat > 600) fail('credential-context-rejected');
  return token;
}


async function requestJSON(url, headers, maxBytes, fetcher, timeoutMs, monotonic, totalDeadline, onRequest, body) {
  const deadlineAt = Math.min(monotonic() + timeoutMs, totalDeadline);
  const controller = new AbortController();
  let reader, timer;
  const checkDeadline = () => { if (controller.signal.aborted || monotonic() >= deadlineAt) fail('request-timeout'); };
  checkDeadline();
  const operation = (async () => {
    checkDeadline(); onRequest();
    const response = await fetcher(url, { method: body === undefined ? 'GET' : 'POST', body, headers, redirect: 'manual', signal: controller.signal });
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


export function loadStageInputs({env=process.env,run=args=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','ignore'],maxBuffer:16*1024*1024})}={}){
 if(env.GITHUB_ACTIONS!=='true'||env.GITHUB_EVENT_NAME!=='workflow_dispatch'||env.VC_STAGE_MODE!=='stage-only'||!sha.test(env.GITHUB_SHA||'')) fail('context-rejected');
 if(run(['status','--porcelain','--untracked-files=all']).trim()||run(['rev-parse','HEAD']).trim()!==env.GITHUB_SHA) fail('checkout-rejected');
 const read=(commit,path)=>JSON.parse(run(['show',commit+':'+path]));
 const deployment=read(env.GITHUB_SHA,'docs/deployed-seed-observation.json');
 if(!sha.test(deployment?.sourceCommit||'')) fail('context-rejected');
 return {env,deployment,checkoutSha:env.GITHUB_SHA,sourceTree:run(['rev-parse',deployment.sourceCommit+'^{tree}']).trim(),
 manifest:read(deployment.sourceCommit,'content/publication.json'),
 deployedBundle:read(deployment.sourceCommit,'dist/content-bundle.json'),
 candidate:{repository,commit:env.GITHUB_SHA,bundle:read(env.GITHUB_SHA,'dist/content-bundle.json')}};
}
export async function stageCandidate({env=process.env,manifest,checkoutSha,deployment,sourceTree,candidate,deployedBundle,fetcher=(...a)=>fetch(...a),now=Date.now,monotonic=()=>performance.now(),timeoutMs=10000}={}){
 const start=monotonic();let expected,runIdentity,action='preflight',requests=0,mutationAttempted=false,httpStatus;
 const base={mode:'stage-only',claimedDelivered:false,qualification:'Bounded candidate staging response only; independent readback required. Completion may bind verified provenance, but never publication head, history, activation or active-reader change.'};
 const result=(status,reason)=>({...base,status,...(expected||{}),...(runIdentity||{}),action,requests,mutationAttempted,mutationOutcome:mutationAttempted?'uncertain-read-back-before-retry':'not-attempted',...(httpStatus?{httpStatus}:{}),...(reason?{reason}:{}),recordedAt:new Date(now()).toISOString()});
 try{
  const e=structuredClone(env), c=structuredClone(candidate), old=structuredClone(deployedBundle);
  if(e.VC_STAGE_MODE!=='stage-only'||!/^\d{1,20}$/.test(e.GITHUB_RUN_ID||'')||!/^\d{1,6}$/.test(e.GITHUB_RUN_ATTEMPT||'')||Number(e.GITHUB_RUN_ATTEMPT)<1)fail('context-rejected');
  runIdentity={runId:e.GITHUB_RUN_ID,runAttempt:Number(e.GITHUB_RUN_ATTEMPT)};
  // Reuse existing identity checks, but only after requiring explicit stage mode.
  const mapped={...e,VC_OBSERVATION_MODE:'head-only',VC_OBSERVATION_EXPECTED_COMMIT:e.VC_STAGE_EXPECTED_COMMIT,VC_OBSERVATION_EXPECTED_REF:e.VC_STAGE_EXPECTED_REF,VC_OBSERVATION_EXPECTED_SEED_COMMIT:e.VC_STAGE_EXPECTED_SEED_COMMIT,VC_OBSERVATION_EXPECTED_ENGINE:e.VC_STAGE_EXPECTED_ENGINE,VC_OBSERVATION_EXPECTED_REVISION:e.VC_STAGE_EXPECTED_REVISION};
  expected=validateContext(mapped,manifest,checkoutSha,deployment,sourceTree,'head-only');
  if(!isDeepStrictEqual(Object.keys(c||{}).sort(),['bundle','commit','repository'])||c.repository!==repository||c.commit!==expected.commit)fail('context-rejected');
  const b=await validateBundle(c.bundle,expected.engineRevision);
  if(!isDeepStrictEqual(old?.manifest,manifest))fail('seed-mismatch');
  await validateBundle(old,expected.engineRevision);
  if(!/^content-[a-f0-9]{24}$/.test(e.VC_STAGE_EXPECTED_CANDIDATE_REVISION||'')||b.manifest.revision!==e.VC_STAGE_EXPECTED_CANDIDATE_REVISION)fail('context-rejected');
  expected={...expected,seedRevision:expected.revision,seedDigest:expected.digest,seedRecordCount:expected.recordCount,revision:b.manifest.revision,digest:b.manifest.digest,recordCount:b.manifest.recordCount};
  if(!/^[A-Za-z0-9._~+\/-]{20,8190}={0,2}$/.test(e.VC_GITHUB_EVIDENCE_TOKEN||''))fail('credential-unavailable');
  const body=JSON.stringify({publication:{candidate:c},evidenceCredential:e.VC_GITHUB_EVIDENCE_TOKEN});
  if(Buffer.byteLength(body)>8*1024*1024)fail('context-rejected');
  let url;try{url=new URL(e.ACTIONS_ID_TOKEN_REQUEST_URL)}catch{fail('issuer-rejected')}
  if(url.protocol!=='https:'||!url.hostname.endsWith('.actions.githubusercontent.com')||url.port||url.username||url.password||url.hash||!/^[A-Za-z0-9._~+\/-]{20,16000}={0,2}$/.test(e.ACTIONS_ID_TOKEN_REQUEST_TOKEN||''))fail('issuer-rejected');
  url.searchParams.set('audience',origin);timeoutMs=Number.isFinite(timeoutMs)&&timeoutMs>0&&timeoutMs<=10000?timeoutMs:10000;
  action='credential-acquisition';
  const credential=await requestJSON(url,{Authorization:'Bearer '+e.ACTIONS_ID_TOKEN_REQUEST_TOKEN},32768,fetcher,timeoutMs,monotonic,start+20000,()=>requests++);
  if(credential.status!==200)fail('credential-unavailable');
  const token=validateCredential(credential.data?.value,expected,now());
  action='stage';
  const response=await requestJSON(origin+'/api/publisher/stage-batch',{Authorization:'Bearer '+token,'Content-Type':'application/json'},16384,fetcher,timeoutMs,monotonic,start+20000,()=>{requests++;mutationAttempted=true},body);
  httpStatus=response.status;
  if(response.status!==200)fail('stage-http-rejected');
  const v=response.data;
  if(!object(v)||Object.keys(v).sort().join(',')!=='attemptedRows,engineRevision,integrity,missing,present,provenance,revision,status'||
    !['partial','complete','already-complete'].includes(v.status)||v.revision!==expected.revision||v.engineRevision!==expected.engineRevision||
    !Number.isSafeInteger(v.present)||v.present<0||!Number.isSafeInteger(v.missing)||v.missing<0||v.present+v.missing!==expected.recordCount||
    !Number.isSafeInteger(v.attemptedRows)||v.attemptedRows<0||v.attemptedRows>50||v.attemptedRows>v.present||
    (v.status==='partial'?(v.missing===0||v.integrity!=='present-rows-exact'):(v.missing!==0||v.integrity!=='all-rows-exact'))||
    v.status==='already-complete'&&v.attemptedRows!==0||
    (v.status==='partial'?v.provenance!==null:(!object(v.provenance)||Object.keys(v.provenance).sort().join(',')!=='commit,repository,workflowRun'||v.provenance.repository!==repository||v.provenance.commit!==expected.commit||!Number.isSafeInteger(v.provenance.workflowRun)||v.provenance.workflowRun<1)))fail('stage-response-invalid');
  return {...result('stage-reported'),mutationOutcome:'reported-bounded-progress-read-back-required',progress:v};
 }catch(error){return result('failed',allowedErrors.has(error?.safeReason)?error.safeReason:'context-rejected')}
}

import { pathToFileURL } from 'node:url';
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 let receipt;
 try { receipt=await stageCandidate(loadStageInputs()); }
 catch { receipt={mode:'stage-only',status:'failed',reason:'local-preflight-rejected',requests:0,mutationAttempted:false,mutationOutcome:'not-attempted',claimedDelivered:false,recordedAt:new Date().toISOString()}; }
 try { fs.writeFileSync('stage-candidate-outcome.json',JSON.stringify(receipt,null,2)+'\n'); }
 catch { console.error('Stage receipt retention failed.');process.exitCode=1; }
 console.log(JSON.stringify(receipt));
 if(receipt.status!=='stage-reported')process.exitCode=1;
}
