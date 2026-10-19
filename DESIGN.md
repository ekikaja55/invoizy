# Invoizy Design System
**Philosophy:** Organic Maximalism & Digital Scrapbook. "From sketch to life", "Love cute and chaotic things", "Gonna make some mess".

## 1. Color Palette & Theming
Penggunaan warna bukan sekadar estetika, melainkan instrumen hierarki.

### Core Palette
*   **Ink Black (`#001524` / `var(--color-ink)`):** Jangkar struktural. Latar belakang utama untuk Dark Mode. Warna teks utama untuk Light Mode.
*   **Papaya Whip (`#ffecd1` / `var(--color-papaya)`):** Kanvas taktil. Latar belakang utama untuk Light Mode, merepresentasikan kertas sketsa. Pada Dark Mode, digunakan untuk warna teks utama agar nyaman dibaca.
*   **Stormy Teal (`#15616d` / `var(--color-teal)`):** Aksen sekunder elegan. Digunakan untuk teks judul, aksen badge netral, dan kartu modular.
*   **Vivid Tangerine (`#ff7d00` / `var(--color-tangerine)`):** Pemicu tindakan (CTA utama) & kekacauan terkontrol. Khusus untuk tombol utama, stiker dekoratif, dan highlight penting.
*   **Brandy (`#78290f` / `var(--color-brandy)`):** Transisi organik. Digunakan untuk bayangan solid (*hard offset shadow* `shadow-[4px_4px_0px_#78290f]`), border tak rata, dan outline ilustratif.

### Semantic Status Colors (Transaksi & Feedback)
*   **Crimson (`#c1121f` / `var(--color-crimson)`):** Status Gagal (`FAILED`), Kedaluwarsa (`EXPIRED`), stok habis, atau pesan error formulir.
*   **Forest Emerald (`#2b9348` / `var(--color-forest)`):** Status Lunas (`PAID`), Terkirim (`SENT`), stok tersedia, atau verifikasi sukses.

---

## 2. Typography Architecture
Menggabungkan keanggunan editorial dengan keliaran ekspresif. Seluruh font di-bundle secara lokal via `@fontsource` (offline-ready, zero CDN dependency).

*   **Headlines (Classy Serif):** `Fraunces` via `font-headline` (700). Digunakan untuk H1, H2, dan nominal harga besar.
*   **Display & Aksen (Chaotic Handwritten):** `Caveat` via `font-handwriting` (600). Digunakan untuk stiker, coretan nota, catatan toko, atau microcopy dekoratif.
*   **Body & Form (Clean Sans):** `Plus Jakarta Sans` via `font-sans` (400, 600). Digunakan untuk paragraf, label form, keterangan tombol, dan isi data tabel.
*   **Data & Transaksional (Monospace):** `Space Mono` via `font-mono` (400, 700). Digunakan eksklusif untuk Order ID, Passcode, kode unik transfer, dan nomor resi.

---

## 3. Z-Index Scale (Spatial Layering)
*   `z-0`: Kanvas dasar & background grain/noise.
*   `z-10`: Komponen utama (Kartu, Form, Tabel).
*   `z-20`: Elemen intervensi (Stiker dekoratif, coretan SVG, floating badges).
*   `z-30`: Header navigasi global / sticky top bar.
*   `z-40`: Backdrop/Overlay (`bg-ink/80` atau `bg-[#001524]/80`).
*   `z-50`: Modal dialog interaktif.
*   `z-100`: Sonner Toasts (Notifikasi "kertas tempel").

---

## 4. UI Components Guidelines (Controlled Chaos / "Jalan Tengah")

### Buttons & Actions
*   **Bentuk:** Terapkan *asymmetrical borders* yang taktil (contoh: `rounded-[255px_15px_225px_15px/15px_225px_15px_255px]` atau variasi organik `rounded-[14px_6px_12px_8px]`).
*   **Shadow:** *Hard offset shadow* solid tanpa blur menggunakan warna Brandy (`shadow-[3px_3px_0px_#78290f]` atau `shadow-[4px_4px_0px_#78290f]`).
*   **Interaksi:** Transisi *scale-up* halus atau rotasi kecil (`-rotate-1` s/d `rotate-2`) saat hover untuk ilusi stiker kertas fisik.

### Form Inputs & Data Tables (Disiplin Fungsional)
*   **Jalan Tengah:** Untuk input form teks, number stepper, dan baris tabel transaksi, gunakan sudut geometri yang rapi dan stabil (border tipis bersih) agar input data pengguna tidak terdistorsi atau sulit diklik.
*   **Aksen:** Estetika scrapbook disematkan pada label field (menggunakan font sans/handwriting), badge status, dan outline luar kartu kontainer.
*   **DOM Nodes:** Pada tabel data yang panjang, sembunyikan ilustrasi SVG dekoratif berat demi performa render.

### Invoice Document Preview
*   **Estetika:** Nota kasir retro / scrapbook. Tepi kertas atas/bawah bergerigi (SVG mask).
*   **Cap Lunas / Stamp:** Berbentuk *rubber stamp* miring (rotasi acak `-rotate-6` hingga `rotate-6`) dengan warna Forest Emerald (`#2b9348`) atau Stormy Teal (`#15616d`).
*   **Cetak (@media print):**
    *   Terapkan `-webkit-print-color-adjust: exact;`
    *   Hapus efek `backdrop-filter` atau bayangan blur kompleks.
    *   Pastikan kontras teks (`Ink Black`) di atas latar belakang tetap solid.

---

## 5. Animation & Interaction
*   **Kinerja GPU:** Semua animasi murni menggunakan properti `transform` (`translate`, `scale`, `rotate`) dan `opacity` untuk memicu akselerasi GPU tanpa reflow layout.
*   **Scroll-Triggered:** Stiker dekoratif dan cap dapat menganimasikan dirinya secara halus saat memasuki viewport (dari status sketsa terpencar menjadi kesatuan utuh).