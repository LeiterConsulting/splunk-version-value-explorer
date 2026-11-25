import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {checkReaderSurface} from './reader-checks.mjs';
import {checkReaderReport} from './reader-report.mjs';

test('reader checks require the quoted text in its visible region and a usable citation', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const proof = {capabilityId:'fixture',routeId:'fixture',region:'#answer',answer:'The verified example is visible.',
      sourceUrl:'https://help.splunk.com/example'};
    await page.setContent('<main><details><summary>Decision</summary><div id="answer">The verified example is visible.<p hidden>Hidden visitor answer.</p></div></details><p id="unrelated">A different answer.</p><a href="https://help.splunk.com/example">Official documentation</a></main>');
    await checkReaderSurface(page,[proof]);
    assert.equal(await page.locator('details').getAttribute('open'),null);
    for (const change of [{region:'#unrelated'},{answer:'Hidden visitor answer.'},{sourceUrl:'https://help.splunk.com/missing'}]) {
      await assert.rejects(checkReaderSurface(page,[{...proof,...change}]));
    }
  } finally {await browser.close();}
});

test('additional report citations must belong to the selected route', async () => {
  const route = {id:'guide',sourceReadback:{urls:['https://help.splunk.com/editions']}};
  const proof = {additionalCitationUrls:['https://help.splunk.com/unrelated']};
  await assert.rejects(checkReaderReport(null,'',route,[proof],''),/documented on the selected route/);
});
