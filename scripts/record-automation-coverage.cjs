/* Record explicit reviewer input; no retrieval, assessment or activation is inferred. */
const fs = require('node:fs');
const native = require('./lib/native-issue-feed.cjs');
const coverage = require('./lib/automation-coverage.cjs');
try {
  const args = process.argv.slice(2);
  if (args[0] !== '--run' || !/^docs\/audits\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+-coverage\.json$/.test(args[1] || '')) throw Error('Usage: record-automation-coverage.cjs --run docs/audits/DATE-ID-coverage.json [--audit FILE ...]; explicit run JSON on stdin');
  const audits = [];
  for (let i = 2; i < args.length; i += 2) {
    if (args[i] !== '--audit' || !['version-release-watch', 'version-guidance-audit'].includes(native.watchFor(args[i + 1]))) throw Error('Select an exact participating watch audit');
    audits.push({ file: args[i + 1], value: JSON.parse(fs.readFileSync(args[i + 1], 'utf8')) });
  }
  const run = JSON.parse(fs.readFileSync(0, 'utf8'));
  run.recordedAt = new Date().toISOString();
  run.auditBindings = audits.map(a => ({ file: a.file, reviewDigest: native.reviewDigest(a.value) }));
  if (audits.length && (run.kind !== 'saved-task-execution' || audits.some(a => native.watchFor(a.file) !== run.watchId))) throw Error('Changed watch audits require their actual saved-task execution');
  run.reviewDigest = coverage.reviewDigest(run);
  const result = coverage.validateRun(run, JSON.parse(fs.readFileSync('content/automation-coverage.json', 'utf8')));
  fs.writeFileSync(args[1], JSON.stringify(run, null, 2) + '\n');
  for (const a of audits) {
    a.value.automationCoverage = { runFile: args[1] };
    fs.writeFileSync(a.file, JSON.stringify(a.value, null, 2) + '\n');
  }
  console.log(JSON.stringify(result));
} catch (error) { console.error(error.message); process.exitCode = 1; }
