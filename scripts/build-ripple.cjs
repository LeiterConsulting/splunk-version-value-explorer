/* Regenerate the isolated tool bundle; the main VersionCompass client is unchanged. */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), client = path.join(root, 'tools/ripple');
const args = process.argv.slice(2);
function argument(name, fallback) {
  const index = args.indexOf(name);
  return index < 0 ? fallback : path.resolve(args[index + 1]);
}
const dependencies = argument('--dependencies-root', client);
const localRequire = createRequire(path.join(dependencies, 'package.json'));
const esbuild = args.includes('--esbuild-module') ? require(argument('--esbuild-module')) : localRequire('esbuild');
if (esbuild.version !== '0.28.0') throw Error('Ripple requires the pinned esbuild 0.28.0');
const output = path.join(root, 'dist/ripple');
fs.mkdirSync(output, { recursive: true });
esbuild.buildSync({
  entryPoints: [path.join(client, 'entry.tsx')], outfile: path.join(output, 'app.js'),
  bundle: true, minify: true, platform: 'browser', format: 'esm', target: ['es2022'],
  jsx: 'automatic', nodePaths: [path.join(dependencies, 'node_modules')],
  define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'eof',
});
fs.writeFileSync(path.join(output, 'app.css'), esbuild.transformSync(fs.readFileSync(path.join(client, 'ripple.css'), 'utf8'), { loader: 'css', minify: true }).code);
for (const file of ['index.html', 'icon.svg']) fs.copyFileSync(path.join(client, file), path.join(output, file));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const sourceFiles = ['scripts/build-ripple.cjs', 'tools/ripple/entry.tsx', 'tools/ripple/Ripple.tsx', 'tools/ripple/components/investigations.tsx', 'tools/ripple/ripple.css', 'tools/ripple/index.html', 'tools/ripple/icon.svg', 'tools/ripple/package.json', 'tools/ripple/provenance.json', 'tools/ripple/lib/types.ts', 'tools/ripple/lib/seed.ts', 'tools/ripple/lib/exposure.ts'];
const assetFiles = ['dist/ripple/app.js', 'dist/ripple/app.css', 'dist/ripple/index.html', 'dist/ripple/icon.svg'];
const manifest = { schemaVersion: 1, basePath: '/ripple', sources: Object.fromEntries(sourceFiles.map(file => [file, hash(file)])), assets: Object.fromEntries(assetFiles.map(file => [file, hash(file)])) };
fs.writeFileSync(path.join(client, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Built isolated Ripple assets with source and asset integrity manifest');
