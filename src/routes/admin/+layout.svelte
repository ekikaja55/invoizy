<script lang="ts">
  import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
  import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
	import { adminNavItems } from '$lib/constants';

  let { children,data } = $props();
</script>

<div class="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
  <SidebarNav items={adminNavItems} isAdmin={data !== null ? true : false} />
  <MobileFab items={adminNavItems} isAdmin={data !== null ? true:false}/>
  <NavigatingOverlay />

  <main class="px-4 py-8 md:pl-64">
    {@render children()}
  </main>
</div>
