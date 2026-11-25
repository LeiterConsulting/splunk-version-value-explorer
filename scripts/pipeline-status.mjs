/* Read-only progress-task diagnostic. No schedule, rerun, PR or publication writes. */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {readerChecks, proofId} = require('./lib/reader-review.cjs');
const {compareInstants} = require('./lib/task-runtime.cjs');
const repository = 'LeiterConsulting/splunk-version-value-explorer';
const steward = require('./lib/operational-roles.cjs').roles.find(role => role.roleId === 'github-steward');
const easternDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', dateStyle: 'short' });
const publicHosts = ['https://versioncompass.com', 'https://www.versioncompass.com'];
const deliveryChecks = ['database-health', 'live-manifest', 'bundle-integrity', 'bounded-record-query', 'read-only-api', 'bundled-fallback-assets'];
const commitId = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const mainValidation = (commit, run) => run.path === '.github/workflows/validate.yml' && run.head_sha === commit && run.event === 'push' && run.head_branch === 'main';

export function summarizeSiteDelivery(evidence, runs, { projectId, publication, now = Date.now() }) {
  const unverified = reason => ({ status: 'unverified', reason });
  if (!evidence) return unverified('sites-evidence-unavailable');
  const { steward: receipt, deployment, publicChecks } = evidence;
  if (receipt?.taskId !== steward.taskId || !commitId(receipt.sourceCommit) || !publication?.revision ||
      !projectId || deployment?.project_id !== projectId || deployment.type !== 'publish' || deployment.status !== 'succeeded' ||
      !receipt.deploymentId || receipt.deploymentId !== deployment.id || !receipt.versionId || receipt.versionId !== deployment.version_id) {
    return unverified('sites-deployment-binding-mismatch');
  }
  if (!Number.isSafeInteger(receipt.validationRunId) || !runs.some(run => run.id === receipt.validationRunId &&
      mainValidation(receipt.sourceCommit, run) && run.status === 'completed' && run.conclusion === 'success' && run.run_attempt === 1)) {
    return unverified('exact-main-validation-unverified');
  }
  const deployedAt = Date.parse(deployment.updated_at);
  const publishedAt = Date.parse(receipt.publishedAt);
  const reconciledAt = Date.parse(receipt.reconciledAt);
  const latest = Math.max(publishedAt || 0, reconciledAt || 0);
  if (!Number.isFinite(deployedAt) || latest < deployedAt || latest > now ||
      (receipt.publishedAt != null && publishedAt !== deployedAt) ||
      (receipt.reconciledAt != null && !(reconciledAt >= deployedAt)) ||
      easternDate.format(latest) !== easternDate.format(now)) {
    return unverified('sites-outcome-clock-mismatch');
  }
  const matchesPublication = observed => observed?.revision === publication.revision &&
    observed.engineRevision === publication.engineRevision && observed.recordCount === publication.recordCount;
  if (!Array.isArray(publicChecks) || !publicHosts.every(host => {
    const reports = publicChecks.filter(report => report?.target === host);
    const [report] = reports;
    return reports.length === 1 && report.status === 'delivery-checks-passed' && report.expectedRevision === publication.revision &&
      Date.parse(report.evaluatedAt) >= latest && Date.parse(report.evaluatedAt) <= now &&
      deliveryChecks.every(key => report.checks?.[key]?.outcome === 'passed') &&
      report.checks['database-health'].evidence?.storage === 'bundled' &&
      matchesPublication(report.checks['database-health'].evidence) &&
      matchesPublication(report.checks['live-manifest'].evidence) &&
      report.checks['live-manifest'].evidence?.digest === publication.digest &&
      report.checks['bundle-integrity'].evidence?.digest === publication.digest;
  })) return unverified('public-delivery-readback-mismatch');
  return {
    status: 'readback-matched', sourceCommit: receipt.sourceCommit, validationRunId: receipt.validationRunId,
    versionId: receipt.versionId, deploymentId: receipt.deploymentId, revision: publication.revision,
    publishedAt: receipt.publishedAt ?? null, reconciledAt: receipt.reconciledAt ?? null,
    qualification: 'Retained steward report, exact-main workflow, native Sites and public readbacks agree. Scheduler identity and source assessment are checked separately.',
  };
}

