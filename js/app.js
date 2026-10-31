/* app.js — bootstrap: pulihkan sesi, pasang router. */
(function () {
  var K = window.SPK;
  if (/GANTI_DENGAN_URL/.test(window.APP_CONFIG.GAS_URL)) {
    document.getElementById('boot') && document.getElementById('boot').remove();
    document.getElementById('app').innerHTML = '<div style="max-width:480px;margin:15vh auto;padding:24px;font-family:sans-serif"><h2>Konfigurasi belum diisi</h2><p>Buka <code>js/config.js</code> lalu isi <code>GAS_URL</code> dengan URL Web App Apps Script (akhiran <code>/exec</code>). Lihat PANDUAN-INSTALASI.md.</p></div>';
    return;
  }
  K.muatSesi();
  // pemanasan server saat halaman dibuka (mengurangi cold start pada login)
  try { fetch(window.APP_CONFIG.GAS_URL + '?w=1', { mode: 'no-cors' }); } catch (e) {}
  if ('serviceWorker' in navigator && location.protocol === 'https:') { /* tanpa SW: data pribadi tidak di-cache offline */ }
  K.route();
})();
