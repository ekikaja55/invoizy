NOTE FASE 2

Setuju, Fase 1 resmi tuntas — solid fondasinya (auth, guard, shell nav, tema, toast). Sekarang ke Fase 2.

Sebelum nulis kode, ada beberapa keputusan kecil yang perlu difiksasi dulu supaya semua CRUD (categories, products, settings) konsisten satu pola sejak item pertama, bukan improvisasi beda-beda tiap halaman.

## Keputusan desain teknis Fase 2

**1. Pola form — SvelteKit form actions + `use:enhance`, bukan API route + fetch manual**
Ini defaultnya SvelteKit dan paling pas untuk CRUD admin: progressive enhancement (tetap jalan tanpa JS), validasi server-side via `fail()`, dan `use:enhance` otomatis handle submit tanpa reload penuh.

**2. Validasi — `zod` schema per resource, dipakai di server action DAN (opsional) client**
Aku akan tulis `lib/schemas/category.ts`, `product.ts`, `settings.ts` — dipakai minimal di server action untuk validasi tegas sebelum insert/update ke DB.

**3. `handleFormResult()` — bentuknya seperti apa**
Karena kita pakai form actions (bukan raw fetch), helper ini akan dipasang sebagai _callback_ di `use:enhance`, bukan wrapper fetch generik seperti draft sebelumnya. Ini bentuk yang lebih SvelteKit-native.

## Urutan kerja Fase 2

Aku sarankan urutan: **helper dulu → categories (paling simpel, tanpa dependency) → products (depends on categories) → settings (independen, tapi ada upload file)**.

---

### 1. `handleFormResult()` — revisi final sesuai pola form actions

```ts
// src/lib/utils/handle-form-result.ts

import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { ActionResult } from '@sveltejs/kit';

interface Messages {
  success?: string;
  failure?: string;
}

export function handleFormResult(result: ActionResult, messages: Messages = {}) {
  if (result.type === 'failure' && result.status === 401) {
    toast.error('Sesi kamu sudah habis. Silakan login ulang.');
    setTimeout(() => goto(resolve('/login')), 1500);
    return;
  }

  if (result.type === 'success') {
    toast.success(messages.success ?? 'Berhasil disimpan.');
    return;
  }

  if (result.type === 'failure') {
    // result.data biasanya berisi { error: string } dari fail() di server
    const serverMessage =
      typeof result.data?.error === 'string' ? result.data.error : undefined;
    toast.error(serverMessage ?? messages.failure ?? 'Gagal menyimpan data.');
    return;
  }

  if (result.type === 'error') {
    toast.error('Terjadi kesalahan tak terduga.');
  }
}
```

Pemakaian nanti di form:

```svelte
<form
  method="POST"
  use:enhance={() => {
    return async ({ result, update }) => {
      handleFormResult(result, { success: 'Kategori berhasil disimpan.' });
      await update();
    };
  }}
>
```

---

### 2. Skema Zod

```ts
// src/lib/schemas/category.ts

import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(100),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export type CategoryInput = z.infer<typeof categorySchema>;
```

```ts
// src/lib/schemas/product.ts

import { z } from 'zod';

export const productSchema = z.object({
categoryId: z.string().uuid('Kategori tidak valid'),
name: z.string().trim().min(1, 'Nama produk wajib diisi').max(150),
priceInt: z.coerce.number().int().min(0, 'Harga tidak boleh negatif'),
trackStock: z.coerce.boolean().default(false),
stock: z.coerce.number().int().min(0).default(0),
active: z.coerce.boolean().default(true),
sortOrder: z.coerce.number().int().min(0).default(0)
});

export type ProductInput = z.infer<typeof productSchema>;
```

