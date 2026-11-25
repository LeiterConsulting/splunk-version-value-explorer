import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {appendFileSync, readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {chromium, webkit} from 'playwright';

// Kept self-contained so the owner can run the same read in a public article tab.
export function readArticle({release, widget, fragments = {}} = {}) {
  const article = document.querySelector('article');
  if (!article) throw new Error('No Splunk Help article');
  const tables = [], tableHeadings = [], headings = [], widgets = [], problems = [];
  const text = el => (el.innerText || el.textContent || '').trim();
  const matches = scope => {
    if (!release) return true;
    for (const label of scope.filter(Boolean).reverse()) {
      const versions = label.match(/\b\d+(?:\.\d+)+\b/g);
      if (versions) return versions.some(v => v === release || v.startsWith(release + '.'));
    }
    return false;
  };
  function collect(root, initialScope, insideWidget = false) {
    const scope = [...initialScope];
    for (const el of root.querySelectorAll('h1,h2,h3,h4,h5,h6,p.rna,table')) {
      const parentWidget = el.parentElement?.closest('p.rna');
      if (!insideWidget && parentWidget && [...parentWidget.classList].some(c => /^JIRA:/i.test(c))) continue;
      if (/^H[1-6]$/.test(el.tagName)) {
        const level = Number(el.tagName[1]);
        // Widget headings are local categories and cannot replace their article's release.
        const depth = insideWidget ? initialScope.length + level : level;
        scope.length = depth;
        scope[depth - 1] = text(el);
        if (level > 1 && text(el)) headings.push(text(el));
        continue;
      }
      if (!matches(scope)) continue;
      if (el.tagName === 'P') {
        const key = [...el.classList].find(cls => /^JIRA:[A-Za-z0-9._-]+$/i.test(cls));
        if (!key || insideWidget) continue;
        const entry = {key, heading:scope.filter(Boolean), tableCount:0};
        widgets.push(entry);
        if (widget && key !== widget) continue;
        const start = tables.length;
        collect(el, scope, true);
        if (tables.length === start && Object.hasOwn(fragments, key)) {
          // Template content stays inert. Do not execute or attach vendor fragments.
          const template = document.createElement('template');
          template.innerHTML = fragments[key];
          collect(template.content, scope, true);
          entry.usedPublicIssueData = tables.length > start;
        }
        entry.tableCount = tables.length - start;
        continue;
      }
      const headerRow = [...el.rows].find(row => row.querySelector('th'));
      if (!headerRow) continue;
      const headers = [...headerRow.cells].map(text);
      const issueColumn = headers.findIndex(h => /\bissue (number|id)\b/i.test(h));
      if (issueColumn < 0) continue;
      const rows = [...el.rows].filter(row => row.querySelector('td')).map(row => [...row.cells].map(text));
      if (!rows.length || rows.some(row => !/\b[A-Z][A-Z0-9_]*-\d+\b/.test(row[issueColumn] || ''))) {
        problems.push('Empty or unrecognized issue-number cells under ' + scope.filter(Boolean).join(' / '));
        continue;
      }
      tables.push({headers, rows});
      tableHeadings.push(scope.filter(Boolean));
    }
  }
  collect(article, []);
  const introductionVersions = [...new Set([...article.querySelectorAll('p')].filter(p => !p.closest('table,p.rna'))
    .slice(0,6).flatMap(p => text(p).match(/\b\d+(?:\.\d+)+\b/g) || []))];
  return {title:text(article.querySelector('h1') || article), headings, tables, tableHeadings, introductionVersions, widgets, problems};
}

function complete(result, widget) {
  return result.tables.length > 0 && !result.problems.length &&
    (!widget || !result.widgets.length || result.widgets.some(w => w.key === widget)) &&
    result.widgets.every(w => (!widget || w.key === widget) && w.tableCount > 0);
}

async function readWidget(request, key) {
  // Splunk's article renderer uses this public MediaWiki parse endpoint and the literal namespace colon.
  const url = 'https://docs.splunk.com/api.php?action=parse&page=' + key + '&prop=text&format=json';
  const evidence = {key, url};
  try {
    const r = await request.get(url, {timeout:12000, maxRedirects:0});
    evidence.httpStatus = r.status();
    try {
      if (!r.ok()) return {evidence};
      const parse = (await r.json()).parse;
      if (parse?.title !== key || typeof parse.text?.['*'] !== 'string' || !parse.text['*'].trim()) {
        return {evidence:{...evidence,error:'Missing or mismatched wiki page'}};
      }
      return {evidence, html:parse.text['*']};
    } finally { await r.dispose(); }
  } catch (error) {
    return {evidence:{...evidence,error:error.name === 'TimeoutError' ? 'Request timed out' : 'Public issue data unavailable or invalid'}};
  }
}

export async function inspectArticle(page, {url, release, widget}, {waitMs = 16000, request = page.request} = {}) {
  const source = new URL(url);
  assert(source.origin === 'https://help.splunk.com' && /(?:known|fixed)-issues|maintenance-patch-release-information/.test(source.pathname), 'Use a public Splunk Help issue page');
  const transport = [];
  const response = await page.goto(url, {waitUntil:'domcontentloaded', timeout:30000});
  const observedUrl = new URL(page.url());
  assert(response?.ok() && observedUrl.origin === source.origin && observedUrl.pathname.replace(/\/$/,'') === source.pathname.replace(/\/$/,''), 'Article unavailable or redirected to another article');
  await page.locator('article h1').first().waitFor({timeout:20000});
  const args = {release, widget};
  const deadline = Date.now() + waitMs;
  let result;
  do {
    result = await page.evaluate(readArticle, args);
    if (complete(result, widget)) break;
    const timeLeft = deadline - Date.now();
    if (timeLeft > 0) await new Promise(done => setTimeout(done, Math.min(400,timeLeft)));
  } while (Date.now() < deadline);
  let method = 'rendered-article';
  if (!complete(result, widget)) {
    const fragments = {};
    for (const key of new Set(result.widgets.filter(w => !w.tableCount && (!widget || w.key === widget)).map(w => w.key))) {
      const {evidence, html} = await readWidget(request, key);
      transport.push(evidence);
      if (html) fragments[key] = html;
    }
    result = await page.evaluate(readArticle, {...args, fragments});
    if (result.widgets.some(w => w.usedPublicIssueData)) method = 'article-and-public-issue-data';
  }
  const common = {url:observedUrl.href, checkedAt:new Date().toISOString(), ...(release && {release}), articleHttpStatus:response.status(), transport};
  if (!complete(result, widget)) {
    return {...common,status:'incomplete',error:'Requested issue rows could not be verified',title:result.title,
      headings:result.headings,tableHeadings:result.tableHeadings,introductionVersions:result.introductionVersions,
      itemizedTables:result.tables.length,widgets:result.widgets,problems:result.problems};
  }
  return {...common,status:'rows-read',method,tablesSha256:createHash('sha256').update(JSON.stringify(result.tables)).digest('hex'),...result};
}

export function releaseTargets() {
  const questions = JSON.parse(readFileSync(new URL('./owner-questions.json',import.meta.url)));
  return questions.filter(q => q.issueTable).map(q => {
    assert(q.additionalCitationUrls?.length === 1, 'Each watched issue table needs one public article');
    return {...q.issueTable, url:q.additionalCitationUrls[0]};
  });
}

async function main(args) {
  let release;
  if (args[0] === '--release') {
    args.shift();
    release = args.shift();
    assert(/^\d+(?:\.\d+)+$/.test(release || ''), 'Supply a dotted release number');
  }
  if (args.length === 1 && args[0] === '--browser-script') {
    console.log('(() => { const result = (' + readArticle.toString() + ')(' + JSON.stringify({release}) +
      '); return {...result, status: (' + complete.toString() + ')(result) ? "rows-read" : "incomplete"}; })()');
    return;
  }
  const owner = args.length === 1 && args[0] === '--release-watch';
  const targets = owner ? releaseTargets() : args.map(url => ({url,release}));
  assert(targets.length, 'Supply public Splunk Help issue URLs or --release-watch');
  const summaryFile = owner && process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) appendFileSync(summaryFile,'### Release Watch issue sources\n\n| Article | Result | Browser | Issue rows |\n| --- | --- | --- | ---: |\n');
  const browsers = new Map();
  async function readWith(engine, target) {
    let page;
    try {
      if (!browsers.has(engine)) browsers.set(engine, await (engine === 'webkit' ? webkit : chromium).launch());
      page = await browsers.get(engine).newPage();
      return {engine, ...await inspectArticle(page,target)};
    } catch (error) {
      return {engine,url:target.url,release:target.release,checkedAt:new Date().toISOString(),status:'incomplete',error:error.message.split('\n')[0]};
    } finally { if (page) await page.close(); }
  }
  try {
    for (const target of targets) {
      let result = await readWith('chromium',target);
      if (result.status === 'incomplete') {
        const firstAttempt = result;
        result = await readWith('webkit',target);
        result.previousAttempts = [firstAttempt];
      }
      if (target.id) result.id = target.id;
      if (summaryFile) {
        const rows = result.tables?.reduce((sum,t) => sum + t.rows.length,0) ?? 'unknown';
        appendFileSync(summaryFile,`| [${target.id}](${target.url}) | ${result.status} | ${result.engine} | ${rows} |\n`);
      }
      if (result.status === 'incomplete') process.exitCode = 1;
      (owner || result.status === 'rows-read' ? console.log : console.error)(JSON.stringify(result));
    }
  } finally { await Promise.all([...browsers.values()].map(b => b.close())); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
