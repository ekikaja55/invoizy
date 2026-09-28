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

Struktur direktorinya sudah tepat. Dua hal yang kamu angkat: ModeWatcher yang "tidak ketrigger" dan rencana sidebar + FAB untuk area publik. Kita bahas satu-satu, lalu cart dengan persist.

## 1. Kenapa ModeWatcher "tidak ketrigger"

Kode root layout kamu sudah benar, dan admin kamu sebelumnya berhasil toggle dark/light. Jadi kemungkinan besar penyebabnya bukan `ModeWatcher`, tapi **Tailwind v4 tidak mengenali class `dark`**.

`mode-watcher` bekerja dengan menambahkan class `dark` ke `<html>`. Tapi Tailwind v4 secara default memakai strategi `prefers-color-scheme` (ikut setting OS), **bukan** class. Kalau OS kamu mode terang dan default `mode-watcher` sistem-based, varian `dark:` tidak akan pernah aktif meski class `dark` sudah terpasang di `<html>`.

Cek `src/routes/app.css`. Harus ada baris ini:

```css
@import 'tailwindcss';

@custom-variant dark (&:where(.dark, .dark *));
```

Baris `@custom-variant` itu yang memberi tahu Tailwind v4: "varian `dark:` aktif kalau ada class `.dark` di elemen atau leluhurnya". Tanpa baris itu, toggle tetap jalan di sisi `mode-watcher` (class berganti di `<html>`), tapi tampilan tidak berubah sama sekali.

Cara memastikan: buka DevTools, inspect `<html>`, klik toggle tema. Kalau class `dark` muncul/hilang tapi tampilan tidak berubah, berarti `@custom-variant` yang belum ada. Kalau class-nya tidak berubah sama sekali, berarti masalahnya di `mode-watcher`, dan kabari aku.

Kalau di admin dark mode sudah jalan normal, berarti `app.css` sudah benar. Dalam kasus itu, masalahnya khusus di area `(public)`: layout-nya belum punya toggle, jadi tidak ada cara mengganti tema dari sana. Itu terselesaikan otomatis begitu kita pasang nav di bawah.

## 2. Nav publik: reuse komponen admin

`SidebarNav` dan `MobileFab` sekarang hardcode `adminNavItems` dan logout. Daripada menyalin dua komponen itu, refactor jadi **menerima props**:

- `items`: daftar menu
- `showLogout`: tampilkan logout atau tidak

Buat tipe generik di `constants.ts`:

```ts
// src/lib/constants.ts

import { LayoutDashboard, ShoppingCart, Package, FolderTree, Settings, Home, ShoppingBag } from '@lucide/svelte';
import type { Component } from 'svelte';

export type AdminRoute =
  | '/admin'
  | '/admin/orders'
  | '/admin/products'
  | '/admin/categories'
  | '/admin/settings';

export type PublicRoute = '/' | '/order';

export interface NavItem {
  label: string;
  href: AdminRoute | PublicRoute;
  icon: Component;
}

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Settings', href: '/admin/settings', icon: Settings }
];

export const publicNavItems: NavItem[] = [
  { label: 'Beranda', href: '/', icon: Home },
  { label: 'Order', href: '/order', icon: ShoppingBag }
];
```

Lalu ubah kedua komponen supaya menerima props. Untuk `SidebarNav.svelte`, bagian `<script>` jadi:

```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { NavItem } from '$lib/constants';
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import ThemeToggle from './ThemeToggle.svelte';
  import { LogOut, PanelLeftClose, PanelLeftOpen } from '@lucide/svelte';
  import { navItemClass, navActionClass } from '$lib/utils/nav-utils';

  interface Props {
    items: NavItem[];
    showLogout?: boolean;
  }

  let { items, showLogout = false }: Props = $props();

  // ...sisanya (collapsed, toggle, handleLogout) tetap sama
</script>
```

Di markup, ganti `{#each adminNavItems as item ...}` menjadi `{#each items as item ...}`, dan bungkus tombol Logout dengan `{#if showLogout}...{/if}`. Terapkan perubahan yang sama persis di `MobileFab.svelte`.

Kalau `resolve(item.href)` mengeluh soal tipe union baru, itu karena `/order` harus terdaftar sebagai route valid. Route-nya sudah ada, jadi cukup jalankan `npm run check` supaya types ter-regenerasi.

Lalu pakai di layout admin dan publik:

```svelte
<!-- admin/+layout.svelte -->
<SidebarNav items={adminNavItems} showLogout />
<MobileFab items={adminNavItems} showLogout />
```

```svelte
<!-- (public)/+layout.svelte -->
<script lang="ts">
  import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
  import MobileFab from '$lib/components/nav/MobileFab.svelte';
  import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
  import { publicNavItems } from '$lib/constants';

  let { children } = $props();
</script>

<div class="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
  <SidebarNav items={publicNavItems} />
  <MobileFab items={publicNavItems} />
  <NavigatingOverlay />

  <main class="mx-auto max-w-3xl px-4 py-8 md:pl-24">
    {@render children()}
  </main>
</div>
```

