/* Local-only receipt inspection. Config contains paths and retained read responses. */
'use strict';
const fs=require('node:fs'),{inspectCandidate,inspectDeployment}=require('./lib/release-receipts.cjs');
try{
 if(process.argv.length!==3)throw Error('usage');
 const file=process.argv[2];if(fs.statSync(file).size>1024*1024)throw Error('config-too-large');
 const config=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!config||Object.keys(config).some(k=>!['candidate','deployment'].includes(k))||(!config.candidate&&!config.deployment))throw Error('invalid-config');
 const result={mode:'local-byte-inspection',productionActionAllowed:false};
 if(config.candidate)result.candidate=inspectCandidate(config.candidate);
 if(config.deployment)result.deployment=inspectDeployment(config.deployment);
 console.log(JSON.stringify(result,null,2));
}catch{console.error('Release receipt inspection failed; no production action attempted.');process.exitCode=1;}
