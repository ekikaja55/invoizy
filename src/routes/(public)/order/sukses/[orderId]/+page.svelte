<script lang="ts">
  import { cart } from '$lib/stores/cart.svelte';
  import { untrack } from 'svelte';
  import { resolve } from '$app/paths';
  import { CheckCircle2 } from '@lucide/svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Order sukses dibuat → kosongkan keranjang (sekali, saat halaman dimuat).
  $effect(() => {
    untrack(() => cart.clear());
  });
</script>

<div class="flex flex-col items-center justify-center py-16 text-center">
  <CheckCircle2 size={48} class="text-green-600 dark:text-green-400" />
  <h1 class="mt-4 text-2xl font-semibold">Pesanan berhasil dibuat!</h1>
  <p class="mt-2 text-sm text-neutral-500">
    ID pesanan kamu:
    <span class="font-mono font-semibold text-neutral-900 dark:text-neutral-100">{data.orderId}</span>
  </p>
  <p class="mt-1 text-sm text-neutral-500">
    Invoice akan dikirim ke email kamu. Simpan ID pesanan untuk memudahkan konfirmasi.
  </p>
  <a
    href={resolve('/order')}
    class="mt-6 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
           hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
  >
    Kembali ke Order
  </a>
</div>
