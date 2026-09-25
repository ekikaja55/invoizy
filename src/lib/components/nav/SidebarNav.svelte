<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { adminNavItems } from '$lib/constants';
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import ThemeToggle from './ThemeToggle.svelte';
  import { LogOut, PanelLeftClose, PanelLeftOpen } from '@lucide/svelte';
	import { navActionClass, navItemClass } from '$lib/utils/nav-utils';

  let collapsed = $state(false);

  $effect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) collapsed = saved === 'true';
  });

  function toggle() {
    collapsed = !collapsed;
    localStorage.setItem('sidebar-collapsed', String(collapsed));
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

<aside
  class="hidden md:flex flex-col fixed left-4 top-1/2 -translate-y-1/2 rounded-2xl border
         border-neutral-200 bg-white/95 text-neutral-900 shadow-xl shadow-neutral-900/5
         dark:border-neutral-800 dark:bg-neutral-900/95 dark:text-neutral-100 dark:shadow-black/40
         p-2 backdrop-blur transition-all duration-200"
  class:w-16={collapsed}
  class:w-56={!collapsed}
>
  <button onclick={toggle} class={navActionClass()}>
    {#if collapsed}
      <PanelLeftOpen size={16} />
    {:else}
      <PanelLeftClose size={16} />
    {/if}
  </button>

  <nav class="flex flex-col gap-1">
    {#each adminNavItems as item (item.href)}
      {@const isActive = page.url.pathname === item.href}
      <a href={resolve(item.href)} class={navItemClass(isActive)}>
        <item.icon size={16} />
        {#if !collapsed}
          <span>{item.label}</span>
        {/if}
      </a>
    {/each}
  </nav>

  <div class="mt-2 space-y-1 border-t border-neutral-200 pt-2 dark:border-neutral-800">
    <ThemeToggle {collapsed} />

    <button onclick={handleLogout} class={navActionClass()}>
      <LogOut size={16} />
      {#if !collapsed}
        <span>Logout</span>
      {/if}
    </button>
  </div>
</aside>
