<script lang="ts">
	import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
	import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
	import { adminNavItems } from '$lib/constants';

	let { children, data } = $props();

	const isAdmin = $derived(Boolean(data.user));
</script>

<div class="drafting-grid min-h-screen text-neutral-900 dark:text-neutral-100">
	<SidebarNav items={adminNavItems} {isAdmin} />
	<MobileFab items={adminNavItems} {isAdmin} />
	<NavigatingOverlay />

	<main class="w-full min-w-0 px-4 py-8 sm:px-6 md:pr-8 md:pl-40 lg:pr-8 lg:pl-40">
		<div class="mx-auto w-full max-w-7xl min-w-0">
			{@render children()}
		</div>
	</main>
</div>
