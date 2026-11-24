// Locate exact changed owner receipts for this validation. Read Git blobs only through the checked-out PR head.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessedSources} from './owner-source-evidence.mjs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const coverage = require('../../scripts/lib/automation-coverage.cjs');
const native = require('../../scripts/lib/native-issue-feed.cjs');
const {sameAttemptStart} = require('../../scripts/lib/task-runtime.cjs');
const registry = require('../../content/automation-coverage.json');
const [watchId,base] = process.argv.slice(2);
const git = (...args) => execFileSync('git',args,{encoding:'utf8'}).trim();
const head = git('rev-parse','HEAD');
const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
const caps = registry.capabilities.filter(c => c.mandatory && c.primaryOwner === watchId);
assert(caps.length,'Unknown primary owner');
const templates = require('./owner-questions.json').filter(q => caps.some(c => c.id === q.capabilityId));
let files = [];
if (base) {
  assert(/^[a-f0-9]{40}$/.test(base),'Exact comparison commit required');
  files = git('diff','--name-only','--diff-filter=AM',base+'...'+head,'--','docs/audits')
    .split('\n').filter(f => /^docs\/audits\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+-coverage\.json$/.test(f));
}
const receipts = [], observations = [];
const questions = [...templates];
for (const file of files) {
  const run = read(file);
  if (run.watchId !== watchId) continue;
  coverage.validateRun(run,registry);
  coverage.validateTaskOwner(run);
  assert(run.auditBindings?.length,'Missing source audit');
  const execution = run.execution || {};
  let bound = run.kind === 'saved-task-execution' && !!execution.schedulerRunId && !!execution.taskId;
  const sourceAudits = [];
  for (const binding of run.auditBindings) {
    assert(native.watchFor(binding.file) === watchId,'Source audit belongs to a different watch');
    const audit = read(binding.file);
    assert(audit.automationCoverage?.runFile === file && native.reviewDigest(audit) === binding.reviewDigest,'Source binding differs');
    coverage.validateBoundExecution(run,audit);
    sourceAudits.push({file:binding.file,blob:git('rev-parse',head+':'+binding.file),reviewDigest:binding.reviewDigest});
    bound &&= audit.execution?.taskId === execution.taskId && audit.execution?.schedulerRunId === execution.schedulerRunId &&
      sameAttemptStart(audit.execution?.startedAt,execution.startedAt);
  }
  const receipt = {file,blob:git('rev-parse',head+':'+file),kind:run.kind,sourceAuditBindsAttempt:bound};
  receipts.push(receipt);
  observations.push(...assessedSources(run,sourceAudits,caps,receipt));
  for (const row of run.coverage.filter(r => caps.some(c => c.id === r.capabilityId) && r.readerReview)) {
    for (const proof of [row.readerReview,...(row.additionalReaderReviews || [])]) {
      const {question,routeId,region,sourceId,claimIds,answer,reportAnswer} = proof;
      questions.push({capabilityId:row.capabilityId,question,routeId,region,sourceId,claimIds,answer,reportAnswer});
    }
  }
}
console.log(JSON.stringify({watchId,head,base:base || null,receipts,assessedSources:observations},null,2));
fs.writeFileSync('owner-review/questions.json',JSON.stringify(questions,null,2)+'\n');
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,'selected='+(!base || !!receipts.length)+'\n');
