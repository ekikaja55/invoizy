# Invoizy Design System — Warm Monoline Editorial

Spesifikasi resmi dan panduan implementasi antarmuka Invoizy. Dokumen ini merujuk 100% pada 6 modul laboratorium interaktif yang telah diuji di sandbox (`/test-desain`), menghubungkan komponen visual ke halaman produksi nyata.

---

## 🏛️ Filosofi Desain & Materialitas

1. **Kehangatan Fisik & Garis Presisi (Warm Drafting Material)**
   - Menggunakan kanvas kertas kalkir arsitektur (`#f2efe9` light, `#1a1825` dark) dipadu tekstur `.drafting-grid` (40px) dan `.nav-drafting-grid` (16px).
   - Seluruh batas elemen menggunakan garis tunggal (*monoline*) arang pekat (`#262626`) di light mode dan mint (`#a2e1db`) / krem tipis di dark mode.
2. **Aksen Data Fungsional, Bukan Cat Latar**
   - Warna pastel brand (Peach, Mint, Lavender) hanya berfungsi sebagai *informational highlights* (badge diskon, status stok, kategori aktif, dan hover), bukan latar belakang masif.
3. **Keterbacaan Finansial & Tipografi Disiplin**
   - Huruf *Fraunces* (Serif) untuk judul headline editorial toko.
   - Huruf *Plus Jakarta Sans* untuk keterbacaan teks antarmuka dan form.
   - Huruf *Space Mono* untuk semua angka moneter (Rupiah), kode invoice, kuantitas stepper, dan badge status teknis.
4. **Sentuhan Taktil & Mikro-Interaksi (Rolling Tickers & Crosshairs)**
   - Tombol transaksi dan navigasi menggunakan animasi vertikal *rolling ticker*.
   - Kartu metrik dan ringkasan menggunakan sudut simetris diagonal `rounded-[14px_4px_14px_4px]` dan tanda registrasi arsitektur `+`.

---

## 🎨 TAB 1: Palette & Design Tokens (`ColorPaletteLab`)

Rujukan Kode: `src/routes/test-desain/components/ColorPaletteLab.svelte` & `@theme` di `src/app.css`.

### 1.1 Permukaan & Teks Dasar
| Token CSS | Light Hex | Dark Hex | Peran & Penggunaan |
| :--- | :--- | :--- | :--- |
| `--color-canvas` | `#f2efe9` | `#1a1825` | Kanvas utama seluruh dokumen dan halaman web. |
| `--color-surface` | `#ffffff` | `#252331` | Kartu produk, baris tabel data, modal dialog, kontainer form. |
| `--color-surface-sunken` | `#f9f7f2` | `#1f1d2c` | Kolom total invoice, background stepper, input inactive. |
| `--color-mono-ink` | `#262626` | `#f2efe9` | Garis tepi monoline (1.5px/2px), judul, tombol transaksi utama. |
| `--color-mono-muted` | `#404040` | `#b8b5ad` | Deskripsi produk, teks bantuan, label metadata (kontras > 7:1 AAA). |

### 1.2 Aksen Brand Klien
| Token CSS | Light Hex | Dark Hex | Peran Spesifik |
| :--- | :--- | :--- | :--- |
| `--color-brand-peach` | `#fea770` | `#e88d55` | Badge diskon promo (*hanging price tag*), penanda batch, tombol FAB. |
| `--color-brand-mint` | `#a2e1db` | `#5fb3ab` | Badge stok aman, penanda varian produk, border monoline dark mode. |
| `--color-brand-lavender`| `#b4a6d5` | `#8e7db9` | Latar tab kategori aktif, hover tombol sekunder, bayangan dark mode. |

