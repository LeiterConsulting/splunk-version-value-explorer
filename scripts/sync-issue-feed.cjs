const { sync } = require('./lib/issue-feed.cjs');
try { console.log(JSON.stringify(sync(process.cwd(), process.argv.includes('--check')))); }
catch (error) { console.error(error.message); process.exitCode = 1; }
