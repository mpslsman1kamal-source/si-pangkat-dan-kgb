/* views-extra.js — halaman operator yang TIDAK ada di ZIP Stitch (diturunkan dari token & komponen desain yang sama).
   Dicatat di DESIGN-SYNC.md bagian F. */
window.VIEWS = window.VIEWS || {};
window.VIEWS['riwayat-admin'] = `
<div class="max-w-[1400px] mx-auto flex flex-col gap-space-lg">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <nav class="font-caption text-caption text-text-muted mb-1">Manajemen &rsaquo; <span class="text-primary font-semibold">Riwayat</span></nav>
      <h1 class="font-headline-lg text-headline-lg text-on-surface">Riwayat Pangkat &amp; KGB</h1>
      <p class="font-body-md text-body-md text-text-muted">Kelola seluruh riwayat kenaikan pangkat dan gaji berkala pegawai. Filter berdasarkan NIP atau nama.</p>
    </div>
    <button id="rw-tambah" type="button" class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-sm hover:bg-primary-dark">
      <span class="material-symbols-outlined">add</span><span id="rw-tambah-teks">Tambah Riwayat Pangkat</span>
    </button>
  </div>
  <div class="flex flex-wrap items-center gap-3">
    <button id="rw-tab-pangkat" type="button" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-label-md text-label-md font-bold"><span class="material-symbols-outlined" style="font-size:20px">military_tech</span>Riwayat Pangkat <span id="rw-n-pangkat" class="px-2 py-0.5 rounded-full bg-white/25 font-badge text-badge">0</span></button>
    <button id="rw-tab-kgb" type="button" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-label-md text-label-md font-bold"><span class="material-symbols-outlined" style="font-size:20px">payments</span>Riwayat KGB <span id="rw-n-kgb" class="px-2 py-0.5 rounded-full bg-white/25 font-badge text-badge">0</span></button>
  </div>
  <div class="bg-surface-white rounded-xl border border-border-lilac shadow-sm p-space-md flex flex-wrap items-center gap-3">
    <label class="flex items-center gap-2 flex-1 min-w-[240px] rounded-xl bg-bg-soft-lilac px-3 py-2.5">
      <span class="material-symbols-outlined text-text-muted">search</span>
      <input id="rw-q" type="search" placeholder="Filter NIP atau nama pegawai…" class="bg-transparent border-0 focus:ring-0 w-full font-body-sm text-body-sm p-0" autocomplete="off"/>
    </label>
    <select id="rw-status" class="rounded-xl bg-bg-soft-lilac border-0 px-3 py-2.5 font-body-sm text-body-sm">
      <option value="">Semua Status</option><option>Diverifikasi</option><option>Menunggu</option><option>Ditolak</option>
    </select>
    <button id="rw-reset" type="button" class="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-primary font-label-md text-label-md hover:bg-primary-light"><span class="material-symbols-outlined" style="font-size:18px">restart_alt</span>Reset</button>
  </div>
  <div class="bg-surface-white rounded-xl border border-border-lilac shadow-sm overflow-hidden">
    <div class="overflow-x-auto"><table class="w-full text-left"><thead id="rw-head" class="bg-primary-light"></thead><tbody id="rw-body"></tbody></table></div>
    <div class="flex flex-wrap items-center justify-between gap-3 p-space-md border-t border-border-lilac">
      <span id="rw-info" class="font-caption text-caption text-text-muted"></span><div id="rw-pag" class="flex items-center gap-1"></div>
    </div>
  </div>
</div>`;
