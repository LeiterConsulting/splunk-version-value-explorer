/* Navigation reflects rendered sections, never changes evidence or route filters. */
(function(){
'use strict';
const main=document.querySelector('main');if(!main)return;
const nav=document.createElement('nav');nav.className='report-navigator';nav.setAttribute('aria-label','Report sections');main.before(nav);
const edition=!!document.querySelector('#edition-title');
// Move the original controls so validation, copy feedback and print handlers stay intact.
const header=document.querySelector('.site-header');
const copy=document.getElementById(edition?'edition-copy':'copy-link');
const print=document.getElementById(edition?'edition-print':'print-report');
const status=document.getElementById(edition?'edition-share-status':'share-status');
if(header&&copy&&print){
 const actions=document.createElement('div');actions.className='header-actions';actions.setAttribute('role','group');actions.setAttribute('aria-label','Share or save report');
 const icons=[
  '<path d="M12 16V3m-4 4 4-4 4 4M7 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/>',
  '<path d="M4 3h13l4 4v14H3V3h1Z"/><path d="M7 3v6h10V3M7 21v-8h10v8M14 5v2"/>'
 ];
 [copy,print].forEach((button,i)=>{
  const label=i?'Print / save PDF':'Copy link';
  button.classList.add('header-action');button.setAttribute('aria-label',label);
  button.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+icons[i]+'</svg><span class="header-action-label">'+label+'</span>';
  actions.append(button);
 });
 if(status){status.classList.add('header-share-status');actions.append(status);}
 const meta=document.createElement('div');meta.className='header-meta';
 const reviewed=header.querySelector('.reviewed');if(reviewed)meta.append(reviewed);
 meta.append(actions);header.append(meta);
 const empty=document.querySelector('.report-actions');if(empty&&!empty.children.length)empty.remove();
}

const specs=edition?[['.edition-hero','Selection'],['#environment-overview','Cloud scope'],['#edition-matrix-title','Comparison'],['#edition-conflicts','Source questions'],['#edition-workflows','Workflows'],['#edition-deployment','Deployment'],['#edition-history-title','History']]:[['.hero','Selection'],['#route-takeaway','Summary'],['#environment-overview','Cloud scope'],['#path-title','Upgrade path'],['#migration-approaches','Migration'],['#value-title','Benefits'],['#technical-title','Technical'],['#breaking-title','Risks'],['#readiness-title','Readiness'],['#source-title','Sources']];
let targets=[],signature='',queued=false;
function available(el){return el&&!el.closest('[hidden]')&&getComputedStyle(el).display!=='none';}
function rebuild(){queued=false;const next=specs.map(([selector,label],i)=>{const el=main.querySelector(selector);if(!available(el))return null;if(!el.id)el.id='report-section-'+i;return {el,label,id:el.id};}).filter(Boolean);const key=next.map(x=>x.id).join('|');targets=next;if(key!==signature){signature=key;nav.replaceChildren(...next.map(x=>{const b=document.createElement('button');b.type='button';b.textContent=x.label;b.dataset.target=x.id;return b;}));}mark();}
function mark(){const edge=nav.getBoundingClientRect().bottom+36;let active=targets[0];for(const t of targets)if(t.el.getBoundingClientRect().top<=edge)active=t;nav.querySelectorAll('button').forEach(b=>{if(b.dataset.target===active?.id)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current')});}
nav.addEventListener('click',e=>{const b=e.target.closest('button[data-target]');if(!b)return;const t=document.getElementById(b.dataset.target);if(!t)return;if(t.id==='technical-title')document.getElementById('technical-panel').open=true;if(t.id==='environment-overview'){const d=t.querySelector('.perspective-full');if(d)d.open=true;}t.setAttribute('tabindex','-1');t.focus({preventScroll:true});t.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(rebuild);}}).observe(main,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
new ResizeObserver(()=>document.documentElement.style.setProperty('--report-nav-height',nav.getBoundingClientRect().height+'px')).observe(nav);
let scrollPending=false;window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(()=>{scrollPending=false;mark()})}},{passive:true});
rebuild();
}());
