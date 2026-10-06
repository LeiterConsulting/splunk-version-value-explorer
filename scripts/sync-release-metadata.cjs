// The newest dated release note owns publication metadata, never the run date.
const fs = require('node:fs');
const path = require('node:path');
const { discover, indexes, label } = require('./release-archive.cjs');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const notes = discover(root);
const { date, file: noteFile } = notes[0];
const parsed = new Date(date + 'T12:00:00Z');
const full = label(date);
const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEPT','OCT','NOV','DEC'];
const compact = `${parsed.getUTCDate()} ${months[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
const url = `https://github.com/LeiterConsulting/splunk-version-value-explorer/blob/main/${noteFile}`;
const updates = indexes(root, notes);
function replace(file, pattern, replacement) {
  const original = updates.get(file) ?? read(file);
  if (!pattern.test(original)) throw new Error(`Missing metadata field: ${file}`);
  updates.set(file, original.replace(pattern, replacement));
}
replace('dist/index.html', /<a class="reviewed"[^>]*>.*?<\/a>/, `<a class="reviewed" href="${url}" aria-label="View the latest Version Compass release notes, site updated ${full}"><span class="reviewed-full">Site updated ${full}</span><time class="reviewed-compact" datetime="${date}" aria-hidden="true">${compact}</time></a>`);
replace('dist/index.html', /(<span id="print-subtitle">)Site updated [^<]+/, `$1Site updated ${full}`);
replace('dist/app.js', /Site updated [A-Za-z]+ \d{1,2}, \d{4} · versioncompass\.com/, `Site updated ${full} · versioncompass.com`);
// Do not advance lifecycle.reviewed: it records a separate policy verification.
if (fs.existsSync(path.join(root, 'content/datasets/guidance.json'))) {
  replace('content/datasets/guidance.json', /("reviewed": ")[^"]+/, `$1${date}`);
  replace('dist/guidance-data.js', /("reviewed": ")[^"]+/, `$1${date}`);
} else {
  replace('dist/guidance-data.js', /(data\.guidance = \{\s*reviewed: ")[^"]+/, `$1${date}`);
}
const stale = [...updates].filter(([file, text]) => !fs.existsSync(path.join(root, file)) || read(file) !== text);
if (process.argv.includes('--check')) {
  if (stale.length) { console.error('Release metadata is stale: ' + stale.map(([file]) => file).join(', ') + '. Run node scripts/sync-release-metadata.cjs'); process.exitCode = 1; }
  else console.log(`Release metadata matches ${date} (${noteFile})`);
} else {
  for (const [file, text] of stale) { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); }
  console.log(`Synchronized ${stale.length} files to ${date}`);
}
