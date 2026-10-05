<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { untrack } from 'svelte';
  import { cart } from '$lib/stores/cart.svelte';
  import { resolve } from '$app/paths';
  import { Minus, Plus } from '@lucide/svelte';
  import { formatRupiah } from '$lib/utils/currency';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // sinkronkan cart tersimpan dengan katalog terbaru sekali saat halaman dimuat
  $effect(() => {
    const catalogMap = new SvelteMap<
      string,
      { name: string; price: number; trackStock: boolean; stock: number }
    >();

    for (const category of [...data.productCategories, ...(data.shippingCategory ? [data.shippingCategory] : [])]) {
      for (const product of category.products) {
        catalogMap.set(product.id, {
          name: product.name,
          price: product.priceInt,
          trackStock: product.trackStock,
          stock: product.stock
        });
      }
    }

    untrack(() => cart.reconcile(catalogMap));
  });

  function handleQtyChange(
    product: { id: string; categoryId: string; name: string; priceInt: number; trackStock: boolean; stock: number },
    categoryName: string,
    delta: number
  ) {
    const currentQty = cart.getQty(product.id);
    const maxQty = product.trackStock ? product.stock : Infinity;
    const newQty = Math.min(Math.max(currentQty + delta, 0), maxQty);

    cart.addOrUpdateItem(
      {
        productId: product.id,
        categoryId: product.categoryId,
        categoryName,
        name: product.name,
        price: product.priceInt
      },
      newQty
    );
  }

  function handleShippingSelect(product: { id: string; name: string; priceInt: number }) {
    cart.setShipping({ productId: product.id, name: product.name, price: product.priceInt });
  }
</script>

<div class="space-y-8 pb-32">
  <h1 class="text-xl font-semibold">Order</h1>

  {#each data.productCategories as category (category.id)}
    <section class="space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {category.name}
      </h2>

      <div class="grid gap-3 sm:grid-cols-2">
        {#each category.products as product (product.id)}
          {@const qty = cart.getQty(product.id)}
          {@const outOfStock = product.trackStock && product.stock <= 0}

          <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p class="font-medium">{product.name}</p>
            <p class="text-sm text-neutral-500">{formatRupiah(product.priceInt)}</p>

            {#if product.trackStock}
              <p class="mt-1 text-xs text-neutral-400">
                {outOfStock ? 'Stok habis' : `Stok: ${product.stock}`}
              </p>
            {/if}

            <div class="mt-3 flex items-center gap-3">
              <button
                onclick={() => handleQtyChange(product, category.name, -1)}
                disabled={qty === 0}
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300
                       disabled:opacity-30 dark:border-neutral-700"
              >
                <Minus size={14} />
              </button>
              <span class="w-6 text-center text-sm font-medium">{qty}</span>
              <button
                onclick={() => handleQtyChange(product, category.name, 1)}
                disabled={outOfStock || (product.trackStock && qty >= product.stock)}
                class="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300
                       disabled:opacity-30 dark:border-neutral-700"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/each}

  {#if data.shippingCategory}
    <section class="space-y-3">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {data.shippingCategory.name}
      </h2>

      <div class="space-y-2">
        {#each data.shippingCategory.products as product (product.id)}
          <label
            class="flex cursor-pointer items-center justify-between rounded-xl border border-neutral-200 p-4
                   dark:border-neutral-800"
          >
            <div class="flex items-center gap-3">
              <input
                type="radio"
                name="shipping"
                checked={cart.shipping?.productId === product.id}
                onchange={() => handleShippingSelect(product)}
              />
              <span>{product.name}</span>
            </div>
            <span class="text-sm text-neutral-500">{formatRupiah(product.priceInt)}</span>
          </label>
        {/each}
      </div>
    </section>
  {/if}

  {#if !cart.isEmpty}
    <div
      class="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 p-4 backdrop-blur
             dark:border-neutral-800 dark:bg-neutral-950/95"
    >
      <div class="mx-auto flex max-w-3xl items-center justify-between md:pl-24">
        <div>
          <p class="text-sm text-neutral-500">{cart.itemCount} item</p>
          <p class="font-semibold">{formatRupiah(cart.total)}</p>
        </div>
        <a
          href={resolve('/order/checkout')}
          class="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
                 dark:bg-white dark:text-neutral-900"
        >
          Lanjut ke Checkout
        </a>
      </div>
    </div>
  {/if}
</div>
