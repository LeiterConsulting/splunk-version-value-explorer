/* Adapter generation never admits or refreshes claims. Review pins explicitly. */
const fs=require('node:fs');
const input=JSON.parse(fs.readFileSync('content/advisor-admission.json','utf8'));
const output='/* Generated from content/advisor-admission.json; pins require scoped evidence review. */\nwindow.VersionCompassAdvisorAdmission = '+JSON.stringify(input,null,2)+';\n';
const file='dist/advisor-admission.js';
if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==output)throw Error('Advisor admission adapter needs synchronization');}
else fs.writeFileSync(file,output);
