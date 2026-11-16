"""Pinned offline signature verification; trusted caller supplies independent expectations.

Not a network endpoint/admission authority. Never accepts verification JSON as input.
"""
import argparse, datetime, hashlib, json, os, pathlib, re, resource, selectors, signal, subprocess, tempfile, time
from attestation_zip import inspect as inspect_archive

REPO='LeiterConsulting/splunk-version-value-explorer'
WORKFLOW='.github/workflows/validate.yml'
ISSUER='https://token.actions.githubusercontent.com'
PREDICATE='https://versioncompass.com/attestations/export-upload/v1'
GH_SHA256='fca7ac8a8386e3ad65c9a96a96cbf272d1dcc4f76de174dae91d54e50729e240'
ROOT_SHA256='65ca537f6ed8a47fd0e560c421baa1f6c1efb8b25fc200d8c5c02c0e92eb2b9c'
# New acquisitions need a reviewed root refresh after this bounded commissioning window.
ROOT_REVIEW_DEADLINE='2026-11-23T00:00:00+00:00'
MAX_BUNDLE=8*1024*1024
FIELDS={'schemaVersion','policy','repository','repositoryId','ownerId','event','ref','workflow','workflowSha','commit','tree','runId','runAttempt','validationJobId','artifactId','zipSha256','zipBytes','payloadManifestSha256','fileCount','expandedBytes'}
class Held(Exception): pass
def require(ok,reason):
    if not ok: raise Held(reason)
def unique(pairs):
    d={}
    for k,v in pairs:
        require(k not in d,'duplicate-json-key');d[k]=v
    return d
def parse(b):
    try:return json.loads(b,object_pairs_hook=unique)
    except (ValueError,TypeError,UnicodeDecodeError):raise Held('invalid-json')
def file_digest(p,limit):
    p=pathlib.Path(p);require(p.is_file() and not p.is_symlink(),'invalid-file')
    h=hashlib.sha256();n=0
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):
            n+=len(b);require(n<=limit,'file-limit');h.update(b)
    require(n>0,'empty-file');return h.hexdigest(),n
def validate_expected(e):
    require(type(e) is dict and set(e)==FIELDS,'expected-schema')
    for k,n in [('commit',40),('tree',40),('workflowSha',40),('zipSha256',64),('payloadManifestSha256',64)]:require(type(e[k]) is str and re.fullmatch('[a-f0-9]{'+str(n)+'}',e[k]) is not None,'expected-digest')
    for k in ['runId','validationJobId','artifactId']:require(type(e[k]) is str and re.fullmatch('[1-9][0-9]{0,19}',e[k]) is not None,'expected-id')
    fixed={'schemaVersion':1,'policy':'export-upload-v1','repository':REPO,'repositoryId':'1366223729','ownerId':'152733483','event':'push','ref':'refs/heads/main','workflow':WORKFLOW,'runAttempt':'1'}
    require(all(type(e[k]) is type(v) and e[k]==v for k,v in fixed.items()),'expected-policy')
    require(e['commit']==e['workflowSha'],'expected-workflow-commit')
    for k,limit in [('zipBytes',2*1024**3),('expandedBytes',4*1024**3),('fileCount',20000)]:require(type(e[k]) is int and 0<e[k]<=limit,'expected-size')

