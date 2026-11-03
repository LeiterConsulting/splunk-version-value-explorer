/* One local preparation path. Never publishes, admits claims, refreshes dates or pins. */
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const generators = ['sync-advisor', 'sync-release-metadata', 'sync-content', 'sync-source-register', 'sync-content-revision', 'sync-issue-feed'];
const checks = ['sync-release-metadata', 'sync-source-register', 'sync-content-revision', 'sync-content', 'sync-advisor', 'advisor-maintenance', 'sync-issue-feed', 'check-native-issue-feed', 'check-automation-coverage'];
const command = (id, check = false) => [process.execPath, 'scripts/' + id + '.cjs', ...(check && !id.startsWith('check-') ? ['--check'] : [])];
function files(root) {
  return [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root }).toString().split('\0').filter(Boolean))].sort();
}
function inputManifest(root = process.cwd()) {
  return files(root).map(file => {
    const full = path.join(root, file);
    if (!fs.existsSync(full) || !fs.lstatSync(full).isFile()) throw Error('Missing/non-regular input: ' + file);
    const bytes = fs.readFileSync(full);
    if (file.endsWith('.json')) {
      try { JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
      catch { throw Error('Invalid UTF-8 JSON input: ' + file + '; retrieve exact bytes, never tool-display text.'); }
    }
    return { file, byteLength: bytes.length, sha256: hash(bytes) };
  });
}
function run(commands, root) {
  for (const [program, ...args] of commands) {
    const result = spawnSync(program, args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    if (result.error || result.status !== 0) throw Error('Preparation failed: ' + args.join(' ') + '\n' + (result.stderr || result.stdout || result.error?.message));
  }
}
function regenerate(root = process.cwd(), commands = generators.map(id => command(id)).concat(checks.map(id => command(id, true)))) {
  const before = inputManifest(root), head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-prepare-'));
  try {
    execFileSync('git', ['clone', '--quiet', '--shared', root, staging], { stdio: 'pipe' });
    for (const { file } of before) { const target = path.join(staging, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(root, file), target); }
    // Reflect working-tree deletions, rather than resurrecting the cloned file.
    for (const file of files(staging)) if (!fs.existsSync(path.join(root, file))) fs.rmSync(path.join(staging, file));
    run(commands, staging);
    const after = inputManifest(staging), previous = new Map(before.map(f => [f.file, f]));
    const changed = after.filter(f => previous.get(f.file)?.sha256 !== f.sha256);
    if (JSON.stringify(inputManifest(root)) !== JSON.stringify(before) || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() !== head) throw Error('Source changed during preparation; reconcile and retry. No generated files applied.');
    const restored = [];
    try {
      for (const { file } of changed) {
        const target = path.join(root, file), temp = target + '.vc-preparing';
        restored.push({ target, bytes: fs.existsSync(target) ? fs.readFileSync(target) : null });
        fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(path.join(staging, file), temp); fs.renameSync(temp, target);
      }
    } catch (error) {
      for (const { target, bytes } of restored.reverse()) { if (bytes) fs.writeFileSync(target, bytes); else fs.rmSync(target, { force: true }); fs.rmSync(target + '.vc-preparing', { force: true }); }
      throw error;
    }
    return { status: 'prepared-not-committed', head, generated: changed, qualification: 'Generators/checks passed in isolation. Tests/build and exact-candidate exports remain required.' };
  } finally { fs.rmSync(staging, { recursive: true, force: true }); }
}
function main(args) {
  if (args.length !== 1 || !['--sync', '--check', '--verify', '--manifest'].includes(args[0])) throw Error('Usage: node scripts/maintenance.cjs --sync|--check|--verify|--manifest');
  if (args[0] === '--sync') return regenerate();
  const inputs = inputManifest();
  if (args[0] === '--manifest') return { inputs };
  run(checks.map(id => command(id, true)), process.cwd());
  if (args[0] === '--verify') run([[process.execPath, '--test', ...files(process.cwd()).filter(f => /^tests\/[^/]+\.test\.cjs$/.test(f))], command('build-worker')], process.cwd());
  return { status: args[0] === '--verify' ? 'local-validation-passed' : 'structural-checks-passed', inputCount: inputs.length, qualification: 'Does not verify upstream claims, rendered exports, repository integration or live delivery.' };
}
if (require.main === module) { try { console.log(JSON.stringify(main(process.argv.slice(2)), null, 2)); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { inputManifest, regenerate, checks, generators, hash };
