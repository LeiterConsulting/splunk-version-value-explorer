// Read Git objects as data. Run the trusted copy of this program without checking out a watch branch.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {dailyReview} from './pipeline-status.mjs';

const require = createRequire(import.meta.url);
const coverage = require('./lib/automation-coverage.cjs');
const native = require('./lib/native-issue-feed.cjs');
const {dayOf} = require('./lib/reader-review.cjs');
const env = {...process.env, GIT_NO_REPLACE_OBJECTS: '1'};
const git = (...args) => execFileSync('git', args, {encoding:'utf8', env, maxBuffer:16 * 1024 * 1024});
const json = (sha, file) => JSON.parse(git('show', sha + ':' + file));

export function reconcile(date, base, heads) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(date), 'Supply an Eastern review date');
  const refs = [...new Set([base, ...heads])];
  const registry = JSON.parse(fs.readFileSync('content/automation-coverage.json'));
  const records = new Map(), ids = new Map(), inputs = [];
  for (const sha of refs) {
    assert(/^[a-f0-9]{40}$/.test(sha) && git('cat-file','-t',sha).trim() === 'commit', 'Fetch and supply exact commit IDs');
    const ancestry = spawnSync('git',['merge-base','--is-ancestor',sha,base],{env});
    assert([0,1].includes(ancestry.status), 'Cannot determine commit ancestry');
    const files = git('ls-tree','-r','--name-only',sha,'docs/audits').trim().split('\n')
      .filter(file => file.startsWith('docs/audits/' + date + '-') && file.endsWith('-coverage.json'));
    inputs.push({sha, containedInBase:ancestry.status === 0, datedReceipts:files.length});
    for (const file of files) {
      const blob = git('rev-parse',sha + ':' + file).trim();
      const run = json(sha,file);
      if (run.kind !== 'saved-task-execution') continue;
      assert(run.execution?.startedAt && dayOf(run.execution.startedAt) === date, 'Review date and attempt differ: ' + file);
      assert(!ids.has(run.runId) || ids.get(run.runId) === file, 'Run ID collision: ' + run.runId);
      const prior = records.get(file);
      assert(!prior || prior.blob === blob, 'Conflicting receipt bytes: ' + file);
      coverage.validateTaskOwner(run);
      assert(run.execution.taskId && run.auditBindings?.length, 'Missing owner or source binding: ' + file);
      for (const binding of run.auditBindings) {
        assert(native.watchFor(binding.file) === run.watchId && /^docs\/audits\/[a-z0-9.-]+\.json$/.test(binding.file), 'Invalid owner audit: ' + file);
        const audit = json(sha,binding.file);
        assert(audit.automationCoverage?.runFile === file && native.reviewDigest(audit) === binding.reviewDigest, 'Source binding differs: ' + file);
        coverage.validateBoundExecution(run,audit);
      }
      if (prior) { prior.seenAt.push(sha); continue; }
      const result = coverage.validateRun(run,registry);
      ids.set(run.runId,file);
      records.set(file,{file,blob,seenAt:[sha],run,result:{...result,file}});
    }
  }
  const all = [...records.values()];
  const summary = dailyReview(registry, all, date);
  return {date, base, inputs, receipts:all.map(({file,blob,seenAt,run}) => ({
    file,blob,seenAt,integrated:seenAt.includes(base),watch:run.watchId,runId:run.runId,startedAt:run.execution.startedAt})),
    registered:summary.registered, reviewedAcrossInputs:summary.reviewed,
    reviewedInBase:dailyReview(registry,all.filter(r => r.seenAt.includes(base)),date).reviewed,
    gaps:summary.sections.filter(section => !section.reviewedToday).map(section => ({
      id:section.capabilityId,owner:section.owner,disposition:section.latestDisposition,followUp:section.history[0]?.followUp || null})),
    qualification:'Source records only. The exact candidate, main validation, steward and live checks have their own outcomes.'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { const [date,base,...heads] = process.argv.slice(2);
    const result = reconcile(date,base,heads);
    console.log(JSON.stringify(result,null,2));
    if (result.gaps.length) process.exitCode = 2;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
