/* Separate maintenance boundary. No browser identity, telemetry or public writes. */
const publisherIssuer = 'https://token.actions.githubusercontent.com';
const publisherAudience = 'https://versioncompass.com';
const publisherWorkflow = REPOSITORY + '/.github/workflows/publish-content.yml@refs/heads/main';

function publisherBase64(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw Error('Invalid token');
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
export async function verifyPublisherOIDC(token, { fetcher = (...args) => globalThis.fetch(...args), now = Date.now() } = {}) {
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
  return { type: 'github-oidc', commit: claims.sha };
}
async function publisherIdentity(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ') || authorization.length > 16007) return null;
  const token = authorization.slice(7);
  if (/^[a-f0-9]{64}$/.test(env.VC_PUBLISHER_TOKEN || '') && /^[a-f0-9]{64}$/.test(token)) {
    const a = await sha256(token), b = await sha256(env.VC_PUBLISHER_TOKEN);
    let difference = 0; for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
    if (difference === 0) return { type: 'maintenance-secret' };
  }
  if (env.VC_PUBLISHER_OIDC === '1') {
    try { return await verifyPublisherOIDC(token); } catch (error) {
      const reason = ({ 'Invalid token': 'oidc-invalid-token', 'Invalid publisher identity': 'oidc-claim-mismatch', 'Publisher identity unavailable': 'oidc-keys-unavailable', 'Publisher identity fetch receiver invalid': 'oidc-fetch-receiver-invalid', 'Publisher identity redirect rejected': 'oidc-redirect-rejected', 'Publisher identity fetch option unsupported': 'oidc-fetch-option-unsupported', 'Publisher identity exceeds limit': 'oidc-keys-oversized', 'Invalid signing key document': 'oidc-keys-invalid-json', 'Signing key import unavailable': 'oidc-key-import-unavailable', 'Signature verification unavailable': 'oidc-signature-unavailable', 'Unknown signing key': 'oidc-unknown-key', 'Invalid signature': 'oidc-invalid-signature' })[error.message] || (/^Publisher identity unavailable \(HTTP \d{3}\)$/.test(error.message) ? 'oidc-keys-http-' + error.message.match(/\d{3}/)[0] : 'oidc-verification-unavailable');
      return { type: 'rejected', reason };
    }
  }
  return null;
}
async function publisherBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) throw Error('JSON request required');
  if (!request.body || Number(request.headers.get('Content-Length') || 0) > 8 * 1024 * 1024) throw Error('Publication exceeds byte limit');
  const reader = request.body.getReader(), chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > 8 * 1024 * 1024) throw Error('Publication exceeds byte limit'); chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}
