import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {dayOf} = require('../../scripts/lib/reader-review.cjs');
const {compareInstants} = require('../../scripts/lib/task-runtime.cjs');

export function assessedSources(run, bindings, sections, receipt) {
  if (run.kind !== 'saved-task-execution' || !receipt.sourceAuditBindsAttempt || !bindings.length) return [];
  const start = run.execution.startedAt, end = run.execution.completedAt || run.recordedAt;
  const inAttempt = value => compareInstants(value,start) >= 0 && compareInstants(value,end) <= 0;
  const observations = [];
  for (const cap of sections) {
    const row = run.coverage.find(r => r.capabilityId === cap.id);
    // A section can await a corrected public report after its source passage was checked.
    // This evidence resolves only the source transport for its enumerated claim families.
    if (!row || !['changed','assessed-no-change','deferred'].includes(row.disposition) || !inAttempt(row.assessedAt)) continue;
    for (const source of cap.sources) {
      const retrieval = row.retrievals.find(r => r.sourceId === source.id && r.outcome === 'retrieved' && inAttempt(r.retrievedAt));
      const families = cap.claimFamilies.filter(family => family.sourceIds.includes(source.id));
      if (!retrieval || !families.length || dayOf(retrieval.retrievedAt) !== dayOf(row.assessedAt)) continue;
      const links = retrieval.evidence?.match(/https:\/\/[^\s<>|)\]]+/g) || [];
      if (retrieval.url !== source.url && !links.includes(source.url)) continue;
      const claims = families.map(family => row.assessments.find(a => a.claimId === family.id && a.sourceIds.includes(source.id) &&
        ['changed','assessed-no-change'].includes(a.outcome) && inAttempt(a.assessedAt) && dayOf(a.assessedAt) === dayOf(row.assessedAt) &&
        a.sourceIds.every(id => row.retrievals.some(r => r.sourceId === id && r.outcome === 'retrieved' &&
          inAttempt(r.retrievedAt) && compareInstants(r.retrievedAt,a.assessedAt) <= 0))));
      if (claims.some(claim => !claim)) continue;
      observations.push({watchId:run.watchId,url:source.url,capabilityId:cap.id,sourceId:source.id,section:source.section,
        retrievedAt:retrieval.retrievedAt,assessmentDate:dayOf(row.assessedAt),claimIds:claims.map(c => c.claimId),
        receipt:receipt.file,blob:receipt.blob,sourceAudits:bindings});
    }
  }
  return observations;
}

export function sourceResolution(record, handoff, today) {
  if (record.status === 'received') return {method:'direct'};
  if (record.http !== 403 || !handoff) return {method:'unresolved'};
  // A missing or moved page needs repair. Only an access denial can use an independently assessed observation.
  const matches = record.requiredBy.map(scope => handoff.assessedSources.find(s =>
    s.assessmentDate === today && s.watchId === handoff.watchId && s.url === record.url &&
    s.capabilityId === scope.capabilityId && s.sourceId === scope.sourceId && s.section === scope.section));
  return matches.every(Boolean) && matches.length ? {method:'owner-assessed',observations:matches} : {method:'unresolved'};
}
