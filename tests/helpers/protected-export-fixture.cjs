const assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib');
const modulePromise=import('../../tools/release-coordination/protected-export-intake.mjs'),zipPromise=import('../../tools/release-coordination/qualification-artifact.mjs');
const REPO='LeiterConsulting/splunk-version-value-explorer',BASE='https://api.github.com/repos/'+REPO,WORKFLOW='.github/workflows/publish-content.yml',NOW=1794866400000,SHA='a'.repeat(40),TREE='b'.repeat(40),RUN='123',VALIDATION='456';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function zip(content,{method=8,descriptor=false,name='qualification.json'}={}){const b=Buffer.from(content),n=Buffer.from(name),packed=method===0?b:zlib.deflateRawSync(b),crc=crc32(b),flags=0x800+(descriptor?8:0),local=Buffer.alloc(30),central=Buffer.alloc(46),end=Buffer.alloc(22),desc=Buffer.alloc(descriptor?16:0);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(flags,6);local.writeUInt16LE(method,8);local.writeUInt16LE(n.length,26);if(!descriptor){local.writeUInt32LE(crc,14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(b.length,22)}else{desc.writeUInt32LE(0x08074b50);desc.writeUInt32LE(crc,4);desc.writeUInt32LE(packed.length,8);desc.writeUInt32LE(b.length,12)}central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(flags,8);central.writeUInt16LE(method,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(b.length,24);central.writeUInt16LE(n.length,28);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+n.length,12);end.writeUInt32LE(local.length+n.length+packed.length+desc.length,16);return Buffer.concat([local,n,packed,desc,central,n,end])}
function evidence(){const v={schemaVersion:1,policy:'export-upload-v1',repository:REPO,repositoryId:'1366223729',ownerId:'152733483',event:'push',ref:'refs/heads/main',workflow:'.github/workflows/validate.yml',workflowSha:SHA,commit:SHA,tree:TREE,runId:VALIDATION,runAttempt:'1',validationJobId:'789',artifactId:'987',zipSha256:'c'.repeat(64),zipBytes:457383763,payloadManifestSha256:'d'.repeat(64),fileCount:4631,expandedBytes:569475719};return{schemaVersion:1,kind:'original-export-qualification',producer:{workflow:WORKFLOW,commit:SHA,runId:RUN,runAttempt:'1'},validation:v,signature:{schemaVersion:1,status:'signature-and-exact-attempt-bound',signatureVerified:true,certificateRunAttemptBound:true,artifactUploadAttemptVerified:true,runId:VALIDATION,runAttempt:'1',artifactId:v.artifactId,zipSha256:v.zipSha256,payloadManifestSha256:v.payloadManifestSha256,admission:'held',productionActionAllowed:false,deliveryVerified:false},exports:{commit:SHA,tree:TREE,runId:VALIDATION,cases:226,checks:{'html-reopen':'passed','pdf-rendering':'passed','themes-and-narrow-screens':'passed'}},admission:'held',productionActionAllowed:false,missingAuthorities:['semantic-review','runtime-and-head','rollback','policy-and-stop','server-owned-admission']}}
let signing;
async function fixture({claims={},change=()=>{},mutateEvidence=()=>{},zipOptions={},clock=()=>NOW}={}){
 signing||=await crypto.webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const c={iss:'https://token.actions.githubusercontent.com',aud:'https://versioncompass.com',sub:'repo:'+REPO+':ref:refs/heads/main',repository:REPO,repository_id:'1366223729',repository_owner_id:'152733483',repository_visibility:'public',ref:'refs/heads/main',ref_type:'branch',workflow_ref:REPO+'/'+WORKFLOW+'@refs/heads/main',runner_environment:'github-hosted',event_name:'workflow_dispatch',sha:SHA,workflow_sha:SHA,run_id:RUN,run_attempt:'1',iat:NOW/1000,nbf:NOW/1000-1,exp:NOW/1000+300,...claims};
 const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url'),signed=b64({alg:'RS256',typ:'JWT',kid:'fixture'})+'.'+b64(c),sig=await crypto.webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',signing.privateKey,Buffer.from(signed)),token=signed+'.'+Buffer.from(sig).toString('base64url');
 const jwks={keys:[{...await crypto.webcrypto.subtle.exportKey('jwk',signing.publicKey),kid:'fixture',use:'sig',alg:'RS256'}]};
 const source=Buffer.from('reviewed fixture graph; not an actual approved workflow\n'),policy={sourceCommit:SHA,sourceTree:TREE,workflowSha256:hash(source),qualificationJob:'qualify-export',uploadStep:'Retain qualification'};
 const e=evidence();mutateEvidence(e);const bytes=zip(JSON.stringify(e),zipOptions);
 const repo={full_name:REPO,id:1366223729,owner:{id:152733483}},run={id:123,run_attempt:1,head_sha:SHA,head_branch:'main',event:'workflow_dispatch',path:WORKFLOW,status:'in_progress',conclusion:null,repository:repo};
 const valRun={...run,id:456,event:'push',path:'.github/workflows/validate.yml',status:'completed',conclusion:'success'};
 const association=id=>({id,head_sha:SHA,head_branch:'main',repository_id:1366223729,head_repository_id:1366223729});
 const art={id:100,name:'qualification-123-1',expired:false,digest:'sha256:'+hash(bytes),size_in_bytes:bytes.length,workflow_run:association(123)};
 const valArt={id:987,name:'export-evidence-'+SHA,expired:false,digest:'sha256:'+'c'.repeat(64),size_in_bytes:457383763,workflow_run:association(456)};
 const jobs={total_count:1,jobs:[{id:4567,run_id:123,run_attempt:1,head_sha:SHA,status:'completed',conclusion:'success',name:'qualify-export',steps:[{name:'Retain qualification',status:'completed',conclusion:'success'}]}]};
 const calls=[],counts={};
 const fetcher=async(url,opt)=>{calls.push({url,opt});counts[url]=(counts[url]||0)+1;assert.equal(opt.redirect,'manual');assert(opt.signal);assert(!JSON.stringify(opt).includes(token));let data;
  if(url==='https://token.actions.githubusercontent.com/.well-known/jwks'){assert(!opt.headers?.Authorization);const alt=change('jwks',jwks,counts[url]);return alt||Response.json(jwks)}
  if(url==='https://fixture.blob.core.windows.net/artifact?sig=temporary'){assert(!opt.headers?.Authorization);const alt=change('storage',bytes,counts[url]);return alt||new Response(bytes)}
  assert(url.startsWith(BASE+'/'));assert.equal(opt.headers.Authorization,'Bearer SERVER_ONLY');assert.equal(opt.method,'GET');const p=url.slice(BASE.length);
  if(p==='/actions/artifacts/100/zip'){const alt=change(p,null,counts[url]);return alt||new Response(null,{status:302,headers:{location:'https://fixture.blob.core.windows.net/artifact?sig=temporary'}})}
  if(p==='/branches/main')data={commit:{sha:SHA}};
  else if(p==='/actions/runs/123'||p==='/actions/runs/123/attempts/1')data=run;
  else if(p==='/actions/runs/456'||p==='/actions/runs/456/attempts/1')data=valRun;
  else if(p==='/git/commits/'+SHA)data={sha:SHA,tree:{sha:TREE}};
  else if(p==='/contents/'+WORKFLOW+'?ref='+SHA)data={type:'file',path:WORKFLOW,encoding:'base64',size:source.length,content:source.toString('base64')};
  else if(p==='/actions/runs/123/attempts/1/jobs')data=jobs;
  else if(p==='/actions/runs/123/artifacts')data={total_count:1,artifacts:[art]};
  else if(p==='/actions/artifacts/987')data=valArt;
  else throw Error('unexpected URL '+p);
  data=structuredClone(data);const alt=change(p,data,counts[url]);return alt instanceof Response?alt:Response.json(data);
 };
 const intake=(await modulePromise).createProtectedExportIntake({policy,githubToken:'SERVER_ONLY',fetcher,clock});return{intake,token,calls,bytes,e,policy,fetcher};
}
module.exports={fixture,zip,evidence,NOW,SHA,TREE,RUN,VALIDATION,hash,modulePromise,zipPromise,BASE,WORKFLOW,REPO};
