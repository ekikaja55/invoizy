  1. Gunakan Sandbox Internal: Kita tidak membuat rute publik, melainkan menaruh frame banner monoline di dalam sandbox
  yang sudah ada: src/routes/test-desain/components/OgBannerLab.svelte (dengan kontainer terkunci persis w-[1200px] h-
  [630px]).
  2. Gunakan Fitur "Capture Node Screenshot" Chrome DevTools:
      • Di Chrome/Edge, buka tab banner tersebut di localhost:5173/test-desain.
      • Buka DevTools (F12) → Inspect elemen kotak banner 1200x630 → Tekan Ctrl + Shift + P → Ketik "Capture node
      screenshot".
      • Browser akan otomatis mengekspor gambar PNG berukuran persis 1200 × 630 piksel murni tanpa bilah browser, tanpa
      distorsi DPI, dan langsung tajam.
  3. Simpan file hasil tangkapan tersebut langsung ke static/og.png.
  4. Kita tidak perlu menghapus file rute apapun, karena rute test-desain memang merupakan ruang laboratorium permanen
  kita.

# Roadmap & Tracking Implementasi: Warm Monoline Invoizy

Dokumen ini adalah acuan kerja tunggal untuk restyling seluruh antarmuka riil Invoizy dari palet lama (*scrapbook/neo-brutalist*) ke **Warm Monoline Design System**, merujuk penuh pada komponen teruji di sandbox (`/test-desain`).

---

## 📌 Status Fondasi Teknis (Selesai di Fase Sebelumnya)
- [x] Backend database Drizzle ORM + Supabase PostgreSQL
- [x] Autentikasi Admin Better Auth
- [x] Logika Cart Svelte 5 Runes (`cart.svelte.ts`)
- [x] Integrasi Resend Email & Satori PDF Engine
- [x] Sandbox Warm Monoline (`/test-desain`: Primitives, Cards, Navigation, Reorder, Templates, PDF)
- [x] Navigasi Utama: `SidebarNav.svelte` & `MobileFab.svelte` (Decoupled hover labels, Option 1 Diamond Badge, Grid background)
- [x] Halaman Error Global: `+error.svelte`

---

## 🚀 FASE A — Public Storefront & Design Tokens (Prioritas Utama)

Tujuan: Menyelaraskan token global Tailwind v4 dan merestyling etalase belanja publik yang pertama kali diakses buyer.

### 1. Tokenisasi Tailwind v4 di `src/app.css`
- [x] Daftarkan token warna Warm Monoline di blok `@theme`:
  - Canvas & Surface: `--color-canvas` (`#f2efe9`), `--color-surface` (`#ffffff`), sunken (`#f9f7f2`)
  - Ink & Stroke: `--color-mono-ink` (`#262626`), `--color-mono-muted` (`#404040`)
  - Aksen Warm Monoline: `--color-brand-peach` (`#fea770`), `--color-brand-mint` (`#a2e1db`), `--color-brand-lavender` (`#b4a6d5`)
  - Semantic Status: `--color-mono-danger`, `--color-mono-success`, `--color-mono-warning`
- [x] Daftarkan utility shadow monoline: `--shadow-mono-sm`, `--shadow-mono`, `--shadow-mono-md`, `--shadow-mono-lg`.

### 2. Landing Page (`src/routes/(public)/+page.svelte`)
- [x] Bersihkan styling lama (`border-brandy`, `bg-yellow-200`, `text-ink`, `rounded-[14px_6px_12px_8px]`).
- [x] Hero Section: Banner event ChibiconXI monoline, headline font-serif elegan, subtitle batch order.
- [x] Action CTA: Tombol utama "Mulai Order" monoline tactile (`shadow-[4px_4px_0px_#262626]`) + secondary "Riwayat Pesanan".
- [x] How-to-Order Stepper: 4 kartu langkah belanja bergaya monoline card (2-col grid responsive) dengan nomor monoline badge.
- [x] Quick Contact Footer/Info box monoline.