```ts
// src/lib/schemas/settings.ts

import { z } from 'zod';

export const settingsSchema = z.object({
  storeName: z.string().trim().min(1, 'Nama toko wajib diisi').max(100),
  instagram: z.string().trim().max(100).optional().or(z.literal('')),
  twitter: z.string().trim().max(100).optional().or(z.literal('')),
  emailFromName: z.string().trim().max(100).optional().or(z.literal('')),
  bankName: z.string().trim().max(100).optional().or(z.literal('')),
  bankAccountNumber: z.string().trim().max(50).optional().or(z.literal('')),
  bankAccountHolder: z.string().trim().max(100).optional().or(z.literal('')),
  vaInfo: z.string().trim().max(255).optional().or(z.literal('')),
  paymentNote: z.string().trim().max(1000).optional().or(z.literal(''))
});

export type SettingsInput = z.infer<typeof settingsSchema>;
```

Catatan: `z.coerce` dipakai karena data dari `FormData` selalu berbentuk string, jadi perlu di-coerce ke number/boolean.

---

### 3. Query helper — `lib/server/db/queries/category.ts`

```ts
// src/lib/server/db/queries/category.ts

import { db } from '$lib/server/db';
import { categories, products } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { CategoryInput } from '$lib/schemas/category';

export async function listCategories() {
  return db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder)],
    with: { products: true }
  });
}

export async function createCategory(input: CategoryInput) {
  const [row] = await db.insert(categories).values(input).returning();
  return row;
}

export async function updateCategory(id: string, input: CategoryInput) {
  const [row] = await db
    .update(categories)
    .set(input)
    .where(eq(categories.id, id))
    .returning();
  return row;
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
}
```

---

### 4. Halaman `/admin/categories` — load + actions

```ts
// src/routes/admin/categories/+page.server.ts

import { fail } from '@sveltejs/kit';
import { categorySchema } from '$lib/schemas/category';
import { listCategories, createCategory, updateCategory, deleteCategory } from '$lib/server/db/queries/category';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const categories = await listCategories();1
  return { categories };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const parsed = categorySchema.safeParse({
      name: formData.get('name'),
      sortOrder: formData.get('sortOrder')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await createCategory(parsed.data);
      return { success: true };
    } catch (err) {
      logger.error('category.create-failed', { error: err });
      return fail(500, { error: 'Gagal menyimpan kategori.' });
    }
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (typeof id !== 'string') {
      return fail(400, { error: 'ID kategori tidak valid.' });
    }

    const parsed = categorySchema.safeParse({
      name: formData.get('name'),
      sortOrder: formData.get('sortOrder')
    });

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await updateCategory(id, parsed.data);
      return { success: true };
    } catch (err) {
      logger.error('category.update-failed', { error: err, categoryId: id });
      return fail(500, { error: 'Gagal memperbarui kategori.' });
    }
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (typeof id !== 'string') {
      return fail(400, { error: 'ID kategori tidak valid.' });
    }

    try {
      await deleteCategory(id);
      return { success: true };
    } catch (err) {
      logger.error('category.delete-failed', { error: err, categoryId: id });
      return fail(500, { error: 'Gagal menghapus kategori.' });
    }
  }
};
```

---

Sebelum aku lanjut nulis `+page.svelte` (UI list + form create/edit/delete + reorder), aku mau konfirmasi dulu **pola reorder** yang kamu mau — ini pengaruh besar ke kompleksitas UI:

1. **Tombol ↑↓ sederhana** per baris (swap `sortOrder` dengan tetangga) — cepat dibangun, cukup untuk jumlah kategori sedikit (~3-10)
2. **Drag & drop** (misal pakai library `svelte-dnd-action`) — UX lebih modern tapi nambah dependency & kompleksitas state

Mengingat kamu sebelumnya bilang "drag atau tombol up/down cukup untuk v1" di TODO awal, aku condong ke **opsi 1** dulu untuk keluar cepat dari Fase 2, drag-drop bisa jadi polish di Fase 6 kalau masih mau. Setuju opsi 1?

Sepakat. Ini lanjutan `+page.svelte` untuk `/admin/categories` — list + form create + edit + delete + reorder tombol ↑↓, semuanya pakai pola `use:enhance` + `handleFormResult()` yang sudah kita siapkan.

## `+page.svelte`

