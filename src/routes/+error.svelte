<script lang="ts">
	import { resolve } from '$app/paths';
  import { page } from '$app/state';

  const messages: Record<number, string> = {
    404: 'Halaman tidak ditemukan.',
    403: 'Kamu tidak punya akses ke halaman ini.',
    500: 'Terjadi kesalahan pada server.'
  };
</script>

<div class="flex min-h-screen items-center justify-center px-4">
  <div class="text-center">
    <p class="text-6xl font-bold opacity-20">{page.status}</p>
    <h1 class="mt-4 text-xl font-semibold">
      {messages[page.status] ?? 'Terjadi kesalahan.'}
    </h1>
    {#if page.error?.message}
      <p class="mt-2 text-sm opacity-70">{page.error.message}</p>
    {/if}
    <a href={resolve('/')} class="mt-6 inline-block rounded bg-white px-4 py-2 text-sm text-black">
      Kembali ke Beranda
    </a>
  </div>
</div>
