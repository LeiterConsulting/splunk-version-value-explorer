import copy,json,pathlib,sys,unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
import qualify_admission_exports as q
S='a'*40;R='99'
def run():return {'id':99,'run_attempt':1,'head_sha':S,'head_branch':'main','event':'push','path':q.WORKFLOW,'status':'completed','conclusion':'success','repository':{'full_name':q.REPO,'id':1366223729,'owner':{'id':152733483}}}
def artifact():return {'id':1,'name':'export-evidence-'+S,'expired':False,'digest':'sha256:'+'b'*64,'size_in_bytes':20,'workflow_run':{'id':99,'head_sha':S,'head_branch':'main','repository_id':1366223729,'head_repository_id':1366223729}}
def job(name,step):return {'id':1,'name':name,'run_attempt':1,'head_sha':S,'status':'completed','conclusion':'success','steps':[{'name':step,'conclusion':'success'}]}
class Policy(unittest.TestCase):
 def test_run_exact(self):q.check_run(run(),S,R)
 def test_run_failures(self):
  for k,v in [('id',True),('id',2**53),('run_attempt',2),('head_sha','b'*40),('head_branch','pr'),('event','pull_request'),('path','x'),('status','in_progress'),('conclusion','failure')]:
   with self.subTest(k=k,v=v):
    r=run();r[k]=v
    with self.assertRaises((ValueError,TypeError)):q.check_run(r,S,R)
 def test_artifact_exact(self):
  a=artifact();self.assertEqual(q.select_artifact({'total_count':1,'artifacts':[a]},a['name'],R,S),a)
 def test_artifact_ambiguous_paginated(self):
  a=artifact()
  for p in [{'total_count':2,'artifacts':[a]},{'total_count':2,'artifacts':[a,a]},{'total_count':0,'artifacts':[]}]:
   with self.assertRaises(ValueError):q.select_artifact(p,a['name'],R,S)
 def test_artifact_identity_and_size(self):
  for key,value in [('expired',True),('size_in_bytes',True),('size_in_bytes',2*1024**3+1),('digest','sha256:x'),('id',2**53)]:
   a=artifact();a[key]=value
   with self.assertRaises(ValueError):q.select_artifact({'total_count':1,'artifacts':[a]},a['name'],R,S)
  a=artifact();a['workflow_run']['id']=100
  with self.assertRaises(ValueError):q.select_artifact({'total_count':1,'artifacts':[a]},a['name'],R,S)
 def test_job(self):
  p={'total_count':2,'jobs':[job('validate','Retain candidate export evidence'),job('attest-export','Retain signed bundle and byte binding')]};self.assertEqual(q.validation_job(p,S),'1')
  p['jobs'][1]['steps'][0]['conclusion']='skipped'
  with self.assertRaises(ValueError):q.validation_job(p,S)
 def test_context_rejects_local_and_wrong_source(self):
  with self.assertRaises(ValueError):q.context({},S)
  e={'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':q.REPO,'GITHUB_REF':'refs/heads/main','GITHUB_SHA':S,'GITHUB_WORKFLOW_SHA':S,'GITHUB_WORKFLOW_REF':q.REPO+'/.github/workflows/publish-content.yml@refs/heads/main','GITHUB_RUN_ATTEMPT':'1','GITHUB_EVENT_NAME':'workflow_dispatch','GITHUB_RUN_ID':'1'}
  self.assertEqual(q.context(e,S)['runId'],'1')
  e['GITHUB_WORKFLOW_SHA']='b'*40
  with self.assertRaises(ValueError):q.context(e,S)

