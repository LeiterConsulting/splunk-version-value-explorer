/* Read-only decision coverage and freshness. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));

function model() {
  const context = {
    window: {
      SPLUNK_DATA: { guidance: read('content/datasets/guidance.json') },
      VersionCompassEnvironmentData: read('content/datasets/environment.json'),
    },
    URLSearchParams, TextEncoder,
  };
  for (const file of ['content-hash.js', 'ai-availability.js', 'advisor-admission.js', 'advisor-goals.js', 'advisor.js']) {
    vm.runInNewContext(fs.readFileSync('dist/' + file, 'utf8'), context);
  }
  return context.window;
}

function reviewDecisions(checkedAt = new Date().toISOString()) {
  const { VersionCompassAdvisor: advisor, VersionCompassAdvisorAdmission: admission } = model();
  const decisions = Array.from(advisor.registry.goals, goal => {
    const review = advisor.review(goal.id, checkedAt);
    return {
      id: goal.id, coverage: goal.coverage, exclusions: goal.exclusions, owners: goal.owners,
      dependencies: admission.goals[goal.admission], status: review.status,
      sourceChecks: review.checked, claimAndSectionAssessments: review.assessed,
      reviewDue: review.due, rejectedDependencies: review.rejected || [],
    };
  });
  return {
    checkedAt, decisions,
    current: decisions.filter(row => row.status === 'recorded').length,
    total: decisions.length,
    qualification: 'Freshness and identity of the three repository decision briefs at the evaluation time. Daily owner assessments and public delivery have separate receipts.',
  };
}

if (require.main === module) {
  const result = reviewDecisions();
  if (process.argv.includes('--check')) {
    for (const goal of model().VersionCompassAdvisor.registry.goals) {
      const api = model().VersionCompassAdvisor;
      const record = api.resolve('capability:' + goal.record);
      assert(record && goal.releaseGates.length >= 3, 'Missing decision evidence or negative release gates');
      record.requirements[0] += ' [synthetic drift fixture]';
      const changed = api.evaluate({ goal: goal.id });
      assert.equal(changed.status, 'needs_review'); assert.equal(changed.record, null); assert.equal(changed.sources.length, 0);
      const stale = model().VersionCompassAdvisor.evaluate({ goal: goal.id }, { now: '2099-01-01T00:00:00Z' });
      assert.equal(stale.status, 'needs_review'); assert.equal(stale.record, null);
    }
  }
  console.log(JSON.stringify(result, null, 2));
}
module.exports = { reviewDecisions };
