<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { formatRupiah } from '$lib/utils/currency';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { toast } from 'svelte-sonner';
	import { Trash2, ExternalLink, ArrowRight, History } from '@lucide/svelte';

	interface HistoryEntry {
		orderId: string;
		token: string;
		total: number;
		createdAt: string;
		href: ResolvedPathname;
	}

	let entries = $state<HistoryEntry[]>([]);
	let modalOpen = $state(false);

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

	function confirmClearHistory() {
		modalOpen = false;
		try {
			localStorage.removeItem('invoizy:invoices');
		} catch {
			// abaikan — toh tujuannya menghapus
		}
		entries = [];
		toast.success('Riwayat perangkat dihapus.');
	}
</script>

<div class="space-y-8 pb-24 overflow-x-clip">
	<!-- Page Header -->
	<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="space-y-2">
			<div
				class="inline-block -rotate-2 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-papaya px-3.5 py-1.5 font-mono text-xs font-bold tracking-widest text-brandy uppercase shadow-[2px_2px_0px_#78290f] md:text-sm dark:border-papaya/40 dark:bg-ink dark:text-papaya dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
			>
				RIWAYAT PESANAN
			</div>
			<h1
				class="font-serif text-3xl font-bold tracking-normal text-ink md:text-4xl dark:text-papaya"
			>
				Arsip Pesanan Lokal
			</h1>
			<p class="font-handwriting text-2xl font-semibold leading-snug text-teal md:text-3xl dark:text-papaya/90">
				Invoice yang pernah Anda buat di sini.
			</p>
		</div>

		{#if entries.length > 0}
			<button
				type="button"
				onclick={() => (modalOpen = true)}
				class="inline-flex shrink-0 rotate-1 items-center gap-1.5 self-start rounded-[6px_2px_5px_1px] border border-crimson/30 bg-crimson/10 px-3 py-1.5 font-mono text-xs font-bold text-crimson shadow-[1px_1px_0px_#c1121f] transition-all hover:rotate-0 hover:bg-crimson/20 active:translate-y-0.5"
			>
				<Trash2 size={13} strokeWidth={2.5} />
				<span>Hapus Riwayat</span>
			</button>
		{/if}
	</header>

	<!-- Local-only Warning Note (Sticky Memo Aesthetic) -->
	<div
		class="relative -rotate-1 rounded-[10px_4px_8px_3px] border-2 border-brandy/40 bg-tangerine/10 p-4 text-xs leading-relaxed text-brandy shadow-[2px_2px_0px_rgba(120,41,15,0.15)] transition-transform duration-150 hover:rotate-0 dark:border-papaya/30 dark:bg-tangerine/15 dark:text-papaya"
	>
		<p class="font-serif text-sm font-bold text-ink dark:text-papaya">Catatan Penyimpanan Perangkat</p>
		<p class="mt-1">
			Riwayat ini tersimpan otomatis hanya di penyimpanan lokal peramban Anda, bukan pada akun server. Riwayat akan terhapus jika Anda membersihkan cache browser, beralih perangkat, atau menggunakan mode samaran (incognito). Simpan salinan invoice yang dikirimkan ke email sebagai arsip permanen.
		</p>
	</div>

	{#if entries.length === 0}
		<div
			class="mx-auto max-w-md -rotate-1 rounded-[16px_8px_14px_6px] border-2 border-dashed border-brandy/40 bg-papaya/40 p-10 text-center shadow-[4px_4px_0px_#78290f] transition-transform duration-150 hover:rotate-0 dark:border-papaya/30 dark:bg-ink/40 dark:shadow-[4px_4px_0px_rgba(255,236,209,0.15)]"
		>
			<div
				class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-brandy bg-tangerine/20 text-brandy dark:border-papaya/40 dark:text-papaya"
			>
				<History size={28} strokeWidth={2.5} />
			</div>
			<p class="font-serif text-lg font-bold text-ink dark:text-papaya">
				Belum Ada Riwayat
			</p>
			<p class="mt-1 text-sm text-brandy/80 dark:text-papaya/70">
				Belum ada pesanan yang tercatat di perangkat ini.
			</p>
			<div class="mt-5">
				<a
					href={resolve('/(public)/order')}
					class="inline-flex rotate-1 items-center gap-2 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-tangerine px-5 py-2.5 font-mono text-sm font-bold text-white shadow-[3px_3px_0px_#78290f] transition-all hover:rotate-0 hover:bg-[#e06d00] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
				>
					<span>Mulai Belanja</span>
					<ArrowRight size={15} strokeWidth={2.5} />
				</a>
			</div>
		</div>
	{:else}
		<ul class="space-y-4.5">
			{#each entries as entry, entryIdx (entry.orderId)}
				{@const entryTilt = entryIdx % 2 === 0 ? '-rotate-[1.2deg]' : 'rotate-[1.2deg]'}
				<li
					class="group flex items-center justify-between gap-4 rounded-[12px_5px_10px_4px] border-2 border-brandy bg-papaya/60 p-4 shadow-[3px_3px_0px_#78290f] transition-all duration-200 transform-gpu backface-hidden hover:rotate-0 hover:-translate-y-1 hover:shadow-[5px_5px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/60 dark:shadow-[3px_3px_0px_rgba(255,236,209,0.15)] dark:hover:shadow-[5px_5px_0px_rgba(255,236,209,0.25)] {entryTilt}"
				>
					<div class="space-y-2">
						<span
							class="inline-block rounded-[6px_3px_5px_2px] border-2 border-brandy bg-white px-3.5 py-1 font-mono text-sm sm:text-base font-bold tracking-wider text-tangerine shadow-[2px_2px_0px_#78290f] dark:border-papaya/40 dark:bg-ink dark:text-tangerine dark:shadow-[2px_2px_0px_rgba(255,236,209,0.2)]"
						>
							{entry.orderId}
						</span>
						<p class="font-mono text-xs text-brandy/80 dark:text-papaya/70">
							{entry.createdAt ? dateLabel(entry.createdAt) : ''} · <strong class="font-bold text-teal dark:text-teal/90">{formatRupiah(entry.total)}</strong>
						</p>
					</div>
					<a
						href={entry.href}
						class="inline-flex items-center gap-1.5 rounded-[6px_2px_5px_1px] border-2 border-brandy bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] transition-all hover:bg-brandy/10 active:translate-y-0.5 active:shadow-none dark:border-papaya/40 dark:bg-ink dark:text-papaya"
					>
						<span>Buka</span>
						<ExternalLink size={13} strokeWidth={2.5} />
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<Modal
		open={modalOpen}
		title="Hapus riwayat?"
		message="Semua link invoice di perangkat ini akan hilang dan tidak bisa dikembalikan. Invoice yang sudah terkirim ke email tetap aman."
		confirmLabel="Ya, hapus"
		danger
		onConfirm={confirmClearHistory}
		onCancel={() => (modalOpen = false)}
	/>
</div>