### 1.3 Semantic Status Tokens (Lolos Uji Kontras WCAG AA)
| Status | Latar Light | Teks Light | Latar Dark | Teks Dark |
| :--- | :--- | :--- | :--- | :--- |
| **Success / PAID** | `#d1fae5` | `#065f46` | `#064e3b` | `#34d399` |
| **Warning / PENDING**| `#fef3c7` | `#92400e` | `#78350f` | `#fbbf24` |
| **Danger / CANCELLED**| `#fee2e2` | `#991b1b` | `#7f1d1d` | `#f87171` |
| **Info / PROCESSING**| `#e0e7ff` | `#3730a3` | `#1e1b4b` | `#a5b4fc` |

### 1.4 Tactile Monoline Shadows
- `--shadow-mono-sm`: `1.5px 1.5px 0px #262626` (Badge, tombol mini)
- `--shadow-mono`: `2px 2px 0px #262626` (Tombol standar, input form)
- `--shadow-mono-md`: `3px 3px 0px #262626` (Kartu modul, dialog, stepper)
- `--shadow-mono-lg`: `4px 4px 0px #262626` (Kartu produk, floating drawer, hero CTA)

---

## 🔘 TAB 2: UI Primitives & Atoms (`PrimitivesLab`)

Rujukan Kode: `src/routes/test-desain/components/PrimitivesLab.svelte` & `src/lib/components/ui/*`.

### 2.1 Buttons & Rolling Ticker Mechanism
Semua tombol monoline interaktif menggunakan struktur **Dual-Span Vertical Rolling Ticker**:
```html
<button class="group relative overflow-hidden rounded-md border-2 border-[#262626] bg-[#262626] px-5 py-2.5 text-sm font-bold text-[#f2efe9] shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626]">
  <span class="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]">
    <Icon size={16} /> Label
  </span>
  <span class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-2 transition-transform duration-300 ease-out group-hover:translate-y-0" aria-hidden="true">
    <Icon size={16} /> Label
  </span>
</button>
```
- **Primary CTA:** Arang pekat `#262626` / Krem `#f2efe9` dark.
- **Secondary Action:** Putih `#ffffff` dengan efek hover Lavender `#b4a6d5`/40 (dark: `#343044` hover `#b4a6d5`).
- **Accent Mint:** `#a2e1db` dengan hover `#8ee0d9`.
- **Danger Action:** `#fee2e2` teks `#991b1b` border `#c1121f`.
- **Action with Async Lock:** Menampilkan spinner saat proses aktif, mencegah double-submit.

### 2.2 Status Badges & Pills
- Bentuk: `rounded-full` dengan border `1.5px` atau `1px solid #262626`.
- Tipografi: `font-mono text-xs font-bold tracking-wider uppercase`.
- Status Aktif: Menggunakan penanda geometris **Diamond Stamp ◈** non-teks.

### 2.3 Form Inputs, Selects & Switches
- Border `1.5px solid #262626` (dark: `#a2e1db`/40 atau `#f2efe9`/30).
- Radius `rounded-md` (6px) atau `rounded-lg` (8px).
- Tidak menggunakan *glow halo* biru; fokus input ditandai dengan garis arang tegas dan *subtle ring offset*.

### 2.4 Overlays, Modals & Monoline Loader
- **Modal Dialog (`Modal.svelte`):** Backdrop arang gelap dengan kartu dialog berbingkai ganda monoline, tombol aksi tegas (batal vs konfirmasi bahaya).
- **Busy Overlay (`BusyOverlay.svelte`):** Menutup area spesifik atau fullscreen dengan backdrop blur.
- **Monoline Loader (`MonolineLoader.svelte`):**
  - Menghilangkan spinner SaaS melingkar generik.
  - Menggunakan **4 kotak geometris monoline** yang berputar dan bertukar posisi secara koreografis: **Lavender (`#b4a6d5`)**, **Mint (`#a2e1db`)**, **Peach (`#fea770`)**, dan **Arang (`#262626`)**.
  - Default minimalis tanpa teks visual dengan label aksesibilitas `<span class="sr-only">`.

### 2.5 Skeleton Loaders (`ListSkeleton.svelte`) & Pagination (`Pagination.svelte`)
Rujukan Kode: `src/lib/components/ui/ListSkeleton.svelte` & `src/lib/components/ui/Pagination.svelte`.

