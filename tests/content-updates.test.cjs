const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('dist/content-updates.js','utf8'),{window});const b=window.VersionCompassUpdates;

test('change badges expire after two material cycles, not elapsed days',()=>{
 const e={cycle:5};assert(!b.active(e,4));assert(b.active(e,5));assert(b.active(e,6));assert(!b.active(e,7));assert(!b.active(e,100));
});

test('badges are explicit, qualified and printable with evidence',()=>{
 assert.equal(b.html('unknown'),'');
 for(const [key,e] of Object.entries(b.entries)){
  assert(e.source.startsWith('https://'));assert.match(e.date,/^\d{4}-\d{2}-\d{2}$/);
  const h=b.html(key,{milestone:e.milestones?.[0]});
  if(!b.active(e)){assert.equal(h,'');continue;}
  assert(h.includes(e.source));assert(h.includes('content-change-print'));assert(h.includes('aria-label'));assert(h.includes(e.version));
 }
 const deprecation=b.entries['technical:observability:Browser RUM navigation configuration'];assert.match(deprecation.detail,/remains functional/);assert.match(deprecation.detail,/not removal/);
});

test('material cycle preserves scoped release evidence and prior cycle provenance',()=>{
 assert.equal(b.policy.currentCycle,70);
 for(const scope of ['moderate','high']){const s3=b.entries['environment:s3-'+scope];assert.equal(s3.cycle,70);assert(b.active(s3));assert(s3.source.endsWith('#restrictions-0'));}
 const israel=b.entries['environment:victoria-aws-israel'];assert.equal(israel.cycle,69);assert.equal(israel.sourceDate,'2026-11-06');assert(b.active(israel));
 const esWindow=b.entries["technical:es:ES 8.8 Mission Control migration window"];
 assert.equal(esWindow.cycle,67);assert(b.active(esWindow,68));assert(!b.active(esWindow));assert.equal(esWindow.sourceDate,null);
 const cloud104=b.entries['technical:platform:Cloud 10.4.2604.18 maintenance patch'];
 assert.equal(cloud104.cycle,63);assert.equal(cloud104.sourceDate,'2026-11-06');assert(b.active(cloud104,64));assert(!b.active(cloud104));
 const cloud105Patch=b.entries['technical:platform:Cloud 10.5.2605.16 maintenance patch'];
 assert.equal(cloud105Patch.cycle,64);assert.equal(cloud105Patch.sourceDate,'2026-11-06');assert(b.active(cloud105Patch,65));assert(!b.active(cloud105Patch));
 for (const build of ['10.5.2605.17','10.6.2.4','10.7.0.6']) {
  const patch=b.entries['technical:platform:Cloud '+build+' maintenance patch'];
  assert.equal(patch.cycle,66);assert.equal(patch.sourceDate,'2026-11-12');assert(b.active(patch,67));assert(!b.active(patch));assert(patch.source.endsWith('#'+build+'-0'));
 }
 const ea=b.entries["edition:exposure"];assert.equal(ea.cycle,52);assert(b.active(ea,53));assert(!b.active(ea));
 const soar=b.entries['product:soar:cloud-8.8'];assert.equal(soar.cycle,51);assert(!b.active(soar));assert.match(soar.detail,/November 4 General Availability/);
 const app=b.entries['technical:soar:app88'];assert.equal(app.cycle,53);assert(!b.active(app));
 const pairing=b.entries['edition:soar'];assert.equal(pairing.cycle,58);assert(b.active(pairing,59));assert(!b.active(pairing));assert.match(pairing.detail,/Export 8\.8\.0 functionality-tested/);assert.match(pairing.detail,/native pairing, feature entitlement and regulated authorization separate/);
 const export88=b.entries['technical:soar:export88'];assert.equal(export88.cycle,56);assert(b.active(export88,57));assert(!b.active(export88));assert.equal(export88.sourceDate,'2026-11-04');
 const earlierPairing=b.entries['edition-history:soar:cycle28'];assert.equal(earlierPairing.recordKey,'edition:soar');assert(!b.active(earlierPairing));
 for(const key of ['prep11:prep11-workload-baseline','prep11:prep11-cloud-option']){assert.equal(b.entries[key].cycle,49);assert(b.active(b.entries[key],50));assert(!b.active(b.entries[key]));assert.equal(b.entries[key].sourceDate,null);}
 for(const key of ['ai:triage-note','soar:broker-ha88']){assert.equal(b.entries[key].cycle,48);assert(!b.active(b.entries[key]));assert.equal(b.entries[key].sourceDate,null);}
 {const e=b.entries['edition:triage-agent'];assert.equal(e.cycle,50);assert(b.active(e,51));assert.equal(e.sourceDate,null);assert.match(e.detail,/Triage and Response agents/);}
 assert(!b.active(b.entries['ai:es-essentials-regions']));
 const ai=b.entries["ai:catalog"];assert.equal(ai.cycle,50);assert(b.active(ai,51));assert.equal(ai.sourceDate,null);assert.match(ai.detail,/Triage and Response agents/);assert.match(ai.detail,/Splunk AI Assistant 2\.4/);assert.match(ai.detail,/pairing, region, entitlement and authorization stay separate/);
 const aiCycle42=b.entries['ai-history:catalog:cycle42'];assert.equal(aiCycle42.recordKey,'ai:catalog');assert.equal(aiCycle42.cycle,42);assert(!b.active(aiCycle42));assert.match(aiCycle42.detail,/separate Cloud Connect 2\.0 download/);assert.match(aiCycle42.detail,/does not establish an ES 8\.9 release/);
 const aiCycle40=b.entries['ai-history:catalog:cycle40'];assert.equal(aiCycle40.recordKey,'ai:catalog');assert.equal(aiCycle40.cycle,40);assert(!b.active(aiCycle40));assert.match(aiCycle40.detail,/first 10 findings/);
 const aiCycle37=b.entries['ai-history:catalog:cycle37'];assert.equal(aiCycle37.recordKey,'ai:catalog');assert.equal(aiCycle37.cycle,37);assert(!b.active(aiCycle37));assert.match(aiCycle37.detail,/Threat Graph Detection/);
 const soc=b.entries['edition:ai-soc-analyst'];assert.equal(soc.cycle,68);assert(b.active(soc,69));assert(!b.active(soc));assert.match(soc.detail,/cannot rerun/);
 const socHistory=b.entries['edition-history:ai-soc-analyst:cycle50'];assert.equal(socHistory.cycle,50);assert(b.active(socHistory,51));assert.match(socHistory.detail,/Splunk AI Assistant 2\.4/);
 const socCycle42=b.entries['edition-history:ai-soc-analyst:cycle42'];assert.equal(socCycle42.recordKey,'edition:ai-soc-analyst');assert.equal(socCycle42.cycle,42);assert(!b.active(socCycle42));assert.match(socCycle42.detail,/dependency packaging/);
 for(const key of ['edition:connector-builder','edition:malware-reversing','edition:licensing']){const e=b.entries[key];assert.equal(e.cycle,45);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-31\.md/);}
 {const e=b.entries['edition:cloud-connect'];assert.equal(e.cycle,50);assert(b.active(e,51));assert.match(e.detail,/planned/);assert.match(e.note,/2026\/11\/2026-11-04\.md/);}
 const socPrior=b.entries['edition-history:ai-soc-analyst:cycle40'];assert.equal(socPrior.recordKey,'edition:ai-soc-analyst');assert(!b.active(socPrior));assert.match(socPrior.detail,/throughput.*model.*permission/);
 const aiAssistant=b.entries['edition:ai-assistant'];assert.equal(aiAssistant.cycle,50);assert(b.active(aiAssistant,51));assert.match(aiAssistant.detail,/2\.4 Cloud Connected support as planned/);
 const aiCycle33=b.entries['ai-history:catalog:cycle33'];assert.equal(aiCycle33.recordKey,'ai:catalog');assert(!b.active(aiCycle33));assert.match(aiCycle33.detail,/us3/);
 const aiPrior=b.entries['ai-history:catalog:cycle32'];assert.equal(aiPrior.recordKey,'ai:catalog');assert(!b.active(aiPrior));assert.match(aiPrior.detail,/not an upstream launch/);
 for(const key of ['product:soar:cloud-8.8-history-33','feature:observability:Log-based alerting phased rollout']){const e=b.entries[key];assert.equal(e.cycle,33);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-24\.md/);}
 const edition=b.entries['edition:ai'];assert.equal(edition.cycle,34);assert(!b.active(edition));assert.equal(edition.kind,'corrected');assert.match(edition.detail,/Triage edition conflict/);
  const threatGraph=b.entries['edition:threat-graph-detection'];assert.equal(threatGraph.cycle,37);assert(!b.active(threatGraph));assert.match(threatGraph.note,/2026\/10\/2026-10-26\.md/);
  const detectionBuilder=b.entries['edition:detection-builder'];assert.equal(detectionBuilder.cycle,50);assert(b.active(detectionBuilder,51));assert.match(detectionBuilder.detail,/only plans 2\.4 Cloud Connected support/);
  const detectionBuilderPrior=b.entries['edition-history:detection-builder:cycle37'];assert.equal(detectionBuilderPrior.recordKey,'edition:detection-builder');assert(!b.active(detectionBuilderPrior));assert.match(detectionBuilderPrior.note,/2026\/10\/2026-10-26\.md/);
 for(const key of ['feature:observability:Java instrumentation 2.33','technical:observability:Java instrumentation baseline']){const e=b.entries[key];assert.equal(e.cycle,43);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-29\.md/);assert.match(e.version,/2\.33\.1/);}
 for(const key of ['feature-history:observability:Java instrumentation 2.33:2026-10-27-cycle39','technical-history:observability:Java instrumentation baseline:2026-10-27-cycle39']){const e=b.entries[key];assert.equal(e.cycle,39);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-27\.md/);assert.match(e.version,/2\.33\.0/);}
 {const e=b.entries['feature:observability:Multi-trace AI comparisons'];assert.equal(e.cycle,39);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-27\.md/);}
 assert.equal(b.entries['technical-history:observability:Java instrumentation baseline:2026-10-13-cycle20'].recordKey,'technical:observability:Java instrumentation baseline');
  const kvBoundary=b.entries['technical:platform:ES cohosted KV Store boundary'];assert.equal(kvBoundary.cycle,36);assert(!b.active(kvBoundary));
 const editionPrior=b.entries['edition-history:ai:cycle28'];assert.equal(editionPrior.recordKey,'edition:ai');assert(!b.active(editionPrior));
 for(const key of ['technical:platform:October 21 Enterprise security advisories','technical:platform:October 21 Enterprise security hardening','technical:platform:October 21 Enterprise third-party package fixes','feature:observability:Kubernetes chart 0.163.1','feature:observability:Collector 0.163.1 security and input patch','technical:observability:Kubernetes chart 0.163 package baseline','product:soar:security-notice-20261021','technical:platform:Enterprise 9.4 October security floor','technical:platform:Enterprise 10.0 October security floor','technical:platform:Enterprise 10.2 October security floor','technical:platform:Enterprise 10.4 October security floor']){assert.equal(b.entries[key].cycle,31);assert(!b.active(b.entries[key]));assert.match(b.entries[key].note,/2026\/10\/2026-10-23\.md/);}
 for(const key of ['compatibility:es:8.8-enterprise','feature:observability:Application-scoped call graph exclusions','feature:observability:Broader parentless-span MetricSets','feature:observability:Metric chart baselines','feature:observability:IBM MQ built-in dashboards','technical:observability:APM call graph package exclusions','technical:observability:APM parentless-span Monitoring MetricSets']){assert.equal(b.entries[key].cycle,30);assert(!b.active(b.entries[key]));assert.match(b.entries[key].note,/2026\/10\/2026-10-22\.md/);}
 for(const key of ['environment:es-attack-commercial','environment:es-hybrid-gov']){assert.equal(b.entries[key].cycle,29);assert(!b.active(b.entries[key]));assert.equal(b.entries[key].kind,'corrected');}
 for(const key of ['feature:es:Investigation aggregation','feature:es:Detection rerun','feature:es:Quick search and advanced filtering','technical:es:ES-SOAR hybrid certificate trust','technical:observability:Collector 0.163.1 Light Prometheus Receiver removal','technical:observability:Collector 0.163.1 Splunk input authorization boundary','technical:observability:Collector 0.163.1 Go and CA security refresh']){assert.equal(b.entries[key].cycle,28);assert(!b.active(b.entries[key]));assert.match(b.entries[key].note,/2026\/10\/2026-10-22\.md/);}
 for(const key of ['environment:o11y-agent-us0','environment:o11y-agent-jp0','environment:o11y-agent-us2','environment-history:platform-ai-high-unknown:cycle27']){assert.equal(b.entries[key].cycle,27);assert(!b.active(b.entries[key]));}
 for(const key of ['technical:platform:Enterprise 10.6 maintenance release','feature:observability:Kubernetes chart 0.163.0','technical:observability:Kubernetes persistent-volume metric defaults','technical:observability:Kubernetes histogram bucket merging']){assert.equal(b.entries[key].cycle,26);assert(!b.active(b.entries[key]));assert.match(b.entries[key].note,/2026\/10\/2026-10-20\.md/);}
 assert.equal(b.entries['feature:observability:Collector 0.163 migration controls'].cycle,25);assert(!b.active(b.entries['feature:observability:Collector 0.163 migration controls']));
 const esKv=b.entries['technical:platform:ES cohosted KV Store boundary'];assert.equal(esKv.cycle,36);assert(!b.active(esKv));assert.match(esKv.detail,/10\.6\.0/);assert.match(esKv.detail,/10\.6\.1\.1/);assert.match(esKv.note,/2026\/10\/2026-10-26\.md/);
 const esKvPrior=b.entries['technical-history:platform:ES cohosted KV Store boundary:cycle25'];assert.equal(esKvPrior.recordKey,'technical:platform:ES cohosted KV Store boundary');assert.equal(esKvPrior.cycle,25);assert(!b.active(esKvPrior));
 for(const key of ['product:soar:export-fips','technical:soar:export871']){assert.equal(b.entries[key].cycle,24);assert(!b.active(b.entries[key]));assert.match(b.entries[key].note,/2026\/10\/2026-10-16\.md/);}
 assert.equal(b.entries["guide:splunk11"].cycle,23);
 assert(!b.active(b.entries["guide:splunk11"]));
 for(const key of ['environment:acs-fr-m','environment:acs-fr-h']){const e=b.entries[key];assert.equal(e.cycle,18);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-10\.md/);}
 assert(!b.active(b.entries['feature:observability:Browser RUM 3.2']));
 const cloudMaintenance=b.entries['technical:platform:Cloud 10.6 maintenance build'];assert.equal(cloudMaintenance.cycle,46);assert(!b.active(cloudMaintenance));assert.equal(cloudMaintenance.version,'Splunk Cloud Platform 10.6.2.2');assert.match(cloudMaintenance.note,/2026\/11\/2026-11-01\.md/);
 for(const build of ['10.6.2.3','10.7.0.5']){
  const patch=b.entries['technical:platform:Cloud '+build+' maintenance patch'];
  assert.equal(patch.cycle,62);assert(b.active(patch,63));assert(!b.active(patch));assert(patch.source.endsWith('#'+build+'-0'));
 }
 const cloudMaintenancePrior=b.entries['technical-history:platform:Cloud 10.6 maintenance build:2026-10-23-cycle31'];assert.equal(cloudMaintenancePrior.recordKey,'technical:platform:Cloud 10.6 maintenance build');assert.equal(cloudMaintenancePrior.version,'Splunk Cloud Platform 10.6.2.0');assert(!b.active(cloudMaintenancePrior));
 const cloud105=b.entries['technical:platform:Cloud 10.5 maintenance build'];assert.equal(cloud105.cycle,46);assert(!b.active(cloud105));assert.equal(cloud105.version,'Cloud 10.5.2605.15');assert.match(cloud105.note,/2026\/11\/2026-11-01\.md/);
 for(const key of ['feature:platform:Machine Data Lake multi-search-head workflows','feature:platform:Continuous Machine Data Lake promotions','feature:platform:Catalog-managed datasets and connections','feature:platform:Custom SMTP','feature:platform:Application-layer forwarder authentication','technical:platform:Federated provider names','technical:platform:Cloud app Python runtime','technical:platform:Forwarder-to-indexer application authentication','technical:platform:Custom SMTP delivery','technical:platform:Cloud 10.7 release documentation versus current service pairing']){const e=b.entries[key];assert.equal(e.cycle,46);assert(!b.active(e));assert.match(e.note,/2026\/11\/2026-11-01\.md/);}
 for(const key of ['feature:observability:Collector 0.164 migration controls','technical:observability:Collector 0.164 Splunk configuration path','technical:observability:Collector 0.164 Smart Agent monitor lifecycle','technical:observability:Collector 0.164 telemetry identity changes','technical:observability:Collector 0.164 filelog checkpoints','technical:observability:Collector 0.164 exporter retry classification']){const e=b.entries[key];assert.equal(e.cycle,47);assert(!b.active(e));assert.match(e.note,/2026\/11\/2026-11-02\.md/);assert.match(e.version,/0\.164\.0/);}
 const cloud105Prior=b.entries['technical-history:platform:Cloud 10.5 maintenance build:2026-10-17-cycle25'];assert.equal(cloud105Prior.recordKey,'technical:platform:Cloud 10.5 maintenance build');assert.equal(cloud105Prior.version,'Cloud 10.5.2605.12');assert(!b.active(cloud105Prior));
 const maintenance=b.entries['technical:platform:Enterprise 10.4 maintenance target'];assert(!b.active(maintenance));assert.equal(maintenance.kind,'updated');
 const detector=b.entries['feature:observability:Detector Optimization'];assert(!b.active(detector));assert.equal(detector.kind,'new');
 for(const key of ['feature:observability:Python instrumentation 2.13.3','technical:observability:Python 2.13.3 auto-instrumentation images and dependency floors','technical:observability:Python PostgreSQL query-to-trace correlation']){const e=b.entries[key];assert.equal(e.cycle,44);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-30\.md/);assert.match(e.version,/2\.13\.3/);}
 for(const key of ['environment-history:s3-moderate:cycle15','environment:machine-data-lake-aws','environment:machine-data-lake-gov','environment:machine-data-lake-gcp','environment:machine-data-lake-azure']){const e=b.entries[key];assert.equal(e.cycle,15);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-09\.md/);}
 for(const key of ['compatibility:es:cloud-current','compatibility:itsi:cloud-current','technical:forwarders:10.6 receiver compatibility','technical:forwarders:Cloud 10.6 receiver compatibility','technical:platform:Cloud 10.6 publication versus stack availability']){const e=b.entries[key];assert.equal(e.cycle,14);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-07\.md/);}
 const offerings=b.entries['environment:es-fr-m-offering'];assert(b.active(offerings,66));assert(!b.active(offerings));assert.equal(offerings.cycle,65);
 const priorOffering=b.entries['environment-history:es-fr-m-offering:cycle55'];assert(b.active(priorOffering,56));assert(!b.active(priorOffering));assert.equal(priorOffering.recordKey,'environment:es-fr-m-offering');
 const kv=b.entries['technical:platform:KV Store database engine'];assert(!b.active(kv));assert.equal(kv.cycle,19);assert.match(kv.detail,/ES-specific/);assert.equal(b.entries['technical-history:platform:KV Store database engine:2026-10-01-cycle5'].recordKey,'technical:platform:KV Store database engine');assert.equal(b.entries['technical-history:platform:KV Store database engine:2026-10-01-cycle6'].cycle,6);
 for(const key of ['feature:observability:Stricter APM not-equal tag filtering','technical:observability:APM not-equal tag filters','feature:observability:Java instrumentation 2.32','feature:observability:Node.js instrumentation 4.12.1','technical:observability:Node.js instrumentation baseline']){const e=b.entries[key];assert.equal(e.cycle,20);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-13\.md/);}
 for(const key of ['technical:platform:Cloud 10.4 maintenance build','feature:observability:Kubernetes chart 0.162.1','technical:observability:Light Prometheus Receiver feature gate','technical:observability:Kubernetes OpAMP Bridge identity','feature-history:observability:Python instrumentation 2.13.2:2026-10-14-cycle21','technical:observability:Python OpAMP client dependency']){const e=b.entries[key];assert.equal(e.cycle,21);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-14\.md/);}
 assert.equal(b.html('technical:observability:Light Prometheus Receiver feature gate',{milestone:'Sep 2026'}),'');
 assert.equal(Boolean(b.html('technical:observability:Light Prometheus Receiver feature gate',{milestone:'Oct 2026'})),b.active(b.entries['technical:observability:Light Prometheus Receiver feature gate']));
 assert.equal(b.entries['technical-history:observability:Node.js instrumentation baseline:2026-10-01-cycle4'].recordKey,'technical:observability:Node.js instrumentation baseline');
 const prior=b.entries['technical-history:platform:Enterprise 10.4 maintenance target:2026-09-26'];assert.equal(prior.recordKey,'technical:platform:Enterprise 10.4 maintenance target');assert.match(prior.note,/2026-09-26\.md/);
});

