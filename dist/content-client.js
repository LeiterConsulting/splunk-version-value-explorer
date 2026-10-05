/* Load one pinned, validated content revision; legacy adapters provide a bounded fallback. */
(function () {
  'use strict';
  const globals = ['SPLUNK_DATA', 'VersionCompassEnvironmentData', 'VersionCompassEditions', 'VersionCompassForwarderData', 'VersionCompassSOARData'];
  function safe(value) {
    if (!value || typeof value !== 'object') return true;
    return Object.entries(value).every(([key, child]) => !['__proto__', 'prototype', 'constructor'].includes(key) && safe(child));
  }
  async function digest(value) {
    const text = JSON.stringify(value);
    if (!globalThis.crypto?.subtle) return window.VersionCompassHash(text);
    const bytes = new TextEncoder().encode(text);
    const result = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(result)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  window.VersionCompassContent = { status: 'loading', revision: null, async load() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const manifestResponse = await fetch('content-manifest.json', { cache: 'no-store', signal: controller.signal });
      if (!manifestResponse.ok) throw Error('Publication manifest unavailable');
      const expected = await manifestResponse.json();
      this.revision = expected.revision; this.engineRevision = expected.engineRevision;
      const response = await fetch('/api/content/bundle?revision=' + encodeURIComponent(expected.revision), { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw Error('Database content unavailable');
      const bundle = await response.json(), m = bundle.manifest;
      if (!m || m.schemaVersion !== 1 || m.revision !== expected.revision || m.engineRevision !== expected.engineRevision || m.digest !== expected.digest || bundle.catalog?.records.length !== m.recordCount || globals.some(k => !bundle.globals?.[k]) || !safe(bundle.globals) || !safe(bundle.catalog)) throw Error('Published content mismatch');
      if (await digest({ schemaVersion: 1, globals: bundle.globals, catalog: bundle.catalog }) !== m.digest) throw Error('Published content digest mismatch');
      // Atomic assignment after complete validation. Never mix API and adapter datasets.
      for (const key of globals) window[key] = bundle.globals[key];
      this.status = 'database'; this.revision = m.revision; this.engineRevision = m.engineRevision;
      this.loaded = true;
      document.documentElement.dataset.contentDelivery = 'database';
      document.documentElement.dataset.contentRevision = m.revision;
      return true;
    } catch {
      this.status = 'bundled-fallback'; this.loaded = false;
      document.documentElement.dataset.contentDelivery = 'bundled-fallback';
      return false;
    } finally { clearTimeout(timeout); }
  } };
}());
