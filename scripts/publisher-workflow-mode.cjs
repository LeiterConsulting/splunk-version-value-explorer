/* Route manual observations before invoking any publication selector or writer. */
const fs = require('node:fs');
function workflowMode(eventName, event) {
  if (eventName === 'workflow_run') return 'held';
  if (eventName !== 'workflow_dispatch' || !['publish', 'observe-only', 'head-only', 'bootstrap-only', 'resume-only', 'stage-only', 'current-head-only'].includes(event?.inputs?.mode)) throw Error('Invalid publisher workflow mode');
  return event.inputs.mode === 'publish' ? 'held' : event.inputs.mode;
}
if (require.main === module) {
  try {
    const mode = workflowMode(process.env.GITHUB_EVENT_NAME, JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')));
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'mode=' + mode + '\n');
  } catch {
    // Never echo event inputs, parsing errors or environment values.
    console.error('Publisher mode rejected; no selector or publisher request attempted.');
    process.exitCode = 1;
  }
}
module.exports = { workflowMode };
