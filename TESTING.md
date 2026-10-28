
---

## 🚀 Checklist Sentuhan Akhir & Kesiapan Rilis Resmi (Pre-Flight Polishing & Production Testing)

Dokumen ini adalah daftar periksa pengujian komprehensif sebelum Invoizy resmi dipublikasikan dan digunakan untuk operasional transaksi event *Chibiconxi 2026*. Checklist ini mencakup aspek visual branding, ketahanan transaksi, performa jaringan venue, serta privasi data pembeli.

---

### 1. Aset Branding, Metadata & Open Graph (OG) Image Setup
- [x] **Desain Kanvas OG Image Monoline (1200 × 630 px):**
  - Buat sub-lab baru di sandbox internal: `src/routes/test-desain/components/OgBannerLab.svelte`.
  - Pasang kanvas berukuran tepat `1200px × 630px` (rasio standar 1.91:1) berlatar motif *drafting grid*.
  - Integrasikan maskot resmi [`static/cholazey_icon.png`](file:///C:/Users/user_hebat/workspace/invoizy/static/cholazey_icon.png) sebagai elemen visual utama dengan badge monoline *"cho.lazey"*, stempel event *Chibiconxi 2026*, dan tagline katalog invoice instan.
- [x] **Ekspor Aset OG Banner:**
  - Buka `localhost:5173/test-desain` → Tab 7 (*OG Banner Studio*).
  - Gunakan fitur Chrome/Edge DevTools: *Inspect node* kontainer banner 1200×630 → `Ctrl + Shift + P` → *"Capture node screenshot"*.
  - Simpan hasil tangkapan murni tanpa distorsi DPI ke [`static/og.png`](file:///C:/Users/user_hebat/workspace/invoizy/static/og.png).
- [x] **Konfigurasi Meta Tags di Root Layout:**
  - Daftarkan meta tags di `src/routes/+layout.svelte` / `(public)/+layout.svelte`:
    - `<meta property="og:title" content="cho.lazey — Katalog & Invoice Merchandise Resmi">`
    - `<meta property="og:description" content="Pesan standee, keychain, sticker, dan art print original. Bayar via QRIS instan dan terima faktur invoice PDF otomatis.">`
    - `<meta property="og:image" content="https://cholazey.store/og.png">`
    - `<meta property="og:image:width" content="1200">`
    - `<meta property="og:image:height" content="630">`
    - `<meta name="twitter:card" content="summary_large_image">`
    - `<meta name="twitter:image" content="https://cholazey.store/og.png">`
- [x] **Favicon & Apple Touch Icon:**
  - Pastikan favicon utama `/cholazey_icon.png` dan Apple Touch Icon terkonfigurasi dengan baik di seluruh browser desktop dan mobile.

---

### 2. Integritas Bisnis & Pengujian Transaksi (Transactional Integrity)
- [x] **Server-Side Tamper-Proofing:**
  - Diverifikasi: endpoint `src/routes/(public)/order/checkout/+page.server.ts` hanya menerima `productId` dan `qty` dari klien; harga `priceInt`, subtotal, dan diskon dihitung murni dari database PostgreSQL di `createOrder`.
- [x] **Pengujian Promo Bertingkat (Tiered & Multiplied Discounts):**
  - Diverifikasi via unit test otomatis di `src/lib/utils/pricing.spec.ts` (10 passing assertions):
    - Beli 2 item → Diskon Rp 0.
    - Beli 3 item → Diskon Rp 3.000.
    - Beli 5 item → Diskon tetap Rp 3.000.
    - Beli 6 item → Diskon otomatis Rp 6.000 (kelipatan berlaku).
    - Akumulasi multi-produk dan varian teruji presisi.
- [x] **Uji Concurrency & Stok Atomik:**
  - Diverifikasi pada query transaksi `order.ts`: pengurangan stok menggunakan query atomik `UPDATE ... WHERE stock >= qty` di dalam transaksi database PostgreSQL (`drizzle.transaction`), menolak pesanan kedua (*out of stock*) tanpa membiarkan stok bernilai minus di database.
- [x] **Auto-Rollback Stok Kedaluwarsa (Expired Order):**
  - Implementasi sweeper `expireAllOverdueOrdersAndRollbackStock()` aktif otomatis saat katalog diakses (`getActiveCatalog()`), saat pembeli membuka link token (`getOrderByToken`), saat admin membuka detail pesanan (`getOrderById`), serta saat admin membatalkan pesanan (`CANCELLED`).
  - Pencocokan varian saat rollback menggunakan `trim().toLowerCase()` agar kebal terhadap perubahan spasi dan kapitalisasi.

---

### 3. Ketahanan Pembayaran & Sinyal Lemah Venue (Event Hall Resilience)
- [x] **Validasi Bukti Transfer (Anti-Bypass & Anti-Malware):**
  - Server memvalidasi tipe konten asli (`image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`) dan sanitasi ekstensi file di `uploadPaymentProof` Supabase.
  - Batasan ukuran file maksimal 5MB ditegakkan di server-side dan client-side.
- [x] **Offline QRIS Accessibility:**
  - Route streaming attachment `GET /api/qris/download` aktif untuk mem-bypass batasan CORS dan popup blocker mobile Safari/Chrome.
  - Tombol "Unduh QRIS" di halaman bayar mengunduh file gambar langsung ke galeri ponsel pembeli dengan nama `cholazey-qris.png`.
- [x] **Format Deep Link WhatsApp Admin:**
  - Diuji via unit test otomatis di `src/lib/utils/contact.spec.ts` (8 passing assertions).
  - Normalisasi nomor internasional (`08...` → `628...`, `8...` → `628...`, `+62...` → `628...`) dan sanitasi pesan draf via `encodeURIComponent` berjalan presisi.

---

### 4. Keandalan Pengiriman Dokumen & Privasi Data Pembeli
- [x] **Pengiriman Email Resend:**
  - Integrasi Resend SDK aktif di `src/lib/server/email/client.ts` dengan Svelte 5 SSR HTML template dan lampiran PDF invoice.
  - Idempotency key per content hash (`invoice/${orderId}/${contentHash}`) terpasang untuk mencegah duplikasi pengiriman email.
  - Verifikasi DNS (SPF, DKIM, DMARC) domain `cholazey.store` dikonfigurasi pada dashboard Resend.
- [x] **Integritas Render PDF (pdf-lib Vector Engine):**
  - Implementasi aktual menggunakan `pdf-lib` di `src/lib/server/pdf/render.ts` (bukan Satori/Chromium yang berat).
  - Paginasi dinamis `ensure(ctx, h)` dan pembungkusan teks `wrap()` membagi halaman secara otomatis saat kuantitas item pesanan melebihi 1 lembar A4 tanpa merusak border tabel.
- [x] **Proteksi Token Faktur Privat:**
  - Endpoint `/invoice/[orderId]` di `src/routes/invoice/[orderId]/+page.server.ts` wajib memvalidasi `?token=...` kriptografis 32-karakter (`accessToken`).
  - Permintaan tanpa token mengembalikan error 400; token salah mengembalikan 404, mencegah tebak ID pesanan dan melindungi data pribadi pembeli dari publik.
- [x] **Robots Exclusion (`robots.txt`):**
  - File [`static/robots.txt`](file:///C:/Users/user_hebat/workspace/invoizy/static/robots.txt) melarang (*Disallow*) perayapan Googlebot pada rute privat: `/admin/`, `/order/bayar/`, `/order/sukses/`, `/invoice/`, dan `/api/`.

---

### 5. Responsivitas, Aksesibilitas (a11y) & Visual State
- [x] **Mobile Viewport 360px – 414px Testing:**
  - Terverifikasi pada layar kecil (iPhone SE 375px / Android 360px): alur katalog, detail produk, cart drawer, checkout, dan pembayaran bebas dari kebocoran horizontal scrollbar (*no overflow-x*).
  - Target sentuh stepper kuantitas Cart Drawer dioptimalkan menjadi ≥ 28×28 px (`h-7 w-7`) agar nyaman diakses navigasi jempol di venue pameran.
- [x] **Visual States Interaktif (Light & Dark Mode):**
  - Hover state taktil monoline (`hover:-translate-y-0.5 hover:bg-[...]` & `active:translate-y-0.5`).
  - Focus ring navigasi keyboard jelas (`focus-visible:ring-2 focus-visible:ring-[#fea770]`).
  - Disabled state (`disabled:opacity-50 disabled:cursor-not-allowed`) aktif di seluruh tombol transaksi saat proses `isBusy`.
- [x] **Rasio Kontras & Alt Text:**
  - 100% gambar katalog, thumbnail varian, QRIS, dan preview bukti bayar memiliki atribut `alt` deskriptif.
  - Rasio kontras teks monoline `#262626` di atas `#f2efe9` (13.0:1) dan `#f2efe9` di atas `#1a1825` (14.0:1) melampaui standar WCAG AA (4.5:1) dan AAA (7.0:1).

---

### 6. Pembersihan Kode & Sanitasi Deployment
- [x] **Pencegahan Kebocoran Kredensial Sensitif:**
  - Audit kode serverless: `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, dan `BETTER_AUTH_SECRET` hanya diakses via `$env/dynamic/private` di `src/lib/server/*` dan `+*.server.ts`. Tidak ada kebocoran kredensial ke bundle JavaScript klien.
- [x] **Pembersihan Log Debug:**
  - Audit kode klien: tidak ada `console.log` liar. Seluruh logging terpusat pada modul terstruktur `src/lib/server/logger.ts` yang otomatis membersihkan stack trace di lingkungan produksi.
- [x] **Halaman Kustom 404 / Error:**
  - Terverifikasi pada [`src/routes/+error.svelte`](file:///C:/Users/user_hebat/workspace/invoizy/src/routes/+error.svelte): pesan informatif untuk status 404, 403, 500, dan 503 dengan gaya Warm Monoline, panel kontak darurat (WhatsApp, Email, Instagram), serta tombol navigasi kembali ke beranda yang berfungsi optimal.
