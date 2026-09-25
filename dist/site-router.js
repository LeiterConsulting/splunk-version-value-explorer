/* Public ES editions route; preserve the original preview URL as an alias. */
(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const preview = params.getAll('view').length === 1 && params.get('view') === 'es-editions' || !params.has('view') && params.getAll('preview').length === 1 && params.get('preview') === 'es-editions';
  const normal = ['environment-data.js','environment.js','data.js','product-data.js','guidance-data.js','comparison.js','guidance.js','release-print.js','app.js','webmcp.js'];
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
  if(params.getAll('view').length===1&&params.get('view')==='about'){load(['source-register.js','maintenance-status.js','about.js']);return;}
  const files = preview ? ['environment-data.js','environment.js','editions-data.js','editions.js'] : normal;
  files.splice(files.indexOf('environment.js') + 1, 0, 'perspectives.js');
  files.push('navigation.js');
  files.unshift('source-register.js','evidence.js');
  load(files);
}());
