<script lang="ts">
	import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
	import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
	import { adminNavItems } from '$lib/constants';

	let { children, data } = $props();

	const isAdmin = $derived(Boolean(data.user));
</script>

<div class="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
	<SidebarNav items={adminNavItems} {isAdmin} />
	<MobileFab items={adminNavItems} {isAdmin} />
	<NavigatingOverlay />

	<main class="min-w-0 w-full px-4 py-8 sm:px-6 md:pl-72 md:pr-8 lg:pl-72 lg:pr-8">
		<div class="mx-auto w-full max-w-7xl min-w-0">
			{@render children()}
		</div>
	</main>
</div>
