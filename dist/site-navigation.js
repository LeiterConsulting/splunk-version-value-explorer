/* One destination registry and disclosure controller for both public workspaces. */
(function (root) {
  'use strict';
  const destinations = Object.freeze([
    { id: 'release-guide', label: 'Release Guide', href: '/', group: 'explore', description: 'Compare versions and upgrade paths.' },
    { id: 'es-editions', label: 'ES Editions', href: '/?view=es-editions', group: 'explore', description: 'Compare documented edition scope.' },
    { id: 'ai-availability', label: 'AI Availability', href: '/?view=ai-availability', group: 'explore', description: 'Check requirements and availability.' },
    { id: 'splunk-11', label: '11.x Prep', href: '/?view=splunk-11', group: 'explore', description: 'Review published preparation guidance.' },
    { id: 'advisor', label: 'Advisor', href: '/?view=advisor', badge: 'Work in progress', description: 'Assessed Splunk documentation for your goal' },
    { id: 'ripple', label: 'Ripple', href: '/ripple', description: 'Cisco exposure intelligence' },
    { id: 'about', label: 'About', href: '/?view=about', description: 'Project, sources and maintenance' }
  ].map(Object.freeze));
  function selected(url) {
    if (/^\/ripple(?:\/|$)/.test(url.pathname)) return 'ripple';
    const view = url.searchParams.get('view') || url.searchParams.get('preview');
    return destinations.some(item => item.id === view && !item.planned) ? view : 'release-guide';
  }
  function href(item, url) {
    const target = new URL(item.href, url);
    if (url.searchParams.getAll('theme').length === 1 && url.searchParams.get('theme') === 'cisco') target.searchParams.set('theme', 'cisco');
    return target.pathname + target.search + target.hash;
  }
  const api = { destinations, selected, href };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!root.document) return;
  root.VersionCompassNavigation = api;
  const document = root.document, header = document.querySelector('.site-header');
  if (!header) return;
  const url = new URL(root.location.href), active = selected(url);
  if (url.searchParams.getAll('theme').length === 1 && url.searchParams.get('theme') === 'cisco') document.documentElement.classList.add('theme-cisco');
  const brand = header.querySelector('.brand');
  if (brand) brand.href = href({ href: active === 'ripple' ? '/ripple' : '/' }, url);
  header.classList.add('compass-masthead');
  const nav = header.querySelector('.site-nav') || header.appendChild(document.createElement('nav'));
  nav.className = 'site-nav global-navigation'; nav.id = 'global-navigation'; nav.setAttribute('aria-label', 'Main navigation');
  nav.replaceChildren();
  const explore = document.createElement('div'); explore.className = 'explore-disclosure';
  const trigger = document.createElement('button'); trigger.type = 'button'; trigger.className = 'explore-trigger';
  trigger.textContent = 'Explore'; trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', 'explore-destinations');
  if (destinations.find(item => item.id === active)?.group === 'explore') trigger.classList.add('is-current');
  const panel = document.createElement('div'); panel.id = 'explore-destinations'; panel.className = 'explore-destinations'; panel.hidden = true;
  const label = document.createElement('p'); label.className = 'nav-group-label'; label.textContent = 'Explore Version Compass'; panel.append(label);
  function link(item, detail) {
    const anchor = document.createElement('a'); anchor.href = href(item, url); anchor.dataset.siteLink = ''; anchor.dataset.destination = item.id;
    if (item.id === active) anchor.setAttribute('aria-current', 'page');
    const title = document.createElement('span'); title.textContent = item.label; anchor.append(title);
    if (item.badge) { const badge = document.createElement('small'); badge.className = 'nav-status'; badge.textContent = item.badge; anchor.append(badge); }
    if (detail) { const small = document.createElement('small'); small.textContent = item.description; anchor.append(small); }
    return anchor;
  }
  destinations.filter(item => item.group === 'explore').forEach(item => panel.append(link(item, true)));
  explore.append(trigger, panel); nav.append(explore);
  destinations.filter(item => !item.group).forEach(item => {
    if (!item.planned) { nav.append(link(item, item.id === 'ripple')); return; }
    const unavailable = document.createElement('span'); unavailable.className = 'nav-planned'; unavailable.setAttribute('aria-disabled', 'true');
    unavailable.title = item.description; unavailable.innerHTML = 'Advisor <small>Planned</small>'; nav.append(unavailable);
  });
  const menu = document.createElement('button'); menu.type = 'button'; menu.className = 'global-menu-toggle'; menu.textContent = 'Menu';
  menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-controls', nav.id); header.append(menu);
  const mobile = root.matchMedia('(max-width: 760px)');
  function closeExplore(restore) { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); if (restore) trigger.focus(); }
  function openExplore(focus) { panel.hidden = false; trigger.setAttribute('aria-expanded', 'true'); if (focus) { const links = panel.querySelectorAll('a'); links[focus === 'last' ? links.length - 1 : 0].focus(); } }
  function closeMenu(restore) { header.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menu'; closeExplore(false); if (restore) menu.focus(); }
  trigger.addEventListener('click', () => panel.hidden ? openExplore() : closeExplore(false));
  trigger.addEventListener('keydown', event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); openExplore(event.key === 'ArrowUp' ? 'last' : 'first'); } });
  panel.addEventListener('keydown', event => {
    const links = [...panel.querySelectorAll('a')], index = links.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); links[event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus();
    }
  });
  menu.addEventListener('click', () => { if (header.classList.contains('menu-open')) closeMenu(true); else { header.classList.add('menu-open'); menu.setAttribute('aria-expanded', 'true'); menu.textContent = 'Close'; openExplore(); trigger.focus(); } });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (mobile.matches && header.classList.contains('menu-open')) { event.preventDefault(); closeMenu(true); }
    else if (!panel.hidden) { event.preventDefault(); closeExplore(true); }
  });
  document.addEventListener('pointerdown', event => { if (!header.contains(event.target)) { closeExplore(false); if (header.classList.contains('menu-open')) closeMenu(false); } });
  document.addEventListener('focusin', event => { if (!header.contains(event.target)) { closeExplore(false); if (header.classList.contains('menu-open')) closeMenu(false); } else if (!explore.contains(event.target) && !mobile.matches) closeExplore(false); });
  mobile.addEventListener('change', () => { const focused = nav.contains(document.activeElement); closeMenu(false); if (focused && mobile.matches) menu.focus(); });
  root.addEventListener('pageshow', () => closeMenu(false));
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || url.searchParams.get('theme') !== 'cisco') return;
    const target = new URL(anchor.href, root.location.href);
    if (target.origin === root.location.origin && !anchor.hasAttribute('download') && !target.hash) { target.searchParams.set('theme', 'cisco'); anchor.href = target.href; }
  });
  const measure = () => document.documentElement.style.setProperty('--compass-header-height', header.getBoundingClientRect().height + 'px');
  new ResizeObserver(measure).observe(header); measure();
}(typeof window === 'object' ? window : globalThis));
