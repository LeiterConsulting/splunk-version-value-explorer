/* Preserve the existing OIDC SHA scope: a superseded trigger cannot publish a newer main. */
const fs = require('node:fs');
const repository = 'LeiterConsulting/splunk-version-value-explorer';
function select(eventName, event, workflowSha) {
  if (!/^[a-f0-9]{40}$/.test(workflowSha || '')) throw Error('Invalid workflow commit');
  if (eventName === 'workflow_dispatch') return { commit: workflowSha, publish: true, status: 'candidate-selected' };
  const run = event.workflow_run;
  if (eventName !== 'workflow_run' || run?.conclusion !== 'success' || run.status !== 'completed' || run.event !== 'push' || run.head_branch !== 'main' || run.path !== '.github/workflows/validate.yml' || run.repository?.full_name !== repository || run.head_repository?.full_name !== repository || !/^[a-f0-9]{40}$/.test(run.head_sha || '')) throw Error('Untrusted or unsuccessful validation trigger');
  return { commit: run.head_sha, validationRun: run.id, publish: run.head_sha === workflowSha, status: run.head_sha === workflowSha ? 'candidate-selected' : 'superseded-trigger-not-published' };
}
if (require.main === module) {
  try {
    const result = select(process.env.GITHUB_EVENT_NAME, JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH)), process.env.GITHUB_SHA);
    fs.writeFileSync('publication-outcome.json', JSON.stringify({ ...result, recordedAt: new Date().toISOString(), claimedDelivered: false }, null, 2) + '\n');
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'commit=' + result.commit + '\npublish=' + result.publish + '\n');
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, 'Publication selection: **' + result.status + '**\n\nValidated candidate: `' + result.commit + '`\n\n' + (result.publish ? 'Publisher verification remains required.' : 'Newer main exists. This run performs no publisher request; its own successful validation must trigger delivery. This is not a delivery receipt.') + '\n');
    console.log(JSON.stringify(result));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { select };
