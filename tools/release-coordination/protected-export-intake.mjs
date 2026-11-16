/* INACTIVE protected evidence intake. No Worker/workflow import or D1 capability.
 * Trusts GitHub + the complete reviewed source-pinned runner graph, not caller JSON.
 */
import {inspectPublisherRunIdentity} from './publisher-run-identity.mjs';
import {readBounded,strictJSON,sha256,decodeQualificationZip} from './qualification-artifact.mjs';
const REPO='LeiterConsulting/splunk-version-value-explorer',BASE='https://api.github.com/repos/'+REPO,WORKFLOW='.github/workflows/publish-content.yml';
const MISSING=['semantic-review','runtime-and-head','rollback','policy-and-stop','server-owned-admission'];
const need=(v,r)=>{if(!v)throw Error(r)};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const hex=(v,n)=>typeof v==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(v);
const decimal=v=>typeof v==='string'&&/^[1-9][0-9]{0,19}$/.test(v);
const id=v=>Number.isSafeInteger(v)&&v>0?String(v):null;
const keys=(v,ks)=>need(v&&typeof v==='object'&&!Array.isArray(v)&&same(Object.keys(v).sort(),[...ks].sort()),'schema');
function reviewedPolicy(input){
 keys(input,['sourceCommit','sourceTree','workflowSha256','qualificationJob','uploadStep']);
 need(hex(input.sourceCommit,40)&&hex(input.sourceTree,40)&&hex(input.workflowSha256,64),'policy-pin');
 for(const k of ['qualificationJob','uploadStep'])need(typeof input[k]==='string'&&input[k].length>0&&input[k].length<=100&&!/[\r\n]/.test(input[k]),'policy-job');
 return Object.freeze({...input});
}
function validateEvidence(e,identity,policy){
 keys(e,['schemaVersion','kind','producer','validation','signature','exports','admission','productionActionAllowed','missingAuthorities']);
 need(e.schemaVersion===1&&e.kind==='original-export-qualification'&&e.admission==='held'&&e.productionActionAllowed===false&&same(e.missingAuthorities,MISSING),'qualification-type');
 keys(e.producer,['workflow','commit','runId','runAttempt']);need(Object.entries({workflow:WORKFLOW,commit:identity.commit,runId:identity.runId,runAttempt:'1'}).every(([k,v])=>e.producer[k]===v),'producer-binding');
 const v=e.validation;
 keys(v,['schemaVersion','policy','repository','repositoryId','ownerId','event','ref','workflow','workflowSha','commit','tree','runId','runAttempt','validationJobId','artifactId','zipSha256','zipBytes','payloadManifestSha256','fileCount','expandedBytes']);
 const fixed={schemaVersion:1,policy:'export-upload-v1',repository:REPO,repositoryId:'1366223729',ownerId:'152733483',event:'push',ref:'refs/heads/main',workflow:'.github/workflows/validate.yml',workflowSha:identity.commit,commit:identity.commit,tree:policy.sourceTree,runAttempt:'1'};
 need(Object.entries(fixed).every(([k,x])=>v[k]===x),'validation-binding');
 for(const k of ['runId','validationJobId','artifactId'])need(decimal(v[k]),'validation-id');need(v.runId!==identity.runId,'distinct-validation-run');
 for(const k of ['zipSha256','payloadManifestSha256'])need(hex(v[k],64),'validation-digest');
 for(const [k,max] of [['zipBytes',2*1024**3],['expandedBytes',4*1024**3],['fileCount',20000]])need(Number.isSafeInteger(v[k])&&v[k]>0&&v[k]<=max,'validation-size');
 const s=e.signature;keys(s,['schemaVersion','status','signatureVerified','certificateRunAttemptBound','artifactUploadAttemptVerified','runId','runAttempt','artifactId','zipSha256','payloadManifestSha256','admission','productionActionAllowed','deliveryVerified']);
 need(s.schemaVersion===1&&s.status==='signature-and-exact-attempt-bound'&&s.signatureVerified===true&&s.certificateRunAttemptBound===true&&s.artifactUploadAttemptVerified===true&&s.admission==='held'&&s.productionActionAllowed===false&&s.deliveryVerified===false,'runner-signature-result');
 for(const k of ['runId','runAttempt','artifactId','zipSha256','payloadManifestSha256'])need(s[k]===v[k],'runner-signature-binding');
 const x=e.exports;keys(x,['commit','tree','runId','cases','checks']);need(x.commit===identity.commit&&x.tree===policy.sourceTree&&x.runId===v.runId&&Number.isSafeInteger(x.cases)&&x.cases>0&&x.cases<=5000,'export-binding');
 keys(x.checks,['html-reopen','pdf-rendering','themes-and-narrow-screens']);need(Object.values(x.checks).every(v=>v==='passed'),'export-outcome');
 return e;
}
function checkRun(r,identity){
 need(id(r.id)===identity.runId&&r.run_attempt===1&&r.head_sha===identity.commit&&r.head_branch==='main'&&r.event===identity.eventName&&r.path===WORKFLOW,'run-binding');
 need(r.repository?.full_name===REPO&&r.repository?.id===1366223729&&r.repository?.owner?.id===152733483,'repository-binding');
 // Request job is still executing. A completed/failed/restarted workflow is not current authority.
 need(r.status==='in_progress'&&r.conclusion===null,'run-not-active');
}
function artifactFrom(page,identity){
 need(Array.isArray(page.artifacts)&&Number.isSafeInteger(page.total_count)&&page.total_count===page.artifacts.length&&page.total_count<=30,'artifact-pagination');
 const rows=page.artifacts.filter(a=>a.name==='qualification-'+identity.runId+'-1');need(rows.length===1,'artifact-ambiguous');const a=rows[0],w=a.workflow_run;
 need(id(a.id)&&a.expired===false&&typeof a.digest==='string'&&/^sha256:[a-f0-9]{64}$/.test(a.digest)&&Number.isSafeInteger(a.size_in_bytes)&&a.size_in_bytes>0&&a.size_in_bytes<=262144,'artifact-metadata');
 need(w&&id(w.id)===identity.runId&&w.head_sha===identity.commit&&w.head_branch==='main'&&w.repository_id===1366223729&&w.head_repository_id===1366223729,'artifact-run');return a;
}
function jobFrom(page,identity,policy){
 need(Array.isArray(page.jobs)&&Number.isSafeInteger(page.total_count)&&page.total_count===page.jobs.length&&page.total_count<=30,'job-pagination');
 const rows=page.jobs.filter(j=>j.name===policy.qualificationJob);need(rows.length===1,'job-ambiguous');const j=rows[0];
 need(id(j.id)&&id(j.run_id)===identity.runId&&j.run_attempt===1&&j.head_sha===identity.commit&&j.status==='completed'&&j.conclusion==='success','qualification-job');
 const steps=Array.isArray(j.steps)&&j.steps.filter(s=>s.name===policy.uploadStep);need(steps&&steps.length===1&&steps[0].status==='completed'&&steps[0].conclusion==='success','qualification-upload');return j;
}
function storage(url){
 let u;try{u=new URL(url)}catch{return false}
 return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&['.blob.core.windows.net','.actions.githubusercontent.com','.githubusercontent.com'].some(s=>u.hostname.endsWith(s));
}
// Dependencies are server-owned configuration, NEVER request JSON or uploaded receipts.
export function createProtectedExportIntake({policy:input,githubToken,fetcher=(...a)=>fetch(...a),clock=()=>Date.now()}){
 const policy=reviewedPolicy(input);
 need(typeof githubToken==='string'&&githubToken.length>0&&githubToken.length<=4096&&!/[\r\n]/.test(githubToken),'server-actions-read-credential-unavailable');
 async function acquire(token){
  const startedAt=clock();need(Number.isSafeInteger(startedAt)&&startedAt>=0,'trusted-clock');
  const signal=AbortSignal.timeout(60000);let calls=0;
  const deadline=new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('deadline')),{once:true}));
  const transport=async(url,options={})=>{need(++calls<=32&&!signal.aborted,'acquisition-budget');const r=await Promise.race([fetcher(url,{...options,redirect:'manual',signal}),deadline]);need(!r.redirected,'redirect-followed');return r};
  const issuerFetcher=async(url)=>{need(url==='https://token.actions.githubusercontent.com/.well-known/jwks','issuer-origin');const r=await transport(url);need(r.status===200,'issuer-http');const b=await readBounded(r.body,128*1024,signal);strictJSON(b);return new Response(b,{status:200})};
  need(typeof token==='string'&&token.length<=16000&&token.split('.').length===3,'token-shape');
  const decodePart=part=>{need(/^[A-Za-z0-9_-]+$/.test(part),'token-encoding');return strictJSON(Uint8Array.from(atob(part.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)))};
  decodePart(token.split('.')[0]);const signedClaims=decodePart(token.split('.')[1]);
  const identity=await inspectPublisherRunIdentity(token,{fetcher:issuerFetcher,now:startedAt});
  need(identity.runAttempt==='1'&&identity.commit===policy.sourceCommit&&identity.workflowSha===policy.sourceCommit,'identity-pin');
  const apiResponse=path=>{need(path.startsWith('/')&&!path.includes('..')&&!path.includes('#'),'api-path');return transport(BASE+path,{method:'GET',headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+githubToken}})};
  const api=async path=>{const r=await apiResponse(path);need(r.status===200,'service-http');return strictJSON(await readBounded(r.body,1048576,signal))};
  async function snapshot(){
   const main=await api('/branches/main');need(main.commit?.sha===identity.commit,'main-drift');
   const run=await api('/actions/runs/'+identity.runId),attempt=await api('/actions/runs/'+identity.runId+'/attempts/1');checkRun(run,identity);checkRun(attempt,identity);
   const commit=await api('/git/commits/'+identity.commit);need(commit.sha===identity.commit&&commit.tree?.sha===policy.sourceTree,'tree-pin');
   const source=await api('/contents/'+WORKFLOW+'?ref='+identity.commit);need(source.type==='file'&&source.path===WORKFLOW&&source.encoding==='base64'&&Number.isSafeInteger(source.size)&&source.size>0&&source.size<=65536&&typeof source.content==='string'&&source.content.length<=90000,'workflow-source');
   const compact=source.content.replace(/\n/g,'');need(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact),'workflow-base64');const bytes=Uint8Array.from(atob(compact),c=>c.charCodeAt(0));need(bytes.length===source.size&&await sha256(bytes)===policy.workflowSha256,'workflow-pin');
   const job=jobFrom(await api('/actions/runs/'+identity.runId+'/attempts/1/jobs'),identity,policy);
   const artifact=artifactFrom(await api('/actions/runs/'+identity.runId+'/artifacts'),identity);
   // Do not compare mutable run duration/log URLs or unrelated jobs; compare all authority facts.
   return{commit:identity.commit,tree:commit.tree.sha,workflowSha256:policy.workflowSha256,runAttempt:1,jobId:String(job.id),artifactId:String(artifact.id),artifactDigest:artifact.digest,artifactBytes:artifact.size_in_bytes};
  }
  async function validationSnapshot(v){
   const run=await api('/actions/runs/'+v.runId),attempt=await api('/actions/runs/'+v.runId+'/attempts/1');
   for(const r of [run,attempt])need(id(r.id)===v.runId&&r.run_attempt===1&&r.head_sha===identity.commit&&r.head_branch==='main'&&r.event==='push'&&r.path==='.github/workflows/validate.yml'&&r.status==='completed'&&r.conclusion==='success'&&r.repository?.full_name===REPO&&r.repository?.id===1366223729&&r.repository?.owner?.id===152733483,'validation-service');
   const a=await api('/actions/artifacts/'+v.artifactId),w=a.workflow_run;
   need(id(a.id)===v.artifactId&&a.name==='export-evidence-'+identity.commit&&a.expired===false&&a.digest==='sha256:'+v.zipSha256&&a.size_in_bytes===v.zipBytes&&w&&id(w.id)===v.runId&&w.head_sha===identity.commit&&w.head_branch==='main'&&w.repository_id===1366223729&&w.head_repository_id===1366223729,'validation-artifact');
   return{runId:v.runId,runAttempt:1,artifactId:v.artifactId,digest:a.digest,bytes:a.size_in_bytes};
  }
  const before=await snapshot();
  const redirect=await apiResponse('/actions/artifacts/'+before.artifactId+'/zip');need(redirect.status===302,'archive-redirect');const location=redirect.headers.get('location');need(storage(location),'archive-storage');
  const downloaded=await transport(location,{method:'GET'});need(downloaded.status===200,'storage-http');const archive=await readBounded(downloaded.body,before.artifactBytes,signal);need(archive.length===before.artifactBytes&&'sha256:'+await sha256(archive)===before.artifactDigest,'archive-digest');
  const decoded=await decodeQualificationZip(archive,signal);const evidence=validateEvidence(decoded.value,identity,policy);
  const validationBefore=await validationSnapshot(evidence.validation);
  const after=await snapshot();need(same(before,after),'service-drift');
  const validationAfter=await validationSnapshot(evidence.validation);need(same(validationBefore,validationAfter),'validation-drift');
  const qualificationSha256=await sha256(decoded.bytes);
  const recheckAt=clock();need(Number.isSafeInteger(recheckAt)&&recheckAt>=startedAt&&recheckAt-startedAt<=60000&&!signal.aborted,'acquisition-deadline');
  const finalIdentity=await inspectPublisherRunIdentity(token,{fetcher:issuerFetcher,now:recheckAt});need(same(identity,finalIdentity),'identity-drift');
  // Final issuer body/signature work may cross expiration. Claims are already
  // signature-verified; check them AGAIN at return time, never at fetch start.
  const finishedAt=clock(),seconds=Math.floor(finishedAt/1000);
  need(Number.isSafeInteger(finishedAt)&&finishedAt>=recheckAt&&finishedAt-startedAt<=60000&&!signal.aborted,'acquisition-deadline');
  need(signedClaims.exp>seconds&&signedClaims.iat>=seconds-600&&signedClaims.nbf<=seconds+30,'identity-expired-at-return');
  return{schemaVersion:1,status:'protected-export-evidence-acquired',identity,service:after,validationService:validationAfter,observedAt:{startedAt,finishedAt},qualificationSha256,trust:'github-control-plane-and-reviewed-runner',runnerAssertion:evidence,originalArchive:archive,originalQualification:decoded.bytes,admission:'held',missingAuthorities:[...MISSING],productionActionAllowed:false,deliveryVerified:false};
 }
 async function handle(request){
  const response=(status,body)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  try{
   const url=new URL(request.url);if(url.pathname!=='/internal/qualification/intake'||url.search||url.hash)return response(404,{status:'not-found'});
   if(request.method!=='POST')return response(405,{status:'method-rejected'});
   if(request.headers.has('origin'))return response(403,{status:'browser-origin-rejected'});
   const body=await readBounded(request.body??new Blob([]).stream(),0,AbortSignal.timeout(1000));need(body.length===0,'empty-body-required');
   const auth=request.headers.get('authorization');need(typeof auth==='string'&&/^Bearer [A-Za-z0-9_.-]+$/.test(auth),'authentication-required');
   const r=await acquire(auth.slice(7));
   return response(409,{status:r.status,runId:r.identity.runId,qualificationSha256:r.qualificationSha256,admission:'held',missingAuthorities:r.missingAuthorities,productionActionAllowed:false});
  }catch{return response(409,{status:'protected-intake-held',admission:'held',productionActionAllowed:false})}
 }
 return Object.freeze({acquire,handle});
}
