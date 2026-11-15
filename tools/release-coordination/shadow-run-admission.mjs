/* Inactive read-only acquisition. Never imported by active Worker/workflow. */
import {inspectPublisherRunIdentity} from './publisher-run-identity.mjs';
const REPO='LeiterConsulting/splunk-version-value-explorer',BASE='https://api.github.com/repos/'+REPO;
const positive=x=>typeof x==='string'&&/^[1-9][0-9]{0,19}$/.test(x);
const id=x=>Number.isSafeInteger(x)&&x>0?String(x):null;
const fail=reason=>{throw Error(reason)};
async function get(path,fetcher){
 let response;try{response=await fetcher(BASE+path,{method:'GET',redirect:'manual',headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(10000)})}catch{fail('evidence-transport-unavailable')}
 if(response.status!==200||response.redirected)fail('evidence-http-rejected');
 if(!response.body)fail('evidence-body-unavailable');
 const reader=response.body.getReader();let size=0,timer;const chunks=[];const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('evidence-read-timeout')),10000)});
 try{for(;;){const {done,value}=await Promise.race([reader.read(),timeout]);if(done)break;size+=value.byteLength;if(size>1048576)fail('evidence-byte-limit');chunks.push(value)}}finally{clearTimeout(timer);reader.cancel().catch(()=>{})}
 const bytes=new Uint8Array(size);let offset=0;for(const value of chunks){bytes.set(value,offset);offset+=value.length}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{fail('evidence-json-invalid')}
}
function checkRun(run,identity){
 const statuses=['queued','in_progress','completed','waiting','requested','pending'];
 const conclusions=['success','failure','neutral','cancelled','skipped','timed_out','action_required','stale','startup_failure'];
 if(!statuses.includes(run.status)||(run.status==='completed'?!conclusions.includes(run.conclusion):run.conclusion!==null))fail('run-state-invalid');
 if(id(run.id)!==identity.runId||id(run.run_attempt)!==identity.runAttempt||run.head_sha!==identity.commit||run.event!==identity.eventName||run.head_branch!=='main'||run.path!=='.github/workflows/publish-content.yml'||run.repository?.full_name!==REPO||id(run.repository?.id)!=='1366223729'||id(run.repository?.owner?.id)!=='152733483')fail('run-identity-mismatch');
}
// Transport overrides are trusted fixture/runtime dependencies, never caller JSON.
// No GitHub or Sites token is accepted/forwarded by this interface. OIDC is sent
// only to the local verifier; issuer and API requests never contain it.
export async function inspectShadowRun({token,publisherEvidenceArtifactId=null},{issuerFetcher=(...a)=>fetch(...a),apiFetcher=(...a)=>fetch(...a),now=Date.now()}={}){
 if(!Number.isSafeInteger(now)||now<0)fail('invalid-trusted-clock');
 if(publisherEvidenceArtifactId!==null&&!positive(publisherEvidenceArtifactId))fail('invalid-artifact-id');
 const identity=await inspectPublisherRunIdentity(token,{fetcher:issuerFetcher,now});
 const current=await get('/actions/runs/'+identity.runId,apiFetcher);
 const attempt=await get('/actions/runs/'+identity.runId+'/attempts/'+identity.runAttempt,apiFetcher);
 checkRun(current,identity);checkRun(attempt,identity);
 if(current.status!==attempt.status||current.conclusion!==attempt.conclusion)fail('run-state-changed-readback-required');
 let artifact=null;
 if(publisherEvidenceArtifactId!==null){
  const a=await get('/actions/artifacts/'+publisherEvidenceArtifactId,apiFetcher);
  if(id(a.id)!==publisherEvidenceArtifactId||a.expired!==false||id(a.workflow_run?.id)!==identity.runId||a.workflow_run?.head_sha!==identity.commit||id(a.workflow_run?.repository_id)!=='1366223729'||id(a.workflow_run?.head_repository_id)!=='1366223729'||a.workflow_run?.head_branch!=='main'||typeof a.digest!=='string'||!/^sha256:[a-f0-9]{64}$/.test(a.digest)||!Number.isSafeInteger(a.size_in_bytes)||a.size_in_bytes<1)fail('artifact-run-mismatch');
  artifact={id:publisherEvidenceArtifactId,digest:a.digest,size:a.size_in_bytes,runAssociationObserved:true,originalBytesVerified:false,uploadAttemptVerified:false};
 }
 return {mode:'read-only-shadow',identity,serviceRunIdentityObserved:true,status:attempt.status,conclusion:attempt.conclusion,completedSuccessfully:attempt.status==='completed'&&attempt.conclusion==='success',workflowSourceBytesVerified:false,artifact,artifactUploadAttemptVerified:false,admission:'held',productionActionAllowed:false};
}
