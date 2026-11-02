/* Adapter generation never admits or refreshes claims. Review pins explicitly. */
const fs=require('node:fs');
const input=JSON.parse(fs.readFileSync('content/advisor-admission.json','utf8'));
const output='/* Generated from content/advisor-admission.json; pins require scoped evidence review. */\nwindow.VersionCompassAdvisorAdmission = '+JSON.stringify(input,null,2)+';\n';
const file='dist/advisor-admission.js';
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==output)throw Error('Advisor admission adapter needs synchronization');}
else fs.writeFileSync(file,output);
const goals=JSON.parse(fs.readFileSync('content/advisor-goals.json','utf8'));
if(goals.schemaVersion!==1||!goals.goals.length||new Set(goals.goals.map(goal=>goal.id)).size!==goals.goals.length)throw Error('Unsupported Advisor decision registry');
for(const goal of goals.goals){if(!['agent-mode','itsi-versions','soc-workflow'].includes(goal.id))throw Error('Implement and negatively test a new decision before publishing its card: '+goal.id);if(!input.goals[goal.admission]||!goal.coverage||!goal.exclusions||!goal.inputs.length||!goal.owners.length||!goal.releaseGates.length)throw Error('Incomplete goal-level coverage or release gate: '+goal.id);}
const goalOutput='/* Generated from content/advisor-goals.json. Coverage configuration is not new product evidence. */\nwindow.VersionCompassAdvisorGoals = '+JSON.stringify(goals,null,2)+';\n';
if(process.argv.includes('--check')){if(fs.readFileSync('dist/advisor-goals.js','utf8')!==goalOutput)throw Error('Advisor decision registry needs synchronization');}
else fs.writeFileSync('dist/advisor-goals.js',goalOutput);
