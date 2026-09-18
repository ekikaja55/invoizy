Oke, aku pecah jadi 5 bagian. Ini fase keputusan, jadi aku kasih rekomendasi + alasan singkat, dan beberapa titik yang perlu kamu putuskan sendiri di akhir.

---

## 1. Tech Stack

**Core**
| Bagian | Pilihan | Alasan |
|---|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes) | butuh server endpoint untuk PDF & email, bukan cuma SPA |
| Adapter | `@sveltejs/adapter-vercel` | fungsi serverless otomatis, gratis di `.vercel.app` |
| Bahasa | TypeScript strict | |
| Styling | Tailwind CSS v4 + CSS variables | v4 pakai `@theme`, config di CSS, cocok untuk token warna invoice |
| Komponen | bits-ui + custom (atau shadcn-svelte) | headless, tidak bawa tema yang bentrok |
| Ikon | `@lucide/svelte` | |

**Database**
- **Neon Postgres** (free tier, serverless driver, cocok untuk Vercel) — alternatif: Supabase kalau kamu mau sekalian Storage + Auth.
- **Drizzle ORM** + `drizzle-kit` untuk migration. Lebih ringan dari Prisma dan tidak bermasalah di serverless.
- Driver: `@neondatabase/serverless` (HTTP, cold start cepat).

**Auth (admin/seller)**
- **Better Auth** (Lucia sudah deprecated) atau kalau mau seminimal mungkin: session table sendiri + `@oslojs/crypto` + cookie httpOnly. Untuk 1 seller, opsi kedua sudah cukup dan bebas dependency.

**PDF Invoice** — ini bagian paling menentukan arsitektur:
- Primary: **`puppeteer-core` + `@sparticuz/chromium-min`** di route `/api/invoice/[id]/pdf` (runtime `nodejs`, bukan edge). Kelebihan: template PDF = HTML/CSS yang sama persis dengan halaman invoice web. Risiko: bundle besar & cold start ~2-4 detik.
- Alternatif ringan: **Satori → `@resvg/resvg-js` → `pdf-lib`**. Cepat, bundle kecil, tapi CSS-nya terbatas (tidak support semua flex/grid quirk).
- Fallback selalu ada: halaman invoice punya CSS `@media print`, buyer bisa Ctrl+P sendiri.

> Saranku: mulai dari Puppeteer, karena template HTML kamu sudah jadi. Kalau cold start mengganggu, baru migrasi ke Satori.

**Email**
- **Resend** (3.000 email/bulan gratis) + `svelte-email-tailwind` atau string HTML biasa. Jauh lebih baik dari GmailApp: ada delivery log, webhook, dan domain sendiri kalau nanti perlu.

**Storage (QRIS + arsip PDF)**
- **Vercel Blob** (gratis 1GB) atau Supabase Storage kalau sudah pakai Supabase.

**Utility**
- `zod` — validasi form & env
- `sveltekit-superforms` + adapter zod — form handling (sangat menghemat kerja di halaman order & admin)
- `dinero.js` atau simpan **integer rupiah** (`bigint`/`integer`) — jangan pernah pakai float untuk harga
- `nanoid` — Order ID (custom alphabet, sama seperti script kamu: tanpa I/O/0/1)
- `date-fns` + `date-fns-tz` — timezone Asia/Jakarta
- `@upstash/ratelimit` + Upstash Redis — rate limit form publik (wajib, form order kamu terbuka)

**Dev / Quality**
- Vitest (unit: kalkulasi total, parser harga), Playwright (E2E: submit order → invoice terkirim)
- ESLint + Prettier + `prettier-plugin-svelte` + `prettier-plugin-tailwindcss`
- Husky + lint-staged (opsional)

**Env yang dibutuhkan**
```
DATABASE_URL
RESEND_API_KEY
EMAIL_FROM
BLOB_READ_WRITE_TOKEN
ADMIN_EMAIL / ADMIN_PASSWORD_HASH
AUTH_SECRET
UPSTASH_REDIS_REST_URL / _TOKEN
PUBLIC_APP_URL
```

---

## 2. Struktur Direktori

