<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { formatRupiah } from '$lib/utils/currency';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { toast } from 'svelte-sonner';
	import {
		Trash2,
		ExternalLink,
		ArrowRight,
		History,
		AlertTriangle,
		CheckCircle2,
		Clock,
		Ban
	} from '@lucide/svelte';

	interface HistoryEntry {
		orderId: string;
		token: string;
		total: number;
		createdAt: string;
	}

	interface ServerStatus {
		valid: boolean;
		paymentStatus?: 'PENDING' | 'WAITING_VERIFICATION' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
		invoiceStatus?: string;
		total?: number;
		hasProof?: boolean;
		isExpired?: boolean;
		reason?: string;
	}

	let entries = $state<HistoryEntry[]>([]);
	let serverStatuses = $state<Record<string, ServerStatus>>({});
	let isLoadingStatus = $state(true);
	let modalOpen = $state(false);
	let itemToDelete = $state<string | null>(null);

	onMount(() => {
		let loadedEntries: HistoryEntry[] = [];
		try {
			const parsed = JSON.parse(localStorage.getItem('invoizy:invoices') ?? '[]');
			if (Array.isArray(parsed)) {
				loadedEntries = parsed
					.filter((i) => typeof i?.orderId === 'string' && typeof i?.token === 'string')
					.map((i) => ({
						orderId: i.orderId,
						token: i.token,
						total: typeof i.total === 'number' ? i.total : 0,
						createdAt: typeof i.createdAt === 'string' ? i.createdAt : ''
					}));
			}
		} catch {
			loadedEntries = [];
		}

		entries = loadedEntries;

		if (loadedEntries.length > 0) {
			verifyEntriesWithServer(loadedEntries);
		} else {
			isLoadingStatus = false;
		}
	});

	async function verifyEntriesWithServer(list: HistoryEntry[]) {
		isLoadingStatus = true;
		try {
			const res = await fetch('/api/orders/verify-history', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ entries: list.map((e) => ({ orderId: e.orderId, token: e.token })) })
			});

			if (res.ok) {
				const data = await res.json();
				const map: Record<string, ServerStatus> = {};
				if (Array.isArray(data.results)) {
					for (const item of data.results) {
						map[item.orderId] = item;
					}
				}
				serverStatuses = map;
			}
		} catch (err) {
			console.error('Gagal memverifikasi status pesanan:', err);
		} finally {
			isLoadingStatus = false;
		}
	}

	function confirmDeleteSingle() {
		if (itemToDelete) {
			const id = itemToDelete;
			entries = entries.filter((e) => e.orderId !== id);
			try {
				localStorage.setItem('invoizy:invoices', JSON.stringify(entries));
				toast.success(`Pesanan #${id} dihapus dari riwayat browser.`);
			} catch {
				// abaikan
			}
			itemToDelete = null;
		}
	}

	function confirmClearHistory() {
		modalOpen = false;
		try {
			localStorage.removeItem('invoizy:invoices');
		} catch {
			// abaikan
		}
		entries = [];
		serverStatuses = {};
		toast.success('Seluruh riwayat perangkat telah dibersihkan.');
	}

	function dateLabel(iso: string): string {
		try {
			return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(iso));
		} catch {
			return iso;
		}
	}
</script>

