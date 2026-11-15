/* Local receipt/byte inspector. No network, publication, credentials or authority. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const repo='LeiterConsulting/splunk-version-value-explorer';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=x=>{throw Error(x);};
const sha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
function exact(ok,reason){if(!ok)fail(reason);}
function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
function receipt(value){const copy=JSON.parse(JSON.stringify(value));return {...copy,receiptSha256:hash(canonical(copy)),transportOrigin:'caller-retained-service-response',authenticatedByThisModule:false,claimedDelivered:false};}
function inspectCandidate({root,zipPath,run,artifact,expectedCommit,expectedTree}){
 exact(sha(expectedCommit)&&sha(expectedTree),'invalid-source-identity');
 // Environment overrides must never change the selected complete checkout.
 const gitEnv={...process.env};for(const k of Object.keys(gitEnv))if(k.startsWith('GIT_'))delete gitEnv[k];
 const read=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',env:gitEnv}).trim();
 exact(read('rev-parse','HEAD')===expectedCommit&&read('rev-parse','HEAD^{tree}')===expectedTree,'source-identity-mismatch');
 exact(read('status','--porcelain','--untracked-files=all')==='','dirty-source');
 exact(run?.repository?.full_name===repo&&run.head_sha===expectedCommit&&run.status==='completed'&&run.conclusion==='success'&&run.event==='push'&&run.head_branch==='main'&&run.path==='.github/workflows/validate.yml','run-mismatch');
 exact(Number.isSafeInteger(run.id)&&run.id>0&&run.run_attempt===1,'invalid-run-attempt');
 exact(artifact?.workflow_run?.id===run.id&&artifact.workflow_run.head_sha===expectedCommit&&artifact.expired===false&&artifact.name==='export-evidence-'+expectedCommit,'artifact-run-mismatch');
 const stat=fs.statSync(zipPath);exact(stat.isFile()&&stat.size>0&&stat.size<=1024*1024*1024&&stat.size===artifact.size_in_bytes,'archive-size-mismatch');
 const zipSha256=hash(fs.readFileSync(zipPath));exact(artifact.digest==='sha256:'+zipSha256,'archive-digest-mismatch');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'vc-receipt-'));
 try{
  // Extract the original ZIP, never an unrelated caller-provided directory.
  execFileSync('python3',['-c',`import zipfile,pathlib,sys,stat
z=zipfile.ZipFile(sys.argv[1]);root=pathlib.Path(sys.argv[2]);items=z.infolist()
assert 0<len(items)<=10000
assert sum(x.file_size for x in items)<=1024*1024*1024
seen=set()
for x in items:
 p=pathlib.PurePosixPath(x.filename)
 assert x.filename and not p.is_absolute() and '..' not in p.parts and '\\\\' not in x.filename
 assert str(p)==x.filename.rstrip('/') and str(p) not in seen
 assert not stat.S_ISLNK(x.external_attr>>16)
 seen.add(str(p))
for x in items:z.extract(x,root)
`,zipPath,temp],{timeout:60000,stdio:['ignore','pipe','pipe'],maxBuffer:4096});
  const verifier=path.resolve(__dirname,'../export-evidence.cjs');
  const evidence=JSON.parse(execFileSync(process.execPath,['-e',"console.log(JSON.stringify(require(process.argv[1]).verify(process.argv[2],process.argv[3]).receipt))",verifier,temp,root],{cwd:root,env:gitEnv,encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024}));
  exact(evidence.commit===expectedCommit&&evidence.tree===expectedTree&&String(evidence.runId)===String(run.id),'export-provenance-mismatch');
  exact(read('rev-parse','HEAD')===expectedCommit&&read('rev-parse','HEAD^{tree}')===expectedTree&&read('status','--porcelain','--untracked-files=all')==='','source-changed-during-inspection');
  return receipt({kind:'candidate-byte-inspection',commit:expectedCommit,tree:expectedTree,runId:run.id,observedRunAttempt:run.run_attempt,artifactAttempt:'unverified',artifactId:artifact.id,zipSha256,reportFingerprint:evidence.target.fingerprint,engineRevision:evidence.target.engineRevision,contentRevision:evidence.target.contentRevision,cases:evidence.cases.length,artifactFiles:evidence.artifacts.length});
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
function inspectDeployment({archivePath,version,deployment,environment,expected}){
 exact(expected&&sha(expected.sourceCommit)&&typeof expected.projectId==='string'&&typeof expected.versionId==='string','invalid-deployment-expectation');
 exact(version?.project_id===expected.projectId&&version.id===expected.versionId&&version.source?.commit_sha===expected.sourceCommit,'saved-source-mismatch');
 const stat=fs.statSync(archivePath),archiveSha256=hash(fs.readFileSync(archivePath));
 exact(stat.isFile()&&stat.size>0&&stat.size===version.archive_storage?.size_bytes&&version.archive_storage?.content_hash==='sha256:'+archiveSha256,'saved-archive-mismatch');
 exact(deployment?.project_id===expected.projectId&&deployment.version_id===version.id&&deployment.id===version.deployment_id&&deployment.status==='succeeded'&&deployment.failure_message===null,'deployment-mismatch');
 exact(environment?.project_id===expected.projectId&&environment.revision===expected.environmentRevision&&deployment.env_set_revision===environment.revision,'environment-mismatch');
 const controls={};for(const key of ['VC_ACTIVE_DELIVERY','VC_PUBLISHER_ACTIVATION','VC_PUBLISHER_OIDC']){const values=environment.entries.filter(e=>e.key===key);exact(values.length===1&&values[0].value===expected.controls[key],'control-mismatch');controls[key]=values[0].value;}
 return receipt({kind:'deployment-byte-inspection',projectId:expected.projectId,versionId:version.id,versionNumber:version.version_number,sourceCommit:version.source.commit_sha,archiveSha256,archiveBytes:stat.size,deploymentId:deployment.id,environmentRevision:environment.revision,controls});
}
module.exports={inspectCandidate,inspectDeployment,hash,canonical};