```
invoizy/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/
│   │   │   │   ├── index.ts          # client drizzle
│   │   │   │   ├── schema.ts         # semua tabel
│   │   │   │   └── queries/          # order.ts, product.ts, config.ts
│   │   │   ├── auth/
│   │   │   │   ├── session.ts
│   │   │   │   └── password.ts
│   │   │   ├── pdf/
│   │   │   │   ├── render.ts         # html -> buffer pdf
│   │   │   │   └── browser.ts        # launcher chromium
│   │   │   ├── email/
│   │   │   │   ├── client.ts         # resend
│   │   │   │   └── templates/
│   │   │   ├── storage/blob.ts
│   │   │   └── ratelimit.ts
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Input, Dialog, Table...
│   │   │   ├── invoice/              # InvoiceDocument.svelte, InvoiceRow...
│   │   │   ├── order/                # ProductGrid, QtyStepper, CartSummary
│   │   │   └── admin/                # StatCard, OrderTable, ProductForm
│   │   ├── schemas/                  # zod: order.ts, product.ts, config.ts
│   │   ├── stores/cart.svelte.ts     # rune-based state
│   │   ├── utils/
│   │   │   ├── currency.ts           # formatRupiah, parseRupiah
│   │   │   ├── date.ts
│   │   │   └── order-id.ts
│   │   └── constants.ts
│   │
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte              # landing toko
│   │   ├── order/
│   │   │   ├── +page.server.ts       # load produk + action submit
│   │   │   └── +page.svelte
│   │   ├── order/sukses/[orderId]/+page.svelte
│   │   ├── invoice/[orderId]/
│   │   │   ├── +page.server.ts       # akses via token, bukan ID tebakan
│   │   │   ├── +page.svelte          # tampilan web invoice
│   │   │   └── pdf/+server.ts        # download PDF
│   │   ├── admin/
│   │   │   ├── +layout.server.ts     # guard auth
│   │   │   ├── +page.svelte          # dashboard
│   │   │   ├── orders/
│   │   │   │   ├── +page.svelte
│   │   │   │   └── [id]/+page.svelte
│   │   │   ├── products/+page.svelte
│   │   │   ├── categories/+page.svelte
│   │   │   └── settings/+page.svelte # store, QRIS, email
│   │   ├── login/+page.svelte
│   │   └── api/
│   │       ├── webhooks/resend/+server.ts
│   │       └── health/+server.ts
│   │
│   ├── hooks.server.ts               # session, locals, security headers
│   ├── app.css                       # @theme tokens
│   ├── app.d.ts
│   └── app.html
│
├── drizzle/                          # migration hasil generate
├── static/
├── tests/{unit,e2e}/
├── drizzle.config.ts
├── svelte.config.js
├── vite.config.ts
├── vercel.json
├── .env.example
└── README.md
```

**Skema DB (garis besar)**
```
stores        id, name, instagram, twitter, email_from, qris_url, confirm_url
categories    id, store_id, name, sort_order
products      id, category_id, name, price(int), active, sort_order, stock?
orders        id, order_id(5char, unique), access_token, handle, email,
              note, subtotal, total, invoice_status, payment_status,
              invoice_url, error, created_at
order_items   id, order_id, product_id, name_snapshot, price_snapshot,
              qty, subtotal, category_snapshot
users         id, email, password_hash
sessions      id, user_id, expires_at
```
Catatan penting: **snapshot** nama & harga di `order_items`. Ini memperbaiki bug laten di versi Apps Script — kalau harga produk berubah, invoice lama ikut berubah.

---

## 3. Desain

**Arah visual:** pertahankan identitas invoice kamu (amber + cokelat, kartu rounded, garis putus-putus), tapi dipisah jadi dua bahasa desain: *storefront* yang playful dan *admin* yang tenang.

**Design token** (`app.css`):
```css
@theme {
  --color-brand-50:  #fffdf7;
  --color-brand-100: #fff7dc;
  --color-brand-300: #ffd56a;
  --color-brand-500: #ffbe0b;
  --color-brand-600: #f0a900;
  --color-ink:       #5b3a2a;
  --color-ink-soft:  #7d5e4e;
  --radius-card: 18px;
  --font-display: 'Plus Jakarta Sans', sans-serif;
}
```
Ganti Trebuchet MS → **Plus Jakarta Sans** (Indonesian-made, tersedia di Google Fonts) untuk UI; khusus dokumen invoice boleh tetap font sistem agar PDF konsisten.

**Halaman Order** — ini upgrade terbesar dibanding Google Form:
- Produk sebagai **kartu bergambar** per kategori, bukan grid radio button
- Qty stepper `− 1 +`, bebas dari batas 1–5
- **Sticky cart summary** di kanan (desktop) / bottom sheet (mobile) yang menghitung total real-time
- Ongkir jadi step terpisah (single-select), bukan kategori produk biasa
- 3 langkah: Pilih Produk → Data Diri → Review & Submit
- Mobile-first, karena buyer datang dari link bio Instagram

**Halaman Invoice (web)** — versi web dari PDF kamu, plus tombol Download PDF, QRIS yang bisa di-tap untuk zoom, dan tombol "Konfirmasi Pembayaran" ke WhatsApp/DM.

**Admin** — sidebar kiri, konten netral (abu/putih) dengan aksen amber hanya di CTA & status badge. Status pakai warna semantik: PENDING abu, SENT biru, PAID hijau, FAILED merah.

**Aksesibilitas:** cek kontras `#5b3a2a` di atas `#ffbe0b` — rasionya sekitar 4.9:1, aman untuk teks besar, tapi jangan untuk body text kecil di atas amber.

---

## 4. Todo (per fase)

**Fase 0 — Fondasi (½ hari)**
- [ ] `npx sv create invoizy` (Svelte 5, TS, Tailwind, ESLint, Prettier, Vitest, Playwright)
- [ ] Setup Neon + `DATABASE_URL`, konfigurasi Drizzle
- [ ] Tulis `schema.ts`, generate & push migration pertama
- [ ] Setup design token + komponen UI dasar (Button, Input, Card, Badge)
- [ ] Deploy kosong ke Vercel, pastikan domain `.vercel.app` hidup

