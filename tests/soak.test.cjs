const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { assess } = require('../scripts/check-soak.cjs');
const policy = JSON.parse(fs.readFileSync('content/soak-policy.json', 'utf8'));
function complete() { return { baseline: { deployedAt: '2026-10-06T15:00:00Z' }, evaluatedAt: '2026-10-06T16:00:00Z', checks: Object.fromEntries(policy.requiredGates.map(g => [g, { outcome: 'passed', checkedAt: '2026-10-06T15:30:00Z', evidence: 'Recorded actual check ' + g }])) }; }
function minor() { return { observed: 'Small visual spacing defect', severity: 'minor', reversible: true, affectedFunctionWorks: true,
  trackingIssue: 'docs/audits/example#spacing', owner: 'Release maintainer', nextAction: 'Adjust spacing', validation: 'Narrow and keyboard checks', reviewBy: '2026-10-07T16:00:00Z' }; }
test('evidenced release can advance before 72 hours; observation is not a waiting gate', () => {
  const result = assess(complete()); assert.equal(result.status, 'eligible-to-advance'); assert.equal(result.minimumHours, 0); assert.equal(result.observationHours, 72);
  const backwards = complete(); backwards.evaluatedAt = '2026-10-06T14:00:00Z'; assert.equal(assess(backwards).status, 'hold');
});
test('failed, blocked, missing and stale applicable checks still block advancement', () => {
  for (const outcome of ['failed', 'blocked', 'not-performed']) { const r = complete(); r.checks['pdf-rendering'].outcome = outcome; assert.equal(assess(r).status, 'hold'); }
  const missing = complete(); delete missing.checks['browser-journeys']; assert(assess(missing).missing.includes('browser-journeys'));
  for (const checkedAt of ['2026-10-05T00:00:00Z', '2026-10-07T00:00:00Z', 'bad-date']) { const r = complete(); r.checks.keyboard.checkedAt = checkedAt; assert(assess(r).missing.includes('keyboard')); }
  for (const evidence of ['', {}, [], null, false]) { const r = complete(); r.checks.keyboard.evidence = evidence; assert.equal(assess(r).status, 'hold'); }
});
test('unaffected checks require impact evidence and cannot waive core gates', () => {
  const r = complete(); r.checks['pdf-rendering'].outcome = 'not-applicable'; assert.equal(assess(r).status, 'hold');
  r.checks['pdf-rendering'].scope = { unaffected: true, rationale: 'Repository-only navigation update; no report or runtime files changed', evidence: 'Exact changed-file inventory' };
  assert.equal(assess(r).status, 'eligible-to-advance'); assert.equal(assess(r).scopedOut.length, 1);
  r.checks['shared-links'] = r.checks['pdf-rendering']; assert.equal(assess(r).status, 'hold');
});
test('only explicitly tracked, reversible, functioning minor defects are nonblocking', () => {
  const r = complete(); r.findings = [minor()]; const result = assess(r);
  assert.equal(result.status, 'eligible-to-advance'); assert.equal(result.acceptedMinor.length, 1);
  for (const field of ['severity', 'reversible', 'affectedFunctionWorks', 'trackingIssue', 'owner', 'nextAction', 'validation', 'reviewBy']) {
    const invalid = complete(); invalid.findings = [minor()]; delete invalid.findings[0][field]; assert.equal(assess(invalid).status, 'hold', field);
  }
  r.findings[0].reviewBy = '2026-10-06T16:00:00Z'; assert.equal(assess(r).status, 'hold');
});
test('minor labels never waive facts, privacy, security, data integrity or legacy-link risks', () => {
  for (const field of ['factualUncertainty','privacyChange','audienceChange','destructive','commercialCommitment','dataIntegrityRisk','securityRisk','brokenLegacyLink','silentRouteChange']) {
    const r = complete(); r.findings = [{ ...minor(), [field]: true }]; assert.equal(assess(r).status, 'hold', field);
    r.findings[0].resolved = true; assert.equal(assess(r).status, 'hold', 'Resolution requires evidence: ' + field);
    r.findings[0].resolutionEvidence = 'Recorded validation of the resolved finding'; assert.equal(assess(r).status, 'eligible-to-advance');
  }
});
test('unclassified findings remain blocking and silence is not treated as feedback', () => {
  const r = complete(); r.findings = [{ observed: 'Clipped button', reversible: true, checksPassed: true, recommendedChange: 'Allow wrapping', validation: 'Phone and keyboard checks' }];
  const out = assess(r); assert.equal(out.status, 'hold'); assert.equal(out.recommendations[0].disposition, 'automatic-fix-eligible'); assert.equal(out.feedback.status, 'not-recorded');
  r.findings[0].resolved = true; assert.equal(assess(r).status, 'eligible-to-advance');
});
