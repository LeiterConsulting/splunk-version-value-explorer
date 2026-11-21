/* INACTIVE preparation only. CLI remains held; no workflow references this module.
 * runPreparedAdvance requires an explicitly injected transport for isolated tests.
 * No default fetch, credentials from disk, automatic bootstrap/rollback or retry. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {advance,operationId} from './lib/publication-orchestration.mjs';
import {validateBundle} from '../worker/publication-core.mjs';
import selector from './select-publication.cjs';
const origin='https://versioncompass.com',repository='LeiterConsulting/splunk-version-value-explorer';
const ref='refs/heads/main',workflow=repository+'/.github/workflows/publish-content.yml@'+ref;
const sha=/^[a-f0-9]{40}$(?![\s\S])/;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const allowedErrors=new Set(['context-rejected','checkout-rejected','issuer-rejected','credential-unavailable','credential-context-rejected','request-timeout','response-too-large','invalid-json','redirect-rejected','transport-unavailable','runtime-engine-mismatch','http-rejected','response-invalid']);
const fail=s=>{throw Object.assign(Error(s),{safeReason:s})};
export function loadAdvanceInputs({env=process.env,run=args=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','ignore'],maxBuffer:16*1024*1024}),readFile=path=>fs.readFileSync(path,'utf8')}={}){
 if(env.GITHUB_ACTIONS!=='true'||!sha.test(env.GITHUB_SHA||''))fail('context-rejected');
 if(run(['status','--porcelain','--untracked-files=all']).trim()||run(['rev-parse','HEAD']).trim()!==env.GITHUB_SHA)fail('checkout-rejected');
 const event=JSON.parse(readFile(env.GITHUB_EVENT_PATH));
 return {env,event,checkoutSha:env.GITHUB_SHA,candidate:{repository,commit:env.GITHUB_SHA,bundle:JSON.parse(run(['show',env.GITHUB_SHA+':dist/content-bundle.json']))}};
}
function validateCredential(token, expected, now) {
  if (typeof token !== 'string' || token.length > 16000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) fail('credential-unavailable');
  let c;
  try { c = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')); } catch { fail('credential-context-rejected'); }
  const seconds = Math.floor(now / 1000);
  if (!object(c) || c.iss !== 'https://token.actions.githubusercontent.com' || c.aud !== origin || c.repository !== repository ||
      c.repository_id !== '1366223729' || c.repository_owner_id !== '152733483' || c.repository_visibility !== 'public' ||
      c.ref !== ref || c.ref_type !== 'branch' || c.workflow_ref !== workflow || c.sha !== expected.commit ||
      c.runner_environment !== 'github-hosted' || c.event_name !== expected.eventName ||
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


export async function runPreparedAdvance({env,event,checkoutSha,candidate,fetcher,now=Date.now,monotonic=()=>performance.now(),timeoutMs=10000}={}){
 const start=monotonic();let requests=0,mutationAttempted=false,action='preflight',commit,op,reportedGeneration,stageProgress;
 const base={mode:'inactive-advance-preparation',claimedDelivered:false,qualification:'Prepared caller result only; production holds remain. Independent full public bundle/history readback required; not activation authority.'};
 const outcome=(status,reason)=>({...base,status,commit,operationId:op,action,requests,mutationAttempted,mutationOutcome:mutationAttempted?'uncertain-read-back-before-retry':'not-attempted',...(reason?{reason}:{}),recordedAt:new Date(now()).toISOString()});
 try{
  const e=structuredClone(env),ev=structuredClone(event),c=structuredClone(candidate);
  if(typeof fetcher!=='function'||e?.GITHUB_ACTIONS!=='true'||!['workflow_run','workflow_dispatch'].includes(e.GITHUB_EVENT_NAME)||e.GITHUB_REPOSITORY!==repository||e.GITHUB_REF!==ref||e.GITHUB_REF_TYPE!=='branch'||e.GITHUB_WORKFLOW_SHA!==e.GITHUB_SHA||e.GITHUB_WORKFLOW_REF!==workflow||e.RUNNER_ENVIRONMENT!=='github-hosted'||!sha.test(e.GITHUB_SHA||'')||checkoutSha!==e.GITHUB_SHA||c?.commit!==e.GITHUB_SHA||c.repository!==repository||Object.keys(c).sort().join(',')!=='bundle,commit,repository')fail('context-rejected');
  if(e.GITHUB_EVENT_NAME==='workflow_run')return outcome('held-automatic-trigger');
  if(e.GITHUB_EVENT_NAME==='workflow_dispatch'&&ev?.inputs?.mode!=='publish')fail('context-rejected');
  commit=e.GITHUB_SHA;
  const selected=selector.select(e.GITHUB_EVENT_NAME,ev,commit);
  if(!selected.publish)return outcome('superseded-trigger-not-published');
  const m=(await validateBundle(c.bundle,c.bundle?.manifest?.engineRevision)).manifest;
  op=operationId(commit,'publish');
  timeoutMs=Number.isFinite(timeoutMs)&&timeoutMs>0&&timeoutMs<=10000?timeoutMs:10000;
  const request=(url,headers,maxBytes,body)=>requestJSON(url,headers,maxBytes,fetcher,timeoutMs,monotonic,start+60000,()=>{requests++;if(body!==undefined)mutationAttempted=true},body);
  action='static-runtime-engine';
  const staticResult=await request(origin+'/content-manifest.json',{},32768);
  if(staticResult.status!==200||!object(staticResult.data)||staticResult.data.engineRevision!==m.engineRevision)fail('runtime-engine-mismatch');
  if(!/^[A-Za-z0-9._~+\/-]{20,8190}={0,2}$/.test(e.VC_GITHUB_EVIDENCE_TOKEN||''))fail('credential-unavailable');
  let url;try{url=new URL(e.ACTIONS_ID_TOKEN_REQUEST_URL)}catch{fail('issuer-rejected')}
  if(url.protocol!=='https:'||!url.hostname.endsWith('.actions.githubusercontent.com')||url.port||url.username||url.password||url.hash||!/^[A-Za-z0-9._~+\/-]{20,16000}={0,2}$/.test(e.ACTIONS_ID_TOKEN_REQUEST_TOKEN||''))fail('issuer-rejected');
  url.searchParams.set('audience',origin);action='credential-acquisition';
  const credential=await request(url,{Authorization:'Bearer '+e.ACTIONS_ID_TOKEN_REQUEST_TOKEN},32768);
  if(credential.status!==200)fail('credential-unavailable');
  const token=validateCredential(credential.data?.value,{commit,eventName:e.GITHUB_EVENT_NAME},now());
  const call=async(route,value)=>{
   if(!['head','stage','activate'].includes(route))fail('context-rejected');
   action=route==='stage'?'stage-batch':route;
   const body=value===undefined?undefined:JSON.stringify({publication:route==='stage'?{candidate:value}:value,evidenceCredential:e.VC_GITHUB_EVIDENCE_TOKEN});
   if(body&&Buffer.byteLength(body)>8*1024*1024)fail('context-rejected');
   const response=await request(origin+'/api/publisher/'+(route==='stage'?'stage-batch':route),{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},16384,body);
   if(response.status!==200)fail('http-rejected');
   const d=response.data;
   if(route==='stage'){
    if(!object(d)||Object.keys(d).sort().join(',')!=='attemptedRows,engineRevision,integrity,missing,present,provenance,revision,status'||
      !['partial','complete','already-complete'].includes(d.status)||d.revision!==m.revision||d.engineRevision!==m.engineRevision||
      !Number.isSafeInteger(d.present)||d.present<0||!Number.isSafeInteger(d.missing)||d.missing<0||d.present+d.missing!==m.recordCount||
      !Number.isSafeInteger(d.attemptedRows)||d.attemptedRows<0||d.attemptedRows>50||d.attemptedRows>d.present||
      (d.status==='partial'?(d.missing===0||d.integrity!=='present-rows-exact'):(d.missing!==0||d.integrity!=='all-rows-exact'))||
      d.status==='already-complete'&&d.attemptedRows!==0||
      (d.status==='partial'?d.provenance!==null:(!object(d.provenance)||Object.keys(d.provenance).sort().join(',')!=='commit,repository,workflowRun'||d.provenance.repository!==repository||d.provenance.commit!==commit||!Number.isSafeInteger(d.provenance.workflowRun)||d.provenance.workflowRun<1)))fail('response-invalid');
    stageProgress=d;
    // Stop the existing orchestrator before CAS. This validated partial receipt
    // is returned as progress below, never a failed or completed publication.
    if(d.status==='partial')fail('response-invalid');
    return {status:'staged',revision:m.revision,engineRevision:m.engineRevision};
   }
   if(route==='activate'){
    if(!object(d)||Object.keys(d).sort().join(',')!=='applied,current,status')fail('response-invalid');
    reportedGeneration=d.current?.generation;
   }
   if(route==='head'&&reportedGeneration===undefined&&d?.revision===m.revision)reportedGeneration=d.generation;
   return d;
  };
  const result=await advance({candidate:c,expectedCommit:commit,deployedEngine:m.engineRevision,call});
  if(stageProgress?.status==='partial')return {...outcome('stage-partial'),progress:stageProgress,completedActions:['head','stage-batch'],mutationOutcome:'reported-bounded-progress-read-back-required'};
  if(!['activation-reported','already-current'].includes(result.status))return {...outcome('failed',result.reason||'operation-failed'),completedActions:result.completedActions,mutationOutcome:mutationAttempted?'uncertain-read-back-before-retry':'not-attempted'};
  action='head-readback';
  const head=await call('head');
  if(!object(head)||Object.keys(head).sort().join(',')!=='activeDelivery,engineRevision,generation,revision'||head.activeDelivery!==true||head.engineRevision!==m.engineRevision||head.revision!==m.revision||!Number.isSafeInteger(head.generation)||head.generation<1||head.generation!==reportedGeneration)fail('response-invalid');
  return {...outcome(result.status),completedActions:result.completedActions,revision:m.revision,engineRevision:m.engineRevision,generation:head.generation,mutationOutcome:mutationAttempted?'reported-activation-head-matches-independent-readback-required':'not-attempted'};
 }catch(error){return outcome('failed',allowedErrors.has(error?.safeReason)?error.safeReason:'context-rejected');}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 console.log(JSON.stringify({status:'held-publication-disabled',requests:0,credentialAcquired:false,mutationAttempted:false,claimedDelivered:false,qualification:'Inactive preparation. No input, environment variable or argument enables this CLI.'}));process.exitCode=1;
}