```svelte
<!-- src/routes/admin/categories/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { handleFormResult } from '$lib/utils/handle-form-result';
  import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X } from '@lucide/svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let showCreateForm = $state(false);
  let editingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  function startEdit(id: string) {
    editingId = id;
  }

  function cancelEdit() {
    editingId = null;
  }

  function confirmDelete(id: string) {
    deletingId = id;
  }

  function cancelDelete() {
    deletingId = null;
  }
</script>

<div class="mx-auto max-w-2xl space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-semibold">Categories</h1>
    <button
      onclick={() => (showCreateForm = !showCreateForm)}
      class="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white
             hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
    >
      <Plus size={16} />
      Kategori Baru
    </button>
  </div>

  {#if showCreateForm}
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        return async ({ result, update }) => {
          handleFormResult(result, { success: 'Kategori berhasil dibuat.' });
          if (result.type === 'success') {
            showCreateForm = false;
            await invalidateAll();
          }
          await update({ reset: result.type === 'success' });
        };
      }}
      class="space-y-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div>
        <label for="name" class="block text-sm font-medium">Nama Kategori</label>
        <input
          id="name"
          name="name"
          required
          class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm
                 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
      <div>
        <label for="sortOrder" class="block text-sm font-medium">Urutan</label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          value={data.categories.length}
          class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm
                 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900">
          Simpan
        </button>
        <button
          type="button"
          onclick={() => (showCreateForm = false)}
          class="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
        >
          Batal
        </button>
      </div>
    </form>
  {/if}

  <div class="space-y-2">
    {#each data.categories as category, index (category.id)}
      <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        {#if editingId === category.id}
          <form
            method="POST"
            action="?/update"
            use:enhance={() => {
              return async ({ result, update }) => {
                handleFormResult(result, { success: 'Kategori berhasil diperbarui.' });
                if (result.type === 'success') {
                  editingId = null;
                  await invalidateAll();
                }
                await update();
              };
            }}
            class="space-y-3"
          >
            <input type="hidden" name="id" value={category.id} />
            <div>
              <label for="edit-name-{category.id}" class="block text-sm font-medium">Nama Kategori</label>
              <input
                id="edit-name-{category.id}"
                name="name"
                value={category.name}
                required
                class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm
                       dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <input type="hidden" name="sortOrder" value={category.sortOrder} />
            <div class="flex gap-2">
              <button type="submit" class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900">
                Simpan
              </button>
              <button
                type="button"
                onclick={cancelEdit}
                class="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
              >
                Batal
              </button>
            </div>
          </form>
        {:else}
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">{category.name}</p>
              <p class="text-xs text-neutral-500">
                {category.products?.length ?? 0} produk
              </p>
            </div>

            <div class="flex items-center gap-1">
              <!-- Reorder up -->
              <form method="POST" action="?/reorder" use:enhance={() => {
                return async ({ result, update }) => {
                  handleFormResult(result, {});
                  if (result.type === 'success') await invalidateAll();
                  await update();
                };
              }}>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  type="submit"
                  disabled={index === 0}
                  class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                >
                  <ChevronUp size={16} />
                </button>
              </form>

              <!-- Reorder down -->
              <form method="POST" action="?/reorder" use:enhance={() => {
                return async ({ result, update }) => {
                  handleFormResult(result, {});
                  if (result.type === 'success') await invalidateAll();
                  await update();
                };
              }}>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  type="submit"
                  disabled={index === data.categories.length - 1}
                  class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                >
                  <ChevronDown size={16} />
                </button>
              </form>

              <button
                onclick={() => startEdit(category.id)}
                class="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <Pencil size={16} />
              </button>

              <button
                onclick={() => confirmDelete(category.id)}
                class="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {#if deletingId === category.id}
            <div class="mt-3 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">
              <span>Hapus "{category.name}"? Produk di dalamnya juga akan terhapus.</span>
              <div class="flex gap-2">
                <form
                  method="POST"
                  action="?/delete"
                  use:enhance={() => {
                    return async ({ result, update }) => {
                      handleFormResult(result, { success: 'Kategori berhasil dihapus.' });
                      if (result.type === 'success') {
                        deletingId = null;
                        await invalidateAll();
                      }
                      await update();
                    };
                  }}
                >
                  <input type="hidden" name="id" value={category.id} />
                  <button type="submit" class="rounded bg-red-600 px-3 py-1.5 text-white">
                    Ya, Hapus
                  </button>
                </form>
                <button onclick={cancelDelete} class="rounded border border-neutral-300 px-3 py-1.5 dark:border-neutral-700">
                  <X size={14} />
                </button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    {:else}
      <p class="py-8 text-center text-sm text-neutral-500">
        Belum ada kategori. Buat kategori pertama kamu.
      </p>
    {/each}
  </div>
</div>
```

