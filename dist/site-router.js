/* Public ES editions route; preserve the original preview URL as an alias. */
(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const preview = params.getAll('view').length === 1 && params.get('view') === 'es-editions' || !params.has('view') && params.getAll('preview').length === 1 && params.get('preview') === 'es-editions';
  const normal = ['data.js','product-data.js','guidance-data.js','comparison.js','guidance.js','release-print.js','app.js','webmcp.js'];
  if (preview) {
    document.body.classList.add('editions-preview');
    document.querySelector('main').innerHTML = '<section class="hero"><p class="dek" role="status">Loading ES editions comparison…</p></section>';
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'editions.css'; document.head.appendChild(css);
  }
  function load(files) {
    if (!files.length) return;
    const script = document.createElement('script'); script.src = files.shift();
    script.onload = function () { load(files); };
    script.onerror = function () {
      const error = document.createElement('p'); error.setAttribute('role','alert');
      error.textContent = 'This view could not load. Please reload the page.'; document.querySelector('main').prepend(error);
    };
    document.body.appendChild(script);
  }
  load(preview ? ['editions-data.js','editions.js'] : normal);
}());
