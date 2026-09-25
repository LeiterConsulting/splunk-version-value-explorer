/* Navigation reflects rendered sections, never changes evidence or route filters. */
(function(){
'use strict';
const main=document.querySelector('main');if(!main)return;
const nav=document.createElement('nav');nav.className='report-navigator';nav.setAttribute('aria-label','Report sections');main.before(nav);
const edition=!!document.querySelector('#edition-title');
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
