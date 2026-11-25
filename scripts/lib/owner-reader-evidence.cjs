const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {readerChecks} = require('./reader-review.cjs');
const {sameAttemptStart} = require('./task-runtime.cjs');
const hosts = ['https://versioncompass.com','https://www.versioncompass.com'];
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function artifact(root, filename, cache) {
  if (typeof filename !== 'string' || !/^docs\/audits\/[a-zA-Z0-9_-]+\.json$/.test(filename)) return null;
  if (!cache.has(filename)) {
    const full = path.join(root,filename);
    let record = null;
    if (fs.lstatSync(full,{throwIfNoEntry:false})?.isFile()) {
      const bytes = fs.readFileSync(full);
      try { record = {sha:createHash('sha256').update(bytes).digest('hex'),value:JSON.parse(bytes)}; }
      catch (error) { if (!(error instanceof SyntaxError)) throw error; }
    }
    cache.set(filename,record);
  }
  return cache.get(filename);
}

function matches(origin, proof, row, run, cap, record) {
  if (!record || record.sha !== origin.receiptSha256 || !hash(origin.htmlSha256) || !hash(origin.pdfSha256) ||
      !hash(origin.digest) || !/^content-[0-9a-f]+$/.test(origin.revision || '')) return false;
  const {attempt,ownerReaderResult:report} = record.value || {};
  if (!attempt?.schedulerRunId || attempt.schedulerRunId !== run.execution?.schedulerRunId || !attempt.taskId ||
      attempt.taskId !== run.execution.taskId || !sameAttemptStart(attempt.startedAt,run.execution.startedAt)) return false;
  if (report?.origin !== origin.origin || report.revision !== origin.revision || report.digest !== origin.digest) return false;
  const source = cap.sources.find(s => s.id === proof.sourceId);
  return !!source && Array.isArray(report.checks) && report.checks.some(check => check?.status === 'passed' &&
    check.routeId === proof.routeId && check.checkedAt === origin.checkedAt && check.htmlSha256 === origin.htmlSha256 &&
    check.pdfSha256 === origin.pdfSha256 && Array.isArray(check.sections) && check.sections.includes(row.capabilityId) &&
    Array.isArray(check.expectations) && check.expectations.some(q => q?.capabilityId === row.capabilityId && q.routeId === proof.routeId &&
      q.region === proof.region && q.sourceId === proof.sourceId && q.sourceUrl === source.url &&
      q.answer === proof.answer && (q.reportAnswer || q.answer) === (proof.reportAnswer || proof.answer) &&
      Array.isArray(q.claimIds) && proof.claimIds.every(id => q.claimIds.includes(id))));
}

// The caller also checks every accepted observation against the terminal native clock.
function ownerReaderTimes(root,run,registry,cache = new Map()) {
  const bySection = {};
  for (const row of run.coverage) {
    if (!row.readerReview || !Array.isArray(row.publicOriginEvidence)) continue;
    const cap = registry.capabilities.find(c => c.id === row.capabilityId);
    if (!cap) continue;
    const times = [];
    for (const proof of readerChecks(row)) {
      const candidates = row.publicOriginEvidence.filter(origin => hosts.includes(origin?.origin) &&
        matches(origin,proof,row,run,cap,artifact(root,origin.receipt,cache)));
      const a = candidates.find(x => x.origin === hosts[0] && candidates.some(y =>
        y.origin === hosts[1] && y.digest === x.digest && y.revision === x.revision));
      if (!a) break;
      const b = candidates.find(y => y.origin === hosts[1] && y.digest === a.digest && y.revision === a.revision);
      times.push(a.checkedAt,b.checkedAt);
    }
    if (times.length === 2*readerChecks(row).length) bySection[row.capabilityId] = times;
  }
  return bySection;
}
module.exports = {ownerReaderTimes};
