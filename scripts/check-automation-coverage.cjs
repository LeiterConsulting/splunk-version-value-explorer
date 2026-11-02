try { console.log(JSON.stringify(require('./lib/automation-coverage.cjs').check(), null, 2)); }
catch (error) { console.error(error.message); process.exitCode = 1; }