<div class="space-y-8 pb-24">
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
				Arsip Pemesanan
			</h1>
			<p
				class="font-handwriting text-2xl leading-snug font-semibold text-teal md:text-3xl dark:text-papaya/90"
			>
				Daftar transaksi dan faktur yang pernah Anda buat di perangkat ini.
			</p>
		</div>

		{#if entries.length > 0}
			<button
				type="button"
				onclick={() => (modalOpen = true)}
				class="inline-flex shrink-0 rotate-1 items-center gap-1.5 self-start rounded-[6px_2px_5px_1px] border border-crimson/30 bg-crimson/10 px-3 py-1.5 font-mono text-xs font-bold text-crimson shadow-[1px_1px_0px_#c1121f] transition-all hover:rotate-0 hover:bg-crimson/20 active:translate-y-0.5"
			>
				<Trash2 size={13} strokeWidth={2.5} />
				<span>Hapus Semua</span>
			</button>
		{/if}
	</header>

	<!-- Local-only Warning Note -->
	<div
		class="relative -rotate-1 rounded-[10px_4px_8px_3px] border-2 border-brandy/40 bg-tangerine/10 p-4 text-xs leading-relaxed text-brandy shadow-[2px_2px_0px_rgba(120,41,15,0.15)] transition-transform duration-150 hover:rotate-0 dark:border-papaya/30 dark:bg-tangerine/15 dark:text-papaya"
	>
		<p class="font-serif text-sm font-bold text-ink dark:text-papaya">
			Catatan Penyimpanan Perangkat
		</p>
		<p class="mt-1">
			Riwayat ini tersimpan otomatis di penyimpanan lokal peramban Anda. Status setiap pesanan
			diverifikasi langsung secara otomatis ke server.
		</p>
	</div>

	{#if entries.length === 0}
		<div
			class="rounded-[16px_8px_14px_6px] border-2 border-dashed border-brandy/40 bg-papaya/40 p-12 text-center shadow-[4px_4px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/40"
		>
			<History size={36} class="mx-auto text-brandy/50 dark:text-papaya/50" />
			<p class="mt-3 font-serif text-lg font-bold text-ink dark:text-papaya">
				Belum Ada Riwayat Pesanan
			</p>
			<p class="mt-1 font-sans text-xs text-brandy/80 dark:text-papaya/70">
				Pesanan yang Anda buat akan otomatis tercatat di sini.
			</p>
			<div class="mt-6">
				<a
					href={resolve('/(public)/order')}
					class="inline-flex items-center gap-2 rounded-[8px_4px_7px_3px] border-2 border-brandy bg-tangerine px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#78290f]"
				>
					<span>Mulai Belanja</span>
					<ArrowRight size={14} />
				</a>
			</div>
		</div>
	{:else}
		<div class="space-y-4">
			{#each entries as entry, idx (entry.orderId)}
				{@const status = serverStatuses[entry.orderId]}
				{@const isInvalid = status && !status.valid}
				{@const isPending = status?.paymentStatus === 'PENDING' && !status?.isExpired}
				{@const isWaiting = status?.paymentStatus === 'WAITING_VERIFICATION'}
				{@const isConfirmed = status?.paymentStatus === 'CONFIRMED'}
				{@const isExpired = status?.paymentStatus === 'EXPIRED' || status?.isExpired}
				{@const isCancelled = status?.paymentStatus === 'CANCELLED'}
				{@const tiltClass = idx % 2 === 0 ? '-rotate-[0.5deg]' : 'rotate-[0.5deg]'}

				<div
					class="group relative rounded-[14px_6px_12px_8px] border-2 border-brandy bg-white p-5 shadow-[4px_4px_0px_#78290f] transition-transform duration-200 transform-gpu backface-hidden hover:rotate-0 hover:shadow-[6px_6px_0px_#78290f] dark:border-papaya/30 dark:bg-ink/90 {tiltClass}"
				>
					<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div class="space-y-1">
							<div class="flex items-center gap-2.5">
								<span class="font-mono text-base font-bold text-ink dark:text-papaya">
									#{entry.orderId}
								</span>

								<!-- Status Badge -->
								{#if isLoadingStatus}
									<span
										class="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[11px] text-neutral-500"
									>
										Memeriksa status...
									</span>
								{:else if isInvalid}
									<span
										class="inline-flex items-center gap-1 rounded bg-crimson/15 px-2 py-0.5 font-mono text-[11px] font-bold text-crimson"
									>
										<AlertTriangle size={12} />
										<span>Tidak Ditemukan di Server</span>
									</span>
								{:else if isConfirmed}
									<span
										class="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
									>
										<CheckCircle2 size={12} />
										<span>Lunas & Terverifikasi</span>
									</span>
								{:else if isWaiting}
									<span
										class="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300"
									>
										<Clock size={12} />
										<span>Menunggu Verifikasi Penjual</span>
									</span>
								{:else if isExpired}
									<span
										class="inline-flex items-center gap-1 rounded bg-neutral-200 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
									>
										<span>Kedaluwarsa</span>
									</span>
								{:else if isCancelled}
									<span
										class="inline-flex items-center gap-1 rounded bg-crimson/15 px-2 py-0.5 font-mono text-[11px] font-bold text-crimson dark:bg-crimson/25 dark:text-red-300"
									>
										<Ban size={12} />
										<span>Pesanan Dibatalkan</span>
									</span>
								{:else if isPending}
									<span
										class="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300"
									>
										<Clock size={12} />
										<span>Menunggu Bukti Transfer</span>
									</span>
								{/if}
							</div>

							<div
								class="flex items-center gap-3 font-mono text-xs text-brandy/70 dark:text-papaya/70"
							>
								<span>{dateLabel(entry.createdAt)}</span>
								<span>•</span>
								<span class="font-bold text-ink dark:text-papaya">
									{formatRupiah(status?.total ?? entry.total)}
								</span>
							</div>

							{#if isInvalid}
								<p class="mt-2 text-xs leading-relaxed text-crimson">
									Pesanan ini tidak ditemukan di database server (mungkin telah dibersihkan atau
									dibatalkan saat masa pengujian). Jika Anda telah melakukan pembayaran, silakan
									hubungi penjual dengan menyebutkan ID pesanan ini.
								</p>
							{/if}
						</div>

						<!-- Action Buttons -->
						<div class="flex items-center gap-2 self-end sm:self-center">
							{#if isPending}
								<a
									href="{resolve('/(public)/order/bayar/[orderId]', {
										orderId: entry.orderId
									})}?token={entry.token}"
									class="inline-flex items-center gap-1.5 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-tangerine px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#78290f] hover:bg-[#e06d00]"
								>
									<span>Lanjut Bayar</span>
									<ArrowRight size={13} />
								</a>
							{:else if isWaiting || isConfirmed || isCancelled}
								<a
									href="{resolve('/invoice/[orderId]', {
										orderId: entry.orderId
									})}?token={entry.token}"
									class="inline-flex items-center gap-1.5 rounded-[8px_3px_7px_2px] border-2 border-brandy bg-papaya px-3.5 py-1.5 font-mono text-xs font-bold text-ink shadow-[2px_2px_0px_#78290f] hover:bg-brandy/10 dark:border-papaya/40 dark:bg-ink dark:text-papaya"
								>
									<span>Lihat Faktur</span>
									<ExternalLink size={13} />
								</a>
							{/if}

							<button
								type="button"
								onclick={() => (itemToDelete = entry.orderId)}
								class="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-crimson/10 hover:text-crimson"
								aria-label="Hapus dari riwayat perangkat"
								title="Hapus dari riwayat perangkat"
							>
								<Trash2 size={15} />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal Konfirmasi Hapus 1 Item -->
