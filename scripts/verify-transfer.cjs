/* Verify original raw bytes before a transferred file may enter a commit. */
const fs = require('node:fs');
const { hash } = require('./maintenance.cjs');
function verify(file, digest, byteLength, format = 'json') {
  if (!['json', 'text', 'bytes'].includes(format)) throw Error('Transfer format must be json, text or bytes');
  if (!/^[a-f0-9]{64}$/.test(digest || '') || !Number.isSafeInteger(byteLength) || byteLength < 0 || (format === 'json' && byteLength === 0)) throw Error('Expected source SHA-256 and valid byte length are required');
  const bytes = fs.readFileSync(file);
  if (bytes.length !== byteLength || hash(bytes) !== digest) throw Error('Transferred bytes differ from the original source manifest: ' + file);
  if (format !== 'bytes') {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (format === 'json') JSON.parse(text);
  }
  return { file, sha256: digest, byteLength, status: format === 'bytes' ? 'raw-bytes-verified' : 'raw-' + format + '-bytes-verified' };
}
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length < 3 || args.length > 4 || (args.length === 4 && !['--text', '--bytes'].includes(args[3]))) throw Error('Usage: node scripts/verify-transfer.cjs <file> <source-sha256> <source-byte-length> [--text|--bytes] (default: strict UTF-8 JSON)');
    console.log(JSON.stringify(verify(args[0], args[1], Number(args[2]), args[3]?.slice(2))));
  }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { verify };
