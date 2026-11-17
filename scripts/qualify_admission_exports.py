"""Runner producer: original export evidence only, never admission authority.
Manual qualification-only workflow integration; no OIDC, HTTP mutations or D1.
"""
import argparse, hashlib, json, os, pathlib, re, resource, shutil, signal, subprocess, sys, tempfile, time, zipfile
from prepare_export_attestation import Acquisition, REPO, WORKFLOW, require
from attestation_zip import inspect
from verify_export_attestation import validate_expected, _run

SHA=re.compile(r'[a-f0-9]{40}\Z'); ID=re.compile(r'[1-9][0-9]{0,19}\Z')

def safe_id(value):
    require(type(value) is int and 0 < value < 2**53,'unsafe-service-id');return str(value)

def check_run(run, sha, run_id):
    require(safe_id(run.get('id'))==run_id and type(run.get('run_attempt')) is int and run.get('run_attempt')==1 and run.get('head_sha')==sha and run.get('head_branch')=='main' and run.get('event')=='push' and run.get('path')==WORKFLOW and run.get('status')=='completed' and run.get('conclusion')=='success','validation-run')
    r=run.get('repository',{});require(r.get('full_name')==REPO and r.get('id')==1366223729 and r.get('owner',{}).get('id')==152733483,'repository')

def select_artifact(page, name, run_id, sha):
    rows=page.get('artifacts');require(type(rows) is list and type(page.get('total_count')) is int and page['total_count']==len(rows) and len(rows)<=30,'artifact-pagination')
    matches=[a for a in rows if a.get('name')==name];require(len(matches)==1,'artifact-ambiguous');a=matches[0]
    safe_id(a.get('id'));w=a.get('workflow_run',{})
    require(a.get('expired') is False and re.fullmatch('sha256:[a-f0-9]{64}',a.get('digest','')) and type(a.get('size_in_bytes')) is int and 0<a['size_in_bytes']<=2*1024**3,'artifact-metadata')
    require(safe_id(w.get('id'))==run_id and w.get('head_sha')==sha and w.get('head_branch')=='main' and w.get('repository_id')==1366223729 and w.get('head_repository_id')==1366223729,'artifact-owner')
    return a

def validation_job(page, sha):
    jobs=page.get('jobs');require(type(jobs) is list and type(page.get('total_count')) is int and page.get('total_count')==len(jobs) and len(jobs)<=30,'job-pagination')
    def one(name,upload):
        match=[j for j in jobs if j.get('name')==name];require(len(match)==1,'job-ambiguous');j=match[0]
        require(type(j.get('run_attempt')) is int and j.get('run_attempt')==1 and j.get('head_sha')==sha and j.get('status')=='completed' and j.get('conclusion')=='success','job-state')
        steps=[s for s in j.get('steps',[]) if s.get('name')==upload];require(len(steps)==1 and steps[0].get('conclusion')=='success','upload-step')
        return safe_id(j.get('id'))
    result=one('validate','Retain candidate export evidence')
    one('attest-export','Retain signed bundle and byte binding')
    return result

def context(env, sha):
    require(env.get('GITHUB_ACTIONS')=='true' and env.get('GITHUB_REPOSITORY')==REPO and env.get('GITHUB_REF')=='refs/heads/main' and env.get('GITHUB_SHA')==sha and env.get('GITHUB_WORKFLOW_SHA')==sha and env.get('GITHUB_WORKFLOW_REF')==REPO+'/.github/workflows/publish-content.yml@refs/heads/main' and env.get('GITHUB_RUN_ATTEMPT')=='1' and env.get('GITHUB_EVENT_NAME') in ('workflow_dispatch','workflow_run'),'producer-context')
    require(ID.fullmatch(env.get('GITHUB_RUN_ID','')) is not None,'producer-run')
    return {'workflow':'.github/workflows/publish-content.yml','commit':sha,'runId':env['GITHUB_RUN_ID'],'runAttempt':'1'}

def git(root,*args):
    env={k:v for k,v in os.environ.items() if not k.startswith('GIT_')};env.update(GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_GLOBAL='/dev/null')
    return subprocess.check_output(['git','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',*args],cwd=root,env=env,text=True,timeout=15).strip()