## Tambahan action `reorder` di `+page.server.ts`

```ts
// tambahkan di src/lib/server/db/queries/category.ts

export async function reorderCategory(id: string, direction: 'up' | 'down') {
  const all = await db.query.categories.findMany({ orderBy: [asc(categories.sortOrder)] });
  const index = all.findIndex((c) => c.id === id);

  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swapWith = all[swapIndex];

  await db.transaction(async (tx) => {
    await tx.update(categories).set({ sortOrder: swapWith.sortOrder }).where(eq(categories.id, current.id));
    await tx.update(categories).set({ sortOrder: current.sortOrder }).where(eq(categories.id, swapWith.id));
  });
}
```

```ts
// tambahkan action di src/routes/admin/categories/+page.server.ts

import { reorderCategory } from '$lib/server/db/queries/category';

// ...di dalam `actions`:

reorder: async ({ request }) => {
  const formData = await request.formData();
  const id = formData.get('id');
  const direction = formData.get('direction');

  if (typeof id !== 'string' || (direction !== 'up' && direction !== 'down')) {
    return fail(400, { error: 'Data reorder tidak valid.' });
  }

  try {
    await reorderCategory(id, direction);
    return { success: true };
  } catch (err) {
    logger.error('category.reorder-failed', { error: err, categoryId: id });
    return fail(500, { error: 'Gagal mengubah urutan.' });
  }
}
```

### Catatan penting soal `reorder`

Ada **race condition kecil kalau ada dua sortOrder yang kebetulan sama** (misal dari seed data yang belum unik) — swap berbasis `sortOrder` value assumsikan tiap baris punya `sortOrder` unik dan berurutan. Karena seed data kita sudah pakai `sortOrder: 1, 2, 3` yang unik per kategori, ini aman untuk sekarang. Kalau nanti ada bug "klik naik tidak ada efek", kemungkinan ada dua kategori dengan `sortOrder` sama — tinggal di-reset manual lewat Studio.

---

Coba pasang halaman ini, tes create/edit/delete/reorder satu-satu. Setelah categories jalan mulus, kita lanjut ke `/admin/products` yang strukturnya mirip tapi dengan tambahan relasi ke kategori (dropdown select) dan toggle `trackStock`/`active`.


Dua isu berbeda, mari dibedah:

## 1. "Page error 200 lalu flash" — ini bukan error sungguhan, tapi kurangnya loading state

Ini penjelasannya: setiap kali form submit lewat `use:enhance`, di baliknya SvelteKit kirim request ke server action, tunggu response, **lalu jalankan `update()`/`invalidateAll()`** yang bikin `load()` jalan ulang dan data baru di-fetch. Selama proses ini (submit → response → refetch → re-render), **tidak ada indikator visual apapun** — makanya kelihatan seperti "flash" aneh, padahal itu cuma jeda network yang tidak diberi feedback.

"Page error 200" yang kamu lihat kemungkinan itu bukan error page sungguhan, tapi **DevTools/Network tab** menunjukkan request selesai dengan status 200 sekilas sebelum UI update — bukan bug, tapi memang butuh loading state supaya user tidak bingung.

## 2. Solusi — 3 lapis feedback

**a) Loading state per-form (submitting state)**
**b) Disable interaksi lain saat ada submit berjalan**
**c) Toast "Menyimpan..." via `toast.promise` (sudah pernah dibahas, sekarang diterapkan di sini)**

