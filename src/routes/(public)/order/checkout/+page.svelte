<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity';
  import { untrack } from 'svelte';
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { cart } from '$lib/stores/cart.svelte';
  import { handleFormResult } from '$lib/utils/handle-form-result';
  import { formatRupiah } from '$lib/utils/currency';
  import { ShoppingBag } from '@lucide/svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let isBusy = $state(false);

  const itemsJson = $derived(
    JSON.stringify(cart.items.map((i) => ({ productId: i.productId, qty: i.qty })))
  );
  const shippingId = $derived(cart.shipping?.productId ?? '');

  // Sinkronkan cart dengan katalog terbaru saat halaman dimuat (harga/stok bisa berubah).
  $effect(() => {
    const catalogMap = new SvelteMap<
      string,
      { name: string; price: number; trackStock: boolean; stock: number }
    >();

    for (const category of [
      ...data.productCategories,
      ...(data.shippingCategory ? [data.shippingCategory] : [])
    ]) {
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
</script>

<div class="space-y-6 pb-16">
  <h1 class="text-xl font-semibold">Checkout</h1>

  {#if cart.isEmpty}
    <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <ShoppingBag size={40} class="text-neutral-400" />
      <p class="text-sm text-neutral-500">Keranjang kamu masih kosong.</p>
      <a
        href={resolve('/order')}
        class="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
               hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
      >
        Mulai Order
      </a>
    </div>
  {:else}
    <div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-neutral-500">Ringkasan</h2>

      <ul class="mt-3 space-y-2">
        {#each cart.items as item (item.productId)}
          <li class="flex items-center justify-between text-sm">
            <span>
              {item.name}
              <span class="text-neutral-500"> × {item.qty}</span>
            </span>
            <span>{formatRupiah(item.price * item.qty)}</span>
          </li>
        {/each}

        {#if cart.shipping}
          <li
            class="flex items-center justify-between border-t border-neutral-200 pt-2 text-sm dark:border-neutral-800"
          >
            <span>Ongkir · {cart.shipping.name}</span>
            <span>{formatRupiah(cart.shipping.price)}</span>
          </li>
        {/if}

        <li
          class="flex items-center justify-between border-t border-neutral-200 pt-2 text-sm font-semibold dark:border-neutral-800"
        >
          <span>Total</span>
          <span>{formatRupiah(cart.total)}</span>
        </li>
      </ul>
    </div>

    <form
      method="POST"
      use:enhance={() => {
        isBusy = true;
        return async ({ result }) => {
          if (result.type === 'success' && typeof result.data?.orderId === 'string') {
            goto(resolve(`/order/sukses/${result.data.orderId}`));
            return;
          }
          handleFormResult(result, { failure: 'Gagal membuat pesanan.' });
          isBusy = false;
        };
      }}
      class="space-y-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="shippingId" value={shippingId} />

      <!-- Honeypot anti-bot: field tersembunyi, manusia tidak mengisinya -->
      <div class="hidden" aria-hidden="true">
        <label for="website">Website</label>
        <input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
      </div>

      <div>
        <label for="handle" class="block text-sm font-medium">Handle Sosmed</label>
        <input
          id="handle"
          name="handle"
          type="text"
          required
          placeholder="@namakamu"
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="kamu@email.com"
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>

      <div>
        <label for="note" class="block text-sm font-medium">Catatan (opsional)</label>
        <textarea
          id="note"
          name="note"
          rows="3"
          placeholder="Ukuran, warna, atau catatan lain"
          disabled={isBusy}
          class="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
                 placeholder:text-neutral-400 disabled:opacity-50
                 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isBusy}
        class="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white
               disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {isBusy ? 'Membuat pesanan...' : 'Buat Pesanan'}
      </button>
    </form>
  {/if}
</div>
