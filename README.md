# README FINAL — Invoizy

# Invoizy

Aplikasi invoice otomatis untuk toko online skala kecil (single store).
Buyer memilih produk lewat halaman order publik, sistem menghitung total,
membuat invoice PDF, dan mengirimkannya otomatis ke email buyer. Admin
(penjual) mengelola katalog, stok, dan status pembayaran lewat dashboard.

Rebuild dari sistem lama berbasis Google Form + Apps Script menjadi
web app SvelteKit standalone.

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Arsitektur & Alur Data](#arsitektur--alur-data)
- [Struktur Direktori](#struktur-direktori)
- [Skema Database](#skema-database)
- [Prasyarat](#prasyarat)
- [Instalasi Lokal](#instalasi-lokal)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment ke Vercel](#deployment-ke-vercel)
- [Panduan Pakai — Admin](#panduan-pakai--admin)
- [Panduan Pakai — Buyer](#panduan-pakai--buyer)
- [Kustomisasi Desain](#kustomisasi-desain)
- [Keamanan](#keamanan)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Lisensi](#lisensi)

## Fitur

- Katalog produk & kategori yang bisa diedit penuh dari admin (tanpa sentuh kode)
- Pelacakan stok per produk (opsional per produk, bisa dimatikan)
- Halaman order publik, mobile-first, dengan kalkulasi total real-time
- Invoice PDF otomatis dibuat setiap order masuk, dikirim via email
- Halaman invoice web (selain PDF) yang bisa diakses buyer lewat link aman
- Pembayaran statis: QRIS, No. Rekening, Virtual Account — diatur admin, ditampilkan ke buyer
- Dashboard admin: ringkasan order, status invoice & pembayaran, aksi resend/regenerate
- Dark & light mode

## Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | SvelteKit 2 (Svelte 5 / runes) |
| Hosting | Vercel (`adapter-vercel`) |
| Database | Supabase Postgres |
| ORM | Drizzle ORM (`drizzle-kit`, driver `postgres`) |
| Auth | Better Auth |
| Storage | Supabase Storage (bucket `qris`, `invoices` — public) |
| Styling | Tailwind CSS v4 (`@theme` tokens) |
| Font | Fraunces (display) + Inter (body) |
| PDF | Puppeteer-core + `@sparticuz/chromium-min` |
| Email | Resend + `svelte-email-tailwind` |
| Form & Validasi | `sveltekit-superforms` + `zod` |
| Rate Limit | Upstash Redis + `@upstash/ratelimit` |
| Testing | Vitest (unit), Playwright (E2E) |
| Lint/Format | ESLint, Prettier |

## Arsitektur & Alur Data

```
Buyer                          Admin
  │                               │
  ▼                               ▼
/order  ──submit──▶  Server Action
                        │
                        ├─▶ Validasi ulang harga & stok dari DB
                        ├─▶ Kurangi stok (transaksi)
                        ├─▶ Insert orders + order_items (snapshot)
                        ├─▶ Generate order_id + access_token
                        │
                        ├─▶ Render InvoiceDocument → PDF (Puppeteer)
                        ├─▶ Upload PDF → Supabase Storage (invoices/)
                        ├─▶ Kirim email (Resend) dgn lampiran PDF
                        │
                        ▼
              orders.invoice_status = SENT
                        │
                        ▼
        Buyer buka /invoice/[orderId]?token=...
        Admin lihat & kelola di /admin/orders
```

Kenapa PDF di-render server-side (bukan client screenshot)? Supaya hasil
konsisten di semua device, dan bisa dilampirkan langsung ke email tanpa
campur tangan buyer.

## Struktur Direktori

```
src/
├── lib/
│   ├── server/
│   │   ├── auth.ts
│   │   ├── db/            # schema.ts, auth.schema.ts, index.ts
│   │   ├── pdf/           # render.ts, browser.ts
│   │   ├── email/         # client.ts, templates/
│   │   ├── storage/       # supabase.ts
│   │   └── ratelimit.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── nav/           # SidebarNav.svelte, MobileFab.svelte
│   │   ├── invoice/
│   │   ├── order/
│   │   └── admin/
│   ├── schemas/           # zod schemas
│   ├── stores/             # cart.svelte.ts
│   └── utils/              # currency.ts, date.ts, order-id.ts
└── routes/
    ├── order/
    ├── invoice/[orderId]/
    ├── admin/              # dashboard, orders, products, categories, settings
    ├── login/
    └── api/auth/[...all]/
```

## Skema Database

| Tabel | Keterangan |
|---|---|
| `store_settings` | Singleton: nama toko, sosmed, info pembayaran statis (QRIS/rekening/VA), payment note |
| `categories` | Kategori produk, punya `sort_order` |
| `products` | Nama, harga (integer rupiah), stok, `track_stock`, `active` |
| `orders` | Data order + `access_token` untuk akses invoice, status invoice & pembayaran |
| `order_items` | Snapshot nama & harga per item saat order dibuat (tidak berubah walau produk asli diedit) |
| Tabel auth (`user`, `session`, dst) | Digenerate otomatis oleh Better Auth, jangan diedit manual |

> **Catatan desain penting:** harga selalu disimpan sebagai **integer rupiah**
> (bukan float), untuk menghindari error pembulatan.

## Prasyarat

- Node.js 20+
- Akun [Supabase](https://supabase.com) (Postgres + Storage)
- Akun [Resend](https://resend.com)
- Akun [Vercel](https://vercel.com)
- (Opsional) Akun [Upstash](https://upstash.com) untuk rate limiting

## Instalasi Lokal

```bash
git clone <repo-url> invoizy
cd invoizy
npm install
cp .env.example .env
# isi semua variabel, lihat bagian Environment Variables

npm run db:push        # push schema ke Supabase
npm run auth:schema    # generate schema Better Auth (jika belum)
npm run db:push        # push lagi setelah auth schema muncul

npm run dev
```

Buka `http://localhost:5173`.

## Environment Variables

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string Supabase, **pakai pooling (port 6543, `pgbouncer=true`)** |
| `BETTER_AUTH_SECRET` | ✅ | String random panjang, generate dengan `openssl rand -hex 32` |
| `ORIGIN` | ✅ | URL app (local: `http://localhost:5173`, prod: domain Vercel) |
| `PUBLIC_APP_URL` | ✅ | Sama seperti `ORIGIN`, dipakai di email/link invoice |
| `RESEND_API_KEY` | ✅ | Dari dashboard Resend |
| `EMAIL_FROM` | ✅ | Alamat pengirim (harus domain terverifikasi di Resend) |
| `SUPABASE_URL` | ✅ | Dari project settings Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Untuk upload ke Storage dari server |
| `UPSTASH_REDIS_REST_URL` | opsional | Rate limiting form order |
| `UPSTASH_REDIS_REST_TOKEN` | opsional | Rate limiting form order |

## Scripts

| Command | Fungsi |
|---|---|
| `npm run dev` | Jalankan dev server |
| `npm run build` | Build production |
| `npm run preview` | Preview build lokal |
| `npm run check` | Type check |
| `npm run lint` / `format` | Lint & format |
| `npm run test` | Jalankan unit test sekali |
| `npm run db:push` | Push schema Drizzle ke DB |
| `npm run db:generate` | Generate migration file |
| `npm run db:studio` | Buka Drizzle Studio |
| `npm run auth:schema` | Generate schema Better Auth |

## Deployment ke Vercel

1. Import repo ke Vercel
2. Set semua environment variables di **Project Settings → Environment Variables**
3. Pastikan route yang render PDF (`/invoice/[orderId]/pdf`) **tidak** memakai Edge Runtime — cek `export const config` di file tersebut kalau ada
4. Deploy — cek log function pertama kali submit order, cold start Puppeteer bisa 2–4 detik, ini normal
5. Verifikasi domain pengirim email di Resend agar tidak masuk spam

## Panduan Pakai — Admin

1. Login di `/login`
2. Buka `Settings` → isi nama toko, sosmed, upload QRIS, isi No. Rekening/VA, payment note
3. Buka `Categories` → buat kategori (misal: Sticker, Keychain, Ongkir)
4. Buka `Products` → tambah produk per kategori, isi harga & stok
5. Bagikan link `/order` ke buyer (lewat bio Instagram, dsb.)
6. Pantau order masuk di `Dashboard` / `Orders`
7. Kalau ada masalah pengiriman email/PDF, buka detail order → tombol **Generate Ulang** / **Kirim Ulang**
8. Setelah buyer transfer, update status di detail order jadi **CONFIRMED**

## Panduan Pakai — Buyer

1. Buka link order dari admin
2. Pilih produk & qty per kategori, pilih metode pengiriman
3. Isi handle sosmed, email, catatan (opsional)
4. Submit — invoice otomatis dikirim ke email
5. Buka email atau link invoice untuk lihat detail & metode pembayaran
6. Transfer/scan QRIS sesuai instruksi di invoice

## Kustomisasi Desain

- Warna, radius, font: edit `@theme` di `src/app.css`
- Layout invoice (PDF & web): `src/lib/components/invoice/InvoiceDocument.svelte`
- Nav sidebar/FAB: `src/lib/components/nav/`

## Keamanan

- Semua harga & stok **divalidasi ulang di server** saat submit order — client tidak dipercaya
- Akses halaman invoice memerlukan `access_token`, bukan cuma menebak `order_id`
- Route admin dilindungi session Better Auth
- Rate limiting di endpoint submit order untuk mencegah spam/bot
- Harga disimpan sebagai integer, snapshot per item — perubahan harga produk tidak mengubah invoice lama

## Troubleshooting

**Email tidak terkirim**
- Cek domain sudah verified di Resend
- Cek log function di Vercel untuk error dari Resend API

**PDF gagal / timeout**
- Cek route tidak pakai Edge Runtime
- Cek ukuran bundle Chromium tidak melebihi limit function Vercel

**Cold start lambat saat generate PDF**
- Ini wajar untuk Puppeteer di serverless; jika mengganggu, evaluasi migrasi ke Satori+resvg (lihat catatan arsitektur)

## Roadmap

- [ ] Payment gateway otomatis (Midtrans/Xendit) — saat ini masih manual/statis
- [ ] Multi-store (kalau suatu saat perlu multi-tenant)
- [ ] Export laporan otomatis (bukan cuma CSV manual)

## Lisensi

Internal project — lisensi menyusul sesuai kebutuhan.