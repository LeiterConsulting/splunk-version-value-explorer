const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
function checkRipple() {
  const root = path.resolve(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools/ripple/build-manifest.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.basePath !== '/ripple') throw Error('Unsupported Ripple asset manifest');
  for (const [file, expected] of Object.entries({ ...manifest.sources, ...manifest.assets })) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
    if (actual !== expected) throw Error('Ripple source or asset changed; rebuild: ' + file);
  }
  return manifest;
}
module.exports = { checkRipple };
if (require.main === module) { checkRipple(); console.log('Ripple source and bundled asset hashes match'); }
