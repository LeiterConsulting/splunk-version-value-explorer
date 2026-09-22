/* Optional presentation only; never changes evidence, entitlement or review dates. */
(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const active = params.getAll('theme').length === 1 && params.get('theme') === 'cisco';
  function href(value) {
    if (!active) return value;
    const url = new URL(value, window.location.href);
    if (url.origin !== window.location.origin) return value;
    url.searchParams.set('theme','cisco');
    return url.pathname + url.search + url.hash;
  }
  window.VersionCompassTheme = { active, href };
  if (active) {
    document.documentElement.classList.add('theme-cisco');
    const css = document.createElement('link'); css.rel='stylesheet'; css.href='theme-cisco.css'; document.head.appendChild(css);
  }
  document.querySelectorAll('[data-site-link], .brand').forEach(link => { link.setAttribute('href',href(link.getAttribute('href'))); });
  const editions = params.get('view') === 'es-editions' || !params.has('view') && params.get('preview') === 'es-editions';
  document.querySelectorAll('.site-nav a').forEach((link,index) => { if (index === (editions ? 1 : 0)) link.setAttribute('aria-current','page'); });
}());
