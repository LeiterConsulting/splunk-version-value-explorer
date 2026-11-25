import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

// The browser-script output uses this function in the public article as well.
function readArticle() {
  const article = document.querySelector('article');
  if (!article) throw new Error('No Splunk Help article');
  const tables = [], tableHeadings = [], headings = [], scope = [];
  const title = article.querySelector('h1')?.innerText.trim();
  for (const el of article.querySelectorAll('h1,h2,h3,h4,h5,h6,table')) {
    if (el.tagName !== 'TABLE') {
      const level = Number(el.tagName[1]), label = el.innerText.trim();
      scope.length = level;
      scope[level - 1] = label;
      if (level > 1 && label) headings.push(label);
      continue;
    }
    const headers = [...el.querySelectorAll('th')].slice(0,3).map(cell => cell.innerText.trim());
    const rows = [...el.rows].filter(row => row.querySelector('td')).map(row => [...row.cells].map(cell => cell.innerText.trim()));
    if (!headers.some(header => /issue (number|id)/i.test(header)) || !rows.some(row => row.some(cell => /\b[A-Z]+-\d{3,}\b/.test(cell)))) continue;
    tables.push({headers, rows});
    tableHeadings.push(scope.filter(Boolean));
  }
  const introductionVersions = [...new Set([...article.querySelectorAll('p')].filter(p => !p.closest('table')).slice(0,6)
    .flatMap(p => p.innerText.match(/\b\d+(?:\.\d+)+\b/g) || []))];
  return {title, headings, tables, tableHeadings, introductionVersions};
}
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--browser-script') {
  console.log('(' + readArticle.toString() + ')()');
  process.exit(0);
}
let release;
if (args[0] === '--release') {
  args.shift();
  release = args.shift();
  assert(/^\d+(?:\.\d+)+$/.test(release || ''), 'Supply a dotted release number');
}
assert(args.length, 'Supply the public Splunk Help known-issue, fixed-issue or maintenance patch URLs being reviewed');
const browser = await chromium.launch();
try {
  for (const url of args) {
    const page = await browser.newPage();
    let result, observedUrl;
    try {
      const source = new URL(url);
      assert(source.origin === 'https://help.splunk.com' && /(?:known|fixed)-issues|maintenance-patch-release-information/.test(source.pathname), 'Use a public Splunk Help issue page');
      const response = await page.goto(url, {waitUntil:'commit', timeout:30000});
      await page.locator('article h1').first().waitFor({timeout:20000});
      observedUrl = page.url();
      assert(response?.ok() && new URL(observedUrl).origin === source.origin, 'Issue page unavailable');
      result = await page.evaluate(readArticle);
      if (!result.tables.length) {
        await page.waitForFunction(() => [...document.querySelectorAll('article table tr')].some(tr =>
          tr.querySelector('td') && /\b[A-Z]+-\d{3,}\b/.test(tr.innerText)), undefined, {timeout:20000});
        result = await page.evaluate(readArticle);
      }
      assert(result.tables.length, 'No itemized issue table');
      if (release) {
        const matches = result.tableHeadings.map(scope => scope.some(label =>
          (label.match(/\b\d+(?:\.\d+)+\b/g) || []).some(version => version === release || version.startsWith(release + '.'))));
        assert(matches.includes(true), 'No itemized table under a heading for release ' + release);
        result.tables = result.tables.filter((_,i) => matches[i]);
        result.tableHeadings = result.tableHeadings.filter((_,i) => matches[i]);
      }
      const tablesSha256 = createHash('sha256').update(JSON.stringify(result.tables)).digest('hex');
      console.log(JSON.stringify({url:observedUrl, checkedAt:new Date().toISOString(), ...(release && {release}), tablesSha256, ...result}));
    } catch (error) {
      const evidence = result && {title:result.title, headings:result.headings, itemizedTables:result.tables.length,
        tableHeadings:result.tableHeadings, introductionVersions:result.introductionVersions, requestedRelease:release};
      console.error(JSON.stringify({url:observedUrl || url, checkedAt:new Date().toISOString(), error:error.message, ...evidence}));
      process.exitCode = 1;
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
