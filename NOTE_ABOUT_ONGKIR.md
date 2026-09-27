NOTE ABOUT ONGKIR TOGGLE
Pertanyaan bagus, ini penting dipahami sebelum lanjut karena akan menentukan logic di halaman `/order` nanti. Mari dijelaskan dari masalah yang mau diselesaikan.

## Masalah yang sedang kita pecahkan

Di halaman `/order` nanti, kategori-kategori akan ditampilkan ke buyer. Tapi **ongkir itu beda sifatnya** dari produk biasa:

|                           | Produk biasa (Sticker, Keychain)                                               | Ongkir                                                                   |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Boleh pilih berapa jenis? | Bebas, banyak jenis sekaligus (Sticker Gintoki + Sticker Shin + Keychain Zura) | **Cuma 1 pilihan** — buyer tidak mungkin pilih 2 metode ongkir sekaligus |
| Qty                       | Bisa lebih dari 1 (beli 3 stiker Gintoki)                                      | **Selalu 1** — tidak ada "beli ongkir 2x"                                |
| Cara render di UI         | Grid kartu dengan tombol qty stepper (+/-)                                     | Radio button / single-select, bukan qty stepper                          |

Jadi kode di halaman `/order` **butuh cara membedakan**: "kategori mana yang harus dirender sebagai grid-qty-stepper biasa, dan kategori mana yang harus dirender sebagai radio-single-select".

## Kenapa butuh boolean, bukan cuma lihat nama

Cara paling naif adalah kode nebak dari nama: `if (category.name === 'Ongkir')`. Tapi ini rapuh — sudah dibahas sebelumnya (typo, ganti nama, dst). Jadi solusinya: kita simpan penanda itu **eksplisit di database**, bukan ditebak dari teks.

## Jawaban langsung ke pertanyaanmu

**Kalau `isShipping = true`** pada suatu kategori → nanti di halaman `/order`, kategori itu akan dirender dengan **tampilan & logic khusus ongkir** (radio button, cuma boleh pilih 1, otomatis masuk sebagai `shipping` di cart, bukan `items`).

**Kalau `isShipping = false`** (default, untuk Sticker/Keychain/dst) → kategori itu dirender **seperti biasa**: grid produk dengan qty stepper, boleh pilih banyak jenis dan banyak qty, masuk sebagai `items` di cart.

## Soal badge "Ongkir" di halaman admin

Ini **murni untuk kamu sebagai admin**, tidak berpengaruh ke buyer sama sekali. Fungsinya cuma penanda visual supaya waktu kamu buka `/admin/categories`, kamu bisa langsung lihat sekilas "oh kategori ini yang ditandai sebagai ongkir" tanpa perlu buka form edit satu-satu untuk cek. Ini pengingat visual, terutama berguna kalau nanti kategorimu banyak dan kamu lupa mana yang sudah ditandai.

## Contoh konkret alur nanti di `/order`

```ts
// pseudo-code alur nanti
const allCategories = await listCategories(); // hasil load dari server

const productCategories = allCategories.filter(c => !c.isShipping); // Sticker, Keychain
const shippingCategory = allCategories.find(c => c.isShipping);      // Ongkir
```

```svelte
<!-- render produk biasa -->
{#each productCategories as category}
  <!-- grid + qty stepper -->
{/each}

<!-- render ongkir sebagai section terpisah -->
{#if shippingCategory}
  <h2>Pilih Pengiriman</h2>
  {#each shippingCategory.products as shippingOption}
    <label>
      <input type="radio" name="shipping" value={shippingOption.id} />
      {shippingOption.name} — Rp {shippingOption.priceInt}
    </label>
  {/each}
{/if}
```

Jadi ringkasnya: **`isShipping` adalah sinyal untuk kode**, bukan untuk buyer. Buyer tidak pernah melihat field ini — mereka cuma melihat hasilnya (bagian "Pilih Pengiriman" tampil beda dari bagian produk). **Badge di admin** cuma alat bantu visual untuk kamu, sama sekali tidak mempengaruhi behaviour sistem.

Sudah lebih jelas? Kalau iya, kita bisa lanjut pasang perubahan `+page.svelte` categories tadi, baru masuk ke halaman `/order`.
