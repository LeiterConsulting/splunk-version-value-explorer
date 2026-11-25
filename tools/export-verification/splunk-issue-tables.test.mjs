import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {after, before, test} from 'node:test';
import {chromium} from 'playwright';
import {inspectArticle, releaseTargets} from './splunk-issue-tables.mjs';

const [target] = releaseTargets();
const heading = '<h1>Splunk Enterprise 10.6.2 fixed issues</h1>';
const marker = '<p class="rna ' + target.widget + '"></p>';
const table = '<table><tr><th>Issue number</th><th>Description</th></tr><tr><td>SPL-1234</td><td>Example issue</td></tr></table>';
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });
async function inspect(html, {wiki, afterLoad, waitMs = 0} = {}) {
  const page = await browser.newPage();
  try {
    await page.route(target.url, route => route.fulfill({contentType:'text/html',body:'<article>'+html+'</article>'}));
    if (afterLoad) await page.addInitScript(afterLoad);
    const request = {get:async url => {
      assert.equal(new URL(url).searchParams.get('page'),target.widget);
      assert(wiki, 'Unexpected fallback request');
      return {status:() => wiki.status,ok:() => wiki.status === 200,json:async () => wiki,dispose:async () => {}};
    }};
    return await inspectArticle(page,target,{request,waitMs});
  } finally { await page.close(); }
}

test('owner questions cover both issue classes for both releases', () => {
  assert.deepEqual(releaseTargets().map(x=>x.id).sort(),['enterprise-fixed','enterprise-known','soar-fixed','soar-known']);
});
test('static source rows must have an identifier in the issue-number cell', async () => {
  assert.equal((await inspect(heading+table)).status,'rows-read');
  const invalid = await inspect(heading+table.replace('SPL-1234','unknown').replace('Example issue','See SPL-1234'));
  assert.equal(invalid.status,'incomplete');
});
test('waits for this release even when an older issue table is already visible', async () => {
  const res = await inspect('<h1>Patch information</h1><h2>Release 10.6.1</h2>'+table+'<h2>Release 10.6.2</h2>'+marker,{
    waitMs:3000,afterLoad:() => document.addEventListener('DOMContentLoaded',() => setTimeout(() => {
      document.querySelector('.rna').append(document.querySelector('table').cloneNode(true));
    },100))
  });
  assert.equal(res.method,'rendered-article');
  assert.deepEqual(res.tableHeadings,[['Patch information','Release 10.6.2']]);
});
test('binds the public wiki payload to the release widget and keeps repeated rows', async () => {
  const wiki = {status:200,parse:{title:target.widget,text:{'*':'<h3>Category</h3>'+table+table}}};
  const result = await inspect(heading+marker,{wiki});
  assert.equal(result.method,'article-and-public-issue-data');
  assert.equal(result.tables.length,2);
  assert.deepEqual(result.tableHeadings[0],['Splunk Enterprise 10.6.2 fixed issues','Category']);
  assert.match(result.tablesSha256,/^[0-9a-f]{64}$/);
  wiki.parse.title = 'JIRA:other-release';
  assert.equal((await inspect(heading+marker,{wiki})).status,'incomplete');
});
test('retains row endpoint denial and never promotes a heading or older release', async () => {
  const res = await inspect(heading+marker+'<h2>Release 10.6.1</h2>'+table,{wiki:{status:403}});
  assert.equal(res.status,'incomplete');
  assert.equal(res.articleHttpStatus,200);
  assert.equal(res.transport[0].httpStatus,403);
  assert.equal(res.itemizedTables,0);
  assert.equal(res.tablesSha256,undefined);
  assert.equal((await inspect(heading+marker.replace(target.widget,'JIRA:wrong-release')+table)).status,'incomplete');
});

test('interactive browser script applies the same release and issue-column checks', async () => {
  const cli = fileURLToPath(new URL('./splunk-issue-tables.mjs',import.meta.url));
  const script = execFileSync(process.execPath,[cli,'--release','10.6.2','--browser-script'],{encoding:'utf8'});
  const page = await browser.newPage();
  try {
    await page.setContent('<article>'+heading+marker+'<h2>Release 10.6.1</h2>'+table+'</article>');
    assert.equal((await page.evaluate(script)).status,'incomplete');
    await page.setContent('<article>'+heading+table+'</article>');
    const result = await page.evaluate(script);
    assert.equal(result.status,'rows-read');
    assert.equal(result.tables[0].rows[0][0],'SPL-1234');
  } finally { await page.close(); }
});
