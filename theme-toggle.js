/*
 * Skylera theme switcher.
 * Muat secara sinkron di <head> (tanpa defer/async) supaya tema terpasang sebelum halaman
 * tergambar — mencegah kedipan light → dark.
 *
 * Markup:
 *   <button data-sk-theme-set="dark|light|system">  pilih preferensi (aria-pressed diatur otomatis)
 *   Default 'dark'; 'system' mengikuti setting perangkat pengunjung.
 *   <button data-sk-theme-toggle>                    tukar light <-> dark
 * JS:
 *   skyleraTheme.set('dark'), skyleraTheme.get() -> 'dark'|'light'|'system', skyleraTheme.resolved()
 *   document.documentElement 'sk-themechange' event -> detail { pref, theme }
 */
(function () {
  var KEY = 'sk-theme';
  var DEFAULT = 'dark'; // dark-first, sesuai visual brand
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var pref = load();

  function valid(v) {
    return v === 'light' || v === 'dark' || v === 'system';
  }

  function load() {
    try {
      var v = localStorage.getItem(KEY);
      if (valid(v)) return v;
    } catch (e) {}
    return DEFAULT;
  }

  function save(v) {
    try {
      if (v === DEFAULT) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, v);
    } catch (e) {}
  }

  function resolve(p) {
    if (p !== 'system') return p;
    return media && media.matches ? 'dark' : 'light';
  }

  function syncControls() {
    var theme = root.getAttribute('data-theme');
    var sets = document.querySelectorAll('[data-sk-theme-set]');
    for (var i = 0; i < sets.length; i++) {
      sets[i].setAttribute('aria-pressed', String(sets[i].getAttribute('data-sk-theme-set') === pref));
    }
    var toggles = document.querySelectorAll('[data-sk-theme-toggle]');
    for (var j = 0; j < toggles.length; j++) {
      toggles[j].setAttribute('aria-label', theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap');
    }
  }

  function apply() {
    var theme = resolve(pref);
    root.setAttribute('data-theme', theme);
    syncControls();
    root.dispatchEvent(new CustomEvent('sk-themechange', { detail: { pref: pref, theme: theme } }));
  }

  function set(p) {
    if (!valid(p)) return;
    pref = p;
    save(p);
    apply();
  }

  window.skyleraTheme = {
    get: function () { return pref; },
    resolved: function () { return root.getAttribute('data-theme'); },
    set: set,
    toggle: function () { set(resolve(pref) === 'dark' ? 'light' : 'dark'); }
  };

  if (media) {
    var onSystemChange = function () { if (pref === 'system') apply(); };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }

  // Samakan pilihan antar-tab yang terbuka
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    pref = valid(e.newValue) ? e.newValue : DEFAULT;
    apply();
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-sk-theme-set],[data-sk-theme-toggle]');
    if (!el) return;
    if (el.hasAttribute('data-sk-theme-toggle')) window.skyleraTheme.toggle();
    else set(el.getAttribute('data-sk-theme-set'));
  });

  document.addEventListener('DOMContentLoaded', syncControls);
  apply();
})();
