<script lang="ts">
	import { resolve } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import { invoiceStatusLabel, paymentStatusLabel } from '$lib/utils/status-label';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import { RefreshCw } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let refreshing = $state(false);

	const isTableLoading = $derived(
		refreshing ||
			(navigating.to !== null && navigating.to.url.pathname.startsWith('/admin/orders')) ||
			!data.orders
	);

	async function handleRefresh() {
		if (refreshing) return;
		refreshing = true;
		try {
			await invalidateAll();
			toast.success('Daftar pesanan diperbarui.');
		} catch {
			toast.error('Gagal memperbarui data pesanan.');
		} finally {
			refreshing = false;
		}
	}

	function dateLabel(iso: string): string {
		try {
			return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso));
		} catch {
			return iso;
		}
	}

	function activeParams(): Record<string, string> {
		const out: Record<string, string> = {};
		for (const [k, v] of Object.entries(data.filters)) {
			if (v) out[k] = v;
		}
		return out;
	}

	// Bedakan "belum ada order sama sekali" vs "filter tidak cocok".
	const hasActiveFilter = $derived(Object.values(data.filters).some((v) => v !== ''));

	const pageHref = (p: number): ResolvedPathname => {
		const qs = new URLSearchParams({ ...activeParams(), page: String(p) }).toString();
		return `${resolve('/admin/orders')}${qs ? `?${qs}` : ''}` as ResolvedPathname;
	};

	const exportHref = (): ResolvedPathname => {
		const qs = new URLSearchParams(activeParams()).toString();
		return `${resolve('/admin/orders/export')}${qs ? `?${qs}` : ''}` as ResolvedPathname;
	};

	const orderHref = (orderId: string): ResolvedPathname =>
		resolve('/admin/orders/[id]', { id: orderId });
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<!-- Page Header: Warm Monoline Editorial -->
	<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-2">
			<div
				class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#fea770] px-4 py-1.5 font-mono text-xs font-black tracking-widest text-[#262626] uppercase shadow-[2px_2px_0px_#262626] dark:border-[#fea770] dark:bg-[#1a1825] dark:text-[#fea770] dark:shadow-[2px_2px_0px_#b4a6d5]"
			>
				<span class="h-2 w-2 rounded-full border border-[#262626] bg-white"></span>
				<span>MANAJEMEN PESANAN</span>
			</div>
			<h1
				class="font-serif text-3xl font-black tracking-tight text-[#262626] md:text-4xl dark:text-[#f2efe9]"
			>
				Daftar Pesanan
			</h1>
			<p class="font-mono text-xs text-[#404040] md:text-sm dark:text-[#b8b5ad]">
				Kelola seluruh transaksi masuk, status pembayaran, dan penerbitan faktur invoice.
			</p>
		</div>

		<div class="flex items-center gap-2.5">
			<button
				type="button"
				onclick={handleRefresh}
				disabled={refreshing}
				class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
				title="Perbarui daftar pesanan"
			>
				<RefreshCw size={14} class={refreshing ? 'animate-spin' : ''} />
				<span>Refresh</span>
			</button>
			<a
				href={exportHref()}
				rel="external"
				class="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-[#262626] px-3.5 py-2 font-mono text-xs font-bold text-[#f2efe9] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#3d3a37] active:translate-y-0.5 active:shadow-none disabled:opacity-50 dark:border-[#f2efe9] dark:bg-[#f2efe9] dark:text-[#262626] dark:shadow-[2px_2px_0px_#f2efe9] {refreshing
					? 'pointer-events-none opacity-50'
					: ''}"
				aria-disabled={refreshing}
			>
				<span
					class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
				>
					<span>Export CSV</span>
				</span>
				<span
					class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-1.5 transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<span>Export CSV</span>
				</span>
			</a>
		</div>
	</header>

	<div
		class="space-y-4 transition-opacity duration-150 {refreshing
			? 'pointer-events-none opacity-60 select-none'
			: ''}"
		aria-busy={refreshing}
	>
		<!-- Filter Card: Warm Monoline -->
		<form
			method="GET"
			class="relative grid gap-3 rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] sm:grid-cols-2 dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<input
				type="search"
				name="q"
				value={data.filters.q}
				placeholder="Cari order ID / handle / email"
				class="rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-sans text-xs text-[#262626] shadow-[2px_2px_0px_#262626] placeholder:text-[#404040]/40 focus:ring-2 focus:ring-[#fea770] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9] dark:placeholder:text-[#b8b5ad]/40"
			/>

			<div class="grid grid-cols-2 gap-2">
				<select
					name="invoice"
					class="w-full truncate rounded-lg border-2 border-[#262626] bg-white px-3 py-2 font-mono text-xs text-[#262626] shadow-[2px_2px_0px_#262626] focus:ring-2 focus:ring-[#fea770] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					<option value="">Invoice: semua</option>
					{#each ['PENDING', 'GENERATING', 'SENT', 'FAILED'] as s (s)}
						<option value={s} selected={data.filters.invoice === s}>{invoiceStatusLabel(s)}</option>
					{/each}
				</select>
				<select
					name="payment"
					class="w-full truncate rounded-lg border-2 border-[#262626] bg-white px-3 py-2 font-mono text-xs text-[#262626] shadow-[2px_2px_0px_#262626] focus:ring-2 focus:ring-[#fea770] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				>
					<option value="">Bayar: semua</option>
					{#each ['PENDING', 'CONFIRMED', 'CANCELLED'] as s (s)}
						<option value={s} selected={data.filters.payment === s}>{paymentStatusLabel(s)}</option>
					{/each}
				</select>
			</div>

			<div class="grid grid-cols-2 gap-2">
				<input
					type="date"
					name="from"
					value={data.filters.from}
					class="rounded-lg border-2 border-[#262626] bg-white px-3 py-2 font-mono text-xs text-[#262626] shadow-[2px_2px_0px_#262626] focus:ring-2 focus:ring-[#fea770] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				/>
				<input
					type="date"
					name="to"
					value={data.filters.to}
					class="rounded-lg border-2 border-[#262626] bg-white px-3 py-2 font-mono text-xs text-[#262626] shadow-[2px_2px_0px_#262626] focus:ring-2 focus:ring-[#fea770] focus:outline-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
				/>
			</div>

			<div class="flex gap-2.5">
				<button
					type="submit"
					class="rounded-lg border-2 border-[#262626] bg-[#fea770] px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#f99252] active:translate-y-0.5 active:shadow-none sm:text-sm"
				>
					Terapkan
				</button>
				<a
					href={resolve('/admin/orders')}
					class="rounded-lg border-2 border-[#262626] bg-white px-4 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none sm:text-sm dark:border-[#f2efe9] dark:bg-[#343044] dark:text-[#f2efe9]"
				>
					Reset
				</a>
			</div>
		</form>

		{#if isTableLoading}
			<div class="space-y-3 pt-2">
				<div class="flex items-center justify-between">
					<div class="h-4 w-36 animate-pulse rounded bg-[#262626]/15 dark:bg-[#f2efe9]/20"></div>
				</div>
				<div
					class="relative overflow-hidden rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
					role="status"
					aria-label="Memuat pesanan..."
				>
					<div class="overflow-x-auto">
						<table class="w-full min-w-160 text-left font-sans text-sm">
						<thead>
							<tr
								class="border-b-2 border-[#262626] bg-[#f2efe9] font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#f2efe9]"
							>
								<th class="px-4 py-3">Order</th>
								<th class="px-4 py-3">Buyer</th>
								<th class="px-4 py-3">Items</th>
								<th class="px-4 py-3 text-right">Total</th>
								<th class="px-4 py-3">Status</th>
								<th class="px-4 py-3 text-center">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y-2 border-[#262626] dark:divide-[#f2efe9]/20">
							{#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
								<tr class="animate-pulse">
									<td class="px-4 py-4">
										<div class="h-4 w-28 rounded bg-[#262626]/15 dark:bg-[#f2efe9]/20"></div>
										<div class="mt-2 h-3 w-20 rounded bg-[#262626]/10 dark:bg-[#f2efe9]/12"></div>
									</td>
									<td class="px-4 py-4">
										<div class="h-4 w-32 rounded bg-[#262626]/15 dark:bg-[#f2efe9]/20"></div>
										<div class="mt-2 h-3 w-40 rounded bg-[#262626]/10 dark:bg-[#f2efe9]/12"></div>
									</td>
									<td class="px-4 py-4">
										<div class="h-4 w-24 rounded bg-[#262626]/15 dark:bg-[#f2efe9]/20"></div>
									</td>
									<td class="px-4 py-4 text-right">
										<div
											class="ml-auto h-4 w-24 rounded bg-[#262626]/15 dark:bg-[#f2efe9]/20"
										></div>
									</td>
									<td class="px-4 py-4">
										<div class="h-6 w-20 rounded-md bg-[#262626]/15 dark:bg-[#f2efe9]/20"></div>
									</td>
									<td class="px-4 py-4 text-center">
										<div
											class="mx-auto h-7 w-20 rounded-md bg-[#262626]/15 dark:bg-[#f2efe9]/20"
										></div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			</div>
		{:else if data.orders.length === 0}
			{#if hasActiveFilter}
				<div
					class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-12 text-center shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
				>
					<span
						class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
						aria-hidden="true">+</span
					>
					<p class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
						Tidak Ada Pesanan yang Cocok
					</p>
					<p class="mt-1 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
						Ubah parameter filter di atas atau klik reset untuk melihat seluruh pesanan.
					</p>
				</div>
			{:else}
				<div
					class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-12 text-center shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
				>
					<span
						class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
						aria-hidden="true">+</span
					>
					<p class="font-serif text-lg font-bold text-[#262626] dark:text-[#f2efe9]">
						Belum Ada Pesanan Masuk
					</p>
					<p class="mt-1 font-mono text-xs text-[#404040] dark:text-[#b8b5ad]">
						Bagikan tautan katalog toko ke calon pembeli untuk mulai menerima pesanan.
					</p>
				</div>
			{/if}
		{:else}
			<div class="flex items-center justify-between">
				<span class="font-mono text-xs font-bold text-[#404040] sm:text-sm dark:text-[#b8b5ad]">
					Total <strong class="text-[#262626] dark:text-[#f2efe9]">{data.total}</strong> pesanan ditemukan
				</span>
			</div>
			<div
				class="relative overflow-hidden rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
			>
				<div class="overflow-x-auto">
					<table class="w-full min-w-160 text-left font-sans text-sm">
					<thead>
						<tr
							class="border-b-2 border-[#262626] bg-[#f2efe9] font-mono text-xs font-bold tracking-wider text-[#262626] uppercase dark:border-[#f2efe9]/20 dark:bg-[#1a1825] dark:text-[#f2efe9]"
						>
							<th class="px-4 py-3.5">Order</th>
							<th class="px-4 py-3.5">Buyer</th>
							<th class="px-4 py-3.5 text-right">Total</th>
							<th class="px-4 py-3.5">Invoice</th>
							<th class="px-4 py-3.5">Bayar</th>
							<th class="px-4 py-3.5">Tanggal</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[#262626]/10 dark:divide-[#f2efe9]/10">
						{#each data.orders as o (o.orderId)}
							<tr class="transition-colors hover:bg-[#f2efe9]/60 dark:hover:bg-[#1a1825]/60">
								<td class="px-4 py-3.5 font-mono">
									<a
										href={orderHref(o.orderId)}
										class="text-sm font-bold underline underline-offset-2 hover:text-[#fea770]"
									>
										#{o.orderId}
									</a>
									<span class="ml-1 text-xs font-bold text-[#404040] dark:text-[#b8b5ad]"
										>({o.itemQty})</span
									>
								</td>
								<td class="px-4 py-3.5">
									<span
										class="font-serif text-sm font-bold text-[#262626] md:text-base dark:text-[#f2efe9]"
										>{o.handle}</span
									>
									<span
										class="block font-mono text-xs font-medium text-[#404040] dark:text-[#b8b5ad]"
										>{o.email}</span
									>
								</td>
								<td
									class="px-4 py-3.5 text-right font-mono text-sm font-bold text-[#065f46] md:text-base dark:text-[#a2e1db]"
								>
									{formatRupiah(o.total)}
								</td>
								<td class="px-4 py-3.5">
									<span
										class="inline-block rounded border border-[#262626] bg-[#f2efe9] px-2.5 py-1 font-mono text-xs font-bold text-[#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
									>
										{invoiceStatusLabel(o.invoiceStatus)}
									</span>
								</td>
								<td class="px-4 py-3.5">
									{#if o.paymentStatus === 'CONFIRMED'}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-[#065f46] bg-[#d1fae5] px-2.5 py-1 font-mono text-xs font-bold text-[#065f46]"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-[#065f46]"></span>
											<span>Lunas</span>
										</span>
									{:else if o.paymentStatus === 'CANCELLED'}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-[#991b1b] bg-[#fee2e2] px-2.5 py-1 font-mono text-xs font-bold text-[#991b1b]"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-[#991b1b]"></span>
											<span>Batal</span>
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-[#92400e] bg-[#fef3c7] px-2.5 py-1 font-mono text-xs font-bold text-[#92400e]"
										>
											<span class="h-1.5 w-1.5 rounded-full bg-[#92400e]"></span>
											<span>{paymentStatusLabel(o.paymentStatus)}</span>
										</span>
									{/if}
								</td>
								<td
									class="px-4 py-3.5 font-mono text-xs font-medium text-[#404040] dark:text-[#b8b5ad]"
								>
									{dateLabel(o.createdAt)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

			<Pagination page={data.page} totalPages={data.totalPages} buildHref={pageHref} />
		{/if}
	</div>
</div>
