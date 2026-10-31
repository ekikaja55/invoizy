---
name: invoizy-maintenance
description: >-
  Kelola mode pemeliharaan (maintenance mode) toko Invoizy secara real-time tanpa redeploy menggunakan Upstash Redis MCP.
  Gunakan saat user meminta untuk memeriksa status maintenance, mengaktifkan mode darurat, atau membuka kembali toko untuk publik.
---

# Invoizy Maintenance Mode Runbook & MCP Automation

Skill ini memandu agen untuk memantau dan mengubah status pemeliharaan toko online Invoizy secara langsung via Upstash Redis REST MCP tanpa perlu redeployment aplikasi.

---

## 1. Spesifikasi Teknis & Kunci Redis

- **Redis Target Database:** `invoizy` (ID: `dd9522c9-de5e-4509-a909-b30bee960023`, Region: `ap-southeast-1` Singapore)
- **Redis Key:** `invoizy:maintenance_mode`
- **Nilai Aktif:** `"true"` (string)
- **Nilai Non-Aktif:** Kunci dihapus (`DEL`) atau bernilai `null`
- **In-Memory Cache:** SvelteKit server hooks menerapkan in-memory cache selama 10 detik (`CACHE_TTL_MS = 10_000`) untuk efisiensi kuota jaringan Upstash.

---

## 2. Prosedur Eksekusi via Upstash MCP Tool

Gunakan tool `call_mcp_tool` dengan parameter berikut:
- **ServerName:** `upstash`
- **ToolName:** `redis_run_command`

### A. Memeriksa Status Maintenance
Kirim argumen:
```json
{
  "databaseId": "dd9522c9-de5e-4509-a909-b30bee960023",
  "commands": [
    ["GET", "invoizy:maintenance_mode"]
  ]
}
```
- Jika hasil mengembalikan `"true"` atau `1`: **Mode Pemeliharaan AKTIF**.
- Jika hasil mengembalikan `null`: **Toko BERJALAN NORMAL**.

### B. Mengaktifkan Mode Pemeliharaan (Tutup Toko untuk Publik)
Kirim argumen:
```json
{
  "databaseId": "dd9522c9-de5e-4509-a909-b30bee960023",
  "commands": [
    ["SET", "invoizy:maintenance_mode", "true"]
  ]
}
```
Hasil yang diharapkan: `"OK"`.

### C. Menonaktifkan Mode Pemeliharaan (Buka Kembali Toko)
Kirim argumen:
```json
{
  "databaseId": "dd9522c9-de5e-4509-a909-b30bee960023",
  "commands": [
    ["DEL", "invoizy:maintenance_mode"]
  ]
}
```
Hasil yang diharapkan: `1` (kunci berhasil dihapus) atau `0` (kunci memang sudah tidak ada).

---

## 3. Efek & Perilaku Sistem Saat Mode Pemeliharaan Aktif

1. **Pengunjung Publik:**
   - Seluruh rute storefront (seperti `/`, `/catalog`, `/cart`, `/checkout`, `/order/*`) otomatis dialihkan dengan HTTP 307 ke `/maintenance` disertai header `Retry-After: 3600`.
   - Endpoint `/maintenance` merender halaman statis tiket monoline dengan status resmi **HTTP 503 Service Unavailable**.
   - Request API publik non-auth mengembalikan respons JSON status 503 dengan pesan informatif.
2. **Pengelola Toko (Admin):**
   - Rute `/login`, `/admin/*`, dan `/api/auth/*` tetap terbuka penuh bagi admin yang terautentikasi.
   - Dashboard admin menampilkan *persistent banner alert* berwarna merah yang mengingatkan admin bahwa toko sedang tutup.
   - Halaman `/admin/settings` menyediakan tombol toggle switch langsung untuk mematikan mode maintenance tanpa perlu membuka terminal atau console Upstash.
3. **Aset Statis & Media:**
   - Bundling client `/_app/*`, favicon, file gambar banner, dan stylesheet tetap dapat diakses publik agar tampilan halaman maintenance tidak rusak.
