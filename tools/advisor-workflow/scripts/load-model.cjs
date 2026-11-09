const path=require("node:path"),REPO=path.resolve(__dirname,"../../..");
const fs=require("node:fs"),vm=require("node:vm"),crypto=require("node:crypto");
const Scope=require('../scope.cjs');
const files=["content-hash.js","ai-availability.js","advisor-admission.js","advisor-goals.js","advisor.js","advisor-report.js","exact-releases.js"];
function data(){
 const guidance=JSON.parse(fs.readFileSync(path.join(REPO,"content/datasets/guidance.json"),"utf8"));
 const environment=JSON.parse(fs.readFileSync(path.join(REPO,"content/datasets/environment.json"),"utf8"));
 const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../shared/prerequisites.json'),'utf8')),goals=JSON.parse(fs.readFileSync(path.join(REPO,'content/advisor-goals.json'),'utf8'));
 return Scope.project(guidance,environment,Scope.references(guidance.sources,guidance.aiAvailability,guidance.exactReleases,catalog,goals));
}
function load(override){
 const d=override||data(),provenance=JSON.parse(fs.readFileSync("source-provenance.json","utf8"));
 const metadata={repository:provenance.repository,commit:provenance.commit,tree:provenance.tree,retrieved:provenance.retrieved,siteVersion:provenance.site_version,siteSourceCommit:provenance.site_source_commit,liveAssetParity:"Private current-main integration. Sites288/source binding is a retained documented baseline only; no production or D1 request was made.",exactPilot:"Candidate research snapshot; no deployed or operational coverage claim"};
 const w={SPLUNK_DATA:{guidance:d.guidance},VersionCompassEnvironmentData:d.environment,VersionCompassWorkflowScope:Scope,WorkflowPublic:{guidance:d.guidance,environment:d.environment,scopeSourceIds:Object.keys(d.guidance.sources),metadata,sha256:crypto.createHash("sha256").update(JSON.stringify(d)).digest("hex")}};
 const typed={catalog:JSON.parse(fs.readFileSync("shared/prerequisites.json","utf8")),admission:JSON.parse(fs.readFileSync("shared/prerequisite-admission.json","utf8"))};
 const handoffMode="release-guide";
 w.WorkflowTyped=typed;w.WorkflowBuild={handoffMode,version:"private-candidate-4",hash:crypto.createHash("sha256").update(JSON.stringify([...(["scope.cjs","model.cjs","prerequisites.cjs","migration.cjs","app.js","shared/prerequisites.json","shared/prerequisite-admission.json","styles.css","index.template.html","source-provenance.json","build.cjs","route-bootstrap.js","scripts/load-model.cjs"].map(f=>({file:"tools/advisor-workflow/"+f,sha256:crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex")}))),...files.map(f=>({file:"dist/"+f,sha256:crypto.createHash("sha256").update(fs.readFileSync(path.join(REPO,"dist",f))).digest("hex")}))])+"\n"+handoffMode).digest("hex")};w.WorkflowPublic.typed=typed;w.WorkflowPublic.build=w.WorkflowBuild;
 w.WorkflowPublic.metadata.workflowEngine=w.WorkflowBuild;w.WorkflowPublic.metadata.typedPrerequisites=typed.catalog.modelVersion;
 const context={window:w,URLSearchParams,TextEncoder,Date};for(const f of files)vm.runInNewContext(fs.readFileSync(path.join(REPO,"dist",f),"utf8"),context);
 w.VersionCompassPrerequisites=require("../prerequisites.cjs")(w);const model=require("../model.cjs")(w);w.AdvisorWorkflow=model;w.VersionCompassWorkflowMigration=require("../migration.cjs")(w);return {env:w,model,M:model,data:d,files};
}
module.exports={load,data,files};
