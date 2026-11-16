import unittest
import prepare_export_attestation as m
class Tests(unittest.TestCase):
 def env(self):return dict(GITHUB_ACTIONS='true',GITHUB_EVENT_NAME='push',GITHUB_REPOSITORY=m.REPO,GITHUB_REF='refs/heads/main',GITHUB_RUN_ATTEMPT='1',GITHUB_SHA='a'*40,GITHUB_WORKFLOW_SHA='a'*40,GITHUB_WORKFLOW_REF=m.REPO+'/'+m.WORKFLOW+'@refs/heads/main',GITHUB_RUN_ID='123',VC_ARTIFACT_ID='456',VC_ARTIFACT_DIGEST='b'*64)
 def test_exact_context(self):self.assertEqual(m.identity(self.env()),('a'*40,'123','456','b'*64))
 def test_context_holds(self):
  for k,v in [('GITHUB_EVENT_NAME','pull_request'),('GITHUB_REF','refs/heads/feature'),('GITHUB_RUN_ATTEMPT','2'),('GITHUB_REPOSITORY','foreign/repo'),('GITHUB_WORKFLOW_SHA','c'*40),('VC_ARTIFACT_ID','123\n')]:
   with self.subTest(k=k),self.assertRaises(ValueError):m.identity({**self.env(),k:v})
 def test_redirect_allowlist(self):
  for url in ['http://x.blob.core.windows.net/a','https://evil.test/a','https://x.blob.core.windows.net.evil.test/a','https://user:secret@x.blob.core.windows.net/a','https://x.blob.core.windows.net:99/a']:
   self.assertFalse(m.storage_url(url))
  self.assertTrue(m.storage_url('https://x.blob.core.windows.net/a?sig=secret'))
 def run_record(self):return dict(id=123,run_attempt=1,head_sha='a'*40,head_branch='main',event='push',path=m.WORKFLOW,status='in_progress',conclusion=None,repository=dict(full_name=m.REPO,id=1366223729,owner=dict(id=152733483)))
 def test_run_binding(self):
  m.validate_run(self.run_record(),'a'*40,'123')
  for k,v in [('run_attempt',2),('head_sha','b'*40),('event','pull_request'),('status','completed')]:
   with self.subTest(k=k),self.assertRaises(ValueError):m.validate_run({**self.run_record(),k:v},'a'*40,'123')
 def artifact(self):return dict(id=456,expired=False,name='export-evidence-'+'a'*40,digest='sha256:'+'b'*64,size_in_bytes=457692555,workflow_run=dict(id=123,head_sha='a'*40,head_branch='main',repository_id=1366223729,head_repository_id=1366223729))
 def test_artifact_binding(self):
  m.validate_artifact(self.artifact(),'a'*40,'123','456','b'*64)
  for k,v in [('id',789),('expired',True),('digest','sha256:'+'c'*64),('size_in_bytes',3*1024**3)]:
   with self.subTest(k=k),self.assertRaises(ValueError):m.validate_artifact({**self.artifact(),k:v},'a'*40,'123','456','b'*64)
 def test_workflow_isolation(self):
  from pathlib import Path
  s=Path('.github/workflows/validate.yml').read_text();before,signer=s.split('  attest-export:')
  self.assertNotIn('id-token: write',before);self.assertNotIn('attestations: write',before)
  for guard in ["github.event_name == 'push'","github.ref == 'refs/heads/main'","github.run_attempt == 1","needs.validate.result == 'success'"]:self.assertIn(guard,signer)
  for forbidden in ['workflow_dispatch','contents: write','actions: write','artifact-metadata: write','npm ci','publish-content'] :self.assertNotIn(forbidden,signer)
  self.assertIn('push-to-registry: false',signer);self.assertIn('create-storage-record: false',signer)
 def test_download_strips_auth_and_rejects_short_body(self):
  import tempfile,pathlib,io,urllib.error
  class Body(io.BytesIO):status=200
  for expected in [3,4]:
   with self.subTest(expected=expected),tempfile.TemporaryDirectory() as directory:
    a=m.Acquisition('SECRET');calls=[]
    def opener(url,auth=True):
     calls.append((url,auth))
     if auth:raise urllib.error.HTTPError(url,302,'redirect',{'Location':'https://x.blob.core.windows.net/file?sig=secret'},None)
     return Body(b'abc')
    a.open=opener
    if expected==3:self.assertEqual(a.download('456',pathlib.Path(directory)/'x',expected),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    else:
     with self.assertRaisesRegex(ValueError,'download-truncated'):a.download('456',pathlib.Path(directory)/'x',expected)
    self.assertEqual([c[1] for c in calls],[True,False])
 def test_second_redirect_rejected(self):
  import tempfile,pathlib,urllib.error
  a=m.Acquisition('SECRET')
  def opener(url,auth=True):raise urllib.error.HTTPError(url,302,'redirect',{'Location':'https://x.blob.core.windows.net/file'},None)
  a.open=opener
  with tempfile.TemporaryDirectory() as d,self.assertRaises(urllib.error.HTTPError):a.download('456',pathlib.Path(d)/'x',3)
if __name__=='__main__':unittest.main()
