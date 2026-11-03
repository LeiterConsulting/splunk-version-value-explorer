/* Verify original raw bytes before a transferred JSON file may enter a commit. */
const fs = require('node:fs');
const { hash } = require('./maintenance.cjs');
function verify(file, digest, byteLength) {
  if (!/^[a-f0-9]{64}$/.test(digest || '') || !Number.isSafeInteger(byteLength) || byteLength < 1) throw Error('Expected source SHA-256 and positive byte length are required');
  const bytes = fs.readFileSync(file);
  if (bytes.length !== byteLength || hash(bytes) !== digest) throw Error('Transferred bytes differ from the original source manifest: ' + file);
  JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  return { file, sha256: digest, byteLength, status: 'raw-json-bytes-verified' };
}
if (require.main === module) {
  try { const args = process.argv.slice(2); if (args.length !== 3) throw Error('Usage: node scripts/verify-transfer.cjs <json-file> <source-sha256> <source-byte-length>'); console.log(JSON.stringify(verify(args[0], args[1], Number(args[2])))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { verify };