### 3. Katalog Produk (`src/routes/(public)/order/+page.svelte`)
- [x] Search & Filter Bar: Input pencarian monoline + pill kategori horizontal scrollable dengan active state monoline.
- [x] Product Grid & Card:
  - Terapkan struktur kartu produk dari `CardsLab.svelte`.
  - Image thumbnail container dengan monoline border & backdrop neutral.
  - Badge stok real-time (`Sisa X` / `Habis` / `PO`).
  - Badge promo bertingkat (*hanging price tag*) dengan aksen apricot.
  - Action footer: Rolling text action footer ("Detail Produk" Eye -> ArrowRight).
- [x] Floating Back-to-Top Button dengan aksen peach monoline.

### 4. Detail Produk & Pilih Varian (`src/routes/(public)/order/products/[id]/+page.svelte`)
- [x] Galeri Foto Monoline & indikator gambar aktif.
- [x] Variant Selector Chips & validasi stok per varian.
- [x] Stepper kuantitas taktil & tombol "Tambah ke Keranjang" (Rolling Ticker CTA).
- [x] Ringkasan promo bertingkat & catatan produk monoline.

---

## 🛒 FASE B — Checkout & Alur Pembayaran

Tujuan: Menjamin pengalaman checkout mulus, minim cognitive load, dan bebas friksi saat input data transaksi.

### 1. Floating Cart Drawer (`src/lib/components/cart/CartDrawer.svelte`)
- [x] Header keranjang monoline + total item count.
- [x] List produk belanjaan sesuai format `CartItemCard` di `CardsLab.svelte` (thumbnail kecil, nama item, varian, stepper qty, tombol hapus).
- [x] Kotak rincian diskon/promo monoline (perhitungan otomatis).
- [x] Subtotal ringkas & tombol checkout besar full-width monoline.

### 2. Form Checkout (`src/routes/(public)/order/checkout/+page.svelte`)
- [x] Section Data Pembeli: Input handle sosmed, email aktif, nomor WhatsApp (menggunakan monoline input dari `PrimitivesLab.svelte`).
- [x] Section Metode Pengiriman:
  - [x] Card selector pengiriman event monoline: "Mail Order (Kirim Paket via Shopee)" vs "Self-Pickup Chibiconxi Day 1 & Day 2".
- [x] Section Catatan Khusus (textarea monoline).
- [x] Section Ringkasan Belanja & accounting double underline total.
- [x] Tombol Submit Order dengan dual-span Rolling Ticker CTA, state loading & proteksi double-submit.

### 3. Halaman Pembayaran (`src/routes/(public)/order/bayar/[orderId]/+page.svelte`)
- [x] Card Instruksi Pembayaran: QRIS image viewer monoline dengan tombol zoom / unduh gambar QRIS.
- [x] Nomor Rekening / VA info dengan tombol copy instant & toast feedback.
- [x] Countdown timer batas pembayaran.
- [x] Form upload struk/bukti transfer monoline dengan preview gambar.
- [x] Tombol konfirmasi transfer sudah dilakukan (Rolling Ticker CTA).

### 4. Halaman Sukses (`src/routes/(public)/order/sukses/[orderId]/+page.svelte`)
- [x] Success Card monoline: Status badge "Order Berhasil Dibuat".
- [x] Ringkasan order ID & link permanen tracking invoice.
- [x] Action buttons: "Buka & Cetak Invoice" (Rolling Ticker CTA), "Hubungi Admin via WhatsApp".

---

## 📄 FASE C — Post-Purchase & Dokumen Invoice

Tujuan: Transparansi status pesanan dan dokumen tagihan resmi yang rapi baik di layar maupun saat dicetak/diexport.