def _check_verified_output(raw,e):
    """Private policy stage; only call with this wrapper's successful pinned CLI output."""
    validate_expected(e);v=parse(raw)
    require(type(v) is list and len(v)==1 and type(v[0]) is dict,'ambiguous-verification')
    try:r=v[0]['verificationResult'];c=r['signature']['certificate'];s=r['statement'];ts=r['verifiedTimestamps']
    except (KeyError,TypeError):raise Held('verification-schema')
    require(type(c) is dict and type(s) is dict and type(ts) is list and len(ts)>0,'verification-schema')
    uri='https://github.com/'+REPO+'/'+WORKFLOW+'@refs/heads/main'
    expected_cert={'issuer':ISSUER,'subjectAlternativeName':uri,'buildSignerURI':uri,'buildSignerDigest':e['workflowSha'],'sourceRepositoryURI':'https://github.com/'+REPO,'sourceRepositoryDigest':e['commit'],'sourceRepositoryRef':'refs/heads/main','sourceRepositoryIdentifier':'1366223729','sourceRepositoryOwnerURI':'https://github.com/LeiterConsulting','sourceRepositoryOwnerIdentifier':'152733483','buildConfigURI':uri,'buildConfigDigest':e['workflowSha'],'buildTrigger':'push','runInvocationURI':'https://github.com/'+REPO+'/actions/runs/'+e['runId']+'/attempts/1','runnerEnvironment':'github-hosted','sourceRepositoryVisibilityAtSigning':'public'}
    require(all(c.get(k)==x for k,x in expected_cert.items()),'certificate-identity')
    require(s.get('_type')=='https://in-toto.io/Statement/v1' and s.get('predicateType')==PREDICATE,'statement-type')
    require(s.get('subject')==[{'name':'github-artifact:'+REPO+'/'+e['artifactId'],'digest':{'sha256':e['zipSha256']}}],'subject-binding')
    p=s.get('predicate');require(type(p) is dict and set(p)==FIELDS and all(type(p[k]) is type(e[k]) and p[k]==e[k] for k in FIELDS),'predicate-binding')
    return {'schemaVersion':1,'status':'signature-and-exact-attempt-bound','signatureVerified':True,'certificateRunAttemptBound':True,'artifactUploadAttemptVerified':True,'runId':e['runId'],'runAttempt':'1','artifactId':e['artifactId'],'zipSha256':e['zipSha256'],'payloadManifestSha256':e['payloadManifestSha256'],'admission':'held','productionActionAllowed':False,'deliveryVerified':False}

def limits():
    resource.setrlimit(resource.RLIMIT_AS,(4*1024**3,4*1024**3))
    resource.setrlimit(resource.RLIMIT_CPU,(90,90))
    resource.setrlimit(resource.RLIMIT_CORE,(0,0))
    resource.setrlimit(resource.RLIMIT_FSIZE,(16*1024*1024,16*1024*1024))

def parent_limits():
    # CLI process scope, including hashing, ZIP inspection, JSON and child orchestration.
    # Keep a 4 GiB hard ceiling so the Go child may reserve its address arena;
    # Python parent itself has a 768 MiB address-space soft limit.
    resource.setrlimit(resource.RLIMIT_AS,(768*1024*1024,4*1024**3))
    resource.setrlimit(resource.RLIMIT_CPU,(400,400))
    resource.setrlimit(resource.RLIMIT_CORE,(0,0))
    def expired(*_):raise Held('whole-verification-timeout')
    signal.signal(signal.SIGALRM,expired);signal.setitimer(signal.ITIMER_REAL,600)

def _run(argv,env,deadline_seconds=120):
    """No shell; drain both pipes with hard byte limits and kill entire process group."""
    p=subprocess.Popen(argv,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,start_new_session=True,preexec_fn=limits)
    selector=selectors.DefaultSelector();buffers={'out':bytearray(),'err':bytearray()};deadline=time.monotonic()+deadline_seconds
    try:
        selector.register(p.stdout,selectors.EVENT_READ,'out');selector.register(p.stderr,selectors.EVENT_READ,'err')
        while selector.get_map():
            require(time.monotonic()<deadline,'verifier-timeout')
            for key,_ in selector.select(min(.1,max(0,deadline-time.monotonic()))):
                b=os.read(key.fileobj.fileno(),65536)
                if not b:selector.unregister(key.fileobj);continue
                buf=buffers[key.data];buf.extend(b);require(len(buf)<=(1024*1024 if key.data=='out' else 128*1024),'verifier-output-limit')
        code=p.wait(timeout=max(.01,deadline-time.monotonic()));require(code==0,'signature-verifier-failed');return bytes(buffers['out'])
    except BaseException:
        try:os.killpg(p.pid,signal.SIGKILL)
        except ProcessLookupError:pass
        p.wait();raise
    finally:selector.close();p.stdout.close();p.stderr.close()

