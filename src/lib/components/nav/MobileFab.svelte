<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { authClient } from '$lib/auth-client';
  import { adminNavItems } from '$lib/constants';
  import { toast } from 'svelte-sonner';
  import ThemeToggle from './ThemeToggle.svelte';
  import { LogOut, Menu, X } from '@lucide/svelte';
	import { navItemClass } from '$lib/utils/nav-utils';

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
    <div
      class="mb-2 w-48 rounded-xl border border-neutral-200 bg-white/95 text-neutral-900 shadow-xl
             dark:border-neutral-800 dark:bg-neutral-900/95 dark:text-neutral-100
             p-2 backdrop-blur"
    >
      <nav class="flex flex-col gap-1">
        {#each adminNavItems as item (item.href)}
          {@const isActive = page.url.pathname === item.href}
          <a href={resolve(item.href)} class={navItemClass(isActive)}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </a>
        {/each}
      </nav>

      <div class="mt-1 border-t border-neutral-200 pt-1 dark:border-neutral-800">
        <ThemeToggle />

        <button
          onclick={handleLogout}
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-600
                 hover:bg-neutral-100 hover:text-neutral-900
                 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  {/if}

  <button
    onclick={() => (open = !open)}
    class="flex h-12 w-12 items-center justify-center rounded-full
           bg-neutral-900 text-white shadow-xl
           dark:bg-white dark:text-neutral-900"
    aria-label={open ? 'Close menu' : 'Open menu'}
  >
    {#if open}
      <X size={20} />
    {:else}
      <Menu size={20} />
    {/if}
  </button>
</div>

{#if open}
  <button
    class="md:hidden fixed inset-0 z-40 cursor-default bg-black/20 backdrop-blur-[2px]
           dark:bg-black/40"
    onclick={close}
    aria-label="Close menu overlay"
  ></button>
{/if}
