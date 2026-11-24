import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

// This expression also runs in the browser that actually displays the vendor article.
function readArticle() {
  const article = document.querySelector('article');
  if (!article) throw new Error('No Splunk Help article');
  const tables = [...article.querySelectorAll('table')].map(table => ({
    headers: [...table.querySelectorAll('th')].slice(0,3).map(cell => cell.innerText.trim()),
    rows: [...table.rows].filter(row => row.querySelector('td')).map(row => [...row.cells].map(cell => cell.innerText.trim()))
  })).filter(table => table.headers.some(header => /issue (number|id)/i.test(header)) && table.rows.length);
  return {title:article.querySelector('h1')?.innerText, headings:[...article.querySelectorAll('h2,h3')].map(h => h.innerText.trim()), tables};
}
const urls = process.argv.slice(2);
if (urls.length === 1 && urls[0] === '--browser-script') {
  console.log('(' + readArticle.toString() + ')()');
  process.exit(0);
}
assert(urls.length, 'Supply the Splunk Help known-issue or fixed-issue URLs being reviewed');
const browser = await chromium.launch();
try {
  for (const url of urls) {
    const page = await browser.newPage();
    try {
      const source = new URL(url);
      assert(source.origin === 'https://help.splunk.com' && /(?:known|fixed)-issues/.test(source.pathname), 'Use a public Splunk Help issue page');
      const response = await page.goto(url, {waitUntil:'domcontentloaded', timeout:30000});
      assert(response?.ok() && new URL(page.url()).origin === source.origin, 'Issue page unavailable');
      await page.waitForFunction(() => [...document.querySelectorAll('article table tr')].some(tr =>
        tr.querySelector('td') && /\b[A-Z]+-\d{3,}\b/.test(tr.innerText)), undefined, {timeout:20000});
      const result = await page.evaluate(readArticle);
      assert(result.tables.length, 'No itemized issue table. Retain the incomplete source result.');
      const tablesSha256 = createHash('sha256').update(JSON.stringify(result.tables)).digest('hex');
      console.log(JSON.stringify({url:page.url(), checkedAt:new Date().toISOString(), tablesSha256, ...result}));
    } catch (error) {
      console.error(JSON.stringify({url, checkedAt:new Date().toISOString(), error:error.message}));
      process.exitCode = 1;
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