export function publisherOutcome(main, run, evidence) {
  const unknown = (status, qualification) => ({ status, qualification, claimedDelivered: false });
  if (!evidence) return unknown('unavailable', 'No retained publisher receipt supplied; a failed job alone does not identify a runtime hold.');
  const receipt = evidence.receipt;
  if (!/^[a-f0-9]{40}$/.test(main || '') || !run || run.head_sha !== main || run.path !== '.github/workflows/publish-content.yml' ||
      !Number.isSafeInteger(evidence.runId) || evidence.runId <= 0 || evidence.runId !== run.id || !Number.isSafeInteger(evidence.runAttempt) || evidence.runAttempt <= 0 || evidence.runAttempt !== run.run_attempt ||
      !receipt || receipt.commit !== main || receipt.claimedDelivered !== false || typeof receipt.recordedAt !== 'string' || !Number.isFinite(Date.parse(receipt.recordedAt))) {
    return unknown('mismatched-evidence', 'Receipt does not match this exact main commit, publisher run and attempt. Do not use it for recovery.');
  }
  if (run.status !== 'completed') return unknown('pending', 'The matching publisher run has not completed.');
  const engine = /^engine-[a-f0-9]{20}$/;
  const hasEngines = receipt.requiredEngineRevision !== undefined || receipt.deployedEngineRevision !== undefined;
  const validEngines = !hasEngines || (typeof receipt.requiredEngineRevision === 'string' && typeof receipt.deployedEngineRevision === 'string' && engine.test(receipt.requiredEngineRevision) && engine.test(receipt.deployedEngineRevision) && receipt.requiredEngineRevision !== receipt.deployedEngineRevision);
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
  const validation = latest(r => mainValidation(main, r));
  const publisher = latest(r => r.path === '.github/workflows/publish-content.yml' && r.head_sha === main);
  const state = r => !r ? 'missing' : r.status !== 'completed' ? 'pending' : r.conclusion;
  return { main, validation: { status: state(validation), runId: validation?.id || null, url: validation?.html_url || null },
    publisher: { status: state(publisher), runId: publisher?.id || null, url: publisher?.html_url || null,
      interpretation: publisher?.conclusion === 'success' ? 'Latest legacy workflow job passed; inspect its mode and matching receipt. An observe-only run performs no publication; staging/already-current can also succeed with active delivery off. Earlier publication failures remain unresolved by an observation.' : 'Legacy GitHub workflow telemetry. The scheduled Site-linked steward provides production release evidence.',
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
export function operationalReadiness(runtime) {
  return runtime?.operational || { status: 'unavailable', claimedDelivered: false, qualification: 'No supported native task snapshot supplied; operational roles remain unverified and cannot satisfy content coverage.' };
}
export function latestWatchReceipts(registryVersion, receipts, today) {
  const latestByWatch = new Map();
  for (const { result, run } of receipts) {
    if (run.kind !== 'saved-task-execution') continue;
    const cutoff = Math.max(Date.parse(run.recordedAt), ...(run.execution?.observations || []).map(o => Date.parse(o.observedAt)));
    const attemptStarted = Date.parse(run.execution?.startedAt);
    const order = Number.isFinite(attemptStarted) ? attemptStarted : cutoff;
    const previous = latestByWatch.get(result.watchId);
    if (previous && (previous.order > order || previous.order === order && previous.receipt.cutoff >= cutoff)) continue;
    latestByWatch.set(result.watchId, { order, receipt: {
      ...result, cutoff, registryVersion: run.registryVersion, currentRegistry: run.registryVersion === registryVersion,
      overdue: run.coverage.filter(o => o.followUp?.reviewBy < today).map(o => ({ capabilityId: o.capabilityId, ...o.followUp })),
    } });
  }
  return [...latestByWatch.values()].map(value => value.receipt);
}
// Receipts are structurally validated by the coverage gate before this projection.
export function dailyReview(registry, receipts, day, runtime, previous = []) {
  const observations = [runtime,...previous].filter(Boolean);
  const sameClock = (a,b) => a === b || compareInstants(a,b) === 0;
  const taskByOccurrence = new Map(), conflicts = new Set();
  for (const observation of observations) {
    for (const role of [...observation.watches,...(observation.operational?.roles || [])]) {
      if (!role.schedulerRunId || !role.taskId) continue;
      const owner = taskByOccurrence.get(role.schedulerRunId);
      if (owner && owner !== role.taskId) conflicts.add(role.schedulerRunId);
      taskByOccurrence.set(role.schedulerRunId,role.taskId);
    }
  }
  const onDay = value => Number.isFinite(Date.parse(value)) && easternDate.format(Date.parse(value)) === day;
  const owners = new Set(['version-release-watch', 'es-editions-watch', 'csp-fedramp-watch']);
  const version = registry.readerReview && day < registry.readerReview.effectiveOn ? registry.readerReview.previousRegistryVersion : registry.registryVersion;
  const acceptedVersions = new Set([version]);
  if (registry.readerReview) {
    const transition = new Date(registry.readerReview.effectiveOn + 'T00:00:00Z');
    transition.setUTCDate(transition.getUTCDate() - 1);
    if (transition.toISOString().slice(0, 10) === day) {
      acceptedVersions.add(registry.registryVersion);
      for (const version of registry.readerReview.recoveryVersions || []) acceptedVersions.add(version);
    }
  }
  const attempts = receipts.filter(({ run }) =>
    owners.has(run.watchId) && acceptedVersions.has(run.registryVersion) &&
    run.kind === 'saved-task-execution' && onDay(run.execution?.startedAt)
  ).sort((a, b) => compareInstants(b.run.execution?.startedAt || b.run.recordedAt, a.run.execution?.startedAt || a.run.recordedAt)
    || compareInstants(b.run.recordedAt,a.run.recordedAt));
  const sections = registry.capabilities.filter(cap => cap.mandatory && owners.has(cap.primaryOwner)).map(cap => {
    const owner = cap.primaryOwner;
    const watches = observations.flatMap(o => o.watches.filter(w => w.watchId === owner));
    const history = attempts.filter(({ run }) => run.watchId === owner).map(({ run, result }) => {
      const row = run.coverage.find(entry => entry.capabilityId === cap.id);
      if (!row) return null;
      const matches = watches.filter(w => [w.matchingReceiptIds,w.verifiedReviewReceiptIds].some(ids => ids?.includes(run.runId)));
      const first = matches[0];
      const contradictory = matches.some(w => w.schedulerRunId !== first.schedulerRunId ||
        !sameClock(w.attempt?.startedAt,first.attempt?.startedAt) || !sameClock(w.attempt?.completedAt,first.attempt?.completedAt));
      const watch = !contradictory && !conflicts.has(run.execution?.schedulerRunId) ? first : null;
      const reviewedToday = ['changed', 'assessed-no-change'].includes(row.disposition) && onDay(row.assessedAt)
        && row.assessments.length > 0 && row.assessments.every(claim => onDay(claim.assessedAt));
      const inAttempt = t => onDay(t) &&
        compareInstants(t,run.execution.startedAt) >= 0 && compareInstants(t,run.execution.completedAt || run.recordedAt) <= 0 &&
        compareInstants(t,watch?.attempt?.startedAt) >= 0 && compareInstants(t,watch?.attempt?.completedAt) <= 0;
      const freshSources = reviewedToday && result.boundAttempt === true && inAttempt(row.assessedAt) &&
        row.assessments.every(a => inAttempt(a.assessedAt) && a.sourceIds?.length &&
          a.sourceIds.every(id => row.retrievals?.some(r => r.sourceId === id && r.outcome === 'retrieved' &&
            inAttempt(r.retrievedAt) && compareInstants(r.retrievedAt,a.assessedAt) <= 0)));
      const proofs = readerChecks(row);
      const originTimes = result.ownerReaderTimes?.[cap.id];
      const readerCheckedDuringAttempt = proofs.length > 0 && proofs.every(proof => inAttempt(proof.checkedAt)) &&
        Array.isArray(originTimes) && originTimes.length === proofs.length * 2 && originTimes.every(inAttempt);
      const assessedDeferral = ['deferred','blocked','failed'].includes(row.disposition) && result.boundAttempt === true &&
        inAttempt(row.assessedAt) && Array.isArray(row.assessments) && row.assessments.some(claim => inAttempt(claim.assessedAt));
      return { freshSources, readerCheckedDuringAttempt, assessedDeferral, runId: run.runId, registryVersion: run.registryVersion, receipt: result.file, disposition: row.disposition, assessedAt: row.assessedAt,
        reviewedToday, readerChecks: proofs.map(proof => ({id:proofId(proof), routeId:proof.routeId, checkedAt:proof.checkedAt})), matchesNativeAttempt: watches.length ? !!watch : null,
        followUp: row.followUp || null };
    }).filter(Boolean);
    // An owner's new assessment can reopen a previously verified section. Keep the
    // earlier receipt in history. Untouched sections in a targeted retry stay eligible.
    const reopened = history.findIndex(entry => entry.assessedDeferral);
    if (reopened !== -1) {
      for (const older of history.slice(reopened + 1)) older.supersededBy = history[reopened].receipt;
    }
    const reviewedToday = history.some(entry => entry.reviewedToday);
    const matched = history.some(entry => !entry.supersededBy && entry.reviewedToday && entry.matchesNativeAttempt === true);
    return { capabilityId: cap.id, section: cap.title, owner, reviewedToday, nativeReviewMatched: watches.length ? matched : null,
      latestDisposition: history[0]?.disposition || 'missing-receipt', history };
  });
  return { date: day, timeZone: 'America/New_York', registryVersion: version, sections,
    readerChecksRecorded: sections.filter(section => section.history.some(entry => entry.reviewedToday && entry.readerChecks?.length)).length,
    registered: sections.length, reviewed: sections.filter(row => row.reviewedToday).length,
    nativeReviewMatched: runtime ? sections.filter(row => row.nativeReviewMatched).length : null,
    qualification: 'Primary daily owners only. Retained assessments use their original claim dates. Later gaps remain visible. Guidance and Ripple have separate schedules. Live delivery is verified independently.' };
}
export function summarizeReaderDelivery(report, site, daily, now = Date.now()) {
  const unknown = reason => ({status:'unverified', verifiedSections:null, reason});
  if (!report || site.status !== 'readback-matched') return unknown('Reader evidence or verified steward delivery unavailable');
  const checked = Date.parse(report.checkedAt);
  const releaseTime = Math.max(Date.parse(site.publishedAt) || 0, Date.parse(site.reconciledAt) || 0);
  if (report.sha !== site.sourceCommit || report.date !== daily.date || report.receiptDate !== daily.date ||
      !Number.isFinite(checked) || checked < releaseTime || checked > now || easternDate.format(checked) !== daily.date ||
      report.registered !== daily.registered || !Array.isArray(report.hosts)) return unknown('Reader evidence differs from the selected release or review date');
  const hosts = publicHosts.map(host => report.hosts.filter(row => row.host === host));
  if (hosts.some(matches => matches.length !== 1 || !Array.isArray(matches[0].checks) || !Array.isArray(matches[0].issues))) return unknown('Missing or duplicate public host');
  function verifiedEntry(section, entry, scheduled = false) {
    if (entry.supersededBy || !entry.reviewedToday || !entry.readerChecks?.length) return false;
    if (scheduled && (entry.matchesNativeAttempt !== true || entry.freshSources !== true || entry.readerCheckedDuringAttempt !== true)) return false;
    return entry.readerChecks.every(expected => hosts.every(([host]) => host.checks.some(check =>
      check.routeId === expected.routeId && check.status === 'passed' &&
      [check.screen,check.offlineHtml,check.pdf].every(result => result === 'passed') &&
      (!scheduled || [check.htmlSha256,check.pdfSha256].every(hash => /^[0-9a-f]{64}$/.test(hash))) &&
      check.sections?.some(proof => proof.capabilityId === section.capabilityId && proof.receipt === entry.receipt &&
        proof.proofId === expected.id && proof.checkedAt === expected.checkedAt))));
  }
  const verified = daily.sections.filter(section => section.history.some(entry => verifiedEntry(section,entry)));
  const scheduled = daily.sections.filter(section => section.history.some(entry => verifiedEntry(section,entry,true)));
  const healthy = daily.registered > 0 && verified.length === daily.registered &&
    hosts.every(([host]) => host.issues.length === 0 && host.checks.every(check => check.status === 'passed'));
  return {status:healthy ? 'verified' : 'partial', verifiedSections:verified.length, scheduledVerifiedSections:scheduled.length, registered:daily.registered,
    gaps:daily.sections.filter(section => !verified.includes(section)).map(section => section.capabilityId)};
}
async function read(url) {
  const token = process.env.VC_GITHUB_EVIDENCE_TOKEN;
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'VersionCompass-read-only-pipeline-status', ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  if (!response.ok) throw Error('GitHub read unavailable (HTTP ' + response.status + '); stop, preserve the prior checkpoint and report access/rate-limit failure.');
  return response.json();
}
async function main(args) {
  let tasks, publisherEvidence, sitesEvidence, readerEvidence;
  const readerIndex = args.indexOf('--reader-evidence');
  if (readerIndex >= 0) {
    if (!args[readerIndex + 1]) throw Error('--reader-evidence requires the retained two-host live-reader result');
    readerEvidence = JSON.parse(fs.readFileSync(args[readerIndex + 1]));
    args.splice(readerIndex,2);
  }
  const sitesIndex = args.indexOf('--sites-evidence');
  if (sitesIndex >= 0) {
    if (!args[sitesIndex + 1]) throw Error('--sites-evidence requires retained steward, deployment and public diagnostic records');
    sitesEvidence = JSON.parse(fs.readFileSync(args[sitesIndex + 1])); args.splice(sitesIndex, 2);
  }
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
  const previousTasks = [];
  let priorIndex;
  while ((priorIndex = args.indexOf('--prior-owner-tasks')) >= 0) {
    if (!tasks || !args[priorIndex + 1]) throw Error('--prior-owner-tasks requires a current --tasks snapshot and an earlier native snapshot');
    const prior = JSON.parse(fs.readFileSync(args[priorIndex + 1]));
    if (!(compareInstants(prior.observedAt,tasks.observedAt) <= 0)) throw Error('Owner history was observed after the current task snapshot');
    previousTasks.push(prior);
    args.splice(priorIndex,2);
  }
  let head, runs;
  if (args.length === 2 && args[0] === '--snapshot') { const snapshot = JSON.parse(fs.readFileSync(args[1])); head = snapshot.main; runs = snapshot.workflow_runs; }
  else if (args.length === 0) {
    const api = 'https://api.github.com/repos/' + repository;
    const [branch, recent] = await Promise.all([read(api + '/git/ref/heads/main'), read(api + '/actions/runs?per_page=100')]);
    head = branch.object.sha; runs = recent.workflow_runs;
  } else throw Error('Usage: node scripts/pipeline-status.mjs [--snapshot FILE] [--tasks FILE] [--prior-owner-tasks FILE] [--sites-evidence FILE] [--reader-evidence FILE] [--publisher-outcome FILE]');
  const result = summarize(head, runs, publisherEvidence), coverage = require('./lib/automation-coverage.cjs').check();
  const now = Date.now(), today = easternDate.format(now);
  const sourceCommit = sitesEvidence?.steward?.sourceCommit;
  let publication, projectId;
  if (commitId(sourceCommit)) {
    try {
      const readBlob = path => JSON.parse(execFileSync('git', ['show', sourceCommit + ':' + path], {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
      }));
      publication = readBlob('content/publication.json');
      projectId = readBlob('.openai/hosting.json').project_id;
    } catch {
      // The retained source commit must be available locally to bind its manifest.
    }
  }
  const siteDelivery = summarizeSiteDelivery(sitesEvidence, runs, { projectId, publication, now });
  const receipts = coverage.runs.map(result => ({ result, run: JSON.parse(fs.readFileSync(result.file)) }));
  const executions = latestWatchReceipts(coverage.registryVersion, receipts, today);
  const registry = JSON.parse(fs.readFileSync('content/automation-coverage.json'));
  const context = {
    registry,
    ledger: JSON.parse(fs.readFileSync('content/automation-amendments.json')),
    runs: receipts.map(({ result: { coverageComplete, deliveryComplete, boundAttempt }, run }) => ({ ...run, coverageComplete, deliveryComplete, boundAttempt }))
  };
  const {inspect} = require('./lib/task-runtime.cjs');
  const runtime = tasks ? inspect(tasks,context) : null;
  const daily = dailyReview(registry, receipts, today, runtime, previousTasks.map(prior => inspect(prior,context)));
  const readerDelivery = summarizeReaderDelivery(readerEvidence, siteDelivery, daily, now);
  const advisor = require('./advisor-maintenance.cjs').reviewDecisions(new Date(now).toISOString());
  const readiness = watchReadiness(coverage.registryVersion, executions, runtime), operations = operationalReadiness(runtime);
  console.log(JSON.stringify({ evaluatedAt: new Date(now).toISOString(), repository, ...result, siteDelivery, readerDelivery, readiness, operations, coverage: { activation: coverage.activation, daily, advisor,
    currentSavedExecutions: executions, retainedHistory: coverage.runs.map(({ file, runId, watchId }) => ({ file, runId, watchId })),
    qualification: 'Latest retained saved execution per watch uses the recorded attempt start when present. Native attempts and result identities require separate reconciliation.' } }, null, 2));
  if ((registry.readerReview && today >= registry.readerReview.effectiveOn && (readerDelivery.status !== 'verified' || readerDelivery.scheduledVerifiedSections !== daily.registered)) || !advisor.total || advisor.current !== advisor.total || !daily.registered || daily.nativeReviewMatched !== daily.registered || result.validation.status !== 'success' || siteDelivery.status !== 'readback-matched' || readiness.status !== 'evidence-matched' || operations.status !== 'evidence-matched') process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
