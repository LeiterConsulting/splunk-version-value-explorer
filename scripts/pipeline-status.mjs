/* Read-only progress-task diagnostic. No schedule, rerun, PR or publication writes. */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const repository = 'LeiterConsulting/splunk-version-value-explorer';
export function summarize(main, runs) {
  if (!/^[a-f0-9]{40}$/.test(main || '') || !Array.isArray(runs)) throw Error('Exact main commit and workflow runs are required');
  const latest = predicate => runs.filter(predicate).sort((a, b) => b.id - a.id)[0];
  const validation = latest(r => r.path === '.github/workflows/validate.yml' && r.head_sha === main && r.event === 'push' && r.head_branch === 'main');
  const publisher = latest(r => r.path === '.github/workflows/publish-content.yml' && r.head_sha === main);
  const state = r => !r ? 'missing' : r.status !== 'completed' ? 'pending' : r.conclusion;
  return { main, validation: { status: state(validation), runId: validation?.id || null, url: validation?.html_url || null },
    publisher: { status: state(publisher), runId: publisher?.id || null, url: publisher?.html_url || null,
      interpretation: publisher?.conclusion === 'success' ? 'Job passed; inspect its outcome receipt. Staging/already-current can succeed with active delivery off.' : 'Not a successful publisher job.' },
    claimedDelivered: false, delivery: 'unverified', qualification: 'CI conclusions cannot establish Sites deployment, active D1 visitor delivery, source accuracy or live readback.' };
}
async function read(url) {
  const token = process.env.VC_GITHUB_EVIDENCE_TOKEN;
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'VersionCompass-read-only-pipeline-status', ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  if (!response.ok) throw Error('GitHub read unavailable (HTTP ' + response.status + '); stop, preserve the prior checkpoint and report access/rate-limit failure.');
  return response.json();
}
async function main(args) {
  let head, runs;
  if (args.length === 2 && args[0] === '--snapshot') { const snapshot = JSON.parse(fs.readFileSync(args[1])); head = snapshot.main; runs = snapshot.workflow_runs; }
  else if (args.length === 0) {
    const api = 'https://api.github.com/repos/' + repository;
    const [branch, recent] = await Promise.all([read(api + '/git/ref/heads/main'), read(api + '/actions/runs?per_page=100')]);
    head = branch.object.sha; runs = recent.workflow_runs;
  } else throw Error('Usage: node scripts/pipeline-status.mjs [--snapshot <retained-GitHub-response.json>]');
  const result = summarize(head, runs), coverage = require('./lib/automation-coverage.cjs').check();
  const today = new Date().toISOString().slice(0, 10);
  const retained = coverage.runs.map(r => ({ ...r, overdue: JSON.parse(fs.readFileSync(r.file)).coverage.filter(o => o.followUp?.reviewBy < today).map(o => ({ capabilityId: o.capabilityId, ...o.followUp })) }));
  console.log(JSON.stringify({ evaluatedAt: new Date().toISOString(), repository, ...result, coverage: { activation: coverage.activation, runs: retained } }, null, 2));
  if (result.validation.status !== 'success' || result.publisher.status !== 'success') process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
