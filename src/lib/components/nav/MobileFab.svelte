<script lang="ts">
	import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { adminNavItems } from '$lib/constants';
	import {toast} from 'svelte-sonner';

  let open = $state(false);

  function close() {
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  async function handleLogout() {
    const signOutPromise = authClient.signOut();
    
    toast.promise(signOutPromise, {
      loading: 'Logout, harap tunggu...',
      success: 'Berhasil logout!',
      error: 'Gagal logout, coba lagi.'
    });

    await signOutPromise;
    goto(resolve('/login'));
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="md:hidden fixed bottom-4 right-4 z-50">
  {#if open}
    <div class="mb-2 w-48 rounded-xl border bg-black/90 text-white p-2 backdrop-blur">
      <nav class="flex flex-col gap-1">
        {#each adminNavItems as item (item.href)}
          <a
            href={resolve(item.href)}
            onclick={close}
            class="rounded px-3 py-2 text-sm hover:bg-white/10"
            class:bg-white={page.url.pathname === item.href}
            class:text-black={page.url.pathname === item.href}
          >
            {item.label}
          </a>
        {/each}
      </nav>
      <button onclick={handleLogout} class="w-full rounded px-2 py-2 text-left text-sm hover:bg-white/10">
        {open ? '⏻' : 'Logout'}
      </button>
    </div>
  {/if}

  <button
    onclick={() => (open = !open)}
    class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg"
    aria-label={open ? 'Close menu' : 'Open menu'}
  >
    {open ? '✕' : '☰'}
  </button>
</div>

{#if open}
  <button
    class="md:hidden fixed inset-0 z-40 cursor-default"
    onclick={close}
    aria-label="Close menu overlay"
  ></button>
{/if}
