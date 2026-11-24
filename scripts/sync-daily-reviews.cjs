const fs = require('node:fs');
const { inventory } = require('./lib/reader-review.cjs');
const file = 'dist/daily-reviews.js';
const {date, sections} = inventory();
const bytes = 'window.VersionCompassDailyReviews = ' + JSON.stringify({date, sections}, null, 2) + ';\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(file) || fs.readFileSync(file,'utf8') !== bytes) throw Error('Daily public review status is stale');
} else fs.writeFileSync(file,bytes);
