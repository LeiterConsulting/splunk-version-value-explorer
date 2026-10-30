try { console.log(JSON.stringify(require('./lib/native-issue-feed.cjs').check())); }
catch (error) { console.error(error.message); process.exitCode = 1; }
