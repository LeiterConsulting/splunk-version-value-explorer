/* A one-use private context note, never a comparison URL or recommended target. */
(function () {
  'use strict';
  const p=new URLSearchParams(location.search);
  if(p.has('view')||p.get('product')!=='platform'||p.get('platform')!=='enterprise')return;
  let context;
  try{const raw=sessionStorage.getItem('versioncompass-advisor-handoff-v1');if(!raw)return;sessionStorage.removeItem('versioncompass-advisor-handoff-v1');context=JSON.parse(raw);}catch{return;}
  const now=Date.now(),expiry=Date.parse(context?.expiresAt),created=Date.parse(context?.createdAt);
  if(context?.schemaVersion!==1||context.goal!=='agent-mode'||typeof context.reportedVersion!=='string'||!/^\d{1,3}\.\d{1,3}(?:\.\d{1,3}){0,2}$/.test(context.reportedVersion)||context.releaseLine!==context.reportedVersion.split('.').slice(0,2).join('.')||context.documentedMinimum!=='10.1.x+'||!Number.isFinite(created)||!Number.isFinite(expiry)||expiry-created!==10*60000||created>now||expiry<=now)return;
  const css=document.createElement('link');css.rel='stylesheet';css.href='advisor.css';document.head.append(css);
  const panel=document.createElement('aside');panel.className='advisor-guide-context';panel.setAttribute('aria-label','Private Advisor decision context');
  const title=document.createElement('h2');title.textContent='Your Advisor context stays with this decision';
  const copy=document.createElement('p');copy.textContent='You reported Enterprise '+context.reportedVersion+'. Your Advisor brief ('+context.createdAt+') recorded a 10.1.x+ Enterprise prerequisite from its dated assessed evidence. That minimum is not a recommended target. An upgrade alone does not establish Agent Mode availability or resolve current Cloud Connected app restrictions; retain the brief’s source qualifications. Choose the current release and a target below to examine supported transitions and compatibility.';
  const boundary=document.createElement('p');boundary.textContent='Advisor has not changed the Release Guide’s selections or chosen a target. Its initial selections are the guide’s normal defaults, not an Advisor recommendation. This one-use note stays in this tab and is excluded from copied links and the Release Guide report. Your own comparison selections use normal sharing behavior.';
  const focus=document.createElement('button');focus.type='button';focus.textContent='Go to the current-release selector';focus.addEventListener('click',()=>{document.getElementById('from-release')?.focus();document.getElementById('from-release')?.scrollIntoView({block:'center'});});
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Dismiss private context';dismiss.addEventListener('click',()=>panel.remove());
  panel.append(title,copy,boundary,focus,dismiss);document.querySelector('main .hero')?.after(panel);
}());
