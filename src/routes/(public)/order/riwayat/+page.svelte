<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';

	interface HistoryEntry {
		orderId: string;
		token: string;
		total: number;
		createdAt: string;
		href: ResolvedPathname;
	}

	let entries = $state<HistoryEntry[]>([]);

	$effect(() => {
		try {
			const parsed = JSON.parse(localStorage.getItem('invoizy:invoices') ?? '[]');
			if (!Array.isArray(parsed)) return;
			entries = parsed
				.filter((i) => typeof i?.orderId === 'string' && typeof i?.token === 'string')
				.map((i) => ({
					orderId: i.orderId,
					token: i.token,
					total: typeof i.total === 'number' ? i.total : 0,
					createdAt: typeof i.createdAt === 'string' ? i.createdAt : '',
					href: `${resolve('/invoice/[orderId]', { orderId: i.orderId })}?token=${i.token}` as ResolvedPathname
				}));
		} catch {
			entries = [];
		}
	});

	function dateLabel(iso: string): string {
		try {
			return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso));
		} catch {
			return iso;
		}
	}

	function clearHistory() {
		try {
			localStorage.removeItem('invoizy:invoices');
		} catch {
			// abaikan — toh tujuannya menghapus
		}
		entries = [];
	}
</script>

<div class="space-y-6 pb-16">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-xl font-semibold">Riwayat Pesanan</h1>
			<p class="mt-1 text-sm text-neutral-500">Invoice yang pernah dibuat dari perangkat ini.</p>
		</div>
		{#if entries.length > 0}
			<button
				onclick={clearHistory}
				class="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700
				       hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
			>
				Hapus Riwayat
			</button>
		{/if}
	</div>

	<div
		class="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
	>
		Riwayat ini tersimpan otomatis hanya di perangkat dan browser ini, bukan akun. Ia akan hilang
		jika kamu menghapus data browser, ganti perangkat, atau memakai mode penyamaran. Simpan link
		invoice dari email sebagai arsip utama.
	</div>

	{#if entries.length === 0}
		<div class="rounded-xl border border-neutral-200 p-8 text-center dark:border-neutral-800">
			<p class="text-sm text-neutral-500">Belum ada riwayat di perangkat ini.</p>
			<a
				href={resolve('/order')}
				class="mt-4 inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white
				       dark:bg-white dark:text-neutral-900"
			>
				Mulai Order
			</a>
		</div>
	{:else}
		<ul class="space-y-2">
			{#each entries as entry (entry.orderId)}
				<li
					class="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
				>
					<div>
						<p class="font-mono text-sm font-semibold">{entry.orderId}</p>
						<p class="text-xs text-neutral-500">
							{entry.createdAt ? dateLabel(entry.createdAt) : ''} · {formatRupiah(entry.total)}
						</p>
					</div>
					<a
						href={entry.href}
						class="shrink-0 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium
						       hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-white/10"
					>
						Buka
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
