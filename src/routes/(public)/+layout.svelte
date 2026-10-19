<script lang="ts">
	import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
	import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
	import CartDrawer from '$lib/components/cart/CartDrawer.svelte';
	import SketchBackground from '$lib/components/ui/SketchBackground.svelte';
	import { publicNavItems } from '$lib/constants';

	let { children, data } = $props();
	const isAdmin = $derived(Boolean(data.user));
</script>

<div class="relative min-h-screen bg-papaya font-sans text-ink transition-colors dark:bg-ink dark:text-papaya">
	<SketchBackground />
	<SidebarNav items={publicNavItems} {isAdmin} contact={data.contactInfo} />
	<MobileFab items={publicNavItems} {isAdmin} contact={data.contactInfo} />
	<NavigatingOverlay />

	<main class="relative z-10 mx-auto max-w-3xl px-4 py-8 md:pl-24">
		{@render children()}
	</main>

	<CartDrawer />
</div>

