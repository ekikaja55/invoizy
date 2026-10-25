<script lang="ts">
	import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
	import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
	import CartDrawer from '$lib/components/cart/CartDrawer.svelte';
	import { publicNavItems } from '$lib/constants';
	import { cart } from '$lib/stores/cart.svelte';

	let { children, data } = $props();
	const isAdmin = $derived(Boolean(data.user));

	$effect(() => {
		if (data.promoRules && Array.isArray(data.promoRules)) {
			cart.setPromoRules(data.promoRules);
		}
	});
</script>

<div class="drafting-grid relative min-h-screen bg-[#f2efe9] font-sans text-[#262626] transition-colors dark:bg-[#1a1825] dark:text-[#f2efe9]">
	<SidebarNav items={publicNavItems} {isAdmin} contact={data.contactInfo} />
	<MobileFab items={publicNavItems} {isAdmin} contact={data.contactInfo} />
	<NavigatingOverlay />

	<main class="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:pl-72 md:pr-8">
		{@render children()}
	</main>

	<CartDrawer />
</div>

