/* Public content is read-only; publisher requests have a separate secret boundary. */
export function createWorker(seed, assets, { rippleFetch = (...args) => globalThis.fetch(...args) } = {}) {
  const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
  const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
  const rippleHeaders = { 'X-Robots-Tag': 'noindex, nofollow' };
  const rippleJson = (request, body, status = 200, extra = {}) => {
    const response = json(body, status, { ...rippleHeaders, ...extra });
    return request.method === 'HEAD' ? new Response(null, response) : response;
  };
  async function rippleRequest(request, env, url) {
    // Public research reads only. The credential never reaches browser assets,
    // arbitrary hosts, redirected targets, or private mutation/admin endpoints.
    if (!['GET', 'HEAD'].includes(request.method)) return rippleJson(request, { error: 'Read-only Ripple research service' }, 405, { Allow: 'GET, HEAD' });
    const page = url.pathname === '/ripple' || url.pathname === '/ripple/';
    const updates = url.pathname === '/ripple/updates' || url.pathname === '/ripple/updates/';
    const asset = assets[updates ? '/ripple/updates.html' : page ? '/ripple/index.html' : url.pathname];
    if (asset && !url.pathname.startsWith('/ripple/api/')) return new Response(request.method === 'HEAD' ? null : asset.body, {
      status: 200, headers: { ...headers, ...rippleHeaders, 'Content-Type': asset.type, 'Cache-Control': 'no-store' },
    });
    const snapshot = url.pathname === '/ripple/api/snapshot', cve = url.pathname === '/ripple/api/cve';
    if (!snapshot && !cve) return rippleJson(request, { error: 'Unknown Ripple route' }, 404);
    const params = url.searchParams;
    const id = params.get('id')?.toUpperCase();
    if ((snapshot && url.search) || (cve && ([...params.keys()].some(key => key !== 'id') || params.getAll('id').length !== 1 || !/^CVE-\d{4}-\d{4,19}$/.test(id || '')))) return rippleJson(request, { error: 'Invalid Ripple research selection' }, 400);
    if (!env.RIPPLE_READ_SERVICE_TOKEN) return rippleJson(request, { error: 'Ripple research service unavailable; baseline remains available' }, 503);
    const upstream = new URL(snapshot ? '/api/snapshot' : '/api/cve', 'https://ripple-exposure.majorgeneralrabidzagnut.chatgpt.site');
    if (cve) upstream.searchParams.set('id', id);
    try {
      const response = await rippleFetch(upstream.href, {
        method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(25000),
        headers: { Accept: 'application/json', 'OAI-Sites-Authorization': 'Bearer ' + env.RIPPLE_READ_SERVICE_TOKEN },
      });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json') || !response.body || Number(response.headers.get('content-length')) > 2_000_000) throw Error('Ripple upstream unavailable');
      const reader = response.body.getReader(), chunks = []; let total = 0;
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        total += value.byteLength;
        if (total > 2_000_000) { await reader.cancel(); throw Error('Ripple response exceeds limit'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(total); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const data = JSON.parse(new TextDecoder().decode(bytes));
      if (snapshot ? data.schemaVersion !== 1 || !Array.isArray(data.records) || !Array.isArray(data.candidates) || !Array.isArray(data.checks) : data.id !== id || typeof data.found !== 'boolean') throw Error('Unsupported Ripple response');
      const fields = snapshot ? ['schemaVersion', 'records', 'candidates', 'checks', 'lastRun', 'storage', 'updateStatus', 'runs', 'lastAssessmentAt', 'assessmentRuns', 'operations'] : ['id', 'found', 'description', 'severity', 'score', 'modified', 'status', 'url', 'ciscoImpact'];
      const publicData = Object.fromEntries(fields.filter(key => Object.hasOwn(data, key)).map(key => [key, data[key]]));
      return rippleJson(request, publicData);
    } catch {
      return rippleJson(request, { error: 'Ripple research service unavailable; try again shortly' }, 502);
    }
  }
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (url.pathname === '/ripple' || url.pathname.startsWith('/ripple/')) return rippleRequest(request, env, url);
      if (url.pathname.startsWith('/api/publisher/')) return publisherRequest(request, env, seed, json);
      if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Read-only content service' }, 405, { Allow: 'GET, HEAD' });
      if (url.pathname.startsWith('/api/content/')) {
        const routes = ['/api/content/manifest', '/api/content/bundle', '/api/content/records', '/api/content/health'];
        if (!routes.includes(url.pathname)) return json({ error: 'Unknown content route' }, 404);
        const params = url.searchParams;
        const allowed = url.pathname.endsWith('/records') ? ['revision', 'kind', 'dataset', 'offset', 'limit', 'engine'] : ['revision', 'engine'];
        if ([...params.keys()].some(k => !allowed.includes(k) || params.getAll(k).length !== 1)) return json({ error: 'Unknown or repeated content selection' }, 400);
        const engine = params.get('engine') || seed.manifest.engineRevision;
        if (engine !== seed.manifest.engineRevision) return json({ error: 'Unsupported deployed engine' }, 409);
        let revision = params.get('revision') || seed.manifest.revision;
        if (!/^content-[a-f0-9]{24}$/.test(revision)) return json({ error: 'Invalid content revision' }, 400);
        const kind = params.get('kind'), dataset = params.get('dataset');
        const offset = Number(params.get('offset') || '0'), limit = Number(params.get('limit') || '100');
        if (![offset, limit].every(Number.isSafeInteger) || offset < 0 || limit < 1 || limit > 200 || (kind && !/^[a-z-]{1,40}$/.test(kind)) || (dataset && !['platform','products','guidance','environment','editions','forwarders','soar','sources'].includes(dataset))) return json({ error: 'Invalid record filter or pagination' }, 400);
        try {
          await ensureRevision(env.DB, seed);
          // Opt in only after affected browser/export evidence is recorded. Explicit
          // revision reads remain compatible with existing deployment-pinned clients.
          if (!params.has('revision') && env.VC_ACTIVE_DELIVERY === '1') {
            const head = await readPublicationHead(env.DB, engine);
            const proof = await env.DB.prepare('SELECT revision_id FROM content_publication_provenance WHERE revision_id = ? AND repository = ?').bind(head.revision, REPOSITORY).first();
            if (head.generation < 1 || !proof) throw Error('Verified publisher head required');
            revision = head.revision;
          }
          const bundle = await readBundle(env.DB, revision);
          if (!bundle) return json({ error: 'Published revision not available', requestedRevision: revision }, 404);
          if ((params.has('engine') || !params.has('revision')) && bundle.manifest.engineRevision !== engine) return json({ error: 'Revision belongs to another engine' }, 409);
          const extra = { 'X-VersionCompass-Content': revision, 'X-VersionCompass-Engine': bundle.manifest.engineRevision };
          if (request.method === 'HEAD') return new Response(null, { status: 200, headers: { ...headers, ...extra } });
          if (url.pathname.endsWith('/health')) return json({ status: 'ready', storage: 'd1', revision, engineRevision: bundle.manifest.engineRevision, recordCount: bundle.manifest.recordCount }, 200, extra);
          if (url.pathname.endsWith('/manifest')) return json(bundle.manifest, 200, extra);
          if (url.pathname.endsWith('/records')) return json({ revision, offset, limit, records: await readRecords(env.DB, revision, kind, dataset, offset, limit) }, 200, extra);
          return json(bundle, 200, extra);
        } catch {
          return json({ error: 'Content database unavailable; published bundled content remains available', revision: seed.manifest.revision }, 503);
        }
      }
      const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
      const activeAssets = { '/content-client.js': '/content-client-active.js' };
      const asset = assets[env.VC_ACTIVE_DELIVERY === '1' ? activeAssets[pathname] || pathname : pathname];
      if (!asset) return new Response('Not found', { status: 404, headers });
      const delivery = pathname === '/content-manifest.json' && env.VC_ACTIVE_DELIVERY === '1' ? { 'X-VersionCompass-Active-Delivery': '1' } : {};
      return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers: { ...headers, ...delivery, 'Content-Type': asset.type, 'Cache-Control': 'no-store' } });
    },
  };
}
