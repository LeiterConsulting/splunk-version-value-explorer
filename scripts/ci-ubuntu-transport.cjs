/* Ephemeral GitHub Ubuntu runner transport only. No trust or suite changes. */
const fs = require('node:fs');
const path = require('node:path');
const mirrors = new Set([
  'mirror+file:/etc/apt/apt-mirrors.txt',
  'mirror+file:/etc/apt/apt-mirrors-security.txt',
  'http://azure.archive.ubuntu.com/ubuntu',
  'https://azure.archive.ubuntu.com/ubuntu',
]);
const recognized = uri => mirrors.has(uri.replace(/\/$/, ''));
function target(suites) {
  return suites.length && suites.every(s => s.endsWith('-security'))
    ? 'https://security.ubuntu.com/ubuntu' : 'https://archive.ubuntu.com/ubuntu';
}
function transform(text, format) {
  if (format === '.list') return text.replace(/^(\s*deb(?:-src)?\s+(?:\[[^\]\n]*\]\s+)?)(\S+)(\s+)(\S+)([^\n]*)$/gm,
    (line, prefix, uri, space, suite, rest) => recognized(uri) ? prefix + target([suite]) + space + suite + rest : line);
  if (format !== '.sources') throw Error('Unsupported source format');
  return text.split(/(\r?\n\s*\r?\n)/).map(stanza => {
    const suites = stanza.match(/^Suites:[ \t]*([^\r\n]*)/m)?.[1].trim().split(/\s+/).filter(Boolean);
    if (!suites?.length || /^(?:URIs|Suites):[^\n]*\n[ \t]/m.test(stanza)) return stanza;
    // Leave multiline or mixed URI fields unchanged instead of guessing scope.
    return stanza.replace(/^URIs:([ \t]*)([^\r\n]*)(\r?\n|$)(?![ \t])/gm, (line, space, field, newline) => {
      const uris = field.trim().split(/\s+/);
      if (!uris.length || !uris.every(recognized)) return line;
      return 'URIs:' + space + target(suites) + newline;
    });
  }).join('');
}
function apply() {
  if (process.env.GITHUB_ACTIONS !== 'true' || !/^ID=ubuntu$/m.test(fs.readFileSync('/etc/os-release', 'utf8')))
    throw Error('Only an ephemeral GitHub Ubuntu runner is supported');
  const directory = '/etc/apt/sources.list.d';
  const files = ['/etc/apt/sources.list', ...fs.readdirSync(directory).filter(n => /^[A-Za-z0-9_.-]+\.(?:list|sources)$/.test(n)).map(n => path.join(directory, n))];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    if (!fs.lstatSync(file).isFile()) throw Error('Source must be a regular file');
    const before = fs.readFileSync(file, 'utf8'), after = transform(before, path.extname(file));
    if (after !== before) fs.writeFileSync(file, after);
  }
  // Apt (including Playwright's dependency installer) shares bounded transport
  // settings. Authentication, signature checks and package selection stay intact.
  const config = '/etc/apt/apt.conf.d/99versioncompass-ci-transport';
  if (fs.existsSync(config)) throw Error('Transport configuration already exists');
  fs.writeFileSync(config, 'Acquire::Retries "2";\nAcquire::http::Timeout "20";\nAcquire::https::Timeout "20";\n', { flag: 'wx' });
}
module.exports = { transform };
if (require.main === module) {
  if (process.argv.length !== 3 || process.argv[2] !== '--apply') throw Error('Usage: ci-ubuntu-transport.cjs --apply');
  apply();
}
