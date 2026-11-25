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
  assert.equal(review(evidence).scheduledVerifiedSections,0);
  entry.matchesNativeAttempt = true;
  entry.freshSources = true;
  for (const host of evidence.hosts) Object.assign(host.checks[0],{htmlSha256:'a'.repeat(64),pdfSha256:'b'.repeat(64)});
  assert.equal(review(evidence).scheduledVerifiedSections,0);
  entry.readerCheckedDuringAttempt = true;
  const unboundRetry = {...entry,receipt:'different.json',matchesNativeAttempt:false};
  daily.sections[0].history.unshift(unboundRetry);
  assert.equal(review(evidence).scheduledVerifiedSections,1);
  entry.supersededBy = 'new-owner-finding.json';
  assert.equal(review(evidence).scheduledVerifiedSections,0);
  delete entry.supersededBy;
  delete evidence.hosts[1].checks[0].pdfSha256;
  assert.equal(review(evidence).scheduledVerifiedSections,0);
  evidence.hosts[1].checks[0].pdfSha256 = 'b'.repeat(64);
  entry.freshSources = false;
  assert.equal(review(evidence).scheduledVerifiedSections,0);
  assert.equal(review({...evidence,sha:'b'.repeat(40)}).status,'unverified');
  assert.equal(review({...evidence,hosts:evidence.hosts.slice(0,1)}).status,'unverified');
  evidence.hosts[1].checks[0].pdf = 'failed';
  assert.equal(review(evidence).verifiedSections,0);
});

test('a current owner assessment can resolve a runner 403 only for the exact bound source and scope', async () => {
  const {assessedSources,sourceResolution} = await import('../tools/export-verification/owner-source-evidence.mjs');
  const source = {id:'official',url:'https://example.org/official',section:'Pricing table'};
  const cap = {id:'editions',sources:[source],claimFamilies:[{id:'licensing',sourceIds:['official']}]};
  const retrieval = {sourceId:'official',outcome:'retrieved',retrievedAt:checkedAt,evidence:source.url};
  const assessment = {claimId:'licensing',sourceIds:['official'],outcome:'assessed-no-change',assessedAt:checkedAt};
  const run = {watchId:'es',kind:'saved-task-execution',recordedAt:checkedAt,execution:{startedAt,schedulerRunId:'current'},
    coverage:[{capabilityId:cap.id,disposition:'assessed-no-change',assessedAt:checkedAt,retrievals:[retrieval],assessments:[assessment]}]};
  const receipt = {file:'coverage.json',blob:'a'.repeat(40),sourceAuditBindsAttempt:true};
  const get = () => assessedSources(run,[{file:'sources.json',blob:'b'.repeat(40)}],[cap],receipt);
  const check = {status:'blocked',http:403,url:source.url,requiredBy:[{capabilityId:cap.id,sourceId:source.id,section:source.section}]};
  const resolved = (day='2026-11-25') => sourceResolution(check,{watchId:'es',assessedSources:get()},day).method;
  assert.equal(resolved(),'owner-assessed');
  assert.equal(resolved('2026-11-26'),'unresolved');
  check.http=404; assert.equal(resolved(),'unresolved'); check.http=403;
  run.kind='implementation-review'; assert.equal(resolved(),'unresolved'); run.kind='saved-task-execution';
  receipt.sourceAuditBindsAttempt=false; assert.equal(resolved(),'unresolved'); receipt.sourceAuditBindsAttempt=true;
  retrieval.evidence='A different source'; assert.equal(resolved(),'unresolved'); retrieval.evidence=source.url;
  retrieval.retrievedAt='2026-11-25T08:59:00Z'; assert.equal(resolved(),'unresolved'); retrieval.retrievedAt=checkedAt;
  run.coverage[0].disposition='deferred'; assert.equal(resolved(),'owner-assessed');
  check.requiredBy.push({capabilityId:'another-section',sourceId:source.id,section:source.section});
  assert.equal(resolved(),'unresolved'); check.requiredBy.pop();
  assessment.sourceIds.push('other-support'); assert.equal(resolved(),'unresolved'); assessment.sourceIds.pop();
  assessment.outcome='unable-to-verify'; assert.equal(resolved(),'unresolved');
});

test('scheduled owner evidence binds the actual host receipts, attempt, selected answer and downloaded bytes', t => {
  const {ownerReaderTimes} = require('../scripts/lib/owner-reader-evidence.cjs');
  const {createHash} = require('node:crypto');
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'vc-owner-reader-'));
  t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'docs/audits'),{recursive:true});
  const attempt = {taskId:'owner',schedulerRunId:'occurrence',startedAt};
  const q = {...proof,capabilityId:cap.id,sourceUrl:cap.sources.find(s=>s.id===proof.sourceId).url};
  const revision = 'content-abc', digest = 'c'.repeat(64);
  const check = {routeId:proof.routeId,status:'passed',sections:[cap.id],expectations:[q],checkedAt,
    htmlSha256:'a'.repeat(64),pdfSha256:'b'.repeat(64)};
  function save(host, suffix, changes={}) {
    const receipt = 'docs/audits/owner-'+suffix+'.json';
    const data = {attempt,ownerReaderResult:{origin:host,revision,digest,checks:[check]},...changes};
    const bytes = Buffer.from(JSON.stringify(data));
    fs.writeFileSync(path.join(root,receipt),bytes);
    return {origin:host,receipt,receiptSha256:createHash('sha256').update(bytes).digest('hex'),
      revision,digest,checkedAt,htmlSha256:check.htmlSha256,pdfSha256:check.pdfSha256};
  }
  const a = save('https://versioncompass.com','apex'), b = save('https://www.versioncompass.com','www');
  const accepted = (refs,extra={}) => ownerReaderTimes(root,{execution:attempt,
    coverage:[{...row,publicOriginEvidence:refs,...extra}]},{capabilities:[cap]});
  assert.deepEqual(accepted([a,b]),{[cap.id]:[checkedAt,checkedAt]});
  assert.deepEqual(accepted([a,a]),{});
  assert.deepEqual(accepted([a,{...b,pdfSha256:'d'.repeat(64)}]),{});
  assert.deepEqual(accepted([a,{...b,receiptSha256:'e'.repeat(64)}]),{});
  assert.deepEqual(accepted([a,b],{readerReview:{...proof,answer:'A different reader-facing answer.'}}),{});
  const malformed = save(b.origin,'malformed',{ownerReaderResult:{origin:b.origin,revision,digest,checks:[null,{...check,expectations:{}}]}});
  assert.deepEqual(accepted([a,malformed]),{});
  const other = save(b.origin,'foreign',{attempt:{...attempt,schedulerRunId:'foreign'}});
  assert.deepEqual(accepted([a,other]),{});
  const later = save(b.origin,'later',{ownerReaderResult:{origin:b.origin,revision:'content-def',digest,checks:[check]}});
  assert.deepEqual(accepted([a,{...later,revision:'content-def'}]),{});
});
