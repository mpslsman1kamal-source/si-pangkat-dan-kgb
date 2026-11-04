/* pages-op3.js — Riwayat (operator/superadmin): daftar, filter NIP, tab Pangkat/KGB, CRUD. */
(function () {
  'use strict';
  var K = window.SPK, $ = K.$, $$ = K.$$, esc = K.esc, api = K.api, toast = K.toast, H = K.H;
  var GOL = ['I/a', 'I/b', 'I/c', 'I/d', 'II/a', 'II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];
  var NAMA_GOL = { 'I/a': 'Juru Muda', 'I/b': 'Juru Muda Tk. I', 'I/c': 'Juru', 'I/d': 'Juru Tk. I', 'II/a': 'Pengatur Muda', 'II/b': 'Pengatur Muda Tk. I', 'II/c': 'Pengatur', 'II/d': 'Pengatur Tk. I', 'III/a': 'Penata Muda', 'III/b': 'Penata Muda Tk. I', 'III/c': 'Penata', 'III/d': 'Penata Tk. I', 'IV/a': 'Pembina', 'IV/b': 'Pembina Tk. I', 'IV/c': 'Pembina Utama Muda', 'IV/d': 'Pembina Utama Madya', 'IV/e': 'Pembina Utama' };
  var INP = 'w-full rounded-xl bg-bg-soft-lilac border-0 px-3 py-2.5 font-body-sm text-body-sm focus:ring-2 focus:ring-primary-container';
  var LBL = 'font-label-md text-label-md text-on-surface mb-1 block';

  function fld(label, id, tipe, nilai, extra) { return '<div class="' + ((extra && extra.span) || '') + '"><label class="' + LBL + '" for="' + id + '">' + label + (extra && extra.wajib ? ' <span class="text-destructive">*</span>' : '') + '</label><input id="' + id + '" type="' + tipe + '" value="' + esc(nilai == null ? '' : nilai) + '" class="' + INP + '"' + ((extra && extra.attr) || '') + '/></div>'; }
  function sel(label, id, opsi, nilai, extra) { return '<div class="' + ((extra && extra.span) || '') + '"><label class="' + LBL + '" for="' + id + '">' + label + (extra && extra.wajib ? ' <span class="text-destructive">*</span>' : '') + '</label><select id="' + id + '" class="' + INP + '">' + opsi.map(function (o) { var v = o[0], t = o[1]; return '<option value="' + esc(v) + '"' + (v === nilai ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>'; }

  K.Pages['riwayat-admin'] = function (root, q, ctx) {
    var st = { jenis: 'PANGKAT', q: q.q || '', status: '', halaman: 1 }, PER = 10, MAP = {}, DATA = null;
    var qi = $(root, '#rw-q'), ss = $(root, '#rw-status'), head = $(root, '#rw-head'), body = $(root, '#rw-body');
    var tabP = $(root, '#rw-tab-pangkat'), tabK = $(root, '#rw-tab-kgb'), tambah = $(root, '#rw-tambah');
    var AKTIF = 'bg-primary-container text-on-primary shadow-sm', NON = 'bg-surface-white text-primary border border-border-lilac hover:bg-primary-light';
    qi.value = st.q;
    function tabUI() {
      tabP.className = tabP.className.replace(/bg-\S+|text-\S+|border\S*|shadow\S*|hover:\S+/g, '').trim() + ' ' + (st.jenis === 'PANGKAT' ? AKTIF : NON);
      tabK.className = tabK.className.replace(/bg-\S+|text-\S+|border\S*|shadow\S*|hover:\S+/g, '').trim() + ' ' + (st.jenis === 'KGB' ? AKTIF : NON);
      $(root, '#rw-tambah-teks').textContent = st.jenis === 'KGB' ? 'Tambah Riwayat KGB' : 'Tambah Riwayat Pangkat';
      $$(root, '#rw-n-pangkat,#rw-n-kgb').forEach(function (n) { n.className = n.className.replace(/bg-\S+/g, '') + (n.id === (st.jenis === 'PANGKAT' ? 'rw-n-pangkat' : 'rw-n-kgb') ? ' bg-white/25' : ' bg-primary-light text-primary'); });
    }
    tabP.onclick = function () { st.jenis = 'PANGKAT'; st.halaman = 1; tabUI(); muat(); };
    tabK.onclick = function () { st.jenis = 'KGB'; st.halaman = 1; tabUI(); muat(); };
    qi.addEventListener('input', H.debounce(function () { st.q = qi.value.trim(); st.halaman = 1; muat(); }, 350));
    ss.onchange = function () { st.status = ss.value; st.halaman = 1; muat(); };
    $(root, '#rw-reset').onclick = function () { qi.value = ''; ss.selectedIndex = 0; st.q = ''; st.status = ''; st.halaman = 1; muat(); };
    tambah.onclick = function () { form(null); };

    /* ---------- kolom (mengikuti tabel Riwayat Pangkat / Riwayat KGB di Detail Pegawai) ---------- */
    var KOLOM = { PANGKAT: ['Pegawai', 'Gol / Pangkat', 'TMT Golongan', 'Surat Keputusan (SK)', 'Jenis Usulan', 'PAK (AK)', 'Dokumen Digital', 'Verifikasi', 'Aksi'],
      KGB: ['Pegawai', 'KGB', 'TMT KGB', 'Gaji Pokok', 'Masa Kerja Golongan', 'Surat Keputusan (SK)', 'Dokumen Digital', 'Verifikasi', 'Aksi'] };
    function td(t, c) { return '<td class="px-3 py-3 font-body-sm text-body-sm text-on-surface align-top ' + (c || '') + '">' + t + '</td>'; }
    function pegawaiSel(r) { return '<div class="flex items-center gap-2"><span class="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-label-md text-label-md shrink-0">' + esc(K.inisial(r.nama)) + '</span><div><div class="font-semibold">' + esc(r.nama) + '</div><div class="font-mono text-[12px] text-text-muted">' + esc(r.nip) + '</div></div></div>'; }
    function dok(r) { return (r.berkas || []).map(function (b) { return '<button type="button" data-dl="' + b.id + '" title="' + esc(b.nama) + '" class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-light text-primary font-badge text-badge mr-1 mb-1"><span class="material-symbols-outlined" style="font-size:16px">download</span>' + esc(b.ekstensi) + '</button>'; }).join('') || '<span class="text-text-muted">—</span>'; }
    function aksi(r) { return '<div class="flex gap-1"><button type="button" data-edit="' + r.id + '" title="Ubah" class="p-1.5 rounded-lg bg-primary-light text-primary hover:bg-primary-container hover:text-on-primary"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button><button type="button" data-del="' + r.id + '" title="Hapus" class="p-1.5 rounded-lg bg-destructive-tint text-destructive hover:bg-destructive hover:text-on-error"><span class="material-symbols-outlined" style="font-size:18px">delete</span></button></div>'; }
    function barisPangkat(r) {
      return '<tr class="border-t border-border-lilac hover:bg-bg-soft-lilac/60">' + td(pegawaiSel(r)) + td('<b>' + esc(r.golongan) + '</b><br><span class="text-text-muted">' + esc(r.pangkat || '') + '</span>') +
        td(esc(K.tglS(r.tmt)) + '<br><span class="text-text-muted">MKG ' + (r.mkgTahun || 0) + ' Thn ' + (r.mkgBulan || 0) + ' Bln</span>') +
        td(esc(r.noSK || '-') + '<br><span class="text-text-muted">Tgl: ' + esc(K.tgl(r.tglSK)) + '</span>' + (r.pejabatSK ? '<br><span class="text-text-muted">' + esc(r.pejabatSK) + '</span>' : '')) +
        td(esc(r.jenisUsulan || '-')) + td(r.angkaKredit ? esc(r.angkaKredit) : '-') + td(dok(r)) + td(K.badge(r.status) + (r.status === 'Ditolak' && r.alasan ? '<div class="text-[12px] text-destructive mt-1 max-w-[160px]">' + esc(r.alasan) + '</div>' : '')) + td(aksi(r)) + '</tr>';
    }
    function barisKgb(r) {
      return '<tr class="border-t border-border-lilac hover:bg-bg-soft-lilac/60">' + td(pegawaiSel(r)) + td('<b>Ke-' + esc(r.keKe) + '</b>') + td(esc(K.tglS(r.tmt))) + td(esc(K.rp(r.gajiPokok))) +
        td((r.mkgTahun || 0) + ' Thn ' + (r.mkgBulan || 0) + ' Bln') + td(esc(r.noSK || '-') + '<br><span class="text-text-muted">Tgl: ' + esc(K.tgl(r.tglSK)) + '</span>' + (r.pejabatSK ? '<br><span class="text-text-muted">' + esc(r.pejabatSK) + '</span>' : '')) +
        td(dok(r)) + td(K.badge(r.status) + (r.status === 'Ditolak' && r.alasan ? '<div class="text-[12px] text-destructive mt-1 max-w-[160px]">' + esc(r.alasan) + '</div>' : '')) + td(aksi(r)) + '</tr>';
    }
    function muat() {
      head.innerHTML = '<tr>' + KOLOM[st.jenis].map(function (c) { return '<th class="px-3 py-3 font-label-md text-label-md text-text-muted whitespace-nowrap">' + c + '</th>'; }).join('') + '</tr>';
      body.innerHTML = '<tr><td colspan="9" class="p-4"><div class="sk" style="height:52px"></div></td></tr>';
      return api('riwayatList', { jenis: st.jenis, q: st.q, status: st.status, halaman: st.halaman, per: PER }).then(function (r) {
        if (ctx.stale()) return; if (!r.success) { body.innerHTML = '<tr><td colspan="9" class="p-6 text-center text-destructive">' + esc(r.message) + '</td></tr>'; return; }
        var d = r.data; DATA = d; MAP = {}; d.rows.forEach(function (x) { MAP[x.id] = x; });
        $(root, '#rw-n-pangkat').textContent = d.hitung.PANGKAT; $(root, '#rw-n-kgb').textContent = d.hitung.KGB;
        body.innerHTML = d.rows.map(st.jenis === 'KGB' ? barisKgb : barisPangkat).join('') || '<tr><td colspan="9" class="p-10 text-center text-text-muted font-body-sm text-body-sm">' + (st.q || st.status ? 'Tidak ada riwayat yang cocok dengan filter.' : 'Belum ada riwayat. Klik “Tambah Riwayat” untuk mengisi.') + '</td></tr>';
        var dari = d.total ? (d.halaman - 1) * d.per + 1 : 0; $(root, '#rw-info').textContent = 'Menampilkan ' + dari + '–' + Math.min(d.total, d.halaman * d.per) + ' dari ' + d.total + ' riwayat';
        H.tabelHal(root, $(root, '#rw-pag'), d.total, d.per, d.halaman, function (h) { st.halaman = h; muat(); });
      });
    }
    body.addEventListener('click', function (e) {
      var dl = e.target.closest('[data-dl]'), ed = e.target.closest('[data-edit]'), dx = e.target.closest('[data-del]');
      if (dl) return K.unduhBerkas(dl.dataset.dl, dl); if (ed) return form(MAP[ed.dataset.edit]);
      if (dx) { var r = MAP[dx.dataset.del]; K.tanya('Hapus riwayat ini?', '<b>' + esc(r.nama) + '</b> (' + esc(r.nip) + ') — ' + (r.jenis === 'KGB' ? 'KGB Ke-' + esc(r.keKe) : 'Pangkat ' + esc(r.golongan)) + ', TMT ' + esc(K.tgl(r.tmt)) + '.<br>Jadwal pegawai dihitung ulang. Berkas tetap tersimpan di Drive. Tindakan ini tercatat di log aktivitas.', 'Ya, Hapus', true).then(function (y) { if (!y) return; api('riwayatHapus', { jenis: r.jenis, id: r.id }).then(function (x) { toast(x.message, x.success ? 'ok' : 'err'); if (x.success) muat(); }); }); }
    });

    /* ---------- FORMULIR (Tambah = KOSONG & berlabel "FORMULIR BARU"; Ubah = terisi & berlabel "MENGUBAH") ---------- */
    function form(rec) {
      var baru = !rec, jenis = baru ? st.jenis : rec.jenis, r = rec || {}, kgb = jenis === 'KGB';
      var jabatan = '';
      var penanda = baru ? '<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-tint text-success font-badge text-badge"><span class="material-symbols-outlined" style="font-size:14px">add_circle</span>FORMULIR BARU</span>' : '<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-warning-tint text-warning-dark font-badge text-badge"><span class="material-symbols-outlined" style="font-size:14px">edit</span>MENGUBAH RIWAYAT · ' + esc(r.id) + '</span>';
      var campur = kgb ? [fld('Kenaikan KGB ke-', 'rf-keke', 'number', r.keKe, { attr: ' min="1" placeholder="otomatis bila kosong"' }), fld('TMT KGB', 'rf-tmt', 'date', r.tmt, { wajib: 1 }), fld('Gaji Pokok Baru (Rp)', 'rf-gaji', 'number', r.gajiPokok || '', { attr: ' min="0" placeholder="mis. 4385200"' })] :
        [sel('Golongan / Ruang', 'rf-gol', [['', '— pilih golongan —']].concat(GOL.map(function (g) { return [g, g + ' — ' + NAMA_GOL[g]]; })), r.golongan || '', { wajib: 1 }), fld('TMT Golongan', 'rf-tmt', 'date', r.tmt, { wajib: 1 }), fld('Jabatan', 'rf-jab', 'text', r.jabatan, { attr: ' placeholder="mis. Guru Ahli Madya"' }),
          sel('Jenis Usulan', 'rf-jenisu', [['', '— pilih —'], ['Reguler', 'Reguler'], ['Pilihan', 'Pilihan'], ['Fungsional', 'Jabatan Fungsional'], ['Data awal', 'Data awal']], r.jenisUsulan || ''), fld('Angka Kredit (PAK)', 'rf-ak', 'number', r.angkaKredit || '', { attr: ' step="0.01" min="0"' })];
      var html = '<div class="p-0"><div class="flex flex-wrap items-center justify-between gap-2 mb-1"><h3 class="font-headline-sm text-headline-sm font-bold">' + (baru ? 'Tambah' : 'Ubah') + ' Riwayat ' + (kgb ? 'KGB' : 'Pangkat') + '</h3>' + penanda + '</div>' +
        '<p class="font-body-sm text-body-sm text-text-muted mb-3">' + (baru ? 'Formulir kosong — isi seluruh data riwayat baru. Tidak ada data yang terisi otomatis.' : 'Mengubah data yang sudah tersimpan. NIP tidak dapat diganti (hapus lalu tambah baru bila salah NIP).') + '</p>' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' + fld('NIP Pegawai', 'rf-nip', 'text', r.nip || '', { wajib: 1, span: 'sm:col-span-2', attr: ' inputmode="numeric" maxlength="25" autocomplete="off" placeholder="Ketik NIP pegawai"' + (baru ? '' : ' readonly') }) + '<p id="rf-peg" class="sm:col-span-2 -mt-2 font-caption text-caption ' + (baru ? 'text-text-muted' : 'text-success') + '">' + (baru ? 'Ketik NIP untuk mencari pegawai.' : esc(r.nama || '')) + '</p>' +
        campur.join('') + fld('Masa Kerja Golongan (Tahun)', 'rf-mkgt', 'number', r.mkgTahun || '', { attr: ' min="0"' }) + fld('Masa Kerja Golongan (Bulan)', 'rf-mkgb', 'number', r.mkgBulan || '', { attr: ' min="0" max="11"' }) +
        fld('Nomor SK', 'rf-nosk', 'text', r.noSK && r.noSK !== '-' ? r.noSK : '', { wajib: 1 }) + fld('Tanggal SK', 'rf-tglsk', 'date', r.tglSK) + fld('Pejabat Penetap SK', 'rf-pej', 'text', r.pejabatSK, { span: 'sm:col-span-2', attr: ' placeholder="mis. Gubernur Jawa Timur"' }) +
        (baru ? '' : sel('Status Verifikasi', 'rf-status', [['Diverifikasi', 'Diverifikasi'], ['Menunggu', 'Menunggu'], ['Ditolak', 'Ditolak']], r.status) + '<div id="rf-alasan-w" class="' + (r.status === 'Ditolak' ? '' : 'hidden') + '"><label class="' + LBL + '" for="rf-alasan">Alasan penolakan <span class="text-destructive">*</span></label><input id="rf-alasan" class="' + INP + '" value="' + esc(r.alasan || '') + '"/></div>') +
        '<div class="sm:col-span-2"><label class="' + LBL + '" for="rf-cat">Catatan</label><textarea id="rf-cat" rows="2" maxlength="300" class="' + INP + '">' + esc(r.catatan || '') + '</textarea></div>' +
        '<div class="sm:col-span-2"><label class="' + LBL + '" for="rf-file">Berkas SK (PDF/JPG/PNG, maks. 5 MB)</label><input id="rf-file" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple class="block w-full font-body-sm text-body-sm"/>' + ((r.berkas || []).length ? '<p class="font-caption text-caption text-text-muted mt-1">Sudah terlampir: ' + r.berkas.map(function (b) { return esc(b.nama); }).join(', ') + '. Berkas baru ditambahkan di samping yang lama.</p>' : '') + '</div></div>' +
        '<p id="rf-err" class="hidden mt-3 p-3 rounded-xl bg-destructive-tint text-destructive font-body-sm text-body-sm"></p>' +
        '<div class="flex justify-end gap-2 mt-4"><button type="button" data-x="batal" class="px-4 py-2.5 rounded-xl bg-bg-soft-lilac font-label-md text-label-md">Batal</button><button type="button" data-x="simpan" class="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold">' + (baru ? 'Simpan Riwayat Baru' : 'Simpan Perubahan') + '</button></div></div>';
      var bg = document.createElement('div'); bg.className = 'modal-bg'; bg.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true" style="max-width:640px;max-height:92vh;overflow:auto;border-top:6px solid ' + (baru ? '#16A34A' : '#FBBF24') + '">' + html + '</div>'; document.body.appendChild(bg);
      var err = $(bg, '#rf-err'); function galat(m) { err.textContent = m; err.classList.remove('hidden'); err.scrollIntoView({ block: 'nearest' }); }
      bg.addEventListener('click', function (e) { if (e.target === bg || e.target.closest('[data-x=batal]')) bg.remove(); });
      var statusEl = $(bg, '#rf-status'); if (statusEl) statusEl.onchange = function () { $(bg, '#rf-alasan-w').classList.toggle('hidden', statusEl.value !== 'Ditolak'); };
      var nipEl = $(bg, '#rf-nip'), pegEl = $(bg, '#rf-peg'), pegOk = !baru, mulai = baru;
      if (baru) nipEl.addEventListener('input', H.debounce(function () {
        var v = nipEl.value.trim(); pegOk = false; if (v.length < 6) { pegEl.className = 'sm:col-span-2 -mt-2 font-caption text-caption text-text-muted'; pegEl.textContent = 'Ketik NIP untuk mencari pegawai.'; return; }
        api('pegawaiList', { q: v, per: 5, aktif: 'Aktif' }).then(function (x) { var m = x.success && x.data.rows.filter(function (p) { return p.nip === v; })[0]; if (m && m.statusKepegawaian === 'Honorer') { pegEl.className = 'sm:col-span-2 -mt-2 font-caption text-caption text-destructive'; pegEl.textContent = 'Pegawai honorer tidak memiliki riwayat pangkat/KGB.'; return; } if (m) { pegOk = true; pegEl.className = 'sm:col-span-2 -mt-2 font-caption text-caption text-success'; pegEl.textContent = '✓ ' + m.namaLengkap + ' — ' + (m.jabatan || '') + ' (' + (m.golongan || '-') + ')'; var j = $(bg, '#rf-jab'); if (j && !j.value) j.value = m.jabatan || ''; } else { pegEl.className = 'sm:col-span-2 -mt-2 font-caption text-caption text-destructive'; pegEl.textContent = 'NIP belum terdaftar di Data Pegawai.'; } });
      }, 350));
      $(bg, '[data-x=simpan]').onclick = function () {
        var b = this, v = function (id) { var e = $(bg, id); return e ? e.value.trim() : ''; }, d = { jenis: jenis, nip: v('#rf-nip'), tmt: v('#rf-tmt'), noSK: v('#rf-nosk'), tglSK: v('#rf-tglsk'), pejabatSK: v('#rf-pej'), mkgTahun: v('#rf-mkgt'), mkgBulan: v('#rf-mkgb'), catatan: v('#rf-cat'), notifWA: false, notifEmail: false };
        if (kgb) { d.keKe = v('#rf-keke'); d.gajiPokok = v('#rf-gaji'); } else { d.golongan = v('#rf-gol'); d.jabatan = v('#rf-jab'); d.jenisUsulan = v('#rf-jenisu'); d.angkaKredit = v('#rf-ak'); }
        if (!d.nip) return galat('NIP wajib diisi.'); if (baru && !pegOk) return galat('NIP belum cocok dengan pegawai terdaftar.'); if (!kgb && !d.golongan) return galat('Pilih golongan/ruang.'); if (!d.tmt) return galat('TMT wajib diisi.'); if (!d.noSK && (baru || (statusEl && statusEl.value === 'Diverifikasi' && r.noSK === '-'))) return galat('Nomor SK wajib diisi.');
        if (!baru) { d.id = r.id; d.status = statusEl.value; d.alasan = v('#rf-alasan'); }
        var files = Array.prototype.slice.call($(bg, '#rf-file').files); err.classList.add('hidden'); K.loading(b, true, 'Menyimpan…');
        Promise.all(files.map(function (f) { return K.bacaBerkas(f); })).then(function (bs) {
          return api(baru ? 'riwayatInput' : 'riwayatUbah', d).then(function (x) {
            if (!x.success) { K.loading(b, false); return galat(x.message); }
            var id = baru ? x.data.id : r.id, statusAkhir = baru ? 'Diverifikasi' : d.status, i = 0, gagal = [];
            (function up() { if (i >= bs.length) { K.loading(b, false); bg.remove(); toast(gagal.length ? 'Riwayat tersimpan, berkas gagal: ' + gagal.join('; ') : (baru ? 'Riwayat baru tersimpan.' : 'Perubahan tersimpan.'), gagal.length ? 'info' : 'ok'); if (baru && st.q && d.nip.indexOf(st.q) < 0) { /* beri tahu bila terfilter */ } return muat(); } var f = bs[i++];
              api('berkasUnggah', { nip: d.nip, jenis: kgb ? 'SK KGB' : 'SK Pangkat', nama: f.nama, mime: f.mime, base64: f.base64, refTipe: jenis, refId: id, tmt: d.tmt }, { timeout: 120000 }).then(function (u) { if (!u.success) gagal.push(f.nama + ': ' + u.message); else if (statusAkhir === 'Diverifikasi') api('berkasStatus', { id: u.data.id, status: 'Diverifikasi' }); up(); }); })();
          });
        }).catch(function (e) { K.loading(b, false); galat(e.message); });
      };
    }
    tabUI(); return muat();
  };
})();
