NOTE FASE 2 Part 2 

Lanjut ke `/admin/products`.

Bedanya dari categories: ada relasi ke kategori (dropdown select), dan dua toggle (`trackStock`, `active`). Karena `trackStock` menentukan apakah field `stock` relevan, ada sedikit logic UI tambahan (disable/hide `stock` kalau `trackStock` off).

## 1. Query helper

```ts
// src/lib/server/db/queries/product.ts

import { db } from '$lib/server/db';
import { products, categories } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { ProductInput } from '$lib/schemas/product';

export async function listProductsGroupedByCategory() {
  return db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder)],
    with: {
      products: {
        orderBy: [asc(products.sortOrder)]
      }
    }
  });
}

export async function createProduct(input: ProductInput) {
  const [row] = await db.insert(products).values(input).returning();
  return row;
}

export async function updateProduct(id: string, input: ProductInput) {
  const [row] = await db.update(products).set(input).where(eq(products.id, id)).returning();
  return row;
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}

export async function reorderProduct(id: string, direction: 'up' | 'down') {
  const product = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!product) return;

  const siblings = await db.query.products.findMany({
    where: eq(products.categoryId, product.categoryId),
    orderBy: [asc(products.sortOrder)]
  });

  const index = siblings.findIndex((p) => p.id === id);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;

  const current = siblings[index];
  const swapWith = siblings[swapIndex];

  await db.transaction(async (tx) => {
    await tx.update(products).set({ sortOrder: swapWith.sortOrder }).where(eq(products.id, current.id));
    await tx.update(products).set({ sortOrder: current.sortOrder }).where(eq(products.id, swapWith.id));
  });
}
```

Catatan penting: `reorderProduct` swap berdasarkan **saudara dalam kategori yang sama** (`where: eq(products.categoryId, product.categoryId)`), bukan semua produk global — supaya reorder di kategori "Sticker" tidak kebentur `sortOrder` produk di kategori "Keychain".

## 2. `+page.server.ts`

```ts
// src/routes/admin/products/+page.server.ts

import { fail } from '@sveltejs/kit';
import { productSchema } from '$lib/schemas/product';
import {
  listProductsGroupedByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProduct
} from '$lib/server/db/queries/product';
import { logger } from '$lib/server/logger';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const categoriesWithProducts = await listProductsGroupedByCategory();
  return { categoriesWithProducts };
};

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    priceInt: formData.get('priceInt'),
    trackStock: formData.get('trackStock') === 'on',
    stock: formData.get('stock'),
    active: formData.get('active') === 'on',
    sortOrder: formData.get('sortOrder')
  });
}

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const parsed = parseProductForm(formData);

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await createProduct(parsed.data);
      return { success: true };
    } catch (err) {
      logger.error('product.create-failed', { error: err });
      return fail(500, { error: 'Gagal menyimpan produk.' });
    }
  },

  update: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (typeof id !== 'string') {
      return fail(400, { error: 'ID produk tidak valid.' });
    }

    const parsed = parseProductForm(formData);

    if (!parsed.success) {
      return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' });
    }

    try {
      await updateProduct(id, parsed.data);
      return { success: true };
    } catch (err) {
      logger.error('product.update-failed', { error: err, productId: id });
      return fail(500, { error: 'Gagal memperbarui produk.' });
    }
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (typeof id !== 'string') {
      return fail(400, { error: 'ID produk tidak valid.' });
    }

    try {
      await deleteProduct(id);
      return { success: true };
    } catch (err) {
      logger.error('product.delete-failed', { error: err, productId: id });
      return fail(500, { error: 'Gagal menghapus produk.' });
    }
  },

  reorder: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get('id');
    const direction = formData.get('direction');

    if (typeof id !== 'string' || (direction !== 'up' && direction !== 'down')) {
      return fail(400, { error: 'Data reorder tidak valid.' });
    }

    try {
      await reorderProduct(id, direction);
      return { success: true };
    } catch (err) {
      logger.error('product.reorder-failed', { error: err, productId: id });
      return fail(500, { error: 'Gagal mengubah urutan.' });
    }
  }
};
```

