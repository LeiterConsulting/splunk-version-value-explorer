/* No UI framework migration: embed the verified existing assets in a Worker. */
const fs = require('node:fs'), path = require('node:path');
require('node:child_process').execFileSync(process.execPath, ['scripts/sync-content.cjs', '--check'], { stdio: 'inherit' });
const bundle = JSON.parse(fs.readFileSync('dist/content-bundle.json', 'utf8'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const assets = {};
for (const file of fs.readdirSync('dist').sort()) {
  if (!fs.statSync('dist/' + file).isFile()) continue;
  const type = types[path.extname(file)];
  if (type) assets['/' + file] = { type: type + '; charset=utf-8', body: fs.readFileSync('dist/' + file, 'utf8') };
}
// Keep the established public loader byte-identical until actual browser/export
// verification permits selecting the independently active reader at runtime.
assets['/content-client-active.js'] = { type: 'text/javascript; charset=utf-8', body: fs.readFileSync('client/content-client-active.js', 'utf8') };
fs.mkdirSync('dist/server', { recursive: true });
fs.mkdirSync('dist/.openai', { recursive: true });
const source = 'const seed = ' + JSON.stringify(bundle) + ';\nconst assets = ' + JSON.stringify(assets) + ';\n' + ['content-store.mjs', 'publication-core.mjs', 'publisher.mjs', 'index.mjs'].map(file => fs.readFileSync('worker/' + file, 'utf8')).join('\n') + '\nexport default createWorker(seed, assets);\n';
fs.writeFileSync('dist/server/index.js', source);
fs.copyFileSync('.openai/hosting.json', 'dist/.openai/hosting.json');
console.log('Worker built with ' + Object.keys(assets).length + ' assets and immutable content revision ' + bundle.manifest.revision);
