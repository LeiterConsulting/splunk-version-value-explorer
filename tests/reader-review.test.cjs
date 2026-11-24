const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {validateReader, inventory, proofId} = require('../scripts/lib/reader-review.cjs');
const {validateRun} = require('../scripts/lib/automation-coverage.cjs');
const registry = require('../content/automation-coverage.json');
const cap = registry.capabilities.find(c => c.id === 'es-editions.history');
const routes = require('../tools/export-verification/routes.json');
const startedAt = '2026-11-25T09:00:00Z', checkedAt = '2026-11-25T09:12:00Z';
const cutoff = Date.parse('2026-11-25T09:15:00Z');
const proof = {claimIds:[cap.id],routeId:'editions', region:'.edition-highlights', checkedAt,
  question:'Which scope can use entity actions?', answer:'Entity actions automate configured follow-up',
  sourceId:'rn88', sourceSection:'Release notes for version 8.8, Exposure Analytics'};
const row = {capabilityId:cap.id, disposition:'changed', assessedAt:checkedAt, readerReview:proof,
  assessments:[{claimId:cap.id,outcome:'changed',assessedAt:checkedAt,sourceIds:['rn88']}]};
const run = {kind:'saved-task-execution',watchId:cap.primaryOwner,execution:{startedAt},recordedAt:checkedAt,coverage:[row]};

test('completed reader checks bind visible scope, actual source and actual attempt', () => {
  validateReader(row,cap,run,routes,cutoff);
  for (const change of [{routeId:'enterprise'},{region:'body'},{sourceId:'random'},{answer:'ok'},{checkedAt:'2026-11-24T10:00:00Z'}]) {
    assert.throws(() => validateReader({...row,readerReview:{...proof,...change}},cap,run,routes,cutoff));
  }
  assert.throws(() => validateReader({...row,assessments:[...row.assessments,{...row.assessments[0],claimId:'another-change'}]},cap,run,routes,cutoff), /Changed claim lacks/);
  assert.throws(() => validateRun({...run,registryVersion:'1.4.0'},registry),/current reader-review contract/);
});
test('a later blocked attempt preserves the previous source proof and historical assessment time', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'vc-reader-'));
  t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'content'));fs.mkdirSync(path.join(root,'docs/audits'),{recursive:true});
  const write = (file,data) => fs.writeFileSync(path.join(root,file),JSON.stringify(data));
  write('content/automation-coverage.json', {capabilities:[cap]});
  write('docs/audits/first-coverage.json',run);
  write('docs/audits/second-coverage.json',{...run, execution:{startedAt:'2026-11-25T09:20:00Z'},coverage:[{...row,disposition:'blocked',readerReview:null,assessedAt:null,assessments:[]}]});
  let result = inventory(root);
  assert.equal(result.sections[0].disposition,'blocked');assert(result.sections[0].reviewedOnDate);
  assert.equal(result.proofs.length,1);assert.equal(result.sections[0].lastAssessedAt,checkedAt);
  write('docs/audits/carried-coverage.json',{...run,execution:{startedAt:'2026-11-26T09:00:00Z'},coverage:[{...row,readerReview:null}]});
  result=inventory(root);
  assert.equal(result.sections[0].disposition,'prior-assessment');assert.equal(result.sections[0].reviewedOnDate,false);
  assert.equal(result.proofs[0].checkedAt,checkedAt);
});
test('both actual public reports must match the same reviewed section and steward-selected SHA', async () => {
  const {summarizeReaderDelivery} = await import('../scripts/pipeline-status.mjs');
  const day = '2026-11-25', site = {status:'readback-matched',sourceCommit:'a'.repeat(40),publishedAt:'2026-11-25T14:01:00Z'};
  const entry = {reviewedToday:true, readerChecks:[{id:proofId(proof),routeId:proof.routeId,checkedAt}], receipt:'docs/audits/example.json'};
  const daily = {date:day,registered:1,sections:[{capabilityId:cap.id,history:[entry]}]};
  const check = {routeId:proof.routeId,screen:'passed',offlineHtml:'passed',pdf:'passed',status:'passed',sections:[{capabilityId:cap.id,proofId:proofId(proof),receipt:entry.receipt,checkedAt}]};
  const evidence = {registered:1,sha:site.sourceCommit,date:day,receiptDate:day,checkedAt:'2026-11-25T14:45:00Z',hosts:
    ['https://versioncompass.com','https://www.versioncompass.com'].map(host => ({host,checks:[structuredClone(check)],issues:[]}))};
  const review = report => summarizeReaderDelivery(report,site,daily,Date.parse('2026-11-25T15:00:00Z'));
  assert.equal(review(evidence).status,'verified');
  assert.equal(review({...evidence,sha:'b'.repeat(40)}).status,'unverified');
  assert.equal(review({...evidence,hosts:evidence.hosts.slice(0,1)}).status,'unverified');
  evidence.hosts[1].checks[0].pdf = 'failed';
  assert.equal(review(evidence).verifiedSections,0);
});
