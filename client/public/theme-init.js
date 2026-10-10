// Runs before the app renders so there is no flash of the wrong theme.
// (Kept as a separate file because the site's Content-Security-Policy blocks inline scripts.)
(function () {
  try {
    var saved = localStorage.getItem('riq-theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
