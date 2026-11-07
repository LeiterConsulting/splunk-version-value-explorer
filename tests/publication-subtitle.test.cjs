const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('dist/app.js', 'utf8');
// Exercise the actual summary renderer and its initialization, not a copy of it.
const capture = app.match(/  const publicationSubtitle = [^\n]+;/)[0];
const renderer = app.slice(app.indexOf('  function updateReportSummary() {'), app.indexOf('  function syncControls() {'));
for (const date of ['January 1, 2027', 'February 29, 2028']) {
  test('report rerenders retain the generated HTML publication date: ' + date, () => {
    const subtitle = { textContent: 'Site updated ' + date };
    const title = { textContent: '' };
    const context = { printSubtitle: subtitle, printTitle: title, document: {},
      state: { platform: 'enterprise', from: '9.4', to: '10.4' },
      data: { enterprise: { label: 'Splunk Enterprise' } },
      isMigration: () => false, isCore: () => true };
    vm.createContext(context);
    vm.runInContext(capture + renderer + '\nupdateReportSummary();', context);
    assert.equal(subtitle.textContent, 'Site updated ' + date + ' · versioncompass.com');
    context.state.to = '10.6';
    vm.runInContext('updateReportSummary(); updateReportSummary();', context);
    assert.equal(subtitle.textContent, 'Site updated ' + date + ' · versioncompass.com');
    assert.equal(title.textContent, 'Splunk Enterprise 9.4 → 10.6');
  });
}
test('static publication fallback is present before the app loads', () => {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  const badge = html.match(/class="reviewed-full">([^<]+)</)[1];
  const subtitle = html.match(/id="print-subtitle">([^<]+)</)[1];
  assert.equal(subtitle, badge);
  const revision = {};
  vm.runInNewContext(fs.readFileSync('dist/content-revision.js', 'utf8'), { window: revision });
  assert.match(html, new RegExp('datetime="' + revision.VersionCompassRevision.publication + '"'));
});
test('a publication date advances content identity without changing engine bytes', t => {
  const path = require('node:path'), os = require('node:os');
  const { execFileSync } = require('node:child_process');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-publication-date-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const dir of ['scripts', 'dist', 'content/datasets', 'worker', 'client', 'docs/releases']) {
    fs.mkdirSync(path.dirname(path.join(root, dir)), { recursive: true });
    fs.cpSync(dir, path.join(root, dir), { recursive: true });
  }
  const run = script => execFileSync(process.execPath, ['scripts/' + script + '.cjs'], { cwd: root, stdio: 'pipe' });
  const manifest = () => JSON.parse(fs.readFileSync(path.join(root, 'content/publication.json'), 'utf8'));
  run('sync-release-metadata'); run('sync-content'); run('sync-content-revision');
  const before = manifest();
  const code = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
  const revision = fs.readFileSync(path.join(root, 'dist/content-revision.js'), 'utf8');
  const latest = require('../scripts/release-archive.cjs').discover(root)[0].date;
  const date = new Date(latest + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + 1);
  const next = date.toISOString().slice(0, 10);
  const note = path.join(root, 'docs/releases', next.slice(0, 4), next.slice(5, 7), next + '.md');
  fs.mkdirSync(path.dirname(note), { recursive: true }); fs.writeFileSync(note, '# Synthetic publication-only test\n');
  run('sync-release-metadata'); run('sync-content'); run('sync-content-revision');
  const after = manifest();
  assert.equal(fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8'), code);
  assert.equal(after.engineRevision, before.engineRevision);
  assert.notEqual(after.revision, before.revision);
  assert.notEqual(after.digest, before.digest);
  assert.notEqual(fs.readFileSync(path.join(root, 'dist/content-revision.js'), 'utf8'), revision);
  assert.match(fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8'), new RegExp('datetime="' + next + '"'));
  fs.appendFileSync(path.join(root, 'dist/app.js'), '\n// Engine fingerprint sensitivity test.\n');
  run('sync-content');
  assert.notEqual(manifest().engineRevision, after.engineRevision, 'even nonbehavioral executable-file bytes remain fingerprinted');
});
