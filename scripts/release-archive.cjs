/* One date, one source file. Historical URLs are kept; new notes use YYYY/MM. */
const fs = require('node:fs');
const path = require('node:path');
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const label = date => new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
function validDate(date) {
  if (!DATE.test(date)) return false;
  const parsed = new Date(date + 'T12:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
function discover(root) {
  const directory = path.join(root, 'docs/releases');
  const manifest = path.join(directory, 'legacy-dates.json');
  const allowed = fs.existsSync(manifest) ? new Set(JSON.parse(fs.readFileSync(manifest, 'utf8'))) : null;
  const notes = new Map();
  function walk(relative = '') {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('Release archive must not contain symlinks: ' + entry.name);
      const file = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) { walk(file); continue; }
      if (!/^\d{4}-\d{2}-\d{2}\.md$/.test(entry.name)) continue;
      const date = entry.name.slice(0, -3);
      if (!validDate(date)) throw new Error('Invalid release-note date: ' + file);
      const canonical = `${date.slice(0, 4)}/${date.slice(5, 7)}/${entry.name}`;
      if (relative && file !== canonical) throw new Error('Release note must match its year/month: ' + file);
      if (!relative && allowed && !allowed.has(date)) throw new Error(`New release notes belong at docs/releases/${canonical}`);
      if (notes.has(date)) throw new Error('Duplicate release-note date: ' + date);
      notes.set(date, { date, file: 'docs/releases/' + file, legacy: !relative });
    }
  }
  walk();
  if (!notes.size) throw new Error('No dated release notes found');
  return [...notes.values()].sort((a, b) => b.date.localeCompare(a.date));
}
function indexes(root, notes = discover(root)) {
  const suffixes = new Map();
  function readSummaries(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) readSummaries(path.join(directory, entry.name));
      else if (entry.name === 'README.md') {
        for (const line of fs.readFileSync(path.join(directory, entry.name), 'utf8').split('\n')) {
          const match = line.match(/^- \[[^\]]+\]\((?:[^)]*\/)?(\d{4}-\d{2}-\d{2})\.md\)(.*)$/);
          if (match && match[2]) suffixes.set(match[1], match[2]);
        }
      }
    }
  }
  readSummaries(path.join(root, 'docs/releases'));
  const output = new Map();
  const years = [...new Set(notes.map(note => note.date.slice(0, 4)))];
  const rootText = `# Release notes\n\nRepository-only release history for Version Compass. Browse by year, then month. Historical records begin September 16, 2026.\n\n## Releases\n\n${years.map(year => `- [${year}](${year}/README.md)`).join('\n')}\n\n## Recording policy\n\n- New notes use \`docs/releases/YYYY/MM/YYYY-MM-DD.md\`, dated in \`America/New_York\`.\n- Keep one authoritative note per date; append same-day changes to the note returned by \`scripts/release-archive.cjs\`, including an existing legacy note.\n- Previously published flat files are retained at their original URLs, with their headings and relative links intact. They are listed in \`legacy-dates.json\`; do not add new flat dates or create duplicate copies. Year/month indexes include these historical notes.\n- Record material repository or live-site changes and concise published maintenance outcomes. Outcome-only entries must not advance factual review dates, lifecycle dates, or content-change cycles.\n- Summarize user-visible behavior, compatibility or risk implications, authoritative evidence, validation and actual publication state.\n- Keep release history in the repository, not in the comparison interface.\n- Run \`node scripts/sync-release-metadata.cjs\`, then its \`--check\` gate. The generator discovers both layouts, keeps the latest-note link accurate, and maintains every year/month index. It fails on duplicate dates, invalid dates, misplaced notes and new flat files.\n`;
  output.set('docs/releases/README.md', rootText);
  for (const year of years) {
    const months = [...new Set(notes.filter(note => note.date.startsWith(year + '-')).map(note => note.date.slice(5, 7)))];
    output.set(`docs/releases/${year}/README.md`, `# ${year} releases\n\n[All years](../README.md)\n\n${months.map(month => `- [${new Date(`${year}-${month}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })}](${month}/README.md)`).join('\n')}\n`);
    for (const month of months) {
      const parent = `docs/releases/${year}/${month}`;
      const monthLabel = new Date(`${year}-${month}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      const entries = notes.filter(note => note.date.startsWith(`${year}-${month}-`)).map(note => `- [${label(note.date)}](${path.posix.relative(parent, note.file)})${suffixes.get(note.date) || ''}`);
      output.set(`${parent}/README.md`, `# ${monthLabel} releases\n\n[${year}](../README.md) · [All years](../../README.md)\n\n${entries.join('\n')}\n`);
    }
  }
  return output;
}
module.exports = { discover, indexes, label, validDate };
