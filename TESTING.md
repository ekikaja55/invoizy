### Checklist Testing (Langkah 1 s.d. Langkah 4)

#### 1. Admin: Manajemen Promo Kuantitas (/admin/promo)

[x] Buka menu Promo: Pastikan link "Promo" muncul di
navigasi admin sidebar/navbar dan halaman /admin/promo
terbuka tanpa error.
[x] Buat Rule Promo Baru:
note :

1. ada masalah ketika aku memasukan 4000 input ditolak dengan pesan semacam
   "please input nearest value valid 3001 - 4051" lalu seterus nya misal 5000 sama errornya kenapa? sama misal aku 5500 harus masukin 5501 kenapa demikian?
2. perlu trigger refetch ketika tambah dan hapus trigger busy overlay juga, aku melihat tidak ada opsi edit silahkan ditambah
3. hapus icon disebelah header "Promo Diskon Kuantitas" lalu ganti "Promo Diskon Kuantitas" jadi "Promo Diskon"
   • Klik "Tambah Promo".
   • Pilih produk target (misal: "Keychain A").
   • Masukkan Min. Kuantitas (contoh: 3) dan Nominal
   Diskon (contoh: 3000).
   • Simpan dan pastikan kartu/tabel promo muncul.
   [x] Toggle Status & Hapus
   note : tolong ui nya gunakan semacam toogle sakelar itu lebih baik, jangan lupa trigger refetch dan busy overlay
   • Coba nonaktifkan promo (toggle OFF) lalu aktifkan
   kembali (ON).
   • Coba hapus promo uji coba untuk memastikan modal
   konfirmasi dan penghapusan berfungsi.

──────

#### 2. Admin: Import Produk via CSV (/admin/products)

[x] Unduh Template CSV:
• Klik tombol "Import Produk via CSV".
• Klik tombol "Download Template (.csv)".
• Buka file CSV yang terunduh, pastikan header kolom
sesuai:
name,description,category,imageUrl,variantName,sku,
price,stock,trackStock
[x] Uji Upload CSV:
note :

1. client ku itu yang diunduh itu bukan template csv tapi template .xlsx atau spreadsheet baru kita minta admin isi lalu di modal sertakan tutorial cara save ke csv di spreadsheet maupun excel, untuk pengecekan yang memang fieldnya tidak ada berikan instruksi isi saja "-" lalu berikan pengecekan kalo kategori produk memang belum ada trigger konfirmasi untuk lanjutkan atau batal.
2. sertakan busy overlay, kamu belum menambahkan nya
   • Siapkan 1 atau 2 baris data uji coba di CSV.
   Contoh:
   • Baris 1: Sticker Pack,Sticker Vinyl,merch,
   https://...,Set A,STK-01,15000,50,true
   • Baris 2: Sticker Pack,Sticker Vinyl,merch,
   https://...,Set B (Preorder),STK-02,15000,0,
   false (trackStock: false untuk unlimited)
   • Upload file tersebut ke modal.
   • Periksa Tabel Preview: pastikan nama produk,
   varian, harga, stok, dan badge trackStock terbaca
   tepat.
   • Klik "Import Sekarang" dan verifikasi produk
   langsung muncul di daftar produk.

──────

#### 3. Keranjang & Kalkulasi Promo Multi-Varian

(/order)

note :

1. tambahkan informasi jika promonya ada non aktif di card produk dan di halaman detail produk jangan cuma di cart produk, agar buyer mudah memahami "oh ini ada promo", informasi yang "langsung keliatan mata" untuk menarik mata buyer.
2. ada bug dimana misal aku udah trigger promo (beli 5 gitu trigger potongan) lalu misal aku refresh halaman nya promo nya hilang balek ke harga awal, aku harus keluar detail produk, pilih card produk baru ke trigger lagi kemungkinan karena kamu melakukan fetching promo nya kan di halaman order jadi ketika di passing ke halaman detail dia berupa state client yang hilang jika di refresh, begitu juga kasusnya jika misal di checkout aku back via browser (posisi dari detail produk) detail promo nya tidak ketrigger ini membuktikan state client yang hilang dan tidak persist dan hanya bekerja 1 arah (dari order -> detail -> checkout) oh iya di halaman checkout sertakan tombol kembali ke halaman order
   [x] Promo 1 Varian:
   • Masukkan 1 pcs produk berpromo ke keranjang → Buka
   Cart Drawer → pastikan diskon belum muncul.
   • Tambah kuantitas hingga mencapai minimal promo
   (misal 3 pcs) → pastikan baris "Potongan Promo: -Rp
   3.000" muncul dan total berkurang otomatis.
   [x] Promo Akumulasi Lintas Varian:
   • Untuk produk yang sama yang memiliki varian
   berbeda: tambahkan 2 pcs Varian A + 1 pcs Varian B
   (total 3 pcs).
   • Pastikan diskon tetap ter-trigger sebesar Rp 3.000
   karena total kuantitas produk tersebut telah
   memenuhi syarat.
   [x] Kelipatan Promo:
   • Tambah kuantitas produk menjadi 6 pcs → diskon
   harus otomatis berlipat menjadi -Rp 6.000.

