<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import { invoiceStatusLabel, paymentStatusLabel } from '$lib/utils/status-label';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import {
		AlertCircle,
		CheckCircle2,
		AlertTriangle,
		TrendingUp,
		ArrowRight,
		ShoppingBag,
		Layers,
		BarChart3
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let chartMetric = $state<'revenue' | 'orders'>('revenue');

	const orderHref = (orderId: string): ResolvedPathname =>
		resolve('/admin/orders/[id]', { id: orderId });

	const maxRevenue = $derived(Math.max(...(data.stats?.last7Days.map((d) => d.revenue) ?? [0]), 1));
	const maxOrders = $derived(Math.max(...(data.stats?.last7Days.map((d) => d.orders) ?? [0]), 1));
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<!-- Page Header: Warm Monoline Editorial -->
	<header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-2">
			<div
				class="inline-flex items-center gap-2 rounded-lg border-2 border-[#262626] bg-[#a2e1db] px-4 py-1.5 font-mono text-xs font-black tracking-widest text-[#262626] uppercase shadow-[2px_2px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#1a1825] dark:text-[#a2e1db] dark:shadow-[2px_2px_0px_#b4a6d5]"
			>
				<span class="h-2 w-2 rounded-full border border-[#262626] bg-white"></span>
				<span>PANEL PENGELOLA</span>
			</div>
			<h1
				class="font-serif text-3xl font-black tracking-tight text-[#262626] md:text-4xl dark:text-[#f2efe9]"
			>
				Ringkasan Toko
			</h1>
			<p class="font-mono text-xs text-[#404040] md:text-sm dark:text-[#b8b5ad]">
				Pantau metrik penjualan, antrean verifikasi pembayaran, dan pergerakan stok toko.
			</p>
		</div>

		<div class="flex items-center gap-2.5">
			<a
				href={resolve('/admin/orders')}
				class="group relative inline-flex items-center justify-center overflow-hidden rounded-lg border-2 border-[#262626] bg-white px-3.5 py-2 font-mono text-xs font-bold text-[#262626] shadow-[2px_2px_0px_#262626] transition-all hover:-translate-y-0.5 hover:bg-[#b4a6d5] active:translate-y-0.5 active:shadow-none dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9] dark:shadow-[2px_2px_0px_#f2efe9]"
			>
				<span
					class="inline-flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[150%]"
				>
					<span>Daftar Pesanan</span>
					<ArrowRight size={13} strokeWidth={2.5} />
				</span>
				<span
					class="absolute inset-0 inline-flex translate-y-[150%] items-center justify-center gap-1.5 transition-transform duration-300 ease-out group-hover:translate-y-0"
					aria-hidden="true"
				>
					<span>Daftar Pesanan</span>
					<ArrowRight size={13} />
				</span>
			</a>
		</div>
	</header>

	{#if !data.stats}
		<ListSkeleton rows={3} />
	{:else if data.stats.totalOrders === 0}
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
	{:else}
		<!-- 1. ACTION QUEUE (Tugas Mendesak Operasional) -->
		{#if data.stats.waitingVerificationCount > 0 || data.stats.lowStockCount > 0}
			<div class="space-y-3">
				{#if data.stats.waitingVerificationCount > 0}
					<div
						class="flex items-center justify-between rounded-lg border-2 border-[#92400e] bg-[#fef3c7] p-4 text-sm text-[#92400e] shadow-[2px_2px_0px_#92400e] dark:border-[#f59e0b] dark:bg-[#78350f]/40 dark:text-[#fde68a]"
					>
						<div class="flex items-center gap-2.5">
							<AlertCircle size={18} class="shrink-0" />
							<div>
								<span class="font-bold">{data.stats.waitingVerificationCount} Pesanan</span>
								<span>menunggu konfirmasi bukti transfer pembayaran.</span>
							</div>
						</div>
						<a
							href="{resolve('/admin/orders')}?payment=WAITING_VERIFICATION"
							class="shrink-0 font-mono text-xs font-bold underline underline-offset-2 hover:no-underline sm:text-sm"
						>
							Tinjau Pesanan &rarr;
						</a>
					</div>
				{/if}

				{#if data.stats.lowStockCount > 0}
					<div
						class="flex items-center justify-between rounded-lg border-2 border-[#991b1b] bg-[#fee2e2] p-4 text-sm text-[#991b1b] shadow-[2px_2px_0px_#991b1b] dark:border-[#f87171] dark:bg-[#450a0a]/40 dark:text-[#f87171]"
					>
						<div class="flex items-center gap-2.5">
							<AlertTriangle size={18} class="shrink-0" />
							<div>
								<span class="font-bold">{data.stats.lowStockCount} Produk</span>
								<span>memiliki stok kritis (&le; 3 pcs).</span>
							</div>
						</div>
						<a
							href="{resolve('/admin/products')}?stock=low"
							class="shrink-0 font-mono text-xs font-bold underline underline-offset-2 hover:no-underline sm:text-sm"
						>
							Kelola Stok &rarr;
						</a>
					</div>
				{/if}
			</div>
		{:else}
			<div
				class="flex items-center gap-2.5 rounded-lg border-2 border-[#065f46] bg-[#d1fae5] px-4 py-3 text-sm font-bold text-[#065f46] shadow-[2px_2px_0px_#065f46] dark:border-[#a2e1db] dark:bg-[#064e3b]/30 dark:text-[#a2e1db]"
			>
				<CheckCircle2 size={18} class="shrink-0" />
				<span class="font-mono">Semua pembayaran aman dan stok produk dalam batas wajar.</span>
			</div>
		{/if}

		<!-- 2. RINGKASAN METRIK: HARI INI VS TOTAL (AdminMetricCard Pattern) -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<!-- STAT 1: OMZET HARI INI -->
			<div
				class="relative overflow-hidden rounded-[12px_4px_12px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<span
					class="absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20"
					>+</span
				>
				<div class="flex items-center justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span class="font-mono text-[13px] font-bold">Omzet Hari Ini</span>
					<TrendingUp size={18} class="text-[#065f46] dark:text-[#34d399]" />
				</div>
				<p class="mt-2 font-mono text-xl font-black text-[#262626] sm:text-2xl dark:text-[#f2efe9]">
					{formatRupiah(data.stats.todayRevenue)}
				</p>
			</div>

			<!-- STAT 2: PESANAN HARI INI -->
			<div
				class="relative overflow-hidden rounded-[12px_4px_12px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<span
					class="absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20"
					>+</span
				>
				<div class="flex items-center justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span class="font-mono text-[13px] font-bold">Pesanan Hari Ini</span>
					<ShoppingBag size={18} class="text-[#fea770]" />
				</div>
				<p class="mt-2 font-mono text-xl font-black text-[#262626] sm:text-2xl dark:text-[#f2efe9]">
					{data.stats.todayOrders} <span class="text-sm font-bold">Order</span>
				</p>
			</div>

			<!-- STAT 3: TOTAL AKUMULASI NILAI -->
			<div
				class="relative overflow-hidden rounded-[12px_4px_12px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<span
					class="absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20"
					>+</span
				>
				<div class="flex items-center justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span class="font-mono text-[13px] font-bold">Total Omzet</span>
					<TrendingUp size={18} class="text-[#3730a3] dark:text-[#818cf8]" />
				</div>
				<p
					class="mt-2 font-mono text-xl font-black text-[#065f46] sm:text-xl md:text-3xl dark:text-[#a2e1db]"
				>
					{formatRupiah(data.stats.totalRevenue)}
				</p>
			</div>

			<!-- STAT 4: TOTAL SELURUH PESANAN -->
			<div
				class="relative overflow-hidden rounded-[12px_4px_12px_4px] border-2 border-[#262626] bg-white p-4 shadow-[3px_3px_0px_#262626] transition-all hover:-translate-y-0.5 dark:border-[#f2efe9] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#f2efe9]"
			>
				<span
					class="absolute top-1.5 right-1.5 font-mono text-[9px] font-bold text-[#262626]/20 dark:text-[#f2efe9]/20"
					>+</span
				>
				<div class="flex items-center justify-between text-[#404040] dark:text-[#b8b5ad]">
					<span class="font-mono text-[13px] font-bold">Total Pesanan</span>
					<Layers size={18} class="text-[#b4a6d5]" />
				</div>
				<p class="mt-2 font-mono text-xl font-black text-[#262626] sm:text-2xl dark:text-[#f2efe9]">
					{data.stats.totalOrders} <span class="text-sm font-bold">Order</span>
				</p>
			</div>
		</div>

		<!-- 3. NATIVE MICRO BAR CHART: TREN 7 HARI TERAKHIR -->
		<div
			class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[4px_4px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<div
				class="flex flex-col gap-2 border-b border-[#262626]/15 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#f2efe9]/15"
			>
				<div class="flex items-center gap-2">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#262626] bg-[#b4a6d5] text-[#262626] shadow-[1px_1px_0px_#262626]"
					>
						<BarChart3 size={16} />
					</div>
					<h2
						class="font-serif text-base font-bold tracking-wide text-[#262626] uppercase dark:text-[#f2efe9]"
					>
						Tren Penjualan 7 Hari Terakhir
					</h2>
				</div>
				<div
					class="inline-flex overflow-hidden rounded-lg border-2 border-[#262626] bg-[#f2efe9] p-0.5 text-xs font-bold shadow-[2px_2px_0px_#262626] dark:border-[#f2efe9] dark:bg-[#1a1825]"
				>
					<button
						type="button"
						onclick={() => (chartMetric = 'revenue')}
						class="rounded-md px-3.5 py-1.5 font-mono text-xs font-bold transition-all {chartMetric ===
						'revenue'
							? 'bg-[#fea770] text-[#262626] shadow-[1px_1px_0px_#262626]'
							: 'text-[#404040] hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:text-[#f2efe9]'}"
					>
						Omzet (Rp)
					</button>
					<button
						type="button"
						onclick={() => (chartMetric = 'orders')}
						class="rounded-md px-3.5 py-1.5 font-mono text-xs font-bold transition-all {chartMetric ===
						'orders'
							? 'bg-[#fea770] text-[#262626] shadow-[1px_1px_0px_#262626]'
							: 'text-[#404040] hover:text-[#262626] dark:text-[#b8b5ad] dark:hover:text-[#f2efe9]'}"
					>
						Order
					</button>
				</div>
			</div>

			<!-- Canvas Bar Chart Sederhana -->
			<div class="mt-4 flex h-36 items-end justify-between gap-2 pt-6">
				{#each data.stats.last7Days as day (day.date)}
					{@const metricVal = chartMetric === 'revenue' ? day.revenue : day.orders}
					{@const maxVal = chartMetric === 'revenue' ? maxRevenue : maxOrders}
					{@const barPercent = Math.round((metricVal / maxVal) * 100)}

					<div class="group relative flex h-full flex-1 flex-col items-center justify-end">
						<!-- Tooltip Hover Angka -->
						<div
							class="pointer-events-none absolute -top-8 z-10 hidden rounded-md border-2 border-[#262626] bg-white px-2.5 py-1 font-mono text-xs font-bold whitespace-nowrap text-[#262626] opacity-0 shadow-[2px_2px_0px_#262626] transition-opacity group-hover:block group-hover:opacity-100 dark:border-[#f2efe9] dark:bg-[#252331] dark:text-[#f2efe9]"
						>
							{day.label}: {chartMetric === 'revenue'
								? formatRupiah(day.revenue)
								: `${day.orders} order`}
						</div>

						<!-- Batang Bar -->
						<div
							class="w-full max-w-[36px] rounded-t-md border-x-2 border-t-2 border-[#262626] transition-all duration-300 {metricVal >
							0
								? 'bg-[#fea770] group-hover:bg-[#f99252] dark:border-[#f2efe9]'
								: 'border-[#262626]/20 bg-[#f2efe9] dark:border-[#f2efe9]/20 dark:bg-[#1a1825]'}"
							style="height: {Math.max(barPercent, 8)}%"
						></div>

						<!-- Label Hari (Sumbu X) -->
						<span
							class="mt-2 text-center font-mono text-xs font-bold text-[#404040] dark:text-[#b8b5ad]"
						>
							{day.label.split(' ')[0]}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- 4. BREAKDOWN INVOICE & PEMBAYARAN -->
		<div class="grid gap-4 sm:grid-cols-2">
			<div
				class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#b4a6d5]"
			>
				<span
					class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
					aria-hidden="true">+</span
				>
				<h2
					class="border-b border-[#262626]/15 pb-2 font-serif text-base font-bold tracking-wider text-[#262626] uppercase dark:border-[#f2efe9]/15 dark:text-[#f2efe9]"
				>
					Status Invoice
				</h2>
				<ul class="mt-3 divide-y divide-[#262626]/10 text-sm dark:divide-[#f2efe9]/10">
					{#each data.stats.byInvoice as row (row.status)}
						<li class="flex items-center justify-between py-2.5 font-mono text-xs sm:text-[13px]">
							<span class="text-[#404040] dark:text-[#b8b5ad]"
								>{invoiceStatusLabel(row.status)}</span
							>
							<span
								class="rounded border border-[#262626] bg-[#f2efe9] px-2.5 py-0.5 text-xs font-bold text-[#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
								>{row.count}</span
							>
						</li>
					{/each}
				</ul>
			</div>
			<div
				class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#b4a6d5]"
			>
				<span
					class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
					aria-hidden="true">+</span
				>
				<h2
					class="border-b border-[#262626]/15 pb-2 font-serif text-base font-bold tracking-wider text-[#262626] uppercase dark:border-[#f2efe9]/15 dark:text-[#f2efe9]"
				>
					Status Pembayaran
				</h2>
				<ul class="mt-3 divide-y divide-[#262626]/10 text-sm dark:divide-[#f2efe9]/10">
					{#each data.stats.byPayment as row (row.status)}
						<li class="flex items-center justify-between py-2.5 font-mono text-xs sm:text-[13px]">
							<span class="text-[#404040] dark:text-[#b8b5ad]"
								>{paymentStatusLabel(row.status)}</span
							>
							<span
								class="rounded border border-[#262626] bg-[#f2efe9] px-2.5 py-0.5 text-xs font-bold text-[#262626] dark:border-[#f2efe9] dark:bg-[#1a1825] dark:text-[#f2efe9]"
								>{row.count}</span
							>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- 5. PESANAN TERBARU -->
		<div
			class="relative rounded-[14px_4px_14px_4px] border-2 border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] dark:border-[#a2e1db] dark:bg-[#252331] dark:shadow-[3px_3px_0px_#b4a6d5]"
		>
			<span
				class="absolute top-2 right-2 font-mono text-[10px] text-[#262626]/30 dark:text-[#f2efe9]/30"
				aria-hidden="true">+</span
			>
			<div
				class="flex items-center justify-between border-b border-[#262626]/15 pb-3 dark:border-[#f2efe9]/15"
			>
				<h2
					class="font-serif text-base font-bold tracking-wider text-[#262626] uppercase dark:text-[#f2efe9]"
				>
					Pesanan Terbaru
				</h2>
				<a
					href={resolve('/admin/orders')}
					class="font-mono text-xs font-bold underline underline-offset-2 hover:text-[#fea770] sm:text-sm"
					>Lihat semua &rarr;</a
				>
			</div>
			<ul class="mt-3 divide-y divide-[#262626]/10 text-sm dark:divide-[#f2efe9]/10">
				{#each data.recent as o (o.orderId)}
					<li class="flex items-center justify-between gap-3 py-3 font-mono text-xs sm:text-sm">
						<a
							href={orderHref(o.orderId)}
							class="font-bold underline underline-offset-2 hover:text-[#fea770]"
						>
							#{o.orderId}
						</a>
						<span class="max-w-[200px] truncate text-[#404040] dark:text-[#b8b5ad]"
							>{o.handle} · {o.itemQty} item</span
						>
						<span class="font-bold text-[#065f46] dark:text-[#a2e1db]">{formatRupiah(o.total)}</span
						>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
