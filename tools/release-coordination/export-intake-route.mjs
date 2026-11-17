/* Default-off transport integration. Runtime activation requires explicit configuration.
 * Only server-owned runtime configuration enters the existing real intake.
 * No DB handle, admission constructor, persistent storage or logging. */
import {createProtectedExportIntake} from './protected-export-intake.mjs';
import {strictJSON} from './qualification-artifact.mjs';
const ORIGIN='https://versioncompass.com',PATH='/api/publisher/export-qualification';
const response=(status,value)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const held=status=>response(status,{status:'protected-intake-held',admission:'held',productionActionAllowed:false});
export async function exportIntakeRequest(request,env,{fetcher=(...args)=>globalThis.fetch(...args),clock=()=>Date.now()}={}){
 try{
  const u=new URL(request.url);
  if(u.origin!==ORIGIN||u.pathname!==PATH||u.search||u.hash)return held(404);
  if(request.method!=='POST')return response(405,{status:'method-rejected',admission:'held',productionActionAllowed:false});
  if(request.headers.has('origin')||request.body!==null||(request.headers.has('content-length')&&request.headers.get('content-length')!=='0'))return held(400);
  // Never accept a GitHub read credential from an HTTP caller. Only the separate
  // server secret is used. The sender forwards OIDC in Authorization, nothing else.
  for(const name of ['x-github-token','x-github-read-token','x-vc-github-token'])if(request.headers.has(name))return held(400);
  const auth=request.headers.get('authorization');
  if(typeof auth!=='string'||auth.length>16007||!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$(?![\s\S])/.test(auth))return held(401);
  if(env.VC_EXPORT_INTAKE_ENABLED!=='1'||env.VC_PUBLISHER_OIDC!=='1'||env.VC_ACTIVE_DELIVERY!=='0'||env.VC_PUBLISHER_ACTIVATION!=='0')return held(423);
  const raw=env.VC_EXPORT_INTAKE_POLICY;
  if(typeof raw!=='string'||new TextEncoder().encode(raw).length>4096)return held(423);
  const policy=strictJSON(new TextEncoder().encode(raw));
  const intake=createProtectedExportIntake({policy,githubToken:env.VC_EXPORT_INTAKE_GITHUB_TOKEN,fetcher,clock});
  // Original selectors, custom headers and environment bindings are not forwarded.
  // handle() authenticates OIDC and derives original artifact selection itself.
  return await intake.handle(new Request(ORIGIN+'/internal/qualification/intake',{method:'POST',headers:{Authorization:auth}}));
 }catch{return held(409)}
}