──────

#### 4. Alur Checkout Event (/order/checkout)

[x] Penyederhanaan Form:
• Buka /order/checkout.
• Pastikan form alamat rumah, kecamatan, dan widget
kurir ekspedisi (JNE/TIKI/dll) sudah tidak muncul.
[x] 3 Opsi Pengiriman Event:
• Pastikan tampil 3 pilihan kartu metode pengiriman
dengan biaya Rp 0: 1. Paket via Shopee (Mail Order) 2. Ambil di Booth - Hari 1 (Sabtu, 12 Des 2026) 3. Ambil di Booth - Hari 2 (Minggu, 13 Des 2026)
• Klik salah satu opsi (pastikan state terpilih
aktif/highlight).
[x] Submit Order:
• Isi Nama, Email, dan No. WhatsApp.
• Klik "Buat Pesanan" dan pastikan diarahkan ke
halaman invoice /invoice/[orderId].

──────

#### 5. Tampilan Invoice & PDF (/invoice/[orderId])

[x] Invoice Web:
• Periksa baris rincian: Subtotal, Potongan Promo
(jika ada), dan Ongkir Rp 0.
• Metode pengiriman menampilkan badge event yang
dipilih (misal: Ambil di Booth (Sabtu, 12 Des 2026)).
• Tidak ada baris alamat kosong yang aneh.
[x] Download PDF:
• Klik tombol "Download PDF".
• Buka PDF: pastikan layout rapi, teks tidak
bertumpuk, baris diskon promo dan metode pengiriman
tertera jelas.
[x] Email Konfirmasi (Resend):
note :

1. ketika pertama kali masuk email aman tapi misal sebagai admin generate ulang pdf lalu kirim ulang email, emailnya masuk ke folder spam di gmail mengapa demikian?
2. di bagian modal hubungi buyer WA di modal pilihan chat nya bisa di adjust lagi karena kan pakai sistem link co shope ya
3. oh iya aku sempet expect kalo misal lunas kita bisa mengambil link co shope nya karena template yang diminta itu
   Halo kak! Terimakasih sudah pre-order fanmerch cho.lazey!!
   Pembayaran sebesar Rp45.000 atas nama @Ich1kara sudah diterima ya! Terima kasih banyak 💕

Pesanan :

- Silent Salt lanyard keychain
- Silent Salt Glitter sticker
  Total : Rp45.000
  status : Lunas

Mohon dibantuk untuk co link pengirimannya dibawah ini ya kak
https://shopee.co.id/Link-khusus-co-chco.lazey-i.244578412.57658879237?extraParams=%7B%22display_model_id%22%3A315788925497%2C%22model_selection_logic%22%3A3%7D

📦 Estimasi Paket Siap Dikirim : Senin, 24 Agustus 2026
(Hari Sabtu dan Minggu serta tanggal merah semua konter pengiriman libur/tutup)

Mohon pengertiannya ya kak, untuk pengirimannya baru bisa di hari Senin sebab 20-22 Agustus @/cho.lazey ikut event Adiwarna: Seraya di Basement Alun-Alun kota Surabaya

Nanti Kakak akan diberitahukan kembali saat barang sudah diantarkan ke konter pengiriman. See ya! ✨

apakah itu memang diluar tanggung jawab kita? itu urusan admin nya kah? perlukah kita intergrasikan ke shope api ? atau jika itu memang urusan admin di modal chat buyer via wa memang perlu di adjust total 4. di halaman detail order admin ketika status pembayaran berubah misal dari status a ke status b trigger konfirmasi kalo misal itu belum disimpan mungkin dibawah dropdown status atau trigger modal, kalo gasalah kamu udah garap kalo misal admin belum generate ulang pdf langsung kirim ulang email posisi status berubah itu langsung auto re generated ya? aku lupa

• Jika EMAIL_ENABLED=true aktif di .env: cek email
masuk pada akun pemesan.
• Verifikasi pengirim adalah cho.lazey
<invoice@cholazey.store> dan terdapat lampiran PDF
invoice.

──────

#### 6. Pengurangan Stok & Preorder (trackStock)

[x] Masuk kembali ke /admin/products:
• Varian dengan trackStock = true: pastikan sisa
stok berkurang sesuai jumlah yang di-checkout.
• Varian dengan trackStock = false: pastikan stok
tidak berkurang (tetap utuh).

──────
Silakan uji coba skenario di atas di browser lokal. Jika
ada tampilan yang janggal, kalkulasi meleset, atau
kendala lainnya, laporkan bagian mana yang bermasalah
agar langsung saya telusuri kodenya.
