// Inactive identity inspection reference; not in the Worker build.
const REPOSITORY='LeiterConsulting/splunk-version-value-explorer';
/* Separate maintenance boundary. No browser identity, telemetry or public writes. */
const publisherIssuer = 'https://token.actions.githubusercontent.com';
const publisherAudience = 'https://versioncompass.com';
const publisherWorkflow = REPOSITORY + '/.github/workflows/publish-content.yml@refs/heads/main';

function publisherBase64(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw Error('Invalid token');
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
export async function inspectPublisherRunIdentity(token, { fetcher = (...args) => globalThis.fetch(...args), now = Date.now() } = {}) {
  if (typeof token !== 'string' || token.length > 16000) throw Error('Invalid token');
  const parts = token.split('.'); if (parts.length !== 3) throw Error('Invalid token');
  const decode = part => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(publisherBase64(part)));
  let header, claims;
  try { header = decode(parts[0]); claims = decode(parts[1]); } catch { throw Error('Invalid token'); }
  if (header.alg !== 'RS256' || header.typ !== 'JWT' || typeof header.kid !== 'string' || header.jku || header.jwk || header.crit) throw Error('Invalid token');
  const seconds = Math.floor(now / 1000);
  if (claims.iss !== publisherIssuer || claims.aud !== publisherAudience ||
      claims.repository !== REPOSITORY || claims.repository_id !== '1366223729' || claims.repository_owner_id !== '152733483' ||
      claims.repository_visibility !== 'public' || claims.ref !== 'refs/heads/main' || claims.ref_type !== 'branch' ||
      claims.workflow_ref !== publisherWorkflow || claims.runner_environment !== 'github-hosted' ||
      !['repo:' + REPOSITORY + ':ref:refs/heads/main', 'repo:LeiterConsulting@152733483/splunk-version-value-explorer@1366223729:ref:refs/heads/main'].includes(claims.sub) ||
      !['workflow_run', 'workflow_dispatch'].includes(claims.event_name) || !/^[a-f0-9]{40}$/.test(claims.sha) ||
      !Number.isSafeInteger(claims.exp) || !Number.isSafeInteger(claims.nbf) || !Number.isSafeInteger(claims.iat) ||
      claims.exp <= seconds || claims.nbf > seconds + 30 || claims.iat > seconds + 30 || claims.iat < seconds - 600 || claims.exp - claims.iat > 600) throw Error('Invalid publisher identity');
  const decimal=x=>typeof x==='string'&&/^[1-9][0-9]{0,19}$/.test(x);
  if(!decimal(claims.run_id)||!decimal(claims.run_attempt)||typeof claims.workflow_sha!=='string'||!/^[a-f0-9]{40}$/.test(claims.workflow_sha))throw Error('Invalid signed run identity');
  let response;
  // Workers supports manual redirect handling; reject every non-2xx response
  // without following it, preserving the fixed issuer boundary.
  try { response = await fetcher(publisherIssuer + '/.well-known/jwks', { redirect: 'manual', signal: AbortSignal.timeout(10000) }); }
  catch (error) {
    if (/illegal invocation/i.test(error.message)) throw Error('Publisher identity fetch receiver invalid');
    if (/redirect/i.test(error.message)) throw Error('Publisher identity redirect rejected');
    if (/not implemented|not supported|unsupported|not a function/i.test(error.message)) throw Error('Publisher identity fetch option unsupported');
    throw Error('Publisher identity unavailable');
  }
  if (!response.ok) throw Error('Publisher identity unavailable (HTTP ' + response.status + ')');
  if (!response.body) throw Error('Publisher identity unavailable');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 128 * 1024) throw Error('Publisher identity exceeds limit'); chunks.push(value); }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let keys;
  try { keys = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)).keys; }
  catch { throw Error('Invalid signing key document'); }
  const matches = Array.isArray(keys) ? keys.filter(key => key.kid === header.kid && key.kty === 'RSA' && (!key.use || key.use === 'sig') && (!key.alg || key.alg === 'RS256')) : [];
  if (matches.length !== 1) throw Error('Unknown signing key');
  let key;
  try { key = await crypto.subtle.importKey('jwk', matches[0], { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']); }
  catch { throw Error('Signing key import unavailable'); }
  let verified;
  try { verified = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, publisherBase64(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1])); }
  catch { throw Error('Signature verification unavailable'); }
  if (!verified) throw Error('Invalid signature');
  return Object.freeze({ type:'github-oidc-signed-run-claims', commit:claims.sha, eventName:claims.event_name, runId:claims.run_id, runAttempt:claims.run_attempt, workflowSha:claims.workflow_sha, workflowRef:claims.workflow_ref, claimsSignatureVerified:true, serviceRunVerified:false, artifactUploadAttemptVerified:false, productionActionAllowed:false });
}

// Structural expected identity only: does not authenticate an API receipt.
export function matchExpectedRun(identity,expected){
 const keys=['commit','eventName','runId','runAttempt','workflowSha','workflowRef'];
 if(!identity||!expected||keys.some(key=>typeof identity[key]!=='string'||typeof expected[key]!=='string'||identity[key]!==expected[key]))throw Error('Expected run identity mismatch');
 return {identityFieldsMatch:true,serviceRunVerified:false,artifactUploadAttemptVerified:false,productionActionAllowed:false};
}
