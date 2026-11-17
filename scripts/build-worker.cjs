/* No UI framework migration: embed the verified existing assets in a Worker. */
const fs = require('node:fs'), path = require('node:path');
const esbuild = require('esbuild');
if (esbuild.version !== '0.25.12') throw Error('Worker bundler version differs from reviewed pin');
require('node:child_process').execFileSync(process.execPath, ['scripts/sync-content.cjs', '--check'], { stdio: 'inherit' });
const bundle = JSON.parse(fs.readFileSync('dist/content-bundle.json', 'utf8'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const assets = {};
require('./check-ripple.cjs').checkRipple();
for (const file of ['index.html', 'updates.html', 'app.js', 'app.css', 'icon.svg']) {
  assets['/ripple/' + file] = { type: types[path.extname(file)] + '; charset=utf-8', body: fs.readFileSync('dist/ripple/' + file, 'utf8') };
}
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
const source = "import { withExportIntake } from './worker/export-intake-entry.mjs';\n" + 'const seed = ' + JSON.stringify(bundle) + ';\nconst assets = ' + JSON.stringify(assets) + ';\n' + ['publication-core.mjs', 'content-store.mjs', 'publisher.mjs', 'index.mjs'].map(file => fs.readFileSync('worker/' + file, 'utf8').replace(/^import .*publication-core\.mjs';\n/, '')).join('\n') + '\nexport default withExportIntake(createWorker(seed, assets));\n';
// Keep the historical four-module shared lexical scope intact. Imported intake
// modules remain real ESM modules, with esbuild resolving and isolating symbols.
const entryName = 'worker-runtime-entry.mjs';
const expectedInputs = [entryName, 'worker/export-intake-entry.mjs',
  'tools/release-coordination/export-intake-route.mjs',
  'tools/release-coordination/protected-export-intake.mjs',
  'tools/release-coordination/publisher-run-identity.mjs',
  'tools/release-coordination/qualification-artifact.mjs'].sort();
const built = esbuild.buildSync({
  absWorkingDir: process.cwd(), stdin: { contents: source, resolveDir: process.cwd(), sourcefile: entryName, loader: 'js' },
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2022',
  minify: false, treeShaking: false, sourcemap: false, legalComments: 'none', charset: 'utf8',
  tsconfigRaw: {}, metafile: true, write: false, outfile: 'dist/server/index.js', logLevel: 'silent',
});
const actualInputs = Object.keys(built.metafile.inputs).sort();
if (JSON.stringify(actualInputs) !== JSON.stringify(expectedInputs) ||
    Object.values(built.metafile.inputs).some(input => input.imports.some(item => item.external)) ||
    Object.values(built.metafile.outputs).some(output => output.imports.length !== 0) ||
    built.outputFiles.length !== 1 || path.resolve(built.outputFiles[0].path) !== path.resolve('dist/server/index.js')) {
  throw Error('Worker bundle dependency closure differs from reviewed inputs');
}
fs.writeFileSync('dist/server/index.js', built.outputFiles[0].contents);
fs.copyFileSync('.openai/hosting.json', 'dist/.openai/hosting.json');
console.log('Worker built with ' + Object.keys(assets).length + ' assets and immutable content revision ' + bundle.manifest.revision);
