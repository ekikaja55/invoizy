<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { type NavItem } from '$lib/constants';
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import ThemeToggle from './ThemeToggle.svelte';
  import { Home, LogOut, PanelLeftClose, PanelLeftOpen, LayoutDashboard } from '@lucide/svelte';
  import { navActionClass, navItemClass } from '$lib/utils/nav-utils';
	import { navigateTo } from '$lib/utils/navigating';

  interface Props {
    items: NavItem[];
    isAdmin?: boolean;
  }

  // 1. Ambil props utuh agar tetap reaktif
  let props: Props = $props();

  // 2. Gunakan $derived untuk mengakses props dan state URL
  let items = $derived(props.items);
  let isAdmin = $derived(props.isAdmin ?? false);
  let currentPath = $derived(page.url.pathname);
  let isAdminPage = $derived(currentPath.startsWith('/admin'));

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
    navigateTo("/")
  }
</script>

<aside
  class="fixed left-4 top-1/2 hidden -translate-y-1/2 flex-col rounded-2xl border
         border-neutral-200 bg-white/95 p-2 text-neutral-900 shadow-xl shadow-neutral-900/5
         backdrop-blur transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-900/95
         dark:text-neutral-100 dark:shadow-black/40 md:flex"
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
    <!-- Menggunakan index atau kombinasi path untuk murni merefresh render ikon -->
    {#each items as item (item.href)}
      {@const isActive = currentPath === item.href}
      <a href={resolve(item.href)} class={navItemClass(isActive)}>
        <!-- Render komponen ikon dari Lucide -->
        <item.icon size={16} />
        {#if !collapsed}
          <span>{item.label}</span>
        {/if}
      </a>
    {/each}
  </nav>

  <div class="mt-2 space-y-1 border-t border-neutral-200 pt-2 dark:border-neutral-800">
    <ThemeToggle {collapsed} />

    {#if isAdmin}
      {#if isAdminPage}
        <button onclick={() => navigateTo("/")} class={navActionClass()}>
          <Home size={16} />
          {#if !collapsed}
            <span>Home</span>
          {/if}
        </button>
      {:else}
        <button onclick={() => navigateTo("/admin")} class={navActionClass()}>
          <LayoutDashboard size={16} />
          {#if !collapsed}
            <span>Dashboard</span>
          {/if}
        </button>
      {/if}

      <button onclick={handleLogout} class={navActionClass()}>
        <LogOut size={16} />
        {#if !collapsed}
          <span>Logout</span>
        {/if}
      </button>
    {/if}
  </div>
</aside>