test('10.6 technical badges never label older or Cloud records',()=>{
 for(const key of ['technical:platform:KV Store database engine','technical:platform:Legacy TLS protocols']){assert.equal(b.html(key,{milestone:'Enterprise 10.4'}),'');assert.equal(b.html(key,{milestone:'Cloud 10.6'}),'');assert(b.entries[key].milestones.includes('Enterprise 10.6'));assert.equal(Boolean(b.html(key,{milestone:'Enterprise 10.6'})),b.active(b.entries[key]));}
});

test('cycle thirteen offering badges expire after two material cycles but retain provenance',()=>{
 for(const key of ['environment-history:es-fr-m-offering:cycle13','environment:es-fr-h-offering','environment-history:itsi-fr-m-offering:cycle13','environment:itsi-fr-h-offering','product-history:soar:fedramp-moderate-offering:cycle13']){const e=b.entries[key];assert(e);assert.equal(e.cycle,13);assert(!b.active(e));assert.match(e.detail,/separate|scope/);assert.equal(b.html(key),'');}
});

test('restored release markers expire after two later material cycles but retain provenance',()=>{
 for(const key of ['feature:observability:Collector 0.162 migration controls','feature:observability:Kubernetes chart 0.162','technical:observability:Collector 0.162 retired receivers and processor names','technical:observability:Collector Windows service identity','technical:observability:Kubernetes chart 0.162 package baseline','technical:observability:Python instrumentation 2.13 patch baseline','product:soar:6.4.1.361-floor']){const e=b.entries[key];assert.equal(e.cycle,16);assert(!b.active(e));assert.match(e.note,/2026\/10\/2026-10-09\.md/);}
});
