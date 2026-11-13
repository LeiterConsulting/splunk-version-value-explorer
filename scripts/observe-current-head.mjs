/* Explicit current-head-only entry point. No publication CLI or mutation transport. */
import fs from 'node:fs';
import { observeCurrentHead, loadObservationInputs } from './observe-seed.mjs';
const receipt = await observeCurrentHead(loadObservationInputs());
try {
  fs.writeFileSync('current-head-observation-outcome.json', JSON.stringify(receipt, null, 2) + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '\nHead observation: **' + receipt.status + '**\n\n' + receipt.qualification + '\n');
} catch { console.error('Head observation receipt retention failed.'); process.exitCode = 1; }
console.log(JSON.stringify(receipt));
if (receipt.status !== 'observation-returned') process.exitCode = 1;
