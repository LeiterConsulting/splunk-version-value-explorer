const fs = require('node:fs');
try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--audit') throw Error('Usage: record-issue-feed-outcome.cjs --audit docs/audits/DATE-WATCH.json; JSON on stdin');
  console.log(JSON.stringify(require('./lib/native-issue-feed.cjs').record(args[1], JSON.parse(fs.readFileSync(0, 'utf8')))));
} catch (error) { console.error(error.message); process.exitCode = 1; }
