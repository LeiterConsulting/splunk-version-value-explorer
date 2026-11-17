/* INACTIVE sender: no workflow import. Fixed read-only intake; no publisher writes.
 * Synthetic tests are not fresh issuer/service evidence or release admission. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {credential,requestJSON,loadCommissionInputs} from './commission-publisher.mjs';
const repository='LeiterConsulting/splunk-version-value-explorer',origin='https://versioncompass.com';
export const endpoint=origin+'/api/publisher/export-qualification';
const workflow=repository+'/.github/workflows/publish-content.yml@refs/heads/main';
const missing=['semantic-review','runtime-and-head','rollback','policy-and-stop','server-owned-admission'];
const safe=new Set(['context-rejected','issuer-rejected','credential-unavailable','credential-context-rejected','request-timeout','transport-unavailable','redirect-rejected','response-too-large','invalid-json','intake-http-rejected','intake-schema-rejected']);
const fail=reason=>{throw Object.assign(Error(reason),{safeReason:reason})};
const match=(v,re)=>typeof v==='string'&&re.test(v),sha=v=>match(v,/^[a-f0-9]{40}$(?![\s\S])/),id=v=>match(v,/^[1-9][0-9]{0,19}$(?![\s\S])/);
export function validateIntakeContext(env,checkoutSha){
 const required={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:repository,GITHUB_REF:'refs/heads/main',GITHUB_REF_TYPE:'branch',GITHUB_RUN_ATTEMPT:'1',GITHUB_WORKFLOW_REF:workflow,VC_EXPORT_INTAKE_MODE:'request-export-intake-only',VC_EXPORT_INTAKE_EXPECTED_REF:'refs/heads/main'};
 if(!Object.entries(required).every(([k,v])=>env[k]===v)||!sha(env.GITHUB_SHA)||env.GITHUB_SHA!==checkoutSha||env.GITHUB_WORKFLOW_SHA!==checkoutSha||env.VC_EXPORT_INTAKE_EXPECTED_COMMIT!==checkoutSha||!id(env.GITHUB_RUN_ID))fail('context-rejected');
 return {commit:checkoutSha,workflowSha:checkoutSha,runId:env.GITHUB_RUN_ID,runAttempt:'1'};
}
export function validateIntakeResponse(v,e){
 const keys=['status','runId','qualificationSha256','admission','missingAuthorities','productionActionAllowed'];
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==keys.length||!keys.every(k=>Object.hasOwn(v,k))||v.status!=='protected-export-evidence-acquired'||v.runId!==e.runId||!match(v.qualificationSha256,/^[a-f0-9]{64}$(?![\s\S])/ )||v.admission!=='held'||v.productionActionAllowed!==false||JSON.stringify(v.missingAuthorities)!==JSON.stringify(missing))fail('intake-schema-rejected');
 return {status:v.status,runId:v.runId,qualificationSha256:v.qualificationSha256,admission:'held',missingAuthorities:[...missing],productionActionAllowed:false};
}
export async function requestExportIntake({env=process.env,checkoutSha,fetcher=(...a)=>globalThis.fetch(...a),now=Date.now,monotonic=()=>performance.now(),timeoutMs=65000}={}){
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>65000)timeoutMs=65000;
 const start=monotonic(),base={mode:'request-export-intake-only',target:endpoint,admission:'held',productionActionAllowed:false,deliveryVerified:false};let expected,requests=0,action='context-validation';
 try{
  expected=validateIntakeContext(env,checkoutSha);action='credential-acquisition';
  let url;try{url=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL)}catch{fail('issuer-rejected')}
  if(url.protocol!=='https:'||!url.hostname.endsWith('.actions.githubusercontent.com')||url.port||url.username||url.password||url.hash||!match(env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,/^[A-Za-z0-9._~+\/-]{20,16000}={0,2}$(?![\s\S])/))fail('issuer-rejected');
  url.searchParams.set('audience',origin);
  const minted=await requestJSON(url,{Authorization:'Bearer '+env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},32768,fetcher,Math.min(timeoutMs,10000),monotonic,start+75000,()=>requests++);
  if(minted.status!==200)fail('credential-unavailable');
  const token=credential(minted.data?.value,expected,now());action='protected-export-intake';
  const response=await requestJSON(endpoint,{Authorization:'Bearer '+token,Accept:'application/json'},4096,fetcher,timeoutMs,monotonic,start+75000,()=>requests++,'POST');
  if(response.status!==409)fail('intake-http-rejected');
  credential(token,expected,now());
  const observation=validateIntakeResponse(response.data,expected);
  return {...base,...expected,status:observation.status,observation,requests};
 }catch(error){return {...base,...(expected||{}),status:'failed',action,reason:safe.has(error?.safeReason)?error.safeReason:'context-rejected',requests};}
}
export function loadExportIntakeInputs({cwd=process.cwd(),env=process.env}={}){
 // Deliberately select PATH only: do not enumerate/read unrelated job or server secrets.
 const gitEnv={PATH:env.PATH||'/usr/bin:/bin',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'};
 const {checkoutSha}=loadCommissionInputs({cwd,env:gitEnv});if(!checkoutSha)return {};
 try{
  for(const name of ['request-export-intake.mjs','commission-publisher.mjs']){
   const file=path.join(cwd,'scripts',name);if(!fs.lstatSync(file).isFile())return {};
   const original=execFileSync('git',['-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null','show',checkoutSha+':scripts/'+name],{cwd,env:gitEnv,stdio:['ignore','pipe','ignore'],maxBuffer:1048576,timeout:10000});
   if(!original.equals(fs.readFileSync(file)))return {};
  }
  return {checkoutSha};
 }catch{return {}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const receipt=await requestExportIntake(loadExportIntakeInputs());
 // Exclusive creation prevents overwriting prior uncertain/failed evidence.
 fs.writeFileSync('export-intake-request-outcome.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(receipt));if(receipt.status==='failed')process.exitCode=1;
}