### 1. Riwayat Order (`src/routes/(public)/order/riwayat/+page.svelte`)
- [x] Header monoline & tombol "Hapus Semua" modal konfirmasi.
- [x] Daftar riwayat order: Card order dengan status pill monoline (`PENDING`, `WAITING_VERIFICATION`, `CONFIRMED`, `EXPIRED`, `CANCELLED`).
- [x] Pencegahan CLS dengan integrasi `ListSkeleton.svelte` saat validasi status ke server.
- [x] Tautan langsung ke detail pembayaran / invoice web.

### 2. Halaman Web Invoice (`src/routes/invoice/[orderId]/+page.svelte`)
- [x] Header aksi dokumen: Tombol "Unduh PDF" (Rolling Ticker), "Cetak Faktur", "Kembali" (mengadopsi layout `TemplatesLab.svelte`).
- [x] Integrasi `InvoiceDocument.svelte` versi Warm Monoline yang sudah teruji.
- [x] Banner status pembayaran & shortcut unggah bukti transfer.

### 3. Integritas Cetak & Export PDF
- [x] Audit `@media print`: Pastikan background grid hilang, border tetap tajam monoline hitam `#262626`, dan teks 100% terbaca.
- [x] Verifikasi endpoint PDF generator (`/invoice/[orderId]/pdf`) tetap konsisten dengan render web.

---

## 🛠️ FASE D — Admin Portal & Store Operations (`/admin/*`)

Tujuan: Memberikan dashboard pengelola toko yang efisien, informatif, dan konsisten secara visual.

### 1. Shell & Dashboard Utama (`/admin/+page.svelte`)
- [x] Shell admin canvas Warm Monoline di `src/routes/admin/+layout.svelte`.
- [x] Metric Stats Cards (Total Omset, Jumlah Order, Omzet Hari Ini, Pesanan Hari Ini) mengadopsi `AdminMetricCard` di `CardsLab.svelte`.
- [x] Action queue alerts untuk verifikasi pembayaran dan peringatan stok menipis.
- [x] Native micro bar chart tren penjualan 7 hari terakhir dengan monoline switch.
- [x] Ringkasan status invoice, status pembayaran, dan pesanan terbaru monoline.

### 2. Manajemen Pesanan (`/admin/orders/*`)
- [x] List pesanan (`/admin/orders/+page.svelte`): Filter status tab monoline, pencarian order ID / nama / email, paginasi / infinite scroll.
- [x] Detail pesanan (`/admin/orders/[id]/+page.svelte`):
  - Rincian item snapshot, bukti transfer viewer, aksi ubah status bayar (`CONFIRMED`, `CANCELLED`), tombol resend invoice email / regenerate PDF.

### 3. Katalog & Kategori Admin (`/admin/products/*` & `/admin/categories/*`)
- [x] List produk admin: Toggle status aktif, edit harga & stok inline, indikator varian.
- [x] Form Create/Edit Produk (`new` & `[id]/edit`): Multi-field monoline, upload gambar, dynamic variant builder.
- [x] Reorder Kategori (`/admin/categories`): Mengadopsi drag/drop / button reordering dari `ReorderLab.svelte`.

### 4. Promo & Pengaturan Toko (`/admin/promo/*` & `/admin/settings/*`)
- [x] Atur diskon bertingkat / kupon promo.
- [x] Pengaturan identitas toko, upload QRIS master, rekening bank, dan nomor emergency contact.

---

## 🛡️ FASE E — Verifikasi Akhir, Aksesibilitas & Polish
- [x] Contrast & WCAG AA Audit pada Light Mode dan Dark Mode.
- [x] Mobile Viewport Testing (khususnya alur checkout di layar 360px - 414px).
- [x] Pastikan tidak ada bug input di tema light atau dark yang warnanya saru.
- [x] Pastikan sisi readability nya jangan sampai membuat user kesusahan dalam memakai.  
- [x] Validasi types & linting: `npm run check` (0 error) dan `npm run lint`.
- [x] Final end-to-end smoke test alur order dari katalog hingga invoice PDF.
