/* Read-only decision coverage/freshness report; never refresh pins or claim dates. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function model(){const c={window:{SPLUNK_DATA:{guidance:JSON.parse(fs.readFileSync('content/datasets/guidance.json'))},VersionCompassEnvironmentData:JSON.parse(fs.readFileSync('content/datasets/environment.json'))},URLSearchParams,TextEncoder};for(const file of ['content-hash.js','ai-availability.js','advisor-admission.js','advisor-goals.js','advisor.js'])vm.runInNewContext(fs.readFileSync('dist/'+file,'utf8'),c);return c.window;}
const now=new Date().toISOString(),a=model().VersionCompassAdvisor;
const decisions=a.registry.goals.map(goal=>{const review=a.review(goal.id,now);return {id:goal.id,coverage:goal.coverage,exclusions:goal.exclusions,owners:goal.owners,dependencies:windowlessIds(goal),status:review.status,sourceChecks:review.checked,claimAndSectionAssessments:review.assessed,reviewDue:review.due,rejectedDependencies:review.rejected||[]};});
function windowlessIds(goal){return JSON.parse(fs.readFileSync('content/advisor-admission.json')).goals[goal.admission];}
if(process.argv.includes('--check'))for(const goal of a.registry.goals){
  const w=model(),api=w.VersionCompassAdvisor,record=api.resolve('capability:'+goal.record);
  assert(record&&goal.releaseGates.length>=3,'Missing decision evidence or negative release gates');
  record.requirements[0]+=' [synthetic drift fixture]';
  const changed=api.evaluate({goal:goal.id});assert.equal(changed.status,'needs_review');assert.equal(changed.record,null);assert.equal(changed.sources.length,0);
  const stale=model().VersionCompassAdvisor.evaluate({goal:goal.id},{now:'2099-01-01T00:00:00Z'});assert.equal(stale.status,'needs_review');assert.equal(stale.record,null);
}
console.log(JSON.stringify({checkedAt:now,decisions,qualification:'Recorded review windows and identity checks, not a new upstream source retrieval or claim assessment. Paused decisions offer no factual path; existing owners reassess their exact dependencies.'},null,2));
