(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function decorate(html){
 html=html.replace(/<details class="decision-details"(?: open)?>/g,'<details class="decision-details" open>');
 const relevant=(window.VersionCompassSources?.sources||[]).filter(r=>html.includes(esc(r.url)));
 return '<p class="report-revision"><strong>Content revision '+esc(window.VersionCompassRevision?.id||'Not recorded')+'</strong> · Publication '+esc(window.VersionCompassRevision?.publication||'Not recorded')+'. Live links show evolving guidance; a saved snapshot preserves this report.</p>'+html+'<section class="report-section"><h2>Verification dates for cited sources</h2><p>Dates apply only to recorded verification scope, not every dependent claim.</p><ul>'+relevant.map(r=>'<li><a href="'+esc(r.url)+'">'+esc(r.title)+'</a> · Last verified '+esc(r.reviewed||'not recorded')+' · '+esc(r.status)+(r.verificationScope?' · '+esc(r.verificationScope):'')+'</li>').join('')+'</ul></section>';
}
function snapshotDocument(html,url,captured){
 const revision=window.VersionCompassRevision?.id||'unknown';
 const theme=document.documentElement.classList.contains('theme-cisco')?'body{background:#05070e;color:#e9edf6}a{color:#8ed9ff}.report-revision,aside{background:#14213a}td,th{border-color:#526c91}':'';
 const parsed=new DOMParser().parseFromString(html,'text/html');
 parsed.querySelectorAll('script,iframe,object,embed,form,button,input,select,link,style').forEach(el=>el.remove());
 parsed.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes])if(a.name.startsWith('on')||a.name==='srcdoc')el.removeAttribute(a.name);if(el.tagName==='DETAILS')el.open=true;});
 parsed.querySelectorAll('a[href]').forEach(a=>{try{const original=a.getAttribute('href');if(original.startsWith('#')&&parsed.getElementById(original.slice(1)))return;const u=new URL(original,url);if(!['https:','http:'].includes(u.protocol))a.removeAttribute('href');else a.href=u.href;}catch{a.removeAttribute('href');}});
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; base-uri \'none\'; form-action \'none\'"><title>Version Compass snapshot '+esc(revision)+'</title><style>body{font:16px/1.55 system-ui,sans-serif;color:#17243a;background:white;max-width:1100px;margin:30px auto;padding:0 24px}h1,h2,h3{line-height:1.2}h2{margin-top:28px}a{color:#125c40;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:14px}td,th{border:1px solid #aabdb3;padding:8px;text-align:left;vertical-align:top}details{margin:12px 0}summary{font-weight:600}.report-revision,aside{padding:12px;background:#edf3ef}.decision-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.content-change-popover,.decision-details>summary,.decision-compact{display:none}.edition-report{display:block!important}svg{max-width:24px}img{display:none}@media(max-width:700px){.decision-grid{display:block}table{font-size:12px}}@media print{body{margin:0;padding:0;font-size:10pt}h2,h3{break-after:avoid}tr{break-inside:avoid}}'+theme+'</style></head><body><aside><strong>Preserved report snapshot</strong><br>Captured '+esc(captured)+' · '+esc(revision)+'<br>This file does not update. Sources linked from it may change. <a href="'+esc(url)+'">Open current guidance for these selections</a></aside>'+parsed.body.innerHTML+'</body></html>';
}
window.VersionCompassReports={decorate,snapshotDocument};
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-save-snapshot]');if(!button)return;
 const status=button.parentElement.querySelector('.snapshot-status');
 try{
  const guard=document.getElementById('print-report')||document.getElementById('edition-print');
  if(guard?.disabled)throw Error('Resolve the selection warnings before saving a report.');
  const html=window.VersionCompassBuildSnapshot?.();if(!html)throw Error('No report is ready to save.');
  const date=new Date().toISOString(),content=snapshotDocument(html,location.href,date);
  const blob=new Blob([content],{type:'text/html;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='versioncompass-'+(window.VersionCompassRevision?.id||'snapshot')+'-'+date.slice(0,10)+'.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
  status.textContent='Snapshot saved. Keep this file to preserve the report; linked source pages remain external.';
 }catch(error){status.textContent=error.message;}
});
}());
