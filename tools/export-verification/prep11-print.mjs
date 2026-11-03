/* Fresh, synthetic CI stress output. Never opens a retained user download or Safari. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const printTheme=()=>{
  const style=selector=>getComputedStyle(document.querySelector(selector));
  return {cisco:document.documentElement.classList.contains('theme-cisco'),
    text:style('body').color,background:style('body').backgroundColor,
    title:style('.prep11-report h3').color,
    scopeText:style('.prep11-report .prep11-qualification').color,
    scopeBackground:style('.prep11-report .prep11-qualification').backgroundColor};
};

export async function verifyPrep11Oversized(page,context,directory,theme,revision,artifactRoot) {
  await page.emulateMedia({media:'print'});
  let expectedTheme;
  try {expectedTheme=await page.evaluate(printTheme);}
  finally {await page.emulateMedia({media:null});}
  assert.equal(expectedTheme.cisco,theme==='cisco','Canonical print theme is incorrect');
  const fixture=await page.evaluate(revision=>{
    const original=document.querySelector('.prep11-report #report-prep11-app-delivery');
    if(!original)throw Error('Missing canonical Prep11 stress-test seed');
    const clone=original.cloneNode(true),paragraphs=[];
    for(let i=1;i<=48;i++) {
      const p=document.createElement('p');
      p.textContent='SYNTHETIC PREP11 STRESS '+String(i).padStart(3,'0')+'. Additional printable validation content. This is a test fixture, not product guidance.';
      paragraphs.push(p.textContent);clone.append(p);
    }
    const end=document.createElement('p');end.textContent='END OF SYNTHETIC PREP11 STRESS';clone.append(end);paragraphs.push(end.textContent);
    // The identity belongs to the fixture, not a separate preface page. Starting
    // the oversized box at the page origin exercises actual fragmentation.
    const identity=document.createElement('p');identity.textContent=revision;
    clone.querySelector('.prep11-record-lead').prepend(identity);
    return {html:clone.outerHTML,htmlClass:document.documentElement.className,bodyClass:document.body.className,title:clone.querySelector('h3').textContent,label:clone.querySelector('.prep11-label').textContent,lead:clone.querySelector('.prep11-record-lead p:last-child').textContent,paragraphs};
  },revision);
  fs.mkdirSync(directory,{recursive:true});
  const css=['styles.css',...(theme==='cisco'?['theme-cisco.css']:[]),'editions.css','perspectives.css','prep11.css'].map(file=>fs.readFileSync('dist/'+file,'utf8')).join('\n');
  const probe=await context.newPage();
  try {
    await probe.setContent('<!doctype html><html class="'+escape(fixture.htmlClass)+'"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'"><style>'+css+'</style><body class="'+escape(fixture.bodyClass)+'"><main><div class="edition-report prep11-report">'+fixture.html+'</div></main></body></html>');
    await probe.emulateMedia({media:'print'});
    const actualTheme=await probe.evaluate(printTheme);
    assert.deepEqual(actualTheme,expectedTheme,'Synthetic print theme differs from the canonical page');
    const pdf=path.join(directory,'oversized.pdf'),expectedFile=path.join(directory,'expected.json');
    fs.writeFileSync(expectedFile,JSON.stringify({headings:[fixture.title],printAnnotations:fixture.paragraphs,revision,paginationPairs:[{heading:fixture.label,following:fixture.title,headingOccurrence:1},{heading:fixture.title,following:fixture.lead,headingOccurrence:1}]}));
    await probe.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true});
    const inspected=JSON.parse(execFileSync('python3',['tools/export-verification/inspect-pdf.py',pdf,directory,expectedFile],{encoding:'utf8'}));
    assert(inspected.pageCount>1,'Oversized print fixture did not exercise fragmentation');
    const firstPage=execFileSync('pdftotext',['-f','1','-l','1','-raw',pdf,'-'],{encoding:'utf8'});
    const normalize=value=>value.replace(/\s+/g,'').toLowerCase();
    assert(normalize(firstPage).includes(normalize(fixture.paragraphs[0])),'Oversized fixture left a near-empty preface page');
    const relative=file=>path.relative(artifactRoot,file);
    return {...inspected,file:relative(pdf),inspection:relative(path.join(directory,'inspection.json')),pages:inspected.pages.map(p=>({...p,file:relative(p.file)})),syntheticParagraphs:48,complete:true,firstPageHasContent:true,printThemeParity:{passed:true,actual:actualTheme},qualification:'Synthetic native Chromium stress output; not a live Safari capture or reopening of an existing download.'};
  } finally {await probe.close();}
}
