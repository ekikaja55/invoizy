<script lang="ts">
	import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
	import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import NavigatingOverlay from '$lib/components/ui/NavigatingOverlay.svelte';
	import { adminNavItems } from '$lib/constants';
	import { ArrowUp } from '@lucide/svelte';

	let { children, data } = $props();
	let showBackToTop = $state(false);

	const isAdmin = $derived(Boolean(data.user));
</script>

<svelte:window
	onscroll={() => {
		showBackToTop = window.scrollY > 400;
	}}
/>

<div class="drafting-grid min-h-screen text-neutral-900 dark:text-neutral-100">
	<SidebarNav items={adminNavItems} {isAdmin} />
	<MobileFab items={adminNavItems} {isAdmin} />
	<NavigatingOverlay />

	<main class="w-full min-w-0 px-4 py-8 sm:px-6 lg:pr-8 lg:pl-40">
		<div class="mx-auto w-full max-w-7xl min-w-0">
			{@render children()}
		</div>
	</main>

	{#if showBackToTop}
		<button
			type="button"
			onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
			class="fixed right-4 bottom-20 z-40 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#262626] bg-[#fea770] text-[#262626] shadow-[3px_3px_0px_#262626] transition-transform hover:-translate-y-1 active:translate-y-0 active:shadow-none lg:right-6 lg:bottom-6 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[3px_3px_0px_#f2efe9] dark:hover:bg-[#1a1825]"
			aria-label="Kembali ke atas"
			title="Kembali ke atas"
		>
			<ArrowUp size={20} strokeWidth={2.5} />
		</button>
	{/if}
</div>