- **Anatomi Visual `ListSkeleton.svelte`:**
  - Menghindari skeleton abu-abu buram generik. Menggunakan kontainer monoline dengan tekstur kertas sunken:
    - Kontainer baris: `animate-pulse rounded-md border-[1.5px] border-[#262626]/20 bg-[#f9f7f2]/80 p-4 shadow-[1.5px_1.5px_0px_#262626]/10 dark:border-[#f2efe9]/20 dark:bg-[#201d2d]/80`.
    - Placeholder teks judul: `h-4 w-36 rounded bg-[#262626]/15 dark:bg-[#f2efe9]/20`.
    - Placeholder subteks: `h-3 w-24 rounded bg-[#262626]/10 dark:bg-[#f2efe9]/12`.
    - Placeholder tombol aksi mikro: 3 kotak `h-7 w-7 rounded-md border border-[#262626]/10 bg-[#262626]/10`.
  - **Fungsi Kritis:** Menjaga Cumulative Layout Shift (CLS) bernilai 0 saat mengambil data riwayat pesanan publik atau baris data pengelola di portal admin.

- **Anatomi `Pagination.svelte`:**
  - Tombol angka dan arah berbingkai monoline `border-[1.5px] border-[#262626] bg-white`.
  - Halaman aktif: Latar Peach (`#fea770`) bergaris tegas dan shadow `1.5px 1.5px 0px #262626`.
  - Tombol nonaktif (*disabled*): Opasitas 40% dengan border monoline redup tanpa interaksi hover.

---

## 🗂️ TAB 3: Cards & Structured Modules (`CardsLab`)

Rujukan Kode: `src/routes/test-desain/components/CardsLab.svelte`.

### 3.1 Public Buyer Product Card (Katalog Toko)
- **Kontainer:** Seluruh kartu clickable (`hover:-translate-y-1 hover:shadow-[5px_5px_0px_#262626]`), berbingkai `border-2 border-[#262626] bg-white p-4.5`.
- **Hanging Price Tag Badge (Pojok Kiri Atas):**
  - Tampil saat produk memiliki promo bertingkat.
  - Tag bersudut miring `-rotate-3` berwarna Peach (`#fea770`) berlubang mata itik (*punched eyelet hole*).
- **Foto Produk:** Wadah berbingkai `border border-[#262626]/20 bg-[#f2efe9]` dengan rasio tajam dan badge jumlah foto tambahan `+{x} foto`.
- **Metadata:** Judul serif tebal (*Fraunces*), harga rupiah tebal (*Space Mono*), badge varian, dan badge stok (Mint `#a2e1db` jika ada, Red `#fee2e2` jika habis).
- **Rolling Action Footer:**
  - Desktop Idle: Teks "Detail Produk" dengan ikon `Eye`.
  - Desktop Hover & Mobile Permanen: Bar hitam arang pekat bergulir ke atas dengan teks "Detail Produk" dan ikon `ArrowRight`.

### 3.2 Admin Catalog Row Item
- Baris tabel/kartu pengelola: Handle drag `GripVertical`, thumbnail kecil, toggle status aktif monoline, badge stok, aksi edit/hapus.

### 3.3 Admin Metric & KPI Stat Cards
- Kontainer bersudut diagonal simetris: `rounded-[12px_4px_12px_4px]` atau `rounded-[14px_4px_14px_4px]`.
- **Architectural Crosshair Mark:** Simbol `+` monospaced di pojok kanan atas (`absolute top-1.5 right-1.5 font-mono text-[9px] text-[#262626]/20`).
- Angka metrik besar berhuruf monospaced (`text-2xl font-black`) dengan pill persentase tren hijau/merah.

### 3.4 Order Summary & Cart Module
- Baris rincian item belanja dengan stepper kuantitas monoline (`-`, qty, `+`).
- Rincian subtotal, potongan promo, ongkir ekspedisi, dan grand total bergaris ganda akuntansi (*double underline*).

---

