<script lang="ts">
  import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
  import MobileFab from '$lib/components/nav/MobileFab.svelte';
  import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
  import { publicNavItems } from '$lib/constants';

  let { children,data} = $props();


</script>

<div class="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
  <SidebarNav items={publicNavItems} isAdmin={data !== null ? true : false}/>
  <MobileFab items={publicNavItems} isAdmin={data !== null ? true:false}/>
  <NavigatingOverlay />

  <main class="mx-auto max-w-3xl px-4 py-8 md:pl-24">
    {@render children()}
  </main>
</div>