Untuk (c), masalahnya `use:enhance` callback tidak otomatis expose Promise yang bisa dikasih ke `toast.promise` — jadi kita perlu pendekatan berbeda: state `isSubmitting` per form + toast dipicu manual di titik mulai/selesai.

## Revisi pola — helper form dengan loading state terintegrasi

```ts
// src/lib/utils/handle-form-result.ts

import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { ActionResult } from '@sveltejs/kit';

interface Messages {
  success?: string;
  failure?: string;
}

export function handleFormResult(result: ActionResult, messages: Messages = {}) {
  if (result.type === 'failure' && result.status === 401) {
    toast.error('Sesi kamu sudah habis. Silakan login ulang.');
    setTimeout(() => goto(resolve('/login')), 1500);
    return;
  }

  if (result.type === 'success') {
    toast.success(messages.success ?? 'Berhasil disimpan.');
    return;
  }

  if (result.type === 'failure') {
    const serverMessage = typeof result.data?.error === 'string' ? result.data.error : undefined;
    toast.error(serverMessage ?? messages.failure ?? 'Gagal menyimpan data.');
    return;
  }

  if (result.type === 'error') {
    toast.error('Terjadi kesalahan tak terduga.');
  }
}
```

Ini tetap sama seperti sebelumnya — yang berubah adalah **cara pakainya di komponen**, sekarang ditambah `isSubmitting` state:

```svelte
<script lang="ts">
  let isSubmitting = $state(false);
</script>

<form
  method="POST"
  action="?/create"
  use:enhance={() => {
    isSubmitting = true;
    return async ({ result, update }) => {
      handleFormResult(result, { success: 'Kategori berhasil dibuat.' });
      if (result.type === 'success') {
        showCreateForm = false;
        await invalidateAll();
      }
      await update({ reset: result.type === 'success' });
      isSubmitting = false;
    };
  }}
>
  <!-- fields -->
  <button type="submit" disabled={isSubmitting} class="... disabled:opacity-50">
    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
  </button>
</form>
```

Ini pola yang **perlu diterapkan di setiap form** (create, edit, delete, reorder). Supaya tidak menulis ulang `isSubmitting` di setiap form manual, aku sarankan bikin komponen kecil pembungkus tombol submit — tapi untuk sekarang, cara paling cepat adalah tambahkan `isSubmitting` per section (create/edit/delete masing-masing punya sendiri, karena bisa saja user edit kategori A sementara hapus kategori B secara "hampir bersamaan" — walau jarang, baiknya state-nya terpisah).

## 3. Skeleton loading untuk keseluruhan halaman saat refetch

Untuk **transisi refetch data** (bukan submit form itu sendiri, tapi proses `invalidateAll()` menunggu `load()` baru selesai), SvelteKit punya `navigating` dari `$app/state` yang bisa dipakai untuk overlay/skeleton global:

```svelte
<!-- tambahkan di +page.svelte, di bagian atas -->
<script lang="ts">
  import { navigating } from '$app/state';
</script>

{#if navigating.current}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-black/50">
    <div class="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-t-white"></div>
  </div>
{/if}
```

Ini overlay tipis yang muncul otomatis kapanpun ada navigasi/invalidasi sedang berjalan — cukup dipasang sekali di layout admin (`admin/+layout.svelte`) supaya berlaku di semua halaman CRUD tanpa perlu diulang tiap file.

## 4. Warning "jangan refresh" — sebenarnya tidak perlu

Ini poin penting: **form actions SvelteKit itu idempotent terhadap refresh** — kalau user refresh di tengah proses, browser paling akan re-submit form terakhir (kalau memang sedang di state submitting) atau cuma reload halaman biasa (kalau sudah selesai). Tidak ada risiko data corrupt/dobel selama actions di server ditulis benar (yang sudah kita lakukan — pakai `fail()` untuk validasi, transaksi untuk reorder). Jadi **tidak perlu pesan "jangan refresh"** — cukup pastikan loading state jelas supaya user secara natural tidak merasa perlu refresh karena mengira "nge-hang".

## 5. Input tidak kelihatan di tema terang

