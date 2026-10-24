### Panduan Pengujian Lokal (Checklist Testing)

  1. Uji Transaksi & Transisi Bebas Flicker:
      • Buka katalog http://localhost:5173/order, masukkan produk ke keranjang, lalu klik checkout.
      • Isi identitas pembeli dan klik tombol "Lanjut ke Pembayaran".
      • Hasil yang diharapkan: Muncul overlay pemrosesan, tidak ada kedipan tampilan "Keranjang Masih Kosong", dan
      browser langsung mendarat mulus di /order/bayar/[orderId]?token=....
      hasil :
      1. tidak ada flikering lagi di ketika menuju ke halaman bayar [RESOLVED]
      2. timer sejenak 00:00 -> [RESOLVED] Sekarang dihitung instan dari targetTimestamp sebelum render, bebas kedipan 00:00.
      3. overlay proses -> [RESOLVED] Fullscreen fixed overlay anti-scroll diterapkan selama submitting checkout.
  2. Uji Upload Bukti Transfer & Refresh:
      • Di halaman pembayaran, unggah gambar bukti transfer dan klik kirim.
      • Lakukan refresh halaman dengan tautan yang ada.
      • Hasil yang diharapkan: Foto terunggah tanpa error "Token tidak valid", dan dialihkan ke /order/sukses/[orderId].
      hasil :
      1. error "Silakan pilih file foto bukti pembayaran terlebih dahulu" -> [RESOLVED] Input file dijadikan elemen tunggal persisten di DOM (tidak ter-unmount saat preview foto aktif).
      2. bucket supabase -> Menggunakan bucket 'invoices' (folder proofs/). Tidak perlu membuat bucket baru.
  3. Uji Halaman Riwayat:
      • Buka http://localhost:5173/order/riwayat.
      • Buka Developer Tools console browser (F12).
      • Hasil yang diharapkan: Riwayat invoice tampil cepat, status terverifikasi dari server, dan console bersih dari
      error effect_update_depth_exceeded maupun NetworkError.
      hasil :
      aman tidak ada kendala [RESOLVED]
  4. Uji Kedaluwarsa Pesanan & Rollback Stok (Timer 1 Menit):
      • Buat pesanan baru, catat stok awal produk di admin.
      • Biarkan pesanan melewati batas waktu (1 menit) tanpa mengunggah bukti bayar.
      • Buka halaman detail pesanan di admin (/admin/orders/[id]).
      • Hasil yang diharapkan: Status otomatis berubah menjadi EXPIRED, muncul banner kedaluwarsa, seluruh tombol aksi
      verifikasi nonaktif, dan stok produk di katalog kembali bertambah sesuai jumlah yang dipesan.
      hasil :
      1. status invoice web/PDF saat kadaluarsa -> [RESOLVED] InvoiceDocument sekarang memiliki stempel karet resmi "KEDALUARSA / EXPIRED" dan "MENUNGGU VERIFIKASI".
      2. modal WA terlalu kecil -> [RESOLVED] Diganti menjadi Collapsible Accordion inline yang membentang lapang dan nyaman dibaca tanpa menutup konteks pesanan.
  5. Uji Tampilan & Expand/Collapse Kategori:
      • Buka /order di layar desktop.
      • Periksa kelegaan layout 3 kolom card produk.
      • Coba klik tombol "Lihat Semua" pada kategori yang memiliki lebih dari 6 produk, lalu klik "Ciutkan".
      hasil : 
      1. expand/collapse -> sudah sesuai [RESOLVED]
      2. layout admin ketutupan sidebar -> [RESOLVED] Menghapus class 'lg:px-8' yang menimpa padding kiri desktop di admin/+layout.svelte, mengunci padding ke 'md:pl-72 lg:pl-72' (jarak bersih 48px dari sidebar).