<Modal
	open={itemToDelete !== null}
	title="Hapus Pesanan dari Riwayat?"
	message={`Apakah Anda yakin ingin menghapus pesanan #${itemToDelete} dari riwayat perangkat ini? Tautan akses dan bukti transaksi lokal Anda akan dihapus dari peramban ini.`}
	danger={true}
	confirmLabel="Ya, Hapus"
	cancelLabel="Batal"
	onConfirm={confirmDeleteSingle}
	onCancel={() => (itemToDelete = null)}
/>

<!-- Modal Konfirmasi Hapus Semua -->
<Modal
	open={modalOpen}
	title="Kosongkan Riwayat?"
	onCancel={() => (modalOpen = false)}
	hideActions={true}
>
	<div class="space-y-4">
		<p class="text-xs text-neutral-600 dark:text-neutral-300">
			Apakah Anda yakin ingin menghapus seluruh daftar riwayat pesanan dari peramban ini? Tindakan
			ini tidak dapat dibatalkan.
		</p>
		<div class="flex justify-end gap-2 pt-2">
			<button
				type="button"
				onclick={() => (modalOpen = false)}
				class="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
			>
				Batal
			</button>
			<button
				type="button"
				onclick={confirmClearHistory}
				class="rounded-lg bg-crimson px-3 py-1.5 text-xs font-bold text-white hover:bg-crimson/90"
			>
				Ya, Bersihkan
			</button>
		</div>
	</div>
</Modal>
