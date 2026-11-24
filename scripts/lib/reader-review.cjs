const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const eastern = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
});
const dayOf = value => eastern.format(new Date(value));
const completed = disposition => ['changed', 'assessed-no-change'].includes(disposition);
const passage = value => typeof value === 'string' && value.trim().length >= 12 && value.length <= 1000;
const dailyOwners = new Set(['version-release-watch', 'es-editions-watch', 'csp-fedramp-watch']);

function coversRoute(cap, route) {
  if (!route || route.invalid || route.exportsBlocked || route.readerEligible === false) return false;
  const selected = new URLSearchParams(route.query.split('#')[0]);
  const required = new URL(cap.interfaces[0], 'https://versioncompass.com').searchParams;
  return [...required].every(([key, value]) => selected.get(key) === value);
}

function readerChecks(row) {
  return row.readerReview ? [row.readerReview, ...(row.additionalReaderReviews || [])] : [];
}
function proofId(proof) {
  const fields = ['routeId','region','answer','reportAnswer','sourceId','sourceSection','question','checkedAt'];
  return createHash('sha256').update(JSON.stringify([fields.map(key => proof[key]), [...proof.claimIds].sort()])).digest('hex');
}
function validateProof(proof, row, cap, run, routes, cutoff) {
  if (!coversRoute(cap, routes.find(route => route.id === proof?.routeId))) {
    throw Error('Missing or wrong reader report route: ' + cap.id);
  }
  if (!passage(proof.question) || !passage(proof.sourceSection) || !passage(proof.answer) ||
      (proof.reportAnswer !== undefined && !passage(proof.reportAnswer)) ||
      !/^[#.][a-zA-Z][a-zA-Z0-9_-]*$/.test(proof.region) ||
      !Array.isArray(proof.claimIds) || !proof.claimIds.length || new Set(proof.claimIds).size !== proof.claimIds.length ||
      !proof.claimIds.every(id => row.assessments.some(a => a.claimId === id && a.outcome !== 'unable-to-verify' && a.sourceIds.includes(proof.sourceId)))) {
    throw Error('Reader check needs a question, scoped visible answer, region and assessed source: ' + cap.id);
  }
  const start = Date.parse(run.execution?.startedAt), checked = Date.parse(proof.checkedAt);
  if (!Number.isFinite(start) || !Number.isFinite(checked) || checked < start || checked > cutoff ||
      !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(proof.checkedAt) ||
      (run.execution.completedAt && checked > Date.parse(run.execution.completedAt)) ||
      !Number.isFinite(Date.parse(row.assessedAt)) || dayOf(checked) !== dayOf(row.assessedAt) ||
      !row.assessments.every(a => dayOf(a.assessedAt) === dayOf(checked))) {
    throw Error('Reader check outside actual assessment day or attempt: ' + cap.id);
  }
}

function validateReader(row, cap, run, routes, cutoff) {
  if (!row.readerReview || (row.additionalReaderReviews !== undefined && !Array.isArray(row.additionalReaderReviews))) {
    throw Error('Primary review requires a reader question and answer: ' + cap.id);
  }
  const checks = readerChecks(row), covered = new Set();
  for (const proof of checks) {
    validateProof(proof, row, cap, run, routes, cutoff);
    for (const id of proof.claimIds) covered.add(id);
  }
  if (row.assessments.some(a => a.outcome === 'changed' && !covered.has(a.claimId))) {
    throw Error('Changed claim lacks a reader-facing assertion: ' + cap.id);
  }
}
function reviewedOn(row, date) {
  const onDay = value => Number.isFinite(Date.parse(value)) && dayOf(value) === date;
  return completed(row.disposition) && onDay(row.assessedAt) && row.assessments.length > 0 &&
    row.assessments.every(a => onDay(a.assessedAt));
}

function inventory(root = process.cwd()) {
  const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const registry = read('content/automation-coverage.json');
  const dir = 'docs/audits';
  const attempts = fs.readdirSync(path.join(root, dir)).filter(file => file.endsWith('-coverage.json'))
    .map(name => ({file: dir + '/' + name, run: read(dir + '/' + name)}))
    .filter(({run}) => run.kind === 'saved-task-execution' && run.execution?.startedAt && dailyOwners.has(run.watchId))
    .sort((a, b) => Date.parse(b.run.execution.startedAt) - Date.parse(a.run.execution.startedAt) ||
      Date.parse(b.run.recordedAt) - Date.parse(a.run.recordedAt) || a.file.localeCompare(b.file));
  const date = attempts.length ? dayOf(attempts[0].run.execution.startedAt) : null;
  const proofs = [];
  const sections = registry.capabilities.filter(cap => cap.mandatory && dailyOwners.has(cap.primaryOwner)).map(cap => {
    const records = attempts.filter(({run}) => run.watchId === cap.primaryOwner)
      .map(({file, run}) => ({file, run, row: run.coverage.find(r => r.capabilityId === cap.id)})).filter(r => r.row);
    const today = records.filter(r => dayOf(r.run.execution.startedAt) === date);
    const latest = today[0];
    const assessed = records.filter(({row}) => row.assessedAt && reviewedOn(row, dayOf(row.assessedAt)))
      .sort((a, b) => Date.parse(b.row.assessedAt) - Date.parse(a.row.assessedAt))[0];
    const byRoute = new Map();
    for (const {row, file} of records) {
      if (!completed(row.disposition) || !row.readerReview) continue;
      for (const proof of readerChecks(row)) {
        const source = cap.sources.find(s => s.id === proof.sourceId);
        if (!source) throw Error('Missing registered reader source for ' + cap.id);
        const assertion = {...proof, proofId:proofId(proof), capabilityId:cap.id, sourceUrl:source.url, receipt:file};
        for (const id of proof.claimIds) {
          const key = JSON.stringify([proof.routeId,id]);
          const time = Date.parse(row.assessedAt);
          const current = byRoute.get(key);
          if (!current || current.time < time) byRoute.set(key,{time, file, assertions:[assertion]});
          else if (current.file === file) current.assertions.push(assertion);
        }
      }
    }
    proofs.push(...new Set([...byRoute.values()].flatMap(group => group.assertions)));
    const disposition = latest?.row.disposition || 'missing';
    return {id: cap.id, title: cap.title, owner: cap.primaryOwner,
      disposition: completed(disposition) && !reviewedOn(latest.row, date) ? 'prior-assessment' : disposition,
      reviewedOnDate: today.some(({row}) => reviewedOn(row, date)), receipt: latest?.file || null,
      followUp: latest?.row.followUp ? {owner:latest.row.followUp.owner, reviewBy:latest.row.followUp.reviewBy} : null,
      lastAssessedAt: assessed?.row.assessedAt || null,
      lastAssessmentReceipt: assessed?.file || null};
  });
  return {date, sections, proofs};
}
module.exports = {validateReader, readerChecks, proofId, inventory, coversRoute, reviewedOn, dayOf};
