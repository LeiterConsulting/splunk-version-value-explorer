import type {Candidate} from "./types";

export const queuePolicyVersion="2026-10-29";
export const researchPlan={catchupStart:"2026-10-30",catchupThrough:"2026-11-12",firstPassDaily:3,reassessmentOn:"2026-11-20",expansionMaxNeverReviewed:5,cohortMax:10};
const after=(at:string,days:number)=>new Date(Date.parse(at)+days*86400000).toISOString();
export function reviewCadence(c:Candidate):{cadence:NonNullable<Candidate["queue"]>["cadence"];days:number} {
  if(c.investigation?.state==="unavailable")return {cadence:"source_retry",days:14};
  if(c.investigation?.state==="mapped")return {cadence:"periodic",days:14};
  return {cadence:"awaiting_vendor",days:30};
}
export function scheduleCandidate(c:Candidate,at:string,changed=false):Candidate {
  const old=c.queue;
  if(old?.state==="in_progress"&&old.nextReviewAt>at)return c;
  if(changed)return {...c,queue:{...old,state:"pending",nextReviewAt:at,reason:"Supporting evidence changed; reassessment takes priority.",reviewTrigger:"evidence_changed",policyVersion:queuePolicyVersion}};
  if(old?.reviewTrigger==="evidence_changed")return {...c,queue:{...old,state:"pending",policyVersion:queuePolicyVersion}};
  if(old?.state==="in_progress")return {...c,queue:{...old,state:"pending",reason:"Research session expired; resume from retained evidence.",policyVersion:queuePolicyVersion}};
  if(old?.policyVersion===queuePolicyVersion)return c;
  const {cadence,days}=reviewCadence(c);
  return {...c,queue:{...old,state:old?.lastResearchAt?"waiting":"pending",nextReviewAt:old?.lastResearchAt?after(old.lastResearchAt,days):at,reason:old?.reason??"Product-specific applicability needs evidence.",cadence,policyVersion:queuePolicyVersion}};
}
export function finishSchedule(c:Candidate,at:string,summary:string):NonNullable<Candidate["queue"]> {
  const {cadence,days}=reviewCadence(c);
  return {state:"waiting",nextReviewAt:after(at,days),lastResearchAt:at,reason:summary,cadence,policyVersion:queuePolicyVersion};
}
// Only recognized advisory identity is normalized. KEV and vendor applicability
// investigations remain distinct even when they name exactly the same CVE.
export function advisoryIdentity(c:Candidate):string {
  try {
    const u=new URL(c.url);
    if(u.protocol==="https:"&&u.hostname==="sec.cloudapps.cisco.com"&&/^\/security\/center\/content\/CiscoSecurityAdvisory\/cisco-sa-[A-Za-z0-9-]+$/.test(u.pathname)&&[...u.searchParams.keys()].every(k=>k.startsWith("vs_")||k.startsWith("utm_")))return u.origin+u.pathname;
  }catch{ /* Non-advisory identities remain exact. */ }
  return c.id;
}
export function consolidateCandidates(input:Candidate[]):Candidate[] {
  const rows=structuredClone(input),groups=new Map<string,Candidate[]>();
  for(const c of rows){const key=advisoryIdentity(c);groups.set(key,[...(groups.get(key)??[]),c]);}
  for(const group of groups.values()) {
    if(group.length<2)continue;
    // Preserve a previously selected canonical ID; otherwise retain the oldest origin.
    group.sort((a,b)=>Number(!!a.duplicateOf)-Number(!!b.duplicateOf)||a.discoveredAt.localeCompare(b.discoveredAt)||a.id.localeCompare(b.id));
    const canonical=group[0];delete canonical.duplicateOf;
    canonical.provenance=[...new Map(group.flatMap(c=>[...(c.provenance??[]),{id:c.id,url:c.url,title:c.title,origin:c.origin,discoveredAt:c.discoveredAt}]).map(p=>[p.id,p])).values()];
    canonical.cves=[...new Set(group.flatMap(c=>c.cves))];
    const researched=group.filter(c=>c.queue?.lastResearchAt).sort((a,b)=>b.queue!.lastResearchAt!.localeCompare(a.queue!.lastResearchAt!))[0];
    if(researched&&researched!==canonical){canonical.queue=researched.queue;canonical.investigation=researched.investigation;}
    if(group.some(c=>c.queue?.reviewTrigger==="evidence_changed"))canonical.queue={...canonical.queue!,state:"pending",reviewTrigger:"evidence_changed",nextReviewAt:group.filter(c=>c.queue?.reviewTrigger==="evidence_changed").map(c=>c.queue!.nextReviewAt).sort()[0]};
    for(const alias of group.slice(1))alias.duplicateOf=canonical.id;
  }
  return rows;
}
export function queueCategory(c:Candidate,at:string):"never_reviewed"|"overdue_review"|"awaiting_vendor"|"future_review"|"in_progress" {
  if(c.queue?.state==="in_progress"&&c.queue.nextReviewAt>at)return "in_progress";
  if(!c.queue?.lastResearchAt)return "never_reviewed";
  if(c.queue.nextReviewAt<=at)return "overdue_review";
  return c.queue.cadence==="awaiting_vendor"?"awaiting_vendor":"future_review";
}
export function queueSummary(rows:Candidate[],at:string) {
  const active=rows.filter(c=>!c.duplicateOf),category=(name:ReturnType<typeof queueCategory>)=>active.filter(c=>queueCategory(c,at)===name).length;
  return {total:active.length,retainedRows:rows.length,duplicateAliases:rows.length-active.length,
    pending:active.filter(c=>c.queue?.state==="pending").length,waiting:active.filter(c=>c.queue?.state==="waiting").length,inProgress:category("in_progress"),
    neverReviewed:category("never_reviewed"),overdueReview:category("overdue_review"),awaitingVendor:category("awaiting_vendor"),futureReview:category("future_review"),
    due:active.filter(c=>queueCategory(c,at)!=="in_progress"&&c.queue&&c.queue.nextReviewAt<=at).length,
    oldestPendingAt:active.filter(c=>!c.queue?.lastResearchAt).map(c=>c.discoveredAt).sort()[0]??null};
}
export function selectResearch(rows:Candidate[],at:string,firstPassToday:number):{candidate?:Candidate;lane:string} {
  const due=rows.filter(c=>!c.duplicateOf&&c.queue&&c.queue.nextReviewAt<=at);
  const oldest=(a:Candidate,b:Candidate)=>(a.queue?.nextReviewAt??a.discoveredAt).localeCompare(b.queue?.nextReviewAt??b.discoveredAt)||a.discoveredAt.localeCompare(b.discoveredAt)||a.id.localeCompare(b.id);
  const urgent=due.filter(c=>c.queue?.reviewTrigger==="evidence_changed"||(!c.queue?.lastResearchAt&&c.investigation?.priority==="high"&&!!c.investigation.products.length)).sort(oldest)[0];
  if(urgent)return {candidate:urgent,lane:"urgent"};
  const first=due.filter(c=>!c.queue?.lastResearchAt).sort((a,b)=>a.discoveredAt.localeCompare(b.discoveredAt)||a.id.localeCompare(b.id))[0];
  const catchup=at.slice(0,10)>=researchPlan.catchupStart&&at.slice(0,10)<=researchPlan.catchupThrough;
  if(first&&firstPassToday<(catchup?researchPlan.firstPassDaily:1))return {candidate:first,lane:"first_pass"};
  const review=due.filter(c=>!!c.queue?.lastResearchAt).sort((a,b)=>Number(b.investigation?.priority==="high")-Number(a.investigation?.priority==="high")||oldest(a,b))[0];
  return {candidate:review??first,lane:review?"review":"first_pass"};
}
