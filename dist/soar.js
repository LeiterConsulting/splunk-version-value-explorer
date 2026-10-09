/* Pure SOAR assessment shared by screen and complete reports. */
(function(){
'use strict';
const d=window.VersionCompassSOARData;
const defaults={deployment:'cmp',from:'8.6.0',to:'8.7.0',installation:'unprivileged',os:'unspecified',compliance:'commercial',provider:'unspecified',region:'unspecified'};
const options={deployment:['cmp','cloud'],installation:['unprivileged','privileged'],os:['unspecified','supported','rhel7','centos7','al2'],compliance:['commercial','fr-m','fr-h'],provider:['unspecified','aws','gcp','azure'],region:['unspecified',...new Set(Object.values(d.regions).flat())]};
const cmp=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;};
function selectable(k,s){if(k==='from')return (d.releases[s.deployment]||[]).filter(v=>cmp(v,s.to)<0);if(k==='region')return s.compliance==='commercial'&&s.provider!=='unspecified'?['unspecified',...(d.regions[s.provider]||[])]:['unspecified'];if(k==='provider'&&s.compliance==='fr-m')return ['unspecified','aws'];return k==='to'?d.targets:options[k];}
function validate(s){const errors=[];for(const k of Object.keys(defaults)){const allowed=k==='from'?d.releases[s.deployment]||[]:k==='to'?d.targets:options[k];if(!allowed.includes(s[k]))errors.push('Unrecognized '+k+': '+s[k]);}if(!errors.length&&cmp(s.from,s.to)>=0)errors.push('Choose a target newer than the current release.');return errors;}
function read(search){const p=new URLSearchParams(search),state={...defaults},errors=[];if(p.has('platform')){if(p.getAll('platform').length>1||!['enterprise','cloud'].includes(p.get('platform')))errors.push('Unrecognized or repeated platform selection.');else if(!p.has('deployment'))state.deployment=p.get('platform')==='cloud'?'cloud':'cmp';else if((p.get('platform')==='cloud'?'cloud':'cmp')!==p.get('deployment'))errors.push('Conflicting deployment and platform selections.');}for(const k of Object.keys(defaults)){if(p.getAll(k).length>1)errors.push('Repeated '+k+' selection.');if(p.has(k))state[k]=p.get(k);}if(p.getAll('product').length>1)errors.push('Repeated product selection.');if(p.has('from')!==p.has('to'))errors.push('The shared link must include both current and target releases.');return {state,errors:[...errors,...validate(state)]};}
function url(s){const p=new URLSearchParams({product:'soar'});for(const k of Object.keys(defaults))p.set(k,s[k]);return '?'+p;}
function assess(s){const errors=validate(s);if(errors.length)return {selection:{...s},errors,path:[],features:[],requirements:[],technical:[],issues:[]};
 const cloud=s.deployment==='cloud',high=s.compliance==='fr-h',moderate=s.compliance==='fr-m',restricted=cloud&&(high||moderate),pathSource=s.to==='8.7.0'?'path87':'path86';
 const path=[s.from],conditions=[],questions=[];
 let routeStatus=cloud?'Managed service milestones':'Documented with conditions';
 if(!cloud&&s.installation==='privileged'){routeStatus='Path not established';questions.push('Which conversion path applies to this exact privileged build? Use the privileged-installation guide before selecting an unprivileged route.');}
 else if(!cloud){
  if(cmp(s.from,'6.2.1')<0)path.push('6.2.1');
  if(cmp(s.from,'6.2.2')<0)conditions.push('For a cluster or external PostgreSQL 11.x database, manually upgrade PostgreSQL to 15.x at the documented bridge.');
  if(cmp(s.from,'6.3.1')<0)conditions.push('If still on RHEL 7 or CentOS 7, migrate the OS at the documented step before continuing.');
  if(cmp(s.from,'6.4.1')<0){conditions.push('Amazon Linux 2 requires SOAR 6.4.0, then OS migration, before continuing.');if(s.os==='al2'&&!path.includes('6.4.0'))path.push('6.4.0');}
  if(s.to==='8.7.0'&&cmp(s.from,'7.0.0')<0)path.push('8.5.0');
  if(s.to==='8.7.0')conditions.push('Complete Python 3.13 automation migration before the final 8.7 step.');
  path.push(s.to);
  if(['rhel7','centos7','al2'].includes(s.os)&&cmp(s.from,'6.4.1')>=0)questions.push('The selected legacy OS is inconsistent with this recent source release. Confirm the actual OS and migration history before using the route.');
 }else{path.push(s.to);conditions.push('Splunk manages the service update. The release interval is a capability comparison, not a customer-executed installation path or confirmed tenant rollout.');}
 if(!cloud&&s.os==='unspecified')questions.push('What exact OS, database topology and installed build are in use? Conditional migration steps remain applicable until checked.');

 const applicable=d.records.filter(r=>r.deployments.includes(s.deployment)&&cmp(r.release,s.to)<=0);
 const inRange=r=>cmp(r.release,s.from)>0;
 const target=r=>r.target&&(r.release===s.to||r.id==='security86');
 const selected=applicable.filter(r=>(!['os86','size86','os87','size87'].includes(r.id)||r.release===s.to)&&(inRange(r)||target(r))).map(r=>({...r,src:r.src.includes('cloud')&&r.src.some(x=>/^on/.test(x))?r.src.filter(x=>cloud?x==='cloud':x!=='cloud'):r.src}));
 const features=selected.filter(r=>r.kind==='feature').map(r=>({...r,status:restricted?'Not established for selected environment':r.status,qualification:restricted?'Commercial release evidence does not establish this feature in '+(high?'FedRAMP High':'FedRAMP Moderate')+'. Confirm exact feature, region, entitlement and tenant release.':''}));
 let availability={status:'Customer-managed',detail:'CMP means customer-managed SOAR, on premises or in your cloud. Hosting it yourself does not establish a FedRAMP authorization.',src:[pathSource]};
 if(cloud){
  availability={status:'Conditional',detail:'Current commercial hosting evidence: select a provider and region. Confirm tenant rollout and entitlement separately; regions are current service evidence, not historical release dates.',src:['regions']};
  if(high){availability={status:'Not established',detail:'The exact High Marketplace Certified Services list does not name SOAR. Absence is not an exclusion claim, so High remains not established; Cloud Platform, ES and ITSI scope is not inherited by SOAR.',src:['fedrampHigh','restricted']};questions.push('Does the exact SOAR offering and feature belong to the required FR-H authorization boundary? Obtain explicit public evidence.');}
  else if(moderate){availability={status:'Certified offering; conditions apply',detail:'The exact Moderate Marketplace CSO names Splunk SOAR as a Certified Service. Restricted-environment guidance documents AWS GovCloud, FIPS mode, playbook restrictions and native-data migration limits. Feature, tenant, entitlement and individual customer authorization scope remain separate.',src:['fedrampModerate','restricted']};if(s.provider!=='unspecified'&&s.provider!=='aws')availability.status='Not supported by cited scope';if(s.region!=='unspecified')questions.push('Commercial region selection does not identify a GovCloud destination. Confirm the exact FedRAMP Moderate region and tenant.');}
  else if(s.provider!=='unspecified'&&s.region!=='unspecified')availability.status=d.regions[s.provider].includes(s.region)?'Region listed; confirm rollout':'Not established for this region';
 }
 if(restricted)questions.push('Which selected features are enabled in this restricted tenant? Product availability alone does not establish individual feature availability.');
 questions.push('Confirm the exact ES, Splunk App for SOAR, Export, connector and Automation Broker versions together; each has separate compatibility evidence.');
 const issues=selected.filter(r=>r.kind==='issue').map(r=>r.id==='security86'&&!cloud?{...r,qualification:'For existing affected CyberArk REST credential-manager configurations, enable certificate verification after the upgrade.'}:r);
 issues.push({id:'issue-coverage',title:'Issue inventory is incomplete',detail:'The current known/fixed issue pages did not expose complete rows during this check. Keep their official links and review them directly; this is not a claim of zero issues.',status:'Evidence gap',src:cloud?['cloudKnown']:s.to==='8.6.0'?['known86','fixed86']:['known','fixed'],verified:null});
 return {selection:{...s},errors,path:s.installation==='privileged'&&!cloud?[]:path,routeStatus,pathSource:cloud?'cloud':s.installation==='privileged'?'prepare':pathSource,conditions,questions,availability,features,requirements:selected.filter(r=>r.kind==='requirement'),technical:selected.filter(r=>r.kind==='technical'),targetRequirements:d.targetRequirements[s.to],issues,coverage:'Initial coverage: selected source releases to 8.6/8.7; bounded claim checks on October 1, 2026. Exact builds, legacy conversions and complete issue inventories require the cited guidance.',sources:d.sources};
}
window.VersionCompassSOAR={defaults,options,selectable,validate,read,url,assess};
}());
