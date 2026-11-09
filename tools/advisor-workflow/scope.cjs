/* Public dependency projection only; no facts, aliases or inference live here. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.VersionCompassWorkflowScope=factory();})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function references(sources,...records){const ids=new Set();function walk(x){if(typeof x==='string'){if(x.startsWith('source:'))ids.add(x.slice(7));else if(Object.hasOwn(sources,x))ids.add(x);}else if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object')Object.values(x).forEach(walk);}records.forEach(walk);return [...ids].sort();}
 function project(guidance,environment,sourceIds){return {guidance:{aiAvailability:guidance?.aiAvailability,exactReleases:guidance?.exactReleases,sources:Object.fromEntries(sourceIds.map(id=>[id,guidance?.sources?.[id]]))},environment:{providers:environment?.providers,regions:environment?.regions}};}
 return {references,project};
});
