// The newest dated release note owns publication metadata, never the run date.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const dates = fs.readdirSync(path.join(root, 'docs/releases')).filter(name => /^\d{4}-\d{2}-\d{2}\.md$/.test(name)).map(name => name.slice(0, -3)).sort().reverse();
if (!dates.length) throw new Error('No dated release notes found');
const date = dates[0];
const parsed = new Date(date + 'T12:00:00Z');
if (parsed.toISOString().slice(0, 10) !== date) throw new Error('Invalid release-note date');
const label = value => new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const full = label(date);
const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEPT','OCT','NOV','DEC'];
const compact = `${parsed.getUTCDate()} ${months[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
const url = `https://github.com/LeiterConsulting/splunk-version-value-explorer/blob/main/docs/releases/${date}.md`;
const updates = new Map();
function replace(file, pattern, replacement) {
  const original = updates.get(file) ?? read(file);
  if (!pattern.test(original)) throw new Error(`Missing metadata field: ${file}`);
  updates.set(file, original.replace(pattern, replacement));
}
replace('dist/index.html', /<a class="reviewed"[^>]*>.*?<\/a>/, `<a class="reviewed" href="${url}" aria-label="View the latest Version Compass release notes, site updated ${full}"><span class="reviewed-full">Site updated ${full}</span><time class="reviewed-compact" datetime="${date}" aria-hidden="true">${compact}</time></a>`);
replace('dist/index.html', /(<span id="print-subtitle">)Site updated [^<]+/, `$1Site updated ${full}`);
replace('dist/app.js', /Site updated [A-Za-z]+ \d{1,2}, \d{4} · versioncompass\.com/, `Site updated ${full} · versioncompass.com`);
// Do not advance lifecycle.reviewed: it records a separate policy verification.
replace('dist/guidance-data.js', /(data\.guidance = \{\s*reviewed: ")[^"]+/, `$1${date}`);
const index = read('docs/releases/README.md');
const entries = dates.map(value => index.split('\n').find(line => line.startsWith('- [') && line.includes(`](${value}.md)`)) || `- [${label(value)}](${value}.md)`);
replace('docs/releases/README.md', /## Releases\n[\s\S]*?\n## Recording policy/, `## Releases\n\n${entries.join('\n')}\n\n## Recording policy`);
const stale = [...updates].filter(([file, text]) => read(file) !== text);
if (process.argv.includes('--check')) {
  if (stale.length) { console.error('Release metadata is stale: ' + stale.map(([file]) => file).join(', ') + '. Run node scripts/sync-release-metadata.cjs'); process.exitCode = 1; }
  else console.log(`Release metadata matches ${date}`);
} else {
  for (const [file, text] of stale) fs.writeFileSync(path.join(root, file), text);
  console.log(`Synchronized ${stale.length} files to ${date}`);
}
