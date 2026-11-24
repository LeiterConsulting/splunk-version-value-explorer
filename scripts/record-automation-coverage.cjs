/* Record explicit reviewer input; no retrieval, assessment or activation is inferred. */
const fs = require('node:fs');
const native = require('./lib/native-issue-feed.cjs');
const coverage = require('./lib/automation-coverage.cjs');
try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--paths') {
    console.log(JSON.stringify(coverage.receiptPaths(JSON.parse(fs.readFileSync(0,'utf8')))));
    return;
  }
  if (args[0] !== '--run' || !/^docs\/audits\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+-coverage\.json$/.test(args[1] || '')) throw Error('Usage: record-automation-coverage.cjs --run docs/audits/DATE-ID-coverage.json [--audit FILE ...]; explicit run JSON on stdin');
  const registry = JSON.parse(fs.readFileSync('content/automation-coverage.json', 'utf8'));
  const participatingWatches = new Set(registry.capabilities.flatMap(capability => capability.participatingWatches));
  const audits = [];
  for (let i = 2; i < args.length; i += 2) {
    if (args[i] !== '--audit' || !participatingWatches.has(native.watchFor(args[i + 1]))) throw Error('Select an exact participating watch audit');
    audits.push({ file: args[i + 1], value: JSON.parse(fs.readFileSync(args[i + 1], 'utf8')) });
  }
  const run = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (fs.existsSync(args[1])) coverage.preserveReceiptIdentity(JSON.parse(fs.readFileSync(args[1],'utf8')),run,args[1]);
  if (audits.length && run.registryVersion !== registry.registryVersion) throw Error('New watch audit bindings require the current coverage registry');
  run.recordedAt = new Date().toISOString();
  run.auditBindings = audits.map(a => ({ file: a.file, reviewDigest: native.reviewDigest(a.value) }));
  if (audits.some(a => native.watchFor(a.file) !== run.watchId ||
      (run.kind !== 'saved-task-execution' && !coverage.editorialReplay(run, a.value)))) {
    throw Error('Watch audit requires its actual saved-task execution or an explicitly uncredited editorial replay');
  }
  coverage.validateTaskOwner(run);
  if (run.execution?.schedulerRunId) {
    const owners = new Map();
    for (const file of fs.readdirSync('docs/audits').filter(name => name.endsWith('-coverage.json'))) {
      coverage.bindSchedulerAttempt(owners, JSON.parse(fs.readFileSync('docs/audits/' + file, 'utf8')));
    }
    coverage.bindSchedulerAttempt(owners, run);
  }
  for (const audit of audits) coverage.validateBoundExecution(run, audit.value);
  run.reviewDigest = coverage.reviewDigest(run);
  const result = coverage.validateRun(run, registry);
  fs.writeFileSync(args[1], JSON.stringify(run, null, 2) + '\n');
  for (const a of audits) {
    a.value.automationCoverage = { runFile: args[1] };
    fs.writeFileSync(a.file, JSON.stringify(a.value, null, 2) + '\n');
  }
  console.log(JSON.stringify(result));
} catch (error) { console.error(error.message); process.exitCode = 1; }