def verify(gh,root,archive,bundle,expected,now=None):
    validate_expected(expected)
    now=now or datetime.datetime.now(datetime.timezone.utc)
    require(now.tzinfo is not None and now<datetime.datetime.fromisoformat(ROOT_REVIEW_DEADLINE),'trust-root-review-due')
    gh=pathlib.Path(gh).resolve();root=pathlib.Path(root).resolve();archive=pathlib.Path(archive).resolve();bundle=pathlib.Path(bundle).resolve()
    require(file_digest(gh,128*1024*1024)[0]==GH_SHA256,'verifier-pin')
    require(file_digest(root,1024*1024)[0]==ROOT_SHA256,'trust-root-pin')
    require(file_digest(archive,2*1024**3)==(expected['zipSha256'],expected['zipBytes']),'original-archive-binding')
    measured,_=inspect_archive(archive)
    require(all(measured[k]==expected[k] for k in ['zipSha256','zipBytes','payloadManifestSha256','fileCount','expandedBytes']),'payload-manifest-binding')
    file_digest(bundle,MAX_BUNDLE)
    # Copy small mutable inputs to a private directory. No inherited credentials/config/proxy.
    with tempfile.TemporaryDirectory(prefix='vc-offline-verify-') as d:
        d=pathlib.Path(d);r=d/'trusted-root.jsonl';r.write_bytes(root.read_bytes());b=d/'attestation.json';b.write_bytes(bundle.read_bytes())
        require(file_digest(r,1024*1024)[0]==ROOT_SHA256,'trust-root-race');require(len(b.read_bytes())<=MAX_BUNDLE,'bundle-limit')
        env={'PATH':'/usr/bin:/bin','HOME':str(d),'GH_CONFIG_DIR':str(d),'GH_PROMPT_DISABLED':'1','GH_NO_UPDATE_NOTIFIER':'1','GH_NO_EXTENSION_UPDATE_NOTIFIER':'1','GOMEMLIMIT':'256MiB','GOMAXPROCS':'2','GODEBUG':'http2client=0'}
        uri='https://github.com/'+REPO+'/'+WORKFLOW+'@refs/heads/main'
        argv=[str(gh),'attestation','verify',str(archive),'--hostname','github.com','--repo',REPO,'--bundle',str(b),'--custom-trusted-root',str(r),'--cert-oidc-issuer',ISSUER,'--cert-identity',uri,'--signer-digest',expected['workflowSha'],'--source-digest',expected['commit'],'--source-ref','refs/heads/main','--deny-self-hosted-runners','--predicate-type',PREDICATE,'--format','json']
        raw=_run(argv,env)
        require(file_digest(gh,128*1024*1024)[0]==GH_SHA256,'verifier-pin-changed');require(file_digest(archive,2*1024**3)==(expected['zipSha256'],expected['zipBytes']),'archive-changed')
        return _check_verified_output(raw,expected)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--gh',required=True);p.add_argument('--root',required=True);p.add_argument('--archive',required=True);p.add_argument('--bundle',required=True);p.add_argument('--expected',required=True);a=p.parse_args()
    try:
        parent_limits()
        require(pathlib.Path(a.expected).stat().st_size<=65536,'expected-limit');print(json.dumps(verify(a.gh,a.root,a.archive,a.bundle,parse(pathlib.Path(a.expected).read_bytes())),sort_keys=True))
    except Exception:raise SystemExit('Attestation verification held: missing, mismatched, expired or unverified evidence.')
