const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {qualifyDispatch}=require('../scripts/export-qualification-workflow.cjs');
const env={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:'LeiterConsulting/splunk-version-value-explorer',GITHUB_REF:'refs/heads/main',GITHUB_RUN_ATTEMPT:'1',VC_QUALIFICATION_MODE:'qualify-exports-only',VC_QUALIFICATION_REF:'refs/heads/main',GITHUB_SHA:'a'.repeat(40),VC_QUALIFICATION_COMMIT:'a'.repeat(40),GITHUB_WORKFLOW_SHA:'a'.repeat(40),GITHUB_WORKFLOW_REF:'LeiterConsulting/splunk-version-value-explorer/.github/workflows/publish-content.yml@refs/heads/main',GITHUB_RUN_ID:'1234',VC_VALIDATION_RUN:'1233'};
test('qualification dispatch binds exact manual main and distinct attempt-1 run',()=>{
 assert.equal(qualifyDispatch(env).admission,'held');
 for(const key of Object.keys(env))assert.throws(()=>qualifyDispatch({...env,[key]:''}),key);
 for(const patch of [{GITHUB_EVENT_NAME:'workflow_run'},{GITHUB_RUN_ATTEMPT:'2'},{GITHUB_REF:'refs/heads/pr'},{VC_QUALIFICATION_COMMIT:'b'.repeat(40)},{GITHUB_WORKFLOW_SHA:'b'.repeat(40)},{VC_VALIDATION_RUN:'1234'},{VC_VALIDATION_RUN:'1; curl evil'},{VC_VALIDATION_RUN:'1233\n'},{GITHUB_RUN_ID:'1234\n'},{GITHUB_SHA:'a'.repeat(40)+'\n',VC_QUALIFICATION_COMMIT:'a'.repeat(40)+'\n',GITHUB_WORKFLOW_SHA:'a'.repeat(40)+'\n'},{VC_QUALIFICATION_MODE:'publish'}])assert.throws(()=>qualifyDispatch({...env,...patch}));
});
test('qualification graph reuses real producer and excludes all publisher writes and OIDC',()=>{
 const w=fs.readFileSync('.github/workflows/publish-content.yml','utf8'),q=w.split('\n  qualify-exports:\n')[1];assert.ok(q);
 assert.match(w,/inputs.mode != 'qualify-exports-only'/);
 assert.match(q,/github.event_name == 'workflow_dispatch'/);assert.match(q,/github.run_attempt == 1/);
 assert.match(q,/permissions:\n      contents: read\n      actions: read\n    steps:/);
 assert.doesNotMatch(q,/id-token:|attestations:|secrets\.|ACTIONS_ID_TOKEN|commission-publisher|publisher-cli|stage-candidate|bootstrap-seed|recover-seed|createIssuer|issuer-cas/);
 for(const action of q.matchAll(/uses: ([^\n]+)/g))assert.match(action[1],/@[a-f0-9]{40}$/);
 assert.match(q,/persist-credentials: false/);assert.match(q,/--output "\$RUNNER_TEMP\/vc-export-qualification"/);
 assert.match(q,/python3 scripts\/qualify_admission_exports.py/);assert.match(q,/--validation-run "\$VC_VALIDATION_RUN"/);
 const upload=q.split('      - name: Retain fixed original-export qualification')[1].split('      - name:')[0];
 assert.match(upload,/name: qualification-\$\{\{ github.run_id \}\}-1/);
 assert.match(upload,/path: \$\{\{ runner.temp \}\}\/vc-export-qualification\/qualification.json/);
 assert.match(upload,/if-no-files-found: error/);assert.doesNotMatch(upload,/always\(\)|continue-on-error/);
 assert.match(q,/98cb101ad87dbbd3f6b2f2bfcbd43197ccd07643140121d8a9cfaa91eadbc24e/);
 assert.match(q,/fca7ac8a8386e3ad65c9a96a96cbf272d1dcc4f76de174dae91d54e50729e240/);
});
