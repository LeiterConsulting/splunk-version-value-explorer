/* Deterministic decision model shared by screen, print and preserved briefs. */
(function () {
  'use strict';
  const ai=window.VersionCompassAIAvailability, esc=ai.esc, registry=window.VersionCompassAdvisorGoals;
  const goals=Object.fromEntries(registry.goals.map(goal=>[goal.id,goal.title]));
  const legacy={
    'itsi-assistant':{title:'The earlier ITSI assistance decision',detail:'This earlier link asked about assistance availability. The revised decision checks documented dependencies; subagent-specific regional rollout remains unresolved.',replacement:'itsi-versions'},
    'ingest-pressure':{title:'Ingest-pressure advice is not covered',detail:'Reported pressure does not establish a cause or a supported licensing, sizing or operational remedy. No new assessment has been made.'},
    stay:{title:'A general keep-current verdict is not covered',detail:'A preference to keep the current environment is not evidence that no change is needed. No readiness, health or broad compatibility assessment has been made.'}
  };
  const choices={
    deployment:{unknown:'Unknown',enterprise:'Enterprise / Cloud Connected CMP',cloud:'Splunk Cloud'},
    compliance:{unknown:'Unknown',commercial:'Commercial service','fr-m':'FedRAMP Moderate','fr-h':'FedRAMP High'},
    edition:{unknown:'Unknown',essentials:'ES Essentials',premier:'ES Premier'},
    access:{unknown:'Unknown / not checked',yes:'Reported confirmed',no:'Reported not confirmed'}
  };
  const labels={deployment:'Deployment',compliance:'Service environment',edition:'ES edition',access:'Access and enablement',region:'AI service location',platformVersion:'Platform version',itsiVersion:'ITSI version',saiaVersion:'SAIA app version',mcpVersion:'Splunk MCP Server version',esVersion:'ES version',cloudConnectVersion:'Cloud Connect version'};
  const defaults={goal:'unknown',deployment:'unknown',compliance:'unknown',region:'unknown',edition:'unknown',access:'unknown',platformVersion:'',itsiVersion:'',saiaVersion:'',mcpVersion:'',esVersion:'',cloudConnectVersion:''};
  const definition=id=>registry.goals.find(goal=>goal.id===id);
  function normalize(input={}) {
    const state={...defaults};
    for(const key of Object.keys(state))if(typeof input[key]==='string')state[key]=input[key].slice(0,40);
    if(!Object.hasOwn(goals,state.goal)&&!Object.hasOwn(legacy,state.goal))state.goal='unknown';
    for(const [key,values]of Object.entries(choices))if(!Object.hasOwn(values,state[key]))state[key]='unknown';
    if(!['unknown','other'].includes(state.region)&&![...ai.data().saiaRegions,...(ai.data().agentModeRegions||[])].includes(state.region))state.region='other';
    return state;
  }
  function read(search) {
    const params=new URLSearchParams(search),errors=[];
    for(const key of new Set(params.keys())){
      if(!['view','goal','theme'].includes(key))errors.push('The field "'+key+'" is not part of an Advisor link. Private context is not read from URLs.');
      if(params.getAll(key).length!==1)errors.push('The field "'+key+'" appears more than once.');
    }
    if(params.get('view')!=='advisor')errors.push('This link does not identify Advisor.');
    const goal=params.get('goal')||'unknown';
    if(goal!=='unknown'&&!Object.hasOwn(goals,goal)&&!Object.hasOwn(legacy,goal))errors.push('This decision is not recognized.');
    if(params.has('theme')&&params.get('theme')!=='cisco')errors.push('This theme is not recognized.');
    return {state:normalize({goal}),errors,legacy:Object.hasOwn(legacy,goal)?legacy[goal]:null,original:search};
  }
  function url(state,theme='') {
    const p=new URLSearchParams({view:'advisor'});
    if(Object.hasOwn(goals,state.goal)||Object.hasOwn(legacy,state.goal))p.set('goal',state.goal);
    if(theme==='cisco')p.set('theme',theme);
    return '/?'+p;
  }
  function resolve(ref) {
    const [kind,key]=ref.split(':');
    return kind==='capability'?ai.data().capabilities.find(row=>row.id===key):kind==='source'?ai.source(key):kind==='policy'?ai.data()[key]:kind==='environment'?window.VersionCompassEnvironmentData[key]:undefined;
  }
  function admission(goal) {
    const ids=window.VersionCompassAdvisorAdmission?.goals[definition(goal)?.admission]||[];
    const claims=ids.map(id=>window.VersionCompassAdvisorAdmission.claims.find(claim=>claim.id===id));
    const rejected=claims.filter(claim=>!claim||!window.VersionCompassHash||resolve(claim.ref)===undefined||window.VersionCompassHash(JSON.stringify(resolve(claim.ref)))!==claim.sha256);
    return {ok:ids.length>0&&!rejected.length,claims:rejected.length?[]:claims,rejected:rejected.map(claim=>claim?.id||'Missing dependency')};
  }
  function version(value){return /^\d{1,3}\.\d{1,3}(?:\.\d{1,3}){0,2}$/.test(value)?value.split('.').map(Number):null;}
  function floor(value,minimum){
    const current=version(value),required=version(minimum);if(!current||!required)return 'unknown';
    for(let i=0;i<Math.max(current.length,required.length);i++){const delta=(current[i]||0)-(required[i]||0);if(delta)return delta>0?'meets':'below';}
    return 'meets';
  }
  function fields(state){
    return (definition(state.goal)?.inputs||[]).filter(key=>{
      if(state.goal==='agent-mode'&&key==='platformVersion')return state.deployment!=='unknown';
      if(key==='saiaVersion'&&state.goal!=='itsi-versions')return state.deployment==='enterprise';
      if(state.goal==='soc-workflow'&&['platformVersion','esVersion'].includes(key))return state.deployment!=='unknown';
      if(key==='cloudConnectVersion')return state.deployment==='enterprise';
      return true;
    });
  }
  function date(value){return /^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value+'T00:00:00Z'))?value:null;}
  function review(goal,now=new Date().toISOString()){
    const admitted=admission(goal),day=new Date(now).toISOString().slice(0,10);
    if(!admitted.ok)return {status:'changed',ok:false,day,sources:[],assessed:[],checked:[],due:null,rejected:admitted.rejected};
    const sources=[...new Set(admitted.claims.flatMap(claim=>claim.sources||[]))].map(id=>({id,...ai.source(id)}));
    const record=resolve('capability:'+definition(goal).record),checked=sources.map(s=>date(s.checked)),assessed=[date(record?.verified),...sources.map(s=>date(s.reviewed))];
    if(checked.includes(null)||assessed.includes(null)||[...checked,...assessed].some(d=>d>day))return {status:'undated',ok:false,day,sources,assessed,checked,due:null};
    const add=(d,days)=>new Date(Date.parse(d+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);
    const due=[...checked.map(d=>add(d,registry.reviewPolicy.sourceCheckDays)),...assessed.map(d=>add(d,registry.reviewPolicy.claimAssessmentDays))].sort()[0];
    return {status:day>due?'overdue':'recorded',ok:day<=due,day,sources,checked:[...new Set(checked)].sort(),assessed:[...new Set(assessed)].sort(),due,claims:admitted.claims};
  }
  function handoff(input,now=new Date().toISOString()){
    const s=normalize(input),line=version(s.platformVersion)?.slice(0,2).join('.');
    if(s.goal!=='agent-mode'||s.deployment!=='enterprise'||s.compliance!=='commercial'||floor(s.platformVersion,'10.4.0')!=='below'||!line||!review('agent-mode',now).ok)return null;
    return {schemaVersion:1,goal:'agent-mode',reportedVersion:s.platformVersion,releaseLine:line,documentedMinimum:'10.4.x+',createdAt:new Date(now).toISOString(),expiresAt:new Date(Date.parse(now)+10*60000).toISOString()};
  }
  function evaluate(input,options={}){
    const state=normalize(input),goal=definition(state.goal),now=options.now||new Date().toISOString();
    const r={state,goal,createdAt:new Date(now).toISOString(),status:'start',title:'Choose a decision to begin',summary:'See what this build can answer before adding your context.',established:[],checks:[],missingFacts:[],missingEvidence:[],conflicts:[],history:[],actions:[],sources:[],record:null,authorization:'not_established'};
    if(Object.hasOwn(legacy,state.goal))return {...r,status:'not_covered',title:legacy[state.goal].title,summary:legacy[state.goal].detail,legacy:legacy[state.goal]};
    if(!goal)return r;
    r.review=review(state.goal,now);
    if(!r.review.ok){
      r.status='needs_review';r.title='This decision needs an evidence review';
      r.summary=r.review.status==='changed'?'A supporting claim or source no longer matches the assessed record. This decision is paused; changed content is not used as fresh evidence.':'The recorded evidence is overdue or missing a review date. This brief cannot establish a current decision path.';
      r.missingEvidence.push({text:'The affected claim and its supporting section need reassessment.',impact:'A stored content match proves identity, not that the upstream documentation is unchanged.'});
      r.actions.push({title:'Request a scoped evidence review',detail:'The existing '+goal.owners.join(', ')+' owners maintain this decision. Review changed or overdue dependencies before offering a path.'});
      return r;
    }
    r.sources=r.review.sources;r.record=JSON.parse(JSON.stringify(resolve('capability:'+goal.record)));r.status='needs_facts';r.title='Confirm the context that affects this decision';
    r.summary='The assessed documentation establishes the points below. Your environment has not been inspected.';
    const fact=(text,impact)=>r.missingFacts.push({text,impact}),evidence=(text,impact,sourceIds=[])=>r.missingEvidence.push({text,impact,sourceIds}),established=(text,sourceIds)=>r.established.push({text,sourceIds}),action=(title,detail,sourceIds=[])=>r.actions.push({title,detail,sourceIds});
    const check=(field,minimum,sourceIds)=>{const outcome=floor(state[field],minimum);r.checks.push({field,label:labels[field],reported:state[field]||'Unknown',minimum,outcome,sourceIds});if(outcome==='unknown')fact('Confirm the installed '+labels[field].toLowerCase()+'.','Use its exact numeric version; an unknown or unrecognized value is not treated as meeting a minimum.');};
    if(state.goal==='itsi-versions'){
      established('The assessed ITSI integration documents ITSI 5.0.0+, SAIA 2.2.0+ and Splunk MCP Server 1.2.1+.',['aiSaiaAbout240']);
      check('itsiVersion','5.0.0',['aiSaiaAbout240']);check('saiaVersion','2.2.0',['aiSaiaAbout240']);check('mcpVersion','1.2.1',['aiSaiaAbout240']);
      evidence('Subagent-specific regional rollout is not established.','A listed base-assistant service region cannot establish ITSI subagent availability.',['aiSaiaAbout240','aiSaiaInstall']);
      evidence('These three minimums do not establish a supported complete app/Platform pairing.','Keep exact pairing, enabled tools and user permissions as separate verification steps.',['aiSaiaAbout240']);
      action('Compare the installed dependency versions','Resolve each documented gap using the exact app and Platform compatibility documentation. A minimum is not a recommended upgrade target.',['aiSaiaAbout240']);
      action('Confirm the complete integration before enabling it','Verify app pairing, enabled tools and permissions, then obtain capability-specific regional evidence. Do not infer availability from the base assistant.',['aiSaiaAbout240','aiSaiaInstall']);
    }else{
      if(state.deployment==='unknown')fact('Confirm whether this is Cloud or customer-managed Enterprise.','Documented version requirements depend on the deployment path.');
      if(state.compliance==='unknown')fact('Confirm the service environment.','Commercial evidence cannot establish a regulated offering or customer authorization.');
      if(state.access!=='yes')fact('Confirm capability access and enablement with your organization and Splunk.','Your report does not establish a license, entitlement or customer authorization.');
      if(state.compliance!=='commercial')evidence('This decision does not establish the capability for a regulated or unknown service environment.',state.goal==='agent-mode'?'The limited IL2 assistant excludes Agent Mode. The 2.4.0 release notes explicitly exclude Agent Mode from supported FedRAMP High core functionality.':'Capability-specific regulated rollout and customer authorization are not established by the commercial workflow.',state.goal==='agent-mode'?['aiSaiaInstall240','aiSaiaRelease240']:['aiEsAgents88']);
      if(state.goal==='agent-mode'){
        const enterprise=state.deployment==='enterprise';
        established('The Agent Mode feature lists Platform 10.1.x+, a supported AWS service region and administrator-enabled Model Runtime. The 2.4.0 Enterprise installation has additional requirements.',['aiSaiaAgentMode240','aiSaiaCloudConnected240']);
        if(enterprise){
          check('platformVersion','10.4.0',['aiSaiaCloudConnected240']);
          check('saiaVersion','2.4.0',['aiSaiaRelease240','aiSaiaCloudConnected240']);
          check('cloudConnectVersion','2.0.0',['aiSaiaCloudConnected240']);
          established('The published 2.4.0 Enterprise path uses Cloud Connect 2.0+ and a fresh setup. It requires a qualifying paid license, outbound HTTPS, token certificate setup, administrator permissions and a verified license-domain email. Previous chat history does not migrate.',['aiSaiaCloudConnected240','aiSaiaRelease240']);
          r.history.push({title:'Earlier app versions use different rules',text:'SAIA-9918 excludes Cloud Connected on 2.2.0–2.3.6. Its 2.1.1 fallback lacks Agent Mode. The 2.4.0 known-issues entry still calls the release planned while the release notes and installer document the new path.',sourceIds:['aiSaiaKnownIssues','aiSaiaKnownIssues240','aiSaiaRelease240','aiSaiaCloudConnected240']});
          action('Verify the installed Cloud Connect pairing','Confirm that the exact app versions and installation match the dedicated installer, including a supported AWS region and activation. The listed combination is SAIA 2.4.0, Cloud Connect 2.0.0 and Enterprise 10.4.x or higher.',['aiSaiaCloudConnected240']);
        }else if(state.deployment==='cloud'){
          check('platformVersion','10.1.0',['aiSaiaAgentMode240']);
          action('Verify the supported app/Platform pairing and activation','Confirm the exact feature-specific AWS location, Model Runtime policy and administrator activation.',['aiSaiaAgentMode240','aiSaiaModelRuntime240']);
        }
        if(state.region==='unknown')fact('Confirm where the assistant’s AI service would run.','The AI service location can differ from the deployment location.');
        else if(!ai.data().agentModeRegions?.includes(state.region))evidence('The reported AI service location is not in the feature’s AWS list.','Base SAIA and Model Runtime regions cannot establish Agent Mode support here.',['aiSaiaAgentMode240','aiSaiaModelRuntime240']);
        else established('The selected AWS AI service location is listed for Agent Mode. Tenant activation and model routing require separate verification.',['aiSaiaAgentMode240']);
        evidence('Model Runtime and administrator enablement still need confirmation.','Model Runtime is required. Its Data zone and Global options can route beyond the selected region and use external models. The installer’s no-third-party language and Model Runtime’s external-processing guidance apply to different scopes.',['aiSaiaAgentMode240','aiSaiaModelRuntime240','aiSaiaCloudConnected240']);
        evidence('Exact app pairing and tenant access require verification.','An installed app and a met minimum do not establish entitlement, routing or tenant activation.',['aiSaiaAbout240','aiSaiaInstall240']);
      }else{
        established('Triage requires Premier and documented enablement. Autonomous Response has separate Controlled Availability, paired SOAR, frontier-model and permission requirements. Splunk documents ES 8.8 General Availability from November 4, 2026. Confirm component access and enablement separately.',['aiEsAgents88','aiEsAutonomousResponse88','aiEsRelease88']);
        if(state.edition==='unknown')fact('Confirm the ES edition.','The aggregate workflow’s Premier requirement is separate from subcomponent entitlement.');
        if(state.edition==='essentials')evidence('The assessed aggregate workflow row specifies Premier.','Do not infer access to the whole workflow from a component or earlier edition wording.',['aiEsAgents88','aiEsTriageNote88']);
        if(state.deployment==='enterprise'){
          established('The assessed CMP path requires Platform 10.4.x+, ES 8.8+, Cloud Connect 2.0+ and SAIA 2.4+. ES 8.8 requires a separate Cloud Connect download.',['aiEsAgents88','aiEsTriageTask88']);
          check('platformVersion','10.4.0',['aiEsAgents88']);check('esVersion','8.8.0',['aiEsAgents88']);check('cloudConnectVersion','2.0.0',['aiEsAgents88']);check('saiaVersion','2.4.0',['aiEsCloudConnectAgentic88','aiSaiaCloudConnected240']);
          r.conflicts.push({title:'Autonomous Response availability on CMP is unresolved',text:'Its ES 8.8 availability cell says Premier Cloud only while its compatibility bullets and task include a CMP path. Triage has a separate Premier CMP row.',impact:'Confirm access for Autonomous Response separately from Triage setup.',scope:'CMP Autonomous Response',affectsDecision:true,sourceIds:['aiEsAgents88','aiEsAutonomousResponse88']});
        }else if(state.deployment==='cloud'){
          check('platformVersion','10.2.0',['aiEsAgents88','aiEsTriageTask88']);
          const aggregate=floor(state.esVersion,'8.6.0'),task=floor(state.esVersion,'8.7.0');
          const reportedNote=aggregate==='unknown'?'An exact reported version is needed to compare either statement.':task==='meets'?'The reported version is numerically at or above both stated minimums. That does not settle the wording or establish the full pairing.':aggregate==='below'?'The reported version is below both stated minimums. A supported change needs review; neither minimum is a recommended target.':'The reported version meets the aggregate minimum but is below the task-guide minimum. Do not choose the lower statement as sufficient.';
          r.checks.push({field:'esVersion',label:labels.esVersion,reported:state.esVersion||'Unknown',minimum:'8.6+ aggregate / 8.7+ task guide',outcome:'conflicting',belowBoth:aggregate==='below',reportedNote,sourceIds:['aiEsAgents88','aiEsTriageTask88']});
          if(!version(state.esVersion))fact('Confirm the ES version.','The documented minima still require clarification even when the installed version is known.');
        }
        r.conflicts.push({title:'Current Cloud ES minimum differs between sources',text:'The ES 8.8 aggregate table lists Cloud ES 8.6+, while the detailed ES 8.8 Triage task guide requires ES 8.7+.',impact:'Do not select the lower value as an upgrade target. Clarify the exact workflow and supported Cloud pairing with Splunk.',scope:'Cloud workflow only',affectsDecision:state.deployment!=='enterprise',sourceIds:['aiEsAgents88','aiEsTriageTask88']});
        r.conflicts.push({title:'Triage limits differ within ES 8.8',text:'The parent guide describes 200 analyses per tenant per day and up to 20 revisions per investigation per day. The detailed task describes the first 10 findings, approximately 200 findings per tenant per day and no rerun.',impact:'Clarify the quota unit and revision behavior before depending on either limit.',scope:'Triage behavior',affectsDecision:false,sourceIds:['aiEsSocTask88','aiEsTriageTask88']});
        r.history.push({title:'Earlier Triage wording has been corrected',text:'The November 2 scoped review found that the current note no longer explicitly assigns Triage to Essentials and names Premier in the SOC analyst description. The earlier Essentials wording is historical; exact subcomponent entitlement remains unestablished.',sourceIds:['aiEsTriageNote88','aiEsEditions']});
        evidence('Exact paired-SOAR compatibility and agent-specific regional rollout remain unestablished here.','Neither an aggregate component table nor a hosting region establishes the whole workflow.',['aiEsAgents88','aiEsSocTask88','aiEsRegions88']);
        action('Resolve the exact workflow and deployment prerequisites','Keep the Cloud discrepancy separate from the CMP chain. Confirm paired SOAR, component enablement and model support, the conflicting Triage analysis/revision limits, and inherited connector/asset permissions.',['aiEsSocTask88','aiEsAgents88']);
      }
    }
    const below=r.checks.filter(row=>row.outcome==='below'||row.belowBoth);
    const outsideScope=state.goal!=='itsi-versions'&&(state.compliance==='fr-h'||state.compliance==='fr-m'||state.goal==='agent-mode'&&state.region!=='unknown'&&!ai.data().agentModeRegions?.includes(state.region)||state.goal==='soc-workflow'&&state.edition==='essentials');
    if(outsideScope){r.status='not_established';r.title='This context is not established by the assessed evidence';}
    else if(r.conflicts.some(item=>item.affectsDecision)){r.status='conflicting';r.title='Clarify the conflicting workflow requirement';}
    else if(below.length){r.status='version_gap';r.title='A documented version gap needs attention';}
    else if(r.missingFacts.length){r.status='needs_facts';r.title='Complete the facts that affect this decision';}
    else if(state.goal==='itsi-versions'){r.status='no_change';r.title='No version gap found for these three minimums';}
    else{r.status='conditional';r.title='The reported prerequisites support further verification';}
    if(state.goal==='itsi-versions'&&r.status==='no_change')r.summary='Your reported versions meet these three documented minimums. No version uplift is indicated by that comparison alone; complete pairing, availability, permissions and entitlement remain separate.';
    if(below.length)action('Plan a supported change, not just a minimum-version jump','The documented minimum identifies a prerequisite gap. Review supported transitions and exact app compatibility before choosing a target; Advisor does not recommend the minimum as your target.');
    if(!outsideScope&&state.goal==='agent-mode'&&state.compliance==='commercial'&&below.some(row=>row.field==='platformVersion')){
      r.handoff=handoff(state,now);
      if(r.handoff)r.actions.unshift({title:'Review Enterprise upgrade options with this context',detail:'Carry the reported current version to a private note in the Release Guide. Choose the comparison and target yourself; the shared Advisor link excludes your profile.',handoff:true});
    }
    return r;
  }
  window.VersionCompassAdvisor={registry,goals,legacy,choices,labels,defaults,definition,normalize,read,url,resolve,admission,version,floor,fields,review,evaluate,handoff,esc};
}());
