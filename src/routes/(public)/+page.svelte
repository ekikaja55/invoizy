<script>
  import { resolve } from "$app/paths";
  let {data} = $props();
  const isLogin = $derived(Boolean(data.user));

</script>

<div class="flex min-h-screen flex-col items-center justify-center p-4 text-center">
  <div class="max-w-md space-y-4">
    <h1 class="text-6xl font-bold leading-tight tracking-widest">
      INVOIZY
    </h1>

    <p class="text-base font-semibold leading-relaxed tracking-wide">
      Masih Testing login, klik tombol di bawah ini (nanti bakal dihapus tombol loginnya)
    </p>

    <div class="pt-2">
      {#if !isLogin}
        <a
          href={resolve("/login")}
          class="inline-block rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-zinc-700 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Login
        </a>
      {/if}
    </div>
  </div>
</div>
