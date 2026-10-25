# Invoizy Design System — Warm Monoline Editorial

Spesifikasi desain antarmuka untuk Invoizy. Dokumen ini menjadi rujukan tunggal untuk token warna, tipografi, ritme tata letak, dan komponen antarmuka.

---

## 1. Prinsip Utama

1. **Kehangatan Fisik di Atas Garis Presisi**  
   Latar warna kertas cream hangat (`#f2efe9`) berpadu dengan garis tepi monoline arang (`#262626`). Menghindari tampilan putih steril ala aplikasi SaaS generik dan menghindari ornamen scrapbook yang memperlambat transaksi.
2. **Warna Pastel sebagai Aksen Data, Bukan Cat Latar**  
   Warna brand klien (Lavender, Mint, Peach) digunakan untuk penanda status, kategori barang, dan promo. Tombol transaksi utama memakai warna arang pekat agar target klik terbaca tegas oleh pembeli.
3. **Keterbacaan Angka Finansial**  
   Semua nominal rupiah dan kode invoice memakai huruf monospaced agar digit selalu sejajar saat dihitung.
4. **Kontras WCAG AA Mutlak**  
   Semua teks kecil memiliki rasio kontras minimal 4.5:1 terhadap latarnya. Tidak ada teks abu-abu terang di atas latar cream.

---

## 2. Palet Warna & Token Desain

### 2.1 Warna Dasar Permukaan & Teks
| Token | Nilai Hex | Penggunaan |
| :--- | :--- | :--- |
| `--color-canvas` | `#f2efe9` | Latar belakang utama seluruh halaman web. |
| `--color-surface` | `#ffffff` | Kartu produk, baris tabel data, modal dialog, kontainer form. |
| `--color-surface-sunken` | `#e8e4db` | Kotak input form sebelum fokus, latar kolom total di invoice. |
| `--color-ink-primary` | `#262626` | Teks judul, body text, garis tepi monoline (border), tombol utama. |
| `--color-ink-secondary` | `#404040` (dark: `#b8b5ad`) | Deskripsi produk, label sekunder, teks bantuan form (rasio kontras > 7:1). |
| `--color-border` | `#262626` | Garis batas tunggal pada semua komponen interaktif dan kartu. |

### 2.2 Warna Brand Klien (Aksen Fungsional)
| Token | Nilai Hex | Penggunaan Khusus |
| :--- | :--- | :--- |
| `--color-brand-lavender` | `#b4a6d5` | Latar tab aktif, header kategori produk, hover tombol sekunder. |
| `--color-brand-mint` | `#a2e1db` | Badge stok aman, penanda varian produk, filter aktif. |
| `--color-brand-peach` | `#fea770` | Badge diskon belanja, penanda promo bundle, tag event khusus. |

### 2.3 Warna Semantik (Lolos Uji Kontras WCAG AA)
Warna semantik dipisahkan antara teks gelap dan latar kontras tinggi:

| Status | Latar Badge | Teks & Ikon | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Sukses / Lunas** | `#d1fae5` | `#065f46` | Pembayaran terverifikasi, barang siap diambil/dikirim. |
| **Peringatan / Menunggu** | `#fef3c7` | `#92400e` | Menunggu konfirmasi admin, stok tersisa < 3 pcs. |
| **Bahaya / Batal** | `#fee2e2` | `#991b1b` | Pesanan kedaluwarsa, stok habis, tombol hapus produk. |
| **Informasi / Proses** | `#e0e7ff` | `#3730a3` | Pembuatan PDF invoice, pengalihan halaman. |

---

## 3. Sistem Garis, Sudut, & Elevasi

- **Ketebalan Garis (Border):**  
  - Standar kartu dan baris tabel: `1px solid #262626`
  - Kontainer utama, tombol, dan form input: `1.5px solid #262626`
- **Radius Sudut (Border Radius):**  
  - Konsisten `6px` (`rounded-md` di Tailwind) untuk kartu, tombol, dan kotak input.
  - `9999px` (`rounded-full`) khusus untuk badge status dan tag kategori.
- **Elevasi (Shadow):**  
  - Default: Tanpa bayangan blur (`shadow-none`).
  - Interaksi Hover (Kartu Produk & Tombol): Offset kaku `2px 2px 0px #262626`. Tidak menggunakan bayangan abu-abu buram.

---

## 4. Tipografi

Tiga keluarga huruf dengan peran fungsional yang terpisah:

1. **Headings & Nama Produk Utama: Playfair Display / Fraunces (SemiBold)**  
   Digunakan pada judul halaman, nama produk di katalog, dan header invoice. Memberi karakter editorial toko seni tanpa memperlambat pembacaan.
