/* Assess a recorded soak result; missing checks cannot silently become success. */
const fs = require('node:fs');
function assess(input, policy = JSON.parse(fs.readFileSync('content/soak-policy.json', 'utf8'))) {
  const deployment = Date.parse(input.baseline?.deployedAt), evaluated = Date.parse(input.evaluatedAt);
  const elapsedHours = (evaluated - deployment) / 3600000;
  const missing = [], failed = [];
  for (const gate of policy.requiredGates) {
    const result = input.checks?.[gate];
    if (!result || !['passed', 'failed', 'blocked', 'not-performed'].includes(result.outcome) || !result.evidence || !Number.isFinite(Date.parse(result.checkedAt)) || Date.parse(result.checkedAt) < deployment || Date.parse(result.checkedAt) > evaluated) missing.push(gate);
    else if (result.outcome !== 'passed') failed.push({ gate, outcome: result.outcome, reason: result.reason || '' });
  }
  const findings = input.findings || [];
  const holds = findings.filter(f => f.factualUncertainty || f.privacyChange || f.audienceChange || f.destructive || f.commercialCommitment);
  const recommendations = findings.map(f => ({ observed: f.observed, impact: f.impact, change: f.recommendedChange, validation: f.validation, disposition: f.factualUncertainty || f.privacyChange || f.audienceChange || f.destructive || f.commercialCommitment ? 'hold-for-review' : f.reversible && f.checksPassed ? 'automatic-fix-eligible' : 'investigate' }));
  const unresolved = findings.filter(f => !f.resolved);
  const ready = Number.isFinite(elapsedHours) && elapsedHours >= policy.minimumHours && !missing.length && !failed.length && !holds.length && !unresolved.length;
  return { status: ready ? 'eligible-to-advance' : 'hold', elapsedHours: Number.isFinite(elapsedHours) ? elapsedHours : null, missing, failed, unresolved: unresolved.map(f => f.observed), recommendations, feedback: input.feedback || { status: 'not-recorded', note: 'Silence is not success' } };
}
if (require.main === module) {
  const file = process.argv[2]; if (!file) throw Error('Usage: node scripts/check-soak.cjs SOAK_RESULT.json');
  const result = assess(JSON.parse(fs.readFileSync(file, 'utf8'))); console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'eligible-to-advance') process.exitCode = 2;
}
module.exports = { assess };
