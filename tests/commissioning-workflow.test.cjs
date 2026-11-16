const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {workflowMode}=require('../scripts/publisher-workflow-mode.cjs');
test('commissioning is manual only and default/automatic publication remains held',()=>{
 assert.equal(workflowMode('workflow_dispatch',{inputs:{mode:'commissioning-only'}}),'commissioning-only');
 assert.equal(workflowMode('workflow_run',{inputs:{mode:'commissioning-only'}}),'held');
 assert.equal(workflowMode('workflow_dispatch',{inputs:{mode:'publish'}}),'held');
 assert.throws(()=>workflowMode('push',{inputs:{mode:'commissioning-only'}}));
});
test('commissioning workflow uses existing authority and only bounded client and receipt steps',()=>{
 const s=fs.readFileSync('.github/workflows/publish-content.yml','utf8');
 assert.match(s,/permissions:\n  actions: read\n  contents: read\n  id-token: write/);
 assert.match(s,/cancel-in-progress: false/);
 assert.match(s,/default: publish/);
 const steps=s.split(/      - /);
 const client=steps.find(x=>x.includes('run: node scripts/commission-publisher.mjs'));
 assert.match(client,/if: steps.mode.outputs.mode == 'commissioning-only'/);
 assert.match(client,/timeout-minutes: 2/);
 assert.doesNotMatch(client,/github.token|secret|VC_GITHUB_EVIDENCE_TOKEN/);
 for(const x of steps.filter(x=>/run: node scripts\/(recover-seed|stage-candidate|resume-seed|bootstrap-seed|observe-seed|observe-current-head|observe-head|select-publication|publish-content)/.test(x))) {
  assert.match(x,/if: steps.mode.outputs.mode == '(recover-seed-only|stage-only|resume-only|bootstrap-only|observe-only|current-head-only|head-only|publish)'/);
  assert.doesNotMatch(x,/commissioning-only/);
 }
 assert.match(s,/inputs.mode != 'commissioning-only' && inputs.mode != 'recover-seed-only'/);
});
