/* Claim context stays separate from source-level verification. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html({claim,scope,urls=[],qualification='',verified=null}){
 const records=window.VersionCompassSources?.sources||[];
 const links=[...new Set(urls.filter(Boolean))].map(url=>{
  const r=records.find(r=>r.url===url),href=window.VersionCompassTheme?.href('?view=about&source_search='+encodeURIComponent(url)+'#sources-title')||'?view=about&source_search='+encodeURIComponent(url)+'#sources-title';
  return '<li><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(r?.title||'Official source')+'</a><br><strong>Source last verified:</strong> '+esc(r?.reviewed||'Not recorded')+' · '+esc(r?.status||'Review date unknown')+
  '<p><strong>Supporting section:</strong> '+esc(r?.section||'Exact section not yet recorded; open the cited document.')+'</p>'+
  (r?.verificationScope?'<p><strong>Verification scope:</strong> '+esc(r.verificationScope)+'</p>':'')+
  (r?.reason?'<p>'+esc(r.reason)+'</p>':'')+'<a href="'+esc(href)+'">Source history & usage</a></li>';
 }).join('');
 return '<details class="claim-evidence"><summary>Evidence & verification</summary><p><strong>Claim:</strong> '+esc(claim)+'</p><p><strong>Applies to:</strong> '+esc(scope)+'</p><p><strong>Claim last verified:</strong> '+esc(verified||'Not separately recorded')+'</p>'+(qualification?'<p><strong>Qualification:</strong> '+esc(qualification)+'</p>':'')+'<ul>'+links+'</ul><p class="evidence-note">Source review dates apply only to the recorded scope. A reviewed document does not verify every claim that cites it.</p></details>';
}
window.VersionCompassEvidence={html};
}());