# Orchestration uses explicit trusted fixtures, never claimed authenticated proof.
import tempfile,zipfile,hashlib,shutil,os
from unittest.mock import patch
class Pipeline(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.base=pathlib.Path(self.tmp.name);self.root=self.base/'source';self.root.mkdir();self.out=self.base/'output'
  self.z=self.base/'z.zip';self.b=self.base/'b.zip'
  with zipfile.ZipFile(self.z,'w') as z:z.writestr('evidence.json','{}')
  with zipfile.ZipFile(self.b,'w') as z:
   for n in ['attestation.json','predicate.json','payload-manifest.json']:z.writestr('original/'+n,'{}')
  a=artifact();a.update(size_in_bytes=self.z.stat().st_size,digest='sha256:'+hashlib.sha256(self.z.read_bytes()).hexdigest())
  b=copy.deepcopy(a);b.update(id=2,name='export-attestation-99-1',size_in_bytes=self.b.stat().st_size,digest='sha256:'+hashlib.sha256(self.b.read_bytes()).hexdigest())
  self.arts={'total_count':2,'artifacts':[a,b]};self.jobs={'total_count':2,'jobs':[job('validate','Retain candidate export evidence'),job('attest-export','Retain signed bundle and byte binding')]}
  self.calls={};self.drift=None;self.signature_fail=False;self.export_bad=False
  outer=self
  class Service:
   def api(self,p):
    outer.calls[p]=outer.calls.get(p,0)+1
    if p=='/branches/main':v={'commit':{'sha':S}}
    elif p.endswith('/jobs'):v=copy.deepcopy(outer.jobs)
    elif p.endswith('/artifacts'):v=copy.deepcopy(outer.arts)
    else:v=run()
    if outer.calls[p]>1:
     if outer.drift=='main' and p=='/branches/main':v['commit']['sha']='c'*40
     if outer.drift=='attempt' and p.endswith('/attempts/1'):v['run_attempt']=2
     if outer.drift=='artifact' and p.endswith('/artifacts'):v['artifacts'][0]['digest']='sha256:'+'c'*64
    return v
   def download(self,aid,dest,size):
    shutil.copyfile(outer.z if aid=='1' else outer.b,dest);return hashlib.sha256(dest.read_bytes()).hexdigest()
  self.service=Service()
 def tearDown(self):self.tmp.cleanup()
 def child(self,argv,env,**kw):
  if '--expected' in argv:
   if self.signature_fail:raise ValueError('fixture-verifier-rejection')
   return b'{"signatureVerified":true}'
  self.assertEqual(argv[-3:], [str(self.root/'scripts/export-evidence.cjs'),str(self.out/'exports'),str(self.root)])
  return json.dumps({'commit':'b'*40 if self.export_bad else S,'tree':'b'*40,'runId':'99','cases':226}).encode()
 def invoke(self,source_drift=False):
  with patch.object(q,'checkout',side_effect=[(S,'b'*40),('c'*40,'b'*40)] if source_drift else lambda r:(S,'b'*40)),patch.object(q,'context',return_value={'fixtureOnly':True}),patch.object(q,'_run',side_effect=self.child),patch.object(q,'run_verifier',side_effect=self.child),patch.object(q.shutil,'disk_usage',return_value=type('Space',(),{'free':10*1024**3})()):
   return q.qualify(self.root,'99',sys.executable,self.service,self.out,node=sys.executable)
 def test_success_and_service_retention(self):
  r=self.invoke();self.assertEqual(r['admission'],'held');self.assertTrue((self.out/'service-before.json').exists());self.assertTrue((self.out/'service-after.json').exists());self.assertFalse(r['productionActionAllowed'])
 def test_unrelated_cwd_uses_verified_root(self):
  previous=pathlib.Path.cwd()
  try:
   os.chdir(self.base)
   self.invoke()
  finally:os.chdir(previous)
 def test_signature_rejection_prevents_extraction(self):
  self.signature_fail=True
  with self.assertRaises(ValueError):self.invoke()
  self.assertFalse((self.out/'exports').exists());self.assertFalse((self.out/'qualification.json').exists());self.assertTrue((self.out/'service-before.json').exists());self.assertTrue((self.out/'failure.json').exists())
 def test_export_mismatch(self):
  self.export_bad=True
  with self.assertRaises(ValueError):self.invoke()
  self.assertFalse((self.out/'qualification.json').exists())
 def test_final_drift(self):
  for drift in ['main','attempt','artifact','source']:
   self.drift=drift;self.calls={};self.out=self.base/drift
   with self.assertRaises(ValueError):self.invoke(source_drift=drift=='source')
   self.assertFalse((self.out/'qualification.json').exists())
 def test_existing_output_not_modified(self):
  self.out.mkdir();(self.out/'marker').write_text('preserved')
  with self.assertRaises(FileExistsError):self.invoke()
  self.assertEqual(list(p.name for p in self.out.iterdir()),['marker'])
 def test_unsafe_original_prevents_extraction(self):
  with zipfile.ZipFile(self.z,'w') as z:z.writestr('../escape','x')
  self.arts['artifacts'][0].update(size_in_bytes=self.z.stat().st_size,digest='sha256:'+hashlib.sha256(self.z.read_bytes()).hexdigest())
  with self.assertRaises(ValueError):self.invoke()
  self.assertFalse((self.out/'exports').exists());self.assertFalse((self.out/'qualification.json').exists())

if __name__=='__main__':unittest.main()
