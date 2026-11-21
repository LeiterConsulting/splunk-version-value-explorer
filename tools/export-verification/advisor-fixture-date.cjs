// Reproduce the admitted decision snapshot without changing the visitor's clock.
const guidance = require('../../content/datasets/guidance.json');
const decisions = require('../../content/advisor-goals.json').goals;
const admission = require('../../content/advisor-admission.json');
const byId = new Map(admission.claims.map(claim => [claim.id, claim]));
const capabilities = new Map(guidance.aiAvailability.capabilities.map(row => [row.id, row]));
const dates = [];
for (const goal of decisions) {
  dates.push(capabilities.get(goal.record).verified);
  for (const id of admission.goals[goal.admission]) {
    for (const sourceId of byId.get(id).sources) {
      const source = guidance.sources[sourceId];
      dates.push(source.checked, source.reviewed);
    }
  }
}
if (dates.some(day => !/^\d{4}-\d{2}-\d{2}$/.test(day))) throw Error('Undated Advisor fixture evidence');
module.exports = dates.sort().at(-1) + 'T18:00:00.000Z';
