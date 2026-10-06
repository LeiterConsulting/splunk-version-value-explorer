/* Evaluate release readiness separately from post-release observation. */
const fs = require('node:fs');
const text = value => typeof value === 'string' && value.trim().length > 0;
const evidence = value => text(value) || (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) || (Array.isArray(value) && value.length > 0);
const protectedRisk = finding => ['factualUncertainty', 'privacyChange', 'audienceChange', 'destructive', 'commercialCommitment', 'dataIntegrityRisk', 'securityRisk', 'brokenLegacyLink', 'silentRouteChange'].some(key => Boolean(finding[key]));
function assess(input, policy = JSON.parse(fs.readFileSync('content/soak-policy.json', 'utf8'))) {
  const deployment = Date.parse(input.baseline?.deployedAt), evaluated = Date.parse(input.evaluatedAt);
  const elapsedHours = (evaluated - deployment) / 3600000;
  const missing = [], failed = [], scopedOut = [];
  for (const gate of policy.requiredGates) {
    const result = input.checks?.[gate];
    const checked = Date.parse(result?.checkedAt);
    if (!result || !evidence(result.evidence) || !Number.isFinite(checked) || checked < deployment || checked > evaluated) { missing.push(gate); continue; }
    if (result.outcome === 'not-applicable' && (policy.scopableGates || []).includes(gate)
      && result.scope?.unaffected === true && text(result.scope.rationale) && evidence(result.scope.evidence)) {
      scopedOut.push({ gate, rationale: result.scope.rationale, evidence: result.scope.evidence });
    } else if (!['passed', 'failed', 'blocked', 'not-performed'].includes(result.outcome)) missing.push(gate);
    else if (result.outcome !== 'passed') failed.push({ gate, outcome: result.outcome, reason: result.reason || '' });
  }
  const findings = input.findings || [];
  const unresolved = findings.filter(f => !f.resolved || (protectedRisk(f) && !evidence(f.resolutionEvidence)));
  const acceptedMinor = unresolved.filter(f => !protectedRisk(f) && f.severity === 'minor' && f.reversible === true && f.affectedFunctionWorks === true
    && text(f.trackingIssue) && text(f.owner) && text(f.nextAction) && text(f.validation)
    && Number.isFinite(Date.parse(f.reviewBy)) && Date.parse(f.reviewBy) > evaluated);
  const blocking = unresolved.filter(f => !acceptedMinor.includes(f));
  const recommendations = findings.map(f => ({ observed: f.observed, impact: f.impact, change: f.recommendedChange,
    validation: f.validation, disposition: protectedRisk(f) ? 'hold-for-review' : acceptedMinor.includes(f) ? 'tracked-nonblocking-repair' : f.reversible && f.checksPassed ? 'automatic-fix-eligible' : 'investigate' }));
  const minimumHours = policy.minimumHours ?? 0;
  const ready = Number.isFinite(elapsedHours) && elapsedHours >= minimumHours && !missing.length && !failed.length && !blocking.length;
  return { status: ready ? 'eligible-to-advance' : 'hold', elapsedHours: Number.isFinite(elapsedHours) ? elapsedHours : null,
    minimumHours, observationHours: policy.observationHours ?? policy.minimumHours, missing, failed, scopedOut,
    unresolved: blocking.map(f => f.observed), acceptedMinor: acceptedMinor.map(f => ({ observed: f.observed, trackingIssue: f.trackingIssue, owner: f.owner, reviewBy: f.reviewBy })),
    recommendations, feedback: input.feedback || { status: 'not-recorded', note: 'Silence is not success' } };
}
if (require.main === module) {
  const file = process.argv[2]; if (!file) throw Error('Usage: node scripts/check-soak.cjs SOAK_RESULT.json');
  const result = assess(JSON.parse(fs.readFileSync(file, 'utf8'))); console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'eligible-to-advance') process.exitCode = 2;
}
module.exports = { assess };
