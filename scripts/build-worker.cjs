/* No UI framework migration: embed the verified existing assets in a Worker. */
const fs = require('node:fs'), path = require('node:path');
const esbuild = require('esbuild');
if (esbuild.version !== '0.25.12') throw Error('Worker bundler version differs from reviewed pin');
async function buildWorker() {
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
// Preserve historical cross-file globals and named exports inside one generated
// legacy ESM module. Only the outer host entry is exported to workerd.
const coreSource = 'const seed = ' + JSON.stringify(bundle) + ';\nconst assets = ' + JSON.stringify(assets) + ';\n' + ['publication-core.mjs', 'content-store.mjs', 'publisher.mjs', 'index.mjs'].map(file => fs.readFileSync('worker/' + file, 'utf8').replace(/^import .*publication-core\.mjs';\n/, '')).join('\n') + '\nexport default createWorker(seed, assets);\n';
const source = "import core from 'versioncompass:legacy-core';\nimport { withExportIntake } from './worker/export-intake-entry.mjs';\nexport default withExportIntake(core);\n";
const entryName = 'worker-runtime-entry.mjs';
const expectedInputs = [entryName, 'vc-legacy:core', 'worker/export-intake-entry.mjs',
  'tools/release-coordination/export-intake-route.mjs',
  'tools/release-coordination/protected-export-intake.mjs',
  'tools/release-coordination/publisher-run-identity.mjs',
  'tools/release-coordination/qualification-artifact.mjs'].sort();
const built = await esbuild.build({
  absWorkingDir: process.cwd(), stdin: { contents: source, resolveDir: process.cwd(), sourcefile: entryName, loader: 'js' },
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2022',
  minify: false, treeShaking: false, sourcemap: false, legalComments: 'none', charset: 'utf8',
  tsconfigRaw: {}, metafile: true, write: false, outfile: 'dist/server/index.js', logLevel: 'silent',
  plugins: [{ name: 'versioncompass-legacy-core', setup(build) {
    build.onResolve({ filter: /^versioncompass:/ }, args => {
      if (args.path !== 'versioncompass:legacy-core' || args.namespace !== 'file' ||
          args.importer !== path.resolve(entryName) || args.kind !== 'import-statement') {
        return { errors: [{ text: 'Unexpected virtual Worker module request' }] };
      }
      return { path: 'core', namespace: 'vc-legacy' };
    });
    build.onResolve({ filter: /.*/, namespace: 'vc-legacy' }, () => ({ errors: [{ text: 'Legacy core must not acquire new imports' }] }));
    build.onLoad({ filter: /^core$/, namespace: 'vc-legacy' }, () => ({ contents: coreSource, loader: 'js' }));
  } }],
});
const actualInputs = Object.keys(built.metafile.inputs).sort();
if (JSON.stringify(actualInputs) !== JSON.stringify(expectedInputs) ||
    Object.values(built.metafile.inputs).some(input => input.imports.some(item => item.external)) ||
    Object.values(built.metafile.outputs).some(output => output.imports.length !== 0 || JSON.stringify(output.exports) !== JSON.stringify(['default'])) ||
    built.outputFiles.length !== 1 || path.resolve(built.outputFiles[0].path) !== path.resolve('dist/server/index.js')) {
  throw Error('Worker bundle dependency closure differs from reviewed inputs');
}
fs.writeFileSync('dist/server/index.js', built.outputFiles[0].contents);
fs.copyFileSync('.openai/hosting.json', 'dist/.openai/hosting.json');
console.log('Worker built with ' + Object.keys(assets).length + ' assets and immutable content revision ' + bundle.manifest.revision);

}
buildWorker().catch(error => { console.error(error.message); process.exitCode = 1; });
