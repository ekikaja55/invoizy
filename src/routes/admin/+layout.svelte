<script lang="ts">
	import SidebarNav from '$lib/components/nav/SidebarNav.svelte';
	import MobileFab from '$lib/components/nav/MobileFab.svelte';
	import { adminNavItems } from '$lib/constants';
	import { ArrowUp, AlertTriangle, ArrowRight, Loader2 } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { children, data } = $props();
	let showBackToTop = $state(false);
	let isUnblocking = $state(false);

	const isAdmin = $derived(Boolean(data.user));
	let unblockedOptimistically = $state(false);
	const isMaintenanceActive = $derived(
		unblockedOptimistically ? false : Boolean(data.isMaintenanceActive)
	);

	async function handleQuickReopenStore() {
		if (isUnblocking) return;
		isUnblocking = true;

		try {
			const res = await fetch('/api/admin/maintenance', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ active: false })
			});
			const payload = await res.json().catch(() => null);

			if (res.ok && payload?.success) {
				unblockedOptimistically = true;
				toast.success('Mode pemeliharaan dinonaktifkan. Toko dibuka kembali untuk publik.');
				await invalidateAll();
				unblockedOptimistically = false;
			} else {
				const errMsg = payload?.message || 'Gagal membuka kembali toko.';
				toast.error(errMsg);
			}
		} catch {
			toast.error('Terjadi kesalahan jaringan.');
		} finally {
			isUnblocking = false;
		}
	}
</script>

<svelte:window
	onscroll={() => {
		showBackToTop = window.scrollY > 400;
	}}
/>

<div class="drafting-grid min-h-screen text-neutral-900 dark:text-neutral-100">
	<SidebarNav items={adminNavItems} {isAdmin} />
	<MobileFab items={adminNavItems} {isAdmin} />

	<main class="w-full min-w-0 px-4 py-8 sm:px-6 lg:pr-8 lg:pl-40">
		<div class="mx-auto w-full max-w-7xl min-w-0">
			{#if isMaintenanceActive}
				<div
					class="mb-6 flex flex-col items-start justify-between gap-3.5 rounded-xl border-2 border-[#991b1b] bg-[#fee2e2] p-4 text-[#991b1b] shadow-[4px_4px_0px_#991b1b] sm:flex-row sm:items-center dark:border-[#f87171] dark:bg-[#450a0a]/85 dark:text-[#fecaca] dark:shadow-[4px_4px_0px_#f87171]"
					role="alert"
				>
					<div class="flex items-center gap-3">
						<AlertTriangle size={22} class="shrink-0 text-[#991b1b] dark:text-[#f87171]" />
						<div>
							<p class="font-mono text-xs font-black tracking-wider uppercase">
								STATUS TOKO: MODE PEMELIHARAAN SEDANG AKTIF
							</p>
							<p class="font-sans text-xs leading-relaxed opacity-95 sm:text-sm">
								Situs publik saat ini tertutup bagi pembeli. Seluruh pengunjung diarahkan ke halaman pemeliharaan (HTTP 503).
							</p>
						</div>
					</div>

					<div class="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
						<button
							type="button"
							onclick={handleQuickReopenStore}
							disabled={isUnblocking}
							class="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border-2 border-[#991b1b] bg-[#991b1b] px-3.5 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#262626] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 disabled:cursor-wait disabled:opacity-75 dark:border-[#f87171] dark:bg-[#f87171] dark:text-[#1a1825] dark:shadow-[2px_2px_0px_#f87171]"
						>
							{#if isUnblocking}
								<Loader2 size={14} class="animate-spin" />
								<span>Membuka Toko...</span>
							{:else}
								<span>Buka Toko Sekarang</span>
							{/if}
						</button>

						<a
							href={resolve('/admin/settings')}
							class="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border-2 border-[#991b1b] bg-white px-3 py-2 font-mono text-xs font-bold text-[#991b1b] shadow-[1.5px_1.5px_0px_#991b1b] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 dark:border-[#f87171] dark:bg-[#252331] dark:text-[#fca5a5]"
						>
							<span>Pengaturan</span>
							<ArrowRight size={13} strokeWidth={2.5} />
						</a>
					</div>
				</div>
			{/if}

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
