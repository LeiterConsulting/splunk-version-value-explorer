const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { discover, indexes } = require('../scripts/release-archive.cjs');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-archive-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, text = '# Test release\n') => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
  write('docs/releases/README.md', '# Release notes\n\n- [October 6, 2026](2026-10-06.md) — Preserve summary\n');
  write('docs/releases/legacy-dates.json', '["2026-10-06"]\n');
  write('docs/releases/2026-10-06.md');
  write('docs/releases/2026/10/2026-10-07.md');
  write('docs/releases/2027/01/2027-01-01.md');
  return { root, write };
}
test('mixed historical and nested notes sort newest first without duplicate records', t => {
  const { root } = fixture(t); const notes = discover(root);
  assert.deepEqual(notes.map(n => n.date), ['2027-01-01','2026-10-07','2026-10-06']);
  assert.equal(notes[2].file, 'docs/releases/2026-10-06.md'); assert.equal(notes[2].legacy, true);
  assert.equal(notes[0].file, 'docs/releases/2027/01/2027-01-01.md');
});
test('archive is year then month then releases, with working legacy and nested links', t => {
  const { root, write } = fixture(t); const before = fs.readFileSync(path.join(root, 'docs/releases/2026-10-06.md'), 'utf8');
  const generated = indexes(root); for (const [file, body] of generated) write(file, body);
  assert.match(generated.get('docs/releases/README.md'), /\[2027\]\(2027\/README\.md\)/);
  assert.match(generated.get('docs/releases/2026/README.md'), /\[October\]\(10\/README\.md\)/);
  const month = generated.get('docs/releases/2026/10/README.md');
  assert.match(month, /\[October 7, 2026\]\(2026-10-07\.md\)/);
  assert.match(month, /\[October 6, 2026\]\(\.\.\/\.\.\/2026-10-06\.md\) — Preserve summary/);
  for (const [file, body] of generated) for (const match of body.matchAll(/\]\(([^)]+)\)/g)) assert(fs.existsSync(path.resolve(root, path.dirname(file), match[1])), `${file}: ${match[1]}`);
  assert.equal(fs.readFileSync(path.join(root, 'docs/releases/2026-10-06.md'), 'utf8'), before);
  assert.deepEqual([...indexes(root)], [...generated], 'regeneration must be idempotent and retain summaries');
});
test('new dates cannot grow the legacy flat folder', t => {
  const { root, write } = fixture(t); write('docs/releases/2026-10-08.md'); assert.throws(() => discover(root), /New release notes belong/);
});
test('duplicate dates fail instead of silently shadowing a historical record', t => {
  const { root, write } = fixture(t); write('docs/releases/2026/10/2026-10-06.md'); assert.throws(() => discover(root), /Duplicate release-note date/);
});
test('invalid calendar dates and wrong month placement fail', t => {
  const { root, write } = fixture(t); write('docs/releases/2026/02/2026-02-30.md'); assert.throws(() => discover(root), /Invalid release-note date/);
  fs.rmSync(path.join(root, 'docs/releases/2026/02/2026-02-30.md')); write('docs/releases/2026/11/2026-10-08.md'); assert.throws(() => discover(root), /must match its year\/month/);
});
test('the generator produces a nested latest-note URL and detects stale month indexes', t => {
  const { root, write } = fixture(t);
  for (const file of ['release-archive.cjs','sync-release-metadata.cjs']) write('scripts/' + file, fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'));
  write('dist/index.html', '<a class="reviewed" href="old">Old</a><span id="print-subtitle">Site updated October 6, 2026</span>');
  write('dist/app.js', 'Site updated October 6, 2026 · versioncompass.com');
  write('dist/guidance-data.js', 'data.guidance = { reviewed: "2026-10-06", lifecycle: { reviewed: "2026-09-01" } };');
  const exec = require('node:child_process').execFileSync;
  exec(process.execPath, [path.join(root,'scripts/sync-release-metadata.cjs')]);
  exec(process.execPath, [path.join(root,'scripts/sync-release-metadata.cjs'),'--check']);
  assert.match(fs.readFileSync(path.join(root,'dist/index.html'),'utf8'), /docs\/releases\/2027\/01\/2027-01-01\.md/);
  assert.match(fs.readFileSync(path.join(root,'dist/guidance-data.js'),'utf8'), /lifecycle: \{ reviewed: "2026-09-01"/);
  write('docs/releases/2027/01/README.md', 'stale');
  assert.throws(() => exec(process.execPath, [path.join(root,'scripts/sync-release-metadata.cjs'),'--check'], { stdio: 'pipe' }));
});
test('content revision uses the nested latest date without confusing it with a factual verification date', t => {
  const { root, write } = fixture(t);
  for (const file of ['release-archive.cjs','sync-content-revision.cjs']) write('scripts/' + file, fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'));
  write('dist/example.js', 'window.example = {};\n');
  const exec = require('node:child_process').execFileSync;
  exec(process.execPath, [path.join(root,'scripts/sync-content-revision.cjs')], { cwd: root });
  exec(process.execPath, [path.join(root,'scripts/sync-content-revision.cjs'),'--check'], { cwd: root });
  const revision = fs.readFileSync(path.join(root,'dist/content-revision.js'),'utf8');
  assert.match(revision, /"publication":"2027-01-01"/);
});
