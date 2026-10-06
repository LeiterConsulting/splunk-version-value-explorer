"use client";
import { useState } from "react";
import { ArrowUpRight, ArrowDownToLine, GitBranch } from "lucide-react";
import type { Snapshot, Investigation } from "../lib/types";
const labels: Record<Investigation["state"],string>={mapped:"Product relationship mapped",needs_evidence:"Needs evidence",related_first_party:"Related first-party issue",unavailable:"Source unavailable"};
const date=(value:string)=>new Date(value).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"});
export default function Investigations({snapshot,onOpenAssessment,actions}:{snapshot:Snapshot;onOpenAssessment:(id:string)=>void;actions?:React.ReactNode}) {
  const [filter,setFilter]=useState("all");
  const rows=snapshot.candidates.filter(c=>filter==="all"||(c.investigation?.state??"pending")===filter);
  const run=snapshot.assessmentRuns?.at(-1);
  function exportInvestigations(){const url=URL.createObjectURL(new Blob([JSON.stringify({exportedAt:new Date().toISOString(),scope:"Public investigation research. No customer inventory or device-local context.",lastAssessmentAt:snapshot.lastAssessmentAt,run,investigations:rows,assessments:snapshot.records.filter(r=>rows.some(c=>c.investigation?.assessmentIds.includes(r.id)))},null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="ripple-investigations.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <>
    <div className="page-heading"><span className="eyebrow dark">EVIDENCE / SCOPE / NEXT ACTION</span><h1>Signals need a trail.</h1><p>Every lead keeps its outcome and evidence gap. A mapped product relationship may still need individual CVE review. Unknown applicability never means safe.</p></div>
    <div className="method-banner"><GitBranch size={22}/><div><strong>{snapshot.candidates.length} investigations · {run?`${run.claimChecks} scoped claims checked`:"assessment stage pending"}</strong><p>{run?`Last assessment ${date(run.at)}. ${run.mapped} product relationships mapped, ${run.needsEvidence} need evidence, ${run.relatedFirstParty} related first-party, ${run.failures} unavailable.`:"Feed intake collects leads. The assessment stage establishes supported outcomes and explicit uncertainty."}</p></div>{actions}</div>
    <div className="investigation-toolbar"><div className="investigation-filters" aria-label="Investigation status">{["all","mapped","needs_evidence","related_first_party","unavailable","pending"].map(state=><button key={state} aria-pressed={filter===state} onClick={()=>setFilter(state)}>{state==="all"?"All":state==="pending"?"Awaiting assessment":labels[state as Investigation["state"]]}<span>{snapshot.candidates.filter(c=>state==="all"||(c.investigation?.state??"pending")===state).length}</span></button>)}</div><button className="text-button" onClick={exportInvestigations}><ArrowDownToLine size={15}/>Export investigations</button></div>
    <div className="candidate-list">{rows.map(c=>{const i=c.investigation;return <article className="candidate" key={c.id}>
      <span className="candidate-origin">{c.origin}{c.kev?<em>Known exploited upstream</em>:null}</span><h3>{c.title}</h3>
      <div className={"investigation-state "+(i?.state??"pending")}>{i?labels[i.state]:"Awaiting assessment"}{i?.priority==="high"?<small>Priority review</small>:null}</div>
      <p className="investigation-summary">{i?.summary??"No evidence assessment has been recorded. Cisco applicability remains unknown."}</p>
      {i?<><div className="investigation-outcome"><strong>{i.assessmentIds.length} individual claims in the ledger</strong><span>{i.packages.length} package groups · {i.products.length} product-status rows</span></div>
        {i.gaps.length?<div className="investigation-gap"><strong>Evidence still needed</strong><ul>{i.gaps.map(g=><li key={g}>{g}</li>)}</ul></div>:null}
        <div className="investigation-action"><strong>Next action</strong><p>{i.nextAction}</p></div>
        {i.products.length||i.packages.length?<details><summary>Product and package evidence</summary>{i.products.length?<div className="investigation-table"><table><thead><tr><th>Product / component</th><th>Branch</th><th>Affected</th><th>Vendor fix</th></tr></thead><tbody>{i.products.map((p,n)=><tr key={n}><td>{p.product}{p.component?` / ${p.component}`:""}</td><td>{p.branch}</td><td>{p.affected}</td><td>{p.fixed}</td></tr>)}</tbody></table></div>:null}<p className="scope-caution">These vendor table rows describe product scope. Package footnotes may narrow applicability, exclude branches, or require additional cleanup.</p>{i.packages.map((p,n)=><div className="package-evidence" key={n}><strong>{p.component} · {p.severity}</strong><span>{p.remedy} · note {p.note||"unresolved"}</span><small>{p.cves.join(", ")||"Individual CVEs not parsed; source review required"}</small></div>)}</details>:null}
        {i.assessmentIds.length?<details><summary>Open scoped claims ({i.assessmentIds.length})</summary><div className="candidate-cves">{i.assessmentIds.map(id=>{const r=snapshot.records.find(r=>r.id===id);return r?<button key={id} onClick={()=>onOpenAssessment(id)}>{r.cve} · {r.component}</button>:null;})}</div></details>:null}
        <div className="investigation-evidence">{i.evidence.map(e=><a key={e.id} href={e.url} target="_blank" rel="noopener noreferrer">{e.name} · {e.section}<ArrowUpRight size={13}/></a>)}</div>
      </>:null}
      <div className="candidate-foot"><span>{i?`Assessed ${date(i.assessedAt)}`:`Discovered ${date(c.discoveredAt)}`}</span><a href={c.url} target="_blank" rel="noopener noreferrer">Open source <ArrowUpRight size={15}/></a></div>
    </article>;})}{!rows.length?<div className="empty-state wide"><GitBranch size={32}/><h3>No entries in this view.</h3><p>This is a queue filter, not a determination of Cisco safety or complete portfolio coverage.</p></div>:null}</div>
  </>;
}
