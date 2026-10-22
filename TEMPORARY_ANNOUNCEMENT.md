# TEMPORARY_ANNOUNCEMENT.md — Spesifikasi & Kontrak Penyesuaian Event Chibiconxi

> **Branch Target:** `event/chibiconxi-offline`  
> **Domain Resmi:** `www.cholazey.store`  
> **Periode Event:** 12 – 13 Desember 2026 (Sistem Siap Penuh: 28 Oktober 2026)  
> **Status Dokumen:** KONTRAK KERJA RESMI (Menggantikan TODO.md lama untuk scope pameran & penyesuaian permanen)

---

## 1. Domain & Konfigurasi Pengiriman Email Resend

* **Domain Terhubung:** `www.cholazey.store` (terverifikasi di Hostinger, Vercel, dan Resend).
* **Environment Variable Vercel yang Wajib Ada:**
  - `EMAIL_ENABLED=true`
  - `RESEND_API_KEY=re_...`
  - `EMAIL_FROM=cho.lazey <invoice@cholazey.store>` *(atau subdomain/alamat pengirim yang diverifikasi di Resend)*
* **Perilaku Sistem:** Invoice PDF resmi akan otomatis diterbitkan dan dikirimkan ke email buyer seketika setelah checkout berhasil dibuat.

---

## 2. Penyederhanaan Alur Pengiriman & Eliminasi Ongkir (Rp 0)

1. **Ongkir Dinonaktifkan Total (Biaya Pengiriman = Rp 0)**:
   - Sistem cek tarif kurir RajaOngkir dan perhitungan berat produk dinonaktifkan.
   - Fitur "Kode Rahasia Rekanan / Ambil Sendiri" dihapus permanen.
2. **3 Opsi Pengiriman Baru di Halaman Checkout:**
   - **`MAIL_ORDER` (Kirim Paket via Shopee)**:
     - Biaya di web Rp 0.
     - Buyer membayar barang di web ini, lalu toko mengirimkan pesan (via Email / WhatsApp) berisi tautan checkout khusus Shopee (Rp 1 / bebas ongkir Shopee) untuk keperluan pengiriman ekspedisi.
   - **`PICKUP_DAY_1` (Self Pickup — Day 1: 12 Desember 2026)**:
     - Ambil langsung di meja booth pameran Chibiconxi hari pertama. Biaya Rp 0.
   - **`PICKUP_DAY_2` (Self Pickup — Day 2: 13 Desember 2026)**:
     - Ambil langsung di meja booth pameran Chibiconxi hari kedua. Biaya Rp 0.
3. **Fleksibilitas Pasca-Event:** Opsi *Self Pickup* dapat dinonaktifkan/disembunyikan melalui pengaturan admin setelah tanggal 13 Desember.

---

## 3. Form Checkout Buyer yang Disederhanakan

Data formulir buyer dipangkas agar pengisian di booth berlangsung sangat cepat:
* **Wajib Diisi:**
  1. **Nama Lengkap** (`customerName`)
  2. **Akun Media Sosial** (`handle` — Instagram / X untuk verifikasi)
  3. **Nomor WhatsApp** (`phone` — untuk konfirmasi & pengiriman link Shopee)
  4. **Email Aktif** (`email` — untuk menerima salinan faktur invoice PDF)
* **Dihapus dari Tampilan Form:** Alamat rumah, provinsi, kota/kabupaten, kecamatan, dan kode pos.
* **Strategi Database (PENTING):** Kolom `address`, `destination_id`, `destination_label`, `courier`, `service` pada tabel `orders` **TIDAK DIHAPUS (DROP)** melainkan dibuat `NULLABLE` agar tidak merusak data historis yang sudah ada.

---

## 4. Sistem Diskon Promo Produk (Quantity Tier Discount)

* **Menu Baru di Admin:** Halaman manajemen **"Promo"** (`/admin/promo`).
* **Karakteristik & Logika Aturan:**
  - Promo diikat ke **Produk Tertentu**.
  - Jika produk memiliki beberapa varian (misal 5 varian stiker berbeda), seluruh varian tersebut saling mengakumulasi jumlah kuantitas (*cross-variant quantity pool*).
  - **Rumus Diskon:** Menggunakan kelipatan (*Tier/Batch*):
    $$\text{Potongan} = \left\lfloor \frac{\text{Total Qty Produk}}{\text{Syarat Min Qty}} \right\rfloor \times \text{Nominal Diskon}$$
    *Contoh Nyata:*
    - Harga stiker: Rp 5.000 / pcs.
    - Syarat promo: Beli minimal 3 pcs dapat diskon Rp 3.000.
    - Jika beli 3 pcs: Total $(3 \times 5.000) - 3.000 = \text{Rp 12.000}$.
    - Jika beli 4 pcs: $(4 \times 5.000) - 3.000 = \text{Rp 17.000}$.
    - Jika beli 6 pcs: $(6 \times 5.000) - (2 \times 3.000) = \text{Rp 24.000}$.
* **Transparansi di Keranjang & Faktur:** Potongan promo tampil eksplisit sebagai baris pengurangan harga di keranjang belanja, checkout, invoice web, dan lampiran PDF.

---

## 5. Fitur Produk: Opsi Varian Tanpa Lacak Stok (*Unlimited Pre-Order*)

* Setiap produk atau varian memiliki opsi sakelar: **`Lacak Stok: Ya / Tidak`** (`trackStock: boolean`, default `true`).
* Jika `trackStock = false`:
  - Stok dianggap tak terbatas (*unlimited pre-order*).
  - Tidak ada validasi *out-of-stock* saat checkout.
  - Sangat cocok untuk produk cetak sesuai pesanan (*print on demand / made by order*).

---

## 6. Fitur Admin: Bulk Upload Produk via CSV

* Tombol **"Import CSV"** di halaman `/admin/products` yang memicu modal interaktif.
* **Fitur di Dalam Modal:**
  1. Tombol **"Unduh Template CSV"** yang berisi header kolom standar dan baris contoh data.
  2. Zona upload drag-and-drop file `.csv`.
  3. **Client-Side Parser dengan `papaparse`**: Menampilkan tabel pratinjau (*preview*) barang yang akan diimpor sebelum data benar-benar disimpan ke database Supabase.
  4. Validasi format angka harga, kategori, dan deteksi duplikasi.

---

## 7. Rencana Urutan Implementasi Bertahap

1. **Langkah 1 (Database & Fondasi Skema):**
   - Jadikan kolom alamat & ongkir nullable.
   - Buat skema tabel `product_promos` / `discounts`.
   - Tambahkan flag `track_stock` pada skema produk/varian.
2. **Langkah 2 (Frontend Checkout & Keranjang):**
   - Hilangkan widget RajaOngkir & input alamat.
   - Pasang 3 pilihan pengiriman (`MAIL_ORDER`, `PICKUP_DAY_1`, `PICKUP_DAY_2`) dengan ongkir Rp 0.
   - Terapkan kalkulasi diskon promo kuantitas di Cart Drawer & Checkout.
3. **Langkah 3 (Invoice Web & PDF Resend):**
   - Sesuaikan tampilan invoice untuk menampilkan opsi pickup booth / mail order serta baris diskon promo.
4. **Langkah 4 (Admin Area: Promo & CSV Import):**
   - Implementasikan halaman `/admin/promo`.
   - Pasang modal upload CSV dengan library `papaparse` di `/admin/products`.
   - Lengkapi opsi toggle `trackStock` pada form produk admin.