def checkout(root):
    sha=git(root,'rev-parse','HEAD');tree=git(root,'rev-parse','HEAD^{tree}')
    require(SHA.fullmatch(sha) and SHA.fullmatch(tree) and not git(root,'status','--porcelain','--untracked-files=no'),'checkout')
    require(pathlib.Path(__file__).resolve()==root/'scripts/qualify_admission_exports.py','producer-source-root')
    for name in ['qualify_admission_exports.py','prepare_export_attestation.py','attestation_zip.py','verify_export_attestation.py','export-evidence.cjs']:
        p=root/'scripts'/name
        require(p.is_file() and not p.is_symlink(),'source-file')
        # hash-object compares exact bytes, including hidden index/worktree flags.
        require(git(root,'hash-object',str(p))==git(root,'rev-parse',sha+':scripts/'+name),'source-bytes')
    return sha,tree

def run_verifier(argv,env):
    # The verifier CLI establishes its own CPU/address-space limits. Do not wrap
    # it in the gh-child's smaller CPU hard limit, which it cannot raise again.
    def output_limit():resource.setrlimit(resource.RLIMIT_FSIZE,(1024*1024,16*1024*1024))
    with tempfile.TemporaryFile() as out,tempfile.TemporaryFile() as err:
        p=subprocess.Popen(argv,env=env,stdin=subprocess.DEVNULL,stdout=out,stderr=err,start_new_session=True,preexec_fn=output_limit)
        try:
            code=p.wait(timeout=610)
            require(code==0 and out.tell()<=8192 and err.tell()<=128*1024,'verifier-result')
            out.seek(0);return out.read(8193)
        except BaseException:
            try:os.killpg(p.pid,signal.SIGKILL)
            except ProcessLookupError:pass
            p.wait();raise

def _qualify(root, run_id, gh, acquisition, output, *, node, created):
    # Caller is reviewed runner code, not HTTP input. Paths and run selector are
    # local source configuration. Actual admission must independently acquire
    # this output from its fixed service run, never accept uploaded receipt JSON.
    root=pathlib.Path(root).resolve();output=pathlib.Path(output).resolve();gh=pathlib.Path(gh).resolve();node=pathlib.Path(node).resolve()
    require(node.is_file() and os.access(node,os.X_OK),'node-runtime')
    require(ID.fullmatch(run_id) is not None,'run-id');sha,tree=checkout(root)
    producer=context(os.environ,sha)
    def observe():
        main=acquisition.api('/branches/main');require(main['commit']['sha']==sha,'main-moved')
        current=acquisition.api('/actions/runs/'+run_id);attempt=acquisition.api('/actions/runs/'+run_id+'/attempts/1')
        check_run(current,sha,run_id);check_run(attempt,sha,run_id)
        jobs=acquisition.api('/actions/runs/'+run_id+'/attempts/1/jobs');job=validation_job(jobs,sha)
        artifacts=acquisition.api('/actions/runs/'+run_id+'/artifacts')
        export=select_artifact(artifacts,'export-evidence-'+sha,run_id,sha)
        bundle=select_artifact(artifacts,'export-attestation-'+run_id+'-1',run_id,sha)
        require(bundle['size_in_bytes']<=8*1024*1024,'bundle-limit')
        return {'main':main,'run':current,'attempt':attempt,'jobs':jobs,'artifacts':artifacts},job,export,bundle
    started=time.time();before,job,export,bundle=observe();observed=time.time()
    # New directory only. Preserve failed/partial evidence rather than reuse it.
    require(not output.is_relative_to(root),'output-inside-source')
    require(shutil.disk_usage(output.parent).free>2*export['size_in_bytes']+4*1024**3,'disk-budget')
    output.mkdir(mode=0o700,parents=False,exist_ok=False);created.append(output)
    (output/'service-before.json').write_text(json.dumps({'startedAt':started,'observedAt':observed,'service':before}))
    paths=[]
    for meta,name in [(export,'original-export.zip'),(bundle,'original-attestation.zip')]:
        p=output/name;require(acquisition.download(str(meta['id']),p,meta['size_in_bytes'])==meta['digest'][7:],'download-digest');paths.append(p)
    measured,manifest=inspect(paths[0]);bm,bmanifest=inspect(paths[1]);require(bm['expandedBytes']<=8*1024*1024 and bm['fileCount']==3,'attestation-contents')
    manifest_rows=json.loads(bmanifest)['files'];names=[r['path'] for r in manifest_rows if r['path'].endswith('/attestation.json')];require(len(names)==1,'attestation-ambiguous')
    require(sorted(r['path'].split('/')[-1] for r in manifest_rows)==['attestation.json','payload-manifest.json','predicate.json'],'attestation-contents')
    with zipfile.ZipFile(paths[1]) as z:(output/'attestation.json').write_bytes(z.read(names[0]))
    expected={'schemaVersion':1,'policy':'export-upload-v1','repository':REPO,'repositoryId':'1366223729','ownerId':'152733483','event':'push','ref':'refs/heads/main','workflow':WORKFLOW,'workflowSha':sha,'commit':sha,'tree':tree,'runId':run_id,'runAttempt':'1','validationJobId':job,'artifactId':str(export['id']),**{k:measured[k] for k in ['zipSha256','zipBytes','payloadManifestSha256','fileCount','expandedBytes']}}
    validate_expected(expected);(output/'expected.json').write_text(json.dumps(expected));(output/'payload-manifest.json').write_bytes(manifest)
    clean={'PATH':'/usr/bin:/bin','HOME':str(output),'PYTHONDONTWRITEBYTECODE':'1'}
    signed=run_verifier([sys.executable,str(root/'scripts/verify_export_attestation.py'),'--gh',str(gh),'--root',str(root/'verifier-assets/trusted-root.jsonl'),'--archive',str(paths[0]),'--bundle',str(output/'attestation.json'),'--expected',str(output/'expected.json')],clean)
    require(len(signed)<=8192,'signature-output');verification=json.loads(signed)
    # ZIP inspector rejected unsafe paths, aliases, symlinks and oversized data.
    extracted=output/'exports';extracted.mkdir();zipfile.ZipFile(paths[0]).extractall(extracted)
    js="const v=require(process.argv[1]).verify(process.argv[2],process.argv[3]);const r=v.receipt;process.stdout.write(JSON.stringify({commit:r.commit,tree:r.tree,runId:r.runId,cases:r.cases.length,checks:Object.fromEntries(Object.entries(v.checks).map(([k,v])=>[k,v.outcome]))}));"
    exports=_run([str(node),'--max-old-space-size=512','-e',js,str(root/'scripts/export-evidence.cjs'),str(extracted),str(root)],clean,deadline_seconds=120)
    require(len(exports)<=8192,'export-output');checked=json.loads(exports)
    require(checked['commit']==sha and checked['tree']==tree and str(checked['runId'])==run_id,'export-provenance')
    after,job2,export2,bundle2=observe();require(job==job2 and export==export2 and bundle==bundle2,'service-drift')
    require(checkout(root)==(sha,tree),'source-drift')
    evidence={'schemaVersion':1,'kind':'original-export-qualification','producer':producer,'validation':expected,'signature':verification,'exports':checked,'admission':'held','productionActionAllowed':False,'missingAuthorities':['semantic-review','runtime-and-head','rollback','policy-and-stop','server-owned-admission']}
    (output/'service-after.json').write_text(json.dumps({'observedAt':time.time(),'service':after}));(output/'qualification.json').write_text(json.dumps(evidence,sort_keys=True)+'\n')
    return evidence