**Fase 1 — Data & Admin CRUD (1–2 hari)**
- [ ] Auth admin (login, session cookie, guard `/admin`)
- [ ] CRUD kategori & produk
- [ ] Halaman settings (store info, upload QRIS ke Blob, URL konfirmasi)
- [ ] Seed data dari produk lama (Gintoki, Shin, Zura, ongkir)

**Fase 2 — Alur Order (2 hari)**
- [ ] Halaman `/order` + superforms + zod
- [ ] Cart state dengan runes
- [ ] Action submit: validasi → **hitung ulang total di server** (jangan percaya harga dari client) → simpan order + items snapshot → generate order ID & access token
- [ ] Rate limit + honeypot field
- [ ] Halaman sukses

**Fase 3 — Invoice & Email (2 hari)**
- [ ] `InvoiceDocument.svelte` (dipakai web + PDF)
- [ ] Route PDF dengan Puppeteer, tes cold start di Vercel
- [ ] Simpan PDF ke Blob, catat URL di order
- [ ] Kirim email via Resend dengan lampiran PDF
- [ ] Idempotency: jangan kirim dobel kalau user refresh/retry
- [ ] Aksi admin: regenerate PDF, resend email, ubah status pembayaran

**Fase 4 — Dashboard & Polish (1 hari)**
- [ ] Statistik: total order, nilai, SENT/FAILED, CONFIRMED
- [ ] Filter & search di tabel order, export CSV
- [ ] Empty state, loading skeleton, toast error
- [ ] SEO/OG image untuk link bio

**Fase 5 — Hardening**
- [ ] Unit test kalkulasi total & formatRupiah
- [ ] E2E: submit order → email terkirim (pakai Resend test mode)
- [ ] Security headers di `hooks.server.ts`, CSRF (SvelteKit sudah bawaan)
- [ ] Error monitoring (Sentry free tier)
- [ ] Backup: cron harian export orders ke Blob

---

## 5. README (kerangka lengkap)

Karena README-nya panjang dan lebih enak ditulis setelah struktur fix, ini outline yang sudah siap kamu isi:

```markdown
# Invoizy

Aplikasi invoice untuk toko online kecil. Buyer memilih produk lewat
halaman order, sistem otomatis membuat invoice PDF dan mengirimkannya
ke email buyer.

Versi 2 — rebuild dari Google Apps Script ke SvelteKit.

## Daftar Isi
## Fitur
   - Katalog produk & kategori yang bisa diedit dari admin
   - Halaman order mobile-first dengan perhitungan real-time
   - Invoice PDF otomatis + pengiriman email
   - Dashboard order, status invoice & pembayaran
   - Pembayaran QRIS
## Tech Stack
## Arsitektur
   - Diagram alur: Order → DB → PDF → Blob → Email
   - Penjelasan singkat kenapa PDF dirender server-side
## Prasyarat
   Node 20+, akun Neon, Resend, Vercel
## Instalasi Lokal
   1. clone & pnpm install
   2. cp .env.example .env
   3. pnpm db:push && pnpm db:seed
   4. pnpm dev
## Environment Variables  (tabel: nama | wajib | deskripsi | cara dapat)
## Struktur Database  (tabel + relasi)
## Deployment ke Vercel
   - Import repo, set env, set Node runtime
   - Catatan ukuran function untuk Puppeteer
## Cara Pakai (Seller)
   - Login admin
   - Tambah kategori & produk
   - Upload QRIS
   - Bagikan link order
   - Tandai pembayaran
## Kustomisasi
   - Ganti warna: edit @theme di src/app.css
   - Ganti layout invoice: src/lib/components/invoice/
## Troubleshooting
   - Email tidak terkirim
   - PDF gagal / timeout
   - Cold start lambat
## Migrasi dari Apps Script  (script import ORDERS & ORDER_ITEMS)
## Scripts  (dev, build, db:push, db:studio, test, lint)
## Roadmap
## Lisensi
```

---

## Yang perlu kamu putuskan sebelum mulai

Tiga hal ini mengubah kode secara struktural, jadi lebih baik difinalkan sekarang:

1. **Multi-tenant atau single store?** Kalau nanti mau dipakai seller lain, tabel `stores` + subdomain harus ada dari awal. Kalau cuma untuk mytokogweh, hilangkan `store_id` dan hemat banyak kerja.
2. **Stok** — mau dilacak atau tidak? Kalau ya, perlu transaksi DB saat submit order.
3. **Payment** — tetap QRIS statis (manual konfirmasi), atau nanti pakai payment gateway (Midtrans/Xendit)? Kalau ada rencana ke sana, desain tabel `payments` terpisah dari `orders` sejak sekarang.

Kalau ketiganya sudah kamu jawab, aku bisa langsung buatkan `schema.ts` final dan kita mulai Fase 0.