/* Sources stay beside claims; one shared dialog holds verification context. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;'}[c]));
function html({claim,scope,urls=[],qualification='',verified=null}){
 const records=window.VersionCompassSources?.sources||[];
 const unique=[...new Set(urls.filter(Boolean))];
 const links=unique.map(url=>{
  const r=records.find(item=>item.url===url),href=window.VersionCompassTheme?.href('?view=about&source_search='+encodeURIComponent(url)+'#sources-title')||'?view=about&source_search='+encodeURIComponent(url)+'#sources-title';
  return '<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(r?.title||'Official source')+'</a><br><strong>Source last verified:</strong> '+esc(r?.reviewed||'Not recorded')+' · '+esc(r?.status||'Review date unknown')+
  '<p><strong>Supporting section:</strong> '+esc(r?.section||'Exact section not yet recorded; open the cited document.')+'</p>'+
  (r?.verificationScope?'<p><strong>Verification scope:</strong> '+esc(r.verificationScope)+'</p>':'')+
  (r?.reason?'<p>'+esc(r.reason)+'</p>':'')+'<a href="'+esc(href)+'">Source history & usage</a></li>';
 }).join('');
 const primary=unique[0];
 return '<div class="claim-evidence">'+(primary?'<a class="claim-source" href="'+esc(primary)+'" target="_blank" rel="noopener noreferrer">Source ↗</a>':'')+
 '<button type="button" class="evidence-trigger" data-evidence-trigger aria-label="Source context for '+esc(claim)+'">Context</button>'+
 '<div class="evidence-context" hidden><strong>Claim:</strong> '+esc(claim)+'<br><strong>Applies to:</strong> '+esc(scope)+'<br><strong>Claim last verified:</strong> '+esc(verified||'Not separately recorded')+
 (qualification?'<p><strong>Qualification:</strong> '+esc(qualification)+'</p>':'')+'<ul>'+links+'</ul><p class="evidence-note">Source review dates apply only to the recorded scope. A reviewed document does not verify every claim that cites it.</p></div></div>';
}
document.addEventListener('click',event=>{
 const trigger=event.target.closest?.('[data-evidence-trigger]');if(!trigger)return;
 const context=trigger.parentElement.querySelector('.evidence-context');if(!context)return;
 let dialog=document.getElementById('evidence-dialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='evidence-dialog';dialog.className='evidence-dialog';dialog.innerHTML='<div class="evidence-dialog-head"><h2>Source context</h2><button type="button" aria-label="Close source context">Close</button></div><div class="evidence-dialog-body"></div>';document.body.append(dialog);dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});}
 dialog.querySelector('.evidence-dialog-body').innerHTML=context.innerHTML;
 dialog.showModal();dialog.querySelector('button').focus();
});
window.VersionCompassEvidence={html};
}());