## 🧭 TAB 4: Navigation Shell & Controls (`NavigationLab`)

Rujukan Kode: `src/routes/test-desain/components/NavigationLab.svelte`, `SidebarNav.svelte`, `MobileFab.svelte`.

### 4.1 Desktop Collapsible Sidebar (`SidebarNav.svelte`)
- **Struktur Shell:** Floating panel vertikal di kiri layar dengan tekstur kisi padat `.nav-drafting-grid`.
- **Dimensi Transisi:** `w-60` (240px) saat *expanded* vs `w-16` (64px) saat *collapsed*.
- **Auto-expand on Hover:** Membuka otomatis saat kursor mendekat (`onmouseenter`), ciut kembali saat menjauh.
- **Decoupled Hover Labels:** Teks menu bergulir (*roller text*) dari `item.label` ke `item.hoverLabel` tanpa hardcoded switch.
- **Active State Indicator:**
  - Warna tab aktif sama dengan warna hover (Arang pekat `#262626` light / Mint `#a2e1db` dark).
  - Penanda aktif non-teks: **Monoline Diamond Stamp ◈** berputar 45° beraksen Peach (`#fea770`).
- **Flyout Kontak Toko:** Popover accordion untuk WhatsApp, Instagram, dan Email.
- **Theme Switcher:** Terintegrasi di footer sidebar.

### 4.2 Mobile Navigation FAB (`MobileFab.svelte`)
- Floating Action Button bundar di kanan bawah layar beraksen Peach (`#fea770`) dan shadow monoline `3px 3px`.
- Modal menu melayang dengan kisi monoline, menampilkan seluruh link halaman publik/admin dan kontak darurat.

---

## 🔄 TAB 5: Reorder & Sorting Module (`ReorderLab`)

Rujukan Kode: `src/routes/test-desain/components/ReorderLab.svelte`.

### 5.1 Drag & Drop State Architecture
- Menggunakan library `@thisux/sveltednd`.
- **Mode Atur Urutan Khusus (Draft / Batch Edit Mode):**
  - Pengubahan urutan tidak langsung menembak API per geseran.
  - Tombol aksi mengaktifkan `isReorderMode = true`.
  - Muncul banner notifikasi melayang: "Ada X perubahan urutan yang belum disimpan" dengan tombol "Simpan Perubahan" dan "Batalkan".
- **Grip Taktil:** Ikon `GripVertical` dengan kursor `cursor-grab` (berubah menjadi `cursor-grabbing` saat ditarik).
- **Fallback Aksesibilitas Keyboard:** Tombol panah atas/bawah (`ChevronUp`, `ChevronDown`) untuk menyortir urutan tanpa drag mouse.
- **Navigation Guard:** `beforeNavigate` SvelteKit dan `beforeunload` browser aktif saat ada draf urutan yang belum di-*commit*.

---

## 📄 TAB 6: Full Templates & Documents (`TemplatesLab`)

Rujukan Kode: `src/routes/test-desain/components/TemplatesLab.svelte`, `+error.svelte`, `InvoiceDocument.svelte`.

### 6.1 Halaman Error Global (`+error.svelte`)
- Simulator status HTTP: 404 (Not Found), 403 (Forbidden), 500 (Server Error), 503 (Maintenance).
- Badge status semantik monoline.
- Panel *Help Desk & Emergency Contact* kontekstual (WhatsApp, IG, Email).
- Tombol aksi pemulihan: "Coba Muat Ulang" dan "Kembali ke Beranda".

### 6.2 Dokumen Invoice (`InvoiceDocument.svelte`)
- **Struktur Faktur Formal:** Header toko monoline, badge status pembayaran (*PAID / UNPAID*), nomor order 5-karakter monospaced.
- **Tabel Rincian Item:** Baris bergantian putih dan krem tipis, rincian subtotal, diskon, ongkir.
- **Garis Ganda Akuntansi:** Garis total akhir bergaris ganda tegas (*double underline*).
- **Aturan Mutlak `@media print` & Satori PDF Engine:**
  - Latar belakang grid (`.drafting-grid`) wajib dinonaktifkan (`background: none !important`).
  - Latar belakang gelap dark mode wajib diinversi menjadi putih bersih.
  - Garis batas dan teks dicetak 100% hitam monoline (`#262626`) untuk efisiensi tinta printer pembeli.

