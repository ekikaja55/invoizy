# TEMPORARY_ANNOUNCEMENT.md — Penyesuaian Khusus Event Offline Chibiconxi

> **Branch:** `event/chibiconxi-offline`  
> **Periode:** Persiapan 19 Oktober 2026 s.d. Event 28 Oktober 2026  
> **Status:** Khusus Pameran / Offline Exhibition Mode  

---

## 1. Deskripsi & Tujuan Dokumen

Dokumen ini adalah acuan sementara (*temporary contract*) untuk penyesuaian alur dan fitur Invoizy selama event pameran offline berlangsung. 

**Prinsip Utama:**
- Semua penyesuaian di branch ini bersifat **sementara** untuk mempermudah operasional di booth pameran offline.
- Fitur reguler (seperti kurir pengiriman luar kota, integrasi kompleks, dll.) **dinonaktifkan sementara**, bukan dihapus permanen.
- Branch `main` tetap bersih sebagai basis kode versi penuh. Setelah pameran 28 Oktober selesai, sistem web dapat dikembalikan ke branch `main` dengan sekali klik.

---

## 2. Rincian Fitur yang Dinonaktifkan Sementara (Work in Progress)

*(Akan diisi detail spesifik setelah diskusi fitur pameran disepakati)*

- [ ] **Sistem Ekspedisi & Ongkir**: Disederhanakan untuk pengambilan langsung di booth (*Direct Pickup*).
- [ ] **Alamat Pengiriman Buyer**: Form input disesuaikan agar cepat diisi di antrean booth pameran.
- [ ] **Alur Pembayaran & Invoice**: Penyesuaian verifikasi pembayaran di tempat (QRIS kasir / tunai).
- [ ] **Notifikasi Email**: Menyesuaikan kebutuhan konfirmasi transaksi cepat di ponsel buyer.

---

## 3. Catatan Re-deployment Pasca-Event

Setelah tanggal 28 Oktober 2026:
1. Kembalikan *Production Branch* di dashboard hosting (Vercel) ke branch `main`.
2. Semua fitur penuh dan desain utama yang ada di `main` akan aktif kembali secara otomatis.
