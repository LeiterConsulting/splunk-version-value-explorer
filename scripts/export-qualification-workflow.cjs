'use strict';
// Dispatch guard only. Actual source/service/bytes authority remains in the
// existing qualifier; no token acquisition, publisher request or database work.
function qualifyDispatch(e) {
  const required={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REPOSITORY:'LeiterConsulting/splunk-version-value-explorer',GITHUB_REF:'refs/heads/main',GITHUB_RUN_ATTEMPT:'1',VC_QUALIFICATION_MODE:'qualify-exports-only',VC_QUALIFICATION_REF:'refs/heads/main'};
  if(!Object.entries(required).every(([k,v])=>e[k]===v) || !/^[a-f0-9]{40}(?![\s\S])/.test(e.GITHUB_SHA||'') || e.GITHUB_SHA!==e.VC_QUALIFICATION_COMMIT || e.GITHUB_WORKFLOW_SHA!==e.GITHUB_SHA || e.GITHUB_WORKFLOW_REF!==required.GITHUB_REPOSITORY+'/.github/workflows/publish-content.yml@refs/heads/main' || !/^[1-9][0-9]{0,19}(?![\s\S])/.test(e.GITHUB_RUN_ID||'') || !/^[1-9][0-9]{0,19}(?![\s\S])/.test(e.VC_VALIDATION_RUN||'') || e.VC_VALIDATION_RUN===e.GITHUB_RUN_ID) throw Error('Qualification dispatch held: exact main, attempt 1 and a distinct validation run required.');
  return {mode:'qualify-exports-only',validationRun:e.VC_VALIDATION_RUN,admission:'held',publisherRequest:false};
}
if(require.main===module){try{console.log(JSON.stringify(qualifyDispatch(process.env)))}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={qualifyDispatch};
