/* pages-guru.js — halaman guru & login. Markup = ZIP Stitch (views.js); teks contoh diganti data nyata. */
(function () {
  'use strict';
  var K = window.SPK, $ = K.$, $$ = K.$$, T = K.T, esc = K.esc, P = K.Pages, api = K.api, toast = K.toast;

  /* ---------- helper kecil ---------- */
  function setBadge(el, status, teks) {
    if (!el) return; el.className = el.className.split(/\s+/).filter(function (c) { return !/^(bg-|text-(success|warning|destructive|primary|on-|secondary))/.test(c); }).join(' ') + ' ' + (K.BADGE[status] || K.BADGE.Mendekati);
    if (teks !== undefined) { var n = Array.prototype.filter.call(el.childNodes, function (x) { return x.nodeType === 3 && x.nodeValue.trim(); })[0]; if (n) n.nodeValue = teks; else el.textContent = teks; }
  }
  function tn(root, awalan, nilai) { var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) if (n.nodeValue.indexOf(awalan) > -1) { n.nodeValue = nilai; return true; } return false; }
  function cardOf(el) { while (el && el.parentElement) { if (/\b(rounded-2xl|rounded-xl|rounded-3xl)\b/.test(el.className) && /bg-/.test(el.className) && el.parentElement.id !== 'main') return el; el = el.parentElement; } return null; }
  function buang(root, contoh) { var el = K.nodeOf(root, contoh); var c = el && cardOf(el); if (c) c.remove(); else if (el) el.remove(); }
  function barisOf(root, label) { var el = K.nodeOf(root, label); while (el && el.parentElement) { if (el.parentElement.children.length >= 3 && el.parentElement.id !== 'main') return el; el = el.parentElement; } return null; }
  function nilaiSetelah(root, label, v) { var b = barisOf(root, label); if (!b) return; var l = K.nodeOf(b, label); var tgt = l && (l.nextElementSibling || (l.parentElement && l.parentElement.nextElementSibling)); if (tgt) tgt.textContent = v; }
  function buangBaris(root, label) { var b = barisOf(root, label); if (b) b.remove(); }
  function mkg(p) { return (p.mkgTahun || 0) + ' Thn ' + (p.mkgBulan || 0) + ' Bln'; }
  function masaTotal(p) { if (!p.tmtCPNS) return '-'; var b = Math.max(0, Math.floor((Date.now() - new Date(p.tmtCPNS)) / 2629800000)); return Math.floor(b / 12) + ' Thn ' + ('0' + (b % 12)).slice(-2) + ' Bln'; }
  function waFmt(n) { n = String(n || ''); return n.length > 8 ? n.slice(0, 4) + '-' + n.slice(4, 8) + '-' + n.slice(8) : n; }
  function tahunAjaran() { var d = new Date(), y = d.getFullYear(); return d.getMonth() >= 6 ? y + '/' + (y + 1) : (y - 1) + '/' + y; }
  function ringProgress(card, persen) { $$(card, 'circle,path').forEach(function (c) { var da = c.getAttribute('stroke-dasharray'); if (!da || /surface-container/.test(c.getAttribute('class') || '')) return; if (/,\s*100\s*$/.test(da)) c.setAttribute('stroke-dasharray', persen + ', 100'); else { var L = parseFloat(da); if (L > 0 && c.getAttribute('stroke-dashoffset') !== null) c.setAttribute('stroke-dashoffset', String(L * (1 - persen / 100))); } }); }
  function jadwalDari(list, jenis) { return (list || []).filter(function (j) { return j.jenis === jenis; })[0]; }
  function namaLengkap(p) { return p.namaLengkap || p.nama; }
  var AKSI = { LOGIN: 'Masuk ke portal', UNGGAH_BERKAS: 'Berkas SK berhasil diunggah', UNDUH_BERKAS: 'Berkas SK berhasil diunduh', UNDUH_DATA: 'Data Anda berhasil diunduh', UNDUH_PDF: 'Dokumen PDF data Anda diunduh', USULAN_BUAT: 'Usulan baru dikirim ke operator', VERIFIKASI_SAH: 'Usulan Anda disahkan operator', VERIFIKASI_TOLAK: 'Usulan Anda perlu diperbaiki', GANTI_PASSWORD: 'Kata sandi diperbarui', UBAH_KONTAK: 'Kontak diperbarui', USULAN_IMPOR: 'Usulan diimpor dari Excel' };
  var EVENT = { PENGINGAT_JATUH_TEMPO: 'Pengingat jatuh tempo', PENGINGAT_TERLEWAT: 'Peringatan terlewat', USULAN_DISETUJUI: 'Usulan disahkan', USULAN_DITOLAK: 'Usulan perlu perbaikan' };
  function tab(btn, aktif) { }

  /* ================= LOGIN ================= */
  P.login = function (root) {
    var sim = K.nodeOf(root, 'Simulasi Respon:'); if (sim) { var r = sim.closest('div'); (r.parentElement && r.parentElement.id !== 'main' ? r : sim).remove(); }
    var f = { login: $('#form-login'), forgot: $('#form-forgot'), first: $('#form-first') }, tabs = { login: $('#tab-login-btn'), forgot: $('#tab-forgot-btn'), first: $('#tab-first-btn') };
    var aktifCls = tabs.login.className, nonCls = tabs.forgot.className, bErr = $('#banner-error'), bLock = $('#banner-locked');
    function tampil(k) {
      Object.keys(f).forEach(function (x) { f[x].classList.toggle('hidden', x !== k); f[x].classList.toggle('flex', x === k); tabs[x].className = x === k ? aktifCls : nonCls; });
      bErr.classList.add('hidden'); bLock.classList.add('hidden');
    }
    tabs.login.onclick = function () { tampil('login'); }; tabs.forgot.onclick = function () { tampil('forgot'); }; tabs.first.onclick = function () { tampil('first'); };
    $('#link-forgot-pass').onclick = function () { tampil('forgot'); }; $('#btn-back-to-login-1').onclick = $('#btn-back-to-login-2').onclick = function () { tampil('login'); };
    $('#toggle-password').onclick = function () { var i = $('#login-password'), s = i.type === 'password'; i.type = s ? 'text' : 'password'; $('#password-eye-icon').textContent = s ? 'visibility_off' : 'visibility'; };
    function galat(r) {
      if (r.code === 'LOCKED') { bLock.classList.remove('hidden'); bErr.classList.add('hidden'); T(bLock, 'Akun terkunci sementara demi keamanan, silakan c', 'Akun terkunci sementara demi keamanan. '); var d = $$(bLock, 'p,span').filter(function (e) { return !e.children.length && /terkunci|coba/i.test(e.textContent); }).pop(); if (d) d.textContent = r.message; }
      else { bErr.classList.remove('hidden'); bLock.classList.add('hidden'); var t = $$(bErr, 'p,span').filter(function (e) { return !e.children.length && /password|sandi|salah/i.test(e.textContent); })[0]; if (t) t.textContent = r.message; }
    }
    function selesaiLogin(r, ingat) {
      var d = r.data; K.simpanSesi({ token: d.token, peran: d.peran, nip: d.nip, username: d.username, exp: d.exp }, ingat);
      if (d.wajibGantiPw) return gantiSandiPertama(ingat);
      K.S.boot = d.boot; if (d.boot && d.boot.beranda) K.cachePut('beranda', d.boot.beranda); K.go(K.beranda());
    }
    function gantiSandiPertama(ingat) {
      K.modal('<h3 class="font-headline-sm text-headline-sm font-bold mb-1">Buat Kata Sandi Baru</h3><p class="font-body-sm text-body-sm text-text-muted mb-3">Demi keamanan, ganti sandi sementara Anda sebelum melanjutkan.</p>' +
        '<div class="flex flex-col gap-2"><input id="gs-lama" type="password" placeholder="Sandi sementara" class="w-full rounded-xl bg-bg-soft-lilac px-3 py-2.5 font-body-sm"/><input id="gs-baru" type="password" placeholder="Sandi baru (min. 8, huruf & angka)" class="w-full rounded-xl bg-bg-soft-lilac px-3 py-2.5 font-body-sm"/><input id="gs-konf" type="password" placeholder="Ulangi sandi baru" class="w-full rounded-xl bg-bg-soft-lilac px-3 py-2.5 font-body-sm"/><p id="gs-err" class="text-destructive font-caption text-caption hidden"></p></div>' +
        '<div class="flex justify-end gap-2 mt-4"><button data-m="batal" class="px-4 py-2 rounded-xl bg-bg-soft-lilac font-label-md text-label-md">Keluar</button><button data-m="ok" class="px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold">Simpan & Masuk</button></div>',
        { wajib: true, kumpul: function (bg) { var v = { sandiLama: $(bg, '#gs-lama').value, sandiBaru: $(bg, '#gs-baru').value, konfirmasi: $(bg, '#gs-konf').value }; if (v.sandiBaru !== v.konfirmasi) { var e = $(bg, '#gs-err'); e.textContent = 'Konfirmasi sandi tidak sama.'; e.classList.remove('hidden'); return false; } return v; } })
        .then(function (v) {
          if (!v) { K.hapusSesi(); return K.go('login'); }
          return api('gantiPassword', v).then(function (r) { if (!r.success) { toast(r.message, 'err'); return gantiSandiPertama(ingat); } selesaiLogin(r, ingat); });
        });
    }
    f.login.addEventListener('submit', function (e) {
      e.preventDefault(); var btn = $('#btn-submit-login'), ingat = $(f.login, 'input[type=checkbox]').checked; bErr.classList.add('hidden'); bLock.classList.add('hidden');
      K.loading(btn, true, 'Memeriksa…');
      api('login', { identifier: $('#login-username').value.trim(), password: $('#login-password').value, perangkat: navigator.userAgent.slice(0, 100) }).then(function (r) { K.loading(btn, false); if (!r.success) return galat(r); selesaiLogin(r, ingat); });
    });
    f.forgot.addEventListener('submit', function (e) {
      e.preventDefault(); var id = $('#reset-email').value.trim(); if (!id) return toast('Isi NIP atau email terdaftar.', 'err'); var btn = $(f.forgot, 'button[type=submit]'); K.loading(btn, true);
      api('lupa', { identifier: id }).then(function (r) {
        K.loading(btn, false); if (!r.success) return toast(r.message, 'err'); toast('Jika akun terdaftar, kode dikirim ke WhatsApp/email Anda.', 'ok');
        K.modal('<h3 class="font-headline-sm text-headline-sm font-bold mb-1">Masukkan Kode Reset</h3><p class="font-body-sm text-body-sm text-text-muted mb-3">Kode 6 digit berlaku 15 menit. Belum menerima? Hubungi operator TU untuk reset manual.</p><div class="flex flex-col gap-2"><input id="rk-kode" inputmode="numeric" maxlength="6" placeholder="Kode 6 digit" class="w-full rounded-xl bg-bg-soft-lilac px-3 py-2.5 font-body-sm"/><input id="rk-baru" type="password" placeholder="Sandi baru (min. 8, huruf & angka)" class="w-full rounded-xl bg-bg-soft-lilac px-3 py-2.5 font-body-sm"/></div><div class="flex justify-end gap-2 mt-4"><button data-m="batal" class="px-4 py-2 rounded-xl bg-bg-soft-lilac font-label-md text-label-md">Batal</button><button data-m="ok" class="px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold">Ubah Sandi</button></div>',
          { kumpul: function (bg) { return { kode: $(bg, '#rk-kode').value.trim(), sandiBaru: $(bg, '#rk-baru').value }; } }).then(function (v) {
          if (!v) return; api('resetKode', { identifier: id, kode: v.kode, sandiBaru: v.sandiBaru }).then(function (r2) { if (r2.success) { toast(r2.message, 'ok'); tampil('login'); } else toast(r2.message, 'err'); });
        });
      });
    });
    f.first.addEventListener('submit', function (e) {
      e.preventDefault(); var ins = $$(f.first, 'input'), btn = $(f.first, 'button[type=submit]'); K.loading(btn, true, 'Mengaktifkan…');
      api('aktivasi', { identifier: ins[0].value.trim(), sandiSementara: ins[1].value, sandiBaru: ins[2].value, perangkat: navigator.userAgent.slice(0, 100) }).then(function (r) { K.loading(btn, false); if (!r.success) return toast(r.message, 'err'); selesaiLogin(r, false); });
    });
  };

  /* ================= BERANDA ================= */
  function isiBeranda(root, b) {
    var p = b.pegawai, jp = jadwalDari(b.jadwal, 'PANGKAT'), jk = jadwalDari(b.jadwal, 'KGB'), nama = namaLengkap(p);
    T(root, 'Dra. Hj. Siti Aminah, M.Pd', nama); T(root, 'NIP: 19750812 200212 2 003', 'NIP: ' + K.nipFmt(p.nip));
    T(root, 'Penata Tingkat I (Gol. III/d)', (p.pangkat || '-') + ' (Gol. ' + (p.golongan || '-') + ')'); T(root, 'Jabatan: Guru Ahli Madya', 'Jabatan: ' + (p.jabatan || '-'));
    T(root, '1 Oktober 2021', K.tgl(p.tmtPangkat)); T(root, '18 Thn 4 Bln', mkg(p)); T(root, 'Aktif BKN', p.aktif ? 'Aktif' : 'Nonaktif'); T(root, 'Tahun 2025', 'Tahun ' + new Date().getFullYear()); T(root, 'Tahun Ajaran 2024/2025', 'Tahun Ajaran ' + tahunAjaran());
    var c1 = K.itemOf(root, 'Target: 1 Okt 2025'), kartu = c1 ? Array.prototype.slice.call(c1.parentElement.children) : [];
    [[kartu[0], jp, 'Kenaikan Pangkat'], [kartu[1], jk, 'KGB Berkala']].forEach(function (x) {
      var c = x[0], j = x[1]; if (!c) return;
      if (!j) { T(c, '82%', '-'); T(c, 'Target: 1 Okt 2025', 'Belum ada jadwal'); T(c, 'Mendekati (74 Hari)', '-'); return; }
      T(c, '82%', j.persen + '%'); T(c, 'Target: 1 Okt 2025', 'Target: ' + K.tglS(j.jatuhTempo)); ringProgress(c, j.persen);
      var bd = K.nodeOf(c, 'Mendekati (74 Hari)'); setBadge(bd, j.status, j.status === 'Terlewat' ? 'Terlewat (' + Math.abs(j.sisaHari) + ' Hari)' : j.status === 'Sudah diproses' ? 'Sudah diproses' : j.status === 'Belum tiba' ? 'Belum tiba (' + j.sisaHari + ' Hari)' : 'Mendekati (' + j.sisaHari + ' Hari)');
    });
    [['Menunggu', b.usulan.menunggu], ['Diverifikasi', b.usulan.diverifikasi], ['Ditolak', b.usulan.ditolak]].forEach(function (x) {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) if (n.nodeValue.trim() === x[0] && n.parentElement.previousElementSibling && /^\d+$/.test(n.parentElement.previousElementSibling.textContent.trim())) { n.parentElement.previousElementSibling.textContent = x[1]; break; }
    });
    var akt = (b.aktivitas || []).filter(function (a) { return AKSI[a.aksi]; });
    K.isiDaftar(root, 'Hari ini, 09:15 WIB', akt, function (k, a, t) {
      var ps = $$(k, 'p,span,div').filter(function (e) { return !e.children.length; });
      T(k, 'SK Kenaikan Pangkat III/d berhasil diunduh', AKSI[a.aksi]); T(k, 'Hari ini, 09:15 WIB', K.relWaktu(a.waktu)); T(k, 'Arsip Digital', a.aksi === 'LOGIN' ? 'Keamanan' : 'Arsip Digital');
    }, 'Belum ada aktivitas.');
    var ph = $('#notif-btn'); if (ph) { var bd = $$(ph, 'span').filter(function (s) { return /^\d+$/.test(s.textContent.trim()); })[0]; if (bd) { if (b.belumDibaca) bd.textContent = b.belumDibaca; else bd.remove(); } }
  }
  P.beranda = function (root, q, ctx) {
    ['Sinkronisasi Si-ASN (Memuat)', 'Tata Kelola Berkas Terpadu'].forEach(function (s) { buang(root, s); });
    $('#notif-btn').onclick = function () { K.go('notifikasi'); };
    var tombol = $$(root, 'button[type=button]'); tombol.forEach(function (b) { var t = b.textContent; if (/Ajukan Riwayat Baru/.test(t)) b.onclick = function () { K.go('ajukan'); }; else if (/Unggah Berkas SK/.test(t)) b.onclick = function () { K.go('berkas', { unggah: 1 }); }; else if (/Unduh Resume/.test(t)) b.onclick = function () { K.go('unduh'); }; });
    var sm = K.nodeOf(root, 'Semua'); if (sm) sm.onclick = function () { K.go('notifikasi'); };
    var boot = K.S.boot && K.S.boot.beranda; if (boot) isiBeranda(root, boot);
    else { var c = K.cacheGet('beranda'); if (c) isiBeranda(root, c); }
    // segarkan (data bisa berubah sejak login) — render ulang hanya bila ada perubahan bermakna
    return api('boot').then(function (r) { if (ctx.stale() || !r.success) return; K.S.boot = r.data; K.cachePut('beranda', r.data.beranda); var fresh = document.querySelector('#main'); if (fresh) { fresh.innerHTML = window.VIEWS.beranda; ['Sinkronisasi Si-ASN (Memuat)', 'Tata Kelola Berkas Terpadu'].forEach(function (s) { buang(fresh, s); }); isiBeranda(fresh, r.data.beranda); rebind(fresh); } });
    function rebind(m) { $('#notif-btn').onclick = function () { K.go('notifikasi'); }; $$(m, 'button[type=button]').forEach(function (b) { var t = b.textContent; if (/Ajukan Riwayat Baru/.test(t)) b.onclick = function () { K.go('ajukan'); }; else if (/Unggah Berkas SK/.test(t)) b.onclick = function () { K.go('berkas', { unggah: 1 }); }; else if (/Unduh Resume/.test(t)) b.onclick = function () { K.go('unduh'); }; }); }
  };

  /* ================= DATA SAYA ================= */
  P['data-saya'] = function (root, q, ctx) {
    var tabP = $('#btn-tab-pribadi'), tabK = $('#btn-tab-kepegawaian'), cP = $('#content-data-pribadi'), cK = $('#content-data-kepegawaian'), aktifCls = tabP.className, nonCls = tabK.className;
    function pilih(p) { cP.classList.toggle('hidden', !p); cK.classList.toggle('hidden', p); tabP.className = p ? aktifCls : nonCls; tabK.className = p ? nonCls : aktifCls; }
    tabP.onclick = function () { pilih(true); }; tabK.onclick = function () { pilih(false); };
    $$(root, 'img').forEach(function (i) { if (/portrait|Dra\. Hj/.test(i.dataset.alt || '')) i.closest('div') && i.remove(); });
    var modal = $('#modal-kontak'); function buka() { modal.classList.remove('hidden'); } function tutup() { modal.classList.add('hidden'); }
    var btnKontak = $$(root, 'button').filter(function (b) { return /Ubah Kontak$/.test(b.textContent.trim()); })[0], btnPDF = $$(root, 'button').filter(function (b) { return /Biodata PDF/.test(b.textContent); })[0];
    var btnAjukan = $$(root, 'button').filter(function (b) { return /Ajukan Pemutakhiran/.test(b.textContent); })[0];
    if (btnKontak) btnKontak.onclick = buka; $$(modal, 'button').forEach(function (b) { if (/close|Batal/.test(b.textContent)) b.onclick = tutup; });
    modal.addEventListener('click', function (e) { if (e.target === modal) tutup(); });
    $$(root, 'button').filter(function (b) { return /Hubungi Tata Usaha untuk Revisi/.test(b.textContent); }).forEach(function (b) { b.onclick = function () { K.go('bantuan'); }; });
    return api('dataSaya').then(function (r) {
      if (ctx.stale()) return; if (!r.success) return toast(r.message, 'err'); var d = r.data, p = d.pegawai, jp = jadwalDari(d.jadwal, 'PANGKAT'), jk = jadwalDari(d.jadwal, 'KGB');
      T(root, 'Dra. Hj. Siti Aminah, M.Pd', namaLengkap(p)); T(root, 'NIP: 19750812 200212 2 003', 'NIP: ' + K.nipFmt(p.nip)); T(root, 'PNS Aktif', p.statusKepegawaian + (p.aktif ? ' Aktif' : ' Nonaktif'));
      T(root, 'Guru Ahli Madya (Matematika)', p.jabatan || '-'); T(root, 'Guru Ahli Madya', p.jabatan || '-'); T(root, 'Sinkron 07:00 WIB', 'Data terkini'); tn(root, 'Biodata & Riwayat Terintegrasi', 'Biodata & riwayat kepegawaian ' + (p.unitKerja || 'SMAN 1 Kamal'));
      if (jp) { T(root, 'H-74 Hari', K.sisaTeks(jp)); T(root, 'Kenaikan Pangkat (Gol. IV/a)', 'Kenaikan Pangkat (Gol. ' + (d.proyeksi.golonganBerikut || '-') + ')'); T(root, '01 Oktober 2025', K.tgl(jp.jatuhTempo)); setBadge(K.nodeOf(root, 'Mendekati'), jp.status, jp.status); }
      if (jk) setBadge(K.nodeOf(root, 'Memenuhi Syarat'), jk.status, jk.status === 'Mendekati' ? 'Jatuh tempo ' + K.tglS(jk.jatuhTempo) : jk.status + ' · ' + K.tglS(jk.jatuhTempo));
      buang(root, 'PAK Integrasi Terpenuhi:');
      T(root, '352601••••••0002', p.nikMasked || '-'); T(root, 'Islam', p.agama || '-'); T(root, 'Bangkalan, 12 Ags 1975', [p.tempatLahir, K.tglS(p.tanggalLahir)].filter(Boolean).join(', ') || '-'); T(root, 'Perempuan', p.jenisKelamin || '-');
      T(root, '0812-3456-7890', waFmt(p.noWA) || '-'); T(root, 'siti.aminah@guru.sma.belajar.id', p.email || '-'); tn(root, 'Perum Kamal Asri Blok B No. 14, Kamal, Kab.', p.alamat || '-');
      T(root, 'SMA Negeri 1 Kamal', p.unitKerja || 'SMAN 1 Kamal'); tn(root, 'NPSN:', 'Kab. Bangkalan'); buangBaris(root, 'Instansi Induk'); buangBaris(root, 'Nomor Seri KARPEG'); T(root, 'PNS (Tetap)', p.statusKepegawaian);
      T(root, 'Penata Tk. I (III/d)', (p.pangkat || '-') + ' (' + (p.golongan || '-') + ')'); T(root, '01 Oktober 2021', K.tgl(p.tmtPangkat)); T(root, '18 Thn 04 Bln', mkg(p)); T(root, '22 Thn 08 Bln', masaTotal(p));
      var ins = $$(modal, 'input[type=tel]')[0], ta = $(modal, 'textarea'); ins.value = p.noWA || ''; ta.value = p.alamat || '';
      var simpan = $$(modal, 'button').filter(function (b) { return /Simpan Kontak/.test(b.textContent); })[0];
      simpan.onclick = function () { K.loading(simpan, true, 'Menyimpan…'); api('ubahKontak', { noWA: ins.value, alamat: ta.value }).then(function (r2) { K.loading(simpan, false); if (!r2.success) return toast(r2.message, 'err'); tutup(); toast('Data berhasil diperbarui.', 'ok'); var pp = r2.data; T(root, waFmt(p.noWA) || '-', waFmt(pp.noWA)); if (p.alamat) tn(root, p.alamat, pp.alamat); p.noWA = pp.noWA; p.alamat = pp.alamat; }); };
      if (btnAjukan) btnAjukan.onclick = function () {
        K.modal('<h3 class="font-headline-sm text-headline-sm font-bold mb-1">Ajukan Pemutakhiran Data</h3><p class="font-body-sm text-body-sm text-text-muted mb-3">Data terkunci (nama, NIK, golongan, dll.) diubah oleh operator TU. Jelaskan data yang perlu diperbarui.</p><textarea id="pm-cat" rows="4" maxlength="400" class="w-full rounded-xl bg-bg-soft-lilac px-3 py-2.5 font-body-sm" placeholder="Contoh: Gelar saya sudah bertambah M.Pd, mohon diperbarui."></textarea><div class="flex justify-end gap-2 mt-4"><button data-m="batal" class="px-4 py-2 rounded-xl bg-bg-soft-lilac font-label-md text-label-md">Batal</button><button data-m="ok" class="px-4 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold">Kirim</button></div>', { kumpul: function (bg) { return $(bg, '#pm-cat').value; } }).then(function (v) { if (v) api('ajukanPemutakhiran', { catatan: v }).then(function (r2) { toast(r2.message, r2.success ? 'ok' : 'err'); }); });
      };
      if (btnPDF) btnPDF.onclick = function () { K.loading(btnPDF, true, 'Menyusun…'); api('unduhPdf', {}, { timeout: 120000 }).then(function (r2) { K.loading(btnPDF, false); if (!r2.success) return toast(r2.message, 'err'); K.simpanBlob(r2.data.base64, r2.data.nama, r2.data.mime); toast('Biodata PDF diunduh.', 'ok'); }); };
    });
  };

  /* ================= RIWAYAT ================= */
  function kartuRiwayat(k, r, t, pangkat) { /* diisi di bawah */ }
  P.riwayat = function (root, q, ctx) {
    var tP = $('#tabPangkat'), tK = $('#tabKgb'), cP = $('#timelineContainer'), cK = $('#kgbContainer'), kosong = $('#emptyStateContainer'), aktifCls = tP.className, nonCls = tK.className;
    var mode = 'pangkat', filter = 'all', DATA = { pangkat: [], kgb: [] };
    var sheet = $('#proposalSheet'), kirimSheet = $(sheet, 'button[type=submit]');
    function bukaSheet(pre) { sheet.classList.remove('hidden'); sheet.classList.add('flex'); document.body.style.overflow = 'hidden'; }
    function tutupSheet() { sheet.classList.add('hidden'); sheet.classList.remove('flex'); document.body.style.overflow = ''; }
    $('#btnOpenSheet').onclick = bukaSheet; $('#btnCloseSheet').onclick = tutupSheet; $('#btnCancelModal').onclick = tutupSheet; sheet.addEventListener('click', function (e) { if (e.target === sheet) tutupSheet(); });
    $$(root, 'button').filter(function (b) { return /Mulai Ajukan/.test(b.textContent); }).forEach(function (b) { b.onclick = bukaSheet; });
    var fileSheet = null, fi = $('#fileInput'); $('#dropzoneContainer').onclick = function () { fi.click(); };
    fi.onchange = function () { var f = fi.files[0]; if (!f) return; K.bacaBerkas(f).then(function (b) { fileSheet = b; $('#fileNamePreview').textContent = b.nama; $('#progressPercent').textContent = '100%'; $('#progressBar').style.width = '100%'; }).catch(function (e) { fileSheet = null; fi.value = ''; toast(e.message, 'err'); }); };
    $('#uploadFeedback').classList.add('hidden');
    fi.addEventListener('change', function () { $('#uploadFeedback').classList.toggle('hidden', !fileSheet && !fi.files[0]); });
    var gol = $('#golonganTarget'); $('#tmtTarget').min = ''; ta = $('#catatanGuru'); var ta; ta = $('#catatanGuru'); ta.value = '';
    kirimSheet.addEventListener('click', function (e) {
      e.preventDefault(); var jenis = $$(sheet, 'input[name=jenisUsulan]')[0].checked ? 'PANGKAT' : 'KGB';
      var radios = $$(sheet, 'input[name=jenisUsulan]'); jenis = radios[1] && radios[1].checked ? 'KGB' : 'PANGKAT';
      var data = { jenis: jenis, golongan: jenis === 'PANGKAT' ? gol.value.split(' ')[0] : '', tmt: $('#tmtTarget').value, catatan: ta.value, berkas: fileSheet ? [{ jenis: jenis === 'KGB' ? 'SK KGB' : 'SK Pangkat', nama: fileSheet.nama, mime: fileSheet.mime, base64: fileSheet.base64 }] : [] };
      if (!data.tmt) return toast('Isi TMT usulan.', 'err'); if (!data.berkas.length) return toast('Lampirkan minimal satu berkas.', 'err');
      K.loading(kirimSheet, true, 'Mengirim…'); api('usulanBuat', data, { timeout: 120000 }).then(function (r) { K.loading(kirimSheet, false); if (!r.success) return toast(r.message, 'err'); tutupSheet(); toast(r.message, 'ok'); fileSheet = null; fi.value = ''; muat(); });
    });
    var f = { all: 'Semua', menunggu: 'Menunggu', diverifikasi: 'Diverifikasi', ditolak: 'Ditolak' };
    $$(root, '[data-filter]').forEach(function (b) { b.addEventListener('click', function () { filter = b.dataset.filter; $$(root, '[data-filter]').forEach(function (x) { x.dataset.on = x === b ? '1' : ''; }); gambar(); }); });
    var chipOn = null, chipOff = null;
    function pilihTab(m) { mode = m; tP.className = m === 'pangkat' ? aktifCls : nonCls; tK.className = m === 'kgb' ? aktifCls : nonCls; gambar(); }
    tP.onclick = function () { pilihTab('pangkat'); }; tK.onclick = function () { pilihTab('kgb'); };
    // templat kartu pangkat & KGB diambil dari markup Stitch lalu dikosongkan
    var tplP = $$(cP, '[data-status]')[0], tplK = $(cK, '.space-y-space-md').children[1];
    var wadahP = tplP.parentElement, wadahK = tplK.parentElement, htmlTplP = {}, htmlTplK = tplK.cloneNode(true);
    $$(cP, '[data-status]').forEach(function (e) { htmlTplP[e.dataset.status] = e.cloneNode(true); });
    function hapusKartu() { $$(cP, '[data-status]').forEach(function (e) { e.remove(); }); Array.prototype.slice.call(wadahK.children).forEach(function (e, i) { if (i >= 1) e.remove(); }); }
    function berkasLink(r) { return (r.berkas || [])[0]; }
    function kartuPangkat(r) {
      var st = r.status === 'Menunggu' ? 'menunggu' : r.status === 'Ditolak' ? 'ditolak' : 'diverifikasi', base = htmlTplP[st] || htmlTplP.diverifikasi; var k = base.cloneNode(true), b = berkasLink(r);
      var samples = { menunggu: ['Golongan IV/a (Pembina)', 'Usulan Pangkat Reguler / Struktural', '1 Oktober 2025', 'Pending (Dalam Kajian BKD)', 'Draft_SK_Pangkat_IVa.pdf', '1.8 MB • Diunggah Kemarin'], diverifikasi: ['Golongan III/d (Penata Tk. I)', 'Pangkat Saat Ini (SK Sah Terdaftar)', '1 Oktober 2021', '823.3/142/BKD/2021', 'SK_Pangkat_III_d.pdf', '2.4 MB • BKD Prov. Jatim'], ditolak: ['Pengajuan Penyesuaian PAK', 'Usulan Angka Kredit Khusus 2024', '', '', '', ''] }[st];
      if (st === 'ditolak') { T(k, 'Pengajuan Penyesuaian PAK', 'Usulan ' + (r.golongan ? 'Gol. ' + r.golongan : 'Pangkat')); T(k, 'Usulan Angka Kredit Khusus 2024', (r.jenisUsulan || 'Usulan pangkat') + ' • TMT ' + K.tglS(r.tmt)); tn(k, 'Berkas scan SK PAK asli buram', r.alasan || r.instruksi || 'Perlu perbaikan berkas.'); var bp = $(k, '#btnFixSubmission'); if (bp) { bp.removeAttribute('id'); bp.onclick = function () { fixTarget = r; bukaSheet(); }; } }
      else { T(k, samples[0], 'Golongan ' + r.golongan + ' (' + (r.pangkat || '') + ')'); T(k, samples[1], st === 'menunggu' ? (r.jenisUsulan || 'Usulan pangkat') : (r.jenisUsulan === 'Data awal' ? 'Pangkat Saat Ini (Data Awal)' : (r.jenisUsulan || 'Riwayat pangkat'))); T(k, samples[2], K.tgl(r.tmt)); T(k, samples[3], r.noSK && r.noSK !== '-' ? r.noSK : 'Belum ada nomor SK');
        if (b) { T(k, samples[4], b.nama); T(k, samples[5], K.ukuran(b.ukuran) + ' • ' + K.tglS((b.diunggah || '').slice(0, 10))); var dl = $$(k, 'button').filter(function (x) { return /download/.test(x.textContent); })[0]; if (dl) dl.onclick = function () { K.unduhBerkas(b.id, dl); }; var vw = $$(k, 'button').filter(function (x) { return /visibility/.test(x.textContent); })[0]; if (vw) vw.onclick = function () { K.unduhBerkas(b.id, vw); }; }
        else { var fb = K.nodeOf(k, samples[4]); var kt = fb && cardOf(fb); if (fb && fb.closest('div')) { var pr = fb.closest('[class*="rounded-"]'); if (pr && pr !== k) pr.remove(); } } }
      return k;
    }
    function kartuKGB(r, i) { var k = htmlTplK.cloneNode(true), b = berkasLink(r);
      T(k, 'KGB Terakhir (Ke-9)', 'KGB ' + (r.keKe ? 'Ke-' + r.keKe : '') + (r.status !== 'Diverifikasi' ? ' (' + r.status + ')' : '')); T(k, 'Berlaku', r.status === 'Diverifikasi' ? (i === 0 ? 'Berlaku' : 'Arsip') : r.status);
      T(k, 'Masa Kerja Golongan: 18 Tahun 4 Bulan', 'Masa Kerja Golongan: ' + (r.mkgTahun || 0) + ' Tahun ' + (r.mkgBulan || 0) + ' Bulan'); T(k, '1 Januari 2024', K.tgl(r.tmt)); T(k, 'Rp 4.385.200', r.gajiPokok ? K.rp(r.gajiPokok) : 'Belum tercatat');
      if (b) { T(k, 'Surat_Pemberitahuan_KGB_2024.pdf', b.nama); T(k, '1.2 MB • Disdik Jawa Timur', K.ukuran(b.ukuran) + ' • ' + K.tglS((b.diunggah || '').slice(0, 10))); $$(k, 'button').forEach(function (x) { if (/download|visibility/.test(x.textContent)) x.onclick = function () { K.unduhBerkas(b.id, x); }; }); } else { var fb = K.nodeOf(k, 'Surat_Pemberitahuan_KGB_2024.pdf'); var pr = fb && fb.closest('[class*="rounded-"]'); if (pr && pr !== k) pr.remove(); }
      return k; }
    var fixTarget = null;
    function gambar() {
      cP.classList.toggle('hidden', mode !== 'pangkat'); cK.classList.toggle('hidden', mode !== 'kgb'); hapusKartu();
      var list = DATA[mode].filter(function (r) { return filter === 'all' || r.status.toLowerCase() === filter; });
      var kerangka = mode === 'pangkat' ? wadahP : wadahK; if (mode === 'pangkat') list.forEach(function (r) { wadahP.appendChild(kartuPangkat(r)); }); else list.forEach(function (r, i) { wadahK.appendChild(kartuKGB(r, i)); });
      kosong.classList.toggle('hidden', !!list.length); kosong.classList.toggle('flex', !list.length);
      $$(root, '[data-filter]').forEach(function (b) { b.classList.toggle('opacity-60', !!b.dataset.filter && b.dataset.filter !== filter); });
    }
    function muat() {
      return api('riwayatSaya').then(function (r) {
        if (ctx.stale() || !r.success) return r.success || toast(r.message, 'err'); var rows = r.data.rows; DATA.pangkat = rows.filter(function (x) { return x.jenis === 'PANGKAT'; }); DATA.kgb = rows.filter(function (x) { return x.jenis === 'KGB'; });
        $('#countBadgePangkat').textContent = DATA.pangkat.length; $('#countBadgeKgb').textContent = DATA.kgb.length; var c = r.data.ringkas, tot = rows.length;
        $$(root, '[data-filter]').forEach(function (b) { var n = { all: tot, menunggu: c.menunggu, diverifikasi: c.diverifikasi, ditolak: c.ditolak }[b.dataset.filter]; b.textContent = f[b.dataset.filter] + ' (' + n + ')'; });
        var p = K.S.boot && K.S.boot.beranda && K.S.boot.beranda.pegawai; if (p) T(root, 'Aktif III/d', 'Aktif ' + p.golongan); gambar();
      });
    }
    return muat();
  };

  /* ================= AJUKAN (halaman penuh) ================= */
  P.ajukan = function (root, q, ctx) {
    var jenis = 'PANGKAT', berkas = [], tP = $('#tabPangkat'), tK = $('#tabKGB'), aktifCls = tP.className, nonCls = tK.className;
    $$(root, 'button').filter(function (b) { return /arrow_back/.test(b.textContent); })[0].onclick = function () { K.go('riwayat'); };
    var sel = $('#targetGolongan'), tmt = $('#tmtDate'), pak = $('#pakScore'), cat = $('#tuNotes'), cc = $('#charCount'); tmt.type = 'date'; tmt.value = ''; pak.value = ''; cat.value = ''; cc.textContent = '0/250'; cat.maxLength = 250;
    cat.addEventListener('input', function () { cc.textContent = cat.value.length + '/250'; });
    var GOL = ['I/a', 'I/b', 'I/c', 'I/d', 'II/a', 'II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'], NAMA = { 'III/b': 'Penata Muda Tk. I', 'III/c': 'Penata', 'III/d': 'Penata Tk. I', 'IV/a': 'Pembina', 'IV/b': 'Pembina Tk. I', 'IV/c': 'Pembina Utama Muda', 'IV/d': 'Pembina Utama Madya', 'IV/e': 'Pembina Utama' };
    function isiSasaran(g) { var i = GOL.indexOf(g), opsi = GOL.slice(i + 1, i + 4); sel.innerHTML = opsi.map(function (x) { return '<option value="' + x + '">' + (NAMA[x] || x) + ' - Golongan Ruang ' + x + '</option>'; }).join(''); }
    function modeTab(m) { jenis = m; tP.className = m === 'PANGKAT' ? aktifCls : nonCls; tK.className = m === 'KGB' ? aktifCls : nonCls; var grup = sel.closest('div').parentElement; [sel.closest('div'), pak.closest('div')].forEach(function (e) { if (e) e.parentElement && (e.style.display = m === 'KGB' ? 'none' : ''); }); $$(root, 'input[name=proposal_type]').forEach(function (x) { var l = x.closest('label'); if (l) l.parentElement.parentElement.style.display = m === 'KGB' ? 'none' : ''; }); }
    tP.onclick = function () { modeTab('PANGKAT'); }; tK.onclick = function () { modeTab('KGB'); };
    var daftar = K.itemOf(root, 'SK_Pangkat_Terakhir_Dra_Siti_Aminah.pdf'), wadah = daftar ? daftar.parentElement : null, tplFile = daftar ? daftar.cloneNode(true) : null, pakBox = K.nodeOf(root, 'PAK Konversi Terintegrasi');
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.pdf,.jpg,.jpeg,.png'; inp.className = 'file-hidden'; inp.multiple = true; root.appendChild(inp);
    var jenisBerkasBaru = 'SK Pangkat';
    function gambarBerkas() {
      if (!daftar) return; var ind = wadah.children; Array.prototype.slice.call(wadah.children).forEach(function (c) { if (c === daftar || c.dataset.berkas) c.remove(); });
      berkas.forEach(function (b, i) { var k = tplFile.cloneNode(true); k.dataset.berkas = '1'; T(k, 'SK_Pangkat_Terakhir_Dra_Siti_Aminah.pdf', b.nama); T(k, '2.4 MB • Diunggah barusan', K.ukuran(b.ukuran) + ' • Siap dikirim'); T(k, 'Terunggah & Siap Diverifikasi', 'Siap dikirim'); var d = $$(k, 'button').filter(function (x) { return /delete/.test(x.textContent); })[0]; if (d) d.onclick = function () { berkas.splice(i, 1); gambarBerkas(); }; wadah.insertBefore(k, wadah.firstChild); });
    }
    $$(root, 'button').forEach(function (b) { var t = b.textContent.trim(); if (/Pilih Dokumen dari Perangkat/.test(t)) b.onclick = function () { jenisBerkasBaru = jenis === 'KGB' ? 'SK KGB' : 'SK Pangkat'; inp.click(); }; if (t === 'Unggah') b.onclick = function () { jenisBerkasBaru = 'PAK'; inp.click(); }; });
    var dz = K.nodeOf(root, 'Tarik & Lepas Berkas SK ke sini'); var dzc = dz && dz.closest('div[class*="border-dashed"]'); if (dzc) { ['dragover', 'drop'].forEach(function (ev) { dzc.addEventListener(ev, function (e) { e.preventDefault(); if (ev === 'drop') ambil(e.dataTransfer.files); }); }); }
    function ambil(files) { Array.prototype.forEach.call(files, function (f) { K.bacaBerkas(f).then(function (b) { b.jenis = jenisBerkasBaru; berkas.push(b); gambarBerkas(); }).catch(function (e) { toast(f.name + ': ' + e.message, 'err'); }); }); }
    inp.onchange = function () { ambil(inp.files); inp.value = ''; };
    berkas = []; if (daftar) { daftar.remove(); } if (pakBox) { /* baris PAK tetap sebagai tombol unggah */ }
    var submit = $$(root, 'button').filter(function (b) { return /Kirim Usulan Sekarang/.test(b.textContent); })[0], draf = $$(root, 'button').filter(function (b) { return /Simpan Draf/.test(b.textContent); })[0];
    function kirim(isDraf, btn) {
      var data = { jenis: jenis, golongan: sel.value, tmt: tmt.value, jenisUsulan: ((($$(root, 'input[name=proposal_type]').filter(function (x) { return x.checked; })[0] || {}).closest && $$(root, 'input[name=proposal_type]').filter(function (x) { return x.checked; })[0].closest('label').textContent.trim()) || 'Reguler'), angkaKredit: pak.value, catatan: cat.value, draf: isDraf, berkas: berkas.map(function (b) { return { jenis: b.jenis, nama: b.nama, mime: b.mime, base64: b.base64 }; }) };
      if (!data.tmt) return toast('Isi TMT usulan.', 'err'); if (!isDraf && !berkas.length) return toast('Lampirkan minimal satu berkas SK/PAK.', 'err');
      K.loading(btn, true, 'Mengirim…'); api('usulanBuat', data, { timeout: 120000 }).then(function (r) { K.loading(btn, false); if (!r.success) return toast(r.message, 'err'); toast(r.message, 'ok'); K.go('riwayat'); });
    }
    submit.onclick = function () { kirim(false, submit); }; draf.onclick = function () { kirim(true, draf); };
    var ket = K.nodeOf(root, 'Ketentuan Periode Usulan'); var cardKet = ket && cardOf(ket); if (cardKet) cardKet.remove();
    return api('dataSaya').then(function (r) { if (ctx.stale() || !r.success) return; var p = r.data.pegawai; T(root, 'Penata Tk. I', p.pangkat || '-'); T(root, 'Golongan Ruang III/d', 'Golongan Ruang ' + p.golongan); isiSasaran(p.golongan); modeTab('PANGKAT'); });
  };

  /* ================= BERKAS ================= */
  P.berkas = function (root, q, ctx) {
    var stream = $('#document-stream'), item = stream.firstElementChild, tpl = { normal: item.cloneNode(true) }, drafEl = $$(stream, '[data-category]').filter(function (e) { return /Draft Usulan/.test(e.textContent); })[0]; tpl.draf = drafEl ? drafEl.cloneNode(true) : item.cloneNode(true);
    var sheet = $('#upload-bottom-sheet'), BERKAS = [], kat = 'all', pilihFile = null;
    function bukaSheet() { sheet.classList.remove('hidden'); sheet.classList.add('flex'); } function tutupSheet() { sheet.classList.add('hidden'); sheet.classList.remove('flex'); }
    $$(root, 'button').forEach(function (b) { var t = b.textContent; if (/Unggah Dokumen SK$/.test(t.trim()) || /\+ Unggah Dokumen SK/.test(t)) b.onclick = bukaSheet; if (/close/.test(t) && sheet.contains(b)) b.onclick = tutupSheet; if (/Batal/.test(t) && sheet.contains(b)) b.onclick = tutupSheet; });
    sheet.addEventListener('click', function (e) { if (e.target === sheet) tutupSheet(); });
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.pdf,.jpg,.jpeg,.png'; inp.className = 'file-hidden'; root.appendChild(inp);
    var pilihBtn = $$(sheet, 'button').filter(function (b) { return /Browse File Lokal/.test(b.textContent); })[0]; if (pilihBtn) pilihBtn.onclick = function () { inp.click(); };
    var lab = $('#upload-status-label'); lab.closest('div[class*="border-dashed"]') && (lab.closest('div[class*="border-dashed"]').onclick = function (e) { if (!e.target.closest('button')) inp.click(); });
    var penamaan = K.nodeOf(sheet, 'SK-Pangkat_197508122002122003_2025.pdf');
    inp.onchange = function () { var f = inp.files[0]; if (!f) return; K.bacaBerkas(f).then(function (b) { pilihFile = b; lab.textContent = b.nama + ' (' + K.ukuran(b.ukuran) + ')'; }).catch(function (e) { pilihFile = null; lab.textContent = 'Pilih Berkas atau Tarik ke Sini'; toast(e.message, 'err'); }); inp.value = ''; };
    var jenisMap = ['SK Pangkat', 'SK KGB', 'PAK', 'Pendukung'];
    var simpan = $$(sheet, 'button').filter(function (b) { return /Simpan ke Drive/.test(b.textContent); })[0];
    simpan.onclick = function () {
      if (!pilihFile) return toast('Pilih berkas terlebih dulu.', 'err'); var idx = $$(sheet, 'input[name=doc_type]').findIndex(function (x) { return x.checked; }); var jenis = jenisMap[idx < 0 ? 0 : idx];
      K.loading(simpan, true, 'Mengunggah…'); api('berkasUnggah', { jenis: jenis, nama: pilihFile.nama, mime: pilihFile.mime, base64: pilihFile.base64 }, { timeout: 120000 }).then(function (r) { K.loading(simpan, false); if (!r.success) return toast(r.message, 'err'); toast(r.message, 'ok'); tutupSheet(); pilihFile = null; lab.textContent = 'Pilih Berkas atau Tarik ke Sini'; muat(); });
    };
    if (q.unggah) bukaSheet();
    var filt = { all: $('#filter-all'), pangkat: $('#filter-pangkat'), kgb: $('#filter-kgb'), pendukung: $('#filter-pendukung') }, aktifCls = filt.all.className, nonCls = filt.pangkat.className;
    Object.keys(filt).forEach(function (k) { filt[k].onclick = function () { kat = k; gambar(); }; });
    function katOf(b) { return b.jenis === 'SK Pangkat' ? 'pangkat' : b.jenis === 'SK KGB' ? 'kgb' : 'pendukung'; }
    var cmp = { 'Diverifikasi': ['Diverifikasi TU'], 'Menunggu': ['Menunggu Review'], 'Ditolak': ['Ditolak'] };
    function gambar() {
      Object.keys(filt).forEach(function (k) { filt[k].className = k === kat ? aktifCls : nonCls; }); Array.prototype.slice.call(stream.children).forEach(function (c) { c.remove(); });
      var list = BERKAS.filter(function (b) { return kat === 'all' || katOf(b) === kat; });
      if (!list.length) { stream.innerHTML = '<div class="p-6 text-center text-text-muted font-body-sm text-body-sm">Belum ada berkas di kategori ini.</div>'; return; }
      list.forEach(function (b) {
        var k = (b.status === 'Diverifikasi' ? tpl.normal : tpl.draf).cloneNode(true); k.dataset.category = katOf(b);
        T(k, 'SK Kenaikan Pangkat Golongan III/d', b.jenis + ' — ' + b.nama); T(k, 'Draft Usulan SK Pangkat Gol. IV/a', b.jenis + ' — ' + b.nama); T(k, 'PDF • 2.4 MB • Diunggah 12 Okt 2021', b.ekstensi + ' • ' + K.ukuran(b.ukuran) + ' • Diunggah ' + K.tglS((b.diunggah || '').slice(0, 10))); T(k, 'PDF • 3.2 MB • Diunggah 3 hari lalu', b.ekstensi + ' • ' + K.ukuran(b.ukuran) + ' • Diunggah ' + K.tglS((b.diunggah || '').slice(0, 10)));
        T(k, 'Diverifikasi TU', b.status === 'Diverifikasi' ? 'Diverifikasi' : b.status); T(k, 'Menunggu Review', b.status === 'Ditolak' ? 'Ditolak' : 'Menunggu Review');
        $$(k, 'button').forEach(function (x) { var t = x.textContent; if (/Lihat/.test(t)) x.onclick = function () { K.unduhBerkas(b.id, x); }; else if (/Ganti/.test(t)) x.onclick = function () { ganti(b); }; else if (/delete/.test(t)) x.remove(); });
        stream.appendChild(k);
      });
    }
    function ganti(b) { var i = document.createElement('input'); i.type = 'file'; i.accept = '.pdf,.jpg,.jpeg,.png'; i.onchange = function () { K.bacaBerkas(i.files[0]).then(function (f) { return api('berkasGanti', { id: b.id, nama: f.nama, mime: f.mime, base64: f.base64 }, { timeout: 120000 }); }).then(function (r) { toast(r.message, r.success ? 'ok' : 'err'); if (r.success) muat(); }).catch(function (e) { toast(e.message, 'err'); }); }; i.click(); }
    function muat() {
      return api('berkasList').then(function (r) {
        if (ctx.stale() || !r.success) return r.success || toast(r.message, 'err'); BERKAS = r.data.rows; var h = r.data.hitung;
        T(root, 'Semua Berkas (6)', 'Semua Berkas (' + h.semua + ')'); T(root, 'SK Pangkat (3)', 'SK Pangkat (' + h.skPangkat + ')'); T(root, 'SK KGB (2)', 'SK KGB (' + h.skKgb + ')'); T(root, 'PAK & Pendukung (1)', 'PAK & Pendukung (' + h.pendukung + ')');
        filt.all.textContent = 'Semua Berkas (' + h.semua + ')'; filt.pangkat.textContent = 'SK Pangkat (' + h.skPangkat + ')'; filt.kgb.textContent = 'SK KGB (' + h.skKgb + ')'; filt.pendukung.textContent = 'PAK & Pendukung (' + h.pendukung + ')';
        tn(root, 'Folder: 197508122002122003', 'Folder: ' + r.data.folder); T(root, '32.4 MB', K.ukuran(r.data.ukuranTotal)); T(root, '6 Berkas Terarsip Sah', h.semua + ' Berkas Terarsip'); tn(root, 'Sisa 67.6 MB Tersedia', 'Maks. 5 MB per berkas');
        [['Diverifikasi', h.diverifikasi], ['Review TU', h.menunggu], ['Ditolak', h.ditolak]].forEach(function (x) { var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) if (n.nodeValue.trim() === x[0] && n.parentElement.previousElementSibling && /^\d+$/.test(n.parentElement.previousElementSibling.textContent.trim())) { n.parentElement.previousElementSibling.textContent = x[1]; break; } });
        var p = K.S.boot && K.S.boot.beranda; var nm = K.nodeOf(sheet, 'SK-Pangkat_197508122002122003_2025.pdf'); if (nm) nm.textContent = 'SK-Pangkat_' + K.S.nip + '_' + new Date().getFullYear() + '.pdf'; gambar();
      });
    }
    var prog = K.nodeOf(root, 'Penyimpanan Terpakai'); var pc = prog && cardOf(prog); var pg = $$(root, '[style*="width"]').filter(function (e) { return /%/.test(e.getAttribute('style')); })[0]; if (pg) pg.style.width = '0%';
    return muat();
  };

  /* ================= UNDUH DATA ================= */
  P.unduh = function (root, q, ctx) {
    var cPdf = $('#cardFormatPdf'), cX = $('#cardFormatXlsx'), kPdf = $('#checkPdf'), kX = $('#checkXlsx'), fmt = 'pdf', onP = cPdf.className, offP = cX.className, onC = kPdf.className, offC = kX.className;
    function pilih(f) { fmt = f; cPdf.className = f === 'pdf' ? onP : offP; cX.className = f === 'xlsx' ? onP : offP; kPdf.className = f === 'pdf' ? onC : offC; kX.className = f === 'xlsx' ? onC : offC; kPdf.innerHTML = f === 'pdf' ? '<span class="material-symbols-outlined text-[16px]">check</span>' : ''; kX.innerHTML = f === 'xlsx' ? '<span class="material-symbols-outlined text-[16px]">check</span>' : ''; $('#exportBtnText').textContent = f === 'pdf' ? 'Unduh Dokumen Sekarang' : 'Unduh Buku Kerja Excel'; }
    cPdf.onclick = function () { pilih('pdf'); }; cX.onclick = function () { pilih('xlsx'); };
    var cek = $$(root, 'input[type=checkbox]'); var sem = $('#btnSelectAll'); sem.onclick = function () { var semua = cek.every(function (c) { return c.checked; }); cek.forEach(function (c) { c.checked = !semua; }); };
    cek.forEach(function (c) { c.checked = true; });
    ['Rekomendasi', 'Siap Lampiran BKD', 'e-Validasi Aktif', 'Formula PAK Ready', 'Sinkron Dapodik'].forEach(function (s) { var e = K.nodeOf(root, s); if (e && /Rekomendasi/.test(s) === false) { var b = e.closest('span,div'); if (b && /rounded-full|rounded-md|rounded-lg/.test(b.className)) b.remove(); } });
    tn(root, 'Dihasilkan otomatis dengan stempel QR verifikasi', 'Dihasilkan otomatis dari data resmi Si Pangkat & KGB, dilengkapi kode verifikasi dokumen.');
    var main = $('#btnMainExport'), size = $('#sizeBadge'); size.textContent = '';
    main.onclick = function () {
      var komp = { biodata: cek[0].checked, pangkat: cek[1].checked, kgb: cek[2].checked, jadwal: cek[3].checked, berkas: cek[4].checked };
      if (!Object.keys(komp).some(function (k) { return komp[k]; })) return toast('Pilih minimal satu komponen data.', 'err');
      K.loading(main, true, 'Menyiapkan…');
      if (fmt === 'pdf') api('unduhPdf', { komponen: komp }, { timeout: 120000 }).then(function (r) { K.loading(main, false); if (!r.success) return toast(r.message, 'err'); K.simpanBlob(r.data.base64, r.data.nama, r.data.mime); toast('Berkas berhasil diunduh ke perangkat Anda.', 'ok'); riwayat(); });
      else api('unduhData', { komponen: komp, format: 'xlsx' }).then(function (r) {
        if (!r.success) { K.loading(main, false); return toast(r.message, 'err'); } var d = r.data, p = d.pegawai, sheets = [];
        if (komp.biodata) sheets.push({ nama: 'Biodata', rows: [{ NIP: p.nip, Nama: p.namaLengkap, 'Jenis Kelamin': p.jenisKelamin, 'Tempat Lahir': p.tempatLahir, 'Tanggal Lahir': p.tanggalLahir, Agama: p.agama, Jabatan: p.jabatan, 'Unit Kerja': p.unitKerja, Status: p.statusKepegawaian, Golongan: p.golongan, 'TMT Pangkat': p.tmtPangkat, 'MKG (Thn)': p.mkgTahun, 'MKG (Bln)': p.mkgBulan, 'No. WA': p.noWA, Email: p.email, Alamat: p.alamat }] });
        if (komp.pangkat) sheets.push({ nama: 'Riwayat Pangkat', rows: (d.pangkat || []).map(function (x) { return { Golongan: x.golongan, Pangkat: x.pangkat, TMT: x.tmt, 'No. SK': x.noSK, 'Tgl SK': x.tglSK, 'Angka Kredit': x.angkaKredit, Status: x.status }; }) });
        if (komp.kgb) sheets.push({ nama: 'Riwayat KGB', rows: (d.kgb || []).map(function (x) { return { 'KGB Ke': x.keKe, TMT: x.tmt, 'Gaji Pokok': x.gajiPokok, 'MKG (Thn)': x.mkgTahun, 'MKG (Bln)': x.mkgBulan, 'No. SK': x.noSK, Status: x.status }; }) });
        if (komp.jadwal) sheets.push({ nama: 'Jadwal', rows: (d.jadwal || []).map(function (x) { return { Jenis: x.jenisNama, 'TMT Acuan': x.tmtAcuan, 'Jatuh Tempo': x.jatuhTempo, 'Sisa Hari': x.sisaHari, Status: x.status }; }) });
        if (komp.berkas) sheets.push({ nama: 'Berkas', rows: (d.berkas || []).map(function (x) { return { Jenis: x.jenis, Nama: x.nama, Ukuran: K.ukuran(x.ukuran), Status: x.status, Diunggah: (x.diunggah || '').slice(0, 10) }; }) });
        return K.tulisExcel('Data-Kepegawaian_' + p.nip + '.xlsx', sheets).then(function () { K.loading(main, false); toast('Berkas berhasil diunduh ke perangkat Anda.', 'ok'); riwayat(); });
      });
    };
    function riwayat() { api('notifSaya').catch(function () {}); }
    // riwayat unduhan = log aktivitas sendiri
    var jml = K.nodeOf(root, '2 Berkas');
    return Promise.all([api('dataSaya'), api('notifSaya')]).then(function (rs) {
      if (ctx.stale() || !rs[0].success) return; var p = rs[0].data.pegawai, jp = jadwalDari(rs[0].data.jadwal, 'PANGKAT'), jk = jadwalDari(rs[0].data.jadwal, 'KGB');
      T(root, 'Dra. Hj. Siti Aminah, M.Pd', namaLengkap(p)); T(root, 'NIP. 197508122002122003', 'NIP. ' + p.nip); T(root, 'PNS Aktif • SMAN 1 Kamal', p.statusKepegawaian + ' ' + (p.aktif ? 'Aktif' : 'Nonaktif') + ' • ' + (p.unitKerja || 'SMAN 1 Kamal')); T(root, 'SA', K.inisial(p.nama));
      T(root, 'Dra. Hj. Siti Aminah', p.nama); T(root, 'Penata Tk. I (III/d)', (p.pangkat || '-') + ' (' + (p.golongan || '-') + ')'); T(root, '18 Thn 04 Bln', mkg(p)); T(root, '01 Oktober 2025', jk ? K.tgl(jk.jatuhTempo) : '-');
      tn(root, 'Kode Verifikasi BKD:', 'Kode Verifikasi: dibuat saat dokumen diunduh'); buang(root, 'e-Sign Terverifikasi'); var ri = K.nodeOf(root, 'Bangkalan, 23 Feb 2025'); if (ri) ri.textContent = 'Dicetak ' + K.tgl(new Date().toISOString().slice(0, 10));
      var unduhan = (rs[1].success ? rs[1].data.aktivitas : []).filter(function (a) { return /UNDUH_(DATA|PDF)/.test(a.aksi); }).slice(0, 3);
      T(root, '2 Berkas', unduhan.length + ' Berkas'); K.isiDaftar(root, 'Rekap_Lengkap_Pangkat_KGB_SA.pdf', unduhan, function (k, a, t) { T(k, 'Rekap_Lengkap_Pangkat_KGB_SA.pdf', a.aksi === 'UNDUH_PDF' ? 'Dokumen PDF data pegawai' : 'Buku kerja Excel data pegawai'); T(k, '1.8 MB • Hari ini, 08:45 WIB', K.relWaktu(a.waktu)); }, 'Belum ada unduhan.');
      var tel = K.nodeOf(root, 'Data_Kepegawaian_Mandiri_2025.xlsx'); var ti = tel && K.itemOf(root, 'Data_Kepegawaian_Mandiri_2025.xlsx'); if (ti) ti.remove();
    });
  };

  /* ================= PROFIL ================= */
  P.profil = function (root, q, ctx) {
    $$(root, 'img').forEach(function (i) { if (/portrait/.test(i.dataset.alt || '')) i.remove(); });
    buang(root, 'Lihat Kartu Pegawai Digital (Karpeg)'); var kartu = $$(root, 'button').filter(function (b) { return /Karpeg/.test(b.textContent); })[0]; if (kartu) kartu.remove();
    $$(root, 'button').forEach(function (b) { if (/visibility/.test(b.textContent) && !/Lihat/.test(b.textContent)) b.onclick = function () { var i = b.parentElement.querySelector('input'); if (i) i.type = i.type === 'password' ? 'text' : 'password'; }; });
    var tel = $(root, 'input[type=tel]'), em = $(root, 'input[type=email]'), perbarui = $$(root, 'button').filter(function (b) { return /Perbarui Kontak/.test(b.textContent); })[0];
    perbarui.innerHTML = '<span class="material-symbols-outlined">sync</span> Simpan Kontak'; 
    perbarui.onclick = function () { K.loading(perbarui, true, 'Menyimpan…'); api('ubahKontak', { noWA: tel.value, email: em.value }).then(function (r) { K.loading(perbarui, false); toast(r.success ? 'Kontak berhasil diperbarui.' : r.message, r.success ? 'ok' : 'err'); }); };
    var form = $(root, 'button[type=submit]').closest('form') || $(root, 'button[type=submit]').parentElement; var cur = $('#pwd-current'), nw = $('#pwd-new'), cf = $('#pwd-confirm'), sv = $(root, 'button[type=submit]');
    function submitSandi(e) { if (e) e.preventDefault(); if (nw.value !== cf.value) return toast('Konfirmasi sandi tidak sama.', 'err'); K.loading(sv, true, 'Menyimpan…'); api('gantiPassword', { sandiLama: cur.value, sandiBaru: nw.value, konfirmasi: cf.value, perangkat: navigator.userAgent.slice(0, 100) }).then(function (r) { K.loading(sv, false); if (!r.success) return toast(r.message, 'err'); K.simpanSesi({ token: r.data.token, peran: r.data.peran, nip: r.data.nip, username: r.data.username, exp: r.data.exp }, !!localStorage.getItem('spk_s')); cur.value = nw.value = cf.value = ''; toast('Kata sandi berhasil diperbarui.', 'ok'); }); }
    if (form && form.tagName === 'FORM') form.addEventListener('submit', submitSandi); else sv.onclick = submitSandi;
    var kuat = $$(root, 'div').filter(function (d) { return /Sandi Sangat Kuat/.test(d.textContent) && d.children.length < 4 && d.textContent.length < 70; })[0];
    nw.addEventListener('input', function () { var v = nw.value, s = (v.length >= 8) + /[A-Z]/.test(v) + /\d/.test(v) + /[^A-Za-z0-9]/.test(v); var t = K.nodeOf(root, 'Sandi Sangat Kuat') || K.nodeOf(root, 'Sandi Lemah') || K.nodeOf(root, 'Sandi Cukup'); if (t) t.textContent = s >= 4 ? 'Sandi Sangat Kuat' : s >= 3 ? 'Sandi Cukup' : 'Sandi Lemah'; });
    var klr = $$(root, 'button').filter(function (b) { return /Keluar dari Akun/.test(b.textContent); })[0]; klr.onclick = K.keluar;
    var cb = $$(root, 'input[type=checkbox]'); cb.forEach(function (c) { c.disabled = true; c.title = 'Pengaturan kanal dikelola Superadmin'; });
    return Promise.all([api('dataSaya'), api('notifSaya')]).then(function (rs) {
      if (ctx.stale() || !rs[0].success) return; var d = rs[0].data, p = d.pegawai, jk = jadwalDari(d.jadwal, 'KGB'), kanal = rs[1].success ? rs[1].data.kanal : { wa: false, email: false };
      T(root, 'Dra. Hj. Siti Aminah, M.Pd', namaLengkap(p)); T(root, 'NIP: 19750812 200212 2 003', 'NIP: ' + K.nipFmt(p.nip)); T(root, 'Guru Ahli Madya (Matematika)', p.jabatan || '-'); T(root, 'Penata Tk. I / III/d', (p.pangkat || '-') + ' / ' + (p.golongan || '-')); T(root, 'PNS Aktif', p.statusKepegawaian + (p.aktif ? ' Aktif' : ' Nonaktif')); T(root, 'ASN Aktif', p.aktif ? 'Aktif' : 'Nonaktif');
      T(root, 'SMAN 1 Kamal, Bangkalan, Jatim', p.unitKerja || 'SMAN 1 Kamal'); T(root, '18 Tahun 4 Bulan', (p.mkgTahun || 0) + ' Tahun ' + (p.mkgBulan || 0) + ' Bulan'); T(root, '1 Oktober 2021', K.tgl(p.tmtPangkat)); if (jk) { T(root, '1 Oktober 2025', K.tgl(jk.jatuhTempo)); setBadge(K.nodeOf(root, 'Mendekati'), jk.status, jk.status); }
      tel.value = p.noWA || ''; em.value = p.email || ''; T(root, '0812-3456-7890', waFmt(p.noWA) || '-'); T(root, 'Terhubung Bot Fonnte', kanal.wa ? 'WhatsApp aktif' : 'WhatsApp belum diaktifkan'); T(root, 'Aktif (Disarankan)', kanal.wa ? 'Aktif' : 'Belum aktif');
      cb[0].checked = !!kanal.wa; cb[1].checked = !!kanal.email; cb[2].checked = !!kanal.wa;
      var a = K.S.boot && K.S.boot.beranda && K.S.boot.beranda.aktivitas.filter(function (x) { return x.aksi === 'LOGIN'; })[0]; if (a) T(root, 'Hari ini, 08:30 WIB', K.relWaktu(a.waktu)); tn(root, 'dari Mobile Chrome', 'dari perangkat ini. Sesi aktif berlaku 8 jam.');
      T(root, 'Versi 2.4', 'Versi 1.0');
    });
  };

  /* ================= NOTIFIKASI ================= */
  P.notifikasi = function (root, q, ctx) {
    $$(root, 'img').forEach(function (i) { if (/portrait/.test(i.dataset.alt || '')) i.remove(); });
    return api('notifSaya').then(function (r) {
      if (ctx.stale() || !r.success) return r.success || toast(r.message, 'err'); var d = r.data, p = K.S.boot && K.S.boot.beranda && K.S.boot.beranda.pegawai, jp = jadwalDari(d.jadwal, 'PANGKAT');
      if (p) { T(root, 'Dra. Hj. Siti Aminah, M.Pd', namaLengkap(p)); tn(root, 'NIP: 197508122002122003', 'NIP: ' + p.nip + ' • ' + (p.jabatan || '')); T(root, 'IV/a', p.golongan); }
      T(root, 'WA & GMAIL AKTIF', d.kanal.wa || d.kanal.email ? (d.kanal.wa ? 'WA' : '') + (d.kanal.wa && d.kanal.email ? ' & ' : '') + (d.kanal.email ? 'GMAIL' : '') + ' AKTIF' : 'NOTIFIKASI BELUM AKTIF');
      var jm = d.jadwal.slice().sort(function (a, b) { return a.sisaHari - b.sisaHari; })[0]; if (jm) { T(root, 'H-74', 'H' + (jm.sisaHari < 0 ? '+' + Math.abs(jm.sisaHari) : '-' + jm.sisaHari)); T(root, '01 Oktober 2025', K.tgl(jm.jatuhTempo)); T(root, '(Pangkat IV/a)', '(' + jm.jenisNama + ')'); }
      var itemL = K.itemOf(root, 'Jatuh Tempo H-74'); var list = [];
      d.pengingat.forEach(function (x) { list.push({ w: x.waktu, cat: 'reminder', judul: (EVENT[x.event] || x.event) + (x.ambang ? ' · ' + x.ambang : ''), isi: 'Pengingat dikirim lewat ' + (x.kanal === 'WA' ? 'WhatsApp' : 'Gmail') + ' — ' + x.status + '.', tag: x.kanal === 'WA' ? 'WhatsApp' : 'Gmail' }); });
      d.usulan.forEach(function (u) { list.push({ w: u.tglVerifikasi || u.tglInput, cat: 'verification', judul: 'Usulan ' + (u.jenis === 'KGB' ? 'KGB' : 'Pangkat ' + u.golongan) + ' — ' + u.status, isi: u.status === 'Ditolak' ? 'Alasan: ' + (u.alasan || '-') : u.status === 'Diverifikasi' ? 'TMT ' + K.tgl(u.tmt) + ' tercatat resmi.' : 'Menunggu verifikasi operator TU.', tag: 'Verifikasi' }); });
      d.aktivitas.forEach(function (a) { if (AKSI[a.aksi]) list.push({ w: a.waktu, cat: 'activity', judul: AKSI[a.aksi], isi: a.detail || a.target || '', tag: 'Aktivitas' }); });
      list.sort(function (a, b) { return a.w < b.w ? 1 : -1; });
      var wadah = itemL && itemL.parentElement, tpl = itemL && itemL.cloneNode(true);
      if (wadah) { Array.prototype.slice.call(wadah.children).forEach(function (c) { if (c.dataset.cat) c.remove(); });
        list.slice(0, 40).forEach(function (x) { var k = tpl.cloneNode(true); k.dataset.cat = x.cat; k.removeAttribute('data-read'); $$(k, 'h3,h4,p,span,div').forEach(function () {}); T(k, 'Masa Kenaikan Pangkat Golongan IV/a Terdeteksi', x.judul); T(k, 'Jatuh Tempo H-74', x.tag); T(k, 'Hari ini, 08:00 WIB', K.relWaktu(x.w)); var par = $$(k, 'p').filter(function (e) { return e.textContent.length > 60; })[0]; if (par) par.textContent = x.isi; $$(k, 'button,a').forEach(function (b) { if (/Lihat Status|Buka Berkas/.test(b.textContent)) b.onclick = function () { K.go(x.cat === 'verification' ? 'riwayat' : 'berkas'); }; }); wadah.insertBefore(k, wadah.firstChild ? $(wadah, '#emptyFilterState') : null); });
        if (!list.length) $('#emptyFilterState').classList.replace('hidden', 'flex');
        Array.prototype.slice.call(wadah.querySelectorAll('[data-cat]')).forEach(function (c, i, all) { /* urutan sudah terbalik oleh insertBefore */ }); wadah.append.apply(wadah, Array.prototype.slice.call(wadah.querySelectorAll('[data-cat]')).reverse()); }
    });
  };

  /* ================= BANTUAN ================= */
  P.bantuan = function (root, q, ctx) {
    var faq = $('#faq-container'); $$(faq, 'button').forEach(function (b) { b.onclick = function () { var isi = b.nextElementSibling; if (isi) isi.classList.toggle('hidden'); var ic = $$(b, 'span').pop(); if (ic) ic.textContent = isi && isi.classList.contains('hidden') ? 'expand_more' : 'expand_less'; }; });
    $('#help-search').addEventListener('input', function (e) { var v = e.target.value.toLowerCase(); $$(faq, 'button').forEach(function (b) { var blok = b.parentElement; blok.style.display = !v || (blok.textContent.toLowerCase().indexOf(v) > -1) ? '' : 'none'; }); });
    $$(root, 'a,button').forEach(function (b) { var t = b.textContent; if (/Chat WA/.test(t)) b.onclick = function () { var n = (window.__tuWA || ''); if (n) window.open('https://wa.me/' + n); else toast('Nomor WA TU belum diatur oleh operator.', 'err'); }; if (/Panggil TU/.test(t)) b.onclick = function () { toast('Hubungi Ruang Tata Usaha pada jam layanan.', 'info'); }; });
    var form = $('#consultation-form'), fb = $('#ticket-feedback');
    form.addEventListener('submit', function (e) { e.preventDefault(); var btn = $('#btn-submit-ticket'), topik = $('#ticket-topic').value, isi = $('#ticket-desc').value; K.loading(btn, true, 'Mengirim…'); api('bantuanTiket', { topik: topik, pesan: isi }).then(function (r) { K.loading(btn, false); if (!r.success) return toast(r.message, 'err'); fb.classList.remove('hidden'); fb.classList.add('flex'); $('#ticket-desc').value = ''; setTimeout(function () { fb.classList.add('hidden'); fb.classList.remove('flex'); }, 4000); }); });
    ['Wahyu Arisandi, S.Pd', 'tu.kepegawaian@sman1kamal.sch.id'].forEach(function () {});
    tn(root, 'Batas pengunggahan berkas digital melalui portal', 'Batas pengunggahan berkas ditentukan oleh Tata Usaha setiap periode. Tanyakan jadwal terbaru kepada operator TU.');
    T(root, 'Versi 2.4.1', 'Versi 1.0'); T(root, 'Wahyu Arisandi, S.AP', 'Operator Tata Usaha'); T(root, 'Pengelola Kepegawaian & Usulan SMAN 1 Kamal', 'Pengelola Kepegawaian & Usulan'); T(root, 'Drs. Mohammad Ali, M.Pd', 'Kepala Sekolah'); ['tu.kepegawaian@sman1kamal.sch.id'].forEach(function (m) { T(root, m, 'Hubungi lewat Ruang TU'); });
  };
})();
