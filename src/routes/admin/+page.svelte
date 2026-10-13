<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import { invoiceStatusLabel, paymentStatusLabel } from '$lib/utils/status-label';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const orderHref = (orderId: string): ResolvedPathname =>
		resolve('/admin/orders/[id]', { id: orderId });
</script>

<div class="mx-auto max-w-4xl space-y-4">
	<h1 class="text-xl font-semibold">Dashboard</h1>

	{#if !data.stats}
		<ListSkeleton rows={3} />
	{:else if data.stats.totalOrders === 0}
		<p class="py-8 text-center text-sm text-neutral-500">
			Belum ada order masuk. Bagikan link order ke buyer untuk memulai.
		</p>
	{:else}
		<div class="grid grid-cols-2 gap-3">
			<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
				<p class="text-sm text-neutral-500">Total Order</p>
				<p class="mt-1 text-2xl font-bold">{data.stats.totalOrders}</p>
			</div>
			<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
				<p class="text-sm text-neutral-500">Total Nilai</p>
				<p class="mt-1 text-2xl font-bold">{formatRupiah(data.stats.totalRevenue)}</p>
			</div>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
				<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Invoice</h2>
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
				<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Pembayaran</h2>
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

		<div class="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold tracking-wide text-neutral-500 uppercase">Terbaru</h2>
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
