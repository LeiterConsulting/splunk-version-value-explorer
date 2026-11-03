/* Fresh synthetic stress output; never opens Safari or a retained user file. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const printTheme=()=>{
  const style=selector=>getComputedStyle(document.querySelector(selector));
  return {cisco:document.documentElement.classList.contains('theme-cisco'),text:style('body').color,background:style('body').backgroundColor,title:style('.advisor-report h3').color};
};
export async function verifyAdvisorOversized(page,context,directory,theme,revision,artifactRoot) {
  await page.emulateMedia({media:'print'});
  let expectedTheme;
  try {expectedTheme=await page.evaluate(printTheme);}
  finally {await page.emulateMedia({media:null});}
  assert.equal(expectedTheme.cisco,theme==='cisco');
  const fixture=await page.evaluate(revision=>{
    const units=[],paragraphs=[],pairs=[];
    for(const [kind,selector] of [['brief','.advisor-brief-section'],['source','.advisor-source-entry']]) {
      const original=document.querySelector('.advisor-report '+selector);
      if(!original)throw Error('Missing Advisor stress seed: '+kind);
      const clone=original.cloneNode(true),heading=clone.querySelector('h3');
      heading.textContent='SYNTHETIC ADVISOR '+kind.toUpperCase()+' STRESS';
      const lead=clone.querySelector('p');
      pairs.push({heading:heading.textContent,following:lead.textContent,headingOccurrence:1});
      for(let i=1;i<=48;i++) {
        const p=document.createElement('p');p.textContent='SYNTHETIC ADVISOR '+kind.toUpperCase()+' '+String(i).padStart(3,'0')+'. Printable fragmentation test content, not product guidance.';
        paragraphs.push(p.textContent);clone.append(p);
      }
      const end=document.createElement('p');end.textContent='END OF SYNTHETIC ADVISOR '+kind.toUpperCase()+' STRESS';clone.append(end);paragraphs.push(end.textContent);
      if(!units.length){const identity=document.createElement('p');identity.textContent=revision;clone.prepend(identity);}
      units.push(clone.outerHTML);
    }
    return {html:units.join(''),htmlClass:document.documentElement.className,bodyClass:document.body.className,paragraphs,pairs};
  },revision);
  fs.mkdirSync(directory,{recursive:true});
  const css=['styles.css',...(theme==='cisco'?['theme-cisco.css']:[]),'editions.css','perspectives.css','advisor.css'].map(file=>fs.readFileSync('dist/'+file,'utf8')).join('\n');
  const probe=await context.newPage();
  try {
    await probe.setContent('<!doctype html><html class="'+escape(fixture.htmlClass)+'"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'"><style>'+css+'</style><body class="'+escape(fixture.bodyClass)+'"><main><div class="edition-report advisor-report">'+fixture.html+'</div></main></body></html>');
    await probe.emulateMedia({media:'print'});
    const actualTheme=await probe.evaluate(printTheme);assert.deepEqual(actualTheme,expectedTheme,'Advisor stress print theme differs from canonical output');
    const pdf=path.join(directory,'oversized.pdf'),expectedFile=path.join(directory,'expected.json');
    fs.writeFileSync(expectedFile,JSON.stringify({headings:fixture.pairs.map(p=>p.heading),printAnnotations:fixture.paragraphs,revision,paginationPairs:fixture.pairs}));
    await probe.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true});
    const inspected=JSON.parse(execFileSync('python3',['tools/export-verification/inspect-pdf.py',pdf,directory,expectedFile],{encoding:'utf8'}));
    assert(inspected.pageCount>2,'Oversized Advisor units did not exercise fragmentation');
    const first=execFileSync('pdftotext',['-f','1','-l','1','-raw',pdf,'-'],{encoding:'utf8'}),normalize=value=>value.replace(/\s+/g,'').toLowerCase();
    assert(normalize(first).includes(normalize(fixture.paragraphs[0])),'Oversized Advisor fixture left an empty preface page');
    const relative=file=>path.relative(artifactRoot,file);
    return {...inspected,file:relative(pdf),inspection:relative(path.join(directory,'inspection.json')),pages:inspected.pages.map(p=>({...p,file:relative(p.file)})),syntheticUnits:2,syntheticParagraphs:96,endMarkers:2,complete:true,firstPageHasContent:true,printThemeParity:{passed:true,actual:actualTheme},qualification:'Fresh synthetic native Chromium brief/source stress output; not native Safari or reopening an existing download.'};
  } finally {await probe.close();}
}
