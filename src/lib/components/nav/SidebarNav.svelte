<script lang="ts">
  import {page} from '$app/state'
  import {resolve} from '$app/paths'
	import { adminNavItems } from '$lib/constants';
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import {toast} from 'svelte-sonner';

  let collapsed =$state(false);

  $effect(()=>{
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) collapsed = saved === 'true';
  })

  function toggle(){
    collapsed = !collapsed;
    localStorage.setItem('sidebar-collapsed',String(collapsed))
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
  class="hidden md:flex flex-col fixed left-4 top-1/2 -translate-y-1/2 rounded-2xl border bg-black/80 text-white p-2 backdrop-blur transition-all"
  class:w-16={collapsed}
  class:w-56={!collapsed}
>
  <button onclick={toggle} class="mb-2 rounded p-2 text-left text-sm opacity-70 hover:opacity-100">
    {collapsed ? '»' : '« collapse'}
  </button>

  <nav class="flex flex-col gap-1">
    {#each adminNavItems as item (item.href)}
      <a
        href={resolve(item.href)}
        class="rounded px-2 py-2 text-sm hover:bg-white/10"
        class:bg-white={page.url.pathname === item.href}
        class:text-black={page.url.pathname === item.href}
      >
        {collapsed ? item.label[0] : item.label}
      </a>
    {/each}
  </nav>

  <div class="mt-2 border-t pt-2">
    <button onclick={handleLogout} class="w-full rounded px-2 py-2 text-left text-sm hover:bg-white/10">
      {collapsed ? '⏻' : 'Logout'}
    </button>
  </div>
</aside>
