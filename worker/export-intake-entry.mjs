/* Default-off no-DB intake boundary. No activation or runtime secret is supplied
 * by this module. Keep the complete dependency graph in engine identity inputs. */
import {exportIntakeRequest} from '../tools/release-coordination/export-intake-route.mjs';
const keys=Object.freeze(['VC_EXPORT_INTAKE_ENABLED','VC_PUBLISHER_OIDC','VC_ACTIVE_DELIVERY','VC_PUBLISHER_ACTIVATION','VC_EXPORT_INTAKE_POLICY','VC_EXPORT_INTAKE_GITHUB_TOKEN']);
export function withExportIntake(worker){
 return {
  async fetch(request,env,ctx){
   if(new URL(request.url).pathname!=='/api/publisher/export-qualification')return worker.fetch(request,env,ctx);
   // Getters preserve default-off short-circuiting: even the secret is unread
   // until the actual intake reaches that check. Never forward DB/storage/seed.
   const configuration=Object.create(null);
   for(const key of keys)Object.defineProperty(configuration,key,{get:()=>env[key],enumerable:true});
   return exportIntakeRequest(request,Object.freeze(configuration));
  }
 };
}
