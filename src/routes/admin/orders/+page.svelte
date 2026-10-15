<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import { invoiceStatusLabel, paymentStatusLabel } from '$lib/utils/status-label';
	import ListSkeleton from '$lib/components/ui/ListSkeleton.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

<div class="mx-auto max-w-4xl space-y-4">
	<div class="flex items-center justify-between gap-2">
		<h1 class="text-xl font-semibold">Orders</h1>
		<a
			href={exportHref()}
			rel="external"
			class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
			       hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
		>
			Export CSV
		</a>
	</div>

	<form
		method="GET"
		class="grid gap-2 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2 dark:border-neutral-800"
	>
		<input
			type="search"
			name="q"
			value={data.filters.q}
			placeholder="Cari order ID / handle / email"
			class="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900
			       placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900
			       dark:text-neutral-100 dark:placeholder:text-neutral-500"
		/>

		<div class="grid grid-cols-1 gap-2">
			<select
				name="invoice"
				class="w-full truncate rounded-lg border border-neutral-300 bg-white py-2 pr-8 pl-3 text-sm
				       dark:border-neutral-700 dark:bg-neutral-900"
			>
				<option value="">Invoice: semua</option>
				{#each ['PENDING', 'GENERATING', 'SENT', 'FAILED'] as s (s)}
					<option value={s} selected={data.filters.invoice === s}>{invoiceStatusLabel(s)}</option>
				{/each}
			</select>
			<select
				name="payment"
				class="w-full truncate rounded-lg border border-neutral-300 bg-white py-2 pr-8 pl-3 text-sm
				       dark:border-neutral-700 dark:bg-neutral-900"
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
				class="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
			/>
			<input
				type="date"
				name="to"
				value={data.filters.to}
				class="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
			/>
		</div>

		<div class="flex gap-2">
			<button
				type="submit"
				class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white
				       dark:bg-white dark:text-neutral-900"
			>
				Terapkan
			</button>
			<a
				href={resolve('/admin/orders')}
				class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
				       hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
			>
				Reset
			</a>
		</div>
	</form>

	{#if !data.orders}
		<ListSkeleton rows={3} />
	{:else if data.orders.length === 0}
		{#if hasActiveFilter}
			<p class="py-8 text-center text-sm text-neutral-500">
				Tidak ada order yang cocok. Ubah filter atau reset.
			</p>
		{:else}
			<p class="py-8 text-center text-sm text-neutral-500">
				Belum ada order masuk. Bagikan link order ke buyer untuk memulai.
			</p>
		{/if}
	{:else}
		<p class="text-sm text-neutral-500">{data.total} order ditemukan.</p>
		<div class="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
			<table class="w-full min-w-160 text-left text-sm">
				<thead>
					<tr
						class="border-b border-neutral-200 text-xs tracking-wide text-neutral-500 uppercase dark:border-neutral-800"
					>
						<th class="px-4 py-2">Order</th>
						<th class="px-4 py-2">Buyer</th>
						<th class="px-4 py-2 text-right">Total</th>
						<th class="px-4 py-2">Invoice</th>
						<th class="px-4 py-2">Bayar</th>
						<th class="px-4 py-2">Tanggal</th>
					</tr>
				</thead>
				<tbody>
					{#each data.orders as o (o.orderId)}
						<tr class="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
							<td class="px-4 py-2">
								<a href={orderHref(o.orderId)} class="font-mono font-semibold underline">
									{o.orderId}
								</a>
								<span class="ml-1 text-xs text-neutral-500">({o.itemQty})</span>
							</td>
							<td class="px-4 py-2">
								{o.handle}
								<span class="block text-xs text-neutral-500">{o.email}</span>
							</td>
							<td class="px-4 py-2 text-right font-medium">{formatRupiah(o.total)}</td>
							<td class="px-4 py-2 text-xs">{invoiceStatusLabel(o.invoiceStatus)}</td>
							<td class="px-4 py-2 text-xs">{paymentStatusLabel(o.paymentStatus)}</td>
							<td class="px-4 py-2 text-xs text-neutral-500">{dateLabel(o.createdAt)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<Pagination page={data.page} totalPages={data.totalPages} buildHref={pageHref} />
	{/if}
</div>