def qualify(root, run_id, gh, acquisition, output, *, node):
    created=[]
    try:return _qualify(root,run_id,gh,acquisition,output,node=node,created=created)
    except Exception:
        if created:
            # Generic classification intentionally excludes raw exception text.
            with (created[0]/'failure.json').open('x') as f:
                json.dump({'status':'qualification-failed','recordedAt':time.time(),'admission':'held','productionActionAllowed':False},f)
        raise

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--validation-run',required=True);p.add_argument('--gh',required=True);p.add_argument('--node',required=True);p.add_argument('--output',required=True);args=p.parse_args()
    try:
        resource.setrlimit(resource.RLIMIT_CORE,(0,0))
        resource.setrlimit(resource.RLIMIT_AS,(768*1024*1024,4*1024**3))
        resource.setrlimit(resource.RLIMIT_CPU,(400,400))
        signal.signal(signal.SIGALRM,lambda *_: (_ for _ in ()).throw(ValueError('whole-deadline')))
        signal.alarm(1200)
        result=qualify(pathlib.Path.cwd(),args.validation_run,args.gh,Acquisition(os.environ['GH_TOKEN']),args.output,node=args.node)
        print(json.dumps({'status':'original-export-qualified','validationRun':result['validation']['runId'],'admission':'held','productionActionAllowed':False}))
    except Exception:
        # Never echo credentials, signed URLs or raw exception text. Do not modify
        # an old output directory if this run failed before creating its own.
        raise SystemExit('Original export qualification held; acquisition, source or verification gate failed. No admission created.')
