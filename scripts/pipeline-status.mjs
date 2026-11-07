/* Read-only progress-task diagnostic. No schedule, rerun, PR or publication writes. */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const repository = 'LeiterConsulting/splunk-version-value-explorer';
export function publisherOutcome(main, run, evidence) {
  const unknown = (status, qualification) => ({ status, qualification, claimedDelivered: false });
  if (!evidence) return unknown('unavailable', 'No retained publisher receipt supplied; a failed job alone does not identify a runtime hold.');
  const receipt = evidence.receipt;
  if (!run || !Number.isSafeInteger(evidence.runId) || evidence.runId <= 0 || evidence.runId !== run.id || !Number.isSafeInteger(evidence.runAttempt) || evidence.runAttempt <= 0 || evidence.runAttempt !== run.run_attempt ||
      !receipt || receipt.commit !== main || receipt.claimedDelivered !== false || !Number.isFinite(Date.parse(receipt.recordedAt))) {
    return unknown('mismatched-evidence', 'Receipt does not match this exact main commit, publisher run and attempt. Do not use it for recovery.');
  }
  if (run.status !== 'completed') return unknown('pending', 'The matching publisher run has not completed.');
  const engine = /^engine-[a-f0-9]{20}$/;
  const hasEngines = receipt.requiredEngineRevision !== undefined || receipt.deployedEngineRevision !== undefined;
  const validEngines = !hasEngines || (engine.test(receipt.requiredEngineRevision) && engine.test(receipt.deployedEngineRevision) && receipt.requiredEngineRevision !== receipt.deployedEngineRevision);
  const preflightHold = run.conclusion === 'failure' && receipt.status === 'held-runtime-deployment-required' && receipt.reason === 'engine-mismatch' &&
    receipt.action === 'runtime-inspection' && receipt.mutationOutcome === 'no-write-at-failed-action' && Array.isArray(receipt.completedActions) && receipt.completedActions.length === 0 && validEngines;
  if (preflightHold) return {
    status: 'held-runtime-deployment-required', runId: run.id, runAttempt: run.run_attempt,
    requiredEngineRevision: receipt.requiredEngineRevision || null, deployedEngineRevision: receipt.deployedEngineRevision || null,
    mutationOutcome: 'no-write-at-failed-action', claimedDelivered: false,
    qualification: 'Matching receipt records a preflight hold before credentials or publisher writes. Use the separately authorized matching-runtime release process; do not disable the engine gate.'
  };
  if (receipt.status === 'held-runtime-deployment-required') return unknown('inconsistent-evidence', 'Receipt does not establish a preflight hold; inspect the failed action and any prior mutations before retrying.');
  const safe = value => typeof value === 'string' && /^[a-z0-9-]{1,80}$/.test(value) ? value : null;
  return { status: receipt.status === 'failed' && run.conclusion === 'failure' ? 'failed' : 'receipt-present',
    recordedStatus: safe(receipt.status), action: safe(receipt.action), reason: safe(receipt.reason), mutationOutcome: safe(receipt.mutationOutcome),
    claimedDelivered: false, qualification: 'Matched run receipt only. Repository, D1, Sites runtime and visitor verification remain separate; inspect uncertain mutations before retrying.' };
}
export function summarize(main, runs, publisherEvidence = null) {
  if (!/^[a-f0-9]{40}$/.test(main || '') || !Array.isArray(runs)) throw Error('Exact main commit and workflow runs are required');
  const latest = predicate => runs.filter(predicate).sort((a, b) => b.id - a.id)[0];
  const validation = latest(r => r.path === '.github/workflows/validate.yml' && r.head_sha === main && r.event === 'push' && r.head_branch === 'main');
  const publisher = latest(r => r.path === '.github/workflows/publish-content.yml' && r.head_sha === main);
  const state = r => !r ? 'missing' : r.status !== 'completed' ? 'pending' : r.conclusion;
  return { main, validation: { status: state(validation), runId: validation?.id || null, url: validation?.html_url || null },
    publisher: { status: state(publisher), runId: publisher?.id || null, url: publisher?.html_url || null,
      interpretation: publisher?.conclusion === 'success' ? 'Job passed; inspect its outcome receipt. Staging/already-current can succeed with active delivery off.' : 'Not a successful publisher job.',
      outcome: publisherOutcome(main, publisher, publisherEvidence) },
    claimedDelivered: false, delivery: 'unverified', qualification: 'CI conclusions cannot establish Sites deployment, active D1 visitor delivery, source accuracy or live readback.' };
}
export function watchReadiness(registryVersion, executions, runtime) {
  const expected = ['version-release-watch', 'version-guidance-audit', 'es-editions-watch', 'csp-fedramp-watch'];
  const gaps = expected.filter(id => !executions.some(r => r.watchId === id && r.registryVersion === registryVersion && r.coverageComplete && r.deliveryComplete));
  return { status: gaps.length === 0 && runtime?.status === 'evidence-matched' ? 'evidence-matched' : 'unverified',
    incompleteWatches: gaps, nativeTaskEvidence: runtime || { status: 'unavailable', qualification: 'No supported native task snapshot supplied; scheduler health and saved configuration are unknown.' },
    claimedDelivered: false };
}
async function read(url) {
  const token = process.env.VC_GITHUB_EVIDENCE_TOKEN;
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'VersionCompass-read-only-pipeline-status', ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  if (!response.ok) throw Error('GitHub read unavailable (HTTP ' + response.status + '); stop, preserve the prior checkpoint and report access/rate-limit failure.');
  return response.json();
}
async function main(args) {
  let tasks, publisherEvidence;
  const outcomeIndex = args.indexOf('--publisher-outcome');
  if (outcomeIndex >= 0) {
    if (!args[outcomeIndex + 1]) throw Error('--publisher-outcome requires a retained run-bound publisher receipt');
    publisherEvidence = JSON.parse(fs.readFileSync(args[outcomeIndex + 1])); args.splice(outcomeIndex, 2);
  }
  const taskIndex = args.indexOf('--tasks');
  if (taskIndex >= 0) {
    if (!args[taskIndex + 1]) throw Error('--tasks requires a retained supported native snapshot');
    tasks = JSON.parse(fs.readFileSync(args[taskIndex + 1])); args.splice(taskIndex, 2);
  }
  let head, runs;
  if (args.length === 2 && args[0] === '--snapshot') { const snapshot = JSON.parse(fs.readFileSync(args[1])); head = snapshot.main; runs = snapshot.workflow_runs; }
  else if (args.length === 0) {
    const api = 'https://api.github.com/repos/' + repository;
    const [branch, recent] = await Promise.all([read(api + '/git/ref/heads/main'), read(api + '/actions/runs?per_page=100')]);
    head = branch.object.sha; runs = recent.workflow_runs;
  } else throw Error('Usage: node scripts/pipeline-status.mjs [--snapshot <retained-GitHub-response.json>] [--tasks <supported-native-snapshot.json>] [--publisher-outcome <run-bound-receipt.json>]');
  const result = summarize(head, runs, publisherEvidence), coverage = require('./lib/automation-coverage.cjs').check();
  const today = new Date().toISOString().slice(0, 10);
  const latestByWatch = new Map();
  for (const r of coverage.runs) {
    const run = JSON.parse(fs.readFileSync(r.file));
    if (run.kind !== 'saved-task-execution') continue;
    const cutoff = Math.max(Date.parse(run.recordedAt), ...(run.execution?.observations || []).map(o => Date.parse(o.observedAt)));
    if ((latestByWatch.get(r.watchId)?.cutoff ?? -Infinity) >= cutoff) continue;
    latestByWatch.set(r.watchId, { ...r, cutoff, registryVersion: run.registryVersion, currentRegistry: run.registryVersion === coverage.registryVersion,
      overdue: run.coverage.filter(o => o.followUp?.reviewBy < today).map(o => ({ capabilityId: o.capabilityId, ...o.followUp })) });
  }
  const executions = [...latestByWatch.values()];
  const runtime = tasks ? require('./lib/task-runtime.cjs').inspect(tasks, {
    registry: JSON.parse(fs.readFileSync('content/automation-coverage.json')),
    ledger: JSON.parse(fs.readFileSync('content/automation-amendments.json')),
    runs: coverage.runs.map(r => ({ ...JSON.parse(fs.readFileSync(r.file)), coverageComplete: r.coverageComplete, deliveryComplete: r.deliveryComplete }))
  }) : null;
  const readiness = watchReadiness(coverage.registryVersion, executions, runtime);
  console.log(JSON.stringify({ evaluatedAt: new Date().toISOString(), repository, ...result, readiness, coverage: { activation: coverage.activation,
    currentSavedExecutions: [...latestByWatch.values()], retainedHistory: coverage.runs.map(({ file, runId, watchId }) => ({ file, runId, watchId })),
    qualification: 'Latest retained saved execution per watch; absent watches and changed registry versions need their own current evidence. Old runs remain history, not current overdue assessments.' } }, null, 2));
  if (result.validation.status !== 'success' || result.publisher.status !== 'success' || readiness.status !== 'evidence-matched') process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
