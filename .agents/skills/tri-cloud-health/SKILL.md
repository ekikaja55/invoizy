---
name: tri-cloud-health
description: >-
  Tinjau kesehatan, performa, dan telemetri langsung dari tiga pilar infrastruktur cloud Invoizy:
  Supabase (Postgres & Security Advisors), Upstash (Redis Caching & Rate Limiting), dan Vercel (Deployments,
  Custom Domains, dan Serverless Functions di region sin1). Aktifkan saat user meminta audit infra,
  health check cloud, status hosting, atau pemeriksaan keandalan sebelum/sesudah promosi.
---

# Tri-Cloud Health Check & Diagnostics Runbook

Gunakan skill ini untuk melakukan audit komprehensif terhadap 3 layanan cloud penyokong Invoizy secara berurutan dan menghasilkan laporan artefak terpadu bagi pengguna.

---

## Tahap 1: Inspeksi Supabase (Database & Keamanan)

1. **Target Project:** `ermsohwpjmfnyuwpajot` (Region: `ap-southeast-1` Singapore).
2. **Security & Performance Advisors:**
   - Panggil MCP tool `supabase` dengan `get_advisors`.
   - Periksa apakah ada indeks foreign key yang belum tertutup (*unindexed foreign keys*).
   - Pastikan PostgREST Data API tetap terkunci (privileges publik dicabut) sehingga database aman dari akses publik langsung.
3. **Koneksi Database:**
   - Pastikan konfigurasi pooler port 6543 (Transaction Mode) aktif dan siap melayani serverless functions Vercel tanpa kehabisan *connection slots*.

---

## Tahap 2: Inspeksi Upstash (Redis & Rate Limiting)

1. **Target Database:** `invoizy` (`dd9522c9-de5e-4509-a909-b30bee960023` / Region: `ap-southeast-1` Singapore).
2. **Statistik & Memori:**
   - Panggil MCP tool `upstash` dengan `redis_get_stats` atau periksa metrik cluster.
   - Evaluasi penggunaan memori terhadap batas kuota (10.000 request/hari pada free tier).
   - Pastikan kebijakan eviksi `volatile-lru` aktif agar kunci rate limit kedaluwarsa secara otomatis dan tidak menimbulkan error out-of-memory.
3. **Efisiensi Caching:**
   - Verifikasi bahwa `ephemeralCache` (in-memory Map) pada `src/lib/server/ratelimit.ts` berjalan untuk menghemat panggilan jaringan ke Upstash.

---

## Tahap 3: Inspeksi Vercel (Hosting, Serverless, & Domain)

1. **Target Project:** `cholazey` (`prj_OSX1YziQSN5whuhA8ThBZi4MODfR`).
2. **Status Deployment Terkini:**
   - Periksa deployment ID terakhir dan pastikan berstatus `READY`.
   - Pastikan target domain produksi `https://www.cholazey.store` aktif dan mengembalikan HTTP 200.
   - Pastikan domain apex `cholazey.store` mengembalikan redirect permanen (308) ke `www.cholazey.store`.
3. **Serverless Functions:**
   - Konfirmasi bahwa fungsi dieksekusi di region `sin1` (Singapore), berdampingan dengan Supabase dan Upstash untuk latensi sub-10ms.
   - Periksa apakah terdapat error 500 pada log runtime.

---

## Tahap 4: Sintesis Laporan (Markdown Artifact)

Buat artefak laporan baru di direktori artifact dengan nama `tri_cloud_health_report.md` menggunakan format tabel status:

```markdown
# Laporan Diagnostik Tri-Cloud — Invoizy

| Layanan | Komponen Kritis | Status | Indikator / Keterangan |
| :--- | :--- | :---: | :--- |
| **Supabase** | Postgres & Foreign Keys | 🟢 | Unindexed FK: 0, PostgREST: Locked |
| **Upstash** | Redis Rate Limiting | 🟢 | Eviction: volatile-lru, Latency: Sub-10ms |
| **Vercel** | Production Deployment | 🟢 | Status: READY, Region: sin1, 0 Error 500 |
```

Sertakan rekomendasi tindakan teknis jika ada metrik yang menyentuh batas ambang (*warning/critical*).
