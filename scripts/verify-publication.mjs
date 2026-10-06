/* Read-only candidate preflight. Does not stage, activate, deploy or send credentials. */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REPOSITORY, verifyRepositoryPublication } from '../worker/publication-core.mjs';
try {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--commit' || args[2] !== '--engine' || !/^[a-f0-9]{40}$/.test(args[1]) || !/^engine-[a-f0-9]{20}$/.test(args[3])) {
    throw Error('Usage: node scripts/verify-publication.mjs --commit <40-character-main-commit> --engine <deployed-engine-revision>');
  }
  const bundle = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../dist/content-bundle.json', import.meta.url)), 'utf8'));
  const result = await verifyRepositoryPublication({ repository: REPOSITORY, commit: args[1], bundle }, { engineRevision: args[3] });
  console.log(JSON.stringify({ status: 'verified-candidate-not-published', ...result.provenance, revision: result.bundle.manifest.revision,
    engineRevision: result.bundle.manifest.engineRevision, recordCount: result.bundle.manifest.recordCount }, null, 2));
} catch (error) {
  console.error('Publication preflight failed: ' + error.message);
  process.exitCode = 1;
}
