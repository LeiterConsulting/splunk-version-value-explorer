const test=require('node:test'),assert=require('node:assert/strict');
const e=require('../content/datasets/environment.json'),g=require('../content/datasets/guidance.json');
test('High announcement never converts unresolved runtime, rollout or offering scope into availability',()=>{
 for(const id of ['edge-high-unknown','ingest-high-unknown','platform-ai-high-unknown']){
  const r=e.records.find(x=>x.id===id);assert.equal(r.availability,'not_established');assert.equal(r.authorization,'not_established');assert(r.sources.includes('highAnnouncement20261019'));assert.match(r.detail,/October 19/);
 }
 assert.match(e.records.find(x=>x.id==='ingest-high-unknown').detail,/Essentials tier/);
 assert.match(g.aiAvailability.regulatedQualification,/IL2/);assert.match(g.aiAvailability.regulatedQualification,/Agent Mode/);assert.match(g.aiAvailability.regulatedQualification,/ITSI subagent/);
 assert(g.aiAvailability.sourceIds.includes('aiHighAnnouncement20261019'));
});
