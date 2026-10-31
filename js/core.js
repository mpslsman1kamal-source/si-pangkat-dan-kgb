/* core.js — inti frontend Si Pangkat & KGB
   API murni fetch() ke Google Apps Script (tanpa google.script.run / iframe).
   Pola gas-instant-ux-pro: data layar pertama ikut respons login, cache SWR, idempotensi reqId,
   retry jaringan, optimistic UI di halaman. Markup halaman berasal dari ZIP Stitch (views.js). */
(function () {
  'use strict';
  var C = window.APP_CONFIG;
  var $ = function (r, s) { if (s === undefined) { s = r; r = document; } return (r || document).querySelector(s); };
  var $$ = function (r, s) { if (s === undefined) { s = r; r = document; } return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var tgl = function (y) { if (!y || !/^\d{4}-\d{2}-\d{2}/.test(y)) return y || '-'; var p = String(y).slice(0, 10).split('-'); return (+p[2]) + ' ' + BLN[+p[1] - 1] + ' ' + p[0]; };
  var tglS = function (y) { if (!y || !/^\d{4}-\d{2}-\d{2}/.test(y)) return y || '-'; var p = String(y).slice(0, 10).split('-'); return p[2] + ' ' + BLN[+p[1] - 1].slice(0, 3) + ' ' + p[0]; };
  var rp = function (n) { return 'Rp ' + String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  var ukuran = function (b) { b = Number(b) || 0; return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; };
  var nipFmt = function (n) { n = String(n || ''); return n.length === 18 ? n.slice(0, 8) + ' ' + n.slice(8, 14) + ' ' + n.slice(14, 15) + ' ' + n.slice(15) : n; };
  function relWaktu(iso) {
    if (!iso) return '-'; var d = new Date(iso), s = (Date.now() - d) / 1000;
    var jam = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ' WIB';
    if (s < 86400 && new Date().getDate() === d.getDate()) return 'Hari ini, ' + jam;
    if (s < 172800 && new Date(Date.now() - 86400000).getDate() === d.getDate()) return 'Kemarin, ' + jam;
    return tglS(iso.slice(0, 10)) + ', ' + jam;
  }
  function inisial(n) { var p = String(n || '?').replace(/[^A-Za-z .]/g, '').trim().split(/\s+/).filter(function (x) { return !/\.$/.test(x) || x.length > 3; }); return ((p[0] || '?')[0] + ((p[1] || '')[0] || '')).toUpperCase(); }

  /* ---------- sesi ---------- */
  var S = { token: null, peran: null, nip: null, username: null, boot: null };
  function simpanSesi(o, ingat) {
    S.token = o.token; S.peran = o.peran; S.nip = o.nip; S.username = o.username;
    var st = ingat ? localStorage : sessionStorage; localStorage.removeItem('spk_s'); sessionStorage.removeItem('spk_s');
    st.setItem('spk_s', JSON.stringify({ token: o.token, peran: o.peran, nip: o.nip, username: o.username, exp: o.exp }));
  }
  function muatSesi() {
    try { var r = JSON.parse(sessionStorage.getItem('spk_s') || localStorage.getItem('spk_s') || 'null'); if (r && r.exp > Date.now()) { S.token = r.token; S.peran = r.peran; S.nip = r.nip; S.username = r.username; return true; } } catch (e) {}
    return false;
  }
  function hapusSesi() { S.token = S.peran = S.nip = S.username = S.boot = null; localStorage.removeItem('spk_s'); sessionStorage.removeItem('spk_s'); Object.keys(localStorage).forEach(function (k) { if (k.indexOf('spk_c_') === 0) localStorage.removeItem(k); }); }

  /* ---------- API ---------- */
  var inflight = 0;
  function api(action, data, opt) {
    opt = opt || {};
    var reqId = (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    var body = JSON.stringify({ action: action, data: data || {}, token: S.token || '', reqId: reqId });
    function coba(n) {
      var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, opt.timeout || 90000);
      return fetch(C.GAS_URL, { method: 'POST', body: body, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: ctl.signal })
        .then(function (r) { clearTimeout(to); return r.json(); })
        .catch(function (e) { clearTimeout(to); if (n < 2) return new Promise(function (ok) { setTimeout(ok, 900 * (n + 1)); }).then(function () { return coba(n + 1); }); throw new Error('Koneksi bermasalah. Periksa jaringan Anda lalu coba lagi.'); });
    }
    inflight++; document.documentElement.classList.add('busy');
    return coba(0).then(function (r) {
      if (!r.success && r.code === 'AUTH' && S.token) { hapusSesi(); toast('Sesi berakhir. Silakan masuk kembali.', 'info'); go('login'); }
      return r;
    }).then(function (r) { return r; }, function (e) { return { success: false, message: e.message }; })
      .then(function (r) { inflight--; if (!inflight) document.documentElement.classList.remove('busy'); return r; });
  }
  /* api yang melempar bila gagal (praktis untuk async/await di halaman) */
  function apiOk(action, data, opt) { return api(action, data, opt).then(function (r) { if (!r.success) { var e = new Error(r.message || 'Gagal.'); e.res = r; throw e; } return r; }); }

  /* ---------- cache SWR per pengguna (data layar pertama) ---------- */
  function ck(k) { return 'spk_c_' + (S.nip || '-') + '_' + k; }
  function cacheGet(k) { try { var o = JSON.parse(localStorage.getItem(ck(k)) || 'null'); return o && Date.now() - o.t < 3600000 ? o.v : null; } catch (e) { return null; } }
  function cachePut(k, v) { try { localStorage.setItem(ck(k), JSON.stringify({ t: Date.now(), v: v })); } catch (e) {} }
  function swr(key, action, data, render) {
    var c = cacheGet(key); if (c) render(c, true);
    return api(action, data).then(function (r) { if (r.success) { cachePut(key, r.data); render(r.data, false); } else if (!c) toast(r.message, 'err'); return r; });
  }

  /* ---------- UI helper ---------- */
  function toast(msg, tipe) {
    var el = document.createElement('div'); el.className = 'toast ' + (tipe === 'err' ? 'err' : tipe === 'info' ? 'info' : 'ok');
    el.innerHTML = '<span class="material-symbols-outlined" style="font-size:20px">' + (tipe === 'err' ? 'error' : tipe === 'info' ? 'info' : 'check_circle') + '</span><span>' + esc(msg) + '</span>';
    $('#toasts').appendChild(el); setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, tipe === 'err' ? 5000 : 3200);
  }
  function modal(html, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var bg = document.createElement('div'); bg.className = 'modal-bg';
      bg.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true">' + html + '</div>'; document.body.appendChild(bg);
      function tutup(v) { bg.remove(); resolve(v); }
      bg.addEventListener('click', function (e) { if (e.target === bg && !opts.wajib) tutup(null); });
      bg.addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (!b) return; var v = b.getAttribute('data-m'); if (v === 'ok' && opts.kumpul) { v = opts.kumpul(bg); if (v === false) return; } tutup(v === 'batal' ? null : v); });
      var f = bg.querySelector('input,textarea,select'); if (f) f.focus();
    });
  }
  function tanya(judul, isi, oke, bahaya) {
    return modal('<h3 class="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">' + esc(judul) + '</h3><div class="font-body-sm text-body-sm text-text-muted mb-4">' + isi + '</div><div class="flex gap-2 justify-end"><button data-m="batal" class="px-4 py-2 rounded-xl bg-bg-soft-lilac font-label-md text-label-md text-on-surface">Batal</button><button data-m="ok" class="px-4 py-2 rounded-xl ' + (bahaya ? 'bg-destructive' : 'bg-primary-container') + ' text-on-primary font-label-md text-label-md font-bold">' + esc(oke || 'Ya') + '</button></div>').then(function (v) { return v === 'ok'; });
  }
  function infoKredensial(judul, nip, sandi) {
    return modal('<h3 class="font-headline-sm text-headline-sm font-bold mb-2">' + esc(judul) + '</h3><p class="font-body-sm text-body-sm text-text-muted mb-3">Catat/salin sekarang. Sandi ini hanya ditampilkan sekali dan wajib diganti saat masuk pertama.</p><div class="bg-bg-soft-lilac rounded-xl p-3 mb-3 font-mono text-sm"><div>Username: <b>' + esc(nip) + '</b></div><div>Sandi sementara: <b id="sdi">' + esc(sandi) + '</b></div></div><div class="flex gap-2 justify-end"><button data-m="salin" class="px-4 py-2 rounded-xl bg-primary-light text-primary font-label-md text-label-md">Salin</button><button data-m="ok" class="px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold">Selesai</button></div>', { wajib: true }).then(function (v) { return v; });
  }
  /* tombol "Salin" pada modal kredensial */
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-m="salin"]'); if (b) { var t = document.getElementById('sdi'); if (t && navigator.clipboard) navigator.clipboard.writeText(t.textContent); toast('Disalin.', 'ok'); e.stopPropagation(); } }, true);

  function loading(btn, on, teks) {
    if (!btn) return; if (on) { btn.dataset.h = btn.innerHTML; btn.disabled = true; btn.style.opacity = '.7'; btn.innerHTML = '<span class="material-symbols-outlined animate-spin" style="font-size:18px">progress_activity</span> ' + esc(teks || 'Memproses…'); }
    else { btn.disabled = false; btn.style.opacity = ''; if (btn.dataset.h) btn.innerHTML = btn.dataset.h; }
  }

  /* ---------- pengganti teks contoh Stitch ---------- */
  /* T(root, contoh, nilai): ganti substring pada node teks (hanya yang cocok). */
  function T(root, dari, ke) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, hit = 0, list = [];
    while ((n = w.nextNode())) if (n.nodeValue.indexOf(dari) > -1) list.push(n);
    list.forEach(function (x) { x.nodeValue = x.nodeValue.split(dari).join(ke); hit++; });
    return hit;
  }
  function nodeOf(root, teks) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (n.nodeValue.indexOf(teks) > -1) return n.parentElement;
    return null;
  }
  /* Cari item berulang yang memuat teks contoh: naik sampai induknya punya >=2 anak sejenis. */
  function itemOf(root, contoh) {
    var el = nodeOf(root, contoh); if (!el) return null;
    var tr = el.closest && el.closest('tr'); if (tr && tr.parentElement && tr.parentElement.children.length >= 2 && root.contains(tr)) return tr;
    while (el && el !== root) {
      var p = el.parentElement; if (!p) break;
      var sama = Array.prototype.filter.call(p.children, function (c) { return c.tagName === el.tagName && c.className.split(' ')[0] === el.className.split(' ')[0]; });
      if (sama.length >= 2) return el; el = p;
    }
    return null;
  }
  /* Ganti semua item contoh dengan data nyata. fn(klon, datum, T') — T' = (contoh,nilai)=>ganti pada klon. */
  function isiDaftar(root, contoh, data, fn, kosong) {
    var item = itemOf(root, contoh); if (!item) return null;
    var induk = item.parentElement, tpl = item.cloneNode(true);
    Array.prototype.filter.call(induk.children, function (c) { return item.tagName === 'TR' ? c.tagName === 'TR' : (c.tagName === item.tagName && c.className.split(' ')[0] === item.className.split(' ')[0]); }).forEach(function (c) { c.remove(); });
    if (!data.length && kosong) { var e = document.createElement(item.tagName === 'TR' ? 'tr' : 'div'); e.innerHTML = item.tagName === 'TR' ? '<td colspan="12" class="p-6 text-center text-text-muted font-body-sm text-body-sm">' + esc(kosong) + '</td>' : '<div class="p-6 text-center text-text-muted font-body-sm text-body-sm">' + esc(kosong) + '</div>'; induk.appendChild(e); return induk; }
    data.forEach(function (d, i) { var k = tpl.cloneNode(true); fn(k, d, function (a, b) { return T(k, a, b); }, i); induk.appendChild(k); });
    return induk;
  }
  /* kelas badge status mengikuti token DESIGN.md */
  var BADGE = {
    Diverifikasi: 'bg-success-tint text-success', Menunggu: 'bg-warning-tint text-warning-dark', Ditolak: 'bg-destructive-tint text-destructive',
    Mendekati: 'bg-warning-tint text-warning-dark', Terlewat: 'bg-destructive-tint text-destructive', 'Belum tiba': 'bg-primary-light text-primary', 'Sudah diproses': 'bg-success-tint text-success',
    Aktif: 'bg-success-tint text-success', Nonaktif: 'bg-destructive-tint text-destructive', Draf: 'bg-secondary-container text-on-surface', Gagal: 'bg-destructive-tint text-destructive', Terkirim: 'bg-success-tint text-success'
  };
  var IKON = { Diverifikasi: 'check_circle', Menunggu: 'schedule', Ditolak: 'cancel', Mendekati: 'schedule', Terlewat: 'error', 'Belum tiba': 'event', 'Sudah diproses': 'task_alt', Draf: 'edit_document' };
  function badge(status, teks) {
    return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-badge text-badge ' + (BADGE[status] || 'bg-primary-light text-primary') + '"><span class="material-symbols-outlined" style="font-size:14px">' + (IKON[status] || 'info') + '</span>' + esc(teks || status) + '</span>';
  }
  function sisaTeks(j) { return j.sisaHari < 0 ? 'Terlewat ' + Math.abs(j.sisaHari) + ' Hari' : (j.sisaHari === 0 ? 'Hari ini' : 'H-' + j.sisaHari + ' Hari'); }

  /* ---------- berkas ---------- */
  function bacaBerkas(file) {
    return new Promise(function (ok, no) {
      if (!file) return no(new Error('Tidak ada berkas.'));
      var ext = (file.name.split('.').pop() || '').toLowerCase();
      if (['pdf', 'jpg', 'jpeg', 'png'].indexOf(ext) < 0) return no(new Error('Format ditolak. Hanya PDF, JPG, atau PNG.'));
      if (file.size > 5 * 1024 * 1024) return no(new Error('Ukuran berkas melebihi 5 MB.'));
      var fr = new FileReader(); fr.onload = function () { ok({ nama: file.name, mime: file.type, ukuran: file.size, base64: String(fr.result).split(',')[1] }); }; fr.onerror = function () { no(new Error('Berkas tidak dapat dibaca.')); }; fr.readAsDataURL(file);
    });
  }
  function simpanBlob(b64, nama, mime) {
    var bin = atob(b64), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([arr], { type: mime || 'application/octet-stream' })), a = document.createElement('a');
    a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function unduhBerkas(id, btn) {
    loading(btn, true, 'Mengunduh…');
    return api('berkasUnduh', { id: id }).then(function (r) { loading(btn, false); if (!r.success) return toast(r.message, 'err'); simpanBlob(r.data.base64, r.data.nama, r.data.mime); toast('Berkas berhasil diunduh.', 'ok'); });
  }
  var xlsxP = null;
  function muatXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return xlsxP || (xlsxP = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = function () { ok(window.XLSX); }; s.onerror = function () { xlsxP = null; no(new Error('Pustaka Excel gagal dimuat.')); }; document.head.appendChild(s); }));
  }
  function tulisExcel(nama, sheets) {
    return muatXLSX().then(function (X) { var wb = X.utils.book_new(); sheets.forEach(function (s) { var ws = X.utils.json_to_sheet(s.rows.length ? s.rows : [{ Info: 'Tidak ada data' }]); X.utils.book_append_sheet(wb, ws, s.nama.slice(0, 30)); }); X.writeFile(wb, nama); });
  }
  function bacaExcel(file) {
    return muatXLSX().then(function (X) { return new Promise(function (ok, no) { var fr = new FileReader(); fr.onload = function () { try { var wb = X.read(fr.result, { type: 'array', cellDates: false, raw: false }); var ws = wb.Sheets[wb.SheetNames[0]]; ok(X.utils.sheet_to_json(ws, { defval: '', raw: false })); } catch (e) { no(new Error('File Excel tidak dapat dibaca.')); } }; fr.onerror = function () { no(new Error('File tidak dapat dibaca.')); }; fr.readAsArrayBuffer(file); }); });
  }
  /* tanggal dari Excel (dd/mm/yyyy, d/m/yy, yyyy-mm-dd) → yyyy-mm-dd */
  function tglExcel(v) { v = String(v || '').trim(); var m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/); if (m) { var y = m[3].length === 2 ? '20' + m[3] : m[3]; return y + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2); } return v; }

  /* ---------- router & shell ---------- */
  var GURU = ['beranda', 'data-saya', 'riwayat', 'ajukan', 'berkas', 'unduh', 'profil', 'notifikasi', 'bantuan'];
  var OP = ['dashboard', 'data-pegawai', 'detail-pegawai', 'tambah-pegawai', 'input-riwayat', 'verifikasi', 'jadwal', 'laporan', 'manajemen-akun', 'pengaturan', 'profil'];
  var NAV_GURU = { 'ajukan': 'riwayat', 'unduh': 'berkas', 'notifikasi': 'beranda', 'bantuan': 'profil' };
  var NAV_OP = { 'detail-pegawai': 'data-pegawai', 'tambah-pegawai': 'data-pegawai', 'input-riwayat': 'riwayat', 'profil': 'dashboard' };
  var JUDUL = { beranda: 'Beranda', 'data-saya': 'Data Saya', riwayat: 'Riwayat', ajukan: 'Ajukan Usulan', berkas: 'Berkas Saya', unduh: 'Unduh Data', profil: 'Profil', notifikasi: 'Notifikasi', bantuan: 'Bantuan' };
  var Pages = {}, cur = { name: null, q: {} };
  function parseHash() { var h = location.hash.replace(/^#\/?/, ''), i = h.indexOf('?'), name = (i < 0 ? h : h.slice(0, i)) || '', q = {}; if (i > -1) h.slice(i + 1).split('&').forEach(function (p) { var kv = p.split('='); q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); }); return { name: name, q: q }; }
  function go(name, q) { var h = '#/' + name + (q ? '?' + Object.keys(q).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(q[k]); }).join('&') : ''); if (location.hash === h) route(); else location.hash = h; }
  function isOp() { return S.peran === 'OPERATOR' || S.peran === 'SUPERADMIN'; }
  function beranda() { return isOp() ? 'dashboard' : 'beranda'; }

  function pasangNav(nav, aktif, inaktif, petaAlias) {
    var act = (nav.dataset.activeClasses || '').split(' ').filter(Boolean), target = (petaAlias[cur.name] || cur.name);
    $$(nav, 'a[data-path]').forEach(function (a) {
      a.setAttribute('href', '#/' + a.dataset.path); a.removeAttribute('aria-current');
      act.forEach(function (c) { a.classList.remove(c); }); inaktif.forEach(function (c) { a.classList.add(c); });
      if (a.dataset.path === target) { inaktif.forEach(function (c) { a.classList.remove(c); }); act.forEach(function (c) { a.classList.add(c); }); a.setAttribute('aria-current', 'page'); }
    });
  }
  function bangunShellGuru(view, name) {
    var app = $('#app'), main = document.createElement('main');
    main.className = 'flex-1 flex flex-col relative w-full pt-16 pb-24 bg-bg-soft-lilac'; main.id = 'main'; main.innerHTML = view;
    app.innerHTML = window.SHELL.guruHeader + '<div id="page"></div>' + window.SHELL.guruNav; $('#page').replaceWith(main);
    var h = $(app, 'header'); T(h, 'Beranda', JUDUL[name] || 'Si Pangkat'); h.querySelector('.rounded-full.bg-primary').style.cursor = 'pointer'; h.querySelector('.rounded-full.bg-primary').onclick = function () { go('profil'); };
    pasangNav($(app, 'nav'), 0, ['text-text-muted'], NAV_GURU);
    $$(app, 'nav a .rounded-full.bg-tertiary-fixed-dim').forEach(function (d) { d.remove(); });
    document.body.className = 'bg-bg-soft-lilac text-on-surface min-h-screen flex flex-col';
    return main;
  }
  function bangunShellOp(view, name) {
    var app = $('#app'), wrap = document.createElement('div'); wrap.className = 'op-wrap';
    var aside = window.SHELL.opAside.replace('<aside ', '<aside id="opAside" '), head = window.SHELL.opHeader.replace('<header ', '<header id="opHeader" ');
    wrap.innerHTML = head + '<main class="w-full pt-16 min-h-screen bg-bg-soft-lilac px-space-xl py-space-xl" id="main">' + view + '</main>';
    app.innerHTML = '<button id="opBurger" aria-label="Menu"><span class="material-symbols-outlined">menu</span></button>' + aside; app.appendChild(wrap);
    var as = $('#opAside'); pasangNav($(as, 'nav'), 0, ['text-primary-fixed-dim'], NAV_OP);
    $('#opBurger').onclick = function () { as.classList.toggle('open'); }; as.addEventListener('click', function (e) { if (e.target.closest('a')) as.classList.remove('open'); });
    var kel = $(as, 'a[data-path="keluar"]'); kel.onclick = function (e) { e.preventDefault(); keluar(); };
    var b = S.boot && S.boot.operator || {}; var hd = $('#opHeader');
    T(hd, 'Wahyu Arisandi, S.AP', b.nama || S.username); T(hd, 'Operator Tata Usaha', b.jabatan || 'Operator'); T(hd, 'Superadmin / Operator', S.peran === 'SUPERADMIN' ? 'Superadmin' : 'Operator');
    var av = hd.querySelector('.rounded-full.bg-primary'); av.style.cursor = 'pointer'; av.onclick = function () { go('profil'); };
    var cari = $(hd, 'input'); cari.addEventListener('keydown', function (e) { if (e.key === 'Enter' && cari.value.trim()) go('data-pegawai', { q: cari.value.trim() }); });
    var bel = hd.querySelector('button'); bel.onclick = function () { go('verifikasi'); }; setBadgeVerif();
    if (S.peran !== 'SUPERADMIN') { var p = $(as, 'a[data-path="pengaturan"]'); if (p) p.remove(); }
    document.body.className = 'bg-bg-soft-lilac font-body-md text-on-surface antialiased';
    return $('#main');
  }
  function setBadgeVerif(n) {
    var d = S.boot && S.boot.dashboard; if (n !== undefined && d) d.menunggu = n; var v = d ? d.menunggu : 0;
    var a = $('#opAside a[data-path="verifikasi"]'); if (a) { var b = a.querySelector('.rounded-full.bg-warning-tint'); if (b) { if (v > 0) b.textContent = v; else b.style.display = 'none'; } }
    var bel = $('#opHeader button .bg-destructive'); if (bel) bel.style.display = v > 0 ? '' : 'none';
  }
  function keluar() {
    api('logout').then(function () { hapusSesi(); toast('Anda telah keluar.', 'info'); go('login'); location.reload(); });
  }

  var rid = 0;
  function route() {
    var h = parseHash(), name = h.name;
    if (!name) { name = S.token ? beranda() : 'login'; history.replaceState(null, '', '#/' + name); }
    if (!S.token && name !== 'login') { name = 'login'; history.replaceState(null, '', '#/login'); }
    if (S.token && name === 'login') { name = beranda(); history.replaceState(null, '', '#/' + name); }
    if (S.token) { var ok = isOp() ? OP.indexOf(name) > -1 : GURU.indexOf(name) > -1; if (!ok) { toast('Halaman tidak tersedia untuk peran Anda.', 'err'); name = beranda(); history.replaceState(null, '', '#/' + name); } }
    var key = name; if (name === 'profil' && isOp()) key = 'profil';
    var view = window.VIEWS[key]; if (!view) { $('#app').innerHTML = '<p class="p-6">Halaman tidak ditemukan.</p>'; return; }
    cur = { name: name, q: h.q }; var my = ++rid, root;
    if (name === 'login') { document.body.className = 'bg-bg-soft-lilac text-on-surface min-h-screen pt-safe pb-safe flex flex-col'; $('#app').innerHTML = '<main id="main" class="flex-1 flex flex-col relative w-full bg-bg-soft-lilac">' + view + '</main>'; root = $('#main'); }
    else root = isOp() ? bangunShellOp(view, name) : bangunShellGuru(view, name);
    window.scrollTo(0, 0); var b = $('#boot'); if (b) b.remove();
    var pg = Pages[name]; if (pg) Promise.resolve(pg(root, h.q, { stale: function () { return my !== rid; } })).catch(function (e) { toast(e.message || 'Terjadi kesalahan.', 'err'); console.error(e); });
  }
  window.addEventListener('hashchange', route);

  window.SPK = { $: $, $$: $$, esc: esc, tgl: tgl, tglS: tglS, rp: rp, ukuran: ukuran, nipFmt: nipFmt, relWaktu: relWaktu, inisial: inisial, S: S, api: api, apiOk: apiOk, swr: swr, cacheGet: cacheGet, cachePut: cachePut,
    toast: toast, modal: modal, tanya: tanya, infoKredensial: infoKredensial, loading: loading, T: T, itemOf: itemOf, isiDaftar: isiDaftar, nodeOf: nodeOf, badge: badge, BADGE: BADGE, sisaTeks: sisaTeks,
    bacaBerkas: bacaBerkas, simpanBlob: simpanBlob, unduhBerkas: unduhBerkas, tulisExcel: tulisExcel, bacaExcel: bacaExcel, tglExcel: tglExcel, Pages: Pages, go: go, route: route, simpanSesi: simpanSesi,
    muatSesi: muatSesi, hapusSesi: hapusSesi, isOp: isOp, beranda: beranda, keluar: keluar, setBadgeVerif: setBadgeVerif, cur: function () { return cur; } };
})();
