/* Offline JSON preparation. Writes stdout only; never submits a request. */
import fs from 'node:fs';
import { prepareSeedBootstrap } from './lib/bootstrap-preparation.mjs';
try {
  if (process.argv.length !== 3) throw Error('Expected one local preparation-input JSON path');
  const result = await prepareSeedBootstrap(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'prepared-not-authorized') process.exitCode = 1;
} catch { console.error('Offline preparation input unavailable or invalid'); process.exitCode = 1; }