Header lama dihapus karena navigasi sekarang di sidebar/FAB. Padding kiri `md:pl-24` lebih kecil dari admin (`md:pl-64`) supaya konten publik tidak terlalu bergeser ke kanan. Nanti bisa disesuaikan di Fase 6.

Perhatikan juga `bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100` di wrapper terluar. Tanpa warna teks dasar eksplisit, teks bisa terlihat aneh saat ganti tema.

## 3. Cart dengan persist

Sekarang aku setuju dengan alasanmu: menambahkan persist di awal lebih murah daripada menyisipkannya belakangan. Aku ralat keputusanku sebelumnya (cart di memori saja). Risiko harga/stok basi tetap tidak berbahaya karena server selalu validasi ulang saat submit. Tambahannya: saat load, cart yang tersimpan dicocokkan dengan data produk terbaru dari server, dan item yang sudah tidak ada/nonaktif dibuang.

```ts
// src/lib/stores/cart.svelte.ts

import { browser } from '$app/environment';

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

const STORAGE_KEY = 'invoizy-cart-v1';

interface PersistedCart {
  items: CartProduct[];
  shipping: CartShipping | null;
}

function loadPersisted(): PersistedCart {
  if (!browser) return { items: [], shipping: null };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], shipping: null };

    const parsed = JSON.parse(raw) as PersistedCart;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      shipping: parsed.shipping ?? null
    };
  } catch {
    // data korup / format lama, abaikan dan mulai bersih
    return { items: [], shipping: null };
  }
}

function createCart() {
  const initial = loadPersisted();
  let items = $state<CartProduct[]>(initial.items);
  let shipping = $state<CartShipping | null>(initial.shipping);

  function persist() {
    if (!browser) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, shipping }));
  }

  function addOrUpdateItem(product: Omit<CartProduct, 'qty'>, qty: number) {
    const existingIndex = items.findIndex((i) => i.productId === product.productId);

    if (qty <= 0) {
      if (existingIndex !== -1) items.splice(existingIndex, 1);
    } else if (existingIndex !== -1) {
      items[existingIndex].qty = qty;
    } else {
      items.push({ ...product, qty });
    }

    persist();
  }

  function getQty(productId: string): number {
    return items.find((i) => i.productId === productId)?.qty ?? 0;
  }

  function setShipping(option: CartShipping | null) {
    shipping = option;
    persist();
  }

  /**
   * Sinkronkan cart tersimpan dengan katalog terbaru dari server:
   * - buang item yang produknya sudah dihapus / nonaktif
   * - perbarui nama & harga ke nilai terbaru
   * - kurangi qty kalau melebihi stok yang tersedia
   */
  function reconcile(
    catalog: Map<string, { name: string; price: number; trackStock: boolean; stock: number }>
  ) {
    items = items
      .map((item) => {
        const fresh = catalog.get(item.productId);
        if (!fresh) return null;

        const maxQty = fresh.trackStock ? fresh.stock : item.qty;
        const qty = Math.min(item.qty, maxQty);
        if (qty <= 0) return null;

        return { ...item, name: fresh.name, price: fresh.price, qty };
      })
      .filter((i): i is CartProduct => i !== null);

    if (shipping) {
      const fresh = catalog.get(shipping.productId);
      shipping = fresh ? { ...shipping, name: fresh.name, price: fresh.price } : null;
    }

    persist();
  }

  function clear() {
    items = [];
    shipping = null;
    persist();
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
    reconcile,
    clear
  };
}

export const cart = createCart();
```

Poin penting dari desain ini:

- **Key `invoizy-cart-v1`**: kalau suatu saat bentuk data cart berubah, naikkan jadi `v2` dan cart lama otomatis diabaikan, tanpa error.
- **`reconcile()`** dipanggil sekali di halaman `/order` begitu data produk dari server tersedia. Ini yang menutup risiko cart basi: produk yang dihapus/dinonaktifkan hilang dari cart, harga ikut harga terbaru, dan qty dipangkas kalau stok sudah berkurang.
- **`browser` guard**: `localStorage` tidak ada di server (SSR), jadi semua akses dijaga.
- **Hydration**: karena cart dibaca dari `localStorage` saat modul pertama dimuat di browser, tampilan awal di server (kosong) bisa sedikit berbeda dengan di browser. Untuk komponen yang menampilkan jumlah item, jangan andalkan nilai cart di render SSR pertama. Kita tangani di halaman `/order` nanti.

---

Urutan kerja dari sini: (1) cek `@custom-variant dark` di `app.css`, (2) refactor nav jadi props dan pasang di layout publik, (3) ganti `cart.svelte.ts` dengan versi persist ini. Setelah ketiganya beres dan `npm run check` bersih, kabari aku dan kita lanjut ke halaman `/order` yang menghubungkan semuanya.