---

## 🗺️ Matriks Implementasi: Rujukan Sandbox ke Halaman Riil

| Rute / Komponen Riil | Tab Sandbox Rujukan | Elemen Kunci yang Wajib Digunakan |
| :--- | :--- | :--- |
| `/(public)/+page.svelte` | Tab 2 & 3 | Rolling Ticker CTA, Batch 1 stamp, How to Order bento cards (`rounded-[14px_4px_14px_4px]` + `+`). |
| `/(public)/order/+page.svelte` | Tab 2 & 3 | Instant search bar, Category filter pills, Product Card (*hanging price tag*, rolling action footer). |
| `src/lib/components/cart/CartDrawer.svelte` | Tab 2 & 3 | CartItemCard, stepper kuantitas, ringkasan diskon promo peach, CTA bayar arang pekat. |
| `/(public)/order/checkout/+page.svelte` | Tab 2 & 3 | Input form monoline, segmented pickup/mail toggle, shipping quote selector card, sticky summary. |
| `/(public)/order/bayar/[orderId]/+page.svelte`| Tab 2 & 6 | Card instruksi QRIS/VA, copy instant toast, upload bukti bayar monoline, countdown timer. |
| `/(public)/order/sukses/[orderId]/+page.svelte`| Tab 2 & 6 | Kartu sukses monoline, tautan invoice permanen, tombol kontak WhatsApp. |
| `/(public)/order/riwayat/+page.svelte` | Tab 2 & 3 | Form pencarian email/ID, `ListSkeleton` saat verifikasi pesanan, list kartu riwayat order dengan status pills semantik. |
| `/invoice/[orderId]/+page.svelte` | Tab 6 | Action bar (Download PDF, Print, Share), integrasi `InvoiceDocument.svelte`. |
| `/admin/+page.svelte` | Tab 2 & 3 | KPI Metric Cards (`rounded-[14px_4px_14px_4px]` + `+`), tabel pesanan terbaru. |
| `/admin/orders/*` | Tab 2 & 3 | Data table monoline, filter tabs, `ListSkeleton` state pemuatan tabel, `Pagination` kontrol halaman, order detail modal/drawer, action confirm bayar. |
| `/admin/products/*` | Tab 2, 3, 5 | Admin catalog row, `ListSkeleton` saat load katalog, `Pagination`, form edit/create produk, variant manager, upload gambar monoline. |
| `/admin/categories/+page.svelte` | Tab 5 | Reorder DnD mode batch dengan `@thisux/sveltednd` dan tombol simpan perubahan. |

---

## 🚫 Pantangan Desain (Anti-Patterns)

1. **Dilarang Gradien Warna:** Tidak boleh menggunakan gradient ungu-ke-biru (`from-indigo-500 to-purple-600`) atau teks berefek gradasi.
2. **Dilarang Font Default Inter:** Tipografi wajib mematuhi tripartit Fraunces (Headlines), Plus Jakarta Sans (UI/Body), dan Space Mono (Data/Harga).
3. **Dilarang Rotasi Scrapbook Liar:** Tidak boleh memakai rotasi acak (`-rotate-1`, `-rotate-2`) atau efek selotip palsu pada form transaksi, kartu produk, dan tabel admin.
4. **Dilarang Bayangan Blur Tebal:** Tidak boleh memakai `shadow-lg`, `shadow-xl`, atau `shadow-2xl` abu-abu buram. Semua bayangan adalah *hard offset* monoline (`2px`, `3px`, atau `4px` warna `#262626`).
5. **Dilarang Spinner Bulat SaaS Generik:** Semua indikator pemuatan wajib menggunakan `MonolineLoader.svelte` (4 kotak geometris brand) atau skeleton monoline.