Catatan penting soal checkbox: HTML checkbox **tidak mengirim value sama sekali kalau tidak dicentang** — makanya dicek `formData.get('trackStock') === 'on'` (nilai default checkbox saat dicentang), bukan cuma `Boolean(formData.get('trackStock'))` yang akan salah kalau ternyata browser kirim `'off'` di beberapa kasus edge.

## 3. `+page.svelte`

Karena strukturnya perlu group-by-kategori dan expand/collapse per kategori (supaya tidak semua produk tampil sekaligus kalau kategori banyak), aku desain dengan accordion sederhana per kategori.

```svelte
<!-- src/routes/admin/products/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { handleFormResult } from '$lib/utils/handle-form-result';
  import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
  import BusyOverlay from '$lib/components/ui/BusyOverlay.svelte';
  import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, ChevronRight } from '@lucide/svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let expandedCategoryId = $state<string | null>(
    data.categoriesWithProducts[0]?.id ?? null
  );
  let creatingInCategoryId = $state<string | null>(null);
  let editingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  let isBusy = $state(false);
  let processingId = $state<string | null>(null);

  // state lokal untuk toggle trackStock di form create/edit (mengatur visibility field stock)
  let createTrackStock = $state(false);
  let editTrackStock = $state<Record<string, boolean>>({});

  function toggleCategory(id: string) {
    expandedCategoryId = expandedCategoryId === id ? null : id;
  }

  function startCreate(categoryId: string) {
    creatingInCategoryId = categoryId;
    createTrackStock = false;
  }

  function cancelCreate() {
    creatingInCategoryId = null;
  }

  function startEdit(productId: string, currentTrackStock: boolean) {
    editingId = productId;
    editTrackStock[productId] = currentTrackStock;
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

<div class="mx-auto max-w-3xl space-y-4">
  <h1 class="text-xl font-semibold">Products</h1>

  {#if !data.categoriesWithProducts}
    <ListSkeleton rows={3} />
  {:else if data.categoriesWithProducts.length === 0}
    <p class="py-8 text-center text-sm text-neutral-500">
      Belum ada kategori. Buat kategori dulu di halaman Categories.
    </p>
  {:else}
    <div class="space-y-3">
      {#each data.categoriesWithProducts as category (category.id)}
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800">
          <button
            onclick={() => toggleCategory(category.id)}
            class="flex w-full items-center justify-between p-4 text-left"
          >
            <div class="flex items-center gap-2">
              <ChevronRight
                size={16}
                class="transition-transform {expandedCategoryId === category.id ? 'rotate-90' : ''}"
              />
              <span class="font-medium">{category.name}</span>
              <span class="text-xs text-neutral-500">({category.products.length} produk)</span>
            </div>
          </button>

          {#if expandedCategoryId === category.id}
            <div class="space-y-2 border-t border-neutral-200 p-4 dark:border-neutral-800">
              <button
                onclick={() => startCreate(category.id)}
                disabled={isBusy}
                class="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white
                       hover:bg-neutral-800 disabled:opacity-50
                       dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                <Plus size={16} />
                Produk Baru
              </button>

              {#if creatingInCategoryId === category.id}
                <form
                  method="POST"
                  action="?/create"
                  use:enhance={() => {
                    isBusy = true;
                    return async ({ result, update }) => {
                      handleFormResult(result, { success: 'Produk berhasil ditambahkan.' });
                      if (result.type === 'success') {
                        creatingInCategoryId = null;
                      }
                      await update({ reset: result.type === 'success' });
                      isBusy = false;
                    };
                  }}
                  class="space-y-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                >
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input type="hidden" name="sortOrder" value={category.products.length} />

                  <div>
                    <label for="create-name-{category.id}" class="block text-sm font-medium">Nama Produk</label>
                    <input
                      id="create-name-{category.id}"
                      name="name"
                      required
                      disabled={isBusy}
                      class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                             disabled:opacity-50
                             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <div>
                    <label for="create-price-{category.id}" class="block text-sm font-medium">Harga (Rp)</label>
                    <input
                      id="create-price-{category.id}"
                      name="priceInt"
                      type="number"
                      min="0"
                      required
                      disabled={isBusy}
                      class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                             disabled:opacity-50
                             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <label class="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="trackStock"
                      bind:checked={createTrackStock}
                      disabled={isBusy}
                    />
                    Lacak Stok
                  </label>

                  {#if createTrackStock}
                    <div>
                      <label for="create-stock-{category.id}" class="block text-sm font-medium">Stok</label>
                      <input
                        id="create-stock-{category.id}"
                        name="stock"
                        type="number"
                        min="0"
                        value="0"
                        disabled={isBusy}
                        class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                               disabled:opacity-50
                               dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  {/if}

                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="active" checked disabled={isBusy} />
                    Aktif (tampil di halaman order)
                  </label>

                  <div class="flex gap-2">
                    <button
                      type="submit"
                      disabled={isBusy}
                      class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                    >
                      {isBusy ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onclick={cancelCreate}
                      class="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              {/if}

              {#if category.products.length === 0}
                <p class="py-4 text-center text-sm text-neutral-500">Belum ada produk di kategori ini.</p>
              {:else}
                {#each category.products as product, index (product.id)}
                  <BusyOverlay active={processingId === product.id}>
                    <div class="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                      {#if editingId === product.id}
                        <form
                          method="POST"
                          action="?/update"
                          use:enhance={() => {
                            isBusy = true;
                            processingId = product.id;
                            return async ({ result, update }) => {
                              handleFormResult(result, { success: 'Produk berhasil diperbarui.' });
                              if (result.type === 'success') {
                                editingId = null;
                              }
                              await update();
                              isBusy = false;
                              processingId = null;
                            };
                          }}
                          class="space-y-3"
                        >
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="categoryId" value={category.id} />
                          <input type="hidden" name="sortOrder" value={product.sortOrder} />

                          <div>
                            <label for="edit-name-{product.id}" class="block text-sm font-medium">Nama Produk</label>
                            <input
                              id="edit-name-{product.id}"
                              name="name"
                              value={product.name}
                              required
                              disabled={isBusy}
                              class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                                     disabled:opacity-50
                                     dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                            />
                          </div>

                          <div>
                            <label for="edit-price-{product.id}" class="block text-sm font-medium">Harga (Rp)</label>
                            <input
                              id="edit-price-{product.id}"
                              name="priceInt"
                              type="number"
                              min="0"
                              value={product.priceInt}
                              required
                              disabled={isBusy}
                              class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                                     disabled:opacity-50
                                     dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                            />
                          </div>

                          <label class="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="trackStock"
                              bind:checked={editTrackStock[product.id]}
                              disabled={isBusy}
                            />
                            Lacak Stok
                          </label>

                          {#if editTrackStock[product.id]}
                            <div>
                              <label for="edit-stock-{product.id}" class="block text-sm font-medium">Stok</label>
                              <input
                                id="edit-stock-{product.id}"
                                name="stock"
                                type="number"
                                min="0"
                                value={product.stock}
                                disabled={isBusy}
                                class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                                       disabled:opacity-50
                                       dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                              />
                            </div>
                          {/if}

                          <label class="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="active" checked={product.active} disabled={isBusy} />
                            Aktif (tampil di halaman order)
                          </label>

                          <div class="flex gap-2">
                            <button
                              type="submit"
                              disabled={isBusy}
                              class="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                            >
                              {isBusy ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onclick={cancelEdit}
                              class="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      {:else}
                        <div class="flex items-center justify-between">
                          <div>
                            <p class="text-sm font-medium">
                              {product.name}
                              {#if !product.active}
                                <span class="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                                  Nonaktif
                                </span>
                              {/if}
                            </p>
                            <p class="text-xs text-neutral-500">
                              Rp {product.priceInt.toLocaleString('id-ID')}
                              {#if product.trackStock}
                                · Stok: {product.stock}
                              {/if}
                            </p>
                          </div>

                          <div class="flex items-center gap-1">
                            <form
                              method="POST"
                              action="?/reorder"
                              use:enhance={() => {
                                isBusy = true;
                                processingId = product.id;
                                return async ({ result, update }) => {
                                  handleFormResult(result, { success: 'Urutan produk berhasil diubah.' });
                                  await update();
                                  isBusy = false;
                                  processingId = null;
                                };
                              }}
                            >
                              <input type="hidden" name="id" value={product.id} />
                              <input type="hidden" name="direction" value="up" />
                              <button
                                type="submit"
                                disabled={isBusy || index === 0}
                                class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                              >
                                <ChevronUp size={16} />
                              </button>
                            </form>

                            <form
                              method="POST"
                              action="?/reorder"
                              use:enhance={() => {
                                isBusy = true;
                                processingId = product.id;
                                return async ({ result, update }) => {
                                  handleFormResult(result, { success: 'Urutan produk berhasil diubah.' });
                                  await update();
                                  isBusy = false;
                                  processingId = null;
                                };
                              }}
                            >
                              <input type="hidden" name="id" value={product.id} />
                              <input type="hidden" name="direction" value="down" />
                              <button
                                type="submit"
                                disabled={isBusy || index === category.products.length - 1}
                                class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </form>

                            <button
                              onclick={() => startEdit(product.id, product.trackStock)}
                              disabled={isBusy}
                              class="rounded p-1.5 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onclick={() => confirmDelete(product.id)}
                              disabled={isBusy}
                              class="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/20"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {#if deletingId === product.id}
                          <div class="mt-3 flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20">
                            <span>Hapus "{product.name}"?</span>
                            <div class="flex gap-2">
                              <form
                                method="POST"
                                action="?/delete"
                                use:enhance={() => {
                                  isBusy = true;
                                  processingId = product.id;
                                  return async ({ result, update }) => {
                                    handleFormResult(result, { success: 'Produk berhasil dihapus.' });
                                    if (result.type === 'success') {
                                      deletingId = null;
                                    }
                                    await update();
                                    isBusy = false;
                                    processingId = null;
                                  };
                                }}
                              >
                                <input type="hidden" name="id" value={product.id} />
                                <button
                                  type="submit"
                                  disabled={isBusy}
                                  class="rounded bg-red-600 px-3 py-1.5 text-white disabled:opacity-50"
                                >
                                  {isBusy ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                              </form>
                              <button
                                onclick={cancelDelete}
                                disabled={isBusy}
                                class="rounded border border-neutral-300 px-3 py-1.5 disabled:opacity-50 dark:border-neutral-700"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        {/if}
                      {/if}
                    </div>
                  </BusyOverlay>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
```

## Catatan penting soal `editTrackStock` (Record keyed by ID)

Karena ada banyak produk dan tiap satu bisa dalam mode edit terpisah, aku pakai `Record<string, boolean>` untuk state `trackStock` per produk (bukan satu variabel global) — supaya toggle di satu produk tidak "bocor" mempengaruhi tampilan form produk lain yang sedang di-edit bersamaan (meski jarang terjadi, tapi lebih benar secara desain state).

## Yang perlu dites

1. Buat produk baru di kategori yang di-expand, cek toggle "Lacak Stok" muncul/hilangnya field stok
2. Edit produk existing, ubah toggle trackStock, cek fieldnya muncul sesuai state
3. Reorder produk dalam satu kategori (pastikan tidak mempengaruhi kategori lain)
4. Delete produk
5. Cek `active: false` produk tetap muncul di admin (dengan badge "Nonaktif") tapi nanti harus **tidak** muncul di `/order` publik (ini logic yang perlu dipastikan pas Fase 3)

Coba jalankan, kabari hasilnya. Kalau lancar, kita bisa putuskan mau lanjut ke `/admin/settings` dulu atau langsung ke Fase 3 (order publik) sesuai rencana penyisipan yang dibahas tadi.