export async function bootstrapPublication(db, candidate, operationId, seed, options = {}) {
  if (!/^pub-[a-f0-9]{32}$/.test(operationId || '') || candidate?.bundle?.manifest?.revision !== seed.manifest.revision) throw Error('Bootstrap requires the deployment seed');
  await stagePublication(db, candidate, { ...options, engineRevision: seed.manifest.engineRevision });
  const channel = 'engine:' + seed.manifest.engineRevision, revision = seed.manifest.revision;
  const provenance = await db.prepare('SELECT commit_sha FROM content_publication_provenance WHERE revision_id = ? AND repository = ?').bind(revision, REPOSITORY).first();
  await db.batch([
    db.prepare('INSERT INTO content_publication (channel, revision_id) SELECT ?, id FROM content_revisions WHERE id = ? AND completed = 1 ON CONFLICT(channel) DO NOTHING').bind(channel, revision),
    db.prepare(`INSERT INTO content_publication_events (operation_id, channel, generation, from_revision, to_revision, provenance_commit, intent, created_at)
      SELECT ?, ?, 1, ?, ?, ?, 'publish', ? FROM content_publication p WHERE p.channel = ? AND p.revision_id = ?
      AND NOT EXISTS (SELECT 1 FROM content_publication_events WHERE channel = ?) ON CONFLICT(operation_id) DO NOTHING`)
      .bind(operationId, channel, revision, revision, provenance.commit_sha, new Date().toISOString(), channel, revision, channel),
  ]);
  const head = await readPublicationHead(db, seed.manifest.engineRevision);
  if (head.revision !== revision || head.generation < 1) throw Error('Bootstrap conflicts with the existing publication');
  return { status: 'initialized', ...head, engineRevision: seed.manifest.engineRevision };
}
// An already verified workflow may supply its job-scoped read credential.
// Keep it only in the request body/in-memory fetch closure, never in storage.
export function publisherEvidenceRequest(input, identity, fetcher = (...args) => globalThis.fetch(...args)) {
  if (!input || typeof input !== 'object' || !Object.hasOwn(input, 'evidenceCredential')) return { input, fetcher };
  if (identity.type !== 'github-oidc' || Object.keys(input).length !== 2 || !Object.hasOwn(input, 'publication') ||
      !/^[A-Za-z0-9_]{20,255}$/.test(input.evidenceCredential || '')) throw Error('Invalid evidence credential');
  const credential = input.evidenceCredential, repositoryPath = '/repos/' + REPOSITORY + '/';
  return { input: input.publication, fetcher: (url, options) => {
    const target = new URL(url);
    if (target.protocol !== 'https:' || target.username || target.password) throw Error('Untrusted evidence origin');
    if (target.hostname === 'api.github.com' && target.pathname.startsWith(repositoryPath))
      return fetcher(url, { ...options, headers: { ...options.headers, Authorization: 'Bearer ' + credential } });
    if (target.hostname === 'raw.githubusercontent.com' && target.pathname.startsWith('/' + REPOSITORY + '/')) return fetcher(url, options);
    throw Error('Untrusted evidence origin');
  } };
}
export async function publisherRequest(request, env, seed, json) {
  const url = new URL(request.url), routes = ['/api/publisher/head', '/api/publisher/stage', '/api/publisher/bootstrap', '/api/publisher/activate'];
  const identity = await publisherIdentity(request, env);
  if (!identity || identity.type === 'rejected') return json({ error: 'Publisher authorization required', ...(identity?.reason ? { reason: identity.reason } : {}) }, 401);
  if (!routes.includes(url.pathname)) return json({ error: 'Unknown publisher route' }, 404);
  if (url.search || (request.headers.has('Origin') && request.headers.get('Origin') !== publisherAudience)) return json({ error: 'Invalid publisher request' }, 400);
  const method = url.pathname.endsWith('/head') ? 'GET' : 'POST';
  if (request.method !== method) return json({ error: 'Unsupported publisher method' }, 405, { Allow: method });
  try {
    const engineRevision = seed.manifest.engineRevision;
    if (method === 'GET') return json({ ...await readPublicationHead(env.DB, engineRevision), engineRevision, activeDelivery: env.VC_ACTIVE_DELIVERY === '1' });
    let input;
    try { input = await publisherBody(request); } catch { return json({ error: 'Invalid or oversized JSON publication' }, 400); }
    let evidence;
    try { evidence = publisherEvidenceRequest(input, identity); input = evidence.input; }
    catch { return json({ error: 'Invalid workflow evidence credential' }, 400); }
    if (url.pathname.endsWith('/activate')) {
      if (env.VC_ACTIVE_DELIVERY !== '1') return json({ error: 'Active delivery awaits the required browser and export verification' }, 423);
      if (identity.type === 'github-oidc') {
        if (input.intent !== 'publish') return json({ error: 'Rollback requires maintenance authorization' }, 403);
        const bundle = await readBundle(env.DB, input.revision);
        await verifyRepositoryPublication({ repository: REPOSITORY, commit: identity.commit, bundle }, { engineRevision, fetcher: evidence.fetcher });
      }
      return json(await activatePublication(env.DB, input, { engineRevision }));
    }
    const candidate = url.pathname.endsWith('/bootstrap') ? input.candidate : input;
    if (identity.commit && candidate?.commit !== identity.commit) return json({ error: 'Publisher commit mismatch' }, 403);
    if (url.pathname.endsWith('/bootstrap')) {
      if (Object.keys(input).length !== 2 || !Object.hasOwn(input, 'candidate') || !Object.hasOwn(input, 'operationId')) return json({ error: 'Invalid bootstrap fields' }, 400);
      return json(await bootstrapPublication(env.DB, candidate, input.operationId, seed, { fetcher: evidence.fetcher }));
    }
    return json(await stagePublication(env.DB, candidate, { engineRevision, fetcher: evidence.fetcher }));
  } catch (error) {
    // Never include credentials, submitted payloads, internal SQL or upstream bodies.
    let reason = [
      ['Repository evidence unavailable', 'repository-evidence-unavailable'],
      ['Required main CI has not passed', 'validation-ci-not-ready'],
      ['Required validation or build evidence missing', 'validation-step-missing'],
      ['Candidate differs from the committed publication', 'committed-artifact-mismatch'],
      ['Commit is not on main', 'commit-not-on-main'],
      ['Immutable revision collision', 'immutable-revision-collision'],
      ['Incomplete or corrupt staged records', 'staged-record-integrity'],
      ['Engine mismatch', 'engine-mismatch'],
      ['Bootstrap conflicts', 'bootstrap-head-conflict'],
      ['D1_ERROR', 'database-operation-failed'],
    ].find(([message]) => String(error.message).includes(message))?.[1] || 'verification-unavailable';
    if (/^Repository evidence unavailable \(HTTP \d{3}\)$/.test(error.message)) reason = 'repository-evidence-http-' + error.message.match(/\d{3}/)[0];
    return json({ error: 'Publication rejected; verify repository CI, immutable data, migration readiness and expected head', reason }, 409);
  }
}
