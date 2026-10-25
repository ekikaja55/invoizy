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
		ArrowRight
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let chartMetric = $state<'revenue' | 'orders'>('revenue');

	const orderHref = (orderId: string): ResolvedPathname =>
		resolve('/admin/orders/[id]', { id: orderId });

	const maxRevenue = $derived(
		Math.max(...(data.stats?.last7Days.map((d) => d.revenue) ?? [0]), 1)
	);
	const maxOrders = $derived(
		Math.max(...(data.stats?.last7Days.map((d) => d.orders) ?? [0]), 1)
	);
</script>

<div class="mx-auto max-w-4xl space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold">Dashboard</h1>
		<div class="flex items-center gap-2">
			<a
				href={resolve('/admin/orders')}
				class="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 underline dark:text-neutral-400 dark:hover:text-neutral-200"
			>
				<span>Daftar Pesanan</span>
				<ArrowRight size={13} />
			</a>
		</div>
	</div>

	{#if !data.stats}
		<ListSkeleton rows={3} />
	{:else if data.stats.totalOrders === 0}
		<p class="py-8 text-center text-sm text-neutral-500">
			Belum ada order masuk. Bagikan link order ke buyer untuk memulai.
		</p>
	{:else}
		<!-- 1. ACTION QUEUE (Tugas Mendesak Operasional) -->
		{#if data.stats.waitingVerificationCount > 0 || data.stats.lowStockCount > 0}
			<div class="space-y-2">
				{#if data.stats.waitingVerificationCount > 0}
					<div
						class="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/60 p-3.5 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200"
					>
						<div class="flex items-center gap-2.5">
							<AlertCircle size={16} class="shrink-0 text-amber-600 dark:text-amber-400" />
							<div>
								<span class="font-bold">{data.stats.waitingVerificationCount} Pesanan</span>
								<span>menunggu konfirmasi bukti transfer pembayaran.</span>
							</div>
						</div>
						<a
							href={resolve('/admin/orders')}
							class="shrink-0 font-semibold underline hover:no-underline"
						>
							Tinjau Pesanan &rarr;
						</a>
					</div>
				{/if}

				{#if data.stats.lowStockCount > 0}
					<div
						class="flex items-center justify-between rounded-xl border border-red-300 bg-red-50/60 p-3.5 text-xs text-red-900 dark:border-red-700/60 dark:bg-red-950/30 dark:text-red-200"
					>
						<div class="flex items-center gap-2.5">
							<AlertTriangle size={16} class="shrink-0 text-red-600 dark:text-red-400" />
							<div>
								<span class="font-bold">{data.stats.lowStockCount} Produk</span>
								<span>memiliki stok kritis (&le; 3 pcs).</span>
							</div>
						</div>
						<a
							href={resolve('/admin/products')}
							class="shrink-0 font-semibold underline hover:no-underline"
						>
							Kelola Stok &rarr;
						</a>
					</div>
				{/if}
			</div>
		{:else}
			<div
				class="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400"
			>
				<CheckCircle2 size={15} class="text-emerald-600 dark:text-emerald-400" />
				<span>Semua pembayaran aman dan stok produk dalam batas wajar.</span>
			</div>
		{/if}

		<!-- 2. RINGKASAN METRIK: HARI INI VS TOTAL -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
				<p class="text-xs text-neutral-500">Omzet Hari Ini</p>
				<p class="mt-1 text-xl font-bold">{formatRupiah(data.stats.todayRevenue)}</p>
			</div>
			<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
				<p class="text-xs text-neutral-500">Pesanan Hari Ini</p>
				<p class="mt-1 text-xl font-bold">{data.stats.todayOrders}</p>
			</div>
			<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
				<p class="text-xs text-neutral-500">Total Akumulasi Nilai</p>
				<p class="mt-1 text-xl font-bold">{formatRupiah(data.stats.totalRevenue)}</p>
			</div>
			<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
				<p class="text-xs text-neutral-500">Total Seluruh Pesanan</p>
				<p class="mt-1 text-xl font-bold">{data.stats.totalOrders}</p>
			</div>
		</div>

		<!-- 3. NATIVE MICRO BAR CHART: TREN 7 HARI TERAKHIR (Zero-Dependency & Kebal SSR Bug) -->
		<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
				<div class="flex items-center gap-2">
					<TrendingUp size={16} class="text-neutral-500" />
					<h2 class="text-sm font-semibold tracking-wide text-neutral-600 uppercase dark:text-neutral-300">
						Tren Penjualan 7 Hari Terakhir
					</h2>
				</div>
				<div class="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800">
					<button
						type="button"
						onclick={() => (chartMetric = 'revenue')}
						class="rounded-md px-2.5 py-1 transition-all {chartMetric === 'revenue'
							? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100 font-semibold'
							: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'}"
					>
						Omzet (Rp)
					</button>
					<button
						type="button"
						onclick={() => (chartMetric = 'orders')}
						class="rounded-md px-2.5 py-1 transition-all {chartMetric === 'orders'
							? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-900 dark:text-neutral-100 font-semibold'
							: 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'}"
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
							class="pointer-events-none absolute -top-7 z-10 hidden whitespace-nowrap rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-mono text-white opacity-0 shadow-xs transition-opacity group-hover:block group-hover:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
						>
							{day.label}: {chartMetric === 'revenue' ? formatRupiah(day.revenue) : `${day.orders} order`}
						</div>

						<!-- Batang Bar -->
						<div
							class="w-full max-w-[36px] rounded-t transition-all duration-300 {metricVal > 0
								? 'bg-neutral-800 group-hover:bg-neutral-600 dark:bg-neutral-200 dark:group-hover:bg-white'
								: 'bg-neutral-100 dark:bg-neutral-800'}"
							style="height: {Math.max(barPercent, 6)}%"
						></div>

						<!-- Label Hari (Sumbu X) -->
						<span class="mt-2 text-[10px] sm:text-[11px] text-neutral-500 font-mono text-center">
							{day.label.split(' ')[0]}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- 4. BREAKDOWN INVOICE & PEMBAYARAN -->
		<div class="grid gap-3 sm:grid-cols-2">
			<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
				<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Status Invoice</h2>
				<ul class="mt-2 space-y-1 text-sm">
					{#each data.stats.byInvoice as row (row.status)}
						<li class="flex justify-between">
							<span>{invoiceStatusLabel(row.status)}</span>
							<span class="font-semibold">{row.count}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
				<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Status Pembayaran</h2>
				<ul class="mt-2 space-y-1 text-sm">
					{#each data.stats.byPayment as row (row.status)}
						<li class="flex justify-between">
							<span>{paymentStatusLabel(row.status)}</span>
							<span class="font-semibold">{row.count}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- 5. PESANAN TERBARU -->
		<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Pesanan Terbaru</h2>
				<a href={resolve('/admin/orders')} class="text-sm underline">Lihat semua</a>
			</div>
			<ul class="mt-3 space-y-2 text-sm">
				{#each data.recent as o (o.orderId)}
					<li class="flex items-center justify-between gap-2">
						<a href={orderHref(o.orderId)} class="font-mono font-semibold underline">
							{o.orderId}
						</a>
						<span class="text-neutral-500">{o.handle} · {o.itemQty} item</span>
						<span class="font-medium">{formatRupiah(o.total)}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
