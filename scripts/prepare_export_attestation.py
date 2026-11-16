"""Main-push signer preparation. Fixed read-only APIs; never executes artifact contents."""
import hashlib,json,os,pathlib,re,shutil,subprocess,time,resource,urllib.request,urllib.parse
from attestation_zip import inspect,MAX_ZIP
REPO='LeiterConsulting/splunk-version-value-explorer'
BASE='https://api.github.com/repos/'+REPO
WORKFLOW='.github/workflows/validate.yml'
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs): return None
def require(ok,reason):
 if not ok: raise ValueError(reason)
def identity(env):
 require(env.get('GITHUB_ACTIONS')=='true' and env.get('GITHUB_EVENT_NAME')=='push' and env.get('GITHUB_REPOSITORY')==REPO and env.get('GITHUB_REF')=='refs/heads/main' and env.get('GITHUB_RUN_ATTEMPT')=='1','context')
 sha=env.get('GITHUB_SHA','');run=env.get('GITHUB_RUN_ID','');aid=env.get('VC_ARTIFACT_ID','');digest=env.get('VC_ARTIFACT_DIGEST','')
 require(re.fullmatch('[a-f0-9]{40}',sha) and env.get('GITHUB_WORKFLOW_SHA')==sha and env.get('GITHUB_WORKFLOW_REF')==REPO+'/'+WORKFLOW+'@refs/heads/main','source')
 require(re.fullmatch('[1-9][0-9]{0,19}',run) and re.fullmatch('[1-9][0-9]{0,19}',aid) and re.fullmatch('[a-f0-9]{64}',digest),'artifact-output')
 return sha,run,aid,digest
def validate_run(r,sha,run):
 require(str(r.get('id'))==run and r.get('run_attempt')==1 and r.get('head_sha')==sha and r.get('head_branch')=='main' and r.get('event')=='push' and r.get('path')==WORKFLOW,'run-identity')
 repo=r.get('repository',{})
 require(repo.get('full_name')==REPO and repo.get('id')==1366223729 and repo.get('owner',{}).get('id')==152733483,'repository-identity')
 require(r.get('status')=='in_progress' and r.get('conclusion') is None,'run-state')
def validate_artifact(a,sha,run,aid,digest):
 wr=a.get('workflow_run',{})
 require(str(a.get('id'))==aid and a.get('expired') is False and a.get('name')=='export-evidence-'+sha and a.get('digest')=='sha256:'+digest and isinstance(a.get('size_in_bytes'),int) and 0<a['size_in_bytes']<=MAX_ZIP,'artifact-metadata')
 require(str(wr.get('id'))==run and wr.get('head_sha')==sha and wr.get('head_branch')=='main' and wr.get('repository_id')==1366223729 and wr.get('head_repository_id')==1366223729,'artifact-run')
def storage_url(url):
 u=urllib.parse.urlsplit(url);h=u.hostname or ''
 return u.scheme=='https' and not u.username and not u.password and u.port in (None,443) and not u.fragment and any(h.endswith(s) for s in ('.blob.core.windows.net','.actions.githubusercontent.com','.githubusercontent.com'))
class Acquisition:
 def __init__(self,token):self.token=token;self.deadline=time.monotonic()+540;self.opener=urllib.request.build_opener(NoRedirect)
 def check(self):require(time.monotonic()<self.deadline,'deadline')
 def open(self,url,auth=True):
  self.check();headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'VersionCompass-export-attestation'}
  if auth: headers['Authorization']='Bearer '+self.token
  return self.opener.open(urllib.request.Request(url,headers=headers),timeout=min(20,max(1,self.deadline-time.monotonic())))
 def api(self,path):
  require(path.startswith('/') and '?' not in path and '..' not in path,'api-path')
  with self.open(BASE+path) as r:
   require(r.status==200,'api-status');chunks=[];size=0
   while True:
    self.check();b=r.read(65536)
    if not b:break
    size+=len(b);require(size<=8*1024*1024,'api-limit');chunks.append(b)
  return json.loads(b''.join(chunks))
 def download(self,aid,destination,expected_size):
  try:
   with self.open(BASE+'/actions/artifacts/'+aid+'/zip') as r: raise ValueError('missing-storage-redirect')
  except urllib.error.HTTPError as e:
   require(e.code==302,'download-status');url=e.headers.get('Location','');e.close()
  require(storage_url(url),'storage-origin')
  h=hashlib.sha256();size=0
  with self.open(url,auth=False) as r,open(destination,'xb') as f:
   require(r.status==200,'storage-status')
   while True:
    self.check();b=r.read(1024*1024)
    if not b:break
    size+=len(b);require(size<=expected_size and size<=MAX_ZIP,'download-size');h.update(b);f.write(b)
  require(size==expected_size,'download-truncated');return h.hexdigest()
