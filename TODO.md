# TODO FINAL — Invoizy

## Fase 0 — Fondasi & Domain Model

- [x] Lengkapi `.env` (`DATABASE_URL` pooling Supabase, `BETTER_AUTH_SECRET`, `ORIGIN`, `PUBLIC_APP_URL`)
- [x] Tulis `src/lib/server/db/schema.ts`:
  - `store_settings` (singleton row: nama toko, ig, twitter, email_from, qris_url, no_rek, va_info, payment_note)
  - `categories` (id, name, sort_order)
  - `products` (id, category_id, name, price_int, stock, track_stock boolean, active, sort_order)
  - `orders` (id, order_id 5-char unique, access_token, handle, email, note, subtotal, total, invoice_status, payment_status, invoice_url, pdf_file_path, error, created_at)
  - `order_items` (id, order_id fk, product_id fk nullable, category_snapshot, name_snapshot, price_snapshot, qty, subtotal)
- [x] `npm run auth:schema` → cek `auth.schema.ts` ter-generate, sesuaikan relasi kalau perlu
- [x] `npm run db:push`, verifikasi tabel muncul di Supabase Studio
- [x] Setup Supabase Storage bucket `qris` (public) dan `invoices` (public, karena buyer akses via link)
- [x] Deploy kosong ke Vercel, isi semua env di dashboard Vercel, pastikan build sukses

## Fase 1 — Auth & Admin Shell

- [x] Setup Better Auth: email+password saja (single admin, tidak perlu social login)
- [x] Seed 1 admin user (script atau manual via Studio)
- [x] `+layout.server.ts` di `/admin` — guard, redirect ke `/login` kalau tidak ada sesi
- [x] Halaman `/login` sederhana
- [x] **Floating sidebar (desktop) + FAB popup (mobile)** — bangun sebagai komponen bersama:
  - `SidebarNav.svelte` (state collapsed/expanded, persist ke localStorage)
  - `MobileFab.svelte` (popup anchor ke FAB, close on outside click/Escape)
  - Item nav admin: Dashboard, Orders, Products, Categories, Settings, Logout
  - Dark/light toggle terintegrasi di nav (sudah)
- [x] Layout `/admin` pakai sidebar tsb sebagai shell

## Fase 2 — CRUD Katalog

- [x] Buat helper `handleFormResult()` — wrapper `use:enhance` yang otomatis toast sukses/gagal + detect 401 (sesi habis) → trigger `handleSessionExpired()`
- [x] `/admin/categories`: list, create, edit, delete, reorder (pakai helper di atas)
- [x] `/admin/products`: list per kategori, create, edit (pakai helper di atas)
- [x] `/admin/settings`: form store info + upload QRIS + info pembayaran (pakai helper di atas)
- [x] Seed data awal dari produk lama
- [x] Validasi zod untuk semua form

## Fase 3 — Alur Order (Publik)

- [ ] Layout publik minimal (header simpel, bukan sidebar admin)
- [ ] `/order`: load kategori+produk aktif, tampilkan sebagai grid kartu per kategori
- [ ] State cart dengan Svelte 5 runes (`cart.svelte.ts`) — qty stepper per produk
- [ ] Step ongkir sebagai pertanyaan single-select terpisah (bukan produk biasa)
- [ ] Form data diri (handle, email, note) pakai superforms + zod
- [ ] Server action submit:
  - Re-validasi semua harga & stok dari DB (jangan percaya angka dari client)
  - Kalau `track_stock` true dan stok kurang → tolak dengan pesan jelas
  - Transaksi: kurangi stok, insert `orders` + `order_items` (snapshot nama/harga saat itu)
  - Generate `order_id` (5 char, alphabet tanpa O/0/I/1) + `access_token` (random, untuk URL invoice)
  - Rate limit submit (Upstash) + honeypot field anti-bot
- [ ] Redirect ke `/order/sukses/[orderId]`

## Fase 4 — Invoice, PDF, Email

- [ ] Komponen `InvoiceDocument.svelte` — reusable untuk tampilan web & sumber render PDF
- [ ] `/invoice/[orderId]`: validasi lewat `access_token` di query/cookie, bukan cuma order_id yang mudah ditebak
- [ ] `/invoice/[orderId]/pdf`: render via Puppeteer (`puppeteer-core` + `@sparticuz/chromium-min`), runtime Node
- [ ] Upload PDF ke Supabase Storage bucket `invoices`, simpan path/url di `orders.pdf_file_path`
- [ ] Setup Resend + `svelte-email-tailwind` template email (subject, body ringkas, lampiran PDF)
- [ ] Trigger otomatis: setelah order sukses dibuat → generate PDF → kirim email → update `invoice_status`
- [ ] Idempotency guard: jangan generate/kirim dobel kalau ada retry
- [ ] Admin action: tombol "Generate ulang PDF" dan "Kirim ulang email" di detail order
- [ ] Admin bisa update `payment_status` manual (PENDING → CONFIRMED)

## Fase 5 — Dashboard & Order Management

- [ ] `/admin` dashboard: total order, total nilai, breakdown status invoice & pembayaran (query aggregate)
- [ ] `/admin/orders`: tabel dengan filter (status, tanggal), search by order_id/email/handle
- [ ] `/admin/orders/[id]`: detail lengkap — item, snapshot harga, riwayat status, tombol aksi (resend, regenerate, ubah status bayar)
- [ ] Export CSV order (opsional tapi murah untuk dibuat, taruh di akhir fase ini)
- [ ] Empty state & loading skeleton di semua list

## Fase 6 — Art Styling & Polish (SESUAI PERMINTAAN: DI AKHIR)

- [ ] Setup `@theme` token: warna dark/light, radius, font
- [ ] Import Fraunces (display) + Inter (body) via `@fontsource` atau Google Fonts self-host
- [ ] `mode-watcher` untuk dark/light toggle + persist
- [ ] Finalisasi visual `SidebarNav` & `MobileFab` sesuai referensi (morph animation, spacing, warna)
- [ ] Polish halaman order (kartu produk, cart summary sticky/bottom sheet)
- [ ] Polish `InvoiceDocument` — pastikan versi PDF & web tetap konsisten setelah restyle
- [ ] Micro-interaction: hover state, transition halus, focus ring accessible
- [ ] Cek kontras warna dark & light mode (WCAG AA minimal untuk teks body)
- [ ] OG image untuk share link `/order`

## Fase 7 — Hardening & Testing

- [ ] Unit test: `currency.ts` (formatRupiah/parseRupiah), `order-id.ts`, kalkulasi total
- [ ] E2E (Playwright): submit order lengkap → cek email terkirim (Resend test mode) → cek PDF ter-generate
- [ ] Security headers di `hooks.server.ts` (CSP, X-Frame-Options, dst)
- [ ] Cek semua route sensitif (invoice, admin) benar-benar terlindungi (token/session)
- [ ] Error monitoring (Sentry free tier) — opsional tapi disarankan
- [ ] Review ulang: apakah ada tempat yang masih percaya input client tanpa validasi server

## Fase 8 — Deploy Final & Handover

- [ ] Final env check di Vercel (production values, bukan dev)
- [ ] Test end-to-end di production URL (bukan cuma local)
- [ ] Tulis README final (lihat bawah) dan `NOTE_SETUP.md` disatukan/diarsipkan
- [ ] Backup strategy sederhana: export tabel `orders`+`order_items` berkala (manual dulu, cron kalau ada waktu)