Ini murni CSS — kemungkinan besar karena `<input>` tidak punya `text-neutral-900` eksplisit, jadi warisan warna teks dari elemen induk (yang mungkin `text-white` dari card container yang sialnya belum kena dark: pairing dengan benar) bisa bikin teks putih di atas input putih. Perbaikan:

```svelte
<input
  class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
         placeholder:text-neutral-400
         dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
/>
```

Kuncinya: **setiap `<input>` butuh `text-*` dan `bg-*` eksplisit sendiri**, tidak boleh mengandalkan warisan dari parent — karena kalau parent-nya berubah warna (tema), tapi input tidak declare warnanya sendiri, browser bisa pakai default (`black` di light, kadang jadi salah kalau ada override lain).

Terapkan pola `bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100` ini ke **semua** `<input>` di form create dan edit yang sudah ada.

---

## Ringkasan aksi

1. **Tambah `isSubmitting` state** ke setiap form (create/edit/delete/reorder) — disable tombol + ganti teks jadi "Menyimpan..." saat proses berjalan
2. **Tambah overlay `navigating`** di `admin/+layout.svelte` — spinner ringan muncul otomatis saat ada invalidasi/navigasi
3. **Fix warna input** — tambahkan `bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100` eksplisit ke semua elemen `<input>`
4. **Tidak perlu warning "jangan refresh"** — form actions SvelteKit sudah aman terhadap refresh

Mau aku tulis ulang full `+page.svelte` categories dengan semua perbaikan ini terintegrasi (bukan potongan terpisah), supaya kamu tinggal copy-paste sekali jadi?

Setuju, ini pola yang bakal dipakai berulang. Aku pecah jadi komponen dengan sedikit fleksibilitas (props untuk ukuran/pesan) supaya gampang di-adjust nanti tanpa bongkar tiap tempat pakai.

## `NavigatingOverlay.svelte`

```svelte
<!-- src/lib/components/ui/NavigatingOverlay.svelte -->
<script lang="ts">
  import { navigating } from '$app/state';

  interface Props {
    message?: string;
  }

  let { message }: Props = $props();
</script>

{#if navigating.current}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center
           bg-white/50 backdrop-blur-sm
           dark:bg-black/50"
  >
    <div class="flex flex-col items-center gap-3">
      <div
        class="h-8 w-8 animate-spin rounded-full border-2
               border-neutral-300 border-t-neutral-900
               dark:border-neutral-700 dark:border-t-white"
      ></div>
      {#if message}
        <p class="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
      {/if}
    </div>
  </div>
{/if}
```

## Pemakaian — pasang sekali di shell admin

```svelte
<!-- src/routes/admin/+layout.svelte -->
<script lang="ts">
  import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
  import MobileFab from '$lib/components/nav/MobileFab.svelte';
  import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';

  let { children } = $props();
</script>

<div class="min-h-screen">
  <SidebarNav />
  <MobileFab />
  <NavigatingOverlay />

  <main class="px-4 py-8 md:pl-64">
    {@render children()}
  </main>
</div>
```

Dengan dipasang di layout (bukan di tiap `+page.svelte`), overlay ini otomatis berlaku untuk **semua** halaman admin tanpa perlu diulang-ulang, dan konsisten mengikuti setiap `invalidateAll()`/navigasi yang terjadi di mana pun dalam `/admin/*`.

### Kalau nanti mau pesan kontekstual

Karena `message` opsional, bisa dipakai default (tanpa teks, cuma spinner) atau nanti kalau mau lebih spesifik per section, tinggal:
```svelte
<NavigatingOverlay message="Memuat data..." />
```

Untuk sekarang cukup dipasang tanpa `message` (spinner polos) di layout — kalau nanti kerasa perlu teks kontekstual berbeda per halaman, gampang di-extend tanpa ubah struktur komponennya.

---

Silakan pasang, lalu lanjut ke perbaikan `isSubmitting` per form dan fix warna input yang sudah dibahas sebelumnya. Kabari kalau sudah beres semua, baru kita lanjut ke `/admin/products`.