/* Publication entry point is unconditionally held. No transport or credential path. */
import fs from 'node:fs';
const args = process.argv.slice(2);
if (!['--commit', '--bootstrap'].includes(args[0]) || (args[0] === '--commit' && (args.length !== 2 || !/^[a-f0-9]{40}$/.test(args[1]))) || (args[0] === '--bootstrap' && (args.length !== 2 || !/^[a-f0-9]{40}$/.test(args[1])))) {
  console.error('Usage: node scripts/publish-content.mjs --commit <main-SHA> | --bootstrap <main-SHA>'); process.exit(1);
}
// An unconditional repository hold, not an environment flag or active-reader gate.
// Removing it requires a separately reviewed publication decision. No input,
// credential, production read or mutation below this point is currently reached.
const held = { commit: args[1], recordedAt: new Date().toISOString(),
  status: 'held-publication-disabled', action: 'pre-write-hold', target: 'local-policy',
  completedActions: [], requests: 0, credentialAcquired: false, mutationAttempted: false,
  mutationOutcome: 'not-attempted', claimedDelivered: false,
  qualification: 'Publication is held before candidate reads, credentials and production requests. No runtime, D1, head, activation or delivery state was observed.' };
if (process.env.GITHUB_ACTIONS === 'true') {
  fs.writeFileSync('publication-outcome.json', JSON.stringify(held, null, 2) + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '\nPublisher outcome: **held-publication-disabled**\n\n' + held.qualification + '\n');
}
console.log(JSON.stringify(held));
process.exit(1);