2. **Teks Antarmuka & Form: Plus Jakarta Sans (Regular / Medium / Bold)**  
   Digunakan untuk navigasi, deskripsi barang, label input form, dan instruksi pembayaran. Bebas dari kesan template AI generik.
3. **Data Finansial & Kode: JetBrains Mono (Medium / Bold)**  
   Digunakan untuk harga barang (Rupiah), nomor order invoice, kuantitas stepper, dan rincian subtotal tabel.

---

## 5. Hirarki Tombol Aksi

1. **Primary Button (Aksi Final: Beli Sekarang, Checkout, Bayar Pesanan)**  
   - Light Mode: Latar `#262626` (Arang), Teks `#f2efe9` (Cream), Border `1.5px solid #262626`.
   - Dark Mode: Inversi material kertas solid — Latar `#f2efe9` (Cream), Teks `#262626` (Arang), Border `1.5px solid #f2efe9`, Bayangan `2px 2px 0px #f2efe9`. Mencegah tombol CTA utama tenggelam di atas kartu gelap.
   - Hover: Pergeseran posisi `-1px -1px` dengan bayangan `2px 2px 0px`.
2. **Secondary Button (Aksi Pilihan: Pilih Varian, Unduh PDF)**  
   - Light Mode: Latar `#ffffff`, Teks `#262626`, Border `1.5px solid #262626`.
   - Dark Mode: Latar `#343044`, Teks `#f2efe9`, Border `1.5px solid #f2efe9`, Hover Lavender (`#b4a6d5`).
3. **Ghost / Tertiary Button (Aksi Sekunder: Reset Filter, Kembali)**  
   - Latar transparan, garis tepi tipis, tanpa bayangan.

---

## 6. Pola Komponen Kunci

### 6.1 Monoline Loader (4 Kotak Geometris Brand)
- Animasi pemuatan sistem (*busy overlay* dan *navigation overlay*) tidak lagi menggunakan lingkaran spinner generic SaaS.
- Menggunakan **4 kotak geometris monoline** (`1.5px` border arang/krem) yang saling berputar dan bertukar posisi secara koreografis via CSS keyframes.
- Merepresentasikan 4 warna inti sistem: **Lavender (`#b4a6d5`)**, **Mint (`#a2e1db`)**, **Peach (`#fea770`)**, dan **Arang (`#262626`)** / Krem di dark mode.
- Mode default tampil tanpa teks visual untuk kemurnian estetika, dengan `<span class="sr-only">` untuk kepatuhan aksesibilitas WCAG.

### 6.1 Kartu Produk Pembeli (Katalog)
- Foto produk berbingkai garis tunggal `1px solid #262626`.
- Nama produk serif tebal, diikuti harga format rupiah monospaced.
- Badge promo diletakkan rapi di bawah harga menggunakan warna Peach (`#fea770`) bergaris tipis.
- Tombol order menempel di bagian bawah kartu dengan pembatas garis horizontal.

### 6.2 Form Checkout & Data Pembeli
- Latar kartu putih bersih di atas kanvas cream.
- Kotak input bergaris `1.5px solid #262626` dengan padding vertikal `10px` dan horizontal `12px`.
- Fokus input: Garis tepi tetap arang pekat dengan offset ring halus, tanpa warna biru/ungu acak.
- Area upload bukti bayar: Kotak persegi bergaris tunggal tegas dengan tombol unggah yang jelas.

### 6.3 Dokumen Invoice (Web & Render PDF)
- Format faktur klasik dengan garis pemisah monoline.
- Baris tabel pesanan bergantian antara putih `#ffffff` dan cream tipis `#f9f7f2`.
- Kolom total akhir diberi garis ganda bawah (*double underline*) khas dokumen akuntansi resmi.
- Tidak ada elemen dekoratif yang menghabiskan tinta printer saat dicetak pembeli.

---

## 7. Pantangan Desain (Anti-Patterns)

- Dilarang memakai gradient ungu-ke-biru (`from-indigo-500 to-purple-600`) atau teks ber-gradient.
- Dilarang memakai font default Inter untuk seluruh halaman.
- Dilarang menumpuk kartu di dalam kartu lebih dari 2 lapis (*nested card clutter*).
- Dilarang memakai bayangan abu-abu buram tebal (`shadow-xl` / `shadow-2xl`).
- Dilarang memakai rotasi miring (`-rotate-1`, `-rotate-2`) atau selotip palsu pada form transaksi dan tabel data.