def main():
 resource.setrlimit(resource.RLIMIT_AS,(768*1024*1024,768*1024*1024));resource.setrlimit(resource.RLIMIT_CPU,(300,300))
 env=os.environ;sha,run,aid,digest=identity(env)
 # Do not import modules or execute any files from the downloaded ZIP.
 git_env={k:v for k,v in env.items() if not k.startswith('GIT_')};git_env.update(GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_GLOBAL='/dev/null')
 def git(*args):return subprocess.check_output(['git','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',*args],env=git_env,text=True,timeout=15).strip()
 require(git('rev-parse','HEAD')==sha and not git('status','--porcelain','--untracked-files=no'),'checkout')
 tree=git('rev-parse','HEAD^{tree}')
 a=Acquisition(env['GH_TOKEN']);current=a.api('/actions/runs/'+run);attempt=a.api('/actions/runs/'+run+'/attempts/1');validate_run(current,sha,run);validate_run(attempt,sha,run)
 require(a.api('/branches/main')['commit']['sha']==sha,'main-moved')
 jobs=a.api('/actions/runs/'+run+'/attempts/1/jobs');require(jobs.get('total_count',0)<=30,'job-pagination')
 validators=[j for j in jobs['jobs'] if j.get('name')=='validate'];require(len(validators)==1,'validator-job')
 job=validators[0];require(job.get('run_attempt')==1 and job.get('head_sha')==sha and job.get('status')=='completed' and job.get('conclusion')=='success','validator-result')
 uploads=[s for s in job['steps'] if s.get('name')=='Retain candidate export evidence'];require(len(uploads)==1 and uploads[0].get('conclusion')=='success','upload-result')
 meta=a.api('/actions/artifacts/'+aid);validate_artifact(meta,sha,run,aid,digest)
 directory=pathlib.Path(env['RUNNER_TEMP'])/'vc-export-attestation';directory.mkdir(mode=0o700,exist_ok=False)
 require(shutil.disk_usage(directory).free>meta['size_in_bytes']+256*1024*1024,'disk-budget')
 archive=directory/'original-export.zip';require(a.download(aid,archive,meta['size_in_bytes'])==digest,'archive-digest')
 receipt,manifest=inspect(archive);require(receipt['zipSha256']==digest,'inspect-digest');a.check()
 require(a.api('/branches/main')['commit']['sha']==sha,'main-moved');validate_run(a.api('/actions/runs/'+run),sha,run)
 predicate={'schemaVersion':1,'policy':'export-upload-v1','repository':REPO,'repositoryId':'1366223729','ownerId':'152733483','event':'push','ref':'refs/heads/main','workflow':WORKFLOW,'workflowSha':sha,'commit':sha,'tree':tree,'runId':run,'runAttempt':'1','validationJobId':str(job['id']),'artifactId':aid,'zipSha256':digest,'zipBytes':receipt['zipBytes'],'payloadManifestSha256':receipt['payloadManifestSha256'],'fileCount':receipt['fileCount'],'expandedBytes':receipt['expandedBytes']}
 (directory/'payload-manifest.json').write_bytes(manifest);(directory/'predicate.json').write_text(json.dumps(predicate,separators=(',',':'))+'\n')
 with open(env['GITHUB_OUTPUT'],'a') as f:f.write('zip-sha256='+digest+'\n')
 print('Original export verified; prepared exact-attempt signing predicate. No production authority.')
if __name__=='__main__':
 try:main()
 except Exception:
  # URLs may contain temporary storage credentials. Never echo raw exceptions.
  raise SystemExit('Export attestation preparation held; evidence acquisition or identity validation failed.')
