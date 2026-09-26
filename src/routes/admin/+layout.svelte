<script lang="ts">
  import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
  import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';

  let { children } = $props();
</script>

<div class="min-h-screen">
  <SidebarNav />
  <MobileFab />
  <NavigatingOverlay />

  <main class="px-4 py-8 md:pl-64">
    {@render children()}
  </main>
</div>
