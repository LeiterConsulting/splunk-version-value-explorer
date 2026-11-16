import copy,datetime,hashlib,json,pathlib,tempfile,unittest
import verify_export_attestation as v
def expected():
 return {'schemaVersion':1,'policy':'export-upload-v1','repository':v.REPO,'repositoryId':'1366223729','ownerId':'152733483','event':'push','ref':'refs/heads/main','workflow':v.WORKFLOW,'workflowSha':'1'*40,'commit':'1'*40,'tree':'2'*40,'runId':'1234','runAttempt':'1','validationJobId':'5678','artifactId':'9999','zipSha256':'a'*64,'zipBytes':100,'payloadManifestSha256':'b'*64,'fileCount':5,'expandedBytes':200}
def result(e):
 uri='https://github.com/'+v.REPO+'/'+v.WORKFLOW+'@refs/heads/main'
 c={'issuer':v.ISSUER,'subjectAlternativeName':uri,'buildSignerURI':uri,'buildSignerDigest':e['workflowSha'],'sourceRepositoryURI':'https://github.com/'+v.REPO,'sourceRepositoryDigest':e['commit'],'sourceRepositoryRef':'refs/heads/main','sourceRepositoryIdentifier':'1366223729','sourceRepositoryOwnerURI':'https://github.com/LeiterConsulting','sourceRepositoryOwnerIdentifier':'152733483','buildConfigURI':uri,'buildConfigDigest':e['workflowSha'],'buildTrigger':'push','runInvocationURI':'https://github.com/'+v.REPO+'/actions/runs/'+e['runId']+'/attempts/1','runnerEnvironment':'github-hosted','sourceRepositoryVisibilityAtSigning':'public'}
 return [{'verificationResult':{'signature':{'certificate':c},'verifiedTimestamps':[{'type':'Tlog','timestamp':'2026-11-16T16:00:00Z'}],'statement':{'_type':'https://in-toto.io/Statement/v1','predicateType':v.PREDICATE,'subject':[{'name':'github-artifact:'+v.REPO+'/'+e['artifactId'],'digest':{'sha256':e['zipSha256']}}],'predicate':copy.deepcopy(e)}}}]
class Tests(unittest.TestCase):
 def test_synthetic_policy_keeps_admission_held(self):
  e=expected();r=v._check_verified_output(json.dumps(result(e)),e);self.assertEqual(r['admission'],'held');self.assertFalse(r['productionActionAllowed'])
 def test_certificate_fields_fail_closed(self):
  e=expected()
  for key in result(e)[0]['verificationResult']['signature']['certificate']:
   with self.subTest(key=key):
    r=result(e);r[0]['verificationResult']['signature']['certificate'][key]='wrong'
    with self.assertRaises(v.Held):v._check_verified_output(json.dumps(r),e)
 def test_predicate_cannot_replace_certificate_attempt(self):
  e=expected();r=result(e);del r[0]['verificationResult']['signature']['certificate']['runInvocationURI']
  with self.assertRaises(v.Held):v._check_verified_output(json.dumps(r),e)
 def test_subject_mismatch(self):
  e=expected();r=result(e);r[0]['verificationResult']['statement']['subject'][0]['digest']['sha256']='c'*64
  with self.assertRaises(v.Held):v._check_verified_output(json.dumps(r),e)
 def test_predicate_mismatch(self):
  e=expected()
  for k in e:
   with self.subTest(k=k):
    r=result(e);r[0]['verificationResult']['statement']['predicate'][k]='wrong'
    with self.assertRaises(v.Held):v._check_verified_output(json.dumps(r),e)
 def test_zero_or_multiple_verifications(self):
  e=expected()
  for x in [[],result(e)*2]:
   with self.assertRaises(v.Held):v._check_verified_output(json.dumps(x),e)
 def test_duplicate_json(self):
  with self.assertRaises(v.Held):v.parse('{"x":1,"x":2}')
 def test_new_attempt_rejected(self):
  e=expected();e['runAttempt']='2'
  with self.assertRaises(v.Held):v.validate_expected(e)
 def test_large_actual_archive_policy(self):
  e=expected();e['zipBytes']=457692555;e['expandedBytes']=569778893;e['fileCount']=4631;v.validate_expected(e)
 def test_invalid_identity_formats(self):
  for k,x in [('runId','123\n'),('artifactId',99),('schemaVersion',True),('zipBytes',True),('commit','1'*40+'\n')]:
   with self.subTest(k=k):
    e=expected();e[k]=x
    with self.assertRaises(v.Held):v.validate_expected(e)
 def test_root_review_window(self):
  with self.assertRaises(v.Held):v.verify('/missing','/missing','/missing','/missing',expected(),datetime.datetime(2026,11,24,tzinfo=datetime.timezone.utc))
 def test_process_failure(self):
  with self.assertRaises(v.Held):v._run(['/bin/false'],{})
 def test_output_limit(self):
  with self.assertRaises(v.Held):v._run(['/usr/bin/python3','-c','print("x"*1100000)'],{})
 def test_timeout(self):
  with self.assertRaises(v.Held):v._run(['/bin/sleep','5'],{},deadline_seconds=.1)
if __name__=='__main__':unittest.main()
