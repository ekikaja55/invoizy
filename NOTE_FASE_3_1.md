FASE 3 PART 1

Selamat, Fase 2 tuntas penuh. Fase 3 ini lebih besar dari fase-fase sebelumnya karena melibatkan state management (cart), transaksi database yang lebih kompleks, dan keamanan publik-facing (rate limit, validasi ulang). Mari dipecah supaya tidak sekaligus membanjiri.

## Urutan kerja yang aku sarankan

1. **Layout publik** — cepat, fondasi visual
2. **`cart.svelte.ts`** — state management, fondasi logic sebelum UI dibangun
3. **`/order` halaman** — render produk + interaksi cart
4. **Ongkir sebagai step terpisah** — bagian dari halaman yang sama, tapi logic beda
5. **Form data diri + submit action** — bagian paling kompleks & sensitif (validasi ulang, transaksi, rate limit)
6. **Redirect sukses**

Mari mulai dari yang paling ringan dulu.

## 1. Layout publik

```svelte
<!-- src/routes/+layout.svelte — INI ROOT LAYOUT, cek dulu isinya -->
```

Tunggu — perlu diperjelas dulu: root `+layout.svelte` kamu sekarang cuma punya `ModeWatcher` + `Toaster`, **tidak ada shell visual apapun** (sidebar dsb ada di `admin/+layout.svelte` terpisah). Jadi untuk route publik (`/`, `/order`, `/invoice/[orderId]`), mereka **otomatis tidak punya sidebar admin** karena sidebar cuma dipasang di `admin/+layout.svelte`. Artinya kita cuma perlu bikin **layout baru khusus grup rute publik** dengan header sederhana.

### Opsi struktur — pakai route group

SvelteKit punya fitur **route groups** — folder dengan nama `(namagroup)` yang tidak muncul di URL, tapi bisa punya layout sendiri. Ini pas untuk mengelompokkan `/`, `/order`, `/order/sukses/[orderId]` di bawah satu layout publik tanpa mengubah struktur URL:

```
src/routes/
├── (public)/
│   ├── +layout.svelte          ← header simpel, khusus grup ini
│   ├── +page.svelte             ← ini jadi "/"
│   ├── order/
│   │   ├── +page.server.ts
│   │   ├── +page.svelte
│   │   └── sukses/[orderId]/+page.svelte
├── admin/
│   └── ... (tetap sama)
├── invoice/
│   └── [orderId]/... (biarkan di luar group, karena invoice punya kebutuhan layout sendiri nanti di Fase 4)
├── login/
└── +layout.svelte              ← root, tetap cuma ModeWatcher + Toaster
```

### `(public)/+layout.svelte`

```svelte
<script lang="ts">
  import { resolve } from '$app/paths';

  let { children } = $props();
</script>

<div class="min-h-screen bg-white dark:bg-neutral-950">
  <header class="border-b border-neutral-200 dark:border-neutral-800">
    <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
      <a href={resolve('/')} class="font-semibold text-neutral-900 dark:text-neutral-100">
        Invoizy
      </a>
    </div>
  </header>

  <main class="mx-auto max-w-3xl px-4 py-8">
    {@render children()}
  </main>
</div>
```

Simpel dulu — cuma nama toko/brand di kiri. Nanti di Fase 6 bisa dipercantik (logo, dst), tapi struktur ini sudah cukup fungsional.

**Catatan penting:** kalau kamu **sudah punya** file `src/routes/+page.svelte` (landing lama), dan `src/routes/order/` di lokasi lama (bukan di dalam `(public)/`), itu perlu **dipindah ke dalam folder `(public)/`** supaya ikut layout ini. Kalau belum ada sama sekali, langsung buat di lokasi baru sesuai struktur di atas.

---

## 2. `cart.svelte.ts` — state management

Ini fondasi sebelum UI order dibangun. Beberapa keputusan desain:

- Cart disimpan di memori (state Svelte), **bukan** localStorage — kalau user refresh, cart hilang. Ini keputusan sadar: karena harga/stok divalidasi ulang di server saat submit, cart yang persist lintas sesi browser berisiko menampilkan harga/stok basi tanpa user sadar. Kalau nanti mau ditambah persist, itu polish opsional di Fase 6, bukan prioritas sekarang.
- Cart berisi 2 bagian: **produk terpilih** (dengan qty) dan **ongkir terpilih** (single, bukan array).

```ts
// src/lib/stores/cart.svelte.ts

export interface CartProduct {
  productId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  price: number;
  qty: number;
}

export interface CartShipping {
  productId: string;
  name: string;
  price: number;
}

function createCart() {
  let items = $state<CartProduct[]>([]);
  let shipping = $state<CartShipping | null>(null);

  function addOrUpdateItem(product: Omit<CartProduct, 'qty'>, qty: number) {
    const existingIndex = items.findIndex((i) => i.productId === product.productId);

    if (qty <= 0) {
      if (existingIndex !== -1) {
        items.splice(existingIndex, 1);
      }
      return;
    }

    if (existingIndex !== -1) {
      items[existingIndex].qty = qty;
    } else {
      items.push({ ...product, qty });
    }
  }

  function getQty(productId: string): number {
    return items.find((i) => i.productId === productId)?.qty ?? 0;
  }

  function setShipping(option: CartShipping | null) {
    shipping = option;
  }

  function clear() {
    items = [];
    shipping = null;
  }

  const subtotal = $derived(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const shippingCost = $derived(shipping?.price ?? 0);
  const total = $derived(subtotal + shippingCost);
  const itemCount = $derived(items.reduce((sum, i) => sum + i.qty, 0));
  const isEmpty = $derived(items.length === 0);

  return {
    get items() { return items; },
    get shipping() { return shipping; },
    get subtotal() { return subtotal; },
    get shippingCost() { return shippingCost; },
    get total() { return total; },
    get itemCount() { return itemCount; },
    get isEmpty() { return isEmpty; },
    addOrUpdateItem,
    getQty,
    setShipping,
    clear
  };
}

export const cart = createCart();
```

### Kenapa pola ini (bukan class biasa)

Ini pola singleton store dengan closure + getter, standar untuk Svelte 5 runes di file `.svelte.ts` (bukan komponen). `$state` dan `$derived` di sini reaktif secara global — dipakai di komponen manapun yang import `cart`, semua akan sinkron otomatis tanpa perlu context/prop drilling.

---

Ini pondasi Fase 3 bagian pertama. Sebelum aku lanjut ke halaman `/order` (yang menghubungkan `cart` dengan data produk dari server), aku mau konfirmasi satu hal penting:

**Ongkir — bentuknya produk sungguhan di kategori "Ongkir" (seperti sistem lama), atau tabel/konsep terpisah?**

Dari skema yang sudah ada, `products` tidak punya pembeda "ini ongkir vs produk biasa" — cuma dibedakan lewat **nama kategori** ("Ongkir"). Ini konsisten dengan sistem Apps Script lama kamu. Aku asumsikan tetap begitu (ongkir = produk di kategori bernama "Ongkir", UI membedakan cara render & validasi single-select berdasarkan nama kategori itu) — betul begitu?
