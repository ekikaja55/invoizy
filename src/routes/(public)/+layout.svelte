<script lang="ts">
	import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
	import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import CartDrawer from '$lib/components/cart/CartDrawer.svelte';
	import { publicNavItems } from '$lib/constants';
	import { cart } from '$lib/stores/cart.svelte';
	import { resolve } from '$app/paths';
	import { ArrowRight } from '@lucide/svelte';

	let { children, data } = $props();
	const isAdmin = $derived(Boolean(data.user));

	$effect(() => {
		if (data.promoRules && Array.isArray(data.promoRules)) {
			cart.setPromoRules(data.promoRules);
		}
	});
</script>

<div
	class="drafting-grid relative min-h-screen overflow-x-clip bg-[#f2efe9] font-sans text-[#262626] transition-colors dark:bg-[#1a1825] dark:text-[#f2efe9]"
>
	{#if isAdmin && data.isMaintenanceActive}
		<aside
			class="sticky top-0 z-30 flex flex-col items-start justify-between gap-2.5 border-b-2 border-[#262626] bg-[#fef3c7] px-4 py-2.5 text-xs text-[#262626] shadow-[0_2px_0px_#262626] sm:flex-row sm:items-center sm:px-6 dark:border-[#f2efe9] dark:bg-[#78350f] dark:text-[#fef3c7]"
			aria-label="Admin Storefront Inspection Notice"
		>
			<div class="flex items-center gap-2.5">
				<span
					class="inline-flex shrink-0 items-center rounded border border-[#262626] bg-[#fea770] px-2 py-0.5 font-mono text-[10px] font-black tracking-wider uppercase text-[#262626] shadow-[1px_1px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#f59e0b] dark:text-[#1a1825]"
				>
					Mode Inspeksi Admin
				</span>
				<span class="font-sans text-xs font-semibold leading-tight">
					Toko sedang ditutup untuk pembeli umum (HTTP 503). Hanya akun admin yang dapat melihat halaman ini.
				</span>
			</div>
			<a
				href={resolve('/admin/settings')}
				class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-[#262626] bg-white px-3 py-1 font-mono text-xs font-bold text-[#262626] shadow-[1.5px_1.5px_0px_#262626] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
			>
				<span>Buka Pengaturan Toko</span>
				<ArrowRight size={13} strokeWidth={2.5} />
			</a>
		</aside>
	{/if}

	<SidebarNav items={publicNavItems} {isAdmin} contact={data.contactInfo} />
	<MobileFab items={publicNavItems} {isAdmin} contact={data.contactInfo} />

	<main class="relative w-full min-w-0 px-4 py-8 sm:px-6 lg:pr-12 lg:pl-40">
		<div class="max-w-8xl mx-auto w-full">
			{@render children()}
		</div>
	</main>

	<CartDrawer />
</div>
