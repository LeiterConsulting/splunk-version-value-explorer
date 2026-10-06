/* Adopt one complete compatible revision; preserve all bundled adapters on failure. */
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
    let bundled;
    try {
      const manifestResponse = await fetch('content-manifest.json', { cache: 'no-store', signal: controller.signal });
      if (!manifestResponse.ok) throw Error('Publication manifest unavailable');
      bundled = await manifestResponse.json();
      let expected = bundled;
      if (manifestResponse.headers?.get('X-VersionCompass-Active-Delivery') === '1') {
        const active = await fetch('/api/content/manifest?engine=' + encodeURIComponent(bundled.engineRevision), { cache: 'no-store', signal: controller.signal });
        if (!active.ok) throw Error('Active publication unavailable');
        expected = await active.json();
        if (expected.engineRevision !== bundled.engineRevision || !/^content-[a-f0-9]{24}$/.test(expected.revision || '')) throw Error('Active engine mismatch');
      }
      this.revision = expected.revision; this.engineRevision = expected.engineRevision;
      const response = await fetch('/api/content/bundle?revision=' + encodeURIComponent(expected.revision), { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw Error('Database content unavailable');
      const bundle = await response.json(), m = bundle.manifest;
      if (!m || JSON.stringify(m) !== JSON.stringify(expected) || m.schemaVersion !== 1 || m.engineRevision !== bundled.engineRevision || !/^content-[a-f0-9]{24}$/.test(m.revision || '') || !/^[a-f0-9]{64}$/.test(m.digest || '') || bundle.catalog?.schemaVersion !== 1 || bundle.catalog?.records.length !== m.recordCount || Object.keys(bundle.globals || {}).length !== globals.length || globals.some(k => !bundle.globals?.[k]) || !safe(bundle.globals) || !safe(bundle.catalog) || new Set(bundle.catalog.records.map(r => r.id)).size !== m.recordCount) throw Error('Published content mismatch');
      if (await digest({ schemaVersion: 1, globals: bundle.globals, catalog: bundle.catalog }) !== m.digest) throw Error('Published content digest mismatch');
      if ('content-' + (await digest({ digest: m.digest, engineRevision: m.engineRevision, datasetHashes: m.datasetHashes })).slice(0, 24) !== m.revision) throw Error('Published revision mismatch');
      // Atomic assignment after complete validation. Never mix API and adapter datasets.
      for (const key of globals) window[key] = bundle.globals[key];
      this.status = 'database'; this.revision = m.revision; this.engineRevision = m.engineRevision;
      this.loaded = true;
      document.documentElement.dataset.contentDelivery = 'database';
      document.documentElement.dataset.contentRevision = m.revision;
      return true;
    } catch {
      this.status = 'bundled-fallback'; this.loaded = false;
      this.revision = bundled?.revision || null; this.engineRevision = bundled?.engineRevision || null;
      document.documentElement.dataset.contentDelivery = 'bundled-fallback';
      if (this.revision) document.documentElement.dataset.contentRevision = this.revision;
      return false;
    } finally { clearTimeout(timeout); }
  } };
}());
