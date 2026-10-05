const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const { assess } = require('../scripts/check-soak.cjs');
const policy = JSON.parse(fs.readFileSync('content/soak-policy.json', 'utf8'));
function complete() { return { baseline: { deployedAt: '2026-10-05T15:00:00Z' }, evaluatedAt: '2026-10-08T15:00:00Z', checks: Object.fromEntries(policy.requiredGates.map(g => [g, { outcome: 'passed', checkedAt: '2026-10-08T14:00:00Z', evidence: 'Recorded actual check ' + g }])) }; }
test('soak advances only after 72 hours and all evidenced checks pass', () => {
  assert.equal(assess(complete()).status, 'eligible-to-advance');
  const early = complete(); early.evaluatedAt = '2026-10-08T14:00:00Z'; assert.equal(assess(early).status, 'hold');
  for (const outcome of ['failed', 'blocked', 'not-performed']) { const r = complete(); r.checks['pdf-rendering'].outcome = outcome; assert.equal(assess(r).status, 'hold'); }
  const missing = complete(); delete missing.checks['browser-journeys']; assert(assess(missing).missing.includes('browser-journeys'));
  const stale = complete(); stale.checks.keyboard.checkedAt = '2026-10-04T00:00:00Z'; assert(assess(stale).missing.includes('keyboard'));
});
test('soak recommends bounded fixes while holding uncertain facts and privacy changes', () => {
  const r = complete(); r.findings = [{ observed: 'Clipped button', reversible: true, checksPassed: true, recommendedChange: 'Allow wrapping', validation: 'Phone and keyboard checks' }, { observed: 'Unestablished feature availability', factualUncertainty: true, recommendedChange: 'Obtain exact source evidence' }];
  const out = assess(r); assert.equal(out.status, 'hold'); assert.equal(out.recommendations[0].disposition, 'automatic-fix-eligible'); assert.equal(out.recommendations[1].disposition, 'hold-for-review'); assert.equal(out.feedback.status, 'not-recorded');
  r.findings.pop(); assert.equal(assess(r).status, 'hold'); r.findings[0].resolved = true; assert.equal(assess(r).status, 'eligible-to-advance');
});
